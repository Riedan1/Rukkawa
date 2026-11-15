import React from "react";

export type FlashSaleTimerStyle =
  | "style_1"
  | "style_2"
  | "style_3"
  | "style_4"
  | "style_5";

export const FLASH_SALE_TIMER_STYLES: Array<{
  id: FlashSaleTimerStyle;
  label: string;
  shortLabel: string;
}> = [
  {
    id: "style_1",
    label: "Style 1 (Minimal Luxury)",
    shortLabel: "Style 1",
  },
  {
    id: "style_5",
    label: "Style 2 (Sleek Glassmorphism)",
    shortLabel: "Style 2",
  },
];

export const GlossyFlameIcon: React.FC<{ className?: string }> = ({
  className = "w-6 h-6",
}) => {
  const uniqueId = React.useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 36 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`flameOuter-${uniqueId}`}
          x1="18"
          y1="2"
          x2="18"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#B83B14" />
          <stop offset="35%" stopColor="#E6681B" />
          <stop offset="75%" stopColor="#F59E2D" />
          <stop offset="100%" stopColor="#FACC48" />
        </linearGradient>
        <linearGradient
          id={`flameMid-${uniqueId}`}
          x1="18"
          y1="10"
          x2="18"
          y2="39"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#F27A21" />
          <stop offset="55%" stopColor="#FBB946" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>
        <radialGradient
          id={`flameCore-${uniqueId}`}
          cx="50%"
          cy="72%"
          r="40%"
        >
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="65%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Outer glossy flame silhouette */}
      <path
        d="M19.5 2.5C19.5 2.5 23.2 8.2 21.6 13.8C21.2 15.2 20.1 16.4 20.1 16.4C20.1 16.4 24.4 14.3 25.8 9.8C29.6 14.5 32.5 20.6 31.2 27.3C29.9 34.2 24.2 39.5 17.8 39.5C11.1 39.5 5.6 34.4 4.7 27.2C3.9 20.8 7.5 14.6 10.6 11.4C10.2 14.2 11.5 16.7 12.8 17.5C11.9 11.2 15.2 5.4 19.5 2.5Z"
        fill={`url(#flameOuter-${uniqueId})`}
      />
      {/* Mid warm gold flame layer */}
      <path
        d="M18.2 12.2C18.2 12.2 21.5 16.5 20.3 20.8C22.4 19.5 23.8 17.4 24.2 15.6C26.8 18.9 28.4 23.5 27.3 28.4C26.2 33.4 22.2 37.5 17.7 37.5C13.1 37.5 9.2 33.7 8.5 28.5C7.9 23.9 10.5 19.5 12.8 17.2C12.6 19.2 13.5 21 14.5 21.6C13.8 17.1 15.6 14.1 18.2 12.2Z"
        fill={`url(#flameMid-${uniqueId})`}
      />
      {/* Bright cream-yellow inner core */}
      <path
        d="M17.8 21.5C19.8 24.2 22.5 27.6 21.7 31.8C21.1 35 19.4 37.2 17.6 37.2C15.7 37.2 13.8 35.1 13.4 31.9C12.9 28.2 15.4 24.4 17.8 21.5Z"
        fill={`url(#flameCore-${uniqueId})`}
      />
    </svg>
  );
};

export interface FlashSaleTimeLeft {
  days?: number;
  hrs: number;
  mins: number;
  secs: number;
}

export interface FlashSaleCountdownTimerProps {
  styleVariant?: FlashSaleTimerStyle;
  timeLeft: FlashSaleTimeLeft;
  className?: string;
  compact?: boolean;
  showFlameIcon?: boolean;
}

export const FlashSaleCountdownTimer: React.FC<FlashSaleCountdownTimerProps> = ({
  styleVariant = "style_1",
  timeLeft,
  className = "",
  compact = false,
  showFlameIcon = false,
}) => {
  // Remap removed legacy styles 2, 3 & 4 to active styles
  let effectiveStyle = styleVariant;
  if (
    effectiveStyle === "style_2" ||
    effectiveStyle === "style_3" ||
    effectiveStyle === "style_4"
  ) {
    effectiveStyle = "style_1";
  }

  // When custom duration passes 48h, display counter by days to min (d : h : m)
  const totalHours = (timeLeft.days || 0) * 24 + (timeLeft.hrs || 0);
  const isDaysFormat = totalHours > 48;

  let val1: string;
  let unit1: string;
  let val2: string;
  let unit2: string;
  let val3: string;
  let unit3: string;

  if (isDaysFormat) {
    const days = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;
    val1 = String(days).padStart(2, "0");
    unit1 = "d";
    val2 = String(remHours).padStart(2, "0");
    unit2 = "h";
    val3 = String(timeLeft.mins).padStart(2, "0");
    unit3 = "m";
  } else {
    val1 = String(timeLeft.hrs).padStart(2, "0");
    unit1 = "h";
    val2 = String(timeLeft.mins).padStart(2, "0");
    unit2 = "m";
    val3 = String(timeLeft.secs).padStart(2, "0");
    unit3 = "s";
  }

  // Style 1: Minimal Luxury
  if (effectiveStyle === "style_1") {
    return (
      <div
        className={`w-full bg-white rounded-2xl border border-[#efe7eb] shadow-[0_3px_14px_rgba(74,14,46,0.05)] ${
          compact ? "px-2.5 py-1.5" : "px-3.5 sm:px-4 py-2 sm:py-2.5"
        } flex items-center justify-between gap-2 transition-all ${className}`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {showFlameIcon && (
            <GlossyFlameIcon className={compact ? "w-3.5 h-3.5 sm:w-4 sm:h-4" : "w-4 h-4 sm:w-5 sm:h-5"} />
          )}
          <span
            className={`font-sans font-semibold uppercase tracking-[0.02em] text-[#4A0E2E] whitespace-nowrap ${
              compact ? "text-[9.5px]" : "text-[10.5px] sm:text-[12.5px]"
            }`}
          >
            OFFER ENDS IN:
          </span>
        </div>

        <div
          className={`flex items-baseline shrink-0 text-[#4A0E2E] select-none ${
            compact ? "text-[13px]" : "text-[15.5px] sm:text-[19.5px]"
          }`}
          style={{ fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif" }}
        >
          <span className="leading-none font-normal">{val1}</span>
          <span className={`${compact ? "text-[9px]" : "text-[10.5px] sm:text-[12.5px]"} ml-[1px] font-normal`}>
            {unit1}
          </span>
          <span className="mx-0.5 sm:mx-1 leading-none">:</span>
          <span className="leading-none font-normal">{val2}</span>
          <span className={`${compact ? "text-[9px]" : "text-[10.5px] sm:text-[12.5px]"} ml-[1px] font-normal`}>
            {unit2}
          </span>
          <span className="mx-0.5 sm:mx-1 leading-none">:</span>
          <span className="leading-none font-normal">{val3}</span>
          <span className={`${compact ? "text-[9px]" : "text-[10.5px] sm:text-[12.5px]"} ml-[1px] font-normal`}>
            {unit3}
          </span>
        </div>
      </div>
    );
  }

  // Style 2 (formerly Style 5): Sleek Glassmorphism (shown in user's screenshot)
  const renderGlassCard = (valStr: string, unit: string) => (
    <div
      className={`rounded-[8px] sm:rounded-[10px] bg-white/55 backdrop-blur-md border border-white/90 shadow-[0_2px_8px_rgba(74,14,46,0.1),inset_0_1px_1px_rgba(255,255,255,0.9)] flex items-baseline justify-center text-[#4A0E2E] shrink-0 ${
        compact ? "px-1.5 py-0.5" : "px-2 sm:px-2.5 py-0.5 sm:py-1"
      }`}
    >
      <span
        className={`font-sans font-semibold leading-none ${
          compact ? "text-[11px]" : "text-[12.5px] sm:text-[15px]"
        }`}
      >
        {valStr}
      </span>
      <span
        className={`font-sans font-medium leading-none ml-[1px] ${
          compact ? "text-[8.5px]" : "text-[9.5px] sm:text-[11px]"
        }`}
      >
        {unit}
      </span>
    </div>
  );

  return (
    <div
      className={`w-full rounded-full relative overflow-hidden backdrop-blur-md border border-white/90 shadow-[0_8px_22px_rgba(74,14,46,0.13),inset_0_1px_2px_rgba(255,255,255,0.95)] flex items-center justify-between gap-1.5 sm:gap-2 ${
        compact ? "px-2.5 py-1.5" : "px-3 sm:px-4 py-1.5 sm:py-2"
      } transition-all ${className}`}
      style={{
        background:
          "linear-gradient(90deg, rgba(243,241,243,0.94) 0%, rgba(216,208,213,0.88) 36%, rgba(188,150,162,0.84) 68%, rgba(162,113,127,0.9) 100%)",
      }}
    >
      {/* Frosted smoky depth patch behind left label */}
      <div className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 w-28 h-10 rounded-full bg-slate-600/20 blur-xl" />

      {/* Left: Optional Flame + OFFER ENDS IN: */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative z-10">
        {showFlameIcon && (
          <GlossyFlameIcon className={compact ? "w-3.5 h-3.5 sm:w-4 sm:h-4" : "w-4 h-4 sm:w-5 sm:h-5"} />
        )}
        <span
          className={`font-sans font-bold uppercase tracking-[0.01em] text-[#4A0E2E] whitespace-nowrap ${
            compact ? "text-[9.5px]" : "text-[10.5px] sm:text-[12px]"
          }`}
        >
          OFFER ENDS IN:
        </span>
      </div>

      {/* Right: Glass timer badges */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 select-none relative z-10">
        {renderGlassCard(val1, unit1)}
        <span className="font-sans font-bold text-[#4A0E2E] text-xs sm:text-base mx-0.5">
          :
        </span>
        {renderGlassCard(val2, unit2)}
        <span className="font-sans font-bold text-[#4A0E2E] text-xs sm:text-base mx-0.5">
          :
        </span>
        {renderGlassCard(val3, unit3)}
      </div>
    </div>
  );
};

export interface FlashSaleTimerStyleSelectorProps {
  selectedStyle: FlashSaleTimerStyle;
  onSelectStyle: (style: FlashSaleTimerStyle) => void;
  previewTimeLeft?: FlashSaleTimeLeft;
  compact?: boolean;
}

export const FlashSaleTimerStyleSelector: React.FC<
  FlashSaleTimerStyleSelectorProps
> = ({
  selectedStyle,
  onSelectStyle,
}) => {
  const normalizedStyle: FlashSaleTimerStyle =
    selectedStyle === "style_5" ? "style_5" : "style_1";

  return (
    <div className="space-y-1.5 p-3 sm:p-3.5 rounded-xl border border-stone-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs">
      <div className="flex items-center justify-between">
        <label
          htmlFor="timer-style-list-field"
          className="text-xs font-bold text-stone-800 dark:text-slate-200 block"
        >
          Time Counter Style:
        </label>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A0E2E] dark:text-pink-400 bg-[#4A0E2E]/10 dark:bg-pink-950/40 px-2 py-0.5 rounded-full">
          {normalizedStyle === "style_1" ? "Style 1 Selected" : "Style 2 Selected"}
        </span>
      </div>

      {/* Dropdown list field permitting choice between Style 1 and Style 2 */}
      <div className="relative">
        <select
          id="timer-style-list-field"
          value={normalizedStyle}
          onChange={(e) => onSelectStyle(e.target.value as FlashSaleTimerStyle)}
          className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#4A0E2E]/25 focus:border-[#4A0E2E] cursor-pointer appearance-none pr-9 transition-all"
        >
          <option value="style_1">Style 1</option>
          <option value="style_5">Style 2</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-500 dark:text-slate-400">
          <svg
            className="w-4 h-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
