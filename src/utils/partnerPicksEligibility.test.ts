import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateBilateralPlacementEligibility,
  evaluatePlacementProductLifecycleTransition,
  evaluateBilateralPartnershipInitiationEligibility,
  evaluatePartnerPicksActorPermission,
  resolveSharedProductIdsForPartnership,
  canRenderHostStoryRingOnAvatar,
} from './partnerPicksEligibility';
import {
  createDefaultPartnerPicksGlobalConfig,
  createDefaultMerchantPartnerPicksProfile,
} from './partnerPicksSchema';
import type {
  MerchantStore,
  PartnerPickProductPlacement,
  PartnerPicksPartnership,
  Product,
} from '../types';

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod_1',
    storeId: 'store_a',
    name: 'Karakou Royal Velvet',
    category: 'Fashion',
    price: 18500,
    stock: 12,
    imageUrl: '/assets/karakou.jpg',
    isVisible: true,
    status: 'active',
    rating: 4.9,
    reviews: [],
    safe: true,
    ...overrides,
  };
}

function createMockStore(overrides: Partial<MerchantStore> = {}): MerchantStore {
  return {
    id: 'store_a',
    ownerId: 'owner_a',
    ownerEmail: 'owner_a@yume.dz',
    name: 'Maison Alger',
    slug: 'maison-alger',
    subdomain: 'maison-alger.yume.dz',
    logo: '/assets/logo_a.png',
    banner: '/assets/banner_a.png',
    description: 'Artisanal couture',
    bio: 'Artisanal couture',
    wilaya: 'Alger',
    wilayaCode: '16',
    address: 'Didouche Mourad',
    coordinates: { lat: 36.75, lng: 3.05 },
    rating: 4.8,
    categories: ['Fashion'],
    verified: true,
    premiumTier: 'Premium',
    subscriptionTier: 'Premium',
    contact: { phone: '0550000001', email: 'owner_a@yume.dz' },
    products: [
      createMockProduct({ id: 'prod_1', storeId: 'store_a' }),
      createMockProduct({ id: 'prod_2', storeId: 'store_a' }),
      createMockProduct({ id: 'prod_3', storeId: 'store_a' }),
    ],
    reviews: [],
    storiesEnabled: true,
    ...overrides,
  };
}

function createMockPartnership(
  overrides: Partial<PartnerPicksPartnership> = {}
): PartnerPicksPartnership {
  return {
    id: 'part_ab',
    storeAId: 'store_a',
    storeAName: 'Maison Alger',
    storeBId: 'store_b',
    storeBName: 'Casbah Craft',
    initiatedByStoreId: 'store_a',
    status: 'ACTIVE',
    agreementTerms: {
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
      durationDays: 30,
      agreedByStoreA: true,
      agreedByStoreB: true,
    },
    createdAt: '2026-11-19T12:00:00.000Z',
    updatedAt: '2026-11-19T12:00:00.000Z',
    ...overrides,
  };
}

function createMockLivePlacement(
  overrides: Partial<PartnerPickProductPlacement> = {}
): PartnerPickProductPlacement {
  const option = {
    optionId: 'opt_grid_1',
    channelId: 'PRODUCT_GRID' as const,
    gridCoordinate: { row: 1, col: 2 },
    label: 'Page 1, Row 1, Column 2',
  };
  return {
    id: 'plc_1',
    partnershipId: 'part_ab',
    sourceStoreId: 'store_a',
    hostStoreId: 'store_b',
    productId: 'prod_1',
    channelId: 'PRODUCT_GRID',
    proposedOptions: [option],
    selectedOptionId: 'opt_grid_1',
    selectedOption: option,
    hostSelectedAt: '2026-11-19T12:05:00.000Z',
    proposerFinalApproved: true,
    proposerFinalApprovedAt: '2026-11-19T12:10:00.000Z',
    trafficLight: 'GREEN',
    lifecycleState: 'APPROVED_LIVE',
    activityHistory: [],
    createdAt: '2026-11-19T12:00:00.000Z',
    updatedAt: '2026-11-19T12:10:00.000Z',
    ...overrides,
  };
}

test('Full 6-Gate Bilateral Eligibility passes when all 3 layers (Global/Channel, Source+Host Plans, Bilateral Approval & Live Product) are valid', () => {
  const globalConfig = createDefaultPartnerPicksGlobalConfig();
  const storeA = createMockStore({ id: 'store_a', subscriptionTier: 'Premium' });
  const storeB = createMockStore({
    id: 'store_b',
    ownerId: 'owner_b',
    subscriptionTier: 'Premium Plus',
  });
  const profileA = createDefaultMerchantPartnerPicksProfile('store_a', 'owner_a');
  profileA.defaultSharedProductIds = ['prod_1', 'prod_2'];
  const profileB = createDefaultMerchantPartnerPicksProfile('store_b', 'owner_b');
  const partnership = createMockPartnership();
  const placement = createMockLivePlacement();

  const evalResult = evaluateBilateralPlacementEligibility({
    globalConfig,
    channelId: 'PRODUCT_GRID',
    sourceStore: storeA,
    hostStore: storeB,
    sourceProfile: profileA,
    hostProfile: profileB,
    partnership,
    allPartnerships: [partnership],
    placement,
  });

  assert.equal(evalResult.eligible, true);
  assert.equal(evalResult.failedGate, null);
  assert.equal(evalResult.failureCode, null);
  assert.equal(evalResult.sourcePlanId, 'Premium');
  assert.equal(evalResult.hostPlanId, 'Premium Plus');
  assert.equal(evalResult.direction, 'A_ON_B');
  assert.equal(evalResult.detectedProductLifecycleCase, 'LIVE_ELIGIBLE');
});

test('Gate 1: Global kill-switch and independent per-channel toggles control each channel without affecting other channels', () => {
  const globalConfig = createDefaultPartnerPicksGlobalConfig();
  const storeA = createMockStore({ id: 'store_a', subscriptionTier: 'Premium' });
  const storeB = createMockStore({ id: 'store_b', subscriptionTier: 'Premium' });
  const profileA = createDefaultMerchantPartnerPicksProfile('store_a');
  profileA.defaultSharedProductIds = ['prod_1'];
  const profileB = createDefaultMerchantPartnerPicksProfile('store_b');
  const partnership = createMockPartnership();
  const placement = createMockLivePlacement();

  // Disable only PRODUCT_GRID channel
  globalConfig.channels.PRODUCT_GRID.enabled = false;

  const gridEval = evaluateBilateralPlacementEligibility({
    globalConfig,
    channelId: 'PRODUCT_GRID',
    sourceStore: storeA,
    hostStore: storeB,
    sourceProfile: profileA,
    hostProfile: profileB,
    partnership,
    placement,
  });
  assert.equal(gridEval.eligible, false);
  assert.equal(gridEval.failedGate, 1);
  assert.equal(gridEval.failureCode, 'CHANNEL_DISABLED_BY_ADMIN');

  // STORE_BANNER remains independently active
  const bannerOption = {
    optionId: 'opt_banner_1',
    channelId: 'STORE_BANNER' as const,
    bannerSlotIndex: 1,
    label: 'Banner Slot 1',
  };
  const bannerPlacement = createMockLivePlacement({
    channelId: 'STORE_BANNER',
    proposedOptions: [bannerOption],
    selectedOptionId: 'opt_banner_1',
    selectedOption: bannerOption,
  });
  const bannerEval = evaluateBilateralPlacementEligibility({
    globalConfig,
    channelId: 'STORE_BANNER',
    sourceStore: storeA,
    hostStore: storeB,
    sourceProfile: profileA,
    hostProfile: profileB,
    partnership,
    placement: bannerPlacement,
  });
  assert.equal(bannerEval.eligible, true);

  // Master global kill-switch disables all channels immediately
  globalConfig.featureEnabled = false;
  const globalOffEval = evaluateBilateralPlacementEligibility({
    globalConfig,
    channelId: 'STORE_BANNER',
    sourceStore: storeA,
    hostStore: storeB,
    sourceProfile: profileA,
    hostProfile: profileB,
    partnership,
    placement: bannerPlacement,
  });
  assert.equal(globalOffEval.eligible, false);
  assert.equal(globalOffEval.failedGate, 1);
  assert.equal(globalOffEval.failureCode, 'GLOBAL_FEATURE_DISABLED');
});

test('Gates 2 & 3: Bilateral plan enforcement ensures one merchant plan never grants eligibility to the other merchant', () => {
  const globalConfig = createDefaultPartnerPicksGlobalConfig();
  const premiumStoreA = createMockStore({
    id: 'store_a',
    subscriptionTier: 'Premium Plus',
    premiumTier: 'Premium Plus',
  });
  const basicStoreB = createMockStore({
    id: 'store_b',
    subscriptionTier: 'Basic',
    premiumTier: 'Basic',
  });
  const proPlusStoreC = createMockStore({
    id: 'store_c',
    subscriptionTier: 'Pro Plus',
    premiumTier: 'Pro Plus',
  });

  // Premium Plus initiating with Basic fails because Basic is not eligible
  const initWithBasic = evaluateBilateralPartnershipInitiationEligibility({
    globalConfig,
    initiatorStore: premiumStoreA,
    targetStore: basicStoreB,
  });
  assert.equal(initWithBasic.eligible, false);
  assert.equal(initWithBasic.initiatorEligible, true);
  assert.equal(initWithBasic.targetEligible, false);
  assert.equal(initWithBasic.failureCode, 'HOST_PLAN_NOT_ELIGIBLE');

  // Basic initiating with Premium Plus fails Gate 2 on initiator
  const basicInitWithPremium = evaluateBilateralPartnershipInitiationEligibility({
    globalConfig,
    initiatorStore: basicStoreB,
    targetStore: premiumStoreA,
  });
  assert.equal(basicInitWithPremium.eligible, false);
  assert.equal(basicInitWithPremium.initiatorEligible, false);
  assert.equal(basicInitWithPremium.targetEligible, true);
  assert.equal(basicInitWithPremium.failureCode, 'SOURCE_PLAN_NOT_ELIGIBLE');

  // Pro Plus (Storefront channels only by default) paired with Premium Plus:
  // Allowed on STORE_BANNER, but blocked on REELS_FEED because Pro Plus does not unlock REELS_FEED
  const profileA = createDefaultMerchantPartnerPicksProfile('store_a');
  profileA.defaultSharedProductIds = ['prod_1'];
  const profileC = createDefaultMerchantPartnerPicksProfile('store_c');
  const partnershipAC = createMockPartnership({
    id: 'part_ac',
    storeAId: 'store_a',
    storeBId: 'store_c',
  });
  const reelsOption = {
    optionId: 'opt_reels_1',
    channelId: 'REELS_FEED' as const,
    sequentialPositionHint: 'MID_SEQUENCE' as const,
    label: 'Mid-sequence Reels slot',
  };
  const reelsPlacement = createMockLivePlacement({
    partnershipId: 'part_ac',
    sourceStoreId: 'store_a',
    hostStoreId: 'store_c',
    channelId: 'REELS_FEED',
    proposedOptions: [reelsOption],
    selectedOptionId: 'opt_reels_1',
    selectedOption: reelsOption,
  });

  const reelsOnProPlusHost = evaluateBilateralPlacementEligibility({
    globalConfig,
    channelId: 'REELS_FEED',
    sourceStore: premiumStoreA,
    hostStore: proPlusStoreC,
    sourceProfile: profileA,
    hostProfile: profileC,
    partnership: partnershipAC,
    placement: reelsPlacement,
  });
  assert.equal(reelsOnProPlusHost.eligible, false);
  assert.equal(reelsOnProPlusHost.failedGate, 3);
  assert.equal(reelsOnProPlusHost.failureCode, 'HOST_CHANNEL_NOT_ALLOWED_BY_PLAN');
});

test('Independent Partner Limit & Independent Per-Partnership Product Limit: sharing P1, P2, P3 with Partner B does NOT consume product allowance for Partner C', () => {
  const globalConfig = createDefaultPartnerPicksGlobalConfig();
  // Pro Plus allows maxActivePartnerStores = 2 and maxProductsPerPartnership = 3
  const storeA = createMockStore({
    id: 'store_a',
    subscriptionTier: 'Pro Plus',
    premiumTier: 'Pro Plus',
    products: [
      createMockProduct({ id: 'P1', storeId: 'store_a' }),
      createMockProduct({ id: 'P2', storeId: 'store_a' }),
      createMockProduct({ id: 'P3', storeId: 'store_a' }),
      createMockProduct({ id: 'P4', storeId: 'store_a' }),
    ],
  });
  const storeB = createMockStore({
    id: 'store_b',
    subscriptionTier: 'Premium',
    premiumTier: 'Premium',
  });
  const storeC = createMockStore({
    id: 'store_c',
    subscriptionTier: 'Premium',
    premiumTier: 'Premium',
  });

  const profileA = createDefaultMerchantPartnerPicksProfile('store_a');
  // Common default has P1, P2, P3 (3 products)
  profileA.defaultSharedProductIds = ['P1', 'P2', 'P3'];
  // Partnership with C uses custom per-partner list with P1, P2, P4 (also 3 products!)
  profileA.partnershipProductMode = {
    part_ab: 'DEFAULT_COMMON',
    part_ac: 'CUSTOM_PER_PARTNER',
  };
  profileA.customProductIdsByPartnership = {
    part_ac: ['P1', 'P2', 'P4'],
  };

  const partAB = createMockPartnership({
    id: 'part_ab',
    storeAId: 'store_a',
    storeBId: 'store_b',
  });
  const partAC = createMockPartnership({
    id: 'part_ac',
    storeAId: 'store_a',
    storeBId: 'store_c',
  });

  const proPlusEntitlement = globalConfig.planEntitlements['Pro Plus'];
  const resAB = resolveSharedProductIdsForPartnership(
    profileA,
    'store_a',
    'part_ab',
    proPlusEntitlement
  );
  const resAC = resolveSharedProductIdsForPartnership(
    profileA,
    'store_a',
    'part_ac',
    proPlusEntitlement
  );

  assert.deepEqual(resAB.allowedProductIdsWithinPlanCap, ['P1', 'P2', 'P3']);
  assert.equal(resAB.exceedsPerPartnershipCap, false);
  assert.deepEqual(resAC.allowedProductIdsWithinPlanCap, ['P1', 'P2', 'P4']);
  assert.equal(resAC.exceedsPerPartnershipCap, false);

  // Both partnerships (A->B for P3, and A->C for P4) are simultaneously eligible!
  const evalAB = evaluateBilateralPlacementEligibility({
    globalConfig,
    channelId: 'PRODUCT_GRID',
    sourceStore: storeA,
    hostStore: storeB,
    sourceProfile: profileA,
    hostProfile: createDefaultMerchantPartnerPicksProfile('store_b'),
    partnership: partAB,
    allPartnerships: [partAB, partAC],
    placement: createMockLivePlacement({
      id: 'plc_ab_3',
      partnershipId: 'part_ab',
      sourceStoreId: 'store_a',
      hostStoreId: 'store_b',
      productId: 'P3',
    }),
  });
  assert.equal(evalAB.eligible, true);

  const evalAC = evaluateBilateralPlacementEligibility({
    globalConfig,
    channelId: 'PRODUCT_GRID',
    sourceStore: storeA,
    hostStore: storeC,
    sourceProfile: profileA,
    hostProfile: createDefaultMerchantPartnerPicksProfile('store_c'),
    partnership: partAC,
    allPartnerships: [partAB, partAC],
    placement: createMockLivePlacement({
      id: 'plc_ac_4',
      partnershipId: 'part_ac',
      sourceStoreId: 'store_a',
      hostStoreId: 'store_c',
      productId: 'P4',
    }),
  });
  assert.equal(evalAC.eligible, true);

  // Attempting to form a 3rd active partnership (Store D) on Pro Plus (max 2 partners) fails Gate 2
  const storeD = createMockStore({ id: 'store_d', subscriptionTier: 'Premium' });
  const initAD = evaluateBilateralPartnershipInitiationEligibility({
    globalConfig,
    initiatorStore: storeA,
    targetStore: storeD,
    allPartnerships: [partAB, partAC],
  });
  assert.equal(initAD.eligible, false);
  assert.equal(initAD.failureCode, 'SOURCE_MAX_ACTIVE_PARTNERS_EXCEEDED');
});

test('Gate 4 Stories Confirmed Decision: requires host native Stories enabled, does NOT require an active native Story at every moment, and forbids standalone promotional Story Ring', () => {
  const globalConfig = createDefaultPartnerPicksGlobalConfig();
  const storeA = createMockStore({ id: 'store_a', subscriptionTier: 'Premium' });
  const storeB = createMockStore({
    id: 'store_b',
    subscriptionTier: 'Premium',
    storiesEnabled: true, // Host has enabled native Stories feature
  });
  const profileA = createDefaultMerchantPartnerPicksProfile('store_a');
  profileA.defaultSharedProductIds = ['prod_1'];
  const profileB = createDefaultMerchantPartnerPicksProfile('store_b');
  const partnership = createMockPartnership();

  const storiesOption = {
    optionId: 'opt_story_1',
    channelId: 'STORIES' as const,
    sequentialPositionHint: 'TAIL' as const,
    label: 'Stories sequence tail',
  };
  const storiesPlacement = createMockLivePlacement({
    channelId: 'STORIES',
    proposedOptions: [storiesOption],
    selectedOptionId: 'opt_story_1',
    selectedOption: storiesOption,
  });

  // 1. Host has native Stories enabled (even with 0 active native stories published right now) -> ELIGIBLE
  const storiesEligibleEval = evaluateBilateralPlacementEligibility({
    globalConfig,
    channelId: 'STORIES',
    sourceStore: storeA,
    hostStore: storeB,
    sourceProfile: profileA,
    hostProfile: profileB,
    partnership,
    placement: storiesPlacement,
  });
  assert.equal(storiesEligibleEval.eligible, true);

  // 2. Standalone Story Ring check: when host has 0 published native stories, avatar MUST NOT render a promo-only Story Ring
  assert.equal(
    canRenderHostStoryRingOnAvatar({
      hostStore: storeB,
      genuineNativePublishedStoriesCount: 0,
    }),
    false
  );
  assert.equal(
    canRenderHostStoryRingOnAvatar({
      hostStore: storeB,
      genuineNativePublishedStoriesCount: 2,
    }),
    true
  );

  // 3. If host merchant disables native Stories (`storiesEnabled: false`), Partner Picks Stories immediately become ineligible
  const storeBStoriesOff = { ...storeB, storiesEnabled: false };
  const storiesDisabledEval = evaluateBilateralPlacementEligibility({
    globalConfig,
    channelId: 'STORIES',
    sourceStore: storeA,
    hostStore: storeBStoriesOff,
    sourceProfile: profileA,
    hostProfile: profileB,
    partnership,
    placement: storiesPlacement,
  });
  assert.equal(storiesDisabledEval.eligible, false);
  assert.equal(storiesDisabledEval.failedGate, 4);
  assert.equal(
    storiesDisabledEval.failureCode,
    'HOST_NATIVE_STORIES_FEATURE_DISABLED'
  );
});

test('Gate 5: Enforces two-sided placement approval and Page 1 Product Grid scope', () => {
  const globalConfig = createDefaultPartnerPicksGlobalConfig();
  const storeA = createMockStore({ id: 'store_a', subscriptionTier: 'Premium' });
  const storeB = createMockStore({ id: 'store_b', subscriptionTier: 'Premium' });
  const profileA = createDefaultMerchantPartnerPicksProfile('store_a');
  profileA.defaultSharedProductIds = ['prod_1'];
  const profileB = createDefaultMerchantPartnerPicksProfile('store_b');
  const partnership = createMockPartnership();

  // Host selected option, but awaiting Source Merchant A's final confirmation -> fails Gate 5
  const awaitingProposerPlacement = createMockLivePlacement({
    proposerFinalApproved: false,
    lifecycleState: 'HOST_SELECTED_AWAITING_FINAL_APPROVAL',
    trafficLight: 'YELLOW',
  });

  const pendingEval = evaluateBilateralPlacementEligibility({
    globalConfig,
    channelId: 'PRODUCT_GRID',
    sourceStore: storeA,
    hostStore: storeB,
    sourceProfile: profileA,
    hostProfile: profileB,
    partnership,
    placement: awaitingProposerPlacement,
  });
  assert.equal(pendingEval.eligible, false);
  assert.equal(pendingEval.failedGate, 5);
  assert.equal(
    pendingEval.failureCode,
    'PLACEMENT_AWAITING_PROPOSER_FINAL_APPROVAL'
  );

  // Approved placement on Page 1 passes, but on Page 2 fails when gridPageScope === PAGE_1_ONLY
  const livePlacement = createMockLivePlacement();
  const page2Eval = evaluateBilateralPlacementEligibility({
    globalConfig,
    channelId: 'PRODUCT_GRID',
    sourceStore: storeA,
    hostStore: storeB,
    sourceProfile: profileA,
    hostProfile: profileB,
    partnership,
    placement: livePlacement,
    currentProductGridPage: 2,
  });
  assert.equal(page2Eval.eligible, false);
  assert.equal(page2Eval.failedGate, 5);
  assert.equal(page2Eval.failureCode, 'PLACEMENT_GRID_PAGE_OUT_OF_SCOPE');
});

test('Gate 6 & 6-State Live Product Availability State Machine: ONLY Case A (out-of-stock) auto-resumes on restock; Cases B-F NEVER auto-resume', () => {
  const globalConfig = createDefaultPartnerPicksGlobalConfig();
  const storeB = createMockStore({ id: 'store_b', subscriptionTier: 'Premium' });
  const profileA = createDefaultMerchantPartnerPicksProfile('store_a');
  profileA.defaultSharedProductIds = ['prod_1'];
  const profileB = createDefaultMerchantPartnerPicksProfile('store_b');
  const partnership = createMockPartnership();

  // Case A: Product goes temporarily out of stock (stock = 0)
  const storeAOutOfStock = createMockStore({
    id: 'store_a',
    subscriptionTier: 'Premium',
    products: [createMockProduct({ id: 'prod_1', stock: 0, isVisible: true, status: 'active' })],
  });
  const livePlacement = createMockLivePlacement();

  const pauseTransitionA = evaluatePlacementProductLifecycleTransition({
    globalConfig,
    channelId: 'PRODUCT_GRID',
    sourceStore: storeAOutOfStock,
    hostStore: storeB,
    sourceProfile: profileA,
    hostProfile: profileB,
    partnership,
    placement: livePlacement,
  });
  assert.equal(pauseTransitionA.changed, true);
  assert.equal(pauseTransitionA.nextState, 'AUTO_PAUSED_OUT_OF_STOCK');
  assert.equal(pauseTransitionA.nextTrafficLight, 'YELLOW');

  // Restock Case A (stock = 15) -> Automatically resumes to APPROVED_LIVE (GREEN)!
  const storeARestocked = createMockStore({
    id: 'store_a',
    subscriptionTier: 'Premium',
    products: [createMockProduct({ id: 'prod_1', stock: 15, isVisible: true, status: 'active' })],
  });
  const pausedCaseAPlacement = createMockLivePlacement({
    lifecycleState: 'AUTO_PAUSED_OUT_OF_STOCK',
    trafficLight: 'YELLOW',
  });

  const resumeTransitionA = evaluatePlacementProductLifecycleTransition({
    globalConfig,
    channelId: 'PRODUCT_GRID',
    sourceStore: storeARestocked,
    hostStore: storeB,
    sourceProfile: profileA,
    hostProfile: profileB,
    partnership,
    placement: pausedCaseAPlacement,
  });
  assert.equal(resumeTransitionA.changed, true);
  assert.equal(resumeTransitionA.nextState, 'APPROVED_LIVE');
  assert.equal(resumeTransitionA.nextTrafficLight, 'GREEN');
  assert.equal(resumeTransitionA.transitionAction, 'AUTO_RESUMED_IN_STOCK');

  // Cases B, C, D, E, F MUST NEVER auto-resume even when stock is 15 and product is visible
  const nonAutoResumableStates = [
    'PAUSED_OWNER_HIDDEN',
    'PAUSED_OWNER_DISABLED',
    'PAUSED_OWNER_ARCHIVED',
    'INVALIDATED_PRODUCT_REMOVED',
    'SUSPENDED_BY_PLATFORM_ADMIN',
  ] as const;

  for (const lockedState of nonAutoResumableStates) {
    const lockedPlacement = createMockLivePlacement({
      lifecycleState: lockedState,
      trafficLight:
        lockedState === 'INVALIDATED_PRODUCT_REMOVED' ||
        lockedState === 'SUSPENDED_BY_PLATFORM_ADMIN'
          ? 'RED'
          : 'YELLOW',
    });
    const attemptResume = evaluatePlacementProductLifecycleTransition({
      globalConfig,
      channelId: 'PRODUCT_GRID',
      sourceStore: storeARestocked,
      hostStore: storeB,
      sourceProfile: profileA,
      hostProfile: profileB,
      partnership,
      placement: lockedPlacement,
    });
    assert.equal(
      attemptResume.nextState,
      lockedState,
      `State ${lockedState} should never auto-resume on restock`
    );
    assert.notEqual(attemptResume.transitionAction, 'AUTO_RESUMED_IN_STOCK');
  }
});

test('Role & Staff Delegation Evaluator enforces Store Owner authority, staff delegation flags, and blocks cross-store catalog mutations', () => {
  const storeA = createMockStore({
    id: 'store_a',
    ownerId: 'owner_a',
    ownerEmail: 'owner_a@yume.dz',
    teamMembers: [
      {
        id: 'staff_1',
        name: 'Amina Manager',
        email: 'amina@yume.dz',
        role: 'Manager',
        status: 'active',
        avatar: '/assets/a.png',
        joinedDate: '2026-01-01',
        permissions: {
          confirmOrders: true,
          prepareShipments: true,
          manageProducts: true,
          manageDiscounts: false,
        },
      },
    ],
  });

  const profileA = createDefaultMerchantPartnerPicksProfile('store_a', 'owner_a');
  profileA.staffPermissions = {
    authorizedStaffIds: ['staff_1'],
    canSendRequests: true,
    canAcceptRejectRequests: true,
    canManageSharedProducts: true,
    canProposeAndSelectPlacements: true,
    canFinalApprovePlacements: false, // Final approval reserved for owner
  };

  // 1. Store Owner has full access to all actions including CONFIGURE_STAFF_PERMISSIONS
  const ownerCheck = evaluatePartnerPicksActorPermission({
    actor: { id: 'owner_a', email: 'owner_a@yume.dz', role: 'merchant', storeId: 'store_a' },
    targetStore: storeA,
    targetStoreProfile: profileA,
    action: 'CONFIGURE_STAFF_PERMISSIONS',
  });
  assert.equal(ownerCheck.allowed, true);
  assert.equal(ownerCheck.actorRole, 'STORE_OWNER');

  // 2. Authorized staff can perform delegated actions (SEND_PARTNERSHIP_REQUEST), but NOT undelegated (FINAL_APPROVE_PLACEMENTS_AS_SOURCE) or owner-only (CONFIGURE_STAFF_PERMISSIONS)
  const staffSendCheck = evaluatePartnerPicksActorPermission({
    actor: { id: 'staff_1', email: 'amina@yume.dz', role: 'merchant' },
    targetStore: storeA,
    targetStoreProfile: profileA,
    action: 'SEND_PARTNERSHIP_REQUEST',
  });
  assert.equal(staffSendCheck.allowed, true);
  assert.equal(staffSendCheck.actorRole, 'AUTHORIZED_STAFF');

  const staffFinalApproveCheck = evaluatePartnerPicksActorPermission({
    actor: { id: 'staff_1', email: 'amina@yume.dz', role: 'merchant' },
    targetStore: storeA,
    targetStoreProfile: profileA,
    action: 'FINAL_APPROVE_PLACEMENTS_AS_SOURCE',
  });
  assert.equal(staffFinalApproveCheck.allowed, false);

  const staffConfigPermsCheck = evaluatePartnerPicksActorPermission({
    actor: { id: 'staff_1', email: 'amina@yume.dz', role: 'merchant' },
    targetStore: storeA,
    targetStoreProfile: profileA,
    action: 'CONFIGURE_STAFF_PERMISSIONS',
  });
  assert.equal(staffConfigPermsCheck.allowed, false);

  // 3. Partner Merchant B is strictly forbidden from modifying Store A's product catalog
  const partnerCatalogMutationAttempt = evaluatePartnerPicksActorPermission({
    actor: { id: 'owner_b', email: 'owner_b@yume.dz', role: 'merchant', storeId: 'store_b' },
    targetStore: storeA,
    targetStoreProfile: profileA,
    action: 'MODIFY_SOURCE_PRODUCT_CATALOG',
  });
  assert.equal(partnerCatalogMutationAttempt.allowed, false);
  assert.equal(partnerCatalogMutationAttempt.actorRole, 'UNAUTHORIZED');
});
