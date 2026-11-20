import React, { useState, useMemo } from "react";
import {
  Palette,
  RefreshCw,
  Clock,
  Lock,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  UploadCloud,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Link2,
  MousePointerClick,
  Layout,
  ShieldCheck,
} from "lucide-react";
import {
  YUME_ADMIN_TOKENS,
  YumeAdminSectionHeader,
  YumeAdminAdviceBanner,
  YumeAdminToggle,
} from "./YumeAdminDesignSystem";
import {
  BrandColorGroupId,
  BrandColorItem,
  RotationMode,
  PHASE1_NEW_YUME_BRAND_COLORS,
  ROTATION_INTERVAL_PRESETS,
  BRAND_COLOR_GROUP_ORDER,
  validateAndNormalizeHex,
  getContrastRatio,
  isLightColor,
  getContrastSafeForeground,
  getEnabledColors,
  canRemoveOrDisableColor,
  addColorToGroup,
  updateColorInGroup,
  removeColorFromGroup,
  reorderColorInGroup,
  updateGroupRotation,
  resolveAllGroupsState,
  computeFooterGradientCSS,
  useBrandIdentityColorEngine,
} from "../utils/brandIdentityColorSystem";

interface BrandIdentityColorManagerProps {
  darkMode: boolean;
  setDarkMode?: (val: boolean | ((prev: boolean) => boolean)) => void;
  adminUsername?: string;
}

const GROUP_ICONS: Record<BrandColorGroupId, React.ComponentType<{ className?: string }>> = {
  header: Layout,
  footer: Layers,
  buttons: MousePointerClick,
  links: Link2,
  backgrounds: Sun,
  accents: Sparkles,
  additional: Palette,
};

export const BrandIdentityColorManager: React.FC<BrandIdentityColorManagerProps> = ({
  darkMode,
  setDarkMode,
  adminUsername = "super_admin",
}) => {
  const {
    publishedConfig,
    previousConfig,
    draftConfig,
    hasUnsavedChanges,
    isPreviewActive,
    resolvedGroups,
    cursors,
    updateDraft,
    togglePreviewMode,
    publishDraftChanges,
    restorePreviousConfiguration,
    resetToDefaultPalette,
    discardDraftChanges,
  } = useBrandIdentityColorEngine(darkMode);

  const [selectedGroupId, setSelectedGroupId] = useState<BrandColorGroupId>("header");
  const [simulatorTheme, setSimulatorTheme] = useState<"light" | "dark">(
    darkMode ? "dark" : "light"
  );

  // Add Color Form State
  const [newColorHex, setNewColorHex] = useState<string>("#A64B45");
  const [newColorName, setNewColorName] = useState<string>("");
  const [addFormError, setAddFormError] = useState<string | null>(null);

  // Inline Edit Color State
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [editHexInput, setEditHexInput] = useState<string>("");
  const [editNameInput, setEditNameInput] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);

  // Custom Interval Input State
  const [customIntervalError, setCustomIntervalError] = useState<string | null>(null);

  // Modals & Notification Feedback
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error" | "info", message: string) => {
    setFeedbackBanner({ type, message });
  };

  const activeGroup = draftConfig.groups[selectedGroupId];
  const sortedGroupColors = useMemo(
    () => [...activeGroup.colors].sort((a, b) => a.order - b.order),
    [activeGroup.colors]
  );
  const enabledGroupColors = useMemo(
    () => getEnabledColors(activeGroup),
    [activeGroup]
  );

  // Resolve both Published and Draft colors for side-by-side comparison
  const publishedResolved = useMemo(
    () => resolveAllGroupsState(publishedConfig, cursors, simulatorTheme === "dark"),
    [publishedConfig, cursors, simulatorTheme]
  );
  const draftResolved = useMemo(
    () => resolveAllGroupsState(draftConfig, cursors, simulatorTheme === "dark"),
    [draftConfig, cursors, simulatorTheme]
  );

  const simulatorFooterCSS = useMemo(
    () =>
      computeFooterGradientCSS(
        draftResolved.footer.effectiveHex,
        simulatorTheme === "dark"
      ),
    [draftResolved.footer.effectiveHex, simulatorTheme]
  );

  // Handlers for Color CRUD
  const handleAddColor = (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError(null);

    const validated = validateAndNormalizeHex(newColorHex);
    if (!validated.valid) {
      const msg = validated.error || "Invalid HEX color code.";
      setAddFormError(msg);
      showFeedback("error", msg);
      return;
    }

    const label = newColorName.trim() || `YUME ${validated.hex}`;
    const result = addColorToGroup(draftConfig, selectedGroupId, {
      hex: validated.hex,
      name: label,
    });

    if (!result.ok) {
      setAddFormError(result.error || "Could not add color.");
      showFeedback("error", result.error || "Could not add color.");
      return;
    }

    updateDraft(result.config);
    setNewColorName("");
    showFeedback(
      "success",
      `Added ${label} (${validated.hex}) to ${activeGroup.label} draft.`
    );
  };

  const handleStartEditColor = (color: BrandColorItem) => {
    setEditingColorId(color.id);
    setEditHexInput(color.hex);
    setEditNameInput(color.name);
    setEditError(null);
  };

  const handleSaveEditColor = (colorId: string) => {
    setEditError(null);
    const validated = validateAndNormalizeHex(editHexInput);
    if (!validated.valid) {
      setEditError(validated.error || "Invalid HEX format.");
      showFeedback("error", validated.error || "Invalid HEX format.");
      return;
    }

    const result = updateColorInGroup(draftConfig, selectedGroupId, colorId, {
      hex: validated.hex,
      name: editNameInput.trim() || `YUME ${validated.hex}`,
    });

    if (!result.ok) {
      setEditError(result.error || "Failed to update color.");
      showFeedback("error", result.error || "Failed to update color.");
      return;
    }

    updateDraft(result.config);
    setEditingColorId(null);
    showFeedback(
      "success",
      `Updated color to ${validated.hex} in ${activeGroup.label}.`
    );
  };

  const handleToggleColorEnabled = (color: BrandColorItem, nextEnabled: boolean) => {
    const result = updateColorInGroup(draftConfig, selectedGroupId, color.id, {
      enabled: nextEnabled,
    });
    if (!result.ok) {
      showFeedback(
        "error",
        result.error || "Cannot disable the last enabled color in this group."
      );
      return;
    }
    updateDraft(result.config);
    showFeedback(
      "info",
      `${color.name} (${color.hex}) ${nextEnabled ? "enabled" : "disabled"} in ${
        activeGroup.label
      }.`
    );
  };

  const handleDeleteColor = (color: BrandColorItem) => {
    const result = removeColorFromGroup(draftConfig, selectedGroupId, color.id);
    if (!result.ok) {
      showFeedback(
        "error",
        result.error || "Cannot remove the last enabled color in this group."
      );
      return;
    }
    updateDraft(result.config);
    showFeedback(
      "info",
      `Removed ${color.name} (${color.hex}) from ${activeGroup.label}.`
    );
  };

  const handleReorderColor = (colorId: string, direction: "up" | "down") => {
    const nextConfig = reorderColorInGroup(
      draftConfig,
      selectedGroupId,
      colorId,
      direction
    );
    updateDraft(nextConfig);
  };

  // Handlers for Rotation Mode Settings
  const handleSelectRotationMode = (mode: RotationMode) => {
    setCustomIntervalError(null);
    const result = updateGroupRotation(draftConfig, selectedGroupId, { mode });
    if (!result.ok) {
      showFeedback("error", result.error || "Could not update rotation mode.");
      return;
    }
    updateDraft(result.config);
    const modeLabel =
      mode === "refresh"
        ? "On Page Refresh"
        : mode === "interval"
        ? `Time-Based Rotation (Every ${activeGroup.rotation.intervalSeconds}s)`
        : "Static Color";
    showFeedback(
      "info",
      `${activeGroup.label} rotation mode set to ${modeLabel}.`
    );
  };

  const handleChangeIntervalSeconds = (rawVal: string | number) => {
    setCustomIntervalError(null);
    const parsed = typeof rawVal === "number" ? rawVal : parseInt(rawVal, 10);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 86400) {
      setCustomIntervalError("Enter a valid number of seconds between 1 and 86,400.");
      return;
    }
    const result = updateGroupRotation(draftConfig, selectedGroupId, {
      mode: "interval",
      intervalSeconds: parsed,
    });
    if (result.ok) {
      updateDraft(result.config);
    }
  };

  const handleSelectStaticColor = (colorId: string) => {
    const result = updateGroupRotation(draftConfig, selectedGroupId, {
      mode: "static",
      staticColorId: colorId,
    });
    if (result.ok) {
      updateDraft(result.config);
      const picked = activeGroup.colors.find((c) => c.id === colorId);
      if (picked) {
        showFeedback(
          "info",
          `${activeGroup.label} pinned to static color ${picked.name} (${picked.hex}).`
        );
      }
    }
  };

  const handleToggleFooterHeaderSync = (syncWithHeader: boolean) => {
    const result = updateGroupRotation(draftConfig, "footer", { syncWithHeader });
    if (result.ok) {
      updateDraft(result.config);
      showFeedback(
        "info",
        syncWithHeader
          ? "Footer gradient is now synchronized with the active Header color."
          : "Footer gradient is now operating on its own independent Footer Color Palette."
      );
    }
  };

  // Lifecycle Actions: Publish, Restore Previous, Reset Default
  const handleConfirmPublish = async () => {
    const res = await publishDraftChanges(adminUsername);
    setIsPublishModalOpen(false);
    if (res.ok) {
      showFeedback(
        "success",
        "Brand Identity & Color Configuration published live across all YUME platform surfaces."
      );
    } else {
      showFeedback("error", res.error || "Failed to publish configuration.");
    }
  };

  const handleRestorePrevious = async () => {
    const res = await restorePreviousConfiguration();
    if (res.ok) {
      showFeedback(
        "success",
        "Restored previous published Brand Identity & Color configuration."
      );
    } else {
      showFeedback(
        "error",
        res.error || "No previous configuration snapshot available."
      );
    }
  };

  const handleConfirmResetDefault = async () => {
    await resetToDefaultPalette();
    setIsResetModalOpen(false);
    showFeedback(
      "success",
      "Reset all 7 color groups to the canonical YUME Brand Palette (#F9FBF4, #4D4040, #A64B45, #A66F78, #806477)."
    );
  };

  const formatRotationSummary = (groupId: BrandColorGroupId, cfg = draftConfig) => {
    const grp = cfg.groups[groupId];
    if (groupId === "footer" && grp.rotation.syncWithHeader !== false) {
      return "Synced w/ Header";
    }
    if (grp.rotation.mode === "refresh") return "On Page Refresh";
    if (grp.rotation.mode === "interval") return `Every ${grp.rotation.intervalSeconds}s`;
    const pinned =
      grp.colors.find((c) => c.id === grp.rotation.staticColorId) || grp.colors[0];
    return `Static (${pinned?.hex || ""})`;
  };

  const newHexValidation = useMemo(
    () => validateAndNormalizeHex(newColorHex),
    [newColorHex]
  );

  return (
    <div
      className="flex flex-col gap-6 font-sans"
      data-testid="brand-identity-color-manager"
    >
      {/* 1. TOP GOVERNANCE STATUS & ACTION BAR (ACTIVE vs. DRAFT SEPARATION) */}
      <div className={YUME_ADMIN_TOKENS.cardClass}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-1.5 h-6 rounded-full bg-[#1e2631] dark:bg-sky-400" />
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white tracking-tight">
                Brand Identity &amp; Advanced Color Management
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                <ShieldCheck className="w-3.5 h-3.5" />
                ACTIVE v{publishedConfig.version}
              </span>
              {hasUnsavedChanges ? (
                <span
                  data-testid="unsaved-changes-badge"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  DRAFT: UNSAVED CHANGES
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-slate-300 border border-stone-200/80 dark:border-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Draft in Sync with Published
                </span>
              )}
              {isPreviewActive && (
                <span
                  data-testid="preview-mode-active-badge"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                >
                  <Eye className="w-3.5 h-3.5" />
                  LIVE PREVIEW MODE ON
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-slate-400 pl-4">
              Centralized control over YUME&apos;s 7 independent color groups, refresh/time-based/static rotation engines, and header-synchronized footer gradients.
            </p>
          </div>

          {/* Primary Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => togglePreviewMode()}
              data-testid="toggle-preview-mode-btn"
              className={
                isPreviewActive
                  ? YUME_ADMIN_TOKENS.emeraldButtonClass
                  : YUME_ADMIN_TOKENS.secondaryButtonClass
              }
            >
              <Eye className="w-3.5 h-3.5" />
              {isPreviewActive ? "Previewing Draft Live" : "Preview Changes"}
            </button>

            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              data-testid="publish-changes-btn"
              className={YUME_ADMIN_TOKENS.primaryButtonClass}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Publish Changes
            </button>

            <button
              type="button"
              onClick={handleRestorePrevious}
              disabled={!previousConfig}
              data-testid="restore-previous-btn"
              className={`${YUME_ADMIN_TOKENS.secondaryButtonClass} ${
                !previousConfig ? "opacity-50 cursor-not-allowed" : ""
              }`}
              title={
                previousConfig
                  ? `Restore previous version (v${previousConfig.version})`
                  : "No previous published snapshot available yet"
              }
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Previous
            </button>

            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              data-testid="reset-default-palette-btn"
              className={YUME_ADMIN_TOKENS.secondaryButtonClass}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset to Default Palette
            </button>

            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={() => {
                  discardDraftChanges();
                  showFeedback("info", "Discarded unsaved draft changes.");
                }}
                className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Discard Draft
              </button>
            )}
          </div>
        </div>

        {/* Notification / Validation Feedback Banner */}
        {feedbackBanner && (
          <div
            role="status"
            data-testid="brand-feedback-banner"
            className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border text-xs font-semibold ${
              feedbackBanner.type === "error"
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                : feedbackBanner.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                : "bg-stone-100 dark:bg-slate-800/80 border-stone-200 dark:border-slate-700 text-stone-800 dark:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackBanner.type === "error" ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>{feedbackBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Phase 1 Core Brand Signature Swatch Strip */}
        <div className={YUME_ADMIN_TOKENS.innerPanelClass}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                YUME Refined Brand Signature Palette (Phase 1 Core Colors)
              </span>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                All legacy desert, golden, gold-gradient, and brown/sandy tones have been removed and replaced with these five core YUME brand colors.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
              Click any signature color to quick-fill the Add Color form below
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {PHASE1_NEW_YUME_BRAND_COLORS.map((sig) => {
              const fg = getContrastSafeForeground(sig.hex);
              const light = isLightColor(sig.hex);
              return (
                <button
                  key={sig.id}
                  type="button"
                  onClick={() => {
                    setNewColorHex(sig.hex);
                    setNewColorName(sig.name);
                  }}
                  className="group flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 hover:border-[#1e2631] dark:hover:border-sky-400 transition-all text-left cursor-pointer shadow-2xs"
                >
                  <div
                    className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold border border-black/10 dark:border-white/15 shadow-inner"
                    style={{ backgroundColor: sig.hex, color: fg }}
                  >
                    {light ? "Dark FG" : "Light FG"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 dark:text-white truncate">
                      {sig.hex}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                      {sig.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. ACTIVE vs. PROPOSED COMPARISON & LIVE HEADER/FOOTER SIMULATOR */}
      <div className={YUME_ADMIN_TOKENS.cardClass}>
        <YumeAdminSectionHeader
          title="Current (Published) vs. Proposed (Draft) Live Comparison"
          subtitle="Verify contrast, header behavior, exact footer gradient synchronization, buttons, and links in both Light and Dark modes before publishing"
          rightSlot={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = simulatorTheme === "light" ? "dark" : "light";
                  setSimulatorTheme(next);
                }}
                data-testid="simulator-theme-toggle-btn"
                className={YUME_ADMIN_TOKENS.secondaryButtonClass}
              >
                {simulatorTheme === "light" ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    Preview Canvas: Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-sky-400" />
                    Preview Canvas: Dark Mode
                  </>
                )}
              </button>
              {setDarkMode && (
                <button
                  type="button"
                  onClick={() => setDarkMode((prev) => !prev)}
                  className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                >
                  Switch App Theme ({darkMode ? "Dark" : "Light"})
                </button>
              )}
            </div>
          }
        />

        {/* 7-Group Active vs. Proposed Comparison Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
          {BRAND_COLOR_GROUP_ORDER.map((groupId) => {
            const pubState = publishedResolved[groupId];
            const drfState = draftResolved[groupId];
            const grp = draftConfig.groups[groupId];
            const isSelected = selectedGroupId === groupId;
            return (
              <button
                key={groupId}
                type="button"
                onClick={() => setSelectedGroupId(groupId)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? "bg-[#1e2631]/[0.05] dark:bg-sky-950/30 border-[#1e2631] dark:border-sky-400 shadow-xs"
                    : "bg-stone-50/70 dark:bg-slate-950/60 border-stone-200/80 dark:border-slate-800 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-stone-900 dark:text-white truncate">
                    {grp.label.replace(" Color Palette", "")}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-200/70 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
                    {getEnabledColors(grp).length} active
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {/* Active Published Swatch */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] font-bold uppercase text-stone-400 shrink-0">
                      Published
                    </span>
                    <div className="flex items-center gap-1 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded border border-black/15 dark:border-white/20 shrink-0"
                        style={{ backgroundColor: pubState.effectiveHex }}
                      />
                      <span className="text-[10px] font-bold text-stone-700 dark:text-slate-300 truncate">
                        {pubState.effectiveHex}
                      </span>
                    </div>
                  </div>

                  {/* Draft Proposed Swatch */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400 shrink-0">
                      Proposed
                    </span>
                    <div className="flex items-center gap-1 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded border border-black/15 dark:border-white/20 shrink-0"
                        style={{ backgroundColor: drfState.effectiveHex }}
                      />
                      <span className="text-[10px] font-bold text-stone-900 dark:text-white truncate">
                        {drfState.effectiveHex}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-semibold text-stone-500 dark:text-slate-400 truncate border-t border-stone-200/60 dark:border-slate-800 pt-1.5">
                  {formatRotationSummary(groupId)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Live Platform Surface Preview Canvas */}
        <div
          className={`rounded-2xl border overflow-hidden transition-colors ${
            simulatorTheme === "dark"
              ? "bg-[#0f172a] border-slate-800 text-slate-100"
              : "bg-white border-stone-200 text-stone-900"
          }`}
        >
          {/* Simulated Header (#main-studio-header fidelity) */}
          <div
            className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b transition-all duration-700"
            style={{
              backgroundColor:
                simulatorTheme === "dark"
                  ? "#0f172a"
                  : draftResolved.header.effectiveHex,
              color:
                simulatorTheme === "dark"
                  ? "#f8fafc"
                  : draftResolved.header.foregroundHex,
              borderColor:
                simulatorTheme === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : draftResolved.header.isLightSurface
                  ? "rgba(15,23,42,0.12)"
                  : "rgba(255,255,255,0.22)",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-black tracking-tight border"
                style={{
                  backgroundColor:
                    simulatorTheme === "dark" || !draftResolved.header.isLightSurface
                      ? "rgba(255,255,255,0.14)"
                      : "rgba(15,23,42,0.08)",
                  borderColor:
                    simulatorTheme === "dark" || !draftResolved.header.isLightSurface
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(15,23,42,0.15)",
                }}
              >
                yume
              </span>
              <span className="text-xs font-bold">
                Header Preview ({draftResolved.header.activeColor.name} •{" "}
                {draftResolved.header.effectiveHex})
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <span className="px-2.5 py-1 rounded-full bg-black/10 dark:bg-white/10">
                Mode: {formatRotationSummary("header")}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/10 dark:bg-white/10">
                Contrast:{" "}
                {getContrastRatio(
                  simulatorTheme === "dark"
                    ? "#0f172a"
                    : draftResolved.header.effectiveHex,
                  simulatorTheme === "dark"
                    ? "#f8fafc"
                    : draftResolved.header.foregroundHex
                )}
                :1
              </span>
            </div>
          </div>

          {/* Simulated Body Canvas: Background Surface, Buttons, Links, Accents, Additional */}
          <div
            className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 transition-colors duration-700"
            style={{
              backgroundColor:
                simulatorTheme === "dark"
                  ? "#0b0f19"
                  : draftResolved.backgrounds.effectiveHex,
            }}
          >
            {/* Card 1: Buttons & Links Preview */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                simulatorTheme === "dark"
                  ? "bg-slate-900 border-slate-800 text-slate-100"
                  : "bg-white border-stone-200/90 text-stone-900"
              }`}
            >
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                  Buttons &amp; Interactive Links
                </div>
                <div className="text-sm font-bold mt-1">
                  Storefront Action Controls
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all duration-500"
                  style={{
                    backgroundColor: draftResolved.buttons.effectiveHex,
                    color: draftResolved.buttons.foregroundHex,
                    border: draftResolved.buttons.isLightSurface
                      ? "1px solid rgba(15,23,42,0.2)"
                      : "1px solid transparent",
                  }}
                >
                  Primary CTA ({draftResolved.buttons.effectiveHex})
                </button>
                <span
                  className="text-xs font-bold underline underline-offset-4 cursor-pointer transition-colors duration-500"
                  style={{
                    color:
                      simulatorTheme === "dark" &&
                      !isLightColor(draftResolved.links.effectiveHex)
                        ? "#f8fafc"
                        : isLightColor(draftResolved.links.effectiveHex) &&
                          simulatorTheme === "light"
                        ? "#4D4040"
                        : draftResolved.links.effectiveHex,
                  }}
                >
                  Interactive Link ({draftResolved.links.effectiveHex})
                </span>
              </div>
            </div>

            {/* Card 2: Product Detail Accents & Badges */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                simulatorTheme === "dark"
                  ? "bg-slate-900 border-slate-800 text-slate-100"
                  : "bg-white border-stone-200/90 text-stone-900"
              }`}
              style={{
                borderLeftWidth: "4px",
                borderLeftColor: draftResolved.accents.effectiveHex,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                  Accent &amp; Highlights
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-md text-[10px] font-bold"
                  style={{
                    backgroundColor: draftResolved.accents.effectiveHex,
                    color: draftResolved.accents.foregroundHex,
                  }}
                >
                  Verified Accent ({draftResolved.accents.effectiveHex})
                </span>
              </div>
              <p className="text-xs opacity-80">
                Synchronizes product detail curved borders, specification highlights, and active filter badges.
              </p>
            </div>

            {/* Card 3: Surface Background & Additional Brand Colors */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                simulatorTheme === "dark"
                  ? "bg-slate-900 border-slate-800 text-slate-100"
                  : "bg-white border-stone-200/90 text-stone-900"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                  Background &amp; Brand Extra
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-md text-[10px] font-bold"
                  style={{
                    backgroundColor: draftResolved.additional.effectiveHex,
                    color: draftResolved.additional.foregroundHex,
                  }}
                >
                  Extra ({draftResolved.additional.effectiveHex})
                </span>
              </div>
              <div className="text-xs opacity-80">
                Canvas surface token:{" "}
                <strong className="font-bold">
                  {draftResolved.backgrounds.activeColor.name} (
                  {draftResolved.backgrounds.effectiveHex})
                </strong>
              </div>
            </div>
          </div>

          {/* Simulated Footer (Exact YumeShopFooter Gradient Formula Verbatim) */}
          <div
            className="transition-all duration-700"
            style={{
              background: simulatorFooterCSS.background,
              borderTop: simulatorFooterCSS.borderTop,
            }}
          >
            <div
              className="py-2 px-4 text-[11px] font-bold text-center"
              style={{
                background: simulatorFooterCSS.backToTopBg,
                borderBottom: simulatorFooterCSS.backToTopBorder,
                color:
                  simulatorTheme === "dark"
                    ? "#f8fafc"
                    : isLightColor(draftResolved.footer.effectiveHex)
                    ? "#4D4040"
                    : draftResolved.footer.effectiveHex,
              }}
            >
              Back to top • Exact YUME Footer Gradient (
              {draftConfig.groups.footer.rotation.syncWithHeader !== false
                ? `Synchronized with Header ${draftResolved.footer.effectiveHex}`
                : `Independent Footer Palette ${draftResolved.footer.effectiveHex}`}
              )
            </div>
            <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold">
                YUME Storefront &amp; Marketplace Footer Gradient Preview
              </span>
              <span className="text-[11px] opacity-75">
                {simulatorTheme === "light"
                  ? "Light Mode: 0% #fff → 45% (6% mix) → 80% (18% mix) → 100% (30% mix)"
                  : "Dark Mode: 0% #0f172a → 55% (16% mix) → 100% (36% mix)"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. INDEPENDENT GROUP SELECTOR STRIP (7 GROUPS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {BRAND_COLOR_GROUP_ORDER.map((groupId) => {
          const grp = draftConfig.groups[groupId];
          const IconComponent = GROUP_ICONS[groupId];
          const isSelected = selectedGroupId === groupId;
          const resolved = draftResolved[groupId];

          return (
            <button
              key={groupId}
              type="button"
              onClick={() => {
                setSelectedGroupId(groupId);
                setEditingColorId(null);
                setAddFormError(null);
                setCustomIntervalError(null);
              }}
              data-testid={`select-group-${groupId}`}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                isSelected
                  ? "bg-[#1e2631] text-white dark:bg-sky-500 dark:text-slate-950 border-[#1e2631] dark:border-sky-400 shadow-sm"
                  : "bg-white dark:bg-slate-900 text-stone-800 dark:text-slate-200 border-stone-200/90 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <IconComponent className="w-4 h-4 shrink-0" />
                <span
                  className="w-4 h-4 rounded-full border border-white/40 shadow-2xs shrink-0"
                  style={{ backgroundColor: resolved.effectiveHex }}
                />
              </div>
              <div>
                <div className="text-xs font-bold leading-snug">{grp.label}</div>
                <div
                  className={`text-[10px] font-medium mt-0.5 ${
                    isSelected
                      ? "text-stone-200 dark:text-slate-900"
                      : "text-stone-500 dark:text-slate-400"
                  }`}
                >
                  {formatRotationSummary(groupId)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. SELECTED GROUP CONFIGURATION WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 COLS): COLOR ROTATION SETTINGS FOR ACTIVE GROUP */}
        <div className={`lg:col-span-5 ${YUME_ADMIN_TOKENS.cardClass}`}>
          <YumeAdminSectionHeader
            title={`Color Rotation Settings — ${activeGroup.label}`}
            subtitle="Independent rotation mode for this group. Changing these settings never modifies any other color group."
          />

          {/* Special Footer Synchronization Toggle (Phase 5) */}
          {selectedGroupId === "footer" && (
            <div className={YUME_ADMIN_TOKENS.innerPanelClass}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-stone-900 dark:text-white block">
                    Follow Active Header Color Gradient (Default)
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 block mt-0.5">
                    Preserves YUME&apos;s signature synchronized header-to-footer gradient automatically. Turn off to rotate or pin an independent Footer palette.
                  </span>
                </div>
                <YumeAdminToggle
                  checked={activeGroup.rotation.syncWithHeader !== false}
                  onChange={handleToggleFooterHeaderSync}
                />
              </div>
            </div>
          )}

          {/* 3 Rotation Mode Cards */}
          <div className="flex flex-col gap-3">
            {/* MODE 1: ON PAGE REFRESH */}
            <div
              onClick={() => handleSelectRotationMode("refresh")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectRotationMode("refresh");
                }
              }}
              data-testid={`rotation-mode-refresh-${selectedGroupId}`}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeGroup.rotation.mode === "refresh"
                  ? "bg-[#1e2631]/[0.04] dark:bg-sky-950/30 border-[#1e2631] dark:border-sky-400 shadow-2xs"
                  : "bg-stone-50/60 dark:bg-slate-950/50 border-stone-200/80 dark:border-slate-800 hover:border-stone-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-4 h-4 mt-0.5 shrink-0 text-[#1e2631] dark:text-sky-400" />
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white">
                      MODE 1: ON PAGE REFRESH
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Selects the next enabled color in this group&apos;s palette whenever the page is refreshed. Preserves the existing YUME session behavior without timers.
                    </p>
                  </div>
                </div>
                <input
                  type="radio"
                  name={`rotation_mode_${selectedGroupId}`}
                  checked={activeGroup.rotation.mode === "refresh"}
                  onChange={() => handleSelectRotationMode("refresh")}
                  aria-label="Mode 1: On Page Refresh"
                  className="mt-1 accent-[#1e2631] dark:accent-sky-400"
                />
              </div>
            </div>

            {/* MODE 2: TIME-BASED ROTATION */}
            <div
              onClick={() => handleSelectRotationMode("interval")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectRotationMode("interval");
                }
              }}
              data-testid={`rotation-mode-interval-${selectedGroupId}`}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeGroup.rotation.mode === "interval"
                  ? "bg-[#1e2631]/[0.04] dark:bg-sky-950/30 border-[#1e2631] dark:border-sky-400 shadow-2xs"
                  : "bg-stone-50/60 dark:bg-slate-950/50 border-stone-200/80 dark:border-slate-800 hover:border-stone-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0 text-[#1e2631] dark:text-sky-400" />
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white">
                      MODE 2: TIME-BASED ROTATION
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Automatically rotates through enabled colors at a configurable time interval with smooth CSS transitions, no page reload, and zero database writes on ticks.
                    </p>
                  </div>
                </div>
                <input
                  type="radio"
                  name={`rotation_mode_${selectedGroupId}`}
                  checked={activeGroup.rotation.mode === "interval"}
                  onChange={() => handleSelectRotationMode("interval")}
                  aria-label="Mode 2: Time-Based Rotation"
                  className="mt-1 accent-[#1e2631] dark:accent-sky-400"
                />
              </div>

              {/* Interval Configuration Controls */}
              <div
                className="mt-3 pt-3 border-t border-stone-200/70 dark:border-slate-800 space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <label
                    htmlFor={`interval-seconds-input-${selectedGroupId}`}
                    className="text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300 block mb-1.5"
                  >
                    CHANGE COLOR EVERY [ NUMBER ] SECONDS
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`interval-seconds-input-${selectedGroupId}`}
                      data-testid={`interval-seconds-input-${selectedGroupId}`}
                      type="number"
                      min={1}
                      max={86400}
                      value={activeGroup.rotation.intervalSeconds}
                      onChange={(e) => handleChangeIntervalSeconds(e.target.value)}
                      className={`${YUME_ADMIN_TOKENS.monoInputClass} !w-28 !py-2 text-center`}
                    />
                    <span className="text-xs font-bold text-stone-600 dark:text-slate-300">
                      SECONDS
                    </span>
                  </div>
                  {customIntervalError && (
                    <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1">
                      {customIntervalError}
                    </p>
                  )}
                </div>

                {/* Preset Interval Quick Buttons: 5, 10, 15, 30, 60, 120 seconds */}
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-400 dark:text-slate-500 block mb-1.5">
                    Quick Interval Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ROTATION_INTERVAL_PRESETS.map((sec) => {
                      const isCurrent =
                        activeGroup.rotation.mode === "interval" &&
                        activeGroup.rotation.intervalSeconds === sec;
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => handleChangeIntervalSeconds(sec)}
                          data-testid={`preset-interval-${sec}s`}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-[#1e2631] text-white dark:bg-sky-400 dark:text-slate-950 border-[#1e2631] dark:border-sky-400"
                              : "bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:border-stone-400"
                          }`}
                        >
                          {sec}s
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* MODE 3: STATIC COLOR */}
            <div
              onClick={() => handleSelectRotationMode("static")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectRotationMode("static");
                }
              }}
              data-testid={`rotation-mode-static-${selectedGroupId}`}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeGroup.rotation.mode === "static"
                  ? "bg-[#1e2631]/[0.04] dark:bg-sky-950/30 border-[#1e2631] dark:border-sky-400 shadow-2xs"
                  : "bg-stone-50/60 dark:bg-slate-950/50 border-stone-200/80 dark:border-slate-800 hover:border-stone-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 mt-0.5 shrink-0 text-[#1e2631] dark:text-sky-400" />
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white">
                      MODE 3: STATIC COLOR
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Keeps one selected color permanently. No automatic rotation and no refresh-based color changes.
                    </p>
                  </div>
                </div>
                <input
                  type="radio"
                  name={`rotation_mode_${selectedGroupId}`}
                  checked={activeGroup.rotation.mode === "static"}
                  onChange={() => handleSelectRotationMode("static")}
                  aria-label="Mode 3: Static Color"
                  className="mt-1 accent-[#1e2631] dark:accent-sky-400"
                />
              </div>

              {/* Pinned Static Color Selector */}
              <div
                className="mt-3 pt-3 border-t border-stone-200/70 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <label
                  htmlFor={`static-color-select-${selectedGroupId}`}
                  className="text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300 block mb-1.5"
                >
                  Select Pinned Static Color:
                </label>
                <select
                  id={`static-color-select-${selectedGroupId}`}
                  data-testid={`static-color-select-${selectedGroupId}`}
                  value={activeGroup.rotation.staticColorId}
                  onChange={(e) => handleSelectStaticColor(e.target.value)}
                  className={YUME_ADMIN_TOKENS.selectClass}
                >
                  {enabledGroupColors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.hex})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <YumeAdminAdviceBanner label="INDEPENDENT GROUP GUARANTEE:">
            Rotation settings configured here apply exclusively to{" "}
            <strong>{activeGroup.label}</strong>. Other groups retain their own independent rotation schedules.
          </YumeAdminAdviceBanner>
        </div>

        {/* RIGHT COLUMN (7 COLS): PALETTE CRUD & COLOR LIST */}
        <div className={`lg:col-span-7 ${YUME_ADMIN_TOKENS.cardClass}`}>
          <YumeAdminSectionHeader
            title={`${activeGroup.label} — Configured Colors (${sortedGroupColors.length})`}
            subtitle={activeGroup.description}
            rightSlot={
              <span className="text-xs font-bold text-stone-600 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-stone-200/80 dark:border-slate-700">
                {enabledGroupColors.length} of {sortedGroupColors.length} Enabled
              </span>
            }
          />

          {/* Add New Color Form */}
          <form
            onSubmit={handleAddColor}
            className={`${YUME_ADMIN_TOKENS.innerPanelClass} space-y-3`}
            data-testid="add-color-form"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Add Color to {activeGroup.label}
              </span>
              {newHexValidation.valid && (
                <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                  Contrast vs White:{" "}
                  <strong>{getContrastRatio(newHexValidation.hex, "#FFFFFF")}:1</strong>{" "}
                  • vs Dark:{" "}
                  <strong>{getContrastRatio(newHexValidation.hex, "#0F172A")}:1</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Visual Color Picker + Manual HEX Input */}
              <div className="sm:col-span-5">
                <label
                  htmlFor="new-color-hex-input"
                  className={YUME_ADMIN_TOKENS.labelClass}
                >
                  HEX Color Code &amp; Picker
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Visual color picker"
                    value={newHexValidation.valid ? newHexValidation.hex : "#4D4040"}
                    onChange={(e) => {
                      setNewColorHex(e.target.value.toUpperCase());
                      setAddFormError(null);
                    }}
                    className="w-11 h-10 rounded-xl border border-stone-300 dark:border-slate-700 cursor-pointer bg-transparent p-0.5 shrink-0"
                  />
                  <input
                    id="new-color-hex-input"
                    data-testid="new-color-hex-input"
                    type="text"
                    value={newColorHex}
                    onChange={(e) => {
                      setNewColorHex(e.target.value);
                      setAddFormError(null);
                    }}
                    placeholder="#F9FBF4"
                    className={YUME_ADMIN_TOKENS.monoInputClass}
                  />
                </div>
              </div>

              {/* Color Name / Label */}
              <div className="sm:col-span-4">
                <label
                  htmlFor="new-color-name-input"
                  className={YUME_ADMIN_TOKENS.labelClass}
                >
                  Color Name / Label
                </label>
                <input
                  id="new-color-name-input"
                  data-testid="new-color-name-input"
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="e.g. Alabaster Sage Cream"
                  className={YUME_ADMIN_TOKENS.inputClass}
                />
              </div>

              {/* Submit Add Button */}
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  data-testid="add-color-submit-btn"
                  className={`${YUME_ADMIN_TOKENS.primaryButtonClass} w-full`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Color
                </button>
              </div>
            </div>

            {addFormError && (
              <p
                data-testid="add-color-error"
                className="text-xs font-semibold text-rose-600 dark:text-rose-400"
              >
                {addFormError}
              </p>
            )}
          </form>

          {/* Palette Color Items List */}
          <div className="flex flex-col gap-2.5" data-testid="group-colors-list">
            {sortedGroupColors.map((color, idx) => {
              const isEditing = editingColorId === color.id;
              const isPinnedStatic =
                activeGroup.rotation.mode === "static" &&
                activeGroup.rotation.staticColorId === color.id;
              const isCurrentlyActive =
                draftResolved[selectedGroupId]?.activeColor.id === color.id;
              const guard = canRemoveOrDisableColor(activeGroup, color.id);
              const fg = getContrastSafeForeground(color.hex);

              return (
                <div
                  key={color.id}
                  data-testid={`color-row-${color.hex}`}
                  className={`p-3.5 rounded-xl border transition-all ${
                    color.enabled
                      ? "bg-white dark:bg-slate-900 border-stone-200/90 dark:border-slate-800"
                      : "bg-stone-50/50 dark:bg-slate-950/40 border-stone-200/50 dark:border-slate-800/50 opacity-65"
                  }`}
                >
                  {!isEditing ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Reorder Up/Down Buttons */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleReorderColor(color.id, "up")}
                            disabled={idx === 0}
                            aria-label={`Move ${color.name} up`}
                            className="p-1 rounded hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorderColor(color.id, "down")}
                            disabled={idx === sortedGroupColors.length - 1}
                            aria-label={`Move ${color.name} down`}
                            className="p-1 rounded hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Swatch Preview */}
                        <div
                          className="w-11 h-11 rounded-xl border border-black/15 dark:border-white/20 shrink-0 flex items-center justify-center text-[10px] font-bold shadow-inner"
                          style={{ backgroundColor: color.hex, color: fg }}
                        >
                          #{idx + 1}
                        </div>

                        {/* Color Details */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-stone-900 dark:text-white">
                              {color.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-200 border border-stone-200/80 dark:border-slate-700">
                              {color.hex}
                            </span>
                            {isCurrentlyActive && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                ACTIVE NOW
                              </span>
                            )}
                            {isPinnedStatic && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                PINNED STATIC
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>
                              Light Contrast: {getContrastRatio(color.hex, "#FFFFFF")}:1
                            </span>
                            <span>•</span>
                            <span>
                              Dark Contrast: {getContrastRatio(color.hex, "#0F172A")}:1
                            </span>
                            <span>•</span>
                            <span>
                              Auto Text: {fg === "#0F172A" ? "Charcoal (#0F172A)" : "White (#FFFFFF)"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls: Enable/Disable Toggle, Edit, Delete */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                            {color.enabled ? "Enabled" : "Disabled"}
                          </span>
                          <YumeAdminToggle
                            checked={color.enabled}
                            onChange={(next) => handleToggleColorEnabled(color, next)}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartEditColor(color)}
                          aria-label={`Edit ${color.name}`}
                          className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteColor(color)}
                          aria-label={`Remove ${color.name}`}
                          title={
                            guard.allowed
                              ? `Remove ${color.name}`
                              : guard.reason
                          }
                          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                            guard.allowed
                              ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100"
                              : "border-stone-200 dark:border-slate-800 bg-stone-100 dark:bg-slate-800 text-stone-400 opacity-50"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Inline Edit Mode */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-5">
                          <label className={YUME_ADMIN_TOKENS.labelClass}>
                            Edit HEX Code &amp; Picker
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              aria-label="Edit visual color picker"
                              value={
                                validateAndNormalizeHex(editHexInput).valid
                                  ? validateAndNormalizeHex(editHexInput).hex
                                  : color.hex
                              }
                              onChange={(e) =>
                                setEditHexInput(e.target.value.toUpperCase())
                              }
                              className="w-10 h-10 rounded-xl border border-stone-300 dark:border-slate-700 cursor-pointer bg-transparent p-0.5 shrink-0"
                            />
                            <input
                              type="text"
                              value={editHexInput}
                              onChange={(e) => setEditHexInput(e.target.value)}
                              className={YUME_ADMIN_TOKENS.monoInputClass}
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-4">
                          <label className={YUME_ADMIN_TOKENS.labelClass}>
                            Edit Color Label
                          </label>
                          <input
                            type="text"
                            value={editNameInput}
                            onChange={(e) => setEditNameInput(e.target.value)}
                            className={YUME_ADMIN_TOKENS.inputClass}
                          />
                        </div>

                        <div className="sm:col-span-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEditColor(color.id)}
                            className={YUME_ADMIN_TOKENS.primaryButtonClass}
                          >
                            <Check className="w-3.5 h-3.5" />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingColorId(null)}
                            className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      {editError && (
                        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                          {editError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PUBLISH CONFIRMATION MODAL */}
      {isPublishModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
              <h3
                id="publish-modal-title"
                className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4 text-emerald-600" />
                Publish Brand Identity &amp; Color Configuration
              </h3>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                aria-label="Close publish confirmation"
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
              Publishing will promote your current Draft configuration to the live{" "}
              <strong>Published v{publishedConfig.version + 1}</strong> state across all YUME Marketplace, Storefront, Product, and Merchant pages, and archive{" "}
              <strong>v{publishedConfig.version}</strong> for instant one-click rollback.
            </p>

            <div className="bg-stone-50 dark:bg-slate-950 p-3.5 rounded-xl border border-stone-200/80 dark:border-slate-800 space-y-2 text-xs">
              {BRAND_COLOR_GROUP_ORDER.map((gid) => (
                <div key={gid} className="flex items-center justify-between">
                  <span className="font-bold text-stone-700 dark:text-slate-300">
                    {draftConfig.groups[gid].label}:
                  </span>
                  <span className="font-semibold text-stone-900 dark:text-white flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 inline-block"
                      style={{
                        backgroundColor: draftResolved[gid].effectiveHex,
                      }}
                    />
                    {formatRotationSummary(gid)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className={YUME_ADMIN_TOKENS.secondaryButtonClass}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                data-testid="confirm-publish-btn"
                className={YUME_ADMIN_TOKENS.emeraldButtonClass}
              >
                <Check className="w-4 h-4" />
                Confirm &amp; Publish Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET TO DEFAULT PALETTE CONFIRMATION MODAL */}
      {isResetModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
              <h3
                id="reset-modal-title"
                className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 text-amber-600" />
                Reset to Default YUME Brand Palette
              </h3>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                aria-label="Close reset confirmation"
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
              This will restore all 7 color-management groups to the default YUME Phase 1 palette (<strong>#F9FBF4</strong>, <strong>#4D4040</strong>, <strong>#A64B45</strong>, <strong>#A66F78</strong>, <strong>#806477</strong> + classic YUME colors) and default rotation settings. Your current configuration will be saved in Previous Snapshot history.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className={YUME_ADMIN_TOKENS.secondaryButtonClass}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetDefault}
                data-testid="confirm-reset-btn"
                className={YUME_ADMIN_TOKENS.primaryButtonClass}
              >
                <RefreshCw className="w-4 h-4" />
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
