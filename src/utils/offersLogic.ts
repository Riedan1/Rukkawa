export type OfferType = 'bogo' | 'percent_off' | 'flat_off' | 'fixed_price';

export interface OfferGiftItem {
  id: string;
  name: string;
  imageUrl: string;
  quantity: number;
  originalPrice: number;
  isCustom?: boolean;
  storeProductId?: string;
  selectedVariant?: string;
  variantOptions?: string[];
  /** Administrator flexibility: whether shoppers can select from multiple variants or if the gift variant remains fixed */
  allowCustomerVariantSelection?: boolean;
  fixedVariantChoice?: string;
}

export interface OfferTier {
  id: string;
  title: string;
  /** Number of paid units in BOGO or total units in other modes */
  buyQty: number;
  /** Number of free units in BOGO mode */
  freeQty: number;
  /** Total units customer receives (and selects variants for) */
  totalUnits: number;
  /** Pill label next to or below title, e.g. "Base Price", "33% OFF", "40% OFF" */
  offerLabel: string;
  /** Optional ribbon badge at top-right, e.g. "Most Popular", "Best Value" */
  tierBadge?: string;
  /** Discount value depending on OfferType:
   *  - 'bogo': ignored or overridden by buyQty / (buyQty + freeQty)
   *  - 'percent_off': percentage 0..100
   *  - 'flat_off': flat amount subtracted from compareAtTotal
   *  - 'fixed_price': explicit final total bundle price
   */
  discountValue: number;
  /** Optional direct final price override edited on the card */
  customFinalPrice?: number;
  /** Optional direct compare-at total price override edited on the card */
  customCompareAtPrice?: number;
  /** Optional custom image per tier; falls back to product thumbnail */
  imageUrl?: string;
  /** Optional list of free gifts included with this tier */
  freeGifts: OfferGiftItem[];
  /** Real completed order sales count for this tier */
  salesCount?: number;
  offerType?: OfferType | string;
  badgeText?: string;
  purchasedQuantity?: number;
  freeQuantity?: number;
}

export interface OfferFeaturesConfig {
  freeGift: boolean;
  addImage: boolean;
  tierBadge: boolean;
  offerLabel: boolean;
  variants: boolean;
  compareAtPrice: boolean;
  customHeader: boolean;
  mostPopularHighlight: boolean;
  unitPriceSubtitle: boolean;
}

export interface ProductOffersConfig {
  enabled: boolean;
  headerTitle: string;
  offerType: OfferType;
  themeColorId: string;
  features: OfferFeaturesConfig;
  tiers: OfferTier[];
  defaultSelectedTierId?: string;
  /** Tier ID chosen by the merchant before the sales threshold (default 7) is reached */
  merchantMostPopularTierId?: string;
  /** Optional threshold override; defaults to Admin Settings threshold (7 sales) */
  autoPopularThreshold?: number;
}

export interface OfferThemePalette {
  id: string;
  name: string;
  swatchHex: string;
  primaryHex: string;
  borderHex: string;
  headerTextHex: string;
  unselectedBgHex: string;
  unselectedBorderHex: string;
  giftStripBgHex: string;
  ribbonBgHex: string;
  pillBorderHex: string;
  pillTextHex: string;
}

/**
 * 12-color swatch circles matching the 2x6 palette.
 */
export const OFFER_THEME_PALETTES: OfferThemePalette[] = [
  {
    id: 'slate',
    name: 'Slate Grey',
    swatchHex: '#9da3ae',
    primaryHex: '#374151',
    borderHex: '#4b5563',
    headerTextHex: '#1f2937',
    unselectedBgHex: '#f3f4f6',
    unselectedBorderHex: '#9ca3af',
    giftStripBgHex: '#6b7280',
    ribbonBgHex: '#374151',
    pillBorderHex: '#6b7280',
    pillTextHex: '#4b5563',
  },
  {
    id: 'sage',
    name: 'Forest Sage Green',
    swatchHex: '#8ab881',
    primaryHex: '#254d1a',
    borderHex: '#2d5a27',
    headerTextHex: '#1e3f15',
    unselectedBgHex: '#edf8eb',
    unselectedBorderHex: '#bce0b7',
    giftStripBgHex: '#6da862',
    ribbonBgHex: '#254d1a',
    pillBorderHex: '#7eb074',
    pillTextHex: '#6b8367',
  },
  {
    id: 'teal',
    name: 'Aqua Teal',
    swatchHex: '#51beb7',
    primaryHex: '#0d7470',
    borderHex: '#0d7470',
    headerTextHex: '#0b615d',
    unselectedBgHex: '#eefaf9',
    unselectedBorderHex: '#5bbcb5',
    giftStripBgHex: '#47b0a9',
    ribbonBgHex: '#0b615d',
    pillBorderHex: '#3aa19a',
    pillTextHex: '#3b6e6b',
  },
  {
    id: 'sky',
    name: 'Sky Blue',
    swatchHex: '#5eb3d6',
    primaryHex: '#0369a1',
    borderHex: '#0369a1',
    headerTextHex: '#075985',
    unselectedBgHex: '#f0f9ff',
    unselectedBorderHex: '#67b7d9',
    giftStripBgHex: '#4fa8ce',
    ribbonBgHex: '#0369a1',
    pillBorderHex: '#3898c2',
    pillTextHex: '#466c82',
  },
  {
    id: 'ocean',
    name: 'Classic Ocean Blue',
    swatchHex: '#60a3d9',
    primaryHex: '#004e89',
    borderHex: '#004e89',
    headerTextHex: '#004e89',
    unselectedBgHex: '#f1f8fe',
    unselectedBorderHex: '#6da9dc',
    giftStripBgHex: '#63a4da',
    ribbonBgHex: '#004e89',
    pillBorderHex: '#5c9cd1',
    pillTextHex: '#4a6b88',
  },
  {
    id: 'indigo',
    name: 'Periwinkle Indigo',
    swatchHex: '#8d9be0',
    primaryHex: '#3730a3',
    borderHex: '#3730a3',
    headerTextHex: '#312e81',
    unselectedBgHex: '#f2f4fd',
    unselectedBorderHex: '#8d9be0',
    giftStripBgHex: '#7989d8',
    ribbonBgHex: '#3730a3',
    pillBorderHex: '#6b7bd1',
    pillTextHex: '#525082',
  },
  {
    id: 'violet',
    name: 'Soft Violet',
    swatchHex: '#ab87e0',
    primaryHex: '#5b21b6',
    borderHex: '#5b21b6',
    headerTextHex: '#4c1d95',
    unselectedBgHex: '#f7f2fd',
    unselectedBorderHex: '#ab87e0',
    giftStripBgHex: '#9c73d8',
    ribbonBgHex: '#5b21b6',
    pillBorderHex: '#8b5cf6',
    pillTextHex: '#694e8c',
  },
  {
    id: 'berry',
    name: 'Berry Maroon',
    swatchHex: '#e38ab5',
    primaryHex: '#7a003c',
    borderHex: '#7a003c',
    headerTextHex: '#7a003c',
    unselectedBgHex: '#fdf2f8',
    unselectedBorderHex: '#e082b2',
    giftStripBgHex: '#ea8ab9',
    ribbonBgHex: '#7a003c',
    pillBorderHex: '#be6b95',
    pillTextHex: '#7c4d64',
  },
  {
    id: 'coral',
    name: 'Rose Coral',
    swatchHex: '#e38888',
    primaryHex: '#991b1b',
    borderHex: '#991b1b',
    headerTextHex: '#7f1d1d',
    unselectedBgHex: '#fef2f2',
    unselectedBorderHex: '#e38888',
    giftStripBgHex: '#dc7676',
    ribbonBgHex: '#991b1b',
    pillBorderHex: '#c86464',
    pillTextHex: '#7f4d4d',
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    swatchHex: '#f28e6b',
    primaryHex: '#9a3412',
    borderHex: '#9a3412',
    headerTextHex: '#7c2d12',
    unselectedBgHex: '#fff7ed',
    unselectedBorderHex: '#f28e6b',
    giftStripBgHex: '#ec7d57',
    ribbonBgHex: '#9a3412',
    pillBorderHex: '#d96b43',
    pillTextHex: '#825645',
  },
  {
    id: 'terracotta',
    name: 'Warm Terracotta',
    swatchHex: '#d69e8e',
    primaryHex: '#7c2d12',
    borderHex: '#7c2d12',
    headerTextHex: '#682610',
    unselectedBgHex: '#fdf6f4',
    unselectedBorderHex: '#d69e8e',
    giftStripBgHex: '#c88b79',
    ribbonBgHex: '#7c2d12',
    pillBorderHex: '#b57968',
    pillTextHex: '#78554b',
  },
  {
    id: 'sand',
    name: 'Golden Sand',
    swatchHex: '#bfa082',
    primaryHex: '#713f12',
    borderHex: '#713f12',
    headerTextHex: '#5c330e',
    unselectedBgHex: '#fbf8f4',
    unselectedBorderHex: '#bfa082',
    giftStripBgHex: '#b08f6f',
    ribbonBgHex: '#713f12',
    pillBorderHex: '#9e7d5d',
    pillTextHex: '#735e49',
  },
];

export function getOfferThemePalette(themeColorId?: string): OfferThemePalette {
  return (
    OFFER_THEME_PALETTES.find((t) => t.id === themeColorId) ||
    OFFER_THEME_PALETTES[1] // default 'sage' (Forest Sage Green matching screenshot)
  );
}

// Crisp Forest Green Hoodie SVG matching the screenshot product thumbnail
export const DEFAULT_HOODIE_THUMBNAIL = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" rx="20" fill="#ffffff"/>
    <path d="M42 26C45 19 52 16 60 16C68 16 75 19 78 26L96 38L104 86C104 90 100 93 96 93L88 92L85 54L83 98C83 101 80 103 77 103H43C40 103 37 101 37 98L35 54L32 92L24 93C20 93 16 90 16 86L24 38L42 26Z" fill="#234429"/>
    <path d="M46 25C49 20 54 18 60 18C66 18 71 20 74 25C71 31 66 34 60 34C54 34 49 31 46 25Z" fill="#18301c"/>
    <path d="M44 74H76L79 94H41L44 74Z" fill="#1c3821" stroke="#2e5736" stroke-width="1.5"/>
    <path d="M55 34V50M65 34V50" stroke="#152918" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M37 97H83" stroke="#18301c" stroke-width="4" stroke-linecap="round"/>
  </svg>`
)}`;

// Crisp Black Baseball Cap SVG matching the screenshot gift thumbnail
export const DEFAULT_CAP_THUMBNAIL = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="18" fill="#ffffff"/>
    <path d="M26 56C26 36 40 24 58 24C75 24 86 36 86 54L85 60H26V56Z" fill="#1e2022"/>
    <path d="M56 24C44 26 37 38 37 56" stroke="#2f3236" stroke-width="2"/>
    <path d="M60 24C70 27 76 38 76 56" stroke="#2f3236" stroke-width="2"/>
    <circle cx="57" cy="23" r="3" fill="#111214"/>
    <path d="M12 63C12 58 25 54 44 55L62 57C54 65 36 70 18 68C14 67 12 65 12 63Z" fill="#111214"/>
    <path d="M16 64C28 65 44 62 56 57" stroke="#2f3236" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`
)}`;

export const DEFAULT_HAT_THUMBNAIL = DEFAULT_HOODIE_THUMBNAIL;
export const DEFAULT_SCRUNCHIE_THUMBNAIL = DEFAULT_CAP_THUMBNAIL;

export const DEFAULT_SUNGLASSES_THUMBNAIL = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="18" fill="#ffffff"/>
    <path d="M12 44C12 39 20 37 29 37C38 37 45 40 45 48C45 58 37 64 28 64C19 64 12 56 12 44Z" fill="#6d2e46" stroke="#f3b6c8" stroke-width="3"/>
    <path d="M55 48C55 40 62 37 71 37C80 37 88 39 88 44C88 56 81 64 72 64C63 64 55 58 55 48Z" fill="#6d2e46" stroke="#f3b6c8" stroke-width="3"/>
    <path d="M45 44C48 41 52 41 55 44" stroke="#d48ca4" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M18 42L28 58" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.45"/>
    <path d="M62 42L72 58" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.45"/>
  </svg>`
)}`;

const NAMED_COLOR_HEX_MAP: Record<string, string> = {
  black: '#111111',
  noir: '#111111',
  'forest green': '#2f5233',
  'dark green': '#2f5233',
  green: '#2f5233',
  vert: '#2f5233',
  olive: '#4b6043',
  sage: '#7eb074',
  cream: '#eae3e1',
  'off-white': '#eae3e1',
  'off white': '#eae3e1',
  white: '#f4f1f0',
  blanc: '#f4f1f0',
  ivory: '#f5f0e6',
  beige: '#d8c7b4',
  sand: '#ccb79e',
  brown: '#7b523b',
  mocha: '#7b523b',
  marron: '#7b523b',
  chocolate: '#5c3a21',
  yellow: '#fbbc05',
  mustard: '#eab308',
  gold: '#eab308',
  amber: '#f59e0b',
  jaune: '#fbbc05',
  pink: '#f48fa7',
  rose: '#f48fa7',
  blue: '#2563eb',
  navy: '#1e3a8a',
  bleu: '#2563eb',
  sky: '#38bdf8',
  red: '#dc2626',
  rouge: '#dc2626',
  burgundy: '#7f1d1d',
  maroon: '#7a003c',
  grey: '#6b7280',
  gray: '#6b7280',
  silver: '#9ca3af',
  purple: '#7c3aed',
  violet: '#8b5cf6',
  orange: '#ea580c',
  coral: '#f87171',
};

export function resolveVariantColorHex(
  colorName: string,
  step3Colors?: Array<{ name?: string; hex?: string } | string>
): string {
  const clean = String(colorName || '').trim();
  if (!clean) return '#2f5233';
  if (clean.startsWith('#') || clean.startsWith('rgb')) return clean;

  if (Array.isArray(step3Colors)) {
    for (const c of step3Colors) {
      if (typeof c === 'object' && c !== null && c.name && c.hex) {
        if (c.name.trim().toLowerCase() === clean.toLowerCase()) {
          return c.hex;
        }
      }
    }
  }

  const lower = clean.toLowerCase();
  if (NAMED_COLOR_HEX_MAP[lower]) {
    return NAMED_COLOR_HEX_MAP[lower];
  }
  for (const [key, hex] of Object.entries(NAMED_COLOR_HEX_MAP)) {
    if (lower.includes(key)) return hex;
  }
  return '#2f5233';
}

export const DEFAULT_MOST_POPULAR_SALES_THRESHOLD = 7;
export const ADMIN_POPULAR_THRESHOLD_STORAGE_KEY = 'yume_admin_offer_popular_threshold';

export function getAdminPopularSalesThreshold(): number {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(ADMIN_POPULAR_THRESHOLD_STORAGE_KEY);
      if (raw !== null) {
        const parsed = parseInt(raw, 10);
        if (Number.isFinite(parsed) && parsed >= 1) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_MOST_POPULAR_SALES_THRESHOLD;
}

export function setAdminPopularSalesThreshold(threshold: number): number {
  const safeVal = Math.max(1, Math.round(Number(threshold) || DEFAULT_MOST_POPULAR_SALES_THRESHOLD));
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(ADMIN_POPULAR_THRESHOLD_STORAGE_KEY, String(safeVal));
      window.dispatchEvent(new CustomEvent('yume_offer_threshold_updated', { detail: safeVal }));
    }
  } catch {
    // ignore storage errors
  }
  return safeVal;
}

export interface MostPopularResolution {
  mostPopularTierId: string | null;
  isAutomatic: boolean;
  totalSales: number;
  threshold: number;
}

/**
 * Resolves which tier receives the "Most Popular" badge:
 * - Before `threshold` (default 7) total offer sales: merchant chooses (`merchantMostPopularTierId` or tier with `tierBadge === 'Most Popular'`).
 * - At or after `threshold` total offer sales: automatic selection based on the tier with the highest real `salesCount`.
 */
export function resolveMostPopularTierId(
  offersConfig: ProductOffersConfig,
  thresholdOverride?: number
): MostPopularResolution {
  const tiers = Array.isArray(offersConfig?.tiers) ? offersConfig.tiers : [];
  const totalSales = tiers.reduce(
    (sum, t) => sum + Math.max(0, Math.floor(Number(t.salesCount) || 0)),
    0
  );
  const rawThreshold =
    thresholdOverride ??
    offersConfig?.autoPopularThreshold ??
    getAdminPopularSalesThreshold();
  const threshold = Math.max(
    1,
    Math.floor(Number(rawThreshold) || DEFAULT_MOST_POPULAR_SALES_THRESHOLD)
  );

  if (tiers.length === 0) {
    return { mostPopularTierId: null, isAutomatic: false, totalSales, threshold };
  }

  if (totalSales >= threshold) {
    let bestTier = tiers[0];
    let bestSales = Math.max(0, Math.floor(Number(bestTier.salesCount) || 0));
    for (let i = 1; i < tiers.length; i++) {
      const s = Math.max(0, Math.floor(Number(tiers[i].salesCount) || 0));
      if (s > bestSales) {
        bestSales = s;
        bestTier = tiers[i];
      }
    }
    return {
      mostPopularTierId: bestTier.id,
      isAutomatic: true,
      totalSales,
      threshold,
    };
  }

  // Below threshold: merchant choice
  if (offersConfig.merchantMostPopularTierId !== undefined) {
    const matched = tiers.find((t) => t.id === offersConfig.merchantMostPopularTierId);
    return {
      mostPopularTierId: matched ? matched.id : null,
      isAutomatic: false,
      totalSales,
      threshold,
    };
  }

  const badgeTier = tiers.find(
    (t) => (t.tierBadge || '').trim().toLowerCase() === 'most popular'
  );
  return {
    mostPopularTierId: badgeTier ? badgeTier.id : null,
    isAutomatic: false,
    totalSales,
    threshold,
  };
}

/**
 * Records real sales for a specific offer tier and updates automatic Most Popular state when threshold is reached.
 */
export function recordOfferTierSale(
  offersConfig: ProductOffersConfig,
  tierId: string,
  orderCount: number = 1,
  thresholdOverride?: number
): ProductOffersConfig {
  const increment = Math.max(1, Math.floor(Number(orderCount) || 1));
  const nextTiers = (offersConfig.tiers || []).map((t) =>
    t.id === tierId
      ? { ...t, salesCount: Math.max(0, Math.floor(Number(t.salesCount) || 0)) + increment }
      : t
  );
  const updatedConfig: ProductOffersConfig = {
    ...offersConfig,
    tiers: nextTiers,
  };
  const resolution = resolveMostPopularTierId(updatedConfig, thresholdOverride);
  if (resolution.isAutomatic && resolution.mostPopularTierId) {
    updatedConfig.tiers = updatedConfig.tiers.map((t) => ({
      ...t,
      tierBadge: t.id === resolution.mostPopularTierId ? 'Most Popular' : '',
    }));
  }
  return updatedConfig;
}

export function createDefaultOffersConfig(
  baseUnitPrice: number = 3500,
  productImageUrl?: string
): ProductOffersConfig {
  const thumb = productImageUrl && productImageUrl.trim() ? productImageUrl : DEFAULT_HAT_THUMBNAIL;

  return {
    enabled: false,
    headerTitle: 'Buy More Save More',
    offerType: 'percent_off',
    themeColorId: 'berry',
    defaultSelectedTierId: 'tier-2',
    merchantMostPopularTierId: 'tier-2',
    features: {
      freeGift: false,
      addImage: true,
      tierBadge: true,
      offerLabel: false,
      variants: true,
      compareAtPrice: true,
      customHeader: true,
      mostPopularHighlight: true,
      unitPriceSubtitle: false,
    },
    tiers: [
      {
        id: 'tier-1',
        title: 'Single',
        buyQty: 1,
        freeQty: 0,
        totalUnits: 1,
        offerLabel: 'Base Price',
        tierBadge: '',
        discountValue: 0,
        imageUrl: thumb,
        freeGifts: [],
        salesCount: 0,
      },
      {
        id: 'tier-2',
        title: 'Duo',
        buyQty: 2,
        freeQty: 0,
        totalUnits: 2,
        offerLabel: '15% OFF',
        tierBadge: 'Most Popular',
        discountValue: 15,
        imageUrl: thumb,
        freeGifts: [],
        salesCount: 0,
      },
      {
        id: 'tier-3',
        title: 'Trio',
        buyQty: 3,
        freeQty: 0,
        totalUnits: 3,
        offerLabel: '25% OFF',
        tierBadge: '',
        discountValue: 25,
        imageUrl: thumb,
        freeGifts: [],
        salesCount: 0,
      },
    ],
  };
}

export const DEFAULT_OFFERS_CONFIG: ProductOffersConfig = createDefaultOffersConfig(3500);

export interface OfferTierPricingResult {
  totalUnits: number;
  compareAtTotal: number;
  finalPrice: number;
  savingsAmount: number;
  savingsPercent: number;
  effectiveUnitPrice: number;
  effectiveOfferLabel: string;
  totalGiftCount: number;
  totalGiftOriginalValue: number;
  baseUnitPriceDzd?: number;
  originalTotalDzd?: number;
  savingsDzd?: number;
}

/**
 * Pure calculation function for any OfferTier and OfferType.
 * Uses the Step 4 product price in DZD as `baseUnitPrice`, calculates discounts accurately,
 * honors direct merchant price edits (`customFinalPrice` and `customCompareAtPrice`),
 * and prevents misleading savings.
 */
export function calculateOfferTierPricing(
  tier: OfferTier,
  baseUnitPrice: number,
  offerType: OfferType,
  unitVariantPrices?: number[]
): OfferTierPricingResult {
  const safeBasePrice = Number.isFinite(baseUnitPrice) && baseUnitPrice >= 0 ? baseUnitPrice : 0;
  const totalUnits = Math.max(
    1,
    offerType === 'bogo'
      ? Math.max(1, (Number(tier.buyQty) || 1) + Math.max(0, Number(tier.freeQty) || 0))
      : Math.max(1, Number(tier.totalUnits) || Number(tier.buyQty) || 1)
  );

  // Calculate full original compare-at price across all units in this tier
  let compareAtTotal = 0;
  if (
    tier.customCompareAtPrice !== undefined &&
    Number.isFinite(Number(tier.customCompareAtPrice)) &&
    Number(tier.customCompareAtPrice) > 0
  ) {
    compareAtTotal = Number(tier.customCompareAtPrice);
  } else if (unitVariantPrices && unitVariantPrices.length > 0) {
    for (let i = 0; i < totalUnits; i++) {
      const unitP = unitVariantPrices[i];
      compareAtTotal += Number.isFinite(unitP) && unitP > 0 ? unitP : safeBasePrice;
    }
  } else {
    compareAtTotal = safeBasePrice * totalUnits;
  }

  let finalPrice = compareAtTotal;
  const hasDirectCustomPrice =
    tier.customFinalPrice !== undefined &&
    Number.isFinite(Number(tier.customFinalPrice)) &&
    Number(tier.customFinalPrice) >= 0;

  if (hasDirectCustomPrice) {
    finalPrice = Math.max(0, Number(tier.customFinalPrice));
    if (compareAtTotal < finalPrice) {
      compareAtTotal = finalPrice;
    }
  } else if (offerType === 'bogo') {
    const paidUnits = Math.max(1, Math.min(totalUnits, Number(tier.buyQty) || 1));
    if (unitVariantPrices && unitVariantPrices.length > 0) {
      let paidSum = 0;
      for (let i = 0; i < paidUnits; i++) {
        const unitP = unitVariantPrices[i];
        paidSum += Number.isFinite(unitP) && unitP > 0 ? unitP : safeBasePrice;
      }
      finalPrice = paidSum;
    } else {
      finalPrice = safeBasePrice * paidUnits;
    }
  } else if (offerType === 'percent_off') {
    const pct = Math.max(0, Math.min(100, Number(tier.discountValue) || 0));
    finalPrice = compareAtTotal * (1 - pct / 100);
  } else if (offerType === 'flat_off') {
    const flat = Math.max(0, Math.min(compareAtTotal, Number(tier.discountValue) || 0));
    finalPrice = Math.max(0, compareAtTotal - flat);
  } else if (offerType === 'fixed_price') {
    const fixed = Number(tier.discountValue);
    // Prevent misleading savings: fixed bundle price cannot exceed original compareAtTotal
    finalPrice =
      Number.isFinite(fixed) && fixed > 0
        ? Math.min(compareAtTotal, fixed)
        : compareAtTotal;
  }

  finalPrice = Math.max(0, Math.min(compareAtTotal, Math.round(finalPrice * 100) / 100));
  compareAtTotal = Math.round(compareAtTotal * 100) / 100;

  const savingsAmount = Math.max(0, Math.round((compareAtTotal - finalPrice) * 100) / 100);
  const savingsPercent =
    compareAtTotal > 0 && savingsAmount > 0
      ? Math.min(99, Math.max(0, Math.round((savingsAmount / compareAtTotal) * 100)))
      : 0;
  const effectiveUnitPrice =
    totalUnits > 0 ? Math.round((finalPrice / totalUnits) * 100) / 100 : finalPrice;

  // Prevent misleading savings badges: only show "% OFF" when there is genuine mathematical savings
  const effectiveOfferLabel =
    savingsAmount <= 0 || savingsPercent <= 0
      ? 'Base Price'
      : `${savingsPercent}% OFF`;

  const freeGifts = Array.isArray(tier.freeGifts) ? tier.freeGifts : [];
  const totalGiftCount = freeGifts.reduce((acc, g) => acc + Math.max(1, Number(g.quantity) || 1), 0);
  const totalGiftOriginalValue =
    Math.round(
      freeGifts.reduce(
        (acc, g) => acc + (Number(g.originalPrice) || 0) * Math.max(1, Number(g.quantity) || 1),
        0
      ) * 100
    ) / 100;

  return {
    totalUnits,
    compareAtTotal,
    finalPrice,
    savingsAmount,
    savingsPercent,
    effectiveUnitPrice,
    effectiveOfferLabel,
    totalGiftCount,
    totalGiftOriginalValue,
    baseUnitPriceDzd: safeBasePrice,
    originalTotalDzd: compareAtTotal,
    savingsDzd: savingsAmount,
  };
}

/**
 * Updates tier titles, discount values, and offer labels smoothly when the merchant switches
 * between BOGO, % Percent Off, Flat Off, and Fixed Price in the Offer Builder.
 */
export function applyOfferTypePreset(
  config: ProductOffersConfig,
  newType: OfferType,
  baseUnitPrice: number
): ProductOffersConfig {
  const safeBase = baseUnitPrice > 0 ? baseUnitPrice : 3500;
  const defaultTitles = ['Single', 'Duo', 'Trio'];

  const updatedTiers = config.tiers.map((tier, idx) => {
    const fallbackTitle = defaultTitles[idx] || `${idx + 1} Pack`;
    const keptTitle = tier.title && tier.title.trim() ? tier.title : fallbackTitle;
    if (newType === 'bogo') {
      const buyQty = idx === 0 ? 1 : idx === 1 ? 2 : idx + 1;
      const freeQty = idx === 0 ? 0 : idx === 1 ? 1 : idx;
      const totalUnits = buyQty + freeQty;
      const pctOff = totalUnits > 0 ? Math.round((freeQty / totalUnits) * 100) : 0;
      return {
        ...tier,
        buyQty,
        freeQty,
        totalUnits,
        customFinalPrice: undefined,
        customCompareAtPrice: undefined,
        title: keptTitle,
        offerLabel: pctOff === 0 ? 'Base Price' : `${pctOff}% OFF`,
        discountValue: pctOff,
      };
    }

    if (newType === 'percent_off') {
      const totalUnits = idx === 0 ? 1 : idx === 1 ? 2 : idx + 1;
      const pct = idx === 0 ? 0 : idx === 1 ? 15 : Math.min(50, idx * 12 + 1);
      return {
        ...tier,
        buyQty: totalUnits,
        freeQty: 0,
        totalUnits,
        customFinalPrice: undefined,
        customCompareAtPrice: undefined,
        title: keptTitle,
        offerLabel: pct === 0 ? 'Base Price' : `${pct}% OFF`,
        discountValue: idx === 2 ? 25 : pct,
      };
    }

    if (newType === 'flat_off') {
      const totalUnits = idx === 0 ? 1 : idx === 1 ? 2 : idx + 1;
      const flatDiscount =
        idx === 0
          ? 0
          : idx === 1
          ? Math.round(safeBase * 0.3 * 100) / 100
          : Math.round(safeBase * 0.75 * 100) / 100;
      const compareAt = safeBase * totalUnits;
      const savedPct = compareAt > 0 ? Math.round((flatDiscount / compareAt) * 100) : 0;
      return {
        ...tier,
        buyQty: totalUnits,
        freeQty: 0,
        totalUnits,
        customFinalPrice: undefined,
        customCompareAtPrice: undefined,
        title: keptTitle,
        offerLabel: savedPct === 0 ? 'Base Price' : `${savedPct}% OFF`,
        discountValue: flatDiscount,
      };
    }

    // fixed_price
    const totalUnits = idx === 0 ? 1 : idx === 1 ? 2 : idx + 1;
    const fixedTotal =
      idx === 0
        ? safeBase
        : idx === 1
        ? Math.round(safeBase * 2 * 0.85 * 100) / 100
        : Math.round(safeBase * totalUnits * 0.75 * 100) / 100;
    const compareAt = safeBase * totalUnits;
    const savedPct = compareAt > 0 ? Math.round(((compareAt - fixedTotal) / compareAt) * 100) : 0;
    return {
      ...tier,
      buyQty: totalUnits,
      freeQty: 0,
      totalUnits,
      customFinalPrice: undefined,
      customCompareAtPrice: undefined,
      title: keptTitle,
      offerLabel: savedPct === 0 ? 'Base Price' : `${savedPct}% OFF`,
      discountValue: fixedTotal,
    };
  });

  return {
    ...config,
    offerType: newType,
    tiers: updatedTiers,
  };
}

export interface Step3VariantAxis {
  name: string;
  options: string[];
}

function canonicalizeVariantAxisName(rawName: string): string {
  const trimmed = String(rawName || '').trim();
  if (!trimmed) return '';
  if (/^(colou?r|couleur|لون|اللون|shade|colors|finition)$/i.test(trimmed)) {
    return 'Color';
  }
  if (/^(size|taille|pointure|مقاس|الحجم|sizes)$/i.test(trimmed)) {
    return 'Size';
  }
  return trimmed;
}

/**
 * Extracts Step 3 disponible (available) variants (Color, Size, custom attributes,variant combinations, or primary specs)
 * so every unit inside an Offer Tier automatically displays the exact variants chosen on Step 3.
 * Falls back to default Color & Size only when no Step 3 variants have been chosen yet and `useFallbackForPreview` is true.
 */
export function extractStep3VariantAxes(params: {
  sizes?: string[];
  colors?: Array<
    | {
        name?: string;
        hex?: string;
        imageUrl?: string;
        images?: string[];
        stock?: number | string;
        isOutOfStock?: boolean;
      }
    | string
  >;
  variantAttrs?: Array<{
    name?: string;
    values?: string[];
    options?: string[];
    tags?: string[];
  }>;
  variants?: Array<{
    name?: string;
    attributes?: Record<string, string>;
    options?: Record<string, string>;
    stock?: number | string;
    availability?: string;
    isOutOfStock?: boolean;
  }>;
  specs?: Array<{ key?: string; value?: string }>;
  onlyDisponible?: boolean;
  useFallbackForPreview?: boolean;
}): Step3VariantAxis[] {
  const axisMap = new Map<string, { name: string; options: string[] }>();

  const addValuesToAxis = (rawAxisName: string, rawValues: string[]) => {
    const canonical = canonicalizeVariantAxisName(rawAxisName);
    if (!canonical) return;
    const key = canonical.toLowerCase();
    if (!axisMap.has(key)) {
      axisMap.set(key, { name: canonical, options: [] });
    }
    const entry = axisMap.get(key)!;
    for (const rawVal of rawValues) {
      const clean = String(rawVal || '').trim();
      if (
        clean &&
        !entry.options.some((existing) => existing.toLowerCase() === clean.toLowerCase())
      ) {
        entry.options.push(clean);
      }
    }
  };

  // 1. Step 3 Color Swatches
  const cleanColors = (params.colors || [])
    .filter((c) => {
      if (typeof c === 'object' && c !== null && params.onlyDisponible) {
        if (c.isOutOfStock || (typeof c.stock === 'number' && c.stock <= 0)) {
          return false;
        }
      }
      return true;
    })
    .map((c) => (typeof c === 'string' ? c.trim() : String(c?.name || '').trim()))
    .filter(Boolean);
  if (cleanColors.length > 0) {
    addValuesToAxis('Color', cleanColors);
  }

  // 2. Step 3 Sizes
  const cleanSizes = (params.sizes || []).map((s) => String(s).trim()).filter(Boolean);
  if (cleanSizes.length > 0) {
    addValuesToAxis('Size', cleanSizes);
  }

  // 3. Step 3 Dynamic Variant Attributes (`wizardVariantAttrs` -> `values`, `options`, or `tags`)
  if (Array.isArray(params.variantAttrs)) {
    for (const attr of params.variantAttrs) {
      const attrName = String(attr?.name || '').trim();
      const rawValues = attr?.values || attr?.options || attr?.tags || [];
      const cleanVals = rawValues.map((v) => String(v).trim()).filter(Boolean);
      if (attrName && cleanVals.length > 0) {
        addValuesToAxis(attrName, cleanVals);
      }
    }
  }

  // 4. Step 3 Configured Variant Combinations (`wizardProductVariants` -> `options` / `attributes`)
  if (Array.isArray(params.variants) && params.variants.length > 0) {
    const disponibleAttrMap = new Map<string, Set<string>>();
    const allVariantAttrMap = new Map<string, Set<string>>();

    for (const v of params.variants) {
      const combinedAttrs = { ...(v?.attributes || {}), ...(v?.options || {}) };
      const isUnavailable = Boolean(
        v?.isOutOfStock ||
          v?.availability === 'out_of_stock' ||
          (v?.stock !== undefined && v?.stock !== '' && Number(v.stock) <= 0)
      );

      for (const [rawK, rawVal] of Object.entries(combinedAttrs)) {
        const canonicalK = canonicalizeVariantAxisName(rawK);
        const cleanVal = String(rawVal || '').trim();
        if (!canonicalK || !cleanVal) continue;
        // Skip non-variant descriptive metadata if present in options
        if (/^(gender|season|fit|brand|measurement unit|care instructions)$/i.test(canonicalK)) {
          continue;
        }
        if (!allVariantAttrMap.has(canonicalK)) {
          allVariantAttrMap.set(canonicalK, new Set());
        }
        allVariantAttrMap.get(canonicalK)!.add(cleanVal);

        if (!isUnavailable) {
          if (!disponibleAttrMap.has(canonicalK)) {
            disponibleAttrMap.set(canonicalK, new Set());
          }
          disponibleAttrMap.get(canonicalK)!.add(cleanVal);
        }
      }
    }

    for (const [axisName, allSet] of allVariantAttrMap.entries()) {
      const dispSet = disponibleAttrMap.get(axisName);
      // When onlyDisponible is requested and there is at least 1 disponible option on this axis, use the disponible options
      const chosenSet =
        params.onlyDisponible && dispSet && dispSet.size > 0 ? dispSet : allSet;
      addValuesToAxis(axisName, Array.from(chosenSet));
    }

    // If onlyDisponible is true, also filter existing axisMap entries against disponibleSet when that axis is governed by variants
    if (params.onlyDisponible) {
      for (const [axisName, dispSet] of disponibleAttrMap.entries()) {
        if (dispSet.size > 0) {
          const entry = axisMap.get(axisName.toLowerCase());
          if (entry && entry.options.length > 0) {
            const filtered = entry.options.filter((opt) =>
              Array.from(dispSet).some((d) => d.toLowerCase() === opt.toLowerCase())
            );
            if (filtered.length > 0) {
              entry.options = filtered;
            }
          }
        }
      }
    }
  }

  // 5. Step 3 Primary Specifications fallback (if merchant selected Color/Size/Model/Storage/RAM in Primary Specs without adding tags)
  if (axisMap.size === 0 && Array.isArray(params.specs) && params.specs.length > 0) {
    for (const spec of params.specs) {
      const rawKey = String(spec?.key || '').trim();
      const rawVal = String(spec?.value || '').trim();
      if (!rawKey || !rawVal || rawVal === 'false' || rawVal === 'true') continue;
      if (/^(colou?r|couleur|size|taille|model|storage|ram)$/i.test(rawKey)) {
        const splitVals = rawVal
          .split(/[,/|]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (splitVals.length > 0) {
          addValuesToAxis(rawKey, splitVals);
        }
      }
    }
  }

  const axes = Array.from(axisMap.values()).filter((a) => a.options.length > 0);

  // Sort axes so Color is first, Size is second, and custom axes follow
  axes.sort((a, b) => {
    const aOrder = a.name === 'Color' ? 0 : a.name === 'Size' ? 1 : 2;
    const bOrder = b.name === 'Color' ? 0 : b.name === 'Size' ? 1 : 2;
    return aOrder - bOrder;
  });

  if (axes.length === 0 && params.useFallbackForPreview !== false) {
    return [
      { name: 'Color', options: ['Forest Green', 'Black', 'Cream', 'Brown', 'Yellow'] },
      { name: 'Size', options: ['XL', 'L', 'M', 'S'] },
    ];
  }

  return axes;
}

/**
 * Ensures we have an array of `totalUnits` variant selection maps,
 * preserving existing user choices and filling defaults from Step 3 axes.
 */
export function normalizeUnitVariantSelections(
  currentSelections: Array<Record<string, string>> | undefined,
  totalUnits: number,
  axes: Step3VariantAxis[]
): Array<Record<string, string>> {
  const safeCount = Math.max(1, totalUnits);
  const result: Array<Record<string, string>> = [];

  for (let i = 0; i < safeCount; i++) {
    const existing = currentSelections?.[i] || {};
    const unitMap: Record<string, string> = {};
    for (const axis of axes) {
      const currentVal = existing[axis.name];
      unitMap[axis.name] =
        currentVal && axis.options.includes(currentVal)
          ? currentVal
          : axis.options[0] || '';
    }
    result.push(unitMap);
  }
  return result;
}

/**
 * Formats a concise human-readable summary of the selected offer tier, per-unit variants,
 * and free gifts for Cart items and Checkout / COD Order Forms.
 */
export function formatOfferSelectionSummary(params: {
  tier: OfferTier;
  unitSelections: Array<Record<string, string>>;
  includeGifts?: boolean;
}): string {
  const { tier, unitSelections, includeGifts = true } = params;
  const parts: string[] = [tier.title];

  if (unitSelections && unitSelections.length > 0) {
    const unitStrings = unitSelections
      .map((u, idx) => {
        const vals = Object.values(u).filter(Boolean);
        return vals.length > 0 ? `#${idx + 1}: ${vals.join(' / ')}` : '';
      })
      .filter(Boolean);
    if (unitStrings.length > 0) {
      parts.push(`(${unitStrings.join(', ')})`);
    }
  }

  if (includeGifts && Array.isArray(tier.freeGifts) && tier.freeGifts.length > 0) {
    const giftLabels = tier.freeGifts.map(
      (g) => `${Math.max(1, g.quantity || 1)}x ${g.name} (FREE)`
    );
    parts.push(`+ Gifts: ${giftLabels.join(', ')}`);
  }

  return parts.join(' ');
}

export interface ResolvedUnitVariantInfo {
  imageUrl: string;
  isOutOfStock: boolean;
  matchedVariantName?: string;
  stock?: number;
}

/**
 * Dynamically resolves product variant image and out-of-stock state for any unit
 * based on selected color/size/model attributes, inspecting Step 3 variants and color swatches.
 */
export function resolveUnitVariantInfo(params: {
  unitIndex?: number;
  unitSelections?: Record<string, string>;
  step3Variants?: Array<{
    name?: string;
    attributes?: Record<string, string>;
    options?: Record<string, string>;
    imageUrl?: string;
    images?: string[];
    stock?: number | string;
    availability?: string;
    isOutOfStock?: boolean;
  }>;
  step3Colors?: Array<
    | {
        name?: string;
        hex?: string;
        imageUrl?: string;
        image?: string;
        images?: string[];
      }
    | string
  >;
  defaultImageUrl?: string;
  productImages?: string[];
}): ResolvedUnitVariantInfo {
  const {
    unitSelections = {},
    step3Variants = [],
    step3Colors = [],
    defaultImageUrl = DEFAULT_HOODIE_THUMBNAIL,
    productImages = [],
  } = params;

  const selEntries = Object.entries(unitSelections).filter(
    ([, v]) => Boolean(v) && String(v).trim().length > 0
  );

  // 1. Try exact attribute match across all selected axes in step3Variants
  if (Array.isArray(step3Variants) && step3Variants.length > 0 && selEntries.length > 0) {
    const exactMatch = step3Variants.find((v) => {
      const attrs = { ...(v.attributes || {}), ...(v.options || {}) };
      return selEntries.every(([axis, chosenVal]) => {
        const cleanAxis = axis.toLowerCase();
        const cleanVal = String(chosenVal).trim().toLowerCase();
        for (const [k, val] of Object.entries(attrs)) {
          if (k.toLowerCase() === cleanAxis) {
            return String(val).trim().toLowerCase() === cleanVal;
          }
        }
        if (v.name && v.name.toLowerCase().includes(cleanVal)) {
          return true;
        }
        return false;
      });
    });

    if (exactMatch) {
      const img =
        (exactMatch.imageUrl && exactMatch.imageUrl.trim()) ||
        (Array.isArray(exactMatch.images) && exactMatch.images[0]?.trim()) ||
        '';
      const outOfStock = Boolean(
        exactMatch.isOutOfStock ||
          exactMatch.availability === 'out_of_stock' ||
          (exactMatch.stock !== undefined &&
            exactMatch.stock !== '' &&
            Number(exactMatch.stock) <= 0)
      );
      if (img) {
        return {
          imageUrl: img,
          isOutOfStock: outOfStock,
          matchedVariantName: exactMatch.name,
          stock: typeof exactMatch.stock === 'number' ? exactMatch.stock : Number(exactMatch.stock),
        };
      }
      // Also check if step3Colors has an image for the selected color before falling back to defaultImageUrl
      const colorEntry = selEntries.find(([axis]) => /colou?r|couleur|لون/i.test(axis));
      if (colorEntry && Array.isArray(step3Colors)) {
        const chosenColor = String(colorEntry[1]).trim().toLowerCase();
        const cIdx = step3Colors.findIndex(
          (c) =>
            typeof c === 'object' &&
            c !== null &&
            String(c.name || '').trim().toLowerCase() === chosenColor
        );
        if (cIdx >= 0) {
          const cObj = step3Colors[cIdx] as {
            name?: string;
            imageUrl?: string;
            image?: string;
            images?: string[];
          };
          const swatchImg =
            (cObj.imageUrl && cObj.imageUrl.trim()) ||
            (cObj.image && cObj.image.trim()) ||
            (Array.isArray(cObj.images) && cObj.images[0]?.trim()) ||
            (productImages[cIdx] && productImages[cIdx].trim()) ||
            '';
          if (swatchImg) {
            return {
              imageUrl: swatchImg,
              isOutOfStock: outOfStock,
              matchedVariantName: exactMatch.name || cObj.name,
              stock:
                typeof exactMatch.stock === 'number' ? exactMatch.stock : Number(exactMatch.stock),
            };
          }
        }
      }
      return {
        imageUrl: defaultImageUrl,
        isOutOfStock: outOfStock,
        matchedVariantName: exactMatch.name,
        stock: typeof exactMatch.stock === 'number' ? exactMatch.stock : Number(exactMatch.stock),
      };
    }

    // 2. Try matching on Color axis specifically if full match didn't find an image
    const colorEntry = selEntries.find(([axis]) => /colou?r|couleur|لون/i.test(axis));
    if (colorEntry) {
      const chosenColor = String(colorEntry[1]).trim().toLowerCase();
      const colorMatch = step3Variants.find((v) => {
        const attrs = { ...(v.attributes || {}), ...(v.options || {}) };
        for (const [k, val] of Object.entries(attrs)) {
          if (/colou?r|couleur|لون/i.test(k) && String(val).trim().toLowerCase() === chosenColor) {
            return true;
          }
        }
        return v.name ? v.name.toLowerCase().includes(chosenColor) : false;
      });

      if (colorMatch) {
        const img =
          (colorMatch.imageUrl && colorMatch.imageUrl.trim()) ||
          (Array.isArray(colorMatch.images) && colorMatch.images[0]?.trim()) ||
          '';
        const outOfStock = Boolean(
          colorMatch.isOutOfStock ||
            colorMatch.availability === 'out_of_stock' ||
            (colorMatch.stock !== undefined &&
              colorMatch.stock !== '' &&
              Number(colorMatch.stock) <= 0)
        );
        if (img) {
          return {
            imageUrl: img,
            isOutOfStock: outOfStock,
            matchedVariantName: colorMatch.name,
            stock:
              typeof colorMatch.stock === 'number' ? colorMatch.stock : Number(colorMatch.stock),
          };
        }
      }
    }
  }

  // 3. Check step3Colors for custom image attached to the color swatch (or positional productImages[cIdx])
  const colorEntry = selEntries.find(([axis]) => /colou?r|couleur|لون/i.test(axis));
  if (colorEntry && Array.isArray(step3Colors)) {
    const chosenColor = String(colorEntry[1]).trim().toLowerCase();
    for (let cIdx = 0; cIdx < step3Colors.length; cIdx++) {
      const c = step3Colors[cIdx];
      if (typeof c === 'object' && c !== null) {
        const cName = String(c.name || '').trim().toLowerCase();
        if (cName === chosenColor) {
          const cImg =
            (c.imageUrl && c.imageUrl.trim()) ||
            (c.image && c.image.trim()) ||
            (Array.isArray(c.images) && c.images[0]?.trim()) ||
            (productImages[cIdx] && productImages[cIdx].trim()) ||
            '';
          if (cImg) {
            return {
              imageUrl: cImg,
              isOutOfStock: false,
              matchedVariantName: c.name,
            };
          }
        }
      }
    }
  }

  // 4. Default to primary product image
  const fallbackImg =
    (defaultImageUrl && defaultImageUrl.trim()) ||
    (productImages && productImages[0]?.trim()) ||
    DEFAULT_HOODIE_THUMBNAIL;

  return {
    imageUrl: fallbackImg,
    isOutOfStock: false,
  };
}

/**
 * Checks if a particular variant option (e.g., color "Pink" or size "XL") is completely out of stock.
 */
export function isVariantOptionValueOutOfStock(params: {
  axisName: string;
  optionValue: string;
  step3Variants?: Array<{
    name?: string;
    attributes?: Record<string, string>;
    options?: Record<string, string>;
    stock?: number | string;
    availability?: string;
    isOutOfStock?: boolean;
  }>;
}): boolean {
  const { axisName, optionValue, step3Variants } = params;
  if (!Array.isArray(step3Variants) || step3Variants.length === 0) {
    return false;
  }
  const cleanAxis = axisName.trim().toLowerCase();
  const cleanVal = optionValue.trim().toLowerCase();

  const matchingVariants = step3Variants.filter((v) => {
    const attrs = { ...(v.attributes || {}), ...(v.options || {}) };
    for (const [k, val] of Object.entries(attrs)) {
      if (k.toLowerCase() === cleanAxis && String(val).toLowerCase() === cleanVal) {
        return true;
      }
    }
    if (v.name && v.name.toLowerCase().includes(cleanVal)) {
      return true;
    }
    return false;
  });

  if (matchingVariants.length === 0) {
    return false;
  }

  return matchingVariants.every(
    (v) =>
      Boolean(v.isOutOfStock) ||
      v.availability === 'out_of_stock' ||
      (v.stock !== undefined && v.stock !== '' && Number(v.stock) <= 0)
  );
}

export interface PlayingCardTransform {
  rotateDeg: number;
  translateX: number;
  translateY: number;
  zIndex: number;
  scale: number;
}

/**
 * Calculates smooth playing card fanned layouts for 1, 2, or 3+ items:
 * - 1 item: 1 card, flat, upright
 * - 2 items (Duo): 2 cards fanned sequentially (rear card rotated -8deg, front card +5deg)
 * - 3+ items (Trio+): 3 cards fanned sequentially (-13deg, -3deg, +6deg) with back portions visible
 * - When `isExpanded` is true (user clicked the item image stack), cards fan out wider with enhanced separation.
 */
export function calculatePlayingCardTransforms(
  totalCards: number,
  maxCardsToShow: number = 3,
  options?: { isExpanded?: boolean; frontCardIndex?: number }
): PlayingCardTransform[] {
  const count = Math.min(Math.max(1, totalCards), maxCardsToShow);
  const isExpanded = Boolean(options?.isExpanded);
  const frontIdx =
    typeof options?.frontCardIndex === 'number' && options.frontCardIndex >= 0
      ? options.frontCardIndex % count
      : 0;

  if (count === 1) {
    return [
      {
        rotateDeg: 0,
        translateX: 0,
        translateY: isExpanded ? -2 : 0,
        zIndex: 10,
        scale: isExpanded ? 1.05 : 1,
      },
    ];
  }

  const baseSlots: PlayingCardTransform[] =
    count === 2
      ? isExpanded
        ? [
            { rotateDeg: 9, translateX: 8, translateY: 2, zIndex: 20, scale: 1.04 },
            { rotateDeg: -14, translateX: -9, translateY: -3, zIndex: 10, scale: 0.96 },
          ]
        : [
            { rotateDeg: 5, translateX: 4, translateY: 2, zIndex: 10, scale: 1 },
            { rotateDeg: -8, translateX: -5, translateY: -2, zIndex: 5, scale: 0.94 },
          ]
      : isExpanded
      ? [
          { rotateDeg: 11, translateX: 10, translateY: 3, zIndex: 30, scale: 1.04 },
          { rotateDeg: -2, translateX: 0, translateY: -2, zIndex: 20, scale: 0.98 },
          { rotateDeg: -17, translateX: -11, translateY: -5, zIndex: 10, scale: 0.93 },
        ]
      : [
          { rotateDeg: 6, translateX: 6, translateY: 3, zIndex: 20, scale: 1 },
          { rotateDeg: -3, translateX: 0, translateY: -1, zIndex: 10, scale: 0.95 },
          { rotateDeg: -13, translateX: -7, translateY: -4, zIndex: 5, scale: 0.9 },
        ];

  if (frontIdx === 0) {
    return baseSlots;
  }

  // Rotate slot assignments so `frontIdx` receives baseSlots[0] (the front-most position)
  const reordered: PlayingCardTransform[] = [];
  for (let i = 0; i < count; i++) {
    const slotPos = (i - frontIdx + count) % count;
    reordered.push(baseSlots[slotPos]);
  }
  return reordered;
}

