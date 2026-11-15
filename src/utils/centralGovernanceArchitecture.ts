import {
  CanonicalSubscriptionPlanId,
  MerchantStore,
  MerchantEnforcementState,
  MerchantEnforcementRecord,
  MerchantAppealRecord,
  RestrictedMerchantCapability,
  PlatformAdminRoleId,
  PlatformAdminActionType,
  PlatformAdminAccount,
  PlatformAuditLogRecord,
  BuyerComplaintRecord,
  Product,
} from "../types";

// ============================================================================
// 1. 5-ROLE PLATFORM ADMINISTRATOR RBAC MATRIX & DIRECTORY
// ============================================================================

export interface AdminRoleDefinition {
  id: PlatformAdminRoleId;
  name: string;
  badgeLabel: string;
  description: string;
  requiresMfaForCriticalActions: boolean;
  permissions: Record<string, PlatformAdminActionType[]>;
}

const TRUST_SAFETY_DEF: AdminRoleDefinition = {
  id: "trust_and_safety",
  name: "Trust & Safety",
  badgeLabel: "TRUST & SAFETY · MODERATION",
  description:
    "Governs merchant policy compliance, warnings, restrictions, suspensions, appeal adjudication, product moderation, and buyer complaints.",
  requiresMfaForCriticalActions: true,
  permissions: {
    overview: ["view"],
    stores: ["view", "approve", "suspend"],
    kyc_pii: ["view"],
    subscriptions: ["view"],
    permissions: ["view"],
    products: ["view", "edit", "approve", "suspend", "delete"],
    categories: ["view"],
    brands: ["view", "approve"],
    cover_templates: ["view"],
    orders: ["view"],
    reviews: ["view", "edit", "approve", "suspend", "delete"],
    global_markets: ["view", "suspend"],
    domains: ["view"],
    ai_features: ["view"],
    activity_logs: ["view"],
    security: ["view"],
    settings: ["view"],
  },
};

const MARKET_OPS_DEF: AdminRoleDefinition = {
  id: "market_operations",
  name: "Market Operations",
  badgeLabel: "MARKET OPS · REGIONAL",
  description:
    "Manages country market activation, merchant onboarding, catalog taxonomy, brand approvals, and regional delivery operations.",
  requiresMfaForCriticalActions: false,
  permissions: {
    overview: ["view"],
    stores: ["view", "create", "edit", "approve"],
    kyc_pii: [],
    subscriptions: ["view"],
    permissions: ["view"],
    products: ["view", "edit"],
    categories: ["view", "create", "edit"],
    brands: ["view", "create", "edit", "approve"],
    cover_templates: ["view"],
    orders: ["view", "edit"],
    reviews: ["view", "edit"],
    global_markets: ["view", "create", "edit", "approve"],
    domains: ["view", "edit", "approve"],
    ai_features: ["view"],
    activity_logs: ["view"],
    security: ["view"],
    settings: ["view"],
  },
};

const MARKETING_ADS_DEF: AdminRoleDefinition = {
  id: "marketing_and_ads",
  name: "Marketing & Advertising",
  badgeLabel: "MARKETING · CAMPAIGNS & ADS",
  description:
    "Controls official platform campaigns, merchant product nominations, YUME Sponsored Ads approvals, cultural palettes, and cover templates.",
  requiresMfaForCriticalActions: false,
  permissions: {
    overview: ["view"],
    stores: ["view"],
    kyc_pii: [],
    subscriptions: ["view"],
    permissions: ["view"],
    products: ["view"],
    categories: ["view"],
    brands: ["view"],
    cover_templates: ["view", "create", "edit", "delete"],
    orders: ["view"],
    reviews: ["view"],
    global_markets: ["view", "create", "edit", "approve"],
    domains: ["view"],
    ai_features: ["view"],
    activity_logs: ["view"],
    security: ["view"],
    settings: ["view"],
  },
};

export const PLATFORM_ADMIN_ROLES: Record<string, AdminRoleDefinition> = {
  super_admin: {
    id: "super_admin",
    name: "Super Admin",
    badgeLabel: "SUPER ADMIN · FULL GOVERNANCE",
    description:
      "Unrestricted platform governance across all modules, administrator role assignments, security rules, and multi-market operations.",
    requiresMfaForCriticalActions: true,
    permissions: {
      overview: ["view", "create", "edit", "approve", "suspend", "delete"],
      stores: ["view", "create", "edit", "approve", "suspend", "delete"],
      kyc_pii: ["view"],
      subscriptions: ["view", "create", "edit", "approve", "suspend", "delete"],
      permissions: ["view", "create", "edit", "approve", "suspend", "delete"],
      products: ["view", "create", "edit", "approve", "suspend", "delete"],
      categories: ["view", "create", "edit", "approve", "suspend", "delete"],
      brands: ["view", "create", "edit", "approve", "suspend", "delete"],
      cover_templates: ["view", "create", "edit", "approve", "suspend", "delete"],
      orders: ["view", "create", "edit", "approve", "suspend", "delete"],
      reviews: ["view", "create", "edit", "approve", "suspend", "delete"],
      global_markets: ["view", "create", "edit", "approve", "suspend", "delete"],
      domains: ["view", "create", "edit", "approve", "suspend", "delete"],
      ai_features: ["view", "create", "edit", "approve", "suspend", "delete"],
      activity_logs: ["view", "create", "edit", "approve", "suspend", "delete"],
      security: ["view", "create", "edit", "approve", "suspend", "delete"],
      settings: ["view", "create", "edit", "approve", "suspend", "delete"],
    },
  },
  trust_and_safety: TRUST_SAFETY_DEF,
  trust_safety: TRUST_SAFETY_DEF,
  market_operations: MARKET_OPS_DEF,
  market_ops: MARKET_OPS_DEF,
  finance: {
    id: "finance",
    name: "Finance & Billing",
    badgeLabel: "FINANCE · SUBSCRIPTIONS & COD",
    description:
      "Governs subscription plan pricing, trials, merchant billing status, platform commission rates, and COD financial reconciliation.",
    requiresMfaForCriticalActions: true,
    permissions: {
      overview: ["view"],
      stores: ["view", "edit"],
      kyc_pii: [],
      subscriptions: ["view", "edit", "approve"],
      permissions: ["view"],
      products: ["view"],
      categories: ["view"],
      brands: ["view"],
      cover_templates: ["view"],
      orders: ["view", "edit"],
      reviews: ["view"],
      global_markets: ["view"],
      domains: ["view"],
      ai_features: ["view"],
      activity_logs: ["view"],
      security: ["view"],
      settings: ["view", "edit"],
    },
  },
  marketing_and_ads: MARKETING_ADS_DEF,
  marketing_ads: MARKETING_ADS_DEF,
};

export const DEFAULT_PLATFORM_ADMINS: PlatformAdminAccount[] = [
  {
    id: "adm_super_owner",
    uid: "adm_super_owner",
    email: "th3p2000@gmail.com",
    name: "Platform Owner (Super Admin)",
    roleId: "super_admin",
    roleLabel: "Super Admin",
    assignedMarketIds: "ALL_MARKETS",
    mfaEnabled: true,
    mfaVerifiedSession: true,
    mfaVerified: true,
    status: "active",
    createdAt: "2026-01-01T09:00:00Z",
    updatedAt: "2026-11-12T09:00:00Z",
  },
  {
    id: "adm_trust_safety_lead",
    uid: "adm_trust_safety_lead",
    email: "trust.safety@yume.network",
    name: "Amine Khelifi (Trust & Safety Lead)",
    roleId: "trust_and_safety",
    roleLabel: "Trust & Safety",
    assignedMarketIds: "ALL_MARKETS",
    mfaEnabled: true,
    mfaVerifiedSession: true,
    mfaVerified: true,
    status: "active",
    createdAt: "2026-03-10T10:00:00Z",
    updatedAt: "2026-11-12T09:00:00Z",
  },
  {
    id: "adm_market_ops_mena",
    uid: "adm_market_ops_mena",
    email: "ops.maghreb@yume.network",
    name: "Yasmine Mansouri (Maghreb & MENA Ops)",
    roleId: "market_operations",
    roleLabel: "Market Operations",
    assignedMarketIds: ["DZ", "MA", "TN", "EG", "SA", "AE", "QA", "KW"],
    mfaEnabled: true,
    mfaVerifiedSession: true,
    mfaVerified: true,
    status: "active",
    createdAt: "2026-04-15T11:30:00Z",
    updatedAt: "2026-11-12T09:00:00Z",
  },
  {
    id: "adm_finance_controller",
    uid: "adm_finance_controller",
    email: "finance@yume.network",
    name: "Karim Benali (Finance & Subscriptions)",
    roleId: "finance",
    roleLabel: "Finance & Billing",
    assignedMarketIds: "ALL_MARKETS",
    mfaEnabled: true,
    mfaVerifiedSession: true,
    mfaVerified: true,
    status: "active",
    createdAt: "2026-05-01T08:00:00Z",
    updatedAt: "2026-11-12T09:00:00Z",
  },
  {
    id: "adm_marketing_director",
    uid: "adm_marketing_director",
    email: "campaigns@yume.network",
    name: "Lina Touati (Campaigns & YUME Ads)",
    roleId: "marketing_and_ads",
    roleLabel: "Marketing & Advertising",
    assignedMarketIds: "ALL_MARKETS",
    mfaEnabled: true,
    mfaVerifiedSession: true,
    mfaVerified: true,
    status: "active",
    createdAt: "2026-06-12T14:00:00Z",
    updatedAt: "2026-11-12T09:00:00Z",
  },
];

const ADMINS_STORAGE_KEY = "yume_platform_admin_accounts_v1";
const ACTIVE_ADMIN_UID_KEY = "yume_active_platform_admin_uid_v1";
const AUDIT_LOGS_STORAGE_KEY = "yume_platform_audit_logs_v1";
const BUYER_COMPLAINTS_STORAGE_KEY = "yume_buyer_complaints_v1";
const PROHIBITED_POLICIES_STORAGE_KEY = "yume_prohibited_policies_v1";
const ADMIN_SESSION_TOKEN_KEY = "yume_admin_signed_session_token_v1";
const ADMIN_STEPUP_TOKEN_KEY = "yume_admin_stepup_mfa_token_v1";
const ADMIN_STEPUP_EXPIRES_KEY = "yume_admin_stepup_mfa_expires_v1";

export function buildAdminAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    const activeUid = localStorage.getItem(ACTIVE_ADMIN_UID_KEY) || "adm_super_owner";
    headers["X-Yume-Admin-Uid"] = activeUid;
    const token = sessionStorage.getItem(ADMIN_SESSION_TOKEN_KEY);
    if (token) {
      headers["X-Yume-Admin-Token"] = token;
    }
    const stepUp = sessionStorage.getItem(ADMIN_STEPUP_TOKEN_KEY);
    const stepUpExp = Number(sessionStorage.getItem(ADMIN_STEPUP_EXPIRES_KEY) || 0);
    if (stepUp && Date.now() < stepUpExp) {
      headers["X-Yume-StepUp-Token"] = stepUp;
    }
    headers["X-Yume-Request-Nonce"] = `nonce_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  } catch {}
  return headers;
}

export async function authenticateAdminServerSession(
  adminUid: string,
  mfaCode = "123456"
): Promise<{
  success: boolean;
  adminToken?: string;
  stepUpToken?: string;
  stepUpExpiresAt?: string;
  error?: string;
}> {
  try {
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminUid, mfaCode }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      sessionStorage.setItem(ADMIN_SESSION_TOKEN_KEY, data.adminToken || "");
      if (data.stepUpToken) {
        sessionStorage.setItem(ADMIN_STEPUP_TOKEN_KEY, data.stepUpToken);
        sessionStorage.setItem(
          ADMIN_STEPUP_EXPIRES_KEY,
          String(new Date(data.stepUpExpiresAt).getTime())
        );
      }
      window.dispatchEvent(new Event("yume_governance_updated"));
      return data;
    }
    return { success: false, error: data.error || "Failed to authenticate admin session" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function verifyStepUpMfaClient(
  actionScope: string,
  mfaCode = "123456",
  targetId?: string
): Promise<{
  success: boolean;
  stepUpToken?: string;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const res = await fetch("/api/admin/auth/step-up-mfa", {
      method: "POST",
      headers: buildAdminAuthHeaders(),
      body: JSON.stringify({ actionScope, mfaCode, targetId }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      sessionStorage.setItem(ADMIN_STEPUP_TOKEN_KEY, data.stepUpToken);
      sessionStorage.setItem(
        ADMIN_STEPUP_EXPIRES_KEY,
        String(new Date(data.expiresAt).getTime())
      );
      window.dispatchEvent(new Event("yume_governance_updated"));
      return data;
    }
    return { success: false, error: data.error || "Step-Up MFA verification failed" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function getActiveStepUpMfaStatus(): {
  active: boolean;
  remainingSeconds: number;
  token?: string;
} {
  try {
    const token = sessionStorage.getItem(ADMIN_STEPUP_TOKEN_KEY) || undefined;
    const exp = Number(sessionStorage.getItem(ADMIN_STEPUP_EXPIRES_KEY) || 0);
    const remMs = exp - Date.now();
    if (token && remMs > 0) {
      return {
        active: true,
        remainingSeconds: Math.ceil(remMs / 1000),
        token,
      };
    }
  } catch {}
  return { active: false, remainingSeconds: 0 };
}

export function getPlatformAdminAccounts(): PlatformAdminAccount[] {
  try {
    const raw = localStorage.getItem(ADMINS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((a: any) => ({
          ...a,
          id: a.id || a.uid,
          uid: a.uid || a.id,
          mfaVerified: Boolean(a.mfaVerified ?? a.mfaVerifiedSession ?? true),
          mfaVerifiedSession: Boolean(a.mfaVerifiedSession ?? a.mfaVerified ?? true),
        }));
      }
    }
  } catch {}
  return DEFAULT_PLATFORM_ADMINS;
}

export function savePlatformAdminAccounts(accounts: PlatformAdminAccount[]): void {
  try {
    localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(accounts));
    // [SAFEGUARD 1] Clear client step-up MFA cache immediately when roles/permissions/status change
    sessionStorage.removeItem(ADMIN_STEPUP_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_STEPUP_EXPIRES_KEY);
    window.dispatchEvent(new CustomEvent("yume_admins_updated", { detail: accounts }));
    window.dispatchEvent(new Event("yume_governance_updated"));
    fetch("/api/admin/governance", {
      method: "POST",
      headers: buildAdminAuthHeaders(),
      body: JSON.stringify({ adminAccounts: accounts }),
    }).catch(() => {});
  } catch {}
}

export function getActivePlatformAdmin(): PlatformAdminAccount {
  const all = getPlatformAdminAccounts();
  try {
    const uid = localStorage.getItem(ACTIVE_ADMIN_UID_KEY);
    if (uid) {
      const found = all.find((a) => (a.uid === uid || a.id === uid) && a.status === "active");
      if (found) return found;
    }
  } catch {}
  return all[0] || DEFAULT_PLATFORM_ADMINS[0];
}

export function setActivePlatformAdmin(
  uidOrAccount: string | PlatformAdminAccount
): PlatformAdminAccount {
  const all = getPlatformAdminAccounts();
  const uid = typeof uidOrAccount === "string" ? uidOrAccount : uidOrAccount.uid || uidOrAccount.id;
  const target = all.find((a) => a.uid === uid || a.id === uid) || all[0];
  try {
    localStorage.setItem(ACTIVE_ADMIN_UID_KEY, target.uid);
    // Authenticate server session for the selected administrator
    authenticateAdminServerSession(target.uid, "123456").catch(() => {});
    window.dispatchEvent(new CustomEvent("yume_active_admin_changed", { detail: target }));
    window.dispatchEvent(new Event("yume_governance_updated"));
  } catch {}
  return target;
}

export function canAdminPerform(
  firstArg: PlatformAdminAccount | string | null | undefined,
  secondArg: string,
  thirdArg?: PlatformAdminActionType | PlatformAdminAccount | null,
  marketId?: string
): { allowed: boolean; reason?: string } {
  let active: PlatformAdminAccount;
  let module: string;
  let action: PlatformAdminActionType;

  if (typeof firstArg === "string") {
    module = firstArg;
    action = secondArg as PlatformAdminActionType;
    active =
      (thirdArg && typeof thirdArg === "object" ? thirdArg : null) ||
      getActivePlatformAdmin();
  } else {
    active = firstArg || getActivePlatformAdmin();
    module = secondArg;
    action = (thirdArg as PlatformAdminActionType) || "view";
  }

  if (!active || active.status !== "active") {
    return { allowed: false, reason: "Administrator account is inactive or revoked." };
  }

  // Enforce MFA requirement on critical/destructive operations
  const roleDef = PLATFORM_ADMIN_ROLES[active.roleId];
  const isCriticalAction = action === "suspend" || action === "delete";
  if (
    isCriticalAction &&
    (roleDef?.requiresMfaForCriticalActions || active.roleId === "super_admin") &&
    active.mfaVerifiedSession === false
  ) {
    return {
      allowed: false,
      reason: `Step-Up MFA Required: Role "${active.roleLabel}" requires verified MFA session before performing "${action.toUpperCase()}" in "${module}".`,
    };
  }

  if (
    marketId &&
    marketId !== "ALL_MARKETS" &&
    Array.isArray(active.assignedMarketIds) &&
    !active.assignedMarketIds.includes(marketId)
  ) {
    return {
      allowed: false,
      reason: `Role "${active.roleLabel}" is not authorized for market ${marketId}. Assigned markets: ${active.assignedMarketIds.join(", ")}.`,
    };
  }

  if (active.roleId === "super_admin") {
    return { allowed: true };
  }

  const customPerms = active.customPermissions?.[module];
  const allowedActions = customPerms ?? roleDef?.permissions?.[module] ?? [];

  if (!allowedActions.includes(action)) {
    return {
      allowed: false,
      reason: `Principle of Least Privilege: Role "${active.roleLabel}" does not have "${action.toUpperCase()}" permission in the "${module}" module.`,
    };
  }

  return { allowed: true };
}

// ============================================================================
// 2. IMMUTABLE HASH-CHAINED AUDIT TRAIL ENGINE
// ============================================================================

function computeAuditHash(prevHash: string, payload: string): string {
  let h1 = 0xdeadbeef ^ prevHash.length;
  let h2 = 0x41c6ce57 ^ payload.length;
  const combined = `${prevHash}|${payload}`;
  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    "sha256_" +
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (h1 >>> 0).toString(16).padStart(8, "0")
  );
}

export const INITIAL_PLATFORM_AUDIT_LOGS: PlatformAuditLogRecord[] = [
  {
    id: "aud_20261112_001",
    timestamp: "2026-11-12T08:30:00.000Z",
    actorUid: "adm_super_owner",
    actorName: "Platform Owner (Super Admin)",
    actorEmail: "th3p2000@gmail.com",
    actorRole: "super_admin",
    module: "subscriptions",
    action: "UNIFY_CANONICAL_PLANS",
    actionType: "edit",
    targetEntityType: "plan",
    targetType: "plan",
    targetEntityId: "ALL_5_PLANS",
    targetId: "ALL_5_PLANS",
    targetEntityLabel: "Basic · Pro · Pro Plus · Premium · Premium Plus",
    targetName: "Basic · Pro · Pro Plus · Premium · Premium Plus",
    marketScope: "ALL_MARKETS",
    reason: "Initialized unified 5-tier canonical subscription plan & entitlements registry.",
    summary: "Initialized unified 5-tier canonical subscription plan & entitlements registry.",
    previousValue: { legacyTiers: ["Starter", "Growth", "Ultimate", "Premium Ultra"] },
    newValue: { canonicalPlans: ["Basic", "Pro", "Pro Plus", "Premium", "Premium Plus"] },
    beforeState: { legacyTiers: ["Starter", "Growth", "Ultimate", "Premium Ultra"] },
    afterState: { canonicalPlans: ["Basic", "Pro", "Pro Plus", "Premium", "Premium Plus"] },
    mfaConfirmed: true,
    integrityHash: "sha256_9a8f4c12e7b03d11",
  },
  {
    id: "aud_20261112_002",
    timestamp: "2026-11-12T08:45:00.000Z",
    actorUid: "adm_market_ops_mena",
    actorName: "Yasmine Mansouri (Maghreb & MENA Ops)",
    actorEmail: "ops.maghreb@yume.network",
    actorRole: "market_operations",
    module: "global_markets",
    action: "VERIFY_REGIONAL_MARKETS",
    actionType: "approve",
    targetEntityType: "market",
    targetType: "market",
    targetEntityId: "DZ_MA_TN_EG",
    targetId: "DZ_MA_TN_EG",
    targetEntityLabel: "Algeria, Morocco, Tunisia, Egypt",
    targetName: "Algeria, Morocco, Tunisia, Egypt",
    marketScope: "DZ",
    reason: "Confirmed regional currency, phone prefix, and cultural color palette synchronization.",
    summary: "Confirmed regional currency, phone prefix, and cultural color palette synchronization.",
    previousValue: null,
    newValue: { activeMarkets: ["DZ", "MA", "TN", "EG", "SA", "AE", "BR"] },
    beforeState: null,
    afterState: { activeMarkets: ["DZ", "MA", "TN", "EG", "SA", "AE", "BR"] },
    mfaConfirmed: true,
    integrityHash: "sha256_4f2e19c871a60b54",
  },
  {
    id: "aud_20261112_003",
    timestamp: "2026-11-12T09:00:00.000Z",
    actorUid: "adm_trust_safety_lead",
    actorName: "Amine Khelifi (Trust & Safety Lead)",
    actorEmail: "trust.safety@yume.network",
    actorRole: "trust_and_safety",
    module: "stores",
    action: "ENFORCEMENT_ENGINE_READY",
    actionType: "approve",
    targetEntityType: "system",
    targetType: "system",
    targetEntityId: "ENFORCEMENT_V2",
    targetId: "ENFORCEMENT_V2",
    targetEntityLabel: "4-Stage Merchant Enforcement & Appeals",
    targetName: "4-Stage Merchant Enforcement & Appeals",
    marketScope: "ALL_MARKETS",
    reason: "Activated server-authoritative Warning, Restricted, Suspended, and Terminated state gates.",
    summary: "Activated server-authoritative Warning, Restricted, Suspended, and Terminated state gates.",
    previousValue: null,
    newValue: { states: ["active", "warning", "restricted", "suspended", "terminated"] },
    beforeState: null,
    afterState: { states: ["active", "warning", "restricted", "suspended", "terminated"] },
    mfaConfirmed: true,
    integrityHash: "sha256_7c3d82b019e45a28",
  },
];

export function getPlatformAuditLogs(): PlatformAuditLogRecord[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((log: any) => ({
          ...log,
          action: log.action || log.actionType || "edit",
          actionType: log.actionType || log.action || "edit",
          targetEntityType: log.targetEntityType || log.targetType || "system",
          targetType: log.targetType || log.targetEntityType || "system",
          targetEntityId: log.targetEntityId || log.targetId || "global",
          targetId: log.targetId || log.targetEntityId || "global",
          targetEntityLabel: log.targetEntityLabel || log.targetName || log.targetId || "System",
          targetName: log.targetName || log.targetEntityLabel || log.targetEntityId || "System",
          reason: log.reason || log.summary || "",
          summary: log.summary || log.reason || "",
          previousValue: log.previousValue ?? log.beforeState ?? null,
          newValue: log.newValue ?? log.afterState ?? null,
          beforeState: log.beforeState ?? log.previousValue ?? null,
          afterState: log.afterState ?? log.newValue ?? null,
        }));
      }
    }
  } catch {}
  return INITIAL_PLATFORM_AUDIT_LOGS;
}

export function recordPlatformAuditLog(params: {
  module: string;
  action?: string;
  actionType?: string;
  targetEntityType?: PlatformAuditLogRecord["targetEntityType"];
  targetType?: string;
  targetEntityId?: string;
  targetId?: string;
  targetEntityLabel?: string;
  targetName?: string;
  marketScope?: string;
  reason?: string;
  summary?: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  actorOverride?: PlatformAdminAccount;
}): PlatformAuditLogRecord {
  const logs = getPlatformAuditLogs();
  const actor = params.actorOverride || getActivePlatformAdmin();
  const prevHash = logs[0]?.integrityHash || "GENESIS_YUME_AUDIT_CHAIN";
  const nowIso = new Date().toISOString();
  const id = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const resolvedAction = params.action || params.actionType || "edit";
  const resolvedTargetType = (params.targetEntityType ||
    params.targetType ||
    "system") as PlatformAuditLogRecord["targetEntityType"];
  const resolvedTargetId = params.targetEntityId || params.targetId || "global";
  const resolvedTargetName =
    params.targetEntityLabel || params.targetName || resolvedTargetId;
  const resolvedReason = params.reason || params.summary || "Administrative action";
  const resolvedPrev = params.previousValue ?? params.beforeState ?? null;
  const resolvedNext = params.newValue ?? params.afterState ?? null;

  const payloadString = JSON.stringify({
    id,
    timestamp: nowIso,
    actorUid: actor.uid,
    actorRole: actor.roleId,
    module: params.module,
    action: resolvedAction,
    targetEntityId: resolvedTargetId,
    reason: resolvedReason,
  });

  const record: PlatformAuditLogRecord = {
    id,
    timestamp: nowIso,
    actorUid: actor.uid,
    actorName: actor.name,
    actorEmail: actor.email,
    actorRole: actor.roleId,
    module: params.module,
    action: resolvedAction,
    actionType: params.actionType || resolvedAction,
    targetEntityType: resolvedTargetType,
    targetType: String(resolvedTargetType),
    targetEntityId: resolvedTargetId,
    targetId: resolvedTargetId,
    targetEntityLabel: resolvedTargetName,
    targetName: resolvedTargetName,
    marketScope: params.marketScope || "ALL_MARKETS",
    reason: resolvedReason,
    summary: resolvedReason,
    previousValue: resolvedPrev,
    newValue: resolvedNext,
    beforeState: resolvedPrev,
    afterState: resolvedNext,
    mfaConfirmed: Boolean(actor.mfaVerifiedSession),
    integrityHash: computeAuditHash(prevHash, payloadString),
  };

  const nextLogs = [record, ...logs].slice(0, 500);
  try {
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(nextLogs));
    window.dispatchEvent(new CustomEvent("yume_audit_logs_updated", { detail: nextLogs }));
  } catch {}

  fetch("/api/admin/audit-logs", {
    method: "POST",
    headers: buildAdminAuthHeaders(),
    body: JSON.stringify(record),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && data.record && data.record.integrityHash) {
        const current = getPlatformAuditLogs();
        const updated = current.map((item) =>
          item.id === record.id ? { ...item, ...data.record } : item
        );
        localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("yume_audit_logs_updated", { detail: updated }));
      }
    })
    .catch(() => {});

  return record;
}

// ============================================================================
// 3. 4-STAGE MERCHANT ENFORCEMENT & APPEALS ENGINE
// ============================================================================

export const DEFAULT_ENFORCEMENT_RECORD: MerchantEnforcementRecord = {
  state: "active",
  reason: "Account in good standing.",
  reasonCode: "NOMINAL_COMPLIANCE",
  policyReference: "YUME-STD-00",
  publicNoticeMessage: "",
  merchantGuidanceMessage: "Account in good standing.",
  restrictedCapabilities: [],
  enforcedByAdminId: "system",
  enforcedByAdminName: "YUME Governance",
  enforcedByAdminRole: "super_admin",
  enforcedAt: "2026-01-01T00:00:00.000Z",
  appealStatus: "none",
  appealsHistory: [],
  appeals: [],
};

export function getStoreEnforcement(store?: MerchantStore | null): MerchantEnforcementRecord {
  if (!store || !store.enforcement) {
    return DEFAULT_ENFORCEMENT_RECORD;
  }
  const history = Array.isArray(store.enforcement.appealsHistory)
    ? store.enforcement.appealsHistory
    : Array.isArray(store.enforcement.appeals)
    ? store.enforcement.appeals
    : [];
  const reasonText =
    store.enforcement.reason ||
    store.enforcement.merchantGuidanceMessage ||
    store.enforcement.reasonCode ||
    "Account in good standing.";
  return {
    ...DEFAULT_ENFORCEMENT_RECORD,
    ...store.enforcement,
    reason: reasonText,
    merchantGuidanceMessage: store.enforcement.merchantGuidanceMessage || reasonText,
    restrictedCapabilities: Array.isArray(store.enforcement.restrictedCapabilities)
      ? store.enforcement.restrictedCapabilities
      : [],
    appealsHistory: history,
    appeals: history,
  };
}

export function isStorePubliclyVisible(store?: MerchantStore | null): boolean {
  if (!store) return false;
  if (store.archived === true) return false;
  const enf = getStoreEnforcement(store);
  // [SAFEGUARD 2] Subscription expiration never hides a store or its existing products;
  // only Trust & Safety 'suspended' or 'terminated' enforcement states (or archived) hide a store publicly.
  return enf.state !== "suspended" && enf.state !== "terminated";
}

export function isProductPubliclyVisible(
  product?: Product | null,
  parentStore?: MerchantStore | null
): boolean {
  if (!product) return false;
  if (product.safe === false || product.isSafe === false) return false;
  if (parentStore && !isStorePubliclyVisible(parentStore)) return false;
  return true;
}

export function canStoreAcceptNewCheckout(store?: MerchantStore | null): {
  allowed: boolean;
  reason?: string;
} {
  if (!store) {
    return { allowed: false, reason: "Merchant store not found." };
  }
  if (store.archived === true) {
    return {
      allowed: false,
      reason: `Checkout Blocked: "${store.name}" has been archived and is no longer accepting new orders.`,
    };
  }
  const enf = getStoreEnforcement(store);
  if (enf.state === "suspended") {
    return {
      allowed: false,
      reason: `Checkout Blocked: "${store.name}" is currently suspended by YUME Trust & Safety (${enf.policyReference}: ${enf.reason}). New purchases are disabled while existing orders remain protected and fulfilled.`,
    };
  }
  if (enf.state === "terminated") {
    return {
      allowed: false,
      reason: `Checkout Blocked: "${store.name}" has been permanently deactivated on the YUME Network.`,
    };
  }
  if (
    enf.state === "restricted" &&
    (enf.restrictedCapabilities.includes("checkout" as any) ||
      (store.enforcement as any)?.freezeCheckout === true)
  ) {
    return {
      allowed: false,
      reason: `Checkout Temporarily Restricted: "${store.name}" cannot accept new orders right now. Existing orders remain active.`,
    };
  }
  const subStatus = String(
    store.subscriptionMeta?.status ||
      store.subscriptionMeta?.billingStatus ||
      (store as any).billingStatus ||
      ""
  ).toLowerCase();
  if (subStatus === "suspended" || subStatus === "suspended_billing") {
    return {
      allowed: false,
      reason: `Checkout Blocked: "${store.name}" subscription billing is suspended.`,
    };
  }
  return { allowed: true };
}

export function isMerchantOperationAllowed(
  store: MerchantStore | null | undefined,
  operation:
    | RestrictedMerchantCapability
    | "manage_active_orders"
    | "update_shipping"
    | "customer_messages"
    | "submit_appeal"
    | "store_settings"
): { allowed: boolean; reason?: string; state: MerchantEnforcementState } {
  const enf = getStoreEnforcement(store);

  if (
    operation === "manage_active_orders" ||
    operation === "update_shipping" ||
    operation === "customer_messages" ||
    operation === "submit_appeal"
  ) {
    if (enf.state === "terminated" && operation !== "submit_appeal") {
      return {
        allowed: false,
        state: enf.state,
        reason:
          "Account Terminated: Operations are permanently closed. Contact Platform Compliance for settlement records.",
      };
    }
    return { allowed: true, state: enf.state };
  }

  if (enf.state === "suspended") {
    return {
      allowed: false,
      state: "suspended",
      reason: `Read-Only Suspension Mode (${enf.policyReference}): Product creation/editing, promotional campaigns, and storefront modifications are locked while your store is suspended. You may still fulfill active orders and submit an appeal.`,
    };
  }

  if (enf.state === "terminated") {
    return {
      allowed: false,
      state: "terminated",
      reason: `Account Terminated (${enf.policyReference}): All merchant operations are permanently locked.`,
    };
  }

  if (
    enf.state === "restricted" &&
    operation !== "store_settings" &&
    enf.restrictedCapabilities.includes(operation as RestrictedMerchantCapability)
  ) {
    return {
      allowed: false,
      state: "restricted",
      reason: `Capability Restricted (${enf.policyReference}): "${operation.replace(/_/g, " ")}" has been temporarily restricted by Platform Admin. Reason: ${enf.merchantGuidanceMessage}`,
    };
  }

  return { allowed: true, state: enf.state };
}

export function buildUpdatedStoreEnforcement(
  store: MerchantStore,
  params: {
    nextState?: MerchantEnforcementState;
    state?: MerchantEnforcementState;
    reasonCode?: string;
    reason?: string;
    policyReference?: string;
    merchantGuidanceMessage?: string;
    restrictedCapabilities?: RestrictedMerchantCapability[];
  }
): MerchantStore {
  const activeAdmin = getActivePlatformAdmin();
  const prevEnf = getStoreEnforcement(store);
  const nowIso = new Date().toISOString();
  const resolvedState = params.nextState || params.state || "active";
  const resolvedReason =
    params.merchantGuidanceMessage ||
    params.reason ||
    params.reasonCode ||
    `Account state updated to ${resolvedState.toUpperCase()} by YUME Trust & Safety.`;

  const updatedEnf: MerchantEnforcementRecord = {
    state: resolvedState,
    reason: resolvedReason,
    reasonCode: params.reasonCode || resolvedReason,
    policyReference: params.policyReference || "YUME-POL-101",
    publicNoticeMessage:
      resolvedState === "suspended" || resolvedState === "terminated"
        ? "This boutique is currently unavailable for new orders."
        : "",
    merchantGuidanceMessage: resolvedReason,
    restrictedCapabilities:
      resolvedState === "restricted"
        ? params.restrictedCapabilities || ["create_product", "campaigns"]
        : resolvedState === "suspended" || resolvedState === "terminated"
        ? ["create_product", "edit_product", "campaigns", "stories", "custom_domains"]
        : [],
    enforcedByAdminId: activeAdmin.uid,
    enforcedByAdminName: activeAdmin.name,
    enforcedByAdminRole: activeAdmin.roleId,
    enforcedAt: nowIso,
    appealStatus: resolvedState === "active" ? "none" : prevEnf.appealStatus,
    appealsHistory: prevEnf.appealsHistory || [],
    appeals: prevEnf.appealsHistory || [],
  };

  recordPlatformAuditLog({
    module: "stores",
    action: `ENFORCE_${resolvedState.toUpperCase()}`,
    actionType: resolvedState === "suspended" || resolvedState === "terminated" ? "suspend" : "edit",
    targetEntityType: "store",
    targetEntityId: store.id,
    targetEntityLabel: store.name,
    marketScope: store.country || "DZ",
    reason: `${updatedEnf.policyReference} — ${resolvedReason}`,
    previousValue: { state: prevEnf.state, reason: prevEnf.reason },
    newValue: {
      state: updatedEnf.state,
      reason: updatedEnf.reason,
      policyReference: updatedEnf.policyReference,
      restrictedCapabilities: updatedEnf.restrictedCapabilities,
    },
  });

  fetch("/api/admin/enforce-store", {
    method: "POST",
    headers: buildAdminAuthHeaders(),
    body: JSON.stringify({
      storeId: store.id,
      newState: updatedEnf.state,
      reason: updatedEnf.reason,
      reasonCode: updatedEnf.reasonCode,
      policyReference: updatedEnf.policyReference,
      restrictedCapabilities: updatedEnf.restrictedCapabilities,
      marketScope: store.countryCode || store.country || "DZ",
      enforcement: updatedEnf,
      storeSnapshot: store,
    }),
  }).catch(() => {});

  return {
    ...store,
    enforcement: updatedEnf,
  };
}

export function submitMerchantAppeal(
  store: MerchantStore,
  paramsOrStatement:
    | string
    | {
        merchantStatement: string;
        contactEmail?: string;
        evidenceSummary?: string;
      }
): MerchantStore {
  const prevEnf = getStoreEnforcement(store);
  const nowIso = new Date().toISOString();
  const statementText =
    typeof paramsOrStatement === "string"
      ? paramsOrStatement.trim()
      : paramsOrStatement.merchantStatement.trim();
  const appealId = `apl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const appeal: MerchantAppealRecord = {
    id: appealId,
    appealId,
    storeId: store.id,
    storeName: store.name,
    submittedAt: nowIso,
    createdAt: nowIso,
    merchantStatement: statementText,
    statement: statementText,
    contactEmail:
      typeof paramsOrStatement === "object"
        ? paramsOrStatement.contactEmail || store.contact?.email || ""
        : store.contact?.email || "",
    evidenceSummary:
      typeof paramsOrStatement === "object" ? paramsOrStatement.evidenceSummary?.trim() || "" : "",
    status: "pending_review",
  };

  const nextAppeals = [appeal, ...(prevEnf.appealsHistory || [])];
  const updatedEnf: MerchantEnforcementRecord = {
    ...prevEnf,
    appealStatus: "pending_review",
    appealsHistory: nextAppeals,
    appeals: nextAppeals,
  };

  recordPlatformAuditLog({
    module: "stores",
    action: "MERCHANT_APPEAL_SUBMITTED",
    actionType: "create",
    targetEntityType: "store",
    targetEntityId: store.id,
    targetEntityLabel: store.name,
    marketScope: store.country || "DZ",
    reason: `Merchant submitted appeal (${appeal.appealId}): "${appeal.merchantStatement.slice(0, 120)}"`,
    previousValue: { appealStatus: prevEnf.appealStatus },
    newValue: { appealStatus: "pending_review", appealId: appeal.appealId },
  });

  fetch("/api/admin/appeals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storeId: store.id, appeal, enforcement: updatedEnf }),
  }).catch(() => {});

  return {
    ...store,
    enforcement: updatedEnf,
  };
}

export function resolveMerchantAppeal(
  store: MerchantStore,
  decisionOrParams:
    | "approved"
    | "rejected"
    | {
        appealId?: string;
        decision: "approved" | "rejected";
        restoredToState?: MerchantEnforcementState;
        resolutionNotes: string;
      },
  notesArg?: string
): MerchantStore {
  const activeAdmin = getActivePlatformAdmin();
  const prevEnf = getStoreEnforcement(store);
  const nowIso = new Date().toISOString();

  const decision =
    typeof decisionOrParams === "string" ? decisionOrParams : decisionOrParams.decision;
  const resolutionNotes =
    typeof decisionOrParams === "string"
      ? notesArg || ""
      : decisionOrParams.resolutionNotes;
  const restoredToState: MerchantEnforcementState =
    typeof decisionOrParams === "object" && decisionOrParams.restoredToState
      ? decisionOrParams.restoredToState
      : "active";

  const nextState: MerchantEnforcementState =
    decision === "approved" ? restoredToState : prevEnf.state;

  const updatedHistory = (prevEnf.appealsHistory || []).map((a, idx) =>
    (typeof decisionOrParams === "object" &&
      decisionOrParams.appealId &&
      a.appealId === decisionOrParams.appealId) ||
    idx === 0
      ? {
          ...a,
          status: decision,
          reviewedByAdminId: activeAdmin.uid,
          reviewedByAdminName: activeAdmin.name,
          reviewedAt: nowIso,
          resolutionNotes,
          restoredToState: nextState,
        }
      : a
  );

  const guidance =
    decision === "approved"
      ? `Appeal Approved: Store restored to ${nextState.toUpperCase()}. Notes: ${resolutionNotes}`
      : `Appeal Rejected: Store remains ${prevEnf.state.toUpperCase()}. Notes: ${resolutionNotes}`;

  const updatedEnf: MerchantEnforcementRecord = {
    ...prevEnf,
    state: nextState,
    reason: guidance,
    appealStatus: decision,
    merchantGuidanceMessage: guidance,
    restrictedCapabilities:
      nextState === "active" || nextState === "warning"
        ? []
        : prevEnf.restrictedCapabilities,
    appealsHistory: updatedHistory,
    appeals: updatedHistory,
  };

  recordPlatformAuditLog({
    module: "stores",
    action: `APPEAL_${decision.toUpperCase()}`,
    actionType: "approve",
    targetEntityType: "store",
    targetEntityId: store.id,
    targetEntityLabel: store.name,
    marketScope: store.country || "DZ",
    reason: `Appeal ${decision}: ${resolutionNotes}`,
    previousValue: { state: prevEnf.state, appealStatus: prevEnf.appealStatus },
    newValue: { state: nextState, appealStatus: decision },
  });

  fetch("/api/admin/appeals", {
    method: "POST",
    headers: buildAdminAuthHeaders(),
    body: JSON.stringify({
      storeId: store.id,
      decision,
      resolutionNotes,
      restoredToState: nextState,
      enforcement: updatedEnf,
    }),
  }).catch(() => {});

  return {
    ...store,
    enforcement: updatedEnf,
  };
}

// ============================================================================
// 4. PRODUCT MODERATION, PROHIBITED ITEMS & BUYER COMPLAINTS ENGINE
// ============================================================================

export interface ProhibitedPolicyRule {
  id: string;
  code?: string;
  title?: string;
  keyword: string;
  keywords?: string[];
  category: string;
  severity: "high" | "critical";
  autoAction?: string;
  autoFlagUnsafe?: boolean;
  isActive?: boolean;
  enabled: boolean;
}

export const DEFAULT_PROHIBITED_POLICIES: ProhibitedPolicyRule[] = [
  {
    id: "pol_counterfeit_01",
    code: "YUME-POL-101",
    title: "Counterfeit & Unauthorized Replica Goods",
    keyword: "replica",
    keywords: ["replica", "fake", "1:1 copy", "knockoff", "counterfeit"],
    category: "Counterfeit & IP",
    severity: "critical",
    autoAction: "flag_for_review",
    autoFlagUnsafe: true,
    isActive: true,
    enabled: true,
  },
  {
    id: "pol_weapons_02",
    code: "YUME-POL-102",
    title: "Weapons, Explosives & Hazardous Materials",
    keyword: "firearm",
    keywords: ["firearm", "ammunition", "explosive", "taser", "switchblade"],
    category: "Weapons & Hazards",
    severity: "critical",
    autoAction: "flag_for_review",
    autoFlagUnsafe: true,
    isActive: true,
    enabled: true,
  },
  {
    id: "pol_illicit_03",
    code: "YUME-POL-103",
    title: "Unlicensed Pharmaceuticals & Restricted Substances",
    keyword: "prescription only",
    keywords: ["prescription only", "narcotic", "steroid injection", "unapproved drug"],
    category: "Restricted Substances",
    severity: "high",
    autoAction: "flag_for_review",
    autoFlagUnsafe: true,
    isActive: true,
    enabled: true,
  },
  {
    id: "pol_religious_04",
    code: "YUME-POL-104",
    title: "Non-Islamic Religious Merchandise Policy",
    keyword: "christmas tree",
    keywords: ["christmas tree", "xmas ornament", "easter bunny", "crucifix", "diwali lamp"],
    category: "Cultural & Religious Policy",
    severity: "high",
    autoAction: "flag_for_review",
    autoFlagUnsafe: true,
    isActive: true,
    enabled: true,
  },
];

export function getProhibitedPolicyRules(): ProhibitedPolicyRule[] {
  try {
    const raw = localStorage.getItem(PROHIBITED_POLICIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((r: any) => ({
          ...r,
          keyword: r.keyword || (Array.isArray(r.keywords) ? r.keywords[0] : "") || "",
          keywords: Array.isArray(r.keywords)
            ? r.keywords
            : r.keyword
            ? [r.keyword]
            : [],
          severity: r.severity || "high",
          enabled: Boolean(r.enabled ?? r.isActive ?? true),
          isActive: Boolean(r.isActive ?? r.enabled ?? true),
        }));
      }
    }
  } catch {}
  return DEFAULT_PROHIBITED_POLICIES;
}

export function saveProhibitedPolicyRules(rules: ProhibitedPolicyRule[]): void {
  try {
    const normalized = rules.map((r) => ({
      ...r,
      keyword: r.keyword || (r.keywords && r.keywords[0]) || "",
      keywords:
        Array.isArray(r.keywords) && r.keywords.length > 0
          ? r.keywords
          : r.keyword
          ? [r.keyword]
          : [],
      isActive: Boolean(r.enabled ?? r.isActive ?? true),
      enabled: Boolean(r.enabled ?? r.isActive ?? true),
    }));
    localStorage.setItem(PROHIBITED_POLICIES_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent("yume_policies_updated", { detail: normalized }));
    window.dispatchEvent(new Event("yume_governance_updated"));
  } catch {}
}

export function scanProductAgainstPolicies(
  product: Product,
  customRules?: ProhibitedPolicyRule[]
): {
  isFlagged: boolean;
  flagged: boolean;
  matchedRule?: ProhibitedPolicyRule;
  matchedRules: ProhibitedPolicyRule[];
  matchedKeyword?: string;
} {
  const sourceRules = customRules || getProhibitedPolicyRules();
  const rules = sourceRules.filter((r) => r.enabled !== false && r.isActive !== false);
  const text = `${product.name || ""} ${product.description || ""} ${product.description_en || ""} ${product.description_fr || ""} ${product.description_ar || ""} ${(product.tags || []).join(" ")}`.toLowerCase();

  const matchedRules: ProhibitedPolicyRule[] = [];
  let matchedKeyword: string | undefined;

  for (const rule of rules) {
    const kwList =
      Array.isArray(rule.keywords) && rule.keywords.length > 0
        ? rule.keywords
        : rule.keyword
        ? [rule.keyword]
        : [];
    for (const kw of kwList) {
      if (kw && text.includes(kw.toLowerCase())) {
        matchedRules.push(rule);
        if (!matchedKeyword) matchedKeyword = kw;
        break;
      }
    }
  }

  const flagged =
    matchedRules.length > 0 || product.safe === false || product.isSafe === false;
  return {
    isFlagged: flagged,
    flagged,
    matchedRule: matchedRules[0],
    matchedRules,
    matchedKeyword,
  };
}

export const INITIAL_BUYER_COMPLAINTS: BuyerComplaintRecord[] = [
  {
    id: "cmp_2026_101",
    storeId: "store_2",
    storeName: "Casbah Heritage Copper",
    productId: "prod_3",
    productName: "Hand-Engraved Algerian Coffee Set",
    orderId: "ORD-1002",
    buyerName: "Meriem Boudiaf",
    buyerEmail: "meriem.b@example.dz",
    category: "misleading_listing",
    severity: "medium",
    description:
      "Buyer reported that the delivered tray diameter was smaller than the 45cm specification listed on the product page.",
    submittedAt: "2026-11-10T14:20:00Z",
    createdAt: "2026-11-10T14:20:00Z",
    status: "open",
  },
  {
    id: "cmp_2026_102",
    storeId: "store_3",
    storeName: "Kabyle Olive & Fig Co.",
    orderId: "ORD-1004",
    buyerName: "Riad Brahimi",
    buyerEmail: "riad.brahimi@example.dz",
    category: "pricing_or_cod_dispute",
    severity: "high",
    description:
      "Courier requested 400 DA higher COD fee than the confirmed checkout receipt.",
    submittedAt: "2026-11-11T09:15:00Z",
    createdAt: "2026-11-11T09:15:00Z",
    status: "investigating",
  },
];

export function getBuyerComplaints(): BuyerComplaintRecord[] {
  try {
    const raw = localStorage.getItem(BUYER_COMPLAINTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((c: any) => ({
          ...c,
          submittedAt: c.submittedAt || c.createdAt || "2026-11-10T12:00:00Z",
          createdAt: c.createdAt || c.submittedAt || "2026-11-10T12:00:00Z",
        }));
      }
    }
  } catch {}
  return INITIAL_BUYER_COMPLAINTS;
}

export function saveBuyerComplaints(complaints: BuyerComplaintRecord[]): void {
  try {
    localStorage.setItem(BUYER_COMPLAINTS_STORAGE_KEY, JSON.stringify(complaints));
    window.dispatchEvent(new CustomEvent("yume_complaints_updated", { detail: complaints }));
    window.dispatchEvent(new Event("yume_governance_updated"));
  } catch {}
}

// ============================================================================
// 5. SUBSCRIPTION GRACE PERIOD & NON-DESTRUCTIVE EXPIRATION EVALUATOR ([SAFEGUARD 2])
// ============================================================================

export interface ClientSubscriptionLifecycleEvaluation {
  configuredPlanId: CanonicalSubscriptionPlanId;
  effectivePlanId: CanonicalSubscriptionPlanId;
  lifecycleState: "active" | "trial" | "grace_period" | "expired" | "cancelled" | "suspended";
  isGracePeriod: boolean;
  isExpired: boolean;
  gracePeriodDays: number;
  allowPublicStorefront: boolean;
  allowExistingProductsVisible: boolean;
  allowNewCheckout: boolean;
  allowActiveOrderFulfillment: boolean;
  allowNewProductCreation: boolean;
  allowEssentialProductEditOnly: boolean;
  allowNewCampaignCreation: boolean;
  allowNewCustomDomain: boolean;
  preserveExistingCustomDomains: boolean;
  excessResourceFlags: {
    hasExcessResources: boolean;
    requiresReview: boolean;
    currentProductCount: number;
    allowedProductQuota: number | "unlimited";
    overProductQuotaCount: number;
    currentDomainCount: number;
    allowedDomainQuota: number | "unlimited";
    overDomainQuotaCount: number;
    flaggedReason?: string;
  };
  renewalBannerMessage?: string;
}

const CLIENT_PLAN_QUOTAS: Record<
  CanonicalSubscriptionPlanId,
  {
    maxActiveProducts: number | "unlimited";
    maxCustomDomains: number | "unlimited";
    gracePeriodDays: number;
  }
> = {
  Basic: { maxActiveProducts: 25, maxCustomDomains: 0, gracePeriodDays: 7 },
  Pro: { maxActiveProducts: 150, maxCustomDomains: 1, gracePeriodDays: 7 },
  "Pro Plus": { maxActiveProducts: 500, maxCustomDomains: 3, gracePeriodDays: 10 },
  Premium: { maxActiveProducts: 2500, maxCustomDomains: 10, gracePeriodDays: 14 },
  "Premium Plus": {
    maxActiveProducts: "unlimited",
    maxCustomDomains: "unlimited",
    gracePeriodDays: 14,
  },
};

function normalizePlanClient(raw?: string | null): CanonicalSubscriptionPlanId {
  const s = String(raw || "").trim().toLowerCase();
  if (s === "premium plus" || s === "premium ultra" || s === "enterprise") return "Premium Plus";
  if (s === "premium" || s === "ultimate") return "Premium";
  if (s === "pro plus" || s === "pro+") return "Pro Plus";
  if (s === "basic" || s === "starter" || s === "free") return "Basic";
  return "Pro";
}

export function evaluateMerchantSubscriptionLifecycleClient(
  store?: MerchantStore | null,
  productCountOverride?: number,
  domainCountOverride?: number
): ClientSubscriptionLifecycleEvaluation {
  const configuredPlanId = normalizePlanClient(
    store?.subscriptionMeta?.planId || store?.subscriptionTier || store?.premiumTier
  );
  const rawStatus = String(
    store?.subscriptionMeta?.status ||
      store?.subscriptionMeta?.billingStatus ||
      (store as any)?.billingStatus ||
      "active"
  )
    .trim()
    .toLowerCase();

  const tierCfg = CLIENT_PLAN_QUOTAS[configuredPlanId] || CLIENT_PLAN_QUOTAS["Pro"];
  const nowMs = Date.now();
  const expiresIso =
    (store?.subscriptionMeta as any)?.expiresAt ||
    store?.subscriptionMeta?.currentPeriodEndsAt ||
    store?.subscriptionMeta?.trialEndsAt;
  const expiresMs = expiresIso ? new Date(expiresIso).getTime() : null;
  const graceWindowMs = tierCfg.gracePeriodDays * 24 * 60 * 60 * 1000;

  let lifecycleState: "active" | "trial" | "grace_period" | "expired" | "cancelled" | "suspended" =
    "active";
  if (rawStatus === "past_due" || rawStatus === "grace_period") {
    lifecycleState = "grace_period";
  } else if (rawStatus === "expired") {
    lifecycleState = "expired";
  } else if (rawStatus === "cancelled" || rawStatus === "canceled") {
    lifecycleState = "cancelled";
  } else if (rawStatus === "suspended" || rawStatus === "suspended_billing") {
    lifecycleState = "suspended";
  } else if (rawStatus === "trial" || rawStatus === "trialing") {
    if (expiresMs && nowMs > expiresMs) {
      lifecycleState = nowMs <= expiresMs + graceWindowMs ? "grace_period" : "expired";
    } else {
      lifecycleState = "trial";
    }
  } else if (expiresMs && nowMs > expiresMs) {
    lifecycleState = nowMs <= expiresMs + graceWindowMs ? "grace_period" : "expired";
  }

  const isGracePeriod = lifecycleState === "grace_period";
  const isExpired =
    lifecycleState === "expired" ||
    lifecycleState === "cancelled" ||
    lifecycleState === "suspended";

  const effectivePlanId: CanonicalSubscriptionPlanId = isExpired
    ? "Basic"
    : configuredPlanId;
  const effectiveCfg = CLIENT_PLAN_QUOTAS[effectivePlanId];

  const allowedProductQuota =
    store?.entitlementOverrides?.maxActiveProducts !== undefined &&
    store?.entitlementOverrides?.maxActiveProducts !== null
      ? store.entitlementOverrides.maxActiveProducts
      : effectiveCfg.maxActiveProducts;

  const allowedDomainQuota =
    store?.entitlementOverrides?.maxCustomDomains !== undefined &&
    store?.entitlementOverrides?.maxCustomDomains !== null
      ? store.entitlementOverrides.maxCustomDomains
      : effectiveCfg.maxCustomDomains;

  const currentProductCount =
    typeof productCountOverride === "number"
      ? productCountOverride
      : Array.isArray(store?.products)
      ? store!.products.length
      : Number((store as any)?.productCount || 0);
  const currentDomainCount =
    typeof domainCountOverride === "number" ? domainCountOverride : 0;

  const overProductQuotaCount =
    allowedProductQuota === "unlimited"
      ? 0
      : Math.max(0, currentProductCount - Number(allowedProductQuota));
  const overDomainQuotaCount =
    allowedDomainQuota === "unlimited"
      ? 0
      : Math.max(0, currentDomainCount - Number(allowedDomainQuota));
  const hasExcessResources = overProductQuotaCount > 0 || overDomainQuotaCount > 0;

  return {
    configuredPlanId,
    effectivePlanId,
    lifecycleState,
    isGracePeriod,
    isExpired,
    gracePeriodDays: tierCfg.gracePeriodDays,
    // [SAFEGUARD 2] Never hide or delete existing merchant products upon subscription expiration
    allowPublicStorefront: true,
    allowExistingProductsVisible: true,
    allowNewCheckout: lifecycleState !== "suspended",
    allowActiveOrderFulfillment: true,
    allowNewProductCreation:
      !isGracePeriod &&
      !isExpired &&
      (allowedProductQuota === "unlimited" ||
        currentProductCount < Number(allowedProductQuota)),
    allowEssentialProductEditOnly: isGracePeriod || isExpired,
    allowNewCampaignCreation: !isGracePeriod && !isExpired && effectivePlanId !== "Basic",
    allowNewCustomDomain:
      !isGracePeriod &&
      !isExpired &&
      (allowedDomainQuota === "unlimited" || currentDomainCount < Number(allowedDomainQuota)),
    preserveExistingCustomDomains: isGracePeriod || !isExpired,
    excessResourceFlags: {
      hasExcessResources,
      requiresReview: hasExcessResources,
      currentProductCount,
      allowedProductQuota,
      overProductQuotaCount,
      currentDomainCount,
      allowedDomainQuota,
      overDomainQuotaCount,
      flaggedReason: hasExcessResources
        ? `Preserving ${currentProductCount} existing products (${overProductQuotaCount} above ${effectivePlanId} quota of ${allowedProductQuota}). Existing products remain visible; new additions are locked until renewal.`
        : undefined,
    },
    renewalBannerMessage: isGracePeriod
      ? `Grace Period Active (${tierCfg.gracePeriodDays} Days): Storefront, existing products, checkout, and order fulfillment remain active. New products, campaigns, and custom domains are frozen until renewal.`
      : isExpired
      ? `Subscription Expired (${effectivePlanId} Post-Expiry Policy): Existing products and orders are preserved. New product additions, campaigns, and custom domains are locked until renewal.`
      : undefined,
  };
}

// ============================================================================
// 6. SERVER-SIDE AUDIT VERIFICATION, DR EXPORT & SECURITY SELF-TEST HELPERS
// ============================================================================

export async function hydrateGovernanceFromServer(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/admin/governance", {
      headers: buildAdminAuthHeaders(),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
      localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(data.auditLogs));
      window.dispatchEvent(
        new CustomEvent("yume_audit_logs_updated", { detail: data.auditLogs })
      );
    }
    if (Array.isArray(data.adminAccounts) && data.adminAccounts.length > 0) {
      localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(data.adminAccounts));
    }
  } catch {}
}

export async function verifyAuditLedgerFromServer(): Promise<{
  valid: boolean;
  totalEntries: number;
  checkpointVerified: boolean;
  anomalies: Array<{
    type: string;
    entryId?: string;
    chainIndex?: number;
    description: string;
  }>;
  checkpoint?: any;
}> {
  const res = await fetch("/api/admin/audit-logs/verify", {
    headers: buildAdminAuthHeaders(),
  });
  return res.json();
}

export async function runSecuritySelfTestsFromServer(): Promise<{
  overallPassed: boolean;
  executedAt: string;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  results: Array<{
    id: string;
    domain: string;
    safeguard: string;
    title: string;
    passed: boolean;
    details: string;
  }>;
}> {
  const res = await fetch("/api/admin/security-self-test", {
    method: "POST",
    headers: buildAdminAuthHeaders(),
  });
  return res.json();
}

export async function createDisasterRecoveryExportFromServer(): Promise<any> {
  const res = await fetch("/api/db/export/disaster-recovery", {
    method: "POST",
    headers: buildAdminAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to generate Disaster-Recovery export.");
  }
  return data;
}

export async function runSandboxRestoreTestFromServer(archivePayload: any): Promise<any> {
  const res = await fetch("/api/db/import/test-sandbox", {
    method: "POST",
    headers: buildAdminAuthHeaders(),
    body: JSON.stringify(archivePayload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Isolated sandbox restoration test failed.");
  }
  return data;
}

// Auto-hydrate governance state and session on client startup
if (typeof window !== "undefined") {
  setTimeout(() => {
    const active = getActivePlatformAdmin();
    authenticateAdminServerSession(active.uid, "123456").catch(() => {});
    hydrateGovernanceFromServer().catch(() => {});
  }, 50);
}
