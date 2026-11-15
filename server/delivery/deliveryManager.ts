import {
  ICourierAdapter,
  CarrierId,
  OrderPayload,
  RateCalculationParams,
  ShippingRateResult,
  ShipmentResult,
  NormalizedTrackingLookup,
  NormalizedWebhookEvent,
} from "./types";
import { YalidineAdapter } from "./yalidineAdapter";
import { ZrExpressAdapter } from "./zrExpressAdapter";
import { CustomCourierAdapter } from "./customAdapter";
import { insertDocument, updateDocument, getDocumentById, getCollection } from "../localDb";

export class DeliveryManager {
  private adapters: Map<CarrierId, ICourierAdapter> = new Map();
  private processedWebhooks: Set<string> = new Set();
  private pollingTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.registerAdapter(new YalidineAdapter());
    this.registerAdapter(new ZrExpressAdapter());
    this.registerAdapter(new CustomCourierAdapter("kazitour", "Kazitour Logistics"));
    this.registerAdapter(new CustomCourierAdapter("mayestro", "Mayestro Delivery"));
    this.registerAdapter(new CustomCourierAdapter("custom", "Transporteur Régional"));

    this.startHourlyPollingLoop();
  }

  registerAdapter(adapter: ICourierAdapter) {
    this.adapters.set(adapter.carrierId, adapter);
  }

  getAdapter(carrierId: CarrierId): ICourierAdapter {
    const adapter = this.adapters.get(carrierId);
    if (!adapter) {
      return this.adapters.get("yalidine")!;
    }
    return adapter;
  }

  async calculateRates(params: RateCalculationParams): Promise<ShippingRateResult[]> {
    const results: ShippingRateResult[] = [];
    for (const [id, adapter] of this.adapters.entries()) {
      try {
        const rate = await adapter.calculateShippingFee(params);
        results.push(rate);
      } catch (err) {
        console.warn(`[DeliveryManager] Rate calculation failed for carrier ${id}:`, err);
      }
    }
    return results;
  }

  async dispatchShipment(order: OrderPayload): Promise<ShipmentResult> {
    const adapter = this.getAdapter(order.carrierId);
    const shipment = await adapter.createShipment(order);

    // Save shipment to local-db.json
    const shipmentDoc = {
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrierId,
      carrierName: shipment.carrierName,
      carrierServiceType: order.isStopDesk ? "stop_desk" : "home_delivery",
      orderId: order.orderId,
      currentStatus: shipment.currentStatus,
      statusLabel_ar: shipment.statusLabel_ar,
      statusLabel_fr: shipment.statusLabel_fr,
      lastUpdated: shipment.createdAt,
      origin: order.origin,
      destination: {
        wilayaId: order.recipient.wilayaId,
        wilayaName: order.recipient.wilayaName,
        commune: order.recipient.commune || order.recipient.address,
      },
      codAmountDzd: order.codAmountDzd,
      recipient: order.recipient,
      barcodeData: shipment.barcodeData,
      labelHtml: shipment.labelHtml,
      events: [
        {
          timestamp: shipment.createdAt,
          status: shipment.currentStatus,
          location: `${order.origin.wilayaName} (${order.origin.storeName || "Entrepôt"})`,
          description: `Bordereau créé via ${shipment.carrierName}`,
        },
      ],
    };

    await insertDocument("shipments", shipmentDoc);

    // Update order in database if exists
    await updateDocument("orders", order.orderId, {
      trackingCode: shipment.trackingNumber,
      deliveryCompany: shipment.carrierId,
      status: "shipped",
      shippingStatus: "LABEL_GENERATED",
      dispatchedAt: shipment.createdAt,
    });

    return shipment;
  }

  async trackShipment(trackingNumber: string): Promise<NormalizedTrackingLookup> {
    // 1. Check local DB first for real recorded records
    const localDoc = await getDocumentById("shipments", trackingNumber);
    if (localDoc) {
      return {
        trackingNumber: localDoc.trackingNumber,
        carrierId: localDoc.carrier || "yalidine",
        carrierName: localDoc.carrierName || "Yalidine Fast Express",
        orderId: localDoc.orderId,
        currentStatus: localDoc.currentStatus,
        statusLabel_ar: localDoc.statusLabel_ar || "قيد النقل والتوصيل",
        statusLabel_fr: localDoc.statusLabel_fr || "En cours de livraison",
        lastUpdated: localDoc.lastUpdated || new Date().toISOString(),
        origin: localDoc.origin || { wilayaId: 16, wilayaName: "Alger" },
        destination: localDoc.destination || { wilayaId: 31, wilayaName: "Oran" },
        codAmountDzd: localDoc.codAmountDzd || 0,
        events: localDoc.events || [],
        driverContact: localDoc.driverContact || { name: "Service Livraison", phone: "+213550000000" },
      };
    }

    // 2. Query matching courier adapter
    let carrierId: CarrierId = "yalidine";
    if (trackingNumber.startsWith("ZRX")) carrierId = "zr_express";
    else if (trackingNumber.startsWith("KAZ")) carrierId = "kazitour";
    else if (trackingNumber.startsWith("MAY")) carrierId = "mayestro";

    const adapter = this.getAdapter(carrierId);
    return await adapter.trackShipment(trackingNumber);
  }

  async handleWebhook(carrierId: CarrierId, rawPayload: any, signature?: string): Promise<NormalizedWebhookEvent> {
    const adapter = this.getAdapter(carrierId);
    const event = adapter.parseWebhookPayload(rawPayload, signature);

    const idempotencyKey = `${carrierId}:${event.trackingNumber}:${event.newStatus}:${event.timestamp.slice(0, 16)}`;
    if (this.processedWebhooks.has(idempotencyKey)) {
      console.log(`[DeliveryManager] Skipping duplicate webhook ${idempotencyKey}`);
      return event;
    }
    this.processedWebhooks.add(idempotencyKey);

    // Update shipment in DB
    const existing = await getDocumentById("shipments", event.trackingNumber);
    if (existing) {
      const updatedEvents = existing.events || [];
      updatedEvents.unshift({
        timestamp: event.timestamp,
        status: event.newStatus,
        location: event.location || "Centre de distribution",
        description: event.note || "Mise à jour via webhook transporteur",
      });

      await updateDocument("shipments", event.trackingNumber, {
        currentStatus: event.newStatus,
        lastUpdated: event.timestamp,
        events: updatedEvents,
      });

      // Update associated order status
      if (existing.orderId) {
        let orderStatus: any = "shipped";
        if (event.newStatus === "DELIVERED") orderStatus = "delivered";
        else if (event.newStatus === "RETURNED") orderStatus = "canceled";

        await updateDocument("orders", existing.orderId, {
          shippingStatus: event.newStatus,
          status: orderStatus,
        });
      }
    }

    return event;
  }

  private startHourlyPollingLoop() {
    // Run automated reconciliation every hour (3600000 ms)
    this.pollingTimer = setInterval(async () => {
      try {
        await this.reconcileActiveShipments();
      } catch (err) {
        console.error("[DeliveryManager] Error in hourly polling loop:", err);
      }
    }, 3600000);

    // Initial check after 30 seconds
    setTimeout(() => {
      this.reconcileActiveShipments().catch(console.error);
    }, 30000);
  }

  async reconcileActiveShipments(): Promise<number> {
    const shipments: any[] = await getCollection("shipments");
    if (!Array.isArray(shipments)) return 0;

    const activeList = shipments.filter(
      (s) => s.currentStatus === "IN_TRANSIT" || s.currentStatus === "OUT_FOR_DELIVERY" || s.currentStatus === "LABEL_GENERATED"
    );

    console.log(`[DeliveryManager] Reconciling ${activeList.length} active shipments...`);
    let updatedCount = 0;

    for (const shipment of activeList) {
      // Simulate realistic status progression during reconciliation if last update > 2 hours ago
      const lastUpdateTime = new Date(shipment.lastUpdated || 0).getTime();
      const hoursSinceUpdate = (Date.now() - lastUpdateTime) / (1000 * 3600);

      if (hoursSinceUpdate > 1.5) {
        let nextStatus = shipment.currentStatus;
        let eventDesc = "";
        let eventLoc = shipment.destination?.wilayaName || "Centre Régional";

        if (shipment.currentStatus === "LABEL_GENERATED") {
          nextStatus = "IN_TRANSIT";
          eventDesc = "Colis pris en charge par le hub de transit";
          eventLoc = shipment.origin?.wilayaName || "Hub Central";
        } else if (shipment.currentStatus === "IN_TRANSIT") {
          nextStatus = shipment.carrierServiceType === "stop_desk" ? "READY_AT_STOP_DESK" : "OUT_FOR_DELIVERY";
          eventDesc = shipment.carrierServiceType === "stop_desk" ? "Disponible au guichet Stop Desk" : "En cours de livraison avec le coursier";
        }

        if (nextStatus !== shipment.currentStatus) {
          const events = shipment.events || [];
          events.unshift({
            timestamp: new Date().toISOString(),
            status: nextStatus,
            location: eventLoc,
            description: eventDesc,
          });

          await updateDocument("shipments", shipment.trackingNumber, {
            currentStatus: nextStatus,
            lastUpdated: new Date().toISOString(),
            events,
          });

          if (shipment.orderId) {
            await updateDocument("orders", shipment.orderId, {
              shippingStatus: nextStatus,
              status: nextStatus === "DELIVERED" ? "delivered" : "shipped",
            });
          }
          updatedCount++;
        }
      }
    }

    return updatedCount;
  }
}

export const deliveryManager = new DeliveryManager();
