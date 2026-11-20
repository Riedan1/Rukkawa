import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  Store, ChevronRight, ChevronLeft, Sparkles, Clock, 
  ExternalLink, ArrowRight, ShieldCheck, Tag, Eye, MousePointerClick
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StorefrontAd, Product } from "../types";
import { isLightColor } from "../utils/brandIdentityColorSystem";

interface StorefrontAdCarouselProps {
  ads?: StorefrontAd[];
  storeId?: string;
  storeName?: string;
  storeProducts?: Product[];
  currentSlideColor?: string;
  autoRotateInterval?: number; // in milliseconds (default 6000)
  onSelectProduct?: (product: Product) => void;
  onVisitStore?: (storeId: string) => void;
  onAdClick?: (ad: StorefrontAd, ctaType: "primary" | "secondary" | "card") => void;
  onAdImpression?: (ad: StorefrontAd) => void;
  adCountdown?: { hours: number; minutes: number; seconds: number };
  adBannerTitle?: string;
  adBannerDescription?: string;
}

export const StorefrontAdCarousel: React.FC<StorefrontAdCarouselProps> = ({
  ads: providedAds,
  storeId = "store_1",
  storeName = "Store",
  storeProducts = [],
  currentSlideColor = "#4a0e2e",
  autoRotateInterval = 6000,
  onSelectProduct,
  onVisitStore,
  onAdClick,
  onAdImpression,
  adCountdown: providedCountdown,
  adBannerTitle,
  adBannerDescription
}) => {
  // Built-in default ads if none provided or store has custom settings
  const defaultAds = useMemo<StorefrontAd[]>(() => {
    // Select top 3 products sorted by rating to display showcase cards
    const bestProds = [...storeProducts]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);

    const rotations = [
      "-rotate-12 translate-y-1.5 hover:rotate-0 hover:z-20",
      "-rotate-3 -translate-y-1 hover:rotate-0 hover:z-20",
      "rotate-12 translate-y-1.5 hover:rotate-0 hover:z-20"
    ];

    const fallbackProds = [
      {
        name: "Tapis Berbère 'Beni Yenni'",
        img: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=200&auto=format&fit=crop&q=80",
        rotation: rotations[0],
        originalProduct: null
      },
      {
        name: "Collier Kabyle Royal 'Tasfift'",
        img: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&auto=format&fit=crop&q=80",
        rotation: rotations[1],
        originalProduct: null
      },
      {
        name: "Miel d'Oranger Pur de Blida",
        img: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&auto=format&fit=crop&q=80",
        rotation: rotations[2],
        originalProduct: null
      }
    ];

    const mappedProducts = bestProds.length > 0 
      ? bestProds.map((p, idx) => ({
          name: p.name,
          img: p.imageUrl,
          price: p.price,
          productId: p.id,
          rotation: rotations[idx % rotations.length],
          originalProduct: p
        }))
      : fallbackProds;

    return [
      {
        id: `ad_${storeId}_1`,
        storeId: storeId,
        title: adBannerTitle || "Algeria Direct Heritage",
        shortDescription: adBannerDescription || "Direct local delivery of rare Berber rugs & fine crafts. Save 15% off today!",
        badge: "Elite Partner",
        sponsorText: "Sponsored",
        ctaText: "Visit Store",
        destinationLink: `#store-${storeId}`,
        secondaryCtaText: "Explore Deals",
        secondaryDestinationLink: "#partner-shops-list",
        productImages: mappedProducts,
        bgColor: currentSlideColor,
        accentColor: "#fbbf24", // amber
        priority: 10,
        clickCount: 0,
        impressionCount: 0,
        isActive: true
      },
      {
        id: `ad_${storeId}_2`,
        storeId: storeId,
        title: "Sahara Gold & Artisan Guild",
        shortDescription: "Authentic Touareg silver filigree & hand-tanned leather. EXTRA 20% off with code SAHARA20",
        badge: "Flash Sale",
        sponsorText: "Featured Merchant",
        ctaText: "Claim 20% Off",
        destinationLink: `#store-${storeId}`,
        secondaryCtaText: "Browse Collection",
        secondaryDestinationLink: "#partner-shops-list",
        productImages: mappedProducts.length >= 2 ? [
          mappedProducts[1],
          mappedProducts[0],
          mappedProducts[2] || mappedProducts[0]
        ] : mappedProducts,
        bgColor: currentSlideColor,
        accentColor: "#f59e0b",
        priority: 8,
        clickCount: 0,
        impressionCount: 0,
        isActive: true
      },
      {
        id: `ad_${storeId}_3`,
        storeId: storeId,
        title: "58 Wilayas Express Tracked Delivery",
        shortDescription: "Guaranteed door-to-door courier shipping with Cash-on-Delivery across all Algerian regions.",
        badge: "Yume Logistics",
        sponsorText: "Official Partner",
        ctaText: "Shop Verified",
        destinationLink: `#store-${storeId}`,
        secondaryCtaText: "Shipping Rates",
        secondaryDestinationLink: "#partner-shops-list",
        productImages: mappedProducts,
        bgColor: currentSlideColor,
        accentColor: "#34d399", // emerald
        priority: 6,
        clickCount: 0,
        impressionCount: 0,
        isActive: true
      }
    ];
  }, [storeId, storeProducts, currentSlideColor]);

  // Combined ads: props or default
  const activeAds = useMemo(() => {
    const list = providedAds && providedAds.length > 0 ? providedAds : defaultAds;
    return list.filter(a => a.isActive !== false).sort((a, b) => b.priority - a.priority);
  }, [providedAds, defaultAds]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = next, -1 = prev
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fallback countdown timer if not provided via props
  const [localCountdown, setLocalCountdown] = useState({ hours: 1, minutes: 22, seconds: 26 });
  useEffect(() => {
    if (providedCountdown) return;
    const timer = setInterval(() => {
      setLocalCountdown(prev => {
        let s = prev.seconds - 1;
        let m = prev.minutes;
        let h = prev.hours;
        if (s < 0) {
          s = 59;
          m -= 1;
          if (m < 0) {
            m = 59;
            h = h > 0 ? h - 1 : 2;
          }
        }
        return { hours: h, minutes: m, seconds: s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [providedCountdown]);

  const countdown = providedCountdown || localCountdown;

  // Touch swipe handling
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);

  const currentAd = activeAds[currentIndex] || activeAds[0];

  // Automatic slide/color rotation disabled per refresh-based color system
  useEffect(() => {
    setProgress(0);
  }, [activeAds.length, autoRotateInterval, isHovered, currentIndex]);

  // Track impressions
  const trackedImpressionsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (currentAd && !trackedImpressionsRef.current.has(currentAd.id)) {
      trackedImpressionsRef.current.add(currentAd.id);
      currentAd.impressionCount = (currentAd.impressionCount || 0) + 1;
      if (onAdImpression) {
        onAdImpression(currentAd);
      }
    }
  }, [currentAd, onAdImpression]);

  const goToNext = useCallback(() => {
    setDirection(1);
    setProgress(0);
    setCurrentIndex(prev => (prev + 1) % activeAds.length);
  }, [activeAds.length]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setProgress(0);
    setCurrentIndex(prev => (prev - 1 + activeAds.length) % activeAds.length);
  }, [activeAds.length]);

  const goToIndex = useCallback((idx: number) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setProgress(0);
    setCurrentIndex(idx);
  }, [currentIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsHovered(true);
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
    }
  };

  const handleTouchEnd = () => {
    setIsHovered(false);
    if (touchStartXRef.current !== null) {
      const deltaX = touchDeltaXRef.current;
      if (deltaX < -45) {
        goToNext();
      } else if (deltaX > 45) {
        goToPrev();
      }
      touchStartXRef.current = null;
      touchDeltaXRef.current = 0;
    }
  };

  const handlePrimaryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentAd) {
      currentAd.clickCount = (currentAd.clickCount || 0) + 1;
      if (onAdClick) onAdClick(currentAd, "primary");
      if (onVisitStore) {
        onVisitStore(currentAd.storeId || storeId);
      }
    }
  };

  const handleSecondaryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentAd) {
      currentAd.clickCount = (currentAd.clickCount || 0) + 1;
      if (onAdClick) onAdClick(currentAd, "secondary");
    }
  };

  const handleProductCardClick = (prod: any) => {
    if (currentAd) {
      currentAd.clickCount = (currentAd.clickCount || 0) + 1;
      if (onAdClick) onAdClick(currentAd, "card");
    }
    if (prod.originalProduct && onSelectProduct) {
      onSelectProduct(prod.originalProduct);
    } else if (prod.productId && storeProducts.length > 0 && onSelectProduct) {
      const matched = storeProducts.find(p => p.id === prod.productId);
      if (matched) onSelectProduct(matched);
    }
  };

  // Helper for highlighting discount text or flash tags in promo description
  const renderStyledDescription = (text: string) => {
    const parts = text.split(/(\d+%\s*(?:off|OFF)|Flash Sale!|EXTRA \d+%\s*(?:off|OFF)?|Promo Code:?\s*\w+|58 Wilayas|Cash-on-Delivery)/gi);
    return parts.map((part, i) => {
      if (/(\d+%\s*(?:off|OFF)|Flash Sale!|EXTRA \d+%\s*(?:off|OFF)?|Promo Code:?\s*\w+|58 Wilayas|Cash-on-Delivery)/i.test(part)) {
        return (
          <span key={i} className={`font-extrabold drop-shadow-xs ${isLightColor(currentSlideColor || currentAd?.bgColor || "#4a0e2e") ? "text-amber-700" : "text-amber-300"}`}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (!currentAd) return null;

  const bgThemeColor = currentSlideColor || currentAd.bgColor;
  const isLightBanner = isLightColor(bgThemeColor);

  return (
    <div 
      className="relative w-full max-w-full select-none group/carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      id="yume-storefront-ad-carousel"
    >
      {/* Outer Banner Card Container with matching yume aesthetic */}
      <div 
        className={`relative overflow-hidden rounded-2xl border py-4 sm:py-5 px-4 sm:px-6 shadow-md hover:shadow-[var(--glow-shadow)] transition-all duration-300 w-full min-h-[175px] sm:min-h-[160px] flex items-center ${
          isLightBanner ? "text-slate-900" : "text-white"
        }`}
        style={{ 
          backgroundColor: bgThemeColor,
          borderColor: isLightBanner ? "rgba(15, 23, 42, 0.14)" : `color-mix(in srgb, ${bgThemeColor} 90%, black)`,
          "--glow-shadow": isLightBanner
            ? "0 20px 45px -4px rgba(15, 23, 42, 0.14)"
            : `0 20px 45px -4px color-mix(in srgb, ${bgThemeColor} 60%, transparent)`
        } as React.CSSProperties}
      >
        {/* Subtle Ambient Background Highlight Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay bg-gradient-to-r from-black/20 via-transparent to-black/30" 
        />
        <div 
          className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" 
        />

        {/* Sliding Ad Content Area */}
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={currentAd.id}
            custom={direction}
            variants={{
              enter: (dir: number) => ({
                x: dir > 0 ? 50 : -50,
                opacity: 0,
                scale: 0.99
              }),
              center: {
                x: 0,
                opacity: 1,
                scale: 1,
                transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
              },
              exit: (dir: number) => ({
                x: dir > 0 ? -50 : 50,
                opacity: 0,
                scale: 0.99,
                transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
              })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full flex flex-col lg:flex-row items-center justify-between gap-6 z-10"
          >
            {/* Left Column: Badges, Title, Description, Countdown & CTAs */}
            <div className="w-full lg:w-5/12 xl:w-4/12 flex flex-col justify-between text-left min-w-0 pr-0 lg:pr-3 shrink-0">
              <div>
                {/* Badges: Elite Partner / Sponsored / Tag */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span 
                    className={`text-[8px] font-black tracking-widest font-mono px-1.5 py-0.5 rounded border shadow-2xs ${
                      isLightBanner ? "bg-slate-900 text-white border-slate-900" : "bg-white"
                    }`}
                    style={
                      isLightBanner
                        ? undefined
                        : { 
                            color: bgThemeColor, 
                            borderColor: `color-mix(in srgb, ${bgThemeColor} 30%, transparent)` 
                          }
                    }
                  >
                    {currentAd.badge || "Elite Partner"}
                  </span>
                  <span className={`text-[8px] font-bold tracking-wider font-mono ${isLightBanner ? "text-slate-600" : "text-slate-100/90"}`}>
                    {currentAd.sponsorText || "Sponsored"}
                  </span>
                  {activeAds.length > 1 && (
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full ml-auto sm:ml-0 ${isLightBanner ? "text-slate-700 bg-slate-900/10" : "text-white/50 bg-black/20"}`}>
                      {currentIndex + 1} / {activeAds.length}
                    </span>
                  )}
                </div>

                {/* Ad Headline / Title */}
                <h5 className={`text-sm font-black tracking-tight mt-1.5 line-clamp-1 ${isLightBanner ? "text-slate-900" : "text-white"}`}>
                  {currentAd.title}
                </h5>

                {/* Promo Copy */}
                <p className={`text-[11px] md:text-[12px] font-semibold leading-tight mt-1 max-w-xs sm:max-w-md line-clamp-2 ${isLightBanner ? "text-slate-700" : "text-white/90"}`}>
                  {renderStyledDescription(currentAd.shortDescription)}
                </p>

                {/* Countdown Timer with pulsing styling */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className={`text-[9px] font-bold tracking-wider font-mono mr-1 flex items-center gap-1 ${isLightBanner ? "text-slate-600" : "text-white/80"}`}>
                    <Clock className={`w-2.5 h-2.5 ${isLightBanner ? "text-amber-600" : "text-amber-300"}`} />
                    Offer Ends In:
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold font-mono tracking-tight shadow-inner ${isLightBanner ? "bg-slate-900 text-amber-300" : "bg-black/25 text-amber-200"}`}>
                      {String(countdown.hours).padStart(2, '0')}
                    </span>
                    <span className={`text-xs font-bold opacity-70 ${isLightBanner ? "text-slate-600" : "text-slate-300"}`}>:</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold font-mono tracking-tight shadow-inner ${isLightBanner ? "bg-slate-900 text-amber-300" : "bg-black/25 text-amber-200"}`}>
                      {String(countdown.minutes).padStart(2, '0')}
                    </span>
                    <span className={`text-xs font-bold opacity-70 ${isLightBanner ? "text-slate-600" : "text-slate-300"}`}>:</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold font-mono tracking-tight animate-pulse shadow-inner ${isLightBanner ? "bg-slate-900 text-amber-300" : "bg-black/25 text-amber-200"}`}>
                      {String(countdown.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Call-to-Action Buttons */}
              <div className="mt-3.5 flex items-center gap-2.5 flex-wrap">
                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={handlePrimaryClick}
                  className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-350 active:bg-amber-500 font-extrabold text-[10.5px] px-4 py-2 rounded-full shadow-md text-slate-900 transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none tracking-wider font-sans border border-amber-300"
                >
                  <Store className="w-3.5 h-3.5 text-slate-900" />
                  <span>{currentAd.ctaText || "Visit Store"}</span>
                </button>

                {/* Secondary CTA */}
                {currentAd.secondaryCtaText && (
                  <a 
                    href={currentAd.secondaryDestinationLink || "#partner-shops-list"}
                    onClick={handleSecondaryClick}
                    className={`inline-flex items-center gap-1 font-bold text-[10px] px-3.5 py-2 rounded-full shadow-inner transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none border ${
                      isLightBanner
                        ? "bg-slate-900/[0.08] hover:bg-slate-900/[0.14] active:bg-slate-900/20 border-slate-900/15 hover:border-slate-900/25 text-slate-900"
                        : "bg-white/15 hover:bg-white/25 active:bg-white/30 border-white/20 hover:border-white/30 text-white"
                    }`}
                  >
                    <span>{currentAd.secondaryCtaText}</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Center-Right Showcase: Avant-garde Floating Glass Stage (Non-classic presentation) */}
            <div className="flex-1 w-full lg:w-7/12 xl:w-8/12 flex items-center justify-center lg:justify-center px-1 sm:px-2 py-1 mt-2 lg:mt-0">
              <div className="relative w-full max-w-xl bg-white/[0.07] dark:bg-black/25 backdrop-blur-2xl border border-white/15 rounded-[26px] p-2.5 sm:p-3 shadow-[0_16px_40px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.2)] flex items-center justify-around gap-2 sm:gap-3.5 overflow-visible">
                
                {/* Subtle Ambient Runway Spotlight Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent pointer-events-none rounded-[26px] opacity-70" />

                {(currentAd.productImages || []).slice(0, 3).map((prod, idx) => {
                  const isCenter = idx === 1;
                  return (
                    <div 
                      key={idx}
                      onClick={() => handleProductCardClick(prod)}
                      className={`relative flex-1 max-w-[140px] sm:max-w-[160px] flex flex-col items-center justify-center cursor-pointer group/item transition-all duration-300 ${
                        isCenter ? "z-10 scale-105" : "z-0 opacity-90 hover:opacity-100"
                      }`}
                      title={prod.name}
                    >
                      {/* Floating Price Pill (Suspended above the item) */}
                      {prod.price && (
                        <div className="mb-1.5 z-10 transition-transform duration-300 group-hover/item:-translate-y-1">
                          <span className="text-[8.5px] sm:text-[9.5px] font-mono font-extrabold bg-black/70 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30 shadow-[0_2px_10px_rgba(0,0,0,0.35)] backdrop-blur-md flex items-center gap-1">
                            <Tag className="w-2 h-2 text-amber-400 stroke-[2.5]" />
                            {typeof prod.price === "number" ? `${prod.price.toLocaleString()} DZD` : prod.price}
                          </span>
                        </div>
                      )}

                      {/* Translucent Floating Glass Pedestal with Free-floating Product */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-26 md:h-26 rounded-2xl bg-gradient-to-b from-white/20 via-white/10 to-black/25 backdrop-blur-xl border border-white/25 shadow-[0_10px_25px_rgba(0,0,0,0.3)] flex items-center justify-center p-2 group-hover/item:border-amber-400/60 group-hover/item:shadow-[0_12px_30px_rgba(251,191,36,0.25)] transition-all duration-300">
                        {/* Pedestal Bottom Reflection Disc */}
                        <div className="absolute -bottom-1.5 inset-x-3 h-3 bg-black/40 rounded-full blur-xs pointer-events-none group-hover/item:scale-110 transition-transform" />

                        {/* Floating Product Cutout Visual */}
                        <img 
                          src={prod.img} 
                          alt="" 
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=400&auto=format&fit=crop&q=80";
                          }}
                          className="w-full h-full object-contain rounded-xl drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)] transition-all duration-300 ease-out group-hover/item:scale-115 group-hover/item:-translate-y-1.5"
                          referrerPolicy="no-referrer"
                        />

                        {/* Quick View Floating Lens Trigger */}
                        <div className="absolute inset-0 rounded-2xl bg-black/40 backdrop-blur-xs opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                          <span className="text-[9px] font-bold text-amber-300 bg-black/80 px-2 py-0.5 rounded-full border border-amber-400/40 shadow-xs flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" />
                            <span>View</span>
                          </span>
                        </div>
                      </div>

                      {/* Product Name (Sleek minimalist caption below pedestal) */}
                      <span className={`text-[9.5px] sm:text-[10.5px] font-medium truncate w-full text-center mt-1.5 tracking-tight px-1 transition-colors block ${
                        isLightBanner ? "text-slate-700 group-hover/item:text-slate-950" : "text-white/85 group-hover/item:text-amber-200"
                      }`}>
                        {prod.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Manual Navigation Controls: Left & Right Chevrons */}
        {activeAds.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 active:scale-90 text-white/90 hover:text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg transition-all opacity-85 sm:opacity-0 sm:group-hover/carousel:opacity-100 z-30 cursor-pointer"
              aria-label="Previous advertisement"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 active:scale-90 text-white/90 hover:text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg transition-all opacity-85 sm:opacity-0 sm:group-hover/carousel:opacity-100 z-30 cursor-pointer"
              aria-label="Next advertisement"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.2]" />
            </button>
          </>
        )}

        {/* Elegant Pagination Indicators & Micro Progress Bar */}
        {activeAds.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10">
            {activeAds.map((ad, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={ad.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToIndex(idx);
                  }}
                  className={`transition-all duration-300 rounded-full cursor-pointer relative overflow-hidden ${
                    isActive 
                      ? "w-5 h-1.5 bg-amber-400 shadow-xs" 
                      : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  {isActive && !isHovered && (
                    <div 
                      className="absolute inset-0 bg-white/40 rounded-full transition-all duration-75"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
