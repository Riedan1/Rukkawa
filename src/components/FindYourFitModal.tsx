import React, { useState, useMemo, useEffect } from "react";
import { X, Check, Info } from "lucide-react";
import {
  ProductSizingFitConfig,
  FIND_YOUR_FIT_TRANSLATIONS,
  getFitTranslation,
  formatMeasurementValue,
  calculateFitRecommendation,
  FitRecommendationInput,
  normalizeSizeShortCode,
} from "../utils/sizingFitLogic";
import SizingIllustrations from "./SizingIllustrations";

// ============================================================================
// 1. ORIGINAL YUME SIZING ICONS
// ============================================================================

/**
 * Minimalist YUME ruler/scale icon used inside the unboxed product-page button.
 * Inherits surrounding text color (black in Light Mode, white in Dark Mode).
 */
export const YumeFitIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M2.25 6.25H15.75M2.25 11.75H15.75M2.25 4.5V13.5M15.75 4.5V13.5M5.625 6.25V8.5M9 6.25V9.25M12.375 6.25V8.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Vivid YUME Blue (#0066FF) Rolled Measuring Tape Icon for the Modal Header.
 * Matches the YUME Light & Dark Mode reference design.
 */
export const YumeMeasuringTapeIcon: React.FC<{ className?: string }> = ({
  className = "w-10 h-10",
}) => (
  <svg
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Rolled Tape Top Ellipse */}
    <ellipse
      cx="18"
      cy="15"
      rx="12"
      ry="6.5"
      fill="#0066FF"
      fillOpacity="0.12"
      stroke="#0066FF"
      strokeWidth="2"
    />
    {/* Inner Core */}
    <ellipse
      cx="18"
      cy="15"
      rx="4.8"
      ry="2.4"
      fill="#0066FF"
      fillOpacity="0.25"
      stroke="#0066FF"
      strokeWidth="1.6"
    />
    {/* Rolled Tape Cylinder Body */}
    <path
      d="M6 15V26.5C6 30.1 11.4 33 18 33C21.5 33 24.6 32.2 26.8 30.9"
      stroke="#0066FF"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Extended Tape Strip */}
    <path
      d="M25 20.5L38 23.5V34.5L22 31.2V20.5"
      fill="#0066FF"
      fillOpacity="0.14"
      stroke="#0066FF"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Tick Marks on Tape */}
    <line x1="10" y1="27" x2="10" y2="31" stroke="#0066FF" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="14" y1="28" x2="14" y2="32.2" stroke="#0066FF" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="18" y1="28.5" x2="18" y2="32.8" stroke="#0066FF" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="27" y1="26" x2="27" y2="31.5" stroke="#0066FF" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="31.5" y1="27" x2="31.5" y2="32.5" stroke="#0066FF" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="35" y1="28" x2="35" y2="33.5" stroke="#0066FF" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/**
 * Custom Tab Bar Icons matching the YUME Reference Mockup:
 * - Person Icon (Body Measurements)
 * - T-Shirt Icon (Size Chart)
 * - Star Icon (Fit Recommendation)
 * - Hanger Icon (Model Details)
 */
const TabPersonIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 shrink-0" aria-hidden="true">
    <circle
      cx="10"
      cy="6"
      r="3.2"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M4.2 16.8C4.2 13.7 6.8 11.5 10 11.5C13.2 11.5 15.8 13.7 15.8 16.8"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const TabTshirtIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 shrink-0" aria-hidden="true">
    <path
      d="M7.2 3.5C8.1 4.4 11.9 4.4 12.8 3.5L16.8 5.2L18 8.6L15.2 9.6L14.4 7.5V16.5H5.6V7.5L4.8 9.6L2 8.6L3.2 5.2L7.2 3.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const TabStarIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 shrink-0" aria-hidden="true">
    <path
      d="M10 2.6L12.2 7.1L17.2 7.8L13.6 11.3L14.4 16.2L10 13.9L5.6 16.2L6.4 11.3L2.8 7.8L7.8 7.1L10 2.6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const TabHangerIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 shrink-0" aria-hidden="true">
    <path
      d="M10 6.5C10 5.3 11.8 4.8 11.8 3.6C11.8 2.6 11 1.8 10 1.8C9 1.8 8.2 2.5 8.2 3.4M10 6.5L2.4 12.6C1.6 13.2 2.1 14.5 3.1 14.5H16.9C17.9 14.5 18.4 13.2 17.6 12.6L10 6.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ============================================================================
// 2. CUSTOMER-FACING "FIND YOUR FIT" BUTTON
// ============================================================================

interface FindYourFitButtonProps {
  onClick: () => void;
  currentLanguage?: string;
}

/**
 * Original YUME "Find Your Fit" button displayed beside the Size selector.
 * Minimal, unboxed, zero colored background, zero gradient, zero header color tracking.
 * Light Mode: black text (`text-stone-950`). Dark Mode: white text (`dark:text-white`).
 */
export const FindYourFitButton: React.FC<FindYourFitButtonProps> = ({
  onClick,
  currentLanguage = "en",
}) => {
  const t = getFitTranslation(currentLanguage);
  const isRtl = currentLanguage === "ar";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      dir={isRtl ? "rtl" : "ltr"}
      data-testid="find-your-fit-button"
      className="inline-flex items-center gap-1.5 bg-transparent border-0 p-0 text-[12.5px] sm:text-[13px] font-semibold text-stone-950 dark:text-white hover:opacity-75 transition-opacity cursor-pointer select-none whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:underline"
    >
      <YumeFitIcon className="w-3.5 h-3.5 text-stone-950 dark:text-white shrink-0" />
      <span className="underline decoration-stone-400 dark:decoration-slate-500 group-hover:decoration-stone-950 dark:group-hover:decoration-white underline-offset-4">
        {t.buttonLabel}
      </span>
    </button>
  );
};

// ============================================================================
// 3. CUSTOMER-FACING "FIND YOUR FIT" MODAL WINDOW
// ============================================================================

type FindYourFitTabId = "body_measurements" | "size_chart" | "fit_recommendation" | "model_details";

interface FindYourFitModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  config: ProductSizingFitConfig;
  selectedSize?: string;
  onSelectSize?: (sizeLabel: string) => void;
  currentLanguage?: string;
}

export const FindYourFitModal: React.FC<FindYourFitModalProps> = ({
  isOpen,
  onClose,
  config,
  selectedSize,
  onSelectSize,
  currentLanguage = "en",
}) => {
  const lang = currentLanguage === "ar" ? "ar" : currentLanguage === "fr" ? "fr" : "en";
  const isRtl = lang === "ar";
  const t = FIND_YOUR_FIT_TRANSLATIONS[lang];

  const [displayUnit, setDisplayUnit] = useState<"cm" | "in">(config?.primaryUnit || "cm");
  const [chartMode, setChartMode] = useState<"body" | "garment">("body");
  const [activeSizeRowId, setActiveSizeRowId] = useState<string>("");
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);

  // Fit Recommendation Customer Inputs
  const [recInput, setRecInput] = useState<FitRecommendationInput>({
    heightCm: undefined,
    weightKg: undefined,
    bustOrChestCm: undefined,
    waistCm: undefined,
    hipsCm: undefined,
    footLengthCm: undefined,
    footWidthCm: undefined,
    fitPreference: "regular",
  });

  // Sync active size row with product page's selectedSize when modal opens
  useEffect(() => {
    if (!config?.rows || config.rows.length === 0) return;
    if (selectedSize) {
      const shortSel = normalizeSizeShortCode(selectedSize).toLowerCase();
      const matched = config.rows.find(
        (r) =>
          r.sizeLabel.toLowerCase() === shortSel ||
          r.sizeLabel.toLowerCase() === selectedSize.toLowerCase()
      );
      if (matched) {
        setActiveSizeRowId(matched.id);
        return;
      }
    }
    setActiveSizeRowId(config.rows[0].id);
  }, [config?.rows, selectedSize, isOpen]);

  // Determine which columns have data for Body vs Garment charts
  const enabledColumns = useMemo(
    () => (config?.columns || []).filter((c) => c.enabled),
    [config?.columns]
  );

  const hasBodyChartData = useMemo(() => {
    const bodyCols = enabledColumns.filter((c) => c.chartType === "body" || c.chartType === "both");
    return bodyCols.some((c) =>
      (config?.rows || []).some((r) => Boolean(r.bodyValues?.[c.key]?.trim()))
    );
  }, [enabledColumns, config?.rows]);

  const hasGarmentChartData = useMemo(() => {
    const garmentCols = enabledColumns.filter(
      (c) => c.chartType === "garment" || c.chartType === "both"
    );
    return garmentCols.some((c) =>
      (config?.rows || []).some((r) => Boolean(r.garmentValues?.[c.key]?.trim()))
    );
  }, [enabledColumns, config?.rows]);

  useEffect(() => {
    if (!hasBodyChartData && hasGarmentChartData) {
      setChartMode("garment");
    } else if (hasBodyChartData && !hasGarmentChartData) {
      setChartMode("body");
    }
  }, [hasBodyChartData, hasGarmentChartData]);

  // Determine which tabs are dynamically available for this category and merchant data
  const availableTabs = useMemo(() => {
    const tabs: Array<{ id: FindYourFitTabId; label: string }> = [];

    if (hasBodyChartData || hasGarmentChartData) {
      tabs.push({ id: "body_measurements", label: t.tabBodyMeasurements });
    }

    tabs.push({ id: "size_chart", label: t.tabSizeChart });

    // Show Fit Recommendation tab when numeric range/value columns exist
    const hasRecommendableColumns = enabledColumns.some((c) =>
      ["bust", "chest", "waist", "hips", "height", "foot_length", "insole_length"].includes(c.key)
    );
    if (hasRecommendableColumns && (config?.rows || []).length > 0) {
      tabs.push({ id: "fit_recommendation", label: t.tabFitRecommendation });
    }

    // Show Model Details tab ONLY when merchant has enabled and entered model details
    const md = config?.modelDetails;
    const hasModelInfo = Boolean(
      md?.enabled &&
        (md.sizeWorn?.trim() ||
          md.heightCm?.trim() ||
          md.bustOrChestCm?.trim() ||
          md.waistCm?.trim() ||
          md.hipsCm?.trim() ||
          md.customNotes?.trim())
    );
    if (hasModelInfo) {
      tabs.push({ id: "model_details", label: t.tabModelDetails });
    }

    return tabs;
  }, [hasBodyChartData, hasGarmentChartData, enabledColumns, config?.rows, config?.modelDetails, t]);

  const [activeTab, setActiveTab] = useState<FindYourFitTabId>("body_measurements");

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some((tb) => tb.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  // Active row for Body Measurements diagram
  const activeRow = useMemo(() => {
    if (!config?.rows || config.rows.length === 0) return null;
    return config.rows.find((r) => r.id === activeSizeRowId) || config.rows[0];
  }, [config?.rows, activeSizeRowId]);

  // Active columns for the currently selected chartMode in Size Chart tab
  const activeTableColumns = useMemo(() => {
    return enabledColumns.filter((col) => {
      if (chartMode === "body") {
        return (
          (col.chartType === "body" || col.chartType === "both") &&
          (config?.rows || []).some((r) => Boolean(r.bodyValues?.[col.key]?.trim()))
        );
      }
      return (
        (col.chartType === "garment" || col.chartType === "both") &&
        (config?.rows || []).some((r) => Boolean(r.garmentValues?.[col.key]?.trim()))
      );
    });
  }, [enabledColumns, chartMode, config?.rows]);

  // International conversions columns check
  const activeIntlKeys = useMemo(() => {
    if (config?.showInternationalConversions === false) return [] as Array<"dz" | "eu" | "us" | "uk">;
    const keys: Array<"dz" | "eu" | "us" | "uk"> = ["dz", "eu", "us", "uk"];
    return keys.filter((k) =>
      (config?.rows || []).some((r) => Boolean(r.internationalConversions?.[k]?.trim()))
    );
  }, [config?.rows, config?.showInternationalConversions]);

  // Fit Recommendation live result
  const recommendation = useMemo(
    () => calculateFitRecommendation(config, recInput),
    [config, recInput]
  );

  if (!isOpen || !config) return null;

  const handleApplySize = (sizeStr: string) => {
    if (onSelectSize) {
      onSelectSize(sizeStr);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
      dir={isRtl ? "rtl" : "ltr"}
      role="dialog"
      aria-modal="true"
      aria-labelledby="find-your-fit-modal-title"
    >
      {/* Solid Pure White in Light Mode (#FFFFFF), Solid Deep Charcoal-Navy in Dark Mode (#0D131F) */}
      <div
        className="w-full sm:max-w-5xl lg:max-w-[1060px] max-h-[96vh] sm:max-h-[95vh] sm:min-h-[780px] bg-white dark:bg-[#0D131F] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1E293B] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================================
            1. TOP HEADER (MEASURING TAPE ICON + TITLE + SUBTITLE + CLOSE X)
           ================================================================ */}
        <div className="px-5 sm:px-7 pt-5 pb-3.5 flex items-start justify-between gap-4 shrink-0 bg-white dark:bg-[#0D131F]">
          <div className="flex items-center gap-3.5 min-w-0">
            <YumeMeasuringTapeIcon className="w-11 h-11 shrink-0" />
            <div className="min-w-0">
              <h2
                id="find-your-fit-modal-title"
                className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight"
              >
                {t.modalTitle}
              </h2>
              <p className="text-xs sm:text-[13.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                {t.modalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Find Your Fit window"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================================================================
            2. 4-TAB NAVIGATION BAR IN ROUNDED CONTAINER WITH ICONS
           ================================================================ */}
        <div className="px-5 sm:px-7 pb-3 shrink-0 bg-white dark:bg-[#0D131F]">
          <div
            className="grid grid-cols-2 sm:flex sm:items-stretch rounded-2xl bg-[#F4F6FA] dark:bg-[#161F30] border border-slate-200/80 dark:border-[#1E293B] overflow-hidden"
            role="tablist"
          >
            {availableTabs.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 py-3 px-3 sm:px-4 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs sm:text-[13.5px] font-bold transition-colors cursor-pointer select-none ${
                    idx > 0 ? "sm:border-l border-slate-200/90 dark:border-slate-700/70" : ""
                  } ${
                    isActive
                      ? "bg-[#E9F1FF]/80 dark:bg-[#1C2840] text-[#0066FF] dark:text-white"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <span className={isActive ? "text-[#0066FF] dark:text-[#2E88FF]" : "text-slate-600 dark:text-slate-300"}>
                    {tab.id === "body_measurements" && <TabPersonIcon active={isActive} />}
                    {tab.id === "size_chart" && <TabTshirtIcon />}
                    {tab.id === "fit_recommendation" && <TabStarIcon />}
                    {tab.id === "model_details" && <TabHangerIcon />}
                  </span>
                  <span className="leading-tight text-center">{tab.label}</span>

                  {/* Vivid Blue Bottom Active Bar */}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-t-full bg-[#0066FF]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ================================================================
            3. SCROLLABLE MODAL BODY
           ================================================================ */}
        <div className="px-5 sm:px-7 py-3 overflow-y-auto flex-1 space-y-4 bg-white dark:bg-[#0D131F]">
          {/* UNIT PILL TOGGLE (CM | IN) + SIZE SELECTOR ROW */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Pill-Shaped CM | IN Toggle matching Mockup */}
            <div
              className="inline-flex items-center p-1 rounded-full bg-[#EEF2F6] dark:bg-[#161F30] border border-slate-200/80 dark:border-[#1E293B]"
              role="group"
              aria-label="Measurement unit toggle"
            >
              <button
                type="button"
                onClick={() => setDisplayUnit("cm")}
                className={`px-4 py-1 text-xs font-extrabold rounded-full transition-all cursor-pointer ${
                  displayUnit === "cm"
                    ? "bg-[#0066FF] text-white shadow-xs"
                    : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                {t.unitCm}
              </button>
              <button
                type="button"
                onClick={() => setDisplayUnit("in")}
                className={`px-4 py-1 text-xs font-extrabold rounded-full transition-all cursor-pointer ${
                  displayUnit === "in"
                    ? "bg-[#0066FF] text-white shadow-xs"
                    : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                {t.unitIn}
              </button>
            </div>

            {/* Interactive Size Selector Pills for Live Inspection */}
            {activeTab === "body_measurements" && config.rows.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1 hidden sm:inline">
                  {t.labelSizeHeader}:
                </span>
                {config.rows.map((row) => {
                  const isActive = activeRow?.id === row.id;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setActiveSizeRowId(row.id)}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? "bg-[#0066FF] text-white border-[#0066FF] shadow-2xs"
                          : "bg-[#F4F6FA] dark:bg-[#161F30] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#0066FF]"
                      }`}
                    >
                      {row.sizeLabel}
                    </button>
                  );
                })}
                {activeRow && onSelectSize && (
                  <button
                    type="button"
                    onClick={() => handleApplySize(activeRow.sizeLabel)}
                    className="ml-1 px-3 py-1 rounded-full text-xs font-bold border border-[#0066FF] text-[#0066FF] dark:text-[#3B82F6] hover:bg-[#0066FF] hover:text-white transition-colors cursor-pointer"
                  >
                    {t.applySizeButton} ({activeRow.sizeLabel})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ================================================================
              TAB 1: BODY & GARMENT MEASUREMENTS (4-COLUMN MOCKUP LAYOUT)
             ================================================================ */}
          {activeTab === "body_measurements" && (
            <div className="pt-1">
              <SizingIllustrations
                profile={config.subcategoryProfile}
                activeRow={activeRow}
                columns={enabledColumns}
                primaryUnit={config.primaryUnit}
                displayUnit={displayUnit}
                highlightedKey={highlightedKey}
                onSelectKey={setHighlightedKey}
                currentLanguage={lang}
              />
            </div>
          )}

          {/* ================================================================
              TAB 2: DYNAMIC SIZE CHART (BODY CHART / GARMENT CHART SWITCH)
             ================================================================ */}
          {activeTab === "size_chart" && (
            <div className="space-y-4">
              {/* Top Controls: Body Chart / Product Chart Switch + Garment Cut & Elasticity Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {hasBodyChartData && hasGarmentChartData ? (
                  <div
                    className="inline-flex items-center p-1 rounded-full bg-[#EEF2F6] dark:bg-[#161F30] border border-slate-200 dark:border-[#1E293B]"
                    role="group"
                    aria-label="Chart mode selector"
                  >
                    <button
                      type="button"
                      onClick={() => setChartMode("body")}
                      className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                        chartMode === "body"
                          ? "bg-[#0066FF] text-white shadow-2xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                      }`}
                    >
                      {t.bodyChartToggle}
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMode("garment")}
                      className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                        chartMode === "garment"
                          ? "bg-[#0066FF] text-white shadow-2xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                      }`}
                    >
                      {t.garmentChartToggle}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {hasBodyChartData ? t.bodyChartToggle : t.garmentChartToggle}
                  </span>
                )}

                {/* Typography Metadata for Fit Type & Stretch Level */}
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  {config.fitType && (
                    <span>
                      {t.fitTypeLabel}:{" "}
                      <strong className="text-slate-900 dark:text-white">
                        {config.fitType === "slim"
                          ? t.fitSlim
                          : config.fitType === "relaxed"
                          ? t.fitRelaxed
                          : config.fitType === "oversized"
                          ? t.fitOversized
                          : config.fitType === "tailored"
                          ? t.fitTailored
                          : t.fitRegular}
                      </strong>
                    </span>
                  )}
                  {config.fitType && config.stretchLevel && <span aria-hidden="true">·</span>}
                  {config.stretchLevel && (
                    <span>
                      {t.stretchLevelLabel}:{" "}
                      <strong className="text-slate-900 dark:text-white">
                        {config.stretchLevel === "non_stretch"
                          ? t.stretchNone
                          : config.stretchLevel === "medium_stretch"
                          ? t.stretchMedium
                          : config.stretchLevel === "high_stretch"
                          ? t.stretchHigh
                          : t.stretchSlight}
                      </strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Dynamic Category-Aware Size Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-[#1E293B] rounded-2xl">
                <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
                  <thead>
                    <tr className="bg-[#F4F6FA] dark:bg-[#161F30] border-b border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-200">
                      <th className="py-3 px-4 font-bold whitespace-nowrap">{t.labelSizeHeader}</th>
                      {activeIntlKeys.map((ik) => (
                        <th key={ik} className="py-3 px-3 font-semibold whitespace-nowrap text-center">
                          {ik === "dz"
                            ? t.intlDzHeader
                            : ik === "eu"
                            ? t.intlEuHeader
                            : ik === "us"
                            ? t.intlUsHeader
                            : t.intlUkHeader}
                        </th>
                      ))}
                      {activeTableColumns.map((col) => (
                        <th key={col.key} className="py-3 px-3.5 font-bold whitespace-nowrap text-center">
                          {col.label[lang]}
                          {col.unitType === "length" && (
                            <span className="text-[10.5px] font-mono font-normal text-slate-400 dark:text-slate-400 ml-1">
                              ({displayUnit.toUpperCase()})
                            </span>
                          )}
                        </th>
                      ))}
                      {onSelectSize && <th className="py-3 px-3 text-right whitespace-nowrap"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-[#1E293B]">
                    {config.rows.map((row) => {
                      const isCurrentSelected =
                        Boolean(selectedSize) &&
                        (normalizeSizeShortCode(selectedSize).toLowerCase() ===
                          row.sizeLabel.toLowerCase() ||
                          selectedSize?.toLowerCase() === row.sizeLabel.toLowerCase());

                      return (
                        <tr
                          key={row.id}
                          onClick={() => setActiveSizeRowId(row.id)}
                          className={`transition-colors cursor-pointer ${
                            isCurrentSelected
                              ? "bg-[#0066FF]/8 dark:bg-[#0066FF]/15 font-semibold"
                              : "hover:bg-slate-50 dark:hover:bg-[#161F30]/60"
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            <span>{row.sizeLabel}</span>
                            {isCurrentSelected && (
                              <span className="ml-2 text-[10px] font-sans font-semibold text-[#0066FF] dark:text-[#3B82F6]">
                                · {t.currentlySelectedBadge}
                              </span>
                            )}
                          </td>
                          {activeIntlKeys.map((ik) => (
                            <td
                              key={ik}
                              className="py-3 px-3 font-mono text-center text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap"
                            >
                              {row.internationalConversions?.[ik] || "—"}
                            </td>
                          ))}
                          {activeTableColumns.map((col) => {
                            const rawCell =
                              chartMode === "body"
                                ? row.bodyValues?.[col.key]
                                : row.garmentValues?.[col.key];
                            const formatted = formatMeasurementValue(
                              rawCell,
                              config.primaryUnit,
                              displayUnit,
                              col.unitType
                            );
                            return (
                              <td
                                key={col.key}
                                className="py-3 px-3.5 font-mono text-center text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap"
                              >
                                {formatted}
                              </td>
                            );
                          })}
                          {onSelectSize && (
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplySize(row.sizeLabel);
                                }}
                                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                                  isCurrentSelected
                                    ? "bg-[#0066FF] text-white"
                                    : "border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-[#0066FF] hover:text-white hover:border-[#0066FF]"
                                }`}
                              >
                                {isCurrentSelected ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Check className="w-3 h-3" /> {t.currentlySelectedBadge}
                                  </span>
                                ) : (
                                  t.applySizeButton
                                )}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Manual Measurement Tolerance Footnote */}
              <div className="flex items-start gap-2 text-[11.5px] text-slate-500 dark:text-slate-400">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#0066FF]" />
                <span>{config.measurementDisclaimer || t.manualDisclaimer}</span>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 3: FIT RECOMMENDATION (PRIMARY + CLOSER / RELAXED ALTERNATIVES)
             ================================================================ */}
          {activeTab === "fit_recommendation" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.fitRecTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.fitRecSubtitle}
                </p>
              </div>

              {/* Dynamic Customer Measurement Inputs Based on Subcategory Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-2xl border border-slate-200 dark:border-[#1E293B] bg-[#F4F6FA] dark:bg-[#161F30]">
                {config.subcategoryProfile === "shoes" ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        {t.inputFootLength} *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="10"
                        max="35"
                        placeholder="e.g. 25.5"
                        value={recInput.footLengthCm ?? ""}
                        onChange={(e) =>
                          setRecInput({
                            ...recInput,
                            footLengthCm: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D131F] text-slate-900 dark:text-white outline-none focus:border-[#0066FF]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        {t.inputFootWidth}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="5"
                        max="15"
                        placeholder="e.g. 9.8"
                        value={recInput.footWidthCm ?? ""}
                        onChange={(e) =>
                          setRecInput({
                            ...recInput,
                            footWidthCm: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D131F] text-slate-900 dark:text-white outline-none focus:border-[#0066FF]"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        {t.inputHeight}
                      </label>
                      <input
                        type="number"
                        min="45"
                        max="220"
                        placeholder={config.subcategoryProfile === "baby_clothing" ? "e.g. 68" : "e.g. 168"}
                        value={recInput.heightCm ?? ""}
                        onChange={(e) =>
                          setRecInput({
                            ...recInput,
                            heightCm: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D131F] text-slate-900 dark:text-white outline-none focus:border-[#0066FF]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        {t.inputWeight}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="2"
                        max="180"
                        placeholder={config.subcategoryProfile === "baby_clothing" ? "e.g. 7.5" : "e.g. 62"}
                        value={recInput.weightKg ?? ""}
                        onChange={(e) =>
                          setRecInput({
                            ...recInput,
                            weightKg: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D131F] text-slate-900 dark:text-white outline-none focus:border-[#0066FF]"
                      />
                    </div>
                    {config.subcategoryProfile !== "trousers_shorts" && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                          {config.subcategoryProfile === "womens_clothing" ||
                          config.subcategoryProfile === "dresses_abayas"
                            ? t.inputBust
                            : t.inputChest}
                        </label>
                        <input
                          type="number"
                          min="35"
                          max="160"
                          placeholder="e.g. 92"
                          value={recInput.bustOrChestCm ?? ""}
                          onChange={(e) =>
                            setRecInput({
                              ...recInput,
                              bustOrChestCm: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D131F] text-slate-900 dark:text-white outline-none focus:border-[#0066FF]"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        {t.inputWaist}
                      </label>
                      <input
                        type="number"
                        min="35"
                        max="150"
                        placeholder="e.g. 74"
                        value={recInput.waistCm ?? ""}
                        onChange={(e) =>
                          setRecInput({
                            ...recInput,
                            waistCm: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D131F] text-slate-900 dark:text-white outline-none focus:border-[#0066FF]"
                      />
                    </div>
                    {(config.subcategoryProfile === "womens_clothing" ||
                      config.subcategoryProfile === "dresses_abayas" ||
                      config.subcategoryProfile === "trousers_shorts") && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                          {t.inputHips}
                        </label>
                        <input
                          type="number"
                          min="40"
                          max="165"
                          placeholder="e.g. 96"
                          value={recInput.hipsCm ?? ""}
                          onChange={(e) =>
                            setRecInput({
                              ...recInput,
                              hipsCm: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D131F] text-slate-900 dark:text-white outline-none focus:border-[#0066FF]"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Fit Preference Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    {lang === "ar" ? "تفضيل الملاءمة" : lang === "fr" ? "Préférence de coupe" : "Fit Preference"}
                  </label>
                  <select
                    value={recInput.fitPreference || "regular"}
                    onChange={(e) =>
                      setRecInput({
                        ...recInput,
                        fitPreference: e.target.value as "closer" | "regular" | "relaxed",
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D131F] text-slate-900 dark:text-white outline-none cursor-pointer focus:border-[#0066FF]"
                  >
                    <option value="closer">{t.prefCloser}</option>
                    <option value="regular">{t.prefRegular}</option>
                    <option value="relaxed">{t.prefRelaxed}</option>
                  </select>
                </div>
              </div>

              {/* Recommendation Output Panel */}
              {recommendation.status === "success" && recommendation.primarySize ? (
                <div className="space-y-4">
                  {/* Match Basis & Explanation */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#161F30] space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#0066FF] dark:text-[#3B82F6]">
                        {recommendation.matchBasis === "confirmed_measurements"
                          ? t.confirmedMatchBadge
                          : t.estimatedMatchBadge}
                      </span>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {config.sizingSystemLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {recommendation.explanation[lang]}
                    </p>
                  </div>

                  {/* Three-Column Fit Cards: Closer Fit · Primary Recommended Fit · Relaxed Fit */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* 1. Closer / Tighter Alternative */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1E293B] bg-[#F4F6FA] dark:bg-[#161F30] flex flex-col justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {t.closerFitLabel}
                        </div>
                        <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-1">
                          {recommendation.closerFitSize || "—"}
                        </div>
                      </div>
                      {recommendation.closerFitSize && onSelectSize ? (
                        <button
                          type="button"
                          onClick={() => handleApplySize(recommendation.closerFitSize!)}
                          className="w-full py-2 px-3 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-[#0066FF] hover:text-white hover:border-[#0066FF] transition-colors cursor-pointer"
                        >
                          {t.applySizeButton} ({recommendation.closerFitSize})
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {t.noAlternativeAvailable}
                        </span>
                      )}
                    </div>

                    {/* 2. Primary Recommended Fit (Focal Card in YUME Blue) */}
                    <div className="p-4 rounded-2xl border-2 border-[#0066FF] bg-white dark:bg-[#161F30] flex flex-col justify-between gap-3 shadow-xs">
                      <div>
                        <div className="text-[11px] font-bold text-[#0066FF] dark:text-[#3B82F6]">
                          {t.primaryFitLabel}
                        </div>
                        <div className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">
                          {recommendation.primarySize}
                        </div>
                      </div>
                      {onSelectSize && (
                        <button
                          type="button"
                          onClick={() => handleApplySize(recommendation.primarySize!)}
                          className="w-full py-2 px-3 rounded-full bg-[#0066FF] text-white text-xs font-bold hover:bg-[#0052CC] transition-colors cursor-pointer"
                        >
                          {t.applySizeButton} ({recommendation.primarySize})
                        </button>
                      )}
                    </div>

                    {/* 3. Looser / Relaxed Alternative */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1E293B] bg-[#F4F6FA] dark:bg-[#161F30] flex flex-col justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {t.relaxedFitLabel}
                        </div>
                        <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-1">
                          {recommendation.relaxedFitSize || "—"}
                        </div>
                      </div>
                      {recommendation.relaxedFitSize && onSelectSize ? (
                        <button
                          type="button"
                          onClick={() => handleApplySize(recommendation.relaxedFitSize!)}
                          className="w-full py-2 px-3 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-[#0066FF] hover:text-white hover:border-[#0066FF] transition-colors cursor-pointer"
                        >
                          {t.applySizeButton} ({recommendation.relaxedFitSize})
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {t.noAlternativeAvailable}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1E293B] bg-[#F4F6FA] dark:bg-[#161F30] text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {recommendation.explanation[lang]}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              TAB 4: MODEL DETAILS (SHOWN ONLY WHEN PROVIDED BY MERCHANT)
             ================================================================ */}
          {activeTab === "model_details" && config.modelDetails?.enabled && (
            <div className="border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 bg-[#F4F6FA] dark:bg-[#161F30] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#1E293B]">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.modelWearingTitle}
                  </h3>
                  {config.modelDetails.modelNameOrLabel && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {config.modelDetails.modelNameOrLabel}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {config.modelDetails.sizeWorn && (
                    <span className="font-bold text-slate-900 dark:text-white">
                      {t.modelSizeWorn}:{" "}
                      <span className="font-mono text-[#0066FF] dark:text-[#3B82F6]">
                        {config.modelDetails.sizeWorn}
                      </span>
                    </span>
                  )}
                  {config.modelDetails.fitDescription && (
                    <>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {config.modelDetails.fitDescription === "runs_small"
                          ? t.modelFitSmall
                          : config.modelDetails.fitDescription === "runs_large"
                          ? t.modelFitLarge
                          : config.modelDetails.fitDescription === "relaxed_fit"
                          ? t.modelFitRelaxed
                          : t.modelFitTrue}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {config.modelDetails.heightCm && (
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0D131F] border border-slate-200/80 dark:border-[#1E293B]">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lang === "ar" ? "طول العارض(ة)" : lang === "fr" ? "Hauteur" : "Height"}
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                      {formatMeasurementValue(
                        config.modelDetails.heightCm,
                        "cm",
                        displayUnit,
                        "length"
                      )}{" "}
                      {displayUnit.toUpperCase()}
                    </div>
                  </div>
                )}
                {config.modelDetails.bustOrChestCm && (
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0D131F] border border-slate-200/80 dark:border-[#1E293B]">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lang === "ar" ? "الصدر" : lang === "fr" ? "Poitrine" : "Bust / Chest"}
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                      {formatMeasurementValue(
                        config.modelDetails.bustOrChestCm,
                        "cm",
                        displayUnit,
                        "length"
                      )}{" "}
                      {displayUnit.toUpperCase()}
                    </div>
                  </div>
                )}
                {config.modelDetails.waistCm && (
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0D131F] border border-slate-200/80 dark:border-[#1E293B]">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lang === "ar" ? "الخصر" : lang === "fr" ? "Taille" : "Waist"}
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                      {formatMeasurementValue(
                        config.modelDetails.waistCm,
                        "cm",
                        displayUnit,
                        "length"
                      )}{" "}
                      {displayUnit.toUpperCase()}
                    </div>
                  </div>
                )}
                {config.modelDetails.hipsCm && (
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0D131F] border border-slate-200/80 dark:border-[#1E293B]">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lang === "ar" ? "الأرداف" : lang === "fr" ? "Hanches" : "Hips"}
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                      {formatMeasurementValue(
                        config.modelDetails.hipsCm,
                        "cm",
                        displayUnit,
                        "length"
                      )}{" "}
                      {displayUnit.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>

              {config.modelDetails.customNotes && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                  {config.modelDetails.customNotes}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ================================================================
            4. BOTTOM TIP BANNER & CLOSE BUTTON FOOTER (MATCHES MOCKUP)
           ================================================================ */}
        <div className="px-5 sm:px-7 pt-2 pb-5 space-y-3.5 shrink-0 bg-white dark:bg-[#0D131F]">
          {/* Tip Banner */}
          <div className="w-full rounded-xl bg-[#EEF3F9] dark:bg-[#161F30] border border-slate-200/70 dark:border-[#1E293B] px-4 py-2.5 flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#0066FF] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
              !
            </span>
            <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-snug">
              <strong className="font-bold text-[#0066FF] dark:text-[#3B82F6]">
                {lang === "ar" ? "نصيحة:" : lang === "fr" ? "Conseil :" : "Tip:"}
              </strong>{" "}
              {lang === "ar"
                ? "قارن قياساتك مع جدول المقاسات للحصول على أفضل ملاءمة."
                : lang === "fr"
                ? "Comparez vos mesures avec le tableau des tailles pour un ajustement optimal."
                : "Compare your measurements with the size chart for the best fit."}
            </p>
          </div>

          {/* Bottom-Right Close Pill Button */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-2 rounded-full text-sm font-bold border border-slate-400 text-slate-900 bg-white hover:bg-slate-50 dark:bg-[#0066FF] dark:border-[#0066FF] dark:text-white dark:hover:bg-[#0052CC] transition-colors cursor-pointer"
            >
              {lang === "ar" ? "إغلاق" : lang === "fr" ? "Fermer" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindYourFitModal;
