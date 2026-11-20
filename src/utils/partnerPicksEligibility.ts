import type {
  CanonicalSubscriptionPlanId,
  MerchantPartnerPicksProfile,
  MerchantStore,
  PartnerPickChannelId,
  PartnerPickProductPlacement,
  PartnerPicksGlobalConfig,
  PartnerPicksPartnership,
  PlacementLifecycleState,
  PlanPartnerPicksEntitlement,
  Product,
} from "../types";
import { resolveStoreSubscriptionPlan } from "./platformPermissionsConfig";
import { isProfileStoriesEnabled, type StoriesEnabledMap } from "./storiesLogic";
import { verifyStrictStoreOwnership } from "./storeMoreOptionsLogic";
import {
  PARTNER_PICK_CHANNEL_IDS,
  createDefaultMerchantPartnerPicksProfile,
  isPlacementStateEligibleForAutoStockResumption,
  normalizeMerchantPartnerPicksProfile,
  normalizePartnerPicksGlobalConfig,
  resolveTrafficLightForPlacementState,
} from "./partnerPicksSchema";

export type PartnerPicksEligibilityGateNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type PartnerPicksGateFailureCode =
  // Gate 1: Global & Channel Admin Availability
  | "GLOBAL_FEATURE_DISABLED"
  | "INVALID_CHANNEL_ID"
  | "CHANNEL_DISABLED_BY_ADMIN"
  // Gate 2: Source Merchant Plan, Standing & Per-Partnership Product Limits
  | "SOURCE_STORE_MISSING"
  | "SOURCE_STORE_ARCHIVED"
  | "SOURCE_STORE_ENFORCEMENT_RESTRICTED"
  | "SOURCE_SUBSCRIPTION_INACTIVE"
  | "SOURCE_PLAN_NOT_ELIGIBLE"
  | "SOURCE_MAX_ACTIVE_PARTNERS_EXCEEDED"
  | "SOURCE_CHANNEL_NOT_ALLOWED_BY_PLAN"
  | "SOURCE_CUSTOM_PER_PARTNER_NOT_ALLOWED_BY_PLAN"
  | "SOURCE_MAX_PRODUCTS_PER_PARTNERSHIP_EXCEEDED"
  | "PRODUCT_NOT_IN_PARTNERSHIP_SHARED_LIST"
  // Gate 3: Host Merchant Plan & Standing
  | "HOST_STORE_MISSING"
  | "SAME_SOURCE_AND_HOST_STORE"
  | "HOST_STORE_ARCHIVED"
  | "HOST_STORE_ENFORCEMENT_RESTRICTED"
  | "HOST_SUBSCRIPTION_INACTIVE"
  | "HOST_PLAN_NOT_ELIGIBLE"
  | "HOST_MAX_ACTIVE_PARTNERS_EXCEEDED"
  | "HOST_CHANNEL_NOT_ALLOWED_BY_PLAN"
  // Gate 4: Bilateral Partnership & Channel Consent (including Stories prerequisite)
  | "PARTNERSHIP_MISSING"
  | "PARTNERSHIP_STORE_MISMATCH"
  | "PARTNERSHIP_SUSPENDED_BY_ADMIN"
  | "PARTNERSHIP_NOT_ACTIVE"
  | "PARTNERSHIP_EXPIRED"
  | "PARTNERSHIP_TERMS_NOT_MUTUALLY_AGREED"
  | "PARTNERSHIP_CHANNEL_NOT_AGREED_FOR_DIRECTION"
  | "HOST_CHANNEL_CONSENT_DISABLED"
  | "HOST_REELS_INSERTION_DISABLED"
  | "HOST_STORIES_INSERTION_DISABLED"
  | "HOST_NATIVE_STORIES_FEATURE_DISABLED"
  // Gate 5: Two-Sided Placement Approval & Spatial/Sequential Scope
  | "PLACEMENT_MISSING"
  | "PLACEMENT_PARTNERSHIP_MISMATCH"
  | "PLACEMENT_STORE_MISMATCH"
  | "PLACEMENT_CHANNEL_MISMATCH"
  | "PLACEMENT_PRODUCT_MISMATCH"
  | "PLACEMENT_AWAITING_HOST_SELECTION"
  | "PLACEMENT_SELECTED_OPTION_NOT_IN_PROPOSALS"
  | "PLACEMENT_AWAITING_PROPOSER_FINAL_APPROVAL"
  | "PLACEMENT_NOT_APPROVED_LIVE"
  | "PLACEMENT_GRID_PAGE_OUT_OF_SCOPE"
  | "PLACEMENT_SLOT_NOT_ALLOWED_BY_HOST"
  // Gate 6: Live Product Reference Integrity (6-State Model Cases A-F)
  | "PRODUCT_REMOVED_OR_MISSING_CASE_E"
  | "PRODUCT_SUSPENDED_BY_ADMIN_CASE_F"
  | "PRODUCT_ARCHIVED_BY_OWNER_CASE_D"
  | "PRODUCT_DISABLED_BY_OWNER_CASE_C"
  | "PRODUCT_HIDDEN_BY_OWNER_CASE_B"
  | "PRODUCT_OUT_OF_STOCK_CASE_A";

export interface PartnerPicksGateEvaluationResult {
  gate: PartnerPicksEligibilityGateNumber;
  layer: "LAYER_1_ADMIN" | "LAYER_2_PLAN_AND_STANDING" | "LAYER_3_BILATERAL_AND_PRODUCT";
  passed: boolean;
  failureCode?: PartnerPicksGateFailureCode;
  reason?: string;
}

export interface BilateralPlacementEligibilityEvaluation {
  eligible: boolean;
  failedGate: PartnerPicksEligibilityGateNumber | null;
  failureCode: PartnerPicksGateFailureCode | null;
  failureReason: string | null;
  sourcePlanId: CanonicalSubscriptionPlanId;
  hostPlanId: CanonicalSubscriptionPlanId;
  direction: "A_ON_B" | "B_ON_A" | null;
  resolvedSharedProductIdsForPartnership: string[];
  detectedProductLifecycleCase:
    | "LIVE_ELIGIBLE"
    | "CASE_A_OUT_OF_STOCK"
    | "CASE_B_OWNER_HIDDEN"
    | "CASE_C_OWNER_DISABLED"
    | "CASE_D_OWNER_ARCHIVED"
    | "CASE_E_PRODUCT_REMOVED"
    | "CASE_F_ADMIN_SUSPENDED";
  recommendedPlacementLifecycleState: PlacementLifecycleState | null;
  gates: {
    gate1GlobalAndChannel: PartnerPicksGateEvaluationResult;
    gate2SourcePlanAndLimits: PartnerPicksGateEvaluationResult;
    gate3HostPlanAndLimits: PartnerPicksGateEvaluationResult;
    gate4PartnershipAndConsent: PartnerPicksGateEvaluationResult;
    gate5TwoSidedPlacementApproval: PartnerPicksGateEvaluationResult;
    gate6LiveProductIntegrity: PartnerPicksGateEvaluationResult;
  };
}

export interface EvaluateBilateralEligibilityInput {
  globalConfig?: Partial<PartnerPicksGlobalConfig> | null;
  channelId: PartnerPickChannelId;
  sourceStore?: MerchantStore | null;
  hostStore?: MerchantStore | null;
  sourceProfile?: Partial<MerchantPartnerPicksProfile> | null;
  hostProfile?: Partial<MerchantPartnerPicksProfile> | null;
  partnership?: PartnerPicksPartnership | null;
  allPartnerships?: PartnerPicksPartnership[];
  placement?: PartnerPickProductPlacement | null;
  productId?: string | null;
  /** Optional current page number when rendering Store Product Grid (1-indexed, defaults to 1) */
  currentProductGridPage?: number;
  /** Optional persisted Stories enablement map (`yume_stories_enabled_by_store`) */
  storiesEnabledMap?: StoriesEnabledMap | null;
  /** Current timestamp in ms for expiration checks */
  nowMs?: number;
}

/**
 * Checks whether a MerchantStore is in active good standing (not archived, suspended, restricted, or billing-expired).
 */
export function evaluateStoreAccountStanding(
  store: MerchantStore | null | undefined,
  rolePrefix: "SOURCE" | "HOST"
): {
  valid: boolean;
  failureCode?: PartnerPicksGateFailureCode;
  reason?: string;
} {
  if (!store || typeof store !== "object" || !store.id) {
    return {
      valid: false,
      failureCode:
        rolePrefix === "SOURCE" ? "SOURCE_STORE_MISSING" : "HOST_STORE_MISSING",
      reason: `${rolePrefix === "SOURCE" ? "Source" : "Host"} store does not exist.`,
    };
  }

  if (store.archived === true) {
    return {
      valid: false,
      failureCode:
        rolePrefix === "SOURCE" ? "SOURCE_STORE_ARCHIVED" : "HOST_STORE_ARCHIVED",
      reason: `${store.name || store.id} is currently archived.`,
    };
  }

  const enforcementState = store.enforcement?.state;
  if (
    enforcementState === "suspended" ||
    enforcementState === "terminated" ||
    enforcementState === "restricted"
  ) {
    return {
      valid: false,
      failureCode:
        rolePrefix === "SOURCE"
          ? "SOURCE_STORE_ENFORCEMENT_RESTRICTED"
          : "HOST_STORE_ENFORCEMENT_RESTRICTED",
      reason: `${store.name || store.id} is under Platform Admin enforcement (${enforcementState}).`,
    };
  }

  const subStatus =
    store.subscriptionMeta?.status || store.subscriptionMeta?.billingStatus;
  if (
    subStatus === "expired" ||
    subStatus === "canceled" ||
    subStatus === "cancelled" ||
    subStatus === "past_due"
  ) {
    return {
      valid: false,
      failureCode:
        rolePrefix === "SOURCE"
          ? "SOURCE_SUBSCRIPTION_INACTIVE"
          : "HOST_SUBSCRIPTION_INACTIVE",
      reason: `${store.name || store.id} has an inactive subscription status (${subStatus}).`,
    };
  }

  return { valid: true };
}

/**
 * Counts how many active partnerships (`status === "ACTIVE"` and not suspended/expired) a store currently participates in.
 */
export function countActivePartnershipsForStore(
  storeId: string,
  allPartnerships: PartnerPicksPartnership[] = [],
  nowMs = Date.now()
): number {
  if (!storeId || !Array.isArray(allPartnerships)) return 0;
  const distinctPartnerStoreIds = new Set<string>();

  for (const p of allPartnerships) {
    if (!p || p.status !== "ACTIVE" || p.suspendedByAdminId) continue;
    if (p.expiresAt) {
      const exp = Date.parse(p.expiresAt);
      if (!Number.isNaN(exp) && exp <= nowMs) continue;
    }
    if (p.storeAId === storeId && p.storeBId && p.storeBId !== storeId) {
      distinctPartnerStoreIds.add(p.storeBId);
    } else if (p.storeBId === storeId && p.storeAId && p.storeAId !== storeId) {
      distinctPartnerStoreIds.add(p.storeAId);
    }
  }

  return distinctPartnerStoreIds.size;
}

/**
 * Resolves the active shared product IDs for a specific partnership `(sourceStore -> partner)`
 * enforcing Confirmed Requirement:
 * - Common Default Product Collection (`defaultSharedProductIds`) by default
 * - Optional Per-Partnership Custom Product Selection (`customProductIdsByPartnership[partnershipId]`)
 * - Product limits are evaluated INDEPENDENTLY per partnership: sharing `P1, P2, P3` with Partner B
 *   never consumes or reduces the product allowance for Partner C.
 */
export function resolveSharedProductIdsForPartnership(
  rawProfile: Partial<MerchantPartnerPicksProfile> | null | undefined,
  storeId: string,
  partnershipId: string | null | undefined,
  planEntitlement: PlanPartnerPicksEntitlement
): {
  mode: "DEFAULT_COMMON" | "CUSTOM_PER_PARTNER";
  configuredProductIds: string[];
  allowedProductIdsWithinPlanCap: string[];
  exceedsPerPartnershipCap: boolean;
  customModeForbiddenByPlan: boolean;
} {
  const profile = normalizeMerchantPartnerPicksProfile(
    storeId,
    rawProfile || createDefaultMerchantPartnerPicksProfile(storeId)
  );
  const requestedMode =
    partnershipId && profile.partnershipProductMode[partnershipId]
      ? profile.partnershipProductMode[partnershipId]
      : "DEFAULT_COMMON";

  const customModeForbiddenByPlan =
    requestedMode === "CUSTOM_PER_PARTNER" &&
    !planEntitlement.allowCustomPerPartnerProducts;

  const rawList =
    requestedMode === "CUSTOM_PER_PARTNER" && partnershipId
      ? profile.customProductIdsByPartnership[partnershipId] || []
      : profile.defaultSharedProductIds || [];

  const maxPerPartnership = Math.max(0, planEntitlement.maxProductsPerPartnership);
  const allowedProductIdsWithinPlanCap = rawList.slice(0, maxPerPartnership);

  return {
    mode: requestedMode,
    configuredProductIds: rawList,
    allowedProductIdsWithinPlanCap,
    exceedsPerPartnershipCap: rawList.length > maxPerPartnership,
    customModeForbiddenByPlan,
  };
}

/**
 * GATE 1 (Layer 1): Global & Channel Admin Availability
 */
export function evaluateGate1GlobalAndChannelAdmin(
  globalConfig: PartnerPicksGlobalConfig,
  channelId: PartnerPickChannelId
): PartnerPicksGateEvaluationResult {
  if (!globalConfig.featureEnabled) {
    return {
      gate: 1,
      layer: "LAYER_1_ADMIN",
      passed: false,
      failureCode: "GLOBAL_FEATURE_DISABLED",
      reason: "Partner Picks is globally disabled by Platform Admin.",
    };
  }

  if (!channelId || !PARTNER_PICK_CHANNEL_IDS.includes(channelId)) {
    return {
      gate: 1,
      layer: "LAYER_1_ADMIN",
      passed: false,
      failureCode: "INVALID_CHANNEL_ID",
      reason: `Invalid Partner Picks placement channel: ${String(channelId)}.`,
    };
  }

  const channelCfg = globalConfig.channels[channelId];
  if (!channelCfg || !channelCfg.enabled) {
    return {
      gate: 1,
      layer: "LAYER_1_ADMIN",
      passed: false,
      failureCode: "CHANNEL_DISABLED_BY_ADMIN",
      reason: `Partner Picks channel ${channelId} is currently disabled by Platform Admin.`,
    };
  }

  return {
    gate: 1,
    layer: "LAYER_1_ADMIN",
    passed: true,
  };
}

/**
 * GATE 2 (Layer 2A): Source Merchant Subscription Plan, Standing, Partner Limit & Per-Partnership Product Limit
 */
export function evaluateGate2SourceMerchantEligibility(params: {
  globalConfig: PartnerPicksGlobalConfig;
  sourceStore?: MerchantStore | null;
  sourceProfile?: Partial<MerchantPartnerPicksProfile> | null;
  partnershipId?: string | null;
  targetPartnerStoreId?: string | null;
  allPartnerships?: PartnerPicksPartnership[];
  channelId?: PartnerPickChannelId | null;
  productId?: string | null;
  nowMs?: number;
}): {
  result: PartnerPicksGateEvaluationResult;
  sourcePlanId: CanonicalSubscriptionPlanId;
  entitlement: PlanPartnerPicksEntitlement;
  sharedProductsResolution: ReturnType<typeof resolveSharedProductIdsForPartnership>;
} {
  const {
    globalConfig,
    sourceStore,
    sourceProfile,
    partnershipId,
    targetPartnerStoreId,
    allPartnerships = [],
    channelId,
    productId,
    nowMs = Date.now(),
  } = params;

  const sourcePlanId = resolveStoreSubscriptionPlan(sourceStore || undefined);
  const entitlement = globalConfig.planEntitlements[sourcePlanId];
  const sharedProductsResolution = resolveSharedProductIdsForPartnership(
    sourceProfile,
    sourceStore?.id || "unknown",
    partnershipId,
    entitlement
  );

  const standing = evaluateStoreAccountStanding(sourceStore, "SOURCE");
  if (!standing.valid) {
    return {
      result: {
        gate: 2,
        layer: "LAYER_2_PLAN_AND_STANDING",
        passed: false,
        failureCode: standing.failureCode,
        reason: standing.reason,
      },
      sourcePlanId,
      entitlement,
      sharedProductsResolution,
    };
  }

  if (!entitlement || !entitlement.enabled || entitlement.maxActivePartnerStores <= 0) {
    return {
      result: {
        gate: 2,
        layer: "LAYER_2_PLAN_AND_STANDING",
        passed: false,
        failureCode: "SOURCE_PLAN_NOT_ELIGIBLE",
        reason: `Source store subscription plan (${sourcePlanId}) is not eligible for Partner Picks.`,
      },
      sourcePlanId,
      entitlement,
      sharedProductsResolution,
    };
  }

  // Independent Limit 1: Active Partner Stores Count
  const activePartnershipsForSource = allPartnerships.filter(
    (p) =>
      p &&
      p.status === "ACTIVE" &&
      !p.suspendedByAdminId &&
      (!p.expiresAt || Date.parse(p.expiresAt) > nowMs) &&
      (p.storeAId === sourceStore!.id || p.storeBId === sourceStore!.id)
  );
  const distinctActivePartnerIds = new Set<string>();
  for (const p of activePartnershipsForSource) {
    const otherId = p.storeAId === sourceStore!.id ? p.storeBId : p.storeAId;
    if (otherId) distinctActivePartnerIds.add(otherId);
  }

  const isTargetAlreadyActivePartner = Boolean(
    targetPartnerStoreId && distinctActivePartnerIds.has(targetPartnerStoreId)
  );
  const effectivePartnerCount = isTargetAlreadyActivePartner
    ? distinctActivePartnerIds.size
    : targetPartnerStoreId
    ? distinctActivePartnerIds.size + 1
    : distinctActivePartnerIds.size;

  if (effectivePartnerCount > entitlement.maxActivePartnerStores) {
    return {
      result: {
        gate: 2,
        layer: "LAYER_2_PLAN_AND_STANDING",
        passed: false,
        failureCode: "SOURCE_MAX_ACTIVE_PARTNERS_EXCEEDED",
        reason: `Source store (${sourcePlanId}) allows at most ${entitlement.maxActivePartnerStores} active partner stores (attempted ${effectivePartnerCount}).`,
      },
      sourcePlanId,
      entitlement,
      sharedProductsResolution,
    };
  }

  // Channel entitlement as Source Merchant
  if (channelId && !entitlement.allowedChannelsAsSource[channelId]) {
    return {
      result: {
        gate: 2,
        layer: "LAYER_2_PLAN_AND_STANDING",
        passed: false,
        failureCode: "SOURCE_CHANNEL_NOT_ALLOWED_BY_PLAN",
        reason: `Source store plan (${sourcePlanId}) does not allow sharing products into channel ${channelId}.`,
      },
      sourcePlanId,
      entitlement,
      sharedProductsResolution,
    };
  }

  // Independent Limit 2: Per-Partnership Shared Products Limit
  if (sharedProductsResolution.customModeForbiddenByPlan) {
    return {
      result: {
        gate: 2,
        layer: "LAYER_2_PLAN_AND_STANDING",
        passed: false,
        failureCode: "SOURCE_CUSTOM_PER_PARTNER_NOT_ALLOWED_BY_PLAN",
        reason: `Source store plan (${sourcePlanId}) does not allow custom per-partner product lists.`,
      },
      sourcePlanId,
      entitlement,
      sharedProductsResolution,
    };
  }

  if (sharedProductsResolution.exceedsPerPartnershipCap) {
    return {
      result: {
        gate: 2,
        layer: "LAYER_2_PLAN_AND_STANDING",
        passed: false,
        failureCode: "SOURCE_MAX_PRODUCTS_PER_PARTNERSHIP_EXCEEDED",
        reason: `Source store plan (${sourcePlanId}) allows at most ${entitlement.maxProductsPerPartnership} shared products per partnership (configured ${sharedProductsResolution.configuredProductIds.length}).`,
      },
      sourcePlanId,
      entitlement,
      sharedProductsResolution,
    };
  }

  if (productId) {
    if (!sharedProductsResolution.allowedProductIdsWithinPlanCap.includes(productId)) {
      return {
        result: {
          gate: 2,
          layer: "LAYER_2_PLAN_AND_STANDING",
          passed: false,
          failureCode: "PRODUCT_NOT_IN_PARTNERSHIP_SHARED_LIST",
          reason: `Product ${productId} is not in the active shared product collection for this partnership or exceeds the per-partnership limit (${entitlement.maxProductsPerPartnership}).`,
        },
        sourcePlanId,
        entitlement,
        sharedProductsResolution,
      };
    }
  }

  return {
    result: {
      gate: 2,
      layer: "LAYER_2_PLAN_AND_STANDING",
      passed: true,
    },
    sourcePlanId,
    entitlement,
    sharedProductsResolution,
  };
}

/**
 * GATE 3 (Layer 2B): Host Merchant Subscription Plan, Standing & Partner Limit
 */
export function evaluateGate3HostMerchantEligibility(params: {
  globalConfig: PartnerPicksGlobalConfig;
  sourceStore?: MerchantStore | null;
  hostStore?: MerchantStore | null;
  allPartnerships?: PartnerPicksPartnership[];
  channelId?: PartnerPickChannelId | null;
  nowMs?: number;
}): {
  result: PartnerPicksGateEvaluationResult;
  hostPlanId: CanonicalSubscriptionPlanId;
  entitlement: PlanPartnerPicksEntitlement;
} {
  const {
    globalConfig,
    sourceStore,
    hostStore,
    allPartnerships = [],
    channelId,
    nowMs = Date.now(),
  } = params;

  const hostPlanId = resolveStoreSubscriptionPlan(hostStore || undefined);
  const entitlement = globalConfig.planEntitlements[hostPlanId];

  const standing = evaluateStoreAccountStanding(hostStore, "HOST");
  if (!standing.valid) {
    return {
      result: {
        gate: 3,
        layer: "LAYER_2_PLAN_AND_STANDING",
        passed: false,
        failureCode: standing.failureCode,
        reason: standing.reason,
      },
      hostPlanId,
      entitlement,
    };
  }

  if (sourceStore?.id && hostStore!.id === sourceStore.id) {
    return {
      result: {
        gate: 3,
        layer: "LAYER_2_PLAN_AND_STANDING",
        passed: false,
        failureCode: "SAME_SOURCE_AND_HOST_STORE",
        reason: "Source store and Host store must be two distinct merchant stores.",
      },
      hostPlanId,
      entitlement,
    };
  }

  if (!entitlement || !entitlement.enabled || entitlement.maxActivePartnerStores <= 0) {
    return {
      result: {
        gate: 3,
        layer: "LAYER_2_PLAN_AND_STANDING",
        passed: false,
        failureCode: "HOST_PLAN_NOT_ELIGIBLE",
        reason: `Host store subscription plan (${hostPlanId}) is not eligible for Partner Picks.`,
      },
      hostPlanId,
      entitlement,
    };
  }

  const activePartnershipsForHost = allPartnerships.filter(
    (p) =>
      p &&
      p.status === "ACTIVE" &&
      !p.suspendedByAdminId &&
      (!p.expiresAt || Date.parse(p.expiresAt) > nowMs) &&
      (p.storeAId === hostStore!.id || p.storeBId === hostStore!.id)
  );
  const distinctActivePartnerIds = new Set<string>();
  for (const p of activePartnershipsForHost) {
    const otherId = p.storeAId === hostStore!.id ? p.storeBId : p.storeAId;
    if (otherId) distinctActivePartnerIds.add(otherId);
  }

  const isSourceAlreadyActivePartner = Boolean(
    sourceStore?.id && distinctActivePartnerIds.has(sourceStore.id)
  );
  const effectivePartnerCount = isSourceAlreadyActivePartner
    ? distinctActivePartnerIds.size
    : sourceStore?.id
    ? distinctActivePartnerIds.size + 1
    : distinctActivePartnerIds.size;

  if (effectivePartnerCount > entitlement.maxActivePartnerStores) {
    return {
      result: {
        gate: 3,
        layer: "LAYER_2_PLAN_AND_STANDING",
        passed: false,
        failureCode: "HOST_MAX_ACTIVE_PARTNERS_EXCEEDED",
        reason: `Host store (${hostPlanId}) allows at most ${entitlement.maxActivePartnerStores} active partner stores (attempted ${effectivePartnerCount}).`,
      },
      hostPlanId,
      entitlement,
    };
  }

  if (channelId && !entitlement.allowedChannelsAsHost[channelId]) {
    return {
      result: {
        gate: 3,
        layer: "LAYER_2_PLAN_AND_STANDING",
        passed: false,
        failureCode: "HOST_CHANNEL_NOT_ALLOWED_BY_PLAN",
        reason: `Host store plan (${hostPlanId}) does not allow hosting Partner Picks in channel ${channelId}.`,
      },
      hostPlanId,
      entitlement,
    };
  }

  return {
    result: {
      gate: 3,
      layer: "LAYER_2_PLAN_AND_STANDING",
      passed: true,
    },
    hostPlanId,
    entitlement,
  };
}

/**
 * GATE 4 (Layer 3A): Bilateral Partnership Status, Directional Channel Agreement, Host Consent & Confirmed Stories Prerequisite
 */
export function evaluateGate4BilateralPartnershipAndConsent(params: {
  globalConfig: PartnerPicksGlobalConfig;
  sourceStore?: MerchantStore | null;
  hostStore?: MerchantStore | null;
  hostProfile?: Partial<MerchantPartnerPicksProfile> | null;
  partnership?: PartnerPicksPartnership | null;
  channelId: PartnerPickChannelId;
  storiesEnabledMap?: StoriesEnabledMap | null;
  nowMs?: number;
}): {
  result: PartnerPicksGateEvaluationResult;
  direction: "A_ON_B" | "B_ON_A" | null;
} {
  const {
    globalConfig,
    sourceStore,
    hostStore,
    hostProfile,
    partnership,
    channelId,
    storiesEnabledMap,
    nowMs = Date.now(),
  } = params;

  if (!partnership) {
    return {
      result: {
        gate: 4,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "PARTNERSHIP_MISSING",
        reason: "No Partner Picks partnership record exists between these stores.",
      },
      direction: null,
    };
  }

  const sId = sourceStore?.id;
  const hId = hostStore?.id;
  let direction: "A_ON_B" | "B_ON_A" | null = null;
  if (sId && hId) {
    if (partnership.storeAId === sId && partnership.storeBId === hId) {
      direction = "A_ON_B";
    } else if (partnership.storeBId === sId && partnership.storeAId === hId) {
      direction = "B_ON_A";
    }
  }

  if (!direction) {
    return {
      result: {
        gate: 4,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "PARTNERSHIP_STORE_MISMATCH",
        reason: "Partnership record does not match the specified source and host stores.",
      },
      direction: null,
    };
  }

  if (partnership.status === "SUSPENDED" || Boolean(partnership.suspendedByAdminId)) {
    return {
      result: {
        gate: 4,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "PARTNERSHIP_SUSPENDED_BY_ADMIN",
        reason: "This partnership is currently suspended by Platform Admin.",
      },
      direction,
    };
  }

  if (partnership.status !== "ACTIVE") {
    return {
      result: {
        gate: 4,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "PARTNERSHIP_NOT_ACTIVE",
        reason: `Partnership status is ${partnership.status} (must be ACTIVE).`,
      },
      direction,
    };
  }

  if (partnership.expiresAt) {
    const expMs = Date.parse(partnership.expiresAt);
    if (!Number.isNaN(expMs) && expMs <= nowMs) {
      return {
        result: {
          gate: 4,
          layer: "LAYER_3_BILATERAL_AND_PRODUCT",
          passed: false,
          failureCode: "PARTNERSHIP_EXPIRED",
          reason: "This partnership agreement has expired.",
        },
        direction,
      };
    }
  }

  const terms = partnership.agreementTerms;
  if (
    !terms ||
    terms.agreedByStoreA !== true ||
    terms.agreedByStoreB !== true
  ) {
    return {
      result: {
        gate: 4,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "PARTNERSHIP_TERMS_NOT_MUTUALLY_AGREED",
        reason: "Both merchants must mutually agree to partnership terms before placements can go live.",
      },
      direction,
    };
  }

  const agreedDirectionalChannels =
    direction === "A_ON_B"
      ? terms.enabledChannelsAOnB
      : terms.enabledChannelsBOnA;

  if (!agreedDirectionalChannels || agreedDirectionalChannels[channelId] !== true) {
    return {
      result: {
        gate: 4,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "PARTNERSHIP_CHANNEL_NOT_AGREED_FOR_DIRECTION",
        reason: `Channel ${channelId} is not enabled for direction ${direction} in the bilateral partnership terms.`,
      },
      direction,
    };
  }

  const normalizedHostProfile = normalizeMerchantPartnerPicksProfile(
    hId!,
    hostProfile || createDefaultMerchantPartnerPicksProfile(hId!)
  );

  if (!normalizedHostProfile.hostChannelConsent[channelId]) {
    return {
      result: {
        gate: 4,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "HOST_CHANNEL_CONSENT_DISABLED",
        reason: `Host store has disabled hosting Partner Picks on channel ${channelId}.`,
      },
      direction,
    };
  }

  if (
    channelId === "REELS_FEED" &&
    !normalizedHostProfile.hostSequentialMediaConsent.reelsInsertionEnabled
  ) {
    return {
      result: {
        gate: 4,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "HOST_REELS_INSERTION_DISABLED",
        reason: "Host store has disabled Partner Picks insertion in Reels Feed.",
      },
      direction,
    };
  }

  if (channelId === "STORIES") {
    if (!normalizedHostProfile.hostSequentialMediaConsent.storiesInsertionEnabled) {
      return {
        result: {
          gate: 4,
          layer: "LAYER_3_BILATERAL_AND_PRODUCT",
          passed: false,
          failureCode: "HOST_STORIES_INSERTION_DISABLED",
          reason: "Host store has disabled Partner Picks insertion in Stories.",
        },
        direction,
      };
    }

    // CONFIRMED STORIES PREREQUISITE (Revision 3 Section F / Channel 5):
    // Partner Picks Stories are available ONLY when the host merchant has enabled the native Stories feature.
    // The host merchant does NOT need to have an actively published native Story at every moment.
    const requireHostStoriesEnabled =
      globalConfig.channels.STORIES.sequentialMediaRules
        ?.requireHostStoriesFeatureEnabled !== false;

    const hostNativeStoriesEnabled = isProfileStoriesEnabled(
      hostStore,
      storiesEnabledMap,
      hostStore
    );

    if (requireHostStoriesEnabled && !hostNativeStoriesEnabled) {
      return {
        result: {
          gate: 4,
          layer: "LAYER_3_BILATERAL_AND_PRODUCT",
          passed: false,
          failureCode: "HOST_NATIVE_STORIES_FEATURE_DISABLED",
          reason:
            "Partner Picks Stories require the host merchant to have enabled YUME's native Stories feature.",
        },
        direction,
      };
    }
  }

  return {
    result: {
      gate: 4,
      layer: "LAYER_3_BILATERAL_AND_PRODUCT",
      passed: true,
    },
    direction,
  };
}

/**
 * Enforces the confirmed Stories restriction:
 * Never create a misleading standalone Story Ring containing only promotional Partner Picks content.
 * Returns true ONLY if the host store has native Stories enabled AND at least 1 genuine native published Story exists.
 */
export function canRenderHostStoryRingOnAvatar(params: {
  hostStore?: MerchantStore | null;
  storiesEnabledMap?: StoriesEnabledMap | null;
  genuineNativePublishedStoriesCount: number;
}): boolean {
  const { hostStore, storiesEnabledMap, genuineNativePublishedStoriesCount } = params;
  if (!isProfileStoriesEnabled(hostStore, storiesEnabledMap, hostStore)) {
    return false;
  }
  // Even if Partner Picks Stories are eligible for runtime injection,
  // a standalone Story Ring must NEVER appear when genuineNativePublishedStoriesCount <= 0.
  return genuineNativePublishedStoriesCount > 0;
}

/**
 * Enforces the approved Stories runtime injection decision:
 * - Partner Picks global + STORIES channel must be enabled.
 * - Host merchant must have native Stories feature enabled (`isProfileStoriesEnabled`).
 * - Host merchant does NOT need actively published native stories at every moment for eligibility,
 *   though runtime injection only triggers when opening an active Stories viewer sequence and
 *   never creates a misleading standalone Story Ring when native stories = 0.
 */
export function shouldInjectPartnerPickIntoStoriesSequence(params: {
  globalConfig: PartnerPicksGlobalConfig;
  hostStore?: MerchantStore | null;
  storiesEnabledMap?: StoriesEnabledMap | null;
  eligiblePartnerStorySlidesCount: number;
}): boolean {
  const {
    globalConfig,
    hostStore,
    storiesEnabledMap,
    eligiblePartnerStorySlidesCount,
  } = params;
  if (!globalConfig.featureEnabled || !globalConfig.channels.STORIES?.enabled) {
    return false;
  }
  if (!hostStore) return false;
  if (!isProfileStoriesEnabled(hostStore, storiesEnabledMap, hostStore)) {
    return false;
  }
  return eligiblePartnerStorySlidesCount > 0;
}

/**
 * GATE 5 (Layer 3B): Two-Sided Placement Approval & Spatial/Sequential Scope
 */
export function evaluateGate5TwoSidedPlacementApproval(params: {
  globalConfig: PartnerPicksGlobalConfig;
  sourceStore?: MerchantStore | null;
  hostStore?: MerchantStore | null;
  hostProfile?: Partial<MerchantPartnerPicksProfile> | null;
  partnership?: PartnerPicksPartnership | null;
  placement?: PartnerPickProductPlacement | null;
  channelId: PartnerPickChannelId;
  productId?: string | null;
  currentProductGridPage?: number;
}): PartnerPicksGateEvaluationResult {
  const {
    globalConfig,
    sourceStore,
    hostStore,
    hostProfile,
    partnership,
    placement,
    channelId,
    productId,
    currentProductGridPage = 1,
  } = params;

  if (!placement) {
    return {
      gate: 5,
      layer: "LAYER_3_BILATERAL_AND_PRODUCT",
      passed: false,
      failureCode: "PLACEMENT_MISSING",
      reason: "Product placement record is missing.",
    };
  }

  if (partnership && placement.partnershipId !== partnership.id) {
    return {
      gate: 5,
      layer: "LAYER_3_BILATERAL_AND_PRODUCT",
      passed: false,
      failureCode: "PLACEMENT_PARTNERSHIP_MISMATCH",
      reason: "Placement partnershipId does not match the active partnership.",
    };
  }

  if (
    (sourceStore && placement.sourceStoreId !== sourceStore.id) ||
    (hostStore && placement.hostStoreId !== hostStore.id)
  ) {
    return {
      gate: 5,
      layer: "LAYER_3_BILATERAL_AND_PRODUCT",
      passed: false,
      failureCode: "PLACEMENT_STORE_MISMATCH",
      reason: "Placement sourceStoreId or hostStoreId does not match the evaluated stores.",
    };
  }

  if (placement.channelId !== channelId) {
    return {
      gate: 5,
      layer: "LAYER_3_BILATERAL_AND_PRODUCT",
      passed: false,
      failureCode: "PLACEMENT_CHANNEL_MISMATCH",
      reason: `Placement channel (${placement.channelId}) does not match requested channel (${channelId}).`,
    };
  }

  if (productId && placement.productId !== productId) {
    return {
      gate: 5,
      layer: "LAYER_3_BILATERAL_AND_PRODUCT",
      passed: false,
      failureCode: "PLACEMENT_PRODUCT_MISMATCH",
      reason: `Placement productId (${placement.productId}) does not match evaluated productId (${productId}).`,
    };
  }

  if (!placement.selectedOptionId) {
    return {
      gate: 5,
      layer: "LAYER_3_BILATERAL_AND_PRODUCT",
      passed: false,
      failureCode: "PLACEMENT_AWAITING_HOST_SELECTION",
      reason: "Host merchant has not yet selected a proposed placement option.",
    };
  }

  const matchedOption = Array.isArray(placement.proposedOptions)
    ? placement.proposedOptions.find(
        (opt) =>
          opt &&
          opt.optionId === placement.selectedOptionId &&
          opt.channelId === channelId
      )
    : undefined;

  if (!matchedOption) {
    return {
      gate: 5,
      layer: "LAYER_3_BILATERAL_AND_PRODUCT",
      passed: false,
      failureCode: "PLACEMENT_SELECTED_OPTION_NOT_IN_PROPOSALS",
      reason:
        "Host merchant selected an option that was not in the source merchant's proposed options for this channel.",
    };
  }

  if (!placement.proposerFinalApproved) {
    return {
      gate: 5,
      layer: "LAYER_3_BILATERAL_AND_PRODUCT",
      passed: false,
      failureCode: "PLACEMENT_AWAITING_PROPOSER_FINAL_APPROVAL",
      reason:
        "Placement has been selected by the host merchant and is awaiting final confirmation from the source merchant.",
    };
  }

  if (
    placement.lifecycleState !== "APPROVED_LIVE" ||
    placement.trafficLight !== "GREEN"
  ) {
    return {
      gate: 5,
      layer: "LAYER_3_BILATERAL_AND_PRODUCT",
      passed: false,
      failureCode: "PLACEMENT_NOT_APPROVED_LIVE",
      reason: `Placement is in state ${placement.lifecycleState} (${placement.trafficLight}) rather than APPROVED_LIVE (GREEN).`,
    };
  }

  // Spatial rules & Page 1 scope checks for spatial storefront channels
  const normalizedHostProfile = hostStore
    ? normalizeMerchantPartnerPicksProfile(
        hostStore.id,
        hostProfile || createDefaultMerchantPartnerPicksProfile(hostStore.id)
      )
    : null;

  if (channelId === "PRODUCT_GRID") {
    const gridScope =
      globalConfig.channels.PRODUCT_GRID.spatialPlacementRules?.gridPageScope ||
      "PAGE_1_ONLY";
    if (gridScope === "PAGE_1_ONLY" && currentProductGridPage > 1) {
      return {
        gate: 5,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "PLACEMENT_GRID_PAGE_OUT_OF_SCOPE",
        reason: "Store Product Grid placements are scoped to Page 1 only.",
      };
    }

    if (matchedOption.gridCoordinate && normalizedHostProfile) {
      const { row, col } = matchedOption.gridCoordinate;
      const minRow =
        globalConfig.channels.PRODUCT_GRID.spatialPlacementRules?.minGridRow ?? 1;
      const maxRow =
        globalConfig.channels.PRODUCT_GRID.spatialPlacementRules?.maxGridRow ?? 20;
      const hostAllowsCoord =
        normalizedHostProfile.hostSpatialAllowedSlots.gridCoordinates.some(
          (c) => c.row === row && c.col === col
        );
      if (row < minRow || row > maxRow || !hostAllowsCoord) {
        return {
          gate: 5,
          layer: "LAYER_3_BILATERAL_AND_PRODUCT",
          passed: false,
          failureCode: "PLACEMENT_SLOT_NOT_ALLOWED_BY_HOST",
          reason: `Grid coordinate (Row ${row}, Col ${col}) is outside allowed host or platform spatial bounds.`,
        };
      }
    }
  } else if (
    channelId === "STORE_BANNER" &&
    typeof matchedOption.bannerSlotIndex === "number" &&
    normalizedHostProfile
  ) {
    const hostAllowsBannerSlot =
      normalizedHostProfile.hostSpatialAllowedSlots.bannerSlotIndices.includes(
        matchedOption.bannerSlotIndex
      );
    if (!hostAllowsBannerSlot) {
      return {
        gate: 5,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "PLACEMENT_SLOT_NOT_ALLOWED_BY_HOST",
        reason: `Store Banner slot index ${matchedOption.bannerSlotIndex} is not enabled by the host store.`,
      };
    }
  } else if (
    channelId === "DISCOVER_MORE" &&
    typeof matchedOption.discoverCarouselIndex === "number" &&
    normalizedHostProfile
  ) {
    const hostAllowsCarouselSlot =
      normalizedHostProfile.hostSpatialAllowedSlots.discoverCarouselIndices.includes(
        matchedOption.discoverCarouselIndex
      );
    if (!hostAllowsCarouselSlot) {
      return {
        gate: 5,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "PLACEMENT_SLOT_NOT_ALLOWED_BY_HOST",
        reason: `Discover More Products carousel slot ${matchedOption.discoverCarouselIndex} is not enabled by the host store.`,
      };
    }
  }

  return {
    gate: 5,
    layer: "LAYER_3_BILATERAL_AND_PRODUCT",
    passed: true,
  };
}

/**
 * Calculates effective available stock for a Product (accounting for base `stock` or variant/color inventory).
 */
export function resolveEffectiveProductStock(product: Product): number {
  if (!product || typeof product !== "object") return 0;

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const variantStockSum = product.variants.reduce((sum, v) => {
      const s = typeof v?.stock === "number" && !Number.isNaN(v.stock) ? v.stock : 0;
      return sum + Math.max(0, s);
    }, 0);
    if (variantStockSum > 0) return variantStockSum;
    if (typeof product.stock === "number" && product.stock <= 0) return 0;
    return variantStockSum;
  }

  if (
    product.colorStockTrackingEnabled &&
    Array.isArray(product.colors) &&
    product.colors.length > 0
  ) {
    const hasExplicitColorStocks = product.colors.some(
      (c) => typeof c?.stock === "number"
    );
    if (hasExplicitColorStocks) {
      return product.colors.reduce((sum, c) => {
        const s = typeof c?.stock === "number" && !Number.isNaN(c.stock) ? c.stock : 0;
        return sum + Math.max(0, s);
      }, 0);
    }
  }

  return typeof product.stock === "number" && !Number.isNaN(product.stock)
    ? product.stock
    : 0;
}

/**
 * GATE 6 (Layer 3C): Live Product Reference Integrity & 6-State Product Availability Classifier
 *
 * Explicitly distinguishes all 6 product unavailability causes (Section I):
 * - Case A: Temporary stock unavailability (`AUTO_PAUSED_OUT_OF_STOCK`) — ONLY state eligible for automatic resumption
 * - Case B: Intentional product hiding by owner (`PAUSED_OWNER_HIDDEN`)
 * - Case C: Product disabling / draft by owner (`PAUSED_OWNER_DISABLED`)
 * - Case D: Product archiving by owner (`PAUSED_OWNER_ARCHIVED`)
 * - Case E: Product removal / deletion by owner (`INVALIDATED_PRODUCT_REMOVED`)
 * - Case F: Product suspension by Platform Admin (`SUSPENDED_BY_PLATFORM_ADMIN`)
 */
export function evaluateGate6LiveProductIntegrity(params: {
  sourceStore?: MerchantStore | null;
  productId?: string | null;
  placement?: PartnerPickProductPlacement | null;
}): {
  result: PartnerPicksGateEvaluationResult;
  liveProduct: Product | null;
  detectedCase:
    | "LIVE_ELIGIBLE"
    | "CASE_A_OUT_OF_STOCK"
    | "CASE_B_OWNER_HIDDEN"
    | "CASE_C_OWNER_DISABLED"
    | "CASE_D_OWNER_ARCHIVED"
    | "CASE_E_PRODUCT_REMOVED"
    | "CASE_F_ADMIN_SUSPENDED";
  targetLifecycleStateIfPaused: PlacementLifecycleState | null;
} {
  const { sourceStore, productId, placement } = params;
  const targetId = productId || placement?.productId;

  const liveProduct =
    sourceStore && Array.isArray(sourceStore.products) && targetId
      ? sourceStore.products.find((p) => p && p.id === targetId) || null
      : null;

  const rawProd = (liveProduct as unknown) as Record<string, unknown> | null;

  // Case E: Product removed or deleted from source store's catalog
  if (
    !liveProduct ||
    rawProd?.isDeleted === true ||
    rawProd?.deleted === true ||
    rawProd?.removed === true
  ) {
    return {
      result: {
        gate: 6,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "PRODUCT_REMOVED_OR_MISSING_CASE_E",
        reason: "Original product was removed from the source merchant's catalog (Case E).",
      },
      liveProduct: null,
      detectedCase: "CASE_E_PRODUCT_REMOVED",
      targetLifecycleStateIfPaused: "INVALIDATED_PRODUCT_REMOVED",
    };
  }

  // Case F: Suspended by Platform Admin
  if (
    placement?.lifecycleState === "SUSPENDED_BY_PLATFORM_ADMIN" ||
    liveProduct.safe === false ||
    liveProduct.isSafe === false ||
    Boolean(liveProduct.moderation_reason || liveProduct.moderationReason) ||
    rawProd?.adminSuspended === true ||
    rawProd?.suspendedByAdmin === true
  ) {
    return {
      result: {
        gate: 6,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "PRODUCT_SUSPENDED_BY_ADMIN_CASE_F",
        reason:
          "Product or placement is suspended by Platform Admin moderation/governance (Case F).",
      },
      liveProduct,
      detectedCase: "CASE_F_ADMIN_SUSPENDED",
      targetLifecycleStateIfPaused: "SUSPENDED_BY_PLATFORM_ADMIN",
    };
  }

  // Case D: Archived by Owner
  if (
    rawProd?.archived === true ||
    rawProd?.isArchived === true ||
    (liveProduct.status as string) === "archived"
  ) {
    return {
      result: {
        gate: 6,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "PRODUCT_ARCHIVED_BY_OWNER_CASE_D",
        reason: "Original product was archived by the source merchant (Case D).",
      },
      liveProduct,
      detectedCase: "CASE_D_OWNER_ARCHIVED",
      targetLifecycleStateIfPaused: "PAUSED_OWNER_ARCHIVED",
    };
  }

  // Case C: Disabled or set to Draft by Owner
  if (
    liveProduct.status === "draft" ||
    (liveProduct.status as string) === "disabled" ||
    rawProd?.disabled === true ||
    rawProd?.isDisabled === true ||
    rawProd?.enabled === false
  ) {
    return {
      result: {
        gate: 6,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "PRODUCT_DISABLED_BY_OWNER_CASE_C",
        reason: "Original product is disabled or in draft mode by the source merchant (Case C).",
      },
      liveProduct,
      detectedCase: "CASE_C_OWNER_DISABLED",
      targetLifecycleStateIfPaused: "PAUSED_OWNER_DISABLED",
    };
  }

  // Case B: Intentionally Hidden by Owner
  if (
    liveProduct.isVisible === false ||
    rawProd?.hidden === true ||
    rawProd?.isHidden === true
  ) {
    return {
      result: {
        gate: 6,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "PRODUCT_HIDDEN_BY_OWNER_CASE_B",
        reason: "Original product is intentionally hidden by the source merchant (Case B).",
      },
      liveProduct,
      detectedCase: "CASE_B_OWNER_HIDDEN",
      targetLifecycleStateIfPaused: "PAUSED_OWNER_HIDDEN",
    };
  }

  // Case A: Temporary Stock Unavailability (stock <= 0 while product remains active & publicly visible)
  const effectiveStock = resolveEffectiveProductStock(liveProduct);
  if (effectiveStock <= 0) {
    return {
      result: {
        gate: 6,
        layer: "LAYER_3_BILATERAL_AND_PRODUCT",
        passed: false,
        failureCode: "PRODUCT_OUT_OF_STOCK_CASE_A",
        reason: "Original product is temporarily out of stock (Case A).",
      },
      liveProduct,
      detectedCase: "CASE_A_OUT_OF_STOCK",
      targetLifecycleStateIfPaused: "AUTO_PAUSED_OUT_OF_STOCK",
    };
  }

  return {
    result: {
      gate: 6,
      layer: "LAYER_3_BILATERAL_AND_PRODUCT",
      passed: true,
    },
    liveProduct,
    detectedCase: "LIVE_ELIGIBLE",
    targetLifecycleStateIfPaused: null,
  };
}

/**
 * Full 6-Gate Bilateral 3-Layer Eligibility Evaluator.
 * Used identically on server and client to determine if a Partner Pick placement can be active/rendered.
 */
export function evaluateBilateralPlacementEligibility(
  input: EvaluateBilateralEligibilityInput
): BilateralPlacementEligibilityEvaluation {
  const globalConfig = normalizePartnerPicksGlobalConfig(input.globalConfig);
  const targetProductId = input.productId ?? input.placement?.productId ?? null;

  const gate1 = evaluateGate1GlobalAndChannelAdmin(globalConfig, input.channelId);

  const gate2Eval = evaluateGate2SourceMerchantEligibility({
    globalConfig,
    sourceStore: input.sourceStore,
    sourceProfile: input.sourceProfile,
    partnershipId: input.partnership?.id ?? input.placement?.partnershipId ?? null,
    targetPartnerStoreId: input.hostStore?.id ?? input.placement?.hostStoreId ?? null,
    allPartnerships:
      input.allPartnerships ?? (input.partnership ? [input.partnership] : []),
    channelId: input.channelId,
    productId: targetProductId,
    nowMs: input.nowMs,
  });

  const gate3Eval = evaluateGate3HostMerchantEligibility({
    globalConfig,
    sourceStore: input.sourceStore,
    hostStore: input.hostStore,
    allPartnerships:
      input.allPartnerships ?? (input.partnership ? [input.partnership] : []),
    channelId: input.channelId,
    nowMs: input.nowMs,
  });

  const gate4Eval = evaluateGate4BilateralPartnershipAndConsent({
    globalConfig,
    sourceStore: input.sourceStore,
    hostStore: input.hostStore,
    hostProfile: input.hostProfile,
    partnership: input.partnership,
    channelId: input.channelId,
    storiesEnabledMap: input.storiesEnabledMap,
    nowMs: input.nowMs,
  });

  const gate6Eval = evaluateGate6LiveProductIntegrity({
    sourceStore: input.sourceStore,
    productId: targetProductId,
    placement: input.placement,
  });

  const gate5 = evaluateGate5TwoSidedPlacementApproval({
    globalConfig,
    sourceStore: input.sourceStore,
    hostStore: input.hostStore,
    hostProfile: input.hostProfile,
    partnership: input.partnership,
    placement: input.placement,
    channelId: input.channelId,
    productId: targetProductId,
    currentProductGridPage: input.currentProductGridPage,
  });

  const orderedGates: PartnerPicksGateEvaluationResult[] = [
    gate1,
    gate2Eval.result,
    gate3Eval.result,
    gate4Eval.result,
    gate5,
    gate6Eval.result,
  ];

  const firstFailed = orderedGates.find((g) => !g.passed) || null;

  return {
    eligible: firstFailed === null,
    failedGate: firstFailed ? firstFailed.gate : null,
    failureCode: firstFailed?.failureCode ?? null,
    failureReason: firstFailed?.reason ?? null,
    sourcePlanId: gate2Eval.sourcePlanId,
    hostPlanId: gate3Eval.hostPlanId,
    direction: gate4Eval.direction,
    resolvedSharedProductIdsForPartnership:
      gate2Eval.sharedProductsResolution.allowedProductIdsWithinPlanCap,
    detectedProductLifecycleCase: gate6Eval.detectedCase,
    recommendedPlacementLifecycleState:
      gate6Eval.targetLifecycleStateIfPaused ??
      (firstFailed === null ? "APPROVED_LIVE" : input.placement?.lifecycleState ?? null),
    gates: {
      gate1GlobalAndChannel: gate1,
      gate2SourcePlanAndLimits: gate2Eval.result,
      gate3HostPlanAndLimits: gate3Eval.result,
      gate4PartnershipAndConsent: gate4Eval.result,
      gate5TwoSidedPlacementApproval: gate5,
      gate6LiveProductIntegrity: gate6Eval.result,
    },
  };
}

/**
 * Evaluates automatic state transitions and safe stock resumption for an existing placement
 * under the 6-State Live Product Availability Model (Section I).
 *
 * Confirmed Invariants:
 * 1. If a live placement's product becomes unavailable, it transitions to the exact Case A-F state
 *    without terminating the partnership.
 * 2. When stock returns (`stock > 0`), automatic resumption back to `APPROVED_LIVE` (`GREEN`) is allowed
 *    ONLY IF:
 *    - The placement's current state is `AUTO_PAUSED_OUT_OF_STOCK` (Case A)
 *    - Both sides had previously completed two-sided approval (`selectedOptionId` + `proposerFinalApproved === true`)
 *    - The product is currently active, publicly visible, not hidden/disabled/archived/removed/admin-suspended
 *    - Gates 1, 2, 3, and 4 all currently pass.
 * 3. Placements in `PAUSED_OWNER_HIDDEN` (Case B), `PAUSED_OWNER_DISABLED` (Case C),
 *    `PAUSED_OWNER_ARCHIVED` (Case D), `INVALIDATED_PRODUCT_REMOVED` (Case E), or
 *    `SUSPENDED_BY_PLATFORM_ADMIN` (Case F) NEVER automatically resume when stock changes.
 */
export function evaluatePlacementProductLifecycleTransition(
  input: EvaluateBilateralEligibilityInput & {
    placement: PartnerPickProductPlacement;
  }
): {
  changed: boolean;
  previousState: PlacementLifecycleState;
  nextState: PlacementLifecycleState;
  nextTrafficLight: "GREEN" | "YELLOW" | "RED";
  transitionAction:
    | "NO_CHANGE"
    | "AUTO_PAUSED_OUT_OF_STOCK"
    | "AUTO_RESUMED_IN_STOCK"
    | "PAUSED_OWNER_HIDDEN"
    | "PAUSED_OWNER_DISABLED"
    | "PAUSED_OWNER_ARCHIVED"
    | "INVALIDATED_PRODUCT_REMOVED"
    | "SUSPENDED_BY_ADMIN";
  reason: string;
} {
  const { placement } = input;
  const previousState = placement.lifecycleState;
  const globalConfig = normalizePartnerPicksGlobalConfig(input.globalConfig);

  const gate6Eval = evaluateGate6LiveProductIntegrity({
    sourceStore: input.sourceStore,
    productId: placement.productId,
    placement,
  });

  // 1. Permanent invalidation (Case E) or Admin Suspension (Case F) always takes precedence
  if (gate6Eval.detectedCase === "CASE_E_PRODUCT_REMOVED") {
    const nextState: PlacementLifecycleState = "INVALIDATED_PRODUCT_REMOVED";
    return {
      changed: previousState !== nextState,
      previousState,
      nextState,
      nextTrafficLight: resolveTrafficLightForPlacementState(nextState),
      transitionAction:
        previousState !== nextState ? "INVALIDATED_PRODUCT_REMOVED" : "NO_CHANGE",
      reason: gate6Eval.result.reason || "Original product was removed.",
    };
  }

  if (gate6Eval.detectedCase === "CASE_F_ADMIN_SUSPENDED") {
    const nextState: PlacementLifecycleState = "SUSPENDED_BY_PLATFORM_ADMIN";
    return {
      changed: previousState !== nextState,
      previousState,
      nextState,
      nextTrafficLight: resolveTrafficLightForPlacementState(nextState),
      transitionAction:
        previousState !== nextState ? "SUSPENDED_BY_ADMIN" : "NO_CHANGE",
      reason: gate6Eval.result.reason || "Suspended by Platform Admin.",
    };
  }

  // 2. If placement is currently in an intentional owner pause state (Cases B, C, D) or Admin suspension (Case F)
  // or rejected/unapproved state, stock changes MUST NEVER auto-resume it to APPROVED_LIVE.
  if (
    previousState === "PAUSED_OWNER_HIDDEN" ||
    previousState === "PAUSED_OWNER_DISABLED" ||
    previousState === "PAUSED_OWNER_ARCHIVED" ||
    previousState === "INVALIDATED_PRODUCT_REMOVED" ||
    previousState === "SUSPENDED_BY_PLATFORM_ADMIN" ||
    previousState === "PROPOSED_AWAITING_HOST_SELECTION" ||
    previousState === "HOST_SELECTED_AWAITING_FINAL_APPROVAL" ||
    previousState === "REJECTED_BY_HOST" ||
    previousState === "REJECTED_BY_PROPOSER"
  ) {
    // However, if an already-paused placement escalates to a stricter owner state (e.g. from hidden to archived),
    // reflect the more specific owner state without ever auto-resuming to APPROVED_LIVE.
    if (
      previousState === "PAUSED_OWNER_HIDDEN" ||
      previousState === "PAUSED_OWNER_DISABLED" ||
      previousState === "PAUSED_OWNER_ARCHIVED"
    ) {
      if (
        gate6Eval.detectedCase === "CASE_D_OWNER_ARCHIVED" &&
        previousState !== "PAUSED_OWNER_ARCHIVED"
      ) {
        return {
          changed: true,
          previousState,
          nextState: "PAUSED_OWNER_ARCHIVED",
          nextTrafficLight: "YELLOW",
          transitionAction: "PAUSED_OWNER_ARCHIVED",
          reason: gate6Eval.result.reason || "Product archived by owner.",
        };
      }
    }

    return {
      changed: false,
      previousState,
      nextState: previousState,
      nextTrafficLight: resolveTrafficLightForPlacementState(previousState),
      transitionAction: "NO_CHANGE",
      reason: `State ${previousState} is not eligible for automatic stock resumption.`,
    };
  }

  // 3. If placement is currently APPROVED_LIVE and product encounters Case A, B, C, or D:
  if (previousState === "APPROVED_LIVE") {
    if (gate6Eval.detectedCase === "CASE_D_OWNER_ARCHIVED") {
      return {
        changed: true,
        previousState,
        nextState: "PAUSED_OWNER_ARCHIVED",
        nextTrafficLight: "YELLOW",
        transitionAction: "PAUSED_OWNER_ARCHIVED",
        reason: gate6Eval.result.reason || "Product archived by owner.",
      };
    }
    if (gate6Eval.detectedCase === "CASE_C_OWNER_DISABLED") {
      return {
        changed: true,
        previousState,
        nextState: "PAUSED_OWNER_DISABLED",
        nextTrafficLight: "YELLOW",
        transitionAction: "PAUSED_OWNER_DISABLED",
        reason: gate6Eval.result.reason || "Product disabled by owner.",
      };
    }
    if (gate6Eval.detectedCase === "CASE_B_OWNER_HIDDEN") {
      return {
        changed: true,
        previousState,
        nextState: "PAUSED_OWNER_HIDDEN",
        nextTrafficLight: "YELLOW",
        transitionAction: "PAUSED_OWNER_HIDDEN",
        reason: gate6Eval.result.reason || "Product hidden by owner.",
      };
    }
    if (gate6Eval.detectedCase === "CASE_A_OUT_OF_STOCK") {
      return {
        changed: true,
        previousState,
        nextState: "AUTO_PAUSED_OUT_OF_STOCK",
        nextTrafficLight: "YELLOW",
        transitionAction: "AUTO_PAUSED_OUT_OF_STOCK",
        reason: gate6Eval.result.reason || "Product temporarily out of stock.",
      };
    }
    return {
      changed: false,
      previousState,
      nextState: "APPROVED_LIVE",
      nextTrafficLight: "GREEN",
      transitionAction: "NO_CHANGE",
      reason: "Product remains live and in stock.",
    };
  }

  // 4. Case A (`AUTO_PAUSED_OUT_OF_STOCK`):
  // Check if owner additionally hid, disabled, or archived the product while it was out of stock:
  if (isPlacementStateEligibleForAutoStockResumption(previousState)) {
    if (gate6Eval.detectedCase === "CASE_D_OWNER_ARCHIVED") {
      return {
        changed: true,
        previousState,
        nextState: "PAUSED_OWNER_ARCHIVED",
        nextTrafficLight: "YELLOW",
        transitionAction: "PAUSED_OWNER_ARCHIVED",
        reason: "Product was archived by owner while out of stock.",
      };
    }
    if (gate6Eval.detectedCase === "CASE_C_OWNER_DISABLED") {
      return {
        changed: true,
        previousState,
        nextState: "PAUSED_OWNER_DISABLED",
        nextTrafficLight: "YELLOW",
        transitionAction: "PAUSED_OWNER_DISABLED",
        reason: "Product was disabled by owner while out of stock.",
      };
    }
    if (gate6Eval.detectedCase === "CASE_B_OWNER_HIDDEN") {
      return {
        changed: true,
        previousState,
        nextState: "PAUSED_OWNER_HIDDEN",
        nextTrafficLight: "YELLOW",
        transitionAction: "PAUSED_OWNER_HIDDEN",
        reason: "Product was hidden by owner while out of stock.",
      };
    }

    // If product is now LIVE_ELIGIBLE (stock > 0, active, visible), verify Gates 1-5 before auto-resuming
    if (gate6Eval.detectedCase === "LIVE_ELIGIBLE") {
      const hasTwoSidedApproval =
        Boolean(placement.selectedOptionId) &&
        placement.proposerFinalApproved === true &&
        Array.isArray(placement.proposedOptions) &&
        placement.proposedOptions.some(
          (o) => o && o.optionId === placement.selectedOptionId
        );

      const gate1 = evaluateGate1GlobalAndChannelAdmin(
        globalConfig,
        placement.channelId
      );
      const gate2 = evaluateGate2SourceMerchantEligibility({
        globalConfig,
        sourceStore: input.sourceStore,
        sourceProfile: input.sourceProfile,
        partnershipId: placement.partnershipId,
        targetPartnerStoreId: placement.hostStoreId,
        allPartnerships:
          input.allPartnerships ?? (input.partnership ? [input.partnership] : []),
        channelId: placement.channelId,
        productId: placement.productId,
        nowMs: input.nowMs,
      });
      const gate3 = evaluateGate3HostMerchantEligibility({
        globalConfig,
        sourceStore: input.sourceStore,
        hostStore: input.hostStore,
        allPartnerships:
          input.allPartnerships ?? (input.partnership ? [input.partnership] : []),
        channelId: placement.channelId,
        nowMs: input.nowMs,
      });
      const gate4 = evaluateGate4BilateralPartnershipAndConsent({
        globalConfig,
        sourceStore: input.sourceStore,
        hostStore: input.hostStore,
        hostProfile: input.hostProfile,
        partnership: input.partnership,
        channelId: placement.channelId,
        storiesEnabledMap: input.storiesEnabledMap,
        nowMs: input.nowMs,
      });

      if (
        hasTwoSidedApproval &&
        gate1.passed &&
        gate2.result.passed &&
        gate3.result.passed &&
        gate4.result.passed
      ) {
        return {
          changed: true,
          previousState,
          nextState: "APPROVED_LIVE",
          nextTrafficLight: "GREEN",
          transitionAction: "AUTO_RESUMED_IN_STOCK",
          reason:
            "Product restocked and all bilateral eligibility & visibility gates passed (Case A auto-resumed).",
        };
      }
    }
  }

  return {
    changed: false,
    previousState,
    nextState: previousState,
    nextTrafficLight: resolveTrafficLightForPlacementState(previousState),
    transitionAction: "NO_CHANGE",
    reason: "No placement lifecycle state transition required.",
  };
}

/**
 * Bilateral evaluation for initiating or accepting a partnership between Store A and Store B.
 * Ensures NEITHER merchant's plan grants eligibility to the other merchant.
 */
export function evaluateBilateralPartnershipInitiationEligibility(params: {
  globalConfig?: Partial<PartnerPicksGlobalConfig> | null;
  initiatorStore?: MerchantStore | null;
  targetStore?: MerchantStore | null;
  allPartnerships?: PartnerPicksPartnership[];
  nowMs?: number;
}): {
  eligible: boolean;
  initiatorEligible: boolean;
  targetEligible: boolean;
  initiatorPlanId: CanonicalSubscriptionPlanId;
  targetPlanId: CanonicalSubscriptionPlanId;
  failureCode: PartnerPicksGateFailureCode | null;
  failureReason: string | null;
} {
  const globalConfig = normalizePartnerPicksGlobalConfig(params.globalConfig);

  if (!globalConfig.featureEnabled) {
    return {
      eligible: false,
      initiatorEligible: false,
      targetEligible: false,
      initiatorPlanId: resolveStoreSubscriptionPlan(params.initiatorStore || undefined),
      targetPlanId: resolveStoreSubscriptionPlan(params.targetStore || undefined),
      failureCode: "GLOBAL_FEATURE_DISABLED",
      failureReason: "Partner Picks is globally disabled by Platform Admin.",
    };
  }

  const initiatorEval = evaluateGate2SourceMerchantEligibility({
    globalConfig,
    sourceStore: params.initiatorStore,
    targetPartnerStoreId: params.targetStore?.id ?? null,
    allPartnerships: params.allPartnerships,
    nowMs: params.nowMs,
  });

  const targetEval = evaluateGate3HostMerchantEligibility({
    globalConfig,
    sourceStore: params.initiatorStore,
    hostStore: params.targetStore,
    allPartnerships: params.allPartnerships,
    nowMs: params.nowMs,
  });

  const eligible = initiatorEval.result.passed && targetEval.result.passed;

  return {
    eligible,
    initiatorEligible: initiatorEval.result.passed,
    targetEligible: targetEval.result.passed,
    initiatorPlanId: initiatorEval.sourcePlanId,
    targetPlanId: targetEval.hostPlanId,
    failureCode: !initiatorEval.result.passed
      ? initiatorEval.result.failureCode ?? null
      : !targetEval.result.passed
      ? targetEval.result.failureCode ?? null
      : null,
    failureReason: !initiatorEval.result.passed
      ? initiatorEval.result.reason ?? null
      : !targetEval.result.passed
      ? targetEval.result.reason ?? null
      : null,
  };
}

export type PartnerPicksRoleAction =
  | "SEND_PARTNERSHIP_REQUEST"
  | "ACCEPT_OR_REJECT_PARTNERSHIP_REQUEST"
  | "MANAGE_SHARED_PRODUCTS"
  | "PROPOSE_PLACEMENTS_AS_SOURCE"
  | "SELECT_OR_REJECT_PLACEMENTS_AS_HOST"
  | "FINAL_APPROVE_PLACEMENTS_AS_SOURCE"
  | "CONFIGURE_STAFF_PERMISSIONS"
  | "MODIFY_SOURCE_PRODUCT_CATALOG";

/**
 * Evaluates Role & Staff Delegation Permissions (Section E.2).
 * Enforces:
 * 1. Only the Source Store Owner (or their authorized catalog staff) can modify Source Store's product catalog;
 *    a Partner Store merchant is strictly forbidden (403).
 * 2. Only the Store Owner can configure `staffPermissions` for Partner Picks.
 * 3. Authorized store staff (`store.teamMembers` listed in `profile.staffPermissions.authorizedStaffIds`)
 *    can perform only the specific Partner Picks actions delegated by the Store Owner.
 */
export interface PartnerPicksActorIdentity {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  storeId?: string;
  storeName?: string;
  ownedStoreIds?: string[];
  teamMemberId?: string;
}

export function evaluatePartnerPicksActorPermission(params: {
  actor?: PartnerPicksActorIdentity | null;
  targetStore?: MerchantStore | null;
  targetStoreProfile?: Partial<MerchantPartnerPicksProfile> | null;
  action: PartnerPicksRoleAction;
}): {
  allowed: boolean;
  actorRole: "STORE_OWNER" | "AUTHORIZED_STAFF" | "UNAUTHORIZED";
  reason?: string;
} {
  const { actor, targetStore, targetStoreProfile, action } = params;

  if (!actor || !targetStore) {
    return {
      allowed: false,
      actorRole: "UNAUTHORIZED",
      reason: "Authentication and target store context are required.",
    };
  }

  // 1. Check strict Store Owner identity
  const strictOwnerRes = verifyStrictStoreOwnership({
    user: actor,
    targetStore,
    activeStaffMemberId: actor.teamMemberId || null,
  });
  if (strictOwnerRes.allowed) {
    return {
      allowed: true,
      actorRole: "STORE_OWNER",
    };
  }

  // Only the actual Store Owner may configure Partner Picks staff delegation
  if (action === "CONFIGURE_STAFF_PERMISSIONS") {
    return {
      allowed: false,
      actorRole: "UNAUTHORIZED",
      reason: "Only the Store Owner can configure Partner Picks staff permissions.",
    };
  }

  // If the actor belongs to a different store (e.g. Partner Merchant B trying to mutate Store A), deny immediately
  if (actor.storeId && actor.storeId !== targetStore.id) {
    return {
      allowed: false,
      actorRole: "UNAUTHORIZED",
      reason:
        "Cross-store mutation forbidden: a partner merchant cannot modify another store's catalog or unilateral settings.",
    };
  }

  // 2. Check if actor is an active team member of targetStore
  const teamMembers = Array.isArray(targetStore.teamMembers)
    ? targetStore.teamMembers
    : [];
  const matchingMember = teamMembers.find((m) => {
    if (!m) return false;
    const isActive = !m.status || String(m.status).toLowerCase() === "active";
    if (!isActive) return false;
    const matchById =
      (actor.teamMemberId && m.id === actor.teamMemberId) ||
      (actor.id && m.id === actor.id);
    const matchByEmail =
      actor.email &&
      m.email &&
      actor.email.trim().toLowerCase() === m.email.trim().toLowerCase();
    return Boolean(matchById || matchByEmail);
  });

  if (!matchingMember) {
    return {
      allowed: false,
      actorRole: "UNAUTHORIZED",
      reason: "Actor is neither the Store Owner nor an active staff member of this store.",
    };
  }

  if (action === "MODIFY_SOURCE_PRODUCT_CATALOG") {
    const canEditProducts = Boolean(
      matchingMember.permissions?.manageProducts ||
        matchingMember.permissions?.editProducts
    );
    return canEditProducts
      ? { allowed: true, actorRole: "AUTHORIZED_STAFF" }
      : {
          allowed: false,
          actorRole: "UNAUTHORIZED",
          reason: "Staff member does not have catalog edit permissions for this store.",
        };
  }

  const normalizedProfile = normalizeMerchantPartnerPicksProfile(
    targetStore.id,
    targetStoreProfile || createDefaultMerchantPartnerPicksProfile(targetStore.id)
  );
  const staffPerms = normalizedProfile.staffPermissions;

  if (!staffPerms.authorizedStaffIds.includes(matchingMember.id)) {
    return {
      allowed: false,
      actorRole: "UNAUTHORIZED",
      reason: "Staff member is not in the authorized Partner Picks staff list.",
    };
  }

  switch (action) {
    case "SEND_PARTNERSHIP_REQUEST":
      return staffPerms.canSendRequests
        ? { allowed: true, actorRole: "AUTHORIZED_STAFF" }
        : {
            allowed: false,
            actorRole: "UNAUTHORIZED",
            reason: "Staff member is not authorized to send Partner Picks requests.",
          };
    case "ACCEPT_OR_REJECT_PARTNERSHIP_REQUEST":
      return staffPerms.canAcceptRejectRequests
        ? { allowed: true, actorRole: "AUTHORIZED_STAFF" }
        : {
            allowed: false,
            actorRole: "UNAUTHORIZED",
            reason: "Staff member is not authorized to accept or reject Partner Picks requests.",
          };
    case "MANAGE_SHARED_PRODUCTS":
      return staffPerms.canManageSharedProducts
        ? { allowed: true, actorRole: "AUTHORIZED_STAFF" }
        : {
            allowed: false,
            actorRole: "UNAUTHORIZED",
            reason: "Staff member is not authorized to manage shared Partner Picks products.",
          };
    case "PROPOSE_PLACEMENTS_AS_SOURCE":
    case "SELECT_OR_REJECT_PLACEMENTS_AS_HOST":
      return staffPerms.canProposeAndSelectPlacements
        ? { allowed: true, actorRole: "AUTHORIZED_STAFF" }
        : {
            allowed: false,
            actorRole: "UNAUTHORIZED",
            reason: "Staff member is not authorized to propose or select Partner Picks placements.",
          };
    case "FINAL_APPROVE_PLACEMENTS_AS_SOURCE":
      return staffPerms.canFinalApprovePlacements
        ? { allowed: true, actorRole: "AUTHORIZED_STAFF" }
        : {
            allowed: false,
            actorRole: "UNAUTHORIZED",
            reason: "Staff member is not authorized to grant final placement approval.",
          };
  }
}
