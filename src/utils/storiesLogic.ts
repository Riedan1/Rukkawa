/**
 * YUME Stories System — Core Domain & Data Integrity Logic
 *
 * Enforces:
 * 1. Default-disabled Stories activation across all new and existing profiles
 *    (personal customer profiles and merchant/store profiles).
 * 2. Strict logical separation between Store Stories (explicitly created and
 *    published via the Story creation system) and Product Content (product
 *    images, galleries, videos, promotions, catalog updates).
 * 3. Display of ONLY actually published, active, non-expired Store Stories
 *    belonging to the profile owner.
 * 4. Dual visibility gate: Stories UI/ring/viewer appears ONLY when
 *    (a) the owner has explicitly enabled Stories AND
 *    (b) at least one valid, published, active Store Story exists.
 * 5. Full preservation of existing Story records when Stories are disabled.
 */

import { getPlanPermissionConfig } from "./platformPermissionsConfig";

export const YUME_STORIES_ENABLED_STORAGE_KEY = "yume_stories_enabled_by_store";

export interface StoreStorySlide {
  id: string;
  storeId?: string;
  source?: "store_story" | string;
  type: "image" | "video" | "text";
  url: string;
  imageUrl?: string;
  mediaUrl?: string;
  text: string;
  caption?: string;
  textContent?: string;
  description?: string;
  bgColor?: string;
  bgGradient?: string;
  textColor?: string;
  textAnimation?: "none" | "fade" | "slide-up" | "scale" | "typewriter";
  textAlign?: "left" | "center" | "right";
  fontSize?: "sm" | "md" | "lg";
  productId?: string;
  productName?: string;
  hashtags?: string;
  discountPercent?: number;
  durationHours?: number;
  createdAt?: number;
  publishedAt?: number;
  scheduledAt?: number;
  expiresAt?: number;
  status?: "draft" | "scheduled" | "published";
  filterType?: string;
  filter?: string;
  trimStart?: number;
  trimEnd?: number;
  videoMaxDuration?: number;
  promotionBadge?: string;
}

export type StoreStoryRecord = StoreStorySlide;
export type CustomStoriesMap = Record<string, (StoreStorySlide | null | undefined)[]>;
export type DeletedStoriesMap = Record<string, string[]>;
export type StoriesEnabledMap = Record<string, boolean>;

/**
 * Loads the persisted Stories activation map from storage.
 * All profiles default to FALSE unless explicitly enabled by the owner.
 */
export function loadStoriesEnabledMap(storage?: Storage | null): StoriesEnabledMap {
  try {
    const targetStorage =
      storage !== undefined
        ? storage
        : typeof window !== "undefined" && window.localStorage
        ? window.localStorage
        : null;
    if (!targetStorage) return {};
    const raw = targetStorage.getItem(YUME_STORIES_ENABLED_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const sanitized: StoriesEnabledMap = {};
    for (const [key, val] of Object.entries(parsed)) {
      sanitized[key] = val === true;
    }
    return sanitized;
  } catch {
    return {};
  }
}

/**
 * Checks whether Stories are explicitly enabled for a given profile/store ID or profile object.
 * Returns FALSE by default for all new and existing profiles unless explicitly set to TRUE.
 */
export function isProfileStoriesEnabled(
  profileOrId: string | { id: string; storiesEnabled?: boolean } | undefined | null,
  storiesEnabledMap?: StoriesEnabledMap | null,
  profileObj?: { storiesEnabled?: boolean } | null
): boolean {
  if (!profileOrId) return false;
  const profileId = typeof profileOrId === "string" ? profileOrId : profileOrId.id;
  const resolvedObj = typeof profileOrId === "object" ? profileOrId : profileObj;
  if (!profileId) return false;
  if (storiesEnabledMap && Object.prototype.hasOwnProperty.call(storiesEnabledMap, profileId)) {
    return storiesEnabledMap[profileId] === true;
  }
  return resolvedObj?.storiesEnabled === true;
}

/**
 * Verifies that a candidate story object is a genuine, owner-created Store Story
 * belonging to `targetStoreId` and NOT an auto-generated default or product fallback record.
 */
export function isGenuineStoreStoryRecord(
  slide: unknown,
  targetStoreId: string
): slide is StoreStorySlide {
  if (!slide || typeof slide !== "object") return false;
  const s = slide as Record<string, unknown>;

  if (typeof s.id !== "string" || !s.id.trim()) return false;

  // Reject any legacy or synthetic auto-generated default/product story IDs
  if (
    s.id.startsWith("default_") ||
    s.id.startsWith("auto_") ||
    s.id.startsWith("sample_") ||
    s.source === "product_auto" ||
    s.source === "product_gallery" ||
    s.source === "sample"
  ) {
    return false;
  }

  // Enforce strict store ownership if storeId is recorded on the slide
  if (typeof s.storeId === "string" && s.storeId.trim() !== "" && s.storeId !== targetStoreId) {
    return false;
  }

  const storyType = s.type === "video" || s.type === "text" ? s.type : "image";
  if (storyType === "text") {
    const textVal = String(s.text ?? s.caption ?? s.textContent ?? "").trim();
    return textVal.length > 0;
  }

  // For image or video stories, require an explicitly saved story media URL on the story record itself
  const mediaUrl = String(s.url ?? s.imageUrl ?? s.mediaUrl ?? "").trim();
  return mediaUrl.length > 0;
}

/**
 * Evaluates whether a genuine Store Story record is currently published, active, and non-expired.
 */
export function isStoreStoryPublishedAndActive(
  slide: StoreStorySlide,
  deletedIds: string[] = [],
  nowMs: number = Date.now(),
  fallbackDurationHours: number = 24
): boolean {
  if (!slide || !slide.id) return false;
  if (deletedIds.includes(slide.id)) return false;

  const status = slide.status || "published";
  if (status === "draft") return false;
  if (status === "scheduled" && (slide.scheduledAt || 0) > nowMs) return false;
  if (status !== "published" && status !== "scheduled") return false;

  const slideDuration =
    typeof slide.durationHours === "number" && slide.durationHours > 0
      ? slide.durationHours
      : fallbackDurationHours;

  const parsedIdTimestamp = slide.id.startsWith("story_")
    ? parseInt(slide.id.split("_")[1] || "", 10)
    : NaN;

  const baseTimestamp =
    slide.publishedAt ||
    slide.scheduledAt ||
    slide.createdAt ||
    (!isNaN(parsedIdTimestamp) ? parsedIdTimestamp : nowMs);

  const expTime = slide.expiresAt || baseTimestamp + slideDuration * 3600 * 1000;
  return nowMs < expTime;
}

/**
 * Retrieves all explicitly published, active, non-expired Store Stories for `storeOrId`
 * from `customStoriesByStore` (ignoring whether the Stories feature visibility toggle is on or off).
 * Never reads or generates stories from product images, banners, or fallback data.
 */
export function getRawPublishedStoreStories(
  storeOrId: string | { id: string } | undefined | null,
  customStoriesByStore?: CustomStoriesMap | null,
  deletedStoryIdsByStore?: DeletedStoriesMap | null,
  nowMs: number = Date.now(),
  fallbackDurationHours: number = 24
): StoreStorySlide[] {
  if (!storeOrId || !customStoriesByStore) return [];
  const storeId = typeof storeOrId === "string" ? storeOrId : storeOrId.id;
  if (!storeId) return [];
  const rawList = customStoriesByStore[storeId];
  if (!Array.isArray(rawList)) return [];

  const deletedIds = deletedStoryIdsByStore?.[storeId] || [];

  return rawList.filter((slide): slide is StoreStorySlide => {
    if (!isGenuineStoreStoryRecord(slide, storeId)) return false;
    return isStoreStoryPublishedAndActive(slide, deletedIds, nowMs, fallbackDurationHours);
  });
}

/**
 * Retrieves the Store Stories that should be visible on a public/storefront profile.
 *
 * Enforces the two mandatory visibility conditions:
 * 1. The account owner has explicitly enabled Stories (`isProfileStoriesEnabled === true`).
 * 2. At least one valid, explicitly published, active Store Story exists.
 *
 * If Stories are disabled, returns `[]` while preserving all underlying Story records in storage.
 */
export function getVisibleProfileStoreStories(
  store: { id: string; storiesEnabled?: boolean; subscriptionTier?: string; premiumTier?: string } | undefined | null,
  customStoriesByStore?: CustomStoriesMap | null,
  deletedStoryIdsByStore?: DeletedStoriesMap | null,
  storiesEnabledMap?: StoriesEnabledMap | null,
  nowMs: number = Date.now(),
  fallbackDurationHours: number = 24
): StoreStorySlide[] {
  if (!store || !store.id) return [];

  // Enforce Subscription Plan Manage Stories permission
  const planPerms = getPlanPermissionConfig(store);
  if (!planPerms.manageStories.enabled) {
    return [];
  }

  const isEnabled = isProfileStoriesEnabled(store.id, storiesEnabledMap, store);
  if (!isEnabled) {
    return [];
  }

  const maxSlots = Math.max(1, planPerms.manageStories.storySlots || 4);
  const allowedTypes = planPerms.manageStories.supportedContentTypes;

  const rawPublished = getRawPublishedStoreStories(
    store.id,
    customStoriesByStore,
    deletedStoryIdsByStore,
    nowMs,
    fallbackDurationHours
  );

  return rawPublished
    .filter((slide) => {
      const t = slide.type || "image";
      if (t === "image") return allowedTypes.images;
      if (t === "video") return allowedTypes.videos;
      if (t === "text") return allowedTypes.text;
      return true;
    })
    .slice(0, maxSlots);
}

/**
 * Returns true if and only if BOTH visibility conditions are met:
 * 1. Stories are explicitly enabled by the profile owner.
 * 2. At least one published, active Store Story exists.
 */
export function shouldDisplayProfileStoriesInterface(
  store: { id: string; storiesEnabled?: boolean } | undefined | null,
  customStoriesByStore?: CustomStoriesMap | null,
  deletedStoryIdsByStore?: DeletedStoriesMap | null,
  storiesEnabledMap?: StoriesEnabledMap | null,
  nowMs: number = Date.now(),
  fallbackDurationHours: number = 24
): boolean {
  return (
    getVisibleProfileStoreStories(
      store,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledMap,
      nowMs,
      fallbackDurationHours
    ).length > 0
  );
}
