import React, { useState } from "react";
import {
  Shield,
  Sliders,
  Layers,
  Award,
  Activity,
  BarChart3,
  Save,
  RotateCcw,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import type {
  CanonicalSubscriptionPlanId,
  PartnerPickChannelId,
  PartnerPickProductPlacement,
  PartnerPicksGlobalConfig,
  PartnerPicksPartnership,
} from "../types";
import {
  CANONICAL_PARTNER_PICKS_PLAN_IDS,
  PARTNER_PICK_CHANNEL_IDS,
  createDefaultPartnerPicksGlobalConfig,
  normalizePartnerPicksGlobalConfig,
} from "../utils/partnerPicksSchema";

export interface PartnerPicksAdminWorkspaceProps {
  globalConfig: PartnerPicksGlobalConfig;
  partnerships: PartnerPicksPartnership[];
  placements: PartnerPickProductPlacement[];
  analyticsBreakdownByChannel?: Record<
    PartnerPickChannelId,
    {
      channelId: PartnerPickChannelId;
      opportunities: number;
      impressions: number;
      uniqueVisitors: number;
      clicks: number;
      skips: number;
      originalProductOpens: number;
      ctrPercent: number;
      totalExposureDurationSeconds: number;
    }
  >;
  onSaveGlobalConfig: (
    nextConfig: PartnerPicksGlobalConfig,
    reason?: string
  ) => Promise<void>;
  onAdminGovernanceAction: (payload: {
    targetType: "partnership" | "placement";
    targetId: string;
    action: "SUSPEND" | "REINSTATE";
    reason: string;
  }) => Promise<void>;
}

const CHANNEL_NAMES: Record<PartnerPickChannelId, string> = {
  STORE_BANNER: "1. Store Banner",
  PRODUCT_GRID: "2. Store Product Grid",
  DISCOVER_MORE: "3. Discover More Products",
  REELS_FEED: "4. Reels Feed",
  STORIES: "5. Stories",
};

export const PartnerPicksAdminWorkspace: React.FC<
  PartnerPicksAdminWorkspaceProps
> = ({
  globalConfig,
  partnerships,
  placements,
  analyticsBreakdownByChannel,
  onSaveGlobalConfig,
  onAdminGovernanceAction,
}) => {
  const [draftConfig, setDraftConfig] = useState<PartnerPicksGlobalConfig>(() =>
    normalizePartnerPicksGlobalConfig(globalConfig)
  );
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<
    | "channels"
    | "plan_entitlements"
    | "frequency_fatigue"
    | "partnerships_monitor"
    | "channel_analytics"
  >("channels");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSave = async (customReason?: string) => {
    setIsSaving(true);
    try {
      const normalized = normalizePartnerPicksGlobalConfig(draftConfig);
      setDraftConfig(normalized);
      await onSaveGlobalConfig(
        normalized,
        customReason || "Updated Partner Picks Placement Management settings"
      );
      setSaveMessage(
        "Saved Partner Picks configuration and appended hash-chained audit log."
      );
      setTimeout(() => setSaveMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleChannelEnabled = (chId: PartnerPickChannelId) => {
    setDraftConfig((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [chId]: {
          ...prev.channels[chId],
          enabled: !prev.channels[chId].enabled,
        },
      },
    }));
  };

  return (
    <div
      data-testid="partner-picks-admin-workspace"
      className="space-y-6 text-slate-100"
    >
      {/* Top Governance Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-extrabold tracking-tight">
              Partner Picks → Placement Management & Governance
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                draftConfig.featureEnabled
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}
            >
              {draftConfig.featureEnabled ? "GLOBALLY ENABLED" : "GLOBALLY DISABLED"}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Independent governance for all 5 Partner Picks channels, subscription plan limits, smart frequency & user fatigue decay, and active partnership supervision. Strictly separate from Paid Advertising.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            data-testid="admin-partner-picks-master-toggle"
            onClick={() =>
              setDraftConfig((prev) => ({
                ...prev,
                featureEnabled: !prev.featureEnabled,
              }))
            }
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              draftConfig.featureEnabled
                ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-300"
                : "bg-rose-600/20 border-rose-500/50 text-rose-300"
            }`}
          >
            Master Switch: {draftConfig.featureEnabled ? "ON" : "OFF"}
          </button>

          <button
            type="button"
            onClick={() =>
              setDraftConfig(createDefaultPartnerPicksGlobalConfig())
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Provisional Defaults
          </button>

          <button
            type="button"
            data-testid="admin-partner-picks-save-btn"
            disabled={isSaving}
            onClick={() => handleSave()}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-white hover:bg-stone-100 text-slate-900 text-xs font-bold shadow-md cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "Saving..." : "Save Governance Config"}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Global Context-Scoped Max Partner Cap & Rotation Mode Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-400">
            Max Simultaneous Partner Stores Per Active Host Context
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={10}
              data-testid="admin-max-simultaneous-partners-input"
              value={draftConfig.maxSimultaneousPartnerStores}
              onChange={(e) =>
                setDraftConfig((prev) => ({
                  ...prev,
                  maxSimultaneousPartnerStores: Math.max(
                    1,
                    Math.min(10, Number(e.target.value) || 2)
                  ),
                }))
              }
              className="w-24 rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm font-bold text-white"
            />
            <span className="text-[11px] text-emerald-400 font-semibold">
              Confirmed Default: 2 (Applies across all 5 channels)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-400">
            Default Rotation Mode
          </label>
          <select
            value={draftConfig.defaultRotationMode}
            onChange={(e) =>
              setDraftConfig((prev) => ({
                ...prev,
                defaultRotationMode: e.target.value as
                  | "REFRESH_BASED"
                  | "TIMED_ROTATION",
              }))
            }
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-bold text-white"
          >
            <option value="REFRESH_BASED">
              Refresh-Based Rotation (Default)
            </option>
            <option value="TIMED_ROTATION">
              In-Place Timed Rotation (No Page Reload)
            </option>
          </select>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400">
              Optional Timed Rotation (Disabled by Default)
            </label>
            <input
              type="checkbox"
              checked={draftConfig.timedRotationEnabled}
              onChange={(e) =>
                setDraftConfig((prev) => ({
                  ...prev,
                  timedRotationEnabled: e.target.checked,
                }))
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={5}
              max={3600}
              disabled={!draftConfig.timedRotationEnabled}
              value={draftConfig.timedRotationIntervalSeconds}
              onChange={(e) =>
                setDraftConfig((prev) => ({
                  ...prev,
                  timedRotationIntervalSeconds: Math.max(
                    5,
                    Number(e.target.value) || 30
                  ),
                }))
              }
              className="w-24 rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            />
            <span className="text-[11px] text-slate-400">
              Seconds interval (Provisional seed: 30s)
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        {(
          [
            ["channels", "1. 5 Independent Placement Channels", <Layers className="w-4 h-4" />],
            ["plan_entitlements", "2. Subscription Plan Entitlements", <Award className="w-4 h-4" />],
            ["frequency_fatigue", "3. Smart Frequency & Skip Decay", <Sliders className="w-4 h-4" />],
            ["partnerships_monitor", "4. Partnerships & Placements Monitor", <Activity className="w-4 h-4" />],
            ["channel_analytics", "5. Per-Channel Analytics (Separated)", <BarChart3 className="w-4 h-4" />],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            data-testid={`admin-partner-picks-tab-${id}`}
            onClick={() => setActiveAdminSubTab(id)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
              activeAdminSubTab === id
                ? "bg-white text-slate-900 border-white"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* =====================================================================
          TAB 1: 5 INDEPENDENT PLACEMENT CHANNELS
         ===================================================================== */}
      {activeAdminSubTab === "channels" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PARTNER_PICK_CHANNEL_IDS.map((chId) => {
            const ch = draftConfig.channels[chId];
            return (
              <div
                key={chId}
                data-testid={`admin-channel-card-${chId}`}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold">
                      {CHANNEL_NAMES[chId]}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Independent toggle — enabling/disabling never affects the other 4 channels
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid={`admin-channel-toggle-${chId}`}
                    onClick={() => toggleChannelEnabled(chId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      ch.enabled
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                        : "bg-rose-500/15 border-rose-500/40 text-rose-400"
                    }`}
                  >
                    {ch.enabled ? "Channel Enabled" : "Channel Disabled"}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Max Displayed Products
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={ch.maxDisplayedProducts}
                      onChange={(e) =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          channels: {
                            ...prev.channels,
                            [chId]: {
                              ...prev.channels[chId],
                              maxDisplayedProducts: Math.max(
                                0,
                                Number(e.target.value) || 0
                              ),
                            },
                          },
                        }))
                      }
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Session Cap (Provisional)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={ch.frequencyLimits.maxAppearancesPerSession}
                      onChange={(e) =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          channels: {
                            ...prev.channels,
                            [chId]: {
                              ...prev.channels[chId],
                              frequencyLimits: {
                                ...prev.channels[chId].frequencyLimits,
                                maxAppearancesPerSession: Math.max(
                                  0,
                                  Number(e.target.value) || 0
                                ),
                              },
                            },
                          },
                        }))
                      }
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Daily Cap / User
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={ch.frequencyLimits.maxAppearancesPerDayPerUser}
                      onChange={(e) =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          channels: {
                            ...prev.channels,
                            [chId]: {
                              ...prev.channels[chId],
                              frequencyLimits: {
                                ...prev.channels[chId].frequencyLimits,
                                maxAppearancesPerDayPerUser: Math.max(
                                  0,
                                  Number(e.target.value) || 0
                                ),
                              },
                            },
                          },
                        }))
                      }
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 font-bold"
                    />
                  </div>
                </div>

                {chId === "PRODUCT_GRID" && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">
                      Product Grid Pagination Scope:
                    </span>
                    <select
                      value={
                        ch.spatialPlacementRules?.gridPageScope || "PAGE_1_ONLY"
                      }
                      onChange={(e) =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          channels: {
                            ...prev.channels,
                            PRODUCT_GRID: {
                              ...prev.channels.PRODUCT_GRID,
                              spatialPlacementRules: {
                                ...prev.channels.PRODUCT_GRID
                                  .spatialPlacementRules,
                                gridPageScope: e.target.value as
                                  | "PAGE_1_ONLY"
                                  | "ALL_PAGES",
                              },
                            },
                          },
                        }))
                      }
                      className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 font-bold"
                    >
                      <option value="PAGE_1_ONLY">
                        Page 1 Only (Recommended Default)
                      </option>
                      <option value="ALL_PAGES">All Pages</option>
                    </select>
                  </div>
                )}

                {chId === "STORIES" && (
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-[11px] space-y-1 text-emerald-300">
                    <div className="font-bold">
                      Confirmed Stories Prerequisite & Integrity Invariants:
                    </div>
                    <div>
                      • Require Host Native Stories Enabled: <strong>TRUE</strong>
                    </div>
                    <div>
                      • Require Active Native Story Published at Every Moment:{" "}
                      <strong>FALSE</strong>
                    </div>
                    <div>
                      • Forbid Standalone Promotional Story Ring:{" "}
                      <strong>TRUE</strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          TAB 2: SUBSCRIPTION PLAN ENTITLEMENTS (Basic .. Premium Plus)
         ===================================================================== */}
      {activeAdminSubTab === "plan_entitlements" && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-4">Canonical Plan</th>
                <th className="p-4">Partner Picks Enabled</th>
                <th className="p-4">Max Active Partner Stores (Limit 1)</th>
                <th className="p-4">Max Products / Partnership (Limit 2)</th>
                <th className="p-4">Custom Per-Partner Lists</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {CANONICAL_PARTNER_PICKS_PLAN_IDS.map(
                (planId: CanonicalSubscriptionPlanId) => {
                  const ent = draftConfig.planEntitlements[planId];
                  return (
                    <tr key={planId}>
                      <td className="p-4 font-extrabold text-sm">{planId}</td>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={ent.enabled}
                          onChange={(e) =>
                            setDraftConfig((prev) => ({
                              ...prev,
                              planEntitlements: {
                                ...prev.planEntitlements,
                                [planId]: {
                                  ...prev.planEntitlements[planId],
                                  enabled: e.target.checked,
                                },
                              },
                            }))
                          }
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={ent.maxActivePartnerStores}
                          onChange={(e) =>
                            setDraftConfig((prev) => ({
                              ...prev,
                              planEntitlements: {
                                ...prev.planEntitlements,
                                [planId]: {
                                  ...prev.planEntitlements[planId],
                                  maxActivePartnerStores: Math.max(
                                    0,
                                    Number(e.target.value) || 0
                                  ),
                                },
                              },
                            }))
                          }
                          className="w-20 rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-bold"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={ent.maxProductsPerPartnership}
                          onChange={(e) =>
                            setDraftConfig((prev) => ({
                              ...prev,
                              planEntitlements: {
                                ...prev.planEntitlements,
                                [planId]: {
                                  ...prev.planEntitlements[planId],
                                  maxProductsPerPartnership: Math.max(
                                    0,
                                    Number(e.target.value) || 0
                                  ),
                                },
                              },
                            }))
                          }
                          className="w-20 rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-bold"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={ent.allowCustomPerPartnerProducts}
                          onChange={(e) =>
                            setDraftConfig((prev) => ({
                              ...prev,
                              planEntitlements: {
                                ...prev.planEntitlements,
                                [planId]: {
                                  ...prev.planEntitlements[planId],
                                  allowCustomPerPartnerProducts:
                                    e.target.checked,
                                },
                              },
                            }))
                          }
                        />
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* =====================================================================
          TAB 3: SMART FREQUENCY & USER-SPECIFIC SKIP DECAY
         ===================================================================== */}
      {activeAdminSubTab === "frequency_fatigue" && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-extrabold">
            Configurable Smart Frequency & User-Specific Skip Decay (Zero Global Merchant Penalty)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">
                Cross-Channel Session Cap
              </label>
              <input
                type="number"
                min={0}
                value={draftConfig.smartFrequency.maxCrossChannelExposuresPerSession}
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    smartFrequency: {
                      ...prev.smartFrequency,
                      maxCrossChannelExposuresPerSession:
                        Number(e.target.value) || 0,
                    },
                  }))
                }
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Same Product Cooldown (Seconds)
              </label>
              <input
                type="number"
                min={0}
                value={draftConfig.smartFrequency.sameProductCooldownSeconds}
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    smartFrequency: {
                      ...prev.smartFrequency,
                      sameProductCooldownSeconds: Number(e.target.value) || 0,
                    },
                  }))
                }
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Per-Skip Priority Multiplier (User Only)
              </label>
              <input
                type="number"
                step="0.05"
                min={0.1}
                max={1}
                value={
                  draftConfig.smartFrequency.userSpecificSkipDecay
                    .perSkipPriorityMultiplier
                }
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    smartFrequency: {
                      ...prev.smartFrequency,
                      userSpecificSkipDecay: {
                        ...prev.smartFrequency.userSpecificSkipDecay,
                        perSkipPriorityMultiplier:
                          Number(e.target.value) || 0.7,
                      },
                    },
                  }))
                }
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Recovery Half-Life (Minutes)
              </label>
              <input
                type="number"
                min={1}
                value={
                  draftConfig.smartFrequency.userSpecificSkipDecay
                    .priorityRecoveryHalfLifeMinutes
                }
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    smartFrequency: {
                      ...prev.smartFrequency,
                      userSpecificSkipDecay: {
                        ...prev.smartFrequency.userSpecificSkipDecay,
                        priorityRecoveryHalfLifeMinutes:
                          Number(e.target.value) || 45,
                      },
                    },
                  }))
                }
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: PARTNERSHIPS & PLACEMENTS MONITOR (WITH ADMIN SUSPENSION)
         ===================================================================== */}
      {activeAdminSubTab === "partnerships_monitor" && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-bold">
                Active Marketplace Partnerships ({partnerships.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-800">
              {partnerships.map((p) => (
                <div
                  key={p.id}
                  className="p-4 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-sm">
                      {p.storeAName} ↔ {p.storeBName}
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      ID: {p.id} · Status: <strong>{p.status}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.status !== "SUSPENDED" ? (
                      <button
                        type="button"
                        onClick={() =>
                          onAdminGovernanceAction({
                            targetType: "partnership",
                            targetId: p.id,
                            action: "SUSPEND",
                            reason: "Suspended by Platform Admin review",
                          })
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        Suspend Partnership
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onAdminGovernanceAction({
                            targetType: "partnership",
                            targetId: p.id,
                            action: "REINSTATE",
                            reason: "Reinstated by Platform Admin",
                          })
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        Reinstate Partnership
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: PER-CHANNEL ANALYTICS DASHBOARD (STRICTLY SEPARATED)
         ===================================================================== */}
      {activeAdminSubTab === "channel_analytics" && (
        <div
          data-testid="admin-partner-picks-channel-analytics"
          className="rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto"
        >
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-bold">
              Per-Channel Partner Picks Analytics Breakdown (Reels Feed & Stories Strictly Separated)
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-4">Placement Channel</th>
                <th className="p-4">Opportunities</th>
                <th className="p-4">Impressions</th>
                <th className="p-4">Unique Visitors</th>
                <th className="p-4">Clicks / Opens</th>
                <th className="p-4">Skips</th>
                <th className="p-4">CTR %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {PARTNER_PICK_CHANNEL_IDS.map((chId) => {
                const row = analyticsBreakdownByChannel?.[chId];
                return (
                  <tr key={chId}>
                    <td className="p-4 font-extrabold">{CHANNEL_NAMES[chId]}</td>
                    <td className="p-4">{row?.opportunities ?? 0}</td>
                    <td className="p-4 font-bold">{row?.impressions ?? 0}</td>
                    <td className="p-4">{row?.uniqueVisitors ?? 0}</td>
                    <td className="p-4 text-emerald-400 font-bold">
                      {row?.clicks ?? 0}
                    </td>
                    <td className="p-4 text-slate-400">{row?.skips ?? 0}</td>
                    <td className="p-4 font-bold text-emerald-400">
                      {row?.ctrPercent ?? 0}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
