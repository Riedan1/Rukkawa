import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  BatteryCharging, 
  Feather, 
  Heart, 
  Activity, 
  Droplets, 
  ShieldCheck, 
  Sparkles, 
  Leaf, 
  Cross, 
  Award, 
  Package, 
  Store, 
  Clock, 
  ArrowRight,
  Flame,
  Check
} from "lucide-react";
import { MerchantStore, Product } from "../types";

export interface AdSlideData {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  slogan: string;
  sloganColor: string;
  sloganUnderline?: boolean;
  features: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
  }[];
  buttonText: string;
  buttonActionType: "store" | "explore" | "product";
  theme: {
    bgGradient: string;
    ambientGlow: string;
    accentColor: string;
    cardBorder: string;
    pillBg: string;
  };
  productVisualType: "headphones" | "smartwatch" | "sneakers" | "skincare" | "heritage";
}

interface SponsoredAdBannerProps {
  selectedStore?: MerchantStore | null;
  onVisitStore?: (storeId: string) => void;
  onExploreDeals?: () => void;
  onSelectProduct?: (product: Product) => void;
  adCountdown?: { hours: number; minutes: number; seconds: number };
  initialTemplateId?: string;
  compact?: boolean;
}

export const SponsoredAdBanner: React.FC<SponsoredAdBannerProps> = ({
  selectedStore,
  onVisitStore,
  onExploreDeals,
  onSelectProduct,
  adCountdown = { hours: 1, minutes: 24, seconds: 16 },
  initialTemplateId,
  compact = false
}) => {
  // Define default 5 high-fidelity templates matching the GPT screenshots + Algerian Heritage
  const templates: AdSlideData[] = [
    {
      id: "headphones",
      category: "AUDIO & SOUND",
      title: "Premium Headphones",
      subtitle: "Crystal clear sound. All day comfort.",
      slogan: "Music Makes Life Better",
      sloganColor: "#F5C470",
      sloganUnderline: true,
      features: [
        {
          icon: <Volume2 className="w-3.5 h-3.5 text-amber-300" />,
          title: "Hi-Fi Sound",
          subtitle: "Quality"
        },
        {
          icon: <BatteryCharging className="w-3.5 h-3.5 text-amber-300" />,
          title: "Up to 40H",
          subtitle: "Battery Life"
        },
        {
          icon: <Feather className="w-3.5 h-3.5 text-amber-300" />,
          title: "Lightweight",
          subtitle: "Design"
        }
      ],
      buttonText: "Shop Now",
      buttonActionType: "product",
      theme: {
        bgGradient: "linear-gradient(108deg, #180d07 0%, #26150b 38%, #1f1109 65%, #0e0704 100%)",
        ambientGlow: "radial-gradient(circle at 75% 50%, rgba(245, 158, 11, 0.28) 0%, transparent 65%)",
        accentColor: "#F59E0B",
        cardBorder: "rgba(245, 158, 11, 0.22)",
        pillBg: "rgba(245, 158, 11, 0.15)"
      },
      productVisualType: "headphones"
    },
    {
      id: "smartwatch",
      category: "WEARABLES & FITNESS",
      title: "Smart Watch",
      subtitle: "More than a watch. A healthier you.",
      slogan: "Track Your Goals",
      sloganColor: "#67E8F9",
      sloganUnderline: true,
      features: [
        {
          icon: <Heart className="w-3.5 h-3.5 text-cyan-300" />,
          title: "Heart Rate",
          subtitle: "Monitoring"
        },
        {
          icon: <Activity className="w-3.5 h-3.5 text-cyan-300" />,
          title: "100+ Sports",
          subtitle: "Modes"
        },
        {
          icon: <Droplets className="w-3.5 h-3.5 text-cyan-300" />,
          title: "5ATM",
          subtitle: "Waterproof"
        }
      ],
      buttonText: "Shop Now",
      buttonActionType: "product",
      theme: {
        bgGradient: "linear-gradient(108deg, #06111d 0%, #0d2238 38%, #081726 65%, #03080e 100%)",
        ambientGlow: "radial-gradient(circle at 75% 50%, rgba(56, 189, 248, 0.25) 0%, transparent 65%)",
        accentColor: "#38BDF8",
        cardBorder: "rgba(56, 189, 248, 0.22)",
        pillBg: "rgba(56, 189, 248, 0.15)"
      },
      productVisualType: "smartwatch"
    },
    {
      id: "sneakers",
      category: "STREETWEAR & LIFESTYLE",
      title: "Iconic Sneakers",
      subtitle: "Style meets comfort. Step forward.",
      slogan: "Walk Your Own Style",
      sloganColor: "#FDE047",
      sloganUnderline: true,
      features: [
        {
          icon: <Award className="w-3.5 h-3.5 text-amber-200" />,
          title: "Premium",
          subtitle: "Materials"
        },
        {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-200" />,
          title: "Durable",
          subtitle: "Build"
        },
        {
          icon: <Sparkles className="w-3.5 h-3.5 text-amber-200" />,
          title: "Trendy",
          subtitle: "Design"
        }
      ],
      buttonText: "Shop Now",
      buttonActionType: "product",
      theme: {
        bgGradient: "linear-gradient(108deg, #181412 0%, #291e17 38%, #1f1712 65%, #0f0c0b 100%)",
        ambientGlow: "radial-gradient(circle at 75% 50%, rgba(217, 119, 6, 0.25) 0%, transparent 65%)",
        accentColor: "#D97706",
        cardBorder: "rgba(217, 119, 6, 0.22)",
        pillBg: "rgba(217, 119, 6, 0.15)"
      },
      productVisualType: "sneakers"
    },
    {
      id: "skincare",
      category: "CLEAN BEAUTY",
      title: "Skincare Essentials",
      subtitle: "Healthy skin. Natural beauty.",
      slogan: "Glow Naturally ♡",
      sloganColor: "#FDA4AF",
      sloganUnderline: true,
      features: [
        {
          icon: <Leaf className="w-3.5 h-3.5 text-rose-300" />,
          title: "Natural",
          subtitle: "Ingredients"
        },
        {
          icon: <Sparkles className="w-3.5 h-3.5 text-rose-300" />,
          title: "Dermatologist",
          subtitle: "Approved"
        },
        {
          icon: <Droplets className="w-3.5 h-3.5 text-rose-300" />,
          title: "For All",
          subtitle: "Skin Types"
        }
      ],
      buttonText: "Shop Now",
      buttonActionType: "product",
      theme: {
        bgGradient: "linear-gradient(108deg, #241215 0%, #3a1c21 38%, #2d1519 65%, #14090b 100%)",
        ambientGlow: "radial-gradient(circle at 75% 50%, rgba(244, 63, 94, 0.25) 0%, transparent 65%)",
        accentColor: "#F43F5E",
        cardBorder: "rgba(244, 63, 94, 0.22)",
        pillBg: "rgba(244, 63, 94, 0.15)"
      },
      productVisualType: "skincare"
    },
    {
      id: "heritage",
      category: "TRADITIONAL ARTISAN",
      title: selectedStore?.adBannerTitle || "Algeria Direct Heritage",
      subtitle: selectedStore?.adBannerDescription || "Direct local delivery of rare Berber rugs & fine crafts. Save 15% off today!",
      slogan: "Handcrafted Heritage",
      sloganColor: "#FBBF24",
      sloganUnderline: true,
      features: [
        {
          icon: <Sparkles className="w-3.5 h-3.5 text-emerald-300" />,
          title: "100% Virgin",
          subtitle: "Organic Wool"
        },
        {
          icon: <Award className="w-3.5 h-3.5 text-emerald-300" />,
          title: "Kabyle Women",
          subtitle: "Artisan Guild"
        },
        {
          icon: <Package className="w-3.5 h-3.5 text-emerald-300" />,
          title: "58 Wilayas",
          subtitle: "Fast Delivery"
        }
      ],
      buttonText: "Visit Store",
      buttonActionType: "store",
      theme: {
        bgGradient: "linear-gradient(108deg, #0b2318 0%, #113827 38%, #0d2d1f 65%, #05140e 100%)",
        ambientGlow: "radial-gradient(circle at 75% 50%, rgba(16, 185, 129, 0.25) 0%, transparent 65%)",
        accentColor: "#10B981",
        cardBorder: "rgba(16, 185, 129, 0.25)",
        pillBg: "rgba(16, 185, 129, 0.15)"
      },
      productVisualType: "heritage"
    }
  ];

  // If store has custom title and description, keep heritage slide in sync
  const customizedTemplates = templates.map(t => {
    if (t.id === "heritage" && selectedStore) {
      return {
        ...t,
        title: selectedStore.adBannerTitle || t.title,
        subtitle: selectedStore.adBannerDescription || t.subtitle
      };
    }
    return t;
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialTemplateId) {
      const idx = customizedTemplates.findIndex(t => t.id === initialTemplateId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Automatic time-based rotation disabled; template stays stable during session
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, [isPaused, customizedTemplates.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + customizedTemplates.length) % customizedTemplates.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % customizedTemplates.length);
  };

  const currentSlide = customizedTemplates[currentIndex];

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentSlide.buttonActionType === "store" && onVisitStore) {
      onVisitStore(selectedStore?.id || "store_1");
    } else if (onExploreDeals) {
      onExploreDeals();
    }
  };

  return (
    <div 
      className="relative w-full select-none group/banner transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Quick Template Switcher Pills Bar (for user/merchant to easily jump between GPT ad templates) */}
      <div className="flex items-center justify-between gap-2 px-1 mb-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mr-1 shrink-0 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" />
            Ad Templates:
          </span>
          {customizedTemplates.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => setCurrentIndex(idx)}
              className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold transition-all duration-200 shrink-0 cursor-pointer ${
                currentIndex === idx
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>

        {/* Live Deal Badge */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-[10.5px] font-medium text-slate-500">
          <Clock className="w-3 h-3 text-amber-500" />
          <span className="font-mono text-slate-700 dark:text-slate-300 font-bold tabular-nums">
            Ends: {String(adCountdown.hours).padStart(2, '0')}:{String(adCountdown.minutes).padStart(2, '0')}:{String(adCountdown.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Main Banner Container */}
      <div 
        className="relative overflow-hidden rounded-2xl md:rounded-3xl border shadow-xl transition-all duration-500 min-h-[220px] sm:min-h-[260px] md:min-h-[290px] flex items-center"
        style={{
          background: currentSlide.theme.bgGradient,
          borderColor: currentSlide.theme.cardBorder
        }}
      >
        {/* Ambient Glow Atmosphere Behind Product Stage */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-90"
          style={{ background: currentSlide.theme.ambientGlow }}
        />

        {/* Ambient Dark Scrim Vignette on Left (guarantees text contrast WCAG AA) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent sm:w-2/3 pointer-events-none" />

        {/* Prev Slide Navigation Arrow */}
        <button
          onClick={handlePrev}
          aria-label="Previous ad slide"
          className="absolute left-2.5 sm:left-4 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 active:scale-95 border border-white/20 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 cursor-pointer shadow-md"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Next Slide Navigation Arrow */}
        <button
          onClick={handleNext}
          aria-label="Next ad slide"
          className="absolute right-2.5 sm:right-4 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 active:scale-95 border border-white/20 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 cursor-pointer shadow-md"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Content Layout Grid */}
        <div className="relative z-10 w-full px-10 sm:px-14 md:px-16 py-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* LEFT ZONE: SPONSORED pill, Title, Subtitle, 3 Circular Feature Badges, Shop Now CTA */}
          <div className="flex-1 text-left max-w-xl">
            {/* Sponsored Pill Badge */}
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[9px] sm:text-[10px] font-bold text-white/90 tracking-widest uppercase font-mono shadow-xs">
                Sponsored
              </span>
              <span className="text-[10px] text-white/60 font-mono hidden sm:inline">
                {currentSlide.category}
              </span>
            </div>

            {/* Display Headline */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight" style={{ textWrap: "balance" }}>
              {currentSlide.title}
            </h2>

            {/* Tagline / Subtitle */}
            <p className="text-xs sm:text-sm text-slate-200/90 font-normal mt-1 sm:mt-1.5 leading-relaxed max-w-md">
              {currentSlide.subtitle}
            </p>

            {/* 3 Circular Feature Badges Row */}
            <div className="flex items-center gap-4 sm:gap-6 mt-4 sm:mt-5 flex-wrap">
              {currentSlide.features.map((feat, fIdx) => (
                <div key={fIdx} className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-xs shrink-0">
                    {feat.icon}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10.5px] sm:text-[11.5px] font-bold text-white leading-tight">
                      {feat.title}
                    </span>
                    <span className="text-[9.5px] sm:text-[10px] text-slate-300/80 leading-tight">
                      {feat.subtitle}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button Zone */}
            <div className="flex items-center gap-3.5 mt-5 sm:mt-6">
              <button
                onClick={handleActionClick}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-amber-400 hover:bg-amber-350 active:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-950/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>{currentSlide.buttonText}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {onExploreDeals && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExploreDeals();
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/20 text-white font-medium text-xs backdrop-blur-md transition-all cursor-pointer"
                >
                  <span>Explore Deals</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT ZONE: Realistic Product Staging + Handwritten Cursive Slogan */}
          <div className="relative flex items-center justify-center shrink-0 w-full md:w-auto mt-2 md:mt-0">
            {/* Handwritten Signature Slogan Accent */}
            <div className="absolute -top-3 sm:-top-5 right-2 sm:right-6 z-20 pointer-events-none text-right">
              <div 
                className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide italic"
                style={{ 
                  color: currentSlide.sloganColor,
                  fontFamily: "'Caveat', cursive, sans-serif",
                  textShadow: `0 2px 12px ${currentSlide.sloganColor}40`
                }}
              >
                {currentSlide.slogan}
              </div>
              {currentSlide.sloganUnderline && (
                <svg className="w-24 sm:w-32 h-3 ml-auto opacity-80" viewBox="0 0 100 12" fill="none">
                  <path 
                    d="M3 8C28 2 75 1 97 7" 
                    stroke={currentSlide.sloganColor} 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                  />
                </svg>
              )}
            </div>

            {/* Product Staging Graphic Canvas */}
            <div className="relative w-48 h-48 sm:w-64 sm:h-60 md:w-72 md:h-64 flex items-center justify-center">
              {/* Product Visual Renderer */}
              {renderProductVisual(currentSlide.productVisualType, selectedStore)}
            </div>
          </div>
        </div>

        {/* BOTTOM PAGINATION INDICATORS */}
        <div className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {customizedTemplates.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 cursor-pointer ${
                currentIndex === idx 
                  ? "w-6 sm:w-7 h-1.5 rounded-full bg-amber-400" 
                  : "w-1.5 h-1.5 rounded-full bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Realistic Product Visual Renderer matching the 4 GPT generated images:
 * - Luxury bronze & black over-ear headphones on wooden pedestal
 * - Smartwatch on alpine rock with vibrant OLED display
 * - Iconic retro basketball high-top sneakers on stone floor
 * - Skincare luxury bottles on marble with cherry blossoms
 * - Algerian Kabyle Berber rug tapestry & authentic jewelry
 */
function renderProductVisual(type: AdSlideData["productVisualType"], selectedStore?: MerchantStore | null) {
  switch (type) {
    case "headphones":
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Warm Studio Light Beams */}
          <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent blur-xl" />

          {/* Wooden Round Pedestal */}
          <div className="absolute -bottom-2 w-44 sm:w-56 h-14 bg-gradient-to-r from-[#2c1910] via-[#4a2e1d] to-[#24130a] rounded-[50%] border-t border-[#7a4e32]/40 shadow-2xl transform rotate-x-60" />

          {/* Headphones Realistic SVG Rendering */}
          <svg className="w-40 sm:w-52 h-40 sm:h-52 z-10 drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]" viewBox="0 0 200 200" fill="none">
            <defs>
              <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#DFB275" />
                <stop offset="50%" stopColor="#8C6239" />
                <stop offset="100%" stopColor="#D4A362" />
              </linearGradient>
              <linearGradient id="metalRing" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F7D08A" />
                <stop offset="50%" stopColor="#4A3420" />
                <stop offset="100%" stopColor="#E2B778" />
              </linearGradient>
              <linearGradient id="leatherBand" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1E1E1E" />
                <stop offset="50%" stopColor="#3A3A3A" />
                <stop offset="100%" stopColor="#171717" />
              </linearGradient>
              <radialGradient id="cupCenter" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2A2A2A" />
                <stop offset="85%" stopColor="#121212" />
                <stop offset="100%" stopColor="#080808" />
              </radialGradient>
            </defs>

            {/* Headband Arch */}
            <path 
              d="M45 110 C 35 40, 165 40, 155 110" 
              stroke="url(#leatherBand)" 
              strokeWidth="16" 
              strokeLinecap="round" 
            />
            {/* Top Headband Cushion */}
            <path 
              d="M55 95 C 50 48, 150 48, 145 95" 
              stroke="#111" 
              strokeWidth="8" 
              strokeLinecap="round" 
              opacity="0.8"
            />
            {/* Bronze Metal Sliders */}
            <rect x="42" y="98" width="8" height="24" rx="2" fill="url(#bronzeGrad)" />
            <rect x="150" y="98" width="8" height="24" rx="2" fill="url(#bronzeGrad)" />

            {/* Left Earcup (Angled Backwards) */}
            <g transform="translate(25, 95) rotate(-15)">
              <ellipse cx="20" cy="30" rx="16" ry="24" fill="#0A0A0A" stroke="url(#bronzeGrad)" strokeWidth="3" />
              <ellipse cx="18" cy="30" rx="12" ry="20" fill="url(#cupCenter)" />
            </g>

            {/* Right Earcup (Hero Facing Front/Side) */}
            <g transform="translate(108, 90)">
              {/* Outer Cushion */}
              <ellipse cx="40" cy="40" rx="34" ry="42" fill="#141414" stroke="#050505" strokeWidth="2" />
              {/* Bronze Outer Rim */}
              <ellipse cx="40" cy="40" rx="30" ry="38" fill="none" stroke="url(#metalRing)" strokeWidth="4.5" />
              {/* Center Earcup Plate */}
              <ellipse cx="40" cy="40" rx="25" ry="33" fill="url(#cupCenter)" />
              {/* Gold Infinity/Sound Logo */}
              <path 
                d="M33 40 C 33 36, 37 36, 40 40 C 43 44, 47 44, 47 40 C 47 36, 43 36, 40 40 C 37 44, 33 44, 33 40 Z" 
                stroke="url(#bronzeGrad)" 
                strokeWidth="2" 
                fill="none" 
              />
              {/* Soft Highlight Sheen */}
              <ellipse cx="32" cy="28" rx="14" ry="8" fill="white" opacity="0.12" transform="rotate(-20 32 28)" />
            </g>
          </svg>
        </div>
      );

    case "smartwatch":
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Alpine Mountain Silhouette Background */}
          <div className="absolute inset-0 flex items-end justify-center pointer-events-none opacity-40">
            <svg className="w-full h-24" viewBox="0 0 200 80" fill="none">
              <path d="M0 80 L30 45 L55 60 L90 25 L125 55 L160 30 L200 80 Z" fill="#1e3a5f" />
              <path d="M90 25 L100 35 L82 35 Z" fill="#ffffff" opacity="0.8" />
              <path d="M160 30 L168 40 L152 40 Z" fill="#ffffff" opacity="0.8" />
            </svg>
          </div>

          {/* Rugged Rock Pedestal */}
          <div className="absolute -bottom-2 w-44 sm:w-56 h-12 bg-gradient-to-r from-[#121c26] via-[#213040] to-[#0f1720] rounded-xl border-t border-slate-600/40 shadow-2xl transform rotate-x-50" />

          {/* Smartwatch SVG */}
          <svg className="w-40 sm:w-50 h-40 sm:h-50 z-10 drop-shadow-[0_15px_25px_rgba(0,0,0,0.9)]" viewBox="0 0 200 200" fill="none">
            <defs>
              <linearGradient id="strapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>

            {/* Top Watch Band */}
            <path d="M72 15 L128 15 L124 55 L76 55 Z" fill="url(#strapGrad)" stroke="#475569" strokeWidth="1" />
            {/* Bottom Watch Band */}
            <path d="M76 145 L124 145 L128 185 L72 185 Z" fill="url(#strapGrad)" stroke="#475569" strokeWidth="1" />

            {/* Watch Case Frame */}
            <rect x="60" y="48" width="80" height="104" rx="26" fill="#0B131E" stroke="#475569" strokeWidth="3" />
            {/* Outer Bezel Rim */}
            <rect x="64" y="52" width="72" height="96" rx="22" fill="#000000" stroke="#1E293B" strokeWidth="2" />

            {/* Glowing OLED Display */}
            {/* Status Header */}
            <text x="75" y="70" fill="#94A3B8" fontSize="8" fontFamily="monospace">Sat 26</text>
            <text x="75" y="92" fill="#FFFFFF" fontSize="22" fontWeight="bold" fontFamily="sans-serif">10:09</text>
            
            {/* Heart Rate Indicator */}
            <g transform="translate(74, 106)">
              <Heart className="w-3.5 h-3.5" fill="#EF4444" stroke="none" />
              <text x="18" y="10" fill="#F87171" fontSize="9" fontWeight="bold">72</text>
            </g>

            {/* Step Counter */}
            <g transform="translate(104, 106)">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <text x="16" y="10" fill="#38BDF8" fontSize="9" fontWeight="bold">9,560</text>
            </g>

            {/* Activity Progress Rings */}
            <circle cx="100" cy="132" r="8" stroke="#EF4444" strokeWidth="2.5" fill="none" strokeDasharray="35 50" />
            <circle cx="100" cy="132" r="5" stroke="#10B981" strokeWidth="2" fill="none" strokeDasharray="22 30" />
            <circle cx="100" cy="132" r="2.5" stroke="#38BDF8" strokeWidth="1.5" fill="none" strokeDasharray="10 15" />

            {/* Side Digital Crown Button */}
            <rect x="141" y="70" width="5" height="16" rx="2" fill="#94A3B8" stroke="#334155" />
          </svg>
        </div>
      );

    case "sneakers":
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Architectural Concrete Pedestal Floor */}
          <div className="absolute -bottom-1 w-48 sm:w-60 h-14 bg-gradient-to-r from-[#1c1815] via-[#332a24] to-[#171412] rounded-xl border-t border-amber-900/40 shadow-2xl" />

          {/* Retro High-Top Basketball Sneakers SVG */}
          <svg className="w-44 sm:w-56 h-40 sm:h-52 z-10 drop-shadow-[0_15px_25px_rgba(0,0,0,0.85)]" viewBox="0 0 220 180" fill="none">
            <defs>
              <linearGradient id="leatherWhite" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>
              <linearGradient id="leatherBlack" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2A2A2A" />
                <stop offset="100%" stopColor="#121212" />
              </linearGradient>
              <linearGradient id="soleCream" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="100%" stopColor="#FEF3C7" />
              </linearGradient>
            </defs>

            {/* Sneaker Pair - Main Forward Sneaker */}
            <g transform="translate(15, 20)">
              {/* White Rubber Outsole */}
              <path d="M15 130 C40 130, 160 130, 185 125 C190 123, 192 118, 185 115 C160 115, 30 115, 12 118 C8 122, 10 130, 15 130 Z" fill="url(#soleCream)" stroke="#D97706" strokeWidth="0.8" />
              
              {/* Midsole Texture Band */}
              <path d="M14 118 C30 118, 160 118, 184 115 L180 110 L15 110 Z" fill="#F8FAFC" />

              {/* Upper White Leather Body */}
              <path d="M25 110 L45 80 L75 80 L95 50 L135 40 L150 70 L175 105 L180 110 Z" fill="url(#leatherWhite)" />

              {/* Black Heel Collar & Counter Overlay */}
              <path d="M125 40 C145 35, 155 45, 150 75 L140 110 L160 110 L165 75 Z" fill="url(#leatherBlack)" />

              {/* Black Toe Guard & Swoosh Arch */}
              <path d="M15 110 C25 90, 45 85, 60 110 Z" fill="url(#leatherBlack)" />
              <path d="M60 85 C80 95, 130 90, 155 70 C140 85, 100 105, 60 85 Z" fill="url(#leatherBlack)" />

              {/* Ankle Wings Badge Icon */}
              <circle cx="138" cy="58" r="9" fill="#000000" stroke="#D4AF37" strokeWidth="1" />
              <path d="M132 58 L144 58 M134 55 L142 55 M134 61 L142 61" stroke="#D4AF37" strokeWidth="1" />

              {/* Black Eyelets & White Laces */}
              <path d="M75 80 L88 56" stroke="#000000" strokeWidth="3" strokeDasharray="3 4" />
              <path d="M78 78 L85 76 M82 70 L89 68 M85 62 L92 60" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      );

    case "skincare":
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Floating Blossom Petals */}
          <div className="absolute top-2 right-4 w-4 h-3 bg-rose-300/60 rounded-full rotate-45 blur-[0.5px]" />
          <div className="absolute bottom-6 left-6 w-3 h-2 bg-rose-200/50 rounded-full -rotate-12 blur-[0.5px]" />

          {/* White Marble Counter Slab */}
          <div className="absolute -bottom-1 w-48 sm:w-60 h-14 bg-gradient-to-r from-[#2a171a] via-[#48282e] to-[#201013] rounded-xl border-t border-rose-400/30 shadow-2xl" />

          {/* Skincare Bottles & Jars SVG */}
          <svg className="w-44 sm:w-56 h-40 sm:h-52 z-10 drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]" viewBox="0 0 220 180" fill="none">
            <defs>
              <linearGradient id="creamJarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE2E4" />
                <stop offset="50%" stopColor="#FAD2E1" />
                <stop offset="100%" stopColor="#C59B9E" />
              </linearGradient>
              <linearGradient id="roseGoldCap" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E0A96D" />
                <stop offset="50%" stopColor="#F9DCC4" />
                <stop offset="100%" stopColor="#C98B58" />
              </linearGradient>
              <linearGradient id="glassBottle" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F4A261" />
                <stop offset="50%" stopColor="#FEE440" />
                <stop offset="100%" stopColor="#E76F51" />
              </linearGradient>
            </defs>

            {/* Front Left: Frosted Glass Face Cream Jar */}
            <g transform="translate(25, 80)">
              {/* Jar Cap */}
              <rect x="10" y="5" width="56" height="10" rx="3" fill="url(#roseGoldCap)" />
              {/* Jar Body */}
              <rect x="8" y="15" width="60" height="40" rx="10" fill="url(#creamJarGrad)" stroke="#FFFFFF" strokeWidth="1" opacity="0.95" />
              <text x="21" y="38" fill="#5E3038" fontSize="6.5" fontWeight="bold" fontFamily="serif" letterSpacing="1">BEAUTY</text>
              <text x="25" y="46" fill="#8C535F" fontSize="4.5" fontFamily="sans-serif">CREAM</text>
            </g>

            {/* Center: Tall Rose Lotion Pump Bottle */}
            <g transform="translate(85, 30)">
              {/* Pump Dispenser */}
              <rect x="25" y="2" width="6" height="12" fill="url(#roseGoldCap)" />
              <path d="M22 6 L38 6 L38 10 L28 10" fill="url(#roseGoldCap)" />
              {/* Bottle Collar */}
              <rect x="20" y="14" width="16" height="6" rx="2" fill="url(#roseGoldCap)" />
              {/* Main Cylindrical Bottle */}
              <rect x="12" y="20" width="32" height="90" rx="8" fill="url(#creamJarGrad)" stroke="#FFFFFF" strokeWidth="1" />
              <text x="17" y="65" fill="#5E3038" fontSize="7" fontWeight="bold" fontFamily="serif" letterSpacing="1">BEAUTY</text>
              <text x="20" y="74" fill="#8C535F" fontSize="4.5" fontFamily="sans-serif">ESSENCE</text>
            </g>

            {/* Right: Serum Dropper Pipette Bottle */}
            <g transform="translate(142, 55)">
              {/* Rubber Dropper Bulb */}
              <path d="M18 5 C18 0, 28 0, 28 5 L28 10 L18 10 Z" fill="#FFF" />
              <rect x="15" y="10" width="16" height="6" rx="1" fill="url(#roseGoldCap)" />
              {/* Amber/Rose Glass Dropper Bottle */}
              <rect x="10" y="16" width="26" height="65" rx="6" fill="#FFCCD5" stroke="#FFFFFF" strokeWidth="1" />
              <text x="15" y="48" fill="#5E3038" fontSize="5" fontWeight="bold" fontFamily="serif">SERUM</text>
            </g>
          </svg>
        </div>
      );

    case "heritage":
    default:
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Warm Emerald & Gold Ambient Radiance */}
          <div className="absolute inset-0 bg-radial from-amber-400/20 via-emerald-600/10 to-transparent blur-xl" />

          {/* Wood Craftsman Pedestal */}
          <div className="absolute -bottom-1 w-48 sm:w-60 h-14 bg-gradient-to-r from-[#0d261a] via-[#1a4a33] to-[#0a1f15] rounded-xl border-t border-emerald-500/30 shadow-2xl" />

          {/* Authentic Algerian Berber Tapestry & Kabyle Silver Jewelry SVG Graphic */}
          <svg className="w-44 sm:w-56 h-40 sm:h-52 z-10 drop-shadow-[0_15px_25px_rgba(0,0,0,0.85)]" viewBox="0 0 220 180" fill="none">
            <defs>
              <linearGradient id="silverGloss" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
              <linearGradient id="coralRed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#991B1B" />
              </linearGradient>
            </defs>

            {/* Berber Rug Tapestry Hanging in Background */}
            <g transform="translate(15, 20)">
              {/* Woven Wool Base */}
              <rect x="5" y="5" width="130" height="110" rx="4" fill="#F8FAFC" stroke="#059669" strokeWidth="2" />
              {/* Geometric Berber Diamond Motifs */}
              <polygon points="70,15 95,50 70,85 45,50" fill="none" stroke="#DC2626" strokeWidth="3" />
              <polygon points="70,28 85,50 70,72 55,50" fill="#FEF08A" stroke="#2563EB" strokeWidth="2" />
              <polygon points="70,38 78,50 70,62 62,50" fill="#DC2626" />

              {/* Side Traditional Zig-Zags */}
              <polyline points="15,15 25,25 15,35 25,45 15,55 25,65 15,75" stroke="#059669" strokeWidth="2.5" fill="none" />
              <polyline points="125,15 115,25 125,35 115,45 125,55 115,65 125,75" stroke="#059669" strokeWidth="2.5" fill="none" />

              {/* Wool Fringe Tassels */}
              <line x1="5" y1="115" x2="5" y2="125" stroke="#D1D5DB" strokeWidth="2" />
              <line x1="20" y1="115" x2="20" y2="125" stroke="#D1D5DB" strokeWidth="2" />
              <line x1="35" y1="115" x2="35" y2="125" stroke="#D1D5DB" strokeWidth="2" />
              <line x1="50" y1="115" x2="50" y2="125" stroke="#D1D5DB" strokeWidth="2" />
              <line x1="65" y1="115" x2="65" y2="125" stroke="#D1D5DB" strokeWidth="2" />
              <line x1="80" y1="115" x2="80" y2="125" stroke="#D1D5DB" strokeWidth="2" />
              <line x1="95" y1="115" x2="95" y2="125" stroke="#D1D5DB" strokeWidth="2" />
              <line x1="110" y1="115" x2="110" y2="125" stroke="#D1D5DB" strokeWidth="2" />
              <line x1="125" y1="115" x2="125" y2="125" stroke="#D1D5DB" strokeWidth="2" />
            </g>

            {/* Kabyle Traditional Silver Fibula (Taabzimt) with Red Coral Cabochons */}
            <g transform="translate(130, 60)">
              {/* Outer Silver Filigree Ring */}
              <circle cx="35" cy="40" r="30" fill="url(#silverGloss)" stroke="#334155" strokeWidth="1.5" />
              <circle cx="35" cy="40" r="22" fill="#0F172A" />

              {/* Center Coral Gem */}
              <circle cx="35" cy="40" r="10" fill="url(#coralRed)" stroke="#F59E0B" strokeWidth="2" />
              {/* Enamel Yellow/Blue Accents */}
              <circle cx="35" cy="22" r="4" fill="#FBBF24" />
              <circle cx="35" cy="58" r="4" fill="#FBBF24" />
              <circle cx="17" cy="40" r="4" fill="#3B82F6" />
              <circle cx="53" cy="40" r="4" fill="#3B82F6" />

              {/* Silver Pin */}
              <line x1="10" y1="65" x2="60" y2="15" stroke="url(#silverGloss)" strokeWidth="3" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      );
  }
}
