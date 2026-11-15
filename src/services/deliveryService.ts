/**
 * Delivery Integration Protocol Service (/api/delivery/*)
 * Connects frontend with Yalidine Fast Express, ZR Express, and extensible couriers.
 */

export interface ShippingRate {
  carrierId: "yalidine" | "zr_express" | "kazitour" | "mayestro" | "custom";
  carrierName: string;
  feeDzd: number;
  isStopDesk: boolean;
  estimatedDays: string;
  currency: "DZD";
}

export interface TrackingEventItem {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

export interface TrackingDetails {
  trackingNumber: string;
  carrierId: string;
  carrierName: string;
  orderId: string;
  currentStatus: string;
  statusLabel_ar: string;
  statusLabel_fr: string;
  lastUpdated: string;
  origin: { wilayaId: number; wilayaName: string };
  destination: { wilayaId: number; wilayaName: string; commune?: string };
  codAmountDzd: number;
  events: TrackingEventItem[];
  driverContact?: { name: string; phone: string };
  carrierServiceType?: string;
}

export interface DispatchShipmentPayload {
  orderId: string;
  carrierId: "yalidine" | "zr_express" | "kazitour" | "mayestro" | "custom";
  isStopDesk: boolean;
  stopDeskId?: string;
  weightKg?: number;
  codAmountDzd: number;
  freeShipping?: boolean;
  recipient: {
    name: string;
    phone: string;
    address: string;
    commune?: string;
    wilayaId: number;
    wilayaName: string;
  };
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

export const deliveryService = {
  // Calculate delivery rates across 58 wilayas
  async calculateRates(params: {
    originWilayaId?: number;
    destinationWilayaId: number;
    destinationCommune?: string;
    isStopDesk?: boolean;
    weightKg?: number;
  }): Promise<ShippingRate[]> {
    const res = await fetch("/api/delivery/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Failed to calculate shipping rates");
    const data = await res.json();
    return data.rates || [];
  },

  // Dispatch parcel with chosen courier & generate printable AWB barcode
  async dispatchShipment(payload: DispatchShipmentPayload): Promise<{
    trackingNumber: string;
    carrierName: string;
    barcodeData: string;
    labelHtml?: string;
    statusLabel_ar: string;
    statusLabel_fr: string;
  }> {
    const res = await fetch("/api/delivery/ship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to dispatch courier parcel");
    }
    const data = await res.json();
    return data.shipment;
  },

  // Track shipment by tracking number or order ID
  async trackShipment(trackingNumber: string): Promise<TrackingDetails> {
    const res = await fetch(`/api/delivery/track/${encodeURIComponent(trackingNumber)}`);
    if (!res.ok) throw new Error("Tracking details not found");
    return res.json();
  },

  // Trigger manual background reconciliation
  async syncShipments(): Promise<{ reconciledShipments: number; timestamp: string }> {
    const res = await fetch("/api/delivery/sync", { method: "POST" });
    if (!res.ok) throw new Error("Failed to sync shipments");
    return res.json();
  },

  // Format Algerian phone numbers to standard international dial format
  formatAlgerianPhone(phone: string): string {
    const clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("213")) return `+${clean}`;
    if (clean.startsWith("0")) return `+213${clean.slice(1)}`;
    return `+213${clean}`;
  },

  // Generate WhatsApp confirmation link in Arabic and French
  generateWhatsAppConfirmation(order: {
    id: string;
    recipientName: string;
    phone: string;
    totalAmountDzd: number;
    wilayaName: string;
    itemsSummary?: string;
  }, lang: "ar" | "fr" | "en" = "ar"): string {
    const cleanPhone = this.formatAlgerianPhone(order.phone).replace("+", "");

    let message = "";
    if (lang === "ar") {
      message = `السلام عليكم ${order.recipientName} 🌸
معكم متجرنا على منصة يومي (Yume).
بخصوص طلبيتكم رقم #${order.id} (${order.itemsSummary || "المنتجات المحددة"}).
المبلغ الإجمالي عند الاستلام (COD): ${order.totalAmountDzd.toLocaleString()} دج.
عنوان التوصيل: ولاية ${order.wilayaName}.

يرجى تأكيد طلبكم بالرد بـ "نعم أؤكد الطلب" لنتكفل بالشحن السريع عبر شركة التوصيل فوراً. شكراً لثقتكم!`;
    } else if (lang === "fr") {
      message = `Bonjour ${order.recipientName} 👋,
Nous vous contactons de la part de notre boutique sur la plateforme Yume.
Concernant votre commande n° #${order.id} (${order.itemsSummary || "Articles commandés"}).
Montant total à payer à la livraison (COD): ${order.totalAmountDzd.toLocaleString()} DZD.
Adresse de livraison: Wilaya de ${order.wilayaName}.

Merci de confirmer votre commande en répondant "Oui, je confirme" afin de procéder à l'expédition immédiate avec notre transporteur. Merci!`;
    } else {
      message = `Hello ${order.recipientName},
Regarding your order #${order.id} on Yume (${order.itemsSummary || "Order items"}).
Total Cash on Delivery: ${order.totalAmountDzd.toLocaleString()} DZD.
Destination: ${order.wilayaName}.
Please confirm your order by replying "Yes, I confirm" for immediate courier dispatch!`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  },

  // Generate native phone call link
  generatePhoneCallLink(phone: string): string {
    const formatted = this.formatAlgerianPhone(phone);
    return `tel:${formatted}`;
  },
};
