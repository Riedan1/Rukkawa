export type CarrierId = "yalidine" | "zr_express" | "kazitour" | "mayestro" | "custom";

export type NormalizedTrackingStatus =
  | "SUBMITTED"
  | "CONFIRMED_BY_MERCHANT"
  | "LABEL_GENERATED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "READY_AT_STOP_DESK"
  | "DELIVERED"
  | "RETURNED"
  | "FAILED_ATTEMPT"
  | "CANCELED";

export interface TrackingEvent {
  timestamp: string;
  status: NormalizedTrackingStatus;
  location: string;
  description: string;
}

export interface RecipientInfo {
  name: string;
  phone: string;
  phone2?: string;
  address: string;
  commune?: string;
  wilayaId: number;
  wilayaName: string;
}

export interface OrderPayload {
  orderId: string;
  carrierId: CarrierId;
  isStopDesk: boolean;
  stopDeskId?: string;
  weightKg?: number;
  codAmountDzd: number;
  freeShipping?: boolean;
  recipient: RecipientInfo;
  origin: {
    wilayaId: number;
    wilayaName: string;
    commune?: string;
    address?: string;
    storeName?: string;
    contactPhone?: string;
  };
  productSummary?: string;
  notes?: string;
}

export interface RateCalculationParams {
  originWilayaId: number;
  destinationWilayaId: number;
  destinationCommune?: string;
  isStopDesk: boolean;
  weightKg?: number;
}

export interface ShippingRateResult {
  carrierId: CarrierId;
  carrierName: string;
  feeDzd: number;
  isStopDesk: boolean;
  estimatedDays: string;
  currency: "DZD";
}

export interface ShipmentResult {
  trackingNumber: string;
  carrierId: CarrierId;
  carrierName: string;
  orderId: string;
  currentStatus: NormalizedTrackingStatus;
  statusLabel_ar: string;
  statusLabel_fr: string;
  awbUrl?: string;
  barcodeData: string;
  labelHtml?: string;
  carrierRawResponse?: any;
  createdAt: string;
}

export interface NormalizedTrackingLookup {
  trackingNumber: string;
  carrierId: CarrierId;
  carrierName: string;
  orderId: string;
  currentStatus: NormalizedTrackingStatus;
  statusLabel_ar: string;
  statusLabel_fr: string;
  lastUpdated: string;
  origin: { wilayaId: number; wilayaName: string };
  destination: { wilayaId: number; wilayaName: string; commune?: string };
  codAmountDzd: number;
  events: TrackingEvent[];
  driverContact?: { name: string; phone: string };
}

export interface NormalizedWebhookEvent {
  trackingNumber: string;
  carrierId: CarrierId;
  newStatus: NormalizedTrackingStatus;
  location?: string;
  note?: string;
  timestamp: string;
  signatureValid: boolean;
}

export interface ICourierAdapter {
  carrierId: CarrierId;
  carrierName: string;

  calculateShippingFee(params: RateCalculationParams): Promise<ShippingRateResult>;

  createShipment(order: OrderPayload): Promise<ShipmentResult>;

  trackShipment(trackingNumber: string): Promise<NormalizedTrackingLookup>;

  parseWebhookPayload(rawPayload: any, signature?: string): NormalizedWebhookEvent;
}
