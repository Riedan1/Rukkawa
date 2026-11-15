import React, { useState, useMemo, useEffect } from "react";
import { 
  Sparkles, 
  Layers, 
  Share2, 
  Plus, 
  Sliders, 
  BarChart3, 
  Link2, 
  ExternalLink, 
  Eye, 
  Edit3, 
  CheckCircle2, 
  TrendingUp, 
  Copy, 
  Clock, 
  ShieldCheck, 
  ChevronDown,
  ArrowLeft,
  Search,
  Filter,
  Users,
  ShoppingCart,
  DollarSign,
  Play,
  Pause,
  ArrowUpRight,
  Trash2,
  AlertTriangle,
  FileText,
  Tag,
  Check,
  X,
  RefreshCw,
  Globe,
  LayoutGrid,
  List,
  HelpCircle,
  Info
} from "lucide-react";
import { Product } from "../../types";
import { GrowthCampaign, GrowthLandingPage } from "../../types/growthStudio";
import { INITIAL_GROWTH_CAMPAIGNS } from "./mockCampaignsData";
import { CampaignFlowVisualization } from "./CampaignFlowVisualization";
import { TrafficDistributionManager } from "./TrafficDistributionManager";
import { LandingPageBuilder } from "./LandingPageBuilder";
import { AiLandingPageGeneratorModal } from "./AiLandingPageGeneratorModal";
import { CampaignAnalyticsDashboard } from "./CampaignAnalyticsDashboard";
import { CreateCampaignModal } from "./CreateCampaignModal";
import { CreateLandingPageWizardModal } from "./CreateLandingPageWizardModal";
import { SmartLinkModal } from "./SmartLinkModal";
import { PublicGrowthLandingPage } from "./PublicGrowthLandingPage";
import { TemplatesComparisonGallery } from "./TemplatesComparisonGallery";
import { GROWTH_TEMPLATES_CATALOG, GrowthTemplateDefinition } from "../../data/growthStudioPdfData";

interface GrowthStudioDashboardProps {
  storeProducts?: Product[];
}

export const GrowthStudioDashboard: React.FC<GrowthStudioDashboardProps> = ({
  storeProducts = []
}) => {
  const [campaigns, setCampaigns] = useState<GrowthCampaign[]>(() => {
    const saved = localStorage.getItem("yomi_growth_campaigns");
    if (saved) {
      try {
        const parsed: GrowthCampaign[] = JSON.parse(saved);
        // Ensure new blueprint campaigns (like camp-tactical-backpack) are merged into persisted state
        const existingIds = new Set(parsed.map(c => c.id));
        const missingInitial = INITIAL_GROWTH_CAMPAIGNS.filter(c => !existingIds.has(c.id));
        if (missingInitial.length > 0) {
          const merged = [...parsed, ...missingInitial];
          try {
            localStorage.setItem("yomi_growth_campaigns", JSON.stringify(merged));
          } catch {}
          return merged;
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved growth campaigns", e);
      }
    }
    return INITIAL_GROWTH_CAMPAIGNS;
  });

  // Top-level View Mode: "landing_pages" (direct pages table/cards), "campaigns" (executive dashboard), or "templates" (catalog)
  const [topTab, setTopTab] = useState<"landing_pages" | "campaigns" | "templates">("landing_pages");
  const [landingPageViewMode, setLandingPageViewMode] = useState<"grid" | "table">("grid");
  const [viewMode, setViewMode] = useState<"campaigns_list" | "campaign_detail">("campaigns_list");
  const [activeCampaignId, setActiveCampaignId] = useState<string>(campaigns[0]?.id || "");
  const [activeTab, setActiveTab] = useState<"flow" | "distribution" | "pages" | "analytics">("flow");
  const [showGrowthHints, setShowGrowthHints] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("yume_merchant_hints");
      if (saved !== null) return saved === "true";
    } catch {}
    return true;
  });

  useEffect(() => {
    const handleHintsSync = (e: any) => {
      if (typeof e.detail === "boolean") {
        setShowGrowthHints(e.detail);
      }
    };
    window.addEventListener("yume_hints_toggle", handleHintsSync);
    return () => window.removeEventListener("yume_hints_toggle", handleHintsSync);
  }, []);

  // Filters for lists
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "paused">("all");

  // Modals & Builders
  const [editingLandingPage, setEditingLandingPage] = useState<GrowthLandingPage | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showCreateWizardModal, setShowCreateWizardModal] = useState(false);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [showSmartLinkModal, setShowSmartLinkModal] = useState(false);
  const [previewTestPage, setPreviewTestPage] = useState<GrowthLandingPage | null>(null);
  const [previewTestCampaign, setPreviewTestCampaign] = useState<GrowthCampaign | null>(null);

  // Confirmation dialog states
  const [pageToDelete, setPageToDelete] = useState<{ campaignId: string; page: GrowthLandingPage } | null>(null);
  const [pageToTogglePublish, setPageToTogglePublish] = useState<{ campaignId: string; page: GrowthLandingPage } | null>(null);

  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId) || campaigns[0];

  // Save changes
  const updateActiveCampaign = (updated: GrowthCampaign) => {
    const updatedList = campaigns.map((c) => (c.id === updated.id ? updated : c));
    setCampaigns(updatedList);
    try {
      localStorage.setItem("yomi_growth_campaigns", JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Could not write to localStorage", e);
    }
  };

  // Toggle campaign status (Running / Paused)
  const toggleCampaignStatus = (campaignId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedList = campaigns.map((c) => {
      if (c.id === campaignId) {
        return {
          ...c,
          status: c.status === "active" ? ("paused" as const) : ("active" as const),
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });
    setCampaigns(updatedList);
    try {
      localStorage.setItem("yomi_growth_campaigns", JSON.stringify(updatedList));
    } catch (err) {
      console.warn("Could not write to localStorage", err);
    }
  };

  // Handle new page created via Wizard
  const handleWizardComplete = (newPage: GrowthLandingPage, selectedProduct: Product, method: "template" | "manual" | "ai") => {
    // Check if campaign already exists for this product or create new campaign
    let targetCampaign = campaigns.find((c) => c.product.id === selectedProduct.id);
    let updatedCampaigns: GrowthCampaign[];

    if (targetCampaign) {
      const updatedLps = [newPage, ...targetCampaign.landingPages];
      const updatedCamp: GrowthCampaign = {
        ...targetCampaign,
        landingPages: updatedLps,
        updatedAt: new Date().toISOString()
      };
      updatedCampaigns = campaigns.map((c) => c.id === targetCampaign!.id ? updatedCamp : c);
      setActiveCampaignId(targetCampaign.id);
    } else {
      const newCamp: GrowthCampaign = {
        id: `camp-${Date.now()}`,
        storeId: "store-1",
        name: `${selectedProduct.name} Campaign`,
        product: {
          id: selectedProduct.id,
          name: selectedProduct.name,
          price: selectedProduct.price,
          imageUrl: selectedProduct.imageUrl,
          category: selectedProduct.category,
          description: selectedProduct.description
        },
        offer: "Special Promotional Offer: Cash on Delivery Nationwide",
        trafficSources: ["Instagram", "TikTok", "Facebook"],
        goal: "purchases",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        distributionMode: "smart",
        distributionRationale: "Initial launch allocation with 100% test distribution.",
        smartLinkSlug: selectedProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        settings: {
          confidenceThreshold: 150,
          autoOptimize: true,
          pixelTracking: true
        },
        landingPages: [newPage]
      };
      updatedCampaigns = [newCamp, ...campaigns];
      setActiveCampaignId(newCamp.id);
    }

    setCampaigns(updatedCampaigns);
    try {
      localStorage.setItem("yomi_growth_campaigns", JSON.stringify(updatedCampaigns));
    } catch (e) {
      console.warn("Could not write to localStorage", e);
    }

    setShowCreateWizardModal(false);
    setEditingLandingPage(newPage);
  };

  // Duplicate Landing Page
  const handleDuplicateLandingPage = (campaignId: string, page: GrowthLandingPage, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: GrowthLandingPage = {
      ...page,
      id: `lp-${Date.now()}`,
      name: `${page.name} (Copy)`,
      metrics: {
        visitors: 0,
        uniqueVisitors: 0,
        sessions: 0,
        pageViews: 0,
        addToCart: 0,
        checkoutStarted: 0,
        conversions: 0,
        revenue: 0,
        averageOrderValue: page.metrics.averageOrderValue
      }
    };

    const updatedList = campaigns.map((camp) => {
      if (camp.id === campaignId) {
        return {
          ...camp,
          landingPages: [...camp.landingPages, duplicated],
          updatedAt: new Date().toISOString()
        };
      }
      return camp;
    });

    setCampaigns(updatedList);
    try {
      localStorage.setItem("yomi_growth_campaigns", JSON.stringify(updatedList));
    } catch (err) {
      console.warn("Could not write to localStorage", err);
    }
  };

  // Delete Landing Page
  const confirmDeleteLandingPage = () => {
    if (!pageToDelete) return;
    const { campaignId, page } = pageToDelete;

    const updatedList = campaigns.map((camp) => {
      if (camp.id === campaignId) {
        return {
          ...camp,
          landingPages: camp.landingPages.filter((p) => p.id !== page.id),
          updatedAt: new Date().toISOString()
        };
      }
      return camp;
    });

    setCampaigns(updatedList);
    try {
      localStorage.setItem("yomi_growth_campaigns", JSON.stringify(updatedList));
    } catch (err) {
      console.warn("Could not write to localStorage", err);
    }
    setPageToDelete(null);
  };

  // Toggle Publish / Unpublish Landing Page
  const confirmTogglePublish = () => {
    if (!pageToTogglePublish) return;
    const { campaignId, page } = pageToTogglePublish;
    const nextStatus = page.status === "active" ? "paused" : "active";

    const updatedList = campaigns.map((camp) => {
      if (camp.id === campaignId) {
        return {
          ...camp,
          landingPages: camp.landingPages.map((p) => p.id === page.id ? { ...p, status: nextStatus } : p),
          updatedAt: new Date().toISOString()
        };
      }
      return camp;
    });

    setCampaigns(updatedList);
    try {
      localStorage.setItem("yomi_growth_campaigns", JSON.stringify(updatedList));
    } catch (err) {
      console.warn("Could not write to localStorage", err);
    }
    setPageToTogglePublish(null);
  };

  // Direct Apply template from Blueprint Catalog
  const handleApplyTemplateFromGallery = (template: GrowthTemplateDefinition) => {
    const defaultProd = storeProducts[0] || {
      id: `prod-${Date.now()}`,
      name: template.targetCategory.includes("Trading") ? "كتاب خطواتك الأولى للربح في التداول" : "Featured Merchant Product",
      price: 4900,
      buyPrice: 6500,
      stock: 45,
      category: template.targetCategory,
      imageUrl: template.suggestedSections[0]?.imageUrl || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80"
    };

    const targetCampaign = campaigns.find(c => c.id === activeCampaignId) || campaigns[0];
    const newPage: GrowthLandingPage = {
      id: `lp-${Date.now()}`,
      campaignId: targetCampaign?.id || "default-camp",
      name: `${defaultProd.name} (${template.name})`,
      status: "active",
      strategyFocus: template.strategyFocus,
      trafficAllocation: 50,
      language: "ar",
      currency: "DA",
      market: "Algeria",
      theme: {
        primaryColor: template.suggestedTheme?.primaryColor || "#0A1F44",
        accentColor: template.suggestedTheme?.accentColor || "#E2A26C",
        backgroundColor: template.suggestedTheme?.backgroundColor || "#070F1E",
        backgroundGradient: template.suggestedTheme?.backgroundGradient || "linear-gradient(180deg, #070F1E 0%, #0A1F44 45%, #08152B 100%)",
        cardBackgroundColor: template.suggestedTheme?.cardBackgroundColor || "#0E1C36",
        textColor: template.suggestedTheme?.textColor || "#F4F6F8",
        fontFamily: "'Cairo', sans-serif",
        buttonStyle: template.suggestedTheme?.buttonStyle || "pill",
        badgeText: template.badge || "عرض حصري موثوق"
      },
      sections: template.suggestedSections.map((s, idx) => ({
        ...s,
        id: `sec-${Date.now()}-${idx}`,
        price: defaultProd.price,
        originalPrice: defaultProd.buyPrice || Math.round(defaultProd.price * 1.3)
      })),
      metrics: {
        visitors: 0,
        uniqueVisitors: 0,
        sessions: 0,
        pageViews: 0,
        addToCart: 0,
        checkoutStarted: 0,
        conversions: 0,
        revenue: 0,
        averageOrderValue: defaultProd.price
      },
      sourceBreakdown: {},
      deviceBreakdown: {
        mobile: { visitors: 0, conversions: 0, revenue: 0 },
        desktop: { visitors: 0, conversions: 0, revenue: 0 },
        tablet: { visitors: 0, conversions: 0, revenue: 0 }
      }
    };

    const updated = campaigns.map((camp) => {
      if (camp.id === targetCampaign?.id) {
        return {
          ...camp,
          landingPages: [newPage, ...camp.landingPages],
          updatedAt: new Date().toISOString()
        };
      }
      return camp;
    });

    setCampaigns(updated);
    try {
      localStorage.setItem("yomi_growth_campaigns", JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }

    setTopTab("landing_pages");
    setEditingLandingPage(newPage);
  };

  // Preview template from Blueprint Catalog
  const handlePreviewTemplateFromGallery = (template: GrowthTemplateDefinition) => {
    let matchedCamp = campaigns.find(c => c.id === "camp-tactical-backpack" && template.id === "tpl-algerian-tactical-backpack");
    if (!matchedCamp) {
      matchedCamp = campaigns.find(c => c.id === activeCampaignId) || campaigns[0];
    }
    setPreviewTestCampaign(matchedCamp || null);

    const dummyPage: GrowthLandingPage = {
      id: `lp-preview-${template.id}`,
      campaignId: matchedCamp?.id || activeCampaignId || "camp-preview",
      name: `${template.name} (معاينة حية)`,
      status: "active",
      strategyFocus: template.strategyFocus,
      trafficAllocation: 100,
      language: "ar",
      currency: "DA",
      market: "Algeria",
      theme: {
        primaryColor: template.suggestedTheme?.primaryColor || "#0A1F44",
        accentColor: template.suggestedTheme?.accentColor || "#E2A26C",
        backgroundColor: template.suggestedTheme?.backgroundColor || "#070F1E",
        backgroundGradient: template.suggestedTheme?.backgroundGradient || "linear-gradient(180deg, #070F1E 0%, #0A1F44 45%, #08152B 100%)",
        cardBackgroundColor: template.suggestedTheme?.cardBackgroundColor || "#0E1C36",
        textColor: template.suggestedTheme?.textColor || "#F4F6F8",
        fontFamily: "'Cairo', sans-serif",
        buttonStyle: template.suggestedTheme?.buttonStyle || "pill",
        badgeText: template.badge || "Verified Preview"
      },
      sections: template.suggestedSections.map((s, idx) => ({
        ...s,
        id: `preview-sec-${idx}`
      })),
      metrics: {
        visitors: 1240,
        uniqueVisitors: 980,
        sessions: 1400,
        pageViews: 2100,
        addToCart: 310,
        checkoutStarted: 220,
        conversions: 86,
        revenue: 421400,
        averageOrderValue: 4900
      },
      sourceBreakdown: {},
      deviceBreakdown: {
        mobile: { visitors: 1100, conversions: 78, revenue: 382200 },
        desktop: { visitors: 140, conversions: 8, revenue: 39200 },
        tablet: { visitors: 0, conversions: 0, revenue: 0 }
      }
    };
    setPreviewTestPage(dummyPage);
  };

  // Aggregated Executive Metrics across ALL campaigns
  const executiveMetrics = useMemo(() => {
    let totalLps = 0;
    let totalVisitors = 0;
    let totalConversions = 0;
    let totalRevenue = 0;
    let activeCount = 0;

    campaigns.forEach((c) => {
      if (c.status === "active") activeCount++;
      c.landingPages.forEach((lp) => {
        totalLps++;
        totalVisitors += lp.metrics.visitors;
        totalConversions += lp.metrics.conversions;
        totalRevenue += lp.metrics.revenue;
      });
    });

    const overallConversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;

    return {
      activeCampaigns: activeCount,
      totalLandingPages: totalLps,
      uniqueVisitors: totalVisitors,
      totalConversions,
      overallConversionRate,
      revenueGenerated: totalRevenue
    };
  }, [campaigns]);

  // Flatten all landing pages across campaigns for the unified Landing Pages table
  const allLandingPagesList = useMemo(() => {
    const list: Array<{
      campaignId: string;
      campaignName: string;
      product: GrowthCampaign["product"];
      page: GrowthLandingPage;
    }> = [];

    campaigns.forEach((c) => {
      c.landingPages.forEach((lp) => {
        list.push({
          campaignId: c.id,
          campaignName: c.name,
          product: c.product,
          page: lp
        });
      });
    });

    return list.filter((item) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = item.page.name.toLowerCase().includes(query) ||
        item.product.name.toLowerCase().includes(query) ||
        item.campaignName.toLowerCase().includes(query);
      
      const matchesStatus = statusFilter === "all" ? true :
        statusFilter === "active" ? item.page.status === "active" :
        statusFilter === "draft" ? item.page.status === "paused" :
        item.page.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchQuery, statusFilter]);

  // Active customer preview simulation mode
  if (previewTestPage) {
    const campaignToRender = previewTestCampaign || campaigns.find(c => c.id === previewTestPage.campaignId) || activeCampaign || campaigns[0];
    if (campaignToRender) {
      return (
        <div className="relative">
          <div className="sticky top-0 z-50 bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold border-b border-slate-700 shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>معاينة حية للمشتري: {previewTestPage.name}</span>
              <span className="text-slate-400 font-mono text-[11px]">({campaignToRender.name})</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPreviewTestPage(null);
                setPreviewTestCampaign(null);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer text-xs font-bold"
            >
              خروج من المعاينة (Exit Preview)
            </button>
          </div>
          <PublicGrowthLandingPage
            campaign={campaignToRender}
            landingPage={previewTestPage}
            onOrderSuccess={() => {}}
            onBackToStore={() => {
              setPreviewTestPage(null);
              setPreviewTestCampaign(null);
            }}
          />
        </div>
      );
    }
  }

  return (
    <div className="space-y-4 text-left">
      {/* Main Content Container (Matches Add Product Card) */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-stone-200/80 dark:border-slate-800 text-left flex flex-col gap-5 animate-fade-in shadow-2xs">
        {/* Section Header with Vertical Accent Bar + Primary Actions + Hints Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-5 rounded-full shrink-0"
                style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
              />
              <TrendingUp
                className="w-5 h-5 shrink-0"
                style={{ color: "var(--yume-theme-header-color, #0b2447)" }}
              />
              <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight font-sans">
                Growth Studio — Conversion Funnels & Smart Links
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 sm:ml-3.5">
              Build conversion-optimized landing pages for advertising campaigns, product launches, and social-commerce traffic.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Compact Inline View Switcher to preserve access to all 3 Growth Studio views */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-slate-800/90 border border-stone-200/80 dark:border-slate-700">
              {[
                { id: "landing_pages" as const, label: "Landing Pages", count: allLandingPagesList.length },
                { id: "campaigns" as const, label: "Campaigns", count: campaigns.length },
                { id: "templates" as const, label: "Templates", count: GROWTH_TEMPLATES_CATALOG.length },
              ].map((item) => {
                const isActive = topTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTopTab(item.id);
                      if (item.id !== "templates") {
                        setViewMode("campaigns_list");
                      }
                    }}
                    style={
                      isActive
                        ? { backgroundColor: "var(--yume-theme-header-color, #0b2447)" }
                        : undefined
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? "text-white shadow-2xs"
                        : "text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-stone-200/80 dark:bg-slate-700 text-stone-600 dark:text-slate-300"
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              id="growth-create-landing-page-btn"
              onClick={() => setShowCreateWizardModal(true)}
              style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
              className="hover:brightness-110 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Landing Page</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowGrowthHints((prev) => {
                  const next = !prev;
                  try {
                    localStorage.setItem("yume_merchant_hints", String(next));
                  } catch {}
                  window.dispatchEvent(new CustomEvent("yume_hints_toggle", { detail: next }));
                  return next;
                });
              }}
              style={
                showGrowthHints
                  ? {
                      backgroundColor: "var(--yume-theme-header-color, #0b2447)",
                      borderColor: "var(--yume-theme-header-color, #0b2447)",
                    }
                  : undefined
              }
              className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                showGrowthHints
                  ? "text-white shadow-xs"
                  : "bg-stone-50 dark:bg-slate-800/70 text-stone-600 dark:text-slate-300 border-stone-200/90 dark:border-slate-700 hover:border-stone-300"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Hints: {showGrowthHints ? "On" : "Off"}</span>
            </button>
          </div>
        </div>

        {/* Advice Banner (Matches Add Product Advice Callout) */}
        {showGrowthHints && (
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
            <p className="text-xs text-stone-700 dark:text-slate-200 leading-relaxed font-medium">
              <strong className="font-bold uppercase tracking-wider mr-1.5 text-stone-900 dark:text-white">
                ADVICE:
              </strong>
              {topTab === "landing_pages"
                ? "Pair each Meta or TikTok ad set with a dedicated landing page tailored to your audience angle (Direct COD, Problem-Solver, or Bundle Offer) to maximize conversion rates."
                : topTab === "campaigns"
                ? "Use Smart Links to automatically split incoming social traffic across multiple landing page variants and route orders directly to your fulfillment pipeline."
                : "Choose from 11 battle-tested e-commerce blueprint archetypes and customize every section in the visual builder."}
            </p>
          </div>
        )}

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-stone-50/70 dark:bg-slate-950/60 p-3 rounded-xl border border-stone-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {(["all", "active", "draft"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={
                  statusFilter === st
                    ? { backgroundColor: "var(--yume-theme-header-color, #0b2447)" }
                    : undefined
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                  statusFilter === st
                    ? "text-white shadow-2xs"
                    : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                {st === "active" ? "Published" : st === "draft" ? "Draft" : "All Funnels"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto justify-between sm:justify-end">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search funnels or products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 text-xs font-sans pl-8 pr-3 py-2 rounded-xl focus:bg-white dark:focus:bg-slate-900 transition-colors font-semibold text-stone-900 dark:text-white outline-none border bg-white dark:bg-slate-900 border-stone-200/90 dark:border-slate-800 hover:border-stone-300 focus:border-stone-900 dark:focus:border-white"
              />
            </div>

            {topTab === "landing_pages" && (
              <div className="inline-flex p-1 bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-xl text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setLandingPageViewMode("grid")}
                  style={
                    landingPageViewMode === "grid"
                      ? { backgroundColor: "var(--yume-theme-header-color, #0b2447)" }
                      : undefined
                  }
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    landingPageViewMode === "grid"
                      ? "text-white shadow-2xs"
                      : "text-stone-400 hover:text-stone-700 dark:hover:text-slate-200"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setLandingPageViewMode("table")}
                  style={
                    landingPageViewMode === "table"
                      ? { backgroundColor: "var(--yume-theme-header-color, #0b2447)" }
                      : undefined
                  }
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    landingPageViewMode === "table"
                      ? "text-white shadow-2xs"
                      : "text-stone-400 hover:text-stone-700 dark:hover:text-slate-200"
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODE 1: UNIFIED LANDING PAGES TABLE / GRID                                */}
        {/* ========================================================================= */}
        {topTab === "landing_pages" && (
          <div className="space-y-4">
            {allLandingPagesList.length === 0 ? (
              <div className="p-10 rounded-xl bg-stone-50/60 dark:bg-slate-950/50 border border-stone-200/80 dark:border-slate-800 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 text-stone-700 dark:text-slate-300 flex items-center justify-center mx-auto shadow-2xs">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    No Landing Pages Found
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    {searchQuery || statusFilter !== "all"
                      ? "No landing pages match your search criteria. Try resetting filters."
                      : "Create your first high-converting landing page to start driving ad traffic."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateWizardModal(true)}
                  style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
                  className="hover:brightness-110 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Landing Page</span>
                </button>
              </div>
            ) : landingPageViewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allLandingPagesList.map((item) => {
                  const isPublished = item.page.status === "active";
                  const cvr = item.page.metrics.visitors > 0
                    ? ((item.page.metrics.conversions / item.page.metrics.visitors) * 100).toFixed(1)
                    : "0.0";

                  return (
                    <div
                      key={item.page.id}
                      className="rounded-xl bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 overflow-hidden shadow-2xs hover:border-stone-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-44 w-full bg-stone-100 dark:bg-slate-800 overflow-hidden group">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />

                          {/* Top Floating Badges */}
                          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setPageToTogglePublish({ campaignId: item.campaignId, page: item.page })}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md shadow-xs transition-transform active:scale-95 cursor-pointer ${
                                isPublished
                                  ? "bg-emerald-600/95 text-white"
                                  : "bg-stone-900/85 text-stone-200 border border-white/20"
                              }`}
                              title={isPublished ? "Click to unpublish" : "Click to publish"}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-white animate-pulse" : "bg-stone-400"}`} />
                              <span>{isPublished ? "Published" : "Draft"}</span>
                            </button>

                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-stone-900/90 text-white backdrop-blur-md capitalize border border-white/15">
                              {item.page.strategyFocus.replace("_", " ")}
                            </span>
                          </div>

                          {/* Bottom Floating Price & Campaign Details */}
                          <div className="absolute bottom-2.5 inset-x-2.5 flex items-end justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-mono font-medium text-stone-300 block truncate">
                                {item.campaignName}
                              </span>
                              <span className="text-sm sm:text-base font-black font-mono text-white">
                                {item.product.price.toLocaleString()} {item.page.currency || "DA"}
                              </span>
                            </div>

                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/60 text-stone-200 border border-white/10 backdrop-blur-xs shrink-0">
                              {item.page.sections.length} Sections
                            </span>
                          </div>
                        </div>

                        {/* Middle: Page & Product Title */}
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-bold text-stone-900 dark:text-white text-sm leading-snug line-clamp-1">
                              {item.page.name}
                            </h3>
                            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 truncate">
                              Product: {item.product.name}
                            </p>
                          </div>

                          {/* Performance Metrics Summary */}
                          <div className="grid grid-cols-3 gap-1.5 p-2.5 rounded-xl bg-stone-50/80 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 text-left font-mono">
                            <div className="min-w-0">
                              <span className="text-[10px] text-stone-400 block font-sans font-semibold truncate">Visitors</span>
                              <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white block truncate">
                                {item.page.metrics.visitors.toLocaleString()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] text-stone-400 block font-sans font-semibold truncate">Orders</span>
                              <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                                {item.page.metrics.conversions}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] text-stone-400 block font-sans font-semibold truncate">CVR</span>
                              <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white block truncate">
                                {cvr}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom: Action Buttons */}
                      <div className="p-4 pt-0">
                        <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingLandingPage(item.page)}
                            style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
                            className="flex-1 py-2 px-3 rounded-xl hover:brightness-110 text-white text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
                          >
                            <Edit3 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Edit Page</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveCampaignId(item.campaignId);
                              setPreviewTestPage(item.page);
                            }}
                            className="p-2 rounded-xl border border-stone-200/90 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
                            title="Preview Live Page"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDuplicateLandingPage(item.campaignId, item.page, e)}
                            className="p-2 rounded-xl border border-stone-200/90 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
                            title="Duplicate Page"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setPageToDelete({ campaignId: item.campaignId, page: item.page })}
                            className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
                            title="Delete Page"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200/90 dark:border-slate-800 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-stone-200/80 dark:border-slate-800 bg-stone-50/80 dark:bg-slate-950/50 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-5">Landing Page</th>
                        <th className="py-3.5 px-4">Associated Product</th>
                        <th className="py-3.5 px-4">Template & Focus</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Performance</th>
                        <th className="py-3.5 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                      {allLandingPagesList.map((item) => {
                        const isPublished = item.page.status === "active";
                        const cvr = item.page.metrics.visitors > 0
                          ? ((item.page.metrics.conversions / item.page.metrics.visitors) * 100).toFixed(1)
                          : "0.0";

                        return (
                          <tr key={item.page.id} className="hover:bg-stone-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4 text-stone-700 dark:text-slate-300" />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-stone-900 dark:text-white block truncate">
                                    {item.page.name}
                                  </span>
                                  <span className="text-[10px] text-stone-400 font-mono block">
                                    Campaign: {item.campaignName}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-stone-200 dark:border-slate-700 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0">
                                  <span className="font-bold text-stone-700 dark:text-slate-300 block truncate max-w-xs">
                                    {item.product.name}
                                  </span>
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                                    {item.product.price.toLocaleString()} {item.page.currency || "DA"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200/80 dark:border-slate-700 capitalize">
                                  {item.page.strategyFocus.replace("_", " ")}
                                </span>
                                <span className="text-[10px] text-stone-400 block font-mono">
                                  {item.page.sections.length} Sections
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                isPublished
                                  ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                                  : "bg-stone-100 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-500"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`} />
                                <span>{isPublished ? "Published" : "Draft"}</span>
                              </span>
                            </td>

                            <td className="py-4 px-4">
                              <div className="space-y-0.5 font-mono">
                                <span className="text-stone-900 dark:text-white font-bold block">
                                  {item.page.metrics.conversions} orders ({cvr}%)
                                </span>
                                <span className="text-[10px] text-stone-400 block">
                                  {item.page.metrics.visitors.toLocaleString()} visitors
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingLandingPage(item.page)}
                                  className="p-1.5 rounded-lg text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Edit in Visual Builder"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveCampaignId(item.campaignId);
                                    setPreviewTestPage(item.page);
                                  }}
                                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Live Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDuplicateLandingPage(item.campaignId, item.page, e)}
                                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Duplicate Page"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPageToTogglePublish({ campaignId: item.campaignId, page: item.page })}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isPublished
                                      ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                      : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                  }`}
                                  title={isPublished ? "Unpublish Page" : "Publish Page"}
                                >
                                  {isPublished ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPageToDelete({ campaignId: item.campaignId, page: item.page })}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Delete Page"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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
        )}

        {/* ========================================================================= */}
        {/* MODE 2: CAMPAIGNS & TRAFFIC DISTRIBUTION VIEW                             */}
        {/* ========================================================================= */}
        {topTab === "campaigns" && viewMode === "campaigns_list" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 space-y-1 min-w-0">
                <div className="flex items-center justify-between text-stone-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate">Active Campaigns</span>
                  <Play className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </div>
                <div className="text-xl font-black font-mono text-stone-900 dark:text-white truncate">
                  {executiveMetrics.activeCampaigns}
                </div>
                <span className="text-[10px] text-stone-400 block font-medium truncate">
                  {campaigns.length} total campaigns
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 space-y-1 min-w-0">
                <div className="flex items-center justify-between text-stone-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate">Landing Pages</span>
                  <Layers className="w-3.5 h-3.5 text-stone-700 dark:text-slate-300 shrink-0" />
                </div>
                <div className="text-xl font-black font-mono text-stone-900 dark:text-white truncate">
                  {executiveMetrics.totalLandingPages}
                </div>
                <span className="text-[10px] text-stone-400 block font-medium truncate">
                  Across all ad campaigns
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 space-y-1 min-w-0">
                <div className="flex items-center justify-between text-stone-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate">Unique Visitors</span>
                  <Users className="w-3.5 h-3.5 text-stone-700 dark:text-slate-300 shrink-0" />
                </div>
                <div className="text-xl font-black font-mono text-stone-900 dark:text-white truncate">
                  {executiveMetrics.uniqueVisitors.toLocaleString()}
                </div>
                <span className="text-[10px] text-stone-400 block font-medium truncate">
                  Total inbound ad traffic
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 space-y-1 min-w-0">
                <div className="flex items-center justify-between text-stone-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate">Conversions</span>
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </div>
                <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 truncate">
                  {executiveMetrics.totalConversions.toLocaleString()}
                </div>
                <span className="text-[10px] text-stone-400 block font-medium truncate">
                  Confirmed COD orders
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 space-y-1 min-w-0">
                <div className="flex items-center justify-between text-stone-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate">Conversion Rate</span>
                  <TrendingUp className="w-3.5 h-3.5 text-stone-700 dark:text-slate-300 shrink-0" />
                </div>
                <div className="text-xl font-black font-mono text-stone-900 dark:text-white truncate">
                  {executiveMetrics.overallConversionRate.toFixed(1)}%
                </div>
                <span className="text-[10px] text-stone-400 block font-medium truncate">
                  Overall funnel yield
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 space-y-1 min-w-0">
                <div className="flex items-center justify-between text-stone-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate">Revenue</span>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </div>
                <div className="text-xl font-black font-mono text-stone-900 dark:text-white truncate">
                  {executiveMetrics.revenueGenerated.toLocaleString()}
                </div>
                <span className="text-[10px] text-stone-400 block font-medium truncate">
                  Total gross sales ({activeCampaign?.landingPages?.[0]?.currency || "DA"})
                </span>
              </div>
            </div>

            {/* Campaigns Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {campaigns.map((camp) => {
                const campVisitors = camp.landingPages.reduce((acc, lp) => acc + lp.metrics.visitors, 0);
                const campConversions = camp.landingPages.reduce((acc, lp) => acc + lp.metrics.conversions, 0);
                const campRevenue = camp.landingPages.reduce((acc, lp) => acc + lp.metrics.revenue, 0);
                const campCvr = campVisitors > 0 ? ((campConversions / campVisitors) * 100).toFixed(1) : "0.0";
                const isRunning = camp.status === "active";

                return (
                  <div
                    key={camp.id}
                    className="p-4 sm:p-5 rounded-xl bg-stone-50/60 dark:bg-slate-950/50 border border-stone-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white truncate">
                              {camp.name}
                            </h3>
                            <button
                              type="button"
                              onClick={(e) => toggleCampaignStatus(camp.id, e)}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer shrink-0 ${
                                isRunning
                                  ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                                  : "bg-stone-100 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-500"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`} />
                              <span>{isRunning ? "Running" : "Paused"}</span>
                            </button>
                          </div>
                          <p className="text-xs text-stone-500 dark:text-slate-400 truncate">
                            Product: <strong>{camp.product.name}</strong> • {camp.landingPages.length} Landing Pages
                          </p>
                        </div>

                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 text-[11px] font-mono text-stone-500 shrink-0 w-fit">
                          {camp.trafficSources.slice(0, 3).join(", ")}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-left">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800">
                          <span className="text-[10px] text-stone-400 block font-semibold">Visitors</span>
                          <span className="text-sm font-bold font-mono text-stone-900 dark:text-white">
                            {campVisitors.toLocaleString()}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800">
                          <span className="text-[10px] text-stone-400 block font-semibold">Orders</span>
                          <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {campConversions}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800">
                          <span className="text-[10px] text-stone-400 block font-semibold">CVR</span>
                          <span className="text-sm font-bold font-mono text-stone-900 dark:text-white">
                            {campCvr}%
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800">
                          <span className="text-[10px] text-stone-400 block font-semibold">Revenue</span>
                          <span className="text-sm font-bold font-mono text-stone-900 dark:text-white">
                            {campRevenue.toLocaleString()} <span className="text-[10px] font-normal text-stone-400">{camp.landingPages?.[0]?.currency || "DA"}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCampaignId(camp.id);
                          setShowSmartLinkModal(true);
                        }}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-stone-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-stone-200/90 dark:border-slate-700 text-stone-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Smart Link</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveCampaignId(camp.id);
                          setViewMode("campaign_detail");
                        }}
                        style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
                        className="px-4 py-2 rounded-xl hover:brightness-110 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Manage Flow</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 3: DETAILED CAMPAIGN WORKSPACE (FLOW, DISTRIBUTION, ANALYTICS)      */}
        {/* ========================================================================= */}
        {topTab === "campaigns" && viewMode === "campaign_detail" && activeCampaign && (
          <div className="space-y-5">
            <div className="bg-stone-50/70 dark:bg-slate-950/60 p-4 rounded-xl border border-stone-200/80 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("campaigns_list")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer mb-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>All Campaigns</span>
                  </button>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                    {activeCampaign.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSmartLinkModal(true)}
                    style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
                    className="px-4 py-2 rounded-xl hover:brightness-110 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Smart Link & QR</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
                {[
                  { id: "flow", label: "Campaign Flow", icon: <Share2 className="w-3.5 h-3.5" /> },
                  { id: "distribution", label: "Traffic Distribution", icon: <Sliders className="w-3.5 h-3.5" /> },
                  { id: "analytics", label: "Analytics & Performance", icon: <BarChart3 className="w-3.5 h-3.5" /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    style={
                      activeTab === tab.id
                        ? { backgroundColor: "var(--yume-theme-header-color, #0b2447)" }
                        : undefined
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      activeTab === tab.id
                        ? "text-white shadow-2xs"
                        : "text-stone-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "flow" && (
              <CampaignFlowVisualization
                campaign={activeCampaign}
                onOpenSmartLink={() => setShowSmartLinkModal(true)}
                onSelectLandingPage={(lpId) => {
                  const target = activeCampaign.landingPages.find((p) => p.id === lpId);
                  if (target) setEditingLandingPage(target);
                }}
              />
            )}

            {activeTab === "distribution" && (
              <TrafficDistributionManager
                campaign={activeCampaign}
                onUpdateDistribution={(mode, allocations, rationale) => {
                  const updatedLps = activeCampaign.landingPages.map((lp) => ({
                    ...lp,
                    trafficAllocation: allocations[lp.id] ?? lp.trafficAllocation
                  }));
                  updateActiveCampaign({
                    ...activeCampaign,
                    distributionMode: mode,
                    distributionRationale: rationale || activeCampaign.distributionRationale,
                    landingPages: updatedLps,
                    updatedAt: new Date().toISOString()
                  });
                }}
              />
            )}

            {activeTab === "analytics" && (
              <CampaignAnalyticsDashboard
                campaign={activeCampaign}
                onNavigateToDistribution={() => setActiveTab("distribution")}
              />
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 4: 11 ARCHETYPE BLUEPRINT CATALOG GALLERY                            */}
        {/* ========================================================================= */}
        {topTab === "templates" && (
          <div className="space-y-6">
            <TemplatesComparisonGallery
              onApplyTemplate={handleApplyTemplateFromGallery}
              onPreviewTemplate={handlePreviewTemplateFromGallery}
            />
          </div>
        )}
      </div>

      {/* CREATE LANDING PAGE WIZARD MODAL (STEP A -> E) */}
      {showCreateWizardModal && (
        <CreateLandingPageWizardModal
          storeProducts={storeProducts}
          onComplete={handleWizardComplete}
          onClose={() => setShowCreateWizardModal(false)}
        />
      )}

      {/* LANDING PAGE BUILDER FULLSCREEN MODAL */}
      {editingLandingPage && (
        <LandingPageBuilder
          landingPage={editingLandingPage}
          onUpdateLandingPage={(updatedLp) => {
            const updatedCampaigns = campaigns.map((c) => {
              if (c.landingPages.some((p) => p.id === updatedLp.id)) {
                return {
                  ...c,
                  landingPages: c.landingPages.map((p) => p.id === updatedLp.id ? updatedLp : p),
                  updatedAt: new Date().toISOString()
                };
              }
              return c;
            });
            setCampaigns(updatedCampaigns);
            try {
              localStorage.setItem("yomi_growth_campaigns", JSON.stringify(updatedCampaigns));
            } catch (e) {
              console.warn("Could not write to localStorage", e);
            }
            setEditingLandingPage(updatedLp);
          }}
          onClose={() => setEditingLandingPage(null)}
        />
      )}

      {/* DELETE CONFIRMATION DIALOG (REQUIREMENT 2) */}
      {pageToDelete && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Landing Page?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to permanently delete <strong>{pageToDelete.page.name}</strong>? This will remove all associated traffic allocations and conversion metrics.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPageToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteLandingPage}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Delete Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH / UNPUBLISH CONFIRMATION DIALOG (REQUIREMENT 2) */}
      {pageToTogglePublish && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {pageToTogglePublish.page.status === "active" ? "Unpublish Landing Page?" : "Publish Landing Page?"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {pageToTogglePublish.page.status === "active"
                  ? `Unpublishing ${pageToTogglePublish.page.name} will pause inbound ad traffic routing to this variation.`
                  : `Publishing ${pageToTogglePublish.page.name} will enable active customer traffic routing to this variation.`}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPageToTogglePublish(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTogglePublish}
                style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
                className="px-4 py-2 rounded-xl text-xs font-bold hover:brightness-110 text-white shadow-xs cursor-pointer"
              >
                {pageToTogglePublish.page.status === "active" ? "Unpublish" : "Publish Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMART LINK MODAL */}
      {showSmartLinkModal && (
        <SmartLinkModal
          campaign={activeCampaign}
          onClose={() => setShowSmartLinkModal(false)}
          onOpenTestLink={() => {
            setShowSmartLinkModal(false);
            setPreviewTestPage(activeCampaign.landingPages[0]);
          }}
        />
      )}

    </div>
  );
};
