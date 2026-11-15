import React, { useState, useMemo } from "react";
import {
  Users,
  Eye,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Smartphone,
  Monitor,
  Tablet,
  ShieldCheck,
  HelpCircle,
  Info,
  MousePointerClick,
  Globe,
} from "lucide-react";
import { Product, Order } from "../types";
import {
  getStoreVisitorAnalyticsSummary,
  recordStorefrontVisitorEvent,
} from "../utils/visitorAnalytics";
const formatPrice = (amount: number | null | undefined, currencyCode = "DZD"): string =>
  `${Number(amount || 0).toLocaleString()} ${currencyCode}`;

export interface VisitorAnalyticsModuleProps {
  store?: any;
  storeId?: string;
  storeName?: string;
  products?: Product[];
  orders: Order[];
  currencyCode?: string;
  darkMode?: boolean;
  accentColor?: string;
}

export const VisitorAnalyticsModule: React.FC<VisitorAnalyticsModuleProps> = ({
  store,
  storeId: propStoreId,
  storeName: propStoreName,
  products: propProducts,
  orders,
  currencyCode = "DZD",
}) => {
  const storeId = propStoreId || store?.id || "store_1";
  const storeName = propStoreName || store?.name || "YUME Store";
  const products: Product[] = propProducts || store?.products || [];
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d" | "90d">("7d");
  const [showHints, setShowHints] = useState<boolean>(false);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const summary = useMemo(
    () =>
      getStoreVisitorAnalyticsSummary({
        storeId,
        products,
        orders,
        timeframe,
      }),
    [storeId, products, orders, timeframe, refreshTick]
  );

  const handleSimulateLiveVisitorFunnelStep = (
    stage: "visit" | "product_view" | "add_to_cart" | "checkout_started" | "order_submitted"
  ) => {
    recordStorefrontVisitorEvent({
      storeId,
      stage,
      productId: products[0]?.id,
    });
    setRefreshTick((t) => t + 1);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header (Add Product Reference Style) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 rounded-full shrink-0 bg-[#0b2447] dark:bg-sky-400" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight font-sans">
              Store Visitor Analytics &amp; Customer Behavior ({storeName})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dedicated Storefront Traffic, Two-Tier Visitor Identification, 5-Stage Conversion
              Funnel &amp; Product Attention Diagnostics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(["24h", "7d", "30d", "90d"] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                timeframe === tf
                  ? "bg-[#0b2447] text-white dark:bg-sky-500 dark:text-slate-950"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              {tf.toUpperCase()}
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
              Privacy &amp; Visitor Deduplication:
            </strong>
            Store Visitor Analytics is strictly separated from COD financial ledgers. Anonymous
            visitors use a 365-day sliding first-party token (<span className="font-mono">yume_vid</span>)
            without mid-period rotation and a 30-minute cross-tab session token (<span className="font-mono">yume_sid</span>).
          </p>
        </div>
      )}

      {/* Top Visitor KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17]">
          <span className="text-[10px] font-mono font-black uppercase text-slate-400 block">
            Total Store Visits (Sessions)
          </span>
          <p className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {summary.totalVisits.toLocaleString()}
          </p>
          <span className="text-[11px] font-mono text-slate-500">
            Avg Duration: {Math.floor(summary.avgSessionDurationSec / 60)}m{" "}
            {summary.avgSessionDurationSec % 60}s
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/5 dark:bg-sky-950/20">
          <span className="text-[10px] font-mono font-black uppercase text-sky-600 dark:text-sky-400 block">
            Measured Anonymous Browsers
          </span>
          <p className="text-xl font-black font-mono text-sky-700 dark:text-sky-300 mt-1">
            {summary.uniqueAnonymousBrowsers.toLocaleString()}
          </p>
          <span className="text-[11px] font-mono text-slate-500">
            Device / Browser Token Scoped
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20">
          <span className="text-[10px] font-mono font-black uppercase text-emerald-600 dark:text-emerald-400 block">
            Authenticated Unique Visitors
          </span>
          <p className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300 mt-1">
            {summary.authenticatedUniqueVisitors.toLocaleString()}
          </p>
          <span className="text-[11px] font-mono text-slate-500">
            Verified Cross-Device UID
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17]">
          <span className="text-[10px] font-mono font-black uppercase text-slate-400 block">
            New vs Returning Cohort
          </span>
          <p className="text-base font-black font-mono text-slate-900 dark:text-white mt-1">
            {summary.newVisitors.toLocaleString()} New ·{" "}
            {summary.returningVisitors.toLocaleString()} Ret
          </p>
          <span className="text-[11px] font-mono text-slate-500">
            Bounce Rate: {summary.bounceRatePercent}%
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20">
          <span className="text-[10px] font-mono font-black uppercase text-indigo-600 dark:text-indigo-400 block">
            Store Conversion Rate
          </span>
          <p className="text-xl font-black font-mono text-indigo-700 dark:text-indigo-300 mt-1">
            {summary.overallConversionRatePercent}%
          </p>
          <span className="text-[11px] font-mono text-slate-500">
            Visit &rarr; Order Submitted
          </span>
        </div>
      </div>

      {/* 5-Stage Monotonic Conversion Funnel */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              5-Stage Storefront Conversion Funnel (Monotonic Attribution)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tracks customer progression from Store Visit to Order Submission. Completing a later
              step automatically attributes prerequisite steps.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["visit", "+ Visit"],
                ["product_view", "+ Product View"],
                ["add_to_cart", "+ Add to Cart"],
                ["checkout_started", "+ Checkout"],
                ["order_submitted", "+ Submit Order"],
              ] as const
            ).map(([st, lbl]) => (
              <button
                key={st}
                type="button"
                onClick={() => handleSimulateLiveVisitorFunnelStep(st)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {summary.funnelStages.map((f, idx) => (
            <div
              key={f.stage}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-2 relative"
            >
              <span className="text-[11px] font-mono font-black text-slate-500 dark:text-slate-400 block">
                {f.label}
              </span>
              <p className="text-lg font-black font-mono text-slate-900 dark:text-white">
                {f.count.toLocaleString()}
              </p>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-[#0b2447] dark:bg-sky-400 rounded-full"
                  style={{ width: `${Math.max(6, f.conversionFromStartPercent)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {f.conversionFromStartPercent}% of visits
                </span>
                {idx > 0 && (
                  <span className="text-rose-600 dark:text-rose-400">
                    -{f.dropOffPercent}% drop
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Attention & High-Click / Low-Purchase Diagnostics */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] space-y-4 overflow-x-auto">
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            Product Attention &amp; High-Click / Low-Purchase Diagnostics
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Identifies products attracting high visitor interest that experience friction before
            purchase completion.
          </p>
        </div>

        <table className="w-full text-xs text-left font-mono border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-500">
              <th className="py-2 pr-3">Product</th>
              <th className="py-2 px-3 text-right">Page Views</th>
              <th className="py-2 px-3 text-right">Unique Viewers</th>
              <th className="py-2 px-3 text-right">Add to Cart</th>
              <th className="py-2 px-3 text-right">Orders</th>
              <th className="py-2 px-3 text-right">View &rarr; Order %</th>
              <th className="py-2 pl-3">Conversion Diagnostic</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
            {summary.productDiagnostics.map((pd) => (
              <tr key={pd.productId} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="py-2.5 pr-3 font-bold text-slate-900 dark:text-white font-sans">
                  {pd.productName}
                  <span className="block text-[10px] font-mono text-slate-400">
                    {formatPrice(pd.price, currencyCode)}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-bold">{pd.views.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right">{pd.uniqueViewers.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right text-sky-600 dark:text-sky-400">
                  {pd.cartAdds.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                  {pd.purchases.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold">{pd.viewToOrderPercent}%</td>
                <td className="py-2.5 pl-3 font-sans">
                  {pd.isHighAttentionLowConversion ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      {pd.diagnosticHint}
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {pd.diagnosticHint}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Traffic Sources, Devices & Visitor Identification Limitations Disclosure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] space-y-3">
          <h4 className="text-xs font-black font-mono uppercase text-slate-900 dark:text-white">
            Acquisition Traffic Sources &amp; Device Breakdown
          </h4>
          <div className="space-y-2 text-xs font-mono">
            {summary.trafficSources.map((ts) => (
              <div
                key={ts.key}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between"
              >
                <span className="font-bold font-sans text-slate-900 dark:text-white">
                  {ts.source}
                </span>
                <span>
                  <strong>{ts.visits.toLocaleString()}</strong> visits ·{" "}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {ts.conversionRate}% conv
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Explicit Visitor Identification Technical Limitations Card */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h4 className="text-xs font-black font-mono uppercase text-slate-900 dark:text-white">
              Visitor Identification Scope &amp; Privacy Boundaries
            </h4>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <li>
              <strong>1. Browser Storage Deletion / Incognito:</strong> Clearing{" "}
              <code className="font-mono">localStorage</code> erases the anonymous{" "}
              <code className="font-mono">yume_vid</code> token; the next unauthenticated visit is
              recorded as a new Measured Anonymous Browser token.
            </li>
            <li>
              <strong>2. Browser Switching (e.g., Safari &rarr; Chrome):</strong> Browser storage is
              isolated per browser application; unauthenticated visits across two browsers count as
              2 Anonymous Browser tokens unless signed in.
            </li>
            <li>
              <strong>3. Multi-Device Visits (Phone vs. Laptop):</strong> YUME does not perform
              invasive cross-device fingerprinting. Cross-device deduplication is only claimed for{" "}
              <strong>Authenticated Unique Visitors</strong> signed into a YUME account.
            </li>
            <li>
              <strong>4. 365-Day Retention Window:</strong> Anonymous tokens renew on a 365-day
              sliding window without mid-period rotation. Visitors returning after &gt;365 days of
              complete inactivity initialize a new annual visitor token.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
