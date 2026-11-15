import { Product } from "../types";
import { createDefaultSizingFitConfig } from "../utils/sizingFitLogic";

export interface DemoColorConfig {
  name: string;
  hex: string;
  stroke: string;
  textHex: string;
  bgGradient: [string, string];
  isHot?: boolean;
}

export const SEVEN_DEMO_COLORS: DemoColorConfig[] = [
  {
    name: "White",
    hex: "#ffffff",
    stroke: "#cbd5e1",
    textHex: "#0f172a",
    bgGradient: ["#f8fafc", "#e2e8f0"],
    isHot: true,
  },
  {
    name: "Black",
    hex: "#000000",
    stroke: "#334155",
    textHex: "#ffffff",
    bgGradient: ["#1e293b", "#0f172a"],
    isHot: true,
  },
  {
    name: "Red",
    hex: "#ef4444",
    stroke: "#b91c1c",
    textHex: "#ffffff",
    bgGradient: ["#fef2f2", "#fee2e2"],
  },
  {
    name: "Blue",
    hex: "#3b82f6",
    stroke: "#1d4ed8",
    textHex: "#ffffff",
    bgGradient: ["#eff6ff", "#dbeafe"],
  },
  {
    name: "Green",
    hex: "#10b981",
    stroke: "#047857",
    textHex: "#ffffff",
    bgGradient: ["#ecfdf5", "#d1fae5"],
  },
  {
    name: "Yellow",
    hex: "#f59e0b",
    stroke: "#b45309",
    textHex: "#0f172a",
    bgGradient: ["#fffbeb", "#fef3c7"],
  },
  {
    name: "Gray",
    hex: "#6b7280",
    stroke: "#374151",
    textHex: "#ffffff",
    bgGradient: ["#f3f4f6", "#e5e7eb"],
  },
];

const DETAIL_ANGLES = [
  { id: 1, title: "Detail 1 • Collar & Ribbing", subtitle: "Double-Stitched Crew Neckline" },
  { id: 2, title: "Detail 2 • Back Silhouette", subtitle: "Tailored Shoulder & Back Drape" },
  { id: 3, title: "Detail 3 • Sleeve & Cuff", subtitle: "Reinforced Hem & Twin-Needle Finish" },
  { id: 4, title: "Detail 4 • Fabric Macro", subtitle: "100% Combed Organic Cotton Weave" },
  { id: 5, title: "Detail 5 • Folded Edition", subtitle: "Boutique Ready Presentation" },
];

function createShirtSvgDataUri(
  color: DemoColorConfig,
  mode: "primary" | 1 | 2 | 3 | 4 | 5
): string {
  const isPrimary = mode === "primary";
  const detailMeta = !isPrimary ? DETAIL_ANGLES[(mode as number) - 1] : null;
  const badgeLabel = isPrimary ? `${color.name.toUpperCase()} • PRIMARY` : `${color.name.toUpperCase()} • DETAIL ${mode}/5`;
  const subLabel = isPrimary ? "Studio Front View" : detailMeta?.subtitle || "";

  let centerGraphic = "";

  if (mode === "primary" || mode === 2) {
    const isBack = mode === 2;
    centerGraphic = `
      <g transform="translate(150, 140)">
        <path d="M95 25 L145 5 L215 45 L185 110 L145 85 L145 270 L-45 270 L-45 85 L-85 110 L-115 45 L-45 5 L5 25 Z"
          fill="${color.hex}" stroke="${color.stroke}" stroke-width="5" stroke-linejoin="round" filter="url(#dropShadow)" />
        ${
          isBack
            ? `<path d="M5 25 Q50 38 95 25" fill="none" stroke="${color.stroke}" stroke-width="5" />
               <line x1="50" y1="34" x2="50" y2="265" stroke="${color.stroke}" stroke-width="2" stroke-dasharray="6 6" opacity="0.55" />`
            : `<path d="M5 25 Q50 68 95 25" fill="none" stroke="${color.stroke}" stroke-width="5" />
               <path d="M12 28 Q50 60 88 28" fill="none" stroke="${color.stroke}" stroke-width="2" opacity="0.6" />
               <circle cx="75" cy="95" r="10" fill="none" stroke="${color.stroke}" stroke-width="2.5" opacity="0.65" />`
        }
      </g>
    `;
  } else if (mode === 1) {
    // Collar close-up
    centerGraphic = `
      <g transform="translate(100, 145)">
        <path d="M10 30 L95 0 L200 0 L285 30 L265 230 L30 230 Z"
          fill="${color.hex}" stroke="${color.stroke}" stroke-width="5" filter="url(#dropShadow)" />
        <path d="M75 10 Q147 95 220 10" fill="none" stroke="${color.stroke}" stroke-width="10" stroke-linecap="round" />
        <path d="M84 22 Q147 98 211 22" fill="none" stroke="${color.stroke}" stroke-width="2.5" stroke-dasharray="5 4" />
        <rect x="122" y="32" width="50" height="22" rx="4" fill="#0f172a" opacity="0.85" />
        <text x="147" y="47" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">YUME</text>
      </g>
    `;
  } else if (mode === 3) {
    // Sleeve & Cuff detail
    centerGraphic = `
      <g transform="translate(115, 135)">
        <path d="M40 20 L195 0 L245 145 L135 205 L40 120 Z"
          fill="${color.hex}" stroke="${color.stroke}" stroke-width="5" stroke-linejoin="round" filter="url(#dropShadow)" />
        <line x1="128" y1="186" x2="235" y2="128" stroke="${color.stroke}" stroke-width="4" stroke-dasharray="7 5" />
        <line x1="132" y1="195" x2="240" y2="137" stroke="${color.stroke}" stroke-width="3" stroke-dasharray="7 5" />
      </g>
    `;
  } else if (mode === 4) {
    // Fabric weave macro
    centerGraphic = `
      <g transform="translate(105, 135)">
        <rect x="15" y="15" width="260" height="230" rx="28"
          fill="${color.hex}" stroke="${color.stroke}" stroke-width="5" filter="url(#dropShadow)" />
        <g stroke="${color.stroke}" stroke-width="2" opacity="0.35">
          <line x1="45" y1="55" x2="245" y2="55" stroke-dasharray="8 6" />
          <line x1="45" y1="95" x2="245" y2="95" stroke-dasharray="8 6" />
          <line x1="45" y1="135" x2="245" y2="135" stroke-dasharray="8 6" />
          <line x1="45" y1="175" x2="245" y2="175" stroke-dasharray="8 6" />
          <line x1="45" y1="215" x2="245" y2="215" stroke-dasharray="8 6" />
          <line x1="75" y1="35" x2="75" y2="225" stroke-dasharray="8 6" />
          <line x1="125" y1="35" x2="125" y2="225" stroke-dasharray="8 6" />
          <line x1="175" y1="35" x2="175" y2="225" stroke-dasharray="8 6" />
          <line x1="225" y1="35" x2="225" y2="225" stroke-dasharray="8 6" />
        </g>
        <circle cx="145" cy="130" r="52" fill="${color.hex}" stroke="#0f172a" stroke-width="4" />
        <text x="145" y="126" font-family="sans-serif" font-size="13" font-weight="800" fill="${color.textHex}" text-anchor="middle">240 GSM</text>
        <text x="145" y="144" font-family="sans-serif" font-size="10" font-weight="700" fill="${color.textHex}" text-anchor="middle">ORGANIC</text>
      </g>
    `;
  } else {
    // Folded package view
    centerGraphic = `
      <g transform="translate(105, 140)">
        <rect x="20" y="20" width="250" height="220" rx="20"
          fill="${color.hex}" stroke="${color.stroke}" stroke-width="5" filter="url(#dropShadow)" />
        <path d="M95 20 Q145 75 195 20" fill="none" stroke="${color.stroke}" stroke-width="6" />
        <rect x="20" y="110" width="250" height="36" fill="#0f172a" opacity="0.88" />
        <text x="145" y="133" font-family="sans-serif" font-size="13" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="2">YUME ATELIER • ${color.name.toUpperCase()}</text>
      </g>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="800" height="1000">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${color.bgGradient[0]}" />
        <stop offset="100%" stop-color="${color.bgGradient[1]}" />
      </linearGradient>
      <filter id="dropShadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.16" />
      </filter>
    </defs>
    <rect width="400" height="500" fill="url(#bgGrad)" />
    <rect x="20" y="20" width="360" height="52" rx="14" fill="#ffffff" fill-opacity="0.92" stroke="#e2e8f0" stroke-width="1.5" />
    <circle cx="46" cy="46" r="12" fill="${color.hex}" stroke="${color.stroke}" stroke-width="2" />
    <text x="68" y="43" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#0f172a">${badgeLabel}</text>
    <text x="68" y="60" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748b">${subLabel}</text>
    ${centerGraphic}
    <rect x="24" y="432" width="352" height="44" rx="12" fill="#0f172a" fill-opacity="0.9" />
    <text x="200" y="459" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#ffffff" text-anchor="middle">
      ${isPrimary ? `${color.name} Primary Product Image` : `${color.name} — ${detailMeta?.title}`}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SEVEN_COLOR_DETAILED_DEMO = (() => {
  const primaryImages: string[] = [];
  const detailedImagesByPrimary: Record<string, string[]> = {};
  const colors = SEVEN_DEMO_COLORS.map((color) => {
    const primaryUrl = createShirtSvgDataUri(color, "primary");
    const detailUrls = ([1, 2, 3, 4, 5] as const).map((idx) =>
      createShirtSvgDataUri(color, idx)
    );
    primaryImages.push(primaryUrl);
    detailedImagesByPrimary[primaryUrl] = detailUrls;
    return {
      name: color.name,
      hex: color.hex,
      imageUrl: primaryUrl,
      images: [primaryUrl, ...detailUrls],
      isHot: !!color.isHot,
      price: 3800,
    };
  });

  return {
    primaryImages,
    detailedImagesByPrimary,
    colors,
  };
})();

export const SEVEN_COLOR_PRODUCT_ITEM: Product = {
  id: "p_1_7color_shirt",
  storeId: "store_1",
  name: "T-Shirt Essential Premium 7 Couleurs (240 GSM)",
  category: "Fashion",
  subcategory: "clothing",
  price: 3800,
  stock: 70,
  sku: "ACR-700705",
  imageUrl: SEVEN_COLOR_DETAILED_DEMO.primaryImages[0],
  images: SEVEN_COLOR_DETAILED_DEMO.primaryImages,
  detailedImagesPerColorEnabled: true,
  detailedImagesByPrimary: SEVEN_COLOR_DETAILED_DEMO.detailedImagesByPrimary,
  colors: SEVEN_COLOR_DETAILED_DEMO.colors,
  colorVariantStyle: "circles",
  sizes: ["S", "M", "L", "XL", "XXL"],
  sizingFitConfig: (() => {
    const cfg = createDefaultSizingFitConfig(
      "mens_clothing",
      ["S", "M", "L", "XL", "XXL"],
      true
    );
    return {
      ...cfg,
      modelDetails: {
        enabled: true,
        sizeWorn: "L",
        fitDescription: "true_to_size",
        heightCm: "178",
        bustOrChestCm: "98",
        waistCm: "82",
        hipsCm: "96",
        customNotes: "Model is wearing size L (DZ L). Regular tailored drape across the shoulders.",
      },
    };
  })(),
  status: "active",
  rating: 4.9,
  reviews: [],
  discountEnabled: true,
  discountPercent: 15,
  timerEnabled: true,
  timerHours: 24,
  timerStyle: "style_1",
  shippingCost: 450,
  deliveryCompany: "Yalidine Express",
  specifications: [
    { key: "Origin", value: "Algeria" },
    { key: "Material", value: "100% Organic Combed Cotton (240 GSM)" },
    { key: "Fit", value: "Regular Tailored Fit" },
  ],
  description_ar: "تيشيرت قطني فاخر متوفر بـ 7 ألوان أساسية مع 5 صور تفصيلية لكل لون لمعاينة القماش والتفاصيل بدقة.",
  description_fr: "T-Shirt premium en coton peigné 240 GSM disponible en 7 couleurs avec 5 images détaillées dédiées par couleur.",
  description_en: "Premium 240 GSM combed organic cotton T-Shirt available in 7 colors with 5 dedicated detailed images per color.",
  tags: ["t-shirt", "fashion", "cotton", "7-colors", "detailed-images"],
};
