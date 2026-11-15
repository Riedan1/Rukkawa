import React, { useState, useEffect, useMemo } from "react";
import {
  Tag,
  Percent,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Layers,
  ShoppingBag,
  Zap,
  Gift,
  TrendingUp,
  Save,
  X,
  Copy,
  Check,
  Search,
  Store,
  ShieldCheck,
  SlidersHorizontal,
  HelpCircle,
  Info,
} from "lucide-react";
import { MerchantStore, Coupon, Product } from "../types";

interface DiscountAndCouponDashboardProps {
  darkMode?: boolean;
  myStore: MerchantStore;
  setStores: React.Dispatch<React.SetStateAction<MerchantStore[]>>;
  setMerchantFeedbackMessage?: (msg: string) => void;
  checkPermission: (
    permission:
      | "confirmOrders"
      | "prepareShipments"
      | "manageProducts"
      | "manageDiscounts"
      | "manageAnalytics"
      | "respondReviews"
      | "manageFollowers"
  ) => boolean;
}

export const DiscountAndCouponDashboard: React.FC<DiscountAndCouponDashboardProps> = ({
  myStore,
  setStores,
  setMerchantFeedbackMessage = (_msg: string = "") => {},
  checkPermission,
}) => {
  // Active Top-Level Section Tab ("coupons" | "flash-sales")
  const [activeMainSection, setActiveMainSection] = useState<"coupons" | "flash-sales">("coupons");
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

  // Coupon Status Filter & Search
  const [couponStatusFilter, setCouponStatusFilter] = useState<"all" | "active" | "scheduled" | "expired">("all");
  const [couponSearchQuery, setCouponSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Coupon Form State
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [targetType, setTargetType] = useState<"all" | "category" | "product">("all");
  const [targetValue, setTargetValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Product Flash Sale Editor State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodDiscountEnabled, setProdDiscountEnabled] = useState(false);
  const [prodDiscountPercent, setProdDiscountPercent] = useState("15");
  const [prodPromoText, setProdPromoText] = useState("FLASH SALE");
  const [prodStartDate, setProdStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [prodEndDate, setProdEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [productSearchQuery, setProductSearchQuery] = useState("");

  const coupons: Coupon[] = myStore.coupons || [];
  const products: Product[] = myStore.products || [];

  // Sync store coupons with backend database on mount or when store changes
  useEffect(() => {
    if (!myStore?.id) return;
    let isMounted = true;

    const syncCouponsWithBackend = async () => {
      try {
        const res = await fetch("/api/coupons/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeId: myStore.id,
            coupons: (myStore.coupons || []).map((c) => ({
              ...c,
              storeId: myStore.id,
            })),
          }),
        });
        if (!res.ok || !isMounted) return;
        const data = await res.json();
        if (data && Array.isArray(data.coupons)) {
          setStores((prevStores) =>
            prevStores.map((s) => {
              if (s.id !== myStore.id) return s;
              return {
                ...s,
                coupons: data.coupons,
              };
            })
          );
        }
      } catch (err) {
        console.warn("Could not sync store coupons with backend:", err);
      }
    };

    syncCouponsWithBackend();
    return () => {
      isMounted = false;
    };
  }, [myStore.id]);

  // Extract unique categories from store products & store categories
  const storeCategories = useMemo(() => {
    return Array.from(
      new Set([
        ...(myStore.categories || []),
        ...products.map((p) => p.category).filter(Boolean),
      ])
    );
  }, [myStore.categories, products]);

  // Compute dynamic status based on current date
  const computeStatus = (start: string, end: string): "active" | "scheduled" | "expired" => {
    const today = new Date().toISOString().split("T")[0];
    if (end && end < today) return "expired";
    if (start && start > today) return "scheduled";
    return "active";
  };

  // Generate random promo code
  const generateRandomCode = () => {
    const prefixes = ["DZ", "PROMO", "SAVE", "VIP", "YUME", "EID", "FLASH"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 89);
    setCode(`${randomPrefix}${randomNum}`);
  };

  const handleCopyCode = (couponCode: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(couponCode).catch(() => {});
    }
    setCopiedCode(couponCode);
    setMerchantFeedbackMessage(`Coupon code "${couponCode}" copied to clipboard!`);
    setTimeout(() => {
      setCopiedCode((prev) => (prev === couponCode ? null : prev));
    }, 2000);
    setTimeout(() => setMerchantFeedbackMessage(""), 3500);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission("manageDiscounts")) return;

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!cleanCode) {
      setMerchantFeedbackMessage("Please enter a valid alphanumeric coupon code.");
      setTimeout(() => setMerchantFeedbackMessage(""), 4000);
      return;
    }

    const numVal = Number(value);
    if (!numVal || numVal <= 0) {
      setMerchantFeedbackMessage("Please enter a valid discount value greater than 0.");
      setTimeout(() => setMerchantFeedbackMessage(""), 4000);
      return;
    }

    if (type === "percentage" && numVal > 90) {
      setMerchantFeedbackMessage("Percentage discount cannot exceed 90%.");
      setTimeout(() => setMerchantFeedbackMessage(""), 4000);
      return;
    }

    if (coupons.some((c) => c.code.toUpperCase() === cleanCode)) {
      setMerchantFeedbackMessage(`Coupon code "${cleanCode}" already exists in ${myStore.name}.`);
      setTimeout(() => setMerchantFeedbackMessage(""), 4000);
      return;
    }

    const status = computeStatus(startDate, endDate);

    const newCoupon: Coupon = {
      id: `cpn_${Date.now()}`,
      storeId: myStore.id,
      code: cleanCode,
      type,
      value: numVal,
      targetType,
      targetValue: targetType === "all" ? undefined : targetValue,
      minPurchase: minPurchase ? Number(minPurchase) : undefined,
      maxUses: maxUses ? Number(maxUses) : undefined,
      startDate,
      endDate,
      status,
      usageCount: 0,
    };

    // Persist to backend database scoped to myStore.id
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCoupon),
      });
      if (res.ok) {
        const savedData = await res.json();
        if (savedData?.coupon) {
          newCoupon.id = savedData.coupon.id;
        }
      }
    } catch (err) {
      console.warn("Could not save coupon to /api/coupons:", err);
    }

    setStores((prevStores) =>
      prevStores.map((s) => {
        if (s.id !== myStore.id) return s;
        return {
          ...s,
          coupons: [newCoupon, ...(s.coupons || [])],
        };
      })
    );

    setMerchantFeedbackMessage(
      `Coupon "${cleanCode}" created for ${myStore.name} (${status.toUpperCase()})!`
    );
    setTimeout(() => setMerchantFeedbackMessage(""), 4000);

    // Reset form
    setCode("");
    setValue("");
    setMinPurchase("");
    setMaxUses("");
    setTargetType("all");
    setTargetValue("");
    setIsAddingCoupon(false);
  };

  const handleDeleteCoupon = async (couponId: string, couponCode: string) => {
    if (!checkPermission("manageDiscounts")) return;

    try {
      await fetch(`/api/coupons/${encodeURIComponent(couponId)}?storeId=${encodeURIComponent(myStore.id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Could not delete coupon from backend:", err);
    }

    setStores((prevStores) =>
      prevStores.map((s) => {
        if (s.id !== myStore.id) return s;
        return {
          ...s,
          coupons: (s.coupons || []).filter((c) => c.id !== couponId),
        };
      })
    );

    setMerchantFeedbackMessage(`Coupon "${couponCode}" deleted from ${myStore.name}.`);
    setTimeout(() => setMerchantFeedbackMessage(""), 3500);
  };

  const handleSimulateRedemption = async (couponId: string) => {
    if (!checkPermission("manageDiscounts")) return;

    const targetCoupon = coupons.find((c) => c.id === couponId);
    if (!targetCoupon) return;

    if (targetCoupon.maxUses && targetCoupon.usageCount >= targetCoupon.maxUses) {
      setMerchantFeedbackMessage(`Coupon "${targetCoupon.code}" has reached its maximum usage limit (${targetCoupon.maxUses}).`);
      setTimeout(() => setMerchantFeedbackMessage(""), 3500);
      return;
    }

    const updatedCoupon: Coupon = {
      ...targetCoupon,
      storeId: myStore.id,
      usageCount: (targetCoupon.usageCount || 0) + 1,
    };

    try {
      await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCoupon),
      });
    } catch (err) {
      console.warn("Could not update coupon usage in backend:", err);
    }

    setStores((prevStores) =>
      prevStores.map((s) => {
        if (s.id !== myStore.id) return s;
        return {
          ...s,
          coupons: (s.coupons || []).map((c) => (c.id === couponId ? updatedCoupon : c)),
        };
      })
    );

    setMerchantFeedbackMessage(`Recorded redemption for "${targetCoupon.code}" (${updatedCoupon.usageCount}${targetCoupon.maxUses ? `/${targetCoupon.maxUses}` : ""} uses).`);
    setTimeout(() => setMerchantFeedbackMessage(""), 3000);
  };

  // Start editing a product's flash sale settings
  const openProductPromoEditor = (product: Product) => {
    setEditingProductId(product.id);
    setProdDiscountEnabled(Boolean(product.discountEnabled));
    setProdDiscountPercent(String(product.discountPercent || 15));
    setProdPromoText((product as any).promotionText || "FLASH SALE");
    setProdStartDate((product as any).discountStartDate || new Date().toISOString().split("T")[0]);
    setProdEndDate(
      (product as any).discountEndDate ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
  };

  const handleSaveProductPromo = (productId: string) => {
    if (!checkPermission("manageDiscounts")) return;

    const pct = Math.min(90, Math.max(1, Number(prodDiscountPercent) || 10));

    setStores((prevStores) =>
      prevStores.map((s) => {
        if (s.id !== myStore.id) return s;
        return {
          ...s,
          products: s.products.map((p) => {
            if (p.id !== productId) return p;
            return {
              ...p,
              discountEnabled: prodDiscountEnabled,
              discountPercent: pct,
              promotionText: prodPromoText.trim() || "SALE",
              discountStartDate: prodStartDate,
              discountEndDate: prodEndDate,
            };
          }),
        };
      })
    );

    setEditingProductId(null);
    setMerchantFeedbackMessage(
      prodDiscountEnabled
        ? `Promotional pricing (-${pct}%) activated on product!`
        : `Promotional pricing disabled for product.`
    );
    setTimeout(() => setMerchantFeedbackMessage(""), 4000);
  };

  // Metrics & Filtered Lists
  const enrichedCoupons = useMemo(() => {
    return coupons.map((c) => ({
      ...c,
      storeId: c.storeId || myStore.id,
      status: computeStatus(c.startDate, c.endDate),
    }));
  }, [coupons, myStore.id]);

  const activeCouponsCount = enrichedCoupons.filter((c) => c.status === "active").length;
  const scheduledCouponsCount = enrichedCoupons.filter((c) => c.status === "scheduled").length;
  const expiredCouponsCount = enrichedCoupons.filter((c) => c.status === "expired").length;
  const totalRedemptions = enrichedCoupons.reduce((acc, c) => acc + (c.usageCount || 0), 0);
  const discountedProductsCount = products.filter((p) => p.discountEnabled).length;

  const filteredCoupons = useMemo(() => {
    return enrichedCoupons.filter((c) => {
      if (couponStatusFilter !== "all" && c.status !== couponStatusFilter) return false;
      if (couponSearchQuery.trim() !== "") {
        const q = couponSearchQuery.trim().toLowerCase();
        const matchCode = c.code.toLowerCase().includes(q);
        const matchTarget = (c.targetValue || "").toLowerCase().includes(q);
        return matchCode || matchTarget;
      }
      return true;
    });
  }, [enrichedCoupons, couponStatusFilter, couponSearchQuery]);

  const filteredProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return products;
    const q = productSearchQuery.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q)
    );
  }, [products, productSearchQuery]);

  // Standard input & label classes matching Add New Product & My Products
  const inputClass =
    "w-full text-xs p-2.5 rounded-xl border border-stone-200/90 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-medium text-stone-900 dark:text-white outline-none focus:border-stone-900 dark:focus:border-white transition-colors";
  const labelClass =
    "text-xs font-semibold text-stone-800 dark:text-slate-200 block mb-1.5";

  return (
    <div className="flex flex-col gap-5 animate-fade-in text-left">
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-stone-200/80 dark:border-slate-800 shadow-2xs text-stone-900 dark:text-white text-left flex flex-col gap-5">
        {/* Top Header Row — Matching "Add Product" */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-1.5 h-5 rounded-full shrink-0"
              style={{
                backgroundColor: "var(--yume-theme-header-color, #0b2447)",
              }}
            />
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight font-sans flex items-center gap-2 text-stone-900 dark:text-white">
                <Tag className="w-4 h-4 text-stone-700 dark:text-slate-300 shrink-0" />
                <span>Coupons & Discounts</span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full shrink-0 font-semibold bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700">
                  {enrichedCoupons.length}
                </span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                Create store-exclusive promo codes, enforce usage limits, and manage product-level flash sales for{" "}
                <strong className="text-stone-800 dark:text-slate-200 font-semibold">{myStore.name}</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Compact Inline Mode Switcher to preserve Coupons vs Flash Sales functionality */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-slate-800/90 border border-stone-200/80 dark:border-slate-700">
              {[
                { id: "coupons" as const, label: "Coupon Codes", count: enrichedCoupons.length },
                { id: "flash-sales" as const, label: "Flash Sales", count: discountedProductsCount },
              ].map((tab) => {
                const isCurrent = activeMainSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveMainSection(tab.id)}
                    style={
                      isCurrent
                        ? { backgroundColor: "var(--yume-theme-header-color, #0b2447)" }
                        : undefined
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isCurrent
                        ? "text-white shadow-2xs"
                        : "text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isCurrent
                          ? "bg-white/20 text-white"
                          : "bg-stone-200/80 dark:bg-slate-700 text-stone-600 dark:text-slate-300"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Store Ownership Security Badge */}
            <div className="bg-stone-100/80 dark:bg-slate-800/80 border border-stone-200/90 dark:border-slate-700 text-stone-700 dark:text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-stone-600 dark:text-slate-400 shrink-0" />
              <span className="truncate max-w-[140px]">{myStore.name}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!checkPermission("manageDiscounts")) return;
                setActiveMainSection("coupons");
                setIsAddingCoupon((prev) => !prev);
              }}
              style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
              className="hover:brightness-110 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] cursor-pointer"
            >
              {isAddingCoupon ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isAddingCoupon ? "Close Form" : "Create Coupon"}</span>
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
              backgroundColor: "color-mix(in srgb, var(--yume-theme-header-color, #0b2447) 6%, transparent)",
              borderColor: "color-mix(in srgb, var(--yume-theme-header-color, #0b2447) 18%, transparent)",
            }}
          >
            <Info
              className="w-4 h-4 shrink-0 mt-0.5"
              style={{ color: "var(--yume-theme-header-color, #0b2447)" }}
            />
            <p
              className="text-xs leading-relaxed font-semibold flex-1 text-stone-700 dark:text-slate-300"
            >
              <strong
                className="font-black uppercase mr-1.5"
                style={{ color: "var(--yume-theme-header-color, #0b2447)" }}
              >
                Advice:
              </strong>
              Combine time-limited product flash sales with a store-wide coupon code (such as <span className="font-mono">WELCOME10</span>) to increase average order value and convert first-time shoppers.
            </p>
          </div>
        )}

        {/* KPI Summary Grid — Clean Minimalist Cards Matching Design System */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-stone-50/70 dark:bg-slate-950/60 p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10.5px] font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider font-mono block">
                Active Coupons
              </span>
              <div className="text-2xl font-bold text-stone-900 dark:text-white font-mono">
                {activeCouponsCount}
              </div>
              <span className="text-[11px] text-stone-500 dark:text-slate-400 block">
                Live on checkout
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 flex items-center justify-center text-stone-700 dark:text-slate-300 shrink-0">
              <Tag className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-stone-50/70 dark:bg-slate-950/60 p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10.5px] font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider font-mono block">
                Scheduled
              </span>
              <div className="text-2xl font-bold text-stone-900 dark:text-white font-mono">
                {scheduledCouponsCount}
              </div>
              <span className="text-[11px] text-stone-500 dark:text-slate-400 block">
                Upcoming campaigns
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 flex items-center justify-center text-stone-700 dark:text-slate-300 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-stone-50/70 dark:bg-slate-950/60 p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10.5px] font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider font-mono block">
                Total Redemptions
              </span>
              <div className="text-2xl font-bold text-stone-900 dark:text-white font-mono">
                {totalRedemptions}
              </div>
              <span className="text-[11px] text-stone-500 dark:text-slate-400 block">
                Verified orders used
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 flex items-center justify-center text-stone-700 dark:text-slate-300 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-stone-50/70 dark:bg-slate-950/60 p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10.5px] font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider font-mono block">
                Products on Sale
              </span>
              <div className="text-2xl font-bold text-stone-900 dark:text-white font-mono">
                {discountedProductsCount}{" "}
                <span className="text-xs font-normal text-stone-400">/ {products.length}</span>
              </div>
              <span className="text-[11px] text-stone-500 dark:text-slate-400 block">
                Direct flash markdowns
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 flex items-center justify-center text-stone-700 dark:text-slate-300 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
          </div>
        </div>

      {/* Create New Coupon Form — Matching "Add New Product" Section Card */}
      {isAddingCoupon && (
        <form
          onSubmit={handleCreateCoupon}
          className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-stone-200/90 dark:border-slate-800 space-y-5 shadow-xs"
        >
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className="w-1.5 h-5 rounded-full shrink-0"
                style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
              />
              <div>
                <h4 className="text-base font-bold text-stone-900 dark:text-white tracking-tight font-sans">
                  New Store Coupon Campaign
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  This coupon will belong exclusively to <strong>{myStore.name}</strong> and validate on your product order forms.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingCoupon(false)}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Coupon Code */}
            <div>
              <label className={labelClass}>Coupon Code *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., WELCOME15"
                  className={`${inputClass} font-mono uppercase tracking-wider`}
                  required
                />
                <button
                  type="button"
                  onClick={generateRandomCode}
                  title="Generate Random Code"
                  className="bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 border border-stone-200 dark:border-slate-700 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto</span>
                </button>
              </div>
            </div>

            {/* 2. Discount Type */}
            <div>
              <label className={labelClass}>Discount Type *</label>
              <div className="grid grid-cols-2 gap-1.5 bg-stone-100/80 dark:bg-slate-950 p-1 rounded-xl border border-stone-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setType("percentage")}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === "percentage"
                      ? "bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-2xs border border-stone-200/80 dark:border-slate-700 font-bold"
                      : "text-stone-500 dark:text-slate-400"
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Percentage (%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType("fixed")}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === "fixed"
                      ? "bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-2xs border border-stone-200/80 dark:border-slate-700 font-bold"
                      : "text-stone-500 dark:text-slate-400"
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Fixed (DZD)</span>
                </button>
              </div>
            </div>

            {/* 3. Discount Value */}
            <div>
              <label className={labelClass}>
                {type === "percentage" ? "Discount Percentage (%) *" : "Discount Amount (DZD) *"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={type === "percentage" ? "90" : "100000"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === "percentage" ? "e.g., 15" : "e.g., 500"}
                  className={`${inputClass} font-mono pr-12`}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold font-mono text-stone-400">
                  {type === "percentage" ? "%" : "DZD"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 4. Target Scope */}
            <div>
              <label className={labelClass}>Applies To</label>
              <select
                value={targetType}
                onChange={(e) => {
                  const next = e.target.value as "all" | "category" | "product";
                  setTargetType(next);
                  if (next === "category") setTargetValue(storeCategories[0] || "");
                  else if (next === "product") setTargetValue(products[0]?.id || "");
                  else setTargetValue("");
                }}
                className={inputClass}
              >
                <option value="all">Entire Store ({myStore.name})</option>
                <option value="category">Specific Product Category</option>
                <option value="product">Specific Product</option>
              </select>
            </div>

            {/* 5. Dynamic Target Selector */}
            {targetType === "category" && (
              <div>
                <label className={labelClass}>Target Category</label>
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className={inputClass}
                >
                  {storeCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === "product" && (
              <div>
                <label className={labelClass}>Target Product</label>
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className={inputClass}
                >
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({prod.price.toLocaleString()} DZD)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 6. Min Order Value */}
            <div>
              <label className={labelClass}>Min. Order Subtotal (DZD)</label>
              <input
                type="number"
                min="0"
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value)}
                placeholder="No minimum (0 DZD)"
                className={`${inputClass} font-mono`}
              />
            </div>

            {/* 7. Usage Limit */}
            <div>
              <label className={labelClass}>Usage Limit (Max Orders)</label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited uses"
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className={labelClass}>Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`${inputClass} font-mono`}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Expiration Date *</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`${inputClass} font-mono`}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddingCoupon(false)}
              className="bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 border border-stone-200 dark:border-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
              className="hover:brightness-110 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Activate Coupon</span>
            </button>
          </div>
        </form>
      )}

      {/* SECTION 1: STORE COUPON CODES */}
      {activeMainSection === "coupons" && (
        <div className="space-y-4">
          {/* Filter & Search Bar — Matching "My Products" */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All", count: enrichedCoupons.length },
                { id: "active", label: "Active", count: activeCouponsCount },
                { id: "scheduled", label: "Scheduled", count: scheduledCouponsCount },
                { id: "expired", label: "Expired", count: expiredCouponsCount },
              ].map((tab) => {
                const isSelected = couponStatusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCouponStatusFilter(tab.id as any)}
                    style={
                      isSelected
                        ? {
                            backgroundColor: "var(--yume-theme-header-color, #0b2447)",
                            borderColor: "var(--yume-theme-header-color, #0b2447)",
                          }
                        : undefined
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? "text-white font-bold shadow-2xs"
                        : "bg-stone-50 dark:bg-slate-800/70 text-stone-600 dark:text-slate-400 border-stone-200/80 dark:border-slate-700 hover:bg-stone-100 font-medium"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-stone-200/70 dark:bg-slate-700 text-stone-600 dark:text-slate-300"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={couponSearchQuery}
                onChange={(e) => setCouponSearchQuery(e.target.value)}
                placeholder="Search coupon code..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-stone-200/90 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-medium text-stone-900 dark:text-white outline-none focus:border-stone-900 dark:focus:border-white transition-colors"
              />
            </div>
          </div>

          {/* Coupons Grid */}
          {filteredCoupons.length === 0 ? (
            <div className="bg-stone-50/50 dark:bg-slate-950/40 border border-dashed border-stone-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-stone-100 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 flex items-center justify-center mx-auto text-stone-500 dark:text-slate-400">
                <Tag className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h5 className="text-sm font-bold text-stone-900 dark:text-white">
                  {enrichedCoupons.length === 0
                    ? "No store coupons created yet"
                    : "No coupons match your filter"}
                </h5>
                <p className="text-xs text-stone-500 dark:text-slate-400 max-w-md mx-auto">
                  {enrichedCoupons.length === 0
                    ? `Create your first promo code for ${myStore.name} (e.g., WELCOME10 or SAVE500) to reward shoppers at checkout.`
                    : "Try switching status filters or clearing your search query."}
                </p>
              </div>
              {enrichedCoupons.length === 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddingCoupon(true)}
                  style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
                  className="hover:brightness-110 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Coupon</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCoupons.map((coupon) => {
                const status = coupon.status;
                const targetProduct =
                  coupon.targetType === "product"
                    ? products.find((p) => p.id === coupon.targetValue)
                    : null;
                const isLimitReached =
                  coupon.maxUses !== undefined &&
                  coupon.maxUses > 0 &&
                  coupon.usageCount >= coupon.maxUses;
                const usagePct =
                  coupon.maxUses && coupon.maxUses > 0
                    ? Math.min(100, Math.round(((coupon.usageCount || 0) / coupon.maxUses) * 100))
                    : 0;

                return (
                  <div
                    key={coupon.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200/90 dark:border-slate-800 p-5 flex flex-col justify-between gap-4 hover:border-stone-300 dark:hover:border-slate-700 transition-all shadow-2xs"
                  >
                    <div className="space-y-3.5">
                      {/* Top Row: Code Pill + Copy + Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 px-3 py-1.5 rounded-xl font-mono font-bold text-sm tracking-wider text-stone-900 dark:text-white flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-stone-600 dark:text-slate-400" />
                            <span>{coupon.code}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code)}
                            title="Copy coupon code"
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 transition-colors cursor-pointer"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <span className="bg-stone-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold font-mono px-2.5 py-1 rounded-lg">
                            {coupon.type === "percentage"
                              ? `-${coupon.value}% OFF`
                              : `-${coupon.value.toLocaleString()} DZD`}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10.5px] font-bold uppercase tracking-wider font-mono px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 border ${
                            isLimitReached
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
                              : status === "active"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                              : status === "scheduled"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                              : "bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 border-stone-200 dark:border-slate-700"
                          }`}
                        >
                          {isLimitReached ? (
                            <>
                              <AlertCircle className="w-3 h-3" /> Limit Reached
                            </>
                          ) : status === "active" ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </>
                          ) : status === "scheduled" ? (
                            <>
                              <Clock className="w-3 h-3" /> Scheduled
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" /> Expired
                            </>
                          )}
                        </span>
                      </div>

                      {/* Target & Rules Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600 dark:text-slate-400 bg-stone-50/80 dark:bg-slate-950/60 p-3 rounded-xl border border-stone-200/60 dark:border-slate-800/80">
                        <div className="flex items-center gap-1.5 truncate">
                          {coupon.targetType === "all" && (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                              <span className="truncate">
                                Valid on <strong className="text-stone-900 dark:text-white">All Store Products</strong>
                              </span>
                            </>
                          )}
                          {coupon.targetType === "category" && (
                            <>
                              <Layers className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                              <span className="truncate">
                                Category:{" "}
                                <strong className="text-stone-900 dark:text-white">
                                  {coupon.targetValue}
                                </strong>
                              </span>
                            </>
                          )}
                          {coupon.targetType === "product" && (
                            <>
                              <Tag className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                              <span className="truncate">
                                Product:{" "}
                                <strong className="text-stone-900 dark:text-white">
                                  {targetProduct ? targetProduct.name : coupon.targetValue}
                                </strong>
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 sm:justify-end">
                          <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="font-mono text-[11px]">
                            {coupon.startDate} → {coupon.endDate}
                          </span>
                        </div>

                        {coupon.minPurchase ? (
                          <div className="text-[11px] text-stone-500 dark:text-slate-400">
                            Min. Subtotal:{" "}
                            <strong className="font-mono text-stone-800 dark:text-slate-200">
                              {coupon.minPurchase.toLocaleString()} DZD
                            </strong>
                          </div>
                        ) : (
                          <div className="text-[11px] text-stone-400">No minimum purchase</div>
                        )}

                        <div className="text-[11px] text-stone-500 dark:text-slate-400 sm:text-right font-mono">
                          Store ID: <span className="font-semibold">{myStore.id}</span>
                        </div>
                      </div>

                      {/* Usage Progress Bar if maxUses is set */}
                      {coupon.maxUses !== undefined && coupon.maxUses > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-stone-500 dark:text-slate-400 font-medium">
                              Redemption Limit Usage
                            </span>
                            <span className="font-mono font-bold text-stone-800 dark:text-slate-200">
                              {coupon.usageCount || 0} / {coupon.maxUses} ({usagePct}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isLimitReached
                                  ? "bg-rose-500"
                                  : usagePct >= 75
                                  ? "bg-amber-500"
                                  : "bg-stone-900 dark:bg-white"
                              }`}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Controls */}
                    <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-stone-800 dark:text-slate-200 bg-stone-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-stone-200/70 dark:border-slate-700">
                          {coupon.usageCount || 0}
                          {coupon.maxUses ? ` / ${coupon.maxUses}` : ""} uses
                        </span>
                        {status === "active" && !isLimitReached && (
                          <button
                            type="button"
                            onClick={() => handleSimulateRedemption(coupon.id)}
                            className="text-[11px] font-semibold text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white bg-stone-50 dark:bg-slate-800/60 hover:bg-stone-100 dark:hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-stone-200/80 dark:border-slate-700 transition-colors cursor-pointer"
                            title="Test incrementing redemption count"
                          >
                            +1 Test Use
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                        className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: PRODUCT-LEVEL FLASH SALES & PROMOTIONAL PRICING */}
      {activeMainSection === "flash-sales" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-5 rounded-full shrink-0 bg-stone-900 dark:bg-white" />
              <div>
                <h4 className="text-base font-bold text-stone-900 dark:text-white tracking-tight font-sans">
                  Product-Level Flash Sales & Markdowns
                </h4>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Configure direct percentage markdowns and promotional badges on individual products in{" "}
                  <strong>{myStore.name}</strong>.
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder="Filter store products..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-stone-200/90 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-medium text-stone-900 dark:text-white outline-none focus:border-stone-900 dark:focus:border-white transition-colors"
              />
            </div>
          </div>

          <div className="divide-y divide-stone-200/70 dark:divide-slate-800 border border-stone-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                No matching products found in your store catalog.
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isEditing = editingProductId === product.id;
                const hasPromo = Boolean(product.discountEnabled && product.discountPercent);
                const discountedPrice = hasPromo
                  ? Math.round(product.price * (1 - (product.discountPercent || 0) / 100))
                  : product.price;

                return (
                  <div
                    key={product.id}
                    className="p-4 hover:bg-stone-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={product.imageUrl || product.images?.[0]}
                          alt={product.name}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-200 dark:border-slate-700 shrink-0 bg-stone-100"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-sm text-stone-900 dark:text-white truncate">
                              {product.name}
                            </h5>
                            {hasPromo && (
                              <span className="bg-stone-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md">
                                {product.promotionText || "SALE"} -{product.discountPercent}%
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            {hasPromo ? (
                              <>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {discountedPrice.toLocaleString()} DZD
                                </span>
                                <span className="font-mono text-stone-400 line-through text-[11px]">
                                  {product.price.toLocaleString()} DZD
                                </span>
                                {product.discountEndDate && (
                                  <span className="text-[11px] text-stone-400 font-mono">
                                    • Ends {product.discountEndDate}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="font-mono text-stone-600 dark:text-slate-400">
                                {product.price.toLocaleString()} DZD
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isEditing ? (
                          <button
                            type="button"
                            onClick={() => openProductPromoEditor(product)}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 text-white hover:brightness-110 shadow-2xs cursor-pointer"
                            style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>{hasPromo ? "Edit Flash Sale" : "Set Flash Sale"}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingProductId(null)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-slate-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Flash Sale Editor */}
                    {isEditing && (
                      <div className="mt-4 pt-4 border-t border-stone-200/70 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950/60 p-4 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={prodDiscountEnabled}
                              onChange={(e) => setProdDiscountEnabled(e.target.checked)}
                              className="w-4 h-4 rounded border-stone-300 accent-stone-900"
                            />
                            <span className="text-xs font-bold text-stone-900 dark:text-white">
                              Enable Promotional Discount on "{product.name}"
                            </span>
                          </label>
                          {prodDiscountEnabled && (
                            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              New Price:{" "}
                              {Math.round(
                                product.price * (1 - (Number(prodDiscountPercent) || 0) / 100)
                              ).toLocaleString()}{" "}
                              DZD
                            </span>
                          )}
                        </div>

                        {prodDiscountEnabled && (
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                              <label className={labelClass}>Discount (%)</label>
                              <input
                                type="number"
                                min="1"
                                max="90"
                                value={prodDiscountPercent}
                                onChange={(e) => setProdDiscountPercent(e.target.value)}
                                className={`${inputClass} font-mono`}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Promo Badge Label</label>
                              <input
                                type="text"
                                value={prodPromoText}
                                onChange={(e) => setProdPromoText(e.target.value)}
                                placeholder="e.g., FLASH SALE"
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Start Date</label>
                              <input
                                type="date"
                                value={prodStartDate}
                                onChange={(e) => setProdStartDate(e.target.value)}
                                className={`${inputClass} font-mono`}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>End Date</label>
                              <input
                                type="date"
                                value={prodEndDate}
                                min={prodStartDate}
                                onChange={(e) => setProdEndDate(e.target.value)}
                                className={`${inputClass} font-mono`}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingProductId(null)}
                            className="bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 border border-stone-200 dark:border-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveProductPromo(product.id)}
                            className="hover:brightness-110 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Promotion</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default DiscountAndCouponDashboard;

