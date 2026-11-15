import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  X,
  Sliders,
  Trash2,
  Shield,
  ShieldCheck,
  Check,
  Edit2,
  MapPin,
  Lock,
  Calendar,
  Archive,
  RefreshCw,
} from "lucide-react";
import type {
  AutomaticStoreRanking,
  DateRangePreset,
  MerchantStore,
  Order,
  PlatformAdminAccount,
  StorePerformanceMetrics,
} from "../types";
import { SUBSCRIPTION_PLAN_IDS, resolveStoreSubscriptionPlan } from "../utils/platformPermissionsConfig";
import {
  PLATFORM_ADMIN_ROLES,
  canAdminPerform,
  recordPlatformAuditLog,
  buildAdminAuthHeaders,
  getStoreEnforcement,
} from "../utils/centralGovernanceArchitecture";
import {
  getWorldwideCountries,
  getStatesByCountryCode,
  getCitiesByState,
  resolveCountryCodeFromInput,
  resolveStateCodeFromInput,
} from "../lib/countryStateCity";
import {
  YUME_PLATFORM_TIMEZONE,
  resolveAlgiersDateBounds,
  buildStorePerformanceMetrics,
} from "../utils/storePerformanceEngine";
import { YUME_ADMIN_TOKENS } from "./YumeAdminDesignSystem";
import { SubscriptionPlansAndPricingControl } from "./SubscriptionPlansAndPricingControl";

export interface StoresManagementWorkspaceProps {
  stores: MerchantStore[];
  setStores: React.Dispatch<React.SetStateAction<MerchantStore[]>>;
  orders: Order[];
  activeAdmin: PlatformAdminAccount;
  adminUsername: string;
  darkMode: boolean;
  currentSlideColor: string;
  storesSubNav: "registry" | "verification" | "plans" | "directions";
  setStoresSubNav: (tab: "registry" | "verification" | "plans" | "directions") => void;
  storeQuery: string;
  setStoreQuery: (q: string) => void;
  openStoreGovernanceModal: (store: MerchantStore) => void;
  showAdminToast: (text: string, type?: "success" | "error") => void;
  setConfirmModalState: React.Dispatch<
    React.SetStateAction<{
      title: string;
      subtitle?: string;
      description: React.ReactNode;
      confirmLabel?: string;
      variant?: "danger" | "warning" | "slate";
      onConfirm: () => void;
    } | null>
  >;
}

interface ServerPerfMapValue {
  uniqueVisitors: number;
  totalSessions: number;
  productClicks: number;
}

interface EditStoreFormState {
  id: string;
  name: string;
  subdomain: string;
  storeLabel: string;
  description: string;
  countryCode: string;
  country: string;
  stateCode: string;
  wilaya: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  merchantFirstName: string;
  merchantLastName: string;
  ordersMode: "both" | "classic" | "advanced";
}

function getStoreInitials(name: string): string {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return String(name || "ST").slice(0, 2).toUpperCase();
}

function resolveMerchantPersonalNames(store: MerchantStore): {
  firstName: string;
  lastName: string;
  fullName: string;
} {
  const f = (store.merchantFirstName || "").trim();
  const l = (store.merchantLastName || "").trim();
  if (f || l) {
    return {
      firstName: f,
      lastName: l,
      fullName: `${f} ${l}`.trim() || store.merchantFullName || "",
    };
  }
  const rawFull = (store.merchantFullName || "").trim();
  if (!rawFull) return { firstName: "", lastName: "", fullName: "" };
  const parts = rawFull.split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
    fullName: rawFull,
  };
}

function resolveStoreCity(store: MerchantStore): string {
  if (store.city && store.city.trim()) return store.city.trim();
  if (store.address && store.address.includes(",")) {
    const seg = store.address.split(",").pop()?.trim();
    if (seg) return seg;
  }
  return store.wilaya || "";
}

export const StoresManagementWorkspace: React.FC<StoresManagementWorkspaceProps> = ({
  stores,
  setStores,
  orders,
  activeAdmin,
  adminUsername,
  darkMode,
  currentSlideColor,
  storesSubNav,
  setStoresSubNav,
  storeQuery,
  setStoreQuery,
  openStoreGovernanceModal,
  showAdminToast,
  setConfirmModalState,
}) => {
  // Date period filter (canonical Africa/Algiers)
  const [datePreset, setDatePreset] = useState<DateRangePreset>("last_30_days");
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date(Date.now() - 29 * 86_400_000);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  // Filters Popover & Unnumbered Filter States (No Importance, No Catalog Count, No Visitor Count)
  const [showFiltersPopover, setShowFiltersPopover] = useState(false);
  const [filterCountryCode, setFilterCountryCode] = useState<string>("all");
  const [filterStateCode, setFilterStateCode] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterVerification, setFilterVerification] = useState<
    "all" | "verified" | "pending" | "unverified"
  >("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterRanking, setFilterRanking] = useState<"all" | AutomaticStoreRanking>("all");
  const [filterLifecycle, setFilterLifecycle] = useState<"all" | "active" | "archived">("all");

  // Server Telemetry Metrics fetched from /api/admin/stores/performance
  const [serverPerfByStore, setServerPerfByStore] = useState<Record<string, ServerPerfMapValue>>({});
  const [platformMatureDays, setPlatformMatureDays] = useState<number>(0);
  const [perfLoading, setPerfLoading] = useState<boolean>(false);

  // Store Avatar Fallback Tracking (never mutates stored URL)
  const [brokenLogos, setBrokenLogos] = useState<Record<string, boolean>>({});

  // Expanded Store Workspace State (View / Edit Info / KYC Identity)
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<"overview" | "edit" | "kyc">("overview");
  const [savingStoreAction, setSavingStoreAction] = useState<boolean>(false);
  const [fetchedKycByStore, setFetchedKycByStore] = useState<
    Record<string, { allowed: boolean; data?: any; reason?: string }>
  >({});

  const [editStoreForm, setEditStoreForm] = useState<EditStoreFormState>({
    id: "",
    name: "",
    subdomain: "",
    storeLabel: "",
    description: "",
    countryCode: "DZ",
    country: "Algeria",
    stateCode: "16",
    wilaya: "Alger",
    city: "",
    address: "",
    email: "",
    phone: "",
    secondaryPhone: "",
    merchantFirstName: "",
    merchantLastName: "",
    ordersMode: "both",
  });

  const dateBounds = useMemo(
    () => resolveAlgiersDateBounds(datePreset, customStartDate, customEndDate),
    [datePreset, customStartDate, customEndDate]
  );

  // Fetch authoritative server analytics events over selected UTC bounds
  const fetchStorePerformance = useCallback(async () => {
    if (!dateBounds.valid) return;
    setPerfLoading(true);
    try {
      const qs = new URLSearchParams({
        start: dateBounds.startIso,
        end: dateBounds.endIso,
      });
      const res = await fetch(`/api/admin/stores/performance?${qs.toString()}`, {
        headers: buildAdminAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.ok && json.byStore) {
          setServerPerfByStore(json.byStore);
          setPlatformMatureDays(Number(json.platformTrackingMatureDays || 0));
        }
      }
    } catch {
      // Keeps empty telemetry map (0 visitors / 0 clicks) without inventing numbers
    } finally {
      setPerfLoading(false);
    }
  }, [dateBounds.startIso, dateBounds.endIso, dateBounds.valid]);

  useEffect(() => {
    fetchStorePerformance();
  }, [fetchStorePerformance]);

  // All Worldwide Countries (Algeria first for operator ergonomics, plus all countries alphabetically)
  const countryOptions = useMemo(() => {
    const all = getWorldwideCountries();
    const algeria = all.find((c) => c.code === "DZ");
    const rest = all
      .filter((c) => c.code !== "DZ")
      .sort((a, b) => a.name.localeCompare(b.name));
    return algeria ? [algeria, ...rest] : rest;
  }, []);

  // Dependent Filter States based strictly on Selected Country
  const filterStateOptions = useMemo(() => {
    if (filterCountryCode === "all") return [];
    return getStatesByCountryCode(filterCountryCode);
  }, [filterCountryCode]);

  // Dependent Filter Cities based strictly on Selected Country + Selected Province/State (+ legacy saved city strings)
  const filterCityOptions = useMemo(() => {
    if (filterCountryCode === "all" || filterStateCode === "all") return [];
    const baseCities = getCitiesByState(filterCountryCode, filterStateCode).map((c) => c.name);
    const set = new Set<string>(baseCities);
    stores.forEach((s) => {
      const sCountryCode = resolveCountryCodeFromInput(s.countryCode || s.country || "Algeria");
      const sStateCode = resolveStateCodeFromInput(sCountryCode, s.wilayaCode || s.wilaya);
      if (sCountryCode === filterCountryCode && sStateCode === filterStateCode) {
        const cityName = resolveStoreCity(s);
        if (cityName) set.add(cityName);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [filterCountryCode, filterStateCode, stores]);

  // Dependent Edit Form States & Cities
  const editStateOptions = useMemo(
    () => getStatesByCountryCode(editStoreForm.countryCode || "DZ"),
    [editStoreForm.countryCode]
  );

  const editCityOptions = useMemo(() => {
    const list = getCitiesByState(
      editStoreForm.countryCode || "DZ",
      editStoreForm.stateCode || editStoreForm.wilaya || "16"
    ).map((c) => c.name);
    const set = new Set<string>(list);
    if (editStoreForm.city && editStoreForm.city.trim()) {
      set.add(editStoreForm.city.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [editStoreForm.countryCode, editStoreForm.stateCode, editStoreForm.wilaya, editStoreForm.city]);

  // Performance + Ranking Computation Map (Real orders + Real server telemetry + Stage 1/2 Ranking)
  const storePerformanceMap = useMemo(() => {
    const map = new Map<string, StorePerformanceMetrics>();
    stores.forEach((store) => {
      const serverPerf = serverPerfByStore[store.id];
      const metrics = buildStorePerformanceMetrics({
        store,
        orders,
        bounds: dateBounds,
        serverPerf: serverPerf
          ? {
              uniqueVisitors: serverPerf.uniqueVisitors,
              totalSessions: serverPerf.totalSessions,
              productClicks: serverPerf.productClicks,
            }
          : undefined,
        platformTrackingMatureDays: platformMatureDays,
      });
      map.set(store.id, metrics);
    });
    return map;
  }, [stores, orders, dateBounds, serverPerfByStore, platformMatureDays]);

  // KYC Management Summary Strip Metrics (Strictly derived from kycEnabled toggle)
  const kycSummary = useMemo(() => {
    let kycEnabledCount = 0;
    let kycDisabledCount = 0;
    let verifiedDocsCount = 0;
    let pendingReviewDocsCount = 0;
    let notSubmittedDocsCount = 0;

    stores.forEach((s) => {
      if (s.kycEnabled === true) kycEnabledCount += 1;
      else kycDisabledCount += 1;

      const kycStatus = s.kycIdentity?.status;
      if (kycStatus === "verified") verifiedDocsCount += 1;
      else if (kycStatus === "pending_review") pendingReviewDocsCount += 1;
      else notSubmittedDocsCount += 1;
    });

    return {
      totalStores: stores.length,
      kycEnabledCount,
      kycDisabledCount,
      verifiedDocsCount,
      pendingReviewDocsCount,
      notSubmittedDocsCount,
    };
  }, [stores]);

  const activeFiltersCount = useMemo(() => {
    let c = 0;
    if (filterCountryCode !== "all") c += 1;
    if (filterStateCode !== "all") c += 1;
    if (filterCity !== "all") c += 1;
    if (filterVerification !== "all") c += 1;
    if (filterPlan !== "all") c += 1;
    if (filterRanking !== "all") c += 1;
    if (filterLifecycle !== "all") c += 1;
    return c;
  }, [
    filterCountryCode,
    filterStateCode,
    filterCity,
    filterVerification,
    filterPlan,
    filterRanking,
    filterLifecycle,
  ]);

  const hasAnyActiveFilterOrSearch =
    Boolean(storeQuery.trim()) || activeFiltersCount > 0 || datePreset !== "last_30_days";

  const resetAllFilters = () => {
    setStoreQuery("");
    setFilterCountryCode("all");
    setFilterStateCode("all");
    setFilterCity("all");
    setFilterVerification("all");
    setFilterPlan("all");
    setFilterRanking("all");
    setFilterLifecycle("all");
    setDatePreset("last_30_days");
  };

  const filteredStores = useMemo(() => {
    const q = storeQuery.trim().toLowerCase();
    return stores.filter((s) => {
      const perf = storePerformanceMap.get(s.id);
      const ranking = perf?.ranking ?? "Unranked";
      const sCountryCode = resolveCountryCodeFromInput(s.countryCode || s.country || "Algeria");
      const sStateCode = resolveStateCodeFromInput(sCountryCode, s.wilayaCode || s.wilaya);
      const sCity = resolveStoreCity(s);
      const names = resolveMerchantPersonalNames(s);

      if (q) {
        const hit =
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.subdomain.toLowerCase().includes(q) ||
          (s.slug && s.slug.toLowerCase().includes(q)) ||
          names.fullName.toLowerCase().includes(q);
        if (!hit) return false;
      }

      if (filterCountryCode !== "all" && sCountryCode !== filterCountryCode) {
        return false;
      }

      if (filterStateCode !== "all" && sStateCode !== filterStateCode) {
        const rawWilaya = (s.wilaya || "").toLowerCase();
        const selectedState = filterStateOptions.find((st) => st.code === filterStateCode);
        if (!selectedState || rawWilaya !== selectedState.name.toLowerCase()) {
          return false;
        }
      }

      if (filterCity !== "all" && sCity.toLowerCase() !== filterCity.toLowerCase()) {
        return false;
      }

      if (filterVerification !== "all") {
        const isVerified = Boolean(s.verified) || s.verificationStatus === "verified";
        const isPending = !isVerified && s.verificationStatus === "pending";
        if (filterVerification === "verified" && !isVerified) return false;
        if (filterVerification === "pending" && !isPending) return false;
        if (filterVerification === "unverified" && (isVerified || isPending)) return false;
      }

      if (filterPlan !== "all") {
        if (resolveStoreSubscriptionPlan(s) !== filterPlan) return false;
      }

      if (filterRanking !== "all" && ranking !== filterRanking) {
        return false;
      }

      if (filterLifecycle === "active" && s.archived === true) return false;
      if (filterLifecycle === "archived" && s.archived !== true) return false;

      return true;
    });
  }, [
    stores,
    storePerformanceMap,
    storeQuery,
    filterCountryCode,
    filterStateCode,
    filterStateOptions,
    filterCity,
    filterVerification,
    filterPlan,
    filterRanking,
    filterLifecycle,
  ]);

  // Populate Edit Info form when switching into Edit tab for a store
  const initEditFormForStore = (store: MerchantStore) => {
    const names = resolveMerchantPersonalNames(store);
    const countryCode = resolveCountryCodeFromInput(store.countryCode || store.country || "Algeria");
    const countryObj =
      countryOptions.find((c) => c.code === countryCode) || {
        code: "DZ",
        name: store.country || "Algeria",
      };
    const states = getStatesByCountryCode(countryCode);
    const stateCode = resolveStateCodeFromInput(countryCode, store.wilayaCode || store.wilaya);
    const matchedState = states.find((st) => st.code === stateCode);

    setEditStoreForm({
      id: store.id,
      name: store.name,
      subdomain: store.subdomain.replace(/\.platform\.dz$/i, ""),
      storeLabel:
        store.storeLabel || (store.verified ? "Verified Partner" : "Standard Boutique"),
      description: store.description || "",
      countryCode,
      country: countryObj.name,
      stateCode: matchedState ? matchedState.code : stateCode,
      wilaya: matchedState ? matchedState.name : store.wilaya || "",
      city: resolveStoreCity(store),
      address: store.address || "",
      email: store.contact.email || "",
      phone: store.contact.phone || "",
      secondaryPhone:
        store.contact.secondaryPhone ||
        (store.contact.phones && store.contact.phones.length > 1
          ? store.contact.phones[1]
          : ""),
      merchantFirstName: names.firstName,
      merchantLastName: names.lastName,
      ordersMode: store.ordersMode || "both",
    });
  };

  // Fetch RBAC-protected KYC details when opening KYC tab
  const loadStoreKycDetails = useCallback(async (storeId: string) => {
    const perm = canAdminPerform("kyc_pii", "view", activeAdmin);
    if (!perm.allowed) {
      setFetchedKycByStore((prev) => ({
        ...prev,
        [storeId]: {
          allowed: false,
          reason:
            perm.reason ||
            "Restricted: KYC identity documents require Super Admin or Trust & Safety role.",
        },
      }));
      return;
    }
    try {
      const res = await fetch(`/api/admin/stores/${encodeURIComponent(storeId)}/kyc`, {
        headers: buildAdminAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        setFetchedKycByStore((prev) => ({
          ...prev,
          [storeId]: { allowed: true, data: json },
        }));
      } else if (res.status === 403 || res.status === 401) {
        const err = await res.json().catch(() => ({}));
        setFetchedKycByStore((prev) => ({
          ...prev,
          [storeId]: {
            allowed: false,
            reason: err.error || "Access denied by server RBAC policy.",
          },
        }));
      }
    } catch {
      // Fallback safely on allowed client role to in-memory store object
      setFetchedKycByStore((prev) => ({
        ...prev,
        [storeId]: { allowed: true },
      }));
    }
  }, [activeAdmin]);

  const openExpandedStore = (store: MerchantStore, tab: "overview" | "edit" | "kyc") => {
    if (expandedStoreId === store.id && expandedTab === tab) {
      setExpandedStoreId(null);
      return;
    }
    setExpandedStoreId(store.id);
    setExpandedTab(tab);
    if (tab === "edit") {
      initEditFormForStore(store);
    } else if (tab === "kyc") {
      loadStoreKycDetails(store.id);
    }
  };

  // Mutation: Save Edit Info
  const handleSaveStoreInfo = async (store: MerchantStore) => {
    const perm = canAdminPerform("stores", "edit", activeAdmin);
    if (!perm.allowed) {
      showAdminToast(perm.reason || "Permission denied.", "error");
      return;
    }
    if (!editStoreForm.name.trim() || !editStoreForm.subdomain.trim()) {
      showAdminToast("Store Name and Subdomain are required.", "error");
      return;
    }

    const cleanSub = editStoreForm.subdomain
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/\.platform\.dz$/i, "");
    const nextSubdomain = `${cleanSub}.platform.dz`;
    const combinedMerchantName =
      `${editStoreForm.merchantFirstName.trim()} ${editStoreForm.merchantLastName.trim()}`.trim();
    const phonesArray = [editStoreForm.phone.trim(), editStoreForm.secondaryPhone.trim()].filter(
      Boolean
    );

    const patch = {
      name: editStoreForm.name.trim(),
      subdomain: nextSubdomain,
      storeLabel: editStoreForm.storeLabel.trim() || undefined,
      description: editStoreForm.description.trim(),
      countryCode: editStoreForm.countryCode,
      country: editStoreForm.country,
      wilayaCode: editStoreForm.stateCode,
      wilaya: editStoreForm.wilaya.trim() || "Algiers",
      city: editStoreForm.city.trim() || editStoreForm.wilaya.trim(),
      address: editStoreForm.address.trim(),
      ordersMode: editStoreForm.ordersMode,
      merchantFirstName: editStoreForm.merchantFirstName.trim() || undefined,
      merchantLastName: editStoreForm.merchantLastName.trim() || undefined,
      merchantFullName: combinedMerchantName || store.merchantFullName,
      contact: {
        ...store.contact,
        email: editStoreForm.email.trim(),
        phone: editStoreForm.phone.trim(),
        secondaryPhone: editStoreForm.secondaryPhone.trim() || undefined,
        phones: phonesArray.length > 0 ? phonesArray : store.contact.phones,
      },
    };

    setSavingStoreAction(true);
    try {
      const res = await fetch(`/api/admin/stores/${encodeURIComponent(store.id)}/info`, {
        method: "PATCH",
        headers: buildAdminAuthHeaders(),
        body: JSON.stringify({ patch, storeSnapshot: store }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showAdminToast(err.error || `Failed to save store info (${res.status}).`, "error");
        return;
      }

      setStores((prev) =>
        prev.map((s) => (s.id === store.id ? { ...s, ...patch } : s))
      );
      recordPlatformAuditLog({
        module: "stores",
        actionType: "edit",
        targetType: "store",
        targetId: store.id,
        targetName: patch.name,
        summary: `Updated store & merchant information for "${patch.name}".`,
      });
      setExpandedTab("overview");
      showAdminToast("Store and merchant information saved.");
    } finally {
      setSavingStoreAction(false);
    }
  };

  // Mutation: Approve Shop (strictly decoupled from Verified Badge)
  const handleToggleApproveShop = async (store: MerchantStore) => {
    const perm = canAdminPerform("stores", "approve", activeAdmin);
    if (!perm.allowed) {
      showAdminToast(perm.reason || "Permission denied.", "error");
      return;
    }
    const nextApproved = !Boolean(store.shopApproved);
    setSavingStoreAction(true);
    try {
      const res = await fetch(`/api/admin/stores/${encodeURIComponent(store.id)}/approve`, {
        method: "POST",
        headers: buildAdminAuthHeaders(),
        body: JSON.stringify({ approved: nextApproved, storeSnapshot: store }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showAdminToast(err.error || "Failed to update shop approval.", "error");
        return;
      }
      const nowIso = new Date().toISOString();
      setStores((prev) =>
        prev.map((s) =>
          s.id === store.id
            ? {
                ...s,
                shopApproved: nextApproved,
                shopApprovedAt: nextApproved ? nowIso : undefined,
                shopApprovedBy: nextApproved ? activeAdmin.uid : undefined,
              }
            : s
        )
      );
      recordPlatformAuditLog({
        module: "stores",
        actionType: "approve",
        targetType: "store",
        targetId: store.id,
        targetName: store.name,
        summary: `${nextApproved ? "Approved" : "Revoked onboarding approval for"} "${store.name}" (independent of Verified Badge).`,
      });
      showAdminToast(
        `Shop onboarding ${nextApproved ? "approved" : "revoked"} for "${store.name}".`
      );
    } finally {
      setSavingStoreAction(false);
    }
  };

  // Mutation: Grant / Revoke Verified Badge (CONFIRMATION REQUIRED)
  const requestBadgeChange = (store: MerchantStore) => {
    const perm = canAdminPerform("stores", "approve", activeAdmin);
    if (!perm.allowed) {
      showAdminToast(perm.reason || "Permission denied.", "error");
      return;
    }
    if (activeAdmin.roleId !== "super_admin" && activeAdmin.roleId !== "trust_and_safety") {
      showAdminToast(
        "Only Super Admin or Trust & Safety may grant or revoke verification badges.",
        "error"
      );
      return;
    }

    const nextVerified = !Boolean(store.verified);
    setConfirmModalState({
      title: nextVerified ? "Grant Verification Badge" : "Revoke Verification Badge",
      subtitle: store.name,
      description: nextVerified
        ? `Confirm granting the Verified Store badge to "${store.name}"? This confirms platform trust standing independently of KYC activation and onboarding approval.`
        : `Confirm revoking the Verified Store badge from "${store.name}"? Existing orders and catalog listings remain intact.`,
      confirmLabel: nextVerified ? "Grant Badge" : "Revoke Badge",
      variant: nextVerified ? "slate" : "warning",
      onConfirm: async () => {
        setConfirmModalState(null);
        setSavingStoreAction(true);
        try {
          const res = await fetch(`/api/admin/stores/${encodeURIComponent(store.id)}/badge`, {
            method: "POST",
            headers: buildAdminAuthHeaders(),
            body: JSON.stringify({ verified: nextVerified, storeSnapshot: store }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showAdminToast(err.error || "Failed to update verification badge.", "error");
            return;
          }
          setStores((prev) =>
            prev.map((s) => (s.id === store.id ? { ...s, verified: nextVerified } : s))
          );
          recordPlatformAuditLog({
            module: "stores",
            actionType: "approve",
            targetType: "store",
            targetId: store.id,
            targetName: store.name,
            summary: `${nextVerified ? "Granted" : "Revoked"} Verified Badge for "${store.name}".`,
          });
          showAdminToast(
            `Verified badge ${nextVerified ? "granted to" : "revoked from"} "${store.name}".`
          );
        } finally {
          setSavingStoreAction(false);
        }
      },
    });
  };

  // Mutation: Change Subscription Plan (CONFIRMATION REQUIRED)
  const requestPlanChange = (store: MerchantStore, nextPlanRaw: string) => {
    const perm = canAdminPerform("subscriptions", "edit", activeAdmin);
    if (!perm.allowed) {
      showAdminToast(perm.reason || "Permission denied.", "error");
      return;
    }
    const currentPlan = resolveStoreSubscriptionPlan(store);
    const nextPlan = resolveStoreSubscriptionPlan({ subscriptionTier: nextPlanRaw });
    if (nextPlan === currentPlan) return;

    setConfirmModalState({
      title: "Change Store Subscription Plan",
      subtitle: `${store.name} (${currentPlan} → ${nextPlan})`,
      description: `Are you sure you want to change "${store.name}" from ${currentPlan} to ${nextPlan}? Feature and quota entitlements sync immediately across the merchant workspace.`,
      confirmLabel: `Switch to ${nextPlan}`,
      variant: "slate",
      onConfirm: async () => {
        setConfirmModalState(null);
        setSavingStoreAction(true);
        try {
          const res = await fetch(`/api/admin/stores/${encodeURIComponent(store.id)}/plan`, {
            method: "POST",
            headers: buildAdminAuthHeaders(),
            body: JSON.stringify({ planId: nextPlan, storeSnapshot: store }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showAdminToast(err.error || "Failed to update subscription plan.", "error");
            return;
          }
          setStores((prev) =>
            prev.map((s) =>
              s.id === store.id
                ? {
                    ...s,
                    premiumTier: nextPlan as any,
                    subscriptionTier: nextPlan as any,
                    subscriptionMeta: {
                      ...(s.subscriptionMeta || {
                        billingCycle: "monthly",
                        billingStatus: "active",
                      }),
                      canonicalPlanId: nextPlan,
                      updatedAt: new Date().toISOString(),
                    },
                  }
                : s
            )
          );
          recordPlatformAuditLog({
            module: "subscriptions",
            actionType: "edit",
            targetType: "store",
            targetId: store.id,
            targetName: store.name,
            summary: `Changed subscription plan for "${store.name}" from ${currentPlan} to ${nextPlan}.`,
          });
          showAdminToast(`Subscription plan for "${store.name}" updated to ${nextPlan}.`);
        } finally {
          setSavingStoreAction(false);
        }
      },
    });
  };

  // Mutation: Enable / Disable KYC Activation (CONFIRMATION REQUIRED, preserves docs)
  const requestKycActivationToggle = (store: MerchantStore) => {
    const perm = canAdminPerform("stores", "approve", activeAdmin);
    if (!perm.allowed) {
      showAdminToast(perm.reason || "Permission denied.", "error");
      return;
    }
    if (activeAdmin.roleId !== "super_admin" && activeAdmin.roleId !== "trust_and_safety") {
      showAdminToast(
        "Only Super Admin or Trust & Safety may enable or disable KYC activation.",
        "error"
      );
      return;
    }

    const nextKycEnabled = !Boolean(store.kycEnabled);
    setConfirmModalState({
      title: nextKycEnabled ? "Enable Store KYC" : "Disable Store KYC",
      subtitle: store.name,
      description: nextKycEnabled
        ? `Confirm enabling KYC for "${store.name}"? The KYC button turns green. Enabling KYC does not automatically verify pending identity documents.`
        : `Confirm disabling KYC for "${store.name}"? The KYC button returns to red. All submitted KYC documents and prior verification history are safely preserved.`,
      confirmLabel: nextKycEnabled ? "Enable KYC" : "Disable KYC",
      variant: nextKycEnabled ? "slate" : "warning",
      onConfirm: async () => {
        setConfirmModalState(null);
        setSavingStoreAction(true);
        try {
          const res = await fetch(
            `/api/admin/stores/${encodeURIComponent(store.id)}/kyc-activation`,
            {
              method: "POST",
              headers: buildAdminAuthHeaders(),
              body: JSON.stringify({ kycEnabled: nextKycEnabled, storeSnapshot: store }),
            }
          );
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showAdminToast(err.error || "Failed to update KYC activation.", "error");
            return;
          }
          setStores((prev) =>
            prev.map((s) =>
              s.id === store.id ? { ...s, kycEnabled: nextKycEnabled } : s
            )
          );
          recordPlatformAuditLog({
            module: "stores",
            actionType: "approve",
            targetType: "store",
            targetId: store.id,
            targetName: store.name,
            summary: `${nextKycEnabled ? "Enabled" : "Disabled"} KYC activation for "${store.name}" (documents preserved).`,
          });
          showAdminToast(
            `KYC activation ${nextKycEnabled ? "enabled" : "disabled"} for "${store.name}".`
          );
        } finally {
          setSavingStoreAction(false);
        }
      },
    });
  };

  // Mutation: Archive or Permanently Delete Store (CONFIRMATION REQUIRED)
  const requestArchiveOrDeleteStore = (store: MerchantStore) => {
    const perm = canAdminPerform("stores", "delete", activeAdmin);
    if (!perm.allowed || activeAdmin.roleId !== "super_admin") {
      showAdminToast(
        perm.reason || "Only Super Admin can archive or delete stores.",
        "error"
      );
      return;
    }

    const orderCountForStore = orders.filter((o) => o.storeId === store.id).length;
    setConfirmModalState({
      title: "Delete or Archive Store",
      subtitle: store.name,
      description:
        orderCountForStore > 0
          ? `"${store.name}" has ${orderCountForStore} historical order record(s). Under YUME Safe Store Lifecycle rules, confirming will Soft-Archive this store (hiding it from the public marketplace and blocking new checkouts while preserving all historical records).`
          : `Confirm archiving or permanently deleting "${store.name}"? Stores with zero server-side protected dependencies (orders, shipments, returns, financial ledgers) will be permanently removed; stores with dependencies will be safely Soft-Archived.`,
      confirmLabel: orderCountForStore > 0 ? "Archive Store" : "Confirm Delete / Archive",
      variant: "danger",
      onConfirm: async () => {
        setConfirmModalState(null);
        setSavingStoreAction(true);
        try {
          const idemKey = `del_store_${store.id}_${Date.now()}`;
          const res = await fetch(`/api/admin/stores/${encodeURIComponent(store.id)}`, {
            method: "DELETE",
            headers: {
              ...buildAdminAuthHeaders(),
              "Idempotency-Key": idemKey,
            },
            body: JSON.stringify({
              reason: "Platform Admin lifecycle action",
              storeSnapshot: store,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) {
            showAdminToast(data.error || "Failed to execute store lifecycle action.", "error");
            return;
          }

          if (data.actionTaken === "archived") {
            const archivedStore = data.store || {
              ...store,
              archived: true,
              archivedAt: new Date().toISOString(),
            };
            setStores((prev) =>
              prev.map((s) => (s.id === store.id ? { ...s, ...archivedStore, archived: true } : s))
            );
            recordPlatformAuditLog({
              module: "stores",
              actionType: "delete",
              targetType: "store",
              targetId: store.id,
              targetName: store.name,
              summary: `Soft-archived store "${store.name}" (protected records preserved).`,
            });
            showAdminToast(
              `Store "${store.name}" was safely Soft-Archived because protected records exist.`
            );
          } else {
            if (expandedStoreId === store.id) setExpandedStoreId(null);
            setStores((prev) => prev.filter((s) => s.id !== store.id));
            recordPlatformAuditLog({
              module: "stores",
              actionType: "delete",
              targetType: "store",
              targetId: store.id,
              targetName: store.name,
              summary: `Permanently deleted store "${store.name}" (0 protected dependencies).`,
            });
            showAdminToast(`Store "${store.name}" permanently deleted.`);
          }
        } finally {
          setSavingStoreAction(false);
        }
      },
    });
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      {/* 1. CLEAN PLATFORM ADMIN STORES HEADER & COMPACT TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 px-5 sm:px-6 py-4 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white tracking-tight">
              Stores
            </h1>
            <span className="text-sm font-sans tabular-nums font-bold text-stone-600 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-stone-200/80 dark:border-slate-700">
              {stores.length}
            </span>
            {hasAnyActiveFilterOrSearch && (
              <span className="text-xs font-sans tabular-nums text-stone-500 dark:text-slate-400">
                · Showing {filteredStores.length} of {stores.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400 font-sans">
            <span>@{adminUsername}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Role: {PLATFORM_ADMIN_ROLES[activeAdmin.roleId]?.name || "Super Admin"}
            </span>
          </div>
        </div>

        {/* Sub-view switcher (compact row) */}
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { id: "registry", label: "Merchant Store Registry" },
              { id: "verification", label: "Verification Status" },
              { id: "plans", label: "Plans & Tiers" },
              { id: "directions", label: "Store Directions" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStoresSubNav(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                storesSubNav === tab.id
                  ? "bg-[#1e2631] text-white dark:bg-sky-500 dark:text-slate-950"
                  : "bg-stone-100 text-stone-600 hover:text-stone-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Compact Toolbar Row: Search (~45-50%) + Date Period + Filters Popover Button */}
        {storesSubNav !== "plans" && (
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Compact Search Input */}
              <div className="relative w-full lg:w-[46%] lg:max-w-lg min-w-[220px]">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search Store Name, ID, Merchant, or Subdomain..."
                  value={storeQuery}
                  onChange={(e) => setStoreQuery(e.target.value)}
                  className={`${YUME_ADMIN_TOKENS.inputClass} pl-10 pr-8`}
                />
                {storeQuery && (
                  <button
                    type="button"
                    onClick={() => setStoreQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Date Range Selector (Africa/Algiers UTC+1) */}
              <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-slate-950 border border-stone-200/90 dark:border-slate-800 rounded-xl px-3 py-2">
                <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <select
                  aria-label="Metrics Date Period"
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value as DateRangePreset)}
                  className="bg-transparent text-xs font-semibold text-stone-800 dark:text-slate-200 outline-none cursor-pointer"
                  title={`All calendar boundaries evaluated in ${YUME_PLATFORM_TIMEZONE}`}
                >
                  <option value="today">Today ({YUME_PLATFORM_TIMEZONE})</option>
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Filters Popover Trigger */}
              <button
                type="button"
                onClick={() => setShowFiltersPopover((prev) => !prev)}
                className={`${YUME_ADMIN_TOKENS.secondaryButtonClass} relative`}
                aria-expanded={showFiltersPopover}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-md bg-[#1e2631] dark:bg-sky-500 text-white dark:text-slate-950 text-[10px] font-sans font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={fetchStorePerformance}
                disabled={perfLoading}
                className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                title="Refresh server analytics metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${perfLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {hasAnyActiveFilterOrSearch && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Custom Date Inputs */}
            {datePreset === "custom" && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-200/70 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-stone-600 dark:text-slate-300">Start Date:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-950 text-stone-900 dark:text-white font-sans text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-stone-600 dark:text-slate-300">End Date:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-950 text-stone-900 dark:text-white font-sans text-xs"
                  />
                </div>
                {!dateBounds.valid && dateBounds.error && (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    {dateBounds.error}
                  </span>
                )}
              </div>
            )}

            {/* UNNUMBERED FILTERS POPOVER PANEL */}
            {showFiltersPopover && (
              <div className="p-4 rounded-xl bg-stone-50/80 dark:bg-slate-950/80 border border-stone-200/90 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Country */}
                <div className="flex flex-col">
                  <label className={YUME_ADMIN_TOKENS.labelClass}>Country</label>
                  <select
                    aria-label="Filter Country"
                    value={filterCountryCode}
                    onChange={(e) => {
                      const nextCountry = e.target.value;
                      setFilterCountryCode(nextCountry);
                      // Clear dependent child filters immediately
                      setFilterStateCode("all");
                      setFilterCity("all");
                    }}
                    className={YUME_ADMIN_TOKENS.selectClass}
                  >
                    <option value="all">All Countries</option>
                    {countryOptions.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dependent Province / State */}
                <div className="flex flex-col">
                  <label className={YUME_ADMIN_TOKENS.labelClass}>Province / State</label>
                  <select
                    aria-label="Filter Province / State"
                    disabled={filterCountryCode === "all"}
                    value={filterStateCode}
                    onChange={(e) => {
                      setFilterStateCode(e.target.value);
                      // Clear dependent city immediately
                      setFilterCity("all");
                    }}
                    className={`${YUME_ADMIN_TOKENS.selectClass} disabled:opacity-55 disabled:cursor-not-allowed`}
                  >
                    <option value="all">
                      {filterCountryCode === "all"
                        ? "Select Country first"
                        : "All Provinces / States"}
                    </option>
                    {filterStateOptions.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.formattedName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dependent City */}
                <div className="flex flex-col">
                  <label className={YUME_ADMIN_TOKENS.labelClass}>City</label>
                  <select
                    aria-label="Filter City"
                    disabled={filterCountryCode === "all" || filterStateCode === "all"}
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className={`${YUME_ADMIN_TOKENS.selectClass} disabled:opacity-55 disabled:cursor-not-allowed`}
                  >
                    <option value="all">
                      {filterStateCode === "all" ? "Select Province / State first" : "All Cities"}
                    </option>
                    {filterCityOptions.map((cityName) => (
                      <option key={cityName} value={cityName}>
                        {cityName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verification Status */}
                <div className="flex flex-col">
                  <label className={YUME_ADMIN_TOKENS.labelClass}>Verification Status</label>
                  <select
                    aria-label="Filter Verification Status"
                    value={filterVerification}
                    onChange={(e) => setFilterVerification(e.target.value as any)}
                    className={YUME_ADMIN_TOKENS.selectClass}
                  >
                    <option value="all">All Verification States</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending Review</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>

                {/* Subscription Plan */}
                <div className="flex flex-col">
                  <label className={YUME_ADMIN_TOKENS.labelClass}>Subscription Plan</label>
                  <select
                    aria-label="Filter Subscription Plan"
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    className={YUME_ADMIN_TOKENS.selectClass}
                  >
                    <option value="all">All Subscription Plans</option>
                    {SUBSCRIPTION_PLAN_IDS.map((planId) => (
                      <option key={planId} value={planId}>
                        {planId}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Automatic Ranking */}
                <div className="flex flex-col">
                  <label className={YUME_ADMIN_TOKENS.labelClass}>Automatic Store Ranking</label>
                  <select
                    aria-label="Filter Automatic Store Ranking"
                    value={filterRanking}
                    onChange={(e) => setFilterRanking(e.target.value as any)}
                    className={YUME_ADMIN_TOKENS.selectClass}
                  >
                    <option value="all">All Automatic Rankings</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="Unranked">Unranked</option>
                  </select>
                </div>

                {/* Store Lifecycle (Active vs Archived) */}
                <div className="flex flex-col">
                  <label className={YUME_ADMIN_TOKENS.labelClass}>Store Lifecycle</label>
                  <select
                    aria-label="Filter Store Lifecycle"
                    value={filterLifecycle}
                    onChange={(e) => setFilterLifecycle(e.target.value as any)}
                    className={YUME_ADMIN_TOKENS.selectClass}
                  >
                    <option value="all">All Stores (Active &amp; Archived)</option>
                    <option value="active">Active Only</option>
                    <option value="archived">Archived Only</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PLANS & TIERS SUB-VIEW */}
      {storesSubNav === "plans" && (
        <SubscriptionPlansAndPricingControl currentSlideColor={currentSlideColor} />
      )}

      {/* LIVE KYC MANAGEMENT SUMMARY STRIP (Always Visible on Non-Plans Sub-Views; Replaces Old KYC Policy Card) */}
      {storesSubNav !== "plans" && (
        <div className="bg-white dark:bg-slate-900 px-5 sm:px-6 py-3.5 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-bold text-stone-900 dark:text-white">
              KYC Management Summary
            </span>
            <span className="inline-flex items-center gap-1.5 font-sans tabular-nums font-bold text-[#15803d] dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" aria-hidden="true" />
              KYC Enabled: {kycSummary.kycEnabledCount}
            </span>
            <span className="inline-flex items-center gap-1.5 font-sans tabular-nums font-bold text-[#dc2626] dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" aria-hidden="true" />
              KYC Disabled: {kycSummary.kycDisabledCount}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-sans tabular-nums text-stone-500 dark:text-slate-400">
            <span>Verified Docs: {kycSummary.verifiedDocsCount}</span>
            <span aria-hidden="true">·</span>
            <span>Pending Review: {kycSummary.pendingReviewDocsCount}</span>
            <span aria-hidden="true">·</span>
            <span>Not Submitted: {kycSummary.notSubmittedDocsCount}</span>
          </div>
        </div>
      )}

      {/* CONTEXTUAL STORE DIRECTIONS SUMMARY STRIP */}
      {storesSubNav === "directions" && (
        <div className="bg-white dark:bg-slate-900 px-5 sm:px-6 py-3.5 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-stone-800 dark:text-slate-200">
            <MapPin className="w-4 h-4 text-stone-500 dark:text-slate-400" />
            <span>
              Click &ldquo;View&rdquo; on any store to inspect physical address, province/state, city, and GPS coordinates or update geolocation in Edit Info.
            </span>
          </div>
          <span className="font-sans text-[11px] text-stone-500 dark:text-slate-400 shrink-0">
            Timezone: {YUME_PLATFORM_TIMEZONE}
          </span>
        </div>
      )}

      {/* 2. STRICTLY 3-COLUMN MAIN STORES TABLE */}
      {storesSubNav !== "plans" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {filteredStores.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <p className="text-xs font-bold text-stone-500 dark:text-slate-400">
                No stores match your current search or filter criteria.
              </p>
              {hasAnyActiveFilterOrSearch && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950/60 text-[11px] font-bold text-stone-500 dark:text-slate-400">
                    <th className="py-3.5 px-5">Store Name</th>
                    <th className="py-3.5 px-5 text-right w-40">
                      Catalog
                    </th>
                    <th className="py-3.5 px-5 text-right">
                      Administrative Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/70 dark:divide-slate-800/80 text-xs">
                  {filteredStores.map((store) => {
                    const isExpanded = expandedStoreId === store.id;
                    const perf = storePerformanceMap.get(store.id);
                    const activeCatalogCount = (store.products || []).filter(
                      (p) => p.status !== "draft"
                    ).length;
                    const avatarSrc = store.logoUrl || store.logo;
                    const showFallbackInitials = !avatarSrc || brokenLogos[store.id];
                    const isKycActive = store.kycEnabled === true;
                    const isArchived = store.archived === true;
                    const enf = getStoreEnforcement(store);
                    const fetchedKyc = fetchedKycByStore[store.id];
                    const roleCanReadKycPii = canAdminPerform("kyc_pii", "view", activeAdmin).allowed;
                    const names = resolveMerchantPersonalNames(store);

                    return (
                      <React.Fragment key={store.id}>
                        <tr className="hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Column 1: Circular Profile Image + Store Name (+ Archived indicator if applicable) */}
                          <td className="py-3.5 px-5 align-middle">
                            <div className="flex items-center gap-3 min-w-[200px]">
                              {!showFallbackInitials ? (
                                <img
                                  src={avatarSrc}
                                  alt={`${store.name} profile`}
                                  referrerPolicy="no-referrer"
                                  onError={() =>
                                    setBrokenLogos((prev) => ({ ...prev, [store.id]: true }))
                                  }
                                  className="w-[34px] h-[34px] rounded-full object-cover shrink-0 border border-stone-200 dark:border-slate-700 bg-stone-100 dark:bg-slate-800"
                                />
                              ) : (
                                <span
                                  aria-hidden="true"
                                  className="w-[34px] h-[34px] rounded-full shrink-0 border border-stone-300/80 dark:border-slate-700 bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-200 flex items-center justify-center text-[11px] font-bold font-sans select-none"
                                >
                                  {getStoreInitials(store.name)}
                                </span>
                              )}

                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <span className="font-bold text-stone-900 dark:text-white truncate">
                                  {store.name}
                                </span>
                                {isArchived && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/60">
                                    <Archive className="w-3 h-3" />
                                    Archived
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Column 2: Active Catalog Product Count */}
                          <td className="py-3.5 px-5 text-right font-sans tabular-nums font-bold text-stone-800 dark:text-slate-200 align-middle">
                            {activeCatalogCount}
                          </td>

                          {/* Column 3: Administrative Actions (Strictly View, Red/Green KYC, Delete/Archive + Performance Readout) */}
                          <td className="py-3.5 px-5 text-right align-middle">
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => openExpandedStore(store, "overview")}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                                    isExpanded
                                      ? "bg-[#1e2631] text-white dark:bg-sky-500 dark:text-slate-950"
                                      : "bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200"
                                  }`}
                                  title="Open Store View & Management Workspace"
                                >
                                  {isExpanded ? "Close View" : "View"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openExpandedStore(store, "kyc")}
                                  style={{
                                    backgroundColor: isKycActive ? "#16a34a" : "#dc2626",
                                    color: "#ffffff",
                                  }}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs hover:brightness-110 transition-all cursor-pointer whitespace-nowrap shrink-0"
                                  aria-label={
                                    isKycActive
                                      ? `KYC Enabled for ${store.name} — Click to manage`
                                      : `KYC Disabled for ${store.name} — Click to manage`
                                  }
                                  title={
                                    isKycActive
                                      ? "KYC Status: Enabled (Green) — Click to manage"
                                      : "KYC Status: Disabled (Red) — Click to manage"
                                  }
                                >
                                  KYC
                                </button>

                                <button
                                  type="button"
                                  onClick={() => requestArchiveOrDeleteStore(store)}
                                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 dark:text-rose-400 rounded-xl border border-rose-200/70 dark:border-rose-900/40 transition-all cursor-pointer"
                                  aria-label={`Archive or delete ${store.name}`}
                                  title="Soft-archive stores with historical records, or permanently delete stores with zero dependencies"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Store-Specific Compact Performance Metrics */}
                              <div className="flex flex-wrap items-center justify-end gap-x-2.5 gap-y-1 text-[11px] font-sans tabular-nums text-stone-500 dark:text-slate-400">
                                <span>Orders: {perf?.qualifiedOrders ?? 0}</span>
                                <span aria-hidden="true">·</span>
                                <span>Visitors: {perf?.uniqueVisitors ?? 0}</span>
                                <span aria-hidden="true">·</span>
                                <span>Clicks: {perf?.productClicks ?? 0}</span>
                                <span aria-hidden="true">·</span>
                                <span title="Current Live Catalog Snapshot">
                                  Published: {perf?.publishedProductsCount ?? activeCatalogCount}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>
                                  Sales: {(perf?.salesDzd ?? 0).toLocaleString()} DZD
                                </span>
                                <span aria-hidden="true">·</span>
                                <span
                                  title={
                                    perf?.conversionUnavailableReason ||
                                    `Conversion computation: ${perf?.conversionMethod}`
                                  }
                                  className={
                                    perf?.conversionRatePercent === null
                                      ? "text-stone-400 dark:text-slate-500 font-semibold"
                                      : "text-emerald-700 dark:text-emerald-400 font-bold"
                                  }
                                >
                                  Conv:{" "}
                                  {perf?.conversionRatePercent !== null &&
                                  perf?.conversionRatePercent !== undefined
                                    ? `${perf.conversionRatePercent}%`
                                    : "N/A"}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span
                                  title={`Automatic Ranking (${perf?.rankingStage === "stage_2_full_telemetry" ? "Stage 2 Full Telemetry" : perf?.rankingStage === "archived_exempt" ? "Archived" : "Stage 1 Commerce Baseline"})`}
                                  className="font-bold text-stone-700 dark:text-slate-200"
                                >
                                  {perf?.ranking || "Unranked"}
                                  {perf && perf.ranking !== "Unranked" && !isArchived
                                    ? ` (${perf.rankingScore})`
                                    : ""}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* HEADER-COLOR COORDINATED EXPANDED STORE VIEW & MANAGEMENT WORKSPACE */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={3} className="p-4 sm:p-5 bg-stone-100/60 dark:bg-slate-950/60">
                              <div className="yume-store-panel-shell rounded-2xl border overflow-hidden shadow-sm transition-colors">
                                {/* Header Band Synchronized with --yume-theme-header-color */}
                                <div className="yume-store-panel-header px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    {!showFallbackInitials ? (
                                      <img
                                        src={avatarSrc}
                                        alt=""
                                        referrerPolicy="no-referrer"
                                        className="w-8 h-8 rounded-full object-cover border border-white/30 shrink-0"
                                      />
                                    ) : (
                                      <span className="w-8 h-8 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-xs font-bold shrink-0">
                                        {getStoreInitials(store.name)}
                                      </span>
                                    )}
                                    <div className="min-w-0">
                                      <div className="text-sm font-bold text-white truncate">
                                        {store.name}
                                        {isArchived ? " (Archived)" : ""}
                                      </div>
                                      <div className="text-[11px] font-sans text-white/80 truncate">
                                        {store.id} · {store.subdomain} · Plan:{" "}
                                        {resolveStoreSubscriptionPlan(store)}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap">
                                    {(
                                      [
                                        { id: "overview", label: "Overview & Directions" },
                                        { id: "edit", label: "Edit Info" },
                                        { id: "kyc", label: "KYC Identity" },
                                      ] as const
                                    ).map((wTab) => (
                                      <button
                                        key={wTab.id}
                                        type="button"
                                        onClick={() => openExpandedStore(store, wTab.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                          expandedTab === wTab.id
                                            ? "bg-white text-slate-900 shadow-xs"
                                            : "bg-white/15 text-white hover:bg-white/25"
                                        }`}
                                      >
                                        {wTab.label}
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => setExpandedStoreId(null)}
                                      className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                                      aria-label="Close expanded workspace"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Detailed Governance Action Strip (Relocated cleanly out of table row) */}
                                <div className="px-5 py-3 border-b border-stone-200/70 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <button
                                      type="button"
                                      disabled={savingStoreAction}
                                      onClick={() => handleToggleApproveShop(store)}
                                      className={
                                        store.shopApproved
                                          ? YUME_ADMIN_TOKENS.emeraldButtonClass
                                          : YUME_ADMIN_TOKENS.secondaryButtonClass
                                      }
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>
                                        {store.shopApproved ? "Shop Approved" : "Approve Shop"}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      disabled={savingStoreAction}
                                      onClick={() => requestBadgeChange(store)}
                                      className={
                                        store.verified
                                          ? YUME_ADMIN_TOKENS.secondaryButtonClass
                                          : YUME_ADMIN_TOKENS.primaryButtonClass
                                      }
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>
                                        {store.verified ? "Revoke Badge" : "Grant Badge"}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openExpandedStore(store, "edit")}
                                      className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                      <span>Edit Info</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openStoreGovernanceModal(store)}
                                      className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                                    >
                                      <Shield className="w-3.5 h-3.5" />
                                      <span>Govern / Enforce ({enf.state})</span>
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <label className="text-[11px] font-semibold text-stone-700 dark:text-slate-300">
                                      Plan:
                                    </label>
                                    <select
                                      aria-label={`Subscription Plan for ${store.name}`}
                                      value={resolveStoreSubscriptionPlan(store)}
                                      disabled={savingStoreAction}
                                      onChange={(e) => requestPlanChange(store, e.target.value)}
                                      className="px-2.5 py-1.5 text-xs font-semibold outline-none bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-xl text-stone-900 dark:text-slate-100 cursor-pointer"
                                    >
                                      {SUBSCRIPTION_PLAN_IDS.map((planId) => (
                                        <option key={planId} value={planId}>
                                          {planId}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* BODY CONTENT BASED ON ACTIVE WORKSPACE TAB */}
                                <div className="p-5">
                                  {/* TAB 1: OVERVIEW & DIRECTIONS */}
                                  {expandedTab === "overview" && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                                      <div className="yume-store-panel-card p-3.5 rounded-xl border">
                                        <span className="text-[11px] text-stone-500 dark:text-slate-400 block">
                                          Merchant &amp; Label
                                        </span>
                                        <span className="font-bold text-stone-900 dark:text-white mt-0.5 block">
                                          {names.fullName || "Not specified"}
                                        </span>
                                        <span className="text-[11px] text-stone-600 dark:text-slate-300 block mt-0.5">
                                          {store.storeLabel || "Standard Boutique"} · Onboarding:{" "}
                                          {store.shopApproved ? "Approved" : "Pending"}
                                        </span>
                                      </div>

                                      <div className="yume-store-panel-card p-3.5 rounded-xl border">
                                        <span className="text-[11px] text-stone-500 dark:text-slate-400 block">
                                          Directions &amp; Geolocation
                                        </span>
                                        <span className="font-bold text-stone-900 dark:text-white mt-0.5 block">
                                          {store.country || "Algeria"} · {store.wilaya || "Not specified"} ·{" "}
                                          {resolveStoreCity(store) || "Not specified"}
                                        </span>
                                        <span className="font-sans text-[11px] text-stone-600 dark:text-slate-300 block mt-0.5">
                                          {store.address || "Address not specified"} (
                                          {store.coordinates?.lat?.toFixed(4) ?? "—"},{" "}
                                          {store.coordinates?.lng?.toFixed(4) ?? "—"})
                                        </span>
                                      </div>

                                      <div className="yume-store-panel-card p-3.5 rounded-xl border">
                                        <span className="text-[11px] text-stone-500 dark:text-slate-400 block">
                                          Contact &amp; Order Mode
                                        </span>
                                        <span className="font-sans font-semibold text-stone-900 dark:text-white mt-0.5 block truncate">
                                          {store.contact.email || "Not specified"}
                                        </span>
                                        <span className="font-sans text-[11px] text-stone-600 dark:text-slate-300 block mt-0.5">
                                          {store.contact.phone || "No phone"}
                                          {store.contact.secondaryPhone
                                            ? ` · ${store.contact.secondaryPhone}`
                                            : ""}
                                        </span>
                                        <span className="text-[11px] text-stone-600 dark:text-slate-300 block mt-0.5">
                                          Orders Mode:{" "}
                                          {store.ordersMode === "classic"
                                            ? "Classic Mode"
                                            : store.ordersMode === "advanced"
                                            ? "Advanced Mode"
                                            : "Both Modes Allowed"}
                                        </span>
                                      </div>

                                      <div className="yume-store-panel-card p-3.5 rounded-xl border">
                                        <span className="text-[11px] text-stone-500 dark:text-slate-400 block">
                                          Ranking &amp; Lifecycle
                                        </span>
                                        <span className="font-sans font-bold text-stone-900 dark:text-white mt-0.5 block">
                                          {perf?.ranking || "Unranked"} ({perf?.rankingScore ?? 0}/100)
                                        </span>
                                        <span className="text-[11px] text-stone-600 dark:text-slate-300 block mt-0.5">
                                          Stage:{" "}
                                          {perf?.rankingStage === "stage_2_full_telemetry"
                                            ? "Full Telemetry"
                                            : perf?.rankingStage === "archived_exempt"
                                            ? "Archived"
                                            : "Stage 1 Commerce Baseline"}
                                        </span>
                                        {isArchived && store.archiveReason && (
                                          <span className="text-[11px] text-amber-700 dark:text-amber-300 block mt-1">
                                            {store.archiveReason}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* TAB 2: REORGANIZED 5-SECTION EDIT INFO (NO STORE IMPORTANCE) */}
                                  {expandedTab === "edit" && (
                                    <div className="flex flex-col gap-5">
                                      {/* SECTION A: STORE INFORMATION */}
                                      <div className="yume-store-panel-card p-4 rounded-xl border flex flex-col gap-3">
                                        <div className="text-xs font-bold text-stone-900 dark:text-white">
                                          A. Store Information
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                          <div className="flex flex-col">
                                            <label className={YUME_ADMIN_TOKENS.labelClass}>
                                              Store Name <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                              type="text"
                                              className={YUME_ADMIN_TOKENS.inputClass}
                                              value={editStoreForm.name}
                                              onChange={(e) =>
                                                setEditStoreForm({
                                                  ...editStoreForm,
                                                  name: e.target.value,
                                                })
                                              }
                                            />
                                          </div>

                                          <div className="flex flex-col">
                                            <label className={YUME_ADMIN_TOKENS.labelClass}>
                                              Store ID (Read-Only)
                                            </label>
                                            <input
                                              type="text"
                                              readOnly
                                              disabled
                                              className={`${YUME_ADMIN_TOKENS.monoInputClass} opacity-75 cursor-not-allowed`}
                                              value={editStoreForm.id}
                                            />
                                          </div>

                                          <div className="flex flex-col">
                                            <label className={YUME_ADMIN_TOKENS.labelClass}>
                                              Subdomain <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                              <input
                                                type="text"
                                                className={`${YUME_ADMIN_TOKENS.monoInputClass} pr-24`}
                                                value={editStoreForm.subdomain}
                                                onChange={(e) =>
                                                  setEditStoreForm({
                                                    ...editStoreForm,
                                                    subdomain: e.target.value,
                                                  })
                                                }
                                              />
                                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-sans text-stone-400">
                                                .platform.dz
                                              </span>
                                            </div>
                                          </div>

                                          <div className="flex flex-col">
                                            <label className={YUME_ADMIN_TOKENS.labelClass}>
                                              Store Label
                                            </label>
                                            <input
                                              type="text"
                                              className={YUME_ADMIN_TOKENS.inputClass}
                                              value={editStoreForm.storeLabel}
                                              onChange={(e) =>
                                                setEditStoreForm({
                                                  ...editStoreForm,
                                                  storeLabel: e.target.value,
                                                })
                                              }
                                            />
                                          </div>
                                        </div>

                                        <div className="flex flex-col">
                                          <label className={YUME_ADMIN_TOKENS.labelClass}>
                                            Headline / Store Pitch
                                          </label>
                                          <textarea
                                            rows={2}
                                            className={`${YUME_ADMIN_TOKENS.textareaClass} resize-none`}
                                            value={editStoreForm.description}
                                            onChange={(e) =>
                                              setEditStoreForm({
                                                ...editStoreForm,
                                                description: e.target.value,
                                              })
                                            }
                                          />
                                        </div>
                                      </div>

                                      {/* SECTION B: DEPENDENT LOCATION INFORMATION */}
                                      <div className="yume-store-panel-card p-4 rounded-xl border flex flex-col gap-3">
                                        <div className="text-xs font-bold text-stone-900 dark:text-white">
                                          B. Location Information (Dependent Country → Province/State → City)
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                          <div className="flex flex-col">
                                            <label className={YUME_ADMIN_TOKENS.labelClass}>Country</label>
                                            <select
                                              className={YUME_ADMIN_TOKENS.selectClass}
                                              value={editStoreForm.countryCode}
                                              onChange={(e) => {
                                                const nextCode = e.target.value;
                                                const nextCountryObj = countryOptions.find(
                                                  (c) => c.code === nextCode
                                                );
                                                const nextStates = getStatesByCountryCode(nextCode);
                                                const firstState = nextStates[0];
                                                setEditStoreForm({
                                                  ...editStoreForm,
                                                  countryCode: nextCode,
                                                  country: nextCountryObj?.name || nextCode,
                                                  stateCode: firstState?.code || "",
                                                  wilaya: firstState?.name || "",
                                                  city: "",
                                                });
                                              }}
                                            >
                                              {countryOptions.map((c) => (
                                                <option key={c.code} value={c.code}>
                                                  {c.name}
                                                </option>
                                              ))}
                                            </select>
                                          </div>

                                          <div className="flex flex-col">
                                            <label className={YUME_ADMIN_TOKENS.labelClass}>
                                              Province / State
                                            </label>
                                            <select
                                              className={YUME_ADMIN_TOKENS.selectClass}
                                              value={editStoreForm.stateCode}
                                              onChange={(e) => {
                                                const nextStCode = e.target.value;
                                                const stObj = editStateOptions.find(
                                                  (st) => st.code === nextStCode
                                                );
                                                setEditStoreForm({
                                                  ...editStoreForm,
                                                  stateCode: nextStCode,
                                                  wilaya: stObj?.name || nextStCode,
                                                  city: "",
                                                });
                                              }}
                                            >
                                              {editStateOptions.map((st) => (
                                                <option key={st.code} value={st.code}>
                                                  {st.formattedName}
                                                </option>
                                              ))}
                                            </select>
                                          </div>

                                          <div className="flex flex-col">
                                            <label className={YUME_ADMIN_TOKENS.labelClass}>City</label>
                                            <select
                                              className={YUME_ADMIN_TOKENS.selectClass}
                                              value={editStoreForm.city}
                                              onChange={(e) =>
                                                setEditStoreForm({
                                                  ...editStoreForm,
                                                  city: e.target.value,
                                                })
                                              }
                                            >
                                              <option value="">Select City</option>
                                              {editCityOptions.map((cName) => (
                                                <option key={cName} value={cName}>
                                                  {cName}
                                                </option>
                                              ))}
                                            </select>
                                          </div>

                                          <div className="flex flex-col">
                                            <label className={YUME_ADMIN_TOKENS.labelClass}>
                                              Physical Address
                                            </label>
                                            <input
                                              type="text"
                                              className={YUME_ADMIN_TOKENS.inputClass}
                                              value={editStoreForm.address}
                                              onChange={(e) =>
                                                setEditStoreForm({
                                                  ...editStoreForm,
                                                  address: e.target.value,
                                                })
                                              }
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      {/* SECTION C & D: CONTACT & MERCHANT PERSONAL IDENTITY */}
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="yume-store-panel-card p-4 rounded-xl border flex flex-col gap-3">
                                          <div className="text-xs font-bold text-stone-900 dark:text-white">
                                            C. Contact Information
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="flex flex-col">
                                              <label className={YUME_ADMIN_TOKENS.labelClass}>Email</label>
                                              <input
                                                type="email"
                                                className={YUME_ADMIN_TOKENS.inputClass}
                                                value={editStoreForm.email}
                                                onChange={(e) =>
                                                  setEditStoreForm({
                                                    ...editStoreForm,
                                                    email: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                            <div className="flex flex-col">
                                              <label className={YUME_ADMIN_TOKENS.labelClass}>Phone</label>
                                              <input
                                                type="tel"
                                                className={YUME_ADMIN_TOKENS.monoInputClass}
                                                value={editStoreForm.phone}
                                                onChange={(e) =>
                                                  setEditStoreForm({
                                                    ...editStoreForm,
                                                    phone: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                            <div className="flex flex-col">
                                              <label className={YUME_ADMIN_TOKENS.labelClass}>
                                                Additional Phone
                                              </label>
                                              <input
                                                type="tel"
                                                className={YUME_ADMIN_TOKENS.monoInputClass}
                                                value={editStoreForm.secondaryPhone}
                                                onChange={(e) =>
                                                  setEditStoreForm({
                                                    ...editStoreForm,
                                                    secondaryPhone: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                          </div>
                                        </div>

                                        <div className="yume-store-panel-card p-4 rounded-xl border flex flex-col gap-3">
                                          <div className="text-xs font-bold text-stone-900 dark:text-white">
                                            D. Merchant Personal Identity
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="flex flex-col">
                                              <label className={YUME_ADMIN_TOKENS.labelClass}>
                                                First Name
                                              </label>
                                              <input
                                                type="text"
                                                className={YUME_ADMIN_TOKENS.inputClass}
                                                value={editStoreForm.merchantFirstName}
                                                onChange={(e) =>
                                                  setEditStoreForm({
                                                    ...editStoreForm,
                                                    merchantFirstName: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                            <div className="flex flex-col">
                                              <label className={YUME_ADMIN_TOKENS.labelClass}>
                                                Last Name
                                              </label>
                                              <input
                                                type="text"
                                                className={YUME_ADMIN_TOKENS.inputClass}
                                                value={editStoreForm.merchantLastName}
                                                onChange={(e) =>
                                                  setEditStoreForm({
                                                    ...editStoreForm,
                                                    merchantLastName: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* SECTION E: ORDER MANAGEMENT MODE */}
                                      <div className="yume-store-panel-card p-4 rounded-xl border flex flex-col gap-3">
                                        <div className="text-xs font-bold text-stone-900 dark:text-white">
                                          E. Order Management Mode
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                          {(
                                            [
                                              {
                                                value: "classic",
                                                label: "Classic Mode",
                                                desc: "Standard order table and essential workflow",
                                              },
                                              {
                                                value: "advanced",
                                                label: "Advanced Mode",
                                                desc: "Courier dispatch, multi-shipment & return QC pipeline",
                                              },
                                              {
                                                value: "both",
                                                label: "Both Modes Allowed",
                                                desc: "Merchant switches freely between Classic & Advanced",
                                              },
                                            ] as const
                                          ).map((opt) => {
                                            const active = editStoreForm.ordersMode === opt.value;
                                            return (
                                              <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() =>
                                                  setEditStoreForm({
                                                    ...editStoreForm,
                                                    ordersMode: opt.value,
                                                  })
                                                }
                                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                                  active
                                                    ? "border-[#1e2631] dark:border-sky-400 ring-1 ring-[#1e2631]/20 dark:ring-sky-400/30 bg-stone-100/90 dark:bg-slate-800"
                                                    : "border-stone-200/80 dark:border-slate-700 hover:border-stone-400"
                                                }`}
                                              >
                                                <div className="text-xs font-bold text-stone-900 dark:text-white">
                                                  {opt.label}
                                                </div>
                                                <div className="text-[11px] text-stone-600 dark:text-slate-300 mt-0.5">
                                                  {opt.desc}
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-end gap-2.5">
                                        <button
                                          type="button"
                                          onClick={() => setExpandedTab("overview")}
                                          className={YUME_ADMIN_TOKENS.secondaryButtonClass}
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          disabled={savingStoreAction}
                                          onClick={() => handleSaveStoreInfo(store)}
                                          className={YUME_ADMIN_TOKENS.primaryButtonClass}
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Save Store Info</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* TAB 3: KYC IDENTITY MANAGEMENT WORKSPACE */}
                                  {expandedTab === "kyc" && (
                                    <div className="flex flex-col gap-4">
                                      <div className="yume-store-panel-card p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                          <div className="text-xs font-bold text-stone-900 dark:text-white">
                                            Store KYC Activation Control
                                          </div>
                                          <p className="text-[11px] text-stone-600 dark:text-slate-300 mt-0.5">
                                            Current State:{" "}
                                            <strong
                                              className={
                                                isKycActive
                                                  ? "text-[#15803d] dark:text-emerald-400"
                                                  : "text-[#dc2626] dark:text-rose-400"
                                              }
                                            >
                                              {isKycActive ? "Enabled (Green)" : "Disabled (Red)"}
                                            </strong>{" "}
                                            · Toggling preserves all existing submitted documents and verification status.
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          disabled={savingStoreAction}
                                          onClick={() => requestKycActivationToggle(store)}
                                          style={{
                                            backgroundColor: isKycActive ? "#dc2626" : "#16a34a",
                                            color: "#ffffff",
                                          }}
                                          className="px-4 py-2 rounded-xl text-xs font-bold hover:brightness-110 transition-all cursor-pointer shrink-0"
                                        >
                                          {isKycActive ? "Disable KYC" : "Enable KYC"}
                                        </button>
                                      </div>

                                      {/* RBAC-Protected KYC Identity Document Inspection */}
                                      {!roleCanReadKycPii || (fetchedKyc && !fetchedKyc.allowed) ? (
                                        <div className="yume-store-panel-card p-5 rounded-xl border flex items-start gap-3">
                                          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                          <div className="text-xs">
                                            <div className="font-bold text-stone-900 dark:text-white">
                                              KYC Identity Documents Restricted by RBAC
                                            </div>
                                            <p className="text-stone-600 dark:text-slate-300 mt-0.5">
                                              {fetchedKyc?.reason ||
                                                "Your current admin role does not hold stores:kyc_pii_read scope. Only Super Admin and Trust & Safety may inspect merchant legal names and KYC documents."}
                                            </p>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                                          <div className="yume-store-panel-card p-4 rounded-xl border">
                                            <span className="text-[11px] text-stone-500 dark:text-slate-400 block">
                                              Merchant Legal Name
                                            </span>
                                            <span className="font-bold text-stone-900 dark:text-white mt-1 block">
                                              {names.fullName || "Not provided"}
                                            </span>
                                          </div>

                                          <div className="yume-store-panel-card p-4 rounded-xl border">
                                            <span className="text-[11px] text-stone-500 dark:text-slate-400 block">
                                              Identity Document Type &amp; File
                                            </span>
                                            <span className="font-bold text-stone-900 dark:text-white mt-1 block">
                                              {fetchedKyc?.data?.kycIdentity?.documentType ||
                                                store.kycIdentity?.documentType ||
                                                "National ID · Passport · Driving License"}
                                            </span>
                                            <span className="font-sans text-[11px] text-stone-600 dark:text-slate-300 block mt-0.5">
                                              {fetchedKyc?.data?.verificationDocName ||
                                                store.verificationDocName ||
                                                "Not Submitted"}
                                            </span>
                                          </div>

                                          <div className="yume-store-panel-card p-4 rounded-xl border">
                                            <span className="text-[11px] text-stone-500 dark:text-slate-400 block">
                                              Document Verification Status
                                            </span>
                                            <span className="font-sans font-bold text-stone-900 dark:text-white mt-1 block">
                                              {fetchedKyc?.data?.kycIdentity?.status ||
                                                store.kycIdentity?.status ||
                                                "not_submitted"}
                                            </span>
                                            {store.kycIdentity?.submittedAt && (
                                              <span className="text-[11px] text-stone-500 dark:text-slate-400 block mt-0.5">
                                                Submitted:{" "}
                                                {new Date(
                                                  store.kycIdentity.submittedAt
                                                ).toLocaleDateString()}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
