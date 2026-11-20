import React, { useState, useMemo } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Send,
  Store,
  ArrowRight,
  Lock,
} from "lucide-react";
import type {
  MerchantPartnerPicksProfile,
  MerchantStore,
  PartnerPickChannelId,
  PartnerPicksGlobalConfig,
  PartnerPicksPartnership,
} from "../types";
import { PARTNER_PICK_CHANNEL_IDS } from "../utils/partnerPicksSchema";
import {
  evaluateBilateralPartnershipInitiationEligibility,
  evaluatePartnerPicksActorPermission,
  type PartnerPicksActorIdentity,
} from "../utils/partnerPicksEligibility";

export interface PartnerPicksRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initiatorStore: MerchantStore | null;
  targetStore: MerchantStore | null;
  currentUser: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  } | null;
  globalConfig: PartnerPicksGlobalConfig;
  profilesByStoreId: Record<string, Partial<MerchantPartnerPicksProfile>>;
  partnerships: PartnerPicksPartnership[];
  isDarkMode?: boolean;
  lang?: "en" | "ar" | "fr";
  onSendPartnershipRequest: (payload: {
    initiatorStoreId: string;
    targetStoreId: string;
    durationDays: number;
    proposedChannels: Record<PartnerPickChannelId, boolean>;
    requestMessage: string;
  }) => Promise<void>;
  onOpenMerchantWorkspace?: (partnershipId?: string) => void;
}

const CHANNEL_LABELS: Record<PartnerPickChannelId, string> = {
  STORE_BANNER: "Store Banner",
  PRODUCT_GRID: "Store Product Grid",
  DISCOVER_MORE: "Discover More Products",
  REELS_FEED: "Reels",
  STORIES: "Stories",
};

export const PartnerPicksRequestModal: React.FC<
  PartnerPicksRequestModalProps
> = ({
  isOpen,
  onClose,
  initiatorStore,
  targetStore,
  currentUser,
  globalConfig,
  profilesByStoreId,
  partnerships,
  onSendPartnershipRequest,
  onOpenMerchantWorkspace,
}) => {
  const [durationDays, setDurationDays] = useState<number>(30);
  const [proposedChannels, setProposedChannels] = useState<
    Record<PartnerPickChannelId, boolean>
  >({
    STORE_BANNER: true,
    PRODUCT_GRID: true,
    DISCOVER_MORE: true,
    REELS_FEED: true,
    STORIES: true,
  });
  const [requestMessage, setRequestMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  const existingPartnership = useMemo(() => {
    if (!initiatorStore || !targetStore) return null;
    return (
      partnerships.find(
        (p) =>
          p &&
          ((p.storeAId === initiatorStore.id &&
            p.storeBId === targetStore.id) ||
            (p.storeAId === targetStore.id &&
              p.storeBId === initiatorStore.id)) &&
          (p.status === "ACTIVE" ||
            p.status === "ACCEPTED" ||
            p.status === "PENDING_REQUEST")
      ) || null
    );
  }, [initiatorStore, targetStore, partnerships]);

  const permissionCheck = useMemo(() => {
    if (!initiatorStore) {
      return {
        allowed: false,
        reason: "Sign in with a merchant store account to request a partnership.",
      };
    }
    const actor: PartnerPicksActorIdentity = {
      id: (currentUser as any)?.id || currentUser?.email || initiatorStore.ownerId,
      name: currentUser?.name,
      email: currentUser?.email,
      role: currentUser?.role || "merchant",
      storeId: initiatorStore.id,
      storeName: initiatorStore.name,
      ownedStoreIds: [initiatorStore.id],
    };
    return evaluatePartnerPicksActorPermission({
      actor,
      targetStore: initiatorStore,
      targetStoreProfile: profilesByStoreId[initiatorStore.id],
      action: "SEND_PARTNERSHIP_REQUEST",
    });
  }, [initiatorStore, currentUser, profilesByStoreId]);

  const bilateralCheck = useMemo(() => {
    if (!initiatorStore || !targetStore) return null;
    return evaluateBilateralPartnershipInitiationEligibility({
      globalConfig,
      initiatorStore,
      targetStore,
      allPartnerships: partnerships,
    });
  }, [initiatorStore, targetStore, globalConfig, partnerships]);

  if (!isOpen || !targetStore) return null;

  const isSameStore = Boolean(
    initiatorStore && initiatorStore.id === targetStore.id
  );

  const toggleChannel = (ch: PartnerPickChannelId) => {
    setProposedChannels((prev) => ({
      ...prev,
      [ch]: !prev[ch],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initiatorStore || !targetStore) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onSendPartnershipRequest({
        initiatorStoreId: initiatorStore.id,
        targetStoreId: targetStore.id,
        durationDays,
        proposedChannels,
        requestMessage:
          requestMessage.trim() ||
          `Partnership request from ${initiatorStore.name} to ${targetStore.name}.`,
      });
      setSubmittedSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Failed to send partnership request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="partner-picks-request-modal"
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Partner Picks
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Collaborate with {targetStore.name} to display selected products
              on each other&apos;s storefronts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Stores Pairing Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-800/40">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Your Store
              </div>
              {initiatorStore ? (
                <div className="flex items-center gap-2.5">
                  <img
                    src={initiatorStore.logoUrl}
                    alt={initiatorStore.name}
                    className="w-9 h-9 rounded-lg object-cover border border-stone-200 dark:border-slate-700"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {initiatorStore.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {initiatorStore.wilaya || "Alger"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Sign in as a merchant to send a request
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-800/40">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Partner Store
              </div>
              <div className="flex items-center gap-2.5">
                <img
                  src={targetStore.logoUrl}
                  alt={targetStore.name}
                  className="w-9 h-9 rounded-lg object-cover border border-stone-200 dark:border-slate-700"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">
                    {targetStore.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {targetStore.wilaya || "Alger"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isSameStore ? (
            <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-800/50 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                <Store className="w-4 h-4" />
                <span>Viewing Your Own Storefront</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Open your Partner Picks workspace to discover partner stores,
                select shared products, and manage placement positions.
              </p>
              {onOpenMerchantWorkspace && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMerchantWorkspace();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
                >
                  <span>Open Partner Picks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : existingPartnership ? (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {existingPartnership.status === "ACTIVE"
                    ? `Active Partnership with ${targetStore.name}`
                    : `Partnership Request Sent to ${targetStore.name}`}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Open your Partner Picks workspace to manage shared products,
                placement map positions, and agreement approvals.
              </p>
              {onOpenMerchantWorkspace && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMerchantWorkspace(existingPartnership.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
                >
                  <span>Open Partner Picks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : submittedSuccess ? (
            <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Partnership Request Sent
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {targetStore.name} has been notified. Once accepted, both stores
                can choose placement positions.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                {onOpenMerchantWorkspace && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenMerchantWorkspace();
                    }}
                    className="px-4 py-2 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
                  >
                    Open Partner Picks
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : !permissionCheck.allowed ? (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <div className="font-bold mb-0.5">Permission Required</div>
                <div>{permissionCheck.reason}</div>
              </div>
            </div>
          ) : bilateralCheck && !bilateralCheck.eligible ? (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/80 dark:bg-rose-950/30 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 dark:text-rose-200">
                <div className="font-bold mb-0.5">
                  Unable to Start Partnership
                </div>
                <div>{bilateralCheck.failureReason}</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Partnership Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[14, 30, 60].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDurationDays(days)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        durationDays === days
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
                  Placement Channels
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PARTNER_PICK_CHANNEL_IDS.map((ch) => {
                    const checked = proposedChannels[ch];
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => toggleChannel(ch)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          checked
                            ? "border-stone-900 dark:border-white bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                            : "border-stone-200 dark:border-slate-800 text-slate-500"
                        }`}
                      >
                        <span>{CHANNEL_LABELS[ch]}</span>
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                            checked
                              ? "bg-stone-900 text-white dark:bg-white dark:text-slate-900"
                              : "border border-stone-300 dark:border-slate-600"
                          }`}
                        >
                          {checked ? "✓" : ""}
                        </span>
                      </button>
                    );
                  })}
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
                  placeholder={`Introduce ${initiatorStore?.name || "your store"} and suggest how your products complement ${targetStore.name}...`}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-stone-400"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300">
                  {errorMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Sending..." : "Send Request"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
