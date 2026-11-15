import crypto from "crypto";
import {
  LocalDbSchema,
  ServerStoreAnalyticsEvent,
  withSerializedTransaction,
} from "./localDb";
import {
  assertWritableClusterLease,
  executeIdempotentMutation,
  getPostgresPool,
  IdempotentResult,
} from "./db/transactionalRepository";
import {
  appendServerAuditLog,
  computePrivacyVisitorHash,
  ServerAdminSession,
} from "./securityGovernance";

// ============================================================================
// 1. KYC PII REDACTION & SAFE STORE PROJECTION (STRICT RBAC SEPARATION)
// ============================================================================
export function redactStoreKycForRole<T extends Record<string, any>>(
  store: T,
  canReadKycPii: boolean
): T {
  if (!store || canReadKycPii) {
    return store;
  }
  const cloned = { ...store } as any;
  if (cloned.kycIdentity && typeof cloned.kycIdentity === "object") {
    cloned.kycIdentity = {
      status: cloned.kycIdentity.status || "not_submitted",
      documentType: cloned.kycIdentity.documentType || undefined,
      submittedAt: cloned.kycIdentity.submittedAt || undefined,
      reviewedAt: cloned.kycIdentity.reviewedAt || undefined,
      redactedByRbac: true,
    };
  }
  if ("verificationDocName" in cloned && cloned.verificationDocName) {
    cloned.verificationDocName = "[REDACTED — requires stores:kyc_pii_read]";
  }
  if ("merchantFirstName" in cloned) {
    cloned.merchantFirstName = cloned.merchantFirstName ? "[REDACTED]" : undefined;
  }
  if ("merchantLastName" in cloned) {
    cloned.merchantLastName = cloned.merchantLastName ? "[REDACTED]" : undefined;
  }
  return cloned as T;
}

// ============================================================================
// 2. STOREFRONT ANALYTICS INGESTION (DEDUP + TENANT OWNERSHIP + ZERO PII)
// ============================================================================
export interface IngestAnalyticsParams {
  eventType: "visit" | "product_click";
  storeId: string;
  productId?: string | null;
  vid: string;
  nowMs?: number;
}

export async function ingestStoreAnalyticsEventTransactional(
  params: IngestAnalyticsParams
): Promise<{
  ok: boolean;
  httpStatus: number;
  code?: string;
  error?: string;
  deduplicated?: boolean;
  event?: ServerStoreAnalyticsEvent;
}> {
  const nowMs = params.nowMs ?? Date.now();
  const storeId = String(params.storeId || "").trim();
  const productId = params.productId ? String(params.productId).trim() : null;
  const eventType = params.eventType;

  if (!storeId) {
    return {
      ok: false,
      httpStatus: 400,
      code: "MISSING_STORE_ID",
      error: "storeId is required for analytics event.",
    };
  }

  if (eventType !== "visit" && eventType !== "product_click") {
    return {
      ok: false,
      httpStatus: 400,
      code: "INVALID_EVENT_TYPE",
      error: "eventType must be 'visit' or 'product_click'.",
    };
  }

  if (eventType === "product_click" && !productId) {
    return {
      ok: false,
      httpStatus: 400,
      code: "MISSING_PRODUCT_ID",
      error: "productId is required for product_click events.",
    };
  }

  return await withSerializedTransaction(async (db) => {
    const store = (db.stores || []).find((s: any) => String(s.id) === storeId);
    if (store) {
      if (store.archived === true) {
        return {
          commit: false,
          result: {
            ok: false,
            httpStatus: 409,
            code: "STORE_ARCHIVED",
            error: "Cannot record storefront telemetry for an archived store.",
          },
        };
      }
      const enfState = String(store.enforcement?.state || "active");
      if (enfState === "terminated") {
        return {
          commit: false,
          result: {
            ok: false,
            httpStatus: 403,
            code: "STORE_TERMINATED",
            error: "Store is terminated.",
          },
        };
      }
    } else if (process.env.YUME_STRICT_STORE_REGISTRY === "1") {
      return {
        commit: false,
        result: {
          ok: false,
          httpStatus: 404,
          code: "STORE_NOT_FOUND",
          error: `Store "${storeId}" does not exist.`,
        },
      };
    }

    if (eventType === "product_click" && productId) {
      // Check ownership against store.products first, then global db.products & other stores' embedded catalogs
      const inStoreProducts = Array.isArray(store?.products)
        ? store.products.some((p: any) => String(p.id) === productId)
        : false;
      const dbProduct = (db.products || []).find((p: any) => String(p.id) === productId);
      const otherStoreOwner = (db.stores || []).find(
        (s: any) =>
          String(s.id) !== storeId &&
          Array.isArray(s.products) &&
          s.products.some((p: any) => String(p.id) === productId)
      );

      if (!inStoreProducts) {
        if ((dbProduct && String(dbProduct.storeId) !== storeId) || otherStoreOwner) {
          return {
            commit: false,
            result: {
              ok: false,
              httpStatus: 403,
              code: "PRODUCT_STORE_OWNERSHIP_MISMATCH",
              error: `Product "${productId}" does not belong to store "${storeId}".`,
            },
          };
        }
        if (store && Array.isArray(store.products) && store.products.length > 0 && !dbProduct) {
          return {
            commit: false,
            result: {
              ok: false,
              httpStatus: 400,
              code: "PRODUCT_NOT_FOUND_IN_STORE",
              error: `Product "${productId}" was not found under store "${storeId}".`,
            },
          };
        }
      }
    }

    const visitorHash = computePrivacyVisitorHash(params.vid, storeId, nowMs);
    // Visit: 30-minute session bucket per (storeId, visitorHash)
    // Product Click: 15-second burst bucket per (storeId, productId, visitorHash)
    const sessionBucket = Math.floor(nowMs / (30 * 60 * 1000));
    const clickBucket = Math.floor(nowMs / (15 * 1000));

    const dedupRaw =
      eventType === "visit"
        ? `visit|${storeId}|${visitorHash}|${sessionBucket}`
        : `click|${storeId}|${productId}|${visitorHash}|${clickBucket}`;
    const dedupKey = crypto.createHash("sha256").update(dedupRaw).digest("hex");

    db.analyticsEvents = db.analyticsEvents || [];
    const existing = db.analyticsEvents.find((e) => e.dedupKey === dedupKey);
    if (existing) {
      return {
        commit: false,
        result: {
          ok: true,
          httpStatus: 200,
          deduplicated: true,
          event: existing,
        },
      };
    }

    const event: ServerStoreAnalyticsEvent = {
      eventId: `evt_${crypto.randomUUID()}`,
      storeId,
      productId: eventType === "product_click" ? productId : null,
      eventType,
      visitorHash,
      sessionBucket,
      dedupKey,
      occurredAt: new Date(nowMs).toISOString(),
    };

    db.analyticsEvents.push(event);
    // Keep sliding retention window capped cleanly in dev store
    if (db.analyticsEvents.length > 100_000) {
      db.analyticsEvents = db.analyticsEvents.slice(-80_000);
    }

    return {
      commit: true,
      result: {
        ok: true,
        httpStatus: 201,
        deduplicated: false,
        event,
      },
    };
  });
}

// ============================================================================
// 3. SERVER ANALYTICS AGGREGATION FOR PLATFORM ADMIN STORES PERFORMANCE
// ============================================================================
export interface ServerStoreAnalyticsAggregate {
  storeId: string;
  visitors: number;
  uniqueVisitors: number;
  totalSessions: number;
  productClicks: number;
}

export async function queryAdminStoresPerformance(params: {
  db: LocalDbSchema;
  startUtcMs: number;
  endUtcMs: number;
  allowedMarketIds?: "ALL_MARKETS" | string[];
}): Promise<{
  byStore: Record<string, ServerStoreAnalyticsAggregate>;
  platformTrackingMatureDays: number;
  totalEventsInRange: number;
}> {
  // Production PG16 parity branch if active
  const pool = getPostgresPool();
  if (pool && process.env.DB_AUTHORITY === "postgres16") {
    try {
      const sqlRes = await pool.query(
        `
        SELECT
          store_id,
          COUNT(*) FILTER (WHERE event_type = 'visit')::int AS total_sessions,
          COUNT(DISTINCT visitor_hash) FILTER (WHERE event_type = 'visit')::int AS unique_visitors,
          COUNT(*) FILTER (WHERE event_type = 'product_click')::int AS product_clicks
        FROM store_analytics_events
        WHERE occurred_at >= to_timestamp($1 / 1000.0)
          AND occurred_at <= to_timestamp($2 / 1000.0)
        GROUP BY store_id
        `,
        [params.startUtcMs, params.endUtcMs]
      );
      const minRes = await pool.query(
        `SELECT EXTRACT(EPOCH FROM (NOW() - MIN(occurred_at))) / 86400.0 AS mature_days FROM store_analytics_events`
      );
      const byStore: Record<string, ServerStoreAnalyticsAggregate> = {};
      let totalEventsInRange = 0;
      for (const row of sqlRes.rows) {
        const uv = Number(row.unique_visitors) || 0;
        const ts = Number(row.total_sessions) || 0;
        const pc = Number(row.product_clicks) || 0;
        totalEventsInRange += ts + pc;
        byStore[String(row.store_id)] = {
          storeId: String(row.store_id),
          visitors: uv,
          uniqueVisitors: uv,
          totalSessions: ts,
          productClicks: pc,
        };
      }
      const matureDays = Math.max(0, Math.floor(Number(minRes.rows[0]?.mature_days) || 0));
      return { byStore, platformTrackingMatureDays: matureDays, totalEventsInRange };
    } catch {
      // Safe fallback to local repository state if PG pool is temporarily offline in dev
    }
  }

  const events = params.db.analyticsEvents || [];
  let earliestMs = Number.POSITIVE_INFINITY;
  const storeVisitorSets = new Map<string, Set<string>>();
  const storeSessions = new Map<string, number>();
  const storeClicks = new Map<string, number>();
  let totalEventsInRange = 0;

  for (const ev of events) {
    const ts = new Date(ev.occurredAt).getTime();
    if (!Number.isFinite(ts)) continue;
    if (ts < earliestMs) earliestMs = ts;
    if (ts < params.startUtcMs || ts > params.endUtcMs) continue;

    totalEventsInRange += 1;
    if (ev.eventType === "visit") {
      if (!storeVisitorSets.has(ev.storeId)) {
        storeVisitorSets.set(ev.storeId, new Set());
      }
      storeVisitorSets.get(ev.storeId)!.add(ev.visitorHash);
      storeSessions.set(ev.storeId, (storeSessions.get(ev.storeId) || 0) + 1);
    } else if (ev.eventType === "product_click") {
      storeClicks.set(ev.storeId, (storeClicks.get(ev.storeId) || 0) + 1);
    }
  }

  const allStoreIds = new Set<string>([
    ...storeVisitorSets.keys(),
    ...storeSessions.keys(),
    ...storeClicks.keys(),
  ]);

  const byStore: Record<string, ServerStoreAnalyticsAggregate> = {};
  for (const sid of allStoreIds) {
    const uniqueVisitors = storeVisitorSets.get(sid)?.size || 0;
    const totalSessions = storeSessions.get(sid) || 0;
    const productClicks = storeClicks.get(sid) || 0;
    byStore[sid] = {
      storeId: sid,
      visitors: uniqueVisitors,
      uniqueVisitors,
      totalSessions,
      productClicks,
    };
  }

  const platformTrackingMatureDays = Number.isFinite(earliestMs)
    ? Math.max(0, Math.floor((Date.now() - earliestMs) / (24 * 60 * 60 * 1000)))
    : 0;

  return { byStore, platformTrackingMatureDays, totalEventsInRange };
}

// ============================================================================
// 4. PROTECTED DEPENDENCY INSPECTION & SAFE STORE ARCHIVE / DELETE
// ============================================================================
export interface StoreDependencyCounts {
  orders: number;
  shipments: number;
  returns: number;
  inventoryLedger: number;
  shipmentLineItems: number;
  shipmentReturnEvents: number;
  merchantSubscriptions: number;
  totalProtected: number;
}

export function evaluateStoreDependenciesInDb(
  db: LocalDbSchema,
  storeId: string
): StoreDependencyCounts {
  const storeOrderIds = new Set(
    (db.orders || [])
      .filter((o: any) => String(o.storeId || "") === storeId)
      .map((o: any) => String(o.id))
  );
  const storeProductIds = new Set(
    (db.products || [])
      .filter((p: any) => String(p.storeId || "") === storeId)
      .map((p: any) => String(p.id))
  );

  const orders = storeOrderIds.size;
  const shipments = (db.shipments || []).filter(
    (s: any) =>
      String(s.storeId || "") === storeId ||
      (s.orderId && storeOrderIds.has(String(s.orderId)))
  ).length;
  const returns = (db.returns || []).filter(
    (r: any) =>
      String(r.storeId || "") === storeId ||
      (r.orderId && storeOrderIds.has(String(r.orderId)))
  ).length;
  const inventoryLedger = (db.inventoryLedger || []).filter(
    (m) =>
      (m.orderId && storeOrderIds.has(String(m.orderId))) ||
      (m.productId && storeProductIds.has(String(m.productId)))
  ).length;
  const shipmentLineItems = (db.shipmentLineItems || []).filter(
    (sli) => String(sli.storeId || "") === storeId || storeOrderIds.has(String(sli.orderId))
  ).length;
  const shipmentReturnEvents = (db.shipmentReturnEvents || []).filter(
    (ev) => String(ev.storeId || "") === storeId || storeOrderIds.has(String(ev.orderId))
  ).length;
  const merchantSubscriptions = db.subscriptionGovernance?.merchantSubscriptions?.[storeId]
    ? 1
    : 0;

  const totalProtected =
    orders +
    shipments +
    returns +
    inventoryLedger +
    shipmentLineItems +
    shipmentReturnEvents +
    merchantSubscriptions;

  return {
    orders,
    shipments,
    returns,
    inventoryLedger,
    shipmentLineItems,
    shipmentReturnEvents,
    merchantSubscriptions,
    totalProtected,
  };
}

export async function archiveOrDeleteStoreTransactional(params: {
  idempotencyKey?: string;
  storeId: string;
  mode: "archive" | "delete" | "auto";
  reason?: string;
  storeSnapshot?: Record<string, any>;
  session: ServerAdminSession;
}): Promise<IdempotentResult> {
  return await executeIdempotentMutation({
    idempotencyKey: params.idempotencyKey || "",
    endpointScope: `STORE_LIFECYCLE:${params.storeId}`,
    actorScope: params.session.adminUid,
    payloadForDigest: {
      storeId: params.storeId,
      mode: params.mode,
      reason: params.reason || "",
    },
    requireKey: false,
    executeDomainMutation: async (db) => {
      const leaseCheck = assertWritableClusterLease(db);
      if (!leaseCheck.allowed) {
        return {
          httpStatus: leaseCheck.httpStatus || 503,
          commit: false,
          body: { ok: false, code: leaseCheck.code, error: leaseCheck.error },
        };
      }

      db.stores = db.stores || [];
      const idx = db.stores.findIndex((s: any) => String(s.id) === params.storeId);
      let store = idx >= 0 ? db.stores[idx] : null;

      if (!store && params.storeSnapshot) {
        store = { ...params.storeSnapshot, id: params.storeId };
        db.stores.push(store);
      }

      if (!store) {
        return {
          httpStatus: 404,
          commit: false,
          body: { ok: false, code: "STORE_NOT_FOUND", error: `Store "${params.storeId}" not found.` },
        };
      }

      const deps = evaluateStoreDependenciesInDb(db, params.storeId);
      const shouldArchive = params.mode === "archive" || deps.totalProtected > 0;
      const nowIso = new Date().toISOString();

      if (shouldArchive) {
        const beforeState = {
          archived: Boolean(store.archived),
          enforcementState: store.enforcement?.state || "active",
        };
        const updatedStore = {
          ...store,
          archived: true,
          archivedAt: store.archivedAt || nowIso,
          archivedBy: params.session.adminUid,
          archiveReason:
            params.reason ||
            (deps.totalProtected > 0
              ? `Soft-archived because store has ${deps.totalProtected} protected historical records (${deps.orders} orders, ${deps.shipments} shipments, ${deps.returns} returns).`
              : "Soft-archived by Super Admin"),
          enforcement: {
            ...(store.enforcement || {}),
            state: "suspended",
            reasonCode: "STORE_ARCHIVED",
            reason:
              params.reason ||
              "Store archived; removed from public marketplace while preserving historical records.",
            enforcedAt: nowIso,
            enforcedByAdminId: params.session.adminUid,
            enforcedByAdminName: params.session.adminName,
          },
          updatedAt: nowIso,
        };
        const writeIdx = db.stores.findIndex((s: any) => String(s.id) === params.storeId);
        if (writeIdx >= 0) db.stores[writeIdx] = updatedStore;

        appendServerAuditLog(
          db,
          {
            module: "stores",
            action: "store_archived",
            targetEntityType: "store",
            targetEntityId: params.storeId,
            targetEntityLabel: updatedStore.name || params.storeId,
            marketScope: String(updatedStore.countryCode || "DZ"),
            reason: updatedStore.archiveReason,
            previousValue: beforeState,
            newValue: {
              archived: true,
              archivedAt: updatedStore.archivedAt,
              dependencies: deps,
            },
            mfaConfirmed: true,
          },
          params.session
        );

        return {
          httpStatus: 200,
          commit: true,
          resourceId: params.storeId,
          body: {
            ok: true,
            actionTaken: "archived",
            dependencies: deps,
            store: updatedStore,
          },
        };
      }

      // Permanent hard delete ONLY when 0 protected dependencies exist
      const beforeSnapshot = {
        id: store.id,
        name: store.name,
        subdomain: store.subdomain,
        dependencies: deps,
      };
      db.stores = db.stores.filter((s: any) => String(s.id) !== params.storeId);
      db.products = (db.products || []).filter((p: any) => String(p.storeId || "") !== params.storeId);

      appendServerAuditLog(
        db,
        {
          module: "stores",
          action: "store_permanently_deleted",
          targetEntityType: "store",
          targetEntityId: params.storeId,
          targetEntityLabel: beforeSnapshot.name || params.storeId,
          marketScope: String(store.countryCode || "DZ"),
          reason:
            params.reason ||
            "Permanently deleted store after atomic verification of zero orders, shipments, returns, or ledgers.",
          previousValue: beforeSnapshot,
          newValue: null,
          mfaConfirmed: true,
        },
        params.session
      );

      return {
        httpStatus: 200,
        commit: true,
        resourceId: params.storeId,
        body: {
          ok: true,
          actionTaken: "deleted",
          dependencies: deps,
          deletedStoreId: params.storeId,
        },
      };
    },
  });
}

// ============================================================================
// 5. TRANSACTIONAL STORE MUTATIONS (INFO, APPROVAL, BADGE, KYC, PLAN, ENFORCE)
// ============================================================================
function upsertStoreIntoDb(
  db: LocalDbSchema,
  storeId: string,
  updater: (current: any) => any,
  fallbackSnapshot?: Record<string, any>
): { store: any; previous: any } {
  db.stores = db.stores || [];
  const idx = db.stores.findIndex((s: any) => String(s.id) === storeId);
  const current =
    idx >= 0
      ? db.stores[idx]
      : {
          ...(fallbackSnapshot || {}),
          id: storeId,
          kycEnabled: fallbackSnapshot?.kycEnabled ?? false,
          archived: Boolean(fallbackSnapshot?.archived),
        };
  const updated = updater(current);
  if (idx >= 0) db.stores[idx] = updated;
  else db.stores.push(updated);
  return { store: updated, previous: current };
}

export async function updateStoreInfoTransactional(params: {
  storeId: string;
  patch: Record<string, any>;
  storeSnapshot?: Record<string, any>;
  session: ServerAdminSession;
}): Promise<{ ok: boolean; httpStatus: number; code?: string; error?: string; store?: any }> {
  return await withSerializedTransaction(async (db) => {
    const lease = assertWritableClusterLease(db);
    if (!lease.allowed) {
      return {
        commit: false,
        result: { ok: false, httpStatus: lease.httpStatus || 503, code: lease.code, error: lease.error },
      };
    }

    const patch = { ...(params.patch || {}) };
    // Never allow mutating primary Store ID
    delete patch.id;

    if (patch.subdomain) {
      const normalizedSub = String(patch.subdomain).trim().toLowerCase();
      const collision = (db.stores || []).find(
        (s: any) =>
          String(s.id) !== params.storeId &&
          String(s.subdomain || "").trim().toLowerCase() === normalizedSub
      );
      if (collision) {
        return {
          commit: false,
          result: {
            ok: false,
            httpStatus: 409,
            code: "SUBDOMAIN_ALREADY_IN_USE",
            error: `Subdomain "${normalizedSub}" is already assigned to store "${collision.name || collision.id}".`,
          },
        };
      }
      patch.subdomain = normalizedSub;
    }

    const nowIso = new Date().toISOString();
    const { store, previous } = upsertStoreIntoDb(
      db,
      params.storeId,
      (cur) => ({
        ...cur,
        ...patch,
        id: params.storeId,
        updatedAt: nowIso,
      }),
      params.storeSnapshot
    );

    appendServerAuditLog(
      db,
      {
        module: "stores",
        action: "store_info_updated",
        targetEntityType: "store",
        targetEntityId: params.storeId,
        targetEntityLabel: store.name || params.storeId,
        marketScope: String(store.countryCode || "DZ"),
        reason: "Updated store profile, geo-location, or order management configuration.",
        previousValue: {
          name: previous.name,
          country: previous.country,
          wilaya: previous.wilaya,
          city: previous.city,
          orderManagementMode: previous.orderManagementMode,
        },
        newValue: {
          name: store.name,
          country: store.country,
          wilaya: store.wilaya,
          city: store.city,
          orderManagementMode: store.orderManagementMode,
        },
        mfaConfirmed: false,
      },
      params.session
    );

    return { commit: true, result: { ok: true, httpStatus: 200, store } };
  });
}

export async function approveStoreTransactional(params: {
  storeId: string;
  approved: boolean;
  storeSnapshot?: Record<string, any>;
  session: ServerAdminSession;
}) {
  return await withSerializedTransaction(async (db) => {
    const nowIso = new Date().toISOString();
    const { store, previous } = upsertStoreIntoDb(
      db,
      params.storeId,
      (cur) => ({
        ...cur,
        shopApproved: params.approved,
        shopApprovedAt: params.approved ? nowIso : undefined,
        shopApprovedBy: params.approved ? params.session.adminUid : undefined,
        // Strictly keep verification badge independent
        verified: Boolean(cur.verified),
        updatedAt: nowIso,
      }),
      params.storeSnapshot
    );

    appendServerAuditLog(
      db,
      {
        module: "stores",
        action: "store_shop_approved",
        targetEntityType: "store",
        targetEntityId: params.storeId,
        targetEntityLabel: store.name || params.storeId,
        marketScope: String(store.countryCode || "DZ"),
        reason: params.approved
          ? "Store onboarding approved (independent of Verified Badge)."
          : "Store onboarding approval revoked.",
        previousValue: { shopApproved: Boolean(previous.shopApproved), verified: Boolean(previous.verified) },
        newValue: { shopApproved: store.shopApproved, verified: Boolean(store.verified) },
        mfaConfirmed: false,
      },
      params.session
    );

    return { commit: true, result: { ok: true, httpStatus: 200, store } };
  });
}

export async function toggleStoreBadgeTransactional(params: {
  storeId: string;
  verified: boolean;
  storeSnapshot?: Record<string, any>;
  session: ServerAdminSession;
}) {
  return await withSerializedTransaction(async (db) => {
    const nowIso = new Date().toISOString();
    const { store, previous } = upsertStoreIntoDb(
      db,
      params.storeId,
      (cur) => ({
        ...cur,
        verified: params.verified,
        updatedAt: nowIso,
      }),
      params.storeSnapshot
    );

    appendServerAuditLog(
      db,
      {
        module: "stores",
        action: params.verified ? "verification_badge_granted" : "verification_badge_revoked",
        targetEntityType: "store",
        targetEntityId: params.storeId,
        targetEntityLabel: store.name || params.storeId,
        marketScope: String(store.countryCode || "DZ"),
        reason: params.verified ? "Granted official Verified Store badge." : "Revoked Verified Store badge.",
        previousValue: { verified: Boolean(previous.verified) },
        newValue: { verified: Boolean(store.verified) },
        mfaConfirmed: true,
      },
      params.session
    );

    return { commit: true, result: { ok: true, httpStatus: 200, store } };
  });
}

export async function toggleStoreKycActivationTransactional(params: {
  storeId: string;
  kycEnabled: boolean;
  storeSnapshot?: Record<string, any>;
  session: ServerAdminSession;
}) {
  return await withSerializedTransaction(async (db) => {
    const nowIso = new Date().toISOString();
    const { store, previous } = upsertStoreIntoDb(
      db,
      params.storeId,
      (cur) => ({
        ...cur,
        kycEnabled: params.kycEnabled,
        // Strictly preserve existing kycIdentity documents & verification status
        kycIdentity: cur.kycIdentity,
        updatedAt: nowIso,
      }),
      params.storeSnapshot
    );

    appendServerAuditLog(
      db,
      {
        module: "stores",
        action: params.kycEnabled ? "kyc_activation_enabled" : "kyc_activation_disabled",
        targetEntityType: "store",
        targetEntityId: params.storeId,
        targetEntityLabel: store.name || params.storeId,
        marketScope: String(store.countryCode || "DZ"),
        reason: params.kycEnabled
          ? "Enabled store KYC activation toggle (existing documents and verification status preserved)."
          : "Disabled store KYC activation toggle (existing documents and history preserved).",
        previousValue: {
          kycEnabled: Boolean(previous.kycEnabled),
          kycStatus: previous.kycIdentity?.status || "not_submitted",
        },
        newValue: {
          kycEnabled: store.kycEnabled,
          kycStatus: store.kycIdentity?.status || "not_submitted",
        },
        mfaConfirmed: true,
      },
      params.session
    );

    return { commit: true, result: { ok: true, httpStatus: 200, store } };
  });
}

export async function changeStorePlanTransactional(params: {
  storeId: string;
  planId: string;
  storeSnapshot?: Record<string, any>;
  session: ServerAdminSession;
}) {
  return await withSerializedTransaction(async (db) => {
    const nowIso = new Date().toISOString();
    const { store, previous } = upsertStoreIntoDb(
      db,
      params.storeId,
      (cur) => ({
        ...cur,
        subscriptionTier: params.planId,
        subscriptionMeta: {
          ...(cur.subscriptionMeta || {}),
          planId: params.planId,
          status: cur.subscriptionMeta?.status || "active",
        },
        updatedAt: nowIso,
      }),
      params.storeSnapshot
    );

    appendServerAuditLog(
      db,
      {
        module: "subscriptions",
        action: "store_subscription_changed",
        targetEntityType: "store",
        targetEntityId: params.storeId,
        targetEntityLabel: store.name || params.storeId,
        marketScope: String(store.countryCode || "DZ"),
        reason: `Changed canonical subscription plan to ${params.planId}.`,
        previousValue: { subscriptionTier: previous.subscriptionTier || "Basic" },
        newValue: { subscriptionTier: params.planId },
        mfaConfirmed: true,
      },
      params.session
    );

    return { commit: true, result: { ok: true, httpStatus: 200, store } };
  });
}

export async function enforceStoreTransactional(params: {
  storeId: string;
  newState: string;
  reason: string;
  reasonCode: string;
  policyReference?: string;
  restrictedCapabilities?: string[];
  storeSnapshot?: Record<string, any>;
  session: ServerAdminSession;
}) {
  return await withSerializedTransaction(async (db) => {
    const nowIso = new Date().toISOString();
    const record = {
      id: params.storeId,
      storeId: params.storeId,
      state: params.newState,
      reason: params.reason,
      reasonCode: params.reasonCode,
      policyReference: params.policyReference || "POL-MARKET-01",
      restrictedCapabilities: params.restrictedCapabilities || [],
      enforcedAt: nowIso,
      enforcedByAdminId: params.session.adminUid,
      enforcedByAdminName: params.session.adminName,
    };

    const { store, previous } = upsertStoreIntoDb(
      db,
      params.storeId,
      (cur) => ({
        ...cur,
        enforcement: {
          state: params.newState,
          reason: params.reason,
          reasonCode: params.reasonCode,
          policyReference: params.policyReference || "POL-MARKET-01",
          restrictedCapabilities: params.restrictedCapabilities || [],
          enforcedAt: nowIso,
          enforcedByAdminId: params.session.adminUid,
          enforcedByAdminName: params.session.adminName,
        },
        updatedAt: nowIso,
      }),
      params.storeSnapshot
    );

    db.governanceState = db.governanceState || {};
    db.governanceState.storeEnforcements = db.governanceState.storeEnforcements || {};
    db.governanceState.storeEnforcements[params.storeId] = record;

    appendServerAuditLog(
      db,
      {
        module: "stores",
        action: "store_enforced",
        targetEntityType: "store",
        targetEntityId: params.storeId,
        targetEntityLabel: store.name || params.storeId,
        marketScope: String(store.countryCode || "DZ"),
        reason: params.reason,
        previousValue: { enforcementState: previous.enforcement?.state || "active" },
        newValue: { enforcementState: params.newState, reasonCode: params.reasonCode },
        mfaConfirmed: params.newState === "suspended" || params.newState === "terminated",
      },
      params.session
    );

    return { commit: true, result: { ok: true, httpStatus: 200, enforcement: record, store } };
  });
}
