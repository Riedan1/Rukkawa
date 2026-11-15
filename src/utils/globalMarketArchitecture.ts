/**
 * YUME MASTER ARCHITECTURE & EXPERIENCE EXPANSION ENGINE
 * ----------------------------------------------------------------------------
 * 1. One Global Platform, Multiple Independent Markets (18 Pre-Configured + Extensible)
 * 2. YUME Global Identity & Local Market Cultural Identity System
 * 3. Strict Religious Event Policy (Islamic Occasions ONLY in Applicable Muslim Markets, Centrally Controlled)
 * 4. Market-Scoped Cultural Color Palettes (Connected to Add Product Color Picker)
 * 5. Contextual Public Identity, Unified Sign-In & 4-Layer Multi-Tenant RBAC Isolation
 * 6. Two-Level Merchant & Platform Campaign System + Disabled-by-Default YUME Ads
 */

import { MerchantStore, Product, GranularTeamPermissions } from "../types";
import { countryCurrencyMapping } from "../currency";

// ============================================================================
// 1. TYPES & INTERFACES
// ============================================================================

export type OrnamentPatternType =
  | "islamic_mosque_arabesque"
  | "maghrebi_zellige"
  | "andalusian_arch"
  | "brazilian_tropical_geometric"
  | "argentine_sol_filigree"
  | "parisian_art_deco"
  | "japanese_sakura_seigaiha"
  | "russian_slavic_filigree"
  | "americana_heritage_stars"
  | "european_classical_lattice"
  | "asian_silk_cloud"
  | "minimal_global";

export interface CulturalColorSwatch {
  id: string;
  name: string;
  nativeName?: string;
  hex: string;
  inspiration: string;
}

export type MarketEventCategory =
  | "religious"
  | "national"
  | "cultural"
  | "seasonal"
  | "commercial";

/**
 * STRICT RELIGIOUS POLICY:
 * YUME supports Islamic religious occasions ONLY ("islamic") in applicable Muslim markets.
 * Non-Islamic religious occasions (Christian, Catholic, Buddhist, Hindu, Jewish, etc.)
 * are strictly forbidden across the entire platform.
 */
export type AllowedReligionType = "islamic" | "none";

export type EventControlScope =
  | "platform_central_only" // Mandatory for all Islamic occasions; merchants cannot disable or edit
  | "merchant_customizable" // Predefined national, cultural, seasonal, commercial calendar events
  | "merchant_store_exclusive"; // Custom event created by a merchant exclusively for their own store

export interface MarketEvent {
  id: string;
  marketId: string; // ISO Code e.g. "DZ", "BR", "FR", "US", "JP", "RU", or "ALL_MUSLIM_MARKETS"
  countryName: string; // e.g. "Algeria", "Brazil", or "All Muslim Markets"
  title: string;
  titleAr?: string;
  titleFr?: string;
  greetingText: string;
  greetingTextAr?: string;
  greetingTextFr?: string;
  category: MarketEventCategory;
  religionType: AllowedReligionType;
  controlScope: EventControlScope;
  storeId?: string; // Present ONLY when controlScope === "merchant_store_exclusive"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  hijriReference?: string; // e.g. "1448 AH" for Ramadan / Eid
  timeZone: string;
  autoActivate: boolean;
  forceActiveByAdmin?: boolean; // Central Platform Admin immediate activation toggle
  ornamentPattern: OrnamentPatternType;
  ornamentOpacity: number; // Strictly subtle: 0.06 to 0.16 so original YUME design & readability remain intact
  accentTintHex: string;
  recommendedDiscountPercent?: number;
}

export interface MarketConfig {
  id: string; // ISO-2 Market Code e.g. "DZ", "MA", "TN", "EG", "BR", "AR", "US", "FR", "JP", "RU"
  countryName: string; // Key matching countryCurrencyMapping e.g. "Algeria"
  nativeName: string;
  flag: string;
  currencyCode: string;
  currencySymbol: string;
  locale: string;
  timeZone: string;
  phonePrefix: string;
  isActive: boolean;
  isMuslimMarket: boolean;
  culturalIdentity: {
    id: string;
    title: string;
    description: string;
    defaultOrnamentPattern: OrnamentPatternType;
    defaultOrnamentOpacity: number;
    heritageNote: string;
  };
  culturalColorPalette: CulturalColorSwatch[];
}

// ============================================================================
// 2. CONTEXTUAL PUBLIC IDENTITY & 4-LAYER MULTI-TENANT RBAC TYPES
// ============================================================================

export type BaseAccountCategory =
  | "guest"
  | "personal_buyer"
  | "merchant_owner"
  | "platform_admin";

export type StoreRoleTier = "owner" | "store_admin" | "store_employee";

export interface StoreMembershipRecord {
  id: string;
  storeId: string;
  storeName: string;
  marketId: string;
  userId: string;
  userEmail: string;
  userName: string;
  roleTier: StoreRoleTier;
  roleLabel: string;
  /** True only for the actual store owner; Store Administrators can never delete or transfer ownership */
  isImmutableOwner: boolean;
  permissions: Partial<GranularTeamPermissions>;
  status: "active" | "invited" | "suspended";
}

export interface YumeAccountContext {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  baseAccountType: BaseAccountCategory;
  primaryMarketId: string;
  ownedStoreIds: string[];
  primaryOwnedStoreName?: string;
  storeMemberships: StoreMembershipRecord[];
}

export interface ContextualPublicPersona {
  actorUserId: string;
  actorName: string;
  actorEmail: string;
  targetStoreId?: string;
  /**
   * Contextual Public Identity Rule:
   * - Merchant Owner -> Retains "Merchant" identity when browsing, purchasing, or commenting on other stores,
   *   with ZERO administrative permissions outside their own store.
   * - Store Administrator / Store Employee -> Appears publicly as "Buyer" on external stores and marketplace,
   *   while retaining assigned administrative role strictly inside their authorized store.
   * - Personal Buyer -> Always appears as "Buyer".
   * - Guest -> Appears as "Guest".
   */
  publicIdentityBadge: "Merchant" | "Buyer" | "Guest";
  publicAttributionLabel: string;
  publicOwnedStoreName?: string;
  isVerifiedMerchantOwner: boolean;
  hasAdministrativeAccessToTargetStore: boolean;
  authorizedRoleInTargetStore: StoreRoleTier | null;
  canDeleteOrTransferTargetStore: boolean;
}

export interface AuthorizationDecision {
  allowed: boolean;
  statusCode: 200 | 401 | 403;
  reason: string;
  resolvedRoleTier: StoreRoleTier | "platform_admin" | null;
}

// ============================================================================
// 3. TWO-LEVEL CAMPAIGN & DISABLED-BY-DEFAULT YUME ADS TYPES
// ============================================================================

export type CampaignVisibilityLevel =
  | "store_only" // Level 1: Appears ONLY inside the merchant's own storefront (hero, strip, product badges)
  | "platform_wide" // Level 2: Official YUME campaign in Marketplace & participating storefronts (Admin controlled)
  | "sponsored_ad"; // Level 3: YUME Ads system (Disabled by default; requires Platform Admin activation)

export type CampaignCreationMode =
  | "yume_template" // Option A: YUME Ready-Made Templates
  | "custom_scratch" // Option B: Create From Scratch
  | "hybrid"; // Combined template + merchant custom creative elements

export interface CampaignNomination {
  storeId: string;
  storeName: string;
  marketId: string;
  productIds: string[];
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

export interface CampaignRecord {
  id: string;
  marketId: string; // Strictly scoped to market e.g. "DZ", "BR", "FR"
  storeId: string | null; // Null only for official platform_wide campaigns created by Platform Admin
  storeName?: string;
  ownerUserId: string;
  title: string;
  subtitle: string;
  badgeText: string;
  promoCode?: string;
  discountPercent: number;
  visibilityLevel: CampaignVisibilityLevel;
  creationMode: CampaignCreationMode;
  templateId?: string;
  linkedEventId?: string;
  customEventTitle?: string;
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "scheduled" | "paused" | "expired";
  /** For Level 3 sponsored_ad: must be approved by Platform Admin AND global paid ads must be enabled */
  adApprovalStatus?: "not_requested" | "pending_admin_review" | "approved" | "rejected";
  bannerImageUrl?: string;
  storeLogoUrl?: string;
  accentColorHex: string;
  ornamentPattern?: OrnamentPatternType;
  participatingProductIds: string[];
  /** For Level 2 platform_wide campaigns: merchants nominate eligible products subject to Admin approval */
  merchantNominations?: CampaignNomination[];
  createdAt: string;
  updatedAt: string;
}

export interface YumeReadyTemplate {
  id: string;
  name: string;
  category: Exclude<MarketEventCategory, "religious"> | "islamic_platform";
  description: string;
  defaultHeadline: string;
  defaultSubtitle: string;
  defaultBadge: string;
  defaultDiscountPercent: number;
  accentColorHex: string;
  ornamentPattern: OrnamentPatternType;
  previewImageUrl: string;
}

// ============================================================================
// 4. PRE-CONFIGURED 18 GLOBAL MARKETS & CULTURAL COLOR PALETTES
// ============================================================================

export const INITIAL_GLOBAL_MARKETS: MarketConfig[] = [
  {
    id: "DZ",
    countryName: "Algeria",
    nativeName: "الجزائر (Dzayer)",
    flag: "🇩🇿",
    currencyCode: "DZD",
    currencySymbol: "DA",
    locale: "ar-DZ",
    timeZone: "Africa/Algiers",
    phonePrefix: "+213",
    isActive: true,
    isMuslimMarket: true,
    culturalIdentity: {
      id: "cultural_dz",
      title: "Algerian Cultural Identity",
      description: "Inspired by Casbah architectural arches, Maghrebi Zellige geometry, and Sahara heritage.",
      defaultOrnamentPattern: "maghrebi_zellige",
      defaultOrnamentOpacity: 0.11,
      heritageNote: "Flagship launch market • Maghrebi & Mediterranean craftsmanship",
    },
    culturalColorPalette: [
      { id: "dz_casbah_white", name: "Casbah White", nativeName: "أبيض القصبة", hex: "#F8F6F0", inspiration: "Algiers Casbah limestone walls" },
      { id: "dz_atlas_emerald", name: "Atlas Cedar Green", nativeName: "أخضر الأطلس", hex: "#1B5E3A", inspiration: "Chréa & Djurdjura cedar forests" },
      { id: "dz_sahara_terracotta", name: "Sahara Terracotta", nativeName: "تراكوتا الصحراء", hex: "#C85A32", inspiration: "Tassili & Taghit dunes at dusk" },
      { id: "dz_touareg_indigo", name: "Touareg Indigo", nativeName: "نيلي توارقي", hex: "#1E3A5F", inspiration: "Hoggar traditional dyed tagelmust" },
      { id: "dz_zellige_turquoise", name: "Zellige Turquoise", nativeName: "فيروزي الزليج", hex: "#0D9488", inspiration: "Tlemcen & Algiers ceramic mosaic" },
      { id: "dz_constantine_gold", name: "Constantine Gold", nativeName: "ذهبي قسنطيني", hex: "#D4AF37", inspiration: "Traditional Fetla & Majboud embroidery" },
      { id: "dz_elkala_coral", name: "El Kala Coral", nativeName: "مرجاني القالة", hex: "#E14D43", inspiration: "Mediterranean red coral jewelry" },
      { id: "dz_med_cobalt", name: "Mediterranean Cobalt", nativeName: "أزرق متوسطي", hex: "#1D4ED8", inspiration: "Oran & Tipaza coastal waters" },
    ],
  },
  {
    id: "MA",
    countryName: "Morocco",
    nativeName: "المغرب (Al-Maghrib)",
    flag: "🇲🇦",
    currencyCode: "MAD",
    currencySymbol: "د.م.",
    locale: "ar-MA",
    timeZone: "Africa/Casablanca",
    phonePrefix: "+212",
    isActive: true,
    isMuslimMarket: true,
    culturalIdentity: {
      id: "cultural_ma",
      title: "Moroccan Cultural Identity",
      description: "Andalusian-Moorish geometric latticework and artisanal medina motifs.",
      defaultOrnamentPattern: "maghrebi_zellige",
      defaultOrnamentOpacity: 0.11,
      heritageNote: "Fes zellige & Marrakech artisanal heritage",
    },
    culturalColorPalette: [
      { id: "ma_majorelle_blue", name: "Majorelle Cobalt", hex: "#2243B6", inspiration: "Marrakech botanical cobalt" },
      { id: "ma_marrakech_ochre", name: "Marrakech Ochre", hex: "#C86446", inspiration: "Red City rammed earth walls" },
      { id: "ma_fes_emerald", name: "Fes Zellige Green", hex: "#166534", inspiration: "Glazed Fes pottery" },
      { id: "ma_saffron_gold", name: "Taliouine Saffron", hex: "#D97706", inspiration: "Atlas saffron threads" },
      { id: "ma_chefchaouen_sky", name: "Chefchaouen Sky", hex: "#60A5FA", inspiration: "Blue Pearl medina wash" },
      { id: "ma_tadelakt_ivory", name: "Tadelakt Ivory", hex: "#FAF5EE", inspiration: "Polished lime plaster" },
      { id: "ma_argan_amber", name: "Argan Amber", hex: "#92400E", inspiration: "Souss Valley roasted argan" },
      { id: "ma_atlas_plum", name: "Atlas Fig", hex: "#581C87", inspiration: "Handwoven Berber carpets" },
    ],
  },
  {
    id: "TN",
    countryName: "Tunisia",
    nativeName: "تونس (Tūnis)",
    flag: "🇹🇳",
    currencyCode: "TND",
    currencySymbol: "د.ت",
    locale: "ar-TN",
    timeZone: "Africa/Tunis",
    phonePrefix: "+216",
    isActive: true,
    isMuslimMarket: true,
    culturalIdentity: {
      id: "cultural_tn",
      title: "Tunisian Cultural Identity",
      description: "Sidi Bou Said arches, Kairouan geometric motifs, and Mediterranean lattice.",
      defaultOrnamentPattern: "andalusian_arch",
      defaultOrnamentOpacity: 0.10,
      heritageNote: "Carthaginian & Mediterranean artisanal tradition",
    },
    culturalColorPalette: [
      { id: "tn_sidi_blue", name: "Sidi Bou Said Blue", hex: "#0284C7", inspiration: "Iconic coastal doors & shutters" },
      { id: "tn_jasmine_white", name: "Jasmine White", hex: "#F8FAFC", inspiration: "Whitewashed medina facades" },
      { id: "tn_carthage_red", name: "Carthage Crimson", hex: "#DC2626", inspiration: "Traditional Chechia wool felt" },
      { id: "tn_nabeul_citron", name: "Nabeul Citron", hex: "#EAB308", inspiration: "Cap Bon ceramic glazes" },
      { id: "tn_djerba_sand", name: "Djerba Sand", hex: "#E7DFD3", inspiration: "Southern island dunes" },
      { id: "tn_olive_grove", name: "Sfax Olive", hex: "#3F6212", inspiration: "Ancient Mediterranean olive groves" },
      { id: "tn_tozeur_brick", name: "Tozeur Ochre Brick", hex: "#B45309", inspiration: "Geometric desert brickwork" },
      { id: "tn_bizerte_navy", name: "Bizerte Deep Navy", hex: "#1E293B", inspiration: "Northern harbor twilight" },
    ],
  },
  {
    id: "EG",
    countryName: "Egypt",
    nativeName: "مصر (Miṣr)",
    flag: "🇪🇬",
    currencyCode: "EGP",
    currencySymbol: "ج.م",
    locale: "ar-EG",
    timeZone: "Africa/Cairo",
    phonePrefix: "+20",
    isActive: true,
    isMuslimMarket: true,
    culturalIdentity: {
      id: "cultural_eg",
      title: "Egyptian Cultural Identity",
      description: "Fatimid Cairo mashrabiya geometry and Nile heritage filigree.",
      defaultOrnamentPattern: "islamic_mosque_arabesque",
      defaultOrnamentOpacity: 0.11,
      heritageNote: "Khan el-Khalili craftsmanship & Nile textiles",
    },
    culturalColorPalette: [
      { id: "eg_nile_lapis", name: "Nile Lapis Blue", hex: "#1D4ED8", inspiration: "Ancient lapis & Nile waters" },
      { id: "eg_giza_cotton", name: "Egyptian Cotton Ivory", hex: "#FAF8F5", inspiration: "Fine long-staple combed cotton" },
      { id: "eg_cairo_brass", name: "Khan el-Khalili Brass", hex: "#CA8A04", inspiration: "Hand-pierced brass lanterns" },
      { id: "eg_aswan_terracotta", name: "Aswan Nubian Clay", hex: "#C2410C", inspiration: "Warm southern Nile sandstone" },
      { id: "eg_turquoise_faience", name: "Sinai Turquoise", hex: "#0D9488", inspiration: "Glazed ceramic faience" },
      { id: "eg_papyrus_ochre", name: "Papyrus Warm Sand", hex: "#D6C7B2", inspiration: "Natural woven papyrus" },
      { id: "eg_alexandria_navy", name: "Alexandria Harbor Navy", hex: "#0F172A", inspiration: "Mediterranean evening sky" },
      { id: "eg_hibiscus_ruby", name: "Karkadeh Ruby", hex: "#9F1239", inspiration: "Aswan crimson hibiscus" },
    ],
  },
  {
    id: "SA",
    countryName: "Saudi Arabia",
    nativeName: "المملكة العربية السعودية",
    flag: "🇸🇦",
    currencyCode: "SAR",
    currencySymbol: "ر.س",
    locale: "ar-SA",
    timeZone: "Asia/Riyadh",
    phonePrefix: "+966",
    isActive: true,
    isMuslimMarket: true,
    culturalIdentity: {
      id: "cultural_sa",
      title: "Saudi Cultural Identity",
      description: "Najdi Sadu geometric weaving, Hejazi Roshan lattice, and Arabian oasis palms.",
      defaultOrnamentPattern: "islamic_mosque_arabesque",
      defaultOrnamentOpacity: 0.11,
      heritageNote: "Sadu geometric weaving & Al-Ula sandstone heritage",
    },
    culturalColorPalette: [
      { id: "sa_palm_emerald", name: "Oasis Palm Green", hex: "#15803D", inspiration: "Al-Ahsa & Riyadh date palms" },
      { id: "sa_diriyah_mud", name: "Diriyah Adobe Sand", hex: "#D6B89A", inspiration: "At-Turaif mud-brick architecture" },
      { id: "sa_sadu_crimson", name: "Sadu Bedouin Crimson", hex: "#991B1B", inspiration: "Traditional Al-Sadu wool textiles" },
      { id: "sa_alula_terracotta", name: "AlUla Canyon Ochre", hex: "#B45309", inspiration: "Hegra sandstone monoliths" },
      { id: "sa_redsea_teal", name: "Red Sea Coral Teal", hex: "#0D9488", inspiration: "Jeddah coastal reef waters" },
      { id: "sa_taif_rose", name: "Taif Damask Rose", hex: "#E11D48", inspiration: "Highland Taif rose harvest" },
      { id: "sa_bisht_gold", name: "Royal Bisht Gold", hex: "#D4AF37", inspiration: "Hasawi golden Zari thread" },
      { id: "sa_desert_night", name: "Rub' al Khali Onyx", hex: "#18181B", inspiration: "Starlit desert night sky" },
    ],
  },
  {
    id: "AE",
    countryName: "UAE",
    nativeName: "الإمارات العربية المتحدة",
    flag: "🇦🇪",
    currencyCode: "AED",
    currencySymbol: "د.إ",
    locale: "ar-AE",
    timeZone: "Asia/Dubai",
    phonePrefix: "+971",
    isActive: true,
    isMuslimMarket: true,
    culturalIdentity: {
      id: "cultural_ae",
      title: "Emirati Cultural Identity",
      description: "Contemporary Gulf mashrabiya lattice and pearl-diving maritime heritage.",
      defaultOrnamentPattern: "islamic_mosque_arabesque",
      defaultOrnamentOpacity: 0.10,
      heritageNote: "Al-Sadu & Gulf Pearl luxury aesthetic",
    },
    culturalColorPalette: [
      { id: "ae_gulf_pearl", name: "Arabian Pearl Ivory", hex: "#FAF8F5", inspiration: "Natural Gulf oyster pearls" },
      { id: "ae_dubai_gold", name: "Deira Souk Gold", hex: "#CA8A04", inspiration: "Fine 24k gold craftsmanship" },
      { id: "ae_liwa_dune", name: "Liwa Oasis Terracotta", hex: "#C2410C", inspiration: "Empty Quarter crescent dunes" },
      { id: "ae_khor_turquoise", name: "Khor Fakkan Lagoon", hex: "#0891B2", inspiration: "Gulf of Oman coastal waters" },
      { id: "ae_oud_umber", name: "Cambodi Oud Umber", hex: "#451A03", inspiration: "Aged aromatic agarwood" },
      { id: "ae_ghaf_green", name: "National Ghaf Green", hex: "#166534", inspiration: "Resilient desert Ghaf tree" },
      { id: "ae_falcon_slate", name: "Shaheen Falcon Slate", hex: "#334155", inspiration: "Emirati falconry heritage" },
      { id: "ae_barjeel_sand", name: "Al Fahidi Coral Stone", hex: "#E5D5C5", inspiration: "Historic wind-tower gypsum" },
    ],
  },
  {
    id: "TR",
    countryName: "Turkey",
    nativeName: "Türkiye",
    flag: "🇹🇷",
    currencyCode: "TRY",
    currencySymbol: "₺",
    locale: "tr-TR",
    timeZone: "Europe/Istanbul",
    phonePrefix: "+90",
    isActive: true,
    isMuslimMarket: true,
    culturalIdentity: {
      id: "cultural_tr",
      title: "Turkish Cultural Identity",
      description: "Iznik tulip motifs, Anatolian geometric kilim weave, and Bosphorus arches.",
      defaultOrnamentPattern: "islamic_mosque_arabesque",
      defaultOrnamentOpacity: 0.10,
      heritageNote: "Iznik ceramics & Grand Bazaar textile craft",
    },
    culturalColorPalette: [
      { id: "tr_iznik_turquoise", name: "Iznik Turquoise", hex: "#06B6D4", inspiration: "Classical Ottoman ceramic glaze" },
      { id: "tr_tulip_crimson", name: "Anatolian Tulip Red", hex: "#DC2626", inspiration: "Traditional crimson tulip motif" },
      { id: "tr_bosphorus_cobalt", name: "Bosphorus Deep Blue", hex: "#1E3A8A", inspiration: "Istanbul strait waters" },
      { id: "tr_cappadocia_clay", name: "Cappadocia Ochre", hex: "#D97706", inspiration: "Volcanic tuff valleys" },
      { id: "tr_bursa_silk", name: "Bursa Raw Silk", hex: "#F5F5F0", inspiration: "Historic silk road ateliers" },
      { id: "tr_aegean_olive", name: "Ayvalık Olive", hex: "#4D7C0F", inspiration: "Aegean coastal groves" },
      { id: "tr_topkapi_gold", name: "Topkapı Gilded Bronze", hex: "#B45309", inspiration: "Imperial filigree metalwork" },
      { id: "tr_galata_basalt", name: "Galata Stone Slate", hex: "#475569", inspiration: "Historic Genoese masonry" },
    ],
  },
  {
    id: "BR",
    countryName: "Brazil",
    nativeName: "Brasil",
    flag: "🇧🇷",
    currencyCode: "BRL",
    currencySymbol: "R$",
    locale: "pt-BR",
    timeZone: "America/Sao_Paulo",
    phonePrefix: "+55",
    isActive: true,
    isMuslimMarket: false,
    culturalIdentity: {
      id: "cultural_br",
      title: "Brazilian Cultural Identity",
      description: "Copacabana Portuguese wave mosaics, tropical botanical geometry, and modernist lines.",
      defaultOrnamentPattern: "brazilian_tropical_geometric",
      defaultOrnamentOpacity: 0.10,
      heritageNote: "Roberto Burle Marx waves & tropical artisanal craft",
    },
    culturalColorPalette: [
      { id: "br_amazon_emerald", name: "Amazonia Emerald", nativeName: "Verde Amazônia", hex: "#15803D", inspiration: "Lush tropical rainforest canopy" },
      { id: "br_ipanema_sun", name: "Ipanema Sun", nativeName: "Amarelo Sol", hex: "#EAB308", inspiration: "Golden Atlantic sunset" },
      { id: "br_bahia_cobalt", name: "Bahia Atlantic Blue", nativeName: "Azul Bahia", hex: "#1D4ED8", inspiration: "Salvador Pelourinho colonial facades" },
      { id: "br_cerrado_terracotta", name: "Cerrado Terracotta", nativeName: "Terracota Cerrado", hex: "#C2410C", inspiration: "Brazilian highland clay" },
      { id: "br_copacabana_sand", name: "Copacabana Calçadão", nativeName: "Areia de Copacabana", hex: "#F5F5DC", inspiration: "Iconic Portuguese stone boardwalk" },
      { id: "br_acai_berry", name: "Açaí Deep Violet", nativeName: "Roxo Açaí", hex: "#4C1D95", inspiration: "Amazonian palm berry" },
      { id: "br_tropical_coral", name: "Guarana Coral", nativeName: "Coral Tropical", hex: "#F43F5E", inspiration: "Vibrant Atlantic flora" },
      { id: "br_noronha_teal", name: "Noronha Lagoon Teal", nativeName: "Turquesa Noronha", hex: "#0D9488", inspiration: "Fernando de Noronha waters" },
    ],
  },
  {
    id: "AR",
    countryName: "Argentina",
    nativeName: "Argentina",
    flag: "🇦🇷",
    currencyCode: "ARS",
    currencySymbol: "ARS$",
    locale: "es-AR",
    timeZone: "America/Argentina/Buenos_Aires",
    phonePrefix: "+54",
    isActive: true,
    isMuslimMarket: false,
    culturalIdentity: {
      id: "cultural_ar",
      title: "Argentine Cultural Identity",
      description: "Porteño fileteado curves, Pampas leatherwork geometry, and Andean textile motifs.",
      defaultOrnamentPattern: "argentine_sol_filigree",
      defaultOrnamentOpacity: 0.10,
      heritageNote: "Buenos Aires Fileteado & Patagonian heritage",
    },
    culturalColorPalette: [
      { id: "ar_celeste_sky", name: "Albiceleste Sky Blue", hex: "#38BDF8", inspiration: "Argentine flag & Patagonian glaciers" },
      { id: "ar_pampa_saddle", name: "Pampas Saddle Leather", hex: "#78350F", inspiration: "Artisanal talabartería leather" },
      { id: "ar_mendoza_malbec", name: "Mendoza Malbec", hex: "#7F1D1D", inspiration: "Andean Foothills vineyards" },
      { id: "ar_salta_terracotta", name: "Humahuaca Ochre", hex: "#C2410C", inspiration: "Hill of Seven Colors strata" },
      { id: "ar_sol_gold", name: "Sol de Mayo Gold", hex: "#CA8A04", inspiration: "Historic golden sun emblem" },
      { id: "ar_bariloche_pine", name: "Nahuel Huapi Pine", hex: "#14532D", inspiration: "Patagonian lake forests" },
      { id: "ar_recoleta_ivory", name: "Recoleta Limestone", hex: "#F8FAFC", inspiration: "Buenos Aires Beaux-Arts facades" },
      { id: "ar_ushuaia_slate", name: "Tierra del Fuego Slate", hex: "#334155", inspiration: "Southernmost Andean peaks" },
    ],
  },
  {
    id: "US",
    countryName: "United States",
    nativeName: "United States",
    flag: "🇺🇸",
    currencyCode: "USD",
    currencySymbol: "$",
    locale: "en-US",
    timeZone: "America/New_York",
    phonePrefix: "+1",
    isActive: true,
    isMuslimMarket: false,
    culturalIdentity: {
      id: "cultural_us",
      title: "American Cultural Identity",
      description: "Clean modernist geometric lines, heritage stars, and coastal-to-southwest tonal balance.",
      defaultOrnamentPattern: "americana_heritage_stars",
      defaultOrnamentOpacity: 0.09,
      heritageNote: "Contemporary American retail & heritage craftsmanship",
    },
    culturalColorPalette: [
      { id: "us_liberty_navy", name: "Liberty Heritage Navy", hex: "#0F172A", inspiration: "Classic American tailored navy" },
      { id: "us_canyon_crimson", name: "Sedona Crimson", hex: "#B91C1C", inspiration: "Red rock Southwest canyons" },
      { id: "us_pacific_teal", name: "Big Sur Pacific Teal", hex: "#0F766E", inspiration: "California coastal waters" },
      { id: "us_sonoran_ochre", name: "Santa Fe Ochre", hex: "#D97706", inspiration: "Desert adobe & golden wheat" },
      { id: "us_redwood_umber", name: "Sequoia Umber", hex: "#78350F", inspiration: "Northern California redwoods" },
      { id: "us_hamptons_linen", name: "Nantucket Linen", hex: "#F5F5F4", inspiration: "Coastal New England canvas" },
      { id: "us_denim_indigo", name: "Selvedge Denim Blue", hex: "#1E40AF", inspiration: "Heritage workwear indigo" },
      { id: "us_vermont_pine", name: "Adirondack Evergreen", hex: "#166534", inspiration: "New England mountain forests" },
    ],
  },
  {
    id: "FR",
    countryName: "France",
    nativeName: "France",
    flag: "🇫🇷",
    currencyCode: "EUR",
    currencySymbol: "€",
    locale: "fr-FR",
    timeZone: "Europe/Paris",
    phonePrefix: "+33",
    isActive: true,
    isMuslimMarket: false,
    culturalIdentity: {
      id: "cultural_fr",
      title: "French Cultural Identity",
      description: "Haussmannian wrought-iron scrollwork, Art Deco symmetry, and Provençal botanical elegance.",
      defaultOrnamentPattern: "parisian_art_deco",
      defaultOrnamentOpacity: 0.10,
      heritageNote: "Parisian haute atelier & Côte d'Azur Riviera tones",
    },
    culturalColorPalette: [
      { id: "fr_bleu_de_france", name: "Bleu de France", nativeName: "Bleu de France", hex: "#1E40AF", inspiration: "Historic French royal cobalt" },
      { id: "fr_provence_lavender", name: "Provence Lavender", nativeName: "Lavande de Provence", hex: "#8B5CF6", inspiration: "Valensole summer fields" },
      { id: "fr_bordeaux_wine", name: "Bordeaux Burgundy", nativeName: "Rouge Bordeaux", hex: "#7F1D1D", inspiration: "Gironde grand cru vintage" },
      { id: "fr_parisian_zinc", name: "Haussmann Zinc Gray", nativeName: "Gris Toit de Paris", hex: "#64748B", inspiration: "Iconic Parisian mansard roofs" },
      { id: "fr_chateau_cream", name: "Tuffeau Stone Cream", nativeName: "Pierre de Loire", hex: "#FAF6F0", inspiration: "Loire Valley limestone châteaux" },
      { id: "fr_riviera_azure", name: "Côte d'Azur Azure", nativeName: "Azur Riviera", hex: "#0284C7", inspiration: "Nice & Cannes Mediterranean coast" },
      { id: "fr_loire_sage", name: "Giverny Willow Sage", nativeName: "Vert Saule", hex: "#4D7C5D", inspiration: "Impressionist garden foliage" },
      { id: "fr_champagne_gold", name: "Épernay Champagne Gold", nativeName: "Or Champagne", hex: "#D6B36A", inspiration: "Sparkling Reims cellar reserve" },
    ],
  },
  {
    id: "DE",
    countryName: "Germany",
    nativeName: "Deutschland",
    flag: "🇩🇪",
    currencyCode: "EUR",
    currencySymbol: "€",
    locale: "de-DE",
    timeZone: "Europe/Berlin",
    phonePrefix: "+49",
    isActive: true,
    isMuslimMarket: false,
    culturalIdentity: {
      id: "cultural_de",
      title: "German Cultural Identity",
      description: "Bauhaus architectural precision, Alpine timber lines, and clean geometric balance.",
      defaultOrnamentPattern: "european_classical_lattice",
      defaultOrnamentOpacity: 0.09,
      heritageNote: "Bauhaus industrial clarity & precision craftsmanship",
    },
    culturalColorPalette: [
      { id: "de_bauhaus_cobalt", name: "Bauhaus Ultramarine", hex: "#1D4ED8", inspiration: "Weimar modernist primary blue" },
      { id: "de_schwarzwald_pine", name: "Black Forest Fir", hex: "#14532D", inspiration: "Baden-Württemberg evergreen canopy" },
      { id: "de_weimar_ochre", name: "Dessau Warm Ochre", hex: "#D97706", inspiration: "Classic Bauhaus primary yellow-gold" },
      { id: "de_bavarian_sky", name: "Alpine Glacier Blue", hex: "#0284C7", inspiration: "Zugspitze clear mountain sky" },
      { id: "de_meissen_porcelain", name: "Meissen Porcelain White", hex: "#F8FAFC", inspiration: "Saxony fine white ceramic" },
      { id: "de_rhine_slate", name: "Rheinland Slate", hex: "#334155", inspiration: "Moselle valley slate cliffs" },
      { id: "de_heidelberg_brick", name: "Heidelberg Sandstone", hex: "#9A3412", inspiration: "Neckar valley red sandstone" },
      { id: "de_berlin_graphite", name: "Mitte Industrial Graphite", hex: "#18181B", inspiration: "Contemporary Berlin studio iron" },
    ],
  },
  {
    id: "GB",
    countryName: "United Kingdom",
    nativeName: "United Kingdom",
    flag: "🇬🇧",
    currencyCode: "GBP",
    currencySymbol: "£",
    locale: "en-GB",
    timeZone: "Europe/London",
    phonePrefix: "+44",
    isActive: true,
    isMuslimMarket: false,
    culturalIdentity: {
      id: "cultural_gb",
      title: "British Cultural Identity",
      description: "Georgian architectural symmetry, heritage tartan geometry, and botanical conservatory lines.",
      defaultOrnamentPattern: "european_classical_lattice",
      defaultOrnamentOpacity: 0.09,
      heritageNote: "Savile Row tailoring & Cotswolds heritage",
    },
    culturalColorPalette: [
      { id: "gb_racing_green", name: "British Racing Green", hex: "#14532D", inspiration: "Classic heritage motorsport green" },
      { id: "gb_savile_navy", name: "Savile Row Navy", hex: "#0F172A", inspiration: "Bespoke Mayfair worsted wool" },
      { id: "gb_cotswold_stone", name: "Cotswold Honey Stone", hex: "#E5D3B3", inspiration: "Jurassic limestone villages" },
      { id: "gb_royal_claret", name: "Windsor Claret", hex: "#881337", inspiration: "Regency velvet & heritage crimson" },
      { id: "gb_heather_moor", name: "Highland Heather", hex: "#6B21A8", inspiration: "Scottish late-summer moorlands" },
      { id: "gb_wedgwood_blue", name: "Jasperware Blue", hex: "#60A5FA", inspiration: "Staffordshire stoneware cameo" },
      { id: "gb_thames_mist", name: "Thames Pewter Gray", hex: "#64748B", inspiration: "London Portland stone & mist" },
      { id: "gb_oxford_ochre", name: "Bodleian Ochre", hex: "#B45309", inspiration: "Historic collegiate libraries" },
    ],
  },
  {
    id: "CA",
    countryName: "Canada",
    nativeName: "Canada",
    flag: "🇨🇦",
    currencyCode: "CAD",
    currencySymbol: "C$",
    locale: "en-CA",
    timeZone: "America/Toronto",
    phonePrefix: "+1",
    isActive: true,
    isMuslimMarket: false,
    culturalIdentity: {
      id: "cultural_ca",
      title: "Canadian Cultural Identity",
      description: "Maple leaf symmetry, boreal timber geometry, and northern aurora accents.",
      defaultOrnamentPattern: "minimal_global",
      defaultOrnamentOpacity: 0.09,
      heritageNote: "Pacific Northwest & Laurentian natural craft",
    },
    culturalColorPalette: [
      { id: "ca_maple_crimson", name: "Laurentian Maple Red", hex: "#DC2626", inspiration: "Autumn sugar maple canopy" },
      { id: "ca_louise_turquoise", name: "Lake Louise Glacial Teal", hex: "#0D9488", inspiration: "Banff emerald glacial waters" },
      { id: "ca_boreal_spruce", name: "Boreal Spruce Green", hex: "#166534", inspiration: "Northern evergreen shield" },
      { id: "ca_hudson_cream", name: "Hudson Wool Cream", hex: "#F5F5F0", inspiration: "Heritage point blanket wool" },
      { id: "ca_fundy_terracotta", name: "Bay of Fundy Sandstone", hex: "#B45309", inspiration: "Maritime coastal cliffs" },
      { id: "ca_PACIFIC_cedar", name: "Haida Red Cedar", hex: "#78350F", inspiration: "West Coast carved timber" },
      { id: "ca_niagara_navy", name: "St. Lawrence Navy", hex: "#1E3A8A", inspiration: "Deep Atlantic maritime blue" },
      { id: "ca_yukon_gold", name: "Klondike Warm Gold", hex: "#CA8A04", inspiration: "Northern summer solstice" },
    ],
  },
  {
    id: "JP",
    countryName: "Japan",
    nativeName: "日本 (Nihon)",
    flag: "🇯🇵",
    currencyCode: "JPY",
    currencySymbol: "¥",
    locale: "ja-JP",
    timeZone: "Asia/Tokyo",
    phonePrefix: "+81",
    isActive: true,
    isMuslimMarket: false,
    culturalIdentity: {
      id: "cultural_jp",
      title: "Japanese Cultural Identity",
      description: "Seigaiha ocean waves, Asanoha hemp-leaf lattice, and delicate Sakura linework.",
      defaultOrnamentPattern: "japanese_sakura_seigaiha",
      defaultOrnamentOpacity: 0.11,
      heritageNote: "Kyoto Nishijin weave & Wabi-Sabi artisanal minimalism",
    },
    culturalColorPalette: [
      { id: "jp_sakura_blush", name: "Sakura Petal Blush", nativeName: "桜色 (Sakura-iro)", hex: "#FBCFE8", inspiration: "Spring cherry blossom petals" },
      { id: "jp_ai_indigo", name: "Aizome Deep Indigo", nativeName: "藍色 (Ai-iro)", hex: "#1E3A8A", inspiration: "Tokushima fermented natural indigo" },
      { id: "jp_uji_matcha", name: "Uji Matcha Jade", nativeName: "抹茶色 (Matcha-iro)", hex: "#4D7C0F", inspiration: "Kyoto ceremonial stone-ground tea" },
      { id: "jp_torii_vermilion", name: "Fushimi Shu Vermilion", nativeName: "朱色 (Shu-iro)", hex: "#DC2626", inspiration: "Traditional shrine lacquerware" },
      { id: "jp_sumi_charcoal", name: "Sumi Calligraphy Ink", nativeName: "墨色 (Sumi-iro)", hex: "#1C1917", inspiration: "Nara pine-soot inkstone" },
      { id: "jp_kintsugi_gold", name: "Kanazawa Gold Leaf", nativeName: "金色 (Kin-iro)", hex: "#CA8A04", inspiration: "Kintsugi lacquer joinery" },
      { id: "jp_washi_ivory", name: "Echizen Washi Paper", nativeName: "生成り (Kinari)", hex: "#FAF8F5", inspiration: "Handmade mulberry fiber paper" },
      { id: "jp_fuji_wisteria", name: "Fuji Wisteria Violet", nativeName: "藤色 (Fuji-iro)", hex: "#7C3AED", inspiration: "Ashikaga cascading wisteria" },
    ],
  },
  {
    id: "RU",
    countryName: "Russia",
    nativeName: "Россия (Rossiya)",
    flag: "🇷🇺",
    currencyCode: "RUB",
    currencySymbol: "₽",
    locale: "ru-RU",
    timeZone: "Europe/Moscow",
    phonePrefix: "+7",
    isActive: true,
    isMuslimMarket: false,
    culturalIdentity: {
      id: "cultural_ru",
      title: "Russian Cultural Identity",
      description: "Gzhel cobalt floral scrollwork, Khokhloma golden leaf filigree, and classical Neva geometry.",
      defaultOrnamentPattern: "russian_slavic_filigree",
      defaultOrnamentOpacity: 0.10,
      heritageNote: "Gzhel porcelain & Saint Petersburg neoclassical lattice",
    },
    culturalColorPalette: [
      { id: "ru_gzhel_cobalt", name: "Gzhel Porcelain Cobalt", nativeName: "Кобальт Гжель", hex: "#1D4ED8", inspiration: "Traditional blue-and-white ceramics" },
      { id: "ru_hermitage_crimson", name: "Imperial Velour Crimson", nativeName: "Императорский Бордо", hex: "#991B1B", inspiration: "Winter Palace gallery velvet" },
      { id: "ru_khokhloma_gold", name: "Khokhloma Amber Gold", nativeName: "Золотая Хохлома", hex: "#CA8A04", inspiration: "Gilded wooden folk lacquerware" },
      { id: "ru_taiga_pine", name: "Siberian Taiga Pine", nativeName: "Сибирский Кедр", hex: "#14532D", inspiration: "Deep northern cedar forests" },
      { id: "ru_ural_malachite", name: "Ural Carved Malachite", nativeName: "Уральский Малахит", hex: "#047857", inspiration: "Banded green gemstone craft" },
      { id: "ru_birch_silver", name: "Karelian Birch Silver", nativeName: "Белая Береза", hex: "#E2E8F0", inspiration: "Silver birch bark & frost" },
      { id: "ru_baikal_ice", name: "Lake Baikal Crystal Blue", nativeName: "Байкальский Лёд", hex: "#0284C7", inspiration: "Deep winter turquoise ice" },
      { id: "ru_neva_slate", name: "Saint Petersburg Granite", nativeName: "Невский Гранит", hex: "#334155", inspiration: "Neva embankment masonry" },
    ],
  },
  {
    id: "CN",
    countryName: "China",
    nativeName: "中国 (Zhōngguó)",
    flag: "🇨🇳",
    currencyCode: "CNY",
    currencySymbol: "¥",
    locale: "zh-CN",
    timeZone: "Asia/Shanghai",
    phonePrefix: "+86",
    isActive: true,
    isMuslimMarket: false,
    culturalIdentity: {
      id: "cultural_cn",
      title: "Chinese Cultural Identity",
      description: "Jingdezhen porcelain lattice, auspicious cloud scrollwork, and Suzhou garden window geometry.",
      defaultOrnamentPattern: "asian_silk_cloud",
      defaultOrnamentOpacity: 0.10,
      heritageNote: "Suzhou silk embroidery & Jingdezhen celadon",
    },
    culturalColorPalette: [
      { id: "cn_cinnabar_red", name: "Cinnabar Lacquer Red", hex: "#DC2626", inspiration: "Carved lacquerware & festive silk" },
      { id: "cn_longquan_celadon", name: "Longquan Jade Celadon", hex: "#0D9488", inspiration: "Song dynasty celadon glaze" },
      { id: "cn_qinghua_cobalt", name: "Qinghua Porcelain Blue", hex: "#1E40AF", inspiration: "Jingdezhen blue-and-white ware" },
      { id: "cn_imperial_amber", name: "Gilded Imperial Ochre", hex: "#CA8A04", inspiration: "Glazed palace roof tiles" },
      { id: "cn_hangzhou_tea", name: "Longjing Bamboo Green", hex: "#15803D", inspiration: "West Lake terraced tea hills" },
      { id: "cn_xuan_rice", name: "Xuan Rice Paper Ivory", hex: "#FAF8F5", inspiration: "Anhui calligraphy scroll paper" },
      { id: "cn_duan_ink", name: "Huizhou Pine Ink", hex: "#1E293B", inspiration: "Traditional scholar inkstick" },
      { id: "cn_peony_plum", name: "Luoyang Peony Rose", hex: "#BE185D", inspiration: "Silk fan floral embroidery" },
    ],
  },
  {
    id: "IN",
    countryName: "India",
    nativeName: "भारत (Bhārat)",
    flag: "🇮🇳",
    currencyCode: "INR",
    currencySymbol: "₹",
    locale: "en-IN",
    timeZone: "Asia/Kolkata",
    phonePrefix: "+91",
    isActive: true,
    isMuslimMarket: false,
    culturalIdentity: {
      id: "cultural_in",
      title: "Indian Cultural Identity",
      description: "Rajasthani jali stone filigree, Banarasi zari brocade borders, and botanical paisley geometry.",
      defaultOrnamentPattern: "asian_silk_cloud",
      defaultOrnamentOpacity: 0.10,
      heritageNote: "Jaipur block-print & Banarasi handloom heritage",
    },
    culturalColorPalette: [
      { id: "in_jaipur_rose", name: "Jaipur Terracotta Pink", hex: "#E11D48", inspiration: "Hawa Mahal sandstone facades" },
      { id: "in_jodhpur_indigo", name: "Jodhpur Indigo Blue", hex: "#1D4ED8", inspiration: "Blue City lime-washed houses" },
      { id: "in_marigold_saffron", name: "Kesar Marigold Gold", hex: "#D97706", inspiration: "Festive marigold garlands" },
      { id: "in_kashmir_emerald", name: "Chinar Leaf Emerald", hex: "#15803D", inspiration: "Pashmina & valley gardens" },
      { id: "in_banarasi_crimson", name: "Banarasi Katan Silk Red", hex: "#991B1B", inspiration: "Varanasi gold-threaded silk" },
      { id: "in_mysore_sandal", name: "Mysore Sandalwood Cream", hex: "#E7DFD3", inspiration: "Carved fragrant sandalwood" },
      { id: "in_udaipur_teal", name: "Pichola Peacock Teal", hex: "#0F766E", inspiration: "Mewar glass mosaic" },
      { id: "in_kerala_spice", name: "Malabar Cardamom Umber", hex: "#78350F", inspiration: "Western Ghats spice plantations" },
    ],
  },
];

// ============================================================================
// 5. PREDEFINED PLATFORM ISLAMIC OCCASIONS & NATIONAL/COMMERCIAL CALENDARS
// ============================================================================

export const INITIAL_MARKET_EVENTS: MarketEvent[] = [
  // --- A. PLATFORM-CONTROLLED ISLAMIC OCCASIONS (Applicable Muslim Markets ONLY) ---
  {
    id: "islamic_ramadan_global",
    marketId: "ALL_MUSLIM_MARKETS",
    countryName: "All Muslim Markets",
    title: "Ramadan Kareem Atmosphere & Souk",
    titleAr: "أجواء شهر رمضان المبارك",
    titleFr: "Atmosphère Ramadan Kareem",
    greetingText: "Ramadan Kareem • Blessed Nights & Artisan Selections",
    greetingTextAr: "رمضان كريم • كل عام وأنتم بخير",
    greetingTextFr: "Ramadan Moubarak • Sélections Artisanales",
    category: "religious",
    religionType: "islamic",
    controlScope: "platform_central_only",
    startDate: "2026-02-17",
    endDate: "2026-03-19",
    hijriReference: "Ramadan 1447–1448 AH",
    timeZone: "Africa/Algiers",
    autoActivate: true,
    forceActiveByAdmin: false,
    ornamentPattern: "islamic_mosque_arabesque",
    ornamentOpacity: 0.12,
    accentTintHex: "#D4AF37",
    recommendedDiscountPercent: 20,
  },
  {
    id: "islamic_eid_al_fitr_global",
    marketId: "ALL_MUSLIM_MARKETS",
    countryName: "All Muslim Markets",
    title: "Eid al-Fitr Celebration",
    titleAr: "احتفالية عيد الفطر السعيد",
    titleFr: "Célébration de l'Aïd el-Fitr",
    greetingText: "Eid Mubarak • Joyful Celebrations & Festive Collections",
    greetingTextAr: "عيد فطر مبارك • تقبل الله منا ومنكم",
    greetingTextFr: "Aïd Moubarak • Collections Festives",
    category: "religious",
    religionType: "islamic",
    controlScope: "platform_central_only",
    startDate: "2026-03-20",
    endDate: "2026-03-25",
    hijriReference: "1 Shawwal 1447–1448 AH",
    timeZone: "Africa/Algiers",
    autoActivate: true,
    forceActiveByAdmin: false,
    ornamentPattern: "maghrebi_zellige",
    ornamentOpacity: 0.12,
    accentTintHex: "#10B981",
    recommendedDiscountPercent: 25,
  },
  {
    id: "islamic_eid_al_adha_global",
    marketId: "ALL_MUSLIM_MARKETS",
    countryName: "All Muslim Markets",
    title: "Eid al-Adha Celebration",
    titleAr: "احتفالية عيد الأضحى المبارك",
    titleFr: "Célébration de l'Aïd el-Adha",
    greetingText: "Eid al-Adha Mubarak • Warm Wishes & Family Gatherings",
    greetingTextAr: "عيد أضحى مبارك • كل عام وأنتم بخير",
    greetingTextFr: "Aïd el-Adha Moubarak",
    category: "religious",
    religionType: "islamic",
    controlScope: "platform_central_only",
    startDate: "2026-05-26",
    endDate: "2026-06-01",
    hijriReference: "10 Dhu al-Hijjah 1447–1448 AH",
    timeZone: "Africa/Algiers",
    autoActivate: true,
    forceActiveByAdmin: false,
    ornamentPattern: "andalusian_arch",
    ornamentOpacity: 0.12,
    accentTintHex: "#0D9488",
    recommendedDiscountPercent: 20,
  },

  // --- B. ALGERIA NATIONAL, CULTURAL & COMMERCIAL CALENDAR ---
  {
    id: "dz_nov_1_revolution",
    marketId: "DZ",
    countryName: "Algeria",
    title: "November 1st Glorious Revolution Day",
    titleAr: "ذكرى اندلاع الثورة التحريرية المجيدة (أول نوفمبر)",
    titleFr: "1er Novembre • Fête de la Révolution Algérienne",
    greetingText: "November 1st • Celebrating Algerian Heritage & Local Craftsmanship",
    greetingTextAr: "أول نوفمبر المجيد • فخر الصناعة والحرف الجزائرية",
    greetingTextFr: "1er Novembre • Fierté de l'Artisanat Algérien",
    category: "national",
    religionType: "none",
    controlScope: "merchant_customizable",
    startDate: "2026-10-28",
    endDate: "2026-11-15",
    timeZone: "Africa/Algiers",
    autoActivate: true,
    forceActiveByAdmin: true, // Active during current November window
    ornamentPattern: "maghrebi_zellige",
    ornamentOpacity: 0.11,
    accentTintHex: "#15803D",
    recommendedDiscountPercent: 20,
  },
  {
    id: "dz_july_5_independence",
    marketId: "DZ",
    countryName: "Algeria",
    title: "July 5th Algerian Independence & Youth Day",
    titleAr: "عيد الاستقلال والشباب (5 جويلية)",
    titleFr: "5 Juillet • Fête de l'Indépendance et de la Jeunesse",
    greetingText: "July 5th • Algerian Independence & Youth Celebration",
    greetingTextAr: "5 جويلية • عيد الاستقلال والشباب",
    category: "national",
    religionType: "none",
    controlScope: "merchant_customizable",
    startDate: "2026-07-01",
    endDate: "2026-07-10",
    timeZone: "Africa/Algiers",
    autoActivate: true,
    ornamentPattern: "maghrebi_zellige",
    ornamentOpacity: 0.11,
    accentTintHex: "#16A34A",
    recommendedDiscountPercent: 25,
  },
  {
    id: "dz_yennayer_heritage",
    marketId: "DZ",
    countryName: "Algeria",
    title: "Yennayer Amazigh New Year Heritage Week",
    titleAr: "يناير • رأس السنة الأمازيغية والتراث الجزائري",
    titleFr: "Yennayer • Nouvel An Amazigh & Patrimoine",
    greetingText: "Assegas Ameggaz • Celebrating Algerian Artisanal Heritage",
    category: "cultural",
    religionType: "none",
    controlScope: "merchant_customizable",
    startDate: "2026-01-10",
    endDate: "2026-01-16",
    timeZone: "Africa/Algiers",
    autoActivate: true,
    ornamentPattern: "maghrebi_zellige",
    ornamentOpacity: 0.10,
    accentTintHex: "#C85A32",
    recommendedDiscountPercent: 15,
  },

  // --- C. BRAZIL & LATIN AMERICA NATIONAL, CULTURAL & COMMERCIAL CALENDAR ---
  {
    id: "br_semana_do_brasil",
    marketId: "BR",
    countryName: "Brazil",
    title: "September 7th Independence & Semana do Brasil",
    greetingText: "Semana do Brasil • Celebrating Brazilian Creators & Brands",
    category: "national",
    religionType: "none",
    controlScope: "merchant_customizable",
    startDate: "2026-09-01",
    endDate: "2026-09-12",
    timeZone: "America/Sao_Paulo",
    autoActivate: true,
    ornamentPattern: "brazilian_tropical_geometric",
    ornamentOpacity: 0.10,
    accentTintHex: "#15803D",
    recommendedDiscountPercent: 20,
  },
  {
    id: "br_black_friday_nov",
    marketId: "BR",
    countryName: "Brazil",
    title: "Festival de Ofertas Brasil • November Showcase",
    greetingText: "Temporada de Ofertas • Destaques Exclusivos no Brasil",
    category: "commercial",
    religionType: "none",
    controlScope: "merchant_customizable",
    startDate: "2026-11-01",
    endDate: "2026-11-30",
    timeZone: "America/Sao_Paulo",
    autoActivate: true,
    forceActiveByAdmin: true,
    ornamentPattern: "brazilian_tropical_geometric",
    ornamentOpacity: 0.10,
    accentTintHex: "#EAB308",
    recommendedDiscountPercent: 30,
  },
  {
    id: "ar_revolucion_de_mayo",
    marketId: "AR",
    countryName: "Argentina",
    title: "May 25th Día de la Patria & Argentine Craft Week",
    greetingText: "25 de Mayo • Diseño y Artesanía Argentina",
    category: "national",
    religionType: "none",
    controlScope: "merchant_customizable",
    startDate: "2026-05-20",
    endDate: "2026-05-28",
    timeZone: "America/Argentina/Buenos_Aires",
    autoActivate: true,
    ornamentPattern: "argentine_sol_filigree",
    ornamentOpacity: 0.10,
    accentTintHex: "#38BDF8",
    recommendedDiscountPercent: 20,
  },

  // --- D. UNITED STATES NATIONAL & COMMERCIAL CALENDAR ---
  {
    id: "us_independence_july4",
    marketId: "US",
    countryName: "United States",
    title: "July 4th Independence Day Showcase",
    greetingText: "Fourth of July • Summer Makers & Heritage Showcase",
    category: "national",
    religionType: "none",
    controlScope: "merchant_customizable",
    startDate: "2026-07-01",
    endDate: "2026-07-07",
    timeZone: "America/New_York",
    autoActivate: true,
    ornamentPattern: "americana_heritage_stars",
    ornamentOpacity: 0.09,
    accentTintHex: "#1E40AF",
    recommendedDiscountPercent: 20,
  },
  {
    id: "us_black_friday_cyber",
    marketId: "US",
    countryName: "United States",
    title: "Black Friday & November Cyber Event",
    greetingText: "Black Friday Season • Curated Storefront Offers",
    category: "commercial",
    religionType: "none",
    controlScope: "merchant_customizable",
    startDate: "2026-11-01",
    endDate: "2026-11-30",
    timeZone: "America/New_York",
    autoActivate: true,
    forceActiveByAdmin: true,
    ornamentPattern: "americana_heritage_stars",
    ornamentOpacity: 0.09,
    accentTintHex: "#0F172A",
    recommendedDiscountPercent: 30,
  },

  // --- E. FRANCE NATIONAL & COMMERCIAL CALENDAR ---
  {
    id: "fr_july_14_bastille",
    marketId: "FR",
    countryName: "France",
    title: "14 Juillet • Fête Nationale & Savoir-Faire Français",
    titleFr: "14 Juillet • Fête Nationale & Créateurs Français",
    greetingText: "14 Juillet • L'Excellence des Boutiques & Créateurs",
    category: "national",
    religionType: "none",
    controlScope: "merchant_customizable",
    startDate: "2026-07-10",
    endDate: "2026-07-17",
    timeZone: "Europe/Paris",
    autoActivate: true,
    ornamentPattern: "parisian_art_deco",
    ornamentOpacity: 0.10,
    accentTintHex: "#1E40AF",
    recommendedDiscountPercent: 20,
  },
  {
    id: "fr_automne_atelier",
    marketId: "FR",
    countryName: "France",
    title: "Collection Automne-Hiver • Ateliers de France",
    greetingText: "Saison Automne-Hiver • Créations & Boutiques de France",
    category: "seasonal",
    religionType: "none",
    controlScope: "merchant_customizable",
    startDate: "2026-11-01",
    endDate: "2026-11-30",
    timeZone: "Europe/Paris",
    autoActivate: true,
    forceActiveByAdmin: true,
    ornamentPattern: "parisian_art_deco",
    ornamentOpacity: 0.10,
    accentTintHex: "#7F1D1D",
    recommendedDiscountPercent: 15,
  },

  // --- F. JAPAN CULTURAL & SEASONAL CALENDAR ---
  {
    id: "jp_sakura_spring",
    marketId: "JP",
    countryName: "Japan",
    title: "Sakura Spring Artisanal Season",
    greetingText: "桜の季節 • Spring Craftsmanship & Curated Design",
    category: "seasonal",
    religionType: "none",
    controlScope: "merchant_customizable",
    startDate: "2026-03-20",
    endDate: "2026-04-15",
    timeZone: "Asia/Tokyo",
    autoActivate: true,
    ornamentPattern: "japanese_sakura_seigaiha",
    ornamentOpacity: 0.11,
    accentTintHex: "#F472B6",
    recommendedDiscountPercent: 15,
  },
  {
    id: "jp_koyo_autumn",
    marketId: "JP",
    countryName: "Japan",
    title: "Kōyō Autumn Heritage & Craft Week",
    greetingText: "紅葉狩り • Autumn Artisanal Collections across Japan",
    category: "seasonal",
    religionType: "none",
    controlScope: "merchant_customizable",
    startDate: "2026-11-01",
    endDate: "2026-11-30",
    timeZone: "Asia/Tokyo",
    autoActivate: true,
    forceActiveByAdmin: true,
    ornamentPattern: "japanese_sakura_seigaiha",
    ornamentOpacity: 0.11,
    accentTintHex: "#DC2626",
    recommendedDiscountPercent: 15,
  },

  // --- G. RUSSIA NATIONAL & SEASONAL CALENDAR ---
  {
    id: "ru_june_12_russia_day",
    marketId: "RU",
    countryName: "Russia",
    title: "June 12th Russia Day & Regional Craft Fair",
    greetingText: "День России • Traditional Masters & Contemporary Boutiques",
    category: "national",
    religionType: "none",
    controlScope: "merchant_customizable",
    startDate: "2026-06-08",
    endDate: "2026-06-15",
    timeZone: "Europe/Moscow",
    autoActivate: true,
    ornamentPattern: "russian_slavic_filigree",
    ornamentOpacity: 0.10,
    accentTintHex: "#1D4ED8",
    recommendedDiscountPercent: 20,
  },
  {
    id: "ru_winter_atelier",
    marketId: "RU",
    countryName: "Russia",
    title: "Northern Winter Atelier & Gzhel Showcase",
    greetingText: "Зимняя Коллекция • Warm Knitwear, Porcelain & Regional Craft",
    category: "seasonal",
    religionType: "none",
    controlScope: "merchant_customizable",
    startDate: "2026-11-01",
    endDate: "2026-12-15",
    timeZone: "Europe/Moscow",
    autoActivate: true,
    forceActiveByAdmin: true,
    ornamentPattern: "russian_slavic_filigree",
    ornamentOpacity: 0.10,
    accentTintHex: "#1D4ED8",
    recommendedDiscountPercent: 20,
  },
];

// ============================================================================
// 6. YUME READY-MADE CAMPAIGN TEMPLATES (OPTION A FOR MERCHANTS)
// ============================================================================

export const YUME_READY_CAMPAIGN_TEMPLATES: YumeReadyTemplate[] = [
  {
    id: "tpl_national_pride",
    name: "National Heritage & Local Pride",
    category: "national",
    description: "Celebrate national occasions with subtle geometric framing and verified local craft storytelling.",
    defaultHeadline: "National Heritage Collection • Crafted Locally",
    defaultSubtitle: "Discover limited-edition pieces celebrating our local artisans with special commemorative pricing.",
    defaultBadge: "NATIONAL OCCASION",
    defaultDiscountPercent: 20,
    accentColorHex: "#15803D",
    ornamentPattern: "maghrebi_zellige",
    previewImageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "tpl_seasonal_capsule",
    name: "Seasonal Capsule Drop",
    category: "seasonal",
    description: "Editorial showcase for spring, summer, autumn, or winter seasonal arrivals.",
    defaultHeadline: "New Seasonal Capsule • Limited Boutique Run",
    defaultSubtitle: "Fresh textures, curated colors, and priority nationwide delivery directly from our studio.",
    defaultBadge: "SEASONAL DROP",
    defaultDiscountPercent: 15,
    accentColorHex: "#0284C7",
    ornamentPattern: "japanese_sakura_seigaiha",
    previewImageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "tpl_commercial_flash",
    name: "Major Commercial Event & Black Friday",
    category: "commercial",
    description: "High-conversion storefront banner for major commercial calendar milestones.",
    defaultHeadline: "Annual Boutique Showcase • Up to 30% Off Selected Pieces",
    defaultSubtitle: "Exclusive storefront event on our highest-rated collection items while stock lasts.",
    defaultBadge: "SPECIAL EVENT",
    defaultDiscountPercent: 30,
    accentColorHex: "#0F172A",
    ornamentPattern: "parisian_art_deco",
    previewImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "tpl_cultural_artisan",
    name: "Cultural & Artisanal Craft Week",
    category: "cultural",
    description: "Warm editorial presentation highlighting traditional techniques and authentic materials.",
    defaultHeadline: "Artisanal Heritage Week • Handcrafted Excellence",
    defaultSubtitle: "Every piece tells a story of local mastery, natural materials, and timeless design.",
    defaultBadge: "CULTURAL EDITION",
    defaultDiscountPercent: 15,
    accentColorHex: "#C85A32",
    ornamentPattern: "andalusian_arch",
    previewImageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
  },
];

// ============================================================================
// 7. SEEDED INTERNATIONAL MARKET STORES (ISOLATED BY MARKET)
// ============================================================================

export const INTERNATIONAL_MARKET_DEMO_STORES: MerchantStore[] = [
  {
    id: "store_br_atelier_paulista",
    name: "Atelier Paulista & Rio Craft",
    slug: "atelier-paulista",
    subdomain: "paulista.yume.br",
    country: "Brazil",
    currency: "BRL",
    logo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900&auto=format&fit=crop&q=80",
    description: "Authentic Brazilian sustainable fashion, tropical linen resortwear, and Minas Gerais ceramics.",
    bio: "Born in São Paulo & Rio de Janeiro • Curated Brazilian design delivered nationwide via PIX & Courier.",
    wilaya: "São Paulo",
    wilayaCode: "SP",
    address: "Avenida Paulista 1400, São Paulo, Brazil",
    coordinates: { lat: -23.5614, lng: -46.6559 },
    rating: 4.9,
    categories: ["Fashion", "Crafts", "Home & Living"],
    verified: true,
    premiumTier: "Pro",
    contact: {
      phone: "+55 (11) 98765-4321",
      email: "contato@paulista.yume.br",
    },
    products: [
      {
        id: "prod_br_1",
        storeId: "store_br_atelier_paulista",
        name: "Ipanema Pure Linen Resort Shirt",
        category: "Fashion",
        subcategory: "fashion_clothing",
        price: 289,
        currency: "BRL",
        stock: 32,
        imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80",
        status: "active",
        rating: 4.9,
        reviews: [],
        description_en: "Breathable 100% Brazilian linen shirt tailored for tropical warmth.",
        description_fr: "Chemise 100% lin brésilien respirant.",
        description_ar: "قميص كتان برازيلي طبيعي مريح.",
        colors: [
          { name: "Copacabana Calçadão", hex: "#F5F5DC", stock: 16 },
          { name: "Amazonia Emerald", hex: "#15803D", stock: 16 },
        ],
        sizes: ["S", "M", "L", "XL"],
        tags: ["brazil", "linen", "fashion"],
      },
      {
        id: "prod_br_2",
        storeId: "store_br_atelier_paulista",
        name: "Minas Gerais Hand-Glazed Terracotta Vase",
        category: "Crafts",
        price: 195,
        currency: "BRL",
        stock: 18,
        imageUrl: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80",
        status: "active",
        rating: 4.8,
        reviews: [],
        description_en: "Hand-thrown ceramic vessel crafted by artisans in Minas Gerais.",
        description_fr: "Vase en terre cuite émaillée à la main du Minas Gerais.",
        description_ar: "مزهرية خزفية يدوية من ميناس جيرايس.",
        tags: ["brazil", "ceramics", "home"],
      },
    ],
    reviews: [],
  },
  {
    id: "store_fr_maison_marais",
    name: "Maison Le Marais Paris",
    slug: "maison-marais",
    subdomain: "marais.yume.fr",
    country: "France",
    currency: "EUR",
    logo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&auto=format&fit=crop&q=80",
    description: "Parisian leather goods, Provençal botanical fragrances, and tailored atelier essentials.",
    bio: "Situé au cœur du Marais à Paris • Savoir-faire artisanal français.",
    wilaya: "Île-de-France",
    wilayaCode: "IDF",
    address: "24 Rue des Francs-Bourgeois, 75003 Paris, France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
    rating: 4.9,
    categories: ["Fashion", "Health & Beauty"],
    verified: true,
    premiumTier: "Pro",
    contact: {
      phone: "+33 6 12 34 56 78",
      email: "bonjour@marais.yume.fr",
    },
    products: [
      {
        id: "prod_fr_1",
        storeId: "store_fr_maison_marais",
        name: "Veste Structurée Bleu de France",
        category: "Fashion",
        subcategory: "fashion_clothing",
        price: 165,
        currency: "EUR",
        stock: 24,
        imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
        status: "active",
        rating: 4.9,
        reviews: [],
        description_en: "Parisian structured workwear jacket in deep Bleu de France cotton twill.",
        description_fr: "Veste d'atelier coupée à Paris en sergé de coton Bleu de France.",
        description_ar: "سترة باريسية أنيقة باللون الأزرق الفرنسي.",
        colors: [
          { name: "Bleu de France", hex: "#1E40AF", stock: 12 },
          { name: "Bordeaux Burgundy", hex: "#7F1D1D", stock: 12 },
        ],
        sizes: ["S", "M", "L"],
        tags: ["france", "paris", "fashion"],
      },
    ],
    reviews: [],
  },
  {
    id: "store_jp_kyoto_kogei",
    name: "Kyoto Kōgei & Aizome Studio",
    slug: "kyoto-kogei",
    subdomain: "kyoto.yume.jp",
    country: "Japan",
    currency: "JPY",
    logo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900&auto=format&fit=crop&q=80",
    description: "Authentic Kyoto Aizome indigo textiles, Uji ceramic teaware, and minimalist Japanese apparel.",
    bio: "Kyoto Nakagyo Ward • Traditional Japanese craftsmanship for modern living.",
    wilaya: "Kyoto",
    wilayaCode: "KYO",
    address: "Nakagyo-ku, Kyoto 604-8006, Japan",
    coordinates: { lat: 35.0116, lng: 135.7681 },
    rating: 5.0,
    categories: ["Fashion", "Crafts", "Home & Living"],
    verified: true,
    premiumTier: "Pro",
    contact: {
      phone: "+81 90-1234-5678",
      email: "studio@kyoto.yume.jp",
    },
    products: [
      {
        id: "prod_jp_1",
        storeId: "store_jp_kyoto_kogei",
        name: "Aizome Natural Indigo Haori Jacket",
        category: "Fashion",
        subcategory: "fashion_clothing",
        price: 18500,
        currency: "JPY",
        stock: 15,
        imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80",
        status: "active",
        rating: 5.0,
        reviews: [],
        description_en: "Hand-dyed Tokushima Aizome indigo cotton jacket crafted in Kyoto.",
        description_fr: "Veste Haori teinte à l'indigo naturel Aizome à Kyoto.",
        description_ar: "سترة يابانية مصبوغة بالنيلي الطبيعي في كيوتو.",
        colors: [
          { name: "Aizome Deep Indigo", hex: "#1E3A8A", stock: 10 },
          { name: "Sumi Calligraphy Ink", hex: "#1C1917", stock: 5 },
        ],
        sizes: ["S", "M", "L"],
        tags: ["japan", "kyoto", "indigo"],
      },
    ],
    reviews: [],
  },
  {
    id: "store_us_soho_mercantile",
    name: "SoHo Heritage Mercantile NYC",
    slug: "soho-mercantile",
    subdomain: "soho.yume.us",
    country: "United States",
    currency: "USD",
    logo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80",
    description: "American selvedge denim, small-batch leather goods, and modern home essentials from New York.",
    bio: "Designed in SoHo, New York • Domestic fast shipping across all 50 states.",
    wilaya: "New York",
    wilayaCode: "NY",
    address: "112 Greene St, New York, NY 10012, USA",
    coordinates: { lat: 40.7248, lng: -74.0005 },
    rating: 4.8,
    categories: ["Fashion", "Home & Living"],
    verified: true,
    premiumTier: "Pro",
    contact: {
      phone: "+1 (212) 555-0192",
      email: "hello@soho.yume.us",
    },
    products: [
      {
        id: "prod_us_1",
        storeId: "store_us_soho_mercantile",
        name: "Selvedge Denim Overshirt • Liberty Navy",
        category: "Fashion",
        subcategory: "fashion_clothing",
        price: 128,
        currency: "USD",
        stock: 40,
        imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80",
        status: "active",
        rating: 4.8,
        reviews: [],
        description_en: "12oz American selvedge denim overshirt with custom brass hardware.",
        description_fr: "Surchemise en denim selvedge américain 12oz.",
        description_ar: "قميص جينز أمريكي أصلي متين.",
        colors: [
          { name: "Liberty Heritage Navy", hex: "#0F172A", stock: 25 },
          { name: "Sedona Crimson", hex: "#B91C1C", stock: 15 },
        ],
        sizes: ["S", "M", "L", "XL"],
        tags: ["usa", "denim", "ny"],
      },
    ],
    reviews: [],
  },
  {
    id: "store_ru_neva_artisan",
    name: "Neva Porcelain & Knitwear Atelier",
    slug: "neva-atelier",
    subdomain: "neva.yume.ru",
    country: "Russia",
    currency: "RUB",
    logo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900&auto=format&fit=crop&q=80",
    description: "Hand-painted Gzhel cobalt porcelain, warm merino knitwear, and Ural stone home accents.",
    bio: "Moscow & Saint Petersburg • Authentic Russian decorative arts and winter apparel.",
    wilaya: "Moscow",
    wilayaCode: "MOW",
    address: "Arbat St 28, Moscow, Russia",
    coordinates: { lat: 55.7501, lng: 37.5922 },
    rating: 4.9,
    categories: ["Crafts", "Fashion", "Home & Living"],
    verified: true,
    premiumTier: "Pro",
    contact: {
      phone: "+7 (916) 123-45-67",
      email: "info@neva.yume.ru",
    },
    products: [
      {
        id: "prod_ru_1",
        storeId: "store_ru_neva_artisan",
        name: "Gzhel Cobalt Hand-Painted Tea Service",
        category: "Crafts",
        price: 6900,
        currency: "RUB",
        stock: 20,
        imageUrl: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80",
        status: "active",
        rating: 4.9,
        reviews: [],
        description_en: "Authentic Gzhel porcelain tea service painted in traditional cobalt floral motifs.",
        description_fr: "Service à thé en porcelaine de Gjel peint à la main au cobalt.",
        description_ar: "طقم شاي خزفي مرسوم يدوياً باللون الأزرق الكوبالت.",
        colors: [{ name: "Gzhel Porcelain Cobalt", hex: "#1D4ED8", stock: 20 }],
        tags: ["russia", "porcelain", "craft"],
      },
    ],
    reviews: [],
  },
  {
    id: "store_ma_fes_medina",
    name: "Dar Fes & Marrakech Artisanat",
    slug: "dar-fes",
    subdomain: "darfes.yume.ma",
    country: "Morocco",
    currency: "MAD",
    logo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=900&auto=format&fit=crop&q=80",
    description: "Hand-stitched Moroccan babouches, Majorelle ceramics, and pure Souss argan care.",
    bio: "Casablanca & Marrakech • Authentic Moroccan craftsmanship.",
    wilaya: "Casablanca-Settat",
    wilayaCode: "CAS",
    address: "Quartier Habous, Casablanca, Morocco",
    coordinates: { lat: 33.5731, lng: -7.5898 },
    rating: 4.9,
    categories: ["Fashion", "Crafts", "Health & Beauty"],
    verified: true,
    premiumTier: "Pro",
    contact: {
      phone: "+212 6 12 34 56 78",
      email: "contact@darfes.yume.ma",
    },
    products: [
      {
        id: "prod_ma_1",
        storeId: "store_ma_fes_medina",
        name: "Majorelle Embroidered Kaftan Tunic",
        category: "Fashion",
        subcategory: "fashion_clothing",
        price: 750,
        currency: "MAD",
        stock: 22,
        imageUrl: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&auto=format&fit=crop&q=80",
        status: "active",
        rating: 4.9,
        reviews: [],
        description_en: "Hand-embroidered Moroccan tunic with silk sfifa trim.",
        description_fr: "Tunique marocaine brodée main avec sfifa en soie.",
        description_ar: "قفطان مغربي مطرز يدوياً بالسفيفة الحريرية.",
        colors: [
          { name: "Majorelle Cobalt", hex: "#2243B6", stock: 12 },
          { name: "Fes Zellige Green", hex: "#166534", stock: 10 },
        ],
        sizes: ["S", "M", "L", "XL"],
        tags: ["morocco", "kaftan", "artisan"],
      },
    ],
    reviews: [],
  },
];

// ============================================================================
// 8. STORAGE KEYS & RUNTIME STATE HELPERS
// ============================================================================

const MARKETS_STORAGE_KEY = "yume_global_markets_v1";
const EVENTS_STORAGE_KEY = "yume_market_events_v1";
const CAMPAIGNS_STORAGE_KEY = "yume_campaigns_v1";
const PAID_ADS_ENABLED_KEY = "yume_public_paid_ads_enabled_v1";

const memoryStorageFallback: Record<string, string> = {};

function readStorageItem(key: string): string | null {
  try {
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      return window.localStorage.getItem(key);
    }
  } catch {}
  return memoryStorageFallback[key] ?? null;
}

function writeStorageItem(key: string, value: string): void {
  memoryStorageFallback[key] = value;
  try {
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  } catch {}
}

/**
 * Returns all configured global markets (merging initial 18 markets with any Platform Admin updates).
 */
export function getAllMarketConfigs(): MarketConfig[] {
  try {
    const saved = readStorageItem(MARKETS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const byId = new Map<string, MarketConfig>();
        INITIAL_GLOBAL_MARKETS.forEach((m) => byId.set(m.id, m));
        parsed.forEach((m: MarketConfig) => {
          if (m && m.id) byId.set(m.id, m);
        });
        return Array.from(byId.values());
      }
    }
  } catch {}
  return [...INITIAL_GLOBAL_MARKETS];
}

export function saveAllMarketConfigs(markets: MarketConfig[]): void {
  try {
    writeStorageItem(MARKETS_STORAGE_KEY, JSON.stringify(markets));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("yume-markets-updated"));
      window.dispatchEvent(new CustomEvent("yume-global-architecture-updated"));
    }
  } catch {}
}

/**
 * Resolves a MarketConfig by either country name ("Algeria", "Brazil") or ISO code ("DZ", "BR").
 */
export function getMarketByCountryOrCode(countryOrCode?: string | null): MarketConfig {
  const markets = getAllMarketConfigs();
  if (!countryOrCode) {
    return markets.find((m) => m.id === "DZ") || INITIAL_GLOBAL_MARKETS[0];
  }
  const clean = countryOrCode.trim().toLowerCase();
  const found = markets.find(
    (m) =>
      m.id.toLowerCase() === clean ||
      m.countryName.toLowerCase() === clean ||
      m.nativeName.toLowerCase() === clean
  );
  return found || markets.find((m) => m.id === "DZ") || INITIAL_GLOBAL_MARKETS[0];
}

/**
 * Dynamically adds or updates a market configuration without requiring any component rewrites.
 */
export function registerOrUpdateMarketConfig(nextMarket: MarketConfig): MarketConfig[] {
  const current = getAllMarketConfigs();
  const idx = current.findIndex(
    (m) =>
      m.id.toUpperCase() === nextMarket.id.toUpperCase() ||
      m.countryName.toLowerCase() === nextMarket.countryName.toLowerCase()
  );
  let updated: MarketConfig[];
  if (idx !== -1) {
    updated = current.map((m, i) => (i === idx ? { ...nextMarket, id: nextMarket.id.toUpperCase() } : m));
  } else {
    updated = [...current, { ...nextMarket, id: nextMarket.id.toUpperCase() }];
  }
  // Also sync into countryCurrencyMapping at runtime if a new country was added
  if (!countryCurrencyMapping[nextMarket.countryName]) {
    countryCurrencyMapping[nextMarket.countryName] = {
      name: nextMarket.countryName,
      currency: nextMarket.currencyCode,
      symbol: nextMarket.currencySymbol,
      locale: nextMarket.locale,
      flag: nextMarket.flag,
      phoneFormat: `${nextMarket.phonePrefix} XXX XXX XXX`,
      phonePlaceholder: `${nextMarket.phonePrefix} 555 123 456`,
      emailPlaceholder: `client@yume.${nextMarket.id.toLowerCase()}`,
      taxRate: 0.15,
      regions: [{ code: "CAP", name: "Capital Region", nameAr: "العاصمة" }],
      gateways: [
        { id: "cod", name: "Cash on Delivery (COD)", description: "Pay upon delivery." },
        { id: "card", name: "Credit/Debit Card", description: "Secure card payment." },
      ],
      defaultMapCenter: { lat: 36.7538, lng: 3.0588, zoom: 5 },
    };
  }
  saveAllMarketConfigs(updated);
  return updated;
}

// ============================================================================
// 9. STRICT MARKET SEPARATION RULES
// ============================================================================

/**
 * Determines which market a store belongs to.
 * Legacy stores without an explicit `country` field default to "Algeria" ("DZ").
 */
export function getStoreMarketConfig(store?: Partial<MerchantStore> | null): MarketConfig {
  if (!store) return getMarketByCountryOrCode("Algeria");
  const storeCountry = (store as any).marketId || store.country || "Algeria";
  return getMarketByCountryOrCode(storeCountry);
}

/**
 * CRITICAL MARKET SEPARATION RULE:
 * A merchant operating in the Algerian market has products visible ONLY within the Algerian market.
 * A Brazilian merchant has products visible ONLY within the Brazilian market.
 */
export function doesStoreBelongToMarket(
  store: Partial<MerchantStore> | null | undefined,
  activeMarketCountryOrCode: string
): boolean {
  if (!store) return false;
  const storeMarket = getStoreMarketConfig(store);
  const activeMarket = getMarketByCountryOrCode(activeMarketCountryOrCode);
  return storeMarket.id === activeMarket.id;
}

export function filterStoresByActiveMarket<T extends Partial<MerchantStore>>(
  stores: T[],
  activeMarketCountryOrCode: string
): T[] {
  if (!Array.isArray(stores)) return [];
  return stores.filter((st) => doesStoreBelongToMarket(st, activeMarketCountryOrCode));
}

/**
 * Merges international demo stores into the store list if they aren't already present,
 * ensuring every pre-configured international market has isolated local stores ready to browse.
 */
export function ensureInternationalMarketStores(existingStores: MerchantStore[]): MerchantStore[] {
  const safeExisting = Array.isArray(existingStores) ? existingStores : [];
  const normalizedExisting = safeExisting.map((st) => ({
    ...st,
    country: st.country || "Algeria",
  }));
  const existingIds = new Set(normalizedExisting.map((s) => s.id));
  const missingDemo = INTERNATIONAL_MARKET_DEMO_STORES.filter((d) => !existingIds.has(d.id));
  return [...normalizedExisting, ...missingDemo];
}

// ============================================================================
// 10. CULTURAL IDENTITY & STRICT ISLAMIC-ONLY RELIGIOUS POLICY ENGINE
// ============================================================================

const FORBIDDEN_RELIGIOUS_KEYWORDS = [
  "christmas",
  "noel",
  "noël",
  "easter",
  "pâques",
  "pasqua",
  "catholic",
  "christian",
  "buddha",
  "buddhist",
  "vesak",
  "diwali",
  "hanukkah",
  "passover",
  "lent",
  "pentecost",
  "good friday",
];

export interface EventPolicyValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Enforces YUME's strict Cultural & Religious Event Policy:
 * 1. Religious events are permitted ONLY for Islamic occasions ("islamic").
 * 2. Non-Islamic religious celebrations, greetings, symbols, or themes are strictly prohibited.
 * 3. Islamic occasions must be centrally controlled by YUME ("platform_central_only") and
 *    may only target Muslim markets (market.isMuslimMarket === true or "ALL_MUSLIM_MARKETS").
 */
export function validateCulturalEventPolicy(
  event: Partial<MarketEvent>,
  actorRole: "platform_admin" | "merchant" = "platform_admin"
): EventPolicyValidationResult {
  const combinedText = `${event.title || ""} ${event.titleAr || ""} ${event.titleFr || ""} ${
    event.greetingText || ""
  }`.toLowerCase();

  for (const forbidden of FORBIDDEN_RELIGIOUS_KEYWORDS) {
    if (combinedText.includes(forbidden)) {
      return {
        valid: false,
        error: `POLICY_VIOLATION: YUME strictly prohibits non-Islamic religious occasions, greetings, or themes ("${forbidden}"). Only Islamic occasions (Ramadan, Eid al-Fitr, Eid al-Adha) are supported in applicable Muslim markets.`,
      };
    }
  }

  if (event.category === "religious") {
    if (event.religionType !== "islamic") {
      return {
        valid: false,
        error:
          "POLICY_VIOLATION: Religious events must have religionType === 'islamic'. Non-Islamic religious events are strictly forbidden.",
      };
    }
    if (actorRole !== "platform_admin") {
      return {
        valid: false,
        error:
          "POLICY_VIOLATION: Islamic religious occasions are centrally controlled by YUME Platform Admin and cannot be created, modified, or disabled by individual merchants.",
      };
    }
    if (event.controlScope && event.controlScope !== "platform_central_only") {
      return {
        valid: false,
        error:
          "POLICY_VIOLATION: Islamic occasions must use controlScope === 'platform_central_only'.",
      };
    }
    if (event.marketId && event.marketId !== "ALL_MUSLIM_MARKETS") {
      const targetMarket = getMarketByCountryOrCode(event.marketId);
      if (!targetMarket.isMuslimMarket) {
        return {
          valid: false,
          error: `POLICY_VIOLATION: Islamic religious occasion cannot be assigned to non-Muslim market '${targetMarket.countryName}' (${targetMarket.id}).`,
        };
      }
    }
  } else {
    if (event.religionType && event.religionType !== "none") {
      return {
        valid: false,
        error: "Non-religious events must have religionType === 'none'.",
      };
    }
  }

  return { valid: true };
}

export function getAllMarketEvents(): MarketEvent[] {
  try {
    const saved = readStorageItem(EVENTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const byId = new Map<string, MarketEvent>();
        INITIAL_MARKET_EVENTS.forEach((ev) => byId.set(ev.id, ev));
        parsed.forEach((ev: MarketEvent) => {
          if (ev && ev.id && validateCulturalEventPolicy(ev, "platform_admin").valid) {
            byId.set(ev.id, ev);
          }
        });
        return Array.from(byId.values());
      }
    }
  } catch {}
  return [...INITIAL_MARKET_EVENTS];
}

export function saveAllMarketEvents(events: MarketEvent[]): void {
  const safeEvents = events.filter((e) => validateCulturalEventPolicy(e, "platform_admin").valid);
  try {
    writeStorageItem(EVENTS_STORAGE_KEY, JSON.stringify(safeEvents));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("yume-events-updated"));
      window.dispatchEvent(new CustomEvent("yume-global-architecture-updated"));
    }
  } catch {}
}

/**
 * Returns the predefined & active events for a specific market (excluding other countries' events
 * and excluding Islamic religious events if the market is not a Muslim market).
 */
export function getEventsForMarket(
  marketCountryOrCode: string,
  options?: { includeMerchantStoreId?: string; referenceDate?: string }
): MarketEvent[] {
  const market = getMarketByCountryOrCode(marketCountryOrCode);
  const allEvents = getAllMarketEvents();

  return allEvents.filter((ev) => {
    // 1. Check religious policy for target market
    if (ev.category === "religious") {
      if (ev.religionType !== "islamic" || !market.isMuslimMarket) return false;
      return ev.marketId === "ALL_MUSLIM_MARKETS" || ev.marketId === market.id;
    }

    // 2. Check store-exclusive custom events
    if (ev.controlScope === "merchant_store_exclusive") {
      if (!options?.includeMerchantStoreId) return false;
      return ev.storeId === options.includeMerchantStoreId && ev.marketId === market.id;
    }

    // 3. Strictly match active market ID
    return ev.marketId === market.id;
  });
}

/**
 * Evaluates which cultural or Islamic occasion is currently active for the given market
 * to render subtle header/banner edge ornaments without changing YUME's core layout.
 */
export function getActiveCulturalOccasionForMarket(
  marketCountryOrCode: string,
  referenceDateIso?: string
): {
  market: MarketConfig;
  activeEvent: MarketEvent | null;
  ornamentPattern: OrnamentPatternType;
  ornamentOpacity: number;
  accentTintHex: string;
  greetingBannerText: string | null;
} {
  const market = getMarketByCountryOrCode(marketCountryOrCode);
  const marketEvents = getEventsForMarket(market.id);
  const refDate = (referenceDateIso || new Date().toISOString()).slice(0, 10);

  // Priority 1: Admin force-activated Islamic occasion (in Muslim markets) or force-activated market event
  const forcedEvent = marketEvents.find((ev) => ev.forceActiveByAdmin === true);

  // Priority 2: Date-window active event (Islamic occasions take precedence in Muslim markets)
  const dateMatchedEvents = marketEvents.filter(
    (ev) => ev.autoActivate && refDate >= ev.startDate && refDate <= ev.endDate
  );
  dateMatchedEvents.sort((a, b) => {
    if (a.category === "religious" && b.category !== "religious") return -1;
    if (b.category === "religious" && a.category !== "religious") return 1;
    return 0;
  });

  const activeEvent = forcedEvent || dateMatchedEvents[0] || null;

  return {
    market,
    activeEvent,
    ornamentPattern:
      activeEvent?.ornamentPattern || market.culturalIdentity.defaultOrnamentPattern,
    ornamentOpacity: Math.min(
      0.16,
      Math.max(
        0.06,
        activeEvent?.ornamentOpacity ?? market.culturalIdentity.defaultOrnamentOpacity
      )
    ),
    accentTintHex:
      activeEvent?.accentTintHex ||
      market.culturalColorPalette[0]?.hex ||
      "#0b2447",
    greetingBannerText: activeEvent ? activeEvent.greetingText : null,
  };
}

/**
 * Returns the market-specific Cultural Color Palette for the Add Product Color Picker.
 * An Algerian merchant receives only the Algerian palette; a Brazilian merchant receives only the Brazilian palette.
 */
export function getMarketCulturalColorPalette(
  marketCountryOrCode: string
): {
  marketId: string;
  countryName: string;
  flag: string;
  paletteTitle: string;
  swatches: CulturalColorSwatch[];
} {
  const market = getMarketByCountryOrCode(marketCountryOrCode);
  return {
    marketId: market.id,
    countryName: market.countryName,
    flag: market.flag,
    paletteTitle: `${market.countryName} Cultural Color Palette`,
    swatches: market.culturalColorPalette || [],
  };
}

// ============================================================================
// 11. CONTEXTUAL PUBLIC IDENTITY & 4-LAYER MULTI-TENANT RBAC ENGINE
// ============================================================================

/**
 * Resolves the Contextual Public Identity and Store Authorization for any user interacting
 * with a store or the marketplace.
 *
 * Confirmed Architectural Invariants:
 * 1. A Merchant Owner retains their "Merchant" public identity when browsing, purchasing,
 *    commenting, or interacting with other stores, without gaining any administrative
 *    permissions outside their own store.
 * 2. A Store Administrator or Employee appears publicly as a regular "Buyer" when interacting
 *    with external stores, while retaining their assigned administrative identity and
 *    permissions strictly within their authorized store.
 * 3. A Personal Buyer always appears as a "Buyer".
 * 4. Users never inherit administrative permissions from one store into another.
 */
export function resolveContextualPublicPersona(params: {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    storeName?: string;
    ownedStoreIds?: string[];
  } | null;
  targetStoreId?: string | null;
  stores: MerchantStore[];
  activeStaffMemberId?: string | null;
}): ContextualPublicPersona {
  const { user, targetStoreId, stores, activeStaffMemberId } = params;

  if (!user || !user.email) {
    return {
      actorUserId: "guest",
      actorName: "Guest Visitor",
      actorEmail: "",
      targetStoreId: targetStoreId || undefined,
      publicIdentityBadge: "Guest",
      publicAttributionLabel: "Guest Shopper",
      isVerifiedMerchantOwner: false,
      hasAdministrativeAccessToTargetStore: false,
      authorizedRoleInTargetStore: null,
      canDeleteOrTransferTargetStore: false,
    };
  }

  const cleanEmail = user.email.trim().toLowerCase();
  const cleanName = user.name || cleanEmail.split("@")[0];

  // 1. Identify stores owned by this user
  const ownedStores = (stores || []).filter((st) => {
    if (!st) return false;
    if (Array.isArray(user.ownedStoreIds) && user.ownedStoreIds.includes(st.id)) {
      return true;
    }
    if (
      user.role === "Merchant" &&
      user.storeName &&
      st.name.trim().toLowerCase() === user.storeName.trim().toLowerCase()
    ) {
      return true;
    }
    if ((st as any).ownerEmail && String((st as any).ownerEmail).trim().toLowerCase() === cleanEmail) {
      return true;
    }
    return false;
  });

  const isMerchantOwner = ownedStores.length > 0 || user.role === "Merchant";
  const primaryOwnedStore = ownedStores[0];

  // 2. Check membership in the target store
  const targetStore = targetStoreId
    ? (stores || []).find((st) => st && st.id === targetStoreId)
    : undefined;

  const isOwnerOfTargetStore = Boolean(
    targetStore &&
      (ownedStores.some((os) => os.id === targetStore.id) ||
        (user.role === "Merchant" &&
          user.storeName &&
          targetStore.name.trim().toLowerCase() === user.storeName.trim().toLowerCase()))
  );

  // Check if user is an assigned Store Administrator or Store Employee in targetStore
  const matchedTeamMember = targetStore?.teamMembers?.find(
    (m) =>
      m.status !== "inactive" &&
      ((activeStaffMemberId && m.id === activeStaffMemberId) ||
        m.email.trim().toLowerCase() === cleanEmail)
  );

  let authorizedRoleInTargetStore: StoreRoleTier | null = null;
  if (isOwnerOfTargetStore && !activeStaffMemberId) {
    authorizedRoleInTargetStore = "owner";
  } else if (matchedTeamMember) {
    const rawRole = (matchedTeamMember.role || "").toLowerCase();
    authorizedRoleInTargetStore =
      rawRole === "admin" || rawRole === "store_admin" || rawRole === "manager" || rawRole === "store_manager"
        ? "store_admin"
        : "store_employee";
  }

  // 3. Compute Contextual Public Identity Badge
  // - Merchant Owner retains "Merchant" badge everywhere (even on external stores)
  // - Store Admin or Employee appears as "Buyer" on external stores
  // - Personal Buyer always appears as "Buyer"
  const publicIdentityBadge: "Merchant" | "Buyer" = isMerchantOwner ? "Merchant" : "Buyer";
  const resolvedOwnedStoreName =
    primaryOwnedStore?.name || (isMerchantOwner ? user.storeName : undefined);

  const publicAttributionLabel = isMerchantOwner
    ? resolvedOwnedStoreName
      ? `Merchant • ${resolvedOwnedStoreName}`
      : "Verified Merchant"
    : "Verified Buyer";

  return {
    actorUserId: user.id || cleanEmail,
    actorName: cleanName,
    actorEmail: cleanEmail,
    targetStoreId: targetStoreId || undefined,
    publicIdentityBadge,
    publicAttributionLabel,
    publicOwnedStoreName: resolvedOwnedStoreName,
    isVerifiedMerchantOwner: isMerchantOwner,
    hasAdministrativeAccessToTargetStore: authorizedRoleInTargetStore !== null,
    authorizedRoleInTargetStore,
    canDeleteOrTransferTargetStore: authorizedRoleInTargetStore === "owner",
  };
}

/**
 * Strictly validates whether an actor is authorized to perform a protected store operation.
 * Enforces:
 * - Guest & Personal Buyer rejection for Merchant Space operations
 * - Cross-store tenant isolation (Merchant A cannot access Merchant B)
 * - Cross-market isolation (Algerian merchant cannot modify Brazilian store)
 * - Owner-only protection (Store Administrator cannot delete store or transfer ownership)
 * - Employee granular permission verification
 */
export function authorizeStoreOperation(params: {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    storeName?: string;
    ownedStoreIds?: string[];
    isPlatformAdmin?: boolean;
  } | null;
  targetStore: MerchantStore;
  stores: MerchantStore[];
  operation:
    | "view_merchant_space"
    | "manage_products"
    | "manage_orders"
    | "confirm_orders"
    | "manage_coupons"
    | "manage_campaigns"
    | "manage_stories"
    | "manage_team"
    | "manage_settings"
    | "delete_store"
    | "transfer_ownership";
  requiredPermissionFlag?: keyof GranularTeamPermissions;
  activeStaffMemberId?: string | null;
}): AuthorizationDecision {
  const { user, targetStore, stores, operation, requiredPermissionFlag, activeStaffMemberId } =
    params;

  if (!user || !user.email) {
    return {
      allowed: false,
      statusCode: 401,
      reason: "UNAUTHENTICATED: Guest users cannot access merchant management operations.",
      resolvedRoleTier: null,
    };
  }

  if (user.isPlatformAdmin || user.role === "PlatformAdmin") {
    return {
      allowed: true,
      statusCode: 200,
      reason: "Authorized via Platform Admin governance.",
      resolvedRoleTier: "platform_admin",
    };
  }

  const persona = resolveContextualPublicPersona({
    user,
    targetStoreId: targetStore.id,
    stores,
    activeStaffMemberId,
  });

  if (!persona.hasAdministrativeAccessToTargetStore || !persona.authorizedRoleInTargetStore) {
    return {
      allowed: false,
      statusCode: 403,
      reason: `TENANT_ISOLATION_DENIED: User '${user.email}' (${persona.publicIdentityBadge}) has no administrative authority over store '${targetStore.name}' (${targetStore.id}).`,
      resolvedRoleTier: null,
    };
  }

  const roleTier = persona.authorizedRoleInTargetStore;

  // Owner-only critical operations: Store Administrators and Employees can NEVER delete or transfer store ownership
  if (operation === "delete_store" || operation === "transfer_ownership") {
    if (roleTier !== "owner") {
      return {
        allowed: false,
        statusCode: 403,
        reason: `OWNER_PROTECTION_DENIED: Role '${roleTier}' cannot delete store '${targetStore.name}' or transfer ownership away from the Merchant Owner.`,
        resolvedRoleTier: roleTier,
      };
    }
    return {
      allowed: true,
      statusCode: 200,
      reason: "Authorized as Store Owner.",
      resolvedRoleTier: "owner",
    };
  }

  if (roleTier === "owner") {
    return {
      allowed: true,
      statusCode: 200,
      reason: "Authorized as Store Owner.",
      resolvedRoleTier: "owner",
    };
  }

  // For Store Administrator or Store Employee, inspect their granular permissions record in targetStore
  const cleanEmail = user.email.trim().toLowerCase();
  const memberRecord = (targetStore.teamMembers || []).find(
    (m) =>
      m.status !== "inactive" &&
      ((activeStaffMemberId && m.id === activeStaffMemberId) ||
        m.email.trim().toLowerCase() === cleanEmail)
  );

  if (!memberRecord) {
    return {
      allowed: false,
      statusCode: 403,
      reason: "MEMBERSHIP_NOT_FOUND: No active team membership found in target store.",
      resolvedRoleTier: null,
    };
  }

  const perms = (memberRecord.permissions || {}) as Record<string, boolean | undefined>;

  // Map high-level operation to default permission keys if no explicit flag was passed
  const operationPermissionMap: Record<string, (keyof GranularTeamPermissions)[]> = {
    view_merchant_space: [
      "viewProducts",
      "manageProducts",
      "viewOrders",
      "confirmOrders",
      "viewCoupons",
      "manageDiscounts",
      "viewStories",
      "viewFollowers",
      "viewShopperMessages",
      "viewAnalytics",
      "manageAdCampaigns",
      "viewStoreSettings",
    ],
    manage_products: ["manageProducts", "addProducts", "editProducts"],
    manage_orders: ["viewOrders", "editOrderInfo", "changeOrderStatus", "prepareShipments"],
    confirm_orders: ["confirmOrders", "confirmOrdersByPhone", "markOrdersConfirmed"],
    manage_coupons: ["manageDiscounts", "createCoupons", "editCoupons"],
    manage_campaigns: ["manageAdCampaigns", "adPixels", "manageDiscounts"],
    manage_stories: ["publishStories", "editStories", "viewStories"],
    manage_team: ["manageRolesAndPermissions", "addTeamMembers", "editTeamMembers"],
    manage_settings: ["editStoreSettings", "viewStoreSettings"],
  };

  if (requiredPermissionFlag) {
    if (!perms[requiredPermissionFlag]) {
      return {
        allowed: false,
        statusCode: 403,
        reason: `GRANULAR_PERMISSION_DENIED: Role '${roleTier}' lacks required permission '${String(
          requiredPermissionFlag
        )}' in store '${targetStore.name}'.`,
        resolvedRoleTier: roleTier,
      };
    }
    return {
      allowed: true,
      statusCode: 200,
      reason: `Authorized via granular permission '${String(requiredPermissionFlag)}'.`,
      resolvedRoleTier: roleTier,
    };
  }

  const candidateFlags = operationPermissionMap[operation] || [];
  const hasAnyMatchingFlag =
    candidateFlags.length === 0 || candidateFlags.some((flag) => Boolean(perms[flag]));

  if (!hasAnyMatchingFlag) {
    return {
      allowed: false,
      statusCode: 403,
      reason: `GRANULAR_PERMISSION_DENIED: Member '${memberRecord.name}' (${roleTier}) is not granted permission for '${operation}' in store '${targetStore.name}'.`,
      resolvedRoleTier: roleTier,
    };
  }

  return {
    allowed: true,
    statusCode: 200,
    reason: `Authorized as ${roleTier} in store '${targetStore.name}'.`,
    resolvedRoleTier: roleTier,
  };
}

/**
 * Returns ONLY the stores a user is explicitly authorized to manage (as Owner, Store Admin, or Employee).
 * Never assumes that access to one store grants access to another.
 */
export function getAuthorizedStoresForUser(
  user:
    | {
        id?: string;
        name?: string;
        email?: string;
        role?: string;
        storeName?: string;
        ownedStoreIds?: string[];
      }
    | null
    | undefined,
  stores: MerchantStore[]
): {
  store: MerchantStore;
  roleTier: StoreRoleTier;
  roleLabel: string;
}[] {
  if (!user || !user.email) return [];
  const results: { store: MerchantStore; roleTier: StoreRoleTier; roleLabel: string }[] = [];

  for (const st of stores || []) {
    if (!st) continue;
    const persona = resolveContextualPublicPersona({
      user,
      targetStoreId: st.id,
      stores,
    });
    if (persona.hasAdministrativeAccessToTargetStore && persona.authorizedRoleInTargetStore) {
      results.push({
        store: st,
        roleTier: persona.authorizedRoleInTargetStore,
        roleLabel:
          persona.authorizedRoleInTargetStore === "owner"
            ? "Store Owner"
            : persona.authorizedRoleInTargetStore === "store_admin"
            ? "Store Administrator"
            : "Store Employee",
      });
    }
  }
  return results;
}

// ============================================================================
// 12. TWO-LEVEL CAMPAIGN STUDIO & DISABLED-BY-DEFAULT YUME ADS ENGINE
// ============================================================================

const INITIAL_CAMPAIGNS: CampaignRecord[] = [
  {
    id: "camp_platform_dz_nov1",
    marketId: "DZ",
    storeId: null,
    ownerUserId: "platform_admin",
    title: "YUME Algeria • November Artisanal Heritage Showcase",
    subtitle: "Official Platform-Wide Campaign celebrating Algerian creators across 58 Wilayas.",
    badgeText: "OFFICIAL YUME CAMPAIGN",
    promoCode: "DZHERITAGE20",
    discountPercent: 20,
    visibilityLevel: "platform_wide",
    creationMode: "yume_template",
    templateId: "tpl_national_pride",
    linkedEventId: "dz_nov_1_revolution",
    startDate: "2026-10-28",
    endDate: "2026-12-31",
    status: "active",
    accentColorHex: "#15803D",
    ornamentPattern: "maghrebi_zellige",
    participatingProductIds: ["p1", "p2", "p3"],
    merchantNominations: [
      {
        storeId: "store_1",
        storeName: "Casbah Luxe Artisans",
        marketId: "DZ",
        productIds: ["p1", "p2"],
        submittedAt: "2026-11-01T10:00:00Z",
        status: "approved",
      },
    ],
    createdAt: "2026-11-01T09:00:00Z",
    updatedAt: "2026-11-01T09:00:00Z",
  },
  {
    id: "camp_store_1_exclusive",
    marketId: "DZ",
    storeId: "store_1",
    storeName: "Casbah Luxe Artisans",
    ownerUserId: "owner_store_1",
    title: "Casbah Atelier • Autumn Handcrafted Selection",
    subtitle: "Exclusive storefront promotion on our signature Algerian ceramics and textiles.",
    badgeText: "STORE EXCLUSIVE • -15%",
    promoCode: "CASBAH15",
    discountPercent: 15,
    visibilityLevel: "store_only",
    creationMode: "yume_template",
    templateId: "tpl_cultural_artisan",
    startDate: "2026-11-01",
    endDate: "2026-12-31",
    status: "active",
    accentColorHex: "#C85A32",
    ornamentPattern: "maghrebi_zellige",
    participatingProductIds: ["p1", "p2"],
    createdAt: "2026-11-02T10:00:00Z",
    updatedAt: "2026-11-02T10:00:00Z",
  },
  {
    id: "camp_ad_dz_sandbox_1",
    marketId: "DZ",
    storeId: "store_1",
    storeName: "Casbah Luxe Artisans",
    ownerUserId: "owner_store_1",
    title: "Casbah Luxe • Sponsored Artisan Spotlight",
    subtitle: "Admin sandbox preview ad — disabled by default for public shoppers.",
    badgeText: "SPONSORED PREVIEW",
    discountPercent: 10,
    visibilityLevel: "sponsored_ad",
    creationMode: "yume_template",
    templateId: "tpl_flash_velocity",
    startDate: "2026-11-01",
    endDate: "2026-12-31",
    status: "active",
    adApprovalStatus: "pending_admin_review",
    accentColorHex: "#1E3A8A",
    ornamentPattern: "maghrebi_zellige",
    participatingProductIds: ["p1"],
    createdAt: "2026-11-03T10:00:00Z",
    updatedAt: "2026-11-03T10:00:00Z",
  },
];

/**
 * Public Paid Advertising (Level 3 YUME Ads) is DISABLED BY DEFAULT.
 * Only Platform Admin can toggle or approve paid advertising campaigns.
 */
export function isPublicPaidAdvertisingEnabled(): boolean {
  try {
    return readStorageItem(PAID_ADS_ENABLED_KEY) === "true";
  } catch {}
  return false; // Strictly disabled by default
}

export function setPublicPaidAdvertisingEnabled(
  enabled: boolean,
  actorRole: "platform_admin" | "merchant" = "platform_admin"
): { success: boolean; error?: string } {
  if (actorRole !== "platform_admin") {
    return {
      success: false,
      error: "PERMISSION_DENIED: Only Platform Admin can enable or disable public paid advertising.",
    };
  }
  try {
    writeStorageItem(PAID_ADS_ENABLED_KEY, enabled ? "true" : "false");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("yume-ads-governance-updated", { detail: { enabled } }));
      window.dispatchEvent(new CustomEvent("yume-global-architecture-updated"));
    }
  } catch {}
  return { success: true };
}

export function getAllCampaigns(): CampaignRecord[] {
  try {
    const saved = readStorageItem(CAMPAIGNS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const byId = new Map<string, CampaignRecord>();
        INITIAL_CAMPAIGNS.forEach((c) => byId.set(c.id, c));
        parsed.forEach((c: CampaignRecord) => {
          if (c && c.id) byId.set(c.id, c);
        });
        return Array.from(byId.values());
      }
    }
  } catch {}
  return [...INITIAL_CAMPAIGNS];
}

export function saveAllCampaigns(campaigns: CampaignRecord[]): void {
  try {
    writeStorageItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("yume-campaigns-updated"));
      window.dispatchEvent(new CustomEvent("yume-global-architecture-updated"));
    }
  } catch {}
}

/**
 * Validates whether a user/merchant can create, modify, or delete a campaign.
 * Enforces that one merchant can NEVER modify another merchant's campaign,
 * and only Platform Admin can create or modify Level 2 Platform-Wide campaigns.
 */
export function validateCampaignOperation(params: {
  actorUser?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    storeName?: string;
    ownedStoreIds?: string[];
    isPlatformAdmin?: boolean;
  } | null;
  targetCampaign: Partial<CampaignRecord>;
  existingCampaign?: CampaignRecord | null;
  stores: MerchantStore[];
  activeStaffMemberId?: string | null;
}): AuthorizationDecision {
  const { actorUser, targetCampaign, existingCampaign, stores, activeStaffMemberId } = params;

  if (!actorUser || (!actorUser.email && !actorUser.id)) {
    return {
      allowed: false,
      statusCode: 401,
      reason: "UNAUTHENTICATED: Sign in required to manage campaigns.",
      resolvedRoleTier: null,
    };
  }

  if (actorUser.isPlatformAdmin || actorUser.role === "PlatformAdmin") {
    return {
      allowed: true,
      statusCode: 200,
      reason: "Authorized as Platform Admin.",
      resolvedRoleTier: "platform_admin",
    };
  }

  // Platform-wide campaigns are strictly controlled by Platform Admin
  if (
    targetCampaign.visibilityLevel === "platform_wide" ||
    existingCampaign?.visibilityLevel === "platform_wide"
  ) {
    return {
      allowed: false,
      statusCode: 403,
      reason:
        "PLATFORM_CAMPAIGN_PROTECTED: Official Platform-Wide campaigns are controlled exclusively by YUME Platform Admin.",
      resolvedRoleTier: null,
    };
  }

  const targetStoreId = existingCampaign?.storeId || targetCampaign.storeId;
  if (!targetStoreId) {
    return {
      allowed: false,
      statusCode: 403,
      reason: "MISSING_STORE_BOUNDARY: Merchant campaigns must be bound to an authorized storeId.",
      resolvedRoleTier: null,
    };
  }

  // Prevent cross-store tampering if existingCampaign belongs to a different store
  if (
    existingCampaign &&
    existingCampaign.storeId &&
    targetCampaign.storeId &&
    existingCampaign.storeId !== targetCampaign.storeId
  ) {
    return {
      allowed: false,
      statusCode: 403,
      reason: "CROSS_TENANT_VIOLATION: Cannot transfer a campaign across stores.",
      resolvedRoleTier: null,
    };
  }

  const targetStore = (stores || []).find((s) => s && s.id === targetStoreId);
  if (!targetStore) {
    // If stores array was not passed in standalone studio context, verify direct ownership match
    if (
      Array.isArray(actorUser.ownedStoreIds) &&
      actorUser.ownedStoreIds.includes(String(targetStoreId))
    ) {
      return {
        allowed: true,
        statusCode: 200,
        reason: "Authorized as Store Owner.",
        resolvedRoleTier: "owner",
      };
    }
    return {
      allowed: false,
      statusCode: 403,
      reason: `STORE_NOT_FOUND: Store '${targetStoreId}' does not exist or actor lacks ownership.`,
      resolvedRoleTier: null,
    };
  }

  return authorizeStoreOperation({
    user: actorUser,
    targetStore,
    stores,
    operation: "manage_campaigns",
    activeStaffMemberId,
  });
}

/**
 * LEVEL 1 DISPLAY:
 * Returns active campaigns visible inside a specific Merchant Storefront (`storeId`).
 * Includes:
 * 1. The store's own active `store_only` campaigns (never other stores' campaigns!).
 * 2. Official `platform_wide` campaigns in the same market where this store has an approved product nomination.
 */
export function getStorefrontActiveCampaigns(
  storeId: string,
  marketCountryOrCode: string,
  allCampaigns: CampaignRecord[] = getAllCampaigns()
): CampaignRecord[] {
  const market = getMarketByCountryOrCode(marketCountryOrCode);
  return allCampaigns.filter((c) => {
    if (c.status !== "active") return false;
    if (c.marketId !== market.id) return false;

    if (c.visibilityLevel === "store_only") {
      return c.storeId === storeId;
    }

    if (c.visibilityLevel === "platform_wide") {
      return (c.merchantNominations || []).some(
        (nom) => nom.storeId === storeId && nom.status === "approved"
      );
    }

    return false;
  });
}

/**
 * LEVEL 2 DISPLAY:
 * Returns official Platform-Wide campaigns visible in the public Marketplace for the active market.
 * Store-level campaigns (`store_only`) NEVER automatically appear in the public Marketplace.
 */
export function getMarketplacePlatformCampaigns(
  marketCountryOrCode: string,
  allCampaigns: CampaignRecord[] = getAllCampaigns()
): CampaignRecord[] {
  const market = getMarketByCountryOrCode(marketCountryOrCode);
  return allCampaigns.filter(
    (c) =>
      c.status === "active" &&
      c.marketId === market.id &&
      c.visibilityLevel === "platform_wide"
  );
}

/**
 * LEVEL 3 DISPLAY (YUME ADS):
 * Returns sponsored ad campaigns for the active market.
 * By default, public paid advertising is DISABLED (`isPublicPaidAdvertisingEnabled() === false`),
 * so this returns `[]` for public shoppers unless Platform Admin explicitly enables paid ads
 * and approves the campaign (or when `adminPreviewMode === true`).
 */
export function getVisibleSponsoredAds(
  marketCountryOrCode: string,
  options?: { adminPreviewMode?: boolean; isPlatformAdminPreview?: boolean; allCampaigns?: CampaignRecord[] }
): CampaignRecord[] {
  const market = getMarketByCountryOrCode(marketCountryOrCode);
  const campaigns = options?.allCampaigns || getAllCampaigns();
  const publicEnabled = isPublicPaidAdvertisingEnabled();
  const isPreview = Boolean(options?.adminPreviewMode || options?.isPlatformAdminPreview);

  if (!publicEnabled && !isPreview) {
    return [];
  }

  return campaigns.filter((c) => {
    if (c.marketId !== market.id) return false;
    if (c.visibilityLevel !== "sponsored_ad") return false;
    if (isPreview) return true;
    return c.status === "active" && c.adApprovalStatus === "approved";
  });
}

// ============================================================================
// 13. ADDITIONAL STUDIO & GOVERNANCE HELPERS
// ============================================================================

export const DEFAULT_GLOBAL_MARKETS = INITIAL_GLOBAL_MARKETS;
export const saveMarketConfigs = saveAllMarketConfigs;
export const getAllCulturalEvents = getAllMarketEvents;

export function getTemplatesForMarket(marketCountryOrCode: string): YumeReadyTemplate[] {
  const market = getMarketByCountryOrCode(marketCountryOrCode);
  return YUME_READY_CAMPAIGN_TEMPLATES.filter(
    (tpl) => tpl.category !== "islamic_platform" || market.isMuslimMarket
  );
}

export function upsertMarketCulturalEvent(
  event: MarketEvent,
  options?: { isPlatformAdmin?: boolean; actorStoreId?: string }
): EventPolicyValidationResult {
  const actorRole = options?.isPlatformAdmin ? "platform_admin" : "merchant";
  const check = validateCulturalEventPolicy(event, actorRole);
  if (!check.valid) return check;

  if (!options?.isPlatformAdmin) {
    if (event.controlScope !== "merchant_store_exclusive" || !event.storeId) {
      return {
        valid: false,
        error: "Merchants can only create private store-exclusive events for their own store.",
      };
    }
    if (options?.actorStoreId && String(event.storeId) !== String(options.actorStoreId)) {
      return {
        valid: false,
        error: "TENANT_ISOLATION_DENIED: Cannot create an event for another merchant's store.",
      };
    }
  }

  const current = getAllMarketEvents();
  const idx = current.findIndex((e) => e.id === event.id);
  const next = idx !== -1 ? current.map((e, i) => (i === idx ? event : e)) : [...current, event];
  saveAllMarketEvents(next);
  return { valid: true };
}

export function toggleIslamicOccasionForceActive(
  eventId: string,
  forceActive: boolean
): MarketEvent[] {
  const current = getAllMarketEvents();
  const next = current.map((e) =>
    e.id === eventId && e.category === "religious" && e.religionType === "islamic"
      ? { ...e, forceActiveByAdmin: forceActive }
      : e
  );
  saveAllMarketEvents(next);
  return next;
}

export function saveCampaignWithValidation(
  campaign: CampaignRecord,
  actor: {
    actorId?: string;
    actorEmail?: string;
    isPlatformAdmin?: boolean;
    stores?: MerchantStore[];
  }
): AuthorizationDecision {
  const all = getAllCampaigns();
  const existing = all.find((c) => c.id === campaign.id) || null;

  const decision = validateCampaignOperation({
    actorUser: {
      id: actor.actorId || actor.actorEmail || "actor",
      email: actor.actorEmail || `${actor.actorId || "actor"}@yume.shop`,
      isPlatformAdmin: actor.isPlatformAdmin,
      ownedStoreIds: campaign.storeId ? [String(campaign.storeId)] : [],
    },
    targetCampaign: campaign,
    existingCampaign: existing,
    stores: actor.stores || [],
  });

  if (!decision.allowed) return decision;

  const idx = all.findIndex((c) => c.id === campaign.id);
  const next = idx !== -1 ? all.map((c, i) => (i === idx ? campaign : c)) : [campaign, ...all];
  saveAllCampaigns(next);
  return decision;
}

export function deleteCampaignForTenant(
  campaignId: string,
  storeId: string,
  isPlatformAdmin = false
): AuthorizationDecision {
  const all = getAllCampaigns();
  const target = all.find((c) => c.id === campaignId);
  if (!target) {
    return {
      allowed: false,
      statusCode: 403,
      reason: "Campaign not found.",
      resolvedRoleTier: null,
    };
  }
  if (!isPlatformAdmin && String(target.storeId) !== String(storeId)) {
    return {
      allowed: false,
      statusCode: 403,
      reason: "CROSS_TENANT_VIOLATION: Cannot delete another store's campaign.",
      resolvedRoleTier: null,
    };
  }
  saveAllCampaigns(all.filter((c) => c.id !== campaignId));
  return {
    allowed: true,
    statusCode: 200,
    reason: "Campaign deleted.",
    resolvedRoleTier: isPlatformAdmin ? "platform_admin" : "owner",
  };
}

export function nominateProductsForPlatformCampaign(params: {
  campaignId: string;
  storeId: string;
  storeName: string;
  marketId?: string;
  productIds: (string | number)[];
}): AuthorizationDecision {
  const all = getAllCampaigns();
  const target = all.find((c) => c.id === params.campaignId);
  if (!target || target.visibilityLevel !== "platform_wide") {
    return {
      allowed: false,
      statusCode: 403,
      reason: "Platform campaign not found.",
      resolvedRoleTier: null,
    };
  }
  const existingNoms = target.merchantNominations || [];
  const filteredNoms = existingNoms.filter((n) => String(n.storeId) !== String(params.storeId));
  const updatedCampaign: CampaignRecord = {
    ...target,
    merchantNominations: [
      ...filteredNoms,
      {
        storeId: String(params.storeId),
        storeName: params.storeName,
        marketId: params.marketId || target.marketId,
        productIds: params.productIds.map((id) => String(id)),
        submittedAt: new Date().toISOString(),
        status: "pending",
      },
    ],
    updatedAt: new Date().toISOString(),
  };
  saveAllCampaigns(all.map((c) => (c.id === target.id ? updatedCampaign : c)));
  return {
    allowed: true,
    statusCode: 200,
    reason: "Products nominated for Official Platform Campaign.",
    resolvedRoleTier: "owner",
  };
}

export function approvePlatformCampaignNomination(params: {
  campaignId: string;
  storeId: string;
  approve: boolean;
  isPlatformAdmin?: boolean;
}): AuthorizationDecision {
  if (!params.isPlatformAdmin) {
    return {
      allowed: false,
      statusCode: 403,
      reason: "Only Platform Admin can approve platform campaign nominations.",
      resolvedRoleTier: null,
    };
  }
  const all = getAllCampaigns();
  const target = all.find((c) => c.id === params.campaignId);
  if (!target) {
    return {
      allowed: false,
      statusCode: 403,
      reason: "Campaign not found.",
      resolvedRoleTier: null,
    };
  }
  const nominations = (target.merchantNominations || []).map((nom) =>
    String(nom.storeId) === String(params.storeId)
      ? { ...nom, status: (params.approve ? "approved" : "rejected") as "approved" | "rejected" }
      : nom
  );
  const approvedProductIds = new Set(target.participatingProductIds || []);
  nominations
    .filter((n) => n.status === "approved")
    .forEach((n) => n.productIds.forEach((pid) => approvedProductIds.add(String(pid))));

  const updated: CampaignRecord = {
    ...target,
    merchantNominations: nominations,
    participatingProductIds: Array.from(approvedProductIds),
    updatedAt: new Date().toISOString(),
  };
  saveAllCampaigns(all.map((c) => (c.id === target.id ? updated : c)));
  return {
    allowed: true,
    statusCode: 200,
    reason: "Nomination status updated.",
    resolvedRoleTier: "platform_admin",
  };
}

export function getYumeAdsSystemConfig(): { publicPaidAdvertisingEnabled: boolean } {
  return {
    publicPaidAdvertisingEnabled: isPublicPaidAdvertisingEnabled(),
  };
}

export function updateYumeAdsSystemConfig(
  config: { publicPaidAdvertisingEnabled: boolean },
  actor: { isPlatformAdmin?: boolean; adminEmail?: string }
): AuthorizationDecision {
  const res = setPublicPaidAdvertisingEnabled(
    config.publicPaidAdvertisingEnabled,
    actor.isPlatformAdmin ? "platform_admin" : "merchant"
  );
  if (!res.success) {
    return {
      allowed: false,
      statusCode: 403,
      reason: res.error || "Unauthorized",
      resolvedRoleTier: null,
    };
  }
  return {
    allowed: true,
    statusCode: 200,
    reason: "YUME Ads system configuration updated.",
    resolvedRoleTier: "platform_admin",
  };
}

