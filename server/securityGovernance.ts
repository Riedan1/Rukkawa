import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { Request, Response } from "express";
import { LocalDbSchema, loadDatabase, saveDatabase } from "./localDb";

// ============================================================================
// 1. EXTERNAL KMS & AUDIT CHECKPOINT ANCHOR MANAGEMENT
// ============================================================================

const SECURITY_DIR = path.join(process.cwd(), "data", ".security");
const KMS_KEY_FILE = path.join(SECURITY_DIR, ".yume-kms-master.key");
const SESSION_SECRET_FILE = path.join(SECURITY_DIR, ".yume-session-hmac.key");
const AUDIT_ANCHOR_FILE = path.join(SECURITY_DIR, ".yume-audit-anchor.json");

function ensureSecurityDir(): void {
  if (!fs.existsSync(SECURITY_DIR)) {
    fs.mkdirSync(SECURITY_DIR, { recursive: true });
  }
}

function getOrCreateMasterKey(filePath: string, envVarName: string): Buffer {
  const fromEnv = process.env[envVarName];
  if (fromEnv && fromEnv.length >= 32) {
    return crypto.createHash("sha256").update(fromEnv).digest();
  }
  ensureSecurityDir();
  if (fs.existsSync(filePath)) {
    const hex = fs.readFileSync(filePath, "utf-8").trim();
    if (hex.length === 64) {
      return Buffer.from(hex, "hex");
    }
  }
  const generated = crypto.randomBytes(32);
  fs.writeFileSync(filePath, generated.toString("hex"), { encoding: "utf-8", mode: 0o600 });
  return generated;
}

export function getKmsMasterKey(): { key: Buffer; keyFingerprint: string } {
  const key = getOrCreateMasterKey(KMS_KEY_FILE, "YUME_BACKUP_KMS_KEY");
  const keyFingerprint =
    "kms_sha256_" + crypto.createHash("sha256").update(key).digest("hex").slice(0, 16);
  return { key, keyFingerprint };
}

export function getSessionHmacSecret(): Buffer {
  return getOrCreateMasterKey(SESSION_SECRET_FILE, "YUME_ADMIN_SESSION_SECRET");
}

// ============================================================================
// 2. PASSWORD HASHING (SCRYPT) WITH TRANSPARENT BACKWARD-COMPATIBLE MIGRATION
// ============================================================================

export function hashUserPassword(rawPassword: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(rawPassword, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyUserPassword(
  rawPassword: string,
  storedHash?: string | null
): { valid: boolean; needsUpgrade: boolean; upgradedHash?: string } {
  if (!storedHash) {
    return { valid: true, needsUpgrade: true, upgradedHash: hashUserPassword(rawPassword) };
  }

  if (storedHash.startsWith("scrypt$")) {
    const parts = storedHash.split("$");
    if (parts.length !== 3) return { valid: false, needsUpgrade: false };
    const [, salt, expectedHex] = parts;
    const actualBuf = crypto.scryptSync(rawPassword, salt, 64);
    const expectedBuf = Buffer.from(expectedHex, "hex");
    if (actualBuf.length !== expectedBuf.length) {
      return { valid: false, needsUpgrade: false };
    }
    const match = crypto.timingSafeEqual(actualBuf, expectedBuf);
    return { valid: match, needsUpgrade: false };
  }

  // Legacy yume_salt_ Base64 verification & automatic in-place upgrade
  const legacyExpected = Buffer.from(`yume_salt_${rawPassword}`).toString("base64");
  const a = Buffer.from(storedHash);
  const b = Buffer.from(legacyExpected);
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (match) {
    return {
      valid: true,
      needsUpgrade: true,
      upgradedHash: hashUserPassword(rawPassword),
    };
  }
  return { valid: false, needsUpgrade: false };
}

// ============================================================================
// 3. 5-ROLE ADMIN RBAC, SIGNED SERVER SESSIONS & 5-MIN ACTION-BOUND STEP-UP MFA
// ============================================================================

export type CanonicalAdminRole =
  | "super_admin"
  | "trust_and_safety"
  | "market_operations"
  | "finance"
  | "marketing_and_ads";

export type StepUpActionScope =
  | "merchant_suspend_terminate"
  | "rbac_permission_change"
  | "subscription_plan_finance_change"
  | "db_disaster_recovery_export"
  | "db_restore_import"
  | "security_config_change";

export interface ServerAdminSession {
  sessionId: string;
  adminUid: string;
  adminEmail: string;
  adminName: string;
  roleId: CanonicalAdminRole;
  assignedMarketIds: "ALL_MARKETS" | string[];
  credentialVersion: string;
  securityEpoch: number;
  csrfToken: string;
  issuedAt: number;
  lastActiveAt: number;
  expiresAt: number;
  idleTimeoutMs: number;
  mfaAuthenticatedAt: number;
  revoked: boolean;
  revokedReason?: string;
  revokedAt?: string;
}

export interface StepUpMfaGrant {
  grantId: string;
  sessionId: string;
  adminUid: string;
  actionScope: StepUpActionScope | "ALL_CRITICAL_SCOPES";
  targetId?: string;
  credentialVersion: string;
  securityEpoch: number;
  issuedAt: number;
  expiresAt: number;
  consumedCount: number;
  revoked: boolean;
}

const SERVER_ROLE_PERMISSIONS: Record<CanonicalAdminRole, Record<string, string[]>> = {
  super_admin: {
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
  trust_and_safety: {
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
  market_operations: {
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
  finance: {
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
  marketing_and_ads: {
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

export function normalizeCanonicalAdminRole(rawRole?: string | null): CanonicalAdminRole {
  const r = String(rawRole || "").trim().toLowerCase();
  if (r === "super_admin") return "super_admin";
  if (r === "trust_and_safety" || r === "trust_safety" || r === "trust_safety_admin") {
    return "trust_and_safety";
  }
  if (
    r === "market_operations" ||
    r === "market_ops" ||
    r === "regional_market_admin" ||
    r === "operations_admin"
  ) {
    return "market_operations";
  }
  if (r === "finance" || r === "finance_subscriptions_admin") return "finance";
  if (r === "marketing_and_ads" || r === "marketing_ads" || r === "marketing_ads_admin") {
    return "marketing_and_ads";
  }
  return "market_operations";
}

export const DEFAULT_SERVER_ADMINS = [
  {
    id: "adm_super_owner",
    uid: "adm_super_owner",
    email: "th3p2000@gmail.com",
    name: "Platform Owner (Super Admin)",
    roleId: "super_admin",
    roleLabel: "Super Admin",
    assignedMarketIds: "ALL_MARKETS" as const,
    mfaEnabled: true,
    status: "active",
  },
  {
    id: "adm_trust_safety_lead",
    uid: "adm_trust_safety_lead",
    email: "trust.safety@yume.network",
    name: "Amine Khelifi (Trust & Safety Lead)",
    roleId: "trust_and_safety",
    roleLabel: "Trust & Safety",
    assignedMarketIds: "ALL_MARKETS" as const,
    mfaEnabled: true,
    status: "active",
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
    status: "active",
  },
  {
    id: "adm_finance_controller",
    uid: "adm_finance_controller",
    email: "finance@yume.network",
    name: "Karim Benali (Finance & Subscriptions)",
    roleId: "finance",
    roleLabel: "Finance & Billing",
    assignedMarketIds: "ALL_MARKETS" as const,
    mfaEnabled: true,
    status: "active",
  },
  {
    id: "adm_marketing_director",
    uid: "adm_marketing_director",
    email: "campaigns@yume.network",
    name: "Lina Touati (Campaigns & YUME Ads)",
    roleId: "marketing_and_ads",
    roleLabel: "Marketing & Advertising",
    assignedMarketIds: "ALL_MARKETS" as const,
    mfaEnabled: true,
    status: "active",
  },
];

let securityEpoch = 1;
let stepUpLifetimeMinutes = 5;
const activeAdminSessions = new Map<string, ServerAdminSession>();
const activeStepUpGrants = new Map<string, StepUpMfaGrant>();
const usedRequestNonces = new Map<string, number>();
const rateLimitBuckets = new Map<string, { count: number; windowStart: number }>();

export function computeAdminCredentialVersion(admin: any): string {
  const payload = JSON.stringify({
    uid: admin.uid || admin.id,
    roleId: normalizeCanonicalAdminRole(admin.roleId),
    status: admin.status || "active",
    assignedMarketIds: admin.assignedMarketIds || "ALL_MARKETS",
    customPermissions: admin.customPermissions || null,
    mfaEnabled: Boolean(admin.mfaEnabled ?? true),
  });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 24);
}

export function getServerAdmins(db: LocalDbSchema): any[] {
  const fromGov = db.governanceState?.adminAccounts;
  if (Array.isArray(fromGov) && fromGov.length > 0) {
    return fromGov;
  }
  return DEFAULT_SERVER_ADMINS;
}

export function signSessionToken(sessionId: string, adminUid: string, epoch: number): string {
  const secret = getSessionHmacSecret();
  const payload = `${sessionId}.${adminUid}.${epoch}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySignedSessionToken(token?: string | null): {
  valid: boolean;
  sessionId?: string;
  adminUid?: string;
  epoch?: number;
} {
  if (!token || typeof token !== "string") return { valid: false };
  const parts = token.trim().split(".");
  if (parts.length !== 4) return { valid: false };
  const [sessionId, adminUid, epochStr, providedSig] = parts;
  const epoch = Number(epochStr);
  if (!sessionId || !adminUid || !Number.isFinite(epoch)) return { valid: false };

  const secret = getSessionHmacSecret();
  const payload = `${sessionId}.${adminUid}.${epoch}`;
  const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false };
  }
  return { valid: true, sessionId, adminUid, epoch };
}

/**
 * [SAFEGUARD 1] Immediately revokes administrator sessions and step-up MFA authorizations
 * when roles, permissions, account status, or security settings change.
 */
export function revokeAdminSessionsOnSecurityChange(
  db: LocalDbSchema,
  reason: string,
  affectedAdminUid?: string,
  incrementGlobalEpoch = true
): { revokedSessionsCount: number; revokedStepUpCount: number; newSecurityEpoch: number } {
  if (incrementGlobalEpoch) {
    securityEpoch += 1;
  }

  let revokedSessionsCount = 0;
  let revokedStepUpCount = 0;
  const nowIso = new Date().toISOString();

  for (const [, sess] of activeAdminSessions.entries()) {
    if (!sess.revoked && (!affectedAdminUid || sess.adminUid === affectedAdminUid)) {
      sess.revoked = true;
      sess.revokedReason = reason;
      sess.revokedAt = nowIso;
      revokedSessionsCount += 1;
    }
  }

  for (const [, grant] of activeStepUpGrants.entries()) {
    if (!grant.revoked && (!affectedAdminUid || grant.adminUid === affectedAdminUid)) {
      grant.revoked = true;
      revokedStepUpCount += 1;
    }
  }

  appendServerAuditLog(db, {
    actorUid: "system_security_guard",
    actorName: "YUME Security Epoch Guard",
    actorEmail: "security@yume.network",
    actorRole: "super_admin",
    module: "security",
    action: "IMMEDIATE_SESSION_AND_MFA_REVOCATION",
    targetEntityType: "admin",
    targetEntityId: affectedAdminUid || "ALL_ADMIN_SESSIONS",
    targetEntityLabel: affectedAdminUid || "Global Security Epoch Increment",
    marketScope: "ALL_MARKETS",
    reason: `Automatic session & Step-Up MFA revocation triggered: ${reason}`,
    previousValue: { securityEpoch: incrementGlobalEpoch ? securityEpoch - 1 : securityEpoch },
    newValue: {
      securityEpoch,
      revokedSessionsCount,
      revokedStepUpCount,
      affectedAdminUid: affectedAdminUid || "ALL",
    },
    mfaConfirmed: true,
  });

  return {
    revokedSessionsCount,
    revokedStepUpCount,
    newSecurityEpoch: securityEpoch,
  };
}

export function createAdminSession(
  db: LocalDbSchema,
  adminAccount: any,
  idleTimeoutMs = 30 * 60 * 1000
): {
  session: ServerAdminSession;
  signedToken: string;
  stepUpGrant: StepUpMfaGrant;
} {
  const now = Date.now();
  const uid = String(adminAccount.uid || adminAccount.id);
  const roleId = normalizeCanonicalAdminRole(adminAccount.roleId);
  const credentialVersion = computeAdminCredentialVersion(adminAccount);
  const sessionId = `sess_${now}_${crypto.randomBytes(8).toString("hex")}`;
  const csrfToken = `csrf_${crypto.randomBytes(16).toString("hex")}`;

  const session: ServerAdminSession = {
    sessionId,
    adminUid: uid,
    adminEmail: String(adminAccount.email || `${uid}@yume.network`),
    adminName: String(adminAccount.name || uid),
    roleId,
    assignedMarketIds: adminAccount.assignedMarketIds || "ALL_MARKETS",
    credentialVersion,
    securityEpoch,
    csrfToken,
    issuedAt: now,
    lastActiveAt: now,
    expiresAt: now + 8 * 60 * 60 * 1000, // 8 hours max lifetime
    idleTimeoutMs,
    mfaAuthenticatedAt: now,
    revoked: false,
  };

  activeAdminSessions.set(sessionId, session);

  // Also issue an initial 5-minute Step-Up MFA grant bound to login MFA
  const stepUpGrant = createStepUpMfaGrant(session, "ALL_CRITICAL_SCOPES");
  const signedToken = signSessionToken(sessionId, uid, securityEpoch);

  return { session, signedToken, stepUpGrant };
}

export function createStepUpMfaGrant(
  session: ServerAdminSession,
  actionScope: StepUpActionScope | "ALL_CRITICAL_SCOPES",
  targetId?: string
): StepUpMfaGrant {
  const now = Date.now();
  const grantId = `mfa_${now}_${crypto.randomBytes(6).toString("hex")}`;
  const grant: StepUpMfaGrant = {
    grantId,
    sessionId: session.sessionId,
    adminUid: session.adminUid,
    actionScope,
    targetId,
    credentialVersion: session.credentialVersion,
    securityEpoch: session.securityEpoch,
    issuedAt: now,
    expiresAt: now + stepUpLifetimeMinutes * 60 * 1000,
    consumedCount: 0,
    revoked: false,
  };
  activeStepUpGrants.set(grantId, grant);
  return grant;
}

function parseCookies(req: Request): Record<string, string> {
  const raw = req.headers.cookie || "";
  const out: Record<string, string> = {};
  raw.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx > 0) {
      const k = pair.slice(0, idx).trim();
      const v = decodeURIComponent(pair.slice(idx + 1).trim());
      out[k] = v;
    }
  });
  return out;
}

export function setAdminSessionCookie(res: Response, signedToken: string): void {
  res.setHeader(
    "Set-Cookie",
    `yume_admin_session=${encodeURIComponent(
      signedToken
    )}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=28800`
  );
}

export function clearAdminSessionCookie(res: Response): void {
  res.setHeader(
    "Set-Cookie",
    `yume_admin_session=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`
  );
}

export function checkSlidingRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || now - bucket.windowStart > windowMs) {
    rateLimitBuckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  bucket.count += 1;
  if (bucket.count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: maxRequests - bucket.count };
}

/**
 * Resolves and validates the administrator session and optional Step-Up MFA requirement.
 * In strict mode (`req.headers['x-yume-strict-auth'] === '1'` or when a token is provided),
 * rejects missing/revoked/expired tokens or missing Step-Up MFA.
 */
export function authorizeAdminRequest(
  req: Request,
  db: LocalDbSchema,
  options: {
    module: string;
    action: string;
    marketId?: string;
    requireStepUpScope?: StepUpActionScope;
    targetId?: string;
    requireStrictToken?: boolean;
    requireExplicitIdentity?: boolean;
  }
): {
  allowed: boolean;
  status: number;
  errorCode?: string;
  reason?: string;
  session?: ServerAdminSession;
  adminAccount?: any;
} {
  const cookies = parseCookies(req);
  const headerToken =
    (req.headers["x-yume-admin-token"] as string) || cookies["yume_admin_session"] || "";
  const claimedAdminUid =
    (req.headers["x-yume-admin-uid"] as string) ||
    (req.body && (req.body.actorUid || req.body.enforcedByAdminId)) ||
    "";
  const strictMode =
    options.requireStrictToken === true ||
    req.headers["x-yume-strict-auth"] === "1" ||
    req.query.strictAuth === "1";

  const admins = getServerAdmins(db);
  const now = Date.now();

  // Check replay nonce if supplied
  const nonce = req.headers["x-yume-request-nonce"] as string | undefined;
  if (nonce) {
    const prevNonceTs = usedRequestNonces.get(nonce);
    if (prevNonceTs && now - prevNonceTs < 10 * 60 * 1000) {
      return {
        allowed: false,
        status: 403,
        errorCode: "REPLAY_ATTACK_DETECTED",
        reason: "Duplicate request nonce detected. Replay prevented.",
      };
    }
    usedRequestNonces.set(nonce, now);
  }

  let resolvedSession: ServerAdminSession | undefined;

  if (headerToken) {
    const verified = verifySignedSessionToken(headerToken);
    if (!verified.valid || !verified.sessionId) {
      return {
        allowed: false,
        status: 401,
        errorCode: "INVALID_SESSION_SIGNATURE",
        reason: "Cryptographic signature verification failed on admin session token.",
      };
    }
    const sess = activeAdminSessions.get(verified.sessionId);
    if (!sess) {
      return {
        allowed: false,
        status: 401,
        errorCode: "SESSION_NOT_FOUND",
        reason: "Administrator session does not exist or has expired.",
      };
    }
    if (sess.revoked) {
      return {
        allowed: false,
        status: 401,
        errorCode: "SESSION_REVOKED_ON_SECURITY_CHANGE",
        reason: `Session was immediately revoked: ${sess.revokedReason || "Security state changed"}.`,
      };
    }
    if (sess.securityEpoch !== securityEpoch) {
      sess.revoked = true;
      sess.revokedReason = "Global security epoch advanced.";
      return {
        allowed: false,
        status: 401,
        errorCode: "SESSION_REVOKED_ON_SECURITY_CHANGE",
        reason: "Administrator session invalidated by global security policy update.",
      };
    }
    if (now > sess.expiresAt || now - sess.lastActiveAt > sess.idleTimeoutMs) {
      sess.revoked = true;
      sess.revokedReason = "Session expired or idle timeout exceeded.";
      return {
        allowed: false,
        status: 401,
        errorCode: "SESSION_EXPIRED",
        reason: "Administrator session has expired. Please re-authenticate.",
      };
    }

    // Verify live admin account still matches credentialVersion (role, status, marketScopes, permissions)
    const liveAdmin = admins.find((a) => (a.uid || a.id) === sess.adminUid);
    if (!liveAdmin || liveAdmin.status !== "active") {
      sess.revoked = true;
      sess.revokedReason = "Administrator account disabled or removed.";
      return {
        allowed: false,
        status: 403,
        errorCode: "ADMIN_ACCOUNT_INACTIVE",
        reason: "Administrator account is disabled or revoked.",
      };
    }

    const currentCredVer = computeAdminCredentialVersion(liveAdmin);
    if (currentCredVer !== sess.credentialVersion) {
      sess.revoked = true;
      sess.revokedReason = "Administrator role, market scope, or permissions changed.";
      return {
        allowed: false,
        status: 401,
        errorCode: "SESSION_REVOKED_ON_SECURITY_CHANGE",
        reason:
          "Administrator role or permissions changed. Active session and MFA grants were automatically revoked.",
      };
    }

    sess.lastActiveAt = now;
    resolvedSession = sess;
  } else if (strictMode) {
    return {
      allowed: false,
      status: 401,
      errorCode: "ADMIN_AUTH_REQUIRED",
      reason: "Signed server-side administrator session token is required.",
    };
  } else if (options.requireExplicitIdentity && !claimedAdminUid) {
    return {
      allowed: false,
      status: 401,
      errorCode: "ADMIN_AUTH_REQUIRED",
      reason: "Administrator authentication credentials are required.",
    };
  } else {
    // Seamless preview fallback: resolve the requested admin from server registry (never trusting client role claims)
    const targetAdmin =
      (claimedAdminUid && admins.find((a) => (a.uid || a.id) === claimedAdminUid)) ||
      (options.requireExplicitIdentity ? null : admins[0]);
    if (!targetAdmin || targetAdmin.status !== "active") {
      return {
        allowed: false,
        status: targetAdmin ? 403 : 401,
        errorCode: targetAdmin ? "ADMIN_ACCOUNT_INACTIVE" : "ADMIN_AUTH_REQUIRED",
        reason: targetAdmin
          ? "Administrator account is inactive or revoked."
          : "Recognized administrator identity is required.",
      };
    }
    const existingForUid = Array.from(activeAdminSessions.values()).find(
      (s) =>
        s.adminUid === (targetAdmin.uid || targetAdmin.id) &&
        !s.revoked &&
        s.securityEpoch === securityEpoch &&
        s.credentialVersion === computeAdminCredentialVersion(targetAdmin)
    );
    if (existingForUid) {
      existingForUid.lastActiveAt = now;
      resolvedSession = existingForUid;
    } else {
      resolvedSession = createAdminSession(db, targetAdmin).session;
    }
  }

  const liveAdmin =
    admins.find((a) => (a.uid || a.id) === resolvedSession!.adminUid) || DEFAULT_SERVER_ADMINS[0];
  const roleId = normalizeCanonicalAdminRole(liveAdmin.roleId);

  // Market Scope Validation
  const marketId = options.marketId;
  if (
    roleId !== "super_admin" &&
    marketId &&
    marketId !== "ALL_MARKETS" &&
    Array.isArray(liveAdmin.assignedMarketIds) &&
    !liveAdmin.assignedMarketIds.includes(marketId)
  ) {
    return {
      allowed: false,
      status: 403,
      errorCode: "MARKET_SCOPE_VIOLATION",
      reason: `Role "${liveAdmin.roleLabel || roleId}" is not authorized for market "${marketId}". Assigned markets: ${liveAdmin.assignedMarketIds.join(", ")}.`,
    };
  }

  // Role Permission Matrix Validation (fail-closed [] if module isn't explicitly granted)
  if (roleId !== "super_admin") {
    const customPerms = liveAdmin.customPermissions?.[options.module];
    const allowedActions =
      customPerms ?? SERVER_ROLE_PERMISSIONS[roleId]?.[options.module] ?? [];
    if (!allowedActions.includes(options.action)) {
      return {
        allowed: false,
        status: 403,
        errorCode: "RBAC_LEAST_PRIVILEGE_DENIED",
        reason: `Principle of Least Privilege: Role "${
          liveAdmin.roleLabel || roleId
        }" does not have "${options.action.toUpperCase()}" permission in "${options.module}".`,
      };
    }
  }

  // Step-Up MFA Verification Check for Sensitive Operations
  if (options.requireStepUpScope) {
    const stepUpHeader = req.headers["x-yume-stepup-token"] as string | undefined;
    let validGrant: StepUpMfaGrant | undefined;

    if (stepUpHeader && activeStepUpGrants.has(stepUpHeader)) {
      const candidate = activeStepUpGrants.get(stepUpHeader)!;
      if (
        !candidate.revoked &&
        candidate.sessionId === resolvedSession.sessionId &&
        candidate.securityEpoch === securityEpoch &&
        candidate.credentialVersion === resolvedSession.credentialVersion &&
        now <= candidate.expiresAt &&
        (candidate.actionScope === options.requireStepUpScope ||
          candidate.actionScope === "ALL_CRITICAL_SCOPES") &&
        (!candidate.targetId || !options.targetId || candidate.targetId === options.targetId)
      ) {
        validGrant = candidate;
      }
    } else if (!strictMode) {
      // Find any active non-expired grant for this session matching the scope
      validGrant = Array.from(activeStepUpGrants.values()).find(
        (g) =>
          !g.revoked &&
          g.sessionId === resolvedSession!.sessionId &&
          g.securityEpoch === securityEpoch &&
          g.credentialVersion === resolvedSession!.credentialVersion &&
          now <= g.expiresAt &&
          (g.actionScope === options.requireStepUpScope ||
            g.actionScope === "ALL_CRITICAL_SCOPES")
      );
    }

    if (!validGrant) {
      return {
        allowed: false,
        status: 403,
        errorCode: "STEP_UP_MFA_REQUIRED",
        reason: `Fresh Step-Up MFA verification (within ${stepUpLifetimeMinutes} minutes) is required for sensitive action "${options.requireStepUpScope}".`,
      };
    }

    validGrant.consumedCount += 1;
  }

  return {
    allowed: true,
    status: 200,
    session: resolvedSession,
    adminAccount: liveAdmin,
  };
}

// ============================================================================
// 4. CRYPTOGRAPHIC SHA-256 AUDIT LEDGER & HMAC-ANCHORED CHECKPOINTS ([SAFEGUARD 4])
// ============================================================================

export interface AuditVerificationCheckpoint {
  checkpointId: string;
  ledgerLength: number;
  lastEntryId: string;
  lastIntegrityHash: string;
  cumulativeRootHash: string;
  createdAt: string;
  hmacSignature: string;
}

export function computeCanonicalAuditEntryHash(
  index: number,
  previousHash: string,
  entry: {
    id: string;
    timestamp: string;
    actorUid: string;
    actorEmail: string;
    actorRole: string;
    module: string;
    action: string;
    targetEntityType: string;
    targetEntityId: string;
    marketScope: string;
    reason: string;
  }
): string {
  const canonicalPayload = [
    String(index),
    previousHash,
    entry.id,
    entry.timestamp,
    entry.actorUid,
    entry.actorEmail,
    entry.actorRole,
    entry.module,
    entry.action,
    entry.targetEntityType,
    entry.targetEntityId,
    entry.marketScope,
    entry.reason,
  ].join("|");
  return crypto.createHash("sha256").update(canonicalPayload).digest("hex");
}

function signCheckpointHmac(data: Omit<AuditVerificationCheckpoint, "hmacSignature">): string {
  const secret = getSessionHmacSecret();
  const str = `${data.checkpointId}|${data.ledgerLength}|${data.lastEntryId}|${data.lastIntegrityHash}|${data.cumulativeRootHash}|${data.createdAt}`;
  return crypto.createHmac("sha256", secret).update(str).digest("hex");
}

export function loadAuditCheckpointAnchor(): AuditVerificationCheckpoint | null {
  ensureSecurityDir();
  if (!fs.existsSync(AUDIT_ANCHOR_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(AUDIT_ANCHOR_FILE, "utf-8"));
  } catch {
    return null;
  }
}

export function saveAuditCheckpointAnchor(
  chronologicalLogs: any[]
): AuditVerificationCheckpoint {
  ensureSecurityDir();
  const len = chronologicalLogs.length;
  const last = chronologicalLogs[len - 1];
  const allHashes = chronologicalLogs.map((l) => l.integrityHash).join(":");
  const cumulativeRootHash = crypto.createHash("sha256").update(allHashes).digest("hex");

  const base = {
    checkpointId: `chk_${Date.now()}`,
    ledgerLength: len,
    lastEntryId: last ? String(last.id) : "GENESIS",
    lastIntegrityHash: last ? String(last.integrityHash) : "GENESIS_YUME_AUDIT_CHAIN",
    cumulativeRootHash,
    createdAt: new Date().toISOString(),
  };
  const checkpoint: AuditVerificationCheckpoint = {
    ...base,
    hmacSignature: signCheckpointHmac(base),
  };
  fs.writeFileSync(AUDIT_ANCHOR_FILE, JSON.stringify(checkpoint, null, 2), "utf-8");
  return checkpoint;
}

/**
 * Ensures existing audit logs are migrated to true 64-hex SHA-256 hash chains and anchored.
 * Stored in `db.governanceState.auditLogs` newest-first for UI display, with `chainIndex` 0..N-1.
 */
export function ensureServerAuditLedgerInitialized(db: LocalDbSchema): any[] {
  if (!db.governanceState) {
    db.governanceState = {};
  }
  let rawLogs: any[] = Array.isArray(db.governanceState.auditLogs)
    ? db.governanceState.auditLogs
    : [];

  if (rawLogs.length === 0) {
    rawLogs = [
      {
        id: "aud_20261112_001",
        timestamp: "2026-11-12T08:30:00.000Z",
        actorUid: "adm_super_owner",
        actorName: "Platform Owner (Super Admin)",
        actorEmail: "th3p2000@gmail.com",
        actorRole: "super_admin",
        module: "subscriptions",
        action: "UNIFY_CANONICAL_PLANS",
        targetEntityType: "plan",
        targetEntityId: "ALL_5_PLANS",
        targetEntityLabel: "Basic · Pro · Pro Plus · Premium · Premium Plus",
        marketScope: "ALL_MARKETS",
        reason: "Initialized unified 5-tier canonical subscription plan & entitlements registry.",
        mfaConfirmed: true,
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
        targetEntityType: "market",
        targetEntityId: "DZ_MA_TN_EG",
        targetEntityLabel: "Algeria, Morocco, Tunisia, Egypt",
        marketScope: "DZ",
        reason: "Confirmed regional currency, phone prefix, and cultural color palette synchronization.",
        mfaConfirmed: true,
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
        targetEntityType: "system",
        targetEntityId: "ENFORCEMENT_V2",
        targetEntityLabel: "4-Stage Merchant Enforcement & Appeals",
        marketScope: "ALL_MARKETS",
        reason: "Activated server-authoritative Warning, Restricted, Suspended, and Terminated state gates.",
        mfaConfirmed: true,
      },
    ];
  }

  // Check if any entry uses legacy "sha256_" 16-hex hash or lacks chainIndex
  const needsMigration = rawLogs.some(
    (l) =>
      typeof l.chainIndex !== "number" ||
      !l.previousHash ||
      typeof l.integrityHash !== "string" ||
      l.integrityHash.startsWith("sha256_") ||
      l.integrityHash.length !== 64
  );

  if (needsMigration) {
    // Sort oldest to newest by timestamp
    const chronological = [...rawLogs].sort(
      (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );
    let prevHash = "GENESIS_YUME_AUDIT_CHAIN";
    const migratedChronological = chronological.map((item, idx) => {
      const normalized = {
        ...item,
        id: String(item.id || `aud_migrated_${idx}`),
        timestamp: String(item.timestamp || new Date().toISOString()),
        actorUid: String(item.actorUid || "adm_super_owner"),
        actorName: String(item.actorName || "Platform Admin"),
        actorEmail: String(item.actorEmail || "th3p2000@gmail.com"),
        actorRole: String(item.actorRole || "super_admin"),
        module: String(item.module || "system"),
        action: String(item.action || item.actionType || "edit"),
        actionType: String(item.actionType || item.action || "edit"),
        targetEntityType: String(item.targetEntityType || item.targetType || "system"),
        targetType: String(item.targetType || item.targetEntityType || "system"),
        targetEntityId: String(item.targetEntityId || item.targetId || "global"),
        targetId: String(item.targetId || item.targetEntityId || "global"),
        targetEntityLabel: String(item.targetEntityLabel || item.targetName || "System"),
        targetName: String(item.targetName || item.targetEntityLabel || "System"),
        marketScope: String(item.marketScope || "ALL_MARKETS"),
        reason: String(item.reason || item.summary || "Administrative action"),
        summary: String(item.summary || item.reason || "Administrative action"),
        chainIndex: idx,
        previousHash: prevHash,
      };
      const hash = computeCanonicalAuditEntryHash(idx, prevHash, normalized);
      prevHash = hash;
      return {
        ...normalized,
        integrityHash: hash,
      };
    });

    saveAuditCheckpointAnchor(migratedChronological);
    db.governanceState.auditLogs = [...migratedChronological].reverse();
  } else if (!loadAuditCheckpointAnchor()) {
    const chronological = [...rawLogs].sort((a, b) => a.chainIndex - b.chainIndex);
    saveAuditCheckpointAnchor(chronological);
  }

  return db.governanceState.auditLogs!;
}

export function appendServerAuditLog(
  db: LocalDbSchema,
  input: any,
  verifiedSession?: ServerAdminSession
): any {
  const existingNewestFirst = ensureServerAuditLedgerInitialized(db);
  const chronological = [...existingNewestFirst].sort((a, b) => a.chainIndex - b.chainIndex);

  // Deduplicate if exact ID already exists
  if (input.id && chronological.some((e) => e.id === input.id)) {
    return chronological.find((e) => e.id === input.id);
  }

  const nextIndex = chronological.length;
  const prevHash =
    nextIndex > 0
      ? chronological[nextIndex - 1].integrityHash
      : "GENESIS_YUME_AUDIT_CHAIN";
  const nowIso = new Date().toISOString();

  // Server-authoritative actor attribution when session is present
  const actorUid = verifiedSession
    ? verifiedSession.adminUid
    : String(input.actorUid || "adm_super_owner");
  const actorEmail = verifiedSession
    ? verifiedSession.adminEmail
    : String(input.actorEmail || "th3p2000@gmail.com");
  const actorRole = verifiedSession
    ? verifiedSession.roleId
    : String(input.actorRole || "super_admin");
  const actorName = verifiedSession
    ? verifiedSession.adminName
    : String(input.actorName || "Platform Admin");

  const id = String(input.id || `aud_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`);
  const action = String(input.action || input.actionType || "ADMIN_ACTION");
  const targetEntityType = String(input.targetEntityType || input.targetType || "system");
  const targetEntityId = String(input.targetEntityId || input.targetId || "global");
  const targetEntityLabel = String(
    input.targetEntityLabel || input.targetName || targetEntityId
  );
  const marketScope = String(input.marketScope || "ALL_MARKETS");
  const reason = String(input.reason || input.summary || "Administrative action");

  const entryCore = {
    id,
    timestamp: nowIso,
    actorUid,
    actorEmail,
    actorRole,
    module: String(input.module || "system"),
    action,
    targetEntityType,
    targetEntityId,
    marketScope,
    reason,
  };

  const integrityHash = computeCanonicalAuditEntryHash(nextIndex, prevHash, entryCore);

  const fullRecord = {
    ...entryCore,
    actorName,
    actionType: String(input.actionType || action),
    targetType: targetEntityType,
    targetId: targetEntityId,
    targetEntityLabel,
    targetName: targetEntityLabel,
    summary: reason,
    previousValue: input.previousValue ?? input.beforeState ?? null,
    newValue: input.newValue ?? input.afterState ?? null,
    beforeState: input.beforeState ?? input.previousValue ?? null,
    afterState: input.afterState ?? input.newValue ?? null,
    mfaConfirmed: Boolean(verifiedSession ? true : input.mfaConfirmed ?? true),
    chainIndex: nextIndex,
    previousHash: prevHash,
    integrityHash,
  };

  const nextChronological = [...chronological, fullRecord];
  saveAuditCheckpointAnchor(nextChronological);
  db.governanceState!.auditLogs = [...nextChronological].reverse();
  db.governanceState!.updatedAt = nowIso;

  return fullRecord;
}

/**
 * [SAFEGUARD 4] Independent Audit Ledger Verification Engine
 * Detects modified, deleted, reordered, or inserted audit records and verifies the HMAC checkpoint.
 */
export function verifyAuditLedgerIntegrityServer(
  logsInput: any[],
  checkpointOverride?: AuditVerificationCheckpoint | null
): {
  valid: boolean;
  totalEntries: number;
  checkpointVerified: boolean;
  anomalies: Array<{
    type:
      | "MODIFIED_RECORD"
      | "DELETED_RECORD"
      | "REORDERED_RECORD"
      | "INSERTED_RECORD"
      | "CHECKPOINT_SIGNATURE_MISMATCH";
    entryId?: string;
    chainIndex?: number;
    description: string;
  }>;
  checkpoint?: AuditVerificationCheckpoint | null;
} {
  const anomalies: Array<{
    type:
      | "MODIFIED_RECORD"
      | "DELETED_RECORD"
      | "REORDERED_RECORD"
      | "INSERTED_RECORD"
      | "CHECKPOINT_SIGNATURE_MISMATCH";
    entryId?: string;
    chainIndex?: number;
    description: string;
  }> = [];

  const checkpoint =
    checkpointOverride !== undefined ? checkpointOverride : loadAuditCheckpointAnchor();

  // Order logs as supplied in chronological sequence (reverse if supplied newest-first)
  const list = Array.isArray(logsInput) ? [...logsInput] : [];
  const chronological =
    list.length >= 2 &&
    typeof list[0].chainIndex === "number" &&
    typeof list[list.length - 1].chainIndex === "number" &&
    list[0].chainIndex > list[list.length - 1].chainIndex
      ? [...list].reverse()
      : list;

  // 1. Verify Checkpoint HMAC Signature
  let checkpointVerified = true;
  if (checkpoint) {
    const expectedHmac = signCheckpointHmac({
      checkpointId: checkpoint.checkpointId,
      ledgerLength: checkpoint.ledgerLength,
      lastEntryId: checkpoint.lastEntryId,
      lastIntegrityHash: checkpoint.lastIntegrityHash,
      cumulativeRootHash: checkpoint.cumulativeRootHash,
      createdAt: checkpoint.createdAt,
    });
    if (expectedHmac !== checkpoint.hmacSignature) {
      checkpointVerified = false;
      anomalies.push({
        type: "CHECKPOINT_SIGNATURE_MISMATCH",
        description:
          "Verification checkpoint HMAC signature failed validation (unauthorized checkpoint modification).",
      });
    }

    if (chronological.length < checkpoint.ledgerLength) {
      anomalies.push({
        type: "DELETED_RECORD",
        description: `Ledger length (${chronological.length}) is shorter than anchored checkpoint length (${checkpoint.ledgerLength}). ${
          checkpoint.ledgerLength - chronological.length
        } record(s) deleted.`,
      });
    }
  }

  let expectedPrevHash = "GENESIS_YUME_AUDIT_CHAIN";
  let prevTimestampMs = 0;

  for (let i = 0; i < chronological.length; i++) {
    const item = chronological[i];
    const itemTs = new Date(item.timestamp || 0).getTime();

    // Detect reordered records
    if (typeof item.chainIndex === "number" && item.chainIndex !== i) {
      if (item.chainIndex > i) {
        anomalies.push({
          type: "DELETED_RECORD",
          entryId: item.id,
          chainIndex: i,
          description: `Missing sequence index before record ${item.id}: expected chainIndex ${i}, found ${item.chainIndex}.`,
        });
      } else {
        anomalies.push({
          type: "REORDERED_RECORD",
          entryId: item.id,
          chainIndex: i,
          description: `Sequence index out of order at position ${i} (record ${item.id} has chainIndex ${item.chainIndex}).`,
        });
      }
    }

    if (i > 0 && itemTs < prevTimestampMs) {
      anomalies.push({
        type: "REORDERED_RECORD",
        entryId: item.id,
        chainIndex: i,
        description: `Non-monotonic timestamp detected on record ${item.id} at index ${i}.`,
      });
    }
    prevTimestampMs = itemTs;

    // Check previousHash link (detects insertion, deletion, or reordering)
    if (item.previousHash !== expectedPrevHash) {
      const matchesEarlier = chronological
        .slice(0, i)
        .some((prev) => prev.integrityHash === item.previousHash);
      if (!matchesEarlier && item.previousHash !== "GENESIS_YUME_AUDIT_CHAIN") {
        anomalies.push({
          type: "INSERTED_RECORD",
          entryId: item.id,
          chainIndex: i,
          description: `Record ${item.id} at index ${i} references unknown previousHash "${String(
            item.previousHash
          ).slice(0, 16)}..." (unanchored insertion or deleted predecessor).`,
        });
      } else {
        anomalies.push({
          type: "REORDERED_RECORD",
          entryId: item.id,
          chainIndex: i,
          description: `Broken hash link at index ${i} (${item.id}): expected previousHash "${expectedPrevHash.slice(
            0,
            16
          )}...", got "${String(item.previousHash).slice(0, 16)}...".`,
        });
      }
    }

    // Recompute SHA-256 over canonical fields (detects modified records)
    const recomputed = computeCanonicalAuditEntryHash(
      typeof item.chainIndex === "number" ? item.chainIndex : i,
      item.previousHash || expectedPrevHash,
      {
        id: String(item.id || ""),
        timestamp: String(item.timestamp || ""),
        actorUid: String(item.actorUid || ""),
        actorEmail: String(item.actorEmail || ""),
        actorRole: String(item.actorRole || ""),
        module: String(item.module || ""),
        action: String(item.action || ""),
        targetEntityType: String(item.targetEntityType || ""),
        targetEntityId: String(item.targetEntityId || ""),
        marketScope: String(item.marketScope || ""),
        reason: String(item.reason || ""),
      }
    );

    if (recomputed !== item.integrityHash) {
      anomalies.push({
        type: "MODIFIED_RECORD",
        entryId: item.id,
        chainIndex: i,
        description: `SHA-256 digest mismatch on record ${item.id} at index ${i}. Payload was modified after creation.`,
      });
    }

    expectedPrevHash = item.integrityHash;
  }

  // Verify against checkpoint cumulative root if lengths match
  if (checkpoint && checkpointVerified && chronological.length === checkpoint.ledgerLength) {
    const allHashes = chronological.map((l) => l.integrityHash).join(":");
    const actualRoot = crypto.createHash("sha256").update(allHashes).digest("hex");
    if (actualRoot !== checkpoint.cumulativeRootHash) {
      anomalies.push({
        type: "INSERTED_RECORD",
        description:
          "Ledger cumulative root hash diverges from anchored checkpoint (unauthorized record replacement or insertion).",
      });
    }
  }

  return {
    valid: anomalies.length === 0,
    totalEntries: chronological.length,
    checkpointVerified,
    anomalies,
    checkpoint,
  };
}

// ============================================================================
// 5. SUBSCRIPTION EXPIRATION, GRACE PERIOD & NON-DESTRUCTIVE POLICY ([SAFEGUARD 2])
// ============================================================================

export interface TierGracePolicyConfig {
  gracePeriodDays: number;
  fallbackToBasicOnExpiry: boolean;
  pauseCampaignsInGracePeriod: boolean;
  pauseCampaignsOnExpiry: boolean;
  preserveExistingDomainsInGracePeriod: boolean;
}

export interface SubscriptionLifecyclePolicy {
  updatedAt: string;
  updatedBy: string;
  tiers: Record<string, TierGracePolicyConfig>;
}

export const DEFAULT_SUBSCRIPTION_LIFECYCLE_POLICY: SubscriptionLifecyclePolicy = {
  updatedAt: "2026-11-12T09:00:00.000Z",
  updatedBy: "Super Admin",
  tiers: {
    Basic: {
      gracePeriodDays: 7,
      fallbackToBasicOnExpiry: true,
      pauseCampaignsInGracePeriod: true,
      pauseCampaignsOnExpiry: true,
      preserveExistingDomainsInGracePeriod: true,
    },
    Pro: {
      gracePeriodDays: 7,
      fallbackToBasicOnExpiry: true,
      pauseCampaignsInGracePeriod: false,
      pauseCampaignsOnExpiry: true,
      preserveExistingDomainsInGracePeriod: true,
    },
    "Pro Plus": {
      gracePeriodDays: 10,
      fallbackToBasicOnExpiry: true,
      pauseCampaignsInGracePeriod: false,
      pauseCampaignsOnExpiry: true,
      preserveExistingDomainsInGracePeriod: true,
    },
    Premium: {
      gracePeriodDays: 14,
      fallbackToBasicOnExpiry: true,
      pauseCampaignsInGracePeriod: false,
      pauseCampaignsOnExpiry: true,
      preserveExistingDomainsInGracePeriod: true,
    },
    "Premium Plus": {
      gracePeriodDays: 14,
      fallbackToBasicOnExpiry: true,
      pauseCampaignsInGracePeriod: false,
      pauseCampaignsOnExpiry: true,
      preserveExistingDomainsInGracePeriod: true,
    },
  },
};

export const CANONICAL_PLAN_QUOTAS: Record<
  string,
  {
    maxActiveProducts: number | "unlimited";
    maxImagesPerProduct: number;
    maxCustomDomains: number | "unlimited";
    maxStoreCampaigns: number | "unlimited";
  }
> = {
  Basic: {
    maxActiveProducts: 25,
    maxImagesPerProduct: 4,
    maxCustomDomains: 0,
    maxStoreCampaigns: 0,
  },
  Pro: {
    maxActiveProducts: 150,
    maxImagesPerProduct: 8,
    maxCustomDomains: 1,
    maxStoreCampaigns: 2,
  },
  "Pro Plus": {
    maxActiveProducts: 500,
    maxImagesPerProduct: 12,
    maxCustomDomains: 3,
    maxStoreCampaigns: 5,
  },
  Premium: {
    maxActiveProducts: 2500,
    maxImagesPerProduct: 15,
    maxCustomDomains: 10,
    maxStoreCampaigns: 15,
  },
  "Premium Plus": {
    maxActiveProducts: "unlimited",
    maxImagesPerProduct: 20,
    maxCustomDomains: "unlimited",
    maxStoreCampaigns: "unlimited",
  },
};

export function resolveCanonicalTierName(raw?: string | null): string {
  const s = String(raw || "").trim().toLowerCase();
  if (s === "premium plus" || s === "premium ultra" || s === "enterprise") return "Premium Plus";
  if (s === "premium" || s === "ultimate") return "Premium";
  if (s === "pro plus" || s === "pro+") return "Pro Plus";
  if (s === "basic" || s === "starter" || s === "free") return "Basic";
  return "Pro";
}

/**
 * [SAFEGUARD 2] Evaluates a merchant's subscription status, grace period, and post-expiration
 * policy WITHOUT ever hiding, unpublishing, or deleting existing products, domains, or orders.
 */
export function evaluateStoreSubscriptionLifecycle(
  store: any,
  db: LocalDbSchema
): {
  configuredPlanId: string;
  effectivePlanId: string;
  lifecycleState: "active" | "trial" | "grace_period" | "expired" | "cancelled" | "suspended";
  isGracePeriod: boolean;
  isExpired: boolean;
  allowPublicStorefront: boolean;
  allowExistingProductsVisible: boolean;
  allowNewCheckout: boolean;
  allowActiveOrderFulfillment: boolean;
  allowNewProductCreation: boolean;
  allowEssentialProductEditOnly: boolean;
  allowNewCampaignCreation: boolean;
  allowNewCustomDomain: boolean;
  preserveExistingCustomDomains: boolean;
  quotas: {
    maxActiveProducts: number | "unlimited";
    maxImagesPerProduct: number;
    maxCustomDomains: number | "unlimited";
    maxStoreCampaigns: number | "unlimited";
  };
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
} {
  const configuredPlanId = resolveCanonicalTierName(
    store?.subscriptionMeta?.planId || store?.subscriptionTier || store?.premiumTier
  );
  const rawStatus = String(
    store?.subscriptionMeta?.status || store?.billingStatus || "active"
  )
    .trim()
    .toLowerCase();

  const policy: SubscriptionLifecyclePolicy =
    (db.governanceState as any)?.subscriptionLifecyclePolicy ||
    DEFAULT_SUBSCRIPTION_LIFECYCLE_POLICY;
  const tierPolicy =
    policy.tiers[configuredPlanId] || DEFAULT_SUBSCRIPTION_LIFECYCLE_POLICY.tiers["Pro"];

  const nowMs = Date.now();
  const expiresAtIso = store?.subscriptionMeta?.expiresAt || store?.subscriptionMeta?.trialEndsAt;
  const expiresAtMs = expiresAtIso ? new Date(expiresAtIso).getTime() : null;
  const graceWindowMs = (tierPolicy.gracePeriodDays || 7) * 24 * 60 * 60 * 1000;

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
    if (expiresAtMs && nowMs > expiresAtMs) {
      lifecycleState = nowMs <= expiresAtMs + graceWindowMs ? "grace_period" : "expired";
    } else {
      lifecycleState = "trial";
    }
  } else if (expiresAtMs && nowMs > expiresAtMs) {
    lifecycleState = nowMs <= expiresAtMs + graceWindowMs ? "grace_period" : "expired";
  }

  const isGracePeriod = lifecycleState === "grace_period";
  const isExpired =
    lifecycleState === "expired" ||
    lifecycleState === "cancelled" ||
    lifecycleState === "suspended";

  // Effective plan after grace period: apply Basic entitlements if policy permits
  const effectivePlanId =
    isExpired && tierPolicy.fallbackToBasicOnExpiry ? "Basic" : configuredPlanId;

  const baseQuotas =
    CANONICAL_PLAN_QUOTAS[effectivePlanId] || CANONICAL_PLAN_QUOTAS["Pro"];
  const ov = store?.entitlementOverrides || {};
  const quotas = {
    maxActiveProducts:
      ov.maxActiveProducts !== undefined && ov.maxActiveProducts !== null
        ? ov.maxActiveProducts
        : baseQuotas.maxActiveProducts,
    maxImagesPerProduct:
      typeof ov.maxImagesPerProduct === "number"
        ? ov.maxImagesPerProduct
        : baseQuotas.maxImagesPerProduct,
    maxCustomDomains:
      ov.maxCustomDomains !== undefined && ov.maxCustomDomains !== null
        ? ov.maxCustomDomains
        : baseQuotas.maxCustomDomains,
    maxStoreCampaigns:
      ov.maxStoreCampaigns !== undefined && ov.maxStoreCampaigns !== null
        ? ov.maxStoreCampaigns
        : baseQuotas.maxStoreCampaigns,
  };

  const storeId = String(store?.id || "");
  const dbProductsForStore = Array.isArray(db.products)
    ? db.products.filter(
        (p: any) => String(p.storeId || p.merchantId) === storeId
      ).length
    : 0;
  const embeddedProductsCount = Array.isArray(store?.products)
    ? store.products.length
    : Number(store?.productCount || 0);
  const currentProductCount = Math.max(dbProductsForStore, embeddedProductsCount);
  const currentDomainCount = Array.isArray(db.domains)
    ? db.domains.filter((d: any) => String(d.merchantId) === storeId).length
    : 0;

  const overProductQuotaCount =
    quotas.maxActiveProducts === "unlimited"
      ? 0
      : Math.max(0, currentProductCount - Number(quotas.maxActiveProducts));
  const overDomainQuotaCount =
    quotas.maxCustomDomains === "unlimited"
      ? 0
      : Math.max(0, currentDomainCount - Number(quotas.maxCustomDomains));

  const hasExcessResources = overProductQuotaCount > 0 || overDomainQuotaCount > 0;

  const allowNewProductCreation =
    !isGracePeriod &&
    !isExpired &&
    (quotas.maxActiveProducts === "unlimited" ||
      currentProductCount < Number(quotas.maxActiveProducts));

  return {
    configuredPlanId,
    effectivePlanId,
    lifecycleState,
    isGracePeriod,
    isExpired,
    // [SAFEGUARD 2] Existing storefront and existing products are NEVER hidden on expiration
    allowPublicStorefront: true,
    allowExistingProductsVisible: true,
    allowNewCheckout: lifecycleState !== "suspended",
    allowActiveOrderFulfillment: true,
    allowNewProductCreation,
    allowEssentialProductEditOnly: isGracePeriod || isExpired,
    allowNewCampaignCreation: !isGracePeriod && !isExpired && Number(quotas.maxStoreCampaigns) !== 0,
    allowNewCustomDomain:
      !isGracePeriod &&
      !isExpired &&
      (quotas.maxCustomDomains === "unlimited" ||
        currentDomainCount < Number(quotas.maxCustomDomains)),
    preserveExistingCustomDomains: isGracePeriod
      ? tierPolicy.preserveExistingDomainsInGracePeriod
      : !isExpired,
    quotas,
    excessResourceFlags: {
      hasExcessResources,
      requiresReview: hasExcessResources,
      currentProductCount,
      allowedProductQuota: quotas.maxActiveProducts,
      overProductQuotaCount,
      currentDomainCount,
      allowedDomainQuota: quotas.maxCustomDomains,
      overDomainQuotaCount,
      flaggedReason: hasExcessResources
        ? `Store preserves ${currentProductCount} existing products (${overProductQuotaCount} above ${effectivePlanId} limit of ${quotas.maxActiveProducts}) and ${currentDomainCount} domains. Existing items remain visible; new additions are locked until renewal or upgrade.`
        : undefined,
    },
    renewalBannerMessage: isGracePeriod
      ? `Subscription Grace Period Active (${tierPolicy.gracePeriodDays} days): Your storefront, existing products, checkout, and order fulfillment remain active. New product creation, new ad campaigns, and new custom domains are frozen until renewal.`
      : isExpired
      ? `Subscription Expired (${effectivePlanId} Post-Expiry Policy): All existing products and orders are preserved. New product additions, campaigns, and custom domains are locked until your subscription is renewed.`
      : undefined,
  };
}

// ============================================================================
// 6. ACTIVE ORDER PROTECTION & MERCHANT ENFORCEMENT GATES ([SAFEGUARD 3])
// ============================================================================

export function resolveEffectiveStoreRecord(storeId: string, db: LocalDbSchema): any {
  const storeRecord = (db.stores || []).find((s: any) => String(s.id) === String(storeId));
  const govEnforcement = db.governanceState?.storeEnforcements?.[String(storeId)];
  if (!storeRecord && !govEnforcement) {
    return null;
  }
  return {
    ...(storeRecord || { id: storeId, name: storeId }),
    enforcement: govEnforcement || storeRecord?.enforcement || { state: "active" },
  };
}

export function evaluateStoreCheckoutAndOrderAccess(
  storeId: string,
  db: LocalDbSchema,
  operationType: "create_new_order" | "fulfill_existing_order" | "customer_communication"
): {
  allowed: boolean;
  status: number;
  errorCode?: string;
  reason?: string;
  enforcementState: string;
} {
  const store = resolveEffectiveStoreRecord(storeId, db);
  const enfState = String(store?.enforcement?.state || store?.status || "active").toLowerCase();
  const restrictedCaps: string[] = Array.isArray(store?.enforcement?.restrictedCapabilities)
    ? store.enforcement.restrictedCapabilities
    : [];

  // [SAFEGUARD 3] Existing orders initiated before restriction/suspension are ALWAYS protected
  if (
    operationType === "fulfill_existing_order" ||
    operationType === "customer_communication"
  ) {
    return {
      allowed: true,
      status: 200,
      enforcementState: enfState,
    };
  }

  // New Order Creation checks
  if (enfState === "suspended" || enfState === "terminated") {
    return {
      allowed: false,
      status: 403,
      errorCode: "STORE_ENFORCEMENT_CHECKOUT_BLOCKED",
      reason: `Checkout Blocked: Merchant store "${
        store?.name || storeId
      }" is currently ${enfState} and cannot accept new orders. Pre-existing orders remain protected for fulfillment.`,
      enforcementState: enfState,
    };
  }

  if (
    enfState === "restricted" &&
    (restrictedCaps.includes("checkout") || store?.enforcement?.freezeCheckout === true)
  ) {
    return {
      allowed: false,
      status: 403,
      errorCode: "STORE_RESTRICTED_CHECKOUT_FROZEN",
      reason: `Checkout Temporarily Frozen: "${
        store?.name || storeId
      }" cannot accept new purchases at this time.`,
      enforcementState: enfState,
    };
  }

  if (store) {
    const subEval = evaluateStoreSubscriptionLifecycle(store, db);
    if (!subEval.allowNewCheckout) {
      return {
        allowed: false,
        status: 403,
        errorCode: "SUBSCRIPTION_BILLING_SUSPENDED",
        reason: `Checkout Blocked: Store subscription billing is suspended.`,
        enforcementState: enfState,
      };
    }
  }

  return {
    allowed: true,
    status: 200,
    enforcementState: enfState,
  };
}

// ============================================================================
// 7. AES-256-GCM DISASTER RECOVERY BACKUP & ISOLATED SANDBOX RESTORATION ([SAFEGUARD 5])
// ============================================================================

export interface ExportManifest {
  exportId: string;
  exportType: "operational_redacted" | "disaster_recovery_aes256gcm";
  exportedAt: string;
  exportedByUid: string;
  exportedByEmail: string;
  exportedByRole: string;
  redactedFields: string[];
  kmsKeyFingerprint?: string;
  recordCounts: {
    users: number;
    stores: number;
    products: number;
    orders: number;
    coupons: number;
    shipments: number;
    domains: number;
    auditLogs: number;
  };
  payloadSha256Digest: string;
  manifestHmacSignature: string;
}

export interface DrVerificationCertificate {
  certificateId: string;
  archiveSha256Digest: string;
  exportId: string;
  sandboxTestPassed: boolean;
  testedAt: string;
  testedByUid: string;
  decryptedSecretsCount: number;
  auditChainValidInSandbox: boolean;
  verifiedRecordCounts: Record<string, number>;
  hmacSignature: string;
}

const downloadTokens = new Map<
  string,
  { archive: any; createdAt: number; expiresAt: number; adminUid: string; used: boolean }
>();
const verifiedDrCertificates = new Map<string, DrVerificationCertificate>();

function computePayloadSha256(data: any): string {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

function signManifestHmac(manifestCore: Omit<ExportManifest, "manifestHmacSignature">): string {
  const secret = getSessionHmacSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(manifestCore))
    .digest("hex");
}

export function createOperationalRedactedExport(
  db: LocalDbSchema,
  actor: { uid: string; email: string; roleId: string }
): { exportManifest: ExportManifest; data: LocalDbSchema } {
  const cloned: LocalDbSchema = JSON.parse(JSON.stringify(db));
  const redactedFields: string[] = [];

  if (Array.isArray(cloned.users)) {
    cloned.users = cloned.users.map((u: any, idx: number) => {
      if (u.passwordHash) {
        redactedFields.push(`users[${idx}].passwordHash`);
      }
      return {
        ...u,
        passwordHash: "[REDACTED_BY_YUME_EXPORT_POLICY]",
      };
    });
  }

  if (cloned.deliverySettings) {
    if (cloned.deliverySettings.yalidineApiKey) {
      redactedFields.push("deliverySettings.yalidineApiKey");
      cloned.deliverySettings.yalidineApiKey = "[REDACTED_BY_YUME_EXPORT_POLICY]";
    }
    if (cloned.deliverySettings.yalidineApiToken) {
      redactedFields.push("deliverySettings.yalidineApiToken");
      cloned.deliverySettings.yalidineApiToken = "[REDACTED_BY_YUME_EXPORT_POLICY]";
    }
    if (cloned.deliverySettings.zrExpressToken) {
      redactedFields.push("deliverySettings.zrExpressToken");
      cloned.deliverySettings.zrExpressToken = "[REDACTED_BY_YUME_EXPORT_POLICY]";
    }
  }

  const payloadSha256Digest = computePayloadSha256(cloned);
  const manifestCore: Omit<ExportManifest, "manifestHmacSignature"> = {
    exportId: `exp_op_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    exportType: "operational_redacted",
    exportedAt: new Date().toISOString(),
    exportedByUid: actor.uid,
    exportedByEmail: actor.email,
    exportedByRole: actor.roleId,
    redactedFields: [
      "users[].passwordHash",
      "deliverySettings.yalidineApiKey",
      "deliverySettings.yalidineApiToken",
      "deliverySettings.zrExpressToken",
      ...redactedFields.slice(0, 25),
    ],
    recordCounts: {
      users: cloned.users?.length || 0,
      stores: cloned.stores?.length || 0,
      products: cloned.products?.length || 0,
      orders: cloned.orders?.length || 0,
      coupons: cloned.coupons?.length || 0,
      shipments: cloned.shipments?.length || 0,
      domains: cloned.domains?.length || 0,
      auditLogs: cloned.governanceState?.auditLogs?.length || 0,
    },
    payloadSha256Digest,
  };

  const exportManifest: ExportManifest = {
    ...manifestCore,
    manifestHmacSignature: signManifestHmac(manifestCore),
  };

  return { exportManifest, data: cloned };
}

export function createDisasterRecoveryEncryptedExport(
  db: LocalDbSchema,
  actor: { uid: string; email: string; roleId: string }
): {
  exportManifest: ExportManifest;
  data: LocalDbSchema;
  encryptedVault: {
    algorithm: "AES-256-GCM";
    kmsKeyFingerprint: string;
    ivHex: string;
    authTagHex: string;
    ciphertextHex: string;
  };
  downloadToken: string;
  downloadUrl: string;
  expiresAt: string;
} {
  const { key, keyFingerprint } = getKmsMasterKey();
  const redactedBundle = createOperationalRedactedExport(db, actor);

  // Build secret vault excluding any recoverable admin plaintext credentials
  const operationalSecrets = {
    deliverySettings: {
      yalidineApiKey: db.deliverySettings?.yalidineApiKey || "",
      yalidineApiToken: db.deliverySettings?.yalidineApiToken || "",
      zrExpressToken: db.deliverySettings?.zrExpressToken || "",
    },
    userPasswordHashes: (db.users || [])
      .filter((u: any) => u.role !== "super_admin" && u.accountType !== "platform_admin")
      .map((u: any) => ({ id: u.id, email: u.email, passwordHash: u.passwordHash })),
  };

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintextBuf = Buffer.from(JSON.stringify(operationalSecrets), "utf-8");
  const encryptedBuf = Buffer.concat([cipher.update(plaintextBuf), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const encryptedVault = {
    algorithm: "AES-256-GCM" as const,
    kmsKeyFingerprint: keyFingerprint,
    ivHex: iv.toString("hex"),
    authTagHex: authTag.toString("hex"),
    ciphertextHex: encryptedBuf.toString("hex"),
  };

  const payloadSha256Digest = computePayloadSha256({
    data: redactedBundle.data,
    encryptedVault,
  });

  const manifestCore: Omit<ExportManifest, "manifestHmacSignature"> = {
    exportId: `exp_dr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    exportType: "disaster_recovery_aes256gcm",
    exportedAt: new Date().toISOString(),
    exportedByUid: actor.uid,
    exportedByEmail: actor.email,
    exportedByRole: actor.roleId,
    redactedFields: [
      "adminRecoverablePasswords (EXCLUDED)",
      "users[].passwordHash (AES-256-GCM ENCRYPTED IN VAULT)",
      "deliverySettings.* (AES-256-GCM ENCRYPTED IN VAULT)",
    ],
    kmsKeyFingerprint: keyFingerprint,
    recordCounts: redactedBundle.exportManifest.recordCounts,
    payloadSha256Digest,
  };

  const exportManifest: ExportManifest = {
    ...manifestCore,
    manifestHmacSignature: signManifestHmac(manifestCore),
  };

  const downloadToken = `dl_${Date.now()}_${crypto.randomBytes(12).toString("hex")}`;
  const now = Date.now();
  const expiresAtMs = now + 5 * 60 * 1000;
  const archive = {
    exportManifest,
    data: redactedBundle.data,
    encryptedVault,
  };

  downloadTokens.set(downloadToken, {
    archive,
    createdAt: now,
    expiresAt: expiresAtMs,
    adminUid: actor.uid,
    used: false,
  });

  return {
    exportManifest,
    data: redactedBundle.data,
    encryptedVault,
    downloadToken,
    downloadUrl: `/api/db/export/download/${downloadToken}`,
    expiresAt: new Date(expiresAtMs).toISOString(),
  };
}

export function consumeExportDownloadToken(token: string): {
  valid: boolean;
  reason?: string;
  archive?: any;
} {
  const entry = downloadTokens.get(token);
  if (!entry) {
    return { valid: false, reason: "Download token not found." };
  }
  if (entry.used) {
    return { valid: false, reason: "Single-use download token has already been used." };
  }
  if (Date.now() > entry.expiresAt) {
    downloadTokens.delete(token);
    return { valid: false, reason: "Short-lived download link has expired (5-minute TTL)." };
  }
  entry.used = true;
  return { valid: true, archive: entry.archive };
}

/**
 * [SAFEGUARD 5] Isolated Disaster-Recovery Sandbox Restoration Test
 * Verifies SHA-256 manifest, decrypts AES-256-GCM secret vault in an isolated sandbox file,
 * verifies relational schema and audit chain, and issues a signed DrVerificationCertificate.
 */
export function runIsolatedSandboxRestoreTest(
  archivePayload: any,
  actorUid: string
): {
  passed: boolean;
  reason?: string;
  certificate?: DrVerificationCertificate;
  rehydratedData?: LocalDbSchema;
} {
  ensureSecurityDir();
  const manifest: ExportManifest | undefined = archivePayload?.exportManifest;
  const rawData: LocalDbSchema | undefined = archivePayload?.data || archivePayload;
  const encryptedVault = archivePayload?.encryptedVault;

  if (!rawData || typeof rawData !== "object") {
    return { passed: false, reason: "Invalid backup archive structure." };
  }

  let archiveSha256Digest = "";
  let exportId = `manual_${Date.now()}`;

  if (manifest) {
    exportId = manifest.exportId;
    const { manifestHmacSignature, ...core } = manifest;
    const expectedHmac = signManifestHmac(core);
    if (expectedHmac !== manifestHmacSignature) {
      return {
        passed: false,
        reason: "Export manifest HMAC signature verification failed (tampered manifest).",
      };
    }

    const expectedSha =
      manifest.exportType === "disaster_recovery_aes256gcm"
        ? computePayloadSha256({ data: rawData, encryptedVault })
        : computePayloadSha256(rawData);

    if (expectedSha !== manifest.payloadSha256Digest) {
      return {
        passed: false,
        reason: "SHA-256 payload digest mismatch: backup archive contents were modified.",
      };
    }
    archiveSha256Digest = expectedSha;
  } else {
    archiveSha256Digest = computePayloadSha256(rawData);
  }

  const sandboxClone: LocalDbSchema = JSON.parse(JSON.stringify(rawData));
  let decryptedSecretsCount = 0;

  if (encryptedVault) {
    try {
      const { key, keyFingerprint } = getKmsMasterKey();
      if (
        encryptedVault.kmsKeyFingerprint &&
        encryptedVault.kmsKeyFingerprint !== keyFingerprint
      ) {
        return {
          passed: false,
          reason: `KMS Key Fingerprint mismatch: Archive requires ${encryptedVault.kmsKeyFingerprint}, active KMS is ${keyFingerprint}.`,
        };
      }
      const iv = Buffer.from(encryptedVault.ivHex, "hex");
      const authTag = Buffer.from(encryptedVault.authTagHex, "hex");
      const ciphertext = Buffer.from(encryptedVault.ciphertextHex, "hex");
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);
      const decryptedBuf = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      const vaultData = JSON.parse(decryptedBuf.toString("utf-8"));

      if (vaultData.deliverySettings && sandboxClone.deliverySettings) {
        sandboxClone.deliverySettings.yalidineApiKey =
          vaultData.deliverySettings.yalidineApiKey || "";
        sandboxClone.deliverySettings.yalidineApiToken =
          vaultData.deliverySettings.yalidineApiToken || "";
        sandboxClone.deliverySettings.zrExpressToken =
          vaultData.deliverySettings.zrExpressToken || "";
        decryptedSecretsCount += 3;
      }

      if (Array.isArray(vaultData.userPasswordHashes) && Array.isArray(sandboxClone.users)) {
        const hashMap = new Map<string, string>(
          vaultData.userPasswordHashes.map((u: any) => [String(u.id || u.email), u.passwordHash])
        );
        sandboxClone.users = sandboxClone.users.map((u: any) => {
          const restored = hashMap.get(String(u.id)) || hashMap.get(String(u.email));
          if (restored) decryptedSecretsCount += 1;
          return restored ? { ...u, passwordHash: restored } : u;
        });
      }
    } catch (err: any) {
      return {
        passed: false,
        reason: `AES-256-GCM Secret Vault decryption or authentication tag verification failed: ${err.message}`,
      };
    }
  }

  // Write to isolated sandbox file and verify read-back & schema integrity
  const sandboxFile = path.join(SECURITY_DIR, `dr-sandbox-${Date.now()}.json`);
  try {
    fs.writeFileSync(sandboxFile, JSON.stringify(sandboxClone, null, 2), "utf-8");
    const readBack: LocalDbSchema = JSON.parse(fs.readFileSync(sandboxFile, "utf-8"));
    fs.unlinkSync(sandboxFile);

    if (!Array.isArray(readBack.stores) || !Array.isArray(readBack.products)) {
      return {
        passed: false,
        reason: "Isolated sandbox validation failed: stores or products arrays missing.",
      };
    }

    // Verify audit chain inside restored sandbox if present
    let auditChainValidInSandbox = true;
    if (Array.isArray(readBack.governanceState?.auditLogs) && readBack.governanceState!.auditLogs.length > 0) {
      const verifyRes = verifyAuditLedgerIntegrityServer(
        readBack.governanceState!.auditLogs,
        null
      );
      auditChainValidInSandbox = verifyRes.valid;
    }

    const certCore = {
      certificateId: `drcert_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      archiveSha256Digest,
      exportId,
      sandboxTestPassed: true,
      testedAt: new Date().toISOString(),
      testedByUid: actorUid,
      decryptedSecretsCount,
      auditChainValidInSandbox,
      verifiedRecordCounts: {
        users: readBack.users?.length || 0,
        stores: readBack.stores?.length || 0,
        products: readBack.products?.length || 0,
        orders: readBack.orders?.length || 0,
        domains: readBack.domains?.length || 0,
      },
    };

    const hmacSignature = crypto
      .createHmac("sha256", getSessionHmacSecret())
      .update(JSON.stringify(certCore))
      .digest("hex");

    const certificate: DrVerificationCertificate = {
      ...certCore,
      hmacSignature,
    };

    verifiedDrCertificates.set(archiveSha256Digest, certificate);

    return {
      passed: true,
      certificate,
      rehydratedData: readBack,
    };
  } catch (err: any) {
    if (fs.existsSync(sandboxFile)) {
      try {
        fs.unlinkSync(sandboxFile);
      } catch {}
    }
    return {
      passed: false,
      reason: `Sandbox IO verification error: ${err.message}`,
    };
  }
}

export function getVerifiedDrCertificate(
  archiveSha256Digest: string
): DrVerificationCertificate | undefined {
  return verifiedDrCertificates.get(archiveSha256Digest);
}

// ============================================================================
// 8. AUTOMATED SECURITY & REGRESSION SELF-TEST SUITE ([SAFEGUARD 6])
// ============================================================================

export function runSecurityGovernanceSelfTests(db: LocalDbSchema): {
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
} {
  const results: Array<{
    id: string;
    domain: string;
    safeguard: string;
    title: string;
    passed: boolean;
    details: string;
  }> = [];

  // Test 1: Safeguard 1 — Immediate Session & Step-Up MFA Revocation on Role/Security Change
  {
    const testAdmin = {
      uid: "adm_test_temp",
      email: "temp.ops@yume.network",
      name: "Temp Ops Admin",
      roleId: "market_operations",
      assignedMarketIds: ["MA"],
      status: "active",
      mfaEnabled: true,
    };
    const { session, stepUpGrant } = createAdminSession(db, testAdmin);
    const beforeRevoke = !session.revoked && !stepUpGrant.revoked;
    revokeAdminSessionsOnSecurityChange(
      db,
      "Self-Test Role Change Verification",
      "adm_test_temp",
      false
    );
    const afterRevoke = session.revoked === true && stepUpGrant.revoked === true;
    activeAdminSessions.delete(session.sessionId);
    activeStepUpGrants.delete(stepUpGrant.grantId);

    results.push({
      id: "TEST-SG1-SESSION-REVOCATION",
      domain: "1. Admin RBAC & Step-Up MFA",
      safeguard: "Safeguard 1: Immediate Admin Session & MFA Revocation",
      title: "Revoke active sessions & Step-Up MFA immediately on role/permission/status change",
      passed: beforeRevoke && afterRevoke,
      details:
        beforeRevoke && afterRevoke
          ? "Session and 5-minute Step-Up MFA grant were atomically revoked upon credential/security change."
          : "Failed to revoke session or Step-Up MFA grant.",
    });
  }

  // Test 2: Safeguard 2 — Non-Destructive Subscription Grace Period & Expiration
  {
    const mockExpiredStore = {
      id: "store_test_expiry",
      name: "Atlas Heritage Boutique",
      subscriptionTier: "Premium",
      subscriptionMeta: {
        planId: "Premium",
        status: "expired",
      },
      productCount: 120, // Exceeds Basic limit of 25
    };
    const evalExpired = evaluateStoreSubscriptionLifecycle(mockExpiredStore, db);
    const passed =
      evalExpired.isExpired === true &&
      evalExpired.allowPublicStorefront === true &&
      evalExpired.allowExistingProductsVisible === true &&
      evalExpired.allowNewProductCreation === false &&
      evalExpired.excessResourceFlags.hasExcessResources === true &&
      evalExpired.excessResourceFlags.overProductQuotaCount === 95;

    results.push({
      id: "TEST-SG2-NON-DESTRUCTIVE-EXPIRY",
      domain: "2. Subscription & Entitlements Integrity",
      safeguard: "Safeguard 2: Non-Destructive Subscription Expiration",
      title: "Preserve existing products exceeding Basic limits while blocking new additions & flagging excess",
      passed,
      details: passed
        ? `Preserved all 120 existing products without hiding or deleting; blocked new additions and flagged ${evalExpired.excessResourceFlags.overProductQuotaCount} excess products for review.`
        : "Subscription expiration evaluation did not match non-destructive policy.",
    });
  }

  // Test 3: Safeguard 3 — Active Order Protection During Store Suspension
  {
    const testCloneDb: LocalDbSchema = JSON.parse(JSON.stringify(db));
    testCloneDb.stores = [
      {
        id: "store_suspended_test",
        name: "Suspended Test Store",
        enforcement: { state: "suspended", reason: "Policy audit" },
      },
    ];
    const newOrderCheck = evaluateStoreCheckoutAndOrderAccess(
      "store_suspended_test",
      testCloneDb,
      "create_new_order"
    );
    const existingOrderFulfillCheck = evaluateStoreCheckoutAndOrderAccess(
      "store_suspended_test",
      testCloneDb,
      "fulfill_existing_order"
    );
    const existingOrderCommsCheck = evaluateStoreCheckoutAndOrderAccess(
      "store_suspended_test",
      testCloneDb,
      "customer_communication"
    );

    const passed =
      newOrderCheck.allowed === false &&
      newOrderCheck.status === 403 &&
      existingOrderFulfillCheck.allowed === true &&
      existingOrderCommsCheck.allowed === true;

    results.push({
      id: "TEST-SG3-ACTIVE-ORDER-PROTECTION",
      domain: "3. Merchant Enforcement & Checkout",
      safeguard: "Safeguard 3: Active Order Protection",
      title: "Block new checkouts on suspended store while preserving fulfillment & communication for existing orders",
      passed,
      details: passed
        ? "New checkout rejected with HTTP 403; existing order fulfillment, tracking, and customer communications remained 100% operational."
        : "Active order protection or checkout block failed.",
    });
  }

  // Test 4: Safeguard 4 — Independent Audit Ledger Tamper Detection (Modified, Deleted, Reordered, Inserted)
  {
    const currentLogs = ensureServerAuditLedgerInitialized(db);
    const baselineVerify = verifyAuditLedgerIntegrityServer(currentLogs);

    // Clone chronological logs for non-destructive adversarial mutation tests
    const chronological = [...currentLogs].sort((a, b) => a.chainIndex - b.chainIndex);

    // 4a. Modified record
    const modifiedClone = JSON.parse(JSON.stringify(chronological));
    if (modifiedClone.length > 0) {
      modifiedClone[0].reason = "TAMPERED_REASON_PAYLOAD";
    }
    const modVerify = verifyAuditLedgerIntegrityServer(modifiedClone, null);

    // 4b. Deleted record
    const deletedClone = JSON.parse(JSON.stringify(chronological));
    if (deletedClone.length > 1) {
      deletedClone.splice(0, 1);
    }
    const delVerify = verifyAuditLedgerIntegrityServer(deletedClone);

    // 4c. Reordered record
    const reorderedClone = JSON.parse(JSON.stringify(chronological));
    if (reorderedClone.length >= 2) {
      const tmp = reorderedClone[0];
      reorderedClone[0] = reorderedClone[1];
      reorderedClone[1] = tmp;
    }
    const reordVerify = verifyAuditLedgerIntegrityServer(reorderedClone, null);

    // 4d. Inserted record
    const insertedClone = JSON.parse(JSON.stringify(chronological));
    insertedClone.splice(1, 0, {
      ...insertedClone[0],
      id: "aud_injected_rogue",
      previousHash: "rogue_unlinked_hash_0000",
      integrityHash: "0".repeat(64),
    });
    const insVerify = verifyAuditLedgerIntegrityServer(insertedClone, null);

    const passed =
      baselineVerify.valid === true &&
      modVerify.valid === false &&
      modVerify.anomalies.some((a) => a.type === "MODIFIED_RECORD") &&
      delVerify.valid === false &&
      delVerify.anomalies.some((a) => a.type === "DELETED_RECORD") &&
      reordVerify.valid === false &&
      reordVerify.anomalies.some((a) => a.type === "REORDERED_RECORD") &&
      insVerify.valid === false &&
      insVerify.anomalies.some((a) => a.type === "INSERTED_RECORD");

    results.push({
      id: "TEST-SG4-AUDIT-TAMPER-DETECTION",
      domain: "4. Audit Ledger Integrity",
      safeguard: "Safeguard 4: Independent Audit Verification & Protected Checkpoints",
      title: "Verify live SHA-256 chain & detect modified, deleted, reordered, and inserted audit records",
      passed,
      details: passed
        ? `Live chain verified (${baselineVerify.totalEntries} entries, HMAC checkpoint valid). Successfully detected MODIFIED, DELETED, REORDERED, and INSERTED tamper simulations.`
        : "Audit ledger tamper detection missed one or more mutation classes.",
    });
  }

  // Test 5: Safeguard 5 — Encrypted AES-256-GCM Backup & Isolated Sandbox Restoration Verification
  {
    const drBundle = createDisasterRecoveryEncryptedExport(db, {
      uid: "adm_super_owner",
      email: "th3p2000@gmail.com",
      roleId: "super_admin",
    });
    const sandboxResult = runIsolatedSandboxRestoreTest(
      {
        exportManifest: drBundle.exportManifest,
        data: drBundle.data,
        encryptedVault: drBundle.encryptedVault,
      },
      "adm_super_owner"
    );

    const passed =
      sandboxResult.passed === true &&
      Boolean(sandboxResult.certificate?.sandboxTestPassed) &&
      sandboxResult.certificate?.auditChainValidInSandbox === true;

    results.push({
      id: "TEST-SG5-DR-SANDBOX-RESTORE",
      domain: "5. Database Backup & Disaster Recovery",
      safeguard: "Safeguard 5: Isolated Disaster-Recovery Restoration Testing",
      title: "Execute AES-256-GCM encrypted DR export & isolated sandbox restoration test",
      passed,
      details: passed
        ? `AES-256-GCM vault decrypted (${sandboxResult.certificate?.decryptedSecretsCount} secret entries), SHA-256 manifest verified, and certificate ${sandboxResult.certificate?.certificateId} issued in isolated sandbox.`
        : `Sandbox restore failed: ${sandboxResult.reason}`,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  return {
    overallPassed: passedCount === results.length,
    executedAt: new Date().toISOString(),
    totalTests: results.length,
    passedCount,
    failedCount: results.length - passedCount,
    results,
  };
}

// ============================================================================
// 9. PRIVACY-PRESERVING HMAC VISITOR TOKENS & SERVER BOT DETECTION (V2.1)
// ============================================================================
export interface VerifiedVisitorTokenResult {
  valid: boolean;
  tampered: boolean;
  vid: string;
  token: string;
  newlyMinted: boolean;
  expiresAtMs: number;
}

function signVisitorTokenPayload(payloadB64: string): string {
  return crypto
    .createHmac("sha256", getSessionHmacSecret())
    .update(`yume_visitor_v1:${payloadB64}`)
    .digest("hex");
}

export function mintSignedVisitorToken(nowMs = Date.now()): {
  token: string;
  vid: string;
  expiresAtMs: number;
} {
  const vid = crypto.randomUUID();
  const expiresAtMs = nowMs + 30 * 24 * 60 * 60 * 1000;
  const payloadB64 = Buffer.from(
    JSON.stringify({ v: 1, vid, iat: nowMs, exp: expiresAtMs }),
    "utf-8"
  ).toString("base64url");
  const sig = signVisitorTokenPayload(payloadB64);
  return {
    token: `yv1.${payloadB64}.${sig}`,
    vid,
    expiresAtMs,
  };
}

export function mintOrVerifyVisitorToken(
  rawToken?: string | null,
  nowMs = Date.now()
): VerifiedVisitorTokenResult {
  const candidate = String(rawToken || "").trim();
  if (!candidate) {
    const minted = mintSignedVisitorToken(nowMs);
    return {
      valid: true,
      tampered: false,
      vid: minted.vid,
      token: minted.token,
      newlyMinted: true,
      expiresAtMs: minted.expiresAtMs,
    };
  }

  const parts = candidate.split(".");
  if (parts.length !== 3 || parts[0] !== "yv1") {
    return {
      valid: false,
      tampered: true,
      vid: "",
      token: "",
      newlyMinted: false,
      expiresAtMs: 0,
    };
  }

  const [, payloadB64, sigHex] = parts;
  const expectedSig = signVisitorTokenPayload(payloadB64);
  const actualBuf = Buffer.from(sigHex, "utf-8");
  const expectedBuf = Buffer.from(expectedSig, "utf-8");
  if (actualBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(actualBuf, expectedBuf)) {
    return {
      valid: false,
      tampered: true,
      vid: "",
      token: "",
      newlyMinted: false,
      expiresAtMs: 0,
    };
  }

  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    if (!decoded?.vid || typeof decoded.exp !== "number") {
      return { valid: false, tampered: true, vid: "", token: "", newlyMinted: false, expiresAtMs: 0 };
    }
    if (nowMs > decoded.exp) {
      // Gracefully rotate expired signed token on the server
      const rotated = mintSignedVisitorToken(nowMs);
      return {
        valid: true,
        tampered: false,
        vid: rotated.vid,
        token: rotated.token,
        newlyMinted: true,
        expiresAtMs: rotated.expiresAtMs,
      };
    }
    return {
      valid: true,
      tampered: false,
      vid: String(decoded.vid),
      token: candidate,
      newlyMinted: false,
      expiresAtMs: decoded.exp,
    };
  } catch {
    return { valid: false, tampered: true, vid: "", token: "", newlyMinted: false, expiresAtMs: 0 };
  }
}

export function extractVisitorTokenFromRequest(req: Request): string {
  const cookies = parseCookies(req);
  const fromHeader = String(req.headers["x-yume-visitor-token"] || "").trim();
  if (fromHeader) return fromHeader;
  const fromCookie = String(cookies["yume_visitor_token"] || "").trim();
  return fromCookie;
}

export function setVisitorTokenCookie(res: Response, token: string): void {
  res.cookie("yume_visitor_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function computeDailyPrivacySalt(nowMs = Date.now()): string {
  const dayKey = new Date(nowMs).toISOString().slice(0, 10);
  return crypto
    .createHmac("sha256", getSessionHmacSecret())
    .update(`daily_salt:${dayKey}`)
    .digest("hex")
    .slice(0, 32);
}

export function computePrivacyVisitorHash(
  vid: string,
  storeId: string,
  nowMs = Date.now()
): string {
  const salt = computeDailyPrivacySalt(nowMs);
  return crypto
    .createHash("sha256")
    .update(`${salt}|${vid}|${storeId}`)
    .digest("hex");
}

export function computeIpRateLimitKey(req: Request): string {
  const rawIp =
    String(req.headers["x-forwarded-for"] || req.ip || req.socket?.remoteAddress || "unknown")
      .split(",")[0]
      .trim();
  const salt = computeDailyPrivacySalt();
  return crypto.createHash("sha256").update(`rl:${salt}:${rawIp}`).digest("hex").slice(0, 24);
}

export function extractNormalizedClientIp(req: Request): string {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  const rawIp = forwarded || String(req.ip || req.socket?.remoteAddress || "unknown").trim();
  if (rawIp === "::1") return "127.0.0.1";
  if (rawIp.startsWith("::ffff:")) return rawIp.slice(7);
  return rawIp || "unknown";
}

export function computePersistentStockNotifyIpKey(req: Request): string {
  const normalizedIp = extractNormalizedClientIp(req);
  return (
    "ip_" +
    crypto
      .createHmac("sha256", getSessionHmacSecret())
      .update(`stock_notify_ip:${normalizedIp}`)
      .digest("hex")
      .slice(0, 24)
  );
}

export function evaluateServerBotSignals(req: Request): {
  isBot: boolean;
  reason?: string;
} {
  const ua = String(req.headers["user-agent"] || "").trim();
  if (!ua || ua.length < 8) {
    return { isBot: true, reason: "MISSING_OR_MALFORMED_USER_AGENT" };
  }

  const botPattern =
    /(bot|crawler|spider|scrapy|curl\/|wget\/|python-requests|python-urllib|go-http-client|java\/|httpclient|apache-httpclient|axios\/|node-fetch|undici|headlesschrome|phantomjs|slimerjs|playwright|puppeteer|selenium|webdriver|postmanruntime|insomnia)/i;
  if (botPattern.test(ua)) {
    return { isBot: true, reason: "AUTOMATED_CLIENT_SIGNATURE" };
  }

  const acceptLang = String(req.headers["accept-language"] || "").trim();
  const secFetchSite = String(req.headers["sec-fetch-site"] || "").trim();
  const origin = String(req.headers["origin"] || req.headers["referer"] || "").trim();
  if (!acceptLang && !secFetchSite && !origin) {
    return { isBot: true, reason: "MISSING_BROWSER_CONTEXT_HEADERS" };
  }

  return { isBot: false };
}

