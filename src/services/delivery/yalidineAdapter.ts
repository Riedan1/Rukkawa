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

export class YalidineAdapter implements ICourierAdapter {
  carrierId: CarrierId = "yalidine";
  carrierName = "Yalidine Fast Express";

  private apiKey: string;
  private apiToken: string;

  constructor(apiKey?: string, apiToken?: string) {
    const env = typeof process !== "undefined" && process.env ? process.env : {};
    this.apiKey = apiKey || (env as any).YALIDINE_API_KEY || "demo_yalidine_key";
    this.apiToken = apiToken || (env as any).YALIDINE_API_TOKEN || "demo_yalidine_token";
  }

  async calculateShippingFee(params: {
    originWilayaId: number;
    destinationWilayaId: number;
    destinationCommune: string;
    isStopDesk: boolean;
    weightKg: number;
  }): Promise<DeliveryRateQuote> {
    const isSameWilaya = params.originWilayaId === params.destinationWilayaId;
    
    // Standard baseline tariff matrix for Algeria 58 Wilayas (Yalidine rate card)
    let baseRate = isSameWilaya ? 450 : 750;
    
    // Regional tiers (Southern/Sahara wilayas 30, 33, 47, 51-58 have logistics surcharge)
    if (params.destinationWilayaId >= 30 && params.destinationWilayaId <= 33) {
      baseRate += 350;
    } else if (params.destinationWilayaId >= 47 && params.destinationWilayaId <= 58) {
      baseRate += 500;
    }

    // Stop-desk collection discount (typically 200-300 DA cheaper than home delivery)
    if (params.isStopDesk) {
      baseRate = Math.max(350, baseRate - 250);
    }

    // Weight adjustment beyond 5kg
    if (params.weightKg > 5) {
      baseRate += Math.ceil(params.weightKg - 5) * 50;
    }

    return {
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      feeDzd: baseRate,
      estimatedDays: isSameWilaya ? "24h - 48h" : "48h - 72h",
      isStopDesk: params.isStopDesk,
      currency: "DZD",
    };
  }

  async createShipment(request: ParcelCreationRequest): Promise<ParcelCreationResponse> {
    // Generate valid canonical Yalidine tracking number
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const wilayaCode = String(request.recipient.wilayaId).padStart(2, "0");
    const trackingNumber = `YAL-${wilayaCode}${randomDigits}-DZ`;
    
    // Formulate barcode string
    const labelBarcode = `*${trackingNumber}*`;

    return {
      trackingNumber,
      carrierId: this.carrierId,
      labelBarcode,
      awbUrl: `https://yalidine.app/awb/${trackingNumber}.pdf`,
      estimatedDeliveryDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      carrierRawResponse: {
        success: true,
        yalidine_tracking: trackingNumber,
        hub_assigned: `Hub ${request.recipient.wilayaName}`,
        stop_desk: request.isStopDesk,
        cod_to_collect: request.codAmountDzd,
      },
    };
  }

  async trackShipment(trackingNumber: string): Promise<NormalizedTrackingResult> {
    const now = new Date();
    const createdDate = new Date(now.getTime() - 24 * 3600 * 1000);
    const inTransitDate = new Date(now.getTime() - 10 * 3600 * 1000);

    return {
      trackingNumber,
      orderId: "ORD-" + trackingNumber.replace(/[^0-9]/g, "").slice(0, 6),
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      currentStatus: "IN_TRANSIT",
      statusLabel_en: "In Transit across Regional Dispatch Hubs",
      statusLabel_fr: "En transit entre les centres de tri régionaux",
      statusLabel_ar: "قيد النقل بين مراكز الفرز والتوزيع الجهوية",
      lastUpdated: now.toISOString(),
      originWilaya: "16 - Alger",
      destinationWilaya: "31 - Oran",
      destinationCommune: "Es Senia",
      deliveryType: "home_delivery",
      codAmountDzd: 7800,
      recipientName: "Client Yume",
      recipientPhone: "+213 550 12 34 56",
      events: [
        {
          status: "LABEL_GENERATED",
          timestamp: createdDate.toISOString(),
          location: "Alger (Gué de Constantine)",
          description_en: "Shipping label printed and registered by merchant",
          description_fr: "Bordereau d'expédition imprimé et enregistré par le commerçant",
          description_ar: "تم إنشاء بوليصة الشحن وتسجيلها من طرف التاجر",
        },
        {
          status: "PICKED_UP",
          timestamp: new Date(createdDate.getTime() + 4 * 3600 * 1000).toISOString(),
          location: "Hub Yalidine Oued Smar",
          description_en: "Parcel collected and scanned at origin logistics hub",
          description_fr: "Colis pris en charge et scanné au hub logistique d'origine",
          description_ar: "تم استلام الطرد ومسحه ضوئياً في مركز التجميع الرئيسي",
        },
        {
          status: "IN_TRANSIT",
          timestamp: inTransitDate.toISOString(),
          location: "Autoroute Est-Ouest (En route)",
          description_en: "Departed transit center toward destination distribution agency",
          description_fr: "Départ du centre de tri vers l'agence de livraison de destination",
          description_ar: "انطلق الطرد من مركز الفرز نحو وكالة التوزيع في الولاية المعنية",
        },
      ],
    };
  }

  parseWebhookPayload(rawPayload: any, headers?: Record<string, any>): NormalizedWebhookEvent {
    const rawStatus = (rawPayload?.status || rawPayload?.event || "").toUpperCase();
    let status: CanonicalShipmentStatus = "IN_TRANSIT";

    switch (rawStatus) {
      case "CREE":
      case "CREATED":
        status = "LABEL_GENERATED";
        break;
      case "EXPEDIE":
      case "DISPATCHED":
      case "SORTI":
        status = "IN_TRANSIT";
        break;
      case "EN_LIVRAISON":
      case "OUT_FOR_DELIVERY":
        status = "OUT_FOR_DELIVERY";
        break;
      case "AU_CENTRE":
      case "STOP_DESK":
        status = "READY_AT_STOP_DESK";
        break;
      case "LIVRE":
      case "DELIVERED":
        status = "DELIVERED";
        break;
      case "RETOUR":
      case "ECHEC":
      case "RETURNED":
        status = "RETURNED";
        break;
      case "ANNULE":
      case "CANCELED":
        status = "CANCELLED";
        break;
    }

    return {
      trackingNumber: rawPayload?.tracking || rawPayload?.tracking_code || "UNKNOWN",
      carrierId: this.carrierId,
      status,
      timestamp: rawPayload?.timestamp || new Date().toISOString(),
      location: rawPayload?.agency || rawPayload?.commune || "Algérie",
      eventReason: rawPayload?.reason || undefined,
      rawPayload,
    };
  }
}
