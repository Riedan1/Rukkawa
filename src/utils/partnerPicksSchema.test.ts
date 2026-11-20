import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PARTNER_PICK_CHANNEL_IDS,
  CANONICAL_PARTNER_PICKS_PLAN_IDS,
  DEFAULT_MAX_SIMULTANEOUS_PARTNER_STORES,
  PARTNER_PICKS_PLACEMENT_STATES,
  createDefaultPartnerPicksGlobalConfig,
  normalizePartnerPicksGlobalConfig,
  createDefaultMerchantPartnerPicksProfile,
  normalizeMerchantPartnerPicksProfile,
  resolveTrafficLightForPlacementState,
  isPlacementStateEligibleForAutoStockResumption,
  createInitialBidirectionalExposureLedger,
  validatePartnerPicksPartnershipRecord,
  validatePartnerPickPlacementRecord,
  validatePartnerPicksAnalyticsEvent,
} from './partnerPicksSchema';
import { PlacementLifecycleState } from '../types';

test('createDefaultPartnerPicksGlobalConfig sets all approved defaults and invariants', () => {
  const cfg = createDefaultPartnerPicksGlobalConfig('2026-11-19T20:00:00.000Z');

  assert.equal(cfg.id, 'global');
  assert.equal(cfg.featureEnabled, true);
  assert.equal(cfg.maxSimultaneousPartnerStores, 2);
  assert.equal(DEFAULT_MAX_SIMULTANEOUS_PARTNER_STORES, 2);
  assert.equal(cfg.timedRotationEnabled, false);
  assert.equal(cfg.defaultRotationMode, 'REFRESH_BASED');

  // All 5 independent channels exist and are independently configurable
  for (const chId of PARTNER_PICK_CHANNEL_IDS) {
    assert.ok(cfg.channels[chId], `Missing channel config for ${chId}`);
    assert.equal(cfg.channels[chId].channelId, chId);
    assert.equal(cfg.channels[chId].enabled, true);
    assert.equal(cfg.channels[chId].visualTokens.showPartnerPicksBadge, true);
  }

  // Stories specific prerequisite invariants
  assert.equal(
    cfg.channels.STORIES.sequentialMediaRules?.requireHostStoriesFeatureEnabled,
    true
  );
  assert.equal(
    cfg.channels.STORIES.sequentialMediaRules?.requireActiveNativeStoryPublished,
    false
  );
  assert.equal(
    cfg.channels.STORIES.sequentialMediaRules?.forbidStandalonePromotionalStoryRing,
    true
  );

  // All 5 canonical subscription plans exist (Basic, Pro, Pro Plus, Premium, Premium Plus)
  for (const planId of CANONICAL_PARTNER_PICKS_PLAN_IDS) {
    assert.ok(cfg.planEntitlements[planId], `Missing plan entitlement for ${planId}`);
    assert.equal(cfg.planEntitlements[planId].planId, planId);
  }
  assert.equal(cfg.planEntitlements.Basic.enabled, false);
  assert.equal(cfg.planEntitlements.Basic.maxActivePartnerStores, 0);
  assert.equal(cfg.planEntitlements.Pro.enabled, true);
  assert.equal(cfg.planEntitlements['Pro Plus'].enabled, true);
  assert.equal(cfg.planEntitlements['Pro Plus'].maxActivePartnerStores, 2);
  assert.equal(cfg.planEntitlements.Premium.enabled, true);
  assert.equal(cfg.planEntitlements.Premium.maxActivePartnerStores, 3);
  assert.equal(cfg.planEntitlements['Premium Plus'].enabled, true);
  assert.equal(cfg.planEntitlements['Premium Plus'].maxActivePartnerStores, 5);
});

test('normalizePartnerPicksGlobalConfig preserves Stories prerequisite invariants and clamps invalid values', () => {
  const normalized = normalizePartnerPicksGlobalConfig({
    id: 'custom_attempt' as any,
    maxSimultaneousPartnerStores: -5,
    timedRotationEnabled: false,
    channels: {
      STORIES: {
        channelId: 'STORIES',
        enabled: false,
        sequentialMediaRules: {
          requireHostStoriesFeatureEnabled: true,
          requireActiveNativeStoryPublished: false,
          forbidStandalonePromotionalStoryRing: false,
        },
      } as any,
    } as any,
  });

  assert.equal(normalized.id, 'global');
  assert.equal(normalized.maxSimultaneousPartnerStores, 2);
  assert.equal(normalized.channels.STORIES.enabled, false);
  // Confirmed Stories architectural invariants must always hold
  assert.equal(
    normalized.channels.STORIES.sequentialMediaRules?.requireHostStoriesFeatureEnabled,
    true
  );
  assert.equal(
    normalized.channels.STORIES.sequentialMediaRules?.requireActiveNativeStoryPublished,
    false
  );
  assert.equal(
    normalized.channels.STORIES.sequentialMediaRules?.forbidStandalonePromotionalStoryRing,
    true
  );
});

test('createDefaultMerchantPartnerPicksProfile and normalizeMerchantPartnerPicksProfile separate default and per-partnership product lists', () => {
  const profile = createDefaultMerchantPartnerPicksProfile(
    'store_alpha',
    'owner_uid_1',
    '2026-11-19T20:00:00.000Z'
  );
  assert.equal(profile.storeId, 'store_alpha');
  assert.equal(profile.ownerUid, 'owner_uid_1');
  assert.deepEqual(profile.defaultSharedProductIds, []);
  assert.deepEqual(profile.customProductIdsByPartnership, {});

  const normalized = normalizeMerchantPartnerPicksProfile('store_alpha', {
    ownerUid: 'owner_uid_1',
    defaultSharedProductIds: ['prod_1', 'prod_2', 'prod_1'],
    partnershipProductMode: {
      part_101: 'CUSTOM_PER_PARTNER',
      part_102: 'DEFAULT_COMMON',
    },
    customProductIdsByPartnership: {
      part_101: ['prod_9', 'prod_9', 'prod_10'],
      part_102: ['prod_3'],
    },
    hostChannelConsent: {
      STORE_BANNER: true,
      PRODUCT_GRID: true,
      DISCOVER_MORE: false,
      REELS_FEED: true,
      STORIES: false,
    },
    hostSpatialAllowedSlots: {
      bannerSlotIndices: [1, 2],
      gridCoordinates: [
        { row: 2, col: 3 },
        { row: -1, col: 2 },
      ],
      discoverCarouselIndices: [1, 3],
    },
  });

  assert.equal(normalized.storeId, 'store_alpha');
  assert.deepEqual(normalized.defaultSharedProductIds, ['prod_1', 'prod_2']);
  assert.equal(normalized.partnershipProductMode.part_101, 'CUSTOM_PER_PARTNER');
  assert.equal(normalized.partnershipProductMode.part_102, 'DEFAULT_COMMON');
  assert.deepEqual(normalized.customProductIdsByPartnership.part_101, ['prod_9', 'prod_10']);
  assert.deepEqual(normalized.customProductIdsByPartnership.part_102, ['prod_3']);
  assert.equal(normalized.hostChannelConsent.DISCOVER_MORE, false);
  assert.equal(normalized.hostChannelConsent.STORIES, false);
  assert.deepEqual(normalized.hostSpatialAllowedSlots.gridCoordinates, [{ row: 2, col: 3 }]);
});

test('6-state live product availability: ONLY Case A (AUTO_PAUSED_OUT_OF_STOCK) is eligible for automatic resumption on restock', () => {
  const autoResumableStates: PlacementLifecycleState[] = [];
  for (const state of PARTNER_PICKS_PLACEMENT_STATES) {
    if (isPlacementStateEligibleForAutoStockResumption(state)) {
      autoResumableStates.push(state);
    }
  }

  assert.deepEqual(autoResumableStates, ['AUTO_PAUSED_OUT_OF_STOCK']);

  // Cases B through F must never auto-resume on restock
  assert.equal(
    isPlacementStateEligibleForAutoStockResumption('PAUSED_OWNER_HIDDEN'),
    false
  );
  assert.equal(
    isPlacementStateEligibleForAutoStockResumption('PAUSED_OWNER_DISABLED'),
    false
  );
  assert.equal(
    isPlacementStateEligibleForAutoStockResumption('PAUSED_OWNER_ARCHIVED'),
    false
  );
  assert.equal(
    isPlacementStateEligibleForAutoStockResumption('INVALIDATED_PRODUCT_REMOVED'),
    false
  );
  assert.equal(
    isPlacementStateEligibleForAutoStockResumption('SUSPENDED_BY_PLATFORM_ADMIN'),
    false
  );

  // Traffic light mapping check
  assert.equal(resolveTrafficLightForPlacementState('APPROVED_LIVE'), 'GREEN');
  assert.equal(
    resolveTrafficLightForPlacementState('HOST_SELECTED_AWAITING_FINAL_APPROVAL'),
    'YELLOW'
  );
  assert.equal(resolveTrafficLightForPlacementState('AUTO_PAUSED_OUT_OF_STOCK'), 'YELLOW');
  assert.equal(resolveTrafficLightForPlacementState('INVALIDATED_PRODUCT_REMOVED'), 'RED');
  assert.equal(resolveTrafficLightForPlacementState('SUSPENDED_BY_PLATFORM_ADMIN'), 'RED');
});

test('validatePartnerPickPlacementRecord enforces two-sided placement approval invariant for APPROVED_LIVE', () => {
  const basePlacement = {
    id: 'plc_1',
    partnershipId: 'part_1',
    sourceStoreId: 'store_a',
    hostStoreId: 'store_b',
    productId: 'prod_100',
    channelId: 'PRODUCT_GRID' as const,
    proposedOptions: [
      {
        optionId: 'opt_1',
        channelId: 'PRODUCT_GRID' as const,
        gridCoordinate: { row: 2, col: 1 },
        label: 'Page 1, Row 2, Column 1',
      },
    ],
    selectedOptionId: 'opt_1',
    selectedOption: null,
    hostSelectedAt: '2026-11-19T20:00:00.000Z',
    proposerFinalApproved: false,
    trafficLight: 'YELLOW' as const,
    lifecycleState: 'HOST_SELECTED_AWAITING_FINAL_APPROVAL' as const,
    activityHistory: [],
    createdAt: '2026-11-19T20:00:00.000Z',
    updatedAt: '2026-11-19T20:00:00.000Z',
  };

  assert.equal(validatePartnerPickPlacementRecord(basePlacement).valid, true);

  // Cannot transition to APPROVED_LIVE without proposerFinalApproved === true and trafficLight === GREEN
  const prematureLive = {
    ...basePlacement,
    lifecycleState: 'APPROVED_LIVE' as const,
    proposerFinalApproved: false,
    trafficLight: 'GREEN' as const,
  };
  assert.equal(validatePartnerPickPlacementRecord(prematureLive).valid, false);

  // Cannot be APPROVED_LIVE if selectedOptionId is not one of the proposedOptions
  const mismatchedOptionLive = {
    ...basePlacement,
    selectedOptionId: 'opt_999',
    lifecycleState: 'APPROVED_LIVE' as const,
    proposerFinalApproved: true,
    trafficLight: 'GREEN' as const,
  };
  assert.equal(validatePartnerPickPlacementRecord(mismatchedOptionLive).valid, false);

  // Valid two-sided approved live placement passes
  const validLive = {
    ...basePlacement,
    lifecycleState: 'APPROVED_LIVE' as const,
    proposerFinalApproved: true,
    proposerFinalApprovedAt: '2026-11-19T20:05:00.000Z',
    trafficLight: 'GREEN' as const,
  };
  assert.equal(validatePartnerPickPlacementRecord(validLive).valid, true);
});

test('validatePartnerPicksPartnershipRecord and createInitialBidirectionalExposureLedger validate bilateral partnership structure', () => {
  const validPartnership = {
    id: 'part_ab',
    storeAId: 'store_a',
    storeAName: 'Store A',
    storeBId: 'store_b',
    storeBName: 'Store B',
    initiatedByStoreId: 'store_a',
    status: 'ACTIVE' as const,
    agreementTerms: {
      enabledChannelsAOnB: {
        STORE_BANNER: true,
        PRODUCT_GRID: true,
        DISCOVER_MORE: false,
        REELS_FEED: false,
        STORIES: false,
      },
      enabledChannelsBOnA: {
        STORE_BANNER: true,
        PRODUCT_GRID: true,
        DISCOVER_MORE: false,
        REELS_FEED: false,
        STORIES: false,
      },
      durationDays: 30,
      agreedByStoreA: true,
      agreedByStoreB: true,
    },
    createdAt: '2026-11-19T20:00:00.000Z',
    updatedAt: '2026-11-19T20:00:00.000Z',
  };

  assert.equal(validatePartnerPicksPartnershipRecord(validPartnership).valid, true);

  // Self-partnership must fail
  assert.equal(
    validatePartnerPicksPartnershipRecord({
      ...validPartnership,
      storeBId: 'store_a',
    }).valid,
    false
  );

  const ledger = createInitialBidirectionalExposureLedger(
    'part_ab',
    'store_a',
    'store_b',
    '2026-11-19T20:00:00.000Z'
  );
  assert.equal(ledger.partnershipId, 'part_ab');
  assert.equal(ledger.directionAOnB.sourceStoreId, 'store_a');
  assert.equal(ledger.directionAOnB.hostStoreId, 'store_b');
  assert.equal(ledger.directionBOnA.sourceStoreId, 'store_b');
  assert.equal(ledger.directionBOnA.hostStoreId, 'store_a');
  assert.equal(Object.keys(ledger.directionAOnB.byChannel).length, 5);
});

test('validatePartnerPicksAnalyticsEvent validates real interaction events', () => {
  const validEvent = {
    id: 'evt_1',
    idempotencyKey: 'idem_evt_1_product_open_500',
    partnershipId: 'part_ab',
    placementId: 'plc_1',
    hostStoreId: 'store_b',
    sourceStoreId: 'store_a',
    productId: 'prod_100',
    channelId: 'REELS_FEED' as const,
    eventType: 'original_product_open' as const,
    visitorHash: 'vis_hash_123',
    rotationEpoch: 1,
    exposureDurationMs: 4200,
    timestamp: '2026-11-19T20:10:00.000Z',
  };
  assert.equal(validatePartnerPicksAnalyticsEvent(validEvent).valid, true);

  assert.equal(
    validatePartnerPicksAnalyticsEvent({
      ...validEvent,
      hostStoreId: 'store_a',
      sourceStoreId: 'store_a',
    }).valid,
    false
  );
});

test('firebase-blueprint.json and firestore.rules include all 6 Partner Picks collections and preserve existing collections', () => {
  const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
  const blueprintRaw = fs.readFileSync(blueprintPath, 'utf-8');
  const blueprint = JSON.parse(blueprintRaw);

  const expectedEntities = [
    'PartnerPicksGlobalConfig',
    'MerchantPartnerPicksProfile',
    'PartnerPicksPartnership',
    'PartnerPickProductPlacement',
    'PartnerPicksBidirectionalExposureLedger',
    'PartnerPicksChannelAnalyticsEvent',
  ];
  for (const entity of expectedEntities) {
    assert.ok(blueprint.entities[entity], `Missing entity ${entity} in firebase-blueprint.json`);
  }

  const expectedPaths = [
    '/partner_picks_config/{configId}',
    '/partner_picks_profiles/{storeId}',
    '/partner_picks_partnerships/{partnershipId}',
    '/partner_picks_placements/{placementId}',
    '/partner_picks_exposure_ledger/{partnershipId}',
    '/partner_picks_analytics_events/{eventId}',
    '/campaigns/{campaignId}', // Paid advertising remains separate and intact
  ];
  for (const fsPath of expectedPaths) {
    assert.ok(blueprint.firestore[fsPath], `Missing firestore path ${fsPath} in firebase-blueprint.json`);
  }

  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rulesRaw = fs.readFileSync(rulesPath, 'utf-8');
  assert.ok(rulesRaw.includes('match /partner_picks_config/{configId}'));
  assert.ok(rulesRaw.includes('match /partner_picks_profiles/{storeId}'));
  assert.ok(rulesRaw.includes('match /partner_picks_partnerships/{partnershipId}'));
  assert.ok(rulesRaw.includes('match /partner_picks_placements/{placementId}'));
  assert.ok(rulesRaw.includes('match /partner_picks_exposure_ledger/{partnershipId}'));
  assert.ok(rulesRaw.includes('match /partner_picks_analytics_events/{eventId}'));
  assert.ok(rulesRaw.includes('match /campaigns/{campaignId}'));
});
