import React, { useState, useMemo } from "react";
import {
  Truck,
  Scale,
  Box,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  Split,
  HelpCircle,
  Info,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Order,
  CarrierTariffProfile,
  CarrierRateEvaluationResult,
} from "../../types";
import {
  getDefaultCarrierTariffProfiles,
  evaluateCarrierTariffs,
  createSplitOrderShipments,
} from "../../services/financialReconciliationService";
const formatPrice = (amount: number | null | undefined, currencyCode = "DZD"): string =>
  `${Number(amount || 0).toLocaleString()} ${currencyCode}`;
import { SkeuomorphicSwitch } from "../SkeuomorphicSwitch";

export interface FulfillmentHubProps {
  store?: any;
  orders: Order[];
  onUpdateOrder: (updated: Order) => void;
  tariffProfiles?: CarrierTariffProfile[];
  onUpdateTariffProfiles?: (profiles: CarrierTariffProfile[]) => void;
  initialSelectedOrderId?: string | null;
  accentColor?: string;
  setFeedbackMessage?: (msg: string) => void;
  countryCode?: string;
  currencyCode?: string;
}

export const FulfillmentHub: React.FC<FulfillmentHubProps> = ({
  orders,
  onUpdateOrder,
  countryCode = "DZ",
  currencyCode = "DZD",
}) => {
  const [tariffProfiles, setTariffProfiles] = useState<CarrierTariffProfile[]>(() =>
    getDefaultCarrierTariffProfiles(countryCode)
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => orders[0]?.id || "");
  const [deliveryType, setDeliveryType] = useState<"home" | "desk">("home");
  const [actualWeightKg, setActualWeightKg] = useState<number>(1.2);
  const [lengthCm, setLengthCm] = useState<string>("30");
  const [widthCm, setWidthCm] = useState<string>("25");
  const [heightCm, setHeightCm] = useState<string>("15");
  const [preferContractOverApi, setPreferContractOverApi] = useState<boolean>(true);
  const [manualSelectedStaleCarriers, setManualSelectedStaleCarriers] = useState<string[]>([]);
  const [manualOverrides, setManualOverrides] = useState<
    Record<string, { price: number; reason: string }>
  >({});
  const [overrideInputPrice, setOverrideInputPrice] = useState<Record<string, string>>({});
  const [overrideInputReason, setOverrideInputReason] = useState<Record<string, string>>({});
  const [showHints, setShowHints] = useState<boolean>(false);

  // Split shipment builder state
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [splitParcel2Items, setSplitParcel2Items] = useState<Record<string, number>>({});
  const [splitParcel1CarrierId, setSplitParcel1CarrierId] = useState<string>("yalidine");
  const [splitParcel2CarrierId, setSplitParcel2CarrierId] = useState<string>("zrexpress");
  const [dispatchFeedback, setDispatchFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || orders[0] || null,
    [orders, selectedOrderId]
  );

  const dimensionsCm = useMemo(() => {
    const l = Number(lengthCm);
    const w = Number(widthCm);
    const h = Number(heightCm);
    if (l > 0 && w > 0 && h > 0) {
      return { length: l, width: w, height: h };
    }
    return null;
  }, [lengthCm, widthCm, heightCm]);

  const evaluatedRates = useMemo<CarrierRateEvaluationResult[]>(() => {
    const regionCode =
      selectedOrder?.shopper?.wilayaCode || selectedOrder?.shopper?.wilaya || "16";
    const codAmount =
      selectedOrder?.financials?.totalCodCollectable || selectedOrder?.total || 5100;
    const isCod = (selectedOrder?.paymentMethod || "cod") === "cod";

    return evaluateCarrierTariffs({
      profiles: tariffProfiles,
      countryCode,
      regionCode,
      deliveryType,
      actualWeightKg,
      dimensionsCm,
      codAmount,
      isCod,
      preferMerchantContractOverLiveApi: preferContractOverApi,
      forceManualSelectionCarrierIds: manualSelectedStaleCarriers,
      manualPriceOverrides: manualOverrides,
    });
  }, [
    tariffProfiles,
    countryCode,
    selectedOrder,
    deliveryType,
    actualWeightKg,
    dimensionsCm,
    preferContractOverApi,
    manualSelectedStaleCarriers,
    manualOverrides,
  ]);

  const handleRenewContractRate = (carrierId: string) => {
    const nowIso = new Date().toISOString();
    setTariffProfiles((prev) =>
      prev.map((p) =>
        p.carrierId === carrierId && p.source === "merchant_custom"
          ? {
              ...p,
              lastUpdatedAt: nowIso,
              validUntil: new Date(Date.now() + 180 * 86400 * 1000).toISOString(),
            }
          : p
      )
    );
    setDispatchFeedback({
      type: "success",
      text: `Contract tariff for ${carrierId.toUpperCase()} verified and renewed (${new Date().toLocaleDateString()}). Automatic Priority Tier 1 restored.`,
    });
  };

  const handleApplyManualPriceOverride = (evalRes: CarrierRateEvaluationResult) => {
    // Enforce Correction #2: Never allow manual price override if operational service coverage is blocked
    if (!evalRes.canApplyManualPriceOverride) {
      setDispatchFeedback({
        type: "error",
        text: `Blocked: Manual price override cannot bypass ${evalRes.operationalState} (${evalRes.blockReason}).`,
      });
      return;
    }

    const priceVal = Number(overrideInputPrice[evalRes.carrierId]);
    const reasonVal = (overrideInputReason[evalRes.carrierId] || "").trim();
    if (Number.isNaN(priceVal) || priceVal < 0 || !reasonVal) {
      setDispatchFeedback({
        type: "error",
        text: "Please enter a valid non-negative price and an audit reason for the Manual Price Override.",
      });
      return;
    }

    setManualOverrides((prev) => ({
      ...prev,
      [evalRes.carrierId]: { price: priceVal, reason: reasonVal },
    }));
    setDispatchFeedback({
      type: "success",
      text: `Audited Manual Price Override (${formatPrice(priceVal, currencyCode)}) applied to ${evalRes.carrierName}.`,
    });
  };

  const handleDispatchSingleShipment = (evalRes: CarrierRateEvaluationResult) => {
    if (!selectedOrder) return;
    if (
      evalRes.operationalState === "DESTINATION_UNSUPPORTED" ||
      evalRes.operationalState === "SERVICE_UNAVAILABLE" ||
      evalRes.shippingFee === null
    ) {
      setDispatchFeedback({
        type: "error",
        text: evalRes.blockReason || "Cannot dispatch shipment: service or price unavailable.",
      });
      return;
    }

    const items = selectedOrder.itemSnapshots || [];
    const allocMap: Record<string, number> = {};
    items.forEach((it) => {
      allocMap[it.id] = it.orderedQty;
    });

    const res = createSplitOrderShipments({
      order: selectedOrder,
      splits: [
        {
          carrierId: evalRes.carrierId,
          carrierName: evalRes.carrierName,
          rateSource: evalRes.selectedSource || "yume_verified",
          isConfirmedPrice: evalRes.isConfirmedPrice,
          deliveryType: evalRes.deliveryType,
          carrierShippingFee: evalRes.shippingFee,
          carrierCodFee: evalRes.codFee,
          actualWeightKg: evalRes.actualWeightKg,
          dimensionsCm,
          volumetricDivisor: 5000,
          allocatedItemQuantities: allocMap,
          allocatedDiscountAmount: Number(selectedOrder.discountAmount || 0),
          allocatedCustomerShippingFee: Number(selectedOrder.shippingCost || 0),
        },
      ],
    });

    if (res.validationErrors.length > 0) {
      setDispatchFeedback({ type: "error", text: res.validationErrors.join(" ") });
      return;
    }

    onUpdateOrder(res.updatedOrder);
    setDispatchFeedback({
      type: "success",
      text: `Shipment dispatched for Order #${selectedOrder.id} via ${evalRes.carrierName} (Billable Weight: ${evalRes.billableWeightKg} kg, Carrier Fee: ${formatPrice(evalRes.shippingFee, currencyCode)}).`,
    });
  };

  const handleDispatchSplitShipments = () => {
    if (!selectedOrder) return;
    const items = selectedOrder.itemSnapshots || [];
    if (items.length === 0) return;

    const alloc1: Record<string, number> = {};
    const alloc2: Record<string, number> = {};

    let count1 = 0;
    let count2 = 0;

    items.forEach((it) => {
      const q2 = Math.min(it.orderedQty, Math.max(0, Number(splitParcel2Items[it.id] || 0)));
      const q1 = it.orderedQty - q2;
      alloc1[it.id] = q1;
      alloc2[it.id] = q2;
      count1 += q1;
      count2 += q2;
    });

    if (count1 === 0 || count2 === 0) {
      setDispatchFeedback({
        type: "error",
        text: "When splitting an order into 2 shipments, both Shipment #1 and Shipment #2 must have at least 1 allocated unit.",
      });
      return;
    }

    const rate1 =
      evaluatedRates.find((r) => r.carrierId === splitParcel1CarrierId && r.shippingFee !== null) ||
      evaluatedRates.find((r) => r.shippingFee !== null);
    const rate2 =
      evaluatedRates.find((r) => r.carrierId === splitParcel2CarrierId && r.shippingFee !== null) ||
      evaluatedRates.find((r) => r.shippingFee !== null);

    if (!rate1 || !rate2 || rate1.shippingFee === null || rate2.shippingFee === null) {
      setDispatchFeedback({
        type: "error",
        text: "Both selected carriers must support the destination and have a valid shipping rate.",
      });
      return;
    }

    const res = createSplitOrderShipments({
      order: selectedOrder,
      splits: [
        {
          carrierId: rate1.carrierId,
          carrierName: rate1.carrierName,
          rateSource: rate1.selectedSource || "merchant_custom",
          isConfirmedPrice: rate1.isConfirmedPrice,
          deliveryType,
          carrierShippingFee: rate1.shippingFee,
          carrierCodFee: rate1.codFee,
          actualWeightKg: Number((actualWeightKg * 0.6).toFixed(2)),
          dimensionsCm,
          allocatedItemQuantities: alloc1,
          allocatedDiscountAmount: Number(selectedOrder.discountAmount || 0),
          allocatedCustomerShippingFee: Number(selectedOrder.shippingCost || 0),
        },
        {
          carrierId: rate2.carrierId,
          carrierName: rate2.carrierName,
          rateSource: rate2.selectedSource || "official_api",
          isConfirmedPrice: rate2.isConfirmedPrice,
          deliveryType,
          carrierShippingFee: rate2.shippingFee,
          carrierCodFee: rate2.codFee,
          actualWeightKg: Number((actualWeightKg * 0.4).toFixed(2)),
          dimensionsCm,
          allocatedItemQuantities: alloc2,
          allocatedDiscountAmount: 0,
          allocatedCustomerShippingFee: 0,
        },
      ],
    });

    if (res.validationErrors.length > 0) {
      setDispatchFeedback({ type: "error", text: res.validationErrors.join(" ") });
      return;
    }

    onUpdateOrder(res.updatedOrder);
    setDispatchFeedback({
      type: "success",
      text: `Order #${selectedOrder.id} split into 2 physical shipments (${rate1.carrierName} & ${rate2.carrierName}). Revenue, Discount, Customer Shipping, and COGS counted strictly 1x.`,
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header (Add Product Reference Style) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 rounded-full shrink-0 bg-[#0b2447] dark:bg-sky-400" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight font-sans">
              Shipping &amp; Fulfillment Hub — 5-Gate Carrier Tariff Engine
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tri-Source Rate Comparison (Merchant Contract · Live Carrier API · YUME Reference) &amp;
              Split-Shipment Allocation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
              Prefer Fresh Contract Over Live API
            </span>
            <SkeuomorphicSwitch
              checked={preferContractOverApi}
              onChange={(val) => setPreferContractOverApi(val)}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowHints(!showHints)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 dark:border-slate-700 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
            <span>Hints: {showHints ? "On" : "Off"}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                showHints ? "bg-emerald-500" : "bg-stone-300 dark:bg-slate-600"
              }`}
            />
          </button>
        </div>
      </div>

      {showHints && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-sky-500/20 bg-sky-500/5 dark:bg-sky-500/10">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
          <div className="text-xs leading-relaxed font-semibold text-slate-700 dark:text-slate-200 space-y-1">
            <p>
              <strong className="font-black uppercase mr-1.5 text-sky-700 dark:text-sky-300">
                Tariff Priority &amp; Service Coverage Rules:
              </strong>
              (1) A Fresh Merchant Contract Rate (&le;90 days) receives automatic priority. (2) A
              Stale Merchant Contract Rate (&gt;90 days, e.g. ZR Express below) remains visible for
              manual selection or 1-click renewal, but never automatically overrides a Fresh Official
              Carrier API Quote. (3) Manual Price Overrides can resolve missing/unverified prices on
              valid routes, but can never bypass unsupported destinations or unavailable services.
            </p>
          </div>
        </div>
      )}

      {dispatchFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
            dispatchFeedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
          }`}
        >
          <span>{dispatchFeedback.text}</span>
          <button
            type="button"
            onClick={() => setDispatchFeedback(null)}
            className="text-xs underline ml-3 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Order & Parcel Parameters Form (Add Product Input Styling) */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] shadow-xs grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <label className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 block mb-1.5">
            Target Order to Fulfill *
          </label>
          <select
            value={selectedOrder?.id || ""}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] p-3 outline-none"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                #{o.id} — {o.shopper.name} ({o.shopper.wilayaCode} {o.shopper.wilaya}) ·{" "}
                {formatPrice(o.total, currencyCode)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 block mb-1.5">
            Service Type *
          </label>
          <select
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value as "home" | "desk")}
            className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] p-3 outline-none"
          >
            <option value="home">Home Delivery</option>
            <option value="desk">Stop-Desk Pickup</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 block mb-1.5">
            Scale Weight *
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={actualWeightKg}
              onChange={(e) => setActualWeightKg(Number(e.target.value))}
              className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] p-3 outline-none"
            />
            <span className="absolute right-3 text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 pointer-events-none">
              kg
            </span>
          </div>
        </div>

        <div className="lg:col-span-2">
          <label className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 block mb-1.5">
            Dimensions (L × W × H cm)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              placeholder="L (cm)"
              value={lengthCm}
              onChange={(e) => setLengthCm(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] p-3 outline-none"
            />
            <input
              type="number"
              placeholder="W (cm)"
              value={widthCm}
              onChange={(e) => setWidthCm(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] p-3 outline-none"
            />
            <input
              type="number"
              placeholder="H (cm)"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] p-3 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Carrier Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {evaluatedRates.map((evalRes) => {
          const isBlocked =
            evalRes.operationalState === "DESTINATION_UNSUPPORTED" ||
            evalRes.operationalState === "SERVICE_UNAVAILABLE";

          const toneClasses =
            evalRes.statusBadgeTone === "emerald"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
              : evalRes.statusBadgeTone === "blue"
              ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30"
              : evalRes.statusBadgeTone === "amber"
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
              : evalRes.statusBadgeTone === "rose"
              ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
              : "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30";

          return (
            <div
              key={evalRes.carrierId}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                isBlocked
                  ? "border-rose-300/60 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17]"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {evalRes.carrierName}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500">
                        ({evalRes.historicalSuccessRatePercent}% Regional Delivery Rate)
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Billable Weight: <strong>{evalRes.billableWeightKg} kg</strong> (Actual:{" "}
                      {evalRes.actualWeightKg} kg
                      {evalRes.volumetricWeightKg !== null
                        ? `, Volumetric: ${evalRes.volumetricWeightKg} kg`
                        : ", Dimensions Missing"}
                      ) · Transit: {evalRes.estimatedDaysMin}–{evalRes.estimatedDaysMax} days
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-black border shrink-0 ${toneClasses}`}
                  >
                    {evalRes.statusBadgeText}
                  </span>
                </div>

                {/* Operational & Pricing State Summary */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">SHIPPING FEE</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {evalRes.shippingFee !== null
                        ? formatPrice(evalRes.shippingFee, currencyCode)
                        : "BLOCKED / N/A"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">COD COMMISSION</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {formatPrice(evalRes.codFee, currencyCode)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">RETURN FEE</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {formatPrice(evalRes.returnFee, currencyCode)}
                    </span>
                  </div>
                </div>

                {/* Warning or Block Messages */}
                {evalRes.blockReason && (
                  <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2">
                    <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{evalRes.blockReason}</span>
                  </div>
                )}

                {evalRes.warningMessage && !evalRes.blockReason && (
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{evalRes.warningMessage}</span>
                  </div>
                )}

                {/* Stale Contract Candidate Controls (Correction #1) */}
                {evalRes.staleContractCandidate && (
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                    <p className="text-[11px] font-mono text-amber-800 dark:text-amber-300 font-bold">
                      Stale Merchant Contract Rate ({evalRes.staleContractCandidate.shippingFee}{" "}
                      {currencyCode}, updated{" "}
                      {new Date(evalRes.staleContractCandidate.lastUpdatedAt).toLocaleDateString()})
                      did not auto-override the Fresh Live API quote.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleRenewContractRate(evalRes.carrierId)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Verify &amp; Renew Contract Rate (Restore Auto-Priority)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setManualSelectedStaleCarriers((prev) =>
                            prev.includes(evalRes.carrierId)
                              ? prev.filter((id) => id !== evalRes.carrierId)
                              : [...prev, evalRes.carrierId]
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                      >
                        Select Stale Contract Rate Manually
                      </button>
                    </div>
                  </div>
                )}

                {/* Manual Price Override Section (Strictly Disabled if Service/Destination Blocked) */}
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-black uppercase text-slate-500">
                      Manual Price Override{" "}
                      {evalRes.canApplyManualPriceOverride
                        ? "(Service Eligible)"
                        : "(Locked — Service/Destination Restricted)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      disabled={!evalRes.canApplyManualPriceOverride}
                      placeholder={
                        evalRes.canApplyManualPriceOverride
                          ? "Fee"
                          : "Blocked by coverage"
                      }
                      value={overrideInputPrice[evalRes.carrierId] || ""}
                      onChange={(e) =>
                        setOverrideInputPrice((prev) => ({
                          ...prev,
                          [evalRes.carrierId]: e.target.value,
                        }))
                      }
                      className="w-24 text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 disabled:opacity-40"
                    />
                    <input
                      type="text"
                      disabled={!evalRes.canApplyManualPriceOverride}
                      placeholder="Audit reason (e.g., Special courier quote)"
                      value={overrideInputReason[evalRes.carrierId] || ""}
                      onChange={(e) =>
                        setOverrideInputReason((prev) => ({
                          ...prev,
                          [evalRes.carrierId]: e.target.value,
                        }))
                      }
                      className="flex-1 text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 disabled:opacity-40"
                    />
                    <button
                      type="button"
                      disabled={!evalRes.canApplyManualPriceOverride}
                      onClick={() => handleApplyManualPriceOverride(evalRes)}
                      className="px-3 py-1.5 rounded-[8px] text-xs font-bold bg-slate-800 dark:bg-slate-700 text-white disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      Apply Override
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isBlocked || evalRes.shippingFee === null}
                onClick={() => handleDispatchSingleShipment(evalRes)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-[#0b2447] hover:bg-slate-800 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Truck className="w-4 h-4" />
                {isBlocked
                  ? `Blocked (${evalRes.operationalState.replace(/_/g, " ")})`
                  : `Create Shipment with ${evalRes.carrierName} (${
                      evalRes.isConfirmedPrice ? "Confirmed Price" : "Unconfirmed Estimate"
                    })`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Explicit Multi-Shipment Splitter (1 Order = 1 Shipment Default, Optional Split) */}
      {selectedOrder && (selectedOrder.itemSnapshots?.length || 0) > 1 && (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Split className="w-4 h-4 text-[#0b2447] dark:text-sky-400" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Multi-Shipment Splitter (Order #{selectedOrder.id})
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Product Revenue, Discounts, Customer Shipping Fee, and COGS are counted strictly
                  once; Carrier Fees are recorded per physical parcel.
                </p>
              </div>
            </div>
            <SkeuomorphicSwitch checked={isSplitMode} onChange={(v) => setIsSplitMode(v)} />
          </div>

          {isSplitMode && (
            <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 block mb-1">
                    Shipment #1 Carrier (Collects Order Shipping Fee)
                  </label>
                  <select
                    value={splitParcel1CarrierId}
                    onChange={(e) => setSplitParcel1CarrierId(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] p-2.5"
                  >
                    {evaluatedRates
                      .filter((r) => r.shippingFee !== null)
                      .map((r) => (
                        <option key={r.carrierId} value={r.carrierId}>
                          {r.carrierName} ({formatPrice(r.shippingFee || 0, currencyCode)})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 block mb-1">
                    Shipment #2 Carrier (Second Physical Parcel)
                  </label>
                  <select
                    value={splitParcel2CarrierId}
                    onChange={(e) => setSplitParcel2CarrierId(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] p-2.5"
                  >
                    {evaluatedRates
                      .filter((r) => r.shippingFee !== null)
                      .map((r) => (
                        <option key={r.carrierId} value={r.carrierId}>
                          {r.carrierName} ({formatPrice(r.shippingFee || 0, currencyCode)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black font-mono uppercase text-slate-500">
                  Allocate Units Between Shipment #1 and Shipment #2
                </span>
                {(selectedOrder.itemSnapshots || []).map((it) => {
                  const q2 = Math.min(
                    it.orderedQty,
                    Math.max(0, Number(splitParcel2Items[it.id] || 0))
                  );
                  const q1 = it.orderedQty - q2;
                  return (
                    <div
                      key={it.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {it.productName}
                        </span>
                        <span className="ml-2 font-mono text-slate-500">
                          (Total Ordered: {it.orderedQty} · Sale:{" "}
                          {formatPrice(it.unitSalePrice, currencyCode)})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          Shipment #1: <strong>{q1}</strong>
                        </span>
                        <label className="flex items-center gap-1.5">
                          <span>Shipment #2:</span>
                          <input
                            type="number"
                            min={0}
                            max={it.orderedQty}
                            value={q2}
                            onChange={(e) =>
                              setSplitParcel2Items((prev) => ({
                                ...prev,
                                [it.id]: Number(e.target.value),
                              }))
                            }
                            className="w-16 text-center font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleDispatchSplitShipments}
                className="px-4 py-2.5 rounded-xl text-xs font-black bg-[#0b2447] hover:bg-slate-800 text-white cursor-pointer flex items-center gap-2"
              >
                <Split className="w-4 h-4" />
                Confirm &amp; Dispatch 2 Split Shipments (Financial Invariants Verified)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
