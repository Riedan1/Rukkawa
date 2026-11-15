import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import type { Server } from "http";
import {
  resolveAlgiersDateBounds,
  computeStoreConversionRate,
  computeAutomaticStoreRanking,
  buildStorePerformanceMetrics,
} from "../src/utils/storePerformanceEngine";
import {
  getStatesByCountryCode,
  getCitiesByState,
  resolveCountryCodeFromInput,
  resolveStateCodeFromInput,
} from "../src/lib/countryStateCity";
import type { MerchantStore, Order } from "../src/types";

const BROWSER_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

describe("Version 2.1 Unit Logic — Date Boundaries, Conversion, Staged Ranking & Geo Cascade", () => {
  it("computes Africa/Algiers (UTC+1) calendar boundaries for Today, Last 7 Days, Last 30 Days & Custom", () => {
    // 2026-06-15 10:30:00 Algiers time (UTC+1) === 2026-06-15T09:30:00.000Z
    const nowUtcMs = Date.UTC(2026, 5, 15, 9, 30, 0, 0);

    const today = resolveAlgiersDateBounds("today", undefined, undefined, nowUtcMs);
    expect(today.valid).toBe(true);
    // Start of June 15 in Algiers (00:00:00 UTC+1) is June 14 23:00:00.000 UTC
    expect(today.startIso).toBe("2026-06-14T23:00:00.000Z");
    expect(today.endIso).toBe("2026-06-15T09:30:00.000Z");

    const customValid = resolveAlgiersDateBounds(
      "custom",
      "2026-06-01",
      "2026-06-10",
      nowUtcMs
    );
    expect(customValid.valid).toBe(true);
    expect(customValid.startIso).toBe("2026-05-31T23:00:00.000Z");
    expect(customValid.endIso).toBe("2026-06-10T22:59:59.999Z");

    const customInvalid = resolveAlgiersDateBounds(
      "custom",
      "2026-06-12",
      "2026-06-05",
      nowUtcMs
    );
    expect(customInvalid.valid).toBe(false);
    expect(customInvalid.error).toContain("after End Date");
  });

  it("handles Conversion Rate edge cases (0 visitors, historical pre-tracking >100% guard, repeat buyers)", () => {
    const zeroVisitors = computeStoreConversionRate({
      qualifiedOrders: 3,
      uniqueVisitors: 0,
    });
    expect(zeroVisitors.conversionRatePercent).toBeNull();
    expect(zeroVisitors.conversionMethod).toBe("unavailable");

    const preTrackingSkew = computeStoreConversionRate({
      qualifiedOrders: 5,
      uniqueVisitors: 2,
    });
    expect(preTrackingSkew.conversionRatePercent).toBeNull();
    expect(preTrackingSkew.conversionMethod).toBe("unavailable");

    // 2 repeat orders from 1 unique converting visitor out of 10 unique visitors = 10.0%
    const repeatBuyer = computeStoreConversionRate({
      qualifiedOrders: 4,
      uniqueVisitors: 10,
      uniqueConvertingVisitors: 1,
    });
    expect(repeatBuyer.conversionRatePercent).toBe(10.0);
    expect(repeatBuyer.conversionMethod).toBe("unique_converting_visitors");
  });

  it("executes Stage 1 & Stage 2 Automatic Ranking accurately with Unranked and Archived gates", () => {
    const unranked = computeAutomaticStoreRanking({
      qualifiedOrders: 0,
      salesDzd: 0,
      publishedProductsCount: 0,
      reviewCount: 0,
      rating: 0,
      uniqueVisitors: 0,
      productClicks: 0,
    });
    expect(unranked.ranking).toBe("Unranked");
    expect(unranked.rankingScore).toBe(0);

    // Catalog-only or 1 review cannot falsely reach High (< 65 pts)
    const catalogOnly = computeAutomaticStoreRanking({
      qualifiedOrders: 0,
      salesDzd: 0,
      publishedProductsCount: 25,
      reviewCount: 1,
      rating: 5,
      uniqueVisitors: 0,
      productClicks: 0,
    });
    expect(catalogOnly.ranking).toBe("Medium");
    expect(catalogOnly.rankingScore).toBeLessThan(65);
    expect(catalogOnly.rankingStage).toBe("stage_1_commerce_baseline");

    // Stage 2 activates once platform maturity >= 14 days and store has telemetry
    const stage2 = computeAutomaticStoreRanking({
      qualifiedOrders: 20,
      salesDzd: 180_000,
      publishedProductsCount: 10,
      reviewCount: 18,
      rating: 4.8,
      uniqueVisitors: 95,
      productClicks: 180,
      platformTrackingMatureDays: 21,
    });
    expect(stage2.rankingStage).toBe("stage_2_full_telemetry");
    expect(stage2.ranking).toBe("High");

    // Archived store never occupies High competitive rank
    const archived = computeAutomaticStoreRanking({
      archived: true,
      qualifiedOrders: 50,
      salesDzd: 900_000,
      publishedProductsCount: 20,
      reviewCount: 30,
      rating: 5,
      uniqueVisitors: 500,
      productClicks: 900,
      platformTrackingMatureDays: 30,
    });
    expect(archived.rankingStage).toBe("archived_exempt");
    expect(archived.ranking).toBe("Low");
  });

  it("excludes cancelled/refunded orders in buildStorePerformanceMetrics", () => {
    const store = {
      id: "store_perf_1",
      name: "Atlas Store",
      slug: "atlas-store",
      subdomain: "atlas.platform.dz",
      logo: "",
      banner: "",
      description: "",
      wilaya: "Alger",
      address: "",
      coordinates: { lat: 36.7, lng: 3.0 },
      rating: 4.9,
      categories: [],
      verified: true,
      premiumTier: "Pro",
      contact: { phone: "0550", email: "a@b.dz" },
      products: [{ id: "p1", name: "Item 1", category: "Crafts", price: 1000, stock: 5, status: "active", imageUrl: "", rating: 5, reviews: [] }],
      reviews: [],
    } as unknown as MerchantStore;

    const nowMs = Date.UTC(2026, 5, 15, 12, 0, 0);
    const bounds = resolveAlgiersDateBounds("last_7_days", undefined, undefined, nowMs);
    const orders = [
      { id: "o1", storeId: "store_perf_1", total: 5000, date: "2026-06-14T10:00:00Z", status: "pending", orderStatus: "accepted" },
      { id: "o2", storeId: "store_perf_1", total: 9000, date: "2026-06-14T11:00:00Z", status: "cancelled", orderStatus: "cancelled" },
      { id: "o3", storeId: "store_perf_1", total: 3000, date: "2026-06-14T12:00:00Z", status: "delivered", paymentStatus: "refunded" },
    ] as unknown as Order[];

    const metrics = buildStorePerformanceMetrics({
      store,
      orders,
      bounds,
      serverPerf: { uniqueVisitors: 10, totalSessions: 12, productClicks: 25 },
    });
    expect(metrics.qualifiedOrders).toBe(1);
    expect(metrics.salesDzd).toBe(5000);
    expect(metrics.conversionRatePercent).toBe(10.0);
  });

  it("resolves dependent geographic cascade cleanly across Algeria & Worldwide countries", () => {
    expect(resolveCountryCodeFromInput("Algeria")).toBe("DZ");
    expect(resolveCountryCodeFromInput("United States")).toBe("US");
    const dzStates = getStatesByCountryCode("DZ");
    expect(dzStates.length).toBeGreaterThanOrEqual(58);

    const usStates = getStatesByCountryCode("US");
    expect(usStates.some((s) => s.name === "California")).toBe(true);
    expect(usStates.some((s) => s.name.includes("Tamanrasset"))).toBe(false);

    const stateCode = resolveStateCodeFromInput("DZ", "Bejaia");
    const dzCities = getCitiesByState("DZ", stateCode);
    expect(dzCities.length).toBeGreaterThan(0);
  });
});

describe("Version 2.1 Backend API, Analytics Security, RBAC & Safe Lifecycle Integration", () => {
  let tmpDataDir: string;
  let server: Server;
  let baseUrl: string;
  let superAdminHeaders: Record<string, string>;
  let marketingAdminHeaders: Record<string, string>;

  beforeAll(async () => {
    tmpDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "yume-v21-test-"));
    process.env.YUME_DATA_DIR = tmpDataDir;

    const { saveDatabaseImmediate, loadDatabase } = await import("../server/localDb");
    const { getServerAdmins } = await import("../server/securityGovernance");

    const db = await loadDatabase();
    const admins = getServerAdmins(db);
    db.governanceState = {
      ...(db.governanceState || {}),
      adminAccounts: admins,
    } as any;
    db.stores = [
      {
        id: "store_with_order",
        name: "Protected Store With Order",
        slug: "protected-store",
        subdomain: "protected-store.platform.dz",
        country: "Algeria",
        countryCode: "DZ",
        wilaya: "Alger",
        wilayaCode: "16",
        city: "Hydra",
        kycEnabled: false,
        archived: false,
        verified: false,
        shopApproved: false,
        merchantFirstName: "Karim",
        merchantLastName: "SecretLegal",
        verificationDocName: "CNI_99887766.pdf",
        kycIdentity: {
          status: "pending_review",
          documentType: "National Identity Card",
          submittedAt: "2026-06-01T10:00:00Z",
        },
        products: [
          {
            id: "prod_owned_1",
            storeId: "store_with_order",
            name: "Berber Ceramic Vase",
            stock: 10,
            price: 3500,
            status: "active",
          },
        ],
      },
      {
        id: "store_empty_deletable",
        name: "Empty Clean Store",
        slug: "empty-clean",
        subdomain: "empty-clean.platform.dz",
        country: "Algeria",
        countryCode: "DZ",
        wilaya: "Bejaia",
        wilayaCode: "06",
        kycEnabled: false,
        archived: false,
        verified: false,
        products: [
          {
            id: "prod_other_store",
            storeId: "store_empty_deletable",
            name: "Unrelated Item",
            stock: 5,
            price: 1200,
            status: "active",
          },
        ],
      },
    ];
    db.orders = [
      {
        id: "ord_hist_1",
        storeId: "store_with_order",
        total: 3500,
        status: "pending",
        orderStatus: "pending",
        date: new Date().toISOString(),
        customerName: "Ali",
        items: [],
      },
    ];
    await saveDatabaseImmediate(db);

    const { createYumeApp } = await import("../server");
    const app = await createYumeApp({ skipVite: true });

    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (addr && typeof addr === "object") {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });

    // Authenticate explicit admin sessions for RBAC matrix tests
    const superLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminUid: "adm_super_owner", mfaCode: "123456" }),
    }).then((r) => r.json());

    superAdminHeaders = {
      "Content-Type": "application/json",
      "X-Yume-Admin-Uid": "adm_super_owner",
      "X-Yume-Admin-Token": superLogin.adminToken,
      "X-Yume-StepUp-Token": superLogin.stepUpToken,
    };

    const unknownLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminUid: "adm_nonexistent_attacker", mfaCode: "123456" }),
    });
    expect(unknownLogin.status).toBe(403);

    const mktLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminUid: "adm_marketing_director", mfaCode: "123456" }),
    }).then((r) => r.json());

    marketingAdminHeaders = {
      "Content-Type": "application/json",
      "X-Yume-Admin-Uid": "adm_marketing_director",
      "X-Yume-Admin-Token": mktLogin.adminToken,
      "X-Yume-StepUp-Token": mktLogin.stepUpToken,
    };
  });

  afterAll(async () => {
    if (server) {
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    delete process.env.YUME_DATA_DIR;
    if (tmpDataDir && fs.existsSync(tmpDataDir)) {
      fs.rmSync(tmpDataDir, { recursive: true, force: true });
    }
  });

  it("blocks automated bot User-Agent and forged visitor tokens on POST /api/analytics/events", async () => {
    const botRes = await fetch(`${baseUrl}/api/analytics/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "curl/8.4.0",
      },
      body: JSON.stringify({ eventType: "visit", storeId: "store_with_order" }),
    });
    expect(botRes.status).toBe(403);
    const botJson = await botRes.json();
    expect(botJson.code).toBe("BOT_TRAFFIC_EXCLUDED");

    const forgedRes = await fetch(`${baseUrl}/api/analytics/events`, {
      method: "POST",
      headers: {
        ...BROWSER_HEADERS,
        "X-Yume-Visitor-Token": "forged-visitor-id.bad-signature",
      },
      body: JSON.stringify({ eventType: "visit", storeId: "store_with_order" }),
    });
    expect(forgedRes.status).toBe(401);
    const forgedJson = await forgedRes.json();
    expect(forgedJson.code).toBe("INVALID_VISITOR_TOKEN");
  });

  it("rejects mismatched storeId/productId clicks and deduplicates genuine storefront telemetry", async () => {
    // 1. Valid storefront visit mints signed visitor token
    const visit1 = await fetch(`${baseUrl}/api/analytics/events`, {
      method: "POST",
      headers: BROWSER_HEADERS,
      body: JSON.stringify({ eventType: "visit", storeId: "store_with_order" }),
    });
    expect(visit1.status).toBe(201);
    const v1Json = await visit1.json();
    expect(v1Json.ok).toBe(true);
    expect(typeof v1Json.visitorToken).toBe("string");

    // 2. Duplicate visit within 30-min session bucket is deduplicated (not double-counted)
    const visitDup = await fetch(`${baseUrl}/api/analytics/events`, {
      method: "POST",
      headers: {
        ...BROWSER_HEADERS,
        "X-Yume-Visitor-Token": v1Json.visitorToken,
      },
      body: JSON.stringify({ eventType: "visit", storeId: "store_with_order" }),
    });
    expect(visitDup.status).toBe(200);
    const dupJson = await visitDup.json();
    expect(dupJson.deduplicated).toBe(true);

    // 3. Mismatched product ownership rejected with 403
    const mismatchClick = await fetch(`${baseUrl}/api/analytics/events`, {
      method: "POST",
      headers: {
        ...BROWSER_HEADERS,
        "X-Yume-Visitor-Token": v1Json.visitorToken,
      },
      body: JSON.stringify({
        eventType: "product_click",
        storeId: "store_with_order",
        productId: "prod_other_store",
      }),
    });
    expect(mismatchClick.status).toBe(403);
    const mmJson = await mismatchClick.json();
    expect(mmJson.code).toBe("PRODUCT_STORE_OWNERSHIP_MISMATCH");

    // 4. Genuine product_click succeeds and aggregates in GET /api/admin/stores/performance
    const validClick = await fetch(`${baseUrl}/api/analytics/events`, {
      method: "POST",
      headers: {
        ...BROWSER_HEADERS,
        "X-Yume-Visitor-Token": v1Json.visitorToken,
      },
      body: JSON.stringify({
        eventType: "product_click",
        storeId: "store_with_order",
        productId: "prod_owned_1",
      }),
    });
    expect(validClick.status).toBe(201);

    const perfRes = await fetch(`${baseUrl}/api/admin/stores/performance`, {
      headers: superAdminHeaders,
    });
    expect(perfRes.status).toBe(200);
    const perfJson = await perfRes.json();
    expect(perfJson.byStore["store_with_order"].uniqueVisitors).toBe(1);
    expect(perfJson.byStore["store_with_order"].productClicks).toBe(1);
  });

  it("enforces strict RBAC on unauthenticated callers, KYC PII isolation, and KYC activation preservation", async () => {
    // 1. Anonymous caller denied with 401
    const anonPerf = await fetch(`${baseUrl}/api/admin/stores/performance`);
    expect(anonPerf.status).toBe(401);

    // 2. marketing_and_ads denied KYC PII endpoint with 403 and redacted in /api/admin/stores
    const mktKyc = await fetch(`${baseUrl}/api/admin/stores/store_with_order/kyc`, {
      headers: marketingAdminHeaders,
    });
    expect(mktKyc.status).toBe(403);

    const mktStores = await fetch(`${baseUrl}/api/admin/stores`, {
      headers: marketingAdminHeaders,
    }).then((r) => r.json());
    const targetMktStore = mktStores.stores.find((s: any) => s.id === "store_with_order");
    expect(targetMktStore.kycIdentity.redactedByRbac).toBe(true);
    expect(targetMktStore.verificationDocName).toContain("REDACTED");

    // 3. super_admin CAN read KYC PII unredacted
    const superKyc = await fetch(`${baseUrl}/api/admin/stores/store_with_order/kyc`, {
      headers: superAdminHeaders,
    });
    expect(superKyc.status).toBe(200);
    const superKycJson = await superKyc.json();
    expect(superKycJson.verificationDocName).toBe("CNI_99887766.pdf");

    // 4. Enable & Disable KYC preserves existing documents and verification status
    const enableRes = await fetch(`${baseUrl}/api/admin/stores/store_with_order/kyc-activation`, {
      method: "POST",
      headers: superAdminHeaders,
      body: JSON.stringify({ kycEnabled: true }),
    }).then((r) => r.json());
    expect(enableRes.store.kycEnabled).toBe(true);
    expect(enableRes.store.kycIdentity.status).toBe("pending_review");

    const disableRes = await fetch(`${baseUrl}/api/admin/stores/store_with_order/kyc-activation`, {
      method: "POST",
      headers: superAdminHeaders,
      body: JSON.stringify({ kycEnabled: false }),
    }).then((r) => r.json());
    expect(disableRes.store.kycEnabled).toBe(false);
    expect(disableRes.store.kycIdentity.status).toBe("pending_review");
    expect(disableRes.store.verificationDocName).toBe("CNI_99887766.pdf");

    // 5. Shop Approval stays independent of Verified Badge
    const approveRes = await fetch(`${baseUrl}/api/admin/stores/store_with_order/approve`, {
      method: "POST",
      headers: superAdminHeaders,
      body: JSON.stringify({ approved: true }),
    }).then((r) => r.json());
    expect(approveRes.store.shopApproved).toBe(true);
    expect(approveRes.store.verified).toBe(false);
  });

  it("soft-archives stores with orders, blocks archived checkouts (HTTP 409), and permanently deletes empty stores (super_admin only)", async () => {
    // 1. Non-super_admin cannot delete or archive stores
    const forbiddenDel = await fetch(`${baseUrl}/api/admin/stores/store_empty_deletable`, {
      method: "DELETE",
      headers: marketingAdminHeaders,
    });
    expect(forbiddenDel.status).toBe(403);

    // 2. Store with historical order MUST be Soft-Archived, never permanently deleted
    const archiveRes = await fetch(`${baseUrl}/api/admin/stores/store_with_order`, {
      method: "DELETE",
      headers: {
        ...superAdminHeaders,
        "Idempotency-Key": "test_archive_store_1",
      },
      body: JSON.stringify({ reason: "End-of-season audit archive" }),
    });
    expect(archiveRes.status).toBe(200);
    const archiveJson = await archiveRes.json();
    expect(archiveJson.actionTaken).toBe("archived");
    expect(archiveJson.store.archived).toBe(true);

    // 3. Archived store rejects new storefront analytics & new checkout orders with HTTP 409 STORE_ARCHIVED
    const blockedVisit = await fetch(`${baseUrl}/api/analytics/events`, {
      method: "POST",
      headers: BROWSER_HEADERS,
      body: JSON.stringify({ eventType: "visit", storeId: "store_with_order" }),
    });
    expect(blockedVisit.status).toBe(409);

    const blockedOrder = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "order_archived_store_check_1",
      },
      body: JSON.stringify({
        orders: [
          {
            id: "ord_blocked_archived",
            storeId: "store_with_order",
            customerName: "Test Buyer",
            total: 3500,
            items: [{ productId: "prod_owned_1", qty: 1, price: 3500 }],
          },
        ],
      }),
    });
    expect(blockedOrder.status).toBe(409);
    const blockedOrderJson = await blockedOrder.json();
    expect(blockedOrderJson.code).toBe("STORE_ARCHIVED");

    // 4. Empty store with zero orders/shipments/returns/ledgers is permanently deleted
    const delEmptyRes = await fetch(`${baseUrl}/api/admin/stores/store_empty_deletable`, {
      method: "DELETE",
      headers: {
        ...superAdminHeaders,
        "Idempotency-Key": "test_delete_empty_store_1",
      },
      body: JSON.stringify({ reason: "Cleanup test store" }),
    });
    expect(delEmptyRes.status).toBe(200);
    const delEmptyJson = await delEmptyRes.json();
    expect(delEmptyJson.actionTaken).toBe("deleted");
    expect(delEmptyJson.deletedStoreId).toBe("store_empty_deletable");
  });
});
