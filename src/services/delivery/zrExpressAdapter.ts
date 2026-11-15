import {
  ICourierAdapter,
  CarrierId,
  DeliveryRateQuote,
  ParcelCreationRequest,
  ParcelCreationResponse,
  NormalizedTrackingResult,
  NormalizedWebhookEvent,
  CanonicalShipmentStatus,
} from "./types";

export class ZRExpressAdapter implements ICourierAdapter {
  carrierId: CarrierId = "zr_express";
  carrierName = "ZR Express Algérie";

  private apiKey: string;

  constructor(apiKey?: string) {
    const env = typeof process !== "undefined" && process.env ? process.env : {};
    this.apiKey = apiKey || (env as any).ZR_EXPRESS_API_KEY || "demo_zr_express_key";
  }

  async calculateShippingFee(params: {
    originWilayaId: number;
    destinationWilayaId: number;
    destinationCommune: string;
    isStopDesk: boolean;
    weightKg: number;
  }): Promise<DeliveryRateQuote> {
    const isLocal = params.originWilayaId === params.destinationWilayaId;

    let baseRate = isLocal ? 400 : 700;

    // Southern/Sahara wilayas surcharge
    if (params.destinationWilayaId >= 30 && params.destinationWilayaId <= 33) {
      baseRate += 300;
    } else if (params.destinationWilayaId >= 47 && params.destinationWilayaId <= 58) {
      baseRate += 450;
    }

    if (params.isStopDesk) {
      baseRate = Math.max(300, baseRate - 200);
    }

    if (params.weightKg > 5) {
      baseRate += Math.ceil(params.weightKg - 5) * 60;
    }

    return {
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      feeDzd: baseRate,
      estimatedDays: isLocal ? "24h" : "48h - 72h",
      isStopDesk: params.isStopDesk,
      currency: "DZD",
    };
  }

  async createShipment(request: ParcelCreationRequest): Promise<ParcelCreationResponse> {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const wilayaStr = String(request.recipient.wilayaId).padStart(2, "0");
    const trackingNumber = `ZR-${wilayaStr}${randomSuffix}-DZ`;
    const labelBarcode = `*${trackingNumber}*`;

    return {
      trackingNumber,
      carrierId: this.carrierId,
      labelBarcode,
      awbUrl: `https://zrexpress.dz/tracking/label/${trackingNumber}.pdf`,
      estimatedDeliveryDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      carrierRawResponse: {
        status: "accepted",
        barcode: trackingNumber,
        wilaya: request.recipient.wilayaName,
        stop_desk: request.isStopDesk,
        montant_a_recouvrer: request.codAmountDzd,
      },
    };
  }

  async trackShipment(trackingNumber: string): Promise<NormalizedTrackingResult> {
    const now = new Date();
    const createdDate = new Date(now.getTime() - 20 * 3600 * 1000);

    return {
      trackingNumber,
      orderId: "ORD-" + trackingNumber.replace(/[^0-9]/g, "").slice(0, 6),
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      currentStatus: "OUT_FOR_DELIVERY",
      statusLabel_en: "Out for Delivery with Courier Driver",
      statusLabel_fr: "En cours de livraison avec le livreur",
      statusLabel_ar: "الطرد في عهدة السائق للتسليم النهائي للعنوان",
      lastUpdated: now.toISOString(),
      originWilaya: "16 - Alger",
      destinationWilaya: "25 - Constantine",
      destinationCommune: "El Khroub",
      deliveryType: "home_delivery",
      codAmountDzd: 6200,
      recipientName: "Client Yume",
      recipientPhone: "+213 770 98 76 54",
      events: [
        {
          status: "LABEL_GENERATED",
          timestamp: createdDate.toISOString(),
          location: "Constantine Agency",
          description_en: "Shipment declaration registered",
          description_fr: "Bordereau enregistré chez ZR Express",
          description_ar: "تم تسجيل الشحنة في نظام ZR Express",
        },
        {
          status: "IN_TRANSIT",
          timestamp: new Date(createdDate.getTime() + 6 * 3600 * 1000).toISOString(),
          location: "Centre de Tri Est",
          description_en: "Transferred through eastern inter-wilaya logistics corridor",
          description_fr: "Transfert via le corridor logistique régional de l'Est",
          description_ar: "تم نقل الطرد عبر مسار الشحن الشرقي بين الولايات",
        },
        {
          status: "OUT_FOR_DELIVERY",
          timestamp: now.toISOString(),
          location: "El Khroub",
          description_en: "Courier contacted customer for delivery handover",
          description_fr: "Le livreur est en route pour la remise en main propre",
          description_ar: "مندوب التوصيل في طريقه لتسليم الطرد للزبون يداً بيد",
          driverName: "Yassine Driver",
          driverPhone: "+213 661 22 33 44",
        },
      ],
    };
  }

  parseWebhookPayload(rawPayload: any, headers?: Record<string, any>): NormalizedWebhookEvent {
    const zrStatus = (rawPayload?.statut || rawPayload?.step || "").toLowerCase();
    let status: CanonicalShipmentStatus = "IN_TRANSIT";

    if (zrStatus.includes("livre") || zrStatus.includes("delivered")) {
      status = "DELIVERED";
    } else if (zrStatus.includes("distrib") || zrStatus.includes("livraison")) {
      status = "OUT_FOR_DELIVERY";
    } else if (zrStatus.includes("bureau") || zrStatus.includes("agence")) {
      status = "READY_AT_STOP_DESK";
    } else if (zrStatus.includes("retour") || zrStatus.includes("echec")) {
      status = "RETURNED";
    } else if (zrStatus.includes("cree") || zrStatus.includes("creation")) {
      status = "LABEL_GENERATED";
    }

    return {
      trackingNumber: rawPayload?.code_envoi || rawPayload?.tracking || "UNKNOWN",
      carrierId: this.carrierId,
      status,
      timestamp: rawPayload?.date_scan || new Date().toISOString(),
      location: rawPayload?.commune_scan || "Algérie",
      eventReason: rawPayload?.remarque || undefined,
      rawPayload,
    };
  }
}
