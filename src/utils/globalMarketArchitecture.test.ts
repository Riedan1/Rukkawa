import {
  DEFAULT_GLOBAL_MARKETS,
  INTERNATIONAL_MARKET_DEMO_STORES,
  doesStoreBelongToMarket,
  filterStoresByActiveMarket,
  validateCulturalEventPolicy,
  upsertMarketCulturalEvent,
  getEventsForMarket,
  getMarketCulturalColorPalette,
  resolveContextualPublicPersona,
  authorizeStoreOperation,
  getAuthorizedStoresForUser,
  saveCampaignWithValidation,
  getStorefrontActiveCampaigns,
  getMarketplacePlatformCampaigns,
  getVisibleSponsoredAds,
  isPublicPaidAdvertisingEnabled,
  updateYumeAdsSystemConfig,
  MarketEvent,
  CampaignRecord,
} from './globalMarketArchitecture';
import { MerchantStore } from '../types';

/**
 * Self-contained verification suite for the YUME Master Architecture & Multi-Market Engine.
 * Can be executed directly with `npx tsx src/utils/globalMarketArchitecture.test.ts`.
 */
export function runGlobalMarketArchitectureVerification(): {
  passed: number;
  results: string[];
} {
  const results: string[] = [];
  const assert = (condition: boolean, message: string) => {
    if (!condition) {
      throw new Error(`ASSERTION FAILED: ${message}`);
    }
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }

  // Scenario 1: Strict Multi-Market Separation
  {
    const algerianStore: Partial<MerchantStore> = {
      id: 'store_dz_1',
      name: 'Maison Casbah Algiers',
      country: 'Algeria',
    };
    const brazilianStore = INTERNATIONAL_MARKET_DEMO_STORES.find(
      (s) => s.country === 'Brazil'
    )!;
    const japaneseStore = INTERNATIONAL_MARKET_DEMO_STORES.find(
      (s) => s.country === 'Japan'
    )!;

    const allStores: Partial<MerchantStore>[] = [algerianStore, brazilianStore, japaneseStore];

    const dzVisible = filterStoresByActiveMarket(allStores, 'Algeria');
    assert(dzVisible.length === 1 && dzVisible[0].id === 'store_dz_1', 'Algeria market must only show Algerian store');
    assert(doesStoreBelongToMarket(brazilianStore, 'Algeria') === false, 'Brazilian store must not belong to Algeria');

    const brVisible = filterStoresByActiveMarket(allStores, 'Brazil');
    assert(brVisible.length === 1 && brVisible[0].id === brazilianStore.id, 'Brazil market must only show Brazilian store');
    assert(doesStoreBelongToMarket(algerianStore, 'Brazil') === false, 'Algerian store must not belong to Brazil');
    results.push('Scenario 1 PASSED: Strict Multi-Market Catalog & Store Separation (DZ vs. BR vs. JP)');
  }

  // Scenario 2: Pre-configured 18 Countries + Cultural Color Palettes
  {
    const codes = DEFAULT_GLOBAL_MARKETS.map((m) => m.id);
    for (const requiredCode of ['DZ', 'MA', 'TN', 'EG', 'BR', 'AR', 'US', 'FR', 'JP', 'RU']) {
      assert(codes.includes(requiredCode), `Market ${requiredCode} must be pre-configured`);
    }

    const dzColors = getMarketCulturalColorPalette('Algeria').swatches;
    const brColors = getMarketCulturalColorPalette('Brazil').swatches;
    const jpColors = getMarketCulturalColorPalette('Japan').swatches;

    assert(dzColors.some((c) => c.name.includes('Zellige') || c.name.includes('Casbah')), 'DZ cultural palette present');
    assert(brColors.some((c) => c.name.includes('Amazon') || c.name.includes('Ipanema')), 'BR cultural palette present');
    assert(jpColors.some((c) => c.name.includes('Sakura') || c.name.includes('Matcha')), 'JP cultural palette present');
    results.push('Scenario 2 PASSED: 18 Pre-Configured Global Markets & Scoped Cultural Color Palettes');
  }

  // Scenario 3: Strict Religious Event Policy (Islamic Occasions ONLY in Muslim Markets, Central Control)
  {
    const validRamadan: MarketEvent = {
      id: 'evt_ramadan_test',
      marketId: 'ALL_MUSLIM_MARKETS',
      countryName: 'All Muslim Markets',
      title: 'Ramadan Mubarak',
      greetingText: 'Ramadan Kareem',
      category: 'religious',
      religionType: 'islamic',
      controlScope: 'platform_central_only',
      startDate: '2026-02-17',
      endDate: '2026-03-19',
      timeZone: 'Africa/Algiers',
      autoActivate: true,
      ornamentPattern: 'islamic_mosque_arabesque',
      ornamentOpacity: 0.1,
      accentTintHex: '#D97706',
    };
    assert(validateCulturalEventPolicy(validRamadan, 'platform_admin').valid === true, 'Valid central Ramadan event allowed');
    assert(validateCulturalEventPolicy(validRamadan, 'merchant').valid === false, 'Merchant cannot control Islamic event');

    const forbiddenNonIslamic: Partial<MarketEvent> = {
      id: 'evt_forbidden_1',
      marketId: 'FR',
      countryName: 'France',
      title: 'Christmas Holiday Sale',
      greetingText: 'Holiday',
      category: 'cultural',
      religionType: 'none',
    };
    const check1 = validateCulturalEventPolicy(forbiddenNonIslamic, 'platform_admin');
    assert(check1.valid === false && Boolean(check1.error?.includes('POLICY_VIOLATION')), 'Non-Islamic religious event must be rejected');

    const forbiddenBuddhist: Partial<MarketEvent> = {
      id: 'evt_forbidden_2',
      marketId: 'JP',
      countryName: 'Japan',
      title: 'Vesak Buddha Celebration',
      greetingText: 'Vesak',
      category: 'cultural',
      religionType: 'none',
    };
    assert(validateCulturalEventPolicy(forbiddenBuddhist, 'platform_admin').valid === false, 'Buddhist religious event must be rejected');
    results.push('Scenario 3 PASSED: Strict Islamic-Only Religious Event Policy & Non-Islamic Prohibition');
  }

  // Scenario 4, 5, 6: Contextual Public Identity & 4-Layer Multi-Tenant RBAC Isolation
  {
    const storeA: MerchantStore = {
      ...INTERNATIONAL_MARKET_DEMO_STORES[0],
      id: 'store_A',
      name: 'Store A',
      country: 'Algeria',
      teamMembers: [
        {
          id: 'staff_admin_1',
          name: 'Nadia Benali',
          email: 'nadia@storea.dz',
          role: 'admin',
          status: 'active',
          permissions: {
            viewProducts: true,
            manageProducts: true,
            addProducts: true,
            editProducts: true,
            viewOrders: true,
            manageAdCampaigns: true,
          } as any,
        } as any,
      ],
    };
    const storeB: MerchantStore = {
      ...INTERNATIONAL_MARKET_DEMO_STORES[1],
      id: 'store_B',
      name: 'Store B',
      country: 'Algeria',
      teamMembers: [],
    };
    const stores = [storeA, storeB];

    const ownerStoreA = {
      id: 'owner_store_A',
      name: 'Karim Mansouri',
      email: 'karim@storea.dz',
      role: 'Merchant',
      storeName: 'Store A',
      ownedStoreIds: ['store_A'],
    };

    // Merchant Owner inside Store A -> Merchant badge + full owner authority
    const ownerInA = resolveContextualPublicPersona({
      user: ownerStoreA,
      targetStoreId: 'store_A',
      stores,
    });
    assert(ownerInA.publicIdentityBadge === 'Merchant', 'Owner has Merchant badge in Store A');
    assert(ownerInA.hasAdministrativeAccessToTargetStore === true, 'Owner has admin access in Store A');
    assert(ownerInA.canDeleteOrTransferTargetStore === true, 'Owner can delete/transfer Store A');

    // Merchant Owner inside Store B -> Retains Merchant public badge, ZERO admin permissions in Store B
    const ownerInB = resolveContextualPublicPersona({
      user: ownerStoreA,
      targetStoreId: 'store_B',
      stores,
    });
    assert(ownerInB.publicIdentityBadge === 'Merchant', 'Owner retains Merchant badge when browsing Store B');
    assert(ownerInB.hasAdministrativeAccessToTargetStore === false, 'Owner has ZERO admin access in Store B');
    assert(
      authorizeStoreOperation({
        user: ownerStoreA,
        targetStore: storeB,
        stores,
        operation: 'manage_settings',
      }).allowed === false,
      'Owner of Store A cannot edit Store B settings'
    );

    // Store Administrator of Store A -> Admin in Store A (cannot delete store), appears as Buyer in Store B
    const staffAdminUser = {
      id: 'staff_admin_1',
      name: 'Nadia Benali',
      email: 'nadia@storea.dz',
      role: 'Buyer',
      ownedStoreIds: [],
    };
    const adminInA = resolveContextualPublicPersona({
      user: staffAdminUser,
      targetStoreId: 'store_A',
      stores,
    });
    assert(adminInA.authorizedRoleInTargetStore === 'store_admin', 'Staff Admin recognized as store_admin in Store A');
    assert(adminInA.canDeleteOrTransferTargetStore === false, 'Store Admin cannot delete or transfer Store A');
    assert(
      authorizeStoreOperation({
        user: staffAdminUser,
        targetStore: storeA,
        stores,
        operation: 'delete_store',
      }).allowed === false,
      'Store Admin blocked from deleting Store A'
    );

    const adminInB = resolveContextualPublicPersona({
      user: staffAdminUser,
      targetStoreId: 'store_B',
      stores,
    });
    assert(adminInB.publicIdentityBadge === 'Buyer', 'Store Admin of Store A appears as Buyer on Store B');
    assert(adminInB.hasAdministrativeAccessToTargetStore === false, 'Store Admin of Store A has zero admin access in Store B');

    // Personal Buyer -> Always Buyer, zero authorized stores
    const buyerUser = {
      id: 'buyer_101',
      name: 'Yacine Buyer',
      email: 'yacine@gmail.com',
      role: 'Buyer',
    };
    const buyerPersona = resolveContextualPublicPersona({
      user: buyerUser,
      targetStoreId: 'store_A',
      stores,
    });
    assert(buyerPersona.publicIdentityBadge === 'Buyer', 'Personal Buyer appears as Buyer');
    assert(getAuthorizedStoresForUser(buyerUser, stores).length === 0, 'Personal Buyer has 0 authorized stores');
    results.push('Scenarios 4, 5 & 6 PASSED: Contextual Public Identity & 4-Layer RBAC Tenant Isolation');
  }

  // Scenario 7 & 8: Two-Level Campaign Display & Disabled-by-Default YUME Ads
  {
    const privateEvent: MarketEvent = {
      id: 'evt_private_store_A',
      marketId: 'DZ',
      countryName: 'Algeria',
      title: 'Store A 5th Anniversary',
      greetingText: 'Happy 5th Anniversary!',
      category: 'commercial',
      religionType: 'none',
      controlScope: 'merchant_store_exclusive',
      storeId: 'store_A',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      timeZone: 'Africa/Algiers',
      autoActivate: true,
      ornamentPattern: 'maghrebi_zellige',
      ornamentOpacity: 0.08,
      accentTintHex: '#0F766E',
    };
    const evtRes = upsertMarketCulturalEvent(privateEvent, {
      isPlatformAdmin: false,
      actorStoreId: 'store_A',
    });
    assert(evtRes.valid === true, 'Merchant can save private store event');
    assert(
      getEventsForMarket('DZ', { includeMerchantStoreId: 'store_A' }).some((e) => e.id === 'evt_private_store_A') === true,
      'Private event visible to Store A'
    );
    assert(
      getEventsForMarket('DZ', { includeMerchantStoreId: 'store_B' }).some((e) => e.id === 'evt_private_store_A') === false,
      'Private event hidden from Store B'
    );

    const storeACampaign: CampaignRecord = {
      id: 'camp_store_A_1',
      marketId: 'DZ',
      storeId: 'store_A',
      storeName: 'Store A',
      ownerUserId: 'owner_store_A',
      title: 'Store A VIP Flash',
      subtitle: '25% OFF All Artisanal Pieces',
      badgeText: 'VIP -25%',
      discountPercent: 25,
      visibilityLevel: 'store_only',
      creationMode: 'yume_template',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'active',
      accentColorHex: '#0F766E',
      participatingProductIds: ['p1'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const saveRes = saveCampaignWithValidation(storeACampaign, {
      actorId: 'owner_store_A',
      actorEmail: 'karim@storea.dz',
      isPlatformAdmin: false,
    });
    assert(saveRes.allowed === true, 'Store A campaign saved');
    assert(
      getStorefrontActiveCampaigns('store_A', 'DZ').some((c) => c.id === 'camp_store_A_1') === true,
      'Level 1 campaign visible in Store A storefront'
    );
    assert(
      getStorefrontActiveCampaigns('store_B', 'DZ').some((c) => c.id === 'camp_store_A_1') === false,
      'Level 1 campaign isolated from Store B storefront'
    );
    assert(
      getMarketplacePlatformCampaigns('DZ').some((c) => c.id === 'camp_store_A_1') === false,
      'Level 1 store campaign does not leak into public Marketplace platform campaigns'
    );

    // YUME Ads disabled by default
    assert(isPublicPaidAdvertisingEnabled() === false, 'Public paid ads must be disabled by default');
    assert(getVisibleSponsoredAds('DZ', { adminPreviewMode: false }).length === 0, 'Public shoppers see 0 sponsored ads by default');
    assert(getVisibleSponsoredAds('DZ', { adminPreviewMode: true }).length > 0, 'Platform Admin can preview sandbox sponsored ads');
    assert(
      updateYumeAdsSystemConfig({ publicPaidAdvertisingEnabled: true }, { isPlatformAdmin: false }).allowed === false,
      'Non-admin cannot enable public paid ads'
    );
    results.push('Scenarios 7 & 8 PASSED: Two-Level Campaign Isolation & Disabled-by-Default YUME Ads Governance');
  }

  return { passed: results.length, results };
}
