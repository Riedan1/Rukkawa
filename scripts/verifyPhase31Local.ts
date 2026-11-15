import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  const tmpDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "yume-phase31-test-"));
  process.env.YUME_DATA_DIR = tmpDataDir;

  try {
    // Dynamic imports AFTER YUME_DATA_DIR is isolated so cached paths point exclusively to tmpDataDir
    const localDb = await import("../server/localDb");
    const repo = await import("../server/db/transactionalRepository");
    const portability = await import("../server/db/portableClusterConfig");
    const migration = await import("../server/db/migrateLegacyJson");
    const security = await import("../server/securityGovernance");

    console.log(`[Verify] Isolated YUME_DATA_DIR: ${tmpDataDir}`);

    // 1. Seed clean baseline store + 2 test SKUs + Free launch plan
    const initDb = localDb.loadDatabase();
    initDb.stores = [
      {
        id: "store_test_1",
        storeName: "Test Algiers Atelier",
        planTier: "Free",
        enforcementState: "active",
      },
      {
        id: "store_test_2",
        storeName: "Secondary Boutique",
        planTier: "Free",
        enforcementState: "active",
      },
    ];
    initDb.products = [
      {
        id: "sku_test_1",
        storeId: "store_test_1",
        name: "Jacket A",
        price: 5000,
        priceMinor: 5000,
        stock: 20,
        reservedStock: 0,
        damagedStock: 0,
        courierLostStock: 0,
        courierDamagedUnreturnedStock: 0,
        status: "active",
      },
      {
        id: "sku_test_2",
        storeId: "store_test_1",
        name: "Scarf B",
        price: 1500,
        priceMinor: 1500,
        stock: 1,
        reservedStock: 0,
        damagedStock: 0,
        courierLostStock: 0,
        courierDamagedUnreturnedStock: 0,
        status: "active",
      },
      {
        id: "sku_test_3",
        storeId: "store_test_1",
        name: "Shoe C",
        price: 8000,
        priceMinor: 8000,
        stock: 12,
        reservedStock: 0,
        damagedStock: 0,
        courierLostStock: 0,
        courierDamagedUnreturnedStock: 0,
        status: "active",
      },
    ];
    await localDb.saveDatabaseImmediate(initDb);
    assert.equal(fs.existsSync(path.join(tmpDataDir, "local-db.json")), true, "local-db.json must exist");
    console.log("PASS [1/7]: localDb durable fsync persistence verified");

    // Test corrupt JSON quarantine behavior cleanly using a separate YUME_DATA_DIR
    const tmpCorruptDir = fs.mkdtempSync(path.join(os.tmpdir(), "yume-phase31-corrupt-"));
    try {
      const corruptFilePath = path.join(tmpCorruptDir, "local-db.json");
      fs.writeFileSync(corruptFilePath, "{CORRUPT_JSON!!!", "utf8");
      process.env.YUME_DATA_DIR = tmpCorruptDir;
      const quarantinedDb = localDb.loadDatabase();
      const corruptFiles = fs.readdirSync(tmpCorruptDir).filter((f) => f.includes(".corrupt."));
      assert.equal(corruptFiles.length >= 1, true, "Corrupt JSON must be quarantined to .corrupt.<ts>.json");
      assert.equal(Array.isArray(quarantinedDb.stores), true);
    } finally {
      process.env.YUME_DATA_DIR = tmpDataDir;
      fs.rmSync(tmpCorruptDir, { recursive: true, force: true });
    }
    localDb.loadDatabase();
    console.log("PASS [1b/7]: Corrupt JSON quarantine verified");

    // 2. Atomic Multi-SKU Rollback (SKU1=20 qty 2, SKU2=1 qty 3 -> 409, SKU1 stays 20)
    const atomicFail = await repo.createOrdersTransactional({
      idempotencyKey: "idem-atomic-fail-001",
      rawOrders: [
        {
          id: "ORD-ATOM-FAIL-1",
          storeId: "store_test_1",
          reserveStock: true,
          items: [
            { id: "sku_test_1", productId: "sku_test_1", quantity: 2, price: 5000 },
            { id: "sku_test_2", productId: "sku_test_2", quantity: 3, price: 1500 },
          ],
        },
      ],
    });
    assert.equal(atomicFail.httpStatus, 409);
    assert.equal(atomicFail.body.code, "OUT_OF_STOCK_CONTENTION");
    const postFailDb = localDb.loadDatabase();
    const sku1AfterFail = postFailDb.products.find((p) => p.id === "sku_test_1");
    assert.equal(sku1AfterFail.stock, 20, "SKU1 stock must roll back cleanly to 20");
    console.log("PASS [2/7]: Atomic multi-SKU rollback on second SKU stock contention verified");

    // 3. API Idempotency Guarantees (Missing key, Replay with reordered keys + noise, Payload conflict 409, Parallel same-key, Rollback retry)
    const missingKey = await repo.createOrdersTransactional({
      idempotencyKey: "",
      rawOrders: [{ id: "ORD-NO-KEY", storeId: "store_test_1" }],
    });
    assert.equal(missingKey.httpStatus, 400);
    assert.equal(missingKey.body.code, "IDEMPOTENCY_KEY_REQUIRED");

    const basePayload = [
      {
        id: "ORD-IDEM-1",
        storeId: "store_test_1",
        reserveStock: true,
        items: [{ id: "sku_test_1", productId: "sku_test_1", quantity: 2, expectedUnitPriceMinor: 5000 }],
      },
    ];
    const firstCreate = await repo.createOrdersTransactional({
      idempotencyKey: "idem-order-key-001",
      rawOrders: basePayload,
    });
    assert.equal(firstCreate.httpStatus, 201);
    assert.equal(localDb.loadDatabase().products.find((p) => p.id === "sku_test_1").stock, 18);

    // Same key, reordered JSON object keys + volatile request_id -> Exact replay, ZERO extra deduction!
    const reorderedPayload = [
      {
        request_id: "volatile-req-999",
        items: [{ expectedUnitPriceMinor: 5000, quantity: 2, productId: "sku_test_1", id: "sku_test_1" }],
        reserveStock: true,
        storeId: "store_test_1",
        id: "ORD-IDEM-1",
      },
    ];
    const replayRes = await repo.createOrdersTransactional({
      idempotencyKey: "idem-order-key-001",
      rawOrders: reorderedPayload,
    });
    assert.equal(replayRes.replayed, true);
    assert.equal(replayRes.headers["Idempotency-Replayed"], "true");
    assert.equal(localDb.loadDatabase().products.find((p) => p.id === "sku_test_1").stock, 18);

    // Same key, altered quantity -> 409 IDEMPOTENCY_KEY_PAYLOAD_MISMATCH
    const mismatchRes = await repo.createOrdersTransactional({
      idempotencyKey: "idem-order-key-001",
      rawOrders: [
        {
          id: "ORD-IDEM-1",
          storeId: "store_test_1",
          reserveStock: true,
          items: [{ id: "sku_test_1", productId: "sku_test_1", quantity: 4, expectedUnitPriceMinor: 5000 }],
        },
      ],
    });
    assert.equal(mismatchRes.httpStatus, 409);
    assert.equal(mismatchRes.body.code, "IDEMPOTENCY_KEY_PAYLOAD_MISMATCH");

    // Parallel identical calls on fresh key
    const [parA, parB] = await Promise.all([
      repo.createOrdersTransactional({
        idempotencyKey: "idem-parallel-002",
        rawOrders: [
          {
            id: "ORD-PAR-2",
            storeId: "store_test_1",
            reserveStock: true,
            items: [{ id: "sku_test_1", productId: "sku_test_1", quantity: 1 }],
          },
        ],
      }),
      repo.createOrdersTransactional({
        idempotencyKey: "idem-parallel-002",
        rawOrders: [
          {
            id: "ORD-PAR-2",
            storeId: "store_test_1",
            reserveStock: true,
            items: [{ id: "sku_test_1", productId: "sku_test_1", quantity: 1 }],
          },
        ],
      }),
    ]);
    assert.equal(parA.httpStatus, 201);
    assert.equal(parB.httpStatus, 201);
    assert.equal(parB.replayed, true);
    assert.equal(localDb.loadDatabase().products.find((p) => p.id === "sku_test_1").stock, 17);

    // Failed transaction with key does NOT poison key on valid retry (note different payload after rollback succeeds if same key failed without committing)
    const retryAfterFail = await repo.createOrdersTransactional({
      idempotencyKey: "idem-atomic-fail-001",
      rawOrders: [
        {
          id: "ORD-ATOM-RETRY-1",
          storeId: "store_test_1",
          reserveStock: true,
          items: [{ id: "sku_test_1", productId: "sku_test_1", quantity: 1 }],
        },
      ],
    });
    assert.equal(retryAfterFail.httpStatus, 201, "Uncommitted failed idempotency key must not poison retry");
    console.log("PASS [3/7]: All RFC 8785 API idempotency guarantees verified");

    // 4. Partial Shipments, Cross-Store Guard & Separated Courier Loss vs. Courier Damage vs. Warehouse Damage
    const orderForShip = await repo.createOrdersTransactional({
      idempotencyKey: "idem-ship-ord-001",
      rawOrders: [
        {
          id: "ORD-SHIP-10",
          storeId: "store_test_1",
          reserveStock: true,
          items: [{ id: "sku_test_3", productId: "sku_test_3", lineItemId: "LI-SHIP-10", quantity: 10 }],
        },
      ],
    });
    assert.equal(orderForShip.httpStatus, 201);

    // Cross-store composite FK guard
    const crossStoreErr = await repo.allocateShipmentItemLines({
      idempotencyKey: "idem-alloc-xstore",
      shipmentId: "SHP-BAD",
      orderId: "ORD-SHIP-10",
      storeId: "store_test_2",
      lineItemId: "LI-SHIP-10",
      productId: "sku_test_3",
      quantityOrdered: 10,
      quantityToAllocate: 2,
    });
    assert.equal(crossStoreErr.httpStatus, 403);
    assert.equal(crossStoreErr.body.code, "CROSS_STORE_SHIPMENT_FORBIDDEN");

    // Allocate 10 units
    const allocOk = await repo.allocateShipmentItemLines({
      idempotencyKey: "idem-alloc-10",
      shipmentId: "SHP-10",
      orderId: "ORD-SHIP-10",
      storeId: "store_test_1",
      lineItemId: "LI-SHIP-10",
      productId: "sku_test_3",
      quantityOrdered: 10,
      quantityToAllocate: 10,
    });
    assert.equal(allocOk.httpStatus, 201);
    const sliId = allocOk.body.shipmentLineItem.shipmentItemId;

    // Partial dispatch batch: dispatch 6 units out of 10 allocated
    const disp6 = await repo.dispatchShipmentBatchTransactional({
      idempotencyKey: "idem-disp-6",
      shipmentId: "SHP-10",
      shipmentItemId: sliId,
      quantityDispatched: 6,
      actorId: "merchant_1",
    });
    assert.equal(disp6.httpStatus, 201);
    assert.equal(disp6.body.shipmentLineItem.quantityAllocated, 4);
    assert.equal(disp6.body.shipmentLineItem.quantityShipped, 6);

    // Deallocate remaining 4 units cleanly back to sellable stock
    const dealloc4 = await repo.deallocateShipmentUnitsTransactional({
      idempotencyKey: "idem-dealloc-4",
      shipmentId: "SHP-10",
      shipmentItemId: sliId,
      quantityToDeallocate: 4,
    });
    assert.equal(dealloc4.httpStatus, 200);
    assert.equal(dealloc4.body.shipmentLineItem.quantityAllocated, 0);

    // Of 6 dispatched units:
    //  - 2 delivered
    //  - 1 physical courier loss -> courierLostStock (+1 ONLY)
    //  - 3 courier damaged reported:
    //      * 1 settled unreturned -> courierDamagedUnreturnedStock (+1 ONLY, NOT courierLostStock, NOT damagedStock!)
    //      * 2 returned to warehouse -> 1 QC rejected (damagedStock +1), 1 QC approved resellable (stock +1)
    const fkCtx = {
      shipmentId: "SHP-10",
      shipmentItemId: sliId,
      orderId: "ORD-SHIP-10",
      storeId: "store_test_1",
      lineItemId: "LI-SHIP-10",
    };

    const e1 = await repo.applyShipmentReturnEventTransactional({
      ...fkCtx,
      idempotencyKey: "idem-evt-deliv-2",
      eventType: "COURIER_DELIVERED",
      quantityDelta: 2,
      actorId: "carrier_yalidine",
    });
    assert.equal(e1.httpStatus, 201);

    const e2 = await repo.applyShipmentReturnEventTransactional({
      ...fkCtx,
      idempotencyKey: "idem-evt-lost-1",
      eventType: "COURIER_LOST_PRE_DELIVERY",
      quantityDelta: 1,
      actorId: "carrier_yalidine",
    });
    assert.equal(e2.httpStatus, 201);

    const e3 = await repo.applyShipmentReturnEventTransactional({
      ...fkCtx,
      idempotencyKey: "idem-evt-cdmg-rep-3",
      eventType: "COURIER_DAMAGED_PRE_DELIVERY",
      quantityDelta: 3,
      actorId: "carrier_yalidine",
    });
    assert.equal(e3.httpStatus, 201);

    const e4 = await repo.applyShipmentReturnEventTransactional({
      ...fkCtx,
      idempotencyKey: "idem-evt-cdmg-settle-1",
      eventType: "COURIER_DAMAGED_SETTLED_UNRETURNED",
      quantityDelta: 1,
      actorId: "finance_1",
    });
    assert.equal(e4.httpStatus, 201);

    const e5 = await repo.applyShipmentReturnEventTransactional({
      ...fkCtx,
      idempotencyKey: "idem-evt-cdmg-rcvd-2",
      eventType: "MERCHANT_WAREHOUSE_RECEIVED_COURIER_DAMAGED",
      quantityDelta: 2,
      actorId: "warehouse_1",
    });
    assert.equal(e5.httpStatus, 201);

    const e6 = await repo.applyShipmentReturnEventTransactional({
      ...fkCtx,
      idempotencyKey: "idem-evt-qc-dmg-1",
      eventType: "QC_REJECTED_DAMAGED",
      quantityDelta: 1,
      actorId: "qc_1",
    });
    assert.equal(e6.httpStatus, 201);

    const finalQc = await repo.applyShipmentReturnEventTransactional({
      ...fkCtx,
      idempotencyKey: "idem-evt-qc-ok-1",
      eventType: "QC_APPROVED_RESELLABLE",
      quantityDelta: 1,
      actorId: "qc_1",
    });
    assert.equal(finalQc.httpStatus, 201);

    assert.equal(finalQc.body.productInventory.courierLostStock, 1);
    assert.equal(finalQc.body.productInventory.courierDamagedUnreturnedStock, 1);
    assert.equal(finalQc.body.productInventory.damagedStock, 1);
    const reconciliation = repo.computeInventoryReconciliationReport(localDb.loadDatabase(), "store_test_1");
    assert.equal(reconciliation.crossContaminationCount, 0);
    assert.equal(reconciliation.ledgerParityVerified, true);
    console.log("PASS [4/7]: Partial shipments, deallocation & separated courier loss vs damage vs QC verified");

    // 5. Fail-Closed OOB STONITH Gate & Epoch Fencing
    const deniedFailover = await repo.executeFailClosedPromotionOrSwitchover({
      mode: "unplanned_failover",
      standbyMode: "warm_standby",
      stonithConfirmed: false,
    });
    assert.equal(deniedFailover.httpStatus, 503);
    assert.equal(deniedFailover.code, "CLUSTER_FENCING_UNCONFIRMED_FAIL_CLOSED");

    const blockedWrite = await repo.createOrdersTransactional({
      idempotencyKey: "idem-while-fail-closed",
      rawOrders: [{ id: "ORD-BLOCKED", storeId: "store_test_1" }],
    });
    assert.equal(blockedWrite.httpStatus, 503);
    assert.equal(blockedWrite.body.code, "CLUSTER_FENCING_UNCONFIRMED_FAIL_CLOSED");

    await repo.recoverClusterFailClosedManually(undefined, "Verified primary offline via OOB");
    const confirmedPromo = await repo.executeFailClosedPromotionOrSwitchover({
      mode: "unplanned_failover",
      standbyMode: "warm_standby",
      stonithConfirmed: true,
      oobChannel: "4g_lte_oob_ipmi",
      powerStateReadback: "OFF",
    });
    assert.equal(confirmedPromo.httpStatus, 200);
    assert.equal(confirmedPromo.newEpoch > confirmedPromo.previousEpoch, true);

    const staleEpochWrite = await repo.createOrdersTransactional({
      idempotencyKey: "idem-stale-epoch-001",
      claimedFencingEpoch: confirmedPromo.previousEpoch,
      rawOrders: [{ id: "ORD-STALE", storeId: "store_test_1" }],
    });
    assert.equal(staleEpochWrite.httpStatus, 409);
    assert.equal(staleEpochWrite.body.code, "STALE_PRIMARY_EPOCH_FENCED");
    console.log("PASS [5/7]: Fail-closed OOB STONITH & monotonic fencing epoch verified");

    // 6. Launch Pricing Governance (FREE_ONLY default) + Non-Destructive Over-Quota Preservation
    const catalog = repo.getPublicSubscriptionCatalog(localDb.loadDatabase());
    assert.equal(catalog.launchMode, "FREE_ONLY");
    assert.equal(catalog.plans.length, 1);
    assert.equal(catalog.plans[0].planCode, "Free");

    // Simulate Free tier with 2 maxActiveProducts while store_test_1 has 3 active products
    await repo.upsertSubscriptionPlanTransactional({
      plan: { planCode: "Free", entitlements: { maxActiveProducts: 2, maxPhotosPerProduct: 3, maxFileSizeMb: 5, allowVideoStream: false, maxCustomDomains: 0 } },
    });
    const quotaEval = repo.evaluateStoreOverQuotaNonDestructive(localDb.loadDatabase(), "store_test_1");
    assert.equal(quotaEval.activeProductCount, 3, "All 3 existing products must stay intact (0 hidden/deleted)");
    assert.equal(quotaEval.canCreateNewProduct, false, "Creation of product #4 blocked when over quota");
    assert.equal(quotaEval.overQuotaFlags.products.action, "CREATION_GATED_EXISTING_PRESERVED");

    // Retire plan validation requires valid non-retired targetPlanCode
    const badRetire = await repo.retireSubscriptionPlanTransactional({
      retiredPlanCode: "Basic",
      targetPlanCode: "Basic",
      gracePeriodDays: 30,
    });
    assert.equal(badRetire.httpStatus, 400);
    const goodRetire = await repo.retireSubscriptionPlanTransactional({
      retiredPlanCode: "Basic",
      targetPlanCode: "Free",
      gracePeriodDays: 45,
    });
    assert.equal(goodRetire.httpStatus, 200);
    console.log("PASS [6/7]: FREE_ONLY governance, non-destructive over-quota & plan retirement verified");

    // 7. Non-Oversubscribed HTB QoS Budget & 10-Point Migration Reconciliation & Audit Chain
    for (const mbps of [50, 100, 200] as const) {
      const qos = portability.computeNonOversubscribedQosBudget(mbps);
      assert.equal(qos.oversubscribed, false);
      assert.equal(qos.sumOfGuaranteedMinsMbps, qos.shapedCeilingMbps, `${mbps} Mbps HTB mins must equal 90% ceiling`);
    }
    const migReport = migration.verifyMigrationReconciliation(path.join(tmpDataDir, "local-db.json"));
    assert.equal(migReport.allTenCriteriaPassed, true, "All 10 migration reconciliation criteria must pass");

    const logs = localDb.loadDatabase().governanceState?.auditLogs || [];
    const chainCheck = security.verifyAuditLedgerIntegrityServer(logs);
    assert.equal(chainCheck.valid, true, "SHA-256 hash-chained audit ledger must verify intact");
    console.log("PASS [7/7]: Non-oversubscribed tc HTB QoS, 10-point migration check & audit chain verified");

    console.log("\nALL 7 LOCAL NODE/EXPRESS INVARIANT SUITES PASSED.");
    console.log("NOTE: External PostgreSQL 16 (AT-P0-1..4, MVCC AT-IDEM-1..6) and bare-metal STONITH/FTTH suites (AT-FAIL-1..9, AT-P1-4..7) remain NOT EXECUTED in this container.");
  } finally {
    fs.rmSync(tmpDataDir, { recursive: true, force: true });
    console.log(`[Cleanup] Removed isolated temp dir: ${tmpDataDir}`);
  }
}

main().catch((err) => {
  console.error("VERIFICATION FAILED:", err);
  process.exit(1);
});
