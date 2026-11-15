import {
  ICourierAdapter,
  OrderPayload,
  RateCalculationParams,
  ShippingRateResult,
  ShipmentResult,
  NormalizedTrackingLookup,
  NormalizedWebhookEvent,
  NormalizedTrackingStatus,
} from "./types";

export class ZrExpressAdapter implements ICourierAdapter {
  carrierId = "zr_express" as const;
  carrierName = "ZR Express";

  private token: string;

  constructor(token: string = "") {
    this.token = token || process.env.ZR_EXPRESS_TOKEN || "";
  }

  async calculateShippingFee(params: RateCalculationParams): Promise<ShippingRateResult> {
    const { destinationWilayaId, isStopDesk } = params;
    let fee = 650;
    let days = "24 - 48h";

    if ([16, 9, 35, 42].includes(destinationWilayaId)) {
      fee = isStopDesk ? 380 : 500;
      days = "24h";
    } else if (destinationWilayaId >= 1 && destinationWilayaId <= 31) {
      fee = isStopDesk ? 500 : 700;
      days = "24 - 48h";
    } else if (destinationWilayaId <= 48) {
      fee = isStopDesk ? 650 : 850;
      days = "48h";
    } else {
      fee = isStopDesk ? 1100 : 1450;
      days = "3 - 5 jours";
    }

    return {
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      feeDzd: fee,
      isStopDesk,
      estimatedDays: days,
      currency: "DZD",
    };
  }

  async createShipment(order: OrderPayload): Promise<ShipmentResult> {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const trackingNumber = `ZRX-${randomSuffix}-DZ`;
    const now = new Date().toISOString();

    const labelHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; border: 2px solid #059669; padding: 15px; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 8px;">
          <h2 style="margin: 0; color: #059669; font-size: 20px;">ZR EXPRESS LOGISTICS</h2>
          <span style="font-size: 11px; font-weight: bold; background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 4px;">
            ${order.isStopDesk ? "POINT RELAIS / STOP DESK" : "DOMICILE EXPRESS"}
          </span>
        </div>
        <div style="text-align: center; margin: 15px 0;">
          <div style="font-size: 26px; font-weight: 900; letter-spacing: 3px; color: #111;">${trackingNumber}</div>
          <div style="background: #059669; color: #fff; display: inline-block; padding: 4px 12px; margin-top: 5px; font-family: monospace; font-size: 12px; border-radius: 2px;">
            ||||| ${trackingNumber} |||||
          </div>
        </div>
        <div style="border-top: 1px dashed #ccc; padding-top: 10px; font-size: 13px;">
          <p style="margin: 4px 0;"><strong>Client:</strong> ${order.recipient.name}</p>
          <p style="margin: 4px 0;"><strong>Contact:</strong> ${order.recipient.phone}</p>
          <p style="margin: 4px 0;"><strong>Destination:</strong> Wilaya ${order.recipient.wilayaId} - ${order.recipient.wilayaName}</p>
          <p style="margin: 4px 0;"><strong>Commune:</strong> ${order.recipient.commune || order.recipient.address}</p>
        </div>
        <div style="border-top: 2px solid #059669; margin-top: 10px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 16px;">
          <strong>ENCAISSEMENT COD:</strong>
          <strong style="color: #059669;">${order.codAmountDzd} DZD</strong>
        </div>
      </div>
    `;

    return {
      trackingNumber,
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      orderId: order.orderId,
      currentStatus: "LABEL_GENERATED",
      statusLabel_ar: "تم إنشاء بوليصة الشحن (ZR Express)",
      statusLabel_fr: "Bordereau créé (ZR Express)",
      barcodeData: trackingNumber,
      labelHtml,
      createdAt: now,
    };
  }

  async trackShipment(trackingNumber: string): Promise<NormalizedTrackingLookup> {
    const now = Date.now();
    return {
      trackingNumber,
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      orderId: "ORD-ZR-" + trackingNumber.slice(-6),
      currentStatus: "OUT_FOR_DELIVERY",
      statusLabel_ar: "خرج للتسليم مع سائق ZR Express",
      statusLabel_fr: "En cours de livraison avec le coursier ZR Express",
      lastUpdated: new Date(now).toISOString(),
      origin: { wilayaId: 16, wilayaName: "Alger (Entrepôt Central)" },
      destination: { wilayaId: 25, wilayaName: "Constantine", commune: "Sidi Mabrouk" },
      codAmountDzd: 5200,
      events: [
        {
          timestamp: new Date(now - 72000000).toISOString(),
          status: "LABEL_GENERATED",
          location: "Alger Hub",
          description: "Colis enregistré dans le système ZR Express",
        },
        {
          timestamp: new Date(now - 36000000).toISOString(),
          status: "IN_TRANSIT",
          location: "Constantine Centre",
          description: "Arrivé à l'agence régionale de destination",
        },
        {
          timestamp: new Date(now - 7200000).toISOString(),
          status: "OUT_FOR_DELIVERY",
          location: "Sidi Mabrouk",
          description: "Assigné au livreur de secteur",
        },
      ],
      driverContact: { name: "Sofiane M.", phone: "+213661445566" },
    };
  }

  parseWebhookPayload(rawPayload: any, signature?: string): NormalizedWebhookEvent {
    const trackingNumber = rawPayload.colis_id || rawPayload.tracking || "UNKNOWN";
    const etat = (rawPayload.etat || rawPayload.status || "").toLowerCase();

    let newStatus: NormalizedTrackingStatus = "IN_TRANSIT";
    if (etat.includes("livre") || etat.includes("paye")) newStatus = "DELIVERED";
    else if (etat.includes("retour") || etat.includes("annule")) newStatus = "RETURNED";
    else if (etat.includes("cours")) newStatus = "OUT_FOR_DELIVERY";
    else if (etat.includes("depot") || etat.includes("stop")) newStatus = "READY_AT_STOP_DESK";

    return {
      trackingNumber,
      carrierId: this.carrierId,
      newStatus,
      location: rawPayload.agence || "Agence ZR Express",
      note: rawPayload.remarque || "Mise à jour en temps réel",
      timestamp: new Date().toISOString(),
      signatureValid: true,
    };
  }
}
