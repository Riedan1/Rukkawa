import type { MerchantStore } from "../types";

// ============================================================================
// 1. TYPES & INTERFACES
// ============================================================================

export type DockSpacingPreset = "small" | "medium" | "large" | "custom";
export type DockThemePreset = "frosted" | "obsidian" | "aurora" | "neon";
export type FollowerCountDisplayMode = "actual" | "icon_only" | "hidden_label";

export type PublicStoreNavTabId =
  | "reels"
  | "compare"
  | "picks"
  | "reviews"
  | "saved"
  | "deals"
  | "search"
  | "filters"
  | "layout";

export interface StoreDockAppearanceSettings {
  buttonScale: number; // 0.80 to 1.40
  spacingPreset: DockSpacingPreset;
  customGapPx: number; // 4 to 32
  theme: DockThemePreset;
  buttonColors: {
    followBg: string;
    followText: string;
    messageBg: string;
    messageText: string;
    moreBg: string;
    moreText: string;
  };
  enableTooltips: boolean;
  enableActiveIndicators: boolean;
}

export interface StoreDockVisibilitySettings {
  followerCountMode: FollowerCountDisplayMode;
  showStoreLocation: boolean;
  navigation: {
    products: true; // Products MUST ALWAYS remain visible
    reels: boolean;
    compare: boolean;
    picks: boolean;
    reviews: boolean;
    saved: boolean;
    deals: boolean;
    search: boolean;
    filters: boolean;
    layout: boolean;
  };
}

export interface StoreDockSettings {
  appearance: StoreDockAppearanceSettings;
  visibility: StoreDockVisibilitySettings;
  updatedAt?: string;
  updatedByOwnerEmail?: string;
}

export type MoreOptionsMenuItemId =
  | "share_store"
  | "partner_picks"
  | "collab"
  | "mute_store"
  | "dock_settings"
  | "store_details"
  | "generate_qr_code"
  | "report_store"
  | "block_store";

export type PartnerPicksEntryFlow =
  | "merchant_workspace"
  | "partnership_request"
  | "visitor_info";

export interface PartnerPicksEntryContext {
  storeId: string;
  storeName: string;
  isStrictOwner: boolean;
  isAuthenticated: boolean;
  isMerchantVisitor: boolean;
  entryFlow: PartnerPicksEntryFlow;
  language: "en" | "fr" | "ar";
  localizedTitle: string;
  localizedNotice: string;
}

export interface MoreOptionsMenuItemDescriptor {
  id: MoreOptionsMenuItemId;
  order: number;
  label: string;
  sublabel?: string;
  isDanger?: boolean;
  isPlaceholder?: boolean;
  isActiveState?: boolean;
}

export type MuteDurationPresetId =
  | "1h"
  | "8h"
  | "24h"
  | "7d"
  | "30d"
  | "forever"
  | "custom";

export interface CustomMuteDurationInput {
  days: number;
  hours: number;
  minutes: number;
}

export interface UserStoreMuteRecord {
  storeId: string;
  mutedAt: string;
  expiresAt: string | null; // null = Forever
  presetId: MuteDurationPresetId;
  durationLabel: string;
}

export interface UserStoreBlockRecord {
  storeId: string;
  blockedAt: string;
}

export type StoreNotificationCategory =
  | "new_story"
  | "new_offer"
  | "promotional_announcement"
  | "new_product"
  | "general_store_update"
  | "direct_message"
  | "order_confirmation"
  | "order_status"
  | "shipping"
  | "delivery"
  | "payment"
  | "transaction";

export const REPORT_STORE_REASONS = [
  "Fake Store",
  "Fraud or Scam",
  "Counterfeit Products",
  "Misleading Information",
  "Inappropriate Content",
  "Intellectual Property Violation",
  "Harassment",
  "Other",
] as const;

export type ReportStoreReason = (typeof REPORT_STORE_REASONS)[number];
export type StoreReportStatus = "new" | "under_review" | "resolved" | "rejected";
export type StoreReportPriority = "low" | "medium" | "high" | "critical";

export interface StoreReportInternalNote {
  id: string;
  authorName: string;
  authorRole: string;
  note: string;
  createdAt: string;
}

export interface StoreReportHistoryEntry {
  id: string;
  action: string;
  actorName: string;
  timestamp: string;
  details?: string;
}

export interface StoreReportRecord {
  id: string;
  storeId: string;
  storeName: string;
  storeSlug?: string;
  storeLogo?: string;
  storeWilaya?: string;
  primaryReason: ReportStoreReason;
  additionalDetails: string;
  status: StoreReportStatus;
  priority: StoreReportPriority;
  createdAt: string;
  updatedAt: string;
  /**
   * Stored server-side ONLY for duplicate-submission protection.
   * NEVER exposed to the reported merchant.
   */
  reporterKey?: string;
  internalNotes: StoreReportInternalNote[];
  investigationHistory: StoreReportHistoryEntry[];
}

export type SharePlatformId =
  | "facebook"
  | "messenger"
  | "whatsapp"
  | "telegram"
  | "viber"
  | "instagram"
  | "snapchat"
  | "tiktok"
  | "x"
  | "email";

// ============================================================================
// 2. DEFAULT DOCK SETTINGS & NORMALIZATION
// ============================================================================

export const DEFAULT_STORE_DOCK_SETTINGS: StoreDockSettings = {
  appearance: {
    buttonScale: 1,
    spacingPreset: "medium",
    customGapPx: 12,
    theme: "frosted",
    buttonColors: {
      followBg: "#0f9d76",
      followText: "#ffffff",
      messageBg: "#4f46e5",
      messageText: "#ffffff",
      moreBg: "#4f46e5",
      moreText: "#ffffff",
    },
    enableTooltips: true,
    enableActiveIndicators: true,
  },
  visibility: {
    followerCountMode: "actual",
    showStoreLocation: true,
    navigation: {
      products: true,
      reels: true,
      compare: true,
      picks: true,
      reviews: true,
      saved: true,
      deals: true,
      search: true,
      filters: true,
      layout: true,
    },
  },
};

function sanitizeHexOrCssColor(val: unknown, fallback: string): string {
  if (typeof val !== "string") return fallback;
  const trimmed = val.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  if (/^rgba?\([\d\s.,%]+\)$/.test(trimmed)) return trimmed;
  return fallback;
}

export function normalizeStoreDockSettings(raw?: any): StoreDockSettings {
  const srcApp = raw?.appearance || {};
  const srcVis = raw?.visibility || {};
  const srcColors = srcApp?.buttonColors || {};
  const srcNav = srcVis?.navigation || {};

  const rawScale = Number(srcApp.buttonScale);
  const buttonScale = Number.isFinite(rawScale)
    ? Math.min(1.4, Math.max(0.8, Number(rawScale.toFixed(2))))
    : DEFAULT_STORE_DOCK_SETTINGS.appearance.buttonScale;

  const spacingPreset: DockSpacingPreset =
    srcApp.spacingPreset === "small" ||
    srcApp.spacingPreset === "medium" ||
    srcApp.spacingPreset === "large" ||
    srcApp.spacingPreset === "custom"
      ? srcApp.spacingPreset
      : "medium";

  const rawGap = Number(srcApp.customGapPx);
  const customGapPx = Number.isFinite(rawGap)
    ? Math.min(32, Math.max(4, Math.round(rawGap)))
    : DEFAULT_STORE_DOCK_SETTINGS.appearance.customGapPx;

  const theme: DockThemePreset =
    srcApp.theme === "frosted" ||
    srcApp.theme === "obsidian" ||
    srcApp.theme === "aurora" ||
    srcApp.theme === "neon"
      ? srcApp.theme
      : "frosted";

  const followerCountMode: FollowerCountDisplayMode =
    srcVis.followerCountMode === "actual" ||
    srcVis.followerCountMode === "icon_only" ||
    srcVis.followerCountMode === "hidden_label"
      ? srcVis.followerCountMode
      : "actual";

  return {
    appearance: {
      buttonScale,
      spacingPreset,
      customGapPx,
      theme,
      buttonColors: {
        followBg: sanitizeHexOrCssColor(
          srcColors.followBg,
          DEFAULT_STORE_DOCK_SETTINGS.appearance.buttonColors.followBg
        ),
        followText: sanitizeHexOrCssColor(
          srcColors.followText,
          DEFAULT_STORE_DOCK_SETTINGS.appearance.buttonColors.followText
        ),
        messageBg: sanitizeHexOrCssColor(
          srcColors.messageBg,
          DEFAULT_STORE_DOCK_SETTINGS.appearance.buttonColors.messageBg
        ),
        messageText: sanitizeHexOrCssColor(
          srcColors.messageText,
          DEFAULT_STORE_DOCK_SETTINGS.appearance.buttonColors.messageText
        ),
        moreBg: sanitizeHexOrCssColor(
          srcColors.moreBg,
          DEFAULT_STORE_DOCK_SETTINGS.appearance.buttonColors.moreBg
        ),
        moreText: sanitizeHexOrCssColor(
          srcColors.moreText,
          DEFAULT_STORE_DOCK_SETTINGS.appearance.buttonColors.moreText
        ),
      },
      enableTooltips:
        typeof srcApp.enableTooltips === "boolean"
          ? srcApp.enableTooltips
          : DEFAULT_STORE_DOCK_SETTINGS.appearance.enableTooltips,
      enableActiveIndicators:
        typeof srcApp.enableActiveIndicators === "boolean"
          ? srcApp.enableActiveIndicators
          : DEFAULT_STORE_DOCK_SETTINGS.appearance.enableActiveIndicators,
    },
    visibility: {
      followerCountMode,
      showStoreLocation:
        typeof srcVis.showStoreLocation === "boolean"
          ? srcVis.showStoreLocation
          : DEFAULT_STORE_DOCK_SETTINGS.visibility.showStoreLocation,
      navigation: {
        products: true, // Always true; Products cannot be hidden
        reels: typeof srcNav.reels === "boolean" ? srcNav.reels : true,
        compare: typeof srcNav.compare === "boolean" ? srcNav.compare : true,
        picks: typeof srcNav.picks === "boolean" ? srcNav.picks : true,
        reviews: typeof srcNav.reviews === "boolean" ? srcNav.reviews : true,
        saved: typeof srcNav.saved === "boolean" ? srcNav.saved : true,
        deals: typeof srcNav.deals === "boolean" ? srcNav.deals : true,
        search: typeof srcNav.search === "boolean" ? srcNav.search : true,
        filters: typeof srcNav.filters === "boolean" ? srcNav.filters : true,
        layout: typeof srcNav.layout === "boolean" ? srcNav.layout : true,
      },
    },
    updatedAt: typeof raw?.updatedAt === "string" ? raw.updatedAt : undefined,
    updatedByOwnerEmail:
      typeof raw?.updatedByOwnerEmail === "string" ? raw.updatedByOwnerEmail : undefined,
  };
}

export function resolveDockGapPixels(appearance: StoreDockAppearanceSettings): number {
  switch (appearance.spacingPreset) {
    case "small":
      return 8;
    case "medium":
      return 12;
    case "large":
      return 18;
    case "custom":
      return Math.min(32, Math.max(4, appearance.customGapPx || 12));
    default:
      return 12;
  }
}

// ============================================================================
// 3. STRICT STORE OWNER VERIFICATION (EXCLUDES TEAM, STORE ADMINS, MODERATORS)
// ============================================================================

export interface StrictOwnerVerificationResult {
  allowed: boolean;
  statusCode: 200 | 401 | 403;
  reason: string;
}

/**
 * Verifies that the user is exclusively the actual Store Owner of `targetStore`.
 * Store Administrators, Team Members, Moderators, Employees, Followers, Customers,
 * Guests, and Platform Admins (who are not the store's owner) are strictly rejected.
 */
export function verifyStrictStoreOwnership(params: {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    storeName?: string;
    ownedStoreIds?: string[];
  } | null;
  targetStore?: MerchantStore | Record<string, any> | null;
  activeStaffMemberId?: string | null;
}): StrictOwnerVerificationResult {
  const { user, targetStore, activeStaffMemberId } = params;

  if (!targetStore || !targetStore.id) {
    return {
      allowed: false,
      statusCode: 403,
      reason: "TARGET_STORE_INVALID: Store record not found.",
    };
  }

  if (!user || (!user.email && !user.id)) {
    return {
      allowed: false,
      statusCode: 401,
      reason: "UNAUTHENTICATED: Only the authenticated Store Owner can access Dock Settings.",
    };
  }

  // If acting under an active staff/team member session, reject immediately
  if (activeStaffMemberId) {
    return {
      allowed: false,
      statusCode: 403,
      reason:
        "STRICT_OWNER_ONLY: Store Administrators, Team Members, and Moderators are not permitted to access or modify Dock Settings.",
    };
  }

  const normalizedRole = String(user.role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (
    normalizedRole &&
    normalizedRole !== "merchant" &&
    normalizedRole !== "owner" &&
    normalizedRole !== "storeowner"
  ) {
    return {
      allowed: false,
      statusCode: 403,
      reason:
        "STRICT_OWNER_ONLY: Authorized store administrators, team members, moderators, and non-owner roles are not allowed to access or modify Dock Settings.",
    };
  }

  const cleanUserEmail = String(user.email || "").trim().toLowerCase();
  const cleanUserId = String(user.id || "").trim();

  // Check if the user is merely listed in teamMembers (admin, store_admin, manager, moderator, employee)
  const storeOwnerEmail = String((targetStore as any).ownerEmail || "").trim().toLowerCase();
  const storeOwnerId = String((targetStore as any).ownerId || "").trim();

  const isListedInTeamMembers =
    Array.isArray(targetStore.teamMembers) &&
    targetStore.teamMembers.some(
      (member: any) =>
        member &&
        String(member.email || "").trim().toLowerCase() === cleanUserEmail &&
        String(member.role || "").trim().toLowerCase() !== "owner"
    );

  if (isListedInTeamMembers) {
    return {
      allowed: false,
      statusCode: 403,
      reason:
        "STRICT_OWNER_ONLY: Team members, store administrators, and moderators cannot access or modify Dock Settings.",
    };
  }

  const ownsViaIdList =
    Array.isArray(user.ownedStoreIds) && user.ownedStoreIds.includes(targetStore.id);
  const ownsViaOwnerId = Boolean(storeOwnerId && cleanUserId && storeOwnerId === cleanUserId);
  const ownsViaOwnerEmail = Boolean(
    storeOwnerEmail && cleanUserEmail && storeOwnerEmail === cleanUserEmail
  );
  const ownsViaMerchantStoreName =
    user.role === "Merchant" &&
    Boolean(user.storeName) &&
    String(user.storeName).trim().toLowerCase() ===
      String(targetStore.name || "").trim().toLowerCase() &&
    !isListedInTeamMembers;

  const isActualOwner =
    (ownsViaIdList || ownsViaOwnerId || ownsViaOwnerEmail || ownsViaMerchantStoreName) &&
    !(isListedInTeamMembers && !ownsViaOwnerId && !ownsViaOwnerEmail && !ownsViaIdList);

  if (!isActualOwner) {
    return {
      allowed: false,
      statusCode: 403,
      reason:
        "STRICT_OWNER_ONLY: Only the Store Owner can access or modify Dock Settings.",
    };
  }

  return {
    allowed: true,
    statusCode: 200,
    reason: "Verified as strict Store Owner.",
  };
}

/**
 * Resolves the store IDs genuinely owned by an authenticated Merchant user,
 * without leaking a fallback default store when the user already has a specific
 * storeId or storeName.
 */
export function resolveMerchantOwnedStoreIds(
  user?: {
    role?: string;
    storeId?: string;
    storeName?: string;
    email?: string;
  } | null,
  allStores: Array<Pick<MerchantStore, "id" | "name"> & { ownerEmail?: string }> = [],
  fallbackMyStore?: Pick<MerchantStore, "id" | "name"> | null
): string[] {
  if (!user || user.role !== "Merchant") return [];

  const ids = new Set<string>();
  if (user.storeId) {
    ids.add(String(user.storeId));
  }

  const cleanName = String(user.storeName || "").trim().toLowerCase();
  if (cleanName) {
    for (const st of allStores) {
      if (st && String(st.name || "").trim().toLowerCase() === cleanName) {
        ids.add(String(st.id));
      }
    }
  }

  const cleanEmail = String(user.email || "").trim().toLowerCase();
  if (cleanEmail) {
    for (const st of allStores) {
      const ownerEmail = String((st as any)?.ownerEmail || "").trim().toLowerCase();
      if (st && ownerEmail && ownerEmail === cleanEmail) {
        ids.add(String(st.id));
      }
    }
  }

  // Only fall back to fallbackMyStore if merchant has neither storeId nor storeName
  if (ids.size === 0 && !user.storeId && !cleanName && fallbackMyStore?.id) {
    ids.add(String(fallbackMyStore.id));
  }

  return Array.from(ids);
}

/**
 * Determines whether the (+) Manage Stories button should be visible for a user
 * viewing a Store Profile.
 * Strictly allowed ONLY for:
 *  - The Store Owner of `targetStore`
 *  - Active Store Staff (administrators, managers, moderators, employees) belonging to `targetStore`
 * Explicitly rejected for:
 *  - Guests (unauthenticated visitors)
 *  - Regular Buyers / Customers
 *  - Owners or staff of other stores
 *  - Inactive / suspended staff members
 *  - Platform Admins who are not the store owner or store staff
 */
export function canUserManageStoreStories(params: {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    storeId?: string;
    storeName?: string;
    ownedStoreIds?: string[];
  } | null;
  targetStore?: MerchantStore | Record<string, any> | null;
  extraTeamMembers?: Array<{
    id?: string;
    email?: string;
    role?: string;
    status?: string;
  }>;
  activeStaffMemberId?: string | null;
}): boolean {
  const { user, targetStore, extraTeamMembers, activeStaffMemberId } = params;

  if (!targetStore || !targetStore.id) return false;
  if (!user || (!user.email && !user.id)) return false;

  // 1. Store Owner check
  if (
    verifyStrictStoreOwnership({
      user,
      targetStore,
      activeStaffMemberId: null,
    }).allowed
  ) {
    return true;
  }

  // 2. Active Store Staff check (teamMembers on targetStore + any persisted team records)
  const cleanUserEmail = String(user.email || "").trim().toLowerCase();
  const cleanUserId = String(user.id || "").trim();

  const combinedTeamMembers = [
    ...(Array.isArray(targetStore.teamMembers) ? targetStore.teamMembers : []),
    ...(Array.isArray(extraTeamMembers) ? extraTeamMembers : []),
  ];

  const isActiveTeamMember = combinedTeamMembers.some((member: any) => {
    if (!member) return false;
    const status = String(member.status || "active").trim().toLowerCase();
    if (status === "inactive" || status === "suspended" || status === "removed") {
      return false;
    }
    const memberEmail = String(member.email || "").trim().toLowerCase();
    const memberId = String(member.id || "").trim();
    return Boolean(
      (cleanUserEmail && memberEmail && memberEmail === cleanUserEmail) ||
        (cleanUserId && memberId && memberId === cleanUserId) ||
        (activeStaffMemberId && memberId && memberId === activeStaffMemberId)
    );
  });

  if (isActiveTeamMember) {
    return true;
  }

  // 3. Direct staff session bound to targetStore via storeId (excluding plain buyers/customers)
  const normalizedRole = String(user.role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  const isStoreStaffRole = [
    "merchant",
    "owner",
    "storeowner",
    "storeadmin",
    "admin",
    "staff",
    "employee",
    "manager",
    "storemanager",
    "moderator",
  ].includes(normalizedRole);

  if (isStoreStaffRole && user.storeId && String(user.storeId) === String(targetStore.id)) {
    return true;
  }

  return false;
}

// ============================================================================
// 4. CONTINUOUS 3D MORE OPTIONS MENU ITEMS (EXACT 9-ITEM ORDER)
// ============================================================================

export function normalizePartnerPicksLanguage(language?: string): "en" | "fr" | "ar" {
  const normalized = String(language || "en").trim().toLowerCase();
  if (normalized === "fr" || normalized.startsWith("fr-")) return "fr";
  if (normalized === "ar" || normalized.startsWith("ar-")) return "ar";
  return "en";
}

export function getPartnerPicksMenuLabel(language?: string): string {
  const lang = normalizePartnerPicksLanguage(language);
  if (lang === "fr") return "Sélections Partenaires";
  if (lang === "ar") return "مختارات الشركاء";
  return "Partner Picks";
}

export function resolvePartnerPicksEntryPoint(params: {
  storeId: string;
  storeName: string;
  isStrictOwner: boolean;
  isAuthenticated: boolean;
  isMerchantVisitor?: boolean;
  language?: string;
}): PartnerPicksEntryContext {
  const lang = normalizePartnerPicksLanguage(params.language);
  const localizedTitle = getPartnerPicksMenuLabel(lang);
  const isMerchantVisitor = Boolean(params.isMerchantVisitor);

  let entryFlow: PartnerPicksEntryFlow = "visitor_info";
  if (params.isStrictOwner) {
    entryFlow = "merchant_workspace";
  } else if (params.isAuthenticated && isMerchantVisitor) {
    entryFlow = "partnership_request";
  }

  let localizedNotice: string;
  if (entryFlow === "merchant_workspace") {
    localizedNotice =
      lang === "fr"
        ? `Point d'entrée Sélections Partenaires prêt pour gérer les partenariats de ${params.storeName}.`
        : lang === "ar"
        ? `مدخل مختارات الشركاء جاهز لإدارة شراكات متجر ${params.storeName}.`
        : `Partner Picks entry ready to manage reciprocal partnerships for ${params.storeName}.`;
  } else if (entryFlow === "partnership_request") {
    localizedNotice =
      lang === "fr"
        ? `Demande Sélections Partenaires prête pour collaborer avec ${params.storeName}.`
        : lang === "ar"
        ? `طلب مختارات الشركاء جاهز للتعاون مع متجر ${params.storeName}.`
        : `Partner Picks partnership request entry ready for ${params.storeName}.`;
  } else {
    localizedNotice =
      lang === "fr"
        ? `Sélections Partenaires de ${params.storeName} : collaborations réciproques entre marchands YUME.`
        : lang === "ar"
        ? `مختارات الشركاء لمتجر ${params.storeName}: تعاون متبادل بين تجار YUME.`
        : `Partner Picks for ${params.storeName}: reciprocal merchant-to-merchant product collaborations on YUME.`;
  }

  return {
    storeId: params.storeId,
    storeName: params.storeName,
    isStrictOwner: params.isStrictOwner,
    isAuthenticated: params.isAuthenticated,
    isMerchantVisitor,
    entryFlow,
    language: lang,
    localizedTitle,
    localizedNotice,
  };
}

export function getStoreMoreOptionsMenuItems(params: {
  isStrictOwner: boolean;
  isMuted: boolean;
  remainingMuteLabel?: string;
  isBlocked: boolean;
  language?: string;
}): MoreOptionsMenuItemDescriptor[] {
  const { isStrictOwner, isMuted, remainingMuteLabel, isBlocked, language } = params;

  const allItems: Array<MoreOptionsMenuItemDescriptor & { visible: boolean }> = [
    {
      id: "share_store",
      order: 1,
      label: "Share Store",
      visible: true,
    },
    {
      id: "partner_picks",
      order: 2,
      label: getPartnerPicksMenuLabel(language),
      visible: true,
    },
    {
      id: "collab",
      order: 3,
      label: "Collab",
      isPlaceholder: true,
      visible: true,
    },
    {
      id: "mute_store",
      order: 4,
      label: isMuted ? "Unmute Store" : "Mute Store",
      sublabel: isMuted && remainingMuteLabel ? remainingMuteLabel : undefined,
      isActiveState: isMuted,
      visible: true,
    },
    {
      id: "dock_settings",
      order: 5,
      label: "Dock Settings",
      visible: isStrictOwner, // Strictly Store Owner ONLY
    },
    {
      id: "store_details",
      order: 6,
      label: "Store Details",
      visible: true,
    },
    {
      id: "generate_qr_code",
      order: 7,
      label: "Generate QR Code",
      isPlaceholder: true,
      visible: true,
    },
    {
      id: "report_store",
      order: 8,
      label: "Report Store",
      isDanger: true,
      visible: !isStrictOwner,
    },
    {
      id: "block_store",
      order: 9,
      label: isBlocked ? "Unblock Store" : "Block Store",
      isDanger: !isBlocked,
      isActiveState: isBlocked,
      visible: !isStrictOwner,
    },
  ];

  return allItems
    .filter((item) => item.visible)
    .sort((a, b) => a.order - b.order)
    .map(({ visible: _v, ...rest }) => rest);
}

// ============================================================================
// 5. PUBLIC STORE VISIBILITY & SERVER-SIDE DATA SANITIZATION
// ============================================================================

export function formatPublicFollowerCountDisplay(
  rawFollowersCount: number | undefined,
  mode: FollowerCountDisplayMode
): {
  mode: FollowerCountDisplayMode;
  showIcon: boolean;
  showNumber: boolean;
  labelText: string;
} {
  const safeCount = Math.max(0, Number(rawFollowersCount) || 0);
  if (mode === "icon_only") {
    return {
      mode: "icon_only",
      showIcon: true,
      showNumber: false,
      labelText: "",
    };
  }
  if (mode === "hidden_label") {
    return {
      mode: "hidden_label",
      showIcon: true,
      showNumber: false,
      labelText: "Not Available",
    };
  }
  const formattedCount =
    safeCount >= 1_000_000
      ? `${(safeCount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
      : safeCount >= 1_000
      ? `${(safeCount / 1_000).toFixed(1).replace(/\.0$/, "")}K`
      : String(safeCount);

  return {
    mode: "actual",
    showIcon: true,
    showNumber: true,
    labelText: `${formattedCount} ${safeCount === 1 ? "Follower" : "Followers"}`,
  };
}

export function isPublicStoreNavigationTabAllowed(
  tabId: string,
  dockSettings?: StoreDockSettings | null
): boolean {
  const normalized = normalizeStoreDockSettings(dockSettings);
  const cleanTab = String(tabId || "products").trim().toLowerCase();
  if (cleanTab === "products") return true;
  const nav = normalized.visibility.navigation as Record<string, boolean>;
  if (cleanTab in nav) {
    return Boolean(nav[cleanTab]);
  }
  return true;
}

/**
 * Server-side and client-side sanitizer that strips hidden/private fields from
 * a store record when viewed by a non-owner visitor.
 */
export function sanitizePublicStoreForVisitor(
  store: Record<string, any>,
  isStrictOwner: boolean
): Record<string, any> {
  if (!store) return store;
  const dockSettings = normalizeStoreDockSettings(store.designSettings?.dockSettings);
  const cloned: Record<string, any> = {
    ...store,
    designSettings: {
      ...(store.designSettings || {}),
      dockSettings,
    },
  };

  if (isStrictOwner) {
    return cloned;
  }

  // Strip sensitive internal merchant fields from public API responses
  delete cloned.apiKeysVault;
  delete cloned.apiKey;
  delete cloned.teamMembers;
  delete cloned.customRoles;
  delete cloned.teamActivityLogs;
  delete cloned.authorizationHistory;
  delete cloned.kycIdentity;

  // Enforce Store Location Visibility
  if (!dockSettings.visibility.showStoreLocation) {
    cloned.address = "";
    cloned.city = "";
    cloned.wilaya = "";
    cloned.coordinates = null;
    cloned.locationHiddenByMerchant = true;
  }

  // Enforce Follower Count Display privacy
  if (dockSettings.visibility.followerCountMode !== "actual") {
    cloned.followersCount = null;
    cloned.followersList = [];
  }

  // Enforce Navigation Tab Visibility on public payloads
  if (!dockSettings.visibility.navigation.reviews) {
    cloned.reviews = [];
  }

  return cloned;
}

// ============================================================================
// 6. TELEGRAM-STYLE MUTE STORE & NOTIFICATION PRESERVATION LOGIC
// ============================================================================

export function calculateMuteExpiration(
  presetId: MuteDurationPresetId,
  customInput?: CustomMuteDurationInput,
  nowMs: number = Date.now()
): {
  expiresAt: string | null;
  durationMs: number | null;
  durationLabel: string;
  formattedPreview: string;
} {
  const MINUTE_MS = 60 * 1000;
  const HOUR_MS = 60 * MINUTE_MS;
  const DAY_MS = 24 * HOUR_MS;

  if (presetId === "forever") {
    return {
      expiresAt: null,
      durationMs: null,
      durationLabel: "Muted Forever",
      formattedPreview: "Muted indefinitely until you manually unmute",
    };
  }

  let durationMs = HOUR_MS;
  let durationLabel = "1 Hour";

  if (presetId === "1h") {
    durationMs = 1 * HOUR_MS;
    durationLabel = "1 Hour";
  } else if (presetId === "8h") {
    durationMs = 8 * HOUR_MS;
    durationLabel = "8 Hours";
  } else if (presetId === "24h") {
    durationMs = 24 * HOUR_MS;
    durationLabel = "24 Hours";
  } else if (presetId === "7d") {
    durationMs = 7 * DAY_MS;
    durationLabel = "7 Days";
  } else if (presetId === "30d") {
    durationMs = 30 * DAY_MS;
    durationLabel = "30 Days";
  } else if (presetId === "custom") {
    const d = Math.max(0, Math.min(365, Math.floor(Number(customInput?.days) || 0)));
    const h = Math.max(0, Math.min(23, Math.floor(Number(customInput?.hours) || 0)));
    const m = Math.max(0, Math.min(59, Math.floor(Number(customInput?.minutes) || 0)));
    const totalMs = d * DAY_MS + h * HOUR_MS + m * MINUTE_MS;
    durationMs = Math.max(MINUTE_MS, totalMs);
    const parts: string[] = [];
    if (d > 0) parts.push(`${d} ${d === 1 ? "Day" : "Days"}`);
    if (h > 0) parts.push(`${h} ${h === 1 ? "Hour" : "Hours"}`);
    if (m > 0 || parts.length === 0) {
      const effectiveM = parts.length === 0 && m === 0 ? 1 : m;
      parts.push(`${effectiveM} ${effectiveM === 1 ? "Minute" : "Minutes"}`);
    }
    durationLabel = parts.join(", ");
  }

  const expiryDate = new Date(nowMs + durationMs);
  const expiresAt = expiryDate.toISOString();
  const formattedPreview = expiryDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    expiresAt,
    durationMs,
    durationLabel,
    formattedPreview,
  };
}

export function isStoreCurrentlyMuted(
  muteRecord: UserStoreMuteRecord | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!muteRecord) return false;
  if (muteRecord.expiresAt === null) return true; // Forever
  const expiryMs = Date.parse(muteRecord.expiresAt);
  if (!Number.isFinite(expiryMs)) return false;
  return expiryMs > nowMs;
}

export function formatRemainingMuteDuration(
  muteRecord: UserStoreMuteRecord | null | undefined,
  nowMs: number = Date.now()
): string {
  if (!isStoreCurrentlyMuted(muteRecord, nowMs) || !muteRecord) return "";
  if (muteRecord.expiresAt === null) return "Muted Forever";
  const remainingMs = Math.max(0, Date.parse(muteRecord.expiresAt) - nowMs);
  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${Math.max(1, minutes)}m left`;
}

/**
 * Determines whether a notification from a store should be delivered.
 * Promotional notifications are suppressed when muted or blocked.
 * Direct messages, order confirmations, order status updates, shipping, delivery,
 * and payment notifications are ALWAYS preserved when muted.
 */
export function shouldDeliverStoreNotification(params: {
  category: StoreNotificationCategory;
  isMuted: boolean;
  isBlocked: boolean;
}): boolean {
  const { category, isMuted, isBlocked } = params;

  const transactionalCategories: StoreNotificationCategory[] = [
    "direct_message",
    "order_confirmation",
    "order_status",
    "shipping",
    "delivery",
    "payment",
    "transaction",
  ];

  // Transactional notifications are ALWAYS preserved when muted
  if (transactionalCategories.includes(category)) {
    // Even if blocked, existing order/shipping/payment/transaction notifications are preserved
    if (isBlocked && category === "direct_message") {
      return false;
    }
    return true;
  }

  // Promotional & non-essential notifications are suppressed when muted or blocked
  if (isMuted || isBlocked) {
    return false;
  }

  return true;
}

// ============================================================================
// 7. ONE-SIDED BLOCK STORE INTERACTION RULES
// ============================================================================

export function evaluateStoreBlockRestrictions(isBlocked: boolean): {
  isBlocked: boolean;
  canViewPromotionalContent: boolean;
  canReceivePromotionalNotifications: boolean;
  canSendNewMessages: boolean;
  canPlaceNewOrders: boolean;
  canAccessExistingOrders: true;
  canAccessPreviousMessages: true;
  canAccessTransactionHistory: true;
} {
  return {
    isBlocked,
    canViewPromotionalContent: !isBlocked,
    canReceivePromotionalNotifications: !isBlocked,
    canSendNewMessages: !isBlocked,
    canPlaceNewOrders: !isBlocked,
    canAccessExistingOrders: true,
    canAccessPreviousMessages: true,
    canAccessTransactionHistory: true,
  };
}

// ============================================================================
// 8. REAL MERCHANT DATA EXTRACTOR FOR STORE DETAILS
// ============================================================================

export interface RealStoreDetailsViewModel {
  identity: {
    id: string;
    name: string;
    logo: string;
    bio: string;
    description: string;
    createdAtLabel: string;
    verified: boolean;
    categories: string[];
  };
  contact: {
    primaryPhone: string | null;
    additionalPhones: string[];
    officialEmail: string | null;
    whatsapp: string | null;
    hasAnyContact: boolean;
  };
  location: {
    visible: boolean;
    wilaya: string | null;
    city: string | null;
    address: string | null;
    coordinates: { lat: number; lng: number } | null;
  };
  delivery: {
    coveredWilayasCount: number;
    coveredWilayasList: Array<{ code: string; name: string; homeRateDzd?: number; deskRateDzd?: number }>;
    summaryLabel: string;
    activeCarriers: string[];
  };
  socials: Array<{
    id: string;
    label: string;
    handleOrUrl: string;
    href: string;
  }>;
  rating: {
    averageRating: number;
    totalReviewsCount: number;
    distribution: Array<{ stars: 5 | 4 | 3 | 2 | 1; count: number; percentage: number }>;
  };
}

const ALGERIA_WILAYA_NAMES: Record<string, string> = {
  "01": "Adrar",
  "02": "Chlef",
  "03": "Laghouat",
  "04": "Oum El Bouaghi",
  "05": "Batna",
  "06": "Béjaïa",
  "07": "Biskra",
  "08": "Béchar",
  "09": "Blida",
  "10": "Bouira",
  "11": "Tamanrasset",
  "12": "Tébessa",
  "13": "Tlemcen",
  "14": "Tiaret",
  "15": "Tizi Ouzou",
  "16": "Alger",
  "17": "Djelfa",
  "18": "Jijel",
  "19": "Sétif",
  "20": "Saïda",
  "21": "Skikda",
  "22": "Sidi Bel Abbès",
  "23": "Annaba",
  "24": "Guelma",
  "25": "Constantine",
  "26": "Médéa",
  "27": "Mostaganem",
  "28": "M'Sila",
  "29": "Mascara",
  "30": "Ouargla",
  "31": "Oran",
  "32": "El Bayadh",
  "33": "Illizi",
  "34": "Bordj Bou Arréridj",
  "35": "Boumerdès",
  "36": "El Tarf",
  "37": "Tindouf",
  "38": "Tissemsilt",
  "39": "El Oued",
  "40": "Khenchela",
  "41": "Souk Ahras",
  "42": "Tipaza",
  "43": "Mila",
  "44": "Aïn Defla",
  "45": "Naâma",
  "46": "Aïn Témouchent",
  "47": "Ghardaïa",
  "48": "Relizane",
  "49": "Timimoun",
  "50": "Bordj Badji Mokhtar",
  "51": "Ouled Djellal",
  "52": "Béni Abbès",
  "53": "In Salah",
  "54": "In Guezzam",
  "55": "Touggourt",
  "56": "Djanet",
  "57": "El M'Ghair",
  "58": "El Meniaa",
};

function normalizeSocialUrl(platform: string, rawValue: string): string {
  const trimmed = rawValue.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const cleanHandle = trimmed.replace(/^@/, "");
  switch (platform) {
    case "instagram":
      return `https://instagram.com/${cleanHandle}`;
    case "facebook":
      return `https://facebook.com/${cleanHandle}`;
    case "tiktok":
      return `https://tiktok.com/@${cleanHandle}`;
    case "snapchat":
      return `https://snapchat.com/add/${cleanHandle}`;
    case "x":
      return `https://x.com/${cleanHandle}`;
    case "viber":
      return `viber://chat?number=${encodeURIComponent(cleanHandle)}`;
    default:
      return `https://${trimmed}`;
  }
}

/**
 * Extracts real merchant data for the Store Details modal while respecting all
 * privacy and visibility settings (`showStoreLocation`, published contact fields,
 * actual configured delivery wilayas, and real customer review ratings).
 */
export function extractRealStoreDetailsData(
  store: MerchantStore | Record<string, any>
): RealStoreDetailsViewModel {
  const dockSettings = normalizeStoreDockSettings(store?.designSettings?.dockSettings);

  // 6.1 Identity
  const rawCreated =
    (store as any)?.createdAt ||
    (store as any)?.shopApprovedAt ||
    (store as any)?.registeredAt ||
    null;
  let createdAtLabel = "Verified YUME Store";
  if (rawCreated) {
    const parsed = Date.parse(String(rawCreated));
    if (Number.isFinite(parsed)) {
      createdAtLabel = new Date(parsed).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } else {
      createdAtLabel = String(rawCreated);
    }
  }

  // 6.2 Contact Information (Only published non-empty fields)
  const contactObj = store?.contact || {};
  const primaryPhone =
    typeof contactObj.phone === "string" && contactObj.phone.trim()
      ? contactObj.phone.trim()
      : null;

  const extraPhonesSet = new Set<string>();
  if (typeof contactObj.secondaryPhone === "string" && contactObj.secondaryPhone.trim()) {
    const sec = contactObj.secondaryPhone.trim();
    if (sec !== primaryPhone) extraPhonesSet.add(sec);
  }
  if (Array.isArray(contactObj.phones)) {
    for (const p of contactObj.phones) {
      if (typeof p === "string" && p.trim() && p.trim() !== primaryPhone) {
        extraPhonesSet.add(p.trim());
      }
    }
  }
  const additionalPhones = Array.from(extraPhonesSet);
  const officialEmail =
    typeof contactObj.email === "string" && contactObj.email.trim()
      ? contactObj.email.trim()
      : null;
  const whatsapp =
    typeof contactObj.whatsapp === "string" && contactObj.whatsapp.trim()
      ? contactObj.whatsapp.trim()
      : null;

  // 6.3 Store Location (Strictly respects Store Location Visibility)
  const locationVisible = Boolean(
    dockSettings.visibility.showStoreLocation && !(store as any)?.locationHiddenByMerchant
  );
  const hasCoords =
    locationVisible &&
    store?.coordinates &&
    typeof store.coordinates.lat === "number" &&
    typeof store.coordinates.lng === "number";

  const location = locationVisible
    ? {
        visible: true,
        wilaya: store?.wilaya ? String(store.wilaya).trim() : null,
        city: store?.city ? String(store.city).trim() : null,
        address: store?.address ? String(store.address).trim() : null,
        coordinates: hasCoords
          ? { lat: Number(store.coordinates.lat), lng: Number(store.coordinates.lng) }
          : null,
      }
    : {
        visible: false,
        wilaya: null,
        city: null,
        address: null,
        coordinates: null,
      };

  // 6.4 Delivery Information (Actual saved merchant data — never hardcoded)
  const coveredWilayasMap = new Map<
    string,
    { code: string; name: string; homeRateDzd?: number; deskRateDzd?: number }
  >();

  // Check store-level shipping/delivery config if present
  const rawWilayaRates =
    (store as any)?.deliveryWilayas ||
    (store as any)?.shippingWilayas ||
    (store as any)?.shippingConfig?.wilayas ||
    (store as any)?.deliveryConfig?.wilayas ||
    null;

  if (Array.isArray(rawWilayaRates)) {
    for (const item of rawWilayaRates) {
      if (!item) continue;
      if (typeof item === "string" || typeof item === "number") {
        const code = String(item).padStart(2, "0");
        const name = ALGERIA_WILAYA_NAMES[code] || `Wilaya ${code}`;
        coveredWilayasMap.set(code, { code, name });
      } else if (typeof item === "object" && item.enabled !== false) {
        const code = String(item.code || item.wilayaCode || item.id || "").padStart(2, "0");
        if (code && code !== "00") {
          const name = item.name || ALGERIA_WILAYA_NAMES[code] || `Wilaya ${code}`;
          coveredWilayasMap.set(code, {
            code,
            name,
            homeRateDzd: typeof item.homeRate === "number" ? item.homeRate : undefined,
            deskRateDzd: typeof item.deskRate === "number" ? item.deskRate : undefined,
          });
        }
      }
    }
  } else if (rawWilayaRates && typeof rawWilayaRates === "object") {
    for (const [key, val] of Object.entries(rawWilayaRates)) {
      if (!val || (typeof val === "object" && (val as any).enabled === false)) continue;
      const code = String(key).padStart(2, "0");
      const name =
        (typeof val === "object" && (val as any).name) ||
        ALGERIA_WILAYA_NAMES[code] ||
        `Wilaya ${code}`;
      coveredWilayasMap.set(code, {
        code,
        name,
        homeRateDzd:
          typeof val === "object" && typeof (val as any).homeRate === "number"
            ? (val as any).homeRate
            : undefined,
      });
    }
  }

  // If store doesn't have an explicit wilaya table yet, inspect its active products & store wilaya
  if (coveredWilayasMap.size === 0) {
    if (store?.wilayaCode || store?.wilaya) {
      const code = String(store.wilayaCode || "16").padStart(2, "0");
      const name = store.wilaya || ALGERIA_WILAYA_NAMES[code] || `Wilaya ${code}`;
      coveredWilayasMap.set(code, { code, name });
    }
  }

  const activeCarriersSet = new Set<string>();
  if (Array.isArray(store?.products)) {
    for (const prod of store.products) {
      if (prod?.deliveryCompany && typeof prod.deliveryCompany === "string") {
        activeCarriersSet.add(prod.deliveryCompany.trim());
      }
    }
  }

  const coveredWilayasList = Array.from(coveredWilayasMap.values()).sort((a, b) =>
    a.code.localeCompare(b.code)
  );
  const coveredWilayasCount = coveredWilayasList.length;
  const summaryLabel =
    coveredWilayasCount > 0
      ? `Delivery Available In: ${coveredWilayasCount} ${
          coveredWilayasCount === 1 ? "Wilaya" : "Wilayas"
        }`
      : "Delivery Coverage Configured at Checkout";

  // 6.5 Social Media (Only published accounts)
  const socials: RealStoreDetailsViewModel["socials"] = [];
  const socialCandidates: Array<{ id: string; label: string; raw?: unknown }> = [
    { id: "instagram", label: "Instagram", raw: contactObj.instagram || (store as any)?.instagram },
    { id: "facebook", label: "Facebook", raw: contactObj.facebook || (store as any)?.facebook },
    { id: "tiktok", label: "TikTok", raw: contactObj.tiktok || (store as any)?.tiktok },
    { id: "snapchat", label: "Snapchat", raw: contactObj.snapchat || (store as any)?.snapchat },
    { id: "x", label: "X", raw: contactObj.twitter || contactObj.x || (store as any)?.x },
    { id: "viber", label: "Viber", raw: contactObj.viber || (store as any)?.viber },
  ];

  for (const candidate of socialCandidates) {
    if (typeof candidate.raw === "string" && candidate.raw.trim()) {
      const val = candidate.raw.trim();
      socials.push({
        id: candidate.id,
        label: candidate.label,
        handleOrUrl: val,
        href: normalizeSocialUrl(candidate.id, val),
      });
    }
  }

  // 6.6 Store Rating (Actual reviews from store & products)
  const collectedReviews: Array<{ rating: number }> = [];
  if (Array.isArray(store?.reviews)) {
    for (const r of store.reviews) {
      if (r && typeof r.rating === "number" && r.rating >= 1 && r.rating <= 5) {
        collectedReviews.push({ rating: Math.round(r.rating) });
      }
    }
  }
  if (Array.isArray(store?.products)) {
    for (const p of store.products) {
      if (Array.isArray(p?.reviews)) {
        for (const r of p.reviews) {
          if (r && typeof r.rating === "number" && r.rating >= 1 && r.rating <= 5) {
            collectedReviews.push({ rating: Math.round(r.rating) });
          }
        }
      }
    }
  }

  const totalReviewsCount = collectedReviews.length;
  const averageRating =
    totalReviewsCount > 0
      ? Number(
          (
            collectedReviews.reduce((acc, item) => acc + item.rating, 0) / totalReviewsCount
          ).toFixed(2)
        )
      : Number(Number(store?.rating || 0).toFixed(2));

  const starLevels: Array<5 | 4 | 3 | 2 | 1> = [5, 4, 3, 2, 1];
  const distribution = starLevels.map((stars) => {
    const count = collectedReviews.filter((r) => r.rating === stars).length;
    const percentage = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
    return { stars, count, percentage };
  });

  return {
    identity: {
      id: String(store?.id || ""),
      name: String(store?.name || "Store"),
      logo: String(store?.logo || store?.logoUrl || ""),
      bio: String(store?.bio || ""),
      description: String(store?.description || ""),
      createdAtLabel,
      verified: Boolean(store?.verified),
      categories: Array.isArray(store?.categories) ? store.categories : [],
    },
    contact: {
      primaryPhone,
      additionalPhones,
      officialEmail,
      whatsapp,
      hasAnyContact: Boolean(
        primaryPhone || additionalPhones.length > 0 || officialEmail || whatsapp
      ),
    },
    location,
    delivery: {
      coveredWilayasCount,
      coveredWilayasList,
      summaryLabel,
      activeCarriers: Array.from(activeCarriersSet),
    },
    socials,
    rating: {
      averageRating,
      totalReviewsCount,
      distribution,
    },
  };
}

// ============================================================================
// 9. SHARE STORE PLATFORM URL & FALLBACK BUILDER
// ============================================================================

export function buildStoreShareAction(params: {
  platform: SharePlatformId;
  storeName: string;
  storeUrl: string;
}): {
  platform: SharePlatformId;
  mode: "direct_url" | "native_or_copy_fallback";
  targetUrl: string;
  shareText: string;
} {
  const { platform, storeName, storeUrl } = params;
  const shareText = `Check out ${storeName} on YUME Marketplace!`;
  const encodedUrl = encodeURIComponent(storeUrl);
  const encodedText = encodeURIComponent(shareText);
  const encodedFull = encodeURIComponent(`${shareText} ${storeUrl}`);

  switch (platform) {
    case "facebook":
      return {
        platform,
        mode: "direct_url",
        targetUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        shareText,
      };
    case "messenger":
      return {
        platform,
        mode: "direct_url",
        targetUrl: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=291494419107518&redirect_uri=${encodedUrl}`,
        shareText,
      };
    case "whatsapp":
      return {
        platform,
        mode: "direct_url",
        targetUrl: `https://api.whatsapp.com/send?text=${encodedFull}`,
        shareText,
      };
    case "telegram":
      return {
        platform,
        mode: "direct_url",
        targetUrl: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
        shareText,
      };
    case "viber":
      return {
        platform,
        mode: "direct_url",
        targetUrl: `viber://forward?text=${encodedFull}`,
        shareText,
      };
    case "x":
      return {
        platform,
        mode: "direct_url",
        targetUrl: `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        shareText,
      };
    case "email":
      return {
        platform,
        mode: "direct_url",
        targetUrl: `mailto:?subject=${encodeURIComponent(
          `${storeName} on YUME`
        )}&body=${encodedFull}`,
        shareText,
      };
    case "instagram":
      return {
        platform,
        mode: "native_or_copy_fallback",
        targetUrl: "https://www.instagram.com/",
        shareText,
      };
    case "snapchat":
      return {
        platform,
        mode: "native_or_copy_fallback",
        targetUrl: `https://www.snapchat.com/scan?attachmentUrl=${encodedUrl}`,
        shareText,
      };
    case "tiktok":
      return {
        platform,
        mode: "native_or_copy_fallback",
        targetUrl: "https://www.tiktok.com/",
        shareText,
      };
  }
}

// ============================================================================
// 10. REPORT STORE & CENTRALIZED PLATFORM ADMIN REPORTS CENTER LOGIC
// ============================================================================

export function isValidReportStoreReason(reason: unknown): reason is ReportStoreReason {
  return (
    typeof reason === "string" &&
    (REPORT_STORE_REASONS as readonly string[]).includes(reason.trim())
  );
}

export function determineInitialReportPriority(reason: ReportStoreReason): StoreReportPriority {
  if (reason === "Fraud or Scam" || reason === "Counterfeit Products") {
    return "high";
  }
  if (
    reason === "Fake Store" ||
    reason === "Intellectual Property Violation" ||
    reason === "Harassment"
  ) {
    return "medium";
  }
  return "low";
}

export function createStoreReportSubmission(params: {
  existingReports: StoreReportRecord[];
  storeId: string;
  storeName: string;
  storeSlug?: string;
  storeLogo?: string;
  storeWilaya?: string;
  primaryReason: unknown;
  additionalDetails?: unknown;
  reporterKey: string;
  isReporterOwnerOfTargetStore?: boolean;
  nowMs?: number;
}): {
  ok: boolean;
  statusCode: 201 | 400 | 403 | 429;
  error?: string;
  report?: StoreReportRecord;
  nextReports: StoreReportRecord[];
} {
  const {
    existingReports,
    storeId,
    storeName,
    storeSlug,
    storeLogo,
    storeWilaya,
    primaryReason,
    additionalDetails,
    reporterKey,
    isReporterOwnerOfTargetStore,
    nowMs = Date.now(),
  } = params;

  if (!storeId || !storeName) {
    return {
      ok: false,
      statusCode: 400,
      error: "MISSING_STORE: A valid target store is required to submit a report.",
      nextReports: existingReports,
    };
  }

  if (isReporterOwnerOfTargetStore) {
    return {
      ok: false,
      statusCode: 403,
      error: "CANNOT_REPORT_OWN_STORE: Store owners cannot submit reports against their own store.",
      nextReports: existingReports,
    };
  }

  if (!isValidReportStoreReason(primaryReason)) {
    return {
      ok: false,
      statusCode: 400,
      error: "INVALID_REASON: Please select a valid primary report reason.",
      nextReports: existingReports,
    };
  }

  const cleanReason = primaryReason.trim() as ReportStoreReason;
  const cleanDetails =
    typeof additionalDetails === "string" ? additionalDetails.trim().slice(0, 2500) : "";

  // Duplicate active report prevention (same reporterKey + storeId + reason within 15 minutes while still 'new')
  const COOLDOWN_MS = 15 * 60 * 1000;
  const hasRecentDuplicate = existingReports.some((r) => {
    if (!r || r.storeId !== storeId || r.reporterKey !== reporterKey) return false;
    if (r.primaryReason !== cleanReason) return false;
    const createdMs = Date.parse(r.createdAt);
    return Number.isFinite(createdMs) && nowMs - createdMs < COOLDOWN_MS;
  });

  if (hasRecentDuplicate) {
    return {
      ok: false,
      statusCode: 429,
      error:
        "DUPLICATE_REPORT: You have already submitted this report for this store recently. Our administration team is reviewing it.",
      nextReports: existingReports,
    };
  }

  const nowIso = new Date(nowMs).toISOString();
  const reportId = `RPT-${String(1000 + existingReports.length + 1)}`;
  const priority = determineInitialReportPriority(cleanReason);

  const newReport: StoreReportRecord = {
    id: reportId,
    storeId,
    storeName,
    storeSlug,
    storeLogo,
    storeWilaya,
    primaryReason: cleanReason,
    additionalDetails: cleanDetails,
    status: "new",
    priority,
    createdAt: nowIso,
    updatedAt: nowIso,
    reporterKey,
    internalNotes: [],
    investigationHistory: [
      {
        id: `hist_${nowMs}`,
        action: "Report Submitted",
        actorName: "YUME Safety System",
        timestamp: nowIso,
        details: `Report received under category: ${cleanReason}`,
      },
    ],
  };

  return {
    ok: true,
    statusCode: 201,
    report: newReport,
    nextReports: [newReport, ...existingReports],
  };
}

export interface ReportsCenterKpiSummary {
  totalReports: number;
  newReports: number;
  underReviewReports: number;
  resolvedReports: number;
  rejectedReports: number;
  highPriorityReports: number;
}

export function computeReportsCenterKpis(
  reports: StoreReportRecord[]
): ReportsCenterKpiSummary {
  const list = Array.isArray(reports) ? reports : [];
  return {
    totalReports: list.length,
    newReports: list.filter((r) => r.status === "new").length,
    underReviewReports: list.filter((r) => r.status === "under_review").length,
    resolvedReports: list.filter((r) => r.status === "resolved").length,
    rejectedReports: list.filter((r) => r.status === "rejected").length,
    highPriorityReports: list.filter(
      (r) => r.priority === "high" || r.priority === "critical"
    ).length,
  };
}

export function filterAndSortStoreReports(params: {
  reports: StoreReportRecord[];
  searchQuery?: string;
  statusFilter?: string;
  reasonFilter?: string;
  priorityFilter?: string;
  dateFilter?: "all" | "today" | "7d" | "30d";
  sortBy?: "newest" | "oldest" | "priority" | "status";
  nowMs?: number;
}): StoreReportRecord[] {
  const {
    reports,
    searchQuery = "",
    statusFilter = "all",
    reasonFilter = "all",
    priorityFilter = "all",
    dateFilter = "all",
    sortBy = "newest",
    nowMs = Date.now(),
  } = params;

  const q = searchQuery.trim().toLowerCase();
  const priorityRank: Record<StoreReportPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const filtered = (Array.isArray(reports) ? reports : []).filter((r) => {
    if (!r) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (reasonFilter !== "all" && r.primaryReason !== reasonFilter) return false;
    if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;

    if (dateFilter !== "all") {
      const createdMs = Date.parse(r.createdAt);
      if (Number.isFinite(createdMs)) {
        const diffMs = nowMs - createdMs;
        if (dateFilter === "today" && diffMs > 24 * 60 * 60 * 1000) return false;
        if (dateFilter === "7d" && diffMs > 7 * 24 * 60 * 60 * 1000) return false;
        if (dateFilter === "30d" && diffMs > 30 * 24 * 60 * 60 * 1000) return false;
      }
    }

    if (q) {
      const haystack = `${r.id} ${r.storeName} ${r.storeId} ${r.primaryReason} ${r.additionalDetails}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sortBy === "oldest") {
      return Date.parse(a.createdAt) - Date.parse(b.createdAt);
    }
    if (sortBy === "priority") {
      const diff = (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
      if (diff !== 0) return diff;
    }
    if (sortBy === "status") {
      return a.status.localeCompare(b.status);
    }
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}

export function applyAdminReportUpdate(params: {
  report: StoreReportRecord;
  actorName: string;
  actorRole?: string;
  nextStatus?: StoreReportStatus;
  nextPriority?: StoreReportPriority;
  newInternalNote?: string;
  nowMs?: number;
}): StoreReportRecord {
  const {
    report,
    actorName,
    actorRole = "Platform Admin",
    nextStatus,
    nextPriority,
    newInternalNote,
    nowMs = Date.now(),
  } = params;

  const nowIso = new Date(nowMs).toISOString();
  const updatedHistory = [...(report.investigationHistory || [])];
  const updatedNotes = [...(report.internalNotes || [])];

  let status = report.status;
  if (
    nextStatus &&
    (nextStatus === "new" ||
      nextStatus === "under_review" ||
      nextStatus === "resolved" ||
      nextStatus === "rejected") &&
    nextStatus !== report.status
  ) {
    status = nextStatus;
    updatedHistory.unshift({
      id: `hist_status_${nowMs}`,
      action: `Status changed to ${nextStatus.replace("_", " ").toUpperCase()}`,
      actorName,
      timestamp: nowIso,
      details: `Previous status: ${report.status}`,
    });
  }

  let priority = report.priority;
  if (
    nextPriority &&
    (nextPriority === "low" ||
      nextPriority === "medium" ||
      nextPriority === "high" ||
      nextPriority === "critical") &&
    nextPriority !== report.priority
  ) {
    priority = nextPriority;
    updatedHistory.unshift({
      id: `hist_prio_${nowMs}`,
      action: `Priority set to ${nextPriority.toUpperCase()}`,
      actorName,
      timestamp: nowIso,
      details: `Previous priority: ${report.priority}`,
    });
  }

  if (typeof newInternalNote === "string" && newInternalNote.trim()) {
    const cleanNote = newInternalNote.trim();
    updatedNotes.unshift({
      id: `note_${nowMs}`,
      authorName: actorName,
      authorRole: actorRole,
      note: cleanNote,
      createdAt: nowIso,
    });
    updatedHistory.unshift({
      id: `hist_note_${nowMs}`,
      action: "Added Internal Administrative Note",
      actorName,
      timestamp: nowIso,
      details: cleanNote.slice(0, 120),
    });
  }

  return {
    ...report,
    status,
    priority,
    updatedAt: nowIso,
    internalNotes: updatedNotes,
    investigationHistory: updatedHistory,
  };
}
