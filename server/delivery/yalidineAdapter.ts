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

function getZone(wilayaId: number): number {
  if ([16, 9, 35, 42].includes(wilayaId)) return 1; // Alger, Blida, Boumerdes, Tipaza
  if ([31, 25, 13, 19, 6, 15, 23, 27, 22].includes(wilayaId)) return 2; // Major cities: Oran, Constantine, Tlemcen, Setif, Bejaia, Tizi, Annaba...
  if (wilayaId >= 1 && wilayaId <= 48 && wilayaId !== 11 && wilayaId !== 33 && wilayaId !== 37) return 3; // Hauts Plateaux / Interior
  if ([30, 39, 47, 7, 8, 3].includes(wilayaId)) return 4; // Oasis & North Sahara (Ouargla, Ghardaia, Biskra, Bechar...)
  return 5; // Far South (Tamanrasset, Illizi, Tindouf, Djanet, In Salah, In Guezzam, Bordj Baji Mokhtar...)
}

export class YalidineAdapter implements ICourierAdapter {
  carrierId = "yalidine" as const;
  carrierName = "Yalidine Fast Express";

  private apiId: string;
  private apiToken: string;

  constructor(apiId: string = "", apiToken: string = "") {
    this.apiId = apiId || process.env.YALIDINE_API_ID || "";
    this.apiToken = apiToken || process.env.YALIDINE_API_TOKEN || "";
  }

  async calculateShippingFee(params: RateCalculationParams): Promise<ShippingRateResult> {
    const { originWilayaId, destinationWilayaId, isStopDesk, weightKg = 1 } = params;
    const destZone = getZone(destinationWilayaId);
    const isSameWilaya = originWilayaId === destinationWilayaId;

    let baseFee = 600;
    let days = "24 - 48h";

    if (isSameWilaya) {
      baseFee = isStopDesk ? 350 : 450;
      days = "24h";
    } else if (destZone === 1) {
      baseFee = isStopDesk ? 400 : 550;
      days = "24 - 48h";
    } else if (destZone === 2) {
      baseFee = isStopDesk ? 550 : 750;
      days = "24 - 48h";
    } else if (destZone === 3) {
      baseFee = isStopDesk ? 700 : 900;
      days = "48 - 72h";
    } else if (destZone === 4) {
      baseFee = isStopDesk ? 900 : 1200;
      days = "3 - 5 jours";
    } else {
      baseFee = isStopDesk ? 1200 : 1600;
      days = "4 - 7 jours";
    }

    if (weightKg > 5) {
      baseFee += Math.ceil(weightKg - 5) * 60;
    }

    return {
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      feeDzd: baseFee,
      isStopDesk,
      estimatedDays: days,
      currency: "DZD",
    };
  }

  async createShipment(order: OrderPayload): Promise<ShipmentResult> {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const trackingNumber = `YAL-${randomSuffix}-DZ`;
    const now = new Date().toISOString();

    const labelHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; border: 2px solid #000; padding: 15px; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e11d48; padding-bottom: 8px;">
          <h2 style="margin: 0; color: #e11d48; font-size: 20px;">YALIDINE FAST EXPRESS</h2>
          <span style="font-size: 11px; font-weight: bold; background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px;">
            ${order.isStopDesk ? "STOP DESK (BUREAU)" : "LIVRAISON À DOMICILE"}
          </span>
        </div>
        <div style="text-align: center; margin: 15px 0;">
          <div style="font-size: 26px; font-weight: 900; letter-spacing: 3px;">${trackingNumber}</div>
          <div style="background: #111; color: #fff; display: inline-block; padding: 4px 12px; margin-top: 5px; font-family: monospace; font-size: 12px; border-radius: 2px;">
            *${trackingNumber}*
          </div>
        </div>
        <div style="border-top: 1px dashed #ccc; padding-top: 10px; font-size: 13px;">
          <p style="margin: 4px 0;"><strong>Destinataire:</strong> ${order.recipient.name}</p>
          <p style="margin: 4px 0;"><strong>Téléphone:</strong> ${order.recipient.phone}</p>
          <p style="margin: 4px 0;"><strong>Wilaya:</strong> ${order.recipient.wilayaName} (${order.recipient.wilayaId})</p>
          <p style="margin: 4px 0;"><strong>Adresse:</strong> ${order.recipient.address}</p>
        </div>
        <div style="border-top: 2px solid #000; margin-top: 10px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 16px;">
          <strong>MONTANT COD:</strong>
          <strong style="color: #047857;">${order.codAmountDzd} DZD</strong>
        </div>
      </div>
    `;

    return {
      trackingNumber,
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      orderId: order.orderId,
      currentStatus: "LABEL_GENERATED",
      statusLabel_ar: "تم إنشاء بوليصة الشحن (Yalidine)",
      statusLabel_fr: "Bordereau d'expédition créé (Yalidine)",
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
      orderId: "ORD-DZ-" + trackingNumber.slice(-6),
      currentStatus: "IN_TRANSIT",
      statusLabel_ar: "قيد النقل عبر شبكة ياليدين السريعة",
      statusLabel_fr: "En transit via le réseau Yalidine Express",
      lastUpdated: new Date(now).toISOString(),
      origin: { wilayaId: 16, wilayaName: "Alger (Hub Oued Smar)" },
      destination: { wilayaId: 31, wilayaName: "Oran", commune: "Es Senia" },
      codAmountDzd: 4500,
      events: [
        {
          timestamp: new Date(now - 86400000).toISOString(),
          status: "LABEL_GENERATED",
          location: "Alger",
          description: "Bordereau d'expédition enregistré sur le portail Yalidine",
        },
        {
          timestamp: new Date(now - 43200000).toISOString(),
          status: "PICKED_UP",
          location: "Agence Alger Centre",
          description: "Colis scanné et ramassé par le livreur",
        },
        {
          timestamp: new Date(now - 14400000).toISOString(),
          status: "IN_TRANSIT",
          location: "Hub Principal Oued Smar",
          description: "Expédié vers le centre régional de tri",
        },
      ],
      driverContact: { name: "Amine K.", phone: "+213550112233" },
    };
  }

  parseWebhookPayload(rawPayload: any, signature?: string): NormalizedWebhookEvent {
    const trackingNumber = rawPayload.tracking || rawPayload.tracking_number || rawPayload.code || "UNKNOWN";
    const statusRaw = (rawPayload.status || rawPayload.event || "").toLowerCase();

    let newStatus: NormalizedTrackingStatus = "IN_TRANSIT";
    if (statusRaw.includes("livré") || statusRaw.includes("delivered")) newStatus = "DELIVERED";
    else if (statusRaw.includes("retour") || statusRaw.includes("returned")) newStatus = "RETURNED";
    else if (statusRaw.includes("stop") || statusRaw.includes("bureau")) newStatus = "READY_AT_STOP_DESK";
    else if (statusRaw.includes("distribution") || statusRaw.includes("livreur")) newStatus = "OUT_FOR_DELIVERY";
    else if (statusRaw.includes("ramass") || statusRaw.includes("picked")) newStatus = "PICKED_UP";

    return {
      trackingNumber,
      carrierId: this.carrierId,
      newStatus,
      location: rawPayload.center || rawPayload.wilaya || "Hub Yalidine",
      note: rawPayload.reason || rawPayload.comment || "Mise à jour automatique par scan chauffeur",
      timestamp: new Date().toISOString(),
      signatureValid: true,
    };
  }
}
