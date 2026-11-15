import { useState, useEffect } from "react";
import {
  normalizeSubscriptionPlanId,
  SUBSCRIPTION_PLAN_IDS,
  type SubscriptionPlanId,
} from "./platformPermissionsConfig";
import type { MerchantEntitlementOverrides } from "../types";

export interface PlanFeatureConfig {
  allowImageUploadDevice: boolean;
  allowVideoUploadDevice: boolean;
  allowExternalVideoLinks: boolean;
  maxImages: number;
  maxVideos: number;
  maxActiveProducts?: number | "unlimited";
  maxCustomDomains?: number | "unlimited";
  maxTeamMembers?: number | "unlimited";
  maxStoreCampaigns?: number | "unlimited";
  maxSponsoredAdSlots?: number | "unlimited";
  monthlyPriceDzd?: number;
  trialDays?: number;
}

export interface PlatformFeatureConfig {
  // Global defaults & limits
  globalAllowImageUploadDevice: boolean;
  globalAllowVideoUploadDevice: boolean;
  globalAllowExternalVideoLinks: boolean;
  globalMaxImagesPerProduct: number;
  globalMaxVideosPerProduct: number;
  globalMaxImageSizeBytesMB: number;
  globalMaxVideoSizeBytesMB: number;
  allowedImageTypes: string;
  allowedVideoTypes: string;

  // Per subscription tier overrides / permissions across the 5 canonical plans
  planConfigs: Record<string, PlanFeatureConfig>;
}

export const DEFAULT_PLATFORM_FEATURE_CONFIG: PlatformFeatureConfig = {
  globalAllowImageUploadDevice: true,
  globalAllowVideoUploadDevice: false,
  globalAllowExternalVideoLinks: true,
  globalMaxImagesPerProduct: 20,
  globalMaxVideosPerProduct: 10,
  globalMaxImageSizeBytesMB: 5,
  globalMaxVideoSizeBytesMB: 50,
  allowedImageTypes: "jpeg, png, webp, gif",
  allowedVideoTypes: "mp4, webm, mov",
  planConfigs: {
    Basic: {
      allowImageUploadDevice: true,
      allowVideoUploadDevice: false,
      allowExternalVideoLinks: true,
      maxImages: 6,
      maxVideos: 1,
      maxActiveProducts: 50,
      maxCustomDomains: 1,
      maxTeamMembers: 1,
      maxStoreCampaigns: 1,
      maxSponsoredAdSlots: 0,
      monthlyPriceDzd: 2900,
      trialDays: 14,
    },
    Pro: {
      allowImageUploadDevice: true,
      allowVideoUploadDevice: false,
      allowExternalVideoLinks: true,
      maxImages: 10,
      maxVideos: 3,
      maxActiveProducts: 200,
      maxCustomDomains: 2,
      maxTeamMembers: 3,
      maxStoreCampaigns: 3,
      maxSponsoredAdSlots: 1,
      monthlyPriceDzd: 4900,
      trialDays: 14,
    },
    "Pro Plus": {
      allowImageUploadDevice: true,
      allowVideoUploadDevice: false,
      allowExternalVideoLinks: true,
      maxImages: 12,
      maxVideos: 5,
      maxActiveProducts: 500,
      maxCustomDomains: 3,
      maxTeamMembers: 8,
      maxStoreCampaigns: 10,
      maxSponsoredAdSlots: 3,
      monthlyPriceDzd: 7900,
      trialDays: 14,
    },
    Premium: {
      allowImageUploadDevice: true,
      allowVideoUploadDevice: true,
      allowExternalVideoLinks: true,
      maxImages: 15,
      maxVideos: 8,
      maxActiveProducts: 2000,
      maxCustomDomains: 5,
      maxTeamMembers: 20,
      maxStoreCampaigns: 25,
      maxSponsoredAdSlots: 10,
      monthlyPriceDzd: 12900,
      trialDays: 7,
    },
    "Premium Plus": {
      allowImageUploadDevice: true,
      allowVideoUploadDevice: true,
      allowExternalVideoLinks: true,
      maxImages: 20,
      maxVideos: 10,
      maxActiveProducts: "unlimited",
      maxCustomDomains: "unlimited",
      maxTeamMembers: "unlimited",
      maxStoreCampaigns: "unlimited",
      maxSponsoredAdSlots: "unlimited",
      monthlyPriceDzd: 19900,
      trialDays: 7,
    },
  },
};

const STORAGE_KEY = "yumi_platform_feature_config";

export function getPlatformFeatureConfig(): PlatformFeatureConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const mergedPlans: Record<string, PlanFeatureConfig> = {};
      for (const planId of SUBSCRIPTION_PLAN_IDS) {
        mergedPlans[planId] = {
          ...DEFAULT_PLATFORM_FEATURE_CONFIG.planConfigs[planId],
          ...(parsed.planConfigs?.[planId] || {}),
        };
      }
      return {
        ...DEFAULT_PLATFORM_FEATURE_CONFIG,
        ...parsed,
        planConfigs: mergedPlans,
      };
    }
  } catch (e) {
    console.error("Failed to parse platform feature config:", e);
  }
  return DEFAULT_PLATFORM_FEATURE_CONFIG;
}

export function savePlatformFeatureConfig(config: PlatformFeatureConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("yumi_feature_config_changed", { detail: config }));

    // Sync to server authoritative governance store
    fetch("/api/admin/governance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureConfig: config }),
    }).catch(() => {});
  } catch (e) {
    console.error("Failed to save platform feature config:", e);
  }
}

export interface EffectiveStoreFeatureConfig {
  planId: SubscriptionPlanId;
  allowImageUploadDevice: boolean;
  allowVideoUploadDevice: boolean;
  allowExternalVideoLinks: boolean;
  maxImages: number;
  maxVideos: number;
  maxImageSizeBytesMB: number;
  maxVideoSizeBytesMB: number;
  allowedImageTypes: string;
  allowedVideoTypes: string;
  maxActiveProducts: number | "unlimited";
  maxCustomDomains: number | "unlimited";
  maxTeamMembers: number | "unlimited";
  maxStoreCampaigns: number | "unlimited";
  maxSponsoredAdSlots: number | "unlimited";
}

export function getEffectiveStoreFeatureConfig(
  subscriptionTierOrStore?:
    | string
    | {
        subscriptionTier?: string;
        premiumTier?: string;
        subscriptionMeta?: { planId?: string };
        entitlementOverrides?: MerchantEntitlementOverrides;
      }
    | null
): EffectiveStoreFeatureConfig {
  const config = getPlatformFeatureConfig();
  const canonicalPlanId: SubscriptionPlanId =
    typeof subscriptionTierOrStore === "string" || !subscriptionTierOrStore
      ? normalizeSubscriptionPlanId(
          typeof subscriptionTierOrStore === "string" ? subscriptionTierOrStore : undefined
        )
      : normalizeSubscriptionPlanId(
          subscriptionTierOrStore.subscriptionMeta?.planId ||
            subscriptionTierOrStore.subscriptionTier,
          subscriptionTierOrStore.premiumTier
        );

  const planConfig =
    config.planConfigs[canonicalPlanId] ||
    DEFAULT_PLATFORM_FEATURE_CONFIG.planConfigs[canonicalPlanId] ||
    DEFAULT_PLATFORM_FEATURE_CONFIG.planConfigs["Pro"];

  const overrides =
    subscriptionTierOrStore && typeof subscriptionTierOrStore === "object"
      ? subscriptionTierOrStore.entitlementOverrides
      : undefined;

  const resolvedMaxImages =
    typeof overrides?.maxImagesPerProduct === "number" && overrides.maxImagesPerProduct >= 1
      ? overrides.maxImagesPerProduct
      : Math.max(1, Math.min(config.globalMaxImagesPerProduct, planConfig.maxImages));

  const resolvedMaxVideos =
    typeof overrides?.maxVideosPerProduct === "number" && overrides.maxVideosPerProduct >= 0
      ? overrides.maxVideosPerProduct
      : Math.max(0, Math.min(config.globalMaxVideosPerProduct, planConfig.maxVideos));

  return {
    planId: canonicalPlanId,
    allowImageUploadDevice:
      Boolean(config.globalAllowImageUploadDevice) && Boolean(planConfig.allowImageUploadDevice),
    allowVideoUploadDevice:
      Boolean(config.globalAllowVideoUploadDevice) && Boolean(planConfig.allowVideoUploadDevice),
    allowExternalVideoLinks:
      Boolean(config.globalAllowExternalVideoLinks) && Boolean(planConfig.allowExternalVideoLinks),
    maxImages: resolvedMaxImages,
    maxVideos: resolvedMaxVideos,
    maxImageSizeBytesMB: config.globalMaxImageSizeBytesMB,
    maxVideoSizeBytesMB: config.globalMaxVideoSizeBytesMB,
    allowedImageTypes: config.allowedImageTypes,
    allowedVideoTypes: config.allowedVideoTypes,
    maxActiveProducts:
      overrides?.maxActiveProducts !== undefined && overrides?.maxActiveProducts !== null
        ? overrides.maxActiveProducts
        : planConfig.maxActiveProducts ?? 200,
    maxCustomDomains:
      overrides?.maxCustomDomains !== undefined && overrides?.maxCustomDomains !== null
        ? overrides.maxCustomDomains
        : planConfig.maxCustomDomains ?? 2,
    maxTeamMembers: planConfig.maxTeamMembers ?? 3,
    maxStoreCampaigns:
      overrides?.maxStoreCampaigns !== undefined && overrides?.maxStoreCampaigns !== null
        ? overrides.maxStoreCampaigns
        : planConfig.maxStoreCampaigns ?? 3,
    maxSponsoredAdSlots:
      overrides?.maxSponsoredAdSlots !== undefined && overrides?.maxSponsoredAdSlots !== null
        ? overrides.maxSponsoredAdSlots
        : planConfig.maxSponsoredAdSlots ?? 1,
  };
}

export function useEffectiveStoreFeatureConfig(
  subscriptionTierOrStore?:
    | string
    | {
        subscriptionTier?: string;
        premiumTier?: string;
        subscriptionMeta?: { planId?: string };
        entitlementOverrides?: MerchantEntitlementOverrides;
      }
    | null
): EffectiveStoreFeatureConfig {
  const [effective, setEffective] = useState<EffectiveStoreFeatureConfig>(() =>
    getEffectiveStoreFeatureConfig(subscriptionTierOrStore)
  );

  useEffect(() => {
    const handleUpdate = () => {
      setEffective(getEffectiveStoreFeatureConfig(subscriptionTierOrStore));
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("yumi_feature_config_changed", handleUpdate);
    handleUpdate();

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("yumi_feature_config_changed", handleUpdate);
    };
  }, [subscriptionTierOrStore]);

  return effective;
}
