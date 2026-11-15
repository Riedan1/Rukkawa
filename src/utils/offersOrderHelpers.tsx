import React, { useState } from "react";
import { Order } from "../types";
import {
  OfferTier,
  OfferGiftItem,
  resolveUnitVariantInfo,
  resolveVariantColorHex,
  DEFAULT_HOODIE_THUMBNAIL,
} from "./offersLogic";
import { PlayingCardProductStack } from "../components/YumeOffersAndPromotions";
import { Gift, Sparkles, Check, ChevronDown, ChevronUp, PackageCheck } from "lucide-react";

export interface ParsedOfferUnit {
  unitIndex: number;
  size?: string;
  color?: string;
  colorHex?: string;
  specs: Record<string, string>;
  rawLabel: string;
}

export interface ParsedOfferGift {
  id?: string;
  name: string;
  quantity: number;
  color?: string;
  price?: number;
  imageUrl?: string;
  isFree: boolean;
}

export interface ParsedOfferDetails {
  isOffer: boolean;
  tierTitle: string;
  tierId?: string;
  offerType?: string;
  badgeText?: string;
  totalUnits: number;
  purchasedQuantity: number;
  freeQuantity: number;
  baseUnitPriceDzd?: number;
  originalTotalDzd?: number;
  finalPriceDzd?: number;
  savingsDzd?: number;
  savingsPercent?: number;
  units: ParsedOfferUnit[];
  gifts: ParsedOfferGift[];
  rawSummary?: string;
}

// Known color swatches for Algerian & Fashion color names
const COLOR_HEX_MAP: Record<string, string> = {
  "dark onyx": "#1e293b",
  onyx: "#0f172a",
  black: "#111827",
  noir: "#111827",
  "off white": "#f8fafc",
  white: "#ffffff",
  blanc: "#ffffff",
  obsidian: "#334155",
  charcoal: "#374151",
  "platinum light gray": "#e2e8f0",
  "light gray": "#e2e8f0",
  "gris clair": "#e2e8f0",
  "medium gray": "#94a3b8",
  gray: "#64748b",
  gris: "#64748b",
  "forest green": "#166534",
  green: "#15803d",
  vert: "#15803d",
  pink: "#f472b6",
  rose: "#f472b6",
  cream: "#fef3c7",
  brown: "#78350f",
  marron: "#78350f",
  yellow: "#eab308",
  jaune: "#eab308",
  navy: "#1e3a8a",
  "bleu marine": "#1e3a8a",
  blue: "#2563eb",
  bleu: "#2563eb",
  beige: "#f5f5dc",
  sand: "#e7d8c9",
  camel: "#c19a6b",
  red: "#dc2626",
  rouge: "#dc2626",
  burgundy: "#800020",
  bordeaux: "#800020",
};

export function resolveColorHex(colorName?: string): string | undefined {
  if (!colorName) return undefined;
  const clean = colorName.trim().toLowerCase();
  if (clean.startsWith("#")) return clean;
  return COLOR_HEX_MAP[clean] || undefined;
}

/**
 * Extracts structured offer data from an Order object or item.
 * Supports:
 *  1. Direct order.offerDetails
 *  2. Item-level rich offer fields
 *  3. Fallback string parsing of `Trio (#1: Small (S) / Dark Onyx, ...) + Gifts: 1x Baseball Cap (FREE)`
 */
export function extractOfferFromOrder(order: Partial<Order> | null | undefined): ParsedOfferDetails | null {
  if (!order) return null;

  // 1. Direct offerDetails on order
  if (order.offerDetails && order.offerDetails.tierTitle) {
    const od = order.offerDetails;
    const units: ParsedOfferUnit[] = (od.unitSelections || []).map((u, idx) => {
      const colorVal = u["Color"] || u["color"] || "";
      const sizeVal = u["Size"] || u["size"] || "";
      const raw = Object.values(u).filter(Boolean).join(" / ");
      return {
        unitIndex: idx + 1,
        color: colorVal || undefined,
        size: sizeVal || undefined,
        colorHex: resolveColorHex(colorVal),
        specs: u,
        rawLabel: raw,
      };
    });

    const gifts: ParsedOfferGift[] = (od.freeGifts || []).map((g) => ({
      id: g.id,
      name: g.name,
      quantity: g.quantity || 1,
      color: g.color,
      price: g.price,
      imageUrl: g.imageUrl,
      isFree: true,
    }));

    return {
      isOffer: true,
      tierTitle: od.tierTitle,
      tierId: od.tierId,
      offerType: od.offerType,
      badgeText: od.badgeText,
      totalUnits: od.totalUnits || units.length || 1,
      purchasedQuantity: od.purchasedQuantity || 1,
      freeQuantity: od.freeQuantity || 0,
      baseUnitPriceDzd: od.baseUnitPriceDzd,
      originalTotalDzd: od.originalTotalDzd,
      finalPriceDzd: od.finalPriceDzd,
      savingsDzd: od.savingsDzd,
      savingsPercent: od.savingsPercent,
      units,
      gifts,
      rawSummary: od.summaryText,
    };
  }

  // 2. Check items for rich offer fields
  const offerItem = (order.items || []).find(
    (it) => it.isOfferItem || it.offerTierId || it.variantOptions?.Offer || (it.name && it.name.includes("("))
  );

  if (offerItem) {
    if (offerItem.offerTitle && Array.isArray(offerItem.offerUnitVariants)) {
      const units: ParsedOfferUnit[] = offerItem.offerUnitVariants.map((u, idx) => {
        const colorVal = u["Color"] || u["color"] || "";
        const sizeVal = u["Size"] || u["size"] || "";
        return {
          unitIndex: idx + 1,
          color: colorVal || undefined,
          size: sizeVal || undefined,
          colorHex: resolveColorHex(colorVal),
          specs: u,
          rawLabel: Object.values(u).filter(Boolean).join(" / "),
        };
      });

      const gifts: ParsedOfferGift[] = (offerItem.offerFreeGifts || []).map((g) => ({
        id: g.id,
        name: g.name,
        quantity: g.quantity || 1,
        color: g.color,
        price: g.price,
        imageUrl: g.imageUrl,
        isFree: true,
      }));

      return {
        isOffer: true,
        tierTitle: offerItem.offerTitle,
        tierId: offerItem.offerTierId,
        offerType: offerItem.offerType,
        totalUnits: offerItem.offerTotalUnits || units.length || 1,
        purchasedQuantity: offerItem.offerPurchasedQty || 1,
        freeQuantity: offerItem.offerFreeQty || 0,
        savingsDzd: offerItem.offerSavingsDzd,
        units,
        gifts,
        rawSummary: offerItem.offerSummary,
      };
    }

    // Fallback string parsing
    const rawStr =
      offerItem.variantOptions?.Offer ||
      offerItem.offerSummary ||
      (offerItem.name.includes("(") ? offerItem.name : "");

    if (rawStr && (rawStr.includes("#1:") || rawStr.includes("+ Gifts:") || rawStr.includes("Trio") || rawStr.includes("Duo") || rawStr.includes("Single"))) {
      return parseOfferFromString(rawStr);
    }
  }

  return null;
}

/**
 * Parses a raw offer summary string like:
 * "Trio (#1: Small (S) / Dark Onyx, #2: Small (S) / Off White, #3: Small (S) / Obsidian, #4: Small (S) / Platinum Light Gray, #5: Small (S) / Medium Gray) + Gifts: 1x Baseball Cap (FREE)"
 */
export function parseOfferFromString(str: string): ParsedOfferDetails {
  const cleanStr = str.trim();

  // 1. Extract tier title (usually first word before "(" or "[" or ":")
  let tierTitle = "Special Offer";
  const titleMatch = cleanStr.match(/^([a-zA-Z0-9\s]+?)(?:\s*\(|\s*\[|\s*:|\s*#)/);
  if (titleMatch && titleMatch[1].trim()) {
    tierTitle = titleMatch[1].trim();
  }

  // 2. Extract gifts section (+ Gifts: ...)
  const gifts: ParsedOfferGift[] = [];
  const giftsMatch = cleanStr.match(/\+\s*Gifts?:\s*(.+)$/i);
  let unitsChunk = cleanStr;

  if (giftsMatch && giftsMatch[1]) {
    unitsChunk = cleanStr.substring(0, cleanStr.indexOf(giftsMatch[0])).trim();
    const giftsRaw = giftsMatch[1].split(/,\s*/);
    for (const g of giftsRaw) {
      const gClean = g.replace(/\(FREE\)/i, "").trim();
      const qtyMatch = gClean.match(/^(\d+)x\s+(.+)$/i);
      if (qtyMatch) {
        gifts.push({
          name: qtyMatch[2].trim(),
          quantity: parseInt(qtyMatch[1], 10) || 1,
          isFree: true,
        });
      } else if (gClean) {
        gifts.push({
          name: gClean,
          quantity: 1,
          isFree: true,
        });
      }
    }
  }

  // 3. Extract units (#1: ..., #2: ...)
  const units: ParsedOfferUnit[] = [];
  const unitRegex = /#(\d+):\s*(.*?)(?=(?:,\s*#\d+:|\s*\)\s*(?:\+|$)|$))/g;
  let match: RegExpExecArray | null;

  while ((match = unitRegex.exec(unitsChunk)) !== null) {
    const idx = parseInt(match[1], 10);
    let content = match[2].trim();
    if (content.endsWith(")")) {
      const openCount = (content.match(/\(/g) || []).length;
      const closeCount = (content.match(/\)/g) || []).length;
      if (closeCount > openCount) {
        content = content.slice(0, -1).trim();
      }
    }
    const parts = content.split("/").map((p) => p.trim());

    let sizeVal: string | undefined;
    let colorVal: string | undefined;

    for (const p of parts) {
      if (
        /^(s|m|l|xl|xxl|2xl|3xl|small|medium|large|extra large)$/i.test(p) ||
        /\((s|m|l|xl|xxl|2xl|3xl)\)/i.test(p) ||
        /size/i.test(p)
      ) {
        sizeVal = p;
      } else if (resolveColorHex(p) || /color|noir|blanc|onyx|white|black|gray|green|blue|pink/i.test(p)) {
        colorVal = p;
      } else if (!sizeVal) {
        sizeVal = p;
      } else if (!colorVal) {
        colorVal = p;
      }
    }

    units.push({
      unitIndex: idx,
      size: sizeVal,
      color: colorVal,
      colorHex: resolveColorHex(colorVal),
      specs: {
        ...(sizeVal ? { Size: sizeVal } : {}),
        ...(colorVal ? { Color: colorVal } : {}),
      },
      rawLabel: content,
    });
  }

  // Determine purchased and free counts
  let purchased = units.length;
  let free = 0;
  const lowerTitle = tierTitle.toLowerCase();
  if (lowerTitle.includes("trio")) {
    purchased = 3;
    free = Math.max(0, units.length - 3);
  } else if (lowerTitle.includes("duo")) {
    purchased = 2;
    free = Math.max(0, units.length - 2);
  } else if (lowerTitle.includes("single")) {
    purchased = 1;
    free = Math.max(0, units.length - 1);
  }

  return {
    isOffer: true,
    tierTitle,
    totalUnits: units.length || 1,
    purchasedQuantity: purchased,
    freeQuantity: free,
    units,
    gifts,
    rawSummary: cleanStr,
  };
}

/**
 * 1. SIDEBAR BUY-BOX ORDER SUMMARY CARD
 * Replaces the messy wall of text in the right sidebar buycard (Image 1: image_21cbf901.png)
 */
export function OrganizedOfferSummaryBuyBox({
  tier,
  unitSelections,
  totalUnits,
  savingsDzd,
  accentColor = "#4A0E2E",
  freeGifts,
  thumbnailUrl,
  productName,
  step3Variants,
  step3Colors,
  productImages,
}: {
  tier: OfferTier | null;
  unitSelections: Array<Record<string, string>>;
  totalUnits: number;
  savingsDzd?: number;
  accentColor?: string;
  freeGifts?: OfferGiftItem[];
  thumbnailUrl?: string;
  productName?: string;
  step3Variants?: Array<{
    id?: string;
    name?: string;
    color?: string;
    colorHex?: string;
    size?: string;
    imageUrl?: string;
    images?: string[];
    options?: Record<string, string>;
  }>;
  step3Colors?: Array<{
    id?: string;
    name?: string;
    hex?: string;
    imageUrl?: string;
    images?: string[];
  }>;
  productImages?: string[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const gifts = freeGifts || tier?.freeGifts || [];

  if (!tier) return null;

  // Build per-unit resolved cards so Single / Duo / Trio show the exact stacked playing cards & selected color variants
  const tierUnitCards = Array.from({
    length: Math.max(1, totalUnits),
  }).map((_, uIdx) => {
    const selMap = unitSelections[uIdx] || {};
    const resolved = resolveUnitVariantInfo({
      unitIndex: uIdx,
      unitSelections: selMap,
      step3Variants,
      step3Colors,
      defaultImageUrl: tier.imageUrl || thumbnailUrl || DEFAULT_HOODIE_THUMBNAIL,
      productImages,
    });
    const chosenLabels = Object.values(selMap).filter(Boolean).join(" • ");
    return {
      ...resolved,
      variantLabel: chosenLabels || `Item #${uIdx + 1}`,
    };
  });

  return (
    <div className="w-full bg-stone-50/80 rounded-2xl p-3 border border-stone-200/90 shadow-2xs space-y-2.5 transition-all">
      {/* Header Row with Stacked Unit Cards, Tier Title & Count Badge */}
      <div className="flex items-center gap-3.5">
        <PlayingCardProductStack
          units={tierUnitCards}
          totalUnits={totalUnits}
          tierTitle={tier.title}
          tierId={tier.id || "summary"}
        />
        <div className="flex-1 min-w-0 pl-1.5 space-y-1">
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <span className="font-extrabold text-xs sm:text-[13px] text-slate-900 truncate leading-snug">
              {tier.title} Package
            </span>
            {savingsDzd && savingsDzd > 0 ? (
              <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 font-mono shrink-0">
                Save {savingsDzd.toLocaleString()} DA
              </span>
            ) : null}
          </div>

          <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
            {tier.buyQty && tier.freeQty
              ? `${tier.buyQty} Purchased + ${tier.freeQty} Free Bonus`
              : "Customer-selected offer tier"}
          </p>
        </div>
      </div>

      {/* Itemized Units Grid (without 'SELECTED ITEMS (X):' sentence) */}
      <div className="space-y-1.5 pt-1 border-t border-stone-200/70">
        {unitSelections.length > 2 && (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] font-bold text-slate-700 hover:text-slate-900 flex items-center gap-0.5 cursor-pointer"
            >
              <span>{isExpanded ? "Collapse" : `View all ${unitSelections.length}`}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        )}

        {/* Units list */}
        <div className="grid grid-cols-1 gap-1.5">
          {(isExpanded ? unitSelections : unitSelections.slice(0, 2)).map((selection, idx) => {
            const sizeVal = selection["Size"] || selection["size"];
            const colorVal = selection["Color"] || selection["color"];
            const hex =
              (colorVal ? resolveVariantColorHex(colorVal, step3Colors) : undefined) ||
              resolveColorHex(colorVal);

            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-stone-200/80 text-[11.5px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-stone-100 font-mono text-[10px] font-black text-stone-700 flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1.5 truncate">
                    {colorVal && (
                      <div className="flex items-center gap-1 shrink-0">
                        {hex && (
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-stone-300 shrink-0 shadow-3xs"
                            style={{ backgroundColor: hex }}
                          />
                        )}
                        <span className="font-semibold text-slate-800">{colorVal}</span>
                      </div>
                    )}
                    {colorVal && sizeVal && <span className="text-stone-300">·</span>}
                    {sizeVal && (
                      <span className="font-medium text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded text-[10.5px]">
                        {sizeVal}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[10px] font-bold text-stone-400 font-mono uppercase shrink-0">
                  Unit {idx + 1}
                </span>
              </div>
            );
          })}

          {!isExpanded && unitSelections.length > 2 && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="text-left py-1 px-2.5 text-[11px] font-semibold text-stone-500 hover:text-stone-800 bg-stone-100/70 hover:bg-stone-200/60 rounded-md transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>+ {unitSelections.length - 2} more selected item(s)</span>
              <span className="text-[10px] font-bold underline">Show all</span>
            </button>
          )}
        </div>
      </div>

      {/* Free Gifts Highlight Box */}
      {gifts.length > 0 && (
        <div className="p-2 rounded-xl bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200/70 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-3xs">
              <Gift className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-black text-[11px] text-amber-950 uppercase tracking-wider">
                  Free Gift Included:
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-200/80 text-[9.5px] font-extrabold text-amber-900 uppercase">
                  FREE
                </span>
              </div>
              <p className="text-[11px] font-bold text-stone-800 truncate">
                {gifts.map((g) => `${g.quantity || 1}x ${g.name}`).join(", ")}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-800 line-through shrink-0 font-mono">
            {gifts.reduce((sum, g) => sum + (g.originalPrice || (g as any).price || 800), 0).toLocaleString()} DA
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 2. ORDER FORM MODAL SUMMARY (Image 2: image_53994b30.png)
 * Replaces the messy block of text inside the Order Form checkout modal.
 */
export function OrganizedOfferSummaryModal({
  productName,
  tierTitle,
  unitSelections,
  totalUnits,
  savingsDzd,
  freeGifts,
  accentColor = "#4A0E2E",
  step3Colors,
}: {
  productName: string;
  tierTitle: string;
  unitSelections: Array<Record<string, string>>;
  totalUnits: number;
  savingsDzd?: number;
  freeGifts?: OfferGiftItem[];
  accentColor?: string;
  step3Colors?: Array<{
    id?: string;
    name?: string;
    hex?: string;
    imageUrl?: string;
    images?: string[];
  }>;
}) {
  const gifts = freeGifts || [];

  return (
    <div className="w-full space-y-2.5 text-left">
      {/* Savings pill if available (DUO 3 ITEMS BUNDLE label removed per requirement) */}
      {savingsDzd && savingsDzd > 0 ? (
        <div className="flex items-center justify-end">
          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
            Save {savingsDzd.toLocaleString()} DA
          </span>
        </div>
      ) : null}

      {/* Structured Items List */}
      <div className="bg-white rounded-xl p-2.5 border border-stone-200/90 shadow-3xs space-y-1.5">
        <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-100 flex items-center justify-between">
          <span>Items to Pack</span>
          <span className="font-mono">{unitSelections.length} Units</span>
        </div>

        <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
          {unitSelections.map((selection, idx) => {
            const sizeVal = selection["Size"] || selection["size"];
            const colorVal = selection["Color"] || selection["color"];
            const hex =
              (colorVal ? resolveVariantColorHex(colorVal, step3Colors) : undefined) ||
              resolveColorHex(colorVal);

            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 py-1 px-1.5 rounded-lg hover:bg-stone-50 text-[11.5px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-4 h-4 rounded bg-stone-100 font-mono text-[9.5px] font-black text-stone-600 flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex items-center gap-1.5 truncate">
                    {colorVal && (
                      <div className="flex items-center gap-1 shrink-0">
                        {hex && (
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-stone-300 shadow-3xs shrink-0"
                            style={{ backgroundColor: hex }}
                          />
                        )}
                        <span className="font-bold text-slate-800">{colorVal}</span>
                      </div>
                    )}
                    {colorVal && sizeVal && <span className="text-stone-300">/</span>}
                    {sizeVal && (
                      <span className="font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded text-[10.5px]">
                        {sizeVal}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[10px] font-mono text-stone-400 font-semibold shrink-0">
                  ✓ Confirmed
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Free Gifts Row */}
      {gifts.length > 0 && (
        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Gift className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="truncate">
              <span className="font-black text-amber-950 text-[11px] mr-1.5">Free Gift:</span>
              <span className="font-bold text-amber-900 text-[11.5px]">
                {gifts.map((g) => `${g.quantity || 1}x ${g.name}`).join(", ")}
              </span>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black text-[9.5px] uppercase shrink-0">
            FREE
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 3. DASHBOARD / ORDERS SECTION OFFER BADGE & SUMMARY
 * Displays beautifully in the store owner's and moderators team's OrdersModule table & cards.
 */
export function MerchantOrderOfferBadge({
  order,
  onClickDetails,
}: {
  order: Order;
  onClickDetails?: () => void;
}) {
  const parsed = extractOfferFromOrder(order);
  if (!parsed || !parsed.isOffer) return null;

  return (
    <div className="mt-1.5 space-y-1 text-left">
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
        <img
          src="assets/aistudio/image_2a5c0b49.png"
          alt="Offer"
          className="w-3.5 h-3.5 shrink-0 object-contain dark:brightness-0 dark:invert"
        />
        <span>Offer: {parsed.tierTitle}</span>
        <span className="font-mono text-[10px] bg-indigo-200/60 dark:bg-indigo-900 px-1.5 py-0.2 rounded font-extrabold">
          {parsed.totalUnits} items
        </span>
      </div>

      {parsed.gifts.length > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-bold">
          <Gift className="w-3 h-3 shrink-0" />
          <span>
            + {parsed.gifts.map((g) => `${g.quantity}x ${g.name}`).join(", ")} (FREE)
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 4. FULL OFFER PACKING CHECKLIST FOR FULFILLMENT / MODERATOR
 * Rendered in the Order Details Modal so store owners and moderators see all units clearly.
 */
export function MerchantOfferDetailsFulfillmentPanel({
  order,
}: {
  order: Order;
}) {
  const parsed = extractOfferFromOrder(order);
  if (!parsed || !parsed.isOffer) return null;

  return (
    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs space-y-3.5 text-left font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-indigo-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <img
              src="assets/aistudio/image_2a5c0b49.png"
              alt="Offer"
              className="w-4 h-4 shrink-0 object-contain brightness-0 invert"
            />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{parsed.tierTitle} Bundle</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-[10px] font-extrabold uppercase">
                Promotion Order
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Shopper purchased {parsed.totalUnits} items total with promotional package
            </p>
          </div>
        </div>

        {parsed.savingsDzd && parsed.savingsDzd > 0 ? (
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Buyer Savings</span>
            <span className="text-xs font-black text-emerald-600 font-mono">
              -{parsed.savingsDzd.toLocaleString()} DA
            </span>
          </div>
        ) : null}
      </div>

      {/* Warehouse Packing Checklist */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1">
            <PackageCheck className="w-3.5 h-3.5 text-indigo-500" />
            Fulfillment Packing Checklist ({parsed.units.length} Units)
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
            Verify before dispatch
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {parsed.units.map((unit) => {
            const hex = resolveColorHex(unit.color);
            return (
              <div
                key={unit.unitIndex}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-3xs"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 font-mono font-black text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  #{unit.unitIndex}
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    {hex && (
                      <span
                        className="w-3 h-3 rounded-full border border-slate-300 shrink-0 shadow-3xs"
                        style={{ backgroundColor: hex }}
                      />
                    )}
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {unit.color || "Standard"}
                    </span>
                    {unit.size && (
                      <span className="font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[10.5px]">
                        {unit.size}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Unit #{unit.unitIndex} for dispatch
                  </span>
                </div>
                <span className="w-5 h-5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Free Gifts Section */}
      {parsed.gifts.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-amber-600 shrink-0" />
              Bonus Free Gift(s) to Include in Box:
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 font-black text-[9.5px] text-amber-900 dark:text-amber-200 uppercase">
              100% Free Gift
            </span>
          </div>

          <div className="space-y-1">
            {parsed.gifts.map((gift, gIdx) => (
              <div
                key={gIdx}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-amber-100 dark:border-amber-900/40"
              >
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {gift.quantity}x {gift.name}
                  {gift.color ? ` (Color: ${gift.color})` : ""}
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">
                  Included in Parcel
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
