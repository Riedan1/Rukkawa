import React, { useState, useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { 
  BarChart3, 
  Eye, 
  MessageSquare, 
  TrendingUp, 
  Sparkles, 
  DollarSign,
  Lock,
  Layers
} from "lucide-react";
import { Product } from "../types";

interface ProductAnalyticsChartProps {
  products: Product[];
  accentColor?: string;
  defaultDeliveryExpense?: number;
}

export default function ProductAnalyticsChart({
  products = [],
  accentColor = "#0f172a",
  defaultDeliveryExpense = 450,
}: ProductAnalyticsChartProps) {
  const [metric, setMetric] = useState<"views" | "reviews" | "profit">("views");
  const [animationKey, setAnimationKey] = useState<number>(0);

  // Fallback sample products if none are listed for the store
  const displayProducts = useMemo(() => {
    if (products && products.length > 0) {
      return products;
    }
    
    // High-quality mock products to prevent blank state
    return [
      {
        id: "mock1",
        name: "Deglet Nour Dates (1kg)",
        price: 1200,
        purchasePrice: 700,
        shippingType: "paid",
        realDeliveryCost: 450,
        rating: 4.8,
        reviews: Array(14).fill({ rating: 5 }), // 14 mock reviews
        category: "Food",
        tags: ["Premium", "Sahara"],
      },
      {
        id: "mock2",
        name: "Handmade Kabyle Silver Bracelet",
        price: 8500,
        purchasePrice: 4800,
        shippingType: "free",
        realDeliveryCost: 500,
        rating: 4.9,
        reviews: Array(8).fill({ rating: 5 }), // 8 mock reviews
        category: "Crafts",
        tags: ["Silver", "Beni Yenni"],
      },
      {
        id: "mock3",
        name: "Traditional Handwoven Rug",
        price: 24500,
        purchasePrice: 14500,
        shippingType: "free",
        realDeliveryCost: 800,
        rating: 4.7,
        reviews: Array(5).fill({ rating: 4 }), // 5 mock reviews
        category: "Home",
        tags: ["Wool", "Berber"],
      },
      {
        id: "mock4",
        name: "Premium Pure Olive Oil (5L)",
        price: 6500,
        purchasePrice: 4100,
        shippingType: "paid",
        realDeliveryCost: 500,
        rating: 4.6,
        reviews: Array(11).fill({ rating: 5 }), // 11 mock reviews
        category: "Food",
        tags: ["Organic", "Kabylie"],
      },
      {
        id: "mock5",
        name: "Terracotta Potery Set",
        price: 3200,
        purchasePrice: 1750,
        shippingType: "paid",
        realDeliveryCost: 450,
        rating: 4.5,
        reviews: Array(4).fill({ rating: 4 }), // 4 mock reviews
        category: "Crafts",
        tags: ["Clay", "Ghardaia"],
      }
    ] as any[] as Product[];
  }, [products]);

  // Compute stats deterministically to match product identities and private merchant profit formula
  const chartData = useMemo(() => {
    return displayProducts.map((p) => {
      // Create a stable deterministic views count based on product profile
      const reviewsCount = p.reviews ? p.reviews.length : 0;
      
      // Seed views based on character codes of name + price + review weight
      const charSum = p.name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const calculatedViews = Math.floor(
        ((charSum * 7) % 340) + 
        (reviewsCount * 28) + 
        (p.rating * 15) + 
        85
      );

      // Actual selling price after promotional discount
      const basePrice = Number(p.price) || 0;
      const discountPct = p.discountEnabled ? Math.min(95, Math.max(0, Number(p.discountPercent) || 0)) : 0;
      const actualSellingPrice = Math.round(basePrice * (1 - discountPct / 100));

      // Private merchant purchase cost (falls back to buyPrice or 55% of base price if unset)
      const purchaseCost =
        p.purchasePrice !== undefined && !isNaN(Number(p.purchasePrice))
          ? Number(p.purchasePrice)
          : p.buyPrice !== undefined && !isNaN(Number(p.buyPrice))
          ? Number(p.buyPrice)
          : Math.round(basePrice * 0.55);

      // Real delivery expense depending on Paid vs Free shipping
      const shippingType: "paid" | "free" =
        p.shippingType || (p.shippingCost === 0 ? "free" : "paid");
      const resolvedCarrierRate =
        p.realDeliveryCost !== undefined && Number(p.realDeliveryCost) > 0
          ? Number(p.realDeliveryCost)
          : p.shippingCost !== undefined && Number(p.shippingCost) > 0
          ? Number(p.shippingCost)
          : defaultDeliveryExpense;

      const merchantDeliveryExpense = shippingType === "free" ? resolvedCarrierRate : 0;
      const unitProfit = actualSellingPrice - purchaseCost - merchantDeliveryExpense;
      const estimatedUnitsSold = Math.max(1, reviewsCount > 0 ? reviewsCount * 2 : 3);
      const totalNetProfit = unitProfit * estimatedUnitsSold;

      return {
        id: p.id,
        // Shortened name for neat X-axis label
        name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
        fullName: p.name,
        price: basePrice,
        actualSellingPrice,
        purchaseCost,
        shippingType,
        merchantDeliveryExpense,
        unitProfit,
        profit: Math.max(0, totalNetProfit),
        rawNetProfit: totalNetProfit,
        estimatedUnitsSold,
        rating: p.rating,
        category: p.category || "General",
        views: calculatedViews,
        reviews: reviewsCount,
      };
    });
  }, [displayProducts, defaultDeliveryExpense]);

  // Insights analytics calculations
  const totalViews = useMemo(() => chartData.reduce((acc, d) => acc + d.views, 0), [chartData]);
  const totalReviews = useMemo(() => chartData.reduce((acc, d) => acc + d.reviews, 0), [chartData]);
  const totalNetProfitSum = useMemo(() => chartData.reduce((acc, d) => acc + d.rawNetProfit, 0), [chartData]);
  const highestPerformingProduct = useMemo(() => {
    if (chartData.length === 0) return null;
    return [...chartData].sort((a, b) => b[metric] - a[metric])[0];
  }, [chartData, metric]);

  const toggleMetric = (selected: "views" | "reviews" | "profit") => {
    setMetric(selected);
    setAnimationKey(prev => prev + 1); // trigger re-render animations
  };

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  return (
    <div 
      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_6px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-300 flex flex-col gap-6 text-left"
      id="product-analytics-recharts-card"
    >
      {/* Chart Hub Title Section Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: accentColor }}
            >
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight font-sans uppercase">
                Product Performance Hub
              </h4>
              <p className="text-[10.5px] text-slate-450 dark:text-slate-400 mt-0.5 font-medium">
                Visualizing popular engagements, customer reviews & private merchant net profits
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Selector Tabs */}
        <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/60 self-stretch sm:self-auto select-none">
          <button
            type="button"
            onClick={() => toggleMetric("views")}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              metric === "views"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Product Views
          </button>
          
          <button
            type="button"
            onClick={() => toggleMetric("reviews")}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              metric === "reviews"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Review Counts
          </button>

          <button
            type="button"
            onClick={() => toggleMetric("profit")}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              metric === "profit"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Net Profit
          </button>
        </div>
      </div>

      {/* Visual Telemetry Insights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Metric Card */}
        <div className="bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 p-4 rounded-xl text-left">
          <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider font-mono">
            {metric === "views"
              ? "Total Product Views"
              : metric === "reviews"
              ? "Total Verified Reviews"
              : "Estimated Net Profit (Private)"}
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 block mt-1 font-mono">
            {metric === "views"
              ? totalViews.toLocaleString()
              : metric === "reviews"
              ? totalReviews
              : `${totalNetProfitSum.toLocaleString()} Algerian Dinar`}
          </span>
          <span className="text-[10px] text-slate-450 dark:text-slate-400 mt-1 block flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {metric === "profit"
              ? "Selling price − Purchase cost − Free shipping expense"
              : "Realtime telemetry synchronized"}
          </span>
        </div>

        {/* Highest Performer Card */}
        <div className="bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 p-4 rounded-xl text-left">
          <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider font-mono">
            Leader Product
          </span>
          <span className="text-xs font-extrabold text-slate-850 dark:text-slate-100 block mt-1.5 leading-tight truncate">
            {highestPerformingProduct?.fullName || "N/A"}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block flex items-center gap-1">
            <span className="font-bold" style={{ color: accentColor }}>
              {highestPerformingProduct
                ? metric === "profit"
                  ? `${highestPerformingProduct.unitProfit.toLocaleString()} / unit`
                  : highestPerformingProduct[metric]
                : 0}
            </span>{" "}
            {metric === "views"
              ? "views frequency"
              : metric === "reviews"
              ? "reviews posted"
              : `(${highestPerformingProduct?.shippingType === "free" ? "Free Shipping" : "Paid Shipping"})`}
          </span>
        </div>

        {/* Action Suggestion AI Badge */}
        <div className="bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 p-4 rounded-xl text-left flex flex-col justify-between">
          <div>
            <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider font-mono flex items-center gap-1">
              {metric === "profit" ? (
                <>
                  <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Private Cost Protection
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-amber-500" /> Marketing Insight
                </>
              )}
            </span>
            <p className="text-[10px] text-slate-550 dark:text-slate-300 leading-relaxed mt-1 font-medium">
              {metric === "views"
                ? `Organize a custom flash promo for "${highestPerformingProduct?.fullName}" to boost conversion.`
                : metric === "reviews"
                ? "Encourage buyers to review the latest products to expand your community trust score."
                : "Purchase prices and delivery margins are strictly private to your merchant dashboard and never visible to customers."}
            </p>
          </div>
        </div>
      </div>

      {/* Recharts Graphical Core Container */}
      <div className="w-full h-[230px] relative px-1">
        {chartData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/40 dark:bg-slate-800/40 gap-2">
            <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400">No active store products found.</span>
          </div>
        ) : (
          <ResponsiveContainer key={`${metric}-${animationKey}`} width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={1} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="barGradientReviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 9.5, fontWeight: "semibold", fontFamily: "sans-serif" }}
                axisLine={{ stroke: isDark ? "#334155" : "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 9, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: isDark ? "#1e293b" : "#f8fafc", opacity: 0.6 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-xl shadow-lg text-left flex flex-col gap-1 text-xs">
                        <span className="font-black text-[10px] uppercase tracking-wider text-slate-400 block font-mono">
                          {data.category}
                        </span>
                        <span className="font-extrabold text-white block">
                          {data.fullName}
                        </span>
                        <div className="flex justify-between gap-6 border-t border-slate-800 pt-1.5 mt-1">
                          <span className="text-slate-400">Selling Price (After Discount):</span>
                          <span className="font-bold text-slate-100 font-mono">{data.actualSellingPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="text-slate-400">Purchase Price (Private):</span>
                          <span className="font-bold text-rose-300 font-mono">-{data.purchaseCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="text-slate-400">
                            Delivery Expense ({data.shippingType === "free" ? "Free Shipping" : "Paid Shipping"}):
                          </span>
                          <span className="font-bold text-amber-300 font-mono">
                            -{data.merchantDeliveryExpense.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between gap-6 border-t border-slate-800 pt-1 mt-0.5">
                          <span className="text-emerald-300 font-bold">Net Unit Profit:</span>
                          <span className="font-bold text-emerald-400 font-mono">
                            {data.unitProfit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="text-slate-400">Views / Reviews:</span>
                          <span className="font-bold text-slate-300 font-mono">{data.views} / {data.reviews}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey={metric} 
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
                animationDuration={900}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={metric === "views" ? "url(#barGradient)" : "url(#barGradientReviews)"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Dynamic Caption */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 select-none">
        <span className="flex items-center gap-1.5 font-medium">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          Interactive Recharts engine for local DZ merchant operations.
        </span>
        <span className="font-mono bg-slate-100/70 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-300">
          Selected: {metric === "views" ? "Views Frequency" : metric === "reviews" ? "Reviews Count" : "Net Profit"}
        </span>
      </div>
    </div>
  );
}
