import React, { useState } from "react";
import {
  X,
  Phone,
  MessageSquare,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  RotateCcw,
  Package,
  ShieldAlert,
  HelpCircle,
  Info,
  Split,
  Edit3,
  History,
  UserCheck,
} from "lucide-react";
import {
  Order,
  OrderLifecycleStatus,
  ShipmentLifecycleStatus,
  PaymentLifecycleStatus,
  ReturnLifecycleStatus,
} from "../../types";
import {
  canEditOrderStructure,
  transitionOrderDimension,
  logOrderConfirmationAttempt,
  updateOrderMissingItemCost,
} from "../../utils/orderLifecycle";
const formatPrice = (amount: number | null | undefined, currencyCode = "DZD"): string =>
  `${Number(amount || 0).toLocaleString()} ${currencyCode}`;

export interface OrderDetailDrawerProps {
  order: Order | null;
  store?: any;
  onClose: () => void;
  onUpdateOrder: (updated: Order) => void;
  onRestoreStockOnReturn?: (productId: string, quantity: number) => void;
  onOpenSplitModal?: (order: Order) => void;
  onOpenSplitShipmentModal?: (order: Order) => void;
  currencyCode?: string;
  accentColor?: string;
  merchantLang?: string;
  setFeedbackMessage?: (msg: string) => void;
  canViewFinancials?: boolean;
  canEditCosts?: boolean;
}

const ORDER_STATUS_OPTIONS: OrderLifecycleStatus[] = [
  "new",
  "confirmation_pending",
  "confirmed",
  "ready_to_ship",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "failed_delivery",
  "returned",
];

const SHIPMENT_STATUS_OPTIONS: ShipmentLifecycleStatus[] = [
  "pending_creation",
  "shipment_created",
  "ready_for_pickup",
  "picked_up",
  "in_transit",
  "at_distribution_center",
  "out_for_delivery",
  "delivered",
  "delivery_failed",
  "returning_to_sender",
  "returned",
];

const PAYMENT_STATUS_OPTIONS: PaymentLifecycleStatus[] = [
  "awaiting_collection",
  "collected",
  "settlement_pending",
  "partially_settled",
  "settled",
  "disputed",
  "refunded",
];

const RETURN_STATUS_OPTIONS: ReturnLifecycleStatus[] = [
  "none",
  "return_requested",
  "return_approved",
  "return_in_transit",
  "received",
  "inspection_pending",
  "restocked",
  "not_resellable",
  "refund_completed",
];

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  order,
  onClose,
  onUpdateOrder,
  onOpenSplitModal,
  onOpenSplitShipmentModal,
  currencyCode = "DZD",
  canViewFinancials = true,
  canEditCosts = true,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "confirmation" | "shipments" | "financials" | "timeline"
  >("overview");
  const [showHints, setShowHints] = useState(false);
  const [callChannel, setCallChannel] = useState<"phone" | "whatsapp" | "sms">("phone");
  const [callOutcome, setCallOutcome] = useState<
    "confirmed" | "no_answer" | "busy" | "wrong_number" | "postponed" | "cancelled"
  >("confirmed");
  const [callNotes, setCallNotes] = useState("");
  const [costInputs, setCostInputs] = useState<Record<string, string>>({});

  if (!order) return null;

  const editLock = canEditOrderStructure(order);
  const fin = order.financials;
  const shipments = order.shipments || [];
  const itemSnapshots = order.itemSnapshots || [];

  const handleStatusChange = (
    dimension: "order" | "shipment" | "payment" | "return",
    newValue: string
  ) => {
    const updated = transitionOrderDimension({
      order,
      dimension,
      newValue,
    });
    onUpdateOrder(updated);
  };

  const handleLogConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = logOrderConfirmationAttempt({
      order,
      channel: callChannel,
      outcome: callOutcome,
      notes: callNotes.trim() || undefined,
    });
    setCallNotes("");
    onUpdateOrder(updated);
  };

  const handleSaveMissingCost = (itemId: string) => {
    const val = Number(costInputs[itemId]);
    if (Number.isNaN(val) || val < 0) return;
    const updated = updateOrderMissingItemCost({
      order,
      orderItemId: itemId,
      unitPurchaseCost: val,
    });
    onUpdateOrder(updated);
  };

  return (
    <div className="fixed inset-0 z-[9990] flex justify-end bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0B0F17] h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-left">
        {/* Drawer Header (Add Product Reference Style) */}
        <div className="px-6 py-4 border-b border-stone-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-5 rounded-full shrink-0 bg-[#0b2447] dark:bg-sky-400" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight font-sans">
                  Order #{order.id}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase rounded bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  v{order.schemaVersion || 2} · Rev {order.postMigrationRevision || 0}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {order.shopper.name} · {order.shopper.wilaya} ({order.shopper.commune})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4-Dimensional Status Bar */}
        <div className="px-6 py-3 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="text-[10px] font-black font-mono uppercase text-slate-500 dark:text-slate-400 block mb-1">
              1. Order Status
            </label>
            <select
              value={order.orderStatus || "new"}
              onChange={(e) => handleStatusChange("order", e.target.value)}
              className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 outline-none"
            >
              {ORDER_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black font-mono uppercase text-slate-500 dark:text-slate-400 block mb-1">
              2. Shipment Status
            </label>
            <select
              value={order.shipmentStatus || "pending_creation"}
              onChange={(e) => handleStatusChange("shipment", e.target.value)}
              className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 outline-none"
            >
              {SHIPMENT_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black font-mono uppercase text-slate-500 dark:text-slate-400 block mb-1">
              3. Payment Status
            </label>
            <select
              value={order.paymentStatus || "awaiting_collection"}
              onChange={(e) => handleStatusChange("payment", e.target.value)}
              className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 outline-none"
            >
              {PAYMENT_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black font-mono uppercase text-slate-500 dark:text-slate-400 block mb-1">
              4. Return Status
            </label>
            <select
              value={order.returnStatus || "none"}
              onChange={(e) => handleStatusChange("return", e.target.value)}
              className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 outline-none"
            >
              {RETURN_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="px-6 pt-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto bg-white dark:bg-[#0B0F17]">
          {[
            { id: "overview", label: "Items & Customer", icon: Package },
            { id: "confirmation", label: `Call Desk (${order.callAttempts || 0})`, icon: Phone },
            { id: "shipments", label: `Shipments (${shipments.length})`, icon: Truck },
            ...(canViewFinancials
              ? [{ id: "financials", label: "COD & True Profit", icon: DollarSign }]
              : []),
            { id: "timeline", label: `Audit Timeline (${order.timeline?.length || 0})`, icon: History },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3.5 py-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-[#0b2447] dark:border-sky-400 text-[#0b2447] dark:text-sky-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {showHints && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-sky-500/20 bg-sky-500/5 dark:bg-sky-500/10">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
              <p className="text-xs leading-relaxed font-semibold text-slate-700 dark:text-slate-200">
                <strong className="font-black uppercase mr-1.5 text-sky-700 dark:text-sky-300">
                  Operational Advice:
                </strong>
                YUME tracks Order, Shipment, Payment, and Return statuses as 4 independent dimensions.
                Marking a parcel as Delivered sets Payment Status to{" "}
                <span className="font-mono font-bold">settlement_pending</span> until the courier actually
                remits the COD payout.
              </p>
            </div>
          )}

          {!editLock.allowed && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{editLock.reason}</span>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Customer Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black font-mono uppercase text-slate-800 dark:text-slate-200">
                    Recipient & Destination
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {order.deliveryMethod === "stop_desk" || order.deliveryMethod === "stopdesk"
                      ? "Stop-Desk Pickup"
                      : "Home Delivery"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-mono text-[10px]">CUSTOMER NAME</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {order.shopper.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono text-[10px]">PHONE NUMBER</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {order.shopper.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono text-[10px]">REGION / WILAYA</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {order.shopper.wilayaCode} — {order.shopper.wilaya} ({order.shopper.commune})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono text-[10px]">STREET ADDRESS</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {order.shopper.address}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Item Snapshots & Missing Purchase Cost Resolution */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black font-mono uppercase text-slate-900 dark:text-slate-100">
                    Order Item Snapshots ({itemSnapshots.length})
                  </span>
                  {fin?.hasMissingPurchaseCost && (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Purchase Cost Missing (Profit Excluded)
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {itemSnapshots.map((item) => {
                    const isCostMissing =
                      item.unitPurchaseCost === null || item.unitPurchaseCost === undefined;
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.productName}{" "}
                              {item.variantLabel && (
                                <span className="text-slate-500 font-normal">
                                  ({item.variantLabel})
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              SKU: {item.sku} · Ordered Qty: {item.orderedQty} · Kept Qty:{" "}
                              {item.keptQty} · Weight: {item.weightKg} kg
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-black font-mono text-slate-900 dark:text-white">
                              {formatPrice(item.unitSalePrice * item.orderedQty, currencyCode)}
                            </p>
                            {canViewFinancials && (
                              <p
                                className={`text-[11px] font-mono font-bold ${
                                  isCostMissing
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {isCostMissing
                                  ? "Unit Cost: MISSING"
                                  : `Unit Cost: ${formatPrice(item.unitPurchaseCost || 0, currencyCode)}`}
                              </p>
                            )}
                          </div>
                        </div>

                        {canEditCosts && isCostMissing && (
                          <div className="pt-2 border-t border-rose-500/20 flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              placeholder="Enter unit purchase cost (never defaults to 0)"
                              value={costInputs[item.id] || ""}
                              onChange={(e) =>
                                setCostInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              className="flex-1 text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-950 border border-rose-400 dark:border-rose-700 rounded-[8px] px-3 py-2 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveMissingCost(item.id)}
                              className="px-3 py-2 rounded-[8px] text-xs font-bold bg-[#0b2447] hover:bg-slate-800 text-white cursor-pointer shrink-0"
                            >
                              Save Snapshot Cost
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Return Inspection Desk (When Return is Active) */}
              {(order.returnStatus !== "none" ||
                order.orderStatus === "returned" ||
                order.orderStatus === "failed_delivery") && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-mono uppercase text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4" />
                      Return Parcel Inspection & Stock Resolution
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300">
                      Inventory State: {(order.inventoryState || "deducted").toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Returned parcels do not restore product stock automatically until physical
                    inspection confirms the item is resellable.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusChange("return", "restocked")}
                      className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Pass Inspection & Restock Inventory (+Qty)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange("return", "not_resellable")}
                      className="px-3.5 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Mark Damaged / Not Resellable (Write-Off COGS)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "confirmation" && (
            <div className="space-y-5">
              <form
                onSubmit={handleLogConfirmation}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black font-mono uppercase text-slate-900 dark:text-slate-100">
                    Log Customer Confirmation Call / Message
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Total Attempts: {order.callAttempts || 0}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 block mb-1">
                      Channel
                    </label>
                    <select
                      value={callChannel}
                      onChange={(e) => setCallChannel(e.target.value as any)}
                      className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] p-2.5"
                    >
                      <option value="phone">Phone Call</option>
                      <option value="whatsapp">WhatsApp Message</option>
                      <option value="sms">SMS Confirmation</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 block mb-1">
                      Call Outcome
                    </label>
                    <select
                      value={callOutcome}
                      onChange={(e) => setCallOutcome(e.target.value as any)}
                      className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] p-2.5"
                    >
                      <option value="confirmed">Confirmed — Reserve Stock & Ready</option>
                      <option value="no_answer">No Answer — Retry Later</option>
                      <option value="busy">Line Busy</option>
                      <option value="postponed">Customer Postponed Delivery</option>
                      <option value="wrong_number">Wrong Phone Number</option>
                      <option value="cancelled">Customer Cancelled Order</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 block mb-1">
                    Agent Notes / Delivery Instructions
                  </label>
                  <input
                    type="text"
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="e.g., Customer confirmed home address, prefers afternoon delivery..."
                    className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] p-3 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-[8px] text-xs font-bold bg-[#0b2447] hover:bg-slate-800 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Record Confirmation Attempt
                </button>
              </form>

              <div className="space-y-2">
                <span className="text-xs font-black font-mono uppercase text-slate-500">
                  Confirmation History
                </span>
                {(order.confirmationAttempts || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No call attempts logged yet.
                  </p>
                ) : (
                  (order.confirmationAttempts || []).map((att) => (
                    <div
                      key={att.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold uppercase text-slate-900 dark:text-white mr-2">
                          [{att.channel}] {att.outcome.replace(/_/g, " ")}
                        </span>
                        {att.notes && (
                          <span className="text-slate-600 dark:text-slate-300">— {att.notes}</span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(att.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "shipments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black font-mono uppercase text-slate-900 dark:text-white">
                    Physical Shipments ({shipments.length})
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Default: 1 Order = 1 Shipment. Multi-item orders can be explicitly split.
                  </p>
                </div>
                {onOpenSplitModal && (order.itemSnapshots?.length || 0) > 1 && editLock.allowed && (
                  <button
                    type="button"
                    onClick={() => onOpenSplitModal(order)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0b2447] hover:bg-slate-800 text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <Split className="w-3.5 h-3.5" />
                    Split / Configure Shipments
                  </button>
                )}
              </div>

              {shipments.map((sh) => (
                <div
                  key={sh.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-black bg-[#0b2447] text-white">
                        Parcel {sh.shipmentIndex} of {sh.totalShipmentsInOrder}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {sh.carrierName}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        ({sh.trackingNumber || "Pending Tracking"})
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        sh.isConfirmedPrice
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {sh.isConfirmedPrice
                        ? `Confirmed Rate (${sh.rateSource})`
                        : `Unconfirmed Estimate (${sh.rateSource})`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block">
                        COD COLLECTABLE
                      </span>
                      <span className="font-black font-mono text-slate-900 dark:text-white">
                        {formatPrice(sh.shipmentCodCollectable, currencyCode)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block">
                        CARRIER FEES
                      </span>
                      <span className="font-black font-mono text-rose-600 dark:text-rose-400">
                        {formatPrice(
                          sh.carrierShippingFee + sh.carrierCodFee + sh.carrierReturnFee,
                          currencyCode
                        )}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block">
                        BILLABLE WEIGHT
                      </span>
                      <span className="font-black font-mono text-slate-900 dark:text-white">
                        {sh.billableWeightKg} kg
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block">
                        SETTLED PAYOUT
                      </span>
                      <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {formatPrice(sh.remittedPayoutToMerchant, currencyCode)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "financials" && canViewFinancials && fin && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-3">
                <h4 className="text-xs font-black font-mono uppercase text-slate-900 dark:text-white">
                  Five-Construct Order Financial Breakdown
                </h4>

                <div className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs font-mono">
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      1. Gross Merchandise Value (GMV)
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatPrice(fin.gmv, currencyCode)}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      2. Promo Discount / Refunds (Counted 1x)
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      -{formatPrice(fin.orderDiscount + fin.customerRefundAmount, currencyCode)}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-900 dark:text-white font-bold">
                      = Net Order Revenue (Merchandise)
                    </span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {formatPrice(fin.netOrderRevenue, currencyCode)}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      + Customer Shipping Fee Charged (Counted 1x)
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      +{formatPrice(fin.customerShippingFeeCharged, currencyCode)}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-900 dark:text-white font-bold">
                      = Total COD Collectable from Customer
                    </span>
                    <span className="font-black text-sky-600 dark:text-sky-400">
                      {formatPrice(fin.totalCodCollectable, currencyCode)}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      - Product Purchase Cost (COGS — Paid to Supplier)
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {fin.hasMissingPurchaseCost
                        ? "COST MISSING (Not 0)"
                        : `-${formatPrice(fin.totalCogs || 0, currencyCode)}`}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-900 dark:text-white font-bold">
                      = Gross Product Profit
                    </span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {fin.hasMissingPurchaseCost
                        ? "COST MISSING"
                        : formatPrice(fin.grossProductProfit || 0, currencyCode)}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      - Carrier Fees (Shipping + COD + Return across {shipments.length} parcel(s))
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      -{formatPrice(fin.totalCarrierFees, currencyCode)}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      - Packaging & Damaged Write-Off (Paid Separately)
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      -{formatPrice(fin.packagingAndOtherCost + fin.damagedInventoryLoss, currencyCode)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between bg-emerald-500/10 px-2.5 rounded-lg mt-1">
                    <span className="text-emerald-900 dark:text-emerald-300 font-black">
                      = Net Operational Profit (True Profit)
                    </span>
                    <span className="font-black text-emerald-700 dark:text-emerald-300">
                      {fin.hasMissingPurchaseCost
                        ? "EXCLUDED (MISSING COST)"
                        : formatPrice(fin.netOperationalProfit || 0, currencyCode)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 block">
                    CARRIER NET PAYABLE
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {formatPrice(fin.netPayableByCarrier, currencyCode)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                    ACTUAL CASH RECEIVED
                  </span>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                    {formatPrice(fin.actualCashReceived, currencyCode)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block">
                    PENDING SETTLEMENT
                  </span>
                  <span className="text-sm font-black text-amber-700 dark:text-amber-300">
                    {formatPrice(fin.pendingSettlement, currencyCode)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-3">
              <h4 className="text-xs font-black font-mono uppercase text-slate-900 dark:text-white">
                Immutable Audit Timeline
              </h4>
              <div className="space-y-2.5">
                {(order.timeline || []).map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {ev.dimension}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {ev.actorName} ({ev.actorRole})
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{ev.description}</p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {new Date(ev.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
