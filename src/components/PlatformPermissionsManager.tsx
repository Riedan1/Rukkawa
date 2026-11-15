import React, { useState, useMemo } from "react";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanId,
  PlanPermissionConfig,
  ProfileStoreFeatureId,
  AdvancedOrdersSubFeatureId,
  PROFILE_STORE_FEATURES_META,
  ADVANCED_ORDERS_SUBFEATURES_META,
  DEFAULT_PLATFORM_PERMISSIONS_CONFIG,
  calculatePlanFeatureCounts,
  resolveStoreSubscriptionPlan,
  rollbackPlatformPermissionsConfig,
  usePlatformPermissionsConfig,
} from "../utils/platformPermissionsConfig";
import { recordPlatformAuditLog } from "../utils/centralGovernanceArchitecture";
import {
  ShieldCheck,
  Sparkles,
  Crown,
  Zap,
  Sliders,
  Check,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Search,
  ChevronDown,
  ChevronUp,
  Store,
  ShoppingCart,
  Image as ImageIcon,
  Video,
  Type,
  Layers,
  FileSpreadsheet,
  History,
} from "lucide-react";
import {
  YUME_ADMIN_TOKENS,
  YumeAdminSectionHeader,
  YumeAdminAdviceBanner,
  YumeAdminSubNavStrip,
  YumeAdminToggle,
  YumeAdminActionFooter,
  YumeAdminConfirmModal,
} from "./YumeAdminDesignSystem";

interface PlatformPermissionsManagerProps {
  currentSlideColor?: string;
  darkMode: boolean;
  stores?: any[];
}

export const PlatformPermissionsManager: React.FC<
  PlatformPermissionsManagerProps
> = ({ stores = [] }) => {
  const [permissionsConfig, updatePermissionsConfig] =
    usePlatformPermissionsConfig();

  // null = Overview of 5 Canonical Subscription Plans; otherwise dedicated Plan Drill-Down
  const [selectedPlanId, setSelectedPlanId] =
    useState<SubscriptionPlanId | null>(null);

  // Track which inline EDIT configuration panels are expanded inside the active plan
  const [expandedEditPanels, setExpandedEditPanels] = useState<
    Record<string, boolean>
  >({
    "commercial-quotas": true,
    "manage-stories": true,
    "orders-advanced": true,
  });

  // Search filter inside a plan's permissions workbench
  const [searchQuery, setSearchQuery] = useState("");
  const [saveToastMessage, setSaveToastMessage] = useState<string | null>(null);
  const [confirmModalState, setConfirmModalState] = useState<{
    title: string;
    subtitle?: string;
    description: string;
    confirmLabel: string;
    variant?: "danger" | "warning" | "slate";
    onConfirm: () => void;
  } | null>(null);

  const triggerToast = (msg: string) => {
    setSaveToastMessage(msg);
    setTimeout(() => {
      setSaveToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const toggleEditPanel = (panelKey: string) => {
    setExpandedEditPanels((prev) => ({
      ...prev,
      [panelKey]: !prev[panelKey],
    }));
  };

  // Count how many stores belong to each of the 5 canonical plans
  const storeCountByPlan = useMemo(() => {
    const counts: Record<SubscriptionPlanId, number> = {
      Basic: 0,
      Pro: 0,
      "Pro Plus": 0,
      Premium: 0,
      "Premium Plus": 0,
    };
    (stores || []).forEach((s) => {
      const resolved = resolveStoreSubscriptionPlan(s);
      counts[resolved] = (counts[resolved] || 0) + 1;
    });
    return counts;
  }, [stores]);

  // Helper to update ONLY the specified plan without touching any other plan
  const mutatePlan = (
    planId: SubscriptionPlanId,
    mutator: (plan: PlanPermissionConfig) => PlanPermissionConfig,
    toastText?: string
  ) => {
    updatePermissionsConfig((prev) => {
      const currentPlan = prev.plans[planId];
      const nextPlan = mutator(
        JSON.parse(JSON.stringify(currentPlan)) as PlanPermissionConfig
      );
      recordPlatformAuditLog({
        module: "permissions",
        actionType: "edit",
        targetType: "plan",
        targetId: planId,
        targetName: `${planId} Plan`,
        summary: toastText || `Updated entitlements and permissions for ${planId} plan.`,
      });
      return {
        ...prev,
        updatedAt: Date.now(),
        plans: {
          ...prev.plans,
          [planId]: nextPlan,
        },
      };
    });
    if (toastText) {
      triggerToast(toastText);
    }
  };

  const handleResetSinglePlan = (planId: SubscriptionPlanId) => {
    setConfirmModalState({
      title: `Reset ${planId} Plan Permissions?`,
      subtitle: "Single-Plan Factory Reset",
      description: `All commercial pricing, quotas, Profile Store, Manage Stories, and Orders permissions for "${planId}" will be restored to factory defaults. Other subscription plans will not be affected.`,
      confirmLabel: `Reset ${planId}`,
      variant: "warning",
      onConfirm: () => {
        const defaultPlan = JSON.parse(
          JSON.stringify(DEFAULT_PLATFORM_PERMISSIONS_CONFIG.plans[planId])
        ) as PlanPermissionConfig;
        updatePermissionsConfig((prev) => ({
          ...prev,
          updatedAt: Date.now(),
          plans: {
            ...prev.plans,
            [planId]: defaultPlan,
          },
        }));
        recordPlatformAuditLog({
          module: "permissions",
          actionType: "edit",
          targetType: "plan",
          targetId: planId,
          targetName: `${planId} Plan`,
          summary: `Restored ${planId} plan entitlements to factory defaults.`,
        });
        triggerToast(`${planId} permissions restored to default settings.`);
      },
    });
  };

  const handleResetAllPlans = () => {
    setConfirmModalState({
      title: "Reset All 5 Canonical Subscription Plans?",
      subtitle: "Basic · Pro · Pro Plus · Premium · Premium Plus",
      description:
        "This will restore all feature permissions, story slot capacities, commercial pricing, and order workspace rules across all five canonical subscription plans back to factory defaults.",
      confirmLabel: "Reset All 5 Plans",
      variant: "danger",
      onConfirm: () => {
        const freshDefaults = JSON.parse(
          JSON.stringify(DEFAULT_PLATFORM_PERMISSIONS_CONFIG)
        );
        updatePermissionsConfig(freshDefaults);
        recordPlatformAuditLog({
          module: "permissions",
          actionType: "edit",
          targetType: "plan",
          targetId: "all_canonical_plans",
          targetName: "All 5 Canonical Plans",
          summary: "Restored all 5 canonical subscription plans to factory defaults.",
        });
        triggerToast(
          "All 5 canonical subscription plans restored to default permissions."
        );
      },
    });
  };

  // Plan visual metadata unified to the Slate-Navy & Emerald-Teal design system
  const planMeta: Record<
    SubscriptionPlanId,
    {
      tierTag: string;
      icon: React.ComponentType<{ className?: string }>;
      isHighlighted?: boolean;
    }
  > = {
    Basic: {
      tierTag: "Tier 1 · Commercial Starter",
      icon: Store,
    },
    Pro: {
      tierTag: "Tier 2 · Growth",
      icon: Zap,
    },
    "Pro Plus": {
      tierTag: "Tier 3 · Accelerated",
      icon: Sparkles,
      isHighlighted: true,
    },
    Premium: {
      tierTag: "Tier 4 · Advanced",
      icon: ShieldCheck,
    },
    "Premium Plus": {
      tierTag: "Tier 5 · Flagship",
      icon: Crown,
    },
  };

  // ============================================================================
  // VIEW 1: SUBSCRIPTION PLANS OVERVIEW (5 PLAN CARDS + MATRIX + VERSION ROLLBACK)
  // ============================================================================
  if (!selectedPlanId) {
    return (
      <div className="space-y-5">
        {saveToastMessage && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#1e2631] text-white text-xs font-semibold shadow-xl border border-white/15">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{saveToastMessage}</span>
          </div>
        )}

        {/* Section 1: Subscription Plans Overview Card */}
        <div className={YUME_ADMIN_TOKENS.cardClass}>
          <YumeAdminSectionHeader
            title="Canonical Subscription Plans & Unified Entitlements Registry"
            subtitle="Authoritative 5-tier governance shared across Stores, Subscriptions, Custom Domains, Orders, and YUME Ads (Basic, Pro, Pro Plus, Premium, Premium Plus)."
            rightContent={
              <button
                type="button"
                onClick={handleResetAllPlans}
                className={YUME_ADMIN_TOKENS.secondaryButtonClass}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All 5 Plans</span>
              </button>
            }
          />

          <YumeAdminAdviceBanner label="AUTHORITATIVE REGISTRY:">
            Basic is preserved as a commercial subscription tier (not a free plan). All five canonical tiers synchronize immediately with Merchant Space, Public Storefront, Custom Domains, and YUME Ads without destructive data loss.
          </YumeAdminAdviceBanner>

          {/* 5 Main Canonical Subscription Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {SUBSCRIPTION_PLANS.map((planId, idx) => {
              const plan = permissionsConfig.plans[planId];
              const counts = calculatePlanFeatureCounts(plan);
              const meta = planMeta[planId];
              const PlanIcon = meta.icon;
              const storeCount = storeCountByPlan[planId] || 0;
              const enabledPercentage = Math.round(
                (counts.enabledCount / counts.totalCount) * 100
              );

              const profileStoreEnabledCount =
                PROFILE_STORE_FEATURES_META.filter(
                  (m) => plan.profileStore[m.key]?.enabled
                ).length;

              const advSubEnabledCount = plan.orders.advancedView.enabled
                ? ADVANCED_ORDERS_SUBFEATURES_META.filter(
                    (m) => plan.orders.advancedView.subFeatures[m.key]
                  ).length
                : 0;

              return (
                <div
                  key={planId}
                  onClick={() => setSelectedPlanId(planId)}
                  className="group relative rounded-2xl border border-stone-200/90 dark:border-slate-800 hover:border-[#1e2631] dark:hover:border-sky-400 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between gap-5"
                >
                  <div className="space-y-4">
                    {/* Top Row: Icon + Plan Title + Circular Tier Badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            meta.isHighlighted
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-xs"
                              : "bg-stone-100 dark:bg-slate-800 text-[#1e2631] dark:text-sky-400 border-stone-200/80 dark:border-slate-700"
                          }`}
                        >
                          <PlanIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10.5px] font-semibold text-stone-500 dark:text-slate-400 truncate">
                            {meta.tierTag} · {storeCount} Stores
                          </div>
                          <h4 className="text-base font-bold text-stone-900 dark:text-white tracking-tight truncate">
                            {plan.planName}
                          </h4>
                        </div>
                      </div>

                      <div className="w-7 h-7 rounded-full bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 text-[11px] font-sans tabular-nums font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                    </div>

                    <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {plan.tagline}
                    </p>

                    {/* Enabled vs Disabled Feature Counters */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-xl bg-stone-50/80 dark:bg-slate-950 border border-stone-200/80 dark:border-slate-800">
                        <div className="text-[10.5px] font-semibold text-stone-500 dark:text-slate-400">
                          Enabled Features
                        </div>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-xl font-bold font-sans tabular-nums text-emerald-600 dark:text-emerald-400">
                            {counts.enabledCount}
                          </span>
                          <span className="text-[11px] font-sans tabular-nums text-stone-400">
                            / {counts.totalCount}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-stone-50/80 dark:bg-slate-950 border border-stone-200/80 dark:border-slate-800">
                        <div className="text-[10.5px] font-semibold text-stone-500 dark:text-slate-400">
                          Disabled Features
                        </div>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-xl font-bold font-sans tabular-nums text-stone-700 dark:text-slate-300">
                            {counts.disabledCount}
                          </span>
                          <span className="text-[11px] font-sans tabular-nums text-stone-400">
                            / {counts.totalCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                        <span>Feature Coverage</span>
                        <span className="font-sans tabular-nums text-stone-800 dark:text-slate-200">
                          {enabledPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden bg-stone-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-[#1e2631] dark:bg-sky-400 transition-all duration-300"
                          style={{ width: `${enabledPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Group Breakdown Summary */}
                    <div className="pt-2 border-t border-stone-200/70 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-stone-600 dark:text-slate-300">
                        <span>Profile Store Tabs</span>
                        <span className="font-sans tabular-nums font-bold text-stone-900 dark:text-white">
                          {profileStoreEnabledCount}/7 ON
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-stone-600 dark:text-slate-300">
                        <span>Manage Stories</span>
                        <span className="font-sans tabular-nums font-bold text-stone-900 dark:text-white">
                          {plan.manageStories.enabled
                            ? `${plan.manageStories.storySlots} Slots`
                            : "OFF"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-stone-600 dark:text-slate-300">
                        <span>Orders Workspace</span>
                        <span className="font-sans tabular-nums font-bold text-stone-900 dark:text-white">
                          {plan.orders.advancedView.enabled
                            ? `Adv (${advSubEnabledCount}/12)`
                            : plan.orders.simpleView.enabled
                            ? "Simple Only"
                            : "OFF"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Edit Permissions Primary CTA Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlanId(planId);
                    }}
                    className={`w-full ${YUME_ADMIN_TOKENS.primaryButtonClass}`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Edit Permissions</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Cross-Plan Feature Comparison Matrix */}
        <div className={YUME_ADMIN_TOKENS.cardClass}>
          <YumeAdminSectionHeader
            title="Cross-Plan Feature & Entitlement Comparison Matrix"
            subtitle="Live snapshot of commercial pricing, operational quotas, and enabled capabilities across Basic, Pro, Pro Plus, Premium, and Premium Plus."
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200/80 dark:border-slate-800 text-stone-500 dark:text-slate-400">
                  <th className="py-3 pr-4 font-bold">
                    Feature Group / Entitlement
                  </th>
                  {SUBSCRIPTION_PLANS.map((planId) => (
                    <th
                      key={planId}
                      className="py-3 px-4 font-bold text-center text-stone-900 dark:text-white"
                    >
                      {planId}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/70 dark:divide-slate-800">
                <tr>
                  <td className="py-3 pr-4 font-semibold text-stone-800 dark:text-slate-200">
                    0A. Commercial Pricing (Monthly DZD · Trial Period)
                  </td>
                  {SUBSCRIPTION_PLANS.map((planId) => {
                    const c = permissionsConfig.plans[planId].commercial;
                    return (
                      <td
                        key={planId}
                        className="py-3 px-4 text-center font-sans tabular-nums font-bold text-stone-900 dark:text-white"
                      >
                        {c?.monthlyDzd?.toLocaleString() || 0} DZD{" "}
                        <span className="text-[11px] font-normal text-stone-500 dark:text-slate-400">
                          ({c?.trialDays || 0}d trial)
                        </span>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-stone-800 dark:text-slate-200">
                    0B. Operational Quotas (Products · Domains · Sponsored Ads)
                  </td>
                  {SUBSCRIPTION_PLANS.map((planId) => {
                    const q = permissionsConfig.plans[planId].quotas;
                    return (
                      <td
                        key={planId}
                        className="py-3 px-4 text-center font-sans tabular-nums text-stone-700 dark:text-slate-300"
                      >
                        <strong className="text-stone-900 dark:text-white">
                          {q?.maxActiveProducts || 0}
                        </strong>{" "}
                        Prods ·{" "}
                        <strong className="text-stone-900 dark:text-white">
                          {q?.maxCustomDomains || 0}
                        </strong>{" "}
                        Dom ·{" "}
                        <strong className="text-stone-900 dark:text-white">
                          {q?.maxSponsoredAdSlots || 0}
                        </strong>{" "}
                        Ads
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-stone-800 dark:text-slate-200">
                    1. Profile Store (Products, Reels, Compare, Picks, Reviews,
                    Saved, Deals)
                  </td>
                  {SUBSCRIPTION_PLANS.map((planId) => {
                    const p = permissionsConfig.plans[planId];
                    const enabledTabs = PROFILE_STORE_FEATURES_META.filter(
                      (m) => p.profileStore[m.key]?.enabled
                    ).length;
                    return (
                      <td
                        key={planId}
                        className="py-3 px-4 text-center font-sans tabular-nums font-bold text-stone-900 dark:text-white"
                      >
                        {enabledTabs} / 7 Enabled
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-stone-800 dark:text-slate-200">
                    2. Manage Stories (Max Slots &amp; Content Types)
                  </td>
                  {SUBSCRIPTION_PLANS.map((planId) => {
                    const ms = permissionsConfig.plans[planId].manageStories;
                    const types = [
                      ms.supportedContentTypes.images && "Img",
                      ms.supportedContentTypes.videos && "Vid",
                      ms.supportedContentTypes.text && "Txt",
                    ]
                      .filter(Boolean)
                      .join(" · ");
                    return (
                      <td
                        key={planId}
                        className="py-3 px-4 text-center font-sans tabular-nums text-stone-700 dark:text-slate-300"
                      >
                        {ms.enabled ? (
                          <span>
                            <strong className="text-stone-900 dark:text-white">
                              {ms.storySlots} Slots
                            </strong>{" "}
                            ({types || "None"})
                          </span>
                        ) : (
                          <span className="text-stone-400">Disabled</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-stone-800 dark:text-slate-200">
                    3A. Orders — Simple View
                  </td>
                  {SUBSCRIPTION_PLANS.map((planId) => {
                    const sv =
                      permissionsConfig.plans[planId].orders.simpleView.enabled;
                    return (
                      <td
                        key={planId}
                        className="py-3 px-4 text-center font-sans tabular-nums font-bold"
                      >
                        <span
                          className={
                            sv
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-stone-400"
                          }
                        >
                          {sv ? "ON" : "OFF"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-stone-800 dark:text-slate-200">
                    3B. Orders — Advanced View (12 Internal Sections &amp;
                    Tools)
                  </td>
                  {SUBSCRIPTION_PLANS.map((planId) => {
                    const av =
                      permissionsConfig.plans[planId].orders.advancedView;
                    const subCount = av.enabled
                      ? ADVANCED_ORDERS_SUBFEATURES_META.filter(
                          (m) => av.subFeatures[m.key]
                        ).length
                      : 0;
                    return (
                      <td
                        key={planId}
                        className="py-3 px-4 text-center font-sans tabular-nums font-bold text-stone-900 dark:text-white"
                      >
                        {av.enabled ? (
                          `${subCount} / 12 ON`
                        ) : (
                          <span className="text-stone-400">OFF (0/12)</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Version History & Rollback Safeguards */}
        <div className={YUME_ADMIN_TOKENS.cardClass}>
          <YumeAdminSectionHeader
            title="Entitlement Registry Version History & Rollback Safeguards"
            subtitle={`Current Active Version: v${permissionsConfig.version} · Automatic snapshots saved before every plan mutation (up to 20 versions).`}
          />
          {(!permissionsConfig.history ||
            permissionsConfig.history.length === 0) ? (
            <div className="p-4 rounded-xl bg-stone-50/80 dark:bg-slate-950 border border-stone-200/80 dark:border-slate-800 text-xs text-stone-500 dark:text-slate-400">
              No prior snapshots recorded yet. Any modification to a plan's
              commercial pricing, quotas, or feature switches automatically
              creates a rollback point here.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {permissionsConfig.history.slice(0, 8).map((snap) => (
                <div
                  key={`${snap.version}-${snap.savedAt}`}
                  className="p-3 rounded-xl bg-stone-50/80 dark:bg-slate-950 border border-stone-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 text-[10.5px] font-sans font-bold">
                      v{snap.version}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white">
                        {snap.note}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-slate-400 font-sans">
                        Saved {new Date(snap.savedAt).toLocaleString()} by{" "}
                        {snap.savedBy}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmModalState({
                        title: `Rollback Entitlements to v${snap.version}?`,
                        subtitle: "Versioned Registry Rollback",
                        description: `This will restore all 5 canonical plans to snapshot v${snap.version} (${new Date(
                          snap.savedAt
                        ).toLocaleString()}). Current settings will be saved into history before rolling back.`,
                        confirmLabel: `Rollback to v${snap.version}`,
                        variant: "warning",
                        onConfirm: () => {
                          const restored = rollbackPlatformPermissionsConfig(
                            snap.version
                          );
                          if (restored) {
                            recordPlatformAuditLog({
                              module: "permissions",
                              actionType: "edit",
                              targetType: "plan",
                              targetId: `rollback_v${snap.version}`,
                              targetName: `Registry Rollback v${snap.version}`,
                              summary: `Rolled back Canonical Plan Entitlements Registry to snapshot v${snap.version}.`,
                            });
                            triggerToast(
                              `Rolled back entitlements registry to v${snap.version}.`
                            );
                          }
                        },
                      })
                    }
                    className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Rollback to v{snap.version}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <YumeAdminConfirmModal
          isOpen={Boolean(confirmModalState)}
          title={confirmModalState?.title || ""}
          subtitle={confirmModalState?.subtitle}
          description={confirmModalState?.description || ""}
          confirmLabel={confirmModalState?.confirmLabel}
          variant={confirmModalState?.variant || "warning"}
          onConfirm={() => confirmModalState?.onConfirm()}
          onCancel={() => setConfirmModalState(null)}
        />
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: DEDICATED PLAN PERMISSIONS DRILL-DOWN WORKBENCH
  // ============================================================================
  const activePlan: PlanPermissionConfig =
    permissionsConfig.plans[selectedPlanId];
  const activeCounts = calculatePlanFeatureCounts(activePlan);
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesSearch = (text: string) => {
    if (!normalizedQuery) return true;
    return text.toLowerCase().includes(normalizedQuery);
  };

  const currentPlanIndex = SUBSCRIPTION_PLANS.indexOf(selectedPlanId);
  const nextPlanId =
    SUBSCRIPTION_PLANS[(currentPlanIndex + 1) % SUBSCRIPTION_PLANS.length];

  return (
    <div className="space-y-5">
      {saveToastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#1e2631] text-white text-xs font-semibold shadow-xl border border-white/15">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveToastMessage}</span>
        </div>
      )}

      {/* Add New Product Horizontal Sub-Navigation Card Strip for the 5 Canonical Plans */}
      <YumeAdminSubNavStrip<SubscriptionPlanId>
        activeId={selectedPlanId}
        onSelect={setSelectedPlanId}
        items={SUBSCRIPTION_PLANS.map((planId) => {
          const p = permissionsConfig.plans[planId];
          const c = calculatePlanFeatureCounts(p);
          return {
            id: planId,
            label: `${p.planName} Plan`,
            subtitle: `${c.enabledCount} enabled · ${c.disabledCount} disabled`,
            icon: planMeta[planId].icon,
            badge: `${c.enabledCount}/${c.totalCount}`,
          };
        })}
      />

      {/* Plan Drill-Down Header & Search Toolbar Card */}
      <div className={YUME_ADMIN_TOKENS.cardClass}>
        <YumeAdminSectionHeader
          title={`${activePlan.planName} Plan — Feature Permissions & Quotas`}
          subtitle={activePlan.tagline}
          rightContent={
            <>
              <button
                type="button"
                onClick={() => setSelectedPlanId(null)}
                className={YUME_ADMIN_TOKENS.secondaryButtonClass}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All 5 Plans</span>
              </button>
              <button
                type="button"
                onClick={() => handleResetSinglePlan(selectedPlanId)}
                className={YUME_ADMIN_TOKENS.secondaryButtonClass}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset {activePlan.planName}</span>
              </button>
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search features inside ${activePlan.planName} (e.g. Reels, Story Slots, COD & Profit, Connect to Sheet)...`}
              className={`${YUME_ADMIN_TOKENS.inputClass} pl-10`}
            />
          </div>
          <div className="md:col-span-4 flex items-center justify-end gap-3 text-xs font-semibold text-stone-600 dark:text-slate-300">
            <span>
              Enabled:{" "}
              <strong className="font-sans tabular-nums text-emerald-600 dark:text-emerald-400">
                {activeCounts.enabledCount}
              </strong>
            </span>
            <span>·</span>
            <span>
              Disabled:{" "}
              <strong className="font-sans tabular-nums text-stone-800 dark:text-slate-200">
                {activeCounts.disabledCount}
              </strong>
            </span>
            <span>·</span>
            <span>
              Stores:{" "}
              <strong className="font-sans tabular-nums text-stone-900 dark:text-white">
                {storeCountByPlan[selectedPlanId] || 0}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          FEATURE GROUP 0: COMMERCIAL PRICING & OPERATIONAL QUOTAS
          ===================================================================== */}
      <div className={YUME_ADMIN_TOKENS.cardClass}>
        <YumeAdminSectionHeader
          title="Group 0: Commercial Pricing & Operational Quotas"
          subtitle="Centralized subscription billing configuration and hard operational quotas enforced across Merchant Space, Custom Domains, and YUME Ads."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          <div>
            <label className={YUME_ADMIN_TOKENS.labelClass}>
              Monthly Price (DZD)
            </label>
            <input
              type="number"
              min={0}
              value={activePlan.commercial?.monthlyDzd ?? 0}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                mutatePlan(selectedPlanId, (plan) => {
                  plan.commercial.monthlyDzd = val;
                  return plan;
                });
              }}
              className={YUME_ADMIN_TOKENS.monoInputClass}
            />
          </div>
          <div>
            <label className={YUME_ADMIN_TOKENS.labelClass}>
              Trial Days
            </label>
            <input
              type="number"
              min={0}
              max={90}
              value={activePlan.commercial?.trialDays ?? 0}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                mutatePlan(selectedPlanId, (plan) => {
                  plan.commercial.trialDays = val;
                  return plan;
                });
              }}
              className={YUME_ADMIN_TOKENS.monoInputClass}
            />
          </div>
          <div>
            <label className={YUME_ADMIN_TOKENS.labelClass}>
              Max Active Products
            </label>
            <input
              type="number"
              min={1}
              value={activePlan.quotas?.maxActiveProducts ?? 25}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                mutatePlan(selectedPlanId, (plan) => {
                  plan.quotas.maxActiveProducts = val;
                  return plan;
                });
              }}
              className={YUME_ADMIN_TOKENS.monoInputClass}
            />
          </div>
          <div>
            <label className={YUME_ADMIN_TOKENS.labelClass}>
              Max Custom Domains
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={activePlan.quotas?.maxCustomDomains ?? 0}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                mutatePlan(selectedPlanId, (plan) => {
                  plan.quotas.maxCustomDomains = val;
                  return plan;
                });
              }}
              className={YUME_ADMIN_TOKENS.monoInputClass}
            />
          </div>
          <div>
            <label className={YUME_ADMIN_TOKENS.labelClass}>
              Max Sponsored Ads
            </label>
            <input
              type="number"
              min={0}
              max={50}
              value={activePlan.quotas?.maxSponsoredAdSlots ?? 0}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                mutatePlan(selectedPlanId, (plan) => {
                  plan.quotas.maxSponsoredAdSlots = val;
                  return plan;
                });
              }}
              className={YUME_ADMIN_TOKENS.monoInputClass}
            />
          </div>
          <div>
            <label className={YUME_ADMIN_TOKENS.labelClass}>
              Max Store Campaigns
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={activePlan.quotas?.maxStoreCampaigns ?? 1}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                mutatePlan(selectedPlanId, (plan) => {
                  plan.quotas.maxStoreCampaigns = val;
                  return plan;
                });
              }}
              className={YUME_ADMIN_TOKENS.monoInputClass}
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          FEATURE GROUP 1: PROFILE STORE (7 INDEPENDENT FEATURES)
          ===================================================================== */}
      <div className={YUME_ADMIN_TOKENS.cardClass}>
        <YumeAdminSectionHeader
          title="Group 1: Profile Store"
          subtitle="Independently enable or disable each storefront profile navigation tab for merchants on this plan."
          rightContent={
            <>
              <span className="text-xs font-sans tabular-nums font-bold text-stone-600 dark:text-slate-300 mr-1">
                {
                  PROFILE_STORE_FEATURES_META.filter(
                    (m) => activePlan.profileStore[m.key]?.enabled
                  ).length
                }{" "}
                / 7 Enabled
              </span>
              <button
                type="button"
                onClick={() =>
                  mutatePlan(
                    selectedPlanId,
                    (plan) => {
                      PROFILE_STORE_FEATURES_META.forEach((f) => {
                        plan.profileStore[f.id].enabled = true;
                      });
                      return plan;
                    },
                    `Enabled all 7 Profile Store tabs for ${activePlan.planName}.`
                  )
                }
                className={YUME_ADMIN_TOKENS.secondaryButtonClass}
              >
                Enable All 7
              </button>
              <button
                type="button"
                onClick={() =>
                  setConfirmModalState({
                    title: `Disable All 7 Profile Store Tabs for ${activePlan.planName}?`,
                    subtitle: "Bulk Storefront Visibility Change",
                    description: `Turning off all 7 Profile Store tabs (Products, Reels, Compare, Picks, Reviews, Saved, Deals) will hide those navigation tabs on ${activePlan.planName} merchant storefronts. Existing merchant data remains preserved.`,
                    confirmLabel: "Disable All 7 Tabs",
                    variant: "warning",
                    onConfirm: () =>
                      mutatePlan(
                        selectedPlanId,
                        (plan) => {
                          PROFILE_STORE_FEATURES_META.forEach((f) => {
                            plan.profileStore[f.id].enabled = false;
                          });
                          return plan;
                        },
                        `Disabled all 7 Profile Store tabs for ${activePlan.planName}.`
                      ),
                  })
                }
                className={YUME_ADMIN_TOKENS.secondaryButtonClass}
              >
                Disable All
              </button>
            </>
          }
        />

        <div className="divide-y divide-stone-200/70 dark:divide-slate-800">
          {PROFILE_STORE_FEATURES_META.filter((f) =>
            matchesSearch(`${f.label} ${f.description} profile store`)
          ).map((featureMeta) => {
            const featConfig = activePlan.profileStore[featureMeta.id];
            const editPanelKey = `profile-${featureMeta.id}`;
            const isEditOpen = Boolean(expandedEditPanels[editPanelKey]);

            return (
              <div key={featureMeta.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                        featConfig.enabled
                          ? "bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 border-transparent"
                          : "bg-stone-100 dark:bg-slate-800 text-stone-400 border-stone-200/80 dark:border-slate-700"
                      }`}
                    >
                      <Store className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-stone-900 dark:text-white">
                          {featureMeta.label}
                        </span>
                        <span
                          className={`text-[10.5px] font-sans font-bold ${
                            featConfig.enabled
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-stone-400 dark:text-slate-500"
                          }`}
                        >
                          · {featConfig.enabled ? "ON" : "OFF"}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                        {featureMeta.description}
                      </p>
                    </div>
                  </div>

                  {/* Controls: ON/OFF Switch + EDIT Button */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => toggleEditPanel(editPanelKey)}
                      className={
                        isEditOpen
                          ? YUME_ADMIN_TOKENS.primaryButtonClass
                          : YUME_ADMIN_TOKENS.secondaryButtonClass
                      }
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>EDIT</span>
                      {isEditOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <YumeAdminToggle
                      checked={featConfig.enabled}
                      onChange={(nextVal) =>
                        mutatePlan(
                          selectedPlanId,
                          (plan) => {
                            plan.profileStore[featureMeta.id].enabled = nextVal;
                            return plan;
                          },
                          `${activePlan.planName}: Profile Store "${
                            featureMeta.label
                          }" turned ${nextVal ? "ON" : "OFF"}.`
                        )
                      }
                      ariaLabel={`Toggle ${featureMeta.label} for ${activePlan.planName}`}
                    />
                  </div>
                </div>

                {/* Inline Expandable EDIT Configuration Panel */}
                {isEditOpen && (
                  <div className={`mt-3.5 ${YUME_ADMIN_TOKENS.innerPanelClass}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <div>
                        <label className={YUME_ADMIN_TOKENS.labelClass}>
                          Tab visibility status
                        </label>
                        <div className="text-xs text-stone-600 dark:text-slate-300">
                          {featConfig.enabled
                            ? `Visible on ${activePlan.planName} merchant storefronts.`
                            : `Hidden on ${activePlan.planName} merchant storefronts (data preserved).`}
                        </div>
                      </div>

                      <div>
                        <label className={YUME_ADMIN_TOKENS.labelClass}>
                          Default sort order
                        </label>
                        <select
                          value={featConfig.defaultSortOrder || "popular"}
                          onChange={(e) => {
                            const val = e.target.value as
                              | "popular"
                              | "newest"
                              | "priceAsc"
                              | "priceDesc";
                            mutatePlan(
                              selectedPlanId,
                              (plan) => {
                                plan.profileStore[
                                  featureMeta.id as ProfileStoreFeatureId
                                ].defaultSortOrder = val;
                                return plan;
                              },
                              `Updated default sort order for ${featureMeta.label} in ${activePlan.planName}.`
                            );
                          }}
                          className={YUME_ADMIN_TOKENS.selectClass}
                        >
                          <option value="popular">Most Popular First</option>
                          <option value="newest">Newest Arrivals First</option>
                          <option value="priceAsc">Price: Low to High</option>
                          <option value="priceDesc">Price: High to Low</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                          Highlight in Store Toolbar
                        </span>
                        <YumeAdminToggle
                          size="sm"
                          checked={featConfig.highlightInToolbar !== false}
                          onChange={(nextVal) =>
                            mutatePlan(selectedPlanId, (plan) => {
                              plan.profileStore[
                                featureMeta.id as ProfileStoreFeatureId
                              ].highlightInToolbar = nextVal;
                              return plan;
                            })
                          }
                          ariaLabel={`Highlight ${featureMeta.label} in toolbar`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          FEATURE GROUP 2: MANAGE STORIES (SLOTS & CONTENT TYPES)
          ===================================================================== */}
      {matchesSearch("manage stories story slots images videos text") && (
        <div className={YUME_ADMIN_TOKENS.cardClass}>
          <YumeAdminSectionHeader
            title="Group 2: Manage Stories"
            subtitle="Control 24h merchant story publishing, maximum Story Slots allocation, and allowed media types (Images, Videos, Text)."
            rightContent={
              <>
                <button
                  type="button"
                  onClick={() => toggleEditPanel("manage-stories")}
                  className={
                    expandedEditPanels["manage-stories"]
                      ? YUME_ADMIN_TOKENS.primaryButtonClass
                      : YUME_ADMIN_TOKENS.secondaryButtonClass
                  }
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>EDIT</span>
                  {expandedEditPanels["manage-stories"] ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                <YumeAdminToggle
                  checked={activePlan.manageStories.enabled}
                  onChange={(nextVal) =>
                    mutatePlan(
                      selectedPlanId,
                      (plan) => {
                        plan.manageStories.enabled = nextVal;
                        return plan;
                      },
                      `${activePlan.planName}: Manage Stories turned ${
                        nextVal ? "ON" : "OFF"
                      }.`
                    )
                  }
                  ariaLabel={`Toggle Manage Stories for ${activePlan.planName}`}
                />
              </>
            }
          />

          <YumeAdminAdviceBanner label="ADVICE:">
            Story Slots are never fixed to a default number. Specify the exact
            slot capacity and supported content types (Images, Videos, Text) for{" "}
            {activePlan.planName} below.
          </YumeAdminAdviceBanner>

          {/* Manage Stories EDIT Configuration Panel */}
          {expandedEditPanels["manage-stories"] && (
            <div
              className={`grid grid-cols-1 lg:grid-cols-12 gap-5 ${
                !activePlan.manageStories.enabled ? "opacity-60" : ""
              }`}
            >
              {/* A. STORY SLOTS */}
              <div
                className={`lg:col-span-5 ${YUME_ADMIN_TOKENS.innerPanelClass} flex flex-col justify-between gap-4`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 dark:text-white">
                      A. Story Slots Capacity
                    </span>
                    <span className="text-xs font-sans tabular-nums font-bold text-[#1e2631] dark:text-sky-400">
                      {activePlan.manageStories.storySlots} Slots
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
                    Manually set the maximum number of Story Slots available to
                    merchants subscribed to{" "}
                    <strong>{activePlan.planName}</strong>.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={!activePlan.manageStories.enabled}
                      onClick={() => {
                        const nextSlots = Math.max(
                          1,
                          activePlan.manageStories.storySlots - 1
                        );
                        mutatePlan(
                          selectedPlanId,
                          (plan) => {
                            plan.manageStories.storySlots = nextSlots;
                            return plan;
                          },
                          `${activePlan.planName}: Story Slots set to ${nextSlots}.`
                        );
                      }}
                      className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                    >
                      −
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={50}
                      disabled={!activePlan.manageStories.enabled}
                      value={activePlan.manageStories.storySlots}
                      onChange={(e) => {
                        const parsed = Math.max(
                          1,
                          Math.min(50, parseInt(e.target.value, 10) || 1)
                        );
                        mutatePlan(selectedPlanId, (plan) => {
                          plan.manageStories.storySlots = parsed;
                          return plan;
                        });
                      }}
                      className={`${YUME_ADMIN_TOKENS.monoInputClass} text-center`}
                    />

                    <button
                      type="button"
                      disabled={!activePlan.manageStories.enabled}
                      onClick={() => {
                        const nextSlots = Math.min(
                          50,
                          activePlan.manageStories.storySlots + 1
                        );
                        mutatePlan(
                          selectedPlanId,
                          (plan) => {
                            plan.manageStories.storySlots = nextSlots;
                            return plan;
                          },
                          `${activePlan.planName}: Story Slots set to ${nextSlots}.`
                        );
                      }}
                      className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Slot Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-stone-400 mr-1">
                      Quick set:
                    </span>
                    {[1, 2, 4, 6, 8, 10, 12, 16].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={!activePlan.manageStories.enabled}
                        onClick={() =>
                          mutatePlan(
                            selectedPlanId,
                            (plan) => {
                              plan.manageStories.storySlots = preset;
                              return plan;
                            },
                            `${activePlan.planName}: Story Slots set to ${preset}.`
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-sans tabular-nums font-bold transition-all cursor-pointer border ${
                          activePlan.manageStories.storySlots === preset
                            ? "bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 border-transparent"
                            : "bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:border-stone-400"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* B. SUPPORTED STORY CONTENT TYPES */}
              <div
                className={`lg:col-span-7 ${YUME_ADMIN_TOKENS.innerPanelClass} flex flex-col justify-between gap-4`}
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-stone-900 dark:text-white">
                    B. Supported Story Content Types
                  </span>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Independently enable or disable which media formats
                    merchants on <strong>{activePlan.planName}</strong> can
                    publish inside their story slots.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(
                    [
                      {
                        key: "images" as const,
                        label: "Images",
                        desc: "Photo & graphic stories",
                        icon: ImageIcon,
                      },
                      {
                        key: "videos" as const,
                        label: "Videos",
                        desc: "Short vertical video clips",
                        icon: Video,
                      },
                      {
                        key: "text" as const,
                        label: "Text",
                        desc: "Typography & announcement cards",
                        icon: Type,
                      },
                    ] as const
                  ).map((mediaItem) => {
                    const isAllowed =
                      activePlan.manageStories.supportedContentTypes[
                        mediaItem.key
                      ];
                    const MediaIcon = mediaItem.icon;
                    return (
                      <div
                        key={mediaItem.key}
                        className="p-3.5 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-stone-100 dark:bg-slate-800 text-[#1e2631] dark:text-sky-400">
                            <MediaIcon className="w-4 h-4" />
                          </div>
                          <YumeAdminToggle
                            size="sm"
                            disabled={!activePlan.manageStories.enabled}
                            checked={isAllowed}
                            onChange={(nextVal) =>
                              mutatePlan(
                                selectedPlanId,
                                (plan) => {
                                  plan.manageStories.supportedContentTypes[
                                    mediaItem.key
                                  ] = nextVal;
                                  return plan;
                                },
                                `${activePlan.planName}: Story "${
                                  mediaItem.label
                                }" ${nextVal ? "enabled" : "disabled"}.`
                              )
                            }
                            ariaLabel={`Toggle ${mediaItem.label} story content type`}
                          />
                        </div>

                        <div>
                          <div className="text-xs font-bold text-stone-900 dark:text-white">
                            {mediaItem.label}
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                            {mediaItem.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          FEATURE GROUP 3: ORDERS (SIMPLE VIEW & ADVANCED VIEW + 12 SUB-FEATURES)
          ===================================================================== */}
      <div className={YUME_ADMIN_TOKENS.cardClass}>
        <YumeAdminSectionHeader
          title="Group 3: Orders"
          subtitle="Independent control over Simple View and Advanced View (including all 12 internal Advanced View sections and tools)."
        />

        <div className="space-y-4">
          {/* MODE A: SIMPLE VIEW */}
          {matchesSearch("orders simple view classic standard") && (
            <div className={YUME_ADMIN_TOKENS.innerPanelClass}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      activePlan.orders.simpleView.enabled
                        ? "bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 border-transparent"
                        : "bg-white dark:bg-slate-900 text-stone-400 border-stone-200 dark:border-slate-800"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-stone-900 dark:text-white">
                        A. Simple View
                      </span>
                      <span
                        className={`text-[10.5px] font-sans font-bold ${
                          activePlan.orders.simpleView.enabled
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-stone-400"
                        }`}
                      >
                        · {activePlan.orders.simpleView.enabled ? "ON" : "OFF"}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                      Streamlined order cards, quick status progression, and
                      essential customer contact details. Independent from
                      Advanced View.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => toggleEditPanel("orders-simple")}
                    className={
                      expandedEditPanels["orders-simple"]
                        ? YUME_ADMIN_TOKENS.primaryButtonClass
                        : YUME_ADMIN_TOKENS.secondaryButtonClass
                    }
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>EDIT</span>
                    {expandedEditPanels["orders-simple"] ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <YumeAdminToggle
                    checked={activePlan.orders.simpleView.enabled}
                    onChange={(nextVal) =>
                      mutatePlan(
                        selectedPlanId,
                        (plan) => {
                          plan.orders.simpleView.enabled = nextVal;
                          return plan;
                        },
                        `${activePlan.planName}: Orders Simple View turned ${
                          nextVal ? "ON" : "OFF"
                        }.`
                      )
                    }
                    ariaLabel="Toggle Orders Simple View"
                  />
                </div>
              </div>

              {expandedEditPanels["orders-simple"] && (
                <div className="mt-4 pt-4 border-t border-stone-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white">
                        Set as Default Landing Mode
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-slate-400">
                        Open Simple View first when merchant clicks Orders
                      </div>
                    </div>
                    <YumeAdminToggle
                      size="sm"
                      disabled={!activePlan.orders.simpleView.enabled}
                      checked={Boolean(
                        activePlan.orders.simpleView.defaultView
                      )}
                      onChange={(nextVal) =>
                        mutatePlan(selectedPlanId, (plan) => {
                          plan.orders.simpleView.defaultView = nextVal;
                          return plan;
                        })
                      }
                      ariaLabel="Set Simple View as default landing mode"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white">
                        Quick One-Click Status Actions
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-slate-400">
                        Allow instant Accept / Ship / Deliver buttons on order
                        cards
                      </div>
                    </div>
                    <YumeAdminToggle
                      size="sm"
                      disabled={!activePlan.orders.simpleView.enabled}
                      checked={
                        activePlan.orders.simpleView.allowQuickStatusUpdate !==
                        false
                      }
                      onChange={(nextVal) =>
                        mutatePlan(selectedPlanId, (plan) => {
                          plan.orders.simpleView.allowQuickStatusUpdate =
                            nextVal;
                          return plan;
                        })
                      }
                      ariaLabel="Allow quick status actions"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE B: ADVANCED VIEW + 12 INTERNAL SECTIONS & TOOLS */}
          <div className={YUME_ADMIN_TOKENS.innerPanelClass}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    activePlan.orders.advancedView.enabled
                      ? "bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 border-transparent"
                      : "bg-white dark:bg-slate-900 text-stone-400 border-stone-200 dark:border-slate-800"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-stone-900 dark:text-white">
                      B. Advanced View
                    </span>
                    <span
                      className={`text-[10.5px] font-sans font-bold ${
                        activePlan.orders.advancedView.enabled
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-stone-400"
                      }`}
                    >
                      ·{" "}
                      {activePlan.orders.advancedView.enabled
                        ? `ON (${
                            ADVANCED_ORDERS_SUBFEATURES_META.filter(
                              (m) =>
                                activePlan.orders.advancedView.subFeatures[
                                  m.key
                                ]
                            ).length
                          }/12 Sub-Features Active)`
                        : "OFF (All 12 Sub-Features Unavailable)"}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    Full ERP order management suite with 11 specialized
                    analytical &amp; fulfillment tabs plus Google Sheets live
                    sync.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => toggleEditPanel("orders-advanced")}
                  className={
                    expandedEditPanels["orders-advanced"]
                      ? YUME_ADMIN_TOKENS.primaryButtonClass
                      : YUME_ADMIN_TOKENS.secondaryButtonClass
                  }
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>EDIT (12 Sections)</span>
                  {expandedEditPanels["orders-advanced"] ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                <YumeAdminToggle
                  checked={activePlan.orders.advancedView.enabled}
                  onChange={(nextVal) =>
                    mutatePlan(
                      selectedPlanId,
                      (plan) => {
                        plan.orders.advancedView.enabled = nextVal;
                        return plan;
                      },
                      `${activePlan.planName}: Orders Advanced View turned ${
                        nextVal ? "ON" : "OFF"
                      }.`
                    )
                  }
                  ariaLabel="Toggle Orders Advanced View"
                />
              </div>
            </div>

            {expandedEditPanels["orders-advanced"] && (
              <div className="mt-4 pt-4 border-t border-stone-200/80 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs text-stone-600 dark:text-slate-300 font-medium">
                    {activePlan.orders.advancedView.enabled ? (
                      <span>
                        <strong>Dependency Rule Active:</strong> Advanced View
                        is ON. Toggle any of the 12 internal sections and tools
                        below for <strong>{activePlan.planName}</strong>.
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-300 font-semibold">
                        Advanced View is currently OFF. All 12 internal sections
                        below are unavailable until Advanced View is turned ON.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={!activePlan.orders.advancedView.enabled}
                      onClick={() =>
                        mutatePlan(
                          selectedPlanId,
                          (plan) => {
                            ADVANCED_ORDERS_SUBFEATURES_META.forEach((sf) => {
                              plan.orders.advancedView.subFeatures[sf.id] =
                                true;
                            });
                            return plan;
                          },
                          `Enabled all 12 Advanced View sections for ${activePlan.planName}.`
                        )
                      }
                      className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                    >
                      Enable All 12
                    </button>
                    <button
                      type="button"
                      disabled={!activePlan.orders.advancedView.enabled}
                      onClick={() =>
                        setConfirmModalState({
                          title: `Disable All 12 Advanced View Sections for ${activePlan.planName}?`,
                          subtitle: "Bulk Orders ERP Capability Change",
                          description: `All 12 internal Advanced View sections and tools (including Delivery Matrix, Profit Simulator, Abandonment Recovery, and Connect to Sheet) will be turned OFF for ${activePlan.planName} merchants.`,
                          confirmLabel: "Disable All 12 Sections",
                          variant: "warning",
                          onConfirm: () =>
                            mutatePlan(
                              selectedPlanId,
                              (plan) => {
                                ADVANCED_ORDERS_SUBFEATURES_META.forEach(
                                  (sf) => {
                                    plan.orders.advancedView.subFeatures[
                                      sf.id
                                    ] = false;
                                  }
                                );
                                return plan;
                              },
                              `Disabled all 12 Advanced View sections for ${activePlan.planName}.`
                            ),
                        })
                      }
                      className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                    >
                      Disable All 12
                    </button>
                  </div>
                </div>

                {/* 12 Internal Sub-Feature Cards */}
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${
                    !activePlan.orders.advancedView.enabled ? "opacity-55" : ""
                  }`}
                >
                  {ADVANCED_ORDERS_SUBFEATURES_META.filter((sf) =>
                    matchesSearch(`${sf.label} ${sf.description} orders`)
                  ).map((subMeta, idx) => {
                    const isSubOn =
                      activePlan.orders.advancedView.subFeatures[subMeta.id];
                    const isEffectiveOn =
                      activePlan.orders.advancedView.enabled && isSubOn;

                    return (
                      <div
                        key={subMeta.id}
                        className="p-3.5 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-full text-[10px] font-sans tabular-nums font-bold flex items-center justify-center shrink-0 ${
                                isEffectiveOn
                                  ? "bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950"
                                  : "bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-stone-900 dark:text-white truncate flex items-center gap-1.5">
                                {subMeta.id === "connectToSheet" && (
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                )}
                                <span className="truncate">
                                  {subMeta.label}
                                </span>
                              </div>
                            </div>
                          </div>

                          <YumeAdminToggle
                            size="sm"
                            disabled={!activePlan.orders.advancedView.enabled}
                            checked={isSubOn}
                            onChange={(nextVal) =>
                              mutatePlan(
                                selectedPlanId,
                                (plan) => {
                                  plan.orders.advancedView.subFeatures[
                                    subMeta.id as AdvancedOrdersSubFeatureId
                                  ] = nextVal;
                                  return plan;
                                },
                                `${activePlan.planName}: "${
                                  subMeta.label
                                }" turned ${nextVal ? "ON" : "OFF"}.`
                              )
                            }
                            ariaLabel={`Toggle ${subMeta.label} for ${activePlan.planName}`}
                          />
                        </div>

                        <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
                          {subMeta.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Footer Bar matching Add New Product ("<- Back to Catalog | Step 1 of 5 | Next Step ->") */}
      <YumeAdminActionFooter
        leftContent={
          <button
            type="button"
            onClick={() => setSelectedPlanId(null)}
            className={YUME_ADMIN_TOKENS.secondaryButtonClass}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Plans</span>
          </button>
        }
        centerText={`Plan ${currentPlanIndex + 1} of ${
          SUBSCRIPTION_PLANS.length
        } · ${activePlan.planName} (${activeCounts.enabledCount} Enabled / ${
          activeCounts.disabledCount
        } Disabled)`}
        rightContent={
          <button
            type="button"
            onClick={() => setSelectedPlanId(nextPlanId)}
            className={YUME_ADMIN_TOKENS.primaryButtonClass}
          >
            <span>Configure {nextPlanId}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      />

      <YumeAdminConfirmModal
        isOpen={Boolean(confirmModalState)}
        title={confirmModalState?.title || ""}
        subtitle={confirmModalState?.subtitle}
        description={confirmModalState?.description || ""}
        confirmLabel={confirmModalState?.confirmLabel}
        variant={confirmModalState?.variant || "warning"}
        onConfirm={() => confirmModalState?.onConfirm()}
        onCancel={() => setConfirmModalState(null)}
      />
    </div>
  );
};

export default PlatformPermissionsManager;
