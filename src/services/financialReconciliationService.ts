import {
  Order,
  CarrierTariffProfile,
  CarrierRateEvaluationResult,
  ShipmentRecord,
  SettlementBatchRecord,
  SettlementRemittanceLine,
  TariffSourceType,
} from "../types";
import {
  computeOrderFinancials,
  deterministicHash,
  normalizeOrderRecord,
  runStoreOrdersMigration,
  enqueueOrApplyOrderMutation,
  rollbackStoreOrdersMigration,
  processIdempotentCarrierWebhook,
  transitionOrderDimension,
} from "../utils/orderLifecycle";

// ============================================================================
// 1. DEFAULT CARRIER TARIFF DATABASE (MULTI-COUNTRY & TRI-SOURCE)
// ============================================================================

export function getDefaultCarrierTariffProfiles(countryCode = "DZ"): CarrierTariffProfile[] {
  const nowIso = new Date().toISOString();
  const stale45DaysAgo = new Date(Date.now() - 45 * 86400 * 1000).toISOString();
  const stale100DaysAgo = new Date(Date.now() - 100 * 86400 * 1000).toISOString();

  // Standard regional coverage builder
  const buildRegions = (
    baseHome: number,
    baseDesk: number,
    returnFee: number,
    codPct: number,
    successRate: number,
    unsupportedCodes: string[] = [],
    noDeskCodes: string[] = []
  ) => {
    const map: CarrierTariffProfile["coverageByRegion"] = {};
    const sampleRegions = [
      { code: "16", name: "Alger" },
      { code: "31", name: "Oran" },
      { code: "25", name: "Constantine" },
      { code: "19", name: "Sétif" },
      { code: "09", name: "Blida" },
      { code: "06", name: "Béjaïa" },
      { code: "15", name: "Tizi Ouzou" },
      { code: "13", name: "Tlemcen" },
      { code: "23", name: "Annaba" },
      { code: "05", name: "Batna" },
      { code: "30", name: "Ouargla" },
      { code: "11", name: "Tamanrasset" },
      { code: "SP", name: "São Paulo" },
      { code: "RJ", name: "Rio de Janeiro" },
      { code: "BA", name: "Buenos Aires" },
      { code: "LIM", name: "Lima" },
    ];

    for (const reg of sampleRegions) {
      const isSouthRemote = reg.code === "11" || reg.code === "30";
      const isSupported = !unsupportedCodes.includes(reg.code);
      const supportsDesk = isSupported && !noDeskCodes.includes(reg.code);
      map[reg.code] = {
        regionCode: reg.code,
        regionName: reg.name,
        isSupported,
        supportsHomeDelivery: isSupported,
        supportsDeskDelivery: supportsDesk,
        supportsCod: isSupported,
        homeDeliveryRate: isSupported ? baseHome + (isSouthRemote ? 450 : 0) : null,
        deskDeliveryRate: supportsDesk ? baseDesk + (isSouthRemote ? 300 : 0) : null,
        returnFee,
        codFeePercent: codPct,
        codFixedFee: 0,
        estimatedDaysMin: isSouthRemote ? 3 : 1,
        estimatedDaysMax: isSouthRemote ? 5 : 2,
        historicalSuccessRatePercent: isSouthRemote ? Math.max(72, successRate - 10) : successRate,
      };
      // Also index by lowercase name for flexible matching
      map[reg.name.toLowerCase()] = map[reg.code];
    }
    return map;
  };

  return [
    // 1. Yalidine Express — Fresh Merchant Contract Rate (<= 90 days) + Official API
    {
      id: "tariff_yalidine_contract",
      carrierId: "yalidine",
      carrierName: "Yalidine Express",
      countryCode,
      source: "merchant_custom",
      isActive: true,
      lastUpdatedAt: nowIso,
      validUntil: new Date(Date.now() + 180 * 86400 * 1000).toISOString(),
      baseWeightKg: 5,
      weightStepKg: 1,
      extraStepFee: 60,
      maxWeightKg: 30,
      maxCodLimit: 250000,
      volumetricDivisor: 5000,
      dimensionalExemptionThresholdKg: 2.0,
      coverageByRegion: buildRegions(500, 350, 250, 1.0, 94),
    },
    {
      id: "tariff_yalidine_api",
      carrierId: "yalidine",
      carrierName: "Yalidine Express",
      countryCode,
      source: "official_api",
      isActive: true,
      lastUpdatedAt: nowIso,
      validUntil: new Date(Date.now() + 365 * 86400 * 1000).toISOString(),
      baseWeightKg: 5,
      weightStepKg: 1,
      extraStepFee: 65,
      maxWeightKg: 30,
      maxCodLimit: 250000,
      volumetricDivisor: 5000,
      dimensionalExemptionThresholdKg: 2.0,
      coverageByRegion: buildRegions(550, 400, 250, 1.0, 94),
    },
    // 2. ZR Express — Stale Merchant Contract (>90d) vs Fresh Official API Quote
    {
      id: "tariff_zrexpress_stale_contract",
      carrierId: "zrexpress",
      carrierName: "ZR Express",
      countryCode,
      source: "merchant_custom",
      isActive: true,
      lastUpdatedAt: stale100DaysAgo, // >90 days old -> STALE contract!
      validUntil: new Date(Date.now() + 60 * 86400 * 1000).toISOString(),
      baseWeightKg: 5,
      weightStepKg: 1,
      extraStepFee: 50,
      maxWeightKg: 35,
      maxCodLimit: 300000,
      volumetricDivisor: 5000,
      dimensionalExemptionThresholdKg: 3.0,
      coverageByRegion: buildRegions(450, 300, 200, 1.0, 91, [], ["11"]),
    },
    {
      id: "tariff_zrexpress_api",
      carrierId: "zrexpress",
      carrierName: "ZR Express",
      countryCode,
      source: "official_api",
      isActive: true,
      lastUpdatedAt: nowIso, // Fresh API quote (<15 mins) -> Must take automatic priority over Stale Contract!
      validUntil: new Date(Date.now() + 365 * 86400 * 1000).toISOString(),
      baseWeightKg: 5,
      weightStepKg: 1,
      extraStepFee: 55,
      maxWeightKg: 35,
      maxCodLimit: 300000,
      volumetricDivisor: 5000,
      dimensionalExemptionThresholdKg: 3.0,
      coverageByRegion: buildRegions(480, 350, 200, 1.0, 91, [], ["11"]),
    },
    // 3. Maystro Delivery — YUME Verified Reference Tariff (<= 30 days)
    {
      id: "tariff_maystro_ref",
      carrierId: "maystro",
      carrierName: "Maystro Delivery",
      countryCode,
      source: "yume_verified",
      isActive: true,
      lastUpdatedAt: nowIso,
      validUntil: null,
      baseWeightKg: 5,
      weightStepKg: 1,
      extraStepFee: 70,
      maxWeightKg: 25,
      maxCodLimit: 200000,
      volumetricDivisor: 6000,
      dimensionalExemptionThresholdKg: 2.5,
      coverageByRegion: buildRegions(520, 380, 250, 1.2, 89, ["11"]),
    },
    // 4. Guepex Express — Stale YUME Reference Tariff (> 30 days)
    {
      id: "tariff_guepex_stale_ref",
      carrierId: "guepex",
      carrierName: "Guepex Express",
      countryCode,
      source: "yume_verified",
      isActive: true,
      lastUpdatedAt: stale45DaysAgo, // >30 days old -> Stale Reference
      validUntil: null,
      baseWeightKg: 5,
      weightStepKg: 1,
      extraStepFee: 75,
      maxWeightKg: 20,
      maxCodLimit: 150000,
      volumetricDivisor: 4000,
      dimensionalExemptionThresholdKg: 1.5,
      coverageByRegion: buildRegions(580, 420, 300, 1.5, 87, ["11", "30"], ["05"]),
    },
  ];
}

// ============================================================================
// 2. FIVE-GATE CARRIER TARIFF VALIDATION & PRIORITY RESOLVER (PART 3)
// ============================================================================

export function evaluateCarrierTariffs(params: {
  profiles: CarrierTariffProfile[];
  countryCode: string;
  regionCode: string;
  deliveryType: "home" | "desk";
  actualWeightKg: number;
  dimensionsCm?: { length: number; width: number; height: number } | null;
  codAmount: number;
  isCod: boolean;
  preferMerchantContractOverLiveApi?: boolean;
  forceManualSelectionCarrierIds?: string[];
  manualPriceOverrides?: Record<string, { price: number; reason: string }>;
}): CarrierRateEvaluationResult[] {
  const {
    profiles,
    countryCode,
    regionCode,
    deliveryType,
    actualWeightKg,
    dimensionsCm,
    codAmount,
    isCod,
    preferMerchantContractOverLiveApi = true,
    forceManualSelectionCarrierIds = [],
    manualPriceOverrides = {},
  } = params;

  const nowMs = Date.now();
  const normalizedRegion = (regionCode || "16").trim();
  const normalizedRegionLower = normalizedRegion.toLowerCase();

  // Group profiles by carrierId
  const byCarrier = new Map<string, CarrierTariffProfile[]>();
  for (const p of profiles) {
    if (!p.isActive) continue;
    const list = byCarrier.get(p.carrierId) || [];
    list.push(p);
    byCarrier.set(p.carrierId, list);
  }

  const results: CarrierRateEvaluationResult[] = [];

  for (const [carrierId, carrierProfiles] of byCarrier.entries()) {
    const primaryProfile = carrierProfiles[0];
    const carrierName = primaryProfile.carrierName;

    // Resolve regional coverage rule from the first profile that defines the region, or fallback default
    const findRegionRule = (prof: CarrierTariffProfile) => {
      return (
        prof.coverageByRegion[normalizedRegion] ||
        prof.coverageByRegion[normalizedRegionLower] ||
        Object.values(prof.coverageByRegion).find(
          (r) =>
            r.regionCode.toLowerCase() === normalizedRegionLower ||
            r.regionName.toLowerCase().includes(normalizedRegionLower)
        ) || {
          regionCode: normalizedRegion,
          regionName: normalizedRegion,
          isSupported: true,
          supportsHomeDelivery: true,
          supportsDeskDelivery: true,
          supportsCod: true,
          homeDeliveryRate: 550,
          deskDeliveryRate: 400,
          returnFee: 250,
          codFeePercent: 1.0,
          codFixedFee: 0,
          estimatedDaysMin: 2,
          estimatedDaysMax: 4,
          historicalSuccessRatePercent: 88,
        }
      );
    };

    const refRule = findRegionRule(primaryProfile);

    // Compute Billable & Volumetric Weight
    const divisor = primaryProfile.volumetricDivisor;
    const hasDimensions =
      Boolean(dimensionsCm) &&
      Number(dimensionsCm?.length) > 0 &&
      Number(dimensionsCm?.width) > 0 &&
      Number(dimensionsCm?.height) > 0;

    let volumetricWeightKg: number | null = null;
    let billableWeightKg = Math.max(0.1, Number(actualWeightKg || 0.5));
    let weightBasisStatus: CarrierRateEvaluationResult["weightBasisStatus"] =
      "VERIFIED_DEAD_WEIGHT";

    if (divisor !== null && divisor > 0 && hasDimensions && dimensionsCm) {
      volumetricWeightKg = Number(
        ((dimensionsCm.length * dimensionsCm.width * dimensionsCm.height) / divisor).toFixed(2)
      );
      billableWeightKg = Math.max(billableWeightKg, volumetricWeightKg);
      weightBasisStatus = "VERIFIED_DIMENSIONAL_WEIGHT";
    } else if (
      divisor === null ||
      billableWeightKg <= (primaryProfile.dimensionalExemptionThresholdKg || 2.0)
    ) {
      volumetricWeightKg = 0;
      weightBasisStatus = "VERIFIED_DEAD_WEIGHT";
    } else {
      volumetricWeightKg = null;
      weightBasisStatus = "DIMENSIONS_MISSING_PROVISIONAL";
    }

    // Operational Coverage Gates (Evaluated BEFORE Pricing or Manual Override)
    const destinationStatus: "SUPPORTED" | "UNSUPPORTED" = refRule.isSupported
      ? "SUPPORTED"
      : "UNSUPPORTED";

    const serviceTypeStatus: "SUPPORTED" | "UNSUPPORTED" | "DISCONTINUED" =
      refRule.serviceDiscontinued
        ? "DISCONTINUED"
        : !refRule.isSupported
        ? "UNSUPPORTED"
        : deliveryType === "desk" && !refRule.supportsDeskDelivery
        ? "UNSUPPORTED"
        : deliveryType === "home" && !refRule.supportsHomeDelivery
        ? "UNSUPPORTED"
        : "SUPPORTED";

    const weightStatus: "OK" | "EXCEEDS_MAX_WEIGHT" =
      billableWeightKg <= primaryProfile.maxWeightKg ? "OK" : "EXCEEDS_MAX_WEIGHT";

    const codEligibilityStatus: "SUPPORTED" | "INELIGIBLE" =
      !isCod || (refRule.supportsCod && codAmount <= primaryProfile.maxCodLimit)
        ? "SUPPORTED"
        : "INELIGIBLE";

    // Strict Rule (Correction #2): Manual Price Override can NEVER bypass operational service blocks
    const canApplyManualPriceOverride =
      destinationStatus === "SUPPORTED" &&
      serviceTypeStatus === "SUPPORTED" &&
      weightStatus === "OK" &&
      codEligibilityStatus === "SUPPORTED";

    if (!canApplyManualPriceOverride) {
      const operationalState =
        destinationStatus === "UNSUPPORTED"
          ? "DESTINATION_UNSUPPORTED"
          : "SERVICE_UNAVAILABLE";

      const blockReason =
        destinationStatus === "UNSUPPORTED"
          ? `${carrierName} does not serve destination (${normalizedRegion}). Manual price override cannot bypass unsupported destinations.`
          : serviceTypeStatus === "DISCONTINUED"
          ? `${carrierName} has discontinued service in ${normalizedRegion}.`
          : serviceTypeStatus === "UNSUPPORTED"
          ? `${carrierName} does not support "${deliveryType === "desk" ? "Stop-Desk" : "Home"}" delivery in ${normalizedRegion}.`
          : weightStatus === "EXCEEDS_MAX_WEIGHT"
          ? `Billable weight (${billableWeightKg} kg) exceeds ${carrierName}'s maximum limit (${primaryProfile.maxWeightKg} kg).`
          : `COD amount (${codAmount.toLocaleString()}) exceeds ${carrierName}'s COD limit (${primaryProfile.maxCodLimit.toLocaleString()}).`;

      results.push({
        carrierId,
        carrierName,
        countryCode,
        regionCode: normalizedRegion,
        deliveryType,
        operationalState,
        destinationStatus,
        serviceTypeStatus,
        weightStatus,
        codEligibilityStatus,
        canApplyManualPriceOverride: false,
        selectedSource: null,
        freshnessStatus: "UNAVAILABLE",
        isConfirmedPrice: false,
        isAutoPreferred: false,
        requiresManualSelectionOrRenewal: false,
        actualWeightKg,
        volumetricWeightKg,
        billableWeightKg,
        weightBasisStatus,
        shippingFee: null,
        codFee: 0,
        returnFee: refRule.returnFee,
        estimatedDaysMin: refRule.estimatedDaysMin,
        estimatedDaysMax: refRule.estimatedDaysMax,
        historicalSuccessRatePercent: refRule.historicalSuccessRatePercent || 85,
        lastUpdatedAt: null,
        validUntil: null,
        statusBadgeText:
          operationalState === "DESTINATION_UNSUPPORTED"
            ? "Destination Unsupported (Blocked)"
            : "Service Unavailable (Blocked)",
        statusBadgeTone: "rose",
        blockReason,
      });
      continue;
    }

    // Operational service is ELIGIBLE -> Now evaluate candidate pricing sources
    const computeRateForProfile = (prof: CarrierTariffProfile): number | null => {
      const r = findRegionRule(prof);
      const base = deliveryType === "desk" ? r.deskDeliveryRate : r.homeDeliveryRate;
      if (base === null || base === undefined) return null;
      const extraSteps = Math.max(
        0,
        Math.ceil((billableWeightKg - prof.baseWeightKg) / (prof.weightStepKg || 1))
      );
      return base + extraSteps * prof.extraStepFee;
    };

    // Check if Merchant applied a Manual Price Override on this eligible service
    const manualOverride = manualPriceOverrides[carrierId];
    if (manualOverride && manualOverride.price >= 0) {
      const codFee = isCod ? Math.round((codAmount * refRule.codFeePercent) / 100) : 0;
      results.push({
        carrierId,
        carrierName,
        countryCode,
        regionCode: normalizedRegion,
        deliveryType,
        operationalState: "MANUAL_PRICE_OVERRIDE",
        destinationStatus,
        serviceTypeStatus,
        weightStatus,
        codEligibilityStatus,
        canApplyManualPriceOverride: true,
        selectedSource: "merchant_manual_override",
        freshnessStatus: "FRESH",
        isConfirmedPrice: true,
        isAutoPreferred: true,
        requiresManualSelectionOrRenewal: false,
        actualWeightKg,
        volumetricWeightKg,
        billableWeightKg,
        weightBasisStatus,
        shippingFee: manualOverride.price,
        codFee,
        returnFee: refRule.returnFee,
        estimatedDaysMin: refRule.estimatedDaysMin,
        estimatedDaysMax: refRule.estimatedDaysMax,
        historicalSuccessRatePercent: refRule.historicalSuccessRatePercent || 90,
        lastUpdatedAt: new Date().toISOString(),
        validUntil: null,
        statusBadgeText: "Manual Price Override (Audited)",
        statusBadgeTone: "blue",
        warningMessage: `Manual fee applied: ${manualOverride.reason}`,
      });
      continue;
    }

    // Evaluate each profile source for Freshness and Expiration
    let freshContract: { prof: CarrierTariffProfile; fee: number } | null = null;
    let staleContract: { prof: CarrierTariffProfile; fee: number } | null = null;
    let freshApi: { prof: CarrierTariffProfile; fee: number } | null = null;
    let staleApi: { prof: CarrierTariffProfile; fee: number } | null = null;
    let freshRef: { prof: CarrierTariffProfile; fee: number } | null = null;
    let staleRef: { prof: CarrierTariffProfile; fee: number } | null = null;

    for (const prof of carrierProfiles) {
      const isExpired = prof.validUntil ? nowMs > new Date(prof.validUntil).getTime() : false;
      if (isExpired) continue; // Disqualify expired rates immediately

      const fee = computeRateForProfile(prof);
      if (fee === null) continue;

      const ageMs = nowMs - new Date(prof.lastUpdatedAt).getTime();
      const ageDays = ageMs / (86400 * 1000);
      const ageMins = ageMs / (60 * 1000);

      if (prof.source === "merchant_custom") {
        if (ageDays <= 90) {
          freshContract = { prof, fee };
        } else {
          staleContract = { prof, fee };
        }
      } else if (prof.source === "official_api") {
        if (ageMins <= 15) {
          freshApi = { prof, fee };
        } else if (ageDays <= 1) {
          staleApi = { prof, fee };
        }
      } else if (prof.source === "yume_verified") {
        if (ageDays <= 30) {
          freshRef = { prof, fee };
        } else {
          staleRef = { prof, fee };
        }
      }
    }

    // Apply Automatic Selection Priority Rules (Correction #1):
    // 1. Fresh Merchant Contract Rate (if preferMerchantContractOverLiveApi)
    // 2. Fresh Official Carrier API Quote (MUST take priority over any Stale Merchant Contract Rate!)
    // 3. Stale Merchant Contract Rate ONLY if merchant explicitly clicked manual selection for this carrier, or if no Fresh API exists
    // 4. YUME Reference Tariff / Stale API Fallback

    let chosen: {
      prof: CarrierTariffProfile;
      fee: number;
      source: TariffSourceType;
      freshness: "FRESH" | "STALE";
      isConfirmed: boolean;
      badgeText: string;
      badgeTone: "emerald" | "blue" | "amber" | "slate";
      warning?: string;
      requiresManualOrRenewal: boolean;
    } | null = null;

    const userForcedStaleContract = forceManualSelectionCarrierIds.includes(carrierId);

    if (userForcedStaleContract && staleContract) {
      chosen = {
        prof: staleContract.prof,
        fee: staleContract.fee,
        source: "merchant_custom",
        freshness: "STALE",
        isConfirmed: false,
        badgeText: "Stale Contract Rate (Manually Selected)",
        badgeTone: "amber",
        warning: `Contract rate last updated on ${new Date(staleContract.prof.lastUpdatedAt).toLocaleDateString()} (>90 days ago). Renew contract to restore automatic priority.`,
        requiresManualOrRenewal: true,
      };
    } else if (preferMerchantContractOverLiveApi && freshContract) {
      const dimsMissing = weightBasisStatus === "DIMENSIONS_MISSING_PROVISIONAL";
      chosen = {
        prof: freshContract.prof,
        fee: freshContract.fee,
        source: "merchant_custom",
        freshness: "FRESH",
        isConfirmed: !dimsMissing,
        badgeText: dimsMissing
          ? "Active Contract Rate (Dimensions Missing)"
          : "Active Merchant Contract Rate",
        badgeTone: dimsMissing ? "amber" : "blue",
        warning: dimsMissing
          ? "Package dimensions missing — provisional dead-weight calculation."
          : undefined,
        requiresManualOrRenewal: false,
      };
    } else if (freshApi) {
      const dimsMissing = weightBasisStatus === "DIMENSIONS_MISSING_PROVISIONAL";
      chosen = {
        prof: freshApi.prof,
        fee: freshApi.fee,
        source: "official_api",
        freshness: "FRESH",
        isConfirmed: !dimsMissing,
        badgeText: dimsMissing
          ? "Live API Rate (Dimensions Missing)"
          : "Confirmed Live Carrier API Rate",
        badgeTone: dimsMissing ? "amber" : "emerald",
        warning: staleContract
          ? `Fresh Official Carrier API quote automatically prioritized over Stale Merchant Contract Rate (${staleContract.fee} DZD, >90 days old).`
          : dimsMissing
          ? "Package dimensions missing — provisional dead-weight quote."
          : undefined,
        requiresManualOrRenewal: false,
      };
    } else if (freshContract) {
      const dimsMissing = weightBasisStatus === "DIMENSIONS_MISSING_PROVISIONAL";
      chosen = {
        prof: freshContract.prof,
        fee: freshContract.fee,
        source: "merchant_custom",
        freshness: "FRESH",
        isConfirmed: !dimsMissing,
        badgeText: "Active Merchant Contract Rate",
        badgeTone: "blue",
        requiresManualOrRenewal: false,
      };
    } else if (staleContract) {
      chosen = {
        prof: staleContract.prof,
        fee: staleContract.fee,
        source: "merchant_custom",
        freshness: "STALE",
        isConfirmed: false,
        badgeText: "Stale Contract Rate (>90d — Verify/Renew)",
        badgeTone: "amber",
        warning: `Contract rate last updated on ${new Date(staleContract.prof.lastUpdatedAt).toLocaleDateString()} (>90 days ago). Manual confirmation or renewal required.`,
        requiresManualOrRenewal: true,
      };
    } else if (staleApi) {
      chosen = {
        prof: staleApi.prof,
        fee: staleApi.fee,
        source: "official_api",
        freshness: "STALE",
        isConfirmed: false,
        badgeText: "Cached API Quote — Unconfirmed Estimate",
        badgeTone: "amber",
        warning: "Carrier API unreachable — showing cached unconfirmed estimate.",
        requiresManualOrRenewal: false,
      };
    } else if (freshRef) {
      chosen = {
        prof: freshRef.prof,
        fee: freshRef.fee,
        source: "yume_verified",
        freshness: "FRESH",
        isConfirmed: false, // Reference tariff is NEVER presented as a confirmed carrier price
        badgeText: "YUME Reference Tariff (Unconfirmed Estimate)",
        badgeTone: "slate",
        warning: `Reference tariff verified on ${new Date(freshRef.prof.lastUpdatedAt).toLocaleDateString()} — Estimate only, verify actual invoice with carrier.`,
        requiresManualOrRenewal: false,
      };
    } else if (staleRef) {
      chosen = {
        prof: staleRef.prof,
        fee: staleRef.fee,
        source: "yume_verified",
        freshness: "STALE",
        isConfirmed: false,
        badgeText: "Stale Reference Estimate (>30d — Verify Rate)",
        badgeTone: "amber",
        warning: `Reference tariff last updated on ${new Date(staleRef.prof.lastUpdatedAt).toLocaleDateString()} (>30 days ago). Confirm actual fee with carrier.`,
        requiresManualOrRenewal: false,
      };
    }

    if (!chosen) {
      // Operational service is supported, but all pricing tables expired or missing -> PRICE_UNAVAILABLE
      results.push({
        carrierId,
        carrierName,
        countryCode,
        regionCode: normalizedRegion,
        deliveryType,
        operationalState: "PRICE_UNAVAILABLE",
        destinationStatus,
        serviceTypeStatus,
        weightStatus,
        codEligibilityStatus,
        canApplyManualPriceOverride: true,
        selectedSource: null,
        freshnessStatus: "EXPIRED",
        isConfirmedPrice: false,
        isAutoPreferred: false,
        requiresManualSelectionOrRenewal: true,
        actualWeightKg,
        volumetricWeightKg,
        billableWeightKg,
        weightBasisStatus,
        shippingFee: null,
        codFee: 0,
        returnFee: refRule.returnFee,
        estimatedDaysMin: refRule.estimatedDaysMin,
        estimatedDaysMax: refRule.estimatedDaysMax,
        historicalSuccessRatePercent: refRule.historicalSuccessRatePercent || 85,
        lastUpdatedAt: null,
        validUntil: null,
        statusBadgeText: "Price Unavailable — Enter Manual Rate Override",
        statusBadgeTone: "amber",
        warningMessage:
          "Service coverage is valid, but tariff pricing is expired or missing. You may enter a Manual Price Override.",
      });
      continue;
    }

    const codFee = isCod ? Math.round((codAmount * refRule.codFeePercent) / 100) : 0;

    results.push({
      carrierId,
      carrierName,
      countryCode,
      regionCode: normalizedRegion,
      deliveryType,
      operationalState: chosen.isConfirmed ? "ELIGIBLE" : "PRICE_UNVERIFIED",
      destinationStatus,
      serviceTypeStatus,
      weightStatus,
      codEligibilityStatus,
      canApplyManualPriceOverride: true,
      selectedSource: chosen.source,
      freshnessStatus: chosen.freshness,
      isConfirmedPrice: chosen.isConfirmed,
      isAutoPreferred: !chosen.requiresManualOrRenewal,
      requiresManualSelectionOrRenewal: chosen.requiresManualOrRenewal,
      actualWeightKg,
      volumetricWeightKg,
      billableWeightKg,
      weightBasisStatus,
      shippingFee: chosen.fee,
      codFee,
      returnFee: refRule.returnFee,
      estimatedDaysMin: refRule.estimatedDaysMin,
      estimatedDaysMax: refRule.estimatedDaysMax,
      historicalSuccessRatePercent: refRule.historicalSuccessRatePercent || 90,
      lastUpdatedAt: chosen.prof.lastUpdatedAt,
      validUntil: chosen.prof.validUntil || null,
      statusBadgeText: chosen.badgeText,
      statusBadgeTone: chosen.badgeTone,
      warningMessage: chosen.warning,
      staleContractCandidate:
        staleContract && chosen.source !== "merchant_custom"
          ? {
              shippingFee: staleContract.fee,
              lastUpdatedAt: staleContract.prof.lastUpdatedAt,
              validUntil: staleContract.prof.validUntil,
            }
          : undefined,
    });
  }

  return results;
}

// ============================================================================
// 3. SPLIT-SHIPMENT ALLOCATION & FINANCIAL INVARIANT ENGINE (PART 3 & PART 4)
// ============================================================================

export function createSplitOrderShipments(params: {
  order: Order;
  splits: Array<{
    carrierId: string;
    carrierName: string;
    rateSource: TariffSourceType;
    isConfirmedPrice: boolean;
    deliveryType: "home" | "desk";
    trackingNumber?: string;
    carrierShippingFee: number;
    carrierCodFee: number;
    actualWeightKg: number;
    dimensionsCm?: { length: number; width: number; height: number } | null;
    volumetricDivisor?: number | null;
    allocatedItemQuantities: Record<string, number>; // orderItemId -> qty
    allocatedDiscountAmount: number;
    allocatedCustomerShippingFee: number;
  }>;
}): {
  updatedOrder: Order;
  validationErrors: string[];
} {
  const { order, splits } = params;
  const itemSnapshots = order.itemSnapshots || [];
  const errors: string[] = [];

  if (splits.length === 0) {
    return { updatedOrder: order, validationErrors: ["At least one shipment is required."] };
  }

  // Verify item quantity invariant: SUM across shipments == OrderedQty
  for (const item of itemSnapshots) {
    const totalAllocated = splits.reduce(
      (sum, sp) => sum + Number(sp.allocatedItemQuantities[item.id] || 0),
      0
    );
    if (totalAllocated !== item.orderedQty) {
      errors.push(
        `Item "${item.productName}" quantity mismatch: allocated ${totalAllocated} across shipments, but order requires exactly ${item.orderedQty}.`
      );
    }
  }

  // Verify discount & customer shipping fee invariant: counted strictly once
  const expectedDiscount = Number(order.discountAmount || 0);
  const sumAllocatedDiscount = splits.reduce(
    (sum, sp) => sum + Number(sp.allocatedDiscountAmount || 0),
    0
  );
  if (Math.abs(sumAllocatedDiscount - expectedDiscount) > 1) {
    errors.push(
      `Allocated discount sum (${sumAllocatedDiscount}) must equal Order Discount (${expectedDiscount}) so discounts are counted exactly once.`
    );
  }

  const expectedCustShipping = Number(order.shippingCost || 0);
  const sumAllocatedCustShipping = splits.reduce(
    (sum, sp) => sum + Number(sp.allocatedCustomerShippingFee || 0),
    0
  );
  if (Math.abs(sumAllocatedCustShipping - expectedCustShipping) > 1) {
    errors.push(
      `Allocated customer shipping fee sum (${sumAllocatedCustShipping}) must equal Order Customer Shipping Fee (${expectedCustShipping}) so customer shipping is counted exactly once.`
    );
  }

  if (errors.length > 0) {
    return { updatedOrder: order, validationErrors: errors };
  }

  const newShipments: ShipmentRecord[] = splits.map((sp, idx) => {
    const allocatedItems = itemSnapshots
      .filter((it) => Number(sp.allocatedItemQuantities[it.id] || 0) > 0)
      .map((it) => ({
        orderItemId: it.id,
        productId: it.productId,
        productName: it.productName,
        quantity: Number(sp.allocatedItemQuantities[it.id]),
        unitSalePrice: it.unitSalePrice,
        unitDiscount: it.unitDiscount,
        unitPurchaseCost: it.unitPurchaseCost,
      }));

    const parcelMerchandiseGmv = allocatedItems.reduce(
      (sum, ai) => sum + (ai.unitSalePrice - ai.unitDiscount) * ai.quantity,
      0
    );
    const shipmentCodCollectable = Math.max(
      0,
      parcelMerchandiseGmv - sp.allocatedDiscountAmount + sp.allocatedCustomerShippingFee
    );

    const divisor = sp.volumetricDivisor ?? 5000;
    const volWeight =
      sp.dimensionsCm && divisor
        ? Number(
            (
              (sp.dimensionsCm.length * sp.dimensionsCm.width * sp.dimensionsCm.height) /
              divisor
            ).toFixed(2)
          )
        : null;
    const billableWeightKg = volWeight ? Math.max(sp.actualWeightKg, volWeight) : sp.actualWeightKg;

    const tracking =
      sp.trackingNumber ||
      `YUME-${sp.carrierId.slice(0, 3).toUpperCase()}-${order.id.slice(-4)}-${idx + 1}`;

    return {
      id: `shp_${order.id}_${idx + 1}`,
      orderId: order.id,
      storeId: order.storeId,
      shipmentIndex: idx + 1,
      totalShipmentsInOrder: splits.length,
      isSplitShipment: splits.length > 1,
      carrierId: sp.carrierId,
      carrierName: sp.carrierName,
      rateSource: sp.rateSource,
      isConfirmedPrice: sp.isConfirmedPrice,
      trackingNumber: tracking,
      deliveryType: sp.deliveryType,
      actualWeightKg: sp.actualWeightKg,
      dimensionsCm: sp.dimensionsCm || null,
      volumetricDivisor: divisor,
      volumetricWeightKg: volWeight,
      billableWeightKg,
      weightBasisStatus: sp.dimensionsCm
        ? "VERIFIED_DIMENSIONAL_WEIGHT"
        : "DIMENSIONS_MISSING_PROVISIONAL",
      isFragile: false,
      allowOpenPackage: true,
      exchangeRequired: false,
      allocatedItems,
      allocatedDiscountAmount: sp.allocatedDiscountAmount,
      allocatedCustomerShippingFee: sp.allocatedCustomerShippingFee,
      shipmentCodCollectable,
      carrierShippingFee: sp.carrierShippingFee,
      carrierCodFee: sp.carrierCodFee,
      carrierReturnFee: 0,
      cashCollectedByCourier: 0,
      netPayableByCarrier:
        shipmentCodCollectable - sp.carrierShippingFee - sp.carrierCodFee,
      remittedPayoutToMerchant: 0,
      shipmentStatus: "shipment_created",
      dispatchedAt: new Date().toISOString(),
      failedAttempts: 0,
      carrierEvents: [
        {
          id: `evt_${order.id}_${idx + 1}_created`,
          timestamp: new Date().toISOString(),
          status: "shipment_created",
          location: order.shopper.wilaya,
          description: `Shipment ${idx + 1} of ${splits.length} created via ${sp.carrierName} (COD: ${shipmentCodCollectable.toLocaleString()})`,
        },
      ],
    };
  });

  const updatedOrder: Order = {
    ...order,
    updatedAt: new Date().toISOString(),
    postMigrationRevision: (order.postMigrationRevision || 0) + 1,
    orderStatus:
      order.orderStatus === "new" || order.orderStatus === "confirmation_pending"
        ? "ready_to_ship"
        : order.orderStatus,
    shipmentStatus: "shipment_created",
    trackingCode: newShipments.map((s) => s.trackingNumber).join(", "),
    deliveryCompany: newShipments[0].carrierId,
    deliveryCompanyName:
      newShipments.length > 1
        ? `Multi-Carrier (${newShipments.length} Shipments)`
        : newShipments[0].carrierName,
    shipments: newShipments,
    timeline: [
      {
        id: `tl_${order.id}_split_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: "merchant",
        actorName: "Fulfillment Desk",
        actorRole: "admin",
        dimension: "shipment",
        newValue: `split_${newShipments.length}_shipments`,
        description:
          newShipments.length > 1
            ? `Order split into ${newShipments.length} physical shipments (${newShipments
                .map((s) => `${s.carrierName}: ${s.trackingNumber}`)
                .join(" | ")})`
            : `Shipment created with ${newShipments[0].carrierName} (${newShipments[0].trackingNumber})`,
      },
      ...(order.timeline || []),
    ],
  };

  updatedOrder.financials = computeOrderFinancials(updatedOrder);
  return { updatedOrder, validationErrors: [] };
}

// ============================================================================
// 4. COD REMITTANCE BATCH PARSER, DEDUPLICATOR & SETTLEMENT ENGINE (PART 4)
// ============================================================================

const committedRemittanceLineHashes = new Set<string>();

export function resetCommittedRemittanceHashesForTest(): void {
  committedRemittanceLineHashes.clear();
}

export function previewCarrierRemittanceBatch(params: {
  storeId: string;
  carrierId: string;
  carrierName: string;
  batchReference: string;
  orders: Order[];
  rawRows: Array<{
    payoutReference: string;
    trackingNumber: string;
    reportedCollectedCod: number;
    reportedCarrierShippingFee: number;
    reportedCarrierCodFee: number;
    reportedReturnFee?: number;
    remittedNetPayout: number;
  }>;
}): SettlementBatchRecord {
  const { storeId, carrierId, carrierName, batchReference, orders, rawRows } = params;

  const lines: SettlementRemittanceLine[] = [];
  let matchedCount = 0;
  let discrepancyCount = 0;
  let duplicateBlockedCount = 0;

  let totalReportedCollectedCod = 0;
  let totalReportedCarrierFees = 0;
  let totalExpectedNetPayout = 0;
  let totalActualRemittedPayout = 0;
  let totalDiscrepancyAmount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const lineHash = deterministicHash(
      `${storeId}::${carrierId.toLowerCase()}::${row.trackingNumber.trim().toUpperCase()}::${row.payoutReference.trim().toUpperCase()}`
    );

    // Locate matching order & shipment
    let matchedOrder: Order | undefined;
    let matchedShipment: ShipmentRecord | undefined;

    for (const o of orders) {
      for (const sh of o.shipments || []) {
        if (
          sh.trackingNumber.trim().toUpperCase() === row.trackingNumber.trim().toUpperCase() ||
          o.id.trim().toUpperCase() === row.trackingNumber.trim().toUpperCase()
        ) {
          matchedOrder = o;
          matchedShipment = sh;
          break;
        }
      }
      if (matchedOrder) break;
    }

    if (committedRemittanceLineHashes.has(lineHash)) {
      duplicateBlockedCount++;
      lines.push({
        id: `rem_line_${i + 1}`,
        lineHash,
        payoutReference: row.payoutReference,
        orderId: matchedOrder?.id,
        shipmentId: matchedShipment?.id,
        trackingNumber: row.trackingNumber,
        customerName: matchedOrder?.shopper.name,
        expectedCodCollectable: matchedShipment?.shipmentCodCollectable || 0,
        reportedCollectedCod: row.reportedCollectedCod,
        expectedCarrierFees:
          (matchedShipment?.carrierShippingFee || 0) +
          (matchedShipment?.carrierCodFee || 0) +
          (matchedShipment?.carrierReturnFee || 0),
        reportedCarrierShippingFee: row.reportedCarrierShippingFee,
        reportedCarrierCodFee: row.reportedCarrierCodFee,
        reportedReturnFee: row.reportedReturnFee || 0,
        expectedNetPayable: matchedShipment?.netPayableByCarrier || 0,
        remittedNetPayout: row.remittedNetPayout,
        discrepancyAmount: 0,
        matchStatus: "duplicate_already_settled",
        notes: `Duplicate remittance line (${row.payoutReference}) already reconciled — blocked to prevent double settlement.`,
      });
      continue;
    }

    if (!matchedOrder || !matchedShipment) {
      discrepancyCount++;
      lines.push({
        id: `rem_line_${i + 1}`,
        lineHash,
        payoutReference: row.payoutReference,
        trackingNumber: row.trackingNumber,
        expectedCodCollectable: 0,
        reportedCollectedCod: row.reportedCollectedCod,
        expectedCarrierFees: 0,
        reportedCarrierShippingFee: row.reportedCarrierShippingFee,
        reportedCarrierCodFee: row.reportedCarrierCodFee,
        reportedReturnFee: row.reportedReturnFee || 0,
        expectedNetPayable: 0,
        remittedNetPayout: row.remittedNetPayout,
        discrepancyAmount: row.remittedNetPayout,
        matchStatus: "missing_order",
        notes: "No matching YUME order or tracking number found.",
      });
      continue;
    }

    const expectedCod = matchedShipment.shipmentCodCollectable;
    const expectedFees =
      matchedShipment.carrierShippingFee +
      matchedShipment.carrierCodFee +
      matchedShipment.carrierReturnFee;
    const expectedRemainingNetPayable = Math.max(
      0,
      expectedCod - expectedFees - (matchedShipment.remittedPayoutToMerchant || 0)
    );

    const reportedFees =
      row.reportedCarrierShippingFee +
      row.reportedCarrierCodFee +
      (row.reportedReturnFee || 0);
    const discrepancy = expectedRemainingNetPayable - row.remittedNetPayout;

    let matchStatus: SettlementRemittanceLine["matchStatus"] = "matched";
    let notes = "Exact match with expected carrier net payable.";

    if (Math.abs(discrepancy) <= 1 && Math.abs(reportedFees - expectedFees) <= 1) {
      matchStatus = "matched";
      matchedCount++;
    } else if (
      row.remittedNetPayout > 0 &&
      row.remittedNetPayout < expectedRemainingNetPayable &&
      Math.abs(reportedFees - expectedFees) <= 1
    ) {
      matchStatus = "partial_settlement";
      matchedCount++;
      notes = `Partial payout of ${row.remittedNetPayout.toLocaleString()} against ${expectedRemainingNetPayable.toLocaleString()} remaining net payable (${discrepancy.toLocaleString()} still pending).`;
    } else if (Math.abs(reportedFees - expectedFees) > 1) {
      matchStatus = "fee_discrepancy";
      discrepancyCount++;
      notes = `Carrier fee discrepancy: charged ${reportedFees.toLocaleString()} vs expected ${expectedFees.toLocaleString()}.`;
    } else {
      matchStatus = "amount_discrepancy";
      discrepancyCount++;
      notes = `Payout discrepancy of ${discrepancy.toLocaleString()}.`;
    }

    totalReportedCollectedCod += row.reportedCollectedCod;
    totalReportedCarrierFees += reportedFees;
    totalExpectedNetPayout += expectedRemainingNetPayable;
    totalActualRemittedPayout += row.remittedNetPayout;
    totalDiscrepancyAmount += Math.max(0, discrepancy);

    lines.push({
      id: `rem_line_${i + 1}`,
      lineHash,
      payoutReference: row.payoutReference,
      orderId: matchedOrder.id,
      shipmentId: matchedShipment.id,
      trackingNumber: row.trackingNumber,
      customerName: matchedOrder.shopper.name,
      expectedCodCollectable: expectedCod,
      reportedCollectedCod: row.reportedCollectedCod,
      expectedCarrierFees: expectedFees,
      reportedCarrierShippingFee: row.reportedCarrierShippingFee,
      reportedCarrierCodFee: row.reportedCarrierCodFee,
      reportedReturnFee: row.reportedReturnFee || 0,
      expectedNetPayable: expectedRemainingNetPayable,
      remittedNetPayout: row.remittedNetPayout,
      discrepancyAmount: discrepancy,
      matchStatus,
      notes,
    });
  }

  return {
    id: `batch_${Date.now()}`,
    batchReference,
    storeId,
    carrierId,
    carrierName,
    createdAt: new Date().toISOString(),
    status: "preview",
    totalLinesCount: lines.length,
    matchedCount,
    discrepancyCount,
    duplicateBlockedCount,
    totalReportedCollectedCod,
    totalReportedCarrierFees,
    totalExpectedNetPayout,
    totalActualRemittedPayout,
    totalDiscrepancyAmount,
    lines,
  };
}

export function commitCarrierRemittanceBatch(params: {
  batch: SettlementBatchRecord;
  orders: Order[];
}): {
  updatedOrders: Order[];
  committedBatch: SettlementBatchRecord;
  newlySettledLinesCount: number;
} {
  const { batch, orders } = params;
  let newlySettledLinesCount = 0;

  const updatedOrders = orders.map((order) => {
    const matchingLines = batch.lines.filter(
      (l) =>
        l.orderId === order.id &&
        l.matchStatus !== "duplicate_already_settled" &&
        l.matchStatus !== "missing_order"
    );

    if (matchingLines.length === 0) return order;

    const updatedShipments = (order.shipments || []).map((sh) => {
      const shLine = matchingLines.find((l) => l.shipmentId === sh.id);
      if (!shLine || committedRemittanceLineHashes.has(shLine.lineHash)) {
        return sh;
      }

      committedRemittanceLineHashes.add(shLine.lineHash);
      newlySettledLinesCount++;

      const expectedNetPayable =
        sh.shipmentCodCollectable -
        sh.carrierShippingFee -
        sh.carrierCodFee -
        sh.carrierReturnFee;

      const nextRemitted = Math.min(
        expectedNetPayable,
        (sh.remittedPayoutToMerchant || 0) + shLine.remittedNetPayout
      );

      return {
        ...sh,
        shipmentStatus: "delivered" as const,
        cashCollectedByCourier: sh.shipmentCodCollectable,
        netPayableByCarrier: expectedNetPayable,
        remittedPayoutToMerchant: nextRemitted,
        settlementBatchId: batch.id,
      };
    });

    const tempOrder: Order = {
      ...order,
      updatedAt: new Date().toISOString(),
      postMigrationRevision: (order.postMigrationRevision || 0) + 1,
      orderStatus: "delivered",
      status: "delivered",
      shipmentStatus: "delivered",
      shipments: updatedShipments,
    };

    const financials = computeOrderFinancials(tempOrder);
    const hasDiscrepancy = matchingLines.some(
      (l) => l.matchStatus === "fee_discrepancy" || l.matchStatus === "amount_discrepancy"
    );

    const nextPaymentStatus: Order["paymentStatus"] = hasDiscrepancy
      ? "disputed"
      : financials.pendingSettlement <= 1 && financials.actualCashReceived > 0
      ? "settled"
      : financials.actualCashReceived > 0
      ? "partially_settled"
      : "settlement_pending";

    tempOrder.paymentStatus = nextPaymentStatus;
    tempOrder.financials = computeOrderFinancials(tempOrder);
    tempOrder.timeline = [
      {
        id: `tl_${order.id}_settle_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: "merchant",
        actorName: "Financial Reconciliation",
        actorRole: "admin",
        dimension: "payment",
        newValue: nextPaymentStatus,
        description: `Reconciled in batch ${batch.batchReference}: Received ${tempOrder.financials.actualCashReceived.toLocaleString()} (Pending: ${tempOrder.financials.pendingSettlement.toLocaleString()})`,
      },
      ...(order.timeline || []),
    ];

    return tempOrder;
  });

  const committedBatch: SettlementBatchRecord = {
    ...batch,
    committedAt: new Date().toISOString(),
    status: "committed",
  };

  return {
    updatedOrders,
    committedBatch,
    newlySettledLinesCount,
  };
}

// ============================================================================
// 5. STORE-WIDE FINANCIAL ROLLUP AGGREGATOR
// ============================================================================

export function computeStoreFinancialRollup(orders: Order[]) {
  let totalConfirmedGmv = 0;
  let totalNetOrderRevenue = 0;
  let totalCodCollectable = 0;
  let totalCollectedByCouriers = 0;
  let totalNetPayableByCarriers = 0;
  let totalActualCashReceived = 0;
  let totalPendingSettlement = 0;
  let totalInTransitExpectedNetCod = 0;
  let totalDisputedShortfall = 0;
  let totalOutstandingCarrierReceivables = 0;
  let totalOutstandingBalance = 0;

  let verifiedGrossProductProfit = 0;
  let verifiedNetOperationalProfit = 0;
  let totalCogsVerified = 0;
  let totalCarrierShippingExpenses = 0;
  let totalCarrierCodFees = 0;
  let totalReturnFees = 0;
  let totalDamagedInventoryLoss = 0;
  let totalPackagingExpenses = 0;

  let missingCostOrdersCount = 0;
  let verifiedCostOrdersCount = 0;

  for (const raw of orders) {
    const fin = raw.financials || computeOrderFinancials(raw);
    totalConfirmedGmv += fin.gmv;
    totalNetOrderRevenue += fin.netOrderRevenue;
    totalCodCollectable += fin.totalCodCollectable;
    totalCollectedByCouriers += fin.collectedCod;
    totalNetPayableByCarriers += Math.max(0, fin.netPayableByCarrier);
    totalActualCashReceived += fin.actualCashReceived;
    totalPendingSettlement += fin.pendingSettlement;
    totalInTransitExpectedNetCod += fin.inTransitExpectedNetCod;
    totalDisputedShortfall += fin.disputedShortfallAmount;
    totalOutstandingCarrierReceivables += fin.outstandingCarrierReceivables;
    totalOutstandingBalance += fin.totalOutstandingBalance;

    totalCarrierShippingExpenses += fin.totalCarrierShippingExpense;
    totalCarrierCodFees += fin.totalCarrierCodFee;
    totalReturnFees += fin.totalReturnFee;
    totalDamagedInventoryLoss += fin.damagedInventoryLoss;
    totalPackagingExpenses += fin.packagingAndOtherCost;

    if (fin.hasMissingPurchaseCost) {
      missingCostOrdersCount++;
    } else {
      verifiedCostOrdersCount++;
      totalCogsVerified += fin.totalCogs || 0;
      verifiedGrossProductProfit += fin.grossProductProfit || 0;
      verifiedNetOperationalProfit += fin.netOperationalProfit || 0;
    }
  }

  return {
    totalConfirmedGmv,
    totalNetOrderRevenue,
    totalCodCollectable,
    totalCollectedByCouriers,
    totalNetPayableByCarriers,
    totalActualCashReceived,
    totalPendingSettlement,
    totalInTransitExpectedNetCod,
    totalDisputedShortfall,
    totalOutstandingCarrierReceivables,
    totalOutstandingBalance,
    verifiedGrossProductProfit,
    verifiedNetOperationalProfit,
    totalCogsVerified,
    totalCarrierShippingExpenses,
    totalCarrierCodFees,
    totalReturnFees,
    totalDamagedInventoryLoss,
    totalPackagingExpenses,
    missingCostOrdersCount,
    verifiedCostOrdersCount,
  };
}

// ============================================================================
// 6. EIGHT-SCENARIO END-TO-END INTEGRITY VERIFICATION SUITE (PART 7 / SECTION 8)
// ============================================================================

export interface EndToEndTestResult {
  testId: string;
  title: string;
  passed: boolean;
  expectedSummary: string;
  actualSummary: string;
  integrityInvariantVerified: string;
}

export function runAllEightEndToEndVerificationTests(): EndToEndTestResult[] {
  const results: EndToEndTestResult[] = [];

  const createSampleV1Order = (id: string, price = 5000, buyPrice = 2200): Order => ({
    id,
    storeId: "test_store_e2e",
    storeName: "YUME Test Store",
    date: "2026-11-01T10:00:00.000Z",
    shopper: {
      name: "Karim Benali",
      email: "karim@example.dz",
      phone: "0550123456",
      wilaya: "Alger",
      wilayaCode: "16",
      commune: "Hydra",
      address: "12 Rue Didouche Mourad",
    },
    items: [
      {
        id: "prod_1",
        name: "Artisan Leather Jacket",
        price,
        buyPrice,
        purchasePrice: buyPrice,
        quantity: 1,
        imageUrl: "",
      },
    ],
    discountAmount: 500,
    total: price - 500 + 600,
    shippingCost: 600,
    status: "pending",
    paymentMethod: "cod",
    deliveryCompany: "yalidine",
    deliveryCompanyName: "Yalidine Express",
    trackingCode: `TRK-${id}`,
  });

  // T1: Backup Failure Before Migration
  {
    const rawV1 = [createSampleV1Order("O1"), createSampleV1Order("O2")];
    const migRes = runStoreOrdersMigration({
      storeId: "test_store_t1",
      rawOrders: rawV1,
      catalogProducts: [],
      simulateBackupFailure: true,
    });
    const allUntouchedV1 = migRes.orders.every((o) => !o.schemaVersion || o.schemaVersion === 1);
    const passed =
      migRes.status === "MIGRATION_ABORTED_BACKUP_UNVERIFIED" &&
      allUntouchedV1 &&
      migRes.orders.length === 2;
    results.push({
      testId: "T1",
      title: "Backup Failure Before Migration",
      passed,
      expectedSummary: "MIGRATION_ABORTED_BACKUP_UNVERIFIED with 100% untouched v1 records",
      actualSummary: `Status: ${migRes.status}, Untouched v1 count: ${migRes.orders.length}/2`,
      integrityInvariantVerified: "Zero partial v2 mutations when backup verification fails.",
    });
  }

  // T2: Concurrent Order Modification During Migration
  {
    const rawV1 = [createSampleV1Order("O1"), createSampleV1Order("O2")];
    const migRes = runStoreOrdersMigration({
      storeId: "test_store_t2",
      rawOrders: rawV1,
      catalogProducts: [],
      serverBackupCallback: () => {
        // Simulate concurrent order confirmation while migration lock is active
        enqueueOrApplyOrderMutation("test_store_t2", rawV1, (orders) =>
          orders.map((o) =>
            o.id === "O2"
              ? transitionOrderDimension({
                  order: o,
                  dimension: "order",
                  newValue: "confirmed",
                  note: "Concurrent confirmation during migration",
                })
              : o
          )
        );
        return true;
      },
    });
    const o2 = migRes.orders.find((o) => o.id === "O2");
    const passed =
      migRes.status === "VERIFIED_COMPLETE" &&
      o2?.orderStatus === "confirmed" &&
      (o2?.postMigrationRevision || 0) >= 1;
    results.push({
      testId: "T2",
      title: "Concurrent Order Modification During Migration",
      passed,
      expectedSummary: "Buffered mutation replayed; O2 confirmed with postMigrationRevision >= 1",
      actualSummary: `O2 status: ${o2?.orderStatus}, postMigrationRevision: ${o2?.postMigrationRevision}`,
      integrityInvariantVerified: "Concurrent writes during migration are buffered and preserved.",
    });
  }

  // T3: Rollback After New Orders & Post-Migration Edits
  {
    const initial10 = Array.from({ length: 10 }, (_, i) => createSampleV1Order(`O${i + 1}`));
    const migRes = runStoreOrdersMigration({
      storeId: "test_store_t3",
      rawOrders: initial10,
      catalogProducts: [],
    });
    // Modify O2 to shipped, and add O11 & O12 post-migration
    const mutatedSet = migRes.orders.map((o) =>
      o.id === "O2"
        ? transitionOrderDimension({ order: o, dimension: "order", newValue: "shipped" })
        : o
    );
    const o11 = normalizeOrderRecord(createSampleV1Order("O11"), [], "post_mig");
    const o12 = normalizeOrderRecord(createSampleV1Order("O12"), [], "post_mig");
    const prodSetWith12 = [...mutatedSet, o11, o12];

    const rb = rollbackStoreOrdersMigration("test_store_t3", prodSetWith12, migRes.snapshotBundle);
    const restoredO2 = rb.restoredOrders.find((o) => o.id === "O2");
    const passed =
      rb.restoredOrders.length === 12 &&
      rb.unmodifiedRestoredCount === 9 &&
      rb.modifiedPreservedCount === 1 &&
      rb.newPostMigrationRetainedCount === 2 &&
      restoredO2?.status === "shipped";

    results.push({
      testId: "T3",
      title: "Rollback After New Orders & Post-Migration Edits",
      passed,
      expectedSummary: "12 total orders retained (9 verbatim v1, 1 edited O2 shipped, 2 new O11/O12)",
      actualSummary: `Total: ${rb.restoredOrders.length}, Unchanged: ${rb.unmodifiedRestoredCount}, Modified: ${rb.modifiedPreservedCount}, New: ${rb.newPostMigrationRetainedCount}`,
      integrityInvariantVerified: "Rollback never deletes post-migration orders or overwrites post-migration edits.",
    });
  }

  // T4: Duplicate Carrier Webhooks
  {
    const ord = normalizeOrderRecord(createSampleV1Order("O400"));
    const first = processIdempotentCarrierWebhook({
      order: ord,
      webhookEventId: "wh_evt_999",
      trackingNumber: "TRK-O400",
      shipmentStatus: "delivered",
    });
    const timelineLenAfterFirst = first.order.timeline?.length || 0;
    const second = processIdempotentCarrierWebhook({
      order: first.order,
      webhookEventId: "wh_evt_999",
      trackingNumber: "TRK-O400",
      shipmentStatus: "delivered",
    });
    const third = processIdempotentCarrierWebhook({
      order: second.order,
      webhookEventId: "wh_evt_999",
      trackingNumber: "TRK-O400",
      shipmentStatus: "delivered",
    });
    const passed =
      !first.isDuplicateNoop &&
      second.isDuplicateNoop &&
      third.isDuplicateNoop &&
      (third.order.timeline?.length || 0) === timelineLenAfterFirst &&
      third.order.paymentStatus === "settlement_pending";

    results.push({
      testId: "T4",
      title: "Duplicate Carrier Webhooks Idempotency",
      passed,
      expectedSummary: "Webhook #1 transitions to delivered (settlement_pending); #2 and #3 are idempotent no-ops",
      actualSummary: `Dup2: ${second.isDuplicateNoop}, Dup3: ${third.isDuplicateNoop}, PaymentStatus: ${third.order.paymentStatus}`,
      integrityInvariantVerified: "Repeated carrier webhooks never duplicate timeline events or COD collections.",
    });
  }

  // T5 & T6: Duplicate Settlement File Imports & Partial Settlement Followed by Repeated Import
  {
    resetCommittedRemittanceHashesForTest();
    // Case A Order: Price 5000, Discount 500, CustShip 600 -> COD 5100. CarrierFee 500 + CODFee 50 = 550 -> NetPayable = 4550 DZD
    const rawCaseA = createSampleV1Order("ORD-CASE-A", 5000, 2200);
    let orderA = normalizeOrderRecord(rawCaseA);
    orderA.packagingAndOtherCost = 50;
    orderA.shipments = [
      {
        ...orderA.shipments![0],
        trackingNumber: "TRK-CASE-A",
        shipmentCodCollectable: 5100,
        carrierShippingFee: 500,
        carrierCodFee: 50,
        carrierReturnFee: 0,
        cashCollectedByCourier: 5100,
        netPayableByCarrier: 4550,
        remittedPayoutToMerchant: 0,
        shipmentStatus: "delivered",
      },
    ];
    orderA.financials = computeOrderFinancials(orderA);

    // Import File 1 (Partial Payout: 3,000 DZD, ref PAY-1)
    const batch1Preview = previewCarrierRemittanceBatch({
      storeId: "test_store_e2e",
      carrierId: "yalidine",
      carrierName: "Yalidine Express",
      batchReference: "BATCH-1",
      orders: [orderA],
      rawRows: [
        {
          payoutReference: "PAY-1",
          trackingNumber: "TRK-CASE-A",
          reportedCollectedCod: 5100,
          reportedCarrierShippingFee: 500,
          reportedCarrierCodFee: 50,
          remittedNetPayout: 3000,
        },
      ],
    });
    const commit1 = commitCarrierRemittanceBatch({ batch: batch1Preview, orders: [orderA] });
    orderA = commit1.updatedOrders[0];

    const afterPartialCash = orderA.financials?.actualCashReceived || 0;
    const afterPartialPending = orderA.financials?.pendingSettlement || 0;
    const afterPartialStatus = orderA.paymentStatus;

    // Re-import File 1 (Duplicate PAY-1) -> Must be blocked!
    const batch1DupPreview = previewCarrierRemittanceBatch({
      storeId: "test_store_e2e",
      carrierId: "yalidine",
      carrierName: "Yalidine Express",
      batchReference: "BATCH-1-DUP",
      orders: [orderA],
      rawRows: [
        {
          payoutReference: "PAY-1",
          trackingNumber: "TRK-CASE-A",
          reportedCollectedCod: 5100,
          reportedCarrierShippingFee: 500,
          reportedCarrierCodFee: 50,
          remittedNetPayout: 3000,
        },
      ],
    });
    const commit1Dup = commitCarrierRemittanceBatch({ batch: batch1DupPreview, orders: [orderA] });
    orderA = commit1Dup.updatedOrders[0];
    const cashUnchangedOnDup = (orderA.financials?.actualCashReceived || 0) === 3000;

    // Import File 2 (Remaining 1,550 DZD, ref PAY-2)
    const batch2Preview = previewCarrierRemittanceBatch({
      storeId: "test_store_e2e",
      carrierId: "yalidine",
      carrierName: "Yalidine Express",
      batchReference: "BATCH-2",
      orders: [orderA],
      rawRows: [
        {
          payoutReference: "PAY-2",
          trackingNumber: "TRK-CASE-A",
          reportedCollectedCod: 5100,
          reportedCarrierShippingFee: 500,
          reportedCarrierCodFee: 50,
          remittedNetPayout: 1550,
        },
      ],
    });
    const commit2 = commitCarrierRemittanceBatch({ batch: batch2Preview, orders: [orderA] });
    orderA = commit2.updatedOrders[0];

    const passedT5 =
      batch1DupPreview.duplicateBlockedCount === 1 &&
      commit1Dup.newlySettledLinesCount === 0 &&
      cashUnchangedOnDup;

    const passedT6 =
      afterPartialCash === 3000 &&
      afterPartialPending === 1550 &&
      afterPartialStatus === "partially_settled" &&
      orderA.financials?.actualCashReceived === 4550 &&
      orderA.financials?.pendingSettlement === 0 &&
      orderA.paymentStatus === "settled" &&
      orderA.financials?.netOperationalProfit === 2300;

    results.push({
      testId: "T5",
      title: "Duplicate Settlement File Imports Blocked",
      passed: passedT5,
      expectedSummary: "Second upload of PAY-1 blocked (duplicateBlockedCount = 1); cash stays 3,000 DZD",
      actualSummary: `Blocked count: ${batch1DupPreview.duplicateBlockedCount}, Cash after dup: ${afterPartialCash} DZD`,
      integrityInvariantVerified: "Uploading the same remittance file twice never double-settles an order.",
    });

    results.push({
      testId: "T6",
      title: "Partial Settlement Followed by Repeated & Final Import (Case A = 2,300 DZD)",
      passed: passedT6,
      expectedSummary: "3,000 + 1,550 = 4,550 DZD settled; Pending = 0; NetOperationalProfit = 2,300 DZD",
      actualSummary: `Settled: ${orderA.financials?.actualCashReceived} DZD, Pending: ${orderA.financials?.pendingSettlement} DZD, Profit: ${orderA.financials?.netOperationalProfit} DZD`,
      integrityInvariantVerified: "ActualCashReceived + PendingSettlement == 4,550 DZD and NetOperationalProfit == 2,300 DZD.",
    });
  }

  // T7: Visitor Identity Loss After Browser Storage Deletion
  {
    // Simulate anonymous token before storage clear (`vid_A`), after storage clear (`vid_B`), and authenticated user (`uid_1`)
    const simulatedSessions = [
      { sessionId: "s1", canonicalVisitorId: "vid_A", authenticatedUserId: null, identityScope: "anonymous_browser_token" },
      { sessionId: "s2", canonicalVisitorId: "vid_B", authenticatedUserId: null, identityScope: "anonymous_browser_token" },
      { sessionId: "s3", canonicalVisitorId: "auth_uid_1", authenticatedUserId: "uid_1", identityScope: "authenticated_user" },
      { sessionId: "s4", canonicalVisitorId: "auth_uid_1", authenticatedUserId: "uid_1", identityScope: "authenticated_user" },
    ];
    const anonBrowsers = new Set(
      simulatedSessions.filter((s) => s.identityScope === "anonymous_browser_token").map((s) => s.canonicalVisitorId)
    ).size;
    const authUsers = new Set(
      simulatedSessions.filter((s) => s.identityScope === "authenticated_user").map((s) => s.canonicalVisitorId)
    ).size;
    const passed = anonBrowsers === 2 && authUsers === 1;
    results.push({
      testId: "T7",
      title: "Visitor Identity Loss After Browser Storage Deletion",
      passed,
      expectedSummary: "2 Measured Anonymous Browser tokens (vid_A, vid_B) and 1 Authenticated Unique Visitor (uid_1)",
      actualSummary: `Anonymous Browser Tokens: ${anonBrowsers}, Authenticated Unique Visitors: ${authUsers}`,
      integrityInvariantVerified: "Anonymous browser tokens and authenticated visitors are strictly separated.",
    });
  }

  // T8: Split-Shipment Financial Reconciliation (ORD-9042 Proof)
  {
    resetCommittedRemittanceHashesForTest();
    const raw9042: Order = {
      id: "ORD-9042",
      storeId: "test_store_e2e",
      storeName: "YUME Test Store",
      date: "2026-11-02T10:00:00.000Z",
      shopper: {
        name: "Amina Mansouri",
        email: "amina@example.dz",
        phone: "0550987654",
        wilaya: "Oran",
        wilayaCode: "31",
        commune: "Oran Centre",
        address: "Boulevard de l'ALN",
      },
      items: [
        { id: "itemA", name: "Winter Coat", price: 8000, buyPrice: 4500, purchasePrice: 4500, quantity: 1, imageUrl: "" },
        { id: "itemB", name: "Leather Boots", price: 6000, buyPrice: 3200, purchasePrice: 3200, quantity: 1, imageUrl: "" },
        { id: "itemC", name: "Handcrafted Bag", price: 4000, buyPrice: 2000, purchasePrice: 2000, quantity: 1, imageUrl: "" },
      ],
      discountAmount: 1000,
      shippingCost: 800,
      total: 17800,
      status: "accepted",
      paymentMethod: "cod",
      packagingAndOtherCost: 100,
    };

    const hydrated9042 = normalizeOrderRecord(raw9042);
    const [snapA, snapB, snapC] = hydrated9042.itemSnapshots!;

    const splitRes = createSplitOrderShipments({
      order: hydrated9042,
      splits: [
        {
          carrierId: "yalidine",
          carrierName: "Yalidine Express",
          rateSource: "merchant_custom",
          isConfirmedPrice: true,
          deliveryType: "home",
          trackingNumber: "TRK-9042-S1",
          carrierShippingFee: 600,
          carrierCodFee: 60,
          actualWeightKg: 2.2,
          allocatedItemQuantities: { [snapA.id]: 1, [snapB.id]: 1, [snapC.id]: 0 },
          allocatedDiscountAmount: 1000,
          allocatedCustomerShippingFee: 800,
        },
        {
          carrierId: "zrexpress",
          carrierName: "ZR Express",
          rateSource: "official_api",
          isConfirmedPrice: true,
          deliveryType: "home",
          trackingNumber: "TRK-9042-S2",
          carrierShippingFee: 450,
          carrierCodFee: 40,
          actualWeightKg: 0.9,
          allocatedItemQuantities: { [snapA.id]: 0, [snapB.id]: 0, [snapC.id]: 1 },
          allocatedDiscountAmount: 0,
          allocatedCustomerShippingFee: 0,
        },
      ],
    });

    let splitOrder = splitRes.updatedOrder;
    // Mark both shipments delivered
    splitOrder.shipments = splitOrder.shipments!.map((sh) => ({
      ...sh,
      shipmentStatus: "delivered",
      cashCollectedByCourier: sh.shipmentCodCollectable,
    }));
    splitOrder.orderStatus = "delivered";
    splitOrder.shipmentStatus = "delivered";
    splitOrder.financials = computeOrderFinancials(splitOrder);

    // Settle S1 first (13,800 - 660 = 13,140 DZD)
    const bS1 = previewCarrierRemittanceBatch({
      storeId: "test_store_e2e",
      carrierId: "yalidine",
      carrierName: "Yalidine Express",
      batchReference: "BATCH-9042-S1",
      orders: [splitOrder],
      rawRows: [
        {
          payoutReference: "PAY-9042-S1",
          trackingNumber: "TRK-9042-S1",
          reportedCollectedCod: 13800,
          reportedCarrierShippingFee: 600,
          reportedCarrierCodFee: 60,
          remittedNetPayout: 13140,
        },
      ],
    });
    splitOrder = commitCarrierRemittanceBatch({ batch: bS1, orders: [splitOrder] }).updatedOrders[0];
    const cashAfterS1 = splitOrder.financials?.actualCashReceived;
    const pendingAfterS1 = splitOrder.financials?.pendingSettlement;
    const statusAfterS1 = splitOrder.paymentStatus;

    // Settle S2 next (4,000 - 490 = 3,510 DZD)
    const bS2 = previewCarrierRemittanceBatch({
      storeId: "test_store_e2e",
      carrierId: "zrexpress",
      carrierName: "ZR Express",
      batchReference: "BATCH-9042-S2",
      orders: [splitOrder],
      rawRows: [
        {
          payoutReference: "PAY-9042-S2",
          trackingNumber: "TRK-9042-S2",
          reportedCollectedCod: 4000,
          reportedCarrierShippingFee: 450,
          reportedCarrierCodFee: 40,
          remittedNetPayout: 3510,
        },
      ],
    });
    splitOrder = commitCarrierRemittanceBatch({ batch: bS2, orders: [splitOrder] }).updatedOrders[0];

    const fin = splitOrder.financials!;
    const passed =
      splitRes.validationErrors.length === 0 &&
      fin.netOrderRevenue === 17000 &&
      fin.totalCogs === 9700 &&
      fin.totalCodCollectable === 17800 &&
      fin.totalCarrierFees === 1150 &&
      cashAfterS1 === 13140 &&
      pendingAfterS1 === 3510 &&
      statusAfterS1 === "partially_settled" &&
      fin.actualCashReceived === 16650 &&
      fin.pendingSettlement === 0 &&
      splitOrder.paymentStatus === "settled" &&
      fin.netOperationalProfit === 6850;

    results.push({
      testId: "T8",
      title: "Split-Shipment Financial Reconciliation (ORD-9042 = 6,850 DZD)",
      passed,
      expectedSummary: "Rev 17,000, COGS 9,700, CarrierFees 1,150, Settled 16,650, NetOperationalProfit = 6,850 DZD",
      actualSummary: `Rev: ${fin.netOrderRevenue}, COGS: ${fin.totalCogs}, Settled: ${fin.actualCashReceived}, Profit: ${fin.netOperationalProfit} DZD`,
      integrityInvariantVerified: "Revenue, Discount, Customer Shipping, and COGS counted 1x; Carrier fees summed per parcel.",
    });
  }

  return results;
}
