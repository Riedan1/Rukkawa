import React, { useState, useEffect, useMemo, useContext, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle, 
  ChevronDown, 
  Palette,
  Image,
  Layers,
  Check,
  Copy,
  PlusCircle,
  Tag,
  ArrowRight,
  ArrowLeft,
  Edit2,
  HelpCircle,
  RotateCcw,
  Scissors,
  X,
  FolderTree,
  DollarSign,
  CheckSquare,
  RefreshCw,
  Info,
  Pipette
} from "lucide-react";
import { CategoryTemplate, MainCategory, Subcategory } from "../types";
import { fetchBrandsFromFirestore } from "../utils/brandsStore";
import { SkeuomorphicSwitch } from "./SkeuomorphicSwitch";
import DiamondDecorativeDivider from "./DiamondDecorativeDivider";
import { DEFAULT_MAIN_CATEGORIES, DEFAULT_SUBCATEGORIES } from "../utils/categoriesStore";
import { DEFAULT_CATEGORY_TEMPLATES } from "../data/categoryTemplates";
import { CORE_8_COLOR_FAMILIES, getClosestColorName } from "../utils/colorMatcher";
import { getMarketByCountryOrCode, getMarketCulturalColorPalette } from "../utils/globalMarketArchitecture";
import { getSpecHint } from "../utils/specHints";
import { getRandomStepAdvice } from "../data/wizardAdvices";
import {
  CUSTOM_OTHER_OPTION,
  SPEC_PRESETS_2026,
  normalizeCategoryFieldsWith2026Specs,
  getCategoryVariantSpecSuggestions,
  generateMultiVariantMatrix,
  getCurrencySymbol,
  sortVariantAttributes,
  isFashionProductCategory,
  isFashionNonVariantAttribute,
  isMeasurementUnitAttribute,
  getCategorySmartSizeConfig,
} from "../utils/wizardLogic";

const isColorDark = (hexColor: string): boolean => {
  if (!hexColor || !hexColor.startsWith("#")) return false;
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 140;
};

interface SuggestedAttrConfig {
  name: string;
  popularValues: string[];
}

const CATEGORY_SUGGESTIONS: Record<string, SuggestedAttrConfig[]> = {
  electronics: [
    { name: "Processor", popularValues: ["Apple A19 Pro", "Snapdragon 8 Elite (Gen 4)", "Snapdragon 8 Gen 5", "MediaTek Dimensity 9500", "Apple M4 Max", "Intel Core Ultra 9 (Series 2)", "AMD Ryzen AI 9 HX 370"] },
    { name: "RAM Memory", popularValues: ["8GB", "12GB", "16GB", "24GB", "32GB", "64GB"] },
    { name: "Storage Capacity", popularValues: ["128GB", "256GB", "512GB", "1TB", "2TB", "3TB", "4TB"] },
    { name: "SIM Type", popularValues: ["Single Nano SIM", "Dual SIM (Nano + eSIM)", "Dual eSIM", "eSIM Only"] },
    { name: "Camera Specs", popularValues: ["200MP Quad Periscope + 50MP Ultra-Wide + 50MP Telephoto", "50MP Triple Pro (Main OIS + 5x Periscope + 50MP Ultra-Wide)", "48MP Fusion Main + 48MP Ultra-Wide + 12MP 5x Telephoto"] },
    { name: "Color", popularValues: ["Midnight Black", "Classic Silver", "Titanium Grey", "Royal Emerald", "Glacier White"] },
    { name: "Screen Size", popularValues: ["6.1 inches", "6.3 inches", "6.7 inches", "6.9 inches", "14.2 inches", "16.2 inches"] },
    { name: "Material", popularValues: ["Grade 5 Titanium", "Aerospace Aluminum", "Ceramic Shield Glass", "Carbon Fiber"] }
  ],
  smartphones: [
    { name: "Processor", popularValues: ["Apple A19 Pro", "Apple A19", "Snapdragon 8 Elite (Gen 4)", "Snapdragon 8 Gen 5", "MediaTek Dimensity 9500", "Google Tensor G5"] },
    { name: "RAM Memory", popularValues: ["8GB", "12GB", "16GB", "24GB", "32GB", "64GB"] },
    { name: "Storage Capacity", popularValues: ["128GB", "256GB", "512GB", "1TB", "2TB", "3TB", "4TB"] },
    { name: "SIM Type", popularValues: ["Single Nano SIM", "Dual SIM (Nano + eSIM)", "Dual eSIM", "eSIM Only"] },
    { name: "Camera Specs", popularValues: ["200MP Quad Periscope + 50MP Ultra-Wide + 50MP Telephoto", "50MP Triple Pro (Main OIS + 5x Periscope + 50MP Ultra-Wide)", "48MP Fusion Main + 48MP Ultra-Wide + 12MP 5x Telephoto"] },
    { name: "Color", popularValues: ["Midnight Black", "Classic Silver", "Phantom Green", "Desert Sand", "Sky Blue"] },
    { name: "Screen Size", popularValues: ["6.1 inches", "6.3 inches", "6.7 inches", "6.8 inches", "6.9 inches"] }
  ],
  laptops: [
    { name: "Processor", popularValues: ["Apple M4 Max", "Apple M4 Pro", "Intel Core Ultra 9 (Series 2)", "AMD Ryzen AI 9 HX 370", "Snapdragon X Elite"] },
    { name: "RAM Memory", popularValues: ["16GB", "24GB", "32GB", "64GB"] },
    { name: "Storage Capacity", popularValues: ["512GB", "1TB", "2TB", "3TB", "4TB"] },
    { name: "Screen Size", popularValues: ["13.6 inches", "14.2 inches", "15.6 inches", "16.2 inches", "17.3 inches"] },
    { name: "Color", popularValues: ["Space Grey", "Lunar Silver", "Matte Black"] }
  ],
  gaming: [
    { name: "Storage Capacity", popularValues: ["512GB", "1TB", "2TB", "3TB", "4TB"] },
    { name: "RAM Memory", popularValues: ["16GB", "32GB", "64GB"] },
    { name: "Switch Type", popularValues: ["Red Linear (Quiet)", "Blue Clicky (Tactile)", "Brown Silent (Tactile)", "Optical Fast"] },
    { name: "Connectivity", popularValues: ["USB-C Wired", "Wireless 2.4G + BT 5.2", "Tri-Mode Ultra Low Latency"] },
    { name: "Color", popularValues: ["Carbon Black", "Chalk White", "Cyberpunk Yellow"] }
  ],
  fashion: [
    { name: "Size", popularValues: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
    { name: "Color", popularValues: ["Onyx Black", "Ivory White", "Saharan Beige", "Royal Emerald", "Bordeaux Red", "Navy Blue"] },
    { name: "Material", popularValues: ["100% Pure Algerian Wool", "Egyptian Cotton", "Premium Linen", "Silk Satin", "Genuine Leather"] },
    { name: "Fit", popularValues: ["Slim Fit", "Regular Fit", "Relaxed Oversized", "Tailored Custom"] }
  ],
  apparel: [
    { name: "Size", popularValues: ["XS", "S", "M", "L", "XL", "XXL"] },
    { name: "Color", popularValues: ["Black", "White", "Navy", "Olive Green", "Burgundy"] },
    { name: "Material", popularValues: ["100% Organic Cotton", "Merino Wool", "Linen Blend"] }
  ],
  crafts: [
    { name: "Material", popularValues: ["Traditional Pure Wool", "Clay Terracotta", "Woven Palm Leaves", "Brass / Copper"] },
    { name: "Dimensions", popularValues: ["Small (4ft x 6ft)", "Standard (6ft x 9ft)", "Large Grand (8ft x 10ft)"] },
    { name: "Color", popularValues: ["Natural Cream", "Ochre Red", "Indigo Blue", "Henna Brown"] },
    { name: "Finish", popularValues: ["Hand-knotted High Pile", "Glazed Hand-painted", "Natural Raw"] }
  ],
  jewelry: [
    { name: "Material / Metal", popularValues: ["925 Sterling Silver", "18K Gold Plated", "Solid 18K Yellow Gold", "Antique Bronze"] },
    { name: "Gemstone", popularValues: ["Mediterranean Red Coral", "Authentic Turquoise", "Emerald Enamelwork", "Natural Pearl"] },
    { name: "Size / Length", popularValues: ["40 cm (Choker)", "45 cm (Standard Princess)", "50 cm (Matinee)", "60 cm (Opera)"] },
    { name: "Color", popularValues: ["Classic Silver", "Sands Gold", "Coral Red", "Emerald Green"] }
  ],
  furniture: [
    { name: "Material", popularValues: ["Solid Cedar Wood", "Atlas Oak", "Forged Wrought Iron", "Genuine Cowhide Leather"] },
    { name: "Dimensions", popularValues: ["Compact (120x60 cm)", "Standard (160x80 cm)", "Executive (200x100 cm)"] },
    { name: "Color", popularValues: ["Walnut Dark", "Natural Oak", "Espresso", "Honey Pine"] }
  ],
  beauty: [
    { name: "Volume / Size", popularValues: ["30 ml", "50 ml", "100 ml Eau de Parfum", "200 ml"] },
    { name: "Scent / Fragrance", popularValues: ["Blida Rose Blossom", "Royal Amber & Oud", "Sahara Citrus & Mint", "Orange Blossom"] },
    { name: "Skin Type", popularValues: ["All Skin Types", "Sensitive", "Dry / Nourishing", "Oily / Balancing"] }
  ]
};

const MEASUREMENT_UNITS = [
  { value: "pieces", label: "Pieces (pcs)" },
  { value: "grams", label: "Grams (g)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "liters", label: "Liters (L)" },
  { value: "pairs", label: "Pairs" },
  { value: "sets", label: "Sets" },
  { value: "packs", label: "Packs" },
  { value: "meters", label: "Meters (m)" },
  { value: "boxes", label: "Boxes" }
];

const getRecommendedUnitForCategory = (categoryId: string): string => {
  const normId = (categoryId || "").toLowerCase();
  if (normId.includes("food") || normId.includes("grocery") || normId.includes("terroir")) {
    return "grams";
  }
  if (normId.includes("cosmetics") || normId.includes("beauty")) {
    return "ml";
  }
  if (normId.includes("fashion") || normId.includes("clothing") || normId.includes("shoes")) {
    return "pieces";
  }
  if (normId.includes("electronics")) {
    return "pieces";
  }
  return "pieces";
};

interface SpecHintButtonProps {
  fieldName: string;
  currentSlideColor: string;
  activeHintField: string | null;
  setActiveHintField: React.Dispatch<React.SetStateAction<string | null>>;
  showHints?: boolean;
}

const SpecHintButton: React.FC<SpecHintButtonProps> = ({
  fieldName,
  currentSlideColor,
  activeHintField,
  setActiveHintField,
  showHints = true
}) => {
  if (showHints === false) return null;

  const hintText = getSpecHint(fieldName);
  if (!hintText) return null;

  const isOpen = activeHintField === fieldName;

  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveHintField(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen, setActiveHintField]);

  return (
    <span ref={containerRef} className={`relative inline-flex items-center ml-1.5 align-middle select-none shrink-0 group/hint ${isOpen ? "z-[99999]" : "hover:z-[99999] focus-within:z-[99999]"}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setActiveHintField(prev => (prev === fieldName ? null : fieldName));
        }}
        style={
          isOpen
            ? {
                backgroundColor:
                  "var(--yume-theme-header-color, " +
                  (currentSlideColor || "#0b2447") +
                  ")",
                borderColor:
                  "var(--yume-theme-header-color, " +
                  (currentSlideColor || "#0b2447") +
                  ")",
              }
            : undefined
        }
        className={`w-4 h-4 rounded-full flex items-center justify-center transition-all cursor-pointer border text-[10px] font-bold font-mono ${
          isOpen
            ? "text-white shadow-xs scale-105"
            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-300 dark:border-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
        }`}
        aria-label={`Toggle help hint for ${fieldName}`}
        title={`Help hint for ${fieldName}`}
      >
        ?
      </button>

      <span
        data-opaque="true"
        role="tooltip"
        className={`dropdown-menu-opaque opaque-solid-dropdown absolute bottom-full left-0 sm:left-1/2 sm:-translate-x-1/2 mb-2.5 w-64 sm:w-72 max-w-[calc(100vw-2.5rem)] p-3.5 sm:p-4 rounded-2xl shadow-xl z-[9999] text-left transition-all bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 ring-1 ring-black/5 dark:ring-white/10 ${
          isOpen ? "block animate-fade-in" : "hidden group-hover/hint:block"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-4 rounded-full shrink-0 shadow-3xs" style={{ backgroundColor: currentSlideColor || "#0b2447" }} />
            <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate font-sans tracking-tight">
              {fieldName}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveHintField(null);
            }}
            className="w-4 h-4 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center text-xs cursor-pointer transition-colors"
            aria-label="Close hint"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[12px] font-sans text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
          {hintText}
        </p>
        <span className="absolute top-full left-3 sm:left-1/2 sm:-translate-x-1/2 -mt-px border-[6px] border-transparent border-t-white dark:border-t-slate-900 drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)] pointer-events-none" />
      </span>
    </span>
  );
};

interface HintTooltipProps {
  text: string;
  currentSlideColor?: string;
  showHints?: boolean;
  title?: string;
}

const HintTooltip: React.FC<HintTooltipProps> = ({
  text,
  currentSlideColor = "#0b2447",
  showHints = true,
  title
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  if (showHints === false) return null;

  return (
    <span ref={containerRef} className={`relative group/hint inline-flex items-center ml-1.5 align-middle select-none shrink-0 ${isOpen ? "z-[99999]" : "hover:z-[99999] focus-within:z-[99999]"}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={
          isOpen
            ? {
                backgroundColor:
                  "var(--yume-theme-header-color, " +
                  (currentSlideColor || "#0b2447") +
                  ")",
                borderColor:
                  "var(--yume-theme-header-color, " +
                  (currentSlideColor || "#0b2447") +
                  ")",
              }
            : undefined
        }
        className={`w-4 h-4 rounded-full flex items-center justify-center transition-all cursor-pointer border text-[10px] font-bold font-mono ${
          isOpen
            ? "text-white shadow-xs scale-105"
            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-300 dark:border-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
        }`}
        aria-label={title ? `Help hint for ${title}` : "Help hint"}
        title={title ? `Help hint for ${title}` : "Help hint"}
      >
        ?
      </button>

      <span
        data-opaque="true"
        role="tooltip"
        className={`dropdown-menu-opaque opaque-solid-dropdown absolute bottom-full left-0 sm:left-1/2 sm:-translate-x-1/2 mb-2.5 w-64 sm:w-72 max-w-[calc(100vw-2.5rem)] p-3.5 sm:p-4 rounded-2xl shadow-xl z-[9999] text-left transition-all bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 ring-1 ring-black/5 dark:ring-white/10 ${
          isOpen ? "block animate-fade-in" : "hidden group-hover/hint:block"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <span 
              className="w-2 h-4 rounded-full shrink-0 shadow-3xs" 
              style={{ backgroundColor: currentSlideColor || "#0b2447" }} 
            />
            <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate font-sans tracking-tight">
              {title || "Help Guide"}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="w-4 h-4 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center text-xs cursor-pointer transition-colors"
            aria-label="Close hint"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[12px] font-sans text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
          {text}
        </p>
        <span className="absolute top-full left-3 sm:left-1/2 sm:-translate-x-1/2 -mt-px border-[6px] border-transparent border-t-white dark:border-t-slate-900 drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)] pointer-events-none" />
      </span>
    </span>
  );
};

interface WizardStep4SpecsProps {
  currentSlideColor: string;
  blankProductCategory: string;
  setBlankProductCategory: (category: string) => void;
  setBlankProductSku?: (sku: string) => void;
  profSkuPrefix?: string;
  categoryTemplates?: CategoryTemplate[];
  mainCategories?: MainCategory[];
  subcategories?: Subcategory[];
  wizardProductSizes: string[];
  setWizardProductSizes: (s: string[]) => void;
  wizardProductSpecs: Array<{ key: string; value: string }>;
  setWizardProductSpecs: (specs: Array<{ key: string; value: string }>) => void;
  wizardVariantsEnabled: boolean;
  setWizardVariantsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  wizardVariantAttrs: Array<{ name: string; tags: string[] }>;
  setWizardVariantAttrs: React.Dispatch<React.SetStateAction<Array<{ name: string; tags: string[] }>>>;
  wizardAttrInputText: Record<string, string>;
  setWizardAttrInputText: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  wizardProductVariants: any[];
  setWizardProductVariants: React.Dispatch<React.SetStateAction<any[]>>;
  wizardImages: string[];
  setWizardImages?: React.Dispatch<React.SetStateAction<string[]>>;
  blankProductSku: string;
  blankProductPrice: number;
  wizardBundleEnabled: boolean;
  setWizardBundleEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  wizardBundleItems: Array<{ name: string; quantity: number }>;
  setWizardBundleItems: React.Dispatch<React.SetStateAction<Array<{ name: string; quantity: number }>>>;
  wizardBundlePrice: number;
  setWizardBundlePrice: (p: number) => void;
  currentLanguage?: "en" | "ar" | "fr";
  wizardShowHints?: boolean;
  setWizardShowHints?: (v: boolean) => void;
  wizardColorDisplayStyle?: "image_cards" | "circles" | "photo_cards" | "cards" | "solid_circles";
  setWizardColorDisplayStyle?: (style: "image_cards" | "circles" | "photo_cards" | "cards" | "solid_circles") => void;
  wizardColorSwatches?: Array<{ name: string; hex: string; images: string[]; imageUrl?: string; isHot?: boolean; price?: number; stock?: number | "" }>;
  setWizardColorSwatches?: React.Dispatch<React.SetStateAction<Array<{ name: string; hex: string; images: string[]; imageUrl?: string; isHot?: boolean; price?: number; stock?: number | "" }>>>;
  wizardColorStockTrackingEnabled?: boolean;
  setWizardColorStockTrackingEnabled?: (v: boolean) => void;
  wizardSizePrices?: Record<string, number | undefined>;
  setWizardSizePrices?: React.Dispatch<React.SetStateAction<Record<string, number | undefined>>>;
  wizardEnableColorPrices?: boolean;
  setWizardEnableColorPrices?: (v: boolean) => void;
  wizardEnableSizePrices?: boolean;
  setWizardEnableSizePrices?: (v: boolean) => void;
  wizardSpecifyCustomPrices?: boolean;
  setWizardSpecifyCustomPrices?: (v: boolean) => void;
  wizardCurrency?: string;
  wizardDetailedImagesPerColorEnabled?: boolean;
  wizardDetailedImagesByPrimary?: Record<string, string[]>;
  wizardStock?: number | "";
  setWizardStock?: (val: number | "") => void;
  isSplitPreview?: boolean;
  showErrors?: boolean;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  activeMarketCountry?: string;
}

export default function WizardStep4Specs({
  currentSlideColor = "#0b2447",
  blankProductCategory,
  setBlankProductCategory,
  setBlankProductSku,
  profSkuPrefix,
  categoryTemplates = [],
  mainCategories = [],
  subcategories = [],
  wizardProductSizes,
  setWizardProductSizes,
  wizardProductSpecs,
  setWizardProductSpecs,
  wizardVariantsEnabled,
  setWizardVariantsEnabled,
  wizardVariantAttrs,
  setWizardVariantAttrs,
  wizardAttrInputText,
  setWizardAttrInputText,
  wizardProductVariants,
  setWizardProductVariants,
  wizardImages = [],
  setWizardImages,
  blankProductSku,
  blankProductPrice,
  wizardBundleEnabled,
  setWizardBundleEnabled,
  wizardBundleItems,
  setWizardBundleItems,
  wizardBundlePrice,
  setWizardBundlePrice,
  currentLanguage = "en",
  wizardShowHints = false,
  setWizardShowHints = () => {},
  wizardColorDisplayStyle,
  setWizardColorDisplayStyle,
  wizardColorSwatches,
  setWizardColorSwatches,
  wizardColorStockTrackingEnabled,
  setWizardColorStockTrackingEnabled,
  wizardSizePrices,
  setWizardSizePrices,
  wizardEnableColorPrices,
  setWizardEnableColorPrices,
  wizardEnableSizePrices,
  setWizardEnableSizePrices,
  wizardSpecifyCustomPrices,
  setWizardSpecifyCustomPrices,
  wizardCurrency = "DZD",
  wizardDetailedImagesPerColorEnabled = false,
  wizardDetailedImagesByPrimary = {},
  wizardStock = 10,
  setWizardStock = () => {},
  isSplitPreview = false,
  showErrors = false,
  onNextStep,
  onPrevStep,
  activeMarketCountry
}: WizardStep4SpecsProps) {
  const currencySymbol = getCurrencySymbol(wizardCurrency);
  const resolvedMarketCountry = useMemo(() => {
    if (activeMarketCountry) return activeMarketCountry;
    try {
      return localStorage.getItem("dz_country") || "Algeria";
    } catch {
      return "Algeria";
    }
  }, [activeMarketCountry]);
  const activeMarketInfo = useMemo(() => getMarketByCountryOrCode(resolvedMarketCountry), [resolvedMarketCountry]);
  const marketCulturalColors = useMemo(
    () => getMarketCulturalColorPalette(activeMarketInfo.id).swatches,
    [activeMarketInfo.id]
  );
  const [customOptionFields, setCustomOptionFields] = useState<Record<string, boolean>>({});
  const [activeStep3Advice, setActiveStep3Advice] = useState<string>(() => getRandomStepAdvice(3));
  // Safe fallbacks for data sources
  const effectiveMainCategories = useMemo(() => {
    return mainCategories && mainCategories.length > 0 ? mainCategories : DEFAULT_MAIN_CATEGORIES;
  }, [mainCategories]);

  const effectiveSubcategories = useMemo(() => {
    return subcategories && subcategories.length > 0 ? subcategories : DEFAULT_SUBCATEGORIES;
  }, [subcategories]);

  const effectiveCategoryTemplates = useMemo(() => {
    return categoryTemplates && categoryTemplates.length > 0 ? categoryTemplates : DEFAULT_CATEGORY_TEMPLATES;
  }, [categoryTemplates]);

  // Determine initial selected Main Category based on current subcategory
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string>(() => {
    if (!blankProductCategory) return "";
    const matchedSub = effectiveSubcategories.find(
      s => s.id === blankProductCategory || s.names.en.toLowerCase() === blankProductCategory.toLowerCase()
    );
    return matchedSub ? matchedSub.mainCategoryId : "";
  });

  // Sync selected Main Category if blankProductCategory changes externally
  useEffect(() => {
    if (blankProductCategory) {
      const matchedSub = effectiveSubcategories.find(
        s => s.id === blankProductCategory || s.names.en.toLowerCase() === blankProductCategory.toLowerCase()
      );
      if (matchedSub && matchedSub.mainCategoryId !== selectedMainCategoryId) {
        setSelectedMainCategoryId(matchedSub.mainCategoryId);
      }
    }
  }, [blankProductCategory, effectiveSubcategories, selectedMainCategoryId]);

  // Hints Toggle (sync with wizardShowHints prop, defaults to false so hints are off in standard mode)
  const [showPrimarySpecsHints, setShowPrimarySpecsHints] = useState<boolean>(() => {
    return wizardShowHints !== undefined ? wizardShowHints : false;
  });
  const [activeHintField, setActiveHintField] = useState<string | null>(null);

  // Sync when wizardShowHints prop changes externally
  useEffect(() => {
    if (wizardShowHints !== undefined) {
      setShowPrimarySpecsHints(wizardShowHints);
    }
  }, [wizardShowHints]);

  const handleHintsToggle = (val: boolean) => {
    setShowPrimarySpecsHints(val);
    setWizardShowHints?.(val);
  };

  // Close active hint popover on click outside
  useEffect(() => {
    if (!activeHintField) return;
    const handleOutsideClick = () => setActiveHintField(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [activeHintField]);

  // When hints toggle is turned off, close any open hint
  useEffect(() => {
    if (!showPrimarySpecsHints) {
      setActiveHintField(null);
    }
  }, [showPrimarySpecsHints]);

  // Track dropdown open states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openSpecDropdown, setOpenSpecDropdown] = useState<string | null>(null);
  const mainCategoryDropdownRef = useRef<HTMLDivElement | null>(null);
  const subcategoryDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close category/subcategory dropdown or spec dropdown on click outside or Escape
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (openDropdown) {
        if (
          openDropdown === "mainCategory" &&
          mainCategoryDropdownRef.current &&
          !mainCategoryDropdownRef.current.contains(target)
        ) {
          setOpenDropdown(null);
        } else if (
          openDropdown === "subcategory" &&
          subcategoryDropdownRef.current &&
          !subcategoryDropdownRef.current.contains(target)
        ) {
          setOpenDropdown(null);
        }
      }
      if (openSpecDropdown) {
        const targetEl = event.target as HTMLElement;
        if (!targetEl.closest || !targetEl.closest(`[data-spec-dropdown="${openSpecDropdown}"]`)) {
          setOpenSpecDropdown(null);
        }
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenDropdown(null);
        setOpenSpecDropdown(null);
      }
    }

    if (openDropdown || openSpecDropdown) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown, openSpecDropdown]);

  // Size variant prices (matching color variant price linking)
  const [internalSizePrices, setInternalSizePrices] = useState<Record<string, number | undefined>>({});
  const sizePrices = wizardSizePrices || internalSizePrices;
  const setSizePrices = setWizardSizePrices || setInternalSizePrices;

  const updateSizePrice = (sizeName: string, priceVal: number | undefined) => {
    setSizePrices((prev) => {
      const updated = { ...(prev || {}) };
      if (priceVal === undefined || isNaN(priceVal)) {
        delete updated[sizeName];
      } else {
        updated[sizeName] = priceVal;
      }
      return updated;
    });
  };

  // Additional UI states
  const [showAdditionalAttributes, setShowAdditionalAttributes] = useState(false);
  const [showCustomMaterialInput, setShowCustomMaterialInput] = useState(false);
  const [customMaterialText, setCustomMaterialText] = useState("");
  const [brands, setBrands] = useState<any[]>([]);

  // Color variant display style & Swatch manager states
  const [internalColorDisplayStyle, setInternalColorDisplayStyle] = useState<"image_cards" | "circles" | "photo_cards" | "cards" | "solid_circles">("circles");
  const activeColorDisplayStyle = wizardColorDisplayStyle || internalColorDisplayStyle;
  const setActiveColorDisplayStyle = setWizardColorDisplayStyle || setInternalColorDisplayStyle;

  const [internalColorSwatches, setInternalColorSwatches] = useState<Array<{ name: string; hex: string; images: string[]; imageUrl?: string; isHot?: boolean; price?: number; stock?: number | "" }>>([]);
  const colorSwatches = wizardColorSwatches || internalColorSwatches;
  const setColorSwatches = setWizardColorSwatches || setInternalColorSwatches;

  const [internalColorStockTracking, setInternalColorStockTracking] = useState<boolean>(false);
  const colorStockTrackingEnabled = wizardColorStockTrackingEnabled !== undefined
    ? wizardColorStockTrackingEnabled
    : internalColorStockTracking;
  const setColorStockTrackingEnabled = (val: boolean) => {
    if (setWizardColorStockTrackingEnabled) {
      setWizardColorStockTrackingEnabled(val);
    }
    setInternalColorStockTracking(val);
  };

  // Non-destructive memory of variant stock & availability across Color × Size combinations
  const variantStockMemoryRef = useRef<
    Record<
      string,
      {
        stock: number;
        available: boolean;
        lastPositiveStock: number;
        sku?: string;
        price?: number;
      }
    >
  >({});

  const getVariantComboKey = (colorName?: string, sizeName?: string): string => {
    const cKey = (colorName || "__all__").trim().toLowerCase() || "__all__";
    const sKey = (sizeName || "__all__").trim().toLowerCase() || "__all__";
    return `${cKey}::${sKey}`;
  };

  // Seed memory from existing wizardProductVariants on mount / external load
  useEffect(() => {
    if (!Array.isArray(wizardProductVariants) || wizardProductVariants.length === 0) return;
    wizardProductVariants.forEach((v) => {
      const opts = v?.options || {};
      const cName = opts.Color || opts.color || opts.Colour || opts.colour || "";
      const sName =
        opts.Size ||
        opts.size ||
        opts["Shoe Size"] ||
        opts["Ring Size"] ||
        opts.Storage ||
        opts["Storage Capacity"] ||
        opts.Volume ||
        opts.Weight ||
        opts.Dimensions ||
        opts.Configuration ||
        opts.Option ||
        "";
      const key = getVariantComboKey(cName, sName);
      const rawStock = Number(v?.stock);
      const safeStock = isNaN(rawStock) || rawStock < 0 ? 0 : rawStock;
      const isAvail = v?.availability !== "out_of_stock" && safeStock > 0;
      const existing = variantStockMemoryRef.current[key];
      variantStockMemoryRef.current[key] = {
        stock: isAvail ? safeStock : 0,
        available: v?.availability !== "out_of_stock",
        lastPositiveStock:
          safeStock > 0 ? safeStock : existing?.lastPositiveStock || 10,
        sku: v?.sku,
        price: v?.price !== undefined ? Number(v.price) : undefined,
      };
    });
  }, [wizardProductVariants]);

  // Smart Variant Stock Allocation states
  const [smartAllocStock, setSmartAllocStock] = useState<number | "">(10);
  const [smartAllocMode, setSmartAllocMode] = useState<"all_available" | "zero_only">("all_available");
  const [showSmartAllocPreview, setShowSmartAllocPreview] = useState<boolean>(false);
  const [smartAllocAppliedBanner, setSmartAllocAppliedBanner] = useState<string | null>(null);

  // Collapsible 8 Basic Colors Palette state (collapsed by default to reduce clutter)
  const [showBasicColorPalette, setShowBasicColorPalette] = useState<boolean>(false);

  // Active Size System filter tab (e.g., "all", "shoe_eu", "shoe_us", "shoe_uk")
  const [activeSizeSystemId, setActiveSizeSystemId] = useState<string>("all");

  useEffect(() => {
    setActiveSizeSystemId("all");
  }, [selectedMainCategoryId, blankProductCategory]);

  // Build synchronized Color × Size/Option rows for the Manage Stock by Variants table
  const buildSyncedVariantMatrix = (
    swatchesList: typeof colorSwatches,
    sizesList: string[],
    currentVariants: any[],
    customSizePrices: Record<string, number | undefined>,
    defaultNewStock = 10
  ) => {
    const hasColors = Array.isArray(swatchesList) && swatchesList.length > 0;
    const hasSizes = Array.isArray(sizesList) && sizesList.length > 0;
    if (!hasColors && !hasSizes) {
      return [];
    }

    const basePriceNum = Number(blankProductPrice) || 0;
    const baseSkuCode = (blankProductSku || "PROD").trim().toUpperCase();

    // Index current variants by combo key for fast lookup
    const existingByKey = new Map<string, any>();
    (currentVariants || []).forEach((v) => {
      const opts = v?.options || {};
      const cName = opts.Color || opts.color || opts.Colour || opts.colour || "";
      const sName =
        opts.Size ||
        opts.size ||
        opts["Shoe Size"] ||
        opts["Ring Size"] ||
        opts.Storage ||
        opts["Storage Capacity"] ||
        opts.Volume ||
        opts.Weight ||
        opts.Dimensions ||
        opts.Configuration ||
        opts.Option ||
        "";
      existingByKey.set(getVariantComboKey(cName, sName), v);
    });

    const colorItems = hasColors
      ? swatchesList.map((sw) => ({
          name: sw.name,
          hex: sw.hex,
          imageUrl: sw.imageUrl || sw.images?.[0] || "",
          images: sw.images || (sw.imageUrl ? [sw.imageUrl] : []),
          price: sw.price,
          swatchStock: sw.stock,
        }))
      : [{ name: "", hex: "", imageUrl: "", images: [] as string[], price: undefined, swatchStock: undefined }];

    const sizeItems = hasSizes ? sizesList : [""];

    const result: any[] = [];

    colorItems.forEach((cItem) => {
      sizeItems.forEach((sName) => {
        const key = getVariantComboKey(cItem.name, sName);
        const existingVar = existingByKey.get(key);
        const mem = variantStockMemoryRef.current[key];

        // Fallback memory from color-only or size-only if transitioning from 1D to 2D
        const colorOnlyMem = cItem.name ? variantStockMemoryRef.current[getVariantComboKey(cItem.name, "")] : undefined;
        const sizeOnlyMem = sName ? variantStockMemoryRef.current[getVariantComboKey("", sName)] : undefined;

        let resolvedAvailable = true;
        let resolvedStock = defaultNewStock;

        if (existingVar) {
          resolvedAvailable = existingVar.availability !== "out_of_stock";
          const st = Number(existingVar.stock);
          resolvedStock = !isNaN(st) && st >= 0 ? st : defaultNewStock;
        } else if (mem) {
          resolvedAvailable = mem.available;
          resolvedStock = mem.available ? mem.stock : 0;
        } else if (colorOnlyMem) {
          resolvedAvailable = colorOnlyMem.available;
          resolvedStock = colorOnlyMem.available ? colorOnlyMem.stock : 0;
        } else if (sizeOnlyMem) {
          resolvedAvailable = sizeOnlyMem.available;
          resolvedStock = sizeOnlyMem.available ? sizeOnlyMem.stock : 0;
        } else if (cItem.swatchStock !== undefined && cItem.swatchStock !== "") {
          const swSt = Number(cItem.swatchStock);
          if (!isNaN(swSt) && swSt >= 0) {
            resolvedStock = swSt;
            resolvedAvailable = swSt > 0;
          }
        }

        if (!resolvedAvailable) {
          resolvedStock = 0;
        }

        const lastPos =
          resolvedStock > 0
            ? resolvedStock
            : mem?.lastPositiveStock || defaultNewStock;

        // Effective price: size override -> color override -> existing variant price -> base price
        let resolvedPrice = basePriceNum;
        if (sName && customSizePrices[sName] !== undefined) {
          resolvedPrice = Number(customSizePrices[sName]);
        } else if (cItem.price !== undefined) {
          resolvedPrice = Number(cItem.price);
        } else if (existingVar?.price !== undefined && Number(existingVar.price) > 0) {
          resolvedPrice = Number(existingVar.price);
        }

        const skuParts = [baseSkuCode];
        if (cItem.name) {
          skuParts.push(cItem.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase());
        }
        if (sName) {
          skuParts.push(sName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase());
        }
        const generatedSku = existingVar?.sku || mem?.sku || skuParts.join("-");

        const optionsObj: Record<string, string> = {};
        if (cItem.name) optionsObj.Color = cItem.name;
        if (sName) optionsObj.Size = sName;

        const availabilityStatus =
          !resolvedAvailable || resolvedStock <= 0
            ? "out_of_stock"
            : resolvedStock <= 5
            ? "low_stock"
            : "in_stock";

        variantStockMemoryRef.current[key] = {
          stock: resolvedStock,
          available: resolvedAvailable,
          lastPositiveStock: lastPos,
          sku: generatedSku,
          price: resolvedPrice,
        };

        result.push({
          id: existingVar?.id || `var-${key.replace(/[^a-z0-9]/gi, "-")}`,
          sku: generatedSku,
          price: resolvedPrice,
          stock: resolvedStock,
          availability: availabilityStatus,
          options: optionsObj,
          imageUrl: cItem.imageUrl || existingVar?.imageUrl || "",
          images:
            cItem.images && cItem.images.length > 0
              ? cItem.images
              : existingVar?.images || [],
        });
      });
    });

    return result;
  };

  // Sync colorSwatches[].stock from variant rows when Manage Stock by Variants is active
  const syncColorSwatchTotalsFromVariants = (
    variantsList: any[],
    currentSwatches: typeof colorSwatches
  ) => {
    if (!currentSwatches || currentSwatches.length === 0) return currentSwatches;
    let changed = false;
    const nextSwatches = currentSwatches.map((sw) => {
      const matchingVars = (variantsList || []).filter((v) => {
        const cOpt = v?.options?.Color || v?.options?.color || "";
        return cOpt.trim().toLowerCase() === sw.name.trim().toLowerCase();
      });
      if (matchingVars.length === 0) return sw;
      const sumStock = matchingVars.reduce((acc, v) => {
        if (v?.availability === "out_of_stock") return acc;
        const n = Number(v?.stock);
        return acc + (isNaN(n) || n < 0 ? 0 : n);
      }, 0);
      if (Number(sw.stock) !== sumStock) {
        changed = true;
        return { ...sw, stock: sumStock };
      }
      return sw;
    });
    return changed ? nextSwatches : currentSwatches;
  };

  const isManagedByVariants = Boolean(
    wizardVariantsEnabled &&
      colorStockTrackingEnabled &&
      ((colorSwatches && colorSwatches.length > 0) ||
        (wizardProductSizes && wizardProductSizes.length > 0))
  );

  const totalManagedVariantStock = useMemo(() => {
    if (wizardProductVariants && wizardProductVariants.length > 0) {
      return wizardProductVariants.reduce((sum, v) => {
        if (v?.availability === "out_of_stock") return sum;
        const n = Number(v?.stock);
        return sum + (isNaN(n) || n < 0 ? 0 : n);
      }, 0);
    }
    return (colorSwatches || []).reduce((sum, sw) => {
      const n = Number(sw.stock);
      return sum + (isNaN(n) || n < 0 ? 0 : n);
    }, 0);
  }, [wizardProductVariants, colorSwatches]);

  const totalColorStock = totalManagedVariantStock;

  // Keep wizardProductVariants synchronized with Color × Size combinations whenever variants are enabled
  useEffect(() => {
    if (!wizardVariantsEnabled) return;
    const hasColors = colorSwatches && colorSwatches.length > 0;
    const hasSizes = wizardProductSizes && wizardProductSizes.length > 0;
    if (!hasColors && !hasSizes) return;

    const expectedCount =
      (hasColors ? colorSwatches.length : 1) *
      (hasSizes ? wizardProductSizes.length : 1);

    // Check if current wizardProductVariants already matches every expected Color × Size key
    const currentKeys = new Set(
      (wizardProductVariants || []).map((v) =>
        getVariantComboKey(
          v?.options?.Color || v?.options?.color || "",
          v?.options?.Size || v?.options?.size || ""
        )
      )
    );

    let needsSync = (wizardProductVariants || []).length !== expectedCount;
    if (!needsSync) {
      const cList = hasColors ? colorSwatches.map((c) => c.name) : [""];
      const sList = hasSizes ? wizardProductSizes : [""];
      for (const c of cList) {
        for (const s of sList) {
          if (!currentKeys.has(getVariantComboKey(c, s))) {
            needsSync = true;
            break;
          }
        }
        if (needsSync) break;
      }
    }

    if (needsSync) {
      const synced = buildSyncedVariantMatrix(
        colorSwatches,
        wizardProductSizes,
        wizardProductVariants,
        sizePrices,
        Number(smartAllocStock) > 0 ? Number(smartAllocStock) : 10
      );
      setWizardProductVariants(synced);
      if (colorStockTrackingEnabled && hasColors) {
        const updatedSwatches = syncColorSwatchTotalsFromVariants(synced, colorSwatches);
        if (updatedSwatches !== colorSwatches) {
          setColorSwatches(updatedSwatches);
        }
      }
    }
  }, [
    wizardVariantsEnabled,
    colorSwatches,
    wizardProductSizes,
    colorStockTrackingEnabled,
  ]);

  useEffect(() => {
    if (isManagedByVariants) {
      if (wizardStock !== totalManagedVariantStock) {
        setWizardStock(totalManagedVariantStock);
      }
    }
  }, [isManagedByVariants, totalManagedVariantStock, wizardStock, setWizardStock]);

  const [previewSelectedSwatchIdx, setPreviewSelectedSwatchIdx] = useState<number>(0);

  // Compute all variant models and swatches chosen by the user for live sell page preview
  const displaySwatches = useMemo(() => {
    if (colorSwatches && colorSwatches.length > 0) {
      return colorSwatches;
    }
    if (wizardProductVariants && wizardProductVariants.length > 0) {
      return wizardProductVariants.map((v, i) => {
        const optLabel = Object.values(v.options || {}).join(" / ") || `Option #${i + 1}`;
        const img = v.images?.[0] || v.imageUrl || "";
        return {
          name: optLabel,
          hex: "#94a3b8",
          images: img ? [img] : [],
          imageUrl: img
        };
      });
    }
    return [];
  }, [colorSwatches, wizardProductVariants]);

  // Collection of all main product images for color circle and variant mapping
  const allMainProductImages = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    const add = (url: unknown) => {
      if (!url || typeof url !== "string") return;
      const trimmed = url.trim();
      if (!trimmed || trimmed === "null" || trimmed === "undefined") return;
      if (seen.has(trimmed)) return;
      seen.add(trimmed);
      list.push(trimmed);
    };

    (wizardImages || []).forEach(add);
    if (list.length === 0) {
      (colorSwatches || []).forEach(sw => {
        if (sw.imageUrl) add(sw.imageUrl);
        (sw.images || []).forEach(add);
      });
      (wizardProductVariants || []).forEach(v => {
        if (v.imageUrl) add(v.imageUrl);
        (v.images || []).forEach(add);
      });
    }

    return list;
  }, [wizardImages, colorSwatches, wizardProductVariants]);

  const effectiveSelectedSwatchIdx = previewSelectedSwatchIdx < displaySwatches.length ? previewSelectedSwatchIdx : 0;
  const currentSelectedSwatch = displaySwatches[effectiveSelectedSwatchIdx];

  // Permission state for custom variant prices across colors and sizes
  const [internalSpecifyCustomPrices, setInternalSpecifyCustomPrices] = useState<boolean>(() => {
    if (wizardSpecifyCustomPrices !== undefined) return wizardSpecifyCustomPrices;
    return false;
  });
  const specifyCustomPrices = wizardSpecifyCustomPrices !== undefined ? wizardSpecifyCustomPrices : internalSpecifyCustomPrices;

  const [internalEnableColorPrices, setInternalEnableColorPrices] = useState<boolean>(false);
  const enableColorVariantPrices = specifyCustomPrices;
  const setEnableColorVariantPrices = (val: boolean) => setSpecifyCustomPrices(val);

  const [internalEnableSizePrices, setInternalEnableSizePrices] = useState<boolean>(false);
  const enableSizeVariantPrices = specifyCustomPrices;
  const setEnableSizeVariantPrices = (val: boolean) => setSpecifyCustomPrices(val);

  const setSpecifyCustomPrices = (val: boolean) => {
    if (setWizardSpecifyCustomPrices) setWizardSpecifyCustomPrices(val);
    setInternalSpecifyCustomPrices(val);
    if (setWizardEnableColorPrices) setWizardEnableColorPrices(val);
    if (setWizardEnableSizePrices) setWizardEnableSizePrices(val);
    setInternalEnableColorPrices(val);
    setInternalEnableSizePrices(val);
  };

  const [activeColorFamilyPopover, setActiveColorFamilyPopover] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [customSizeText, setCustomSizeText] = useState("");

  const [customSwatchName, setCustomSwatchName] = useState("");
  const [isCustomNameAutoFilled, setIsCustomNameAutoFilled] = useState(false);
  const [customSwatchHex, setCustomSwatchHex] = useState("#3B82F6");
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-detect unique color name and base root family from current hex
  const detectedColorInfo = useMemo(() => {
    const existingNames = colorSwatches.map((c) => c.name);
    return getClosestColorName(customSwatchHex, existingNames);
  }, [customSwatchHex, colorSwatches]);

  // When merchant picks a color from the color spectrum picker, update hex and refresh auto-filled or colliding name
  const handleCustomHexChange = (hex: string) => {
    const normalized = hex.toUpperCase();
    setCustomSwatchHex(normalized);
    const existingNames = colorSwatches.map((c) => c.name);
    const isCurrentNameDuplicate =
      customSwatchName.trim() !== "" &&
      existingNames.some((n) => n.toLowerCase() === customSwatchName.trim().toLowerCase());
    if (!customSwatchName.trim() || isCustomNameAutoFilled || isCurrentNameDuplicate) {
      const closest = getClosestColorName(normalized, existingNames);
      if (closest?.name) {
        setCustomSwatchName(closest.name);
        setIsCustomNameAutoFilled(true);
      }
    }
  };

  const triggerColorPicker = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (colorInputRef.current) {
      if (typeof (colorInputRef.current as any).showPicker === "function") {
        try {
          (colorInputRef.current as any).showPicker();
          return;
        } catch {
          // Fallback to click if showPicker fails
        }
      }
      colorInputRef.current.click();
    }
  };

  // Direct Screen Eyedropper Tool (EyeDropper API with native color input fallback on first click)
  const handleEyedropperClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && typeof result.sRGBHex === "string") {
          const sampledHex = result.sRGBHex.toUpperCase();
          setCustomSwatchHex(sampledHex);
          const existingNames = colorSwatches.map((c) => c.name);
          const closest = getClosestColorName(sampledHex, existingNames);
          if (closest?.name) {
            setCustomSwatchName(closest.name);
            setIsCustomNameAutoFilled(true);
          }
        }
        return;
      } catch (err: any) {
        // User pressed Escape to cancel sampling
        if (err?.name === "AbortError") {
          return;
        }
      }
    }
    triggerColorPicker(e);
  };

  // Close color family popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveColorFamilyPopover(null);
      }
    }
    if (activeColorFamilyPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeColorFamilyPopover]);

  const handleAddCustomSize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customSizeText.trim();
    if (!trimmed) return;
    if (!wizardProductSizes.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      const nextSizes = [...wizardProductSizes, trimmed];
      setWizardProductSizes(nextSizes);
      if (wizardVariantsEnabled) {
        const nextAttrs = [...wizardVariantAttrs];
        const sizeIdx = nextAttrs.findIndex((a) => a.name.toLowerCase() === "size");
        if (sizeIdx !== -1) {
          nextAttrs[sizeIdx] = { ...nextAttrs[sizeIdx], tags: nextSizes };
        } else {
          nextAttrs.push({ name: "Size", tags: nextSizes });
        }
        setWizardVariantAttrs(sortVariantAttributes(nextAttrs));
        const synced = buildSyncedVariantMatrix(
          colorSwatches,
          nextSizes,
          wizardProductVariants,
          sizePrices,
          Number(smartAllocStock) > 0 ? Number(smartAllocStock) : 10
        );
        setWizardProductVariants(synced);
        if (colorStockTrackingEnabled && colorSwatches.length > 0) {
          setColorSwatches(syncColorSwatchTotalsFromVariants(synced, colorSwatches));
        }
      }
    }
    setCustomSizeText("");
  };

  // Load brands on mount
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const data = await fetchBrandsFromFirestore();
        setBrands(data);
      } catch (err) {
        console.error("Error loading brands: ", err);
      }
    };
    loadBrands();
  }, []);

  // Helper to enrich electronics_all or any category with 2026/2027 fields
  const getNormalizedTemplateFields = (rawFields: any[], catId: string) => {
    const baseFields = Array.isArray(rawFields) ? [...rawFields] : [];
    const normCat = (catId || "").toLowerCase();
    if (normCat === "electronics_all" || normCat.includes("smartphone")) {
      const core8 = [
        { name: "Brand", type: "select", required: true },
        { name: "Processor", type: "select", required: false },
        { name: "Storage", type: "select", required: false },
        { name: "RAM", type: "select", required: false },
        { name: "Operating System", type: "select", required: false },
        { name: "Camera Specs", type: "select", required: false },
        { name: "SIM Type", type: "select", required: false },
        { name: "Screen Size", type: "select", required: false }
      ];
      core8.forEach(c => {
        if (!baseFields.some(f => f.name.toLowerCase() === c.name.toLowerCase())) {
          baseFields.push(c);
        }
      });
    }
    return normalizeCategoryFieldsWith2026Specs(baseFields, catId);
  };

  // Resolve active template for selected subcategory
  const activeTemplate = useMemo(() => {
    if (!blankProductCategory) {
      return {
        id: "General",
        name: "General product",
        sizeSystem: { enabled: false, label: "Sizes available", sizes: [] },
        recommendedMaterials: ["Natural organic", "Recycled", "Handmade blend"],
        fields: normalizeCategoryFieldsWith2026Specs([], "General")
      } as CategoryTemplate;
    }

    const foundSub = effectiveSubcategories.find(
      s => s.id === blankProductCategory || s.names.en.toLowerCase() === blankProductCategory.toLowerCase()
    );
    if (foundSub) {
      return {
        id: foundSub.id,
        name: foundSub.names[currentLanguage] || foundSub.names.en || foundSub.id,
        sizeSystem: foundSub.sizeSystem || { enabled: false, label: "Sizes available", sizes: [] },
        recommendedMaterials: foundSub.recommendedMaterials || [],
        fields: getNormalizedTemplateFields(foundSub.fields || [], foundSub.id)
      } as CategoryTemplate;
    }

    const normalized = blankProductCategory.toLowerCase();
    const legacy = effectiveCategoryTemplates.find(
      t => t.id.toLowerCase() === normalized || normalized.includes(t.id.toLowerCase())
    );
    if (legacy) {
      return {
        ...legacy,
        fields: getNormalizedTemplateFields(legacy.fields || [], legacy.id)
      };
    }

    return {
      id: "General",
      name: "General product",
      sizeSystem: { enabled: false, label: "Sizes available", sizes: [] },
      recommendedMaterials: ["Natural organic", "Recycled", "Handmade blend"],
      fields: normalizeCategoryFieldsWith2026Specs([], blankProductCategory)
    } as CategoryTemplate;
  }, [blankProductCategory, effectiveSubcategories, effectiveCategoryTemplates, currentLanguage]);

  // Smart Category-Based Size & Option System Configuration
  const smartSizeConfig = useMemo(() => {
    return getCategorySmartSizeConfig({
      mainCategoryId: selectedMainCategoryId,
      subcategoryId: blankProductCategory,
      templateSizeSystem: activeTemplate.sizeSystem,
    });
  }, [selectedMainCategoryId, blankProductCategory, activeTemplate.sizeSystem]);

  const visibleSizePresets = useMemo(() => {
    if (activeSizeSystemId === "all" || smartSizeConfig.systems.length <= 1) {
      return smartSizeConfig.allPresets;
    }
    const foundSys = smartSizeConfig.systems.find((s) => s.id === activeSizeSystemId);
    return foundSys ? foundSys.sizes : smartSizeConfig.allPresets;
  }, [smartSizeConfig, activeSizeSystemId]);

  // Handle Main Category selection change
  const handleMainCategorySelect = (mainCatId: string) => {
    setSelectedMainCategoryId(mainCatId);
    setBlankProductCategory(""); // Reset subcategory
    setWizardProductSpecs([]); // Reset specs
    setWizardProductSizes([]); // Reset sizes
    setWizardProductVariants([]); // Reset variants
    setWizardVariantAttrs([]); // Reset variant attributes
    setCustomOptionFields({});
    setOpenDropdown(null);
  };

  // Handle Subcategory selection change
  const handleSubcategorySelect = (subId: string) => {
    setBlankProductCategory(subId);
    setCustomOptionFields({});
    setOpenDropdown(null);

    const subObj = effectiveSubcategories.find(s => s.id === subId);
    if (subObj && setBlankProductSku) {
      const prefix = (subObj.names.en || "CRA").substring(0, 3).toUpperCase();
      const rand = Math.floor(100000 + Math.random() * 900000);
      setBlankProductSku(`${prefix}-${rand}`);
    }

    // Initialize specs for selected subcategory template
    const newSpecs: Array<{ key: string; value: string }> = [];
    const recommendedUnit = getRecommendedUnitForCategory(subId);
    newSpecs.push({ key: "Measurement unit", value: recommendedUnit });

    const fields = getNormalizedTemplateFields(subObj?.fields || [], subId);
    fields.forEach(f => {
      if (f.name.toLowerCase() === "material") {
        newSpecs.push({ key: f.name, value: subObj?.recommendedMaterials?.[0] || "" });
      } else if (f.type === "boolean") {
        newSpecs.push({ key: f.name, value: "false" });
      } else {
        newSpecs.push({ key: f.name, value: "" });
      }
    });

    setWizardProductSpecs(newSpecs);
  };

  // Specification getters & setters
  const getSpecValue = (key: string): string => {
    const item = wizardProductSpecs.find(s => s.key.toLowerCase() === key.toLowerCase());
    return item ? item.value : "";
  };

  const handleSpecChange = (key: string, value: string) => {
    const idx = wizardProductSpecs.findIndex(s => s.key.toLowerCase() === key.toLowerCase());
    if (idx !== -1) {
      const updated = [...wizardProductSpecs];
      updated[idx].value = value;
      setWizardProductSpecs(updated);
    } else {
      setWizardProductSpecs([...wizardProductSpecs, { key, value }]);
    }
  };

  // Toggle multi-select variant option directly from any variant-capable specification field
  const toggleMultiVariantSpecValue = (specLabel: string, optionVal: string) => {
    if (!optionVal || optionVal === CUSTOM_OTHER_OPTION) return;
    if (!wizardVariantsEnabled) {
      setWizardVariantsEnabled(true);
    }
    const existingIdx = wizardVariantAttrs.findIndex(
      a => a.name.trim().toLowerCase() === specLabel.trim().toLowerCase()
    );
    let nextAttrs = [...wizardVariantAttrs];
    if (existingIdx !== -1) {
      const currentTags = nextAttrs[existingIdx].tags || [];
      const hasVal = currentTags.some(t => t.toLowerCase() === optionVal.toLowerCase());
      const updatedTags = hasVal
        ? currentTags.filter(t => t.toLowerCase() !== optionVal.toLowerCase())
        : [...currentTags, optionVal];
      if (updatedTags.length === 0) {
        nextAttrs = nextAttrs.filter((_, i) => i !== existingIdx);
      } else {
        nextAttrs[existingIdx] = { ...nextAttrs[existingIdx], tags: updatedTags };
      }
    } else {
      nextAttrs.push({ name: specLabel, tags: [optionVal] });
    }
    const sortedNextAttrs = sortVariantAttributes(nextAttrs);
    setWizardVariantAttrs(sortedNextAttrs);

    // Also set primary spec value if empty
    const currentPrimary = getSpecValue(specLabel);
    if (!currentPrimary) {
      handleSpecChange(specLabel, optionVal);
    }
  };

  // Toggle size selection (non-destructively updates variant matrix)
  const toggleSize = (sizeStr: string) => {
    let nextSizes: string[];
    if (wizardProductSizes.includes(sizeStr)) {
      nextSizes = wizardProductSizes.filter(s => s !== sizeStr);
      updateSizePrice(sizeStr, undefined);
    } else {
      nextSizes = [...wizardProductSizes, sizeStr];
    }
    setWizardProductSizes(nextSizes);

    if (wizardVariantsEnabled) {
      const nextAttrs = [...wizardVariantAttrs];
      const sizeIdx = nextAttrs.findIndex(a => a.name.toLowerCase() === "size");
      if (nextSizes.length > 0) {
        if (sizeIdx !== -1) {
          nextAttrs[sizeIdx] = { ...nextAttrs[sizeIdx], tags: nextSizes };
        } else {
          nextAttrs.push({ name: "Size", tags: nextSizes });
        }
      } else if (sizeIdx !== -1) {
        nextAttrs.splice(sizeIdx, 1);
      }
      setWizardVariantAttrs(sortVariantAttributes(nextAttrs));

      const synced = buildSyncedVariantMatrix(
        colorSwatches,
        nextSizes,
        wizardProductVariants,
        sizePrices,
        Number(smartAllocStock) > 0 ? Number(smartAllocStock) : 10
      );
      setWizardProductVariants(synced);
      if (colorStockTrackingEnabled && colorSwatches.length > 0) {
        setColorSwatches(syncColorSwatchTotalsFromVariants(synced, colorSwatches));
      }
    }
  };

  // Add color swatch (non-destructively updates variant matrix and never blocks on duplicate shade names)
  const handleAddColorSwatch = (name: string, hex: string) => {
    const existingNames = colorSwatches.map((c) => c.name);
    const existingLower = new Set(existingNames.map((n) => n.trim().toLowerCase()));
    const trimmedInput = name.trim();

    let resolvedName = trimmedInput;
    if (!resolvedName || (existingLower.has(resolvedName.toLowerCase()) && isCustomNameAutoFilled)) {
      resolvedName = getClosestColorName(hex, existingNames).name;
    }
    if (!resolvedName) return;

    // If the resolved name still collides with an existing swatch name, disambiguate instead of blocking
    if (existingLower.has(resolvedName.toLowerCase())) {
      const alt = getClosestColorName(hex, existingNames).name;
      if (alt && !existingLower.has(alt.toLowerCase())) {
        resolvedName = alt;
      } else {
        const baseName = resolvedName.replace(/\s+\d+$/, "");
        let counter = 2;
        while (existingLower.has(`${baseName} ${counter}`.toLowerCase())) {
          counter++;
        }
        resolvedName = `${baseName} ${counter}`;
      }
    }

    const defaultSt = Number(smartAllocStock) > 0 ? Number(smartAllocStock) : 10;
    const newSwatches = [
      ...colorSwatches,
      {
        name: resolvedName,
        hex: hex.toUpperCase(),
        images: [],
        stock: colorStockTrackingEnabled ? defaultSt : undefined,
      },
    ];
    setColorSwatches(newSwatches);

    if (wizardVariantsEnabled) {
      const colorAttrIdx = wizardVariantAttrs.findIndex(a => a.name.toLowerCase() === "color");
      let nextAttrs = [...wizardVariantAttrs];
      if (colorAttrIdx !== -1) {
        if (!nextAttrs[colorAttrIdx].tags.some(t => t.toLowerCase() === resolvedName.toLowerCase())) {
          nextAttrs[colorAttrIdx] = {
            ...nextAttrs[colorAttrIdx],
            tags: [...nextAttrs[colorAttrIdx].tags, resolvedName]
          };
        }
      } else {
        nextAttrs = [...nextAttrs, { name: "Color", tags: [resolvedName] }];
      }
      setWizardVariantAttrs(sortVariantAttributes(nextAttrs));

      const synced = buildSyncedVariantMatrix(
        newSwatches,
        wizardProductSizes,
        wizardProductVariants,
        sizePrices,
        defaultSt
      );
      setWizardProductVariants(synced);
      if (colorStockTrackingEnabled) {
        setColorSwatches(syncColorSwatchTotalsFromVariants(synced, newSwatches));
      }
    }
    setCustomSwatchName("");
    setIsCustomNameAutoFilled(false);
  };

  // Remove color swatch (non-destructively updates variant matrix)
  const handleRemoveColorSwatch = (sIdx: number) => {
    const removedSwatch = colorSwatches[sIdx];
    if (!removedSwatch) return;
    const removedName = removedSwatch.name;
    const nextSw = colorSwatches.filter((_, i) => i !== sIdx);
    setColorSwatches(nextSw);

    if (wizardVariantsEnabled) {
      const nextAttrs = wizardVariantAttrs
        .map((a) => {
          if (a.name.toLowerCase() === "color") {
            return {
              ...a,
              tags: a.tags.filter((t) => t.toLowerCase() !== removedName.toLowerCase()),
            };
          }
          return a;
        })
        .filter((a) => a.tags.length > 0);
      setWizardVariantAttrs(sortVariantAttributes(nextAttrs));

      const synced = buildSyncedVariantMatrix(
        nextSw,
        wizardProductSizes,
        wizardProductVariants,
        sizePrices,
        Number(smartAllocStock) > 0 ? Number(smartAllocStock) : 10
      );
      setWizardProductVariants(synced);
      if (colorStockTrackingEnabled && nextSw.length > 0) {
        setColorSwatches(syncColorSwatchTotalsFromVariants(synced, nextSw));
      }
    }
  };

  // Update specific field on color swatch
  const updateSwatchField = (swatchIndex: number, field: string, val: any) => {
    const updated = [...colorSwatches];
    updated[swatchIndex] = { ...updated[swatchIndex], [field]: val };
    setColorSwatches(updated);
  };

  // Update stock quantity for a specific Color × Size/Option row in Manage Stock by Variants
  const handleUpdateVariantRowStock = (variantIndex: number, rawVal: string) => {
    const targetVar = wizardProductVariants[variantIndex];
    if (!targetVar) return;
    const parsed = rawVal === "" ? 0 : Math.max(0, parseInt(rawVal, 10) || 0);
    const cName = targetVar?.options?.Color || targetVar?.options?.color || "";
    const sName = targetVar?.options?.Size || targetVar?.options?.size || "";
    const key = getVariantComboKey(cName, sName);

    const isAvail = parsed > 0;
    const prevMem = variantStockMemoryRef.current[key];
    variantStockMemoryRef.current[key] = {
      stock: parsed,
      available: isAvail,
      lastPositiveStock: parsed > 0 ? parsed : prevMem?.lastPositiveStock || 10,
      sku: targetVar.sku,
      price: targetVar.price,
    };

    const nextVariants = wizardProductVariants.map((v, idx) => {
      if (idx !== variantIndex) return v;
      return {
        ...v,
        stock: parsed,
        availability: parsed <= 0 ? "out_of_stock" : parsed <= 5 ? "low_stock" : "in_stock",
      };
    });
    setWizardProductVariants(nextVariants);

    if (colorSwatches.length > 0) {
      setColorSwatches(syncColorSwatchTotalsFromVariants(nextVariants, colorSwatches));
    }
  };

  // Toggle Available / Unavailable for a specific Color × Size/Option row
  const handleToggleVariantRowAvailability = (variantIndex: number) => {
    const targetVar = wizardProductVariants[variantIndex];
    if (!targetVar) return;
    const cName = targetVar?.options?.Color || targetVar?.options?.color || "";
    const sName = targetVar?.options?.Size || targetVar?.options?.size || "";
    const key = getVariantComboKey(cName, sName);
    const prevMem = variantStockMemoryRef.current[key];

    const currentlyAvailable = targetVar.availability !== "out_of_stock" && Number(targetVar.stock) > 0;
    const nextAvailable = !currentlyAvailable;
    const restoredStock = nextAvailable
      ? prevMem?.lastPositiveStock && prevMem.lastPositiveStock > 0
        ? prevMem.lastPositiveStock
        : Number(smartAllocStock) > 0
        ? Number(smartAllocStock)
        : 10
      : 0;

    variantStockMemoryRef.current[key] = {
      stock: restoredStock,
      available: nextAvailable,
      lastPositiveStock:
        currentlyAvailable && Number(targetVar.stock) > 0
          ? Number(targetVar.stock)
          : prevMem?.lastPositiveStock || 10,
      sku: targetVar.sku,
      price: targetVar.price,
    };

    const nextVariants = wizardProductVariants.map((v, idx) => {
      if (idx !== variantIndex) return v;
      return {
        ...v,
        stock: restoredStock,
        availability: !nextAvailable || restoredStock <= 0
          ? "out_of_stock"
          : restoredStock <= 5
          ? "low_stock"
          : "in_stock",
      };
    });
    setWizardProductVariants(nextVariants);

    if (colorSwatches.length > 0) {
      setColorSwatches(syncColorSwatchTotalsFromVariants(nextVariants, colorSwatches));
    }
  };

  // Smart Variant Stock Allocation preview stats
  const smartAllocationStats = useMemo(() => {
    const allocQty = Math.max(0, parseInt(String(smartAllocStock || 0), 10) || 0);
    const rows = wizardProductVariants || [];
    let affectedCount = 0;
    let projectedTotal = 0;

    rows.forEach((v) => {
      const isUnavailable = v?.availability === "out_of_stock" && Number(v?.stock) <= 0;
      const currentSt = Math.max(0, Number(v?.stock) || 0);

      if (smartAllocMode === "all_available") {
        if (!isUnavailable) {
          affectedCount += 1;
          projectedTotal += allocQty;
        }
      } else {
        // zero_only: allocate to variants that currently have 0 stock
        if (currentSt === 0) {
          affectedCount += 1;
          projectedTotal += allocQty;
        } else {
          projectedTotal += currentSt;
        }
      }
    });

    return {
      allocQty,
      affectedCount,
      projectedTotal,
      totalRows: rows.length,
    };
  }, [wizardProductVariants, smartAllocStock, smartAllocMode]);

  // Apply Smart Variant Stock Allocation across target combinations
  const handleConfirmSmartStockAllocation = () => {
    const allocQty = Math.max(0, parseInt(String(smartAllocStock || 0), 10) || 0);
    if (!wizardProductVariants || wizardProductVariants.length === 0) return;

    let updatedCount = 0;
    const nextVariants = wizardProductVariants.map((v) => {
      const cName = v?.options?.Color || v?.options?.color || "";
      const sName = v?.options?.Size || v?.options?.size || "";
      const key = getVariantComboKey(cName, sName);
      const isUnavailable = v?.availability === "out_of_stock" && Number(v?.stock) <= 0;
      const currentSt = Math.max(0, Number(v?.stock) || 0);

      const shouldUpdate =
        smartAllocMode === "all_available" ? !isUnavailable : currentSt === 0;

      if (!shouldUpdate) return v;

      updatedCount += 1;
      const nextAvail = allocQty > 0 ? (allocQty <= 5 ? "low_stock" : "in_stock") : "out_of_stock";
      variantStockMemoryRef.current[key] = {
        stock: allocQty,
        available: allocQty > 0,
        lastPositiveStock: allocQty > 0 ? allocQty : variantStockMemoryRef.current[key]?.lastPositiveStock || 10,
        sku: v.sku,
        price: v.price,
      };
      return {
        ...v,
        stock: allocQty,
        availability: nextAvail,
      };
    });

    setWizardProductVariants(nextVariants);
    if (colorSwatches.length > 0) {
      setColorSwatches(syncColorSwatchTotalsFromVariants(nextVariants, colorSwatches));
    }
    setShowSmartAllocPreview(false);
    setSmartAllocAppliedBanner(
      `Allocated ${allocQty} pcs across ${updatedCount} variant combination${updatedCount === 1 ? "" : "s"}.`
    );
    setTimeout(() => {
      setSmartAllocAppliedBanner(null);
    }, 3500);
  };

  // Check if a specification field supports multi-select variant generation
  const isVariantCapableSpec = (fieldName: string): boolean => {
    const norm = (fieldName || "").trim().toLowerCase();
    // Measurement unit is never a variant
    if (isMeasurementUnitAttribute(norm)) {
      return false;
    }
    // Explicitly allow Gender and Fit to be added as multi-variants per user requirements
    if (
      ["gender", "genre", "sexe", "جنس", "الجنس"].some(k => norm === k || norm.includes(k)) ||
      ["fit", "fit type", "coupe", "قصة", "قَصَّة"].some(k => norm === k || norm.includes(k))
    ) {
      return true;
    }
    const cat = String(blankProductCategory || selectedMainCategoryId || "").toLowerCase();
    const isFashion = isFashionProductCategory(cat);
    // On fashion categories, season, brand, etc. are pure specifications, NOT variant variables
    if (isFashion && isFashionNonVariantAttribute(norm)) {
      return false;
    }
    return true;
  };

  // Render single field input
  const renderField = (field: { name: string; type: string; required?: boolean; options?: string[]; placeholder?: string; unit?: string }) => {
    const label = field.name;
    const value = getSpecValue(label);
    const isMissing = !!(showErrors && field.required && (!value || !value.toString().trim()));

    if (field.type === "select" && field.options && field.options.length > 0) {
      const isGenderField = ["gender", "genre", "sexe", "جنس", "الجنس"].some(
        k => label.toLowerCase() === k || label.toLowerCase().includes(k)
      );

      // Check if current category is a kid category
      const isKidCategory = ["kid", "child", "children", "baby", "babies", "enfant", "طفل", "أطفال", "bebe", "boy", "girl"].some(k =>
        (blankProductCategory || "").toLowerCase().includes(k) ||
        (selectedMainCategoryId || "").toLowerCase().includes(k) ||
        (activeTemplate?.id || "").toLowerCase().includes(k) ||
        (activeTemplate?.name || "").toLowerCase().includes(k)
      );

      // In gender field, display just Men, Women (or Boys, Girls in kid categories), and NOT unisex or custom
      const effectiveOptions = isGenderField
        ? (isKidCategory ? ["Boys", "Girls"] : ["Men", "Women"])
        : field.options;

      const optionsWithCustom = isGenderField
        ? effectiveOptions
        : (effectiveOptions.includes(CUSTOM_OTHER_OPTION)
            ? effectiveOptions
            : [...effectiveOptions, CUSTOM_OTHER_OPTION]);

      const isCustomUnlocked = !isGenderField && (
        Boolean(customOptionFields[label]) ||
        (Boolean(value) && value !== CUSTOM_OTHER_OPTION && !optionsWithCustom.includes(value))
      );
      const selectDisplayValue = isCustomUnlocked
        ? CUSTOM_OTHER_OPTION
        : (isGenderField && value && !optionsWithCustom.includes(value) ? "" : value);
      const variantAttrForField = wizardVariantAttrs.find(
        a => a.name.trim().toLowerCase() === label.trim().toLowerCase()
      );
      const selectedVariantTags = variantAttrForField?.tags || [];
      const canMultiSelect = isVariantCapableSpec(label);
      const isDropdownOpen = openSpecDropdown === label;

      return (
        <div key={label} className={`flex flex-col gap-1.5 relative ${isDropdownOpen ? "z-[60]" : "z-10"}`} data-spec-dropdown={label}>
          <label className="text-xs font-black flex items-center font-mono text-slate-900 dark:text-slate-100" style={{ fontSize: "11px", color: "#1e1e1e" }}>
            <span>{label}</span>
            {field.required && <span className="text-rose-500 font-bold ml-1 text-sm leading-none" title="Required">*</span>}
            <SpecHintButton
              fieldName={label}
              currentSlideColor={currentSlideColor}
              activeHintField={activeHintField}
              setActiveHintField={setActiveHintField}
              showHints={showPrimarySpecsHints}
            />
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenSpecDropdown(isDropdownOpen ? null : label)}
              className={`w-full text-xs font-bold bg-[#f8fafc] hover:bg-slate-100/70 focus:bg-white border rounded-[8px] p-3 pr-8 transition-all outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer text-left flex items-center justify-between ${
                isMissing
                  ? "border-rose-500 ring-2 ring-rose-500/15 bg-white text-slate-900"
                  : "border-[#cbd5e1] hover:border-slate-400 text-slate-900 dark:text-white"
              }`}
            >
              <span className={`truncate ${!selectDisplayValue ? "text-slate-400 font-normal" : "text-slate-900 dark:text-white"}`}>
                {isCustomUnlocked
                  ? `${CUSTOM_OTHER_OPTION}: ${value || "Enter custom..."}`
                  : selectDisplayValue || field.placeholder || `Select ${label.toLowerCase()}`}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200 pointer-events-none ${isDropdownOpen ? "rotate-180 text-slate-700" : ""}`} />
            </button>

            {/* Custom Interactive Dropdown Menu with plus (+) symbol on the right side inside of the list */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[9999] overflow-hidden max-h-64 flex flex-col animate-fade-in">
                <div className="overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800">
                  {optionsWithCustom.map(opt => {
                    const isTagSelected = selectedVariantTags.some(
                      t => t.toLowerCase() === opt.toLowerCase()
                    );
                    const isCurrentPrimary = value === opt;

                    return (
                      <div
                        key={opt}
                        onClick={() => {
                          if (opt === CUSTOM_OTHER_OPTION) {
                            setCustomOptionFields(prev => ({ ...prev, [label]: true }));
                            if (optionsWithCustom.includes(value)) {
                              handleSpecChange(label, "");
                            }
                            setOpenSpecDropdown(null);
                          } else {
                            setCustomOptionFields(prev => ({ ...prev, [label]: false }));
                            handleSpecChange(label, opt);
                            // Do NOT automatically define variables as variants when simply selecting an option from dropdown.
                            // Variables must be defined explicitly by the client clicking the (+) button.
                            setOpenSpecDropdown(null);
                          }
                        }}
                        className={`px-3.5 py-2.5 flex items-center justify-between gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors text-xs font-semibold group ${
                          isTagSelected || isCurrentPrimary
                            ? "bg-slate-50 dark:bg-slate-800/40 text-stone-900 dark:text-white font-bold"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="truncate flex-1">{opt}</span>

                        {/* Plus (+) symbol on the right side inside of the list to add more than one variant */}
                        {canMultiSelect && opt !== CUSTOM_OTHER_OPTION && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMultiVariantSpecValue(label, opt);
                            }}
                            className={`shrink-0 px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isTagSelected
                                ? "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900"
                            }`}
                            title={isTagSelected ? `Remove ${opt} from chosen pieces` : `Add ${opt} as variant piece (+)`}
                          >
                            {isTagSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Chosen</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        )}

                        {opt === CUSTOM_OTHER_OPTION && (
                          <span className="shrink-0 text-[10px] font-mono font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            manual
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Custom / Other Manual Input Field */}
          {isCustomUnlocked && (
            <div className="relative flex items-center mt-1 animate-fade-in">
              <input
                type="text"
                value={value === CUSTOM_OTHER_OPTION ? "" : value}
                onChange={(e) => handleSpecChange(label, e.target.value)}
                placeholder={`Enter custom ${label.toLowerCase()} manually...`}
                className={`w-full text-xs font-bold text-slate-900 bg-white border rounded-[8px] p-2.5 pr-20 transition-all outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-normal ${
                  isMissing
                    ? "border-rose-500 ring-2 ring-rose-500/15"
                    : "border-indigo-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                }`}
              />
              {value && value.trim() && value !== CUSTOM_OTHER_OPTION && (
                <button
                  type="button"
                  onClick={() => toggleMultiVariantSpecValue(label, value.trim())}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 text-[10.5px] font-extrabold bg-slate-900 text-white rounded-[7px] hover:bg-slate-800 cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Add custom value as a chosen variant piece"
                >
                  <Plus className="w-3 h-3 stroke-[3]" /> Piece
                </button>
              )}
            </div>
          )}

          {/* Note: display only the pieces chosen */}
          {canMultiSelect && selectedVariantTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 animate-fade-in">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                Chosen pieces ({selectedVariantTags.length}):
              </span>
              {selectedVariantTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-3xs transition-all hover:border-emerald-400"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => toggleMultiVariantSpecValue(label, tag)}
                    className="text-emerald-600 hover:text-rose-600 dark:text-emerald-400 dark:hover:text-rose-400 transition-colors cursor-pointer p-0.5 rounded"
                    title={`Remove ${tag}`}
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {isMissing && (
            <p className="text-[10px] font-bold text-rose-500 font-mono mt-0.5">{label} is required (*)</p>
          )}
        </div>
      );
    }

    if (field.type === "boolean") {
      const isChecked = value === "true";
      return (
        <div 
          key={label} 
          className="flex items-center justify-between p-3 border rounded-[8px] transition-all bg-[#f8fafc] border-[#cbd5e1] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] hover:border-slate-400"
        >
          <label className="text-xs font-black font-mono flex items-center text-slate-900 dark:text-slate-100" style={{ fontSize: "11px", color: "#1e1e1e" }}>
            <span>{label}</span>
            {field.required && <span className="text-rose-500 font-bold ml-1 text-sm leading-none" title="Required">*</span>}
            <SpecHintButton
              fieldName={label}
              currentSlideColor={currentSlideColor}
              activeHintField={activeHintField}
              setActiveHintField={setActiveHintField}
              showHints={showPrimarySpecsHints}
            />
          </label>
          <SkeuomorphicSwitch
            checked={isChecked}
            onChange={(val) => handleSpecChange(label, val ? "true" : "false")}
          />
        </div>
      );
    }

    return (
      <div key={label} className="flex flex-col gap-1.5">
        <label className="text-xs font-black flex items-center font-mono text-slate-900 dark:text-slate-100" style={{ fontSize: "11px", color: "#1e1e1e" }}>
          <span>{label}</span>
          {field.required && <span className="text-rose-500 font-bold ml-1 text-sm leading-none" title="Required">*</span>}
          <SpecHintButton
            fieldName={label}
            currentSlideColor={currentSlideColor}
            activeHintField={activeHintField}
            setActiveHintField={setActiveHintField}
            showHints={showPrimarySpecsHints}
          />
        </label>
        <div className="relative flex items-center">
          <input
            type={field.type === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => handleSpecChange(label, e.target.value)}
            placeholder={field.placeholder || `Enter ${label.toLowerCase()}`}
            className={`w-full text-xs font-bold text-slate-900 bg-[#f8fafc] hover:bg-slate-100/70 focus:bg-white border rounded-[8px] p-3 transition-all outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-slate-400 placeholder:font-normal ${
              isMissing
                ? "border-rose-500 ring-2 ring-rose-500/15 bg-white"
                : "border-[#cbd5e1] hover:border-slate-400 focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10"
            }`}
          />
          {field.unit && (
            <span className="absolute right-3 text-xs font-mono font-bold text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200 pointer-events-none shadow-3xs">
              {field.unit}
            </span>
          )}
        </div>
        {isMissing && (
          <p className="text-[10px] font-bold text-rose-500 font-mono mt-0.5">{label} is required (*)</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Step Header */}
      <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-1.5 h-5 rounded-full shrink-0"
            style={{
              backgroundColor: "var(--yume-theme-header-color, " + (currentSlideColor || "#0b2447") + ")"
            }}
          />
          <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight font-sans">
            Step 3: Category &amp; specs
          </h3>
        </div>
        <button
          type="button"
          onClick={() => handleHintsToggle(!showPrimarySpecsHints)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 dark:border-slate-700 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs select-none"
          title="Toggle help hints visibility"
        >
          <HelpCircle className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
          <span>Hints: {showPrimarySpecsHints ? "On" : "Off"}</span>
          <span className={`w-2 h-2 rounded-full ${showPrimarySpecsHints ? "bg-stone-600 dark:bg-slate-300" : "bg-stone-300 dark:bg-slate-600"}`} />
        </button>
      </div>

      {/* Step 3 Advice Callout */}
      <div
        className="flex items-start gap-2.5 p-3.5 rounded-xl border transition-all"
        style={{
          backgroundColor: `color-mix(in srgb, var(--yume-theme-header-color, ${currentSlideColor || "#0b2447"}) 6%, transparent)`,
          borderColor: `color-mix(in srgb, var(--yume-theme-header-color, ${currentSlideColor || "#0b2447"}) 18%, transparent)`
        }}
      >
        <Info
          className="w-4 h-4 shrink-0 mt-0.5"
          style={{ color: "var(--yume-theme-header-color, " + (currentSlideColor || "#0b2447") + ")" }}
        />
        <p
          className="text-xs leading-relaxed font-semibold flex-1"
          style={{ color: "var(--yume-theme-header-color, " + (currentSlideColor || "#0b2447") + ")" }}
        >
          <strong
            className="font-black uppercase mr-1.5"
            style={{ color: "var(--yume-theme-header-color, " + (currentSlideColor || "#0b2447") + ")" }}
          >
            Advice:
          </strong>
          {activeStep3Advice}
        </p>
        <button
          type="button"
          onClick={() => setActiveStep3Advice(getRandomStepAdvice(3))}
          className="text-stone-400 hover:text-stone-700 dark:hover:text-white p-1 rounded-md transition-all cursor-pointer shrink-0"
          title="Show another advice"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* 1. MAIN CATEGORY SELECTION */}
      <div 
        ref={mainCategoryDropdownRef}
        className="space-y-2 relative" 
        style={{ zIndex: openDropdown === "mainCategory" ? 100 : undefined }}
      >
        <div className="flex items-center gap-1.5 mb-1 group/spec">
          <label className="text-xs font-black block font-mono text-slate-900 dark:text-slate-100" style={{ fontSize: "11.5px" }}>
            <span>Main category</span>
            <span className="text-rose-500 font-bold ml-1 text-sm leading-none" title="Required">*</span>
          </label>
          <HintTooltip
            text="Select the primary marketplace department that best categorizes your product."
            currentSlideColor={currentSlideColor}
            showHints={showPrimarySpecsHints}
            title="Main Category"
          />
        </div>

          <div className="relative" style={{ zIndex: openDropdown === "mainCategory" ? 100 : undefined }}>
            <button
              type="button"
              data-opaque="true"
              onClick={() => setOpenDropdown(openDropdown === "mainCategory" ? null : "mainCategory")}
              className={`dropdown-menu-opaque opaque-solid-dropdown w-full text-xs font-sans p-3 rounded-[8px] border transition-all font-bold flex items-center justify-between cursor-pointer shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] ${
                openDropdown === "mainCategory"
                  ? "bg-white border-slate-800 ring-2 ring-slate-900/10 shadow-md text-slate-950"
                  : showErrors && !selectedMainCategoryId
                  ? "bg-white border-rose-500 ring-2 ring-rose-500/20 text-slate-950"
                  : selectedMainCategoryId
                  ? "bg-[#f8fafc] border-slate-300 hover:border-slate-500 hover:bg-slate-100/80 text-slate-950"
                  : "bg-[#f8fafc] border-slate-300 hover:border-slate-500 hover:bg-slate-100/80 text-slate-600"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div 
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 border border-slate-200/90 shadow-3xs"
                  style={{
                    backgroundColor: selectedMainCategoryId ? `color-mix(in srgb, ${currentSlideColor} 12%, #ffffff)` : "#ffffff",
                    color: selectedMainCategoryId ? currentSlideColor : "#64748b"
                  }}
                >
                  <FolderTree className="w-3.5 h-3.5" />
                </div>
                <span className={selectedMainCategoryId ? "text-slate-950 font-bold truncate text-[12.5px]" : "text-slate-600 font-medium truncate text-[12.5px]"}>
                  {selectedMainCategoryId ? (
                    effectiveMainCategories.find(m => m.id === selectedMainCategoryId)?.names[currentLanguage] ||
                    effectiveMainCategories.find(m => m.id === selectedMainCategoryId)?.names.en ||
                    selectedMainCategoryId
                  ) : (
                    "Select main category"
                  )}
                </span>
              </div>
              <div className="w-6 h-6 rounded-md bg-white border border-slate-200/90 flex items-center justify-center text-slate-600 shrink-0 shadow-3xs">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === "mainCategory" ? "rotate-180 text-slate-900" : ""}`} />
              </div>
            </button>

            {openDropdown === "mainCategory" && (
              <div 
                data-opaque="true"
                role="listbox"
                className="dropdown-menu-opaque opaque-solid-dropdown absolute left-0 top-full mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-[9999] p-1.5 space-y-0.5 divide-y divide-slate-100 dark:divide-slate-800 ring-1 ring-black/10"
                style={{ backgroundColor: "#ffffff", opacity: 1, backdropFilter: "none", WebkitBackdropFilter: "none" }}
              >
                {effectiveMainCategories.map((mainCat) => {
                  const isSelected = mainCat.id === selectedMainCategoryId;
                  return (
                    <button
                      key={mainCat.id}
                      type="button"
                      onClick={() => handleMainCategorySelect(mainCat.id)}
                      className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-between rounded-lg ${
                        isSelected 
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white shadow-3xs font-extrabold" 
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-black dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: isSelected ? currentSlideColor : "#cbd5e1" }} 
                        />
                        <span>{mainCat.names[currentLanguage] || mainCat.names.en}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Informative message if Main Category is not selected */}
        {!selectedMainCategoryId && (
          <div 
            className="p-4 border rounded-xl text-center space-y-1 bg-[#f8fafc] border-slate-300 shadow-3xs"
          >
            <p className="text-xs font-black text-slate-700 font-mono">
              Please select a main category above.
            </p>
            <p className="text-[11px] text-slate-500 font-sans">
              Choosing a main category reveals subcategories and specifications tailored to your product.
            </p>
          </div>
        )}

        {/* 2. SUBCATEGORY SELECTION (Revealed when Main Category is selected) */}
        {selectedMainCategoryId && (
          <div 
            ref={subcategoryDropdownRef}
            className="space-y-2 animate-fade-in relative" 
            style={{ zIndex: openDropdown === "subcategory" ? 90 : undefined }}
          >
            <div className="flex items-center gap-1.5 mb-1 group/spec">
              <label className="text-xs font-black block font-mono text-slate-900 dark:text-slate-100" style={{ fontSize: "11.5px" }}>
                <span>Subcategory</span>
                <span className="text-rose-500 font-bold ml-1 text-sm leading-none" title="Required">*</span>
              </label>
              <HintTooltip
                text="Select the specific subcategory belonging to your chosen main category."
                currentSlideColor={currentSlideColor}
                showHints={showPrimarySpecsHints}
                title="Subcategory"
              />
            </div>

            <div className="relative" style={{ zIndex: openDropdown === "subcategory" ? 90 : undefined }}>
              <button
                type="button"
                data-opaque="true"
                onClick={() => setOpenDropdown(openDropdown === "subcategory" ? null : "subcategory")}
                className={`dropdown-menu-opaque opaque-solid-dropdown w-full text-xs font-sans p-3 rounded-[8px] border transition-all font-bold flex items-center justify-between cursor-pointer shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] ${
                  openDropdown === "subcategory"
                    ? "bg-white border-slate-800 ring-2 ring-slate-900/10 shadow-md text-slate-950"
                    : showErrors && !blankProductCategory
                    ? "bg-white border-rose-500 ring-2 ring-rose-500/20 text-slate-950"
                    : blankProductCategory
                    ? "bg-[#f8fafc] border-slate-300 hover:border-slate-500 hover:bg-slate-100/80 text-slate-950"
                    : "bg-[#f8fafc] border-slate-300 hover:border-slate-500 hover:bg-slate-100/80 text-slate-600"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 border border-slate-200/90 shadow-3xs"
                    style={{
                      backgroundColor: blankProductCategory ? `color-mix(in srgb, ${currentSlideColor} 12%, #ffffff)` : "#ffffff",
                      color: blankProductCategory ? currentSlideColor : "#64748b"
                    }}
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <span className={blankProductCategory ? "text-slate-950 font-bold truncate text-[12.5px]" : "text-slate-600 font-medium truncate text-[12.5px]"}>
                    {blankProductCategory ? (
                      effectiveSubcategories.find(s => s.id === blankProductCategory)?.names[currentLanguage] ||
                      effectiveSubcategories.find(s => s.id === blankProductCategory)?.names.en ||
                      blankProductCategory
                    ) : (
                      "Select subcategory"
                    )}
                  </span>
                </div>
                <div className="w-6 h-6 rounded-md bg-white border border-slate-200/90 flex items-center justify-center text-slate-600 shrink-0 shadow-3xs">
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === "subcategory" ? "rotate-180 text-slate-900" : ""}`} />
                </div>
              </button>

              {openDropdown === "subcategory" && (
                <div 
                  data-opaque="true"
                  role="listbox"
                  className="dropdown-menu-opaque opaque-solid-dropdown absolute left-0 top-full mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-[9999] p-1.5 space-y-0.5 divide-y divide-slate-100 dark:divide-slate-800 ring-1 ring-black/10"
                  style={{ backgroundColor: "#ffffff", opacity: 1, backdropFilter: "none", WebkitBackdropFilter: "none" }}
                >
                  {effectiveSubcategories
                    .filter(s => s.mainCategoryId === selectedMainCategoryId)
                    .map((subCat) => {
                      const isSelected = subCat.id === blankProductCategory;
                      return (
                        <button
                          key={subCat.id}
                          type="button"
                          onClick={() => handleSubcategorySelect(subCat.id)}
                          className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-between rounded-lg ${
                            isSelected 
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white shadow-3xs font-extrabold" 
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-black dark:hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: isSelected ? currentSlideColor : "#cbd5e1" }} 
                            />
                            <span>{subCat.names[currentLanguage] || subCat.names.en}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white stroke-[2.5]" />}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informative message if Subcategory is not selected */}
        {selectedMainCategoryId && !blankProductCategory && (
          <div 
            className="p-4 border rounded-xl text-center space-y-1 bg-[#f8fafc] border-slate-200/90 shadow-3xs"
          >
            <p className="text-xs font-black text-slate-700 font-mono">
              Please select a subcategory.
            </p>
            <p className="text-[11px] text-slate-500 font-sans">
              Selecting a subcategory unlocks specific attributes and variant choices for your item.
            </p>
          </div>
        )}

        {/* STOCK QUANTITY (Moved from Step 4 into Step 3 – Categories and Specs) */}
        <div className="space-y-1.5 font-sans group/spec pt-2">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <label className="text-xs font-black block font-mono text-slate-900 dark:text-slate-100" style={{ fontSize: "11.5px" }}>
              <span>Stock Quantity</span>
              <span className="text-rose-500 font-bold ml-1 text-sm leading-none" title="Required">*</span>
            </label>
            {isManagedByVariants && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Synced with Variant Stock ({totalManagedVariantStock} pcs)
              </span>
            )}
            <HintTooltip
              title="Stock Quantity"
              text={
                isManagedByVariants
                  ? "Automatically calculated by summing the stock quantity of all active Color × Size variant combinations below."
                  : "Total available physical units in your workshop or store inventory ready for packaging and dispatch."
              }
              currentSlideColor={currentSlideColor}
              showHints={showPrimarySpecsHints}
            />
          </div>
          <div className="relative font-sans">
            <input
              type="number"
              min="0"
              readOnly={isManagedByVariants}
              placeholder="10"
              value={isManagedByVariants ? totalManagedVariantStock : wizardStock}
              onChange={(e) => {
                if (isManagedByVariants) return;
                const val = e.target.value;
                setWizardStock(val === "" ? "" : Math.max(0, Number(val)));
              }}
              className={`w-full text-xs font-bold text-slate-900 dark:text-slate-100 border rounded-[8px] p-3 pr-10 transition-all outline-none font-mono ${
                isManagedByVariants
                  ? "bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 cursor-not-allowed border-slate-300 dark:border-slate-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                  : showErrors && (wizardStock === undefined || wizardStock === "" || isNaN(Number(wizardStock)) || Number(wizardStock) < 0 || !Number.isInteger(Number(wizardStock)))
                  ? "bg-[#f8fafc] dark:bg-slate-900 border-rose-500 ring-2 ring-rose-500/20"
                  : "bg-[#f8fafc] dark:bg-slate-900 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 border-[#cbd5e1] dark:border-slate-700 hover:border-slate-400 focus:border-slate-800 dark:focus:border-blue-500 focus:ring-2 focus:ring-slate-900/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
              }`}
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none transition-all">
              {(isManagedByVariants || (wizardStock !== undefined && wizardStock !== "" && !isNaN(Number(wizardStock)) && Number(wizardStock) >= 0 && Number.isInteger(Number(wizardStock)))) ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <X className="w-3.5 h-3.5 text-rose-500" />
              )}
            </div>
          </div>
          {isManagedByVariants ? (
            <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400 block transition-colors">
              Total stock is automatically calculated from active variant combinations: {totalManagedVariantStock} pcs
            </span>
          ) : (wizardStock === undefined || wizardStock === "" || isNaN(Number(wizardStock)) || Number(wizardStock) < 0 || !Number.isInteger(Number(wizardStock))) ? (
            <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 block transition-colors">Stock quantity is required and must be a whole number (*)</span>
          ) : (
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 block transition-colors">Stock quantity is valid</span>
          )}
        </div>

        {/* 3. DYNAMIC SPECIFICATIONS & VARIANTS (Revealed when Subcategory is selected) */}
        {selectedMainCategoryId && blankProductCategory && (
          <div className="space-y-6 animate-fade-in">

            {/* Dynamic Specification Form */}
            {(() => {
              const excludedKeys = ["color", "dimensions", "width", "height", "depth"];
              const requiredFields = (activeTemplate.fields || []).filter(
                f => !excludedKeys.includes(f.name.toLowerCase()) && f.required === true
              );
              const optionalFields = (activeTemplate.fields || []).filter(
                f => !excludedKeys.includes(f.name.toLowerCase()) && f.required !== true
              );

              return (
                <div className="space-y-5 pt-4 border-t border-stone-200/80 dark:border-slate-800">
                  
                  {/* Unified Primary specifications & Custom Attributes Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-black block font-mono text-slate-900 dark:text-slate-100" style={{ fontSize: "11.5px" }}>
                          <span>Primary specifications</span>
                        </label>
                        <HintTooltip
                          text="Configure fundamental physical specs such as measurement units, sizing dimensions, and custom artisan attributes."
                          currentSlideColor={currentSlideColor}
                          showHints={showPrimarySpecsHints}
                          title="Primary Specifications"
                        />
                      </div>
                    </div>
                    
                    {/* Primary Specification Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Measurement Unit dropdown */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black flex items-center font-mono text-slate-900 dark:text-slate-100" style={{ fontSize: "11px" }}>
                          <span>Measurement unit</span>
                          <SpecHintButton
                            fieldName="Measurement Unit"
                            currentSlideColor={currentSlideColor}
                            activeHintField={activeHintField}
                            setActiveHintField={setActiveHintField}
                            showHints={showPrimarySpecsHints}
                          />
                        </label>
                        <div className="relative">
                          <select
                            value={getSpecValue("Measurement unit")}
                            onChange={(e) => handleSpecChange("Measurement unit", e.target.value)}
                            className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 hover:bg-slate-100/70 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 hover:border-slate-400 focus:border-slate-800 rounded-[8px] p-3 pr-8 transition-all outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer appearance-none"
                          >
                            <option value="">Select unit</option>
                            {MEASUREMENT_UNITS.map(u => (
                              <option key={u.value} value={u.value}>{u.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Required Template Fields */}
                      {requiredFields.map(field => renderField(field))}

                      {/* Applicable Category Fields */}
                      {optionalFields.map(field => renderField(field))}
                    </div>

                    {/* Custom Attributes */}
                    <div className="pt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black flex items-center font-mono text-slate-900 dark:text-slate-100" style={{ fontSize: "11px" }}>
                          <span>Custom attributes</span>
                          <SpecHintButton
                            fieldName="Custom Attributes"
                            currentSlideColor={currentSlideColor}
                            activeHintField={activeHintField}
                            setActiveHintField={setActiveHintField}
                            showHints={showPrimarySpecsHints}
                          />
                        </label>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        {(() => {
                          const templateKeys = activeTemplate.fields.map(f => f.name.toLowerCase());
                          const excludedCustomKeys = ["material", "color", "dimensions", "measurement unit"];
                          const customSpecs = wizardProductSpecs.filter(
                            s => !templateKeys.includes(s.key.toLowerCase()) && 
                                 !excludedCustomKeys.includes(s.key.toLowerCase())
                          );

                          if (customSpecs.length === 0) {
                            return <p className="text-[11px] text-slate-400 dark:text-slate-500 italic font-medium">No custom attributes added yet.</p>;
                          }

                          return wizardProductSpecs.map((spec, idx) => {
                            const isPredefined = templateKeys.includes(spec.key.toLowerCase()) || excludedCustomKeys.includes(spec.key.toLowerCase());
                            if (isPredefined) return null;

                            return (
                              <div key={idx} className="grid grid-cols-12 gap-2.5 items-center">
                                <div className="col-span-5">
                                  <input
                                    type="text"
                                    value={spec.key}
                                    onChange={(e) => {
                                      const newSpecs = [...wizardProductSpecs];
                                      newSpecs[idx].key = e.target.value;
                                      setWizardProductSpecs(newSpecs);
                                    }}
                                    placeholder="Attribute name"
                                    className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 hover:bg-slate-100/70 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 hover:border-slate-400 focus:border-slate-800 rounded-[8px] p-3 transition-all outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-slate-400 placeholder:font-normal"
                                  />
                                </div>
                                <div className="col-span-5">
                                  <input
                                    type="text"
                                    value={spec.value}
                                    onChange={(e) => {
                                      const newSpecs = [...wizardProductSpecs];
                                      newSpecs[idx].value = e.target.value;
                                      setWizardProductSpecs(newSpecs);
                                    }}
                                    placeholder="Attribute value"
                                    className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 hover:bg-slate-100/70 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 hover:border-slate-400 focus:border-slate-800 rounded-[8px] p-3 transition-all outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-slate-400 placeholder:font-normal"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setWizardProductSpecs(wizardProductSpecs.filter((_, i) => i !== idx))}
                                  className="col-span-2 p-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-all flex items-center justify-center cursor-pointer font-bold border border-rose-200 dark:border-rose-800 rounded-[8px] h-[42px] active:scale-95 shadow-3xs"
                                  title="Delete attribute"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      <button
                        type="button"
                        onClick={() => setWizardProductSpecs([...wizardProductSpecs, { key: "", value: "" }])}
                        className="text-xs font-bold flex items-center justify-center gap-1.5 p-3 px-4 border border-dashed cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900"
                        style={{ 
                          color: currentSlideColor, 
                          borderColor: `color-mix(in srgb, ${currentSlideColor} 50%, #cbd5e1)`,
                          borderRadius: "7px"
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add custom attribute
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 4. PRODUCT VARIANTS (REDESIGNED: STACKED COLOR + SMART CATEGORY SIZES + MANAGE STOCK BY VARIANTS) */}
            <div className="space-y-5 pt-5 border-t border-stone-200/80 dark:border-slate-800">
              {/* Main Section Header & ON/OFF Toggle */}
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                <div className="flex flex-col text-left gap-0.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-black block font-mono text-slate-900 dark:text-slate-100" style={{ fontSize: "12px" }}>
                      <span>Product Variants</span>
                    </label>
                    <HintTooltip
                      text="Enable Product Variants to configure Colors, Category-Specific Sizes/Options, and Manage Stock by Variants."
                      currentSlideColor={currentSlideColor}
                      showHints={showPrimarySpecsHints}
                      title="Product Variants"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Configure color swatches, smart category sizing, and variant-level inventory
                  </span>
                </div>
                <SkeuomorphicSwitch
                  checked={wizardVariantsEnabled}
                  onChange={setWizardVariantsEnabled}
                />
              </div>

              {wizardVariantsEnabled ? (
                <div className="space-y-5 animate-fade-in">

                  {/* ================================================================= */}
                  {/* CARD 1: COLOR VARIANTS & IMAGE LINKING                            */}
                  {/* ================================================================= */}
                  <div className="p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900/90 flex flex-col gap-4 shadow-2xs">
                    {/* Card 1 Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center shrink-0">
                          <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs font-mono text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>1. Color Swatches &amp; Image Linking</span>
                            <HintTooltip
                              text="Choose how color variants appear on your storefront, add colors using the custom picker or screen eyedropper, and link uploaded product photos to each color."
                              currentSlideColor={currentSlideColor}
                              showHints={showPrimarySpecsHints}
                              title="Color Variants"
                            />
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                            Add product colors and link a primary image to each swatch
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold font-mono bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {colorSwatches.length} {colorSwatches.length === 1 ? "color" : "colors"} added
                      </span>
                    </div>

                    {/* Color Variant Display Model Selector + Live Storefront Preview */}
                    <div className="bg-white dark:bg-slate-950/70 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3.5">
                      <div className="flex flex-wrap items-center justify-start gap-3">

                        <div className="inline-flex flex-wrap p-1 bg-slate-100/90 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 gap-1.5">
                          {/* Style 1: Variant Circle */}
                          <button
                            type="button"
                            onClick={() => setActiveColorDisplayStyle("circles")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                              activeColorDisplayStyle === "circles"
                                ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs border border-blue-200 dark:border-blue-700 font-extrabold"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                            title="Variant Circle"
                          >
                            <span className="relative w-4 h-4 rounded-full border-2 border-blue-600 bg-white dark:bg-slate-900 ring-1 ring-blue-500/30 inline-flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-blue-600 stroke-[3]" />
                            </span>
                            <span>Variant Circle</span>
                          </button>

                          {/* Style 2: Photo Cards */}
                          <button
                            type="button"
                            onClick={() => setActiveColorDisplayStyle("photo_cards")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                              activeColorDisplayStyle === "photo_cards" || activeColorDisplayStyle === "image_cards" || activeColorDisplayStyle === "cards"
                                ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs border border-blue-200 dark:border-blue-700 font-extrabold"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                            title="Photo Cards"
                          >
                            <span className="w-3.5 h-4.5 rounded-sm border-2 border-slate-900 dark:border-slate-300 bg-stone-100 inline-flex flex-col items-center justify-between shrink-0 overflow-hidden">
                              <span className="w-full h-2.5 bg-stone-300" />
                              <span className="w-full h-1.5 bg-slate-900" />
                            </span>
                            <span>Photo Cards</span>
                          </button>

                          {/* Style 3: Circle Shapes */}
                          <button
                            type="button"
                            onClick={() => setActiveColorDisplayStyle("solid_circles")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                              activeColorDisplayStyle === "solid_circles"
                                ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs border border-blue-200 dark:border-blue-700 font-extrabold"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                            title="Circle Shapes"
                          >
                            <span className="w-4 h-4 rounded-full border-2 border-blue-600 bg-gradient-to-tr from-slate-900 via-amber-500 to-rose-500 inline-flex items-center justify-center shrink-0 shadow-2xs p-[1px]">
                              <span className="w-full h-full rounded-full bg-inherit" />
                            </span>
                            <span>Circle Shapes</span>
                          </button>
                        </div>
                      </div>

                      {/* Live Sell Page Variant Display Preview */}
                      <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-3 rounded-xl">
                        <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                          <span className="text-[10.5px] font-black text-slate-600 dark:text-slate-300 font-mono flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                            <span>
                              Live Storefront Preview (
                              {activeColorDisplayStyle === "circles"
                                ? "Variant Circle"
                                : activeColorDisplayStyle === "solid_circles"
                                ? "Circle Shapes"
                                : "Photo Cards"}
                              ):
                            </span>
                          </span>
                          <span className="text-[10.5px] text-slate-600 dark:text-slate-300 font-bold font-mono">
                            Selected Color:{" "}
                            <strong className="text-slate-950 dark:text-white font-black">
                              {currentSelectedSwatch?.name || "None selected"}
                            </strong>
                          </span>
                        </div>

                        {displaySwatches.length === 0 ? (
                          <div className="py-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            Add a color below to preview how your swatches will look on the product page.
                          </div>
                        ) : activeColorDisplayStyle === "circles" ? (
                          /* Style 1: Variant Circle */
                          <div className="flex items-center gap-2.5 pt-1 overflow-x-auto pb-1.5 scrollbar-thin">
                            {displaySwatches.map((sw, idx) => {
                              const isPreviewSelected = idx === effectiveSelectedSwatchIdx;
                              const swatchImg = sw.imageUrl || sw.images?.[0] || null;
                              const isOutOfStock = Boolean(
                                colorStockTrackingEnabled &&
                                  (sw as any).stock !== undefined &&
                                  (sw as any).stock !== "" &&
                                  Number((sw as any).stock) <= 0
                              );
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  disabled={isOutOfStock}
                                  onClick={() => {
                                    if (!isOutOfStock) setPreviewSelectedSwatchIdx(idx);
                                  }}
                                  className={`group relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all p-[2px] shrink-0 ${
                                    isOutOfStock
                                      ? "opacity-55 cursor-not-allowed border border-dashed border-rose-300 dark:border-rose-700"
                                      : isPreviewSelected
                                      ? "border-2 border-blue-600 scale-105 shadow-md cursor-pointer"
                                      : "border border-slate-300 dark:border-slate-700 hover:border-slate-400 hover:scale-105 cursor-pointer"
                                  }`}
                                  title={`${sw.name} ${isOutOfStock ? "(Out of Stock)" : "(Variant Circle)"}`}
                                >
                                  <span
                                    className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative shadow-inner"
                                    style={{ backgroundColor: sw.hex || "#cbd5e1" }}
                                  >
                                    {swatchImg ? (
                                      <img
                                        src={swatchImg}
                                        alt={sw.name}
                                        className="w-full h-full object-cover rounded-full pointer-events-none"
                                        onError={(e) => {
                                          e.currentTarget.style.display = "none";
                                        }}
                                      />
                                    ) : null}
                                    {isPreviewSelected && !isOutOfStock && (
                                      <span className={`absolute inset-0 flex items-center justify-center ${swatchImg ? "bg-black/25 backdrop-blur-[0.5px]" : ""}`}>
                                        <Check className="w-4 h-4 stroke-[3] text-white drop-shadow-sm" />
                                      </span>
                                    )}
                                    {isOutOfStock && (
                                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                        <span className="w-full h-[2px] bg-rose-500 rotate-45 rounded-full shadow-xs" />
                                      </span>
                                    )}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : activeColorDisplayStyle === "solid_circles" ? (
                          /* Style 3: Circle Shapes */
                          <div className="flex items-center gap-2.5 pt-1 overflow-x-auto pb-1.5 scrollbar-thin">
                            {displaySwatches.map((sw, idx) => {
                              const isPreviewSelected = idx === effectiveSelectedSwatchIdx;
                              const isOutOfStock = Boolean(
                                colorStockTrackingEnabled &&
                                  (sw as any).stock !== undefined &&
                                  (sw as any).stock !== "" &&
                                  Number((sw as any).stock) <= 0
                              );
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  disabled={isOutOfStock}
                                  onClick={() => {
                                    if (!isOutOfStock) setPreviewSelectedSwatchIdx(idx);
                                  }}
                                  className={`group relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all p-[2px] shrink-0 ${
                                    isOutOfStock
                                      ? "opacity-55 cursor-not-allowed border border-dashed border-rose-300 dark:border-rose-700"
                                      : isPreviewSelected
                                      ? "border-2 border-blue-600 scale-105 shadow-md cursor-pointer"
                                      : "border border-slate-300 dark:border-slate-700 hover:border-slate-400 hover:scale-105 cursor-pointer"
                                  }`}
                                  title={`${sw.name} ${isOutOfStock ? "(Out of Stock)" : "(Circle Shapes)"}`}
                                >
                                  <span
                                    className="w-full h-full rounded-full overflow-hidden shadow-inner flex items-center justify-center relative transition-transform"
                                    style={{ backgroundColor: sw.hex }}
                                  >
                                    {isPreviewSelected && !isOutOfStock && (
                                      <Check className={`w-3.5 h-3.5 stroke-[3] ${isColorDark(sw.hex) ? "text-white" : "text-slate-950"} drop-shadow-sm`} />
                                    )}
                                    {isOutOfStock && (
                                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                        <span className="w-full h-[2px] bg-rose-500 rotate-45 rounded-full shadow-xs" />
                                      </span>
                                    )}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          /* Style 2: Photo Cards */
                          <div className="flex items-stretch gap-2 pt-1 overflow-x-auto pb-1.5 scrollbar-thin">
                            {displaySwatches.map((sw, idx) => {
                              const isPreviewSelected = idx === effectiveSelectedSwatchIdx;
                              const swatchImg = sw.imageUrl || sw.images?.[0] || null;
                              const isValidImg =
                                swatchImg &&
                                typeof swatchImg === "string" &&
                                (swatchImg.startsWith("http") ||
                                  swatchImg.startsWith("data:") ||
                                  swatchImg.startsWith("/") ||
                                  swatchImg.startsWith("blob:"));
                              const hasHot = sw.isHot || idx < 2;
                              const isOutOfStock = Boolean(
                                colorStockTrackingEnabled &&
                                  (sw as any).stock !== undefined &&
                                  (sw as any).stock !== "" &&
                                  Number((sw as any).stock) <= 0
                              );
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  disabled={isOutOfStock}
                                  onClick={() => {
                                    if (!isOutOfStock) setPreviewSelectedSwatchIdx(idx);
                                  }}
                                  className={`rounded-lg overflow-hidden bg-white dark:bg-slate-900 text-left transition-all flex flex-col justify-between shrink-0 ${
                                    isOutOfStock
                                      ? "opacity-55 cursor-not-allowed border border-rose-200 dark:border-rose-800"
                                      : isPreviewSelected
                                      ? "border-2 border-blue-600 shadow-sm ring-1 ring-blue-600/20 cursor-pointer"
                                      : "border border-stone-300 dark:border-slate-700 hover:border-slate-400 cursor-pointer"
                                  }`}
                                  style={{ width: "68px", minWidth: "64px" }}
                                  title={`${sw.name} ${isOutOfStock ? "(Out of Stock)" : "card"}`}
                                >
                                  <div className="w-full h-16 bg-stone-50 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                                    {isValidImg ? (
                                      <img
                                        src={swatchImg}
                                        alt={sw.name}
                                        className="w-full h-full object-cover pointer-events-none"
                                        onError={(e) => {
                                          e.currentTarget.style.display = "none";
                                          const fallback = e.currentTarget.parentElement?.querySelector(".swatch-wizard-fallback") as HTMLElement;
                                          if (fallback) fallback.style.display = "flex";
                                        }}
                                      />
                                    ) : null}
                                    <div
                                      className={`swatch-wizard-fallback w-full h-full relative ${isValidImg ? "hidden" : "flex"}`}
                                      style={{ backgroundColor: sw.hex }}
                                    />
                                    {isOutOfStock && (
                                      <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center backdrop-blur-[0.5px] z-10">
                                        <span className="text-[8px] font-black text-rose-700 uppercase bg-rose-50 px-1 py-0.5 rounded border border-rose-300 leading-none shadow-2xs">
                                          Out of stock
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="px-1 py-1.5 bg-white dark:bg-slate-900 border-t border-stone-200/90 dark:border-slate-800 text-center flex flex-col items-center justify-center min-h-[26px]">
                                    <div className="flex items-center justify-center gap-1 w-full px-0.5">
                                      {hasHot && (
                                        <span className="text-amber-500 text-[10px] shrink-0 select-none leading-none">
                                          🔥
                                        </span>
                                      )}
                                      <span
                                        className={`text-[11px] truncate leading-tight ${
                                          isOutOfStock
                                            ? "font-medium text-slate-400 line-through"
                                            : isPreviewSelected
                                            ? "font-bold text-slate-950 dark:text-white"
                                            : "font-semibold text-slate-800 dark:text-slate-200"
                                        }`}
                                      >
                                        {sw.name}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Custom Color Input + Direct Screen Eyedropper */}
                    <div className="bg-white dark:bg-slate-950/70 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800">

                      {/* Custom Color Input + Direct Eyedropper + HEX Box + Add Swatch */}
                      <div className="flex flex-col sm:flex-row gap-2.5 items-center relative z-0">
                        <div className="relative flex-1 w-full">
                          <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            placeholder={`Custom color name (e.g., ${detectedColorInfo?.name || "Midnight Navy"})`}
                            value={customSwatchName}
                            onChange={(e) => {
                              setCustomSwatchName(e.target.value);
                              setIsCustomNameAutoFilled(false);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddColorSwatch(customSwatchName, customSwatchHex);
                              }
                            }}
                            className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#F8FAFC] dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 rounded-[8px] pl-9 pr-3 py-2.5 transition-all outline-none placeholder:text-slate-400 placeholder:font-normal h-[38px]"
                          />
                        </div>

                        {/* Direct Screen Eyedropper Button (1-click EyeDropper API with fallback) */}
                        <div className="relative group shrink-0">
                          <button
                            type="button"
                            onClick={handleEyedropperClick}
                            title="Sample color from anywhere on your screen (Eyedropper)"
                            aria-label="Sample color from screen"
                            className="h-[38px] px-3 flex items-center justify-center gap-1.5 bg-[#F8FAFC] dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-[#CBD5E1] dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-[8px] transition-all cursor-pointer shadow-3xs active:scale-95 text-[11px] font-bold font-mono"
                          >
                            <Pipette className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span className="hidden md:inline">Pick from Screen</span>
                          </button>
                        </div>

                        {/* Color Preview Swatch + HEX Input */}
                        <div className="flex items-center gap-2 border p-1 px-2.5 bg-[#F8FAFC] dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 border-[#CBD5E1] dark:border-slate-700 rounded-[8px] shrink-0 shadow-3xs transition-all h-[38px]">
                          <div
                            className="relative w-6 h-6 rounded-md overflow-hidden shadow-2xs border border-black/15 dark:border-white/20 shrink-0 cursor-pointer"
                            style={{ backgroundColor: customSwatchHex }}
                            onClick={triggerColorPicker}
                            title="Click to open color spectrum picker"
                          >
                            <input
                              ref={colorInputRef}
                              type="color"
                              value={customSwatchHex.length === 7 ? customSwatchHex : "#3B82F6"}
                              onChange={(e) => handleCustomHexChange(e.target.value)}
                              className="absolute -inset-2 w-10 h-10 cursor-pointer border-none bg-transparent opacity-0"
                              title="Pick HEX color"
                            />
                          </div>
                          <input
                            type="text"
                            value={customSwatchHex}
                            onChange={(e) => {
                              let val = e.target.value.toUpperCase();
                              if (val.length > 0 && !val.startsWith("#")) val = "#" + val;
                              setCustomSwatchHex(val);
                            }}
                            className="w-16 bg-transparent text-[11px] font-mono font-bold uppercase text-slate-900 dark:text-slate-100 tracking-wide outline-none"
                            title="HEX color code"
                            maxLength={7}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddColorSwatch(customSwatchName, customSwatchHex)}
                          className="py-2.5 px-4 font-extrabold text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] transition-all active:scale-95 shrink-0 shadow-xs w-full sm:w-auto h-[38px]"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Add Swatch</span>
                        </button>
                      </div>
                    </div>

                    {/* Active Color Swatches & Image Linking Grid */}
                    {colorSwatches.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {colorSwatches.map((sw, sIdx) => {
                          const currentThumb = sw.imageUrl || sw.images?.[0] || "";
                          return (
                            <div
                              key={sIdx}
                              className="p-3.5 bg-white dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 rounded-xl text-left flex flex-col gap-2.5 shadow-2xs"
                            >
                              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/80">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className="relative w-7 h-7 rounded-full border-2 border-blue-600 overflow-hidden flex items-center justify-center shrink-0 bg-stone-100 dark:bg-slate-800 p-[1.5px]"
                                    title={`${sw.name} (${sw.hex})`}
                                  >
                                    {currentThumb && activeColorDisplayStyle === "image_cards" ? (
                                      <img src={currentThumb} alt={sw.name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                      <span className="w-full h-full rounded-full block shadow-inner" style={{ backgroundColor: sw.hex }} />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 font-sans block truncate">
                                      {sw.name}
                                    </span>
                                    <span className="text-[9.5px] font-bold text-slate-400 font-mono">
                                      {sw.hex} &bull; {sw.imageUrl ? "1 image linked" : "No image linked"}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => updateSwatchField(sIdx, "isHot", !sw.isHot)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                      sw.isHot
                                        ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    }`}
                                    title="Toggle Hot badge on this color variant"
                                  >
                                    <span>🔥</span>
                                    <span>{sw.isHot ? "Hot" : "Mark Hot"}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveColorSwatch(sIdx)}
                                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer p-1 rounded"
                                    title="Remove color swatch"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Optional Color Price Override */}
                              {specifyCustomPrices && (
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                                    Color Price ({wizardCurrency}):
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      placeholder={`${blankProductPrice || 0}`}
                                      value={(sw as any).price !== undefined ? (sw as any).price : ""}
                                      onChange={(e) => {
                                        const val = e.target.value === "" ? undefined : Number(e.target.value);
                                        updateSwatchField(sIdx, "price", val);
                                      }}
                                      className="w-24 text-[11px] font-mono p-1 px-2 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">{currencySymbol}</span>
                                  </div>
                                </div>
                              )}

                              {/* Primary Image Linking per Color */}
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                                  Link product photo to {sw.name}:
                                </span>
                                {allMainProductImages.length === 0 ? (
                                  <span className="text-[10.5px] text-slate-400 dark:text-slate-500 italic">
                                    Upload product photos in Step 2 to link images to each color.
                                  </span>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {allMainProductImages.map((imgUrl, imgIdx) => {
                                      const isSelected = sw.imageUrl === imgUrl;
                                      return (
                                        <button
                                          key={imgIdx}
                                          type="button"
                                          onClick={() => {
                                            if (isSelected) {
                                              const updated = [...colorSwatches];
                                              updated[sIdx] = {
                                                ...updated[sIdx],
                                                imageUrl: undefined,
                                                images: (updated[sIdx].images || []).filter((img) => img !== imgUrl),
                                              };
                                              setColorSwatches(updated);
                                            } else if (wizardDetailedImagesPerColorEnabled) {
                                              const details = (wizardDetailedImagesByPrimary?.[imgUrl] || []).filter(Boolean).slice(0, 5);
                                              const updated = [...colorSwatches];
                                              updated[sIdx] = {
                                                ...updated[sIdx],
                                                imageUrl: imgUrl,
                                                images: [imgUrl, ...details],
                                              };
                                              setColorSwatches(updated);
                                            } else {
                                              const updated = [...colorSwatches];
                                              updated[sIdx] = {
                                                ...updated[sIdx],
                                                imageUrl: imgUrl,
                                                images: [imgUrl],
                                              };
                                              setColorSwatches(updated);
                                            }
                                          }}
                                          className={`relative w-12 h-12 border overflow-hidden transition-all duration-150 transform hover:scale-105 active:scale-95 cursor-pointer rounded-lg ${
                                            isSelected
                                              ? "border-2 border-blue-600 ring-2 ring-blue-500/20"
                                              : "border border-slate-300 dark:border-slate-700"
                                          }`}
                                          title={isSelected ? "Linked image (Click to unlink)" : "Click to link this photo"}
                                        >
                                          <img
                                            src={imgUrl}
                                            className="w-full h-full object-cover"
                                            alt="swatch mapping"
                                            referrerPolicy="no-referrer"
                                          />
                                          {isSelected && (
                                            <div className="absolute top-0 right-0 bg-blue-600 text-white rounded-bl-md px-1 py-0.5">
                                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                                            </div>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ================================================================= */}
                  {/* CARD 2: SMART CATEGORY-BASED SIZE / OPTION CONFIGURATION          */}
                  {/* ================================================================= */}
                  <div className="p-4 sm:p-5 rounded-xl border-2 border-blue-200/80 dark:border-blue-900/70 bg-[#f8fafc] dark:bg-slate-900/90 flex flex-col gap-4 shadow-2xs">
                    {/* Prominent Header so Merchants Never Overlook Sizes */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center shrink-0">
                          <Scissors className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-xs font-mono text-slate-900 dark:text-slate-100">
                              2. {smartSizeConfig.sectionTitle}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {smartSizeConfig.badgeLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                            {smartSizeConfig.sectionSubtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold font-mono bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {wizardProductSizes.length} selected
                        </span>
                        {wizardProductSizes.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setWizardProductSizes([]);
                              setSizePrices({});
                              if (wizardVariantsEnabled) {
                                const synced = buildSyncedVariantMatrix(
                                  colorSwatches,
                                  [],
                                  wizardProductVariants,
                                  {},
                                  Number(smartAllocStock) > 0 ? Number(smartAllocStock) : 10
                                );
                                setWizardProductVariants(synced);
                              }
                            }}
                            className="text-[10.5px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer px-1.5"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Multi-System Filter Tabs (e.g., EU / US / UK for Shoes, Letter / Numeric for Clothing) */}
                    <div className="bg-white dark:bg-slate-950/70 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-3.5">
                      {smartSizeConfig.systems.length > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                            Sizing System Filter:
                          </span>
                          <div className="inline-flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => setActiveSizeSystemId("all")}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                activeSizeSystemId === "all"
                                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-extrabold"
                                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              }`}
                            >
                              All Presets
                            </button>
                            {smartSizeConfig.systems.map((sys) => (
                              <button
                                key={sys.id}
                                type="button"
                                onClick={() => setActiveSizeSystemId(sys.id)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                  activeSizeSystemId === sys.id
                                    ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-2xs font-extrabold"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                {sys.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Category-Tailored Preset Chips */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 font-mono">
                            Click to select multiple {smartSizeConfig.columnHeaderLabel.toLowerCase()} options:
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {visibleSizePresets.map((sz) => {
                            const isSelected = wizardProductSizes.includes(sz);
                            const linkedPrice = sizePrices[sz];
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => toggleSize(sz)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer border flex items-center gap-1.5 active:scale-95 ${
                                  isSelected
                                    ? "bg-blue-600 text-white border-blue-600 shadow-xs font-extrabold"
                                    : "bg-[#f8fafc] dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-slate-400"
                                }`}
                              >
                                <span>{sz}</span>
                                {isSelected && specifyCustomPrices && linkedPrice !== undefined && (
                                  <span className="text-[9.5px] font-mono font-bold bg-white/95 text-blue-700 px-1.5 py-0.2 rounded">
                                    {linkedPrice.toLocaleString()} {currencySymbol}
                                  </span>
                                )}
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Size / Option Input */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 items-center">
                        <input
                          type="text"
                          placeholder={smartSizeConfig.placeholder}
                          value={customSizeText}
                          onChange={(e) => setCustomSizeText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomSize();
                            }
                          }}
                          className="w-full sm:flex-1 text-xs font-bold text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[8px] p-2.5 px-3 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 outline-none h-[38px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomSize()}
                          className="w-full sm:w-auto px-4 py-2 text-xs font-extrabold bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white rounded-[8px] transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 h-[38px]"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Add Custom {smartSizeConfig.columnHeaderLabel}</span>
                        </button>
                      </div>

                      {/* Selected Sizes Summary & Optional Price Override Chips */}
                      {wizardProductSizes.length > 0 && (
                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 font-mono block">
                            Active {smartSizeConfig.columnHeaderLabel} Selection ({wizardProductSizes.length}):
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {wizardProductSizes.map((sz) => (
                              <div
                                key={sz}
                                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                              >
                                <span className="font-mono font-extrabold">{sz}</span>
                                {specifyCustomPrices && (
                                  <input
                                    type="number"
                                    placeholder={`${blankProductPrice || 0}`}
                                    value={sizePrices[sz] !== undefined ? sizePrices[sz] : ""}
                                    onChange={(e) => {
                                      const val = e.target.value === "" ? undefined : Number(e.target.value);
                                      updateSizePrice(sz, val);
                                    }}
                                    className="w-20 text-[10.5px] font-mono px-1.5 py-0.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                    title={`Optional custom price for ${sz} (${currencySymbol})`}
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => toggleSize(sz)}
                                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                                  title={`Remove ${sz}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ================================================================= */}
                  {/* CARD 3: MANAGE STOCK BY VARIANTS (SMART ALLOCATION + MATRIX)      */}
                  {/* ================================================================= */}
                  <div className="p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900/90 flex flex-col gap-4 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs font-mono text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>3. Manage Stock by Variants</span>
                            <HintTooltip
                              text="Enable to manage inventory quantities for each specific Color × Size combination. When an order is placed, stock is deducted only from the purchased combination."
                              currentSlideColor={currentSlideColor}
                              showHints={showPrimarySpecsHints}
                              title="Manage Stock by Variants"
                            />
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                            Set stock per Color &times; {smartSizeConfig.columnHeaderLabel} combination or mark unavailable options
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 bg-white dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 font-mono select-none">
                          Manage Stock by Variants
                        </span>
                        <SkeuomorphicSwitch
                          checked={colorStockTrackingEnabled}
                          onChange={(checked) => setColorStockTrackingEnabled(checked)}
                          accentColor="#2563eb"
                        />
                      </div>
                    </div>

                    {colorStockTrackingEnabled ? (
                      colorSwatches.length === 0 && wizardProductSizes.length === 0 ? (
                        <div className="p-5 bg-white dark:bg-slate-950/70 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-1">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">
                            Select at least one Color or {smartSizeConfig.columnHeaderLabel} above
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Once you add colors or {smartSizeConfig.columnHeaderLabel.toLowerCase()} options, the variant inventory table will appear here automatically.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 animate-fade-in">
                          {/* SMART VARIANT STOCK ALLOCATION BAR */}
                          <div className="bg-white dark:bg-slate-950/80 p-3.5 sm:p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/60 shadow-2xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                                  Smart Variant Stock Allocation
                                </span>
                              </div>
                              <span className="text-[10.5px] font-bold font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                Total Active Stock: {totalManagedVariantStock} pcs
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                              {/* Default Stock Input */}
                              <div className="sm:col-span-3 space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono block">
                                  Default Stock (pcs)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={smartAllocStock}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    setSmartAllocStock(raw === "" ? "" : Math.max(0, parseInt(raw, 10) || 0));
                                  }}
                                  placeholder="10"
                                  className="w-full text-xs font-mono font-bold text-slate-900 dark:text-white bg-[#f8fafc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 px-3 outline-none focus:border-blue-600 h-[36px]"
                                />
                              </div>

                              {/* Allocation Target Scope */}
                              <div className="sm:col-span-4 space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono block">
                                  Allocation Target
                                </label>
                                <select
                                  value={smartAllocMode}
                                  onChange={(e) => setSmartAllocMode(e.target.value as "all_available" | "zero_only")}
                                  className="w-full text-xs font-bold text-slate-900 dark:text-white bg-[#f8fafc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 px-2.5 outline-none focus:border-blue-600 h-[36px] cursor-pointer"
                                >
                                  <option value="all_available">All available variants</option>
                                  <option value="zero_only">Only 0-stock variants (preserve custom)</option>
                                </select>
                              </div>

                              {/* Preview Toggle & Confirm Apply Button */}
                              <div className="sm:col-span-5 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowSmartAllocPreview((prev) => !prev)}
                                  className={`flex-1 h-[36px] px-3 rounded-lg text-[11px] font-bold font-mono border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    showSmartAllocPreview
                                      ? "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-600"
                                      : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200/70"
                                  }`}
                                >
                                  <span>{showSmartAllocPreview ? "Hide Preview" : "Preview"}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={handleConfirmSmartStockAllocation}
                                  className="flex-1 h-[36px] px-3.5 rounded-lg text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Apply Stock</span>
                                </button>
                              </div>
                            </div>

                            {/* Distribution Preview Bar */}
                            {showSmartAllocPreview && (
                              <div className="p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                <span className="font-semibold text-blue-900 dark:text-blue-200">
                                  Distribution Preview: Allocating{" "}
                                  <strong className="font-mono font-black">{smartAllocationStats.allocQty} pcs</strong> to{" "}
                                  <strong className="font-mono font-black">{smartAllocationStats.affectedCount}</strong> of{" "}
                                  {smartAllocationStats.totalRows} combinations &rarr; Projected Total:{" "}
                                  <strong className="font-mono font-black">{smartAllocationStats.projectedTotal} pcs</strong>
                                </span>
                                <span className="text-[10px] font-mono text-blue-700 dark:text-blue-300">
                                  Click &ldquo;Apply Stock&rdquo; to confirm
                                </span>
                              </div>
                            )}

                            {smartAllocAppliedBanner && (
                              <div className="p-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{smartAllocAppliedBanner}</span>
                              </div>
                            )}
                          </div>

                          {/* VARIANT INVENTORY MATRIX TABLE */}
                          <div className="bg-white dark:bg-slate-950/80 rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10.5px] font-black font-mono uppercase text-slate-600 dark:text-slate-300">
                                    <th className="py-2.5 px-3.5">Color</th>
                                    <th className="py-2.5 px-3.5">{smartSizeConfig.columnHeaderLabel}</th>
                                    <th className="py-2.5 px-3.5 text-center">Availability</th>
                                    <th className="py-2.5 px-3.5 text-right">Stock Quantity</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                                  {wizardProductVariants.map((v, vIdx) => {
                                    const cName = v?.options?.Color || v?.options?.color || "";
                                    const sName = v?.options?.Size || v?.options?.size || "";
                                    const matchedSwatch = colorSwatches.find(
                                      (sw) => sw.name.trim().toLowerCase() === cName.trim().toLowerCase()
                                    );
                                    const currentStock = Math.max(0, Number(v?.stock) || 0);
                                    const isAvailable = v?.availability !== "out_of_stock" && currentStock > 0;
                                    const willPreviewUpdate =
                                      showSmartAllocPreview &&
                                      (smartAllocMode === "all_available"
                                        ? !(v?.availability === "out_of_stock" && currentStock <= 0)
                                        : currentStock === 0);

                                    return (
                                      <tr
                                        key={v.id || vIdx}
                                        className={`transition-colors ${
                                          !isAvailable
                                            ? "bg-slate-50/70 dark:bg-slate-900/40 opacity-75"
                                            : "hover:bg-slate-50/80 dark:hover:bg-slate-900/60"
                                        }`}
                                      >
                                        {/* Color Cell */}
                                        <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-slate-100">
                                          {cName ? (
                                            <div className="flex items-center gap-2">
                                              <span
                                                className="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 shrink-0"
                                                style={{ backgroundColor: matchedSwatch?.hex || "#94a3b8" }}
                                              />
                                              <span>{cName}</span>
                                            </div>
                                          ) : (
                                            <span className="text-slate-400 dark:text-slate-500 font-normal">Standard</span>
                                          )}
                                        </td>

                                        {/* Size / Option Cell */}
                                        <td className="py-2.5 px-3.5">
                                          {sName ? (
                                            <span className="px-2 py-0.5 rounded-md font-mono font-extrabold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                              {sName}
                                            </span>
                                          ) : (
                                            <span className="text-slate-400 dark:text-slate-500 font-normal">Standard</span>
                                          )}
                                        </td>

                                        {/* Per-Row Availability Toggle */}
                                        <td className="py-2.5 px-3.5 text-center">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleVariantRowAvailability(vIdx)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold font-mono border transition-all cursor-pointer ${
                                              isAvailable
                                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                                : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                                            }`}
                                            title="Click to toggle whether this combination is available or out of stock"
                                          >
                                            <span
                                              className={`w-1.5 h-1.5 rounded-full ${
                                                isAvailable ? "bg-emerald-500" : "bg-rose-500"
                                              }`}
                                            />
                                            <span>{isAvailable ? "Available" : "Unavailable"}</span>
                                          </button>
                                        </td>

                                        {/* Stock Quantity Input */}
                                        <td className="py-2.5 px-3.5 text-right">
                                          <div className="inline-flex items-center justify-end gap-1.5">
                                            {willPreviewUpdate && (
                                              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                                &rarr; {smartAllocationStats.allocQty}
                                              </span>
                                            )}
                                            <input
                                              type="number"
                                              min="0"
                                              value={currentStock}
                                              onChange={(e) => handleUpdateVariantRowStock(vIdx, e.target.value)}
                                              className={`w-20 text-xs font-mono font-bold p-1.5 px-2.5 rounded-lg border text-right outline-none transition-all ${
                                                !isAvailable
                                                  ? "bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800"
                                                  : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-blue-600"
                                              }`}
                                            />
                                            <span className="text-[10px] font-mono font-bold text-slate-400">pcs</span>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="p-3.5 bg-white dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                        <span>
                          Using general product stock (<strong className="text-slate-800 dark:text-slate-200 font-mono">{wizardStock || 0} pcs</strong>). Turn on <strong>Manage Stock by Variants</strong> to set stock per Color &times; {smartSizeConfig.columnHeaderLabel} combination.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 px-4 text-slate-500 dark:text-slate-400 font-medium text-xs font-sans bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  Product Variants are currently turned off. Switch ON above to configure colors, category-based sizes, and variant stock.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
  );
}
