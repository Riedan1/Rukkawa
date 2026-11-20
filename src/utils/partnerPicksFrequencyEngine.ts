import type {
  ChannelFrequencySettings,
  GlobalSmartFrequencyAndFatigueConfig,
  PartnerPickChannelId,
  PartnerPicksGlobalConfig,
} from "../types";
import { normalizePartnerPicksGlobalConfig } from "./partnerPicksSchema";

/**
 * Tracks a single user's interaction history with Partner Picks placements across channels.
 * Stored per-user/session (never globally penalizing a merchant for other users).
 */
export interface UserPartnerPickPlacementHistory {
  placementId: string;
  productId: string;
  sourceStoreId: string;
  hostStoreId: string;
  channelId: PartnerPickChannelId;
  lastImpressionAtMs: number;
  sessionImpressions: number;
  dailyImpressions: number;
  skipCount: number;
  lastSkipAtMs: number | null;
}

export interface UserPartnerPicksFatigueState {
  visitorHash: string;
  sessionStartedAtMs: number;
  dayBucketKey: string; // e.g. "2026-11-19"
  totalSessionExposuresCrossChannel: number;
  totalDailyExposuresCrossChannel: number;
  channelSessionExposures: Record<PartnerPickChannelId, number>;
  channelDailyExposures: Record<PartnerPickChannelId, number>;
  channelLastAppearanceAtMs: Record<PartnerPickChannelId, number | null>;
  productLastShownAtMs: Record<string, number>;
  partnerStoreLastShownAtMs: Record<string, number>;
  productRecentlyClickedOrViewedAtMs: Record<string, number>;
  placementsHistory: Record<string, UserPartnerPickPlacementHistory>;
}

export interface FrequencyAndFatigueEvaluationResult {
  allowed: boolean;
  suppressionReason:
    | null
    | "CHANNEL_SESSION_CAP_REACHED"
    | "CHANNEL_DAILY_CAP_REACHED"
    | "CHANNEL_MIN_INTERVAL_COOLDOWN"
    | "CROSS_CHANNEL_SESSION_CAP_REACHED"
    | "CROSS_CHANNEL_DAILY_CAP_REACHED"
    | "SAME_PRODUCT_COOLDOWN"
    | "SAME_PARTNER_STORE_COOLDOWN"
    | "RECENTLY_VIEWED_OR_CLICKED_PRODUCT_SUPPRESSED";
  /**
   * User-specific priority multiplier in (0, 1].
   * Starts at 1.0 and decays gradually ONLY for this specific user when they rapidly skip this placement,
   * recovering exponentially according to Platform Admin's `priorityRecoveryHalfLifeMinutes`.
   */
  userSpecificPriorityMultiplier: number;
  /**
   * Confirmed Requirement (Section K.4):
   * When a candidate is suppressed or down-weighted for a specific fatigued user,
   * `penalizeMerchantGlobalFairness` is ALWAYS false and `countAsMerchantMissedOpportunity` is ALWAYS false,
   * so one user's skips or fatigue never penalize the merchant globally for other users.
   */
  penalizeMerchantGlobalFairness: false;
  countAsMerchantMissedOpportunity: false;
}

export function getUtcDayBucketKey(nowMs = Date.now()): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export function createInitialUserPartnerPicksFatigueState(
  visitorHash = "anon_visitor",
  nowMs = Date.now()
): UserPartnerPicksFatigueState {
  return {
    visitorHash,
    sessionStartedAtMs: nowMs,
    dayBucketKey: getUtcDayBucketKey(nowMs),
    totalSessionExposuresCrossChannel: 0,
    totalDailyExposuresCrossChannel: 0,
    channelSessionExposures: {
      STORE_BANNER: 0,
      PRODUCT_GRID: 0,
      DISCOVER_MORE: 0,
      REELS_FEED: 0,
      STORIES: 0,
    },
    channelDailyExposures: {
      STORE_BANNER: 0,
      PRODUCT_GRID: 0,
      DISCOVER_MORE: 0,
      REELS_FEED: 0,
      STORIES: 0,
    },
    channelLastAppearanceAtMs: {
      STORE_BANNER: null,
      PRODUCT_GRID: null,
      DISCOVER_MORE: null,
      REELS_FEED: null,
      STORIES: null,
    },
    productLastShownAtMs: {},
    partnerStoreLastShownAtMs: {},
    productRecentlyClickedOrViewedAtMs: {},
    placementsHistory: {},
  };
}

/**
 * Rolls over daily counters if the UTC day bucket changed.
 */
export function ensureCurrentDayFatigueState(
  state: UserPartnerPicksFatigueState,
  nowMs = Date.now()
): UserPartnerPicksFatigueState {
  const currentDay = getUtcDayBucketKey(nowMs);
  if (state.dayBucketKey === currentDay) {
    return state;
  }

  const nextPlacements: Record<string, UserPartnerPickPlacementHistory> = {};
  for (const [k, v] of Object.entries(state.placementsHistory)) {
    nextPlacements[k] = {
      ...v,
      dailyImpressions: 0,
    };
  }

  return {
    ...state,
    dayBucketKey: currentDay,
    totalDailyExposuresCrossChannel: 0,
    channelDailyExposures: {
      STORE_BANNER: 0,
      PRODUCT_GRID: 0,
      DISCOVER_MORE: 0,
      REELS_FEED: 0,
      STORIES: 0,
    },
    placementsHistory: nextPlacements,
  };
}

/**
 * Computes the gradual user-specific skip priority multiplier for a placement.
 * - Uses Platform Admin's configurable `perSkipPriorityMultiplier` (e.g. 0.7) and `priorityRecoveryHalfLifeMinutes` (e.g. 45).
 * - Never drops to 0 (clamped to a minimum floor of 0.05 so candidates can still recover over time).
 * - Applies exclusively to this specific user's candidate ranking.
 */
export function computeUserSpecificSkipPriorityMultiplier(params: {
  placementHistory?: UserPartnerPickPlacementHistory | null;
  smartFrequencyConfig: GlobalSmartFrequencyAndFatigueConfig;
  nowMs?: number;
}): number {
  const { placementHistory, smartFrequencyConfig, nowMs = Date.now() } = params;
  const decayCfg = smartFrequencyConfig.userSpecificSkipDecay;

  if (
    !smartFrequencyConfig.enabled ||
    !decayCfg.enabled ||
    !placementHistory ||
    placementHistory.skipCount <= 0 ||
    !placementHistory.lastSkipAtMs
  ) {
    return 1.0;
  }

  const baseMultiplier = Math.min(
    1.0,
    Math.max(0.1, decayCfg.perSkipPriorityMultiplier)
  );
  const rawPenaltyFactor = Math.pow(baseMultiplier, placementHistory.skipCount); // e.g., 0.7^1 = 0.7, 0.7^2 = 0.49

  const elapsedMinutes = Math.max(
    0,
    (nowMs - placementHistory.lastSkipAtMs) / 60000
  );
  const halfLifeMinutes = Math.max(1, decayCfg.priorityRecoveryHalfLifeMinutes);

  // Exponential half-life recovery of the penalty deficit (1 - rawPenaltyFactor) toward 1.0
  const deficit = 1.0 - rawPenaltyFactor;
  const remainingDeficit = deficit * Math.pow(0.5, elapsedMinutes / halfLifeMinutes);
  const recoveredMultiplier = 1.0 - remainingDeficit;

  return Number(Math.min(1.0, Math.max(0.05, recoveredMultiplier)).toFixed(4));
}

/**
 * Evaluates whether a specific Partner Pick candidate passes Platform Admin's configurable
 * Per-Channel Frequency Caps and Cross-Channel Repetition/Fatigue Guards for the current user,
 * and returns its user-specific priority multiplier.
 */
export function evaluateCandidateFrequencyAndFatigue(params: {
  globalConfig?: Partial<PartnerPicksGlobalConfig> | null;
  userFatigueState?: UserPartnerPicksFatigueState | null;
  channelId: PartnerPickChannelId;
  placementId: string;
  productId: string;
  sourceStoreId: string;
  hostStoreId: string;
  /**
   * When true, skips the same-partner-store and channel-min-interval cooldown checks
   * so multiple approved slots within the same synchronous render frame (e.g. 2 grid cards on the same storefront render)
   * can render together while still enforcing product cooldowns and session/daily caps.
   */
  isSameRenderBatch?: boolean;
  nowMs?: number;
}): FrequencyAndFatigueEvaluationResult {
  const {
    channelId,
    placementId,
    productId,
    sourceStoreId,
    isSameRenderBatch = false,
    nowMs = Date.now(),
  } = params;

  const config = normalizePartnerPicksGlobalConfig(params.globalConfig);
  const channelFreq: ChannelFrequencySettings =
    config.channels[channelId].frequencyLimits;
  const smartFreq: GlobalSmartFrequencyAndFatigueConfig = config.smartFrequency;

  const state = ensureCurrentDayFatigueState(
    params.userFatigueState || createInitialUserPartnerPicksFatigueState("anon", nowMs),
    nowMs
  );

  const placementHist = state.placementsHistory[placementId] || null;
  const userSpecificPriorityMultiplier = computeUserSpecificSkipPriorityMultiplier({
    placementHistory: placementHist,
    smartFrequencyConfig: smartFreq,
    nowMs,
  });

  // 1. Per-Channel Frequency Caps (Platform Admin configurable)
  if (channelFreq.enabled) {
    if (
      channelFreq.maxAppearancesPerSession > 0 &&
      state.channelSessionExposures[channelId] >=
        channelFreq.maxAppearancesPerSession
    ) {
      return {
        allowed: false,
        suppressionReason: "CHANNEL_SESSION_CAP_REACHED",
        userSpecificPriorityMultiplier,
        penalizeMerchantGlobalFairness: false,
        countAsMerchantMissedOpportunity: false,
      };
    }

    if (
      channelFreq.maxAppearancesPerDayPerUser > 0 &&
      state.channelDailyExposures[channelId] >=
        channelFreq.maxAppearancesPerDayPerUser
    ) {
      return {
        allowed: false,
        suppressionReason: "CHANNEL_DAILY_CAP_REACHED",
        userSpecificPriorityMultiplier,
        penalizeMerchantGlobalFairness: false,
        countAsMerchantMissedOpportunity: false,
      };
    }

    const lastChannelAt = state.channelLastAppearanceAtMs[channelId];
    if (
      !isSameRenderBatch &&
      channelFreq.minSecondsBetweenAppearances > 0 &&
      typeof lastChannelAt === "number"
    ) {
      const elapsedSec = (nowMs - lastChannelAt) / 1000;
      if (elapsedSec < channelFreq.minSecondsBetweenAppearances) {
        return {
          allowed: false,
          suppressionReason: "CHANNEL_MIN_INTERVAL_COOLDOWN",
          userSpecificPriorityMultiplier,
          penalizeMerchantGlobalFairness: false,
          countAsMerchantMissedOpportunity: false,
        };
      }
    }
  }

  // 2. Global Smart Frequency & Cross-Channel Repetition Guard (Platform Admin configurable)
  if (smartFreq.enabled) {
    if (
      smartFreq.maxCrossChannelExposuresPerSession > 0 &&
      state.totalSessionExposuresCrossChannel >=
        smartFreq.maxCrossChannelExposuresPerSession
    ) {
      return {
        allowed: false,
        suppressionReason: "CROSS_CHANNEL_SESSION_CAP_REACHED",
        userSpecificPriorityMultiplier,
        penalizeMerchantGlobalFairness: false,
        countAsMerchantMissedOpportunity: false,
      };
    }

    if (
      smartFreq.maxCrossChannelExposuresPerDayPerUser > 0 &&
      state.totalDailyExposuresCrossChannel >=
        smartFreq.maxCrossChannelExposuresPerDayPerUser
    ) {
      return {
        allowed: false,
        suppressionReason: "CROSS_CHANNEL_DAILY_CAP_REACHED",
        userSpecificPriorityMultiplier,
        penalizeMerchantGlobalFairness: false,
        countAsMerchantMissedOpportunity: false,
      };
    }

    // Recently viewed or clicked original product suppression
    const lastClickedOrViewedAt =
      state.productRecentlyClickedOrViewedAtMs[productId];
    if (
      smartFreq.recentlyViewedProductSuppressionSeconds > 0 &&
      typeof lastClickedOrViewedAt === "number"
    ) {
      const elapsedSec = (nowMs - lastClickedOrViewedAt) / 1000;
      if (elapsedSec < smartFreq.recentlyViewedProductSuppressionSeconds) {
        return {
          allowed: false,
          suppressionReason: "RECENTLY_VIEWED_OR_CLICKED_PRODUCT_SUPPRESSED",
          userSpecificPriorityMultiplier,
          penalizeMerchantGlobalFairness: false,
          countAsMerchantMissedOpportunity: false,
        };
      }
    }

    // Same product cross-channel cooldown
    const lastProdShownAt = state.productLastShownAtMs[productId];
    if (
      smartFreq.sameProductCooldownSeconds > 0 &&
      typeof lastProdShownAt === "number"
    ) {
      const elapsedSec = (nowMs - lastProdShownAt) / 1000;
      if (elapsedSec < smartFreq.sameProductCooldownSeconds) {
        return {
          allowed: false,
          suppressionReason: "SAME_PRODUCT_COOLDOWN",
          userSpecificPriorityMultiplier,
          penalizeMerchantGlobalFairness: false,
          countAsMerchantMissedOpportunity: false,
        };
      }
    }

    // Same partner store cooldown (skipped when rendering multiple approved slots within the same host render frame)
    const lastPartnerShownAt = state.partnerStoreLastShownAtMs[sourceStoreId];
    if (
      !isSameRenderBatch &&
      smartFreq.samePartnerStoreCooldownSeconds > 0 &&
      typeof lastPartnerShownAt === "number"
    ) {
      const elapsedSec = (nowMs - lastPartnerShownAt) / 1000;
      if (elapsedSec < smartFreq.samePartnerStoreCooldownSeconds) {
        return {
          allowed: false,
          suppressionReason: "SAME_PARTNER_STORE_COOLDOWN",
          userSpecificPriorityMultiplier,
          penalizeMerchantGlobalFairness: false,
          countAsMerchantMissedOpportunity: false,
        };
      }
    }
  }

  return {
    allowed: true,
    suppressionReason: null,
    userSpecificPriorityMultiplier,
    penalizeMerchantGlobalFairness: false,
    countAsMerchantMissedOpportunity: false,
  };
}

/**
 * Records an impression for a specific user's fatigue state (pure immutable state reducer).
 */
export function recordUserPartnerPickImpression(params: {
  state?: UserPartnerPicksFatigueState | null;
  channelId: PartnerPickChannelId;
  placementId: string;
  productId: string;
  sourceStoreId: string;
  hostStoreId: string;
  nowMs?: number;
}): UserPartnerPicksFatigueState {
  const {
    channelId,
    placementId,
    productId,
    sourceStoreId,
    hostStoreId,
    nowMs = Date.now(),
  } = params;

  const base = ensureCurrentDayFatigueState(
    params.state || createInitialUserPartnerPicksFatigueState("anon", nowMs),
    nowMs
  );

  const prevHist = base.placementsHistory[placementId];
  const nextHist: UserPartnerPickPlacementHistory = {
    placementId,
    productId,
    sourceStoreId,
    hostStoreId,
    channelId,
    lastImpressionAtMs: nowMs,
    sessionImpressions: (prevHist?.sessionImpressions || 0) + 1,
    dailyImpressions: (prevHist?.dailyImpressions || 0) + 1,
    skipCount: prevHist?.skipCount || 0,
    lastSkipAtMs: prevHist?.lastSkipAtMs ?? null,
  };

  return {
    ...base,
    totalSessionExposuresCrossChannel: base.totalSessionExposuresCrossChannel + 1,
    totalDailyExposuresCrossChannel: base.totalDailyExposuresCrossChannel + 1,
    channelSessionExposures: {
      ...base.channelSessionExposures,
      [channelId]: (base.channelSessionExposures[channelId] || 0) + 1,
    },
    channelDailyExposures: {
      ...base.channelDailyExposures,
      [channelId]: (base.channelDailyExposures[channelId] || 0) + 1,
    },
    channelLastAppearanceAtMs: {
      ...base.channelLastAppearanceAtMs,
      [channelId]: nowMs,
    },
    productLastShownAtMs: {
      ...base.productLastShownAtMs,
      [productId]: nowMs,
    },
    partnerStoreLastShownAtMs: {
      ...base.partnerStoreLastShownAtMs,
      [sourceStoreId]: nowMs,
    },
    placementsHistory: {
      ...base.placementsHistory,
      [placementId]: nextHist,
    },
  };
}

/**
 * Records a user skip on a sequential media Partner Pick (Reels Feed or Stories).
 * Only counts as a rapid fatigue skip if `exposureDurationMs <= rapidSkipThresholdMs` (or if exposureDurationMs is omitted).
 * Applies priority decay ONLY to this user's state — never to global merchant fairness ledgers.
 */
export function recordUserPartnerPickSkip(params: {
  state?: UserPartnerPicksFatigueState | null;
  globalConfig?: Partial<PartnerPicksGlobalConfig> | null;
  channelId: PartnerPickChannelId;
  placementId: string;
  productId: string;
  sourceStoreId: string;
  hostStoreId: string;
  exposureDurationMs?: number;
  nowMs?: number;
}): {
  nextState: UserPartnerPicksFatigueState;
  countedAsRapidSkip: boolean;
  newPriorityMultiplier: number;
} {
  const {
    channelId,
    placementId,
    productId,
    sourceStoreId,
    hostStoreId,
    exposureDurationMs,
    nowMs = Date.now(),
  } = params;

  const config = normalizePartnerPicksGlobalConfig(params.globalConfig);
  const decayCfg = config.smartFrequency.userSpecificSkipDecay;

  const base = ensureCurrentDayFatigueState(
    params.state || createInitialUserPartnerPicksFatigueState("anon", nowMs),
    nowMs
  );

  const isRapidSkip =
    typeof exposureDurationMs !== "number" ||
    exposureDurationMs <= decayCfg.rapidSkipThresholdMs;

  const prevHist = base.placementsHistory[placementId];
  const nextSkipCount = isRapidSkip
    ? (prevHist?.skipCount || 0) + 1
    : prevHist?.skipCount || 0;

  const nextHist: UserPartnerPickPlacementHistory = {
    placementId,
    productId,
    sourceStoreId,
    hostStoreId,
    channelId,
    lastImpressionAtMs: prevHist?.lastImpressionAtMs || nowMs,
    sessionImpressions: prevHist?.sessionImpressions || 1,
    dailyImpressions: prevHist?.dailyImpressions || 1,
    skipCount: nextSkipCount,
    lastSkipAtMs: isRapidSkip ? nowMs : prevHist?.lastSkipAtMs ?? null,
  };

  const nextState: UserPartnerPicksFatigueState = {
    ...base,
    placementsHistory: {
      ...base.placementsHistory,
      [placementId]: nextHist,
    },
  };

  const newPriorityMultiplier = computeUserSpecificSkipPriorityMultiplier({
    placementHistory: nextHist,
    smartFrequencyConfig: config.smartFrequency,
    nowMs,
  });

  return {
    nextState,
    countedAsRapidSkip: isRapidSkip,
    newPriorityMultiplier,
  };
}

/**
 * Records that the user clicked/opened a Partner Pick product landing page,
 * activating `recentlyViewedProductSuppressionSeconds` so the same product doesn't immediately chase the user across channels.
 */
export function recordUserPartnerPickProductClickOrView(params: {
  state?: UserPartnerPicksFatigueState | null;
  productId: string;
  nowMs?: number;
}): UserPartnerPicksFatigueState {
  const { productId, nowMs = Date.now() } = params;
  const base = ensureCurrentDayFatigueState(
    params.state || createInitialUserPartnerPicksFatigueState("anon", nowMs),
    nowMs
  );

  return {
    ...base,
    productRecentlyClickedOrViewedAtMs: {
      ...base.productRecentlyClickedOrViewedAtMs,
      [productId]: nowMs,
    },
  };
}

/**
 * Computes sequential media insertion indices for Reels Feed or Stories based purely on
 * Platform Admin's configurable `minNativeItemsBeforeFirstInsert` and `insertionCadenceNativeItems`.
 * Never interrupts index 0 when native items exist (`minNativeItemsBeforeFirstInsert >= 1`).
 */
export function resolveSequentialInsertionIndices(params: {
  nativeItemsCount: number;
  eligiblePartnerItemsCount: number;
  channelConfig: PartnerPicksGlobalConfig["channels"]["REELS_FEED"];
}): number[] {
  const { nativeItemsCount, eligiblePartnerItemsCount, channelConfig } = params;
  if (!channelConfig.enabled || eligiblePartnerItemsCount <= 0) return [];

  const maxAllowed = Math.min(
    eligiblePartnerItemsCount,
    Math.max(0, channelConfig.maxDisplayedProducts)
  );
  if (maxAllowed <= 0) return [];

  const freq = channelConfig.frequencyLimits;
  const minNativeBeforeFirst = Math.max(
    1,
    freq.minNativeItemsBeforeFirstInsert ?? 2
  );
  const cadence = Math.max(1, freq.insertionCadenceNativeItems ?? 4);
  const allowMid =
    channelConfig.sequentialMediaRules?.allowMidSequenceInsertion !== false;
  const allowTail =
    channelConfig.sequentialMediaRules?.allowSequenceTailInsertion !== false;

  // Special case: when nativeItemsCount === 0 (e.g. Stories runtime sequence when host has Stories enabled
  // and 0 currently published native stories, navigated to inside multi-store Story viewer)
  if (nativeItemsCount === 0) {
    return allowTail ? [0] : [];
  }

  const indices: number[] = [];
  let cursor = minNativeBeforeFirst;

  while (indices.length < maxAllowed) {
    if (cursor < nativeItemsCount) {
      if (allowMid) {
        indices.push(cursor);
      }
      cursor += cadence;
    } else {
      if (allowTail && cursor === nativeItemsCount) {
        indices.push(nativeItemsCount);
      }
      break;
    }
  }

  // If native sequence was shorter than minNativeBeforeFirst and tail insertion is allowed, place 1 at tail
  if (indices.length === 0 && allowTail && nativeItemsCount > 0) {
    indices.push(nativeItemsCount);
  }

  return indices.slice(0, maxAllowed);
}
