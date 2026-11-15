import type {
  AutomaticStoreRanking,
  DateRangePreset,
  MerchantStore,
  Order,
  StorePerformanceMetrics,
} from "../types";

export const YUME_PLATFORM_TIMEZONE = "Africa/Algiers"; // UTC+1, no DST
const ALGIERS_UTC_OFFSET_MS = 60 * 60 * 1000;

export interface ResolvedDateBounds {
  preset: DateRangePreset;
  startUtcMs: number;
  endUtcMs: number;
  startIso: string;
  endIso: string;
  valid: boolean;
  error?: string;
}

/**
 * Computes UTC [startUtcMs, endUtcMs] day boundaries aligned strictly to Africa/Algiers (UTC+1).
 */
export function resolveAlgiersDateBounds(
  preset: DateRangePreset,
  customStartYmd?: string,
  customEndYmd?: string,
  nowMs: number = Date.now()
): ResolvedDateBounds {
  const algiersNow = new Date(nowMs + ALGIERS_UTC_OFFSET_MS);
  const y = algiersNow.getUTCFullYear();
  const m = algiersNow.getUTCMonth();
  const d = algiersNow.getUTCDate();

  const startOfTodayAlgiersInUtcMs = Date.UTC(y, m, d, 0, 0, 0, 0) - ALGIERS_UTC_OFFSET_MS;

  if (preset === "today") {
    return {
      preset,
      startUtcMs: startOfTodayAlgiersInUtcMs,
      endUtcMs: nowMs,
      startIso: new Date(startOfTodayAlgiersInUtcMs).toISOString(),
      endIso: new Date(nowMs).toISOString(),
      valid: true,
    };
  }

  if (preset === "last_7_days") {
    const startUtcMs = startOfTodayAlgiersInUtcMs - 6 * 86_400_000;
    return {
      preset,
      startUtcMs,
      endUtcMs: nowMs,
      startIso: new Date(startUtcMs).toISOString(),
      endIso: new Date(nowMs).toISOString(),
      valid: true,
    };
  }

  if (preset === "last_30_days") {
    const startUtcMs = startOfTodayAlgiersInUtcMs - 29 * 86_400_000;
    return {
      preset,
      startUtcMs,
      endUtcMs: nowMs,
      startIso: new Date(startUtcMs).toISOString(),
      endIso: new Date(nowMs).toISOString(),
      valid: true,
    };
  }

  // Custom range (YYYY-MM-DD interpreted in Africa/Algiers)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!customStartYmd || !customEndYmd || !dateRegex.test(customStartYmd) || !dateRegex.test(customEndYmd)) {
    const fallbackStart = startOfTodayAlgiersInUtcMs - 29 * 86_400_000;
    return {
      preset: "custom",
      startUtcMs: fallbackStart,
      endUtcMs: nowMs,
      startIso: new Date(fallbackStart).toISOString(),
      endIso: new Date(nowMs).toISOString(),
      valid: false,
      error: "Select both valid Start Date and End Date.",
    };
  }

  const [sy, sm, sd] = customStartYmd.split("-").map(Number);
  const [ey, em, ed] = customEndYmd.split("-").map(Number);
  const startUtcMs = Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0) - ALGIERS_UTC_OFFSET_MS;
  const endUtcMs = Date.UTC(ey, em - 1, ed, 23, 59, 59, 999) - ALGIERS_UTC_OFFSET_MS;

  if (startUtcMs > endUtcMs) {
    return {
      preset: "custom",
      startUtcMs,
      endUtcMs,
      startIso: new Date(startUtcMs).toISOString(),
      endIso: new Date(endUtcMs).toISOString(),
      valid: false,
      error: "Start Date cannot be after End Date.",
    };
  }

  return {
    preset: "custom",
    startUtcMs,
    endUtcMs,
    startIso: new Date(startUtcMs).toISOString(),
    endIso: new Date(endUtcMs).toISOString(),
    valid: true,
  };
}

export function isOrderQualifiedForStoreMetrics(order: Partial<Order>): boolean {
  const statusStr = String(order.orderStatus || order.status || "").toLowerCase();
  if (statusStr === "cancelled" || statusStr === "rejected") return false;
  const payStr = String(order.paymentStatus || "").toLowerCase();
  if (payStr === "refunded") return false;
  const retStr = String(order.returnStatus || "").toLowerCase();
  if (retStr === "refunded") return false;
  return true;
}

export function parseOrderTimestampMs(order: Partial<Order>): number | null {
  const candidate = order.date || (order as any).createdAt;
  if (!candidate) return null;
  const ms = Date.parse(String(candidate));
  return Number.isFinite(ms) ? ms : null;
}

export interface ConversionCalculationInput {
  qualifiedOrders: number;
  uniqueVisitors: number;
  uniqueConvertingVisitors?: number;
}

export function computeStoreConversionRate(input: ConversionCalculationInput): {
  conversionRatePercent: number | null;
  conversionMethod: StorePerformanceMetrics["conversionMethod"];
  conversionUnavailableReason?: string;
} {
  const { qualifiedOrders, uniqueVisitors, uniqueConvertingVisitors } = input;

  if (uniqueVisitors <= 0) {
    return {
      conversionRatePercent: null,
      conversionMethod: "unavailable",
      conversionUnavailableReason:
        qualifiedOrders > 0
          ? "Historical orders predate storefront visitor tracking in this date window."
          : "No storefront visits recorded in this date window.",
    };
  }

  if (
    typeof uniqueConvertingVisitors === "number" &&
    uniqueConvertingVisitors > 0 &&
    uniqueConvertingVisitors <= uniqueVisitors
  ) {
    return {
      conversionRatePercent: Number(((uniqueConvertingVisitors / uniqueVisitors) * 100).toFixed(1)),
      conversionMethod: "unique_converting_visitors",
    };
  }

  if (qualifiedOrders > uniqueVisitors) {
    return {
      conversionRatePercent: null,
      conversionMethod: "unavailable",
      conversionUnavailableReason:
        "Qualified orders exceed tracked visitors due to orders predating live storefront tracking.",
    };
  }

  return {
    conversionRatePercent: Number(((qualifiedOrders / uniqueVisitors) * 100).toFixed(1)),
    conversionMethod: "qualified_orders_ratio",
  };
}

export interface StoreRankingInput {
  archived?: boolean;
  qualifiedOrders: number;
  salesDzd: number;
  publishedProductsCount: number;
  reviewCount: number;
  rating: number;
  uniqueVisitors: number;
  productClicks: number;
  platformTrackingMatureDays?: number;
}

/**
 * Data-Driven Two-Stage Automatic Store Ranking:
 * - Stage 1 (Immediate): Verifiable Orders (35) + Sales (25) + Active Catalog (20) + Bayesian Rating (20)
 * - Stage 2 (>= 14 days tracking maturity & store telemetry present):
 *   Orders (30) + Sales (20) + Visitors (15) + Product Clicks (10) + Active Catalog (10) + Bayesian Rating (15)
 * - Technical Fallback ("Unranked"): Strictly when Orders=0, ActiveCatalog=0, Visitors=0, Clicks=0, Reviews=0.
 */
export function computeAutomaticStoreRanking(input: StoreRankingInput): {
  ranking: AutomaticStoreRanking;
  rankingScore: number;
  rankingStage: StorePerformanceMetrics["rankingStage"];
} {
  const {
    archived = false,
    qualifiedOrders,
    salesDzd,
    publishedProductsCount,
    reviewCount,
    rating,
    uniqueVisitors,
    productClicks,
    platformTrackingMatureDays = 0,
  } = input;

  if (archived) {
    return {
      ranking: "Low",
      rankingScore: 0,
      rankingStage: "archived_exempt",
    };
  }

  if (
    qualifiedOrders === 0 &&
    publishedProductsCount === 0 &&
    uniqueVisitors === 0 &&
    productClicks === 0 &&
    reviewCount === 0
  ) {
    return {
      ranking: "Unranked",
      rankingScore: 0,
      rankingStage: "unranked_insufficient_data",
    };
  }

  const safeRating = Math.min(5, Math.max(0, Number(rating) || 0));
  const useStage2 =
    platformTrackingMatureDays >= 14 && (uniqueVisitors > 0 || productClicks > 0);

  let score = 0;

  if (useStage2) {
    const orderPts = Math.min(30, (Math.log(1 + qualifiedOrders) / Math.log(1 + 25)) * 30);
    const salesPts = Math.min(20, (Math.log(1 + Math.max(0, salesDzd) / 1000) / Math.log(1 + 250)) * 20);
    const visitorPts = Math.min(15, (Math.log(1 + uniqueVisitors) / Math.log(1 + 100)) * 15);
    const clickPts = Math.min(10, (Math.log(1 + productClicks) / Math.log(1 + 200)) * 10);
    const catalogPts = Math.min(10, publishedProductsCount);
    const bayesian =
      reviewCount > 0 || qualifiedOrders > 0
        ? (((reviewCount * safeRating + 3 * 3.5) / (reviewCount + 3)) / 5) * 15
        : 0;
    score = Math.round(orderPts + salesPts + visitorPts + clickPts + catalogPts + bayesian);
  } else {
    const orderPts = Math.min(35, (Math.log(1 + qualifiedOrders) / Math.log(1 + 25)) * 35);
    const salesPts = Math.min(25, (Math.log(1 + Math.max(0, salesDzd) / 1000) / Math.log(1 + 250)) * 25);
    const catalogPts = Math.min(20, publishedProductsCount * 2);
    const bayesian =
      reviewCount > 0 || qualifiedOrders > 0
        ? (((reviewCount * safeRating + 3 * 3.5) / (reviewCount + 3)) / 5) * 20
        : 0;
    score = Math.round(orderPts + salesPts + catalogPts + bayesian);
  }

  const clampedScore = Math.max(1, Math.min(100, score));
  const ranking: AutomaticStoreRanking =
    clampedScore >= 65 ? "High" : clampedScore >= 30 ? "Medium" : "Low";

  return {
    ranking,
    rankingScore: clampedScore,
    rankingStage: useStage2 ? "stage_2_full_telemetry" : "stage_1_commerce_baseline",
  };
}

export function buildStorePerformanceMetrics(params: {
  store: MerchantStore;
  orders: Order[];
  bounds: ResolvedDateBounds;
  serverPerf?: {
    uniqueVisitors?: number;
    totalSessions?: number;
    productClicks?: number;
    uniqueConvertingVisitors?: number;
  };
  platformTrackingMatureDays?: number;
}): StorePerformanceMetrics {
  const { store, orders, bounds, serverPerf, platformTrackingMatureDays = 0 } = params;
  const products = store.products || [];
  const publishedProductsCount = products.filter((p) => p.status !== "draft").length;

  const storeOrdersInRange = orders.filter((ord) => {
    if (!isOrderQualifiedForStoreMetrics(ord)) return false;
    const matchesStore = ord.storeId === store.id;
    if (!matchesStore) return false;
    const ts = parseOrderTimestampMs(ord);
    if (ts === null) return false;
    return ts >= bounds.startUtcMs && ts <= bounds.endUtcMs;
  });

  const qualifiedOrders = storeOrdersInRange.length;
  const salesDzd = storeOrdersInRange.reduce((sum, ord) => sum + (Number(ord.total) || 0), 0);

  const uniqueVisitors = Number(serverPerf?.uniqueVisitors ?? 0);
  const totalSessions = Number(serverPerf?.totalSessions ?? 0);
  const productClicks = Number(serverPerf?.productClicks ?? 0);

  const conv = computeStoreConversionRate({
    qualifiedOrders,
    uniqueVisitors,
    uniqueConvertingVisitors: serverPerf?.uniqueConvertingVisitors,
  });

  const storeLevelReviews = store.reviews?.length || 0;
  const productLevelReviews = products.reduce((sum, p) => sum + (p.reviews?.length || 0), 0);
  const reviewCount = storeLevelReviews + productLevelReviews;

  const rankingInfo = computeAutomaticStoreRanking({
    archived: Boolean(store.archived),
    qualifiedOrders,
    salesDzd,
    publishedProductsCount,
    reviewCount,
    rating: typeof store.rating === "number" ? store.rating : 0,
    uniqueVisitors,
    productClicks,
    platformTrackingMatureDays,
  });

  return {
    storeId: store.id,
    qualifiedOrders,
    salesDzd,
    publishedProductsCount,
    uniqueVisitors,
    totalSessions,
    productClicks,
    uniqueConvertingVisitors: Number(serverPerf?.uniqueConvertingVisitors ?? 0),
    conversionRatePercent: conv.conversionRatePercent,
    conversionMethod: conv.conversionMethod,
    conversionUnavailableReason: conv.conversionUnavailableReason,
    ranking: rankingInfo.ranking,
    rankingScore: rankingInfo.rankingScore,
    rankingStage: rankingInfo.rankingStage,
  };
}
