import React, { useState, useEffect, useMemo } from "react";
import {
  Globe,
  Plus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Trash2,
  Edit,
  Search,
  Store,
  Package,
  Layers,
  Zap,
  Server,
  ChevronDown,
  ChevronUp,
  Info,
  Megaphone,
  X,
  Activity,
  Link2,
  Eye,
  HelpCircle,
  BookOpen,
  LayoutGrid,
  List,
  Flag,
  Sliders,
  BarChart3,
  TrendingUp,
  Users,
  ArrowUpRight,
  Calendar,
  Radio,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  MerchantStore,
  CustomDomainRecord,
  DomainDnsRecord,
  DomainDestinationType,
  DomainConnectionStatus,
  PlatformDomainLimitsConfig,
  SubscriptionPlanTier,
  Product,
} from "../types";
import { SkeuomorphicSwitch } from "./SkeuomorphicSwitch";

interface MerchantDomainManagerProps {
  myStore: MerchantStore;
  setStores: React.Dispatch<React.SetStateAction<MerchantStore[]>>;
  products?: Product[];
  darkMode?: boolean;
  merchantLang?: "ar" | "fr" | "en";
  currentSlideColor?: string;
  onPreviewDomainDestination?: (
    destOrRecord: DomainDestinationType | CustomDomainRecord,
    refId?: string
  ) => void;
  onUpgradePlan?: () => void;
}

const DEFAULT_PLATFORM_LIMITS: PlatformDomainLimitsConfig = {
  enforceSubscriptionLimits: false,
  planLimits: {
    Free: 1,
    Basic: 2,
    Pro: 5,
    "Pro Plus": 10,
    Premium: 25,
    "Premium Plus": "unlimited",
  },
  cloudflareIntegration: {
    enabled: true,
    zoneIdConfigured: true,
    customHostnameSsl: true,
    edgeCachingEnabled: true,
    ddosProtectionLevel: "high",
    rateLimitRps: 250,
    cacheTtlSeconds: 3600,
  },
  updatedAt: new Date().toISOString(),
};

const DOMAIN_ADVICES_EN = [
  "Connect a root domain (e.g., www.mystore.com) to your storefront and dedicated subdomains (e.g., promo.mystore.com) to high-converting product pages for Google, Meta, and TikTok ad campaigns.",
  "Always configure both the CNAME record (for www or subdomains) and the A Record (for @ root domain) in your registrar's DNS panel to ensure seamless visitor routing and instant TLS 1.3 SSL provisioning.",
  "Use the 'Edit DNS Records' button on any domain card to inspect or customize your A, CNAME, and TXT verification records and click 'Check Status' to re-trigger live DNS verification.",
  "Enable UTM & Ad Pixel Passthrough on product domains so conversion events from Facebook Ads, TikTok Ads, and Google Ads attribute accurately to your store analytics.",
];

const DOMAIN_ADVICES_AR = [
  "اربط نطاقاً رئيسياً (مثل www.mystore.com) بواجهة متجرك، ونطاقات فرعية مخصصة (مثل promo.mystore.com) بصفحات المنتجات لرفع معدل التحويل في إعلانات Google وMeta وTikTok.",
  "احرص على إضافة سجل CNAME وسجل A Record معاً في لوحة تحكم DNS لدى مزود النطاق لضمان توجيه الزوار وتفعيل شهادة الأمان SSL تلقائياً.",
  "استخدم زر 'تعديل سجلات DNS' في بطاقة أي نطاق لمعاينة أو تعديل سجلات A وCNAME وTXT ثم اضغط على 'فحص الحالة' لإعادة التحقق الفوري.",
  "فعّل خيار تمرير معاملات UTM وبيكسل الإعلانات لضمان تتبع المبيعات والتحويلات بدقة من حملاتك الإعلانية الخارجية.",
];

const normalizeDomainInput = (raw: string): string => {
  if (!raw) return "";
  let cleaned = raw.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//i, "");
  cleaned = cleaned.split("/")[0].split("?")[0].split("#")[0].split(":")[0];
  return cleaned.replace(/\.+$/, "");
};

const isValidDomainFormat = (hostname: string): boolean => {
  if (!hostname || hostname.length < 4 || hostname.length > 253) return false;
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(hostname);
};

export const MerchantDomainManager: React.FC<MerchantDomainManagerProps> = ({
  myStore,
  setStores,
  darkMode = false,
  merchantLang = "en",
  currentSlideColor = "#0b2447",
  onPreviewDomainDestination,
  onUpgradePlan,
}) => {
  const isAr = merchantLang === "ar";

  // Clean store slug for default free YUME domains & CNAME targets
  const storeSlug = useMemo(() => {
    return (
      (myStore.subdomain || myStore.name || "mystore")
        .toLowerCase()
        .replace(/\.platform\.dz.*$/, "")
        .replace(/\.yume\.store.*$/, "")
        .replace(/\.yume\.dz.*$/, "")
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "mystore"
    );
  }, [myStore.subdomain, myStore.name]);

  // Category-specific real DNS targets (original to YUME Edge Network)
  const categoryDnsConfig = useMemo(
    () => ({
      store: {
        defaultDomain: `${storeSlug}.yume.store`,
        cnameTarget: `${storeSlug}.yume.store`,
        aRecordIp: "34.8.13.31",
        badgeLabel: isAr ? "نطاق المتجر الافتراضي" : "Default Store Domain",
      },
      product: {
        defaultDomain: `${storeSlug}.products.yume.store`,
        cnameTarget: `${storeSlug}.products.yume.store`,
        aRecordIp: "34.120.55.90",
        badgeLabel: isAr ? "نطاق المنتجات الافتراضي" : "Default Product Domain",
      },
      landing_page: {
        defaultDomain: `${storeSlug}.funnels.yume.store`,
        cnameTarget: `${storeSlug}.funnels.yume.store`,
        aRecordIp: "34.49.84.177",
        badgeLabel: isAr ? "نطاق صفحات الهبوط الافتراضي" : "Default Landing Pages Domain",
      },
    }),
    [storeSlug, isAr]
  );

  // Default free YUME domain toggle states
  const [defaultDomainEnabled, setDefaultDomainEnabled] = useState<{
    store: boolean;
    product: boolean;
    landing_page: boolean;
  }>({
    store: true,
    product: true,
    landing_page: true,
  });

  // Top navigation tab & hover state (matching Add Product page 5/6-card design)
  const [activeTopCard, setActiveTopCard] = useState<
    "all" | "traffic" | "store" | "product" | "landing_page" | "routing"
  >("all");
  const [showDomainHints, setShowDomainHints] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("yume_merchant_hints");
      if (saved !== null) return saved === "true";
    } catch {}
    return true;
  });

  useEffect(() => {
    const handleHintsSync = (e: any) => {
      if (typeof e.detail === "boolean") {
        setShowDomainHints(e.detail);
      }
    };
    window.addEventListener("yume_hints_toggle", handleHintsSync);
    return () => window.removeEventListener("yume_hints_toggle", handleHintsSync);
  }, []);
  const [adviceIndex, setAdviceIndex] = useState<number>(0);

  // Domain Traffic Overview States
  const [trafficTimeframe, setTrafficTimeframe] = useState<"daily" | "weekly">("daily");
  const [selectedTrafficDomain, setSelectedTrafficDomain] = useState<string>("all");
  const [trafficChartType, setTrafficChartType] = useState<"area" | "bar">("area");

  // State for domains & platform settings
  const [domains, setDomains] = useState<CustomDomainRecord[]>(() => {
    if (Array.isArray(myStore.customDomains) && myStore.customDomains.length > 0) {
      return myStore.customDomains;
    }
    return [];
  });
  const [platformLimits, setPlatformLimits] =
    useState<PlatformDomainLimitsConfig>(DEFAULT_PLATFORM_LIMITS);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Layout mode & filters
  const [viewMode, setViewMode] = useState<"categories" | "table">("categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DomainConnectionStatus>("all");
  const [destinationFilter, setDestinationFilter] = useState<"all" | DomainDestinationType>("all");

  // Streamlined Add / Edit Custom Domain Modal State
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
  const [showAdvancedModalSettings, setShowAdvancedModalSettings] = useState(false);

  // Setup Form State
  const [domainInput, setDomainInput] = useState("");
  const [domainInputError, setDomainInputError] = useState("");
  const [selectedDestType, setSelectedDestType] = useState<DomainDestinationType>("store");
  const [selectedProductId, setSelectedProductId] = useState<string>(
    myStore.products?.[0]?.id || ""
  );
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [landingPageDraftSlug, setLandingPageDraftSlug] = useState("campaign-launch");
  const [forceHttps, setForceHttps] = useState(true);
  const [sslAutoRenew, setSslAutoRenew] = useState(true);
  const [cdnEnabled, setCdnEnabled] = useState(true);
  const [utmPassthrough, setUtmPassthrough] = useState(true);
  const [pixelForwardingEnabled, setPixelForwardingEnabled] = useState(true);

  // Add Domain Modal Live DNS (A / CNAME) Verification State
  const [modalDnsCheckState, setModalDnsCheckState] = useState<{
    isChecking: boolean;
    overallStatus: "verified" | "pending";
    aRecordStatus: "verified" | "pending";
    cnameRecordStatus: "verified" | "pending";
    lastCheckedAt: string | null;
    statusMessage: string | null;
  }>({
    isChecking: false,
    overallStatus: "pending",
    aRecordStatus: "pending",
    cnameRecordStatus: "pending",
    lastCheckedAt: null,
    statusMessage: null,
  });

  // Non-Technical "How to Add a Custom Domain" Interactive Guide Modal State
  const [isHowToGuideOpen, setIsHowToGuideOpen] = useState(false);
  const [selectedRegistrarTab, setSelectedRegistrarTab] = useState<
    "cloudflare" | "namecheap" | "godaddy" | "other"
  >("cloudflare");

  // DNS & Verification Modal State
  const [inspectingDomain, setInspectingDomain] = useState<CustomDomainRecord | null>(null);
  const [editableDnsRecords, setEditableDnsRecords] = useState<DomainDnsRecord[]>([]);
  const [dnsModalNotice, setDnsModalNotice] = useState<{
    type: "success" | "info" | "error";
    text: string;
  } | null>(null);

  // Ad Campaign Link Builder Modal State
  const [campaignModalDomain, setCampaignModalDomain] = useState<CustomDomainRecord | null>(null);
  const [selectedAdNetwork, setSelectedAdNetwork] = useState<string>("Google Ads");
  const [utmCampaignName, setUtmCampaignName] = useState<string>("summer_sale_2026");

  // Multi-Tenant Routing Simulator State
  const [resolverTestHost, setResolverTestHost] = useState<string>("");
  const [resolverResult, setResolverResult] = useState<any | null>(null);
  const [resolverLoading, setResolverLoading] = useState<boolean>(false);
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);

  // Determine merchant's active subscription plan tier
  const merchantPlanTier: SubscriptionPlanTier = useMemo(() => {
    if (myStore.subscriptionTier) return myStore.subscriptionTier;
    const rawTier = (myStore.premiumTier || "").toLowerCase();
    if (rawTier.includes("premium plus")) return "Premium Plus";
    if (rawTier.includes("premium")) return "Premium";
    if (rawTier.includes("pro plus")) return "Pro Plus";
    if (rawTier.includes("pro")) return "Pro";
    if (rawTier.includes("basic") || rawTier.includes("standard")) return "Basic";
    return "Pro";
  }, [myStore.subscriptionTier, myStore.premiumTier]);

  // Mock API Call to check DNS A and CNAME record status (with server + client fallback)
  const checkDnsRecordsViaMockApi = async (
    rawHostname: string,
    destType: DomainDestinationType,
    simulateStatus: "verified" | "pending" = "verified"
  ): Promise<{
    verified: boolean;
    aVerified: boolean;
    cnameVerified: boolean;
    checkedAt: string;
    expectedA: string;
    expectedCname: string;
  }> => {
    const cleanHost = normalizeDomainInput(rawHostname) || `www.${storeSlug}.com`;
    const cfg = categoryDnsConfig[destType] || categoryDnsConfig.store;

    try {
      const res = await fetch("/api/domains/check-dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: cleanHost,
          destinationType: destType,
          expectedA: cfg.aRecordIp,
          expectedCname: cfg.cnameTarget,
          simulateStatus,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const isVer = data.verificationStatus === "verified";
        return {
          verified: isVer,
          aVerified: Boolean(data.records?.aRecord?.verified ?? isVer),
          cnameVerified: Boolean(data.records?.cnameRecord?.verified ?? isVer),
          checkedAt: data.checkedAt || new Date().toISOString(),
          expectedA: cfg.aRecordIp,
          expectedCname: cfg.cnameTarget,
        };
      }
    } catch {
      // Fallback to client-side simulated DNS resolution check
    }

    await new Promise((resolve) => setTimeout(resolve, 450));
    const isVerified = simulateStatus === "verified" && !cleanHost.includes("pending");
    return {
      verified: isVerified,
      aVerified: isVerified,
      cnameVerified: isVerified,
      checkedAt: new Date().toISOString(),
      expectedA: cfg.aRecordIp,
      expectedCname: cfg.cnameTarget,
    };
  };

  // Sync domains with backend and store state
  const fetchDomainsAndSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/domains?storeId=${encodeURIComponent(myStore.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setPlatformLimits(data.settings);
        }
        if (Array.isArray(data.domains)) {
          if (
            data.domains.length === 0 &&
            (!myStore.customDomains || myStore.customDomains.length === 0)
          ) {
            await seedInitialStoreDomains();
          } else {
            setDomains(data.domains);
            syncDomainsToStoreState(data.domains);
          }
        }
      }
    } catch {
      if (Array.isArray(myStore.customDomains)) {
        setDomains(myStore.customDomains);
      }
    } finally {
      setLoading(false);
    }
  };

  const syncDomainsToStoreState = (nextDomains: CustomDomainRecord[]) => {
    setStores((prev) =>
      prev.map((st) => (st.id === myStore.id ? { ...st, customDomains: nextDomains } : st))
    );
  };

  const seedInitialStoreDomains = async () => {
    const firstProduct = myStore.products?.[0];
    const seedPayloads = [
      {
        merchantId: myStore.id,
        storeName: myStore.name,
        domain: `www.${storeSlug}.com`,
        destinationType: "store" as DomainDestinationType,
        destinationRefId: myStore.id,
        destinationLabel: `Storefront (${myStore.name})`,
        subscriptionTier: merchantPlanTier,
        autoVerify: true,
      },
      ...(firstProduct
        ? [
            {
              merchantId: myStore.id,
              storeName: myStore.name,
              domain: `shop.${storeSlug}.com`,
              destinationType: "product" as DomainDestinationType,
              destinationRefId: firstProduct.id,
              destinationLabel: `Product: ${firstProduct.name}`,
              subscriptionTier: merchantPlanTier,
              autoVerify: true,
            },
          ]
        : []),
    ];

    const createdList: CustomDomainRecord[] = [];
    for (const payload of seedPayloads) {
      try {
        const res = await fetch("/api/domains", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.domain) createdList.push(data.domain);
        }
      } catch {
        // ignore
      }
    }

    if (createdList.length > 0) {
      setDomains(createdList);
      syncDomainsToStoreState(createdList);
    }
  };

  useEffect(() => {
    fetchDomainsAndSettings();
  }, [myStore.id]);

  // Listen for Platform Admin domain settings updates
  useEffect(() => {
    const handleSettingsSync = () => {
      fetch("/api/domains/settings")
        .then((r) => r.json())
        .then((d) => {
          if (d?.settings) setPlatformLimits(d.settings);
        })
        .catch(() => {});
    };
    window.addEventListener("yume_domain_settings_updated", handleSettingsSync);
    return () => window.removeEventListener("yume_domain_settings_updated", handleSettingsSync);
  }, []);

  // Calculate usage & subscription limit status
  const connectedCount = domains.length;
  const planAllowedLimit = platformLimits.planLimits?.[merchantPlanTier] ?? "unlimited";
  const isLimitEnforced = Boolean(platformLimits.enforceSubscriptionLimits);
  const isLimitReached =
    isLimitEnforced &&
    planAllowedLimit !== "unlimited" &&
    typeof planAllowedLimit === "number" &&
    connectedCount >= planAllowedLimit;

  // Filtered domains
  const filteredDomains = useMemo(() => {
    return domains.filter((d) => {
      const matchesSearch =
        !searchQuery.trim() ||
        d.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.destinationLabel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || d.connectionStatus === statusFilter;
      const matchesDest = destinationFilter === "all" || d.destinationType === destinationFilter;
      return matchesSearch && matchesStatus && matchesDest;
    });
  }, [domains, searchQuery, statusFilter, destinationFilter]);

  const storeDomains = useMemo(
    () => filteredDomains.filter((d) => d.destinationType === "store"),
    [filteredDomains]
  );
  const productDomains = useMemo(
    () => filteredDomains.filter((d) => d.destinationType === "product"),
    [filteredDomains]
  );
  const landingPageDomains = useMemo(
    () => filteredDomains.filter((d) => d.destinationType === "landing_page"),
    [filteredDomains]
  );

  // Distinct color palette for domain lines/areas on the Recharts canvas
  const DOMAIN_COLOR_PALETTE = useMemo(
    () => [
      "#10b981", // Emerald (Store)
      "#3b82f6", // Blue (Product)
      "#8b5cf6", // Violet (Landing Page)
      "#f59e0b", // Amber
      "#ec4899", // Rose / Pink
      "#06b6d4", // Cyan
      "#6366f1", // Indigo
    ],
    []
  );

  // Active Custom Domains for Traffic Overview (with robust fallback to ensure interactive charts)
  const activeCustomDomains = useMemo(() => {
    const list = domains.filter(
      (d) => d.connectionStatus === "active" || d.verificationStatus === "verified"
    );
    if (list.length > 0) return list;
    return [
      {
        id: "sample_dom_store",
        merchantId: myStore.id,
        storeName: myStore.name,
        domain: `www.${storeSlug}.com`,
        destinationType: "store" as DomainDestinationType,
        destinationLabel: `Storefront (${myStore.name})`,
        connectionStatus: "active" as DomainConnectionStatus,
        verificationStatus: "verified" as const,
        sslStatus: "active" as const,
        dnsStatus: "configured" as const,
      },
      {
        id: "sample_dom_prod",
        merchantId: myStore.id,
        storeName: myStore.name,
        domain: `shop.${storeSlug}.com`,
        destinationType: "product" as DomainDestinationType,
        destinationLabel: "Direct Product Campaign",
        connectionStatus: "active" as DomainConnectionStatus,
        verificationStatus: "verified" as const,
        sslStatus: "active" as const,
        dnsStatus: "configured" as const,
      },
      {
        id: "sample_dom_funnel",
        merchantId: myStore.id,
        storeName: myStore.name,
        domain: `promo.${storeSlug}.com`,
        destinationType: "landing_page" as DomainDestinationType,
        destinationLabel: "Special Launch Landing Page",
        connectionStatus: "active" as DomainConnectionStatus,
        verificationStatus: "verified" as const,
        sslStatus: "active" as const,
        dnsStatus: "configured" as const,
      },
    ] as CustomDomainRecord[];
  }, [domains, storeSlug, myStore.id, myStore.name]);

  // Mock Daily Visitor Stats for each active custom domain (Last 7 Days)
  const dailyTrafficData = useMemo(() => {
    const days = [
      { day: "Mon", date: "Oct 28", baseMultiplier: 1.05 },
      { day: "Tue", date: "Oct 29", baseMultiplier: 1.12 },
      { day: "Wed", date: "Oct 30", baseMultiplier: 1.18 },
      { day: "Thu", date: "Oct 31", baseMultiplier: 1.34 },
      { day: "Fri", date: "Nov 01", baseMultiplier: 1.72 }, // Algeria & MENA shopping surge
      { day: "Sat", date: "Nov 02", baseMultiplier: 1.88 }, // Weekend campaign peak
      { day: "Sun", date: "Nov 03", baseMultiplier: 1.48 }, // Today
    ];

    return days.map((d, dIdx) => {
      let totalDayVisits = 0;
      let totalDayUnique = 0;
      let totalDayAdClicks = 0;

      const row: Record<string, any> = {
        name: d.day,
        label: `${d.day}, ${d.date}`,
        shortDate: d.date,
      };

      activeCustomDomains.forEach((dom, domIdx) => {
        const base =
          (domIdx === 0 ? 1720 : domIdx === 1 ? 1140 : 760) +
          ((domIdx * 190 + dIdx * 125) % 360);
        const domainVisits = Math.round(base * d.baseMultiplier);
        const domainUnique = Math.round(domainVisits * 0.74);
        const domainAdClicks = Math.round(domainVisits * 0.44);

        row[dom.domain] = domainVisits;
        row[`${dom.domain}_unique`] = domainUnique;
        row[`${dom.domain}_adClicks`] = domainAdClicks;

        totalDayVisits += domainVisits;
        totalDayUnique += domainUnique;
        totalDayAdClicks += domainAdClicks;
      });

      row.totalVisits = totalDayVisits;
      row.totalUnique = totalDayUnique;
      row.totalAdClicks = totalDayAdClicks;

      return row;
    });
  }, [activeCustomDomains]);

  // Mock Weekly Visitor Stats for each active custom domain (Last 4 Weeks)
  const weeklyTrafficData = useMemo(() => {
    const weeks = [
      { week: "W1", label: "Week 1 (Oct 06 - 12)", baseMultiplier: 1.0 },
      { week: "W2", label: "Week 2 (Oct 13 - 19)", baseMultiplier: 1.15 },
      { week: "W3", label: "Week 3 (Oct 20 - 26)", baseMultiplier: 1.31 },
      { week: "W4", label: "Week 4 (Oct 27 - Nov 03)", baseMultiplier: 1.52 },
    ];

    return weeks.map((w, wIdx) => {
      let totalWeekVisits = 0;
      let totalWeekUnique = 0;
      let totalWeekAdClicks = 0;

      const row: Record<string, any> = {
        name: w.week,
        label: w.label,
      };

      activeCustomDomains.forEach((dom, domIdx) => {
        const base =
          (domIdx === 0 ? 12400 : domIdx === 1 ? 8100 : 5200) +
          ((domIdx * 950 + wIdx * 640) % 1900);
        const domainVisits = Math.round(base * w.baseMultiplier);
        const domainUnique = Math.round(domainVisits * 0.76);
        const domainAdClicks = Math.round(domainVisits * 0.46);

        row[dom.domain] = domainVisits;
        row[`${dom.domain}_unique`] = domainUnique;
        row[`${dom.domain}_adClicks`] = domainAdClicks;

        totalWeekVisits += domainVisits;
        totalWeekUnique += domainUnique;
        totalWeekAdClicks += domainAdClicks;
      });

      row.totalVisits = totalWeekVisits;
      row.totalUnique = totalWeekUnique;
      row.totalAdClicks = totalWeekAdClicks;

      return row;
    });
  }, [activeCustomDomains]);

  // Active traffic dataset based on selected timeframe
  const currentTrafficDataset =
    trafficTimeframe === "daily" ? dailyTrafficData : weeklyTrafficData;

  // Aggregated Summary Metrics for the active filter
  const trafficSummary = useMemo(() => {
    const isFiltered = selectedTrafficDomain !== "all";
    let visitsSum = 0;
    let uniqueSum = 0;
    let adClicksSum = 0;

    currentTrafficDataset.forEach((row) => {
      if (isFiltered) {
        visitsSum += Number(row[selectedTrafficDomain] || 0);
        uniqueSum += Number(row[`${selectedTrafficDomain}_unique`] || 0);
        adClicksSum += Number(row[`${selectedTrafficDomain}_adClicks`] || 0);
      } else {
        visitsSum += Number(row.totalVisits || 0);
        uniqueSum += Number(row.totalUnique || 0);
        adClicksSum += Number(row.totalAdClicks || 0);
      }
    });

    return {
      totalVisits: visitsSum,
      uniqueShoppers: uniqueSum,
      adCampaignClicks: adClicksSum,
      adSharePercent: visitsSum > 0 ? Math.round((adClicksSum / visitsSum) * 100) : 44,
      edgeCacheHitRate: 98.9,
      avgLatencyMs: 22,
    };
  }, [currentTrafficDataset, selectedTrafficDomain]);

  // Per-domain breakdown statistics for the summary table
  const domainBreakdownStats = useMemo(() => {
    const topSourceSamples = [
      "Meta Ads (Facebook / IG)",
      "Google Ads & Organic",
      "TikTok Ads",
      "Direct Brand Navigation",
      "YouTube Sponsored Ads",
    ];

    return activeCustomDomains.map((dom, idx) => {
      let dailyTotal = 0;
      let weeklyTotal = 0;
      dailyTrafficData.forEach((row) => {
        dailyTotal += Number(row[dom.domain] || 0);
      });
      weeklyTrafficData.forEach((row) => {
        weeklyTotal += Number(row[dom.domain] || 0);
      });

      const todayVisits =
        dailyTrafficData[dailyTrafficData.length - 1]?.[dom.domain] ||
        Math.round(dailyTotal / 7);

      return {
        domain: dom.domain,
        record: dom,
        color: DOMAIN_COLOR_PALETTE[idx % DOMAIN_COLOR_PALETTE.length],
        todayVisits,
        dailyTotal,
        weeklyTotal,
        growthPct: "+19.2%",
        topSource: topSourceSamples[idx % topSourceSamples.length],
        cacheHitRate: "99.2%",
        edgeTtl: "3600s",
      };
    });
  }, [activeCustomDomains, dailyTrafficData, weeklyTrafficData, DOMAIN_COLOR_PALETTE]);

  // Filtered products for Product Page domain selector
  const filteredStoreProducts = useMemo(() => {
    const list = myStore.products || [];
    if (!productSearchTerm.trim()) return list;
    const q = productSearchTerm.toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [myStore.products, productSearchTerm]);

  const handleCopyText = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const showFeedback = (type: "success" | "error" | "info", message: string) => {
    setFeedbackBanner({ type, message });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const cycleDomainAdvice = () => {
    const list = isAr ? DOMAIN_ADVICES_AR : DOMAIN_ADVICES_EN;
    setAdviceIndex((prev) => (prev + 1) % list.length);
  };

  // Open modal for New Domain (optionally pre-selecting a specific category)
  const handleOpenAddModal = (initialDestType: DomainDestinationType = "store") => {
    if (isLimitReached) {
      showFeedback(
        "error",
        isAr
          ? `لقد وصلت إلى الحد الأقصى للنطاقات المسموح بها في باقة ${merchantPlanTier} (${planAllowedLimit}). يرجى ترقية اشتراكك لإضافة المزيد.`
          : `You have reached the maximum number of connected domains for your ${merchantPlanTier} plan (${planAllowedLimit}). Please upgrade your subscription to connect more domains.`
      );
      return;
    }
    setEditingDomainId(null);
    setDomainInput("");
    setDomainInputError("");
    setSelectedDestType(initialDestType);
    setSelectedProductId(myStore.products?.[0]?.id || "");
    setLandingPageDraftSlug("campaign-launch");
    setForceHttps(true);
    setSslAutoRenew(true);
    setCdnEnabled(true);
    setUtmPassthrough(true);
    setPixelForwardingEnabled(true);
    setShowAdvancedModalSettings(false);
    setModalDnsCheckState({
      isChecking: false,
      overallStatus: "pending",
      aRecordStatus: "pending",
      cnameRecordStatus: "pending",
      lastCheckedAt: null,
      statusMessage: null,
    });
    setIsSetupModalOpen(true);
  };

  // Open modal to Edit Existing Domain
  const handleOpenEditModal = (record: CustomDomainRecord) => {
    const isAlreadyVerified =
      record.verificationStatus === "verified" || record.connectionStatus === "active";
    setEditingDomainId(record.id);
    setDomainInput(record.domain);
    setDomainInputError("");
    setSelectedDestType(record.destinationType);
    if (record.destinationType === "product") {
      setSelectedProductId(record.destinationRefId || myStore.products?.[0]?.id || "");
    } else if (record.destinationType === "landing_page") {
      setLandingPageDraftSlug(record.destinationRefId || "campaign-launch");
    }
    setForceHttps(record.forceHttps ?? true);
    setSslAutoRenew(record.sslAutoRenew ?? true);
    setCdnEnabled(record.cdnEnabled ?? true);
    setUtmPassthrough(record.utmPassthrough ?? true);
    setPixelForwardingEnabled(record.pixelForwardingEnabled ?? true);
    setShowAdvancedModalSettings(false);
    setModalDnsCheckState({
      isChecking: false,
      overallStatus: isAlreadyVerified ? "verified" : "pending",
      aRecordStatus: isAlreadyVerified ? "verified" : "pending",
      cnameRecordStatus: isAlreadyVerified ? "verified" : "pending",
      lastCheckedAt: record.lastCheckedAt || null,
      statusMessage: null,
    });
    setIsSetupModalOpen(true);
  };

  // Trigger DNS A/CNAME Verification inside the "Add Domain" Modal
  const handleCheckModalDnsStatus = async (simulateStatus: "verified" | "pending" = "verified") => {
    const candidateHost =
      normalizeDomainInput(domainInput) ||
      (selectedDestType === "product"
        ? `promo.${storeSlug}.com`
        : selectedDestType === "landing_page"
        ? `vip.${storeSlug}.com`
        : `www.${storeSlug}.com`);

    if (!domainInput.trim()) {
      setDomainInput(candidateHost);
    }
    setDomainInputError("");
    setModalDnsCheckState((prev) => ({
      ...prev,
      isChecking: true,
      statusMessage: null,
    }));

    const result = await checkDnsRecordsViaMockApi(
      candidateHost,
      selectedDestType,
      simulateStatus
    );

    setModalDnsCheckState({
      isChecking: false,
      overallStatus: result.verified ? "verified" : "pending",
      aRecordStatus: result.aVerified ? "verified" : "pending",
      cnameRecordStatus: result.cnameVerified ? "verified" : "pending",
      lastCheckedAt: result.checkedAt,
      statusMessage: result.verified
        ? isAr
          ? `تم التحقق بنجاح! سجل A (${result.expectedA}) وسجل CNAME (${result.expectedCname}) متطابقان.`
          : `DNS Verified! A Record (${result.expectedA}) and CNAME (${result.expectedCname}) resolved accurately.`
        : isAr
        ? `بانتظار انتشار سجلات DNS (Pending) للنطاق ${candidateHost}.`
        : `DNS records for ${candidateHost} are currently Pending propagation.`,
    });
  };

  const resolveDestinationMetadata = () => {
    if (selectedDestType === "product") {
      const targetProd = (myStore.products || []).find((p) => p.id === selectedProductId);
      return {
        destinationRefId: targetProd ? targetProd.id : selectedProductId,
        destinationLabel: targetProd
          ? `Product: ${targetProd.name}`
          : "Direct Product Campaign Page",
      };
    }
    if (selectedDestType === "landing_page") {
      const slug = landingPageDraftSlug.trim() || "campaign-launch";
      return {
        destinationRefId: slug,
        destinationLabel: `Landing Page (${slug} · Future-Ready)`,
      };
    }
    return {
      destinationRefId: myStore.id,
      destinationLabel: `Storefront (${myStore.name})`,
    };
  };

  // Connect or Update Domain directly from the unified modal
  const handleConnectDomainSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const normalized = normalizeDomainInput(domainInput);

    if (!isValidDomainFormat(normalized)) {
      setDomainInputError(
        isAr
          ? "يرجى إدخال نطاق صحيح مثل www.mystore.com أو shop.mystore.com"
          : "Please enter a valid domain or subdomain (e.g., www.mystore.com or promo.mystore.com)."
      );
      return;
    }

    if (
      normalized.endsWith(".yume.store") ||
      normalized.endsWith(".platform.dz") ||
      normalized.endsWith(".yume.dz")
    ) {
      setDomainInputError(
        isAr
          ? "نطاقات YUME المجانية مفعلة تلقائياً. يرجى إدخال نطاقك المخصص."
          : "Default YUME domains are already free and active. Please enter your own custom domain."
      );
      return;
    }

    const duplicate = domains.find(
      (d) => d.id !== editingDomainId && normalizeDomainInput(d.domain) === normalized
    );
    if (duplicate) {
      setDomainInputError(
        isAr
          ? `النطاق "${normalized}" متصل بالفعل بمتجرك.`
          : `The domain "${normalized}" is already connected to your store.`
      );
      return;
    }

    if (selectedDestType === "product" && !selectedProductId) {
      setDomainInputError(
        isAr
          ? "يرجى اختيار المنتج الذي سيفتحه هذا النطاق."
          : "Please select a target product for this Product Page domain."
      );
      return;
    }

    const { destinationRefId, destinationLabel } = resolveDestinationMetadata();
    const isPreVerified = modalDnsCheckState.overallStatus === "verified";

    setLoading(true);
    try {
      if (editingDomainId) {
        const res = await fetch(`/api/domains/${editingDomainId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain: normalized,
            destinationType: selectedDestType,
            destinationRefId,
            destinationLabel,
            forceHttps,
            sslAutoRenew,
            cdnEnabled,
            utmPassthrough,
            pixelForwardingEnabled,
            verificationStatus: isPreVerified ? "verified" : "pending",
            dnsStatus: isPreVerified ? "configured" : "pending",
            sslStatus: isPreVerified ? "active" : "pending",
            connectionStatus: isPreVerified ? "active" : "pending_verification",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setDomainInputError(data.error || "Failed to update domain configuration.");
          setLoading(false);
          return;
        }
        const updatedRecord: CustomDomainRecord = data.domain;
        const completeRecords = buildCompleteDnsRecordsForDomain(updatedRecord);
        const updatedWithComplete = { ...updatedRecord, dnsRecords: completeRecords };
        const nextList = domains.map((d) =>
          d.id === updatedWithComplete.id ? updatedWithComplete : d
        );
        setDomains(nextList);
        syncDomainsToStoreState(nextList);
        setIsSetupModalOpen(false);
        showFeedback(
          "success",
          isAr
            ? `تم تحديث إعدادات النطاق ${updatedRecord.domain} بنجاح.`
            : `Updated configuration for ${updatedRecord.domain} (${
                isPreVerified ? "Verified" : "Pending"
              }).`
        );
      } else {
        const res = await fetch("/api/domains", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchantId: myStore.id,
            storeName: myStore.name,
            domain: normalized,
            destinationType: selectedDestType,
            destinationRefId,
            destinationLabel,
            subscriptionTier: merchantPlanTier,
            autoVerify: isPreVerified,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setDomainInputError(data.error || "Could not connect domain.");
          setLoading(false);
          return;
        }
        const createdRecord: CustomDomainRecord = data.domain;
        const completeRecords = buildCompleteDnsRecordsForDomain(createdRecord);
        const createdWithComplete = { ...createdRecord, dnsRecords: completeRecords };
        const nextList = [createdWithComplete, ...domains];
        setDomains(nextList);
        syncDomainsToStoreState(nextList);
        setIsSetupModalOpen(false);
        showFeedback(
          isPreVerified ? "success" : "info",
          isPreVerified
            ? isAr
              ? `تم ربط النطاق ${createdRecord.domain} والتحقق من سجلات A و CNAME بنجاح (Verified)!`
              : `Domain ${createdRecord.domain} connected with Verified DNS (A & CNAME) and Active SSL!`
            : isAr
            ? `تمت إضافة النطاق ${createdRecord.domain} بحالة بانتظار التحقق (Pending). اضغط على "تحقق من DNS" لفحص سجلات A/CNAME.`
            : `Domain ${createdRecord.domain} added with Pending status. Click "Verify DNS" on its card to check A/CNAME records.`
        );
      }
    } catch (err: any) {
      setDomainInputError(err.message || "Network error while saving domain.");
    } finally {
      setLoading(false);
    }
  };

  // Build complete A, CNAME, and TXT records for any domain
  const buildCompleteDnsRecordsForDomain = (record: CustomDomainRecord): DomainDnsRecord[] => {
    const catCfg = categoryDnsConfig[record.destinationType] || categoryDnsConfig.store;
    const parts = (record.domain || "").split(".");
    const isSub = parts.length > 2;
    const subHost = isSub ? parts.slice(0, -2).join(".") : "www";
    const isVerified =
      record.connectionStatus === "active" || record.verificationStatus === "verified";

    const existing = Array.isArray(record.dnsRecords) ? record.dnsRecords : [];
    const existingA = existing.find((r) => r.type === "A");
    const existingCname = existing.find((r) => r.type === "CNAME");
    const existingTxt = existing.find((r) => r.type === "TXT");

    const defaultA: DomainDnsRecord = {
      type: "A",
      host: "@",
      value: catCfg.aRecordIp,
      ttl: 300,
      verified: isVerified,
      purpose: "Root Domain IPv4 Routing (Points @ to YUME Edge IP)",
    };

    const defaultCname: DomainDnsRecord = {
      type: "CNAME",
      host: subHost,
      value: catCfg.cnameTarget,
      ttl: 300,
      verified: isVerified,
      purpose: "Subdomain / Storefront Routing (Points hostname to YUME CDN)",
    };

    const defaultTxt: DomainDnsRecord = {
      type: "TXT",
      host: `_yume-challenge${isSub ? `.${subHost}` : ""}`,
      value: record.verificationToken || `yume-verify-${record.id.slice(-8)}`,
      ttl: 300,
      verified: isVerified,
      purpose: "Cryptographic Domain Ownership Verification Token",
    };

    return [
      existingA ? { ...defaultA, ...existingA } : defaultA,
      existingCname ? { ...defaultCname, ...existingCname } : defaultCname,
      existingTxt ? { ...defaultTxt, ...existingTxt } : defaultTxt,
    ];
  };

  const handleOpenEditDnsModal = (record: CustomDomainRecord) => {
    setInspectingDomain(record);
    setEditableDnsRecords(buildCompleteDnsRecordsForDomain(record));
    setDnsModalNotice(null);
  };

  const handleUpdateEditableDnsRecord = (
    idx: number,
    field: keyof DomainDnsRecord,
    value: string | number | boolean
  ) => {
    setEditableDnsRecords((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveDnsRecords = async () => {
    if (!inspectingDomain) return;
    setActionBusyId(inspectingDomain.id);
    try {
      const res = await fetch(`/api/domains/${inspectingDomain.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dnsRecords: editableDnsRecords,
        }),
      });
      const data = await res.json();
      if (res.ok && data.domain) {
        const updated: CustomDomainRecord = data.domain;
        const completeRecords = buildCompleteDnsRecordsForDomain(updated);
        const updatedWithComplete = { ...updated, dnsRecords: completeRecords };
        const nextList = domains.map((d) =>
          d.id === updatedWithComplete.id ? updatedWithComplete : d
        );
        setDomains(nextList);
        syncDomainsToStoreState(nextList);
        setInspectingDomain(updatedWithComplete);
        setEditableDnsRecords(completeRecords);
        setDnsModalNotice({
          type: "success",
          text: isAr
            ? "تم حفظ سجلات DNS (A, CNAME, TXT) بنجاح. اضغط على 'فحص الحالة' للتحقق من الإعدادات."
            : "DNS records (A, CNAME, TXT) saved successfully. Click 'Check Status' to re-trigger verification.",
        });
      }
    } catch {
      setDnsModalNotice({
        type: "error",
        text: "Failed to save DNS records.",
      });
    } finally {
      setActionBusyId(null);
    }
  };

  // Verify Domain DNS A/CNAME & SSL Ownership ("Verify DNS" / "Check Status")
  const handleVerifyDomain = async (
    domainId: string,
    simulateMode: "success" | "pending" | "misconfigured" | "disconnected" = "success"
  ) => {
    setActionBusyId(domainId);
    const targetDomain = domains.find((d) => d.id === domainId);
    try {
      // 1. Run mock DNS A/CNAME resolution check
      if (targetDomain) {
        await checkDnsRecordsViaMockApi(
          targetDomain.domain,
          targetDomain.destinationType,
          simulateMode === "success" ? "verified" : "pending"
        );
      }

      if (inspectingDomain && inspectingDomain.id === domainId && editableDnsRecords.length > 0) {
        await fetch(`/api/domains/${domainId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dnsRecords: editableDnsRecords }),
        }).catch(() => {});
      }

      const res = await fetch(`/api/domains/${domainId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulateMode }),
      });

      let updated: CustomDomainRecord | null = null;
      if (res.ok) {
        const data = await res.json();
        if (data.domain) updated = data.domain;
      }

      // Client-side fallback if backend is unreachable
      if (!updated && targetDomain) {
        const now = new Date().toISOString();
        updated = {
          ...targetDomain,
          verificationStatus:
            simulateMode === "success"
              ? "verified"
              : simulateMode === "disconnected"
              ? "failed"
              : "pending",
          dnsStatus:
            simulateMode === "success"
              ? "configured"
              : simulateMode === "misconfigured"
              ? "misconfigured"
              : "pending",
          sslStatus: simulateMode === "success" ? "active" : "pending",
          connectionStatus:
            simulateMode === "success"
              ? "active"
              : simulateMode === "misconfigured"
              ? "misconfigured"
              : simulateMode === "disconnected"
              ? "disconnected"
              : "pending_verification",
          cacheStatus: simulateMode === "success" ? "HIT" : "BYPASS",
          lastCheckedAt: now,
          updatedAt: now,
        };
      }

      if (updated) {
        const completeRecords = buildCompleteDnsRecordsForDomain(updated).map((r) => ({
          ...r,
          verified:
            simulateMode === "success"
              ? true
              : simulateMode === "misconfigured"
              ? r.type === "TXT"
              : false,
        }));
        const updatedWithComplete: CustomDomainRecord = {
          ...updated,
          dnsRecords: completeRecords,
        };
        const nextList = domains.map((d) =>
          d.id === updatedWithComplete.id ? updatedWithComplete : d
        );
        setDomains(nextList);
        syncDomainsToStoreState(nextList);
        if (inspectingDomain?.id === updatedWithComplete.id) {
          setInspectingDomain(updatedWithComplete);
          setEditableDnsRecords(completeRecords);
          setDnsModalNotice({
            type: simulateMode === "success" ? "success" : "info",
            text:
              simulateMode === "success"
                ? isAr
                  ? `تم فحص الحالة بنجاح (Verified): سجلات A و CNAME و TXT متطابقة وشهادة SSL نشطة!`
                  : `DNS Check Complete (Verified): A, CNAME, and TXT records resolved and TLS 1.3 SSL is Active!`
                : simulateMode === "pending"
                ? isAr
                  ? `حالة النطاق الآن بانتظار التحقق (Pending): جاري انتظار انتشار سجلات A و CNAME.`
                  : `DNS Status set to Pending: Waiting for A and CNAME record propagation.`
                : `Status check complete: Domain is currently ${updatedWithComplete.connectionStatus.replace(
                    "_",
                    " "
                  )}.`,
          });
        }
        showFeedback(
          simulateMode === "success" ? "success" : "info",
          simulateMode === "success"
            ? isAr
              ? `تم التحقق من النطاق ${updated.domain} (Verified)! سجلات A و CNAME متطابقة وشهادة SSL نشطة.`
              : `Domain ${updated.domain} is now Verified! DNS A & CNAME records validated and SSL is Active.`
            : simulateMode === "pending"
            ? isAr
              ? `تم تحديث حالة النطاق ${updated.domain} إلى بانتظار التحقق (Pending).`
              : `Domain ${updated.domain} status updated to Pending verification.`
            : `Domain ${updated.domain} status updated to ${updated.connectionStatus.replace("_", " ")}.`
        );
      }
    } catch {
      showFeedback("error", "Verification check failed.");
    } finally {
      setActionBusyId(null);
    }
  };

  // Purge Edge & Multi-Tenant Cache for a Domain
  const handlePurgeDomainCache = async (domainId: string) => {
    setActionBusyId(domainId);
    try {
      const res = await fetch(`/api/domains/${domainId}/purge-cache`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.domain) {
        const updated: CustomDomainRecord = data.domain;
        const nextList = domains.map((d) => (d.id === updated.id ? updated : d));
        setDomains(nextList);
        syncDomainsToStoreState(nextList);
        showFeedback(
          "success",
          isAr
            ? `تم مسح وتحديث ذاكرة التخزين المؤقت (CDN Edge Cache) للنطاق ${updated.domain}.`
            : `Edge & Multi-Tenant Routing Cache purged and refreshed for ${updated.domain}.`
        );
      }
    } catch {
      showFeedback("error", "Could not purge cache.");
    } finally {
      setActionBusyId(null);
    }
  };

  // Remove a Connected Domain
  const handleRemoveDomain = async (record: CustomDomainRecord) => {
    setActionBusyId(record.id);
    try {
      const res = await fetch(`/api/domains/${record.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const nextList = domains.filter((d) => d.id !== record.id);
        setDomains(nextList);
        syncDomainsToStoreState(nextList);
        if (inspectingDomain?.id === record.id) setInspectingDomain(null);
        showFeedback(
          "info",
          isAr
            ? `تم فصل وحذف النطاق ${record.domain} من متجرك.`
            : `Disconnected and removed custom domain ${record.domain}.`
        );
      }
    } catch {
      showFeedback("error", "Failed to remove domain.");
    } finally {
      setActionBusyId(null);
    }
  };

  // Test Multi-Tenant Domain Resolution
  const handleTestDomainResolution = async (hostnameToTest?: string) => {
    const targetHost = normalizeDomainInput(
      hostnameToTest || resolverTestHost || domains[0]?.domain || ""
    );
    if (!targetHost) return;
    setResolverTestHost(targetHost);
    setResolverLoading(true);
    try {
      const res = await fetch(`/api/domains/resolve?hostname=${encodeURIComponent(targetHost)}`);
      const data = await res.json();
      setResolverResult(data);
    } catch (err: any) {
      setResolverResult({ matched: false, error: err.message || "Resolution failed" });
    } finally {
      setResolverLoading(false);
    }
  };

  const handleVisitDestination = (record: CustomDomainRecord) => {
    if (!onPreviewDomainDestination) return;
    // Support both (destType, refId) and (record) callback signatures
    if (onPreviewDomainDestination.length >= 2) {
      onPreviewDomainDestination(record.destinationType, record.destinationRefId);
    } else {
      onPreviewDomainDestination(record as any, record.destinationRefId);
    }
  };

  // Explicit 'Verified' or 'Pending' Status Badge Component
  const renderVerificationBadge = (
    status: "verified" | "pending" | boolean,
    prefixLabel?: string
  ) => {
    const isVerified = status === true || status === "verified";
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border transition-all ${
          isVerified
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/90 dark:border-emerald-800/60"
            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/90 dark:border-amber-800/60"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isVerified ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
          }`}
        />
        <span>
          {prefixLabel ? `${prefixLabel}: ` : ""}
          {isVerified ? (isAr ? "موثق (Verified)" : "Verified") : isAr ? "قيد الانتظار (Pending)" : "Pending"}
        </span>
      </span>
    );
  };

  const renderConnectionStatusIndicator = (status: DomainConnectionStatus) => {
    switch (status) {
      case "active":
        return renderVerificationBadge("verified");
      case "pending_verification":
        return renderVerificationBadge("pending");
      case "misconfigured":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/90 dark:border-rose-800/60">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>{isAr ? "خطأ في DNS (Pending)" : "Pending (Misconfigured)"}</span>
          </span>
        );
      case "disconnected":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200/90 dark:border-slate-700">
            <XCircle className="w-3 h-3 text-stone-400" />
            <span>{isAr ? "غير متصل" : "Disconnected"}</span>
          </span>
        );
    }
  };

  // Render an individual Custom Domain Card matching Add Product's structured item cards
  const renderDomainManagementCard = (record: CustomDomainRecord) => {
    const isBusy = actionBusyId === record.id;
    const isVerified =
      record.connectionStatus === "active" || record.verificationStatus === "verified";
    const completeDns = buildCompleteDnsRecordsForDomain(record);
    const aRec = completeDns.find((r) => r.type === "A");
    const cnameRec = completeDns.find((r) => r.type === "CNAME");

    const linkedProduct =
      record.destinationType === "product"
        ? (myStore.products || []).find((p) => p.id === record.destinationRefId)
        : null;

    return (
      <div
        key={record.id}
        className="group bg-white dark:bg-slate-950 rounded-xl border border-stone-200/90 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 p-4 transition-all shadow-2xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Domain Hostname & Target Context */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            {record.destinationType === "product" && linkedProduct?.imageUrl ? (
              <img
                src={linkedProduct.imageUrl}
                alt={linkedProduct.name}
                className="w-11 h-11 rounded-xl object-cover border border-stone-200 dark:border-slate-700 shrink-0 bg-stone-50 dark:bg-slate-900"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  record.connectionStatus === "active"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400"
                    : record.connectionStatus === "pending_verification"
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/50 text-amber-600 dark:text-amber-400"
                    : "bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/50 text-rose-600 dark:text-rose-400"
                }`}
              >
                {record.destinationType === "product" ? (
                  <Package className="w-5 h-5" />
                ) : record.destinationType === "landing_page" ? (
                  <Layers className="w-5 h-5" />
                ) : (
                  <Store className="w-5 h-5" />
                )}
              </div>
            )}

            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm text-stone-900 dark:text-white tracking-tight">
                  {record.domain}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(`card-dom-${record.id}`, `https://${record.domain}`)}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title="Copy Domain URL"
                >
                  {copiedKey === `card-dom-${record.id}` ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Clean typographic destination metadata row without technical DNS/SSL clutter */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-slate-400 font-sans">
                <span className="font-medium text-stone-600 dark:text-slate-300">
                  {linkedProduct ? `Product: ${linkedProduct.name}` : record.destinationLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action Controls matching Add Product buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-stone-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() =>
                handleVerifyDomain(record.id, isVerified ? "pending" : "success")
              }
              disabled={isBusy}
              className={`px-3 py-1.5 rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                !isVerified
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 border border-stone-200/80 dark:border-slate-700"
              }`}
              title={
                isVerified
                  ? "Re-check DNS A/CNAME records (or toggle to Pending for testing)"
                  : "Verify DNS A and CNAME records now"
              }
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? "animate-spin" : ""}`} />
              <span>
                {isBusy
                  ? isAr
                    ? "جاري الفحص..."
                    : "Checking DNS..."
                  : !isVerified
                  ? isAr
                    ? "تحقق من DNS"
                    : "Verify DNS"
                  : isAr
                  ? "إعادة فحص DNS"
                  : "Re-Verify DNS"}
              </span>
            </button>

            {onPreviewDomainDestination && (
              <button
                type="button"
                onClick={() => handleVisitDestination(record)}
                className="px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 border border-stone-200/90 dark:border-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open live destination routed by this custom domain"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? "معاينة" : "Visit"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenEditDnsModal(record)}
              className="px-3 py-1.5 rounded-xl text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:brightness-110 active:scale-98"
              style={{
                backgroundColor:
                  "var(--yume-theme-header-color, " +
                  (darkMode ? "#2563eb" : currentSlideColor || "#0b2447") +
                  ")",
              }}
              title="View and edit required A, CNAME & TXT DNS records and check verification status"
            >
              <Server className="w-3.5 h-3.5" />
              <span>{isAr ? "تعديل سجلات DNS" : "Edit DNS Records"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCampaignModalDomain(record);
                setSelectedAdNetwork("Google Ads");
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 border border-stone-200/90 dark:border-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Generate Google, Meta, TikTok & YouTube Ad Campaign Links"
            >
              <Megaphone className="w-3.5 h-3.5 text-rose-500" />
              <span>{isAr ? "روابط الإعلانات" : "Ad Links"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenEditModal(record)}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 border border-stone-200/80 dark:border-slate-700 transition-colors cursor-pointer"
              title="Edit Domain Destination & Settings"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleRemoveDomain(record)}
              disabled={isBusy}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 transition-colors cursor-pointer"
              title="Disconnect & Remove Domain"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Default Free YUME Domain Row matching Add Product's SkeuomorphicSwitch toggle rows
  const renderDefaultYumeDomainRow = (
    category: DomainDestinationType,
    icon: React.ReactNode
  ) => {
    const cfg = categoryDnsConfig[category];
    const isEnabled = defaultDomainEnabled[category];

    return (
      <div className="bg-stone-50 dark:bg-slate-900/60 rounded-xl border border-stone-200/80 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 flex items-center justify-center text-stone-700 dark:text-slate-300 shrink-0 shadow-3xs">
            {icon}
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                {cfg.defaultDomain}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopyText(`def-dom-${category}`, `https://${cfg.defaultDomain}`)
                }
                className="text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Copy Free YUME Domain"
              >
                {copiedKey === `def-dom-${category}` ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <span className="text-[10px] font-mono text-stone-700 dark:text-slate-300 font-semibold bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 px-2 py-0.5 rounded-md">
                {cfg.badgeLabel}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
              {isAr
                ? "نطاق YUME فرعي مجاني ومؤمن بشهادة SSL تلقائية • يعمل جنباً إلى جنب مع نطاقاتك المخصصة"
                : "Free built-in YUME subdomain with automatic TLS 1.3 SSL • Works alongside your custom domains"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className="text-[11px] font-semibold text-stone-600 dark:text-slate-300 font-mono">
            {isEnabled
              ? isAr
                ? "مفعل للزوار"
                : "Active"
              : isAr
              ? "متوقف مؤقتاً"
              : "Paused"}
          </span>
          <SkeuomorphicSwitch
            checked={isEnabled}
            onChange={(val) =>
              setDefaultDomainEnabled((prev) => ({
                ...prev,
                [category]: val,
              }))
            }
          />
        </div>
      </div>
    );
  };

  const activeModalDns = categoryDnsConfig[selectedDestType];
  const currentAdviceList = isAr ? DOMAIN_ADVICES_AR : DOMAIN_ADVICES_EN;
  const activeAdviceText = currentAdviceList[adviceIndex % currentAdviceList.length];

  const topNavCards = [
    {
      id: "all" as const,
      label: isAr ? "جميع النطاقات" : "Domains overview",
      desc: isAr ? "المركز الشامل للنطاقات" : "All connected & free domains",
      icon: Globe,
      badge: String(connectedCount),
    },
    {
      id: "traffic" as const,
      label: isAr ? "حركة الزيارات" : "Traffic Overview",
      desc: isAr ? "إحصائيات وزيارات النطاقات" : "Daily & weekly visitor stats",
      icon: BarChart3,
      badge: `${activeCustomDomains.length} Active`,
    },
    {
      id: "store" as const,
      label: isAr ? "نطاقات المتجر" : "For Stores",
      desc: isAr ? "واجهة المتجر الكاملة" : "Storefront root & subdomains",
      icon: Store,
      badge: String(storeDomains.length),
    },
    {
      id: "product" as const,
      label: isAr ? "صفحات المنتجات" : "For Product Pages",
      desc: isAr ? "روابط مباشرة للإعلانات" : "Direct product checkout links",
      icon: Package,
      badge: String(productDomains.length),
    },
    {
      id: "landing_page" as const,
      label: isAr ? "صفحات الهبوط" : "Landing Pages",
      desc: isAr ? "مسارات البيع القادمة" : "Promotional funnels · Ready",
      icon: Layers,
      badge: String(landingPageDomains.length),
    },
    {
      id: "routing" as const,
      label: isAr ? "فاحص التوجيه و SSL" : "Routing & SSL",
      desc: isAr ? "اختبار DNS والكاش" : "Live edge resolver & CDN",
      icon: Activity,
      badge: "SSL",
    },
  ];

  // Custom Tooltip component for Recharts Domain Traffic Visualizations
  const CustomTrafficTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-stone-200 dark:border-slate-800 shadow-xl text-xs space-y-1.5 min-w-[190px] z-50">
        <div className="font-bold text-stone-900 dark:text-white border-b border-stone-200/80 dark:border-slate-800 pb-1">
          {payload[0]?.payload?.label || label}
        </div>
        <div className="space-y-1 pt-0.5">
          {payload.map((entry: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-stone-600 dark:text-slate-300 truncate max-w-[140px] font-medium">
                  {entry.name}:
                </span>
              </div>
              <span className="font-mono font-bold text-stone-900 dark:text-white">
                {Number(entry.value).toLocaleString()} {isAr ? "زيارة" : "visits"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="flex flex-col gap-6 fade-in font-sans text-stone-900 dark:text-slate-100 transition-all duration-200 w-full pb-14 text-left"
      dir={isAr ? "rtl" : "ltr"}
      id="yume-add-domain-management-section"
      style={{ "--accent-color": currentSlideColor } as React.CSSProperties}
    >
      {/* =====================================================================
          MAIN CUSTOM DOMAINS & EDGE ROUTING WORKSPACE (MATCHING ADD PRODUCT DESIGN)
         ===================================================================== */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs text-left flex flex-col gap-5 animate-fade-in">
        {/* Section Header Bar (matching Step 1/2/3/4 header in Add Product) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-1.5 h-5 rounded-full shrink-0"
              style={{
                backgroundColor:
                  "var(--yume-theme-header-color, " +
                  (darkMode ? "#38bdf8" : currentSlideColor || "#0b2447") +
                  ")",
              }}
            />
            <div className="p-2 rounded-lg bg-stone-50 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 text-stone-700 dark:text-slate-300 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight font-sans">
                  {isAr ? "إدارة النطاقات المخصصة (Domains)" : "Custom Domains & Edge Routing"}
                </h2>
                <span className="text-[10px] font-mono text-stone-700 dark:text-slate-300 font-semibold bg-stone-50 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 px-2.5 py-0.5 rounded-md">
                  {isLimitEnforced
                    ? `${connectedCount} / ${
                        planAllowedLimit === "unlimited" ? "Unlimited" : planAllowedLimit
                      } (${merchantPlanTier})`
                    : `${connectedCount} connected • Unlimited`}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium mt-0.5">
                {isAr
                  ? "اربط نطاقاتك الخاصة بمتجرك الكامل أو بصفحات المنتجات أو بصفحات الهبوط مع شهادة SSL تلقائية."
                  : "Connect custom domains to your entire Storefront, individual Product Pages, or Landing Pages with automatic TLS 1.3 SSL."}
              </p>
            </div>
          </div>

          {/* Right Controls: How to Connect + View Switcher + Hints Toggle + Connect Domain */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsHowToGuideOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-200 dark:border-slate-700 bg-stone-50 hover:bg-stone-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
              <span>{isAr ? "دليل ربط النطاق" : "How to Connect"}</span>
            </button>

            <div className="p-1 rounded-xl bg-stone-100 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode("categories")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "categories"
                    ? "bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-2xs"
                    : "text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isAr ? "الأقسام" : "Categories"}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-2xs"
                    : "text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>{isAr ? "الجدول الشامل" : "All Table"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowDomainHints((prev) => {
                  const next = !prev;
                  try {
                    localStorage.setItem("yume_merchant_hints", String(next));
                  } catch {}
                  window.dispatchEvent(new CustomEvent("yume_hints_toggle", { detail: next }));
                  return next;
                });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 dark:border-slate-700 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs select-none"
              title="Toggle domain configuration hints"
            >
              <HelpCircle className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
              <span>Hints: {showDomainHints ? "On" : "Off"}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  showDomainHints
                    ? "bg-stone-600 dark:bg-slate-300"
                    : "bg-stone-300 dark:bg-slate-600"
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                handleOpenAddModal(
                  destinationFilter === "product"
                    ? "product"
                    : destinationFilter === "landing_page"
                    ? "landing_page"
                    : "store"
                )
              }
              disabled={isLimitReached}
              className={`px-4 py-2 rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-xs text-white ${
                isLimitReached
                  ? "bg-stone-200 dark:bg-slate-800 text-stone-400 cursor-not-allowed opacity-60"
                  : "hover:brightness-110 active:scale-98"
              }`}
              style={{
                backgroundColor: isLimitReached
                  ? undefined
                  : "var(--yume-theme-header-color, " +
                    (darkMode ? "#2563eb" : currentSlideColor || "#0b2447") +
                    ")",
              }}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isAr ? "ربط نطاق جديد" : "Connect Domain"}</span>
            </button>
          </div>
        </div>

        {/* Add Product Style Advice Callout */}
        {showDomainHints && (
          <div
            className="flex items-start gap-2.5 p-3.5 rounded-xl border transition-all"
            style={{
              backgroundColor: `color-mix(in srgb, var(--yume-theme-header-color, ${
                darkMode ? "#0f172a" : currentSlideColor || "#0b2447"
              }) 6%, transparent)`,
              borderColor: `color-mix(in srgb, var(--yume-theme-header-color, ${
                darkMode ? "#0f172a" : currentSlideColor || "#0b2447"
              }) 18%, transparent)`,
            }}
          >
            <Info
              className="w-4 h-4 shrink-0 mt-0.5"
              style={{
                color:
                  "var(--yume-theme-header-color, " +
                  (darkMode ? "#38bdf8" : currentSlideColor || "#0b2447") +
                  ")",
              }}
            />
            <p
              className="text-xs leading-relaxed font-semibold flex-1"
              style={{
                color:
                  "var(--yume-theme-header-color, " +
                  (darkMode ? "#cbd5e1" : currentSlideColor || "#0b2447") +
                  ")",
              }}
            >
              <strong
                className="font-black uppercase mr-1.5"
                style={{
                  color:
                    "var(--yume-theme-header-color, " +
                    (darkMode ? "#38bdf8" : currentSlideColor || "#0b2447") +
                    ")",
                }}
              >
                {isAr ? "نصيحة:" : "Advice:"}
              </strong>
              {activeAdviceText}
            </p>
            <button
              type="button"
              onClick={cycleDomainAdvice}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-white p-1 rounded-md transition-all cursor-pointer shrink-0"
              title="Show another domain tip"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Subscription Limit Reached Upgrade Notification */}
        {isLimitReached && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {isAr
                    ? `تم الوصول إلى الحد الأقصى للنطاقات في باقة ${merchantPlanTier} (${connectedCount} / ${planAllowedLimit})`
                    : `Domain Limit Reached for Your ${merchantPlanTier} Plan (${connectedCount} / ${planAllowedLimit})`}
                </h4>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 mt-0.5">
                  {isAr
                    ? "لربط نطاقات إضافية لمنتجاتك أو حملاتك الإعلانية، يرجى ترقية اشتراكك إلى باقة أعلى."
                    : "You have reached the custom domain allowance for your current subscription tier. Upgrade your plan to connect additional domains."}
                </p>
              </div>
            </div>
            {onUpgradePlan && (
              <button
                type="button"
                onClick={onUpgradePlan}
                className="px-4 py-2 rounded-xl text-white font-semibold text-xs shrink-0 cursor-pointer transition-all shadow-xs hover:brightness-110 active:scale-98"
                style={{
                  backgroundColor:
                    "var(--yume-theme-header-color, " +
                    (darkMode ? "#2563eb" : currentSlideColor || "#0b2447") +
                    ")",
                }}
              >
                {isAr ? "ترقية الباقة الآن" : "Upgrade Subscription"}
              </button>
            )}
          </div>
        )}

        {/* Search & Filter Row Styled Like Add Product Inputs & Selects */}
        {domains.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
            <div className="md:col-span-6 space-y-1">
              <label className="text-[11px] font-black font-mono text-stone-800 dark:text-slate-200 block">
                {isAr ? "البحث في النطاقات المتصلة" : "Search connected domains"}
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isAr
                      ? "ابحث باسم النطاق أو اسم المنتج..."
                      : "Filter by hostname (e.g. www.mystore.com) or destination..."
                  }
                  className="w-full text-xs font-sans p-2.5 pl-9 rounded-[8px] bg-[#f8fafc] dark:bg-slate-950 hover:bg-slate-100/70 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 focus:border-slate-800 dark:focus:border-slate-600 text-stone-900 dark:text-white font-semibold outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-black font-mono text-stone-800 dark:text-slate-200 block">
                {isAr ? "تصفية حسب القسم" : "Destination category"}
              </label>
              <div className="relative">
                <select
                  value={destinationFilter}
                  onChange={(e) => {
                    const val = e.target.value as "all" | DomainDestinationType;
                    setDestinationFilter(val);
                    if (val === "all") setActiveTopCard("all");
                    else setActiveTopCard(val);
                  }}
                  className="w-full text-xs font-bold text-stone-900 dark:text-white bg-[#f8fafc] dark:bg-slate-950 hover:bg-slate-100/70 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-[8px] p-2.5 pr-8 transition-all outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer appearance-none"
                >
                  <option value="all">{isAr ? "جميع الأقسام" : "All Categories"}</option>
                  <option value="store">{isAr ? "للمتاجر (For Stores)" : "For Stores"}</option>
                  <option value="product">
                    {isAr ? "لصفحات المنتجات (Product Pages)" : "For Product Pages"}
                  </option>
                  <option value="landing_page">
                    {isAr ? "لصفحات الهبوط (Landing Pages)" : "For Landing Pages"}
                  </option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-black font-mono text-stone-800 dark:text-slate-200 block">
                {isAr ? "حالة الاتصال و SSL" : "Connection status"}
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full text-xs font-bold text-stone-900 dark:text-white bg-[#f8fafc] dark:bg-slate-950 hover:bg-slate-100/70 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-[8px] p-2.5 pr-8 transition-all outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer appearance-none"
                >
                  <option value="all">{isAr ? "كل الحالات" : "All Statuses"}</option>
                  <option value="active">{isAr ? "نشط ومتصل (Active)" : "Active & Verified"}</option>
                  <option value="pending_verification">
                    {isAr ? "بانتظار التحقق (Pending)" : "Pending Verification"}
                  </option>
                  <option value="misconfigured">
                    {isAr ? "خطأ في الإعدادات (Misconfigured)" : "Misconfigured DNS"}
                  </option>
                  <option value="disconnected">
                    {isAr ? "غير متصل (Disconnected)" : "Disconnected"}
                  </option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Notification Banner */}
      {feedbackBanner && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
            feedbackBanner.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300"
              : feedbackBanner.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300"
              : "bg-stone-100 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-800 dark:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackBanner.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : feedbackBanner.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-stone-600 dark:text-slate-400 shrink-0" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =====================================================================
          DEDICATED DOMAIN CATEGORY CARDS (MATCHING ADD PRODUCT SECTION CARDS)
         ===================================================================== */}
      {domains.length === 0 ? (
        /* Clean initial state when no custom domain is connected */
        <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs text-center flex flex-col items-center justify-center gap-4 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 flex items-center justify-center text-stone-700 dark:text-slate-200 shadow-2xs">
            <Globe className="w-7 h-7" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight">
              {isAr ? "لم يتم ربط أي نطاق مخصص بعد" : "No Custom Domains Connected Yet"}
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed font-medium">
              {isAr
                ? "اربط نطاقك الخاص (مثل www.mystore.com) لتوجيه الزوار مباشرة إلى متجرك الكامل أو صفحة منتج أو صفحة هبوط مع شهادة SSL تلقائية."
                : "Connect your branded domain (e.g. www.mystore.com) to route shoppers directly to your storefront, individual product checkout, or campaign funnels."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleOpenAddModal("store")}
              className="px-5 py-2.5 rounded-xl text-white font-semibold text-xs inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:brightness-110 active:scale-98"
              style={{
                backgroundColor:
                  "var(--yume-theme-header-color, " +
                  (darkMode ? "#2563eb" : currentSlideColor || "#0b2447") +
                  ")",
              }}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isAr ? "ربط نطاق مخصص الآن" : "Connect Domain"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHowToGuideOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-white hover:bg-stone-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
              <span>{isAr ? "دليل ربط النطاق (5 خطوات)" : "How to Connect (5 Steps)"}</span>
            </button>
          </div>

          <div className="pt-4 border-t border-stone-100 dark:border-slate-800 text-[11.5px] text-stone-400 dark:text-slate-500 flex items-center gap-1.5 font-mono">
            <span>{isAr ? "رابط متجرك المجاني المباشر:" : "Your free store URL:"}</span>
            <code className="text-stone-700 dark:text-slate-300 font-bold bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {storeSlug}.yume.store
            </code>
          </div>
        </div>
      ) : viewMode === "categories" ? (
        <div className="flex flex-col gap-5">
          {/* CATEGORY 1: FOR STORES */}
          {(destinationFilter === "all" || destinationFilter === "store") && (
            <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs text-left flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-stone-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-1.5 h-5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        "var(--yume-theme-header-color, " +
                        (darkMode ? "#38bdf8" : currentSlideColor || "#0b2447") +
                        ")",
                    }}
                  />
                  <div className="p-2 rounded-lg bg-stone-50 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 text-stone-700 dark:text-slate-300 shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white tracking-tight font-sans">
                        {isAr ? "1. نطاقات المتجر (For Stores)" : "1. For Stores"}
                      </h3>
                      <span className="text-[10px] font-mono text-stone-700 dark:text-slate-300 font-semibold bg-stone-50 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 px-2 py-0.5 rounded-md">
                        {storeDomains.length} custom
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                      {isAr
                        ? "اربط نطاقاً واحداً أو عدة نطاقات مخصصة بواجهة متجرك الكاملة وجميع أقسامه."
                        : "Connect root domains or subdomains directly to your complete YUME storefront and catalog."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddModal("store")}
                  disabled={isLimitReached}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs text-white ${
                    isLimitReached
                      ? "bg-stone-200 dark:bg-slate-800 text-stone-400 cursor-not-allowed opacity-60"
                      : "hover:brightness-110 active:scale-98"
                  }`}
                  style={{
                    backgroundColor: isLimitReached
                      ? undefined
                      : "var(--yume-theme-header-color, " +
                        (darkMode ? "#2563eb" : currentSlideColor || "#0b2447") +
                        ")",
                  }}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isAr ? "إضافة نطاق للمتجر" : "Add Domain to Store"}</span>
                </button>
              </div>

              <div className="space-y-3">
                {renderDefaultYumeDomainRow("store", <Store className="w-4 h-4" />)}
                {storeDomains.map((record) => renderDomainManagementCard(record))}
              </div>
            </section>
          )}

          {/* CATEGORY 2: FOR PRODUCT PAGES */}
          {(destinationFilter === "all" || destinationFilter === "product") && productDomains.length > 0 && (
            <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs text-left flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-stone-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-1.5 h-5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        "var(--yume-theme-header-color, " +
                        (darkMode ? "#38bdf8" : currentSlideColor || "#0b2447") +
                        ")",
                    }}
                  />
                  <div className="p-2 rounded-lg bg-stone-50 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 text-stone-700 dark:text-slate-300 shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white tracking-tight font-sans">
                        {isAr ? "2. نطاقات صفحات المنتجات (For Product Pages)" : "2. For Product Pages"}
                      </h3>
                      <span className="text-[10px] font-mono text-stone-700 dark:text-slate-300 font-semibold bg-stone-50 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 px-2 py-0.5 rounded-md">
                        {productDomains.length} custom
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                      {isAr
                        ? "وجه نطاقاً مخصصاً ليفتح صفحة منتج محدد فوراً — مثالي لحملات Google وMeta وTikTok الإعلانية."
                        : "Route dedicated custom domains straight to individual product checkout pages for high-converting ad campaigns."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddModal("product")}
                  disabled={isLimitReached}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs text-white ${
                    isLimitReached
                      ? "bg-stone-200 dark:bg-slate-800 text-stone-400 cursor-not-allowed opacity-60"
                      : "hover:brightness-110 active:scale-98"
                  }`}
                  style={{
                    backgroundColor: isLimitReached
                      ? undefined
                      : "var(--yume-theme-header-color, " +
                        (darkMode ? "#2563eb" : currentSlideColor || "#0b2447") +
                        ")",
                  }}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isAr ? "إضافة نطاق لمنتج" : "Add Domain to Product"}</span>
                </button>
              </div>

              <div className="space-y-3">
                {productDomains.map((record) => renderDomainManagementCard(record))}
              </div>
            </section>
          )}

          {/* CATEGORY 3: FOR LANDING PAGES / FUNNELS */}
          {(destinationFilter === "all" || destinationFilter === "landing_page") && landingPageDomains.length > 0 && (
            <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs text-left flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-stone-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-1.5 h-5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        "var(--yume-theme-header-color, " +
                        (darkMode ? "#38bdf8" : currentSlideColor || "#0b2447") +
                        ")",
                    }}
                  />
                  <div className="p-2 rounded-lg bg-stone-50 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 text-stone-700 dark:text-slate-300 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white tracking-tight font-sans">
                        {isAr
                          ? "3. لصفحات الهبوط ومسارات البيع (For Landing Pages / Funnels)"
                          : "3. For Landing Pages / Funnels"}
                      </h3>
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50">
                        {landingPageDomains.length} custom
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                      {isAr
                        ? "احجز واربط نطاقاتك المخصصة لصفحات الهبوط الترويجية القادمة دون الحاجة لإعادة ضبط DNS لاحقاً."
                        : "Pre-connect custom domains for promotional funnels and standalone campaign landing pages."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddModal("landing_page")}
                  disabled={isLimitReached}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs text-white ${
                    isLimitReached
                      ? "bg-stone-200 dark:bg-slate-800 text-stone-400 cursor-not-allowed opacity-60"
                      : "hover:brightness-110 active:scale-98"
                  }`}
                  style={{
                    backgroundColor: isLimitReached
                      ? undefined
                      : "var(--yume-theme-header-color, " +
                        (darkMode ? "#2563eb" : currentSlideColor || "#0b2447") +
                        ")",
                  }}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isAr ? "إضافة نطاق لصفحة هبوط" : "Add Domain to Landing Pages"}</span>
                </button>
              </div>

              <div className="space-y-3">
                {landingPageDomains.map((record) => renderDomainManagementCard(record))}
              </div>
            </section>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* =====================================================================
           UNIFIED TABLE VIEW (ADD PRODUCT CARD SHELL)
           ===================================================================== */
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className="w-1.5 h-5 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    "var(--yume-theme-header-color, " +
                    (darkMode ? "#38bdf8" : currentSlideColor || "#0b2447") +
                    ")",
                }}
              />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white tracking-tight">
                  {isAr ? "سجل جميع النطاقات المتصلة" : "All Connected Custom Domains"}
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                  {isAr
                    ? "عرض شامل لجميع نطاقات المتجر والمنتجات وصفحات الهبوط."
                    : "Showing all Store, Product Page, and Landing Page custom domains matching your filters."}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-stone-600 dark:text-slate-300">
              {filteredDomains.length} {filteredDomains.length === 1 ? "domain" : "domains"}
            </span>
          </div>

          <div className="space-y-3">
            {filteredDomains.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/40 text-center space-y-2">
                <Globe className="w-7 h-7 text-stone-400 mx-auto" />
                <p className="text-xs font-bold text-stone-700 dark:text-slate-300">
                  {isAr ? "لا توجد نطاقات مطابقة للبحث." : "No matching custom domains found."}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  {isAr
                    ? "جرب تغيير كلمات البحث أو أضف نطاقاً مخصصاً جديداً."
                    : "Try clearing your search filters or connect a new custom domain above."}
                </p>
              </div>
            ) : (
              filteredDomains.map((record) => renderDomainManagementCard(record))
            )}
          </div>
        </div>
      ) : null}

      {/* =====================================================================
          DOMAIN TRAFFIC OVERVIEW SECTION (RECHARTS VISITOR TELEMETRY)
         ===================================================================== */}
      {(activeTopCard === "all" || activeTopCard === "traffic") && (
        <section
          id="domain-traffic-overview-section"
          className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-6 animate-fade-in"
        >
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-slate-800">
            <div className="flex items-start sm:items-center gap-3">
              <div
                className="w-1.5 h-6 rounded-full shrink-0 mt-0.5 sm:mt-0"
                style={{
                  backgroundColor:
                    "var(--yume-theme-header-color, " +
                    (darkMode ? "#38bdf8" : currentSlideColor || "#0b2447") +
                    ")",
                }}
              />
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 text-stone-700 dark:text-slate-300 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight">
                    {isAr
                      ? "نظرة عامة على حركة زوار النطاقات (Domain Traffic Overview)"
                      : "Domain Traffic & Visitor Analytics Overview"}
                  </h3>
                </div>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                  {isAr
                    ? "إحصائيات تفاعلية فورية لحركة الزيارات والزبائن الفريدين وحملات الإعلانات لكل نطاق مخصص نشط عبر شبكة YUME Edge."
                    : "Real-time mock visitor stats across each active custom domain, unique shoppers, and ad campaign conversion funnels."}
                </p>
              </div>
            </div>

            {/* Controls Toolbar: Timeframe + Domain Filter + Chart Style */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Daily / Weekly Timeframe Toggle */}
              <div className="flex items-center p-1 rounded-xl bg-stone-100 dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setTrafficTimeframe("daily")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    trafficTimeframe === "daily"
                      ? "bg-white dark:bg-slate-900 text-stone-950 dark:text-white shadow-xs"
                      : "text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {isAr ? "يومي (7 أيام)" : "Daily (7D)"}
                </button>
                <button
                  type="button"
                  onClick={() => setTrafficTimeframe("weekly")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    trafficTimeframe === "weekly"
                      ? "bg-white dark:bg-slate-900 text-stone-950 dark:text-white shadow-xs"
                      : "text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {isAr ? "أسبوعي (4 أسابيع)" : "Weekly (4W)"}
                </button>
              </div>

              {/* Domain Filter Dropdown */}
              <div className="relative">
                <select
                  value={selectedTrafficDomain}
                  onChange={(e) => setSelectedTrafficDomain(e.target.value)}
                  className="appearance-none bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-slate-600 cursor-pointer"
                >
                  <option value="all">
                    {isAr ? "جميع النطاقات النشطة (مجمعة)" : "All Active Domains (Combined)"}
                  </option>
                  {activeCustomDomains.map((dom) => (
                    <option key={dom.domain} value={dom.domain}>
                      {dom.domain} ({dom.destinationType})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Chart Type Toggle (Area vs Bar) */}
              <div className="flex items-center p-1 rounded-xl bg-stone-100 dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setTrafficChartType("area")}
                  title={isAr ? "رسم بياني مساحي انسيابي" : "Smooth Area Chart"}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    trafficChartType === "area"
                      ? "bg-white dark:bg-slate-900 text-stone-950 dark:text-white shadow-xs"
                      : "text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{isAr ? "مساحي" : "Area"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTrafficChartType("bar")}
                  title={isAr ? "أعمدة بيانية مقارنة" : "Comparative Bar Chart"}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    trafficChartType === "bar"
                      ? "bg-white dark:bg-slate-900 text-stone-950 dark:text-white shadow-xs"
                      : "text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>{isAr ? "أعمدة" : "Bar"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Summary Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Visits */}
            <div className="p-4 rounded-xl bg-stone-50/70 dark:bg-slate-800/50 border border-stone-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
                  {isAr ? "إجمالي الزيارات" : "Total Domain Visits"}
                </span>
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black font-mono text-stone-900 dark:text-white tracking-tight">
                  {trafficSummary.totalVisits.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+22.4% {isAr ? "مقارنة بالفترة السابقة" : "vs previous period"}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Unique Shoppers */}
            <div className="p-4 rounded-xl bg-stone-50/70 dark:bg-slate-800/50 border border-stone-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
                  {isAr ? "الزبائن الفريدون" : "Unique Shoppers"}
                </span>
                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black font-mono text-stone-900 dark:text-white tracking-tight">
                  {trafficSummary.uniqueShoppers.toLocaleString()}
                </div>
                <div className="text-[11px] font-medium text-stone-500 dark:text-slate-400 mt-1">
                  {isAr ? "معدل تفاعل المتسوقين 74%" : "74% visitor-to-shopper engagement"}
                </div>
              </div>
            </div>

            {/* Card 3: Ad Campaign Clicks */}
            <div className="p-4 rounded-xl bg-stone-50/70 dark:bg-slate-800/50 border border-stone-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
                  {isAr ? "نقرات حملات الإعلانات" : "Ad Campaign Clicks"}
                </span>
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Megaphone className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black font-mono text-stone-900 dark:text-white tracking-tight">
                  {trafficSummary.adCampaignClicks.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>
                    {trafficSummary.adSharePercent}% {isAr ? "من الزيارات من إعلانات Meta/Google" : "traffic share from Meta/Google ads"}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Edge CDN Cache Efficiency */}
            <div className="p-4 rounded-xl bg-stone-50/70 dark:bg-slate-800/50 border border-stone-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
                  {isAr ? "كفاءة شبكة الكاش Edge CDN" : "Edge CDN Cache Hit"}
                </span>
                <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black font-mono text-stone-900 dark:text-white tracking-tight">
                  {trafficSummary.edgeCacheHitRate}%
                </div>
                <div className="text-[11px] font-medium text-stone-500 dark:text-slate-400 mt-1">
                  {isAr ? "متوسط سرعة الاستجابة ~22ms عالمياً" : "Ultra-fast ~22ms response latency"}
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Canvas Container */}
          <div className="bg-stone-50/50 dark:bg-slate-950/40 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-semibold text-stone-600 dark:text-slate-400">
                  {trafficTimeframe === "daily"
                    ? isAr
                      ? "حركة الزيارات اليومية (آخر 7 أيام - الإثنين إلى الأحد)"
                      : "Daily Traffic Telemetry (Last 7 Days - Mon through Sun)"
                    : isAr
                    ? "حركة الزيارات الأسبوعية (آخر 4 أسابيع)"
                    : "Weekly Traffic Telemetry (Last 4 Weeks - W1 through W4)"}
                </span>
              </div>
              <span className="text-[11px] font-mono font-medium text-stone-400">
                {selectedTrafficDomain === "all"
                  ? isAr
                    ? "عرض كافة النطاقات النشطة"
                    : "Displaying All Connected Domains"
                  : selectedTrafficDomain}
              </span>
            </div>

            <div className="h-[310px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {trafficChartType === "area" ? (
                  <AreaChart
                    data={currentTrafficDataset}
                    margin={{ top: 12, right: 10, left: -20, bottom: 4 }}
                  >
                    <defs>
                      {activeCustomDomains.map((dom, i) => {
                        const clr = DOMAIN_COLOR_PALETTE[i % DOMAIN_COLOR_PALETTE.length];
                        const gradId = `grad_${dom.domain.replace(/[^a-zA-Z0-9]/g, "_")}`;
                        return (
                          <linearGradient key={dom.domain} id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={clr} stopOpacity={0.45} />
                            <stop offset="95%" stopColor={clr} stopOpacity={0.02} />
                          </linearGradient>
                        );
                      })}
                      <linearGradient id="grad_total_visits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0b2447" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0b2447" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={darkMode ? "#334155" : "#e2e8f0"}
                      opacity={0.7}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={darkMode ? "#94a3b8" : "#64748b"}
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={darkMode ? "#94a3b8" : "#64748b"}
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
                    />
                    <Tooltip content={<CustomTrafficTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 8, fontSize: 11 }} />

                    {selectedTrafficDomain === "all" ? (
                      activeCustomDomains.map((dom, i) => {
                        const clr = DOMAIN_COLOR_PALETTE[i % DOMAIN_COLOR_PALETTE.length];
                        const gradId = `grad_${dom.domain.replace(/[^a-zA-Z0-9]/g, "_")}`;
                        return (
                          <Area
                            key={dom.domain}
                            type="monotone"
                            dataKey={dom.domain}
                            name={dom.domain}
                            stroke={clr}
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill={`url(#${gradId})`}
                          />
                        );
                      })
                    ) : (
                      <>
                        <Area
                          type="monotone"
                          dataKey={selectedTrafficDomain}
                          name={selectedTrafficDomain}
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#grad_total_visits)"
                        />
                        <Area
                          type="monotone"
                          dataKey={`${selectedTrafficDomain}_unique`}
                          name={`${selectedTrafficDomain} (Unique)`}
                          stroke="#3b82f6"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          fill="none"
                        />
                      </>
                    )}
                  </AreaChart>
                ) : (
                  <BarChart
                    data={currentTrafficDataset}
                    margin={{ top: 12, right: 10, left: -20, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={darkMode ? "#334155" : "#e2e8f0"}
                      opacity={0.7}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={darkMode ? "#94a3b8" : "#64748b"}
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={darkMode ? "#94a3b8" : "#64748b"}
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
                    />
                    <Tooltip content={<CustomTrafficTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 8, fontSize: 11 }} />

                    {selectedTrafficDomain === "all" ? (
                      activeCustomDomains.map((dom, i) => {
                        const clr = DOMAIN_COLOR_PALETTE[i % DOMAIN_COLOR_PALETTE.length];
                        return (
                          <Bar
                            key={dom.domain}
                            dataKey={dom.domain}
                            name={dom.domain}
                            fill={clr}
                            radius={[4, 4, 0, 0]}
                          />
                        );
                      })
                    ) : (
                      <>
                        <Bar
                          dataKey={selectedTrafficDomain}
                          name={`${selectedTrafficDomain} (Total Visits)`}
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey={`${selectedTrafficDomain}_unique`}
                          name={`${selectedTrafficDomain} (Unique Shoppers)`}
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </>
                    )}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Domains Traffic Breakdown Table */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 dark:text-slate-200 uppercase tracking-wider">
                {isAr ? "تفصيل الزيارات لكل نطاق نشط" : "Per-Domain Traffic Breakdown"}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-slate-400">
                {domainBreakdownStats.length} {isAr ? "نطاقات نشطة قيد الرصد" : "active tracked domains"}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-stone-200/80 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 dark:bg-slate-800/80 border-b border-stone-200/80 dark:border-slate-800 text-[11px] text-stone-500 dark:text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3.5">{isAr ? "النطاق المخصص" : "Custom Domain"}</th>
                    <th className="py-2.5 px-3.5">{isAr ? "الوجهة" : "Destination"}</th>
                    <th className="py-2.5 px-3.5">{isAr ? "زيارات اليوم" : "Today"}</th>
                    <th className="py-2.5 px-3.5">{isAr ? "إجمالي 7 أيام" : "7-Day Total"}</th>
                    <th className="py-2.5 px-3.5">{isAr ? "إجمالي 4 أسابيع" : "4-Week Total"}</th>
                    <th className="py-2.5 px-3.5">{isAr ? "أعلى مصدر حركة" : "Top Referral Source"}</th>
                    <th className="py-2.5 px-3.5 text-right">{isAr ? "إجراء" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/80 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                  {domainBreakdownStats.map((row) => (
                    <tr
                      key={row.domain}
                      className="hover:bg-stone-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: row.color }}
                          />
                          <span className="font-mono font-bold text-stone-900 dark:text-white">
                            {row.domain}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
                          {row.record.destinationType}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-stone-900 dark:text-white">
                        {row.todayVisits.toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-stone-700 dark:text-slate-300">
                        {row.dailyTotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-stone-700 dark:text-slate-300">
                        {row.weeklyTotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 text-stone-600 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3 text-stone-400" />
                          <span>{row.topSource}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTrafficDomain(row.domain)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-stone-700 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          {isAr ? "تصفية الرسم" : "Filter Chart"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          3 STATUS CARDS: SSL SECURITY, EDGE CACHING, DOMAIN READINESS
         ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
        {/* Card 1: SSL Security */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-white font-sans">
                {isAr ? "أمان وتشفير SSL" : "SSL Security"}
              </h4>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isAr ? "نشط وآمن" : "Secure"}</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed font-medium">
            {isAr
              ? "شهادات Let's Encrypt و TLS 1.3 مشفرة ومحدثة تلقائياً لجميع نقاط الحافة ونطاقاتك المخصصة."
              : "Automated Let's Encrypt / Wildcard SSL provisioned for edge points."}
          </p>
        </div>

        {/* Card 2: Edge Caching */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-white font-sans">
                {isAr ? "كاش الحافة الفوري" : "Edge Caching"}
              </h4>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{isAr ? "كاش عالمي نشط" : "Active"}</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed font-medium">
            {isAr
              ? "شبكة Anycast CDN عالمية فائقة السرعة مع تفريغ فوري للكاش عند تعديل المنتجات والمخزون."
              : "Global Cloudflare/Fastly CDN cache active at edge."}
          </p>
        </div>

        {/* Card 3: Domain Readiness */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800/60">
                <Radio className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-white font-sans">
                {isAr ? "جاهزية النطاقات" : "Domain Readiness"}
              </h4>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60">
              <Check className="w-3 h-3 text-sky-600 dark:text-sky-400" />
              <span>{isAr ? "جاهز للاستخدام" : "Ready to Use"}</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed font-medium">
            {isAr
              ? "انتشار DNS نشط في جميع المناطق مع جاهزية تامة لحملات الإعلانات وعزل كامل للمتجر."
              : "DNS propagation active. All edge zones responding."}
          </p>
        </div>
      </div>

      {/* =====================================================================
          SIMPLIFIED EDGE RESOLUTION TESTER WITH EXPANDABLE TECHNICAL DETAILS
         ===================================================================== */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-5 text-left animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-1.5 h-5 rounded-full shrink-0"
              style={{
                backgroundColor:
                  "var(--yume-theme-header-color, " +
                  (darkMode ? "#38bdf8" : currentSlideColor || "#0b2447") +
                  ")",
              }}
            />
            <div className="p-2 rounded-lg bg-stone-50 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 text-stone-700 dark:text-slate-300 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white tracking-tight">
                  {isAr
                    ? "فاحص توجيه النطاقات (Edge Resolution Tester)"
                    : "Edge Resolution Tester"}
                </h3>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? "اختبر كيفية توجيه أي نطاق متصل إلى متجرك أو صفحات المنتجات بسهولة وبدون تعقيد تقني."
                  : "Verify that custom domains instantly route shoppers to your storefront, product page, or landing page."}
              </p>
            </div>
          </div>

          {/* Human-Friendly Status Indicator Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {resolverLoading ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{isAr ? "جاري الفحص..." : "Checking"}</span>
              </span>
            ) : resolverResult?.matched ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? "متصل وموجه بنجاح" : "Connected"}</span>
              </span>
            ) : resolverResult && !resolverResult.matched ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>{isAr ? "يحتاج إلى مراجعة DNS" : "Needs Attention"}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{isAr ? "جاهز للاختبار" : "Ready"}</span>
              </span>
            )}
          </div>
        </div>

        {/* Input Bar & Test Button */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 flex items-center bg-[#f8fafc] dark:bg-slate-950 border border-[#cbd5e1] dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-slate-800 rounded-[8px] px-3.5 py-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="text-xs font-mono text-stone-400 select-none mr-1.5">https://</span>
            <input
              type="text"
              value={resolverTestHost}
              onChange={(e) => setResolverTestHost(e.target.value)}
              placeholder={domains[0]?.domain || `www.${storeSlug}.com`}
              className="w-full py-2 text-xs font-mono font-bold bg-transparent text-stone-900 dark:text-white outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => handleTestDomainResolution()}
            disabled={resolverLoading}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-xs transition-all hover:brightness-110 active:scale-98"
            style={{
              backgroundColor:
                "var(--yume-theme-header-color, " +
                (darkMode ? "#2563eb" : currentSlideColor || "#0b2447") +
                ")",
            }}
          >
            {resolverLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span>{isAr ? "اختبار التوجيه" : "Test Route"}</span>
          </button>
        </div>

        {/* Quick Test Domain Chips */}
        {domains.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] font-bold text-stone-500 dark:text-slate-400">
              {isAr ? "نطاقات متصلة للاختبار السريع:" : "Quick Test Domains:"}
            </span>
            {domains.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => handleTestDomainResolution(d.domain)}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-stone-200/80 dark:border-slate-700 font-mono font-bold text-[11px] text-stone-800 dark:text-slate-200 cursor-pointer transition-colors"
              >
                {d.domain}
              </button>
            ))}
          </div>
        )}

        {/* Resolution Results Card */}
        {resolverResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-3 ${
              resolverResult.matched
                ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/40 text-stone-900 dark:text-white"
                : "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/40 text-rose-900 dark:text-rose-200"
            }`}
          >
            {resolverResult.matched ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-800/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">
                      https://{resolverResult.routing?.hostname}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                      Connected &amp; Routed
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500 dark:text-slate-400">
                    Response: {resolverResult.latencyMs}ms · CDN {resolverResult.cache}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-stone-200/60 dark:border-slate-800">
                    <span className="text-[10.5px] text-stone-500 dark:text-slate-400 block font-medium">
                      Store
                    </span>
                    <strong className="text-stone-900 dark:text-white text-xs">
                      {resolverResult.routing?.storeName}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-stone-200/60 dark:border-slate-800">
                    <span className="text-[10.5px] text-stone-500 dark:text-slate-400 block font-medium">
                      Category
                    </span>
                    <strong className="text-stone-900 dark:text-white text-xs uppercase">
                      {resolverResult.routing?.destinationType === "store"
                        ? "Storefront"
                        : resolverResult.routing?.destinationType === "product"
                        ? "Product Page"
                        : "Landing Page"}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-stone-200/60 dark:border-slate-800">
                    <span className="text-[10.5px] text-stone-500 dark:text-slate-400 block font-medium">
                      Destination Target
                    </span>
                    <strong className="text-stone-900 dark:text-white text-xs truncate block">
                      {resolverResult.routing?.destinationLabel}
                    </strong>
                  </div>
                </div>

                {/* Collapsible Accordion for Advanced Technical Details */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTechDetails((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>{showTechDetails ? "Hide Technical Diagnostics" : "View Technical Diagnostics"}</span>
                    {showTechDetails ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {showTechDetails && (
                    <div className="mt-2.5 p-3 rounded-xl bg-stone-950 text-stone-200 font-mono text-[11px] space-y-1.5 border border-stone-800 animate-fade-in">
                      <div className="flex justify-between border-b border-stone-800 pb-1">
                        <span className="text-stone-400">EDGE_CACHE_STATUS:</span>
                        <span className="text-emerald-400 font-bold">{resolverResult.cache}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-800 pb-1">
                        <span className="text-stone-400">EDGE_LATENCY:</span>
                        <span className="text-emerald-400 font-bold">{resolverResult.latencyMs} ms</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-800 pb-1">
                        <span className="text-stone-400">TENANT_ISOLATION_KEY:</span>
                        <span className="text-stone-300">{resolverResult.routing?.merchantId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">ROUTER_GATEWAY:</span>
                        <span className="text-stone-300">yume-edge-algiers-01 (Anycast TLS 1.3)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span className="font-bold text-xs sm:text-sm">
                    {resolverResult.error || "Domain could not be resolved to an active YUME route."}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-slate-300">
                  {isAr
                    ? "تأكد من إضافة سجلات A و CNAME بشكل صحيح في لوحة تحكم مزود النطاق، والانتظار حتى اكتمال انتشار DNS."
                    : "Ensure your DNS A (@ -> 34.8.13.31) and CNAME (www -> rie.ayorstore.com) records are configured at your domain registrar."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL 1: CLEAN MINIMAL "ADDING YOUR CUSTOM DOMAIN" MODAL (FULLY OPAQUE WHITE)
         ===================================================================== */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-[1200] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative z-20"
            style={{
              backgroundColor: darkMode ? "#0f172a" : "#ffffff",
              opacity: 1,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            }}
          >
            {/* Modal Header */}
            <div
              className="px-6 py-4 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between"
              style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
            >
              <h3 className="text-base font-bold text-stone-900 dark:text-white tracking-tight">
                {editingDomainId
                  ? isAr
                    ? "تعديل النطاق المخصص"
                    : "Edit Your Custom Domain"
                  : isAr
                  ? "إضافة نطاقك المخصص"
                  : "Adding Your Custom Domain"}
              </h3>
              <button
                type="button"
                onClick={() => setIsSetupModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400 hover:text-stone-700 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              onSubmit={handleConnectDomainSubmit}
              className="p-6 space-y-4"
              style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
            >
              {/* Destination Selection Menu */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>{isAr ? "الوجهة" : "Destination"}</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedDestType}
                    onChange={(e) => setSelectedDestType(e.target.value as DomainDestinationType)}
                    className="w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-700 focus:border-[#5051F9] dark:focus:border-indigo-400 text-stone-900 dark:text-white outline-none cursor-pointer appearance-none pr-9 shadow-2xs transition-colors"
                    style={{ backgroundColor: darkMode ? "#020617" : "#ffffff" }}
                  >
                    <option value="store">{isAr ? "المتجر (Store)" : "Store"}</option>
                    <option value="product">{isAr ? "صفحة منتج (Product Page)" : "Product Page"}</option>
                    <option value="landing_page">{isAr ? "صفحة هبوط (Landing Page)" : "Landing Page"}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {/* If Product Destination: Select Product Selection Menu */}
                {selectedDestType === "product" && (
                  <div className="pt-1.5 space-y-1 animate-fade-in">
                    <label className="text-[11px] font-semibold text-stone-600 dark:text-slate-300">
                      {isAr ? "اختر المنتج:" : "Select Product:"}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-stone-900 dark:text-white outline-none cursor-pointer appearance-none pr-9 focus:border-[#5051F9] shadow-2xs"
                        style={{ backgroundColor: darkMode ? "#020617" : "#ffffff" }}
                      >
                        {filteredStoreProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.price.toLocaleString()} DZD)
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-400">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* If Landing Page Destination: Funnel Identifier Slot */}
                {selectedDestType === "landing_page" && (
                  <div className="pt-1.5 space-y-1 animate-fade-in">
                    <label className="text-[11px] font-semibold text-stone-600 dark:text-slate-300 flex items-center justify-between">
                      <span>{isAr ? "معرف صفحة الهبوط:" : "Landing Page Identifier / Funnel:"}</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">Future-Ready</span>
                    </label>
                    <input
                      type="text"
                      value={landingPageDraftSlug}
                      onChange={(e) => setLandingPageDraftSlug(e.target.value)}
                      placeholder="e.g. summer-sale-funnel"
                      className="w-full px-3.5 py-2 rounded-lg text-xs font-mono bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-stone-900 dark:text-white outline-none focus:border-[#5051F9] shadow-2xs"
                      style={{ backgroundColor: darkMode ? "#020617" : "#ffffff" }}
                    />
                  </div>
                )}
              </div>

              {/* CNAME Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold font-mono text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="text-stone-400 font-mono">(x)</span>
                  <span>CNAME</span>
                </label>
                <div
                  className="flex items-center justify-between border border-stone-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 shadow-2xs"
                  style={{ backgroundColor: darkMode ? "#020617" : "#ffffff" }}
                >
                  <span className="font-mono text-xs text-stone-800 dark:text-slate-200 select-all truncate">
                    {activeModalDns.cnameTarget}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText("modal-cname", activeModalDns.cnameTarget)}
                    className="pl-3 border-l border-stone-200 dark:border-slate-700 text-xs font-semibold text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedKey === "modal-cname" ? (
                      <>
                        <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      </>
                    ) : (
                      <>
                        <span>{isAr ? "نسخ" : "Copy"}</span>
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* A RECORD Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold font-mono text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-stone-500" />
                  <span>A RECORD</span>
                </label>
                <div
                  className="flex items-center justify-between border border-stone-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 shadow-2xs"
                  style={{ backgroundColor: darkMode ? "#020617" : "#ffffff" }}
                >
                  <span className="font-mono text-xs text-stone-800 dark:text-slate-200 select-all">
                    {activeModalDns.aRecordIp}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText("modal-arecord", activeModalDns.aRecordIp)}
                    className="pl-3 border-l border-stone-200 dark:border-slate-700 text-xs font-semibold text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedKey === "modal-arecord" ? (
                      <>
                        <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      </>
                    ) : (
                      <>
                        <span>{isAr ? "نسخ" : "Copy"}</span>
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Your Custom Domain Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-stone-500" />
                  <span>{isAr ? "نطاقك المخصص" : "Your Custom Domain"}</span>
                </label>
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => {
                    setDomainInput(e.target.value);
                    setDomainInputError("");
                  }}
                  placeholder="subdomain.example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg text-xs font-mono border border-stone-200 dark:border-slate-700 focus:border-[#5051F9] dark:focus:border-indigo-400 text-stone-900 dark:text-white outline-none transition-colors shadow-2xs"
                  style={{ backgroundColor: darkMode ? "#020617" : "#ffffff" }}
                  autoFocus
                />
                {domainInputError && (
                  <p className="text-[11px] font-bold text-rose-500 pt-0.5 flex items-center gap-1.5 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{domainInputError}</span>
                  </p>
                )}
              </div>

              {/* How to Add a Custom Domain Helper Link */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsHowToGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5051F9] dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>
                    {isAr
                      ? "كيف أضيف نطاقاً مخصصاً إلى متجري؟"
                      : "How to Add a Custom Domain to my Store?"}
                  </span>
                </button>
              </div>

              {/* Modal Actions: Cancel + Connect */}
              <div
                className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-100 dark:border-slate-800"
                style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
              >
                <button
                  type="button"
                  onClick={() => setIsSetupModalOpen(false)}
                  className="px-5 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-[#5051F9] dark:text-indigo-400 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-[#5051F9] hover:bg-[#4344e6] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {editingDomainId
                      ? isAr
                        ? "حفظ التعديلات"
                        : "Save Changes"
                      : isAr
                      ? "ربط النطاق"
                      : "Connect"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: UNIVERSAL 5-STEP "HOW TO ADD A CUSTOM DOMAIN" GUIDE
         ===================================================================== */}
      {isHowToGuideOpen && (
        <div className="fixed inset-0 z-[1250] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] relative z-20"
            style={{
              backgroundColor: darkMode ? "#0f172a" : "#ffffff",
              opacity: 1,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div
              className="p-5 sm:p-6 border-b border-stone-200/80 dark:border-slate-800 flex items-center justify-between"
              style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-1.5 h-5 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      "var(--yume-theme-header-color, " +
                      (darkMode ? "#38bdf8" : currentSlideColor || "#0b2447") +
                      ")",
                  }}
                />
                <div className="p-2 rounded-lg bg-stone-50 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 text-stone-700 dark:text-slate-300 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white tracking-tight font-sans">
                    {isAr
                      ? "دليل ربط النطاق المخصص بمتجرك (خطوة بخطوة)"
                      : "How to Add a Custom Domain to Your YUME Store"}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400">
                    {isAr
                      ? "5 خطوات واضحة ومباشرة بدون تعقيد تقني لجميع مزودي النطاقات."
                      : "Universal 5-step guide for GoDaddy, Namecheap, Cloudflare, Hostinger, or any provider."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHowToGuideOpen(false)}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="p-6 overflow-y-auto space-y-4 text-xs"
              style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
            >
              {/* Universal Provider Compatibility Callout */}
              <div
                className="p-3.5 rounded-xl border border-stone-200/80 dark:border-slate-800 flex items-start gap-2.5"
                style={{ backgroundColor: darkMode ? "#020617" : "#ffffff" }}
              >
                <Globe className="w-4 h-4 text-stone-600 dark:text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11.5px] leading-relaxed text-stone-600 dark:text-slate-300 font-medium">
                  <strong className="text-stone-900 dark:text-white">Universal Registrar Setup:</strong>{" "}
                  {isAr
                    ? "هذه الخطوات تنطبق تماماً على جميع مسجلي النطاقات مثل Cloudflare و Namecheap و GoDaddy و Hostinger و Google Domains و Route 53 وغيرها."
                    : "This exact procedure works with GoDaddy, Namecheap, Cloudflare, Hostinger, Google Domains, Route 53, OVH, Porkbun, and all standard domain providers."}
                </p>
              </div>

              {/* 5 Numbered Steps */}
              <div className="space-y-3">
                {/* Step 1 */}
                <div
                  className="p-4 rounded-xl border border-stone-200/90 dark:border-slate-800 shadow-2xs space-y-1.5"
                  style={{ backgroundColor: darkMode ? "#020617" : "#ffffff" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        backgroundColor:
                          "var(--yume-theme-header-color, " +
                          (darkMode ? "#2563eb" : (currentSlideColor || "#0b2447")) +
                          ")",
                      }}
                      className="w-5 h-5 rounded-full text-white font-bold font-mono text-[11px] inline-flex items-center justify-center shrink-0 shadow-2xs"
                    >
                      1
                    </span>
                    <span className="font-bold text-stone-900 dark:text-white">
                      {isAr ? "اختر النطاق والوجهة المرغوبة" : "Choose Your Custom Domain & Target"}
                    </span>
                  </div>
                  <p className="text-stone-600 dark:text-slate-300 leading-relaxed text-[11.5px] pl-7">
                    {isAr
                      ? "قرر ما إذا كنت تريد ربط نطاقك الرئيسي (مثل mystore.com) أو نطاق فرعي (مثل shop.mystore.com) بمتجرك الكامل، أو بصفحة منتج محدد، أو بصفحة هبوط تسويقية."
                      : "Decide whether you want to point your root domain (e.g. mystore.com) or a subdomain (e.g. shop.mystore.com) to your complete Storefront, an individual Product Page, or a promotional Landing Page."}
                  </p>
                </div>

                {/* Step 2 */}
                <div
                  className="p-4 rounded-xl border border-stone-200/90 dark:border-slate-800 shadow-2xs space-y-1.5"
                  style={{ backgroundColor: darkMode ? "#020617" : "#ffffff" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        backgroundColor:
                          "var(--yume-theme-header-color, " +
                          (darkMode ? "#2563eb" : (currentSlideColor || "#0b2447")) +
                          ")",
                      }}
                      className="w-5 h-5 rounded-full text-white font-bold font-mono text-[11px] inline-flex items-center justify-center shrink-0 shadow-2xs"
                    >
                      2
                    </span>
                    <span className="font-bold text-stone-900 dark:text-white">
                      {isAr ? "افتح إعدادات DNS لدى مسجل نطاقك" : "Open DNS Management at Your Domain Registrar"}
                    </span>
                  </div>
                  <p className="text-stone-600 dark:text-slate-300 leading-relaxed text-[11.5px] pl-7">
                    {isAr
                      ? "سجل الدخول إلى حسابك لدى الشركة التي اشتريت منها النطاق، واختر النطاق المطلوب، ثم توجه إلى صفحة إدارة سجلات DNS (DNS Records أو Manage DNS أو Zone Editor)."
                      : "Log in to your domain registrar account, click on your domain, and navigate to the DNS Records, Zone Editor, or DNS Management tab."}
                  </p>
                </div>

                {/* Step 3 */}
                <div
                  className="p-4 rounded-xl border border-stone-200/90 dark:border-slate-800 shadow-2xs space-y-2"
                  style={{ backgroundColor: darkMode ? "#020617" : "#ffffff" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        backgroundColor:
                          "var(--yume-theme-header-color, " +
                          (darkMode ? "#2563eb" : (currentSlideColor || "#0b2447")) +
                          ")",
                      }}
                      className="w-5 h-5 rounded-full text-white font-bold font-mono text-[11px] inline-flex items-center justify-center shrink-0 shadow-2xs"
                    >
                      3
                    </span>
                    <span className="font-bold text-stone-900 dark:text-white">
                      {isAr ? "أضف سجلي CNAME و A المطلوبين" : "Add the Required CNAME & A Records"}
                    </span>
                  </div>
                  <p className="text-stone-600 dark:text-slate-300 leading-relaxed text-[11.5px] pl-7">
                    {isAr
                      ? "أضف السجلين التاليين في جدول DNS لتوجيه الزوار بأمان إلى شبكة YUME العالمية:"
                      : "Add these two records in your registrar's DNS table so both your subdomain and root domain point securely to YUME:"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 font-mono pl-7">
                    <div
                      className="p-3 rounded-xl border border-stone-200/90 dark:border-slate-800 flex items-center justify-between gap-2"
                      style={{ backgroundColor: darkMode ? "#0f172a" : "#f8fafc" }}
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] text-stone-400 block font-sans">
                          CNAME Record (Host: www or shop)
                        </span>
                        <strong className="text-stone-900 dark:text-white text-xs truncate block">
                          {categoryDnsConfig.store.cnameTarget}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText("guide-cname", categoryDnsConfig.store.cnameTarget)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white shrink-0 cursor-pointer text-[10.5px] font-sans font-bold flex items-center gap-1 shadow-2xs"
                      >
                        {copiedKey === "guide-cname" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey === "guide-cname" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>

                    <div
                      className="p-3 rounded-xl border border-stone-200/90 dark:border-slate-800 flex items-center justify-between gap-2"
                      style={{ backgroundColor: darkMode ? "#0f172a" : "#f8fafc" }}
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] text-stone-400 block font-sans">
                          A Record (Host: @ / Root)
                        </span>
                        <strong className="text-stone-900 dark:text-white text-xs truncate block">
                          {categoryDnsConfig.store.aRecordIp}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText("guide-arecord", categoryDnsConfig.store.aRecordIp)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white shrink-0 cursor-pointer text-[10.5px] font-sans font-bold flex items-center gap-1 shadow-2xs"
                      >
                        {copiedKey === "guide-arecord" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey === "guide-arecord" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div
                  className="p-4 rounded-xl border border-stone-200/90 dark:border-slate-800 shadow-2xs space-y-1.5"
                  style={{ backgroundColor: darkMode ? "#020617" : "#ffffff" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        backgroundColor:
                          "var(--yume-theme-header-color, " +
                          (darkMode ? "#2563eb" : (currentSlideColor || "#0b2447")) +
                          ")",
                      }}
                      className="w-5 h-5 rounded-full text-white font-bold font-mono text-[11px] inline-flex items-center justify-center shrink-0 shadow-2xs"
                    >
                      4
                    </span>
                    <span className="font-bold text-stone-900 dark:text-white">
                      {isAr ? "ارجع إلى YUME واضغط على 'ربط النطاق'" : "Return to YUME & Enter Domain"}
                    </span>
                  </div>
                  <p className="text-stone-600 dark:text-slate-300 leading-relaxed text-[11.5px] pl-7">
                    {isAr
                      ? "افتح نافذة ربط النطاق في لوحة تحكم YUME، وأدخل اسم نطاقك في الحقل، ثم اضغط على زر 'Connect'."
                      : "In the YUME Merchant Space 'Add Domain' modal, type your custom domain into the input field and click Connect."}
                  </p>
                </div>

                {/* Step 5 */}
                <div
                  className="p-4 rounded-xl border border-stone-200/90 dark:border-slate-800 shadow-2xs space-y-1.5"
                  style={{ backgroundColor: darkMode ? "#020617" : "#ffffff" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold font-mono text-[11px] inline-flex items-center justify-center shrink-0">
                      5
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {isAr ? "التحقق التلقائي وتفعيل شهادة SSL المجانية" : "Automatic Verification & Free SSL Provisioning"}
                    </span>
                  </div>
                  <p className="text-stone-600 dark:text-slate-300 leading-relaxed text-[11.5px] pl-7">
                    {isAr
                      ? "يقوم نظام YUME بالتحقق التلقائي من السجلات وإصدار شهادة Let's Encrypt TLS 1.3 مجانية وتفعيل كاش الحافة. يستغرق انتشار DNS العالمي من 5 إلى 30 دقيقة."
                      : "YUME automatically verifies your ownership, provisions a free Let's Encrypt TLS 1.3 certificate, and activates global CDN edge routing. Full global propagation typically completes within 5 to 30 minutes."}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="p-4 border-t border-stone-200/80 dark:border-slate-800 flex justify-end"
              style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
            >
              <button
                type="button"
                onClick={() => setIsHowToGuideOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#5051F9] hover:bg-[#4344e6] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer shadow-2xs transition-all"
              >
                {isAr ? "فهمت الخطوات، شكراً" : "Got It, Thanks"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: EDIT DNS RECORDS (A, CNAME, TXT) & CHECK VERIFICATION STATUS
         ===================================================================== */}
      {inspectingDomain && (
        <div className="fixed inset-0 z-[1200] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh] relative z-20"
            style={{
              backgroundColor: darkMode ? "#0f172a" : "#ffffff",
              opacity: 1,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            }}
          >
            {/* Modal Header */}
            <div
              className="p-5 sm:p-6 border-b border-stone-200/80 dark:border-slate-800 flex items-center justify-between gap-4"
              style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-1.5 h-5 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      "var(--yume-theme-header-color, " +
                      (darkMode ? "#38bdf8" : currentSlideColor || "#0b2447") +
                      ")",
                  }}
                />
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 text-stone-700 dark:text-slate-300 shrink-0">
                  <Server className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight font-sans">
                      {isAr ? "تعديل سجلات DNS والتحقق" : "Edit DNS Records"}
                    </h3>
                    <span className="font-mono font-bold text-xs text-stone-700 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 px-2.5 py-0.5 rounded-md truncate">
                      {inspectingDomain.domain}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? "سجلات DNS المطلوبة (A و CNAME و TXT) للتحقق من ملكية النطاق وتفعيل التوجيه."
                      : "Required A, CNAME, and TXT records for domain ownership verification and edge routing."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingDomain(null)}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-500 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div
              className="p-6 overflow-y-auto space-y-5 flex-1"
              style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
            >
              {/* Verification Status & "Check Status" Action Bar */}
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-stone-200/80 dark:border-slate-800"
                style={{ backgroundColor: darkMode ? "#020617" : "#ffffff" }}
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                    {isAr ? "حالة التحقق والاتصال الحالية" : "Current Verification & SSL Status"}
                  </span>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {renderConnectionStatusIndicator(inspectingDomain.connectionStatus)}
                    <span className="text-stone-300 dark:text-slate-700">•</span>
                    <span className="text-xs font-mono text-stone-700 dark:text-slate-300">
                      {inspectingDomain.sslStatus === "active"
                        ? "SSL Active (TLS 1.3)"
                        : "SSL Pending Verification"}
                    </span>
                    {inspectingDomain.lastCheckedAt && (
                      <>
                        <span className="text-stone-300 dark:text-slate-700">•</span>
                        <span className="text-[11px] text-stone-400 font-mono">
                          Checked {new Date(inspectingDomain.lastCheckedAt).toLocaleTimeString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Primary "Check Status" Button to Re-trigger Verification */}
                  <button
                    type="button"
                    onClick={() => handleVerifyDomain(inspectingDomain.id, "success")}
                    disabled={actionBusyId === inspectingDomain.id}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        actionBusyId === inspectingDomain.id ? "animate-spin" : ""
                      }`}
                    />
                    <span>{isAr ? "فحص الحالة (Check Status)" : "Check Status"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVerifyDomain(inspectingDomain.id, "pending")}
                    disabled={actionBusyId === inspectingDomain.id}
                    className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50 font-semibold text-xs cursor-pointer transition-colors"
                    title="Set domain status to Pending verification"
                  >
                    {isAr ? "محاكاة Pending" : "Set Pending"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePurgeDomainCache(inspectingDomain.id)}
                    disabled={actionBusyId === inspectingDomain.id}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
                  >
                    {isAr ? "تحديث الكاش" : "Purge Cache"}
                  </button>
                </div>
              </div>

              {/* Modal Status Feedback Banner */}
              {dnsModalNotice && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
                    dnsModalNotice.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300"
                      : dnsModalNotice.type === "error"
                      ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300"
                      : "bg-stone-100 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{dnsModalNotice.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDnsModalNotice(null)}
                    className="text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Specific DNS Records (A, CNAME, TXT) Required for Verification */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-200/80 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-black font-mono text-stone-900 dark:text-slate-100">
                      {isAr
                        ? "سجلات DNS المطلوبة للتحقق (A, CNAME, TXT)"
                        : "Required DNS Records for Verification (A, CNAME, TXT)"}
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                      {isAr
                        ? "انسخ هذه القيم إلى مزود النطاق الخاص بك أو قم بتعديل المضيف/القيمة/TTL أدناه."
                        : "Copy these records into your domain registrar's DNS settings or edit the Host, Value, and TTL below."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const defaults = buildCompleteDnsRecordsForDomain({
                        ...inspectingDomain,
                        dnsRecords: [],
                      });
                      setEditableDnsRecords(defaults);
                      setDnsModalNotice({
                        type: "info",
                        text: isAr
                          ? "تمت استعادة قيم DNS الافتراضية الموصى بها."
                          : "Reset A, CNAME, and TXT fields to recommended YUME defaults.",
                      });
                    }}
                    className="text-[11px] font-semibold text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isAr ? "استعادة القيم الافتراضية" : "Reset to Defaults"}</span>
                  </button>
                </div>

                {editableDnsRecords.map((rec, idx) => (
                  <div
                    key={`${rec.type}-${idx}`}
                    className="p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 space-y-3"
                    style={{ backgroundColor: darkMode ? "#020617" : "#ffffff" }}
                  >
                    {/* Record Type Header & Verification Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-md bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-mono font-bold tracking-wide">
                          {rec.type} RECORD
                        </span>
                        <span className="text-xs font-semibold text-stone-600 dark:text-slate-300">
                          {rec.purpose}
                        </span>
                      </div>
                      {renderVerificationBadge(rec.verified)}
                    </div>

                    {/* Editable Host, Value, and TTL Fields with One-Click Copy */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs font-mono">
                      {/* Host / Name */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-stone-500 dark:text-slate-400 block">
                          HOST / NAME
                        </label>
                        <div
                          className="flex items-center rounded-[8px] border border-[#cbd5e1] dark:border-slate-800 focus-within:border-[#5051F9] px-2.5 py-2 shadow-2xs"
                          style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
                        >
                          <input
                            type="text"
                            value={rec.host}
                            onChange={(e) =>
                              handleUpdateEditableDnsRecord(idx, "host", e.target.value)
                            }
                            className="w-full font-bold text-stone-900 dark:text-white bg-transparent outline-none text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleCopyText(`dns-host-${idx}`, rec.host)}
                            className="text-stone-400 hover:text-stone-800 dark:hover:text-white pl-1.5 shrink-0 cursor-pointer"
                            title="Copy Host"
                          >
                            {copiedKey === `dns-host-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Value / Points To */}
                      <div className="sm:col-span-7 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-stone-500 dark:text-slate-400 block">
                          VALUE / POINTS TO ({rec.type})
                        </label>
                        <div
                          className="flex items-center rounded-[8px] border border-[#cbd5e1] dark:border-slate-800 focus-within:border-[#5051F9] px-3 py-2 gap-2 shadow-2xs"
                          style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
                        >
                          <input
                            type="text"
                            value={rec.value}
                            onChange={(e) =>
                              handleUpdateEditableDnsRecord(idx, "value", e.target.value)
                            }
                            className="w-full font-bold text-stone-900 dark:text-white bg-transparent outline-none text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleCopyText(`dns-val-${idx}`, rec.value)}
                            className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 font-sans font-semibold text-[11px] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                            title="Copy Value"
                          >
                            {copiedKey === `dns-val-${idx}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* TTL */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-stone-500 dark:text-slate-400 block">
                          TTL (SEC)
                        </label>
                        <select
                          value={rec.ttl || 300}
                          onChange={(e) =>
                            handleUpdateEditableDnsRecord(idx, "ttl", Number(e.target.value))
                          }
                          className="w-full rounded-[8px] border border-[#cbd5e1] dark:border-slate-800 px-2.5 py-2 font-bold text-stone-900 dark:text-white outline-none text-xs cursor-pointer shadow-2xs"
                          style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
                        >
                          <option value={300}>300s (Auto)</option>
                          <option value={600}>600s</option>
                          <option value={1800}>1800s</option>
                          <option value={3600}>3600s (1h)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer with "Check Status", "Save DNS Records", and "Close" */}
            <div
              className="p-4 sm:p-5 border-t border-stone-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3"
              style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
            >
              <button
                type="button"
                onClick={() => handleVerifyDomain(inspectingDomain.id, "success")}
                disabled={actionBusyId === inspectingDomain.id}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-2 cursor-pointer shadow-2xs transition-all"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    actionBusyId === inspectingDomain.id ? "animate-spin" : ""
                  }`}
                />
                <span>{isAr ? "فحص الحالة (Check Status)" : "Check Status"}</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setInspectingDomain(null)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 font-semibold text-xs cursor-pointer hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? "إغلاق" : "Close"}
                </button>
                <button
                  type="button"
                  onClick={handleSaveDnsRecords}
                  disabled={actionBusyId === inspectingDomain.id}
                  className="px-5 py-2.5 rounded-xl bg-[#5051F9] hover:bg-[#4344e6] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAr ? "حفظ سجلات DNS" : "Save DNS Records"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: ADVERTISING & MARKETING CAMPAIGN URL BUILDER
         ===================================================================== */}
      {campaignModalDomain && (
        <div className="fixed inset-0 z-[1200] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col relative z-20"
            style={{
              backgroundColor: darkMode ? "#0f172a" : "#ffffff",
              opacity: 1,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div
              className="p-5 sm:p-6 border-b border-stone-200/80 dark:border-slate-800 flex items-center justify-between"
              style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-1.5 h-5 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      "var(--yume-theme-header-color, " +
                      (darkMode ? "#38bdf8" : currentSlideColor || "#0b2447") +
                      ")",
                  }}
                />
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/50 text-rose-600 dark:text-rose-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white">
                    Ad Campaign URLs &amp; Pixel Tracking
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400 font-mono">
                    https://{campaignModalDomain.domain} → {campaignModalDomain.destinationLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCampaignModalDomain(null)}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="p-6 space-y-4"
              style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
            >
              <div>
                <label className="block text-xs font-black font-mono text-stone-900 dark:text-slate-100 mb-2">
                  Select External Advertising Platform
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "Google Ads", source: "google", medium: "cpc" },
                    { name: "Facebook Ads", source: "facebook", medium: "paid_social" },
                    { name: "Instagram Ads", source: "instagram", medium: "paid_social" },
                    { name: "YouTube Ads", source: "youtube", medium: "video_cpc" },
                    { name: "TikTok Ads", source: "tiktok", medium: "paid_social" },
                  ].map((net) => (
                    <button
                      key={net.name}
                      type="button"
                      onClick={() => setSelectedAdNetwork(net.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                        selectedAdNetwork === net.name
                          ? "bg-[#5051F9] text-white border-[#5051F9] dark:bg-indigo-600 dark:text-white dark:border-indigo-600 shadow-2xs"
                          : "bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-stone-200/80 dark:border-slate-700 hover:border-stone-400"
                      }`}
                    >
                      {net.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black font-mono text-stone-900 dark:text-slate-100 mb-1.5">
                  Campaign Name (utm_campaign)
                </label>
                <input
                  type="text"
                  value={utmCampaignName}
                  onChange={(e) => setUtmCampaignName(e.target.value)}
                  className="w-full p-2.5 rounded-[8px] text-xs font-mono font-bold border border-[#cbd5e1] dark:border-slate-800 focus:border-[#5051F9] text-stone-900 dark:text-white outline-none shadow-2xs"
                  style={{ backgroundColor: darkMode ? "#020617" : "#ffffff" }}
                />
              </div>

              {(() => {
                const sourceMap: Record<string, { s: string; m: string }> = {
                  "Google Ads": { s: "google", m: "cpc" },
                  "Facebook Ads": { s: "facebook", m: "paid_social" },
                  "Instagram Ads": { s: "instagram", m: "paid_social" },
                  "YouTube Ads": { s: "youtube", m: "video_cpc" },
                  "TikTok Ads": { s: "tiktok", m: "paid_social" },
                };
                const sm = sourceMap[selectedAdNetwork] || { s: "google", m: "cpc" };
                const generatedUrl = `https://${campaignModalDomain.domain}/?utm_source=${
                  sm.s
                }&utm_medium=${sm.m}&utm_campaign=${encodeURIComponent(
                  utmCampaignName || "campaign"
                )}`;

                return (
                  <div className="p-4 rounded-xl bg-stone-950 text-emerald-400 font-mono text-xs space-y-2 border border-stone-800">
                    <div className="flex items-center justify-between text-[10px] text-stone-400">
                      <span>CAMPAIGN DESTINATION URL ({selectedAdNetwork.toUpperCase()})</span>
                      <span className="text-emerald-400">✓ PIXEL &amp; CONVERSION READY</span>
                    </div>
                    <div className="break-all text-white font-bold">{generatedUrl}</div>
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleCopyText("campaign-url", generatedUrl)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {copiedKey === "campaign-url" ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied Campaign Link!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Campaign URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div
              className="p-4 border-t border-stone-200/80 dark:border-slate-800 flex justify-end"
              style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
            >
              <button
                type="button"
                onClick={() => setCampaignModalDomain(null)}
                className="px-5 py-2 rounded-xl bg-[#5051F9] hover:bg-[#4344e6] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer shadow-2xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantDomainManager;
