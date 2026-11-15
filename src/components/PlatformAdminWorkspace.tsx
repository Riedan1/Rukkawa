import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Lock,
  User,
  Package,
  Eye,
  EyeOff,
  Trash2,
  Check,
  X,
  Search,
  Plus,
  Award,
  Activity,
  TrendingUp,
  Settings,
  Layers,
  Store,
  Phone,
  Mail,
  Globe,
  LogOut,
  Key,
  Megaphone,
  Percent,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Star,
  MessageSquare,
  Palette,
  Folder,
  FolderOpen,
  ArrowUp,
  ArrowDown,
  Edit2,
  AlertTriangle,
  Smartphone,
  CheckCircle,
  Zap,
  Play,
  Sliders,
  Clock,
  Camera,
  Cpu,
  Sparkles as SparklesIcon,
  Globe2,
  Scan,
  Compass,
  BookOpen,
  Music,
  Car,
  Gamepad2,
  Dumbbell,
  Trophy,
  CookingPot,
  Sofa,
  Flower2,
  HeartPulse,
  ShoppingBasket,
  FlaskConical,
  Crown,
  Gem,
  Shirt,
  Baby,
  Utensils,
  Wrench,
  Tv,
  PawPrint,
  Coffee,
  Watch,
  Gift,
  Home,
  LayoutDashboard,
  Users,
  CreditCard,
  ShoppingCart,
  DollarSign,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  ExternalLink,
  FileText,
  Shield,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Columns,
  Menu,
  ArrowLeft,
  RefreshCw
} from "lucide-react";
import { BeautyCareIcon, ClothingHangerIcon } from "./CategoryCustomIcons";
import { YumeLogo } from "./YumeLogo";
import { ThemeToggle } from "./ThemeToggle";
import { motion, AnimatePresence } from "motion/react";
import PlatformOwnerFeatureManagementCard from "./PlatformOwnerFeatureManagementCard";
import { SubscriptionPlansAndPricingControl } from "./SubscriptionPlansAndPricingControl";
import { PlatformCulturalAndMarketAdmin } from "./PlatformCulturalAndMarketAdmin";
import { PlatformPermissionsManager } from "./PlatformPermissionsManager";
import { StoresManagementWorkspace } from "./StoresManagementWorkspace";
import {
  YUME_ADMIN_TOKENS,
  YumeAdminSectionHeader,
  YumeAdminAdviceBanner,
  YumeAdminSubNavStrip,
  YumeAdminToggle,
  YumeAdminActionFooter,
  YumeAdminConfirmModal,
} from "./YumeAdminDesignSystem";
import {
  fetchBrandsFromFirestore,
  saveBrandToFirestore,
  deleteBrandFromFirestore,
  fetchPendingModelsFromFirestore,
  processPendingModel,
  Brand,
  PendingModel
} from "../utils/brandsStore";
import {
  MerchantStore,
  Product,
  Order,
  Review,
  CoverTemplate,
  MainCategory,
  Subcategory,
  CategoryTemplateField,
  MerchantEnforcementState,
  RestrictedMerchantCapability,
} from "../types";
import { COMMUNICATIVE_WILAYAS } from "../data";
import {
  saveMainCategoryToFirestore,
  saveSubcategoryToFirestore,
  deleteMainCategoryFromFirestore,
  deleteSubcategoryFromFirestore,
  saveReorderedCategoriesToFirestore,
  saveReorderedSubcategoriesToFirestore
} from "../utils/categoriesStore";
import { getAdminPopularSalesThreshold, setAdminPopularSalesThreshold } from "../utils/offersLogic";
import {
  SUBSCRIPTION_PLAN_IDS,
  resolveStoreSubscriptionPlan,
} from "../utils/platformPermissionsConfig";
import {
  PLATFORM_ADMIN_ROLES,
  getPlatformAdminAccounts,
  savePlatformAdminAccounts,
  getActivePlatformAdmin,
  setActivePlatformAdmin,
  canAdminPerform,
  getPlatformAuditLogs,
  recordPlatformAuditLog,
  getStoreEnforcement,
  buildUpdatedStoreEnforcement,
  resolveMerchantAppeal,
  getProhibitedPolicyRules,
  saveProhibitedPolicyRules,
  scanProductAgainstPolicies,
  getBuyerComplaints,
  saveBuyerComplaints,
  ProhibitedPolicyRule,
  verifyStepUpMfaClient,
  verifyAuditLedgerFromServer,
  runSecuritySelfTestsFromServer,
  createDisasterRecoveryExportFromServer,
  runSandboxRestoreTestFromServer,
  evaluateMerchantSubscriptionLifecycleClient,
  buildAdminAuthHeaders,
} from "../utils/centralGovernanceArchitecture";
import { Phase3ProductionReadinessCenter } from "./Phase3ProductionReadinessCenter";

export type AdminTabId =
  | "overview"
  | "stores"
  | "subscriptions"
  | "permissions"
  | "products"
  | "categories"
  | "brands"
  | "cover_templates"
  | "orders"
  | "reviews"
  | "global_markets"
  | "domains"
  | "ai_features"
  | "activity_logs"
  | "security"
  | "settings"
  | "phase3_readiness";

interface PlatformAdminWorkspaceProps {
  stores: MerchantStore[];
  setStores: React.Dispatch<React.SetStateAction<MerchantStore[]>>;
  orders: Order[];
  platformCommission: number;
  setPlatformCommission: (comm: number) => void;
  globalAnnouncement: string;
  setGlobalAnnouncement: (ann: string) => void;
  adminUsername: string;
  adminPassword: string;
  onUpdateCredentials: (user: string, pass: string) => boolean;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (loggedIn: boolean) => void;
  onLogout: () => void;
  currentSlideColor: string;
  darkMode: boolean;
  setDarkMode?: (val: boolean | ((prev: boolean) => boolean)) => void;
  onExitAdmin?: () => void;
  onOpenMerchant?: () => void;
  currentLanguage?: string;
  coverTemplates?: CoverTemplate[];
  onSaveCoverTemplates?: (tpls: CoverTemplate[]) => void;
  mainCategories: MainCategory[];
  setMainCategories: React.Dispatch<React.SetStateAction<MainCategory[]>>;
  subcategories: Subcategory[];
  setSubcategories: React.Dispatch<React.SetStateAction<Subcategory[]>>;
  globalAnimationDelay?: number;
  setGlobalAnimationDelay?: (delay: number) => void;
}

// Sub-component for elegant Product Card rendering in Admin layout
function AdminProductCard({
  product,
  storeName,
  storeId,
  handleUpdateProductStock,
  handleUpdateProductPrice,
  handleDeleteProduct,
}: {
  key?: any;
  product: Product;
  storeName: string;
  storeId: string;
  handleUpdateProductStock: (storeId: string, productId: string, nextStock: number) => void;
  handleUpdateProductPrice: (storeId: string, productId: string, nextPrice: number) => void;
  handleDeleteProduct: (storeId: string, productId: string) => void;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Derive active slides list
  const slides = useMemo(() => {
    const list = [product.imageUrl];
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        if (img && !list.includes(img)) {
          list.push(img);
        }
      });
    }

    // fallback mock slides by category for rich visualization
    if (list.length < 3) {
      if (product.category === "Food") {
        list.push(
          "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80"
        );
      } else if (product.category === "Crafts") {
        list.push(
          "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80"
        );
      } else if (product.category === "Fashion") {
        list.push(
          "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80"
        );
      } else {
        list.push(
          "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop&q=80"
        );
      }
    }
    return list.slice(0, 5);
  }, [product]);

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const ratingVal = product.rating || 4.8;
  const reviewsCount = product.reviews?.length || 4;

  return (
    <div
      className="flex flex-col gap-3 relative bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs select-none group/card text-left transition-all duration-200 hover:border-stone-300 dark:hover:border-slate-700"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Aspect-Ratio Box containing Image Slideshow / Buttons */}
      <div className="aspect-square w-full rounded-xl overflow-hidden bg-stone-100 dark:bg-slate-950 relative border border-stone-200/60 dark:border-slate-800 group/img">
        <div className="w-full h-full relative">
          <img
            src={slides[currentSlide]}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover select-none transition-all duration-500 scale-100 group-hover/card:scale-103"
          />

          {/* Solid Choice Brand Label Badge */}
          <div className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-slate-900/95 text-stone-900 dark:text-white font-bold text-[9px] px-2 py-0.5 rounded-md border border-stone-200/80 dark:border-slate-700 uppercase tracking-wider font-sans select-none">
            Choice
          </div>

          {/* Quick Category indicator top right */}
          <div className="absolute top-2.5 right-2.5 bg-[#1e2631]/90 dark:bg-slate-900/90 text-white font-bold text-[9.5px] px-2.5 py-0.5 rounded-md font-sans">
            {product.category}
          </div>
        </div>

        {/* Dynamic Chevron Left / Right Carousel Controls */}
        <AnimatePresence>
          {isHovered && slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevSlide}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white hover:bg-stone-100 flex items-center justify-center text-stone-800 shadow-md transition-all z-10 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5px]" />
              </button>

              <button
                type="button"
                onClick={nextSlide}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white hover:bg-stone-100 flex items-center justify-center text-stone-800 shadow-md transition-all z-10 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </>
          )}
        </AnimatePresence>

        {/* Small Progress Dots Bottom Carousel Center overlay */}
        {slides.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 select-none">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentSlide
                    ? "bg-white w-2 h-2 scale-110"
                    : "bg-white/50 w-1.5 h-1.5"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Description Meta Section Block below the image */}
      <div className="flex flex-col text-left font-sans gap-1.5">
        {/* Row 1: Title & Inline Rating */}
        <div className="flex justify-between items-start gap-2">
          <h5 className="text-sm font-bold text-stone-900 dark:text-white line-clamp-1 flex-1 leading-snug">
            {product.name}
          </h5>
          <div className="flex items-center gap-1 text-xs font-bold text-stone-800 dark:text-slate-200 shrink-0 font-sans tabular-nums">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{ratingVal.toFixed(1)}</span>
            <span className="text-stone-400">({reviewsCount})</span>
          </div>
        </div>

        {/* Row 2: Origin boutique / store info */}
        <div className="text-xs text-stone-500 dark:text-slate-400 font-medium line-clamp-1">
          Boutique: <strong className="font-semibold text-stone-700 dark:text-slate-300">{storeName}</strong>
        </div>

        {/* Row 3: Delivery Window & Stock Indicators */}
        <div className="text-xs text-stone-500 dark:text-slate-400 flex items-center justify-between">
          <span>Standard Choice delivery</span>
          {product.stock <= 3 && product.stock > 0 ? (
            <span className="text-rose-600 dark:text-rose-400 font-bold text-[10px]">Low stock: {product.stock}</span>
          ) : product.stock === 0 ? (
            <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded text-[10px]">SOLDOUT</span>
          ) : (
            <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded text-[10px] font-sans tabular-nums">{product.stock} in stock</span>
          )}
        </div>

        {/* Row 4: Stock Incrementor adjusters */}
        <div className="flex justify-between items-center text-xs text-stone-500 dark:text-slate-400 py-1.5 border-y border-stone-200/70 dark:border-slate-800 mt-0.5">
          <span className="font-semibold text-stone-700 dark:text-slate-300">Stock Count</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleUpdateProductStock(storeId, product.id, (product.stock || 0) * 1 - 1)}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-slate-200 cursor-pointer border border-stone-200 dark:border-slate-700"
              title="Minus stock"
            >
              -
            </button>
            <span className="text-xs font-sans tabular-nums font-bold w-7 text-center text-stone-900 dark:text-white">
              {product.stock || 0}
            </span>
            <button
              type="button"
              onClick={() => handleUpdateProductStock(storeId, product.id, (product.stock || 0) * 1 + 1)}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-slate-200 cursor-pointer border border-stone-200 dark:border-slate-700"
              title="Add stock"
            >
              +
            </button>
          </div>
        </div>

        {/* Row 4b: Price Adjuster */}
        <div className="flex justify-between items-center text-xs text-stone-500 dark:text-slate-400 pb-1.5 border-b border-stone-200/70 dark:border-slate-800">
          <span className="font-semibold text-stone-700 dark:text-slate-300">Price (DA)</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleUpdateProductPrice(storeId, product.id, Math.max(0, product.price - 50))}
              className="px-1.5 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold font-sans bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-slate-200 cursor-pointer border border-stone-200 dark:border-slate-700"
              title="Minus 50 DA"
            >
              -50
            </button>
            <input
              type="number"
              value={product.price || 0}
              onChange={(e) => handleUpdateProductPrice(storeId, product.id, Math.max(0, Number(e.target.value)))}
              className="text-xs font-sans tabular-nums font-bold w-16 text-center bg-stone-50/70 dark:bg-slate-950 text-stone-900 dark:text-white border border-stone-200/90 dark:border-slate-800 rounded-lg py-0.5 outline-none focus:border-stone-500"
            />
            <button
              type="button"
              onClick={() => handleUpdateProductPrice(storeId, product.id, product.price + 50)}
              className="px-1.5 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold font-sans bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-slate-200 cursor-pointer border border-stone-200 dark:border-slate-700"
              title="Plus 50 DA"
            >
              +50
            </button>
          </div>
        </div>

        {/* Row 5: Pricing details and action buttons */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="font-black font-sans tabular-nums text-stone-900 dark:text-white text-sm">
              {product.price.toLocaleString()} DA
            </span>
            <span className="text-stone-500 dark:text-slate-400 font-medium font-sans text-[11px]"> total</span>
          </div>

          <button
            type="button"
            onClick={() => handleDeleteProduct(storeId, product.id)}
            className="px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50/80 hover:bg-rose-600 hover:text-white dark:bg-rose-950/30 dark:hover:bg-rose-600 dark:hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-rose-200/70 dark:border-rose-900/40"
            title="Surgical asset deletion moderated"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Moderate</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlatformAdminWorkspace({
  stores,
  setStores,
  orders,
  platformCommission,
  setPlatformCommission,
  globalAnnouncement,
  setGlobalAnnouncement,
  adminUsername,
  adminPassword,
  onUpdateCredentials,
  isAdminLoggedIn,
  setIsAdminLoggedIn,
  onLogout,
  currentSlideColor,
  darkMode,
  setDarkMode,
  onExitAdmin,
  onOpenMerchant,
  currentLanguage = "en",
  coverTemplates = [],
  onSaveCoverTemplates,
  mainCategories,
  setMainCategories,
  subcategories,
  setSubcategories,
  globalAnimationDelay = 0.5,
  setGlobalAnimationDelay,
}: PlatformAdminWorkspaceProps) {
  const [testPulse, setTestPulse] = useState(false);
  const [offerPopularSalesThreshold, setOfferPopularSalesThresholdState] = useState<number>(() => getAdminPopularSalesThreshold());
  const [securitySelfTestReport, setSecuritySelfTestReport] = useState<any | null>(null);
  const [isRunningSecurityTests, setIsRunningSecurityTests] = useState(false);
  const [auditVerificationReport, setAuditVerificationReport] = useState<any | null>(null);
  const [drSandboxCertificate, setDrSandboxCertificate] = useState<any | null>(null);
  const [stepUpExpiresAtIso, setStepUpExpiresAtIso] = useState<string | null>(null);
  // Local admin translation helper
  const t = (key: string) => {
    const dicts: Record<string, Record<string, string>> = {
      en: {
        adminTitle: "YUME Platform Control Center",
        adminRole: "Super Admin",
        authorizedProfile: "Authorized Owner",
        logout: "Logout",
        platformOverview: "Dashboard",
        storesRegistry: "Stores ({count})",
        catalogModeration: "Products ({count})",
        reviewsManagement: "Reviews ({count})",
        globalSettings: "Global Settings",
      },
      fr: {
        adminTitle: "Centre de Contrôle YUME",
        adminRole: "Super Admin",
        authorizedProfile: "Propriétaire Autorisé",
        logout: "Déconnexion",
        platformOverview: "Tableau de Bord",
        storesRegistry: "Boutiques ({count})",
        catalogModeration: "Produits ({count})",
        reviewsManagement: "Avis ({count})",
        globalSettings: "Paramètres Globaux",
      },
      ar: {
        adminTitle: "مركز إدارة منصة يومي",
        adminRole: "المشرف العام",
        authorizedProfile: "المالك المصرح له",
        logout: "تسجيل الخروج",
        platformOverview: "لوحة التحكم",
        storesRegistry: "المتاجر ({count})",
        catalogModeration: "المنتجات ({count})",
        reviewsManagement: "التقييمات ({count})",
        globalSettings: "الإعدادات العامة",
      }
    };
    const lang = currentLanguage === "ar" || currentLanguage === "fr" || currentLanguage === "en" ? currentLanguage : "en";
    return dicts[lang][key] || key;
  };

  // Local admin tab & workspace layout flexibility states
  const [adminTab, setAdminTab] = useState<AdminTabId>("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isFullBleedLayout, setIsFullBleedLayout] = useState<boolean>(true);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState<string>("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [overviewBreakdownTab, setOverviewBreakdownTab] = useState<"stores" | "tiers" | "status">("stores");
  const [ordersSearchQuery, setOrdersSearchQuery] = useState<string>("");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<string>("all");

  // Platform Central Domain Limits & Multi-Tenant Routing state
  const [domainLimitsConfig, setDomainLimitsConfig] = useState<{
    enforceSubscriptionLimits: boolean;
    limitsByPlan: Record<"Free" | "Basic" | "Pro" | "Pro Plus" | "Premium" | "Premium Plus", number | "unlimited">;
    cloudflareCdnEnabled: boolean;
    edgeCachingTtlSeconds: number;
    rateLimitRequestsPerMinute: number;
    autoSslProvisioning: boolean;
    updatedAt?: string;
  }>(() => {
    try {
      const saved = localStorage.getItem("yume_platform_domain_settings");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enforceSubscriptionLimits: false,
      limitsByPlan: {
        "Free": 1,
        "Basic": 2,
        "Pro": 5,
        "Pro Plus": 15,
        "Premium": 50,
        "Premium Plus": "unlimited",
      },
      cloudflareCdnEnabled: true,
      edgeCachingTtlSeconds: 3600,
      rateLimitRequestsPerMinute: 600,
      autoSslProvisioning: true,
    };
  });
  const [allPlatformDomains, setAllPlatformDomains] = useState<any[]>([]);
  const [domainSettingsSaveFeedback, setDomainSettingsSaveFeedback] = useState<string>("");
  const [domainDirectorySearch, setDomainDirectorySearch] = useState<string>("");

  React.useEffect(() => {
    const loadDomainAdminData = async () => {
      try {
        const [settingsRes, domainsRes] = await Promise.all([
          fetch("/api/domains/settings"),
          fetch("/api/domains"),
        ]);
        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          if (sData && sData.limitsByPlan) {
            setDomainLimitsConfig(sData);
            try {
              localStorage.setItem("yume_platform_domain_settings", JSON.stringify(sData));
            } catch {}
          }
        }
        if (domainsRes.ok) {
          const dData = await domainsRes.json();
          if (Array.isArray(dData)) {
            setAllPlatformDomains(dData);
          }
        }
      } catch {}
    };
    loadDomainAdminData();
  }, [adminTab]);

  const handleSavePlatformDomainLimits = async (nextConfig = domainLimitsConfig) => {
    setDomainLimitsConfig(nextConfig);
    try {
      localStorage.setItem("yume_platform_domain_settings", JSON.stringify(nextConfig));
    } catch {}
    try {
      const res = await fetch("/api/domains/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextConfig),
      });
      if (res.ok) {
        const saved = await res.json();
        setDomainLimitsConfig(saved);
        try {
          localStorage.setItem("yume_platform_domain_settings", JSON.stringify(saved));
        } catch {}
      }
    } catch {}
    window.dispatchEvent(new Event("yume_domain_settings_updated"));
    setDomainSettingsSaveFeedback("Domain limits & multi-tenant routing rules saved.");
    setTimeout(() => setDomainSettingsSaveFeedback(""), 3500);
  };

  // Feature Toggles state (Visual Search & Geo Location)
  const [visualSearchEnabled, setVisualSearchEnabled] = useState<boolean>(() => {
    return localStorage.getItem("dz_admin_visual_search_enabled") !== "false";
  });
  const [geoLocationEnabled, setGeoLocationEnabled] = useState<boolean>(() => {
    return localStorage.getItem("dz_admin_geo_location_enabled") !== "false";
  });

  const toggleVisualSearch = (val: boolean) => {
    setVisualSearchEnabled(val);
    localStorage.setItem("dz_admin_visual_search_enabled", val ? "true" : "false");
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("dz_visual_search_toggle", { detail: { enabled: val } }));
  };

  const toggleGeoLocation = (val: boolean) => {
    setGeoLocationEnabled(val);
    localStorage.setItem("dz_admin_geo_location_enabled", val ? "true" : "false");
    window.dispatchEvent(new Event("storage"));
  };

  // Yumi Orders Module Governance state
  const [globalOrdersMode, setGlobalOrdersMode] = useState<"both" | "classic" | "advanced">(
    () => (localStorage.getItem("yumi_admin_global_orders_mode") as "both" | "classic" | "advanced") || "both"
  );

  const [planOrdersMode, setPlanOrdersMode] = useState<Record<string, "both" | "classic" | "advanced">>(() => {
    try {
      const saved = localStorage.getItem("yumi_admin_plan_orders_mode");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return { Basic: "classic", Pro: "both", "Pro Plus": "both", Premium: "both" };
  });

  const handleUpdateGlobalOrdersMode = (mode: "both" | "classic" | "advanced") => {
    setGlobalOrdersMode(mode);
    localStorage.setItem("yumi_admin_global_orders_mode", mode);
    window.dispatchEvent(new Event("storage"));
  };

  const handleUpdatePlanOrdersMode = (plan: string, mode: "both" | "classic" | "advanced") => {
    const next = { ...planOrdersMode, [plan]: mode };
    setPlanOrdersMode(next);
    localStorage.setItem("yumi_admin_plan_orders_mode", JSON.stringify(next));
    window.dispatchEvent(new Event("storage"));
  };

  // AI Models Management state (Gemini, DeepSeek, OpenAI, Kimi, and Custom Manual Models)
  const [activeAiModel, setActiveAiModel] = useState<string>(() => {
    return localStorage.getItem("dz_active_ai_model") || "Gemini 2.5 Flash";
  });

  const [customAiModels, setCustomAiModels] = useState<Array<{
    id: string;
    name: string;
    provider: string;
    baseUrl?: string;
    apiKey?: string;
    modelId?: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem("dz_custom_ai_models");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: "cm-1", name: "Gemini 3.8 Flash", provider: "Google GenAI", modelId: "gemini-3.8-flash" },
      { id: "cm-2", name: "DeepSeek V3", provider: "DeepSeek AI", modelId: "deepseek-v3" },
      { id: "cm-3", name: "OpenAI GPT-4o", provider: "OpenAI", modelId: "gpt-4o" },
      { id: "cm-4", name: "Kimi k1.5", provider: "Moonshot AI / Kimi", modelId: "kimi-k1.5" },
    ];
  });

  const [isAddingCustomModel, setIsAddingCustomModel] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [newModelProvider, setNewModelProvider] = useState("Custom Provider");
  const [newModelBaseUrl, setNewModelBaseUrl] = useState("");
  const [newModelApiKey, setNewModelApiKey] = useState("");
  const [newModelId, setNewModelId] = useState("");

  const handleSelectActiveModel = (modelName: string) => {
    setActiveAiModel(modelName);
    localStorage.setItem("dz_active_ai_model", modelName);
    window.dispatchEvent(new Event("storage"));
  };

  const handleAddCustomModel = () => {
    if (!newModelName.trim()) return;
    const modelItem = {
      id: "cm-" + Date.now(),
      name: newModelName.trim(),
      provider: newModelProvider.trim() || "Custom Provider",
      baseUrl: newModelBaseUrl.trim(),
      apiKey: newModelApiKey.trim(),
      modelId: newModelId.trim() || newModelName.toLowerCase().replace(/\s+/g, "-")
    };

    const updated = [...customAiModels, modelItem];
    setCustomAiModels(updated);
    localStorage.setItem("dz_custom_ai_models", JSON.stringify(updated));
    setActiveAiModel(modelItem.name);
    localStorage.setItem("dz_active_ai_model", modelItem.name);
    window.dispatchEvent(new Event("storage"));

    setNewModelName("");
    setNewModelProvider("Custom Provider");
    setNewModelBaseUrl("");
    setNewModelApiKey("");
    setNewModelId("");
    setIsAddingCustomModel(false);
  };

  const handleDeleteCustomModel = (id: string) => {
    const updated = customAiModels.filter(m => m.id !== id);
    setCustomAiModels(updated);
    localStorage.setItem("dz_custom_ai_models", JSON.stringify(updated));
    if (activeAiModel === customAiModels.find(m => m.id === id)?.name) {
      const fallback = updated[0]?.name || "Gemini 2.5 Flash";
      setActiveAiModel(fallback);
      localStorage.setItem("dz_active_ai_model", fallback);
    }
    window.dispatchEvent(new Event("storage"));
  };

  // Brands & Models Management states
  const [brands, setBrands] = useState<Brand[]>([]);
  const [pendingModels, setPendingModels] = useState<PendingModel[]>([]);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [brandForm, setBrandForm] = useState({
    id: "",
    name: "",
    category: "electronics_devices",
    modelsString: ""
  });

  const loadBrandsAndPending = async () => {
    try {
      const brandsData = await fetchBrandsFromFirestore();
      setBrands(brandsData);
      const pendingData = await fetchPendingModelsFromFirestore();
      setPendingModels(pendingData);
    } catch (err) {
      console.error("Error loading brands and pending models: ", err);
    }
  };

  React.useEffect(() => {
    loadBrandsAndPending();
  }, [adminTab]);

  // Login inputs
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Search & Filter state
  const [storeQuery, setStoreQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");

  // Edit Template state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState({
    id: "",
    name: "",
    description: "",
    badgeText: "",
  });
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);

  // Dynamic Category & Subcategory management states
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string>("");
  const [showAddMainCategory, setShowAddMainCategory] = useState(false);
  const [editingMainCategory, setEditingMainCategory] = useState<MainCategory | null>(null);
  const [mainCategoryForm, setMainCategoryForm] = useState({
    id: "",
    names: { en: "", ar: "", fr: "" },
    icon: "Shirt",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80",
  });

  const [showAddSubcategory, setShowAddSubcategory] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [subcategoryForm, setSubcategoryForm] = useState<{
    id: string;
    names: { en: string; ar: string; fr: string };
    icon: string;
    image: string;
    sizeSystemEnabled: boolean;
    sizeSystemLabel: string;
    sizeSystemSizes: string;
    recommendedMaterials: string;
    fields: CategoryTemplateField[];
  }>({
    id: "",
    names: { en: "", ar: "", fr: "" },
    icon: "Folder",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80",
    sizeSystemEnabled: false,
    sizeSystemLabel: "Sizes",
    sizeSystemSizes: "",
    recommendedMaterials: "",
    fields: [],
  });

  const [newSpecField, setNewSpecField] = useState({
    name: "",
    type: "text" as "text" | "number" | "boolean" | "select",
    required: false,
    options: "",
    unit: "",
    placeholder: "",
  });

  const [categoriesTab, setCategoriesTab] = useState<"main" | "sub">("main");
  const [mainCatSearch, setMainCatSearch] = useState("");
  const [subCatSearch, setSubCatSearch] = useState("");
  const [subCatDeptFilter, setSubCatDeptFilter] = useState<string>("all");

  // Category sorting states
  const [catSortField, setCatSortField] = useState<"name" | "date" | null>(null);
  const [catSortOrder, setCatSortOrder] = useState<"asc" | "desc">("asc");

  // Non-blocking Admin Action Toast (Replaces native window.alert / window.confirm)
  const [adminActionToast, setAdminActionToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Destructive Action Confirmation Modal State
  const [confirmModalState, setConfirmModalState] = useState<{
    title: string;
    subtitle?: string;
    description: React.ReactNode;
    confirmLabel?: string;
    variant?: "danger" | "warning" | "slate";
    onConfirm: () => void;
  } | null>(null);

  const showAdminToast = (text: string, type: "success" | "error" = "success") => {
    setAdminActionToast({ text, type });
    setTimeout(() => {
      setAdminActionToast((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  };

  const getCategoryCreatedAt = (cat: MainCategory | Subcategory) => {
    if (cat.createdAt) return cat.createdAt;
    // Map stable mock dates for default categories to make sorting obvious and deterministic
    const stableDates: Record<string, string> = {
      fashion: "2026-07-01T10:00:00Z",
      kids: "2026-07-02T10:00:00Z",
      health_beauty: "2026-07-03T10:00:00Z",
      electronics: "2026-07-04T10:00:00Z",
      home_living: "2026-07-05T10:00:00Z",
      sports_toys: "2026-07-06T10:00:00Z",
      arts_crafts: "2026-07-07T10:00:00Z",
      food_beverages: "2026-07-08T10:00:00Z",
      automotive_tools: "2026-07-09T10:00:00Z",
      
      fashion_all: "2026-07-01T11:00:00Z",
      fashion_clothing: "2026-07-01T12:00:00Z",
      fashion_shoes: "2026-07-01T13:00:00Z",
      fashion_bags: "2026-07-01T14:00:00Z",
      fashion_jewelry: "2026-07-01T15:00:00Z",
      fashion_watches: "2026-07-01T16:00:00Z",
      fashion_hats_caps: "2026-07-01T17:00:00Z",
      
      kids_clothing: "2026-07-02T11:00:00Z",
      kids_shoes: "2026-07-02T12:00:00Z",
      kids_accessories: "2026-07-02T13:00:00Z",
      kids_toys: "2026-07-02T14:00:00Z",
      kids_baby_essentials: "2026-07-02T15:00:00Z",
    };
    return stableDates[cat.id] || "2026-07-10T10:00:00Z";
  };

  const handleCatSort = (field: "name" | "date") => {
    if (catSortField === field) {
      setCatSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setCatSortField(field);
      setCatSortOrder("asc");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  React.useEffect(() => {
    if (!selectedMainCategoryId && mainCategories.length > 0) {
      setSelectedMainCategoryId(mainCategories[0].id);
    }
  }, [mainCategories, selectedMainCategoryId]);

  // Safe delete policy states
  const [safeDeleteMainCategory, setSafeDeleteMainCategory] = useState<MainCategory | null>(null);
  const [safeDeleteSubcategory, setSafeDeleteSubcategory] = useState<Subcategory | null>(null);
  const [safeDeleteAction, setSafeDeleteAction] = useState<"archive" | "move">("archive");
  const [safeDeleteTargetId, setSafeDeleteTargetId] = useState<string>("");
  // Stores Sub-Navigation state
  const [storesSubNav, setStoresSubNav] = useState<
    "registry" | "verification" | "plans" | "directions"
  >("registry");

  // Settings Credentials editor states
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [settingsFeedback, setSettingsFeedback] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser || !loginPass) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    if (loginUser === adminUsername && loginPass === adminPassword) {
      try {
        localStorage.setItem("is_dz_admin_logged_in", "true");
      } catch (err) {}
      setIsAdminLoggedIn(true);
      setErrorMsg("");
    } else {
      setErrorMsg("Incorrect admin username or password. Please verify.");
    }
  };

  // ===========================================================================
  // CENTRAL GOVERNANCE ARCHITECTURE STATES (RBAC, ENFORCEMENT, APPEALS, AUDIT)
  // ===========================================================================
  const [adminAccounts, setAdminAccounts] = useState(getPlatformAdminAccounts);
  const [activeAdmin, setActiveAdminState] = useState(getActivePlatformAdmin);
  const [auditLogs, setAuditLogs] = useState(getPlatformAuditLogs);
  const [auditFilterModule, setAuditFilterModule] = useState<string>("all");
  const [auditFilterRole, setAuditFilterRole] = useState<string>("all");
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>("");
  const [expandedAuditLogId, setExpandedAuditLogId] = useState<string | null>(null);

  const [productModerationSubTab, setProductModerationSubTab] = useState<
    "all_products" | "moderation_queue" | "policy_rules"
  >("all_products");
  const [policyRules, setPolicyRules] = useState<ProhibitedPolicyRule[]>(
    getProhibitedPolicyRules
  );
  const [newPolicyKeyword, setNewPolicyKeyword] = useState("");
  const [newPolicyCategory, setNewPolicyCategory] = useState("Prohibited Goods");
  const [newPolicySeverity, setNewPolicySeverity] = useState<"high" | "critical">("high");

  const [reviewsSubTab, setReviewsSubTab] = useState<
    "customer_reviews" | "buyer_complaints"
  >("customer_reviews");
  const [buyerComplaints, setBuyerComplaints] = useState(getBuyerComplaints);

  // Store Governance, Enforcement, Entitlement Overrides & Appeals Modal state
  const [governingStoreId, setGoverningStoreId] = useState<string | null>(null);
  const [enforcementDraft, setEnforcementDraft] = useState<{
    state: MerchantEnforcementState;
    reason: string;
    policyReference: string;
    restrictedCapabilities: RestrictedMerchantCapability[];
    maxActiveProducts: string;
    maxCustomDomains: string;
    maxSponsoredAdSlots: string;
    billingStatus: "active" | "trial" | "trialing" | "past_due" | "expired" | "cancelled" | "canceled";
    appealResolutionNotes: string;
  }>({
    state: "active",
    reason: "",
    policyReference: "POL-MARKET-01",
    restrictedCapabilities: [],
    maxActiveProducts: "",
    maxCustomDomains: "",
    maxSponsoredAdSlots: "",
    billingStatus: "active",
    appealResolutionNotes: "",
  });

  React.useEffect(() => {
    const syncGovernance = () => {
      setAdminAccounts(getPlatformAdminAccounts());
      setActiveAdminState(getActivePlatformAdmin());
      setAuditLogs(getPlatformAuditLogs());
      setPolicyRules(getProhibitedPolicyRules());
      setBuyerComplaints(getBuyerComplaints());
    };
    window.addEventListener("yume_governance_updated", syncGovernance);
    window.addEventListener("yume_audit_logs_updated", syncGovernance);
    window.addEventListener("storage", syncGovernance);
    return () => {
      window.removeEventListener("yume_governance_updated", syncGovernance);
      window.removeEventListener("yume_audit_logs_updated", syncGovernance);
      window.removeEventListener("storage", syncGovernance);
    };
  }, []);

  const openStoreGovernanceModal = (store: MerchantStore) => {
    const enf = getStoreEnforcement(store);
    setGoverningStoreId(store.id);
    setEnforcementDraft({
      state: enf.state,
      reason: enf.reason || "",
      policyReference: enf.policyReference || "POL-MARKET-01",
      restrictedCapabilities: enf.restrictedCapabilities || [],
      maxActiveProducts:
        store.entitlementOverrides?.maxActiveProducts !== undefined
          ? String(store.entitlementOverrides.maxActiveProducts)
          : "",
      maxCustomDomains:
        store.entitlementOverrides?.maxCustomDomains !== undefined
          ? String(store.entitlementOverrides.maxCustomDomains)
          : "",
      maxSponsoredAdSlots:
        store.entitlementOverrides?.maxSponsoredAdSlots !== undefined
          ? String(store.entitlementOverrides.maxSponsoredAdSlots)
          : "",
      billingStatus: store.subscriptionMeta?.billingStatus || "active",
      appealResolutionNotes: "",
    });
  };

  const handleSaveStoreGovernance = () => {
    if (!governingStoreId) return;
    const targetStore = stores.find((s) => s.id === governingStoreId);
    if (!targetStore) return;

    const actionType =
      enforcementDraft.state === "suspended" ||
      enforcementDraft.state === "terminated"
        ? "suspend"
        : "edit";
    const permCheck = canAdminPerform("stores", actionType, activeAdmin);
    if (!permCheck.allowed) {
      showAdminToast(permCheck.reason || "Permission denied.", "error");
      return;
    }

    const updatedStore = buildUpdatedStoreEnforcement(targetStore, {
      state: enforcementDraft.state,
      reason:
        enforcementDraft.reason.trim() ||
        (enforcementDraft.state === "active"
          ? "Account in good standing."
          : `Administrative ${enforcementDraft.state} enforcement applied.`),
      policyReference: enforcementDraft.policyReference || "POL-MARKET-01",
      restrictedCapabilities: enforcementDraft.restrictedCapabilities,
    });

    const nextOverrides = {
      ...(targetStore.entitlementOverrides || {}),
      maxActiveProducts: enforcementDraft.maxActiveProducts.trim()
        ? Math.max(1, parseInt(enforcementDraft.maxActiveProducts, 10))
        : undefined,
      maxCustomDomains: enforcementDraft.maxCustomDomains.trim()
        ? Math.max(0, parseInt(enforcementDraft.maxCustomDomains, 10))
        : undefined,
      maxSponsoredAdSlots: enforcementDraft.maxSponsoredAdSlots.trim()
        ? Math.max(0, parseInt(enforcementDraft.maxSponsoredAdSlots, 10))
        : undefined,
      overrideReason: `Admin governance update by ${activeAdmin.email}`,
      updatedAt: new Date().toISOString(),
      updatedBy: activeAdmin.email,
    };

    const nextSubscriptionMeta = {
      canonicalPlanId: resolveStoreSubscriptionPlan(targetStore),
      billingCycle: targetStore.subscriptionMeta?.billingCycle || ("monthly" as const),
      billingStatus: enforcementDraft.billingStatus,
      updatedAt: new Date().toISOString(),
    };

    const finalStore: MerchantStore = {
      ...updatedStore,
      entitlementOverrides: nextOverrides,
      subscriptionMeta: nextSubscriptionMeta,
    };

    setStores((prev) =>
      prev.map((s) => (s.id === governingStoreId ? finalStore : s))
    );
    void fetch("/api/admin/enforce-store", {
      method: "POST",
      headers: buildAdminAuthHeaders(),
      body: JSON.stringify({
        storeId: governingStoreId,
        newState: finalStore.enforcement?.state || enforcementDraft.state,
        reason: finalStore.enforcement?.reason,
        reasonCode: finalStore.enforcement?.reasonCode || "POLICY_ENFORCEMENT",
        policyReference: finalStore.enforcement?.policyReference || "POL-MARKET-01",
        restrictedCapabilities: finalStore.enforcement?.restrictedCapabilities || [],
        marketScope: targetStore.countryCode || "DZ",
        storeSnapshot: finalStore,
      }),
    }).catch(() => {});
    setGoverningStoreId(null);
    showAdminToast(
      `Governance & enforcement state for "${targetStore.name}" updated to ${enforcementDraft.state.toUpperCase()}.`
    );
  };

  const handleResolveStoreAppeal = (
    store: MerchantStore,
    decision: "approved" | "rejected"
  ) => {
    const permCheck = canAdminPerform("stores", "approve", activeAdmin);
    if (!permCheck.allowed) {
      showAdminToast(permCheck.reason || "Permission denied.", "error");
      return;
    }
    const updated = resolveMerchantAppeal(
      store,
      decision,
      enforcementDraft.appealResolutionNotes.trim() ||
        (decision === "approved"
          ? "Appeal approved and full store access restored."
          : "Appeal reviewed and declined; enforcement remains active.")
    );
    setStores((prev) => prev.map((s) => (s.id === store.id ? updated : s)));
    setGoverningStoreId(null);
    showAdminToast(
      `Appeal for "${store.name}" ${
        decision === "approved" ? "approved (Store restored to Active)" : "rejected"
      }.`
    );
  };

  const handleDeleteProduct = (storeId: string, productId: string) => {
    const targetStore = stores.find((s) => s.id === storeId);
    const targetProduct = targetStore?.products.find((p) => p.id === productId);
    const productName = targetProduct ? targetProduct.name : productId;
    setConfirmModalState({
      title: "Delete Product Listing",
      subtitle: targetStore ? `Merchant: ${targetStore.name}` : "Catalog moderation",
      description: `Are you sure you want to permanently remove "${productName}" from the catalog? This action cannot be undone.`,
      confirmLabel: "Delete Product",
      variant: "danger",
      onConfirm: () => {
        setStores((prev) =>
          prev.map((store) => {
            if (store.id === storeId) {
              return {
                ...store,
                products: store.products.filter((p) => p.id !== productId),
              };
            }
            return store;
          })
        );
        setConfirmModalState(null);
        showAdminToast(`Product "${productName}" removed from catalog.`);
      },
    });
  };

  const handleUpdateProductStock = (storeId: string, productId: string, nextStock: number) => {
    if (nextStock < 0) return;
    setStores((prev) =>
      prev.map((store) => {
        if (store.id === storeId) {
          return {
            ...store,
            products: store.products.map((p) => (p.id === productId ? { ...p, stock: nextStock } : p)),
          };
        }
        return store;
      })
    );
  };

  const handleUpdateProductPrice = (storeId: string, productId: string, nextPrice: number) => {
    if (nextPrice < 0) return;
    setStores((prev) =>
      prev.map((store) => {
        if (store.id === storeId) {
          return {
            ...store,
            products: store.products.map((p) => (p.id === productId ? { ...p, price: nextPrice } : p)),
          };
        }
        return store;
      })
    );
  };

  const handleUpdateAdminPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUser || !newAdminPass) {
      setSettingsFeedback("Both fields are required.");
      return;
    }

    const success = onUpdateCredentials(newAdminUser, newAdminPass);
    if (success) {
      setSettingsFeedback("Credentials updated successfully! Use these for next logins.");
      setNewAdminUser("");
      setNewAdminPass("");
      setTimeout(() => setSettingsFeedback(""), 4000);
    } else {
      setSettingsFeedback("Save failed. Try different values.");
    }
  };

  const totalStores = stores.length;
  const totalProducts = useMemo(() => {
    return stores.reduce((acc, s) => acc + (s.products?.length || 0), 0);
  }, [stores]);

  const totalSales = useMemo(() => {
    return orders.reduce((acc, o) => acc + o.total, 0);
  }, [orders]);

  const estimatedProfit = useMemo(() => {
    return (totalSales * platformCommission) / 100;
  }, [totalSales, platformCommission]);

  const orderDistributionByStatus = useMemo(() => {
    const counts = { pending: 0, accepted: 0, shipped: 0, delivered: 0 };
    orders.forEach((o) => {
      if (o.status in counts) {
        counts[o.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [orders]);

  const allProducts = useMemo(() => {
    const list: { product: Product; storeName: string; storeId: string }[] = [];
    stores.forEach((s) => {
      if (s.products) {
        s.products.forEach((p) => {
          list.push({ product: p, storeName: s.name, storeId: s.id });
        });
      }
    });
    return list;
  }, [stores]);

  const filteredProducts = allProducts.filter((p) => {
    const q = productQuery.toLowerCase();
    return (
      p.product.name.toLowerCase().includes(q) ||
      p.product.category.toLowerCase().includes(q) ||
      p.storeName.toLowerCase().includes(q)
    );
  });

  // Centrally view and moderate reviews from all stores
  interface AggregatedReview {
    review: Review;
    type: "store" | "product";
    storeId: string;
    storeName: string;
    productId?: string;
    productName?: string;
  }

  // Sentiment, Rating, Store, Type filters
  const [reviewsSearch, setReviewsSearch] = useState("");
  const [reviewsSentimentFilter, setReviewsSentimentFilter] = useState<"all" | "positive" | "neutral" | "negative">("all");
  const [reviewsRatingFilter, setReviewsRatingFilter] = useState<number | "all">("all");
  const [reviewsTypeFilter, setReviewsTypeFilter] = useState<"all" | "store" | "product">("all");
  const [reviewsStoreFilter, setReviewsStoreFilter] = useState<string>("all");
  const [reviewsSortOrder, setReviewsSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");

  // Inline replies or inline edits
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewForm, setEditReviewForm] = useState({
    comment: "",
    rating: 5,
    sentiment: "positive" as "positive" | "neutral" | "negative",
  });

  const allReviews = useMemo(() => {
    const list: AggregatedReview[] = [];
    stores.forEach((store) => {
      // 1. Store level reviews
      if (store.reviews) {
        store.reviews.forEach((rev) => {
          list.push({
            review: rev,
            type: "store",
            storeId: store.id,
            storeName: store.name,
          });
        });
      }
      // 2. Product level reviews
      if (store.products) {
        store.products.forEach((prod) => {
          if (prod.reviews) {
            prod.reviews.forEach((rev) => {
              list.push({
                review: rev,
                type: "product",
                storeId: store.id,
                storeName: store.name,
                productId: prod.id,
                productName: prod.name,
              });
            });
          }
        });
      }
    });

    // Sort by date or id or descending order to see newest first
    return list.sort((a, b) => {
      const dateA = new Date(a.review.date).getTime() || 0;
      const dateB = new Date(b.review.date).getTime() || 0;
      return dateB - dateA;
    });
  }, [stores]);

  const filteredReviews = useMemo(() => {
    const list = allReviews.filter((item) => {
      // Search matches author, store, comment, or product
      const searchLower = reviewsSearch.toLowerCase();
      const matchesSearch =
        item.review.author.toLowerCase().includes(searchLower) ||
        item.review.comment.toLowerCase().includes(searchLower) ||
        item.storeName.toLowerCase().includes(searchLower) ||
        (item.productName && item.productName.toLowerCase().includes(searchLower));

      const matchesSentiment = reviewsSentimentFilter === "all" || item.review.sentiment === reviewsSentimentFilter;
      const matchesRating = reviewsRatingFilter === "all" || Math.floor(item.review.rating) === reviewsRatingFilter;
      const matchesType = reviewsTypeFilter === "all" || item.type === reviewsTypeFilter;
      const matchesStore = reviewsStoreFilter === "all" || item.storeId === reviewsStoreFilter;

      return matchesSearch && matchesSentiment && matchesRating && matchesType && matchesStore;
    });

    return [...list].sort((a, b) => {
      if (reviewsSortOrder === "newest") {
        const dateA = new Date(a.review.date).getTime() || 0;
        const dateB = new Date(b.review.date).getTime() || 0;
        return dateB - dateA;
      }
      if (reviewsSortOrder === "oldest") {
        const dateA = new Date(a.review.date).getTime() || 0;
        const dateB = new Date(b.review.date).getTime() || 0;
        return dateA - dateB;
      }
      if (reviewsSortOrder === "highest") {
        return b.review.rating - a.review.rating;
      }
      if (reviewsSortOrder === "lowest") {
        return a.review.rating - b.review.rating;
      }
      return 0;
    });
  }, [allReviews, reviewsSearch, reviewsSentimentFilter, reviewsRatingFilter, reviewsTypeFilter, reviewsStoreFilter, reviewsSortOrder]);

  const handleDeleteReview = (agg: AggregatedReview) => {
    setConfirmModalState({
      title: "Delete Customer Review",
      subtitle: `Author: ${agg.review.author} • Store: ${agg.storeName}`,
      description: `Are you sure you want to permanently delete this ${agg.type} review by "${agg.review.author}"? This moderation action cannot be undone.`,
      confirmLabel: "Delete Review",
      variant: "danger",
      onConfirm: () => {
        setStores((prev) =>
          prev.map((store) => {
            if (store.id !== agg.storeId) return store;

            if (agg.type === "store") {
              return {
                ...store,
                reviews: store.reviews.filter((r) => r.id !== agg.review.id),
              };
            } else if (agg.type === "product" && agg.productId) {
              return {
                ...store,
                products: store.products.map((prod) => {
                  if (prod.id !== agg.productId) return prod;
                  return {
                    ...prod,
                    reviews: prod.reviews.filter((r) => r.id !== agg.review.id),
                  };
                }),
              };
            }
            return store;
          })
        );
        setConfirmModalState(null);
        showAdminToast("Review removed from platform.");
      },
    });
  };

  const startReplyingReview = (agg: AggregatedReview) => {
    setReplyingReviewId(agg.review.id);
    setReplyText(agg.review.reply || "");
  };

  const handleSaveReply = (agg: AggregatedReview) => {
    setStores((prev) =>
      prev.map((store) => {
        if (store.id !== agg.storeId) return store;

        if (agg.type === "store") {
          return {
            ...store,
            reviews: store.reviews.map((r) =>
              r.id === agg.review.id ? { ...r, reply: replyText.trim() || undefined } : r
            ),
          };
        } else if (agg.type === "product" && agg.productId) {
          return {
            ...store,
            products: store.products.map((prod) => {
              if (prod.id !== agg.productId) return prod;
              return {
                ...prod,
                reviews: prod.reviews.map((r) =>
                  r.id === agg.review.id ? { ...r, reply: replyText.trim() || undefined } : r
                ),
              };
            }),
          };
        }
        return store;
      })
    );
    setReplyingReviewId(null);
    setReplyText("");
  };

  const startEditingReview = (agg: AggregatedReview) => {
    setEditingReviewId(agg.review.id);
    setEditReviewForm({
      comment: agg.review.comment,
      rating: agg.review.rating,
      sentiment: agg.review.sentiment || "positive",
    });
  };

  const handleSaveEdit = (agg: AggregatedReview) => {
    if (!editReviewForm.comment.trim()) {
      showAdminToast("Review comment cannot be empty.", "error");
      return;
    }

    setStores((prev) =>
      prev.map((store) => {
        if (store.id !== agg.storeId) return store;

        if (agg.type === "store") {
          return {
            ...store,
            reviews: store.reviews.map((r) =>
              r.id === agg.review.id
                ? { ...r, comment: editReviewForm.comment.trim(), rating: editReviewForm.rating, sentiment: editReviewForm.sentiment }
                : r
            ),
          };
        } else if (agg.type === "product" && agg.productId) {
          return {
            ...store,
            products: store.products.map((prod) => {
              if (prod.id !== agg.productId) return prod;
              return {
                ...prod,
                reviews: prod.reviews.map((r) =>
                  r.id === agg.review.id
                    ? { ...r, comment: editReviewForm.comment.trim(), rating: editReviewForm.rating, sentiment: editReviewForm.sentiment }
                    : r
                ),
              };
            }),
          };
        }
        return store;
      })
    );
    setEditingReviewId(null);
  };

  // Derived Platform Metrics for the Redesigned Control Center (100% Real Platform State)
  const activeStoresCount = useMemo(() => {
    return stores.filter((s) => s.verified || (s.products && s.products.length > 0)).length;
  }, [stores]);

  const inactiveStoresCount = useMemo(() => {
    return Math.max(0, stores.length - activeStoresCount);
  }, [stores.length, activeStoresCount]);

  const subscriptionBreakdown = useMemo(() => {
    let pro = 0;
    let growth = 0;
    let starter = 0;
    stores.forEach((s) => {
      const tier = s.premiumTier || s.subscriptionTier || "Starter";
      if (tier === "Pro" || tier === "Pro Plus" || tier === "Premium" || tier === "Premium Plus") {
        pro++;
      } else if (tier === "Growth" || tier === "Basic") {
        growth++;
      } else {
        starter++;
      }
    });
    return { pro, growth, starter };
  }, [stores]);

  const registeredUsersCount = useMemo(() => {
    const uniqueActors = new Set<string>();
    stores.forEach((s) => {
      uniqueActors.add(`merchant:${s.id}`);
      if (s.contact?.email) uniqueActors.add(s.contact.email.toLowerCase());
    });
    orders.forEach((o) => {
      if (o.shopper?.name) uniqueActors.add(`customer:${o.shopper.name.toLowerCase()}`);
      if (o.shopper?.phone) uniqueActors.add(`phone:${o.shopper.phone}`);
    });
    allReviews.forEach((r) => {
      if (r.review.author) uniqueActors.add(`reviewer:${r.review.author.toLowerCase()}`);
    });
    return Math.max(uniqueActors.size, stores.length + orders.length);
  }, [stores, orders, allReviews]);

  const lowStockProductsCount = useMemo(() => {
    return allProducts.filter((item) => (item.product.stock ?? 10) <= 3).length;
  }, [allProducts]);

  const actionableNotifications = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      detail: string;
      severity: "warning" | "info" | "success";
      targetTab: AdminTabId;
      actionLabel: string;
    }> = [];

    if (orderDistributionByStatus.pending > 0) {
      items.push({
        id: "notif-pending-orders",
        title: `${orderDistributionByStatus.pending} orders pending merchant verification`,
        detail: "Review fulfillment queue and order mode policies across stores.",
        severity: "warning",
        targetTab: "orders",
        actionLabel: "View Orders",
      });
    }

    if (pendingModels.length > 0) {
      items.push({
        id: "notif-pending-models",
        title: `${pendingModels.length} merchant brand/model submissions awaiting approval`,
        detail: "Inspect submitted device models in the Verified Brands registry.",
        severity: "warning",
        targetTab: "brands",
        actionLabel: "Review Models",
      });
    }

    if (inactiveStoresCount > 0) {
      items.push({
        id: "notif-unverified-stores",
        title: `${inactiveStoresCount} stores unverified or without active catalog items`,
        detail: "Verify merchant profiles or assist onboarding in Stores Registry.",
        severity: "info",
        targetTab: "stores",
        actionLabel: "Inspect Stores",
      });
    }

    if (lowStockProductsCount > 0) {
      items.push({
        id: "notif-low-stock",
        title: `${lowStockProductsCount} catalog products running low on inventory (≤ 3 units)`,
        detail: "Monitor stock levels across merchant catalogs to prevent stockouts.",
        severity: "info",
        targetTab: "products",
        actionLabel: "Check Catalog",
      });
    }

    if (globalAnnouncement && globalAnnouncement.trim().length > 0) {
      items.push({
        id: "notif-announcement-live",
        title: "Global marketplace announcement banner is active",
        detail: globalAnnouncement,
        severity: "success",
        targetTab: "settings",
        actionLabel: "Manage Banner",
      });
    }

    return items;
  }, [orderDistributionByStatus.pending, pendingModels.length, inactiveStoresCount, lowStockProductsCount, globalAnnouncement]);

  // Sidebar Navigation Groups (MAIN, PLATFORM MANAGEMENT, PLATFORM OPERATIONS, SYSTEM MANAGEMENT)
  const sidebarGroups = useMemo(() => [
    {
      id: "main",
      label: "MAIN",
      items: [
        {
          id: "overview" as AdminTabId,
          label: "Dashboard",
          description: "Executive platform overview, KPIs, revenue analytics, and live alerts",
          icon: LayoutDashboard,
          badge: null,
        },
      ],
    },
    {
      id: "platform_management",
      label: "PLATFORM MANAGEMENT",
      items: [
        {
          id: "stores" as AdminTabId,
          label: "Stores",
          description: "",
          icon: Store,
          badge: totalStores,
        },
        {
          id: "subscriptions" as AdminTabId,
          label: "Subscriptions",
          description: "Subscription plans, billing tiers, and merchant membership distribution",
          icon: CreditCard,
          badge: `${subscriptionBreakdown.pro} Pro`,
        },
        {
          id: "permissions" as AdminTabId,
          label: "Permissions",
          description: "Subscription plan feature permissions across Profile Store, Manage Stories, and Orders",
          icon: Key,
          badge: "4 Plans",
        },
        {
          id: "products" as AdminTabId,
          label: "Products",
          description: "Cross-store product catalog moderation, pricing, and inventory oversight",
          icon: Layers,
          badge: totalProducts,
        },
        {
          id: "categories" as AdminTabId,
          label: "Categories",
          description: "Departments, subcategories, size systems, and technical spec templates",
          icon: Palette,
          badge: mainCategories.length,
        },
        {
          id: "brands" as AdminTabId,
          label: "Brands",
          description: "Official brand registry, approved device models, and merchant submissions",
          icon: Smartphone,
          badge: pendingModels.length > 0 ? `${pendingModels.length} New` : brands.length || null,
        },
        {
          id: "cover_templates" as AdminTabId,
          label: "Cover Templates",
          description: "Boutique storefront hero cover templates and visual preset themes",
          icon: SparklesIcon,
          badge: coverTemplates.length,
        },
      ],
    },
    {
      id: "platform_operations",
      label: "PLATFORM OPERATIONS",
      items: [
        {
          id: "orders" as AdminTabId,
          label: "Orders & Shipping",
          description: "Platform-wide order fulfillment pipeline, status distribution, and mode policies",
          icon: ShoppingCart,
          badge: orders.length,
        },
        {
          id: "reviews" as AdminTabId,
          label: "Reviews & Moderation",
          description: "Customer store and product reviews moderation, sentiment filter, and replies",
          icon: MessageSquare,
          badge: allReviews.length,
        },
        {
          id: "global_markets" as AdminTabId,
          label: "Global Markets & Culture",
          description: "Multi-country markets, cultural identity packs, event calendars, and campaigns",
          icon: Globe,
          badge: "Multi-Market",
        },
        {
          id: "domains" as AdminTabId,
          label: "Custom Domains",
          description: "Merchant custom hostname routing, SSL status, and plan domain limits",
          icon: Globe2,
          badge: allPlatformDomains.length,
        },
      ],
    },
    {
      id: "system_management",
      label: "SYSTEM MANAGEMENT",
      items: [
        {
          id: "ai_features" as AdminTabId,
          label: "Feature Flags & AI",
          description: "Visual AI camera identifier, geolocation toggles, and multi-LLM provider hub",
          icon: Cpu,
          badge: activeAiModel.split(" ")[0],
        },
        {
          id: "activity_logs" as AdminTabId,
          label: "Activity Logs",
          description: "Real-time platform event stream, audit trail, and operational diagnostics",
          icon: Activity,
          badge: null,
        },
        {
          id: "security" as AdminTabId,
          label: "Security & Access",
          description: "Super Admin authentication credentials and platform access protection",
          icon: Shield,
          badge: null,
        },
        {
          id: "phase3_readiness" as AdminTabId,
          label: "Phase 3: Scale & Infra",
          description: "Home-server sovereignty, 2,500–10,000 CCU topology, R2 media edge, and concurrency lab",
          icon: Activity,
          badge: "96%",
        },
        {
          id: "settings" as AdminTabId,
          label: "Settings",
          description: "Platform commission fee, global announcement banner, and animation timing",
          icon: Settings,
          badge: `${platformCommission}%`,
        },
      ],
    },
  ], [
    totalStores,
    subscriptionBreakdown.pro,
    totalProducts,
    mainCategories.length,
    pendingModels.length,
    brands.length,
    coverTemplates.length,
    orders.length,
    allReviews.length,
    allPlatformDomains.length,
    activeAiModel,
    platformCommission,
  ]);

  const activeNavMeta = useMemo(() => {
    for (const group of sidebarGroups) {
      for (const item of group.items) {
        if (item.id === adminTab) {
          return { ...item, groupLabel: group.label };
        }
      }
    }
    return {
      id: "overview" as AdminTabId,
      label: "Dashboard",
      description: "Executive platform overview and operational control center",
      icon: LayoutDashboard,
      badge: null,
      groupLabel: "MAIN",
    };
  }, [sidebarGroups, adminTab]);

  // Render Full-Screen Login Shell if not logged in
  if (!isAdminLoggedIn) {
    return (
      <div className={`min-h-screen w-full ${YUME_ADMIN_TOKENS.canvasClass} flex flex-col justify-between font-sans yume-admin-typography leading-normal`}>
        {/* Top bar for Login screen matching Merchant Space Header */}
        <header
          id="main-studio-header"
          style={{
            backgroundColor:
              "var(--yume-theme-header-color, " +
              (darkMode ? YUME_ADMIN_TOKENS.headerAndSidebarBgDark : YUME_ADMIN_TOKENS.headerAndSidebarBgLight) +
              ")",
          }}
          className="w-full shrink-0 z-50 transition-colors duration-700 border-b border-white/10 py-2 px-3 sm:px-4 md:px-5 md:pt-[13px] md:pb-3"
        >
          <div className="w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {onExitAdmin && (
                <>
                  <button
                    type="button"
                    onClick={onExitAdmin}
                    className="h-8 px-3 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Back to Marketplace</span>
                  </button>
                  <span className="h-4 w-px bg-white/20 hidden sm:inline-block" />
                </>
              )}
              <YumeLogo
                variant="compact"
                theme="dark"
                accentColor={currentSlideColor || "#ff385c"}
              />
              <span className="text-white/40 font-light hidden md:inline">/</span>
              <span className="text-xs font-medium text-white/90 hidden md:inline">
                Platform Owner Sign In
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-white/85 border border-white/15">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Admin Security Gate</span>
              </div>
              {setDarkMode && (
                <ThemeToggle darkMode={Boolean(darkMode)} setDarkMode={setDarkMode} />
              )}
              {onExitAdmin && (
                <button
                  type="button"
                  onClick={onExitAdmin}
                  className="h-8 px-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-lg overflow-hidden"
          >
            <div className="p-7 pb-5 bg-stone-50/60 dark:bg-slate-950/60 text-center border-b border-stone-200/80 dark:border-slate-800">
              <div className="flex justify-center mb-4">
                <YumeLogo
                  variant="full"
                  size="md"
                  theme={darkMode ? "dark" : "light"}
                  accentColor={currentSlideColor || "#ff385c"}
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-[#1e2631] dark:bg-sky-400" />
                <h2 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight leading-snug">
                  Platform Owner Sign In
                </h2>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-1.5 font-sans font-medium">
                Super Admin authorization required to access the YUME Platform Control Center.
              </p>
            </div>

            <form onSubmit={handleLogin} className="p-7 flex flex-col gap-5">
              {errorMsg && (
                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex flex-col text-left">
                <label className={YUME_ADMIN_TOKENS.labelClass}>
                  Admin Username <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    placeholder="e.g. admin"
                    className={`${YUME_ADMIN_TOKENS.monoInputClass} pl-10 pr-4`}
                  />
                </div>
              </div>

              <div className="flex flex-col text-left">
                <label className={YUME_ADMIN_TOKENS.labelClass}>
                  Security Password <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="••••••••••••"
                    className={`${YUME_ADMIN_TOKENS.monoInputClass} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-white transition-all cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`${YUME_ADMIN_TOKENS.primaryButtonClass} w-full py-3 mt-1`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In to Platform Admin</span>
              </button>

              <div className="border-t border-stone-200/80 dark:border-slate-800 pt-4 text-center">
                <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">
                  Default Credentials: <code className="font-bold bg-stone-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-stone-800 dark:text-slate-200 font-sans">admin</code> · <code className="font-bold bg-stone-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-stone-800 dark:text-slate-200 font-sans">algeria2026</code>
                </span>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  const ActiveSectionIcon = activeNavMeta.icon;

  // Standardized Emerald-Teal active state matching Merchant Space "Add Product" item
  const getSidebarItemActiveClass = (_tabId: AdminTabId) => {
    return "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] font-bold scale-[1.01]";
  };

  // Full-Viewport Platform Admin Dashboard Shell (Merchant Space Add New Product Visual System)
  return (
    <div className={`h-screen w-full overflow-hidden flex flex-col ${YUME_ADMIN_TOKENS.canvasClass} font-sans yume-admin-typography leading-normal select-none`}>
      {/* 1. TOP STUDIO HEADER (Matches Merchant Space #main-studio-header) */}
      <header
        id="main-studio-header"
        style={{
          backgroundColor:
            "var(--yume-theme-header-color, " +
            (darkMode ? YUME_ADMIN_TOKENS.headerAndSidebarBgDark : YUME_ADMIN_TOKENS.headerAndSidebarBgLight) +
            ")",
        }}
        className="w-full shrink-0 z-50 transition-colors duration-700 border-b border-white/10 py-2 px-3 sm:px-4 md:px-5 md:pt-[13px] md:pb-3"
      >
        <div className="w-full flex items-center justify-between gap-2">
          {/* Left: Mobile Menu + Back Pill Button + YumeLogo + / + Section Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden h-8 w-8 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 flex items-center justify-center transition-all cursor-pointer shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (adminTab !== "overview") {
                  setAdminTab("overview");
                } else if (onExitAdmin) {
                  onExitAdmin();
                }
              }}
              className="h-8 px-3 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {adminTab !== "overview" ? "Back to Dashboard" : "Back to Marketplace"}
              </span>
            </button>

            <span className="h-4 w-px bg-white/20 hidden sm:inline-block shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              <YumeLogo
                variant="compact"
                theme="dark"
                accentColor={currentSlideColor || "#ff385c"}
              />
              <span className="text-white/40 font-light hidden md:inline">/</span>
              <span className="text-xs font-medium text-white/90 hidden md:inline truncate">
                {activeNavMeta.label}
              </span>
            </div>
          </div>

          {/* Middle: 4 Symbol Shortcut Controls (Matching Merchant Space Studio Controls) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 1. View Mode Segmented Control (Centered 1100px vs Expanded 1440px) */}
            <div className="inline-flex h-9 p-0.5 bg-black/20 dark:bg-slate-900/40 rounded-xl border border-white/20 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setIsFullBleedLayout(false)}
                className={`px-2.5 h-full rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                  !isFullBleedLayout
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
                title="Standard Centered Layout (1100px)"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsFullBleedLayout(true)}
                className={`px-2.5 h-full rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                  isFullBleedLayout
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
                title="Expanded Layout (1440px)"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Focus Mode / Collapse Sidebar Toggle */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className={`h-9 w-9 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                isSidebarCollapsed
                  ? "bg-white text-slate-900 border-white shadow-xs"
                  : "bg-white/15 hover:bg-white/25 text-white border-white/20"
              }`}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Focus Mode (Collapse Sidebar)"}
            >
              {isSidebarCollapsed ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* 3. Sync / Refresh Platform Data Button */}
            <button
              type="button"
              onClick={() => {
                fetchBrandsFromFirestore().then(setBrands).catch(() => {});
                fetchPendingModelsFromFirestore().then(setPendingModels).catch(() => {});
              }}
              className="h-9 w-9 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer"
              title="Refresh & Sync Platform Registry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* 4. Platform Notifications Popover Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                className={`relative h-9 w-9 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                  isNotificationsOpen
                    ? "bg-white text-slate-900 border-white shadow-xs"
                    : "bg-white/15 hover:bg-white/25 text-white border-white/20"
                }`}
                title="Important Platform Notifications"
              >
                <Bell className="w-3.5 h-3.5" />
                {actionableNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-sans tabular-nums font-black bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    {actionableNotifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsNotificationsOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden text-left"
                    >
                      <div className="px-4 py-3 border-b border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900 dark:text-white">
                          Platform Notifications ({actionableNotifications.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAdminTab("activity_logs");
                            setIsNotificationsOpen(false);
                          }}
                          className="text-[11px] font-bold text-[#1e2631] dark:text-sky-400 hover:underline cursor-pointer"
                        >
                          Activity Logs
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-slate-800">
                        {actionableNotifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-stone-500 dark:text-slate-400">
                            All platform operations are nominal.
                          </div>
                        ) : (
                          actionableNotifications.map((item) => (
                            <div
                              key={item.id}
                              className="p-3.5 hover:bg-stone-50 dark:hover:bg-slate-800/50 transition-colors flex items-start justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-stone-900 dark:text-white">
                                  {item.title}
                                </div>
                                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                  {item.detail}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminTab(item.targetTab);
                                  setIsNotificationsOpen(false);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 text-[10px] font-bold shrink-0 cursor-pointer"
                              >
                                {item.actionLabel}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Live Status Pill + ThemeToggle + Exit Button */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-white/85 border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {adminTab === "overview"
                  ? "Platform Live"
                  : adminTab === "stores"
                  ? `${activeStoresCount} Active Stores`
                  : adminTab === "products"
                  ? `${totalProducts} Products Synced`
                  : adminTab === "orders"
                  ? `${orders.length} Orders Synced`
                  : "Live Sync Active"}
              </span>
            </div>

            {setDarkMode && (
              <ThemeToggle darkMode={Boolean(darkMode)} setDarkMode={setDarkMode} />
            )}

            <button
              type="button"
              onClick={() => {
                if (onExitAdmin) {
                  onExitAdmin();
                } else {
                  setAdminTab("overview");
                }
              }}
              className="h-8 px-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
              title="Exit Platform Admin"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY ROW: LEFT SIDEBAR (#yume-styled-sidebar) + MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Backdrop */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* A. LEFT SIDEBAR (Matches Merchant Space #yume-styled-sidebar) */}
        <aside
          id="yume-styled-sidebar"
          style={{
            backgroundColor:
              "var(--yume-theme-header-color, " +
              (darkMode ? YUME_ADMIN_TOKENS.headerAndSidebarBgDark : YUME_ADMIN_TOKENS.headerAndSidebarBgLight) +
              ")",
          }}
          className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col justify-between border-r border-slate-200/20 dark:border-slate-800/50 transition-all duration-300 shrink-0 text-left select-none text-white overflow-y-auto scrollbar-none ${
            isMobileSidebarOpen ? "translate-x-0 w-64 p-5" : "-translate-x-full lg:translate-x-0"
          } ${isSidebarCollapsed ? "lg:w-[76px] lg:p-3" : "lg:w-64 lg:p-5"}`}
        >
          <div className="space-y-4">
            {/* Brand Header matching Merchant Space */}
            <div className="flex items-center justify-between gap-2 px-2 pb-2 border-b border-white/20">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-5 h-5 text-white animate-dashboard-pulse-grow shrink-0" />
                {!isSidebarCollapsed && (
                  <h3 className="font-display font-black text-white text-sm tracking-tight uppercase leading-none truncate">
                    PLATFORM ADMIN
                  </h3>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="hidden lg:flex h-6 w-6 rounded-lg items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-3.5 h-3.5" />
                ) : (
                  <PanelLeftClose className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden h-6 w-6 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Quick Module Filter (when expanded) */}
            {!isSidebarCollapsed && (
              <div className="relative px-1">
                <Search className="w-3.5 h-3.5 text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sidebarSearchQuery}
                  onChange={(e) => setSidebarSearchQuery(e.target.value)}
                  placeholder="Filter modules..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-medium text-white placeholder:text-white/50 outline-none focus:border-white/35 focus:bg-white/15 transition-colors"
                />
                {sidebarSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSidebarSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Sidebar Navigation Groups */}
            <div className="space-y-4">
              {sidebarGroups.map((group) => {
                const visibleItems = group.items.filter((item) => {
                  if (!sidebarSearchQuery.trim()) return true;
                  const q = sidebarSearchQuery.toLowerCase();
                  return (
                    item.label.toLowerCase().includes(q) ||
                    item.description.toLowerCase().includes(q) ||
                    group.label.toLowerCase().includes(q)
                  );
                });
                if (visibleItems.length === 0) return null;

                return (
                  <div key={group.id} className="space-y-1.5">
                    {!isSidebarCollapsed ? (
                      <div className="px-3 pt-1 pb-0.5 text-[10px] font-black tracking-wider text-white/45 uppercase">
                        {group.label}
                      </div>
                    ) : (
                      <div className="h-px bg-white/15 mx-2 my-2" />
                    )}

                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = adminTab === item.id;
                      const isNewOrTagBadge =
                        typeof item.badge === "string" &&
                        (item.badge === "Multi-Market" ||
                          item.badge.includes("New") ||
                          item.badge.includes("Pro") ||
                          item.id === "ai_features");
                      const isAlertBadge =
                        item.id === "brands" && pendingModels.length > 0;

                      return (
                        <div key={item.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminTab(item.id);
                              setIsMobileSidebarOpen(false);
                            }}
                            title={
                              isSidebarCollapsed
                                ? item.description
                                  ? `${item.label} — ${item.description}`
                                  : `${item.label} (${item.badge ?? ""})`
                                : undefined
                            }
                            className={`w-full flex items-center ${
                              isSidebarCollapsed
                                ? "justify-center px-2 py-2.5"
                                : "justify-between px-3 py-2.5"
                            } rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer group ${
                              isActive
                                ? getSidebarItemActiveClass(item.id)
                                : isAlertBadge
                                ? "border border-amber-500/60 bg-amber-500/10 text-white hover:bg-amber-500/20 hover:translate-x-1"
                                : "text-white/85 hover:bg-white/10 hover:text-white hover:translate-x-1"
                            }`}
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <Icon
                                className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                                  isActive
                                    ? "scale-110 text-white"
                                    : isAlertBadge
                                    ? "text-amber-400"
                                    : "text-white/80 group-hover:scale-110 group-hover:text-white"
                                }`}
                              />
                              {!isSidebarCollapsed && (
                                <span className="truncate whitespace-nowrap">
                                  {item.label}
                                </span>
                              )}
                            </span>

                            {!isSidebarCollapsed && item.badge !== null && (
                              <span
                                className={
                                  isAlertBadge
                                    ? "text-[10px] font-black font-sans tabular-nums px-2 py-0.5 rounded-full transition-colors bg-rose-500 text-white shadow-sm shrink-0"
                                    : isNewOrTagBadge
                                    ? `text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md transition-colors shrink-0 ${
                                        isActive
                                          ? "bg-white text-emerald-700 shadow-xs"
                                          : "bg-white/15 text-white/90 border border-white/20"
                                      }`
                                    : `text-[10px] font-black font-sans tabular-nums px-2 py-0.5 rounded-full transition-colors shrink-0 ${
                                        isActive
                                          ? "bg-white text-slate-900 shadow-xs"
                                          : "bg-white/20 text-white"
                                      }`
                                }
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>

                          {/* When Stores is selected, show focused Stores sub-navigation items */}
                          {item.id === "stores" && isActive && !isSidebarCollapsed && (
                            <div className="pl-7 pr-1 py-1 space-y-1 border-l border-white/15 ml-4">
                              {(
                                [
                                  {
                                    id: "registry",
                                    label: "Merchant Store Registry",
                                  },
                                  {
                                    id: "verification",
                                    label: "Verification Status",
                                  },
                                  {
                                    id: "plans",
                                    label: "Plans & Tiers",
                                  },
                                  {
                                    id: "directions",
                                    label: "Store Directions",
                                  },
                                ] as const
                              ).map((sub) => {
                                const isSubActive = storesSubNav === sub.id;
                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => setStoresSubNav(sub.id)}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer truncate whitespace-nowrap ${
                                      isSubActive
                                        ? "bg-white/15 text-white font-bold"
                                        : "text-white/65 hover:text-white hover:bg-white/10"
                                    }`}
                                  >
                                    {sub.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Bottom Section (Matches Merchant Space bottom section) */}
          <div className="pt-4 mt-4 border-t border-white/20 space-y-2 shrink-0">
            {!isSidebarCollapsed ? (
              <>
                {onOpenMerchant && (
                  <button
                    type="button"
                    onClick={onOpenMerchant}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-white/85 hover:bg-white/10 hover:text-white hover:translate-x-1 transition-all duration-300 cursor-pointer group"
                  >
                    <span className="flex items-center gap-2.5">
                      <Store className="w-4 h-4 text-white/80 group-hover:text-white transition-transform duration-300 group-hover:scale-110" />
                      <span>Merchant Space</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </button>
                )}

                <div className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-black text-white border border-slate-700/80 shadow-md transition-all duration-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate font-extrabold">@{adminUsername}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      OK
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    title={t("logout")}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {onOpenMerchant && (
                  <button
                    type="button"
                    onClick={onOpenMerchant}
                    className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Switch to Merchant Space"
                  >
                    <Store className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onLogout}
                  className="h-9 w-9 rounded-xl bg-slate-900/90 hover:bg-black border border-slate-700/80 text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                  title={t("logout")}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* C. ADAPTIVE MAIN CONTENT VIEWPORT (Matches Add New Product clean white canvas & 1100px/1440px container) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <div
            className={`${
              isFullBleedLayout ? "max-w-[1440px]" : "max-w-[1100px]"
            } mx-auto w-full flex flex-col gap-6 transition-all duration-300`}
          >
            {adminActionToast && (
              <div
                className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl border ${
                  adminActionToast.type === "error"
                    ? "bg-rose-950 text-rose-100 border-rose-700/60"
                    : "bg-[#1e2631] text-white border-white/15"
                }`}
              >
                {adminActionToast.type === "error" ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>{adminActionToast.text}</span>
              </div>
            )}

            <YumeAdminConfirmModal
              isOpen={!!confirmModalState}
              title={confirmModalState?.title || ""}
              subtitle={confirmModalState?.subtitle}
              description={confirmModalState?.description || ""}
              confirmLabel={confirmModalState?.confirmLabel || "Confirm"}
              variant={confirmModalState?.variant || "danger"}
              onConfirm={() => confirmModalState?.onConfirm()}
              onCancel={() => setConfirmModalState(null)}
            />

            {/* CENTRAL GOVERNANCE: Merchant Enforcement, Entitlement Overrides & Appeals Modal */}
            {governingStoreId && (() => {
              const targetStore = stores.find((s) => s.id === governingStoreId);
              if (!targetStore) return null;
              const currentEnf = getStoreEnforcement(targetStore);
              const pendingAppeal = (currentEnf.appeals || []).find(
                (a) => a.status === "pending_review"
              );
              return (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-5 text-left my-8">
                    <YumeAdminSectionHeader
                      title={`Merchant Governance & Enforcement: ${targetStore.name}`}
                      subtitle={`Store ID: ${targetStore.id} · Canonical Plan: ${resolveStoreSubscriptionPlan(targetStore)} · Active Admin Role: ${PLATFORM_ADMIN_ROLES[activeAdmin.roleId]?.name}`}
                      rightContent={
                        <button
                          type="button"
                          onClick={() => setGoverningStoreId(null)}
                          className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                        >
                          <X className="w-4 h-4" />
                          <span>Close</span>
                        </button>
                      }
                    />

                    {/* Pending Appeal Review Box (if merchant submitted an appeal) */}
                    {pendingAppeal && (
                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Pending Merchant Appeal (#{pendingAppeal.id})</span>
                          </span>
                          <span className="text-[11px] font-sans text-amber-700 dark:text-amber-400">
                            Submitted {new Date(pendingAppeal.submittedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-stone-800 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                          &ldquo;{pendingAppeal.merchantStatement}&rdquo;
                        </p>
                        <div className="space-y-2">
                          <label className={YUME_ADMIN_TOKENS.labelClass}>
                            Resolution Notes (sent to Merchant Space)
                          </label>
                          <input
                            type="text"
                            value={enforcementDraft.appealResolutionNotes}
                            onChange={(e) =>
                              setEnforcementDraft((prev) => ({
                                ...prev,
                                appealResolutionNotes: e.target.value,
                              }))
                            }
                            placeholder="Explain why the appeal is approved or declined..."
                            className={YUME_ADMIN_TOKENS.inputClass}
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleResolveStoreAppeal(targetStore, "rejected")}
                            className={YUME_ADMIN_TOKENS.dangerButtonClass}
                          >
                            Reject Appeal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolveStoreAppeal(targetStore, "approved")}
                            className={YUME_ADMIN_TOKENS.emeraldButtonClass}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Appeal &amp; Restore Store</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 1. 4-Stage Enforcement Ladder */}
                    <div className={YUME_ADMIN_TOKENS.innerPanelClass}>
                      <div className="text-xs font-bold text-stone-900 dark:text-white mb-2">
                        1. Progressive Enforcement State (Active · Warning · Restricted · Suspended · Terminated)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className={YUME_ADMIN_TOKENS.labelClass}>
                            Account Enforcement Stage
                          </label>
                          <select
                            value={enforcementDraft.state}
                            onChange={(e) =>
                              setEnforcementDraft((prev) => ({
                                ...prev,
                                state: e.target.value as MerchantEnforcementState,
                              }))
                            }
                            className={YUME_ADMIN_TOKENS.selectClass}
                          >
                            <option value="active">Active (Good Standing)</option>
                            <option value="warning">Stage 1: Formal Warning Banner</option>
                            <option value="restricted">Stage 2: Capability Restriction</option>
                            <option value="suspended">
                              Stage 3: Suspended (Hide Storefront + Block Checkout + Read-Only Space)
                            </option>
                            <option value="terminated">
                              Stage 4: Terminated (Permanent Marketplace Removal)
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className={YUME_ADMIN_TOKENS.labelClass}>
                            Policy Reference Code
                          </label>
                          <select
                            value={enforcementDraft.policyReference}
                            onChange={(e) =>
                              setEnforcementDraft((prev) => ({
                                ...prev,
                                policyReference: e.target.value,
                              }))
                            }
                            className={YUME_ADMIN_TOKENS.selectClass}
                          >
                            <option value="POL-MARKET-01">POL-MARKET-01 · General Marketplace Integrity</option>
                            <option value="POL-COUNTERFEIT-02">POL-COUNTERFEIT-02 · Counterfeit / IP Violation</option>
                            <option value="POL-PROHIBITED-03">POL-PROHIBITED-03 · Prohibited / Hazardous Item</option>
                            <option value="POL-FULFILLMENT-04">POL-FULFILLMENT-04 · High Order Cancellation / SLA Breach</option>
                            <option value="POL-BILLING-05">POL-BILLING-05 · Subscription Billing Delinquency</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className={YUME_ADMIN_TOKENS.labelClass}>
                          Enforcement Reason (Displayed to Merchant in Merchant Space)
                        </label>
                        <input
                          type="text"
                          value={enforcementDraft.reason}
                          onChange={(e) =>
                            setEnforcementDraft((prev) => ({
                              ...prev,
                              reason: e.target.value,
                            }))
                          }
                          placeholder="State clear policy reason and remediation steps required..."
                          className={YUME_ADMIN_TOKENS.inputClass}
                        />
                      </div>

                      {enforcementDraft.state === "restricted" && (
                        <div className="mt-3 pt-3 border-t border-stone-200/80 dark:border-slate-800">
                          <label className={YUME_ADMIN_TOKENS.labelClass}>
                            Restricted Capabilities (Stage 2 Selective Lock)
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5 text-xs">
                            {(
                              [
                                { id: "create_products", label: "Block Product Creation" },
                                { id: "launch_ads", label: "Block YUME Ads" },
                                { id: "publish_stories", label: "Block Story Publishing" },
                                { id: "connect_domains", label: "Block Custom Domains" },
                                { id: "accept_new_checkouts", label: "Block New Checkouts" },
                              ] as const
                            ).map((cap) => {
                              const checked =
                                enforcementDraft.restrictedCapabilities.includes(cap.id);
                              return (
                                <label
                                  key={cap.id}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const next = e.target.checked
                                        ? [...enforcementDraft.restrictedCapabilities, cap.id]
                                        : enforcementDraft.restrictedCapabilities.filter(
                                            (c) => c !== cap.id
                                          );
                                      setEnforcementDraft((prev) => ({
                                        ...prev,
                                        restrictedCapabilities: next,
                                      }));
                                    }}
                                  />
                                  <span className="font-semibold text-stone-700 dark:text-slate-300">
                                    {cap.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {enforcementDraft.state === "suspended" && (
                        <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-[11px] text-rose-800 dark:text-rose-300 font-medium">
                          <strong>Confirmed Runtime Suspension Rule:</strong> Public storefront &amp; products are hidden immediately, new checkouts are blocked client &amp; server-side, Merchant Space enters Read-Only mode for catalog/campaigns, and existing active orders remain accessible for fulfillment.
                        </div>
                      )}
                    </div>

                    {/* 2. Per-Merchant Entitlement Overrides & Subscription Billing Status */}
                    <div className={YUME_ADMIN_TOKENS.innerPanelClass}>
                      <div className="text-xs font-bold text-stone-900 dark:text-white mb-2">
                        2. Individual Merchant Entitlement Overrides &amp; Subscription Status
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400 mb-3">
                        Leave quota fields blank to inherit baseline entitlements from the merchant&apos;s canonical <strong>{resolveStoreSubscriptionPlan(targetStore)}</strong> plan.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className={YUME_ADMIN_TOKENS.labelClass}>
                            Billing Status
                          </label>
                          <select
                            value={enforcementDraft.billingStatus}
                            onChange={(e) =>
                              setEnforcementDraft((prev) => ({
                                ...prev,
                                billingStatus: e.target.value as any,
                              }))
                            }
                            className={YUME_ADMIN_TOKENS.selectClass}
                          >
                            <option value="active">Active</option>
                            <option value="trial">Trial Period</option>
                            <option value="past_due">Past Due</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div>
                          <label className={YUME_ADMIN_TOKENS.labelClass}>
                            Override Max Products
                          </label>
                          <input
                            type="number"
                            min={1}
                            placeholder="Plan Default"
                            value={enforcementDraft.maxActiveProducts}
                            onChange={(e) =>
                              setEnforcementDraft((prev) => ({
                                ...prev,
                                maxActiveProducts: e.target.value,
                              }))
                            }
                            className={YUME_ADMIN_TOKENS.monoInputClass}
                          />
                        </div>
                        <div>
                          <label className={YUME_ADMIN_TOKENS.labelClass}>
                            Override Max Domains
                          </label>
                          <input
                            type="number"
                            min={0}
                            placeholder="Plan Default"
                            value={enforcementDraft.maxCustomDomains}
                            onChange={(e) =>
                              setEnforcementDraft((prev) => ({
                                ...prev,
                                maxCustomDomains: e.target.value,
                              }))
                            }
                            className={YUME_ADMIN_TOKENS.monoInputClass}
                          />
                        </div>
                        <div>
                          <label className={YUME_ADMIN_TOKENS.labelClass}>
                            Override Sponsored Ads
                          </label>
                          <input
                            type="number"
                            min={0}
                            placeholder="Plan Default"
                            value={enforcementDraft.maxSponsoredAdSlots}
                            onChange={(e) =>
                              setEnforcementDraft((prev) => ({
                                ...prev,
                                maxSponsoredAdSlots: e.target.value,
                              }))
                            }
                            className={YUME_ADMIN_TOKENS.monoInputClass}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-200/80 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setGoverningStoreId(null)}
                        className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveStoreGovernance}
                        className={YUME_ADMIN_TOKENS.primaryButtonClass}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Apply Governance &amp; Audit Log</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Contextual Module Header Card (Streamlined on Stores & delegated sub-modules to prevent double headers and remove Commission/RBAC/Phase3 clutter) */}
            {adminTab !== "stores" &&
              adminTab !== "subscriptions" &&
              adminTab !== "permissions" &&
              adminTab !== "global_markets" && (
                <div className="bg-white dark:bg-slate-900 px-5 sm:px-6 py-4 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-stone-500 dark:text-slate-400 mb-1 flex-wrap">
                      <span className="uppercase tracking-wider font-sans font-bold text-stone-400 dark:text-slate-500">
                        {activeNavMeta.groupLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans">@{adminUsername}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans text-emerald-600 dark:text-emerald-400 font-bold">
                        Role: {PLATFORM_ADMIN_ROLES[activeAdmin.roleId]?.name || "Super Admin"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-5 rounded-full shrink-0 bg-[#1e2631] dark:bg-sky-400" />
                      <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight">
                        {activeNavMeta.label}
                      </h2>
                    </div>
                    {activeNavMeta.description && (
                      <p className="text-xs text-stone-500 dark:text-slate-400 font-medium mt-0.5 pl-4">
                        {activeNavMeta.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <select
                      aria-label="Active Platform Admin Role"
                      value={activeAdmin.id}
                      onChange={(e) => {
                        const next = setActivePlatformAdmin(e.target.value);
                        setActiveAdminState(next);
                        showAdminToast(
                          `Switched active RBAC persona to ${next.name} (${PLATFORM_ADMIN_ROLES[next.roleId]?.name}).`
                        );
                      }}
                      className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-stone-50 dark:bg-slate-950 border border-stone-200/90 dark:border-slate-800 text-stone-800 dark:text-slate-200 cursor-pointer"
                    >
                      {adminAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          RBAC: {PLATFORM_ADMIN_ROLES[acc.roleId]?.name} ({acc.name})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setAdminTab("phase3_readiness")}
                      className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                    >
                      <Activity className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Phase 3: Scale &amp; Infra</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminTab("global_markets")}
                      className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Global Markets</span>
                    </button>
                  </div>
                </div>
              )}

            {/* SECTION 1: EXECUTIVE DASHBOARD CONTROL CENTER */}
            {adminTab === "overview" && (
              <div className="flex flex-col gap-6">
                {/* TIER 1: 10-Metric Structured KPI Grid (Add New Product Card & Circular Badge System) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {/* 1. Total Stores */}
                  <button
                    type="button"
                    onClick={() => setAdminTab("stores")}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-800 hover:border-[#1e2631] dark:hover:border-sky-400 shadow-xs text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-stone-700 dark:text-slate-300">
                        Total Stores
                      </span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-stone-100 dark:bg-slate-800 text-[#1e2631] dark:text-sky-400 border border-stone-200/80 dark:border-slate-700 group-hover:bg-[#1e2631] group-hover:text-white dark:group-hover:bg-sky-400 dark:group-hover:text-slate-950 transition-colors">
                        <Store className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-stone-900 dark:text-white font-sans tabular-nums">
                      {totalStores}
                    </div>
                    <div className="text-[11px] font-medium text-stone-500 dark:text-slate-400">
                      Registered merchant boutiques
                    </div>
                  </button>

                  {/* 2. Active Stores */}
                  <button
                    type="button"
                    onClick={() => setAdminTab("stores")}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-800 hover:border-[#1e2631] dark:hover:border-sky-400 shadow-xs text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-stone-700 dark:text-slate-300">
                        Active Stores
                      </span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-sans tabular-nums">
                      {activeStoresCount}
                    </div>
                    <div className="text-[11px] font-medium text-stone-500 dark:text-slate-400">
                      {totalStores > 0 ? Math.round((activeStoresCount / totalStores) * 100) : 100}% operational rate
                    </div>
                  </button>

                  {/* 3. Inactive / Unverified Stores */}
                  <button
                    type="button"
                    onClick={() => setAdminTab("stores")}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-800 hover:border-[#1e2631] dark:hover:border-sky-400 shadow-xs text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-stone-700 dark:text-slate-300">
                        Inactive Stores
                      </span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400 border border-stone-200/80 dark:border-slate-700">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-stone-900 dark:text-white font-sans tabular-nums">
                      {inactiveStoresCount}
                    </div>
                    <div className="text-[11px] font-medium text-stone-500 dark:text-slate-400">
                      Awaiting verification or catalog
                    </div>
                  </button>

                  {/* 4. Subscription Statistics */}
                  <button
                    type="button"
                    onClick={() => setAdminTab("subscriptions")}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-800 hover:border-[#1e2631] dark:hover:border-sky-400 shadow-xs text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-stone-700 dark:text-slate-300">
                        Subscriptions
                      </span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-stone-100 dark:bg-slate-800 text-[#1e2631] dark:text-sky-400 border border-stone-200/80 dark:border-slate-700 group-hover:bg-[#1e2631] group-hover:text-white dark:group-hover:bg-sky-400 dark:group-hover:text-slate-950 transition-colors">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-stone-900 dark:text-white font-sans tabular-nums">
                      {subscriptionBreakdown.pro} <span className="text-xs font-sans font-bold text-stone-400">Pro</span>
                    </div>
                    <div className="text-[11px] font-medium text-stone-500 dark:text-slate-400 font-sans tabular-nums">
                      {subscriptionBreakdown.growth} Growth · {subscriptionBreakdown.starter} Starter
                    </div>
                  </button>

                  {/* 5. Total Orders */}
                  <button
                    type="button"
                    onClick={() => setAdminTab("orders")}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-800 hover:border-[#1e2631] dark:hover:border-sky-400 shadow-xs text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-stone-700 dark:text-slate-300">
                        Total Orders
                      </span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-stone-100 dark:bg-slate-800 text-[#1e2631] dark:text-sky-400 border border-stone-200/80 dark:border-slate-700 group-hover:bg-[#1e2631] group-hover:text-white dark:group-hover:bg-sky-400 dark:group-hover:text-slate-950 transition-colors">
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-stone-900 dark:text-white font-sans tabular-nums">
                      {orders.length}
                    </div>
                    <div className="text-[11px] font-medium text-stone-500 dark:text-slate-400 font-sans tabular-nums">
                      {orderDistributionByStatus.delivered} delivered · {orderDistributionByStatus.pending} pending
                    </div>
                  </button>

                  {/* 6. Sales Overview (GMV) */}
                  <button
                    type="button"
                    onClick={() => setAdminTab("orders")}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-800 hover:border-[#1e2631] dark:hover:border-sky-400 shadow-xs text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-stone-700 dark:text-slate-300">
                        Sales Overview
                      </span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-stone-900 dark:text-white font-sans tabular-nums">
                      {totalSales.toLocaleString()} <span className="text-xs font-sans font-bold text-stone-400">DA</span>
                    </div>
                    <div className="text-[11px] font-medium text-stone-500 dark:text-slate-400">
                      Gross merchandise volume
                    </div>
                  </button>

                  {/* 7. Platform Revenue */}
                  <button
                    type="button"
                    onClick={() => setAdminTab("settings")}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-800 hover:border-[#1e2631] dark:hover:border-sky-400 shadow-xs text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-stone-700 dark:text-slate-300">
                        Platform Revenue
                      </span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-stone-900 dark:text-white font-sans tabular-nums">
                      {estimatedProfit.toLocaleString()} <span className="text-xs font-sans font-bold text-stone-400">DA</span>
                    </div>
                    <div className="text-[11px] font-medium text-stone-500 dark:text-slate-400 font-sans tabular-nums">
                      {platformCommission}% commission rate
                    </div>
                  </button>

                  {/* 8. Registered Users */}
                  <button
                    type="button"
                    onClick={() => setAdminTab("stores")}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-800 hover:border-[#1e2631] dark:hover:border-sky-400 shadow-xs text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-stone-700 dark:text-slate-300">
                        Registered Users
                      </span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-stone-100 dark:bg-slate-800 text-[#1e2631] dark:text-sky-400 border border-stone-200/80 dark:border-slate-700 group-hover:bg-[#1e2631] group-hover:text-white dark:group-hover:bg-sky-400 dark:group-hover:text-slate-950 transition-colors">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-stone-900 dark:text-white font-sans tabular-nums">
                      {registeredUsersCount}
                    </div>
                    <div className="text-[11px] font-medium text-stone-500 dark:text-slate-400">
                      Merchants, buyers &amp; reviewers
                    </div>
                  </button>

                  {/* 9. Platform Activity */}
                  <button
                    type="button"
                    onClick={() => setAdminTab("activity_logs")}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-800 hover:border-[#1e2631] dark:hover:border-sky-400 shadow-xs text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-stone-700 dark:text-slate-300">
                        Platform Activity
                      </span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-stone-100 dark:bg-slate-800 text-[#1e2631] dark:text-sky-400 border border-stone-200/80 dark:border-slate-700 group-hover:bg-[#1e2631] group-hover:text-white dark:group-hover:bg-sky-400 dark:group-hover:text-slate-950 transition-colors">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-stone-900 dark:text-white font-sans tabular-nums">
                      {totalProducts} <span className="text-xs font-sans font-bold text-stone-400">Items</span>
                    </div>
                    <div className="text-[11px] font-medium text-stone-500 dark:text-slate-400 font-sans tabular-nums">
                      {allReviews.length} reviews · {allPlatformDomains.length} domains
                    </div>
                  </button>

                  {/* 10. Important Notifications */}
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(true)}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-800 hover:border-[#1e2631] dark:hover:border-sky-400 shadow-xs text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-stone-700 dark:text-slate-300">
                        Notifications
                      </span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-stone-100 dark:bg-slate-800 text-[#1e2631] dark:text-sky-400 border border-stone-200/80 dark:border-slate-700 group-hover:bg-[#1e2631] group-hover:text-white dark:group-hover:bg-sky-400 dark:group-hover:text-slate-950 transition-colors">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-stone-900 dark:text-white font-sans tabular-nums">
                      {actionableNotifications.length}
                    </div>
                    <div className="text-[11px] font-medium text-stone-500 dark:text-slate-400">
                      Actionable platform alerts
                    </div>
                  </button>
                </div>

                {/* TIER 2: Interactive Analytics & Subscription Distribution */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Interactive Sales, Store & Order Breakdown (2 columns wide) */}
                  <div className={`xl:col-span-2 ${YUME_ADMIN_TOKENS.cardClass} justify-between`}>
                    <YumeAdminSectionHeader
                      title="Sales, Order & Store Performance Breakdown"
                      subtitle="Live distribution across merchant stores, subscription tiers, and fulfillment stages"
                      rightContent={
                        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-slate-950 rounded-xl border border-stone-200/80 dark:border-slate-800">
                          {[
                            { id: "stores", label: "By Store" },
                            { id: "status", label: "By Order Status" },
                            { id: "tiers", label: "By Subscription" },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setOverviewBreakdownTab(tab.id as any)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                overviewBreakdownTab === tab.id
                                  ? "bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 shadow-2xs"
                                  : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      }
                    />

                    {overviewBreakdownTab === "stores" && (
                      <div className="space-y-3">
                        {stores.slice(0, 5).map((store) => {
                          const storeOrders = orders.filter((o) => o.storeId === store.id);
                          const storeSales = storeOrders.reduce((acc, o) => acc + o.total, 0);
                          const sharePct = totalSales > 0 ? Math.round((storeSales / totalSales) * 100) : Math.round(100 / Math.max(1, stores.length));
                          return (
                            <div key={store.id} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-bold text-stone-900 dark:text-white truncate">
                                    {store.name}
                                  </span>
                                  <span className="text-stone-400">·</span>
                                  <span className="text-stone-500 dark:text-slate-400">
                                    {store.wilaya}
                                  </span>
                                  <span className="text-stone-400">·</span>
                                  <span className="text-stone-500 dark:text-slate-400 font-sans tabular-nums">
                                    {store.products?.length || 0} products
                                  </span>
                                </div>
                                <div className="font-sans tabular-nums font-bold text-stone-900 dark:text-white shrink-0">
                                  {storeSales.toLocaleString()} DA ({sharePct}%)
                                </div>
                              </div>
                              <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-slate-950 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300 bg-[#1e2631] dark:bg-sky-400"
                                  style={{
                                    width: `${Math.max(6, sharePct)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {overviewBreakdownTab === "status" && (
                      <div className="space-y-3.5">
                        {[
                          { label: "Pending Verification", count: orderDistributionByStatus.pending, color: "bg-amber-500" },
                          { label: "Accepted by Merchants", count: orderDistributionByStatus.accepted, color: "bg-sky-500" },
                          { label: "Shipped in Transit", count: orderDistributionByStatus.shipped, color: "bg-[#1e2631] dark:bg-sky-400" },
                          { label: "Delivered Successfully", count: orderDistributionByStatus.delivered, color: "bg-emerald-500" },
                        ].map((row) => {
                          const pct = orders.length ? Math.round((row.count / orders.length) * 100) : 0;
                          return (
                            <div key={row.label} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-slate-300">
                                <span>{row.label}</span>
                                <span className="font-sans tabular-nums">
                                  {row.count} orders · {pct}%
                                </span>
                              </div>
                              <div className="w-full bg-stone-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${row.color}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {overviewBreakdownTab === "tiers" && (
                      <div className="space-y-3.5">
                        {[
                          { label: "Pro / Enterprise Stores", count: subscriptionBreakdown.pro, color: "bg-[#1e2631] dark:bg-sky-400" },
                          { label: "Growth / Basic Stores", count: subscriptionBreakdown.growth, color: "bg-emerald-500" },
                          { label: "Starter / Free Stores", count: subscriptionBreakdown.starter, color: "bg-stone-500" },
                        ].map((tier) => {
                          const pct = totalStores ? Math.round((tier.count / totalStores) * 100) : 0;
                          return (
                            <div key={tier.label} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-slate-300">
                                <span>{tier.label}</span>
                                <span className="font-sans tabular-nums">
                                  {tier.count} stores · {pct}%
                                </span>
                              </div>
                              <div className="w-full bg-stone-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${tier.color}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="pt-3 border-t border-stone-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
                      <span>
                        Gross Sales: <strong className="font-sans tabular-nums text-stone-900 dark:text-white">{totalSales.toLocaleString()} DA</strong> · Net Commission: <strong className="font-sans tabular-nums text-emerald-600 dark:text-emerald-400">{estimatedProfit.toLocaleString()} DA</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAdminTab("orders")}
                        className="font-bold text-[#1e2631] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Orders &amp; Shipping</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subscription & Governance Summary Card */}
                  <div className={`${YUME_ADMIN_TOKENS.cardClass} justify-between`}>
                    <div className="space-y-4">
                      <YumeAdminSectionHeader
                        title="Subscriptions & Governance"
                        subtitle="Active plan distribution & order interface policy"
                      />

                      <div className="space-y-3">
                        <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-stone-900 dark:text-white">
                              Pro Tier Stores
                            </div>
                            <div className="text-[11px] text-stone-500 dark:text-slate-400">
                              Full AI Studio, custom domains &amp; 0% fee option
                            </div>
                          </div>
                          <span className="min-w-[28px] h-7 px-2 rounded-full bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 font-sans tabular-nums text-xs font-bold flex items-center justify-center">
                            {subscriptionBreakdown.pro}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-stone-900 dark:text-white">
                              Growth &amp; Starter Stores
                            </div>
                            <div className="text-[11px] text-stone-500 dark:text-slate-400">
                              Standard storefront &amp; marketplace listing
                            </div>
                          </div>
                          <span className="min-w-[28px] h-7 px-2 rounded-full bg-stone-200/80 dark:bg-slate-800 text-stone-800 dark:text-slate-200 font-sans tabular-nums text-xs font-bold flex items-center justify-center">
                            {subscriptionBreakdown.growth + subscriptionBreakdown.starter}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-stone-900 dark:text-white">
                              Orders Interface Policy
                            </div>
                            <div className="text-[11px] text-stone-500 dark:text-slate-400">
                              Global default mode for merchant order desks
                            </div>
                          </div>
                          <span className="text-xs font-sans font-bold uppercase text-stone-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-slate-800">
                            {globalOrdersMode}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdminTab("subscriptions")}
                        className={`${YUME_ADMIN_TOKENS.secondaryButtonClass} w-full py-2.5`}
                      >
                        <span>Subscriptions</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminTab("permissions")}
                        className={`${YUME_ADMIN_TOKENS.primaryButtonClass} w-full py-2.5`}
                      >
                        <span>Plan Permissions</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* TIER 3: Important Notifications & Real-Time Platform Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Important Notifications & Action Required */}
                  <div className={`${YUME_ADMIN_TOKENS.cardClass} justify-between`}>
                    <div className="space-y-4">
                      <YumeAdminSectionHeader
                        title="Important Notifications"
                        rightContent={
                          <span className="text-xs font-sans tabular-nums text-stone-500 dark:text-slate-400 font-bold">
                            {actionableNotifications.length} active
                          </span>
                        }
                      />

                      <div className="space-y-2.5">
                        {actionableNotifications.map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-stone-900 dark:text-white truncate">
                                {item.title}
                              </div>
                              <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate mt-0.5">
                                {item.detail}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAdminTab(item.targetTab)}
                              className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                            >
                              {item.actionLabel}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Real-time Platform Activity Feed */}
                  <div className={`${YUME_ADMIN_TOKENS.cardClass} justify-between`}>
                    <div className="space-y-4">
                      <YumeAdminSectionHeader
                        title="Platform Activity Stream"
                        rightContent={
                          <button
                            type="button"
                            onClick={() => setAdminTab("activity_logs")}
                            className="text-xs font-bold text-[#1e2631] dark:text-sky-400 hover:underline cursor-pointer"
                          >
                            Full Audit Logs
                          </button>
                        }
                      />

                      <div className="flex flex-col gap-2.5 font-sans text-[11px] text-stone-600 dark:text-slate-400">
                        <div className="p-3 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                          <span>[AUTH] Super Admin @{adminUsername} session verified</span>
                          <span className="text-[10px] text-stone-400 shrink-0">Active</span>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                          <span>[STORES] {stores.length} merchant profiles synchronized</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0">Synced</span>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                          <span>[ORDERS] {orders.length} order receipts tracked across Wilayas</span>
                          <span className="text-[10px] text-[#1e2631] dark:text-sky-400 font-bold shrink-0">Live</span>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                          <span>[AI ENGINE] Active provider set to {activeAiModel}</span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold shrink-0">Ready</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-stone-500 dark:text-slate-400">
                        Manage active boutiques, verification & catalog telemetry
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAdminTab("stores");
                        }}
                        className={YUME_ADMIN_TOKENS.primaryButtonClass}
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Manage Stores</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

        {/* TAB: Stores (Version 2.1 — Strictly 3 Columns, Real Server Telemetry, Coordinated Header Workspace & Safe Lifecycle) */}
        {adminTab === "stores" && (
          <StoresManagementWorkspace
            stores={stores}
            setStores={setStores}
            orders={orders}
            activeAdmin={activeAdmin}
            adminUsername={adminUsername}
            darkMode={darkMode}
            currentSlideColor={currentSlideColor}
            storesSubNav={storesSubNav}
            setStoresSubNav={setStoresSubNav}
            storeQuery={storeQuery}
            setStoreQuery={setStoreQuery}
            openStoreGovernanceModal={openStoreGovernanceModal}
            showAdminToast={showAdminToast}
            setConfirmModalState={setConfirmModalState}
          />
        )}

        {/* TAB: Catalog Moderation & Policy Enforcement */}
        {adminTab === "products" && (
          <div className="flex flex-col gap-6 text-left">
            <YumeAdminSubNavStrip
              activeId={productModerationSubTab}
              onSelect={(id) => setProductModerationSubTab(id as any)}
              items={[
                {
                  id: "all_products",
                  label: "All Catalog Listings",
                  subtitle: "Stock, pricing & surgical catalog moderation",
                  icon: Package,
                  badge: allProducts.length,
                },
                {
                  id: "moderation_queue",
                  label: "Flagged & Prohibited Queue",
                  subtitle: "Policy scanner & unsafe item quarantine",
                  icon: AlertTriangle,
                  badge: allProducts.filter(
                    ({ product }) =>
                      product.isSafe === false ||
                      scanProductAgainstPolicies(product, policyRules).flagged
                  ).length,
                },
                {
                  id: "policy_rules",
                  label: "Prohibited Keywords & Policy Rules",
                  subtitle: "Automated Trust & Safety detection rules",
                  icon: Shield,
                  badge: policyRules.filter((r) => r.enabled).length,
                },
              ]}
            />

            {productModerationSubTab === "all_products" && (
              <>
                <YumeAdminAdviceBanner>
                  Inspect live merchant product listings across all boutiques. Stock and price adjustments made here synchronize immediately with the consumer marketplace and merchant inventory desks.
                </YumeAdminAdviceBanner>

                {/* Action filter input */}
                <div className={YUME_ADMIN_TOKENS.cardClass}>
                  <YumeAdminSectionHeader
                    title="Marketplace Product Catalog Moderation"
                    subtitle="Inspect, adjust stock & pricing, or remove non-compliant merchant listings in real time"
                    rightContent={
                      <span className="text-xs font-sans tabular-nums font-bold px-3 py-1.5 bg-stone-100 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 rounded-xl text-stone-700 dark:text-slate-300">
                        Total searchable products: {allProducts.length}
                      </span>
                    }
                  />

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Moderation search by Product Name, category, store boutique..."
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      className={`${YUME_ADMIN_TOKENS.inputClass} pl-10`}
                    />
                  </div>
                </div>

                {/* List Products Catalog inside the Layout Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 bg-white dark:bg-slate-900 rounded-2xl py-16 border border-stone-200/80 dark:border-slate-800 text-center text-stone-400">
                      <p className="text-xs font-bold font-sans text-stone-500">No catalog products match current search criteria.</p>
                    </div>
                  ) : (
                    filteredProducts.map(({ product, storeName, storeId }, idx) => (
                      <AdminProductCard
                        key={`${storeId}-${product.id}-${idx}`}
                        product={product}
                        storeName={storeName}
                        storeId={storeId}
                        handleUpdateProductStock={handleUpdateProductStock}
                        handleUpdateProductPrice={handleUpdateProductPrice}
                        handleDeleteProduct={handleDeleteProduct}
                      />
                    ))
                  )}
                </div>
              </>
            )}

            {productModerationSubTab === "moderation_queue" && (
              <div className={YUME_ADMIN_TOKENS.cardClass}>
                <YumeAdminSectionHeader
                  title="Trust & Safety Product Moderation Queue"
                  subtitle="Review items flagged by automated prohibited-keyword scanning or quarantined as unsafe. Quarantined items are hidden from public buyer discovery."
                />
                <div className="space-y-3">
                  {allProducts.map(({ product, storeName, storeId }) => {
                    const scan = scanProductAgainstPolicies(product, policyRules);
                    const isQuarantined = product.isSafe === false;
                    return (
                      <div
                        key={`${storeId}-${product.id}`}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isQuarantined || scan.flagged
                            ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
                            : "bg-stone-50/70 dark:bg-slate-950/60 border-stone-200/80 dark:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-11 h-11 rounded-xl object-cover border border-stone-200 dark:border-slate-800 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-stone-900 dark:text-white">
                                {product.name}
                              </span>
                              <span className="text-[10.5px] font-sans text-stone-500">
                                ({storeName})
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-sans font-bold uppercase ${
                                  isQuarantined
                                    ? "bg-rose-600 text-white"
                                    : scan.flagged
                                    ? "bg-amber-500 text-white"
                                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                                }`}
                              >
                                {isQuarantined
                                  ? "Quarantined (Hidden)"
                                  : scan.flagged
                                  ? `Policy Match (${scan.matchedRules.map((r) => r.keyword).join(", ")})`
                                  : "Verified Safe"}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate mt-0.5">
                              {product.moderationReason || product.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const nextSafe = isQuarantined ? true : false;
                              setStores((prev) =>
                                prev.map((s) =>
                                  s.id === storeId
                                    ? {
                                        ...s,
                                        products: s.products.map((p) =>
                                          p.id === product.id
                                            ? {
                                                ...p,
                                                isSafe: nextSafe,
                                                moderationReason: nextSafe
                                                  ? "Approved safe by Trust & Safety"
                                                  : "Quarantined by Trust & Safety moderation",
                                              }
                                            : p
                                        ),
                                      }
                                    : s
                                )
                              );
                              recordPlatformAuditLog({
                                module: "products",
                                actionType: nextSafe ? "approve" : "suspend",
                                targetType: "product",
                                targetId: product.id,
                                targetName: product.name,
                                summary: `${
                                  nextSafe ? "Restored" : "Quarantined"
                                } product listing "${product.name}" in store "${storeName}".`,
                                beforeState: { isSafe: !nextSafe },
                                afterState: { isSafe: nextSafe },
                              });
                              showAdminToast(
                                `Product "${product.name}" ${
                                  nextSafe ? "approved as safe" : "quarantined & hidden from public discovery"
                                }.`
                              );
                            }}
                            className={
                              isQuarantined
                                ? YUME_ADMIN_TOKENS.emeraldButtonClass
                                : YUME_ADMIN_TOKENS.dangerButtonClass
                            }
                          >
                            {isQuarantined ? "Restore to Public Catalog" : "Quarantine Listing"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {productModerationSubTab === "policy_rules" && (
              <div className={YUME_ADMIN_TOKENS.cardClass}>
                <YumeAdminSectionHeader
                  title="Prohibited Items & Automated Keyword Policy Rules"
                  subtitle="Configure banned keywords and regulatory categories automatically flagged across all merchant catalogs"
                />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                  <input
                    type="text"
                    value={newPolicyKeyword}
                    onChange={(e) => setNewPolicyKeyword(e.target.value)}
                    placeholder="Prohibited keyword (e.g. replica)..."
                    className={YUME_ADMIN_TOKENS.inputClass}
                  />
                  <input
                    type="text"
                    value={newPolicyCategory}
                    onChange={(e) => setNewPolicyCategory(e.target.value)}
                    placeholder="Policy category..."
                    className={YUME_ADMIN_TOKENS.inputClass}
                  />
                  <select
                    value={newPolicySeverity}
                    onChange={(e) => setNewPolicySeverity(e.target.value as "high" | "critical")}
                    className={YUME_ADMIN_TOKENS.selectClass}
                  >
                    <option value="high">High Severity</option>
                    <option value="critical">Critical Severity</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newPolicyKeyword.trim()) return;
                      const nextRule: ProhibitedPolicyRule = {
                        id: `pol_${Date.now()}`,
                        keyword: newPolicyKeyword.trim().toLowerCase(),
                        category: newPolicyCategory.trim() || "Prohibited Goods",
                        severity: newPolicySeverity,
                        autoAction: "flag_for_review",
                        enabled: true,
                      };
                      const next = [...policyRules, nextRule];
                      setPolicyRules(next);
                      saveProhibitedPolicyRules(next);
                      recordPlatformAuditLog({
                        module: "products",
                        actionType: "create",
                        targetType: "policy",
                        targetId: nextRule.id,
                        targetName: nextRule.keyword,
                        summary: `Added prohibited keyword policy rule "${nextRule.keyword}" (${nextRule.category}).`,
                      });
                      setNewPolicyKeyword("");
                      showAdminToast(`Added prohibited policy rule "${nextRule.keyword}".`);
                    }}
                    className={YUME_ADMIN_TOKENS.primaryButtonClass}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Policy Rule</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {policyRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 text-xs font-sans font-bold">
                          {rule.keyword}
                        </span>
                        <span className="text-xs font-bold text-stone-800 dark:text-slate-200">
                          {rule.category}
                        </span>
                        <span
                          className={`text-[10px] font-sans uppercase px-2 py-0.5 rounded-md font-bold ${
                            rule.severity === "critical"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                          }`}
                        >
                          {rule.severity}
                        </span>
                      </div>
                      <YumeAdminToggle
                        size="sm"
                        checked={rule.enabled}
                        onChange={(nextVal) => {
                          const next = policyRules.map((r) =>
                            r.id === rule.id ? { ...r, enabled: nextVal } : r
                          );
                          setPolicyRules(next);
                          saveProhibitedPolicyRules(next);
                        }}
                        ariaLabel={`Toggle rule ${rule.keyword}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Reviews & Buyer Complaints Management */}
        {adminTab === "reviews" && (
          <div className="flex flex-col gap-6">
            <YumeAdminSubNavStrip
              activeId={reviewsSubTab}
              onSelect={(id) => setReviewsSubTab(id as any)}
              items={[
                {
                  id: "customer_reviews",
                  label: "Verified Customer Reviews",
                  subtitle: "Ratings, sentiment analysis & official replies",
                  icon: Star,
                  badge: allReviews.length,
                },
                {
                  id: "buyer_complaints",
                  label: "Buyer Complaints & Escalations",
                  subtitle: "Counterfeit reports, non-delivery & policy disputes",
                  icon: AlertTriangle,
                  badge: buyerComplaints.filter((c) => c.status !== "resolved").length,
                },
              ]}
            />

            {reviewsSubTab === "buyer_complaints" && (
              <div className={YUME_ADMIN_TOKENS.cardClass}>
                <YumeAdminSectionHeader
                  title="Buyer Complaints, Counterfeit Reports & Escalation Desk"
                  subtitle="Investigate buyer reports and escalate confirmed merchant violations directly to the 4-Stage Store Enforcement engine."
                />
                <div className="space-y-3">
                  {buyerComplaints.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-4 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-sans text-xs font-bold text-stone-900 dark:text-white">
                            #{comp.id}
                          </span>
                          <span className="text-xs font-bold text-[#1e2631] dark:text-sky-400">
                            Store: {comp.storeName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-bold uppercase bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                            {comp.category.replace(/_/g, " ")} · {comp.severity}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-bold uppercase bg-stone-200/80 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
                            {comp.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 dark:text-slate-300">
                          {comp.description}
                        </p>
                        <div className="text-[11px] text-stone-400 font-sans">
                          Buyer: {comp.buyerName} · Reported {new Date(comp.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={comp.status}
                          onChange={(e) => {
                            const nextStatus = e.target.value as any;
                            const updated = buyerComplaints.map((c) =>
                              c.id === comp.id ? { ...c, status: nextStatus } : c
                            );
                            setBuyerComplaints(updated);
                            saveBuyerComplaints(updated);
                            recordPlatformAuditLog({
                              module: "reviews",
                              actionType: "edit",
                              targetType: "review",
                              targetId: comp.id,
                              targetName: `Complaint #${comp.id}`,
                              summary: `Updated buyer complaint #${comp.id} status to ${nextStatus}.`,
                            });
                            showAdminToast(`Complaint #${comp.id} marked as ${nextStatus}.`);
                          }}
                          className={YUME_ADMIN_TOKENS.selectClass}
                        >
                          <option value="open">Open</option>
                          <option value="investigating">Investigating</option>
                          <option value="resolved">Resolved</option>
                          <option value="escalated_to_enforcement">Escalated to Enforcement</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <YumeAdminAdviceBanner>
              Monitor verified buyer ratings, sentiment distribution, and merchant response coverage. You can redact inappropriate comments or publish official platform responses directly on any review card.
            </YumeAdminAdviceBanner>

            {/* Reviews Specific Stats Row (Add New Product KPI Card Style) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className={YUME_ADMIN_TOKENS.compactCardClass}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 dark:text-slate-300">Platform Reviews</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-stone-100 dark:bg-slate-800 text-[#1e2631] dark:text-sky-400 border border-stone-200/80 dark:border-slate-700">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-stone-900 dark:text-white font-sans tabular-nums mt-2">
                  {allReviews.length}
                </div>
                <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium block mt-1">
                  Accumulated client feedback
                </span>
              </div>

              <div className={YUME_ADMIN_TOKENS.compactCardClass}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 dark:text-slate-300">Average Rating</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-stone-100 dark:bg-slate-800 text-amber-500 border border-stone-200/80 dark:border-slate-700">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                  </div>
                </div>
                <div className="text-2xl font-black text-stone-900 dark:text-white font-sans tabular-nums mt-2 flex items-baseline gap-1">
                  <span>
                    {(
                      allReviews.reduce((acc, r) => acc + r.review.rating, 0) /
                      (allReviews.length || 1)
                    ).toFixed(1)}
                  </span>
                  <span className="text-xs text-stone-400 font-semibold">/ 5.0</span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                  Verified buyer satisfaction
                </span>
              </div>

              <div className={YUME_ADMIN_TOKENS.compactCardClass}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 dark:text-slate-300">Sentiment Quality</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-stone-100 dark:bg-slate-800 text-[#1e2631] dark:text-sky-400 border border-stone-200/80 dark:border-slate-700">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-base font-black text-stone-900 dark:text-white font-sans tabular-nums mt-2.5 flex items-center gap-3">
                  <span title="Positive" className="text-emerald-600 dark:text-emerald-400">
                    +{allReviews.filter((r) => r.review.sentiment === "positive").length}
                  </span>
                  <span title="Neutral" className="text-amber-600 dark:text-amber-400">
                    ~{allReviews.filter((r) => r.review.sentiment === "neutral").length}
                  </span>
                  <span title="Negative" className="text-rose-600 dark:text-rose-400">
                    -{allReviews.filter((r) => r.review.sentiment === "negative").length}
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium block mt-1">
                  Automatic sentiment parsing active
                </span>
              </div>

              <div className={YUME_ADMIN_TOKENS.compactCardClass}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 dark:text-slate-300">Reply Coverage</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-stone-900 dark:text-white font-sans tabular-nums mt-2">
                  {allReviews.filter((r) => r.review.reply).length}{" "}
                  <span className="text-xs text-stone-400 font-semibold">/ {allReviews.length}</span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                  {((allReviews.filter((r) => r.review.reply).length / (allReviews.length || 1)) * 100).toFixed(0)}% response rate
                </span>
              </div>
            </div>

            {/* Filters dashboard */}
            <div className={YUME_ADMIN_TOKENS.cardClass}>
              <YumeAdminSectionHeader
                title="Filter & Inspect Platform Reviews"
                subtitle="Search and filter customer feedback across stores, products, ratings, and sentiment"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {/* Search query */}
                <div className="flex flex-col sm:col-span-2 md:col-span-1 lg:col-span-1">
                  <label className={YUME_ADMIN_TOKENS.labelClass}>Search Reviews</label>
                  <input
                    type="text"
                    placeholder="Search query..."
                    value={reviewsSearch}
                    onChange={(e) => setReviewsSearch(e.target.value)}
                    className={YUME_ADMIN_TOKENS.inputClass}
                  />
                </div>

                {/* Store filter */}
                <div className="flex flex-col">
                  <label className={YUME_ADMIN_TOKENS.labelClass}>Store Scope</label>
                  <select
                    value={reviewsStoreFilter}
                    onChange={(e) => setReviewsStoreFilter(e.target.value)}
                    className={YUME_ADMIN_TOKENS.selectClass}
                  >
                    <option value="all">All Stores ({stores.length})</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div className="flex flex-col">
                  <label className={YUME_ADMIN_TOKENS.labelClass}>Review Target</label>
                  <select
                    value={reviewsTypeFilter}
                    onChange={(e) => setReviewsTypeFilter(e.target.value as any)}
                    className={YUME_ADMIN_TOKENS.selectClass}
                  >
                    <option value="all">All Targets</option>
                    <option value="store">Store Level Reviews</option>
                    <option value="product">Product Level Reviews</option>
                  </select>
                </div>

                {/* Sentiment Filter */}
                <div className="flex flex-col">
                  <label className={YUME_ADMIN_TOKENS.labelClass}>Sentiment Analysis</label>
                  <select
                    value={reviewsSentimentFilter}
                    onChange={(e) => setReviewsSentimentFilter(e.target.value as any)}
                    className={YUME_ADMIN_TOKENS.selectClass}
                  >
                    <option value="all">All Sentiments</option>
                    <option value="positive">Positive Sentiment</option>
                    <option value="neutral">Neutral Sentiment</option>
                    <option value="negative">Negative Sentiment</option>
                  </select>
                </div>

                {/* Rating Filter */}
                <div className="flex flex-col">
                  <label className={YUME_ADMIN_TOKENS.labelClass}>Star Rating</label>
                  <select
                    value={reviewsRatingFilter}
                    onChange={(e) => setReviewsRatingFilter(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                    className={YUME_ADMIN_TOKENS.selectClass}
                  >
                    <option value="all">All Stars</option>
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>

                {/* Sort Order Selector */}
                <div className="flex flex-col">
                  <label className={YUME_ADMIN_TOKENS.labelClass}>Sort Reviews</label>
                  <select
                    value={reviewsSortOrder}
                    onChange={(e) => setReviewsSortOrder(e.target.value as any)}
                    className={YUME_ADMIN_TOKENS.selectClass}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                  </select>
                </div>
              </div>

              {/* Reset filter text */}
              {(reviewsSearch || reviewsStoreFilter !== "all" || reviewsTypeFilter !== "all" || reviewsSentimentFilter !== "all" || reviewsRatingFilter !== "all" || reviewsSortOrder !== "newest") && (
                <div className="flex justify-between items-center bg-stone-50/70 dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-stone-200/80 dark:border-slate-800">
                  <span className="text-xs text-stone-500 font-medium">
                    Filtered showing {filteredReviews.length} of {allReviews.length} total reviews.
                  </span>
                  <button
                    onClick={() => {
                      setReviewsSearch("");
                      setReviewsStoreFilter("all");
                      setReviewsTypeFilter("all");
                      setReviewsSentimentFilter("all");
                      setReviewsRatingFilter("all");
                      setReviewsSortOrder("newest");
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer text-left"
                  >
                    Reset Active Filters
                  </button>
                </div>
              )}
            </div>

            {/* Reviews display grid */}
            <div className="flex flex-col gap-4">
              {filteredReviews.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl py-16 border border-stone-200/80 dark:border-slate-800 text-center text-stone-400">
                  <p className="text-xs font-bold font-sans text-stone-500">No client reviews correspond to current filter selections.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  {filteredReviews.map((agg, idx) => {
                    const isReplying = replyingReviewId === agg.review.id;
                    const isEditing = editingReviewId === agg.review.id;

                    return (
                      <div
                        key={`${agg.type}-${agg.storeId}-${agg.productId || ""}-${agg.review.id}-${idx}`}
                        className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-stone-200/80 dark:border-slate-800 flex flex-col justify-between gap-4 shadow-xs relative transition-all duration-200 hover:border-stone-300 dark:hover:border-slate-700"
                      >
                        {/* Upper info card */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2 font-sans">
                                <span className="font-bold text-stone-900 dark:text-white text-sm">
                                  {agg.review.author}
                                </span>
                                {agg.review.authorLocation && (
                                  <span className="text-[10px] text-stone-500 dark:text-slate-400 font-semibold bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-stone-400" />
                                    {agg.review.authorLocation}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-medium text-stone-400 block mt-0.5 font-sans">
                                Submitted on {agg.review.date}
                              </span>
                            </div>

                            {/* Rating badge & sentiment indicator */}
                            <div className="flex items-center gap-1.5 font-sans">
                              <span className={`text-[9.5px] uppercase font-bold font-sans tracking-wider px-2 py-0.5 rounded-md border ${
                                agg.review.sentiment === "positive"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50"
                                  : agg.review.sentiment === "negative"
                                    ? "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50"
                                    : "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50"
                              }`}>
                                {agg.review.sentiment === "positive" ? "Positive" : agg.review.sentiment === "negative" ? "Negative" : "Neutral"}
                              </span>
                              <div className="flex bg-stone-50 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-stone-200/80 dark:border-slate-800 items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-xs font-bold text-stone-900 dark:text-slate-100 font-sans tabular-nums">{agg.review.rating}</span>
                              </div>
                            </div>
                          </div>

                          {/* Link context bar */}
                          <div className="p-2.5 bg-stone-50/70 dark:bg-slate-950/60 rounded-xl border border-stone-200/80 dark:border-slate-800 text-[11px] leading-tight flex flex-wrap gap-x-3 gap-y-1 mt-1 shrink-0 font-sans">
                            <div>
                              <span className="text-stone-400 font-semibold">Store:</span>{" "}
                              <span className="font-bold text-stone-800 dark:text-slate-200">{agg.storeName}</span>
                            </div>
                            {agg.type === "product" && (
                              <div>
                                <span className="text-stone-400 font-semibold">Product:</span>{" "}
                                <span className="font-bold text-[#1e2631] dark:text-sky-400">{agg.productName}</span>
                              </div>
                            )}
                            <span className="text-[9px] uppercase font-bold font-sans tracking-wider text-stone-500 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-stone-200/70 dark:border-slate-800 ml-auto">
                              {agg.type === "store" ? "Store Review" : "Product Review"}
                            </span>
                          </div>

                          {/* Editable or Standard review body comments */}
                          {isEditing ? (
                            <div className="flex flex-col gap-3 mt-2 p-3.5 bg-stone-50/70 dark:bg-slate-950/80 rounded-xl border border-stone-200/80 dark:border-slate-800 text-left font-sans">
                              <span className={YUME_ADMIN_TOKENS.labelClass}>Redact / Edit Review</span>
                              <textarea
                                rows={3}
                                value={editReviewForm.comment}
                                onChange={(e) => setEditReviewForm({ ...editReviewForm, comment: e.target.value })}
                                className={`${YUME_ADMIN_TOKENS.textareaClass} resize-none`}
                              />

                              <div className="grid grid-cols-2 gap-3 items-center">
                                <div className="flex flex-col">
                                  <label className={YUME_ADMIN_TOKENS.labelClass}>Set Rating Score</label>
                                  <select
                                    value={editReviewForm.rating}
                                    onChange={(e) => setEditReviewForm({ ...editReviewForm, rating: parseFloat(e.target.value) })}
                                    className={YUME_ADMIN_TOKENS.selectClass}
                                  >
                                    <option value={5}>5.0 Stars (Perfect)</option>
                                    <option value={4}>4.0 Stars (Good)</option>
                                    <option value={3}>3.0 Stars (Average)</option>
                                    <option value={2}>2.0 Stars (Poor)</option>
                                    <option value={1}>1.0 Star (Terrible)</option>
                                  </select>
                                </div>

                                <div className="flex flex-col">
                                  <label className={YUME_ADMIN_TOKENS.labelClass}>Review Sentiment</label>
                                  <select
                                    value={editReviewForm.sentiment}
                                    onChange={(e) => setEditReviewForm({ ...editReviewForm, sentiment: e.target.value as any })}
                                    className={YUME_ADMIN_TOKENS.selectClass}
                                  >
                                    <option value="positive">Positive</option>
                                    <option value="neutral">Neutral</option>
                                    <option value="negative">Negative</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 mt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingReviewId(null)}
                                  className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(agg)}
                                  className={YUME_ADMIN_TOKENS.primaryButtonClass}
                                >
                                  Save Redaction
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-stone-700 dark:text-slate-300 font-sans leading-relaxed mt-2 pl-3 border-l-2 border-[#1e2631] dark:border-sky-400">
                              &ldquo;{agg.review.comment}&rdquo;
                            </p>
                          )}

                          {/* Official system or merchant reply block display */}
                          {agg.review.reply && !isReplying && (
                            <div className="mt-3 p-3 bg-stone-50/70 dark:bg-slate-950/60 rounded-xl border border-stone-200/80 dark:border-slate-800 text-left font-sans">
                              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-stone-500 font-sans">
                                <span>Response:</span>
                                <span className="text-[9px] bg-[#1e2631] text-white dark:bg-sky-500 dark:text-slate-950 px-1.5 py-0.5 rounded font-sans">
                                  Official Admin DZ
                                </span>
                              </div>
                              <p className="text-xs text-stone-700 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                                &ldquo;{agg.review.reply}&rdquo;
                              </p>
                            </div>
                          )}

                          {/* Write reply inline textbox toggler */}
                          {isReplying && (
                            <div className="mt-3 p-3.5 bg-stone-50/70 dark:bg-slate-950 rounded-xl border border-stone-200/80 dark:border-slate-800 flex flex-col gap-2.5 font-sans">
                              <label className={YUME_ADMIN_TOKENS.labelClass}>Compose Platform Reply</label>
                              <textarea
                                rows={2}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="E.g. Thank you for your review! We value your feedback on the Algerian crafts marketplace."
                                className={`${YUME_ADMIN_TOKENS.textareaClass} resize-none`}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setReplyingReviewId(null)}
                                  className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveReply(agg)}
                                  className={YUME_ADMIN_TOKENS.primaryButtonClass}
                                >
                                  Submit Reply
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom action row buttons line footer */}
                        <div className="flex items-center justify-between border-t border-stone-200/80 dark:border-slate-800 pt-3 mt-auto shrink-0 select-none font-sans">
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(agg)}
                            className="text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 text-xs font-bold transition-all cursor-pointer font-sans"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEditingReview(agg)}
                              className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                            >
                              Edit Review
                            </button>
                            <button
                              type="button"
                              onClick={() => startReplyingReview(agg)}
                              className={YUME_ADMIN_TOKENS.primaryButtonClass}
                            >
                              {agg.review.reply ? "Modify Reply" : "Reply Review"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Security, 5-Role Admin RBAC & Database Backup/Restore */}
        {adminTab === "security" && (
          <div className="flex flex-col gap-6 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={YUME_ADMIN_TOKENS.cardClass}>
                <YumeAdminSectionHeader
                  title="Configure Super Admin Credentials"
                  subtitle="Update the Platform Owner login username and password for subsequent Super Admin sessions"
                />

                <YumeAdminAdviceBanner>
                  Credentials updated here take effect immediately for all future Platform Admin sign-ins. Keep your security passphrase confidential.
                </YumeAdminAdviceBanner>

                {settingsFeedback && (
                  <div
                    className={`text-xs font-bold p-3.5 rounded-xl border ${
                      settingsFeedback.includes("successfully")
                        ? "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {settingsFeedback}
                  </div>
                )}

                <form onSubmit={handleUpdateAdminPass} className="flex flex-col gap-4">
                  <div className="flex flex-col">
                    <label className={YUME_ADMIN_TOKENS.labelClass}>
                      Custom Admin Username <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. secureOwner"
                      value={newAdminUser}
                      onChange={(e) => setNewAdminUser(e.target.value)}
                      className={YUME_ADMIN_TOKENS.monoInputClass}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className={YUME_ADMIN_TOKENS.labelClass}>
                      New Security Password <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. premiumSecret2026"
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      className={YUME_ADMIN_TOKENS.monoInputClass}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`${YUME_ADMIN_TOKENS.primaryButtonClass} w-full py-3 mt-1`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5px]" />
                    <span>Save Admin Credentials</span>
                  </button>
                </form>
              </div>

              <div className={`${YUME_ADMIN_TOKENS.cardClass} justify-between`}>
                <div className="space-y-4">
                  <YumeAdminSectionHeader
                    title="Active Session, MFA Gate & Database Backup"
                    subtitle="Current RBAC telemetry, Multi-Factor Authentication gate, and full JSON snapshot export"
                  />
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-semibold text-stone-600 dark:text-slate-400">Active Admin Persona</span>
                      <span className="font-sans font-bold text-stone-900 dark:text-white">
                        {activeAdmin.name} ({activeAdmin.email})
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-semibold text-stone-600 dark:text-slate-400">Active RBAC Role</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {PLATFORM_ADMIN_ROLES[activeAdmin.roleId]?.name}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-stone-700 dark:text-slate-300">
                          MFA Session Verification Gate
                        </div>
                        <div className="text-[11px] text-stone-400">
                          Required for destructive actions (suspend, delete, security edits)
                        </div>
                      </div>
                      <YumeAdminToggle
                        size="sm"
                        checked={activeAdmin.mfaVerified}
                        onChange={(nextVal) => {
                          const updated = adminAccounts.map((a) =>
                            a.id === activeAdmin.id ? { ...a, mfaVerified: nextVal } : a
                          );
                          setAdminAccounts(updated);
                          savePlatformAdminAccounts(updated);
                          setActiveAdminState({ ...activeAdmin, mfaVerified: nextVal });
                          showAdminToast(
                            `MFA session verification ${nextVal ? "enabled" : "disabled"} for ${activeAdmin.name}.`
                          );
                        }}
                        ariaLabel="Toggle MFA Verified"
                      />
                    </div>
                  </div>

                  {/* Database Export & Disaster Recovery Controls */}
                  <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-stone-900 dark:text-white">
                        Database Export &amp; AES-256-GCM Disaster Recovery
                      </div>
                      {stepUpExpiresAtIso && (
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          Step-Up MFA Active until {new Date(stepUpExpiresAtIso).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await verifyStepUpMfaClient("ALL_CRITICAL_SCOPES", "123456");
                          if (res.success) {
                            setStepUpExpiresAtIso(res.expiresAt || null);
                            showAdminToast("5-Minute Action-Bound Step-Up MFA Verified.");
                          } else {
                            showAdminToast(res.error || "Step-Up MFA failed.", "error");
                          }
                        }}
                        className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Verify 5-Min Step-Up MFA</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/db/export");
                            const data = await res.json();
                            if (!res.ok) {
                              showAdminToast(data.error || "Export denied.", "error");
                              return;
                            }
                            const blob = new Blob([JSON.stringify(data, null, 2)], {
                              type: "application/json",
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `yume-operational-redacted-${new Date().toISOString().slice(0, 10)}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            showAdminToast("Redacted Operational Backup (.JSON) downloaded with SHA-256 manifest.");
                          } catch {
                            showAdminToast("Failed to export operational snapshot.", "error");
                          }
                        }}
                        className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Operational Backup (Redacted)</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (activeAdmin.roleId !== "super_admin") {
                            showAdminToast("Full Disaster-Recovery Export requires Super Admin role.", "error");
                            return;
                          }
                          try {
                            await verifyStepUpMfaClient("db_disaster_recovery_export", "123456");
                            const drData = await createDisasterRecoveryExportFromServer();
                            const sandboxRes = await runSandboxRestoreTestFromServer({
                              exportManifest: drData.exportManifest,
                              data: drData.data,
                              encryptedVault: drData.encryptedVault,
                            });
                            setDrSandboxCertificate(sandboxRes.certificate);
                            const blob = new Blob([JSON.stringify(drData, null, 2)], {
                              type: "application/json",
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `yume-dr-encrypted-${drData.exportManifest.exportId}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            showAdminToast(
                              `AES-256-GCM DR Archive exported & verified in isolated sandbox (${sandboxRes.certificate.certificateId}).`
                            );
                          } catch (err: any) {
                            showAdminToast(err.message || "DR Export failed.", "error");
                          }
                        }}
                        className={YUME_ADMIN_TOKENS.emeraldButtonClass}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Full DR Export (AES-256-GCM + Sandbox Test)</span>
                      </button>
                    </div>

                    {drSandboxCertificate && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-sans text-emerald-800 dark:text-emerald-300 space-y-0.5">
                        <div className="font-bold">
                          ISOLATED DR SANDBOX CERTIFICATE: {drSandboxCertificate.certificateId} (PASSED)
                        </div>
                        <div>
                          SHA-256: {String(drSandboxCertificate.archiveSha256Digest).slice(0, 24)}... · Decrypted Vault Secrets: {drSandboxCertificate.decryptedSecretsCount} · Audit Chain Valid: {String(drSandboxCertificate.auditChainValidInSandbox)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Terminate Super Admin Session</span>
                </button>
              </div>
            </div>

            {/* Phase 2 Automated Security & Regression Self-Test Suite ([SAFEGUARD 6]) */}
            <div className={YUME_ADMIN_TOKENS.cardClass}>
              <YumeAdminSectionHeader
                title="Phase 2 Automated Security, Safeguard & Regression Verification Suite"
                subtitle="Executes live server-side verification across Session/MFA Revocation, Non-Destructive Expiry, Active Order Protection, SHA-256 Audit Tamper Detection, and Isolated DR Sandbox Restore."
                rightSlot={
                  <button
                    type="button"
                    disabled={isRunningSecurityTests}
                    onClick={async () => {
                      setIsRunningSecurityTests(true);
                      try {
                        const report = await runSecuritySelfTestsFromServer();
                        setSecuritySelfTestReport(report);
                        showAdminToast(
                          `Security Verification Complete: ${report.passedCount}/${report.totalTests} Safeguards PASSED.`
                        );
                      } catch {
                        showAdminToast("Failed to run security verification suite.", "error");
                      } finally {
                        setIsRunningSecurityTests(false);
                      }
                    }}
                    className={YUME_ADMIN_TOKENS.primaryButtonClass}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {isRunningSecurityTests
                        ? "Running Verification..."
                        : "Run Full Security & Safeguard Self-Test"}
                    </span>
                  </button>
                }
              />

              {securitySelfTestReport && (
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      Overall Readiness Verdict:{" "}
                      {securitySelfTestReport.overallPassed
                        ? "ALL SAFEGUARDS PASSED (PRODUCTION READY)"
                        : "ISSUES DETECTED"}
                    </span>
                    <span className="font-sans font-bold text-emerald-700 dark:text-emerald-400">
                      {securitySelfTestReport.passedCount} / {securitySelfTestReport.totalTests} PASSED ·{" "}
                      {new Date(securitySelfTestReport.executedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(securitySelfTestReport.results || []).map((test: any) => (
                      <div
                        key={test.id}
                        className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-sans font-bold uppercase text-stone-500 dark:text-slate-400">
                            {test.safeguard}
                          </span>
                          <span
                            className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded ${
                              test.passed
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                                : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                            }`}
                          >
                            {test.passed ? "PASS" : "FAIL"}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-stone-900 dark:text-white">
                          {test.title}
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
                          {test.details}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5-Role Platform Administrator RBAC Directory */}
            <div className={YUME_ADMIN_TOKENS.cardClass}>
              <YumeAdminSectionHeader
                title="5-Role Platform Administrator Access Control (RBAC) Matrix"
                subtitle="Granular role separation across Super Admin, Trust & Safety, Market Operations, Finance, and Marketing & Advertising."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5">
                {adminAccounts.map((acc) => {
                  const roleDef = PLATFORM_ADMIN_ROLES[acc.roleId];
                  const isCurrent = acc.id === activeAdmin.id;
                  return (
                    <div
                      key={acc.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                        isCurrent
                          ? "bg-stone-50 dark:bg-slate-950 border-[#1e2631] dark:border-sky-400 shadow-xs"
                          : "bg-white dark:bg-slate-900 border-stone-200/80 dark:border-slate-800"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-sans uppercase font-bold px-2 py-0.5 rounded bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950">
                            {roleDef?.name}
                          </span>
                          {acc.mfaVerified && (
                            <span className="text-[10px] font-sans font-bold text-emerald-600 dark:text-emerald-400">
                              MFA OK
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-stone-900 dark:text-white">
                          {acc.name}
                        </div>
                        <div className="text-[11px] font-sans text-stone-500 dark:text-slate-400 truncate">
                          {acc.email}
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed pt-1">
                          {roleDef?.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = setActivePlatformAdmin(acc.id);
                          setActiveAdminState(next);
                          showAdminToast(
                            `Switched active RBAC role to ${roleDef?.name} (${acc.name}).`
                          );
                        }}
                        className={
                          isCurrent
                            ? YUME_ADMIN_TOKENS.emeraldButtonClass
                            : YUME_ADMIN_TOKENS.secondaryButtonClass
                        }
                      >
                        {isCurrent ? "Active Session Persona" : "Assume Role"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Subscriptions */}
        {adminTab === "subscriptions" && (
          <div className="flex flex-col gap-6 text-left">
            <SubscriptionPlansAndPricingControl currentSlideColor={currentSlideColor} />
            <PlatformOwnerFeatureManagementCard currentSlideColor={currentSlideColor} />
          </div>
        )}

        {/* TAB: Permissions (Phase 1 Subscription Plans & Feature Permissions) */}
        {adminTab === "permissions" && (
          <div className="flex flex-col gap-6 text-left">
            <PlatformPermissionsManager
              currentSlideColor={currentSlideColor}
              darkMode={darkMode}
              stores={stores}
            />
          </div>
        )}

        {/* TAB: Orders & Shipping Operations */}
        {adminTab === "orders" && (
          <div className="flex flex-col gap-6 text-left">
            <YumeAdminAdviceBanner>
              Monitor cross-store order fulfillment velocity, configure global vs. subscription-tier order desk interface policies, and audit platform commission accruals across all merchant boutiques.
            </YumeAdminAdviceBanner>

            {/* Order Status Distribution & Mode Governance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={YUME_ADMIN_TOKENS.cardClass}>
                <YumeAdminSectionHeader
                  title="Order Fulfillment Status Distribution"
                  subtitle="Live breakdown across verification, acceptance, transit, and delivery stages"
                  rightSlot={
                    <span className="px-3 py-1 rounded-full bg-stone-100 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 text-xs font-sans tabular-nums font-bold text-stone-700 dark:text-slate-300">
                      {orders.length} total orders
                    </span>
                  }
                />

                <div className="flex flex-col gap-4 mt-5">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                      <span>Pending Verification</span>
                      <span className="font-sans tabular-nums text-[11px] font-bold">{orderDistributionByStatus.pending} orders</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden border border-stone-200/60 dark:border-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-amber-500"
                        style={{ width: `${orders.length ? (orderDistributionByStatus.pending / orders.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                      <span>Accepted by Merchants</span>
                      <span className="font-sans tabular-nums text-[11px] font-bold">{orderDistributionByStatus.accepted} orders</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden border border-stone-200/60 dark:border-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-sky-500"
                        style={{ width: `${orders.length ? (orderDistributionByStatus.accepted / orders.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                      <span>Shipped in Transit</span>
                      <span className="font-sans tabular-nums text-[11px] font-bold">{orderDistributionByStatus.shipped} orders</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden border border-stone-200/60 dark:border-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-[#1e2631] dark:bg-sky-400"
                        style={{
                          width: `${orders.length ? (orderDistributionByStatus.shipped / orders.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                      <span>Delivered Successfully</span>
                      <span className="font-sans tabular-nums text-[11px] font-bold">{orderDistributionByStatus.delivered} orders</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden border border-stone-200/60 dark:border-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                        style={{ width: `${orders.length ? (orderDistributionByStatus.delivered / orders.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Yumi Orders Module Governance & Policies */}
              <div className={YUME_ADMIN_TOKENS.cardClass}>
                <YumeAdminSectionHeader
                  title="Orders Module Mode Governance & Policies"
                  subtitle="Control merchant access to Classic Mode and Advanced Mode globally or per canonical subscription tier"
                />

                <div className="space-y-4">
                  <div className={`${YUME_ADMIN_TOKENS.subCardClass} p-4 space-y-2`}>
                    <label className={YUME_ADMIN_TOKENS.labelClass}>
                      1. Platform Global Default Mode
                    </label>
                    <select
                      value={globalOrdersMode}
                      onChange={(e) => handleUpdateGlobalOrdersMode(e.target.value as any)}
                      className={YUME_ADMIN_TOKENS.selectClass}
                    >
                      <option value="both">Both Modes Enabled (Merchants toggle Classic &amp; Advanced)</option>
                      <option value="classic">Force Classic Mode Globally</option>
                      <option value="advanced">Force Advanced Pro Mode Globally</option>
                    </select>
                  </div>

                  <div className={`${YUME_ADMIN_TOKENS.subCardClass} p-4 space-y-2.5`}>
                    <label className={YUME_ADMIN_TOKENS.labelClass}>
                      2. Canonical Subscription Tier Default Policies
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      {SUBSCRIPTION_PLAN_IDS.map((tier) => (
                        <div key={tier} className="flex flex-col gap-1">
                          <span className="font-bold text-stone-600 dark:text-slate-400 text-[11px]">{tier} Plan</span>
                          <select
                            value={planOrdersMode[tier] || "both"}
                            onChange={(e) => handleUpdatePlanOrdersMode(tier, e.target.value as any)}
                            className={YUME_ADMIN_TOKENS.selectClass}
                          >
                            <option value="both">Both Modes</option>
                            <option value="classic">Classic Only</option>
                            <option value="advanced">Advanced Only</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform-Wide Orders Ledger Table */}
            <div className={YUME_ADMIN_TOKENS.cardClass}>
              <YumeAdminSectionHeader
                title={`Platform Orders Ledger (${orders.length})`}
                subtitle="Real-time cross-store order transactions, customer destinations, and commission calculations"
                rightSlot={
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-56">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={ordersSearchQuery}
                        onChange={(e) => setOrdersSearchQuery(e.target.value)}
                        placeholder="Search order ID, buyer, wilaya..."
                        className={`${YUME_ADMIN_TOKENS.inputClass} pl-8 !py-2`}
                      />
                    </div>
                    <select
                      value={ordersStatusFilter}
                      onChange={(e) => setOrdersStatusFilter(e.target.value)}
                      className={`${YUME_ADMIN_TOKENS.selectClass} !w-auto !py-2`}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                }
              />

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200/80 dark:border-slate-800 text-[11px] font-bold text-stone-500 dark:text-slate-400">
                      <th className="py-3 px-3">Order ID</th>
                      <th className="py-3 px-3">Merchant Store</th>
                      <th className="py-3 px-3">Customer &amp; Wilaya</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Order Total</th>
                      <th className="py-3 px-3 text-right">Platform Fee ({platformCommission}%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-slate-800/70 text-xs">
                    {orders
                      .filter((o) => {
                        if (ordersStatusFilter !== "all" && o.status !== ordersStatusFilter) return false;
                        if (!ordersSearchQuery.trim()) return true;
                        const q = ordersSearchQuery.toLowerCase();
                        const st = stores.find((s) => s.id === o.storeId);
                        return (
                          o.id.toLowerCase().includes(q) ||
                          (o.shopper?.name || "").toLowerCase().includes(q) ||
                          (o.shopper?.wilaya || "").toLowerCase().includes(q) ||
                          (st?.name || "").toLowerCase().includes(q)
                        );
                      })
                      .map((ord) => {
                        const st = stores.find((s) => s.id === ord.storeId);
                        const fee = Math.round((ord.total * platformCommission) / 100);
                        return (
                          <tr key={ord.id} className="hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-3 font-sans tabular-nums font-bold text-stone-900 dark:text-white">
                              #{ord.id}
                            </td>
                            <td className="py-3.5 px-3 font-bold text-stone-700 dark:text-slate-300">
                              {st ? st.name : ord.storeName || ord.storeId}
                            </td>
                            <td className="py-3.5 px-3 text-stone-600 dark:text-slate-400">
                              <span className="font-bold text-stone-900 dark:text-white">{ord.shopper?.name}</span>
                              <span className="mx-1.5">·</span>
                              <span>{ord.shopper?.wilaya}</span>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-stone-100 dark:bg-slate-800 font-bold capitalize text-stone-700 dark:text-slate-300">
                                {ord.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right font-sans tabular-nums font-bold text-stone-900 dark:text-white">
                              {ord.total.toLocaleString()} DA
                            </td>
                            <td className="py-3.5 px-3 text-right font-sans tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                              {fee.toLocaleString()} DA
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Immutable Activity & Governance Audit Logs */}
        {adminTab === "activity_logs" && (
          <div className="flex flex-col gap-6 text-left">
            <YumeAdminAdviceBanner>
              Append-only, hash-chained administrative audit ledger. Every store suspension, plan mutation, permission change, and moderation action is recorded with Before/After JSON snapshots and synchronized to /api/admin/audit-logs and Firestore.
            </YumeAdminAdviceBanner>

            <div className={YUME_ADMIN_TOKENS.cardClass}>
              <YumeAdminSectionHeader
                title={`Unified Governance & Compliance Audit Trail (${auditLogs.length})`}
                subtitle="Filterable chronological event ledger with server-side SHA-256 chain integrity verification, HMAC-anchored checkpoints, and Before/After JSON diffs"
                rightSlot={
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await verifyAuditLedgerFromServer();
                          setAuditVerificationReport(res);
                          if (res.valid) {
                            showAdminToast(
                              `SHA-256 Audit Chain & HMAC Checkpoint Verified (${res.totalEntries} records intact).`
                            );
                          } else {
                            showAdminToast(
                              `Audit Tamper Alert: ${res.anomalies?.length || 1} integrity anomaly detected!`,
                              "error"
                            );
                          }
                        } catch {
                          showAdminToast("Failed to verify audit ledger integrity.", "error");
                        }
                      }}
                      className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify SHA-256 Chain &amp; Checkpoint</span>
                    </button>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-xs font-sans tabular-nums text-emerald-700 dark:text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {auditVerificationReport
                        ? auditVerificationReport.valid
                          ? `SHA-256 & HMAC Anchor Verified (${auditVerificationReport.totalEntries})`
                          : "Tamper Anomaly Detected"
                        : "Append-Only Ledger Verified"}
                    </span>
                  </div>
                }
              />

              {/* Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                <input
                  type="text"
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  placeholder="Search actor, target store, summary, or hash..."
                  className={YUME_ADMIN_TOKENS.inputClass}
                />
                <select
                  value={auditFilterModule}
                  onChange={(e) => setAuditFilterModule(e.target.value)}
                  className={YUME_ADMIN_TOKENS.selectClass}
                >
                  <option value="all">All Governance Modules</option>
                  <option value="stores">Merchant Stores &amp; Enforcement</option>
                  <option value="subscriptions">Subscriptions &amp; Media Quotas</option>
                  <option value="permissions">Canonical Plan Permissions</option>
                  <option value="products">Catalog Moderation &amp; Policies</option>
                  <option value="reviews">Reviews &amp; Buyer Complaints</option>
                  <option value="security">Security, RBAC &amp; Backups</option>
                </select>
                <select
                  value={auditFilterRole}
                  onChange={(e) => setAuditFilterRole(e.target.value)}
                  className={YUME_ADMIN_TOKENS.selectClass}
                >
                  <option value="all">All Administrator Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="trust_safety">Trust &amp; Safety</option>
                  <option value="market_ops">Market Operations</option>
                  <option value="finance">Finance</option>
                  <option value="marketing_ads">Marketing &amp; Advertising</option>
                </select>
              </div>

              <div className="space-y-2.5 font-sans text-xs">
                {auditLogs
                  .filter((log) => {
                    if (auditFilterModule !== "all" && log.module !== auditFilterModule)
                      return false;
                    if (auditFilterRole !== "all" && log.actorRole !== auditFilterRole)
                      return false;
                    if (!auditSearchQuery.trim()) return true;
                    const q = auditSearchQuery.toLowerCase();
                    return (
                      log.summary.toLowerCase().includes(q) ||
                      log.targetName.toLowerCase().includes(q) ||
                      log.actorEmail.toLowerCase().includes(q) ||
                      log.integrityHash.toLowerCase().includes(q)
                    );
                  })
                  .map((log) => {
                    const isExpanded = expandedAuditLogId === log.id;
                    const hasDiff = Boolean(log.beforeState || log.afterState);
                    return (
                      <div
                        key={log.id}
                        className="p-4 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 text-[10px] font-bold uppercase">
                              [{log.module}]
                            </span>
                            <span className="px-2 py-0.5 rounded bg-stone-200/80 dark:bg-slate-800 text-stone-800 dark:text-slate-200 text-[10px] font-bold uppercase">
                              {log.actionType}
                            </span>
                            <span className="font-sans font-bold text-stone-900 dark:text-white">
                              {log.summary}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-[11px] text-stone-400">
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-[10px]">
                              {log.integrityHash}
                            </span>
                            {hasDiff && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedAuditLogId(isExpanded ? null : log.id)
                                }
                                className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 font-sans font-bold cursor-pointer"
                              >
                                {isExpanded ? "Hide Diff" : "Inspect Diff"}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="text-[11px] text-stone-500 dark:text-slate-400 font-sans flex flex-wrap gap-x-4 gap-y-1">
                          <span>
                            Actor: <strong className="text-stone-800 dark:text-slate-200">{log.actorEmail}</strong> ({PLATFORM_ADMIN_ROLES[log.actorRole]?.name || log.actorRole})
                          </span>
                          <span>
                            Target: <strong className="text-stone-800 dark:text-slate-200">{log.targetName}</strong> ({log.targetType} #{log.targetId})
                          </span>
                        </div>

                        {isExpanded && hasDiff && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200/70 dark:border-slate-800 text-[11px]">
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800">
                              <div className="font-bold text-stone-500 mb-1">BEFORE STATE</div>
                              <pre className="overflow-x-auto text-stone-700 dark:text-slate-300">
                                {JSON.stringify(log.beforeState || {}, null, 2)}
                              </pre>
                            </div>
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800">
                              <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">AFTER STATE</div>
                              <pre className="overflow-x-auto text-stone-700 dark:text-slate-300">
                                {JSON.stringify(log.afterState || {}, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Core Global Settings */}
        {adminTab === "settings" && (
          <div className="grid grid-cols-1 gap-6 text-left">
            <YumeAdminAdviceBanner>
              Global platform parameters configured on this page immediately govern buyer checkout commissions, announcement banners, offer badge automation, and UI motion speeds across the entire YUME Network.
            </YumeAdminAdviceBanner>

            {/* Broadcast announcements & commission settings */}
            <div className={`${YUME_ADMIN_TOKENS.cardClass} gap-6 font-sans`}>
              <div className="flex flex-col gap-4">
                <YumeAdminSectionHeader
                  title="Broadcast Global Announcement Banner"
                  subtitle="Configure a system-wide banner displaying at the top margin of the marketplace buyer screen for sales, maintenance notifications, or general support alerts"
                />

                <div className="flex flex-col gap-1.5">
                  <label className={YUME_ADMIN_TOKENS.labelClass}>
                    Announcement Banner Text
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Celebration of Algerian Artisans! Direct checkout and track shipping across Biskra, Adrar, Oran & Algiers!"
                    value={globalAnnouncement}
                    onChange={(e) => setGlobalAnnouncement(e.target.value)}
                    className={YUME_ADMIN_TOKENS.textareaClass}
                  />
                </div>

                {globalAnnouncement ? (
                  <button
                    type="button"
                    onClick={() => setGlobalAnnouncement("")}
                    className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-rose-200 dark:border-rose-900/50 self-start"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear Live Banner Display
                  </button>
                ) : (
                  <span className="text-xs text-stone-400 dark:text-slate-500 font-medium block py-1">
                    There is currently no live banner. Fill text above to broadcast across the marketplace.
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-4 pt-6 border-t border-stone-200/80 dark:border-slate-800">
                <YumeAdminSectionHeader
                  title="Tax & Platform Commission Fee"
                  subtitle="Define the transaction fee percentage captured on every shop's checkout to calculate estimated platform earnings pools automatically"
                  rightSlot={
                    <span className="w-9 h-9 rounded-full bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 text-xs font-extrabold font-sans tabular-nums flex items-center justify-center">
                      {platformCommission}%
                    </span>
                  }
                />

                <div className={`${YUME_ADMIN_TOKENS.subCardClass} flex items-center gap-4 p-4 font-sans`}>
                  <span className="text-xs font-bold text-stone-800 dark:text-slate-200 shrink-0">
                    Fee: {platformCommission}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={platformCommission}
                    onChange={(e) => setPlatformCommission(parseInt(e.target.value))}
                    className="flex-grow accent-[#1e2631] dark:accent-sky-400 cursor-pointer h-1.5 bg-stone-200 dark:bg-slate-800 rounded-lg appearance-none"
                  />
                  <span className="text-[11px] font-bold text-stone-400 uppercase shrink-0">
                    Max 30%
                  </span>
                </div>
              </div>

              {/* Offer Architecture "Most Popular" Auto-Selection Sales Threshold */}
              <div className="flex flex-col gap-4 pt-6 border-t border-stone-200/80 dark:border-slate-800">
                <YumeAdminSectionHeader
                  title='Offer "Most Popular" Auto-Selection Threshold'
                  subtitle={`Before a product's offer reaches ${offerPopularSalesThreshold} total sales, the merchant manually chooses the "Most Popular" tier. Once real sales reach or exceed this threshold, the system automatically highlights the top-selling offer tier.`}
                  rightSlot={
                    <span className="px-3 py-1 rounded-full text-xs font-sans font-bold bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-white border border-stone-200/80 dark:border-slate-700">
                      {offerPopularSalesThreshold} Sales
                    </span>
                  }
                />

                <div className={`${YUME_ADMIN_TOKENS.subCardClass} flex items-center gap-4 p-4 font-sans`}>
                  <span className="text-xs font-bold text-stone-800 dark:text-slate-200 shrink-0">
                    Threshold: {offerPopularSalesThreshold} sales
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={offerPopularSalesThreshold}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 7);
                      setOfferPopularSalesThresholdState(val);
                      setAdminPopularSalesThreshold(val);
                    }}
                    className="flex-grow accent-[#1e2631] dark:accent-sky-400 cursor-pointer h-1.5 bg-stone-200 dark:bg-slate-800 rounded-lg appearance-none"
                  />
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={offerPopularSalesThreshold}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 7);
                      setOfferPopularSalesThresholdState(val);
                      setAdminPopularSalesThreshold(val);
                    }}
                    className="w-20 h-10 px-2.5 text-xs font-bold text-center rounded-xl border border-stone-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white outline-none focus:border-[#1e2631] dark:focus:border-sky-400"
                  />
                </div>
              </div>

              {/* YUME NETWORK GLOBAL ANIMATION DELAY & DURATION CONTROLLER */}
              <div className="flex flex-col gap-4 pt-6 border-t border-stone-200/80 dark:border-slate-800">
                <YumeAdminSectionHeader
                  title="Global Animation Delay & Duration"
                  subtitle="Control the global transition speed and effect delay across all Marketplace tabs, Merchant Workspace sub-views, and Admin portals"
                  rightSlot={
                    <span className="px-3 py-1 rounded-full text-xs font-sans font-bold bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 shadow-xs">
                      {(globalAnimationDelay ?? 0.5).toFixed(2)}s ({Math.round((globalAnimationDelay ?? 0.5) * 1000)}ms)
                    </span>
                  }
                />

                <div className={`${YUME_ADMIN_TOKENS.subCardClass} flex flex-col gap-3 p-4`}>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-sans font-bold text-stone-400 dark:text-slate-500 shrink-0 uppercase">
                      0.0s (Instant)
                    </span>
                    <input
                      type="range"
                      min="0.0"
                      max="2.0"
                      step="0.05"
                      value={globalAnimationDelay ?? 0.5}
                      onChange={(e) => setGlobalAnimationDelay?.(parseFloat(e.target.value))}
                      className="flex-grow accent-[#1e2631] dark:accent-sky-400 cursor-pointer h-1.5 bg-stone-200 dark:bg-slate-800 rounded-lg appearance-none"
                    />
                    <span className="text-[11px] font-sans font-bold text-stone-400 dark:text-slate-500 shrink-0 uppercase">
                      2.0s (Slow Motion)
                    </span>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/60 dark:border-slate-800/80">
                    <span className="text-[11px] font-bold uppercase text-stone-400 dark:text-slate-500 mr-1 font-sans">
                      Presets:
                    </span>
                    {[
                      { label: "Instant (0.1s)", val: 0.1 },
                      { label: "Fast (0.3s)", val: 0.3 },
                      { label: "Default (0.5s)", val: 0.5 },
                      { label: "Smooth (0.8s)", val: 0.8 },
                      { label: "Cinematic (1.2s)", val: 1.2 },
                    ].map((preset) => {
                      const isSelected = Math.abs((globalAnimationDelay ?? 0.5) - preset.val) < 0.02;
                      return (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setGlobalAnimationDelay?.(preset.val)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans ${
                            isSelected
                              ? "bg-[#1e2631] text-white dark:bg-sky-500 dark:text-slate-950 shadow-xs"
                              : "bg-white dark:bg-slate-900 text-stone-600 dark:text-slate-300 border border-stone-200/90 dark:border-slate-800 hover:border-stone-400"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Test Motion Effect Box */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setTestPulse(true);
                      setTimeout(() => setTestPulse(false), Math.max(300, (globalAnimationDelay ?? 0.5) * 1000 + 200));
                    }}
                    className={`${YUME_ADMIN_TOKENS.secondaryButtonClass} w-full`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Test Transition Effect Timing ({((globalAnimationDelay ?? 0.5)).toFixed(2)}s)
                  </button>

                  <AnimatePresence>
                    {testPulse && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: globalAnimationDelay ?? 0.5, ease: "easeInOut" }}
                        className="mt-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          Yume Transition Effect executed at {(globalAnimationDelay ?? 0.5).toFixed(2)}s duration!
                        </span>
                        <span className="text-[10px] font-sans uppercase bg-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          Active Speed
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Phase 3 Production Readiness, Home-Server Sovereignty & Concurrency Lab */}
        {adminTab === "phase3_readiness" && <Phase3ProductionReadinessCenter />}

        {/* TAB: Feature Flags & AI Engine Hub */}
        {adminTab === "ai_features" && (
          <div className="flex flex-col gap-6 text-left">
            <YumeAdminAdviceBanner>
              Toggle global interactive discovery capabilities (Visual Camera Identification and Wilaya Geolocation) and manage the active AI engine provider powering merchant studios.
            </YumeAdminAdviceBanner>

            {/* PLATFORM FEATURE CONTROL TOGGLES (Visual Search & Geographic Location) */}
            <div className={YUME_ADMIN_TOKENS.cardClass}>
              <YumeAdminSectionHeader
                title="Feature Controls & System Toggles"
                subtitle="Enable or disable platform-wide interactive features like visual camera identification and geographic location services"
                rightSlot={
                  <span className="text-[11px] font-sans font-bold px-3 py-1 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200/80 dark:border-slate-700 uppercase">
                    Admin Overrides
                  </span>
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Toggle 1: Visual Search & AI Camera */}
                <div className={`${YUME_ADMIN_TOKENS.subCardClass} p-4 flex items-center justify-between gap-4`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${visualSearchEnabled ? "bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950" : "bg-stone-200 dark:bg-slate-800 text-stone-400"}`}>
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-stone-900 dark:text-white">Visual AI Camera Identifier</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${visualSearchEnabled ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400" : "bg-stone-200 text-stone-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                          {visualSearchEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Controls visual AI photo identification, camera icons in search bars, and smart item snapping.
                      </p>
                    </div>
                  </div>

                  <YumeAdminToggle
                    checked={visualSearchEnabled}
                    onChange={(next) => toggleVisualSearch(next)}
                  />
                </div>

                {/* Toggle 2: Geographic Location & Proximity */}
                <div className={`${YUME_ADMIN_TOKENS.subCardClass} p-4 flex items-center justify-between gap-4`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${geoLocationEnabled ? "bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950" : "bg-stone-200 dark:bg-slate-800 text-stone-400"}`}>
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-stone-900 dark:text-white">Geographic Location Features</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${geoLocationEnabled ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400" : "bg-stone-200 text-stone-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                          {geoLocationEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Controls Wilaya geolocation sorting, GPS proximity distances, and artisan location maps.
                      </p>
                    </div>
                  </div>

                  <YumeAdminToggle
                    checked={geoLocationEnabled}
                    onChange={(next) => toggleGeoLocation(next)}
                  />
                </div>
              </div>
            </div>

            {/* MULTI-AI MODELS & CUSTOM PROVIDER ENGINE MANAGER */}
            <div className={YUME_ADMIN_TOKENS.cardClass}>
              <YumeAdminSectionHeader
                title="AI Models & Provider Engine Hub"
                subtitle="Select from primary AI models (Gemini, DeepSeek, OpenAI, Kimi) or configure custom model providers manually"
                rightSlot={
                  <span className="text-xs font-sans font-bold px-3.5 py-1.5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-white border border-stone-200/80 dark:border-slate-700 flex items-center gap-1.5">
                    <SparklesIcon className="w-3.5 h-3.5 text-emerald-500" />
                    Active: <strong className="font-extrabold">{activeAiModel}</strong>
                  </span>
                }
              />

              {/* Preset Models Selection */}
              <div>
                <label className={YUME_ADMIN_TOKENS.labelClass}>
                  Quick Select Active Engine Model
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1.5">
                  {[
                    { name: "Gemini 2.5 Flash", provider: "Google DeepMind", badge: "Default AI", icon: "🌌" },
                    { name: "DeepSeek V3", provider: "DeepSeek AI", badge: "Reasoning", icon: "⚡" },
                    { name: "OpenAI GPT-4o", provider: "OpenAI", badge: "Omni Pro", icon: "🤖" },
                    { name: "Kimi k1.5", provider: "Moonshot AI / Kimi", badge: "Long Context", icon: "🌙" },
                  ].map((m) => {
                    const isSelected = activeAiModel === m.name;
                    return (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => handleSelectActiveModel(m.name)}
                        className={`p-4 rounded-2xl text-left border transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                          isSelected
                            ? "bg-[#1e2631] text-white dark:bg-slate-900 dark:text-white border-[#1e2631] dark:border-sky-400 shadow-sm"
                            : "bg-stone-50/70 dark:bg-slate-950/60 text-stone-800 dark:text-slate-200 border-stone-200/80 dark:border-slate-800 hover:border-stone-400"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xl">{m.icon}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${isSelected ? "bg-emerald-500 text-white" : "bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-400"}`}>
                            {isSelected ? "ACTIVE" : m.badge}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight">{m.name}</div>
                          <div className={`text-[10px] font-medium mt-0.5 ${isSelected ? "text-stone-300 dark:text-slate-400" : "text-stone-500 dark:text-slate-500"}`}>
                            {m.provider}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Added AI Models List */}
              <div className="mt-2 border-t border-stone-200/80 dark:border-slate-800 pt-5">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-stone-800 dark:text-slate-200">
                    Configured &amp; Custom Models ({customAiModels.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomModel(true)}
                    className={YUME_ADMIN_TOKENS.primaryButtonClass}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Manual AI Model</span>
                  </button>
                </div>

                {/* Custom Add Form */}
                {isAddingCustomModel && (
                  <div className={`${YUME_ADMIN_TOKENS.subCardClass} p-5 mb-4 text-left flex flex-col gap-4 animate-fade-in`}>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[#1e2631] dark:text-sky-400" />
                      Add Custom AI Model / Provider Endpoint
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={YUME_ADMIN_TOKENS.labelClass}>Model Name <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          placeholder="e.g. Claude 3.5 Sonnet / Llama 3.3"
                          value={newModelName}
                          onChange={(e) => setNewModelName(e.target.value)}
                          className={YUME_ADMIN_TOKENS.inputClass}
                        />
                      </div>
                      <div>
                        <label className={YUME_ADMIN_TOKENS.labelClass}>Provider / Vendor</label>
                        <input
                          type="text"
                          placeholder="e.g. Anthropic / Groq / Ollama / Custom API"
                          value={newModelProvider}
                          onChange={(e) => setNewModelProvider(e.target.value)}
                          className={YUME_ADMIN_TOKENS.inputClass}
                        />
                      </div>
                      <div>
                        <label className={YUME_ADMIN_TOKENS.labelClass}>Model ID / Alias</label>
                        <input
                          type="text"
                          placeholder="e.g. claude-3-5-sonnet-20241022"
                          value={newModelId}
                          onChange={(e) => setNewModelId(e.target.value)}
                          className={`${YUME_ADMIN_TOKENS.inputClass} font-sans`}
                        />
                      </div>
                      <div>
                        <label className={YUME_ADMIN_TOKENS.labelClass}>API Endpoint Base URL (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. https://api.anthropic.com/v1"
                          value={newModelBaseUrl}
                          onChange={(e) => setNewModelBaseUrl(e.target.value)}
                          className={`${YUME_ADMIN_TOKENS.inputClass} font-sans`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomModel(false)}
                        className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomModel}
                        disabled={!newModelName.trim()}
                        className={YUME_ADMIN_TOKENS.primaryButtonClass}
                      >
                        Save &amp; Set Active
                      </button>
                    </div>
                  </div>
                )}

                {/* Models List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customAiModels.map((m) => {
                    const isSelected = activeAiModel === m.name;
                    return (
                      <div
                        key={m.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-stone-100/90 dark:bg-slate-800/80 border-[#1e2631] dark:border-sky-400"
                            : "bg-stone-50/70 dark:bg-slate-950/60 border-stone-200/80 dark:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                            🤖
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-stone-900 dark:text-white truncate flex items-center gap-1.5">
                              <span>{m.name}</span>
                              {isSelected && (
                                <span className="text-[9px] font-bold bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 px-2 py-0.5 rounded-full uppercase">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 dark:text-slate-400 font-sans truncate">
                              {m.provider} {m.modelId ? `• ${m.modelId}` : ""}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isSelected && (
                            <button
                              type="button"
                              onClick={() => handleSelectActiveModel(m.name)}
                              className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                            >
                              Use
                            </button>
                          )}
                          {!["cm-1", "cm-2", "cm-3", "cm-4"].includes(m.id) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomModel(m.id)}
                              className="p-2 text-stone-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                              title="Delete model"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Boutique Cover Templates */}
        {adminTab === "cover_templates" && (
          <div className="flex flex-col gap-6 text-left">
            <YumeAdminAdviceBanner>
              Curate and maintain hero cover templates available in the Merchant Style Customizer. Templates registered here immediately appear for eligible subscription tiers.
            </YumeAdminAdviceBanner>

            <div className={YUME_ADMIN_TOKENS.cardClass}>
              <YumeAdminSectionHeader
                title="Manage Platform Boutique Cover Templates"
                subtitle="Administer cover templates displayed inside merchant style customizer dashboards. Create, update, or deprecate design settings models."
                rightSlot={
                  !isAddingTemplate && !editingTemplateId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateForm({ id: `tpl-${Date.now().toString().slice(-4)}`, name: "", description: "", badgeText: "" });
                        setIsAddingTemplate(true);
                      }}
                      className={YUME_ADMIN_TOKENS.primaryButtonClass}
                    >
                      <Plus className="w-4 h-4" />
                      Create New Design Template
                    </button>
                  ) : undefined
                }
              />

              {/* Template Editor/Creator Form */}
              {(isAddingTemplate || editingTemplateId) && (
                <div className={`${YUME_ADMIN_TOKENS.subCardClass} p-5 sm:p-6 flex flex-col gap-4 animate-fade-in text-left`}>
                  <div className="flex justify-between items-center pb-3 border-b border-stone-200/80 dark:border-slate-800">
                    <span className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                      {isAddingTemplate ? "Register New Cover Template" : "Customize Cover Template Properties"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingTemplate(false);
                        setEditingTemplateId(null);
                      }}
                      className="text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={YUME_ADMIN_TOKENS.labelClass}>Template ID (Unique reference) <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        disabled={!!editingTemplateId}
                        value={templateForm.id}
                        onChange={(e) => setTemplateForm({ ...templateForm, id: e.target.value })}
                        className={`${YUME_ADMIN_TOKENS.inputClass} font-sans disabled:opacity-60`}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={YUME_ADMIN_TOKENS.labelClass}>Display Name <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. Classic Slideshow"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                        className={YUME_ADMIN_TOKENS.inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={YUME_ADMIN_TOKENS.labelClass}>Badge Text Accent (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. PREMIUM LUXURY"
                        value={templateForm.badgeText}
                        onChange={(e) => setTemplateForm({ ...templateForm, badgeText: e.target.value })}
                        className={YUME_ADMIN_TOKENS.inputClass}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={YUME_ADMIN_TOKENS.labelClass}>Description Bio <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. Generates structured perspective layout animations with image floating transitions."
                        value={templateForm.description}
                        onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                        className={YUME_ADMIN_TOKENS.inputClass}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingTemplate(false);
                        setEditingTemplateId(null);
                      }}
                      className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!templateForm.id || !templateForm.name || !templateForm.description) {
                          showAdminToast("Please fill all required template parameters.", "error");
                          return;
                        }
                        if (onSaveCoverTemplates) {
                          if (isAddingTemplate) {
                            const exists = coverTemplates.some(t => t.id === templateForm.id);
                            if (exists) {
                              showAdminToast("Template ID already exists! Please supply a unique value.", "error");
                              return;
                            }
                            const newTpl: CoverTemplate = {
                              id: templateForm.id,
                              name: templateForm.name,
                              description: templateForm.description,
                              badgeText: templateForm.badgeText,
                              images: []
                            };
                            onSaveCoverTemplates([...coverTemplates, newTpl]);
                          } else {
                            const updated = coverTemplates.map(t => {
                              if (t.id === editingTemplateId) {
                                return {
                                  ...t,
                                  name: templateForm.name,
                                  description: templateForm.description,
                                  badgeText: templateForm.badgeText
                                };
                              }
                              return t;
                            });
                            onSaveCoverTemplates(updated);
                          }
                        }
                        setIsAddingTemplate(false);
                        setEditingTemplateId(null);
                      }}
                      className={YUME_ADMIN_TOKENS.primaryButtonClass}
                    >
                      Apply &amp; Deploy Template
                    </button>
                  </div>
                </div>
              )}

              {/* Cover Templates List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coverTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className={`${YUME_ADMIN_TOKENS.subCardClass} p-5 flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-slate-400 font-sans bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 px-2.5 py-0.5 rounded-full">
                          ID: {tpl.id}
                        </span>
                        {tpl.badgeText && (
                          <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 px-2 py-0.5 rounded-md">
                            ★ {tpl.badgeText}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-stone-900 dark:text-white leading-tight font-sans block mb-1.5">
                        {tpl.name}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-stone-400 font-bold font-sans">
                        {(tpl.images || []).length} registered slides
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTemplateForm({
                              id: tpl.id,
                              name: tpl.name,
                              description: tpl.description,
                              badgeText: tpl.badgeText || ""
                            });
                            setEditingTemplateId(tpl.id);
                            setIsAddingTemplate(false);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300 font-bold text-xs border border-stone-200/90 dark:border-slate-800 cursor-pointer transition-all"
                        >
                          Configure Settings
                        </button>

                        {tpl.id !== "toonhub" && tpl.id !== "classic" && (
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmModalState({
                                title: "Remove Cover Template",
                                subtitle: `Template ID: ${tpl.id}`,
                                description: `Are you sure you want to permanently remove the "${tpl.name}" cover template from the platform? Merchants will no longer be able to select this layout.`,
                                confirmLabel: "Remove Template",
                                variant: "danger",
                                onConfirm: () => {
                                  if (onSaveCoverTemplates) {
                                    onSaveCoverTemplates(coverTemplates.filter(t => t.id !== tpl.id));
                                    showAdminToast(`Cover template "${tpl.name}" removed.`);
                                  }
                                  setConfirmModalState(null);
                                },
                              });
                            }}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            title="Remove Cover Template"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Brands & Models Management */}
        {adminTab === "brands" && (
          <div className="flex flex-col gap-6 text-left font-sans animate-fade-in">
            <YumeAdminAdviceBanner>
              Manage official device brands, curate approved model lists for electronics &amp; accessories listings, and moderate custom model submissions from merchants.
            </YumeAdminAdviceBanner>

            {/* Header & Stats Bar */}
            <div className={YUME_ADMIN_TOKENS.cardClass}>
              <YumeAdminSectionHeader
                title="Smartphone Brands & Models Registry"
                subtitle="Manage official smartphone brands, approved models, and process custom submissions from merchants"
                rightSlot={
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-stone-50/80 dark:bg-slate-950 border border-stone-200/80 dark:border-slate-800">
                      <span className="text-xs font-bold text-stone-600 dark:text-slate-400">Brands</span>
                      <span className="w-7 h-7 rounded-full bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 text-xs font-extrabold font-sans tabular-nums flex items-center justify-center">
                        {brands.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-stone-50/80 dark:bg-slate-950 border border-stone-200/80 dark:border-slate-800">
                      <span className="text-xs font-bold text-stone-600 dark:text-slate-400">Pending Review</span>
                      <span className="w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-extrabold font-sans tabular-nums flex items-center justify-center">
                        {pendingModels.filter(m => m.status === "pending").length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBrand(null);
                        setBrandForm({ id: "", name: "", category: "electronics_devices", modelsString: "" });
                        setShowAddBrand(true);
                      }}
                      className={YUME_ADMIN_TOKENS.primaryButtonClass}
                    >
                      <Plus className="w-4 h-4" /> Add Brand
                    </button>
                  </div>
                }
              />

              {/* Brands Form Modal / Panel */}
              {showAddBrand && (
                <div className={`${YUME_ADMIN_TOKENS.subCardClass} p-5 sm:p-6 flex flex-col gap-4`}>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    {editingBrand ? `Edit Brand: ${editingBrand.name}` : "Create New Device Brand"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={YUME_ADMIN_TOKENS.labelClass}>Unique Brand ID (lowercase) <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        disabled={!!editingBrand}
                        placeholder="e.g. tech_brand, mobile_corp"
                        value={brandForm.id}
                        onChange={(e) => setBrandForm({ ...brandForm, id: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                        className={`${YUME_ADMIN_TOKENS.inputClass} font-sans disabled:opacity-60`}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={YUME_ADMIN_TOKENS.labelClass}>Display Brand Name <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. Tech Brand, Mobile Corp"
                        value={brandForm.name}
                        onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                        className={YUME_ADMIN_TOKENS.inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={YUME_ADMIN_TOKENS.labelClass}>Main Category</label>
                      <select
                        value={brandForm.category}
                        onChange={(e) => setBrandForm({ ...brandForm, category: e.target.value })}
                        className={YUME_ADMIN_TOKENS.selectClass}
                      >
                        <option value="electronics_devices">Smart Devices &amp; Electronics</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={YUME_ADMIN_TOKENS.labelClass}>Models List (comma-separated)</label>
                    <textarea
                      placeholder="Model 15 Pro, Model 15, Model 14"
                      value={brandForm.modelsString}
                      onChange={(e) => setBrandForm({ ...brandForm, modelsString: e.target.value })}
                      rows={3}
                      className={YUME_ADMIN_TOKENS.textareaClass}
                    />
                    <span className={YUME_ADMIN_TOKENS.helperClass}>Provide official models separated by commas.</span>
                  </div>
                  <div className="flex justify-end gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddBrand(false);
                        setEditingBrand(null);
                      }}
                      className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!brandForm.id || !brandForm.name) {
                          showAdminToast("Please provide Brand ID and Display Name.", "error");
                          return;
                        }
                        const modelsList = brandForm.modelsString
                          .split(",")
                          .map(m => m.trim())
                          .filter(Boolean);

                        const updatedBrand: Brand = {
                          id: brandForm.id,
                          name: brandForm.name,
                          category: brandForm.category,
                          models: modelsList
                        };

                        try {
                          await saveBrandToFirestore(updatedBrand);
                          await loadBrandsAndPending();
                          setShowAddBrand(false);
                          setEditingBrand(null);
                          showAdminToast(`Brand "${updatedBrand.name}" saved.`);
                        } catch (err) {
                          showAdminToast("Error saving brand: " + err, "error");
                        }
                      }}
                      className={YUME_ADMIN_TOKENS.primaryButtonClass}
                    >
                      Save Brand
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Grid Layout: Pending Submissions & Approved Brands */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Side: Pending Models Queue */}
              <div className={`lg:col-span-4 ${YUME_ADMIN_TOKENS.cardClass}`}>
                <YumeAdminSectionHeader
                  title={`Review Queue (${pendingModels.filter(p => p.status === "pending").length})`}
                  subtitle="Merchant custom model entries"
                />

                <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {pendingModels.length === 0 ? (
                    <div className="py-8 text-center text-xs text-stone-400 dark:text-slate-500 font-medium">
                      No custom model submissions found.
                    </div>
                  ) : (
                    pendingModels.map(pending => (
                      <div 
                        key={pending.id} 
                        className={`p-4 border rounded-2xl flex flex-col gap-2.5 transition-all text-left ${
                          pending.status === "pending"
                            ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/50"
                            : pending.status === "approved"
                            ? "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/50"
                            : "bg-rose-50/30 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-800/50"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold font-sans px-2 py-0.5 bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 rounded-md uppercase">
                              {pending.brandName}
                            </span>
                            <h4 className="text-xs font-bold text-stone-900 dark:text-white mt-1.5">
                              {pending.modelName}
                            </h4>
                          </div>
                          <span className={`text-[10px] font-bold font-sans px-2 py-0.5 rounded-full capitalize ${
                            pending.status === "pending"
                              ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                              : pending.status === "approved"
                              ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                              : "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300"
                          }`}>
                            {pending.status}
                          </span>
                        </div>

                        {pending.status === "pending" && (
                          <div className="flex gap-2 justify-end pt-2 border-t border-stone-200/60 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await processPendingModel(pending, "rejected");
                                  await loadBrandsAndPending();
                                  showAdminToast(`Model "${pending.modelName}" rejected.`);
                                } catch (err) {
                                  showAdminToast("Error processing: " + err, "error");
                                }
                              }}
                              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await processPendingModel(pending, "approved");
                                  await loadBrandsAndPending();
                                  showAdminToast(`Model "${pending.modelName}" approved.`);
                                } catch (err) {
                                  showAdminToast("Error processing: " + err, "error");
                                }
                              }}
                              className="bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#2a3544] transition-colors cursor-pointer"
                            >
                              Approve &amp; Add
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Side: Approved Brands and Models */}
              <div className={`lg:col-span-8 ${YUME_ADMIN_TOKENS.cardClass}`}>
                <YumeAdminSectionHeader
                  title={`Approved Device Brands & Models (${brands.length})`}
                  subtitle="Official catalog brands and verified device models"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {brands.map(brand => (
                    <div 
                      key={brand.id}
                      className={`${YUME_ADMIN_TOKENS.subCardClass} p-4 flex flex-col justify-between gap-3 text-left`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-bold text-stone-900 dark:text-white">{brand.name}</h4>
                          <span className="text-[10px] text-stone-400 dark:text-slate-500 font-sans font-bold uppercase">{brand.id}</span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-slate-400 font-sans font-medium mt-1 uppercase">
                          📂 {brand.category}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {brand.models.map(m => (
                            <span 
                              key={m}
                              className="text-[10px] font-bold text-stone-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 px-2.5 py-0.5 rounded-lg"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-3 border-t border-stone-200/80 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBrand(brand);
                            setBrandForm({
                              id: brand.id,
                              name: brand.name,
                              category: brand.category,
                              modelsString: brand.models.join(", ")
                            });
                            setShowAddBrand(true);
                          }}
                          className="text-xs font-bold text-[#1e2631] dark:text-sky-400 hover:underline cursor-pointer"
                        >
                          Edit Brand
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModalState({
                              title: "Delete Device Brand",
                              subtitle: `Brand ID: ${brand.id}`,
                              description: `Are you sure you want to permanently delete "${brand.name}" and its ${brand.models.length} approved models from the registry?`,
                              confirmLabel: "Delete Brand",
                              variant: "danger",
                              onConfirm: async () => {
                                setConfirmModalState(null);
                                try {
                                  await deleteBrandFromFirestore(brand.id);
                                  await loadBrandsAndPending();
                                  showAdminToast(`Brand "${brand.name}" removed.`);
                                } catch (err) {
                                  showAdminToast("Error deleting: " + err, "error");
                                }
                              },
                            });
                          }}
                          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Dynamic Categories Management */}
        {adminTab === "categories" && (
          <div className="flex flex-col gap-6 text-left font-sans animate-fade-in">
            <YumeAdminAdviceBanner>
              Add, edit, reorder, or safe-delete catalog departments, subcategories, custom sizing matrices, and specification schema fields used in the Merchant Add Product flow.
            </YumeAdminAdviceBanner>

            {/* Sub-Navigation Card Strip (Add New Product horizontal card strip pattern) */}
            <YumeAdminSubNavStrip
              columnsClass="grid-cols-1 sm:grid-cols-2"
              activeId={categoriesTab}
              onSelect={(id) => setCategoriesTab(id as "main" | "sub")}
              items={[
                {
                  id: "main",
                  title: "Main Departments Registry",
                  subtitle: "Top-level marketplace departments & icons",
                  badge: mainCategories.length,
                  icon: Folder,
                },
                {
                  id: "sub",
                  title: "Subcategories Directory",
                  subtitle: "Sub-departments, sizing matrices & spec fields",
                  badge: subcategories.length,
                  icon: FolderOpen,
                },
              ]}
            />

            {categoriesTab === "main" ? (() => {
              const getAdminCategoryIcon = (iconName?: string, catName?: string): React.ComponentType<{ className?: string }> => {
                const raw = (iconName || catName || "").trim();
                const lower = raw.toLowerCase();
                if (lower === "bookopen" || lower.includes("book")) return BookOpen;
                if (lower === "music" || lower.includes("music")) return Music;
                if (lower === "gamepad2" || lower.includes("toy") || lower.includes("game")) return Gamepad2;
                if (lower === "car" || lower.includes("auto") || lower.includes("car")) return Car;
                if (lower === "dumbbell" || lower.includes("sport")) return Dumbbell;
                if (lower === "trophy") return Trophy;
                if (lower === "smartphone" || lower.includes("electron")) return Smartphone;
                if (lower === "cookingpot" || lower.includes("kitchen")) return CookingPot;
                if (lower === "sofa" || lower.includes("living") || lower.includes("decor")) return Sofa;
                if (lower === "flower2" || lower.includes("garden") || lower.includes("plant")) return Flower2;
                if (lower === "heartpulse" || lower.includes("health")) return HeartPulse;
                if (lower === "shoppingbasket" || lower.includes("grocery")) return ShoppingBasket;
                if (lower === "flaskconical" || lower.includes("industr") || lower.includes("science")) return FlaskConical;
                if (lower === "crown" || lower.includes("collect")) return Crown;
                if (lower === "hanger" || lower.includes("cloth") || lower.includes("shoe")) return ClothingHangerIcon;
                if (lower === "gem" || lower.includes("jewel")) return Gem;
                if (lower === "shirt" || lower.includes("fashion")) return Shirt;
                if (lower === "baby" || lower.includes("kid")) return Baby;
                if (lower === "utensils" || lower.includes("food")) return Utensils;
                if (lower === "wrench" || lower.includes("tool")) return Wrench;
                if (lower === "perfume" || lower.includes("beauty") || lower.includes("care") || lower.includes("cosmetic")) return BeautyCareIcon;
                if (lower === "sparkles") return SparklesIcon;
                if (lower === "camera" || lower.includes("photo")) return Camera;
                if (lower === "tv") return Tv;
                if (lower === "pawprint" || lower.includes("pet")) return PawPrint;
                if (lower === "coffee") return Coffee;
                if (lower === "watch") return Watch;
                if (lower === "gift") return Gift;
                if (lower === "home") return Home;
                if (lower === "palette" || lower.includes("craft") || lower.includes("art")) return Palette;
                return Palette;
              };

              return (
              /* TAB: MAIN CATEGORIES MANAGEMENT TABLE */
              <div className={`${YUME_ADMIN_TOKENS.cardClass} animate-fade-in`}>
                <YumeAdminSectionHeader
                  title="Main Departments Registry"
                  subtitle="Manage top-level marketplace departments, localized titles, and sort order"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMainCategory(null);
                        setMainCategoryForm({
                          id: "",
                          names: { en: "", ar: "", fr: "" },
                          icon: "Shirt",
                          image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80"
                        });
                        setShowAddMainCategory(true);
                      }}
                      className={YUME_ADMIN_TOKENS.primaryButtonClass}
                    >
                      <Plus className="w-4 h-4" />
                      Create Main Department
                    </button>
                  }
                />

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-stone-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search main departments by name or ID..."
                      value={mainCatSearch}
                      onChange={(e) => setMainCatSearch(e.target.value)}
                      className={`${YUME_ADMIN_TOKENS.inputClass} pl-10`}
                    />
                  </div>
                </div>

                {/* Form to Add/Edit Main Category inline */}
                {showAddMainCategory && (
                  <div className={`${YUME_ADMIN_TOKENS.subCardClass} p-5 sm:p-6 flex flex-col gap-4 text-left animate-fade-in`}>
                    <div className="flex justify-between items-center border-b border-stone-200/80 dark:border-slate-800 pb-3">
                      <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                        <Palette className="w-4 h-4 text-[#1e2631] dark:text-sky-400" />
                        {editingMainCategory ? "Update Existing Department Blueprint" : "Register New Department"}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddMainCategory(false);
                          setEditingMainCategory(null);
                        }}
                        className="text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {!editingMainCategory ? (
                        <div className="flex flex-col gap-1">
                          <label className={YUME_ADMIN_TOKENS.labelClass}>Unique Key ID <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            placeholder="e.g. fashion_attire"
                            value={mainCategoryForm.id}
                            onChange={(e) => setMainCategoryForm({ ...mainCategoryForm, id: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                            className={`${YUME_ADMIN_TOKENS.inputClass} font-sans`}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 opacity-70">
                          <label className={YUME_ADMIN_TOKENS.labelClass}>Unique Key ID (Immutable)</label>
                          <input
                            type="text"
                            disabled
                            value={mainCategoryForm.id}
                            className={`${YUME_ADMIN_TOKENS.inputClass} font-sans cursor-not-allowed`}
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <label className={YUME_ADMIN_TOKENS.labelClass}>English Title Name <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          placeholder="e.g. Clothing & Apparel"
                          value={mainCategoryForm.names.en}
                          onChange={(e) => setMainCategoryForm({ ...mainCategoryForm, names: { ...mainCategoryForm.names, en: e.target.value } })}
                          className={YUME_ADMIN_TOKENS.inputClass}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={YUME_ADMIN_TOKENS.labelClass}>Arabic Title Name</label>
                        <input
                          type="text"
                          placeholder="e.g. ملابس وأزياء"
                          value={mainCategoryForm.names.ar}
                          onChange={(e) => setMainCategoryForm({ ...mainCategoryForm, names: { ...mainCategoryForm.names, ar: e.target.value } })}
                          className={YUME_ADMIN_TOKENS.inputClass}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={YUME_ADMIN_TOKENS.labelClass}>French Title Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Vêtements & Mode"
                          value={mainCategoryForm.names.fr}
                          onChange={(e) => setMainCategoryForm({ ...mainCategoryForm, names: { ...mainCategoryForm.names, fr: e.target.value } })}
                          className={YUME_ADMIN_TOKENS.inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className={YUME_ADMIN_TOKENS.labelClass}>Icon Representation</label>
                        <select
                          value={mainCategoryForm.icon}
                          onChange={(e) => setMainCategoryForm({ ...mainCategoryForm, icon: e.target.value })}
                          className={YUME_ADMIN_TOKENS.selectClass}
                        >
                          {["Shirt", "Baby", "BookOpen", "Music", "Car", "Gamepad2", "Dumbbell", "Trophy", "Smartphone", "CookingPot", "Sofa", "Flower2", "HeartPulse", "ShoppingBasket", "FlaskConical", "Crown", "Gem", "Utensils", "Palette", "Wrench", "Sparkles", "Camera", "Tv", "Heart", "Home", "PawPrint", "Coffee", "Watch", "Gift"].map(ic => (
                            <option key={ic} value={ic}>{ic}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={YUME_ADMIN_TOKENS.labelClass}>Splash Image URL</label>
                        <input
                          type="text"
                          placeholder="e.g. Unsplash cover photo URL"
                          value={mainCategoryForm.image}
                          onChange={(e) => setMainCategoryForm({ ...mainCategoryForm, image: e.target.value })}
                          className={YUME_ADMIN_TOKENS.inputClass}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-stone-200/80 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddMainCategory(false);
                          setEditingMainCategory(null);
                        }}
                        className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const formId = editingMainCategory ? editingMainCategory.id : mainCategoryForm.id;
                          if (!formId || !mainCategoryForm.names.en) {
                            showAdminToast("Please fill at least the English name and a unique key ID.", "error");
                            return;
                          }

                          const finalNames = {
                            en: mainCategoryForm.names.en,
                            ar: mainCategoryForm.names.ar || mainCategoryForm.names.en,
                            fr: mainCategoryForm.names.fr || mainCategoryForm.names.en,
                          };

                          const newCat: MainCategory = {
                            id: formId,
                            names: finalNames,
                            icon: mainCategoryForm.icon,
                            image: mainCategoryForm.image,
                            order: editingMainCategory ? editingMainCategory.order : mainCategories.length,
                            createdAt: editingMainCategory ? (editingMainCategory.createdAt || getCategoryCreatedAt(editingMainCategory)) : new Date().toISOString(),
                          };

                          await saveMainCategoryToFirestore(newCat);

                          if (editingMainCategory) {
                            setMainCategories(prev => prev.map(c => c.id === formId ? newCat : c));
                          } else {
                            setMainCategories(prev => [...prev, newCat]);
                          }

                          setShowAddMainCategory(false);
                          setEditingMainCategory(null);
                        }}
                        className={YUME_ADMIN_TOKENS.primaryButtonClass}
                      >
                        {editingMainCategory ? "Save Changes" : "Create Department"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Main Category Management Table */}
                <div className="overflow-x-auto rounded-2xl border border-stone-200/80 dark:border-slate-800">
                  <table id="platform-admin-category-table" className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50/80 dark:bg-slate-950 border-b border-stone-200/80 dark:border-slate-800 text-stone-500 dark:text-slate-400 uppercase tracking-wider font-sans text-[10px] font-bold">
                        <th className="px-5 py-3.5 font-semibold">Department Image</th>
                        <th className="px-5 py-3.5 font-semibold">Unique Key ID</th>
                        <th 
                          className="px-5 py-3.5 font-semibold cursor-pointer select-none hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                          onClick={() => handleCatSort("name")}
                        >
                          <div className="flex items-center gap-1">
                            Category Name
                            {catSortField === "name" ? (catSortOrder === "asc" ? " ▲" : " ▼") : " ↕"}
                          </div>
                        </th>
                        <th className="px-5 py-3.5 font-semibold">Arabic Name</th>
                        <th className="px-5 py-3.5 font-semibold">French Name</th>
                        <th 
                          className="px-5 py-3.5 font-semibold cursor-pointer select-none hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                          onClick={() => handleCatSort("date")}
                        >
                          <div className="flex items-center gap-1">
                            Created Date
                            {catSortField === "date" ? (catSortOrder === "asc" ? " ▲" : " ▼") : " ↕"}
                          </div>
                        </th>
                        <th className="px-5 py-3.5 font-semibold text-center">Subcategories</th>
                        <th className="px-5 py-3.5 font-semibold text-center">Sort Order</th>
                        <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
                      {[...mainCategories]
                        .filter(cat => {
                          const search = mainCatSearch.toLowerCase().trim();
                          if (!search) return true;
                          return (
                            cat.id.toLowerCase().includes(search) ||
                            (cat.names.en || "").toLowerCase().includes(search) ||
                            (cat.names.ar || "").toLowerCase().includes(search) ||
                            (cat.names.fr || "").toLowerCase().includes(search)
                          );
                        })
                        .sort((a, b) => {
                          if (!catSortField) return 0;
                          if (catSortField === "name") {
                            const nameA = (a.names.en || "").toLowerCase();
                            const nameB = (b.names.en || "").toLowerCase();
                            if (nameA < nameB) return catSortOrder === "asc" ? -1 : 1;
                            if (nameA > nameB) return catSortOrder === "asc" ? 1 : -1;
                            return 0;
                          } else {
                            const dateA = new Date(getCategoryCreatedAt(a)).getTime();
                            const dateB = new Date(getCategoryCreatedAt(b)).getTime();
                            return catSortOrder === "asc" ? dateA - dateB : dateB - dateA;
                          }
                        })
                        .map((cat, idx, arr) => {
                          const subCount = subcategories.filter(s => s.mainCategoryId === cat.id).length;
                          return (
                            <tr 
                              key={cat.id}
                              className="bg-white dark:bg-slate-900 hover:bg-stone-50/70 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  {cat.image ? (
                                    <img 
                                      src={cat.image} 
                                      alt={cat.names.en} 
                                      className="w-10 h-10 rounded-xl object-cover border border-stone-200 dark:border-slate-800 bg-stone-100" 
                                      referrerPolicy="no-referrer" 
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center text-[#1e2631] dark:text-sky-400">
                                      {(() => {
                                        const CatIcon = getAdminCategoryIcon(cat.icon, cat.names?.en || cat.id);
                                        return <CatIcon className="w-5 h-5" />;
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-3 font-sans text-[11px] font-bold text-stone-500 dark:text-slate-400">
                                {cat.id}
                              </td>
                              <td className="px-5 py-3 font-bold text-stone-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const CatIcon = getAdminCategoryIcon(cat.icon, cat.names?.en || cat.id);
                                    return <CatIcon className="w-4 h-4 text-stone-500 dark:text-slate-400 shrink-0" />;
                                  })()}
                                  <span>{cat.names.en}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 font-bold text-stone-900 dark:text-white" dir="rtl">
                                {cat.names.ar}
                              </td>
                              <td className="px-5 py-3 text-stone-600 dark:text-slate-300">
                                {cat.names.fr || "—"}
                              </td>
                              <td className="px-5 py-3 font-sans text-[11px] text-stone-600 dark:text-slate-300">
                                {formatDate(getCategoryCreatedAt(cat))}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300 border border-stone-200/80 dark:border-slate-700">
                                  {subCount} registered
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={async () => {
                                      const originalIdx = mainCategories.findIndex(c => c.id === cat.id);
                                      if (originalIdx > 0) {
                                        const newList = [...mainCategories];
                                        const [temp] = newList.splice(originalIdx, 1);
                                        newList.splice(originalIdx - 1, 0, temp);
                                        setMainCategories(newList);
                                        await saveReorderedCategoriesToFirestore(newList);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-30 text-stone-500 cursor-pointer"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === arr.length - 1}
                                    onClick={async () => {
                                      const originalIdx = mainCategories.findIndex(c => c.id === cat.id);
                                      if (originalIdx !== -1 && originalIdx < mainCategories.length - 1) {
                                        const newList = [...mainCategories];
                                        const [temp] = newList.splice(originalIdx, 1);
                                        newList.splice(originalIdx + 1, 0, temp);
                                        setMainCategories(newList);
                                        await saveReorderedCategoriesToFirestore(newList);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-30 text-stone-500 cursor-pointer"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMainCategory(cat);
                                      setMainCategoryForm({
                                        id: cat.id,
                                        names: cat.names,
                                        icon: cat.icon,
                                        image: cat.image
                                      });
                                      setShowAddMainCategory(true);
                                    }}
                                    className="p-2 rounded-xl text-[#1e2631] dark:text-sky-400 hover:bg-stone-100 dark:hover:bg-slate-800 border border-transparent hover:border-stone-200 dark:hover:border-slate-700 cursor-pointer"
                                    title="Edit Department"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSafeDeleteMainCategory(cat);
                                      setSafeDeleteAction("archive");
                                      setSafeDeleteTargetId(mainCategories.find(c => c.id !== cat.id)?.id || "");
                                    }}
                                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 cursor-pointer"
                                    title="Remove Department"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      {mainCategories.filter(cat => {
                        const search = mainCatSearch.toLowerCase().trim();
                        if (!search) return true;
                        return (
                          cat.id.toLowerCase().includes(search) ||
                          (cat.names.en || "").toLowerCase().includes(search) ||
                          (cat.names.ar || "").toLowerCase().includes(search) ||
                          (cat.names.fr || "").toLowerCase().includes(search)
                        );
                      }).length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-stone-400 dark:text-slate-500 font-bold text-xs">
                            No main departments match your search query.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ); })() : (
              /* TAB: SUBCATEGORIES MANAGEMENT TABLE */
              <div className={`${YUME_ADMIN_TOKENS.cardClass} animate-fade-in`}>
                <YumeAdminSectionHeader
                  title="Subcategories Directory"
                  subtitle="Manage sub-departments, sizing matrices, recommended materials, and custom specification fields"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSubcategory(null);
                        if (!selectedMainCategoryId && mainCategories.length > 0) {
                          setSelectedMainCategoryId(mainCategories[0].id);
                        }
                        setSubcategoryForm({
                          id: "",
                          names: { en: "", ar: "", fr: "" },
                          icon: "Folder",
                          image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80",
                          sizeSystemEnabled: false,
                          sizeSystemLabel: "Sizes Available",
                          sizeSystemSizes: "S, M, L, XL",
                          recommendedMaterials: "Cotton, Linen",
                          fields: [
                            { name: "Material", type: "text", required: false, placeholder: "e.g. 100% Wool" }
                          ]
                        });
                        setShowAddSubcategory(true);
                      }}
                      className={YUME_ADMIN_TOKENS.primaryButtonClass}
                    >
                      <Plus className="w-4 h-4" />
                      Create Subcategory
                    </button>
                  }
                />

                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                  <div className="flex flex-col sm:flex-row flex-1 gap-3 max-w-2xl">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-stone-400">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search subcategories by name, ID, or materials..."
                        value={subCatSearch}
                        onChange={(e) => setSubCatSearch(e.target.value)}
                        className={`${YUME_ADMIN_TOKENS.inputClass} pl-10`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-500 shrink-0">Dept:</span>
                      <select
                        value={subCatDeptFilter}
                        onChange={(e) => setSubCatDeptFilter(e.target.value)}
                        className={YUME_ADMIN_TOKENS.selectClass}
                      >
                        <option value="all">All Departments</option>
                        {mainCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.names.en}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Form to Add/Edit Subcategory inline */}
                {showAddSubcategory && (
                  <div className={`${YUME_ADMIN_TOKENS.subCardClass} p-5 sm:p-6 flex flex-col gap-4 text-left animate-fade-in`}>
                    <div className="flex justify-between items-center border-b border-stone-200/80 dark:border-slate-800 pb-3">
                      <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                        <Folder className="w-4 h-4 text-[#1e2631] dark:text-sky-400" />
                        {editingSubcategory ? "Update Existing Subcategory Blueprint" : "Register New Subcategory"}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddSubcategory(false);
                          setEditingSubcategory(null);
                        }}
                        className="text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className={YUME_ADMIN_TOKENS.labelClass}>Parent Department Link</label>
                        <select
                          value={selectedMainCategoryId}
                          onChange={(e) => setSelectedMainCategoryId(e.target.value)}
                          className={YUME_ADMIN_TOKENS.selectClass}
                        >
                          {mainCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.names.en} (id: {cat.id})</option>
                          ))}
                        </select>
                      </div>

                      {!editingSubcategory ? (
                        <div className="flex flex-col gap-1">
                          <label className={YUME_ADMIN_TOKENS.labelClass}>Unique Key Code <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            placeholder="e.g. smart_watches"
                            value={subcategoryForm.id}
                            onChange={(e) => setSubcategoryForm({ ...subcategoryForm, id: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                            className={`${YUME_ADMIN_TOKENS.inputClass} font-sans`}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 opacity-70">
                          <label className={YUME_ADMIN_TOKENS.labelClass}>Unique Key Code (Immutable)</label>
                          <input
                            type="text"
                            disabled
                            value={subcategoryForm.id}
                            className={`${YUME_ADMIN_TOKENS.inputClass} font-sans cursor-not-allowed`}
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <label className={YUME_ADMIN_TOKENS.labelClass}>English Name <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          placeholder="e.g. Running Shoes"
                          value={subcategoryForm.names.en}
                          onChange={(e) => setSubcategoryForm({ ...subcategoryForm, names: { ...subcategoryForm.names, en: e.target.value } })}
                          className={YUME_ADMIN_TOKENS.inputClass}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={YUME_ADMIN_TOKENS.labelClass}>Arabic Name</label>
                        <input
                          type="text"
                          placeholder="e.g. أحذية الجري"
                          value={subcategoryForm.names.ar}
                          onChange={(e) => setSubcategoryForm({ ...subcategoryForm, names: { ...subcategoryForm.names, ar: e.target.value } })}
                          className={YUME_ADMIN_TOKENS.inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className={YUME_ADMIN_TOKENS.labelClass}>French Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Chaussures de Course"
                          value={subcategoryForm.names.fr}
                          onChange={(e) => setSubcategoryForm({ ...subcategoryForm, names: { ...subcategoryForm.names, fr: e.target.value } })}
                          className={YUME_ADMIN_TOKENS.inputClass}
                        />
                      </div>

                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className={YUME_ADMIN_TOKENS.labelClass}>Recommended/Allowed Materials (Comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Polyester, Mesh, Rubber"
                          value={subcategoryForm.recommendedMaterials}
                          onChange={(e) => setSubcategoryForm({ ...subcategoryForm, recommendedMaterials: e.target.value })}
                          className={YUME_ADMIN_TOKENS.inputClass}
                        />
                      </div>
                    </div>

                    {/* Sizing Matrix System */}
                    <div className="border-t border-stone-200/80 dark:border-slate-800 pt-3">
                      <div className="flex items-center gap-2.5 mb-2">
                        <input
                          type="checkbox"
                          id="sizeSystemEnabledTable"
                          checked={subcategoryForm.sizeSystemEnabled}
                          onChange={(e) => setSubcategoryForm({ ...subcategoryForm, sizeSystemEnabled: e.target.checked })}
                          className="w-4 h-4 cursor-pointer accent-[#1e2631] dark:accent-sky-400"
                        />
                        <label htmlFor="sizeSystemEnabledTable" className="text-xs font-bold text-stone-800 dark:text-slate-200 cursor-pointer select-none">
                          Enable Sizing System Blueprint Matrix
                        </label>
                      </div>

                      {subcategoryForm.sizeSystemEnabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 mt-2">
                          <div className="flex flex-col gap-1">
                            <label className={YUME_ADMIN_TOKENS.labelClass}>Sizing Title Label</label>
                            <input
                              type="text"
                              placeholder="e.g. Shoes Size (EU)"
                              value={subcategoryForm.sizeSystemLabel}
                              onChange={(e) => setSubcategoryForm({ ...subcategoryForm, sizeSystemLabel: e.target.value })}
                              className={YUME_ADMIN_TOKENS.inputClass}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className={YUME_ADMIN_TOKENS.labelClass}>Available Matrix Dimensions (Comma-separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. 38, 39, 40, 41, 42, 43"
                              value={subcategoryForm.sizeSystemSizes}
                              onChange={(e) => setSubcategoryForm({ ...subcategoryForm, sizeSystemSizes: e.target.value })}
                              className={YUME_ADMIN_TOKENS.inputClass}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Specifications field designer */}
                    <div className="border-t border-stone-200/80 dark:border-slate-800 pt-3">
                      <span className="text-xs font-bold text-stone-800 dark:text-slate-200 block mb-2">
                        Custom Schema Blueprints ({subcategoryForm.fields.length})
                      </span>

                      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 p-3 rounded-xl border border-stone-200/80 dark:border-slate-800 mb-3">
                        {subcategoryForm.fields.map((f, fidx) => (
                          <div key={fidx} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50/80 dark:bg-slate-950 border border-stone-200/70 dark:border-slate-800">
                            <div className="text-left">
                              <span className="text-xs font-bold text-stone-900 dark:text-white">{f.name}</span>
                              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-slate-800 text-stone-600 dark:text-slate-300 font-bold uppercase font-sans">
                                {f.type} {f.required ? "• Required" : ""}
                              </span>
                              {f.unit && <span className="ml-2 text-[10px] text-stone-400 font-bold font-sans">Unit: {f.unit}</span>}
                              {f.options && <span className="ml-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">Options: {f.options.join(", ")}</span>}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSubcategoryForm({
                                  ...subcategoryForm,
                                  fields: subcategoryForm.fields.filter((_, idx) => idx !== fidx)
                                });
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/25 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 flex flex-col gap-3">
                        <span className={YUME_ADMIN_TOKENS.labelClass}>Define Blueprint Spec Field</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="Field Name (e.g. Battery Capacity)"
                            value={newSpecField.name}
                            onChange={(e) => setNewSpecField({ ...newSpecField, name: e.target.value })}
                            className={YUME_ADMIN_TOKENS.inputClass}
                          />
                          <select
                            value={newSpecField.type}
                            onChange={(e) => setNewSpecField({ ...newSpecField, type: e.target.value as any })}
                            className={YUME_ADMIN_TOKENS.selectClass}
                          >
                            <option value="text">Text Input</option>
                            <option value="number">Numeric Value</option>
                            <option value="boolean">Yes/No Toggle</option>
                            <option value="select">Dropdown Menu</option>
                          </select>
                          <div className="flex items-center gap-2 pl-2">
                            <input
                              type="checkbox"
                              id="newSpecFieldRequiredTable"
                              checked={newSpecField.required}
                              onChange={(e) => setNewSpecField({ ...newSpecField, required: e.target.checked })}
                              className="w-4 h-4 cursor-pointer accent-[#1e2631] dark:accent-sky-400"
                            />
                            <label htmlFor="newSpecFieldRequiredTable" className="text-xs font-bold text-stone-700 dark:text-slate-300 cursor-pointer select-none">
                              Field Required?
                            </label>
                          </div>
                        </div>

                        {newSpecField.type === "select" && (
                          <input
                            type="text"
                            placeholder="Options list (Comma-separated e.g. lithium, polymer, alkaline)"
                            value={newSpecField.options}
                            onChange={(e) => setNewSpecField({ ...newSpecField, options: e.target.value })}
                            className={YUME_ADMIN_TOKENS.inputClass}
                          />
                        )}

                        {newSpecField.type === "number" && (
                          <input
                            type="text"
                            placeholder="Value unit metric (e.g. mAh, V, Watt)"
                            value={newSpecField.unit}
                            onChange={(e) => setNewSpecField({ ...newSpecField, unit: e.target.value })}
                            className={YUME_ADMIN_TOKENS.inputClass}
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (!newSpecField.name) {
                              showAdminToast("Please supply a valid field name.", "error");
                              return;
                            }
                            const optsArr = newSpecField.options
                              ? newSpecField.options.split(",").map(o => o.trim()).filter(Boolean)
                              : undefined;
                            
                            const addedField: CategoryTemplateField = {
                              name: newSpecField.name,
                              type: newSpecField.type,
                              required: newSpecField.required,
                              placeholder: newSpecField.placeholder || `Enter ${newSpecField.name}`,
                              options: optsArr,
                              unit: newSpecField.unit || undefined
                            };

                            setSubcategoryForm({
                              ...subcategoryForm,
                              fields: [...subcategoryForm.fields, addedField]
                            });

                            setNewSpecField({
                              name: "",
                              type: "text",
                              required: false,
                              options: "",
                              unit: "",
                              placeholder: ""
                            });
                          }}
                          className={`${YUME_ADMIN_TOKENS.secondaryButtonClass} self-end`}
                        >
                          + Save Field Blueprint to Schema
                        </button>
                      </div>
                    </div>

                    {/* Subcategory form submit actions */}
                    <div className="flex justify-end gap-2 pt-3 border-t border-stone-200/80 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddSubcategory(false);
                          setEditingSubcategory(null);
                        }}
                        className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const formId = editingSubcategory ? editingSubcategory.id : subcategoryForm.id;
                          if (!formId || !subcategoryForm.names.en) {
                            showAdminToast("Please fill at least the English name and a unique key ID.", "error");
                            return;
                          }

                          const finalNames = {
                            en: subcategoryForm.names.en,
                            ar: subcategoryForm.names.ar || subcategoryForm.names.en,
                            fr: subcategoryForm.names.fr || subcategoryForm.names.en,
                          };

                          const newSub: Subcategory = {
                            id: formId,
                            mainCategoryId: selectedMainCategoryId,
                            names: finalNames,
                            icon: subcategoryForm.icon,
                            image: subcategoryForm.image,
                            order: editingSubcategory ? editingSubcategory.order : subcategories.filter(s => s.mainCategoryId === selectedMainCategoryId).length,
                            sizeSystem: {
                              enabled: subcategoryForm.sizeSystemEnabled,
                              label: subcategoryForm.sizeSystemLabel,
                              sizes: subcategoryForm.sizeSystemSizes
                                ? subcategoryForm.sizeSystemSizes.split(",").map(s => s.trim()).filter(Boolean)
                                : []
                            },
                            recommendedMaterials: subcategoryForm.recommendedMaterials
                              ? subcategoryForm.recommendedMaterials.split(",").map(m => m.trim()).filter(Boolean)
                              : [],
                            fields: subcategoryForm.fields,
                            createdAt: editingSubcategory ? (editingSubcategory.createdAt || getCategoryCreatedAt(editingSubcategory)) : new Date().toISOString(),
                          };

                          await saveSubcategoryToFirestore(newSub);

                          if (editingSubcategory) {
                            setSubcategories(prev => prev.map(s => s.id === formId ? newSub : s));
                          } else {
                            setSubcategories(prev => [...prev, newSub]);
                          }

                          setShowAddSubcategory(false);
                          setEditingSubcategory(null);
                        }}
                        className={YUME_ADMIN_TOKENS.primaryButtonClass}
                      >
                        {editingSubcategory ? "Save Changes" : "Create Subcategory"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Subcategories Management Table */}
                <div className="overflow-x-auto rounded-2xl border border-stone-200/80 dark:border-slate-800">
                  <table id="platform-admin-category-table" className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50/80 dark:bg-slate-950 border-b border-stone-200/80 dark:border-slate-800 text-stone-500 dark:text-slate-400 uppercase tracking-wider font-sans text-[10px] font-bold">
                        <th className="px-5 py-3.5 font-semibold">Unique Key</th>
                        <th 
                          className="px-5 py-3.5 font-semibold cursor-pointer select-none hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                          onClick={() => handleCatSort("name")}
                        >
                          <div className="flex items-center gap-1">
                            Category Name
                            {catSortField === "name" ? (catSortOrder === "asc" ? " ▲" : " ▼") : " ↕"}
                          </div>
                        </th>
                        <th className="px-5 py-3.5 font-semibold">Arabic Name</th>
                        <th className="px-5 py-3.5 font-semibold">French Name</th>
                        <th className="px-5 py-3.5 font-semibold">Parent Department</th>
                        <th 
                          className="px-5 py-3.5 font-semibold cursor-pointer select-none hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                          onClick={() => handleCatSort("date")}
                        >
                          <div className="flex items-center gap-1">
                            Created Date
                            {catSortField === "date" ? (catSortOrder === "asc" ? " ▲" : " ▼") : " ↕"}
                          </div>
                        </th>
                        <th className="px-5 py-3.5 font-semibold">Sizing Matrix</th>
                        <th className="px-5 py-3.5 font-semibold">Blueprint Specs Schema</th>
                        <th className="px-5 py-3.5 font-semibold text-center">Sort Order</th>
                        <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
                      {[...subcategories]
                        .filter(sub => {
                          if (subCatDeptFilter !== "all" && sub.mainCategoryId !== subCatDeptFilter) {
                            return false;
                          }
                          const search = subCatSearch.toLowerCase().trim();
                          if (!search) return true;
                          return (
                            sub.id.toLowerCase().includes(search) ||
                            (sub.names.en || "").toLowerCase().includes(search) ||
                            (sub.names.ar || "").toLowerCase().includes(search) ||
                            (sub.names.fr || "").toLowerCase().includes(search) ||
                            (sub.recommendedMaterials || []).some(m => m.toLowerCase().includes(search)) ||
                            (sub.fields || []).some(f => f.name.toLowerCase().includes(search))
                          );
                        })
                        .sort((a, b) => {
                          if (!catSortField) return 0;
                          if (catSortField === "name") {
                            const nameA = (a.names.en || "").toLowerCase();
                            const nameB = (b.names.en || "").toLowerCase();
                            if (nameA < nameB) return catSortOrder === "asc" ? -1 : 1;
                            if (nameA > nameB) return catSortOrder === "asc" ? 1 : -1;
                            return 0;
                          } else {
                            const dateA = new Date(getCategoryCreatedAt(a)).getTime();
                            const dateB = new Date(getCategoryCreatedAt(b)).getTime();
                            return catSortOrder === "asc" ? dateA - dateB : dateB - dateA;
                          }
                        })
                        .map((sub, idx, arr) => {
                          const parentCat = mainCategories.find(c => c.id === sub.mainCategoryId);
                          const parentName = parentCat ? parentCat.names.en : sub.mainCategoryId;
                          return (
                            <tr 
                              key={sub.id}
                              className="bg-white dark:bg-slate-900 hover:bg-stone-50/70 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="px-5 py-3 font-sans text-[11px] font-bold text-stone-500 dark:text-slate-400">
                                {sub.id}
                              </td>
                              <td className="px-5 py-3 font-bold text-stone-900 dark:text-white">
                                {sub.names.en}
                              </td>
                              <td className="px-5 py-3 font-bold text-stone-900 dark:text-white" dir="rtl">
                                {sub.names.ar}
                              </td>
                              <td className="px-5 py-3 text-stone-600 dark:text-slate-300">
                                {sub.names.fr || "—"}
                              </td>
                              <td className="px-5 py-3">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300 border border-stone-200/80 dark:border-slate-700">
                                  {parentName}
                                </span>
                              </td>
                              <td className="px-5 py-3 font-sans text-[11px] text-stone-600 dark:text-slate-300">
                                {formatDate(getCategoryCreatedAt(sub))}
                              </td>
                              <td className="px-5 py-3">
                                {sub.sizeSystem?.enabled ? (
                                  <div className="flex flex-col gap-0.5 text-left">
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                      {sub.sizeSystem.label}
                                    </span>
                                    <span className="text-[9.5px] font-sans text-stone-400 leading-none">
                                      {(sub.sizeSystem.sizes || []).join(", ")}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-stone-400 italic text-[10px]">Disabled</span>
                                )}
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex flex-col gap-1 max-w-[200px]">
                                  {sub.recommendedMaterials && sub.recommendedMaterials.length > 0 && (
                                    <div className="text-[10px] text-stone-400 leading-tight">
                                      <span className="font-bold text-stone-600 dark:text-slate-300">Materials: </span>
                                      {sub.recommendedMaterials.join(", ")}
                                    </div>
                                  )}
                                  {sub.fields && sub.fields.length > 0 && (
                                    <div className="text-[10px] text-stone-500 dark:text-slate-400 leading-tight">
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Fields: </span>
                                      {sub.fields.map(f => f.name).join(", ")}
                                    </div>
                                  )}
                                  {(!sub.recommendedMaterials?.length && !sub.fields?.length) && (
                                    <span className="text-stone-400 italic text-[10px]">No Custom Blueprints</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={async () => {
                                      const originalIdx = subcategories.findIndex(s => s.id === sub.id);
                                      if (originalIdx > 0) {
                                        const newList = [...subcategories];
                                        const [temp] = newList.splice(originalIdx, 1);
                                        newList.splice(originalIdx - 1, 0, temp);
                                        setSubcategories(newList);
                                        await saveReorderedSubcategoriesToFirestore(newList);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-30 text-stone-500 cursor-pointer"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === arr.length - 1}
                                    onClick={async () => {
                                      const originalIdx = subcategories.findIndex(s => s.id === sub.id);
                                      if (originalIdx !== -1 && originalIdx < subcategories.length - 1) {
                                        const newList = [...subcategories];
                                        const [temp] = newList.splice(originalIdx, 1);
                                        newList.splice(originalIdx + 1, 0, temp);
                                        setSubcategories(newList);
                                        await saveReorderedSubcategoriesToFirestore(newList);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-30 text-stone-500 cursor-pointer"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSubcategory(sub);
                                      setSelectedMainCategoryId(sub.mainCategoryId);
                                      setSubcategoryForm({
                                        id: sub.id,
                                        names: sub.names,
                                        icon: sub.icon,
                                        image: sub.image,
                                        sizeSystemEnabled: sub.sizeSystem?.enabled || false,
                                        sizeSystemLabel: sub.sizeSystem?.label || "Sizes Available",
                                        sizeSystemSizes: (sub.sizeSystem?.sizes || []).join(", "),
                                        recommendedMaterials: (sub.recommendedMaterials || []).join(", "),
                                        fields: sub.fields || []
                                      });
                                      setShowAddSubcategory(true);
                                    }}
                                    className="p-2 rounded-xl text-[#1e2631] dark:text-sky-400 hover:bg-stone-100 dark:hover:bg-slate-800 border border-transparent hover:border-stone-200 dark:hover:border-slate-700 cursor-pointer"
                                    title="Edit Subcategory"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSafeDeleteSubcategory(sub);
                                      setSafeDeleteAction("archive");
                                      setSafeDeleteTargetId(subcategories.find(s => s.id !== sub.id && s.mainCategoryId === sub.mainCategoryId)?.id || "");
                                    }}
                                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 cursor-pointer"
                                    title="Remove Subcategory"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      {subcategories.filter(sub => {
                        if (subCatDeptFilter !== "all" && sub.mainCategoryId !== subCatDeptFilter) {
                          return false;
                        }
                        const search = subCatSearch.toLowerCase().trim();
                        if (!search) return true;
                        return (
                          sub.id.toLowerCase().includes(search) ||
                          (sub.names.en || "").toLowerCase().includes(search) ||
                          (sub.names.ar || "").toLowerCase().includes(search) ||
                          (sub.names.fr || "").toLowerCase().includes(search)
                        );
                      }).length === 0 && (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-stone-400 dark:text-slate-500 font-bold text-xs">
                            No subcategories match your search filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SAFE DELETE MODAL FOR MAIN CATEGORY */}
            {safeDeleteMainCategory && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className={`${YUME_ADMIN_TOKENS.cardClass} max-w-md w-full shadow-2xl`}>
                  <YumeAdminSectionHeader
                    title="Safe Category Delete Guard"
                    subtitle={`Deleting "${safeDeleteMainCategory.names[currentLanguage] || safeDeleteMainCategory.names.en}". Select a policy to preserve references:`}
                  />

                  <div className="flex flex-col gap-2.5 pt-1">
                    <label className={`flex items-center gap-3 p-3.5 ${YUME_ADMIN_TOKENS.subCardClass} cursor-pointer`}>
                      <input
                        type="radio"
                        name="safeDeletePolicyMain"
                        value="archive"
                        checked={safeDeleteAction === "archive"}
                        onChange={() => setSafeDeleteAction("archive")}
                        className="w-4 h-4 accent-[#1e2631] dark:accent-sky-400"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold text-stone-900 dark:text-white block">Archive Category</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400 block">Hides the category from selection menus but keeps historical references intact.</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3.5 ${YUME_ADMIN_TOKENS.subCardClass} cursor-pointer`}>
                      <input
                        type="radio"
                        name="safeDeletePolicyMain"
                        value="move"
                        checked={safeDeleteAction === "move"}
                        onChange={() => setSafeDeleteAction("move")}
                        className="w-4 h-4 accent-[#1e2631] dark:accent-sky-400"
                      />
                      <div className="text-left w-full">
                        <span className="text-xs font-bold text-stone-900 dark:text-white block">Move Subcategories to Department</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400 block mb-2">Re-assign all subcategories of this department to a target category.</span>
                        {safeDeleteAction === "move" && (
                          <select
                            value={safeDeleteTargetId}
                            onChange={(e) => setSafeDeleteTargetId(e.target.value)}
                            className={YUME_ADMIN_TOKENS.selectClass}
                          >
                            {mainCategories.filter(c => c.id !== safeDeleteMainCategory.id).map(c => (
                              <option key={c.id} value={c.id}>{c.names[currentLanguage] || c.names.en}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-stone-200/80 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSafeDeleteMainCategory(null)}
                      className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!safeDeleteMainCategory) return;
                        try {
                          await deleteMainCategoryFromFirestore(safeDeleteMainCategory.id, {
                            action: safeDeleteAction,
                            targetMainCategoryId: safeDeleteAction === "move" ? safeDeleteTargetId : undefined
                          });
                          if (safeDeleteAction === "archive") {
                            setMainCategories(prev => prev.filter(c => c.id !== safeDeleteMainCategory.id));
                            setSubcategories(prev => prev.filter(s => s.mainCategoryId !== safeDeleteMainCategory.id));
                          } else {
                            setMainCategories(prev => prev.filter(c => c.id !== safeDeleteMainCategory.id));
                            setSubcategories(prev => prev.map(s => s.mainCategoryId === safeDeleteMainCategory.id ? { ...s, mainCategoryId: safeDeleteTargetId } : s));
                          }
                          setSafeDeleteMainCategory(null);
                          showAdminToast("Main department removed safely.");
                        } catch (e) {
                          showAdminToast("Error executing safe delete on Main Category.", "error");
                        }
                      }}
                      className="h-10 px-5 rounded-xl bg-rose-600 text-white font-bold text-xs cursor-pointer hover:bg-rose-700 transition-all"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SAFE DELETE MODAL FOR SUBCATEGORY */}
            {safeDeleteSubcategory && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className={`${YUME_ADMIN_TOKENS.cardClass} max-w-md w-full shadow-2xl`}>
                  <YumeAdminSectionHeader
                    title="Safe Subcategory Delete Guard"
                    subtitle={`Deleting "${safeDeleteSubcategory.names[currentLanguage] || safeDeleteSubcategory.names.en}". Select a policy to preserve references:`}
                  />

                  <div className="flex flex-col gap-2.5 pt-1">
                    <label className={`flex items-center gap-3 p-3.5 ${YUME_ADMIN_TOKENS.subCardClass} cursor-pointer`}>
                      <input
                        type="radio"
                        name="safeDeletePolicySub"
                        value="archive"
                        checked={safeDeleteAction === "archive"}
                        onChange={() => setSafeDeleteAction("archive")}
                        className="w-4 h-4 accent-[#1e2631] dark:accent-sky-400"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold text-stone-900 dark:text-white block">Archive Subcategory</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400 block">Hides the subcategory from selection menus but keeps historical references intact.</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3.5 ${YUME_ADMIN_TOKENS.subCardClass} cursor-pointer`}>
                      <input
                        type="radio"
                        name="safeDeletePolicySub"
                        value="move"
                        checked={safeDeleteAction === "move"}
                        onChange={() => setSafeDeleteAction("move")}
                        className="w-4 h-4 accent-[#1e2631] dark:accent-sky-400"
                      />
                      <div className="text-left w-full">
                        <span className="text-xs font-bold text-stone-900 dark:text-white block">Move Products to Subcategory</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400 block mb-2">Re-assign all existing store products under this subcategory to another active target.</span>
                        {safeDeleteAction === "move" && (
                          <select
                            value={safeDeleteTargetId}
                            onChange={(e) => setSafeDeleteTargetId(e.target.value)}
                            className={YUME_ADMIN_TOKENS.selectClass}
                          >
                            {subcategories.filter(s => s.id !== safeDeleteSubcategory.id).map(s => (
                              <option key={s.id} value={s.id}>{s.names[currentLanguage] || s.names.en}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-stone-200/80 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSafeDeleteSubcategory(null)}
                      className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!safeDeleteSubcategory) return;
                        try {
                          const allProducts: any[] = [];
                          stores.forEach(st => {
                            if (st.products) {
                              st.products.forEach(p => {
                                allProducts.push({ ...p, storeId: st.id });
                              });
                            }
                          });

                          const onUpdateProductCategory = (prodId: string, nextSubId: string) => {
                            setStores(prevStores => prevStores.map(store => {
                              if (store.products) {
                                return {
                                  ...store,
                                  products: store.products.map(p => p.id === prodId ? { ...p, category: nextSubId, subcategory: nextSubId } : p)
                                };
                              }
                              return store;
                            }));
                          };

                          await deleteSubcategoryFromFirestore(
                            safeDeleteSubcategory.id,
                            {
                              action: safeDeleteAction,
                              targetSubcategoryId: safeDeleteAction === "move" ? safeDeleteTargetId : undefined
                            },
                            allProducts,
                            onUpdateProductCategory
                          );

                          setSubcategories(prev => prev.filter(s => s.id !== safeDeleteSubcategory.id));
                          setSafeDeleteSubcategory(null);
                          showAdminToast("Subcategory removed safely.");
                        } catch (e) {
                          showAdminToast("Error executing safe delete on Subcategory.", "error");
                        }
                      }}
                      className="h-10 px-5 rounded-xl bg-rose-600 text-white font-bold text-xs cursor-pointer hover:bg-rose-700 transition-all"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {adminTab === "domains" && (
          <div className="flex flex-col gap-6 text-left">
            <YumeAdminAdviceBanner>
              Configure maximum custom domains allowed per subscription tier, toggle platform-wide subscription enforcement, and oversee multi-tenant DNS, SSL, and Cloudflare Edge caching across all merchant stores.
            </YumeAdminAdviceBanner>

            {/* Header & Master Enforcement Card */}
            <div className={YUME_ADMIN_TOKENS.cardClass}>
              <YumeAdminSectionHeader
                title="Central Domain Limits & Multi-Tenant Routing Control"
                subtitle="Configure per-tier domain quotas, edge caching TTL, and tenant isolation policies"
                rightSlot={
                  <div className="flex flex-wrap items-center gap-3">
                    {domainSettingsSaveFeedback && (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {domainSettingsSaveFeedback}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSavePlatformDomainLimits(domainLimitsConfig)}
                      className={YUME_ADMIN_TOKENS.primaryButtonClass}
                    >
                      <Check className="w-4 h-4" />
                      Save Domain Configuration
                    </button>
                  </div>
                }
              />

              {/* Subscription Enforcement Master Switch */}
              <div className={`${YUME_ADMIN_TOKENS.subCardClass} p-5 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                      Subscription Domain Limit Enforcement
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        domainLimitsConfig.enforceSubscriptionLimits
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
                      }`}
                    >
                      {domainLimitsConfig.enforceSubscriptionLimits
                        ? "Subscription Limits Enforced"
                        : "Phase 1 Standby (Unrestricted)"}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                    In the current phase, subscription-based domain restrictions are disabled by default so merchants can connect multiple domains freely. Enable this switch at any time to enforce tier limits immediately across all stores.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <YumeAdminToggle
                    checked={domainLimitsConfig.enforceSubscriptionLimits}
                    onChange={(next) => {
                      const updated = {
                        ...domainLimitsConfig,
                        enforceSubscriptionLimits: next,
                      };
                      handleSavePlatformDomainLimits(updated);
                    }}
                    label={
                      domainLimitsConfig.enforceSubscriptionLimits
                        ? "Enforcement: ACTIVE"
                        : "Enforcement: DISABLED"
                    }
                  />
                </div>
              </div>

              {/* 5 Canonical Subscription Tiers Domain Limits Matrix */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={YUME_ADMIN_TOKENS.labelClass}>
                    Custom Domain Quotas by Canonical Subscription Plan
                  </span>
                  <span className="text-xs font-medium text-stone-500 dark:text-slate-400">
                    Supports numeric limits or Unlimited domains per plan (Basic · Pro · Pro Plus · Premium · Premium Plus)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {SUBSCRIPTION_PLAN_IDS.map((planName) => {
                    const currentLimit = domainLimitsConfig.limitsByPlan[planName];
                    const isUnlimited = currentLimit === "unlimited";
                    return (
                      <div
                        key={planName}
                        className={`${YUME_ADMIN_TOKENS.subCardClass} p-4 flex flex-col gap-3`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Crown
                              className={`w-4 h-4 ${
                                planName.includes("Premium")
                                  ? "text-amber-500"
                                  : planName.includes("Pro")
                                  ? "text-emerald-500"
                                  : "text-stone-400"
                              }`}
                            />
                            <span className="text-xs font-bold text-stone-900 dark:text-white">
                              {planName} Plan
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = isUnlimited ? 5 : "unlimited";
                              const updated = {
                                ...domainLimitsConfig,
                                limitsByPlan: {
                                  ...domainLimitsConfig.limitsByPlan,
                                  [planName]: nextVal,
                                },
                              };
                              setDomainLimitsConfig(updated);
                            }}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition-all ${
                              isUnlimited
                                ? "bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 border-[#1e2631] dark:border-sky-400"
                                : "bg-white dark:bg-slate-900 text-stone-600 dark:text-slate-300 border-stone-200/90 dark:border-slate-700"
                            }`}
                          >
                            {isUnlimited ? "∞ Unlimited" : "Set Unlimited"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-stone-500 dark:text-slate-400">
                            Max Custom Domains:
                          </span>
                          {isUnlimited ? (
                            <span className="text-xs font-bold text-[#1e2631] dark:text-sky-400 font-sans px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800">
                              Unlimited Domains
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={9999}
                                value={typeof currentLimit === "number" ? currentLimit : 1}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value || "0", 10));
                                  setDomainLimitsConfig((prev) => ({
                                    ...prev,
                                    limitsByPlan: {
                                      ...prev.limitsByPlan,
                                      [planName]: val,
                                    },
                                  }));
                                }}
                                className={`${YUME_ADMIN_TOKENS.monoInputClass} !w-20 !py-2 text-center tabular-nums`}
                              />
                              <span className="text-xs font-medium text-stone-400">domains</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Multi-Tenant Performance, Edge Caching & Security Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`${YUME_ADMIN_TOKENS.compactCardClass} flex flex-col justify-between gap-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Cloudflare Edge CDN &amp; SSL
                  </span>
                  <YumeAdminToggle
                    checked={domainLimitsConfig.cloudflareCdnEnabled}
                    onChange={(next) =>
                      handleSavePlatformDomainLimits({
                        ...domainLimitsConfig,
                        cloudflareCdnEnabled: next,
                      })
                    }
                  />
                </div>
                <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
                  Automatic TLS 1.3 SSL provisioning, HTTP/3 edge termination, and DDoS mitigation across all connected merchant domains.
                </p>
              </div>

              <div className={`${YUME_ADMIN_TOKENS.compactCardClass} flex flex-col justify-between gap-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1e2631] dark:text-sky-400" />
                    Edge Cache TTL (Seconds)
                  </span>
                  <input
                    type="number"
                    min={60}
                    max={86400}
                    value={domainLimitsConfig.edgeCachingTtlSeconds}
                    onChange={(e) =>
                      setDomainLimitsConfig((prev) => ({
                        ...prev,
                        edgeCachingTtlSeconds: Math.max(60, Number(e.target.value) || 3600),
                      }))
                    }
                    className={`${YUME_ADMIN_TOKENS.monoInputClass} !w-24 !py-2 text-center tabular-nums`}
                  />
                </div>
                <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
                  Sub-millisecond in-memory &amp; edge hostname lookup caching so high-traffic ad campaigns on one domain never impact other stores.
                </p>
              </div>

              <div className={`${YUME_ADMIN_TOKENS.compactCardClass} flex flex-col justify-between gap-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Per-Domain Rate Limit (Req/Min)
                  </span>
                  <input
                    type="number"
                    min={60}
                    max={50000}
                    value={domainLimitsConfig.rateLimitRequestsPerMinute}
                    onChange={(e) =>
                      setDomainLimitsConfig((prev) => ({
                        ...prev,
                        rateLimitRequestsPerMinute: Math.max(60, Number(e.target.value) || 600),
                      }))
                    }
                    className={`${YUME_ADMIN_TOKENS.monoInputClass} !w-24 !py-2 text-center tabular-nums`}
                  />
                </div>
                <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
                  Strict tenant isolation and burst rate-limiting per custom hostname to protect shared platform compute resources.
                </p>
              </div>
            </div>

            {/* Platform-Wide Connected Domains Directory */}
            <div className={YUME_ADMIN_TOKENS.cardClass}>
              <YumeAdminSectionHeader
                title={`Platform-Wide Connected Custom Domains (${allPlatformDomains.length})`}
                subtitle="Real-time registry of all merchant domains, mapped destinations (Store, Product Page, Landing Page), and SSL states"
                rightSlot={
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={domainDirectorySearch}
                      onChange={(e) => setDomainDirectorySearch(e.target.value)}
                      placeholder="Filter by hostname or store..."
                      className={`${YUME_ADMIN_TOKENS.inputClass} pl-9 !py-2`}
                    />
                  </div>
                }
              />

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                      <th className="py-3 px-3">Hostname</th>
                      <th className="py-3 px-3">Merchant Store</th>
                      <th className="py-3 px-3">Destination Type</th>
                      <th className="py-3 px-3">Connection &amp; SSL</th>
                      <th className="py-3 px-3">Ad Networks &amp; Edge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-slate-800/70 text-xs">
                    {allPlatformDomains
                      .filter((d) => {
                        if (!domainDirectorySearch.trim()) return true;
                        const q = domainDirectorySearch.toLowerCase();
                        const storeObj = stores.find((s) => s.id === d.storeId);
                        return (
                          String(d.hostname || "").toLowerCase().includes(q) ||
                          String(d.destinationLabel || "").toLowerCase().includes(q) ||
                          String(storeObj?.name || "").toLowerCase().includes(q)
                        );
                      })
                      .map((dom) => {
                        const storeObj = stores.find((s) => s.id === dom.storeId);
                        return (
                          <tr key={dom.id} className="hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-3 font-sans font-bold text-stone-900 dark:text-white">
                              {dom.hostname}
                            </td>
                            <td className="py-3.5 px-3 font-bold text-stone-700 dark:text-slate-300">
                              {storeObj ? storeObj.name : dom.storeId}
                              <span className="block text-[10px] font-normal text-stone-400">
                                Plan: {storeObj?.subscriptionTier || storeObj?.premiumTier || "Pro"}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200/80 dark:border-slate-700">
                                {dom.destinationType === "store"
                                  ? "Storefront"
                                  : dom.destinationType === "product"
                                  ? `Product: ${dom.destinationLabel || dom.destinationRefId}`
                                  : "Landing Page (Prepared)"}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                  dom.connectionStatus === "active"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                                    : dom.connectionStatus === "pending_verification"
                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60"
                                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60"
                                }`}
                              >
                                {dom.connectionStatus} • SSL: {dom.sslStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-[11px] text-stone-500 dark:text-slate-400">
                              UTM Passthrough • Cloudflare CDN
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {adminTab === "global_markets" && (
          <PlatformCulturalAndMarketAdmin adminEmail={adminUsername} />
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
