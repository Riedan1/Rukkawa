export type CanonicalShipmentStatus =
  | "SUBMITTED"
  | "CONFIRMED_BY_MERCHANT"
  | "LABEL_GENERATED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "READY_AT_STOP_DESK"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED";

export type CarrierId = "yalidine" | "zr_express" | "custom";

export interface DeliveryRateQuote {
  carrierId: CarrierId;
  carrierName: string;
  feeDzd: number;
  estimatedDays: string;
  isStopDesk: boolean;
  currency: string;
}

export interface ParcelCreationRequest {
  orderId: string;
  storeId: string;
  carrierId: CarrierId;
  recipient: {
    name: string;
    phone: string;
    secondaryPhone?: string;
    address: string;
    wilayaId: number;
    wilayaName: string;
    commune: string;
  };
  isStopDesk: boolean;
  stopDeskCode?: string;
  codAmountDzd: number;
  weightKg: number;
  itemsDescription: string;
  declaredValueDzd?: number;
  allowOpenPackage?: boolean;
}

export interface ParcelCreationResponse {
  trackingNumber: string;
  carrierId: CarrierId;
  awbUrl?: string;
  labelBarcode: string;
  estimatedDeliveryDate?: string;
  carrierRawResponse?: any;
}

export interface NormalizedTrackingEvent {
  status: CanonicalShipmentStatus;
  timestamp: string;
  location: string;
  description_en: string;
  description_fr: string;
  description_ar: string;
  driverName?: string;
  driverPhone?: string;
}

export interface NormalizedTrackingResult {
  trackingNumber: string;
  orderId: string;
  carrierId: CarrierId;
  carrierName: string;
  currentStatus: CanonicalShipmentStatus;
  statusLabel_en: string;
  statusLabel_fr: string;
  statusLabel_ar: string;
  lastUpdated: string;
  originWilaya: string;
  destinationWilaya: string;
  destinationCommune: string;
  deliveryType: "home_delivery" | "stop_desk";
  codAmountDzd: number;
  recipientName: string;
  recipientPhone: string;
  events: NormalizedTrackingEvent[];
}

export interface NormalizedWebhookEvent {
  trackingNumber: string;
  carrierId: CarrierId;
  status: CanonicalShipmentStatus;
  timestamp: string;
  location?: string;
  eventReason?: string;
  rawPayload: any;
}

export interface ICourierAdapter {
  carrierId: CarrierId;
  carrierName: string;

  calculateShippingFee(params: {
    originWilayaId: number;
    destinationWilayaId: number;
    destinationCommune: string;
    isStopDesk: boolean;
    weightKg: number;
  }): Promise<DeliveryRateQuote>;

  createShipment(request: ParcelCreationRequest): Promise<ParcelCreationResponse>;

  trackShipment(trackingNumber: string): Promise<NormalizedTrackingResult>;

  parseWebhookPayload(rawPayload: any, headers?: Record<string, any>): NormalizedWebhookEvent;
}
