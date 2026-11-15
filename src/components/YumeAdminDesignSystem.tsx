import React, { useState, useEffect } from "react";
import { Info, RefreshCw, Check, AlertTriangle, X } from "lucide-react";

/**
 * YUME PLATFORM ADMIN — UNIFIED DESIGN SYSTEM TOKENS
 * Extracted 1:1 from the Merchant Space "Add New Product" reference page.
 *
 * Palette Rules:
 * - Slate-Navy (#1e2631 in Light / #0f172a & #38bdf8 in Dark): Primary buttons, switches,
 *   circular badges, section-title vertical accent bars, and primary controls.
 * - Emerald-Teal (from-emerald-500 to-teal-500): Active sidebar item and active indicators.
 * - Neutral Canvas: Clean white (bg-white) in Light Mode, deep slate (bg-[#0b0f19]) in Dark Mode.
 */

export const YUME_ADMIN_TOKENS = {
  headerAndSidebarBgLight: "#1e2631",
  headerAndSidebarBgDark: "#0f172a",
  canvasClass: "bg-white dark:bg-[#0b0f19] text-stone-900 dark:text-slate-100",
  cardClass:
    "bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs text-left flex flex-col gap-5 transition-colors",
  compactCardClass:
    "bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs text-left transition-colors",
  innerPanelClass:
    "bg-stone-50/60 dark:bg-slate-950/60 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-slate-800 text-left transition-colors",
  subCardClass:
    "bg-stone-50/70 dark:bg-slate-950/60 rounded-2xl border border-stone-200/80 dark:border-slate-800 text-left transition-colors",
  labelClass:
    "text-xs font-semibold text-stone-800 dark:text-slate-200 block mb-1.5",
  helperClass:
    "text-[11px] font-medium text-stone-500 dark:text-slate-400",
  inputClass:
    "w-full text-xs font-sans p-3 rounded-xl bg-stone-50/70 dark:bg-slate-950 border border-stone-200/90 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 focus:border-[#1e2631] dark:focus:border-sky-400 focus:bg-white dark:focus:bg-slate-900 transition-colors font-semibold text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 outline-none",
  monoInputClass:
    "w-full text-xs font-sans p-3 rounded-xl bg-stone-50/70 dark:bg-slate-950 border border-stone-200/90 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 focus:border-[#1e2631] dark:focus:border-sky-400 focus:bg-white dark:focus:bg-slate-900 transition-colors font-bold tracking-wider text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 outline-none",
  selectClass:
    "w-full text-xs font-sans p-3 rounded-xl bg-stone-50/70 dark:bg-slate-950 border border-stone-200/90 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 focus:border-[#1e2631] dark:focus:border-sky-400 focus:bg-white dark:focus:bg-slate-900 transition-colors font-semibold text-stone-900 dark:text-white outline-none cursor-pointer",
  textareaClass:
    "w-full text-xs font-sans p-3 rounded-xl bg-stone-50/70 dark:bg-slate-950 border border-stone-200/90 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 focus:border-[#1e2631] dark:focus:border-sky-400 focus:bg-white dark:focus:bg-slate-900 transition-colors font-medium text-stone-900 dark:text-white leading-relaxed placeholder:text-stone-400 dark:placeholder:text-slate-500 outline-none",
  primaryButtonClass:
    "px-5 py-2.5 rounded-xl bg-[#1e2631] hover:bg-[#111827] dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-bold shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-2 shrink-0 select-none active:scale-[0.99]",
  secondaryButtonClass:
    "px-3.5 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-100/80 hover:bg-stone-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0 shadow-2xs select-none",
  dangerButtonClass:
    "px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-2 shrink-0 select-none active:scale-[0.99]",
  emeraldButtonClass:
    "px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-105 text-white text-xs font-bold shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-2 shrink-0 select-none active:scale-[0.99]",
  emeraldActiveClass:
    "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] font-bold",
};

/**
 * 1. VERTICAL ACCENT BAR SECTION HEADER (Matches "Step 1: Product identity" header row)
 */
export interface YumeAdminSectionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  rightContent?: React.ReactNode;
  rightSlot?: React.ReactNode;
  noBorder?: boolean;
}

export const YumeAdminSectionHeader: React.FC<YumeAdminSectionHeaderProps> = ({
  title,
  subtitle,
  rightContent,
  rightSlot,
  noBorder = false,
}) => {
  const rightArea = rightContent ?? rightSlot;
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        noBorder
          ? ""
          : "pb-4 border-b border-stone-200/80 dark:border-slate-800"
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 rounded-full shrink-0 bg-[#1e2631] dark:bg-sky-400" />
          <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight font-sans">
            {title}
          </h3>
        </div>
        {subtitle && (
          <p className="text-xs text-stone-500 dark:text-slate-400 font-medium mt-1 pl-4">
            {subtitle}
          </p>
        )}
      </div>
      {rightArea && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {rightArea}
        </div>
      )}
    </div>
  );
};

/**
 * 2. CONTEXTUAL ADVICE / GOVERNANCE CALLOUT BANNER (Matches "ADVICE:" banner in Add New Product)
 */
export interface YumeAdminAdviceBannerProps {
  label?: string;
  children: React.ReactNode;
  onRefresh?: () => void;
  variant?: "default" | "warning" | "emerald";
}

export const YumeAdminAdviceBanner: React.FC<YumeAdminAdviceBannerProps> = ({
  label = "ADVICE:",
  children,
  onRefresh,
  variant = "default",
}) => {
  const containerStyles =
    variant === "warning"
      ? "bg-amber-50/70 dark:bg-amber-950/25 border-amber-200/80 dark:border-amber-800/50 text-amber-900 dark:text-amber-200"
      : variant === "emerald"
      ? "bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-200/80 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200"
      : "bg-[#1e2631]/[0.04] dark:bg-slate-800/50 border-[#1e2631]/15 dark:border-slate-700/80 text-[#1e2631] dark:text-slate-200";

  const iconColor =
    variant === "warning"
      ? "text-amber-600 dark:text-amber-400"
      : variant === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-[#1e2631] dark:text-sky-400";

  return (
    <div
      className={`flex items-start gap-2.5 p-3.5 rounded-xl border transition-all text-left ${containerStyles}`}
    >
      <Info className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
      <div className="text-xs leading-relaxed font-semibold flex-1">
        {label && (
          <strong className={`font-black uppercase mr-1.5 ${iconColor}`}>
            {label}
          </strong>
        )}
        {children}
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="text-stone-400 hover:text-stone-700 dark:hover:text-white p-1 rounded-md transition-all cursor-pointer shrink-0"
          title="Next tip"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

/**
 * 3. ADD NEW PRODUCT HORIZONTAL SUB-NAVIGATION CARD STRIP
 * Used strictly for multi-tab administrative sections.
 */
export interface YumeAdminSubNavItem<T extends string = string> {
  id: T;
  label?: string;
  title?: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }> | React.ReactNode;
  badge?: React.ReactNode;
  completed?: boolean;
}

export interface YumeAdminSubNavStripProps<T extends string = string> {
  items: YumeAdminSubNavItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
  columnsClass?: string;
}

export function YumeAdminSubNavStrip<T extends string = string>({
  items,
  activeId,
  onSelect,
  columnsClass,
}: YumeAdminSubNavStripProps<T>) {
  const [hoveredId, setHoveredId] = useState<T | null>(null);

  const gridCols =
    columnsClass ||
    (items.length === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : items.length === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : items.length === 4
      ? "grid-cols-2 lg:grid-cols-4"
      : items.length === 6
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5");

  return (
    <div
      className={`grid ${gridCols} gap-3 sm:gap-3.5 p-0 bg-transparent rounded-2xl border-0 overflow-visible relative z-20 w-full`}
      role="tablist"
    >
      {items.map((item, idx) => {
        const isActive = activeId === item.id;
        const isHovered = hoveredId === item.id;
        const displayLabel = item.label ?? item.title ?? "";
        const badgeText =
          item.badge !== undefined && item.badge !== null
            ? item.badge
            : idx + 1;

        const iconColorClass = isHovered
          ? "text-white"
          : isActive
          ? "text-[#1e2631] dark:text-sky-400"
          : "text-stone-400 dark:text-slate-500";

        let renderedIcon: React.ReactNode = null;
        if (React.isValidElement(item.icon)) {
          renderedIcon = item.icon;
        } else if (typeof item.icon === "function" || (typeof item.icon === "object" && item.icon !== null)) {
          const IconComp = item.icon as React.ComponentType<{ className?: string }>;
          renderedIcon = <IconComp className={`w-3.5 h-3.5 shrink-0 transition-colors ${iconColorClass}`} />;
        }

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelect(item.id)}
            className={`min-h-[82px] px-3.5 sm:px-4 py-3.5 rounded-2xl text-left transition-all duration-200 ease-out cursor-pointer flex items-start justify-between gap-2.5 border select-none ${
              isHovered
                ? "bg-[#1e2631] dark:bg-slate-800 text-white border-transparent shadow-lg scale-[1.02] -translate-y-0.5 z-30"
                : isActive
                ? "bg-white dark:bg-slate-900 text-stone-950 dark:text-white border-[#1e2631] dark:border-sky-400 shadow-sm ring-2 ring-black/5 dark:ring-sky-400/15 z-20"
                : "bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-200/90 dark:border-slate-800 hover:border-stone-400 dark:hover:border-slate-700 shadow-xs z-10"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                {renderedIcon}
                <span
                  className={`text-xs leading-snug transition-colors truncate ${
                    isHovered
                      ? "text-white font-extrabold"
                      : isActive
                      ? "text-stone-950 dark:text-white font-black"
                      : "text-stone-800 dark:text-slate-200 font-bold"
                  }`}
                >
                  {displayLabel}
                </span>
              </div>
              <p
                className={`text-[10.5px] leading-tight line-clamp-1 mt-1 font-medium transition-colors ${
                  isHovered
                    ? "text-white/85"
                    : isActive
                    ? "text-stone-600 dark:text-slate-300 font-semibold"
                    : "text-stone-500 dark:text-slate-400"
                }`}
              >
                {item.subtitle}
              </p>
            </div>

            {/* Right Circular Step / Metric Badge */}
            <div
              className={`min-w-[26px] h-[26px] px-1.5 rounded-full flex items-center justify-center text-[10.5px] font-sans tabular-nums font-bold shrink-0 transition-all ${
                item.completed && !isActive && !isHovered
                  ? "bg-emerald-500 text-white"
                  : isHovered
                  ? "bg-white text-[#1e2631]"
                  : isActive
                  ? "bg-[#1e2631] dark:bg-sky-400 text-white dark:text-slate-950 shadow-2xs"
                  : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400 border border-stone-200/80 dark:border-slate-700"
              }`}
            >
              {item.completed && !isActive && !isHovered ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                badgeText
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * 4. STANDARDIZED SLATE-NAVY / EMERALD TOGGLE SWITCH
 */
export interface YumeAdminToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  variant?: "slate" | "emerald";
  size?: "sm" | "md";
  ariaLabel?: string;
  label?: React.ReactNode;
}

export const YumeAdminToggle: React.FC<YumeAdminToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  variant = "slate",
  size = "md",
  ariaLabel,
  label,
}) => {
  const activeBg =
    variant === "emerald"
      ? "bg-emerald-500 dark:bg-emerald-500"
      : "bg-[#1e2631] dark:bg-sky-500";

  const dims =
    size === "sm"
      ? { track: "w-9 h-5", thumb: "w-3.5 h-3.5", translate: "translate-x-4" }
      : { track: "w-11 h-6", thumb: "w-4 h-4", translate: "translate-x-5" };

  return (
    <div className="inline-flex items-center gap-2.5">
      {label && (
        <span className="text-xs font-bold text-stone-700 dark:text-slate-300 select-none">
          {label}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onChange(!checked);
        }}
        className={`relative inline-flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 ${
          dims.track
        } ${
          disabled ? "opacity-45 cursor-not-allowed" : "cursor-pointer"
        } ${checked ? activeBg : "bg-stone-200 dark:bg-slate-700"}`}
      >
        <span
          className={`inline-block rounded-full bg-white shadow-xs transform transition-transform duration-200 ${
            dims.thumb
          } ${checked ? dims.translate : "translate-x-0"}`}
        />
      </button>
    </div>
  );
};

/**
 * 5. BOTTOM ACTION BAR CARD (Matches "<- Back to Catalog | Step 1 of 5 | Next Step ->" card)
 */
export interface YumeAdminActionFooterProps {
  leftContent?: React.ReactNode;
  centerText?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export const YumeAdminActionFooter: React.FC<YumeAdminActionFooterProps> = ({
  leftContent,
  centerText,
  rightContent,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 px-5 py-3.5 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2">{leftContent}</div>
      {centerText && (
        <div className="text-xs font-semibold text-stone-500 dark:text-slate-400 font-sans">
          {centerText}
        </div>
      )}
      <div className="flex items-center gap-2">{rightContent}</div>
    </div>
  );
};

/**
 * 6. DESTRUCTIVE / SAFETY CONFIRMATION MODAL
 * Replaces native browser window.confirm() with a non-blocking, accessible
 * Slate-Navy / Add New Product confirmation dialog for Delete, Reset, and bulk Disable actions.
 */
export interface YumeAdminConfirmModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "slate";
  onConfirm: () => void;
  onCancel: () => void;
}

export const YumeAdminConfirmModal: React.FC<YumeAdminConfirmModalProps> = ({
  isOpen,
  title,
  subtitle,
  description,
  confirmLabel = "Confirm Action",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmBtnClass =
    variant === "danger"
      ? YUME_ADMIN_TOKENS.dangerButtonClass
      : YUME_ADMIN_TOKENS.primaryButtonClass;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="yume-confirm-modal-title"
    >
      <div
        className={`${YUME_ADMIN_TOKENS.cardClass} max-w-md w-full shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-stone-200/80 dark:border-slate-800">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-1.5 h-5 rounded-full shrink-0 mt-0.5 bg-[#1e2631] dark:bg-sky-400" />
            <div className="min-w-0">
              <h3
                id="yume-confirm-modal-title"
                className="text-base font-bold text-stone-900 dark:text-white tracking-tight font-sans"
              >
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-stone-500 dark:text-slate-400 font-medium mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Close confirmation dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs leading-relaxed font-medium ${
            variant === "danger"
              ? "bg-rose-50/70 dark:bg-rose-950/25 border-rose-200/80 dark:border-rose-800/50 text-rose-900 dark:text-rose-200"
              : "bg-amber-50/70 dark:bg-amber-950/25 border-amber-200/80 dark:border-amber-800/50 text-amber-900 dark:text-amber-200"
          }`}
        >
          <AlertTriangle
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              variant === "danger"
                ? "text-rose-600 dark:text-rose-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          />
          <div className="flex-1">{description}</div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className={YUME_ADMIN_TOKENS.secondaryButtonClass}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={confirmBtnClass}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

