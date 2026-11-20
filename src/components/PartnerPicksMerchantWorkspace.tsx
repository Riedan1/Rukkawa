import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Check,
  X,
  Store,
  Package,
  LayoutGrid,
  FileCheck,
  BarChart3,
  Clock,
  Maximize2,
  Minimize2,
  ExternalLink,
  Trash2,
  Eye,
  ArrowRight,
  MapPin,
  Tag,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type {
  MerchantPartnerPicksProfile,
  MerchantStore,
  PartnerPickChannelId,
  PartnerPickProductPlacement,
  PartnerPickProposedOption,
  PartnerPicksBidirectionalExposureLedger,
  PartnerPicksGlobalConfig,
  PartnerPicksPartnership,
  Product,
} from "../types";
import {
  PARTNER_PICK_CHANNEL_IDS,
  createDefaultMerchantPartnerPicksProfile,
  createInitialBidirectionalExposureLedger,
} from "../utils/partnerPicksSchema";
import {
  evaluatePartnerPicksActorPermission,
  type PartnerPicksActorIdentity,
} from "../utils/partnerPicksEligibility";
import { resolveStoreSubscriptionPlan } from "../utils/platformPermissionsConfig";

export interface PartnerPicksMerchantWorkspaceProps {
  currentStore: MerchantStore;
  allStores: MerchantStore[];
  currentUser?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  } | null;
  globalConfig: PartnerPicksGlobalConfig;
  profilesByStoreId: Record<string, Partial<MerchantPartnerPicksProfile>>;
  partnerships: PartnerPicksPartnership[];
  placements: PartnerPickProductPlacement[];
  exposureLedgers: Record<string, PartnerPicksBidirectionalExposureLedger>;
  storiesEnabledMap?: Record<string, boolean>;
  isDarkMode?: boolean;
  lang?: "en" | "ar" | "fr";
  initialPartnershipId?: string | null;
  onSaveProfile: (
    storeId: string,
    profile: Partial<MerchantPartnerPicksProfile>
  ) => Promise<void>;
  onSendPartnershipRequest: (payload: {
    initiatorStoreId: string;
    targetStoreId: string;
    durationDays: number;
    proposedChannels: Record<PartnerPickChannelId, boolean>;
    requestMessage: string;
  }) => Promise<void>;
  onRespondToPartnership: (
    partnershipId: string,
    actingStoreId: string,
    decision: "ACCEPT" | "REJECT" | "CANCEL"
  ) => Promise<void>;
  onProposePlacement: (payload: {
    partnershipId: string;
    sourceStoreId: string;
    hostStoreId: string;
    productId: string;
    channelId: PartnerPickChannelId;
    proposedOptions: PartnerPickProposedOption[];
  }) => Promise<void>;
  onHostSelectPlacement: (
    placementId: string,
    decision: "SELECT" | "REJECT",
    selectedOptionId?: string | null,
    note?: string
  ) => Promise<void>;
  onProposerConfirmPlacement: (
    placementId: string,
    decision: "APPROVE" | "REJECT",
    note?: string
  ) => Promise<void>;
  onRemovePlacement?: (placementId: string) => Promise<void>;
  onViewStore?: (store: MerchantStore) => void;
}

export type PartnerPicksSectionId =
  | "partners"
  | "shared-products"
  | "placement-map"
  | "agreement"
  | "statistics"
  | "history";

export type WorkspaceSizeMode = "standard" | "expanded" | "fullscreen";

interface DiscoverStoreSummary {
  id: string;
  name: string;
  logoUrl?: string;
  bannerUrl?: string;
  description: string;
  category: string;
  wilaya: string;
  rating: number;
  verified: boolean;
  productCount: number;
}

interface PlacementSlotTemplate {
  optionId: string;
  channelId: PartnerPickChannelId;
  title: string;
  subtitle: string;
  bannerSlotIndex?: number;
  gridCoordinate?: { row: number; col: number };
  discoverCarouselIndex?: number;
  sequentialPositionHint?: "EARLY" | "MID_SEQUENCE" | "TAIL";
  isNativePreview?: boolean;
}

const CHANNEL_LABELS: Record<
  PartnerPickChannelId,
  { title: string; subtitle: string }
> = {
  STORE_BANNER: {
    title: "Store Banner",
    subtitle: "Top header showcase cards on the partner storefront",
  },
  PRODUCT_GRID: {
    title: "Store Product Grid",
    subtitle: "In-grid product cards inside the partner catalog",
  },
  DISCOVER_MORE: {
    title: "Discover More Products",
    subtitle: "Bottom product recommendation strip on product pages",
  },
  REELS_FEED: {
    title: "Reels",
    subtitle: "Vertical video product showcase in the partner reels feed",
  },
  STORIES: {
    title: "Stories",
    subtitle: "Full-screen story slides in the partner stories ring",
  },
};

function getChannelSlotTemplates(
  channelId: PartnerPickChannelId
): PlacementSlotTemplate[] {
  switch (channelId) {
    case "STORE_BANNER":
      return [
        {
          optionId: "native_banner_0",
          channelId: "STORE_BANNER",
          title: "Partner Store Product",
          subtitle: "Reserved for partner store",
          bannerSlotIndex: 0,
          isNativePreview: true,
        },
        {
          optionId: "opt_banner_slot_1",
          channelId: "STORE_BANNER",
          title: "Banner Placement 1",
          subtitle: "Center header showcase card",
          bannerSlotIndex: 1,
        },
        {
          optionId: "opt_banner_slot_2",
          channelId: "STORE_BANNER",
          title: "Banner Placement 2",
          subtitle: "Right header showcase card",
          bannerSlotIndex: 2,
        },
      ];
    case "PRODUCT_GRID":
      return [
        {
          optionId: "native_grid_r1_c1",
          channelId: "PRODUCT_GRID",
          title: "Partner Store Product",
          subtitle: "Row 1 · Column 1",
          isNativePreview: true,
        },
        {
          optionId: "opt_grid_r1_c2",
          channelId: "PRODUCT_GRID",
          title: "Grid Placement 1",
          subtitle: "Row 1 · Column 2",
          gridCoordinate: { row: 1, col: 2 },
        },
        {
          optionId: "opt_grid_r1_c3",
          channelId: "PRODUCT_GRID",
          title: "Grid Placement 2",
          subtitle: "Row 1 · Column 3",
          gridCoordinate: { row: 1, col: 3 },
        },
        {
          optionId: "opt_grid_r2_c1",
          channelId: "PRODUCT_GRID",
          title: "Grid Placement 3",
          subtitle: "Row 2 · Column 1",
          gridCoordinate: { row: 2, col: 1 },
        },
        {
          optionId: "native_grid_r2_c2",
          channelId: "PRODUCT_GRID",
          title: "Partner Store Product",
          subtitle: "Row 2 · Column 2",
          isNativePreview: true,
        },
        {
          optionId: "opt_grid_r2_c3",
          channelId: "PRODUCT_GRID",
          title: "Grid Placement 4",
          subtitle: "Row 2 · Column 3",
          gridCoordinate: { row: 2, col: 3 },
        },
      ];
    case "DISCOVER_MORE":
      return [
        {
          optionId: "opt_discover_slot_0",
          channelId: "DISCOVER_MORE",
          title: "Recommendation Card 1",
          subtitle: "First Discover More position",
          discoverCarouselIndex: 0,
        },
        {
          optionId: "opt_discover_slot_1",
          channelId: "DISCOVER_MORE",
          title: "Recommendation Card 2",
          subtitle: "Second Discover More position",
          discoverCarouselIndex: 1,
        },
        {
          optionId: "opt_discover_slot_2",
          channelId: "DISCOVER_MORE",
          title: "Recommendation Card 3",
          subtitle: "Third Discover More position",
          discoverCarouselIndex: 2,
        },
        {
          optionId: "opt_discover_slot_3",
          channelId: "DISCOVER_MORE",
          title: "Recommendation Card 4",
          subtitle: "Fourth Discover More position",
          discoverCarouselIndex: 3,
        },
      ];
    case "REELS_FEED":
      return [
        {
          optionId: "opt_reels_early",
          channelId: "REELS_FEED",
          title: "Opening Reels Placement",
          subtitle: "Shown early in the reels stream",
          sequentialPositionHint: "EARLY",
        },
        {
          optionId: "opt_reels_mid",
          channelId: "REELS_FEED",
          title: "Featured Reels Placement",
          subtitle: "Shown mid-stream in the reels feed",
          sequentialPositionHint: "MID_SEQUENCE",
        },
        {
          optionId: "opt_reels_tail",
          channelId: "REELS_FEED",
          title: "Closing Reels Placement",
          subtitle: "Shown later in the reels stream",
          sequentialPositionHint: "TAIL",
        },
      ];
    case "STORIES":
      return [
        {
          optionId: "opt_stories_early",
          channelId: "STORIES",
          title: "Opening Story Slide",
          subtitle: "Early slide in the stories viewer",
          sequentialPositionHint: "EARLY",
        },
        {
          optionId: "opt_stories_mid",
          channelId: "STORIES",
          title: "Featured Story Slide",
          subtitle: "Middle slide in the stories viewer",
          sequentialPositionHint: "MID_SEQUENCE",
        },
        {
          optionId: "opt_stories_tail",
          channelId: "STORIES",
          title: "Closing Story Slide",
          subtitle: "Final slide in the stories viewer",
          sequentialPositionHint: "TAIL",
        },
      ];
  }
}

/**
 * Resolves product regular price, discounted price, and discount percentage cleanly in DA.
 */
export function resolveProductPriceInfo(product: Product): {
  hasDiscount: boolean;
  regularPrice: number;
  finalPrice: number;
  discountPercent: number;
} {
  const rawPrice = Number(product.price) || 0;
  const rawOriginal = Number(product.originalPrice) || 0;
  const rawSale = Number((product as any).salePrice) || 0;
  const rawDiscountPct = Number((product as any).discount) || 0;

  if (rawSale > 0 && rawSale < rawPrice) {
    const pct = Math.round(((rawPrice - rawSale) / rawPrice) * 100);
    return {
      hasDiscount: pct > 0,
      regularPrice: rawPrice,
      finalPrice: rawSale,
      discountPercent: pct,
    };
  }

  if (rawOriginal > rawPrice && rawPrice > 0) {
    const pct =
      rawDiscountPct > 0
        ? Math.round(rawDiscountPct)
        : Math.round(((rawOriginal - rawPrice) / rawOriginal) * 100);
    return {
      hasDiscount: pct > 0,
      regularPrice: rawOriginal,
      finalPrice: rawPrice,
      discountPercent: pct,
    };
  }

  if (rawDiscountPct > 0 && rawDiscountPct < 100 && rawPrice > 0) {
    const computedFinal = Math.round(rawPrice * (1 - rawDiscountPct / 100));
    return {
      hasDiscount: true,
      regularPrice: rawPrice,
      finalPrice: computedFinal,
      discountPercent: Math.round(rawDiscountPct),
    };
  }

  return {
    hasDiscount: false,
    regularPrice: rawPrice,
    finalPrice: rawPrice,
    discountPercent: 0,
  };
}

function formatDinar(amount: number): string {
  return `${Math.round(amount).toLocaleString()} DA`;
}

function formatSimpleDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export const PartnerPicksMerchantWorkspace: React.FC<
  PartnerPicksMerchantWorkspaceProps
> = ({
  currentStore,
  allStores,
  currentUser,
  globalConfig,
  profilesByStoreId,
  partnerships,
  placements,
  exposureLedgers,
  initialPartnershipId,
  onSaveProfile,
  onSendPartnershipRequest,
  onRespondToPartnership,
  onProposePlacement,
  onHostSelectPlacement,
  onProposerConfirmPlacement,
  onRemovePlacement,
  onViewStore,
}) => {
  const [activeSection, setActiveSection] =
    useState<PartnerPicksSectionId>("partners");
  const [sizeMode, setSizeMode] = useState<WorkspaceSizeMode>("standard");

  // Discover Partner Stores search & pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedWilaya, setSelectedWilaya] = useState("ALL");
  const [discoverPage, setDiscoverPage] = useState(1);
  const [serverSearchStores, setServerSearchStores] = useState<
    DiscoverStoreSummary[] | null
  >(null);
  const [serverHasMore, setServerHasMore] = useState(false);
  const [isSearchingStores, setIsSearchingStores] = useState(false);

  // Partnership request inline modal state
  const [requestModalTargetStore, setRequestModalTargetStore] =
    useState<DiscoverStoreSummary | null>(null);
  const [requestDurationDays, setRequestDurationDays] = useState<number>(30);
  const [requestMessage, setRequestMessage] = useState<string>("");

  // Active partner store / partnership context
  const myPartnerships = useMemo(
    () =>
      partnerships.filter(
        (p) => p.storeAId === currentStore.id || p.storeBId === currentStore.id
      ),
    [partnerships, currentStore.id]
  );

  const [selectedPartnershipId, setSelectedPartnershipId] = useState<string>(
    () => {
      if (
        initialPartnershipId &&
        myPartnerships.some((p) => p.id === initialPartnershipId)
      ) {
        return initialPartnershipId;
      }
      const activeOne = myPartnerships.find((p) => p.status === "ACTIVE");
      return activeOne?.id || myPartnerships[0]?.id || "";
    }
  );

  useEffect(() => {
    if (
      initialPartnershipId &&
      myPartnerships.some((p) => p.id === initialPartnershipId)
    ) {
      setSelectedPartnershipId(initialPartnershipId);
    } else if (
      !selectedPartnershipId ||
      !myPartnerships.some((p) => p.id === selectedPartnershipId)
    ) {
      const activeOne = myPartnerships.find((p) => p.status === "ACTIVE");
      setSelectedPartnershipId(activeOne?.id || myPartnerships[0]?.id || "");
    }
  }, [initialPartnershipId, myPartnerships, selectedPartnershipId]);

  const activePartnership = useMemo(
    () =>
      myPartnerships.find((p) => p.id === selectedPartnershipId) ||
      myPartnerships[0] ||
      null,
    [myPartnerships, selectedPartnershipId]
  );

  const partnerStoreId = useMemo(() => {
    if (!activePartnership) return "";
    return activePartnership.storeAId === currentStore.id
      ? activePartnership.storeBId
      : activePartnership.storeAId;
  }, [activePartnership, currentStore.id]);

  const partnerStore = useMemo(
    () => allStores.find((s) => s.id === partnerStoreId) || null,
    [allStores, partnerStoreId]
  );

  // Actor permission evaluation (preserved backend/role security)
  const actorIdentity = useMemo<PartnerPicksActorIdentity>(() => {
    return {
      id: (currentUser as any)?.id || currentUser?.email || currentStore.ownerId,
      name: currentUser?.name,
      email: currentUser?.email,
      role: currentUser?.role || "merchant",
      storeId: currentStore.id,
      storeName: currentStore.name,
      ownedStoreIds: [currentStore.id],
    };
  }, [currentUser, currentStore]);

  const currentProfile = useMemo<MerchantPartnerPicksProfile>(() => {
    const raw = profilesByStoreId[currentStore.id];
    const base = createDefaultMerchantPartnerPicksProfile(
      currentStore.id,
      currentStore.ownerId
    );
    return {
      ...base,
      ...raw,
      storeId: currentStore.id,
    };
  }, [profilesByStoreId, currentStore.id, currentStore.ownerId]);

  const canManagePartnerships = useMemo(
    () =>
      evaluatePartnerPicksActorPermission({
        actor: actorIdentity,
        targetStore: currentStore,
        targetStoreProfile: currentProfile,
        action: "ACCEPT_OR_REJECT_PARTNERSHIP_REQUEST",
      }).allowed,
    [actorIdentity, currentStore, currentProfile]
  );

  const canProposePlacements = useMemo(
    () =>
      evaluatePartnerPicksActorPermission({
        actor: actorIdentity,
        targetStore: currentStore,
        targetStoreProfile: currentProfile,
        action: "PROPOSE_PLACEMENTS_AS_SOURCE",
      }).allowed,
    [actorIdentity, currentStore, currentProfile]
  );

  // Plan-based dynamic product limit
  const myPlanId = useMemo(
    () => resolveStoreSubscriptionPlan(currentStore),
    [currentStore]
  );
  const myPlanEntitlement = useMemo(() => {
    const ent = globalConfig.planEntitlements[myPlanId];
    return (
      ent || {
        planId: myPlanId,
        enabled: true,
        maxActivePartnerStores: 2,
        maxProductsPerPartnership: 3,
      }
    );
  }, [globalConfig.planEntitlements, myPlanId]);

  const maxSharedProductsLimit = Math.max(
    1,
    myPlanEntitlement.maxProductsPerPartnership || 3
  );

  // Selected shared product IDs for the current partnership (or default list)
  const selectedSharedProductIds = useMemo<string[]>(() => {
    if (
      activePartnership &&
      Array.isArray(
        currentProfile.sharedProductIdsByPartnership?.[activePartnership.id]
      )
    ) {
      return currentProfile.sharedProductIdsByPartnership![
        activePartnership.id
      ];
    }
    if (
      Array.isArray(currentProfile.defaultSharedProductIds) &&
      currentProfile.defaultSharedProductIds.length > 0
    ) {
      return currentProfile.defaultSharedProductIds;
    }
    return [];
  }, [activePartnership, currentProfile]);

  const selectedSharedProducts = useMemo<Product[]>(() => {
    const prods = currentStore.products || [];
    return selectedSharedProductIds
      .map((id) => prods.find((p) => p && p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [currentStore.products, selectedSharedProductIds]);

  // Placement Map states
  const [selectedMapChannel, setSelectedMapChannel] =
    useState<PartnerPickChannelId>("STORE_BANNER");
  const [selectedMapProductId, setSelectedMapProductId] = useState<string>("");
  const [activePopupSlot, setActivePopupSlot] =
    useState<PlacementSlotTemplate | null>(null);
  const [isArrangementPreview, setIsArrangementPreview] = useState(false);

  // Keep selectedMapProductId aligned with selectedSharedProducts
  useEffect(() => {
    if (
      selectedSharedProducts.length > 0 &&
      !selectedSharedProducts.some((p) => p.id === selectedMapProductId)
    ) {
      setSelectedMapProductId(selectedSharedProducts[0].id);
    } else if (selectedSharedProducts.length === 0) {
      setSelectedMapProductId("");
    }
  }, [selectedSharedProducts, selectedMapProductId]);

  // Status banner feedback
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const showNotice = useCallback(
    (type: "success" | "error", text: string) => {
      setFeedbackNotice({ type, text });
      window.setTimeout(() => {
        setFeedbackNotice((prev) => (prev?.text === text ? null : prev));
      }, 4000);
    },
    []
  );

  // Debounce search query (250ms) and query /api/partner-picks/stores/search
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setDiscoverPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setDiscoverPage(1);
  }, [selectedCategory, selectedWilaya]);

  useEffect(() => {
    let cancelled = false;
    const fetchStores = async () => {
      setIsSearchingStores(true);
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          category: selectedCategory,
          wilaya: selectedWilaya,
          excludeStoreId: currentStore.id,
          page: String(discoverPage),
          limit: "6",
        });
        const res = await fetch(
          `/api/partner-picks/stores/search?${params.toString()}`
        );
        if (!res.ok) throw new Error("Fallback to local stores");
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data?.stores)) {
          setServerSearchStores((prev) =>
            discoverPage === 1 || !prev
              ? data.stores
              : [
                  ...prev,
                  ...data.stores.filter(
                    (s: DiscoverStoreSummary) =>
                      !prev.some((existing) => existing.id === s.id)
                  ),
                ]
          );
          setServerHasMore(Boolean(data.hasMore));
        }
      } catch {
        if (!cancelled) {
          setServerSearchStores(null);
        }
      } finally {
        if (!cancelled) {
          setIsSearchingStores(false);
        }
      }
    };
    fetchStores();
    return () => {
      cancelled = true;
    };
  }, [
    debouncedQuery,
    selectedCategory,
    selectedWilaya,
    discoverPage,
    currentStore.id,
  ]);

  // Local fallback & enrichment for Discover Partner Stores so allStores in memory are always searchable too
  const allOtherStoresNormalized = useMemo<DiscoverStoreSummary[]>(() => {
    return allStores
      .filter((s) => s && s.id && s.id !== currentStore.id && !s.archived)
      .map((st) => ({
        id: st.id,
        name: st.name,
        logoUrl: st.logoUrl,
        bannerUrl: st.bannerUrl,
        description:
          st.description ||
          "Verified marketplace store ready for reciprocal product collaboration.",
        category: String(
          (st as any).category || st.products?.[0]?.category || "Marketplace"
        ),
        wilaya: String(st.wilaya || (st as any).location || "Alger"),
        rating: st.rating || 4.8,
        verified: Boolean(st.verified),
        productCount: Array.isArray(st.products) ? st.products.length : 0,
      }));
  }, [allStores, currentStore.id]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const s of allOtherStoresNormalized) {
      if (s.category) set.add(s.category);
    }
    return Array.from(set);
  }, [allOtherStoresNormalized]);

  const availableWilayas = useMemo(() => {
    const set = new Set<string>();
    for (const s of allOtherStoresNormalized) {
      if (s.wilaya) set.add(s.wilaya);
    }
    return Array.from(set);
  }, [allOtherStoresNormalized]);

  const localFilteredStores = useMemo(() => {
    return allOtherStoresNormalized.filter((st) => {
      if (
        selectedCategory !== "ALL" &&
        st.category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }
      if (
        selectedWilaya !== "ALL" &&
        st.wilaya.toLowerCase() !== selectedWilaya.toLowerCase()
      ) {
        return false;
      }
      if (debouncedQuery) {
        const q = debouncedQuery.toLowerCase();
        const hay =
          `${st.name} ${st.description} ${st.category} ${st.wilaya}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    allOtherStoresNormalized,
    selectedCategory,
    selectedWilaya,
    debouncedQuery,
  ]);

  const displayedDiscoverStores = useMemo<DiscoverStoreSummary[]>(() => {
    if (serverSearchStores && serverSearchStores.length > 0) {
      return serverSearchStores;
    }
    return localFilteredStores.slice(0, discoverPage * 6);
  }, [serverSearchStores, localFilteredStores, discoverPage]);

  const hasMoreDiscoverStores = useMemo(() => {
    if (serverSearchStores && serverSearchStores.length > 0) {
      return serverHasMore;
    }
    return displayedDiscoverStores.length < localFilteredStores.length;
  }, [
    serverSearchStores,
    serverHasMore,
    displayedDiscoverStores.length,
    localFilteredStores.length,
  ]);

  // Placements for the active partnership
  const partnershipPlacements = useMemo(
    () =>
      activePartnership
        ? placements.filter((pl) => pl.partnershipId === activePartnership.id)
        : [],
    [placements, activePartnership]
  );

  // My products placed on Partner Store
  const myPlacementsOnPartner = useMemo(
    () =>
      partnershipPlacements.filter(
        (pl) =>
          pl.sourceStoreId === currentStore.id &&
          pl.hostStoreId === partnerStoreId
      ),
    [partnershipPlacements, currentStore.id, partnerStoreId]
  );

  // Partner products placed on My Store
  const partnerPlacementsOnMyStore = useMemo(
    () =>
      partnershipPlacements.filter(
        (pl) =>
          pl.sourceStoreId === partnerStoreId &&
          pl.hostStoreId === currentStore.id
      ),
    [partnershipPlacements, partnerStoreId, currentStore.id]
  );

  // Handler: Toggle a product in Shared Products
  const handleToggleSharedProduct = async (productId: string) => {
    const isCurrentlySelected = selectedSharedProductIds.includes(productId);
    let nextIds: string[];

    if (isCurrentlySelected) {
      nextIds = selectedSharedProductIds.filter((id) => id !== productId);
    } else {
      if (selectedSharedProductIds.length >= maxSharedProductsLimit) {
        showNotice(
          "error",
          `Your current plan allows up to ${maxSharedProductsLimit} shared products.`
        );
        return;
      }
      nextIds = [...selectedSharedProductIds, productId];
    }

    setIsBusy(true);
    try {
      const nextByPartnership = {
        ...(currentProfile.sharedProductIdsByPartnership || {}),
      };
      if (activePartnership) {
        nextByPartnership[activePartnership.id] = nextIds;
      }
      await onSaveProfile(currentStore.id, {
        ...currentProfile,
        defaultSharedProductIds: nextIds,
        sharedProductIdsByPartnership: nextByPartnership,
      });
      showNotice(
        "success",
        isCurrentlySelected
          ? "Shared product removed."
          : "Shared product added."
      );
    } catch (err: any) {
      showNotice("error", err?.message || "Could not update shared products.");
    } finally {
      setIsBusy(false);
    }
  };

  // Handler: Assign or replace product in a Placement Map card slot
  const handleAssignProductToSlot = async (
    slot: PlacementSlotTemplate,
    productId: string
  ) => {
    if (!activePartnership || !partnerStore) {
      showNotice("error", "Please select or start a partner store first.");
      return;
    }
    if (!productId) {
      showNotice("error", "Please select a product from Shared Products.");
      return;
    }

    const proposedOption: PartnerPickProposedOption = {
      optionId: slot.optionId,
      channelId: slot.channelId,
      bannerSlotIndex: slot.bannerSlotIndex,
      gridCoordinate: slot.gridCoordinate,
      discoverCarouselIndex: slot.discoverCarouselIndex,
      sequentialPositionHint: slot.sequentialPositionHint,
      label: `${CHANNEL_LABELS[slot.channelId].title} · ${slot.title}`,
    };

    setIsBusy(true);
    try {
      await onProposePlacement({
        partnershipId: activePartnership.id,
        sourceStoreId: currentStore.id,
        hostStoreId: partnerStore.id,
        productId,
        channelId: slot.channelId,
        proposedOptions: [proposedOption],
      });
      setActivePopupSlot(null);
      showNotice("success", `Assigned product to ${slot.title}.`);
    } catch (err: any) {
      showNotice("error", err?.message || "Could not assign placement.");
    } finally {
      setIsBusy(false);
    }
  };

  // Handler: Remove product from a Placement Map card slot
  const handleRemoveProductFromSlot = async (
    placement: PartnerPickProductPlacement
  ) => {
    setIsBusy(true);
    try {
      if (onRemovePlacement) {
        await onRemovePlacement(placement.id);
      } else {
        await onProposerConfirmPlacement(
          placement.id,
          "REJECT",
          "Placement removed"
        );
      }
      showNotice("success", "Placement removed from slot.");
    } catch (err: any) {
      showNotice("error", err?.message || "Could not remove placement.");
    } finally {
      setIsBusy(false);
    }
  };

  // Handler: Submit a partnership request from Discover Partner Stores
  const handleConfirmSendPartnershipRequest = async () => {
    if (!requestModalTargetStore) return;
    setIsBusy(true);
    try {
      await onSendPartnershipRequest({
        initiatorStoreId: currentStore.id,
        targetStoreId: requestModalTargetStore.id,
        durationDays: requestDurationDays,
        proposedChannels: {
          STORE_BANNER: true,
          PRODUCT_GRID: true,
          DISCOVER_MORE: true,
          REELS_FEED: true,
          STORIES: true,
        },
        requestMessage:
          requestMessage.trim() ||
          `Partnership request from ${currentStore.name}`,
      });
      const targetName = requestModalTargetStore.name;
      setRequestModalTargetStore(null);
      setRequestMessage("");
      showNotice("success", `Partnership request sent to ${targetName}.`);
    } catch (err: any) {
      showNotice("error", err?.message || "Could not send partnership request.");
    } finally {
      setIsBusy(false);
    }
  };

  // Statistics ledger for active partnership
  const activeLedger = useMemo(() => {
    if (!activePartnership) return null;
    return (
      exposureLedgers[activePartnership.id] ||
      createInitialBidirectionalExposureLedger(
        activePartnership.id,
        activePartnership.storeAId,
        activePartnership.storeBId
      )
    );
  }, [activePartnership, exposureLedgers]);

  const statsComparison = useMemo(() => {
    if (!activePartnership || !activeLedger) {
      return {
        yourStore: {
          opportunities: 0,
          impressions: 0,
          clicks: 0,
          skips: 0,
          byChannel: {} as Record<
            PartnerPickChannelId,
            {
              opportunities: number;
              impressions: number;
              clicks: number;
              skips: number;
            }
          >,
        },
        partnerStore: {
          opportunities: 0,
          impressions: 0,
          clicks: 0,
          skips: 0,
          byChannel: {} as Record<
            PartnerPickChannelId,
            {
              opportunities: number;
              impressions: number;
              clicks: number;
              skips: number;
            }
          >,
        },
      };
    }

    const isStoreA = activePartnership.storeAId === currentStore.id;
    const yourDir = isStoreA
      ? activeLedger.directionAOnB
      : activeLedger.directionBOnA;
    const partnerDir = isStoreA
      ? activeLedger.directionBOnA
      : activeLedger.directionAOnB;

    const extractMetrics = (dir: typeof yourDir) => {
      const byChannel = {} as Record<
        PartnerPickChannelId,
        {
          opportunities: number;
          impressions: number;
          clicks: number;
          skips: number;
        }
      >;
      for (const ch of PARTNER_PICK_CHANNEL_IDS) {
        const m = dir?.byChannel?.[ch];
        byChannel[ch] = {
          opportunities: m?.opportunitiesCount || 0,
          impressions: m?.impressionsCount || 0,
          clicks: m?.clicksCount || 0,
          skips: m?.skipsCount || 0,
        };
      }
      return {
        opportunities: dir?.totals?.opportunitiesCount || 0,
        impressions: dir?.totals?.impressionsCount || 0,
        clicks: dir?.totals?.clicksCount || 0,
        skips: dir?.totals?.skipsCount || 0,
        byChannel,
      };
    };

    return {
      yourStore: extractMetrics(yourDir),
      partnerStore: extractMetrics(partnerDir),
    };
  }, [activePartnership, activeLedger, currentStore.id]);

  // Clean chronological History timeline (human-readable descriptions, no internal enum codes)
  const historyEvents = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      detail: string;
      timestamp: string;
    }> = [];

    for (const p of myPartnerships) {
      const otherName =
        p.storeAId === currentStore.id ? p.storeBName : p.storeAName;
      items.push({
        id: `part_req_${p.id}`,
        title: "Partnership request sent",
        detail: `Partnership request between ${currentStore.name} and ${otherName}.`,
        timestamp: p.createdAt,
      });

      if (p.status === "ACCEPTED" || p.status === "ACTIVE") {
        items.push({
          id: `part_acc_${p.id}`,
          title: "Partnership request accepted",
          detail: `${otherName} and ${currentStore.name} confirmed partnership terms.`,
          timestamp: p.activatedAt || p.updatedAt,
        });
      }
      if (p.status === "ACTIVE") {
        items.push({
          id: `part_act_${p.id}`,
          title: "Partnership activated",
          detail: `Active partnership with ${otherName} (${p.agreementTerms.durationDays} days).`,
          timestamp: p.activatedAt || p.updatedAt,
        });
      } else if (p.status === "REJECTED") {
        items.push({
          id: `part_rej_${p.id}`,
          title: "Partnership request declined",
          detail: `Request with ${otherName} was declined.`,
          timestamp: p.updatedAt,
        });
      } else if (
        p.status === "CANCELLED" ||
        p.status === "EXPIRED" ||
        p.status === "SUSPENDED_BY_ADMIN"
      ) {
        items.push({
          id: `part_end_${p.id}`,
          title: "Partnership ended",
          detail: `Partnership with ${otherName} is no longer active.`,
          timestamp: p.updatedAt,
        });
      }
    }

    for (const pl of placements) {
      if (
        pl.sourceStoreId !== currentStore.id &&
        pl.hostStoreId !== currentStore.id
      ) {
        continue;
      }
      const sourceStoreObj = allStores.find((s) => s.id === pl.sourceStoreId);
      const hostStoreObj = allStores.find((s) => s.id === pl.hostStoreId);
      const productObj = sourceStoreObj?.products?.find(
        (pr) => pr.id === pl.productId
      );
      const productName = productObj?.name || "Shared Product";
      const channelName =
        CHANNEL_LABELS[pl.channelId]?.title || "Storefront Placement";

      for (const act of pl.activityHistory || []) {
        let title = "Placement changed";
        let detail = `${productName} in ${channelName} (${hostStoreObj?.name || "Partner Store"}).`;

        if (act.action === "PROPOSED_OPTIONS") {
          title = "Placement changed";
          detail = `${productName} assigned to ${channelName} on ${hostStoreObj?.name || "Partner Store"}.`;
        } else if (act.action === "HOST_SELECTED_OPTION") {
          title = "Agreement updated";
          detail = `${hostStoreObj?.name || "Partner Store"} approved placement position for ${productName}.`;
        } else if (act.action === "PROPOSER_FINAL_APPROVED") {
          title = "Agreement updated";
          detail = `${productName} is approved and live in ${channelName} on ${hostStoreObj?.name || "Partner Store"}.`;
        } else if (
          act.action === "REJECTED_BY_HOST" ||
          act.action === "REJECTED_BY_PROPOSER"
        ) {
          title = "Shared product removed";
          detail = `${productName} placement in ${channelName} was declined or removed.`;
        }

        items.push({
          id: `${pl.id}_${act.id}`,
          title,
          detail,
          timestamp: act.timestamp,
        });
      }
    }

    return items.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [myPartnerships, placements, currentStore.id, currentStore.name, allStores]);

  // Pending actions count for Agreement badge
  const pendingAgreementActionsCount = useMemo(() => {
    const incomingRequests = myPartnerships.filter(
      (p) =>
        p.status === "PENDING_REQUEST" &&
        p.initiatedByStoreId !== currentStore.id
    ).length;
    const incomingPlacements = partnershipPlacements.filter(
      (pl) =>
        (pl.hostStoreId === currentStore.id &&
          pl.lifecycleState === "PROPOSED_AWAITING_HOST_SELECTION") ||
        (pl.sourceStoreId === currentStore.id &&
          pl.lifecycleState === "HOST_SELECTED_AWAITING_FINAL_APPROVAL")
    ).length;
    return incomingRequests + incomingPlacements;
  }, [myPartnerships, partnershipPlacements, currentStore.id]);

  const sections: Array<{
    id: PartnerPicksSectionId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: "partners", label: "Partners", icon: Store },
    {
      id: "shared-products",
      label: "Shared Products",
      icon: Package,
      badge: selectedSharedProducts.length,
    },
    { id: "placement-map", label: "Placement Map", icon: LayoutGrid },
    {
      id: "agreement",
      label: "Agreement",
      icon: FileCheck,
      badge:
        pendingAgreementActionsCount > 0
          ? pendingAgreementActionsCount
          : undefined,
    },
    { id: "statistics", label: "Statistics", icon: BarChart3 },
    { id: "history", label: "History", icon: Clock },
  ];

  // Container sizing based on Standard / Expanded / Full Screen
  const containerWrapperClass =
    sizeMode === "fullscreen"
      ? "fixed inset-0 z-[120] bg-stone-50 dark:bg-slate-950 overflow-y-auto p-4 sm:p-6 lg:p-8"
      : sizeMode === "expanded"
      ? "w-full max-w-none space-y-5 transition-all duration-200"
      : "w-full max-w-6xl mx-auto space-y-5 transition-all duration-200";

  return (
    <div
      id="partner-picks-merchant-workspace"
      className={containerWrapperClass}
    >
      {/* Top Workspace Header — Matches YUME "Add New Product" form header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Partner Picks
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Collaborate with partner stores to showcase selected products on
              each other&apos;s storefronts.
            </p>
          </div>

          {/* Active Partner Switcher + Resizable Workspace Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {myPartnerships.length > 0 && (
              <div className="flex items-center gap-2 bg-stone-50 dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Partner:
                </span>
                <select
                  aria-label="Active partner store"
                  value={selectedPartnershipId}
                  onChange={(e) => setSelectedPartnershipId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {myPartnerships.map((p) => {
                    const otherName =
                      p.storeAId === currentStore.id
                        ? p.storeBName
                        : p.storeAName;
                    return (
                      <option
                        key={p.id}
                        value={p.id}
                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        {otherName}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Workspace Size Controls */}
            <div className="inline-flex items-center rounded-lg border border-stone-200/80 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/70 p-0.5">
              <button
                type="button"
                onClick={() => setSizeMode("standard")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  sizeMode === "standard"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Standard View
              </button>
              <button
                type="button"
                onClick={() => setSizeMode("expanded")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  sizeMode === "expanded"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Expanded View
              </button>
              <button
                type="button"
                onClick={() =>
                  setSizeMode((prev) =>
                    prev === "fullscreen" ? "standard" : "fullscreen"
                  )
                }
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  sizeMode === "fullscreen"
                    ? "bg-stone-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {sizeMode === "fullscreen" ? (
                  <>
                    <Minimize2 className="w-3 h-3" />
                    <span>Exit Full Screen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3" />
                    <span>Full Screen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Clean 6-Section Navigation Bar (Short Labels, No Step Numbers, Non-Sequential) */}
        <div className="mt-5 pt-4 border-t border-stone-200/70 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                id={`partner-picks-tab-${sec.id}`}
                onClick={() => setActiveSection(sec.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-stone-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs"
                    : "bg-stone-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-stone-200/70 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{sec.label}</span>
                {typeof sec.badge === "number" && sec.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md tabular-nums ${
                      isActive
                        ? "bg-white/20 text-white dark:bg-slate-900/15 dark:text-slate-900"
                        : "bg-stone-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inline Feedback Notice */}
      {feedbackNotice && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-medium ${
            feedbackNotice.type === "success"
              ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200"
              : "bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/70 text-rose-900 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackNotice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedbackNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =====================================================================
          SECTION 1: PARTNERS ("Discover Partner Stores" + Current Partners)
         ===================================================================== */}
      {activeSection === "partners" && (
        <div className="space-y-5">
          {/* Existing Partner Stores Overview (if any exist) */}
          {myPartnerships.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Your Partner Stores
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select a partner store to manage shared products, placement
                    positions, or pending requests.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {myPartnerships.map((p) => {
                  const otherId =
                    p.storeAId === currentStore.id ? p.storeBId : p.storeAId;
                  const otherName =
                    p.storeAId === currentStore.id
                      ? p.storeBName
                      : p.storeAName;
                  const otherStore = allStores.find((s) => s.id === otherId);
                  const isSelected = activePartnership?.id === p.id;
                  const isPendingIncoming =
                    p.status === "PENDING_REQUEST" &&
                    p.initiatedByStoreId !== currentStore.id;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPartnershipId(p.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "border-stone-900 dark:border-slate-200 bg-stone-50/70 dark:bg-slate-800/60"
                          : "border-stone-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-stone-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={
                            otherStore?.logoUrl ||
                            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120&auto=format&fit=crop&q=80"
                          }
                          alt={otherName}
                          className="w-11 h-11 rounded-lg object-cover border border-stone-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {otherName}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                p.status === "ACTIVE"
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60"
                                  : p.status === "PENDING_REQUEST"
                                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60"
                                  : "bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {p.status === "ACTIVE"
                                ? "Active"
                                : p.status === "PENDING_REQUEST"
                                ? "Waiting for Approval"
                                : "Ended"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {otherStore?.wilaya || "Alger"} ·{" "}
                            {Array.isArray(otherStore?.products)
                              ? `${otherStore.products.length} products`
                              : "Partner Store"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isPendingIncoming && canManagePartnerships ? (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={(e) => {
                                e.stopPropagation();
                                onRespondToPartnership(
                                  p.id,
                                  currentStore.id,
                                  "ACCEPT"
                                );
                              }}
                              className="px-3 py-1.5 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={(e) => {
                                e.stopPropagation();
                                onRespondToPartnership(
                                  p.id,
                                  currentStore.id,
                                  "REJECT"
                                );
                              }}
                              className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPartnershipId(p.id);
                              setActiveSection("shared-products");
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <span>Manage</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dedicated "Discover Partner Stores" Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Discover Partner Stores
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Search and filter marketplace stores by name, category, or
                location to request a partnership.
              </p>
            </div>

            {/* Search Input + Filters (Matches Add New Product form inputs) */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="partner-picks-discover-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stores by name, category, or description..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50/70 dark:bg-slate-800/50 border border-stone-200/80 dark:border-slate-700/80 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-stone-400 dark:focus:border-slate-600 transition-all"
                />
              </div>

              <div>
                <select
                  aria-label="Filter stores by category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50/70 dark:bg-slate-800/50 border border-stone-200/80 dark:border-slate-700/80 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-stone-400 cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  aria-label="Filter stores by location"
                  value={selectedWilaya}
                  onChange={(e) => setSelectedWilaya(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50/70 dark:bg-slate-800/50 border border-stone-200/80 dark:border-slate-700/80 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-stone-400 cursor-pointer"
                >
                  <option value="ALL">All Locations</option>
                  {availableWilayas.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Store Cards Grid */}
            {displayedDiscoverStores.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-stone-200 dark:border-slate-800 rounded-xl">
                <Store className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No matching stores found
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Try clearing your search or choosing a different category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedDiscoverStores.map((st) => {
                  const existingPartnership = myPartnerships.find(
                    (p) =>
                      (p.storeAId === st.id || p.storeBId === st.id) &&
                      (p.status === "ACTIVE" ||
                        p.status === "PENDING_REQUEST" ||
                        p.status === "ACCEPTED")
                  );
                  const fullStoreObj = allStores.find((s) => s.id === st.id);

                  return (
                    <div
                      key={st.id}
                      className="rounded-xl border border-stone-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between gap-4 hover:border-stone-300 dark:hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <img
                            src={
                              st.logoUrl ||
                              "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120&auto=format&fit=crop&q=80"
                            }
                            alt={st.name}
                            className="w-12 h-12 rounded-xl object-cover border border-stone-200/80 dark:border-slate-700 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {st.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {st.category}
                              </span>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {st.wilaya}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {st.description ||
                            "Curated collection available for store-to-store product collaboration."}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 dark:border-slate-800/80 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (fullStoreObj && onViewStore) {
                              onViewStore(fullStoreObj);
                            }
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Store</span>
                        </button>

                        {existingPartnership ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPartnershipId(existingPartnership.id);
                              setActiveSection("shared-products");
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-stone-200/80 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              {existingPartnership.status === "ACTIVE"
                                ? "Active Partner"
                                : "Request Sent"}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setRequestModalTargetStore(st);
                              setRequestDurationDays(30);
                              setRequestMessage("");
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            <span>Request Partnership</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Incremental Pagination Control */}
            {hasMoreDiscoverStores && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  disabled={isSearchingStores}
                  onClick={() => setDiscoverPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {isSearchingStores ? "Loading..." : "Load More Stores"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 2: SHARED PRODUCTS
         ===================================================================== */}
      {activeSection === "shared-products" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/70 dark:border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Shared Products
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Choose which products from your catalog can be placed inside
                your partner&apos;s store.
              </p>
            </div>

            {/* Dynamic Plan-Based Counter: Selected Products: X / Y */}
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-stone-100/90 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                Selected Products: {selectedSharedProductIds.length} /{" "}
                {maxSharedProductsLimit}
              </span>
            </div>
          </div>

          {(!currentStore.products || currentStore.products.length === 0) ? (
            <div className="py-12 text-center border border-dashed border-stone-200 dark:border-slate-800 rounded-xl">
              <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No products in your store catalog
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Add products to your store first to share them with partners.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentStore.products.map((product) => {
                const isSelected = selectedSharedProductIds.includes(
                  product.id
                );
                const priceInfo = resolveProductPriceInfo(product);
                const limitReached =
                  !isSelected &&
                  selectedSharedProductIds.length >= maxSharedProductsLimit;

                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      if (!limitReached) {
                        handleToggleSharedProduct(product.id);
                      }
                    }}
                    className={`rounded-xl border p-3.5 flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? "border-stone-900 dark:border-white bg-stone-50/70 dark:bg-slate-800/60 shadow-2xs"
                        : limitReached
                        ? "border-stone-200/60 dark:border-slate-800/60 opacity-60 cursor-not-allowed"
                        : "border-stone-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-stone-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-stone-100 dark:bg-slate-800 border border-stone-200/70 dark:border-slate-700 shrink-0">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {priceInfo.hasDiscount && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                            -{priceInfo.discountPercent}%
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                          {product.name}
                        </h4>

                        {/* Price display with discount strikethrough when applicable */}
                        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {formatDinar(priceInfo.finalPrice)}
                          </span>
                          {priceInfo.hasDiscount && (
                            <>
                              <span className="text-xs text-slate-400 line-through">
                                {formatDinar(priceInfo.regularPrice)}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                                -{priceInfo.discountPercent}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-stone-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {product.stock > 0 ? "In Stock" : "Out of Stock"}
                      </span>

                      <button
                        type="button"
                        disabled={isBusy || limitReached}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSharedProduct(product.id);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-stone-900 text-white dark:bg-white dark:text-slate-900"
                            : "border border-stone-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Select</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SECTION 3: PLACEMENT MAP (Select Product -> Select Channel -> Interactive Map)
         ===================================================================== */}
      {activeSection === "placement-map" && (
        <div className="space-y-5">
          {selectedSharedProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 p-8 text-center shadow-2xs space-y-3">
              <Package className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No Shared Products Selected Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Only products selected in Shared Products appear in the
                Placement Map. Choose up to {maxSharedProductsLimit} products
                first.
              </p>
              <button
                type="button"
                onClick={() => setActiveSection("shared-products")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
              >
                <span>Go to Shared Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              {/* Step A & Step B: Select Product + Select Placement Channel */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
                {/* A. Select Product (Shows ONLY products selected in Shared Products) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      1. Select Shared Product
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveSection("shared-products")}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
                    >
                      Edit Shared Products ({selectedSharedProducts.length}/
                      {maxSharedProductsLimit})
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedSharedProducts.map((prod) => {
                      const isActiveProd = selectedMapProductId === prod.id;
                      const priceInfo = resolveProductPriceInfo(prod);
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => setSelectedMapProductId(prod.id)}
                          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                            isActiveProd
                              ? "border-stone-900 dark:border-white bg-stone-50 dark:bg-slate-800/80 shadow-2xs"
                              : "border-stone-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-stone-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-11 h-11 rounded-lg object-cover border border-stone-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {prod.name}
                            </p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {formatDinar(priceInfo.finalPrice)}
                              </span>
                              {priceInfo.hasDiscount && (
                                <span className="text-[10px] text-slate-400 line-through">
                                  {formatDinar(priceInfo.regularPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* B. Select Placement Channel */}
                <div className="pt-4 border-t border-stone-200/70 dark:border-slate-800 space-y-2.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    2. Select Placement Channel
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {PARTNER_PICK_CHANNEL_IDS.map((chId) => {
                      const isSelectedChannel = selectedMapChannel === chId;
                      const assignedCount = myPlacementsOnPartner.filter(
                        (pl) =>
                          pl.channelId === chId &&
                          pl.lifecycleState !== "REJECTED_BY_HOST" &&
                          pl.lifecycleState !== "REJECTED_BY_PROPOSER"
                      ).length;

                      return (
                        <button
                          key={chId}
                          type="button"
                          onClick={() => setSelectedMapChannel(chId)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelectedChannel
                              ? "border-stone-900 dark:border-white bg-stone-900 text-white dark:bg-white dark:text-slate-900"
                              : "border-stone-200/80 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:border-stone-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold">
                              {CHANNEL_LABELS[chId].title}
                            </span>
                            {assignedCount > 0 && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  isSelectedChannel
                                    ? "bg-white/20 text-white dark:bg-slate-900/15 dark:text-slate-900"
                                    : "bg-stone-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                                }`}
                              >
                                {assignedCount}
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-[11px] line-clamp-1 ${
                              isSelectedChannel
                                ? "text-stone-200 dark:text-slate-600"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {CHANNEL_LABELS[chId].subtitle}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* C. Interactive Placement Map */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/70 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {partnerStore
                        ? `${partnerStore.name} · ${CHANNEL_LABELS[selectedMapChannel].title}`
                        : `Partner Store · ${CHANNEL_LABELS[selectedMapChannel].title}`}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Click any empty placement card (+) to assign a shared
                      product, or modify an existing placement.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsArrangementPreview((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      isArrangementPreview
                        ? "bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-slate-900 dark:border-white"
                        : "border-stone-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>
                      {isArrangementPreview
                        ? "Exit Preview"
                        : "Preview Arrangement"}
                    </span>
                  </button>
                </div>

                {/* Visual Channel Layout */}
                <div
                  className={`grid gap-4 ${
                    selectedMapChannel === "DISCOVER_MORE"
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                      : "grid-cols-1 sm:grid-cols-3"
                  }`}
                >
                  {getChannelSlotTemplates(selectedMapChannel).map(
                    (slot, idx) => {
                      if (slot.isNativePreview) {
                        const partnerNativeProd =
                          partnerStore?.products?.[idx % (partnerStore?.products?.length || 1)];
                        return (
                          <div
                            key={slot.optionId}
                            className="rounded-xl border border-stone-200/70 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-800/30 p-4 flex flex-col justify-between min-h-[170px] opacity-75"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                {slot.title}
                              </span>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-stone-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                Partner Store
                              </span>
                            </div>
                            {partnerNativeProd ? (
                              <div className="flex items-center gap-3 mt-3">
                                <img
                                  src={partnerNativeProd.imageUrl}
                                  alt={partnerNativeProd.name}
                                  className="w-12 h-12 rounded-lg object-cover border border-stone-200 dark:border-slate-700 shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                                    {partnerNativeProd.name}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    {formatDinar(partnerNativeProd.price)}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 mt-4">
                                Partner store native slot
                              </p>
                            )}
                            <p className="text-[11px] text-slate-400 mt-3">
                              {slot.subtitle}
                            </p>
                          </div>
                        );
                      }

                      // Check if this slot already has an assigned placement from currentStore
                      const matchingPlacement = myPlacementsOnPartner.find(
                        (pl) =>
                          pl.channelId === selectedMapChannel &&
                          pl.lifecycleState !== "REJECTED_BY_HOST" &&
                          pl.lifecycleState !== "REJECTED_BY_PROPOSER" &&
                          (pl.selectedOptionId === slot.optionId ||
                            pl.proposedOptions?.some(
                              (o) => o.optionId === slot.optionId
                            ))
                      );

                      const assignedProduct = matchingPlacement
                        ? currentStore.products?.find(
                            (p) => p.id === matchingPlacement.productId
                          ) || null
                        : null;

                      if (assignedProduct && matchingPlacement) {
                        const priceInfo =
                          resolveProductPriceInfo(assignedProduct);
                        const isApproved =
                          matchingPlacement.lifecycleState === "APPROVED_LIVE";

                        return (
                          <div
                            key={slot.optionId}
                            className="rounded-xl border border-stone-900/80 dark:border-slate-300 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between min-h-[170px] shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {slot.title}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                  isApproved
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60"
                                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60"
                                }`}
                              >
                                {isApproved
                                  ? "Approved"
                                  : "Waiting for Approval"}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 my-3">
                              <img
                                src={assignedProduct.imageUrl}
                                alt={assignedProduct.name}
                                className="w-14 h-14 rounded-lg object-cover border border-stone-200 dark:border-slate-700 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {assignedProduct.name}
                                </p>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {formatDinar(priceInfo.finalPrice)}
                                  </span>
                                  {priceInfo.hasDiscount && (
                                    <span className="text-[10px] text-slate-400 line-through">
                                      {formatDinar(priceInfo.regularPrice)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {!isArrangementPreview && (
                              <div className="pt-2.5 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => setActivePopupSlot(slot)}
                                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                  Change Product
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleRemoveProductFromSlot(
                                      matchingPlacement
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Empty Placement Card with Centered "+" Icon
                      return (
                        <button
                          key={slot.optionId}
                          type="button"
                          onClick={() => setActivePopupSlot(slot)}
                          className="rounded-xl border-2 border-dashed border-stone-200 dark:border-slate-700 hover:border-stone-400 dark:hover:border-slate-500 bg-stone-50/40 dark:bg-slate-800/20 p-4 flex flex-col items-center justify-center text-center min-h-[170px] transition-all group cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-stone-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-colors">
                            <Plus className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2.5">
                            {slot.title}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {slot.subtitle}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          SECTION 4: AGREEMENT
         ===================================================================== */}
      {activeSection === "agreement" && (
        <div className="space-y-5">
          {!activePartnership ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 p-8 text-center shadow-2xs space-y-3">
              <FileCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No Active Partnership Selected
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Discover partner stores and send a partnership request to view
                and approve agreement details.
              </p>
              <button
                type="button"
                onClick={() => setActiveSection("partners")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
              >
                <span>Discover Partner Stores</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              {/* Overview Card: Who we are partnering with & current partnership status */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={
                        partnerStore?.logoUrl ||
                        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120&auto=format&fit=crop&q=80"
                      }
                      alt={partnerStore?.name || "Partner Store"}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-200 dark:border-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          Partnership with{" "}
                          {partnerStore?.name ||
                            (activePartnership.storeAId === currentStore.id
                              ? activePartnership.storeBName
                              : activePartnership.storeAName)}
                        </h3>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${
                            activePartnership.status === "ACTIVE"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60"
                              : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60"
                          }`}
                        >
                          {activePartnership.status === "ACTIVE"
                            ? "Approved"
                            : "Waiting for Approval"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Duration: {activePartnership.agreementTerms.durationDays}{" "}
                        days
                        {activePartnership.activatedAt
                          ? ` · Started ${formatSimpleDate(activePartnership.activatedAt)}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {/* Partnership Request Accept / Decline Actions */}
                  {activePartnership.status === "PENDING_REQUEST" &&
                    activePartnership.initiatedByStoreId !== currentStore.id &&
                    canManagePartnerships && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            onRespondToPartnership(
                              activePartnership.id,
                              currentStore.id,
                              "ACCEPT"
                            )
                          }
                          className="px-4 py-2 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            onRespondToPartnership(
                              activePartnership.id,
                              currentStore.id,
                              "REJECT"
                            )
                          }
                          className="px-4 py-2 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                </div>

                {/* Two clear columns: Products appearing on Partner Store vs Partner Products appearing on Your Store */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Column 1: Your Products on Partner Store */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Your Products on{" "}
                      {partnerStore?.name || "Partner Store"} (
                      {myPlacementsOnPartner.length})
                    </h4>

                    {myPlacementsOnPartner.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-stone-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                        No placements chosen yet. Use the Placement Map to pick
                        where your shared products will appear.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {myPlacementsOnPartner.map((pl) => {
                          const prod = currentStore.products?.find(
                            (p) => p.id === pl.productId
                          );
                          const isApproved =
                            pl.lifecycleState === "APPROVED_LIVE";
                          const needsMyFinalConfirm =
                            pl.lifecycleState ===
                            "HOST_SELECTED_AWAITING_FINAL_APPROVAL";
                          const slotLabel =
                            pl.selectedOption?.label ||
                            pl.proposedOptions?.[0]?.label ||
                            CHANNEL_LABELS[pl.channelId]?.title;

                          return (
                            <div
                              key={pl.id}
                              className="p-3.5 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {prod && (
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.name}
                                    className="w-11 h-11 rounded-lg object-cover border border-stone-200 dark:border-slate-700 shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {prod?.name || "Shared Product"}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    {CHANNEL_LABELS[pl.channelId]?.title} ·{" "}
                                    {slotLabel}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {needsMyFinalConfirm && canProposePlacements ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() =>
                                        onProposerConfirmPlacement(
                                          pl.id,
                                          "APPROVE"
                                        )
                                      }
                                      className="px-3 py-1.5 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() =>
                                        onProposerConfirmPlacement(
                                          pl.id,
                                          "REJECT"
                                        )
                                      }
                                      className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                                    >
                                      Decline
                                    </button>
                                  </>
                                ) : (
                                  <span
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${
                                      isApproved
                                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                        : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                                    }`}
                                  >
                                    {isApproved
                                      ? "Approved"
                                      : "Waiting for Approval"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Column 2: Partner Store Products on Your Store */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {partnerStore?.name || "Partner Store"} Products on Your
                      Store ({partnerPlacementsOnMyStore.length})
                    </h4>

                    {partnerPlacementsOnMyStore.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-stone-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                        No partner placements waiting for your store right now.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {partnerPlacementsOnMyStore.map((pl) => {
                          const prod = partnerStore?.products?.find(
                            (p) => p.id === pl.productId
                          );
                          const isApproved =
                            pl.lifecycleState === "APPROVED_LIVE";
                          const needsMyHostSelection =
                            pl.lifecycleState ===
                            "PROPOSED_AWAITING_HOST_SELECTION";
                          const firstOption = pl.proposedOptions?.[0];
                          const slotLabel =
                            pl.selectedOption?.label ||
                            firstOption?.label ||
                            CHANNEL_LABELS[pl.channelId]?.title;

                          return (
                            <div
                              key={pl.id}
                              className="p-3.5 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {prod && (
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.name}
                                    className="w-11 h-11 rounded-lg object-cover border border-stone-200 dark:border-slate-700 shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {prod?.name || "Partner Product"}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    {CHANNEL_LABELS[pl.channelId]?.title} ·{" "}
                                    {slotLabel}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {needsMyHostSelection && firstOption ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() =>
                                        onHostSelectPlacement(
                                          pl.id,
                                          "SELECT",
                                          firstOption.optionId
                                        )
                                      }
                                      className="px-3 py-1.5 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() =>
                                        onHostSelectPlacement(pl.id, "REJECT")
                                      }
                                      className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                                    >
                                      Decline
                                    </button>
                                  </>
                                ) : (
                                  <span
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${
                                      isApproved
                                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                        : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                                    }`}
                                  >
                                    {isApproved
                                      ? "Approved"
                                      : "Waiting for Approval"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          SECTION 5: STATISTICS (Your Store vs Partner Store)
         ===================================================================== */}
      {activeSection === "statistics" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-6">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Statistics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Performance comparison between Your Store and Partner Store across
              Opportunities, Impressions, Clicks, and Skips.
            </p>
          </div>

          {/* 4 Metric Comparison Cards: Opportunities, Impressions, Clicks, Skips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Opportunities",
                yourVal: statsComparison.yourStore.opportunities,
                partnerVal: statsComparison.partnerStore.opportunities,
              },
              {
                label: "Impressions",
                yourVal: statsComparison.yourStore.impressions,
                partnerVal: statsComparison.partnerStore.impressions,
              },
              {
                label: "Clicks",
                yourVal: statsComparison.yourStore.clicks,
                partnerVal: statsComparison.partnerStore.clicks,
              },
              {
                label: "Skips",
                yourVal: statsComparison.yourStore.skips,
                partnerVal: statsComparison.partnerStore.skips,
              },
            ].map((card) => (
              <div
                key={card.label}
                className="p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/40 space-y-3"
              >
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {card.label}
                </span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Your Store
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                      {card.yourVal.toLocaleString()}
                    </p>
                  </div>
                  <div className="border-l border-stone-200 dark:border-slate-700 pl-3">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Partner Store
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                      {card.partnerVal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Per-Channel Breakdown Table */}
          <div className="overflow-x-auto border border-stone-200/80 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 dark:bg-slate-800/60 border-b border-stone-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-4">Placement Channel</th>
                  <th className="py-3 px-4">Store</th>
                  <th className="py-3 px-4 text-right">Opportunities</th>
                  <th className="py-3 px-4 text-right">Impressions</th>
                  <th className="py-3 px-4 text-right">Clicks</th>
                  <th className="py-3 px-4 text-right">Skips</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 dark:divide-slate-800 text-xs">
                {PARTNER_PICK_CHANNEL_IDS.map((chId) => {
                  const yourRow = statsComparison.yourStore.byChannel[chId] || {
                    opportunities: 0,
                    impressions: 0,
                    clicks: 0,
                    skips: 0,
                  };
                  const partnerRow = statsComparison.partnerStore.byChannel[
                    chId
                  ] || {
                    opportunities: 0,
                    impressions: 0,
                    clicks: 0,
                    skips: 0,
                  };

                  return (
                    <React.Fragment key={chId}>
                      <tr className="bg-white dark:bg-slate-900">
                        <td
                          rowSpan={2}
                          className="py-3 px-4 font-bold text-slate-900 dark:text-white align-top border-r border-stone-100 dark:border-slate-800"
                        >
                          {CHANNEL_LABELS[chId].title}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          Your Store
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {yourRow.opportunities}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {yourRow.impressions}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {yourRow.clicks}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {yourRow.skips}
                        </td>
                      </tr>
                      <tr className="bg-stone-50/40 dark:bg-slate-800/20">
                        <td className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400">
                          Partner Store
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-600 dark:text-slate-400">
                          {partnerRow.opportunities}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-600 dark:text-slate-400">
                          {partnerRow.impressions}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-600 dark:text-slate-400">
                          {partnerRow.clicks}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-600 dark:text-slate-400">
                          {partnerRow.skips}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 6: HISTORY (Clean Chronological Timeline)
         ===================================================================== */}
      {activeSection === "history" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chronological record of partnership requests, shared product
              updates, and placement approvals.
            </p>
          </div>

          {historyEvents.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-stone-200 dark:border-slate-800 rounded-xl">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No activity recorded yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Events will appear here as you request partnerships and assign
                placements.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-200/70 dark:divide-slate-800">
              {historyEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {ev.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {ev.detail}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
                    {formatSimpleDate(ev.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODAL 1: PRODUCT SELECTION POPUP FOR PLACEMENT MAP CARD (+)
         ===================================================================== */}
      {activePopupSlot && (
        <div className="fixed inset-0 z-[140] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 w-full max-w-lg p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/70 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Select Product for {activePopupSlot.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {CHANNEL_LABELS[activePopupSlot.channelId].title} ·{" "}
                  {activePopupSlot.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePopupSlot(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {selectedSharedProducts.map((prod) => {
                const priceInfo = resolveProductPriceInfo(prod);
                return (
                  <button
                    key={prod.id}
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      handleAssignProductToSlot(activePopupSlot, prod.id)
                    }
                    className="w-full p-3 rounded-xl border border-stone-200/80 dark:border-slate-800 hover:border-stone-900 dark:hover:border-white bg-stone-50/40 dark:bg-slate-800/40 flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-12 h-12 rounded-lg object-cover border border-stone-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {prod.name}
                        </p>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {formatDinar(priceInfo.finalPrice)}
                          </span>
                          {priceInfo.hasDiscount && (
                            <>
                              <span className="text-[10px] text-slate-400 line-through">
                                {formatDinar(priceInfo.regularPrice)}
                              </span>
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                -{priceInfo.discountPercent}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="px-3 py-1.5 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold shrink-0">
                      Assign
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: SEND PARTNERSHIP REQUEST POPUP (From Discover Partner Stores)
         ===================================================================== */}
      {requestModalTargetStore && (
        <div className="fixed inset-0 z-[140] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 w-full max-w-md p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/70 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Request Partnership with {requestModalTargetStore.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {requestModalTargetStore.category} ·{" "}
                  {requestModalTargetStore.wilaya}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequestModalTargetStore(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Partnership Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[14, 30, 60].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setRequestDurationDays(days)}
                      className={`py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        requestDurationDays === days
                          ? "border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                          : "border-stone-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Note to Partner Store (Optional)
                </label>
                <textarea
                  rows={3}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Introduce your store and suggest how your products complement each other..."
                  className="w-full px-3.5 py-2.5 bg-stone-50/70 dark:bg-slate-800/50 border border-stone-200/80 dark:border-slate-700/80 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-stone-400"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200/70 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRequestModalTargetStore(null)}
                className="px-4 py-2 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={handleConfirmSendPartnershipRequest}
                className="px-4 py-2 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 cursor-pointer"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
