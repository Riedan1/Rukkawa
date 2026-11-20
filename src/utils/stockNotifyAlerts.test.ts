import test from "node:test";
import assert from "node:assert/strict";
import {
  recordStockNotifyRequest,
  recordStockNotifyWithResult,
  normalizeStockNotifyRequests,
  hasIpRequestedNotify,
  formatWaitingCountLabel,
  getPendingNotifyRequestsForStore,
  getStoreNotifyAttentionSummary,
  resolveStockNotifyRequests,
  StockNotifyRequest,
} from "./stockNotifyAlerts";

test("recordStockNotifyRequest allows 1 count per IP and only increments for distinct IPs", () => {
  let list: StockNotifyRequest[] = [];

  const first = recordStockNotifyWithResult(
    list,
    {
      storeId: "store_6",
      storeName: "Oran Tech Express",
      productId: "p_6_2",
      productName: "Smartphone Flagship DZ Pro - Tensor G3",
      variantId: "v_6_2_3",
      variantLabel: "16 GB / 512 GB (Out of stock)",
      requesterIpKey: "ip_alpha",
    },
    "2026-11-16T15:00:00.000Z"
  );
  list = first.nextList;

  assert.equal(first.alreadyRequestedByIp, false);
  assert.equal(list.length, 1);
  assert.equal(list[0].status, "pending");
  assert.equal(list[0].requestCount, 1);
  assert.deepEqual(list[0].requesterIpKeys, ["ip_alpha"]);
  assert.equal(formatWaitingCountLabel(list[0].requestCount), "1 is waiting");

  // Same IP clicks Notify Me repeatedly -> MUST remain 1 is waiting (no fake demand!)
  const repeatSameIp = recordStockNotifyWithResult(
    list,
    {
      storeId: "store_6",
      storeName: "Oran Tech Express",
      productId: "p_6_2",
      productName: "Smartphone Flagship DZ Pro - Tensor G3",
      variantId: "v_6_2_3",
      variantLabel: "16 GB / 512 GB (Out of stock)",
      requesterIpKey: "ip_alpha",
    },
    "2026-11-16T15:02:00.000Z"
  );
  list = repeatSameIp.nextList;

  assert.equal(repeatSameIp.alreadyRequestedByIp, true);
  assert.equal(list.length, 1);
  assert.equal(list[0].requestCount, 1);
  assert.deepEqual(list[0].requesterIpKeys, ["ip_alpha"]);

  // Second distinct IP clicks Notify Me on the exact same variant -> increments to 2
  const secondIp = recordStockNotifyWithResult(
    list,
    {
      storeId: "store_6",
      storeName: "Oran Tech Express",
      productId: "p_6_2",
      productName: "Smartphone Flagship DZ Pro - Tensor G3",
      variantId: "v_6_2_3",
      variantLabel: "16 GB / 512 GB (Out of stock)",
      requesterIpKey: "ip_beta",
    },
    "2026-11-16T15:05:00.000Z"
  );
  list = secondIp.nextList;

  assert.equal(secondIp.alreadyRequestedByIp, false);
  assert.equal(list.length, 1);
  assert.equal(list[0].requestCount, 2);
  assert.deepEqual(list[0].requesterIpKeys, ["ip_alpha", "ip_beta"]);
  assert.equal(formatWaitingCountLabel(list[0].requestCount), "2 are waiting");

  // Second IP repeats -> remains 2
  list = recordStockNotifyRequest(
    list,
    {
      storeId: "store_6",
      storeName: "Oran Tech Express",
      productId: "p_6_2",
      productName: "Smartphone Flagship DZ Pro - Tensor G3",
      variantId: "v_6_2_3",
      variantLabel: "16 GB / 512 GB (Out of stock)",
      requesterIpKey: "ip_beta",
    },
    "2026-11-16T15:06:00.000Z"
  );
  assert.equal(list[0].requestCount, 2);

  // Check hasIpRequestedNotify accuracy
  assert.equal(
    hasIpRequestedNotify(
      list,
      { storeId: "store_6", productId: "p_6_2", variantId: "v_6_2_3" },
      "ip_alpha"
    ),
    true
  );
  assert.equal(
    hasIpRequestedNotify(
      list,
      { storeId: "store_6", productId: "p_6_2", variantId: "v_6_2_3" },
      "ip_gamma"
    ),
    false
  );
});

test("normalizeStockNotifyRequests clamps legacy pre-IP inflated counts back to 1", () => {
  const legacy: StockNotifyRequest[] = [
    {
      id: "notify_legacy_1",
      storeId: "store_6",
      storeName: "Oran Tech Express",
      productId: "p_6_2",
      productName: "Xcvxvxbxcb cvnbxcvbc cncvb",
      variantLabel: "Porcelain • L",
      requestCount: 3,
      createdAt: "2026-11-17T10:00:00.000Z",
      lastRequestedAt: "2026-11-17T10:05:00.000Z",
      status: "pending",
    },
  ];

  const normalized = normalizeStockNotifyRequests(legacy);
  assert.equal(normalized[0].requestCount, 1);

  // Re-clicking from the user's IP adopts the entry while keeping requestCount === 1
  const afterReclick = recordStockNotifyWithResult(normalized, {
    storeId: "store_6",
    storeName: "Oran Tech Express",
    productId: "p_6_2",
    productName: "Xcvxvxbxcb cvnbxcvbc cncvb",
    variantLabel: "Porcelain • L",
    requesterIpKey: "ip_alpha",
  });
  assert.equal(afterReclick.alreadyRequestedByIp, true);
  assert.equal(afterReclick.nextList[0].requestCount, 1);
  assert.deepEqual(afterReclick.nextList[0].requesterIpKeys, ["ip_alpha"]);
});

test("getPendingNotifyRequestsForStore filters and orders pending requests per store", () => {
  let list: StockNotifyRequest[] = [];
  list = recordStockNotifyRequest(
    list,
    {
      storeId: "store_6",
      storeName: "Oran Tech Express",
      productId: "p_6_2",
      productName: "Smartphone Flagship DZ Pro - Tensor G3",
      variantId: "v_6_2_3",
      variantLabel: "16 GB / 512 GB",
      requesterIpKey: "ip_alpha",
    },
    "2026-11-16T15:00:00.000Z"
  );
  list = recordStockNotifyRequest(
    list,
    {
      storeId: "store_1",
      storeName: "Store One",
      productId: "p_1_1",
      productName: "Item One",
      requesterIpKey: "ip_alpha",
    },
    "2026-11-16T15:01:00.000Z"
  );

  const store6Alerts = getPendingNotifyRequestsForStore(list, "store_6");
  assert.equal(store6Alerts.length, 1);
  assert.equal(store6Alerts[0].productId, "p_6_2");

  const summary = getStoreNotifyAttentionSummary(list);
  assert.equal(summary.totalPendingEntries, 2);
  assert.equal(summary.totalCustomerRequests, 2);
  assert.equal(summary.byStore.length, 2);
  assert.equal(summary.byStore[0].storeId, "store_1");
});

test("resolveStockNotifyRequests marks specific request or store product requests resolved", () => {
  let list: StockNotifyRequest[] = [];
  list = recordStockNotifyRequest(
    list,
    {
      storeId: "store_6",
      storeName: "Oran Tech Express",
      productId: "p_6_2",
      productName: "Smartphone Flagship DZ Pro - Tensor G3",
      variantId: "v_6_2_3",
      variantLabel: "16 GB / 512 GB",
      requesterIpKey: "ip_alpha",
    },
    "2026-11-16T15:00:00.000Z"
  );
  list = recordStockNotifyRequest(
    list,
    {
      storeId: "store_6",
      storeName: "Oran Tech Express",
      productId: "p_6_1",
      productName: "Mechanical Keyboard",
      requesterIpKey: "ip_alpha",
    },
    "2026-11-16T15:02:00.000Z"
  );

  // Resolve only p_6_2
  const afterResolve = resolveStockNotifyRequests(
    list,
    { storeId: "store_6", productId: "p_6_2" },
    "2026-11-16T15:10:00.000Z"
  );

  const pendingAfter = getPendingNotifyRequestsForStore(afterResolve, "store_6");
  assert.equal(pendingAfter.length, 1);
  assert.equal(pendingAfter[0].productId, "p_6_1");

  // Dismiss remaining by id
  const afterDismiss = resolveStockNotifyRequests(afterResolve, {
    id: pendingAfter[0].id,
    nextStatus: "dismissed",
  });
  assert.equal(getPendingNotifyRequestsForStore(afterDismiss, "store_6").length, 0);
});
