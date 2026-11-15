import React from "react";

export interface YumeLogoProps {
  /**
   * "full" = Emblem badge + inspiring 'yume' wordmark + spark
   * "wordmark" = Inspiring 'yume' wordmark with subtle dream arc & spark
   * "emblem" = Rounded squircle 'y✦' emblem badge only
   * "compact" = Inline mini badge + 'yume' for "Powered by yume" or tight pills
   */
  variant?: "full" | "wordmark" | "emblem" | "compact";
  /**
   * "light" = For light/white backgrounds (dark wordmark, colored gradient emblem)
   * "dark" = For dark or colored header backgrounds (white wordmark, luminous emblem)
   */
  theme?: "light" | "dark";
  /**
   * Size preset
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * Dynamic accent/button color of the current page or store
   */
  accentColor?: string;
  /**
   * Optional subtitle or badge text next to the logo
   */
  badgeText?: string;
  className?: string;
  onClick?: () => void;
}

export const YumeLogo: React.FC<YumeLogoProps> = ({
  variant = "full",
  theme = "light",
  size = "md",
  accentColor = "#4a0a26",
  badgeText,
  className = "",
  onClick,
}) => {
  const sizeConfig = {
    xs: {
      emblemBox: "w-5 h-5 rounded-[6px]",
      emblemSvg: "w-3.5 h-3.5",
      wordmarkText: "text-[16px]",
      sparkSvg: "w-2 h-2 -top-0.5 -right-2",
      arcHeight: "h-[2px]",
      gap: "gap-1.5",
    },
    sm: {
      emblemBox: "w-7 h-7 rounded-[9px]",
      emblemSvg: "w-4.5 h-4.5",
      wordmarkText: "text-[20px]",
      sparkSvg: "w-2.5 h-2.5 -top-0.5 -right-2.5",
      arcHeight: "h-[2.5px]",
      gap: "gap-2",
    },
    md: {
      emblemBox: "w-9 h-9 rounded-[12px]",
      emblemSvg: "w-6 h-6",
      wordmarkText: "text-[26px]",
      sparkSvg: "w-3 h-3 -top-1 -right-3",
      arcHeight: "h-[3px]",
      gap: "gap-2.5",
    },
    lg: {
      emblemBox: "w-10 h-10 sm:w-11 sm:h-11 rounded-[14px]",
      emblemSvg: "w-7 h-7",
      wordmarkText: "text-[30px] sm:text-[34px]",
      sparkSvg: "w-3.5 h-3.5 -top-1 -right-3.5",
      arcHeight: "h-[3.5px]",
      gap: "gap-2.5 sm:gap-3",
    },
    xl: {
      emblemBox: "w-12 h-12 rounded-[16px]",
      emblemSvg: "w-8 h-8",
      wordmarkText: "text-[38px] sm:text-[44px]",
      sparkSvg: "w-4 h-4 -top-1 -right-4",
      arcHeight: "h-[4px]",
      gap: "gap-3",
    },
  }[size];

  const isDarkTheme = theme === "dark";

  const renderEmblem = () => (
    <div
      className={`${sizeConfig.emblemBox} relative inline-flex items-center justify-center shrink-0 shadow-sm overflow-hidden transition-transform duration-300 group-hover/yumelogo:scale-105`}
      style={
        isDarkTheme
          ? {
              background: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.9)",
            }
          : {
              background: `linear-gradient(135deg, ${accentColor} 0%, color-mix(in srgb, ${accentColor} 72%, #0f172a) 100%)`,
              boxShadow: `0 6px 16px color-mix(in srgb, ${accentColor} 28%, transparent), inset 0 1px 1px rgba(255, 255, 255, 0.3)`,
            }
      }
    >
      {/* Subtle top-left glass reflection */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 22% 18%, rgba(255,255,255,0.32) 0%, transparent 55%)",
        }}
      />

      {/* Sculpted 'y' + Dream Star (✦) SVG */}
      <svg
        viewBox="0 0 36 36"
        className={`${sizeConfig.emblemSvg} relative z-10`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Flowing geometric lowercase 'y' */}
        <path
          d="M10.5 11.5 L15.8 21.2 C16.3 22.1 17.5 22.1 18 21.2 L23.5 11.5"
          stroke={isDarkTheme ? accentColor : "#ffffff"}
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M23.5 11.5 L16.8 25.2 C15.2 28.4 12.2 29.5 9.5 28.2"
          stroke={isDarkTheme ? accentColor : "#ffffff"}
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        {/* Inspiring 4-Point Dream Star (✦) */}
        <path
          d="M27.5 5.5 C27.8 8.1 28.9 9.2 31.5 9.5 C28.9 9.8 27.8 10.9 27.5 13.5 C27.2 10.9 26.1 9.8 23.5 9.5 C26.1 9.2 27.2 8.1 27.5 5.5 Z"
          fill={isDarkTheme ? "#f59e0b" : "#fde68a"}
        />
      </svg>
    </div>
  );

  if (variant === "emblem") {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center select-none group/yumelogo ${
          onClick ? "cursor-pointer" : ""
        } ${className}`}
      >
        {renderEmblem()}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 select-none group/yumelogo ${
          onClick ? "cursor-pointer" : ""
        } ${className}`}
      >
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-[6px] font-black text-[11px] leading-none shadow-2xs relative overflow-hidden"
          style={
            isDarkTheme
              ? { backgroundColor: "#ffffff", color: accentColor }
              : {
                  background: `linear-gradient(135deg, ${accentColor} 0%, color-mix(in srgb, ${accentColor} 75%, #0f172a) 100%)`,
                  color: "#ffffff",
                }
          }
        >
          <span>y</span>
          <span className="text-[6px] text-amber-300 absolute top-0.5 right-0.5 leading-none">
            ✦
          </span>
        </span>
        <span
          className={`font-black tracking-[-0.045em] text-[15px] leading-none ${
            isDarkTheme ? "text-white" : "text-slate-950 dark:text-white"
          }`}
        >
          yume
        </span>
      </span>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${sizeConfig.gap} select-none group/yumelogo ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {variant === "full" && renderEmblem()}

      {/* Sculpted Lowercase 'yume' Wordmark with Inspiring Dream Arc & Spark */}
      <div className="relative inline-flex flex-col justify-center">
        <div className="relative inline-flex items-baseline leading-none">
          <span
            className={`${sizeConfig.wordmarkText} font-black tracking-[-0.055em] leading-none font-sans transition-colors duration-300 ${
              isDarkTheme ? "text-white" : "text-slate-950 dark:text-white"
            }`}
          >
            yume
          </span>

          {/* Inspiring 4-Point Dream Star: above final 'e' in Header (dark theme), original top-right in Footer (light theme) */}
          <svg
            viewBox="0 0 24 24"
            className={`absolute ${
              isDarkTheme
                ? "w-2.5 h-2.5 -top-1.5 right-0.5"
                : sizeConfig.sparkSvg
            } pointer-events-none transition-transform duration-300 group-hover/yumelogo:rotate-12 group-hover/yumelogo:scale-110`}
            fill="none"
          >
            <path
              d="M12 2 C12.7 7.8 15.2 10.3 21 11 C15.2 11.7 12.7 14.2 12 20 C11.3 14.2 8.8 11.7 3 11 C8.8 10.3 11.3 7.8 12 2 Z"
              fill={isDarkTheme ? "#fde047" : accentColor}
            />
          </svg>
        </div>

        {/* Subtle Uplifting Horizon Arc beneath 'yu' */}
        <div
          className={`w-3/5 ${sizeConfig.arcHeight} rounded-full mt-0.5 opacity-85 transition-all duration-300 group-hover/yumelogo:w-4/5`}
          style={{
            background: isDarkTheme
              ? "linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(253,230,138,0.85) 70%, transparent 100%)"
              : `linear-gradient(90deg, ${accentColor} 0%, color-mix(in srgb, ${accentColor} 45%, #f59e0b) 75%, transparent 100%)`,
          }}
        />
      </div>

      {badgeText && (
        <span
          className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${
            isDarkTheme
              ? "bg-white/15 text-white border border-white/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}
        >
          {badgeText}
        </span>
      )}
    </div>
  );
};

export default YumeLogo;
