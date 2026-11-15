import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Product, MerchantStore } from "../types";
import { 
  X, 
  ShoppingCart, 
  Trash2, 
  Star, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  CreditCard,
  Plus, 
  Search, 
  Store as StoreIcon, 
  SlidersHorizontal,
  Bookmark,
  Info
} from "lucide-react";
import { getOptimizedImageUrl } from "../utils/imageOptimizer";
import CompareIcon from "./CompareIcon";

interface ProductComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparedProducts: Product[];
  stores: MerchantStore[];
  wishlist: string[];
  onToggleCompare: (product: Product) => void;
  onRemove: (product: Product) => void;
  onAddToCart: (product: Product, store: MerchantStore, quantity: number) => void;
  onBuyNow?: (product: Product, store: MerchantStore, quantity: number) => void;
  currentLanguage: "ar" | "en" | "fr";
  comparisonListName?: string;
  onRenameComparisonList?: (newName: string) => void;
  onSetComparedProducts?: (products: Product[]) => void;
  onClearComparedProducts?: () => void;
  themeColor?: string;
}

export default function ProductComparisonModal({
  isOpen,
  onClose,
  comparedProducts,
  stores,
  wishlist = [],
  onToggleCompare,
  onRemove,
  onAddToCart,
  onBuyNow,
  currentLanguage,
  comparisonListName = "",
  onSetComparedProducts,
  onClearComparedProducts,
  themeColor = "#0b2447"
}: ProductComparisonModalProps) {
  const isRTL = currentLanguage === "ar";

  // --- Independent image navigation per product card ---
  const [photoIndices, setPhotoIndices] = useState<Record<string, number>>({});

  // --- Change Picks Drawer / Modal State ---
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  // --- Optional technical details toggle (hidden/collapsed by default) ---
  const [showTechnicalSpecs, setShowTechnicalSpecs] = useState(false);

  // Independent photo navigation for a specific product
  const handleNextPhoto = (productId: string, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (total <= 1) return;
    setPhotoIndices((prev) => ({
      ...prev,
      [productId]: ((prev[productId] || 0) + 1) % total,
    }));
  };

  const handlePrevPhoto = (productId: string, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (total <= 1) return;
    setPhotoIndices((prev) => ({
      ...prev,
      [productId]: ((prev[productId] || 0) - 1 + total) % total,
    }));
  };

  // Get all unique products across all stores
  const allProducts = useMemo(() => {
    return Array.from(
      new Map(
        stores.flatMap((s) => s.products || []).map((p) => [p.id || p.name, p])
      ).values()
    );
  }, [stores]);

  // Shopper's favorited or saved products (plus any products currently in comparison)
  const savedAndFavoritedProducts = useMemo(() => {
    const map = new Map<string, Product>();
    // Include products in shopper wishlist
    allProducts.forEach((product) => {
      const isWish = wishlist.includes(product.id || "") || wishlist.includes(product.name || "");
      if (isWish) {
        map.set(product.id || product.name, product);
      }
    });
    // Also include currently compared products so they are visible, checked, and can be unselected
    comparedProducts.forEach((product) => {
      map.set(product.id || product.name, product);
    });
    return Array.from(map.values());
  }, [allProducts, wishlist, comparedProducts]);

  // Extract all photos for a product (ensures multi-image gallery for every product)
  const getProductImages = (product: Product): string[] => {
    const list = [product.imageUrl, ...(product.images || [])].filter(Boolean);
    // If the product has only 1 image in data, pull alternative views from its category or store
    if (list.length <= 1) {
      const store = stores.find((s) => s.id === product.storeId);
      const categoryPeers = (store?.products || allProducts)
        .filter((p) => p.category === product.category && p.id !== product.id);
      const peerImages = categoryPeers.flatMap((p) => [p.imageUrl, ...(p.images || [])]).filter(Boolean);
      if (peerImages.length > 0) {
        list.push(...peerImages.slice(0, 3));
      }
    }
    return Array.from(new Set(list));
  };

  const getStoreForProduct = (product: Product) => {
    return stores.find((s) => s.id === product.storeId);
  };

  const getEffectivePrice = (product: Product) => {
    if (product.discountEnabled && product.discountPercent) {
      return product.price * (1 - product.discountPercent / 100);
    }
    return product.price;
  };

  // Localized short description
  const getShortDescription = (product: Product): string => {
    if (currentLanguage === "ar" && product.description_ar) return product.description_ar;
    if (currentLanguage === "fr" && product.description_fr) return product.description_fr;
    if (product.description_en) return product.description_en;
    if (product.description) return product.description;
    return "Authentic Algerian craftsmanship sourced directly from verified merchant workshops on UME Network.";
  };

  // Filtered picker items in the Change Comparison Picks section (only favorited/saved products)
  const filteredPickerProducts = useMemo(() => {
    if (!pickerSearch.trim()) return savedAndFavoritedProducts;
    const q = pickerSearch.toLowerCase();
    return savedAndFavoritedProducts.filter((p) => {
      const store = stores.find((s) => s.id === p.storeId);
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (store && store.name.toLowerCase().includes(q))
      );
    });
  }, [savedAndFavoritedProducts, pickerSearch, stores]);

  // All unique spec keys for the optional collapsible table
  const allSpecKeys = useMemo(() => {
    return Array.from(
      new Set(
        comparedProducts.flatMap((p) => p.specifications?.map((s) => s.key) || [])
      )
    );
  }, [comparedProducts]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-110 flex items-center justify-center p-3 sm:p-5 overflow-hidden font-sans select-none">
        
        {/* Soft Dim Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ type: "spring", damping: 28, stiffness: 360 }}
          className="relative bg-white dark:bg-stone-900 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-stone-200/90 dark:border-white/10 overflow-hidden z-10"
        >
          {/* CLEAN, CUSTOMER-FACING HEADER (No CMP ID, No Sift text) */}
          <div className="px-5 py-4 sm:px-7 sm:py-4.5 border-b border-stone-100 dark:border-white/10 bg-white dark:bg-stone-900 flex items-center justify-between gap-4 shrink-0">
            
            {/* Title & Customer-Facing Description */}
            <div className={`flex items-center gap-3 ${isRTL ? "text-right" : "text-left"}`}>
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                style={{ 
                  backgroundColor: `color-mix(in srgb, ${themeColor} 10%, transparent)`, 
                  borderColor: `color-mix(in srgb, ${themeColor} 25%, transparent)`,
                  color: themeColor 
                }}
              >
                <CompareIcon className="w-4.5 h-4.5 stroke-[2.2px]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white tracking-tight">
                    {comparisonListName || (currentLanguage === "ar" ? "مقارنة المختارات" : "Compare Picks")}
                  </h3>
                  <span className="text-[11px] font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full">
                    {comparedProducts.length}/3
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {currentLanguage === "ar"
                    ? "قارن بين ما يصل إلى 3 منتجات من مختاراتك جنبًا إلى جنب لاتخاذ القرار الأنسب."
                    : "Compare up to 3 of your favorite picks side by side for effortless decision-making."}
                </p>
              </div>
            </div>

            {/* Right: Change Picks Button, Clear & Close */}
            <div className="flex items-center gap-2.5 shrink-0">
              
              {/* Change Picks Button */}
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer shadow-3xs border"
                style={{
                  backgroundColor: `color-mix(in srgb, ${themeColor} 10%, transparent)`,
                  borderColor: `color-mix(in srgb, ${themeColor} 25%, transparent)`,
                  color: themeColor
                }}
              >
                <Bookmark className="w-3.5 h-3.5 fill-current" />
                <span>{currentLanguage === "ar" ? "تعديل المختارات" : "Change Picks"}</span>
                {savedAndFavoritedProducts.length > 0 && (
                  <span 
                    className="w-4 h-4 rounded-full text-white text-[10px] font-mono flex items-center justify-center font-bold"
                    style={{ backgroundColor: themeColor }}
                  >
                    {savedAndFavoritedProducts.length}
                  </span>
                )}
              </button>

              {/* Clear All action (if items selected) */}
              {comparedProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (onClearComparedProducts) {
                      onClearComparedProducts();
                    } else {
                      comparedProducts.forEach((p) => onRemove(p));
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-all cursor-pointer"
                  title={currentLanguage === "ar" ? "مسح الكل" : "Clear All"}
                >
                  {currentLanguage === "ar" ? "مسح" : "Clear"}
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-white transition-all cursor-pointer border border-stone-200/70 dark:border-white/10"
                aria-label="Close"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* MAIN COMPARISON STAGE: Side-by-Side Product Cards (Up to 3) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/40 dark:bg-stone-900/40 scrollbar-thin">
            
            {/* If 0 products selected: Calm Invitation State */}
            {comparedProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 max-w-lg mx-auto space-y-4">
                <div 
                  className="w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xs"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${themeColor} 10%, transparent)`,
                    borderColor: `color-mix(in srgb, ${themeColor} 25%, transparent)`,
                    color: themeColor
                  }}
                >
                  <Bookmark className="w-7 h-7 fill-current" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white">
                    {currentLanguage === "ar" ? "لا توجد منتجات مختارة للمقارنة" : "No picks selected to compare"}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed">
                    {savedAndFavoritedProducts.length > 0
                      ? (currentLanguage === "ar"
                          ? `لديك ${savedAndFavoritedProducts.length} منتجات في قائمتك المفضلة! اختر ما يصل إلى 3 للمقارنة جنبًا إلى جنب.`
                          : `You have ${savedAndFavoritedProducts.length} items saved in your favorites! Choose up to 3 to compare side by side.`)
                      : (currentLanguage === "ar"
                          ? "أثناء تصفح المتجر، احفظ المنتجات في المفضلة لإضافتها إلى مختاراتك، ثم افتح مقارنة المختارات."
                          : "While browsing, favorite products to add them to your comparison picks, then review them here.")}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPickerOpen(true);
                    }}
                    className="px-4 py-2 text-white rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-98 cursor-pointer flex items-center gap-1.5"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{currentLanguage === "ar" ? "اختيار من المفضلة" : "Select Comparison Picks"}</span>
                  </button>
                </div>
              </div>
            ) : (

              /* SIDE BY SIDE PRODUCT CARDS (1, 2, or 3 products) */
              <div className="space-y-6 max-w-6xl mx-auto">
                <div className={`grid gap-5 items-stretch ${
                  comparedProducts.length === 1 ? "grid-cols-1 max-w-sm mx-auto" :
                  comparedProducts.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto" : 
                  "grid-cols-1 md:grid-cols-3"
                }`}>
                  {comparedProducts.map((product) => {
                    const store = getStoreForProduct(product);
                    const effPrice = getEffectivePrice(product);
                    const hasDiscount = product.discountEnabled && product.discountPercent;
                    const photos = getProductImages(product);
                    const currentPhotoIdx = photoIndices[product.id] || 0;
                    const activePhoto = photos[currentPhotoIdx] || product.imageUrl;
                    const shortDesc = getShortDescription(product);

                    return (
                      <div
                        key={product.id || product.name}
                        className="bg-white dark:bg-stone-800/90 border border-stone-200/80 dark:border-white/10 rounded-2xl p-4.5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all text-left relative group"
                      >
                        {/* Remove from comparison button */}
                        <button
                          type="button"
                          onClick={() => onRemove(product)}
                          className="absolute top-3.5 right-3.5 z-20 w-7 h-7 rounded-full bg-white/95 dark:bg-stone-800/95 border border-stone-200/80 dark:border-white/10 text-stone-400 hover:text-rose-600 hover:border-rose-200 shadow-3xs flex items-center justify-center transition-all cursor-pointer"
                          title={currentLanguage === "ar" ? "إزالة" : "Remove"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-3.5">
                          {/* CLEAN TRANSPARENT IMAGE AREA WITH INDEPENDENT NAVIGATION AND SUBTLE SHADOW */}
                          <div className="relative w-full aspect-square sm:aspect-4/3 flex items-center justify-center p-2 bg-transparent select-none">
                            
                            {/* Product Image with Subtle Professional Shadow (No heavy black frame!) */}
                            <img
                              src={getOptimizedImageUrl(activePhoto, false)}
                              alt={product.name}
                              className="max-h-full max-w-full object-contain rounded-xl shadow-md transition-transform duration-300 group-hover:scale-[1.02]"
                              referrerPolicy="no-referrer"
                            />

                            {/* Independent Left & Right Navigation Arrows for this product */}
                            {photos.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handlePrevPhoto(product.id, photos.length, e)}
                                  className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/95 dark:bg-stone-800/95 text-stone-700 dark:text-stone-200 shadow-md flex items-center justify-center transition-all opacity-85 hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer z-10 border border-stone-200/80 dark:border-white/10"
                                  title={currentLanguage === "ar" ? "الصورة السابقة" : "Previous photo"}
                                >
                                  <ChevronLeft className="w-4 h-4 stroke-[2.5px]" />
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={(e) => handleNextPhoto(product.id, photos.length, e)}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/95 dark:bg-stone-800/95 text-stone-700 dark:text-stone-200 shadow-md flex items-center justify-center transition-all opacity-85 hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer z-10 border border-stone-200/80 dark:border-white/10"
                                  title={currentLanguage === "ar" ? "الصورة التالية" : "Next photo"}
                                >
                                  <ChevronRight className="w-4 h-4 stroke-[2.5px]" />
                                </button>

                                {/* Photo Dots Indicator */}
                                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full">
                                  {photos.map((_, pIdx) => (
                                    <span
                                      key={pIdx}
                                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                                        pIdx === currentPhotoIdx ? "bg-white scale-125" : "bg-white/45"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}

                            {/* Discount Tag */}
                            {hasDiscount && (
                              <span className="absolute top-2 left-2 bg-rose-600 text-white font-mono font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-3xs">
                                -{product.discountPercent}%
                              </span>
                            )}
                          </div>

                          {/* NAME & STORE */}
                          <div>
                            <h4 className="text-sm sm:text-[15px] font-black text-stone-900 dark:text-white leading-snug line-clamp-2">
                              {product.name}
                            </h4>

                            {store && (
                              <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500 dark:text-stone-400">
                                <StoreIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="font-semibold text-stone-600 dark:text-stone-300 truncate max-w-[160px]">
                                  {store.name}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* RATING */}
                          <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300">
                            <div className="flex items-center gap-0.5 text-amber-500 font-bold font-mono">
                              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                              <span>{product.rating ? product.rating.toFixed(1) : "5.0"}</span>
                            </div>
                            <span className="text-[11px] text-stone-450 dark:text-stone-400">
                              ({product.reviews?.length || 1} {currentLanguage === "ar" ? "تقييم" : "reviews"})
                            </span>
                          </div>

                          {/* PRICE & DISCOUNT */}
                          <div className="flex items-baseline gap-2 pt-1 border-t border-stone-100 dark:border-white/5">
                            <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
                              {effPrice.toLocaleString()} DA
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-stone-450 line-through font-mono">
                                {product.price.toLocaleString()} DA
                              </span>
                            )}
                          </div>

                          {/* SHORT DESCRIPTION */}
                          <div className="bg-stone-50/80 dark:bg-stone-800/60 p-2.5 rounded-xl border border-stone-150 dark:border-white/5">
                            <p className="text-[11.5px] text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-3">
                              {shortDesc}
                            </p>
                          </div>

                          {/* STOCK STATUS (Clean indicator) */}
                          <div className="text-[11px] font-semibold">
                            {product.stock > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 stroke-[2.5px]" />
                                <span>{currentLanguage === "ar" ? `متوفر في المخزن (${product.stock})` : `In Stock (${product.stock} left)`}</span>
                              </span>
                            ) : (
                              <span className="text-rose-500 font-semibold">
                                {currentLanguage === "ar" ? "نفذت الكمية" : "Out of Stock"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* REDESIGNED ACTION BUTTONS: Matches yUME Product Sale button style */}
                        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-white/10 flex flex-col gap-2.5">
                          
                          {/* 1. Add to Cart: Outlined with 2px theme border */}
                          <button
                            type="button"
                            onClick={() => {
                              if (store && product.stock > 0) {
                                onAddToCart(product, store, 1);
                              }
                            }}
                            disabled={product.stock <= 0}
                            className="w-full py-2.5 px-4 rounded-xl border-2 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-3xs hover:shadow-xs group"
                            style={{
                              borderColor: themeColor,
                              color: themeColor,
                              backgroundColor: "transparent",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${themeColor} 8%, transparent)`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <ShoppingCart className="w-4 h-4 transition-transform group-hover:scale-110" />
                            <span>{currentLanguage === "ar" ? "إضافة إلى السلة" : "Add to Cart"}</span>
                          </button>

                          {/* 2. Buy Now: Solid theme background with CreditCard icon */}
                          <button
                            type="button"
                            onClick={() => {
                              if (store && product.stock > 0) {
                                if (onBuyNow) {
                                  onBuyNow(product, store, 1);
                                } else {
                                  onAddToCart(product, store, 1);
                                }
                              }
                            }}
                            disabled={product.stock <= 0}
                            className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 group"
                            style={{
                              backgroundColor: themeColor,
                              borderColor: themeColor,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.filter = "brightness(0.92)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.filter = "none";
                            }}
                          >
                            <CreditCard className="w-4 h-4 transition-transform group-hover:scale-110 text-white" />
                            <span>{currentLanguage === "ar" ? "شراء الآن" : "Buy Now"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty Slot Placeholder (if fewer than 3 products selected) */}
                  {comparedProducts.length < 3 && (
                    <div
                      onClick={() => setIsPickerOpen(true)}
                      className="border-2 border-dashed border-stone-200 dark:border-white/10 hover:border-amber-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:bg-white dark:hover:bg-stone-800/40 group min-h-[380px]"
                    >
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-all mb-3 shadow-3xs"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${themeColor} 10%, transparent)`,
                          color: themeColor
                        }}
                      >
                        <Plus className="w-5 h-5 stroke-[2.5px]" />
                      </div>
                      <h5 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                        {currentLanguage === "ar" ? "+ أضف منتجًا آخر للمقارنة" : "+ Add another pick"}
                      </h5>
                      <p className="text-xs text-stone-450 dark:text-stone-400 mt-1 max-w-[180px]">
                        {currentLanguage === "ar" ? "اختر من قائمتك المفضلة للمقارنة جنبًا إلى جنب" : "Select from your favorites to compare side by side"}
                      </p>
                    </div>
                  )}
                </div>

                {/* OPTIONAL TECHNICAL SPECS ACCORDION (COLLAPSED BY DEFAULT) */}
                {allSpecKeys.length > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTechnicalSpecs(!showTechnicalSpecs)}
                      className="mx-auto flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white transition-colors cursor-pointer py-1.5 px-3 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>
                        {showTechnicalSpecs
                          ? (currentLanguage === "ar" ? "إخفاء التفاصيل الفنية الإضافية" : "Hide technical details")
                          : (currentLanguage === "ar" ? "عرض التفاصيل الفنية الإضافية" : "Show technical details")}
                      </span>
                      {showTechnicalSpecs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <AnimatePresence>
                      {showTechnicalSpecs && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mt-3"
                        >
                          <div className="border border-stone-200 dark:border-white/10 bg-white dark:bg-stone-800 rounded-2xl divide-y divide-stone-100 dark:divide-white/5 text-xs">
                            {allSpecKeys.map((key) => (
                              <div key={key} className="grid grid-cols-12 items-center p-3">
                                <div className="col-span-3 font-semibold text-stone-500 dark:text-stone-400 text-[11px] truncate">
                                  {key}
                                </div>
                                <div className="col-span-9 grid gap-3" style={{ gridTemplateColumns: `repeat(${comparedProducts.length}, minmax(0, 1fr))` }}>
                                  {comparedProducts.map((p) => {
                                    const spec = p.specifications?.find((s) => s.key === key);
                                    return (
                                      <div key={p.id} className="font-bold text-stone-800 dark:text-stone-200 truncate">
                                        {spec ? spec.value : "—"}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* REDESIGNED CHANGE PICKS MODAL: Matches UME Visual Identity */}
        <AnimatePresence>
          {isPickerOpen && (
            <div className="fixed inset-0 z-120 flex items-center justify-center p-3 sm:p-5">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPickerOpen(false)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ type: "spring", damping: 28, stiffness: 360 }}
                className="relative bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-white/10 rounded-3xl p-5 w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl z-10 text-left space-y-3.5"
              >
                {/* Header with Title & Counter Badge */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `color-mix(in srgb, ${themeColor} 12%, transparent)`, color: themeColor }}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-stone-900 dark:text-white leading-tight">
                        {currentLanguage === "ar" ? "تعديل واختيار المنتجات للمقارنة" : "Change Comparison Picks"}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Counter Badge */}
                    <span 
                      className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border transition-all"
                      style={{
                        backgroundColor: comparedProducts.length === 3 ? `color-mix(in srgb, ${themeColor} 15%, transparent)` : `color-mix(in srgb, ${themeColor} 8%, transparent)`,
                        borderColor: comparedProducts.length === 3 ? themeColor : `color-mix(in srgb, ${themeColor} 25%, transparent)`,
                        color: themeColor
                      }}
                    >
                      {comparedProducts.length}/3 {currentLanguage === "ar" ? "مختارة" : currentLanguage === "fr" ? "Sélectionnés" : "Selected"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(false)}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Maximum 3 Products Note Banner */}
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/40 text-amber-950 dark:text-amber-200">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-xs font-semibold leading-relaxed">
                    {currentLanguage === "ar"
                      ? "يمكنك مقارنة 3 منتجات كحد أقصى في نفس الوقت."
                      : currentLanguage === "fr"
                      ? "Vous pouvez comparer un maximum de 3 produits en même temps."
                      : "You can compare a maximum of 3 products at the same time."}
                  </p>
                </div>

                {/* Search Input for Favorited / Saved Items */}
                {savedAndFavoritedProducts.length > 2 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      placeholder={
                        currentLanguage === "ar"
                          ? "ابحث في المنتجات المفضلة أو المحفوظة..."
                          : currentLanguage === "fr"
                          ? "Rechercher dans vos favoris..."
                          : "Search favorited or saved products..."
                      }
                      className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-amber-600"
                    />
                  </div>
                )}

                {/* Product List: Only Favorited or Saved Products */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-76 pr-1 scrollbar-thin">
                  {savedAndFavoritedProducts.length === 0 ? (
                    <div className="text-center py-10 px-4 space-y-3">
                      <div 
                        className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${themeColor} 10%, transparent)`,
                          borderColor: `color-mix(in srgb, ${themeColor} 25%, transparent)`,
                          color: themeColor
                        }}
                      >
                        <Bookmark className="w-6 h-6 fill-current" />
                      </div>
                      <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        {currentLanguage === "ar" ? "لا توجد منتجات مفضلة أو محفوظة بعد" : "No favorited or saved products yet"}
                      </h5>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
                        {currentLanguage === "ar"
                          ? "انقر على رمز الإعجاب أو النجمة لأي منتج أثناء التصفح لإضافته إلى مختارات المقارنة."
                          : "Favorite products while browsing to view and compare them here."}
                      </p>
                    </div>
                  ) : filteredPickerProducts.length === 0 ? (
                    <div className="text-center py-8 text-xs text-stone-400">
                      {currentLanguage === "ar" ? "لم يتم العثور على منتجات مطابقة للبحث." : "No matching products found."}
                    </div>
                  ) : (
                    filteredPickerProducts.map((p) => {
                      const isCompared = comparedProducts.some((cp) => (cp.id && cp.id === p.id) || cp.name === p.name);
                      const isMaxReached = comparedProducts.length >= 3 && !isCompared;
                      const store = getStoreForProduct(p);
                      const price = getEffectivePrice(p);
                      const hasDiscount = p.discountEnabled && p.discountPercent;

                      return (
                        <div
                          key={p.id || p.name}
                          onClick={() => {
                            if (isCompared) {
                              onToggleCompare(p);
                            } else {
                              if (isMaxReached) {
                                // Prevent selecting more than 3
                                return;
                              }
                              onToggleCompare(p);
                            }
                          }}
                          className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all select-none ${
                            isCompared
                              ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 shadow-3xs cursor-pointer"
                              : isMaxReached
                              ? "bg-stone-50/80 dark:bg-stone-900/40 border-stone-150 dark:border-white/5 opacity-55 cursor-not-allowed"
                              : "bg-white dark:bg-stone-800/80 border-stone-200/80 dark:border-white/10 hover:border-amber-400 hover:shadow-3xs cursor-pointer"
                          }`}
                          title={isMaxReached ? "You can compare a maximum of 3 products at the same time." : undefined}
                        >
                          {/* Checkbox for selection */}
                          <div className="shrink-0 pl-0.5">
                            <div 
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                isCompared
                                  ? "text-white shadow-3xs"
                                  : isMaxReached
                                  ? "bg-stone-150 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-transparent"
                                  : "bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-transparent hover:border-amber-500"
                              }`}
                              style={isCompared ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                            >
                              {isCompared && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                            </div>
                          </div>

                          {/* Product Image */}
                          <img
                            src={getOptimizedImageUrl(p.imageUrl, true)}
                            alt={p.name}
                            className="w-11 h-11 object-contain rounded-xl bg-stone-50 dark:bg-stone-850 p-1 border border-stone-150 dark:border-white/10 shrink-0"
                            referrerPolicy="no-referrer"
                          />

                          {/* Product Name & Store */}
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                              {p.name}
                            </h5>
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 truncate flex items-center gap-1">
                              <StoreIcon className="w-3 h-3 text-stone-400 shrink-0" />
                              <span>{store?.name || "UME Verified Store"}</span>
                            </p>
                          </div>

                          {/* Price */}
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                              {price.toLocaleString()} DA
                            </span>
                            {hasDiscount && (
                              <p className="text-[10px] text-stone-400 line-through font-mono">
                                {p.price.toLocaleString()} DA
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer with Counter and UME-styled Done button */}
                <div className="pt-2 border-t border-stone-100 dark:border-white/10 flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-stone-500 dark:text-stone-400">
                    {comparedProducts.length}/3 {currentLanguage === "ar" ? "مختارة" : currentLanguage === "fr" ? "Sélectionnés" : "Selected"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(false)}
                    className="px-5 py-2 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-98"
                    style={{ backgroundColor: themeColor }}
                  >
                    {currentLanguage === "ar" ? "حفظ وتم" : "Done"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AnimatePresence>
  );
}
