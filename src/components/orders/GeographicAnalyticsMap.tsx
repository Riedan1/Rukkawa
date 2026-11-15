import React, { useState, useMemo } from "react";
import {
  Globe,
  X,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  Download,
} from "lucide-react";
import { Order } from "../../types";
import {
  COUNTRY_GEO_TOPOLOGIES,
  computeRegionalAnalyticsByCountry,
  RegionalAnalyticsMetricRow,
  GeoRegionPolygon,
} from "../../utils/countryGeoData";

const formatPrice = (
  amount: number | null | undefined,
  currencyCode = "DZD"
): string => `${Number(amount || 0).toLocaleString()} ${currencyCode}`;

export interface GeographicAnalyticsMapProps {
  orders: Order[];
  defaultCountryCode?: string;
  currencyCode?: string;
  onSelectOrder?: (order: Order) => void;
  onInspectOrder?: (order: Order) => void;
  accentColor?: string;
  darkMode?: boolean;
}

type MapColorMode =
  | "header"
  | "orders"
  | "revenue"
  | "delivery_rate"
  | "return_rate"
  | "profit";

const COUNTRY_GROUPS: Array<{
  groupLabel: string;
  codes: string[];
}> = [
  {
    groupLabel: "MENA & Gulf States",
    codes: ["DZ", "TN", "EG", "SA", "AE", "QA", "KW", "BH", "OM"],
  },
  {
    groupLabel: "North & South America",
    codes: ["US", "CA", "MX", "BR", "AR", "PE", "CO", "CL"],
  },
  {
    groupLabel: "Europe",
    codes: ["FR", "DE", "ES", "IT", "AT", "CH", "RU", "GB"],
  },
  {
    groupLabel: "Southeast Asia",
    codes: ["ID", "MY", "TH", "VN", "PH", "SG"],
  },
];

export const GeographicAnalyticsMap: React.FC<GeographicAnalyticsMapProps> = ({
  orders,
  defaultCountryCode = "DZ",
  currencyCode = "DZD",
  onSelectOrder,
  onInspectOrder,
  accentColor,
}) => {
  const resolvedSelectOrder = onSelectOrder || onInspectOrder;
  const headerThemeColor =
    accentColor || "var(--yume-theme-header-color, #0b2447)";

  const [activeCountry, setActiveCountry] = useState<string>(
    COUNTRY_GEO_TOPOLOGIES[defaultCountryCode.toUpperCase()]
      ? defaultCountryCode.toUpperCase()
      : "DZ"
  );
  // Default to "header" so regions match the header color on the white map canvas
  const [colorMode, setColorMode] = useState<MapColorMode>("header");
  const [selectedRegionCode, setSelectedRegionCode] = useState<string | null>(
    "16"
  );
  const [isRegionLocked, setIsRegionLocked] = useState<boolean>(false);
  const [hoveredRegionCode, setHoveredRegionCode] = useState<string | null>(
    null
  );
  const [drawerOrderStatusFilter, setDrawerOrderStatusFilter] =
    useState<string>("all");
  const [drawerPage, setDrawerPage] = useState<number>(1);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [showAllLabels, setShowAllLabels] = useState<boolean>(false);
  const [focusNorthWilayas, setFocusNorthWilayas] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDraggingMap, setIsDraggingMap] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const pageSize = 5;

  const { topology, byRegionCode, rankedRegions } = useMemo(
    () => computeRegionalAnalyticsByCountry(orders, activeCountry),
    [orders, activeCountry]
  );

  const maxMetricVal = useMemo(() => {
    const vals = (
      Object.values(byRegionCode) as RegionalAnalyticsMetricRow[]
    ).map((r) => {
      if (colorMode === "orders" || colorMode === "header")
        return r.totalOrders;
      if (colorMode === "revenue") return r.confirmedNetRevenue;
      if (colorMode === "delivery_rate") return r.deliverySuccessRatePercent;
      if (colorMode === "return_rate") return r.returnRatePercent;
      return Math.max(0, r.verifiedNetProfit);
    });
    return Math.max(1, ...vals);
  }, [byRegionCode, colorMode]);

  const selectedRegionData: RegionalAnalyticsMetricRow | null = useMemo(() => {
    if (!selectedRegionCode) return rankedRegions[0] || null;
    return byRegionCode[selectedRegionCode] || rankedRegions[0] || null;
  }, [selectedRegionCode, byRegionCode, rankedRegions]);

  // Active region shown in the Side Panel:
  // Hovering any region immediately updates the side panel summary;
  // Clicking a region locks it for detailed inspection & data extraction.
  const activePanelRegionData: RegionalAnalyticsMetricRow | null =
    useMemo(() => {
      if (hoveredRegionCode && byRegionCode[hoveredRegionCode]) {
        return byRegionCode[hoveredRegionCode];
      }
      return selectedRegionData;
    }, [hoveredRegionCode, byRegionCode, selectedRegionData]);

  // Detailed extraction & order list uses the clicked/selected region (or hovered if none locked)
  const detailRegionData: RegionalAnalyticsMetricRow | null = useMemo(() => {
    if (isRegionLocked && selectedRegionData) {
      return selectedRegionData;
    }
    return activePanelRegionData;
  }, [isRegionLocked, selectedRegionData, activePanelRegionData]);

  const filteredDrawerOrders = useMemo(() => {
    if (!detailRegionData) return [];
    if (drawerOrderStatusFilter === "all") return detailRegionData.orders;
    return detailRegionData.orders.filter((o) => {
      const st = (o.orderStatus || o.status || "new").toLowerCase();
      if (drawerOrderStatusFilter === "accepted") {
        return (
          st === "confirmed" ||
          st === "processing" ||
          st === "ready_to_ship" ||
          st === "shipped" ||
          st === "out_for_delivery" ||
          st === "delivered"
        );
      }
      if (drawerOrderStatusFilter === "rejected") {
        return st === "cancelled" || st === "rejected";
      }
      if (drawerOrderStatusFilter === "returned") {
        return (
          st === "returned" ||
          st === "failed_delivery" ||
          Boolean(o.returnRequested)
        );
      }
      if (drawerOrderStatusFilter === "in_transit") {
        return st === "shipped" || st === "out_for_delivery";
      }
      return st === drawerOrderStatusFilter;
    });
  }, [detailRegionData, drawerOrderStatusFilter]);

  const totalDrawerPages = Math.max(
    1,
    Math.ceil(filteredDrawerOrders.length / pageSize)
  );
  const paginatedDrawerOrders = filteredDrawerOrders.slice(
    (drawerPage - 1) * pageSize,
    drawerPage * pageSize
  );

  const getPolygonFillColor = (
    row: RegionalAnalyticsMetricRow | undefined,
    isSelected: boolean,
    isHovered: boolean
  ) => {
    if (isHovered) return "#0284c7"; // Immediate hover highlight (Sky-600)
    if (isSelected && isRegionLocked) return "#059669"; // Clicked/locked deep-dive state (Emerald-600)
    if (isSelected) return "#0369a1"; // Default selected focus (Sky-700)

    // By default, display all regions in the same color as the header
    if (colorMode === "header") {
      return headerThemeColor;
    }

    if (!row) return headerThemeColor;

    const rawVal =
      colorMode === "orders"
        ? row.totalOrders
        : colorMode === "revenue"
        ? row.confirmedNetRevenue
        : colorMode === "delivery_rate"
        ? row.deliverySuccessRatePercent
        : colorMode === "return_rate"
        ? row.returnRatePercent
        : Math.max(0, row.verifiedNetProfit);

    if (rawVal <= 0) return headerThemeColor;
    const ratio = Math.min(1, rawVal / maxMetricVal);
    if (colorMode === "return_rate") {
      if (ratio > 0.66) return "#e11d48";
      if (ratio > 0.33) return "#f59e0b";
      return "#10b981";
    }
    if (ratio > 0.75) return "#059669";
    if (ratio > 0.45) return "#0d9488";
    if (ratio > 0.2) return "#0284c7";
    return "#1e3a5f";
  };

  // Compute dynamic SVG viewBox supporting North focus & zoom/pan
  const effectiveViewBox = useMemo(() => {
    const baseVb =
      focusNorthWilayas && topology.northFocusViewBox
        ? topology.northFocusViewBox
        : topology.viewBox;
    const parts = baseVb.split(/\s+/).map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return topology.viewBox;
    const [vx, vy, vw, vh] = parts;
    const scaledW = vw / zoomLevel;
    const scaledH = vh / zoomLevel;
    const cx = vx + vw / 2 - panOffset.x;
    const cy = vy + vh / 2 - panOffset.y;
    const nx = cx - scaledW / 2;
    const ny = cy - scaledH / 2;
    return `${nx.toFixed(1)} ${ny.toFixed(1)} ${scaledW.toFixed(1)} ${scaledH.toFixed(1)}`;
  }, [topology, focusNorthWilayas, zoomLevel, panOffset]);

  const shouldRenderRegionLabel = (
    reg: GeoRegionPolygon,
    isSelected: boolean,
    isHovered: boolean
  ): boolean => {
    if (isSelected || isHovered || showAllLabels) return true;
    if (focusNorthWilayas) return true;
    if (zoomLevel >= 2.2) return true;
    if (zoomLevel >= 1.5 && (reg.area || 0) >= 650) return true;
    return Boolean(reg.showLabelByDefault);
  };

  const handleResetMapView = () => {
    setFocusNorthWilayas(false);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Sort regions so selected and hovered regions render on top with crisp borders
  const orderedRegions = useMemo(() => {
    return [...topology.regions].sort((a, b) => {
      const aTop =
        a.code === hoveredRegionCode
          ? 2
          : a.code === selectedRegionCode
          ? 1
          : 0;
      const bTop =
        b.code === hoveredRegionCode
          ? 2
          : b.code === selectedRegionCode
          ? 1
          : 0;
      return aTop - bTop;
    });
  }, [topology.regions, selectedRegionCode, hoveredRegionCode]);

  const labelFontScale = useMemo(() => {
    const parts = topology.viewBox.split(/\s+/).map(Number);
    const baseWidth = parts[2] || 800;
    const vbRatio = Math.max(0.45, Math.min(1.25, baseWidth / 800));
    if (focusNorthWilayas) return 0.42 * vbRatio;
    return Math.max(0.32, (1 / Math.pow(zoomLevel, 0.75)) * vbRatio);
  }, [topology.viewBox, focusNorthWilayas, zoomLevel]);

  // Extract Regional Data (CSV or JSON) for the clicked/selected region
  const handleExtractRegionData = (
    format: "csv" | "json",
    overrideTarget?: RegionalAnalyticsMetricRow
  ) => {
    const target = overrideTarget || detailRegionData;
    if (!target) return;

    const targetOrders = overrideTarget
      ? overrideTarget.orders
      : filteredDrawerOrders;

    const safeCountry = topology.countryCode.toLowerCase();
    const safeRegion = `${target.regionCode}_${target.regionName.replace(/[^a-zA-Z0-9]+/g, "_")}`;
    const filterSuffix =
      drawerOrderStatusFilter === "all" ? "all" : drawerOrderStatusFilter;

    if (format === "json") {
      const payload = {
        exportedAt: new Date().toISOString(),
        countryCode: topology.countryCode,
        countryName: topology.countryName,
        regionType: topology.regionTypeLabel,
        regionCode: target.regionCode,
        regionName: target.regionName,
        statusFilter: drawerOrderStatusFilter,
        summaryMetrics: {
          visits: target.visits,
          productViews: target.productViews,
          addToCartCount: target.addToCartCount,
          conversionRatePercent: target.conversionRatePercent,
          grossSalesGmv: target.grossSalesGmv,
          confirmedNetRevenue: target.confirmedNetRevenue,
          verifiedNetProfit: target.verifiedNetProfit,
          totalOrders: target.totalOrders,
          acceptedOrders: target.acceptedOrders,
          deliveredOrders: target.deliveredOrders,
          inTransitOrders: target.inTransitOrders,
          rejectedOrders: target.rejectedOrders,
          returnedOrFailedOrders: target.returnedOrFailedOrders,
          deliverySuccessRatePercent: target.deliverySuccessRatePercent,
          returnRatePercent: target.returnRatePercent,
          topCarrierName: target.topCarrierName,
          topProductName: target.topProductName,
        },
        citiesBreakdown: target.citiesBreakdown,
        orders: targetOrders.map((o) => ({
          id: o.id,
          date: o.date,
          customerName: o.shopper?.name || "",
          phone: o.shopper?.phone || "",
          wilaya: o.shopper?.wilaya || target.regionName,
          commune: o.shopper?.commune || "",
          status: o.orderStatus || o.status,
          total: o.total,
          shippingCost: o.shippingCost || 0,
          carrier: o.deliveryCompanyName || o.deliveryCompany || "",
          items: (o.items || []).map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
        })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `yume_region_${safeCountry}_${safeRegion}_${filterSuffix}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // CSV Export
    const escapeCsv = (val: unknown) => {
      const str = String(val ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows: string[][] = [
      [
        "Country",
        "Region Code",
        "Region Name",
        "Visits",
        "Conversion Rate %",
        "Total Orders",
        "Accepted Orders",
        "Delivered Orders",
        "In Transit Orders",
        "Rejected Orders",
        "Returned Orders",
        "Gross Sales (GMV)",
        "Confirmed Net Revenue",
        "Verified Net Profit",
        "Order ID",
        "Order Date",
        "Order Status",
        "Customer Name",
        "Customer Phone",
        "City / Commune",
        "Carrier",
        "Order Total",
        "Items Summary",
      ],
    ];

    if (targetOrders.length === 0) {
      rows.push([
        topology.countryName,
        target.regionCode,
        target.regionName,
        String(target.visits),
        `${target.conversionRatePercent}%`,
        String(target.totalOrders),
        String(target.acceptedOrders),
        String(target.deliveredOrders),
        String(target.inTransitOrders),
        String(target.rejectedOrders),
        String(target.returnedOrFailedOrders),
        String(target.grossSalesGmv),
        String(target.confirmedNetRevenue),
        String(target.verifiedNetProfit),
        "—",
        "—",
        drawerOrderStatusFilter,
        "—",
        "—",
        "—",
        target.topCarrierName,
        "0",
        "Summary Only (No matching orders in filter)",
      ]);
    } else {
      for (const ord of targetOrders) {
        const itemsSummary = (ord.items || [])
          .map((i) => `${i.quantity || 1}x ${i.name}`)
          .join("; ");
        rows.push([
          topology.countryName,
          target.regionCode,
          target.regionName,
          String(target.visits),
          `${target.conversionRatePercent}%`,
          String(target.totalOrders),
          String(target.acceptedOrders),
          String(target.deliveredOrders),
          String(target.inTransitOrders),
          String(target.rejectedOrders),
          String(target.returnedOrFailedOrders),
          String(target.grossSalesGmv),
          String(target.confirmedNetRevenue),
          String(target.verifiedNetProfit),
          ord.id,
          ord.date || "",
          String(ord.orderStatus || ord.status || "new"),
          ord.shopper?.name || "",
          ord.shopper?.phone || "",
          ord.shopper?.commune || "",
          ord.deliveryCompanyName || ord.deliveryCompany || "",
          String(ord.total || 0),
          itemsSummary,
        ]);
      }
    }

    const csvContent = rows.map((r) => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yume_region_${safeCountry}_${safeRegion}_${filterSuffix}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-1.5 h-5 rounded-full shrink-0"
            style={{ backgroundColor: headerThemeColor }}
          />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight font-sans">
              Geographic Order Analytics &amp; Interactive Choropleth Map
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Authentic administrative boundaries ({topology.countryName} ·{" "}
              {topology.regions.length} {topology.regionTypeLabel}s) — Hover for
              instant stats, click to lock &amp; extract data
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Grouped 30-Country Selector */}
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-slate-500" />
            <select
              value={activeCountry}
              onChange={(e) => {
                const next = e.target.value;
                setActiveCountry(next);
                setFocusNorthWilayas(false);
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
                const defaultCode =
                  next === "DZ"
                    ? "16"
                    : COUNTRY_GEO_TOPOLOGIES[next]?.regions[0]?.code || null;
                setSelectedRegionCode(defaultCode);
                setIsRegionLocked(false);
                setHoveredRegionCode(null);
                setDrawerPage(1);
              }}
              aria-label="Select Country Map"
              className="text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] px-3 py-1.5"
            >
              {COUNTRY_GROUPS.map((grp) => (
                <optgroup key={grp.groupLabel} label={grp.groupLabel}>
                  {grp.codes.map((code) => {
                    const top = COUNTRY_GEO_TOPOLOGIES[code];
                    if (!top) return null;
                    return (
                      <option key={code} value={code}>
                        {top.countryName} ({top.regions.length}{" "}
                        {top.regionTypeLabel}s)
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Direct Region / Wilaya Selector */}
          <select
            value={selectedRegionCode || ""}
            onChange={(e) => {
              const code = e.target.value || null;
              setSelectedRegionCode(code);
              setIsRegionLocked(Boolean(code));
              setDrawerPage(1);
            }}
            aria-label={`Select ${topology.regionTypeLabel}`}
            className="text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] px-3 py-1.5 max-w-[190px]"
          >
            <option value="">Select {topology.regionTypeLabel}…</option>
            {[...topology.regions]
              .sort((a, b) =>
                a.code.localeCompare(b.code, undefined, { numeric: true })
              )
              .map((reg) => (
                <option key={reg.code} value={reg.code}>
                  {reg.code} — {reg.name} (
                  {byRegionCode[reg.code]?.totalOrders || 0})
                </option>
              ))}
          </select>

          {/* Color Mode Selector (Default: Header Color) */}
          <select
            value={colorMode}
            onChange={(e) => setColorMode(e.target.value as MapColorMode)}
            aria-label="Map Color Mode"
            className="text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-[8px] px-3 py-1.5"
          >
            <option value="header">Color: Header Theme (Default)</option>
            <option value="orders">Heat by: Order Volume</option>
            <option value="revenue">Heat by: Confirmed Net Revenue</option>
            <option value="delivery_rate">
              Heat by: Delivery Success Rate %
            </option>
            <option value="return_rate">Heat by: Return Risk %</option>
            <option value="profit">Heat by: Verified Net Profit</option>
          </select>

          <button
            type="button"
            onClick={() => setShowHints(!showHints)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 dark:border-slate-700 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
            <span>Hints: {showHints ? "On" : "Off"}</span>
          </button>
        </div>
      </div>

      {showHints && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-sky-500/20 bg-sky-500/5 dark:bg-sky-500/10">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
          <p className="text-xs leading-relaxed font-semibold text-slate-700 dark:text-slate-200">
            <strong className="font-black uppercase mr-1.5 text-sky-700 dark:text-sky-300">
              Interactive Map Workflow:
            </strong>
            <strong>1. Hover</strong> your mouse over any{" "}
            {topology.regionTypeLabel.toLowerCase()} on the white map canvas to
            highlight it and immediately view its Visits, Conversions, Sales,
            and Order Statuses (Accepted, Delivered, In Transit, Rejected,
            Returned) in the side panel. <strong>2. Click</strong> any region to
            lock it, inspect its municipalities and orders, and{" "}
            <strong>Extract Data (CSV / JSON)</strong>.
          </p>
        </div>
      )}

      {/* Map + Accessible Side Panel Layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch">
        {/* Left: White-Background Interactive SVG Map Container (Day & Night Appropriate) */}
        <div className="flex-1 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] flex flex-col justify-between min-h-[580px] lg:min-h-[660px] shadow-sm">
          {/* Map Top Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black uppercase text-slate-900 dark:text-white">
                  {topology.countryName} — {topology.regions.length}{" "}
                  {topology.regionTypeLabel}s
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {topology.macroRegion || "Administrative Map"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Hover any {topology.regionTypeLabel.toLowerCase()} for live
                metrics · Click to lock details &amp; export regional data
              </p>
            </div>

            {/* Interactive Map Viewport & Label Controls */}
            <div className="flex flex-wrap items-center gap-1.5">
              {topology.northFocusViewBox && (
                <button
                  type="button"
                  onClick={() => {
                    setFocusNorthWilayas((prev) => !prev);
                    setZoomLevel(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                    focusNorthWilayas
                      ? "bg-sky-600 text-white border-sky-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-sky-500/50"
                  }`}
                  title="Zoom into the compact Northern coastal & Tell Atlas wilayas"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>
                    {focusNorthWilayas
                      ? "Full Algeria Map"
                      : "North Wilayas Zoom"}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowAllLabels((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                  showAllLabels
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                }`}
                title="Toggle between smart decluttered labels and all labels"
              >
                {showAllLabels ? "Labels: All" : "Labels: Smart"}
              </button>

              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setZoomLevel((z) =>
                      Math.min(4.5, Number((z * 1.35).toFixed(2)))
                    )
                  }
                  className="p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel((z) => {
                      const next = Math.max(1, Number((z / 1.35).toFixed(2)));
                      if (next === 1) setPanOffset({ x: 0, y: 0 });
                      return next;
                    });
                  }}
                  className="p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border-l border-slate-200 dark:border-slate-700 cursor-pointer"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                {(zoomLevel > 1 ||
                  focusNorthWilayas ||
                  panOffset.x !== 0 ||
                  panOffset.y !== 0) && (
                  <button
                    type="button"
                    onClick={handleResetMapView}
                    className="p-1.5 text-sky-600 dark:text-sky-400 hover:bg-slate-200 dark:hover:bg-slate-700 border-l border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Reset Map View"
                    aria-label="Reset Map View"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Center: Clean White-Background Geographic SVG Canvas (Preserved in both Day & Night modes) */}
          <div
            className={`relative flex-1 w-full flex items-center justify-center overflow-hidden my-3 rounded-xl bg-white border border-slate-200 dark:border-slate-700 shadow-inner ${
              zoomLevel > 1
                ? isDraggingMap
                  ? "cursor-grabbing"
                  : "cursor-grab"
                : ""
            }`}
            style={{ backgroundColor: "#FFFFFF" }}
            onMouseDown={(e) => {
              if (zoomLevel <= 1) return;
              setIsDraggingMap(true);
              setDragStart({ x: e.clientX, y: e.clientY });
            }}
            onMouseMove={(e) => {
              if (!isDraggingMap || zoomLevel <= 1) return;
              const dx = (e.clientX - dragStart.x) * (1.5 / zoomLevel);
              const dy = (e.clientY - dragStart.y) * (1.5 / zoomLevel);
              setDragStart({ x: e.clientX, y: e.clientY });
              setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
            }}
            onMouseUp={() => setIsDraggingMap(false)}
            onMouseLeave={() => {
              setIsDraggingMap(false);
              setHoveredRegionCode(null);
            }}
          >
            {/* Subtle Map Canvas Badge */}
            <div className="absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/90 border border-slate-200 shadow-xs text-[10px] font-mono text-slate-700">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0 border border-white/50"
                style={{ backgroundColor: headerThemeColor }}
              />
              <span className="font-bold">{topology.countryName}</span>
              <span className="text-slate-400">·</span>
              <span>
                {hoveredRegionCode
                  ? `Hovering ${hoveredRegionCode}`
                  : isRegionLocked && selectedRegionCode
                  ? `Locked ${selectedRegionCode}`
                  : "Hover or click region"}
              </span>
            </div>

            <svg
              viewBox={effectiveViewBox}
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-[460px] sm:h-[540px] lg:h-[560px] max-w-[780px] mx-auto select-none transition-all duration-150"
              role="img"
              aria-label={`${topology.countryName} administrative boundary map`}
            >
              {/* Layer 1: All Administrative Region Polygons */}
              <g>
                {orderedRegions.map((reg) => {
                  const metricRow = byRegionCode[reg.code];
                  const isSelected = selectedRegionCode === reg.code;
                  const isHovered = hoveredRegionCode === reg.code;
                  const fill = getPolygonFillColor(
                    metricRow,
                    isSelected,
                    isHovered
                  );

                  return (
                    <path
                      key={reg.code}
                      id={`geo-region-${activeCountry}-${reg.code}`}
                      d={reg.svgPath}
                      fill={fill}
                      stroke={
                        isHovered
                          ? "#0f172a"
                          : isSelected && isRegionLocked
                          ? "#064e3b"
                          : "#ffffff"
                      }
                      strokeWidth={
                        isHovered
                          ? 2.0
                          : isSelected && isRegionLocked
                          ? 1.85
                          : 0.95
                      }
                      vectorEffect="non-scaling-stroke"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      onMouseEnter={() => setHoveredRegionCode(reg.code)}
                      onMouseLeave={() =>
                        setHoveredRegionCode((prev) =>
                          prev === reg.code ? null : prev
                        )
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRegionCode(reg.code);
                        setIsRegionLocked(true);
                        setDrawerPage(1);
                      }}
                      className="cursor-pointer transition-colors duration-150"
                    />
                  );
                })}
              </g>

              {/* Layer 2: Non-Overcrowded Regional Labels */}
              <g className="pointer-events-none">
                {orderedRegions.map((reg) => {
                  const metricRow = byRegionCode[reg.code];
                  const isSelected = selectedRegionCode === reg.code;
                  const isHovered = hoveredRegionCode === reg.code;
                  if (!shouldRenderRegionLabel(reg, isSelected, isHovered))
                    return null;

                  const codeFontSize = Number(
                    (10.2 * labelFontScale).toFixed(1)
                  );
                  const nameFontSize = Number((8.0 * labelFontScale).toFixed(1));
                  const ordFontSize = Number((7.5 * labelFontScale).toFixed(1));
                  const yOffsetName = Number((9.8 * labelFontScale).toFixed(1));
                  const yOffsetOrd = Number((18.5 * labelFontScale).toFixed(1));

                  return (
                    <g key={`label-${reg.code}`}>
                      <text
                        x={reg.labelX}
                        y={reg.labelY}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={codeFontSize}
                        fontWeight="800"
                        fontFamily="monospace"
                        style={{
                          paintOrder: "stroke",
                          stroke: "#091326",
                          strokeWidth: `${Number((2.6 * labelFontScale).toFixed(1))}px`,
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                        }}
                      >
                        {reg.code}
                      </text>
                      {(isSelected ||
                        isHovered ||
                        focusNorthWilayas ||
                        zoomLevel >= 1.8 ||
                        (reg.area || 0) >= 4800) && (
                        <text
                          x={reg.labelX}
                          y={reg.labelY + yOffsetName}
                          textAnchor="middle"
                          fill={isHovered ? "#fef08a" : "#f1f5f9"}
                          fontSize={nameFontSize}
                          fontWeight="700"
                          style={{
                            paintOrder: "stroke",
                            stroke: "#091326",
                            strokeWidth: `${Number((2.3 * labelFontScale).toFixed(1))}px`,
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                          }}
                        >
                          {reg.name.length > 14
                            ? `${reg.name.slice(0, 12)}…`
                            : reg.name}
                        </text>
                      )}
                      {((metricRow?.totalOrders || 0) > 0 ||
                        isSelected ||
                        isHovered) &&
                        (isSelected ||
                          isHovered ||
                          focusNorthWilayas ||
                          (reg.area || 0) >= 6500) && (
                          <text
                            x={reg.labelX}
                            y={reg.labelY + yOffsetOrd}
                            textAnchor="middle"
                            fill="#bae6fd"
                            fontSize={ordFontSize}
                            fontFamily="monospace"
                            fontWeight="700"
                            style={{
                              paintOrder: "stroke",
                              stroke: "#091326",
                              strokeWidth: `${Number((2.1 * labelFontScale).toFixed(1))}px`,
                            }}
                          >
                            {metricRow?.totalOrders || 0} ord
                          </text>
                        )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Bottom Docked Status Bar & Color Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-2 min-w-0">
              {activePanelRegionData ? (
                <>
                  <span
                    className="px-2 py-0.5 rounded text-white font-black shrink-0"
                    style={{ backgroundColor: headerThemeColor }}
                  >
                    {topology.regionTypeLabel}{" "}
                    {activePanelRegionData.regionCode}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {activePanelRegionData.regionName}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-sky-600 dark:text-sky-400 font-bold">
                    {activePanelRegionData.visits.toLocaleString()} visits
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {activePanelRegionData.totalOrders} orders
                  </span>
                </>
              ) : (
                <span className="text-slate-500">
                  Hover or click any {topology.regionTypeLabel.toLowerCase()} to
                  inspect metrics
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-xs border border-slate-300"
                  style={{ backgroundColor: headerThemeColor }}
                />{" "}
                Default (Header)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-xs bg-[#0284c7]" />{" "}
                Hovered
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-xs bg-[#059669]" />{" "}
                Clicked / Locked
              </span>
            </div>
          </div>
        </div>

        {/* Right: Minimal, Typography-Driven Regional Detail Drawer */}
        {activePanelRegionData && (
          <div className="w-full lg:w-[420px] xl:w-[440px] shrink-0 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0B0F17] p-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* 1. Selected Region Header */}
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {topology.regionTypeLabel}{" "}
                        {activePanelRegionData.regionCode}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">
                        ·
                      </span>
                      <h4 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        {activePanelRegionData.regionName}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {topology.countryName}
                      <span className="mx-1.5 text-slate-300 dark:text-slate-700">
                        ·
                      </span>
                      Primary Carrier:{" "}
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {activePanelRegionData.topCarrierName}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                      Available:{" "}
                      <span className="text-slate-600 dark:text-slate-400">
                        {activePanelRegionData.availableCarriers.join(", ")}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hoveredRegionCode ? (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        Preview
                      </span>
                    ) : isRegionLocked ? (
                      <button
                        type="button"
                        onClick={() => setIsRegionLocked(false)}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors cursor-pointer"
                        title="Unlock region selection"
                      >
                        Unlock
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegionLocked(false);
                        setHoveredRegionCode(null);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Reset selection"
                      aria-label="Reset selection"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Traffic, Conversion and Sales Summary */}
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Traffic, Conversion &amp; Sales
                  </h5>
                  {!isRegionLocked && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      Click region to lock
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Visits
                    </span>
                    <span className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5 block">
                      {activePanelRegionData.visits.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Page Views
                    </span>
                    <span className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5 block">
                      {activePanelRegionData.productViews.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Conversion
                    </span>
                    <span className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5 block">
                      {activePanelRegionData.conversionRatePercent}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Carts
                    </span>
                    <span className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5 block">
                      {activePanelRegionData.addToCartCount.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Sales
                    </span>
                    <span className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5 block truncate">
                      {formatPrice(
                        activePanelRegionData.grossSalesGmv,
                        currencyCode
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Orders
                    </span>
                    <span className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5 block">
                      {activePanelRegionData.totalOrders.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Financial Summary */}
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-5 space-y-3">
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Financial Summary
                </h5>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Confirmed Net Revenue
                    </span>
                    <span className="text-base sm:text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5 block">
                      {formatPrice(
                        activePanelRegionData.confirmedNetRevenue,
                        currencyCode
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Verified Net Profit
                    </span>
                    <span className="text-base sm:text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5 block">
                      {formatPrice(
                        activePanelRegionData.verifiedNetProfit,
                        currencyCode
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Order Status Breakdown */}
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Order Status Breakdown
                  </h5>
                  <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                    {activePanelRegionData.totalOrders} total
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  <div className="py-2 flex items-baseline justify-between">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Accepted
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-2">
                        Confirmed &amp; active
                      </span>
                    </div>
                    <div className="tabular-nums font-medium text-slate-900 dark:text-slate-100">
                      {activePanelRegionData.acceptedOrders}
                      <span className="text-slate-400 dark:text-slate-500 font-normal ml-1.5">
                        (
                        {activePanelRegionData.totalOrders > 0
                          ? Math.round(
                              (activePanelRegionData.acceptedOrders /
                                activePanelRegionData.totalOrders) *
                                100
                            )
                          : 0}
                        %)
                      </span>
                    </div>
                  </div>

                  <div className="py-2 flex items-baseline justify-between">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Delivered
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-2">
                        In transit: {activePanelRegionData.inTransitOrders}
                      </span>
                    </div>
                    <div className="tabular-nums font-medium text-slate-900 dark:text-slate-100">
                      {activePanelRegionData.deliveredOrders}
                      <span className="text-slate-400 dark:text-slate-500 font-normal ml-1.5">
                        ({activePanelRegionData.deliverySuccessRatePercent}%)
                      </span>
                    </div>
                  </div>

                  <div className="py-2 flex items-baseline justify-between">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Rejected
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-2">
                        Cancelled / declined
                      </span>
                    </div>
                    <div className="tabular-nums font-medium text-slate-900 dark:text-slate-100">
                      {activePanelRegionData.rejectedOrders}
                      <span className="text-slate-400 dark:text-slate-500 font-normal ml-1.5">
                        (
                        {activePanelRegionData.totalOrders > 0
                          ? Math.round(
                              (activePanelRegionData.rejectedOrders /
                                activePanelRegionData.totalOrders) *
                                100
                            )
                          : 0}
                        %)
                      </span>
                    </div>
                  </div>

                  <div className="py-2 flex items-baseline justify-between">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Returned / Failed Delivery
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-2">
                        Pending: {activePanelRegionData.pendingNewOrders}
                      </span>
                    </div>
                    <div className="tabular-nums font-medium text-slate-900 dark:text-slate-100">
                      {activePanelRegionData.returnedOrFailedOrders}
                      <span className="text-slate-400 dark:text-slate-500 font-normal ml-1.5">
                        ({activePanelRegionData.returnRatePercent}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Regional Data and Extraction */}
              {detailRegionData && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Regional Data &amp; Extraction
                      </h5>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {detailRegionData.regionName} records
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleExtractRegionData("csv")}
                        className="px-2.5 py-1 rounded text-[11px] font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                        title="Export regional data as CSV"
                      >
                        Export CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExtractRegionData("json")}
                        className="px-2.5 py-1 rounded text-[11px] font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                        title="Export regional data as JSON"
                      >
                        JSON
                      </button>
                    </div>
                  </div>

                  {/* Top Municipalities / Cities */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Top Municipalities / Cities
                    </span>
                    {detailRegionData.citiesBreakdown.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        No city-level orders recorded yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        {detailRegionData.citiesBreakdown
                          .slice(0, 5)
                          .map((c) => (
                            <div
                              key={c.cityName}
                              className="py-1.5 flex items-baseline justify-between"
                            >
                              <span className="text-slate-700 dark:text-slate-300">
                                {c.cityName}
                              </span>
                              <span className="tabular-nums text-slate-900 dark:text-slate-100 font-medium">
                                {c.ordersCount}{" "}
                                <span className="text-slate-400 dark:text-slate-500 font-normal">
                                  ({formatPrice(c.revenue, currencyCode)})
                                </span>
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Regional Orders */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Regional Orders ({filteredDrawerOrders.length})
                      </span>
                      <select
                        value={drawerOrderStatusFilter}
                        onChange={(e) => {
                          setDrawerOrderStatusFilter(e.target.value);
                          setDrawerPage(1);
                        }}
                        aria-label="Filter regional orders by status"
                        className="text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-transparent border border-slate-200 dark:border-slate-800 rounded px-2 py-1"
                      >
                        <option value="all">All Statuses</option>
                        <option value="accepted">Accepted / Confirmed</option>
                        <option value="delivered">Delivered</option>
                        <option value="in_transit">In Transit / Shipped</option>
                        <option value="rejected">Rejected / Cancelled</option>
                        <option value="returned">Returned / Failed</option>
                        <option value="new">New / Pending</option>
                      </select>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-48 overflow-y-auto">
                      {paginatedDrawerOrders.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 py-3">
                          No matching orders in {detailRegionData.regionName}.
                        </p>
                      ) : (
                        paginatedDrawerOrders.map((ord) => (
                          <div
                            key={ord.id}
                            onClick={() => resolvedSelectOrder?.(ord)}
                            className="py-2.5 flex items-baseline justify-between text-xs cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                          >
                            <div className="min-w-0 pr-3">
                              <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                #{ord.id} — {ord.shopper.name}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                {ord.shopper.commune} ·{" "}
                                {ord.deliveryCompanyName ||
                                  ord.deliveryCompany ||
                                  detailRegionData.topCarrierName}{" "}
                                · {ord.orderStatus || ord.status}
                              </p>
                            </div>
                            <div className="text-right shrink-0 tabular-nums">
                              <span className="font-medium text-slate-900 dark:text-slate-100 block">
                                {formatPrice(ord.total, currencyCode)}
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                Inspect
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {totalDrawerPages > 1 && (
                      <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        <button
                          type="button"
                          disabled={drawerPage <= 1}
                          onClick={() =>
                            setDrawerPage((p) => Math.max(1, p - 1))
                          }
                          className="px-2 py-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                        >
                          <ChevronLeft className="w-3 h-3" /> Prev
                        </button>
                        <span>
                          Page {drawerPage} of {totalDrawerPages}
                        </span>
                        <button
                          type="button"
                          disabled={drawerPage >= totalDrawerPages}
                          onClick={() =>
                            setDrawerPage((p) =>
                              Math.min(totalDrawerPages, p + 1)
                            )
                          }
                          className="px-2 py-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                        >
                          Next <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Regional Performance Ranking Table */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h4 className="text-xs font-black font-mono uppercase text-slate-900 dark:text-white">
            Regional Performance Ranking ({topology.countryName} ·{" "}
            {topology.regions.length} {topology.regionTypeLabel}s)
          </h4>
          <span className="text-[11px] font-mono text-slate-500">
            Click any row to lock region &amp; extract data
          </span>
        </div>
        <table className="w-full text-xs text-left font-mono border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-500">
              <th className="py-2 pr-3">{topology.regionTypeLabel}</th>
              <th className="py-2 px-3 text-right">Visits</th>
              <th className="py-2 px-3 text-right">Conv %</th>
              <th className="py-2 px-3 text-right">Orders</th>
              <th className="py-2 px-3 text-right">Accepted</th>
              <th className="py-2 px-3 text-right">Rejected</th>
              <th className="py-2 px-3 text-right">Returned</th>
              <th className="py-2 px-3 text-right">Confirmed Revenue</th>
              <th className="py-2 px-3 text-right">Verified Net Profit</th>
              <th className="py-2 px-3">Top Carrier</th>
              <th className="py-2 pl-3 text-right">Extract</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
            {rankedRegions.slice(0, 15).map((r) => (
              <tr
                key={r.regionCode}
                onMouseEnter={() => setHoveredRegionCode(r.regionCode)}
                onMouseLeave={() =>
                  setHoveredRegionCode((prev) =>
                    prev === r.regionCode ? null : prev
                  )
                }
                onClick={() => {
                  setSelectedRegionCode(r.regionCode);
                  setIsRegionLocked(true);
                  setDrawerPage(1);
                }}
                className={`cursor-pointer transition-colors ${
                  selectedRegionCode === r.regionCode
                    ? "bg-sky-500/10"
                    : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                }`}
              >
                <td className="py-2.5 pr-3 font-bold text-slate-900 dark:text-white">
                  {r.regionCode} — {r.regionName}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                  {r.visits.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right text-sky-600 dark:text-sky-400 font-bold">
                  {r.conversionRatePercent}%
                </td>
                <td className="py-2.5 px-3 text-right font-black">
                  {r.totalOrders}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                  {r.acceptedOrders}
                </td>
                <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">
                  {r.rejectedOrders}
                </td>
                <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400">
                  {r.returnedOrFailedOrders}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                  {formatPrice(r.confirmedNetRevenue, currencyCode)}
                </td>
                <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                  {formatPrice(r.verifiedNetProfit, currencyCode)}
                </td>
                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-sans font-semibold">
                  {r.topCarrierName}
                </td>
                <td className="py-2.5 pl-3 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRegionCode(r.regionCode);
                      setIsRegionLocked(true);
                      handleExtractRegionData("csv", r);
                    }}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                    title={`Export ${r.regionName} CSV`}
                  >
                    <Download className="w-3 h-3" /> CSV
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
