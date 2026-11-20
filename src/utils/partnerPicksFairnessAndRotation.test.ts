import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recordEventInBidirectionalExposureLedger,
  computePairwisePartnerFairnessScores,
  resolveActiveHostPartnerRotationContext,
  resolveChannelPartnerPicksForHostContext,
} from './partnerPicksFairnessAndRotation';
import {
  createDefaultPartnerPicksGlobalConfig,
  createDefaultMerchantPartnerPicksProfile,
  createInitialBidirectionalExposureLedger,
  PARTNER_PICK_CHANNEL_IDS,
} from './partnerPicksSchema';
import type {
  MerchantStore,
  PartnerPickChannelId,
  PartnerPickProductPlacement,
  PartnerPicksPartnership,
} from '../types';

function makeStore(id: string, name: string): MerchantStore {
  return {
    id,
    ownerId: `owner_${id}`,
    ownerEmail: `${id}@yume.dz`,
    name,
    slug: id,
    subdomain: `${id}.yume.dz`,
    logo: `/assets/${id}.png`,
    banner: `/assets/${id}_banner.png`,
    description: name,
    bio: name,
    wilaya: 'Alger',
    wilayaCode: '16',
    address: 'Alger',
    coordinates: { lat: 36.75, lng: 3.05 },
    rating: 4.9,
    categories: ['Fashion'],
    verified: true,
    premiumTier: 'Premium Plus',
    subscriptionTier: 'Premium Plus',
    contact: { phone: '0550000000', email: `${id}@yume.dz` },
    products: [
      {
        id: `prod_${id}_1`,
        storeId: id,
        name: `${name} Signature 1`,
        category: 'Fashion',
        price: 12000,
        stock: 20,
        imageUrl: `/assets/${id}_p1.jpg`,
        isVisible: true,
        status: 'active',
        rating: 4.9,
        reviews: [],
        safe: true,
      },
    ],
    reviews: [],
    storiesEnabled: true,
  };
}

function makeActivePartnership(
  id: string,
  storeAId: string,
  storeBId: string
): PartnerPicksPartnership {
  return {
    id,
    storeAId,
    storeAName: storeAId,
    storeBId,
    storeBName: storeBId,
    initiatedByStoreId: storeAId,
    status: 'ACTIVE',
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
    },
    createdAt: '2026-11-19T12:00:00.000Z',
    updatedAt: '2026-11-19T12:00:00.000Z',
  };
}

function makeLivePlacementForChannel(
  id: string,
  partnershipId: string,
  sourceStoreId: string,
  hostStoreId: string,
  productId: string,
  channelId: PartnerPickChannelId
): PartnerPickProductPlacement {
  const opt = {
    optionId: `opt_${id}`,
    channelId,
    bannerSlotIndex: channelId === 'STORE_BANNER' ? 1 : undefined,
    gridCoordinate:
      channelId === 'PRODUCT_GRID' ? { row: 1, col: 2 } : undefined,
    discoverCarouselIndex: channelId === 'DISCOVER_MORE' ? 1 : undefined,
    sequentialPositionHint:
      channelId === 'REELS_FEED' || channelId === 'STORIES'
        ? ('MID_SEQUENCE' as const)
        : undefined,
    label: `${channelId} option`,
  };
  return {
    id,
    partnershipId,
    sourceStoreId,
    hostStoreId,
    productId,
    channelId,
    proposedOptions: [opt],
    selectedOptionId: opt.optionId,
    selectedOption: opt,
    proposerFinalApproved: true,
    trafficLight: 'GREEN',
    lifecycleState: 'APPROVED_LIVE',
    activityHistory: [],
    createdAt: '2026-11-19T12:00:00.000Z',
    updatedAt: '2026-11-19T12:00:00.000Z',
  };
}

test('Bidirectional Exposure Ledger tracks directionAOnB and directionBOnA independently across all 5 channels and never penalizes on skip', () => {
  const cfg = createDefaultPartnerPicksGlobalConfig();
  const partnership = makeActivePartnership('part_ab', 'store_a', 'store_b');
  let ledger = createInitialBidirectionalExposureLedger(
    'part_ab',
    'store_a',
    'store_b'
  );

  // Record impression for A's product on B's STORE_BANNER (directionAOnB)
  ledger = recordEventInBidirectionalExposureLedger({
    ledger,
    partnership,
    globalConfig: cfg,
    isUniqueVisitorForDirection: true,
    event: {
      id: 'evt_1',
      idempotencyKey: 'idem_1',
      partnershipId: 'part_ab',
      placementId: 'plc_1',
      sourceStoreId: 'store_a',
      hostStoreId: 'store_b',
      channelId: 'STORE_BANNER',
      productId: 'prod_store_a_1',
      eventType: 'impression',
      visitorHash: 'vis_1',
      rotationEpoch: 0,
      timestamp: '2026-11-19T12:01:00.000Z',
    },
  });

  // Record impression for B's product on A's REELS_FEED (directionBOnA)
  ledger = recordEventInBidirectionalExposureLedger({
    ledger,
    partnership,
    globalConfig: cfg,
    isUniqueVisitorForDirection: true,
    event: {
      id: 'evt_2',
      idempotencyKey: 'idem_2',
      partnershipId: 'part_ab',
      placementId: 'plc_2',
      sourceStoreId: 'store_b',
      hostStoreId: 'store_a',
      channelId: 'REELS_FEED',
      productId: 'prod_store_b_1',
      eventType: 'impression',
      visitorHash: 'vis_2',
      rotationEpoch: 0,
      exposureDurationMs: 5000,
      timestamp: '2026-11-19T12:02:00.000Z',
    },
  });

  assert.equal(ledger.directionAOnB.totalImpressions, 1);
  assert.equal(ledger.directionAOnB.byChannel.STORE_BANNER.impressions, 1);
  assert.equal(ledger.directionAOnB.byChannel.REELS_FEED.impressions, 0);

  assert.equal(ledger.directionBOnA.totalImpressions, 1);
  assert.equal(ledger.directionBOnA.byChannel.REELS_FEED.impressions, 1);
  assert.equal(
    ledger.directionBOnA.byChannel.REELS_FEED.activeExposureDurationSeconds,
    5
  );

  // Record a skip on REELS_FEED: skip counter increments, but weightedScore and opportunityFillRatePercent are NOT reduced
  const weightedScoreBeforeSkip = ledger.directionBOnA.totalWeightedScore;
  ledger = recordEventInBidirectionalExposureLedger({
    ledger,
    partnership,
    globalConfig: cfg,
    event: {
      id: 'evt_3',
      idempotencyKey: 'idem_3',
      partnershipId: 'part_ab',
      placementId: 'plc_2',
      sourceStoreId: 'store_b',
      hostStoreId: 'store_a',
      channelId: 'REELS_FEED',
      productId: 'prod_store_b_1',
      eventType: 'skip',
      visitorHash: 'vis_3',
      rotationEpoch: 0,
      timestamp: '2026-11-19T12:03:00.000Z',
    },
  });
  assert.equal(ledger.directionBOnA.totalSkips, 1);
  assert.equal(ledger.directionBOnA.totalWeightedScore, weightedScoreBeforeSkip);
});

test('Multi-Partner Dilution Protection boosts a dedicated 1-partner merchant (Store A) when Host Store B has 5 active partners', () => {
  const partnerships = [
    makeActivePartnership('part_ab', 'store_a', 'store_b'),
    makeActivePartnership('part_cb', 'store_c', 'store_b'),
    makeActivePartnership('part_db', 'store_d', 'store_b'),
    makeActivePartnership('part_eb', 'store_e', 'store_b'),
    makeActivePartnership('part_fb', 'store_f', 'store_b'),
    // Store C also has 3 other partners of its own
    makeActivePartnership('part_cx1', 'store_c', 'store_x1'),
    makeActivePartnership('part_cx2', 'store_c', 'store_x2'),
    makeActivePartnership('part_cx3', 'store_c', 'store_x3'),
  ];

  // Store A gave Store B 40 weighted exposure points at 100% opportunity fill rate
  const ledgerAB = createInitialBidirectionalExposureLedger(
    'part_ab',
    'store_a',
    'store_b'
  );
  ledgerAB.directionBOnA.totalOpportunities = 30;
  ledgerAB.directionBOnA.totalImpressions = 30;
  ledgerAB.directionBOnA.totalWeightedScore = 40;
  ledgerAB.directionBOnA.opportunityFillRatePercent = 100;

  const scores = computePairwisePartnerFairnessScores({
    hostStoreId: 'store_b',
    eligiblePartnershipsForHost: partnerships.slice(0, 5),
    allActivePartnerships: partnerships,
    exposureLedgersByPartnershipId: { part_ab: ledgerAB },
    rotationEpoch: 0,
  });

  const scoreA = scores.find((s) => s.partnerStoreId === 'store_a')!;
  const scoreC = scores.find((s) => s.partnerStoreId === 'store_c')!;

  assert.ok(
    scoreA.multiPartnerDilutionProtectionMultiplier >
      scoreC.multiPartnerDilutionProtectionMultiplier,
    'Dedicated 1-partner Store A must have higher dilution protection multiplier than multi-partner Store C'
  );
  assert.ok(
    scoreA.bilateralReciprocityRatio > scoreC.bilateralReciprocityRatio
  );
  assert.ok(scoreA.finalSelectionScore > scoreC.finalSelectionScore);
});

test('Context-Scoped Max-2-Partner-Stores Invariant holds across all 5 channels within one active host context and rotates across epochs', () => {
  const cfg = createDefaultPartnerPicksGlobalConfig();
  assert.equal(cfg.maxSimultaneousPartnerStores, 2);

  const hostStore = makeStore('host_b', 'Host Store B');
  const partnerStores = [
    makeStore('partner_a', 'Partner A'),
    makeStore('partner_c', 'Partner C'),
    makeStore('partner_d', 'Partner D'),
    makeStore('partner_e', 'Partner E'),
  ];

  const allStoresById: Record<string, MerchantStore> = {
    [hostStore.id]: hostStore,
  };
  const profilesByStoreId: Record<string, any> = {
    [hostStore.id]: createDefaultMerchantPartnerPicksProfile(hostStore.id),
  };

  const allPartnerships: PartnerPicksPartnership[] = [];
  const allPlacements: PartnerPickProductPlacement[] = [];

  for (const pStore of partnerStores) {
    allStoresById[pStore.id] = pStore;
    const prof = createDefaultMerchantPartnerPicksProfile(pStore.id);
    prof.defaultSharedProductIds = [`prod_${pStore.id}_1`];
    profilesByStoreId[pStore.id] = prof;

    const partId = `part_${pStore.id}_on_${hostStore.id}`;
    allPartnerships.push(makeActivePartnership(partId, pStore.id, hostStore.id));

    // Create approved GREEN placements for every one of the 5 channels for each of the 4 partners
    for (const chId of PARTNER_PICK_CHANNEL_IDS) {
      allPlacements.push(
        makeLivePlacementForChannel(
          `plc_${pStore.id}_${chId}`,
          partId,
          pStore.id,
          hostStore.id,
          `prod_${pStore.id}_1`,
          chId
        )
      );
    }
  }

  const discoveredPartnersAcrossEpochs = new Set<string>();

  // Simulate Refresh 1, Refresh 2, Refresh 3, Refresh 4 (epochs 0..3)
  for (let epoch = 0; epoch < 4; epoch++) {
    const { context, fairnessScores } = resolveActiveHostPartnerRotationContext({
      globalConfig: cfg,
      hostStore,
      allStoresById,
      profilesByStoreId,
      allPartnerships,
      allPlacements,
      rotationEpoch: epoch,
    });

    // Never more than 2 partner stores selected in the context
    assert.ok(
      context.selectedPartnerStoreIds.length <= 2,
      `Epoch ${epoch} selected ${context.selectedPartnerStoreIds.length} partner stores (max 2 allowed)`
    );
    assert.equal(context.selectedPartnerStoreIds.length, 2);

    // Resolve placements across ALL 5 channels (Store Banner, Product Grid, Discover More, Reels Feed, Stories)
    const distinctPartnerStoresAcrossAll5ChannelsInContext = new Set<string>();

    for (const chId of PARTNER_PICK_CHANNEL_IDS) {
      const slots = resolveChannelPartnerPicksForHostContext({
        globalConfig: cfg,
        activeContext: context,
        channelId: chId,
        hostStore,
        allStoresById,
        profilesByStoreId,
        allPartnerships,
        allPlacements,
        fairnessScores,
      });

      assert.ok(
        slots.length > 0,
        `Channel ${chId} should resolve eligible slots in epoch ${epoch}`
      );
      for (const slot of slots) {
        distinctPartnerStoresAcrossAll5ChannelsInContext.add(
          slot.sourceStore.id
        );
        discoveredPartnersAcrossEpochs.add(slot.sourceStore.id);
      }
    }

    // Confirmed Invariant: Across all 5 channels combined (including Reels and Stories),
    // never more than 2 distinct partner stores appear in one active host-store browsing context!
    assert.ok(
      distinctPartnerStoresAcrossAll5ChannelsInContext.size <= 2,
      `Across all 5 channels in epoch ${epoch}, saw ${distinctPartnerStoresAcrossAll5ChannelsInContext.size} distinct partner stores (must be <= 2)`
    );
  }

  // Across Refresh 1..4, rotation naturally discovers all 4 eligible partner stores
  assert.equal(discoveredPartnersAcrossEpochs.size, 4);
});
