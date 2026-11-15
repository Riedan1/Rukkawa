import { useState, useEffect } from "react";
import type {
  CanonicalSubscriptionPlanId,
  MerchantEntitlementOverrides,
} from "../types";

/**
 * OFFICIAL 5 CANONICAL YUME SUBSCRIPTION PLANS
 * 1. Basic
 * 2. Pro
 * 3. Pro Plus
 * 4. Premium
 * 5. Premium Plus
 */
export type SubscriptionPlanId = CanonicalSubscriptionPlanId;

export const SUBSCRIPTION_PLAN_IDS: SubscriptionPlanId[] = [
  "Basic",
  "Pro",
  "Pro Plus",
  "Premium",
  "Premium Plus",
];

export const SUBSCRIPTION_PLANS = SUBSCRIPTION_PLAN_IDS;

export type ProfileStoreFeatureKey =
  | "products"
  | "reels"
  | "compare"
  | "picks"
  | "reviews"
  | "saved"
  | "deals";

export type ProfileStoreFeatureId = ProfileStoreFeatureKey;

export interface ProfileStoreFeaturePermission {
  enabled: boolean;
  defaultSortOrder?: "popular" | "newest" | "priceAsc" | "priceDesc";
  highlightInToolbar?: boolean;
  customLabel?: string;
}

export interface ManageStoriesPermission {
  enabled: boolean;
  storySlots: number;
  supportedContentTypes: {
    images: boolean;
    videos: boolean;
    text: boolean;
  };
}

export type AdvancedOrderSubFeatureKey =
  | "ordersWorkspace"
  | "shippingAndTariffs"
  | "codAndProfit"
  | "geographicMap"
  | "visitorAnalytics"
  | "orderLines"
  | "revenueAndChannels"
  | "dispatchAndCourier"
  | "customerLtv"
  | "returns"
  | "supplementaryContact"
  | "connectToSheet";

export type AdvancedOrdersSubFeatureId = AdvancedOrderSubFeatureKey;

export interface OrdersPermission {
  simpleView: {
    enabled: boolean;
    defaultView?: boolean;
    allowQuickStatusUpdate?: boolean;
  };
  advancedView: {
    enabled: boolean;
    subFeatures: Record<AdvancedOrderSubFeatureKey, boolean>;
  };
}

export interface PlanCommercialPricing {
  monthlyDzd: number;
  annualDzd: number;
  monthlyUsd: number;
  trialDays: number;
}

export interface PlanOperationalQuotas {
  maxActiveProducts: number | "unlimited";
  maxImagesPerProduct: number;
  maxVideosPerProduct: number;
  maxCustomDomains: number | "unlimited";
  maxTeamMembers: number | "unlimited";
  maxStoreCampaigns: number | "unlimited";
  maxSponsoredAdSlots: number | "unlimited";
}

export interface PlanPermissionConfig {
  planId: SubscriptionPlanId;
  planName: string;
  tagline: string;
  badgeLabel: string;
  accentColor: string;
  pricing: PlanCommercialPricing;
  commercial: PlanCommercialPricing;
  quotas: PlanOperationalQuotas;
  profileStore: Record<ProfileStoreFeatureKey, ProfileStoreFeaturePermission>;
  manageStories: ManageStoriesPermission;
  orders: OrdersPermission;
  /** Extensible container for additional governance groups */
  futureGroups?: Record<string, Record<string, unknown>>;
}

export interface PlatformPermissionsSnapshot {
  version: number;
  timestamp: number;
  savedAt: string;
  actor: string;
  savedBy: string;
  summary: string;
  note: string;
  plans: Record<SubscriptionPlanId, PlanPermissionConfig>;
}

export interface PlatformPermissionsConfig {
  version: number;
  updatedAt: number;
  plans: Record<SubscriptionPlanId, PlanPermissionConfig>;
  history?: PlatformPermissionsSnapshot[];
}

export const PROFILE_STORE_FEATURES_META: {
  id: ProfileStoreFeatureKey;
  key: ProfileStoreFeatureKey;
  label: string;
  description: string;
}[] = [
  {
    id: "products",
    key: "products",
    label: "Products",
    description: "Main storefront product catalog grid, search, and category filtering.",
  },
  {
    id: "reels",
    key: "reels",
    label: "Reels",
    description: "Vertical short-form product video feed and interactive reel viewer on the store profile.",
  },
  {
    id: "compare",
    key: "compare",
    label: "Compare",
    description: "Side-by-side product specification and price comparison drawer for shoppers.",
  },
  {
    id: "picks",
    key: "picks",
    label: "Picks",
    description: "Curated merchant product picks and highlighted selections in the storefront toolbar.",
  },
  {
    id: "reviews",
    key: "reviews",
    label: "Reviews",
    description: "Verified customer ratings, written feedback, and merchant replies tab.",
  },
  {
    id: "saved",
    key: "saved",
    label: "Saved",
    description: "Shopper bookmarked and saved items collection filter inside the store profile.",
  },
  {
    id: "deals",
    key: "deals",
    label: "Deals",
    description: "Dedicated promotional discounts, flash sales, and bundle offers tab.",
  },
];

export const ADVANCED_ORDERS_SUBFEATURES_META: {
  id: AdvancedOrderSubFeatureKey;
  key: AdvancedOrderSubFeatureKey;
  label: string;
  description: string;
  ordersModuleTabId?: string;
}[] = [
  {
    id: "ordersWorkspace",
    key: "ordersWorkspace",
    label: "Orders Workspace",
    description: "Master multi-filter orders ledger, batch actions, and stage workflow table.",
    ordersModuleTabId: "all",
  },
  {
    id: "shippingAndTariffs",
    key: "shippingAndTariffs",
    label: "Shipping & Tariffs",
    description: "58-Wilaya delivery fee calculator, home vs. stop-desk rates, and tariff matrix.",
    ordersModuleTabId: "fulfillment",
  },
  {
    id: "codAndProfit",
    key: "codAndProfit",
    label: "COD & Profit",
    description: "Cash-on-delivery collection reconciliation, net margin tracking, and fee breakdown.",
    ordersModuleTabId: "reconciliation",
  },
  {
    id: "geographicMap",
    key: "geographicMap",
    label: "Geographic Map",
    description: "Interactive regional order density map and wilaya distribution breakdown.",
    ordersModuleTabId: "geo_map",
  },
  {
    id: "visitorAnalytics",
    key: "visitorAnalytics",
    label: "Visitor Analytics",
    description: "Storefront traffic funnel, conversion telemetry, and shopper behavior insights.",
    ordersModuleTabId: "visitor_analytics",
  },
  {
    id: "orderLines",
    key: "orderLines",
    label: "Order Lines",
    description: "Itemized SKU-level order line breakdown, variant quantities, and unit pricing.",
    ordersModuleTabId: "lines",
  },
  {
    id: "revenueAndChannels",
    key: "revenueAndChannels",
    label: "Revenue & Channels",
    description: "Sales attribution across marketplace, direct links, social campaigns, and ad channels.",
    ordersModuleTabId: "analytics",
  },
  {
    id: "dispatchAndCourier",
    key: "dispatchAndCourier",
    label: "Dispatch & Courier",
    description: "Courier waybill generation, tracking numbers, and dispatch manifest handoff.",
    ordersModuleTabId: "deliveries",
  },
  {
    id: "customerLtv",
    key: "customerLtv",
    label: "Customer LTV",
    description: "Repeat buyer directory, lifetime value cohorts, and purchase frequency metrics.",
    ordersModuleTabId: "customers",
  },
  {
    id: "returns",
    key: "returns",
    label: "Returns",
    description: "Returned parcels log, refusal reasons, and restocking workflow.",
    ordersModuleTabId: "returns",
  },
  {
    id: "supplementaryContact",
    key: "supplementaryContact",
    label: "Supplementary Contact",
    description: "Supplier and fulfillment partner directory for order sourcing and follow-ups.",
    ordersModuleTabId: "suppliers",
  },
  {
    id: "connectToSheet",
    key: "connectToSheet",
    label: "Connect to Sheet",
    description: "Live Google Sheets two-way order synchronization and automated row export.",
  },
];

function createProfileStoreConfig(
  enabledMap: Record<ProfileStoreFeatureKey, boolean>
): Record<ProfileStoreFeatureKey, ProfileStoreFeaturePermission> {
  return {
    products: { enabled: enabledMap.products, defaultSortOrder: "popular", highlightInToolbar: true },
    reels: { enabled: enabledMap.reels, defaultSortOrder: "popular", highlightInToolbar: true },
    compare: { enabled: enabledMap.compare, defaultSortOrder: "popular", highlightInToolbar: true },
    picks: { enabled: enabledMap.picks, defaultSortOrder: "popular", highlightInToolbar: true },
    reviews: { enabled: enabledMap.reviews, defaultSortOrder: "newest", highlightInToolbar: true },
    saved: { enabled: enabledMap.saved, defaultSortOrder: "newest", highlightInToolbar: true },
    deals: { enabled: enabledMap.deals, defaultSortOrder: "popular", highlightInToolbar: true },
  };
}

export const DEFAULT_PLATFORM_PERMISSIONS_CONFIG: PlatformPermissionsConfig = {
  version: 2,
  updatedAt: Date.now(),
  plans: {
    Basic: {
      planId: "Basic",
      planName: "Basic",
      tagline: "Commercial starter boutique with core product catalog, customer reviews, and streamlined order desk.",
      badgeLabel: "TIER 1 · BASIC",
      accentColor: "#64748b",
      pricing: {
        monthlyDzd: 2900,
        annualDzd: 29000,
        monthlyUsd: 19,
        trialDays: 14,
      },
      commercial: {
        monthlyDzd: 2900,
        annualDzd: 29000,
        monthlyUsd: 19,
        trialDays: 14,
      },
      quotas: {
        maxActiveProducts: 50,
        maxImagesPerProduct: 6,
        maxVideosPerProduct: 1,
        maxCustomDomains: 1,
        maxTeamMembers: 1,
        maxStoreCampaigns: 1,
        maxSponsoredAdSlots: 0,
      },
      profileStore: createProfileStoreConfig({
        products: true,
        reels: false,
        compare: false,
        picks: true,
        reviews: true,
        saved: true,
        deals: false,
      }),
      manageStories: {
        enabled: true,
        storySlots: 1,
        supportedContentTypes: {
          images: true,
          videos: false,
          text: true,
        },
      },
      orders: {
        simpleView: {
          enabled: true,
          defaultView: true,
          allowQuickStatusUpdate: true,
        },
        advancedView: {
          enabled: true,
          subFeatures: {
            ordersWorkspace: true,
            shippingAndTariffs: true,
            codAndProfit: false,
            geographicMap: false,
            visitorAnalytics: false,
            orderLines: true,
            revenueAndChannels: false,
            dispatchAndCourier: false,
            customerLtv: false,
            returns: false,
            supplementaryContact: false,
            connectToSheet: false,
          },
        },
      },
      futureGroups: {},
    },
    Pro: {
      planId: "Pro",
      planName: "Pro",
      tagline: "Essential merchant storefront, core story slots, and multi-carrier order management.",
      badgeLabel: "TIER 2 · PRO",
      accentColor: "#0284c7",
      pricing: {
        monthlyDzd: 4900,
        annualDzd: 49000,
        monthlyUsd: 35,
        trialDays: 14,
      },
      commercial: {
        monthlyDzd: 4900,
        annualDzd: 49000,
        monthlyUsd: 35,
        trialDays: 14,
      },
      quotas: {
        maxActiveProducts: 200,
        maxImagesPerProduct: 10,
        maxVideosPerProduct: 3,
        maxCustomDomains: 2,
        maxTeamMembers: 3,
        maxStoreCampaigns: 3,
        maxSponsoredAdSlots: 1,
      },
      profileStore: createProfileStoreConfig({
        products: true,
        reels: true,
        compare: true,
        picks: true,
        reviews: true,
        saved: true,
        deals: true,
      }),
      manageStories: {
        enabled: true,
        storySlots: 2,
        supportedContentTypes: {
          images: true,
          videos: false,
          text: true,
        },
      },
      orders: {
        simpleView: {
          enabled: true,
          defaultView: true,
          allowQuickStatusUpdate: true,
        },
        advancedView: {
          enabled: true,
          subFeatures: {
            ordersWorkspace: true,
            shippingAndTariffs: true,
            codAndProfit: true,
            geographicMap: false,
            visitorAnalytics: false,
            orderLines: true,
            revenueAndChannels: false,
            dispatchAndCourier: true,
            customerLtv: false,
            returns: true,
            supplementaryContact: false,
            connectToSheet: false,
          },
        },
      },
      futureGroups: {},
    },
    "Pro Plus": {
      planId: "Pro Plus",
      planName: "Pro Plus",
      tagline: "Expanded multi-media story capacity, Google Sheets sync, and enhanced analytical order workflows.",
      badgeLabel: "TIER 3 · PRO PLUS",
      accentColor: "#6366f1",
      pricing: {
        monthlyDzd: 7900,
        annualDzd: 79000,
        monthlyUsd: 59,
        trialDays: 14,
      },
      commercial: {
        monthlyDzd: 7900,
        annualDzd: 79000,
        monthlyUsd: 59,
        trialDays: 14,
      },
      quotas: {
        maxActiveProducts: 500,
        maxImagesPerProduct: 12,
        maxVideosPerProduct: 5,
        maxCustomDomains: 3,
        maxTeamMembers: 8,
        maxStoreCampaigns: 10,
        maxSponsoredAdSlots: 3,
      },
      profileStore: createProfileStoreConfig({
        products: true,
        reels: true,
        compare: true,
        picks: true,
        reviews: true,
        saved: true,
        deals: true,
      }),
      manageStories: {
        enabled: true,
        storySlots: 4,
        supportedContentTypes: {
          images: true,
          videos: true,
          text: true,
        },
      },
      orders: {
        simpleView: {
          enabled: true,
          defaultView: false,
          allowQuickStatusUpdate: true,
        },
        advancedView: {
          enabled: true,
          subFeatures: {
            ordersWorkspace: true,
            shippingAndTariffs: true,
            codAndProfit: true,
            geographicMap: true,
            visitorAnalytics: true,
            orderLines: true,
            revenueAndChannels: true,
            dispatchAndCourier: true,
            customerLtv: false,
            returns: true,
            supplementaryContact: false,
            connectToSheet: true,
          },
        },
      },
      futureGroups: {},
    },
    Premium: {
      planId: "Premium",
      planName: "Premium",
      tagline: "High-volume commerce suite with extended story slots, customer LTV cohorts, and full ERP order modules.",
      badgeLabel: "TIER 4 · PREMIUM",
      accentColor: "#0d9488",
      pricing: {
        monthlyDzd: 12900,
        annualDzd: 129000,
        monthlyUsd: 95,
        trialDays: 7,
      },
      commercial: {
        monthlyDzd: 12900,
        annualDzd: 129000,
        monthlyUsd: 95,
        trialDays: 7,
      },
      quotas: {
        maxActiveProducts: 2000,
        maxImagesPerProduct: 15,
        maxVideosPerProduct: 8,
        maxCustomDomains: 5,
        maxTeamMembers: 20,
        maxStoreCampaigns: 25,
        maxSponsoredAdSlots: 10,
      },
      profileStore: createProfileStoreConfig({
        products: true,
        reels: true,
        compare: true,
        picks: true,
        reviews: true,
        saved: true,
        deals: true,
      }),
      manageStories: {
        enabled: true,
        storySlots: 6,
        supportedContentTypes: {
          images: true,
          videos: true,
          text: true,
        },
      },
      orders: {
        simpleView: {
          enabled: true,
          defaultView: false,
          allowQuickStatusUpdate: true,
        },
        advancedView: {
          enabled: true,
          subFeatures: {
            ordersWorkspace: true,
            shippingAndTariffs: true,
            codAndProfit: true,
            geographicMap: true,
            visitorAnalytics: true,
            orderLines: true,
            revenueAndChannels: true,
            dispatchAndCourier: true,
            customerLtv: true,
            returns: true,
            supplementaryContact: true,
            connectToSheet: true,
          },
        },
      },
      futureGroups: {},
    },
    "Premium Plus": {
      planId: "Premium Plus",
      planName: "Premium Plus",
      tagline: "Flagship enterprise tier with unlimited products & domains, maximum story slots, and unrestricted ERP suite.",
      badgeLabel: "TIER 5 · PREMIUM PLUS",
      accentColor: "#d97706",
      pricing: {
        monthlyDzd: 19900,
        annualDzd: 199000,
        monthlyUsd: 149,
        trialDays: 7,
      },
      commercial: {
        monthlyDzd: 19900,
        annualDzd: 199000,
        monthlyUsd: 149,
        trialDays: 7,
      },
      quotas: {
        maxActiveProducts: "unlimited",
        maxImagesPerProduct: 20,
        maxVideosPerProduct: 10,
        maxCustomDomains: "unlimited",
        maxTeamMembers: "unlimited",
        maxStoreCampaigns: "unlimited",
        maxSponsoredAdSlots: "unlimited",
      },
      profileStore: createProfileStoreConfig({
        products: true,
        reels: true,
        compare: true,
        picks: true,
        reviews: true,
        saved: true,
        deals: true,
      }),
      manageStories: {
        enabled: true,
        storySlots: 8,
        supportedContentTypes: {
          images: true,
          videos: true,
          text: true,
        },
      },
      orders: {
        simpleView: {
          enabled: true,
          defaultView: false,
          allowQuickStatusUpdate: true,
        },
        advancedView: {
          enabled: true,
          subFeatures: {
            ordersWorkspace: true,
            shippingAndTariffs: true,
            codAndProfit: true,
            geographicMap: true,
            visitorAnalytics: true,
            orderLines: true,
            revenueAndChannels: true,
            dispatchAndCourier: true,
            customerLtv: true,
            returns: true,
            supplementaryContact: true,
            connectToSheet: true,
          },
        },
      },
      futureGroups: {},
    },
  },
  history: [],
};

export const PERMISSIONS_STORAGE_KEY = "yume_platform_permissions_config_v1";

/**
 * Normalizes any store subscription tier or legacy tier label to one of the 5 canonical plans:
 * Basic | Pro | Pro Plus | Premium | Premium Plus
 */
export function normalizeSubscriptionPlanId(
  rawTier?: string | null,
  fallbackTier?: string | null
): SubscriptionPlanId {
  const primary = String(rawTier || "").trim().toLowerCase();
  const secondary = String(fallbackTier || "").trim().toLowerCase();
  const candidate = primary || secondary;

  if (!candidate) return "Pro";

  if (
    candidate === "premium plus" ||
    candidate === "premium ultra" ||
    candidate === "ultra" ||
    candidate === "enterprise"
  ) {
    return "Premium Plus";
  }
  if (candidate === "premium" || candidate === "ultimate") {
    return "Premium";
  }
  if (candidate === "pro plus" || candidate === "pro+") {
    return "Pro Plus";
  }
  if (candidate === "basic" || candidate === "starter" || candidate === "free") {
    return "Basic";
  }
  if (candidate === "pro" || candidate === "growth" || candidate === "standard") {
    return "Pro";
  }
  return "Pro";
}

/**
 * Resolves the canonical SubscriptionPlanId for a given MerchantStore object or tier string.
 */
export function resolveStoreSubscriptionPlan(
  storeOrTier?:
    | string
    | {
        subscriptionTier?: string;
        premiumTier?: string;
        subscriptionMeta?: { planId?: string };
      }
    | null
): SubscriptionPlanId {
  if (!storeOrTier) return "Pro";
  if (typeof storeOrTier === "string") {
    return normalizeSubscriptionPlanId(storeOrTier);
  }
  return normalizeSubscriptionPlanId(
    storeOrTier.subscriptionMeta?.planId || storeOrTier.subscriptionTier,
    storeOrTier.premiumTier
  );
}

/**
 * Deep merges a saved plan config with defaults to guarantee schema completeness across updates.
 */
function sanitizePlanConfig(
  planId: SubscriptionPlanId,
  rawPlan: Partial<PlanPermissionConfig> | undefined
): PlanPermissionConfig {
  const def = DEFAULT_PLATFORM_PERMISSIONS_CONFIG.plans[planId];
  if (!rawPlan || typeof rawPlan !== "object") return def;

  const rawProfile = (rawPlan.profileStore || {}) as Partial<
    Record<ProfileStoreFeatureKey, ProfileStoreFeaturePermission>
  >;
  const profileStore = {} as Record<ProfileStoreFeatureKey, ProfileStoreFeaturePermission>;
  for (const meta of PROFILE_STORE_FEATURES_META) {
    const k = meta.key;
    const incoming = rawProfile[k];
    profileStore[k] = {
      ...def.profileStore[k],
      ...(incoming || {}),
      enabled:
        typeof incoming?.enabled === "boolean"
          ? incoming.enabled
          : def.profileStore[k].enabled,
    };
  }

  const rawStories: Partial<ManageStoriesPermission> = rawPlan.manageStories || {};
  const rawContentTypes: Partial<ManageStoriesPermission["supportedContentTypes"]> =
    rawStories.supportedContentTypes || {};
  const parsedSlots = Number(rawStories.storySlots);
  const manageStories: ManageStoriesPermission = {
    enabled:
      typeof rawStories.enabled === "boolean"
        ? rawStories.enabled
        : def.manageStories.enabled,
    storySlots:
      Number.isFinite(parsedSlots) && parsedSlots >= 1 && parsedSlots <= 50
        ? Math.floor(parsedSlots)
        : def.manageStories.storySlots,
    supportedContentTypes: {
      images:
        typeof rawContentTypes.images === "boolean"
          ? rawContentTypes.images
          : def.manageStories.supportedContentTypes.images,
      videos:
        typeof rawContentTypes.videos === "boolean"
          ? rawContentTypes.videos
          : def.manageStories.supportedContentTypes.videos,
      text:
        typeof rawContentTypes.text === "boolean"
          ? rawContentTypes.text
          : def.manageStories.supportedContentTypes.text,
    },
  };

  const rawOrders: Partial<OrdersPermission> = rawPlan.orders || {};
  const rawSimple: Partial<OrdersPermission["simpleView"]> = rawOrders.simpleView || {};
  const rawAdv: Partial<OrdersPermission["advancedView"]> = rawOrders.advancedView || {};
  const rawSubFeatures: Partial<Record<AdvancedOrderSubFeatureKey, boolean>> =
    rawAdv.subFeatures || {};

  const subFeatures = {} as Record<AdvancedOrderSubFeatureKey, boolean>;
  for (const subMeta of ADVANCED_ORDERS_SUBFEATURES_META) {
    const k = subMeta.key;
    subFeatures[k] =
      typeof rawSubFeatures[k] === "boolean"
        ? rawSubFeatures[k]!
        : def.orders.advancedView.subFeatures[k];
  }

  const rawPricing: Partial<PlanCommercialPricing> =
    rawPlan.commercial || rawPlan.pricing || {};
  const pricing: PlanCommercialPricing = {
    monthlyDzd:
      typeof rawPricing.monthlyDzd === "number" && rawPricing.monthlyDzd >= 0
        ? rawPricing.monthlyDzd
        : def.pricing.monthlyDzd,
    annualDzd:
      typeof rawPricing.annualDzd === "number" && rawPricing.annualDzd >= 0
        ? rawPricing.annualDzd
        : def.pricing.annualDzd,
    monthlyUsd:
      typeof rawPricing.monthlyUsd === "number" && rawPricing.monthlyUsd >= 0
        ? rawPricing.monthlyUsd
        : def.pricing.monthlyUsd,
    trialDays:
      typeof rawPricing.trialDays === "number" && rawPricing.trialDays >= 0
        ? rawPricing.trialDays
        : def.pricing.trialDays,
  };

  const rawQuotas: Partial<PlanOperationalQuotas> = rawPlan.quotas || {};
  const quotas: PlanOperationalQuotas = {
    maxActiveProducts:
      rawQuotas.maxActiveProducts !== undefined
        ? rawQuotas.maxActiveProducts
        : def.quotas.maxActiveProducts,
    maxImagesPerProduct:
      typeof rawQuotas.maxImagesPerProduct === "number" && rawQuotas.maxImagesPerProduct >= 1
        ? rawQuotas.maxImagesPerProduct
        : def.quotas.maxImagesPerProduct,
    maxVideosPerProduct:
      typeof rawQuotas.maxVideosPerProduct === "number" && rawQuotas.maxVideosPerProduct >= 0
        ? rawQuotas.maxVideosPerProduct
        : def.quotas.maxVideosPerProduct,
    maxCustomDomains:
      rawQuotas.maxCustomDomains !== undefined
        ? rawQuotas.maxCustomDomains
        : def.quotas.maxCustomDomains,
    maxTeamMembers:
      rawQuotas.maxTeamMembers !== undefined
        ? rawQuotas.maxTeamMembers
        : def.quotas.maxTeamMembers,
    maxStoreCampaigns:
      rawQuotas.maxStoreCampaigns !== undefined
        ? rawQuotas.maxStoreCampaigns
        : def.quotas.maxStoreCampaigns,
    maxSponsoredAdSlots:
      rawQuotas.maxSponsoredAdSlots !== undefined
        ? rawQuotas.maxSponsoredAdSlots
        : def.quotas.maxSponsoredAdSlots,
  };

  return {
    ...def,
    ...rawPlan,
    planId,
    planName: planId,
    pricing,
    commercial: pricing,
    quotas,
    profileStore,
    manageStories,
    orders: {
      simpleView: {
        ...def.orders.simpleView,
        ...rawSimple,
        enabled:
          typeof rawSimple.enabled === "boolean"
            ? rawSimple.enabled
            : def.orders.simpleView.enabled,
      },
      advancedView: {
        enabled:
          typeof rawAdv.enabled === "boolean"
            ? rawAdv.enabled
            : def.orders.advancedView.enabled,
        subFeatures,
      },
    },
    futureGroups: rawPlan.futureGroups || {},
  };
}

export function getPlatformPermissionsConfig(): PlatformPermissionsConfig {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return DEFAULT_PLATFORM_PERMISSIONS_CONFIG;
    }
    const raw = window.localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (!raw) return DEFAULT_PLATFORM_PERMISSIONS_CONFIG;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.plans) {
      return DEFAULT_PLATFORM_PERMISSIONS_CONFIG;
    }
    return {
      version: Number(parsed.version) || 2,
      updatedAt: Number(parsed.updatedAt) || Date.now(),
      plans: {
        Basic: sanitizePlanConfig("Basic", parsed.plans["Basic"]),
        Pro: sanitizePlanConfig("Pro", parsed.plans["Pro"]),
        "Pro Plus": sanitizePlanConfig("Pro Plus", parsed.plans["Pro Plus"]),
        Premium: sanitizePlanConfig(
          "Premium",
          parsed.plans["Premium"] || parsed.plans["Ultimate"]
        ),
        "Premium Plus": sanitizePlanConfig(
          "Premium Plus",
          parsed.plans["Premium Plus"] || parsed.plans["Premium Ultra"]
        ),
      },
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 20) : [],
    };
  } catch (err) {
    console.error("Failed to load platform permissions config:", err);
    return DEFAULT_PLATFORM_PERMISSIONS_CONFIG;
  }
}

export function savePlatformPermissionsConfig(
  config: PlatformPermissionsConfig,
  summary = "Updated plan permissions configuration",
  actor = "Super Admin"
): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const current = getPlatformPermissionsConfig();
    const nextVersion = (current.version || 1) + 1;
    const nowTs = current.updatedAt || Date.now();
    const snapshot: PlatformPermissionsSnapshot = {
      version: current.version || 1,
      timestamp: nowTs,
      savedAt: new Date(nowTs).toISOString(),
      actor,
      savedBy: actor,
      summary,
      note: summary,
      plans: JSON.parse(JSON.stringify(current.plans)),
    };
    const nextHistory = [snapshot, ...(current.history || [])].slice(0, 20);

    const updated: PlatformPermissionsConfig = {
      ...config,
      version: nextVersion,
      updatedAt: Date.now(),
      history: nextHistory,
    };
    window.localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(
      new CustomEvent("yume_permissions_config_updated", { detail: updated })
    );

    // Non-blocking sync to server authoritative governance store
    fetch("/api/admin/governance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionsConfig: updated }),
    }).catch(() => {});
  } catch (err) {
    console.error("Failed to save platform permissions config:", err);
  }
}

export function rollbackPlatformPermissionsConfig(targetVersion: number): boolean {
  const current = getPlatformPermissionsConfig();
  const targetSnap = (current.history || []).find((h) => h.version === targetVersion);
  if (!targetSnap) return false;

  savePlatformPermissionsConfig(
    {
      version: current.version,
      updatedAt: Date.now(),
      plans: JSON.parse(JSON.stringify(targetSnap.plans)),
      history: current.history,
    },
    `Rolled back plan permissions to Version v${targetVersion}`,
    "Super Admin"
  );
  return true;
}

/**
 * Calculates the exact number of enabled and disabled features for a given plan.
 * Respects dependency rules:
 * - If Advanced View is OFF, all 12 Advanced View sub-features count as disabled/unavailable.
 */
export function calculatePlanFeatureCounts(plan: PlanPermissionConfig): {
  enabledCount: number;
  disabledCount: number;
  totalCount: number;
} {
  let enabledCount = 0;
  let disabledCount = 0;

  // 1. Profile Store (7 independent features)
  for (const meta of PROFILE_STORE_FEATURES_META) {
    if (plan.profileStore[meta.key]?.enabled) {
      enabledCount++;
    } else {
      disabledCount++;
    }
  }

  // 2. Manage Stories (1 main feature)
  if (plan.manageStories.enabled) {
    enabledCount++;
  } else {
    disabledCount++;
  }

  // 3. Orders Simple View (1 mode feature)
  if (plan.orders.simpleView.enabled) {
    enabledCount++;
  } else {
    disabledCount++;
  }

  // 4. Orders Advanced View (1 mode feature + 12 sub-features)
  if (plan.orders.advancedView.enabled) {
    enabledCount++;
    for (const subMeta of ADVANCED_ORDERS_SUBFEATURES_META) {
      if (plan.orders.advancedView.subFeatures[subMeta.key]) {
        enabledCount++;
      } else {
        disabledCount++;
      }
    }
  } else {
    // Master Advanced View is OFF -> Advanced View + all 12 sub-features are unavailable
    disabledCount += 1 + ADVANCED_ORDERS_SUBFEATURES_META.length;
  }

  return {
    enabledCount,
    disabledCount,
    totalCount: enabledCount + disabledCount,
  };
}

/**
 * Resolves the effective PlanPermissionConfig for a store, merging the canonical plan
 * with any per-merchant administrative overrides (e.g. storySlots, quotas, forceEnableAdvancedOrders).
 */
export function getPlanPermissionConfig(
  storeOrTier?:
    | string
    | {
        subscriptionTier?: string;
        premiumTier?: string;
        subscriptionMeta?: { planId?: string; status?: string };
        entitlementOverrides?: MerchantEntitlementOverrides;
      }
    | null
): PlanPermissionConfig {
  const config = getPlatformPermissionsConfig();
  const planId = resolveStoreSubscriptionPlan(storeOrTier);
  const basePlan = config.plans[planId] || config.plans["Pro"];

  if (!storeOrTier || typeof storeOrTier === "string" || !storeOrTier.entitlementOverrides) {
    return basePlan;
  }

  const ov = storeOrTier.entitlementOverrides;
  const merged: PlanPermissionConfig = JSON.parse(JSON.stringify(basePlan));

  if (typeof ov.storySlots === "number" && ov.storySlots >= 0) {
    merged.manageStories.storySlots = ov.storySlots;
    merged.manageStories.enabled = ov.storySlots > 0;
  }
  if (ov.maxActiveProducts !== undefined && ov.maxActiveProducts !== null) {
    merged.quotas.maxActiveProducts = ov.maxActiveProducts;
  }
  if (typeof ov.maxImagesPerProduct === "number" && ov.maxImagesPerProduct >= 1) {
    merged.quotas.maxImagesPerProduct = ov.maxImagesPerProduct;
  }
  if (typeof ov.maxVideosPerProduct === "number" && ov.maxVideosPerProduct >= 0) {
    merged.quotas.maxVideosPerProduct = ov.maxVideosPerProduct;
  }
  if (ov.maxCustomDomains !== undefined && ov.maxCustomDomains !== null) {
    merged.quotas.maxCustomDomains = ov.maxCustomDomains;
  }
  if (ov.maxStoreCampaigns !== undefined && ov.maxStoreCampaigns !== null) {
    merged.quotas.maxStoreCampaigns = ov.maxStoreCampaigns;
  }
  if (ov.maxSponsoredAdSlots !== undefined && ov.maxSponsoredAdSlots !== null) {
    merged.quotas.maxSponsoredAdSlots = ov.maxSponsoredAdSlots;
  }
  if (typeof ov.forceEnableAdvancedOrders === "boolean") {
    merged.orders.advancedView.enabled = ov.forceEnableAdvancedOrders;
  }

  return merged;
}

export function usePlatformPermissionsConfig(): [
  PlatformPermissionsConfig,
  (next: PlatformPermissionsConfig | ((prev: PlatformPermissionsConfig) => PlatformPermissionsConfig)) => void
] {
  const [config, setConfigState] = useState<PlatformPermissionsConfig>(() =>
    getPlatformPermissionsConfig()
  );

  useEffect(() => {
    const handleSync = () => {
      setConfigState(getPlatformPermissionsConfig());
    };
    window.addEventListener("storage", handleSync);
    window.addEventListener("yume_permissions_config_updated", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("yume_permissions_config_updated", handleSync);
    };
  }, []);

  const updateConfig = (
    next:
      | PlatformPermissionsConfig
      | ((prev: PlatformPermissionsConfig) => PlatformPermissionsConfig)
  ) => {
    setConfigState((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      savePlatformPermissionsConfig(resolved);
      return getPlatformPermissionsConfig();
    });
  };

  return [config, updateConfig];
}

export function useStorePlanPermissions(
  storeOrTier?:
    | string
    | {
        subscriptionTier?: string;
        premiumTier?: string;
        subscriptionMeta?: { planId?: string; status?: string };
        entitlementOverrides?: MerchantEntitlementOverrides;
      }
    | null
): PlanPermissionConfig {
  const [config] = usePlatformPermissionsConfig();
  const planId = resolveStoreSubscriptionPlan(storeOrTier);
  const basePlan = config.plans[planId] || config.plans["Pro"];

  if (!storeOrTier || typeof storeOrTier === "string" || !storeOrTier.entitlementOverrides) {
    return basePlan;
  }
  return getPlanPermissionConfig(storeOrTier);
}
