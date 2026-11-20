import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialUserPartnerPicksFatigueState,
  evaluateCandidateFrequencyAndFatigue,
  recordUserPartnerPickImpression,
  recordUserPartnerPickSkip,
  recordUserPartnerPickProductClickOrView,
  resolveSequentialInsertionIndices,
} from './partnerPicksFrequencyEngine';
import { createDefaultPartnerPicksGlobalConfig } from './partnerPicksSchema';

test('Per-channel frequency caps and cross-channel cooldowns respect dynamic Platform Admin configuration overrides', () => {
  const cfg = createDefaultPartnerPicksGlobalConfig();
  // Admin customizes Store Banner maxAppearancesPerSession = 2 and sameProductCooldownSeconds = 600
  cfg.channels.STORE_BANNER.frequencyLimits.maxAppearancesPerSession = 2;
  cfg.smartFrequency.sameProductCooldownSeconds = 600;
  cfg.smartFrequency.samePartnerStoreCooldownSeconds = 120;

  const t0 = Date.parse('2026-11-19T12:00:00.000Z');
  let userState = createInitialUserPartnerPicksFatigueState('user_alpha', t0);

  // First evaluation passes
  const eval1 = evaluateCandidateFrequencyAndFatigue({
    globalConfig: cfg,
    userFatigueState: userState,
    channelId: 'STORE_BANNER',
    placementId: 'plc_1',
    productId: 'prod_1',
    sourceStoreId: 'store_a',
    hostStoreId: 'store_b',
    nowMs: t0,
  });
  assert.equal(eval1.allowed, true);
  assert.equal(eval1.userSpecificPriorityMultiplier, 1.0);
  assert.equal(eval1.penalizeMerchantGlobalFairness, false);

  // Record impression for prod_1 from store_a
  userState = recordUserPartnerPickImpression({
    state: userState,
    channelId: 'STORE_BANNER',
    placementId: 'plc_1',
    productId: 'prod_1',
    sourceStoreId: 'store_a',
    hostStoreId: 'store_b',
    nowMs: t0,
  });

  // 30 seconds later, evaluating the same product on DISCOVER_MORE is suppressed by SAME_PRODUCT_COOLDOWN (600s)
  const evalSameProduct30s = evaluateCandidateFrequencyAndFatigue({
    globalConfig: cfg,
    userFatigueState: userState,
    channelId: 'DISCOVER_MORE',
    placementId: 'plc_2',
    productId: 'prod_1',
    sourceStoreId: 'store_a',
    hostStoreId: 'store_b',
    nowMs: t0 + 30 * 1000,
  });
  assert.equal(evalSameProduct30s.allowed, false);
  assert.equal(evalSameProduct30s.suppressionReason, 'SAME_PRODUCT_COOLDOWN');
  assert.equal(evalSameProduct30s.penalizeMerchantGlobalFairness, false);
  assert.equal(evalSameProduct30s.countAsMerchantMissedOpportunity, false);

  // 60 seconds later, evaluating a different product (prod_2) from the same partner store (store_a) in a new render batch
  // is suppressed by SAME_PARTNER_STORE_COOLDOWN (120s)
  const evalSamePartner60s = evaluateCandidateFrequencyAndFatigue({
    globalConfig: cfg,
    userFatigueState: userState,
    channelId: 'STORE_BANNER',
    placementId: 'plc_3',
    productId: 'prod_2',
    sourceStoreId: 'store_a',
    hostStoreId: 'store_b',
    nowMs: t0 + 60 * 1000,
  });
  assert.equal(evalSamePartner60s.allowed, false);
  assert.equal(
    evalSamePartner60s.suppressionReason,
    'SAME_PARTNER_STORE_COOLDOWN'
  );

  // After 150 seconds (> 120s partner cooldown), prod_2 from store_a is allowed
  const evalAfterPartnerCooldown = evaluateCandidateFrequencyAndFatigue({
    globalConfig: cfg,
    userFatigueState: userState,
    channelId: 'STORE_BANNER',
    placementId: 'plc_3',
    productId: 'prod_2',
    sourceStoreId: 'store_a',
    hostStoreId: 'store_b',
    nowMs: t0 + 150 * 1000,
  });
  assert.equal(evalAfterPartnerCooldown.allowed, true);
});

test('Recently clicked or viewed Partner Pick product is suppressed across channels for the configured suppression window', () => {
  const cfg = createDefaultPartnerPicksGlobalConfig();
  cfg.smartFrequency.recentlyViewedProductSuppressionSeconds = 1800; // 30 minutes

  const t0 = Date.parse('2026-11-19T12:00:00.000Z');
  let userState = createInitialUserPartnerPicksFatigueState('user_beta', t0);

  userState = recordUserPartnerPickProductClickOrView({
    state: userState,
    productId: 'prod_clicked',
    nowMs: t0,
  });

  // 5 minutes later, prod_clicked is suppressed on REELS_FEED
  const eval5Min = evaluateCandidateFrequencyAndFatigue({
    globalConfig: cfg,
    userFatigueState: userState,
    channelId: 'REELS_FEED',
    placementId: 'plc_reels_1',
    productId: 'prod_clicked',
    sourceStoreId: 'store_a',
    hostStoreId: 'store_b',
    nowMs: t0 + 5 * 60 * 1000,
  });
  assert.equal(eval5Min.allowed, false);
  assert.equal(
    eval5Min.suppressionReason,
    'RECENTLY_VIEWED_OR_CLICKED_PRODUCT_SUPPRESSED'
  );

  // 35 minutes later (> 1800s), prod_clicked is eligible again
  const eval35Min = evaluateCandidateFrequencyAndFatigue({
    globalConfig: cfg,
    userFatigueState: userState,
    channelId: 'REELS_FEED',
    placementId: 'plc_reels_1',
    productId: 'prod_clicked',
    sourceStoreId: 'store_a',
    hostStoreId: 'store_b',
    nowMs: t0 + 35 * 60 * 1000,
  });
  assert.equal(eval35Min.allowed, true);
});

test('Gradual user-specific skip decay lowers candidate priority ONLY for that specific user and recovers over half-life', () => {
  const cfg = createDefaultPartnerPicksGlobalConfig();
  cfg.smartFrequency.userSpecificSkipDecay = {
    enabled: true,
    rapidSkipThresholdMs: 2500,
    perSkipPriorityMultiplier: 0.7,
    priorityRecoveryHalfLifeMinutes: 45,
  };

  const t0 = Date.parse('2026-11-19T12:00:00.000Z');
  let userX = createInitialUserPartnerPicksFatigueState('user_x', t0);
  const userY = createInitialUserPartnerPicksFatigueState('user_y', t0);

  // User X rapidly skips plc_reels_1 twice (at 800ms and 1200ms)
  const skip1 = recordUserPartnerPickSkip({
    state: userX,
    globalConfig: cfg,
    channelId: 'REELS_FEED',
    placementId: 'plc_reels_1',
    productId: 'prod_1',
    sourceStoreId: 'store_a',
    hostStoreId: 'store_b',
    exposureDurationMs: 800,
    nowMs: t0,
  });
  assert.equal(skip1.countedAsRapidSkip, true);
  assert.equal(skip1.newPriorityMultiplier, 0.7);
  userX = skip1.nextState;

  const skip2 = recordUserPartnerPickSkip({
    state: userX,
    globalConfig: cfg,
    channelId: 'REELS_FEED',
    placementId: 'plc_reels_1',
    productId: 'prod_1',
    sourceStoreId: 'store_a',
    hostStoreId: 'store_b',
    exposureDurationMs: 1200,
    nowMs: t0 + 1000,
  });
  assert.equal(skip2.countedAsRapidSkip, true);
  assert.equal(skip2.newPriorityMultiplier, 0.49); // 0.7^2
  userX = skip2.nextState;

  // After 45 minutes (1 half-life), User X's priority deficit (1 - 0.49 = 0.51) recovers by half (to 1 - 0.255 = 0.745)
  const evalUserXHalfLife = evaluateCandidateFrequencyAndFatigue({
    globalConfig: cfg,
    userFatigueState: userX,
    channelId: 'REELS_FEED',
    placementId: 'plc_reels_1',
    productId: 'prod_1',
    sourceStoreId: 'store_a',
    hostStoreId: 'store_b',
    nowMs: t0 + 1000 + 45 * 60 * 1000,
  });
  assert.equal(evalUserXHalfLife.userSpecificPriorityMultiplier, 0.745);

  // Zero Global Merchant Penalty: User Y is completely unaffected and still evaluates plc_reels_1 at 1.0 priority
  const evalUserY = evaluateCandidateFrequencyAndFatigue({
    globalConfig: cfg,
    userFatigueState: userY,
    channelId: 'REELS_FEED',
    placementId: 'plc_reels_1',
    productId: 'prod_1',
    sourceStoreId: 'store_a',
    hostStoreId: 'store_b',
    nowMs: t0 + 2000,
  });
  assert.equal(evalUserY.allowed, true);
  assert.equal(evalUserY.userSpecificPriorityMultiplier, 1.0);
  assert.equal(evalUserY.penalizeMerchantGlobalFairness, false);
});

test('resolveSequentialInsertionIndices uses Platform Admin cadence rules and never interrupts index 0 when native items exist', () => {
  const cfg = createDefaultPartnerPicksGlobalConfig();
  // Reels default: minNativeItemsBeforeFirstInsert = 2, insertionCadenceNativeItems = 4, maxDisplayedProducts = 2
  const indices = resolveSequentialInsertionIndices({
    nativeItemsCount: 8,
    eligiblePartnerItemsCount: 3,
    channelConfig: cfg.channels.REELS_FEED,
  });

  // First insert after 2 native items (index 2), second after 4 more native items (index 6)
  assert.deepEqual(indices, [2, 6]);
  assert.ok(!indices.includes(0));
});
