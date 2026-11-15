/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * YUME Add Product Workflow — Step: "Sizing & Fit Information"
 * Dynamic, category-aware merchant configuration for the "Find Your Fit" experience.
 */

import React, { useState, useMemo } from "react";
import {
  Check,
  Plus,
  Trash2,
  Eye,
  RotateCcw,
  UserCheck,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Sliders,
  Table,
  Layers,
  Info,
} from "lucide-react";
import {
  ProductSizingFitConfig,
  SizingSubcategoryProfile,
  SizingMeasurementColumn,
  SizingTableRow,
  SIZING_PROFILE_LABELS,
  getDefaultColumnsForProfile,
  createDefaultSizingFitConfig,
  syncSizingRowsWithProductSizes,
  hasValidProductSizingFit,
} from "../utils/sizingFitLogic";
import { SizingIllustrations } from "./SizingIllustrations";
import { FindYourFitModal, YumeFitIcon } from "./FindYourFitModal";

export interface WizardSizingAndFitStepProps {
  config: ProductSizingFitConfig;
  onChange: (nextConfig: ProductSizingFitConfig) => void;
  step3Sizes: string[];
  detectedProfile: SizingSubcategoryProfile;
  productName?: string;
  productCategoryLabel?: string;
  currentLanguage?: "en" | "ar" | "fr";
  onPrevStep: () => void;
  onNextStep: () => void;
  onSkipStep: () => void;
}

const PROFILE_OPTIONS: SizingSubcategoryProfile[] = [
  "womens_clothing",
  "mens_clothing",
  "dresses_abayas",
  "trousers_shorts",
  "childrens_clothing",
  "baby_clothing",
  "shoes",
];

export const WizardSizingAndFitStep: React.FC<WizardSizingAndFitStepProps> = ({
  config,
  onChange,
  step3Sizes,
  detectedProfile,
  productName,
  productCategoryLabel,
  currentLanguage = "en",
  onPrevStep,
  onNextStep,
  onSkipStep,
}) => {
  const [activeEditorTab, setActiveEditorTab] = useState<"body" | "garment" | "conversions">("body");
  const [selectedPreviewRowId, setSelectedPreviewRowId] = useState<string>(
    config.rows[0]?.id || ""
  );
  const [highlightedColKey, setHighlightedColKey] = useState<string | null>(null);
  const [isCustomerPreviewOpen, setIsCustomerPreviewOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColChartType, setNewColChartType] = useState<"body" | "garment" | "both">("garment");
  const [newRowSizeLabel, setNewRowSizeLabel] = useState("");

  const activePreviewRow = useMemo(() => {
    return (
      config.rows.find((r) => r.id === selectedPreviewRowId) ||
      config.rows[0] || {
        id: "preview-fallback",
        sizeLabel: "M",
        bodyValues: {},
        garmentValues: {},
      }
    );
  }, [config.rows, selectedPreviewRowId]);

  const enabledBodyCols = useMemo(
    () =>
      config.columns.filter(
        (c) => c.enabled && (c.chartType === "body" || c.chartType === "both")
      ),
    [config.columns]
  );

  const enabledGarmentCols = useMemo(
    () =>
      config.columns.filter(
        (c) => c.enabled && (c.chartType === "garment" || c.chartType === "both")
      ),
    [config.columns]
  );

  const isValidForCustomerButton = useMemo(
    () =>
      hasValidProductSizingFit({
        category: "fashion",
        subcategory: config.subcategoryProfile,
        sizingFitConfig: config,
      }),
    [config]
  );

  // Handlers
  const handleToggleEnabled = (enabled: boolean) => {
    onChange({
      ...config,
      enabled,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleProfileChange = (nextProfile: SizingSubcategoryProfile) => {
    const nextCfg = createDefaultSizingFitConfig(
      nextProfile,
      step3Sizes.length > 0 ? step3Sizes : config.rows.map((r) => r.sizeLabel),
      true
    );
    onChange({
      ...nextCfg,
      enabled: config.enabled,
      primaryUnit: config.primaryUnit,
    });
    if (nextCfg.rows[0]) {
      setSelectedPreviewRowId(nextCfg.rows[0].id);
    }
  };

  const handleSyncWithStep3Sizes = () => {
    const synced = syncSizingRowsWithProductSizes(
      config,
      step3Sizes,
      config.subcategoryProfile
    );
    onChange({
      ...synced,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleResetTemplateValues = () => {
    const fresh = createDefaultSizingFitConfig(
      config.subcategoryProfile,
      config.rows.map((r) => r.sizeLabel),
      true
    );
    onChange({
      ...fresh,
      enabled: config.enabled,
      primaryUnit: config.primaryUnit,
      modelDetails: config.modelDetails,
    });
  };

  const handleToggleColumn = (colKey: string) => {
    const nextCols = config.columns.map((c) =>
      c.key === colKey ? { ...c, enabled: !c.enabled } : c
    );
    onChange({
      ...config,
      columns: nextCols,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddCustomColumn = () => {
    const trimmed = newColName.trim();
    if (!trimmed) return;
    const key = `custom_${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now()
      .toString()
      .slice(-3)}`;
    const newCol: SizingMeasurementColumn = {
      key,
      label: {
        en: trimmed,
        ar: trimmed,
        fr: trimmed,
      },
      chartType: newColChartType,
      unitType: "length",
      enabled: true,
      isCustom: true,
      howToMeasure: {
        en: `Measure ${trimmed.toLowerCase()} across the designated point.`,
        ar: `قم بقياس ${trimmed} بدقة.`,
        fr: `Mesurez ${trimmed.toLowerCase()} avec précision.`,
      },
    };
    onChange({
      ...config,
      columns: [...config.columns, newCol],
      updatedAt: new Date().toISOString(),
    });
    setNewColName("");
  };

  const handleRemoveCustomColumn = (colKey: string) => {
    onChange({
      ...config,
      columns: config.columns.filter((c) => c.key !== colKey),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateCell = (
    rowId: string,
    target: "body" | "garment",
    colKey: string,
    value: string
  ) => {
    const nextRows = config.rows.map((row) => {
      if (row.id !== rowId) return row;
      if (target === "body") {
        return {
          ...row,
          bodyValues: {
            ...row.bodyValues,
            [colKey]: value,
          },
        };
      }
      return {
        ...row,
        garmentValues: {
          ...row.garmentValues,
          [colKey]: value,
        },
      };
    });
    onChange({
      ...config,
      rows: nextRows,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateRowLabel = (rowId: string, nextLabel: string) => {
    const nextRows = config.rows.map((row) =>
      row.id === rowId ? { ...row, sizeLabel: nextLabel } : row
    );
    onChange({
      ...config,
      rows: nextRows,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateIntlConversion = (
    rowId: string,
    region: "dz" | "eu" | "us" | "uk",
    value: string
  ) => {
    const nextRows = config.rows.map((row) =>
      row.id === rowId
        ? {
            ...row,
            internationalConversions: {
              ...(row.internationalConversions || {}),
              [region]: value,
            },
          }
        : row
    );
    onChange({
      ...config,
      rows: nextRows,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddSizeRow = () => {
    const label = newRowSizeLabel.trim() || `Size ${config.rows.length + 1}`;
    const freshTemplate = createDefaultSizingFitConfig(
      config.subcategoryProfile,
      [label],
      true
    );
    const templateRow = freshTemplate.rows[0];
    const newRow: SizingTableRow = {
      id: `sz-row-${Date.now()}-${label.replace(/\s+/g, "_")}`,
      sizeLabel: label,
      internationalConversions: templateRow?.internationalConversions || {
        dz: label,
        eu: "",
        us: "",
        uk: "",
      },
      bodyValues: templateRow?.bodyValues || {},
      garmentValues: templateRow?.garmentValues || {},
    };
    const nextRows = [...config.rows, newRow];
    onChange({
      ...config,
      rows: nextRows,
      updatedAt: new Date().toISOString(),
    });
    setSelectedPreviewRowId(newRow.id);
    setNewRowSizeLabel("");
  };

  const handleDeleteSizeRow = (rowId: string) => {
    if (config.rows.length <= 1) return;
    const nextRows = config.rows.filter((r) => r.id !== rowId);
    onChange({
      ...config,
      rows: nextRows,
      updatedAt: new Date().toISOString(),
    });
    if (selectedPreviewRowId === rowId && nextRows[0]) {
      setSelectedPreviewRowId(nextRows[0].id);
    }
  };

  const handleUpdateModelDetail = (
    field: keyof NonNullable<ProductSizingFitConfig["modelDetails"]>,
    value: string | boolean
  ) => {
    const currentModel = config.modelDetails || {
      enabled: false,
      sizeWorn: config.rows[0]?.sizeLabel || "M",
      fitDescription: "true_to_size",
    };
    onChange({
      ...config,
      modelDetails: {
        ...currentModel,
        [field]: value,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Architecture Banner */}
      <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-stone-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-[0.14em] bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-200 border border-stone-200/80 dark:border-slate-700">
                <YumeFitIcon className="w-3.5 h-3.5" />
                Sizing &amp; Fit Architecture
              </span>
              {productCategoryLabel && (
                <span className="text-[11px] font-mono text-stone-500 dark:text-slate-400">
                  · {productCategoryLabel}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-stone-950 dark:text-white">
              Sizing &amp; Fit Information (Find Your Fit)
            </h2>
            <p className="text-xs sm:text-[13px] text-stone-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Configure category-specific body measurements, garment flat dimensions, and fit guidance. When enabled, customers will see the{" "}
              <span className="font-semibold text-stone-900 dark:text-white">Find Your Fit</span>{" "}
              guide directly beside the Size selector on your product page.
            </p>
          </div>

          {/* Right Controls: Master Enable Toggle, Preview & Skip */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsCustomerPreviewOpen(true)}
              disabled={!config.enabled}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/90 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Customer Window</span>
            </button>

            <button
              type="button"
              onClick={onSkipStep}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-stone-200 dark:border-slate-800 text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <span>Skip Section</span>
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-stone-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                {config.enabled ? "Enabled on Product" : "Disabled"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={config.enabled}
                onClick={() => handleToggleEnabled(!config.enabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  config.enabled
                    ? "bg-stone-900 dark:bg-white"
                    : "bg-stone-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-xs ring-0 transition duration-200 ease-in-out ${
                    config.enabled
                      ? "translate-x-5 bg-white dark:bg-slate-950"
                      : "translate-x-0 bg-white dark:bg-slate-300"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Status Indicator Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                config.enabled && isValidForCustomerButton
                  ? "bg-emerald-500"
                  : "bg-stone-400 dark:bg-slate-600"
              }`}
            />
            <span className="text-stone-700 dark:text-slate-300 font-medium">
              {config.enabled && isValidForCustomerButton
                ? 'Customer "Find Your Fit" button is active and will appear beside the Size selector.'
                : 'Customer "Find Your Fit" button is currently hidden (section skipped or disabled).'}
            </span>
          </div>

          {step3Sizes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-stone-500 dark:text-slate-400">
                Step 3 Sizes ({step3Sizes.length}): {step3Sizes.join(", ")}
              </span>
              <button
                type="button"
                onClick={handleSyncWithStep3Sizes}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-900 dark:text-white underline underline-offset-4 hover:opacity-80 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Sync Rows
              </button>
            </div>
          )}
        </div>
      </div>

      {!config.enabled ? (
        <div className="rounded-2xl border border-dashed border-stone-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center text-stone-600 dark:text-slate-300">
            <YumeFitIcon className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">
            Sizing &amp; Fit Information is Disabled for This Product
          </h3>
          <p className="text-xs text-stone-500 dark:text-slate-400 max-w-md mx-auto">
            The customer-facing &ldquo;Find Your Fit&rdquo; button will not be displayed on the product page. You can enable it anytime or proceed directly to Prices &amp; Shipping.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleToggleEnabled(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 transition-opacity cursor-pointer"
            >
              Enable Sizing &amp; Fit Guide
            </button>
            <button
              type="button"
              onClick={onNextStep}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Continue to Prices &amp; Shipping
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Section 1: Category Profile & Fit Architecture */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left 7 Cols: Profile & Fit Parameters */}
            <div className="xl:col-span-7 rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800/80 pb-3.5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-stone-700 dark:text-slate-300" />
                  <h3 className="text-sm font-bold text-stone-950 dark:text-white">
                    1. Garment / Footwear Profile &amp; Fit Characteristics
                  </h3>
                </div>
                {detectedProfile === config.subcategoryProfile && (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400">
                    Auto-Matched from Category
                  </span>
                )}
              </div>

              {/* Subcategory Profile Selector */}
              <div className="space-y-2">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Measurement Diagram &amp; Category Profile
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {PROFILE_OPTIONS.map((profKey) => {
                    const meta = SIZING_PROFILE_LABELS[profKey];
                    const isSelected = config.subcategoryProfile === profKey;
                    return (
                      <button
                        key={profKey}
                        type="button"
                        onClick={() => handleProfileChange(profKey)}
                        className={`px-3 py-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? "border-stone-900 dark:border-white bg-stone-900 dark:bg-white text-white dark:text-slate-950 shadow-xs"
                            : "border-stone-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-800/40 text-stone-700 dark:text-slate-300 hover:border-stone-400 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className="text-xs font-semibold truncate">
                          {meta.en}
                        </div>
                        <div
                          className={`text-[10px] font-mono mt-0.5 truncate ${
                            isSelected
                              ? "text-stone-300 dark:text-slate-600"
                              : "text-stone-400 dark:text-slate-500"
                          }`}
                        >
                          {meta.defaultSystem}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sizing System, Primary Unit, Cut & Stretch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1.5">
                    Sizing System Label
                  </label>
                  <input
                    type="text"
                    value={config.sizingSystemLabel}
                    onChange={(e) =>
                      onChange({ ...config, sizingSystemLabel: e.target.value })
                    }
                    placeholder="e.g. DZ / EU Standard"
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/70 text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1.5">
                    Primary Input Unit (Customer Can Toggle CM / IN)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["cm", "in"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => onChange({ ...config, primaryUnit: u })}
                        className={`py-2 px-3 rounded-xl text-xs font-mono font-semibold uppercase border transition-colors cursor-pointer ${
                          config.primaryUnit === u
                            ? "border-stone-900 dark:border-white bg-stone-900 dark:bg-white text-white dark:text-slate-950"
                            : "border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/50 text-stone-700 dark:text-slate-300"
                        }`}
                      >
                        {u === "cm" ? "Centimeters (CM)" : "Inches (IN)"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1.5">
                    Silhouette / Fit Cut
                  </label>
                  <select
                    value={config.fitType || "regular"}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        fitType: e.target.value as ProductSizingFitConfig["fitType"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/70 text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
                  >
                    <option value="slim">Slim / Fitted Cut</option>
                    <option value="regular">Regular / Standard Fit</option>
                    <option value="relaxed">Relaxed / Comfort Fit</option>
                    <option value="oversized">Oversized / Modest Cut</option>
                    <option value="tailored">Tailored / Structured</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1.5">
                    Fabric / Material Elasticity
                  </label>
                  <select
                    value={config.stretchLevel || "non_stretch"}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        stretchLevel: e.target.value as ProductSizingFitConfig["stretchLevel"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/70 text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
                  >
                    <option value="non_stretch">Non-Stretch (Rigid)</option>
                    <option value="slight_stretch">Slight Stretch (1–2 cm ease)</option>
                    <option value="medium_stretch">Medium Stretch (2–4 cm ease)</option>
                    <option value="high_stretch">High Stretch (Flexible Knit)</option>
                  </select>
                </div>
              </div>

              {/* Active Measurement Columns Manager */}
              <div className="pt-3 border-t border-stone-100 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400">
                    Active Measurement Fields (Click to Toggle)
                  </label>
                  <span className="text-[11px] text-stone-400 dark:text-slate-500">
                    {config.columns.filter((c) => c.enabled).length} active fields
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {config.columns.map((col) => (
                    <div
                      key={col.key}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        col.enabled
                          ? "border-stone-900 dark:border-slate-200 bg-stone-900 dark:bg-white text-white dark:text-slate-950"
                          : "border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-800/40 text-stone-500 dark:text-slate-400"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleColumn(col.key)}
                        className="inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {col.enabled && <Check className="w-3 h-3" />}
                        <span>{col.label.en}</span>
                        <span
                          className={`text-[9px] font-mono uppercase px-1 py-0.2 rounded ${
                            col.enabled
                              ? "bg-white/20 dark:bg-slate-900/15"
                              : "bg-stone-200 dark:bg-slate-700"
                          }`}
                        >
                          {col.chartType}
                        </span>
                      </button>
                      {col.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomColumn(col.key)}
                          className="ml-1 opacity-70 hover:opacity-100 cursor-pointer"
                          title="Remove custom column"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Custom Column Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    placeholder="Add custom dimension (e.g. Cuff Width, Rise)..."
                    className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg text-xs border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/60 text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
                  />
                  <select
                    value={newColChartType}
                    onChange={(e) =>
                      setNewColChartType(e.target.value as "body" | "garment" | "both")
                    }
                    className="px-2.5 py-1.5 rounded-lg text-xs border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/60 text-stone-800 dark:text-slate-200"
                  >
                    <option value="garment">Product Chart</option>
                    <option value="body">Body Chart</option>
                    <option value="both">Both Charts</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCustomColumn}
                    disabled={!newColName.trim()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Field
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Live Original YUME Vector Diagram Preview */}
            <div className="xl:col-span-5 rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-950 dark:text-white">
                    Live YUME Technical Diagram
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400">
                    Select any size pill to inspect callouts in real time
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {config.rows.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedPreviewRowId(r.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
                        activePreviewRow.id === r.id
                          ? "border-stone-900 dark:border-white bg-stone-900 dark:bg-white text-white dark:text-slate-950"
                          : "border-stone-200 dark:border-slate-800 text-stone-600 dark:text-slate-400 hover:border-stone-400"
                      }`}
                    >
                      {r.sizeLabel}
                    </button>
                  ))}
                </div>
              </div>

              <div className="my-auto">
                <SizingIllustrations
                  profile={config.subcategoryProfile}
                  activeRow={activePreviewRow}
                  columns={config.columns}
                  primaryUnit={config.primaryUnit}
                  displayUnit={config.primaryUnit}
                  highlightedKey={highlightedColKey}
                  onSelectKey={(k) => setHighlightedColKey(k)}
                  currentLanguage={currentLanguage}
                  compact={true}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Editable Size & Measurement Matrix */}
          <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-stone-700 dark:text-slate-300" />
                  <h3 className="text-sm font-bold text-stone-950 dark:text-white">
                    2. Size Chart &amp; Measurement Values ({config.primaryUnit.toUpperCase()})
                  </h3>
                </div>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Enter single measurements (e.g.{" "}
                  <span className="font-mono text-stone-700 dark:text-slate-300">96</span>) or body ranges (e.g.{" "}
                  <span className="font-mono text-stone-700 dark:text-slate-300">92-96</span>). Customers can switch between Body Chart, Product Chart, CM, and IN automatically.
                </p>
              </div>

              {/* Matrix Mode Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-xl p-1 bg-stone-100 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setActiveEditorTab("body")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeEditorTab === "body"
                        ? "bg-white dark:bg-slate-900 text-stone-950 dark:text-white shadow-2xs"
                        : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
                    }`}
                  >
                    Body Measurements ({enabledBodyCols.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveEditorTab("garment")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeEditorTab === "garment"
                        ? "bg-white dark:bg-slate-900 text-stone-950 dark:text-white shadow-2xs"
                        : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
                    }`}
                  >
                    Product / Garment ({enabledGarmentCols.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveEditorTab("conversions")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeEditorTab === "conversions"
                        ? "bg-white dark:bg-slate-900 text-stone-950 dark:text-white shadow-2xs"
                        : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
                    }`}
                  >
                    DZ / EU / US / UK
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetTemplateValues}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
                  title="Pre-fill standard measurements for current sizes"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Fill Standard</span>
                </button>
              </div>
            </div>

            {/* Editable Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400 bg-stone-50/70 dark:bg-slate-800/40">
                    <th className="py-2.5 px-3 w-32">Label Size</th>
                    {activeEditorTab === "body" &&
                      enabledBodyCols.map((col) => (
                        <th key={col.key} className="py-2.5 px-3 min-w-[120px]">
                          <div>{col.label.en}</div>
                          <div className="text-[9px] font-normal text-stone-400 dark:text-slate-500">
                            {col.unitType === "length"
                              ? `Body (${config.primaryUnit})`
                              : col.unitType === "weight"
                              ? "kg"
                              : ""}
                          </div>
                        </th>
                      ))}
                    {activeEditorTab === "garment" &&
                      enabledGarmentCols.map((col) => (
                        <th key={col.key} className="py-2.5 px-3 min-w-[120px]">
                          <div>{col.label.en}</div>
                          <div className="text-[9px] font-normal text-stone-400 dark:text-slate-500">
                            Garment ({config.primaryUnit})
                          </div>
                        </th>
                      ))}
                    {activeEditorTab === "conversions" && (
                      <>
                        <th className="py-2.5 px-3">DZ Size</th>
                        <th className="py-2.5 px-3">EU Size</th>
                        <th className="py-2.5 px-3">US Size</th>
                        <th className="py-2.5 px-3">UK Size</th>
                      </>
                    )}
                    <th className="py-2.5 px-3 w-14 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-slate-800/70 text-xs">
                  {config.rows.map((row) => {
                    const isPreviewSelected = activePreviewRow.id === row.id;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedPreviewRowId(row.id)}
                        className={`transition-colors ${
                          isPreviewSelected
                            ? "bg-stone-50/90 dark:bg-slate-800/40"
                            : "hover:bg-stone-50/40 dark:hover:bg-slate-800/20"
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={row.sizeLabel}
                            onChange={(e) =>
                              handleUpdateRowLabel(row.id, e.target.value)
                            }
                            className="w-24 px-2.5 py-1.5 rounded-lg font-mono font-bold text-xs border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-950 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
                          />
                        </td>

                        {activeEditorTab === "body" &&
                          enabledBodyCols.map((col) => (
                            <td key={col.key} className="py-2.5 px-3">
                              <input
                                type="text"
                                value={row.bodyValues[col.key] || ""}
                                onFocus={() => setHighlightedColKey(col.key)}
                                onChange={(e) =>
                                  handleUpdateCell(
                                    row.id,
                                    "body",
                                    col.key,
                                    e.target.value
                                  )
                                }
                                placeholder="e.g. 92-96"
                                className="w-full max-w-[130px] px-2.5 py-1.5 rounded-lg font-mono text-xs border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
                              />
                            </td>
                          ))}

                        {activeEditorTab === "garment" &&
                          enabledGarmentCols.map((col) => (
                            <td key={col.key} className="py-2.5 px-3">
                              <input
                                type="text"
                                value={row.garmentValues[col.key] || ""}
                                onFocus={() => setHighlightedColKey(col.key)}
                                onChange={(e) =>
                                  handleUpdateCell(
                                    row.id,
                                    "garment",
                                    col.key,
                                    e.target.value
                                  )
                                }
                                placeholder="e.g. 98"
                                className="w-full max-w-[130px] px-2.5 py-1.5 rounded-lg font-mono text-xs border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
                              />
                            </td>
                          ))}

                        {activeEditorTab === "conversions" && (
                          <>
                            {(["dz", "eu", "us", "uk"] as const).map((reg) => (
                              <td key={reg} className="py-2.5 px-3">
                                <input
                                  type="text"
                                  value={
                                    row.internationalConversions?.[reg] || ""
                                  }
                                  onChange={(e) =>
                                    handleUpdateIntlConversion(
                                      row.id,
                                      reg,
                                      e.target.value
                                    )
                                  }
                                  placeholder={reg.toUpperCase()}
                                  className="w-24 px-2.5 py-1.5 rounded-lg font-mono text-xs border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
                                />
                              </td>
                            ))}
                          </>
                        )}

                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSizeRow(row.id);
                            }}
                            disabled={config.rows.length <= 1}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                            title="Delete size row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Add Size Row Footer */}
            <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newRowSizeLabel}
                  onChange={(e) => setNewRowSizeLabel(e.target.value)}
                  placeholder="New size label (e.g. 3XL, 44)..."
                  className="px-3 py-1.5 rounded-xl text-xs font-mono border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/60 text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
                />
                <button
                  type="button"
                  onClick={handleAddSizeRow}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Size Row</span>
                </button>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-stone-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showInternationalConversions !== false}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      showInternationalConversions: e.target.checked,
                    })
                  }
                  className="rounded border-stone-300 dark:border-slate-700"
                />
                <span>Display DZ / EU / US / UK conversions in customer table</span>
              </label>
            </div>
          </div>

          {/* Section 3: Optional Model Reference Details */}
          <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-stone-700 dark:text-slate-300" />
                <div>
                  <h3 className="text-sm font-bold text-stone-950 dark:text-white">
                    3. Model Reference Details (Optional)
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    When enabled, adds a &ldquo;Model Details&rdquo; tab in the customer Find Your Fit window showing the model&apos;s measurements and size worn.
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={Boolean(config.modelDetails?.enabled)}
                onClick={() =>
                  handleUpdateModelDetail(
                    "enabled",
                    !config.modelDetails?.enabled
                  )
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  config.modelDetails?.enabled
                    ? "bg-stone-900 dark:bg-white"
                    : "bg-stone-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-xs ring-0 transition duration-200 ease-in-out ${
                    config.modelDetails?.enabled
                      ? "translate-x-5 bg-white dark:bg-slate-950"
                      : "translate-x-0 bg-white dark:bg-slate-300"
                  }`}
                />
              </button>
            </div>

            {config.modelDetails?.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-stone-100 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1">
                    Size Worn by Model
                  </label>
                  <select
                    value={config.modelDetails.sizeWorn || ""}
                    onChange={(e) =>
                      handleUpdateModelDetail("sizeWorn", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono font-semibold border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/70 text-stone-900 dark:text-white"
                  >
                    {config.rows.map((r) => (
                      <option key={r.id} value={r.sizeLabel}>
                        {r.sizeLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1">
                    How It Fits
                  </label>
                  <select
                    value={config.modelDetails.fitDescription || "true_to_size"}
                    onChange={(e) =>
                      handleUpdateModelDetail("fitDescription", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/70 text-stone-900 dark:text-white"
                  >
                    <option value="true_to_size">True to size</option>
                    <option value="runs_small">Runs small (size up)</option>
                    <option value="runs_large">Runs large (size down)</option>
                    <option value="relaxed_fit">Relaxed drape</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1">
                    Model Height (cm)
                  </label>
                  <input
                    type="text"
                    value={config.modelDetails.heightCm || ""}
                    onChange={(e) =>
                      handleUpdateModelDetail("heightCm", e.target.value)
                    }
                    placeholder="e.g. 176"
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/70 text-stone-900 dark:text-white"
                  />
                </div>

                {config.subcategoryProfile === "shoes" ? (
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1">
                      Model Foot Length (cm)
                    </label>
                    <input
                      type="text"
                      value={config.modelDetails.footLengthCm || ""}
                      onChange={(e) =>
                        handleUpdateModelDetail("footLengthCm", e.target.value)
                      }
                      placeholder="e.g. 25.5"
                      className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/70 text-stone-900 dark:text-white"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1">
                        Bust / Chest (cm)
                      </label>
                      <input
                        type="text"
                        value={config.modelDetails.bustOrChestCm || ""}
                        onChange={(e) =>
                          handleUpdateModelDetail("bustOrChestCm", e.target.value)
                        }
                        placeholder="e.g. 92"
                        className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/70 text-stone-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1">
                        Waist (cm)
                      </label>
                      <input
                        type="text"
                        value={config.modelDetails.waistCm || ""}
                        onChange={(e) =>
                          handleUpdateModelDetail("waistCm", e.target.value)
                        }
                        placeholder="e.g. 74"
                        className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/70 text-stone-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1">
                        Hips (cm)
                      </label>
                      <input
                        type="text"
                        value={config.modelDetails.hipsCm || ""}
                        onChange={(e) =>
                          handleUpdateModelDetail("hipsCm", e.target.value)
                        }
                        placeholder="e.g. 96"
                        className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/70 text-stone-900 dark:text-white"
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1">
                    Fit Note / Styling Advice
                  </label>
                  <input
                    type="text"
                    value={config.modelDetails.customNotes || ""}
                    onChange={(e) =>
                      handleUpdateModelDetail("customNotes", e.target.value)
                    }
                    placeholder="e.g. Model wears size M with comfortable shoulder room."
                    className="w-full px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/70 text-stone-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Live Customer Modal Preview */}
      <FindYourFitModal
        isOpen={isCustomerPreviewOpen}
        onClose={() => setIsCustomerPreviewOpen(false)}
        config={config}
        productName={productName || "Preview Product"}
        selectedSize={activePreviewRow.sizeLabel}
        onSelectSize={(sz) => {
          const found = config.rows.find((r) => r.sizeLabel === sz);
          if (found) setSelectedPreviewRowId(found.id);
        }}
        currentLanguage={currentLanguage}
      />
    </div>
  );
};
