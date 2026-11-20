import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Share2,
  Handshake,
  BellOff,
  Bell,
  Sliders,
  Info,
  QrCode,
  Flag,
  Ban,
  ShieldCheck,
  Check,
} from "lucide-react";
import type { MerchantStore } from "../types";
import {
  normalizeStoreDockSettings,
  resolveDockGapPixels,
  getStoreMoreOptionsMenuItems,
  resolvePartnerPicksEntryPoint,
  isStoreCurrentlyMuted,
  formatRemainingMuteDuration,
  type StoreDockSettings,
  type MoreOptionsMenuItemId,
  type PartnerPicksEntryContext,
  type UserStoreMuteRecord,
  type MuteDurationPresetId,
  type ReportStoreReason,
} from "../utils/storeMoreOptionsLogic";
import {
  getContrastSafeForeground,
  isLightColor,
} from "../utils/brandIdentityColorSystem";
import {
  ShareStoreModal,
  MuteStoreModal,
  DockSettingsModal,
  StoreDetailsModal,
  ReportStoreModal,
  BlockStoreModal,
} from "./StoreMoreOptionsModals";

export function PartnerPicksIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Flame outer contour with ice-cyan fill and bold ocean-teal outline */}
      <path
        d="M21.2 6.4C31.8 6.8 36.2 13.8 37.3 20.6C37.9 24.4 42.1 25.3 43.9 22.1C44.8 20.4 45.2 18.2 45.1 16.3C51.6 22.3 55.2 31.1 54.4 40.3C53.3 51.3 44.3 58.6 32.8 58.6C20.5 58.6 11.4 49.4 11.4 37.5C11.4 29.7 15.2 23.6 18.8 18.1C21.3 14.3 23.2 10.7 21.2 6.4Z"
        fill="#CCF5FC"
        stroke="#167C9E"
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner clock face */}
      <circle
        cx="33"
        cy="40.5"
        r="10.8"
        fill="#FFFFFF"
        stroke="#167C9E"
        strokeWidth="4.4"
      />
      {/* Clock hands (12 o'clock and ~4:30) */}
      <path
        d="M33 34.8V40.5L36.8 43.9"
        stroke="#167C9E"
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const safeGetString = (val: any): string => {
  if (!val) return "";
  try {
    if (typeof val === "string") return val.toLowerCase();
    if (typeof val === "number" || typeof val === "boolean") return String(val).toLowerCase();
    if (typeof val === "function") return val.toString().toLowerCase();
    if (Array.isArray(val)) {
      return val.map(safeGetString).join(" ");
    }
    if (typeof val === "object") {
      if (val.props) {
        return (
          safeGetString(val.props.children) +
          " " +
          safeGetString(val.props.title) +
          " " +
          safeGetString(val.props["aria-label"])
        );
      }
    }
  } catch (e) {
    console.error("safeGetString error", e);
  }
  return "";
};

export interface MacOsDockProps {
  children: React.ReactNode;
  currentLanguage?: "ar" | "en" | "fr";
  storeId?: string;
  storeName?: string;
  storeUrl?: string;
  accentColor?: string;
  headerColor?: string;
  /**
   * Strict Store Owner flag (verified against primary store owner only;
   * excludes store administrators, team members, and moderators).
   */
  isOwner?: boolean;
  isStrictOwner?: boolean;
  store?: MerchantStore;
  isDarkMode?: boolean;
  isAuthenticated?: boolean;
  isMerchantVisitor?: boolean;
  activeStoreNavTab?: string;
  muteRecord?: UserStoreMuteRecord | null;
  isBlocked?: boolean;
  onConfirmMuteStore?: (params: {
    presetId: MuteDurationPresetId;
    expiresAt: string | null;
    durationLabel: string;
  }) => void;
  onUnmuteStore?: () => void;
  onConfirmBlockStore?: () => void;
  onUnblockStore?: () => void;
  onSaveDockSettings?: (nextSettings: StoreDockSettings) => Promise<void> | void;
  onSubmitStoreReport?: (params: {
    primaryReason: ReportStoreReason;
    additionalDetails: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  onOpenPartnerPicks?: (context: PartnerPicksEntryContext) => boolean | void;
  onPlaceholderNotice?: (featureName: string, message: string) => void;
}

export default function MacOsDock({
  children,
  currentLanguage = "en",
  storeId = "default-store",
  storeName = "Store",
  storeUrl = typeof window !== "undefined" ? window.location.href : "https://yume.dz",
  headerColor = "#0b2447",
  isOwner = false,
  isStrictOwner,
  store,
  isDarkMode = false,
  isAuthenticated = false,
  isMerchantVisitor = false,
  activeStoreNavTab = "products",
  muteRecord = null,
  isBlocked = false,
  onConfirmMuteStore,
  onUnmuteStore,
  onConfirmBlockStore,
  onUnblockStore,
  onSaveDockSettings,
  onSubmitStoreReport,
  onOpenPartnerPicks,
  onPlaceholderNotice,
}: MacOsDockProps) {
  const effectiveStrictOwner =
    typeof isStrictOwner === "boolean" ? isStrictOwner : Boolean(isOwner);

  const publishedDockSettings = useMemo(
    () => normalizeStoreDockSettings(store?.designSettings?.dockSettings),
    [store?.designSettings?.dockSettings]
  );

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredMenuItemId, setHoveredMenuItemId] = useState<MoreOptionsMenuItemId | null>(null);
  const [hoverPillRect, setHoverPillRect] = useState<{
    top: number;
    height: number;
  } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [openUpwards, setOpenUpwards] = useState<boolean>(false);

  const effectiveHeaderHoverBg = headerColor || "#0b2447";
  const effectiveHeaderHoverFg = getContrastSafeForeground(effectiveHeaderHoverBg);
  const isHeaderHoverLight = isLightColor(effectiveHeaderHoverBg);

  // Active modal state
  const [activeModal, setActiveModal] = useState<
    | null
    | "share_store"
    | "mute_store"
    | "dock_settings"
    | "store_details"
    | "report_store"
    | "block_store"
  >(null);

  // Lightweight inline placeholder toast when parent doesn't supply onPlaceholderNotice
  const [placeholderBanner, setPlaceholderBanner] = useState<string | null>(null);

  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const menuListRef = useRef<HTMLDivElement | null>(null);
  const menuItemRefs = useRef<Partial<Record<MoreOptionsMenuItemId, HTMLButtonElement | null>>>({});
  const menuItemIdsRef = useRef<MoreOptionsMenuItemId[]>([]);
  const moreBtnWrapperRef = useRef<HTMLDivElement | null>(null);

  const updateHoverPillForItem = (itemId: MoreOptionsMenuItemId | null) => {
    setHoveredMenuItemId(itemId);
    if (!itemId) {
      setHoverPillRect(null);
      return;
    }
    const btn = menuItemRefs.current[itemId];
    if (btn) {
      setHoverPillRect({
        top: btn.offsetTop,
        height: btn.offsetHeight,
      });
    }
  };

  // Close menu or active modal on Escape key & support smooth Arrow navigation when menu is open
  useEffect(() => {
    if (!isMenuOpen && !activeModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (activeModal) {
          setActiveModal(null);
        } else {
          setIsMenuOpen(false);
        }
        return;
      }
      if (isMenuOpen && !activeModal && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End")) {
        const orderedIds = menuItemIdsRef.current;
        if (orderedIds.length === 0) return;
        e.preventDefault();
        const currentIdx = hoveredMenuItemId ? orderedIds.indexOf(hoveredMenuItemId) : -1;
        let nextIdx = 0;
        if (e.key === "ArrowDown") {
          nextIdx = currentIdx < orderedIds.length - 1 ? currentIdx + 1 : 0;
        } else if (e.key === "ArrowUp") {
          nextIdx = currentIdx > 0 ? currentIdx - 1 : orderedIds.length - 1;
        } else if (e.key === "Home") {
          nextIdx = 0;
        } else if (e.key === "End") {
          nextIdx = orderedIds.length - 1;
        }
        const nextId = orderedIds[nextIdx];
        const nextBtn = menuItemRefs.current[nextId];
        if (nextBtn) {
          nextBtn.focus({ preventScroll: false });
          nextBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
          updateHoverPillForItem(nextId);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isMenuOpen, activeModal, hoveredMenuItemId]);

  // Close menu on outside click
  useEffect(() => {
    if (!isMenuOpen) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (
        menuContainerRef.current &&
        target &&
        !menuContainerRef.current.contains(target) &&
        moreBtnWrapperRef.current &&
        !moreBtnWrapperRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isMenuOpen]);

  // Close menu automatically when store or active tab changes
  useEffect(() => {
    setIsMenuOpen(false);
    setHoveredMenuItemId(null);
    setHoverPillRect(null);
  }, [storeId, activeStoreNavTab]);

  // Clear hovered menu item & sliding pill when menu closes
  useEffect(() => {
    if (!isMenuOpen) {
      setHoveredMenuItemId(null);
      setHoverPillRect(null);
    }
  }, [isMenuOpen]);

  // Viewport collision check so the floating 3D card never gets clipped off-screen
  useEffect(() => {
    if (isMenuOpen && moreBtnWrapperRef.current && typeof window !== "undefined") {
      const rect = moreBtnWrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpwards(spaceBelow < 430 && rect.top > 430);
    }
  }, [isMenuOpen]);

  const showPlaceholderToast = (title: string, msg: string) => {
    if (onPlaceholderNotice) {
      onPlaceholderNotice(title, msg);
      return;
    }
    const bannerText = msg.startsWith(title) ? msg : `${title}: ${msg}`;
    setPlaceholderBanner(bannerText);
    setTimeout(() => {
      setPlaceholderBanner(null);
    }, 3500);
  };

  const isMuted = isStoreCurrentlyMuted(muteRecord);
  const remainingMuteLabel = formatRemainingMuteDuration(muteRecord);

  const menuItems = getStoreMoreOptionsMenuItems({
    isStrictOwner: effectiveStrictOwner,
    isMuted,
    remainingMuteLabel,
    isBlocked,
    language: currentLanguage,
  });
  menuItemIdsRef.current = menuItems.map((m) => m.id);

  const handleSelectMenuItem = (itemId: MoreOptionsMenuItemId) => {
    // Selecting an option immediately closes the floating More Options card
    setIsMenuOpen(false);
    setHoveredIndex(null);
    setHoveredMenuItemId(null);

    switch (itemId) {
      case "share_store":
        setActiveModal("share_store");
        break;
      case "partner_picks": {
        const entryContext = resolvePartnerPicksEntryPoint({
          storeId,
          storeName,
          isStrictOwner: effectiveStrictOwner,
          isAuthenticated,
          isMerchantVisitor,
          language: currentLanguage,
        });
        window.dispatchEvent(
          new CustomEvent("yume:partner-picks-trigger", { detail: entryContext })
        );
        const handledByParent = onOpenPartnerPicks ? onOpenPartnerPicks(entryContext) : false;
        if (!handledByParent) {
          showPlaceholderToast(entryContext.localizedTitle, entryContext.localizedNotice);
        }
        break;
      }
      case "collab":
        window.dispatchEvent(
          new CustomEvent("yume:collab-store-trigger", { detail: { storeId, storeName } })
        );
        showPlaceholderToast(
          "Collab",
          `Creator & Brand Collab with ${storeName} will be available in an upcoming YUME release.`
        );
        break;
      case "mute_store":
        setActiveModal("mute_store");
        break;
      case "dock_settings":
        if (effectiveStrictOwner) {
          setActiveModal("dock_settings");
        }
        break;
      case "store_details":
        setActiveModal("store_details");
        break;
      case "generate_qr_code":
        window.dispatchEvent(
          new CustomEvent("yume:generate-qr-trigger", {
            detail: { storeId, storeName, storeUrl },
          })
        );
        showPlaceholderToast(
          "Generate QR Code",
          `Store QR Code suite for ${storeName} is reserved for the upcoming QR phase.`
        );
        break;
      case "report_store":
        setActiveModal("report_store");
        break;
      case "block_store":
        if (isBlocked) {
          if (onUnblockStore) onUnblockStore();
          showPlaceholderToast("Store Unblocked", `${storeName} has been unblocked.`);
        } else {
          setActiveModal("block_store");
        }
        break;
    }
  };

  const renderMenuIcon = (itemId: MoreOptionsMenuItemId) => {
    switch (itemId) {
      case "share_store":
        return <Share2 className="w-4 h-4 text-indigo-500" />;
      case "partner_picks":
        return <PartnerPicksIcon className="w-[18px] h-[18px]" />;
      case "collab":
        return <Handshake className="w-4 h-4 text-violet-500" />;
      case "mute_store":
        return isMuted ? (
          <Bell className="w-4 h-4 text-amber-500" />
        ) : (
          <BellOff className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        );
      case "dock_settings":
        return <Sliders className="w-4 h-4 text-indigo-500" />;
      case "store_details":
        return <Info className="w-4 h-4 text-sky-500" />;
      case "generate_qr_code":
        return <QrCode className="w-4 h-4 text-emerald-500" />;
      case "report_store":
        return <Flag className="w-4 h-4 text-rose-500" />;
      case "block_store":
        return isBlocked ? (
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
        ) : (
          <Ban className="w-4 h-4 text-rose-500" />
        );
    }
  };

  const validChildren = React.Children.toArray(children).filter((child) => {
    if (!child) return false;
    if (React.isValidElement(child)) {
      const childStr = safeGetString(child);
      if (
        childStr.includes("share") ||
        childStr.includes("copied") ||
        childStr.includes("details") ||
        childStr.includes("مشاركة")
      ) {
        return false;
      }
    }
    return true;
  });
  const gapPx = resolveDockGapPixels(publishedDockSettings.appearance);
  const buttonScale = publishedDockSettings.appearance.buttonScale;
  const { buttonColors, enableTooltips, theme } = publishedDockSettings.appearance;
  const isDarkBarTheme = theme === "obsidian" || theme === "aurora" || theme === "neon";

  const fallbackStoreObject: MerchantStore =
    store ||
    ({
      id: storeId,
      name: storeName,
      slug: storeId,
      subdomain: `${storeId}.yume.dz`,
      logo: "",
      banner: "",
      description: "",
      bio: "",
      wilaya: "Alger",
      wilayaCode: "16",
      address: "",
      coordinates: { lat: 36.75, lng: 3.05 },
      rating: 4.9,
      categories: [],
      verified: true,
      premiumTier: "Pro",
      contact: { phone: "", email: "" },
      products: [],
      reviews: [],
    } as MerchantStore);

  return (
    <div className="relative flex items-center select-none z-50">
      {/* Inline Placeholder Banner Toast (portaled to body to escape backdrop-filter stacking contexts) */}
      {typeof document !== "undefined" &&
        placeholderBanner &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            data-testid="store-more-options-notice-toast"
            className={`fixed top-20 end-6 z-[10005] max-w-md px-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-2.5 text-xs font-bold ${
              isDarkMode
                ? "bg-slate-900/95 border-indigo-500/40 text-white"
                : "bg-white/95 border-indigo-200 text-slate-900"
            }`}
          >
            <Check className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>{placeholderBanner}</span>
          </div>,
          document.body
        )}

      {/* Main Dock Action Buttons Container */}
      <div
        className="flex items-center transition-all duration-300"
        style={{ gap: `${gapPx}px` }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {validChildren.map((child, index) => {
          let label = "";
          let isFollowButton = false;
          let isMessageButton = false;

          if (React.isValidElement(child)) {
            const cProps = child.props as any;
            const childStr = safeGetString(child);

            if (cProps["data-label"]) label = cProps["data-label"];
            else if (cProps.title) label = cProps.title;
            else if (cProps["aria-label"]) label = cProps["aria-label"];

            if (
              childStr.includes("follow") ||
              childStr.includes("متابعة") ||
              childStr.includes("suivre") ||
              index === 0
            ) {
              isFollowButton = true;
              if (!label) label = "Follow Store";
            } else if (
              childStr.includes("message") ||
              childStr.includes("رسالة") ||
              index === 1
            ) {
              isMessageButton = true;
              if (!label) label = "Message Store";
            }
          }

          const isHovered = hoveredIndex === index;
          const hoverBoost = isHovered ? 1.06 : 1;
          const computedScale = Number((buttonScale * hoverBoost).toFixed(3));

          let styledChild = child;
          if (React.isValidElement(child)) {
            const cProps = child.props as any;
            const existingStyle = cProps.style || {};

            if (isFollowButton) {
              styledChild = React.cloneElement(child as React.ReactElement<any>, {
                style: {
                  ...existingStyle,
                  backgroundColor: buttonColors.followBg,
                  color: buttonColors.followText,
                  borderColor: buttonColors.followBg,
                },
              });
            } else if (isMessageButton) {
              styledChild = React.cloneElement(child as React.ReactElement<any>, {
                style: {
                  ...existingStyle,
                  backgroundColor: buttonColors.messageBg,
                  color: buttonColors.messageText,
                  borderColor: buttonColors.messageBg,
                },
              });
            }
          }

          return (
            <div
              key={index}
              className="relative flex flex-col items-center justify-center"
              onMouseEnter={() => setHoveredIndex(index)}
            >
              {/* Floating Tooltip */}
              <AnimatePresence>
                {enableTooltips && isHovered && label && !isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.92 }}
                    animate={{ opacity: 1, y: -8, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.92 }}
                    transition={{ duration: 0.14 }}
                    className="absolute -top-9 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap pointer-events-none shadow-lg border z-50 bg-slate-900/95 text-white border-slate-700"
                  >
                    {label}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                animate={{
                  scale: computedScale,
                  y: isHovered ? -2 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 26,
                }}
                className="relative flex items-center justify-center"
              >
                {styledChild}
              </motion.div>
            </div>
          );
        })}

        {/* Subtle divider between primary buttons and More Options 3-dot button */}
        <div
          className={`h-5 w-px mx-0.5 select-none ${
            isDarkBarTheme
              ? "bg-white/25"
              : isDarkMode
              ? "bg-slate-700/80"
              : "bg-slate-300/80"
          }`}
          aria-hidden="true"
        />

        {/* Dedicated Three-Dot More Options Trigger + Continuous Floating 3D Menu Card */}
        <div
          ref={moreBtnWrapperRef}
          className="relative flex flex-col items-center justify-center"
          onMouseEnter={() => setHoveredIndex(99)}
        >
          <AnimatePresence>
            {enableTooltips && hoveredIndex === 99 && !isMenuOpen && !activeModal && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.92 }}
                animate={{ opacity: 1, y: -8, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.92 }}
                transition={{ duration: 0.14 }}
                className="absolute -top-9 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap pointer-events-none shadow-lg border z-50 bg-slate-900/95 text-white border-slate-700"
              >
                More Options
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            id="store-profile-more-options-btn"
            aria-label="More Options"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            animate={{
              scale: Number((buttonScale * (hoveredIndex === 99 ? 1.06 : 1)).toFixed(3)),
              y: hoveredIndex === 99 ? -2 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 26,
            }}
            style={{
              backgroundColor: buttonColors.moreBg,
              color: buttonColors.moreText,
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </motion.button>

          {/* CONTINUOUS FLOATING 3D-STYLE MORE OPTIONS CARD (PHASES 1 & 2) */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                ref={menuContainerRef}
                id="store-profile-more-options-card"
                role="menu"
                aria-label="Store More Options"
                initial={{
                  opacity: 0,
                  scale: 0.94,
                  y: openUpwards ? 10 : -10,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.94,
                  y: openUpwards ? 8 : -8,
                }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 30,
                }}
                onClick={(e) => e.stopPropagation()}
                className={`absolute end-0 ${
                  openUpwards ? "bottom-full mb-3" : "top-full mt-3"
                } w-64 sm:w-72 rounded-[24px] p-2 z-[9999] border transition-colors ${
                  isDarkMode
                    ? "bg-slate-900 border-slate-700/80 text-slate-100 shadow-[0_26px_60px_-12px_rgba(0,0,0,0.82),0_4px_16px_-2px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.12)]"
                    : "bg-white border-slate-200 text-slate-800 shadow-[0_24px_54px_-12px_rgba(15,23,42,0.22),0_6px_18px_-4px_rgba(15,23,42,0.08)]"
                }`}
              >
                {/* ONE CONTINUOUS LIST — NO SECTION HEADINGS OR DIVIDERS */}
                <div
                  ref={menuListRef}
                  className="relative flex flex-col gap-0.5 max-h-[min(76vh,520px)] overflow-y-auto scroll-smooth"
                  onMouseLeave={() => updateHoverPillForItem(null)}
                >
                  {/* Smooth GPU-accelerated gliding highlight pill */}
                  <AnimatePresence>
                    {hoveredMenuItemId && hoverPillRect && (
                      <motion.div
                        id="store-more-options-sliding-pill"
                        aria-hidden="true"
                        initial={{
                          y: hoverPillRect.top,
                          height: hoverPillRect.height,
                          opacity: 0,
                          scale: 0.985,
                        }}
                        animate={{
                          y: hoverPillRect.top,
                          height: hoverPillRect.height,
                          opacity: 1,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.985,
                          transition: { duration: 0.14, ease: "easeOut" },
                        }}
                        transition={{
                          y: { type: "spring", stiffness: 360, damping: 32, mass: 0.68 },
                          height: { type: "spring", stiffness: 360, damping: 32, mass: 0.68 },
                          opacity: { duration: 0.16, ease: "easeOut" },
                          scale: { duration: 0.16, ease: "easeOut" },
                        }}
                        style={{
                          backgroundColor: effectiveHeaderHoverBg,
                          willChange: "transform, height, opacity",
                        }}
                        className={`pointer-events-none absolute left-0 right-0 top-0 z-0 rounded-2xl shadow-sm ${
                          isHeaderHoverLight ? "ring-1 ring-slate-900/12" : ""
                        }`}
                      />
                    )}
                  </AnimatePresence>

                  {menuItems.map((item) => {
                    const isHoveredItem = hoveredMenuItemId === item.id;
                    return (
                      <button
                        key={item.id}
                        ref={(el) => {
                          menuItemRefs.current[item.id] = el;
                        }}
                        id={`store-more-option-${item.id}`}
                        type="button"
                        role="menuitem"
                        onMouseEnter={() => updateHoverPillForItem(item.id)}
                        onFocus={() => updateHoverPillForItem(item.id)}
                        onBlur={(e) => {
                          const nextFocused = e.relatedTarget as Node | null;
                          if (!nextFocused || !menuListRef.current?.contains(nextFocused)) {
                            updateHoverPillForItem(null);
                          }
                        }}
                        onClick={() => handleSelectMenuItem(item.id)}
                        style={
                          isHoveredItem
                            ? { color: effectiveHeaderHoverFg }
                            : undefined
                        }
                        className={`group relative z-10 w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-left text-[13px] font-bold transition-colors duration-200 ease-out cursor-pointer active:scale-[0.99] bg-transparent focus:outline-none ${
                          isHoveredItem
                            ? ""
                            : item.isDanger
                            ? isDarkMode
                              ? "text-rose-400"
                              : "text-rose-600"
                            : isDarkMode
                            ? "text-slate-100"
                            : "text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ease-out group-hover:scale-105 ${
                              isHoveredItem
                                ? "bg-white shadow-sm"
                                : item.isDanger
                                ? isDarkMode
                                  ? "bg-rose-950"
                                  : "bg-rose-50"
                                : isDarkMode
                                ? "bg-slate-800 shadow-inner"
                                : "bg-slate-100 shadow-sm"
                            }`}
                          >
                            {renderMenuIcon(item.id)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate leading-tight">{item.label}</div>
                            {item.sublabel && (
                              <div
                                className={`text-[10px] font-semibold truncate mt-0.5 transition-colors duration-200 ease-out ${
                                  isHoveredItem
                                    ? isHeaderHoverLight
                                      ? "text-slate-700"
                                      : "text-white/85"
                                    : "text-amber-500"
                                }`}
                              >
                                {item.sublabel}
                              </div>
                            )}
                          </div>
                        </div>

                        {item.id === "dock_settings" && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 transition-colors duration-200 ease-out ${
                              isHoveredItem
                                ? isHeaderHoverLight
                                  ? "bg-slate-900/12 text-slate-900"
                                  : "bg-white/20 text-white"
                                : "bg-indigo-500/15 text-indigo-500"
                            }`}
                          >
                            Owner
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* DEDICATED MODALS */}
      <ShareStoreModal
        isOpen={activeModal === "share_store"}
        onClose={() => setActiveModal(null)}
        store={fallbackStoreObject}
        storeUrl={storeUrl}
        isDarkMode={isDarkMode}
      />

      <MuteStoreModal
        isOpen={activeModal === "mute_store"}
        onClose={() => setActiveModal(null)}
        store={fallbackStoreObject}
        isAuthenticated={isAuthenticated}
        isCurrentlyMuted={isMuted}
        currentMuteLabel={remainingMuteLabel}
        onConfirmMute={(params) => {
          if (onConfirmMuteStore) onConfirmMuteStore(params);
        }}
        onUnmute={() => {
          if (onUnmuteStore) onUnmuteStore();
        }}
        isDarkMode={isDarkMode}
      />

      {effectiveStrictOwner && (
        <DockSettingsModal
          isOpen={activeModal === "dock_settings"}
          onClose={() => setActiveModal(null)}
          store={fallbackStoreObject}
          publishedSettings={publishedDockSettings}
          onSaveSettings={async (nextSettings) => {
            if (onSaveDockSettings) {
              await onSaveDockSettings(nextSettings);
            }
          }}
          isDarkMode={isDarkMode}
        />
      )}

      <StoreDetailsModal
        isOpen={activeModal === "store_details"}
        onClose={() => setActiveModal(null)}
        store={fallbackStoreObject}
        isDarkMode={isDarkMode}
      />

      <ReportStoreModal
        isOpen={activeModal === "report_store"}
        onClose={() => setActiveModal(null)}
        store={fallbackStoreObject}
        onSubmitReport={async (params) => {
          if (onSubmitStoreReport) {
            return await onSubmitStoreReport(params);
          }
          return { ok: true };
        }}
        isDarkMode={isDarkMode}
      />

      <BlockStoreModal
        isOpen={activeModal === "block_store"}
        onClose={() => setActiveModal(null)}
        store={fallbackStoreObject}
        onConfirmBlock={() => {
          if (onConfirmBlockStore) onConfirmBlockStore();
        }}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
