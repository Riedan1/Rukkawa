import test from "node:test";
import assert from "node:assert/strict";
import {
  verifyStrictStoreOwnership,
  resolveMerchantOwnedStoreIds,
  canUserManageStoreStories,
  getStoreMoreOptionsMenuItems,
  getPartnerPicksMenuLabel,
  resolvePartnerPicksEntryPoint,
  normalizeStoreDockSettings,
  formatPublicFollowerCountDisplay,
  isPublicStoreNavigationTabAllowed,
  sanitizePublicStoreForVisitor,
  calculateMuteExpiration,
  isStoreCurrentlyMuted,
  shouldDeliverStoreNotification,
  evaluateStoreBlockRestrictions,
  extractRealStoreDetailsData,
  buildStoreShareAction,
  createStoreReportSubmission,
  computeReportsCenterKpis,
  filterAndSortStoreReports,
  applyAdminReportUpdate,
} from "./storeMoreOptionsLogic";

test("Strict Owner Verification allows exclusively the actual Store Owner and rejects store admins, team members, moderators, guests, and platform admins", () => {
  const sampleStore: any = {
    id: "store-1",
    name: "Atlas Heritage",
    ownerEmail: "owner@atlas.dz",
    ownerId: "uid-owner-1",
    teamMembers: [
      { id: "tm-1", email: "admin@atlas.dz", role: "store_admin", status: "active" },
      { id: "tm-2", email: "mod@atlas.dz", role: "moderator", status: "active" },
      { id: "tm-3", email: "emp@atlas.dz", role: "employee", status: "active" },
    ],
  };

  // 1. Actual store owner
  const ownerRes = verifyStrictStoreOwnership({
    user: { id: "uid-owner-1", email: "owner@atlas.dz", role: "Merchant", ownedStoreIds: ["store-1"] },
    targetStore: sampleStore,
    activeStaffMemberId: null,
  });
  assert.equal(ownerRes.allowed, true);
  assert.equal(ownerRes.statusCode, 200);

  // 2. Store Administrator (must be rejected)
  const adminRes = verifyStrictStoreOwnership({
    user: { id: "tm-1", email: "admin@atlas.dz", role: "Merchant", storeName: "Atlas Heritage" },
    targetStore: sampleStore,
    activeStaffMemberId: null,
  });
  assert.equal(adminRes.allowed, false);
  assert.equal(adminRes.statusCode, 403);

  // 3. Active staff member session on owner account (must be rejected)
  const staffSessionRes = verifyStrictStoreOwnership({
    user: { id: "uid-owner-1", email: "owner@atlas.dz", role: "Merchant", ownedStoreIds: ["store-1"] },
    targetStore: sampleStore,
    activeStaffMemberId: "tm-1",
  });
  assert.equal(staffSessionRes.allowed, false);
  assert.equal(staffSessionRes.statusCode, 403);

  // 4. Guest visitor (must be rejected with 401)
  const guestRes = verifyStrictStoreOwnership({
    user: null,
    targetStore: sampleStore,
  });
  assert.equal(guestRes.allowed, false);
  assert.equal(guestRes.statusCode, 401);

  // 5. External Platform Admin who is not the store owner (must be rejected with 403)
  const platformAdminRes = verifyStrictStoreOwnership({
    user: { id: "root-admin", email: "admin@yume.dz", role: "PlatformAdmin" },
    targetStore: sampleStore,
  });
  assert.equal(platformAdminRes.allowed, false);
  assert.equal(platformAdminRes.statusCode, 403);
});

test("More Options menu enforces exact 9-item ordering with Partner Picks at slot #2 and owner-only Dock Settings visibility", () => {
  const visitorMenu = getStoreMoreOptionsMenuItems({
    isStrictOwner: false,
    isMuted: false,
    isBlocked: false,
  });

  // Visitor sees 8 items (Dock Settings is hidden)
  assert.deepEqual(
    visitorMenu.map((i) => i.label),
    [
      "Share Store",
      "Partner Picks",
      "Collab",
      "Mute Store",
      "Store Details",
      "Generate QR Code",
      "Report Store",
      "Block Store",
    ]
  );

  // Partner Picks is strictly at slot #2 (order: 2) directly between Share Store and Collab
  const partnerPicksItem = visitorMenu.find((i) => i.id === "partner_picks");
  assert.ok(partnerPicksItem);
  assert.equal(partnerPicksItem.order, 2);
  const partnerPicksIdx = visitorMenu.findIndex((i) => i.id === "partner_picks");
  const collabIdx = visitorMenu.findIndex((i) => i.id === "collab");
  assert.equal(partnerPicksIdx, 1);
  assert.equal(collabIdx, partnerPicksIdx + 1);

  // Owner sees Dock Settings at position #5 (index 4) and cannot Report/Block own store
  const ownerMenu = getStoreMoreOptionsMenuItems({
    isStrictOwner: true,
    isMuted: true,
    remainingMuteLabel: "7h 59m left",
    isBlocked: false,
  });
  assert.deepEqual(
    ownerMenu.map((i) => i.label),
    [
      "Share Store",
      "Partner Picks",
      "Collab",
      "Unmute Store",
      "Dock Settings",
      "Store Details",
      "Generate QR Code",
    ]
  );
});

test("Partner Picks More Options label supports English, French, and Arabic while preserving order: 2", () => {
  assert.equal(getPartnerPicksMenuLabel("en"), "Partner Picks");
  assert.equal(getPartnerPicksMenuLabel("fr"), "Sélections Partenaires");
  assert.equal(getPartnerPicksMenuLabel("ar"), "مختارات الشركاء");
  assert.equal(getPartnerPicksMenuLabel(undefined), "Partner Picks");

  const frMenu = getStoreMoreOptionsMenuItems({
    isStrictOwner: false,
    isMuted: false,
    isBlocked: false,
    language: "fr",
  });
  assert.equal(frMenu[1].id, "partner_picks");
  assert.equal(frMenu[1].order, 2);
  assert.equal(frMenu[1].label, "Sélections Partenaires");

  const arMenu = getStoreMoreOptionsMenuItems({
    isStrictOwner: false,
    isMuted: false,
    isBlocked: false,
    language: "ar",
  });
  assert.equal(arMenu[1].id, "partner_picks");
  assert.equal(arMenu[1].order, 2);
  assert.equal(arMenu[1].label, "مختارات الشركاء");
});

test("Partner Picks entry point resolver routes Store Owner, Merchant Visitor, and Guest accurately in EN/FR/AR", () => {
  const ownerCtx = resolvePartnerPicksEntryPoint({
    storeId: "store-1",
    storeName: "Casbah Atelier",
    isStrictOwner: true,
    isAuthenticated: true,
    isMerchantVisitor: true,
    language: "en",
  });
  assert.equal(ownerCtx.entryFlow, "merchant_workspace");
  assert.equal(ownerCtx.localizedTitle, "Partner Picks");

  const merchantVisitorCtx = resolvePartnerPicksEntryPoint({
    storeId: "store-2",
    storeName: "Aurès Crafts",
    isStrictOwner: false,
    isAuthenticated: true,
    isMerchantVisitor: true,
    language: "fr",
  });
  assert.equal(merchantVisitorCtx.entryFlow, "partnership_request");
  assert.equal(merchantVisitorCtx.localizedTitle, "Sélections Partenaires");

  const guestCtx = resolvePartnerPicksEntryPoint({
    storeId: "store-2",
    storeName: "Aurès Crafts",
    isStrictOwner: false,
    isAuthenticated: false,
    isMerchantVisitor: false,
    language: "ar",
  });
  assert.equal(guestCtx.entryFlow, "visitor_info");
  assert.equal(guestCtx.localizedTitle, "مختارات الشركاء");
});

test("Dock Settings normalization forces Products tab to always remain visible and sanitizes public store payload", () => {
  const settings = normalizeStoreDockSettings({
    appearance: {
      buttonScale: 1.25,
      spacingPreset: "large",
      theme: "obsidian",
    },
    visibility: {
      followerCountMode: "hidden_label",
      showStoreLocation: false,
      navigation: {
        products: false, // Attempt to hide products
        reels: false,
        reviews: false,
        deals: true,
      },
    },
  });

  // Products MUST remain true even when false was passed
  assert.equal(settings.visibility.navigation.products, true);
  assert.equal(isPublicStoreNavigationTabAllowed("products", settings), true);
  assert.equal(isPublicStoreNavigationTabAllowed("reels", settings), false);
  assert.equal(isPublicStoreNavigationTabAllowed("reviews", settings), false);
  assert.equal(isPublicStoreNavigationTabAllowed("deals", settings), true);

  // Follower count modes
  assert.equal(formatPublicFollowerCountDisplay(12500, "actual").labelText, "12.5K Followers");
  assert.equal(formatPublicFollowerCountDisplay(12500, "icon_only").labelText, "");
  assert.equal(formatPublicFollowerCountDisplay(12500, "hidden_label").labelText, "Not Available");

  // Public sanitizer strips location & followers when hidden for non-owner visitors
  const rawStore = {
    id: "store-1",
    name: "Atlas",
    address: "12 Rue Didouche Mourad",
    wilaya: "Alger",
    coordinates: { lat: 36.75, lng: 3.05 },
    followersCount: 420,
    apiKey: "secret-key",
    designSettings: { dockSettings: settings },
  };

  const sanitizedVisitor = sanitizePublicStoreForVisitor(rawStore, false);
  assert.equal(sanitizedVisitor.address, "");
  assert.equal(sanitizedVisitor.coordinates, null);
  assert.equal(sanitizedVisitor.followersCount, null);
  assert.equal(sanitizedVisitor.apiKey, undefined);

  const sanitizedOwner = sanitizePublicStoreForVisitor(rawStore, true);
  assert.equal(sanitizedOwner.address, "12 Rue Didouche Mourad");
  assert.equal(sanitizedOwner.followersCount, 420);
});

test("Telegram-style Mute Store calculates presets and custom durations and preserves transactional notifications", () => {
  const baseNow = Date.parse("2026-11-19T10:00:00.000Z");

  const customCalc = calculateMuteExpiration(
    "custom",
    { days: 3, hours: 5, minutes: 30 },
    baseNow
  );
  assert.equal(customCalc.durationLabel, "3 Days, 5 Hours, 30 Minutes");
  const expectedMs = baseNow + (3 * 24 * 60 + 5 * 60 + 30) * 60 * 1000;
  assert.equal(Date.parse(customCalc.expiresAt!), expectedMs);

  const muteRec = {
    storeId: "store-1",
    mutedAt: new Date(baseNow).toISOString(),
    expiresAt: customCalc.expiresAt,
    presetId: "custom" as const,
    durationLabel: customCalc.durationLabel,
  };

  // Active before expiry, inactive after expiry
  assert.equal(isStoreCurrentlyMuted(muteRec, baseNow + 1000), true);
  assert.equal(isStoreCurrentlyMuted(muteRec, expectedMs + 1), false);

  // Notification filtering while muted
  assert.equal(
    shouldDeliverStoreNotification({ category: "new_story", isMuted: true, isBlocked: false }),
    false
  );
  assert.equal(
    shouldDeliverStoreNotification({ category: "new_offer", isMuted: true, isBlocked: false }),
    false
  );
  assert.equal(
    shouldDeliverStoreNotification({ category: "direct_message", isMuted: true, isBlocked: false }),
    true
  );
  assert.equal(
    shouldDeliverStoreNotification({ category: "order_confirmation", isMuted: true, isBlocked: false }),
    true
  );
  assert.equal(
    shouldDeliverStoreNotification({ category: "shipping", isMuted: true, isBlocked: false }),
    true
  );
  assert.equal(
    shouldDeliverStoreNotification({ category: "payment", isMuted: true, isBlocked: false }),
    true
  );
});

test("One-sided Block Store restricts new interactions while preserving order and message history", () => {
  const blockedState = evaluateStoreBlockRestrictions(true);
  assert.equal(blockedState.canSendNewMessages, false);
  assert.equal(blockedState.canPlaceNewOrders, false);
  assert.equal(blockedState.canViewPromotionalContent, false);
  assert.equal(blockedState.canAccessExistingOrders, true);
  assert.equal(blockedState.canAccessPreviousMessages, true);
  assert.equal(blockedState.canAccessTransactionHistory, true);
});

test("Real Store Details extractor uses actual merchant data and respects Store Location Visibility", () => {
  const store: any = {
    id: "st-99",
    name: "Casbah Crafts",
    logo: "https://example.com/logo.png",
    bio: "Handmade Algerian copperware",
    description: "Family workshop since 1984",
    wilaya: "Alger",
    wilayaCode: "16",
    address: "Casbah, Algiers",
    coordinates: { lat: 36.78, lng: 3.06 },
    deliveryWilayas: [
      { code: "16", name: "Alger", homeRate: 400, deskRate: 250 },
      { code: "31", name: "Oran", homeRate: 600, deskRate: 400 },
      { code: "25", name: "Constantine", homeRate: 600, deskRate: 400 },
    ],
    contact: {
      phone: "+213550112233",
      phones: ["+213550112233", "+213661998877"],
      email: "contact@casbah.dz",
      whatsapp: "+213550112233",
      instagram: "@casbahcrafts",
      facebook: "casbahcrafts",
    },
    reviews: [
      { id: "r1", rating: 5 },
      { id: "r2", rating: 4 },
    ],
    products: [],
    designSettings: {
      dockSettings: {
        visibility: { showStoreLocation: false },
      },
    },
  };

  const vm = extractRealStoreDetailsData(store);
  assert.equal(vm.delivery.coveredWilayasCount, 3);
  assert.equal(vm.delivery.summaryLabel, "Delivery Available In: 3 Wilayas");
  assert.equal(vm.contact.primaryPhone, "+213550112233");
  assert.deepEqual(vm.contact.additionalPhones, ["+213661998877"]);
  assert.equal(vm.location.visible, false);
  assert.equal(vm.location.address, null);
  assert.equal(vm.location.coordinates, null);
  assert.equal(vm.rating.totalReviewsCount, 2);
  assert.equal(vm.rating.averageRating, 4.5);
});

test("Share Store builder provides direct URLs and native/copy fallback modes", () => {
  const wa = buildStoreShareAction({
    platform: "whatsapp",
    storeName: "Casbah Crafts",
    storeUrl: "https://yume.dz/store/casbah",
  });
  assert.equal(wa.mode, "direct_url");
  assert.ok(wa.targetUrl.includes("api.whatsapp.com/send"));

  const ig = buildStoreShareAction({
    platform: "instagram",
    storeName: "Casbah Crafts",
    storeUrl: "https://yume.dz/store/casbah",
  });
  assert.equal(ig.mode, "native_or_copy_fallback");
});

test("Store Reports & Centralized Reports Center KPIs, filtering, and admin updates work without assignment workflows", () => {
  const first = createStoreReportSubmission({
    existingReports: [],
    storeId: "st-1",
    storeName: "Fake Gadgets Store",
    primaryReason: "Fraud or Scam",
    additionalDetails: "Demanded off-platform wire transfer.",
    reporterKey: "user_123",
    nowMs: 1700000000000,
  });

  assert.equal(first.ok, true);
  assert.equal(first.report?.priority, "high");
  assert.equal(first.report?.status, "new");

  // Duplicate submission from same reporter within cooldown is blocked
  const duplicate = createStoreReportSubmission({
    existingReports: first.nextReports,
    storeId: "st-1",
    storeName: "Fake Gadgets Store",
    primaryReason: "Fraud or Scam",
    additionalDetails: "Same report spam",
    reporterKey: "user_123",
    nowMs: 1700000005000,
  });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.statusCode, 429);

  // Admin status + priority + internal note update
  const updated = applyAdminReportUpdate({
    report: first.report!,
    actorName: "Central Admin Team",
    nextStatus: "under_review",
    nextPriority: "critical",
    newInternalNote: "Investigating order history and customer complaints.",
    nowMs: 1700000100000,
  });
  assert.equal(updated.status, "under_review");
  assert.equal(updated.priority, "critical");
  assert.equal(updated.internalNotes.length, 1);

  const kpis = computeReportsCenterKpis([updated]);
  assert.equal(kpis.totalReports, 1);
  assert.equal(kpis.underReviewReports, 1);
  assert.equal(kpis.highPriorityReports, 1);

  const filtered = filterAndSortStoreReports({
    reports: [updated],
    statusFilter: "under_review",
    reasonFilter: "Fraud or Scam",
    searchQuery: "wire transfer",
  });
  assert.equal(filtered.length, 1);
});

test("Story (+) button visibility allows exclusively Store Owner and Active Store Staff, blocking guests, buyers, other merchants, inactive staff, and platform admins", () => {
  const storeA: any = {
    id: "store_1",
    name: "La Maison du Caftan d'Alger",
    ownerEmail: "owner@caftan.dz",
    ownerId: "uid-owner-caftan",
    teamMembers: [
      { id: "staff-1", email: "manager@caftan.dz", role: "store_admin", status: "active" },
      { id: "staff-2", email: "employee@caftan.dz", role: "employee", status: "active" },
      { id: "staff-3", email: "former@caftan.dz", role: "employee", status: "inactive" },
    ],
  };

  const storeB: any = {
    id: "store_2",
    name: "th3p2014 Store",
    ownerEmail: "th3p2014@gmail.com",
    ownerId: "uid-owner-2",
    teamMembers: [],
  };

  const allStores = [storeA, storeB];

  // 1. Guest visitor (unauthenticated) -> MUST NOT see (+) button
  assert.equal(
    canUserManageStoreStories({ user: null, targetStore: storeA }),
    false
  );

  // 2. Regular Buyer -> MUST NOT see (+) button
  assert.equal(
    canUserManageStoreStories({
      user: { id: "buyer-1", email: "shopper@yume.dz", role: "Buyer" },
      targetStore: storeA,
    }),
    false
  );

  // 3. Owner of Store B viewing Store A (even when fallbackMyStore defaults to storeA!) -> MUST NOT see (+) button
  const storeBOwner = {
    id: "uid-owner-2",
    email: "th3p2014@gmail.com",
    role: "Merchant",
    storeName: "th3p2014 Store",
  };
  const storeBOwnedIds = resolveMerchantOwnedStoreIds(storeBOwner, allStores, storeA);
  assert.deepEqual(storeBOwnedIds, ["store_2"]);
  assert.equal(
    canUserManageStoreStories({
      user: { ...storeBOwner, ownedStoreIds: storeBOwnedIds },
      targetStore: storeA,
    }),
    false
  );

  // 4. Owner of Store B viewing own Store B -> MUST see (+) button
  assert.equal(
    canUserManageStoreStories({
      user: { ...storeBOwner, ownedStoreIds: storeBOwnedIds },
      targetStore: storeB,
    }),
    true
  );

  // 5. Store A Owner viewing Store A -> MUST see (+) button
  assert.equal(
    canUserManageStoreStories({
      user: { id: "uid-owner-caftan", email: "owner@caftan.dz", role: "Merchant", storeName: "La Maison du Caftan d'Alger" },
      targetStore: storeA,
    }),
    true
  );

  // 6. Active Store Staff (Store Admin / Employee) viewing Store A -> MUST see (+) button
  assert.equal(
    canUserManageStoreStories({
      user: { id: "staff-1", email: "manager@caftan.dz", role: "Buyer" },
      targetStore: storeA,
    }),
    true
  );
  assert.equal(
    canUserManageStoreStories({
      user: { id: "staff-2", email: "employee@caftan.dz", role: "Buyer" },
      targetStore: storeA,
    }),
    true
  );

  // 7. Store A Staff viewing Store B -> MUST NOT see (+) button
  assert.equal(
    canUserManageStoreStories({
      user: { id: "staff-1", email: "manager@caftan.dz", role: "Buyer" },
      targetStore: storeB,
    }),
    false
  );

  // 8. Inactive Staff member viewing Store A -> MUST NOT see (+) button
  assert.equal(
    canUserManageStoreStories({
      user: { id: "staff-3", email: "former@caftan.dz", role: "Buyer" },
      targetStore: storeA,
    }),
    false
  );

  // 9. Platform Admin who is neither owner nor staff of Store A -> MUST NOT see (+) button
  assert.equal(
    canUserManageStoreStories({
      user: { id: "platform-admin", email: "admin@yume.dz", role: "PlatformAdmin" },
      targetStore: storeA,
    }),
    false
  );
});

