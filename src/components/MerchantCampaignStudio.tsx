import React, { useState, useEffect, useMemo } from 'react';
import {
  MarketConfig,
  MarketEvent,
  YumeReadyTemplate,
  CampaignRecord,
  CampaignCreationMode,
  getMarketByCountryOrCode,
  getEventsForMarket,
  getTemplatesForMarket,
  getAllCampaigns,
  saveCampaignWithValidation,
  deleteCampaignForTenant,
  upsertMarketCulturalEvent,
  nominateProductsForPlatformCampaign,
  isPublicPaidAdvertisingEnabled,
} from '../utils/globalMarketArchitecture';
import {
  Calendar,
  Sparkles,
  Plus,
  LayoutTemplate,
  Sliders,
  CheckCircle2,
  Trash2,
  Tag,
  Megaphone,
  ShieldCheck,
  AlertCircle,
  Eye,
  Lock,
  Layers,
  Palette,
} from 'lucide-react';

interface StoreProductLite {
  id: number | string;
  name: string;
  price: number;
  image?: string;
  category?: string;
}

interface MerchantCampaignStudioProps {
  storeId: string;
  storeName: string;
  storeCountry: string;
  storeLogo?: string;
  products: StoreProductLite[];
  actorId: string;
  actorEmail?: string;
  onCampaignsUpdated?: () => void;
}

export const MerchantCampaignStudio: React.FC<MerchantCampaignStudioProps> = ({
  storeId,
  storeName,
  storeCountry,
  storeLogo,
  products,
  actorId,
  actorEmail,
  onCampaignsUpdated,
}) => {
  const market: MarketConfig = useMemo(() => getMarketByCountryOrCode(storeCountry), [storeCountry]);
  const [refreshTick, setRefreshTick] = useState(0);

  const marketEvents = useMemo(
    () => getEventsForMarket(market.id, { includeMerchantStoreId: storeId }),
    [market.id, storeId, refreshTick]
  );
  const templates: YumeReadyTemplate[] = useMemo(
    () => getTemplatesForMarket(market.id),
    [market.id]
  );
  const allCampaigns = useMemo(() => getAllCampaigns(), [refreshTick]);

  const myStoreCampaigns = useMemo(
    () =>
      allCampaigns.filter(
        (c) => c.visibilityLevel === 'store_only' && String(c.storeId) === String(storeId)
      ),
    [allCampaigns, storeId]
  );

  const officialPlatformCampaigns = useMemo(
    () =>
      allCampaigns.filter(
        (c) =>
          c.visibilityLevel === 'platform_wide' &&
          (c.marketId === market.id || c.marketId === 'GLOBAL') &&
          c.status === 'active'
      ),
    [allCampaigns, market.id]
  );

  const myAdSubmissions = useMemo(
    () =>
      allCampaigns.filter(
        (c) => c.visibilityLevel === 'sponsored_ad' && String(c.storeId) === String(storeId)
      ),
    [allCampaigns, storeId]
  );

  const [activeStudioSubTab, setActiveStudioSubTab] = useState<
    'store_campaigns' | 'calendar_events' | 'platform_campaigns' | 'yume_ads'
  >('store_campaigns');

  // Campaign Builder State
  const [creationMode, setCreationMode] = useState<CampaignCreationMode>('yume_template');
  const [selectedEventId, setSelectedEventId] = useState<string>(marketEvents[0]?.id || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignSubtitle, setCampaignSubtitle] = useState('');
  const [bannerBadgeText, setBannerBadgeText] = useState('SPECIAL OFFER');
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [promoCode, setPromoCode] = useState('');
  const [customBannerUrl, setCustomBannerUrl] = useState('');
  const [accentColorHex, setAccentColorHex] = useState(
    market.culturalColorPalette[0]?.hex || '#4F46E5'
  );
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() =>
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [selectedProductIds, setSelectedProductIds] = useState<Array<string | number>>([]);

  // Custom Store Event Form
  const [customEventTitle, setCustomEventTitle] = useState('');
  const [customEventCategory, setCustomEventCategory] = useState<
    'commercial' | 'seasonal' | 'cultural'
  >('commercial');
  const [customEventStart, setCustomEventStart] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [customEventEnd, setCustomEventEnd] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [customEventGreeting, setCustomEventGreeting] = useState('');

  // Feedback message
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sync template defaults when selecting a ready-made template
  useEffect(() => {
    if (creationMode === 'yume_template' || creationMode === 'hybrid') {
      const tpl = templates.find((t) => t.id === selectedTemplateId);
      if (tpl) {
        if (!campaignTitle) setCampaignTitle(`${storeName} — ${tpl.name}`);
        setCampaignSubtitle(tpl.defaultSubtitle);
        setBannerBadgeText(tpl.defaultBadge);
        setDiscountPercent(tpl.defaultDiscountPercent);
        setAccentColorHex(tpl.accentColorHex);
      }
    }
  }, [selectedTemplateId, creationMode, templates, storeName]);

  useEffect(() => {
    const handleUpdate = () => setRefreshTick((t) => t + 1);
    window.addEventListener('yume-global-architecture-updated', handleUpdate);
    window.addEventListener('yume-campaigns-updated', handleUpdate);
    window.addEventListener('yume-events-updated', handleUpdate);
    return () => {
      window.removeEventListener('yume-global-architecture-updated', handleUpdate);
      window.removeEventListener('yume-campaigns-updated', handleUpdate);
      window.removeEventListener('yume-events-updated', handleUpdate);
    };
  }, []);

  const toggleProductSelection = (id: string | number) => {
    setSelectedProductIds((prev) =>
      prev.some((x) => String(x) === String(id))
        ? prev.filter((x) => String(x) !== String(id))
        : [...prev, id]
    );
  };

  const handleCreateStoreCampaign = (asSponsoredAd = false) => {
    setStatusMessage(null);
    if (!campaignTitle.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please provide a campaign title.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const newCampaign: CampaignRecord = {
      id: `camp_${storeId}_${Date.now()}`,
      marketId: market.id,
      storeId: String(storeId),
      storeName,
      ownerUserId: actorId,
      title: campaignTitle.trim(),
      subtitle:
        campaignSubtitle.trim() ||
        `Exclusive offer at ${storeName} (${market.countryName} Market)`,
      badgeText: bannerBadgeText.trim() || 'STORE EVENT',
      promoCode: promoCode.trim().toUpperCase() || undefined,
      discountPercent: Number(discountPercent) || 0,
      visibilityLevel: asSponsoredAd ? 'sponsored_ad' : 'store_only',
      creationMode,
      templateId: creationMode !== 'custom_scratch' ? selectedTemplateId : undefined,
      linkedEventId: selectedEventId || undefined,
      startDate,
      endDate,
      status: 'active',
      adApprovalStatus: asSponsoredAd ? 'pending_admin_review' : 'not_requested',
      bannerImageUrl: customBannerUrl.trim() || undefined,
      storeLogoUrl: storeLogo,
      accentColorHex,
      ornamentPattern: market.culturalIdentity.defaultOrnamentPattern,
      participatingProductIds:
        selectedProductIds.length > 0
          ? selectedProductIds.map((id) => String(id))
          : products.slice(0, 4).map((p) => String(p.id)),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const result = saveCampaignWithValidation(newCampaign, {
      actorId,
      actorEmail,
      isPlatformAdmin: false,
    });

    if (!result.allowed) {
      setStatusMessage({
        type: 'error',
        text: result.reason || 'Campaign validation failed.',
      });
      return;
    }

    setStatusMessage({
      type: 'success',
      text: asSponsoredAd
        ? 'Sponsored Ad campaign submitted to YUME Platform Admin for review (Public Ads remain disabled by default until Admin activation).'
        : `Storefront Campaign "${newCampaign.title}" is now ACTIVE in your ${market.countryName} storefront!`,
    });
    setCampaignTitle('');
    setRefreshTick((t) => t + 1);
    onCampaignsUpdated?.();
  };

  const handleCreateCustomStoreEvent = () => {
    setStatusMessage(null);
    if (!customEventTitle.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a name for your custom store event.',
      });
      return;
    }

    const newEvent: MarketEvent = {
      id: `evt_store_${storeId}_${Date.now()}`,
      marketId: market.id,
      countryName: market.countryName,
      title: customEventTitle.trim(),
      greetingText: customEventGreeting.trim() || `${storeName} Special Event`,
      category: customEventCategory,
      religionType: 'none',
      controlScope: 'merchant_store_exclusive',
      storeId: String(storeId),
      startDate: customEventStart,
      endDate: customEventEnd,
      timeZone: market.timeZone,
      autoActivate: true,
      ornamentPattern: market.culturalIdentity.defaultOrnamentPattern,
      ornamentOpacity: market.culturalIdentity.defaultOrnamentOpacity,
      accentTintHex: market.culturalColorPalette[0]?.hex || '#4F46E5',
      recommendedDiscountPercent: 20,
    };

    const validation = upsertMarketCulturalEvent(newEvent, {
      isPlatformAdmin: false,
      actorStoreId: String(storeId),
    });

    if (!validation.valid) {
      setStatusMessage({
        type: 'error',
        text: validation.error || 'Event creation blocked by platform policy.',
      });
      return;
    }

    setSelectedEventId(newEvent.id);
    setCustomEventTitle('');
    setCustomEventGreeting('');
    setRefreshTick((t) => t + 1);
    setStatusMessage({
      type: 'success',
      text: `Custom Store Event "${newEvent.title}" added to your private store calendar.`,
    });
  };

  const handleDeleteCampaign = (campaignId: string) => {
    const res = deleteCampaignForTenant(campaignId, String(storeId), false);
    if (!res.allowed) {
      setStatusMessage({ type: 'error', text: res.reason || 'Cannot delete campaign.' });
    } else {
      setRefreshTick((t) => t + 1);
      onCampaignsUpdated?.();
    }
  };

  const handleNominateForPlatformCampaign = (platformCampaignId: string) => {
    const productIdsToNominate =
      selectedProductIds.length > 0
        ? selectedProductIds
        : products.slice(0, 3).map((p) => p.id);

    const res = nominateProductsForPlatformCampaign({
      campaignId: platformCampaignId,
      storeId: String(storeId),
      storeName,
      marketId: market.id,
      productIds: productIdsToNominate,
    });

    if (!res.allowed) {
      setStatusMessage({ type: 'error', text: res.reason || 'Nomination failed.' });
    } else {
      setStatusMessage({
        type: 'success',
        text: 'Products nominated for the Official YUME Platform Campaign! Pending Platform Admin approval.',
      });
      setRefreshTick((t) => t + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>YUME Merchant Campaign & Event Studio</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {storeName} — Promotional & Cultural Campaigns
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Scoped exclusively to your active market:{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {market.flag} {market.countryName} ({market.currencyCode})
              </span>
              . Storefront campaigns appear inside your store without crossing into foreign markets.
            </p>
          </div>

          {/* Sub-Navigation */}
          <div className="flex flex-wrap gap-2">
            {[
              {
                id: 'store_campaigns',
                label: '1. Store Campaign Builder',
                icon: LayoutTemplate,
              },
              {
                id: 'calendar_events',
                label: `2. ${market.countryName} Event Calendar`,
                icon: Calendar,
              },
              {
                id: 'platform_campaigns',
                label: '3. Official YUME Campaigns',
                icon: Megaphone,
              },
              {
                id: 'yume_ads',
                label: '4. YUME Sponsored Ads',
                icon: ShieldCheck,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeStudioSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveStudioSubTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* TAB 1: STORE CAMPAIGN BUILDER (Option A Ready-Made, Option B Scratch, Hybrid) */}
      {activeStudioSubTab === 'store_campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create a Storefront Campaign (Level 1)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Choose a YUME ready-made template, build from scratch, or customize a hybrid template.
              </p>
            </div>

            {/* Creation Mode Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'yume_template',
                  title: 'Option A: YUME Templates',
                  desc: 'Ready-made professional visual banners & badges',
                  icon: LayoutTemplate,
                },
                {
                  id: 'custom_scratch',
                  title: 'Option B: From Scratch',
                  desc: 'Upload custom artwork, colors, promo codes & copy',
                  icon: Sliders,
                },
                {
                  id: 'hybrid',
                  title: 'Hybrid Mode',
                  desc: 'Start with a YUME template and customize every detail',
                  icon: Layers,
                },
              ].map((mode) => {
                const Icon = mode.icon;
                const active = creationMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setCreationMode(mode.id as CampaignCreationMode)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                      <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{mode.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {mode.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Link to Market / Store Event */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Occasion / Event (Market Scoped)
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">General Store Promotion</option>
                  {marketEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.category})
                    </option>
                  ))}
                </select>
              </div>

              {creationMode !== 'custom_scratch' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    YUME Ready-Made Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.defaultBadge})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Title, Subtitle, Discount, Promo Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder={`e.g., ${storeName} Seasonal Collection`}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Product & Hero Badge Text
                </label>
                <input
                  type="text"
                  value={bannerBadgeText}
                  onChange={(e) => setBannerBadgeText(e.target.value)}
                  placeholder="e.g., FLASH SALE • -25%"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Storefront Banner Subtitle / Copy
                </label>
                <input
                  type="text"
                  value={campaignSubtitle}
                  onChange={(e) => setCampaignSubtitle(e.target.value)}
                  placeholder="Subtitle shown in your storefront campaign strip"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Promo Code (Optional)
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="e.g., YUME25"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono uppercase text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Cultural Accent Color Selection */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                <Palette className="w-3.5 h-3.5 text-indigo-500" />
                <span>{market.countryName} Cultural & Brand Accent Colors</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {market.culturalColorPalette.map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => setAccentColorHex(swatch.hex)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                      accentColorHex.toLowerCase() === swatch.hex.toLowerCase()
                        ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-slate-100 dark:bg-slate-800'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <span className="text-slate-800 dark:text-slate-200">{swatch.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Participating Store Products */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Select Participating Store Products ({selectedProductIds.length} selected)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {products.map((prod) => {
                  const isSelected = selectedProductIds.some(
                    (id) => String(id) === String(prod.id)
                  );
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => toggleProductSelection(prod.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {prod.image && (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {prod.price.toLocaleString()} {market.currencyCode}
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleCreateStoreCampaign(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Launch Storefront Campaign</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Preview & Active Storefront Campaigns */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Non-Intrusive Storefront Strip Preview */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Live Storefront Preview (YUME Identity Preserved)
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Level 1 • Storefront Scoped
                </span>
              </div>

              <div
                className="rounded-xl p-4 text-white shadow-xs relative overflow-hidden"
                style={{ backgroundColor: accentColorHex }}
              >
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/25 text-[10px] font-bold uppercase tracking-wider">
                    <Tag className="w-3 h-3" />
                    {bannerBadgeText || 'SPECIAL EVENT'}
                  </span>
                  {promoCode && (
                    <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded font-bold">
                      CODE: {promoCode.toUpperCase()}
                    </span>
                  )}
                </div>
                <h4 className="relative z-10 text-base font-bold mt-2">
                  {campaignTitle || `${storeName} Featured Event`}
                </h4>
                <p className="relative z-10 text-xs opacity-90 mt-0.5">
                  {campaignSubtitle ||
                    `Up to ${discountPercent}% OFF selected items in ${market.countryName}`}
                </p>
              </div>
            </div>

            {/* Active Store Campaigns List */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Storefront Campaigns ({myStoreCampaigns.length})
              </h4>
              {myStoreCampaigns.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                  No active store campaigns yet. Create one using a ready-made template or custom design.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {myStoreCampaigns.map((camp) => (
                    <div
                      key={camp.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: camp.accentColorHex }}
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {camp.title}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            {camp.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {camp.subtitle} • -{camp.discountPercent}% •{' '}
                          {camp.participatingProductIds.length} products
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCampaign(camp.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MARKET EVENT CALENDAR & PRIVATE STORE EVENTS */}
      {activeStudioSubTab === 'calendar_events' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {market.flag} {market.countryName} Predefined & Store Event Calendar
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Includes national, cultural, seasonal, and commercial occasions for {market.countryName}.
                  {market.isMuslimMarket
                    ? ' Islamic occasions (Ramadan, Eid al-Fitr, Eid al-Adha) are centrally scheduled by YUME Platform Admin.'
                    : ''}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {marketEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {ev.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {ev.category}
                      </span>
                      {ev.controlScope === 'platform_central_only' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          <Lock className="w-2.5 h-2.5" /> Central Platform Control
                        </span>
                      )}
                      {ev.storeId === String(storeId) && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                          Private Store Event
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {ev.startDate} → {ev.endDate} • Greeting: {ev.greetingText}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEventId(ev.id);
                      setCampaignTitle(`${storeName} — ${ev.title}`);
                      setCampaignSubtitle(ev.greetingText);
                      setActiveStudioSubTab('store_campaigns');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors shrink-0 cursor-pointer"
                  >
                    Create Campaign for Event
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Custom Store Event */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              + Create Custom Store Event
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add Store Anniversary, Brand Launch, Clearance Week, or VIP Client Days. Custom store events are private to {storeName}.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  value={customEventTitle}
                  onChange={(e) => setCustomEventTitle(e.target.value)}
                  placeholder="e.g., Store 3rd Anniversary Week"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Type
                </label>
                <select
                  value={customEventCategory}
                  onChange={(e) => setCustomEventCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="commercial">Commercial Flash / Anniversary Event</option>
                  <option value="seasonal">Seasonal Collection Drop</option>
                  <option value="cultural">Cultural & Artisanal Showcase</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customEventStart}
                    onChange={(e) => setCustomEventStart(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEventEnd}
                    onChange={(e) => setCustomEventEnd(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Storefront Greeting Message
                </label>
                <input
                  type="text"
                  value={customEventGreeting}
                  onChange={(e) => setCustomEventGreeting(e.target.value)}
                  placeholder="e.g., Celebrating 3 Years of Craftsmanship"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleCreateCustomStoreEvent}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Save Private Store Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OFFICIAL PLATFORM-WIDE CAMPAIGNS (Level 2) */}
      {activeStudioSubTab === 'platform_campaigns' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Official YUME Platform-Wide Campaigns ({market.flag} {market.countryName})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nominate your eligible store products to join official YUME marketplace campaigns. Subject to Platform Admin approval.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {officialPlatformCampaigns.map((camp) => {
              const myNomination = camp.merchantNominations?.find(
                (n) => String(n.storeId) === String(storeId)
              );
              return (
                <div
                  key={camp.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                      Official YUME Campaign
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {camp.startDate} → {camp.endDate}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {camp.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {camp.subtitle}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    {myNomination ? (
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          myNomination.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        Nomination Status: {myNomination.status.toUpperCase()} (
                        {myNomination.productIds.length} products)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleNominateForPlatformCampaign(camp.id)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors cursor-pointer"
                      >
                        Nominate Store Products
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: YUME SPONSORED ADS INTEGRATION (Level 3 — Disabled by default) */}
      {activeStudioSubTab === 'yume_ads' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  YUME Sponsored Ads Governance Status:{' '}
                  {isPublicPaidAdvertisingEnabled()
                    ? 'PUBLIC ADS ENABLED BY ADMIN'
                    : 'PUBLIC PAID ADVERTISING DISABLED BY DEFAULT'}
                </h4>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                  You may prepare and submit sponsored ad creatives using your campaign studio. All paid ads remain in sandbox preview until approved and activated by YUME Platform Admin.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCreateStoreCampaign(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 cursor-pointer"
            >
              Submit Current Draft as Sponsored Ad
            </button>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Submitted Sponsored Ad Requests ({myAdSubmissions.length})
            </h4>
            {myAdSubmissions.map((ad) => (
              <div
                key={ad.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {ad.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {ad.subtitle} • Market: {ad.marketId}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  {ad.adApprovalStatus || ad.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
