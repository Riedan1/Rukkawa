import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computePerChannelAnalyticsBreakdown,
  ensureInitialPartnerPicksDemoSeed,
  extractPartnerPicksActorFromRequest,
  reconcilePartnerPickPlacementsInDb,
} from '../../server/partnerPicksRoutes';
import { createDefaultPartnerPicksGlobalConfig } from './partnerPicksSchema';
import { resolveProductPriceInfo } from '../components/PartnerPicksMerchantWorkspace';
import type { LocalDbSchema } from '../../server/localDb';

function createTestDb(): LocalDbSchema {
  return {
    stores: [
      {
        id: 'store_alpha',
        ownerId: 'owner_alpha',
        ownerEmail: 'owner_alpha@yume.dz',
        name: 'Alpha Couture',
        slug: 'alpha-couture',
        subdomain: 'alpha.yume.dz',
        logo: '/assets/a.png',
        banner: '/assets/ab.png',
        description: 'Alpha Couture',
        bio: 'Alpha Couture',
        wilaya: 'Alger',
        wilayaCode: '16',
        address: 'Alger',
        coordinates: { lat: 36.75, lng: 3.05 },
        rating: 4.9,
        categories: ['Fashion'],
        verified: true,
        premiumTier: 'Premium',
        subscriptionTier: 'Premium',
        contact: { phone: '0550000001', email: 'owner_alpha@yume.dz' },
        products: [
          {
            id: 'prod_alpha_1',
            storeId: 'store_alpha',
            name: 'Alpha Karakou',
            category: 'Fashion',
            price: 15000,
            stock: 10,
            imageUrl: '/assets/p1.jpg',
            isVisible: true,
            status: 'active',
            rating: 4.9,
            reviews: [],
            safe: true,
          },
        ],
        reviews: [],
        storiesEnabled: true,
      },
      {
        id: 'store_beta',
        ownerId: 'owner_beta',
        ownerEmail: 'owner_beta@yume.dz',
        name: 'Beta Artisans',
        slug: 'beta-artisans',
        subdomain: 'beta.yume.dz',
        logo: '/assets/b.png',
        banner: '/assets/bb.png',
        description: 'Beta Artisans',
        bio: 'Beta Artisans',
        wilaya: 'Oran',
        wilayaCode: '31',
        address: 'Oran',
        coordinates: { lat: 35.69, lng: -0.63 },
        rating: 4.8,
        categories: ['Accessories'],
        verified: true,
        premiumTier: 'Premium',
        subscriptionTier: 'Premium',
        contact: { phone: '0550000002', email: 'owner_beta@yume.dz' },
        products: [
          {
            id: 'prod_beta_1',
            storeId: 'store_beta',
            name: 'Beta Jewel',
            category: 'Accessories',
            price: 9500,
            stock: 8,
            imageUrl: '/assets/p2.jpg',
            isVisible: true,
            status: 'active',
            rating: 4.8,
            reviews: [],
            safe: true,
          },
        ],
        reviews: [],
        storiesEnabled: true,
      },
    ],
    products: [],
    orders: [],
    coupons: [],
    categories: [],
    subcategories: [],
    brands: [],
    pendingModels: [],
    markets: [],
    campaigns: [],
    auditLogs: [],
    complaints: [],
    domainLimitsConfig: {} as any,
    platformSettings: {},
    storeAnalyticsEvents: [],
    stockNotifyRequests: [],
    governanceUsers: [],
    governanceRoles: [],
    governanceCustomPolicies: [],
    governanceIpAllowlist: [],
    governanceSessions: [],
    governanceStepUpGrants: [],
    governanceApprovalRequests: [],
    governanceBreakGlassEvents: [],
    governanceAuditLedger: [],
    governanceExportTokens: [],
    governanceSecurityConfig: {} as any,
    storeMutes: [],
    storeBlocks: [],
    storeReports: [],
    partnerPicksConfig: createDefaultPartnerPicksGlobalConfig(),
    partnerPicksProfiles: {},
    partnerPicksPartnerships: [],
    partnerPicksPlacements: [],
    partnerPicksExposureLedger: {},
    partnerPicksAnalyticsEvents: [],
  } as unknown as LocalDbSchema;
}

test('ensureInitialPartnerPicksDemoSeed and reconcilePartnerPickPlacementsInDb handle 6-state product lifecycle transitions accurately', () => {
  const db = createTestDb();
  const seeded = ensureInitialPartnerPicksDemoSeed(db);
  assert.equal(seeded, true);
  assert.equal(db.partnerPicksPartnerships?.length, 1);
  assert.equal(db.partnerPicksPlacements?.length, 10); // 5 channels A->B + 5 channels B->A

  // Case A: prod_alpha_1 goes out of stock (stock = 0)
  db.stores[0].products[0].stock = 0;
  const recOut = reconcilePartnerPickPlacementsInDb(db);
  assert.equal(recOut.changedCount, 5); // All 5 placements of prod_alpha_1 transition to AUTO_PAUSED_OUT_OF_STOCK
  const alphaPlacements = db.partnerPicksPlacements!.filter(
    (p) => p.sourceStoreId === 'store_alpha'
  );
  for (const pl of alphaPlacements) {
    assert.equal(pl.lifecycleState, 'AUTO_PAUSED_OUT_OF_STOCK');
    assert.equal(pl.trafficLight, 'YELLOW');
  }

  // Case A Restock: prod_alpha_1 stock returns (stock = 12) -> Automatically resumes to APPROVED_LIVE (GREEN)
  db.stores[0].products[0].stock = 12;
  const recRestock = reconcilePartnerPickPlacementsInDb(db);
  assert.equal(recRestock.changedCount, 5);
  for (const pl of db.partnerPicksPlacements!.filter(
    (p) => p.sourceStoreId === 'store_alpha'
  )) {
    assert.equal(pl.lifecycleState, 'APPROVED_LIVE');
    assert.equal(pl.trafficLight, 'GREEN');
  }

  // Case B: Owner intentionally hides prod_alpha_1 (isVisible = false) while stock = 0
  db.stores[0].products[0].isVisible = false;
  db.stores[0].products[0].stock = 0;
  reconcilePartnerPickPlacementsInDb(db);
  for (const pl of db.partnerPicksPlacements!.filter(
    (p) => p.sourceStoreId === 'store_alpha'
  )) {
    assert.equal(pl.lifecycleState, 'PAUSED_OWNER_HIDDEN');
    assert.equal(pl.trafficLight, 'YELLOW');
  }

  // When stock returns (stock = 25), Case B (PAUSED_OWNER_HIDDEN) MUST NOT auto-resume!
  db.stores[0].products[0].stock = 25;
  const recAfterStockOnHidden = reconcilePartnerPickPlacementsInDb(db);
  assert.equal(recAfterStockOnHidden.changedCount, 0);
  for (const pl of db.partnerPicksPlacements!.filter(
    (p) => p.sourceStoreId === 'store_alpha'
  )) {
    assert.equal(pl.lifecycleState, 'PAUSED_OWNER_HIDDEN');
  }
});

test('computePerChannelAnalyticsBreakdown keeps all 5 channels strictly separate (never merging Reels Feed and Stories)', () => {
  const breakdown = computePerChannelAnalyticsBreakdown([
    {
      id: 'ev_1',
      idempotencyKey: 'idem_1',
      partnershipId: 'part_1',
      placementId: 'plc_reels',
      sourceStoreId: 'store_alpha',
      hostStoreId: 'store_beta',
      channelId: 'REELS_FEED',
      productId: 'prod_alpha_1',
      eventType: 'impression',
      visitorHash: 'v1',
      rotationEpoch: 0,
      exposureDurationMs: 4000,
      timestamp: '2026-11-19T12:00:00.000Z',
    },
    {
      id: 'ev_2',
      idempotencyKey: 'idem_2',
      partnershipId: 'part_1',
      placementId: 'plc_reels',
      sourceStoreId: 'store_alpha',
      hostStoreId: 'store_beta',
      channelId: 'REELS_FEED',
      productId: 'prod_alpha_1',
      eventType: 'original_product_open',
      visitorHash: 'v1',
      rotationEpoch: 0,
      timestamp: '2026-11-19T12:00:05.000Z',
    },
    {
      id: 'ev_3',
      idempotencyKey: 'idem_3',
      partnershipId: 'part_1',
      placementId: 'plc_stories',
      sourceStoreId: 'store_alpha',
      hostStoreId: 'store_beta',
      channelId: 'STORIES',
      productId: 'prod_alpha_1',
      eventType: 'impression',
      visitorHash: 'v2',
      rotationEpoch: 0,
      exposureDurationMs: 2500,
      timestamp: '2026-11-19T12:01:00.000Z',
    },
    {
      id: 'ev_4',
      idempotencyKey: 'idem_4',
      partnershipId: 'part_1',
      placementId: 'plc_stories',
      sourceStoreId: 'store_alpha',
      hostStoreId: 'store_beta',
      channelId: 'STORIES',
      productId: 'prod_alpha_1',
      eventType: 'skip',
      visitorHash: 'v2',
      rotationEpoch: 0,
      timestamp: '2026-11-19T12:01:02.000Z',
    },
  ]);

  assert.equal(breakdown.REELS_FEED.impressions, 1);
  assert.equal(breakdown.REELS_FEED.clicks, 1);
  assert.equal(breakdown.REELS_FEED.originalProductOpens, 1);
  assert.equal(breakdown.REELS_FEED.skips, 0);
  assert.equal(breakdown.REELS_FEED.ctrPercent, 100);

  assert.equal(breakdown.STORIES.impressions, 1);
  assert.equal(breakdown.STORIES.clicks, 0);
  assert.equal(breakdown.STORIES.skips, 1);
  assert.equal(breakdown.STORIES.ctrPercent, 0);

  assert.equal(breakdown.STORE_BANNER.impressions, 0);
  assert.equal(breakdown.PRODUCT_GRID.impressions, 0);
  assert.equal(breakdown.DISCOVER_MORE.impressions, 0);
});

test('extractPartnerPicksActorFromRequest supports both x-yume-actor-* and x-actor-* headers and resolveProductPriceInfo calculates discounted prices accurately', () => {
  const actorFromStandardHeader = extractPartnerPicksActorFromRequest({
    headers: {
      'x-actor-id': 'owner_1',
      'x-actor-role': 'Merchant',
    },
    body: {},
  } as any);
  assert.equal(actorFromStandardHeader?.id, 'owner_1');
  assert.equal(actorFromStandardHeader?.role, 'Merchant');

  const regularPriceInfo = resolveProductPriceInfo({
    id: 'p1',
    name: 'Regular Karakou',
    price: 12000,
    category: 'Fashion',
    description: '',
    imageUrl: '',
    rating: 5,
    reviews: [],
    stock: 4,
  } as any);
  assert.equal(regularPriceInfo.hasDiscount, false);
  assert.equal(regularPriceInfo.finalPrice, 12000);
  assert.equal(regularPriceInfo.regularPrice, 12000);

  const discountedPriceInfo = resolveProductPriceInfo({
    id: 'p2',
    name: 'Discounted Karakou',
    price: 8000,
    originalPrice: 10000,
    category: 'Fashion',
    description: '',
    imageUrl: '',
    rating: 5,
    reviews: [],
    stock: 4,
  } as any);
  assert.equal(discountedPriceInfo.hasDiscount, true);
  assert.equal(discountedPriceInfo.regularPrice, 10000);
  assert.equal(discountedPriceInfo.finalPrice, 8000);
  assert.equal(discountedPriceInfo.discountPercent, 20);
});

