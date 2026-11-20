export type StockNotifyStatus = "pending" | "resolved" | "dismissed";

export interface StockNotifyRequest {
  id: string;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantId?: string;
  variantLabel?: string;
  requesterIpKeys?: string[];
  requestCount: number;
  createdAt: string;
  lastRequestedAt: string;
  status: StockNotifyStatus;
  resolvedAt?: string;
}

export interface StockNotifyInput {
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantId?: string;
  variantLabel?: string;
  requesterIpKey?: string;
}

export interface RecordStockNotifyResult {
  nextList: StockNotifyRequest[];
  recorded: StockNotifyRequest | null;
  alreadyRequestedByIp: boolean;
}

export interface StoreNotifyAttentionBucket {
  storeId: string;
  storeName: string;
  pendingEntries: number;
  totalRequests: number;
  latestAt: string;
  requests: StockNotifyRequest[];
}

export interface StoreNotifyAttentionSummary {
  totalPendingEntries: number;
  totalCustomerRequests: number;
  byStore: StoreNotifyAttentionBucket[];
}

export const STOCK_NOTIFY_STORAGE_KEY = "dz_stock_notify_requests";
export const STOCK_NOTIFY_IP_STORAGE_KEY = "dz_stock_notify_ip_key";
const MAX_STORED_REQUESTS = 250;

export function normalizeVariantKey(variantId?: string, variantLabel?: string): string {
  const idPart = (variantId || "").trim().toLowerCase();
  if (idPart) return `id:${idPart}`;
  const labelPart = (variantLabel || "").trim().toLowerCase();
  return labelPart ? `lbl:${labelPart}` : "default";
}

function normalizeIpKey(ipKey?: string): string {
  const clean = String(ipKey || "").trim();
  return clean || "local_visitor";
}

function extractUniqueIpKeys(rawKeys: unknown): string[] {
  if (!Array.isArray(rawKeys)) return [];
  return Array.from(
    new Set(
      rawKeys
        .map((k) => String(k || "").trim())
        .filter((k) => k.length > 0)
    )
  );
}

export function normalizeStockNotifyRequests(
  rawRequests: unknown,
  bindLegacyIpKey?: string
): StockNotifyRequest[] {
  if (!Array.isArray(rawRequests)) return [];
  const cleanBindKey = String(bindLegacyIpKey || "").trim();

  return rawRequests
    .filter((item): item is StockNotifyRequest => Boolean(item && typeof item === "object"))
    .map((item) => {
      const uniqueIps = extractUniqueIpKeys(item.requesterIpKeys);
      const isPending = item.status === "pending";

      if (uniqueIps.length > 0) {
        return {
          ...item,
          requesterIpKeys: uniqueIps,
          requestCount: uniqueIps.length,
        };
      }

      // Legacy entries created before per-IP deduplication had no requesterIpKeys.
      // Clamp inflated counts back to 1 so stale spam never surfaces as fake demand.
      const fallbackIps = isPending && cleanBindKey ? [cleanBindKey] : [];
      return {
        ...item,
        requesterIpKeys: fallbackIps,
        requestCount: 1,
      };
    })
    .slice(0, MAX_STORED_REQUESTS);
}

export function formatWaitingCountLabel(count?: number): string {
  const safeCount = Math.max(1, Math.floor(Number(count) || 1));
  return safeCount === 1 ? "1 is waiting" : `${safeCount} are waiting`;
}

export function isMatchingPendingRequest(
  item: StockNotifyRequest,
  query: {
    storeId?: string;
    productId?: string;
    productName?: string;
    variantId?: string;
    variantLabel?: string;
  }
): boolean {
  if (item.status !== "pending") return false;
  const cleanStoreId = String(query.storeId || "").trim();
  const cleanProductId = String(query.productId || "").trim();
  const cleanProductName = String(query.productName || "").trim();
  if (!cleanStoreId || item.storeId !== cleanStoreId) return false;
  const sameProduct = cleanProductId
    ? item.productId === cleanProductId
    : item.productName.toLowerCase() === cleanProductName.toLowerCase();
  if (!sameProduct) return false;
  return (
    normalizeVariantKey(item.variantId, item.variantLabel) ===
    normalizeVariantKey(query.variantId, query.variantLabel)
  );
}

export function hasIpRequestedNotify(
  requests: StockNotifyRequest[],
  query: {
    storeId?: string;
    productId?: string;
    productName?: string;
    variantId?: string;
    variantLabel?: string;
  },
  ipKey?: string
): boolean {
  if (!Array.isArray(requests) || requests.length === 0) return false;
  const cleanIp = String(ipKey || "").trim();
  if (!cleanIp) return false;

  return requests.some((item) => {
    if (!isMatchingPendingRequest(item, query)) return false;
    const keys = extractUniqueIpKeys(item.requesterIpKeys);
    return keys.includes(cleanIp);
  });
}

export function recordStockNotifyWithResult(
  existing: StockNotifyRequest[],
  input: StockNotifyInput,
  nowIso: string = new Date().toISOString()
): RecordStockNotifyResult {
  const cleanStoreId = String(input.storeId || "").trim();
  const cleanProductId = String(input.productId || "").trim();
  const cleanProductName = String(input.productName || "").trim();
  const cleanStoreName = String(input.storeName || "").trim() || "Store";
  const safeIpKey = normalizeIpKey(input.requesterIpKey);

  const safeList = normalizeStockNotifyRequests(existing);
  if (!cleanStoreId || (!cleanProductId && !cleanProductName)) {
    return { nextList: safeList, recorded: null, alreadyRequestedByIp: false };
  }

  const matchIdx = safeList.findIndex((item) =>
    isMatchingPendingRequest(item, {
      storeId: cleanStoreId,
      productId: cleanProductId,
      productName: cleanProductName,
      variantId: input.variantId,
      variantLabel: input.variantLabel,
    })
  );

  if (matchIdx >= 0) {
    const matched = safeList[matchIdx];
    const existingKeys = extractUniqueIpKeys(matched.requesterIpKeys);

    // Legacy entry with no IP keys recorded yet -> adopt this IP without inflating count past 1
    if (existingKeys.length === 0) {
      const updated: StockNotifyRequest = {
        ...matched,
        storeName: cleanStoreName,
        productName: cleanProductName || matched.productName,
        productImage: input.productImage || matched.productImage,
        variantId: input.variantId || matched.variantId,
        variantLabel: input.variantLabel || matched.variantLabel,
        requesterIpKeys: [safeIpKey],
        requestCount: 1,
        lastRequestedAt: nowIso,
      };
      safeList.splice(matchIdx, 1);
      return {
        nextList: [updated, ...safeList].slice(0, MAX_STORED_REQUESTS),
        recorded: updated,
        alreadyRequestedByIp: true,
      };
    }

    // Same IP already requested notification for this pending item -> keep unique IP count unchanged
    if (existingKeys.includes(safeIpKey)) {
      const updated: StockNotifyRequest = {
        ...matched,
        storeName: cleanStoreName,
        productName: cleanProductName || matched.productName,
        productImage: input.productImage || matched.productImage,
        variantId: input.variantId || matched.variantId,
        variantLabel: input.variantLabel || matched.variantLabel,
        requesterIpKeys: existingKeys,
        requestCount: existingKeys.length,
        lastRequestedAt: nowIso,
      };
      safeList.splice(matchIdx, 1);
      return {
        nextList: [updated, ...safeList].slice(0, MAX_STORED_REQUESTS),
        recorded: updated,
        alreadyRequestedByIp: true,
      };
    }

    // Distinct new IP requesting the same item -> increment unique IP demand by 1
    const nextIpKeys = [...existingKeys, safeIpKey];
    const updated: StockNotifyRequest = {
      ...matched,
      storeName: cleanStoreName,
      productName: cleanProductName || matched.productName,
      productImage: input.productImage || matched.productImage,
      variantId: input.variantId || matched.variantId,
      variantLabel: input.variantLabel || matched.variantLabel,
      requesterIpKeys: nextIpKeys,
      requestCount: nextIpKeys.length,
      lastRequestedAt: nowIso,
    };
    safeList.splice(matchIdx, 1);
    return {
      nextList: [updated, ...safeList].slice(0, MAX_STORED_REQUESTS),
      recorded: updated,
      alreadyRequestedByIp: false,
    };
  }

  const nextId = `notify_req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newEntry: StockNotifyRequest = {
    id: nextId,
    storeId: cleanStoreId,
    storeName: cleanStoreName,
    productId: cleanProductId || cleanProductName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    productName: cleanProductName || "Product",
    productImage: input.productImage,
    variantId: input.variantId,
    variantLabel: input.variantLabel,
    requesterIpKeys: [safeIpKey],
    requestCount: 1,
    createdAt: nowIso,
    lastRequestedAt: nowIso,
    status: "pending",
  };

  return {
    nextList: [newEntry, ...safeList].slice(0, MAX_STORED_REQUESTS),
    recorded: newEntry,
    alreadyRequestedByIp: false,
  };
}

export function recordStockNotifyRequest(
  existing: StockNotifyRequest[],
  input: StockNotifyInput,
  nowIso: string = new Date().toISOString()
): StockNotifyRequest[] {
  return recordStockNotifyWithResult(existing, input, nowIso).nextList;
}

export function getPendingNotifyRequestsForStore(
  requests: StockNotifyRequest[],
  storeId?: string
): StockNotifyRequest[] {
  if (!Array.isArray(requests) || !storeId) return [];
  return requests
    .filter((item) => item.status === "pending" && item.storeId === storeId)
    .sort((a, b) => {
      const timeDiff = Date.parse(b.lastRequestedAt || b.createdAt) - Date.parse(a.lastRequestedAt || a.createdAt);
      if (!Number.isNaN(timeDiff) && timeDiff !== 0) return timeDiff;
      return (b.requestCount || 1) - (a.requestCount || 1);
    });
}

export function getStoreNotifyAttentionSummary(
  requests: StockNotifyRequest[]
): StoreNotifyAttentionSummary {
  if (!Array.isArray(requests) || requests.length === 0) {
    return {
      totalPendingEntries: 0,
      totalCustomerRequests: 0,
      byStore: [],
    };
  }

  const buckets = new Map<string, StoreNotifyAttentionBucket>();
  let totalPendingEntries = 0;
  let totalCustomerRequests = 0;

  for (const req of requests) {
    if (req.status !== "pending") continue;
    totalPendingEntries += 1;
    const uniqueIps = extractUniqueIpKeys(req.requesterIpKeys);
    const count = uniqueIps.length > 0 ? uniqueIps.length : 1;
    totalCustomerRequests += count;

    const existingBucket = buckets.get(req.storeId);
    const reqTs = req.lastRequestedAt || req.createdAt;
    if (!existingBucket) {
      buckets.set(req.storeId, {
        storeId: req.storeId,
        storeName: req.storeName,
        pendingEntries: 1,
        totalRequests: count,
        latestAt: reqTs,
        requests: [req],
      });
    } else {
      existingBucket.pendingEntries += 1;
      existingBucket.totalRequests += count;
      existingBucket.requests.push(req);
      if (Date.parse(reqTs) > Date.parse(existingBucket.latestAt)) {
        existingBucket.latestAt = reqTs;
      }
    }
  }

  const byStore = Array.from(buckets.values()).sort((a, b) => {
    const tDiff = Date.parse(b.latestAt) - Date.parse(a.latestAt);
    if (!Number.isNaN(tDiff) && tDiff !== 0) return tDiff;
    return b.totalRequests - a.totalRequests;
  });

  return {
    totalPendingEntries,
    totalCustomerRequests,
    byStore,
  };
}

export function resolveStockNotifyRequests(
  requests: StockNotifyRequest[],
  target: {
    id?: string;
    storeId?: string;
    productId?: string;
    variantId?: string;
    nextStatus?: "resolved" | "dismissed";
  },
  nowIso: string = new Date().toISOString()
): StockNotifyRequest[] {
  if (!Array.isArray(requests)) return [];
  const finalStatus: StockNotifyStatus = target.nextStatus || "resolved";

  return requests.map((item) => {
    if (item.status !== "pending") return item;

    if (target.id && item.id === target.id) {
      return { ...item, status: finalStatus, resolvedAt: nowIso };
    }

    if (target.storeId && item.storeId === target.storeId) {
      if (target.productId && item.productId !== target.productId) {
        return item;
      }
      if (target.variantId && item.variantId && item.variantId !== target.variantId) {
        return item;
      }
      if (target.productId || !target.id) {
        return { ...item, status: finalStatus, resolvedAt: nowIso };
      }
    }

    return item;
  });
}

export function loadStockNotifyRequests(bindLegacyIpKey?: string): StockNotifyRequest[] {
  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const raw = window.localStorage.getItem(STOCK_NOTIFY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeStockNotifyRequests(parsed, bindLegacyIpKey);
  } catch {
    return [];
  }
}

export function saveStockNotifyRequests(requests: StockNotifyRequest[]): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(
      STOCK_NOTIFY_STORAGE_KEY,
      JSON.stringify(normalizeStockNotifyRequests(requests).slice(0, MAX_STORED_REQUESTS))
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function loadCachedVisitorIpKey(): string {
  try {
    if (typeof window === "undefined" || !window.localStorage) return "";
    return String(window.localStorage.getItem(STOCK_NOTIFY_IP_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function saveCachedVisitorIpKey(ipKey: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage || !ipKey) return;
    window.localStorage.setItem(STOCK_NOTIFY_IP_STORAGE_KEY, ipKey);
  } catch {
    // Ignore storage errors
  }
}
