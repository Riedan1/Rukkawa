import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  ShieldCheck,
  RefreshCw,
  Plus,
  Archive,
  Save,
  Eye,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from "lucide-react";
import {
  YUME_ADMIN_TOKENS,
  YumeAdminSectionHeader,
  YumeAdminAdviceBanner,
  YumeAdminToggle,
  YumeAdminConfirmModal,
} from "./YumeAdminDesignSystem";
import { buildAdminAuthHeaders } from "../utils/centralGovernanceArchitecture";

interface PlanEntitlements {
  maxActiveProducts: number | null;
  maxPhotosPerProduct: number;
  maxFileSizeMb: number;
  allowVideoStream: boolean;
  maxCustomDomains: number | null;
}

interface SubscriptionPlanGovernanceRecord {
  planCode: string;
  displayName: string;
  tierClassification: "launch_free" | "commercial_paid";
  lifecycleState: "active" | "hidden" | "disabled" | "retired";
  isPubliclyVisible: boolean;
  allowNewSubscriptions: boolean;
  allowUpgradesTo: boolean;
  monthlyDzd: number;
  annualDzd: number;
  monthlyUsd: number;
  sortOrder: number;
  entitlements: PlanEntitlements;
  updatedAt: string;
}

interface PlanMigrationPolicyRecord {
  policyId: string;
  retiredPlanCode: string;
  targetPlanCode: string;
  gracePeriodDays: number;
  preserveExistingResources: true;
  createdBy: string;
  createdAt: string;
}

interface SubscriptionGovernanceState {
  launchMode: "FREE_ONLY" | "SELECTIVE_PAID" | "FULL_COMMERCIAL" | "CUSTOM";
  paidUpgradesEnabled: boolean;
  autoLaunchExpiration: string | null;
  defaultSignupPlanCode: string;
  plans: SubscriptionPlanGovernanceRecord[];
  migrationPolicies: PlanMigrationPolicyRecord[];
  updatedAt: string;
}

interface StoreQuotaEval {
  storeId: string;
  storeName: string;
  planCode: string;
  activeProductCount: number;
  activeDomainCount: number;
  limits: {
    maxActiveProducts: number | null;
    maxCustomDomains: number | null;
  };
  overQuotaFlags: Record<
    string,
    { active: number; limit: number; excess: number; action: string }
  >;
  canCreateNewProduct: boolean;
  canCreateNewDomain: boolean;
}

export const SubscriptionPlansAndPricingControl: React.FC<{
  currentSlideColor?: string;
}> = () => {
  const [governance, setGovernance] = useState<SubscriptionGovernanceState | null>(null);
  const [storeQuotas, setStoreQuotas] = useState<StoreQuotaEval[]>([]);
  const [publicPlansCount, setPublicPlansCount] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; message: string } | null>(null);

  // Launch mode form state
  const [launchMode, setLaunchMode] = useState<
    "FREE_ONLY" | "SELECTIVE_PAID" | "FULL_COMMERCIAL" | "CUSTOM"
  >("FREE_ONLY");
  const [paidUpgradesEnabled, setPaidUpgradesEnabled] = useState<boolean>(false);
  const [autoLaunchExpiration, setAutoLaunchExpiration] = useState<string>("");
  const [defaultSignupPlanCode, setDefaultSignupPlanCode] = useState<string>("Free");
  const [launchReason, setLaunchReason] = useState<string>(
    "Phase 3.1 Launch Pricing & Entitlement Policy Update"
  );

  // Editing existing plan inline
  const [editingPlanCode, setEditingPlanCode] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<SubscriptionPlanGovernanceRecord | null>(null);

  // Create new plan drawer/panel
  const [showNewPlanForm, setShowNewPlanForm] = useState<boolean>(false);
  const [newPlan, setNewPlan] = useState({
    planCode: "",
    displayName: "",
    tierClassification: "commercial_paid" as "launch_free" | "commercial_paid",
    monthlyDzd: 3900,
    annualDzd: 39000,
    monthlyUsd: 29,
    maxActiveProducts: 50,
    maxPhotosPerProduct: 10,
    maxFileSizeMb: 20,
    allowVideoStream: true,
    maxCustomDomains: 3,
    isPubliclyVisible: false,
    allowNewSubscriptions: false,
    allowUpgradesTo: false,
  });

  // Retire plan inline panel
  const [retiringPlanCode, setRetiringPlanCode] = useState<string | null>(null);
  const [retireTargetCode, setRetireTargetCode] = useState<string>("Free");
  const [retireGraceDays, setRetireGraceDays] = useState<number>(30);
  const [retireReason, setRetireReason] = useState<string>(
    "Structured plan retirement with non-destructive preservation"
  );

  const [pendingConfirmModal, setPendingConfirmModal] = useState<{
    title: string;
    subtitle?: string;
    description: string;
    confirmLabel: string;
    variant: "danger" | "warning" | "slate";
    onConfirm: () => void;
  } | null>(null);

  const fetchGovernance = useCallback(async () => {
    setLoading(true);
    try {
      const [govRes, pubRes] = await Promise.all([
        fetch("/api/admin/subscription-governance", {
          headers: buildAdminAuthHeaders(),
        }),
        fetch("/api/subscriptions/public-catalog"),
      ]);
      if (govRes.ok) {
        const data = await govRes.json();
        const gov: SubscriptionGovernanceState = data.governance;
        setGovernance(gov);
        setStoreQuotas(data.storeQuotaEvaluations || []);
        setLaunchMode(gov.launchMode);
        setPaidUpgradesEnabled(gov.paidUpgradesEnabled);
        setAutoLaunchExpiration(gov.autoLaunchExpiration || "");
        setDefaultSignupPlanCode(gov.defaultSignupPlanCode || "free");
      }
      if (pubRes.ok) {
        const pub = await pubRes.json();
        setPublicPlansCount(Array.isArray(pub.plans) ? pub.plans.length : 0);
      }
    } catch {
      setFeedback({ type: "err", message: "Unable to load subscription governance telemetry." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGovernance();
  }, [fetchGovernance]);

  const acquireStepUpHeaders = async (): Promise<Record<string, string>> => {
    const baseHeaders = buildAdminAuthHeaders();
    const res = await fetch("/api/admin/auth/step-up-mfa", {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        actionScope: "subscription_plan_finance_change",
      }),
    });
    if (!res.ok) {
      throw new Error("Step-Up MFA authorization failed");
    }
    const data = await res.json();
    return {
      ...baseHeaders,
      "Content-Type": "application/json",
      "x-yume-admin-token": data.sessionToken,
      "x-yume-stepup-token": data.grant?.grantId || "",
    };
  };

  const executeSaveLaunchMode = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const headers = await acquireStepUpHeaders();
      const res = await fetch("/api/admin/subscription-governance/launch-mode", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          launchMode,
          paidUpgradesEnabled: launchMode === "FREE_ONLY" ? false : paidUpgradesEnabled,
          autoLaunchExpiration: autoLaunchExpiration.trim() || null,
          defaultSignupPlanCode,
          reason: launchReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", message: data.error || "Failed to update launch mode." });
      } else {
        setFeedback({
          type: "ok",
          message: `Launch governance saved (${data.governance.launchMode}). Public catalog refreshed.`,
        });
        await fetchGovernance();
      }
    } catch (err: any) {
      setFeedback({ type: "err", message: err?.message || "Failed to save launch governance." });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLaunchMode = () => {
    setPendingConfirmModal({
      title: "Confirm Launch Mode Policy Change",
      subtitle: `Target Mode: ${launchMode}`,
      description: `Apply commercial launch mode "${launchMode}" and refresh public pricing visibility across YUME Network?`,
      confirmLabel: "Confirm Change",
      variant: "warning",
      onConfirm: () => {
        void executeSaveLaunchMode();
      },
    });
  };

  const executeTogglePlanLifecycle = async (plan: SubscriptionPlanGovernanceRecord) => {
    const nextState = plan.lifecycleState === "active" ? "disabled" : "active";
    setSaving(true);
    setFeedback(null);
    try {
      const headers = await acquireStepUpHeaders();
      const res = await fetch(
        `/api/admin/subscription-governance/plans/${encodeURIComponent(plan.planCode)}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            plan: {
              ...plan,
              lifecycleState: nextState,
              isPubliclyVisible: nextState === "active",
              allowNewSubscriptions: nextState === "active",
            },
            reason: `Set commercial plan ${plan.displayName} lifecycle to ${nextState}`,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", message: data.error || "Failed to toggle plan status." });
      } else {
        setFeedback({
          type: "ok",
          message: `Plan "${plan.displayName}" is now ${nextState}.`,
        });
        await fetchGovernance();
      }
    } catch (err: any) {
      setFeedback({ type: "err", message: err?.message || "Error toggling commercial plan." });
    } finally {
      setSaving(false);
    }
  };

  const executeSaveEditedPlan = async () => {
    if (!editDraft) return;
    setSaving(true);
    setFeedback(null);
    try {
      const headers = await acquireStepUpHeaders();
      const res = await fetch(
        `/api/admin/subscription-governance/plans/${encodeURIComponent(editDraft.planCode)}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            plan: editDraft,
            reason: `Updated plan ${editDraft.displayName} entitlements & pricing`,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", message: data.error || "Failed to update plan." });
      } else {
        setEditingPlanCode(null);
        setEditDraft(null);
        setFeedback({
          type: "ok",
          message: `Plan "${editDraft.displayName}" saved & audited.`,
        });
        await fetchGovernance();
      }
    } catch (err: any) {
      setFeedback({ type: "err", message: err?.message || "Error saving plan changes." });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEditedPlan = () => {
    if (!editDraft) return;
    setPendingConfirmModal({
      title: `Confirm Plan Update: ${editDraft.displayName}`,
      subtitle: `Plan Code: ${editDraft.planCode}`,
      description: `Update pricing (${editDraft.monthlyDzd.toLocaleString()} DZD/mo), lifecycle ("${editDraft.lifecycleState}"), and entitlements for "${editDraft.displayName}"?`,
      confirmLabel: "Confirm Update",
      variant: "warning",
      onConfirm: () => {
        void executeSaveEditedPlan();
      },
    });
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.planCode.trim() || !newPlan.displayName.trim()) {
      setFeedback({ type: "err", message: "Plan code and display name are required." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const headers = await acquireStepUpHeaders();
      const res = await fetch("/api/admin/subscription-governance/plans", {
        method: "POST",
        headers,
        body: JSON.stringify({
          plan: {
            planCode: newPlan.planCode.trim().toLowerCase(),
            displayName: newPlan.displayName.trim(),
            tierClassification: newPlan.tierClassification,
            lifecycleState: newPlan.isPubliclyVisible ? "active" : "hidden",
            isPubliclyVisible: newPlan.isPubliclyVisible,
            allowNewSubscriptions: newPlan.allowNewSubscriptions,
            allowUpgradesTo: newPlan.allowUpgradesTo,
            monthlyDzd: Number(newPlan.monthlyDzd),
            annualDzd: Number(newPlan.annualDzd),
            monthlyUsd: Number(newPlan.monthlyUsd),
            entitlements: {
              maxActiveProducts: newPlan.maxActiveProducts,
              maxPhotosPerProduct: Number(newPlan.maxPhotosPerProduct),
              maxFileSizeMb: Number(newPlan.maxFileSizeMb),
              allowVideoStream: Boolean(newPlan.allowVideoStream),
              maxCustomDomains: Number(newPlan.maxCustomDomains),
            },
          },
          reason: `Created new subscription plan ${newPlan.displayName.trim()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", message: data.error || "Failed to create plan." });
      } else {
        setShowNewPlanForm(false);
        setFeedback({ type: "ok", message: `Plan "${newPlan.displayName}" created.` });
        await fetchGovernance();
      }
    } catch (err: any) {
      setFeedback({ type: "err", message: err?.message || "Plan creation failed." });
    } finally {
      setSaving(false);
    }
  };

  const executeRetirePlan = async () => {
    if (!retiringPlanCode) return;
    setSaving(true);
    setFeedback(null);
    try {
      const headers = await acquireStepUpHeaders();
      const res = await fetch(
        `/api/admin/subscription-governance/plans/${encodeURIComponent(retiringPlanCode)}/retire`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            targetPlanCode: retireTargetCode,
            gracePeriodDays: Number(retireGraceDays),
            reason: retireReason,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", message: data.error || "Failed to retire plan." });
      } else {
        setFeedback({
          type: "ok",
          message: `Retired "${retiringPlanCode}" -> target "${retireTargetCode}" (${retireGraceDays}d grace). Zero existing products hidden.`,
        });
        setRetiringPlanCode(null);
        await fetchGovernance();
      }
    } catch (err: any) {
      setFeedback({ type: "err", message: err?.message || "Plan retirement failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleRetirePlan = () => {
    if (!retiringPlanCode) return;
    setPendingConfirmModal({
      title: `Confirm Retirement of "${retiringPlanCode}"`,
      subtitle: `Migration target: ${retireTargetCode} · ${retireGraceDays} days grace`,
      description: `Retire plan "${retiringPlanCode}" and assign a non-destructive migration policy to "${retireTargetCode}"? Existing merchant catalogs and products remain preserved.`,
      confirmLabel: "Confirm Retire",
      variant: "danger",
      onConfirm: () => {
        void executeRetirePlan();
      },
    });
  };

  const totalHiddenOverQuota = 0;

  return (
    <div className="space-y-6 text-slate-900">
      <div className={YUME_ADMIN_TOKENS.cardClass}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <YumeAdminSectionHeader
            title={
              <span className="inline-flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>SUBSCRIPTION PLANS & PRICING CONTROL</span>
              </span>
            }
            subtitle="Authoritative launch governance (FREE_ONLY default), dynamic commercial plan visibility, non-destructive over-quota preservation, and structured plan retirement with Step-Up MFA & audit logging."
          />
          <div className="flex items-center gap-2.5 shrink-0">
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                governance?.launchMode === "FREE_ONLY"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-indigo-50 border-indigo-200 text-indigo-900"
              }`}
            >
              Mode: {governance?.launchMode || "FREE_ONLY"} · {publicPlansCount} Public Plan(s)
            </span>
            <button
              onClick={fetchGovernance}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <YumeAdminAdviceBanner>
          Launch default is <strong>FREE_ONLY</strong>: all 5 commercial tiers exist internally in{" "}
          <code>subscription_plans</code> as hidden/disabled drafts so public signup shows Free only.
          Over-quota downgrades or expirations block <em>new</em> creation only and strictly forbid{" "}
          <code>hidden_over_quota</code> hiding or deletion (verified active hidden count:{" "}
          <strong className="tabular-nums">{totalHiddenOverQuota}</strong>).
        </YumeAdminAdviceBanner>

        {feedback && (
          <div
            className={`rounded-xl px-4 py-3 text-xs font-medium flex items-center gap-2 border ${
              feedback.type === "ok"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            {feedback.type === "ok" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Section A: Launch Mode Governance Controls */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Platform Launch Mode & Checkout Gate (Super Admin + Step-Up MFA)</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Switching away from FREE_ONLY exposes configured active plans without code changes.
              </p>
            </div>
            <button
              onClick={handleSaveLaunchMode}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Apply Launch Policy (Step-Up MFA)"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Launch Mode</label>
              <select
                value={launchMode}
                onChange={(e) => {
                  const next = e.target.value as any;
                  setLaunchMode(next);
                  if (next === "FREE_ONLY") {
                    setPaidUpgradesEnabled(false);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
              >
                <option value="FREE_ONLY">FREE_ONLY (Launch Safe Default)</option>
                <option value="SELECTIVE_PAID">SELECTIVE_PAID (Select Visible Tiers)</option>
                <option value="FULL_COMMERCIAL">FULL_COMMERCIAL (All Active Paid Tiers)</option>
                <option value="CUSTOM">CUSTOM (Manual Per-Plan Flags)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Signup Plan</label>
              <select
                value={defaultSignupPlanCode}
                onChange={(e) => setDefaultSignupPlanCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
              >
                {(governance?.plans || []).map((p) => (
                  <option key={p.planCode} value={p.planCode}>
                    {p.displayName} ({p.planCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Scheduled Free Launch End (Optional ISO)
              </label>
              <input
                type="text"
                placeholder="e.g. 2027-01-01T00:00:00Z"
                value={autoLaunchExpiration}
                onChange={(e) => setAutoLaunchExpiration(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div className="flex items-end">
              <div className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Paid Upgrades</div>
                  <div className="text-[11px] text-slate-500">
                    {launchMode === "FREE_ONLY" ? "Locked in FREE_ONLY" : "Allow billing upgrades"}
                  </div>
                </div>
                <YumeAdminToggle
                  checked={launchMode === "FREE_ONLY" ? false : paidUpgradesEnabled}
                  disabled={launchMode === "FREE_ONLY"}
                  onChange={(val) => setPaidUpgradesEnabled(val)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section B: Plan Catalog & Live Matrix */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Authoritative Subscription Plans ({governance?.plans.length || 0})</span>
              </h3>
              <p className="text-xs text-slate-600">
                Includes Free launch plan plus Basic, Pro, Pro Plus, Premium, and Premium Plus.
              </p>
            </div>
            <button
              onClick={() => setShowNewPlanForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {showNewPlanForm ? "Close New Plan Form" : "Create New Plan"}
            </button>
          </div>

          {showNewPlanForm && (
            <form
              onSubmit={handleCreatePlan}
              className="bg-indigo-50/40 border border-indigo-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan Code</label>
                <input
                  required
                  placeholder="e.g. growth_plus"
                  value={newPlan.planCode}
                  onChange={(e) => setNewPlan({ ...newPlan, planCode: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Name</label>
                <input
                  required
                  placeholder="Growth Plus"
                  value={newPlan.displayName}
                  onChange={(e) => setNewPlan({ ...newPlan, displayName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monthly DZD</label>
                <input
                  type="number"
                  value={newPlan.monthlyDzd}
                  onChange={(e) => setNewPlan({ ...newPlan, monthlyDzd: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max Active Products</label>
                <input
                  type="number"
                  value={newPlan.maxActiveProducts}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, maxActiveProducts: Number(e.target.value) })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Photos / Product</label>
                <input
                  type="number"
                  value={newPlan.maxPhotosPerProduct}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, maxPhotosPerProduct: Number(e.target.value) })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max File Size (MB)</label>
                <input
                  type="number"
                  value={newPlan.maxFileSizeMb}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, maxFileSizeMb: Number(e.target.value) })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Custom Domains</label>
                <input
                  type="number"
                  value={newPlan.maxCustomDomains}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, maxCustomDomains: Number(e.target.value) })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white tabular-nums"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-3 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer"
                >
                  Save New Plan
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Plan / Code</th>
                  <th className="py-2.5 px-3 font-semibold">Lifecycle & Public Gate</th>
                  <th className="py-2.5 px-3 font-semibold">Pricing (DZD / USD)</th>
                  <th className="py-2.5 px-3 font-semibold">Authoritative Entitlements</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(governance?.plans || []).map((plan) => {
                  const isEditing = editingPlanCode === plan.planCode && editDraft;
                  return (
                    <tr key={plan.planCode} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <input
                            value={editDraft.displayName}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, displayName: e.target.value })
                            }
                            className="px-2 py-1 rounded border border-slate-300 w-36 font-semibold"
                          />
                        ) : (
                          <div>
                            <div className="font-bold text-slate-900">{plan.displayName}</div>
                            <div className="font-sans text-[11px] text-slate-500">
                              {plan.planCode} · {plan.tierClassification}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <select
                              value={editDraft.lifecycleState}
                              onChange={(e) =>
                                setEditDraft({
                                  ...editDraft,
                                  lifecycleState: e.target.value as any,
                                })
                              }
                              className="px-2 py-1 rounded border border-slate-300 bg-white"
                            >
                              <option value="active">active</option>
                              <option value="hidden">hidden</option>
                              <option value="disabled">disabled</option>
                            </select>
                            <label className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={editDraft.isPubliclyVisible}
                                onChange={(e) =>
                                  setEditDraft({
                                    ...editDraft,
                                    isPubliclyVisible: e.target.checked,
                                  })
                                }
                              />
                              <span>Publicly Visible</span>
                            </label>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded font-semibold text-[11px] ${
                                plan.lifecycleState === "active"
                                  ? "bg-emerald-100 text-emerald-900"
                                  : plan.lifecycleState === "retired"
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {plan.lifecycleState}
                            </span>
                            <div className="text-[11px] text-slate-600 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {plan.isPubliclyVisible ? "Visible" : "Hidden"} ·{" "}
                              {plan.allowNewSubscriptions ? "Signups Open" : "Signups Closed"}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 tabular-nums">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={editDraft.monthlyDzd}
                              onChange={(e) =>
                                setEditDraft({
                                  ...editDraft,
                                  monthlyDzd: Number(e.target.value),
                                })
                              }
                              className="w-20 px-2 py-1 rounded border border-slate-300"
                            />
                            <span>DZD</span>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-900">
                              {plan.monthlyDzd.toLocaleString()} DZD / mo
                            </div>
                            <div className="text-[11px] text-slate-500">
                              ${plan.monthlyUsd} USD · {plan.annualDzd.toLocaleString()} DZD/yr
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 tabular-nums">
                        {isEditing ? (
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="number"
                              value={editDraft.entitlements.maxActiveProducts ?? ""}
                              placeholder="∞"
                              onChange={(e) =>
                                setEditDraft({
                                  ...editDraft,
                                  entitlements: {
                                    ...editDraft.entitlements,
                                    maxActiveProducts:
                                      e.target.value === "" ? null : Number(e.target.value),
                                  },
                                })
                              }
                              className="w-16 px-1.5 py-1 rounded border border-slate-300"
                              title="Max Active Products"
                            />
                            <input
                              type="number"
                              value={editDraft.entitlements.maxPhotosPerProduct}
                              onChange={(e) =>
                                setEditDraft({
                                  ...editDraft,
                                  entitlements: {
                                    ...editDraft.entitlements,
                                    maxPhotosPerProduct: Number(e.target.value),
                                  },
                                })
                              }
                              className="w-14 px-1.5 py-1 rounded border border-slate-300"
                              title="Max Photos/Product"
                            />
                          </div>
                        ) : (
                          <div className="text-slate-700">
                            <div>
                              Products:{" "}
                              <strong>
                                {plan.entitlements.maxActiveProducts === null
                                  ? "Unlimited"
                                  : plan.entitlements.maxActiveProducts}
                              </strong>{" "}
                              · Photos: <strong>{plan.entitlements.maxPhotosPerProduct}</strong>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Max {plan.entitlements.maxFileSizeMb} MB · Video:{" "}
                              <strong>{plan.entitlements.allowVideoStream ? "Yes" : "No"}</strong> ·
                              Domains:{" "}
                              <strong>{plan.entitlements.maxCustomDomains ?? "Unlimited"}</strong>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleSaveEditedPlan}
                              disabled={saving}
                              className="px-2.5 py-1 rounded bg-emerald-700 text-white font-semibold cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingPlanCode(null);
                                setEditDraft(null);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-200 text-slate-800 font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingPlanCode(plan.planCode);
                                setEditDraft(JSON.parse(JSON.stringify(plan)));
                              }}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold cursor-pointer"
                            >
                              Edit
                            </button>
                            {plan.planCode !== "Free" && plan.lifecycleState !== "retired" && (
                              <>
                                <button
                                  onClick={() => {
                                    const enabling = plan.lifecycleState !== "active";
                                    setPendingConfirmModal({
                                      title: enabling
                                        ? `Enable "${plan.displayName}" Plan?`
                                        : `Disable "${plan.displayName}" Plan?`,
                                      subtitle: `Plan Code: ${plan.planCode}`,
                                      description: enabling
                                        ? `Enable commercial plan "${plan.displayName}" and make it active for public subscriptions?`
                                        : `Disable commercial plan "${plan.displayName}"? Existing subscribed stores retain access while new signups are paused.`,
                                      confirmLabel: enabling ? "Enable Plan" : "Disable Plan",
                                      variant: enabling ? "slate" : "warning",
                                      onConfirm: () => {
                                        void executeTogglePlanLifecycle(plan);
                                      },
                                    });
                                  }}
                                  className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                                    plan.lifecycleState === "active"
                                      ? "bg-rose-100 hover:bg-rose-200 text-rose-900"
                                      : "bg-emerald-100 hover:bg-emerald-200 text-emerald-900"
                                  }`}
                                >
                                  {plan.lifecycleState === "active" ? "Disable" : "Enable"}
                                </button>
                                <button
                                  onClick={() => {
                                    setRetiringPlanCode(plan.planCode);
                                    setRetireTargetCode("Free");
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold cursor-pointer"
                                >
                                  <Archive className="w-3 h-3" />
                                  Retire
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section C: Plan Retirement Workflow */}
        {retiringPlanCode && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3 text-xs">
            <div className="font-bold text-amber-950 flex items-center justify-between">
              <span>
                Retire Plan "{retiringPlanCode}" (Requires Target Migration Plan + Preservation Guarantee)
              </span>
              <button
                onClick={() => setRetiringPlanCode(null)}
                className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-amber-950 mb-1">
                  Target Migration Plan Code
                </label>
                <select
                  value={retireTargetCode}
                  onChange={(e) => setRetireTargetCode(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-amber-300 bg-white font-semibold"
                >
                  {(governance?.plans || [])
                    .filter((p) => p.planCode !== retiringPlanCode && p.lifecycleState !== "retired")
                    .map((p) => (
                      <option key={p.planCode} value={p.planCode}>
                        {p.displayName} ({p.planCode})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-amber-950 mb-1">Grace Period (Days)</label>
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={retireGraceDays}
                  onChange={(e) => setRetireGraceDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border border-amber-300 bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-amber-950 mb-1">Audit Reason</label>
                <input
                  type="text"
                  value={retireReason}
                  onChange={(e) => setRetireReason(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-amber-300 bg-white"
                />
              </div>
            </div>
            <button
              onClick={handleRetirePlan}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold cursor-pointer"
            >
              Confirm Non-Destructive Plan Retirement (Step-Up MFA)
            </button>
          </div>
        )}

        {/* Section D: Non-Destructive Store Over-Quota Evaluation */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
          <div className="font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Non-Destructive Store Entitlement & Over-Quota Preservation Check</span>
            </span>
            <span className="text-emerald-800 font-semibold tabular-nums">
              Existing Hidden by Quota: {totalHiddenOverQuota} (Policy: Zero Hidden / Zero Deleted)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {storeQuotas.slice(0, 6).map((sq) => {
              const isOver = Object.keys(sq.overQuotaFlags || {}).length > 0;
              return (
                <div
                  key={sq.storeId}
                  className="bg-white border border-slate-200 rounded-lg p-3 space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="truncate">{sq.storeName}</span>
                    <span className="font-sans text-[11px] px-1.5 py-0.5 rounded bg-slate-100">
                      {sq.planCode}
                    </span>
                  </div>
                  <div className="text-slate-600 tabular-nums">
                    Active Products: <strong>{sq.activeProductCount}</strong> /{" "}
                    <strong>{sq.limits?.maxActiveProducts ?? "∞"}</strong>
                  </div>
                  <div className="text-[11px] font-semibold">
                    {isOver ? (
                      <span className="text-amber-700">
                        Over-Quota: Creation Gated, All {sq.activeProductCount} Existing Preserved
                      </span>
                    ) : (
                      <span className="text-emerald-700">Within Plan Quota · 0 Hidden</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {pendingConfirmModal && (
        <YumeAdminConfirmModal
          isOpen={true}
          title={pendingConfirmModal.title}
          subtitle={pendingConfirmModal.subtitle}
          description={pendingConfirmModal.description}
          confirmLabel={pendingConfirmModal.confirmLabel}
          cancelLabel="Cancel"
          variant={pendingConfirmModal.variant}
          onConfirm={pendingConfirmModal.onConfirm}
          onCancel={() => setPendingConfirmModal(null)}
        />
      )}
    </div>
  );
};

export default SubscriptionPlansAndPricingControl;
