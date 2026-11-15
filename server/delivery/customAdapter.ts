import {
  ICourierAdapter,
  OrderPayload,
  RateCalculationParams,
  ShippingRateResult,
  ShipmentResult,
  NormalizedTrackingLookup,
  NormalizedWebhookEvent,
  CarrierId,
} from "./types";

export class CustomCourierAdapter implements ICourierAdapter {
  carrierId: CarrierId = "custom";
  carrierName: string = "Custom Regional Courier";

  constructor(carrierId: CarrierId = "custom", carrierName: string = "Custom Courier") {
    this.carrierId = carrierId;
    this.carrierName = carrierName;
  }

  async calculateShippingFee(params: RateCalculationParams): Promise<ShippingRateResult> {
    const { isStopDesk } = params;
    return {
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      feeDzd: isStopDesk ? 450 : 650,
      isStopDesk,
      estimatedDays: "24 - 72h",
      currency: "DZD",
    };
  }

  async createShipment(order: OrderPayload): Promise<ShipmentResult> {
    const prefix = this.carrierId.toUpperCase().slice(0, 3);
    const trackingNumber = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}-DZ`;
    const now = new Date().toISOString();

    const labelHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; border: 2px solid #3b82f6; padding: 15px; border-radius: 8px;">
        <h3 style="margin: 0; color: #1d4ed8;">${this.carrierName.toUpperCase()}</h3>
        <p style="font-size: 20px; font-weight: bold; margin: 10px 0;">${trackingNumber}</p>
        <p><strong>Destinataire:</strong> ${order.recipient.name} (${order.recipient.phone})</p>
        <p><strong>Wilaya:</strong> ${order.recipient.wilayaName}</p>
        <p><strong>Montant COD:</strong> ${order.codAmountDzd} DZD</p>
      </div>
    `;

    return {
      trackingNumber,
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      orderId: order.orderId,
      currentStatus: "LABEL_GENERATED",
      statusLabel_ar: `تم إنشاء بوليصة الشحن (${this.carrierName})`,
      statusLabel_fr: `Bordereau créé (${this.carrierName})`,
      barcodeData: trackingNumber,
      labelHtml,
      createdAt: now,
    };
  }

  async trackShipment(trackingNumber: string): Promise<NormalizedTrackingLookup> {
    return {
      trackingNumber,
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      orderId: "ORD-" + trackingNumber.slice(-6),
      currentStatus: "IN_TRANSIT",
      statusLabel_ar: "قيد النقل عبر شبكة التوصيل",
      statusLabel_fr: "En transit via le réseau partenaire",
      lastUpdated: new Date().toISOString(),
      origin: { wilayaId: 16, wilayaName: "Alger" },
      destination: { wilayaId: 31, wilayaName: "Oran" },
      codAmountDzd: 5000,
      events: [
        {
          timestamp: new Date().toISOString(),
          status: "IN_TRANSIT",
          location: "Hub Central",
          description: "Pris en charge par le transporteur régional",
        },
      ],
    };
  }

  parseWebhookPayload(rawPayload: any): NormalizedWebhookEvent {
    return {
      trackingNumber: rawPayload.tracking || "UNKNOWN",
      carrierId: this.carrierId,
      newStatus: "IN_TRANSIT",
      timestamp: new Date().toISOString(),
      signatureValid: true,
    };
  }
}
