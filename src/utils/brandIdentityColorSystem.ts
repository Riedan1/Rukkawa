import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ============================================================================
// YUME MARKETPLACE — BRAND IDENTITY & ADVANCED COLOR MANAGEMENT SYSTEM
// Centralized Data Model, Palette Engine, WCAG Contrast & Rotation Scheduler
// ============================================================================

export type BrandColorGroupId =
  | "header"
  | "footer"
  | "buttons"
  | "links"
  | "backgrounds"
  | "accents"
  | "additional";

export type RotationMode = "refresh" | "interval" | "static";

export interface BrandColorItem {
  id: string;
  hex: string; // Normalized uppercase #RRGGBB
  name: string;
  enabled: boolean;
  order: number;
  darkHexOverride?: string;
}

export interface GroupRotationConfig {
  mode: RotationMode;
  intervalSeconds: number; // Used when mode === "interval" (e.g. 5, 10, 15, 30, 60, 120, or custom)
  staticColorId: string; // Used when mode === "static"
  syncWithHeader?: boolean; // Specifically for footer group (true by default to preserve header-synced footer gradient)
}

export interface BrandColorGroupConfig {
  id: BrandColorGroupId;
  label: string;
  description: string;
  cssVarName: string;
  colors: BrandColorItem[];
  rotation: GroupRotationConfig;
}

export interface BrandThemeModeConfig {
  adaptContrastAutomatically: boolean;
  respectReducedMotion: boolean;
  darkModeSurfaceBlend: boolean;
}

export interface BrandIdentityConfig {
  version: number;
  publishedAt: string;
  publishedBy: string;
  groups: Record<BrandColorGroupId, BrandColorGroupConfig>;
  themeConfig: BrandThemeModeConfig;
}

export interface ResolvedGroupColorState {
  groupId: BrandColorGroupId;
  activeColor: BrandColorItem;
  effectiveHex: string;
  foregroundHex: "#0F172A" | "#FFFFFF";
  isLightSurface: boolean;
  contrastWithWhite: number;
  contrastWithDark: number;
}

// ============================================================================
// PHASE 1: UPDATED YUME DYNAMIC BRAND PALETTE
// Removed: Desert-inspired, golden, gold-gradient, and brown/sandy colors
//          (#744210, #78350F, #EAB308, etc.)
// Added:   1. #F9FBF4 (Alabaster Sage Cream)
//          2. #4D4040 (Deep Espresso Cocoa)
//          3. #A64B45 (Crimson Terracotta Rose)
//          4. #A66F78 (Dusty Mauve Rose)
//          5. #806477 (Velvet Plum Aubergine)
// ============================================================================

export const FORBIDDEN_LEGACY_DESERT_GOLD_HEXES = [
  "#744210",
  "#78350F",
  "#EAB308",
  "#D97706",
  "#B45309",
  "#92400E",
] as const;

export const PHASE1_NEW_YUME_BRAND_COLORS: ReadonlyArray<{
  id: string;
  hex: string;
  name: string;
}> = [
  { id: "yume_c_alabaster_sage", hex: "#F9FBF4", name: "Alabaster Sage Cream" },
  { id: "yume_c_espresso_cocoa", hex: "#4D4040", name: "Deep Espresso Cocoa" },
  { id: "yume_c_crimson_rose", hex: "#A64B45", name: "Crimson Terracotta Rose" },
  { id: "yume_c_dusty_mauve", hex: "#A66F78", name: "Dusty Mauve Rose" },
  { id: "yume_c_velvet_plum", hex: "#806477", name: "Velvet Plum Aubergine" },
] as const;

export const RETAINED_CLASSIC_YUME_BRAND_COLORS: ReadonlyArray<{
  id: string;
  hex: string;
  name: string;
}> = [
  { id: "yume_c_midnight_navy", hex: "#0B2447", name: "Premier Midnight Navy" },
  { id: "yume_c_royal_sapphire", hex: "#023E8A", name: "Royal Sapphire Blue" },
  { id: "yume_c_forest_pine", hex: "#1B4332", name: "Deep Forest Pine" },
  { id: "yume_c_imperial_berry", hex: "#5C0632", name: "Imperial Berry Wine" },
  { id: "yume_c_charcoal_slate", hex: "#2D3748", name: "Charcoal Slate" },
] as const;

export const CANONICAL_YUME_BRAND_PALETTE_ITEMS: ReadonlyArray<{
  id: string;
  hex: string;
  name: string;
  bgColor: string;
  buttonBg: string;
  buttonTextBg: string;
}> = [
  {
    id: "yume_c_alabaster_sage",
    hex: "#F9FBF4",
    name: "Alabaster Sage Cream",
    bgColor: "bg-[#F9FBF4]",
    buttonBg: "bg-[#4D4040] hover:bg-[#362c2c]",
    buttonTextBg: "text-[#F9FBF4]",
  },
  {
    id: "yume_c_espresso_cocoa",
    hex: "#4D4040",
    name: "Deep Espresso Cocoa",
    bgColor: "bg-[#4D4040]",
    buttonBg: "bg-[#F9FBF4] hover:bg-white",
    buttonTextBg: "text-[#4D4040]",
  },
  {
    id: "yume_c_crimson_rose",
    hex: "#A64B45",
    name: "Crimson Terracotta Rose",
    bgColor: "bg-[#A64B45]",
    buttonBg: "bg-[#F9FBF4] hover:bg-white",
    buttonTextBg: "text-[#A64B45]",
  },
  {
    id: "yume_c_dusty_mauve",
    hex: "#A66F78",
    name: "Dusty Mauve Rose",
    bgColor: "bg-[#A66F78]",
    buttonBg: "bg-[#F9FBF4] hover:bg-white",
    buttonTextBg: "text-[#4D4040]",
  },
  {
    id: "yume_c_velvet_plum",
    hex: "#806477",
    name: "Velvet Plum Aubergine",
    bgColor: "bg-[#806477]",
    buttonBg: "bg-[#F9FBF4] hover:bg-white",
    buttonTextBg: "text-[#806477]",
  },
  {
    id: "yume_c_midnight_navy",
    hex: "#0B2447",
    name: "Premier Midnight Navy",
    bgColor: "bg-[#0B2447]",
    buttonBg: "bg-[#CBDCF8]/90 hover:bg-[#CBDCF8]",
    buttonTextBg: "text-[#0B2447]",
  },
  {
    id: "yume_c_royal_sapphire",
    hex: "#023E8A",
    name: "Royal Sapphire Blue",
    bgColor: "bg-[#023E8A]",
    buttonBg: "bg-[#caf0f8] hover:bg-white",
    buttonTextBg: "text-[#023E8A]",
  },
  {
    id: "yume_c_forest_pine",
    hex: "#1B4332",
    name: "Deep Forest Pine",
    bgColor: "bg-[#1B4332]",
    buttonBg: "bg-[#d8f3dc] hover:bg-white",
    buttonTextBg: "text-[#1B4332]",
  },
  {
    id: "yume_c_imperial_berry",
    hex: "#5C0632",
    name: "Imperial Berry Wine",
    bgColor: "bg-[#5C0632]",
    buttonBg: "bg-[#fae0ec] hover:bg-white",
    buttonTextBg: "text-[#5C0632]",
  },
  {
    id: "yume_c_charcoal_slate",
    hex: "#2D3748",
    name: "Charcoal Slate",
    bgColor: "bg-[#2D3748]",
    buttonBg: "bg-[#e2e8f0] hover:bg-white",
    buttonTextBg: "text-[#2D3748]",
  },
] as const;

export const ROTATION_INTERVAL_PRESETS = [5, 10, 15, 30, 60, 120] as const;

export const BRAND_COLOR_GROUP_ORDER: ReadonlyArray<BrandColorGroupId> = [
  "header",
  "footer",
  "buttons",
  "links",
  "backgrounds",
  "accents",
  "additional",
];

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const BRAND_IDENTITY_STORAGE_KEYS = {
  PUBLISHED: "yume_brand_identity_published_v1",
  PREVIOUS: "yume_brand_identity_prev_v1",
  DRAFT: "yume_brand_identity_draft_v1",
  PREVIEW_ACTIVE: "yume_brand_identity_preview_active_v1",
  REFRESH_CURSOR_PREFIX: "yume_brand_refresh_idx_",
  LEGACY_HEADER_INDEX: "yume_refresh_palette_index",
} as const;

export const BRAND_IDENTITY_UPDATED_EVENT = "yume_brand_identity_updated";

// ============================================================================
// VALIDATION & WCAG CONTRAST UTILITIES
// ============================================================================

export function validateAndNormalizeHex(input: string): {
  valid: boolean;
  hex: string;
  error?: string;
} {
  if (typeof input !== "string") {
    return { valid: false, hex: "", error: "Color value must be a valid HEX string (e.g. #F9FBF4)." };
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, hex: "", error: "HEX color code cannot be empty." };
  }
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(withHash)) {
    return { valid: true, hex: withHash.toUpperCase() };
  }
  if (/^#[0-9A-Fa-f]{3}$/.test(withHash)) {
    const r = withHash[1];
    const g = withHash[2];
    const b = withHash[3];
    return { valid: true, hex: `#${r}${r}${g}${g}${b}${b}`.toUpperCase() };
  }
  return {
    valid: false,
    hex: "",
    error: "Invalid HEX format. Use standard 6-digit HEX format such as #F9FBF4, #4D4040, or #A64B45.",
  };
}

export function isForbiddenLegacyDesertOrGoldHex(hex: string): boolean {
  const norm = validateAndNormalizeHex(hex);
  if (!norm.valid) return false;
  return (FORBIDDEN_LEGACY_DESERT_GOLD_HEXES as readonly string[]).includes(norm.hex);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const norm = validateAndNormalizeHex(hex);
  if (!norm.valid) return null;
  const clean = norm.hex.slice(1);
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return { r, g, b };
}

export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const transform = (channel: number) => {
    const sRGB = channel / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };
  const R = transform(rgb.r);
  const G = transform(rgb.g);
  const B = transform(rgb.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

export function isLightColor(hex: string): boolean {
  return getRelativeLuminance(hex) > 0.52;
}

export function getContrastSafeForeground(bgHex: string): "#0F172A" | "#FFFFFF" {
  return isLightColor(bgHex) ? "#0F172A" : "#FFFFFF";
}

export function getSlidePairingForHex(hex: string): {
  hex: string;
  bgColor: string;
  buttonBg: string;
  buttonTextBg: string;
  isLight: boolean;
} {
  const norm = validateAndNormalizeHex(hex);
  const normalizedHex = norm.valid ? norm.hex : "#4D4040";
  const matched = CANONICAL_YUME_BRAND_PALETTE_ITEMS.find(
    (item) => item.hex.toUpperCase() === normalizedHex
  );
  const light = isLightColor(normalizedHex);
  if (matched) {
    return {
      hex: matched.hex,
      bgColor: matched.bgColor,
      buttonBg: matched.buttonBg,
      buttonTextBg: matched.buttonTextBg,
      isLight: light,
    };
  }
  return {
    hex: normalizedHex,
    bgColor: `bg-[${normalizedHex}]`,
    buttonBg: light ? "bg-[#4D4040] hover:bg-[#362c2c]" : "bg-[#F9FBF4] hover:bg-white",
    buttonTextBg: light ? "text-[#F9FBF4]" : `text-[${normalizedHex}]`,
    isLight: light,
  };
}

// ============================================================================
// DEFAULT CONFIGURATION BUILDER (ALL 7 INDEPENDENT GROUPS)
// ============================================================================

function buildDefaultPaletteList(
  subset?: ReadonlyArray<{ id: string; hex: string; name: string }>,
  prefix = "grp"
): BrandColorItem[] {
  const source = subset || CANONICAL_YUME_BRAND_PALETTE_ITEMS;
  return source.map((item, idx) => ({
    id: `${prefix}_${item.id}`,
    hex: item.hex.toUpperCase(),
    name: item.name,
    enabled: true,
    order: idx,
  }));
}

export function createDefaultBrandIdentityConfig(): BrandIdentityConfig {
  const headerColors = buildDefaultPaletteList(CANONICAL_YUME_BRAND_PALETTE_ITEMS, "header");
  const footerColors = buildDefaultPaletteList(CANONICAL_YUME_BRAND_PALETTE_ITEMS, "footer");

  // Buttons palette prioritizes deep, high-contrast brand tones + full 5 new colors
  const buttonColors = buildDefaultPaletteList(
    [
      { id: "yume_c_espresso_cocoa", hex: "#4D4040", name: "Deep Espresso Cocoa" },
      { id: "yume_c_crimson_rose", hex: "#A64B45", name: "Crimson Terracotta Rose" },
      { id: "yume_c_dusty_mauve", hex: "#A66F78", name: "Dusty Mauve Rose" },
      { id: "yume_c_velvet_plum", hex: "#806477", name: "Velvet Plum Aubergine" },
      { id: "yume_c_alabaster_sage", hex: "#F9FBF4", name: "Alabaster Sage Cream" },
      ...RETAINED_CLASSIC_YUME_BRAND_COLORS,
    ],
    "buttons"
  );

  // Links palette prioritizes legible interactive brand tones
  const linkColors = buildDefaultPaletteList(
    [
      { id: "yume_c_crimson_rose", hex: "#A64B45", name: "Crimson Terracotta Rose" },
      { id: "yume_c_velvet_plum", hex: "#806477", name: "Velvet Plum Aubergine" },
      { id: "yume_c_espresso_cocoa", hex: "#4D4040", name: "Deep Espresso Cocoa" },
      { id: "yume_c_dusty_mauve", hex: "#A66F78", name: "Dusty Mauve Rose" },
      { id: "yume_c_alabaster_sage", hex: "#F9FBF4", name: "Alabaster Sage Cream" },
      ...RETAINED_CLASSIC_YUME_BRAND_COLORS,
    ],
    "links"
  );

  // Backgrounds palette starts with #F9FBF4 (Alabaster Sage Cream) static by default
  const backgroundColors = buildDefaultPaletteList(
    [
      { id: "yume_c_alabaster_sage", hex: "#F9FBF4", name: "Alabaster Sage Cream" },
      { id: "yume_c_espresso_cocoa", hex: "#4D4040", name: "Deep Espresso Cocoa" },
      { id: "yume_c_crimson_rose", hex: "#A64B45", name: "Crimson Terracotta Rose" },
      { id: "yume_c_dusty_mauve", hex: "#A66F78", name: "Dusty Mauve Rose" },
      { id: "yume_c_velvet_plum", hex: "#806477", name: "Velvet Plum Aubergine" },
    ],
    "backgrounds"
  );

  // Accents palette for badges, active tabs, and product detail highlights
  const accentColors = buildDefaultPaletteList(
    [
      { id: "yume_c_crimson_rose", hex: "#A64B45", name: "Crimson Terracotta Rose" },
      { id: "yume_c_dusty_mauve", hex: "#A66F78", name: "Dusty Mauve Rose" },
      { id: "yume_c_velvet_plum", hex: "#806477", name: "Velvet Plum Aubergine" },
      { id: "yume_c_espresso_cocoa", hex: "#4D4040", name: "Deep Espresso Cocoa" },
      { id: "yume_c_alabaster_sage", hex: "#F9FBF4", name: "Alabaster Sage Cream" },
      ...RETAINED_CLASSIC_YUME_BRAND_COLORS,
    ],
    "accents"
  );

  // Additional brand colors for banners, notifications, modals, and secondary highlights
  const additionalColors = buildDefaultPaletteList(
    [
      { id: "yume_c_velvet_plum", hex: "#806477", name: "Velvet Plum Aubergine" },
      { id: "yume_c_dusty_mauve", hex: "#A66F78", name: "Dusty Mauve Rose" },
      { id: "yume_c_crimson_rose", hex: "#A64B45", name: "Crimson Terracotta Rose" },
      { id: "yume_c_espresso_cocoa", hex: "#4D4040", name: "Deep Espresso Cocoa" },
      { id: "yume_c_alabaster_sage", hex: "#F9FBF4", name: "Alabaster Sage Cream" },
      ...RETAINED_CLASSIC_YUME_BRAND_COLORS,
    ],
    "additional"
  );

  return {
    version: 1,
    publishedAt: "2026-11-16T00:00:00.000Z",
    publishedBy: "system_default",
    groups: {
      header: {
        id: "header",
        label: "Header Color Palette",
        description:
          "Controls the sticky platform header (#main-studio-header), premier hero banners, and synchronized workspace navigation.",
        cssVarName: "--yume-theme-header-color",
        colors: headerColors,
        rotation: {
          mode: "refresh",
          intervalSeconds: 30,
          staticColorId: headerColors[1]?.id || headerColors[0].id,
        },
      },
      footer: {
        id: "footer",
        label: "Footer Color Palette",
        description:
          "Controls the YUME footer gradient and back-to-top bar. Synchronized with the active header color by default.",
        cssVarName: "--yume-theme-footer-color",
        colors: footerColors,
        rotation: {
          mode: "refresh",
          intervalSeconds: 30,
          staticColorId: footerColors[1]?.id || footerColors[0].id,
          syncWithHeader: true,
        },
      },
      buttons: {
        id: "buttons",
        label: "Buttons Color Palette",
        description:
          "Controls primary and secondary call-to-action buttons, checkout buttons, and interactive pills.",
        cssVarName: "--yume-color-btn-primary",
        colors: buttonColors,
        rotation: {
          mode: "static",
          intervalSeconds: 30,
          staticColorId: buttonColors[0].id,
        },
      },
      links: {
        id: "links",
        label: "Links Color Palette",
        description:
          "Controls interactive text links, breadcrumb highlights, and action links across pages.",
        cssVarName: "--yume-color-link",
        colors: linkColors,
        rotation: {
          mode: "interval",
          intervalSeconds: 30,
          staticColorId: linkColors[0].id,
        },
      },
      backgrounds: {
        id: "backgrounds",
        label: "Background Color Palette",
        description:
          "Controls soft editorial surface tints, feature banners, and section backgrounds (such as #F9FBF4).",
        cssVarName: "--yume-color-bg-surface",
        colors: backgroundColors,
        rotation: {
          mode: "static",
          intervalSeconds: 60,
          staticColorId: backgroundColors[0].id, // #F9FBF4
        },
      },
      accents: {
        id: "accents",
        label: "Accent Colors",
        description:
          "Controls product detail curved accents, verified badges, active filter indicators, and highlights.",
        cssVarName: "--yume-color-accent",
        colors: accentColors,
        rotation: {
          mode: "refresh",
          intervalSeconds: 30,
          staticColorId: accentColors[0].id,
        },
      },
      additional: {
        id: "additional",
        label: "Additional Brand Colors",
        description:
          "Controls promotional callouts, modal accents, notification borders, and secondary brand tokens.",
        cssVarName: "--yume-color-brand-extra",
        colors: additionalColors,
        rotation: {
          mode: "static",
          intervalSeconds: 45,
          staticColorId: additionalColors[0].id,
        },
      },
    },
    themeConfig: {
      adaptContrastAutomatically: true,
      respectReducedMotion: true,
      darkModeSurfaceBlend: true,
    },
  };
}

// ============================================================================
// PURE GROUP & PALETTE OPERATIONS
// ============================================================================

export function getEnabledColors(group: BrandColorGroupConfig): BrandColorItem[] {
  const sorted = [...(group.colors || [])].sort((a, b) => a.order - b.order);
  const enabled = sorted.filter((c) => c.enabled);
  return enabled.length > 0 ? enabled : sorted.slice(0, 1);
}

export function canRemoveOrDisableColor(
  group: BrandColorGroupConfig,
  targetColorId: string
): { allowed: boolean; reason?: string } {
  const target = group.colors.find((c) => c.id === targetColorId);
  if (!target) {
    return { allowed: false, reason: "Color not found in group." };
  }
  const enabledColors = group.colors.filter((c) => c.enabled);
  if (target.enabled && enabledColors.length <= 1) {
    return {
      allowed: false,
      reason:
        "Cannot remove or disable the last enabled color in this group. Every active rotation configuration requires at least one valid enabled color.",
    };
  }
  if (group.colors.length <= 1) {
    return {
      allowed: false,
      reason: "Each color group must retain at least one valid color.",
    };
  }
  return { allowed: true };
}

export function addColorToGroup(
  config: BrandIdentityConfig,
  groupId: BrandColorGroupId,
  input: { hex: string; name: string; darkHexOverride?: string }
): {
  ok: boolean;
  config: BrandIdentityConfig;
  error?: string;
  addedColor?: BrandColorItem;
} {
  const group = config.groups[groupId];
  if (!group) {
    return { ok: false, config, error: `Unknown color group: ${groupId}` };
  }

  const validated = validateAndNormalizeHex(input.hex);
  if (!validated.valid) {
    return { ok: false, config, error: validated.error };
  }

  const cleanName = (input.name || "").trim() || `Brand ${validated.hex}`;
  const nextOrder =
    group.colors.length > 0 ? Math.max(...group.colors.map((c) => c.order)) + 1 : 0;

  const newColor: BrandColorItem = {
    id: `${groupId}_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    hex: validated.hex,
    name: cleanName,
    enabled: true,
    order: nextOrder,
    ...(input.darkHexOverride ? { darkHexOverride: input.darkHexOverride } : {}),
  };

  const nextGroup: BrandColorGroupConfig = {
    ...group,
    colors: [...group.colors, newColor],
  };

  return {
    ok: true,
    addedColor: newColor,
    config: {
      ...config,
      groups: {
        ...config.groups,
        [groupId]: nextGroup,
      },
    },
  };
}

export function updateColorInGroup(
  config: BrandIdentityConfig,
  groupId: BrandColorGroupId,
  colorId: string,
  patch: Partial<Pick<BrandColorItem, "hex" | "name" | "enabled" | "darkHexOverride">>
): { ok: boolean; config: BrandIdentityConfig; error?: string } {
  const group = config.groups[groupId];
  if (!group) {
    return { ok: false, config, error: `Unknown color group: ${groupId}` };
  }

  const target = group.colors.find((c) => c.id === colorId);
  if (!target) {
    return { ok: false, config, error: "Color entry not found." };
  }

  let normalizedHex = target.hex;
  if (patch.hex !== undefined) {
    const validated = validateAndNormalizeHex(patch.hex);
    if (!validated.valid) {
      return { ok: false, config, error: validated.error };
    }
    normalizedHex = validated.hex;
  }

  if (patch.enabled === false && target.enabled) {
    const guard = canRemoveOrDisableColor(group, colorId);
    if (!guard.allowed) {
      return { ok: false, config, error: guard.reason };
    }
  }

  const updatedColors = group.colors.map((c) => {
    if (c.id !== colorId) return c;
    return {
      ...c,
      hex: normalizedHex,
      name: patch.name !== undefined ? patch.name.trim() || c.name : c.name,
      enabled: patch.enabled !== undefined ? patch.enabled : c.enabled,
      darkHexOverride:
        patch.darkHexOverride !== undefined ? patch.darkHexOverride : c.darkHexOverride,
    };
  });

  // If the staticColorId was disabled, point staticColorId to the first enabled color
  let nextStaticColorId = group.rotation.staticColorId;
  const staticStillEnabled = updatedColors.find(
    (c) => c.id === nextStaticColorId && c.enabled
  );
  if (!staticStillEnabled) {
    const firstEnabled = updatedColors.find((c) => c.enabled);
    if (firstEnabled) {
      nextStaticColorId = firstEnabled.id;
    }
  }

  return {
    ok: true,
    config: {
      ...config,
      groups: {
        ...config.groups,
        [groupId]: {
          ...group,
          colors: updatedColors,
          rotation: {
            ...group.rotation,
            staticColorId: nextStaticColorId,
          },
        },
      },
    },
  };
}

export function removeColorFromGroup(
  config: BrandIdentityConfig,
  groupId: BrandColorGroupId,
  colorId: string
): { ok: boolean; config: BrandIdentityConfig; error?: string } {
  const group = config.groups[groupId];
  if (!group) {
    return { ok: false, config, error: `Unknown color group: ${groupId}` };
  }

  const guard = canRemoveOrDisableColor(group, colorId);
  if (!guard.allowed) {
    return { ok: false, config, error: guard.reason };
  }

  const remaining = group.colors
    .filter((c) => c.id !== colorId)
    .map((c, idx) => ({ ...c, order: idx }));

  let nextStaticColorId = group.rotation.staticColorId;
  if (
    nextStaticColorId === colorId ||
    !remaining.some((c) => c.id === nextStaticColorId && c.enabled)
  ) {
    const firstEnabled = remaining.find((c) => c.enabled) || remaining[0];
    nextStaticColorId = firstEnabled.id;
  }

  return {
    ok: true,
    config: {
      ...config,
      groups: {
        ...config.groups,
        [groupId]: {
          ...group,
          colors: remaining,
          rotation: {
            ...group.rotation,
            staticColorId: nextStaticColorId,
          },
        },
      },
    },
  };
}

export function reorderColorInGroup(
  config: BrandIdentityConfig,
  groupId: BrandColorGroupId,
  colorId: string,
  direction: "up" | "down"
): BrandIdentityConfig {
  const group = config.groups[groupId];
  if (!group) return config;

  const sorted = [...group.colors].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((c) => c.id === colorId);
  if (idx === -1) return config;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) return config;

  const temp = sorted[idx];
  sorted[idx] = sorted[swapIdx];
  sorted[swapIdx] = temp;

  const reindexed = sorted.map((c, i) => ({ ...c, order: i }));

  return {
    ...config,
    groups: {
      ...config.groups,
      [groupId]: {
        ...group,
        colors: reindexed,
      },
    },
  };
}

export function updateGroupRotation(
  config: BrandIdentityConfig,
  groupId: BrandColorGroupId,
  rotationPatch: Partial<GroupRotationConfig>
): { ok: boolean; config: BrandIdentityConfig; error?: string } {
  const group = config.groups[groupId];
  if (!group) {
    return { ok: false, config, error: `Unknown color group: ${groupId}` };
  }

  let nextInterval = group.rotation.intervalSeconds;
  if (rotationPatch.intervalSeconds !== undefined) {
    const parsed = Number(rotationPatch.intervalSeconds);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 86400) {
      return {
        ok: false,
        config,
        error: "Rotation interval must be between 1 and 86,400 seconds.",
      };
    }
    nextInterval = Math.round(parsed);
  }

  let nextStaticId =
    rotationPatch.staticColorId !== undefined
      ? rotationPatch.staticColorId
      : group.rotation.staticColorId;
  const enabledList = getEnabledColors(group);
  if (!enabledList.some((c) => c.id === nextStaticId)) {
    nextStaticId = enabledList[0].id;
  }

  return {
    ok: true,
    config: {
      ...config,
      groups: {
        ...config.groups,
        [groupId]: {
          ...group,
          rotation: {
            ...group.rotation,
            ...rotationPatch,
            intervalSeconds: nextInterval,
            staticColorId: nextStaticId,
          },
        },
      },
    },
  };
}

export function resolveGroupActiveColor(
  group: BrandColorGroupConfig,
  cursorIndex: number
): BrandColorItem {
  const enabled = getEnabledColors(group);
  if (group.rotation.mode === "static") {
    const pinned = enabled.find((c) => c.id === group.rotation.staticColorId);
    return pinned || enabled[0];
  }
  const safeIdx =
    ((cursorIndex % enabled.length) + enabled.length) % enabled.length;
  return enabled[safeIdx] || enabled[0];
}

// ============================================================================
// PHASE 5: EXACT FOOTER GRADIENT PRESERVATION FORMULA
// ============================================================================

export function computeFooterGradientCSS(
  effectiveButtonColor: string,
  darkMode: boolean
): {
  background: string;
  borderTop: string;
  backToTopBg: string;
  backToTopBorder: string;
} {
  const background = darkMode
    ? `linear-gradient(180deg, #0f172a 0%, color-mix(in srgb, ${effectiveButtonColor} 16%, #0f172a) 55%, color-mix(in srgb, ${effectiveButtonColor} 36%, #0f172a) 100%)`
    : `linear-gradient(180deg, #ffffff 0%, color-mix(in srgb, ${effectiveButtonColor} 6%, #ffffff) 45%, color-mix(in srgb, ${effectiveButtonColor} 18%, #ffffff) 80%, color-mix(in srgb, ${effectiveButtonColor} 30%, #ffffff) 100%)`;

  const borderTop = darkMode
    ? "1px solid rgba(255, 255, 255, 0.08)"
    : `1px solid color-mix(in srgb, ${effectiveButtonColor} 14%, #e2e8f0)`;

  const backToTopBg = darkMode
    ? `linear-gradient(90deg, transparent 0%, color-mix(in srgb, ${effectiveButtonColor} 22%, #1e293b) 50%, transparent 100%)`
    : `linear-gradient(90deg, #ffffff 0%, color-mix(in srgb, ${effectiveButtonColor} 10%, #ffffff) 50%, #ffffff 100%)`;

  const backToTopBorder = darkMode
    ? "1px solid rgba(255,255,255,0.06)"
    : `1px solid color-mix(in srgb, ${effectiveButtonColor} 12%, #f1f5f9)`;

  return {
    background,
    borderTop,
    backToTopBg,
    backToTopBorder,
  };
}

// ============================================================================
// SANITIZATION & PERSISTENCE HELPERS
// ============================================================================

export function sanitizeBrandIdentityConfig(raw: any): BrandIdentityConfig {
  const fallback = createDefaultBrandIdentityConfig();
  if (!raw || typeof raw !== "object" || !raw.groups) {
    return fallback;
  }

  const nextGroups = { ...fallback.groups };
  for (const groupId of BRAND_COLOR_GROUP_ORDER) {
    const incomingGroup = raw.groups[groupId];
    if (!incomingGroup || !Array.isArray(incomingGroup.colors)) continue;

    // Filter out any legacy desert/gold colors if someone had an old snapshot and validate HEX
    const validColors: BrandColorItem[] = [];
    incomingGroup.colors.forEach((c: any, idx: number) => {
      if (!c || typeof c.hex !== "string") return;
      const norm = validateAndNormalizeHex(c.hex);
      if (!norm.valid) return;
      if (isForbiddenLegacyDesertOrGoldHex(norm.hex)) return;
      validColors.push({
        id: String(c.id || `${groupId}_c_${idx}`),
        hex: norm.hex,
        name: String(c.name || `Brand ${norm.hex}`).trim(),
        enabled: c.enabled !== false,
        order: typeof c.order === "number" ? c.order : idx,
        ...(c.darkHexOverride ? { darkHexOverride: String(c.darkHexOverride) } : {}),
      });
    });

    if (validColors.length === 0) continue;
    if (!validColors.some((c) => c.enabled)) {
      validColors[0].enabled = true;
    }

    const incomingRot = incomingGroup.rotation || {};
    const mode: RotationMode =
      incomingRot.mode === "refresh" ||
      incomingRot.mode === "interval" ||
      incomingRot.mode === "static"
        ? incomingRot.mode
        : fallback.groups[groupId].rotation.mode;

    const intervalSeconds =
      typeof incomingRot.intervalSeconds === "number" &&
      incomingRot.intervalSeconds >= 1 &&
      incomingRot.intervalSeconds <= 86400
        ? Math.round(incomingRot.intervalSeconds)
        : fallback.groups[groupId].rotation.intervalSeconds;

    const enabledSubset = validColors.filter((c) => c.enabled);
    const staticColorId = enabledSubset.some((c) => c.id === incomingRot.staticColorId)
      ? incomingRot.staticColorId
      : enabledSubset[0].id;

    nextGroups[groupId] = {
      ...fallback.groups[groupId],
      colors: validColors,
      rotation: {
        mode,
        intervalSeconds,
        staticColorId,
        ...(groupId === "footer"
          ? {
              syncWithHeader:
                typeof incomingRot.syncWithHeader === "boolean"
                  ? incomingRot.syncWithHeader
                  : true,
            }
          : {}),
      },
    };
  }

  return {
    version: typeof raw.version === "number" ? raw.version : fallback.version,
    publishedAt:
      typeof raw.publishedAt === "string" ? raw.publishedAt : fallback.publishedAt,
    publishedBy:
      typeof raw.publishedBy === "string" ? raw.publishedBy : fallback.publishedBy,
    groups: nextGroups,
    themeConfig: {
      adaptContrastAutomatically:
        raw.themeConfig?.adaptContrastAutomatically !== false,
      respectReducedMotion: raw.themeConfig?.respectReducedMotion !== false,
      darkModeSurfaceBlend: raw.themeConfig?.darkModeSurfaceBlend !== false,
    },
  };
}

export function loadPublishedBrandIdentity(): BrandIdentityConfig {
  try {
    if (typeof localStorage === "undefined") {
      return createDefaultBrandIdentityConfig();
    }
    const raw = localStorage.getItem(BRAND_IDENTITY_STORAGE_KEYS.PUBLISHED);
    if (!raw) return createDefaultBrandIdentityConfig();
    return sanitizeBrandIdentityConfig(JSON.parse(raw));
  } catch {
    return createDefaultBrandIdentityConfig();
  }
}

export function loadPreviousPublishedBrandIdentity(): BrandIdentityConfig | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(BRAND_IDENTITY_STORAGE_KEYS.PREVIOUS);
    if (!raw) return null;
    return sanitizeBrandIdentityConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function loadDraftBrandIdentity(): BrandIdentityConfig | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(BRAND_IDENTITY_STORAGE_KEYS.DRAFT);
    if (!raw) return null;
    return sanitizeBrandIdentityConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveDraftBrandIdentity(config: BrandIdentityConfig | null): void {
  try {
    if (typeof localStorage === "undefined") return;
    if (!config) {
      localStorage.removeItem(BRAND_IDENTITY_STORAGE_KEYS.DRAFT);
    } else {
      localStorage.setItem(BRAND_IDENTITY_STORAGE_KEYS.DRAFT, JSON.stringify(config));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function savePublishedBrandIdentity(
  nextConfig: BrandIdentityConfig,
  previousSnapshot?: BrandIdentityConfig
): void {
  try {
    if (typeof localStorage === "undefined") return;
    if (previousSnapshot) {
      localStorage.setItem(
        BRAND_IDENTITY_STORAGE_KEYS.PREVIOUS,
        JSON.stringify(previousSnapshot)
      );
    }
    localStorage.setItem(
      BRAND_IDENTITY_STORAGE_KEYS.PUBLISHED,
      JSON.stringify(nextConfig)
    );
    localStorage.removeItem(BRAND_IDENTITY_STORAGE_KEYS.DRAFT);
  } catch {
    // Ignore storage quota errors
  }
}

// ============================================================================
// SYNCHRONOUS PAGE-REFRESH BOOTSTRAP (ZERO FLICKER ON PAGE LOAD)
// ============================================================================

let BOOTSTRAPPED_SESSION_CURSORS: Record<BrandColorGroupId, number> | null = null;

export function getInitialSessionCursors(
  config?: BrandIdentityConfig
): Record<BrandColorGroupId, number> {
  if (BOOTSTRAPPED_SESSION_CURSORS) {
    return BOOTSTRAPPED_SESSION_CURSORS;
  }

  const activeConfig = config || loadPublishedBrandIdentity();
  const cursors: Record<BrandColorGroupId, number> = {
    header: 0,
    footer: 0,
    buttons: 0,
    links: 0,
    backgrounds: 0,
    accents: 0,
    additional: 0,
  };

  try {
    if (typeof localStorage !== "undefined") {
      for (const groupId of BRAND_COLOR_GROUP_ORDER) {
        const group = activeConfig.groups[groupId];
        const enabled = getEnabledColors(group);
        const key = `${BRAND_IDENTITY_STORAGE_KEYS.REFRESH_CURSOR_PREFIX}${groupId}`;
        const prevRaw = localStorage.getItem(key);
        const prevIdx = prevRaw !== null ? parseInt(prevRaw, 10) : -1;

        if (group.rotation.mode === "refresh") {
          const nextIdx =
            Number.isNaN(prevIdx) || prevIdx < 0
              ? 0
              : (prevIdx + 1) % Math.max(1, enabled.length);
          cursors[groupId] = nextIdx;
          localStorage.setItem(key, String(nextIdx));
          if (groupId === "header") {
            localStorage.setItem(
              BRAND_IDENTITY_STORAGE_KEYS.LEGACY_HEADER_INDEX,
              String(nextIdx)
            );
          }
        } else {
          cursors[groupId] =
            Number.isNaN(prevIdx) || prevIdx < 0
              ? 0
              : prevIdx % Math.max(1, enabled.length);
        }
      }
    }
  } catch {
    // Fallback to 0
  }

  BOOTSTRAPPED_SESSION_CURSORS = cursors;
  return cursors;
}

export function resolveAllGroupsState(
  config: BrandIdentityConfig,
  cursors: Record<BrandColorGroupId, number>,
  darkMode = false
): Record<BrandColorGroupId, ResolvedGroupColorState> {
  const result = {} as Record<BrandColorGroupId, ResolvedGroupColorState>;

  for (const groupId of BRAND_COLOR_GROUP_ORDER) {
    const group = config.groups[groupId];
    let activeColor = resolveGroupActiveColor(group, cursors[groupId] || 0);

    // Phase 5: Footer follows header color by default when syncWithHeader !== false
    if (
      groupId === "footer" &&
      group.rotation.syncWithHeader !== false &&
      result.header
    ) {
      activeColor = result.header.activeColor;
    }

    const rawHex =
      darkMode && activeColor.darkHexOverride
        ? activeColor.darkHexOverride
        : activeColor.hex;

    const lightSurface = isLightColor(rawHex);
    const foregroundHex = getContrastSafeForeground(rawHex);

    result[groupId] = {
      groupId,
      activeColor,
      effectiveHex: rawHex,
      foregroundHex,
      isLightSurface: lightSurface,
      contrastWithWhite: getContrastRatio(rawHex, "#FFFFFF"),
      contrastWithDark: getContrastRatio(rawHex, "#0F172A"),
    };
  }

  return result;
}

export function applyBrandIdentityTokensToDOM(
  resolved: Record<BrandColorGroupId, ResolvedGroupColorState>,
  darkMode: boolean
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const headerHex = darkMode ? "#0F172A" : resolved.header.effectiveHex;
  const headerFg = darkMode ? "#F8FAFC" : resolved.header.foregroundHex;
  const headerIsLight = !darkMode && resolved.header.isLightSurface;

  const footerHex = resolved.footer.effectiveHex;
  const btnPrimaryHex = resolved.buttons.effectiveHex;
  const btnPrimaryFg = resolved.buttons.foregroundHex;
  const linkHex = resolved.links.effectiveHex;
  const bgSurfaceHex = darkMode ? "#0F172A" : resolved.backgrounds.effectiveHex;
  const accentHex = resolved.accents.effectiveHex;
  const additionalHex = resolved.additional.effectiveHex;

  root.style.setProperty("--yume-theme-header-color", headerHex);
  root.style.setProperty("--yume-theme-header-raw-color", resolved.header.effectiveHex);
  root.style.setProperty("--yume-theme-header-fg", headerFg);
  root.style.setProperty(
    "--yume-theme-header-border",
    headerIsLight ? "rgba(15, 23, 42, 0.14)" : "rgba(255, 255, 255, 0.2)"
  );
  root.setAttribute("data-yume-header-tone", headerIsLight ? "light" : "dark");

  root.style.setProperty("--yume-theme-footer-color", footerHex);
  root.style.setProperty("--yume-color-btn-primary", btnPrimaryHex);
  root.style.setProperty("--yume-color-btn-primary-fg", btnPrimaryFg);
  root.style.setProperty(
    "--yume-color-btn-secondary",
    `color-mix(in srgb, ${btnPrimaryHex} 12%, ${darkMode ? "#1E293B" : "#FFFFFF"})`
  );
  root.style.setProperty("--yume-color-link", linkHex);
  root.style.setProperty("--yume-color-bg-surface", bgSurfaceHex);
  root.style.setProperty("--yume-color-accent", accentHex);
  root.style.setProperty("--yume-color-accent-fg", resolved.accents.foregroundHex);
  root.style.setProperty("--yume-color-brand-extra", additionalHex);
}

// ============================================================================
// REACT HOOK: CENTRALIZED COLOR ROTATION & PREVIEW/PUBLISH ENGINE
// ============================================================================

export function useBrandIdentityColorEngine(darkMode: boolean) {
  const [publishedConfig, setPublishedConfig] = useState<BrandIdentityConfig>(() =>
    loadPublishedBrandIdentity()
  );
  const [previousConfig, setPreviousConfig] = useState<BrandIdentityConfig | null>(() =>
    loadPreviousPublishedBrandIdentity()
  );
  const [draftConfig, setDraftConfigState] = useState<BrandIdentityConfig | null>(() =>
    loadDraftBrandIdentity()
  );
  const [isPreviewActive, setIsPreviewActiveState] = useState<boolean>(() => {
    try {
      return (
        typeof localStorage !== "undefined" &&
        localStorage.getItem(BRAND_IDENTITY_STORAGE_KEYS.PREVIEW_ACTIVE) === "true"
      );
    } catch {
      return false;
    }
  });

  const [cursors, setCursors] = useState<Record<BrandColorGroupId, number>>(() =>
    getInitialSessionCursors()
  );

  const activeConfig = useMemo(() => {
    if (isPreviewActive && draftConfig) {
      return draftConfig;
    }
    return publishedConfig;
  }, [isPreviewActive, draftConfig, publishedConfig]);

  const resolvedGroups = useMemo(
    () => resolveAllGroupsState(activeConfig, cursors, darkMode),
    [activeConfig, cursors, darkMode]
  );

  // Apply CSS custom properties whenever resolved colors or theme mode change
  useEffect(() => {
    applyBrandIdentityTokensToDOM(resolvedGroups, darkMode);
  }, [resolvedGroups, darkMode]);

  // Fetch latest published configuration from backend on initial mount
  useEffect(() => {
    let mounted = true;
    fetch("/api/brand-identity")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        if (data.publishedConfig) {
          const sanitized = sanitizeBrandIdentityConfig(data.publishedConfig);
          setPublishedConfig(sanitized);
          savePublishedBrandIdentity(
            sanitized,
            data.previousConfig
              ? sanitizeBrandIdentityConfig(data.previousConfig)
              : undefined
          );
        }
        if (data.previousConfig) {
          setPreviousConfig(sanitizeBrandIdentityConfig(data.previousConfig));
        }
      })
      .catch(() => {
        // Offline / static build mode uses localStorage fallback seamlessly
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Listen for cross-component / cross-tab updates
  useEffect(() => {
    const handleSync = () => {
      setPublishedConfig(loadPublishedBrandIdentity());
      setPreviousConfig(loadPreviousPublishedBrandIdentity());
      setDraftConfigState(loadDraftBrandIdentity());
      try {
        setIsPreviewActiveState(
          localStorage.getItem(BRAND_IDENTITY_STORAGE_KEYS.PREVIEW_ACTIVE) === "true"
        );
      } catch {
        // ignore
      }
    };
    window.addEventListener(BRAND_IDENTITY_UPDATED_EVENT, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(BRAND_IDENTITY_UPDATED_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Independent Time-Based Rotation Timers per Group (Zero DB writes on ticks)
  const timersRef = useRef<Partial<Record<BrandColorGroupId, ReturnType<typeof setInterval>>>>({});

  useEffect(() => {
    // Clear all existing intervals before re-scheduling
    BRAND_COLOR_GROUP_ORDER.forEach((gid) => {
      const timer = timersRef.current[gid];
      if (timer) clearInterval(timer);
    });
    timersRef.current = {};

    const respectReducedMotion =
      activeConfig.themeConfig.respectReducedMotion &&
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (respectReducedMotion) {
      return;
    }

    for (const groupId of BRAND_COLOR_GROUP_ORDER) {
      const group = activeConfig.groups[groupId];
      if (!group) continue;

      // Footer in header-sync mode follows header timer automatically
      if (groupId === "footer" && group.rotation.syncWithHeader !== false) {
        continue;
      }

      if (group.rotation.mode === "interval") {
        const enabledCount = getEnabledColors(group).length;
        if (enabledCount > 1) {
          const ms = Math.max(1, group.rotation.intervalSeconds) * 1000;
          timersRef.current[groupId] = setInterval(() => {
            setCursors((prev) => ({
              ...prev,
              [groupId]: ((prev[groupId] || 0) + 1) % enabledCount,
            }));
          }, ms);
        }
      }
    }

    return () => {
      BRAND_COLOR_GROUP_ORDER.forEach((gid) => {
        const timer = timersRef.current[gid];
        if (timer) clearInterval(timer);
      });
      timersRef.current = {};
    };
  }, [activeConfig]);

  const emitSyncEvent = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(BRAND_IDENTITY_UPDATED_EVENT));
    }
  }, []);

  const updateDraft = useCallback(
    (updater: BrandIdentityConfig | ((prev: BrandIdentityConfig) => BrandIdentityConfig)) => {
      setDraftConfigState((prev) => {
        const base = prev || publishedConfig;
        const next = typeof updater === "function" ? updater(base) : updater;
        saveDraftBrandIdentity(next);
        return next;
      });
      emitSyncEvent();
    },
    [publishedConfig, emitSyncEvent]
  );

  const togglePreviewMode = useCallback(
    (nextActive?: boolean) => {
      setIsPreviewActiveState((prev) => {
        const target = typeof nextActive === "boolean" ? nextActive : !prev;
        try {
          localStorage.setItem(
            BRAND_IDENTITY_STORAGE_KEYS.PREVIEW_ACTIVE,
            target ? "true" : "false"
          );
        } catch {
          // ignore
        }
        return target;
      });
      emitSyncEvent();
    },
    [emitSyncEvent]
  );

  const publishDraftChanges = useCallback(
    async (adminActor = "super_admin"): Promise<{ ok: boolean; error?: string }> => {
      const candidate = draftConfig || publishedConfig;
      const snapshotBeforePublish = publishedConfig;
      const nextPublished: BrandIdentityConfig = {
        ...candidate,
        version: (publishedConfig.version || 1) + 1,
        publishedAt: new Date().toISOString(),
        publishedBy: adminActor,
      };

      savePublishedBrandIdentity(nextPublished, snapshotBeforePublish);
      setPreviousConfig(snapshotBeforePublish);
      setPublishedConfig(nextPublished);
      setDraftConfigState(null);
      setIsPreviewActiveState(false);
      try {
        localStorage.setItem(BRAND_IDENTITY_STORAGE_KEYS.PREVIEW_ACTIVE, "false");
      } catch {
        // ignore
      }

      try {
        await fetch("/api/brand-identity", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publishedConfig: nextPublished,
            previousConfig: snapshotBeforePublish,
          }),
        });
      } catch {
        // Local storage persistence already succeeded
      }

      emitSyncEvent();
      return { ok: true };
    },
    [draftConfig, publishedConfig, emitSyncEvent]
  );

  const restorePreviousConfiguration = useCallback(async (): Promise<{
    ok: boolean;
    error?: string;
  }> => {
    if (!previousConfig) {
      return {
        ok: false,
        error: "No previous published configuration snapshot is available to restore.",
      };
    }

    const restored: BrandIdentityConfig = {
      ...previousConfig,
      version: (publishedConfig.version || 1) + 1,
      publishedAt: new Date().toISOString(),
    };

    savePublishedBrandIdentity(restored, publishedConfig);
    setPreviousConfig(publishedConfig);
    setPublishedConfig(restored);
    setDraftConfigState(null);
    setIsPreviewActiveState(false);
    try {
      localStorage.setItem(BRAND_IDENTITY_STORAGE_KEYS.PREVIEW_ACTIVE, "false");
    } catch {
      // ignore
    }

    try {
      await fetch("/api/brand-identity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publishedConfig: restored,
          previousConfig: publishedConfig,
        }),
      });
    } catch {
      // Local storage persistence already succeeded
    }

    emitSyncEvent();
    return { ok: true };
  }, [previousConfig, publishedConfig, emitSyncEvent]);

  const resetToDefaultPalette = useCallback(async (): Promise<{ ok: boolean }> => {
    const defaultCfg = createDefaultBrandIdentityConfig();
    const nextPublished: BrandIdentityConfig = {
      ...defaultCfg,
      version: (publishedConfig.version || 1) + 1,
      publishedAt: new Date().toISOString(),
      publishedBy: "reset_to_default",
    };

    savePublishedBrandIdentity(nextPublished, publishedConfig);
    setPreviousConfig(publishedConfig);
    setPublishedConfig(nextPublished);
    setDraftConfigState(null);
    setIsPreviewActiveState(false);
    try {
      localStorage.setItem(BRAND_IDENTITY_STORAGE_KEYS.PREVIEW_ACTIVE, "false");
    } catch {
      // ignore
    }

    try {
      await fetch("/api/brand-identity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publishedConfig: nextPublished,
          previousConfig: publishedConfig,
        }),
      });
    } catch {
      // Local storage persistence already succeeded
    }

    emitSyncEvent();
    return { ok: true };
  }, [publishedConfig, emitSyncEvent]);

  const discardDraftChanges = useCallback(() => {
    saveDraftBrandIdentity(null);
    setDraftConfigState(null);
    setIsPreviewActiveState(false);
    try {
      localStorage.setItem(BRAND_IDENTITY_STORAGE_KEYS.PREVIEW_ACTIVE, "false");
    } catch {
      // ignore
    }
    emitSyncEvent();
  }, [emitSyncEvent]);

  return {
    publishedConfig,
    previousConfig,
    draftConfig: draftConfig || publishedConfig,
    hasUnsavedChanges:
      draftConfig !== null &&
      JSON.stringify(draftConfig.groups) !== JSON.stringify(publishedConfig.groups),
    isPreviewActive,
    activeConfig,
    resolvedGroups,
    cursors,
    updateDraft,
    togglePreviewMode,
    publishDraftChanges,
    restorePreviousConfiguration,
    resetToDefaultPalette,
    discardDraftChanges,
  };
}
