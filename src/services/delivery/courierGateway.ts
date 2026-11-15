import {
  ICourierAdapter,
  CarrierId,
  DeliveryRateQuote,
  ParcelCreationRequest,
  ParcelCreationResponse,
  NormalizedTrackingResult,
  NormalizedWebhookEvent,
} from "./types";
import { YalidineAdapter } from "./yalidineAdapter";
import { ZRExpressAdapter } from "./zrExpressAdapter";

export class CourierGateway {
  private adapters: Map<CarrierId, ICourierAdapter> = new Map();

  constructor() {
    // Register built-in native Algerian carriers
    this.registerAdapter(new YalidineAdapter());
    this.registerAdapter(new ZRExpressAdapter());
  }

  registerAdapter(adapter: ICourierAdapter) {
    this.adapters.set(adapter.carrierId, adapter);
  }

  getAdapter(carrierId: CarrierId): ICourierAdapter | undefined {
    return this.adapters.get(carrierId);
  }

  async getAllRateQuotes(params: {
    originWilayaId: number;
    destinationWilayaId: number;
    destinationCommune: string;
    isStopDesk: boolean;
    weightKg: number;
  }): Promise<DeliveryRateQuote[]> {
    const quotes: DeliveryRateQuote[] = [];

    for (const adapter of this.adapters.values()) {
      try {
        const quote = await adapter.calculateShippingFee(params);
        quotes.push(quote);
      } catch (err) {
        console.warn(`[COURIER_GATEWAY] Failed to get quote from ${adapter.carrierName}:`, err);
      }
    }

    // Sort by lowest price first
    return quotes.sort((a, b) => a.feeDzd - b.feeDzd);
  }

  async createShipment(
    carrierId: CarrierId,
    request: ParcelCreationRequest
  ): Promise<ParcelCreationResponse> {
    const adapter = this.getAdapter(carrierId) || this.getAdapter("yalidine");
    if (!adapter) {
      throw new Error(`Carrier adapter not found for ID: ${carrierId}`);
    }

    // Exponential retry wrapper for transient network issues
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        return await adapter.createShipment(request);
      } catch (error) {
        if (attempts >= maxAttempts) {
          throw error;
        }
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempts)));
      }
    }

    throw new Error("Failed to create parcel after max retries.");
  }

  async trackShipment(trackingNumber: string): Promise<NormalizedTrackingResult> {
    let targetCarrier: CarrierId = "yalidine";
    const upper = trackingNumber.toUpperCase();

    if (upper.startsWith("ZR-")) {
      targetCarrier = "zr_express";
    } else if (upper.startsWith("YAL-")) {
      targetCarrier = "yalidine";
    }

    const adapter = this.getAdapter(targetCarrier) || this.adapters.values().next().value;
    if (!adapter) {
      throw new Error("No courier adapter available to track shipment.");
    }

    return await adapter.trackShipment(trackingNumber);
  }

  processWebhook(
    carrierId: CarrierId,
    rawPayload: any,
    headers?: Record<string, any>
  ): NormalizedWebhookEvent {
    const adapter = this.getAdapter(carrierId);
    if (!adapter) {
      throw new Error(`Unknown carrier webhook origin: ${carrierId}`);
    }

    return adapter.parseWebhookPayload(rawPayload, headers);
  }
}

// Global singleton instance for app-wide and server-side reuse
export const courierGateway = new CourierGateway();
