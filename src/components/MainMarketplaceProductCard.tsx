import React, { useState } from "react";
import { Product, MerchantStore, Subcategory, MainCategory } from "../types";
import { Star, ShoppingBag, Check } from "lucide-react";
import { BookmarkStar } from "./BookmarkStar";
import { getCategoryName } from "../utils/categoriesStore";
import { Language } from "../translations";
import { countryCurrencyMapping, convertCurrency } from "../currency";
import { motion, AnimatePresence } from "motion/react";
import { getProductBasePrice } from "../utils/wizardLogic";

export interface MainMarketplaceProductCardProps {
  key?: any;
  product: Product;
  store: MerchantStore;
  wishlist: string[];
  handleToggleWishlist: (idOrName: string) => void;
  setSelectedProduct: (product: Product | null) => void;
  setSelectedStore?: (store: MerchantStore) => void;
  handleAddToCart: (product: Product, store: MerchantStore) => void;
  getOptimizedImageUrl: (url: string, isMobile: boolean) => string;
  subcategories?: Subcategory[];
  mainCategories?: MainCategory[];
  currentLanguage: Language;
  currentSlideColor?: string;
  isMobileViewport?: boolean;
  comparedProducts?: Product[];
  onToggleCompare?: (product: Product) => void;
}

export default function MainMarketplaceProductCard({
  product,
  store,
  wishlist,
  handleToggleWishlist,
  setSelectedProduct,
  setSelectedStore,
  handleAddToCart,
  getOptimizedImageUrl,
  subcategories = [],
  mainCategories = [],
  currentLanguage = "en",
  currentSlideColor = "#0f172a",
  isMobileViewport = false,
  comparedProducts = [],
  onToggleCompare,
}: MainMarketplaceProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const isWish = wishlist.includes(product.id || product.name);
  const isCompared = comparedProducts.some((p) => p.id === product.id);

  const ratingVal = product.rating || 4.8;
  const isDiscountEnabled = !!product.discountEnabled;
  const discountPercent = product.discountPercent ?? 15;
  const originalPrice = getProductBasePrice(product);
  const currentPrice = isDiscountEnabled
    ? Math.round(originalPrice * (1 - discountPercent / 100))
    : originalPrice;

  // Currency computation
  const country = typeof window !== "undefined" ? localStorage.getItem("dz_country") || "Algeria" : "Algeria";
  const targetConfig = countryCurrencyMapping[country] || countryCurrencyMapping["Algeria"];
  const targetCurrency = targetConfig.currency;
  const mCurrency = store.currency || "DZD";
  const isConverted = mCurrency !== targetCurrency;
  const convertedAmount = isConverted ? convertCurrency(currentPrice, mCurrency, targetCurrency) : currentPrice;
  const formattedPrice = Math.round(convertedAmount).toLocaleString();
  const currencySymbol = targetCurrency === "DZD" ? "DA" : (targetConfig.symbol || "$");

  const categoryLabel = getCategoryName(product.category, subcategories, mainCategories, currentLanguage) || product.category || "Artisanat";

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (setSelectedStore) {
      setSelectedStore(store);
    }
    setSelectedProduct(product);
  };

  const onQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 900);
    handleAddToCart(product, store);
  };

  return (
    <div
      id={`main-prod-card-${product.id}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200/80 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 shadow-2xs hover:shadow-md transition-all duration-200 relative flex flex-col justify-between overflow-hidden group cursor-pointer select-none pb-2.5 hover:-translate-y-0.5 text-left w-full"
      title={product.name}
    >
      {/* Top: Aspect-Square Image Box (matching first screenshot) */}
      <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 relative shrink-0 select-none">
        <img
          src={getOptimizedImageUrl(product.imageUrl, isMobileViewport)}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover pointer-events-none select-none group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Store attribution chip/badge on top-left */}
        {store && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (setSelectedStore) setSelectedStore(store);
            }}
            className="absolute top-2 left-2 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-black/5 dark:border-white/10 shadow-2xs z-10 max-w-[80%] hover:scale-105 transition-transform"
            title={store.name}
          >
            <div className="w-3.5 h-3.5 rounded-full overflow-hidden bg-stone-100 shrink-0 flex items-center justify-center">
              {store.logo ? (
                <img
                  src={store.logo}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[7px] font-black text-slate-600 uppercase leading-none">
                  {store.name?.charAt(0) || "S"}
                </span>
              )}
            </div>
            <span className="text-[9.5px] font-bold text-slate-800 dark:text-slate-200 truncate">
              {store.name}
            </span>
          </div>
        )}

        {/* Bookmark/Wishlist toggle on top-right */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleWishlist(product.id || product.name);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-rose-600 transition-all z-10 shadow-2xs cursor-pointer hover:scale-110 active:scale-90"
          title={isWish ? (currentLanguage === "ar" ? "محفوظ في المفضلة" : "Saved in wishlist") : (currentLanguage === "ar" ? "حفظ المنتج" : "Save to wishlist")}
        >
          <BookmarkStar filled={isWish} className="w-3.5 h-3.5" />
        </button>

        {/* Discount Badge on bottom-left */}
        {isDiscountEnabled && (
          <span className="absolute bottom-2 left-2 bg-rose-600 text-white font-mono font-black text-[9px] px-1.5 py-0.5 rounded-md shadow-2xs z-10">
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Bottom Info Section (exact typography & spacing of screenshot) */}
      <div className="px-2.5 pt-2 flex flex-col gap-0.5 text-left flex-1 justify-between font-sans">
        {/* Title & Rating row */}
        <div>
          <div className="flex justify-between items-start gap-1">
            <h5 className="text-[11.5px] sm:text-[12.5px] font-bold text-slate-900 dark:text-white line-clamp-1 flex-1 leading-snug group-hover:text-amber-600 transition-colors">
              {product.name}
            </h5>
            <div className="flex items-center gap-0.5 text-[10.5px] font-bold text-slate-800 dark:text-slate-200 shrink-0 ml-1">
              <Star className="w-2.5 h-2.5 text-slate-900 fill-slate-900 dark:text-amber-400 dark:fill-amber-400" />
              <span>{ratingVal.toFixed(1)}</span>
            </div>
          </div>

          {/* Subtitle / Category & Location */}
          <div className="text-[10px] text-stone-500 dark:text-slate-400 font-medium leading-none mt-1 flex items-center gap-1 truncate">
            <span>{categoryLabel}</span>
            {store?.wilaya && (
              <>
                <span className="text-stone-300 dark:text-slate-600">•</span>
                <span className="truncate">{store.wilaya}</span>
              </>
            )}
          </div>
        </div>

        {/* Price & Quick Cart row */}
        <div className="text-[11px] sm:text-[12px] text-slate-900 dark:text-white leading-none flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="font-extrabold text-[#222222] dark:text-white">
              {formattedPrice} {currencySymbol}
            </span>
            <span className="text-stone-500 dark:text-slate-400 text-[10px]">
              {" "}
              {currentLanguage === "ar" ? "إجمالي" : "total"}
            </span>
          </div>

          {/* Quick Add to Cart button */}
          <button
            type="button"
            onClick={onQuickAdd}
            style={{
              backgroundColor: isAdded ? "rgb(16, 185, 129)" : undefined,
            }}
            className={`p-1.5 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer shrink-0 shadow-2xs ${
              isAdded
                ? "bg-emerald-500 text-white scale-110 opacity-100 pointer-events-auto"
                : "bg-slate-900 hover:bg-rose-500 text-white hover:scale-110 active:scale-95 opacity-100 pointer-events-auto lg:opacity-0 lg:pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto"
            }`}
            title={currentLanguage === "ar" ? "إضافة إلى السلة" : "Add to Cart"}
          >
            <AnimatePresence mode="wait">
              {isAdded ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </motion.div>
              ) : (
                <ShoppingBag className="w-3 h-3" />
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </div>
  );
}
