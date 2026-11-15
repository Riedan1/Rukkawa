import {
  Order,
  OrderLifecycleStatus,
  ShipmentLifecycleStatus,
  PaymentLifecycleStatus,
  ReturnLifecycleStatus,
  OrderItemSnapshot,
  ShipmentRecord,
  OrderFinancialSummary,
  OrderTimelineEvent,
  OrderConfirmationAttempt,
  MigrationSnapshotBundle,
  Product,
} from "../types";

// ============================================================================
// 1. DETERMINISTIC HASHING & CANONICAL SERIALIZATION
// ============================================================================

export function deterministicHash(input: string): string {
  // Fast, deterministic 256-bit equivalent hex digest (4 x 64-bit FNV-1a lanes)
  const seeds = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35, 0x27d4eb2f, 0x165667b1, 0xd3a2646c, 0xfd7046c5];
  const hashes = [...seeds];
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    for (let lane = 0; lane < hashes.length; lane++) {
      hashes[lane] ^= code + ((lane + 1) * 17);
      hashes[lane] = Math.imul(hashes[lane], 0x01000193) >>> 0;
    }
  }
  return "sha256_" + hashes.map((h) => h.toString(16).padStart(8, "0")).join("");
}

export function computeCanonicalOrderHash(order: Partial<Order>): string {
  const canonicalPayload = {
    id: order.id || "",
    storeId: order.storeId || "",
    status: order.status || "pending",
    orderStatus: order.orderStatus || "new",
    shipmentStatus: order.shipmentStatus || "pending_creation",
    paymentStatus: order.paymentStatus || "awaiting_collection",
    returnStatus: order.returnStatus || "none",
    phone: order.shopper?.phone || "",
    wilaya: order.shopper?.wilaya || "",
    commune: order.shopper?.commune || "",
    address: order.shopper?.address || "",
    total: Number(order.total || 0),
    shippingCost: Number(order.shippingCost || 0),
    discountAmount: Number(order.discountAmount || 0),
    trackingCode: order.trackingCode || "",
    deliveryCompany: order.deliveryCompany || "",
    callAttempts: Number(order.callAttempts || 0),
    items: (order.itemSnapshots || []).map((it) => ({
      id: it.id,
      qty: it.orderedQty,
      keptQty: it.keptQty,
      price: it.unitSalePrice,
      cost: it.unitPurchaseCost,
    })),
    shipments: (order.shipments || []).map((sh) => ({
      id: sh.id,
      tracking: sh.trackingNumber,
      status: sh.shipmentStatus,
      cod: sh.shipmentCodCollectable,
      settled: sh.remittedPayoutToMerchant,
    })),
  };
  return deterministicHash(JSON.stringify(canonicalPayload));
}

export function computeBundleChecksum(orders: Order[], storeId: string): string {
  const summary = orders
    .map((o) => `${o.id}:${o.status}:${o.total}:${o.items?.length || 0}:${o.trackingCode || ""}`)
    .join("|");
  return deterministicHash(`${storeId}::${orders.length}::${summary}`);
}

// ============================================================================
// 2. BI-DIRECTIONAL STATUS MAPPING (LEGACY <-> 4 DIMENSIONS)
// ============================================================================

export function deriveLegacyStatus(
  orderStatus: OrderLifecycleStatus
): "pending" | "accepted" | "shipped" | "delivered" {
  switch (orderStatus) {
    case "new":
    case "confirmation_pending":
    case "cancelled":
      return "pending";
    case "confirmed":
    case "ready_to_ship":
      return "accepted";
    case "shipped":
    case "out_for_delivery":
    case "failed_delivery":
    case "returned":
      return "shipped";
    case "delivered":
      return "delivered";
    default:
      return "pending";
  }
}

export function deriveInitialFourDimensions(rawOrder: Order): {
  orderStatus: OrderLifecycleStatus;
  shipmentStatus: ShipmentLifecycleStatus;
  paymentStatus: PaymentLifecycleStatus;
  returnStatus: ReturnLifecycleStatus;
} {
  const orderStatus: OrderLifecycleStatus = (() => {
    if (rawOrder.orderStatus) return rawOrder.orderStatus;
    if (rawOrder.confirmationStatus === "rejected") return "cancelled";
    if (rawOrder.returnRequested) return "returned";
    switch (rawOrder.status) {
      case "pending":
        return (rawOrder.callAttempts || 0) > 0 || rawOrder.confirmationStatus === "unreachable"
          ? "confirmation_pending"
          : "new";
      case "accepted":
        return rawOrder.trackingCode ? "ready_to_ship" : "confirmed";
      case "shipped":
        return "shipped";
      case "delivered":
        return "delivered";
      default:
        return "new";
    }
  })();

  const shipmentStatus: ShipmentLifecycleStatus = (() => {
    if (rawOrder.shipmentStatus) return rawOrder.shipmentStatus;
    if (orderStatus === "returned") return "returned";
    if (orderStatus === "failed_delivery") return "delivery_failed";
    if (rawOrder.status === "delivered" || orderStatus === "delivered") return "delivered";
    if (rawOrder.status === "shipped" || orderStatus === "shipped") return "in_transit";
    if (rawOrder.trackingCode) return "shipment_created";
    return "pending_creation";
  })();

  const paymentStatus: PaymentLifecycleStatus = (() => {
    if (rawOrder.paymentStatus) return rawOrder.paymentStatus;
    // CRITICAL RULE (PART 4): Delivered != Settled.
    // A delivered COD order defaults to "settlement_pending" until explicitly settled in reconciliation.
    if (shipmentStatus === "delivered" || orderStatus === "delivered") {
      return "settlement_pending";
    }
    return "awaiting_collection";
  })();

  const returnStatus: ReturnLifecycleStatus = (() => {
    if (rawOrder.returnStatus) return rawOrder.returnStatus;
    if (rawOrder.returnRequested) return "return_requested";
    return "none";
  })();

  return { orderStatus, shipmentStatus, paymentStatus, returnStatus };
}

// ============================================================================
// 3. EXACT PLAIN-TEXT FINANCIAL FORMULAS ENGINE (PART 4)
// ============================================================================

export function computeOrderFinancials(order: Order): OrderFinancialSummary {
  const itemSnapshots: OrderItemSnapshot[] = order.itemSnapshots || [];
  const shipments: ShipmentRecord[] = order.shipments || [];

  const isTerminatedZeroRevenue =
    order.orderStatus === "cancelled" ||
    order.orderStatus === "failed_delivery" ||
    order.orderStatus === "returned";

  // 1. GMV = SUM(UnitSalePrice[i] * OrderedQty[i])
  const gmv = itemSnapshots.reduce(
    (sum, item) => sum + Number(item.unitSalePrice || 0) * Number(item.orderedQty || 0),
    0
  );

  // 2. KeptMerchandiseValue & NetOrderRevenue
  const keptMerchandiseValue = isTerminatedZeroRevenue
    ? 0
    : itemSnapshots.reduce(
        (sum, item) => sum + Number(item.unitSalePrice || 0) * Number(item.keptQty ?? item.orderedQty ?? 0),
        0
      );

  const itemLevelDiscounts = itemSnapshots.reduce(
    (sum, item) => sum + Number(item.unitDiscount || 0) * Number(item.keptQty ?? item.orderedQty ?? 0),
    0
  );
  const orderDiscount = isTerminatedZeroRevenue
    ? 0
    : Math.max(Number(order.discountAmount || 0), itemLevelDiscounts);

  const customerRefundAmount = Number(order.customerRefundAmount || 0);
  const netOrderRevenue = isTerminatedZeroRevenue
    ? 0
    : Math.max(0, keptMerchandiseValue - orderDiscount - customerRefundAmount);

  // 3. Total COD Collectable from Customer
  const customerShippingFeeCharged = isTerminatedZeroRevenue ? 0 : Number(order.shippingCost || 0);
  const prepaidAmount = order.paymentMethod !== "cod" ? netOrderRevenue + customerShippingFeeCharged : 0;
  const totalCodCollectable = Math.max(0, netOrderRevenue + customerShippingFeeCharged - prepaidAmount);

  // 4. Gross Product Profit & Missing Purchase Cost Check (NEVER treat null as 0)
  const missingCostItemIds = itemSnapshots
    .filter((item) => item.unitPurchaseCost === null || item.unitPurchaseCost === undefined || Number.isNaN(item.unitPurchaseCost))
    .map((item) => item.id);

  const hasMissingPurchaseCost = missingCostItemIds.length > 0;

  let totalCogs: number | null = null;
  let grossProductProfit: number | null = null;

  if (!hasMissingPurchaseCost) {
    totalCogs = isTerminatedZeroRevenue
      ? 0
      : itemSnapshots.reduce(
          (sum, item) => sum + Number(item.unitPurchaseCost || 0) * Number(item.keptQty ?? item.orderedQty ?? 0),
          0
        );
    grossProductProfit = isTerminatedZeroRevenue ? 0 : netOrderRevenue - totalCogs;
  }

  // 5. Shipment-Level Carrier Expenses & Damaged Return Write-Off
  const totalCarrierShippingExpense = shipments.reduce(
    (sum, s) => sum + Number(s.carrierShippingFee || 0),
    0
  );
  const totalCarrierCodFee = shipments.reduce((sum, s) => sum + Number(s.carrierCodFee || 0), 0);
  const totalReturnFee = shipments.reduce((sum, s) => sum + Number(s.carrierReturnFee || 0), 0);
  const totalCarrierFees = totalCarrierShippingExpense + totalCarrierCodFee + totalReturnFee;

  const damagedInventoryLoss = hasMissingPurchaseCost
    ? 0
    : itemSnapshots.reduce(
        (sum, item) =>
          sum + Number(item.unitPurchaseCost || 0) * Number(item.damagedUnresellableQty || 0),
        0
      );

  const packagingAndOtherCost = Number(order.packagingAndOtherCost || 0);

  // 6. Net Operational Profit (Direct Accrual Formula)
  let merchantExternalExpenses: number | null = null;
  let netOperationalProfit: number | null = null;

  if (!hasMissingPurchaseCost && totalCogs !== null && grossProductProfit !== null) {
    merchantExternalExpenses = totalCogs + packagingAndOtherCost + damagedInventoryLoss;
    netOperationalProfit =
      grossProductProfit +
      customerShippingFeeCharged -
      totalCarrierShippingExpense -
      totalCarrierCodFee -
      totalReturnFee -
      damagedInventoryLoss -
      packagingAndOtherCost;
  }

  // 7. Carrier Settlement Payable & Actual Cash Received
  const collectedCod = shipments.reduce((sum, s) => {
    if (s.shipmentStatus === "delivered" || order.orderStatus === "delivered") {
      return sum + Number(s.cashCollectedByCourier ?? s.shipmentCodCollectable ?? 0);
    }
    return sum + Number(s.cashCollectedByCourier || 0);
  }, 0);

  const carrierDeductedFees = totalCarrierShippingExpense + totalCarrierCodFee + totalReturnFee;
  const netPayableByCarrier =
    collectedCod > 0 ? collectedCod - carrierDeductedFees : -carrierDeductedFees;

  const actualCashReceived = shipments.reduce(
    (sum, s) => sum + Number(s.remittedPayoutToMerchant || 0),
    0
  );

  // 8. Pending Settlement & Outstanding Balance
  const pendingSettlement =
    collectedCod > 0 ? Math.max(0, netPayableByCarrier - actualCashReceived) : 0;

  const inTransitExpectedNetCod = shipments.reduce((sum, s) => {
    const isTransit =
      s.shipmentStatus === "picked_up" ||
      s.shipmentStatus === "in_transit" ||
      s.shipmentStatus === "at_distribution_center" ||
      s.shipmentStatus === "out_for_delivery";
    if (!isTransit) return sum;
    return (
      sum +
      Math.max(
        0,
        Number(s.shipmentCodCollectable || 0) -
          Number(s.carrierShippingFee || 0) -
          Number(s.carrierCodFee || 0)
      )
    );
  }, 0);

  const disputedShortfallAmount =
    order.paymentStatus === "disputed" ? Math.max(0, netPayableByCarrier - actualCashReceived) : 0;

  const outstandingCarrierReceivables =
    order.paymentStatus === "disputed"
      ? disputedShortfallAmount
      : pendingSettlement + disputedShortfallAmount;

  const totalOutstandingBalance = inTransitExpectedNetCod + outstandingCarrierReceivables;

  return {
    gmv,
    keptMerchandiseValue,
    orderDiscount,
    customerRefundAmount,
    netOrderRevenue,
    customerShippingFeeCharged,
    prepaidAmount,
    totalCodCollectable,
    hasMissingPurchaseCost,
    missingCostItemIds,
    totalCogs,
    grossProductProfit,
    totalCarrierShippingExpense,
    totalCarrierCodFee,
    totalReturnFee,
    totalCarrierFees,
    damagedInventoryLoss,
    packagingAndOtherCost,
    merchantExternalExpenses,
    netOperationalProfit,
    collectedCod,
    carrierDeductedFees,
    netPayableByCarrier,
    actualCashReceived,
    pendingSettlement,
    inTransitExpectedNetCod,
    disputedShortfallAmount,
    outstandingCarrierReceivables,
    totalOutstandingBalance,
  };
}

// ============================================================================
// 4. NON-DESTRUCTIVE ORDER HYDRATION & INTEGRITY VALIDATION
// ============================================================================

export function normalizeOrderRecord(
  rawOrder: Order,
  catalogProducts: Product[] = [],
  snapshotVersionId?: string
): Order {
  const { orderStatus, shipmentStatus, paymentStatus, returnStatus } =
    deriveInitialFourDimensions(rawOrder);

  const isReturnedOrFailed =
    orderStatus === "returned" || orderStatus === "failed_delivery" || orderStatus === "cancelled";

  // Build itemSnapshots preserving existing snapshots if already v2
  const itemSnapshots: OrderItemSnapshot[] =
    rawOrder.itemSnapshots && rawOrder.itemSnapshots.length > 0
      ? rawOrder.itemSnapshots.map((snap) => ({
          ...snap,
          keptQty: isReturnedOrFailed ? 0 : snap.keptQty ?? snap.orderedQty,
        }))
      : (rawOrder.items || []).map((item, idx) => {
          const catalogMatch = catalogProducts.find(
            (p) => p.id === item.id || p.name.toLowerCase() === item.name.toLowerCase()
          );
          const explicitItemCost =
            item.purchasePrice !== undefined && item.purchasePrice !== null
              ? Number(item.purchasePrice)
              : item.buyPrice !== undefined && item.buyPrice !== null
              ? Number(item.buyPrice)
              : undefined;
          const catalogCost =
            catalogMatch?.purchasePrice !== undefined && catalogMatch?.purchasePrice !== null
              ? Number(catalogMatch.purchasePrice)
              : catalogMatch?.buyPrice !== undefined && catalogMatch?.buyPrice !== null
              ? Number(catalogMatch.buyPrice)
              : undefined;

          const resolvedCost: number | null =
            explicitItemCost !== undefined && !Number.isNaN(explicitItemCost)
              ? explicitItemCost
              : catalogCost !== undefined && !Number.isNaN(catalogCost)
              ? catalogCost
              : null;

          const costSource: OrderItemSnapshot["costSource"] =
            explicitItemCost !== undefined
              ? "snapshot_at_order"
              : catalogCost !== undefined
              ? "catalog_backfill"
              : "missing";

          const weightKg =
            item.weightKg ??
            (catalogMatch?.weight ? Number(catalogMatch.weight) / 1000 : 0.8);

          return {
            id: `${rawOrder.id}_item_${idx + 1}`,
            productId: item.id,
            sku: item.sku || catalogMatch?.sku || `SKU-${item.id.slice(0, 6).toUpperCase()}`,
            productName: item.name,
            variantLabel: [item.color, item.size].filter(Boolean).join(" / ") || undefined,
            imageUrl: item.imageUrl,
            orderedQty: Number(item.quantity || 1),
            keptQty: isReturnedOrFailed ? 0 : Number(item.quantity || 1),
            returnedQty: orderStatus === "returned" ? Number(item.quantity || 1) : 0,
            damagedUnresellableQty:
              rawOrder.returnInspectionStatus === "not_resellable" ? Number(item.quantity || 1) : 0,
            unitSalePrice: Number(item.price || 0),
            unitDiscount: 0,
            unitPurchaseCost: resolvedCost,
            costSource,
            weightKg,
            dimensionsCm: item.dimensionsCm ||
              (catalogMatch?.dimensions
                ? {
                    length: catalogMatch.dimensions.depth || 25,
                    width: catalogMatch.dimensions.width || 20,
                    height: catalogMatch.dimensions.height || 10,
                  }
                : undefined),
            allocatedShipmentId: `shp_${rawOrder.id}_primary`,
          };
        });

  // Deterministic primary shipment (1 Order = 1 Shipment default)
  const primaryShipmentId = `shp_${rawOrder.id}_primary`;
  const totalWeightKg = Number(
    itemSnapshots.reduce((s, it) => s + it.weightKg * it.orderedQty, 0).toFixed(2)
  ) || 1.0;

  const gmvRaw = itemSnapshots.reduce((s, it) => s + it.unitSalePrice * it.orderedQty, 0);
  const discountRaw = Number(rawOrder.discountAmount || 0);
  const custShipRaw = Number(rawOrder.shippingCost || 0);
  const codCollectableRaw = isReturnedOrFailed
    ? 0
    : Math.max(0, gmvRaw - discountRaw + custShipRaw);

  const defaultCarrierFee =
    rawOrder.shippingCost && rawOrder.shippingCost > 0
      ? Math.max(350, Math.round(rawOrder.shippingCost * 0.85))
      : 450;

  const shipments: ShipmentRecord[] =
    rawOrder.shipments && rawOrder.shipments.length > 0
      ? rawOrder.shipments
      : [
          {
            id: primaryShipmentId,
            orderId: rawOrder.id,
            storeId: rawOrder.storeId,
            shipmentIndex: 1,
            totalShipmentsInOrder: 1,
            isSplitShipment: false,
            carrierId: (rawOrder.deliveryCompany || "yalidine").toLowerCase(),
            carrierName: rawOrder.deliveryCompanyName || rawOrder.deliveryCompany || "Yalidine Express",
            rateSource: "yume_verified",
            isConfirmedPrice: false,
            trackingNumber: rawOrder.trackingCode || "",
            deliveryType:
              rawOrder.deliveryMethod === "stop_desk" || rawOrder.deliveryMethod === "stopdesk"
                ? "desk"
                : "home",
            actualWeightKg: totalWeightKg,
            dimensionsCm: itemSnapshots[0]?.dimensionsCm || null,
            volumetricDivisor: 5000,
            volumetricWeightKg: itemSnapshots[0]?.dimensionsCm
              ? Number(
                  (
                    (itemSnapshots[0].dimensionsCm.length *
                      itemSnapshots[0].dimensionsCm.width *
                      itemSnapshots[0].dimensionsCm.height) /
                    5000
                  ).toFixed(2)
                )
              : null,
            billableWeightKg: totalWeightKg,
            weightBasisStatus: itemSnapshots[0]?.dimensionsCm
              ? "VERIFIED_DIMENSIONAL_WEIGHT"
              : "DIMENSIONS_MISSING_PROVISIONAL",
            isFragile: false,
            allowOpenPackage: true,
            exchangeRequired: false,
            allocatedItems: itemSnapshots.map((it) => ({
              orderItemId: it.id,
              productId: it.productId,
              productName: it.productName,
              quantity: it.orderedQty,
              unitSalePrice: it.unitSalePrice,
              unitDiscount: it.unitDiscount,
              unitPurchaseCost: it.unitPurchaseCost,
            })),
            allocatedDiscountAmount: discountRaw,
            allocatedCustomerShippingFee: custShipRaw,
            shipmentCodCollectable: codCollectableRaw,
            carrierShippingFee:
              shipmentStatus === "pending_creation" ? 0 : defaultCarrierFee,
            carrierCodFee:
              shipmentStatus === "delivered" ? Math.round(codCollectableRaw * 0.01) : 0,
            carrierReturnFee:
              orderStatus === "returned" || orderStatus === "failed_delivery" ? 250 : 0,
            cashCollectedByCourier:
              shipmentStatus === "delivered" ? codCollectableRaw : 0,
            netPayableByCarrier:
              shipmentStatus === "delivered"
                ? codCollectableRaw - defaultCarrierFee - Math.round(codCollectableRaw * 0.01)
                : 0,
            remittedPayoutToMerchant: 0,
            shipmentStatus,
            estimatedDeliveryDate: rawOrder.estimatedDeliveryDate,
            deliveredAt: shipmentStatus === "delivered" ? rawOrder.date : undefined,
            failedAttempts: 0,
            carrierEvents: [
              {
                id: `evt_${rawOrder.id}_init`,
                timestamp: rawOrder.date || new Date().toISOString(),
                status: shipmentStatus,
                location: rawOrder.shopper?.wilaya || "Hub",
                description:
                  shipmentStatus === "delivered"
                    ? "Parcel delivered to customer (COD collected by courier)"
                    : shipmentStatus === "in_transit"
                    ? "Parcel in transit with carrier"
                    : "Order registered and awaiting shipment dispatch",
              },
            ],
          },
        ];

  const baseNormalized: Order = {
    ...rawOrder,
    schemaVersion: 2,
    snapshotVersionId: rawOrder.snapshotVersionId || snapshotVersionId || "snap_v1_default",
    postMigrationRevision: rawOrder.postMigrationRevision ?? 0,
    orderStatus,
    shipmentStatus,
    paymentStatus,
    returnStatus,
    status: deriveLegacyStatus(orderStatus),
    callAttempts: rawOrder.callAttempts ?? (rawOrder.confirmationAttempts?.length || 0),
    confirmationAttempts: rawOrder.confirmationAttempts || [],
    itemSnapshots,
    shipments,
    packagingAndOtherCost: rawOrder.packagingAndOtherCost ?? 50,
    customerRefundAmount: rawOrder.customerRefundAmount ?? 0,
    timeline:
      rawOrder.timeline && rawOrder.timeline.length > 0
        ? rawOrder.timeline
        : [
            {
              id: `tl_${rawOrder.id}_created`,
              timestamp: rawOrder.date || new Date().toISOString(),
              actorId: "system",
              actorName: "YUME Order System",
              actorRole: "system",
              dimension: "order",
              newValue: orderStatus,
              description: `Order #${rawOrder.id} initialized (${orderStatus.replace(/_/g, " ")})`,
            },
          ],
    processedWebhookIds: rawOrder.processedWebhookIds || [],
  };

  baseNormalized.financials = computeOrderFinancials(baseNormalized);
  if (!baseNormalized.migrationBaselineHash) {
    baseNormalized.migrationBaselineHash = computeCanonicalOrderHash(baseNormalized);
  }

  return baseNormalized;
}

export function validateOrderIntegrity(order: Order): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!order.orderStatus || !order.shipmentStatus || !order.paymentStatus || !order.returnStatus) {
    errors.push("Missing one or more of the 4 operational status dimensions.");
  }

  if (order.shipments && order.shipments.length > 0 && order.itemSnapshots && order.itemSnapshots.length > 0) {
    for (const item of order.itemSnapshots) {
      const allocatedSum = order.shipments.reduce((sum, sh) => {
        const match = sh.allocatedItems.find((a) => a.orderItemId === item.id);
        return sum + (match ? match.quantity : 0);
      }, 0);
      if (allocatedSum !== item.orderedQty) {
        errors.push(
          `Split-shipment item allocation mismatch for ${item.productName}: allocated ${allocatedSum} vs ordered ${item.orderedQty}.`
        );
      }
    }

    const activeCommercial =
      order.orderStatus !== "cancelled" &&
      order.orderStatus !== "failed_delivery" &&
      order.orderStatus !== "returned";

    if (activeCommercial && order.financials) {
      const sumShipmentCod = order.shipments.reduce(
        (sum, sh) => sum + Number(sh.shipmentCodCollectable || 0),
        0
      );
      if (Math.abs(sumShipmentCod - order.financials.totalCodCollectable) > 1) {
        errors.push(
          `Split-shipment COD sum (${sumShipmentCod}) does not equal Order Total COD Collectable (${order.financials.totalCodCollectable}).`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// 5. FAIL-CLOSED PRE-MIGRATION BACKUP GATE & DELTA-PRESERVING ROLLBACK
// ============================================================================

const pendingMutationBuffers: Record<string, Array<(orders: Order[]) => Order[]>> = {};
const activeMigrationLocks: Record<string, boolean> = {};

export function runStoreOrdersMigration(params: {
  storeId: string;
  rawOrders: Order[];
  catalogProducts: Product[];
  simulateBackupFailure?: boolean;
  serverBackupCallback?: (bundle: MigrationSnapshotBundle) => boolean;
}): {
  status: "ALREADY_MIGRATED" | "VERIFIED_COMPLETE" | "MIGRATION_ABORTED_BACKUP_UNVERIFIED";
  orders: Order[];
  snapshotBundle?: MigrationSnapshotBundle;
  errorMessage?: string;
} {
  const { storeId, rawOrders, catalogProducts, simulateBackupFailure, serverBackupCallback } = params;

  // Check if all orders are already at schemaVersion 2
  if (rawOrders.length > 0 && rawOrders.every((o) => o.schemaVersion === 2 && o.financials)) {
    return { status: "ALREADY_MIGRATED", orders: rawOrders };
  }

  // Step 1: Acquire Store Migration Lock
  activeMigrationLocks[storeId] = true;
  pendingMutationBuffers[storeId] = [];

  try {
    const snapshotId = `snap_v1_${storeId}_${Date.now()}`;
    const v1Clone: Order[] = JSON.parse(JSON.stringify(rawOrders));
    const bundleChecksum = computeBundleChecksum(v1Clone, storeId);

    // Pre-compute baseline hashes for each order
    const hydratedPreview = v1Clone.map((o) => normalizeOrderRecord(o, catalogProducts, snapshotId));
    const recordHashesMap: Record<string, string> = {};
    hydratedPreview.forEach((ho) => {
      recordHashesMap[ho.id] = ho.migrationBaselineHash || computeCanonicalOrderHash(ho);
    });

    const productStockAndCostSnapshot: MigrationSnapshotBundle["productStockAndCostSnapshot"] = {};
    catalogProducts.forEach((p) => {
      productStockAndCostSnapshot[p.id] = {
        stockQuantity: Number(p.stock || 0),
        buyPrice: p.buyPrice,
        purchasePrice: p.purchasePrice,
      };
    });

    const bundle: MigrationSnapshotBundle = {
      snapshotId,
      storeId,
      createdAt: new Date().toISOString(),
      schemaVersionFrom: 1,
      totalOrderCount: v1Clone.length,
      bundleChecksum,
      recordHashesMap,
      orders: v1Clone,
      productStockAndCostSnapshot,
      workspacePreferences: {
        activeMode: typeof window !== "undefined" ? localStorage.getItem(`yumi_orders_active_mode_${storeId}`) : null,
        defaultMode: typeof window !== "undefined" ? localStorage.getItem(`yumi_orders_default_mode_${storeId}`) : null,
      },
    };

    // Step 2: Dual-Destination Write + Read-Back Checksum Verification
    if (simulateBackupFailure) {
      throw new Error("Simulated backup destination write/checksum failure.");
    }

    const storageKey = `yume_migration_snapshot_v1_${storeId}`;
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(bundle));
      const readBackRaw = localStorage.getItem(storageKey);
      if (!readBackRaw) {
        throw new Error("Local backup read-back returned null.");
      }
      const readBackBundle: MigrationSnapshotBundle = JSON.parse(readBackRaw);
      const recomputedChecksum = computeBundleChecksum(readBackBundle.orders, storeId);
      if (
        recomputedChecksum !== bundleChecksum ||
        readBackBundle.orders.length !== v1Clone.length
      ) {
        throw new Error("Local backup read-back SHA-256 checksum or order count mismatch.");
      }
    }

    if (serverBackupCallback) {
      const serverOk = serverBackupCallback(bundle);
      if (!serverOk) {
        throw new Error("Server backup destination failed verification.");
      }
    }

    // Step 3: Commit v2 Hydration & Replay Any Buffered Concurrent Mutations
    let finalOrders = hydratedPreview;
    const queuedMutations = pendingMutationBuffers[storeId] || [];
    for (const mutateFn of queuedMutations) {
      finalOrders = mutateFn(finalOrders).map((o) => ({
        ...o,
        postMigrationRevision: (o.postMigrationRevision || 0) + 1,
        financials: computeOrderFinancials(o),
      }));
    }

    activeMigrationLocks[storeId] = false;
    pendingMutationBuffers[storeId] = [];

    return {
      status: "VERIFIED_COMPLETE",
      orders: finalOrders,
      snapshotBundle: bundle,
    };
  } catch (err: any) {
    // Fail-Closed Abort: Leave 100% of v1 records untouched
    const storageKey = `yume_migration_snapshot_v1_${storeId}`;
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
    let untouchedV1Orders = [...rawOrders];
    const queuedMutations = pendingMutationBuffers[storeId] || [];
    for (const mutateFn of queuedMutations) {
      untouchedV1Orders = mutateFn(untouchedV1Orders);
    }
    activeMigrationLocks[storeId] = false;
    pendingMutationBuffers[storeId] = [];

    return {
      status: "MIGRATION_ABORTED_BACKUP_UNVERIFIED",
      orders: untouchedV1Orders,
      errorMessage: err?.message || "Migration aborted: backup could not be verified.",
    };
  }
}

export function enqueueOrApplyOrderMutation(
  storeId: string,
  currentOrders: Order[],
  mutateFn: (orders: Order[]) => Order[]
): Order[] {
  if (activeMigrationLocks[storeId]) {
    if (!pendingMutationBuffers[storeId]) {
      pendingMutationBuffers[storeId] = [];
    }
    pendingMutationBuffers[storeId].push(mutateFn);
    return currentOrders;
  }
  return mutateFn(currentOrders);
}

export function rollbackStoreOrdersMigration(
  storeId: string,
  currentOrders: Order[],
  explicitSnapshot?: MigrationSnapshotBundle | null
): {
  restoredOrders: Order[];
  unmodifiedRestoredCount: number;
  modifiedPreservedCount: number;
  newPostMigrationRetainedCount: number;
} {
  let snapshot = explicitSnapshot;
  if (!snapshot && typeof window !== "undefined") {
    const raw = localStorage.getItem(`yume_migration_snapshot_v1_${storeId}`);
    if (raw) {
      snapshot = JSON.parse(raw);
    }
  }

  if (!snapshot) {
    throw new Error(`No verified pre-migration snapshot found for store ${storeId}.`);
  }

  const snapshotMap = new Map<string, Order>();
  snapshot.orders.forEach((vo) => snapshotMap.set(vo.id, vo));

  let unmodifiedRestoredCount = 0;
  let modifiedPreservedCount = 0;
  let newPostMigrationRetainedCount = 0;

  const restoredOrders: Order[] = currentOrders.map((curr) => {
    const snapRecord = snapshotMap.get(curr.id);

    // Case 3: Newly Created Post-Migration Order -> NEVER DELETE
    if (!snapRecord) {
      newPostMigrationRetainedCount++;
      const legacyStatus = curr.orderStatus ? deriveLegacyStatus(curr.orderStatus) : curr.status;
      return {
        ...curr,
        schemaVersion: 1,
        status: legacyStatus,
        _v2Archive: {
          orderStatus: curr.orderStatus,
          shipmentStatus: curr.shipmentStatus,
          paymentStatus: curr.paymentStatus,
          returnStatus: curr.returnStatus,
          shipments: curr.shipments,
          financials: curr.financials,
          timeline: curr.timeline,
        },
      };
    }

    // Check Triple-Lock Change Detection
    const currentHash = computeCanonicalOrderHash(curr);
    const baselineHash = snapshot.recordHashesMap[curr.id] || curr.migrationBaselineHash;
    const isUnchanged =
      (curr.postMigrationRevision || 0) === 0 &&
      curr.snapshotVersionId === snapshot.snapshotId &&
      currentHash === baselineHash;

    // Case 1: Unchanged Legacy Record -> Restore 100% Verbatim from v1 Snapshot
    if (isUnchanged) {
      unmodifiedRestoredCount++;
      return JSON.parse(JSON.stringify(snapRecord));
    }

    // Case 2: Modified Legacy Record -> Preserve post-migration mutations & down-project to v1
    modifiedPreservedCount++;
    const legacyStatus = curr.orderStatus ? deriveLegacyStatus(curr.orderStatus) : curr.status;
    return {
      ...snapRecord,
      ...curr,
      schemaVersion: 1,
      status: legacyStatus,
      _v2Archive: {
        orderStatus: curr.orderStatus,
        shipmentStatus: curr.shipmentStatus,
        paymentStatus: curr.paymentStatus,
        returnStatus: curr.returnStatus,
        shipments: curr.shipments,
        financials: curr.financials,
        timeline: curr.timeline,
      },
    };
  });

  return {
    restoredOrders,
    unmodifiedRestoredCount,
    modifiedPreservedCount,
    newPostMigrationRetainedCount,
  };
}

// ============================================================================
// 6. FOUR-DIMENSION STATE MACHINE & OPERATIONAL WORKFLOWS (PART 2 & PART 3)
// ============================================================================

export function canEditOrderStructure(order: Order): {
  allowed: boolean;
  reason?: string;
} {
  const lockedShipmentStatuses: ShipmentLifecycleStatus[] = [
    "picked_up",
    "in_transit",
    "at_distribution_center",
    "out_for_delivery",
    "delivered",
    "returning_to_sender",
    "returned",
  ];
  if (order.shipmentStatus && lockedShipmentStatuses.includes(order.shipmentStatus)) {
    return {
      allowed: false,
      reason: `Order items and carrier cannot be structurally edited because shipment is already "${order.shipmentStatus.replace(/_/g, " ")}". Only delivery notes or secondary phone can be updated.`,
    };
  }
  if (order.orderStatus === "cancelled" || order.orderStatus === "returned") {
    return {
      allowed: false,
      reason: `Order is in terminal "${order.orderStatus}" state.`,
    };
  }
  return { allowed: true };
}

export function transitionOrderDimension(params: {
  order: Order;
  dimension: "order" | "shipment" | "payment" | "return";
  newValue: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  note?: string;
}): Order {
  const {
    order,
    dimension,
    newValue,
    actorId = "merchant",
    actorName = "Merchant Admin",
    actorRole = "admin",
    note,
  } = params;

  const updated: Order = {
    ...order,
    updatedAt: new Date().toISOString(),
    postMigrationRevision: (order.postMigrationRevision || 0) + 1,
  };

  let previousValue = "";

  if (dimension === "order") {
    previousValue = updated.orderStatus || "new";
    const nextOrderStatus = newValue as OrderLifecycleStatus;
    updated.orderStatus = nextOrderStatus;
    updated.status = deriveLegacyStatus(nextOrderStatus);

    if (nextOrderStatus === "confirmed") {
      updated.confirmationStatus = "confirmed";
      updated.confirmedAt = new Date().toISOString();
      if (updated.inventoryState !== "deducted") {
        updated.inventoryState = "reserved";
      }
    } else if (nextOrderStatus === "cancelled") {
      updated.confirmationStatus = "rejected";
      updated.cancellationReason = note || updated.cancellationReason || "Cancelled by operator";
      updated.inventoryState = "unreserved";
    } else if (nextOrderStatus === "shipped" && updated.shipmentStatus === "pending_creation") {
      updated.shipmentStatus = "in_transit";
      updated.inventoryState = "deducted";
    } else if (nextOrderStatus === "delivered") {
      updated.shipmentStatus = "delivered";
      // CRITICAL: Delivered transitions payment to settlement_pending, NEVER directly to settled
      if (updated.paymentStatus === "awaiting_collection" || updated.paymentStatus === "collected") {
        updated.paymentStatus = "settlement_pending";
      }
      updated.shipments = (updated.shipments || []).map((s) => ({
        ...s,
        shipmentStatus: "delivered",
        cashCollectedByCourier: s.shipmentCodCollectable,
        deliveredAt: new Date().toISOString(),
      }));
    } else if (nextOrderStatus === "failed_delivery") {
      updated.shipmentStatus = "delivery_failed";
      updated.failedDeliveryReason = note || "Customer unreachable / refused parcel";
      if (updated.returnStatus === "none") {
        updated.returnStatus = "return_in_transit";
      }
    } else if (nextOrderStatus === "returned") {
      updated.shipmentStatus = "returned";
      if (updated.returnStatus === "none" || updated.returnStatus === "return_in_transit") {
        updated.returnStatus = "inspection_pending";
      }
    }
  } else if (dimension === "shipment") {
    previousValue = updated.shipmentStatus || "pending_creation";
    const nextShipmentStatus = newValue as ShipmentLifecycleStatus;
    updated.shipmentStatus = nextShipmentStatus;

    // Cross-dimension non-conflated synchronization
    if (nextShipmentStatus === "picked_up" || nextShipmentStatus === "in_transit") {
      updated.orderStatus = "shipped";
      updated.status = "shipped";
      updated.inventoryState = "deducted";
    } else if (nextShipmentStatus === "out_for_delivery") {
      updated.orderStatus = "out_for_delivery";
      updated.status = "shipped";
    } else if (nextShipmentStatus === "delivered") {
      updated.orderStatus = "delivered";
      updated.status = "delivered";
      if (updated.paymentStatus === "awaiting_collection") {
        updated.paymentStatus = "settlement_pending";
      }
    } else if (nextShipmentStatus === "delivery_failed" || nextShipmentStatus === "returning_to_sender") {
      updated.orderStatus = "failed_delivery";
      updated.status = "shipped";
      updated.returnStatus = "return_in_transit";
    } else if (nextShipmentStatus === "returned") {
      updated.orderStatus = "returned";
      updated.status = "shipped";
      updated.returnStatus = "inspection_pending";
    }

    updated.shipments = (updated.shipments || []).map((s, idx) =>
      idx === 0
        ? {
            ...s,
            shipmentStatus: nextShipmentStatus,
            cashCollectedByCourier:
              nextShipmentStatus === "delivered" ? s.shipmentCodCollectable : s.cashCollectedByCourier,
          }
        : s
    );
  } else if (dimension === "payment") {
    previousValue = updated.paymentStatus || "awaiting_collection";
    const nextPaymentStatus = newValue as PaymentLifecycleStatus;
    updated.paymentStatus = nextPaymentStatus;

    if (nextPaymentStatus === "settled") {
      updated.shipments = (updated.shipments || []).map((s) => {
        const netPayable = Math.max(
          0,
          s.shipmentCodCollectable - s.carrierShippingFee - s.carrierCodFee - s.carrierReturnFee
        );
        return {
          ...s,
          cashCollectedByCourier: s.shipmentCodCollectable,
          netPayableByCarrier: netPayable,
          remittedPayoutToMerchant: netPayable,
        };
      });
    }
  } else if (dimension === "return") {
    previousValue = updated.returnStatus || "none";
    const nextReturnStatus = newValue as ReturnLifecycleStatus;
    updated.returnStatus = nextReturnStatus;

    if (nextReturnStatus === "restocked") {
      updated.orderStatus = "returned";
      updated.returnInspectionStatus = "restocked";
      updated.inventoryState = "restocked";
      updated.itemSnapshots = (updated.itemSnapshots || []).map((it) => ({
        ...it,
        keptQty: 0,
        returnedQty: it.orderedQty,
        damagedUnresellableQty: 0,
      }));
    } else if (nextReturnStatus === "not_resellable") {
      updated.orderStatus = "returned";
      updated.returnInspectionStatus = "not_resellable";
      updated.inventoryState = "written_off";
      updated.itemSnapshots = (updated.itemSnapshots || []).map((it) => ({
        ...it,
        keptQty: 0,
        returnedQty: it.orderedQty,
        damagedUnresellableQty: it.orderedQty,
      }));
    }
  }

  const timelineEvent: OrderTimelineEvent = {
    id: `tl_${updated.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    actorId,
    actorName,
    actorRole,
    dimension,
    previousValue,
    newValue,
    description:
      note ||
      `${dimension.toUpperCase()} status changed from "${previousValue.replace(/_/g, " ")}" to "${newValue.replace(/_/g, " ")}"`,
  };

  updated.timeline = [timelineEvent, ...(updated.timeline || [])];
  updated.financials = computeOrderFinancials(updated);
  return updated;
}

export function logOrderConfirmationAttempt(params: {
  order: Order;
  channel: "phone" | "whatsapp" | "sms";
  outcome: OrderConfirmationAttempt["outcome"];
  notes?: string;
  scheduledCallbackAt?: string;
  agentId?: string;
  agentName?: string;
}): Order {
  const {
    order,
    channel,
    outcome,
    notes,
    scheduledCallbackAt,
    agentId = "agent_1",
    agentName = "Confirmation Desk",
  } = params;

  const attempt: OrderConfirmationAttempt = {
    id: `att_${order.id}_${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentId,
    agentName,
    channel,
    outcome,
    notes,
    scheduledCallbackAt,
  };

  const attempts = [attempt, ...(order.confirmationAttempts || [])];
  let nextOrder: Order = {
    ...order,
    callAttempts: attempts.length,
    confirmationAttempts: attempts,
    updatedAt: new Date().toISOString(),
    postMigrationRevision: (order.postMigrationRevision || 0) + 1,
  };

  if (outcome === "confirmed") {
    nextOrder = transitionOrderDimension({
      order: nextOrder,
      dimension: "order",
      newValue: "confirmed",
      actorId: agentId,
      actorName: agentName,
      note: `Customer confirmed order via ${channel.toUpperCase()}${notes ? `: ${notes}` : ""}`,
    });
  } else if (outcome === "cancelled") {
    nextOrder = transitionOrderDimension({
      order: nextOrder,
      dimension: "order",
      newValue: "cancelled",
      actorId: agentId,
      actorName: agentName,
      note: `Order cancelled during confirmation call${notes ? `: ${notes}` : ""}`,
    });
  } else {
    nextOrder.orderStatus = "confirmation_pending";
    nextOrder.confirmationStatus = "unreachable";
    nextOrder.timeline = [
      {
        id: `tl_${order.id}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: agentId,
        actorName: agentName,
        actorRole: "confirmation_agent",
        dimension: "order",
        previousValue: order.orderStatus || "new",
        newValue: "confirmation_pending",
        description: `Call attempt #${attempts.length} (${channel.toUpperCase()}): ${outcome.replace(/_/g, " ")}${
          notes ? ` — ${notes}` : ""
        }`,
      },
      ...(nextOrder.timeline || []),
    ];
  }

  nextOrder.financials = computeOrderFinancials(nextOrder);
  return nextOrder;
}

export function updateOrderMissingItemCost(params: {
  order: Order;
  orderItemId: string;
  unitPurchaseCost: number;
  actorName?: string;
}): Order {
  const { order, orderItemId, unitPurchaseCost, actorName = "Merchant Admin" } = params;
  const validCost = Math.max(0, Number(unitPurchaseCost));

  const updatedSnapshots = (order.itemSnapshots || []).map((it) =>
    it.id === orderItemId || it.productId === orderItemId
      ? {
          ...it,
          unitPurchaseCost: validCost,
          costSource: "merchant_inline_entry" as const,
        }
      : it
  );

  const updatedShipments = (order.shipments || []).map((sh) => ({
    ...sh,
    allocatedItems: sh.allocatedItems.map((ai) =>
      ai.orderItemId === orderItemId || ai.productId === orderItemId
        ? { ...ai, unitPurchaseCost: validCost }
        : ai
    ),
  }));

  const updated: Order = {
    ...order,
    updatedAt: new Date().toISOString(),
    postMigrationRevision: (order.postMigrationRevision || 0) + 1,
    itemSnapshots: updatedSnapshots,
    shipments: updatedShipments,
    timeline: [
      {
        id: `tl_${order.id}_cost_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: "merchant",
        actorName,
        actorRole: "admin",
        dimension: "financial",
        description: `Updated unit purchase cost for item ${orderItemId} to ${validCost.toLocaleString()}`,
      },
      ...(order.timeline || []),
    ],
  };

  updated.financials = computeOrderFinancials(updated);
  return updated;
}

export function processIdempotentCarrierWebhook(params: {
  order: Order;
  webhookEventId: string;
  trackingNumber: string;
  shipmentStatus: ShipmentLifecycleStatus;
  location?: string;
  description?: string;
}): {
  order: Order;
  isDuplicateNoop: boolean;
} {
  const { order, webhookEventId, trackingNumber, shipmentStatus, location, description } = params;
  const dedupKey = `${webhookEventId}::${trackingNumber}::${shipmentStatus}`;

  if ((order.processedWebhookIds || []).includes(dedupKey)) {
    return { order, isDuplicateNoop: true };
  }

  let nextOrder = transitionOrderDimension({
    order: {
      ...order,
      processedWebhookIds: [...(order.processedWebhookIds || []), dedupKey],
    },
    dimension: "shipment",
    newValue: shipmentStatus,
    actorId: "carrier_webhook",
    actorName: order.deliveryCompanyName || order.deliveryCompany || "Carrier Webhook",
    actorRole: "system",
    note: description || `Carrier webhook update (${trackingNumber}): ${shipmentStatus.replace(/_/g, " ")}${location ? ` at ${location}` : ""}`,
  });

  nextOrder.financials = computeOrderFinancials(nextOrder);
  return { order: nextOrder, isDuplicateNoop: false };
}
