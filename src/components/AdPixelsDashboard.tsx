import React, { useState, useEffect } from "react";
import { 
  getPixelConfig, 
  savePixelConfig, 
  getPixelLogs, 
  PixelFireLog 
} from "../utils/analytics";
import { 
  Megaphone, 
  Settings, 
  Terminal, 
  RefreshCw, 
  Sliders, 
  TrendingUp, 
  Activity, 
  HelpCircle, 
  CheckCircle, 
  Trash2, 
  Sparkles,
  Info,
  Plus,
  X
} from "lucide-react";

interface AdPixelsDashboardProps {
  darkMode: boolean;
  storeName: string;
  checkPermission?: (
    action: "confirmOrders" | "prepareShipments" | "deliveryOperations" | "manageProducts" | "manageDiscounts" | "adPixels" | "manageAnalytics" | "respondReviews" | "manageFollowers",
    actionLabel: string,
    permissionLabel: string
  ) => boolean;
}

interface Campaign {
  id: string;
  name: string;
  platform: "Facebook" | "TikTok" | "Snapchat" | "Google";
  spend: number;
  impressions: number;
  clicks: number;
  carts: number;
  purchases: number;
  revenue: number;
}

export default function AdPixelsDashboard({ darkMode, storeName, checkPermission }: AdPixelsDashboardProps) {
  // Config state
  const [fbId, setFbId] = useState("");
  const [ttId, setTtId] = useState("");
  const [scId, setScId] = useState("");
  const [showHints, setShowHints] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("yume_merchant_hints");
      if (saved !== null) return saved === "true";
    } catch {}
    return true;
  });

  useEffect(() => {
    const handleHintsSync = (e: any) => {
      if (typeof e.detail === "boolean") {
        setShowHints(e.detail);
      }
    };
    window.addEventListener("yume_hints_toggle", handleHintsSync);
    return () => window.removeEventListener("yume_hints_toggle", handleHintsSync);
  }, []);
  const [activeSubSection, setActiveSubSection] = useState<"all" | "pixels" | "campaigns" | "simulator">("all");

  // New Campaign Creator State
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false);
  const [newCampName, setNewCampName] = useState("");
  const [newCampPlatform, setNewCampPlatform] = useState<"Facebook" | "TikTok" | "Snapchat" | "Google">("Facebook");
  const [newCampSpend, setNewCampSpend] = useState("20000");

  // Live telemetry state
  const [logs, setLogs] = useState<PixelFireLog[]>([]);
  const [logRefreshKey, setLogRefreshKey] = useState(0);

  // ROI / ROAS simulator state
  const [adSpend, setAdSpend] = useState(50000); // 50,000 DZD
  const [cpm, setCpm] = useState(350); // 350 DZD per 1000 impressions
  const [ctr, setCtr] = useState(2.2); // 2.2% Click-Through Rate
  const [cvr, setCvr] = useState(1.8); // 1.8% Purchase Conversion Rate
  const [aov, setAov] = useState(12000); // 12,000 DZD Average Order Value
  const [activePreset, setActivePreset] = useState<string>("facebook-jewelry");
  const [isSaved, setIsSaved] = useState(false);

  // Active Ad Campaigns for Storefront
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: "CMP-001",
      name: "Tapis Berbère Promo (Wilaya 16/31)",
      platform: "Facebook",
      spend: 42000,
      impressions: 112000,
      clicks: 2980,
      carts: 185,
      purchases: 32,
      revenue: 384000,
    },
    {
      id: "CMP-002",
      name: "Kabyle Robes Showcase Sparks",
      platform: "TikTok",
      spend: 25000,
      impressions: 185000,
      clicks: 5120,
      carts: 310,
      purchases: 19,
      revenue: 228000,
    },
    {
      id: "CMP-003",
      name: "Silver Jewelry AR Preview Lens",
      platform: "Snapchat",
      spend: 18000,
      impressions: 95000,
      clicks: 1890,
      carts: 98,
      purchases: 11,
      revenue: 154000,
    }
  ]);

  // Load config on mount
  useEffect(() => {
    const config = getPixelConfig();
    setFbId(config.facebookId);
    setTtId(config.tiktokId);
    setScId(config.snapchatId);
  }, []);

  // Update logs on an interval to show real-time stream of user events
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(getPixelLogs());
    }, 1000);
    return () => clearInterval(interval);
  }, [logRefreshKey]);

  // Handle saving Pixel IDs
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPermission && !checkPermission("adPixels", "Link Ad Pixels", "Ad Pixel Integration")) return;
    savePixelConfig(fbId, ttId, scId);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Handle adding a new campaign
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPermission && !checkPermission("adPixels", "Create Ad Campaign", "Ad Pixel Integration")) return;
    if (!newCampName.trim()) return;
    const spendVal = Math.max(1000, Number(newCampSpend) || 15000);
    const estImpressions = Math.round((spendVal / 320) * 1000);
    const estClicks = Math.round(estImpressions * 0.024);
    const estCarts = Math.round(estClicks * 0.08);
    const estPurchases = Math.max(1, Math.round(estClicks * 0.018));
    const estRevenue = estPurchases * 11500;

    const created: Campaign = {
      id: `CMP-00${campaigns.length + 1}`,
      name: newCampName.trim(),
      platform: newCampPlatform,
      spend: spendVal,
      impressions: estImpressions,
      clicks: estClicks,
      carts: estCarts,
      purchases: estPurchases,
      revenue: estRevenue,
    };
    setCampaigns((prev) => [created, ...prev]);
    setNewCampName("");
    setNewCampSpend("20000");
    setShowNewCampaignForm(false);
  };

  // Preset configuration selection
  const applyPreset = (preset: string) => {
    if (checkPermission && !checkPermission("adPixels", "Apply Campaign Preset", "Ad Pixel Integration")) return;
    setActivePreset(preset);
    if (preset === "facebook-jewelry") {
      setCpm(450);
      setCtr(2.5);
      setCvr(2.1);
      setAov(14500);
    } else if (preset === "tiktok-robes") {
      setCpm(220);
      setCtr(3.8);
      setCvr(1.4);
      setAov(8500);
    } else if (preset === "snapchat-ar") {
      setCpm(280);
      setCtr(1.8);
      setCvr(1.1);
      setAov(19500);
    }
  };

  // Dynamic Simulator Computations
  const computedImpressions = Math.round((adSpend / cpm) * 1000);
  const computedClicks = Math.round(computedImpressions * (ctr / 100));
  const computedCostPerClick = computedClicks > 0 ? (adSpend / computedClicks) : 0;
  const computedSales = Math.round(computedClicks * (cvr / 100));
  const computedCPA = computedSales > 0 ? (adSpend / computedSales) : adSpend;
  const computedRevenue = computedSales * aov;
  const computedROAS = adSpend > 0 ? (computedRevenue / adSpend) : 0;
  const computedNetProfit = computedRevenue - adSpend;

  // Clear tracking logs
  const handleClearLogs = () => {
    if (typeof window !== "undefined") {
      const win = window as any;
      win.YUME_PIXEL_LOGS = [];
      setLogs([]);
    }
  };

  const getLogBadgeColor = (type: string) => {
    switch (type) {
      case "Facebook": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
      case "TikTok": return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20";
      case "Snapchat": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "GA4": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      default: return "bg-stone-500/10 text-stone-600 dark:text-slate-400 border border-stone-500/20";
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", maximumFractionDigits: 0 }).format(val);
  };

  const inputClass =
    "w-full text-xs font-sans p-2.5 rounded-xl focus:bg-white dark:focus:bg-slate-900 transition-colors font-semibold text-stone-900 dark:text-white outline-none border bg-stone-50/70 dark:bg-slate-950 border-stone-200/90 dark:border-slate-800 hover:border-stone-300 focus:border-stone-900 dark:focus:border-white";
  const labelClass =
    "text-[11px] font-bold text-stone-700 dark:text-slate-300 block mb-1.5";

  return (
    <div className="flex flex-col gap-5 animate-fade-in text-left">
      {/* Main Container Card — Matching "Add Product" */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-stone-200/80 dark:border-slate-800 text-left flex flex-col gap-5 shadow-2xs">
        {/* Section Header with Vertical Accent Pill & Hints Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-1.5 h-5 rounded-full shrink-0"
              style={{
                backgroundColor: "var(--yume-theme-header-color, " + (darkMode ? "#38bdf8" : "#0b2447") + ")"
              }}
            />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight font-sans flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-stone-700 dark:text-slate-300 shrink-0" />
                <span>Ad Pixels & Campaign Attribution</span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full shrink-0 font-semibold bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700">
                  {storeName}
                </span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 font-normal">
                Configure Facebook, TikTok, and Snapchat tracking pixels, monitor real-time e-commerce events, and analyze campaign ROAS.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Compact Inline Filter Pills to preserve sub-section filtering */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-slate-800/90 border border-stone-200/80 dark:border-slate-700">
              {[
                { id: "all", label: "All Tools" },
                { id: "pixels", label: "Pixels" },
                { id: "campaigns", label: "Campaigns" },
                { id: "simulator", label: "Simulator" },
              ].map((tab) => {
                const isCurrent = activeSubSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSubSection(tab.id as any)}
                    style={
                      isCurrent
                        ? { backgroundColor: "var(--yume-theme-header-color, #0b2447)" }
                        : undefined
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? "text-white shadow-2xs"
                        : "text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowNewCampaignForm((prev) => !prev)}
              style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
              className="hover:brightness-110 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs active:scale-[0.98] cursor-pointer"
            >
              {showNewCampaignForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{showNewCampaignForm ? "Close Form" : "New Campaign"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowHints((prev) => {
                  const next = !prev;
                  try {
                    localStorage.setItem("yume_merchant_hints", String(next));
                  } catch {}
                  window.dispatchEvent(new CustomEvent("yume_hints_toggle", { detail: next }));
                  return next;
                });
              }}
              style={
                showHints
                  ? {
                      backgroundColor: "var(--yume-theme-header-color, #0b2447)",
                      borderColor: "var(--yume-theme-header-color, #0b2447)",
                    }
                  : undefined
              }
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs select-none ${
                showHints
                  ? "text-white"
                  : "border-stone-200 dark:border-slate-700 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300"
              }`}
            >
              <HelpCircle className={`w-3.5 h-3.5 ${showHints ? "text-white" : "text-stone-500 dark:text-slate-400"}`} />
              <span>Hints: {showHints ? "On" : "Off"}</span>
              <span className={`w-2 h-2 rounded-full ${showHints ? "bg-white" : "bg-stone-300 dark:bg-slate-600"}`} />
            </button>
          </div>
        </div>

        {/* Advice Callout Banner — Matching "Add Product" */}
        {showHints && (
          <div
            className="flex items-start gap-2.5 p-3.5 rounded-xl border transition-all"
            style={{
              backgroundColor: `color-mix(in srgb, var(--yume-theme-header-color, ${darkMode ? "#38bdf8" : "#0b2447"}) 6%, transparent)`,
              borderColor: `color-mix(in srgb, var(--yume-theme-header-color, ${darkMode ? "#38bdf8" : "#0b2447"}) 18%, transparent)`
            }}
          >
            <Info
              className="w-4 h-4 shrink-0 mt-0.5"
              style={{ color: "var(--yume-theme-header-color, " + (darkMode ? "#38bdf8" : "#0b2447") + ")" }}
            />
            <p
              className="text-xs leading-relaxed font-semibold flex-1"
              style={{ color: "var(--yume-theme-header-color, " + (darkMode ? "#cbd5e1" : "#0b2447") + ")" }}
            >
              <strong
                className="font-black uppercase mr-1.5"
                style={{ color: "var(--yume-theme-header-color, " + (darkMode ? "#38bdf8" : "#0b2447") + ")" }}
              >
                Advice:
              </strong>
              Connect your Meta, TikTok, and Snapchat pixel IDs so every <span className="font-mono">ViewContent</span>, <span className="font-mono">AddToCart</span>, <span className="font-mono">InitiateCheckout</span>, and <span className="font-mono">Purchase</span> event on your storefront is automatically attributed to your active campaigns.
            </p>
          </div>
        )}

        {/* Optional New Campaign Creation Panel */}
        {showNewCampaignForm && (
          <form
            onSubmit={handleCreateCampaign}
            className="bg-stone-50 dark:bg-slate-900/40 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-slate-800 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200/70 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-stone-700 dark:text-slate-300" />
                <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                  Launch Tracked Ad Campaign
                </h4>
              </div>
              <span className="text-[11px] font-mono text-stone-500 dark:text-slate-400">
                Auto-Links Store Pixels
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  placeholder="e.g., Ramadan Artisan Collection"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Ad Platform *</label>
                <select
                  value={newCampPlatform}
                  onChange={(e) => setNewCampPlatform(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="Facebook">Facebook / Instagram (Meta)</option>
                  <option value="TikTok">TikTok Spark Ads</option>
                  <option value="Snapchat">Snapchat Story & AR Ads</option>
                  <option value="Google">Google Shopping / GA4</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Budget Allocation (DZD) *</label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  required
                  value={newCampSpend}
                  onChange={(e) => setNewCampSpend(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewCampaignForm(false)}
                className="bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 font-semibold text-xs px-4 py-2 rounded-xl border border-stone-200 dark:border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
                className="hover:brightness-110 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Add Campaign to Tracker</span>
              </button>
            </div>
          </form>
        )}

        {/* SECTION 1: PIXEL CONFIGURATION & LIVE TELEMETRY */}
        {(activeSubSection === "all" || activeSubSection === "pixels") && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left column: Pixel Configuration Form */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="bg-stone-50 dark:bg-slate-900/40 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-slate-800 flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-3 border-b border-stone-200/80 dark:border-slate-800">
                  <Settings className="w-4 h-4 text-stone-700 dark:text-slate-300" />
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                    Configure Tracking Pixels
                  </h4>
                </div>

                <form onSubmit={handleSaveConfig} className="flex flex-col gap-3.5">
                  <div>
                    <label className={labelClass}>Facebook Pixel ID (Meta)</label>
                    <input
                      type="text"
                      placeholder="e.g., 847291048291039"
                      value={fbId}
                      onChange={(e) => setFbId(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                    {showHints && (
                      <span className="text-[10.5px] text-stone-500 dark:text-slate-400 mt-1 block">
                        Fires <span className="font-mono">PageView</span>, <span className="font-mono">ViewContent</span>, <span className="font-mono">AddToCart</span>, & <span className="font-mono">Purchase</span>.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>TikTok Pixel ID</label>
                    <input
                      type="text"
                      placeholder="e.g., PC89204892019A"
                      value={ttId}
                      onChange={(e) => setTtId(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                    {showHints && (
                      <span className="text-[10.5px] text-stone-500 dark:text-slate-400 mt-1 block">
                        Tracks TikTok commerce engagement via <span className="font-mono">ttq.track()</span> triggers.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Snapchat Pixel ID</label>
                    <input
                      type="text"
                      placeholder="e.g., snap-984209420"
                      value={scId}
                      onChange={(e) => setScId(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                    {showHints && (
                      <span className="text-[10.5px] text-stone-500 dark:text-slate-400 mt-1 block">
                        Triggers native Snapchat events for targeted audience matching.
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
                    className="w-full mt-1 py-2.5 hover:brightness-110 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isSaved ? "Saved Successfully!" : "Save & Sync Pixels"}</span>
                  </button>
                </form>
              </div>

              {/* Event Mapping Reference */}
              <div className="bg-stone-50 dark:bg-slate-900/40 p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 text-xs">
                <h4 className="font-bold text-stone-900 dark:text-white mb-2.5 flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-stone-600 dark:text-slate-400" />
                  <span>Standard Event Mapping</span>
                </h4>
                <div className="flex flex-col gap-2 font-mono text-[11px] text-stone-600 dark:text-slate-400">
                  <div className="flex justify-between border-b border-stone-200/60 dark:border-slate-800 pb-1.5">
                    <span>Product Page Open:</span>
                    <span className="font-bold text-stone-900 dark:text-white">ViewContent</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200/60 dark:border-slate-800 pb-1.5">
                    <span>Cart Addition:</span>
                    <span className="font-bold text-stone-900 dark:text-white">AddToCart</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200/60 dark:border-slate-800 pb-1.5">
                    <span>Checkout Started:</span>
                    <span className="font-bold text-stone-900 dark:text-white">InitiateCheckout</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Confirmed:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Purchase</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 2 columns: Live Telemetry Debug Terminal */}
            <div className="lg:col-span-2 bg-stone-50 dark:bg-slate-900/40 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-slate-800 flex flex-col h-[460px]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200/80 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-stone-700 dark:text-slate-300" />
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                      Real-Time Pixel Telemetry Stream
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400">
                      Live verification of marketing events fired across your storefront
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLogRefreshKey((prev) => prev + 1)}
                    className="p-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300 transition-all cursor-pointer"
                    title="Refresh Logs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-stone-700 hover:text-rose-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto rounded-xl p-3.5 font-mono text-xs flex flex-col gap-2.5 border bg-white dark:bg-slate-950 border-stone-200/90 dark:border-slate-800 text-stone-800 dark:text-slate-200">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10 text-stone-400 dark:text-slate-500">
                    <Activity className="w-7 h-7 mb-2 text-stone-400 dark:text-slate-600" />
                    <p className="text-xs font-sans font-semibold text-stone-600 dark:text-slate-400">
                      No pixel events captured in this session yet
                    </p>
                    <p className="text-[11px] font-sans mt-1 max-w-xs leading-relaxed text-stone-400 dark:text-slate-500">
                      Browse products on your storefront, add an item to cart, or complete an order to inspect live pixel payloads here.
                    </p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="border-b border-stone-100 dark:border-slate-800/80 pb-2.5 last:border-b-0">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-stone-400 font-bold">{log.timestamp}</span>
                          <span className={`text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-md ${getLogBadgeColor(log.pixelType)}`}>
                            {log.pixelType}
                          </span>
                          <span className="text-xs font-bold text-stone-900 dark:text-white">
                            {log.eventName}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {log.id}
                        </span>
                      </div>
                      <pre className="text-[10.5px] bg-stone-50 dark:bg-slate-900 p-2.5 rounded-lg border border-stone-200/60 dark:border-slate-800 text-stone-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: HISTORICAL AD CAMPAIGN PERFORMANCE TABLE */}
        {(activeSubSection === "all" || activeSubSection === "campaigns") && (
          <div className="bg-stone-50 dark:bg-slate-900/40 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-stone-200/80 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-stone-700 dark:text-slate-300" />
                  <span>Store Campaign Attribution & ROAS Ledger</span>
                </h4>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                  Performance breakdown mapping ad spend across platforms to verified store purchases
                </p>
              </div>
              <span className="text-[11px] bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 px-3 py-1 rounded-full font-semibold">
                {campaigns.length} Active Campaigns
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-stone-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-slate-800 bg-stone-50/80 dark:bg-slate-950/50 text-stone-500 dark:text-slate-400 font-bold">
                    <th className="py-3 px-3.5">Ad Campaign Name</th>
                    <th className="py-3 px-3">Platform</th>
                    <th className="py-3 px-3">Ad Spend</th>
                    <th className="py-3 px-3">Impressions</th>
                    <th className="py-3 px-3 text-center">Clicks (CTR)</th>
                    <th className="py-3 px-3 text-center">Add To Cart</th>
                    <th className="py-3 px-3 text-center">Sales (CR)</th>
                    <th className="py-3 px-3 text-right">Revenue</th>
                    <th className="py-3 px-3.5 text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/60 dark:divide-slate-800">
                  {campaigns.map((cmp) => {
                    const ctrPercent = cmp.impressions > 0 ? ((cmp.clicks / cmp.impressions) * 100).toFixed(1) : "0";
                    const crPercent = cmp.clicks > 0 ? ((cmp.purchases / cmp.clicks) * 100).toFixed(1) : "0";
                    const roas = cmp.spend > 0 ? (cmp.revenue / cmp.spend).toFixed(2) : "0";
                    const isProfitable = parseFloat(roas) >= 2.0;

                    return (
                      <tr key={cmp.id} className="hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-stone-900 dark:text-white">{cmp.name}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getLogBadgeColor(cmp.platform === "Google" ? "GA4" : cmp.platform)}`}>
                            {cmp.platform}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs font-semibold text-stone-600 dark:text-slate-300">{formatCurrency(cmp.spend)}</td>
                        <td className="py-3 px-3 font-mono text-stone-600 dark:text-slate-400">{cmp.impressions.toLocaleString()}</td>
                        <td className="py-3 px-3 text-center">
                          <div className="font-mono font-bold text-stone-900 dark:text-white">{cmp.clicks.toLocaleString()}</div>
                          <div className="text-[10px] text-stone-400 font-mono">({ctrPercent}%)</div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-stone-800 dark:text-slate-200 font-mono">{cmp.carts}</td>
                        <td className="py-3 px-3 text-center">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{cmp.purchases}</div>
                          <div className="text-[10px] text-stone-400 font-mono">({crPercent}%)</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-stone-900 dark:text-white">{formatCurrency(cmp.revenue)}</td>
                        <td className="py-3 px-3.5 text-right">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono inline-block border ${
                            isProfitable 
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60" 
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                          }`}>
                            {roas}x
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 3: INTERACTIVE AD CAMPAIGN ROI & FUNNEL ROAS SIMULATOR */}
        {(activeSubSection === "all" || activeSubSection === "simulator") && (
          <div className="bg-stone-50 dark:bg-slate-900/40 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-slate-800 flex flex-col gap-4">
            <div className="pb-3 border-b border-stone-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-stone-700 dark:text-slate-300" />
                  <span>E-Commerce ROAS & Funnel Simulator</span>
                </h4>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                  Model conversion rate and AOV impact on Algerian Dinars (DZD) ad spend outcomes
                </p>
              </div>
              
              {/* Preset Buttons */}
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { id: "facebook-jewelry", label: "FB Jewelry Preset" },
                  { id: "tiktok-robes", label: "TikTok Robes Preset" },
                  { id: "snapchat-ar", label: "Snapchat Rugs AR" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    style={
                      activePreset === preset.id
                        ? {
                            backgroundColor: "var(--yume-theme-header-color, #0b2447)",
                            borderColor: "var(--yume-theme-header-color, #0b2447)",
                          }
                        : undefined
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      activePreset === preset.id
                        ? "text-white font-bold shadow-2xs"
                        : "bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Controls Panel */}
              <div className="md:col-span-5 bg-white dark:bg-slate-900 p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 flex flex-col gap-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5 text-stone-700 dark:text-slate-300">
                    <span>Ad Spend Budget:</span>
                    <span className="font-mono text-stone-900 dark:text-white">{formatCurrency(adSpend)}</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="300000"
                    step="5000"
                    value={adSpend}
                    onChange={(e) => {
                      setAdSpend(parseInt(e.target.value));
                      setActivePreset("custom");
                    }}
                    className="w-full accent-stone-900 dark:accent-white h-1.5 bg-stone-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5 text-stone-700 dark:text-slate-300">
                    <span>Target CPM (Per 1,000 Views):</span>
                    <span className="font-mono text-stone-900 dark:text-white">{formatCurrency(cpm)}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="20"
                    value={cpm}
                    onChange={(e) => {
                      setCpm(parseInt(e.target.value));
                      setActivePreset("custom");
                    }}
                    className="w-full accent-stone-900 dark:accent-white h-1.5 bg-stone-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5 text-stone-700 dark:text-slate-300">
                    <span>Click-Through Rate (CTR):</span>
                    <span className="font-mono text-stone-900 dark:text-white">{ctr}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="8"
                    step="0.1"
                    value={ctr}
                    onChange={(e) => {
                      setCtr(parseFloat(e.target.value));
                      setActivePreset("custom");
                    }}
                    className="w-full accent-stone-900 dark:accent-white h-1.5 bg-stone-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5 text-stone-700 dark:text-slate-300">
                    <span>Purchase Conversion Rate (CR):</span>
                    <span className="font-mono text-stone-900 dark:text-white">{cvr}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={cvr}
                    onChange={(e) => {
                      setCvr(parseFloat(e.target.value));
                      setActivePreset("custom");
                    }}
                    className="w-full accent-stone-900 dark:accent-white h-1.5 bg-stone-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5 text-stone-700 dark:text-slate-300">
                    <span>Average Order Value (AOV):</span>
                    <span className="font-mono text-stone-900 dark:text-white">{formatCurrency(aov)}</span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="50000"
                    step="1000"
                    value={aov}
                    onChange={(e) => {
                      setAov(parseInt(e.target.value));
                      setActivePreset("custom");
                    }}
                    className="w-full accent-stone-900 dark:accent-white h-1.5 bg-stone-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Results Output Metrics Board */}
              <div className="md:col-span-7 grid grid-cols-2 gap-3.5 h-full">
                <div className="p-4 rounded-xl flex flex-col justify-between border bg-white dark:bg-slate-900 border-stone-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-stone-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">
                    Estimated Impressions
                  </div>
                  <div className="text-xl font-bold font-mono text-stone-900 dark:text-white mt-1">
                    {computedImpressions.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-slate-400 mt-1">
                    Total reach on target platforms
                  </div>
                </div>

                <div className="p-4 rounded-xl flex flex-col justify-between border bg-white dark:bg-slate-900 border-stone-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-stone-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">
                    Estimated Clicks
                  </div>
                  <div className="text-xl font-bold font-mono text-stone-900 dark:text-white mt-1">
                    {computedClicks.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 flex justify-between">
                    <span>Cost Per Click:</span>
                    <span className="font-mono font-bold text-stone-800 dark:text-slate-200">{formatCurrency(computedCostPerClick)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl flex flex-col justify-between border bg-white dark:bg-slate-900 border-stone-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-stone-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">
                    Estimated Orders
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    {computedSales.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 flex justify-between">
                    <span>Cost Per Acquisition:</span>
                    <span className="font-mono font-bold text-stone-800 dark:text-slate-200">{formatCurrency(computedCPA)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl flex flex-col justify-between border bg-white dark:bg-slate-900 border-stone-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-stone-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">
                    Predicted ROAS
                  </div>
                  <div className={`text-2xl font-bold font-mono mt-1 ${
                    computedROAS >= 2.0 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : computedROAS >= 1.0 
                      ? "text-amber-600 dark:text-amber-400" 
                      : "text-rose-600 dark:text-rose-400"
                  }`}>
                    {computedROAS.toFixed(2)}x
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md w-fit border ${
                    computedROAS >= 2.0 
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60" 
                      : computedROAS >= 1.0 
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60" 
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
                  }`}>
                    {computedROAS >= 2.0 ? "Highly Profitable" : computedROAS >= 1.0 ? "Moderate Return" : "Below Break-Even"}
                  </span>
                </div>

                {/* Projected Revenue / Net Return Bar */}
                <div className="col-span-2 p-4 rounded-xl flex items-center justify-between border bg-white dark:bg-slate-900 border-stone-200/80 dark:border-slate-800">
                  <div>
                    <div className="text-[10.5px] uppercase font-mono font-bold text-stone-500 dark:text-slate-400 tracking-wider">
                      Projected Gross Revenue & Net Return
                    </div>
                    <div className="text-xl font-bold font-mono text-stone-900 dark:text-white mt-0.5">
                      {formatCurrency(computedRevenue)}
                      <span className={`text-xs ml-2 font-bold ${computedNetProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        ({computedNetProfit >= 0 ? "+" : ""}{formatCurrency(computedNetProfit)} net)
                      </span>
                    </div>
                  </div>
                  <TrendingUp className={`w-6 h-6 shrink-0 ${computedNetProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-stone-400"}`} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

