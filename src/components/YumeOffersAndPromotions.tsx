import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SkeuomorphicSwitch } from './SkeuomorphicSwitch';
import {
  OfferType,
  OfferTier,
  OfferGiftItem,
  ProductOffersConfig,
  OFFER_THEME_PALETTES,
  getOfferThemePalette,
  calculateOfferTierPricing,
  applyOfferTypePreset,
  extractStep3VariantAxes,
  normalizeUnitVariantSelections,
  resolveMostPopularTierId,
  getAdminPopularSalesThreshold,
  resolveVariantColorHex,
  DEFAULT_HOODIE_THUMBNAIL,
  DEFAULT_CAP_THUMBNAIL,
  DEFAULT_HAT_THUMBNAIL,
  DEFAULT_SCRUNCHIE_THUMBNAIL,
  DEFAULT_SUNGLASSES_THUMBNAIL,
  Step3VariantAxis,
  resolveUnitVariantInfo,
  isVariantOptionValueOutOfStock,
  calculatePlayingCardTransforms,
  DEFAULT_OFFERS_CONFIG,
} from '../utils/offersLogic';
import {
  Tag,
  Percent,
  DollarSign,
  Gift,
  Image as ImageIcon,
  Award,
  Bookmark,
  Layers,
  Plus,
  Trash2,
  Sparkles,
  Check,
  Sliders,
  X,
  ExternalLink,
  Upload,
  Star,
  Camera,
  RotateCcw,
  Lock,
  Unlock,
  Users,
  ArrowLeft,
  HelpCircle,
  Info,
  Palette,
} from 'lucide-react';

export interface StoreGiftCandidate {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export interface ImagePickerTarget {
  type: 'tier' | 'gift';
  tierId: string;
  giftId?: string;
}

export interface YumeCustomerOfferWidgetProps {
  offersConfig: ProductOffersConfig;
  baseUnitPrice: number;
  currencySymbol?: string;
  currencyPosition?: 'prefix' | 'suffix' | string;
  productImageUrl?: string;
  productImages?: string[];
  step3Axes: Step3VariantAxis[];
  step3Colors?: Array<{ name?: string; hex?: string } | string>;
  step3Variants?: Array<{
    name?: string;
    attributes?: Record<string, string>;
    options?: Record<string, string>;
    imageUrl?: string;
    images?: string[];
    stock?: number;
    isOutOfStock?: boolean;
  }>;
  selectedTierId: string;
  onSelectTier: (tierId: string) => void;
  unitSelections: Record<string, string>[];
  onChangeUnitSelection: (unitIndex: number, axisName: string, value: string) => void;
  compact?: boolean;
  /** When true, makes all offer creation and editing happen directly inside the Preview cards */
  editable?: boolean;
  onChangeConfig?: (nextConfig: ProductOffersConfig) => void;
  storeProducts?: StoreGiftCandidate[];
  onAddTier?: () => void;
}

export function formatOfferMoney(
  amount: number,
  currencySymbol: string = 'DZD',
  currencyPosition: 'prefix' | 'suffix' | string = 'suffix'
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const isDzd =
    currencySymbol.trim().toUpperCase() === 'DZD' ||
    currencySymbol.trim().toUpperCase() === 'DA';
  const formatted = isDzd
    ? Number.isInteger(Math.round(safe * 100) / 100)
      ? Math.round(safe).toLocaleString('en-US')
      : safe.toFixed(2)
    : Number.isInteger(Math.round(safe * 100) / 100)
    ? Math.round(safe).toLocaleString('en-US')
    : safe.toFixed(2);
  if (currencyPosition === 'suffix' || isDzd) {
    return `${formatted} ${currencySymbol}`;
  }
  return `${currencySymbol}${formatted}`;
}

/**
 * Clean diagonal cross-mark slash ("/") overlay indicating an unavailable or out-of-stock variant.
 */
export const CrossMarkSlashOverlay: React.FC<{ label?: string }> = ({
  label = 'Out of stock',
}) => (
  <div
    className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden rounded-2xl"
    title="Selected variant is out of stock / unavailable"
  >
    {/* Semi-transparent background wash */}
    <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[0.5px]" />

    {/* Sharp diagonal red cross-mark slash across card */}
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* High-contrast white border */}
      <line
        x1="12"
        y1="88"
        x2="88"
        y2="12"
        stroke="#ffffff"
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* Red cross-mark slash */}
      <line
        x1="12"
        y1="88"
        x2="88"
        y2="12"
        stroke="#dc2626"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
    </svg>

    {/* Tiny pill badge */}
    <span className="absolute bottom-1 px-1.5 py-0.5 rounded bg-rose-600/95 text-white text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider leading-none shadow-xs border border-white/80">
      {label}
    </span>
  </div>
);

export interface PlayingCardProductStackProps {
  units: Array<{ imageUrl: string; isOutOfStock?: boolean; title?: string; variantLabel?: string }>;
  totalUnits: number;
  tierTitle: string;
  editable?: boolean;
  onOpenImagePicker?: () => void;
  tierId: string;
  isExpanded?: boolean;
  frontCardIndex?: number;
  onToggleExpandItems?: () => void;
}

/**
 * Professional Sequential Playing Cards Stack for Offer Products:
 * - 1 item: 1 crisp card
 * - 2 items (Duo): 2 cards fanned out like playing cards with the rear item visible
 * - 3+ items (Trio+): 3 cards fanned out sequentially (-13deg, -3deg, +6deg) with back portions visible
 * - Clicking the item image stack animates displaying the rest of the chosen items
 * - Updates dynamically to match selected unit colors/models
 * - Shows diagonal cross-mark slash if variant is unavailable
 */
export const PlayingCardProductStack: React.FC<PlayingCardProductStackProps> = ({
  units,
  totalUnits,
  tierTitle,
  editable,
  onOpenImagePicker,
  tierId,
  isExpanded = false,
  frontCardIndex = 0,
  onToggleExpandItems,
}) => {
  const count = Math.max(1, totalUnits);
  const cardsToShow = Math.min(count, 3);
  const transforms = calculatePlayingCardTransforms(count, 3, {
    isExpanded,
    frontCardIndex,
  });

  // Single card mode (1 unit)
  if (cardsToShow === 1) {
    const unit = units[0] || { imageUrl: DEFAULT_HOODIE_THUMBNAIL };
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`View ${tierTitle} item image`}
        data-testid={`offer-tier-image-stack-${tierId}`}
        className={`relative w-[52px] h-[52px] sm:w-[62px] sm:h-[62px] rounded-xl sm:rounded-2xl bg-white shadow-xs border flex items-center justify-center overflow-hidden shrink-0 group transition-all duration-300 cursor-pointer ${
          isExpanded
            ? 'border-emerald-600 ring-2 ring-emerald-500/20 scale-105'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (onToggleExpandItems) {
            onToggleExpandItems();
          } else if (editable && onOpenImagePicker) {
            onOpenImagePicker();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onToggleExpandItems?.();
          }
        }}
      >
        <img
          src={unit.imageUrl}
          alt={tierTitle}
          className="w-full h-full object-contain p-1 sm:p-1.5 transition-transform duration-300 group-hover:scale-105"
        />
        {unit.isOutOfStock && <CrossMarkSlashOverlay />}
        {editable && onOpenImagePicker && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenImagePicker();
            }}
            className="absolute bottom-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer shadow-xs z-30"
            title="Change tier image"
            aria-label={`Change ${tierTitle} image`}
            data-testid={`change-tier-image-btn-${tierId}`}
          >
            <Camera size={11} />
          </button>
        )}
      </div>
    );
  }

  // 2 or 3+ playing cards fanned sequentially
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${totalUnits} items in ${tierTitle}`}
      data-testid={`offer-tier-image-stack-${tierId}`}
      className="relative w-[52px] h-[52px] sm:w-[62px] sm:h-[62px] shrink-0 select-none focus:outline-none"
      onClick={(e) => {
        e.stopPropagation();
        if (editable && onOpenImagePicker) {
          onOpenImagePicker();
        }
      }}
    >
      {/* Render rear cards first (higher index) up to front card (index 0) */}
      {Array.from({ length: cardsToShow })
        .map((_, idx) => cardsToShow - 1 - idx)
        .map((cardIndex) => {
          const unit = units[cardIndex] || units[0] || { imageUrl: DEFAULT_HOODIE_THUMBNAIL };
          const t = transforms[cardIndex] || transforms[0];
          const isFrontCard = (frontCardIndex % cardsToShow) === cardIndex;

          return (
            <div
              key={cardIndex}
              className={`absolute inset-0 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center overflow-hidden ring-1 ${
                isFrontCard
                  ? 'shadow-md ring-slate-300/90'
                  : 'shadow-xs border border-slate-200/90 ring-slate-300/70'
              }`}
              style={{
                transform: `rotate(${t.rotateDeg}deg) translate(${t.translateX}px, ${t.translateY}px) scale(${t.scale})`,
                zIndex: t.zIndex,
                transformOrigin: 'bottom center',
                transition: 'all 420ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <img
                src={unit.imageUrl}
                alt={`${tierTitle} item #${cardIndex + 1}`}
                className="w-full h-full object-contain p-1 sm:p-1.5 transition-transform duration-300"
              />
              {unit.isOutOfStock && <CrossMarkSlashOverlay />}

              {/* Sequential unit number tag on cards */}
              <span
                className={`absolute top-0.5 left-0.5 sm:top-1 sm:left-1 px-1 py-0.2 rounded text-[7.5px] sm:text-[8px] font-bold leading-none transition-colors ${
                  isFrontCard
                    ? 'bg-slate-900/80 text-white'
                    : 'bg-slate-900/70 text-white'
                }`}
              >
                #{cardIndex + 1}
              </span>
            </div>
          );
        })}

      {editable && onOpenImagePicker && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenImagePicker();
          }}
          className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer shadow-xs border border-white z-40"
          title="Change tier image"
          aria-label={`Change ${tierTitle} image`}
          data-testid={`change-tier-image-btn-${tierId}`}
        >
          <Camera size={10} />
        </button>
      )}
    </div>
  );
};

/**
 * Customer-facing & Live Inline-Editable Preview Offer Widget.
 * - Both Offer Tier Images and Gift Images share the exact same clean rounded card layout
 * - Interactive image changing feature (upload, choose from product gallery, or store products) applied to both Offer and Gift images
 * - Frictionless inline price, compare-at price, quantity, title, and variant swatch editing
 */
export const YumeCustomerOfferWidget: React.FC<YumeCustomerOfferWidgetProps> = ({
  offersConfig,
  baseUnitPrice,
  currencySymbol = 'DZD',
  currencyPosition = 'suffix',
  productImageUrl,
  productImages = [],
  step3Axes,
  step3Colors,
  step3Variants = [],
  selectedTierId,
  onSelectTier,
  unitSelections,
  onChangeUnitSelection,
  compact = false,
  editable = false,
  onChangeConfig,
  storeProducts = [],
  onAddTier,
}) => {
  const palette = getOfferThemePalette(offersConfig.themeColorId);
  const features = offersConfig.features || {
    freeGift: true,
    addImage: true,
    tierBadge: true,
    offerLabel: true,
    variants: true,
    compareAtPrice: true,
    customHeader: true,
    mostPopularHighlight: true,
    unitPriceSubtitle: false,
  };

  // Listen to admin threshold updates
  const [adminThreshold, setAdminThreshold] = useState<number>(() =>
    getAdminPopularSalesThreshold()
  );

  useEffect(() => {
    const handleThresholdUpdate = () => {
      setAdminThreshold(getAdminPopularSalesThreshold());
    };
    window.addEventListener('yume_offer_threshold_updated', handleThresholdUpdate);
    return () =>
      window.removeEventListener('yume_offer_threshold_updated', handleThresholdUpdate);
  }, []);

  // Local text draft states so the user can freely backspace, clear, and type prices/quantities without jumping or clamping mid-typing
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [comparePriceDrafts, setComparePriceDrafts] = useState<Record<string, string>>({});
  const [qtyDrafts, setQtyDrafts] = useState<Record<string, string>>({});

  // Active target for changing either an Offer Tier Image or a Gift Image
  const [activeImagePickerTarget, setActiveImagePickerTarget] = useState<ImagePickerTarget | null>(null);
  const [imagePickerTab, setImagePickerTab] = useState<'upload' | 'product' | 'store'>('upload');

  // Track which tier card currently has the inline "+ Add Gift" picker open
  const [openGiftPickerTierId, setOpenGiftPickerTierId] = useState<string | null>(null);
  const [giftPickerTab, setGiftPickerTab] = useState<'store' | 'upload'>('store');
  const [customGiftName, setCustomGiftName] = useState<string>('Baseball Cap');
  const [customGiftPrice, setCustomGiftPrice] = useState<string>('800');
  const [customGiftImage, setCustomGiftImage] = useState<string>(DEFAULT_CAP_THUMBNAIL);

  // Track selected gift variant per gift ID for customer interaction
  const [giftVariantMap, setGiftVariantMap] = useState<Record<string, string>>({});

  // Track selections per tier to isolate variant changes strictly to the selected tier
  const [tierSelectionsByTier, setTierSelectionsByTier] = useState<
    Record<string, Record<string, string>[]>
  >({});

  const handleUnitSelectionChange = (
    unitIndex: number,
    axisName: string,
    value: string
  ) => {
    setTierSelectionsByTier((prev) => {
      const activeList = prev[selectedTierId]
        ? [...prev[selectedTierId]]
        : [...unitSelections];
      activeList[unitIndex] = {
        ...(activeList[unitIndex] || {}),
        [axisName]: value,
      };
      return {
        ...prev,
        [selectedTierId]: activeList,
      };
    });
    onChangeUnitSelection(unitIndex, axisName, value);
  };

  const [activeFrontCardByTier, setActiveFrontCardByTier] = useState<Record<string, number>>({});

  const handleToggleTierItemsShowcase = (tierId: string, isTierSelected: boolean) => {
    if (!isTierSelected) {
      onSelectTier(tierId);
    }
  };

  // Effective primary product image: Step 1 main image or first gallery image, properly prioritized
  const effectivePrimaryProductThumb =
    (productImageUrl && productImageUrl.trim()) ||
    (productImages && productImages.length > 0 && productImages[0]?.trim()) ||
    DEFAULT_HOODIE_THUMBNAIL;

  const defaultProductThumb = effectivePrimaryProductThumb;

  const activeTier =
    offersConfig.tiers.find((t) => t.id === selectedTierId) || offersConfig.tiers[0];

  const popularResolution = resolveMostPopularTierId(offersConfig, adminThreshold);

  // Helper to determine the effective thumbnail for any tier
  const getTierThumb = (tier: OfferTier) => {
    if (
      tier.imageUrl &&
      tier.imageUrl.trim() &&
      tier.imageUrl !== DEFAULT_HOODIE_THUMBNAIL &&
      !tier.imageUrl.includes('photo_2026-10-28_22-36-01')
    ) {
      return tier.imageUrl;
    }
    return defaultProductThumb;
  };

  // Helper to determine the effective thumbnail for any gift
  const getGiftThumb = (gift: OfferGiftItem) => {
    if (gift.imageUrl && gift.imageUrl.trim()) {
      return gift.imageUrl;
    }
    return DEFAULT_CAP_THUMBNAIL;
  };

  // Order axes so Color comes first (rendered as circular swatches) and Size / other axes follow (rendered as compact dropdowns)
  const orderedAxes = React.useMemo(() => {
    const copy = [...step3Axes];
    copy.sort((a, b) => {
      const aIsColor = /colou?r|couleur|لون/i.test(a.name);
      const bIsColor = /colou?r|couleur|لون/i.test(b.name);
      if (aIsColor && !bIsColor) return -1;
      if (!aIsColor && bIsColor) return 1;
      return 0;
    });
    return copy;
  }, [step3Axes]);

  const handleUpdateTier = (tierId: string, patch: Partial<OfferTier>) => {
    if (!onChangeConfig) return;
    const nextTiers = offersConfig.tiers.map((t) => {
      if (t.id !== tierId) return t;
      const merged = { ...t, ...patch };
      if (offersConfig.offerType === 'bogo') {
        const buy = Math.max(1, Math.floor(Number(merged.buyQty) || 1));
        const free = Math.max(0, Math.floor(Number(merged.freeQty) || 0));
        merged.buyQty = buy;
        merged.freeQty = free;
        merged.totalUnits = buy + free;
      } else {
        const units = Math.max(
          1,
          Math.floor(Number(merged.totalUnits) || Number(merged.buyQty) || 1)
        );
        merged.totalUnits = units;
        merged.buyQty = units;
        merged.freeQty = 0;
      }
      return merged;
    });
    onChangeConfig({ ...offersConfig, tiers: nextTiers });
  };

  const handleRemoveTier = (tierId: string) => {
    if (!onChangeConfig || offersConfig.tiers.length <= 1) return;
    const nextTiers = offersConfig.tiers.filter((t) => t.id !== tierId);
    const nextPopular =
      offersConfig.merchantMostPopularTierId === tierId
        ? nextTiers[0]?.id
        : offersConfig.merchantMostPopularTierId;
    onChangeConfig({
      ...offersConfig,
      tiers: nextTiers,
      defaultSelectedTierId: nextTiers[0]?.id,
      merchantMostPopularTierId: nextPopular,
    });
    if (selectedTierId === tierId && nextTiers[0]) {
      onSelectTier(nextTiers[0].id);
    }
  };

  const handleSelectMerchantMostPopular = (tierId: string) => {
    if (!onChangeConfig || popularResolution.isAutomatic) return;
    const isCurrentlyPopular = popularResolution.mostPopularTierId === tierId;
    const nextPopularId = isCurrentlyPopular ? '' : tierId;
    const nextTiers = offersConfig.tiers.map((t) => ({
      ...t,
      tierBadge: t.id === nextPopularId ? 'Most Popular' : '',
    }));
    onChangeConfig({
      ...offersConfig,
      merchantMostPopularTierId: nextPopularId,
      tiers: nextTiers,
    });
  };

  const applyOfferPriceValue = (
    tier: OfferTier,
    currentCompareAtTotal: number,
    numericVal: number
  ) => {
    if (!onChangeConfig) return;
    const safePrice = Math.max(0, Math.round(numericVal * 100) / 100);
    const nextCompareAt =
      currentCompareAtTotal < safePrice ? safePrice : currentCompareAtTotal;
    const savingsAmt = Math.max(0, nextCompareAt - safePrice);
    const savingsPct =
      nextCompareAt > 0 ? Math.round((savingsAmt / nextCompareAt) * 100) : 0;
    const nextLabel = savingsPct <= 0 ? 'Base Price' : `${savingsPct}% OFF`;

    const patch: Partial<OfferTier> = {
      customFinalPrice: safePrice,
      offerLabel: nextLabel,
    };
    if (currentCompareAtTotal < safePrice) {
      patch.customCompareAtPrice = safePrice;
    }

    if (offersConfig.offerType === 'fixed_price') {
      patch.discountValue = safePrice;
    } else if (offersConfig.offerType === 'flat_off') {
      patch.discountValue = Math.round(savingsAmt * 100) / 100;
    } else if (offersConfig.offerType === 'percent_off') {
      const exactPct =
        nextCompareAt > 0
          ? Math.round(((nextCompareAt - safePrice) / nextCompareAt) * 10000) / 100
          : 0;
      patch.discountValue = Math.max(0, Math.min(100, exactPct));
    }

    handleUpdateTier(tier.id, patch);
  };

  const handlePriceInputChange = (
    tier: OfferTier,
    currentCompareAtTotal: number,
    rawText: string
  ) => {
    const cleaned = rawText.replace(/[^0-9.]/g, '');
    setPriceDrafts((prev) => ({ ...prev, [tier.id]: cleaned }));

    if (cleaned.trim() === '') return;
    const parsed = parseFloat(cleaned);
    if (Number.isFinite(parsed) && parsed >= 0) {
      applyOfferPriceValue(tier, currentCompareAtTotal, parsed);
    }
  };

  const handlePriceInputBlur = (
    tier: OfferTier,
    currentCompareAtTotal: number,
    fallbackFinalPrice: number
  ) => {
    const draft = priceDrafts[tier.id];
    if (draft !== undefined) {
      const parsed = parseFloat(draft);
      if (Number.isFinite(parsed) && parsed >= 0) {
        applyOfferPriceValue(tier, currentCompareAtTotal, parsed);
      } else {
        applyOfferPriceValue(tier, currentCompareAtTotal, fallbackFinalPrice);
      }
      setPriceDrafts((prev) => {
        const next = { ...prev };
        delete next[tier.id];
        return next;
      });
    }
  };

  const handleComparePriceInputChange = (
    tier: OfferTier,
    currentFinalPrice: number,
    rawText: string
  ) => {
    const cleaned = rawText.replace(/[^0-9.]/g, '');
    setComparePriceDrafts((prev) => ({ ...prev, [tier.id]: cleaned }));

    if (cleaned.trim() === '') return;
    const parsed = parseFloat(cleaned);
    if (Number.isFinite(parsed) && parsed > 0) {
      const safeCompare = Math.max(currentFinalPrice, Math.round(parsed * 100) / 100);
      const savingsAmt = Math.max(0, safeCompare - currentFinalPrice);
      const savingsPct =
        safeCompare > 0 ? Math.round((savingsAmt / safeCompare) * 100) : 0;
      handleUpdateTier(tier.id, {
        customCompareAtPrice: safeCompare,
        customFinalPrice: currentFinalPrice,
        offerLabel: savingsPct <= 0 ? 'Base Price' : `${savingsPct}% OFF`,
      });
    }
  };

  const handleComparePriceInputBlur = (
    tier: OfferTier,
    currentFinalPrice: number
  ) => {
    const draft = comparePriceDrafts[tier.id];
    if (draft !== undefined) {
      const parsed = parseFloat(draft);
      if (Number.isFinite(parsed) && parsed > 0) {
        const safeCompare = Math.max(currentFinalPrice, Math.round(parsed * 100) / 100);
        handleUpdateTier(tier.id, {
          customCompareAtPrice: safeCompare,
          customFinalPrice: currentFinalPrice,
        });
      }
      setComparePriceDrafts((prev) => {
        const next = { ...prev };
        delete next[tier.id];
        return next;
      });
    }
  };

  // Directly sets the image on either the Offer Tier or a Gift Item
  const handleApplyImageToTarget = (imageUrl: string) => {
    if (!activeImagePickerTarget) return;
    const { type, tierId, giftId } = activeImagePickerTarget;
    if (type === 'tier') {
      handleUpdateTier(tierId, { imageUrl });
    } else if (type === 'gift' && giftId) {
      const tier = offersConfig.tiers.find((t) => t.id === tierId);
      if (!tier) return;
      const nextGifts = (tier.freeGifts || []).map((g) =>
        g.id === giftId ? { ...g, imageUrl } : g
      );
      handleUpdateTier(tierId, { freeGifts: nextGifts });
    }
    setActiveImagePickerTarget(null);
  };

  // Resets the image back to default (for tier: product image, for gift: default cap)
  const handleResetImageTarget = () => {
    if (!activeImagePickerTarget) return;
    const { type, tierId, giftId } = activeImagePickerTarget;
    if (type === 'tier') {
      handleUpdateTier(tierId, { imageUrl: '' });
    } else if (type === 'gift' && giftId) {
      const tier = offersConfig.tiers.find((t) => t.id === tierId);
      if (!tier) return;
      const nextGifts = (tier.freeGifts || []).map((g) =>
        g.id === giftId ? { ...g, imageUrl: '' } : g
      );
      handleUpdateTier(tierId, { freeGifts: nextGifts });
    }
    setActiveImagePickerTarget(null);
  };

  const handleUploadImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleApplyImageToTarget(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateGiftItem = (
    tierId: string,
    giftId: string,
    patch: Partial<OfferGiftItem>
  ) => {
    const tier = offersConfig.tiers.find((t) => t.id === tierId);
    if (!tier) return;
    const nextGifts = (tier.freeGifts || []).map((g) =>
      g.id === giftId ? { ...g, ...patch } : g
    );
    handleUpdateTier(tierId, { freeGifts: nextGifts });
  };

  const handleNewGiftFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomGiftImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddStoreProductGift = (tierId: string, prod: StoreGiftCandidate) => {
    const tier = offersConfig.tiers.find((t) => t.id === tierId);
    if (!tier) return;
    const newGift: OfferGiftItem = {
      id: `gift-store-${prod.id}-${Date.now()}`,
      name: prod.name,
      imageUrl: prod.imageUrl || DEFAULT_CAP_THUMBNAIL,
      quantity: 1,
      originalPrice: Math.max(0, Number(prod.price) || 0),
      isCustom: false,
      storeProductId: prod.id,
      selectedVariant: 'Black',
      variantOptions: ['Black', 'White', 'Forest Green', 'Beige'],
    };
    handleUpdateTier(tierId, {
      freeGifts: [...(tier.freeGifts || []), newGift],
    });
    setOpenGiftPickerTierId(null);
  };

  const handleAddUploadedCustomGift = (tierId: string) => {
    const tier = offersConfig.tiers.find((t) => t.id === tierId);
    if (!tier) return;
    const newGift: OfferGiftItem = {
      id: `gift-custom-${Date.now()}`,
      name: customGiftName.trim() || 'Baseball Cap',
      imageUrl: customGiftImage || DEFAULT_CAP_THUMBNAIL,
      quantity: 1,
      originalPrice: Math.max(0, parseFloat(customGiftPrice || '0') || 0),
      isCustom: true,
      selectedVariant: 'Black',
      variantOptions: ['Black', 'White', 'Forest Green', 'Beige'],
    };
    handleUpdateTier(tierId, {
      freeGifts: [...(tier.freeGifts || []), newGift],
    });
    setOpenGiftPickerTierId(null);
    setCustomGiftName('Baseball Cap');
    setCustomGiftPrice('800');
  };

  const handleRemoveGift = (tierId: string, giftId: string) => {
    const tier = offersConfig.tiers.find((t) => t.id === tierId);
    if (!tier) return;
    handleUpdateTier(tierId, {
      freeGifts: (tier.freeGifts || []).filter((g) => g.id !== giftId),
    });
  };

  // Find currently targeted image for the modal preview
  const currentTargetImageUrl = (() => {
    if (!activeImagePickerTarget) return '';
    const tier = offersConfig.tiers.find((t) => t.id === activeImagePickerTarget.tierId);
    if (!tier) return '';
    if (activeImagePickerTarget.type === 'tier') {
      return getTierThumb(tier);
    }
    const gift = tier.freeGifts.find((g) => g.id === activeImagePickerTarget.giftId);
    return gift ? getGiftThumb(gift) : DEFAULT_CAP_THUMBNAIL;
  })();

  return (
    <div className="w-full select-none" data-testid="yume-customer-offer-widget">
      {/* Header with flanking horizontal lines: "Buy More Save More" (Editable directly in Preview) */}
      {features.customHeader !== false && (
        <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-2.5">
          <div className="h-[1.5px] flex-1 bg-slate-200" />
          {editable && onChangeConfig ? (
            <input
              type="text"
              aria-label="Offer section header title"
              value={offersConfig.headerTitle}
              onChange={(e) =>
                onChangeConfig({ ...offersConfig, headerTitle: e.target.value })
              }
              placeholder="Buy More Save More"
              data-testid="inline-offer-header-input"
              className={`${
                compact ? 'text-[15px]' : 'text-[16px] sm:text-[18px]'
              } font-extrabold tracking-tight text-center bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-500 focus:outline-none px-2 py-0.5 min-w-[160px] max-w-[260px]`}
              style={{ color: palette.headerTextHex }}
            />
          ) : (
            <h3
              className={`${
                compact ? 'text-[15px]' : 'text-[16px] sm:text-[18px]'
              } font-extrabold tracking-tight text-center shrink-0`}
              style={{ color: palette.headerTextHex }}
            >
              {offersConfig.headerTitle || 'Buy More Save More'}
            </h3>
          )}
          <div className="h-[1.5px] flex-1 bg-slate-200" />
        </div>
      )}



      {/* Quantity Tiers Stack */}
      <div className="space-y-2.5 sm:space-y-3">
        {offersConfig.tiers.map((tier, tierIdx) => {
          const isSelected = activeTier?.id === tier.id;
          const pricing = calculateOfferTierPricing(
            tier,
            baseUnitPrice,
            offersConfig.offerType
          );
          const tierThumb = getTierThumb(tier);
          const hasFreeGifts =
            features.freeGift !== false &&
            Array.isArray(tier.freeGifts) &&
            tier.freeGifts.length > 0;

          const isThisTierMostPopular =
            features.tierBadge !== false &&
            features.mostPopularHighlight !== false &&
            popularResolution.mostPopularTierId === tier.id;

          // Isolate variant selections strictly per tier.
          // For the selected tier, use active unit selections.
          // For unselected tiers, use only selections explicitly made for that tier (or empty [] so it doesn't copy the selected tier's variant images)
          const activeTierRawUnits = tierSelectionsByTier[tier.id] || unitSelections;
          const normalizedUnits = normalizeUnitVariantSelections(
            isSelected ? activeTierRawUnits : (tierSelectionsByTier[tier.id] || []),
            pricing.totalUnits,
            orderedAxes
          );

          const isGiftPickerOpen = openGiftPickerTierId === tier.id;

          const displayedOfferPrice =
            priceDrafts[tier.id] !== undefined
              ? priceDrafts[tier.id]
              : String(pricing.finalPrice);

          const displayedComparePrice =
            comparePriceDrafts[tier.id] !== undefined
              ? comparePriceDrafts[tier.id]
              : String(pricing.compareAtTotal);

          return (
            <div
              key={tier.id}
              onClick={() => {
                if (!isSelected) onSelectTier(tier.id);
              }}
              data-testid={`offer-tier-card-${tier.id}`}
              className={`relative rounded-[15px] sm:rounded-[16px] transition-all duration-200 ${
                isSelected
                  ? 'cursor-default shadow-[0_2px_10px_rgba(0,0,0,0.04)]'
                  : 'cursor-pointer hover:brightness-[0.99]'
              }`}
              style={{
                backgroundColor: isSelected ? '#ffffff' : palette.unselectedBgHex,
                borderWidth: isSelected ? '2px' : '1.5px',
                borderStyle: 'solid',
                borderColor: isSelected ? palette.borderHex : palette.unselectedBorderHex,
              }}
            >
              {/* Top-Right "Most Popular" Ribbon with angled 3D ear folds */}
              {isThisTierMostPopular && (
                <div
                  className="absolute -top-[9px] right-3 sm:right-4 z-10 flex items-center"
                  onClick={(e) => {
                    if (editable && !popularResolution.isAutomatic) {
                      e.stopPropagation();
                      handleSelectMerchantMostPopular(tier.id);
                    }
                  }}
                >
                  {/* Left angled fold ear */}
                  <div
                    className="w-0 h-0 self-start"
                    style={{
                      borderBottom: `9px solid ${palette.ribbonBgHex}`,
                      borderLeft: '6px solid transparent',
                      filter: 'brightness(0.75)',
                    }}
                  />
                  {/* Ribbon body */}
                  <div
                    className={`px-3 sm:px-3.5 py-0.5 sm:py-1 rounded-b-[7px] text-white font-bold text-[11px] sm:text-[12px] leading-none tracking-wide flex items-center gap-1 ${
                      editable && !popularResolution.isAutomatic
                        ? 'cursor-pointer hover:opacity-95'
                        : ''
                    }`}
                    style={{ backgroundColor: palette.ribbonBgHex }}
                    title={
                      editable
                        ? popularResolution.isAutomatic
                          ? 'Automatically assigned as Most Popular'
                          : 'Most Popular offer'
                        : undefined
                    }
                  >
                    <span>Most Popular</span>
                    {editable && popularResolution.isAutomatic && (
                      <span className="text-[9.5px] opacity-85 font-normal">
                        (Auto)
                      </span>
                    )}
                  </div>
                  {/* Right angled fold ear */}
                  <div
                    className="w-0 h-0 self-start"
                    style={{
                      borderBottom: `9px solid ${palette.ribbonBgHex}`,
                      borderRight: '6px solid transparent',
                      filter: 'brightness(0.75)',
                    }}
                  />
                </div>
              )}

              {/* In Editable Mode: Allow Merchant to Set Most Popular (Before 7 sales) & Remove Tier */}
              {editable && (
                <div
                  className="absolute -top-3 left-4 z-10 flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isThisTierMostPopular &&
                    !popularResolution.isAutomatic &&
                    features.tierBadge !== false &&
                    features.mostPopularHighlight !== false && (
                      <button
                        type="button"
                        onClick={() => handleSelectMerchantMostPopular(tier.id)}
                        data-testid={`set-most-popular-btn-${tier.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white border border-slate-200 hover:border-slate-400 text-[10.5px] font-bold text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Star size={10} className="text-amber-500" />
                        <span>Set Most Popular</span>
                      </button>
                    )}

                  {offersConfig.tiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(tier.id)}
                      aria-label={`Remove ${tier.title || `Tier ${tierIdx + 1}`}`}
                      data-testid={`remove-tier-btn-${tier.id}`}
                      className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-white border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 shadow-2xs transition-colors cursor-pointer"
                      title="Remove this tier"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              )}

              {/* Upper Card Content */}
              <div className={`${compact ? 'p-2.5 sm:p-3' : 'p-3 sm:px-4 sm:py-3.5'}`}>
                {(() => {
                  const tierCustomUnits = tierSelectionsByTier[tier.id] || [];
                  const tierUnitCards = Array.from({
                    length: Math.max(1, pricing.totalUnits),
                  }).map((_, uIdx) => {
                    // Selected tier uses its normalized selections; unselected tier only uses its own explicit selections,
                    // or empty {} so resolveUnitVariantInfo falls back to default tierThumb without copying other tiers' variants.
                    const selMap = isSelected
                      ? (normalizedUnits[uIdx] || {})
                      : (tierCustomUnits[uIdx] || {});
                    const resolved = resolveUnitVariantInfo({
                      unitIndex: uIdx,
                      unitSelections: selMap,
                      step3Variants,
                      step3Colors,
                      defaultImageUrl: tierThumb,
                      productImages,
                    });
                    const chosenLabels = Object.values(selMap)
                      .filter(Boolean)
                      .join(' • ');
                    return {
                      ...resolved,
                      variantLabel: chosenLabels || `Item #${uIdx + 1}`,
                    };
                  });

                  const activeFrontCardIdx = activeFrontCardByTier[tier.id] || 0;

                  return (
                    <>
                      <div className="flex items-center justify-between gap-2.5 sm:gap-3">
                        {/* Left: Offer Tier Sequential Playing Cards Stack + Bold Title + "You save ..." Subtitle */}
                        <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
                          {features.addImage !== false && (
                            <PlayingCardProductStack
                              units={tierUnitCards}
                              totalUnits={pricing.totalUnits}
                              tierTitle={tier.title}
                              editable={editable}
                              tierId={tier.id}
                              isExpanded={false}
                              frontCardIndex={activeFrontCardIdx}
                              onToggleExpandItems={() =>
                                handleToggleTierItemsShowcase(tier.id, isSelected)
                              }
                              onOpenImagePicker={() =>
                                setActiveImagePickerTarget({ type: 'tier', tierId: tier.id })
                              }
                            />
                          )}

                    <div className="min-w-0 flex-1 pl-1.5 sm:pl-3">
                      {editable ? (
                        <div className="space-y-1">
                          {/* Directly Editable Title */}
                          <input
                            type="text"
                            aria-label={`Tier ${tierIdx + 1} title`}
                            data-testid={`inline-tier-title-${tier.id}`}
                            value={tier.title}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleUpdateTier(tier.id, { title: e.target.value })
                            }
                            placeholder="Single, Duo, Trio..."
                            className="w-full max-w-[200px] bg-transparent hover:bg-white/80 focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-500 rounded-none px-1 py-0 text-[16px] sm:text-[18px] font-black text-slate-900 leading-tight focus:outline-none transition-colors"
                          />

                          {/* Subtitle with percentage discount */}
                          <div
                            className="text-[12px] sm:text-[13px] font-medium px-1"
                            style={{ color: palette.pillTextHex }}
                            data-testid={`tier-offer-label-${tier.id}`}
                          >
                            {pricing.savingsAmount > 0 && pricing.savingsPercent > 0
                              ? `Save ${pricing.savingsPercent % 1 === 0 ? pricing.savingsPercent : Math.round(pricing.savingsPercent)}%`
                              : 'Base Price'}
                          </div>

                          {/* Compact Inline Quantity Controls for Merchant */}
                          <div
                            className="flex flex-wrap items-center gap-1.5 pt-0.5 px-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {offersConfig.offerType === 'bogo' ? (
                              <div className="inline-flex items-center gap-1 bg-white/90 border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                <span>Buy</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  aria-label={`Tier ${tierIdx + 1} buy quantity`}
                                  data-testid={`inline-tier-buyqty-${tier.id}`}
                                  value={
                                    qtyDrafts[`${tier.id}-buy`] !== undefined
                                      ? qtyDrafts[`${tier.id}-buy`]
                                      : String(tier.buyQty)
                                  }
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, '');
                                    setQtyDrafts((prev) => ({
                                      ...prev,
                                      [`${tier.id}-buy`]: raw,
                                    }));
                                    const buy = parseInt(raw, 10);
                                    if (Number.isFinite(buy) && buy >= 1) {
                                      const free = Math.max(0, Number(tier.freeQty) || 0);
                                      handleUpdateTier(tier.id, {
                                        buyQty: buy,
                                        freeQty: free,
                                        totalUnits: buy + free,
                                        customFinalPrice: undefined,
                                        customCompareAtPrice: undefined,
                                      });
                                    }
                                  }}
                                  onBlur={() => {
                                    setQtyDrafts((prev) => {
                                      const next = { ...prev };
                                      delete next[`${tier.id}-buy`];
                                      return next;
                                    });
                                  }}
                                  className="w-8 text-center bg-slate-50 border border-slate-200 rounded px-1 py-0 text-[11px] font-bold text-slate-900 focus:outline-none"
                                />
                                <span>+ Free</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  aria-label={`Tier ${tierIdx + 1} free quantity`}
                                  data-testid={`inline-tier-freeqty-${tier.id}`}
                                  value={
                                    qtyDrafts[`${tier.id}-free`] !== undefined
                                      ? qtyDrafts[`${tier.id}-free`]
                                      : String(tier.freeQty)
                                  }
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, '');
                                    setQtyDrafts((prev) => ({
                                      ...prev,
                                      [`${tier.id}-free`]: raw,
                                    }));
                                    const free = parseInt(raw, 10);
                                    if (Number.isFinite(free) && free >= 0) {
                                      const buy = Math.max(1, Number(tier.buyQty) || 1);
                                      handleUpdateTier(tier.id, {
                                        buyQty: buy,
                                        freeQty: free,
                                        totalUnits: buy + free,
                                        customFinalPrice: undefined,
                                        customCompareAtPrice: undefined,
                                      });
                                    }
                                  }}
                                  onBlur={() => {
                                    setQtyDrafts((prev) => {
                                      const next = { ...prev };
                                      delete next[`${tier.id}-free`];
                                      return next;
                                    });
                                  }}
                                  className="w-8 text-center bg-slate-50 border border-slate-200 rounded px-1 py-0 text-[11px] font-bold text-slate-900 focus:outline-none"
                                />
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 bg-white/90 border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                <span>Items:</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  aria-label={`Tier ${tierIdx + 1} quantity`}
                                  data-testid={`inline-tier-qty-${tier.id}`}
                                  value={
                                    qtyDrafts[`${tier.id}-qty`] !== undefined
                                      ? qtyDrafts[`${tier.id}-qty`]
                                      : String(tier.totalUnits)
                                  }
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, '');
                                    setQtyDrafts((prev) => ({
                                      ...prev,
                                      [`${tier.id}-qty`]: raw,
                                    }));
                                    const units = parseInt(raw, 10);
                                    if (Number.isFinite(units) && units >= 1) {
                                      handleUpdateTier(tier.id, {
                                        totalUnits: units,
                                        buyQty: units,
                                        customFinalPrice: undefined,
                                        customCompareAtPrice: undefined,
                                      });
                                    }
                                  }}
                                  onBlur={() => {
                                    setQtyDrafts((prev) => {
                                      const next = { ...prev };
                                      delete next[`${tier.id}-qty`];
                                      return next;
                                    });
                                  }}
                                  className="w-9 text-center bg-slate-50 border border-slate-200 rounded px-1 py-0 text-[11px] font-bold text-slate-900 focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-start">
                          <span
                            className={`${
                              compact ? 'text-[15px]' : 'text-[16px] sm:text-[18px]'
                            } font-black text-slate-900 leading-tight`}
                          >
                            {tier.title}
                          </span>
                          {features.offerLabel !== false && (
                            <span
                              className="text-[12px] sm:text-[12.5px] font-medium mt-0.5"
                              style={{ color: palette.pillTextHex }}
                            >
                              {pricing.savingsAmount > 0 && pricing.savingsPercent > 0
                                ? `Save ${pricing.savingsPercent % 1 === 0 ? pricing.savingsPercent : Math.round(pricing.savingsPercent)}%`
                                : 'Base Price'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Offer Price + Struck-Through Compare-At Price */}
                  <div
                    className="text-right shrink-0"
                    onClick={(e) => {
                      if (editable) e.stopPropagation();
                    }}
                  >
                    {editable ? (
                      <div className="flex flex-col items-end gap-1">
                        <div
                          className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:border-slate-500 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10 rounded-lg px-2 py-1 shadow-2xs transition-all"
                          title="Type the offer price for this tier"
                        >
                          <input
                            type="text"
                            inputMode="decimal"
                            aria-label={`Tier ${tierIdx + 1} offer price in ${currencySymbol}`}
                            data-testid={`inline-tier-price-${tier.id}`}
                            value={displayedOfferPrice}
                            placeholder="0"
                            onFocus={(e) => {
                              setPriceDrafts((prev) => ({
                                ...prev,
                                [tier.id]: String(pricing.finalPrice),
                              }));
                              e.target.select();
                            }}
                            onChange={(e) =>
                              handlePriceInputChange(
                                tier,
                                pricing.compareAtTotal,
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              handlePriceInputBlur(
                                tier,
                                pricing.compareAtTotal,
                                pricing.finalPrice
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-20 sm:w-24 text-right font-black text-[17px] sm:text-[20px] text-slate-900 bg-transparent focus:outline-none leading-none"
                          />
                          <span className="text-[11px] font-extrabold text-slate-500">
                            {currencySymbol}
                          </span>
                        </div>

                        {features.compareAtPrice !== false && (
                          <div
                            className="inline-flex items-center gap-1 px-1"
                            title="Original compare-at price (click to edit)"
                          >
                            <input
                              type="text"
                              inputMode="decimal"
                              aria-label={`Tier ${tierIdx + 1} compare-at price in ${currencySymbol}`}
                              data-testid={`inline-tier-compare-price-${tier.id}`}
                              value={displayedComparePrice}
                              onFocus={(e) => {
                                setComparePriceDrafts((prev) => ({
                                  ...prev,
                                  [tier.id]: String(pricing.compareAtTotal),
                                }));
                                e.target.select();
                              }}
                              onChange={(e) =>
                                handleComparePriceInputChange(
                                  tier,
                                  pricing.finalPrice,
                                  e.target.value
                                )
                              }
                              onBlur={() =>
                                handleComparePriceInputBlur(tier, pricing.finalPrice)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              className={`w-16 sm:w-20 text-right text-[12.5px] sm:text-[13.5px] font-semibold text-slate-400 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-400 focus:outline-none ${
                                pricing.compareAtTotal > pricing.finalPrice
                                  ? 'line-through'
                                  : ''
                              }`}
                            />
                            <span
                              className={`text-[11.5px] font-semibold text-slate-400 ${
                                pricing.compareAtTotal > pricing.finalPrice
                                  ? 'line-through'
                                  : ''
                              }`}
                            >
                              {currencySymbol}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div
                          className={`${
                            compact ? 'text-[17px]' : 'text-[18px] sm:text-[21px]'
                          } font-black text-slate-900 leading-none`}
                        >
                          {formatOfferMoney(
                            pricing.finalPrice,
                            currencySymbol,
                            currencyPosition
                          )}
                        </div>
                        {features.compareAtPrice !== false &&
                          pricing.compareAtTotal > pricing.finalPrice && (
                            <div className="text-[12px] sm:text-[13px] font-semibold text-slate-400 line-through mt-0.5 sm:mt-1">
                              {formatOfferMoney(
                                pricing.compareAtTotal,
                                currencySymbol,
                                currencyPosition
                              )}
                            </div>
                          )}
                        {features.unitPriceSubtitle && pricing.totalUnits > 1 && (
                          <div className="text-[10.5px] font-medium text-slate-500 mt-0.5">
                            {formatOfferMoney(
                              pricing.effectiveUnitPrice,
                              currencySymbol,
                              currencyPosition
                            )}{' '}
                            / each
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </>
            );
          })()}

                {/* Expanded Per-Unit Variant Selectors */}
                {isSelected && features.variants !== false && orderedAxes.length > 0 && (
                  <div
                    className="mt-3 pt-0.5"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`offer-tier-variants-${tier.id}`}
                  >
                    <div className="text-[11.5px] sm:text-[12px] font-medium text-slate-500 mb-1.5 sm:mb-2">
                      Choose {orderedAxes.map((axis) => axis.name).join(', ')}
                    </div>

                    <div className="space-y-2">
                      {normalizedUnits.map((unitMap, unitIdx) => (
                        <div
                          key={`${tier.id}-unit-${unitIdx}`}
                          className="flex flex-wrap items-center gap-2.5 sm:gap-3"
                        >
                          <span className="text-[12px] sm:text-[12.5px] font-extrabold text-slate-800 w-5 shrink-0">
                            #{unitIdx + 1}
                          </span>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-1">
                            {orderedAxes.map((axis) => {
                              const selectedVal =
                                unitMap[axis.name] || axis.options[0] || '';
                              const isColorAxis = /colou?r|couleur|لون/i.test(
                                axis.name
                              );

                              if (isColorAxis) {
                                return (
                                  <div
                                    key={`${tier.id}-unit-${unitIdx}-${axis.name}`}
                                    className="flex items-center gap-1.5 sm:gap-2"
                                    role="radiogroup"
                                    aria-label={`Item ${unitIdx + 1} ${axis.name}`}
                                  >
                                    {axis.options.map((colorOpt) => {
                                      const isSelectedColor =
                                        selectedVal === colorOpt;
                                      const swatchHex = resolveVariantColorHex(
                                        colorOpt,
                                        step3Colors
                                      );
                                      const isOptOutOfStock =
                                        isVariantOptionValueOutOfStock({
                                          axisName: axis.name,
                                          optionValue: colorOpt,
                                          step3Variants,
                                        });

                                      return (
                                        <button
                                          key={colorOpt}
                                          type="button"
                                          title={`${colorOpt}${
                                            isOptOutOfStock
                                              ? ' (Out of stock / Unavailable)'
                                              : ''
                                          }`}
                                          aria-label={`Item ${unitIdx + 1} color ${colorOpt}${
                                            isOptOutOfStock ? ' out of stock' : ''
                                          }`}
                                          aria-pressed={isSelectedColor}
                                          onClick={() =>
                                            handleUnitSelectionChange(
                                              unitIdx,
                                              axis.name,
                                              colorOpt
                                            )
                                          }
                                          data-testid={`variant-color-swatch-${tier.id}-${unitIdx}-${colorOpt}`}
                                          className={`relative w-5 h-5 sm:w-[22px] sm:h-[22px] rounded-full transition-transform cursor-pointer shrink-0 focus:outline-none ${
                                            isOptOutOfStock ? 'opacity-70' : ''
                                          }`}
                                          style={{
                                            backgroundColor: swatchHex,
                                            border: isSelectedColor
                                              ? `2px solid ${palette.borderHex}`
                                              : '1.5px solid rgba(15, 23, 42, 0.14)',
                                          }}
                                        >
                                          {/* Diagonal cross-mark slash across unavailable swatch */}
                                          {isOptOutOfStock && (
                                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-full">
                                              <svg
                                                className="w-full h-full"
                                                viewBox="0 0 100 100"
                                              >
                                                <line
                                                  x1="18"
                                                  y1="82"
                                                  x2="82"
                                                  y2="18"
                                                  stroke="#ffffff"
                                                  strokeWidth="15"
                                                  strokeLinecap="round"
                                                  opacity="0.9"
                                                />
                                                <line
                                                  x1="18"
                                                  y1="82"
                                                  x2="82"
                                                  y2="18"
                                                  stroke="#ef4444"
                                                  strokeWidth="10"
                                                  strokeLinecap="round"
                                                />
                                              </svg>
                                            </span>
                                          )}

                                          {isSelectedColor && (
                                            <span
                                              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shadow-2xs z-10"
                                              style={{
                                                border: `1.5px solid ${palette.borderHex}`,
                                                color: palette.primaryHex,
                                              }}
                                            >
                                              <Check size={8} strokeWidth={3.5} />
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={`${tier.id}-unit-${unitIdx}-${axis.name}`}
                                  className="relative min-w-[70px] sm:min-w-[78px]"
                                >
                                  <select
                                    aria-label={`Item ${unitIdx + 1} ${axis.name}`}
                                    value={selectedVal}
                                    onChange={(e) =>
                                      handleUnitSelectionChange(
                                        unitIdx,
                                        axis.name,
                                        e.target.value
                                      )
                                    }
                                    className="w-full appearance-none rounded-[7px] bg-white pl-2.5 pr-6 py-0.5 text-[12px] sm:text-[12.5px] font-bold text-slate-900 border border-slate-300 hover:border-slate-500 focus:outline-none cursor-pointer"
                                  >
                                    {axis.options.map((opt) => {
                                      const isOptOutOfStock =
                                        isVariantOptionValueOutOfStock({
                                          axisName: axis.name,
                                          optionValue: opt,
                                          step3Variants,
                                        });

                                      return (
                                        <option key={opt} value={opt}>
                                          {opt}
                                          {isOptOutOfStock
                                            ? ' — Out of stock (✕)'
                                            : ''}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-800">
                                    <svg
                                      width="8"
                                      height="5"
                                      viewBox="0 0 11 7"
                                      fill="currentColor"
                                    >
                                      <path d="M1 1L5.5 6L10 1H1Z" />
                                    </svg>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* In Editable Preview Mode: Simple "+ Add Gift" Action Inside Card When No Gift Exists */}
                {editable && features.freeGift !== false && !hasFreeGifts && !isGiftPickerOpen && (
                  <div
                    className="mt-3.5 pt-2.5 border-t border-dashed border-slate-200 flex items-center justify-between"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setOpenGiftPickerTierId(tier.id);
                        setGiftPickerTab(storeProducts.length > 0 ? 'store' : 'upload');
                      }}
                      data-testid={`inline-add-gift-btn-${tier.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
                      style={{ color: palette.primaryHex }}
                    >
                      <Plus size={14} />
                      <span>+ Add Gift</span>
                    </button>
                    <span className="text-[11px] text-slate-400">Optional free gift</span>
                  </div>
                )}

                {/* Inline Gift Creator inside Preview Card */}
                {editable && features.freeGift !== false && isGiftPickerOpen && (
                  <div
                    className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`inline-gift-picker-${tier.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setGiftPickerTab('store')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                            giftPickerTab === 'store'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Store Products
                        </button>
                        <button
                          type="button"
                          onClick={() => setGiftPickerTab('upload')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                            giftPickerTab === 'upload'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Upload New Image
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenGiftPickerTierId(null)}
                        aria-label="Close gift picker"
                        className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {giftPickerTab === 'store' ? (
                      storeProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                          {storeProducts.map((sp) => (
                            <button
                              key={sp.id}
                              type="button"
                              onClick={() => handleAddStoreProductGift(tier.id, sp)}
                              data-testid={`select-store-gift-${sp.id}`}
                              className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-500 text-left transition-all cursor-pointer"
                            >
                              <img
                                src={sp.imageUrl || DEFAULT_CAP_THUMBNAIL}
                                alt={sp.name}
                                className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-slate-800 truncate">
                                  {sp.name}
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium">
                                  {formatOfferMoney(
                                    sp.price,
                                    currencySymbol,
                                    currencyPosition
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 py-2 text-center">
                          No store products found. Switch to &ldquo;Upload New Image&rdquo; to add a custom gift.
                        </div>
                      )
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <label className="relative w-12 h-12 rounded-xl bg-white border border-dashed border-slate-300 hover:border-slate-600 flex flex-col items-center justify-center overflow-hidden shrink-0 cursor-pointer">
                            <img
                              src={customGiftImage}
                              alt="Gift preview"
                              className="w-full h-full object-contain p-1"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              aria-label="Upload new gift image"
                              className="sr-only"
                              onChange={handleNewGiftFileSelect}
                            />
                          </label>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              aria-label="Custom gift name"
                              placeholder="Gift title (e.g. Baseball Cap)"
                              value={customGiftName}
                              onChange={(e) => setCustomGiftName(e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-600"
                            />
                            <input
                              type="text"
                              inputMode="decimal"
                              aria-label="Custom gift original value in DZD"
                              placeholder={`Value (${currencySymbol})`}
                              value={customGiftPrice}
                              onChange={(e) =>
                                setCustomGiftPrice(e.target.value.replace(/[^0-9.]/g, ''))
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-600"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleAddUploadedCustomGift(tier.id)}
                            data-testid={`confirm-add-custom-gift-${tier.id}`}
                            className="px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-colors cursor-pointer"
                            style={{ backgroundColor: palette.primaryHex }}
                          >
                            Add Gift to Tier
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Expanded Free Gifts Section when Selected (Exact same image layout and feature as the offer part) */}
              {isSelected && hasFreeGifts && (
                <div
                  className="relative rounded-b-[15px] sm:rounded-b-[16px] pt-3 pb-3 px-3 sm:px-4"
                  style={{
                    backgroundColor: palette.unselectedBgHex,
                    borderTop: `1.5px solid ${palette.unselectedBorderHex}`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Centered circular "+" badge sitting on the divider line */}
                  <div
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full text-white flex items-center justify-center font-bold text-[13px] leading-none shadow-2xs"
                    style={{ backgroundColor: palette.pillBorderHex }}
                  >
                    +
                  </div>

                  <div className="space-y-2.5">
                    {tier.freeGifts.map((gift) => {
                      const giftThumb = getGiftThumb(gift);
                      const giftQty = Math.max(1, Number(gift.quantity) || 1);
                      const giftVal =
                        (Number(gift.originalPrice) || 0) * giftQty;
                      const giftOptions =
                        gift.variantOptions && gift.variantOptions.length > 0
                          ? gift.variantOptions
                          : ['Black', 'White', 'Forest Green', 'Beige'];
                      const selectedGiftVariant =
                        giftVariantMap[gift.id] ||
                        gift.selectedVariant ||
                        giftOptions[0];

                      const isGiftVariantOutOfStock = isVariantOptionValueOutOfStock({
                        axisName: 'Color',
                        optionValue: selectedGiftVariant,
                        step3Variants,
                      });

                      return (
                        <div
                          key={gift.id}
                          className="flex items-center justify-between gap-2.5 sm:gap-3"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                            {/* Gift Image: Exact same card layout as the Offer Image with cross-mark if unavailable */}
                            <div
                              className="relative w-[52px] h-[52px] sm:w-[62px] sm:h-[62px] rounded-xl sm:rounded-2xl bg-white shadow-xs border border-slate-100/90 flex items-center justify-center overflow-hidden shrink-0 group transition-all"
                              onClick={() => {
                                if (editable) {
                                  setActiveImagePickerTarget({
                                    type: 'gift',
                                    tierId: tier.id,
                                    giftId: gift.id,
                                  });
                                }
                              }}
                            >
                              <img
                                src={giftThumb}
                                alt={gift.name}
                                className="w-full h-full object-contain p-1 sm:p-1.5 transition-transform duration-300 group-hover:scale-105"
                              />
                              {isGiftVariantOutOfStock && (
                                <CrossMarkSlashOverlay label="Out of stock" />
                              )}
                              {editable && (
                                <div
                                  className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer backdrop-blur-[1px] z-30"
                                  title="Click to change gift image"
                                  data-testid={`change-gift-image-btn-${gift.id}`}
                                >
                                  <Camera size={15} />
                                  <span className="mt-0.5">Change</span>
                                </div>
                              )}
                            </div>

                            {/* Middle: "1x" pill + Bold Gift Title + Variant Policy / Selector */}
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="px-1.5 py-0.5 rounded text-[11px] font-extrabold leading-none shrink-0"
                                  style={{
                                    backgroundColor: `${palette.pillBorderHex}40`,
                                    color: palette.primaryHex,
                                  }}
                                >
                                  {giftQty}x
                                </span>
                                {editable ? (
                                  <input
                                    type="text"
                                    value={gift.name}
                                    aria-label="Edit gift name"
                                    onChange={(e) =>
                                      handleUpdateGiftItem(tier.id, gift.id, {
                                        name: e.target.value,
                                      })
                                    }
                                    className="w-full max-w-[170px] bg-transparent hover:bg-white/80 focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-500 text-[15px] sm:text-[16px] font-extrabold text-slate-900 leading-tight focus:outline-none px-1"
                                  />
                                ) : (
                                  <span className="text-[15px] sm:text-[16px] font-extrabold text-slate-900 truncate">
                                    {gift.name}
                                  </span>
                                )}
                              </div>

                              {/* Administrator Flexibility Control: Shopper Selects vs. Fixed Variant */}
                              {editable && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Variant Policy:
                                  </span>
                                  <div className="inline-flex items-center bg-white/90 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateGiftItem(tier.id, gift.id, {
                                          allowCustomerVariantSelection: true,
                                        })
                                      }
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                        gift.allowCustomerVariantSelection !== false
                                          ? 'bg-blue-50 text-[#004e89] border border-blue-200 shadow-2xs'
                                          : 'text-slate-500 hover:text-slate-800 border border-transparent'
                                      }`}
                                      title="Shoppers can freely choose between available variants"
                                    >
                                      <Users size={10} />
                                      <span>Shopper Selects</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateGiftItem(tier.id, gift.id, {
                                          allowCustomerVariantSelection: false,
                                          fixedVariantChoice:
                                            gift.fixedVariantChoice || selectedGiftVariant,
                                        })
                                      }
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                        gift.allowCustomerVariantSelection === false
                                          ? 'bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs'
                                          : 'text-slate-500 hover:text-slate-800 border border-transparent'
                                      }`}
                                      title="Administrator locks this gift to a fixed variant"
                                    >
                                      <Lock size={10} />
                                      <span>Fixed Variant</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Variant Dropdown or Fixed Variant Lock Indicator */}
                              {editable || gift.allowCustomerVariantSelection !== false ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-slate-600">
                                    {gift.allowCustomerVariantSelection === false
                                      ? 'Fixed:'
                                      : '#1'}
                                  </span>
                                  <div className="relative min-w-[105px] sm:min-w-[120px]">
                                    <select
                                      aria-label={`Variant for free gift ${gift.name}`}
                                      value={
                                        gift.allowCustomerVariantSelection === false
                                          ? gift.fixedVariantChoice || selectedGiftVariant
                                          : selectedGiftVariant
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setGiftVariantMap((prev) => ({
                                          ...prev,
                                          [gift.id]: val,
                                        }));
                                        if (editable) {
                                          if (gift.allowCustomerVariantSelection === false) {
                                            handleUpdateGiftItem(tier.id, gift.id, {
                                              fixedVariantChoice: val,
                                              selectedVariant: val,
                                            });
                                          } else {
                                            handleUpdateGiftItem(tier.id, gift.id, {
                                              selectedVariant: val,
                                            });
                                          }
                                        }
                                      }}
                                      className="w-full appearance-none rounded-[7px] bg-white pl-2.5 pr-7 py-1 text-[12.5px] font-medium text-slate-800 border border-slate-300 focus:outline-none cursor-pointer"
                                    >
                                      {giftOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-700">
                                      <svg
                                        width="9"
                                        height="6"
                                        viewBox="0 0 11 7"
                                        fill="currentColor"
                                      >
                                        <path d="M1 1L5.5 6L10 1H1Z" />
                                      </svg>
                                    </span>
                                  </div>
                                  {gift.allowCustomerVariantSelection === false && (
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <Lock size={10} />
                                      <span>Fixed</span>
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs w-fit">
                                  <Lock size={11} className="text-amber-600 shrink-0" />
                                  <span className="text-[11px] text-slate-500">Fixed Variant:</span>
                                  <span className="font-bold text-slate-900">
                                    {gift.fixedVariantChoice || selectedGiftVariant}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Dark "FREE" Pill Badge + Struck-Through Gift Value */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex flex-col items-end">
                              <span
                                className="px-3 py-1 rounded-full text-white text-[11.5px] sm:text-[12px] font-extrabold uppercase tracking-wide leading-none"
                                style={{ backgroundColor: palette.ribbonBgHex }}
                              >
                                FREE
                              </span>
                              {giftVal > 0 && (
                                <span className="text-[12.5px] font-semibold text-slate-400 line-through mt-1">
                                  {formatOfferMoney(
                                    giftVal,
                                    currencySymbol,
                                    currencyPosition
                                  )}
                                </span>
                              )}
                            </div>
                            {editable && (
                              <button
                                type="button"
                                onClick={() => handleRemoveGift(tier.id, gift.id)}
                                aria-label={`Remove gift ${gift.name}`}
                                data-testid={`remove-gift-btn-${gift.id}`}
                                className="w-6 h-6 rounded-full bg-white border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 flex items-center justify-center text-xs transition-colors cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {editable && !isGiftPickerOpen && (
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenGiftPickerTierId(tier.id);
                            setGiftPickerTab(storeProducts.length > 0 ? 'store' : 'upload');
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold hover:underline cursor-pointer"
                          style={{ color: palette.primaryHex }}
                        >
                          <Plus size={12} />
                          <span>+ Add Gift</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Collapsed Free Gift Bottom Strip when Unselected */}
              {!isSelected && hasFreeGifts && (
                <div
                  className="rounded-b-[16px] px-3.5 py-2.5 flex items-center justify-between gap-2 text-white"
                  style={{ backgroundColor: palette.giftStripBgHex }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Collapsed Gift Image: Same layout and feature */}
                    <div
                      className="relative w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center overflow-hidden shrink-0 group cursor-pointer"
                      onClick={(e) => {
                        if (editable && tier.freeGifts[0]) {
                          e.stopPropagation();
                          setActiveImagePickerTarget({
                            type: 'gift',
                            tierId: tier.id,
                            giftId: tier.freeGifts[0].id,
                          });
                        }
                      }}
                      title={editable ? 'Click to change gift image' : undefined}
                    >
                      <img
                        src={getGiftThumb(tier.freeGifts[0])}
                        alt="Free Gift"
                        className="w-full h-full object-contain p-1 transition-transform duration-200 group-hover:scale-105"
                      />
                      {editable && (
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[8px] font-bold cursor-pointer">
                          <Camera size={12} />
                        </div>
                      )}
                    </div>
                    <span className="text-[13px] sm:text-[13.5px] font-bold uppercase tracking-wide truncate">
                      +{pricing.totalGiftCount} FREE{' '}
                      {pricing.totalGiftCount === 1 ? 'GIFT' : 'GIFTS'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {pricing.totalGiftOriginalValue > 0 && (
                      <span className="text-[13.5px] sm:text-[14px] font-semibold text-white/95 line-through">
                        {formatOfferMoney(
                          pricing.totalGiftOriginalValue,
                          currencySymbol,
                          currencyPosition
                        )}
                      </span>
                    )}
                    {editable && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateTier(tier.id, { freeGifts: [] });
                        }}
                        aria-label={`Clear gifts on ${tier.title}`}
                        className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Clear "+ Add Offer Tier" Button Directly Inside the Preview */}
      {editable && onAddTier && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onAddTier}
            data-testid="preview-add-offer-tier-btn"
            className="w-full py-3 rounded-[16px] border-2 border-dashed border-slate-300 hover:border-slate-600 bg-slate-50/60 hover:bg-slate-100/60 text-xs sm:text-sm font-extrabold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>+ Add Offer Tier</span>
          </button>
        </div>
      )}

      {/* Interactive Unified Image Selector Modal (Applied to both Offer Tier Image & Gift Image) */}
      {editable && activeImagePickerTarget !== null && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setActiveImagePickerTarget(null)}
          data-testid="offer-image-picker-modal"
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs"
                  style={{ backgroundColor: palette.primaryHex }}
                >
                  <Camera size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {activeImagePickerTarget.type === 'tier'
                      ? 'Change Offer Tier Image'
                      : 'Change Gift Image'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Upload a new image or choose from product and store items
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveImagePickerTarget(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Current Image Preview & Tabs */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={currentTargetImageUrl}
                    alt="Current preview"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800">
                    Current Image
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {activeImagePickerTarget.type === 'tier'
                      ? 'Displayed on the selected offer tier card'
                      : 'Displayed on the gift item banner'}
                  </div>
                  <button
                    type="button"
                    onClick={handleResetImageTarget}
                    className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Reset to Default</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setImagePickerTab('upload')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    imagePickerTab === 'upload'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload File
                </button>
                {productImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setImagePickerTab('product')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      imagePickerTab === 'product'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Product Photos ({productImages.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setImagePickerTab('store')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    imagePickerTab === 'store'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Store &amp; Presets
                </button>
              </div>

              {/* Tab 1: Upload File */}
              {imagePickerTab === 'upload' && (
                <div className="border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-2xl p-6 text-center transition-colors">
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mb-2 shadow-2xs">
                      <Upload size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Click to choose an image file
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      PNG, JPG, SVG, WebP up to 10MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleUploadImageFile}
                    />
                  </label>
                </div>
              )}

              {/* Tab 2: Product Gallery Photos */}
              {imagePickerTab === 'product' && (
                <div className="grid grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {productImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyImageToTarget(imgUrl)}
                      className="aspect-square rounded-xl bg-white border border-slate-200 hover:border-slate-800 overflow-hidden p-1 shadow-2xs hover:scale-105 transition-all cursor-pointer group"
                    >
                      <img
                        src={imgUrl}
                        alt={`Product image ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Tab 3: Store Products & Presets */}
              {imagePickerTab === 'store' && (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {storeProducts.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Store Catalog
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {storeProducts.map((sp) => (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() => handleApplyImageToTarget(sp.imageUrl || defaultProductThumb)}
                            className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:border-slate-800 bg-white text-left transition-all cursor-pointer"
                          >
                            <img
                              src={sp.imageUrl || defaultProductThumb}
                              alt={sp.name}
                              className="w-8 h-8 rounded-lg object-contain bg-slate-50 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-800 truncate">
                                {sp.name}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Presets
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: 'Hoodie', url: DEFAULT_HOODIE_THUMBNAIL },
                        { name: 'Baseball Cap', url: DEFAULT_CAP_THUMBNAIL },
                        { name: 'Sunglasses', url: DEFAULT_SUNGLASSES_THUMBNAIL },
                        { name: 'Scrunchie', url: DEFAULT_SCRUNCHIE_THUMBNAIL },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleApplyImageToTarget(preset.url)}
                          className="flex flex-col items-center gap-1 p-2 rounded-xl border border-slate-200 hover:border-slate-800 bg-white transition-all cursor-pointer"
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-10 h-10 object-contain"
                          />
                          <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveImagePickerTarget(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export interface YumeStep4OfferBuilderProps {
  offersConfig: ProductOffersConfig;
  onChange: (nextConfig: ProductOffersConfig) => void;
  baseUnitPrice: number;
  currencySymbol?: string;
  currencyPosition?: 'prefix' | 'suffix' | string;
  productImageUrl?: string;
  productImages?: string[];
  step3Sizes?: string[];
  step3Colors?: Array<{ name?: string; hex?: string; imageUrl?: string; images?: string[]; isOutOfStock?: boolean; stock?: number | string } | string>;
  step3VariantAttrs?: Array<{ name?: string; values?: string[]; options?: string[]; tags?: string[] }>;
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
  step3Specs?: Array<{ key?: string; value?: string }>;
  storeProducts?: StoreGiftCandidate[];
}

/**
 * Merchant Step 4: Prices & Shipping -> Offers Toggle + Offer Architecture & Promotion Studio Popup.
 * All offer creation and editing happens directly inside the Preview area;
 * all old configuration fields below the Preview have been removed.
 */
export const YumeStep4OfferBuilder: React.FC<YumeStep4OfferBuilderProps> = ({
  offersConfig,
  onChange,
  baseUnitPrice,
  currencySymbol = 'DZD',
  currencyPosition = 'suffix',
  productImageUrl,
  productImages = [],
  step3Sizes,
  step3Colors,
  step3VariantAttrs,
  step3Variants,
  step3Specs,
  storeProducts = [],
}) => {
  const [previewSelectedTierId, setPreviewSelectedTierId] = useState<string>(
    offersConfig.defaultSelectedTierId || offersConfig.tiers[1]?.id || offersConfig.tiers[0]?.id || 'tier-2'
  );
  const [previewUnitSelections, setPreviewUnitSelections] = useState<
    Record<string, string>[]
  >([]);
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);
  const [showHints, setShowHints] = useState(false);

  const safeBasePrice = Number(baseUnitPrice) > 0 ? Number(baseUnitPrice) : 3500;

  const step3Axes = extractStep3VariantAxes({
    sizes: step3Sizes,
    colors: step3Colors,
    variantAttrs: step3VariantAttrs,
    variants: step3Variants,
    specs: step3Specs,
    onlyDisponible: true,
    useFallbackForPreview: true,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Close modal on Escape key and prevent background scrolling
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isModalOpen]);

  const handleToggleEnabled = (enabled: boolean) => {
    onChange({
      ...offersConfig,
      enabled,
    });
    if (enabled) {
      setIsModalOpen(true);
    }
  };

  const handleSelectOfferType = (newType: OfferType) => {
    const updated = applyOfferTypePreset(offersConfig, newType, safeBasePrice);
    onChange(updated);
  };

  const safeFeatures = {
    ...DEFAULT_OFFERS_CONFIG.features,
    ...(offersConfig?.features || {}),
  };

  const handleToggleFeature = (key: keyof ProductOffersConfig['features']) => {
    onChange({
      ...offersConfig,
      features: {
        ...safeFeatures,
        [key]: !safeFeatures[key],
      },
    });
  };

  const handleAddTier = () => {
    const idx = offersConfig.tiers.length;
    const nextNum = idx + 1;
    const buyQty = offersConfig.offerType === 'bogo' ? nextNum + 1 : nextNum;
    const freeQty = offersConfig.offerType === 'bogo' ? nextNum : 0;
    const totalUnits = offersConfig.offerType === 'bogo' ? buyQty + freeQty : nextNum;
    const pctOff =
      offersConfig.offerType === 'bogo'
        ? Math.round((freeQty / totalUnits) * 100)
        : Math.min(50, nextNum * 10);

    const newTier: OfferTier = {
      id: `tier-${Date.now()}`,
      title: `${nextNum} Pack`,
      buyQty,
      freeQty,
      totalUnits,
      offerLabel: `${pctOff}% OFF`,
      tierBadge: '',
      discountValue:
        offersConfig.offerType === 'fixed_price'
          ? Math.round(safeBasePrice * totalUnits * 0.75)
          : offersConfig.offerType === 'flat_off'
          ? Math.round(safeBasePrice * totalUnits * 0.2)
          : pctOff,
      imageUrl: productImageUrl || DEFAULT_HOODIE_THUMBNAIL,
      freeGifts: [],
      salesCount: 0,
    };
    onChange({
      ...offersConfig,
      tiers: [...offersConfig.tiers, newTier],
    });
    setPreviewSelectedTierId(newTier.id);
  };

  const handlePreviewUnitChange = (
    unitIndex: number,
    axisName: string,
    value: string
  ) => {
    setPreviewUnitSelections((prev) => {
      const copy = [...prev];
      copy[unitIndex] = { ...(copy[unitIndex] || {}), [axisName]: value };
      return copy;
    });
  };

  return (
    <div
      className="pt-5 border-t border-slate-100"
      data-testid="yume-step4-offers-section"
    >
      {/* Clear "Offers" Label Switch in Step 4: Prices & Shipping */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/90 hover:bg-slate-100/70 transition-colors border border-slate-200/80 rounded-2xl px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              offersConfig.enabled
                ? 'bg-[#004e89] text-white shadow-xs'
                : 'bg-slate-200/80 text-slate-600'
            }`}
          >
            <Tag size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                Offers
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  offersConfig.enabled
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {offersConfig.enabled ? 'ON' : 'OFF'}
              </span>
              {offersConfig.enabled && (
                <span className="text-[10px] font-bold text-[#004e89] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {offersConfig.tiers.length} Tiers •{' '}
                  {offersConfig.offerType.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              {offersConfig.enabled
                ? 'Offers active — opens as a full-page studio to edit cards directly in live Preview.'
                : 'Standard pricing & shipping active. Turn ON to build BOGO, quantity tiers, and free gifts.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
          {offersConfig.enabled && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              data-testid="open-offers-modal-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#004e89] hover:bg-[#003e6b] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Sliders size={13} />
              <span>Open Offers Page</span>
              <ExternalLink size={12} className="opacity-80" />
            </button>
          )}

          <div data-testid="step4-offers-toggle-label">
            <SkeuomorphicSwitch
              checked={Boolean(offersConfig.enabled)}
              onChange={handleToggleEnabled}
            />
          </div>
        </div>
      </div>

      {/* When Offers Switch is ON AND isModalOpen is true: Render Offers as a Full-Screen Page (Not as a popup) via Portal */}
      {offersConfig.enabled && isModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999999] bg-[#f8fafc] flex flex-col w-screen h-screen min-h-screen overflow-hidden text-slate-900 font-sans select-text"
          data-testid="yume-offers-fullpage-studio"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offers-modal-title"
          style={{ isolation: 'isolate', backgroundColor: '#f8fafc' }}
        >
          {/* Full Page Navigation Header - Yume Platform Style */}
          <header className="px-4 sm:px-6 lg:px-8 py-3.5 bg-white border-b border-slate-200/80 flex items-center justify-between gap-4 shrink-0 shadow-2xs z-30 font-sans">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                data-testid="offers-fullpage-back-btn"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all border border-slate-200/90 hover:border-slate-300 shadow-2xs cursor-pointer shrink-0 select-none active:scale-95"
                title="Return to Product Wizard"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Back to Step 4</span>
                <span className="sm:hidden">Back</span>
              </button>

              <div className="w-px h-5 bg-slate-200 hidden sm:block shrink-0" />

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#004e89] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Tag size={16} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2
                      id="offers-modal-title"
                      className="text-xs sm:text-sm font-black text-slate-900 tracking-tight truncate font-sans"
                    >
                      Offers &amp; Bundles
                    </h2>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate hidden md:block">
                    Customize bundle discounts, tiers, and gifts
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span
                className="hidden"
                data-testid="popup-step4-base-price"
              >
                <span className="text-slate-400 font-sans font-normal text-[11px] mr-1.5">Original Price:</span>
                <span className="text-slate-900">{formatOfferMoney(safeBasePrice, currencySymbol, currencyPosition)}</span>
              </span>

              {/* Hints Toggle Button from the Steps */}
              <button
                type="button"
                onClick={() => setShowHints((prev) => !prev)}
                data-testid="offers-toggle-hints-btn"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs select-none active:scale-95"
                title="Toggle help hints to explain what everything does"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Hints: {showHints ? "On" : "Off"}</span>
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${
                    showHints ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                data-testid="offers-popup-done-btn"
                id="offers-popup-save-btn"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004e89] hover:bg-[#003d6b] text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer select-none active:scale-95"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Done &amp; Apply</span>
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                data-testid="offers-popup-close-btn"
                className="w-8.5 h-8.5 rounded-xl border border-slate-200/80 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          </header>

          {/* Full Page Workspace Scrollable Body */}
          <main
            className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc]"
            style={{ backgroundColor: '#f8fafc' }}
            data-testid="yume-offer-architecture-builder"
          >
            <div className="max-w-6xl mx-auto space-y-4">
              {/* Comprehensive Explanations Guide (Visible when Hints is On) */}
              {showHints && (
                <div
                  data-testid="offers-hints-panel"
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#004e89] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Info className="w-4.5 h-4.5 stroke-[2.2]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 tracking-tight font-sans">
                          Offers Studio Guide &amp; Controls Explanation
                        </h4>
                        <p className="text-xs text-slate-500 font-medium font-sans">
                          Quick reference guide for pricing models, badges, colors, and live editing
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHints(false)}
                      className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label="Hide hints"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Card 1: Offer Models */}
                    <div className="p-3.5 bg-slate-50/80 hover:bg-slate-50/95 rounded-xl border border-slate-200/80 flex flex-col justify-between transition-colors">
                      <div>
                        <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-slate-200/60">
                          <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#004e89] flex items-center justify-center shrink-0">
                            <Percent className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 font-sans">Offer Models</span>
                        </div>
                        <ul className="space-y-1.5 font-sans">
                          <li className="text-[11.5px] leading-relaxed flex items-start gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#004e89] mt-1.5 shrink-0" />
                            <span><strong className="text-slate-800">Percent Off:</strong> Tiered % savings (15%, 25%)</span>
                          </li>
                          <li className="text-[11.5px] leading-relaxed flex items-start gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#004e89] mt-1.5 shrink-0" />
                            <span><strong className="text-slate-800">Fixed Price:</strong> Direct package total price</span>
                          </li>
                          <li className="text-[11.5px] leading-relaxed flex items-start gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#004e89] mt-1.5 shrink-0" />
                            <span><strong className="text-slate-800">BOGO:</strong> Buy X, get Y units free</span>
                          </li>
                          <li className="text-[11.5px] leading-relaxed flex items-start gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#004e89] mt-1.5 shrink-0" />
                            <span><strong className="text-slate-800">Flat Off:</strong> Fixed currency deduction</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Card 2: Components & Badges */}
                    <div className="p-3.5 bg-slate-50/80 hover:bg-slate-50/95 rounded-xl border border-slate-200/80 flex flex-col justify-between transition-colors">
                      <div>
                        <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-slate-200/60">
                          <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#004e89] flex items-center justify-center shrink-0">
                            <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 font-sans">Components &amp; Badges</span>
                        </div>
                        <ul className="space-y-1.5 font-sans">
                          <li className="text-[11.5px] leading-relaxed flex items-start gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#004e89] mt-1.5 shrink-0" />
                            <span><strong className="text-slate-800">Variants:</strong> Unit color &amp; size picker</span>
                          </li>
                          <li className="text-[11.5px] leading-relaxed flex items-start gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#004e89] mt-1.5 shrink-0" />
                            <span><strong className="text-slate-800">Add Image:</strong> Fanned playing-card visuals</span>
                          </li>
                          <li className="text-[11.5px] leading-relaxed flex items-start gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#004e89] mt-1.5 shrink-0" />
                            <span><strong className="text-slate-800">Tier Badge:</strong> Most Popular &amp; Best Value tags</span>
                          </li>
                          <li className="text-[11.5px] leading-relaxed flex items-start gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#004e89] mt-1.5 shrink-0" />
                            <span><strong className="text-slate-800">Free Gift:</strong> Optional bonus product gifts</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Card 3: Color Theme */}
                    <div className="p-3.5 bg-slate-50/80 hover:bg-slate-50/95 rounded-xl border border-slate-200/80 flex flex-col justify-between transition-colors">
                      <div>
                        <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-slate-200/60">
                          <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#004e89] flex items-center justify-center shrink-0">
                            <Palette className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 font-sans">Color Theme</span>
                        </div>
                        <ul className="space-y-1.5 font-sans">
                          <li className="text-[11.5px] leading-relaxed flex items-start gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#004e89] mt-1.5 shrink-0" />
                            <span><strong className="text-slate-800">12 Palettes:</strong> Berry Maroon, Sage, etc.</span>
                          </li>
                          <li className="text-[11.5px] leading-relaxed flex items-start gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#004e89] mt-1.5 shrink-0" />
                            <span><strong className="text-slate-800">Card Outlines:</strong> Active tier border styling</span>
                          </li>
                          <li className="text-[11.5px] leading-relaxed flex items-start gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#004e89] mt-1.5 shrink-0" />
                            <span><strong className="text-slate-800">Ribbons:</strong> Accents top badges &amp; pills</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Card 4: Live Preview Cards */}
                    <div className="p-3.5 bg-slate-50/80 hover:bg-slate-50/95 rounded-xl border border-slate-200/80 flex flex-col justify-between transition-colors">
                      <div>
                        <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-slate-200/60">
                          <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#004e89] flex items-center justify-center shrink-0">
                            <Tag className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 font-sans">Live Preview Cards</span>
                        </div>
                        <ul className="space-y-1.5 font-sans">
                          <li className="text-[11.5px] leading-relaxed flex items-start gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#004e89] mt-1.5 shrink-0" />
                            <span><strong className="text-slate-800">Direct Edit:</strong> Click tier title, items, or price</span>
                          </li>
                          <li className="text-[11.5px] leading-relaxed flex items-start gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#004e89] mt-1.5 shrink-0" />
                            <span><strong className="text-slate-800">Set Star:</strong> Mark merchant choice Most Popular</span>
                          </li>
                          <li className="text-[11.5px] leading-relaxed flex items-start gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#004e89] mt-1.5 shrink-0" />
                            <span><strong className="text-slate-800">Add Tier:</strong> Add 4th, 5th+ bundle tiers anytime</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Sidebar Panel: Offer Model & Components (Positioned to the side) */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-4">
                  {/* Card 1: Offer Architecture & Model */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4.5">
                    <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
                      <div className="w-1.5 h-4.5 rounded-full bg-[#004e89] shrink-0" />
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight font-sans">
                          Offer Architecture
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium font-sans">
                          Choose pricing tier model and customize elements
                        </p>
                      </div>
                    </div>

                    {/* 4 Offer Type Selector Buttons Reordered: (Percent Off, Fixed Price, BOGO, Flat Off) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 block font-sans tracking-tight">
                          Offer Model
                        </label>
                        <span className="text-xs font-bold font-sans text-[#004e89] bg-blue-50/90 px-2.5 py-0.5 rounded-lg border border-blue-200/70">
                          {offersConfig.offerType.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      {showHints && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200/80 font-sans leading-relaxed">
                          💡 Select a pricing structure. All tiers calculate automatically according to your choice.
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            { id: 'percent_off', label: 'Percent Off', desc: 'Tiered % Savings', icon: Percent },
                            { id: 'fixed_price', label: 'Fixed Price', desc: 'Package Price', icon: DollarSign },
                            { id: 'bogo', label: 'BOGO', desc: 'Buy X Get Y Free', icon: Tag },
                            { id: 'flat_off', label: 'Flat Off', desc: 'Fixed Deduction', icon: Bookmark },
                          ] as const
                        ).map((item) => {
                          const IconComp = item.icon;
                          const isActive = offersConfig.offerType === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectOfferType(item.id)}
                              data-testid={`offer-type-btn-${item.id}`}
                              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all duration-200 cursor-pointer ${
                                isActive
                                  ? 'bg-[#004e89] text-white border-[#004e89] shadow-xs ring-2 ring-[#004e89]/20 scale-[1.01]'
                                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 hover:border-slate-300 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <IconComp
                                  size={15}
                                  className={isActive ? 'text-white' : 'text-[#004e89]'}
                                />
                                {isActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                )}
                              </div>
                              <div>
                                <span className={`text-xs font-bold block leading-tight font-sans ${isActive ? 'text-white' : 'text-slate-900'}`}>
                                  {item.label}
                                </span>
                                <span className={`text-[10px] block mt-0.5 font-medium leading-tight font-sans ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                                  {item.desc}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Feature Toggle Chips Reordered: (Variants, Add Image, Tier Badge, Offer Label, Free Gift, + 4 More) */}
                    <div className="pt-3.5 border-t border-slate-100 space-y-2">
                      <label className="text-xs font-bold text-slate-700 block font-sans tracking-tight">
                        Components &amp; Badges
                      </label>

                      {showHints && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200/80 font-sans leading-relaxed">
                          💡 Enable or disable interactive elements. Active components display directly inside each tier card.
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            { key: 'variants', label: 'Variants', icon: Layers },
                            { key: 'addImage', label: 'Add Image', icon: ImageIcon },
                            { key: 'tierBadge', label: 'Tier Badge', icon: Award },
                            { key: 'offerLabel', label: 'Offer Label', icon: Bookmark },
                            { key: 'freeGift', label: 'Free Gift', icon: Gift },
                          ] as const
                        ).map((chip) => {
                          const IconComp = chip.icon;
                          const active = safeFeatures[chip.key] !== false;
                          return (
                            <button
                              key={chip.key}
                              type="button"
                              onClick={() => handleToggleFeature(chip.key)}
                              data-testid={`offer-feature-chip-${chip.key}`}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans transition-all cursor-pointer ${
                                active
                                  ? 'bg-blue-50/80 text-[#004e89] border border-blue-200 font-bold shadow-2xs'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200/80 font-medium'
                              }`}
                            >
                              <IconComp size={13} className={active ? 'text-[#004e89]' : 'text-slate-400'} />
                              <span>{chip.label}</span>
                              {active ? (
                                <Check size={11} className="text-[#004e89] stroke-[2.5]" />
                              ) : (
                                <Plus size={11} className="text-slate-400" />
                              )}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => setShowMoreFeatures((v) => !v)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold font-sans bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Plus size={12} className="text-slate-500" />
                          <span>+ 4 More</span>
                        </button>
                      </div>

                      {showMoreFeatures && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                          {(
                            [
                              { key: 'compareAtPrice', label: 'Compare Price' },
                              { key: 'customHeader', label: 'Header Title' },
                              { key: 'mostPopularHighlight', label: 'Popular Highlight' },
                              { key: 'unitPriceSubtitle', label: 'Per-Unit Price' },
                            ] as const
                          ).map((extra) => {
                            const active = Boolean(safeFeatures[extra.key]);
                            return (
                              <button
                                key={extra.key}
                                type="button"
                                onClick={() => handleToggleFeature(extra.key)}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-sans transition-all cursor-pointer ${
                                  active
                                    ? 'bg-blue-50/80 text-[#004e89] border border-blue-200 font-bold shadow-2xs'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200/80 font-medium'
                                }`}
                              >
                                <span>{extra.label}</span>
                                {active ? (
                                  <Check size={10} className="text-[#004e89] stroke-[2.5]" />
                                ) : (
                                  <Plus size={10} className="text-slate-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Color Theme Palette (Styled cleanly in Yume platform aesthetic) */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: getOfferThemePalette(offersConfig.themeColorId).swatchHex }}
                        />
                        <span className="text-xs font-bold text-slate-700 font-sans tracking-tight">
                          Color Theme
                        </span>
                      </div>
                      <span className="text-xs font-bold font-sans px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                        {getOfferThemePalette(offersConfig.themeColorId).name}
                      </span>
                    </div>

                    {showHints && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200/80 font-sans leading-relaxed">
                        💡 Highlights active card outlines, discount pill text, and promotional banners in the selected palette.
                      </p>
                    )}

                    <div className="grid grid-cols-6 gap-2.5 pt-1">
                      {OFFER_THEME_PALETTES.map((swatch) => {
                        const isSelected = offersConfig.themeColorId === swatch.id;
                        return (
                          <button
                            key={swatch.id}
                            type="button"
                            title={swatch.name}
                            onClick={() =>
                              onChange({ ...offersConfig, themeColorId: swatch.id })
                            }
                            data-testid={`offer-theme-swatch-${swatch.id}`}
                            className={`group relative aspect-square rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs ${
                              isSelected
                                ? 'ring-2 ring-[#004e89] ring-offset-2 scale-105 shadow-sm'
                                : 'hover:scale-105 hover:ring-1 hover:ring-slate-300'
                            }`}
                            style={{ backgroundColor: swatch.swatchHex }}
                          >
                            {isSelected && (
                              <Check size={13} className="text-white drop-shadow stroke-[3]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Main Panel: Live Interactive Preview */}
                <div className="lg:col-span-7 xl:col-span-8">
                  <div className="bg-white border border-slate-200/90 rounded-[22px] p-5 sm:p-7 shadow-xs">
                    <div className="max-w-[500px] mx-auto">
                      <YumeCustomerOfferWidget
                        offersConfig={offersConfig}
                        baseUnitPrice={safeBasePrice}
                        currencySymbol={currencySymbol}
                        currencyPosition={currencyPosition}
                        productImageUrl={productImageUrl}
                        productImages={productImages}
                        step3Axes={step3Axes}
                        step3Colors={step3Colors}
                        step3Variants={step3Variants as any}
                        selectedTierId={previewSelectedTierId}
                        onSelectTier={(tierId) => {
                          setPreviewSelectedTierId(tierId);
                          onChange({ ...offersConfig, defaultSelectedTierId: tierId });
                        }}
                        unitSelections={previewUnitSelections}
                        onChangeUnitSelection={handlePreviewUnitChange}
                        editable={true}
                        onChangeConfig={onChange}
                        storeProducts={storeProducts}
                        onAddTier={handleAddTier}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>,
        document.body
      )}
    </div>
  );
};
