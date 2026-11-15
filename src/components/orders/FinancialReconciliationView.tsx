import React, { useState, useMemo } from "react";
import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
  ShieldCheck,
  HelpCircle,
  Info,
  RotateCcw,
  Calculator,
  Play,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Order, SettlementBatchRecord } from "../../types";
import {
  computeStoreFinancialRollup,
  previewCarrierRemittanceBatch,
  commitCarrierRemittanceBatch,
  runAllEightEndToEndVerificationTests,
  EndToEndTestResult,
} from "../../services/financialReconciliationService";
import {
  updateOrderMissingItemCost,
  rollbackStoreOrdersMigration,
} from "../../utils/orderLifecycle";
const formatPrice = (amount: number | null | undefined, currencyCode = "DZD"): string =>
  `${Number(amount || 0).toLocaleString()} ${currencyCode}`;

export interface FinancialReconciliationViewProps {
  storeId?: string;
  store?: any;
  orders: Order[];
  onUpdateOrder: (updated: Order) => void;
  onReplaceAllOrders?: (orders: Order[]) => void;
  onUpdateOrdersBatch?: (orders: Order[]) => void;
  settlementBatches?: SettlementBatchRecord[];
  onSaveSettlementBatch?: (batch: SettlementBatchRecord) => void;
  onInspectOrder?: (order: Order) => void;
  onTriggerRollback?: () => void;
  accentColor?: string;
  setFeedbackMessage?: (msg: string) => void;
  currencyCode?: string;
}

export const FinancialReconciliationView: React.FC<FinancialReconciliationViewProps> = ({
  storeId: propStoreId,
  store,
  orders,
  onUpdateOrder,
  onReplaceAllOrders,
  onUpdateOrdersBatch,
  currencyCode = "DZD",
}) => {
  const storeId = propStoreId || store?.id || "store_1";
  const handleBatchReplace = onReplaceAllOrders || onUpdateOrdersBatch || (() => {});
  const [activeSubView, setActiveSubView] = useState<
    "ledger" | "remittance" | "missing_costs" | "verification"
  >("ledger");
  const [showHints, setShowHints] = useState<boolean>(false);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>("yalidine");
  const [batchRefInput, setBatchRefInput] = useState<string>(
    `REM-YAL-${new Date().toISOString().slice(0, 10)}`
  );
  const [previewBatch, setPreviewBatch] = useState<SettlementBatchRecord | null>(null);
  const [committedBatches, setCommittedBatches] = useState<SettlementBatchRecord[]>([]);
  const [costInputs, setCostInputs] = useState<Record<string, string>>({});
  const [e2eResults, setE2eResults] = useState<EndToEndTestResult[]>(() =>
    runAllEightEndToEndVerificationTests()
  );
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const rollup = useMemo(() => computeStoreFinancialRollup(orders), [orders]);

  const missingCostOrders = useMemo(
    () => orders.filter((o) => o.financials?.hasMissingPurchaseCost),
    [orders]
  );

  const handleGenerateSampleRemittancePreview = (mode: "full" | "partial") => {
    const targetOrders = orders.filter(
      (o) =>
        o.orderStatus === "delivered" ||
        o.status === "delivered" ||
        o.shipmentStatus === "delivered" ||
        o.orderStatus === "shipped"
    );

    const sampleOrders = (targetOrders.length > 0 ? targetOrders : orders).slice(0, 4);
    const rawRows = sampleOrders.flatMap((o) =>
      (o.shipments || []).map((sh) => {
        const expectedCod = sh.shipmentCodCollectable || o.total || 5100;
        const shipFee = sh.carrierShippingFee || 500;
        const codFee = sh.carrierCodFee || 50;
        const netPayable = Math.max(0, expectedCod - shipFee - codFee);
        return {
          payoutReference: batchRefInput.trim() || "PAY-BATCH-01",
          trackingNumber: sh.trackingNumber || o.trackingCode || o.id,
          reportedCollectedCod: expectedCod,
          reportedCarrierShippingFee: shipFee,
          reportedCarrierCodFee: codFee,
          reportedReturnFee: 0,
          remittedNetPayout: mode === "partial" ? Math.round(netPayable * 0.65) : netPayable,
        };
      })
    );

    const preview = previewCarrierRemittanceBatch({
      storeId,
      carrierId: selectedCarrierId,
      carrierName:
        selectedCarrierId === "yalidine"
          ? "Yalidine Express"
          : selectedCarrierId === "zrexpress"
          ? "ZR Express"
          : "Maystro Delivery",
      batchReference: batchRefInput.trim() || "PAY-BATCH-01",
      orders,
      rawRows,
    });

    setPreviewBatch(preview);
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || "");
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length <= 1) return;

      const parsedRows = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim());
        const trackingNumber = cols[0] || "";
        const reportedCollectedCod = Number(cols[1] || 0);
        const reportedCarrierShippingFee = Number(cols[2] || 500);
        const reportedCarrierCodFee = Number(cols[3] || 50);
        const remittedNetPayout =
          cols[4] !== undefined
            ? Number(cols[4])
            : Math.max(0, reportedCollectedCod - reportedCarrierShippingFee - reportedCarrierCodFee);
        return {
          payoutReference: cols[5] || batchRefInput || "CSV-IMPORT-1",
          trackingNumber,
          reportedCollectedCod,
          reportedCarrierShippingFee,
          reportedCarrierCodFee,
          reportedReturnFee: 0,
          remittedNetPayout,
        };
      });

      const preview = previewCarrierRemittanceBatch({
        storeId,
        carrierId: selectedCarrierId,
        carrierName: selectedCarrierId.toUpperCase(),
        batchReference: batchRefInput || file.name,
        orders,
        rawRows: parsedRows,
      });
      setPreviewBatch(preview);
    };
    reader.readAsText(file);
  };

  const handleCommitBatch = () => {
    if (!previewBatch) return;
    const res = commitCarrierRemittanceBatch({
      batch: previewBatch,
      orders,
    });
    onReplaceAllOrders(res.updatedOrders);
    setCommittedBatches((prev) => [res.committedBatch, ...prev]);
    setPreviewBatch(null);
    setStatusMessage({
      type: "success",
      text: `Committed Settlement Batch "${res.committedBatch.batchReference}": ${res.newlySettledLinesCount} shipment line(s) settled. Duplicate lines blocked: ${previewBatch.duplicateBlockedCount}.`,
    });
  };

  const handleExecuteDeltaRollback = () => {
    try {
      const rb = rollbackStoreOrdersMigration(storeId, orders);
      onReplaceAllOrders(rb.restoredOrders);
      setStatusMessage({
        type: "success",
        text: `Delta-Preserving Rollback executed: ${rb.unmodifiedRestoredCount} unmodified legacy orders restored verbatim, ${rb.modifiedPreservedCount} edited post-migration orders preserved, ${rb.newPostMigrationRetainedCount} new post-migration orders retained without deletion.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Rollback failed: no snapshot found.",
      });
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header (Add Product Reference Style) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 rounded-full shrink-0 bg-[#0b2447] dark:bg-sky-400" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight font-sans">
              COD Financial Tracking &amp; Reconciliation Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Separates Confirmed Sales, Carrier Custody Cash, Actual Settled Cash, External Expenses,
              and Verified Net Profit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: "ledger", label: "Five-Construct Ledger" },
            { id: "remittance", label: "Carrier Remittance Matcher" },
            {
              id: "missing_costs",
              label: `Missing Costs (${rollup.missingCostOrdersCount})`,
            },
            { id: "verification", label: "8-Test Integrity Suite & Backup" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubView(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubView === tab.id
                  ? "bg-[#0b2447] text-white dark:bg-sky-500 dark:text-slate-950"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowHints(!showHints)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 dark:border-slate-700 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
            <span>Hints: {showHints ? "On" : "Off"}</span>
          </button>
        </div>
      </div>

      {showHints && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-sky-500/20 bg-sky-500/5 dark:bg-sky-500/10">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
          <p className="text-xs leading-relaxed font-semibold text-slate-700 dark:text-slate-200">
            <strong className="font-black uppercase mr-1.5 text-sky-700 dark:text-sky-300">
              Non-Conflation Rule:
            </strong>
            Delivered orders remain in{" "}
            <span className="font-mono font-bold">Pending Settlement</span> until a carrier
            remittance batch is reconciled. Carrier fees are deducted once in Carrier Settlement, and
            COGS/Packaging are paid separately—preventing double deduction.
          </p>
        </div>
      )}

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
            statusMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="underline ml-3 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Five-Construct Executive KPI Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17]">
          <span className="text-[10px] font-mono font-black uppercase text-slate-400 block">
            1. Net Order Revenue (Sales)
          </span>
          <p className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1">
            {formatPrice(rollup.totalNetOrderRevenue, currencyCode)}
          </p>
          <span className="text-[11px] font-mono text-slate-500">
            GMV: {formatPrice(rollup.totalConfirmedGmv, currencyCode)}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/5 dark:bg-sky-950/20">
          <span className="text-[10px] font-mono font-black uppercase text-sky-600 dark:text-sky-400 block">
            2. Carrier Net Payable
          </span>
          <p className="text-lg font-black font-mono text-sky-700 dark:text-sky-300 mt-1">
            {formatPrice(rollup.totalNetPayableByCarriers, currencyCode)}
          </p>
          <span className="text-[11px] font-mono text-slate-500">
            Collected COD: {formatPrice(rollup.totalCollectedByCouriers, currencyCode)}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20">
          <span className="text-[10px] font-mono font-black uppercase text-emerald-600 dark:text-emerald-400 block">
            3. Actual Cash Received
          </span>
          <p className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300 mt-1">
            {formatPrice(rollup.totalActualCashReceived, currencyCode)}
          </p>
          <span className="text-[11px] font-mono text-emerald-600/80 dark:text-emerald-400/80">
            Settled in Merchant Balance
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20">
          <span className="text-[10px] font-mono font-black uppercase text-amber-600 dark:text-amber-400 block">
            4. Carrier Receivables (Unpaid)
          </span>
          <p className="text-lg font-black font-mono text-amber-700 dark:text-amber-300 mt-1">
            {formatPrice(rollup.totalOutstandingCarrierReceivables, currencyCode)}
          </p>
          <span className="text-[11px] font-mono text-slate-500">
            Total Exposure: {formatPrice(rollup.totalOutstandingBalance, currencyCode)}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20">
          <span className="text-[10px] font-mono font-black uppercase text-indigo-600 dark:text-indigo-400 block">
            5. Verified Net Profit (True)
          </span>
          <p className="text-lg font-black font-mono text-indigo-700 dark:text-indigo-300 mt-1">
            {formatPrice(rollup.verifiedNetOperationalProfit, currencyCode)}
          </p>
          <span className="text-[11px] font-mono text-slate-500">
            {rollup.verifiedCostOrdersCount} verified · {rollup.missingCostOrdersCount} missing cost
          </span>
        </div>
      </div>

      {activeSubView === "ledger" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] overflow-x-auto">
            <h4 className="text-xs font-black font-mono uppercase text-slate-900 dark:text-white mb-3">
              Order-Level Financial &amp; Settlement Ledger
            </h4>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 font-mono text-[10px] uppercase text-slate-500">
                  <th className="py-2.5 pr-3">Order</th>
                  <th className="py-2.5 px-3">Order / Ship / Payment</th>
                  <th className="py-2.5 px-3 text-right">Net Revenue</th>
                  <th className="py-2.5 px-3 text-right">COD Collectable</th>
                  <th className="py-2.5 px-3 text-right">COGS (Supplier)</th>
                  <th className="py-2.5 px-3 text-right">Carrier Fees</th>
                  <th className="py-2.5 px-3 text-right">Cash Received</th>
                  <th className="py-2.5 px-3 text-right">Pending Settle</th>
                  <th className="py-2.5 pl-3 text-right">True Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/80 font-mono">
                {orders.slice(0, 25).map((o) => {
                  const fin = o.financials;
                  if (!fin) return null;
                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="py-3 pr-3 font-bold text-slate-900 dark:text-white">
                        #{o.id}
                        <span className="block text-[10px] font-sans font-normal text-slate-500">
                          {o.shopper.name} ({o.shopper.wilaya})
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {o.orderStatus}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-700 dark:text-sky-300">
                            {o.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatPrice(fin.netOrderRevenue, currencyCode)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                        {formatPrice(fin.totalCodCollectable, currencyCode)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {fin.hasMissingPurchaseCost ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            COST MISSING
                          </span>
                        ) : (
                          formatPrice(fin.totalCogs || 0, currencyCode)
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400">
                        {formatPrice(fin.totalCarrierFees, currencyCode)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPrice(fin.actualCashReceived, currencyCode)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-600 dark:text-amber-400">
                        {formatPrice(fin.pendingSettlement, currencyCode)}
                      </td>
                      <td className="py-3 pl-3 text-right font-black">
                        {fin.hasMissingPurchaseCost ? (
                          <span className="text-rose-600 dark:text-rose-400 text-[10px]">
                            EXCLUDED
                          </span>
                        ) : (
                          <span
                            className={
                              (fin.netOperationalProfit || 0) >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }
                          >
                            {formatPrice(fin.netOperationalProfit || 0, currencyCode)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubView === "remittance" && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Import &amp; Reconcile Carrier COD Remittance Report
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 block mb-1.5">
                  Delivery Company *
                </label>
                <select
                  value={selectedCarrierId}
                  onChange={(e) => setSelectedCarrierId(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] p-3"
                >
                  <option value="yalidine">Yalidine Express</option>
                  <option value="zrexpress">ZR Express</option>
                  <option value="maystro">Maystro Delivery</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 block mb-1.5">
                  Payout Batch Reference *
                </label>
                <input
                  type="text"
                  value={batchRefInput}
                  onChange={(e) => setBatchRefInput(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] p-3"
                />
              </div>

              <div>
                <label className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 block mb-1.5">
                  Upload Carrier CSV (Tracking, COD, ShipFee, CODFee, Payout)
                </label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCsvFileUpload}
                  className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] p-2.5"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleGenerateSampleRemittancePreview("full")}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0b2447] hover:bg-slate-800 text-white cursor-pointer flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Simulate Full Carrier Remittance Batch Preview
              </button>
              <button
                type="button"
                onClick={() => handleGenerateSampleRemittancePreview("partial")}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Simulate Partial Settlement Batch Preview (65%)
              </button>
            </div>
          </div>

          {previewBatch && (
            <div className="p-5 rounded-2xl border border-sky-500/30 bg-white dark:bg-[#0B0F17] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h5 className="text-sm font-black text-slate-900 dark:text-white">
                    Match Preview — Batch {previewBatch.batchReference} ({previewBatch.carrierName})
                  </h5>
                  <p className="text-xs font-mono text-slate-500">
                    Matched: {previewBatch.matchedCount} · Discrepancies:{" "}
                    {previewBatch.discrepancyCount} · Duplicate Blocked:{" "}
                    {previewBatch.duplicateBlockedCount}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={previewBatch.matchedCount === 0 && previewBatch.discrepancyCount === 0}
                  onClick={handleCommitBatch}
                  className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white cursor-pointer"
                >
                  Commit Non-Duplicate Settlement Lines ({previewBatch.matchedCount})
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-500">
                      <th className="py-2 pr-2">Tracking / Order</th>
                      <th className="py-2 px-2 text-right">Expected COD</th>
                      <th className="py-2 px-2 text-right">Carrier Fees</th>
                      <th className="py-2 px-2 text-right">Expected Net Payable</th>
                      <th className="py-2 px-2 text-right">Remitted Payout</th>
                      <th className="py-2 pl-2">Status &amp; Verification Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                    {previewBatch.lines.map((line) => (
                      <tr key={line.id}>
                        <td className="py-2.5 pr-2 font-bold text-slate-900 dark:text-white">
                          {line.trackingNumber}{" "}
                          {line.orderId && <span className="text-slate-400">(#{line.orderId})</span>}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {formatPrice(line.expectedCodCollectable, currencyCode)}
                        </td>
                        <td className="py-2.5 px-2 text-right text-rose-600 dark:text-rose-400">
                          {formatPrice(
                            line.reportedCarrierShippingFee +
                              line.reportedCarrierCodFee +
                              line.reportedReturnFee,
                            currencyCode
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold">
                          {formatPrice(line.expectedNetPayable, currencyCode)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-black text-emerald-600 dark:text-emerald-400">
                          {formatPrice(line.remittedNetPayout, currencyCode)}
                        </td>
                        <td className="py-2.5 pl-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold mr-2 ${
                              line.matchStatus === "matched"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : line.matchStatus === "partial_settlement"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {line.matchStatus.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-sans text-slate-500">{line.notes}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubView === "missing_costs" && (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Missing Purchase Cost Resolution Queue ({missingCostOrders.length})
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Orders below have one or more items with <span className="font-mono">unitPurchaseCost == null</span>.
              YUME never assumes 0 cost; enter the actual unit purchase cost to include these orders in Verified Profit.
            </p>
          </div>

          {missingCostOrders.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              All active orders have complete product purchase cost snapshots!
            </div>
          ) : (
            <div className="space-y-3">
              {missingCostOrders.map((o) =>
                (o.itemSnapshots || [])
                  .filter((it) => it.unitPurchaseCost === null || it.unitPurchaseCost === undefined)
                  .map((it) => {
                    const inputKey = `${o.id}_${it.id}`;
                    return (
                      <div
                        key={inputKey}
                        className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            Order #{o.id} — {it.productName}
                          </span>
                          <span className="ml-2 font-mono text-slate-500">
                            (Sale Price: {formatPrice(it.unitSalePrice, currencyCode)} · Qty:{" "}
                            {it.orderedQty})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="Unit Purchase Cost"
                            value={costInputs[inputKey] || ""}
                            onChange={(e) =>
                              setCostInputs((prev) => ({ ...prev, [inputKey]: e.target.value }))
                            }
                            className="w-40 text-xs font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-rose-400 rounded-lg px-3 py-1.5"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = Number(costInputs[inputKey]);
                              if (Number.isNaN(val) || val < 0) return;
                              onUpdateOrder(
                                updateOrderMissingItemCost({
                                  order: o,
                                  orderItemId: it.id,
                                  unitPurchaseCost: val,
                                })
                              );
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0b2447] text-white cursor-pointer"
                          >
                            Save Cost
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>
      )}

      {activeSubView === "verification" && (
        <div className="space-y-5">
          {/* 8-Scenario End-to-End Integrity Test Runner */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Final 8-Scenario End-to-End Integrity Verification Suite (T1–T8)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verifies Fail-Closed Migration Backup, Concurrent Write Buffering, Delta-Preserving
                  Rollback, Webhook Idempotency, Remittance Deduplication, Case A (2,300 DZD), Visitor
                  Isolation, and Split-Shipment Invariants (6,850 DZD).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setE2eResults(runAllEightEndToEndVerificationTests())}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0b2447] hover:bg-slate-800 text-white cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Re-Run All 8 Integrity Tests
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDeltaRollback}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Test Delta-Preserving Rollback
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {e2eResults.map((res) => (
                <div
                  key={res.testId}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    res.passed
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-rose-500/30 bg-rose-500/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      [{res.testId}] {res.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                        res.passed
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                      }`}
                    >
                      {res.passed ? "PASSED" : "FAILED"}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    Actual: {res.actualSummary}
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                    Invariant: {res.integrityInvariantVerified}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
