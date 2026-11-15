import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultOffersConfig,
  calculateOfferTierPricing,
  applyOfferTypePreset,
  extractStep3VariantAxes,
  normalizeUnitVariantSelections,
  formatOfferSelectionSummary,
  resolveMostPopularTierId,
  recordOfferTierSale,
  resolveVariantColorHex,
  DEFAULT_MOST_POPULAR_SALES_THRESHOLD,
  resolveUnitVariantInfo,
  isVariantOptionValueOutOfStock,
  calculatePlayingCardTransforms,
} from './offersLogic.ts';

test('createDefaultOffersConfig uses DZD base price, Single/Duo/Trio titles, percent_off defaults, and accurate savings', () => {
  const cfg = createDefaultOffersConfig(3500);
  assert.equal(cfg.enabled, false);
  assert.equal(cfg.headerTitle, 'Buy More Save More');
  assert.equal(cfg.offerType, 'percent_off');
  assert.equal(cfg.themeColorId, 'berry');
  assert.equal(cfg.tiers.length, 3);
  assert.equal(cfg.merchantMostPopularTierId, 'tier-2');
  assert.equal(cfg.features.freeGift, false);
  assert.equal(cfg.features.addImage, true);
  assert.equal(cfg.features.tierBadge, true);
  assert.equal(cfg.features.offerLabel, false);
  assert.equal(cfg.features.variants, true);

  // Titles match reference screenshot ("Single", "Duo", "Trio")
  assert.equal(cfg.tiers[0].title, 'Single');
  assert.equal(cfg.tiers[1].title, 'Duo');
  assert.equal(cfg.tiers[2].title, 'Trio');

  // Gifts are optional by default (no pre-forced gifts)
  assert.equal(cfg.tiers[0].freeGifts.length, 0);
  assert.equal(cfg.tiers[1].freeGifts.length, 0);
  assert.equal(cfg.tiers[2].freeGifts.length, 0);

  // Tier 1: Single (3500 DZD, 1 unit, 0% off)
  const t1 = calculateOfferTierPricing(cfg.tiers[0], 3500, 'percent_off');
  assert.equal(t1.totalUnits, 1);
  assert.equal(t1.finalPrice, 3500);
  assert.equal(t1.compareAtTotal, 3500);
  assert.equal(t1.savingsPercent, 0);
  assert.equal(t1.effectiveOfferLabel, 'Base Price');

  // Tier 2: Duo (5950 DZD, compare at 7000 DZD, 15% OFF, Save 15%)
  const t2 = calculateOfferTierPricing(cfg.tiers[1], 3500, 'percent_off');
  assert.equal(t2.totalUnits, 2);
  assert.equal(t2.finalPrice, 5950);
  assert.equal(t2.compareAtTotal, 7000);
  assert.equal(t2.savingsAmount, 1050);
  assert.equal(t2.savingsPercent, 15);
  assert.equal(t2.effectiveOfferLabel, '15% OFF');

  // Tier 3: Trio (7875 DZD, compare at 10500 DZD, 25% OFF, Save 25%)
  const t3 = calculateOfferTierPricing(cfg.tiers[2], 3500, 'percent_off');
  assert.equal(t3.totalUnits, 3);
  assert.equal(t3.finalPrice, 7875);
  assert.equal(t3.compareAtTotal, 10500);
  assert.equal(t3.savingsAmount, 2625);
  assert.equal(t3.savingsPercent, 25);
  assert.equal(t3.effectiveOfferLabel, '25% OFF');
});

test('calculateOfferTierPricing supports all offer types, direct customFinalPrice editing, and prevents misleading savings', () => {
  const cfg = createDefaultOffersConfig(2500);

  const pctCfg = applyOfferTypePreset(cfg, 'percent_off', 2500);
  const pctTier2 = calculateOfferTierPricing(pctCfg.tiers[1], 2500, 'percent_off');
  assert.equal(pctTier2.totalUnits, 2);
  assert.equal(pctTier2.compareAtTotal, 5000);
  assert.equal(pctTier2.finalPrice, 4250); // 15% off 5000
  assert.equal(pctTier2.effectiveOfferLabel, '15% OFF');

  // Direct merchant offer price edit on Single ($100 vs $120 compare-at -> You save $20)
  const editedSingle = {
    ...cfg.tiers[0],
    customFinalPrice: 100,
    customCompareAtPrice: 120,
  };
  const singleRes = calculateOfferTierPricing(editedSingle, 120, 'percent_off');
  assert.equal(singleRes.finalPrice, 100);
  assert.equal(singleRes.compareAtTotal, 120);
  assert.equal(singleRes.savingsAmount, 20);

  // Direct merchant offer price edit on Duo ($150 vs $200 compare-at -> You save $50)
  const editedDuo = {
    ...pctCfg.tiers[1],
    customFinalPrice: 150,
    customCompareAtPrice: 200,
  };
  const duoRes = calculateOfferTierPricing(editedDuo, 100, 'percent_off');
  assert.equal(duoRes.finalPrice, 150);
  assert.equal(duoRes.compareAtTotal, 200);
  assert.equal(duoRes.savingsAmount, 50);

  const flatCfg = applyOfferTypePreset(cfg, 'flat_off', 2000);
  const flatTier2 = calculateOfferTierPricing(flatCfg.tiers[1], 2000, 'flat_off');
  assert.equal(flatTier2.totalUnits, 2);
  assert.equal(flatTier2.compareAtTotal, 4000);
  assert.equal(flatTier2.finalPrice, 3400); // 600 DZD off 4000

  const fixedCfg = applyOfferTypePreset(cfg, 'fixed_price', 2000);
  const fixedTier3 = calculateOfferTierPricing(fixedCfg.tiers[2], 2000, 'fixed_price');
  assert.equal(fixedTier3.totalUnits, 3);
  assert.equal(fixedTier3.compareAtTotal, 6000);
  assert.equal(fixedTier3.finalPrice, 4500); // fixed 4500 DZD for 3-pack

  // Anti-misleading savings: fixed_price higher than original price is clamped to compareAtTotal with 0% savings
  const misleadingTier = {
    ...fixedCfg.tiers[1],
    totalUnits: 2,
    buyQty: 2,
    discountValue: 9999, // Higher than 2 * 2000 = 4000
    offerLabel: '50% OFF',
  };
  const safeResult = calculateOfferTierPricing(misleadingTier, 2000, 'fixed_price');
  assert.equal(safeResult.compareAtTotal, 4000);
  assert.equal(safeResult.finalPrice, 4000);
  assert.equal(safeResult.savingsAmount, 0);
  assert.equal(safeResult.savingsPercent, 0);
  assert.equal(safeResult.effectiveOfferLabel, 'Base Price');
});

test('extractStep3VariantAxes reuses Step 3 sizes, colors, and resolves color swatch hexes', () => {
  const axes = extractStep3VariantAxes({
    sizes: ['Small', 'Medium', 'Large'],
    colors: [{ name: 'Pink', hex: '#f48fa7' }, { name: 'Black', hex: '#000000' }],
    variantAttrs: [{ name: 'Material', values: ['Cotton', 'Silk'] }],
  });
  assert.equal(axes.length, 3);
  assert.deepEqual(axes[0], { name: 'Color', options: ['Pink', 'Black'] });
  assert.deepEqual(axes[1], { name: 'Size', options: ['Small', 'Medium', 'Large'] });
  assert.deepEqual(axes[2], { name: 'Material', options: ['Cotton', 'Silk'] });

  assert.equal(
    resolveVariantColorHex('Pink', [{ name: 'Pink', hex: '#f48fa7' }]),
    '#f48fa7'
  );
  assert.equal(resolveVariantColorHex('Forest Green'), '#2f5233');
  assert.equal(resolveVariantColorHex('Black'), '#111111');

  const normalized = normalizeUnitVariantSelections(
    [{ Size: 'Medium', Color: 'Black', Material: 'Silk' }],
    3,
    axes
  );
  assert.equal(normalized.length, 3);
  assert.deepEqual(normalized[0], { Color: 'Black', Size: 'Medium', Material: 'Silk' });
  assert.deepEqual(normalized[1], { Color: 'Pink', Size: 'Small', Material: 'Cotton' });
  assert.deepEqual(normalized[2], { Color: 'Pink', Size: 'Small', Material: 'Cotton' });

  const tierWithGift = {
    ...createDefaultOffersConfig(3500).tiers[1],
    freeGifts: [
      {
        id: 'g1',
        name: 'Baseball Cap',
        imageUrl: '',
        quantity: 1,
        originalPrice: 800,
      },
    ],
  };
  const summary = formatOfferSelectionSummary({
    tier: tierWithGift,
    unitSelections: normalized.slice(0, 2),
    includeGifts: true,
  });
  assert.match(summary, /Duo/);
  assert.match(summary, /#1: Black \/ Medium \/ Silk/);
  assert.match(summary, /1x Baseball Cap \(FREE\)/);
});

test('most popular logic: merchant chooses before 7 sales, automatic selection after threshold', () => {
  assert.equal(DEFAULT_MOST_POPULAR_SALES_THRESHOLD, 7);
  let cfg = createDefaultOffersConfig(3500);
  // Merchant manually chooses tier-1 before 7 sales
  cfg = { ...cfg, merchantMostPopularTierId: 'tier-1' };

  const initialRes = resolveMostPopularTierId(cfg);
  assert.equal(initialRes.isAutomatic, false);
  assert.equal(initialRes.totalSales, 0);
  assert.equal(initialRes.threshold, 7);
  assert.equal(initialRes.mostPopularTierId, 'tier-1');

  // Record 6 sales on tier-3 (still < 7 threshold)
  cfg = recordOfferTierSale(cfg, 'tier-3', 6);
  const beforeThreshold = resolveMostPopularTierId(cfg);
  assert.equal(beforeThreshold.totalSales, 6);
  assert.equal(beforeThreshold.isAutomatic, false);
  assert.equal(beforeThreshold.mostPopularTierId, 'tier-1');

  // Record 7th sale on tier-3 -> crosses threshold (7), automatically switches to tier-3!
  cfg = recordOfferTierSale(cfg, 'tier-3', 1);
  const afterThreshold = resolveMostPopularTierId(cfg);
  assert.equal(afterThreshold.totalSales, 7);
  assert.equal(afterThreshold.isAutomatic, true);
  assert.equal(afterThreshold.mostPopularTierId, 'tier-3');

  // Custom admin threshold (e.g., 10 sales): at 7 sales, still uses merchant choice
  const customThresholdRes = resolveMostPopularTierId(cfg, 10);
  assert.equal(customThresholdRes.isAutomatic, false);
  assert.equal(customThresholdRes.threshold, 10);
  assert.equal(customThresholdRes.mostPopularTierId, 'tier-1');
});

test('resolveUnitVariantInfo updates image to match selected variant and detects out-of-stock state', () => {
  const step3Variants = [
    {
      name: 'Hat - Pink / Small',
      options: { Color: 'Pink', Size: 'Small' },
      imageUrl: 'https://images.unsplash.com/photo-pink-hat',
      stock: 5,
      isOutOfStock: false,
    },
    {
      name: 'Hat - Black / Small',
      options: { Color: 'Black', Size: 'Small' },
      imageUrl: 'https://images.unsplash.com/photo-black-hat',
      stock: 0,
      isOutOfStock: true,
    },
  ];

  // 1. Matches Pink variant image
  const pinkRes = resolveUnitVariantInfo({
    unitSelections: { Color: 'Pink', Size: 'Small' },
    step3Variants,
    defaultImageUrl: 'https://images.unsplash.com/photo-default',
  });
  assert.equal(pinkRes.imageUrl, 'https://images.unsplash.com/photo-pink-hat');
  assert.equal(pinkRes.isOutOfStock, false);

  // 2. Matches Black variant image and flags isOutOfStock
  const blackRes = resolveUnitVariantInfo({
    unitSelections: { Color: 'Black', Size: 'Small' },
    step3Variants,
  });
  assert.equal(blackRes.imageUrl, 'https://images.unsplash.com/photo-black-hat');
  assert.equal(blackRes.isOutOfStock, true);

  // 3. Fallback when not matched
  const fallbackRes = resolveUnitVariantInfo({
    unitSelections: { Color: 'Green', Size: 'Small' },
    step3Variants,
    defaultImageUrl: 'https://images.unsplash.com/photo-default',
  });
  assert.equal(fallbackRes.imageUrl, 'https://images.unsplash.com/photo-default');
  assert.equal(fallbackRes.isOutOfStock, false);

  // 4. isVariantOptionValueOutOfStock detects out of stock options
  assert.equal(
    isVariantOptionValueOutOfStock({
      axisName: 'Color',
      optionValue: 'Black',
      step3Variants,
    }),
    true
  );
  assert.equal(
    isVariantOptionValueOutOfStock({
      axisName: 'Color',
      optionValue: 'Pink',
      step3Variants,
    }),
    false
  );
});

test('calculatePlayingCardTransforms generates sequential fanned playing card layouts', () => {
  // Single card (1 unit)
  const single = calculatePlayingCardTransforms(1);
  assert.equal(single.length, 1);
  assert.equal(single[0].rotateDeg, 0);

  // Duo (2 units) -> fanned out
  const duo = calculatePlayingCardTransforms(2);
  assert.equal(duo.length, 2);
  assert.equal(duo[0].rotateDeg > 0, true); // Front card tilted clockwise
  assert.equal(duo[1].rotateDeg < 0, true); // Rear card tilted counter-clockwise
  assert.equal(duo[0].zIndex > duo[1].zIndex, true);

  // Trio (3 units) -> 3 fanned cards
  const trio = calculatePlayingCardTransforms(3);
  assert.equal(trio.length, 3);
  assert.equal(trio[0].zIndex > trio[1].zIndex, true);
  assert.equal(trio[1].zIndex > trio[2].zIndex, true);

  // Expanded mode fans cards out wider and brings selected frontCardIndex to the front slot (zIndex 30)
  const trioExpanded = calculatePlayingCardTransforms(3, 3, { isExpanded: true, frontCardIndex: 1 });
  assert.equal(Math.abs(trioExpanded[0].translateX) > Math.abs(trio[2].translateX), true);
  assert.equal(trioExpanded[1].zIndex, 30); // Card #2 (index 1) is now at the front!
});

test('extractStep3VariantAxes automatically prioritizes disponible Step 3 variants and custom attributes', () => {
  const axes = extractStep3VariantAxes({
    colors: [
      { name: 'Emerald Green', hex: '#046307' },
      { name: 'Crimson Red', hex: '#990000' },
      { name: 'Sold Out Gray', hex: '#888888' },
    ],
    sizes: ['M', 'L', 'XXL'],
    variantAttrs: [
      { name: 'Color', tags: ['Emerald Green', 'Crimson Red', 'Sold Out Gray'] },
      { name: 'Size', tags: ['M', 'L', 'XXL'] },
      { name: 'Storage', tags: ['128GB', '256GB'] },
    ],
    variants: [
      {
        name: 'Emerald Green / M / 128GB',
        options: { Color: 'Emerald Green', Size: 'M', Storage: '128GB' },
        stock: 10,
        availability: 'in_stock',
      },
      {
        name: 'Crimson Red / L / 256GB',
        options: { Color: 'Crimson Red', Size: 'L', Storage: '256GB' },
        stock: 4,
        availability: 'in_stock',
      },
      {
        name: 'Sold Out Gray / XXL / 128GB',
        options: { Color: 'Sold Out Gray', Size: 'XXL', Storage: '128GB' },
        stock: 0,
        availability: 'out_of_stock',
        isOutOfStock: true,
      },
    ],
    onlyDisponible: true,
    useFallbackForPreview: true,
  });

  // Never falls back to default 5 sample colors or S/M/L/XL when real Step 3 variants exist
  const colorAxis = axes.find((a) => a.name === 'Color');
  const sizeAxis = axes.find((a) => a.name === 'Size');
  const storageAxis = axes.find((a) => a.name === 'Storage');

  assert.deepEqual(colorAxis?.options, ['Emerald Green', 'Crimson Red']);
  assert.deepEqual(sizeAxis?.options, ['M', 'L']);
  assert.deepEqual(storageAxis?.options, ['128GB', '256GB']);
});

