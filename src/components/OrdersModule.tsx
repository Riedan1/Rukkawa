import React, { useState, useMemo, useEffect, useRef } from "react";
import { Order, MerchantStore, CarrierTariffProfile, SettlementBatchRecord } from "../types";
import { ALL_58_WILAYAS as ALGERIA_WILAYAS } from "../data";
import { ShippingTrackingModal } from "./ShippingTrackingModal";
import { deliveryService } from "../services/deliveryService";
import { apiDb } from "../services/apiDb";
import {
  calculateOrderMetrics,
  filterStoreOrders,
  getNextOrderStage,
  OrderStageTab,
} from "../utils/ordersLogic";
import {
  normalizeOrderRecord,
  runStoreOrdersMigration,
  rollbackStoreOrdersMigration,
  transitionOrderDimension,
} from "../utils/orderLifecycle";
import {
  getDefaultCarrierTariffProfiles,
  computeStoreFinancialRollup,
} from "../services/financialReconciliationService";
import { OrderDetailDrawer } from "./orders/OrderDetailDrawer";
import { FulfillmentHub } from "./orders/FulfillmentHub";
import { FinancialReconciliationView } from "./orders/FinancialReconciliationView";
import { GeographicAnalyticsMap } from "./orders/GeographicAnalyticsMap";
import { VisitorAnalyticsModule } from "./VisitorAnalyticsModule";
import DiamondDecorativeDivider from "./DiamondDecorativeDivider";
import { SkeuomorphicSwitch } from "./SkeuomorphicSwitch";
import { useStorePlanPermissions } from "../utils/platformPermissionsConfig";
import {
  Package,
  RefreshCw,
  CheckCircle,
  Clock,
  Truck,
  Search,
  Table,
  Grid,
  ExternalLink,
  Download,
  Phone,
  MessageSquare,
  Settings,
  BarChart2,
  MapPin,
  Layers,
  Eye,
  EyeOff,
  Check,
  X,
  RotateCcw,
  Users,
  Printer,
  LogOut,
  TrendingUp,
  Activity,
  HelpCircle,
  Building,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Plus,
  ArrowRight,
  ArrowLeft,
  Columns,
  Info,
  Sparkles,
  Gift,
  Tag,
  DollarSign,
  Globe,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import {
  extractOfferFromOrder,
  MerchantOrderOfferBadge,
  MerchantOfferDetailsFulfillmentPanel,
} from "../utils/offersOrderHelpers";

const GoogleSheetsLogo = ({ className = "w-4 h-4", ...props }: { className?: string; [key: string]: any }) => {
  return (
    <svg viewBox="0 0 36 36" className={className} {...props}>
      <path fill="#107C41" d="M23 1H7C5.35 1 4 2.35 4 4V32C4 33.65 5.35 35 7 35H29C30.65 35 32 33.65 32 32V10L23 1Z" />
      <path fill="#1F9A55" d="M23 1V10H32L23 1Z" />
      <path fill="#FFF" d="M10 13H26V15H10V13ZM10 17H26V19H10V17ZM10 21H26V23H10V21ZM10 25H26V27H10V25Z" />
    </svg>
  );
};

export interface OrdersModuleProps {
  myStore: MerchantStore;
  orders: Order[];
  setOrders?: React.Dispatch<React.SetStateAction<Order[]>>;
  stores: MerchantStore[];
  merchantLang: "en" | "fr" | "ar";
  darkMode: boolean;
  currentSlideColor?: string;
  setMerchantSubTab: (tab: string) => void;
  setMerchantFeedbackMessage?: (msg: string) => void;

  // Google Sheets Props
  googleUser?: any;
  handleConnectGoogleSheets: () => void;
  handleForceManualSync: () => void;
  handleDisconnectGoogleSheets: () => void;
  isSyncingSheets: boolean;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (val: boolean) => void;
  sheetsSpreadsheetId: string;
  sheetsFeedback: string;
  showManualInput: boolean;
  setShowManualInput: (val: boolean) => void;
  manualSheetInput: string;
  setManualSheetInput: (val: string) => void;
  handleManualLinkSheets: (e: React.FormEvent) => void;

  // Simulation trigger
  handleSimulateOrder: () => void;

  // Focus Mode (Hide Sidebar & Header for Fullscreen Workspace)
  isFocusMode?: boolean;
  setIsFocusMode?: React.Dispatch<React.SetStateAction<boolean>>;
}

const CARRIERS = [
  { id: "yalidine", name: "Yalidine Express", prefix: "YAL" },
  { id: "zr_express", name: "ZR Express", prefix: "ZRX" },
  { id: "kazitour", name: "Kazitour Logistics", prefix: "KAZ" },
  { id: "mayestro", name: "Mayestro Delivery", prefix: "MAY" },
  { id: "nord_sud", name: "Nord & Sud Express", prefix: "NSE" },
  { id: "ems", name: "EMS Algeria Post", prefix: "EMS" },
];

export default function OrdersModule({
  myStore,
  orders,
  setOrders,
  stores,
  merchantLang,
  darkMode,
  currentSlideColor,
  setMerchantSubTab,
  setMerchantFeedbackMessage,
  googleUser,
  handleConnectGoogleSheets,
  handleForceManualSync,
  handleDisconnectGoogleSheets,
  isSyncingSheets,
  autoSyncEnabled,
  setAutoSyncEnabled,
  sheetsSpreadsheetId,
  handleSimulateOrder,
  isFocusMode: externalFocusMode,
  setIsFocusMode: setExternalFocusMode,
}: OrdersModuleProps) {
  const storeId = myStore?.id || "store_1";
  const resolvedAccentColor = currentSlideColor || "#113729";
  const [showOrderHints, setShowOrderHints] = useState(() => {
    try {
      const saved = localStorage.getItem("yumi_orders_hints");
      if (saved !== null) return saved === "true";
    } catch {}
    return true;
  });

  // Listen to events from the dedicated Orders top banner
  useEffect(() => {
    const handleModeChange = (e: any) => {
      if (e.detail && (e.detail === "classic" || e.detail === "advanced")) {
        setActiveViewMode(e.detail);
      }
    };
    const handleRefresh = () => {
      if (handleForceManualSync) {
        handleForceManualSync();
      }
    };
    const handleHintsToggle = (e: any) => {
      if (typeof e.detail === "boolean") {
        setShowOrderHints(e.detail);
      } else {
        setShowOrderHints((prev) => !prev);
      }
    };
    window.addEventListener("yume_orders_mode_change", handleModeChange);
    window.addEventListener("yume_orders_refresh", handleRefresh);
    window.addEventListener("yume_orders_hints_toggle", handleHintsToggle);
    return () => {
      window.removeEventListener("yume_orders_mode_change", handleModeChange);
      window.removeEventListener("yume_orders_refresh", handleRefresh);
      window.removeEventListener("yume_orders_hints_toggle", handleHintsToggle);
    };
  }, [handleForceManualSync]);

  // Internal fallback state for Focus Mode if parent didn't pass it
  const [internalFocusMode, setInternalFocusMode] = useState(false);
  const isFocusMode = externalFocusMode !== undefined ? externalFocusMode : internalFocusMode;

  const toggleFocusMode = () => {
    if (setExternalFocusMode) {
      setExternalFocusMode((prev) => !prev);
    } else {
      setInternalFocusMode((prev) => !prev);
    }
  };

  const exitFocusMode = () => {
    if (setExternalFocusMode) {
      setExternalFocusMode(false);
    } else {
      setInternalFocusMode(false);
    }
  };

  // Ensure DOM sidebar & header hide even if using internal fallback state
  useEffect(() => {
    if (setExternalFocusMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && internalFocusMode) {
        setInternalFocusMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const sidebar = document.getElementById("yume-styled-sidebar");
    if (internalFocusMode) {
      document.documentElement.classList.add("yume-zen-focus-mode");
      if (sidebar) sidebar.style.display = "none";
    } else {
      document.documentElement.classList.remove("yume-zen-focus-mode");
      if (sidebar) sidebar.style.display = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [internalFocusMode, setExternalFocusMode]);

  // --- View Mode State: "classic" = Simple View, "advanced" = Advanced View ---
  const globalOrdersMode =
    (localStorage.getItem("yumi_admin_global_orders_mode") as "classic" | "advanced" | "both") || "both";
  const planOrdersModeRaw = localStorage.getItem("yumi_admin_plan_orders_mode");
  const planOrdersModeMap = planOrdersModeRaw
    ? JSON.parse(planOrdersModeRaw)
    : { Basic: "both", Pro: "both", "Pro Plus": "both", Premium: "both" };
  const storePlan = myStore?.subscriptionTier || myStore?.premiumTier || "Basic";

  const storePlanPermissions = useStorePlanPermissions(myStore);
  const isSimpleViewAllowed = storePlanPermissions.orders.simpleView.enabled;
  const isAdvancedViewAllowed = storePlanPermissions.orders.advancedView.enabled;
  const advSubFeatures = storePlanPermissions.orders.advancedView.subFeatures;

  const [activeViewMode, setActiveViewMode] = useState<"classic" | "advanced">(() => {
    try {
      const saved = localStorage.getItem(`yumi_orders_active_mode_${storeId}`);
      if (saved === "classic" || saved === "advanced") return saved;
    } catch {}
    return "classic";
  });

  const currentMode: "classic" | "advanced" =
    activeViewMode === "advanced" && !isAdvancedViewAllowed
      ? "classic"
      : activeViewMode === "classic" && !isSimpleViewAllowed && isAdvancedViewAllowed
        ? "advanced"
        : activeViewMode;

  const handleToggleMode = (mode: "classic" | "advanced") => {
    if (mode === "advanced" && !isAdvancedViewAllowed) return;
    if (mode === "classic" && !isSimpleViewAllowed) return;
    setActiveViewMode(mode);
    try {
      localStorage.setItem(`yumi_orders_active_mode_${storeId}`, mode);
    } catch {}
    window.dispatchEvent(new CustomEvent("yume_orders_mode_updated", { detail: mode }));
  };

  // Active sub-module in Advanced View
  const [activeTab, setActiveTab] = useState<
    | "all"
    | "fulfillment"
    | "reconciliation"
    | "geo_map"
    | "visitor_analytics"
    | "pipeline"
    | "lines"
    | "analytics"
    | "deliveries"
    | "customers"
    | "returns"
    | "suppliers"
    | "marketing"
    | "overview"
  >("all");

  // Part 3 & Part 4 State: Carrier Tariff Profiles & Remittance Settlement Batches
  const [tariffProfiles, setTariffProfiles] = useState<CarrierTariffProfile[]>(() => {
    try {
      const saved = localStorage.getItem(`yume_tariffs_v2_${storeId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return getDefaultCarrierTariffProfiles(storeId);
  });

  const handleUpdateTariffProfiles = (profiles: CarrierTariffProfile[]) => {
    setTariffProfiles(profiles);
    try {
      localStorage.setItem(`yume_tariffs_v2_${storeId}`, JSON.stringify(profiles));
    } catch {}
  };

  const [settlementBatches, setSettlementBatches] = useState<SettlementBatchRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`yume_settlement_batches_v2_${storeId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const handleSaveSettlementBatch = (batch: SettlementBatchRecord) => {
    setSettlementBatches((prev) => {
      const next = [batch, ...prev];
      try {
        localStorage.setItem(`yume_settlement_batches_v2_${storeId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Pre-selected order ID when jumping to Split-Shipment Builder in FulfillmentHub
  const [splitTargetOrderId, setSplitTargetOrderId] = useState<string | null>(null);

  // Settings Modal state
  const [adminGlobalMode, setAdminGlobalMode] = useState<"classic" | "advanced" | "both">(globalOrdersMode);
  const [adminPlanModes] = useState<Record<string, string>>(planOrdersModeMap);
  const [adminStoreOverride, setAdminStoreOverride] = useState<string>(myStore?.ordersMode || "both");

  const saveAdminSettings = () => {
    try {
      localStorage.setItem("yumi_admin_global_orders_mode", adminGlobalMode);
      localStorage.setItem("yumi_admin_plan_orders_mode", JSON.stringify(adminPlanModes));
      localStorage.setItem(`yumi_orders_mode_store_${storeId}`, adminStoreOverride);
    } catch {}
    setShowSettingsModal(false);
    if (setMerchantFeedbackMessage) {
      setMerchantFeedbackMessage(
        merchantLang === "ar"
          ? "تم حفظ إعدادات الطلبيات بنجاح"
          : "Orders workspace preferences saved."
      );
    }
  };

  // --- Stage Tab & Filtering States ---
  // Stage tabs: "all" | "pending" (Incoming) | "accepted" (Processing) | "shipped" (Shipped) | "delivered" (Completed)
  const [statusFilter, setStatusFilter] = useState<OrderStageTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [carrierFilter, setCarrierFilter] = useState<string>("all");
  const [wilayaFilter, setWilayaFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [onlyOfferOrders, setOnlyOfferOrders] = useState<boolean>(false);

  // Layout View Mode (Table vs Cards)
  const [layoutView, setLayoutView] = useState<"table" | "cards">("table");

  // Selection & Batch Actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Modals state
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [printingLabelOrder, setPrintingLabelOrder] = useState<Order | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isModeMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(event.target as Node)) {
        setIsModeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModeMenuOpen]);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Store Orders (matches storeId, storeName, or verified direct storefront orders) normalized with v2 4-Dimension & Financial fields
  const storeOrders = useMemo(() => {
    const rawMatched = (orders || []).filter((o) => {
      if (!o) return false;
      if (o.storeId === storeId) return true;
      if (myStore?.id && o.storeId === myStore.id) return true;
      if (myStore?.name && o.storeName && o.storeName.toLowerCase() === myStore.name.toLowerCase()) return true;
      return false;
    });
    return rawMatched.map((o) => normalizeOrderRecord(o, myStore?.products || []));
  }, [orders, storeId, myStore?.id, myStore?.name, myStore?.products]);

  // Run idempotent, fail-closed v2 migration snapshot verification on mount if unmigrated orders exist
  const migrationRanRef = useRef<string | null>(null);
  useEffect(() => {
    if (!orders || orders.length === 0 || !setOrders) return;
    if (migrationRanRef.current === storeId) return;
    const hasUnmigrated = orders.some(
      (o) =>
        o &&
        (o.storeId === storeId || o.storeId === myStore?.id) &&
        (!o.orderStatus || !o.financials || !o.migrationBaselineHash)
    );
    if (!hasUnmigrated) {
      migrationRanRef.current = storeId;
      return;
    }
    migrationRanRef.current = storeId;
    try {
      const res = runStoreOrdersMigration({
        storeId,
        rawOrders: orders,
        catalogProducts: myStore?.products || [],
      });
      if (res.status === "VERIFIED_COMPLETE" && res.orders.length > 0) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.warn("[OrdersModule] Pre-migration check warning:", err);
    }
  }, [storeId, orders, myStore?.id, myStore?.products, setOrders]);

  // Unified v2 Single Order & Batch Order Update Handlers
  const handleUpdateSingleOrder = (updatedOrder: Order) => {
    if (!setOrders) return;
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    if (viewingOrder && viewingOrder.id === updatedOrder.id) {
      setViewingOrder(updatedOrder);
    }
    apiDb.updateItem("orders", updatedOrder.id, updatedOrder).catch(() => {});
  };

  const handleUpdateBatchOrders = (updatedList: Order[]) => {
    if (!setOrders) return;
    const mapById = new Map(updatedList.map((o) => [o.id, o]));
    setOrders((prev) => prev.map((o) => mapById.get(o.id) || o));
    updatedList.forEach((ord) => {
      apiDb.updateItem("orders", ord.id, ord).catch(() => {});
    });
  };

  const handleRestoreStockOnReturn = (productId: string, quantityToAdd: number) => {
    if (setMerchantFeedbackMessage) {
      setMerchantFeedbackMessage(
        `Inspection Passed: +${quantityToAdd} unit(s) of product ${productId} restored to sellable inventory.`
      );
    }
  };

  const handleTriggerRollback = () => {
    try {
      const res = rollbackStoreOrdersMigration(storeId, orders);
      if (setOrders) {
        setOrders(res.restoredOrders);
      }
      if (setMerchantFeedbackMessage) {
        setMerchantFeedbackMessage(
          `Rollback complete: ${res.unmodifiedRestoredCount} restored, ${res.modifiedPreservedCount} modified preserved, ${res.newPostMigrationRetainedCount} new orders retained.`
        );
      }
    } catch (err: any) {
      if (setMerchantFeedbackMessage) {
        setMerchantFeedbackMessage(err?.message || "Rollback failed.");
      }
    }
  };

  // Category Helper
  const getOrderItemCategory = (itemId: string): string => {
    if (!itemId) return "Crafts";
    const activeProduct = myStore?.products?.find((p) => p && p.id === itemId);
    if (activeProduct) return activeProduct.category;
    for (const st of stores || []) {
      if (!st) continue;
      const prod = st.products?.find((item) => item && item.id === itemId);
      if (prod) return prod.category;
    }
    return "Crafts";
  };

  // Metrics & Stage Counts via tested pure helper
  const metrics = useMemo(() => calculateOrderMetrics(storeOrders), [storeOrders]);
  const {
    all: totalOrdersCount,
    incoming: pendingCount,
    processing: acceptedCount,
    shipped: shippedCount,
    completed: deliveredCount,
    returns: returnCount,
  } = metrics.counts;
  const { totalRevenue, avgOrderValue, deliverySuccessRate, returnRate } = metrics;

  // Count of offer orders in current store
  const offerOrdersCount = useMemo(() => {
    return (storeOrders || []).filter((o) => Boolean(extractOfferFromOrder(o))).length;
  }, [storeOrders]);

  // Filtered Orders via tested pure helper
  const filteredOrders = useMemo(() => {
    let list = filterStoreOrders(
      storeOrders,
      {
        stage: statusFilter,
        searchQuery,
        carrierFilter,
        wilayaFilter,
        paymentFilter,
        startDate,
        endDate,
      },
      categoryFilter === "all"
        ? undefined
        : (o) =>
            Array.isArray(o.items) &&
            o.items.some(
              (it) => it && it.id && getOrderItemCategory(it.id).toLowerCase() === categoryFilter.toLowerCase()
            )
    );
    if (onlyOfferOrders) {
      list = list.filter((o) => Boolean(extractOfferFromOrder(o)));
    }
    return list;
  }, [storeOrders, statusFilter, searchQuery, categoryFilter, carrierFilter, wilayaFilter, paymentFilter, startDate, endDate, onlyOfferOrders]);

  // Reset page when filter changes
  const handleStageSelect = (stage: OrderStageTab) => {
    setStatusFilter(stage);
    setCurrentPage(1);
    if (activeTab !== "all" && activeTab !== "pipeline") {
      setActiveTab("all");
    }
  };

  // Pagination bounds
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Regional Wilaya Distribution
  const wilayaDistribution = useMemo(() => {
    const map: Record<string, { count: number; total: number; wilayaName: string }> = {};
    storeOrders.forEach((o) => {
      if (!o) return;
      const code = o.shopper?.wilayaCode || "16";
      const name = o.shopper?.wilaya || "Alger";
      if (!map[code]) map[code] = { count: 0, total: 0, wilayaName: name };
      map[code].count += 1;
      map[code].total += o.total || 0;
    });
    return Object.entries(map)
      .map(([code, val]) => ({ code, ...val }))
      .sort((a, b) => b.count - a.count);
  }, [storeOrders]);

  // Customer LTV Directory
  const customerLTVList = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        phone: string;
        email: string;
        commune: string;
        wilaya: string;
        count: number;
        ltv: number;
        type: "VIP" | "Returning" | "New";
        orders: string[];
      }
    > = {};
    storeOrders.forEach((o) => {
      if (!o || !o.shopper) return;
      const phone = o.shopper.phone || "unknown";
      if (!map[phone]) {
        map[phone] = {
          name: o.shopper.name || "Customer",
          phone: o.shopper.phone || "",
          email:
            o.shopper.email ||
            `${(o.shopper.name || "client").toLowerCase().replace(/\s+/g, ".")}@email.dz`,
          commune: o.shopper.commune || "Alger Centre",
          wilaya: o.shopper.wilaya || "Alger",
          count: 0,
          ltv: 0,
          type: "New",
          orders: [],
        };
      }
      map[phone].count += 1;
      map[phone].ltv += o.total || 0;
      if (o.id) map[phone].orders.push(o.id);
      if (map[phone].count >= 3 || map[phone].ltv > 15000) {
        map[phone].type = "VIP";
      } else if (map[phone].count > 1) {
        map[phone].type = "Returning";
      }
    });
    return Object.values(map).sort((a, b) => b.ltv - a.ltv);
  }, [storeOrders]);

  // Order Lines List
  const orderLinesList = useMemo(() => {
    const lines: Array<{
      id: string;
      lineTitle: string;
      lineTotal: number;
      orderId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
    }> = [];
    storeOrders.forEach((o) => {
      if (!o || !Array.isArray(o.items)) return;
      o.items.forEach((item) => {
        if (!item) return;
        const ordId = o.id || "101";
        const itName = item.name || "Item";
        lines.push({
          id: `CMD-${ordId.replace(/[^0-9]/g, "") || "101"}-${itName.split(" ")[0] || "product"}`,
          lineTitle: `CMD-${ordId} · ${itName}`,
          lineTotal: (item.quantity || 1) * (item.price || 0),
          orderId: `CMD-${ordId}`,
          productName: itName,
          quantity: item.quantity || 1,
          unitPrice: item.price || 0,
        });
      });
    });
    return lines;
  }, [storeOrders]);

  // Deliveries Log
  const deliveriesList = useMemo(() => {
    return storeOrders.filter(Boolean).map((o, idx) => ({
      id: `DLV-2026-0${14 - (idx % 10)}`,
      carrier: CARRIERS.find((c) => c.id === (o.deliveryCompany || "yalidine"))?.name || "Yalidine Express",
      carrierId: o.deliveryCompany || "yalidine",
      fee: o.shippingCost || 600,
      type: idx % 2 === 0 ? "Home Delivery" : "Stop Desk",
      orderId: `CMD-${o.id || "101"}`,
      shipDate: o.date,
      status: o.status,
    }));
  }, [storeOrders]);

  // Returns List
  const returnsList = useMemo(() => {
    const sampleReasons = ["Changed Mind", "Wrong Size", "Damaged Item"];
    const sampleStatuses = ["Approved", "Refunded", "Requested"];
    return storeOrders
      .filter(Boolean)
      .slice(0, 4)
      .map((o, idx) => ({
        id: `RET-2026-00${idx + 1}`,
        date: o.date,
        orderId: `CMD-${o.id || "101"}`,
        reason: sampleReasons[idx % sampleReasons.length],
        refundAmount: Math.round((o.total || 0) * 0.7),
        status: sampleStatuses[idx % sampleStatuses.length],
      }));
  }, [storeOrders]);

  // Suppliers List
  const suppliersList = useMemo(
    () => [
      {
        supplier: "Guangzhou Apparel Co.",
        contact: "Li Wei",
        country: "China",
        leadTime: 35,
        notes: "Bulk accessories & denim",
        phone: "+86 20 8888 1234",
      },
      {
        supplier: "Atelier Alger",
        contact: "Karim Belkacem",
        country: "Algeria",
        leadTime: 7,
        notes: "Local workshop, fast restock",
        phone: "+213 661 23 45 67",
      },
      {
        supplier: "Istanbul Textile Co.",
        contact: "Mehmet Yilmaz",
        country: "Turkey",
        leadTime: 21,
        notes: "Primary supplier for woven goods",
        phone: "+90 212 555 0101",
      },
    ],
    []
  );

  // Marketing Campaigns
  const marketingList = useMemo(
    () => [
      {
        campaign: "TikTok Seasonal Launch",
        budget: 60000,
        channel: "TikTok Ads",
        endDate: "20 June 2026",
        roas: "2.5x",
        revenue: 150000,
      },
      {
        campaign: "Collection Hiver",
        budget: 120000,
        channel: "Instagram Ads",
        endDate: "30 June 2026",
        roas: "4.5x",
        revenue: 540000,
      },
      {
        campaign: "Soldes Été",
        budget: 80000,
        channel: "Facebook Ads",
        endDate: "31 May 2026",
        roas: "4.0x",
        revenue: 320000,
      },
    ],
    []
  );

  // Order Status Update Handler (Synchronizes v1 status + v2 4-Dimension Lifecycle)
  const handleUpdateOrderStatus = (
    orderId: string,
    newStatus: "pending" | "accepted" | "shipped" | "delivered"
  ) => {
    if (!setOrders) return;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          let tracking = o.trackingCode;
          if (newStatus === "shipped" && !tracking) {
            const carrierObj =
              CARRIERS.find((c) => c.id === (o.deliveryCompany || "yalidine")) || CARRIERS[0];
            tracking = `${carrierObj.prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
          }
          const mappedOrderStatus =
            newStatus === "pending"
              ? "confirmation_pending"
              : newStatus === "accepted"
                ? "confirmed"
                : newStatus === "shipped"
                  ? "shipped"
                  : "delivered";
          const transitioned = transitionOrderDimension({
            order: { ...o, status: newStatus, trackingCode: tracking },
            dimension: "order",
            newValue: mappedOrderStatus,
            actorName: myStore.name || "Merchant",
            actorRole: "owner",
            note: `Stage advanced to ${newStatus} (${mappedOrderStatus}).`,
          });
          return { ...transitioned, status: newStatus, trackingCode: tracking };
        }
        return o;
      })
    );

    if (newStatus === "shipped") {
      const ord = orders.find((o) => o.id === orderId);
      if (ord) {
        deliveryService
          .dispatchShipment({
            orderId: ord.id,
            carrierId: (ord.deliveryCompany as any) || "yalidine",
            isStopDesk: ord.deliveryMethod === "stop_desk",
            codAmountDzd: ord.total || 0,
            recipient: {
              name: ord.shopper.name,
              phone: ord.shopper.phone,
              address: ord.shopper.address,
              commune: ord.shopper.commune,
              wilayaId: Number(ord.shopper.wilayaCode) || 16,
              wilayaName: ord.shopper.wilaya,
            },
            origin: {
              wilayaId: 16,
              wilayaName: "Alger",
              storeName: myStore.name,
            },
          })
          .catch((err) => console.warn("[OrdersModule] Background courier dispatch sync:", err));
      }
    }

    apiDb.updateItem("orders", orderId, { status: newStatus }).catch(() => {});

    if (setMerchantFeedbackMessage) {
      const stageNames: Record<string, string> = {
        pending: "Incoming",
        accepted: "Processing",
        shipped: "Shipped",
        delivered: "Completed",
      };
      setMerchantFeedbackMessage(
        merchantLang === "ar"
          ? `تم تحديث حالة الطلبية #${orderId}`
          : `Order #${orderId} moved to ${stageNames[newStatus] || newStatus}`
      );
    }
  };

  // Assign Carrier
  const handleAssignCarrier = (orderId: string, carrierId: string) => {
    if (!setOrders) return;
    const carrierObj = CARRIERS.find((c) => c.id === carrierId) || CARRIERS[0];
    const newTracking = `${carrierObj.prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return { ...o, deliveryCompany: carrierId, trackingCode: newTracking };
        }
        return o;
      })
    );

    if (setMerchantFeedbackMessage) {
      setMerchantFeedbackMessage(
        `Assigned carrier ${carrierObj.name} (${newTracking}) to order #${orderId}`
      );
    }
  };

  // Selection Handlers
  const allFilteredSelected =
    filteredOrders.length > 0 && filteredOrders.every((o) => selectedOrderIds.includes(o.id));
  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const currentFilteredIds = filteredOrders.map((o) => o.id);
      setSelectedOrderIds((prev) => prev.filter((id) => !currentFilteredIds.includes(id)));
    } else {
      const currentFilteredIds = filteredOrders.map((o) => o.id);
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...currentFilteredIds])));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Status Update
  const handleBulkStatusChange = (status: "accepted" | "shipped" | "delivered") => {
    if (selectedOrderIds.length === 0 || !setOrders) return;
    setOrders((prev) =>
      prev.map((o) => {
        if (selectedOrderIds.includes(o.id)) {
          let tracking = o.trackingCode;
          if (status === "shipped" && !tracking) {
            const carrierObj =
              CARRIERS.find((c) => c.id === (o.deliveryCompany || "yalidine")) || CARRIERS[0];
            tracking = `${carrierObj.prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
          }
          return { ...o, status, trackingCode: tracking };
        }
        return o;
      })
    );
    if (setMerchantFeedbackMessage) {
      setMerchantFeedbackMessage(`Updated ${selectedOrderIds.length} orders`);
    }
    setSelectedOrderIds([]);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Phone",
      "Email",
      "Wilaya",
      "Commune",
      "Address",
      "Items",
      "Total DZD",
      "Shipping Cost",
      "Stage Status",
      "Payment Method",
      "Carrier",
      "Tracking Code",
    ];

    const rows = filteredOrders.map((o) => [
      o.id,
      o.date,
      `"${o.shopper.name.replace(/"/g, '""')}"`,
      o.shopper.phone,
      o.shopper.email || "",
      o.shopper.wilaya,
      o.shopper.commune,
      `"${o.shopper.address.replace(/"/g, '""')}"`,
      `"${o.items.map((i) => `${i.name} (x${i.quantity})`).join("; ")}"`,
      o.total,
      o.shippingCost,
      o.status,
      o.paymentMethod,
      o.deliveryCompany || "yalidine",
      o.trackingCode || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${myStore.subdomain || "yumi_store"}_orders_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (setMerchantFeedbackMessage) {
      setMerchantFeedbackMessage(`Exported ${filteredOrders.length} orders to CSV.`);
    }
  };

  // Semantic, decluttered status indicator (icon + text label, no heavy fills)
  const renderStageIndicator = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{merchantLang === "ar" ? "واردة (قيد المراجعة)" : "Incoming"}</span>
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-800 dark:text-slate-200 whitespace-nowrap">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{merchantLang === "ar" ? "قيد التجهيز" : "Processing"}</span>
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400 whitespace-nowrap">
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span>{merchantLang === "ar" ? "تم الشحن" : "Shipped"}</span>
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{merchantLang === "ar" ? "مكتملة" : "Completed"}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-slate-400 whitespace-nowrap">
            <span>{status}</span>
          </span>
        );
    }
  };

  // WhatsApp & Phone Helpers
  const getWhatsAppLink = (order: Order) => {
    return deliveryService.generateWhatsAppConfirmation(
      {
        id: order.id,
        recipientName: order.shopper?.name || "Client",
        phone: order.shopper?.phone || "0550000000",
        totalAmountDzd: order.total || 0,
        wilayaName: order.shopper?.wilaya || "Alger",
        itemsSummary: order.items?.map((i) => `${i.name} (x${i.quantity})`).join(", "),
      },
      merchantLang as any
    );
  };

  const getPhoneCallLink = (order: Order) => {
    return deliveryService.generatePhoneCallLink(order.shopper?.phone || "");
  };

  // Stage Tabs definition (5 numbered steps matching the Product Creation stepper bar)
  const STAGE_TABS: Array<{
    step: number;
    id: OrderStageTab;
    label: string;
    subtitle: string;
    advice: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      step: 1,
      id: "all",
      label: merchantLang === "ar" ? "جميع الطلبات" : "All orders",
      subtitle: merchantLang === "ar" ? "السجل الكامل للطلبيات" : "Overview & full registry",
      advice:
        "I suggest reviewing your incoming and active orders daily to keep fulfillment times under 24 hours. Fast phone verification and accurate wilaya routing build lasting buyer trust across all 58 wilayas.",
      count: totalOrdersCount,
      icon: Layers,
    },
    {
      step: 2,
      id: "pending",
      label: merchantLang === "ar" ? "الطلبات الواردة" : "Incoming orders",
      subtitle: merchantLang === "ar" ? "بانتظار التأكيد" : "Awaiting verification",
      advice:
        "Confirm incoming Cash-on-Delivery (COD) orders promptly via phone or WhatsApp before packing. Verifying the buyer's commune and stop-desk preference reduces return rates significantly.",
      count: pendingCount,
      icon: Clock,
    },
    {
      step: 3,
      id: "accepted",
      label: merchantLang === "ar" ? "قيد التجهيز" : "Processing",
      subtitle: merchantLang === "ar" ? "تجهيز الطرد" : "Confirmed & packing",
      advice:
        "Prepare verified orders with protective artisanal packaging and print the official COD waybill clearly. Assign your preferred Algerian courier partner before handing over the parcel.",
      count: acceptedCount,
      icon: Package,
    },
    {
      step: 4,
      id: "shipped",
      label: merchantLang === "ar" ? "تم الشحن" : "Shipped",
      subtitle: merchantLang === "ar" ? "مع شركة التوصيل" : "In transit with courier",
      advice:
        "Monitor active parcels in transit across Algerian wilayas. Sharing the tracking code with your buyer via WhatsApp ensures they are ready when the courier arrives.",
      count: shippedCount,
      icon: Truck,
    },
    {
      step: 5,
      id: "delivered",
      label: merchantLang === "ar" ? "مكتملة" : "Completed",
      subtitle: merchantLang === "ar" ? "تم التسليم والتحصيل" : "Delivered & settled",
      advice:
        "Completed orders reflect successfully delivered parcels and settled COD payments. You can export your completed order ledger to CSV or Google Sheets for accounting.",
      count: deliveredCount,
      icon: CheckCircle,
    },
  ];

  const activeStageObj = STAGE_TABS.find((t) => t.id === statusFilter) || STAGE_TABS[0];

  const hasActiveFilters =
    statusFilter !== "all" ||
    searchQuery.trim() !== "" ||
    categoryFilter !== "all" ||
    carrierFilter !== "all" ||
    wilayaFilter !== "all" ||
    paymentFilter !== "all" ||
    startDate !== "" ||
    endDate !== "" ||
    onlyOfferOrders;

  const resetAllFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    setCategoryFilter("all");
    setCarrierFilter("all");
    setWilayaFilter("all");
    setPaymentFilter("all");
    setStartDate("");
    setEndDate("");
    setOnlyOfferOrders(false);
    setCurrentPage(1);
  };

  return (
    <div
      className={`flex flex-col gap-4 fade-in self-stretch text-stone-900 dark:text-slate-100 transition-all duration-300 ${
        isFocusMode
          ? "px-3 sm:px-6 md:px-10 py-5 max-w-[1440px] mx-auto w-full"
          : "py-1"
      }`}
      id="yumi-orders-redesign-module"
      style={
        {
          "--accent-color": resolvedAccentColor,
          transform: isFocusMode ? "scale(1.015)" : "scale(1)",
          transformOrigin: "top center",
          transition:
            "transform 350ms cubic-bezier(0.16, 1, 0.3, 1), padding 350ms cubic-bezier(0.16, 1, 0.3, 1)",
        } as React.CSSProperties
      }
    >
      {/* 2. RIGHT-ALIGNED VIEW MODE & FOCUS MODE CONTROL BAR (Hidden per user request) */}
      {false && (
      <div className="flex items-center justify-end gap-2.5">
        <div
          className="inline-flex items-center p-1 bg-white dark:bg-slate-900 rounded-xl border border-stone-200/90 dark:border-slate-800 shadow-2xs gap-1"
          role="group"
          aria-label="Order view mode and workspace controls"
        >
          <button
            type="button"
            onClick={() => handleToggleMode("classic")}
            style={
              currentMode === "classic"
                ? {
                    backgroundColor:
                      "var(--yume-theme-header-color, " +
                      (darkMode ? "#2563eb" : (currentSlideColor || "#0b2447")) +
                      ")",
                  }
                : undefined
            }
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              currentMode === "classic"
                ? "text-white shadow-2xs"
                : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
            }`}
            title="Simple View"
          >
            <Maximize2 className="w-3.5 h-3.5 shrink-0" />
            <span>{merchantLang === "ar" ? "العرض البسيط" : "Simple View"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleMode("advanced")}
            style={
              currentMode === "advanced"
                ? {
                    backgroundColor:
                      "var(--yume-theme-header-color, " +
                      (darkMode ? "#2563eb" : (currentSlideColor || "#0b2447")) +
                      ")",
                  }
                : undefined
            }
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              currentMode === "advanced"
                ? "text-white shadow-2xs"
                : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
            }`}
            title="Advanced View"
          >
            <Columns className="w-3.5 h-3.5 shrink-0" />
            <span>{merchantLang === "ar" ? "العرض المتقدم" : "Advanced View"}</span>
          </button>

          <div className="w-[1px] h-4 bg-stone-200 dark:bg-slate-700 mx-0.5" />

          {/* Offer Orders Filter Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setOnlyOfferOrders(!onlyOfferOrders);
              setCurrentPage(1);
            }}
            style={
              onlyOfferOrders
                ? {
                    backgroundColor:
                      "var(--yume-theme-header-color, " +
                      (darkMode ? "#2563eb" : (currentSlideColor || "#0b2447")) +
                      ")",
                    borderColor:
                      "var(--yume-theme-header-color, " +
                      (darkMode ? "#2563eb" : (currentSlideColor || "#0b2447")) +
                      ")",
                  }
                : undefined
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              onlyOfferOrders
                ? "text-white shadow-2xs"
                : "text-stone-700 dark:text-slate-300 bg-stone-50 dark:bg-slate-800/80 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-200/80 dark:border-slate-700"
            }`}
            title="Filter to only view Promotion & Offer Orders"
          >
            <img
              src="assets/aistudio/image_2a5c0b49.png"
              alt="Offer"
              className={`w-3.5 h-3.5 shrink-0 object-contain ${
                onlyOfferOrders ? "brightness-0 invert" : "dark:brightness-0 dark:invert"
              }`}
            />
            <span>{merchantLang === "ar" ? "طلبات العروض" : "Offer Orders"}</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md font-black ${
                onlyOfferOrders
                  ? "bg-white/20 text-white"
                  : "bg-stone-200/80 dark:bg-slate-700 text-stone-800 dark:text-slate-200"
              }`}
            >
              {offerOrdersCount}
            </span>
          </button>

          <div className="w-[1px] h-4 bg-stone-200 dark:bg-slate-700 mx-0.5" />

          {/* Hide Header & Sidebar (Focus Mode) */}
          <button
            type="button"
            onClick={toggleFocusMode}
            style={
              isFocusMode
                ? {
                    backgroundColor:
                      "var(--yume-theme-header-color, " +
                      (darkMode ? "#2563eb" : (currentSlideColor || "#0b2447")) +
                      ")",
                  }
                : undefined
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              isFocusMode
                ? "text-white shadow-2xs"
                : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
            }`}
            title={
              isFocusMode
                ? "Show header and dashboard bar (or press Esc)"
                : "Hide header and dashboard bar for a simpler, enhanced view"
            }
          >
            {isFocusMode ? (
              <>
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>{merchantLang === "ar" ? "إظهار القوائم (Esc)" : "Show Bars (Esc)"}</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>{merchantLang === "ar" ? "إخفاء القوائم" : "Hide Header & Sidebar"}</span>
              </>
            )}
          </button>
        </div>
      </div>
      )}

      {/* 3. CORE WORKSPACE CARD (Matches Add Product Step Card 1-to-1) */}
      <div className="w-full items-start transition-all duration-300">
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-stone-200/80 dark:border-slate-800 shadow-2xs text-left flex flex-col gap-5 animate-fade-in relative z-[50]">
          {/* Card Top Header: Step Title on Left, Hints Switch & Quick Actions on Right */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-5 rounded-full shrink-0"
                  style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
                />
                <ClipboardList className="w-4 h-4 text-stone-700 dark:text-slate-300 shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight font-sans">
                  Step {activeStageObj.step}: {activeStageObj.label}
                </h3>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 sm:ml-3.5">
                {activeStageObj.subtitle} — Manage COD verification, courier dispatch, and live order fulfillment.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleForceManualSync}
                disabled={isSyncingSheets}
                title="Refresh orders sync"
                aria-label="Refresh orders sync"
                className="p-2 rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-200/90 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? "animate-spin" : ""}`} />
              </button>

              {/* Choose Mode Dropdown Menu (no popup page) */}
              <div className="relative" ref={modeMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                  title={merchantLang === "ar" ? "اختر وضع العرض" : "Choose display mode"}
                  aria-label={merchantLang === "ar" ? "اختر وضع العرض" : "Choose display mode"}
                  aria-expanded={isModeMenuOpen}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isModeMenuOpen
                      ? "bg-stone-200 dark:bg-slate-700 text-stone-900 dark:text-white border-stone-300 dark:border-slate-600 shadow-xs"
                      : "bg-stone-50 dark:bg-slate-800/80 border border-stone-200/90 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  <Settings className={`w-3.5 h-3.5 transition-transform duration-200 ${isModeMenuOpen ? "rotate-45" : ""}`} />
                </button>

                {isModeMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xl p-2 z-[100] text-left font-sans animate-in fade-in zoom-in-95 duration-150"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="px-2.5 py-1.5 border-b border-stone-100 dark:border-slate-800 mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                        {merchantLang === "ar" ? "اختر وضع العرض" : "Workspace Display Mode"}
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        Default: Simple
                      </span>
                    </div>

                    {/* Mode 1: Simple View */}
                    {isSimpleViewAllowed && (
                      <button
                        type="button"
                        onClick={() => {
                          handleToggleMode("classic");
                          setIsModeMenuOpen(false);
                          if (setMerchantFeedbackMessage) {
                            setMerchantFeedbackMessage(
                              merchantLang === "ar" ? "تم تفعيل العرض البسيط" : "Switched to Simple View"
                            );
                          }
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-xs cursor-pointer ${
                          currentMode === "classic"
                            ? "bg-stone-100 dark:bg-slate-800/90 font-bold text-stone-900 dark:text-white"
                            : "hover:bg-stone-50 dark:hover:bg-slate-800/50 text-stone-700 dark:text-slate-300 font-medium"
                        }`}
                        role="menuitem"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              currentMode === "classic"
                                ? "bg-white dark:bg-slate-700 text-stone-900 dark:text-white shadow-2xs"
                                : "bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400"
                            }`}
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-xs leading-tight">
                              {merchantLang === "ar" ? "العرض البسيط" : "Simple View (Default)"}
                            </span>
                            <span className="text-[10px] text-stone-400 dark:text-slate-500 font-normal">
                              {merchantLang === "ar" ? "جدول الطلبيات الأساسي" : "Fast daily COD verification & dispatch"}
                            </span>
                          </div>
                        </div>
                        {currentMode === "classic" && (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </button>
                    )}

                    {/* Mode 2: Advanced View */}
                    {isAdvancedViewAllowed && (
                      <button
                        type="button"
                        onClick={() => {
                          handleToggleMode("advanced");
                          setIsModeMenuOpen(false);
                          if (setMerchantFeedbackMessage) {
                            setMerchantFeedbackMessage(
                              merchantLang === "ar" ? "تم تفعيل العرض المتقدم" : "Switched to Advanced View"
                            );
                          }
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-xs cursor-pointer mt-0.5 ${
                          currentMode === "advanced"
                            ? "bg-stone-100 dark:bg-slate-800/90 font-bold text-stone-900 dark:text-white"
                            : "hover:bg-stone-50 dark:hover:bg-slate-800/50 text-stone-700 dark:text-slate-300 font-medium"
                        }`}
                        role="menuitem"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              currentMode === "advanced"
                                ? "bg-white dark:bg-slate-700 text-stone-900 dark:text-white shadow-2xs"
                                : "bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400"
                            }`}
                          >
                            <Columns className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-xs leading-tight">
                              {merchantLang === "ar" ? "العرض المتقدم" : "Advanced View"}
                            </span>
                            <span className="text-[10px] text-stone-400 dark:text-slate-500 font-normal">
                              {merchantLang === "ar" ? "لوحة كانبان والتحليلات" : "5-Gate Tariffs, COD Ledger & Geo Maps"}
                            </span>
                          </div>
                        </div>
                        {currentMode === "advanced" && (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </button>
                    )}

                    {/* Quick Jump to Advanced Modules */}
                    {isAdvancedViewAllowed && (
                      <div className="mt-1.5 pt-1.5 border-t border-stone-100 dark:border-slate-800 space-y-0.5">
                        <span className="px-2.5 py-1 block text-[9px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                          Quick Open Operational Modules
                        </span>
                        {[
                          { id: "fulfillment", label: "Shipping & 5-Gate Tariffs", icon: Truck, enabled: advSubFeatures.shippingAndTariffs },
                          { id: "reconciliation", label: "COD Financial Reconciliation", icon: DollarSign, enabled: advSubFeatures.codAndProfit },
                          { id: "geo_map", label: "Geographic Choropleth Map", icon: Globe, enabled: advSubFeatures.geographicMap },
                          { id: "visitor_analytics", label: "Store Visitor Analytics", icon: Users, enabled: advSubFeatures.visitorAnalytics },
                        ]
                          .filter((mod) => mod.enabled)
                          .map((mod) => {
                            const ModIcon = mod.icon;
                            return (
                              <button
                                key={mod.id}
                                type="button"
                                onClick={() => {
                                  handleToggleMode("advanced");
                                  setActiveTab(mod.id as any);
                                  setIsModeMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <ModIcon className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400 shrink-0" />
                                <span>{mod.label}</span>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowOrderHints(!showOrderHints)}
                style={
                  showOrderHints
                    ? {
                        backgroundColor:
                          "var(--yume-theme-header-color, " +
                          (darkMode ? "#2563eb" : (currentSlideColor || "#0b2447")) +
                          ")",
                        borderColor:
                          "var(--yume-theme-header-color, " +
                          (darkMode ? "#2563eb" : (currentSlideColor || "#0b2447")) +
                          ")",
                      }
                    : undefined
                }
                className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  showOrderHints
                    ? "text-white shadow-xs"
                    : "bg-stone-50 dark:bg-slate-800/70 text-stone-600 dark:text-slate-300 border-stone-200/90 dark:border-slate-700 hover:border-stone-300"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Hints: {showOrderHints ? "On" : "Off"}</span>
              </button>
            </div>
          </div>

          {/* Advice Box with Header Color (Matches Add Product Advice Callout) */}
          {showOrderHints && (
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
                {activeStageObj.advice}
              </p>
            </div>
          )}

          {/* SIMPLE VIEW: Essential Critical Metrics Strip */}
          {currentMode === "classic" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 block">
                  {merchantLang === "ar" ? "إجمالي الطلبات" : "Total orders"}
                </span>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="text-xl font-black font-mono tabular-nums text-stone-900 dark:text-white">
                    {totalOrdersCount}
                  </span>
                  <span className="text-[10.5px] text-stone-500 dark:text-slate-400 font-mono tabular-nums font-bold">
                    {deliveredCount}/{totalOrdersCount} completed
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 block">
                  {merchantLang === "ar" ? "بانتظار التأكيد" : "Incoming to verify"}
                </span>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="text-xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
                    {pendingCount}
                  </span>
                  <span className="text-[10.5px] text-stone-500 dark:text-slate-400 font-bold">
                    {pendingCount === 0 ? "All verified" : "Needs verification"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 block">
                  {merchantLang === "ar" ? "قيد التجهيز والشحن" : "Processing & shipped"}
                </span>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="text-xl font-black font-mono tabular-nums text-stone-900 dark:text-white">
                    {acceptedCount + shippedCount}
                  </span>
                  <span className="text-[10.5px] text-stone-500 dark:text-slate-400 font-mono tabular-nums font-bold">
                    {acceptedCount} packing · {shippedCount} transit
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 block">
                  {merchantLang === "ar" ? "المداخيل الصافية" : "Net revenue (DZD)"}
                </span>
                <div className="mt-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-xl font-black font-mono tabular-nums text-stone-900 dark:text-white whitespace-nowrap">
                    {totalRevenue.toLocaleString()}{" "}
                    <span className="text-[11px] font-bold text-stone-500 dark:text-slate-400">DA</span>
                  </span>
                  <span className="text-[10.5px] text-stone-500 dark:text-slate-400 font-mono tabular-nums font-bold whitespace-nowrap">
                    AOV {avgOrderValue.toLocaleString()} DA
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ADVANCED VIEW: Sub-Module Navigation & Comprehensive Metrics */}
          {currentMode === "advanced" && isAdvancedViewAllowed && (
            <div className="flex flex-col gap-5">
              {/* Sub-module bar for ERP tables (Filtered by Plan Permissions) */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 dark:border-slate-800 pb-3">
                <div className="flex flex-wrap items-center gap-1 text-xs font-semibold">
                  {[
                    { id: "all", label: merchantLang === "ar" ? "جدول الطلبيات" : "Orders Workspace", icon: Package, enabled: advSubFeatures.ordersWorkspace },
                    { id: "fulfillment", label: merchantLang === "ar" ? "الشحن والتعريفات" : "Shipping & Tariffs", icon: Truck, enabled: advSubFeatures.shippingAndTariffs },
                    { id: "reconciliation", label: merchantLang === "ar" ? "التسوية المالية COD" : "COD & Profit", icon: DollarSign, enabled: advSubFeatures.codAndProfit },
                    { id: "geo_map", label: merchantLang === "ar" ? "الخريطة الجغرافية" : "Geographic Map", icon: Globe, enabled: advSubFeatures.geographicMap },
                    { id: "visitor_analytics", label: merchantLang === "ar" ? "تحليلات الزوار" : "Visitor Analytics", icon: Users, enabled: advSubFeatures.visitorAnalytics },
                    { id: "lines", label: merchantLang === "ar" ? "سطور الطلب" : "Order Lines", icon: Layers, enabled: advSubFeatures.orderLines },
                    { id: "analytics", label: merchantLang === "ar" ? "التحليلات" : "Revenue & Channels", icon: BarChart2, enabled: advSubFeatures.revenueAndChannels },
                    { id: "deliveries", label: merchantLang === "ar" ? "سجل التوصيل" : "Dispatch & Courier", icon: Truck, enabled: advSubFeatures.dispatchAndCourier },
                    { id: "customers", label: merchantLang === "ar" ? "العملاء" : "Customer LTV", icon: Users, enabled: advSubFeatures.customerLtv },
                    { id: "returns", label: merchantLang === "ar" ? "المرتجعات" : "Returns", icon: RotateCcw, enabled: advSubFeatures.returns },
                    { id: "suppliers", label: merchantLang === "ar" ? "جهات الاتصال الإضافية" : "Supplementary Contact", icon: Building, enabled: advSubFeatures.supplementaryContact },
                  ]
                    .filter((tab) => tab.enabled)
                    .map((tab) => {
                      const active = activeTab === tab.id;
                      const IconComp = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                            active
                              ? "bg-stone-900 text-white dark:bg-white dark:text-stone-950 font-bold shadow-2xs"
                              : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5 shrink-0" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                </div>

                {/* Compact Google Sheets Sync Control in Advanced Bar (Governed by connectToSheet permission) */}
                {advSubFeatures.connectToSheet && (
                  <div className="flex items-center gap-2 shrink-0">
                    {!googleUser ? (
                      <button
                        type="button"
                        onClick={handleConnectGoogleSheets}
                        disabled={isSyncingSheets}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-stone-50 text-stone-700 dark:text-slate-200 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <GoogleSheetsLogo className="w-3.5 h-3.5" />
                        <span>{isSyncingSheets ? "Connecting..." : "Connect to Sheet"}</span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2 text-xs">
                        <span className="text-stone-600 dark:text-slate-300 font-mono text-[11px]">
                          {googleUser.email}
                        </span>
                        {sheetsSpreadsheetId && (
                          <a
                            href={`https://docs.google.com/spreadsheets/d/${sheetsSpreadsheetId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stone-900 dark:text-white underline font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                          >
                            <span>Sheet</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={handleDisconnectGoogleSheets}
                          className="p-1 text-stone-500 hover:text-rose-600 cursor-pointer"
                          title="Disconnect Google Sheets"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Comprehensive Metrics Grid (Shown when on main Orders Workspace tab in Advanced View) */}
              {activeTab === "all" && (
                <>
                  {/* 5-Column Comprehensive KPI Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950/60 text-left flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span className="font-bold uppercase tracking-wider text-[10px]">Total Orders</span>
                        <ClipboardList className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                      <div className="mt-2">
                        <div className="text-xl font-black font-mono tabular-nums text-stone-900 dark:text-white">
                          {totalOrdersCount}
                        </div>
                        <div className="text-[10.5px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                          +12% vs last week
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950/60 text-left flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span className="font-bold uppercase tracking-wider text-[10px]">Net Revenue</span>
                        <span className="font-mono text-[10px] text-stone-400">DZD</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-xl font-black font-mono tabular-nums text-stone-900 dark:text-white whitespace-nowrap">
                          {totalRevenue.toLocaleString()} <span className="text-xs font-normal text-stone-500">DA</span>
                        </div>
                        <div className="text-[10.5px] font-mono tabular-nums text-stone-500 font-bold mt-0.5">
                          Basket AOV: {avgOrderValue.toLocaleString()} DA
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950/60 text-left flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span className="font-bold uppercase tracking-wider text-[10px]">Fulfillment SLA</span>
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                      <div className="mt-2">
                        <div className="text-xl font-black font-mono tabular-nums text-stone-900 dark:text-white">
                          1.8 <span className="text-xs font-normal text-stone-500">days</span>
                        </div>
                        <div className="text-[10.5px] text-stone-500 font-bold mt-0.5">Avg courier dispatch</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950/60 text-left flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span className="font-bold uppercase tracking-wider text-[10px]">Delivery Rate</span>
                        <Truck className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                      <div className="mt-2">
                        <div className="text-xl font-black font-mono tabular-nums text-stone-900 dark:text-white">
                          {deliverySuccessRate}%
                        </div>
                        <div className="text-[10.5px] font-mono tabular-nums text-stone-500 font-bold mt-0.5">
                          {deliveredCount}/{totalOrdersCount} fulfilled
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950/60 text-left flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span className="font-bold uppercase tracking-wider text-[10px]">Return Rate</span>
                        <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                      <div className="mt-2">
                        <div
                          className={`text-xl font-black font-mono tabular-nums ${
                            returnRate > 5 ? "text-rose-600" : "text-stone-900 dark:text-white"
                          }`}
                        >
                          {returnRate}%
                        </div>
                        <div className="text-[10.5px] font-mono tabular-nums text-stone-500 font-bold mt-0.5">
                          {returnCount} returns logged
                        </div>
                      </div>
                    </div>
                  </div>

              {/* Geographic Wilaya Distribution & Algerian Delivery Carriers Breakdown (Decluttered, Flat) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Wilaya Distribution */}
                <div className="p-5 rounded-xl border border-stone-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-left">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-xs font-bold text-stone-900 dark:text-white">
                        Geographic Wilaya Distribution
                      </h3>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400">
                        Order volume & COD value across Algerian wilayas
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-stone-500">58 Wilayas</span>
                  </div>

                  <div className="divide-y divide-stone-100 dark:divide-slate-800/70 max-h-[190px] overflow-y-auto pr-1">
                    {wilayaDistribution.length > 0 ? (
                      wilayaDistribution.slice(0, 6).map((item) => {
                        const pct =
                          totalOrdersCount > 0 ? Math.round((item.count / totalOrdersCount) * 100) : 0;
                        return (
                          <div
                            key={item.code}
                            className="py-2 flex items-center justify-between text-xs gap-3"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 text-left font-mono tabular-nums font-bold text-stone-400">
                                {item.code}
                              </span>
                              <span className="font-semibold text-stone-900 dark:text-white truncate">
                                {item.wilayaName}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                              <div className="w-20 h-1.5 bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className="h-full bg-stone-800 dark:bg-slate-300 rounded-full"
                                  style={{ width: `${Math.max(pct, 6)}%` }}
                                />
                              </div>
                              <span className="font-semibold text-stone-900 dark:text-white w-14 text-right">
                                {item.count} {item.count === 1 ? "order" : "orders"}
                              </span>
                              <span className="text-stone-500 text-[11px] w-20 text-right">
                                {item.total.toLocaleString()} DA
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-6 text-center text-stone-400 text-xs">
                        No regional wilaya orders logged yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Courier Network Performance */}
                <div className="p-5 rounded-xl border border-stone-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-left">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-xs font-bold text-stone-900 dark:text-white">
                        Algerian Courier Network
                      </h3>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400">
                        Active parcel routing across integrated carriers
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-stone-500">{CARRIERS.length} Couriers</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {CARRIERS.map((c) => {
                      const count = storeOrders.filter(
                        (o) => (o.deliveryCompany || "yalidine") === c.id
                      ).length;
                      const pct = totalOrdersCount > 0 ? Math.round((count / totalOrdersCount) * 100) : 0;
                      const isFiltered = carrierFilter === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            setCarrierFilter((prev) => (prev === c.id ? "all" : c.id))
                          }
                          className={`p-3 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                            isFiltered
                              ? "border-stone-900 dark:border-white bg-stone-50 dark:bg-slate-800"
                              : "border-stone-200/80 dark:border-slate-800 hover:border-stone-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-stone-900 dark:text-white truncate">
                              {c.name}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400">{c.prefix}</span>
                          </div>
                          <div className="mt-2 pt-1.5 border-t border-stone-100 dark:border-slate-800 flex items-baseline justify-between font-mono tabular-nums">
                            <span className="text-sm font-bold text-stone-900 dark:text-white">
                              {count}
                            </span>
                            <span className="text-[11px] text-stone-500">{pct}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ADVANCED MODE SECONDARY ERP SUB-TABS (Overview, Kanban, Lines, Customers, Deliveries, Returns, Suppliers, Marketing, Analytics) */}
      {currentMode === "advanced" && activeTab === "overview" && (
        <div className="flex flex-col gap-5 text-left">
          <div className="p-6 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900 space-y-2">
            <span className="text-[11px] font-mono font-semibold text-stone-500">
              Multi-Tenant E-Commerce ERP Architecture
            </span>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              Unified Algerian COD & Courier Operations
            </h3>
            <p className="text-xs text-stone-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              Links catalog inventory, customer LTV records, stage-based order fulfillment (Incoming, Processing, Shipped, Completed), Algerian courier dispatches (Yalidine, ZR Express, Kazitour), returns, and marketing ROAS into a single workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { title: "Incoming & Processing", desc: "Verify customer phone & wilaya, confirm stock, and pack COD parcels." },
              { title: "Courier Dispatch", desc: "Generate Yalidine, ZR Express, or Kazitour waybills and tracking codes." },
              { title: "Customer LTV", desc: "Track repeat shoppers across all 58 Algerian wilayas and communes." },
              { title: "Returns & Reconciliation", desc: "Log return reasons and reconcile COD settlements with carriers." },
            ].map((m, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <h4 className="text-xs font-bold text-stone-900 dark:text-white mb-1">{m.title}</h4>
                <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentMode === "advanced" && activeTab === "pipeline" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {[
            { status: "pending" as const, label: "01. Incoming Orders", subtitle: "Awaiting verification" },
            { status: "accepted" as const, label: "02. Processing", subtitle: "Confirmed & packing" },
            { status: "shipped" as const, label: "03. Shipped", subtitle: "With delivery carrier" },
            { status: "delivered" as const, label: "04. Completed", subtitle: "Delivered & COD settled" },
          ].map((col) => {
            const colOrders = storeOrders.filter((o) => o.status === col.status);
            return (
              <div
                key={col.status}
                className="p-4 bg-stone-50/70 dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 flex flex-col gap-3"
              >
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/70 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-white">{col.label}</h4>
                    <p className="text-[11px] text-stone-500">{col.subtitle}</p>
                  </div>
                  <span className="font-mono tabular-nums text-xs font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
                    {colOrders.length}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {colOrders.map((ord) => {
                    const nextStage = getNextOrderStage(ord.status);
                    return (
                      <div
                        key={ord.id}
                        className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-stone-200/80 dark:border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono tabular-nums font-bold text-stone-500 text-[11px]">
                            #{ord.id}
                          </span>
                          <span className="font-mono tabular-nums font-bold text-stone-900 dark:text-white">
                            {ord.total.toLocaleString()} DA
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 dark:text-white">{ord.shopper.name}</p>
                          <p className="text-[11px] text-stone-500">
                            {ord.shopper.wilayaCode} - {ord.shopper.wilaya} · {ord.shopper.phone}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingOrder(ord)}
                            className="text-[11px] font-semibold text-stone-600 dark:text-slate-400 hover:text-stone-900 cursor-pointer"
                          >
                            Details
                          </button>
                          {nextStage && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(ord.id, nextStage.nextStatus)}
                              className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-slate-900 text-white text-[11px] font-semibold cursor-pointer"
                            >
                              {nextStage.actionLabel}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {colOrders.length === 0 && (
                    <div className="py-8 text-center text-stone-400 text-xs">No orders in this stage</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {currentMode === "advanced" && activeTab === "lines" && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">Order Line Items</h3>
            <span className="text-xs font-mono tabular-nums text-stone-500">
              {orderLinesList.length} lines
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-slate-800 text-stone-500 font-semibold">
                  <th className="p-3">Line Reference</th>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Product</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                {orderLinesList.map((line, idx) => (
                  <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono tabular-nums text-stone-700 dark:text-slate-300">
                      {line.lineTitle}
                    </td>
                    <td className="p-3 font-mono tabular-nums font-semibold text-stone-900 dark:text-white">
                      {line.orderId}
                    </td>
                    <td className="p-3 font-semibold text-stone-900 dark:text-white">{line.productName}</td>
                    <td className="p-3 font-mono tabular-nums text-right">{line.quantity}</td>
                    <td className="p-3 font-mono tabular-nums text-right">
                      {line.unitPrice.toLocaleString()} DA
                    </td>
                    <td className="p-3 font-mono tabular-nums font-bold text-right text-stone-900 dark:text-white">
                      {line.lineTotal.toLocaleString()} DA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentMode === "advanced" && activeTab === "customers" && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">Customers Directory & LTV</h3>
            <span className="text-xs font-mono tabular-nums text-stone-500">
              {customerLTVList.length} customers
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-slate-800 text-stone-500 font-semibold">
                  <th className="p-3">Customer</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Segment</th>
                  <th className="p-3">Phone & Email</th>
                  <th className="p-3 text-right">Orders</th>
                  <th className="p-3 text-right">Lifetime Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                {customerLTVList.map((cust, idx) => (
                  <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-stone-900 dark:text-white">{cust.name}</td>
                    <td className="p-3 text-stone-600 dark:text-slate-300">
                      {cust.commune} · {cust.wilaya}
                    </td>
                    <td className="p-3 font-medium text-stone-700 dark:text-slate-300">{cust.type}</td>
                    <td className="p-3 font-mono tabular-nums text-stone-600 dark:text-slate-300">
                      {cust.phone}
                    </td>
                    <td className="p-3 font-mono tabular-nums text-right">{cust.count}</td>
                    <td className="p-3 font-mono tabular-nums font-bold text-right text-stone-900 dark:text-white">
                      {cust.ltv.toLocaleString()} DA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentMode === "advanced" && activeTab === "deliveries" && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">Courier Dispatches Log</h3>
            <span className="text-xs font-mono tabular-nums text-stone-500">
              {deliveriesList.length} dispatches
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-slate-800 text-stone-500 font-semibold">
                  <th className="p-3">Dispatch ID</th>
                  <th className="p-3">Order</th>
                  <th className="p-3">Carrier</th>
                  <th className="p-3">Delivery Type</th>
                  <th className="p-3 text-right">Fee</th>
                  <th className="p-3">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                {deliveriesList.map((del, idx) => (
                  <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono tabular-nums font-bold text-stone-900 dark:text-white">
                      {del.id}
                    </td>
                    <td className="p-3 font-mono tabular-nums text-stone-600 dark:text-slate-300">
                      {del.orderId}
                    </td>
                    <td className="p-3 font-semibold text-stone-900 dark:text-white">{del.carrier}</td>
                    <td className="p-3 text-stone-600 dark:text-slate-300">{del.type}</td>
                    <td className="p-3 font-mono tabular-nums text-right">{del.fee} DA</td>
                    <td className="p-3">{renderStageIndicator(del.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentMode === "advanced" && activeTab === "returns" && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">Returns & Refunds Log</h3>
            <span className="text-xs font-mono tabular-nums text-stone-500">
              {returnsList.length} records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-slate-800 text-stone-500 font-semibold">
                  <th className="p-3">Return ID</th>
                  <th className="p-3">Order</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-right">Refund Amount</th>
                  <th className="p-3">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                {returnsList.map((ret, idx) => (
                  <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono tabular-nums font-bold text-stone-900 dark:text-white">
                      {ret.id}
                    </td>
                    <td className="p-3 font-mono tabular-nums text-stone-600 dark:text-slate-300">
                      {ret.orderId}
                    </td>
                    <td className="p-3 font-semibold text-stone-800 dark:text-slate-200">{ret.reason}</td>
                    <td className="p-3 font-mono tabular-nums font-bold text-right">
                      {ret.refundAmount.toLocaleString()} DA
                    </td>
                    <td className="p-3 text-stone-600 dark:text-slate-300">{ret.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentMode === "advanced" && activeTab === "suppliers" && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">Suppliers & Lead Times</h3>
            <span className="text-xs font-mono tabular-nums text-stone-500">
              {suppliersList.length} suppliers
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-slate-800 text-stone-500 font-semibold">
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Origin</th>
                  <th className="p-3 text-right">Lead Time</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                {suppliersList.map((sup, idx) => (
                  <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-stone-900 dark:text-white">{sup.supplier}</td>
                    <td className="p-3 text-stone-700 dark:text-slate-300">{sup.contact}</td>
                    <td className="p-3 text-stone-600 dark:text-slate-300">{sup.country}</td>
                    <td className="p-3 font-mono tabular-nums text-right">{sup.leadTime} days</td>
                    <td className="p-3 font-mono tabular-nums text-stone-600 dark:text-slate-400">
                      {sup.phone}
                    </td>
                    <td className="p-3 text-stone-500">{sup.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentMode === "advanced" && activeTab === "marketing" && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">Acquisition Campaigns</h3>
            <span className="text-xs font-mono tabular-nums text-stone-500">
              {marketingList.length} campaigns
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-slate-800 text-stone-500 font-semibold">
                  <th className="p-3">Campaign</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3 text-right">Budget</th>
                  <th className="p-3 text-right">ROAS</th>
                  <th className="p-3 text-right">Attributed Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                {marketingList.map((mkt, idx) => (
                  <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-stone-900 dark:text-white">{mkt.campaign}</td>
                    <td className="p-3 text-stone-600 dark:text-slate-300">{mkt.channel}</td>
                    <td className="p-3 font-mono tabular-nums text-right">
                      {mkt.budget.toLocaleString()} DA
                    </td>
                    <td className="p-3 font-mono tabular-nums font-bold text-right">{mkt.roas}</td>
                    <td className="p-3 font-mono tabular-nums font-bold text-right text-stone-900 dark:text-white">
                      {mkt.revenue.toLocaleString()} DA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentMode === "advanced" && activeTab === "fulfillment" && (
        <FulfillmentHub
          store={myStore}
          orders={storeOrders}
          onUpdateOrder={handleUpdateSingleOrder}
          tariffProfiles={tariffProfiles}
          onUpdateTariffProfiles={handleUpdateTariffProfiles}
          initialSelectedOrderId={splitTargetOrderId}
          accentColor={resolvedAccentColor}
          setFeedbackMessage={setMerchantFeedbackMessage}
        />
      )}

      {currentMode === "advanced" && activeTab === "reconciliation" && (
        <FinancialReconciliationView
          store={myStore}
          orders={storeOrders}
          onUpdateOrder={handleUpdateSingleOrder}
          onUpdateOrdersBatch={handleUpdateBatchOrders}
          settlementBatches={settlementBatches}
          onSaveSettlementBatch={handleSaveSettlementBatch}
          onInspectOrder={(ord) => setViewingOrder(ord)}
          onTriggerRollback={handleTriggerRollback}
          accentColor={resolvedAccentColor}
          setFeedbackMessage={setMerchantFeedbackMessage}
        />
      )}

      {currentMode === "advanced" && activeTab === "geo_map" && (
        <GeographicAnalyticsMap
          orders={storeOrders}
          onInspectOrder={(ord) => setViewingOrder(ord)}
          accentColor={resolvedAccentColor}
          darkMode={darkMode}
        />
      )}

      {currentMode === "advanced" && activeTab === "visitor_analytics" && (
        <VisitorAnalyticsModule
          store={myStore}
          orders={storeOrders}
          darkMode={darkMode}
          accentColor={resolvedAccentColor}
        />
      )}

      {currentMode === "advanced" && activeTab === "analytics" && (
        <div className="space-y-5 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-stone-900 dark:text-white">Revenue by Period</h4>
              <div className="divide-y divide-stone-100 dark:divide-slate-800">
                {[
                  { period: "This Week", val: totalRevenue, count: totalOrdersCount, growth: "+12%" },
                  {
                    period: "Previous Week",
                    val: Math.round(totalRevenue * 0.88),
                    count: Math.max(1, totalOrdersCount - 1),
                    growth: "+8%",
                  },
                  {
                    period: "Rolling 30 Days",
                    val: Math.round(totalRevenue * 1.4),
                    count: totalOrdersCount + 3,
                    growth: "+15%",
                  },
                ].map((pt, i) => (
                  <div key={i} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-stone-900 dark:text-white">{pt.period}</span>
                      <span className="text-stone-400 ml-2 font-mono tabular-nums">
                        ({pt.count} orders)
                      </span>
                    </div>
                    <div className="font-mono tabular-nums">
                      <span className="font-bold text-stone-900 dark:text-white">
                        {pt.val.toLocaleString()} DA
                      </span>
                      <span className="ml-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                        {pt.growth}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-stone-900 dark:text-white">Order Channel Share</h4>
              <div className="divide-y divide-stone-100 dark:divide-slate-800">
                {[
                  { channel: "Direct Storefront", pct: "45%", val: Math.round(totalRevenue * 0.45) },
                  { channel: "WhatsApp COD", pct: "30%", val: Math.round(totalRevenue * 0.3) },
                  { channel: "Instagram Shop", pct: "15%", val: Math.round(totalRevenue * 0.15) },
                  { channel: "Facebook Marketplace", pct: "10%", val: Math.round(totalRevenue * 0.1) },
                ].map((item, i) => (
                  <div key={i} className="py-2.5 flex justify-between items-center text-xs">
                    <span className="font-semibold text-stone-900 dark:text-white">{item.channel}</span>
                    <div className="font-mono tabular-nums">
                      <span className="font-bold text-stone-900 dark:text-white">
                        {item.val.toLocaleString()} DA
                      </span>
                      <span className="ml-2 text-stone-500">({item.pct})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <GeographicAnalyticsMap
            orders={storeOrders}
            onInspectOrder={(ord) => setViewingOrder(ord)}
            accentColor={resolvedAccentColor}
            darkMode={darkMode}
          />
        </div>
      )}

      {/* MAIN ORDERS WORKSPACE CONTROLS & LIST (Shown in Simple View OR Advanced View's Orders tab) */}
      {(currentMode === "classic" || activeTab === "all") && (
        <div className="flex flex-col gap-5">
          {/* Two-Column Form-Style Search & Quick Filter Row (Matches Product title * / SKU code * in image_4f7e6451.png) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Left Field: Search Order Registry */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between min-h-[20px]">
                <label
                  className="text-xs font-black flex items-center gap-1 font-mono"
                  style={{ fontSize: "11px", color: "#1e1e1e" }}
                >
                  <span>
                    {merchantLang === "ar" ? "البحث في سجل الطلبات" : "Search order registry"}{" "}
                    <span style={{ color: resolvedAccentColor }}>*</span>
                  </span>
                </label>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="text-[11px] font-black transition-colors flex items-center gap-1 cursor-pointer font-mono hover:opacity-80"
                    style={{ color: resolvedAccentColor }}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{merchantLang === "ar" ? "إعادة ضبط" : "Reset Filters"}</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={
                    merchantLang === "ar"
                      ? "ابحث برقم الطلبية، اسم الزبون، الهاتف، أو الولاية..."
                      : " E.G. #ORD-94821, CUSTOMER NAME, PHONE, WILAYA..."
                  }
                  className="w-full pl-9 pr-8 py-2.5 rounded-[8px] bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 focus:bg-white transition-all text-xs font-bold text-[#0f172a] dark:text-white placeholder:text-[#64748b] outline-none font-mono"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search query"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Field: Wilaya / Courier Routing + Simulate Order Link (Matches SKU code * + Generate Code) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between min-h-[20px]">
                <label
                  className="text-xs font-black block font-mono"
                  style={{ fontSize: "11px", color: "#1e1e1e" }}
                >
                  {merchantLang === "ar" ? "تصفية الولاية وشركة التوصيل" : "Wilaya & courier routing"}{" "}
                  <span style={{ color: resolvedAccentColor }}>*</span>
                </label>
                <div className="flex items-center gap-3">
                  {handleSimulateOrder && (
                    <button
                      type="button"
                      onClick={handleSimulateOrder}
                      className="text-[11px] font-black transition-colors flex items-center gap-1 cursor-pointer font-mono hover:opacity-80"
                      style={{ color: resolvedAccentColor }}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{merchantLang === "ar" ? "محاكاة طلب" : "Simulate Order"}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="text-[11px] font-black transition-colors flex items-center gap-1 cursor-pointer font-mono text-slate-600 hover:text-slate-900"
                  >
                    <Download className="w-3 h-3" />
                    <span>{merchantLang === "ar" ? "تصدير CSV" : "Export CSV"}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <select
                  value={wilayaFilter}
                  onChange={(e) => {
                    setWilayaFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by Wilaya"
                  className="w-full px-3 py-2.5 rounded-[8px] bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 text-xs font-bold text-[#0f172a] dark:text-white outline-none cursor-pointer font-mono"
                >
                  <option value="all">ALL 58 WILAYAS</option>
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>

                <select
                  value={carrierFilter}
                  onChange={(e) => {
                    setCarrierFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by Courier"
                  className="w-full px-3 py-2.5 rounded-[8px] bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 text-xs font-bold text-[#0f172a] dark:text-white outline-none cursor-pointer font-mono"
                >
                  <option value="all">ALL COURIERS</option>
                  {CARRIERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.toUpperCase()}
                    </option>
                  ))}
                </select>

                <div className="col-span-2 sm:col-span-1 flex items-center justify-between bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-[8px] p-1">
                  <button
                    type="button"
                    onClick={() => setLayoutView("table")}
                    className={`flex-1 py-1.5 rounded-[6px] text-[11px] font-mono font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      layoutView === "table"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Table view"
                    aria-label="Table view"
                  >
                    <Table className="w-3 h-3" />
                    <span>Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutView("cards")}
                    className={`flex-1 py-1.5 rounded-[6px] text-[11px] font-mono font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      layoutView === "cards"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Cards view"
                    aria-label="Cards view"
                  >
                    <Grid className="w-3 h-3" />
                    <span>Cards</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Multi-Attribute Filters Row (Shown in Advanced View) */}
          {currentMode === "advanced" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1">
                <label
                  className="text-xs font-black block font-mono"
                  style={{ fontSize: "10.5px", color: "#1e1e1e" }}
                >
                  Product category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 text-xs font-bold text-[#0f172a] dark:text-white outline-none cursor-pointer font-mono"
                >
                  <option value="all">ALL CATEGORIES</option>
                  <option value="Crafts">CRAFTS & TEXTILES</option>
                  <option value="Food">LOCAL FOOD</option>
                  <option value="Fashion">FASHION & CAFTANS</option>
                  <option value="Home">HOME & DÉCOR</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs font-black block font-mono"
                  style={{ fontSize: "10.5px", color: "#1e1e1e" }}
                >
                  Payment method
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 text-xs font-bold text-[#0f172a] dark:text-white outline-none cursor-pointer font-mono"
                >
                  <option value="all">ALL PAYMENTS (COD / CIB / EDAHABIA)</option>
                  <option value="cod">CASH ON DELIVERY (COD)</option>
                  <option value="eddahabia">EDAHABIA CARD</option>
                  <option value="cib">CIB CARD</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs font-black block font-mono"
                  style={{ fontSize: "10.5px", color: "#1e1e1e" }}
                >
                  Active stage summary
                </label>
                <div className="px-3 py-2 rounded-[8px] bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 text-xs font-bold text-[#0f172a] dark:text-white font-mono flex items-center justify-between">
                  <span>STAGE: {activeStageObj.label.toUpperCase()}</span>
                  <span className="text-[11px] text-slate-500">{filteredOrders.length} MATCHED</span>
                </div>
              </div>
            </div>
          )}

          {/* BATCH SELECTION ACTION BAR */}
          {selectedOrderIds.length > 0 && (
            <div className="px-4 py-2.5 bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-black font-mono tabular-nums text-slate-900 dark:text-white">
                {selectedOrderIds.length} selected
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange("accepted")}
                  className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Move to Processing
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange("shipped")}
                  className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Mark Shipped
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange("delivered")}
                  className="px-3 py-1 rounded-lg text-white text-xs font-bold transition-colors cursor-pointer"
                  style={{ backgroundColor: resolvedAccentColor }}
                >
                  Mark Completed
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderIds([])}
                  className="px-2 py-1 text-slate-500 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* ORDERS LIST DISPLAY: EMPTY STATE, TABLE VIEW, OR CARDS VIEW */}
          {paginatedOrders.length === 0 ? (
            <div className="rounded-[8px] p-12 border border-[#cbd5e1] dark:border-slate-800 text-center bg-[#f8fafc] dark:bg-slate-900/40">
              <ClipboardList className="w-8 h-8 text-slate-400 mx-auto mb-2.5" strokeWidth={1.75} />
              <h3 className="text-sm font-black font-mono text-slate-900 dark:text-white">
                {statusFilter === "all"
                  ? "No orders match your current search"
                  : `No orders in ${
                      STAGE_TABS.find((t) => t.id === statusFilter)?.label || statusFilter
                    }`}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Switch to another stage step above, clear active filters, or simulate a new incoming customer order.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="px-3.5 py-2 border border-[#cbd5e1] dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-100 cursor-pointer font-mono"
                  >
                    Show All Orders
                  </button>
                )}
                {handleSimulateOrder && (
                  <button
                    type="button"
                    onClick={handleSimulateOrder}
                    className="px-3.5 py-2 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer font-mono"
                    style={{ backgroundColor: resolvedAccentColor }}
                  >
                    Simulate Incoming Order
                  </button>
                )}
              </div>
            </div>
          ) : layoutView === "table" ? (
            <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-[#cbd5e1] dark:border-slate-800 overflow-x-auto text-left">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#cbd5e1] dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-950/50 text-[#1e1e1e] dark:text-slate-300 font-black font-mono text-[11px]">
                    <th className="p-3.5 text-center w-10">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all orders"
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">Order</th>
                    <th className="p-3.5">Customer & Destination</th>
                    <th className="p-3.5">Items</th>
                    <th className="p-3.5 text-right">Total (DZD)</th>
                    {currentMode === "advanced" && <th className="p-3.5">Courier & Tracking</th>}
                    <th className="p-3.5">Stage</th>
                    <th className="p-3.5 text-right">Fulfillment Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                  {paginatedOrders.map((order) => {
                    const isSelected = selectedOrderIds.includes(order.id);
                    const nextStage = getNextOrderStage(order.status);
                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? "bg-slate-100/70 dark:bg-slate-800/60" : ""
                        }`}
                      >
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOrder(order.id)}
                            aria-label={`Select order ${order.id}`}
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer"
                          />
                        </td>

                        {/* Order ID & Date */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-mono tabular-nums font-black text-slate-900 dark:text-white">
                            #{order.id}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                            {new Date(order.date).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        {/* Customer & Destination */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {order.shopper.name}
                            </span>
                            {order.verified && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {order.shopper.country && order.shopper.country !== "Algeria" ? `${order.shopper.country} · ` : ""}
                              {order.shopper.wilayaCode} - {order.shopper.wilaya}
                              {order.shopper.commune ? `, ${order.shopper.commune}` : ""}
                            </span>
                            <span aria-hidden="true">·</span>
                            <a
                              href={`tel:${order.shopper.phone}`}
                              className="font-mono tabular-nums hover:underline text-slate-700 dark:text-slate-300"
                            >
                              {order.shopper.phone}
                            </a>
                          </div>
                          {(order.shopper.whatsapp || order.shopper.viber || order.shopper.telegram || order.shopper.email) && (
                            <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                              {order.shopper.whatsapp && <span className="text-emerald-700 font-medium">WA: {order.shopper.whatsapp}</span>}
                              {order.shopper.viber && <span className="text-purple-700 font-medium">Viber: {order.shopper.viber}</span>}
                              {order.shopper.telegram && <span className="text-sky-700 font-medium">TG: {order.shopper.telegram}</span>}
                              {order.shopper.email && <span className="text-slate-600">{order.shopper.email}</span>}
                            </div>
                          )}
                        </td>

                        {/* Items Summary */}
                        <td className="p-3.5 max-w-[280px]">
                          {(() => {
                            const parsedOffer = extractOfferFromOrder(order);
                            if (parsedOffer && parsedOffer.isOffer) {
                              return (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-black">
                                      <img
                                        src="assets/aistudio/image_2a5c0b49.png"
                                        alt="Offer"
                                        className="w-3.5 h-3.5 shrink-0 object-contain dark:brightness-0 dark:invert"
                                      />
                                      <span>Offer: {parsedOffer.tierTitle}</span>
                                    </span>
                                    <span className="font-mono text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                      {parsedOffer.totalUnits} items
                                    </span>
                                  </div>

                                  <div
                                    className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate"
                                    title={parsedOffer.units.map((u) => `#${u.unitIndex}: ${u.rawLabel}`).join(", ")}
                                  >
                                    {parsedOffer.units.slice(0, 3).map((u) => `#${u.unitIndex} ${u.size || ""}${u.size && u.color ? "·" : ""}${u.color || ""}`).join(", ")}
                                    {parsedOffer.units.length > 3 && ` +${parsedOffer.units.length - 3} more`}
                                  </div>

                                  {parsedOffer.gifts.length > 0 && (
                                    <div className="flex items-center gap-1 text-[10.5px] text-amber-700 dark:text-amber-400 font-bold truncate">
                                      <Gift className="w-3 h-3 text-amber-500 shrink-0" />
                                      <span>+ {parsedOffer.gifts.map((g) => `${g.quantity}x ${g.name}`).join(", ")} (FREE)</span>
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <>
                                <div className="text-slate-800 dark:text-slate-200 font-semibold truncate">
                                  {order.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <span>{order.items.reduce((sum, i) => sum + i.quantity, 0)} unit(s)</span>
                                  {order.items[0] && (order.items[0].color || order.items[0].size) && (
                                    <span className="text-[10px] font-sans font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {[order.items[0].color, order.items[0].size].filter(Boolean).join(" / ")}
                                    </span>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </td>

                        {/* Total Amount & v2 Profit Summary */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="font-mono tabular-nums font-black text-slate-900 dark:text-white">
                            {order.total.toLocaleString()} DA
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono font-bold">
                            Ship: +{(order.shippingCost || 0).toLocaleString()} DA ({order.deliveryMethod === "stopdesk" ? "Desk" : "Home"})
                          </div>
                          {currentMode === "advanced" && order.financials && (
                            <div className="mt-0.5">
                              {order.financials.hasMissingPurchaseCost ? (
                                <span className="inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                  COST MISSING
                                </span>
                              ) : (
                                <span
                                  className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                    (order.financials.netOperationalProfit || 0) >= 0
                                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                                      : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
                                  }`}
                                >
                                  Net: {(order.financials.netOperationalProfit || 0).toLocaleString()} DA
                                </span>
                              )}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">
                            {order.deliveryCompanyName || order.deliveryCompany || "Yalidine"} · {order.paymentMethod}
                          </div>
                        </td>

                        {/* Carrier Selector (Shown in Advanced View) */}
                        {currentMode === "advanced" && (
                          <td className="p-3.5">
                            <div className="flex flex-col gap-1">
                              <select
                                value={order.deliveryCompany || "yalidine"}
                                onChange={(e) => handleAssignCarrier(order.id, e.target.value)}
                                aria-label={`Carrier for order ${order.id}`}
                                className="text-xs font-bold font-mono py-1 px-2 bg-[#f8fafc] dark:bg-slate-800 text-slate-900 dark:text-white border border-[#cbd5e1] dark:border-slate-700 rounded-lg outline-none cursor-pointer w-fit"
                              >
                                {CARRIERS.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                              {order.trackingCode && (
                                <span className="text-[11px] font-mono tabular-nums text-slate-500">
                                  {order.trackingCode}
                                </span>
                              )}
                              {Array.isArray(order.shipments) && order.shipments.length > 1 && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 w-fit">
                                  {order.shipments.length} Split Shipments
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Stage Status + 4-Dimension Badges in Advanced View */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {renderStageIndicator(order.status)}
                            {currentMode === "advanced" && (
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300">
                                  Pay: {order.paymentStatus || "unpaid"}
                                </span>
                                {order.returnStatus && order.returnStatus !== "none" && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                                    Ret: {order.returnStatus}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Next Stage Progression Button */}
                            {nextStage && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateOrderStatus(order.id, nextStage.nextStatus)
                                }
                                style={{ backgroundColor: resolvedAccentColor, color: "#ffffff" }}
                                className="px-2.5 py-1.5 hover:opacity-95 text-white rounded-lg text-[11px] font-bold font-mono transition-all inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              >
                                <span>
                                  {merchantLang === "ar"
                                    ? nextStage.arActionLabel
                                    : nextStage.actionLabel}
                                </span>
                                <ArrowRight className="w-3 h-3 text-white" />
                              </button>
                            )}

                            {/* WhatsApp */}
                            <a
                              href={getWhatsAppLink(order)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="WhatsApp customer"
                              aria-label={`WhatsApp ${order.shopper.name}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>

                            {/* Call */}
                            <a
                              href={getPhoneCallLink(order)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-stone-200 dark:border-slate-700 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                              title="Call customer"
                              aria-label={`Call ${order.shopper.name}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>

                            {/* Track Shipment */}
                            {currentMode === "advanced" && (
                              <button
                                type="button"
                                onClick={() => setTrackingModalOrder(order)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Track courier shipment"
                                aria-label={`Track order ${order.id}`}
                              >
                                <Truck className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Print Waybill */}
                            <button
                              type="button"
                              onClick={() => setPrintingLabelOrder(order)}
                              className="p-1.5 text-slate-600 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Print shipping waybill"
                              aria-label={`Print waybill for order ${order.id}`}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Inspect Order Details (4-Dimension Lifecycle & Profit Drawer) */}
                            <button
                              type="button"
                              onClick={() => setViewingOrder(order)}
                              className="p-1.5 text-slate-600 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Open 4-Dimension Lifecycle, Call Desk & Profit Drawer"
                              aria-label={`View details for order ${order.id}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* CARDS LAYOUT */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
              {paginatedOrders.map((order) => {
                const isSelected = selectedOrderIds.includes(order.id);
                const nextStage = getNextOrderStage(order.status);
                return (
                  <div
                    key={order.id}
                    className={`p-5 rounded-[8px] bg-[#f8fafc] dark:bg-slate-900 border transition-colors flex flex-col justify-between ${
                      isSelected
                        ? "border-slate-900 dark:border-white"
                        : "border-[#cbd5e1] dark:border-slate-800"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[11px] font-mono tabular-nums font-bold text-slate-500">
                            #{order.id}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                            {order.shopper.name}
                          </h4>
                        </div>
                        {renderStageIndicator(order.status)}
                      </div>

                      <div className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {order.shopper.wilayaCode} - {order.shopper.wilaya} ({order.shopper.commune})
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5 font-mono tabular-nums">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{order.shopper.phone}</span>
                        </p>
                      </div>

                      {(() => {
                        const parsedOffer = extractOfferFromOrder(order);
                        if (parsedOffer && parsedOffer.isOffer) {
                          return (
                            <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-extrabold text-[11px] border border-indigo-200 dark:border-indigo-800">
                                  <img
                                    src="assets/aistudio/image_2a5c0b49.png"
                                    alt="Offer"
                                    className="w-3.5 h-3.5 shrink-0 object-contain dark:brightness-0 dark:invert"
                                  />
                                  <span>{parsedOffer.tierTitle} Bundle ({parsedOffer.totalUnits} Units)</span>
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                                {parsedOffer.units.map((u) => `#${u.unitIndex}: ${u.rawLabel}`).join(" · ")}
                              </div>
                              {parsedOffer.gifts.length > 0 && (
                                <div className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                                  <Gift className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>+ Free Gift: {parsedOffer.gifts.map((g) => `${g.quantity}x ${g.name}`).join(", ")}</span>
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                            {order.items.map((i) => `${i.name} ×${i.quantity}`).join(" · ")}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex justify-between items-center gap-2">
                      <div>
                        <span className="text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white">
                          {order.total.toLocaleString()} DA
                        </span>
                        <span className="block text-[10px] text-slate-500 font-mono uppercase font-bold">
                          {order.paymentMethod}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {nextStage && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, nextStage.nextStatus)}
                            style={{ backgroundColor: resolvedAccentColor, color: "#ffffff" }}
                            className="px-2.5 py-1.5 rounded-lg text-white text-xs font-bold font-mono cursor-pointer"
                          >
                            {nextStage.actionLabel}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setViewingOrder(order)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PAGINATION BAR */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 bg-[#f8fafc] dark:bg-slate-900 rounded-[8px] border border-[#cbd5e1] dark:border-slate-800 text-xs">
              <span className="text-slate-600 font-mono tabular-nums font-bold">
                Page {currentPage} of {totalPages} · {filteredOrders.length} orders
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

          {/* BOTTOM WIZARD-STYLE STAGE FOOTER (Matches Back to Dashboard / Next Step -> in image_4f7e6451.png) */}
          <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-200/80 dark:border-slate-800/40">
            {activeStageObj.step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  const prevTab = STAGE_TABS.find((t) => t.step === activeStageObj.step - 1);
                  if (prevTab) handleStageSelect(prevTab.id);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{merchantLang === "ar" ? "المرحلة السابقة" : "Previous Stage"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (isFocusMode) exitFocusMode();
                  if (setMerchantSubTab) setMerchantSubTab("overview");
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{merchantLang === "ar" ? "العودة للوحة التحكم" : "Back to Dashboard"}</span>
              </button>
            )}

            <div className="flex items-center gap-3">
              {activeStageObj.step < STAGE_TABS.length ? (
                <button
                  type="button"
                  onClick={() => {
                    const nextTab = STAGE_TABS.find((t) => t.step === activeStageObj.step + 1);
                    if (nextTab) handleStageSelect(nextTab.id);
                  }}
                  style={{
                    backgroundColor: resolvedAccentColor,
                    color: "#ffffff",
                    boxShadow: `0 10px 15px -3px color-mix(in srgb, ${resolvedAccentColor} 25%, transparent)`,
                  }}
                  className="px-6 py-2.5 rounded-xl hover:opacity-95 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>
                    {merchantLang === "ar"
                      ? "المرحلة التالية"
                      : `Next: ${
                          STAGE_TABS.find((t) => t.step === activeStageObj.step + 1)?.label ||
                          "Next Stage"
                        }`}
                  </span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStageSelect("all")}
                  style={{
                    backgroundColor: resolvedAccentColor,
                    color: "#ffffff",
                    boxShadow: `0 10px 15px -3px color-mix(in srgb, ${resolvedAccentColor} 25%, transparent)`,
                  }}
                  className="px-6 py-2.5 rounded-xl hover:opacity-95 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>{merchantLang === "ar" ? "عرض جميع الطلبات" : "Back to All Orders"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: COMPREHENSIVE 4-DIMENSION ORDER LIFECYCLE, CALL DESK & PROFIT DRAWER */}
      <OrderDetailDrawer
        order={viewingOrder}
        store={myStore}
        onClose={() => setViewingOrder(null)}
        onUpdateOrder={handleUpdateSingleOrder}
        onRestoreStockOnReturn={handleRestoreStockOnReturn}
        onOpenSplitShipmentModal={(ord) => {
          setViewingOrder(null);
          handleToggleMode("advanced");
          setSplitTargetOrderId(ord.id);
          setActiveTab("fulfillment");
        }}
        accentColor={resolvedAccentColor}
        merchantLang={merchantLang}
        setFeedbackMessage={setMerchantFeedbackMessage}
      />

      {/* MODAL 2: PRINT SHIPPING WAYBILL LABEL */}
      {printingLabelOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-stone-900 p-7 rounded-2xl max-w-md w-full shadow-2xl text-left font-sans relative border border-stone-200">
            <button
              type="button"
              onClick={() => setPrintingLabelOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
              aria-label="Close waybill modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-stone-200 pb-4 flex justify-between items-center pr-8">
              <div>
                <h3 className="text-lg font-bold">{myStore.name}</h3>
                <p className="text-xs text-stone-500">{myStore.subdomain}.platform.dz</p>
              </div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-stone-100 rounded">
                COD WAYBILL
              </span>
            </div>

            <div className="my-4 text-center p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div className="font-mono text-xl font-bold tracking-widest uppercase">
                |||| | ||| |||| | ||||
              </div>
              <span className="text-[11px] font-mono tabular-nums text-stone-500 mt-1 block">
                ORDER #{printingLabelOrder.id} · {printingLabelOrder.trackingCode || "PENDING"}
              </span>
            </div>

            <div className="space-y-1 text-xs mb-4">
              <span className="text-[11px] font-mono text-stone-400 block">Recipient:</span>
              <p className="font-bold text-sm">{printingLabelOrder.shopper.name}</p>
              <p className="font-mono tabular-nums font-semibold">
                {printingLabelOrder.shopper.phone}
              </p>
              <p>
                {printingLabelOrder.shopper.wilayaCode} - {printingLabelOrder.shopper.wilaya},{" "}
                {printingLabelOrder.shopper.commune}
              </p>
              <p className="text-stone-600">{printingLabelOrder.shopper.address}</p>
            </div>

            {/* If Offer order, print unit list and gifts on waybill */}
            {(() => {
              const parsedOffer = extractOfferFromOrder(printingLabelOrder);
              if (parsedOffer && parsedOffer.isOffer) {
                return (
                  <div className="mb-4 p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5">
                    <div className="flex justify-between font-black text-stone-800 text-[11px] uppercase tracking-wider">
                      <span>Pack Checklist: {parsedOffer.tierTitle}</span>
                      <span>{parsedOffer.totalUnits} items</span>
                    </div>
                    <div className="space-y-0.5 text-[11px] text-stone-600">
                      {parsedOffer.units.map((u) => (
                        <div key={u.unitIndex}>
                          • Item #{u.unitIndex}: {u.rawLabel || [u.size, u.color].filter(Boolean).join(" / ")}
                        </div>
                      ))}
                    </div>
                    {parsedOffer.gifts.length > 0 && (
                      <div className="pt-1 border-t border-stone-200 text-[11px] font-bold text-amber-800">
                        🎁 Gift(s): {parsedOffer.gifts.map((g) => `${g.quantity}x ${g.name}`).join(", ")} (FREE)
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            <div className="p-3 bg-stone-100 rounded-xl flex justify-between items-center font-mono tabular-nums text-xs mb-5">
              <span>COD AMOUNT TO COLLECT:</span>
              <span className="text-base font-bold text-stone-900">
                {printingLabelOrder.total.toLocaleString()} DA
              </span>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Waybill</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: WORKSPACE PREFERENCES (Removed in favor of inline mode list dropdown) */}

      {/* MODAL 4: LIVE SHIPPING TRACKING */}
      <ShippingTrackingModal
        order={trackingModalOrder}
        isOpen={!!trackingModalOrder}
        onClose={() => setTrackingModalOrder(null)}
        onUpdateStatus={(id, st) => handleUpdateOrderStatus(id, st)}
        merchantLang={merchantLang}
      />
    </div>
  );
}
