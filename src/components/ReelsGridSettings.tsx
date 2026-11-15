import React, { useState } from "react";
import {
  Film,
  Play,
  Monitor,
  Tablet,
  Smartphone,
  Check,
  Eye,
  Heart,
  EyeIcon,
  Volume2
} from "lucide-react";

export interface ReelsGridSettingsProps {
  reelsPerRow: 2 | 3 | 4 | 5;
  onChangeReelsPerRow: (cols: 2 | 3 | 4 | 5) => void;
  cardSpacing: "compact" | "normal" | "spacious";
  onChangeCardSpacing: (spacing: "compact" | "normal" | "spacious") => void;
  accentColor?: string;
  currentLanguage?: "ar" | "fr" | "en" | string;
  showLivePreview?: boolean;
  compactMode?: boolean;
  permitBuyerModifications?: boolean;
  onTogglePermitBuyerModifications?: (val: boolean) => void;
  onFeedbackMessage?: (msg: string) => void;
}

// Authentic visual sample reels for the live preview
const SAMPLE_PREVIEW_REELS = [
  {
    id: 1,
    title_en: "Handcrafting Berber Silver Bracelet",
    title_ar: "صناعة سوار فضة أمازيغي تقليدي",
    title_fr: "Fabrication d'un bracelet berbère",
    poster: "https://images.unsplash.com/photo-1611591475871-33230a104052?w=400&auto=format&fit=crop&q=80",
    views: "24.8K",
    likes: "3.2K",
    author: "@tizi_silver",
    tag_en: "Workshop",
    tag_ar: "ورشة عمل",
    tag_fr: "Atelier"
  },
  {
    id: 2,
    title_en: "Artisan Leather Tote Stitched by Hand",
    title_ar: "حياكة حقيبة جلدية يدوياً في القصبة",
    title_fr: "Sac en cuir cousu main à la Casbah",
    poster: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop&q=80",
    views: "18.3K",
    likes: "2.1K",
    author: "@casbah_cuir",
    tag_en: "Craft",
    tag_ar: "حرفة",
    tag_fr: "Artisanat"
  },
  {
    id: 3,
    title_en: "Glazing Desert Ceramic Vase",
    title_ar: "زخرفة وتلوين فخار الصحراء",
    title_fr: "Émaillage de poterie saharienne",
    poster: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&auto=format&fit=crop&q=80",
    views: "32.1K",
    likes: "4.5K",
    author: "@tipaza_ceramics",
    tag_en: "Behind the Scenes",
    tag_ar: "خلف الكواليس",
    tag_fr: "Coulisses"
  },
  {
    id: 4,
    title_en: "Weaving Pure Wool Rug in Aurès",
    title_ar: "نسج زربية صوف طبيعية في الأوراس",
    title_fr: "Tissage de tapis en laine pure",
    poster: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=400&auto=format&fit=crop&q=80",
    views: "15.9K",
    likes: "1.9K",
    author: "@aures_wool",
    tag_en: "Tradition",
    tag_ar: "أصالة",
    tag_fr: "Tradition"
  },
  {
    id: 5,
    title_en: "Tolga Organic Dates Harvest Process",
    title_ar: "موسم جني تمور دقلة نور في طولقة",
    title_fr: "Récolte des dattes de Tolga",
    poster: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&auto=format&fit=crop&q=80",
    views: "44.7K",
    likes: "5.8K",
    author: "@tolga_oasis",
    tag_en: "Harvest",
    tag_ar: "حصاد",
    tag_fr: "Récolte"
  },
  {
    id: 6,
    title_en: "Copper Engraving Masterclass Algiers",
    title_ar: "نقش إبريق نحاسي أصيل بالعاصمة",
    title_fr: "Gravure sur cuivre à Alger",
    poster: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=80",
    views: "12.4K",
    likes: "1.4K",
    author: "@copper_artisan",
    tag_en: "Heritage",
    tag_ar: "تراث",
    tag_fr: "Patrimoine"
  }
];

export const ReelsGridSettings: React.FC<ReelsGridSettingsProps> = ({
  reelsPerRow,
  onChangeReelsPerRow,
  cardSpacing,
  onChangeCardSpacing,
  accentColor = "#8b5cf6",
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
      title_ar: "مقطعان في الصف",
      title_fr: "2 par ligne",
      desc_en: "Large immersive showcase",
      desc_ar: "عرض فيديو كبير وواضح",
      desc_fr: "Grand affichage immersif"
    },
    {
      count: 3,
      title_en: "3 per Row",
      title_ar: "3 في الصف",
      title_fr: "3 par ligne",
      desc_en: "Balanced portrait view",
      desc_ar: "مظهر مريح ومتوازن",
      desc_fr: "Vue portrait équilibrée"
    },
    {
      count: 4,
      title_en: "4 per Row",
      title_ar: "4 في الصف",
      title_fr: "4 par ligne",
      desc_en: "Standard reels grid",
      desc_ar: "المعيار القياسي للريلز",
      desc_fr: "Grille standard de Reels"
    },
    {
      count: 5,
      title_en: "5 per Row",
      title_ar: "5 في الصف",
      title_fr: "5 par ligne",
      desc_en: "Compact high density",
      desc_ar: "عرض مدمج وغني",
      desc_fr: "Affichage compact dense"
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
  }> = [
    {
      id: "compact",
      label_en: "Compact",
      label_ar: "مدمج",
      label_fr: "Compact",
      desc_en: "Tight, sleek margins",
      desc_ar: "فواصل ضيقة وأنيقة",
      desc_fr: "Marges serrées et épurées"
    },
    {
      id: "normal",
      label_en: "Normal",
      label_ar: "عادي",
      label_fr: "Normal",
      desc_en: "Comfortable standard balance",
      desc_ar: "مسافات متناسقة ومريحة",
      desc_fr: "Espacement régulier équilibré"
    },
    {
      id: "spacious",
      label_en: "Spacious",
      label_ar: "واسع",
      label_fr: "Spacieux",
      desc_en: "Airy, breathable layout",
      desc_ar: "مسافات واسعة وشديدة الوضوح",
      desc_fr: "Disposition aérée et luxueuse"
    }
  ];

  const getPreviewGridColumns = () => {
    if (previewDevice === "mobile") {
      return reelsPerRow <= 2 ? "grid-cols-2" : "grid-cols-2";
    }
    if (previewDevice === "tablet") {
      return reelsPerRow === 2 ? "grid-cols-2" : "grid-cols-3";
    }
    switch (reelsPerRow) {
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
      id="reels-grid-settings-section"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* 1. Header with Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-white/10 select-none">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            <Film className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h5 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{isAr ? "شبكة الريلز" : isFr ? "Grille de Reels" : "Reels Grid"}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                {reelsPerRow} {isAr ? "أعمدة" : isFr ? "col." : "Cols"} • {cardSpacing === "compact" ? (isAr ? "مدمج" : isFr ? "Compact" : "Compact") : cardSpacing === "normal" ? (isAr ? "عادي" : isFr ? "Normal" : "Normal") : (isAr ? "واسع" : isFr ? "Spacieux" : "Spacious")}
              </span>
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
              {isAr
                ? "تحديد عدد مقاطع الريلز في كل صف والمسافة الفاصلة مع معاينة فورية ومباشرة."
                : isFr
                ? "Configurez le nombre de Reels par ligne et l'espacement avec aperçu instantané."
                : "Configure reels per row and card spacing with instant live visual feedback."}
            </p>
          </div>
        </div>

        {/* Live sync badge */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 text-[10.5px] font-semibold text-purple-700 dark:text-purple-300">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
          <span>{isAr ? "تحديث فوري مباشر" : isFr ? "Mise à jour en direct" : "Live Real-Time Sync"}</span>
        </div>
      </div>

      {/* 2. Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Choice A: Reels per Row */}
        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-150 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                {isAr ? "الريلز في كل صف" : isFr ? "Reels par ligne" : "Reels per Row"}
              </span>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {isAr ? "اختر كثافة عرض الأعمدة لمقاطع الريلز في متجرك" : isFr ? "Choisissez la densité de colonnes des Reels" : "Choose column density for store video showcase"}
              </span>
            </div>
          </div>

          {/* Simple Choices 2, 3, 4, 5 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 select-none">
            {rowOptions.map((opt) => {
              const isSelected = reelsPerRow === opt.count;
              return (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => {
                    onChangeReelsPerRow(opt.count);
                    if (onFeedbackMessage) {
                      onFeedbackMessage(
                        isAr
                          ? `✨ تم ضبط العرض على ${opt.count} مقاطع ريلز في كل صف`
                          : isFr
                          ? `✨ Affichage configuré à ${opt.count} Reels par ligne`
                          : `✨ Reels per row updated to ${opt.count}`
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

                  {/* Visual column illustration (portrait 9:16 aspect hint) */}
                  <div className="flex items-center justify-center gap-1 h-5 w-full px-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    {Array.from({ length: opt.count }).map((_, barIdx) => (
                      <div
                        key={barIdx}
                        className={`h-5 rounded-xs transition-colors ${
                          isSelected ? "w-2" : "w-1.5 bg-slate-300 dark:bg-slate-600"
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
                {isAr ? "المسافة الفاصلة بين بطاقات مقاطع الريلز" : isFr ? "Distance de séparation entre les cartes de Reels" : "Margin gap separation between video reel items"}
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
                          ? `↔️ تم ضبط تباعد الريلز إلى: ${opt.label_ar}`
                          : isFr
                          ? `↔️ Espacement des Reels défini sur: ${opt.label_fr}`
                          : `↔️ Reel spacing set to: ${opt.label_en}`
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
                      className="h-4 w-2.5 rounded-xs transition-colors"
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
                      className="h-4 w-2.5 rounded-xs transition-colors"
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
              <Eye className="w-4 h-4 text-purple-500" />
              <span>{isAr ? "معاينة حية لشبكة الريلز (مباشرة)" : isFr ? "Aperçu en direct de la grille des Reels" : "Live Reels Grid Preview"}</span>
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
                    yume.dz/reels
                  </span>
                </div>
                <div className="text-[9.5px] font-mono text-slate-400">
                  {previewDevice === "desktop"
                    ? `${reelsPerRow} ${isAr ? "مقاطع في الصف" : "reels per row"}`
                    : previewDevice === "tablet"
                    ? (isAr ? "عرض متجاوب للتابلت" : "Tablet responsive view")
                    : (isAr ? "عرض متجاوب للهاتف" : "Mobile responsive view")}
                </div>
              </div>

              {/* Dynamic Live Grid of Mock Reel Cards */}
              <div className={`grid ${getPreviewGridColumns()} ${getPreviewGapClass()} transition-all duration-200`}>
                {SAMPLE_PREVIEW_REELS.slice(0, previewDevice === "mobile" ? 4 : 6).map((reel) => (
                  <div
                    key={reel.id}
                    className="relative aspect-[9/16] rounded-xl overflow-hidden bg-slate-900 border border-black/10 dark:border-white/10 shadow-xs group cursor-pointer"
                  >
                    {/* Background poster */}
                    <img
                      src={reel.poster}
                      alt={isAr ? reel.title_ar : isFr ? reel.title_fr : reel.title_en}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30 pointer-events-none" />

                    {/* Top badging */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/50 text-white backdrop-blur-xs flex items-center gap-1">
                        <EyeIcon className="w-2.5 h-2.5 text-purple-400" />
                        {reel.views}
                      </span>
                      <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/80 text-white backdrop-blur-xs">
                        {isAr ? reel.tag_ar : isFr ? reel.tag_fr : reel.tag_en}
                      </span>
                    </div>

                    {/* Center play icon button */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-xs border border-white/50 flex items-center justify-center text-white shadow-md transform group-hover:scale-110 transition-transform">
                        <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
                      </div>
                    </div>

                    {/* Bottom caption and author */}
                    <div className="absolute bottom-2 left-2 right-2 space-y-1 text-left pointer-events-none">
                      <p className="text-[10px] font-bold text-white leading-tight line-clamp-2 drop-shadow-xs">
                        {isAr ? reel.title_ar : isFr ? reel.title_fr : reel.title_en}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-white/80 font-medium">
                        <span className="truncate">{reel.author}</span>
                        <span className="flex items-center gap-0.5 text-rose-300 shrink-0">
                          <Heart className="w-2.5 h-2.5 fill-current" />
                          {reel.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Optional Buyer Permission Toggle */}
      {permitBuyerModifications !== undefined && onTogglePermitBuyerModifications && (
        <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-3 text-left">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-800 dark:text-white block">
              {isAr ? "السماح للزوار بتخصيص شبكة الريلز" : isFr ? "Autoriser les acheteurs à personnaliser" : "Allow Buyers to Customize Reels Grid"}
            </span>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">
              {isAr
                ? "تمكين المشترين من تغيير عدد الأعمدة والتباعد بحرية أثناء تصفح متجرك."
                : isFr
                ? "Permettre aux visiteurs de modifier la disposition des Reels selon leur confort."
                : "Permit visiting buyers to switch reels per row & spacing on their own device."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onTogglePermitBuyerModifications(!permitBuyerModifications)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              permitBuyerModifications ? "bg-purple-600" : "bg-slate-300 dark:bg-white/20"
            }`}
          >
            <span
              className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.5 transition-transform shadow-xs ${
                permitBuyerModifications ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
};
