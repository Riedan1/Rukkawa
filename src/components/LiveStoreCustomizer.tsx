import React, { useState } from "react";
import { 
  X, Save, RotateCcw, Palette, Type, Sliders, Layout, Sparkles, 
  Settings, Type as FontIcon, Eye, Check, ChevronRight, HelpCircle,
  FileText, Megaphone, Film
} from "lucide-react";
import { MerchantStore } from "../types";
import { SkeuomorphicSwitch } from "./SkeuomorphicSwitch";
import { ProductsGridSettings } from "./ProductsGridSettings";
import { ReelsGridSettings } from "./ReelsGridSettings";

interface LiveStoreCustomizerProps {
  selectedStore: MerchantStore;
  onUpdateSetting: (key: string, value: any, isRoot?: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  currentLanguage: "en" | "fr" | "ar";
  darkMode: boolean;
}

export function LiveStoreCustomizer({
  selectedStore,
  onUpdateSetting,
  onSave,
  onCancel,
  currentLanguage,
  darkMode
}: LiveStoreCustomizerProps) {
  const [activeTab, setActiveTab] = useState<"design" | "products" | "fonts" | "glass" | "text">("design");

  const design: any = selectedStore.designSettings || {};

  const currentProductsPerRow: 2 | 3 | 4 | 5 = (() => {
    if (design.productsPerRow && [2, 3, 4, 5].includes(design.productsPerRow)) {
      return design.productsPerRow;
    }
    const minWidth = parseInt(design.gridCardMinWidth || "200", 10);
    if (minWidth >= 340) return 2;
    if (minWidth >= 240) return 3;
    if (minWidth >= 180) return 4;
    return 5;
  })();

  const currentCardSpacing: "compact" | "normal" | "spacious" = (() => {
    if (design.cardSpacing && ["compact", "normal", "spacious"].includes(design.cardSpacing)) {
      return design.cardSpacing;
    }
    const gap = parseInt(design.gridCardGap || "16", 10);
    if (gap <= 12) return "compact";
    if (gap <= 22) return "normal";
    return "spacious";
  })();

  const currentReelsPerRow: 2 | 3 | 4 | 5 = (() => {
    if (design.reelsPerRow && [2, 3, 4, 5].includes(design.reelsPerRow)) {
      return design.reelsPerRow as 2 | 3 | 4 | 5;
    }
    const minWidth = parseInt(design.reelsGridCardMinWidth || "180", 10);
    if (minWidth >= 240) return 2;
    if (minWidth >= 190) return 3;
    if (minWidth >= 150) return 4;
    return 5;
  })();

  const currentReelsCardSpacing: "compact" | "normal" | "spacious" = (() => {
    if (design.reelsCardSpacing && ["compact", "normal", "spacious"].includes(design.reelsCardSpacing)) {
      return design.reelsCardSpacing;
    }
    const gap = parseInt(design.reelsGridCardGap || "16", 10);
    if (gap <= 10) return "compact";
    if (gap <= 18) return "normal";
    return "spacious";
  })();

  const [activeGridSubTab, setActiveGridSubTab] = useState<"products" | "reels">("products");

  // Presets
  const coverTemplatesList = [
    { id: "toonhub", name: "ToonHub", desc: "Playful & Vibrant Colors" },
    { id: "sahara_gold", name: "Sahara Gold", desc: "Golden Desert Sunset" },
    { id: "casbah_minimal", name: "Casbah Minimal", desc: "Modern Slate Slate" },
    { id: "berber_indigo", name: "Berber Indigo", desc: "Indigo Cultural Oasis" },
    { id: "turquoise_sea", name: "Turquoise Sea", desc: "Coastal Refreshing Teal" },
    { id: "moorish_emerald", name: "Moorish Emerald", desc: "Royal Algiers Green" },
    { id: "sunset_rose", name: "Sunset Rose", desc: "Romantic Rose Blossom" },
    { id: "cyber_kasbah", name: "Cyber Kasbah", desc: "Retro-Futuristic Neon" },
    { id: "slate_noir", name: "Slate Noir", desc: "Premium Deep Charcoal" },
    { id: "terracotta", name: "Terracotta", desc: "Warm Clay & Earthen Tones" },
    { id: "velvet_crimson", name: "Velvet Crimson", desc: "Luxury Saturated Wine" },
    { id: "classic", name: "Classic Minimal", desc: "Traditional dark format" },
    { id: "mysticflower", name: "Mystic Flower", desc: "Symmetrical Botanical Layout" },
    { id: "gaming", name: "Gaming Oasis", desc: "Pixel Arcade Retro Vibe" },
    { id: "my_brand", name: "My Brand (Customizer)", desc: "Logo Centric Layout" },
  ];

  const fontFamilies = [
    { value: "inherit", label: "Default (System Sans)" },
    { value: "'Inter', sans-serif", label: "Inter (Modern Clean)" },
    { value: "'Space Grotesk', sans-serif", label: "Space Grotesk (Tech Forward)" },
    { value: "'Outfit', sans-serif", label: "Outfit (Premium Minimalist)" },
    { value: "'Playfair Display', serif", label: "Playfair Display (Elegant Serif)" },
    { value: "'JetBrains Mono', monospace", label: "JetBrains Mono (Technical Mono)" },
    { value: "'Cinzel', serif", label: "Cinzel (Traditional Moorish Craft)" },
  ];

  const accentPresets = [
    { hex: "#0071e3", label: "Apple Blue" },
    { hex: "#34c759", label: "Apple Green" },
    { hex: "#ff3b30", label: "Apple Red" },
    { hex: "#ff9500", label: "Apple Orange" },
    { hex: "#af52de", label: "Apple Purple" },
    { hex: "#5856d6", label: "Apple Indigo" },
    { hex: "#00c7be", label: "Apple Teal" },
    { hex: "#1c1c1e", label: "Apple Dark" },
  ];

  const bgPatterns = [
    { id: "white", label: "Default Background" },
    { id: "linen", label: "Linen Texture" },
    { id: "grid", label: "Technical Grid" },
    { id: "dunes", label: "Sahara Dunes" },
    { id: "mosaic", label: "Andalusia Mosaic" },
    { id: "pastel", label: "Soft Pastel Gradient" },
  ];

  const borderStyles = [
    { value: "solid", label: "Solid" },
    { value: "dashed", label: "Dashed" },
    { value: "dotted", label: "Dotted" },
    { value: "double", label: "Double" },
    { value: "none", label: "None" },
  ];

  const borderWidths = [
    { value: "0px", label: "None (0px)" },
    { value: "1px", label: "Thin (1px)" },
    { value: "2px", label: "Standard (2px)" },
    { value: "4px", label: "Medium (4px)" },
    { value: "6px", label: "Thick (6px)" },
    { value: "8px", label: "Ultra (8px)" },
  ];

  const borderRadiusOptions = [
    { value: "none", label: "Sharp Rectangle" },
    { value: "md", label: "Slightly Rounded (md)" },
    { value: "xl", label: "Medium Rounded (xl)" },
    { value: "2xl", label: "Thick Rounded (2xl)" },
    { value: "3xl", label: "Extra Circular (3xl)" },
    { value: "9999px", label: "Pill Shape" },
  ];

  const fontSizes = [
    { value: "compact", label: "Compact" },
    { value: "medium", label: "Standard" },
    { value: "large", label: "Large" },
    { value: "supreme", label: "Supreme Bold" },
  ];

  const bodySizes = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Standard" },
    { value: "large", label: "Large" },
  ];

  return (
    <div 
      className="fixed top-20 right-4 bottom-4 w-96 max-w-[calc(100vw-2rem)] bg-white/80 dark:bg-[#1c1c1e]/85 border border-black/[0.08] dark:border-white/[0.12] rounded-[28px] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-2xl backdrop-saturate-150 text-left flex flex-col z-[100] overflow-hidden select-text animate-fade-in font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',system-ui,sans-serif]"
      id="merchant-live-customizer-drawer"
    >
      {/* Apple-style Header Bar */}
      <div className="px-4 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08] bg-slate-100/50 dark:bg-white/[0.03] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0071e3]/10 dark:bg-[#0071e3]/20 border border-[#0071e3]/20 text-[#0071e3] dark:text-[#3898ec] flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 stroke-[1.8]" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-slate-900 dark:text-white tracking-tight">
              {currentLanguage === "ar" ? "لوحة التعديل المباشر" : currentLanguage === "fr" ? "Design en direct" : "Live Page Editor"}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal tracking-tight">
              {currentLanguage === "ar" ? "عدّل المظهر مباشرة على المتجر" : currentLanguage === "fr" ? "Visualisez vos modifications en temps réel" : "Tweak styles and preview instantly"}
            </p>
          </div>
        </div>
        <button 
          type="button"
          onClick={onCancel}
          className="w-7 h-7 rounded-full bg-slate-200/70 hover:bg-slate-300/80 active:scale-95 dark:bg-white/10 dark:hover:bg-white/20 text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
          title="Close Editor"
        >
          <X className="w-3.5 h-3.5 stroke-[2]" />
        </button>
      </div>

      {/* Apple-style Segmented Navigation Tabs */}
      <div className="bg-slate-200/70 dark:bg-black/40 p-1 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-md flex gap-1 mx-3.5 mt-3 mb-2 shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
        {[
          { id: "design", label: currentLanguage === "ar" ? "المظهر" : currentLanguage === "fr" ? "Modèle" : "Theme", icon: Palette },
          { id: "products", label: currentLanguage === "ar" ? "المنتجات" : currentLanguage === "fr" ? "Produits" : "Products", icon: Layout },
          { id: "fonts", label: currentLanguage === "ar" ? "الخطوط" : currentLanguage === "fr" ? "Polices" : "Fonts", icon: Type },
          { id: "glass", label: currentLanguage === "ar" ? "الزجاج" : currentLanguage === "fr" ? "Effets" : "Glass", icon: Sliders },
          { id: "text", label: currentLanguage === "ar" ? "النصوص" : currentLanguage === "fr" ? "Identité" : "Texts", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center gap-1 py-1.5 text-[10.5px] rounded-xl transition-all cursor-pointer select-none ${
                isActive 
                  ? "bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-[0_2px_6px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] font-semibold scale-[1.02]" 
                  : "text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05] font-medium"
              }`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[1.8]" />
              <span className="leading-none tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Form Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 no-scrollbar">

        {activeTab === "design" && (
          <div className="space-y-4">
            {/* Cover Template Selection */}
            <div className="space-y-1.5">
              <label className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 tracking-tight block">Cover Template / Layout Model</label>
              <div className="grid grid-cols-1 gap-2">
                <select
                  value={design.coverTemplate || "toonhub"}
                  onChange={(e) => onUpdateSetting("coverTemplate", e.target.value)}
                  className="w-full text-xs font-medium p-2.5 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 border border-black/10 dark:border-white/15 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all cursor-pointer shadow-xs"
                >
                  {coverTemplatesList.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                      {tmpl.name} — {tmpl.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Accent Color Customizer */}
            <div className="space-y-1.5">
              <label className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 tracking-tight block">Accent Boutique Color</label>
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-100/70 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl shadow-xs">
                {accentPresets.map((preset) => {
                  const isSelected = design.accentColor === preset.hex;
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => onUpdateSetting("accentColor", preset.hex)}
                      className={`w-7 h-7 rounded-full relative border border-black/10 dark:border-white/20 flex items-center justify-center cursor-pointer transition-all transform active:scale-95 shadow-xs ${
                        isSelected ? "ring-2 ring-[#0071e3] ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-md scale-105" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: preset.hex }}
                      title={preset.label}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                    </button>
                  );
                })}
                <div className="flex items-center gap-1.5 ml-auto">
                  <input
                    type="color"
                    value={design.accentColor || "#0071e3"}
                    onChange={(e) => onUpdateSetting("accentColor", e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={design.accentColor || "#0071e3"}
                    onChange={(e) => onUpdateSetting("accentColor", e.target.value)}
                    className="bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono rounded-xl p-1.5 w-20 uppercase focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Layout Width */}
            <div className="space-y-1.5">
              <label className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 tracking-tight block">Boutique Layout Width</label>
              <div className="bg-slate-200/70 dark:bg-black/35 p-1 rounded-xl border border-black/5 dark:border-white/10 grid grid-cols-3 gap-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
                {[
                  { id: "medium", label: "Medium (4xl)" },
                  { id: "large", label: "Wide (1800px)" },
                  { id: "full", label: "Ultra (96vw)" },
                ].map((item) => {
                  const isSelected = (design.width || "large") === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onUpdateSetting("width", item.id)}
                      className={`py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium select-none ${
                        isSelected 
                          ? "bg-white dark:bg-white/20 text-slate-900 dark:text-white font-semibold shadow-xs" 
                          : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frame Background Pattern */}
            <div className="space-y-1.5">
              <label className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 tracking-tight block">Background Wallpaper Pattern</label>
              <select
                value={design.profileBgStyle || "white"}
                onChange={(e) => onUpdateSetting("profileBgStyle", e.target.value)}
                className="w-full text-xs font-medium p-2.5 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 border border-black/10 dark:border-white/15 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all cursor-pointer shadow-xs"
              >
                {bgPatterns.map((pat) => (
                  <option key={pat.id} value={pat.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                    {pat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Products Grid Shortcut */}
            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-white block">
                  {currentLanguage === "ar" ? "شبكة المنتجات" : currentLanguage === "fr" ? "Grille de produits" : "Products Grid"}
                </span>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  {currentProductsPerRow} {currentLanguage === "ar" ? "في الصف" : "per row"} • {currentCardSpacing === "compact" ? (currentLanguage === "ar" ? "مدمج" : "Compact") : currentCardSpacing === "normal" ? (currentLanguage === "ar" ? "عادي" : "Normal") : (currentLanguage === "ar" ? "واسع" : "Spacious")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer transition-all active:scale-95"
                style={{ backgroundColor: design.accentColor || "#0071e3" }}
              >
                {currentLanguage === "ar" ? "تعديل الشبكة" : currentLanguage === "fr" ? "Personnaliser" : "Customize"}
              </button>
            </div>

            {/* My Brand Special Layout Customizer Panel */}
            {design.coverTemplate === "my_brand" && (
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3 shadow-xs">
                <span className="text-[11px] font-bold text-[#0071e3] dark:text-[#3898ec] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0071e3] dark:text-[#3898ec]" />
                  My Brand Center Layout Controls
                </span>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Center Asset Sizing / Spacing</span>
                    <span className="font-mono text-[#0071e3] dark:text-[#3898ec] font-bold">{design.myBrandSpacing || 40}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={design.myBrandSpacing || 40}
                    onChange={(e) => onUpdateSetting("myBrandSpacing", Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#0071e3] dark:accent-[#3898ec]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block">Shadow Glow Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={design.myBrandShadowColor || "#000000"}
                      onChange={(e) => onUpdateSetting("myBrandShadowColor", e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={design.myBrandShadowColor || "#000000"}
                      onChange={(e) => onUpdateSetting("myBrandShadowColor", e.target.value)}
                      className="bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 text-[11px] text-slate-900 dark:text-slate-200 font-mono uppercase p-1.5 rounded-xl w-20 shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Shadow Blur Intensity</span>
                    <span className="font-mono text-[#0071e3] dark:text-[#3898ec] font-bold">{design.myBrandShadowIntensity !== undefined ? design.myBrandShadowIntensity : 10}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={design.myBrandShadowIntensity !== undefined ? design.myBrandShadowIntensity : 10}
                    onChange={(e) => onUpdateSetting("myBrandShadowIntensity", Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#0071e3] dark:accent-[#3898ec]"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Shadow Opacity Strength</span>
                    <span className="font-mono text-[#0071e3] dark:text-[#3898ec] font-bold">{design.myBrandShadowOpacity !== undefined ? design.myBrandShadowOpacity : 50}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={design.myBrandShadowOpacity !== undefined ? design.myBrandShadowOpacity : 50}
                    onChange={(e) => onUpdateSetting("myBrandShadowOpacity", Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#0071e3] dark:accent-[#3898ec]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 w-full">
                  <label 
                    htmlFor="mybrand-live-shadow-border-checkbox"
                    className="text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none"
                  >
                    Live Shadow Preview border outline
                  </label>
                  <SkeuomorphicSwitch
                    id="mybrand-live-shadow-border-checkbox"
                    checked={design.myBrandShadowPreviewBorder || false}
                    onChange={(val) => onUpdateSetting("myBrandShadowPreviewBorder", val)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div className="space-y-4 fade-in">
            {/* Segmented Switcher: Products vs Reels */}
            <div className="flex bg-slate-200/70 dark:bg-black/40 p-1 rounded-xl border border-black/5 dark:border-white/5 gap-1 select-none">
              <button
                type="button"
                onClick={() => setActiveGridSubTab("products")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-bold ${
                  activeGridSubTab === "products"
                    ? "bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-xs scale-[1.01]"
                    : "text-slate-500 dark:text-white/60 hover:text-slate-800"
                }`}
              >
                <Layout className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>{currentLanguage === "ar" ? "شبكة المنتجات" : currentLanguage === "fr" ? "Grille de produits" : "Products Grid"}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGridSubTab("reels")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-bold ${
                  activeGridSubTab === "reels"
                    ? "bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-xs scale-[1.01]"
                    : "text-slate-500 dark:text-white/60 hover:text-slate-800"
                }`}
              >
                <Film className="w-3.5 h-3.5 text-purple-500" />
                <span>{currentLanguage === "ar" ? "شبكة الريلز" : currentLanguage === "fr" ? "Grille de Reels" : "Reels Grid"}</span>
              </button>
            </div>

            {activeGridSubTab === "products" ? (
              <ProductsGridSettings
                compactMode={true}
                productsPerRow={currentProductsPerRow}
                onChangeProductsPerRow={(cols) => {
                  const mappedMinWidth = cols === 2 ? "380px" : cols === 3 ? "280px" : cols === 4 ? "200px" : "160px";
                  onUpdateSetting("gridCardMinWidth", mappedMinWidth);
                  onUpdateSetting("productsPerRow", cols);
                }}
                cardSpacing={currentCardSpacing}
                onChangeCardSpacing={(spacing) => {
                  const mappedGap = spacing === "compact" ? "10px" : spacing === "normal" ? "18px" : "28px";
                  onUpdateSetting("gridCardGap", mappedGap);
                  onUpdateSetting("cardSpacing", spacing);
                }}
                accentColor={design.accentColor || "#0071e3"}
                currentLanguage={currentLanguage}
                showLivePreview={true}
                permitBuyerModifications={design.permitBuyerModifications}
                onTogglePermitBuyerModifications={(val) => onUpdateSetting("permitBuyerModifications", val)}
              />
            ) : (
              <ReelsGridSettings
                compactMode={true}
                reelsPerRow={currentReelsPerRow}
                onChangeReelsPerRow={(cols) => {
                  const mappedMinWidth = cols === 2 ? "260px" : cols === 3 ? "200px" : cols === 4 ? "160px" : "130px";
                  onUpdateSetting("reelsGridCardMinWidth", mappedMinWidth);
                  onUpdateSetting("reelsPerRow", cols);
                }}
                cardSpacing={currentReelsCardSpacing}
                onChangeCardSpacing={(spacing) => {
                  const mappedGap = spacing === "compact" ? "8px" : spacing === "normal" ? "14px" : "22px";
                  onUpdateSetting("reelsGridCardGap", mappedGap);
                  onUpdateSetting("reelsCardSpacing", spacing);
                }}
                accentColor="#8b5cf6"
                currentLanguage={currentLanguage}
                showLivePreview={true}
                permitBuyerModifications={design.permitBuyerModifications}
                onTogglePermitBuyerModifications={(val) => onUpdateSetting("permitBuyerModifications", val)}
              />
            )}
          </div>
        )}

        {activeTab === "fonts" && (
          <div className="space-y-4">
            {/* Font Family selection */}
            <div className="space-y-1.5">
              <label className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 tracking-tight block">Typography Font Family</label>
              <select
                value={design.fontFamily || "inherit"}
                onChange={(e) => onUpdateSetting("fontFamily", e.target.value)}
                className="w-full text-xs font-medium p-2.5 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 border border-black/10 dark:border-white/15 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all cursor-pointer shadow-xs"
              >
                {fontFamilies.map((font) => (
                  <option key={font.value} value={font.value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Title Configuration */}
            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3 text-left shadow-xs">
              <span className="text-xs font-semibold text-slate-900 dark:text-white/90 flex items-center gap-1.5">
                <FontIcon className="w-3.5 h-3.5 text-[#0071e3] dark:text-[#3898ec]" />
                Storefront Titles & Headings
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-white/60 block">Title Size</span>
                  <select
                    value={design.titleFontSize || "large"}
                    onChange={(e) => onUpdateSetting("titleFontSize", e.target.value)}
                    className="w-full text-xs font-medium p-2 bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 text-slate-900 dark:text-white rounded-xl shadow-xs"
                  >
                    {fontSizes.map((sz) => (
                      <option key={sz.value} value={sz.value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">{sz.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-white/60 block">Title Weight</span>
                  <select
                    value={design.titleFontWeight || "800"}
                    onChange={(e) => onUpdateSetting("titleFontWeight", e.target.value)}
                    className="w-full text-xs font-medium p-2 bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 text-slate-900 dark:text-white rounded-xl shadow-xs"
                  >
                    <option value="400" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Regular (400)</option>
                    <option value="500" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Medium (500)</option>
                    <option value="600" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Semibold (600)</option>
                    <option value="700" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Bold (700)</option>
                    <option value="800" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Extra Bold (800)</option>
                    <option value="950" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Black Heavy (950)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-600 dark:text-white/60 block">Title Font Style</span>
                <select
                  value={design.titleFontStyle || "normal"}
                  onChange={(e) => onUpdateSetting("titleFontStyle", e.target.value)}
                  className="w-full text-xs font-medium p-2 bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 text-slate-900 dark:text-white rounded-xl shadow-xs"
                >
                  <option value="normal" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Upright / Normal</option>
                  <option value="italic" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Elegant Italic</option>
                  <option value="oblique" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Slanted Modern</option>
                </select>
              </div>
            </div>

            {/* Body Content Typography */}
            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3 text-left shadow-xs">
              <span className="text-xs font-semibold text-slate-900 dark:text-white/90 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-[#0071e3] dark:text-[#3898ec]" />
                Storefront Body Texts
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-white/60 block">Body Size</span>
                  <select
                    value={design.bodyFontSize || "medium"}
                    onChange={(e) => onUpdateSetting("bodyFontSize", e.target.value)}
                    className="w-full text-xs font-medium p-2 bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 text-slate-900 dark:text-white rounded-xl shadow-xs"
                  >
                    {bodySizes.map((sz) => (
                      <option key={sz.value} value={sz.value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">{sz.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-white/60 block">Body Style</span>
                  <select
                    value={design.bodyFontStyle || "italic"}
                    onChange={(e) => onUpdateSetting("bodyFontStyle", e.target.value)}
                    className="w-full text-xs font-medium p-2 bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 text-slate-900 dark:text-white rounded-xl shadow-xs"
                  >
                    <option value="normal" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Normal</option>
                    <option value="italic" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Italic Quotes</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "glass" && (
          <div className="space-y-4">
            {/* Storefront Profile Glass Bar Customizer (Glassmorphism Style) */}
            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3.5 text-left shadow-xs">
              <span className="text-xs font-semibold text-slate-900 dark:text-white/90 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0071e3] dark:text-[#3898ec]" />
                Storefront Profile Glass Bar (Glassmorphism Style)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-white/50 leading-relaxed">
                Tweak the backdrop-filter blur and transparency of the main glass bar from 0% (Pure Transparency) to 100% (Standard Solid Color).
              </p>

              {/* Glass Blur Amount Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600 dark:text-white/80 font-medium">Glass Bar Blur Intensity</span>
                  <span className="font-mono text-[#34c759] font-bold bg-[#34c759]/10 px-2 py-0.5 rounded-full">
                    {design.glassBarBlur !== undefined ? design.glassBarBlur : 28}px 
                    {(design.glassBarBlur === 24 || design.glassBarBlur === 28) && " (Standard Glass)"}
                    {design.glassBarBlur === 0 && " (0° Clear)"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={design.glassBarBlur !== undefined ? design.glassBarBlur : 28}
                  onChange={(e) => onUpdateSetting("glassBarBlur", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#34c759]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-white/40 font-medium">
                  <span>0 (Clear Flat)</span>
                  <span>28 (Glass Blur)</span>
                  <span>40 (Max Frost)</span>
                </div>
              </div>

              {/* Glass Transparency/Opacity Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600 dark:text-white/80 font-medium">Glass Transparency</span>
                  <span className="font-mono text-[#34c759] font-bold bg-[#34c759]/10 px-2 py-0.5 rounded-full">
                    {design.glassBarOpacity !== undefined ? design.glassBarOpacity : 18}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={design.glassBarOpacity !== undefined ? design.glassBarOpacity : 18}
                  onChange={(e) => onUpdateSetting("glassBarOpacity", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#34c759]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-white/40 font-medium">
                  <span>0% (Pure Transparent Glass)</span>
                  <span>18% (High Transparency)</span>
                  <span>100% (Standard Solid Color)</span>
                </div>
              </div>

              {/* Glass Bar Tint Colors Preset Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-medium text-slate-600 dark:text-white/60 block">Glass Tint Color Presets</span>
                <div className="grid grid-cols-7 gap-1.5">
                  {[
                    { hex: "#ffffff", label: "iOS Alabaster (Light)" },
                    { hex: "#0f172a", label: "iOS Obsidian (Dark)" },
                    { hex: "#047857", label: "Mint Glass" },
                    { hex: "#0284c7", label: "Sea Glass" },
                    { hex: "#7c3aed", label: "Amethyst Glass" },
                    { hex: "#f43f5e", label: "Rose Glass" },
                    { hex: "#d97706", label: "Sahara Gold" },
                  ].map((color) => {
                    const isSelected = (design.glassBarColor || (darkMode ? "#0f172a" : "#ffffff")) === color.hex;
                    return (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => onUpdateSetting("glassBarColor", color.hex)}
                        className={`w-7 h-7 rounded-full border border-black/10 dark:border-white/20 flex items-center justify-center transition-all duration-200 transform active:scale-90 relative cursor-pointer shadow-xs ${
                          isSelected ? "ring-2 ring-[#0071e3] ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-105 shadow-sm" : "opacity-80 hover:opacity-100 hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.label}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Direct Color Picker */}
                <div className="flex items-center gap-2 pt-1.5">
                  <input
                    type="color"
                    value={design.glassBarColor || (darkMode ? "#0f172a" : "#ffffff")}
                    onChange={(e) => onUpdateSetting("glassBarColor", e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={design.glassBarColor || (darkMode ? "#0f172a" : "#ffffff")}
                    onChange={(e) => onUpdateSetting("glassBarColor", e.target.value)}
                    placeholder="#ffffff"
                    className="bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono uppercase p-2 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Glassmorphism settings */}
            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white/90 block">Glassmorphism Frosted Panels</span>
                <SkeuomorphicSwitch
                  checked={design.glassBlurEnabled !== false}
                  onChange={(val) => onUpdateSetting("glassBlurEnabled", val)}
                />
              </div>

              {(design.glassBlurEnabled !== false) && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-white/80 font-medium">Glass Frosted Blur Amount</span>
                      <span className="font-mono text-[#34c759] font-bold bg-[#34c759]/10 px-2 py-0.5 rounded-full">{design.glassBlurAmount !== undefined ? design.glassBlurAmount : 12}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={design.glassBlurAmount !== undefined ? design.glassBlurAmount : 12}
                      onChange={(e) => onUpdateSetting("glassBlurAmount", Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#34c759]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-white/80 font-medium">Glass Transparency Opacity</span>
                      <span className="font-mono text-[#34c759] font-bold bg-[#34c759]/10 px-2 py-0.5 rounded-full">{design.glassTransparency !== undefined ? design.glassTransparency : 40}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={design.glassTransparency !== undefined ? design.glassTransparency : 40}
                      onChange={(e) => onUpdateSetting("glassTransparency", Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#34c759]"
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-600 dark:text-white/70">Ambient Glowing Bubbles (Multi-color background)</span>
                      <SkeuomorphicSwitch
                        checked={design.glassMultiColorEnabled !== false}
                        onChange={(val) => onUpdateSetting("glassMultiColorEnabled", val)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Frame Borders & Layout Styling */}
            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3 text-left shadow-xs">
              <span className="text-xs font-semibold text-slate-900 dark:text-white/90 block">Borders & Containers Outline</span>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-600 dark:text-white/60 block">Border Style</span>
                <select
                  value={design.borderStyle || "solid"}
                  onChange={(e) => onUpdateSetting("borderStyle", e.target.value)}
                  className="w-full text-xs font-medium p-2 bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 text-slate-900 dark:text-white rounded-xl cursor-pointer shadow-xs"
                >
                  {borderStyles.map((item) => (
                    <option key={item.value} value={item.value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">{item.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-white/60 block">Border Thickness</span>
                  <select
                    value={design.borderWidth || "4px"}
                    onChange={(e) => onUpdateSetting("borderWidth", e.target.value)}
                    className="w-full text-xs font-medium p-2 bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 text-slate-900 dark:text-white rounded-xl cursor-pointer shadow-xs"
                  >
                    {borderWidths.map((item) => (
                      <option key={item.value} value={item.value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">{item.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-white/60 block">Border Roundedness</span>
                  <select
                    value={design.borderRadius || "2xl"}
                    onChange={(e) => onUpdateSetting("borderRadius", e.target.value)}
                    className="w-full text-xs font-medium p-2 bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 text-slate-900 dark:text-white rounded-xl cursor-pointer shadow-xs"
                  >
                    {borderRadiusOptions.map((item) => (
                      <option key={item.value} value={item.value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">{item.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-600 dark:text-white/60 block">Border Accent Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={design.borderColor || "#ffffff20"}
                    onChange={(e) => onUpdateSetting("borderColor", e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={design.borderColor || "#ffffff20"}
                    onChange={(e) => onUpdateSetting("borderColor", e.target.value)}
                    className="bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono uppercase p-2 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 shadow-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "text" && (
          <div className="space-y-4">
            {/* Storefront Text Settings */}
            <div className="space-y-1.5">
              <label className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 tracking-tight block">Boutique Store Name</label>
              <input
                type="text"
                value={selectedStore.name}
                onChange={(e) => onUpdateSetting("name", e.target.value, true)}
                className="w-full text-xs font-medium p-2.5 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 border border-black/10 dark:border-white/15 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all shadow-xs"
                placeholder="Store Name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 tracking-tight block font-sans">Boutique Short Description / Bio</label>
              <textarea
                value={selectedStore.description}
                onChange={(e) => onUpdateSetting("description", e.target.value, true)}
                rows={3}
                className="w-full text-xs font-medium p-2.5 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 border border-black/10 dark:border-white/15 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] resize-none transition-all shadow-xs"
                placeholder="Write a charming store description..."
              />
            </div>

            {/* Announcement Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3 text-left shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white/90 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-[#0071e3] dark:text-[#3898ec]" />
                  Announcement Banner
                </span>
                <SkeuomorphicSwitch
                  checked={selectedStore.announcement?.enabled !== false}
                  onChange={(val) => {
                    const currentAnn = selectedStore.announcement || { text: "", bgColor: "#eab308", textColor: "#020617", expiresAt: "" };
                    onUpdateSetting("announcement", { ...currentAnn, enabled: val }, true);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-slate-600 dark:text-white/60 block">Banner Announcement Text</span>
                <textarea
                  value={selectedStore.announcement?.text || ""}
                  onChange={(e) => {
                    const currentAnn = selectedStore.announcement || { enabled: true, bgColor: "#eab308", textColor: "#020617", expiresAt: "" };
                    onUpdateSetting("announcement", { ...currentAnn, text: e.target.value }, true);
                  }}
                  rows={2}
                  className="w-full text-xs font-medium p-2.5 bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 text-slate-900 dark:text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 shadow-xs"
                  placeholder="E.g., Free delivery to Algiers this weekend! 🎉"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-white/60 block">Banner Background</span>
                  <input
                    type="color"
                    value={selectedStore.announcement?.bgColor || "#eab308"}
                    onChange={(e) => {
                      const currentAnn = selectedStore.announcement || { active: true, text: "", textColor: "#020617" };
                      onUpdateSetting("announcement", { ...currentAnn, bgColor: e.target.value }, true);
                    }}
                    className="w-full h-8 rounded-xl cursor-pointer bg-transparent border border-black/10 dark:border-white/15 p-1"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-white/60 block">Banner Text Color</span>
                  <input
                    type="color"
                    value={selectedStore.announcement?.textColor || "#020617"}
                    onChange={(e) => {
                      const currentAnn = selectedStore.announcement || { active: true, text: "", bgColor: "#eab308" };
                      onUpdateSetting("announcement", { ...currentAnn, textColor: e.target.value }, true);
                    }}
                    className="w-full h-8 rounded-xl cursor-pointer bg-transparent border border-black/10 dark:border-white/15 p-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Persistence Action Bar Footer */}
      <div className="p-3.5 border-t border-black/[0.06] dark:border-white/10 bg-slate-100/70 dark:bg-black/35 backdrop-blur-xl flex items-center justify-between gap-2.5 shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.03)]">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 flex-1 bg-slate-200/70 hover:bg-slate-300/80 active:scale-95 dark:bg-white/10 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 text-slate-700 dark:text-white/90 font-medium text-xs rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs select-none"
        >
          <RotateCcw className="w-3.5 h-3.5 stroke-[2]" />
          <span>{currentLanguage === "ar" ? "تراجع" : currentLanguage === "fr" ? "Annuler" : "Cancel"}</span>
        </button>

        <button
          type="button"
          onClick={onSave}
          className="h-9 flex-1 bg-[#34c759] hover:bg-[#30b753] active:scale-95 border border-white/20 text-white font-semibold text-xs rounded-full flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(52,199,89,0.35),inset_0_1px_0_0_rgba(255,255,255,0.3)] transition-all cursor-pointer select-none"
        >
          <Save className="w-3.5 h-3.5 stroke-[2]" />
          <span>{currentLanguage === "ar" ? "حفظ التعديلات" : currentLanguage === "fr" ? "Enregistrer" : "Save Changes"}</span>
        </button>
      </div>
    </div>
  );
}
