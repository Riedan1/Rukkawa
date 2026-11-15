import React, { useState } from "react";
import {
  LayoutGrid,
  Columns2,
  Columns3,
  Columns4,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Check,
  Eye,
  ShoppingBag,
  Heart
} from "lucide-react";

export interface ProductsGridSettingsProps {
  productsPerRow: 2 | 3 | 4 | 5;
  onChangeProductsPerRow: (cols: 2 | 3 | 4 | 5) => void;
  cardSpacing: "compact" | "normal" | "spacious";
  onChangeCardSpacing: (spacing: "compact" | "normal" | "spacious") => void;
  accentColor?: string;
  currentLanguage?: "ar" | "fr" | "en" | string;
  showLivePreview?: boolean;
  compactMode?: boolean; // For slide-over drawer or popover
  permitBuyerModifications?: boolean;
  onTogglePermitBuyerModifications?: (val: boolean) => void;
  onFeedbackMessage?: (msg: string) => void;
}

// Visual sample products for the live preview
const SAMPLE_PREVIEW_PRODUCTS = [
  {
    id: 1,
    name_en: "Artisan Leather Tote",
    name_ar: "حقيبة جلدية حرفية",
    name_fr: "Sac en cuir artisanal",
    price: "8,500 DZD",
    category_en: "Leathercraft",
    category_ar: "جلود",
    category_fr: "Maroquinerie",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop&q=80",
    tag_en: "Bestseller",
    tag_ar: "الأكثر مبيعاً",
    tag_fr: "Succès"
  },
  {
    id: 2,
    name_en: "Berber Silver Bracelet",
    name_ar: "سوار فضة أمازيغي",
    name_fr: "Bracelet berbère en argent",
    price: "14,200 DZD",
    category_en: "Jewelry",
    category_ar: "مجوهرات",
    category_fr: "Bijoux",
    image: "https://images.unsplash.com/photo-1611591475871-33230a104052?w=400&auto=format&fit=crop&q=80",
    tag_en: "Handmade",
    tag_ar: "صناعة يدوية",
    tag_fr: "Fait main"
  },
  {
    id: 3,
    name_en: "Hand-Woven Wool Rug",
    name_ar: "زربية صوف يدوية",
    name_fr: "Tapis en laine tissé",
    price: "26,000 DZD",
    category_en: "Home Decor",
    category_ar: "ديكور منزلي",
    category_fr: "Décoration",
    image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=400&auto=format&fit=crop&q=80",
    tag_en: "Artisanal",
    tag_ar: "تقليدي",
    tag_fr: "Traditionnel"
  },
  {
    id: 4,
    name_en: "Glazed Ceramic Vase",
    name_ar: "مزهرية فخار مزخرفة",
    name_fr: "Vase en céramique émaillée",
    price: "4,800 DZD",
    category_en: "Pottery",
    category_ar: "فخار وخزف",
    category_fr: "Poterie",
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&auto=format&fit=crop&q=80",
    tag_en: "Unique",
    tag_ar: "فريد",
    tag_fr: "Unique"
  },
  {
    id: 5,
    name_en: "Organic Sahara Dates",
    name_ar: "تمور دقلة نور عضوية",
    name_fr: "Dattes bio de Tolga",
    price: "1,600 DZD",
    category_en: "Terroir",
    category_ar: "منتجات طبيعية",
    category_fr: "Terroir",
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&auto=format&fit=crop&q=80",
    tag_en: "Premium",
    tag_ar: "فاخر",
    tag_fr: "Haut de gamme"
  },
  {
    id: 6,
    name_en: "Traditional Copper Teapot",
    name_ar: "إبريق شاي نحاسي تقليدي",
    name_fr: "Théière traditionnelle en cuivre",
    price: "6,900 DZD",
    category_en: "Metalwork",
    category_ar: "نحاسيات",
    category_fr: "Dinanderie",
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=80",
    tag_en: "Authentic",
    tag_ar: "أصيل",
    tag_fr: "Authentique"
  }
];

export const ProductsGridSettings: React.FC<ProductsGridSettingsProps> = ({
  productsPerRow,
  onChangeProductsPerRow,
  cardSpacing,
  onChangeCardSpacing,
  accentColor = "#ff385c",
  currentLanguage = "en",
  showLivePreview = true,
  compactMode = false,
  permitBuyerModifications,
  onTogglePermitBuyerModifications,
  onFeedbackMessage
}) => {
  const isAr = currentLanguage === "ar";
  const isFr = currentLanguage === "fr";
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const rowOptions: Array<{
    count: 2 | 3 | 4 | 5;
    title_en: string;
    title_ar: string;
    title_fr: string;
    desc_en: string;
    desc_ar: string;
    desc_fr: string;
  }> = [
    {
      count: 2,
      title_en: "2 per Row",
      title_ar: "منتجان في الصف",
      title_fr: "2 par ligne",
      desc_en: "Large luxury showcase",
      desc_ar: "عرض فاخر وكبير",
      desc_fr: "Grand affichage de luxe"
    },
    {
      count: 3,
      title_en: "3 per Row",
      title_ar: "3 في الصف",
      title_fr: "3 par ligne",
      desc_en: "Balanced boutique view",
      desc_ar: "مظهر مريح ومتوازن",
      desc_fr: "Vue boutique équilibrée"
    },
    {
      count: 4,
      title_en: "4 per Row",
      title_ar: "4 في الصف",
      title_fr: "4 par ligne",
      desc_en: "Standard catalog grid",
      desc_ar: "المعيار القياسي المتناسق",
      desc_fr: "Grille de catalogue standard"
    },
    {
      count: 5,
      title_en: "5 per Row",
      title_ar: "5 في الصف",
      title_fr: "5 par ligne",
      desc_en: "Compact high density",
      desc_ar: "عرض مدمج وغني",
      desc_fr: "Affichage compact et dense"
    }
  ];

  const spacingOptions: Array<{
    id: "compact" | "normal" | "spacious";
    label_en: string;
    label_ar: string;
    label_fr: string;
    desc_en: string;
    desc_ar: string;
    desc_fr: string;
    gapClass: string;
    previewPadding: string;
  }> = [
    {
      id: "compact",
      label_en: "Compact",
      label_ar: "مدمج",
      label_fr: "Compact",
      desc_en: "Tight, sleek margins",
      desc_ar: "فواصل ضيقة وأنيقة",
      desc_fr: "Marges serrées et épurées",
      gapClass: "gap-2 sm:gap-2.5",
      previewPadding: "p-1.5"
    },
    {
      id: "normal",
      label_en: "Normal",
      label_ar: "عادي",
      label_fr: "Normal",
      desc_en: "Comfortable standard balance",
      desc_ar: "مسافات متناسقة ومريحة",
      desc_fr: "Espacement régulier équilibré",
      gapClass: "gap-3 sm:gap-4",
      previewPadding: "p-2.5"
    },
    {
      id: "spacious",
      label_en: "Spacious",
      label_ar: "واسع",
      label_fr: "Spacieux",
      desc_en: "Airy, breathable luxury layout",
      desc_ar: "مسافات واسعة وشديدة الوضوح",
      desc_fr: "Disposition aérée et luxueuse",
      gapClass: "gap-4 sm:gap-6",
      previewPadding: "p-3.5"
    }
  ];

  // Map choices to preview responsive grid styles
  const getPreviewGridColumns = () => {
    if (previewDevice === "mobile") {
      // 1 or 2 items on mobile
      return productsPerRow <= 2 ? "grid-cols-1" : "grid-cols-2";
    }
    if (previewDevice === "tablet") {
      // max 3 on tablet
      return productsPerRow === 2 ? "grid-cols-2" : "grid-cols-3";
    }
    // desktop
    switch (productsPerRow) {
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-4";
      case 5:
        return "grid-cols-5";
      default:
        return "grid-cols-4";
    }
  };

  const getPreviewGapClass = () => {
    switch (cardSpacing) {
      case "compact":
        return "gap-2 sm:gap-2.5";
      case "normal":
        return "gap-3 sm:gap-3.5";
      case "spacious":
        return "gap-4 sm:gap-5";
      default:
        return "gap-3";
    }
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#18181b] text-left transition-all ${
        compactMode ? "p-4 space-y-4" : "p-5 sm:p-6 space-y-6 shadow-sm"
      }`}
      id="products-grid-settings-section"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* 1. Header with Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-white/10 select-none">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            <LayoutGrid className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h5 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{isAr ? "شبكة المنتجات" : isFr ? "Grille de produits" : "Products Grid"}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                {productsPerRow} {isAr ? "أعمدة" : isFr ? "col." : "Cols"} • {cardSpacing === "compact" ? (isAr ? "مدمج" : isFr ? "Compact" : "Compact") : cardSpacing === "normal" ? (isAr ? "عادي" : isFr ? "Normal" : "Normal") : (isAr ? "واسع" : isFr ? "Spacieux" : "Spacious")}
              </span>
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
              {isAr
                ? "تحديد عدد المنتجات في كل صف والمسافة الفاصلة مع معاينة فورية ومباشرة."
                : isFr
                ? "Configurez le nombre de produits par ligne et l'espacement avec aperçu instantané."
                : "Configure products per row and card spacing with instant live visual feedback."}
            </p>
          </div>
        </div>

        {/* Live sync badge */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{isAr ? "تحديث فوري مباشر" : isFr ? "Mise à jour en direct" : "Live Real-Time Sync"}</span>
        </div>
      </div>

      {/* 2. Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Choice A: Products per Row */}
        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-150 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                {isAr ? "المنتجات في كل صف" : isFr ? "Produits par ligne" : "Products per Row"}
              </span>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {isAr ? "اختر كثافة عرض الأعمدة في متجرك" : isFr ? "Choisissez la densité de colonnes" : "Choose column density for storefront catalog"}
              </span>
            </div>
          </div>

          {/* Simple Choices 2, 3, 4, 5 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 select-none">
            {rowOptions.map((opt) => {
              const isSelected = productsPerRow === opt.count;
              return (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => {
                    onChangeProductsPerRow(opt.count);
                    if (onFeedbackMessage) {
                      onFeedbackMessage(
                        isAr
                          ? `✨ تم ضبط العرض على ${opt.count} منتجات في كل صف`
                          : isFr
                          ? `✨ Affichage configuré à ${opt.count} produits par ligne`
                          : `✨ Products per row updated to ${opt.count}`
                      );
                    }
                  }}
                  className={`relative p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group text-center ${
                    isSelected
                      ? "bg-white dark:bg-zinc-800 shadow-sm border-2 scale-[1.02]"
                      : "bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                  }`}
                  style={isSelected ? { borderColor: accentColor } : {}}
                >
                  {/* Selected indicator check badge */}
                  {isSelected && (
                    <div
                      className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Visual column illustration */}
                  <div className="flex items-center justify-center gap-1 h-5 w-full px-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    {Array.from({ length: opt.count }).map((_, barIdx) => (
                      <div
                        key={barIdx}
                        className={`h-4.5 rounded-xs transition-colors ${
                          isSelected ? "w-2.5" : "w-2 bg-slate-300 dark:bg-slate-600"
                        }`}
                        style={isSelected ? { backgroundColor: accentColor } : {}}
                      />
                    ))}
                  </div>

                  {/* Main Choice Number */}
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-black tracking-tight text-slate-900 dark:text-white font-mono">
                      {opt.count}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {isAr ? "في الصف" : isFr ? "/ ligne" : "per row"}
                    </span>
                  </div>

                  {/* Short Subtitle */}
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-tight">
                    {isAr ? opt.desc_ar : isFr ? opt.desc_fr : opt.desc_en}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Choice B: Card Spacing */}
        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-150 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                {isAr ? "تباعد البطاقات" : isFr ? "Espacement des cartes" : "Card Spacing"}
              </span>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {isAr ? "المسافة الفاصلة بين بطاقات المنتجات" : isFr ? "Distance de séparation entre les cartes" : "Margin gap separation between product items"}
              </span>
            </div>
          </div>

          {/* Simple Choices: Compact, Normal, Spacious */}
          <div className="grid grid-cols-3 gap-2 select-none">
            {spacingOptions.map((opt) => {
              const isSelected = cardSpacing === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChangeCardSpacing(opt.id);
                    if (onFeedbackMessage) {
                      onFeedbackMessage(
                        isAr
                          ? `↔️ تم ضبط تباعد البطاقات إلى: ${opt.label_ar}`
                          : isFr
                          ? `↔️ Espacement des cartes défini sur: ${opt.label_fr}`
                          : `↔️ Card spacing set to: ${opt.label_en}`
                      );
                    }
                  }}
                  className={`relative p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group text-center ${
                    isSelected
                      ? "bg-white dark:bg-zinc-800 shadow-sm border-2 scale-[1.02]"
                      : "bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                  }`}
                  style={isSelected ? { borderColor: accentColor } : {}}
                >
                  {/* Selected indicator check badge */}
                  {isSelected && (
                    <div
                      className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Visual Spacing Preview Bars */}
                  <div className="flex items-center justify-center h-5 w-full px-2">
                    <div
                      className="h-4 w-4 rounded-xs transition-colors"
                      style={isSelected ? { backgroundColor: accentColor } : { backgroundColor: "#94a3b8" }}
                    />
                    <div
                      className={`h-0.5 transition-all ${
                        opt.id === "compact"
                          ? "w-1.5 bg-slate-300 dark:bg-slate-600"
                          : opt.id === "normal"
                          ? "w-3 bg-slate-300 dark:bg-slate-600"
                          : "w-5 bg-slate-300 dark:bg-slate-600"
                      }`}
                    />
                    <div
                      className="h-4 w-4 rounded-xs transition-colors"
                      style={isSelected ? { backgroundColor: accentColor } : { backgroundColor: "#94a3b8" }}
                    />
                  </div>

                  {/* Label */}
                  <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white">
                    {isAr ? opt.label_ar : isFr ? opt.label_fr : opt.label_en}
                  </span>

                  {/* Subtitle */}
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-tight">
                    {isAr ? opt.desc_ar : isFr ? opt.desc_fr : opt.desc_en}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Live Interactive Preview */}
      {showLivePreview && (
        <div className="pt-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 select-none">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
              <Eye className="w-4 h-4 text-slate-500" />
              <span>{isAr ? "معاينة حية للمتجر (مباشرة)" : isFr ? "Aperçu en direct du magasin" : "Live Storefront Grid Preview"}</span>
            </div>

            {/* Responsive Device View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 p-0.5 rounded-xl self-start sm:self-auto border border-slate-200/70 dark:border-white/5">
              {[
                { id: "desktop", label_en: "Desktop", label_ar: "حاسوب", label_fr: "Bureau", icon: Monitor },
                { id: "tablet", label_en: "Tablet", label_ar: "لوحي", label_fr: "Tablette", icon: Tablet },
                { id: "mobile", label_en: "Mobile", label_ar: "هاتف", label_fr: "Mobile", icon: Smartphone }
              ].map((dev) => {
                const Icon = dev.icon;
                const isCurrent = previewDevice === dev.id;
                return (
                  <button
                    key={dev.id}
                    type="button"
                    onClick={() => setPreviewDevice(dev.id as any)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{isAr ? dev.label_ar : isFr ? dev.label_fr : dev.label_en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Device Mockup Shell Container */}
          <div className="w-full bg-slate-100/80 dark:bg-black/30 rounded-2xl p-3 sm:p-5 border border-slate-200/80 dark:border-white/5 flex justify-center overflow-hidden transition-all duration-300">
            <div
              className={`w-full transition-all duration-300 bg-white dark:bg-[#1f1f23] rounded-xl border border-slate-200 dark:border-white/10 p-3 sm:p-4 shadow-xs ${
                previewDevice === "mobile"
                  ? "max-w-[340px]"
                  : previewDevice === "tablet"
                  ? "max-w-[560px]"
                  : "max-w-full"
              }`}
            >
              {/* Simulated mini browser/store bar */}
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 font-sans">
                    yume.dz/boutique
                  </span>
                </div>
                <div className="text-[9.5px] font-mono text-slate-400">
                  {previewDevice === "desktop"
                    ? `${productsPerRow} ${isAr ? "منتجات في الصف" : "per row"}`
                    : previewDevice === "tablet"
                    ? (isAr ? "عرض متجاوب للتابلت" : "Tablet responsive view")
                    : (isAr ? "عرض متجاوب للهاتف" : "Mobile responsive view")}
                </div>
              </div>

              {/* Dynamic Live Grid of Mock Cards */}
              <div className={`grid ${getPreviewGridColumns()} ${getPreviewGapClass()} transition-all duration-200`}>
                {SAMPLE_PREVIEW_PRODUCTS.slice(0, previewDevice === "mobile" ? 4 : 6).map((item) => (
                  <div
                    key={item.id}
                    className="group bg-slate-50/70 dark:bg-white/[0.03] rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden flex flex-col transition-all hover:shadow-xs"
                  >
                    {/* Card image */}
                    <div className="relative aspect-4/3 w-full bg-slate-200 dark:bg-white/5 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span
                        className="absolute top-1.5 left-1.5 text-[8.5px] font-bold text-white px-1.5 py-0.5 rounded-md shadow-xs backdrop-blur-xs"
                        style={{ backgroundColor: accentColor }}
                      >
                        {isAr ? item.tag_ar : isFr ? item.tag_fr : item.tag_en}
                      </span>
                    </div>

                    {/* Card details */}
                    <div className="p-2 sm:p-2.5 flex flex-col justify-between flex-1 gap-1">
                      <div>
                        <span className="text-[8.5px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
                          {isAr ? item.category_ar : isFr ? item.category_fr : item.category_en}
                        </span>
                        <h6 className="text-[11px] font-bold text-slate-800 dark:text-white truncate mt-0.5">
                          {isAr ? item.name_ar : isFr ? item.name_fr : item.name_en}
                        </h6>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-150/60 dark:border-white/5 mt-1">
                        <span className="text-[11px] font-black text-slate-900 dark:text-white font-mono">
                          {item.price}
                        </span>
                        <div
                          className="w-5 h-5 rounded-md text-white flex items-center justify-center shadow-3xs cursor-pointer"
                          style={{ backgroundColor: accentColor }}
                        >
                          <ShoppingBag className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Optional Dynamic Buyer Authorization Toggle */}
      {onTogglePermitBuyerModifications && (
        <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h6 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
              <span>🔓</span>
              <span>{isAr ? "إذن التخصيص للمشترين" : isFr ? "Autorisation de personnalisation acheteur" : "Dynamic Buyer Authorization"}</span>
            </h6>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              {isAr
                ? "السماح للمشترين المسجلين بضبط مظهر الشبكة على أجهزتهم الخاصة."
                : isFr
                ? "Autoriser les acheteurs inscrits à ajuster l'affichage de la grille sur leur appareil."
                : "Allow registered buyers to customize products grid density directly on your storefront."}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 select-none">
              {permitBuyerModifications
                ? (isAr ? "مسموح للمشترين" : isFr ? "Autorisé" : "Authorized")
                : (isAr ? "مغلق من قبل التاجر" : isFr ? "Verrouillé" : "Merchant Locked")}
            </span>
            <button
              type="button"
              onClick={() => onTogglePermitBuyerModifications(!permitBuyerModifications)}
              className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer relative ${
                permitBuyerModifications ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
                  permitBuyerModifications ? (isAr ? "-translate-x-5" : "translate-x-5") : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
