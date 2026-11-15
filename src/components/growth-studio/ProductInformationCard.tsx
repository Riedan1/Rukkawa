import React, { useState } from "react";
import { 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  Clock, 
  Check, 
  ChevronRight, 
  Sparkles, 
  AlertCircle,
  Star,
  Package,
  Store,
  Layers,
  CheckCircle2,
  ChevronDown,
  Info
} from "lucide-react";
import { Product } from "../../types";

export type ProductCardDisplayMode = 
  | "compact" 
  | "standard" 
  | "detailed" 
  | "sticky" 
  | "mobile_bottom";

export interface ProductCardVisibleFields {
  image: boolean;
  title: boolean;
  shortDescription: boolean;
  price: boolean;
  originalPrice: boolean;
  discount: boolean;
  variants: boolean;
  colorSelection: boolean;
  sizeSelection: boolean;
  quantitySelector: boolean;
  stockInfo: boolean;
  shippingInfo: boolean;
  deliveryEstimate: boolean;
  storeBranding: boolean;
  trustBadges: boolean;
  primaryCta: boolean;
}

export const DEFAULT_PRODUCT_CARD_FIELDS: ProductCardVisibleFields = {
  image: true,
  title: true,
  shortDescription: true,
  price: true,
  originalPrice: true,
  discount: true,
  variants: true,
  colorSelection: true,
  sizeSelection: true,
  quantitySelector: true,
  stockInfo: true,
  shippingInfo: true,
  deliveryEstimate: true,
  storeBranding: true,
  trustBadges: true,
  primaryCta: true
};

interface ProductInformationCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    imageUrl: string;
    description?: string;
    category?: string;
    sku?: string;
    stock?: number;
    shippingCost?: number;
    colors?: { name: string; hex: string }[];
    sizes?: string[];
    variants?: any[];
  };
  storeInfo?: {
    name: string;
    logo?: string;
    wilaya?: string;
    verified?: boolean;
  };
  mode?: ProductCardDisplayMode;
  visibleFields?: Partial<ProductCardVisibleFields>;
  primaryColor?: string;
  accentColor?: string;
  buttonStyle?: "pill" | "rounded" | "sharp";
  ctaText?: string;
  currency?: string;
  onOrderClick?: (selection: {
    quantity: number;
    color?: string;
    size?: string;
    totalPrice: number;
  }) => void;
  className?: string;
}

export const ProductInformationCard: React.FC<ProductInformationCardProps> = ({
  product,
  storeInfo = { name: "Yume Verified Merchant", verified: true },
  mode = "standard",
  visibleFields = DEFAULT_PRODUCT_CARD_FIELDS,
  primaryColor = "#4f46e5",
  accentColor = "#06b6d4",
  buttonStyle = "rounded",
  ctaText = "Claim Offer - Cash on Delivery",
  currency = "DA",
  onOrderClick,
  className = ""
}) => {
  const fields = { ...DEFAULT_PRODUCT_CARD_FIELDS, ...visibleFields };

  // Local interaction states
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors?.[0]?.name || "Standard"
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes?.[0] || "Standard"
  );

  const price = product.price || 4900;
  const originalPrice = product.originalPrice || Math.round(price * 1.35);
  const discountPercent = originalPrice > price 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : 0;
  const totalPrice = price * quantity;

  const handleAction = () => {
    if (onOrderClick) {
      onOrderClick({
        quantity,
        color: selectedColor,
        size: selectedSize,
        totalPrice
      });
    }
  };

  const getButtonRadius = () => {
    switch (buttonStyle) {
      case "pill": return "rounded-full";
      case "sharp": return "rounded-none";
      default: return "rounded-xl";
    }
  };

  // 1. STICKY TOP/BOTTOM BAR MODE
  if (mode === "sticky" || mode === "mobile_bottom") {
    return (
      <div 
        id="growth-product-sticky-card"
        className={`fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl transition-all ${className}`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {fields.image && (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="min-w-0 flex-1">
              {fields.title && (
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {product.name}
                </h4>
              )}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-xs sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {price.toLocaleString()} {currency}
                </span>
                {fields.originalPrice && originalPrice > price && (
                  <span className="text-[10px] sm:text-xs text-slate-400 line-through font-mono hidden xs:inline">
                    {originalPrice.toLocaleString()} {currency}
                  </span>
                )}
                {fields.discount && discountPercent > 0 && (
                  <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    -{discountPercent}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {fields.quantitySelector && (
              <div className="hidden sm:flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleAction}
              style={{ backgroundColor: primaryColor }}
              className={`px-3 sm:px-6 py-2.5 sm:py-3 text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-[48px] ${getButtonRadius()}`}
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate max-w-[140px] sm:max-w-none">{ctaText}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. COMPACT MODE
  if (mode === "compact") {
    return (
      <div 
        id="growth-product-compact-card"
        className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all ${className}`}
      >
        <div className="flex items-start gap-3">
          {fields.image && (
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="flex-1 min-w-0">
            {fields.storeBranding && storeInfo && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {storeInfo.name}
              </span>
            )}
            {fields.title && (
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {product.name}
              </h3>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                {price.toLocaleString()} {currency}
              </span>
              {fields.originalPrice && originalPrice > price && (
                <span className="text-xs text-slate-400 line-through font-mono">
                  {originalPrice.toLocaleString()} {currency}
                </span>
              )}
            </div>
          </div>
        </div>

        {fields.primaryCta && (
          <button
            type="button"
            onClick={handleAction}
            style={{ backgroundColor: primaryColor }}
            className={`w-full mt-3 py-2.5 px-4 text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${getButtonRadius()}`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{ctaText}</span>
          </button>
        )}
      </div>
    );
  }

  // 3. STANDARD & DETAILED MODES
  const isDetailed = mode === "detailed";

  return (
    <div 
      id="growth-product-standard-card"
      className={`rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden text-left ${className}`}
    >
      {/* Top Banner / Store Header if enabled */}
      {fields.storeBranding && storeInfo && (
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {storeInfo.name}
            </span>
            {storeInfo.verified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            )}
          </div>
          <span className="text-[11px] text-slate-500">
            Verified Yume Merchant
          </span>
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-5">
        {/* Product Media & Title */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          {fields.image && (
            <div className="w-full sm:w-48 h-56 sm:h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="flex-1 space-y-2.5 min-w-0">
            {fields.title && (
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {product.name}
              </h2>
            )}

            {fields.shortDescription && product.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Price section */}
            <div className="pt-1 flex flex-wrap items-baseline gap-2 sm:gap-2.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {price.toLocaleString()} {currency}
              </span>
              {fields.originalPrice && originalPrice > price && (
                <span className="text-xs sm:text-sm text-slate-400 line-through font-mono">
                  {originalPrice.toLocaleString()} {currency}
                </span>
              )}
              {fields.discount && discountPercent > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 text-xs font-black">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            {/* Stock status */}
            {fields.stockInfo && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">In Stock & Ready for Immediate Dispatch</span>
              </div>
            )}
          </div>
        </div>

        {/* Variant Selectors (Colors & Sizes) */}
        {fields.variants && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
            {/* Color selection */}
            {fields.colorSelection && product.colors && product.colors.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Color:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {selectedColor}
                  </span>
                </label>
                {(product as any).colorVariantStyle === "photo_cards" || (product as any).colorVariantStyle === "image_cards" || (product as any).colorVariantStyle === "cards" ? (
                  /* Model 2: Photo Cards Model (Screenshot 2) */
                  <div className="flex flex-wrap gap-2.5 items-stretch">
                    {product.colors.map((c, cIdx) => {
                      const isSelected = selectedColor === c.name;
                      const swatchImg = (c as any).imageUrl || (c as any).image || ((c as any).images && (c as any).images[0]) || null;
                      const hasHot = (c as any).isHot || cIdx < 2;
                      const isValidImg = swatchImg && typeof swatchImg === "string" && (swatchImg.startsWith("http") || swatchImg.startsWith("data:") || swatchImg.startsWith("/") || swatchImg.startsWith("blob:"));
                      return (
                        <button
                          key={c.name}
                          type="button"
                          title={c.name}
                          onClick={() => setSelectedColor(c.name)}
                          className={`group relative flex flex-col rounded-lg overflow-hidden transition-all duration-200 cursor-pointer text-left bg-white dark:bg-stone-900 shrink-0 ${
                            isSelected
                              ? "border-2 border-slate-950 dark:border-white shadow-sm ring-1 ring-slate-950/20"
                              : "border border-stone-300 dark:border-stone-700 hover:border-slate-400 hover:shadow-xs"
                          }`}
                          style={{ width: "66px", minWidth: "62px" }}
                        >
                          {/* Upper photo */}
                          <div className="w-full h-16 sm:h-[68px] bg-stone-50 dark:bg-stone-850 relative overflow-hidden flex items-center justify-center">
                            {isValidImg ? (
                              <img
                                src={swatchImg}
                                alt={c.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.parentElement?.querySelector(".swatch-growth-fallback") as HTMLElement;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            {/* Clean rectangular color block (no circles) */}
                            <div
                              className={`swatch-growth-fallback w-full h-full relative ${isValidImg ? "hidden" : "flex"}`}
                              style={{ backgroundColor: c.hex }}
                            />
                          </div>
                          {/* Bottom name banner with clear, readable color writing and popularity icon */}
                          <div className="px-1 py-1.5 bg-white dark:bg-stone-900 border-t border-stone-200/90 dark:border-stone-800 flex flex-col items-center justify-center min-h-[26px] w-full text-center">
                            <div className="flex items-center justify-center gap-1 w-full px-0.5">
                              {hasHot && (
                                <span
                                  className="text-amber-500 text-[10px] shrink-0 select-none leading-none inline-flex items-center"
                                  title="Popular choice"
                                >
                                  🔥
                                </span>
                              )}
                              <span
                                className={`text-[11px] sm:text-xs truncate leading-tight ${
                                  isSelected ? "font-bold text-slate-950 dark:text-white" : "font-semibold text-slate-700 dark:text-stone-300"
                                }`}
                                title={c.name}
                              >
                                {c.name}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (product as any).colorVariantStyle === "solid_circles" ? (
                  /* Model 3: Circle Shape Model (Screenshot 3 - Clean Color Circles) */
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {product.colors.map((c) => {
                      const isSelected = selectedColor === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          title={c.name}
                          onClick={() => setSelectedColor(c.name)}
                          className={`group relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
                            isSelected
                              ? "ring-2 ring-offset-2 ring-blue-600 dark:ring-blue-400 scale-105 shadow-sm"
                              : "hover:scale-110 hover:ring-2 hover:ring-offset-1 hover:ring-slate-300"
                          }`}
                        >
                          <span 
                            className="w-full h-full rounded-full border border-black/15 shadow-inner flex items-center justify-center overflow-hidden relative" 
                            style={{ backgroundColor: c.hex }}
                          >
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 stroke-[3] text-white drop-shadow-sm" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Model 1: Variant Circle Model (Screenshot 1) */
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {product.colors.map((c, cIdx) => {
                      const isSelected = selectedColor === c.name;
                      const swatchImg = (c as any).imageUrl || (c as any).image || ((c as any).images && (c as any).images[0]) || null;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          title={c.name}
                          onClick={() => setSelectedColor(c.name)}
                          className={`group relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
                            isSelected
                              ? "ring-2 ring-offset-2 ring-blue-600 dark:ring-blue-400 scale-105 shadow-sm"
                              : "hover:scale-110 hover:ring-2 hover:ring-offset-1 hover:ring-slate-300"
                          }`}
                        >
                          <span 
                            className="w-full h-full rounded-full border border-black/15 shadow-inner flex items-center justify-center overflow-hidden relative bg-stone-100" 
                            style={{ backgroundColor: swatchImg ? undefined : c.hex }}
                          >
                            {swatchImg ? (
                              <img src={swatchImg} alt={c.name} className="w-full h-full object-cover rounded-full pointer-events-none" />
                            ) : null}
                            {isSelected && swatchImg && (
                              <span className="absolute inset-0 bg-blue-600/30 backdrop-blur-[0.5px]" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Size selection */}
            {fields.sizeSelection && product.sizes && product.sizes.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Size / Dimension:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {selectedSize}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedSize === s
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shadow-xs"
                          : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            {fields.quantitySelector && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Quantity:
                </span>
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed mode extra specs */}
        {isDetailed && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-slate-900 dark:text-white block">
              Specifications & Logistics
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
              <div>
                <span className="text-slate-400 block text-[10px]">SKU:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {product.sku || "YM-GR-2026"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Category:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {product.category || "General"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Shipping & Trust badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {fields.shippingInfo && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5 text-xs">
              <Truck className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {currency === "DA" ? "Express 58 Wilayas" : "Express Doorstep Delivery"}
                </span>
                <span className="text-[10px] text-slate-500">
                  {currency === "DA" ? "Doorstep delivery in 24-48 hours" : "Fast tracked delivery in 24-48 hours"}
                </span>
              </div>
            </div>
          )}

          {fields.trustBadges && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Inspect Before Payment
                </span>
                <span className="text-[10px] text-slate-500">
                  100% Cash-on-Delivery Guarantee
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        {fields.primaryCta && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAction}
              style={{ backgroundColor: primaryColor }}
              className={`w-full py-4 px-6 text-white font-black text-sm sm:text-base shadow-lg hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2 ${getButtonRadius()}`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{ctaText} — {totalPrice.toLocaleString()} {currency}</span>
            </button>
            <span className="text-[11px] text-slate-400 text-center block mt-2">
              No prepayment required • Free cancellation upon delivery
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
