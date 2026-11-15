import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateOrderMetrics,
  filterStoreOrders,
  getNextOrderStage,
} from "./ordersLogic.ts";
import { Order } from "../types.ts";

const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-101",
    storeId: "store_1",
    storeName: "Tapis Berbères Ath Yenni",
    date: "2026-05-01T10:00:00Z",
    shopper: {
      name: "Amine Benali",
      email: "amine@example.dz",
      phone: "0550112233",
      wilaya: "Alger",
      wilayaCode: "16",
      commune: "Hydra",
      address: "12 Rue Didouche",
    },
    items: [{ id: "p1", name: "Berber Rug", price: 18000, quantity: 1, imageUrl: "" }],
    total: 18500,
    shippingCost: 500,
    status: "pending",
    paymentMethod: "cod",
    deliveryCompany: "yalidine",
  },
  {
    id: "ORD-102",
    storeId: "store_1",
    storeName: "Tapis Berbères Ath Yenni",
    date: "2026-05-02T12:00:00Z",
    shopper: {
      name: "Sara Mansouri",
      email: "sara@example.dz",
      phone: "0661223344",
      wilaya: "Oran",
      wilayaCode: "31",
      commune: "Es Senia",
      address: "45 Blvd",
    },
    items: [{ id: "p2", name: "Silver Bracelet", price: 9500, quantity: 1, imageUrl: "" }],
    total: 10000,
    shippingCost: 500,
    status: "accepted",
    paymentMethod: "cod",
    deliveryCompany: "zr_express",
  },
  {
    id: "ORD-103",
    storeId: "store_1",
    storeName: "Tapis Berbères Ath Yenni",
    date: "2026-05-03T14:00:00Z",
    shopper: {
      name: "Karim Ziani",
      email: "karim@example.dz",
      phone: "0770334455",
      wilaya: "Constantine",
      wilayaCode: "25",
      commune: "El Khroub",
      address: "88 Cite",
    },
    items: [{ id: "p1", name: "Berber Rug", price: 18000, quantity: 1, imageUrl: "" }],
    total: 18500,
    shippingCost: 500,
    status: "shipped",
    paymentMethod: "eddahabia",
    deliveryCompany: "kazitour",
    trackingCode: "KAZ-987654",
  },
  {
    id: "ORD-104",
    storeId: "store_1",
    storeName: "Tapis Berbères Ath Yenni",
    date: "2026-05-04T16:00:00Z",
    shopper: {
      name: "Nadia Khelifi",
      email: "nadia@example.dz",
      phone: "0555998877",
      wilaya: "Alger",
      wilayaCode: "16",
      commune: "Bab Ezzouar",
      address: "22 Cite",
    },
    items: [{ id: "p2", name: "Silver Bracelet", price: 9500, quantity: 2, imageUrl: "" }],
    total: 19500,
    shippingCost: 500,
    status: "delivered",
    paymentMethod: "cod",
    deliveryCompany: "yalidine",
    returnRequested: true,
  },
];

test("calculateOrderMetrics computes accurate stage counts and revenue", () => {
  const metrics = calculateOrderMetrics(MOCK_ORDERS);
  assert.equal(metrics.counts.all, 4);
  assert.equal(metrics.counts.incoming, 1);
  assert.equal(metrics.counts.processing, 1);
  assert.equal(metrics.counts.shipped, 1);
  assert.equal(metrics.counts.completed, 1);
  assert.equal(metrics.counts.returns, 1);
  // Revenue includes accepted (10000) + shipped (18500) + delivered (19500) = 48000
  assert.equal(metrics.totalRevenue, 48000);
  assert.equal(metrics.avgOrderValue, 16000);
  assert.equal(metrics.deliverySuccessRate, 25);
  assert.equal(metrics.returnRate, 25);
});

test("filterStoreOrders separates incoming, processing, shipped, and completed stages", () => {
  assert.equal(filterStoreOrders(MOCK_ORDERS, { stage: "all" }).length, 4);
  assert.equal(filterStoreOrders(MOCK_ORDERS, { stage: "pending" })[0].id, "ORD-101");
  assert.equal(filterStoreOrders(MOCK_ORDERS, { stage: "accepted" })[0].id, "ORD-102");
  assert.equal(filterStoreOrders(MOCK_ORDERS, { stage: "shipped" })[0].id, "ORD-103");
  assert.equal(filterStoreOrders(MOCK_ORDERS, { stage: "delivered" })[0].id, "ORD-104");
});

test("filterStoreOrders filters by search query, carrier, wilaya, and payment method", () => {
  const byTracking = filterStoreOrders(MOCK_ORDERS, {
    stage: "all",
    searchQuery: "KAZ-987654",
  });
  assert.equal(byTracking.length, 1);
  assert.equal(byTracking[0].id, "ORD-103");

  const byCarrier = filterStoreOrders(MOCK_ORDERS, {
    stage: "all",
    carrierFilter: "yalidine",
  });
  assert.equal(byCarrier.length, 2);

  const byWilaya = filterStoreOrders(MOCK_ORDERS, {
    stage: "all",
    wilayaFilter: "31",
  });
  assert.equal(byWilaya.length, 1);
  assert.equal(byWilaya[0].shopper.name, "Sara Mansouri");
});

test("getNextOrderStage returns proper stage transitions", () => {
  assert.deepEqual(getNextOrderStage("pending")?.nextStatus, "accepted");
  assert.deepEqual(getNextOrderStage("accepted")?.nextStatus, "shipped");
  assert.deepEqual(getNextOrderStage("shipped")?.nextStatus, "delivered");
  assert.equal(getNextOrderStage("delivered"), null);
});
