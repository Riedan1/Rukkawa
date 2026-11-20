import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Share2,
  Copy,
  Check,
  BellOff,
  Bell,
  Clock,
  Sliders,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  Info,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Truck,
  Star,
  Flag,
  Ban,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lock,
  Users,
  AlertTriangle,
} from "lucide-react";
import type { MerchantStore } from "../types";
import {
  DEFAULT_STORE_DOCK_SETTINGS,
  normalizeStoreDockSettings,
  resolveDockGapPixels,
  formatPublicFollowerCountDisplay,
  calculateMuteExpiration,
  extractRealStoreDetailsData,
  buildStoreShareAction,
  REPORT_STORE_REASONS,
  type StoreDockSettings,
  type DockSpacingPreset,
  type DockThemePreset,
  type FollowerCountDisplayMode,
  type PublicStoreNavTabId,
  type MuteDurationPresetId,
  type CustomMuteDurationInput,
  type SharePlatformId,
  type ReportStoreReason,
} from "../utils/storeMoreOptionsLogic";

function ModalBodyPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return <>{children}</>;
  return createPortal(children, document.body);
}

// ============================================================================
// OFFICIAL BRAND SVG ICONS FOR SHARE STORE & SOCIAL LINKS
// ============================================================================

export function SocialPlatformSvgIcon({
  platform,
  className = "w-5 h-5",
}: {
  platform: string;
  className?: string;
}) {
  switch (platform) {
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
        </svg>
      );
    case "messenger":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.13.26.35.27.57l.05 1.78c.04.57.61.94 1.13.71l1.98-.87c.17-.08.36-.1.55-.06.91.25 1.87.38 2.88.38 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm5.95 7.57-2.93 4.65c-.47.74-1.47.92-2.17.4l-2.33-1.75a.6.6 0 0 0-.72 0l-3.15 2.39c-.42.32-.97-.18-.69-.63l2.93-4.65c.47-.74 1.47-.92 2.17-.4l2.33 1.75a.6.6 0 0 0 .72 0l3.15-2.39c.42-.32.97.18.69.63z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.05c-.25.7-1.45 1.34-2.01 1.43-.52.08-1.18.12-1.91-.12-.44-.14-1.01-.33-1.74-.65-3.07-1.33-5.07-4.43-5.22-4.64-.15-.21-1.25-1.66-1.25-3.17 0-1.51.79-2.25 1.07-2.56.28-.31.61-.39.81-.39.2 0 .41.01.59.01.19 0 .44-.07.69.53.25.6.86 2.1.93 2.25.08.15.13.33.03.54-.1.21-.15.33-.3.51-.15.18-.32.4-.45.54-.15.15-.31.32-.13.63.18.31.79 1.31 1.7 2.12 1.17 1.04 2.15 1.37 2.46 1.52.31.15.49.13.67-.08.18-.21.77-.9.98-1.21.2-.31.41-.26.69-.15.28.1 1.79.84 2.1 1 .31.15.51.23.59.36.07.13.07.75-.18 1.45z" />
        </svg>
      );
    case "telegram":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      );
    case "viber":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 2C6.5 2 2 6.1 2 11.3c0 2.7 1.2 5.1 3.2 6.8v3.4c0 .4.5.7.8.4l2.9-1.9c1 .2 2 .3 3.1.3 5.5 0 10-4.1 10-9.3S17.5 2 12 2zm4.8 12.8c-.4 1-1.4 1.7-2.4 1.8-.6.1-1.5-.2-2.6-.7-2.2-1-4.1-2.9-5.1-5.1-.5-1.1-.8-2-.7-2.6.1-1 .8-2 1.8-2.4.4-.1.8.1 1 .4l1.1 1.9c.2.3.1.7-.1 1l-.6.6c-.2.2-.2.5-.1.8.5 1 1.3 1.8 2.3 2.3.3.1.6.1.8-.1l.6-.6c.3-.2.7-.3 1-.1l1.9 1.1c.3.2.5.6.4 1z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25zM12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
        </svg>
      );
    case "snapchat":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 2.5c-3.1 0-5.4 2.2-5.4 5.3 0 .8.1 1.6.2 2.3-.4.2-.9.3-1.4.2-.4-.1-.8.2-.9.6-.1.4.2.8.6 1 .7.3 1.4.6 1.5 1.1.1.7-.9 2.2-2.7 3-.5.2-.7.7-.5 1.2.2.4.7.6 1.3.7.4.1.8.3 1 .8.2.5.6.8 1.1.7.7-.1 1.5-.1 2.4.4.8.5 1.7.7 2.8.7s2-.2 2.8-.7c.9-.5 1.7-.5 2.4-.4.5.1.9-.2 1.1-.7.2-.5.6-.7 1-.8.6-.1 1.1-.3 1.3-.7.2-.5 0-1-.5-1.2-1.8-.8-2.8-2.3-2.7-3 .1-.5.8-.8 1.5-1.1.4-.2.7-.6.6-1-.1-.4-.5-.7-.9-.6-.5.1-1 0-1.4-.2.1-.7.2-1.5.2-2.3 0-3.1-2.3-5.3-5.4-5.3z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "email":
      return <Mail className={className} />;
    default:
      return <Share2 className={className} />;
  }
}

// ============================================================================
// 1. SHARE STORE MODAL (PHASE 3)
// ============================================================================

export interface ShareStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: MerchantStore;
  storeUrl: string;
  isDarkMode?: boolean;
}

const SHARE_PLATFORMS_META: Array<{
  id: SharePlatformId;
  label: string;
  bgClass: string;
  textClass: string;
}> = [
  { id: "facebook", label: "Facebook", bgClass: "bg-[#1877F2]", textClass: "text-white" },
  { id: "messenger", label: "Messenger", bgClass: "bg-[#0084FF]", textClass: "text-white" },
  { id: "whatsapp", label: "WhatsApp", bgClass: "bg-[#25D366]", textClass: "text-white" },
  { id: "telegram", label: "Telegram", bgClass: "bg-[#229ED9]", textClass: "text-white" },
  { id: "viber", label: "Viber", bgClass: "bg-[#7360F2]", textClass: "text-white" },
  {
    id: "instagram",
    label: "Instagram",
    bgClass: "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]",
    textClass: "text-white",
  },
  { id: "snapchat", label: "Snapchat", bgClass: "bg-[#FFFC00]", textClass: "text-slate-950" },
  { id: "tiktok", label: "TikTok", bgClass: "bg-slate-950 dark:bg-slate-800", textClass: "text-white" },
  { id: "x", label: "X", bgClass: "bg-slate-900 dark:bg-slate-800", textClass: "text-white" },
  { id: "email", label: "Email", bgClass: "bg-indigo-600", textClass: "text-white" },
];

export function ShareStoreModal({
  isOpen,
  onClose,
  store,
  storeUrl,
  isDarkMode = false,
}: ShareStoreModalProps) {
  const [copied, setCopied] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = async (customMessage?: string) => {
    try {
      await navigator.clipboard.writeText(storeUrl);
    } catch {
      const input = document.createElement("input");
      input.value = storeUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setStatusFeedback(customMessage || "Store link copied to clipboard!");
    setTimeout(() => {
      setCopied(false);
      setStatusFeedback(null);
    }, 3000);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${store.name} on YUME`,
          text: `Check out ${store.name} on YUME Marketplace!`,
          url: storeUrl,
        });
        setStatusFeedback("Shared via device share sheet!");
        return;
      } catch {
        // User cancelled or browser blocked; fall back to copy link
      }
    }
    await handleCopyLink("Link copied! Paste it anywhere to share.");
  };

  const handlePlatformClick = async (platformId: SharePlatformId, label: string) => {
    const action = buildStoreShareAction({
      platform: platformId,
      storeName: store.name,
      storeUrl,
    });

    if (action.mode === "native_or_copy_fallback") {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: `${store.name} on YUME`,
            text: action.shareText,
            url: storeUrl,
          });
          setStatusFeedback(`Shared via ${label}!`);
          return;
        } catch {
          // Fall back to clipboard copy
        }
      }
      await handleCopyLink(`Store link copied! Ready to paste on ${label}.`);
      return;
    }

    // Direct URL or mailto/viber protocol
    await handleCopyLink(`Opening ${label} share... (Link also copied to clipboard)`);
    const link = document.createElement("a");
    link.href = action.targetUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ModalBodyPortal>
      <div
        className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="yume-share-store-title"
      >
      <div
        className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl transition-all ${
          isDarkMode
            ? "bg-slate-900/95 border-slate-700/80 text-white"
            : "bg-white/95 border-slate-200/90 text-slate-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Share Store modal"
          className={`absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            isDarkMode
              ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Store Header Identity */}
        <div className="flex items-center gap-3.5 mb-5">
          <img
            src={store.logo || store.logoUrl || "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=120"}
            alt={store.name}
            className="w-14 h-14 rounded-2xl object-cover border border-indigo-500/20 shadow-md shrink-0"
          />
          <div className="min-w-0">
            <h2 id="yume-share-store-title" className="text-xl font-black tracking-tight">
              Share Store
            </h2>
            <p className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Share this store with your friends
            </p>
            <p className="text-xs font-bold text-indigo-500 truncate mt-0.5">{store.name}</p>
          </div>
        </div>

        {/* Store URL Bar + Copy Link */}
        <div
          className={`flex items-center gap-2 p-2.5 rounded-2xl border mb-5 ${
            isDarkMode
              ? "bg-slate-950/70 border-slate-800"
              : "bg-slate-50 border-slate-200/80"
          }`}
        >
          <div className="flex-1 min-w-0 px-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Store URL
            </div>
            <div className="text-xs font-semibold truncate select-all">{storeUrl}</div>
          </div>
          <button
            type="button"
            onClick={() => handleCopyLink()}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              copied
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25"
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy Store Link"}
          </button>
        </div>

        {statusFeedback && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusFeedback}</span>
          </div>
        )}

        {/* 10 Official Social Platforms Grid */}
        <div className="grid grid-cols-5 gap-3 mb-5">
          {SHARE_PLATFORMS_META.map((plat) => (
            <button
              key={plat.id}
              type="button"
              onClick={() => handlePlatformClick(plat.id, plat.label)}
              className="group flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-500/10 transition-all"
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform ${plat.bgClass} ${plat.textClass}`}
              >
                <SocialPlatformSvgIcon platform={plat.id} className="w-5 h-5" />
              </div>
              <span
                className={`text-[11px] font-semibold text-center leading-tight ${
                  isDarkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                {plat.label}
              </span>
            </button>
          ))}
        </div>

        {/* Native Share Action */}
        <button
          type="button"
          onClick={handleNativeShare}
          className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
            isDarkMode
              ? "bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-200"
              : "bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-800"
          }`}
        >
          <Share2 className="w-4 h-4 text-indigo-500" />
          Native Share
        </button>
      </div>
    </div>
    </ModalBodyPortal>
  );
}

// ============================================================================
// 2. TELEGRAM-STYLE MUTE STORE MODAL (PHASE 4)
// ============================================================================

export interface MuteStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: MerchantStore;
  isAuthenticated: boolean;
  isCurrentlyMuted: boolean;
  currentMuteLabel?: string;
  onConfirmMute: (params: {
    presetId: MuteDurationPresetId;
    expiresAt: string | null;
    durationLabel: string;
  }) => void;
  onUnmute: () => void;
  isDarkMode?: boolean;
}

const MUTE_PRESETS: Array<{ id: MuteDurationPresetId; label: string; desc: string }> = [
  { id: "1h", label: "1 Hour", desc: "Pause store promotions for 60 minutes" },
  { id: "8h", label: "8 Hours", desc: "Pause during your work or sleep shift" },
  { id: "24h", label: "24 Hours", desc: "Mute store updates for one full day" },
  { id: "7d", label: "7 Days", desc: "Mute promotional alerts for one week" },
  { id: "30d", label: "30 Days", desc: "Mute promotional alerts for one month" },
  { id: "forever", label: "Forever", desc: "Mute indefinitely until manually unmuted" },
  { id: "custom", label: "Custom Duration", desc: "Choose exact Days, Hours, and Minutes" },
];

export function MuteStoreModal({
  isOpen,
  onClose,
  store,
  isAuthenticated,
  isCurrentlyMuted,
  currentMuteLabel,
  onConfirmMute,
  onUnmute,
  isDarkMode = false,
}: MuteStoreModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<MuteDurationPresetId>("8h");
  const [customDuration, setCustomDuration] = useState<CustomMuteDurationInput>({
    days: 3,
    hours: 5,
    minutes: 30,
  });

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const calculated = useMemo(
    () => calculateMuteExpiration(selectedPreset, customDuration),
    [selectedPreset, customDuration]
  );

  if (!isOpen) return null;

  return (
    <ModalBodyPortal>
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="yume-mute-store-title"
    >
      <div
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border p-6 shadow-2xl transition-all ${
          isDarkMode
            ? "bg-slate-900/95 border-slate-700/80 text-white"
            : "bg-white/95 border-slate-200/90 text-slate-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Mute Store modal"
          className={`absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            isDarkMode
              ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <BellOff className="w-6 h-6" />
          </div>
          <div>
            <h2 id="yume-mute-store-title" className="text-xl font-black tracking-tight">
              Mute Store
            </h2>
            <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Control promotional notifications from <span className="font-bold">{store.name}</span>
            </p>
          </div>
        </div>

        {isCurrentlyMuted && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="text-xs">
              <div className="font-bold text-amber-600 dark:text-amber-400">
                Store Currently Muted
              </div>
              <div className={isDarkMode ? "text-slate-300" : "text-slate-600"}>
                {currentMuteLabel || "Promotional alerts are paused"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onUnmute();
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Bell className="w-3.5 h-3.5" />
              Unmute Store
            </button>
          </div>
        )}

        {/* Duration Options — Clean 2-Column Telegram-Style Preset Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3.5">
          {MUTE_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            const isCustom = preset.id === "custom";
            return (
              <label
                key={preset.id}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border cursor-pointer transition-all ${
                  isCustom ? "sm:col-span-2" : ""
                } ${
                  isSelected
                    ? isDarkMode
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-indigo-50/90 border-indigo-500 text-slate-900"
                    : isDarkMode
                    ? "bg-slate-800/50 border-slate-800 hover:border-slate-700"
                    : "bg-slate-50/80 border-slate-200/70 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="radio"
                    name="mute_duration_preset"
                    value={preset.id}
                    checked={isSelected}
                    onChange={() => setSelectedPreset(preset.id)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight">{preset.label}</div>
                    <div className={`text-[10.5px] truncate ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {preset.desc}
                    </div>
                  </div>
                </div>
                <Clock className={`w-3.5 h-3.5 shrink-0 ml-2 ${isSelected ? "text-indigo-500" : "text-slate-400"}`} />
              </label>
            );
          })}
        </div>

        {/* Custom Duration Picker (Days / Hours / Minutes) */}
        {selectedPreset === "custom" && (
          <div
            className={`p-4 rounded-2xl border mb-4 ${
              isDarkMode ? "bg-slate-950/70 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="text-xs font-bold mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              Custom Mute Duration
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Days
                </label>
                <input
                  type="number"
                  min={0}
                  max={365}
                  aria-label="Custom Mute Days"
                  value={customDuration.days}
                  onChange={(e) =>
                    setCustomDuration((prev) => ({
                      ...prev,
                      days: Math.max(0, Math.min(365, Number(e.target.value) || 0)),
                    }))
                  }
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-bold ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-700 text-white"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Hours
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  aria-label="Custom Mute Hours"
                  value={customDuration.hours}
                  onChange={(e) =>
                    setCustomDuration((prev) => ({
                      ...prev,
                      hours: Math.max(0, Math.min(23, Number(e.target.value) || 0)),
                    }))
                  }
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-bold ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-700 text-white"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Minutes
                </label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  aria-label="Custom Mute Minutes"
                  value={customDuration.minutes}
                  onChange={(e) =>
                    setCustomDuration((prev) => ({
                      ...prev,
                      minutes: Math.max(0, Math.min(59, Number(e.target.value) || 0)),
                    }))
                  }
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-bold ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-700 text-white"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Calculated Expiration Preview */}
        <div
          className={`p-3.5 rounded-2xl border mb-4 ${
            isDarkMode
              ? "bg-indigo-950/30 border-indigo-500/30 text-indigo-200"
              : "bg-indigo-50/70 border-indigo-200 text-indigo-950"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">
            Mute Duration & Expiration Preview
          </div>
          <div className="text-xs font-extrabold mt-0.5">{calculated.durationLabel}</div>
          <div className="text-[11px] opacity-80 mt-0.5">
            {calculated.expiresAt
              ? `Automatically unmutes on ${calculated.formattedPreview}`
              : calculated.formattedPreview}
          </div>
        </div>

        {/* Important Transactional Preservation & Guest Persistence Notice */}
        <div
          className={`p-3 rounded-2xl text-[11px] space-y-1.5 mb-5 ${
            isDarkMode ? "bg-slate-800/70 text-slate-300" : "bg-slate-100 text-slate-600"
          }`}
        >
          <div className="font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Transactional & Direct Messages Preserved
          </div>
          <p>
            Muting only pauses promotional notifications (New Stories, Offers, Product drops). Direct
            messages, order confirmations, shipping updates, and payment alerts remain active.
          </p>
          {!isAuthenticated && (
            <p className="text-amber-600 dark:text-amber-400 font-medium pt-1 border-t border-slate-500/20">
              Guest Mode: Your mute preference is saved in this browser and may not sync across
              devices or persist if browser storage is cleared.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              isDarkMode
                ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmMute({
                presetId: selectedPreset,
                expiresAt: calculated.expiresAt,
                durationLabel: calculated.durationLabel,
              });
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all"
          >
            Confirm Mute
          </button>
        </div>
      </div>
    </div>
    </ModalBodyPortal>
  );
}

// ============================================================================
// 3. STRICT OWNER-ONLY DOCK SETTINGS MODAL (PHASE 5)
// ============================================================================

export interface DockSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: MerchantStore;
  publishedSettings: StoreDockSettings;
  onSaveSettings: (nextSettings: StoreDockSettings) => Promise<void> | void;
  isDarkMode?: boolean;
}

const PUBLIC_NAV_ITEMS_CONFIG: Array<{
  id: PublicStoreNavTabId;
  label: string;
  desc: string;
}> = [
  { id: "reels", label: "1. Reels", desc: "Short video showcase tab and full-screen reels player" },
  { id: "compare", label: "2. Compare", desc: "Side-by-side product comparison drawer and tab" },
  { id: "picks", label: "3. Picks", desc: "Curated merchant picks and featured highlights" },
  { id: "reviews", label: "4. Reviews", desc: "Customer reviews tab and store rating breakdown" },
  { id: "saved", label: "5. Saved", desc: "Visitor saved items and wishlist tab for this store" },
  { id: "deals", label: "6. Deals", desc: "Active flash deals, bundles, and discounted offers tab" },
  { id: "search", label: "7. Search", desc: "In-store product search input bar" },
  { id: "filters", label: "8. Filters", desc: "Category, price, and attribute filter controls" },
  { id: "layout", label: "9. Layout", desc: "Grid density and card layout switcher buttons" },
];

export function DockSettingsModal({
  isOpen,
  onClose,
  store,
  publishedSettings,
  onSaveSettings,
  isDarkMode = false,
}: DockSettingsModalProps) {
  const [activeSection, setActiveSection] = useState<"appearance" | "visibility">("appearance");
  const [draft, setDraft] = useState<StoreDockSettings>(() =>
    normalizeStoreDockSettings(publishedSettings)
  );
  const [isSaving, setIsSaving] = useState(false);
  const wasOpenRef = useRef(false);
  const loadedStoreIdRef = useRef<string | null>(null);

  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    const storeChangedWhileOpen = isOpen && loadedStoreIdRef.current !== store.id;
    if (justOpened || storeChangedWhileOpen) {
      setDraft(normalizeStoreDockSettings(publishedSettings));
      loadedStoreIdRef.current = store.id;
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, store.id, publishedSettings]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const previewGapPx = resolveDockGapPixels(draft.appearance);
  const previewFollowerBadge = formatPublicFollowerCountDisplay(
    store.followersCount ?? 12500,
    draft.visibility.followerCountMode
  );

  const previewThemeContainerClasses = {
    frosted: isDarkMode
      ? "bg-slate-900/80 border-slate-700/80 shadow-lg"
      : "bg-white/90 border-slate-200/90 shadow-lg",
    obsidian: "bg-slate-950/95 border-slate-800 text-white shadow-xl",
    aurora:
      "bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-emerald-950/90 border-indigo-500/40 text-white shadow-xl",
    neon: "bg-slate-950/95 border-fuchsia-500/60 shadow-[0_0_24px_rgba(217,70,239,0.28)] text-white",
  }[draft.appearance.theme];

  const handleResetToDefault = () => {
    setDraft(normalizeStoreDockSettings(DEFAULT_STORE_DOCK_SETTINGS));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const normalized = normalizeStoreDockSettings(draft);
      await onSaveSettings(normalized);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalBodyPortal>
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="yume-dock-settings-title"
    >
      <div
        className={`relative w-full md:w-[52%] md:min-w-[640px] max-w-4xl h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDarkMode
            ? "bg-slate-900/95 border-slate-700/80 text-white"
            : "bg-white/95 border-slate-200/90 text-slate-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
            isDarkMode ? "border-slate-800" : "border-slate-200/80"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="yume-dock-settings-title" className="text-lg font-black tracking-tight">
                  Dock Settings
                </h2>
              </div>
              <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Customize public dock appearance and store profile visibility for all visitors
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Dock Settings modal"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isDarkMode
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Isolated Live Preview Bar */}
        <div
          className={`px-6 py-4 border-b shrink-0 ${
            isDarkMode ? "bg-slate-950/70 border-slate-800" : "bg-slate-50/90 border-slate-200/80"
          }`}
        >
          <div className="flex items-center justify-end mb-2.5">
            <span className={`text-[11px] font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Theme: <strong className="capitalize">{draft.appearance.theme}</strong> • Scale:{" "}
              <strong>{Math.round(draft.appearance.buttonScale * 100)}%</strong> • Gap:{" "}
              <strong>{previewGapPx}px</strong>
            </span>
          </div>

          <div
            className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all ${previewThemeContainerClasses}`}
          >
            {/* Preview Store Metadata */}
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={
                  store.logo ||
                  store.logoUrl ||
                  "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=120"
                }
                alt={store.name}
                className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-sm font-black truncate">{store.name}</div>
                <div className="flex items-center gap-2.5 text-[11px] font-bold opacity-85 mt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {previewFollowerBadge.labelText && <span>{previewFollowerBadge.labelText}</span>}
                  </span>
                  {draft.visibility.showStoreLocation && (
                    <>
                      <span>|</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{store.wilaya || "Alger"}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Dock Buttons */}
            <div className="flex items-center" style={{ gap: `${previewGapPx}px` }}>
              <span
                style={{
                  backgroundColor: draft.appearance.buttonColors.followBg,
                  color: draft.appearance.buttonColors.followText,
                  transform: `scale(${draft.appearance.buttonScale})`,
                  transformOrigin: "center",
                }}
                className="px-4 py-2 rounded-full text-xs font-bold shadow-md inline-flex items-center gap-1.5 transition-transform"
              >
                Following
              </span>
              <span
                style={{
                  backgroundColor: draft.appearance.buttonColors.messageBg,
                  color: draft.appearance.buttonColors.messageText,
                  transform: `scale(${draft.appearance.buttonScale})`,
                  transformOrigin: "center",
                }}
                className="px-4 py-2 rounded-full text-xs font-bold shadow-md inline-flex items-center gap-1.5 transition-transform"
              >
                Message
              </span>
              <span
                style={{
                  backgroundColor: draft.appearance.buttonColors.moreBg,
                  color: draft.appearance.buttonColors.moreText,
                  transform: `scale(${draft.appearance.buttonScale})`,
                  transformOrigin: "center",
                }}
                className="w-9 h-9 rounded-full text-xs font-bold shadow-md inline-flex items-center justify-center transition-transform"
              >
                •••
              </span>
            </div>
          </div>
        </div>

        {/* Section Switcher Tabs: A. Appearance | B. Visibility */}
        <div
          className={`flex items-center gap-2 px-6 pt-3 border-b shrink-0 ${
            isDarkMode ? "border-slate-800" : "border-slate-200/80"
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveSection("appearance")}
            className={`pb-3 px-4 text-xs font-black border-b-2 transition-all flex items-center gap-2 ${
              activeSection === "appearance"
                ? "border-indigo-500 text-indigo-500"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <Sliders className="w-4 h-4" />
            A. Appearance
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("visibility")}
            className={`pb-3 px-4 text-xs font-black border-b-2 transition-all flex items-center gap-2 ${
              activeSection === "visibility"
                ? "border-indigo-500 text-indigo-500"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <Eye className="w-4 h-4" />
            B. Visibility
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSection === "appearance" ? (
            <>
              {/* 1. Button Size & 2. Button Spacing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-2xl border ${
                    isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200/80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="dock-button-size-slider"
                      className="text-xs font-black"
                    >
                      Button Size
                    </label>
                    <span className="text-xs font-bold text-indigo-500">
                      {Math.round(draft.appearance.buttonScale * 100)}%
                    </span>
                  </div>
                  <input
                    id="dock-button-size-slider"
                    type="range"
                    min={0.85}
                    max={1.25}
                    step={0.05}
                    value={draft.appearance.buttonScale}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        appearance: {
                          ...prev.appearance,
                          buttonScale: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Compact (85%)</span>
                    <span>Default (100%)</span>
                    <span>Large (125%)</span>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200/80"
                  }`}
                >
                  <div className="text-xs font-black mb-2">Button Spacing</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["small", "medium", "large", "custom"] as DockSpacingPreset[]).map(
                      (preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              appearance: {
                                ...prev.appearance,
                                spacingPreset: preset,
                              },
                            }))
                          }
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold capitalize border transition-all ${
                            draft.appearance.spacingPreset === preset
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : isDarkMode
                              ? "bg-slate-900 border-slate-700 text-slate-300"
                              : "bg-white border-slate-200 text-slate-700"
                          }`}
                        >
                          {preset}
                        </button>
                      )
                    )}
                  </div>
                  {draft.appearance.spacingPreset === "custom" && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span>Custom Gap</span>
                        <span className="text-indigo-500">{draft.appearance.customGapPx}px</span>
                      </div>
                      <input
                        type="range"
                        min={4}
                        max={28}
                        step={2}
                        aria-label="Custom Button Spacing Pixels"
                        value={draft.appearance.customGapPx}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            appearance: {
                              ...prev.appearance,
                              customGapPx: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Dock Themes */}
              <div>
                <div className="text-xs font-black mb-2.5">Dock Themes</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(
                    [
                      { id: "frosted", label: "Frosted", desc: "Soft translucent YUME glass" },
                      { id: "obsidian", label: "Obsidian", desc: "Deep carbon matte finish" },
                      { id: "aurora", label: "Aurora", desc: "Iridescent indigo-emerald glow" },
                      { id: "neon", label: "Neon", desc: "High-contrast cyber accent rim" },
                    ] as Array<{ id: DockThemePreset; label: string; desc: string }>
                  ).map((themeItem) => {
                    const isSelected = draft.appearance.theme === themeItem.id;
                    return (
                      <button
                        key={themeItem.id}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            appearance: {
                              ...prev.appearance,
                              theme: themeItem.id,
                            },
                          }))
                        }
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/10"
                            : isDarkMode
                            ? "bg-slate-800/40 border-slate-800 hover:border-slate-700"
                            : "bg-slate-50 border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        <div className="text-xs font-black">{themeItem.label}</div>
                        <div
                          className={`text-[10px] mt-0.5 ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {themeItem.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Individual Button Colors */}
              <div>
                <div className="text-xs font-black mb-2.5">Individual Button Colors</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      title: "Follow / Following Button",
                      bgKey: "followBg" as const,
                      textKey: "followText" as const,
                    },
                    {
                      title: "Message Button",
                      bgKey: "messageBg" as const,
                      textKey: "messageText" as const,
                    },
                    {
                      title: "More Options Button",
                      bgKey: "moreBg" as const,
                      textKey: "moreText" as const,
                    },
                  ].map((btnCfg) => (
                    <div
                      key={btnCfg.title}
                      className={`p-3.5 rounded-2xl border ${
                        isDarkMode
                          ? "bg-slate-800/40 border-slate-800"
                          : "bg-slate-50 border-slate-200/80"
                      }`}
                    >
                      <div className="text-xs font-bold mb-2.5">{btnCfg.title}</div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] opacity-75">Background</span>
                        <input
                          type="color"
                          aria-label={`${btnCfg.title} Background Color`}
                          value={draft.appearance.buttonColors[btnCfg.bgKey]}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              appearance: {
                                ...prev.appearance,
                                buttonColors: {
                                  ...prev.appearance.buttonColors,
                                  [btnCfg.bgKey]: e.target.value,
                                },
                              },
                            }))
                          }
                          className="w-8 h-7 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] opacity-75">Text / Icon</span>
                        <input
                          type="color"
                          aria-label={`${btnCfg.title} Text Color`}
                          value={draft.appearance.buttonColors[btnCfg.textKey]}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              appearance: {
                                ...prev.appearance,
                                buttonColors: {
                                  ...prev.appearance.buttonColors,
                                  [btnCfg.textKey]: e.target.value,
                                },
                              },
                            }))
                          }
                          className="w-8 h-7 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Independent Switches for Tooltips & Active Navigation Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer ${
                    isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200/80"
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">Enable / Disable Tooltips</div>
                    <div className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Show floating hover labels above dock controls
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={draft.appearance.enableTooltips}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        appearance: {
                          ...prev.appearance,
                          enableTooltips: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </label>

                <label
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer ${
                    isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200/80"
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">
                      Enable / Disable Active Navigation Indicators
                    </div>
                    <div className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Highlight active navigation tabs with indicator pill/dot
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={draft.appearance.enableActiveIndicators}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        appearance: {
                          ...prev.appearance,
                          enableActiveIndicators: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </label>
              </div>
            </>
          ) : (
            <>
              {/* B1. Follower Count Display */}
              <div>
                <div className="text-xs font-black mb-1">Follower Count Display</div>
                <p className={`text-[11px] mb-3 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Control how your follower count appears on your public Store Profile. Real follower
                  counts remain preserved in the database.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(
                    [
                      {
                        mode: "actual" as FollowerCountDisplayMode,
                        title: "1. Show actual follower count",
                        example: "12.5K Followers",
                      },
                      {
                        mode: "icon_only" as FollowerCountDisplayMode,
                        title: "2. Show only followers icon without number",
                        example: "Icon only (No count)",
                      },
                      {
                        mode: "hidden_label" as FollowerCountDisplayMode,
                        title: "3. Hide actual count and display privacy label",
                        example: "Not Available",
                      },
                    ]
                  ).map((opt) => {
                    const isSelected = draft.visibility.followerCountMode === opt.mode;
                    return (
                      <button
                        key={opt.mode}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            visibility: {
                              ...prev.visibility,
                              followerCountMode: opt.mode,
                            },
                          }))
                        }
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/10"
                            : isDarkMode
                            ? "bg-slate-800/40 border-slate-800 hover:border-slate-700"
                            : "bg-slate-50 border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        <div className="text-xs font-black">{opt.title}</div>
                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-500 text-[10px] font-bold">
                          <Users className="w-3 h-3" />
                          <span>{opt.example}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* B2. Store Location Visibility */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                  isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200/80"
                }`}
              >
                <div>
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    Store Location Visibility
                  </div>
                  <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {draft.visibility.showStoreLocation
                      ? "Show Store Location: Visitors can see your store location and interactive map."
                      : "Hide Store Location: Public location and map are hidden without deleting saved coordinates."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      visibility: {
                        ...prev.visibility,
                        showStoreLocation: !prev.visibility.showStoreLocation,
                      },
                    }))
                  }
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                    draft.visibility.showStoreLocation
                      ? "bg-emerald-600 text-white"
                      : isDarkMode
                      ? "bg-slate-700 text-slate-300"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {draft.visibility.showStoreLocation ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      Show Store Location
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      Hide Store Location
                    </>
                  )}
                </button>
              </div>

              {/* B3. Public Navigation Visibility (Products Locked On + 9 Independent Switches) */}
              <div>
                <div className="text-xs font-black mb-1">Public Navigation Visibility</div>
                <p className={`text-[11px] mb-3 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Control which navigation items and pages appear on your public Store Profile.
                  Disabling an item hides both the button and its entire tab/page view while
                  preserving all saved data.
                </p>

                <div className="space-y-2">
                  {/* Locked Products Row */}
                  <div
                    className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                      isDarkMode
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : "bg-emerald-50/70 border-emerald-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <div className="text-xs font-black">Products (Always Visible)</div>
                        <div className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                          Core storefront catalog — permanently enabled for all visitors
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                      Always On
                    </span>
                  </div>

                  {/* 9 Independent Switches */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {PUBLIC_NAV_ITEMS_CONFIG.map((navItem) => {
                      const isEnabled = draft.visibility.navigation[navItem.id];
                      return (
                        <label
                          key={navItem.id}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isEnabled
                              ? isDarkMode
                                ? "bg-slate-800/60 border-slate-700"
                                : "bg-white border-slate-200"
                              : isDarkMode
                              ? "bg-slate-900/40 border-slate-800/70 opacity-65"
                              : "bg-slate-100/70 border-slate-200/50 opacity-65"
                          }`}
                        >
                          <div className="pr-2">
                            <div className="text-xs font-black">{navItem.label}</div>
                            <div
                              className={`text-[10px] leading-tight mt-0.5 ${
                                isDarkMode ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              {navItem.desc}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) =>
                              setDraft((prev) => ({
                                ...prev,
                                visibility: {
                                  ...prev.visibility,
                                  navigation: {
                                    ...prev.visibility.navigation,
                                    products: true,
                                    [navItem.id]: e.target.checked,
                                  },
                                },
                              }))
                            }
                            className="w-4 h-4 accent-indigo-600 rounded shrink-0"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer: Reset to Default | Cancel | Save Changes */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t shrink-0 ${
            isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200/80"
          }`}
        >
          <button
            type="button"
            onClick={handleResetToDefault}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors ${
              isDarkMode
                ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  : "bg-slate-200/80 hover:bg-slate-300/80 text-slate-700"
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalBodyPortal>
  );
}

// ============================================================================
// 4. COMPREHENSIVE STORE DETAILS MODAL (PHASE 6 — 100% REAL MERCHANT DATA)
// ============================================================================

export interface StoreDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: MerchantStore;
  isDarkMode?: boolean;
}

export function StoreDetailsModal({
  isOpen,
  onClose,
  store,
  isDarkMode = false,
}: StoreDetailsModalProps) {
  const [showAllWilayas, setShowAllWilayas] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const vm = useMemo(() => extractRealStoreDetailsData(store), [store]);

  if (!isOpen) return null;

  return (
    <ModalBodyPortal>
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="yume-store-details-title"
    >
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDarkMode
            ? "bg-slate-900/95 border-slate-700/80 text-white"
            : "bg-white/95 border-slate-200/90 text-slate-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
            isDarkMode ? "border-slate-800" : "border-slate-200/80"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 id="yume-store-details-title" className="text-lg font-black tracking-tight">
                Store Details
              </h2>
              <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Verified store profile and merchant information
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Store Details modal"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isDarkMode
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable 6 Sections */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 6.1 Store Identity */}
          <section
            className={`p-5 rounded-2xl border ${
              isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50/90 border-slate-200/80"
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">
              Store Identity
            </div>
            <div className="flex items-start gap-4">
              <img
                src={
                  vm.identity.logo ||
                  "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=120"
                }
                alt={vm.identity.name}
                className="w-16 h-16 rounded-2xl object-cover border border-indigo-500/20 shadow-md shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black">{vm.identity.name}</h3>
                  {vm.identity.verified && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-bold inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                {vm.identity.bio && (
                  <p className="text-xs font-semibold text-indigo-500 mt-1">{vm.identity.bio}</p>
                )}
                {vm.identity.description && (
                  <p
                    className={`text-xs mt-2 leading-relaxed ${
                      isDarkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {vm.identity.description}
                  </p>
                )}
                <div
                  className={`mt-3 pt-3 border-t flex flex-wrap items-center gap-4 text-[11px] ${
                    isDarkMode
                      ? "border-slate-700/70 text-slate-400"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  <span>
                    Store Creation Date: <strong className="text-current">{vm.identity.createdAtLabel}</strong>
                  </span>
                  {vm.identity.categories.length > 0 && (
                    <span>
                      Categories: <strong className="text-current">{vm.identity.categories.join(", ")}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 6.2 Contact Information */}
          {vm.contact.hasAnyContact && (
            <section
              className={`p-5 rounded-2xl border ${
                isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50/90 border-slate-200/80"
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">
                Contact Information
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {vm.contact.primaryPhone && (
                  <a
                    href={`tel:${vm.contact.primaryPhone}`}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                      isDarkMode
                        ? "bg-slate-900/70 border-slate-700 hover:border-indigo-500"
                        : "bg-white border-slate-200 hover:border-indigo-500"
                    }`}
                  >
                    <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 font-bold">Primary Phone</div>
                      <div className="font-bold truncate">{vm.contact.primaryPhone}</div>
                    </div>
                  </a>
                )}

                {vm.contact.additionalPhones.map((phone, idx) => (
                  <a
                    key={phone}
                    href={`tel:${phone}`}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                      isDarkMode
                        ? "bg-slate-900/70 border-slate-700 hover:border-indigo-500"
                        : "bg-white border-slate-200 hover:border-indigo-500"
                    }`}
                  >
                    <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 font-bold">
                        Additional Phone {idx + 1}
                      </div>
                      <div className="font-bold truncate">{phone}</div>
                    </div>
                  </a>
                ))}

                {vm.contact.officialEmail && (
                  <a
                    href={`mailto:${vm.contact.officialEmail}`}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                      isDarkMode
                        ? "bg-slate-900/70 border-slate-700 hover:border-indigo-500"
                        : "bg-white border-slate-200 hover:border-indigo-500"
                    }`}
                  >
                    <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 font-bold">Official Email</div>
                      <div className="font-bold truncate">{vm.contact.officialEmail}</div>
                    </div>
                  </a>
                )}

                {vm.contact.whatsapp && (
                  <a
                    href={`https://wa.me/${vm.contact.whatsapp.replace(/[^\d+]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                      isDarkMode
                        ? "bg-slate-900/70 border-slate-700 hover:border-emerald-500"
                        : "bg-white border-slate-200 hover:border-emerald-500"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 font-bold">WhatsApp Contact</div>
                      <div className="font-bold truncate">{vm.contact.whatsapp}</div>
                    </div>
                  </a>
                )}
              </div>
            </section>
          )}

          {/* 6.3 Store Location (Strictly respects Store Location Visibility setting) */}
          {vm.location.visible && (vm.location.wilaya || vm.location.address || vm.location.coordinates) && (
            <section
              className={`p-5 rounded-2xl border ${
                isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50/90 border-slate-200/80"
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">
                Store Location
              </div>
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-black">
                    {[vm.location.city, vm.location.wilaya].filter(Boolean).join(", ") ||
                      "Store Location"}
                  </div>
                  {vm.location.address && (
                    <div className={`mt-0.5 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                      {vm.location.address}
                    </div>
                  )}
                </div>
              </div>

              {vm.location.coordinates && (
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-500/20 bg-slate-950/20">
                  <iframe
                    title={`${vm.identity.name} Store Location Map`}
                    width="100%"
                    height="100%"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                      vm.location.coordinates.lng - 0.03
                    }%2C${vm.location.coordinates.lat - 0.02}%2C${
                      vm.location.coordinates.lng + 0.03
                    }%2C${vm.location.coordinates.lat + 0.02}&layer=mapnik&marker=${
                      vm.location.coordinates.lat
                    }%2C${vm.location.coordinates.lng}`}
                    className="border-0 w-full h-full"
                  />
                </div>
              )}
            </section>
          )}

          {/* 6.4 Delivery Information (Actual configured delivery coverage) */}
          <section
            className={`p-5 rounded-2xl border ${
              isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50/90 border-slate-200/80"
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">
              Delivery Information
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black">{vm.delivery.summaryLabel}</div>
                  {vm.delivery.activeCarriers.length > 0 && (
                    <div className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Couriers: {vm.delivery.activeCarriers.join(" • ")}
                    </div>
                  )}
                </div>
              </div>

              {vm.delivery.coveredWilayasList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllWilayas((prev) => !prev)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200"
                      : "bg-white border-slate-200 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <span>
                    {showAllWilayas ? "Hide Covered Wilayas" : "View Covered Wilayas"}
                  </span>
                  {showAllWilayas ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>

            {showAllWilayas && vm.delivery.coveredWilayasList.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-500/20 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                {vm.delivery.coveredWilayasList.map((w) => (
                  <div
                    key={w.code}
                    className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between ${
                      isDarkMode
                        ? "bg-slate-900/70 border-slate-800"
                        : "bg-white border-slate-200/80"
                    }`}
                  >
                    <span className="font-bold truncate">
                      {w.code} - {w.name}
                    </span>
                    {typeof w.homeRateDzd === "number" && (
                      <span className="text-[10px] font-black text-emerald-500 shrink-0 ml-1">
                        {w.homeRateDzd} DA
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 6.5 Social Media */}
          {vm.socials.length > 0 && (
            <section
              className={`p-5 rounded-2xl border ${
                isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50/90 border-slate-200/80"
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">
                Social Media
              </div>
              <div className="flex flex-wrap gap-2.5">
                {vm.socials.map((soc) => (
                  <a
                    key={soc.id}
                    href={soc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold inline-flex items-center gap-2 transition-all hover:scale-[1.02] ${
                      isDarkMode
                        ? "bg-slate-900 border-slate-700 hover:border-indigo-500 text-slate-200"
                        : "bg-white border-slate-200 hover:border-indigo-500 text-slate-800"
                    }`}
                  >
                    <SocialPlatformSvgIcon platform={soc.id} className="w-4 h-4 text-indigo-500" />
                    <span>{soc.label}</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 6.6 Store Rating */}
          <section
            className={`p-5 rounded-2xl border ${
              isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50/90 border-slate-200/80"
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">
              Store Rating
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="text-center sm:text-left shrink-0">
                <div className="text-3xl font-black tracking-tight">
                  {vm.rating.averageRating.toFixed(2)}
                </div>
                <div className="flex items-center gap-1 text-amber-400 my-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(vm.rating.averageRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-400"
                      }`}
                    />
                  ))}
                </div>
                <div className={`text-xs font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {vm.rating.totalReviewsCount}{" "}
                  {vm.rating.totalReviewsCount === 1 ? "Verified Review" : "Verified Reviews"}
                </div>
              </div>

              <div className="flex-1 w-full space-y-1.5">
                {vm.rating.distribution.map((row) => (
                  <div key={row.stars} className="flex items-center gap-2.5 text-xs">
                    <span className="w-12 font-bold text-right shrink-0">{row.stars} ★</span>
                    <div
                      className={`flex-1 h-2 rounded-full overflow-hidden ${
                        isDarkMode ? "bg-slate-800" : "bg-slate-200"
                      }`}
                    >
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                    <span
                      className={`w-10 text-[11px] font-semibold ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
    </ModalBodyPortal>
  );
}

// ============================================================================
// 5. REPORT STORE MODAL (PHASE 8)
// ============================================================================

export interface ReportStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: MerchantStore;
  onSubmitReport: (params: {
    primaryReason: ReportStoreReason;
    additionalDetails: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  isDarkMode?: boolean;
}

export function ReportStoreModal({
  isOpen,
  onClose,
  store,
  onSubmitReport,
  isDarkMode = false,
}: ReportStoreModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportStoreReason>("Fake Store");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedReason("Fake Store");
      setAdditionalDetails("");
      setSubmittedSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await onSubmitReport({
        primaryReason: selectedReason,
        additionalDetails,
      });
      if (!res.ok) {
        setErrorMessage(res.error || "Unable to submit report right now.");
      } else {
        setSubmittedSuccess(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalBodyPortal>
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="yume-report-store-title"
    >
      <div
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border p-6 shadow-2xl transition-all ${
          isDarkMode
            ? "bg-slate-900/95 border-slate-700/80 text-white"
            : "bg-white/95 border-slate-200/90 text-slate-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Report Store modal"
          className={`absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            isDarkMode
              ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {submittedSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 id="yume-report-store-title" className="text-xl font-black">
              Report Submitted
            </h2>
            <p
              className={`text-xs leading-relaxed max-w-md mx-auto ${
                isDarkMode ? "text-slate-300" : "text-slate-600"
              }`}
            >
              Thank you for helping keep YUME safe. Your report has been successfully submitted and
              will be reviewed by our administration team.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <Flag className="w-6 h-6" />
              </div>
              <div>
                <h2 id="yume-report-store-title" className="text-xl font-black tracking-tight">
                  Report this store
                </h2>
                <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Help us keep YUME safe by telling us what&apos;s wrong.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 8.1 Primary Reason (8 single-select radio buttons) */}
            <div className="mb-4">
              <div className="text-xs font-black mb-2">Primary Reason</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {REPORT_STORE_REASONS.map((reason, idx) => {
                  const isSelected = selectedReason === reason;
                  return (
                    <label
                      key={reason}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer text-xs font-bold transition-all ${
                        isSelected
                          ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : isDarkMode
                          ? "bg-slate-800/50 border-slate-800 hover:border-slate-700"
                          : "bg-slate-50 border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="report_primary_reason"
                        value={reason}
                        checked={isSelected}
                        onChange={() => setSelectedReason(reason)}
                        className="w-4 h-4 accent-rose-600"
                      />
                      <span>
                        {idx + 1}. {reason}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 8.2 Additional Details */}
            <div className="mb-5">
              <label
                htmlFor="report-additional-details"
                className="block text-xs font-black mb-1.5"
              >
                Additional Details
              </label>
              <textarea
                id="report-additional-details"
                rows={3}
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Please provide additional details about this report..."
                className={`w-full p-3.5 rounded-2xl border text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-500/40 ${
                  isDarkMode
                    ? "bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                }`}
              />
              <p className={`text-[11px] mt-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Your report is confidential. {store.name} will never be notified of your identity.
              </p>
            </div>

            {/* 8.3 Submit Report */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  isDarkMode
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
    </ModalBodyPortal>
  );
}

// ============================================================================
// 6. ONE-SIDED BLOCK STORE CONFIRMATION MODAL (PHASE 10)
// ============================================================================

export interface BlockStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: MerchantStore;
  onConfirmBlock: () => void;
  isDarkMode?: boolean;
}

export function BlockStoreModal({
  isOpen,
  onClose,
  store,
  onConfirmBlock,
  isDarkMode = false,
}: BlockStoreModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <ModalBodyPortal>
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="yume-block-store-title"
    >
      <div
        className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl transition-all ${
          isDarkMode
            ? "bg-slate-900/95 border-slate-700/80 text-white"
            : "bg-white/95 border-slate-200/90 text-slate-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <h2 id="yume-block-store-title" className="text-xl font-black tracking-tight">
              Block this store?
            </h2>
            <p className={`text-xs font-bold text-rose-500`}>{store.name}</p>
          </div>
        </div>

        <p
          className={`text-xs leading-relaxed mb-4 ${
            isDarkMode ? "text-slate-300" : "text-slate-600"
          }`}
        >
          Blocking this store will prevent you from interacting with it and viewing its content.
        </p>

        <div
          className={`p-3.5 rounded-2xl text-[11px] space-y-1.5 mb-6 ${
            isDarkMode ? "bg-slate-800/70 text-slate-300" : "bg-slate-100 text-slate-600"
          }`}
        >
          <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Your Order & Message History Remains Safe
          </div>
          <p>
            Existing orders, previous messages, shipping updates, payment records, and transaction
            history are preserved. The merchant will not be notified, and you can unblock this store
            at any time.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              isDarkMode
                ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmBlock();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all"
          >
            Block Store
          </button>
        </div>
      </div>
    </div>
    </ModalBodyPortal>
  );
}
