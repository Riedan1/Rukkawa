import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import ProductReviewWidget, { USER_AVATAR_POOL, hashStringToNumber, OrnateOrnamentDivider, getGuestIp } from "./ProductReviewWidget";
import { Product, MerchantStore, Order } from "../types";
import { ShippingTrackingModal } from "./ShippingTrackingModal";
import { YumeAccountRegistrationPage } from "./YumeAccountRegistrationPage";
import { BookmarkStar } from "./BookmarkStar";
import { YumeShopFooter } from "./YumeShopFooter";
import { YumeLogo } from "./YumeLogo";
import { formatStorePrice, getStorePriceParts } from "../currency";
import { getOptimizedImageUrl, getHighResZoomUrl } from "../utils/imageOptimizer";
import { trackAdViewContent } from "../utils/analytics";
import {
  getWorldwideCountries,
  getStatesByCountryCode,
  getCitiesByState,
  detectUserCountryCode,
  detectUserLocationByIP,
  ALGERIA_58_WILAYAS,
  ALGERIA_69_WILAYAS,
  ALGERIA_COMMUNES_MAP,
} from "../lib/countryStateCity";
import { SearchableLocationSelect, SearchOption } from "./SearchableLocationSelect";
import {
  FlashSaleCountdownTimer,
  FlashSaleTimerStyle,
} from "./FlashSaleCountdownTimer";
import { YumeCustomerOfferWidget, PlayingCardProductStack } from "./YumeOffersAndPromotions";
import {
  calculateOfferTierPricing,
  extractStep3VariantAxes,
  normalizeUnitVariantSelections,
  formatOfferSelectionSummary,
  resolveUnitVariantInfo,
  DEFAULT_HOODIE_THUMBNAIL,
} from "../utils/offersLogic";
import {
  OrganizedOfferSummaryBuyBox,
  OrganizedOfferSummaryModal,
} from "../utils/offersOrderHelpers";
import { FindYourFitButton, FindYourFitModal } from "./FindYourFitModal";
import { hasValidProductSizingFit } from "../utils/sizingFitLogic";
import { validateFullName } from "../lib/fullNameValidation";
import { validatePhoneNumber, formatPhoneForDisplay } from "../lib/phoneValidation";
import {
  sortVariantOptionEntries,
  filterExistingProductColors,
  isVariantOptionValueOutOfStock,
  isFashionProductCategory,
  isFashionNonVariantAttribute,
  filterAndSortAboutItemSpecs,
  pickRandomYumeAccentColor,
  hasArabicCharacters,
  getProductBasePrice,
  calculateDynamicShippingFee,
} from "../utils/wizardLogic";
import { hasIpRequestedNotify, StockNotifyRequest } from "../utils/stockNotifyAlerts";
import { 
  ArrowLeft, 
  X, 
  Shirt, 
  Star, 
  ThumbsUp, 
  Maximize2, 
  ShieldCheck, 
  Truck, 
  Lock, 
  ChevronDown, 
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  ShoppingBag,
  Sparkles, 
  Share2, 
  Heart, 
  AlertCircle,
  MessageSquare,
  Bookmark,
  Check,
  MapPin,
  Building,
  CreditCard,
  ShoppingCart,
  Cpu,
  Sliders,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileText,
  HelpCircle,
  BookOpen,
  Layers,
  Video,
  Store,
  Eye,
  ArrowUpRight,
  Tag,
  Phone,
  Mail,
  User,
  CheckCircle2,
  MessageCircle,
  PhoneCall,
  Send,
  Copy,
  Search,
  Globe,
  Package,
  Calendar,
  UserPlus,
  Clock,
  Banknote
} from "lucide-react";

const OriginalYumeLogo = ({
  className = "",
  accentColor = "#4A0E2E",
}: {
  className?: string;
  accentColor?: string;
  idPrefix?: string;
}) => (
  <YumeLogo
    variant="full"
    size="md"
    theme="light"
    accentColor={accentColor}
    className={className}
  />
);

/**
 * Inspiring Yume Brandmark & Wordmark used across Checkout & Confirmation headers
 */
export const YumeBrandLogo = ({
  className = "",
  accentColor = "#4A0E2E",
}: {
  className?: string;
  accentColor?: string;
}) => (
  <YumeLogo
    variant="full"
    size="md"
    theme="light"
    accentColor={accentColor}
    className={className}
  />
);

/**
 * Subtle organic wavy curves for full-page checkout & confirmation background
 * Matching the top-left swooping curve and bottom-right multi-layered wavy curves from screenshots
 */
export const CheckoutPageBackground = ({
  accentColor = "#4A0E2E",
  isFixed = true,
}: {
  accentColor?: string;
  isFixed?: boolean;
}) => {
  const posClass = isFixed ? "fixed" : "absolute";
  return (
    <div className={`pointer-events-none inset-0 overflow-hidden ${posClass} z-0 select-none`}>
      {/* Top-Left Organic Curved Wave peaking from the upper-left */}
      <svg
        className={`pointer-events-none ${posClass} -top-4 -left-4 w-[400px] sm:w-[560px] h-[300px] sm:h-[420px] select-none`}
        viewBox="0 0 560 420"
        fill="none"
      >
        <path
          d="M0,0 L440,0 C380,75 305,150 205,205 C115,255 45,315 0,405 Z"
          fill={accentColor}
          fillOpacity="0.05"
        />
        <path
          d="M0,0 L300,0 C250,55 195,115 130,155 C75,190 30,235 0,310 Z"
          fill={accentColor}
          fillOpacity="0.03"
        />
      </svg>

      {/* Bottom-Right Multi-Layered Flowing Organic Waves */}
      <svg
        className={`pointer-events-none ${posClass} -bottom-4 -right-4 w-[460px] sm:w-[700px] h-[350px] sm:h-[500px] select-none`}
        viewBox="0 0 700 500"
        fill="none"
      >
        {/* Layer 1: Outermost gentle flowing wave */}
        <path
          d="M160,500 C280,455 385,375 470,290 C545,215 610,160 700,120 L700,500 Z"
          fill={accentColor}
          fillOpacity="0.035"
        />
        {/* Layer 2: Middle curved crest */}
        <path
          d="M300,500 C410,460 495,385 560,310 C620,240 660,185 700,165 L700,500 Z"
          fill={accentColor}
          fillOpacity="0.06"
        />
        {/* Layer 3: Inner delicate accent crest */}
        <path
          d="M440,500 C525,465 590,410 635,350 C670,295 685,245 700,225 L700,500 Z"
          fill={accentColor}
          fillOpacity="0.085"
        />
      </svg>
    </div>
  );
};

const DefaultProfileStorePhoto = ({ className = "w-full h-full object-cover", ...props }: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Background circular gray/slate area */}
      <circle cx="50" cy="50" r="50" fill="#f0f2f5" />
      {/* Neck: beige/skin tone */}
      <path d="M42 65 C42 65, 42 75, 42 75 C42 75, 45 84, 50 84 C55 84, 58 75, 58 75 C58 75, 58 65, 58 65 Z" fill="#e2c4ac" />
      {/* Face: beige/skin tone */}
      <circle cx="50" cy="46" r="23" fill="#f4d4bc" />
      {/* Blue t-shirt: cyan */}
      <path d="M 18 84 C 30 74, 38 74, 40 80 C 40 80, 45 84, 50 84 C 55 84, 60 80, 60 80 C 62 74, 70 74, 82 84 C 85 87, 85 100, 85 100 L 15 100 Z" fill="#3da9fc" />
      {/* Hair base shape - beautifully spiky bangs */}
      <path d="M 27 48 C 26 43, 29 35, 32 30 C 37 23, 45 22, 50 22 C 55 22, 63 23, 68 30 C 71 35, 74 43, 73 48 C 73 52, 71 54, 70 51 C 69 48, 68 45, 67 45 C 66 45, 65 48, 64 51 C 63 53, 62 50, 61 47 C 60 45, 59 45, 58 47 C 57 49, 56 51, 55 51 C 54 51, 53 48, 52 46 C 51 44, 49 44, 48 46 C 47 48, 46 51, 45 51 C 44 51, 43 49, 42 47 C 41 45, 40 45, 39 47 C 38 50, 37 53, 36 51 C 35 48, 34 45, 33 45 C 32 45, 31 48, 30 51 C 29 54, 27 52, 27 48 Z" fill="#4d5b71" />
      {/* Hair top spike peak */}
      <path d="M 33 26 C 30 29, 32 23, 37 21 C 42 19, 48 20, 52 20 C 56 20, 62 19, 67 21 C 72 23, 74 29, 71 26 C 68 23, 62 21, 50 21 C 38 21, 35 23, 33 26 Z" fill="#4d5b71" />
    </svg>
  );
};

/**
 * Helper to generate a clean, responsive shortcut store title for compact mobile screens
 * E.g., "Le Souf Cuir & Rose des Sables" -> "Le Souf Cuir..."
 */
export const getShortcutStoreTitle = (name: string): string => {
  if (!name) return "";
  const trimmed = name.trim();

  // If there is a clause delimiter like &, -, |, •, :, or comma
  const delimiterMatch = trimmed.match(/^([^&|\-–—:•,]+)[&|\-–—:•,]/);
  if (delimiterMatch && delimiterMatch[1].trim().length >= 3) {
    const candidate = delimiterMatch[1].trim();
    if (candidate.length <= 16) {
      return `${candidate}...`;
    }
  }

  // If already short (<= 16 chars) and not more than 2 words, display as is
  const words = trimmed.split(/\s+/);
  if (trimmed.length <= 16 && words.length <= 2) {
    return trimmed;
  }

  // For multi-word titles, take first 2 words (or 3 if first two words are very short) + ...
  if (words.length > 2) {
    let takeCount = 2;
    if (words.length >= 3 && (words[0].length + words[1].length) <= 8) {
      takeCount = 3;
    }
    const shortPhrase = words.slice(0, takeCount).join(" ");
    return `${shortPhrase}...`;
  }

  // If it's a long single or double word (> 16 chars), truncate nicely
  return `${trimmed.slice(0, 14)}...`;
};

interface ProductPreviewNewWayProps {
  selectedProduct: Product;
  selectedStore: MerchantStore;
  myStore?: MerchantStore;
  currentUser?: {
    name: string;
    email: string;
    role: "Merchant" | "Buyer";
    storeName?: string;
  } | null;
  onClose: () => void;
  onOpenReels?: () => void;
  onOpenStoreProfile?: () => void;
  handleAddToCart: (product: Product, store: MerchantStore, quantity: number, variantSpeciallyFormatted?: string) => void;
  setCartTab: (tab: any) => void;
  setIsCartOpen: (open: boolean) => void;
  setLightboxProduct: (product: Product | null) => void;
  setLightboxImageIndex: (index: number) => void;
  currentSlideColor?: string;
  wishlist?: string[];
  handleToggleWishlist?: (id: string) => void;
  shippingRates?: {
    algiers: number;
    major: number;
    sahara: number;
    standard: number;
    isFlatRate: boolean;
    flatRateAmount: number;
  };
  comparedProducts?: Product[];
  onToggleCompare?: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
  onNotifyMe?: (
    productName: string,
    storeName: string,
    details?: {
      storeId: string;
      productId: string;
      productImage?: string;
      variantId?: string;
      variantLabel?: string;
    }
  ) => void;
  stockNotifyRequests?: StockNotifyRequest[];
  visitorIpKey?: string;
  partnerPickDiscoverItems?: Array<{
    product: Product;
    sourceStore: MerchantStore;
    placementId: string;
    partnershipId: string;
    slotPositionIndex: number;
  }>;
  onOpenPartnerPickDiscoverItem?: (item: {
    product: Product;
    sourceStore: MerchantStore;
    placementId: string;
    partnershipId: string;
  }) => void;
}

interface ThreadedComment {
  id: string;
  author: string;
  role?: string;
  badge?: string;
  text: string;
  avatar: string;
  avatarBg: string;
  time: string;
  likes: number;
  loves?: number;
  hahas?: number;
  liked?: boolean;
  loved?: boolean;
  hahad?: boolean;
  emoji?: string;
  images?: string[];
  purchasedVariant?: string;
  rating?: number;
  isHidden?: boolean;
  isPinned?: boolean;
  isLocked?: boolean;
  parentId?: string | null;
  replies?: ThreadedComment[];
}

interface AutoplayShowcaseVideoProps {
  url: string;
  isBerberRugProduct: boolean;
}

const AutoplayShowcaseVideo: React.FC<AutoplayShowcaseVideoProps> = ({ url, isBerberRugProduct }) => {
  const [isMuted, setIsMuted] = useState(true);

  const getFullShowcaseEmbed = (videoUrl: string): { type: string; embedUrl: string; videoId?: string } => {
    if (!videoUrl) {
      const defaultYtId = isBerberRugProduct ? "_POnm_C2Kts" : "GgA92gC4O3s";
      return {
        type: "youtube",
        videoId: defaultYtId,
        embedUrl: `https://www.youtube.com/embed/${defaultYtId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1&loop=1&playlist=${defaultYtId}`
      };
    }

    // YouTube formats
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      let videoId = "";
      if (videoUrl.includes("youtu.be/")) {
        videoId = videoUrl.split("youtu.be/")[1]?.split("?")[0] || "";
      } else if (videoUrl.includes("embed/")) {
        videoId = videoUrl.split("embed/")[1]?.split("?")[0] || "";
      } else if (videoUrl.includes("shorts/")) {
        videoId = videoUrl.split("shorts/")[1]?.split("?")[0] || "";
      } else if (videoUrl.includes("v=")) {
        videoId = videoUrl.split("v=")[1]?.split("&")[0] || "";
      }
      if (videoId) {
        return {
          type: "youtube",
          videoId,
          embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1&loop=1&playlist=${videoId}`
        };
      }
    }

    // Facebook formats
    if (videoUrl.includes("facebook.com") || videoUrl.includes("fb.watch") || videoUrl.includes("fb.com")) {
      return {
        type: "facebook",
        embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=0&autoplay=1&mute=${isMuted ? 1 : 0}`
      };
    }

    // Vimeo formats
    if (videoUrl.includes("vimeo.com")) {
      const vimeoMatches = videoUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
      const vimeoId = vimeoMatches ? vimeoMatches[3] : "";
      if (vimeoId) {
        return {
          type: "vimeo",
          embedUrl: isMuted 
            ? `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&muted=1` 
            : `https://player.vimeo.com/video/${vimeoId}?autoplay=1&loop=1&muted=0&controls=0`
        };
      }
    }

    // TikTok formats
    if (videoUrl.includes("tiktok.com")) {
      let videoId = "";
      const matches = videoUrl.match(/\/video\/(\d+)/);
      if (matches && matches[1]) {
        videoId = matches[1];
      } else {
        const embedMatches = videoUrl.match(/\/embed\/(\d+)/);
        if (embedMatches && embedMatches[1]) {
          videoId = embedMatches[1];
        }
      }
      
      if (videoId) {
        return {
          type: "tiktok",
          videoId,
          embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`
        };
      }
      
      const lastSegment = videoUrl.split("/").pop()?.split("?")[0] || "";
      if (/^\d+$/.test(lastSegment)) {
        return {
          type: "tiktok",
          videoId: lastSegment,
          embedUrl: `https://www.tiktok.com/embed/v2/${lastSegment}`
        };
      }
      
      return {
        type: "tiktok",
        embedUrl: videoUrl
      };
    }

    // Direct video formats
    if (videoUrl.endsWith(".mp4") || videoUrl.endsWith(".webm") || videoUrl.endsWith(".ogg") || videoUrl.includes(".mp4?")) {
      return {
        type: "direct",
        embedUrl: videoUrl
      };
    }

    return {
      type: "unknown",
      embedUrl: videoUrl
    };
  };

  const videoMeta = getFullShowcaseEmbed(url);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950/5 group/player border border-stone-200/60 shadow-xs transition-all hover:shadow-md">
      {/* Subtle blend styling - Background overlay with subtle opacity to blend with the rest of the page */}
      <div className="absolute inset-0 bg-slate-100/10 pointer-events-none transition-all group-hover/player:bg-transparent rounded-2xl z-10 mix-blend-multiply" />

      {videoMeta.type === "direct" ? (
        <video
          src={videoMeta.embedUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          controls={false}
          className="w-full h-full object-cover transition-opacity duration-300 opacity-95 group-hover/player:opacity-100"
        />
      ) : (
        <iframe
          src={videoMeta.embedUrl}
          title="Autoplay Showcase Video"
          className="w-full h-full border-0 transition-opacity duration-300 opacity-95 group-hover/player:opacity-100 pointer-events-none sm:pointer-events-auto"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      )}

      {/* Mute/Unmute Control Overlay */}
      <button
        type="button"
        onClick={() => setIsMuted(prev => !prev)}
        className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 bg-black/60 hover:bg-black/85 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-xs active:scale-95 transition-all select-none cursor-pointer border border-white/10"
      >
        {isMuted ? (
          <>
            <span className="text-xs">🔇</span>
            <span>UNMUTE SHOWCASE</span>
          </>
        ) : (
          <>
            <span className="text-xs">🔊</span>
            <span>MUTE</span>
          </>
        )}
      </button>

      {/* Auto-playing notification dot badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/45 text-white/95 text-[8.5px] font-extrabold tracking-widest uppercase px-2 py-1 rounded-md backdrop-blur-xs border border-white/5 select-none pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
        LIVE SHOWREEL
      </div>
    </div>
  );
};

const hexToRgba = (hex: string, alpha: number) => {
  if (!hex) return `rgba(235, 141, 112, ${alpha})`;
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const COLOR_MAP: Record<string, string> = {
  noir: "#111827",
  black: "#111827",
  onyx: "#18181b",
  midnight: "#0f172a",
  charcoal: "#374151",
  blanc: "#ffffff",
  white: "#ffffff",
  cream: "#fef3c7",
  ivory: "#fefce8",
  ecru: "#fcf8f2",
  pearl: "#f3f4f6",
  rouge: "#dc2626",
  red: "#dc2626",
  crimson: "#991b1b",
  ruby: "#be123c",
  bleu: "#2563eb",
  blue: "#2563eb",
  navy: "#1e3a8a",
  indigo: "#4338ca",
  sky: "#0284c7",
  azure: "#0ea5e9",
  vert: "#16a34a",
  green: "#16a34a",
  emerald: "#059669",
  olive: "#65a30d",
  sage: "#84a98c",
  moss: "#3f6212",
  jaune: "#eab308",
  yellow: "#eab308",
  amber: "#d97706",
  gold: "#eab308",
  dore: "#eab308",
  "doré": "#eab308",
  orange: "#ea580c",
  terracotta: "#c2410c",
  rust: "#9a3412",
  rose: "#ec4899",
  pink: "#ec4899",
  magenta: "#d946ef",
  violet: "#8b5cf6",
  purple: "#7c3aed",
  gris: "#6b7280",
  gray: "#6b7280",
  grey: "#6b7280",
  silver: "#94a3b8",
  argent: "#94a3b8",
  marron: "#78350f",
  brown: "#78350f",
  bronze: "#92400e",
  beige: "#f5ebe0",
  sand: "#f5e0c3",
  sable: "#f5e0c3",
  teal: "#0d9488",
  cyan: "#06b6d4",
  turquoise: "#14b8a6",
  khaki: "#a3a375",
  bordeaux: "#800020",
  burgundy: "#800020",
  titanium: "#94a3b8",
  aurora: "#fef08a",
  // Arabic colors & transliterations
  "اسود": "#111827",
  "أسود": "#111827",
  "ابيض": "#ffffff",
  "أبيض": "#ffffff",
  "احمر": "#dc2626",
  "أحمر": "#dc2626",
  "ازرق": "#2563eb",
  "أزرق": "#2563eb",
  "اخضر": "#16a34a",
  "أخضر": "#16a34a",
  "اصفر": "#eab308",
  "أصفر": "#eab308",
  "بني": "#78350f",
  "رمادي": "#6b7280",
  "وردي": "#ec4899",
  "زهري": "#ec4899",
  "ذهبي": "#eab308",
  "فضي": "#94a3b8",
  "برتقالي": "#ea580c",
  "بيج": "#f5ebe0",
  "كحلي": "#1e3a8a",
  "عنابي": "#800020",
  "خمري": "#800020",
  "زيتوني": "#65a30d",
  "سماوي": "#0284c7",
  "نيلي": "#4338ca",
  "زمردي": "#059669",
  "خوخي": "#fbcfe8",
  "كريمي": "#fef3c7"
};

const isColorOptionName = (name: string): boolean => {
  if (!name) return false;
  const n = name.toLowerCase().trim();
  return [
    "color", "couleur", "couleurs", "colors", "colour", "shade", "teinte", "coloris",
    "اللون", "لون", "ألوان", "الوان", "صبغة", "finition"
  ].some(c => n.includes(c));
};

const isSizeOptionName = (name: string): boolean => {
  if (!name) return false;
  const n = name.toLowerCase().trim();
  return [
    "size", "taille", "tailles", "sizes", "pointure", "مقاس", "حجم", "أحجام", "احجام"
  ].some(s => n.includes(s));
};

const resolveColorHex = (colorName: string, fallbackHex?: string): string => {
  if (!colorName) return fallbackHex || "#64748b";
  if (colorName.startsWith("#") || colorName.startsWith("rgb")) return colorName;
  const lower = colorName.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(name) || name.includes(lower)) return hex;
  }
  return fallbackHex || "#64748b";
};

const isColorDark = (hexColor: string): boolean => {
  if (!hexColor || !hexColor.startsWith("#")) return false;
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 140;
};

const MultiContactComboIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className}>
    {/* Green Circle Background */}
    <circle cx="50" cy="50" r="48" fill="#42B549" />
    {/* White Phone Handset */}
    <path
      d="M 33 67 C 24.5 58.5, 23.5 45.5, 31.5 37.5 L 37 43 C 38.3 44.3, 38.5 46.3, 37.7 48 L 35.3 52.7 C 34.7 53.9, 35 55.3, 36 56.3 L 43.7 64 C 44.7 65, 46.1 65.3, 47.3 64.7 L 52 62.3 C 53.7 61.5, 55.7 61.7, 57 63 L 62.5 68.5 C 54.5 76.5, 41.5 75.5, 33 67 Z"
      fill="white"
    />
    {/* Ringing Sound Waves */}
    <path
      d="M 53 43 A 12 12 0 0 1 61 51"
      stroke="white"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <path
      d="M 58 35 A 21 21 0 0 1 70 47"
      stroke="white"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <path
      d="M 63 27 A 30 30 0 0 1 79 43"
      stroke="white"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
  </svg>
);

export default function ProductPreviewNewWay({
  selectedProduct,
  selectedStore,
  myStore,
  currentUser,
  onClose,
  onOpenReels,
  onOpenStoreProfile,
  handleAddToCart,
  setCartTab,
  setIsCartOpen,
  setLightboxProduct,
  setLightboxImageIndex,
  currentSlideColor = "#eb8d70",
  wishlist = [],
  handleToggleWishlist,
  shippingRates,
  comparedProducts = [],
  onToggleCompare,
  onSelectProduct,
  onNotifyMe,
  stockNotifyRequests = [],
  visitorIpKey,
  partnerPickDiscoverItems = [],
  onOpenPartnerPickDiscoverItem,
}: ProductPreviewNewWayProps) {
  const isSimilarProductsEnabled = selectedStore?.designSettings?.showSimilarProducts !== false;

  const similarCarouselRef = useRef<HTMLDivElement>(null);
  const [similarScrollLeft, setSimilarScrollLeft] = useState(0);
  const [similarContainerWidth, setSimilarContainerWidth] = useState(600);
  const [similarHoveredIndex, setSimilarHoveredIndex] = useState<number | null>(null);
  const [isSimilarMouseOver, setIsSimilarMouseOver] = useState(false);
  const [canScrollSimilarLeft, setCanScrollSimilarLeft] = useState(false);
  const [canScrollSimilarRight, setCanScrollSimilarRight] = useState(true);

  // Physics & momentum drag state for similar products carousel
  const isSimilarDown = useRef(false);
  const similarStartX = useRef(0);
  const similarScrollLeftVal = useRef(0);
  const isSimilarDragging = useRef(false);
  
  const similarMomentumId = useRef<number | null>(null);
  const similarScrollAnimId = useRef<number | null>(null);
  const similarVelocity = useRef(0);
  const similarLastX = useRef(0);
  const similarLastTime = useRef(0);

  const customScrollSimilarTo = (element: HTMLElement, to: number, duration = 200) => {
    if (similarScrollAnimId.current) {
      cancelAnimationFrame(similarScrollAnimId.current);
    }
    const start = element.scrollLeft;
    const change = to - start;
    const startTime = performance.now();

    const animateScroll = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);

      element.scrollLeft = start + change * ease;

      if (progress < 1) {
        similarScrollAnimId.current = requestAnimationFrame(animateScroll);
      } else {
        checkSimilarScrollLimit();
      }
    };

    similarScrollAnimId.current = requestAnimationFrame(animateScroll);
  };

  const snapSimilarToItem = () => {
    if (!similarCarouselRef.current) return;
    const container = similarCarouselRef.current;
    const firstChild = container.firstElementChild as HTMLElement;
    if (firstChild) {
      const gap = 14;
      const itemWidth = firstChild.getBoundingClientRect().width || firstChild.offsetWidth;
      const scrollAmount = itemWidth + gap;
      const index = Math.round(container.scrollLeft / scrollAmount);
      customScrollSimilarTo(container, index * scrollAmount, 180);
    }
  };

  const startSimilarMomentumOrSnap = () => {
    if (!similarCarouselRef.current) return;
    
    if (isSimilarDragging.current && Math.abs(similarVelocity.current) > 0.15) {
      let vel = similarVelocity.current * 16;
      const friction = 0.95;
      const container = similarCarouselRef.current;
      
      const tick = () => {
        if (Math.abs(vel) < 0.25) {
          snapSimilarToItem();
          return;
        }
        
        container.scrollLeft += vel;
        vel *= friction;
        checkSimilarScrollLimit();
        
        similarMomentumId.current = requestAnimationFrame(tick);
      };
      
      similarMomentumId.current = requestAnimationFrame(tick);
    } else {
      snapSimilarToItem();
    }
  };

  const handleSimilarMouseDown = (e: React.MouseEvent) => {
    if (!similarCarouselRef.current) return;
    
    if (similarMomentumId.current) cancelAnimationFrame(similarMomentumId.current);
    if (similarScrollAnimId.current) cancelAnimationFrame(similarScrollAnimId.current);

    isSimilarDown.current = true;
    isSimilarDragging.current = false;
    similarStartX.current = e.pageX - similarCarouselRef.current.offsetLeft;
    similarScrollLeftVal.current = similarCarouselRef.current.scrollLeft;
    
    similarLastX.current = e.pageX;
    similarLastTime.current = performance.now();
    similarVelocity.current = 0;
    
    similarCarouselRef.current.style.scrollBehavior = "auto";
  };

  const handleSimilarMouseLeave = () => {
    if (!isSimilarDown.current) return;
    isSimilarDown.current = false;
    startSimilarMomentumOrSnap();
  };

  const handleSimilarMouseUp = () => {
    if (!isSimilarDown.current) return;
    isSimilarDown.current = false;
    startSimilarMomentumOrSnap();
  };

  const handleSimilarMouseMove = (e: React.MouseEvent) => {
    if (!isSimilarDown.current || !similarCarouselRef.current) return;
    e.preventDefault();
    
    const x = e.pageX - similarCarouselRef.current.offsetLeft;
    const walk = (x - similarStartX.current) * 1.6;
    
    if (Math.abs(walk) > 10) {
      isSimilarDragging.current = true;
    }
    
    similarCarouselRef.current.scrollLeft = similarScrollLeftVal.current - walk;
    
    const now = performance.now();
    const deltaX = e.pageX - similarLastX.current;
    const deltaTime = now - similarLastTime.current;
    if (deltaTime > 0) {
      similarVelocity.current = -deltaX / deltaTime;
    }
    similarLastX.current = e.pageX;
    similarLastTime.current = now;
    
    checkSimilarScrollLimit();
  };

  const checkSimilarScrollLimit = () => {
    if (similarCarouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = similarCarouselRef.current;
      setCanScrollSimilarLeft(scrollLeft > 6);
      setCanScrollSimilarRight(scrollLeft + clientWidth < scrollWidth - 6);
    }
  };

  const scrollSimilar = (direction: 'left' | 'right') => {
    if (similarCarouselRef.current) {
      const container = similarCarouselRef.current;
      const firstChild = container.firstElementChild as HTMLElement;
      if (firstChild) {
        const gap = 14;
        const itemWidth = firstChild.getBoundingClientRect().width || firstChild.offsetWidth;
        const scrollAmount = itemWidth + gap;
        const visibleCount = Math.max(1, Math.floor(container.clientWidth / scrollAmount));
        const itemsToScroll = Math.max(1, visibleCount > 1 ? visibleCount - 1 : 1);
        const scrollDistance = scrollAmount * itemsToScroll;
        
        let targetScroll = direction === 'left' 
          ? container.scrollLeft - scrollDistance 
          : container.scrollLeft + scrollDistance;
        
        const index = Math.round(targetScroll / scrollAmount);
        targetScroll = index * scrollAmount;
        
        customScrollSimilarTo(container, targetScroll, 200);
      }
    }
  };

  const similarProducts = useMemo(() => {
    if (!selectedStore || !Array.isArray(selectedStore.products)) return [];
    const currentId = selectedProduct?.id;
    const currentCat = (selectedProduct?.category || "").trim().toLowerCase();
    const currentSubcat = ((selectedProduct as any)?.subcategory || "").trim().toLowerCase();
    const currentTags = new Set(
      (Array.isArray(selectedProduct?.tags) ? selectedProduct.tags : [])
        .map((t) => String(t).trim().toLowerCase())
        .filter(Boolean)
    );

    const sameStoreCandidates = selectedStore.products.filter(
      (p) => p && p.id !== currentId && (!p.storeId || !selectedStore.id || p.storeId === selectedStore.id)
    );

    const getCategoryRelevanceScore = (candidate: Product): number => {
      const candCat = (candidate.category || "").trim().toLowerCase();
      const candSubcat = ((candidate as any).subcategory || "").trim().toLowerCase();
      let score = 0;

      if (currentCat && candCat) {
        if (candCat === currentCat) {
          score += 100;
        } else {
          const curPrefix = currentCat.split(/[_\s/&,-]+/)[0];
          const candPrefix = candCat.split(/[_\s/&,-]+/)[0];
          if (curPrefix && candPrefix && curPrefix === candPrefix) {
            score += 50;
          } else if (candCat.includes(currentCat) || currentCat.includes(candCat)) {
            score += 40;
          }
        }
      }

      if (currentSubcat && candSubcat && candSubcat === currentSubcat) {
        score += 60;
      }

      if (currentTags.size > 0 && Array.isArray(candidate.tags)) {
        for (const tag of candidate.tags) {
          if (currentTags.has(String(tag).trim().toLowerCase())) {
            score += 10;
          }
        }
      }

      return score;
    };

    return sameStoreCandidates
      .map((product, index) => ({
        product,
        index,
        score: getCategoryRelevanceScore(product),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.index - b.index;
      })
      .map((entry) => entry.product);
  }, [selectedStore, selectedProduct]);

  const combinedDiscoverEntries = useMemo(() => {
    const entries: Array<{
      product: Product;
      partnerPick?: {
        sourceStore: MerchantStore;
        placementId: string;
        partnershipId: string;
        slotPositionIndex: number;
      };
    }> = similarProducts.map((product) => ({ product }));

    if (Array.isArray(partnerPickDiscoverItems) && partnerPickDiscoverItems.length > 0) {
      const sortedPicks = [...partnerPickDiscoverItems].sort(
        (a, b) => (a.slotPositionIndex || 1) - (b.slotPositionIndex || 1)
      );
      for (const pick of sortedPicks) {
        if (!pick?.product || pick.product.id === selectedProduct?.id) continue;
        if (entries.some((e) => e.product.id === pick.product.id)) continue;
        const targetIdx = Math.max(0, Math.min(entries.length, (pick.slotPositionIndex || 2) - 1));
        entries.splice(targetIdx, 0, {
          product: pick.product,
          partnerPick: {
            sourceStore: pick.sourceStore,
            placementId: pick.placementId,
            partnershipId: pick.partnershipId,
            slotPositionIndex: pick.slotPositionIndex,
          },
        });
      }
    }

    return entries;
  }, [similarProducts, partnerPickDiscoverItems, selectedProduct]);

  useEffect(() => {
    checkSimilarScrollLimit();
    const container = similarCarouselRef.current;
    if (container) {
      let scrollTimeout: number | null = null;
      const handleScrollRealtime = () => {
        if (scrollTimeout) {
          cancelAnimationFrame(scrollTimeout);
        }
        scrollTimeout = requestAnimationFrame(() => {
          setSimilarScrollLeft(container.scrollLeft);
          checkSimilarScrollLimit();
        });
      };
      container.addEventListener("scroll", handleScrollRealtime, { passive: true });
      
      const handleResize = () => {
        setSimilarContainerWidth(container.clientWidth);
        checkSimilarScrollLimit();
      };
      window.addEventListener("resize", handleResize);

      setSimilarScrollLeft(container.scrollLeft);
      setSimilarContainerWidth(container.clientWidth);

      return () => {
        if (container) {
          container.removeEventListener("scroll", handleScrollRealtime);
        }
        if (scrollTimeout) {
          cancelAnimationFrame(scrollTimeout);
        }
        if (similarMomentumId.current) {
          cancelAnimationFrame(similarMomentumId.current);
        }
        if (similarScrollAnimId.current) {
          cancelAnimationFrame(similarScrollAnimId.current);
        }
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [similarProducts]);
  const getUserCommentIdentity = () => {
    if (!currentUser) {
      return {
        author: "Guest Buyer",
        role: "Guest",
        badge: "Guest",
        avatar: "/guest_avatar.jpg",
        avatarBg: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700"
      };
    }

    if (currentUser.role === "Merchant" || (currentUser as any).role === "Store Admin" || (currentUser as any).isMerchant) {
      const currentStoreNameLower = (selectedStore?.name || "").toLowerCase().trim();
      const currentStoreId = selectedStore?.id;
      
      const merchantStoreName = (myStore?.name || currentUser.storeName || currentUser.name || "Tapis Berbères Ath Yenni").trim();
      const merchantStoreNameLower = merchantStoreName.toLowerCase();
      const myStoreId = myStore?.id;
      const merchantLogo = myStore?.logo || "/src/assets/images/berber_store_logo_1780094183818.png";

      const isThisStoreOwner =
        (Boolean(myStoreId) && Boolean(currentStoreId) && myStoreId === currentStoreId) ||
        (Boolean(currentStoreNameLower) &&
          Boolean(merchantStoreNameLower) &&
          (currentStoreNameLower === merchantStoreNameLower ||
            currentStoreNameLower.includes(merchantStoreNameLower) ||
            merchantStoreNameLower.includes(currentStoreNameLower)));

      if (isThisStoreOwner) {
        return {
          author: selectedStore.name || merchantStoreName,
          role: "Store Admin",
          badge: "Store Admin",
          avatar: selectedStore.logo || (selectedStore as any)?.logoUrl || merchantLogo || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=150&auto=format&fit=crop&q=80",
          avatarBg: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800"
        };
      } else {
        return {
          author: merchantStoreName,
          role: "Merchant",
          badge: "Merchant",
          avatar: merchantLogo,
          avatarBg: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800"
        };
      }
    }

    // Default for signed in user (Buyer / Shopper):
    let customAvatar = (currentUser as any)?.avatar || (currentUser as any)?.photoURL || (currentUser as any)?.profilePic;
    if (!customAvatar) {
      try {
        const raw = localStorage.getItem("yume_current_user") || localStorage.getItem("yume_user") || localStorage.getItem("shopper_profile");
        if (raw) {
          const parsed = JSON.parse(raw);
          customAvatar = parsed?.avatar || parsed?.photoURL || parsed?.profilePic || parsed?.image;
        }
      } catch {
        // ignore
      }
    }
    const authorName = currentUser.name || "Shopper";
    const avatarIndex = hashStringToNumber(authorName || currentUser.email || "Shopper") % USER_AVATAR_POOL.length;
    const resolvedShopperAvatar = customAvatar || USER_AVATAR_POOL[avatarIndex];

    return {
      author: authorName,
      role: "Shopper",
      badge: "Shopper",
      avatar: resolvedShopperAvatar,
      avatarBg: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800"
    };
  };

  const [activeCountry, setActiveCountry] = useState<string>(() => {
    try {
      return localStorage.getItem("dz_country") || "Algeria";
    } catch {
      return "Algeria";
    }
  });

  useEffect(() => {
    const onCountryChange = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) {
        setActiveCountry(custom.detail);
      } else {
        setActiveCountry(localStorage.getItem("dz_country") || "Algeria");
      }
    };
    window.addEventListener("yume-country-change", onCountryChange);
    return () => window.removeEventListener("yume-country-change", onCountryChange);
  }, []);

  const getSizeSymbol = (sizeStr: string): string => {
    if (!sizeStr) return "";
    const parenMatch = sizeStr.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1]) {
      return parenMatch[1].trim();
    }
    const lower = sizeStr.trim().toLowerCase();
    if (lower === "extra small" || lower === "x-small" || lower === "xs") return "XS";
    if (lower === "small" || lower === "s") return "S";
    if (lower === "medium" || lower === "m") return "M";
    if (lower === "large" || lower === "l") return "L";
    if (lower === "extra large" || lower === "x-large" || lower === "xl") return "XL";
    if (lower === "2x-large" || lower === "xx-large" || lower === "2xl" || lower === "xxl") return "XXL";
    if (lower === "3x-large" || lower === "xxx-large" || lower === "3xl" || lower === "xxxl") return "3XL";
    return sizeStr;
  };

  const isBerberRugProduct =
    selectedProduct.id === "p_1_1" ||
    selectedProduct.name.toLowerCase().includes("rug") ||
    selectedProduct.name.toLowerCase().includes("tapis");

  const colorOptions = useMemo(() => {
    return filterExistingProductColors({
      colors: selectedProduct.colors,
      variants: selectedProduct.variants,
      isBerberRugProduct,
    });
  }, [selectedProduct.colors, selectedProduct.variants, isBerberRugProduct]);

  const sizeOptions = useMemo(() => {
    if (selectedProduct.sizes && selectedProduct.sizes.length > 0) {
      return selectedProduct.sizes;
    }
    if (isBerberRugProduct) {
      return ["4ft x 6ft", "6ft x 9ft (Generous)", "8ft x 10ft (Grand)"];
    }
    return [];
  }, [selectedProduct.sizes, isBerberRugProduct]);

  const [chosenColor, setChosenColor] = useState("");
  const [chosenSize, setChosenSize] = useState("");

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Coordinated YUME Network accent color randomized on each page refresh / product view
  // Synchronizes the curved left accent on both Product Details and About This Item
  const synchronizedAccentColor = useMemo(() => {
    return pickRandomYumeAccentColor();
  }, [selectedProduct.id]);

  const isFashionCategory = useMemo(() => {
    return isFashionProductCategory(
      selectedProduct.category,
      selectedProduct.subcategory,
      selectedProduct.name
    );
  }, [selectedProduct.category, selectedProduct.subcategory, selectedProduct.name]);

  const variantOptions = useMemo<Record<string, string[]>>(() => {
    if (!selectedProduct.variants || selectedProduct.variants.length === 0) return {};
    const rawOptions: Record<string, string[]> = {};
    const existingColorNames = new Set(
      colorOptions.map((c: any) => String(c.name || "").trim().toLowerCase()).filter(Boolean)
    );
    selectedProduct.variants.forEach((v) => {
      Object.entries(v.options).forEach(([name, value]) => {
        if (!value) return;
        // Fit is displayed strictly on About this item, never as an interactive buy card variant button
        const normName = name.trim().toLowerCase();
        if (["fit", "fit type", "coupe", "قصة", "قَصَّة"].some(k => normName === k || normName.includes(k))) {
          return;
        }
        // On fashion products, exclude season, brand, etc. from interactive variants
        if (isFashionCategory && isFashionNonVariantAttribute(name)) {
          return;
        }
        if (isColorOptionName(name) && existingColorNames.size > 0) {
          if (!existingColorNames.has(String(value).trim().toLowerCase())) {
            return;
          }
        }
        if (!rawOptions[name]) rawOptions[name] = [];
        if (!rawOptions[name].includes(value)) {
          rawOptions[name].push(value);
        }
      });
    });
    const sortedEntries = sortVariantOptionEntries(Object.entries(rawOptions));
    const ordered: Record<string, string[]> = {};
    sortedEntries.forEach(([k, vals]) => {
      if (vals.length > 0) {
        ordered[k] = vals;
      }
    });
    return ordered;
  }, [selectedProduct.variants, colorOptions, isFashionCategory]);

  const matchedVariant = useMemo(() => {
    if (!selectedProduct.variants || selectedProduct.variants.length === 0) return null;
    return selectedProduct.variants.find(v => {
      return Object.entries(v.options).every(([name, value]) => {
        const normName = name.trim().toLowerCase();
        if (["fit", "fit type", "coupe", "قصة", "قَصَّة"].some(k => normName === k || normName.includes(k))) {
          return true;
        }
        if (isFashionCategory && isFashionNonVariantAttribute(name)) {
          return true;
        }
        return (selectedOptions[name] || "").toLowerCase() === (value || "").toLowerCase();
      });
    });
  }, [selectedProduct.variants, selectedOptions, isFashionCategory]);

  // Check whether the product has any configurable options or variants (colors, sizes, dynamic variant attributes)
  const hasProductOptions = useMemo(() => {
    const hasColors = Boolean(colorOptions && colorOptions.length > 0);
    const hasSizes = Boolean(sizeOptions && sizeOptions.length > 0);
    const hasVariants = Boolean(variantOptions && Object.keys(variantOptions).length > 0);
    return hasColors || hasSizes || hasVariants;
  }, [colorOptions, sizeOptions, variantOptions]);

  // Selected variant labels (if any selected by customer)
  const selectedVariantSummaryLabels = useMemo(() => {
    const list: string[] = [];
    if (chosenColor) list.push(chosenColor);
    if (chosenSize) list.push(chosenSize);
    if (selectedOptions && Object.keys(selectedOptions).length > 0) {
      Object.entries(selectedOptions).forEach(([, v]) => {
        const strVal = typeof v === "string" ? v : (v ? String(v) : "");
        if (strVal && !list.includes(strVal)) {
          list.push(strVal);
        }
      });
    }
    return list;
  }, [chosenColor, chosenSize, selectedOptions]);

  // Buy Card Item row visibility:
  // Do not display until the customer has selected the variants;
  // however, if a product has no options, display the item immediately.
  const shouldDisplayBuyCardItem = useMemo(() => {
    if (!hasProductOptions) return true;
    return selectedVariantSummaryLabels.length > 0;
  }, [hasProductOptions, selectedVariantSummaryLabels.length]);

  const hasUserSelectedVariant = useMemo(() => {
    return selectedVariantSummaryLabels.length > 0;
  }, [selectedVariantSummaryLabels.length]);

  // Helper to normalize and deduplicate image URLs by stripping extraneous resize queries
  const normalizeImageUrlKey = useCallback((raw: string): string => {
    if (!raw || typeof raw !== "string") return "";
    try {
      const urlObj = new URL(raw, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      return (urlObj.origin + urlObj.pathname).toLowerCase().replace(/\/$/, "");
    } catch {
      return raw.split("?")[0].trim().toLowerCase().replace(/\/$/, "");
    }
  }, []);

  const galleryImages = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    const addImg = (rawUrl: unknown) => {
      if (!rawUrl || typeof rawUrl !== "string") return;
      const trimmed = rawUrl.trim();
      if (!trimmed || trimmed === "null" || trimmed === "undefined" || trimmed === "[object Object]") return;
      const key = normalizeImageUrlKey(trimmed);
      if (!key || seen.has(key)) return;
      seen.add(key);
      list.push(trimmed);
    };

    // If Detailed Images Per Color is enabled and a color is selected, display that color's primary image + its up to 5 detailed images
    if (selectedProduct.detailedImagesPerColorEnabled && chosenColor && selectedProduct.colors && Array.isArray(selectedProduct.colors)) {
      const matchedColor = selectedProduct.colors.find(
        (c) => c && typeof c === "object" && (c.name || "").trim().toLowerCase() === chosenColor.trim().toLowerCase()
      );
      if (matchedColor) {
        const primaryColorUrl = matchedColor.imageUrl || matchedColor.image || (Array.isArray(matchedColor.images) ? matchedColor.images[0] : "");
        if (primaryColorUrl) {
          addImg(primaryColorUrl);
          const mappedDetails = selectedProduct.detailedImagesByPrimary?.[primaryColorUrl];
          if (Array.isArray(mappedDetails) && mappedDetails.length > 0) {
            mappedDetails.slice(0, 5).forEach((dUrl) => addImg(dUrl));
          } else if (Array.isArray(matchedColor.images) && matchedColor.images.length > 1) {
            matchedColor.images.slice(1, 6).forEach((dUrl) => addImg(dUrl));
          }
          if (list.length > 0) {
            return list;
          }
        }
      }
    }

    // 1. Primary product images
    if (selectedProduct.images && Array.isArray(selectedProduct.images)) {
      selectedProduct.images.forEach(img => addImg(img));
    }

    // 2. Main product imageUrl
    addImg(selectedProduct.imageUrl);

    // 3. Images from color variants ONLY IF specifically linked and not already present
    if (selectedProduct.colors && Array.isArray(selectedProduct.colors)) {
      selectedProduct.colors.forEach(col => {
        if (col.images && Array.isArray(col.images)) {
          col.images.forEach(img => addImg(img));
        }
        if (col.imageUrl) {
          addImg(col.imageUrl);
        }
        if ((col as any).image) {
          addImg((col as any).image);
        }
      });
    }

    // 4. Images from variants ONLY IF specifically assigned and not duplicates
    if (selectedProduct.variants && Array.isArray(selectedProduct.variants)) {
      selectedProduct.variants.forEach(v => {
        if (v.images && Array.isArray(v.images)) {
          v.images.forEach(img => addImg(img));
        }
        if (v.imageUrl) {
          addImg(v.imageUrl);
        }
        if ((v as any).image) {
          addImg((v as any).image);
        }
      });
    }

    return list.length > 0 ? list : [selectedProduct.imageUrl || ""].filter(Boolean);
  }, [
    selectedProduct.images,
    selectedProduct.imageUrl,
    selectedProduct.colors,
    selectedProduct.variants,
    selectedProduct.detailedImagesPerColorEnabled,
    selectedProduct.detailedImagesByPrimary,
    chosenColor,
    normalizeImageUrlKey,
  ]);

  const mainProductImages = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    const addImg = (rawUrl: unknown) => {
      if (!rawUrl || typeof rawUrl !== "string") return;
      const trimmed = rawUrl.trim();
      if (!trimmed || trimmed === "null" || trimmed === "undefined" || trimmed === "[object Object]") return;
      const key = normalizeImageUrlKey(trimmed);
      if (!key || seen.has(key)) return;
      seen.add(key);
      list.push(trimmed);
    };

    // 1. Primary product cover image
    if (selectedProduct.imageUrl) {
      addImg(selectedProduct.imageUrl);
    }

    // 2. All main uploaded product images
    if (selectedProduct.images && Array.isArray(selectedProduct.images)) {
      selectedProduct.images.forEach(img => addImg(img));
    }

    // Fallback if empty
    if (list.length === 0 && galleryImages.length > 0) {
      list.push(galleryImages[0]);
    }

    return list.length > 0 ? list : [selectedProduct.imageUrl || ""].filter(Boolean);
  }, [selectedProduct.imageUrl, selectedProduct.images, galleryImages, normalizeImageUrlKey]);

  // Sidebar thumbnails: Before user selects variants, show ALL the main images on the sidebar
  const sidebarThumbnails = useMemo(() => {
    if (hasProductOptions && !hasUserSelectedVariant) {
      return mainProductImages.length > 0 ? mainProductImages : galleryImages;
    }
    return galleryImages;
  }, [hasProductOptions, hasUserSelectedVariant, mainProductImages, galleryImages]);

  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const currentPreviewImage = useMemo(() => {
    if (hasProductOptions && !hasUserSelectedVariant) {
      return sidebarThumbnails[activeImgIdx] || sidebarThumbnails[0] || selectedProduct.imageUrl || "";
    }
    return galleryImages[activeImgIdx] || sidebarThumbnails[0] || selectedProduct.imageUrl || "";
  }, [hasProductOptions, hasUserSelectedVariant, sidebarThumbnails, galleryImages, activeImgIdx, selectedProduct.imageUrl]);

  useEffect(() => {
    const currentList = (hasProductOptions && !hasUserSelectedVariant) ? sidebarThumbnails : galleryImages;
    if (activeImgIdx >= currentList.length && currentList.length > 0) {
      setActiveImgIdx(0);
    }
  }, [hasProductOptions, hasUserSelectedVariant, sidebarThumbnails, galleryImages, activeImgIdx]);

  // Helper to reliably find image index in galleryImages with exact, normalized, filename or substring match
  const findImageInGallery = useCallback((imgUrl: string | undefined): number => {
    if (!imgUrl || typeof imgUrl !== "string") return -1;
    const targetKey = normalizeImageUrlKey(imgUrl);
    // 1. Exact or normalized key match
    let idx = galleryImages.findIndex(img => normalizeImageUrlKey(img) === targetKey || img === imgUrl);
    if (idx >= 0) return idx;
    // 2. Substring or filename match
    const filename = imgUrl.split("/").pop()?.split("?")[0].toLowerCase() || "";
    if (filename && filename.length > 2) {
      idx = galleryImages.findIndex(img => img.toLowerCase().includes(filename));
      if (idx >= 0) return idx;
    }
    return -1;
  }, [galleryImages, normalizeImageUrlKey]);

  const allAvailableColors = useMemo(() => {
    const list: string[] = [];
    if (colorOptions && colorOptions.length > 0) {
      colorOptions.forEach((c: any) => {
        if (c.name && !list.includes(c.name)) list.push(c.name);
      });
    }
    if (variantOptions["Color"]) {
      variantOptions["Color"].forEach((val) => {
        if (val && !list.includes(val)) list.push(val);
      });
    }
    if (selectedProduct.colors && selectedProduct.colors.length > 0) {
      selectedProduct.colors.forEach((c: any) => {
        if (c.name && !list.includes(c.name)) list.push(c.name);
      });
    }
    return list;
  }, [colorOptions, variantOptions, selectedProduct.colors]);

  const allAvailableSizes = useMemo(() => {
    const list: string[] = [];
    if (sizeOptions && sizeOptions.length > 0) {
      sizeOptions.forEach((s) => {
        if (s && !list.includes(s)) list.push(s);
      });
    }
    if (variantOptions["Size"]) {
      variantOptions["Size"].forEach((val) => {
        if (val && !list.includes(val)) list.push(val);
      });
    }
    return list;
  }, [sizeOptions, variantOptions]);

  const allAvailableModels = useMemo(() => {
    const modelKey = Object.keys(variantOptions).find(k => ["model", "modèle", "modele", "موديل"].some(m => k.toLowerCase().includes(m)));
    if (modelKey && variantOptions[modelKey]) {
      return variantOptions[modelKey];
    }
    return [];
  }, [variantOptions]);

  const aboutItemSpecs = useMemo(() => {
    // Static product information summary (Requirement 4: independent of customer's selected options)
    const staticNonVariantSpecs: Record<string, string> = {};
    if (selectedProduct.specifications) {
      selectedProduct.specifications.forEach(s => {
        if (s.key && s.value) {
          staticNonVariantSpecs[s.key] = s.value;
        }
      });
    }
    // Also include default non-variant attributes from product definition (Brand, Fit, Season)
    if (selectedProduct.variants?.[0]?.options) {
      Object.entries(selectedProduct.variants[0].options).forEach(([k, val]) => {
        if (isFashionCategory && isFashionNonVariantAttribute(k)) {
          if (!staticNonVariantSpecs[k] && val) {
            staticNonVariantSpecs[k] = String(val);
          }
        }
      });
    }

    // Collect all variant fits if defined across variants
    const allVariantFits = Array.from(new Set(
      (selectedProduct.variants || [])
        .map(v => {
          if (!v.options) return null;
          for (const [k, val] of Object.entries(v.options)) {
            const nk = k.trim().toLowerCase();
            if (["fit", "fit type", "coupe", "قصة", "قَصَّة"].some(x => nk === x || nk.includes(x))) {
              return val;
            }
          }
          return null;
        })
        .filter(Boolean)
    ));
    if (allVariantFits.length > 0 && !staticNonVariantSpecs["Fit"]) {
      staticNonVariantSpecs["Fit"] = allVariantFits.join(", ");
    }

    return filterAndSortAboutItemSpecs(
      selectedProduct.specifications || [],
      {
        brand: (selectedProduct as any).brand,
        subcategory: (selectedProduct as any).subcategory,
        nonVariantOptions: staticNonVariantSpecs,
        availableColors: allAvailableColors,
        availableSizes: allAvailableSizes,
        availableModels: allAvailableModels,
      }
    );
  }, [selectedProduct.specifications, (selectedProduct as any).brand, (selectedProduct as any).subcategory, isFashionCategory, selectedProduct.variants, allAvailableColors, allAvailableSizes, allAvailableModels]);

  // Helper to unselect a specific variant option or reset all options
  const handleUnselectOption = (optionName?: string) => {
    if (!optionName) {
      setSelectedOptions({});
      setChosenColor(undefined);
      setChosenSize(undefined);
      setActiveThemeColor((selectedProduct as any).primaryColor || "#e47911");
      setActiveImgIdx(0);
      return;
    }

    const isColorChoice = isColorOptionName(optionName);
    const isSizeChoice = isSizeOptionName(optionName);

    setSelectedOptions(prev => {
      const next = { ...prev };
      delete next[optionName];
      return next;
    });

    if (isColorChoice) {
      setChosenColor(undefined);
      setActiveThemeColor((selectedProduct as any).primaryColor || "#e47911");
    }
    if (isSizeChoice) {
      setChosenSize(undefined);
    }
    setActiveImgIdx(0);
  };

  // Helper to handle option selection keeping valid combinations only (toggles off if clicking selected)
  const handleSelectOption = (optionName: string, optionValue: string) => {
    const isColorChoice = isColorOptionName(optionName);
    const isSizeChoice = isSizeOptionName(optionName);

    // If clicking the already selected option value, unselect it
    const currentVal = selectedOptions[optionName] || (isColorChoice ? chosenColor : (isSizeChoice ? chosenSize : undefined));
    if (currentVal && currentVal.toLowerCase() === optionValue.toLowerCase()) {
      handleUnselectOption(optionName);
      return;
    }

    if (!selectedProduct.variants || selectedProduct.variants.length === 0) {
      setSelectedOptions(prev => ({ ...prev, [optionName]: optionValue }));
      if (isColorChoice) {
        setChosenColor(optionValue);
        const colorSpec = selectedProduct.colors?.find(c => c.name.toLowerCase() === optionValue.toLowerCase());
        if (colorSpec?.hex) {
          setActiveThemeColor(colorSpec.hex);
        } else {
          setActiveThemeColor(resolveColorHex(optionValue));
        }
        const colorImg = colorSpec?.imageUrl || (colorSpec as any)?.image || (colorSpec?.images && colorSpec.images[0]);
        if (colorImg) {
          const foundIdx = findImageInGallery(colorImg);
          if (foundIdx >= 0) setActiveImgIdx(foundIdx);
        }
      } else if (isSizeChoice) {
        setChosenSize(optionValue);
      }
      return;
    }

    // 1. Check if candidate combination matches an existing variant directly
    const candidate = { ...selectedOptions, [optionName]: optionValue };
    const exactMatch = selectedProduct.variants.find(v => {
      return Object.entries(v.options).every(([k, val]) => {
        if (isFashionCategory && isFashionNonVariantAttribute(k)) {
          return true;
        }
        return (candidate[k] || "").toLowerCase() === (val || "").toLowerCase();
      });
    });

    let targetVariant = exactMatch;

    // 2. If no direct match, find all supported variants with [optionName] === optionValue
    if (!targetVariant) {
      const compatibleVariants = selectedProduct.variants.filter(v => {
        const val = Object.entries(v.options).find(([k]) => k.toLowerCase() === optionName.toLowerCase())?.[1];
        return (val || "").toLowerCase() === optionValue.toLowerCase();
      });

      if (compatibleVariants.length > 0) {
        // Score variants by how many current option choices they retain, preferring in-stock
        let bestScore = -1;
        compatibleVariants.forEach(v => {
          let score = 0;
          Object.entries(selectedOptions).forEach(([k, val]) => {
            if (k.toLowerCase() !== optionName.toLowerCase()) {
              const vVal = Object.entries(v.options).find(([vk]) => vk.toLowerCase() === k.toLowerCase())?.[1];
              if (vVal && String(vVal).toLowerCase() === String(val).toLowerCase()) {
                score += 2;
              }
            }
          });
          const isInStockVar = v.stock > 0 && (v as any).availability !== "out_of_stock";
          if (isInStockVar) score += 1;

          if (score > bestScore) {
            bestScore = score;
            targetVariant = v;
          }
        });
      }
    }

    if (targetVariant && targetVariant.options) {
      setSelectedOptions({ ...targetVariant.options });
      // Sync color and theme
      const colorVal = Object.entries(targetVariant.options).find(([k]) => isColorOptionName(k))?.[1] || (isColorChoice ? optionValue : undefined);
      let colorFoundIdx = -1;
      if (colorVal) {
        setChosenColor(colorVal);
        const colorSpec = selectedProduct.colors?.find(c => c.name.toLowerCase() === colorVal.toLowerCase());
        if (colorSpec?.hex) setActiveThemeColor(colorSpec.hex);
        else setActiveThemeColor(resolveColorHex(colorVal));

        const colorImg = colorSpec?.imageUrl || (colorSpec as any)?.image || (colorSpec?.images && colorSpec.images[0]);
        if (colorImg) {
          colorFoundIdx = findImageInGallery(colorImg);
          if (colorFoundIdx >= 0) setActiveImgIdx(colorFoundIdx);
        }
      }
      // Sync size
      const sizeVal = Object.entries(targetVariant.options).find(([k]) => isSizeOptionName(k))?.[1] || (isSizeChoice ? optionValue : undefined);
      if (sizeVal) {
        setChosenSize(sizeVal);
      }
      // If color image wasn't found, try targetVariant's assigned image
      if (colorFoundIdx === -1) {
        const varImg = (targetVariant.images && targetVariant.images[0]) || targetVariant.imageUrl || (targetVariant as any)?.image;
        if (varImg) {
          const foundIdx = findImageInGallery(varImg);
          if (foundIdx >= 0) setActiveImgIdx(foundIdx);
        }
      }
    } else {
      setSelectedOptions(prev => ({ ...prev, [optionName]: optionValue }));
      if (isColorChoice) {
        setChosenColor(optionValue);
        const colorSpec = selectedProduct.colors?.find(c => c.name.toLowerCase() === optionValue.toLowerCase());
        if (colorSpec?.hex) setActiveThemeColor(colorSpec.hex);
        else setActiveThemeColor(resolveColorHex(optionValue));

        const colorImg = colorSpec?.imageUrl || (colorSpec as any)?.image || (colorSpec?.images && colorSpec.images[0]);
        if (colorImg) {
          const foundIdx = findImageInGallery(colorImg);
          if (foundIdx >= 0) setActiveImgIdx(foundIdx);
        }
      } else if (isSizeChoice) {
        setChosenSize(optionValue);
      }
    }
  };

  // Helper to query stock status for any given option value
  const getOptionValueStockStatus = (optionName: string, optionValue: string): "in_stock" | "low_stock" | "out_of_stock" => {
    if (!selectedProduct.variants || selectedProduct.variants.length === 0) return "in_stock";
    // Check direct combination
    const candidate = { ...selectedOptions, [optionName]: optionValue };
    const directMatch = selectedProduct.variants.find(v => {
      return Object.entries(v.options).every(([k, vVal]) => {
        if (isFashionCategory && isFashionNonVariantAttribute(k)) {
          return true;
        }
        return (candidate[k] || "").toLowerCase() === (vVal || "").toLowerCase();
      });
    });
    if (directMatch) {
      if (directMatch.stock <= 0 || (directMatch as any).availability === "out_of_stock") return "out_of_stock";
      if (directMatch.stock <= 5 || (directMatch as any).availability === "low_stock") return "low_stock";
      return "in_stock";
    }
    // Check all variants with this value
    const withVal = selectedProduct.variants.filter(v => {
      const vVal = Object.entries(v.options).find(([k]) => k.toLowerCase() === optionName.toLowerCase())?.[1];
      return (vVal || "").toLowerCase() === optionValue.toLowerCase();
    });
    if (withVal.length > 0 && withVal.every(v => v.stock <= 0 || (v as any).availability === "out_of_stock")) {
      return "out_of_stock";
    }
    return "in_stock";
  };

  // Helper to query specific price for any option value or variant combination
  const getOptionPrice = (optionName: string, optionValue: string): number | undefined => {
    if (selectedProduct.variants && selectedProduct.variants.length > 0) {
      // 1. Direct combination match with currently selected options
      const candidate = { ...selectedOptions, [optionName]: optionValue };
      const directMatch = selectedProduct.variants.find(v => {
        return Object.entries(v.options).every(([k, vVal]) => {
          if (isFashionCategory && isFashionNonVariantAttribute(k)) {
            return true;
          }
          return (candidate[k] || "").toLowerCase() === (vVal || "").toLowerCase();
        });
      });
      if (directMatch && typeof directMatch.price === "number") {
        return directMatch.price;
      }

      // 2. Fallback: any variant with this option value
      const anyMatch = selectedProduct.variants.find(v => {
        const vVal = Object.entries(v.options).find(([k]) => k.toLowerCase() === optionName.toLowerCase())?.[1];
        return (vVal || "").toLowerCase() === optionValue.toLowerCase();
      });
      if (anyMatch && typeof anyMatch.price === "number") {
        return anyMatch.price;
      }
    }

    // 3. Check standalone colors array
    const isColor = isColorOptionName(optionName);
    if (isColor && selectedProduct.colors) {
      const cSpec = selectedProduct.colors.find(c => c.name.toLowerCase() === optionValue.toLowerCase());
      if (cSpec && typeof (cSpec as any).price === "number") {
        return (cSpec as any).price;
      }
    }

    // 4. Check standalone sizes with linked prices
    const isSize = isSizeOptionName(optionName);
    if (isSize) {
      if (selectedProduct.sizePrices && typeof selectedProduct.sizePrices[optionValue] === "number") {
        return selectedProduct.sizePrices[optionValue];
      }
      if (selectedProduct.sizesWithPrices && Array.isArray(selectedProduct.sizesWithPrices)) {
        const sSpec = selectedProduct.sizesWithPrices.find((s: any) => s && s.name && s.name.toLowerCase() === optionValue.toLowerCase());
        if (sSpec && typeof sSpec.price === "number") {
          return sSpec.price;
        }
      }
    }

    return undefined;
  };

  // Reset variant selection when product changes (do not pre-select color, size, or variants on page open)
  useEffect(() => {
    setSelectedOptions({});
    setChosenColor("");
    setChosenSize("");
  }, [selectedProduct.id]);

  // Dynamic Technical Specifications derived purely from seller-configured variants and specifications
  const dynamicTechnicalSpecs = useMemo(() => {
    type SpecRow = {
      id: string;
      key: string;
      label: string;
      isSelectable: boolean;
      options?: string[];
      selectedValue?: string;
      staticValue?: string;
      isColor?: boolean;
    };

    const rows: SpecRow[] = [];

    // 1. Add seller-configured specifications (specifications list)
    if (selectedProduct.specifications && selectedProduct.specifications.length > 0) {
      selectedProduct.specifications.forEach((spec, idx) => {
        if (!spec.key || !spec.value) return;
        // Check if there is a matching variantOption for this spec key (case-insensitive)
        const matchingVariantKey = Object.keys(variantOptions).find(
          k => k.toLowerCase() === spec.key.toLowerCase() ||
               k.toLowerCase().includes(spec.key.toLowerCase()) ||
               spec.key.toLowerCase().includes(k.toLowerCase())
        );

        if (matchingVariantKey && variantOptions[matchingVariantKey]?.length > 0) {
          const optVals = variantOptions[matchingVariantKey];
          const isColor = matchingVariantKey.toLowerCase() === "color" || matchingVariantKey.toLowerCase() === "couleur";
          rows.push({
            id: `spec-var-${matchingVariantKey}-${idx}`,
            key: matchingVariantKey,
            label: spec.key,
            isSelectable: optVals.length > 1,
            options: optVals,
            selectedValue: selectedOptions[matchingVariantKey] || optVals[0],
            staticValue: spec.value,
            isColor
          });
        } else {
          // Static spec row configured by seller
          rows.push({
            id: `spec-static-${spec.key}-${idx}`,
            key: spec.key,
            label: spec.key,
            isSelectable: false,
            staticValue: spec.value
          });
        }
      });
    }

    // 2. Add any seller-configured variant options that weren't already included in specifications
    if (variantOptions && Object.keys(variantOptions).length > 0) {
      Object.entries(variantOptions).forEach(([optName, rawOptVals], idx) => {
        const optVals: string[] = Array.isArray(rawOptVals) ? rawOptVals : [];
        const alreadyIncluded = rows.some(
          r => r.key.toLowerCase() === optName.toLowerCase() || 
               r.label.toLowerCase() === optName.toLowerCase() ||
               r.label.toLowerCase().includes(optName.toLowerCase()) ||
               optName.toLowerCase().includes(r.label.toLowerCase())
        );
        if (!alreadyIncluded && optVals.length > 0) {
          const isColor = optName.toLowerCase() === "color" || optName.toLowerCase() === "couleur";
          rows.push({
            id: `var-opt-${optName}-${idx}`,
            key: optName,
            label: optName,
            isSelectable: optVals.length > 1,
            options: optVals,
            selectedValue: selectedOptions[optName] || optVals[0],
            staticValue: optVals[0],
            isColor
          });
        }
      });
    }

    // 3. Fallback only if Electronics and no variants/specs configured yet, but colors or sizes exist
    if (rows.length === 0 && selectedProduct.category === "Electronics") {
      if (selectedProduct.colors && selectedProduct.colors.length > 0) {
        rows.push({
          id: "color-spec-opt",
          key: "Color",
          label: "Color",
          isSelectable: selectedProduct.colors.length > 1,
          options: selectedProduct.colors.map(c => c.name),
          selectedValue: chosenColor || selectedProduct.colors[0]?.name,
          isColor: true
        });
      }
      if (selectedProduct.sizes && selectedProduct.sizes.length > 0) {
        rows.push({
          id: "size-spec-opt",
          key: "Size",
          label: "Size",
          isSelectable: selectedProduct.sizes.length > 1,
          options: selectedProduct.sizes,
          selectedValue: chosenSize || selectedProduct.sizes[0]
        });
      }
    }

    return rows;
  }, [selectedProduct.specifications, selectedProduct.colors, selectedProduct.sizes, selectedProduct.category, variantOptions, selectedOptions, chosenColor, chosenSize]);

  const activeColorSpec = useMemo(() => {
    if (!chosenColor) return null;
    return selectedProduct.colors?.find(
      c => c.name.toLowerCase() === chosenColor.toLowerCase()
    ) || null;
  }, [selectedProduct.colors, chosenColor]);

  const isDiscountEnabled = !!selectedProduct.discountEnabled;
  const discountPercentValue = selectedProduct.discountPercent !== undefined ? selectedProduct.discountPercent : 15;
  const matchedSizePrice = chosenSize && (
    (selectedProduct.sizePrices && typeof selectedProduct.sizePrices[chosenSize] === "number" ? selectedProduct.sizePrices[chosenSize] : undefined) ||
    (selectedProduct.sizesWithPrices && Array.isArray(selectedProduct.sizesWithPrices)
      ? selectedProduct.sizesWithPrices.find((s: any) => s && s.name && s.name.toLowerCase() === chosenSize.toLowerCase())?.price
      : undefined)
  );

  const defaultBasePrice = useMemo(() => {
    return getProductBasePrice(selectedProduct);
  }, [selectedProduct]);

  const variantBasePrice = matchedVariant?.price !== undefined && matchedVariant.price > 0
    ? matchedVariant.price 
    : (matchedSizePrice !== undefined && matchedSizePrice > 0
        ? matchedSizePrice
        : (activeColorSpec && typeof (activeColorSpec as any).price === "number" && (activeColorSpec as any).price > 0
            ? (activeColorSpec as any).price 
            : defaultBasePrice));
  const activePrice = isBerberRugProduct
    ? 28900
    : (isDiscountEnabled
        ? Math.round(variantBasePrice * (1 - discountPercentValue / 100))
        : variantBasePrice);

  // --- YUME OFFERS & PROMOTIONS STATE & CALCULATIONS ---
  const isOffersActive = Boolean(
    selectedProduct.offersConfig?.enabled &&
      Array.isArray(selectedProduct.offersConfig?.tiers) &&
      selectedProduct.offersConfig.tiers.length > 0
  );

  const [selectedOfferTierId, setSelectedOfferTierId] = useState<string>(
    () =>
      selectedProduct.offersConfig?.defaultSelectedTierId ||
      selectedProduct.offersConfig?.tiers?.[0]?.id ||
      "tier-1"
  );
  const [rawOfferUnitSelections, setRawOfferUnitSelections] = useState<
    Record<string, string>[]
  >([]);
  const [rawOfferUnitSelectionsByTier, setRawOfferUnitSelectionsByTier] = useState<
    Record<string, Record<string, string>[]>
  >({});

  useEffect(() => {
    const defaultTierId =
      selectedProduct.offersConfig?.defaultSelectedTierId ||
      selectedProduct.offersConfig?.tiers?.[0]?.id ||
      "tier-1";
    setSelectedOfferTierId(defaultTierId);
    setRawOfferUnitSelections([]);
    setRawOfferUnitSelectionsByTier({});
  }, [
    selectedProduct.id,
    selectedProduct.offersConfig?.defaultSelectedTierId,
  ]);

  const activeOfferTier = useMemo(() => {
    if (!isOffersActive || !selectedProduct.offersConfig) return null;
    return (
      selectedProduct.offersConfig.tiers.find(
        (t) => t.id === selectedOfferTierId
      ) || selectedProduct.offersConfig.tiers[0]
    );
  }, [isOffersActive, selectedProduct.offersConfig, selectedOfferTierId]);

  const offerStep3Axes = useMemo(() => {
    return extractStep3VariantAxes({
      sizes: sizeOptions,
      colors: colorOptions,
      variants: selectedProduct.variants?.map((v: any) => ({
        name: v.name,
        attributes: v.options,
        options: v.options,
        stock: v.stock,
        availability: v.availability,
        isOutOfStock: Boolean(
          v.isOutOfStock ||
            v.availability === 'out_of_stock' ||
            (v.stock !== undefined && v.stock !== '' && Number(v.stock) <= 0)
        ),
      })),
      specs: selectedProduct.specifications,
      onlyDisponible: true,
      useFallbackForPreview: true,
    });
  }, [sizeOptions, colorOptions, selectedProduct.variants, selectedProduct.specifications]);

  const activeOfferPricing = useMemo(() => {
    if (!isOffersActive || !activeOfferTier || !selectedProduct.offersConfig)
      return null;
    return calculateOfferTierPricing(
      activeOfferTier,
      variantBasePrice,
      selectedProduct.offersConfig.offerType
    );
  }, [
    isOffersActive,
    activeOfferTier,
    variantBasePrice,
    selectedProduct.offersConfig,
  ]);

  const offerUnitSelections = useMemo(() => {
    return normalizeUnitVariantSelections(
      rawOfferUnitSelections,
      activeOfferPricing?.totalUnits || 1,
      offerStep3Axes
    );
  }, [rawOfferUnitSelections, activeOfferPricing?.totalUnits, offerStep3Axes]);

  const offerSelectionSummaryText = useMemo(() => {
    if (!isOffersActive || !activeOfferTier) return "";
    return formatOfferSelectionSummary({
      tier: activeOfferTier,
      unitSelections: offerUnitSelections,
      includeGifts: true,
    });
  }, [isOffersActive, activeOfferTier, offerUnitSelections]);

  // When selected color / variant changes, automatically focus on that exact image in the gallery without mistake
  useEffect(() => {
    if (activeColorSpec) {
      const colorImg = activeColorSpec.imageUrl || (activeColorSpec as any).image || (activeColorSpec.images && activeColorSpec.images[0]);
      if (colorImg) {
        const idx = findImageInGallery(colorImg);
        if (idx >= 0) {
          setActiveImgIdx(idx);
          return;
        }
      }
    }
    if (matchedVariant?.images && matchedVariant.images.length > 0) {
      const idx = findImageInGallery(matchedVariant.images[0]);
      if (idx >= 0) {
        setActiveImgIdx(idx);
        return;
      }
    }
    if (matchedVariant?.imageUrl) {
      const idx = findImageInGallery(matchedVariant.imageUrl);
      if (idx >= 0) {
        setActiveImgIdx(idx);
        return;
      }
    }
  }, [chosenColor, activeColorSpec, matchedVariant, galleryImages, findImageInGallery]);
  const [isOutOfStockState, setIsOutOfStockState] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);

  const currentNotifyVariantSummary =
    matchedVariant?.name ||
    [chosenColor, chosenSize].filter(Boolean).join(" • ") ||
    undefined;

  const isCurrentItemNotifiedForIp = useMemo(
    () =>
      hasIpRequestedNotify(
        stockNotifyRequests || [],
        {
          storeId: selectedStore.id,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          variantId: matchedVariant?.id,
          variantLabel: currentNotifyVariantSummary,
        },
        visitorIpKey
      ),
    [
      stockNotifyRequests,
      selectedStore.id,
      selectedProduct.id,
      selectedProduct.name,
      matchedVariant?.id,
      currentNotifyVariantSummary,
      visitorIpKey,
    ]
  );

  const effectiveHasNotified = hasNotified || isCurrentItemNotifiedForIp;

  useEffect(() => {
    setHasNotified(false);
  }, [selectedProduct.id, matchedVariant?.id, currentNotifyVariantSummary]);

  useEffect(() => {
    setIsOutOfStockState(false);
  }, [selectedProduct.id, selectedProduct.stock, selectedProduct.variants]);

  // Dynamic stock calculations (accounts for variants and store inventory)
  const hasVariants = Boolean(selectedProduct.variants && selectedProduct.variants.length > 0);
  const anyVariantInStock = hasVariants
    ? selectedProduct.variants!.some(v => Number(v.stock) > 0 && (v as any).availability !== "out_of_stock")
    : (typeof selectedProduct.stock === "number" ? selectedProduct.stock > 0 : true);

  const isVariantOutOfStock = matchedVariant
    ? (Number(matchedVariant.stock) <= 0 || (matchedVariant as any).availability === "out_of_stock")
    : (hasVariants ? !anyVariantInStock : false);

  const isVariantLowStock = matchedVariant
    ? (!isVariantOutOfStock && (Number(matchedVariant.stock) <= 5 || (matchedVariant as any).availability === "low_stock"))
    : false;

  const currentStock = typeof matchedVariant?.stock === "number"
    ? matchedVariant.stock
    : (typeof selectedProduct.stock === "number" ? selectedProduct.stock : 10);

  const isOutOfStock = hasVariants
    ? (isVariantOutOfStock || !anyVariantInStock)
    : (isOutOfStockState || currentStock <= 0);
  const isLowStock = !isOutOfStock && (isVariantLowStock || (currentStock > 0 && currentStock <= 5));

  // Tracks recently viewed products (max 5) in sessionStorage
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  useEffect(() => {
    if (!selectedProduct) return;
    try {
      // Create a lightweight copy of product object to save storage space & avoid quota errors
      const sanitizeProductForStorage = (p: any): Product => {
        if (!p) return {} as Product;
        const firstImg = p.imageUrl || (p.images && p.images[0]) || "";
        // If image is a huge data URL (> 200KB), omit or keep standard URL
        const safeImg = typeof firstImg === "string" && firstImg.length > 200000 ? "" : firstImg;
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          originalPrice: p.originalPrice,
          imageUrl: safeImg,
          images: safeImg ? [safeImg] : [],
          category: p.category,
          rating: p.rating,
          reviewsCount: p.reviewsCount,
          badge: p.badge,
          stock: p.stock,
          storeId: p.storeId,
          storeName: p.storeName,
          status: p.status || "active",
          reviews: p.reviews || [],
          description_ar: "",
          description_fr: "",
          description_en: "",
          tags: p.tags || [],
        } as unknown as Product;
      };

      const sanitizedCurrent = sanitizeProductForStorage(selectedProduct);

      const saved = sessionStorage.getItem("recently_viewed_products");
      let list: Product[] = [];
      if (saved) {
        try {
          list = JSON.parse(saved);
        } catch {
          list = [];
        }
      }
      
      // Filter out current product to avoid duplicate and sanitize existing items
      list = list
        .filter((p: any) => p && p.id !== selectedProduct.id)
        .map((p) => sanitizeProductForStorage(p));
      
      // Insert current product at the top
      list.unshift(sanitizedCurrent);
      
      // Limit to 5
      list = list.slice(0, 5);
      
      // Safely set item in sessionStorage with quota fallback
      try {
        sessionStorage.setItem("recently_viewed_products", JSON.stringify(list));
      } catch (quotaErr) {
        console.warn("sessionStorage quota reached for recently viewed products. Trimming...", quotaErr);
        // Fallback: save only IDs and names or clear key if storage is completely full
        try {
          const minimalList = list.slice(0, 3).map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
          }));
          sessionStorage.setItem("recently_viewed_products", JSON.stringify(minimalList));
        } catch {
          sessionStorage.removeItem("recently_viewed_products");
        }
      }
      setRecentlyViewed(list);
    } catch (e) {
      console.warn("Safe recovery from sessionStorage error:", e);
    }
  }, [selectedProduct]);
  const [shareCopied, setShareCopied] = useState(false);
  const [purchaseQty, setPurchaseQty] = useState(1);

  const handleShareProduct = () => {
    const productUrl = `${window.location.origin}/?product=${selectedProduct.id || encodeURIComponent(selectedProduct.name)}`;
    navigator.clipboard.writeText(productUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch((err) => {
      console.error("Failed to copy link: ", err);
    });
  };
  const [showPreviewHeader, setShowPreviewHeader] = useState<boolean>(true);
  const previewLastScrollY = useRef<number>(0);

  // Responsive device/viewport checking
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (selectedProduct) {
      trackAdViewContent(selectedProduct, selectedStore?.name);
    }
  }, [selectedProduct, selectedStore]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Countdown timer simulation for daily deals (defaults to 23h : 55m : 59s matching the reference design)
  const [timeLeft, setTimeLeft] = useState<{ days?: number; hrs: number; mins: number; secs: number }>(() => {
    if (selectedProduct.timerEnabled && selectedProduct.timerHours !== undefined) {
      return { hrs: Math.max(0, selectedProduct.timerHours - 1), mins: 55, secs: 59 };
    }
    return { hrs: 23, mins: 55, secs: 59 };
  });

  useEffect(() => {
    if (selectedProduct.timerEnabled && selectedProduct.timerHours !== undefined) {
      setTimeLeft({ hrs: Math.max(0, selectedProduct.timerHours - 1), mins: 55, secs: 59 });
    } else {
      setTimeLeft({ hrs: 23, mins: 55, secs: 59 });
    }
  }, [selectedProduct.id, selectedProduct.timerHours, selectedProduct.timerEnabled]);

  const [activeTimerStyle, setActiveTimerStyle] = useState<FlashSaleTimerStyle>(() => {
    const raw =
      selectedProduct.timerStyle ||
      selectedStore?.designSettings?.offerTimerStyle ||
      "style_1";
    if (raw === "style_2" || raw === "style_3" || raw === "style_4") return "style_1";
    return raw;
  });

  useEffect(() => {
    let raw =
      selectedProduct.timerStyle ||
      selectedStore?.designSettings?.offerTimerStyle ||
      "style_1";
    if (raw === "style_2" || raw === "style_3" || raw === "style_4") raw = "style_1";
    setActiveTimerStyle(raw);
  }, [selectedProduct.timerStyle, selectedStore?.designSettings?.offerTimerStyle]);

  // Promo timer static session color index (no automatic rotation)
  const [timerColorIndex] = useState(0);

  const timerStyles = [
    {
      container: "bg-amber-600/5 text-amber-800 border-amber-600/15",
      badge: "bg-amber-600 text-white"
    },
    {
      container: "bg-emerald-600/5 text-emerald-800 border-emerald-600/15",
      badge: "bg-emerald-600 text-white"
    },
    {
      container: "bg-rose-600/5 text-rose-800 border-rose-600/15",
      badge: "bg-rose-600 text-white"
    },
    {
      container: "bg-indigo-600/5 text-indigo-800 border-indigo-600/15",
      badge: "bg-indigo-600 text-white"
    },
    {
      container: "bg-fuchsia-600/5 text-fuchsia-800 border-fuchsia-600/15",
      badge: "bg-fuchsia-600 text-white"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { hrs: prev.hrs, mins: prev.mins - 1, secs: 59 };
        if (prev.hrs > 0) return { hrs: prev.hrs - 1, mins: 59, secs: 59 };
        // If countdown finishes, reset back or stay 0
        if (selectedProduct.timerEnabled) {
          return { hrs: 0, mins: 0, secs: 0 };
        }
        return { hrs: 24, mins: 0, secs: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedProduct.timerEnabled]);

  const [showColorOptions, setShowColorOptions] = useState(true);
  const [showSizeOptions, setShowSizeOptions] = useState(true);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>( "");
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(() => {
    const saved = localStorage.getItem("dz_showcase_autoplay");
    return saved === null ? true : saved === "true";
  });
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem("dz_showcase_volume");
    return saved === null ? 80 : parseInt(saved, 10);
  });
  const [prevVolume, setPrevVolume] = useState<number>(80);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);

  const handleToggleAutoPlay = (val: boolean) => {
    setIsAutoPlay(val);
    localStorage.setItem("dz_showcase_autoplay", String(val));
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    localStorage.setItem("dz_showcase_volume", String(newVol));
    
    // sync iframe YT if exists
    if (playerRef.current && typeof playerRef.current.setVolume === "function") {
      try {
        playerRef.current.setVolume(newVol);
        if (newVol > 0 && typeof playerRef.current.unMute === "function") {
          playerRef.current.unMute();
        } else if (newVol === 0 && typeof playerRef.current.mute === "function") {
          playerRef.current.mute();
        }
      } catch (e) {}
    }
    
    // sync direct video if exists
    if (videoRef.current) {
      videoRef.current.volume = newVol / 100;
      videoRef.current.muted = newVol === 0;
    }
  };

  // Load and sync YouTube Player and local states
  useEffect(() => {
    if (isVideoOpen) {
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(true); // Preemptively set to true to hide the overlay while loading

      const activeUrl = activeVideoUrl || productVideoList[0] || selectedProduct.videoUrl || "";
      const currentVideoInfo = getVideoEmbedResult(activeUrl);

      if (currentVideoInfo.type === "youtube") {
        if (!(window as any).YT) {
          const tag = document.createElement("script");
          tag.src = "https://www.youtube.com/iframe_api";
          const firstScriptTag = document.getElementsByTagName("script")[0];
          firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        let player: any;
        let timer: NodeJS.Timeout;

        const initYTPlayer = () => {
          if ((window as any).YT && (window as any).YT.Player) {
            try {
              player = new (window as any).YT.Player("youtube-player-iframe", {
                events: {
                  onReady: (event: any) => {
                    setDuration(event.target.getDuration() || 0);
                    try {
                      event.target.setVolume(volume);
                      if (volume === 0) {
                        event.target.mute();
                      } else {
                        event.target.unMute();
                      }
                    } catch (e) {}

                    // Always autoplay the video on load
                    try {
                      event.target.playVideo();
                      setIsPlaying(true);
                    } catch (e) {
                      try {
                        event.target.mute();
                        event.target.playVideo();
                        setIsPlaying(true);
                      } catch (err) {}
                    }
                  },
                  onStateChange: (event: any) => {
                    const state = event.target.getPlayerState();
                    // YT States: 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING, -1 = UNSTARTED, 5 = CUED
                    if (state === 2 || state === 0) {
                      setIsPlaying(false);
                    } else if (state === 1 || state === 3) {
                      setIsPlaying(true);
                    }
                  }
                }
              });
              playerRef.current = player;
            } catch (e) {}
          } else {
            timer = setTimeout(initYTPlayer, 200);
          }
        };

        initYTPlayer();

        return () => {
          if (timer) clearTimeout(timer);
          if (playerRef.current && playerRef.current.destroy) {
            try {
              playerRef.current.destroy();
            } catch (e) {}
            playerRef.current = null;
          }
        };
      } else if (currentVideoInfo.type === "direct") {
        const playDirect = async () => {
          await new Promise((r) => setTimeout(r, 100));
          if (videoRef.current) {
            videoRef.current.volume = volume / 100;
            videoRef.current.muted = volume === 0;
            // Always try automatic play for direct formats
            try {
              await videoRef.current.play();
              setIsPlaying(true);
            } catch (err) {
              if (videoRef.current) {
                videoRef.current.muted = true;
                try {
                  await videoRef.current.play();
                  setIsPlaying(true);
                } catch (e2) {}
              }
            }
          }
        };
        playDirect();
      }
    } else {
      setIsPlaying(false);
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    }
  }, [isVideoOpen, activeVideoUrl, selectedProduct.videoUrl, isAutoPlay]);

  // Polling loop to sync time of playing video
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVideoOpen) {
      interval = setInterval(() => {
        const activeUrl = activeVideoUrl || productVideoList[0] || selectedProduct.videoUrl || "";
        const currentVideoInfo = getVideoEmbedResult(activeUrl);

        if (currentVideoInfo.type === "youtube" && playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
          try {
            if (!isSeeking) {
              const apiTime = playerRef.current.getCurrentTime();
              if (typeof apiTime === "number") {
                setCurrentTime(apiTime);
              }
            }
            const dur = playerRef.current.getDuration();
            if (dur && dur !== duration) {
              setDuration(dur);
            }
          } catch (e) {}
        } else if (currentVideoInfo.type === "direct" && videoRef.current) {
          if (!isSeeking) {
            setCurrentTime(videoRef.current.currentTime || 0);
          }
          if (videoRef.current.duration && videoRef.current.duration !== duration) {
            setDuration(videoRef.current.duration);
          }
        }
      }, 250);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVideoOpen, activeVideoUrl, selectedProduct.videoUrl, isSeeking, duration]);
  const getSafeAccentColor = useCallback((colorHex: string, fallback = "#2563eb") => {
    if (!colorHex || typeof colorHex !== "string") return fallback;
    const hex = colorHex.replace("#", "").trim();
    if (hex.length !== 6) return fallback;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return fallback;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness > 180) {
      return "#1e293b";
    }
    return colorHex;
  }, []);

  const [activeThemeColor, setActiveThemeColor] = useState(
    currentSlideColor || colorOptions[0]?.hex || "#e47911"
  );

  const themeAccentColor = useMemo(
    () => getSafeAccentColor(activeThemeColor, "#2563eb"),
    [activeThemeColor, getSafeAccentColor]
  );
  const [descLang, setDescLang] = useState<"en" | "fr" | "ar">("en");

  useEffect(() => {
    if (selectedProduct.description_en) {
      setDescLang("en");
    } else if (selectedProduct.description_fr) {
      setDescLang("fr");
    } else if (selectedProduct.description_ar) {
      setDescLang("ar");
    } else {
      setDescLang("en");
    }
  }, [selectedProduct.id]);

  useEffect(() => {
    setActiveImgIdx(0);
    setPurchaseQty(1);
    setIsOutOfStockState(selectedProduct.stock <= 0);

    const modalRoot = document.getElementById("product-preview-modal-root");
    if (modalRoot) {
      modalRoot.scrollTop = 0;
    }
    window.scrollTo(0, 0);

    setChosenColor("");
    setChosenSize("");
    setSelectedOptions({});
    setIsFindYourFitOpen(false);
  }, [selectedProduct.id]);

  const [isFindYourFitOpen, setIsFindYourFitOpen] = useState(false);
  const showFindYourFit = useMemo(
    () => hasValidProductSizingFit(selectedProduct),
    [selectedProduct]
  );

  const handleSelectSizeFromFitModal = (sizeStr: string) => {
    if (!sizeStr) return;
    const sizeOptKey = variantOptions
      ? Object.keys(variantOptions).find((k) => isSizeOptionName(k))
      : undefined;

    if (sizeOptKey && Array.isArray(variantOptions[sizeOptKey])) {
      const candidates = variantOptions[sizeOptKey];
      const matchedOptVal =
        candidates.find(
          (v) =>
            v.toLowerCase() === sizeStr.toLowerCase() ||
            getSizeSymbol(v).toLowerCase() === sizeStr.toLowerCase()
        ) || sizeStr;
      const currentVal = selectedOptions[sizeOptKey] || chosenSize;
      if (!currentVal || currentVal.toLowerCase() !== matchedOptVal.toLowerCase()) {
        handleSelectOption(sizeOptKey, matchedOptVal);
      }
      return;
    }

    if (sizeOptions && sizeOptions.length > 0) {
      const matchedStandalone =
        sizeOptions.find(
          (s) =>
            s.toLowerCase() === sizeStr.toLowerCase() ||
            getSizeSymbol(s).toLowerCase() === sizeStr.toLowerCase()
        ) || sizeStr;
      setChosenSize(matchedStandalone);
      return;
    }

    setChosenSize(sizeStr);
  };

  useEffect(() => {
    if (currentSlideColor) {
      setActiveThemeColor(currentSlideColor);
    }
  }, [currentSlideColor]);

  // Resolve shipping rates from prop, store config, state, or localStorage
  const activeRates = (() => {
    if (shippingRates) return shippingRates;
    if ((selectedStore as any)?.shippingConfig) return (selectedStore as any).shippingConfig;
    if ((selectedStore as any)?.shippingSettings) return (selectedStore as any).shippingSettings;
    try {
      const saved = localStorage.getItem("custom_shipping_rates");
      return saved ? JSON.parse(saved) : {
        algiers: 400,
        major: 600,
        sahara: 950,
        standard: 750,
        isFlatRate: false,
        flatRateAmount: 600
      };
    } catch {
      return {
        algiers: 400,
        major: 600,
        sahara: 950,
        standard: 750,
        isFlatRate: false,
        flatRateAmount: 600
      };
    }
  })();

  const DELIVERY_COMPANIES = useMemo(() => [
    { id: "yalidine", name: "Yalidine Express", color: "text-red-600 bg-red-50 border-red-200" },
    { id: "guex", name: "Guex Express", color: "text-orange-600 bg-orange-50 border-orange-200" },
    { id: "maystro", name: "Maystro Delivery", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { id: "kazitour", name: "Kazitour Express", color: "text-purple-600 bg-purple-50 border-purple-200" },
    { id: "zr_express", name: "ZR Express", color: "text-blue-600 bg-blue-50 border-blue-200" },
    { id: "flex", name: "FLEX Courier", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
    { id: "colisdz", name: "ColisDZ Logistics", color: "text-teal-600 bg-teal-50 border-teal-200" },
    { id: "store_courier", name: "Boutique Courier", color: "text-amber-600 bg-amber-50 border-amber-200" },
  ], []);

  const COUNTRIES = [
    { code: "DZ", name: "Algeria", currency: "DA" },
    { code: "FR", name: "France", currency: "EUR" },
    { code: "TN", name: "Tunisia", currency: "TND" },
    { code: "INT", name: "International", currency: "USD" },
  ];

  const WILAYA_COMMUNES: Record<string, string[]> = ALGERIA_COMMUNES_MAP;

  // Algeria Yalidine/Local Delivery Configuration (All 69 Official Wilayas)
  const baseWilayas = ALGERIA_69_WILAYAS.map((w) => {
    let time = "2-3 Days";
    const num = parseInt(w.code, 10);
    if (num === 16 || [9, 15, 35, 42].includes(num)) time = "24-48 Hours";
    else if ([1, 11, 33, 37, 49, 50, 52, 53, 54, 56, 57, 58].includes(num)) time = "5-7 Days";
    else if ([3, 7, 8, 30, 32, 39, 45, 47, 51, 55, 61, 69].includes(num)) time = "3-5 Days";
    return {
      id: w.code,
      name: w.formattedName,
      time,
    };
  });

  // Location States (Worldwide Country -> State/Province -> City; Algeria default)
  const [selectedCountryCode, setSelectedCountryCode] = useState("DZ");
  const [selectedCountryName, setSelectedCountryName] = useState("Algeria");
  const [selectedStateCode, setSelectedStateCode] = useState("16");
  const [selectedStateName, setSelectedStateName] = useState("16 - Alger");
  const [selectedCityName, setSelectedCityName] = useState(
    ALGERIA_COMMUNES_MAP["16"]?.[0] || "Alger Centre"
  );

  const [selectedDeliveryCompanyId, setSelectedDeliveryCompanyId] = useState("yalidine");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const ALGERIAN_WILAYAS = useMemo(() => {
    const carrierKey = selectedDeliveryCompanyId || selectedProduct?.deliveryCompany || "yalidine";
    return baseWilayas.map((w) => {
      const homeRes = calculateDynamicShippingFee({
        carrier: carrierKey,
        wilaya: w.id,
        deliveryType: "home",
      });
      const stopdeskRes = calculateDynamicShippingFee({
        carrier: carrierKey,
        wilaya: w.id,
        deliveryType: "stop_desk",
      });
      return {
        ...w,
        time: homeRes.estimatedDelivery || w.time,
        homePrice: homeRes.feeInDzd,
        stopdeskPrice: stopdeskRes.feeInDzd,
      };
    });
  }, [baseWilayas, selectedDeliveryCompanyId, selectedProduct?.deliveryCompany]);
  const [streetAddress, setStreetAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"home" | "stopdesk">("home");
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [isShippingCalculated, setIsShippingCalculated] = useState(false);
  const hasUserSelectedShippingLocation = useRef(false);

  // Keep Algeria ("DZ") as the default country; if IP detection resolves within Algeria, preselect the detected Wilaya & Commune
  useEffect(() => {
    detectUserLocationByIP().then((loc) => {
      if (hasUserSelectedShippingLocation.current) return;

      // Ensure Algeria always remains the default country on initial load
      setSelectedCountryCode("DZ");
      setSelectedCountryName("Algeria");

      const states = getStatesByCountryCode("DZ");
      if (states.length > 0) {
        let foundState: typeof states[number] | undefined;

        if (loc && loc.countryCode === "DZ") {
          if (loc.stateCode) {
            foundState = states.find(
              (s) => s.code === loc.stateCode || s.code === String(loc.stateCode).padStart(2, "0")
            );
          }
          if (!foundState && loc.stateName) {
            const rawName = loc.stateName.toLowerCase().trim();
            foundState = states.find(
              (s) =>
                s.name.toLowerCase() === rawName ||
                s.formattedName.toLowerCase().includes(rawName) ||
                rawName.includes(s.name.toLowerCase())
            );
          }
        }

        if (!foundState) {
          foundState = states.find((s) => s.code === "16") || states[0];
        }

        setSelectedStateCode(foundState.code);
        setSelectedStateName(foundState.formattedName || foundState.name);

        const cities = getCitiesByState("DZ", foundState.code);
        if (cities.length > 0) {
          const foundCity =
            loc && loc.countryCode === "DZ" && loc.cityName
              ? cities.find(
                  (c) =>
                    c.name.toLowerCase() === loc.cityName!.toLowerCase().trim() ||
                    c.name.toLowerCase().includes(loc.cityName!.toLowerCase().trim())
                )
              : undefined;

          setSelectedCityName(foundCity ? foundCity.name : cities[0].name);
        }
      }
    });
  }, []);

  // Country / State / City options memoized
  const countryOptions = useMemo(() => {
    return getWorldwideCountries().map((c) => {
      return {
        code: c.code,
        name: c.name,
        displayLabel: c.name,
      };
    });
  }, []);

  const stateOptions = useMemo(() => {
    const states = getStatesByCountryCode(selectedCountryCode);
    return states.map((s) => ({
      code: s.code,
      name: s.name,
      displayLabel: s.formattedName || s.name,
      subtitle: undefined,
    }));
  }, [selectedCountryCode]);

  const cityOptions = useMemo(() => {
    const cities = getCitiesByState(selectedCountryCode, selectedStateCode || selectedStateName);
    return cities.map((c) => ({
      code: c.name,
      name: c.name,
      displayLabel: c.name,
      subtitle: undefined,
    }));
  }, [selectedCountryCode, selectedStateCode, selectedStateName]);

  // Handlers for Location Selectors
  const handleCountryChange = (opt: SearchOption) => {
    hasUserSelectedShippingLocation.current = true;
    const newCountryCode = opt.code;
    const newCountryName = opt.name;
    setSelectedCountryCode(newCountryCode);
    setSelectedCountryName(newCountryName);

    try {
      localStorage.setItem("express_checkout_last_country", newCountryCode);
    } catch {
      // ignore
    }

    const states = getStatesByCountryCode(newCountryCode);
    if (states && states.length > 0) {
      const firstState = newCountryCode === "DZ"
        ? (states.find((s) => s.code === "06") || states[0])
        : states[0];

      setSelectedStateCode(firstState.code);
      setSelectedStateName(firstState.formattedName || firstState.name);

      const cities = getCitiesByState(newCountryCode, firstState.code);
      if (cities && cities.length > 0) {
        setSelectedCityName(cities[0].name);
      } else {
        setSelectedCityName(`${firstState.name} Center`);
      }
    } else {
      setSelectedStateCode("");
      setSelectedStateName("");
      setSelectedCityName("");
    }
  };

  const handleStateChange = (opt: SearchOption) => {
    hasUserSelectedShippingLocation.current = true;
    const newStateCode = opt.code;
    const newStateName = opt.displayLabel || opt.name;

    setSelectedStateCode(newStateCode);
    setSelectedStateName(newStateName);

    const cities = getCitiesByState(selectedCountryCode, newStateCode);
    if (cities.length > 0) {
      setSelectedCityName(cities[0].name);
    } else {
      setSelectedCityName(`${opt.name} Center`);
    }
  };

  const handleCityChange = (opt: SearchOption) => {
    hasUserSelectedShippingLocation.current = true;
    setSelectedCityName(opt.name);
  };

  // Backwards compatibility aliases
  const selectedCountry = selectedCountryName;
  const selectedWilayaId = selectedStateCode;
  const selectedWilaya = useMemo(() => {
    const found = ALGERIAN_WILAYAS.find(
      (w) => w.id === selectedStateCode || w.name.toLowerCase().includes(selectedStateName.toLowerCase())
    );
    if (found) return found;
    return ALGERIAN_WILAYAS[0];
  }, [ALGERIAN_WILAYAS, selectedStateCode, selectedStateName]);
  const selectedCommune = selectedCityName;

  // Promo Code States (Store-Scoped & Backend Validated)
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    type: "percentage" | "fixed";
    value: number;
    percent: number;
    discountAmount: number;
    minPurchase?: number;
    storeId: string;
  } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Clear applied coupon if store or product changes
  useEffect(() => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError("");
    setPromoSuccess("");
  }, [selectedStore?.id, selectedProduct?.id]);

  const handleApplyPromoCode = async (codeToApply?: string) => {
    const code = (codeToApply !== undefined ? codeToApply : promoCodeInput).trim().toUpperCase();
    if (!code) {
      setPromoError("Please enter a coupon code.");
      setPromoSuccess("");
      return;
    }

    const currentStoreId = selectedStore?.id || myStore?.id || "";
    if (!currentStoreId) {
      setPromoError("Unable to verify store for this coupon.");
      setPromoSuccess("");
      return;
    }

    const currentSubtotal =
      isOffersActive && activeOfferPricing
        ? activeOfferPricing.finalPrice
        : activePrice * purchaseQty;
    setIsValidatingPromo(true);
    setPromoError("");
    setPromoSuccess("");

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          storeId: currentStoreId,
          productId: selectedProduct?.id,
          category: selectedProduct?.category,
          subtotal: currentSubtotal,
          storeCoupons: selectedStore?.coupons || [],
        }),
      });

      const data = await response.json();

      if (!response.ok || !data || !data.valid || !data.coupon) {
        setAppliedPromo(null);
        setPromoError(data?.error || "Invalid coupon code for this store.");
        setPromoSuccess("");
        return;
      }

      const validatedCoupon = data.coupon;
      const backendDiscount = Math.max(0, Number(data.discountAmount) || 0);

      setAppliedPromo({
        code: validatedCoupon.code,
        type: validatedCoupon.type === "fixed" ? "fixed" : "percentage",
        value: Number(validatedCoupon.value) || 0,
        percent: validatedCoupon.type === "percentage" ? Number(validatedCoupon.value) || 0 : 0,
        discountAmount: backendDiscount,
        minPurchase: validatedCoupon.minPurchase ? Number(validatedCoupon.minPurchase) : undefined,
        storeId: currentStoreId,
      });

      setPromoSuccess(
        data.message ||
          (validatedCoupon.type === "percentage"
            ? `Coupon '${validatedCoupon.code}' applied (-${validatedCoupon.value}% OFF)`
            : `Coupon '${validatedCoupon.code}' applied (-${Number(validatedCoupon.value).toLocaleString()} DA OFF)`)
      );
      setPromoError("");
    } catch (err) {
      setAppliedPromo(null);
      setPromoError("Could not validate coupon code. Please try again.");
      setPromoSuccess("");
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError("");
    setPromoSuccess("");
  };

  // Express Checkout & Thank You States
  const [isExpressCheckoutOpen, setIsExpressCheckoutOpen] = useState(false);
  const [isBottomInlineCheckoutOpen, setIsBottomInlineCheckoutOpen] = useState(false);
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);
  const [isPartyAnimationActive, setIsPartyAnimationActive] = useState(false);
  const [placedOrderInfo, setPlacedOrderInfo] = useState<any>(null);
  const [isCopiedOrderId, setIsCopiedOrderId] = useState(false);
  const [shopperTrackingOrder, setShopperTrackingOrder] = useState<Order | null>(null);

  // Keep the party celebration animation running for 30 seconds when the Thank You page opens
  useEffect(() => {
    if (!isThankYouOpen) {
      setIsPartyAnimationActive(false);
      return;
    }
    setIsPartyAnimationActive(true);
    const timer = setTimeout(() => {
      setIsPartyAnimationActive(false);
    }, 30000);
    return () => clearTimeout(timer);
  }, [isThankYouOpen, placedOrderInfo?.orderId, placedOrderInfo?.id]);

  // Guest Registration Flow States
  const [isGuestRegisterOpen, setIsGuestRegisterOpen] = useState(false);
  const [pendingGuestAction, setPendingGuestAction] = useState<'close' | 'track' | 'cart' | null>(null);
  const [pendingCartProduct, setPendingCartProduct] = useState<{ prod: Product; store: MerchantStore; qty: number } | null>(null);
  const [guestRegisterEmail, setGuestRegisterEmail] = useState("");

  const isRegisteredUser = useMemo(() => {
    if (currentUser) {
      const role = (currentUser as any).role || (currentUser as any).accountType;
      if (role === "Guest") return false;
      if (currentUser.email || currentUser.name || role) return true;
    }
    try {
      const savedUserStr = localStorage.getItem("yume_current_user") || localStorage.getItem("yume_user");
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        const role = parsed?.role || parsed?.accountType;
        if (role === "Guest") return false;
        if (parsed?.id || parsed?.email || parsed?.name || role) return true;
      }
    } catch (err) {
      console.error("Registered user check error:", err);
    }
    return false;
  }, [currentUser, isGuestRegisterOpen]);

  const handleAddToCartWithGuestCheck = (productToAdd?: any) => {
    const basePrice =
      isOffersActive && activeOfferPricing
        ? activeOfferPricing.finalPrice
        : activePrice;
    const cartQty = isOffersActive && activeOfferPricing ? 1 : purchaseQty;
    const modifiedProduct = productToAdd || {
      ...selectedProduct,
      price: basePrice,
      name:
        isOffersActive && offerSelectionSummaryText
          ? `${selectedProduct.name} [${offerSelectionSummaryText}]`
          : `${selectedProduct.name} [${chosenColor} / ${chosenSize}]`,
      selectedOfferTierId: activeOfferTier?.id,
      selectedOfferTitle: activeOfferTier?.title,
      selectedOfferSummary: offerSelectionSummaryText || undefined,
      selectedOfferUnitVariants: isOffersActive ? offerUnitSelections : undefined,
      selectedOfferFreeGifts: isOffersActive ? activeOfferTier?.freeGifts : undefined,
    };

    let isAlreadyRegistered = false;
    try {
      const savedUser = localStorage.getItem("yume_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.id || parsed?.email) {
          isAlreadyRegistered = true;
        }
      }
    } catch (err) {
      console.error("User check error:", err);
    }

    if (!isAlreadyRegistered) {
      setPendingCartProduct({ prod: modifiedProduct, store: selectedStore, qty: cartQty });
      setPendingGuestAction('cart');
      setIsGuestRegisterOpen(true);
    } else {
      handleAddToCart(modifiedProduct, selectedStore, cartQty);
      setCartTab("cart");
      setIsCartOpen(true);
      onClose();
    }
  };

  const openShopperTrackingModal = () => {
    if (!placedOrderInfo) return;
    const wilayaStr = typeof placedOrderInfo.wilaya === 'object' ? (placedOrderInfo.wilaya?.name || "") : String(placedOrderInfo.wilaya || placedOrderInfo.buyer?.wilaya || "");
    const wilayaCodeStr = typeof placedOrderInfo.wilaya === 'object' ? String(placedOrderInfo.wilaya?.code || placedOrderInfo.wilaya?.id || "16") : "16";
    const delCompanyStr = typeof placedOrderInfo.deliveryCompany === 'object' ? (placedOrderInfo.deliveryCompany?.name || "Yalidine Express") : String(placedOrderInfo.deliveryCompany || "Yalidine Express");
    const orderRefId = placedOrderInfo.orderId || placedOrderInfo.id || "ORD-000000";

    const shopperOrder: Order = {
      id: orderRefId,
      storeId: selectedStore?.id || "store-1",
      storeName: selectedStore?.name || "Store",
      date: new Date().toISOString(),
      shopper: {
        name: placedOrderInfo.buyer?.name || "Valued Shopper",
        email: placedOrderInfo.buyer?.email || guestRegisterEmail || buyerEmail || "",
        phone: placedOrderInfo.buyer?.phone || "",
        wilaya: wilayaStr,
        wilayaCode: wilayaCodeStr,
        commune: placedOrderInfo.commune || "",
        address: `${placedOrderInfo.commune || ""}, ${wilayaStr}`
      },
      items: [{
        id: placedOrderInfo.product?.id || "prod-1",
        name: placedOrderInfo.product?.name || selectedProduct?.name || "Product",
        price: placedOrderInfo.product?.price || selectedProduct?.price || 0,
        quantity: placedOrderInfo.qty || 1,
        imageUrl: (placedOrderInfo.product as any)?.image || placedOrderInfo.product?.images?.[0] || ""
      }],
      total: placedOrderInfo.grandTotal || placedOrderInfo.totalPrice || 0,
      shippingCost: placedOrderInfo.shippingFee || 0,
      status: "pending",
      paymentMethod: "cod",
      deliveryCompany: delCompanyStr,
      trackingCode: `DZ-${delCompanyStr.slice(0, 3).toUpperCase()}-${orderRefId.slice(-6)}`
    };
    setShopperTrackingOrder(shopperOrder);
  };

  const handleThankYouAction = (action: 'close' | 'track') => {
    setIsThankYouOpen(false);

    let isAlreadyRegistered = false;
    try {
      const savedUser = localStorage.getItem("yume_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.id || parsed?.email) {
          isAlreadyRegistered = true;
        }
      }
    } catch (err) {
      console.error("User check error:", err);
    }

    if (!isAlreadyRegistered) {
      setPendingGuestAction(action);
      setGuestRegisterEmail(placedOrderInfo?.buyer?.email || buyerEmail || "");
      setIsGuestRegisterOpen(true);
    } else {
      if (action === 'track') {
        openShopperTrackingModal();
      } else {
        onClose();
      }
    }
  };

  const handleCreateGuestAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestRegisterEmail.trim()) {
      alert("Please enter a valid email address.");
      return;
    }

    const newShopperUser = {
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      name: placedOrderInfo?.buyer?.name || buyerFullName || "Valued Shopper",
      email: guestRegisterEmail.trim(),
      phone: placedOrderInfo?.buyer?.phone || buyerPhone || "",
      wilaya: placedOrderInfo?.wilaya?.name || selectedWilaya?.name || "",
      commune: placedOrderInfo?.commune || selectedCommune || "",
      role: "shopper",
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("yume_user", JSON.stringify(newShopperUser));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error("Error saving shopper account:", err);
    }

    setIsGuestRegisterOpen(false);

    if (pendingGuestAction === 'track') {
      openShopperTrackingModal();
    } else if (pendingGuestAction === 'cart' && pendingCartProduct) {
      handleAddToCart(pendingCartProduct.prod, pendingCartProduct.store, pendingCartProduct.qty);
      setCartTab("cart");
      setIsCartOpen(true);
      onClose();
    } else {
      onClose();
    }
    setPendingCartProduct(null);
    setPendingGuestAction(null);
  };

  const handleSocialRegister = (provider: 'gmail' | 'hotmail' | 'instagram' | 'facebook' | 'whatsapp') => {
    const rawName = placedOrderInfo?.buyer?.name || buyerFullName || "Valued Shopper";
    const rawPhone = placedOrderInfo?.buyer?.phone || buyerPhone || "";
    const cleanHandle = rawName.toLowerCase().replace(/[^a-z0-9]/g, '.');

    let userEmail = guestRegisterEmail.trim() || placedOrderInfo?.buyer?.email || buyerEmail || "";
    if (!userEmail) {
      if (provider === 'gmail') userEmail = `${cleanHandle}@gmail.com`;
      else if (provider === 'hotmail') userEmail = `${cleanHandle}@hotmail.com`;
      else if (provider === 'instagram') userEmail = `${cleanHandle}@instagram.com`;
      else if (provider === 'facebook') userEmail = `${cleanHandle}@facebook.com`;
      else if (provider === 'whatsapp') userEmail = `${rawPhone ? rawPhone.replace(/\D/g, '') : cleanHandle}@whatsapp.com`;
    }

    const providerNames: Record<string, string> = {
      gmail: "Gmail (Google)",
      hotmail: "Hotmail / Outlook",
      instagram: "Instagram",
      facebook: "Facebook",
      whatsapp: "WhatsApp"
    };

    const newShopperUser = {
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      name: rawName,
      email: userEmail,
      phone: rawPhone,
      wilaya: placedOrderInfo?.wilaya?.name || selectedWilaya?.name || "",
      commune: placedOrderInfo?.commune || selectedCommune || "",
      role: "shopper",
      provider: provider,
      linkedApp: providerNames[provider],
      autoSignInConnected: true,
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("yume_user", JSON.stringify(newShopperUser));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error("Error saving social account:", err);
    }

    setIsGuestRegisterOpen(false);

    if (pendingGuestAction === 'track') {
      openShopperTrackingModal();
    } else if (pendingGuestAction === 'cart' && pendingCartProduct) {
      handleAddToCart(pendingCartProduct.prod, pendingCartProduct.store, pendingCartProduct.qty);
      setCartTab("cart");
      setIsCartOpen(true);
      onClose();
    } else {
      onClose();
    }
    setPendingCartProduct(null);
    setPendingGuestAction(null);
  };

  const handleGuestMaybeLater = () => {
    setIsGuestRegisterOpen(false);
    if (pendingGuestAction === 'track') {
      openShopperTrackingModal();
    } else if (pendingGuestAction === 'cart' && pendingCartProduct) {
      handleAddToCart(pendingCartProduct.prod, pendingCartProduct.store, pendingCartProduct.qty);
      setCartTab("cart");
      setIsCartOpen(true);
      onClose();
    } else {
      onClose();
    }
    setPendingCartProduct(null);
    setPendingGuestAction(null);
  };

  // Buyer Info Form States
  const [buyerFullName, setBuyerFullName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [userPhoneList, setUserPhoneList] = useState<string[]>([]);
  const [buyerWhatsapp, setBuyerWhatsapp] = useState("");
  const [buyerViber, setBuyerViber] = useState("");
  const [buyerTelegram, setBuyerTelegram] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [enableWhatsapp, setEnableWhatsapp] = useState(true);
  const [enableViber, setEnableViber] = useState(true);
  const [enableTelegram, setEnableTelegram] = useState(true);
  const [enableEmail, setEnableEmail] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isSummaryPanelOpen, setIsSummaryPanelOpen] = useState(true);
  const [isMessagingAppsOpen, setIsMessagingAppsOpen] = useState(false);

  // Form field touched & validation error states
  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [cityTouched, setCityTouched] = useState(false);
  const [streetAddressTouched, setStreetAddressTouched] = useState(false);
  const [termsErrorHighlight, setTermsErrorHighlight] = useState(false);
  const [formValidationErrors, setFormValidationErrors] = useState<string[]>([]);

  // Memoized Real-Time Validation
  const fullNameValidation = useMemo(() => {
    return validateFullName(buyerFullName);
  }, [buyerFullName]);

  const currentCountryObj = useMemo(() => {
    const countries = getWorldwideCountries();
    return countries.find((c) => c.code === selectedCountryCode) || countries[0];
  }, [selectedCountryCode]);

  const phoneValidation = useMemo(() => {
    const dialCode = currentCountryObj?.phonecode || "213";
    return validatePhoneNumber(buyerPhone, selectedCountryCode, dialCode);
  }, [buyerPhone, selectedCountryCode, currentCountryObj]);

  // Helper to get authenticated user profile data
  const getAuthenticatedUserProfile = useCallback(() => {
    if (currentUser) {
      const role = (currentUser as any).role || (currentUser as any).accountType;
      if (role === "Guest") return null;
    }

    let savedUser: any = null;
    try {
      const raw = localStorage.getItem("yume_current_user") || localStorage.getItem("yume_user") || localStorage.getItem("shopper_profile");
      if (raw) {
        savedUser = JSON.parse(raw);
      }
    } catch (err) {
      console.error("Error reading saved user profile:", err);
    }

    if (currentUser && (currentUser as any).role !== "Guest") {
      return { ...myStore, ...savedUser, ...currentUser };
    }

    if (savedUser && savedUser.role !== "Guest") {
      return { ...myStore, ...savedUser };
    }

    if (myStore) {
      return { ...myStore };
    }

    return null;
  }, [currentUser, myStore]);

  // Auto-fill logged in user profile when Express Checkout opens (keep guest data completely blank)
  useEffect(() => {
    if (isExpressCheckoutOpen || isBottomInlineCheckoutOpen) {
      const profile = getAuthenticatedUserProfile();

      // Do not prefill any personal data for guest users
      if (!profile) return;

      // Auto-fill full name (checking merchant representative full name from setting form as well)
      const nameToFill =
        profile.merchantFullName ||
        profile.merchantRepresentativeFullName ||
        profile.merchantRepresentativeName ||
        profile.representativeFullName ||
        profile.representativeName ||
        (myStore as any)?.merchantFullName ||
        (myStore as any)?.merchantName ||
        (myStore as any)?.representativeName ||
        (myStore as any)?.contactPerson ||
        profile.fullName ||
        profile.name ||
        profile.displayName ||
        "";

      if (nameToFill && !buyerFullName) {
        setBuyerFullName(nameToFill);
      }

      // Extract and auto-fill phone number(s)
      const extractedPhones: string[] = [];
      if (profile.phones && Array.isArray(profile.phones)) {
        profile.phones.forEach((p: any) => {
          if (typeof p === "string" && p.trim() && !extractedPhones.includes(p.trim())) {
            extractedPhones.push(p.trim());
          }
        });
      }
      const rawPhones = [profile.phone, profile.mobile, profile.phoneNumber, profile.shopper?.phone].filter(Boolean);
      rawPhones.forEach((ph: any) => {
        if (typeof ph === "string" && ph.trim()) {
          ph.split(/[,/;]/).forEach((part) => {
            const clean = part.trim();
            if (clean && !extractedPhones.includes(clean)) {
              extractedPhones.push(clean);
            }
          });
        }
      });

      setUserPhoneList(extractedPhones);

      if (extractedPhones.length > 0 && !buyerPhone) {
        setBuyerPhone(extractedPhones[0]);
      }

      // Auto-fill extra contact options (WhatsApp, Telegram, Viber)
      const wa = profile.whatsapp || profile.socials?.whatsapp || "";
      if (wa && !buyerWhatsapp) setBuyerWhatsapp(wa);

      const vi = profile.viber || profile.socials?.viber || "";
      if (vi && !buyerViber) setBuyerViber(vi);

      const tg = profile.telegram || profile.socials?.telegram || "";
      if (tg && !buyerTelegram) setBuyerTelegram(tg);

      if ((wa || vi || tg) && !isMessagingAppsOpen) {
        setIsMessagingAppsOpen(true);
      }

      // Auto-fill email
      const em = profile.email || profile.shopper?.email || "";
      if (em && !buyerEmail) setBuyerEmail(em);

      // Auto-fill country, state, city from profile if user hasn't selected custom location in shipping calculator
      if (!hasUserSelectedShippingLocation.current) {
        const cntry = profile.country || profile.shopper?.country;
        if (cntry) {
          const countries = getWorldwideCountries();
          const matchedCountry = countries.find(
            (c) => c.name.toLowerCase() === cntry.toLowerCase() || c.code.toLowerCase() === cntry.toLowerCase()
          );
          if (matchedCountry) {
            setSelectedCountryCode(matchedCountry.code);
            setSelectedCountryName(matchedCountry.name);
          }
        }

        const targetWilaya = profile.wilaya || profile.state || profile.province || profile.shopper?.wilaya;
        if (targetWilaya) {
          const wilayaStr = typeof targetWilaya === "object" ? (targetWilaya.name || "") : String(targetWilaya);
          const wilayaIdStr = typeof targetWilaya === "object" ? String(targetWilaya.id || targetWilaya.code || "") : "";

          const states = getStatesByCountryCode(selectedCountryCode);
          const foundState = states.find(
            (s) =>
              (wilayaIdStr && s.code === wilayaIdStr) ||
              s.name.toLowerCase() === wilayaStr.toLowerCase() ||
              s.formattedName.toLowerCase() === wilayaStr.toLowerCase() ||
              s.name.toLowerCase().includes(wilayaStr.toLowerCase())
          );

          if (foundState) {
            setSelectedStateCode(foundState.code);
            setSelectedStateName(foundState.formattedName || foundState.name);

            const targetCommune = profile.commune || profile.city || profile.shopper?.commune;
            const cities = getCitiesByState(selectedCountryCode, foundState.code);
            if (targetCommune) {
              const matchedCity = cities.find((c) => c.name.toLowerCase() === String(targetCommune).toLowerCase());
              if (matchedCity) setSelectedCityName(matchedCity.name);
              else if (cities.length > 0) setSelectedCityName(cities[0].name);
            } else if (cities.length > 0) {
              setSelectedCityName(cities[0].name);
            }
          }
        }
      }

      // Do NOT auto-fill street address with store or example address ("Route d'Ath Yenni, Béjaïa Centre")
      const shopperAddr = profile.shopper?.address || profile.savedAddress || "";
      const storeAddr = myStore?.address || selectedStore?.address || "";
      if (shopperAddr && shopperAddr !== storeAddr && !shopperAddr.includes("Ath Yenni") && !streetAddress) {
        setStreetAddress(shopperAddr);
      }
    }
  }, [isExpressCheckoutOpen, isBottomInlineCheckoutOpen, getAuthenticatedUserProfile]);

  // Store setting field configurations (configurable show/hide & required/optional)
  const checkoutFieldConfig = useMemo(() => {
    const storeConfig = (selectedStore as any)?.checkoutFields;
    return {
      fullName: { show: storeConfig?.fullName?.show ?? true, required: storeConfig?.fullName?.required ?? true },
      phone: { show: storeConfig?.phone?.show ?? true, required: storeConfig?.phone?.required ?? true },
      messagingApps: { show: storeConfig?.messagingApps?.show ?? true, required: storeConfig?.messagingApps?.required ?? false },
      country: { show: storeConfig?.country?.show ?? true, required: storeConfig?.country?.required ?? true },
      wilaya: { show: storeConfig?.wilaya?.show ?? true, required: storeConfig?.wilaya?.required ?? true },
      commune: { show: storeConfig?.commune?.show ?? true, required: false },
      streetAddress: { show: storeConfig?.streetAddress?.show ?? true, required: false },
      email: { show: storeConfig?.email?.show ?? false, required: false },
      terms: { show: storeConfig?.terms?.show ?? true, required: storeConfig?.terms?.required ?? true },
    };
  }, [selectedStore]);

  const isFormValid = useMemo(() => {
    if (checkoutFieldConfig.fullName.required && !fullNameValidation.isValid) return false;
    if (checkoutFieldConfig.phone.required && !phoneValidation.isValid) return false;
    if (!selectedCountryName || !selectedCountryCode) return false;
    if (stateOptions.length > 0 && !selectedStateName) return false;
    if (checkoutFieldConfig.terms.show && !agreedToTerms) return false;
    return true;
  }, [
    checkoutFieldConfig,
    fullNameValidation.isValid,
    phoneValidation.isValid,
    selectedCountryName,
    selectedCountryCode,
    stateOptions.length,
    selectedStateName,
    agreedToTerms,
  ]);

  // Sync delivery company when selectedProduct specifies one
  useEffect(() => {
    if (selectedProduct?.deliveryCompany) {
      const companyName = selectedProduct.deliveryCompany.toLowerCase();
      const matched = DELIVERY_COMPANIES.find((c) => 
        c.id === companyName ||
        c.name.toLowerCase() === companyName ||
        companyName.includes(c.id) ||
        c.name.toLowerCase().includes(companyName)
      );
      if (matched) {
        setSelectedDeliveryCompanyId(matched.id);
      }
    }
  }, [selectedProduct?.deliveryCompany, DELIVERY_COMPANIES]);

  const selectedDeliveryCompany = useMemo(() => {
    const found = DELIVERY_COMPANIES.find((c) => c.id === selectedDeliveryCompanyId);
    if (found) return found;
    if (selectedProduct?.deliveryCompany) {
      const matched = DELIVERY_COMPANIES.find(
        (c) =>
          c.id === selectedProduct.deliveryCompany?.toLowerCase() ||
          c.name.toLowerCase() === selectedProduct.deliveryCompany?.toLowerCase()
      );
      if (matched) return matched;
      return {
        id: selectedProduct.deliveryCompany,
        name: selectedProduct.deliveryCompany,
        color: "text-indigo-600 bg-indigo-50 border-indigo-200",
      };
    }
    return DELIVERY_COMPANIES[0];
  }, [selectedDeliveryCompanyId, DELIVERY_COMPANIES, selectedProduct?.deliveryCompany]);

  // Strictly link shipping price with the selected delivery company and destination Wilaya without any mistake
  const displayHomePrice = useMemo(() => {
    if (selectedCountryCode !== "DZ" && !selectedCountry.includes("Algeria")) {
      if (selectedCountry.includes("France")) return 2500;
      if (selectedCountry.includes("Tunisia")) return 1800;
      return 4500;
    }
    const carrierKey = selectedDeliveryCompany?.id || selectedDeliveryCompany?.name || "yalidine";
    return calculateDynamicShippingFee({
      carrier: carrierKey,
      wilaya: selectedWilaya.id,
      deliveryType: "home",
    }).feeInDzd;
  }, [selectedCountryCode, selectedCountry, selectedWilaya.id, selectedDeliveryCompany]);

  const displayDeskPrice = useMemo(() => {
    if (selectedCountryCode !== "DZ" && !selectedCountry.includes("Algeria")) {
      if (selectedCountry.includes("France")) return 2200;
      if (selectedCountry.includes("Tunisia")) return 1500;
      return 4000;
    }
    const carrierKey = selectedDeliveryCompany?.id || selectedDeliveryCompany?.name || "yalidine";
    return calculateDynamicShippingFee({
      carrier: carrierKey,
      wilaya: selectedWilaya.id,
      deliveryType: "stop_desk",
    }).feeInDzd;
  }, [selectedCountryCode, selectedCountry, selectedWilaya.id, selectedDeliveryCompany]);

  const calculatedShippingFee = useMemo(() => {
    return shippingMethod === "home" ? displayHomePrice : displayDeskPrice;
  }, [shippingMethod, displayHomePrice, displayDeskPrice]);

  const calculatedSubtotal = useMemo(() => {
    if (isOffersActive && activeOfferPricing) {
      return activeOfferPricing.finalPrice;
    }
    return activePrice * purchaseQty;
  }, [isOffersActive, activeOfferPricing, activePrice, purchaseQty]);

  const calculatedDiscountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    const currentStoreId = selectedStore?.id || myStore?.id || "";
    if (appliedPromo.storeId && currentStoreId && appliedPromo.storeId !== currentStoreId) {
      return 0;
    }
    if (appliedPromo.minPurchase && calculatedSubtotal < appliedPromo.minPurchase) {
      return 0;
    }
    if (appliedPromo.type === "fixed") {
      return Math.min(calculatedSubtotal, Math.max(0, Math.round(appliedPromo.value)));
    }
    return Math.min(calculatedSubtotal, Math.round((calculatedSubtotal * appliedPromo.value) / 100));
  }, [calculatedSubtotal, appliedPromo, selectedStore?.id, myStore?.id]);

  // Grand Total = Items Subtotal - Discount + Auto-calculated Shipping Fee
  const calculatedGrandTotal = useMemo(() => {
    return Math.max(0, calculatedSubtotal - calculatedDiscountAmount + calculatedShippingFee);
  }, [calculatedSubtotal, calculatedDiscountAmount, calculatedShippingFee]);

  // States for hover zoom on product image
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, pxX: 0, pxY: 0, containerW: 0, containerH: 0 });
  const [activeLandingSectionTab, setActiveLandingSectionTab] = useState<"features" | "whyus" | "craftsmanship">("features");

  // Dynamic measurement for widescreen desktop zoom flyout covering middle column + buy box
  const mainGridRef = useRef<HTMLDivElement>(null);
  const mainImageContainerRef = useRef<HTMLDivElement>(null);
  const [flyoutBounds, setFlyoutBounds] = useState({ width: 980, topOffset: 24 });

  const updateFlyoutBounds = useCallback(() => {
    if (mainGridRef.current && mainImageContainerRef.current) {
      const gridRect = mainGridRef.current.getBoundingClientRect();
      const imgRect = mainImageContainerRef.current.getBoundingClientRect();
      // Distance from right edge of image container to right edge of the entire layout
      const spanW = Math.round(gridRect.right - imgRect.right - 20);
      // Vertical difference between top of the product column and image container + buffer so title is fully obscured
      const topDiff = Math.max(22, Math.round(imgRect.top - gridRect.top) + 8);
      setFlyoutBounds({
        width: spanW > 450 ? spanW : 980,
        topOffset: topDiff,
      });
    }
  }, []);

  useEffect(() => {
    updateFlyoutBounds();
    window.addEventListener("resize", updateFlyoutBounds);
    return () => window.removeEventListener("resize", updateFlyoutBounds);
  }, [updateFlyoutBounds]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const pxX = e.clientX - left;
    const pxY = e.clientY - top;
    // Constrain percentages to 0-100% just in case of slight edge bleed
    const x = Math.max(0, Math.min(100, (pxX / width) * 100));
    const y = Math.max(0, Math.min(100, (pxY / height) * 100));
    setZoomPos({ x, y, pxX, pxY, containerW: width, containerH: height });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) return;
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
      const pxX = Math.max(0, Math.min(width, touch.clientX - left));
      const pxY = Math.max(0, Math.min(height, touch.clientY - top));
      const x = Math.max(0, Math.min(100, (pxX / width) * 100));
      const y = Math.max(0, Math.min(100, (pxY / height) * 100));
      setZoomPos({ x, y, pxX, pxY, containerW: width, containerH: height });
      setIsZoomed(true);
    }
  };

  // Preload ultra-high resolution image for crystal clear, instantaneous zoom
  useEffect(() => {
    const rawUrl = currentPreviewImage || selectedProduct.imageUrl;
    const highResUrl = getHighResZoomUrl(rawUrl);
    if (highResUrl) {
      const img = new Image();
      img.src = highResUrl;
    }
  }, [currentPreviewImage, selectedProduct.imageUrl]);

  // --- ALGERIAN HERITAGE SENSORY CREATIVE ENGINE ---
  const DYE_SECRETS: Record<string, { dye: string; ritual: string; element: string; icon: string }> = {
    "Cream White": {
      dye: "Pure Unbleached Mountain Fleece",
      ritual: "Hand-washed seven times in the natural springs of Kabylie, scented with dried wild lavender stalks.",
      element: "Natural Flora Eco-Wax",
      icon: "🐑"
    },
    "Rust & Crimson": {
      dye: "Wild Madder Roots & Dried Pomegranate Skins",
      ritual: "Crushed on hand mills, then boiled in heavy iron vats for 12 hours under cedarwood embers.",
      element: "Traditional Organic Alum",
      icon: "🍁"
    },
    "Indigo Blue": {
      dye: "Fermented Northern Sahara Indigo Leaves",
      ritual: "Aged in deep clay amphora jars with local mountain dates to generate rich, oxygenated indigo baths.",
      element: "Ashes of Desert Oakwood",
      icon: "🌀"
    },
    "Emerald Moss": {
      dye: "Thyme Infusions & Mountain Copper Sulfate",
      ritual: "Harvested at high altitudes, boiled together to reveal deep vegetative greens mimicking evergreen forests.",
      element: "Stones of Ochre Mud",
      icon: "🌱"
    },
    "Classic Silver": {
      dye: "Natural Slate Pulverized & Mint Sap",
      ritual: "Ground river slate stone blended with field mint to create defensive shades that ward off ambient humidity.",
      element: "Finest Zinc Mineral Oils",
      icon: "💎"
    },
    "Midnight Black": {
      dye: "Traditional Oak Charcoal & Iron-Rich Mud",
      ritual: "Meticulously double-infused with natural tannin leaves to bind dense, light-proof deep lines.",
      element: "Punica Granatum Juice",
      icon: "🖤"
    },
    "Royal Emerald": {
      dye: "Pressed Mountain Chlorophyte & Wild Clover",
      ritual: "Slow cold-press extraction of high-altitude leaves preserved in honeyed solutions.",
      element: "Kabylie Copper Crystals",
      icon: "❇️"
    },
    "Desert Sand": {
      dye: "Powdered Ocher Sediments & Rosemary Oils",
      ritual: "Harvested from the Sahara-fringe plateaus, massaged directly into warm wet wool before warp knotting.",
      element: "Natural Spring Carbonates",
      icon: "🏜️"
    }
  };

  // Ambient Loom Synthesizer sound engine
  const [isPlayingLoomSound, setIsPlayingLoomSound] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [loomTimerId, setLoomTimerId] = useState<any>(null);

  const handleToggleLoomSound = () => {
    if (isPlayingLoomSound) {
      if (loomTimerId) {
        clearInterval(loomTimerId);
        setLoomTimerId(null);
      }
      setIsPlayingLoomSound(false);
      return;
    }

    try {
      const gWin = window as any;
      const AudioContextClass = gWin.AudioContext || gWin.webkitAudioContext;
      const ctx = audioCtx || new AudioContextClass();
      if (!audioCtx) {
        setAudioCtx(ctx);
      }
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      setIsPlayingLoomSound(true);

      let step = 0;
      const interval = setInterval(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          if (step % 2 === 0) {
            // Wood shuttle sliding (soft white noise or slide)
            osc.type = "sine";
            osc.frequency.setValueAtTime(380, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11);
            osc.start();
            osc.stop(ctx.currentTime + 0.13);
          } else {
            // Weaver tight knot thump (lower heavy pitch)
            osc.type = "triangle";
            osc.frequency.setValueAtTime(80, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.22);
            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.21);
            osc.start();
            osc.stop(ctx.currentTime + 0.23);
          }
          step += 1;
        } catch (err) {
          console.warn("Synth play error:", err);
        }
      }, 450);

      setLoomTimerId(interval);
    } catch (e) {
      console.warn("Could not initiate native voice synthesizer:", e);
    }
  };

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (loomTimerId) {
        clearInterval(loomTimerId);
      }
    };
  }, [loomTimerId]);

  // Blessings Counter and interaction
  const [blessingCount, setBlessingCount] = useState(4912);
  const [hasBlessed, setHasBlessed] = useState(false);
  const [showBlessingToast, setShowBlessingToast] = useState(false);

  const handleSendBlessing = () => {
    if (hasBlessed) return;
    setBlessingCount(prev => prev + 1);
    setHasBlessed(true);
    setShowBlessingToast(true);
    setTimeout(() => {
      setShowBlessingToast(false);
    }, 4500);
  };

  // Threaded comments state
  const [threadedComments, setThreadedComments] = useState<ThreadedComment[]>([
    {
      id: "c1",
      author: "Fatima K.",
      role: "Shopper",
      badge: "Verified Purchase",
      purchasedVariant: "Black • XL",
      text: "Authentique chef-d'œuvre! La qualité est exceptionnelle, la laine est d'une tendresse rare.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      avatarBg: "bg-purple-100 text-purple-700 border-purple-200",
      time: "2 hours ago",
      likes: 18,
      emoji: "👍",
      parentId: null,
      replies: [
        {
          id: "r1",
          author: `${selectedStore.name} Support`,
          role: "Store Admin",
          text: "Merci infiniment Fatima pour votre soutien aux artisans locaux! Nous sommes ravis que le produit vous plaise.",
          avatar: selectedStore.logo || (selectedStore as any).logoUrl || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=150&auto=format&fit=crop&q=80",
          avatarBg: "bg-indigo-100 text-indigo-800 border-indigo-300",
          time: "1 hour ago",
          likes: 6,
          emoji: "😊",
          parentId: "c1",
        },
        {
          id: "r2",
          author: "gfhfgh",
          role: "Shopper",
          text: "ghjghjgfjg",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          avatarBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
          time: "Just now",
          likes: 0,
          emoji: "😊",
          parentId: "c1",
        }
      ]
    }
  ]);

  useEffect(() => {
    if (selectedStore?.name) {
      setThreadedComments((prev) =>
        prev.map((c) => ({
          ...c,
          replies: c.replies?.map((r) => {
            if (r.id === "r1" || r.role === "Store Admin") {
              return {
                ...r,
                author: `${selectedStore.name} Support`,
                avatar: selectedStore.logo || (selectedStore as any).logoUrl || r.avatar
              };
            }
            return r;
          })
        }))
      );
    }
  }, [selectedStore?.name, selectedStore?.logo]);

  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const hasUserPurchasedCurrentProduct = useMemo(() => {
    try {
      const saved = localStorage.getItem("yume_cached_orders");
      if (!saved) return false;
      const orders: any[] = JSON.parse(saved);
      return orders.some((ord) => {
        const prodId = selectedProduct?.id;
        const prodName = selectedProduct?.name;
        if (ord.items && Array.isArray(ord.items)) {
          return ord.items.some(
            (item: any) =>
              (prodId && item.productId === prodId) ||
              (prodName && (item.title === prodName || item.name === prodName))
          );
        }
        if (ord.product) {
          return (
            (prodId && ord.product.id === prodId) ||
            (prodName && ord.product.name === prodName)
          );
        }
        return false;
      });
    } catch {
      return false;
    }
  }, [selectedProduct?.id, selectedProduct?.name]);

  const handleAddThreadedComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const identity = getUserCommentIdentity();

    const newComment: ThreadedComment = {
      id: `rc_${Date.now()}`,
      author: identity.author,
      role: identity.role,
      badge: identity.badge,
      text: newCommentText.trim(),
      avatar: identity.avatar,
      avatarBg: identity.avatarBg,
      time: "Just now",
      likes: 0,
      parentId: replyingToId || null,
      replies: [],
    };

    setThreadedComments((prev) => {
      if (replyingToId) {
        return prev.map((c) => {
          if (c.id === replyingToId) {
            return {
              ...c,
              replies: [...(c.replies || []), newComment],
            };
          }
          return c;
        });
      } else {
        return [newComment, ...prev];
      }
    });

    setNewCommentText("");
    setReplyingToId(null);
  };

  const handleToggleReplyLike = (rootId: string, replyId: string) => {
    setThreadedComments((prev) => 
      prev.map((c) => {
        if (c.id === rootId) {
          return {
            ...c,
            replies: c.replies?.map((r) => {
              if (r.id === replyId) {
                const liked = !r.liked;
                const likes = r.likes + (liked ? 1 : -1);
                return { ...r, likes, liked };
              }
              return r;
            })
          };
        }
        return c;
      })
    );
  };

  const handleToggleReplyLove = (rootId: string, replyId: string) => {
    setThreadedComments((prev) => 
      prev.map((c) => {
        if (c.id === rootId) {
          return {
            ...c,
            replies: c.replies?.map((r) => {
              if (r.id === replyId) {
                const loved = !r.loved;
                const likes = r.likes + (loved ? 1 : -1);
                return { ...r, likes, loved };
              }
              return r;
            })
          };
        }
        return c;
      })
    );
  };

  const design = selectedStore.designSettings || {
    width: "large",
    height: "large",
    bgColor: "#ffffff",
    borderColor: "#1e293b",
    borderStyle: "solid",
    borderWidth: "4px",
    borderRadius: "3xl"
  };

  // Convert default values to dynamic borders requested by merchant
  const outerBorderColor = design.borderColor || "#e2e8f0";
  const outerBorderStyle = design.borderStyle || "solid";
  const outerBorderWidth = design.borderWidth || "1px";
  const outerBorderRadius = 
    design.borderRadius === "none" ? "0px" :
    design.borderRadius === "xl" ? "12px" :
    design.borderRadius === "2xl" ? "16px" :
    design.borderRadius === "3xl" ? "24px" :
    design.borderRadius === "full" ? "9999px" : "12px";

  const hasVideo = !!selectedProduct.videoUrl || isBerberRugProduct;

  const getVideoEmbedResult = (url: string = ""): { type: string; embedUrl: string } => {
    const autoplayParams = isAutoPlay ? "1" : "0";
    if (!url) {
      const defaultYtId = isBerberRugProduct ? "_POnm_C2Kts" : "GgA92gC4O3s";
      return {
        type: "youtube",
        embedUrl: `https://www.youtube.com/embed/${defaultYtId}?autoplay=${autoplayParams}&mute=0&controls=0&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&playsinline=1&loop=1&playlist=${defaultYtId}&disablekb=1&fs=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`
      };
    }

    // YouTube formats
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = "";
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
      } else if (url.includes("embed/")) {
        videoId = url.split("embed/")[1]?.split("?")[0] || "";
      } else if (url.includes("shorts/")) {
        videoId = url.split("shorts/")[1]?.split("?")[0] || "";
      } else if (url.includes("v=")) {
        videoId = url.split("v=")[1]?.split("&")[0] || "";
      }
      if (videoId) {
        return {
          type: "youtube",
          embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=${autoplayParams}&mute=0&controls=0&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&playsinline=1&loop=1&playlist=${videoId}&disablekb=1&fs=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`
        };
      }
    }

    // Facebook formats
    if (url.includes("facebook.com") || url.includes("fb.watch") || url.includes("fb.com")) {
      return {
        type: "facebook",
        embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&autoplay=1`
      };
    }

    // Vimeo formats
    if (url.includes("vimeo.com")) {
      const vimeoMatches = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
      const vimeoId = vimeoMatches ? vimeoMatches[3] : "";
      if (vimeoId) {
        return {
          type: "vimeo",
          embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`
        };
      }
    }

    // TikTok formats
    if (url.includes("tiktok.com")) {
      let videoId = "";
      const matches = url.match(/\/video\/(\d+)/);
      if (matches && matches[1]) {
        videoId = matches[1];
      } else {
        const embedMatches = url.match(/\/embed\/(\d+)/);
        if (embedMatches && embedMatches[1]) {
          videoId = embedMatches[1];
        }
      }
      if (videoId) {
        return {
          type: "tiktok",
          embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`
        };
      }
      const lastSegment = url.split("/").pop()?.split("?")[0] || "";
      if (/^\d+$/.test(lastSegment)) {
        return {
          type: "tiktok",
          embedUrl: `https://www.tiktok.com/embed/v2/${lastSegment}`
        };
      }
      return {
        type: "tiktok",
        embedUrl: url
      };
    }

    // Direct video formats
    if (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg") || url.includes(".mp4?")) {
      return {
        type: "direct",
        embedUrl: url
      };
    }

    // Other/Fallbacks
    return {
      type: "unknown",
      embedUrl: url
    };
  };

  const getYouTubeThumbnail = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = "";
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
      } else if (url.includes("embed/")) {
        videoId = url.split("embed/")[1]?.split("?")[0] || "";
      } else if (url.includes("shorts/")) {
        videoId = url.split("shorts/")[1]?.split("?")[0] || "";
      } else if (url.includes("v=")) {
        videoId = url.split("v=")[1]?.split("&")[0] || "";
      }
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }
    return null;
  };

  const productVideoList = selectedProduct.videoUrls && selectedProduct.videoUrls.length > 0
    ? selectedProduct.videoUrls
    : (selectedProduct.videoUrl ? [selectedProduct.videoUrl] : (isBerberRugProduct ? ["https://www.youtube.com/watch?v=_POnm_C2Kts"] : []));

  const renderOrderFormCard = (onCloseForm: () => void, isFullWidth = false, isStandalonePage = false) => {
    const headerAccent = currentSlideColor || activeThemeColor || "#4A0E2E";
    const dialCodeStr = currentCountryObj?.phonecode?.replace(/\D/g, "") || "213";
    const variantSummaryText =
      isOffersActive && offerSelectionSummaryText
        ? offerSelectionSummaryText
        : [chosenColor, chosenSize].filter(Boolean).join(" / ") || "Standard";

    return (
      <div
        className={`relative w-full bg-[#F4EFF2] dark:bg-slate-950 transition-colors duration-300 ease-in-out ${
          isStandalonePage
            ? "min-h-screen flex flex-col justify-start"
            : isFullWidth
            ? "w-full mx-auto overflow-hidden rounded-[28px]"
            : "max-w-[1120px] w-full mx-auto max-h-[95vh] overflow-hidden rounded-[28px] flex flex-col"
        }`}
      >
        {/* Decorative Background Curved Corner Waves matching exact design in screenshots */}
        <CheckoutPageBackground accentColor={headerAccent} isFixed={isStandalonePage} />

        {/* Scrollable Content Wrapper */}
        <div
          className={`relative z-10 ${
            isStandalonePage
              ? "w-full max-w-[1120px] mx-auto px-4 sm:px-8 py-6 sm:py-8 flex-1 flex flex-col"
              : "overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 flex-1 min-h-0"
          }`}
        >
          {/* Top Brand Bar: YUME Brandmark on Left, Clean Secure Checkout on Right */}
          <div className="flex items-center justify-between mb-4 sm:mb-5 px-1">
            <div className="flex items-center gap-2">
              <YumeBrandLogo accentColor={headerAccent} />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCloseForm}
                className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                title="Close form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main White Rounded Checkout Container */}
          <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[28px] shadow-[0_15px_45px_rgba(74,14,46,0.05),0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/60 dark:border-slate-800 p-5 sm:p-8 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* LEFT COLUMN: Order Form Steps (7 Cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Back to cart & Form Title */}
                <div className="space-y-2 border-b border-stone-100 dark:border-slate-800 pb-4">
                  <button
                    type="button"
                    onClick={onCloseForm}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to cart</span>
                  </button>

                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-6 h-6 shrink-0 dark:!text-slate-200" style={{ color: headerAccent }} />
                    <h2
                      className="text-xl sm:text-2xl font-extrabold tracking-tight dark:!text-white"
                      style={{ color: headerAccent }}
                    >
                      Order Form
                    </h2>
                  </div>
                  <p className="text-xs sm:text-[13px] text-stone-500 dark:text-slate-400">
                    Please fill in the required information to complete your order.
                  </p>
                </div>

                {/* Delivery Method Field */}
                <div className="space-y-1.5 border-b border-stone-100 pb-5">
                  <label className="flex items-baseline gap-1.5 text-xs font-bold text-slate-800 flex-wrap">
                    <span>Delivery Method</span>
                    <span className="text-rose-500 font-bold">*</span>
                    <span className="text-stone-500 font-normal text-[11.5px]">
                      (Choose how you want your order delivered)
                    </span>
                  </label>
                    <div className="relative">
                      <Truck
                        className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: headerAccent }}
                      />
                      <select
                        aria-label="Delivery Method"
                        value={shippingMethod}
                        onChange={(e) => setShippingMethod(e.target.value as "home" | "stopdesk")}
                        className="w-full h-11 pl-10 pr-9 rounded-xl border border-stone-200 bg-white text-xs font-bold text-slate-900 outline-none cursor-pointer hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-200/50 transition-all shadow-2xs appearance-none"
                      >
                        <option value="home">
                          Home Delivery (Delivered to your door)
                        </option>
                        <option value="stopdesk">
                          Stop Desk (Pick up from courier office)
                        </option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>

                {/* Contact Information & Location */}
                <div className="space-y-3.5 border-b border-stone-100 pb-5">
                  {/* Row 1: Full Name & Phone Number side-by-side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        {fullNameTouched && fullNameValidation.isValid && (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <User
                          className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                            fullNameTouched && !fullNameValidation.isValid ? "text-rose-400" : "text-stone-400"
                          }`}
                        />
                        <input
                          type="text"
                          value={buyerFullName}
                          onChange={(e) => {
                            setBuyerFullName(e.target.value);
                            if (!fullNameTouched) setFullNameTouched(true);
                            if (formValidationErrors.length > 0) setFormValidationErrors([]);
                          }}
                          onBlur={() => {
                            setFullNameTouched(true);
                            setBuyerFullName((prev) => prev.trim().replace(/\s+/g, " "));
                          }}
                          placeholder="Enter your full name"
                          className={`w-full h-10 pl-9 pr-3 rounded-xl border bg-white text-xs font-medium text-slate-900 placeholder:text-stone-400 outline-none transition-all ${
                            fullNameTouched && !fullNameValidation.isValid
                              ? "border-rose-300 ring-1 ring-rose-500/20 bg-rose-50/20"
                              : fullNameTouched && fullNameValidation.isValid
                              ? "border-emerald-500/60 ring-1 ring-emerald-500/10"
                              : "border-stone-200 focus:border-slate-800"
                          }`}
                        />
                      </div>
                      {fullNameTouched && !fullNameValidation.isValid && (
                        <p className="text-[10.5px] font-semibold text-rose-600 flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fullNameValidation.message}</span>
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800">
                          Phone Number <span className="text-rose-500">*</span>
                        </label>
                        {phoneTouched && phoneValidation.isValid && (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pr-2.5 border-r border-stone-200 text-xs font-sans font-semibold text-slate-700 pointer-events-none select-none z-10 tracking-tight">
                          <span>+{dialCodeStr}</span>
                        </div>
                        <input
                          type="tel"
                          value={buyerPhone}
                          onChange={(e) => {
                            const digitsOnly = e.target.value.replace(/\D/g, "");
                            setBuyerPhone(digitsOnly);
                            if (!phoneTouched) setPhoneTouched(true);
                            if (formValidationErrors.length > 0) setFormValidationErrors([]);
                          }}
                          onBlur={() => setPhoneTouched(true)}
                          placeholder="0550 00 00 00"
                          className={`w-full h-10 pl-16 pr-3 rounded-xl border bg-white text-xs font-sans font-medium text-slate-900 placeholder:text-stone-400 outline-none transition-all ${
                            phoneTouched && !phoneValidation.isValid
                              ? "border-rose-300 ring-1 ring-rose-500/20 bg-rose-50/20"
                              : phoneTouched && phoneValidation.isValid
                              ? "border-emerald-500/60 ring-1 ring-emerald-500/10"
                              : "border-stone-200 focus:border-slate-800"
                          }`}
                        />
                      </div>
                      {phoneTouched && !phoneValidation.isValid && (
                        <p className="text-[10.5px] font-semibold text-rose-600 flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{phoneValidation.message}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* DIRECTLY UNDER NAME AND PHONE NUMBER: Additional Contact (Optional) */}
                  <div className="bg-stone-50/80 border border-stone-200/80 rounded-2xl p-3.5 space-y-3">
                    <button
                      type="button"
                      onClick={() => setIsMessagingAppsOpen(!isMessagingAppsOpen)}
                      className="w-full flex items-center justify-between text-left cursor-pointer select-none"
                    >
                      <div
                        className="text-xs font-extrabold flex items-center gap-1.5"
                        style={{ color: headerAccent }}
                      >
                        <span>+ Add additional contact (optional)</span>
                      </div>
                      <ChevronUp
                        className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${
                          isMessagingAppsOpen ? "" : "rotate-180"
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isMessagingAppsOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-2.5 overflow-hidden pt-1"
                        >
                          {/* WhatsApp Row */}
                          <div className="flex items-center gap-2.5">
                            <div className="w-28 flex items-center gap-2 shrink-0">
                              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <MessageCircle className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-xs font-bold text-slate-800">WhatsApp</span>
                            </div>
                            <div className="relative flex-1">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-sans font-semibold text-stone-600 pr-1.5 border-r border-stone-200">
                                +{dialCodeStr}
                              </span>
                              <input
                                type="tel"
                                disabled={!enableWhatsapp}
                                value={buyerWhatsapp}
                                onChange={(e) => setBuyerWhatsapp(e.target.value)}
                                placeholder={buyerPhone || "550 12 34 56"}
                                className="w-full h-9 pl-13 pr-3 rounded-xl border border-stone-200 bg-white text-xs font-sans font-medium text-slate-900 placeholder:text-stone-400 outline-none focus:border-emerald-500 disabled:opacity-50"
                              />
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={enableWhatsapp}
                              onClick={() => setEnableWhatsapp(!enableWhatsapp)}
                              className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                                enableWhatsapp ? "bg-emerald-500" : "bg-stone-300"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white shadow-2xs transition-transform ${
                                  enableWhatsapp ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          {/* Viber Row */}
                          <div className="flex items-center gap-2.5">
                            <div className="w-28 flex items-center gap-2 shrink-0">
                              <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <PhoneCall className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-xs font-bold text-slate-800">Viber</span>
                            </div>
                            <div className="relative flex-1">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-sans font-semibold text-stone-600 pr-1.5 border-r border-stone-200">
                                +{dialCodeStr}
                              </span>
                              <input
                                type="tel"
                                disabled={!enableViber}
                                value={buyerViber}
                                onChange={(e) => setBuyerViber(e.target.value)}
                                placeholder={buyerPhone || "550 12 34 56"}
                                className="w-full h-9 pl-13 pr-3 rounded-xl border border-stone-200 bg-white text-xs font-sans font-medium text-slate-900 placeholder:text-stone-400 outline-none focus:border-purple-500 disabled:opacity-50"
                              />
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={enableViber}
                              onClick={() => setEnableViber(!enableViber)}
                              className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                                enableViber ? "bg-purple-600" : "bg-stone-300"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white shadow-2xs transition-transform ${
                                  enableViber ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          {/* Telegram Row */}
                          <div className="flex items-center gap-2.5">
                            <div className="w-28 flex items-center gap-2 shrink-0">
                              <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Send className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-xs font-bold text-slate-800">Telegram</span>
                            </div>
                            <div className="relative flex-1">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-sans font-semibold text-stone-600 pr-1.5 border-r border-stone-200">
                                +{dialCodeStr}
                              </span>
                              <input
                                type="text"
                                disabled={!enableTelegram}
                                value={buyerTelegram}
                                onChange={(e) => setBuyerTelegram(e.target.value)}
                                placeholder={buyerPhone || "@username or number"}
                                className="w-full h-9 pl-13 pr-3 rounded-xl border border-stone-200 bg-white text-xs font-sans font-medium text-slate-900 placeholder:text-stone-400 outline-none focus:border-sky-500 disabled:opacity-50"
                              />
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={enableTelegram}
                              onClick={() => setEnableTelegram(!enableTelegram)}
                              className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                                enableTelegram ? "bg-sky-500" : "bg-stone-300"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white shadow-2xs transition-transform ${
                                  enableTelegram ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          {/* Email Row */}
                          <div className="flex items-center gap-2.5">
                            <div className="w-28 flex items-center gap-2 shrink-0">
                              <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Mail className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-xs font-bold text-slate-800">Email</span>
                            </div>
                            <div className="relative flex-1">
                              <input
                                type="email"
                                disabled={!enableEmail}
                                value={buyerEmail}
                                onChange={(e) => setBuyerEmail(e.target.value)}
                                placeholder="Enter your email address (optional)"
                                className="w-full h-9 px-3 rounded-xl border border-stone-200 bg-white text-xs text-slate-900 placeholder:text-stone-400 outline-none focus:border-rose-500 disabled:opacity-50"
                              />
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={enableEmail}
                              onClick={() => setEnableEmail(!enableEmail)}
                              className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                                enableEmail ? "bg-rose-500" : "bg-stone-300"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white shadow-2xs transition-transform ${
                                  enableEmail ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* LOCATION FIELDS: Country (auto-detected by IP), State facing City, and Address under them */}
                  <div className="space-y-3 pt-1">
                    {/* Country Field (Automatically set by IP) */}
                    <SearchableLocationSelect
                      label="Country"
                      required
                      value={selectedCountryName}
                      onChange={handleCountryChange}
                      options={countryOptions}
                      placeholder="Select country..."
                      searchPlaceholder="Search country..."
                      icon={Globe}
                    />

                    {/* State * FACING City (optional) side-by-side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {stateOptions.length > 0 ? (
                        <SearchableLocationSelect
                          label="State"
                          required
                          value={selectedStateName}
                          onChange={handleStateChange}
                          options={stateOptions}
                          placeholder="Select state..."
                          searchPlaceholder="Search state..."
                          icon={MapPin}
                        />
                      ) : (
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-800">
                            State <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={selectedStateName}
                            onChange={(e) => setSelectedStateName(e.target.value)}
                            placeholder="Select state..."
                            className="w-full h-10 px-3 rounded-xl border border-stone-200 bg-white text-xs font-medium text-slate-900 outline-none"
                          />
                        </div>
                      )}

                      {cityOptions.length > 0 ? (
                        <SearchableLocationSelect
                          label="City *"
                          required={true}
                          value={selectedCityName}
                          onChange={handleCityChange}
                          options={cityOptions}
                          placeholder="Select city..."
                          searchPlaceholder="Search city..."
                          icon={Building}
                        />
                      ) : (
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-800">
                            City <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <div className="relative">
                            <Building className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={selectedCityName}
                              onChange={(e) => setSelectedCityName(e.target.value)}
                              placeholder="Enter city..."
                              required
                              className="w-full h-10 pl-9 pr-3 rounded-xl border border-stone-200 bg-white text-xs font-medium text-slate-900 placeholder:text-stone-400 outline-none focus:border-slate-800 transition-all"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Address (optional) UNDER State & City */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-800">
                        Address <span className="text-stone-400 font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          placeholder="Street address, apartment, suite, etc. (optional)"
                          className="w-full h-10 pl-9 pr-3 rounded-xl border border-stone-200 bg-white text-xs font-medium text-slate-900 placeholder:text-stone-400 outline-none focus:border-slate-800 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coupon Code */}
                <div className="space-y-2.5">
                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold text-emerald-900 font-mono">{appliedPromo.code}</span>
                        <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                          {appliedPromo.type === "fixed"
                            ? `-${appliedPromo.value.toLocaleString()} DA OFF`
                            : `-${appliedPromo.value}% OFF`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromoCode}
                        className="text-emerald-700 hover:text-emerald-950 font-bold text-xs hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => {
                            setPromoCodeInput(e.target.value.trimStart());
                            if (promoError) setPromoError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleApplyPromoCode(promoCodeInput.trim());
                            }
                          }}
                          placeholder="Enter store coupon code"
                          className="w-full h-10 pl-9 pr-3 rounded-xl border border-stone-200 bg-white text-xs font-medium text-slate-900 placeholder:text-stone-400 outline-none focus:border-slate-800 uppercase font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isValidatingPromo}
                        onClick={() => handleApplyPromoCode(promoCodeInput.trim())}
                        className="px-5 h-10 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 border disabled:opacity-60"
                        style={{
                          backgroundColor: hexToRgba(headerAccent, 0.12),
                          borderColor: hexToRgba(headerAccent, 0.25),
                          color: headerAccent,
                        }}
                      >
                        {isValidatingPromo ? "Checking..." : "Apply"}
                      </button>
                    </div>
                  )}
                  {promoError && (
                    <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {promoError}
                    </p>
                  )}
                  {promoSuccess && (
                    <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {promoSuccess}
                    </p>
                  )}
                </div>

                {/* Terms Agreement Checkbox */}
                <div
                  className={`p-2.5 rounded-xl transition-all ${
                    termsErrorHighlight ? "bg-rose-50 border border-rose-300" : ""
                  }`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        if (termsErrorHighlight) setTermsErrorHighlight(false);
                        if (formValidationErrors.length > 0) setFormValidationErrors([]);
                      }}
                      className="w-4 h-4 rounded border-stone-300 cursor-pointer accent-slate-900"
                    />
                    <span className="text-xs text-stone-600">
                      I agree to the{" "}
                      <span className="font-bold underline" style={{ color: headerAccent }}>
                        Terms of Service
                      </span>{" "}
                      and{" "}
                      <span className="font-bold underline" style={{ color: headerAccent }}>
                        Privacy Policy
                      </span>
                    </span>
                  </label>
                </div>

                {/* Validation Error Banner */}
                {formValidationErrors.length > 0 && (
                  <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-rose-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Please complete the required fields:</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] font-semibold space-y-0.5 text-rose-700 pl-1">
                      {formValidationErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Place Order Button */}
                <button
                  type="button"
                  disabled={isSubmittingOrder}
                  onClick={() => {
                    setFullNameTouched(true);
                    setPhoneTouched(true);
                    setCityTouched(true);

                    const errors: string[] = [];
                    if (checkoutFieldConfig.fullName.required && !fullNameValidation.isValid) {
                      errors.push(fullNameValidation.message || "Please enter your full name.");
                    }
                    if (checkoutFieldConfig.phone.required && !phoneValidation.isValid) {
                      errors.push(phoneValidation.message || "Please enter a valid phone number.");
                    }
                    if (!selectedCountryName || !selectedCountryCode) {
                      errors.push("Country is required.");
                    }
                    if (stateOptions.length > 0 && !selectedStateName) {
                      errors.push("State is required.");
                    }
                    if (!selectedCityName || !selectedCityName.trim()) {
                      errors.push("City is required.");
                    }
                    if (checkoutFieldConfig.terms.show && !agreedToTerms) {
                      setTermsErrorHighlight(true);
                      setTimeout(() => setTermsErrorHighlight(false), 2000);
                      errors.push("Please agree to the Terms of Service and Privacy Policy.");
                    }

                    if (errors.length > 0) {
                      setFormValidationErrors(errors);
                      return;
                    }

                    setFormValidationErrors([]);
                    setIsSubmittingOrder(true);

                    setTimeout(() => {
                      const orderRefId = `YUME-${Math.floor(100000 + Math.random() * 900000)}`;
                      const finalPhone =
                        phoneValidation.canonicalValue ||
                        phoneValidation.formattedDisplay ||
                        `+${dialCodeStr} ${buyerPhone}`;
                      const finalName =
                        fullNameValidation.cleanName || buyerFullName.trim() || "Valued Customer";
                      const nowIso = new Date().toISOString();
                      const formattedNow = new Date().toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }) + " • " + new Date().toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      const cleanWilayaName =
                        selectedWilaya?.name?.replace(/^\d+\s*-\s*/, "") ||
                        selectedStateName.replace(/^\d+\s*-\s*/, "") ||
                        "Algiers";
                      const cleanWilayaCode = selectedWilaya?.id || selectedStateCode || "16";
                      const finalAddress = streetAddress.trim()
                        ? streetAddress.trim()
                        : [selectedCityName, cleanWilayaName, selectedCountryName]
                            .filter(Boolean)
                            .join(", ");

                      const newOrder = {
                        id: orderRefId,
                        orderId: orderRefId,
                        buyer: {
                          name: finalName,
                          phone: finalPhone,
                          email: enableEmail ? buyerEmail.trim() : "",
                          whatsapp: enableWhatsapp ? (buyerWhatsapp.trim() || finalPhone) : "",
                          viber: enableViber ? (buyerViber.trim() || finalPhone) : "",
                          telegram: enableTelegram ? (buyerTelegram.trim() || finalPhone) : "",
                          country: selectedCountryName || "Algeria",
                          countryCode: selectedCountryCode || "DZ",
                          state: cleanWilayaName,
                          stateCode: cleanWilayaCode,
                          wilaya: cleanWilayaName,
                          commune: selectedCityName || "",
                          city: selectedCityName || "",
                          address: finalAddress,
                        },
                        wilaya: { name: cleanWilayaName, code: cleanWilayaCode },
                        commune: selectedCityName || "",
                        city: selectedCityName || "",
                        address: finalAddress,
                        country: selectedCountryName || "Algeria",
                        countryCode: selectedCountryCode || "DZ",
                        state: cleanWilayaName,
                        stateCode: cleanWilayaCode,
                        deliveryCompany: selectedDeliveryCompany,
                        product: selectedProduct,
                        qty: purchaseQty,
                        subtotal: calculatedSubtotal,
                        discountAmount: calculatedDiscountAmount,
                        totalPrice: calculatedGrandTotal,
                        grandTotal: calculatedGrandTotal,
                        shippingFee: calculatedShippingFee,
                        deliveryType: shippingMethod,
                        promo: appliedPromo,
                        color: chosenColor || "Standard",
                        size: chosenSize || "One Size",
                        variant: matchedVariant || undefined,
                        variantId: matchedVariant?.id || undefined,
                        variantSku: matchedVariant?.sku || selectedProduct.sku,
                        variantOptions:
                          matchedVariant?.options ||
                          (Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined),
                        date: formattedNow,
                        status: "Confirmed",
                        createdAt: nowIso,
                        merchant: selectedStore,
                      };

                      // Build verified Store Owner Order payload for the "Orders" section
                      const storeOrderPayload: Order = {
                        id: orderRefId,
                        storeId: selectedStore?.id || myStore?.id || "store-1",
                        storeName: selectedStore?.name || myStore?.name || "Store",
                        date: nowIso,
                        shopper: {
                          name: finalName,
                          email: enableEmail ? buyerEmail.trim() : "",
                          phone: finalPhone,
                          whatsapp: enableWhatsapp ? (buyerWhatsapp.trim() || finalPhone) : "",
                          viber: enableViber ? (buyerViber.trim() || finalPhone) : "",
                          telegram: enableTelegram ? (buyerTelegram.trim() || finalPhone) : "",
                          country: selectedCountryName || "Algeria",
                          countryCode: selectedCountryCode || "DZ",
                          wilaya: cleanWilayaName,
                          wilayaCode: cleanWilayaCode,
                          commune: selectedCityName || "",
                          address: finalAddress,
                        },
                        isOfferOrder: Boolean(isOffersActive && activeOfferTier),
                        offerDetails:
                          isOffersActive && activeOfferTier
                            ? {
                                tierId: activeOfferTier.id,
                                tierTitle: activeOfferTier.title,
                                offerType: activeOfferTier.offerType,
                                badgeText: activeOfferTier.badgeText,
                                totalUnits: activeOfferPricing?.totalUnits || 1,
                                purchasedQuantity: activeOfferTier.purchasedQuantity || 1,
                                freeQuantity: activeOfferTier.freeQuantity || 0,
                                baseUnitPriceDzd: activeOfferPricing?.baseUnitPriceDzd || activePrice,
                                originalTotalDzd: activeOfferPricing?.originalTotalDzd || activePrice,
                                finalPriceDzd: activeOfferPricing?.finalPrice || activePrice,
                                savingsDzd: activeOfferPricing?.savingsDzd || 0,
                                savingsPercent: activeOfferPricing?.savingsPercent || 0,
                                summaryText: offerSelectionSummaryText,
                                unitSelections: offerUnitSelections,
                                freeGifts: activeOfferTier.freeGifts || [],
                              }
                            : undefined,
                        items: [
                          {
                            id: selectedProduct.id,
                            name:
                              isOffersActive && activeOfferTier
                                ? `${selectedProduct.name} (${activeOfferTier.title})`
                                : selectedProduct.name,
                            price:
                              isOffersActive && activeOfferPricing
                                ? activeOfferPricing.finalPrice
                                : activePrice,
                            quantity:
                              isOffersActive && activeOfferPricing
                                ? 1
                                : purchaseQty,
                            imageUrl:
                              selectedProduct.imageUrl || selectedProduct.images?.[0] || "",
                            color: chosenColor || "",
                            size: chosenSize || "",
                            sku: matchedVariant?.sku || selectedProduct.sku || "",
                            isOfferItem: Boolean(isOffersActive && activeOfferTier),
                            offerTierId: activeOfferTier?.id,
                            offerTitle: activeOfferTier?.title,
                            offerType: activeOfferTier?.offerType,
                            offerTotalUnits: activeOfferPricing?.totalUnits,
                            offerPurchasedQty: activeOfferTier?.purchasedQuantity,
                            offerFreeQty: activeOfferTier?.freeQuantity,
                            offerSavingsDzd: activeOfferPricing?.savingsDzd,
                            offerSummary: offerSelectionSummaryText,
                            offerUnitVariants: isOffersActive ? offerUnitSelections : undefined,
                            offerFreeGifts: isOffersActive ? activeOfferTier?.freeGifts : undefined,
                            variantOptions:
                              isOffersActive && offerSelectionSummaryText
                                ? {
                                    Offer: offerSelectionSummaryText,
                                    ...(activeOfferTier?.id ? { OfferTierId: activeOfferTier.id } : {}),
                                  }
                                : matchedVariant?.options ||
                                  (Object.keys(selectedOptions).length > 0
                                    ? selectedOptions
                                    : undefined),
                          },
                        ],
                        subtotal: calculatedSubtotal,
                        discountAmount: calculatedDiscountAmount,
                        promoCode: appliedPromo?.code || "",
                        shippingCost: calculatedShippingFee,
                        total: calculatedGrandTotal,
                        status: "pending",
                        paymentMethod: "cod",
                        deliveryCompany: selectedDeliveryCompany.id,
                        deliveryCompanyName: selectedDeliveryCompany.name,
                        deliveryMethod: shippingMethod,
                        trackingCode: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
                        verified: true,
                      };

                      // 1. Update localStorage cached orders immediately
                      try {
                        const existingRaw = localStorage.getItem("yume_cached_orders");
                        const existingList: Order[] = existingRaw ? JSON.parse(existingRaw) : [];
                        const updatedList = [
                          storeOrderPayload,
                          ...(Array.isArray(existingList) ? existingList : []).filter(
                            (o) => o && o.id !== storeOrderPayload.id
                          ),
                        ];
                        localStorage.setItem("yume_cached_orders", JSON.stringify(updatedList));
                      } catch (err) {
                        console.warn("Could not cache order in localStorage:", err);
                      }

                      // 2. Dispatch global event so App.tsx & OrdersModule receive the order immediately
                      window.dispatchEvent(
                        new CustomEvent("yume_order_created", { detail: storeOrderPayload })
                      );

                      // 3. Persist to backend /api/orders with Idempotency-Key and store coupon context for server-side verification & usage increment
                      fetch("/api/orders", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Idempotency-Key": `yume-ord-${storeOrderPayload.id}`,
                        },
                        body: JSON.stringify({
                          ...storeOrderPayload,
                          productCategory: selectedProduct.category,
                          storeCoupons: selectedStore?.coupons || [],
                        }),
                      }).catch((err) => console.warn("POST /api/orders warning:", err));

                      setPlacedOrderInfo(newOrder);
                      setIsSubmittingOrder(false);
                      setIsExpressCheckoutOpen(false);
                      setIsBottomInlineCheckoutOpen(false);
                      setIsThankYouOpen(true);
                    }, 450);
                  }}
                  className="w-full h-12 rounded-full text-white font-extrabold text-sm shadow-lg hover:brightness-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: headerAccent }}
                >
                  {isSubmittingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying & Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-white" />
                      <span>Place Order</span>
                    </>
                  )}
                </button>
              </div>

              {/* RIGHT COLUMN: Order Summary Card (5 Cols) */}
              <div className="lg:col-span-5">
                <div className="bg-stone-50/70 rounded-2xl p-5 border border-stone-200/80 space-y-5 sticky top-4">
                  <h3 className="text-base font-extrabold text-slate-900 border-b border-stone-200/80 pb-3.5 mb-1">
                    Order Summary
                  </h3>

                  {/* Product Info Row */}
                  <div className="flex items-start gap-4 pb-4 border-b border-stone-200/80 pt-1">
                    {isOffersActive && activeOfferTier ? (
                      <PlayingCardProductStack
                        units={Array.from({
                          length: Math.max(1, activeOfferPricing?.totalUnits || 1),
                        }).map((_, uIdx) => {
                          const selMap = offerUnitSelections[uIdx] || {};
                          const resolved = resolveUnitVariantInfo({
                            unitIndex: uIdx,
                            unitSelections: selMap,
                            step3Variants: selectedProduct.variants as any,
                            step3Colors: selectedProduct.colors as any,
                            defaultImageUrl:
                              activeOfferTier.imageUrl ||
                              selectedProduct.imageUrl ||
                              selectedProduct.images?.[0] ||
                              DEFAULT_HOODIE_THUMBNAIL,
                            productImages: selectedProduct.images,
                          });
                          const chosenLabels = Object.values(selMap).filter(Boolean).join(" • ");
                          return {
                            ...resolved,
                            variantLabel: chosenLabels || `Item #${uIdx + 1}`,
                          };
                        })}
                        totalUnits={activeOfferPricing?.totalUnits || 1}
                        tierTitle={activeOfferTier.title}
                        tierId={activeOfferTier.id || "checkout-modal"}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl border border-stone-200 bg-white overflow-hidden shrink-0 shadow-2xs">
                        {(selectedProduct.imageUrl || selectedProduct.images?.[0]) && (
                          <img
                            src={selectedProduct.imageUrl || selectedProduct.images?.[0] || undefined}
                            alt={selectedProduct.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">
                        {selectedProduct.name}
                      </h4>
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-sm font-black font-sans"
                          style={{ color: headerAccent }}
                        >
                          {(isOffersActive && activeOfferPricing
                            ? activeOfferPricing.finalPrice
                            : activePrice
                          ).toLocaleString()}{" "}
                          DA
                        </span>
                        {isOffersActive && activeOfferPricing && activeOfferPricing.originalTotalDzd > activeOfferPricing.finalPrice && (
                          <span className="text-xs text-stone-400 line-through font-mono">
                            {activeOfferPricing.originalTotalDzd.toLocaleString()} DA
                          </span>
                        )}
                      </div>

                      {/* When Offer is Active, show the beautifully organized Offer Summary Modal Component */}
                      {isOffersActive && activeOfferTier ? (
                        <div className="pt-2">
                          <OrganizedOfferSummaryModal
                            productName={selectedProduct.name}
                            tierTitle={activeOfferTier.title}
                            unitSelections={offerUnitSelections}
                            totalUnits={activeOfferPricing?.totalUnits || 1}
                            savingsDzd={activeOfferPricing?.savingsDzd}
                            freeGifts={activeOfferTier.freeGifts}
                            accentColor={headerAccent}
                            step3Colors={selectedProduct.colors as any}
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-[11px] text-stone-500 font-medium">
                            {variantSummaryText}
                          </p>
                          <p className="text-[11px] text-stone-600 font-bold">
                            {purchaseQty} {purchaseQty === 1 ? "item" : "items"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-2.5 text-xs sm:text-[13px]">
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Items</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {calculatedSubtotal.toLocaleString()} DA
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-stone-600">
                      <span>Delivery</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {calculatedShippingFee.toLocaleString()} DA
                      </span>
                    </div>

                    {calculatedDiscountAmount > 0 && (
                      <div className="flex items-center justify-between text-emerald-600 font-semibold animate-fade-in">
                        <span className="flex items-center gap-1.5">
                          <span>Discount</span>
                          {appliedPromo && (
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded">
                              {appliedPromo.code}
                            </span>
                          )}
                        </span>
                        <span className="font-bold font-mono">
                          -{calculatedDiscountAmount.toLocaleString()} DA
                        </span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-stone-200/90 flex items-baseline justify-between">
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">
                        Total
                      </span>
                      <span
                        className="text-xl sm:text-2xl font-black font-sans tracking-tight"
                        style={{ color: headerAccent }}
                      >
                        {calculatedGrandTotal.toLocaleString()} DA
                      </span>
                    </div>
                  </div>

                  {/* Security Guarantee Box */}
                  <div
                    className="rounded-xl p-3.5 border flex items-start gap-2.5"
                    style={{
                      backgroundColor: hexToRgba(headerAccent, 0.05),
                      borderColor: hexToRgba(headerAccent, 0.16),
                    }}
                  >
                    <ShieldCheck
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: headerAccent }}
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-slate-900">
                        Your information is secure
                      </div>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        We use secure technology to protect your data and payment information.
                      </p>
                    </div>
                  </div>

                  {/* Delivery Time Box */}
                  <div
                    className="rounded-xl p-3.5 border flex items-start gap-2.5"
                    style={{
                      backgroundColor: hexToRgba(headerAccent, 0.05),
                      borderColor: hexToRgba(headerAccent, 0.16),
                    }}
                  >
                    <Clock
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: headerAccent }}
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-slate-900">
                        Delivery Time: 24 to 48 Hours
                      </div>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        Fast delivery within 1 - 2 business days directly to your door or office.
                      </p>
                    </div>
                  </div>

                  {/* Payment Method: Cash on Delivery (COD) Box */}
                  <div
                    className="rounded-xl p-3.5 border flex items-start gap-2.5"
                    style={{
                      backgroundColor: hexToRgba(headerAccent, 0.05),
                      borderColor: hexToRgba(headerAccent, 0.16),
                    }}
                  >
                    <Banknote
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: headerAccent }}
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-slate-900">
                        Payment Method: Cash on Delivery (COD)
                      </div>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        No online payment required. Pay safely in cash when you receive your package.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const videoInfo = getVideoEmbedResult(activeVideoUrl || selectedProduct.videoUrl || (productVideoList[0] || ""));

  return (
    <div 
      id="product-preview-modal-root"
      className="fixed inset-0 z-50 bg-white dark:bg-slate-950 overflow-y-auto overflow-x-hidden max-w-[100vw] w-full font-sans flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-300 overscroll-x-none touch-pan-y"
      onScroll={(e) => {
        const scrollTop = e.currentTarget.scrollTop;
        const diff = scrollTop - previewLastScrollY.current;
        if (scrollTop <= 3) {
          setShowPreviewHeader(true);
        } else if (diff > 1) {
          setShowPreviewHeader(false);
        } else if (diff < -5) {
          setShowPreviewHeader(true);
        }
        previewLastScrollY.current = scrollTop;
      }}
    >
      
      {/* 1. Storefront Compliant Breadcrumb Header & Navigation Control */}
      <header 
        className="sticky top-0 z-40 text-white border-b shadow-md px-3 sm:px-4 md:px-10 py-3 sm:py-5 min-h-[56px] sm:min-h-[68px] flex flex-nowrap items-center justify-between gap-2.5 sm:gap-4 w-full max-w-full overflow-hidden"
        style={{
          backgroundColor: "var(--yume-theme-header-color, " + currentSlideColor + ")",
          borderColor: "rgba(255, 255, 255, 0.15)",
          opacity: showPreviewHeader ? 1 : 0,
          pointerEvents: showPreviewHeader ? "auto" : "none",
          transform: showPreviewHeader ? "translateY(0%)" : "translateY(-115%)",
          transition: "background-color 700ms cubic-bezier(0.4, 0, 0.2, 1), border-color 700ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 min-w-0">
          <YumeLogo
            variant="compact"
            theme="dark"
            accentColor={currentSlideColor}
            onClick={onClose}
            className="mr-0.5"
          />
          <button
            onClick={onClose}
            className="px-2.5 sm:px-3.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 rounded-xl shadow-3xs hover:shadow-2xs transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/30 font-mono text-xs font-black shrink-0 whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 text-white shrink-0" />
            <span className="hidden sm:inline">Back To Storefront</span>
            <span className="sm:hidden">Back</span>
          </button>
          
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-white/70 font-medium">
            <span>{selectedStore.name}</span>
            <span>/</span>
            <span className="text-white/80 font-bold">{selectedProduct.category || "General Selection"}</span>
            <span>/</span>
            <span className="text-white font-black truncate max-w-[200px]">{selectedProduct.name}</span>
          </div>
        </div>

        {/* Brand identity preview header */}
        <button
          onClick={onOpenStoreProfile || onOpenReels || onClose}
          type="button"
          className="flex items-center gap-2 sm:gap-3 hover:opacity-90 active:scale-95 transition-all cursor-pointer group focus:outline-none border-0 bg-transparent text-left min-w-0 max-w-[170px] xs:max-w-[210px] sm:max-w-xs md:max-w-md shrink ml-auto justify-end"
          title={`View Storefront Profile: ${selectedStore.name}`}
          id="product-preview-store-banner-header"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 shadow-3xs group-hover:scale-105 transition-transform flex-shrink-0">
            {selectedStore.logo ? (
              <img 
                src={selectedStore.logo} 
                className="w-full h-full object-cover" 
                alt="Store Logo"
                referrerPolicy="no-referrer"
              />
            ) : (
              <DefaultProfileStorePhoto className="w-full h-full object-cover" />
            )}
          </div>
          <span className="text-xs font-black text-white font-display tracking-tight group-hover:underline decoration-white/40 decoration-1 underline-offset-4 truncate min-w-0">
            {/* Shortcut store title on phone mode, full store title on tablet/desktop */}
            <span className="sm:hidden">{getShortcutStoreTitle(selectedStore.name)}</span>
            <span className="hidden sm:inline">{selectedStore.name}</span>
            {" "}
            <span 
              className="text-[10px] text-emerald-300 font-bold ml-1 inline-flex items-center gap-1 shrink-0 bg-emerald-500/20 sm:bg-transparent px-1.5 py-0.5 sm:px-0 sm:py-0 rounded-full sm:rounded-none"
              title="Verified Seller"
            >
              <span>✓</span>
              <span className="hidden sm:inline">Verified Seller</span>
            </span>
          </span>
        </button>
      </header>

      {/* Main Container Layer styled over primary white webpage background */}
      <main className="flex-1 shrink-0 w-full max-w-[1800px] mx-auto px-3 sm:px-4 md:px-8 pt-2 pb-6 flex flex-col gap-8 bg-white dark:bg-slate-950 transition-colors duration-300">
        
        {/* Borderless visual wrapper with default spacing */}
        <div className="bg-white dark:bg-slate-950 p-1 sm:p-2 md:p-4 max-w-full transition-colors duration-300">
          
          {/* Main Triple Column Grid identical to premium E-commerce platform */}
          <div ref={mainGridRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1720px] mx-auto w-full min-w-0">
            
            {/* Left Content Area: Product Details & Reviews [9 Cols] */}
            <div className="lg:col-span-9 space-y-8 min-w-0">
              <div className="grid grid-cols-1 lg:grid-cols-9 gap-8 -mt-[4px] min-w-0">
                
                {/* Column 1: Vertical thumbnail strip & large image with real-time hover lens [5 Cols] */}
                <div className="lg:col-span-5 flex flex-col sm:flex-row gap-3.5 items-start justify-center lg:justify-start w-full min-w-0 p-0 m-0 lg:h-[800px]">
              
              {/* Vertical Thumbnails bar (Hidden on compact screens) */}
              <div className="hidden sm:flex flex-col gap-2 shrink-0 max-h-[520px] sm:max-h-[620px] lg:max-h-[800px] overflow-y-auto scrollbar-none">
                {sidebarThumbnails.map((img, idx) => {
                  const isThumbActive = activeImgIdx === idx;
                  return (
                    <button
                      key={`v-thumb-${idx}-${img.slice(-15)}`}
                      type="button"
                      onClick={() => {
                        setActiveImgIdx(idx);
                        // If this thumbnail belongs to a specific color, sync active color only if variants are selected
                        if (hasUserSelectedVariant && selectedProduct.colors && selectedProduct.colors.length > 0) {
                          const matchingColor = selectedProduct.colors.find(c =>
                            c.imageUrl === img || c.image === img || (c.images && c.images.includes(img))
                          );
                          if (matchingColor) {
                            setChosenColor(matchingColor.name);
                            if (matchingColor.hex) setActiveThemeColor(matchingColor.hex);
                            const colorOptKey = Object.keys(selectedOptions).find(k => isColorOptionName(k));
                            if (colorOptKey) {
                              setSelectedOptions(prev => ({ ...prev, [colorOptKey]: matchingColor.name }));
                            }
                          }
                        }
                      }}
                      className={`w-11 h-11 rounded-md overflow-hidden p-0.5 border-2 bg-white transition-all cursor-pointer shadow-3xs hover:scale-103 mt-[1px] ml-0 ${
                        isThumbActive
                          ? "border-[#e47911] ring-2 ring-amber-100"
                          : "border-slate-200"
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover rounded mt-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent) parent.style.display = "none";
                        }}
                      />
                    </button>
                  );
                })}

                {/* Video thumbnails uploaded by store owner */}
                {productVideoList.map((videoUrl, vIdx) => {
                  const ytThumbnail = getYouTubeThumbnail(videoUrl);
                  return (
                    <button
                      key={`video-vertical-${vIdx}`}
                      type="button"
                      onClick={() => {
                        if (onOpenReels) {
                          onOpenReels();
                        } else {
                          setActiveVideoUrl(videoUrl);
                          setIsVideoOpen(true);
                        }
                      }}
                      className="w-11 h-11 rounded-md overflow-hidden p-0.5 border-2 border-stone-200 hover:border-[#e47911] bg-stone-900 transition-all cursor-pointer shadow-3xs hover:scale-105 active:scale-[0.97] relative"
                      title={`Watch Product Showcase Video #${vIdx + 1}`}
                    >
                      <img src={ytThumbnail || galleryImages[0] || selectedProduct.imageUrl} alt="Video Thumbnail" className="w-full h-full object-cover rounded opacity-60" />
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center" id={`vertical-play-overlay-${vIdx}`}>
                        <div className="w-5 h-5 rounded-full bg-red-650 hover:bg-red-700 flex items-center justify-center text-white shadow-md transition-transform duration-300 transform hover:scale-110">
                          <svg className="w-2.5 h-2.5 fill-current text-white ml-0.5" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" style={{ fill: "white" }} />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-0.5 left-0.5 right-0.5 bg-black/75 text-[7px] text-white font-black uppercase text-center py-0.5 rounded-sm select-none">
                        VIDEO {productVideoList.length > 1 ? `#${vIdx + 1}` : ""}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Main Preview Block */}
              <div className="flex-1 min-w-0 w-full flex flex-col gap-3 relative lg:h-[800px]">
                <div ref={mainImageContainerRef} className="relative w-full max-w-[630px] aspect-[3/4] lg:h-[777px] lg:aspect-auto pt-0 pl-0 mt-[6px] mx-auto">
                  <div
                    className={`w-full h-full rounded-2xl overflow-hidden bg-stone-50 border border-stone-200 shadow-[0_8px_30px_rgb(0,0,0,0.04),0_1px_2px_rgb(0,0,0,0.01)] relative animate-fade-in ring-1 ring-black/[0.01] transition-all duration-300 ${isZoomed ? "lg:cursor-crosshair cursor-default" : "cursor-default"}`}
                    onMouseEnter={(e) => {
                      updateFlyoutBounds();
                      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                      const pxX = e.clientX - left;
                      const pxY = e.clientY - top;
                      const x = Math.max(0, Math.min(100, (pxX / width) * 100));
                      const y = Math.max(0, Math.min(100, (pxY / height) * 100));
                      setZoomPos({ x, y, pxX, pxY, containerW: width, containerH: height });
                      setIsZoomed(true);
                    }}
                    onMouseLeave={() => setIsZoomed(false)}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleTouchMove}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => setIsZoomed(false)}
                    onTouchCancel={() => setIsZoomed(false)}
                  >
                    <img
                      src={getOptimizedImageUrl(currentPreviewImage || selectedProduct.imageUrl, isMobile)}
                      alt={selectedProduct.altText || selectedProduct.name}
                      className="w-full h-full object-cover select-none pointer-events-none transition-opacity duration-300"
                      style={{
                        opacity: isZoomed ? 0.85 : 1,
                      }}
                      onError={(e) => {
                        if (selectedProduct.imageUrl && e.currentTarget.src !== selectedProduct.imageUrl) {
                          e.currentTarget.src = selectedProduct.imageUrl;
                        }
                      }}
                    />

                    {/* Laser lens selector tracing the zoom position - for mobile/tablet mode only with 3x zoom */}
                    {isZoomed && (() => {
                      const isSmallScreen = isMobile || (typeof window !== "undefined" && window.innerWidth < 768);
                      const lensSize = isSmallScreen ? 160 : 300;
                      const halfLens = lensSize / 2;
                      return (
                        <div 
                          className="absolute pointer-events-none lg:hidden overflow-hidden"
                          style={{
                            width: `${lensSize}px`,
                            height: `${lensSize}px`,
                            left: "0",
                            top: "0",
                            transform: `translate3d(${zoomPos.pxX - halfLens}px, ${zoomPos.pxY - halfLens}px, 0)`,
                            borderRadius: isSmallScreen ? "14px" : "20px",
                            border: "2px solid rgba(255, 255, 255, 0.95)",
                            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.28), inset 0 0 15px rgba(255, 255, 255, 0.25)", // Darkened overlay outside lens with subtle inner glow
                            transition: "transform 0.06s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease"
                          }}
                        >
                          {/* 3x Ultra-High definition magnified detail inside the lens */}
                          <img
                            src={getHighResZoomUrl(currentPreviewImage || selectedProduct.imageUrl) || currentPreviewImage || selectedProduct.imageUrl}
                            alt=""
                            className="absolute max-w-none pointer-events-none select-none object-cover"
                            style={{
                              width: `${(zoomPos.containerW || 480) * 3}px`,
                              height: `${(zoomPos.containerH || 640) * 3}px`,
                              transform: `translate3d(${halfLens - zoomPos.pxX * 3}px, ${halfLens - zoomPos.pxY * 3}px, 0)`,
                              left: 0,
                              top: 0,
                              filter: "contrast(1.08) brightness(1.03) saturate(1.06)",
                              imageRendering: "-webkit-optimize-contrast",
                              willChange: "transform",
                            }}
                          />
                          {/* Optical lens specular glare highlight */}
                          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/20 via-transparent to-black/15 z-1" />
                          {/* Zoom level badge */}
                          <div className={`absolute ${isSmallScreen ? "bottom-1.5 right-2 text-[9px]" : "bottom-2.5 right-3 text-[10px]"} bg-black/65 backdrop-blur-xs text-white font-black px-1.5 py-0.5 rounded-full select-none shadow-sm flex items-center gap-0.5 z-2`}>
                            <span>3x</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Amazon-style tracking lens selector for PC / desktop mode */}
                    {isZoomed && (() => {
                      const desktopContainerW = zoomPos.containerW || 630;
                      const desktopContainerH = zoomPos.containerH || 777;
                      const desktopZoomFactor = 2.4;
                      const flyoutW = flyoutBounds.width;
                      const flyoutH = desktopContainerH + flyoutBounds.topOffset;
                      const amazonLensW = Math.round(flyoutW / desktopZoomFactor);
                      const amazonLensH = Math.round(flyoutH / desktopZoomFactor);
                      const amazonLensX = Math.max(0, Math.min(desktopContainerW - amazonLensW, zoomPos.pxX - amazonLensW / 2));
                      const amazonLensY = Math.max(0, Math.min(desktopContainerH - amazonLensH, zoomPos.pxY - amazonLensH / 2));

                      return (
                        <div
                          className="absolute hidden lg:block pointer-events-none z-20"
                          style={{
                            width: `${amazonLensW}px`,
                            height: `${amazonLensH}px`,
                            left: 0,
                            top: 0,
                            transform: `translate3d(${amazonLensX}px, ${amazonLensY}px, 0)`,
                            backgroundColor: "rgba(255, 255, 255, 0.4)",
                            border: "1.5px solid rgba(130, 130, 130, 0.8)",
                            boxShadow: "0 0 12px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.3)",
                          }}
                        />
                      );
                    })()}

                    {/* Top-Right action tags */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                      <button 
                        type="button"
                        onClick={() => handleToggleWishlist && handleToggleWishlist(selectedProduct.id || selectedProduct.name)}
                        className="transition-all duration-300 cursor-pointer focus-visible:outline-none flex items-center justify-center p-0.5 bg-transparent"
                        title={wishlist.includes(selectedProduct.id) || wishlist.includes(selectedProduct.name) ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <BookmarkStar filled={wishlist.includes(selectedProduct.id) || wishlist.includes(selectedProduct.name)} className="w-7.5 h-9.5" />
                      </button>
                      <button 
                        type="button"
                        onClick={handleShareProduct}
                        className={`p-2 rounded-full border shadow-3xs transition-all duration-300 cursor-pointer ${
                          shareCopied
                            ? "bg-emerald-50 border-emerald-300 text-emerald-600 scale-105"
                            : "bg-white/95 hover:bg-white text-stone-500 hover:text-stone-900 hover:scale-105 border-stone-200/80"
                        }`}
                        title={shareCopied ? "Link Copied!" : "Share Product"}
                      >
                        {shareCopied ? <Check className="w-4 h-4 text-emerald-600 animate-pulse" /> : <Share2 className="w-4 h-4" />}
                      </button>

                      {/* Compare button hidden per user request */}
                    </div>

                  </div>

                  {/* --- AMAZON STYLE EXTERNAL ZOOM FLYOUT (PC / DESKTOP MODE) --- */}
                  {isZoomed && (() => {
                    const desktopContainerW = zoomPos.containerW || 630;
                    const desktopContainerH = zoomPos.containerH || 777;
                    const desktopZoomFactor = 2.4;
                    const flyoutW = flyoutBounds.width;
                    const flyoutH = desktopContainerH + flyoutBounds.topOffset;
                    const amazonLensW = Math.round(flyoutW / desktopZoomFactor);
                    const amazonLensH = Math.round(flyoutH / desktopZoomFactor);
                    const amazonLensX = Math.max(0, Math.min(desktopContainerW - amazonLensW, zoomPos.pxX - amazonLensW / 2));
                    const amazonLensY = Math.max(0, Math.min(desktopContainerH - amazonLensH, zoomPos.pxY - amazonLensH / 2));

                    return (
                      <div 
                        className="absolute left-[calc(100%+16px)] hidden lg:block bg-white border border-stone-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden z-50 pointer-events-none animate-fade-in"
                        style={{
                          top: `-${flyoutBounds.topOffset}px`,
                          width: `${flyoutW}px`,
                          height: `${flyoutH}px`,
                        }}
                      >
                        <div className="w-full h-full relative overflow-hidden bg-stone-50">
                          <img
                            src={getHighResZoomUrl(currentPreviewImage || selectedProduct.imageUrl) || currentPreviewImage || selectedProduct.imageUrl}
                            alt="Zoom Detail"
                            className="absolute max-w-none select-none pointer-events-none object-cover"
                            style={{
                              width: `${desktopContainerW * desktopZoomFactor}px`,
                              height: `${desktopContainerH * desktopZoomFactor}px`,
                              left: 0,
                              top: 0,
                              transform: `translate3d(-${amazonLensX * desktopZoomFactor}px, -${amazonLensY * desktopZoomFactor}px, 0)`,
                              imageRendering: "-webkit-optimize-contrast",
                              filter: "contrast(1.04) brightness(1.02) saturate(1.04)",
                              willChange: "transform",
                            }}
                          />
                          {/* Yume HD zoom watermark tag - transparent */}
                          <div className="absolute bottom-3 right-3 bg-black/35 backdrop-blur-sm text-white/90 text-[10px] font-sans font-medium px-2.5 py-1 rounded-full select-none flex items-center gap-1.5 border border-white/20 z-10">
                            <YumeLogo
                              variant="compact"
                              theme="dark"
                              accentColor={themeAccentColor || currentSlideColor}
                              className="scale-75 origin-left -mr-2"
                            />
                            <span>HD Detail</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex justify-center items-center pt-2 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxProduct(selectedProduct);
                      setLightboxImageIndex(hasProductOptions && !hasUserSelectedVariant ? 0 : activeImgIdx);
                    }}
                    className="group px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-400 text-stone-700 hover:text-stone-900 font-sans text-xs font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 rounded-full shadow-2xs hover:shadow-xs cursor-pointer active:scale-98 focus:outline-none -mt-[2px]"
                    id="see-full-gallery-btn"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-800 transition-colors" />
                    <span>See Full Gallery</span>
                  </button>
                </div>

                {/* Horizontal gallery list for compact views */}
                <div className="flex sm:hidden gap-1.5 overflow-x-auto py-1">
                  {sidebarThumbnails.map((img, idx) => {
                    const isThumbActive = activeImgIdx === idx;
                    return (
                      <button
                        key={`h-thumb-${idx}-${img.slice(-15)}`}
                        type="button"
                        onClick={() => {
                          setActiveImgIdx(idx);
                          if (hasUserSelectedVariant && selectedProduct.colors && selectedProduct.colors.length > 0) {
                            const matchingColor = selectedProduct.colors.find(c =>
                              c.imageUrl === img || c.image === img || (c.images && c.images.includes(img))
                            );
                            if (matchingColor) {
                              setChosenColor(matchingColor.name);
                              if (matchingColor.hex) setActiveThemeColor(matchingColor.hex);
                              const colorOptKey = Object.keys(selectedOptions).find(k => isColorOptionName(k));
                              if (colorOptKey) {
                                setSelectedOptions(prev => ({ ...prev, [colorOptKey]: matchingColor.name }));
                              }
                            }
                          }
                        }}
                        className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 bg-white transition-all ${
                          isThumbActive ? "border-[#e47911]" : "border-stone-220"
                        }`}
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const parent = e.currentTarget.parentElement;
                            if (parent) parent.style.display = "none";
                          }}
                        />
                      </button>
                    );
                  })}

                  {/* Video thumbnails uploaded by store owner */}
                  {productVideoList.map((videoUrl, vIdx) => {
                    const ytThumbnail = getYouTubeThumbnail(videoUrl);
                    return (
                      <button
                        key={`video-horizontal-${vIdx}`}
                        type="button"
                        onClick={() => {
                          if (onOpenReels) {
                            onOpenReels();
                          } else {
                            setActiveVideoUrl(videoUrl);
                            setIsVideoOpen(true);
                          }
                        }}
                        className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 border-stone-200 hover:border-[#e47911] bg-stone-900 transition-all cursor-pointer relative animate-fade-in"
                        title={`Watch Product Showcase Video #${vIdx + 1}`}
                      >
                        <img src={ytThumbnail || galleryImages[0] || selectedProduct.imageUrl} alt="Video Thumbnail" className="w-full h-full object-cover opacity-65" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center" id={`horizontal-play-overlay-${vIdx}`}>
                          <div className="w-5 h-5 rounded-full bg-red-650 flex items-center justify-center text-white text-[9px] shadow-3xs">
                            ▶
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Column 2: Core product content middle pane [5 Cols] */}
            <div className="lg:col-span-4 flex flex-col justify-start text-left gap-5 h-fit">
              <div className="space-y-3.5">
                


                {/* Main Heading title in pure premium format */}
                <h1 className="text-2xl md:text-[26px] font-bold text-slate-900 dark:text-white tracking-tight leading-snug -mt-[2px]">
                  {isBerberRugProduct
                    ? "Handcrafted Premium Atlas Berber Rug - Natural Organic Wool, Traditional Hand-Knotted Weaving"
                    : selectedProduct.name}
                </h1>



                {/* Exclusive Deal Pricing Block */}
                {isOffersActive && activeOfferPricing ? (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex items-center gap-3">
                      {activeOfferPricing.savingsPercent > 0 && (
                        <span className="text-rose-600 dark:text-rose-400 font-medium text-2xl">
                          -{activeOfferPricing.savingsPercent}%
                        </span>
                      )}
                      <div className="flex items-baseline">
                        <span className="text-slate-900 dark:text-white font-semibold text-2xl sm:text-3xl font-sans tracking-tight">
                          {getStorePriceParts(activeOfferPricing.finalPrice, activeCountry).amountText}
                        </span>
                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200 align-top relative -top-2.5 ml-0.5">
                          {getStorePriceParts(activeOfferPricing.finalPrice, activeCountry).symbol}
                        </span>
                      </div>
                      {activeOfferPricing.compareAtTotal > activeOfferPricing.finalPrice && (
                        <span className="text-slate-400 dark:text-slate-400 line-through text-xs font-mono ml-1">
                          {formatStorePrice(activeOfferPricing.compareAtTotal, activeCountry)}
                        </span>
                      )}
                    </div>
                  </div>
                ) : isDiscountEnabled ? (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex items-center gap-3">
                      <span className="text-rose-600 dark:text-rose-400 font-medium text-2xl">-{discountPercentValue}%</span>
                      <div className="flex items-baseline">
                        <span className="text-slate-900 dark:text-white font-semibold text-2xl sm:text-3xl font-sans tracking-tight">
                          {getStorePriceParts(activePrice, activeCountry).amountText}
                        </span>
                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200 align-top relative -top-2.5 ml-0.5">
                          {getStorePriceParts(activePrice, activeCountry).symbol}
                        </span>
                      </div>
                      <span className="text-slate-400 dark:text-slate-400 line-through text-xs font-mono ml-1">
                        {formatStorePrice(isBerberRugProduct ? 34000 : variantBasePrice, activeCountry)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-baseline">
                      <span className="text-slate-900 dark:text-white font-semibold text-2xl sm:text-3xl font-sans tracking-tight">
                        {getStorePriceParts(activePrice, activeCountry).amountText}
                      </span>
                      <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200 align-top relative -top-2.5 ml-0.5">
                        {getStorePriceParts(activePrice, activeCountry).symbol}
                      </span>
                    </div>
                  </div>
                )}

                {/* Flash Sale Countdown Timer */}
                {(selectedProduct.timerEnabled || isDiscountEnabled || isBerberRugProduct) && (
                  <div className="pt-2 max-w-sm sm:max-w-[385px]">
                    <FlashSaleCountdownTimer
                      styleVariant={activeTimerStyle}
                      timeLeft={timeLeft}
                    />
                  </div>
                )}

                {/* Product Details Section (Positioned directly after price) */}
                {((selectedProduct.description && selectedProduct.description.trim().length > 0) ||
                  (selectedProduct.description_en && selectedProduct.description_en.trim().length > 0) ||
                  (selectedProduct.description_fr && selectedProduct.description_fr.trim().length > 0) ||
                  (selectedProduct.description_ar && selectedProduct.description_ar.trim().length > 0)) ? (
                  <div className="space-y-2.5 pt-2 text-[13.5px] sm:text-sm text-left animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white text-[15px] tracking-tight">Product Details</h4>
                    </div>

                    <div
                      className="bg-stone-50/70 dark:bg-slate-900/90 p-4 rounded-2xl border border-stone-200/70 dark:border-slate-800 border-l-[3.5px] text-[13.5px] sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium [&_ol]:list-decimal [&_ol]:pl-4 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:my-1 [&_b]:font-bold [&_strong]:font-bold shadow-3xs"
                      style={{ borderLeftColor: synchronizedAccentColor }}
                    >
                      {descLang === "en" && selectedProduct.description_en && (
                        <div
                          className={hasArabicCharacters(selectedProduct.description_en) ? "animate-fadeIn text-right text-[15px] leading-[1.9] font-medium text-slate-900 dark:text-slate-100" : "animate-fadeIn"}
                          dir={hasArabicCharacters(selectedProduct.description_en) ? "rtl" : undefined}
                          dangerouslySetInnerHTML={{ __html: selectedProduct.description_en }}
                        />
                      )}
                      {descLang === "fr" && selectedProduct.description_fr && (
                        <div
                          className={hasArabicCharacters(selectedProduct.description_fr) ? "animate-fadeIn text-right text-[15px] leading-[1.9] font-medium text-slate-900 dark:text-slate-100" : "animate-fadeIn"}
                          dir={hasArabicCharacters(selectedProduct.description_fr) ? "rtl" : undefined}
                          dangerouslySetInnerHTML={{ __html: selectedProduct.description_fr }}
                        />
                      )}
                      {descLang === "ar" && selectedProduct.description_ar && (
                        <div
                          className="animate-fadeIn text-right text-[15px] leading-[1.9] font-medium text-slate-900 dark:text-slate-100"
                          dir="rtl"
                          dangerouslySetInnerHTML={{ __html: selectedProduct.description_ar }}
                        />
                      )}
                      {(!selectedProduct[`description_${descLang}`] && selectedProduct.description) && (
                        <div
                          className={hasArabicCharacters(selectedProduct.description) ? "animate-fadeIn text-right text-[15px] leading-[1.9] font-medium text-slate-900 dark:text-slate-100" : "animate-fadeIn"}
                          dir={hasArabicCharacters(selectedProduct.description) ? "rtl" : undefined}
                          dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
                        />
                      )}
                    </div>
                  </div>
                ) : null}

                {/* 1. INTERACTIVE VARIANT OPTIONS OR YUME OFFERS WIDGET (When Step 4 Offers is ON, hide old standalone variant selectors and reuse Step 3 variants inside YumeCustomerOfferWidget) */}
                {isOffersActive && selectedProduct.offersConfig ? (
                  <div className="pt-2.5 border-t border-stone-200/80 py-2.5 animate-fadeIn">
                    <div className="w-full sm:max-w-[88%] lg:max-w-[88%] mx-auto">
                      <YumeCustomerOfferWidget
                        offersConfig={selectedProduct.offersConfig}
                        baseUnitPrice={variantBasePrice}
                        currencySymbol="DZD"
                        currencyPosition="suffix"
                        productImageUrl={
                          selectedProduct.imageUrl ||
                          selectedProduct.images?.[0] ||
                          undefined
                        }
                        productImages={selectedProduct.images}
                        step3Axes={offerStep3Axes}
                        step3Colors={selectedProduct.colors}
                        step3Variants={selectedProduct.variants as any}
                        selectedTierId={selectedOfferTierId}
                        onSelectTier={(tierId) => {
                          setSelectedOfferTierId(tierId);
                          setRawOfferUnitSelections(rawOfferUnitSelectionsByTier[tierId] || []);
                        }}
                        unitSelections={offerUnitSelections}
                        onChangeUnitSelection={(unitIdx, axisName, val) => {
                          setRawOfferUnitSelections((prev) => {
                            const next = [...prev];
                            next[unitIdx] = {
                              ...(next[unitIdx] || {}),
                              [axisName]: val,
                            };
                            return next;
                          });
                          setRawOfferUnitSelectionsByTier((prev) => {
                            const current = [...(prev[selectedOfferTierId] || [])];
                            current[unitIdx] = {
                              ...(current[unitIdx] || {}),
                              [axisName]: val,
                            };
                            return {
                              ...prev,
                              [selectedOfferTierId]: current,
                            };
                          });
                          if (axisName.toLowerCase() === "color") {
                            setChosenColor(val);
                          } else if (axisName.toLowerCase() === "size") {
                            setChosenSize(val);
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                <div className="space-y-4 pt-3 border-t border-stone-200/80 py-3 text-[13px] sm:text-sm animate-fadeIn">
                  {/* 1A. Standalone Color Options (Rendered 1st when not already in variantOptions) */}
                  {(!variantOptions || !Object.keys(variantOptions).some(k => isColorOptionName(k))) && colorOptions && colorOptions.length > 0 && (
                    <div className="space-y-2.5" data-variant-section="color">
                      <div className="flex items-center justify-between text-[13.5px] sm:text-sm">
                        <span className="text-stone-600 font-medium flex items-center gap-1.5 flex-wrap">
                          <span>Color:</span>
                          <strong className="text-stone-900 font-bold inline-flex items-center gap-1">
                            <span>{chosenColor ? chosenColor : <span className="text-stone-400 font-normal">Choose a color</span>}</span>
                            {chosenColor && colorOptions.find((c: any) => c.name.toLowerCase() === chosenColor.toLowerCase())?.isHot && (
                              <span className="text-amber-500 text-xs leading-none inline-flex items-center" title="Popular choice">
                                🔥
                              </span>
                            )}
                          </strong>
                        </span>
                        {(chosenColor || chosenSize || Object.values(selectedOptions).some(Boolean)) && (
                          <button
                            type="button"
                            onClick={() => handleUnselectOption()}
                            className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {(() => {
                        const isPhotoCardsModel = selectedProduct.colorVariantStyle === "photo_cards" || selectedProduct.colorVariantStyle === "image_cards" || selectedProduct.colorVariantStyle === "cards";
                        const isSolidCirclesModel = selectedProduct.colorVariantStyle === "solid_circles";

                        if (isPhotoCardsModel) {
                          return (
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                              {colorOptions.map((opt: any, cIdx: number) => {
                                const isSelected = Boolean(chosenColor && chosenColor.toLowerCase() === opt.name.toLowerCase());
                                const hex = opt.hex || resolveColorHex(opt.name);
                                const swatchImg = opt.imageUrl || opt.image || (opt.images && opt.images[0]) || null;
                                const isValidImg = swatchImg && typeof swatchImg === "string" && (swatchImg.startsWith("http") || swatchImg.startsWith("data:") || swatchImg.startsWith("/") || swatchImg.startsWith("blob:"));
                                const isHotChoice = !!(opt.isHot || (opt as any)?.hot || cIdx < 2);

                                return (
                                  <button
                                    key={`standalone-card-${opt.name}-${cIdx}`}
                                    type="button"
                                    title={opt.name}
                                    onClick={() => {
                                      if (chosenColor && chosenColor.toLowerCase() === opt.name.toLowerCase()) {
                                        handleUnselectOption("Color");
                                        return;
                                      }
                                      setChosenColor(opt.name);
                                      setActiveThemeColor(hex);
                                      const targetImg = opt.imageUrl || opt.image || (opt.images && opt.images[0]);
                                      if (targetImg) {
                                        const foundIdx = findImageInGallery(targetImg);
                                        if (foundIdx >= 0) setActiveImgIdx(foundIdx);
                                      }
                                    }}
                                    className={`group relative flex flex-col rounded-lg overflow-hidden transition-all duration-200 cursor-pointer text-left bg-white dark:bg-stone-900 shrink-0 ${
                                      isSelected
                                        ? "border-2 border-slate-950 dark:border-white shadow-sm ring-1 ring-slate-950/20"
                                        : "border border-stone-300 dark:border-stone-700 hover:border-slate-400 hover:shadow-xs"
                                    }`}
                                    style={{ width: "66px", minWidth: "62px" }}
                                  >
                                    <div className="w-full h-16 sm:h-[68px] bg-stone-50 dark:bg-stone-850 relative overflow-hidden flex items-center justify-center">
                                      {isValidImg ? (
                                        <img
                                          src={swatchImg}
                                          alt={opt.name}
                                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                                          onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                            const fallback = e.currentTarget.parentElement?.querySelector(".swatch-standalone-fallback") as HTMLElement;
                                            if (fallback) fallback.style.display = "flex";
                                          }}
                                        />
                                      ) : null}
                                      <div
                                        className={`swatch-standalone-fallback w-full h-full relative ${isValidImg ? "hidden" : "flex"}`}
                                        style={{ backgroundColor: hex }}
                                      />
                                    </div>

                                    <div className="px-1 py-1.5 bg-white dark:bg-stone-900 border-t border-stone-200/90 dark:border-stone-800 flex flex-col items-center justify-center min-h-[26px] w-full text-center">
                                      <div className="flex items-center justify-center gap-1 w-full px-0.5">
                                        {isHotChoice && (
                                          <span
                                            className="text-amber-500 text-[10px] shrink-0 select-none leading-none inline-flex items-center"
                                            title="Popular choice"
                                          >
                                            🔥
                                          </span>
                                        )}
                                        <span
                                          className={`text-xs sm:text-[13px] truncate leading-tight ${
                                            isSelected
                                              ? "text-slate-950 dark:text-white font-bold"
                                              : "text-slate-700 dark:text-stone-300 font-semibold"
                                          }`}
                                          title={opt.name}
                                        >
                                          {opt.name}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        }

                        if (isSolidCirclesModel) {
                          return (
                            <div className="flex flex-wrap gap-2.5 items-center">
                              {colorOptions.map((opt: any, cIdx: number) => {
                                const isSelected = Boolean(chosenColor && chosenColor.toLowerCase() === opt.name.toLowerCase());
                                const hex = opt.hex || resolveColorHex(opt.name);
                                return (
                                  <div key={`standalone-solid-wrap-${opt.name}-${cIdx}`} className="flex flex-col items-center gap-1">
                                    <button
                                      type="button"
                                      title={opt.name}
                                      onClick={() => {
                                        if (chosenColor && chosenColor.toLowerCase() === opt.name.toLowerCase()) {
                                          handleUnselectOption("Color");
                                          return;
                                        }
                                        setChosenColor(opt.name);
                                        setActiveThemeColor(hex);
                                        const targetImg = opt.imageUrl || opt.image || (opt.images && opt.images[0]);
                                        if (targetImg) {
                                          const foundIdx = findImageInGallery(targetImg);
                                          if (foundIdx >= 0) setActiveImgIdx(foundIdx);
                                        }
                                      }}
                                      className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 p-[2px] ${
                                        isSelected
                                          ? "border-2 border-blue-600 scale-105 shadow-md"
                                          : "border border-stone-300 hover:border-slate-500 hover:scale-105"
                                      }`}
                                    >
                                      <span
                                        className="w-full h-full rounded-full shadow-inner flex items-center justify-center overflow-hidden transition-transform relative"
                                        style={{ backgroundColor: hex }}
                                      >
                                        {isSelected && (
                                          <Check className={`w-4 h-4 stroke-[3] ${isColorDark(hex) ? "text-white" : "text-slate-900"} drop-shadow-sm`} />
                                        )}
                                      </span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        return (
                          <div className="flex flex-wrap gap-2.5 items-center">
                            {colorOptions.map((opt: any, cIdx: number) => {
                              const isSelected = Boolean(chosenColor && chosenColor.toLowerCase() === opt.name.toLowerCase());
                              const hex = opt.hex || resolveColorHex(opt.name);
                              const swatchImg = opt.imageUrl || opt.image || (opt.images && opt.images[0]) || null;
                              return (
                                <div key={`standalone-color-wrap-${opt.name}-${cIdx}`} className="flex flex-col items-center gap-1">
                                  <button
                                    type="button"
                                    title={opt.name}
                                    onClick={() => {
                                      if (chosenColor && chosenColor.toLowerCase() === opt.name.toLowerCase()) {
                                        handleUnselectOption("Color");
                                        return;
                                      }
                                      setChosenColor(opt.name);
                                      setActiveThemeColor(hex);
                                      const targetImg = opt.imageUrl || opt.image || (opt.images && opt.images[0]);
                                      if (targetImg) {
                                        const foundIdx = findImageInGallery(targetImg);
                                        if (foundIdx >= 0) setActiveImgIdx(foundIdx);
                                      }
                                    }}
                                    className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 p-[2px] ${
                                      isSelected
                                        ? "border-2 border-blue-600 scale-105 shadow-md"
                                        : "border border-stone-300 hover:border-slate-500 hover:scale-105"
                                    }`}
                                  >
                                    <span
                                      className="w-full h-full rounded-full shadow-inner flex items-center justify-center overflow-hidden transition-transform relative bg-stone-100"
                                      style={{ backgroundColor: hex }}
                                    >
                                      {swatchImg ? (
                                        <img
                                          src={swatchImg}
                                          alt={opt.name}
                                          className="w-full h-full object-cover rounded-full pointer-events-none"
                                          onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                          }}
                                        />
                                      ) : null}
                                      {isSelected && (
                                        <span className={`absolute inset-0 flex items-center justify-center ${swatchImg ? "bg-blue-600/35 backdrop-blur-[0.5px]" : ""}`}>
                                          <Check className={`w-4 h-4 stroke-[3] ${swatchImg ? "text-white drop-shadow-md" : (isColorDark(hex) ? "text-white" : "text-slate-900")}`} />
                                        </span>
                                      )}
                                    </span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* 1B. Standalone Size Options (Rendered 2nd when not already in variantOptions, before CPU/GPU/RAM/Storage) */}
                  {(!variantOptions || !Object.keys(variantOptions).some(k => isSizeOptionName(k))) && sizeOptions && sizeOptions.length > 0 && (
                    <div className="space-y-2.5" data-variant-section="size">
                      <div className="flex items-center justify-between gap-2 text-[13.5px] sm:text-sm">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-stone-600 dark:text-slate-300 font-medium">
                            Size:{" "}
                            <strong className="text-stone-900 dark:text-white font-bold ml-1">
                              {chosenSize ? chosenSize : <span className="text-stone-400 font-normal">Choose a size</span>}
                            </strong>
                          </span>
                        </div>
                        {(!colorOptions || colorOptions.length === 0 || (variantOptions && Object.keys(variantOptions).some(k => isColorOptionName(k)))) &&
                          (chosenColor || chosenSize || Object.values(selectedOptions).some(Boolean)) && (
                          <button
                            type="button"
                            onClick={() => handleUnselectOption()}
                            className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex flex-wrap gap-2 items-center">
                        {sizeOptions.map((sz, sIdx) => {
                          const isSelected = Boolean(chosenSize && chosenSize.toLowerCase() === sz.toLowerCase());
                          const symbol = getSizeSymbol(sz);
                          const sizeSpecObj = Array.isArray(selectedProduct.sizesWithPrices)
                            ? selectedProduct.sizesWithPrices.find((s: any) => s && s.name && s.name.toLowerCase() === sz.toLowerCase())
                            : undefined;
                          const isSizeOut =
                            isVariantOptionValueOutOfStock({
                              optionName: "Size",
                              optionValue: sz,
                              selectedOptions,
                              variants: selectedProduct.variants,
                              productStock: selectedProduct.stock,
                            }) ||
                            (sizeSpecObj && (sizeSpecObj as any).stock !== undefined && Number((sizeSpecObj as any).stock) <= 0) ||
                            (Array.isArray((selectedProduct as any).outOfStockSizes) &&
                              (selectedProduct as any).outOfStockSizes.some((os: string) => os.toLowerCase() === sz.toLowerCase()));

                          return (
                            <button
                              key={`standalone-size-${sz}-${sIdx}`}
                              type="button"
                              title={isSizeOut ? `${sz} (Out of Stock)` : sz}
                              onClick={() => {
                                if (chosenSize && chosenSize.toLowerCase() === sz.toLowerCase()) {
                                  handleUnselectOption("Size");
                                  return;
                                }
                                setChosenSize(sz);
                              }}
                              className={`min-w-[48px] h-[40px] px-4 rounded-xl text-[13px] sm:text-sm transition-all duration-200 cursor-pointer active:scale-97 flex items-center justify-center gap-1.5 ${
                                isSelected
                                  ? "bg-blue-50 text-blue-900 border-2 border-blue-600 shadow-xs font-bold ring-1 ring-blue-500/20"
                                  : isSizeOut
                                  ? "bg-stone-50 hover:bg-stone-100 text-stone-400 border border-stone-200/80 font-semibold"
                                  : "bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/90 hover:border-stone-300 font-semibold"
                              }`}
                            >
                              <span className={isSizeOut ? "line-through decoration-2 opacity-75" : ""}>{symbol}</span>
                              {isSizeOut && (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="Out of stock" />
                              )}
                            </button>
                          );
                        })}
                        </div>
                        {showFindYourFit && (
                          <FindYourFitButton
                            onClick={() => setIsFindYourFitOpen(true)}
                            currentLanguage={descLang}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* 1C. Dynamic Variant Attributes (Sorted: Color, Size, CPU/Processor, GPU, RAM, Storage, Screen Size, ...etc) */}
                  {variantOptions && Object.keys(variantOptions).length > 0 ? (
                    <div className="space-y-4">
                      {sortVariantOptionEntries(Object.entries(variantOptions)).map(([optionName, rawOptionValues], oIdx) => {
                        const optionValues = (Array.isArray(rawOptionValues) ? rawOptionValues : []) as string[];
                        const selectedValue = selectedOptions[optionName] || "";
                        const isColorOpt = isColorOptionName(optionName);
                        const isSizeOpt = isSizeOptionName(optionName);

                        const activeColorSpec = isColorOpt
                          ? selectedProduct.colors?.find((c: any) => c.name.toLowerCase() === selectedValue.toLowerCase())
                          : null;

                        return (
                          <div key={`variant-opt-${optionName}-${oIdx}`} className="space-y-2.5" data-variant-attribute={optionName}>
                            <div className="flex items-center justify-between gap-2 text-[13.5px] sm:text-sm">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-stone-600 dark:text-slate-300 font-medium flex items-center gap-1.5 flex-wrap">
                                  <span>{optionName}:</span>
                                  <strong className="text-stone-900 dark:text-white font-bold inline-flex items-center gap-1">
                                    <span>{selectedValue ? selectedValue : <span className="text-stone-400 font-normal">Choose {optionName}</span>}</span>
                                    {isColorOpt && (activeColorSpec?.isHot || (activeColorSpec as any)?.hot) && (
                                      <span className="text-amber-500 text-xs leading-none inline-flex items-center" title="Popular choice">
                                        🔥
                                      </span>
                                    )}
                                  </strong>
                                </span>
                              </div>
                              {oIdx === 0 &&
                                !((!variantOptions || !Object.keys(variantOptions).some(k => isColorOptionName(k))) && colorOptions && colorOptions.length > 0) &&
                                !((!variantOptions || !Object.keys(variantOptions).some(k => isSizeOptionName(k))) && sizeOptions && sizeOptions.length > 0) &&
                                (chosenColor || chosenSize || Object.values(selectedOptions).some(Boolean)) && (
                                <button
                                  type="button"
                                  onClick={() => handleUnselectOption()}
                                  className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                                >
                                  Clear All
                                </button>
                              )}
                            </div>

                            {/* Options buttons / swatches (No prices inside boxes) */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5">
                              <div className="flex flex-wrap gap-2.5 items-center">
                              {optionValues.map((val, vIdx) => {
                                const isSelected = Boolean(selectedValue && selectedValue.toLowerCase() === val.toLowerCase());
                                const displayVal = isSizeOpt ? getSizeSymbol(val) : val;
                                const colorSpec = isColorOpt
                                  ? selectedProduct.colors?.find((c: any) => c.name.toLowerCase() === val.toLowerCase())
                                  : null;
                                const optStockStatus = getOptionValueStockStatus(optionName, val);
                                const isOptOutOfStock =
                                  optStockStatus === "out_of_stock" ||
                                  (isColorOpt && colorSpec && (colorSpec as any).stock !== undefined && Number((colorSpec as any).stock) <= 0) ||
                                  isVariantOptionValueOutOfStock({
                                    optionName,
                                    optionValue: val,
                                    selectedOptions,
                                    variants: selectedProduct.variants,
                                    productStock: selectedProduct.stock,
                                    colors: selectedProduct.colors,
                                    colorStockTrackingEnabled: selectedProduct.colorStockTrackingEnabled
                                  });

                                if (isColorOpt) {
                                  const hex = colorSpec?.hex || resolveColorHex(val);
                                  const swatchImg = colorSpec?.imageUrl || colorSpec?.image || (colorSpec?.images && colorSpec.images[0]) || null;
                                  const isHotChoice = !!(colorSpec?.isHot || (colorSpec as any)?.hot || vIdx < 2);
                                  const isPhotoCardsModel = selectedProduct.colorVariantStyle === "photo_cards" || selectedProduct.colorVariantStyle === "image_cards" || selectedProduct.colorVariantStyle === "cards";
                                  const isSolidCirclesModel = selectedProduct.colorVariantStyle === "solid_circles";

                                  if (isPhotoCardsModel) {
                                    const isValidImg = swatchImg && typeof swatchImg === "string" && (swatchImg.startsWith("http") || swatchImg.startsWith("data:") || swatchImg.startsWith("/") || swatchImg.startsWith("blob:"));
                                    return (
                                      <button
                                        key={`color-card-${val}-${vIdx}`}
                                        type="button"
                                        disabled={isOptOutOfStock}
                                        title={isOptOutOfStock ? `${val} (Out of Stock)` : val}
                                        onClick={() => {
                                          if (isOptOutOfStock) return;
                                          handleSelectOption(optionName, val);
                                        }}
                                        className={`group relative flex flex-col rounded-lg overflow-hidden transition-all duration-200 text-left bg-white dark:bg-stone-900 shrink-0 ${
                                          isSelected
                                            ? "border-2 border-slate-950 dark:border-white shadow-sm ring-1 ring-slate-950/20 cursor-pointer"
                                            : isOptOutOfStock
                                            ? "border border-stone-200 opacity-50 cursor-not-allowed"
                                            : "border border-stone-300 dark:border-stone-700 hover:border-slate-400 hover:shadow-xs cursor-pointer"
                                        }`}
                                        style={{ width: "66px", minWidth: "62px" }}
                                      >
                                        <div className="w-full h-16 sm:h-[68px] bg-stone-50 dark:bg-stone-850 relative overflow-hidden flex items-center justify-center">
                                          {isValidImg ? (
                                            <img
                                              src={swatchImg}
                                              alt={val}
                                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                                              onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                                const fallback = e.currentTarget.parentElement?.querySelector(".swatch-fallback") as HTMLElement;
                                                if (fallback) fallback.style.display = "flex";
                                              }}
                                            />
                                          ) : null}
                                          <div
                                            className={`swatch-fallback w-full h-full relative ${isValidImg ? "hidden" : "flex"}`}
                                            style={{ backgroundColor: hex }}
                                          />
                                          {isOptOutOfStock && (
                                            <span className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center backdrop-blur-[0.5px]">
                                              <span className="text-[8px] font-black text-rose-600 uppercase bg-rose-50 dark:bg-rose-950/80 px-1 py-0.5 rounded border border-rose-200 dark:border-rose-800 leading-none shadow-xs">
                                                Out
                                              </span>
                                            </span>
                                          )}
                                        </div>

                                        <div className="px-1 py-1.5 bg-white dark:bg-stone-900 border-t border-stone-200/90 dark:border-stone-800 flex flex-col items-center justify-center min-h-[26px] w-full text-center">
                                          <div className="flex items-center justify-center gap-1 w-full px-0.5">
                                            {isHotChoice && (
                                              <span
                                                className="text-amber-500 text-[10px] shrink-0 select-none leading-none inline-flex items-center"
                                                title="Popular choice"
                                              >
                                                🔥
                                              </span>
                                            )}
                                            <span
                                              className={`text-xs sm:text-[13px] truncate leading-tight ${
                                                isOptOutOfStock
                                                  ? "text-stone-400 line-through"
                                                  : isSelected
                                                  ? "text-slate-950 dark:text-white font-bold"
                                                  : "text-slate-700 dark:stone-300 font-semibold"
                                              }`}
                                              title={val}
                                            >
                                              {val}
                                            </span>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  }

                                  if (isSolidCirclesModel) {
                                    return (
                                      <div key={`color-circle-wrap-${val}-${vIdx}`} className="flex flex-col items-center gap-1">
                                        <button
                                          type="button"
                                          disabled={isOptOutOfStock}
                                          title={isOptOutOfStock ? `${val} (Out of Stock)` : val}
                                          onClick={() => {
                                            if (isOptOutOfStock) return;
                                            handleSelectOption(optionName, val);
                                          }}
                                          className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 p-[2px] ${
                                            isSelected
                                              ? "border-2 border-blue-600 scale-105 shadow-md cursor-pointer active:scale-95"
                                              : isOptOutOfStock
                                              ? "border border-stone-200 opacity-45 cursor-not-allowed"
                                              : "border border-stone-300 hover:border-slate-500 hover:scale-105 cursor-pointer active:scale-95"
                                          }`}
                                        >
                                          <span
                                            className="w-full h-full rounded-full shadow-inner flex items-center justify-center overflow-hidden transition-transform relative"
                                            style={{ backgroundColor: hex }}
                                          >
                                            {isSelected && !isOptOutOfStock && (
                                              <Check className={`w-4 h-4 stroke-[3] ${isColorDark(hex) ? "text-white" : "text-slate-900"} drop-shadow-sm`} />
                                            )}
                                          </span>
                                          {isOptOutOfStock && (
                                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                              <span className="w-full h-[2px] bg-rose-500 rotate-45 rounded-full" />
                                            </span>
                                          )}
                                        </button>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div key={`color-wrap-${val}-${vIdx}`} className="flex flex-col items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={isOptOutOfStock}
                                        title={isOptOutOfStock ? `${val} (Out of Stock)` : val}
                                        onClick={() => {
                                          if (isOptOutOfStock) return;
                                          handleSelectOption(optionName, val);
                                        }}
                                        className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 p-[2px] ${
                                          isSelected
                                            ? "border-2 border-blue-600 scale-105 shadow-md cursor-pointer active:scale-95"
                                            : isOptOutOfStock
                                            ? "border border-stone-200 opacity-45 cursor-not-allowed"
                                            : "border border-stone-300 hover:border-slate-500 hover:scale-105 cursor-pointer active:scale-95"
                                        }`}
                                      >
                                        <span
                                          className="w-full h-full rounded-full shadow-inner flex items-center justify-center overflow-hidden transition-transform relative bg-stone-100"
                                          style={{ backgroundColor: hex }}
                                        >
                                          {swatchImg ? (
                                            <img
                                              src={swatchImg}
                                              alt={val}
                                              className="w-full h-full object-cover rounded-full pointer-events-none"
                                              onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                              }}
                                            />
                                          ) : null}
                                          {isSelected && (
                                            <span className={`absolute inset-0 flex items-center justify-center ${swatchImg ? "bg-blue-600/35 backdrop-blur-[0.5px]" : ""}`}>
                                              <Check className={`w-4 h-4 stroke-[3] ${swatchImg ? "text-white drop-shadow-md" : (isColorDark(hex) ? "text-white" : "text-slate-900")}`} />
                                            </span>
                                          )}
                                        </span>
                                        {isOptOutOfStock && (
                                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <span className="w-full h-[2px] bg-rose-500 rotate-45 rounded-full" />
                                          </span>
                                        )}
                                      </button>
                                    </div>
                                  );
                                }

                                return (
                                  <button
                                    key={`noncolor-val-${val}-${vIdx}`}
                                    type="button"
                                    title={isOptOutOfStock ? `${val} (Out of Stock)` : val}
                                    onClick={() => handleSelectOption(optionName, val)}
                                    className={`group relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] sm:text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-97 ${
                                      isSizeOpt ? "min-w-[48px] h-[40px] justify-center px-3.5 font-bold" : ""
                                    } ${
                                      isSelected
                                        ? "bg-blue-50 text-blue-900 border-2 border-blue-600 shadow-xs font-bold ring-1 ring-blue-500/20"
                                        : isOptOutOfStock
                                        ? "bg-stone-50 hover:bg-stone-100 text-stone-400 border border-stone-200/80"
                                        : "bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/90 hover:border-stone-300"
                                    }`}
                                  >
                                    <span className={isOptOutOfStock ? "line-through decoration-2 opacity-75" : ""}>{displayVal}</span>
                                    {isSelected && !isSizeOpt && <Check className="w-3.5 h-3.5 ml-0.5 text-blue-600 shrink-0" />}
                                    {isOptOutOfStock && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="Out of stock" />
                                    )}
                                  </button>
                                );
                              })}
                              </div>
                              {isSizeOpt && showFindYourFit && (
                                <FindYourFitButton
                                  onClick={() => setIsFindYourFitOpen(true)}
                                  currentLanguage={descLang}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* 1D. Quantity Selector Under Variants */}
                  <div className="pt-2.5 flex items-center justify-between gap-4 border-t border-stone-200/60 dark:border-slate-800" data-testid="under-variants-quantity">
                    <span className="text-stone-600 dark:text-slate-300 font-medium text-[13.5px] sm:text-sm">
                      Quantity:{" "}
                      <strong className="text-stone-900 dark:text-white font-bold ml-1">{purchaseQty}</strong>
                    </span>
                    <div className="inline-flex items-center border border-stone-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={isOutOfStock || purchaseQty <= 1}
                        onClick={() => setPurchaseQty((p) => Math.max(1, p - 1))}
                        className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sm transition-colors cursor-pointer select-none"
                      >
                        -
                      </button>
                      <span
                        data-testid="variant-quantity-value"
                        className="px-3.5 font-mono font-bold text-[13px] sm:text-sm text-slate-900 dark:text-white min-w-[38px] text-center select-none"
                      >
                        {purchaseQty}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={isOutOfStock || purchaseQty >= Math.max(1, currentStock || 10)}
                        onClick={() => setPurchaseQty((p) => Math.min(Math.max(1, currentStock || 10), p + 1))}
                        className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sm transition-colors cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  </div>
                )}

                {/* 2. ABOUT THIS ITEM / SPECIFICATIONS TABLE (Clean, Non-interactive, Measurement Unit Hidden, Canonical Order, Synchronized Curved Accent) */}
                {aboutItemSpecs.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-b border-stone-200/80 dark:border-slate-800 pb-4 animate-fadeIn">
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        {isFashionCategory ? (
                          <Shirt className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-slate-700 dark:text-slate-300" />
                        ) : (
                          <Sparkles className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-slate-700 dark:text-slate-300" />
                        )}
                        <span className="font-extrabold text-[13px] sm:text-[13.5px] uppercase tracking-wider text-slate-800 dark:text-slate-100 font-sans">
                          About this item
                        </span>
                      </div>
                    </div>

                    <div
                      className="border border-stone-200/80 dark:border-slate-800 border-l-[3.5px] rounded-2xl overflow-hidden shadow-3xs bg-stone-50/50 dark:bg-slate-900/80"
                      style={{ borderLeftColor: synchronizedAccentColor }}
                    >
                      <table className="w-full text-[13px] sm:text-[13.5px] border-collapse font-sans">
                        <tbody>
                          {aboutItemSpecs.map((spec, sIdx, arr) => {
                            const isLast = sIdx === arr.length - 1;
                            return (
                              <tr key={`spec-about-${spec.key}-${sIdx}`} className={`border-b ${isLast ? 'border-b-0' : 'border-stone-200/55 dark:border-slate-800'} hover:bg-stone-50/70 dark:hover:bg-slate-800/40 transition-colors`}>
                                <td className="p-3 px-3.5 bg-stone-100/50 dark:bg-slate-800/60 font-normal text-slate-600 dark:text-slate-300 text-[13px] sm:text-[13.5px] w-1/3 border-r border-stone-200/40 dark:border-slate-800 align-middle">
                                  {spec.key}
                                </td>
                                <td className="p-3 px-3.5 text-slate-800 dark:text-slate-100 font-normal text-[13px] sm:text-[13.5px] align-middle">
                                  {spec.value}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>


              {/* Optional Showcase Videos in the middle of the page removed */}




            </div>
          </div>

              {/* 3. Customer Reviews & Rating Module */}
              <ProductReviewWidget
                productName={selectedProduct.name}
                storeName={selectedStore.name}
                storeLogo={selectedStore.logo || (selectedStore as any).logoUrl}
                activeThemeColor={activeThemeColor}
                currentUserName={currentUser?.name || selectedStore?.name || myStore?.name || "Tapis Berbères Ath Yenni"}
                currentUserRole={currentUser ? currentUser.role : "Guest"}
                currentUserId={(currentUser as any)?.id}
                currentUserIp={getGuestIp()}
                currentStoreId={selectedStore?.id}
                myStoreId={myStore?.id}
                purchasedVariant={hasUserPurchasedCurrentProduct ? ([chosenColor, chosenSize].filter(Boolean).join(" • ") || "Black • XL") : undefined}
                reviews={threadedComments.map((c) => {
                  const mapReplyRecursively = (r: any): any => ({
                    id: r.id,
                    author: r.author,
                    role: r.role,
                    badge: r.badge,
                    ip: (r as any).ip || (r as any).commentIp,
                    text: r.text,
                    images: r.images || [],
                    purchasedVariant: (r as any).purchasedVariant,
                    avatar: r.avatar,
                    avatarBg: r.avatarBg,
                    time: r.time,
                    likes: r.likes || 0,
                    liked: r.liked,
                    loves: r.loves,
                    loved: r.loved,
                    hahas: r.hahas,
                    hahad: r.hahad,
                    emoji: r.emoji,
                    isHidden: r.isHidden,
                    isPinned: r.isPinned,
                    isLocked: r.isLocked,
                    parentId: r.parentId || c.id,
                    replies: r.replies ? r.replies.map(mapReplyRecursively) : []
                  });

                  return {
                    id: c.id,
                    author: c.author,
                    role: c.role,
                    badge: c.badge,
                    ip: (c as any).ip || (c as any).commentIp,
                    rating: (c as any).rating || 5,
                    text: c.text,
                    images: (c as any).images || [],
                    purchasedVariant: (c as any).purchasedVariant,
                    avatar: c.avatar,
                    avatarBg: c.avatarBg,
                    time: c.time,
                    likes: c.likes,
                    liked: c.liked,
                    loves: c.loves,
                    loved: c.loved,
                    hahas: c.hahas,
                    hahad: c.hahad,
                    emoji: (c as any).emoji || "😊",
                    isHidden: (c as any).isHidden,
                    isPinned: (c as any).isPinned,
                    isLocked: (c as any).isLocked,
                    parentId: c.parentId,
                    replies: c.replies?.map(mapReplyRecursively) || []
                  };
                })}
                onAddReview={(newReview) => {
                  const identity = getUserCommentIdentity();
                  const isGuest = !currentUser || identity.role === "Guest" || identity.author.toLowerCase().includes("guest");
                  const actualPurchasedVariant =
                    newReview.purchasedVariant ||
                    (hasUserPurchasedCurrentProduct
                      ? [chosenColor, chosenSize].filter(Boolean).join(" • ") || "Black • XL"
                      : undefined);

                  const item = {
                    id: `rc_${Date.now()}`,
                    author: identity.author,
                    role: identity.role,
                    badge: actualPurchasedVariant ? "Verified Purchase" : identity.badge,
                    ip: getGuestIp(),
                    rating: newReview.rating,
                    text: newReview.text,
                    emoji: newReview.emoji,
                    images: isGuest ? [] : (newReview.images || []),
                    purchasedVariant: actualPurchasedVariant,
                    avatar: identity.avatar,
                    avatarBg: identity.avatarBg,
                    time: "Just now",
                    likes: 0,
                    parentId: null,
                    isNew: true,
                    replies: []
                  };
                  setThreadedComments((prev) => [item, ...prev]);
                }}
                onToggleLike={(reviewId) => {
                  setThreadedComments((prev) =>
                    prev.map((c) => {
                      if (c.id === reviewId) {
                        const liked = !c.liked;
                        const likes = c.likes + (liked ? 1 : -1);
                        return { ...c, likes, liked };
                      }
                      return c;
                    })
                  );
                }}
                onToggleLove={(reviewId) => {
                  setThreadedComments((prev) =>
                    prev.map((c) => {
                      if (c.id === reviewId) {
                        const loved = !c.loved;
                        const currentLoves = typeof c.loves === "number" ? c.loves : (c.loved ? 1 : 0);
                        const loves = Math.max(0, currentLoves + (loved ? 1 : -1));
                        return { ...c, loves, loved };
                      }
                      return c;
                    })
                  );
                }}
                onToggleHaha={(reviewId) => {
                  setThreadedComments((prev) =>
                    prev.map((c) => {
                      if (c.id === reviewId) {
                        const hahad = !c.hahad;
                        const currentHahas = typeof c.hahas === "number" ? c.hahas : (c.hahad ? 1 : 0);
                        const hahas = Math.max(0, currentHahas + (hahad ? 1 : -1));
                        return { ...c, hahas, hahad };
                      }
                      return c;
                    })
                  );
                }}
                onAddReply={(targetId, replyText, images) => {
                  const identity = getUserCommentIdentity();
                  const isGuest = !currentUser || identity.role === "Guest" || identity.author.toLowerCase().includes("guest");
                  const newReply = {
                    id: `reply_${Date.now()}`,
                    author: identity.author,
                    role: identity.role,
                    badge: identity.badge,
                    ip: getGuestIp(),
                    text: replyText,
                    images: isGuest ? [] : (images || []),
                    avatar: identity.avatar,
                    avatarBg: identity.avatarBg,
                    time: "Just now",
                    likes: 0,
                    parentId: targetId,
                    isNew: true,
                    replies: []
                  };

                  const insertReplyInTree = (items: any[]): any[] => {
                    return items.map((item) => {
                      if (item.id === targetId) {
                        return {
                          ...item,
                          replies: [...(item.replies || []), newReply]
                        };
                      }
                      if (item.replies && item.replies.length > 0) {
                        return {
                          ...item,
                          replies: insertReplyInTree(item.replies)
                        };
                      }
                      return item;
                    });
                  };

                  setThreadedComments((prev) => insertReplyInTree(prev));
                }}
                onToggleReplyLike={(rootId, replyId) => {
                  const targetId = replyId || rootId;
                  const toggleLikeInTree = (items: any[]): any[] => {
                    return items.map((item) => {
                      if (item.id === targetId) {
                        const liked = !item.liked;
                        const likes = (item.likes || 0) + (liked ? 1 : -1);
                        return { ...item, liked, likes };
                      }
                      if (item.replies && item.replies.length > 0) {
                        return { ...item, replies: toggleLikeInTree(item.replies) };
                      }
                      return item;
                    });
                  };
                  setThreadedComments((prev) => toggleLikeInTree(prev));
                }}
                onToggleReplyLove={(rootId, replyId) => {
                  const targetId = replyId || rootId;
                  const toggleLoveInTree = (items: any[]): any[] => {
                    return items.map((item) => {
                      if (item.id === targetId) {
                        const loved = !item.loved;
                        const currentLoves = typeof item.loves === "number" ? item.loves : (item.loved ? 1 : 0);
                        const loves = Math.max(0, currentLoves + (loved ? 1 : -1));
                        return { ...item, loved, loves };
                      }
                      if (item.replies && item.replies.length > 0) {
                        return { ...item, replies: toggleLoveInTree(item.replies) };
                      }
                      return item;
                    });
                  };
                  setThreadedComments((prev) => toggleLoveInTree(prev));
                }}
                onToggleReplyHaha={(rootId, replyId) => {
                  const targetId = replyId || rootId;
                  const toggleHahaInTree = (items: any[]): any[] => {
                    return items.map((item) => {
                      if (item.id === targetId) {
                        const hahad = !item.hahad;
                        const currentHahas = typeof item.hahas === "number" ? item.hahas : (item.hahad ? 1 : 0);
                        const hahas = Math.max(0, currentHahas + (hahad ? 1 : -1));
                        return { ...item, hahad, hahas };
                      }
                      if (item.replies && item.replies.length > 0) {
                        return { ...item, replies: toggleHahaInTree(item.replies) };
                      }
                      return item;
                    });
                  };
                  setThreadedComments((prev) => toggleHahaInTree(prev));
                }}
                onDeleteComment={(targetId) => {
                  const deleteFromTree = (items: any[]): any[] => {
                    return items
                      .filter((item) => item.id !== targetId)
                      .map((item) => {
                        if (item.replies && item.replies.length > 0) {
                          return { ...item, replies: deleteFromTree(item.replies) };
                        }
                        return item;
                      });
                  };
                  setThreadedComments((prev) => deleteFromTree(prev));
                }}
                onEditComment={(targetId, newText) => {
                  const editInTree = (items: any[]): any[] => {
                    return items.map((item) => {
                      if (item.id === targetId) {
                        return { ...item, text: newText, isEdited: true };
                      }
                      if (item.replies && item.replies.length > 0) {
                        return { ...item, replies: editInTree(item.replies) };
                      }
                      return item;
                    });
                  };
                  setThreadedComments((prev) => editInTree(prev));
                }}
                onCustomizeComment={(targetId, updates) => {
                  const customizeInTree = (items: any[]): any[] => {
                    return items.map((item) => {
                      if (item.id === targetId) {
                        return {
                          ...item,
                          author: updates.author || item.author,
                          badge: updates.badge || item.badge,
                          avatarBg: updates.avatarBg || item.avatarBg,
                          emoji: updates.emoji || item.emoji
                        };
                      }
                      if (item.replies && item.replies.length > 0) {
                        return { ...item, replies: customizeInTree(item.replies) };
                      }
                      return item;
                    });
                  };
                  setThreadedComments((prev) => customizeInTree(prev));
                }}
                onReportComment={(targetId, reason) => {
                  const reportInTree = (items: any[]): any[] => {
                    return items.map((item) => {
                      if (item.id === targetId) {
                        return { ...item, isReported: true, reportReason: reason };
                      }
                      if (item.replies && item.replies.length > 0) {
                        return { ...item, replies: reportInTree(item.replies) };
                      }
                      return item;
                    });
                  };
                  setThreadedComments((prev) => reportInTree(prev));
                }}
              />
            </div>

            {/* Column 3: The Redesigned Buy Box sidebar panel matching screenshot image_e5964c18.png */}
            <div className="lg:col-span-3 flex flex-col items-center lg:items-start gap-4 lg:ml-6 w-full">
              <div className="sticky top-3 bg-white dark:bg-slate-900 rounded-[28px] border border-stone-200/90 dark:border-slate-800 shadow-[0_12px_36px_rgba(0,0,0,0.07)] p-6 -mt-[6px] mx-auto lg:mx-0 text-left flex flex-col gap-3.5 w-full max-w-[360px] h-fit transition-colors duration-300">
                
                {/* 1. Centered Large Price & In-Stock Ready to Ship Status */}
                <div className="text-center space-y-1.5 pb-3.5 border-b border-stone-200/80 dark:border-slate-800">
                  <div
                    className="text-[32px] leading-tight font-extrabold font-sans tracking-tight dark:!text-white"
                    style={{ color: themeAccentColor }}
                  >
                    {formatStorePrice(calculatedSubtotal, activeCountry)}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-xs">
                    {isOutOfStock ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                        <span className="font-semibold text-rose-600 dark:text-rose-400">Out of stock</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-[#2e7d5b] dark:bg-emerald-400" />
                        <span className="font-medium text-[#2e7d5b] dark:text-emerald-400">In stock</span>
                        <span className="text-slate-600 dark:text-slate-500">|</span>
                        <span className="font-medium text-[#1f4e3d] dark:text-emerald-300">Ready to ship</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Product Thumbnail + Selected Variant Summary (Hidden until customer selects variants; shown immediately if product has no options or when Offers Widget is active) */}
                {isOffersActive && activeOfferTier ? (
                  <div className="pb-3.5 border-b border-stone-200/80 dark:border-slate-800" data-testid="buycard-variant-summary">
                    <OrganizedOfferSummaryBuyBox
                      tier={activeOfferTier}
                      unitSelections={offerUnitSelections}
                      totalUnits={activeOfferPricing?.totalUnits || 1}
                      savingsDzd={activeOfferPricing?.savingsDzd}
                      freeGifts={activeOfferTier.freeGifts}
                      accentColor={themeAccentColor || activeThemeColor || "#4A0E2E"}
                      thumbnailUrl={
                        activeOfferTier.imageUrl ||
                        (activeColorSpec && (activeColorSpec.imageUrl || (activeColorSpec as any).image)) ||
                        (matchedVariant && (matchedVariant.imageUrl || (matchedVariant.images && matchedVariant.images[0]))) ||
                        selectedProduct.imageUrl ||
                        selectedProduct.images?.[0] ||
                        ""
                      }
                      productName={selectedProduct.name}
                      step3Variants={selectedProduct.variants as any}
                      step3Colors={selectedProduct.colors as any}
                      productImages={selectedProduct.images}
                    />
                  </div>
                ) : shouldDisplayBuyCardItem ? (
                  <div
                    className="flex items-center gap-3 pb-3.5 border-b border-stone-200/80 dark:border-slate-800"
                    data-testid="buycard-selected-item"
                  >
                    <div className="w-11 h-11 rounded-xl border border-stone-200/80 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 overflow-hidden shrink-0">
                      <img
                        src={
                          (activeColorSpec && (activeColorSpec.imageUrl || (activeColorSpec as any).image)) ||
                          (matchedVariant && (matchedVariant.imageUrl || (matchedVariant.images && matchedVariant.images[0]))) ||
                          selectedProduct.imageUrl ||
                          selectedProduct.images?.[0] ||
                          undefined
                        }
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-[13.5px] leading-snug text-slate-900 dark:text-slate-100 font-medium min-w-0">
                      <span>
                        {purchaseQty} {purchaseQty === 1 ? "item" : "items"}:{" "}
                      </span>
                      <span>
                        {selectedVariantSummaryLabels.length > 0
                          ? selectedVariantSummaryLabels.join(", ")
                          : "Standard"}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* 3. Delivery Duration & Destination Row */}
                <div
                  className="flex items-center justify-between gap-3 pb-3.5 border-b border-stone-200/80 dark:border-slate-800"
                  data-testid="buycard-shipping-duration"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-800 dark:text-slate-200 stroke-[1.8] shrink-0" />
                    <div className="space-y-0.5 text-xs">
                      <div className="text-[13.5px] font-medium text-slate-900 dark:text-white">
                        Delivery:{" "}
                        <span>
                          {selectedCountryCode === "DZ"
                            ? selectedWilaya?.time || "24–48 Hours"
                            : "3–5 Days"}
                        </span>
                      </div>
                      <div className="text-xs text-stone-400 dark:text-slate-400">
                        Deliver to:{" "}
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {selectedWilaya?.name?.replace(/^\d+\s*-\s*/, "") ||
                            selectedStateName.replace(/^\d+\s*-\s*/, "") ||
                            "Algiers"}
                        </span>{" "}
                        <button
                          type="button"
                          onClick={() => setIsShippingOpen(!isShippingOpen)}
                          className="text-stone-400 dark:text-slate-400 underline hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          ({isShippingOpen ? "Hide" : "Change"})
                        </button>
                      </div>
                    </div>
                  </div>
                  {isShippingOpen && (
                    <button
                      type="button"
                      onClick={() => setIsShippingOpen(false)}
                      className="text-stone-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      aria-label="Close shipping options"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Redesigned Inline Shipping Selector matching the Buy Card aesthetic */}
                <AnimatePresence>
                  {isShippingOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="pb-3.5 border-b border-stone-200/80 dark:border-slate-800 space-y-2.5"
                    >
                      <SearchableLocationSelect
                        label="Country"
                        required={false}
                        allowCustom={false}
                        variant="buycard"
                        accentColor={themeAccentColor}
                        value={selectedCountryName}
                        onChange={handleCountryChange}
                        options={countryOptions}
                        placeholder="Select country..."
                        searchPlaceholder="Search country..."
                        icon={Globe}
                      />

                      <SearchableLocationSelect
                        label="State"
                        required={false}
                        allowCustom={false}
                        variant="buycard"
                        accentColor={themeAccentColor}
                        value={selectedStateName}
                        onChange={handleStateChange}
                        options={stateOptions}
                        placeholder="Select state..."
                        searchPlaceholder="Search state..."
                        icon={MapPin}
                      />

                      <SearchableLocationSelect
                        label="Delivery Type"
                        required={false}
                        allowCustom={false}
                        searchable={false}
                        variant="buycard"
                        accentColor={themeAccentColor}
                        value={shippingMethod}
                        onChange={(opt) =>
                          setShippingMethod(opt.code === "stopdesk" ? "stopdesk" : "home")
                        }
                        options={[
                          {
                            code: "home",
                            name: "Home Delivery",
                            displayLabel: "Home Delivery",
                          },
                          {
                            code: "stopdesk",
                            name: "Stop Desk",
                            displayLabel: "Stop Desk",
                          },
                        ]}
                        placeholder="Select delivery type..."
                        icon={Truck}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 4. Promo Code Row between horizontal dividers */}
                <div className="pb-3.5 border-b border-stone-200/80 dark:border-slate-800 space-y-1">
                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-1.5 text-xs">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300">
                        {appliedPromo.code} (-{appliedPromo.percent}%)
                      </span>
                      <button
                        type="button"
                        onClick={handleRemovePromoCode}
                        className="text-emerald-700 dark:text-emerald-400 font-extrabold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => {
                          setPromoCodeInput(e.target.value.trimStart());
                          if (promoError) setPromoError("");
                        }}
                        placeholder="Promo Code"
                        className="flex-1 bg-transparent text-[13.5px] text-slate-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyPromoCode(promoCodeInput.trim())}
                        className="px-3.5 py-1.5 rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-stone-200/80 dark:hover:bg-slate-700 text-xs font-bold dark:!text-slate-100 transition-colors cursor-pointer shrink-0"
                        style={{ color: themeAccentColor }}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {promoError && (
                    <p className="text-[10.5px] font-semibold text-rose-600 dark:text-rose-400">{promoError}</p>
                  )}
                </div>

                {/* 5. Price Breakdown: Items, Delivery, Discount */}
                <div className="space-y-2 text-[13.5px] pb-3.5 border-b border-stone-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-slate-400">Items:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {formatStorePrice(calculatedSubtotal, activeCountry)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-slate-400">Delivery:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {formatStorePrice(calculatedShippingFee, activeCountry)}
                    </span>
                  </div>
                  {Boolean(appliedPromo && calculatedDiscountAmount > 0) && (
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 dark:text-slate-400">Discount:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        -{formatStorePrice(calculatedDiscountAmount, activeCountry)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 6. Total Row */}
                <div className="flex items-baseline justify-between pb-1">
                  <span
                    className="text-lg font-extrabold dark:!text-white"
                    style={{ color: themeAccentColor }}
                  >
                    Total:
                  </span>
                  <span
                    className="text-xl font-extrabold font-sans dark:!text-white"
                    style={{ color: themeAccentColor }}
                  >
                    {formatStorePrice(calculatedGrandTotal, activeCountry)}
                  </span>
                </div>

                {/* Cash on delivery reassurance note */}
                <div 
                  className="text-[10.5px] text-stone-400 dark:text-slate-400 text-center -mt-[11px] -mb-[5px] mr-[2px] ml-0 p-0"
                  style={{
                    marginTop: "-11px",
                    marginBottom: "-5px",
                    marginRight: "2px",
                    marginLeft: "0px",
                    paddingTop: "0px",
                    paddingBottom: "0px",
                    paddingLeft: "0px",
                  }}
                >
                  <span>Pay safely in cash when you receive your package.</span>
                </div>

                {/* 7. Action Buttons: Solid Buy Now on top, Outlined Add to Cart below */}
                <div className="space-y-2.5">
                  {isOutOfStock ? (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (effectiveHasNotified) return;
                        setHasNotified(true);
                        if (onNotifyMe) {
                          onNotifyMe(selectedProduct.name, selectedStore.name, {
                            storeId: selectedStore.id,
                            productId: selectedProduct.id,
                            productImage: selectedProduct.imageUrl || (selectedProduct.images && selectedProduct.images[0]),
                            variantId: matchedVariant?.id,
                            variantLabel: currentNotifyVariantSummary,
                          });
                        }
                      }}
                      className="w-full h-12 text-white font-bold rounded-full text-center text-sm shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: effectiveHasNotified ? "#10b981" : themeAccentColor,
                      }}
                    >
                      <span>{effectiveHasNotified ? "We'll Notify You! ✓" : "Notify Me"}</span>
                    </motion.button>
                  ) : (
                    <>
                      {/* Primary Solid "Buy Now" Button */}
                      <button
                        type="button"
                        onClick={() => setIsExpressCheckoutOpen(true)}
                        className="w-full h-12 text-white font-bold rounded-full text-center text-sm shadow-sm hover:brightness-95 active:scale-98 cursor-pointer transition-all flex items-center justify-center gap-2 dark:ring-1 dark:ring-white/20"
                        style={{ backgroundColor: themeAccentColor }}
                      >
                        <CreditCard className="w-4 h-4 shrink-0 text-white" />
                        <span>Buy Now</span>
                      </button>

                      {/* Secondary Outlined "Add to Cart" Button */}
                      <button
                        type="button"
                        onClick={() => handleAddToCartWithGuestCheck()}
                        className="w-full h-11 bg-white dark:bg-slate-800 font-bold rounded-full text-center text-sm hover:bg-stone-50 dark:hover:bg-slate-700 active:scale-98 cursor-pointer transition-all border-[1.5px] dark:!border-slate-600 dark:!text-white flex items-center justify-center gap-2"
                        style={{
                          borderColor: themeAccentColor,
                          color: themeAccentColor,
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 shrink-0" />
                        <span>Add to Cart</span>
                      </button>
                    </>
                  )}
                </div>

                {/* 8. Centered Check shipping prices link */}
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsShippingOpen(!isShippingOpen)}
                    className="text-[13px] font-medium underline hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ color: themeAccentColor }}
                  >
                    Check shipping prices
                  </button>
                </div>

                {/* 9. Footer Security & Store Delivery Responsibility Info */}
                <div className="pt-1 flex items-center justify-center gap-1 text-[10.5px] text-stone-400 text-center flex-wrap">
                  <Lock className="w-3 h-3 text-stone-400 shrink-0" />
                  <span>Secure checkout • Delivery responsibility:</span>
                  <span className="text-slate-700 font-medium">
                    {(selectedStore.name || "Store").replace(/^YUME\s+/i, "").trim() || "Merchant Store"} (Store)
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* PRODUCT STORY (Sequential Images with Optional Descriptions) */}
          {/* ========================================================================= */}
          {selectedProduct.advancedLandingPageEnabled === true && (
            <div id="amazon-aplus-product-landing" className="my-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-left w-full">
              {(() => {
                let storyItems: Array<{ url: string; description?: string }> = [];
                const prodAny = selectedProduct as any;

                if (prodAny.advancedProductStorySections && Array.isArray(prodAny.advancedProductStorySections) && prodAny.advancedProductStorySections.length > 0) {
                  storyItems = prodAny.advancedProductStorySections.map((item: any) => {
                    if (typeof item === 'string') return { url: item, description: '' };
                    return { url: item.url || item.image || '', description: item.description || '' };
                  }).filter((it: any) => it.url);
                } else if (selectedProduct.uploadedLandingPageContent) {
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(selectedProduct.uploadedLandingPageContent, "text/html");
                  const itemEls = doc.querySelectorAll(".product-story-item");

                  if (itemEls && itemEls.length > 0) {
                    itemEls.forEach((el) => {
                      const img = el.querySelector("img");
                      const desc = el.querySelector(".product-story-desc");
                      if (img && img.getAttribute("src")) {
                        storyItems.push({
                          url: img.getAttribute("src") || "",
                          description: desc ? desc.textContent || "" : ""
                        });
                      }
                    });
                  } else {
                    const regex = /<img[^>]+src="([^">]+)"/g;
                    let match;
                    while ((match = regex.exec(selectedProduct.uploadedLandingPageContent)) !== null) {
                      if (match[1] && !storyItems.some(it => it.url === match[1])) {
                        storyItems.push({ url: match[1], description: '' });
                      }
                    }
                  }
                }

                if (storyItems.length === 0 && prodAny.landingImages && Array.isArray(prodAny.landingImages)) {
                  storyItems = prodAny.landingImages.map((img: string) => ({ url: img, description: '' }));
                }

                if (storyItems.length > 0) {
                  return (
                    <div className="w-full space-y-6">
                      <div className="flex flex-col w-full gap-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
                        {storyItems.map((item, idx) => (
                          <div key={`story-preview-img-${idx}`} className="w-full flex flex-col bg-transparent">
                            <img
                              src={item.url}
                              alt={`Product Story Image ${idx + 1}`}
                              className="w-full h-auto block max-w-full object-contain"
                              decoding="async"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              style={{ display: "block", width: "100%", height: "auto", margin: 0, padding: 0 }}
                            />
                            {item.description && item.description.trim() !== "" && (
                              <div className="p-4 sm:p-5 bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800/80">
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans font-medium text-left">
                                  {item.description}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          )}

          {/* ========================================================================= */}
          {/* BOTTOM PAYBOX & INLINE ORDER FORM (Paybox hides when 'Buy Now' is clicked) */}
          {/* ========================================================================= */}
          
          {selectedProduct.advancedLandingPageEnabled === true && (
            <div id="bottom-layout-paybox" className={`my-8 w-full text-left transition-all duration-500 ease-in-out scroll-mt-6 ${
              isBottomInlineCheckoutOpen ? "w-full max-w-full" : "max-w-3xl mx-auto"
            }`}>
              <AnimatePresence mode="wait">
                {!isBottomInlineCheckoutOpen ? (
                <motion.div 
                  key="bottom-paybox-card"
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white rounded-2xl border border-stone-200/80 ring-1 ring-slate-900/5 shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)] transition-all duration-500 p-4 sm:p-5 md:p-6 space-y-3.5 text-slate-900 w-full"
                >
                  {/* Top row: Item & Total Price & Stock Availability */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div>
                      {isShippingCalculated ? (
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider font-mono">Total Price:</span>
                            <span className="text-2xl font-black font-display tracking-tight" style={{ color: activeThemeColor }}>
                              {calculatedGrandTotal.toLocaleString()} DA
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 text-xs font-bold text-stone-600 pt-0.5">
                            <span>Item Price: <strong className="text-slate-900 font-mono">{calculatedSubtotal.toLocaleString()} DA</strong></span>
                            <span>Shipping ({shippingMethod === "home" ? "Home" : "Desk"}): <strong className="text-emerald-700 font-mono">+{calculatedShippingFee.toLocaleString()} DA</strong></span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block font-mono">
                            Item Price
                          </span>
                          <span className="text-2xl font-black font-display tracking-tight" style={{ color: activeThemeColor }}>
                            {calculatedSubtotal.toLocaleString()} DA
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-stone-500 font-bold block mb-0.5">Availability</span>
                      {isOutOfStock ? (
                        <div className="text-xs text-red-600 font-bold flex items-center gap-1.5 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                          Out of stock
                        </div>
                      ) : isLowStock ? (
                        <div className="text-xs text-amber-600 font-bold flex items-center gap-1.5 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          Low stock, Shipping ready
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                          In stock, Shipping ready
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipping Details Summary & Check Shipping Button */}
                  {isShippingOpen ? (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="space-y-3 bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left"
                      >
                        {/* Header close control only (sentence hidden for simplicity) */}
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setIsShippingOpen(false)}
                            className="text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-200/60 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* Field 1: Country */}
                          <SearchableLocationSelect
                            label="Country"
                            required={false}
                            allowCustom={false}
                            variant="buycard"
                            value={selectedCountryName}
                            onChange={handleCountryChange}
                            options={countryOptions}
                            placeholder="Select country..."
                            searchPlaceholder="Search country..."
                            icon={Globe}
                          />

                          {/* Field 2: State */}
                          <SearchableLocationSelect
                            label="State"
                            required={false}
                            allowCustom={false}
                            variant="buycard"
                            value={selectedStateName}
                            onChange={handleStateChange}
                            options={stateOptions}
                            placeholder="Select state..."
                            searchPlaceholder="Search state..."
                            icon={MapPin}
                          />

                          {/* Field 3: Delivery Type */}
                          <SearchableLocationSelect
                            label="Delivery Type"
                            required={false}
                            allowCustom={false}
                            searchable={false}
                            variant="buycard"
                            value={shippingMethod}
                            onChange={(opt) =>
                              setShippingMethod(opt.code === "stopdesk" ? "stopdesk" : "home")
                            }
                            options={[
                              {
                                code: "home",
                                name: "Home Delivery",
                                displayLabel: `Home Delivery (+${displayHomePrice.toLocaleString()} DA)`,
                              },
                              {
                                code: "stopdesk",
                                name: "Stop Desk",
                                displayLabel: `Stop Desk (+${displayDeskPrice.toLocaleString()} DA)`,
                              },
                            ]}
                            placeholder="Select delivery type..."
                            icon={Truck}
                          />
                        </div>

                        {/* Confirm Button */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsShippingCalculated(true);
                              setIsShippingOpen(false);
                            }}
                            className="w-full text-white font-extrabold py-2.5 rounded-xl text-center text-xs shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            style={{ backgroundColor: activeThemeColor }}
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>Confirm Shipping Prices</span>
                          </button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  ) : isShippingCalculated ? (
                    <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 text-xs space-y-1.5 text-slate-700">
                      <div className="flex items-center justify-between pb-1 border-b border-stone-200/60">
                        <span className="text-stone-500 font-bold text-[10px] uppercase tracking-wider font-mono flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-stone-600" />
                          Shipping Summary
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsShippingOpen(true)}
                          className="text-[11px] text-indigo-600 font-extrabold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>Check / Edit Shipping Prices</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-0.5">
                        <div>
                          <span className="text-stone-400 text-[10px] block">Destination:</span>
                          <span className="font-bold text-slate-800 text-[11px]">{selectedWilaya.id} - {selectedWilaya.name}</span>
                        </div>
                        {selectedCommune && (
                          <div>
                            <span className="text-stone-400 text-[10px] block">City:</span>
                            <span className="font-bold text-slate-800 text-[11px]">{selectedCommune}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-stone-400 text-[10px] block">Estimated Time:</span>
                          <span className="font-bold text-slate-800 font-mono text-[11px]">{selectedWilaya.time || "24-48 Hours"}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 text-[10px] block">Delivery Type & Fee:</span>
                          <span className="font-bold text-[#007600] font-mono text-[11px]">
                            {shippingMethod === "home" ? "Home" : "Desk"} (+{calculatedShippingFee.toLocaleString()} DA)
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsShippingOpen(true)}
                      className="w-full text-white font-extrabold py-2.5 px-4 rounded-xl text-center text-xs shadow-md hover:shadow-lg active:scale-98 cursor-pointer transition-all flex items-center justify-center gap-2 border border-transparent select-none outline-none group"
                      style={{ backgroundColor: activeThemeColor }}
                    >
                      <Truck className="w-4 h-4 text-white transition-transform group-hover:scale-110" />
                      <span>Check Shipping Prices</span>
                    </button>
                  )}

                  {/* Quantity Selector & Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    {isShippingCalculated && !isOutOfStock && (
                      <div className="flex items-center gap-2.5 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                        <span className="text-xs font-bold text-slate-700 font-mono">Quantity:</span>
                        <div className="flex items-center gap-1.5">
                          <button 
                            type="button" 
                            onClick={() => setPurchaseQty(p => Math.max(1, p - 1))}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-slate-800 font-black flex items-center justify-center cursor-pointer shadow-3xs transition-all text-xs"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-bold text-slate-900 min-w-[18px] text-center">{purchaseQty}</span>
                          <button 
                            type="button" 
                            onClick={() => setPurchaseQty(p => Math.min(10, p + 1))}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-slate-800 font-black flex items-center justify-center cursor-pointer shadow-3xs transition-all text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 flex flex-col sm:flex-row items-center gap-2.5 w-full">
                      {isOutOfStock ? (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (effectiveHasNotified) return;
                            setHasNotified(true);
                            if (onNotifyMe) {
                              onNotifyMe(selectedProduct.name, selectedStore.name, {
                                storeId: selectedStore.id,
                                productId: selectedProduct.id,
                                productImage: selectedProduct.imageUrl || (selectedProduct.images && selectedProduct.images[0]),
                                variantId: matchedVariant?.id,
                                variantLabel: currentNotifyVariantSummary,
                              });
                            }
                          }}
                          className="w-full text-white font-extrabold py-2.5 px-5 rounded-xl text-center text-xs shadow-md hover:shadow-lg active:scale-97 cursor-pointer transition-all border-2 select-none outline-none flex items-center justify-center gap-2 group"
                          style={{ 
                            backgroundColor: effectiveHasNotified ? "#10b981" : activeThemeColor, 
                            borderColor: effectiveHasNotified ? "#10b981" : activeThemeColor 
                          }}
                        >
                          <span>{effectiveHasNotified ? "We'll Notify You! ✓" : "Notify Me"}</span>
                        </motion.button>
                      ) : (
                        <>
                          {isRegisteredUser && (
                            <button
                              type="button"
                              onClick={() => {
                                handleAddToCartWithGuestCheck();
                              }}
                              className="w-full sm:w-1/2 bg-transparent font-extrabold py-2.5 px-5 rounded-xl text-center text-xs shadow-3xs hover:shadow-xs active:scale-97 cursor-pointer transition-all border-2 select-none outline-none flex items-center justify-center gap-2 group"
                              style={{ 
                                borderColor: themeAccentColor, 
                                color: themeAccentColor 
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = hexToRgba(themeAccentColor, 0.08);
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }}
                            >
                              <ShoppingCart className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110" />
                              <span>Add to Cart</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setIsExpressCheckoutOpen(true);
                            }}
                            className={`w-full ${isRegisteredUser ? "sm:w-1/2" : "w-full"} text-white font-extrabold py-2.5 px-5 rounded-xl text-center text-xs shadow-md hover:shadow-lg active:scale-97 cursor-pointer transition-all border-2 select-none outline-none flex items-center justify-center gap-2 group`}
                            style={{ 
                              backgroundColor: themeAccentColor, 
                              borderColor: themeAccentColor 
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.filter = "brightness(0.92)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.filter = "none";
                            }}
                          >
                            <CreditCard className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110 text-white" />
                            <span>Buy Now</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Secure Transaction Note */}
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Secure transaction process checked. Guaranteed delivery across {selectedCountryCode === "DZ" ? "58 Wilayas" : `all regions in ${selectedCountryName || "the country"}`}.</span>
                  </div>
                </motion.div>
              ) : (
                /* INLINE ORDER FORM (Replaces the paybox smoothly when clicking 'Buy Now (Express Checkout)') */
                <motion.div
                  key="bottom-order-form-card"
                  id="bottom-inline-order-form"
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full text-left"
                >
                  {renderOrderFormCard(() => setIsBottomInlineCheckoutOpen(false), true)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}

      {/* Express Checkout Full Page for Buyer Information (Triggered by Buy Now button) */}
      <AnimatePresence>
        {isExpressCheckoutOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-[#F6F2F4] dark:bg-slate-950 overflow-y-auto w-full min-h-screen transition-colors duration-300"
          >
            {renderOrderFormCard(() => setIsExpressCheckoutOpen(false), false, true)}
          </motion.div>
        )}
      </AnimatePresence>

          {/* PRODUCT BUNDLE SHOWCASE (Visual Bundle items) */}
          {selectedProduct.isBundle && selectedProduct.bundleItems && selectedProduct.bundleItems.length > 0 && (
            <div className="mt-12 p-6 sm:p-8 rounded-3xl border border-dashed border-amber-300 bg-amber-50/15 dark:bg-amber-950/10 space-y-6 text-left animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-4 h-4 fill-amber-500/10" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight font-serif">
                    Boutique Custom Bundle Pack
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                    Hand-picked collections curated for perfect harmony and exceptional value.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(selectedProduct.bundleItems || []).map((item: any, idx: number) => (
                  <div key={item.id ? `bundle-${item.id}-${idx}` : `bundle-idx-${idx}`} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-3xs hover:border-amber-300/40 transition-all duration-300 animate-fadeIn">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/5 flex items-center justify-center text-amber-600 dark:text-amber-400 font-extrabold text-xs font-mono shrink-0">
                      x{item.quantity}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono font-bold">Included in set</p>
                    </div>
                    {item.price && (
                      <span className="text-xs font-bold text-slate-500 font-mono line-through pr-1">
                        {item.price} DA
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-150 dark:border-slate-800 flex-wrap gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider font-mono">Special Bundle Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black font-display text-amber-600 dark:text-amber-400">
                      {(selectedProduct.bundlePrice || selectedProduct.price).toLocaleString()} DA
                    </span>
                    {selectedProduct.price > (selectedProduct.bundlePrice || selectedProduct.price) && (
                      <span className="text-xs font-bold text-slate-400 line-through font-mono">
                        {selectedProduct.price.toLocaleString()} DA
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-amber-100/40 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider font-mono border border-amber-200/25">
                  Save with this Pack ✨
                </div>
              </div>
            </div>
          )}

          {/* 4. Discover More Products Section (Store Products Carousel style) */}
          {isSimilarProductsEnabled && combinedDiscoverEntries.length > 0 && (
            <div
              id="similar-products-section"
              className="mt-5 space-y-2.5 text-left font-sans w-full"
            >
              {/* Ornate Ornamental Divider matching the review section above */}
              <OrnateOrnamentDivider className="my-2.5" accentColor={activeThemeColor || "#4a0a26"} />

              <div className="flex items-center justify-between gap-4 px-1">
                <h3 className="text-sm sm:text-base font-extrabold text-black dark:text-slate-100 tracking-tight">
                  Discover More Products
                </h3>

                {onOpenStoreProfile && (
                  <button
                    type="button"
                    onClick={onOpenStoreProfile}
                    className="text-xs font-bold text-black dark:text-slate-200 hover:underline transition-all cursor-pointer shrink-0"
                  >
                    See all
                  </button>
                )}
              </div>

              {/* Exact Store Products Carousel Container (Expanded 20%) */}
              <div 
                className="flex items-center bg-transparent transition-all w-full animate-fadeIn relative px-0.5 py-1 overflow-hidden h-[240px]"
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => setIsSimilarMouseOver(true)}
                onMouseLeave={() => {
                  setIsSimilarMouseOver(false);
                  setSimilarHoveredIndex(null);
                }}
                onTouchStart={() => setIsSimilarMouseOver(true)}
              >
                {/* Left Scroll Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollSimilar("left");
                  }}
                  className={`absolute left-0.5 sm:-left-[14px] top-1/2 -translate-y-1/2 z-20 w-8.5 h-8.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none dark:!text-white ${
                    canScrollSimilarLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none scale-90"
                  }`}
                  style={{ color: activeThemeColor || "#1b4332" }}
                  aria-label="Scroll Left"
                >
                  <ChevronsLeft className="w-4.5 h-4.5 stroke-[2.5]" />
                </button>

                {/* Decorative vertical brand/header color banner on the left */}
                <div 
                  className="h-[210px] rounded-r-md rounded-l-sm shrink-0 transition-all duration-300 p-0 overflow-hidden"
                  style={{ 
                    backgroundColor: activeThemeColor || "#1b4332", 
                    opacity: canScrollSimilarLeft ? 0 : 1.0,
                    width: canScrollSimilarLeft ? "0px" : "6px",
                    marginRight: canScrollSimilarLeft ? "0px" : "6px",
                    marginLeft: "0px"
                  }}
                />

                {/* Horizontal scroll container */}
                <div 
                  ref={similarCarouselRef}
                  id="similar-products-grid"
                  onMouseDown={handleSimilarMouseDown}
                  onMouseLeave={handleSimilarMouseLeave}
                  onMouseUp={handleSimilarMouseUp}
                  onMouseMove={handleSimilarMouseMove}
                  className="flex gap-3 overflow-x-auto w-full py-2 pr-1 scrollbar-none snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
                  style={{ 
                    scrollbarWidth: "none", 
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch"
                  }}
                >
                  {combinedDiscoverEntries.map((entry, index) => {
                    const prod = entry.product;
                    const partnerPick = entry.partnerPick;
                    let scale = 1;
                    let zIndex = 10;
                    const isFocused = false;

                    if (isSimilarMouseOver) {
                      const isHovered = similarHoveredIndex === index;
                      if (isHovered) {
                        scale = 1.03;
                        zIndex = 50;
                      }
                    }

                    const isHovered = similarHoveredIndex === index;

                    return (
                      <motion.div
                        key={prod.id ? `sim-${prod.id}-${index}` : `sim-idx-${index}`}
                        data-partner-pick={partnerPick ? "true" : undefined}
                        data-partner-source-store={partnerPick?.sourceStore.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSimilarDragging.current) return;
                          const modalRoot = document.getElementById("product-preview-modal-root");
                          if (modalRoot) {
                            modalRoot.scrollTop = 0;
                          }
                          window.scrollTo(0, 0);
                          if (partnerPick && onOpenPartnerPickDiscoverItem) {
                            onOpenPartnerPickDiscoverItem({
                              product: prod,
                              sourceStore: partnerPick.sourceStore,
                              placementId: partnerPick.placementId,
                              partnershipId: partnerPick.partnershipId,
                            });
                            return;
                          }
                          if (onSelectProduct) onSelectProduct(prod);
                        }}
                        onMouseEnter={() => setSimilarHoveredIndex(index)}
                        onMouseLeave={() => setSimilarHoveredIndex(null)}
                        initial={{ opacity: 1, y: 0, scale: 1 }}
                        whileInView={{ opacity: 1, y: 0, scale: scale }}
                        viewport={{ once: true, margin: "-20px" }}
                        transition={{ 
                          duration: 0.2, 
                          ease: "easeOut" 
                        }}
                        className={`flex-none snap-start h-[210px] ml-0 pl-0 pr-0 pt-0 rounded-xl overflow-hidden border bg-white dark:bg-slate-900 transition-all duration-200 ease-out relative flex flex-col justify-between group cursor-pointer pb-2 select-none ${
                          partnerPick
                            ? "border-emerald-500/60 dark:!border-emerald-500/50 ring-1 ring-emerald-500/20"
                            : "border-slate-200 dark:!border-slate-800"
                        }`}
                        style={{
                          width: "calc((100% - 40px) / 5.2)",
                          minWidth: "140px",
                          maxWidth: "160px",
                          zIndex: zIndex,
                          boxShadow: isHovered || isFocused 
                            ? "0 12px 24px rgba(0,0,0,0.12)" 
                            : "0 2px 8px rgba(0,0,0,0.04)",
                          borderColor: partnerPick
                            ? "#10b981"
                            : isHovered || isFocused
                            ? "#cbd5e1"
                            : "#e2e8f0"
                        }}
                        title={partnerPick ? `${prod.name} • Partner Pick from ${partnerPick.sourceStore.name}` : prod.name}
                      >
                        {/* Top: Image Aspect Box */}
                        <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 relative shrink-0 select-none pointer-events-none">
                          <img
                            src={getOptimizedImageUrl(
                              (prod as any).image || prod.images?.[0] || prod.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
                              false
                            )}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover pointer-events-none select-none"
                          />
                          {partnerPick ? (
                            <span className="absolute top-1 left-1 right-1 bg-emerald-600/95 backdrop-blur-xs text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-xs truncate">
                              Partner Pick • {partnerPick.sourceStore.name}
                            </span>
                          ) : (prod as any).oldPrice && (prod as any).oldPrice > prod.price ? (
                            <span className="absolute top-1 left-1 bg-slate-900 text-white text-[8.5px] font-bold px-1.5 py-0.3 rounded-full shadow-2xs">
                              -{Math.round((((prod as any).oldPrice - prod.price) / (prod as any).oldPrice) * 100)}%
                            </span>
                          ) : null}
                        </div>

                        {/* Bottom info section */}
                        <div className="px-2 flex flex-col gap-1 text-left flex-1 justify-between font-sans">
                          {/* Title & rating row */}
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <h5 className="text-[11.5px] font-extrabold text-black dark:text-slate-100 line-clamp-1 flex-1 leading-tight">
                                {prod.name}
                              </h5>
                              <div className="flex items-center gap-0.5 text-[10px] font-extrabold text-black dark:text-slate-200 shrink-0">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span className="text-black dark:text-slate-200 font-extrabold">{(prod.rating || 4.8).toFixed(1)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Price & Cart row */}
                          <div className="text-[11.5px] text-black dark:text-white leading-none flex items-center justify-between mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <div>
                              <span className="font-extrabold text-black dark:text-white text-[11.5px]">
                                {formatStorePrice(prod.price, activeCountry)}
                              </span>
                            </div>

                            {/* Quick cart button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSimilarDragging.current) return;
                                if (partnerPick && handleAddToCart) {
                                  handleAddToCart(prod, partnerPick.sourceStore, 1);
                                  return;
                                }
                                if (handleAddToCart && selectedStore) {
                                  handleAddToCartWithGuestCheck(prod);
                                }
                              }}
                              className="w-4.5 h-4.5 rounded-full bg-slate-900 dark:bg-slate-800 dark:ring-1 dark:ring-white/20 text-white dark:text-white flex items-center justify-center hover:bg-emerald-600 dark:hover:bg-emerald-600 transition-colors shadow-2xs cursor-pointer"
                              title="Add to Cart"
                            >
                              <ShoppingBag className="w-2 h-2" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Right Scroll Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollSimilar("right");
                  }}
                  className={`absolute right-0.5 sm:-right-[14px] top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none ${
                    canScrollSimilarRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none scale-90"
                  }`}
                  style={{ color: activeThemeColor || "#1b4332" }}
                  aria-label="Scroll Right"
                >
                  <ChevronsRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* Product Story section is rendered above Customer Reviews */}

          {/* A+ BRAND STORY & PRODUCT EXPERIENCE SHOWCASE (Hidden per user request) */}
          {selectedProduct.advancedLandingPageEnabled && selectedProduct.uploadedLandingPageContent && selectedProduct.uploadedLandingPageContent.trim() !== "" && (
            <div 
              id="why-product-is-amazing" 
              className="hidden mt-16 pt-12 border-t-2 border-slate-100 space-y-12 text-left"
            >
            {selectedProduct.uploadedLandingPageContent ? (
              <div 
                className="custom-uploaded-landing-content w-full overflow-hidden text-slate-700 leading-relaxed font-sans"
                style={{ contain: "content" }}
                dangerouslySetInnerHTML={{ __html: selectedProduct.uploadedLandingPageContent }}
              />
            ) : (
              <>
                {/* Header / Intro block */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-[10px] font-black tracking-widest text-[#E11D48] bg-rose-50 border border-rose-100 px-3 py-1 rounded-full uppercase">
                🏷️ Product Experience & Spotlight
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-tight leading-tight">
                Designed for Excellence, Built to Stand Apart
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed font-sans max-w-2xl mx-auto">
                Explore a closer look at what makes <strong className="text-slate-800">{selectedProduct.name}</strong> unique. From high-grade raw components to artisan quality-assurance checks, every detail represents maximum value and durability.
              </p>
            </div>

            {/* Premium Dynamic Feature Navigation Tabs */}
            <div className="flex justify-center border-b border-slate-100 pb-px">
              <div className="flex gap-2 sm:gap-4 scrollbar-none overflow-x-auto">
                {[
                  { id: "features", label: "Core Highlights", icon: "✨" },
                  { id: "whyus", label: "Comparison & Value", icon: "📊" },
                  { id: "craftsmanship", label: "Heritage / Standards", icon: "💎" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveLandingSectionTab(tab.id as any)}
                    className={`pb-3.5 px-4 font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all relative whitespace-nowrap cursor-pointer focus:outline-none ${
                      activeLandingSectionTab === tab.id
                        ? "text-[#E11D48]"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {activeLandingSectionTab === tab.id && (
                      <div className="absolute left-0 right-0 bottom-0 h-0.75 bg-[#E11D48] rounded-t-full animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB CONTENT: 1. Core Highlights */}
            {activeLandingSectionTab === "features" && (
              <div className="space-y-8">
                {/* 3x1 Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {selectedProduct.category === "Electronics" ? (
                    <>
                      {/* Feature 1 */}
                      <div className="bg-[#FAF9F5] hover:bg-[#F5F3EC] p-6 rounded-2xl border border-stone-200/50 transition-all shadow-3xs flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center text-lg shadow-sm font-sans">
                            ⚡
                          </div>
                          <h4 className="font-extrabold text-[#3E382F] text-[12.5px] uppercase tracking-wide font-sans">
                            High-Efficiency Performance Core
                          </h4>
                          <p className="text-[11.5px] text-[#6E6454] leading-relaxed">
                            Powered by a multi-core processor tuned for maximum battery conservation. Runs tasks silently and refreshes seamlessly under high continuous load.
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 mt-4 block uppercase tracking-wider">⚡ 2x Speed Enhancement</span>
                      </div>

                      {/* Feature 2 */}
                      <div className="bg-[#FAF9F5] hover:bg-[#F5F3EC] p-6 rounded-2xl border border-stone-200/50 transition-all shadow-3xs flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center text-lg shadow-sm font-sans">
                            📱
                          </div>
                          <h4 className="font-extrabold text-[#3E382F] text-[12.5px] uppercase tracking-wide font-sans">
                            Amoled High-Contrast Display
                          </h4>
                          <p className="text-[11.5px] text-[#6E6454] leading-relaxed">
                            Always-on display that remains perfectly legible even under direct Mediterranean sunlight. Low power consumption allows you to glance at notifications effortlessly.
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 mt-4 block uppercase tracking-wider">👁️ Eye-Care Protection</span>
                      </div>

                      {/* Feature 3 */}
                      <div className="bg-[#FAF9F5] hover:bg-[#F5F3EC] p-6 rounded-2xl border border-stone-200/50 transition-all shadow-3xs flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center text-lg shadow-sm font-sans">
                            🔋
                          </div>
                          <h4 className="font-extrabold text-[#3E382F] text-[12.5px] uppercase tracking-wide font-sans">
                            Intelligent Power Regulation
                          </h4>
                          <p className="text-[11.5px] text-[#6E6454] leading-relaxed">
                            Equipped with a high-capacity 5000 mAh quick battery and 33W Fast-Charge logic. Recovers 50% battery in just 20 minutes under optimized conditions.
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 mt-4 block uppercase tracking-wider">🔋 5 Days Standby Limit</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* For Non-Electronics (Rug, Crafts, Dress etc.) */}
                      <div className="bg-[#FAF9F5] hover:bg-[#F5F3EC] p-6 rounded-2xl border border-stone-200/50 transition-all shadow-3xs flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center text-lg shadow-sm font-sans">
                            🐑
                          </div>
                          <h4 className="font-extrabold text-[#3E382F] text-[12.5px] uppercase tracking-wide font-sans">
                            100% Organic Raw Materials
                          </h4>
                          <p className="text-[11.5px] text-[#6E6454] leading-relaxed">
                            Meticulously hand-spun mountain wool, natural flax linen, or premium metals sourced locally. Free from synthetic chemicals, preserving natural skin breathing.
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 mt-4 block uppercase tracking-wider">🌿 Chemical-Free Dyeing</span>
                      </div>

                      {/* Feature 2 */}
                      <div className="bg-[#FAF9F5] hover:bg-[#F5F3EC] p-6 rounded-2xl border border-stone-200/50 transition-all shadow-3xs flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="w-10 h-10 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center text-lg shadow-sm font-sans">
                            ⏳
                          </div>
                          <h4 className="font-extrabold text-[#3E382F] text-[12.5px] uppercase tracking-wide font-sans">
                            Generational Craftsmanship
                          </h4>
                          <p className="text-[11.5px] text-[#6E6454] leading-relaxed">
                            Crafted by seasoned master craftsmen with years of passed-down family techniques. Each pattern tells a story of custom wool combing and ancestral knotting.
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-rose-600 mt-4 block uppercase tracking-wider">👐 100% Artisan Handcrafted</span>
                      </div>

                      {/* Feature 3 */}
                      <div className="bg-[#FAF9F5] hover:bg-[#F5F3EC] p-6 rounded-2xl border border-stone-200/50 transition-all shadow-3xs flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center text-lg shadow-sm font-sans">
                            📦
                          </div>
                          <h4 className="font-extrabold text-[#3E382F] text-[12.5px] uppercase tracking-wide font-sans">
                            Physical Authenticity Guard
                          </h4>
                          <p className="text-[11.5px] text-[#6E6454] leading-relaxed">
                            Shipped directly from regional workshops of Ath Yenni / Ghardaia. Protected by solid double-layer shockproof box packing to guarantee pristine delivery across 58 Wilayas.
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 mt-4 block uppercase tracking-wider">🛡️ 100% Genuine Protection</span>
                      </div>
                    </>
                  )}
                </div>

                {/* A+ Banner Block */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white min-h-[180px] p-8 flex flex-col justify-center text-left">
                  <div className="absolute right-0 bottom-0 opacity-15 max-w-[320px] pointer-events-none">
                    <svg viewBox="0 0 100 100" className="w-64 h-64 fill-current text-white">
                      <circle cx="50" cy="50" r="40" />
                    </svg>
                  </div>
                  <div className="max-w-2xl space-y-3 relative z-10">
                    <span className="text-[9px] font-black tracking-widest text-[#FFF] bg-emerald-600 px-2.5 py-1 rounded">
                      🛠️ PREMIUM BRAND STANDARDS
                    </span>
                    <h3 className="text-base sm:text-lg font-serif font-black tracking-tight text-white capitalize leading-tight">
                      Why {selectedProduct.name} is built to stand apart
                    </h3>
                    <p className="text-[11.5px] text-slate-350 leading-relaxed font-sans font-medium">
                      Commercial assembly lines prioritize rapid chemical replication. We prioritize longevity. Every single {selectedProduct.name} undergoes double-stage physical inspections, verification ticks, and strict material tracing before it enters Yalidine couriers. Discover luxury that feels organic.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. Side-by-side comparison table */}
            {activeLandingSectionTab === "whyus" && (
              <div className="space-y-6">
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 text-left">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-2">
                    How We Compare to Traditional Alternatives
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-4">
                    Before investing in copycat replicas, check how our quality holds against commercial alternatives.
                  </p>

                  <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-3xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-100/80 border-b border-stone-200">
                          <th className="p-3.5 font-extrabold text-slate-700 w-2/5">Feature Category</th>
                          <th className="p-3.5 font-black text-[#E11D48] bg-rose-500/5 border-x border-stone-200 text-center w-1/3">Our Premium Standard</th>
                          <th className="p-3.5 font-bold text-slate-500 text-center">Cheap Mass Mimics ❌</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b last:border-0 border-stone-150">
                          <td className="p-3.5 font-bold text-slate-700">Raw Material Certification</td>
                          <td className="p-3.5 text-center text-emerald-600 bg-rose-500/5 border-x border-stone-200 font-extrabold">✓ 100% Hand-inspected / pure materials</td>
                          <td className="p-3.5 text-center text-[#E11D48] font-medium">✗ Synthetic fibers or raw alloys</td>
                        </tr>
                        <tr className="border-b last:border-0 border-stone-150">
                          <td className="p-3.5 font-bold text-slate-700">Fair Trade & Compensation</td>
                          <td className="p-3.5 text-center text-emerald-600 bg-rose-500/5 border-x border-stone-200 font-extrabold">✓ Direct pay to regional Algerian workshops</td>
                          <td className="p-3.5 text-center text-[#E11D48] font-medium">✗ Exploitative sweatshop channels</td>
                        </tr>
                        <tr className="border-b last:border-0 border-stone-150">
                          <td className="p-3.5 font-bold text-slate-700">Local Delivery Security</td>
                          <td className="p-3.5 text-center text-emerald-600 bg-rose-500/5 border-x border-stone-200 font-extrabold">✓ Yalidine secure home delivery with CoD option</td>
                          <td className="p-3.5 text-center text-[#E11D48] font-medium">✗ Lost boxes or generic logistics delay</td>
                        </tr>
                        <tr className="border-b last:border-0 border-stone-150">
                          <td className="p-3.5 font-bold text-slate-700 font-sans">Sturdiness & Lifespan</td>
                          <td className="p-3.5 text-center text-emerald-600 bg-rose-500/5 border-x border-stone-200 font-extrabold">✓ Built for generations / continuous load</td>
                          <td className="p-3.5 text-center text-[#E11D48] font-medium">✗ Wears down after 3-6 months</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. Heritage / Standards */}
            {activeLandingSectionTab === "craftsmanship" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Left block of description */}
                  <div className="space-y-4 text-left">
                    <div className="flex items-center gap-2">
                      <span className="p-1 px-1.5 bg-rose-50 text-[#E11D48] text-xs font-black rounded uppercase">
                        Our Pledge
                      </span>
                      <span className="text-xs font-bold text-slate-400">Algerian Regional Guild Verified</span>
                    </div>

                    <h3 className="text-lg font-serif font-black text-slate-900 leading-snug">
                      Preserving ancestral techniques, delivering maximum modern reliability
                    </h3>

                    <p className="text-[11.5px] text-slate-500 leading-relaxed font-sans">
                      Our artisans or quality-testing teams ensure each {selectedProduct.name} carries the soul of true commitment. Cheap alternatives use computer loops to churn thousands of raw duplicates daily, flooding the market. By choosing {selectedStore.name}, you directly sponsor Algerian craftsmanship while receiving a premium product engineered to last decades.
                    </p>

                    <ul className="space-y-3 pt-2 text-[11.5px] font-bold text-slate-700">
                      <li className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 text-xs flex items-center justify-center font-black">✓</span>
                        Double-waxed or reinforced edges & surfaces
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 text-xs flex items-center justify-center font-black">✓</span>
                        Individually cataloged and traced with unique serial identifiers
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 text-xs flex items-center justify-center font-black">✓</span>
                        Clean, recyclable packaging that minimizes local trace footprints
                      </li>
                    </ul>
                  </div>

                  {/* Right block: illustrative card */}
                  <div className="bg-stone-50 border border-stone-200/80 p-6 rounded-2xl space-y-4 text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase block font-mono">
                      Verification of Status Checked
                    </span>

                    <div className="p-4 bg-white border border-stone-200/50 rounded-xl space-y-3.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">Origin Verification:</span>
                        <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                          🟢 100% Certified Origin
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">Material Trace Limit:</span>
                        <span className="text-[#3E382F] font-black uppercase tracking-wide bg-stone-100 px-2 py-0.5 rounded text-[10px]">
                          Premium Grade
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">CoD Shipping Option:</span>
                        <span className="text-slate-700 font-extrabold">
                          Yalidine Delivery Secure
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center gap-3 text-[10.5px] text-rose-905 leading-normal">
                      <span className="text-xl shrink-0">🤝</span>
                      <p>
                        Your funds are secured in local escrow until your product arrives at your door and you verify its stellar quality physically. Zero payment risk.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}
              </>
            )}

          </div>
          )}

          {/* Recently Viewed Section hidden as requested */}

        </div>
      </main>

      {/* Product Page Footer – Shop.app Design with Page-to-Button Gradient */}
      <YumeShopFooter
        currentSlideColor={currentSlideColor}
        buttonColor={themeAccentColor || activeThemeColor || currentSlideColor}
        storeName={selectedStore.name}
        storeWilaya={selectedStore.wilaya}
        onOpenStoreProfile={onOpenStoreProfile || onClose}
        onOpenTerms={() => setIsTermsModalOpen(true)}
        scrollContainerId="product-preview-modal-root"
      />

      {/* Product Video Pop-up Modal */}
      {isVideoOpen && (() => {
        const activeUrl = activeVideoUrl || productVideoList[0] || selectedProduct.videoUrl || "";
        const currentVideoInfo = getVideoEmbedResult(activeUrl);

        return (
          <div 
            className="fixed inset-0 z-[100] bg-white/85 backdrop-blur-3xl flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 animate-fade-in"
          >
            {/* Wrapper element to anchor the close button relative to the video container, but outside of its overflow-hidden boundary */}
            <div 
              className="relative w-full max-w-4xl animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Elegant Close Button Placed Directly Above the Top-Right Corner of the Video Card */}
              <button
                type="button"
                id="modal-close-button"
                onClick={() => setIsVideoOpen(false)}
                className="absolute -top-12 md:-top-14 -right-1 sm:-right-2 md:-right-10 z-[110] p-2.5 rounded-full bg-white hover:bg-neutral-100 text-stone-800 hover:text-stone-950 border border-stone-200/60 shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
                style={{ marginRight: '-20px' }}
                title="Close Video"
              >
                <X className="w-4 h-4 md:w-5 md:h-5 text-stone-800" />
              </button>

              {/* Ultra minimal video container card */}
              <div 
                className="bg-black rounded-2xl md:rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.12)] overflow-hidden w-full aspect-video relative border border-stone-200/40"
              >
                {currentVideoInfo.type === "direct" ? (
                  <video
                    ref={videoRef}
                    src={currentVideoInfo.embedUrl}
                    autoPlay={isAutoPlay}
                    playsInline
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 overflow-hidden">
                    <iframe
                      id="youtube-player-iframe"
                      src={`${currentVideoInfo.embedUrl}`}
                      title="Product Video Showcase"
                      className="absolute top-1/2 left-1/2 w-[116%] h-[116%] -translate-x-1/2 -translate-y-1/2 border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Elegant Custom White/Blurry Play Button Overlay that covers YouTube's central red logo */}
                {!isPlaying && (
                  <div 
                    onClick={() => {
                      if (currentVideoInfo.type === "youtube" && playerRef.current) {
                        try {
                          playerRef.current.playVideo();
                          setIsPlaying(true);
                        } catch (err) {}
                      } else if (currentVideoInfo.type === "direct" && videoRef.current) {
                        try {
                          videoRef.current.play();
                          setIsPlaying(true);
                        } catch (err) {}
                      }
                    }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[4px] cursor-pointer group/centerplay transition-all duration-500"
                  >
                    <div className="w-18 h-18 md:w-22 md:h-22 rounded-full bg-white text-stone-950 border border-white/40 flex items-center justify-center shadow-[0_15px_40px_rgba(255,255,255,0.2)] transition-all duration-300 transform group-hover/centerplay:scale-110 group-hover/centerplay:bg-neutral-100 group-hover/centerplay:shadow-[0_20px_50px_rgba(255,255,255,0.35)] relative overflow-hidden">
                      {/* Sheen reflection shimmer on hover */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover/centerplay:translate-x-full transition-transform duration-1000 ease-out" />
                      <Play className="w-7 h-7 md:w-9 md:h-9 text-stone-950 fill-stone-950 translate-x-0.5" />
                    </div>
                  </div>
                )}

                {/* Pinned Elegantly Slim Glassmorphic Progress Control Bar */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-11 bg-black/75 backdrop-blur-md border-t border-stone-700/30 flex items-center px-4 gap-3 z-[105] select-none text-white overflow-hidden transition-opacity"
                >
                  {/* Play / Pause Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (currentVideoInfo.type === "youtube" && playerRef.current) {
                        try {
                          const state = playerRef.current.getPlayerState();
                          if (state === 1) { // playing
                            playerRef.current.pauseVideo();
                            setIsPlaying(false);
                          } else {
                            playerRef.current.playVideo();
                            setIsPlaying(true);
                          }
                        } catch (e) {}
                      } else if (currentVideoInfo.type === "direct" && videoRef.current) {
                        if (videoRef.current.paused) {
                          videoRef.current.play();
                          setIsPlaying(true);
                        } else {
                          videoRef.current.pause();
                          setIsPlaying(false);
                        }
                      }
                    }}
                    className="p-1 px-1.5 text-stone-300 hover:text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                  </button>

                  {/* Timeline time text label */}
                  <span className="text-[10px] font-mono text-stone-400 select-none shrink-0 tracking-wider">
                    {(() => {
                      const formatTime = (secs: number) => {
                        if (isNaN(secs) || secs < 0) return "0:00";
                        const m = Math.floor(secs / 60);
                        const s = Math.floor(secs % 60);
                        return `${m}:${s < 10 ? "0" : ""}${s}`;
                      };
                      return `${formatTime(currentTime)} / ${formatTime(duration)}`;
                    })()}
                  </span>

                  {/* Slim timelines progress bar interactive range slider */}
                  <div className="flex-1 relative flex items-center h-full group/bar">
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.1}
                      value={currentTime}
                      onMouseDown={() => setIsSeeking(true)}
                      onTouchStart={() => setIsSeeking(true)}
                      onMouseUp={(e: any) => {
                        setIsSeeking(false);
                        const targetVal = parseFloat(e.target.value);
                        if (currentVideoInfo.type === "youtube" && playerRef.current) {
                          try {
                            playerRef.current.seekTo(targetVal, true);
                          } catch (err) {}
                        } else if (currentVideoInfo.type === "direct" && videoRef.current) {
                          videoRef.current.currentTime = targetVal;
                        }
                      }}
                      onTouchEnd={(e: any) => {
                        setIsSeeking(false);
                        const targetVal = parseFloat(e.target.value);
                        if (currentVideoInfo.type === "youtube" && playerRef.current) {
                          try {
                            playerRef.current.seekTo(targetVal, true);
                          } catch (err) {}
                        } else if (currentVideoInfo.type === "direct" && videoRef.current) {
                          videoRef.current.currentTime = targetVal;
                        }
                      }}
                      onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                      className="w-full h-1 bg-stone-700/60 rounded-full appearance-none cursor-pointer outline-none transition-all accent-[#e47911] group-hover/bar:h-1.5"
                      style={{
                        background: `linear-gradient(to right, #e47911 0%, #e47911 ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(82, 82, 91, 0.6) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(82, 82, 91, 0.6) 100%)`
                      }}
                    />
                  </div>

                  {/* Volume Slider UI component */}
                  <div className="flex items-center gap-1.5 ml-2 border-l border-zinc-800/80 pl-3.5 shrink-0 group/volume">
                    <button
                      type="button"
                      onClick={() => {
                        if (volume > 0) {
                          setPrevVolume(volume);
                          handleVolumeChange(0);
                        } else {
                          handleVolumeChange(prevVolume > 0 ? prevVolume : 80);
                        }
                      }}
                      className="p-1 text-stone-400 hover:text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                      title={volume === 0 ? "Unmute" : "Mute"}
                    >
                      {volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-stone-500" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-stone-300 group-hover/volume:text-white" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                      className="w-14 sm:w-16 md:w-20 h-1 bg-stone-700/60 rounded-full appearance-none cursor-pointer outline-none transition-all accent-[#e47911] group-hover/volume:h-1.5"
                      style={{
                        background: `linear-gradient(to right, #e47911 0%, #e47911 ${volume}%, rgba(82, 82, 91, 0.6) ${volume}%, rgba(82, 82, 91, 0.6) 100%)`
                      }}
                    />
                  </div>

                  {/* Autoplay setting switcher */}
                  <div className="flex items-center gap-1.5 ml-2 border-l border-zinc-800/80 pl-3.5 shrink-0">
                    <span className="text-[10px] text-stone-400 font-bold tracking-tight font-sans">AUTOPLAY</span>
                    <button
                      type="button"
                      onClick={() => handleToggleAutoPlay(!isAutoPlay)}
                      className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        isAutoPlay ? "bg-[#e47911]" : "bg-stone-700"
                      }`}
                      title={isAutoPlay ? "Disable auto-play for next visits" : "Enable auto-play for next visits"}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-[1px] ${
                          isAutoPlay ? "translate-x-3" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Redesigned Thank You Page / Order Confirmation - Full Page */}
      <AnimatePresence>
        {isThankYouOpen && placedOrderInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-[#F4EFF2] overflow-y-auto w-full min-h-screen"
          >
            {(() => {
              const headerAccent = currentSlideColor || activeThemeColor || "#4A0E2E";
              const dialCodeStr = currentCountryObj?.phonecode?.replace(/\D/g, "") || "213";
              const rawPhone = placedOrderInfo.buyer?.phone || buyerPhone || "";
              const formattedPhone = formatPhoneForDisplay(rawPhone) || rawPhone;
              const displayPhoneWithCode = formattedPhone.startsWith("+")
                ? formattedPhone
                : `+${dialCodeStr} ${formattedPhone}`;
              const variantText = [placedOrderInfo.color, placedOrderInfo.size]
                .filter(Boolean)
                .join(" / ") || "Standard";

              const storeDisplayName = selectedStore?.name || "YUME";
              const handleAccessStore = (e?: React.MouseEvent) => {
                if (e) e.preventDefault();
                setIsThankYouOpen(false);
                if (onOpenStoreProfile) {
                  onOpenStoreProfile();
                } else {
                  onClose();
                }
              };

              return (
                <div
                  className="relative w-full min-h-screen flex flex-col justify-start"
                  style={{ backgroundColor: "#F4EFF2" }}
                >
                  {/* Decorative Background Curved Corner Waves matching exact design in screenshots */}
                  <CheckoutPageBackground accentColor={headerAccent} isFixed={true} />

                  {/* Full Page Content Wrapper */}
                  <div className="relative z-10 w-full max-w-[840px] mx-auto px-4 sm:px-8 py-6 sm:py-8 flex-1 flex flex-col">

                    {/* Main White Card */}
                    <div className="bg-white rounded-[24px] sm:rounded-[28px] shadow-[0_15px_45px_rgba(74,14,46,0.05),0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/60 p-6 sm:p-8 text-left space-y-5">
                      {/* Centered Pale Green Checkmark with Scattered Confetti */}
                      <div className="text-center space-y-2.5">
                        <div className="relative w-28 h-20 mx-auto flex items-center justify-center">
                          {/* Celebratory ripple glow during 30s party animation */}
                          {isPartyAnimationActive && (
                            <motion.div
                              initial={{ scale: 0.85, opacity: 0.5 }}
                              animate={{
                                scale: [0.85, 1.38, 0.85],
                                opacity: [0.45, 0, 0.45],
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              className="absolute w-16 h-16 rounded-full bg-[#34D399]/25 pointer-events-none select-none"
                            />
                          )}

                          {/* Animated Confetti specks matching screenshot with 30s continuous party motion */}
                          <motion.span
                            initial={{ scale: 0, x: 10, y: 14, opacity: 0 }}
                            animate={
                              isPartyAnimationActive
                                ? {
                                    scale: [0, 1.35, 0.9, 1.25, 1],
                                    x: [10, -4, 2, -3, 0],
                                    y: [14, -5, 2, -3, 0],
                                    opacity: [0, 1, 1, 1, 1],
                                    rotate: [-45, -68, -32, -58, -45],
                                  }
                                : { scale: 1, x: 0, y: 0, opacity: 1, rotate: -45 }
                            }
                            transition={
                              isPartyAnimationActive
                                ? {
                                    duration: 1.25,
                                    repeat: Infinity,
                                    repeatDelay: 0.15,
                                    ease: "easeInOut",
                                  }
                                : { duration: 0.4, ease: "easeOut" }
                            }
                            className="absolute top-1 left-5 w-1.5 h-3 bg-[#34D399] rounded-[1px] select-none"
                          />
                          <motion.span
                            initial={{ scale: 0, x: 10, y: 8, opacity: 0 }}
                            animate={
                              isPartyAnimationActive
                                ? {
                                    scale: [0, 1.35, 0.9, 1.25, 1],
                                    x: [10, -5, 2, -3, 0],
                                    y: [8, -4, 2, -2, 0],
                                    opacity: [0, 1, 1, 1, 1],
                                    rotate: [12, 34, -4, 24, 12],
                                  }
                                : { scale: 1, x: 0, y: 0, opacity: 1, rotate: 12 }
                            }
                            transition={
                              isPartyAnimationActive
                                ? {
                                    delay: 0.12,
                                    duration: 1.25,
                                    repeat: Infinity,
                                    repeatDelay: 0.15,
                                    ease: "easeInOut",
                                  }
                                : { duration: 0.4, ease: "easeOut" }
                            }
                            className="absolute top-5 left-3 w-3 h-1.5 bg-[#F59E0B] rounded-[1px] select-none"
                          />
                          <motion.span
                            initial={{ scale: 0, x: 10, y: -10, opacity: 0 }}
                            animate={
                              isPartyAnimationActive
                                ? {
                                    scale: [0, 1.45, 0.85, 1.3, 1],
                                    x: [10, -4, 2, -2, 0],
                                    y: [-10, 4, -2, 3, 0],
                                    opacity: [0, 1, 1, 1, 1],
                                  }
                                : { scale: 1, x: 0, y: 0, opacity: 1 }
                            }
                            transition={
                              isPartyAnimationActive
                                ? {
                                    delay: 0.22,
                                    duration: 1.2,
                                    repeat: Infinity,
                                    repeatDelay: 0.15,
                                    ease: "easeInOut",
                                  }
                                : { duration: 0.4, ease: "easeOut" }
                            }
                            className="absolute bottom-2 left-6 w-1.5 h-1.5 bg-[#14B8A6] rounded-full select-none"
                          />

                          <motion.span
                            initial={{ scale: 0, x: -10, y: 14, opacity: 0 }}
                            animate={
                              isPartyAnimationActive
                                ? {
                                    scale: [0, 1.35, 0.9, 1.25, 1],
                                    x: [-10, 4, -2, 3, 0],
                                    y: [14, -5, 2, -3, 0],
                                    opacity: [0, 1, 1, 1, 1],
                                    rotate: [45, 68, 30, 58, 45],
                                  }
                                : { scale: 1, x: 0, y: 0, opacity: 1, rotate: 45 }
                            }
                            transition={
                              isPartyAnimationActive
                                ? {
                                    delay: 0.08,
                                    duration: 1.25,
                                    repeat: Infinity,
                                    repeatDelay: 0.15,
                                    ease: "easeInOut",
                                  }
                                : { duration: 0.4, ease: "easeOut" }
                            }
                            className="absolute top-1 right-6 w-1.5 h-3.5 bg-[#6B21A8] rounded-[1px] select-none"
                          />
                          <motion.span
                            initial={{ scale: 0, x: -10, y: 8, opacity: 0 }}
                            animate={
                              isPartyAnimationActive
                                ? {
                                    scale: [0, 1.35, 0.9, 1.25, 1],
                                    x: [-10, 5, -2, 3, 0],
                                    y: [8, -4, 2, -2, 0],
                                    opacity: [0, 1, 1, 1, 1],
                                    rotate: [-12, -34, 4, -24, -12],
                                  }
                                : { scale: 1, x: 0, y: 0, opacity: 1, rotate: -12 }
                            }
                            transition={
                              isPartyAnimationActive
                                ? {
                                    delay: 0.18,
                                    duration: 1.25,
                                    repeat: Infinity,
                                    repeatDelay: 0.15,
                                    ease: "easeInOut",
                                  }
                                : { duration: 0.4, ease: "easeOut" }
                            }
                            className="absolute top-4 right-3 w-3 h-1.5 bg-[#FB923C] rounded-[1px] select-none"
                          />
                          <motion.span
                            initial={{ scale: 0, x: -10, y: 0, opacity: 0 }}
                            animate={
                              isPartyAnimationActive
                                ? {
                                    scale: [0, 1.45, 0.85, 1.3, 1],
                                    x: [-10, 4, -2, 3, 0],
                                    y: [0, -4, 2, -2, 0],
                                    opacity: [0, 1, 1, 1, 1],
                                    rotate: [0, 45, -25, 20, 0],
                                  }
                                : { scale: 1, x: 0, y: 0, opacity: 1, rotate: 0 }
                            }
                            transition={
                              isPartyAnimationActive
                                ? {
                                    delay: 0.26,
                                    duration: 1.2,
                                    repeat: Infinity,
                                    repeatDelay: 0.15,
                                    ease: "easeInOut",
                                  }
                                : { duration: 0.4, ease: "easeOut" }
                            }
                            className="absolute top-7 right-4 w-1.5 h-1.5 bg-[#FBBF24] rounded-sm select-none"
                          />
                          <motion.span
                            initial={{ scale: 0, x: -10, y: -10, opacity: 0 }}
                            animate={
                              isPartyAnimationActive
                                ? {
                                    scale: [0, 1.45, 0.85, 1.3, 1],
                                    x: [-10, 4, -2, 2, 0],
                                    y: [-10, 4, -2, 3, 0],
                                    opacity: [0, 1, 1, 1, 1],
                                  }
                                : { scale: 1, x: 0, y: 0, opacity: 1 }
                            }
                            transition={
                              isPartyAnimationActive
                                ? {
                                    delay: 0.32,
                                    duration: 1.2,
                                    repeat: Infinity,
                                    repeatDelay: 0.15,
                                    ease: "easeInOut",
                                  }
                                : { duration: 0.4, ease: "easeOut" }
                            }
                            className="absolute bottom-2 right-7 w-1.5 h-1.5 bg-[#F59E0B] rounded-full select-none"
                          />

                          {/* Pale Mint Solid Circle with Dark Green Checkmark - 30s celebration */}
                          <motion.div
                            initial={{ scale: 0, rotate: -16, opacity: 0 }}
                            animate={
                              isPartyAnimationActive
                                ? {
                                    scale: [1, 1.12, 0.96, 1.06, 1],
                                    rotate: [0, 5, -4, 2, 0],
                                    opacity: 1,
                                  }
                                : {
                                    scale: 1,
                                    rotate: 0,
                                    opacity: 1,
                                  }
                            }
                            transition={
                              isPartyAnimationActive
                                ? {
                                    duration: 1.4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }
                                : {
                                    duration: 0.45,
                                    ease: "easeOut",
                                  }
                            }
                            whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
                            className="relative z-10 w-16 h-16 rounded-full bg-[#E4F4EC] flex items-center justify-center shadow-[0_4px_16px_rgba(30,116,74,0.15)] select-none cursor-pointer"
                            title="Order placed successfully!"
                          >
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={
                                isPartyAnimationActive
                                  ? { scale: [1, 1.18, 0.95, 1.08, 1], opacity: 1 }
                                  : { scale: 1, opacity: 1 }
                              }
                              transition={
                                isPartyAnimationActive
                                  ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                                  : { duration: 0.35, ease: "easeOut" }
                              }
                            >
                              <Check className="w-8 h-8 text-[#1E744A] stroke-[3.2]" />
                            </motion.div>
                          </motion.div>
                        </div>

                        <h2
                          className="text-xl sm:text-2xl font-extrabold tracking-tight"
                          style={{ color: headerAccent }}
                        >
                          Your order was placed successfully!
                        </h2>
                        <p className="text-xs sm:text-[13px] text-stone-500 max-w-md mx-auto leading-relaxed">
                          Thank you for shopping with{" "}
                          <button
                            type="button"
                            onClick={handleAccessStore}
                            className="font-bold underline decoration-current underline-offset-2 hover:opacity-80 transition-all cursor-pointer inline bg-transparent p-0 border-0"
                            style={{ color: headerAccent }}
                            title={`Access storefront: ${storeDisplayName}`}
                          >
                            {storeDisplayName}
                          </button>
                          . Your order has been confirmed
                          <br />
                          and is now being processed.
                        </p>
                      </div>

                      {/* Callout Banner with Phone Icon Matching Screenshot */}
                      <div className="rounded-2xl p-3 sm:p-3.5 border border-[#F2DEE7] bg-[#FAF2F6] flex items-center gap-3 sm:gap-3.5 text-left">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F3DCE6] flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4 text-[#5E123D]" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-xs sm:text-[13px] font-bold text-slate-800 leading-snug">
                            We will contact you shortly at the number you provided
                          </div>
                          <div className="text-[11px] sm:text-xs text-stone-500 font-normal leading-normal">
                            to confirm your order and share the delivery details.
                          </div>
                        </div>
                      </div>

                      {/* Order Details Card */}
                      <div className="bg-stone-50/70 border border-stone-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
                        {/* Order Number & Order Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3.5 border-b border-stone-200/80">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0"
                              style={{
                                backgroundColor: hexToRgba(headerAccent, 0.1),
                                color: headerAccent,
                              }}
                            >
                              #
                            </div>
                            <div>
                              <span className="text-[11px] text-stone-500 block">Order Number</span>
                              <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900">
                                {placedOrderInfo.orderId || placedOrderInfo.id}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center sm:justify-end gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: hexToRgba(headerAccent, 0.1),
                                color: headerAccent,
                              }}
                            >
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[11px] text-stone-500 block">Order Date</span>
                              <span className="font-bold text-xs sm:text-sm text-slate-900">
                                {placedOrderInfo.date}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Product Row */}
                        <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-stone-200/80">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-14 h-14 rounded-xl border border-stone-200 bg-white overflow-hidden shrink-0">
                              <img
                                src={
                                  placedOrderInfo.product?.imageUrl ||
                                  placedOrderInfo.product?.images?.[0] ||
                                  selectedProduct.imageUrl ||
                                  selectedProduct.images?.[0] ||
                                  undefined
                                }
                                alt={placedOrderInfo.product?.name || selectedProduct.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                                {placedOrderInfo.product?.name || selectedProduct.name}
                              </h4>
                              <p className="text-[11px] text-stone-500">{variantText}</p>
                              <p className="text-[11px] font-bold text-stone-600">
                                {placedOrderInfo.qty || purchaseQty}{" "}
                                {(placedOrderInfo.qty || purchaseQty) === 1 ? "item" : "items"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Total Paid */}
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-extrabold text-slate-900">Total Paid</span>
                          <span
                            className="text-xl sm:text-2xl font-black font-sans"
                            style={{ color: headerAccent }}
                          >
                            {(placedOrderInfo.grandTotal || placedOrderInfo.totalPrice || calculatedGrandTotal).toLocaleString()} DA
                          </span>
                        </div>
                      </div>

                      {/* Contact Information Card */}
                      <div className="bg-[#f8fafc] border border-slate-200/70 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-slate-900 mt-0.5">
                          <PhoneCall className="w-5 h-5 text-slate-900 stroke-[2.2]" />
                        </div>
                        <div className="space-y-1 text-left">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                            Contact Information
                          </h4>
                          <p className="text-xs sm:text-[13px] text-slate-600">
                            We&apos;ll call you at{" "}
                            <strong className="font-bold text-slate-900">
                              {displayPhoneWithCode}
                            </strong>
                          </p>
                        </div>
                      </div>

                      {/* Join YUME Community Banner Card matching screenshot */}
                      <div
                        className="rounded-2xl p-4 sm:p-5 border border-[#F2E2E8] flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden"
                        style={{
                          backgroundColor: "#FAF2F5",
                        }}
                      >
                        <div className="flex items-start gap-3.5 text-left flex-1 min-w-0">
                          {/* YUME 3-Petal Lotus Brandmark in Deep Burgundy */}
                          <svg
                            viewBox="0 0 38 34"
                            className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 select-none"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M19 1.5 C16 8.5 15.2 18 19 26 C22.8 18 22 8.5 19 1.5 Z"
                              fill="#4A0E2E"
                            />
                            <path
                              d="M16 13 C11 11 5.5 14 4.5 19 C3.5 24 7.5 27 15.5 25.8 C14.2 21.5 14.5 16.5 16 13 Z"
                              fill="#4A0E2E"
                            />
                            <path
                              d="M22 13 C27 11 32.5 14 33.5 19 C34.5 24 30.5 27 22.5 25.8 C23.8 21.5 23.5 16.5 22 13 Z"
                              fill="#4A0E2E"
                            />
                            <ellipse cx="19" cy="27" rx="3.2" ry="1.5" fill="#4A0E2E" />
                          </svg>

                          <div className="space-y-1 flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm md:text-[15px] font-bold text-[#3B0A24] leading-snug whitespace-nowrap">
                              Join YUME and be part of our growing community!
                            </h4>
                            <p className="text-xs text-stone-500 leading-relaxed">
                              Discover more products, follow your favorite stores, get exclusive offers and enjoy a better shopping experience.
                            </p>
                          </div>
                        </div>

                        {/* Smartphone Graphic with Tilted Frame, Flower Logo, Heart & Shopping Bag */}
                        <div className="w-28 h-20 shrink-0 flex items-center justify-center relative select-none">
                          <svg viewBox="0 0 110 82" className="w-full h-full overflow-visible">
                            {/* Decorative pink circle background */}
                            <ellipse cx="58" cy="42" rx="30" ry="28" fill="#FCECF0" opacity="0.6" />

                            {/* Mint-green confetti dash */}
                            <line x1="20" y1="20" x2="26" y2="28" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />

                            {/* Burgundy horizontal dash */}
                            <line x1="8" y1="46" x2="16" y2="46" stroke="#4A0E2E" strokeWidth="2.5" strokeLinecap="round" />

                            {/* Tilted Smartphone */}
                            <g transform="rotate(9 52 42)">
                              {/* Phone outer frame */}
                              <rect x="30" y="8" width="44" height="68" rx="8" fill="#ffffff" stroke="#4A0E2E" strokeWidth="2.2" />
                              {/* Speaker notch */}
                              <rect x="47" y="12" width="10" height="2" rx="1" fill="#4A0E2E" />
                              {/* YUME 3-petal lotus on screen */}
                              <g transform="translate(42, 30) scale(0.52)">
                                <path d="M19 1.5 C16 8.5 15.2 18 19 26 C22.8 18 22 8.5 19 1.5 Z" fill="#4A0E2E" />
                                <path d="M16 13 C11 11 5.5 14 4.5 19 C3.5 24 7.5 27 15.5 25.8 C14.2 21.5 14.5 16.5 16 13 Z" fill="#4A0E2E" />
                                <path d="M22 13 C27 11 32.5 14 33.5 19 C34.5 24 30.5 27 22.5 25.8 C23.8 21.5 23.5 16.5 22 13 Z" fill="#4A0E2E" />
                                <ellipse cx="19" cy="27" rx="3.2" ry="1.5" fill="#4A0E2E" />
                              </g>
                            </g>

                            {/* Heart Speech Bubble - Top Right */}
                            <g transform="translate(78, 12)">
                              <rect x="0" y="0" width="22" height="20" rx="7" fill="#ffffff" stroke="#F0E3E8" strokeWidth="1" filter="drop-shadow(0px 2px 4px rgba(74,14,46,0.08))" />
                              <path
                                d="M11 15 L9.8 13.9 C5.8 10.3 5 8.3 5.7 6.6 C6.3 5.1 7.7 4.5 9 4.5 C10 4.5 10.6 5 11 5.4 C11.4 5 12 4.5 13 4.5 C14.3 4.5 15.7 5.1 16.3 6.6 C17 8.3 16.2 10.3 12.2 13.9 Z"
                                fill="#991B3A"
                              />
                            </g>

                            {/* Shopping Bag Badge - Bottom Right */}
                            <g transform="translate(74, 46)">
                              <rect x="0" y="0" width="22" height="20" rx="6" fill="#4A0E2E" filter="drop-shadow(0px 2px 4px rgba(74,14,46,0.18))" />
                              <path d="M6.5 8 L15.5 8 L16.5 16 L5.5 16 Z" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeLinejoin="round" />
                              <path d="M8.5 8 C8.5 5.8 9.5 4.8 11 4.8 C12.5 4.8 13.5 5.8 13.5 8" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
                            </g>
                          </svg>
                        </div>
                      </div>

                      {/* Bottom Action Buttons: Join YUME Now & Maybe Later */}
                      <div className="space-y-2.5 pt-2 text-center max-w-sm sm:max-w-md mx-auto w-full">
                        <button
                          type="button"
                          onClick={() => {
                            setIsThankYouOpen(false);
                            setPendingGuestAction("close");
                            setIsGuestRegisterOpen(true);
                          }}
                          className="w-full h-12 rounded-full text-white font-bold text-sm shadow-sm hover:brightness-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                          style={{ backgroundColor: headerAccent }}
                        >
                          <UserPlus className="w-4 h-4 text-white stroke-[2.2]" />
                          <span>Join YUME Now</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleThankYouAction("close")}
                          className="w-full h-11 rounded-full bg-white hover:bg-stone-50 font-bold text-sm border-2 transition-all cursor-pointer"
                          style={{ color: headerAccent, borderColor: headerAccent }}
                        >
                          Maybe Later
                        </button>

                        <p className="text-[11.5px] sm:text-xs text-stone-400 pt-0.5">
                          You can always join later from your profile or the menu.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* YUME Network Account Registration Page matching exact design specification */}
      {isGuestRegisterOpen && (
        <YumeAccountRegistrationPage
          initialFullName={placedOrderInfo?.buyer?.name || ""}
          initialEmail={guestRegisterEmail || placedOrderInfo?.buyer?.email || ""}
          initialPhone={placedOrderInfo?.buyer?.phone || ""}
          accentColor={currentSlideColor || activeThemeColor || "#4A0E2E"}
          onBackToHome={handleGuestMaybeLater}
          onSuccess={(user) => {
            const registeredUserObj = {
              name: user.name,
              email: user.email,
              role: user.role === "Merchant" ? ("Merchant" as const) : ("Buyer" as const),
              storeName: user.storeName,
            };
            try {
              localStorage.setItem("yume_current_user", JSON.stringify(registeredUserObj));
              localStorage.setItem("yume_user", JSON.stringify(registeredUserObj));
              window.dispatchEvent(new Event("storage"));
              window.dispatchEvent(new CustomEvent("yume-auth-updated", { detail: registeredUserObj }));
            } catch (err) {
              console.error("Auth sync error:", err);
            }
            setIsGuestRegisterOpen(false);
            if (pendingGuestAction === 'cart' && setIsCartOpen) {
              setIsCartOpen(true);
            }
          }}
        />
      )}

      <ShippingTrackingModal
        order={shopperTrackingOrder}
        isOpen={!!shopperTrackingOrder}
        onClose={() => setShopperTrackingOrder(null)}
      />

      {/* Terms of Service & Return Policy Modal */}
      <AnimatePresence>
        {isTermsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => setIsTermsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden relative flex flex-col my-auto max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/90 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Terms & Store Policies</h3>
                    <p className="text-[10.5px] text-stone-500">
                      Merchant policies for <strong className="text-slate-800">{selectedStore.name}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body - Scrollable Legal Placeholder Text */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs text-stone-600 leading-relaxed">
                {/* Notice Banner */}
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 flex gap-2.5 items-start text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-snug">
                    Please read these terms carefully before confirming your order. Placing an order signifies your agreement to these store policies.
                  </p>
                </div>

                {/* Section 1 */}
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                    1. Order Placement & Cash on Delivery (Paiement à la livraison)
                  </h4>
                  <p className="text-[11px] text-stone-500 pl-3.5">
                    All orders placed through Express Checkout are processed under standard Cash on Delivery terms. You agree to provide accurate contact information so our delivery agents can verify and deliver your package safely.
                  </p>
                </div>

                {/* Section 2 */}
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                    2. Package Inspection & Acceptance
                  </h4>
                  <p className="text-[11px] text-stone-500 pl-3.5">
                    Upon delivery, buyers are encouraged to inspect the outer packaging before signing or issuing payment to the courier representative. Any visible damage must be reported immediately.
                  </p>
                </div>

                {/* Section 3 */}
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                    3. Return & Exchange Policy (شروط الإرجاع والاستبدال)
                  </h4>
                  <p className="text-[11px] text-stone-500 pl-3.5">
                    Items can be exchanged or returned within 3 to 7 days of delivery provided they are in original condition, unused, with tags attached. Shipping fees for return/exchange due to mind change are borne by the customer, unless the item delivered is defective or wrong.
                  </p>
                </div>

                {/* Section 4 */}
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                    4. Privacy & Personal Data
                  </h4>
                  <p className="text-[11px] text-stone-500 pl-3.5">
                    Your personal information (Name, Phone Number, Address) is strictly utilized to process, confirm, and fulfill your shipping order with our logistics partners.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-stone-100 bg-stone-50/80 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAgreedToTerms(true);
                    setIsTermsModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all shadow-sm hover:shadow cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>I Agree & Accept Terms</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer-Facing Find Your Fit Modal Window */}
      {showFindYourFit && selectedProduct.sizingFitConfig && (
        <FindYourFitModal
          isOpen={isFindYourFitOpen}
          onClose={() => setIsFindYourFitOpen(false)}
          config={selectedProduct.sizingFitConfig}
          productName={selectedProduct.name}
          selectedSize={chosenSize ? getSizeSymbol(chosenSize) : undefined}
          onSelectSize={handleSelectSizeFromFitModal}
          currentLanguage={descLang}
        />
      )}
    </div>
  );
}
