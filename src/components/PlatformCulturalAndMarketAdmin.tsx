import React, { useState, useEffect, useMemo } from "react";
import {
  MarketConfig,
  MarketEvent,
  MarketEventCategory,
  CampaignRecord,
  getAllMarketConfigs,
  saveMarketConfigs,
  getAllCulturalEvents,
  upsertMarketCulturalEvent,
  toggleIslamicOccasionForceActive,
  validateCulturalEventPolicy,
  getAllCampaigns,
  saveCampaignWithValidation,
  approvePlatformCampaignNomination,
  getYumeAdsSystemConfig,
  updateYumeAdsSystemConfig,
  getVisibleSponsoredAds,
} from "../utils/globalMarketArchitecture";
import {
  Globe,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Palette,
  Megaphone,
  Eye,
  Calendar,
  Plus,
} from "lucide-react";
import {
  YUME_ADMIN_TOKENS,
  YumeAdminSectionHeader,
  YumeAdminAdviceBanner,
  YumeAdminSubNavStrip,
  YumeAdminToggle,
} from "./YumeAdminDesignSystem";

interface PlatformCulturalAndMarketAdminProps {
  adminEmail: string;
}

type CulturalSectionId =
  | "markets"
  | "islamic_central"
  | "cultural_calendar"
  | "color_palettes"
  | "platform_campaigns"
  | "yume_ads_governance";

export const PlatformCulturalAndMarketAdmin: React.FC<
  PlatformCulturalAndMarketAdminProps
> = ({ adminEmail }) => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedSection, setSelectedSection] =
    useState<CulturalSectionId>("markets");

  const markets = useMemo(() => getAllMarketConfigs(), [refreshTick]);
  const allEvents = useMemo(() => getAllCulturalEvents(), [refreshTick]);
  const allCampaigns = useMemo(() => getAllCampaigns(), [refreshTick]);
  const adsConfig = useMemo(() => getYumeAdsSystemConfig(), [refreshTick]);

  const [selectedMarketId, setSelectedMarketId] = useState<string>("DZ");
  const activeMarket = useMemo(
    () => markets.find((m) => m.id === selectedMarketId) || markets[0],
    [markets, selectedMarketId]
  );

  // New Country Market Registration state
  const [newCountryCode, setNewCountryCode] = useState("");
  const [newCountryName, setNewCountryName] = useState("");
  const [newCountryLocalName, setNewCountryLocalName] = useState("");
  const [newCountryFlag, setNewCountryFlag] = useState("🌍");
  const [newCountryCurrency, setNewCountryCurrency] = useState("USD");
  const [newCountryIsMuslim, setNewCountryIsMuslim] = useState(false);

  // New Cultural Event state
  const [evtTitle, setEvtTitle] = useState("");
  const [evtCategory, setEvtCategory] =
    useState<MarketEventCategory>("national");
  const [evtStart, setEvtStart] = useState("2026-06-01");
  const [evtEnd, setEvtEnd] = useState("2026-06-07");
  const [evtGreeting, setEvtGreeting] = useState("");

  // New Cultural Color Swatch state
  const [swatchName, setSwatchName] = useState("");
  const [swatchHex, setSwatchHex] = useState("#0F766E");
  const [swatchInspiration, setSwatchInspiration] = useState("");

  // Official Platform Campaign state
  const [platCampTitle, setPlatCampTitle] = useState("");
  const [platCampHeadline, setPlatCampHeadline] = useState("");
  const [platCampDiscount, setPlatCampDiscount] = useState(30);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const onUpdate = () => setRefreshTick((t) => t + 1);
    window.addEventListener("yume-global-architecture-updated", onUpdate);
    window.addEventListener("yume-markets-updated", onUpdate);
    window.addEventListener("yume-events-updated", onUpdate);
    window.addEventListener("yume-campaigns-updated", onUpdate);
    return () => {
      window.removeEventListener("yume-global-architecture-updated", onUpdate);
      window.removeEventListener("yume-markets-updated", onUpdate);
      window.removeEventListener("yume-events-updated", onUpdate);
      window.removeEventListener("yume-campaigns-updated", onUpdate);
    };
  }, []);

  const handleToggleMarketActive = (marketId: string) => {
    const updated = markets.map((m) =>
      m.id === marketId ? { ...m, isActive: !m.isActive } : m
    );
    saveMarketConfigs(updated);
    setRefreshTick((t) => t + 1);
  };

  const handleAddCountryMarket = () => {
    setFeedback(null);
    if (!newCountryCode.trim() || !newCountryName.trim()) {
      setFeedback({
        type: "error",
        text: "Country ISO code and Country Name are required.",
      });
      return;
    }
    const code = newCountryCode.trim().toUpperCase();
    if (markets.some((m) => m.id === code)) {
      setFeedback({ type: "error", text: `Market ${code} already exists.` });
      return;
    }

    const currencyCode = newCountryCurrency.trim().toUpperCase() || "USD";
    const created: MarketConfig = {
      id: code,
      countryName: newCountryName.trim(),
      nativeName: newCountryLocalName.trim() || newCountryName.trim(),
      flag: newCountryFlag.trim() || "🌍",
      currencyCode,
      currencySymbol: currencyCode,
      locale: `en-${code}`,
      timeZone: "UTC",
      phonePrefix: "+00",
      isActive: true,
      isMuslimMarket: newCountryIsMuslim,
      culturalIdentity: {
        id: `${code.toLowerCase()}_heritage`,
        title: `Welcome to YUME ${newCountryName.trim()}`,
        description: `Localized YUME marketplace for ${newCountryName.trim()}`,
        defaultOrnamentPattern: newCountryIsMuslim
          ? "islamic_mosque_arabesque"
          : "minimal_global",
        defaultOrnamentOpacity: 0.08,
        heritageNote: `Authentic regional identity for ${newCountryName.trim()}`,
      },
      culturalColorPalette: [
        {
          id: `${code.toLowerCase()}_sig_1`,
          name: `${newCountryName.trim()} Signature Blue`,
          hex: "#1D4ED8",
          inspiration: "National Signature Tone",
        },
      ],
    };

    saveMarketConfigs([...markets, created]);
    setNewCountryCode("");
    setNewCountryName("");
    setNewCountryLocalName("");
    setRefreshTick((t) => t + 1);
    setFeedback({
      type: "success",
      text: `Independent Market "${created.countryName} (${created.id})" added with strict catalog separation.`,
    });
  };

  const handleCreateMarketEvent = () => {
    setFeedback(null);
    const candidate: MarketEvent = {
      id: `evt_${activeMarket.id.toLowerCase()}_${Date.now()}`,
      marketId: activeMarket.id,
      countryName: activeMarket.countryName,
      title: evtTitle.trim(),
      greetingText: evtGreeting.trim() || evtTitle.trim(),
      category: evtCategory,
      religionType: evtCategory === "religious" ? "islamic" : "none",
      controlScope:
        evtCategory === "religious"
          ? "platform_central_only"
          : "merchant_customizable",
      startDate: evtStart,
      endDate: evtEnd,
      timeZone: activeMarket.timeZone,
      autoActivate: true,
      ornamentPattern: activeMarket.culturalIdentity.defaultOrnamentPattern,
      ornamentOpacity: activeMarket.culturalIdentity.defaultOrnamentOpacity,
      accentTintHex: activeMarket.culturalColorPalette[0]?.hex || "#1e2631",
    };

    const policyCheck = validateCulturalEventPolicy(
      candidate,
      "platform_admin"
    );
    if (!policyCheck.valid) {
      setFeedback({
        type: "error",
        text:
          policyCheck.error || "Blocked by Religious & Cultural Event Policy.",
      });
      return;
    }

    const res = upsertMarketCulturalEvent(candidate, { isPlatformAdmin: true });
    if (!res.valid) {
      setFeedback({
        type: "error",
        text: res.error || "Failed to save event.",
      });
      return;
    }

    setEvtTitle("");
    setEvtGreeting("");
    setRefreshTick((t) => t + 1);
    setFeedback({
      type: "success",
      text: `Event "${candidate.title}" added to ${activeMarket.countryName}.`,
    });
  };

  const handleAddCulturalColorSwatch = () => {
    if (!swatchName.trim() || !swatchHex.trim()) return;
    const updated = markets.map((m) => {
      if (m.id !== activeMarket.id) return m;
      return {
        ...m,
        culturalColorPalette: [
          ...m.culturalColorPalette,
          {
            id: `${activeMarket.id.toLowerCase()}_${Date.now()}`,
            name: swatchName.trim(),
            hex: swatchHex.trim().toUpperCase(),
            inspiration:
              swatchInspiration.trim() ||
              `${activeMarket.countryName} Cultural Tone`,
          },
        ],
      };
    });
    saveMarketConfigs(updated);
    setSwatchName("");
    setSwatchInspiration("");
    setRefreshTick((t) => t + 1);
    setFeedback({
      type: "success",
      text: `Added "${swatchName}" to ${activeMarket.countryName}'s Add-Product Cultural Color Picker.`,
    });
  };

  const handlePublishOfficialCampaign = () => {
    if (!platCampTitle.trim() || !platCampHeadline.trim()) return;
    const nowIso = new Date().toISOString();
    const camp: CampaignRecord = {
      id: `camp_plat_${activeMarket.id.toLowerCase()}_${Date.now()}`,
      marketId: activeMarket.id,
      storeId: null,
      ownerUserId: "platform_admin",
      title: platCampTitle.trim(),
      subtitle: platCampHeadline.trim(),
      badgeText: `YUME ${activeMarket.id} OFFICIAL`,
      discountPercent: Number(platCampDiscount) || 25,
      visibilityLevel: "platform_wide",
      creationMode: "yume_template",
      startDate: nowIso.slice(0, 10),
      endDate: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
      status: "active",
      accentColorHex: activeMarket.culturalColorPalette[0]?.hex || "#1e2631",
      ornamentPattern: activeMarket.culturalIdentity.defaultOrnamentPattern,
      participatingProductIds: [],
      merchantNominations: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const res = saveCampaignWithValidation(camp, {
      actorId: "admin_platform",
      actorEmail: adminEmail,
      isPlatformAdmin: true,
    });
    if (res.allowed) {
      setPlatCampTitle("");
      setPlatCampHeadline("");
      setRefreshTick((t) => t + 1);
      setFeedback({
        type: "success",
        text: `Official Platform Campaign "${camp.title}" launched in ${activeMarket.countryName}.`,
      });
    }
  };

  const islamicEvents = allEvents.filter(
    (e) => e.category === "religious" && e.religionType === "islamic"
  );

  const platformCampaignsCount = allCampaigns.filter(
    (c) => c.visibilityLevel === "platform_wide"
  ).length;

  const sponsoredAdsCount = allCampaigns.filter(
    (c) => c.visibilityLevel === "sponsored_ad"
  ).length;

  return (
    <div className="space-y-5">
      {/* Add New Product Horizontal Sub-Navigation Card Strip (6 Multi-Tab Views) */}
      <YumeAdminSubNavStrip<CulturalSectionId>
        activeId={selectedSection}
        onSelect={setSelectedSection}
        items={[
          {
            id: "markets",
            label: "Global Markets",
            subtitle: "Country catalog isolation",
            icon: Globe,
            badge: markets.length,
          },
          {
            id: "islamic_central",
            label: "Islamic Occasions",
            subtitle: "Ramadan & Eid control",
            icon: Lock,
            badge: islamicEvents.length,
          },
          {
            id: "cultural_calendar",
            label: "Event Calendar",
            subtitle: "National & heritage dates",
            icon: Calendar,
            badge: allEvents.length,
          },
          {
            id: "color_palettes",
            label: "Cultural Palettes",
            subtitle: "Add-Product color swatches",
            icon: Palette,
            badge: activeMarket.culturalColorPalette.length,
          },
          {
            id: "platform_campaigns",
            label: "Campaigns",
            subtitle: "Official & merchant picks",
            icon: Megaphone,
            badge: platformCampaignsCount,
          },
          {
            id: "yume_ads_governance",
            label: "YUME Ads Control",
            subtitle: adsConfig.publicPaidAdvertisingEnabled
              ? "Public ads enabled"
              : "Disabled by default",
            icon: Eye,
            badge: sponsoredAdsCount,
          },
        ]}
      />

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* SECTION 1: GLOBAL MARKETS REGISTRY */}
      {selectedSection === "markets" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className={`lg:col-span-8 ${YUME_ADMIN_TOKENS.cardClass}`}>
            <YumeAdminSectionHeader
              title={`Configured Independent Country Markets (${markets.length})`}
              subtitle="Strict catalog isolation per country, localized currency, and regional cultural identity."
            />

            <YumeAdminAdviceBanner label="ADVICE:">
              Each country market operates as an isolated catalog boundary.
              Stores and products registered in one market are shown exclusively
              to shoppers browsing that country.
            </YumeAdminAdviceBanner>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {markets.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/40 dark:bg-slate-950/40 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{m.flag}</span>
                      <span className="text-xs font-bold text-stone-900 dark:text-white truncate">
                        {m.countryName} ({m.id})
                      </span>
                      <span className="text-[11px] font-sans tabular-nums text-stone-500 dark:text-slate-400">
                        · {m.currencyCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 truncate">
                      {m.culturalIdentity.title} ·{" "}
                      {m.isMuslimMarket
                        ? "Islamic Occasions Enabled"
                        : "Standard Calendar"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10.5px] font-bold ${
                        m.isActive
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-stone-400 dark:text-slate-500"
                      }`}
                    >
                      {m.isActive ? "Active" : "Paused"}
                    </span>
                    <YumeAdminToggle
                      size="sm"
                      checked={m.isActive}
                      onChange={() => handleToggleMarketActive(m.id)}
                      ariaLabel={`Toggle ${m.countryName} market`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`lg:col-span-4 ${YUME_ADMIN_TOKENS.cardClass}`}>
            <YumeAdminSectionHeader
              title="Launch New Country Market"
              subtitle="Add a new independent country without rebuilding the marketplace."
            />

            <div className="space-y-4">
              <div>
                <label className={YUME_ADMIN_TOKENS.labelClass}>
                  ISO country code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCountryCode}
                  onChange={(e) => setNewCountryCode(e.target.value)}
                  placeholder="e.g. MX, ES, ID"
                  className={YUME_ADMIN_TOKENS.monoInputClass}
                />
              </div>

              <div>
                <label className={YUME_ADMIN_TOKENS.labelClass}>
                  Country name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                  placeholder="e.g. Mexico"
                  className={YUME_ADMIN_TOKENS.inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={YUME_ADMIN_TOKENS.labelClass}>
                    Flag emoji
                  </label>
                  <input
                    type="text"
                    value={newCountryFlag}
                    onChange={(e) => setNewCountryFlag(e.target.value)}
                    placeholder="🇲🇽"
                    className={YUME_ADMIN_TOKENS.inputClass}
                  />
                </div>
                <div>
                  <label className={YUME_ADMIN_TOKENS.labelClass}>
                    Currency code
                  </label>
                  <input
                    type="text"
                    value={newCountryCurrency}
                    onChange={(e) => setNewCountryCurrency(e.target.value)}
                    placeholder="MXN"
                    className={YUME_ADMIN_TOKENS.monoInputClass}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-slate-950 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Include in Central Islamic Occasions (Ramadan &amp; Eid)
                </span>
                <YumeAdminToggle
                  size="sm"
                  checked={newCountryIsMuslim}
                  onChange={setNewCountryIsMuslim}
                  ariaLabel="Include in Central Islamic Occasions"
                />
              </div>

              <button
                type="button"
                onClick={handleAddCountryMarket}
                className={`w-full ${YUME_ADMIN_TOKENS.primaryButtonClass}`}
              >
                <Plus className="w-4 h-4" />
                <span>Provision Independent Market</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: CENTRAL ISLAMIC OCCASIONS */}
      {selectedSection === "islamic_central" && (
        <div className={YUME_ADMIN_TOKENS.cardClass}>
          <YumeAdminSectionHeader
            title="Islamic Religious Occasions (Muslim Markets Only)"
            subtitle="Central platform governance for Ramadan, Eid al-Fitr, and Eid al-Adha across Muslim-majority markets."
          />

          <YumeAdminAdviceBanner label="POLICY:">
            YUME supports Islamic religious occasions only: Ramadan, Eid
            al-Fitr, and Eid al-Adha. Non-Islamic religious occasions are
            strictly prohibited across all markets.
          </YumeAdminAdviceBanner>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {islamicEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-5 rounded-2xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/50 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-stone-900 dark:text-white">
                      {ev.title}
                    </span>
                    <span className="text-xs font-bold text-stone-600 dark:text-slate-300">
                      {ev.titleAr}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
                    {ev.greetingText}
                  </p>
                  <div className="text-[11px] font-sans tabular-nums text-stone-500 dark:text-slate-400 pt-1">
                    Scheduled: {ev.startDate} → {ev.endDate}
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-slate-400">
                    Target Muslim Markets: {ev.countryName} ({ev.marketId})
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    toggleIslamicOccasionForceActive(
                      ev.id,
                      !ev.forceActiveByAdmin
                    );
                    setRefreshTick((t) => t + 1);
                  }}
                  className={
                    ev.forceActiveByAdmin
                      ? `w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${YUME_ADMIN_TOKENS.emeraldActiveClass}`
                      : `w-full ${YUME_ADMIN_TOKENS.primaryButtonClass}`
                  }
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {ev.forceActiveByAdmin
                      ? "Force Active ON (Live in Muslim Markets)"
                      : "Activate Across Muslim Markets"}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: MARKET CULTURAL CALENDAR & POLICY GUARD */}
      {selectedSection === "cultural_calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className={`lg:col-span-7 ${YUME_ADMIN_TOKENS.cardClass}`}>
            <YumeAdminSectionHeader
              title="National, Cultural & Commercial Events by Market"
              subtitle={`Active calendar schedule for ${activeMarket.countryName}.`}
              rightContent={
                <select
                  value={selectedMarketId}
                  onChange={(e) => setSelectedMarketId(e.target.value)}
                  className="rounded-xl border border-stone-200/90 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-stone-900 dark:text-white outline-none cursor-pointer"
                >
                  {markets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.flag} {m.countryName} ({m.id})
                    </option>
                  ))}
                </select>
              }
            />

            <div className="space-y-2.5">
              {allEvents
                .filter(
                  (e) =>
                    e.marketId === activeMarket.id ||
                    (e.marketId === "ALL_MUSLIM_MARKETS" &&
                      activeMarket.isMuslimMarket)
                )
                .map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/40 dark:bg-slate-950/40 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white">
                        {ev.title}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-slate-400 font-sans tabular-nums mt-0.5">
                        {ev.category} · {ev.startDate} to {ev.endDate}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-stone-600 dark:text-slate-300">
                      {ev.controlScope}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className={`lg:col-span-5 ${YUME_ADMIN_TOKENS.cardClass}`}>
            <YumeAdminSectionHeader
              title={`Add Event to ${activeMarket.flag} ${activeMarket.countryName}`}
              subtitle="Policy Guard automatically blocks non-Islamic religious events."
            />

            <div className="space-y-4">
              <div>
                <label className={YUME_ADMIN_TOKENS.labelClass}>
                  Event title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={evtTitle}
                  onChange={(e) => setEvtTitle(e.target.value)}
                  placeholder="e.g. National Artisan Week"
                  className={YUME_ADMIN_TOKENS.inputClass}
                />
              </div>

              <div>
                <label className={YUME_ADMIN_TOKENS.labelClass}>
                  Event category
                </label>
                <select
                  value={evtCategory}
                  onChange={(e) =>
                    setEvtCategory(e.target.value as MarketEventCategory)
                  }
                  className={YUME_ADMIN_TOKENS.selectClass}
                >
                  <option value="national">National Holiday</option>
                  <option value="cultural">
                    Cultural &amp; Heritage Celebration
                  </option>
                  <option value="seasonal">
                    Seasonal / Lifestyle Occasion
                  </option>
                  <option value="commercial">Commercial Shopping Event</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={YUME_ADMIN_TOKENS.labelClass}>
                    Start date
                  </label>
                  <input
                    type="date"
                    value={evtStart}
                    onChange={(e) => setEvtStart(e.target.value)}
                    className={YUME_ADMIN_TOKENS.monoInputClass}
                  />
                </div>
                <div>
                  <label className={YUME_ADMIN_TOKENS.labelClass}>
                    End date
                  </label>
                  <input
                    type="date"
                    value={evtEnd}
                    onChange={(e) => setEvtEnd(e.target.value)}
                    className={YUME_ADMIN_TOKENS.monoInputClass}
                  />
                </div>
              </div>

              <div>
                <label className={YUME_ADMIN_TOKENS.labelClass}>
                  Greeting banner copy
                </label>
                <input
                  type="text"
                  value={evtGreeting}
                  onChange={(e) => setEvtGreeting(e.target.value)}
                  placeholder="Short celebration greeting shown on header..."
                  className={YUME_ADMIN_TOKENS.inputClass}
                />
              </div>

              <button
                type="button"
                onClick={handleCreateMarketEvent}
                className={`w-full ${YUME_ADMIN_TOKENS.primaryButtonClass}`}
              >
                <Plus className="w-4 h-4" />
                <span>Validate &amp; Add Market Event</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: MARKET CULTURAL COLOR PALETTES */}
      {selectedSection === "color_palettes" && (
        <div className={YUME_ADMIN_TOKENS.cardClass}>
          <YumeAdminSectionHeader
            title={`${activeMarket.flag} ${activeMarket.countryName} Cultural Color Palette`}
            subtitle={`Synced directly to the Add Product Color Picker for merchants in ${activeMarket.countryName}.`}
            rightContent={
              <select
                value={selectedMarketId}
                onChange={(e) => setSelectedMarketId(e.target.value)}
                className="rounded-xl border border-stone-200/90 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-stone-900 dark:text-white outline-none cursor-pointer"
              >
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.flag} {m.countryName}
                  </option>
                ))}
              </select>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {activeMarket.culturalColorPalette.map((c) => (
              <div
                key={`${c.name}-${c.hex}`}
                className="p-3.5 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/40 dark:bg-slate-950/40 flex items-center gap-3"
              >
                <div
                  className="w-9 h-9 rounded-lg border border-black/10 shrink-0 shadow-2xs"
                  style={{ backgroundColor: c.hex }}
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-stone-900 dark:text-white truncate">
                    {c.name}
                  </div>
                  <div className="text-[10px] font-sans tabular-nums text-stone-500 dark:text-slate-400">
                    {c.hex}
                  </div>
                  <div className="text-[10px] text-stone-400 dark:text-slate-500 truncate">
                    {c.inspiration}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-stone-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <label className={YUME_ADMIN_TOKENS.labelClass}>
                Cultural shade name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={swatchName}
                onChange={(e) => setSwatchName(e.target.value)}
                placeholder="e.g. Casbah Terracotta"
                className={YUME_ADMIN_TOKENS.inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={YUME_ADMIN_TOKENS.labelClass}>Hex color</label>
              <input
                type="color"
                value={swatchHex}
                onChange={(e) => setSwatchHex(e.target.value)}
                className="h-[42px] w-full rounded-xl border border-stone-200/90 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950 p-1 cursor-pointer"
              />
            </div>
            <div className="sm:col-span-4">
              <label className={YUME_ADMIN_TOKENS.labelClass}>
                Cultural inspiration
              </label>
              <input
                type="text"
                value={swatchInspiration}
                onChange={(e) => setSwatchInspiration(e.target.value)}
                placeholder="e.g. Traditional artisan dye"
                className={YUME_ADMIN_TOKENS.inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={handleAddCulturalColorSwatch}
                className={`w-full h-[42px] ${YUME_ADMIN_TOKENS.primaryButtonClass}`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Swatch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: OFFICIAL PLATFORM-WIDE CAMPAIGNS & MERCHANT NOMINATIONS */}
      {selectedSection === "platform_campaigns" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className={`lg:col-span-7 ${YUME_ADMIN_TOKENS.cardClass}`}>
            <YumeAdminSectionHeader
              title="Official Platform-Wide Campaigns & Merchant Nominations"
              subtitle="Review seasonal promotional campaigns and approve merchant product nominations."
            />

            <div className="space-y-3">
              {allCampaigns
                .filter((c) => c.visibilityLevel === "platform_wide")
                .map((camp) => (
                  <div
                    key={camp.id}
                    className="p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/40 dark:bg-slate-950/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-stone-900 dark:text-white">
                        {camp.title} ({camp.marketId})
                      </span>
                      <span className="text-xs font-sans tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        -{camp.discountPercent}%
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-slate-400">
                      {camp.subtitle}
                    </p>

                    {camp.merchantNominations &&
                      camp.merchantNominations.length > 0 && (
                        <div className="pt-2 border-t border-stone-200/70 dark:border-slate-800 space-y-2">
                          <div className="text-[11px] font-bold text-stone-700 dark:text-slate-300">
                            Merchant Nominations:
                          </div>
                          {camp.merchantNominations.map((nom) => (
                            <div
                              key={nom.storeId}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/70 dark:border-slate-800 text-xs"
                            >
                              <span className="text-stone-700 dark:text-slate-300">
                                {nom.storeName} ({nom.productIds.length}{" "}
                                products) · <strong>{nom.status}</strong>
                              </span>
                              {nom.status !== "approved" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    approvePlatformCampaignNomination({
                                      campaignId: camp.id,
                                      storeId: nom.storeId,
                                      approve: true,
                                      isPlatformAdmin: true,
                                    });
                                    setRefreshTick((t) => t + 1);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 text-[11px] font-bold cursor-pointer"
                                >
                                  Approve Products
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
            </div>
          </div>

          <div className={`lg:col-span-5 ${YUME_ADMIN_TOKENS.cardClass}`}>
            <YumeAdminSectionHeader
              title={`Launch Campaign (${activeMarket.flag} ${activeMarket.countryName})`}
              subtitle="Publish a platform-wide seasonal or heritage showcase campaign."
            />

            <div className="space-y-4">
              <div>
                <label className={YUME_ADMIN_TOKENS.labelClass}>
                  Campaign title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={platCampTitle}
                  onChange={(e) => setPlatCampTitle(e.target.value)}
                  placeholder="e.g. Autumn Artisan Showcase"
                  className={YUME_ADMIN_TOKENS.inputClass}
                />
              </div>

              <div>
                <label className={YUME_ADMIN_TOKENS.labelClass}>
                  Marketplace banner subtitle{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={platCampHeadline}
                  onChange={(e) => setPlatCampHeadline(e.target.value)}
                  placeholder="Curated regional crafts & seasonal selections"
                  className={YUME_ADMIN_TOKENS.inputClass}
                />
              </div>

              <div>
                <label className={YUME_ADMIN_TOKENS.labelClass}>
                  Max discount (%)
                </label>
                <input
                  type="number"
                  value={platCampDiscount}
                  onChange={(e) => setPlatCampDiscount(Number(e.target.value))}
                  placeholder="25"
                  className={YUME_ADMIN_TOKENS.monoInputClass}
                />
              </div>

              <button
                type="button"
                onClick={handlePublishOfficialCampaign}
                className={`w-full ${YUME_ADMIN_TOKENS.primaryButtonClass}`}
              >
                <Megaphone className="w-4 h-4" />
                <span>Publish Official Marketplace Campaign</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: YUME ADS GOVERNANCE (DISABLED BY DEFAULT) */}
      {selectedSection === "yume_ads_governance" && (
        <div className={YUME_ADMIN_TOKENS.cardClass}>
          <YumeAdminSectionHeader
            title="YUME Ads Master Switch & Admin Sandbox Preview"
            subtitle="All public paid advertising is disabled by default. Only Platform Admin can preview, approve, or activate sponsored ads."
            rightContent={
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950">
                <span className="text-xs font-bold text-stone-800 dark:text-slate-200">
                  Public Paid Ads:{" "}
                  {adsConfig.publicPaidAdvertisingEnabled
                    ? "ENABLED"
                    : "DISABLED"}
                </span>
                <YumeAdminToggle
                  size="sm"
                  checked={adsConfig.publicPaidAdvertisingEnabled}
                  onChange={(next) => {
                    updateYumeAdsSystemConfig(
                      { publicPaidAdvertisingEnabled: next },
                      { isPlatformAdmin: true, adminEmail }
                    );
                    setRefreshTick((t) => t + 1);
                  }}
                  ariaLabel="Toggle Public Paid Ads"
                />
              </div>
            }
          />

          <YumeAdminAdviceBanner label="GOVERNANCE:">
            While Public Paid Ads is disabled, merchant-submitted sponsored
            campaigns remain strictly in the Admin Preview Queue below and never
            render on the consumer marketplace.
          </YumeAdminAdviceBanner>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#1e2631] dark:text-sky-400" />
              <span>
                Admin Preview Queue (
                {
                  getVisibleSponsoredAds(activeMarket.id, {
                    adminPreviewMode: true,
                  }).length
                }{" "}
                in {activeMarket.countryName})
              </span>
            </h4>
            {allCampaigns
              .filter((c) => c.visibilityLevel === "sponsored_ad")
              .map((ad) => (
                <div
                  key={ad.id}
                  className="p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/40 dark:bg-slate-950/40 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white">
                      {ad.title} — {ad.storeName} ({ad.marketId})
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                      {ad.subtitle}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      {ad.adApprovalStatus || ad.status}
                    </span>
                    {ad.adApprovalStatus !== "approved" && (
                      <button
                        type="button"
                        onClick={() => {
                          saveCampaignWithValidation(
                            {
                              ...ad,
                              status: "active",
                              adApprovalStatus: "approved",
                            },
                            {
                              actorId: "admin_platform",
                              actorEmail: adminEmail,
                              isPlatformAdmin: true,
                            }
                          );
                          setRefreshTick((t) => t + 1);
                        }}
                        className={YUME_ADMIN_TOKENS.primaryButtonClass}
                      >
                        Approve Ad
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
