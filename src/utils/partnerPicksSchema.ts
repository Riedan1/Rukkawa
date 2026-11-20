import type {
  CanonicalSubscriptionPlanId,
  ChannelFrequencySettings,
  ChannelVisualTokenConfig,
  GlobalSmartFrequencyAndFatigueConfig,
  IndependentChannelConfig,
  MerchantPartnerPicksProfile,
  PartnerPickChannelExposureCounters,
  PartnerPickChannelId,
  PartnerPickDirectionalExposureSummary,
  PartnerPickProductPlacement,
  PartnerPicksBidirectionalExposureLedger,
  PartnerPicksChannelAnalyticsEvent,
  PartnerPicksGlobalConfig,
  PartnerPicksPartnership,
  PartnerPicksPartnershipStatus,
  PlacementLifecycleState,
  PlacementTrafficLight,
  PlanPartnerPicksEntitlement,
} from "../types";

/**
 * Canonical 5 Partner Picks Placement Channels (Independently governed in Platform Admin)
 */
export const PARTNER_PICK_CHANNEL_IDS: PartnerPickChannelId[] = [
  "STORE_BANNER",
  "PRODUCT_GRID",
  "DISCOVER_MORE",
  "REELS_FEED",
  "STORIES",
];

/**
 * Canonical 5 YUME Subscription Plans
 */
export const CANONICAL_PARTNER_PICKS_PLAN_IDS: CanonicalSubscriptionPlanId[] = [
  "Basic",
  "Pro",
  "Pro Plus",
  "Premium",
  "Premium Plus",
];

/**
 * Confirmed maximum simultaneously visible partner stores within one active host-store browsing context
 * across all 5 channels (Store Banner, Store Product Grid, Discover More Products, Reels Feed, Stories).
 */
export const DEFAULT_MAX_SIMULTANEOUS_PARTNER_STORES = 2;

export const PARTNER_PICKS_PARTNERSHIP_STATUSES: PartnerPicksPartnershipStatus[] = [
  "PENDING_REQUEST",
  "ACCEPTED",
  "TERMS_PENDING",
  "PLACEMENT_PENDING",
  "ACTIVE",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "SUSPENDED",
];

export const PARTNER_PICKS_PLACEMENT_STATES: PlacementLifecycleState[] = [
  "PROPOSED_AWAITING_HOST_SELECTION",
  "HOST_SELECTED_AWAITING_FINAL_APPROVAL",
  "APPROVED_LIVE",
  "REJECTED_BY_HOST",
  "REJECTED_BY_PROPOSER",
  "AUTO_PAUSED_OUT_OF_STOCK",
  "PAUSED_OWNER_HIDDEN",
  "PAUSED_OWNER_DISABLED",
  "PAUSED_OWNER_ARCHIVED",
  "INVALIDATED_PRODUCT_REMOVED",
  "SUSPENDED_BY_PLATFORM_ADMIN",
];

export const VALID_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

export function isValidPartnerPicksEntityId(id: unknown): id is string {
  return (
    typeof id === "string" &&
    id.length >= 1 &&
    id.length <= 128 &&
    VALID_ID_REGEX.test(id)
  );
}

/**
 * Creates provisional, Platform Admin-editable channel configuration defaults for all 5 channels.
 * All numerical thresholds are provisional seed values and never hardcoded business rules.
 */
export function createDefaultPartnerPicksChannelsConfig(): Record<
  PartnerPickChannelId,
  IndependentChannelConfig
> {
  return {
    STORE_BANNER: {
      channelId: "STORE_BANNER",
      enabled: true,
      maxDisplayedProducts: 1,
      spatialPlacementRules: {
        allowedBannerSlotIndices: [1, 2],
      },
      frequencyLimits: {
        enabled: true,
        minSecondsBetweenAppearances: 0,
        maxAppearancesPerSession: 18,
        maxAppearancesPerDayPerUser: 45,
      },
      rotationOverride: {
        useGlobalRotation: true,
      },
      visualTokens: {
        showPartnerPicksBadge: true,
        badgeStyle: "minimal_pill",
        showPartnerStoreAttribution: true,
        showHostContextAttribution: false,
        showDiscountBadge: true,
        showStarRating: true,
        cardScaleDesktop: "standard",
        cardScaleMobile: "compact",
        imageAspectRatio: "native",
      },
      fairnessChannelWeight: 1.35,
    },
    PRODUCT_GRID: {
      channelId: "PRODUCT_GRID",
      enabled: true,
      maxDisplayedProducts: 2,
      spatialPlacementRules: {
        minGridRow: 1,
        maxGridRow: 4,
        maxPartnerCardsPerRow: 1,
        gridPageScope: "PAGE_1_ONLY",
      },
      frequencyLimits: {
        enabled: true,
        minSecondsBetweenAppearances: 0,
        maxAppearancesPerSession: 18,
        maxAppearancesPerDayPerUser: 45,
      },
      rotationOverride: {
        useGlobalRotation: true,
      },
      visualTokens: {
        showPartnerPicksBadge: true,
        badgeStyle: "minimal_pill",
        showPartnerStoreAttribution: true,
        showHostContextAttribution: false,
        showDiscountBadge: true,
        showStarRating: true,
        cardScaleDesktop: "standard",
        cardScaleMobile: "standard",
        imageAspectRatio: "4:5",
      },
      fairnessChannelWeight: 1.15,
    },
    DISCOVER_MORE: {
      channelId: "DISCOVER_MORE",
      enabled: true,
      maxDisplayedProducts: 2,
      spatialPlacementRules: {
        allowedDiscoverCarouselSlots: [1, 3, 5],
      },
      frequencyLimits: {
        enabled: true,
        minSecondsBetweenAppearances: 0,
        maxAppearancesPerSession: 18,
        maxAppearancesPerDayPerUser: 45,
      },
      rotationOverride: {
        useGlobalRotation: true,
      },
      visualTokens: {
        showPartnerPicksBadge: true,
        badgeStyle: "minimal_pill",
        showPartnerStoreAttribution: true,
        showHostContextAttribution: false,
        showDiscountBadge: true,
        showStarRating: true,
        cardScaleDesktop: "compact",
        cardScaleMobile: "compact",
        imageAspectRatio: "1:1",
      },
      fairnessChannelWeight: 1.0,
    },
    REELS_FEED: {
      channelId: "REELS_FEED",
      enabled: true,
      maxDisplayedProducts: 2,
      sequentialMediaRules: {
        allowMidSequenceInsertion: true,
        allowSequenceTailInsertion: true,
      },
      frequencyLimits: {
        enabled: true,
        minSecondsBetweenAppearances: 45,
        maxAppearancesPerSession: 8,
        maxAppearancesPerDayPerUser: 20,
        minNativeItemsBeforeFirstInsert: 2,
        insertionCadenceNativeItems: 4,
      },
      rotationOverride: {
        useGlobalRotation: true,
      },
      visualTokens: {
        showPartnerPicksBadge: true,
        badgeStyle: "store_avatar_pill",
        showPartnerStoreAttribution: true,
        showHostContextAttribution: true,
        showDiscountBadge: true,
        showStarRating: true,
        cardScaleDesktop: "standard",
        cardScaleMobile: "standard",
        imageAspectRatio: "9:16",
        reelsPresentationStrategy: "AUTO_BEST_ASSET",
      },
      fairnessChannelWeight: 1.25,
    },
    STORIES: {
      channelId: "STORIES",
      enabled: true,
      maxDisplayedProducts: 1,
      sequentialMediaRules: {
        requireHostStoriesFeatureEnabled: true,
        requireActiveNativeStoryPublished: false,
        forbidStandalonePromotionalStoryRing: true,
        allowMidSequenceInsertion: true,
        allowSequenceTailInsertion: true,
      },
      frequencyLimits: {
        enabled: true,
        minSecondsBetweenAppearances: 60,
        maxAppearancesPerSession: 6,
        maxAppearancesPerDayPerUser: 15,
        minNativeItemsBeforeFirstInsert: 1,
        insertionCadenceNativeItems: 2,
      },
      rotationOverride: {
        useGlobalRotation: true,
      },
      visualTokens: {
        showPartnerPicksBadge: true,
        badgeStyle: "store_avatar_pill",
        showPartnerStoreAttribution: true,
        showHostContextAttribution: true,
        showDiscountBadge: true,
        showStarRating: true,
        cardScaleDesktop: "standard",
        cardScaleMobile: "standard",
        imageAspectRatio: "9:16",
      },
      fairnessChannelWeight: 1.2,
    },
  };
}

/**
 * Creates provisional, Platform Admin-editable per-plan Partner Picks entitlement defaults
 * across the 5 canonical YUME plans (Basic, Pro, Pro Plus, Premium, Premium Plus).
 */
export function createDefaultPartnerPicksPlanEntitlements(): Record<
  CanonicalSubscriptionPlanId,
  PlanPartnerPicksEntitlement
> {
  const noChannels: Record<PartnerPickChannelId, boolean> = {
    STORE_BANNER: false,
    PRODUCT_GRID: false,
    DISCOVER_MORE: false,
    REELS_FEED: false,
    STORIES: false,
  };
  const storefrontChannelsOnly: Record<PartnerPickChannelId, boolean> = {
    STORE_BANNER: true,
    PRODUCT_GRID: true,
    DISCOVER_MORE: true,
    REELS_FEED: false,
    STORIES: false,
  };
  const allFiveChannels: Record<PartnerPickChannelId, boolean> = {
    STORE_BANNER: true,
    PRODUCT_GRID: true,
    DISCOVER_MORE: true,
    REELS_FEED: true,
    STORIES: true,
  };

  return {
    Basic: {
      planId: "Basic",
      enabled: false,
      maxActivePartnerStores: 0,
      maxProductsPerPartnership: 0,
      allowedChannelsAsSource: { ...noChannels },
      allowedChannelsAsHost: { ...noChannels },
      allowCustomPerPartnerProducts: false,
    },
    Pro: {
      planId: "Pro",
      enabled: true,
      maxActivePartnerStores: 2,
      maxProductsPerPartnership: 3,
      allowedChannelsAsSource: { ...allFiveChannels },
      allowedChannelsAsHost: { ...allFiveChannels },
      allowCustomPerPartnerProducts: true,
    },
    "Pro Plus": {
      planId: "Pro Plus",
      enabled: true,
      maxActivePartnerStores: 2,
      maxProductsPerPartnership: 3,
      allowedChannelsAsSource: { ...storefrontChannelsOnly },
      allowedChannelsAsHost: { ...storefrontChannelsOnly },
      allowCustomPerPartnerProducts: true,
    },
    Premium: {
      planId: "Premium",
      enabled: true,
      maxActivePartnerStores: 3,
      maxProductsPerPartnership: 5,
      allowedChannelsAsSource: { ...allFiveChannels },
      allowedChannelsAsHost: { ...allFiveChannels },
      allowCustomPerPartnerProducts: true,
    },
    "Premium Plus": {
      planId: "Premium Plus",
      enabled: true,
      maxActivePartnerStores: 5,
      maxProductsPerPartnership: 6,
      allowedChannelsAsSource: { ...allFiveChannels },
      allowedChannelsAsHost: { ...allFiveChannels },
      allowCustomPerPartnerProducts: true,
    },
  };
}

export function createDefaultPartnerPicksSmartFrequencyConfig(): GlobalSmartFrequencyAndFatigueConfig {
  return {
    enabled: true,
    maxCrossChannelExposuresPerSession: 18,
    maxCrossChannelExposuresPerDayPerUser: 45,
    sameProductCooldownSeconds: 1200,
    samePartnerStoreCooldownSeconds: 300,
    recentlyViewedProductSuppressionSeconds: 1800,
    userSpecificSkipDecay: {
      enabled: true,
      rapidSkipThresholdMs: 2500,
      perSkipPriorityMultiplier: 0.7,
      priorityRecoveryHalfLifeMinutes: 45,
    },
  };
}

/**
 * Creates the default `/partner_picks_config/global` record.
 * Confirmed requirements enforced:
 * - maxSimultaneousPartnerStores = 2
 * - timedRotationEnabled = false (disabled by default)
 * - STORIES requireHostStoriesFeatureEnabled = true, requireActiveNativeStoryPublished = false, forbidStandalonePromotionalStoryRing = true
 */
export function createDefaultPartnerPicksGlobalConfig(
  nowIso = new Date().toISOString()
): PartnerPicksGlobalConfig {
  return {
    id: "global",
    featureEnabled: true,
    maxSimultaneousPartnerStores: DEFAULT_MAX_SIMULTANEOUS_PARTNER_STORES,
    defaultRotationMode: "REFRESH_BASED",
    timedRotationEnabled: false,
    timedRotationIntervalSeconds: 30,
    channels: createDefaultPartnerPicksChannelsConfig(),
    planEntitlements: createDefaultPartnerPicksPlanEntitlements(),
    smartFrequency: createDefaultPartnerPicksSmartFrequencyConfig(),
    updatedAt: nowIso,
    updatedByAdminId: "system_seed",
  };
}

function sanitizeChannelFrequency(
  raw: Partial<ChannelFrequencySettings> | undefined,
  def: ChannelFrequencySettings
): ChannelFrequencySettings {
  if (!raw || typeof raw !== "object") return { ...def };
  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : def.enabled,
    minSecondsBetweenAppearances:
      typeof raw.minSecondsBetweenAppearances === "number" &&
      raw.minSecondsBetweenAppearances >= 0
        ? Math.floor(raw.minSecondsBetweenAppearances)
        : def.minSecondsBetweenAppearances,
    maxAppearancesPerSession:
      typeof raw.maxAppearancesPerSession === "number" &&
      raw.maxAppearancesPerSession >= 0
        ? Math.floor(raw.maxAppearancesPerSession)
        : def.maxAppearancesPerSession,
    maxAppearancesPerDayPerUser:
      typeof raw.maxAppearancesPerDayPerUser === "number" &&
      raw.maxAppearancesPerDayPerUser >= 0
        ? Math.floor(raw.maxAppearancesPerDayPerUser)
        : def.maxAppearancesPerDayPerUser,
    minNativeItemsBeforeFirstInsert:
      typeof raw.minNativeItemsBeforeFirstInsert === "number" &&
      raw.minNativeItemsBeforeFirstInsert >= 0
        ? Math.floor(raw.minNativeItemsBeforeFirstInsert)
        : def.minNativeItemsBeforeFirstInsert,
    insertionCadenceNativeItems:
      typeof raw.insertionCadenceNativeItems === "number" &&
      raw.insertionCadenceNativeItems >= 1
        ? Math.floor(raw.insertionCadenceNativeItems)
        : def.insertionCadenceNativeItems,
  };
}

function sanitizeChannelVisualTokens(
  raw: Partial<ChannelVisualTokenConfig> | undefined,
  def: ChannelVisualTokenConfig
): ChannelVisualTokenConfig {
  if (!raw || typeof raw !== "object") return { ...def };
  return {
    showPartnerPicksBadge:
      typeof raw.showPartnerPicksBadge === "boolean"
        ? raw.showPartnerPicksBadge
        : def.showPartnerPicksBadge,
    badgeStyle:
      raw.badgeStyle === "minimal_pill" ||
      raw.badgeStyle === "icon_only" ||
      raw.badgeStyle === "store_avatar_pill"
        ? raw.badgeStyle
        : def.badgeStyle,
    showPartnerStoreAttribution:
      typeof raw.showPartnerStoreAttribution === "boolean"
        ? raw.showPartnerStoreAttribution
        : def.showPartnerStoreAttribution,
    showHostContextAttribution:
      typeof raw.showHostContextAttribution === "boolean"
        ? raw.showHostContextAttribution
        : def.showHostContextAttribution,
    showDiscountBadge:
      typeof raw.showDiscountBadge === "boolean"
        ? raw.showDiscountBadge
        : def.showDiscountBadge,
    showStarRating:
      typeof raw.showStarRating === "boolean"
        ? raw.showStarRating
        : def.showStarRating,
    cardScaleDesktop:
      raw.cardScaleDesktop === "compact" || raw.cardScaleDesktop === "standard"
        ? raw.cardScaleDesktop
        : def.cardScaleDesktop,
    cardScaleMobile:
      raw.cardScaleMobile === "compact" || raw.cardScaleMobile === "standard"
        ? raw.cardScaleMobile
        : def.cardScaleMobile,
    imageAspectRatio:
      raw.imageAspectRatio === "native" ||
      raw.imageAspectRatio === "4:5" ||
      raw.imageAspectRatio === "1:1" ||
      raw.imageAspectRatio === "9:16"
        ? raw.imageAspectRatio
        : def.imageAspectRatio,
    reelsPresentationStrategy:
      raw.reelsPresentationStrategy === "AUTO_BEST_ASSET" ||
      raw.reelsPresentationStrategy === "ORIGINAL_VIDEO_ONLY" ||
      raw.reelsPresentationStrategy === "PRODUCT_IMAGE_SHOWCASE" ||
      raw.reelsPresentationStrategy === "NATIVE_SCENE_CARD"
        ? raw.reelsPresentationStrategy
        : def.reelsPresentationStrategy,
  };
}

/**
 * Normalizes and validates any raw PartnerPicksGlobalConfig object, ensuring backward compatibility,
 * all 5 independent channels, all 5 canonical subscription plans, and confirmed Stories invariants.
 */
export function normalizePartnerPicksGlobalConfig(
  raw?: Partial<PartnerPicksGlobalConfig> | null
): PartnerPicksGlobalConfig {
  const def = createDefaultPartnerPicksGlobalConfig();
  if (!raw || typeof raw !== "object") return def;

  const channels = {} as Record<PartnerPickChannelId, IndependentChannelConfig>;
  const rawChannels = (raw.channels || {}) as Partial<
    Record<PartnerPickChannelId, Partial<IndependentChannelConfig>>
  >;

  for (const chId of PARTNER_PICK_CHANNEL_IDS) {
    const dCh = def.channels[chId];
    const rCh = rawChannels[chId] || {};
    const mergedSeq = dCh.sequentialMediaRules
      ? {
          ...dCh.sequentialMediaRules,
          ...(rCh.sequentialMediaRules || {}),
        }
      : rCh.sequentialMediaRules;

    // Enforce confirmed Stories architectural prerequisites
    if (chId === "STORIES" && mergedSeq) {
      mergedSeq.requireHostStoriesFeatureEnabled =
        typeof rCh.sequentialMediaRules?.requireHostStoriesFeatureEnabled === "boolean"
          ? rCh.sequentialMediaRules.requireHostStoriesFeatureEnabled
          : true;
      mergedSeq.requireActiveNativeStoryPublished =
        typeof rCh.sequentialMediaRules?.requireActiveNativeStoryPublished === "boolean"
          ? rCh.sequentialMediaRules.requireActiveNativeStoryPublished
          : false;
      mergedSeq.forbidStandalonePromotionalStoryRing = true;
    }

    channels[chId] = {
      channelId: chId,
      enabled: typeof rCh.enabled === "boolean" ? rCh.enabled : dCh.enabled,
      maxDisplayedProducts:
        typeof rCh.maxDisplayedProducts === "number" &&
        rCh.maxDisplayedProducts >= 0 &&
        rCh.maxDisplayedProducts <= 24
          ? Math.floor(rCh.maxDisplayedProducts)
          : dCh.maxDisplayedProducts,
      spatialPlacementRules: dCh.spatialPlacementRules
        ? {
            ...dCh.spatialPlacementRules,
            ...(rCh.spatialPlacementRules || {}),
          }
        : rCh.spatialPlacementRules,
      sequentialMediaRules: mergedSeq,
      frequencyLimits: sanitizeChannelFrequency(
        rCh.frequencyLimits,
        dCh.frequencyLimits
      ),
      rotationOverride: {
        useGlobalRotation:
          typeof rCh.rotationOverride?.useGlobalRotation === "boolean"
            ? rCh.rotationOverride.useGlobalRotation
            : dCh.rotationOverride.useGlobalRotation,
        customRotationMode:
          rCh.rotationOverride?.customRotationMode === "REFRESH_BASED" ||
          rCh.rotationOverride?.customRotationMode === "TIMED_ROTATION"
            ? rCh.rotationOverride.customRotationMode
            : dCh.rotationOverride.customRotationMode,
        customTimedIntervalSeconds:
          typeof rCh.rotationOverride?.customTimedIntervalSeconds === "number" &&
          rCh.rotationOverride.customTimedIntervalSeconds >= 5
            ? Math.floor(rCh.rotationOverride.customTimedIntervalSeconds)
            : dCh.rotationOverride.customTimedIntervalSeconds,
      },
      visualTokens: sanitizeChannelVisualTokens(
        rCh.visualTokens,
        dCh.visualTokens
      ),
      fairnessChannelWeight:
        typeof rCh.fairnessChannelWeight === "number" &&
        rCh.fairnessChannelWeight > 0 &&
        rCh.fairnessChannelWeight <= 10
          ? Number(rCh.fairnessChannelWeight)
          : dCh.fairnessChannelWeight,
    };
  }

  const planEntitlements = {} as Record<
    CanonicalSubscriptionPlanId,
    PlanPartnerPicksEntitlement
  >;
  const rawPlans = (raw.planEntitlements || {}) as Partial<
    Record<CanonicalSubscriptionPlanId, Partial<PlanPartnerPicksEntitlement>>
  >;

  for (const planId of CANONICAL_PARTNER_PICKS_PLAN_IDS) {
    const dPlan = def.planEntitlements[planId];
    const rPlan = rawPlans[planId] || {};
    const sourceCh = {} as Record<PartnerPickChannelId, boolean>;
    const hostCh = {} as Record<PartnerPickChannelId, boolean>;
    for (const chId of PARTNER_PICK_CHANNEL_IDS) {
      sourceCh[chId] =
        typeof rPlan.allowedChannelsAsSource?.[chId] === "boolean"
          ? rPlan.allowedChannelsAsSource[chId]!
          : dPlan.allowedChannelsAsSource[chId];
      hostCh[chId] =
        typeof rPlan.allowedChannelsAsHost?.[chId] === "boolean"
          ? rPlan.allowedChannelsAsHost[chId]!
          : dPlan.allowedChannelsAsHost[chId];
    }

    planEntitlements[planId] = {
      planId,
      enabled: typeof rPlan.enabled === "boolean" ? rPlan.enabled : dPlan.enabled,
      maxActivePartnerStores:
        typeof rPlan.maxActivePartnerStores === "number" &&
        rPlan.maxActivePartnerStores >= 0 &&
        rPlan.maxActivePartnerStores <= 50
          ? Math.floor(rPlan.maxActivePartnerStores)
          : dPlan.maxActivePartnerStores,
      maxProductsPerPartnership:
        typeof rPlan.maxProductsPerPartnership === "number" &&
        rPlan.maxProductsPerPartnership >= 0 &&
        rPlan.maxProductsPerPartnership <= 100
          ? Math.floor(rPlan.maxProductsPerPartnership)
          : dPlan.maxProductsPerPartnership,
      allowedChannelsAsSource: sourceCh,
      allowedChannelsAsHost: hostCh,
      allowCustomPerPartnerProducts:
        typeof rPlan.allowCustomPerPartnerProducts === "boolean"
          ? rPlan.allowCustomPerPartnerProducts
          : dPlan.allowCustomPerPartnerProducts,
    };
  }

  const rFreq = raw.smartFrequency;
  const dFreq = def.smartFrequency;
  const smartFrequency: GlobalSmartFrequencyAndFatigueConfig = {
    enabled: typeof rFreq?.enabled === "boolean" ? rFreq.enabled : dFreq.enabled,
    maxCrossChannelExposuresPerSession:
      typeof rFreq?.maxCrossChannelExposuresPerSession === "number" &&
      rFreq.maxCrossChannelExposuresPerSession >= 0
        ? Math.floor(rFreq.maxCrossChannelExposuresPerSession)
        : dFreq.maxCrossChannelExposuresPerSession,
    maxCrossChannelExposuresPerDayPerUser:
      typeof rFreq?.maxCrossChannelExposuresPerDayPerUser === "number" &&
      rFreq.maxCrossChannelExposuresPerDayPerUser >= 0
        ? Math.floor(rFreq.maxCrossChannelExposuresPerDayPerUser)
        : dFreq.maxCrossChannelExposuresPerDayPerUser,
    sameProductCooldownSeconds:
      typeof rFreq?.sameProductCooldownSeconds === "number" &&
      rFreq.sameProductCooldownSeconds >= 0
        ? Math.floor(rFreq.sameProductCooldownSeconds)
        : dFreq.sameProductCooldownSeconds,
    samePartnerStoreCooldownSeconds:
      typeof rFreq?.samePartnerStoreCooldownSeconds === "number" &&
      rFreq.samePartnerStoreCooldownSeconds >= 0
        ? Math.floor(rFreq.samePartnerStoreCooldownSeconds)
        : dFreq.samePartnerStoreCooldownSeconds,
    recentlyViewedProductSuppressionSeconds:
      typeof rFreq?.recentlyViewedProductSuppressionSeconds === "number" &&
      rFreq.recentlyViewedProductSuppressionSeconds >= 0
        ? Math.floor(rFreq.recentlyViewedProductSuppressionSeconds)
        : dFreq.recentlyViewedProductSuppressionSeconds,
    userSpecificSkipDecay: {
      enabled:
        typeof rFreq?.userSpecificSkipDecay?.enabled === "boolean"
          ? rFreq.userSpecificSkipDecay.enabled
          : dFreq.userSpecificSkipDecay.enabled,
      rapidSkipThresholdMs:
        typeof rFreq?.userSpecificSkipDecay?.rapidSkipThresholdMs === "number" &&
        rFreq.userSpecificSkipDecay.rapidSkipThresholdMs >= 200
          ? Math.floor(rFreq.userSpecificSkipDecay.rapidSkipThresholdMs)
          : dFreq.userSpecificSkipDecay.rapidSkipThresholdMs,
      perSkipPriorityMultiplier:
        typeof rFreq?.userSpecificSkipDecay?.perSkipPriorityMultiplier === "number" &&
        rFreq.userSpecificSkipDecay.perSkipPriorityMultiplier > 0 &&
        rFreq.userSpecificSkipDecay.perSkipPriorityMultiplier <= 1
          ? Number(rFreq.userSpecificSkipDecay.perSkipPriorityMultiplier)
          : dFreq.userSpecificSkipDecay.perSkipPriorityMultiplier,
      priorityRecoveryHalfLifeMinutes:
        typeof rFreq?.userSpecificSkipDecay?.priorityRecoveryHalfLifeMinutes === "number" &&
        rFreq.userSpecificSkipDecay.priorityRecoveryHalfLifeMinutes >= 1
          ? Math.floor(rFreq.userSpecificSkipDecay.priorityRecoveryHalfLifeMinutes)
          : dFreq.userSpecificSkipDecay.priorityRecoveryHalfLifeMinutes,
    },
  };

  return {
    id: "global",
    featureEnabled:
      typeof raw.featureEnabled === "boolean"
        ? raw.featureEnabled
        : def.featureEnabled,
    maxSimultaneousPartnerStores:
      typeof raw.maxSimultaneousPartnerStores === "number" &&
      raw.maxSimultaneousPartnerStores >= 1 &&
      raw.maxSimultaneousPartnerStores <= 10
        ? Math.floor(raw.maxSimultaneousPartnerStores)
        : def.maxSimultaneousPartnerStores,
    defaultRotationMode:
      raw.defaultRotationMode === "REFRESH_BASED" ||
      raw.defaultRotationMode === "TIMED_ROTATION"
        ? raw.defaultRotationMode
        : def.defaultRotationMode,
    timedRotationEnabled:
      typeof raw.timedRotationEnabled === "boolean"
        ? raw.timedRotationEnabled
        : false,
    timedRotationIntervalSeconds:
      typeof raw.timedRotationIntervalSeconds === "number" &&
      raw.timedRotationIntervalSeconds >= 5 &&
      raw.timedRotationIntervalSeconds <= 3600
        ? Math.floor(raw.timedRotationIntervalSeconds)
        : def.timedRotationIntervalSeconds,
    channels,
    planEntitlements,
    smartFrequency,
    updatedAt:
      typeof raw.updatedAt === "string" && raw.updatedAt.trim().length > 0
        ? raw.updatedAt.slice(0, 64)
        : def.updatedAt,
    updatedByAdminId:
      typeof raw.updatedByAdminId === "string" && raw.updatedByAdminId.trim().length > 0
        ? raw.updatedByAdminId.slice(0, 128)
        : def.updatedByAdminId,
  };
}

/**
 * Creates a default MerchantPartnerPicksProfile for a store (`/partner_picks_profiles/{storeId}`).
 * Supports Common Default Product Collection plus Independent Per-Partnership Custom Product Selection.
 */
export function createDefaultMerchantPartnerPicksProfile(
  storeId: string,
  ownerUid?: string,
  nowIso = new Date().toISOString()
): MerchantPartnerPicksProfile {
  return {
    storeId: String(storeId).slice(0, 128),
    ownerUid: ownerUid ? String(ownerUid).slice(0, 128) : undefined,
    defaultSharedProductIds: [],
    partnershipProductMode: {},
    customProductIdsByPartnership: {},
    hostChannelConsent: {
      STORE_BANNER: true,
      PRODUCT_GRID: true,
      DISCOVER_MORE: true,
      REELS_FEED: true,
      STORIES: true,
    },
    hostSpatialAllowedSlots: {
      bannerSlotIndices: [1, 2],
      gridCoordinates: [
        { row: 1, col: 2 },
        { row: 2, col: 3 },
      ],
      discoverCarouselIndices: [1, 3],
    },
    hostSequentialMediaConsent: {
      reelsInsertionEnabled: true,
      storiesInsertionEnabled: true,
    },
    staffPermissions: {
      authorizedStaffIds: [],
      canSendRequests: false,
      canAcceptRejectRequests: false,
      canManageSharedProducts: false,
      canProposeAndSelectPlacements: false,
      canFinalApprovePlacements: false,
    },
    updatedAt: nowIso,
  };
}

export function normalizeMerchantPartnerPicksProfile(
  storeId: string,
  raw?: Partial<MerchantPartnerPicksProfile> | null
): MerchantPartnerPicksProfile {
  const def = createDefaultMerchantPartnerPicksProfile(storeId, raw?.ownerUid);
  if (!raw || typeof raw !== "object") return def;

  const defaultSharedProductIds = Array.isArray(raw.defaultSharedProductIds)
    ? Array.from(
        new Set(
          raw.defaultSharedProductIds
            .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
            .map((id) => id.trim().slice(0, 128))
        )
      ).slice(0, 100)
    : [];

  const partnershipProductMode: Record<string, "DEFAULT_COMMON" | "CUSTOM_PER_PARTNER"> = {};
  if (raw.partnershipProductMode && typeof raw.partnershipProductMode === "object") {
    for (const [pId, mode] of Object.entries(raw.partnershipProductMode)) {
      if (mode === "DEFAULT_COMMON" || mode === "CUSTOM_PER_PARTNER") {
        partnershipProductMode[pId.slice(0, 128)] = mode;
      }
    }
  }

  const customProductIdsByPartnership: Record<string, string[]> = {};
  if (
    raw.customProductIdsByPartnership &&
    typeof raw.customProductIdsByPartnership === "object"
  ) {
    for (const [pId, list] of Object.entries(raw.customProductIdsByPartnership)) {
      if (Array.isArray(list)) {
        customProductIdsByPartnership[pId.slice(0, 128)] = Array.from(
          new Set(
            list
              .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
              .map((id) => id.trim().slice(0, 128))
          )
        ).slice(0, 100);
      }
    }
  }

  const hostChannelConsent = {} as Record<PartnerPickChannelId, boolean>;
  for (const chId of PARTNER_PICK_CHANNEL_IDS) {
    hostChannelConsent[chId] =
      typeof raw.hostChannelConsent?.[chId] === "boolean"
        ? raw.hostChannelConsent[chId]!
        : def.hostChannelConsent[chId];
  }

  return {
    storeId: String(storeId).slice(0, 128),
    ownerUid:
      typeof raw.ownerUid === "string" && raw.ownerUid.trim().length > 0
        ? raw.ownerUid.trim().slice(0, 128)
        : undefined,
    defaultSharedProductIds,
    partnershipProductMode,
    customProductIdsByPartnership,
    hostChannelConsent,
    hostSpatialAllowedSlots: {
      bannerSlotIndices: Array.isArray(raw.hostSpatialAllowedSlots?.bannerSlotIndices)
        ? raw.hostSpatialAllowedSlots!.bannerSlotIndices
            .filter((n): n is number => typeof n === "number" && n >= 0 && n <= 10)
            .slice(0, 10)
        : def.hostSpatialAllowedSlots.bannerSlotIndices,
      gridCoordinates: Array.isArray(raw.hostSpatialAllowedSlots?.gridCoordinates)
        ? raw.hostSpatialAllowedSlots!.gridCoordinates
            .filter(
              (c) =>
                c &&
                typeof c.row === "number" &&
                c.row >= 1 &&
                c.row <= 20 &&
                typeof c.col === "number" &&
                c.col >= 1 &&
                c.col <= 6
            )
            .map((c) => ({ row: Math.floor(c.row), col: Math.floor(c.col) }))
            .slice(0, 24)
        : def.hostSpatialAllowedSlots.gridCoordinates,
      discoverCarouselIndices: Array.isArray(
        raw.hostSpatialAllowedSlots?.discoverCarouselIndices
      )
        ? raw.hostSpatialAllowedSlots!.discoverCarouselIndices
            .filter((n): n is number => typeof n === "number" && n >= 0 && n <= 20)
            .slice(0, 12)
        : def.hostSpatialAllowedSlots.discoverCarouselIndices,
    },
    hostSequentialMediaConsent: {
      reelsInsertionEnabled:
        typeof raw.hostSequentialMediaConsent?.reelsInsertionEnabled === "boolean"
          ? raw.hostSequentialMediaConsent.reelsInsertionEnabled
          : def.hostSequentialMediaConsent.reelsInsertionEnabled,
      storiesInsertionEnabled:
        typeof raw.hostSequentialMediaConsent?.storiesInsertionEnabled === "boolean"
          ? raw.hostSequentialMediaConsent.storiesInsertionEnabled
          : def.hostSequentialMediaConsent.storiesInsertionEnabled,
    },
    staffPermissions: {
      authorizedStaffIds: Array.isArray(raw.staffPermissions?.authorizedStaffIds)
        ? raw.staffPermissions!.authorizedStaffIds
            .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
            .map((id) => id.trim().slice(0, 128))
            .slice(0, 50)
        : [],
      canSendRequests: Boolean(raw.staffPermissions?.canSendRequests),
      canAcceptRejectRequests: Boolean(raw.staffPermissions?.canAcceptRejectRequests),
      canManageSharedProducts: Boolean(raw.staffPermissions?.canManageSharedProducts),
      canProposeAndSelectPlacements: Boolean(
        raw.staffPermissions?.canProposeAndSelectPlacements
      ),
      canFinalApprovePlacements: Boolean(raw.staffPermissions?.canFinalApprovePlacements),
    },
    updatedAt:
      typeof raw.updatedAt === "string" && raw.updatedAt.trim().length > 0
        ? raw.updatedAt.slice(0, 64)
        : def.updatedAt,
  };
}

/**
 * Resolves the traffic-light badge (GREEN | YELLOW | RED) from any 6-state / approval PlacementLifecycleState.
 */
export function resolveTrafficLightForPlacementState(
  state: PlacementLifecycleState
): PlacementTrafficLight {
  switch (state) {
    case "APPROVED_LIVE":
      return "GREEN";
    case "PROPOSED_AWAITING_HOST_SELECTION":
    case "HOST_SELECTED_AWAITING_FINAL_APPROVAL":
    case "AUTO_PAUSED_OUT_OF_STOCK":
    case "PAUSED_OWNER_HIDDEN":
    case "PAUSED_OWNER_DISABLED":
    case "PAUSED_OWNER_ARCHIVED":
      return "YELLOW";
    case "REJECTED_BY_HOST":
    case "REJECTED_BY_PROPOSER":
    case "INVALIDATED_PRODUCT_REMOVED":
    case "SUSPENDED_BY_PLATFORM_ADMIN":
      return "RED";
  }
}

/**
 * Determines whether a paused placement is eligible for automatic resumption when stock returns (> 0).
 * Confirmed Requirement (Section I):
 * ONLY Case A (`AUTO_PAUSED_OUT_OF_STOCK`) may automatically resume on restock.
 * Intentional hiding (Case B), disabling (Case C), archiving (Case D), removal (Case E),
 * and Platform Admin suspension (Case F) MUST NEVER auto-resume on stock changes.
 */
export function isPlacementStateEligibleForAutoStockResumption(
  state: PlacementLifecycleState
): boolean {
  return state === "AUTO_PAUSED_OUT_OF_STOCK";
}

export function createEmptyChannelExposureCounters(): PartnerPickChannelExposureCounters {
  return {
    opportunities: 0,
    impressions: 0,
    uniqueReach: 0,
    clicks: 0,
    skips: 0,
    weightedScore: 0,
    activeExposureDurationSeconds: 0,
  };
}

export function createEmptyDirectionalExposureSummary(
  sourceStoreId: string,
  hostStoreId: string
): PartnerPickDirectionalExposureSummary {
  return {
    sourceStoreId: String(sourceStoreId).slice(0, 128),
    hostStoreId: String(hostStoreId).slice(0, 128),
    byChannel: {
      STORE_BANNER: createEmptyChannelExposureCounters(),
      PRODUCT_GRID: createEmptyChannelExposureCounters(),
      DISCOVER_MORE: createEmptyChannelExposureCounters(),
      REELS_FEED: createEmptyChannelExposureCounters(),
      STORIES: createEmptyChannelExposureCounters(),
    },
    totalOpportunities: 0,
    totalImpressions: 0,
    totalUniqueReach: 0,
    totalClicks: 0,
    totalSkips: 0,
    totalWeightedScore: 0,
    opportunityFillRatePercent: 0,
  };
}

export function createInitialBidirectionalExposureLedger(
  partnershipId: string,
  storeAId: string,
  storeBId: string,
  nowIso = new Date().toISOString()
): PartnerPicksBidirectionalExposureLedger {
  return {
    partnershipId: String(partnershipId).slice(0, 128),
    storeAId: String(storeAId).slice(0, 128),
    storeBId: String(storeBId).slice(0, 128),
    directionAOnB: createEmptyDirectionalExposureSummary(storeAId, storeBId),
    directionBOnA: createEmptyDirectionalExposureSummary(storeBId, storeAId),
    updatedAt: nowIso,
  };
}

/**
 * Validates a PartnerPicksPartnership payload against schema & boundary constraints.
 */
export function validatePartnerPicksPartnershipRecord(
  record: Partial<PartnerPicksPartnership> | null | undefined
): { valid: boolean; error?: string } {
  if (!record || typeof record !== "object") {
    return { valid: false, error: "Partnership record must be an object." };
  }
  if (!isValidPartnerPicksEntityId(record.id)) {
    return { valid: false, error: "Invalid partnership id." };
  }
  if (!isValidPartnerPicksEntityId(record.storeAId)) {
    return { valid: false, error: "Invalid storeAId." };
  }
  if (!isValidPartnerPicksEntityId(record.storeBId)) {
    return { valid: false, error: "Invalid storeBId." };
  }
  if (record.storeAId === record.storeBId) {
    return {
      valid: false,
      error: "A store cannot form a Partner Picks partnership with itself.",
    };
  }
  if (
    record.initiatedByStoreId !== record.storeAId &&
    record.initiatedByStoreId !== record.storeBId
  ) {
    return {
      valid: false,
      error: "initiatedByStoreId must match either storeAId or storeBId.",
    };
  }
  if (
    !record.status ||
    !PARTNER_PICKS_PARTNERSHIP_STATUSES.includes(record.status)
  ) {
    return { valid: false, error: "Invalid partnership status." };
  }
  return { valid: true };
}

/**
 * Validates a PartnerPickProductPlacement payload against two-sided approval and 6-state lifecycle invariants.
 */
export function validatePartnerPickPlacementRecord(
  placement: Partial<PartnerPickProductPlacement> | null | undefined
): { valid: boolean; error?: string } {
  if (!placement || typeof placement !== "object") {
    return { valid: false, error: "Placement record must be an object." };
  }
  if (!isValidPartnerPicksEntityId(placement.id)) {
    return { valid: false, error: "Invalid placement id." };
  }
  if (!isValidPartnerPicksEntityId(placement.partnershipId)) {
    return { valid: false, error: "Invalid partnershipId." };
  }
  if (!isValidPartnerPicksEntityId(placement.sourceStoreId)) {
    return { valid: false, error: "Invalid sourceStoreId." };
  }
  if (!isValidPartnerPicksEntityId(placement.hostStoreId)) {
    return { valid: false, error: "Invalid hostStoreId." };
  }
  if (placement.sourceStoreId === placement.hostStoreId) {
    return {
      valid: false,
      error: "sourceStoreId and hostStoreId must be distinct stores.",
    };
  }
  if (!isValidPartnerPicksEntityId(placement.productId)) {
    return { valid: false, error: "Invalid productId." };
  }
  if (
    !placement.channelId ||
    !PARTNER_PICK_CHANNEL_IDS.includes(placement.channelId)
  ) {
    return { valid: false, error: "Invalid channelId." };
  }
  if (
    !placement.lifecycleState ||
    !PARTNER_PICKS_PLACEMENT_STATES.includes(placement.lifecycleState)
  ) {
    return { valid: false, error: "Invalid placement lifecycleState." };
  }

  // Enforce Two-Sided Approval Invariant: APPROVED_LIVE requires host selection from proposedOptions + proposerFinalApproved
  if (placement.lifecycleState === "APPROVED_LIVE") {
    if (!placement.selectedOptionId || !placement.proposerFinalApproved) {
      return {
        valid: false,
        error:
          "APPROVED_LIVE requires both host selection (selectedOptionId) and proposer final approval (proposerFinalApproved === true).",
      };
    }
    const matchingProposed = Array.isArray(placement.proposedOptions)
      ? placement.proposedOptions.some(
          (opt) => opt && opt.optionId === placement.selectedOptionId
        )
      : false;
    if (!matchingProposed) {
      return {
        valid: false,
        error:
          "Host selectedOptionId must belong to the options proposed by the source merchant.",
      };
    }
    if (placement.trafficLight !== "GREEN") {
      return {
        valid: false,
        error: "APPROVED_LIVE placement must have trafficLight === 'GREEN'.",
      };
    }
  }

  return { valid: true };
}

/**
 * Validates a PartnerPicksChannelAnalyticsEvent record ensuring separate per-channel attribution
 * and mandatory idempotencyKey.
 */
export function validatePartnerPicksAnalyticsEvent(
  event: Partial<PartnerPicksChannelAnalyticsEvent> | null | undefined
): { valid: boolean; error?: string } {
  if (!event || typeof event !== "object") {
    return { valid: false, error: "Analytics event must be an object." };
  }
  if (!isValidPartnerPicksEntityId(event.id)) {
    return { valid: false, error: "Invalid event id." };
  }
  if (
    typeof event.idempotencyKey !== "string" ||
    event.idempotencyKey.trim().length < 6 ||
    event.idempotencyKey.length > 256
  ) {
    return { valid: false, error: "Invalid or missing idempotencyKey." };
  }
  if (
    !event.channelId ||
    !PARTNER_PICK_CHANNEL_IDS.includes(event.channelId)
  ) {
    return { valid: false, error: "Invalid channelId." };
  }
  if (
    !isValidPartnerPicksEntityId(event.partnershipId) ||
    !isValidPartnerPicksEntityId(event.placementId) ||
    !isValidPartnerPicksEntityId(event.hostStoreId) ||
    !isValidPartnerPicksEntityId(event.sourceStoreId) ||
    !isValidPartnerPicksEntityId(event.productId)
  ) {
    return { valid: false, error: "Invalid store, partnership, placement, or product reference ID." };
  }
  if (event.hostStoreId === event.sourceStoreId) {
    return {
      valid: false,
      error: "Cross-store Partner Picks analytics event requires distinct hostStoreId and sourceStoreId.",
    };
  }
  return { valid: true };
}
