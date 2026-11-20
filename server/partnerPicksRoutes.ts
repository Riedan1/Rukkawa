import type { Express, Request, Response } from "express";
import {
  loadDatabase,
  saveDatabase,
  type LocalDbSchema,
} from "./localDb";
import {
  authorizeAdminRequest,
  appendServerAuditLog,
  DEFAULT_SERVER_ADMINS,
} from "./securityGovernance";
import type {
  MerchantPartnerPicksProfile,
  PartnerPickChannelId,
  PartnerPickPlacementActivityEntry,
  PartnerPickProductPlacement,
  PartnerPickProposedOption,
  PartnerPicksChannelAnalyticsEvent,
  PartnerPicksGlobalConfig,
  PartnerPicksPartnership,
} from "../src/types";
import {
  PARTNER_PICK_CHANNEL_IDS,
  createDefaultMerchantPartnerPicksProfile,
  createDefaultPartnerPicksGlobalConfig,
  createInitialBidirectionalExposureLedger,
  normalizeMerchantPartnerPicksProfile,
  normalizePartnerPicksGlobalConfig,
  resolveTrafficLightForPlacementState,
  validatePartnerPickPlacementRecord,
  validatePartnerPicksAnalyticsEvent,
} from "../src/utils/partnerPicksSchema";
import {
  evaluateBilateralPartnershipInitiationEligibility,
  evaluateBilateralPlacementEligibility,
  evaluateGate2SourceMerchantEligibility,
  evaluateGate6LiveProductIntegrity,
  evaluatePartnerPicksActorPermission,
  evaluatePlacementProductLifecycleTransition,
  type PartnerPicksActorIdentity,
} from "../src/utils/partnerPicksEligibility";
import { recordEventInBidirectionalExposureLedger } from "../src/utils/partnerPicksFairnessAndRotation";

/**
 * Extracts actor identity from request headers or body for server-side Partner Picks authorization.
 */
export function extractPartnerPicksActorFromRequest(
  req: Request
): PartnerPicksActorIdentity | null {
  const bodyActor = req.body?.actor;
  const headerId = req.headers["x-yume-actor-id"] || req.headers["x-actor-id"];
  const headerEmail = req.headers["x-yume-actor-email"] || req.headers["x-actor-email"];
  const headerRole = req.headers["x-yume-actor-role"] || req.headers["x-actor-role"];
  const headerStoreId = req.headers["x-yume-actor-store-id"] || req.headers["x-actor-store-id"];
  const headerTeamMemberId = req.headers["x-yume-actor-staff-id"] || req.headers["x-actor-staff-id"];

  const actor: PartnerPicksActorIdentity = {
    id:
      typeof bodyActor?.id === "string"
        ? bodyActor.id
        : typeof headerId === "string"
        ? headerId
        : undefined,
    name: typeof bodyActor?.name === "string" ? bodyActor.name : undefined,
    email:
      typeof bodyActor?.email === "string"
        ? bodyActor.email
        : typeof headerEmail === "string"
        ? headerEmail
        : undefined,
    role:
      typeof bodyActor?.role === "string"
        ? bodyActor.role
        : typeof headerRole === "string"
        ? headerRole
        : "merchant",
    storeId:
      typeof bodyActor?.storeId === "string"
        ? bodyActor.storeId
        : typeof headerStoreId === "string"
        ? headerStoreId
        : undefined,
    storeName:
      typeof bodyActor?.storeName === "string" ? bodyActor.storeName : undefined,
    ownedStoreIds: Array.isArray(bodyActor?.ownedStoreIds)
      ? bodyActor.ownedStoreIds
      : undefined,
    teamMemberId:
      typeof bodyActor?.teamMemberId === "string"
        ? bodyActor.teamMemberId
        : typeof headerTeamMemberId === "string"
        ? headerTeamMemberId
        : undefined,
  };

  if (!actor.id && !actor.email && !actor.storeId) {
    return null;
  }
  return actor;
}

/**
 * Reconciles all Partner Picks placements in the database against the 6-State Live Product Availability Model.
 * Ensures:
 * - Case A (`AUTO_PAUSED_OUT_OF_STOCK`) auto-pauses when stock <= 0 and auto-resumes when stock > 0 (if all gates pass).
 * - Cases B (`PAUSED_OWNER_HIDDEN`), C (`PAUSED_OWNER_DISABLED`), D (`PAUSED_OWNER_ARCHIVED`),
 *   E (`INVALIDATED_PRODUCT_REMOVED`), and F (`SUSPENDED_BY_PLATFORM_ADMIN`) transition accurately and NEVER auto-resume on stock changes.
 */
export function reconcilePartnerPickPlacementsInDb(db: LocalDbSchema): {
  changedCount: number;
  transitions: Array<{
    placementId: string;
    previousState: string;
    nextState: string;
    action: string;
  }>;
} {
  const globalConfig = normalizePartnerPicksGlobalConfig(db.partnerPicksConfig);
  const storesById = Object.fromEntries(
    (db.stores || []).filter((s) => s && s.id).map((s) => [s.id, s])
  );
  const profiles = db.partnerPicksProfiles || {};
  const partnerships = db.partnerPicksPartnerships || [];
  const placements = db.partnerPicksPlacements || [];

  const transitions: Array<{
    placementId: string;
    previousState: string;
    nextState: string;
    action: string;
  }> = [];

  let changedCount = 0;
  const nowIso = new Date().toISOString();

  for (let i = 0; i < placements.length; i++) {
    const pl = placements[i];
    if (!pl) continue;
    const sourceStore = storesById[pl.sourceStoreId];
    const hostStore = storesById[pl.hostStoreId];
    const partnership = partnerships.find((p) => p && p.id === pl.partnershipId);

    const tr = evaluatePlacementProductLifecycleTransition({
      globalConfig,
      channelId: pl.channelId,
      sourceStore,
      hostStore,
      sourceProfile: profiles[pl.sourceStoreId],
      hostProfile: profiles[pl.hostStoreId],
      partnership,
      allPartnerships: partnerships,
      placement: pl,
    });

    if (tr.changed && tr.transitionAction !== "NO_CHANGE") {
      changedCount += 1;
      const entry: PartnerPickPlacementActivityEntry = {
        id: `act_${Date.now()}_${i}`,
        timestamp: nowIso,
        actorStoreId: pl.sourceStoreId,
        actorRole: "SYSTEM",
        action: tr.transitionAction,
        selectedOptionId: pl.selectedOptionId,
        note: tr.reason,
      };
      placements[i] = {
        ...pl,
        lifecycleState: tr.nextState,
        trafficLight: tr.nextTrafficLight,
        activityHistory: [...(pl.activityHistory || []), entry],
        updatedAt: nowIso,
      };
      transitions.push({
        placementId: pl.id,
        previousState: tr.previousState,
        nextState: tr.nextState,
        action: tr.transitionAction,
      });
    }
  }

  return { changedCount, transitions };
}

/**
 * Seeds initial reciprocal Partner Picks profiles, active partnership, and approved placements
 * between existing stores in `db.stores` ONLY if `db.partnerPicksPartnerships` is empty
 * and `db.stores` has at least 2 stores with products.
 */
export function ensureInitialPartnerPicksDemoSeed(db: LocalDbSchema): boolean {
  if (!db.partnerPicksConfig) {
    db.partnerPicksConfig = createDefaultPartnerPicksGlobalConfig();
  }
  if (!db.partnerPicksProfiles) db.partnerPicksProfiles = {};
  if (!Array.isArray(db.partnerPicksPartnerships)) db.partnerPicksPartnerships = [];
  if (!Array.isArray(db.partnerPicksPlacements)) db.partnerPicksPlacements = [];
  if (!db.partnerPicksExposureLedger) db.partnerPicksExposureLedger = {};
  if (!Array.isArray(db.partnerPicksAnalyticsEvents)) {
    db.partnerPicksAnalyticsEvents = [];
  }

  if (db.partnerPicksPartnerships.length > 0) {
    return false;
  }

  const eligibleStores = (db.stores || []).filter(
    (s) =>
      s &&
      s.id &&
      !s.archived &&
      Array.isArray(s.products) &&
      s.products.length > 0
  );
  if (eligibleStores.length < 2) {
    return false;
  }

  const storeA = eligibleStores[0];
  const storeB = eligibleStores[1];
  const nowIso = new Date().toISOString();

  // Ensure both demo stores have a Partner Picks-eligible canonical subscription tier (e.g. Premium)
  if (!storeA.subscriptionTier || storeA.subscriptionTier === "Basic" || storeA.subscriptionTier === "Pro") {
    storeA.subscriptionTier = "Premium";
    storeA.premiumTier = "Premium";
  }
  if (!storeB.subscriptionTier || storeB.subscriptionTier === "Basic" || storeB.subscriptionTier === "Pro") {
    storeB.subscriptionTier = "Premium";
    storeB.premiumTier = "Premium";
  }

  const prodA1 = storeA.products.find((p) => p && p.stock > 0 && p.isVisible !== false) || storeA.products[0];
  const prodA2 = storeA.products.find((p) => p && p.id !== prodA1?.id && p.stock > 0) || prodA1;
  const prodB1 = storeB.products.find((p) => p && p.stock > 0 && p.isVisible !== false) || storeB.products[0];
  const prodB2 = storeB.products.find((p) => p && p.id !== prodB1?.id && p.stock > 0) || prodB1;

  if (!prodA1 || !prodB1) return false;

  const profileA = createDefaultMerchantPartnerPicksProfile(
    storeA.id,
    storeA.ownerId,
    nowIso
  );
  profileA.defaultSharedProductIds = Array.from(
    new Set([prodA1.id, prodA2?.id].filter(Boolean) as string[])
  );
  db.partnerPicksProfiles[storeA.id] = profileA;

  const profileB = createDefaultMerchantPartnerPicksProfile(
    storeB.id,
    storeB.ownerId,
    nowIso
  );
  profileB.defaultSharedProductIds = Array.from(
    new Set([prodB1.id, prodB2?.id].filter(Boolean) as string[])
  );
  db.partnerPicksProfiles[storeB.id] = profileB;

  const partnershipId = `pp_part_${storeA.id}_${storeB.id}`;
  const partnership: PartnerPicksPartnership = {
    id: partnershipId,
    storeAId: storeA.id,
    storeAName: storeA.name,
    storeAOwnerUid: storeA.ownerId,
    storeBId: storeB.id,
    storeBName: storeB.name,
    storeBOwnerUid: storeB.ownerId,
    initiatedByStoreId: storeA.id,
    status: "ACTIVE",
    requestMessage:
      "Reciprocal YUME Partner Picks collaboration to showcase complementary artisanal collections.",
    agreementTerms: {
      durationDays: 30,
      enabledChannelsAOnB: {
        STORE_BANNER: true,
        PRODUCT_GRID: true,
        DISCOVER_MORE: true,
        REELS_FEED: true,
        STORIES: true,
      },
      enabledChannelsBOnA: {
        STORE_BANNER: true,
        PRODUCT_GRID: true,
        DISCOVER_MORE: true,
        REELS_FEED: true,
        STORIES: true,
      },
      agreedByStoreA: true,
      agreedByStoreB: true,
      agreedAtStoreA: nowIso,
      agreedAtStoreB: nowIso,
    },
    activatedAt: nowIso,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  db.partnerPicksPartnerships.push(partnership);

  // Create initial bidirectional ledger with sample baseline exposure
  const ledger = createInitialBidirectionalExposureLedger(
    partnershipId,
    storeA.id,
    storeB.id,
    nowIso
  );
  db.partnerPicksExposureLedger[partnershipId] = ledger;

  // Create two-sided approved GREEN placements for Store A on Store B and Store B on Store A
  const seedChannels: Array<{
    channelId: PartnerPickChannelId;
    option: PartnerPickProposedOption;
  }> = [
    {
      channelId: "STORE_BANNER",
      option: {
        optionId: "opt_banner_slot_1",
        channelId: "STORE_BANNER",
        bannerSlotIndex: 1,
        label: "Store Banner Showcase Slot #2",
      },
    },
    {
      channelId: "PRODUCT_GRID",
      option: {
        optionId: "opt_grid_r1_c2",
        channelId: "PRODUCT_GRID",
        gridCoordinate: { row: 1, col: 2 },
        label: "Page 1 · Row 1 · Column 2",
      },
    },
    {
      channelId: "DISCOVER_MORE",
      option: {
        optionId: "opt_discover_slot_1",
        channelId: "DISCOVER_MORE",
        discoverCarouselIndex: 1,
        label: "Discover More Carousel Slot #2",
      },
    },
    {
      channelId: "REELS_FEED",
      option: {
        optionId: "opt_reels_mid",
        channelId: "REELS_FEED",
        sequentialPositionHint: "MID_SEQUENCE",
        label: "Reels Feed · Mid-Sequence Cadence",
      },
    },
    {
      channelId: "STORIES",
      option: {
        optionId: "opt_stories_tail",
        channelId: "STORIES",
        sequentialPositionHint: "TAIL",
        label: "Stories Sequence · Runtime Slide",
      },
    },
  ];

  for (const ch of seedChannels) {
    // Store A product placed on Store B
    db.partnerPicksPlacements.push({
      id: `plc_${storeA.id}_on_${storeB.id}_${ch.channelId.toLowerCase()}`,
      partnershipId,
      sourceStoreId: storeA.id,
      sourceStoreOwnerUid: storeA.ownerId,
      hostStoreId: storeB.id,
      hostStoreOwnerUid: storeB.ownerId,
      productId: prodA1.id,
      channelId: ch.channelId,
      proposedOptions: [ch.option],
      selectedOptionId: ch.option.optionId,
      selectedOption: ch.option,
      hostSelectedAt: nowIso,
      proposerFinalApproved: true,
      proposerFinalApprovedAt: nowIso,
      trafficLight: "GREEN",
      lifecycleState: "APPROVED_LIVE",
      activityHistory: [
        {
          id: `act_seed_1_${ch.channelId}`,
          timestamp: nowIso,
          actorStoreId: storeA.id,
          actorRole: "SOURCE_MERCHANT",
          action: "PROPOSED_OPTIONS",
          note: `Proposed ${ch.option.label}`,
        },
        {
          id: `act_seed_2_${ch.channelId}`,
          timestamp: nowIso,
          actorStoreId: storeB.id,
          actorRole: "HOST_MERCHANT",
          action: "HOST_SELECTED_OPTION",
          selectedOptionId: ch.option.optionId,
          note: `Host selected ${ch.option.label}`,
        },
        {
          id: `act_seed_3_${ch.channelId}`,
          timestamp: nowIso,
          actorStoreId: storeA.id,
          actorRole: "SOURCE_MERCHANT",
          action: "PROPOSER_FINAL_APPROVED",
          selectedOptionId: ch.option.optionId,
          note: "Final two-sided approval confirmed (GREEN)",
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    // Store B product placed on Store A
    db.partnerPicksPlacements.push({
      id: `plc_${storeB.id}_on_${storeA.id}_${ch.channelId.toLowerCase()}`,
      partnershipId,
      sourceStoreId: storeB.id,
      sourceStoreOwnerUid: storeB.ownerId,
      hostStoreId: storeA.id,
      hostStoreOwnerUid: storeA.ownerId,
      productId: prodB1.id,
      channelId: ch.channelId,
      proposedOptions: [ch.option],
      selectedOptionId: ch.option.optionId,
      selectedOption: ch.option,
      hostSelectedAt: nowIso,
      proposerFinalApproved: true,
      proposerFinalApprovedAt: nowIso,
      trafficLight: "GREEN",
      lifecycleState: "APPROVED_LIVE",
      activityHistory: [
        {
          id: `act_seed_b1_${ch.channelId}`,
          timestamp: nowIso,
          actorStoreId: storeB.id,
          actorRole: "SOURCE_MERCHANT",
          action: "PROPOSED_OPTIONS",
          note: `Proposed ${ch.option.label}`,
        },
        {
          id: `act_seed_b2_${ch.channelId}`,
          timestamp: nowIso,
          actorStoreId: storeA.id,
          actorRole: "HOST_MERCHANT",
          action: "HOST_SELECTED_OPTION",
          selectedOptionId: ch.option.optionId,
          note: `Host selected ${ch.option.label}`,
        },
        {
          id: `act_seed_b3_${ch.channelId}`,
          timestamp: nowIso,
          actorStoreId: storeB.id,
          actorRole: "SOURCE_MERCHANT",
          action: "PROPOSER_FINAL_APPROVED",
          selectedOptionId: ch.option.optionId,
          note: "Final two-sided approval confirmed (GREEN)",
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  return true;
}

/**
 * Computes strictly separated per-channel analytics summaries across all 5 channels
 * (Reels Feed and Stories are never merged).
 */
export function computePerChannelAnalyticsBreakdown(
  events: PartnerPicksChannelAnalyticsEvent[] = [],
  filterStoreId?: string | null
) {
  const breakdown: Record<
    PartnerPickChannelId,
    {
      channelId: PartnerPickChannelId;
      opportunities: number;
      impressions: number;
      uniqueVisitors: number;
      clicks: number;
      skips: number;
      originalProductOpens: number;
      ctrPercent: number;
      totalExposureDurationSeconds: number;
    }
  > = {
    STORE_BANNER: {
      channelId: "STORE_BANNER",
      opportunities: 0,
      impressions: 0,
      uniqueVisitors: 0,
      clicks: 0,
      skips: 0,
      originalProductOpens: 0,
      ctrPercent: 0,
      totalExposureDurationSeconds: 0,
    },
    PRODUCT_GRID: {
      channelId: "PRODUCT_GRID",
      opportunities: 0,
      impressions: 0,
      uniqueVisitors: 0,
      clicks: 0,
      skips: 0,
      originalProductOpens: 0,
      ctrPercent: 0,
      totalExposureDurationSeconds: 0,
    },
    DISCOVER_MORE: {
      channelId: "DISCOVER_MORE",
      opportunities: 0,
      impressions: 0,
      uniqueVisitors: 0,
      clicks: 0,
      skips: 0,
      originalProductOpens: 0,
      ctrPercent: 0,
      totalExposureDurationSeconds: 0,
    },
    REELS_FEED: {
      channelId: "REELS_FEED",
      opportunities: 0,
      impressions: 0,
      uniqueVisitors: 0,
      clicks: 0,
      skips: 0,
      originalProductOpens: 0,
      ctrPercent: 0,
      totalExposureDurationSeconds: 0,
    },
    STORIES: {
      channelId: "STORIES",
      opportunities: 0,
      impressions: 0,
      uniqueVisitors: 0,
      clicks: 0,
      skips: 0,
      originalProductOpens: 0,
      ctrPercent: 0,
      totalExposureDurationSeconds: 0,
    },
  };

  const uniqueVisitorSets: Record<PartnerPickChannelId, Set<string>> = {
    STORE_BANNER: new Set(),
    PRODUCT_GRID: new Set(),
    DISCOVER_MORE: new Set(),
    REELS_FEED: new Set(),
    STORIES: new Set(),
  };

  for (const ev of events) {
    if (!ev || !PARTNER_PICK_CHANNEL_IDS.includes(ev.channelId)) continue;
    if (
      filterStoreId &&
      ev.sourceStoreId !== filterStoreId &&
      ev.hostStoreId !== filterStoreId
    ) {
      continue;
    }

    const row = breakdown[ev.channelId];
    if (ev.eventType === "opportunity") {
      row.opportunities += 1;
    } else if (ev.eventType === "impression") {
      row.impressions += 1;
      if (row.opportunities < row.impressions) {
        row.opportunities = row.impressions;
      }
      if (ev.visitorHash) {
        uniqueVisitorSets[ev.channelId].add(ev.visitorHash);
      }
      if (typeof ev.exposureDurationMs === "number" && ev.exposureDurationMs > 0) {
        row.totalExposureDurationSeconds = Number(
          (row.totalExposureDurationSeconds + ev.exposureDurationMs / 1000).toFixed(2)
        );
      }
    } else if (ev.eventType === "click") {
      row.clicks += 1;
    } else if (ev.eventType === "original_product_open") {
      row.clicks += 1;
      row.originalProductOpens += 1;
    } else if (ev.eventType === "skip") {
      row.skips += 1;
    }
  }

  for (const chId of PARTNER_PICK_CHANNEL_IDS) {
    const row = breakdown[chId];
    row.uniqueVisitors = uniqueVisitorSets[chId].size;
    row.ctrPercent =
      row.impressions > 0
        ? Number(((row.clicks / row.impressions) * 100).toFixed(2))
        : 0;
  }

  return breakdown;
}

export function registerPartnerPicksRoutes(app: Express): void {
  // 1. GET /api/partner-picks/bootstrap
  app.get("/api/partner-picks/bootstrap", async (req: Request, res: Response) => {
    try {
      const db = await loadDatabase();
      let configHealed = false;
      if (
        db.partnerPicksConfig?.planEntitlements?.Pro &&
        db.partnerPicksConfig.planEntitlements.Pro.maxProductsPerPartnership === 0
      ) {
        db.partnerPicksConfig.planEntitlements.Pro =
          createDefaultPartnerPicksGlobalConfig().planEntitlements.Pro;
        configHealed = true;
      }
      const seeded = ensureInitialPartnerPicksDemoSeed(db);
      const reconciliation = reconcilePartnerPickPlacementsInDb(db);

      if (configHealed || seeded || reconciliation.changedCount > 0) {
        await saveDatabase(db);
      }

      const storeIdParam =
        typeof req.query.storeId === "string" ? req.query.storeId.trim() : null;

      return res.json({
        ok: true,
        globalConfig: normalizePartnerPicksGlobalConfig(db.partnerPicksConfig),
        profiles: db.partnerPicksProfiles || {},
        profilesByStoreId: db.partnerPicksProfiles || {},
        partnerships: db.partnerPicksPartnerships || [],
        placements: db.partnerPicksPlacements || [],
        exposureLedger: db.partnerPicksExposureLedger || {},
        exposureLedgers: db.partnerPicksExposureLedger || {},
        analyticsBreakdownByChannel: computePerChannelAnalyticsBreakdown(
          db.partnerPicksAnalyticsEvents || [],
          storeIdParam
        ),
        reconciledTransitions: reconciliation.transitions,
      });
    } catch {
      return res.status(500).json({
        ok: false,
        error: "PARTNER_PICKS_BOOTSTRAP_FAILED",
      });
    }
  });

  // 1b. GET /api/partner-picks/stores/search (Debounced & Paginated Partner Store Discovery)
  app.get("/api/partner-picks/stores/search", async (req: Request, res: Response) => {
    try {
      const db = await loadDatabase();
      const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
      const category =
        typeof req.query.category === "string" ? req.query.category.trim() : "";
      const wilaya =
        typeof req.query.wilaya === "string" ? req.query.wilaya.trim() : "";
      const excludeStoreId =
        typeof req.query.excludeStoreId === "string"
          ? req.query.excludeStoreId.trim()
          : "";
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.max(1, Math.min(24, Number(req.query.limit) || 6));

      const activeStores = (db.stores || []).filter(
        (s) => s && s.id && !s.archived && s.id !== excludeStoreId
      );

      const allCategories = Array.from(
        new Set(
          activeStores
            .map((s) => String((s as any).category || s.products?.[0]?.category || "").trim())
            .filter(Boolean)
        )
      );
      const allWilayas = Array.from(
        new Set(
          activeStores
            .map((s) => String(s.wilaya || (s as any).location || "").trim())
            .filter(Boolean)
        )
      );

      const filtered = activeStores.filter((st) => {
        const stCategory = String(
          (st as any).category || st.products?.[0]?.category || "Marketplace"
        ).trim();
        const stWilaya = String(st.wilaya || (st as any).location || "").trim();

        if (category && category !== "ALL" && stCategory.toLowerCase() !== category.toLowerCase()) {
          return false;
        }
        if (wilaya && wilaya !== "ALL" && stWilaya.toLowerCase() !== wilaya.toLowerCase()) {
          return false;
        }
        if (q) {
          const haystack = `${st.name || ""} ${st.description || ""} ${stCategory} ${stWilaya}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      });

      const totalCount = filtered.length;
      const offset = (page - 1) * limit;
      const paged = filtered.slice(offset, offset + limit).map((st) => ({
        id: st.id,
        name: st.name,
        logoUrl: st.logoUrl,
        bannerUrl: st.bannerUrl,
        description: st.description || "",
        category: String((st as any).category || st.products?.[0]?.category || "Marketplace"),
        wilaya: st.wilaya || (st as any).location || "Alger",
        rating: st.rating || 4.8,
        verified: Boolean(st.verified),
        productCount: Array.isArray(st.products) ? st.products.length : 0,
      }));

      return res.json({
        ok: true,
        stores: paged,
        totalCount,
        page,
        limit,
        hasMore: offset + paged.length < totalCount,
        categories: allCategories,
        wilayas: allWilayas,
      });
    } catch {
      return res.status(500).json({
        ok: false,
        error: "PARTNER_STORES_SEARCH_FAILED",
      });
    }
  });

  // 2. PUT /api/partner-picks/profile/:storeId
  app.put("/api/partner-picks/profile/:storeId", async (req: Request, res: Response) => {
    try {
      const storeId = String(req.params.storeId || "").trim();
      const db = await loadDatabase();
      const targetStore = (db.stores || []).find((s) => s && s.id === storeId);
      if (!targetStore) {
        return res.status(404).json({ ok: false, error: "STORE_NOT_FOUND" });
      }

      const actor = extractPartnerPicksActorFromRequest(req);
      const currentProfile =
        db.partnerPicksProfiles?.[storeId] ||
        createDefaultMerchantPartnerPicksProfile(storeId, targetStore.ownerId);

      // If request attempts to update staffPermissions, require strict Store Owner
      const isModifyingStaffPerms = Boolean(req.body?.profile?.staffPermissions);
      const permCheck = evaluatePartnerPicksActorPermission({
        actor,
        targetStore,
        targetStoreProfile: currentProfile,
        action: isModifyingStaffPerms
          ? "CONFIGURE_STAFF_PERMISSIONS"
          : "MANAGE_SHARED_PRODUCTS",
      });

      if (!permCheck.allowed) {
        return res.status(403).json({
          ok: false,
          code: "PARTNER_PICKS_FORBIDDEN",
          error: permCheck.reason || "Not authorized to modify this store's Partner Picks profile.",
        });
      }

      const nextProfile: MerchantPartnerPicksProfile = normalizeMerchantPartnerPicksProfile(
        storeId,
        {
          ...currentProfile,
          ...(req.body?.profile || {}),
          ownerUid: targetStore.ownerId || currentProfile.ownerUid,
          updatedAt: new Date().toISOString(),
        }
      );

      if (!db.partnerPicksProfiles) db.partnerPicksProfiles = {};
      db.partnerPicksProfiles[storeId] = nextProfile;
      reconcilePartnerPickPlacementsInDb(db);
      await saveDatabase(db);

      return res.json({
        ok: true,
        profile: nextProfile,
      });
    } catch {
      return res.status(500).json({
        ok: false,
        error: "FAILED_TO_UPDATE_PARTNER_PICKS_PROFILE",
      });
    }
  });

  // 3. POST /api/partner-picks/partnerships/request
  app.post("/api/partner-picks/partnerships/request", async (req: Request, res: Response) => {
    try {
      const db = await loadDatabase();
      const globalConfig = normalizePartnerPicksGlobalConfig(db.partnerPicksConfig);

      const initiatorStoreId = String(req.body?.initiatorStoreId || "").trim();
      const targetStoreId = String(req.body?.targetStoreId || "").trim();
      const requestMessage = String(req.body?.requestMessage || "").trim().slice(0, 500);
      const durationDays = Math.min(
        365,
        Math.max(1, Number(req.body?.durationDays) || 30)
      );

      const initiatorStore = (db.stores || []).find((s) => s && s.id === initiatorStoreId);
      const targetStore = (db.stores || []).find((s) => s && s.id === targetStoreId);

      if (!initiatorStore || !targetStore) {
        return res.status(404).json({
          ok: false,
          error: "INITIATOR_OR_TARGET_STORE_NOT_FOUND",
        });
      }

      const actor = extractPartnerPicksActorFromRequest(req);
      const permCheck = evaluatePartnerPicksActorPermission({
        actor,
        targetStore: initiatorStore,
        targetStoreProfile: db.partnerPicksProfiles?.[initiatorStoreId],
        action: "SEND_PARTNERSHIP_REQUEST",
      });

      if (!permCheck.allowed) {
        return res.status(403).json({
          ok: false,
          code: "PARTNER_PICKS_FORBIDDEN",
          error: permCheck.reason || "Not authorized to send Partner Picks requests for this store.",
        });
      }

      const bilatInit = evaluateBilateralPartnershipInitiationEligibility({
        globalConfig,
        initiatorStore,
        targetStore,
        allPartnerships: db.partnerPicksPartnerships || [],
      });

      if (!bilatInit.eligible) {
        return res.status(403).json({
          ok: false,
          code: bilatInit.failureCode || "BILATERAL_ELIGIBILITY_FAILED",
          error:
            bilatInit.failureReason ||
            "One or both stores do not meet Partner Picks subscription plan or standing requirements.",
          eligibilityDetails: bilatInit,
        });
      }

      const allChannelsTrue: Record<PartnerPickChannelId, boolean> = {
        STORE_BANNER: true,
        PRODUCT_GRID: true,
        DISCOVER_MORE: true,
        REELS_FEED: true,
        STORIES: true,
      };

      const requestedChannels = req.body?.proposedChannels || allChannelsTrue;
      const sanitizedChannels: Record<PartnerPickChannelId, boolean> = {
        STORE_BANNER: requestedChannels.STORE_BANNER !== false,
        PRODUCT_GRID: requestedChannels.PRODUCT_GRID !== false,
        DISCOVER_MORE: requestedChannels.DISCOVER_MORE !== false,
        REELS_FEED: requestedChannels.REELS_FEED !== false,
        STORIES: requestedChannels.STORIES !== false,
      };

      const nowIso = new Date().toISOString();
      const partnershipId = `pp_part_${initiatorStoreId}_${targetStoreId}_${Date.now()}`;
      const partnership: PartnerPicksPartnership = {
        id: partnershipId,
        storeAId: initiatorStore.id,
        storeAName: initiatorStore.name,
        storeAOwnerUid: initiatorStore.ownerId,
        storeBId: targetStore.id,
        storeBName: targetStore.name,
        storeBOwnerUid: targetStore.ownerId,
        initiatedByStoreId: initiatorStore.id,
        status: "PENDING_REQUEST",
        requestMessage,
        agreementTerms: {
          durationDays,
          enabledChannelsAOnB: { ...sanitizedChannels },
          enabledChannelsBOnA: { ...sanitizedChannels },
          agreedByStoreA: true,
          agreedByStoreB: false,
          agreedAtStoreA: nowIso,
          agreedAtStoreB: null,
        },
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      if (!Array.isArray(db.partnerPicksPartnerships)) {
        db.partnerPicksPartnerships = [];
      }
      db.partnerPicksPartnerships.push(partnership);

      if (!db.partnerPicksExposureLedger) db.partnerPicksExposureLedger = {};
      db.partnerPicksExposureLedger[partnershipId] =
        createInitialBidirectionalExposureLedger(
          partnershipId,
          initiatorStore.id,
          targetStore.id,
          nowIso
        );

      await saveDatabase(db);

      return res.status(201).json({
        ok: true,
        partnership,
      });
    } catch {
      return res.status(500).json({
        ok: false,
        error: "FAILED_TO_CREATE_PARTNERSHIP_REQUEST",
      });
    }
  });

  // 4. POST /api/partner-picks/partnerships/:partnershipId/respond
  app.post(
    "/api/partner-picks/partnerships/:partnershipId/respond",
    async (req: Request, res: Response) => {
      try {
        const partnershipId = String(req.params.partnershipId || "").trim();
        const actingStoreId = String(req.body?.actingStoreId || "").trim();
        const decision = String(req.body?.decision || "").trim().toUpperCase(); // ACCEPT | REJECT | CANCEL

        const db = await loadDatabase();
        const partnerships = db.partnerPicksPartnerships || [];
        const idx = partnerships.findIndex((p) => p && p.id === partnershipId);
        if (idx < 0) {
          return res.status(404).json({ ok: false, error: "PARTNERSHIP_NOT_FOUND" });
        }

        const partnership = partnerships[idx];
        if (
          actingStoreId !== partnership.storeAId &&
          actingStoreId !== partnership.storeBId
        ) {
          return res.status(403).json({
            ok: false,
            error: "STORE_NOT_PARTICIPANT_IN_PARTNERSHIP",
          });
        }

        const actingStore = (db.stores || []).find((s) => s && s.id === actingStoreId);
        const actor = extractPartnerPicksActorFromRequest(req);
        const permCheck = evaluatePartnerPicksActorPermission({
          actor,
          targetStore: actingStore,
          targetStoreProfile: db.partnerPicksProfiles?.[actingStoreId],
          action: "ACCEPT_OR_REJECT_PARTNERSHIP_REQUEST",
        });

        if (!permCheck.allowed) {
          return res.status(403).json({
            ok: false,
            code: "PARTNER_PICKS_FORBIDDEN",
            error: permCheck.reason || "Not authorized to respond to partnership requests.",
          });
        }

        const nowIso = new Date().toISOString();

        if (decision === "REJECT") {
          partnership.status = "REJECTED";
          partnership.updatedAt = nowIso;
        } else if (decision === "CANCEL") {
          partnership.status = "CANCELLED";
          partnership.updatedAt = nowIso;
        } else if (decision === "ACCEPT") {
          const storeA = (db.stores || []).find((s) => s && s.id === partnership.storeAId);
          const storeB = (db.stores || []).find((s) => s && s.id === partnership.storeBId);
          const globalConfig = normalizePartnerPicksGlobalConfig(db.partnerPicksConfig);

          const bilatCheck = evaluateBilateralPartnershipInitiationEligibility({
            globalConfig,
            initiatorStore: storeA,
            targetStore: storeB,
            allPartnerships: partnerships,
          });

          if (!bilatCheck.eligible) {
            return res.status(403).json({
              ok: false,
              code: bilatCheck.failureCode || "BILATERAL_ELIGIBILITY_FAILED",
              error:
                bilatCheck.failureReason ||
                "Partnership cannot be activated because one or both stores no longer meet plan requirements.",
            });
          }

          if (actingStoreId === partnership.storeAId) {
            partnership.agreementTerms.agreedByStoreA = true;
            partnership.agreementTerms.agreedAtStoreA = nowIso;
          } else {
            partnership.agreementTerms.agreedByStoreB = true;
            partnership.agreementTerms.agreedAtStoreB = nowIso;
          }

          if (
            partnership.agreementTerms.agreedByStoreA &&
            partnership.agreementTerms.agreedByStoreB
          ) {
            partnership.status = "ACTIVE";
            partnership.activatedAt = nowIso;
            partnership.expiresAt = new Date(
              Date.now() + (partnership.agreementTerms.durationDays || 30) * 86400000
            ).toISOString();
          } else {
            partnership.status = "ACCEPTED";
          }
          partnership.updatedAt = nowIso;
        } else {
          return res.status(400).json({
            ok: false,
            error: "INVALID_PARTNERSHIP_DECISION",
          });
        }

        partnerships[idx] = partnership;
        await saveDatabase(db);

        return res.json({
          ok: true,
          partnership,
        });
      } catch {
        return res.status(500).json({
          ok: false,
          error: "FAILED_TO_RESPOND_TO_PARTNERSHIP",
        });
      }
    }
  );

  // 5. POST /api/partner-picks/placements/propose (Step 1 of Two-Sided Placement Approval)
  app.post("/api/partner-picks/placements/propose", async (req: Request, res: Response) => {
    try {
      const db = await loadDatabase();
      const globalConfig = normalizePartnerPicksGlobalConfig(db.partnerPicksConfig);

      const partnershipId = String(req.body?.partnershipId || "").trim();
      const sourceStoreId = String(req.body?.sourceStoreId || "").trim();
      const hostStoreId = String(req.body?.hostStoreId || "").trim();
      const productId = String(req.body?.productId || "").trim();
      const channelId = req.body?.channelId as PartnerPickChannelId;
      const proposedOptions: PartnerPickProposedOption[] = Array.isArray(
        req.body?.proposedOptions
      )
        ? req.body.proposedOptions
        : [];

      if (!PARTNER_PICK_CHANNEL_IDS.includes(channelId)) {
        return res.status(400).json({ ok: false, error: "INVALID_CHANNEL_ID" });
      }
      if (proposedOptions.length === 0) {
        return res.status(400).json({
          ok: false,
          error: "AT_LEAST_ONE_PROPOSED_OPTION_REQUIRED",
        });
      }

      const sourceStore = (db.stores || []).find((s) => s && s.id === sourceStoreId);
      const hostStore = (db.stores || []).find((s) => s && s.id === hostStoreId);
      const partnership = (db.partnerPicksPartnerships || []).find(
        (p) => p && p.id === partnershipId
      );

      if (!sourceStore || !hostStore || !partnership) {
        return res.status(404).json({
          ok: false,
          error: "STORE_OR_PARTNERSHIP_NOT_FOUND",
        });
      }

      const actor = extractPartnerPicksActorFromRequest(req);
      const permCheck = evaluatePartnerPicksActorPermission({
        actor,
        targetStore: sourceStore,
        targetStoreProfile: db.partnerPicksProfiles?.[sourceStoreId],
        action: "PROPOSE_PLACEMENTS_AS_SOURCE",
      });

      if (!permCheck.allowed) {
        return res.status(403).json({
          ok: false,
          code: "PARTNER_PICKS_FORBIDDEN",
          error:
            permCheck.reason ||
            "Only the Source Store Owner or authorized Source Staff can propose placements for this store's products.",
        });
      }

      // Verify Source Merchant eligibility & product is in active shared list for this partnership
      const gate2 = evaluateGate2SourceMerchantEligibility({
        globalConfig,
        sourceStore,
        sourceProfile: db.partnerPicksProfiles?.[sourceStoreId],
        partnershipId,
        targetPartnerStoreId: hostStoreId,
        allPartnerships: db.partnerPicksPartnerships || [],
        channelId,
        productId,
      });

      if (!gate2.result.passed) {
        return res.status(403).json({
          ok: false,
          code: gate2.result.failureCode,
          error: gate2.result.reason,
        });
      }

      // Verify Live Product Integrity (Gate 6)
      const gate6 = evaluateGate6LiveProductIntegrity({
        sourceStore,
        productId,
      });
      if (!gate6.result.passed) {
        return res.status(400).json({
          ok: false,
          code: gate6.result.failureCode,
          error: gate6.result.reason,
        });
      }

      const nowIso = new Date().toISOString();
      const placementId =
        typeof req.body?.placementId === "string" && req.body.placementId.trim()
          ? req.body.placementId.trim()
          : `plc_${sourceStoreId}_${hostStoreId}_${channelId.toLowerCase()}_${Date.now()}`;

      const sanitizedOptions: PartnerPickProposedOption[] = proposedOptions.map(
        (opt, i) => ({
          optionId: String(opt.optionId || `opt_${i + 1}`),
          channelId,
          bannerSlotIndex:
            typeof opt.bannerSlotIndex === "number" ? opt.bannerSlotIndex : undefined,
          gridCoordinate:
            opt.gridCoordinate &&
            typeof opt.gridCoordinate.row === "number" &&
            typeof opt.gridCoordinate.col === "number"
              ? {
                  row: Math.floor(opt.gridCoordinate.row),
                  col: Math.floor(opt.gridCoordinate.col),
                }
              : undefined,
          discoverCarouselIndex:
            typeof opt.discoverCarouselIndex === "number"
              ? opt.discoverCarouselIndex
              : undefined,
          sequentialPositionHint:
            opt.sequentialPositionHint === "EARLY" ||
            opt.sequentialPositionHint === "MID_SEQUENCE" ||
            opt.sequentialPositionHint === "TAIL"
              ? opt.sequentialPositionHint
              : undefined,
          label: String(opt.label || `${channelId} Option #${i + 1}`).slice(0, 140),
        })
      );

      const placement: PartnerPickProductPlacement = {
        id: placementId,
        partnershipId,
        sourceStoreId: sourceStore.id,
        sourceStoreOwnerUid: sourceStore.ownerId,
        hostStoreId: hostStore.id,
        hostStoreOwnerUid: hostStore.ownerId,
        productId,
        channelId,
        proposedOptions: sanitizedOptions,
        selectedOptionId: null,
        selectedOption: null,
        hostSelectedAt: null,
        proposerFinalApproved: false,
        proposerFinalApprovedAt: null,
        trafficLight: "YELLOW",
        lifecycleState: "PROPOSED_AWAITING_HOST_SELECTION",
        activityHistory: [
          {
            id: `act_${Date.now()}`,
            timestamp: nowIso,
            actorStoreId: sourceStore.id,
            actorUid: actor?.id,
            actorRole: "SOURCE_MERCHANT",
            action: "PROPOSED_OPTIONS",
            note: `Proposed ${sanitizedOptions.length} option(s) for ${channelId}`,
          },
        ],
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const validation = validatePartnerPickPlacementRecord(placement);
      if (!validation.valid) {
        return res.status(400).json({ ok: false, error: validation.error });
      }

      if (!Array.isArray(db.partnerPicksPlacements)) db.partnerPicksPlacements = [];
      const firstOptId = sanitizedOptions[0]?.optionId;
      const existingSlotIdx =
        sanitizedOptions.length === 1 && firstOptId
          ? db.partnerPicksPlacements.findIndex(
              (p) =>
                p &&
                p.partnershipId === partnershipId &&
                p.sourceStoreId === sourceStore.id &&
                p.hostStoreId === hostStore.id &&
                p.channelId === channelId &&
                (p.selectedOptionId === firstOptId ||
                  (p.proposedOptions?.length === 1 &&
                    p.proposedOptions[0]?.optionId === firstOptId))
            )
          : -1;

      if (existingSlotIdx >= 0) {
        const prev = db.partnerPicksPlacements[existingSlotIdx];
        const updatedPlacement: PartnerPickProductPlacement = {
          ...placement,
          id: prev.id,
          createdAt: prev.createdAt || nowIso,
          activityHistory: [
            ...(prev.activityHistory || []),
            {
              id: `act_${Date.now()}`,
              timestamp: nowIso,
              actorStoreId: sourceStore.id,
              actorUid: actor?.id,
              actorRole: "SOURCE_MERCHANT",
              action: "PROPOSED_OPTIONS",
              note: `Placement changed to product ${productId} (${sanitizedOptions[0]?.label || channelId})`,
            },
          ],
        };
        db.partnerPicksPlacements[existingSlotIdx] = updatedPlacement;
        await saveDatabase(db);
        return res.status(200).json({
          ok: true,
          placement: updatedPlacement,
        });
      }

      db.partnerPicksPlacements.push(placement);
      await saveDatabase(db);

      return res.status(201).json({
        ok: true,
        placement,
      });
    } catch {
      return res.status(500).json({
        ok: false,
        error: "FAILED_TO_PROPOSE_PLACEMENT",
      });
    }
  });

  // 6. POST /api/partner-picks/placements/:placementId/host-select (Step 2 of Two-Sided Placement Approval)
  app.post(
    "/api/partner-picks/placements/:placementId/host-select",
    async (req: Request, res: Response) => {
      try {
        const placementId = String(req.params.placementId || "").trim();
        const decision = String(req.body?.decision || "SELECT")
          .trim()
          .toUpperCase(); // SELECT | REJECT
        const selectedOptionId =
          typeof req.body?.selectedOptionId === "string"
            ? req.body.selectedOptionId.trim()
            : null;

        const db = await loadDatabase();
        const placements = db.partnerPicksPlacements || [];
        const idx = placements.findIndex((p) => p && p.id === placementId);
        if (idx < 0) {
          return res.status(404).json({ ok: false, error: "PLACEMENT_NOT_FOUND" });
        }

        const placement = placements[idx];
        const hostStore = (db.stores || []).find(
          (s) => s && s.id === placement.hostStoreId
        );
        if (!hostStore) {
          return res.status(404).json({ ok: false, error: "HOST_STORE_NOT_FOUND" });
        }

        const actor = extractPartnerPicksActorFromRequest(req);
        const permCheck = evaluatePartnerPicksActorPermission({
          actor,
          targetStore: hostStore,
          targetStoreProfile: db.partnerPicksProfiles?.[hostStore.id],
          action: "SELECT_OR_REJECT_PLACEMENTS_AS_HOST",
        });

        if (!permCheck.allowed) {
          return res.status(403).json({
            ok: false,
            code: "PARTNER_PICKS_FORBIDDEN",
            error:
              permCheck.reason ||
              "Only the Host Store Owner or authorized Host Staff can select or reject proposed placements on this storefront.",
          });
        }

        const nowIso = new Date().toISOString();

        if (decision === "REJECT") {
          placement.selectedOptionId = null;
          placement.selectedOption = null;
          placement.proposerFinalApproved = false;
          placement.lifecycleState = "REJECTED_BY_HOST";
          placement.trafficLight = resolveTrafficLightForPlacementState("REJECTED_BY_HOST");
          placement.activityHistory = [
            ...(placement.activityHistory || []),
            {
              id: `act_${Date.now()}`,
              timestamp: nowIso,
              actorStoreId: hostStore.id,
              actorUid: actor?.id,
              actorRole: "HOST_MERCHANT",
              action: "REJECTED_BY_HOST",
              note: String(req.body?.note || "Rejected by host merchant").slice(0, 240),
            },
          ];
          placement.updatedAt = nowIso;
          placements[idx] = placement;
          await saveDatabase(db);
          return res.json({ ok: true, placement });
        }

        // Enforce Two-Sided Approval Invariant: Host can select ONLY from options proposed by Source Merchant
        const matchingOption = (placement.proposedOptions || []).find(
          (opt) => opt && opt.optionId === selectedOptionId
        );
        if (!selectedOptionId || !matchingOption) {
          return res.status(400).json({
            ok: false,
            code: "UNPROPOSED_PLACEMENT_OPTION",
            error:
              "Host merchant may only select an option from the positions proposed by the source merchant.",
          });
        }

        placement.selectedOptionId = matchingOption.optionId;
        placement.selectedOption = matchingOption;
        placement.hostSelectedAt = nowIso;
        // Selection returns to Source Merchant A for final approval (still YELLOW until A confirms)
        placement.proposerFinalApproved = false;
        placement.lifecycleState = "HOST_SELECTED_AWAITING_FINAL_APPROVAL";
        placement.trafficLight = resolveTrafficLightForPlacementState(
          "HOST_SELECTED_AWAITING_FINAL_APPROVAL"
        );
        placement.activityHistory = [
          ...(placement.activityHistory || []),
          {
            id: `act_${Date.now()}`,
            timestamp: nowIso,
            actorStoreId: hostStore.id,
            actorUid: actor?.id,
            actorRole: "HOST_MERCHANT",
            action: "HOST_SELECTED_OPTION",
            selectedOptionId: matchingOption.optionId,
            note: `Host selected ${matchingOption.label} — returned to proposer for final confirmation`,
          },
        ];
        placement.updatedAt = nowIso;

        placements[idx] = placement;
        await saveDatabase(db);

        return res.json({
          ok: true,
          placement,
        });
      } catch {
        return res.status(500).json({
          ok: false,
          error: "FAILED_TO_SELECT_HOST_PLACEMENT",
        });
      }
    }
  );

  // 7. POST /api/partner-picks/placements/:placementId/proposer-confirm (Step 3 of Two-Sided Placement Approval -> GREEN)
  app.post(
    "/api/partner-picks/placements/:placementId/proposer-confirm",
    async (req: Request, res: Response) => {
      try {
        const placementId = String(req.params.placementId || "").trim();
        const decision = String(req.body?.decision || "APPROVE")
          .trim()
          .toUpperCase(); // APPROVE | REJECT

        const db = await loadDatabase();
        const placements = db.partnerPicksPlacements || [];
        const idx = placements.findIndex((p) => p && p.id === placementId);
        if (idx < 0) {
          return res.status(404).json({ ok: false, error: "PLACEMENT_NOT_FOUND" });
        }

        const placement = placements[idx];
        const sourceStore = (db.stores || []).find(
          (s) => s && s.id === placement.sourceStoreId
        );
        const hostStore = (db.stores || []).find(
          (s) => s && s.id === placement.hostStoreId
        );
        if (!sourceStore || !hostStore) {
          return res.status(404).json({ ok: false, error: "STORE_NOT_FOUND" });
        }

        const actor = extractPartnerPicksActorFromRequest(req);
        const permCheck = evaluatePartnerPicksActorPermission({
          actor,
          targetStore: sourceStore,
          targetStoreProfile: db.partnerPicksProfiles?.[sourceStore.id],
          action: "FINAL_APPROVE_PLACEMENTS_AS_SOURCE",
        });

        if (!permCheck.allowed) {
          return res.status(403).json({
            ok: false,
            code: "PARTNER_PICKS_FORBIDDEN",
            error:
              permCheck.reason ||
              "Only the Source Store Owner or authorized Source Staff can grant final placement approval.",
          });
        }

        const nowIso = new Date().toISOString();

        if (decision === "REJECT") {
          placement.proposerFinalApproved = false;
          placement.lifecycleState = "REJECTED_BY_PROPOSER";
          placement.trafficLight = resolveTrafficLightForPlacementState(
            "REJECTED_BY_PROPOSER"
          );
          placement.activityHistory = [
            ...(placement.activityHistory || []),
            {
              id: `act_${Date.now()}`,
              timestamp: nowIso,
              actorStoreId: sourceStore.id,
              actorUid: actor?.id,
              actorRole: "SOURCE_MERCHANT",
              action: "REJECTED_BY_PROPOSER",
              note: String(req.body?.note || "Withdrawn/rejected by proposer").slice(0, 240),
            },
          ];
          placement.updatedAt = nowIso;
          placements[idx] = placement;
          await saveDatabase(db);
          return res.json({ ok: true, placement });
        }

        if (!placement.selectedOptionId) {
          return res.status(400).json({
            ok: false,
            code: "HOST_SELECTION_REQUIRED_BEFORE_FINAL_APPROVAL",
            error:
              "Cannot finalize placement approval before the host merchant selects a proposed option.",
          });
        }

        const matchingOption = (placement.proposedOptions || []).find(
          (opt) => opt && opt.optionId === placement.selectedOptionId
        );
        if (!matchingOption) {
          return res.status(400).json({
            ok: false,
            code: "UNPROPOSED_PLACEMENT_OPTION",
            error: "Selected option is not in the proposed options list.",
          });
        }

        const candidateLivePlacement: PartnerPickProductPlacement = {
          ...placement,
          proposerFinalApproved: true,
          proposerFinalApprovedAt: nowIso,
          lifecycleState: "APPROVED_LIVE",
          trafficLight: "GREEN",
          updatedAt: nowIso,
        };

        const partnership = (db.partnerPicksPartnerships || []).find(
          (p) => p && p.id === placement.partnershipId
        );
        const bilatEval = evaluateBilateralPlacementEligibility({
          globalConfig: db.partnerPicksConfig,
          channelId: placement.channelId,
          sourceStore,
          hostStore,
          sourceProfile: db.partnerPicksProfiles?.[sourceStore.id],
          hostProfile: db.partnerPicksProfiles?.[hostStore.id],
          partnership,
          allPartnerships: db.partnerPicksPartnerships || [],
          placement: candidateLivePlacement,
        });

        if (!bilatEval.eligible) {
          return res.status(400).json({
            ok: false,
            code: bilatEval.failureCode || "PLACEMENT_ELIGIBILITY_FAILED",
            error:
              bilatEval.failureReason ||
              "Placement cannot transition to APPROVED_LIVE due to an unmet bilateral eligibility gate.",
          });
        }

        candidateLivePlacement.activityHistory = [
          ...(placement.activityHistory || []),
          {
            id: `act_${Date.now()}`,
            timestamp: nowIso,
            actorStoreId: sourceStore.id,
            actorUid: actor?.id,
            actorRole: "SOURCE_MERCHANT",
            action: "PROPOSER_FINAL_APPROVED",
            selectedOptionId: placement.selectedOptionId,
            note: `Final approval confirmed by proposer (${matchingOption.label}) — Placement is now GREEN & Live`,
          },
        ];

        placements[idx] = candidateLivePlacement;
        await saveDatabase(db);

        return res.json({
          ok: true,
          placement: candidateLivePlacement,
        });
      } catch {
        return res.status(500).json({
          ok: false,
          error: "FAILED_TO_CONFIRM_PLACEMENT",
        });
      }
    }
  );

  // 7b. DELETE /api/partner-picks/placements/:placementId (Remove product from placement card slot)
  app.delete(
    "/api/partner-picks/placements/:placementId",
    async (req: Request, res: Response) => {
      try {
        const placementId = String(req.params.placementId || "").trim();
        const db = await loadDatabase();
        const placements = db.partnerPicksPlacements || [];
        const idx = placements.findIndex((p) => p && p.id === placementId);
        if (idx < 0) {
          return res.status(404).json({ ok: false, error: "PLACEMENT_NOT_FOUND" });
        }

        const placement = placements[idx];
        const sourceStore = (db.stores || []).find(
          (s) => s && s.id === placement.sourceStoreId
        );
        const hostStore = (db.stores || []).find(
          (s) => s && s.id === placement.hostStoreId
        );

        const actor = extractPartnerPicksActorFromRequest(req);
        const canRemoveAsSource = sourceStore
          ? evaluatePartnerPicksActorPermission({
              actor,
              targetStore: sourceStore,
              targetStoreProfile: db.partnerPicksProfiles?.[sourceStore.id],
              action: "PROPOSE_PLACEMENTS_AS_SOURCE",
            }).allowed
          : false;
        const canRemoveAsHost = hostStore
          ? evaluatePartnerPicksActorPermission({
              actor,
              targetStore: hostStore,
              targetStoreProfile: db.partnerPicksProfiles?.[hostStore.id],
              action: "SELECT_OR_REJECT_PLACEMENTS_AS_HOST",
            }).allowed
          : false;

        if (!canRemoveAsSource && !canRemoveAsHost) {
          return res.status(403).json({
            ok: false,
            code: "PARTNER_PICKS_FORBIDDEN",
            error: "Only the Source or Host Store may remove this placement.",
          });
        }

        placements.splice(idx, 1);
        db.partnerPicksPlacements = placements;
        await saveDatabase(db);

        return res.json({
          ok: true,
          removedPlacementId: placementId,
        });
      } catch {
        return res.status(500).json({
          ok: false,
          error: "FAILED_TO_REMOVE_PLACEMENT",
        });
      }
    }
  );

  // 8. POST /api/partner-picks/source-catalog/:storeId/product/:productId
  // Strictly enforces that ONLY the Source Store Owner (or authorized catalog staff) can mutate their product catalog
  // (403 Forbidden for partner merchants) and immediately reconciles the 6-State Live Product Availability Model.
  app.post(
    "/api/partner-picks/source-catalog/:storeId/product/:productId",
    async (req: Request, res: Response) => {
      try {
        const storeId = String(req.params.storeId || "").trim();
        const productId = String(req.params.productId || "").trim();

        const db = await loadDatabase();
        const targetStore = (db.stores || []).find((s) => s && s.id === storeId);
        if (!targetStore) {
          return res.status(404).json({ ok: false, error: "STORE_NOT_FOUND" });
        }

        const actor = extractPartnerPicksActorFromRequest(req);
        const permCheck = evaluatePartnerPicksActorPermission({
          actor,
          targetStore,
          targetStoreProfile: db.partnerPicksProfiles?.[storeId],
          action: "MODIFY_SOURCE_PRODUCT_CATALOG",
        });

        if (!permCheck.allowed) {
          return res.status(403).json({
            ok: false,
            code: "CROSS_STORE_CATALOG_MUTATION_FORBIDDEN",
            error:
              permCheck.reason ||
              "Partner stores cannot modify, price, restock, hide, or delete another merchant's product catalog.",
          });
        }

        const prodIdx = (targetStore.products || []).findIndex(
          (p) => p && p.id === productId
        );
        if (prodIdx < 0) {
          return res.status(404).json({ ok: false, error: "PRODUCT_NOT_FOUND" });
        }

        const product = targetStore.products[prodIdx];
        const updates = req.body?.updates || {};

        if (updates.removeProduct === true) {
          targetStore.products.splice(prodIdx, 1);
        } else {
          if (typeof updates.stock === "number") {
            product.stock = Math.max(0, Math.floor(updates.stock));
          }
          if (typeof updates.price === "number" && updates.price >= 0) {
            product.price = updates.price;
          }
          if (typeof updates.isVisible === "boolean") {
            product.isVisible = updates.isVisible;
          }
          if (updates.status === "active" || updates.status === "draft") {
            product.status = updates.status;
          }
          if (typeof updates.archived === "boolean") {
            (product as unknown as Record<string, unknown>).archived =
              updates.archived;
          }
          targetStore.products[prodIdx] = product;
        }

        const reconciliation = reconcilePartnerPickPlacementsInDb(db);
        await saveDatabase(db);

        return res.json({
          ok: true,
          reconciledTransitions: reconciliation.transitions,
          placements: (db.partnerPicksPlacements || []).filter(
            (pl) => pl && pl.sourceStoreId === storeId && pl.productId === productId
          ),
        });
      } catch {
        return res.status(500).json({
          ok: false,
          error: "FAILED_TO_UPDATE_SOURCE_PRODUCT_AND_RECONCILE",
        });
      }
    }
  );

  // 9. POST /api/partner-picks/analytics/batch
  // Dedicated cross-store Partner Picks analytics endpoint with idempotencyKey deduplication
  // and strict per-channel separation (never colliding with single-store checks in server/storesLifecycleAndAnalytics.ts).
  app.post("/api/partner-picks/analytics/batch", async (req: Request, res: Response) => {
    try {
      const rawEvents: Partial<PartnerPicksChannelAnalyticsEvent>[] = Array.isArray(
        req.body?.events
      )
        ? req.body.events
        : req.body?.event
        ? [req.body.event]
        : [];

      if (rawEvents.length === 0) {
        return res.status(400).json({ ok: false, error: "EMPTY_ANALYTICS_BATCH" });
      }

      const db = await loadDatabase();
      if (!Array.isArray(db.partnerPicksAnalyticsEvents)) {
        db.partnerPicksAnalyticsEvents = [];
      }
      if (!db.partnerPicksExposureLedger) {
        db.partnerPicksExposureLedger = {};
      }

      const existingIdempotencyKeys = new Set(
        db.partnerPicksAnalyticsEvents.map((e) => e?.idempotencyKey).filter(Boolean)
      );

      let ingestedCount = 0;
      let deduplicatedCount = 0;
      const nowIso = new Date().toISOString();

      for (const rawEv of rawEvents.slice(0, 100)) {
        const candidate: PartnerPicksChannelAnalyticsEvent = {
          id:
            typeof rawEv.id === "string" && rawEv.id.trim()
              ? rawEv.id.trim()
              : `ppevt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          idempotencyKey: String(rawEv.idempotencyKey || "").trim(),
          partnershipId: String(rawEv.partnershipId || "").trim(),
          placementId: String(rawEv.placementId || "").trim(),
          hostStoreId: String(rawEv.hostStoreId || "").trim(),
          sourceStoreId: String(rawEv.sourceStoreId || "").trim(),
          channelId: rawEv.channelId as PartnerPickChannelId,
          productId: String(rawEv.productId || "").trim(),
          eventType: rawEv.eventType || "impression",
          visitorHash: String(rawEv.visitorHash || "anon_visitor").slice(0, 128),
          rotationEpoch:
            typeof rawEv.rotationEpoch === "number" ? rawEv.rotationEpoch : 0,
          exposureDurationMs:
            typeof rawEv.exposureDurationMs === "number"
              ? rawEv.exposureDurationMs
              : undefined,
          timestamp:
            typeof rawEv.timestamp === "string" && rawEv.timestamp.trim()
              ? rawEv.timestamp
              : nowIso,
        };

        const validation = validatePartnerPicksAnalyticsEvent(candidate);
        if (!validation.valid) {
          continue;
        }

        if (existingIdempotencyKeys.has(candidate.idempotencyKey)) {
          deduplicatedCount += 1;
          continue;
        }

        const partnership = (db.partnerPicksPartnerships || []).find(
          (p) => p && p.id === candidate.partnershipId
        );
        if (!partnership) continue;

        // Check if this visitorHash is unique for this direction
        const isUniqueVisitorForDirection = !db.partnerPicksAnalyticsEvents.some(
          (prev) =>
            prev &&
            prev.partnershipId === candidate.partnershipId &&
            prev.sourceStoreId === candidate.sourceStoreId &&
            prev.hostStoreId === candidate.hostStoreId &&
            prev.eventType === "impression" &&
            prev.visitorHash === candidate.visitorHash
        );

        existingIdempotencyKeys.add(candidate.idempotencyKey);
        db.partnerPicksAnalyticsEvents.push(candidate);
        ingestedCount += 1;

        db.partnerPicksExposureLedger[partnership.id] =
          recordEventInBidirectionalExposureLedger({
            ledger: db.partnerPicksExposureLedger[partnership.id],
            partnership,
            event: candidate,
            globalConfig: db.partnerPicksConfig,
            isUniqueVisitorForDirection,
            nowIso,
          });
      }

      if (ingestedCount > 0) {
        await saveDatabase(db);
      }

      return res.json({
        ok: true,
        ingestedCount,
        deduplicatedCount,
        analyticsBreakdownByChannel: computePerChannelAnalyticsBreakdown(
          db.partnerPicksAnalyticsEvents
        ),
      });
    } catch {
      return res.status(500).json({
        ok: false,
        error: "FAILED_TO_INGEST_PARTNER_PICKS_ANALYTICS",
      });
    }
  });

  // 10. PUT /api/admin/partner-picks/config
  app.put("/api/admin/partner-picks/config", async (req: Request, res: Response) => {
    try {
      const db = await loadDatabase();
      const auth = authorizeAdminRequest(req, db, {
        module: "stores",
        action: "edit",
      });
      if (!auth.allowed) {
        return res
          .status(auth.status)
          .json({ ok: false, code: auth.errorCode, error: auth.reason });
      }

      const actor = auth.adminAccount || DEFAULT_SERVER_ADMINS[0];
      const previousConfig = normalizePartnerPicksGlobalConfig(db.partnerPicksConfig);
      const mergedRaw: Partial<PartnerPicksGlobalConfig> = {
        ...previousConfig,
        ...(req.body?.config || req.body || {}),
        updatedAt: new Date().toISOString(),
        updatedByAdminId: actor.uid || actor.email || "super_admin",
      };

      const nextConfig = normalizePartnerPicksGlobalConfig(mergedRaw);
      db.partnerPicksConfig = nextConfig;

      appendServerAuditLog(db, {
        actorId: actor.uid,
        actorName: actor.fullName || actor.email,
        actorEmail: actor.email,
        actorRole: actor.roleId,
        actionType: "PARTNER_PICKS_GLOBAL_CONFIG_UPDATED",
        targetType: "system",
        targetId: "partner_picks_config_global",
        targetName: "Partner Picks Global & 5-Channel Governance",
        reason: String(
          req.body?.reason ||
            `Updated Partner Picks config (featureEnabled=${nextConfig.featureEnabled}, maxSimultaneousPartnerStores=${nextConfig.maxSimultaneousPartnerStores})`
        ),
      });

      await saveDatabase(db);

      return res.json({
        ok: true,
        globalConfig: nextConfig,
      });
    } catch {
      return res.status(500).json({
        ok: false,
        error: "FAILED_TO_UPDATE_ADMIN_PARTNER_PICKS_CONFIG",
      });
    }
  });

  // 11. POST /api/admin/partner-picks/governance (Admin Suspend / Reinstate Partnership or Placement)
  app.post(
    "/api/admin/partner-picks/governance",
    async (req: Request, res: Response) => {
      try {
        const db = await loadDatabase();
        const auth = authorizeAdminRequest(req, db, {
          module: "stores",
          action: "suspend",
        });
        if (!auth.allowed) {
          return res
            .status(auth.status)
            .json({ ok: false, code: auth.errorCode, error: auth.reason });
        }

        const actor = auth.adminAccount || DEFAULT_SERVER_ADMINS[0];
        const targetType = String(req.body?.targetType || "").trim(); // "partnership" | "placement"
        const targetId = String(req.body?.targetId || "").trim();
        const action = String(req.body?.action || "").trim().toUpperCase(); // "SUSPEND" | "REINSTATE"
        const reason = String(
          req.body?.reason || "Platform Admin Partner Picks governance action"
        ).slice(0, 300);
        const nowIso = new Date().toISOString();

        if (targetType === "partnership") {
          const partnerships = db.partnerPicksPartnerships || [];
          const idx = partnerships.findIndex((p) => p && p.id === targetId);
          if (idx < 0) {
            return res.status(404).json({ ok: false, error: "PARTNERSHIP_NOT_FOUND" });
          }
          const part = partnerships[idx];
          if (action === "SUSPEND") {
            part.previousStatusBeforeSuspension =
              part.status !== "SUSPENDED" ? part.status : part.previousStatusBeforeSuspension || "ACTIVE";
            part.status = "SUSPENDED";
            part.suspendedByAdminId = actor.uid || actor.email;
            part.suspendedReason = reason;
            part.updatedAt = nowIso;
          } else if (action === "REINSTATE") {
            part.status = part.previousStatusBeforeSuspension || "ACTIVE";
            part.suspendedByAdminId = null;
            part.suspendedReason = null;
            part.previousStatusBeforeSuspension = null;
            part.updatedAt = nowIso;
          } else {
            return res.status(400).json({ ok: false, error: "INVALID_GOVERNANCE_ACTION" });
          }
          partnerships[idx] = part;
        } else if (targetType === "placement") {
          const placements = db.partnerPicksPlacements || [];
          const idx = placements.findIndex((p) => p && p.id === targetId);
          if (idx < 0) {
            return res.status(404).json({ ok: false, error: "PLACEMENT_NOT_FOUND" });
          }
          const pl = placements[idx];
          if (action === "SUSPEND") {
            pl.lifecycleState = "SUSPENDED_BY_PLATFORM_ADMIN";
            pl.trafficLight = "RED";
            pl.activityHistory = [
              ...(pl.activityHistory || []),
              {
                id: `act_${Date.now()}`,
                timestamp: nowIso,
                actorStoreId: "platform_admin",
                actorUid: actor.uid,
                actorRole: "PLATFORM_ADMIN",
                action: "SUSPENDED_BY_ADMIN",
                note: reason,
              },
            ];
            pl.updatedAt = nowIso;
          } else if (action === "REINSTATE") {
            const hasTwoSided =
              Boolean(pl.selectedOptionId) && pl.proposerFinalApproved === true;
            pl.lifecycleState = hasTwoSided
              ? "APPROVED_LIVE"
              : "PROPOSED_AWAITING_HOST_SELECTION";
            pl.trafficLight = resolveTrafficLightForPlacementState(pl.lifecycleState);
            pl.activityHistory = [
              ...(pl.activityHistory || []),
              {
                id: `act_${Date.now()}`,
                timestamp: nowIso,
                actorStoreId: "platform_admin",
                actorUid: actor.uid,
                actorRole: "PLATFORM_ADMIN",
                action: "REINSTATED_BY_ADMIN",
                note: reason,
              },
            ];
            pl.updatedAt = nowIso;
          } else {
            return res.status(400).json({ ok: false, error: "INVALID_GOVERNANCE_ACTION" });
          }
          placements[idx] = pl;
        } else {
          return res.status(400).json({ ok: false, error: "INVALID_TARGET_TYPE" });
        }

        appendServerAuditLog(db, {
          actorId: actor.uid,
          actorName: actor.fullName || actor.email,
          actorEmail: actor.email,
          actorRole: actor.roleId,
          actionType: `PARTNER_PICKS_${targetType.toUpperCase()}_${action}`,
          targetType: "store",
          targetId,
          targetName: `Partner Picks ${targetType} ${targetId}`,
          reason,
        });

        await saveDatabase(db);

        return res.json({
          ok: true,
          partnerships: db.partnerPicksPartnerships || [],
          placements: db.partnerPicksPlacements || [],
        });
      } catch {
        return res.status(500).json({
          ok: false,
          error: "FAILED_TO_EXECUTE_PARTNER_PICKS_GOVERNANCE",
        });
      }
    }
  );
}
