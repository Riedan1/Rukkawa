import type {
  MerchantPartnerPicksProfile,
  MerchantStore,
  PartnerPickChannelExposureCounters,
  PartnerPickChannelId,
  PartnerPickDirectionalExposureSummary,
  PartnerPickProductPlacement,
  PartnerPicksBidirectionalExposureLedger,
  PartnerPicksChannelAnalyticsEvent,
  PartnerPicksGlobalConfig,
  PartnerPicksPartnership,
} from "../types";
import type { StoriesEnabledMap } from "./storiesLogic";
import {
  PARTNER_PICK_CHANNEL_IDS,
  createInitialBidirectionalExposureLedger,
  normalizePartnerPicksGlobalConfig,
} from "./partnerPicksSchema";
import { evaluateBilateralPlacementEligibility } from "./partnerPicksEligibility";
import {
  evaluateCandidateFrequencyAndFatigue,
  type UserPartnerPicksFatigueState,
} from "./partnerPicksFrequencyEngine";

/**
 * Represents the active host-store partner rotation context for a single host-store browsing session/epoch.
 *
 * Confirmed Requirement (Section G.1):
 * A user must NEVER see more than `maxSimultaneousPartnerStores` (confirmed default: 2) distinct partner stores
 * simultaneously within one active host-store browsing context across ALL FIVE CHANNELS
 * (`STORE_BANNER`, `PRODUCT_GRID`, `DISCOVER_MORE`, `REELS_FEED`, and `STORIES`).
 */
export interface ActiveHostPartnerRotationContext {
  hostStoreId: string;
  rotationEpoch: number;
  rotationMode: "REFRESH_BASED" | "TIMED_ROTATION";
  selectedPartnerStoreIds: string[]; // Strictly capped at <= maxSimultaneousPartnerStores (default 2)
  selectedPartnershipIds: string[];
  createdAtMs: number;
  expiresAtMs: number | null;
}

export interface PartnerCandidateFairnessScore {
  partnershipId: string;
  partnerStoreId: string;
  hostStoreId: string;
  /** How much exposure Partner has generated for Host (`Host -> Partner` direction) */
  reciprocalWeightedScoreGeneratedByPartnerForHost: number;
  /** How much exposure Host has already generated for Partner (`Partner -> Host` direction) */
  weightedScoreAlreadyGeneratedByHostForPartner: number;
  /** Partner's reciprocal opportunity fill rate % on Partner's storefront for Host's products */
  partnerReciprocalOpportunityFillRatePercent: number;
  /** Bilateral deficit ratio: boosts partners who gave Host high exposure / fill rate relative to what Host gave them */
  bilateralReciprocityRatio: number;
  /** Multi-partner dilution boost: prevents Host's other 4 partners from starving Partner A when Partner A dedicates 100% of its slots to Host */
  multiPartnerDilutionProtectionMultiplier: number;
  /** Deterministic jitter/rotation offset for epoch rotation so Refresh 1, 2, 3, 4 cycle smoothly across eligible pairs */
  epochRotationBonus: number;
  /** Final composite selection score */
  finalSelectionScore: number;
}

/**
 * Updates a directional exposure summary with an analytics event (opportunity, impression, click, skip).
 * Enforces Zero Global Merchant Penalty: skips or user-specific fatigue suppressions never reduce opportunities or fairness scores.
 */
export function applyAnalyticsEventToDirectionalSummary(params: {
  summary: PartnerPickDirectionalExposureSummary;
  event: PartnerPicksChannelAnalyticsEvent;
  globalConfig?: Partial<PartnerPicksGlobalConfig> | null;
  isUniqueVisitorForDirection?: boolean;
}): PartnerPickDirectionalExposureSummary {
  const {
    summary,
    event,
    isUniqueVisitorForDirection = false,
  } = params;
  const config = normalizePartnerPicksGlobalConfig(params.globalConfig);
  const channelId = event.channelId;
  const weight = config.channels[channelId]?.fairnessChannelWeight ?? 1.0;

  const prevCh: PartnerPickChannelExposureCounters = summary.byChannel[
    channelId
  ] || {
    opportunities: 0,
    impressions: 0,
    uniqueReach: 0,
    clicks: 0,
    skips: 0,
    weightedScore: 0,
    activeExposureDurationSeconds: 0,
  };

  const nextCh: PartnerPickChannelExposureCounters = { ...prevCh };

  if (event.eventType === "opportunity") {
    nextCh.opportunities += 1;
  } else if (event.eventType === "impression") {
    nextCh.impressions += 1;
    if (nextCh.opportunities < nextCh.impressions) {
      nextCh.opportunities = nextCh.impressions;
    }
    if (isUniqueVisitorForDirection) {
      nextCh.uniqueReach += 1;
    }
    nextCh.weightedScore = Number(
      (nextCh.weightedScore + weight).toFixed(4)
    );
    if (
      typeof event.exposureDurationMs === "number" &&
      event.exposureDurationMs > 0
    ) {
      nextCh.activeExposureDurationSeconds = Number(
        (
          nextCh.activeExposureDurationSeconds +
          event.exposureDurationMs / 1000
        ).toFixed(2)
      );
    }
  } else if (
    event.eventType === "click" ||
    event.eventType === "original_product_open"
  ) {
    nextCh.clicks += 1;
  } else if (event.eventType === "skip") {
    // Recorded transparently for merchant analytics, but NEVER subtracts from weightedScore or opportunityFillRatePercent
    nextCh.skips += 1;
  }

  const nextByChannel = {
    ...summary.byChannel,
    [channelId]: nextCh,
  };

  let totalOpportunities = 0;
  let totalImpressions = 0;
  let totalUniqueReach = 0;
  let totalClicks = 0;
  let totalSkips = 0;
  let totalWeightedScore = 0;

  for (const ch of PARTNER_PICK_CHANNEL_IDS) {
    const c = nextByChannel[ch];
    if (!c) continue;
    totalOpportunities += c.opportunities;
    totalImpressions += c.impressions;
    totalUniqueReach += c.uniqueReach;
    totalClicks += c.clicks;
    totalSkips += c.skips;
    totalWeightedScore += c.weightedScore;
  }

  const opportunityFillRatePercent =
    totalOpportunities > 0
      ? Number(
          Math.min(
            100,
            (totalImpressions / totalOpportunities) * 100
          ).toFixed(2)
        )
      : 0;

  return {
    ...summary,
    byChannel: nextByChannel,
    totalOpportunities,
    totalImpressions,
    totalUniqueReach,
    totalClicks,
    totalSkips,
    totalWeightedScore: Number(totalWeightedScore.toFixed(4)),
    opportunityFillRatePercent,
  };
}

/**
 * Updates the bidirectional exposure ledger (`directionAOnB` and `directionBOnA`) for a partnership.
 */
export function recordEventInBidirectionalExposureLedger(params: {
  ledger?: PartnerPicksBidirectionalExposureLedger | null;
  partnership: PartnerPicksPartnership;
  event: PartnerPicksChannelAnalyticsEvent;
  globalConfig?: Partial<PartnerPicksGlobalConfig> | null;
  isUniqueVisitorForDirection?: boolean;
  nowIso?: string;
}): PartnerPicksBidirectionalExposureLedger {
  const {
    partnership,
    event,
    globalConfig,
    isUniqueVisitorForDirection = false,
    nowIso = new Date().toISOString(),
  } = params;

  const baseLedger =
    params.ledger ||
    createInitialBidirectionalExposureLedger(
      partnership.id,
      partnership.storeAId,
      partnership.storeBId,
      nowIso
    );

  // Determine direction:
  // directionAOnB = Store A's products (`sourceStoreId === storeAId`) displayed on Store B (`hostStoreId === storeBId`)
  // directionBOnA = Store B's products (`sourceStoreId === storeBId`) displayed on Store A (`hostStoreId === storeAId`)
  if (
    event.sourceStoreId === baseLedger.storeAId &&
    event.hostStoreId === baseLedger.storeBId
  ) {
    return {
      ...baseLedger,
      directionAOnB: applyAnalyticsEventToDirectionalSummary({
        summary: baseLedger.directionAOnB,
        event,
        globalConfig,
        isUniqueVisitorForDirection,
      }),
      updatedAt: nowIso,
    };
  }

  if (
    event.sourceStoreId === baseLedger.storeBId &&
    event.hostStoreId === baseLedger.storeAId
  ) {
    return {
      ...baseLedger,
      directionBOnA: applyAnalyticsEventToDirectionalSummary({
        summary: baseLedger.directionBOnA,
        event,
        globalConfig,
        isUniqueVisitorForDirection,
      }),
      updatedAt: nowIso,
    };
  }

  return baseLedger;
}

/**
 * Computes the Pairwise Reciprocal Fairness Score for each candidate partner store on `hostStoreId`.
 *
 * Confirmed Requirement (Section J):
 * - Evaluates both reciprocal directions independently (`Partner -> Host` and `Host -> Partner`).
 * - Multi-Partner Dilution Protection: If Partner A has only 1 active partner (Host B) while Host B has 5 partners (A, C, D, E, F),
 *   and Partner A provides high opportunity fill rate for Host B's products ($F_{B \text{ on } A}$),
 *   Partner A receives a proportional reciprocity boost so Host B's other 4 partners do not starve Partner A.
 * - Deterministic Epoch Rotation: Across `rotationEpoch = 0, 1, 2, 3...`, rotates through eligible partner pairs smoothly
 *   so users naturally discover all eligible partners over successive refreshes while respecting fairness weights.
 */
export function computePairwisePartnerFairnessScores(params: {
  hostStoreId: string;
  eligiblePartnershipsForHost: PartnerPicksPartnership[];
  allActivePartnerships: PartnerPicksPartnership[];
  exposureLedgersByPartnershipId: Record<
    string,
    PartnerPicksBidirectionalExposureLedger
  >;
  rotationEpoch: number;
}): PartnerCandidateFairnessScore[] {
  const {
    hostStoreId,
    eligiblePartnershipsForHost,
    allActivePartnerships,
    exposureLedgersByPartnershipId,
    rotationEpoch,
  } = params;

  const totalCandidates = eligiblePartnershipsForHost.length;
  if (totalCandidates === 0) return [];

  // Stable sort partnerships by id for deterministic epoch rotation
  const sortedPartnerships = [...eligiblePartnershipsForHost].sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  return sortedPartnerships.map((partnership, index) => {
    const partnerStoreId =
      partnership.storeAId === hostStoreId
        ? partnership.storeBId
        : partnership.storeAId;

    const ledger =
      exposureLedgersByPartnershipId[partnership.id] ||
      createInitialBidirectionalExposureLedger(
        partnership.id,
        partnership.storeAId,
        partnership.storeBId
      );

    // Direction where Partner is Source and Host is Host (`Partner -> Host`)
    const summaryPartnerOnHost =
      partnership.storeAId === partnerStoreId
        ? ledger.directionAOnB
        : ledger.directionBOnA;

    // Reciprocal direction where Host is Source and Partner is Host (`Host -> Partner`)
    const summaryHostOnPartner =
      partnership.storeAId === hostStoreId
        ? ledger.directionAOnB
        : ledger.directionBOnA;

    const reciprocalGivenByPartner =
      summaryHostOnPartner.totalWeightedScore || 0;
    const alreadyReceivedByPartner =
      summaryPartnerOnHost.totalWeightedScore || 0;
    const partnerFillRate =
      summaryHostOnPartner.opportunityFillRatePercent || 0;

    // 1. Bilateral Reciprocity Ratio: W_(Host on Partner) / W_(Partner on Host)
    // Uses Laplace smoothing (+5.0) so new partnerships start balanced at 1.0
    const bilateralReciprocityRatio = Number(
      (
        (reciprocalGivenByPartner + 5.0) /
        (alreadyReceivedByPartner + 5.0)
      ).toFixed(4)
    );

    // 2. Multi-Partner Dilution Protection:
    // Count how many active partners `partnerStoreId` has vs `hostStoreId`.
    // If Partner A focuses exclusively on Host B (e.g. 1 partner) and delivers a high fill rate for Host B,
    // boost Partner A's priority on Host B.
    const partnerActivePartnerCount = Math.max(
      1,
      allActivePartnerships.filter(
        (p) =>
          p.status === "ACTIVE" &&
          !p.suspendedByAdminId &&
          (p.storeAId === partnerStoreId || p.storeBId === partnerStoreId)
      ).length
    );

    const fillRateNormalized =
      summaryHostOnPartner.totalOpportunities > 0
        ? partnerFillRate / 100
        : 0.75; // Neutral baseline before first opportunity

    const exclusivityFactor = 1 + (1 / partnerActivePartnerCount) * 0.5;
    const multiPartnerDilutionProtectionMultiplier = Number(
      (1 + fillRateNormalized * 0.45 * exclusivityFactor).toFixed(4)
    );

    // 3. Deterministic Epoch Rotation wave so each refresh epoch cycles cleanly across eligible partners
    // While fairness ratio can promote an under-served reciprocal partner, the epoch wave guarantees
    // no eligible partner is permanently starved across Refresh 1, 2, 3, 4.
    const shiftedIndex =
      ((index - (rotationEpoch % totalCandidates)) + totalCandidates) %
      totalCandidates;
    // Primary pair for this epoch gets a rotation wave bonus
    const epochRotationBonus =
      shiftedIndex === 0 ? 1.5 : shiftedIndex === 1 ? 1.15 : 1.0 / (1 + shiftedIndex * 0.35);

    const finalSelectionScore = Number(
      (
        bilateralReciprocityRatio *
        multiPartnerDilutionProtectionMultiplier *
        epochRotationBonus
      ).toFixed(4)
    );

    return {
      partnershipId: partnership.id,
      partnerStoreId,
      hostStoreId,
      reciprocalWeightedScoreGeneratedByPartnerForHost: reciprocalGivenByPartner,
      weightedScoreAlreadyGeneratedByHostForPartner: alreadyReceivedByPartner,
      partnerReciprocalOpportunityFillRatePercent: partnerFillRate,
      bilateralReciprocityRatio,
      multiPartnerDilutionProtectionMultiplier,
      epochRotationBonus: Number(epochRotationBonus.toFixed(4)),
      finalSelectionScore,
    };
  });
}

/**
 * Resolves the Context-Scoped Active Host Partner Rotation Context for a given host store and rotation epoch.
 *
 * Confirmed Invariants (Section G.1):
 * 1. Selects at most `maxSimultaneousPartnerStores` (confirmed default: 2) distinct partner stores.
 * 2. All 5 placement channels (`STORE_BANNER`, `PRODUCT_GRID`, `DISCOVER_MORE`, `REELS_FEED`, `STORIES`)
 *    within this host-store browsing context MUST draw exclusively from `context.selectedPartnerStoreIds`.
 * 3. Opening Reels or Stories while browsing Host Store B NEVER introduces a 3rd partner store into that active context.
 * 4. Timed Rotation is disabled by default (`timedRotationEnabled === false`).
 */
export function resolveActiveHostPartnerRotationContext(params: {
  globalConfig?: Partial<PartnerPicksGlobalConfig> | null;
  hostStore: MerchantStore;
  allStoresById: Record<string, MerchantStore>;
  profilesByStoreId: Record<string, Partial<MerchantPartnerPicksProfile>>;
  allPartnerships: PartnerPicksPartnership[];
  allPlacements: PartnerPickProductPlacement[];
  exposureLedgersByPartnershipId?: Record<
    string,
    PartnerPicksBidirectionalExposureLedger
  >;
  storiesEnabledMap?: StoriesEnabledMap | null;
  rotationEpoch?: number;
  nowMs?: number;
}): {
  context: ActiveHostPartnerRotationContext;
  fairnessScores: PartnerCandidateFairnessScore[];
} {
  const {
    hostStore,
    allStoresById,
    profilesByStoreId,
    allPartnerships,
    allPlacements,
    exposureLedgersByPartnershipId = {},
    storiesEnabledMap,
    rotationEpoch = 0,
    nowMs = Date.now(),
  } = params;

  const config = normalizePartnerPicksGlobalConfig(params.globalConfig);
  const maxSimultaneous = Math.max(
    1,
    config.maxSimultaneousPartnerStores || 2
  );

  const rotationMode: "REFRESH_BASED" | "TIMED_ROTATION" =
    config.timedRotationEnabled && config.defaultRotationMode === "TIMED_ROTATION"
      ? "TIMED_ROTATION"
      : "REFRESH_BASED";

  const expiresAtMs =
    config.timedRotationEnabled && config.timedRotationIntervalSeconds > 0
      ? nowMs + config.timedRotationIntervalSeconds * 1000
      : null;

  if (!config.featureEnabled || !hostStore?.id) {
    return {
      context: {
        hostStoreId: hostStore?.id || "",
        rotationEpoch,
        rotationMode,
        selectedPartnerStoreIds: [],
        selectedPartnershipIds: [],
        createdAtMs: nowMs,
        expiresAtMs,
      },
      fairnessScores: [],
    };
  }

  // Find all partnerships involving `hostStore.id` that have at least one eligible APPROVED_LIVE (GREEN) placement
  // on at least one enabled channel
  const candidatePartnerships: PartnerPicksPartnership[] = [];

  for (const partnership of allPartnerships) {
    if (!partnership || partnership.status !== "ACTIVE" || partnership.suspendedByAdminId) {
      continue;
    }
    if (
      partnership.storeAId !== hostStore.id &&
      partnership.storeBId !== hostStore.id
    ) {
      continue;
    }

    const partnerStoreId =
      partnership.storeAId === hostStore.id
        ? partnership.storeBId
        : partnership.storeAId;
    const sourceStore = allStoresById[partnerStoreId];
    if (!sourceStore) continue;

    // Check if this partner has at least 1 placement passing all 6 bilateral eligibility gates on any channel
    const partnerPlacementsOnHost = allPlacements.filter(
      (pl) =>
        pl &&
        pl.partnershipId === partnership.id &&
        pl.sourceStoreId === partnerStoreId &&
        pl.hostStoreId === hostStore.id &&
        pl.lifecycleState === "APPROVED_LIVE" &&
        pl.trafficLight === "GREEN"
    );

    const hasAtLeastOneEligiblePlacement = partnerPlacementsOnHost.some((pl) => {
      const evalRes = evaluateBilateralPlacementEligibility({
        globalConfig: config,
        channelId: pl.channelId,
        sourceStore,
        hostStore,
        sourceProfile: profilesByStoreId[partnerStoreId],
        hostProfile: profilesByStoreId[hostStore.id],
        partnership,
        allPartnerships,
        placement: pl,
        storiesEnabledMap,
        nowMs,
      });
      return evalRes.eligible;
    });

    if (hasAtLeastOneEligiblePlacement) {
      candidatePartnerships.push(partnership);
    }
  }

  const fairnessScores = computePairwisePartnerFairnessScores({
    hostStoreId: hostStore.id,
    eligiblePartnershipsForHost: candidatePartnerships,
    allActivePartnerships: allPartnerships,
    exposureLedgersByPartnershipId,
    rotationEpoch,
  });

  // Sort descending by finalSelectionScore (tie-break by partnerStoreId)
  const ranked = [...fairnessScores].sort((a, b) => {
    if (b.finalSelectionScore !== a.finalSelectionScore) {
      return b.finalSelectionScore - a.finalSelectionScore;
    }
    return a.partnerStoreId.localeCompare(b.partnerStoreId);
  });

  const selectedPartnerStoreIds: string[] = [];
  const selectedPartnershipIds: string[] = [];

  for (const item of ranked) {
    if (selectedPartnerStoreIds.length >= maxSimultaneous) break;
    if (!selectedPartnerStoreIds.includes(item.partnerStoreId)) {
      selectedPartnerStoreIds.push(item.partnerStoreId);
      selectedPartnershipIds.push(item.partnershipId);
    }
  }

  return {
    context: {
      hostStoreId: hostStore.id,
      rotationEpoch,
      rotationMode,
      selectedPartnerStoreIds,
      selectedPartnershipIds,
      createdAtMs: nowMs,
      expiresAtMs,
    },
    fairnessScores: ranked,
  };
}

export interface ResolvedChannelPartnerPickSlot {
  placement: PartnerPickProductPlacement;
  partnership: PartnerPicksPartnership;
  sourceStore: MerchantStore;
  hostStore: MerchantStore;
  liveProduct: MerchantStore["products"][number];
  channelId: PartnerPickChannelId;
  userPriorityMultiplier: number;
  combinedRankingScore: number;
}

/**
 * Resolves the approved, eligible Partner Pick placements for a specific `channelId` within an active
 * `ActiveHostPartnerRotationContext`.
 *
 * Strictly enforces:
 * 1. Only partner stores inside `activeContext.selectedPartnerStoreIds` (at most 2 partner stores across all 5 channels) can appear.
 * 2. Every placement must pass all 6 bilateral eligibility gates (`evaluateBilateralPlacementEligibility`).
 * 3. Every placement must pass per-channel frequency caps and cross-channel user fatigue guards (`evaluateCandidateFrequencyAndFatigue`).
 * 4. Never exceeds `globalConfig.channels[channelId].maxDisplayedProducts`.
 * 5. Graceful fallback: returns `[]` on any disabled flag or missing data without throwing.
 */
export function resolveChannelPartnerPicksForHostContext(params: {
  globalConfig?: Partial<PartnerPicksGlobalConfig> | null;
  activeContext: ActiveHostPartnerRotationContext;
  channelId: PartnerPickChannelId;
  hostStore?: MerchantStore | null;
  allStoresById: Record<string, MerchantStore>;
  profilesByStoreId: Record<string, Partial<MerchantPartnerPicksProfile>>;
  allPartnerships: PartnerPicksPartnership[];
  allPlacements: PartnerPickProductPlacement[];
  fairnessScores?: PartnerCandidateFairnessScore[];
  userFatigueState?: UserPartnerPicksFatigueState | null;
  storiesEnabledMap?: StoriesEnabledMap | null;
  currentProductGridPage?: number;
  nowMs?: number;
}): ResolvedChannelPartnerPickSlot[] {
  try {
    const {
      activeContext,
      channelId,
      hostStore,
      allStoresById,
      profilesByStoreId,
      allPartnerships,
      allPlacements,
      fairnessScores = [],
      userFatigueState,
      storiesEnabledMap,
      currentProductGridPage = 1,
      nowMs = Date.now(),
    } = params;

    if (!hostStore || !activeContext || activeContext.hostStoreId !== hostStore.id) {
      return [];
    }

    const config = normalizePartnerPicksGlobalConfig(params.globalConfig);
    if (!config.featureEnabled || !config.channels[channelId]?.enabled) {
      return [];
    }

    const maxDisplayed = Math.max(
      0,
      config.channels[channelId].maxDisplayedProducts
    );
    if (maxDisplayed === 0) return [];

    // Enforce Context-Scoped Max-2-Partner-Stores Invariant across all 5 channels
    const maxStoresCap = Math.max(1, config.maxSimultaneousPartnerStores || 2);
    const allowedContextPartnerIds = new Set(
      activeContext.selectedPartnerStoreIds.slice(0, maxStoresCap)
    );
    if (allowedContextPartnerIds.size === 0) return [];

    const fairnessByPartnerId = new Map<string, number>();
    for (const f of fairnessScores) {
      fairnessByPartnerId.set(f.partnerStoreId, f.finalSelectionScore);
    }

    const candidateSlots: ResolvedChannelPartnerPickSlot[] = [];

    for (const placement of allPlacements) {
      if (
        !placement ||
        placement.hostStoreId !== hostStore.id ||
        placement.channelId !== channelId ||
        !allowedContextPartnerIds.has(placement.sourceStoreId)
      ) {
        continue;
      }

      const sourceStore = allStoresById[placement.sourceStoreId];
      if (!sourceStore) continue;

      const partnership = allPartnerships.find(
        (p) => p && p.id === placement.partnershipId
      );
      if (!partnership) continue;

      // 1. Evaluate all 6 Bilateral 3-Layer Eligibility Gates
      const bilatEval = evaluateBilateralPlacementEligibility({
        globalConfig: config,
        channelId,
        sourceStore,
        hostStore,
        sourceProfile: profilesByStoreId[sourceStore.id],
        hostProfile: profilesByStoreId[hostStore.id],
        partnership,
        allPartnerships,
        placement,
        currentProductGridPage,
        storiesEnabledMap,
        nowMs,
      });

      if (!bilatEval.eligible) continue;

      const liveProduct = sourceStore.products.find(
        (pr) => pr && pr.id === placement.productId
      );
      if (!liveProduct) continue;

      // 2. Evaluate Per-Channel Frequency Caps & User-Specific Fatigue Protection
      const freqEval = evaluateCandidateFrequencyAndFatigue({
        globalConfig: config,
        userFatigueState,
        channelId,
        placementId: placement.id,
        productId: liveProduct.id,
        sourceStoreId: sourceStore.id,
        hostStoreId: hostStore.id,
        isSameRenderBatch: true,
        nowMs,
      });

      if (!freqEval.allowed) continue;

      const baseFairness = fairnessByPartnerId.get(sourceStore.id) ?? 1.0;
      const combinedRankingScore = Number(
        (baseFairness * freqEval.userSpecificPriorityMultiplier).toFixed(4)
      );

      candidateSlots.push({
        placement,
        partnership,
        sourceStore,
        hostStore,
        liveProduct,
        channelId,
        userPriorityMultiplier: freqEval.userSpecificPriorityMultiplier,
        combinedRankingScore,
      });
    }

    // Sort descending by combinedRankingScore; interleave distinct partner stores in context first
    candidateSlots.sort((a, b) => {
      if (b.combinedRankingScore !== a.combinedRankingScore) {
        return b.combinedRankingScore - a.combinedRankingScore;
      }
      return a.placement.id.localeCompare(b.placement.id);
    });

    // Deduplicate by productId within the same channel render
    const seenProductIds = new Set<string>();
    const finalSlots: ResolvedChannelPartnerPickSlot[] = [];
    for (const slot of candidateSlots) {
      if (finalSlots.length >= maxDisplayed) break;
      if (seenProductIds.has(slot.liveProduct.id)) continue;
      seenProductIds.add(slot.liveProduct.id);
      finalSlots.push(slot);
    }

    return finalSlots;
  } catch {
    // Graceful fallback (Section M.2): never crash native storefront rendering
    return [];
  }
}
