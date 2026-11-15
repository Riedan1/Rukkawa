import React from "react";
import { GlossyFlameIcon } from "./FlashSaleCountdownTimer";
import { Check, Tag, Sparkles, Zap, ShieldCheck } from "lucide-react";

export type PromoOfferStyle = "style_1" | "style_2" | "style_3";

export interface PromoOfferStyleOption {
  id: PromoOfferStyle;
  label: string;
  shortLabel: string;
  description: string;
}

export const PROMO_OFFER_STYLES: PromoOfferStyleOption[] = [
  {
    id: "style_1",
    label: "STYLE 1: MINIMAL LUXURY",
    shortLabel: "Minimal Luxury",
    description: "Refined editorial typography, deep wine accents, and quiet savings badge",
  },
  {
    id: "style_2",
    label: "STYLE 2: GLOWING PILL TAG",
    shortLabel: "Glowing Pill Tag",
    description: "Warm radiant borders, high-conversion deal pill, and vivid savings highlight",
  },
  {
    id: "style_3",
    label: "STYLE 3: SLEEK GLASSMORPHISM",
    shortLabel: "Sleek Glassmorphism",
    description: "Frosted translucent glass card with glossy depth and modern pill cards",
  },
];

export interface PromoOfferCardProps {
  styleVariant: PromoOfferStyle;
  originalPrice: number;
  discountPercent: number;
  currency?: string;
  className?: string;
  isCompact?: boolean;
}

export const PromoOfferCard: React.FC<PromoOfferCardProps> = ({
  styleVariant,
  originalPrice,
  discountPercent,
  currency = "DZD",
  className = "",
  isCompact = false,
}) => {
  const safeOriginal = Math.max(0, originalPrice || 0);
  const safePercent = Math.max(1, Math.min(95, discountPercent || 15));
  const savings = Math.round((safeOriginal * safePercent) / 100);
  const finalPrice = Math.max(0, safeOriginal - savings);

  // STYLE 1: MINIMAL LUXURY (EDITORIAL ACCENT)
  if (styleVariant === "style_1") {
    return (
      <div
        className={`w-full rounded-2xl bg-white border border-[#e8dfe3] p-3 sm:p-4 shadow-[0_2px_12px_rgba(74,14,46,0.04)] transition-all ${className}`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#f3edf0] pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <GlossyFlameIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.08em] uppercase text-[#4A0E2E]">
              PROMOTIONAL OFFER
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-white bg-[#4A0E2E] px-2 py-0.5 rounded-full font-mono shadow-xs">
            -{safePercent}% OFF
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-2xl font-black text-stone-900 font-mono tracking-tight">
              {finalPrice.toLocaleString()}{" "}
              <span className="text-xs sm:text-sm font-bold text-stone-500">{currency}</span>
            </span>
            <span className="text-xs sm:text-sm font-semibold text-stone-400 line-through font-mono">
              {safeOriginal.toLocaleString()} {currency}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 font-mono">
              Save {savings.toLocaleString()} {currency}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // STYLE 2: GLOWING PILL TAG (MODERN HIGH-CONVERSION)
  if (styleVariant === "style_2") {
    return (
      <div
        className={`w-full rounded-2xl bg-gradient-to-r from-[#FFF5F6] via-[#FFF8F8] to-[#FFF0F2] border-2 border-[#F2A8B5] p-3 sm:p-4 shadow-[0_4px_18px_rgba(230,104,27,0.12)] transition-all ${className}`}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="inline-flex items-center gap-1.5 bg-[#4A0E2E] text-white px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-xs">
            <GlossyFlameIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="tracking-wide">SPECIAL PROMO DEAL</span>
            <span className="bg-[#E6681B] text-white px-1.5 py-0.2 rounded-full font-mono text-[9px] sm:text-[10px] ml-0.5">
              -{safePercent}%
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#E6681B] font-mono flex items-center gap-1">
            <Zap className="w-3 h-3 fill-current" /> Instant Markdown
          </span>
        </div>

        <div className="bg-white/95 rounded-xl p-2.5 sm:p-3 border border-[#F5CED6] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-2xl font-black text-[#4A0E2E] font-mono">
              {finalPrice.toLocaleString()}{" "}
              <span className="text-xs sm:text-sm font-bold text-[#8B264E]">{currency}</span>
            </span>
            <span className="text-xs sm:text-sm font-semibold text-stone-400 line-through font-mono">
              {safeOriginal.toLocaleString()} {currency}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg font-mono">
            <span>YOU SAVE:</span>
            <span>-{savings.toLocaleString()} {currency}</span>
          </div>
        </div>
      </div>
    );
  }

  // STYLE 3: SLEEK GLASSMORPHISM (FROSTED DEAL CARD)
  return (
    <div
      className={`w-full rounded-2xl relative overflow-hidden backdrop-blur-md bg-gradient-to-r from-white/80 via-[#FAF4F6]/70 to-white/80 border border-[#E6D0DA] p-3 sm:p-4 shadow-[0_8px_24px_rgba(74,14,46,0.07)] transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <GlossyFlameIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="text-[11px] sm:text-xs font-black tracking-[0.06em] text-[#4A0E2E] uppercase">
            OFFER DISCOUNT APPLIED
          </span>
        </div>
        <div className="backdrop-blur-sm bg-white/90 border border-white/80 shadow-2xs px-2.5 py-0.5 rounded-full font-mono font-bold text-xs text-[#8B264E]">
          -{safePercent}%
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 border border-white/90 shadow-2xs flex flex-col justify-center">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
            Original Price
          </span>
          <span className="text-xs sm:text-sm font-bold text-stone-400 line-through font-mono">
            {safeOriginal.toLocaleString()} {currency}
          </span>
        </div>

        <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-white/95 to-[#FFF7FA]/95 border border-[#F2D7E2] shadow-2xs flex flex-col justify-center">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold text-[#4A0E2E] uppercase tracking-wider">
              Final Offer Price
            </span>
            <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono">
              Save {savings.toLocaleString()} {currency}
            </span>
          </div>
          <span className="text-base sm:text-xl font-black text-[#4A0E2E] font-mono tracking-tight">
            {finalPrice.toLocaleString()} <span className="text-xs font-bold text-stone-600">{currency}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export interface PromoOfferStyleSelectorProps {
  selectedStyle: PromoOfferStyle;
  onSelectStyle: (style: PromoOfferStyle) => void;
  originalPrice: number;
  discountPercent: number;
  currency?: string;
  compact?: boolean;
}

export const PromoOfferStyleSelector: React.FC<PromoOfferStyleSelectorProps> = ({
  selectedStyle,
  onSelectStyle,
  originalPrice,
  discountPercent,
  currency = "DZD",
  compact = false,
}) => {
  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-[#f7f3f5] border border-[#e8dfe3] space-y-4">
      <div className="text-center space-y-1">
        <h4 className="text-sm sm:text-base font-bold tracking-[0.06em] uppercase text-[#4A0E2E]">
          PROMO OFFER STYLES
        </h4>
        <p className="text-[11px] text-stone-500">
          Choose from 3 promotional offer designs to display your discounted pricing
        </p>
      </div>

      <div className="space-y-3.5">
        {PROMO_OFFER_STYLES.map((item) => {
          const isSelected = selectedStyle === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectStyle(item.id)}
              className={`w-full text-left rounded-2xl p-3 transition-all cursor-pointer border-2 ${
                isSelected
                  ? "bg-white/95 border-[#4A0E2E] shadow-[0_6px_20px_rgba(74,14,46,0.12)] ring-2 ring-[#4A0E2E]/15"
                  : "bg-white/50 border-transparent hover:bg-white/80 hover:border-[#4A0E2E]/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] sm:text-xs font-bold tracking-[0.05em] uppercase text-stone-800">
                    {item.label}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 ${
                    isSelected
                      ? "bg-[#4A0E2E] text-white"
                      : "bg-stone-200/70 text-stone-600"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  {isSelected ? "Active Style" : "Select Style"}
                </span>
              </div>

              <PromoOfferCard
                styleVariant={item.id}
                originalPrice={originalPrice}
                discountPercent={discountPercent}
                currency={currency}
                isCompact={compact}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
