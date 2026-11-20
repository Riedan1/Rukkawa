import { CategoryTemplateField } from "../types";

export const CUSTOM_OTHER_OPTION = "Custom / Other";

export const LEGACY_DEFAULT_DESCRIPTION =
  "Hand-loomed by elder artisans using organic vegetable-dyed wools from the Atlas mountains.";

export interface CurrencyConfig {
  code: string;
  label: string;
  symbol: string;
  rateFromDzd: number;
}

export const WIZARD_CURRENCIES: CurrencyConfig[] = [
  { code: "DZD", label: "Algerian Dinar", symbol: "DA", rateFromDzd: 1 },
  { code: "USD", label: "USD - US Dollar ($)", symbol: "$", rateFromDzd: 0.0074 },
  { code: "EUR", label: "EUR - Euro (€)", symbol: "€", rateFromDzd: 0.0068 },
  { code: "GBP", label: "GBP - British Pound (£)", symbol: "£", rateFromDzd: 0.0058 },
  { code: "CAD", label: "CAD - Canadian Dollar (CA$)", symbol: "CA$", rateFromDzd: 0.0102 },
  { code: "SAR", label: "SAR - Saudi Riyal (ر.س)", symbol: "SAR", rateFromDzd: 0.0278 },
  { code: "AED", label: "AED - UAE Dirham (د.إ)", symbol: "AED", rateFromDzd: 0.0272 },
  { code: "QAR", label: "QAR - Qatari Riyal (ر.ق)", symbol: "QAR", rateFromDzd: 0.027 },
  { code: "KWD", label: "KWD - Kuwaiti Dinar (د.ك)", symbol: "KWD", rateFromDzd: 0.0023 },
  { code: "MAD", label: "MAD - Moroccan Dirham (د.م.)", symbol: "MAD", rateFromDzd: 0.074 },
  { code: "TND", label: "TND - Tunisian Dinar (د.ت)", symbol: "TND", rateFromDzd: 0.023 },
  { code: "TRY", label: "TRY - Turkish Lira (₺)", symbol: "₺", rateFromDzd: 0.25 },
  { code: "CHF", label: "CHF - Swiss Franc (CHF)", symbol: "CHF", rateFromDzd: 0.0065 },
  { code: "JPY", label: "JPY - Japanese Yen (¥)", symbol: "¥", rateFromDzd: 1.12 },
  { code: "AUD", label: "AUD - Australian Dollar (A$)", symbol: "A$", rateFromDzd: 0.0114 }
];

export function getCurrencySymbol(currencyCode?: string): string {
  if (!currencyCode) return "DA";
  const found = WIZARD_CURRENCIES.find(
    (c) => c.code.toUpperCase() === currencyCode.trim().toUpperCase()
  );
  return found ? found.symbol : currencyCode;
}

export function formatWizardPrice(amount: number, currencyCode?: string): string {
  const safeNum = Number.isFinite(amount) ? amount : 0;
  const symbol = getCurrencySymbol(currencyCode);
  return `${safeNum.toLocaleString()} ${symbol}`;
}

export function sanitizeInitialProductDescription(desc?: string): string {
  if (!desc) return "";
  if (desc.trim() === LEGACY_DEFAULT_DESCRIPTION) {
    return "";
  }
  return desc;
}

// ============================================================================
// 2026 / 2027 DYNAMIC SPECIFICATION PRESETS & "Custom / Other" ENGINE
// ============================================================================

export const SPEC_PRESETS_2026: Record<string, string[]> = {
  brand_electronics: [
    "Apple",
    "Samsung",
    "Google Pixel",
    "Xiaomi",
    "OnePlus",
    "Huawei",
    "Honor",
    "ASUS",
    "Lenovo",
    "Dell",
    "HP",
    "MSI",
    "Sony",
    "Yomi Tech",
    "IRIS",
    "Condor",
    "Stream System",
    CUSTOM_OTHER_OPTION
  ],
  brand_fashion: [
    "Zara",
    "Nike",
    "Adidas",
    "Mango",
    "H&M",
    "Lacoste",
    "Massimo Dutti",
    "Yomi Classic",
    "Yomi Couture",
    "Atlas Heritage",
    CUSTOM_OTHER_OPTION
  ],
  brand_beauty: [
    "L'Oréal Paris",
    "La Roche-Posay",
    "CeraVe",
    "The Ordinary",
    "Dior Beauty",
    "Fenty Beauty",
    "Yomi Botanicals",
    "Sahara Glow",
    CUSTOM_OTHER_OPTION
  ],
  brand_general: [
    "Yomi Artisan",
    "Atlas Heritage",
    "Casbah Craft",
    "Kabylie Silver",
    "M'zab Looms",
    "Sahara Gold",
    "International Brand",
    CUSTOM_OTHER_OPTION
  ],
  processor: [
    "Apple A19 Pro",
    "Apple A19",
    "Apple A18 Pro",
    "Apple M4 Max",
    "Apple M4 Pro",
    "Apple M4",
    "Snapdragon 8 Elite (Gen 4)",
    "Snapdragon 8 Gen 5",
    "Snapdragon 8 Gen 3",
    "Snapdragon X Elite",
    "MediaTek Dimensity 9500",
    "MediaTek Dimensity 9400",
    "MediaTek Dimensity 9300+",
    "Google Tensor G5",
    "Google Tensor G4",
    "Samsung Exynos 2500",
    "Intel Core Ultra 9 (Series 2)",
    "Intel Core i9 (14th Gen)",
    "Intel Core i7 (14th Gen)",
    "AMD Ryzen AI 9 HX 370",
    "AMD Ryzen 9 9950X",
    "AMD Ryzen 7 9800X3D",
    "Octa-Core 5G Processor",
    CUSTOM_OTHER_OPTION
  ],
  storage: [
    "64GB",
    "128GB",
    "256GB",
    "512GB",
    "1TB",
    "2TB",
    "3TB",
    "4TB",
    CUSTOM_OTHER_OPTION
  ],
  ram: [
    "4GB",
    "6GB",
    "8GB",
    "12GB",
    "16GB",
    "24GB",
    "32GB",
    "64GB",
    CUSTOM_OTHER_OPTION
  ],
  operating_system: [
    "iOS 19",
    "iOS 18",
    "Android 16",
    "Android 15",
    "HyperOS 2.0",
    "HarmonyOS NEXT",
    "Windows 11 Pro",
    "Windows 11 Home",
    "macOS Sequoia",
    "Linux / Ubuntu",
    "ChromeOS",
    CUSTOM_OTHER_OPTION
  ],
  camera_specs: [
    "200MP Quad Periscope + 50MP Ultra-Wide + 50MP Telephoto",
    "50MP Triple Pro (Main OIS + 5x Periscope + 50MP Ultra-Wide)",
    "48MP Fusion Main + 48MP Ultra-Wide + 12MP 5x Telephoto",
    "50MP Main OIS + 12MP Ultra-Wide Dual Camera",
    "50MP Leica Summilux Optical Triple Camera",
    "108MP ProGrade Triple AI Camera + 32MP Selfie",
    "64MP OIS Main + 8MP Ultra-Wide + 2MP Macro",
    "48MP Dual AI Camera System",
    "Single 12MP HD Camera Sensor",
    CUSTOM_OTHER_OPTION
  ],
  sim_type: [
    "Single Nano SIM",
    "Dual SIM (Nano + eSIM)",
    "Dual eSIM",
    "eSIM Only",
    "Dual Nano SIM",
    CUSTOM_OTHER_OPTION
  ],
  screen_size: [
    "6.1 inches",
    "6.3 inches",
    "6.5 inches",
    "6.7 inches",
    "6.8 inches",
    "6.9 inches",
    "8.3 inches",
    "10.9 inches",
    "11.0 inches",
    "12.9 inches",
    "13.3 inches",
    "13.6 inches",
    "14.2 inches",
    "15.6 inches",
    "16.2 inches",
    "17.3 inches",
    CUSTOM_OTHER_OPTION
  ],
  gpu: [
    "Apple A19 Pro 6-Core GPU",
    "Apple M4 Max 40-Core GPU",
    "Apple M4 Pro 20-Core GPU",
    "Adreno 830 GPU",
    "Immortalis-G925 GPU",
    "NVIDIA GeForce RTX 5090",
    "NVIDIA GeForce RTX 5080",
    "NVIDIA GeForce RTX 4090",
    "NVIDIA GeForce RTX 4080 Super",
    "NVIDIA GeForce RTX 4070",
    "AMD Radeon RX 8900 XTX",
    "AMD Radeon RX 7900 XTX",
    "Intel Arc Battlemage GPU",
    "Integrated Graphics",
    CUSTOM_OTHER_OPTION
  ]
};

export function ensureCustomOtherOption(options?: string[]): string[] {
  if (!options || options.length === 0) return [CUSTOM_OTHER_OPTION];
  const filtered = options.filter(
    (opt) =>
      opt.trim().toLowerCase() !== "other" &&
      opt.trim().toLowerCase() !== "custom / other" &&
      opt.trim().toLowerCase() !== "custom"
  );
  return [...filtered, CUSTOM_OTHER_OPTION];
}

export function getBrandPresetsForCategory(categoryId?: string): string[] {
  const norm = (categoryId || "").toLowerCase();
  if (
    norm.includes("electronic") ||
    norm.includes("smartphone") ||
    norm.includes("laptop") ||
    norm.includes("tablet") ||
    norm.includes("desktop") ||
    norm.includes("camera") ||
    norm.includes("headphone") ||
    norm.includes("gaming")
  ) {
    return SPEC_PRESETS_2026.brand_electronics;
  }
  if (
    norm.includes("fashion") ||
    norm.includes("clothing") ||
    norm.includes("shoe") ||
    norm.includes("bag") ||
    norm.includes("watch") ||
    norm.includes("hat") ||
    norm.includes("kid")
  ) {
    return SPEC_PRESETS_2026.brand_fashion;
  }
  if (
    norm.includes("beauty") ||
    norm.includes("cosmetic") ||
    norm.includes("skincare") ||
    norm.includes("haircare") ||
    norm.includes("personalcare") ||
    norm.includes("vitamin")
  ) {
    return SPEC_PRESETS_2026.brand_beauty;
  }
  return SPEC_PRESETS_2026.brand_general;
}

/**
 * Upgrades any category's template fields to 2026/2027 standards and ensures
 * every select/preset field includes "Custom / Other" across ALL categories.
 */
export function normalizeCategoryFieldsWith2026Specs(
  fields: CategoryTemplateField[],
  categoryId?: string
): CategoryTemplateField[] {
  const sourceFields = Array.isArray(fields) ? fields : [];
  const hasBrand = sourceFields.some((f) => f.name.toLowerCase() === "brand");

  const upgraded = sourceFields.map((field): CategoryTemplateField => {
    const lower = field.name.trim().toLowerCase();

    if (lower === "gender" || lower === "genre" || lower === "sexe" || lower === "جنس" || lower === "الجنس") {
      const isKid = ["kid", "child", "children", "baby", "babies", "enfant", "طفل", "أطفال", "bebe", "boy", "girl"].some((k) =>
        (categoryId || "").toLowerCase().includes(k)
      );
      return {
        ...field,
        type: "select",
        required: field.required ?? true,
        options: isKid ? ["Boys", "Girls"] : ["Men", "Women"],
        placeholder: isKid ? "Select child gender" : "Select gender"
      };
    }

    if (lower === "brand") {
      const baseOpts =
        field.options && field.options.length > 0
          ? ensureCustomOtherOption([
              ...field.options,
              ...getBrandPresetsForCategory(categoryId)
            ].filter((v, i, a) => a.indexOf(v) === i))
          : getBrandPresetsForCategory(categoryId);
      return {
        ...field,
        type: "select",
        required: field.required ?? true,
        options: baseOpts,
        placeholder: field.placeholder || "Select brand or Custom / Other"
      };
    }

    if (lower === "processor" || lower === "cpu") {
      return {
        ...field,
        type: "select",
        options: SPEC_PRESETS_2026.processor,
        placeholder: "Select 2026/2027 processor or Custom / Other"
      };
    }

    if (lower === "gpu" || lower === "graphics" || lower === "graphics card") {
      return {
        ...field,
        type: "select",
        options: SPEC_PRESETS_2026.gpu,
        placeholder: "Select GPU or Custom / Other"
      };
    }

    if (lower === "storage" || lower === "storage capacity") {
      return {
        ...field,
        type: "select",
        options: SPEC_PRESETS_2026.storage,
        placeholder: "Select storage capacity (up to 4TB) or Custom / Other"
      };
    }

    if (lower === "ram" || lower === "ram memory") {
      return {
        ...field,
        type: "select",
        options: SPEC_PRESETS_2026.ram,
        placeholder: "Select RAM capacity (up to 64GB) or Custom / Other"
      };
    }

    if (lower === "operating system" || lower === "os") {
      return {
        ...field,
        type: "select",
        options: SPEC_PRESETS_2026.operating_system,
        placeholder: "Select operating system or Custom / Other"
      };
    }

    if (lower === "camera specs" || lower === "camera") {
      return {
        ...field,
        type: "select",
        options: SPEC_PRESETS_2026.camera_specs,
        placeholder: "Select camera configuration or Custom / Other"
      };
    }

    if (lower === "sim type" || lower === "sim") {
      return {
        ...field,
        type: "select",
        options: SPEC_PRESETS_2026.sim_type,
        placeholder: "Select 2026 SIM standard or Custom / Other"
      };
    }

    if (lower === "screen size" || lower === "display size") {
      return {
        ...field,
        type: "select",
        options: SPEC_PRESETS_2026.screen_size,
        placeholder: "Select screen size or Custom / Other"
      };
    }

    if (field.type === "select" && field.options && field.options.length > 0) {
      return {
        ...field,
        options: ensureCustomOtherOption(field.options)
      };
    }

    return field;
  });

  // Ensure Brand* is available as a standardized dropdown + Custom / Other across all categories
  if (!hasBrand) {
    upgraded.unshift({
      name: "Brand",
      type: "select",
      required: true,
      options: getBrandPresetsForCategory(categoryId),
      placeholder: "Select brand or Custom / Other"
    });
  }

  return upgraded;
}

/**
 * Returns universal variant-driving specification suggestions for ANY category,
 * ordered cleanly: (Color, Size, Processor/CPU, GPU, RAM, Storage, Screen Size, ...etc).
 */
export interface VariantSpecSuggestion {
  name: string;
  popularValues: string[];
}

export function getCategoryVariantSpecSuggestions(categoryId?: string): VariantSpecSuggestion[] {
  const norm = (categoryId || "").toLowerCase();

  if (norm.includes("smartphone") || norm.includes("phone") || norm.includes("tablet")) {
    return [
      { name: "Color", popularValues: ["Black Titanium", "Natural Titanium", "Desert Titanium", "White Titanium", "Emerald Green"] },
      { name: "Processor", popularValues: ["Apple A19 Pro", "Snapdragon 8 Elite (Gen 4)", "Snapdragon 8 Gen 5", "MediaTek Dimensity 9500", "Google Tensor G5"] },
      { name: "GPU", popularValues: ["Apple A19 Pro 6-Core GPU", "Adreno 830 GPU", "Immortalis-G925 GPU"] },
      { name: "RAM", popularValues: ["8GB", "12GB", "16GB", "24GB", "32GB", "64GB"] },
      { name: "Storage", popularValues: ["128GB", "256GB", "512GB", "1TB", "2TB", "3TB", "4TB"] },
      { name: "Screen Size", popularValues: ["6.1 inches", "6.3 inches", "6.7 inches", "6.9 inches"] },
      { name: "SIM Type", popularValues: ["Single Nano SIM", "Dual SIM (Nano + eSIM)", "Dual eSIM", "eSIM Only"] }
    ];
  }

  if (norm.includes("laptop") || norm.includes("desktop") || norm.includes("electronic")) {
    return [
      { name: "Color", popularValues: ["Space Black", "Silver", "Midnight", "Starlight"] },
      { name: "Processor", popularValues: ["Apple M4 Max", "Apple M4 Pro", "Intel Core Ultra 9 (Series 2)", "AMD Ryzen AI 9 HX 370", "Snapdragon X Elite"] },
      { name: "GPU", popularValues: ["NVIDIA GeForce RTX 5090", "NVIDIA GeForce RTX 5080", "Apple M4 Max 40-Core GPU", "AMD Radeon RX 8900 XTX"] },
      { name: "RAM", popularValues: ["8GB", "16GB", "24GB", "32GB", "64GB"] },
      { name: "Storage", popularValues: ["256GB", "512GB", "1TB", "2TB", "3TB", "4TB"] },
      { name: "Screen Size", popularValues: ["13.6 inches", "14.2 inches", "15.6 inches", "16.2 inches"] }
    ];
  }

  if (norm.includes("fashion") || norm.includes("clothing") || norm.includes("shoe") || norm.includes("kid")) {
    return [
      { name: "Color", popularValues: ["Onyx Black", "Ivory White", "Saharan Beige", "Royal Emerald", "Navy Blue", "Burgundy"] },
      { name: "Size", popularValues: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "EU 38", "EU 40", "EU 42", "EU 44"] },
      { name: "Material", popularValues: ["Organic Cotton", "Pure Wool", "Linen", "Silk", "Genuine Leather", "Cashmere"] },
      { name: "Fit", popularValues: ["Regular Fit", "Slim Fit", "Relaxed Oversized", "Tailored"] }
    ];
  }

  if (norm.includes("beauty") || norm.includes("cosmetic") || norm.includes("skincare") || norm.includes("hair") || norm.includes("vitamin")) {
    return [
      { name: "Volume / Size", popularValues: ["30 ml", "50 ml", "100 ml", "200 ml", "500 ml"] },
      { name: "Skin / Hair Type", popularValues: ["All Types", "Dry / Nourishing", "Oily / Balancing", "Sensitive"] },
      { name: "Packaging", popularValues: ["Standard Bottle", "Travel Size", "Luxury Gift Box", "Eco Refill"] }
    ];
  }

  if (norm.includes("home") || norm.includes("furniture") || norm.includes("craft") || norm.includes("loom") || norm.includes("poterie")) {
    return [
      { name: "Color", popularValues: ["Natural Cream", "Ochre Red", "Indigo Blue", "Walnut Dark", "Olive Green"] },
      { name: "Dimensions", popularValues: ["Small (120x80 cm)", "Medium (160x100 cm)", "Large (200x140 cm)", "Royal (300x200 cm)"] },
      { name: "Material", popularValues: ["Pure Sheep Wool", "Solid Cedar Wood", "Atlas Oak", "Terracotta Clay", "Copper Filigree", "Genuine Leather"] }
    ];
  }

  // Universal fallback for all other categories (Food, Sports, Automotive, Jewelry, Music, etc.)
  return [
    { name: "Color", popularValues: ["Black", "White", "Silver", "Gold", "Emerald", "Blue"] },
    { name: "Size / Format", popularValues: ["Standard", "Compact", "Large", "Pro Pack", "Family Pack"] },
    { name: "RAM", popularValues: ["8GB", "16GB", "32GB", "64GB"] },
    { name: "Storage", popularValues: ["128GB", "256GB", "512GB", "1TB", "2TB", "3TB", "4TB"] },
    { name: "Material / Grade", popularValues: ["Premium Grade", "Artisanal Organic", "Heavy Duty", "925 Sterling Silver", "Carbon Fiber"] }
  ];
}

// ============================================================================
// CANONICAL VARIANT ATTRIBUTE ORDERING & STOCK/COLOR FILTERING
// Order: (Color, Size, CPU/Processor, GPU, RAM, Storage, Screen Size, ...etc)
// ============================================================================

export function isColorVariantAttributeName(name: string): boolean {
  const n = (name || "").trim().toLowerCase();
  return ["color", "colour", "colors", "couleur", "finish", "shade", "tint", "لون", "اللون"].some(
    (k) => n === k || n.includes(k)
  );
}

export function isSizeVariantAttributeName(name: string): boolean {
  const n = (name || "").trim().toLowerCase();
  if (n.includes("screen") || n.includes("display") || n.includes("écran") || n.includes("شاشة")) {
    return false;
  }
  return [
    "size",
    "sizes",
    "taille",
    "pointure",
    "shoe size",
    "clothing size",
    "dimensions",
    "dimension",
    "volume / size",
    "size / format",
    "مقاس",
    "حجم"
  ].some((k) => n === k || n.includes(k));
}

export function getVariantAttributePriority(attrName: string): number {
  const n = (attrName || "").trim().toLowerCase();
  if (!n) return 99;

  // 1. Color
  if (isColorVariantAttributeName(n)) return 1;

  // 2. Size (excluding Screen Size)
  if (isSizeVariantAttributeName(n)) return 2;

  // 3. CPU / Processor
  if (
    ["cpu", "processor", "processor / controller", "chipset", "chip", "soc", "processeur", "معالج"].some(
      (k) => n === k || n.includes(k)
    )
  ) {
    return 3;
  }

  // 4. GPU / Graphics
  if (
    ["gpu", "graphics", "graphics card", "video card", "vram", "carte graphique", "كرت الشاشة"].some(
      (k) => n === k || n.includes(k)
    )
  ) {
    return 4;
  }

  // 5. RAM / Memory
  if (
    ["ram", "ram memory", "memory", "unified memory", "mémoire", "الرام", "ذاكرة"].some(
      (k) => n === k || n.includes(k)
    )
  ) {
    return 5;
  }

  // 6. Storage / Capacity
  if (
    ["storage", "storage capacity", "capacity", "ssd", "hdd", "rom", "internal storage", "stockage", "التخزين"].some(
      (k) => n === k || n.includes(k)
    )
  ) {
    return 6;
  }

  // 7. Screen Size / Display
  if (
    ["screen size", "display size", "screen", "display", "monitor", "écran", "taille d'écran", "حجم الشاشة"].some(
      (k) => n === k || n.includes(k)
    )
  ) {
    return 7;
  }

  // 8. Refresh Rate / Resolution
  if (["refresh rate", "resolution", "panel"].some((k) => n === k || n.includes(k))) {
    return 8;
  }

  // 9. Camera
  if (["camera", "camera specs", "caméra"].some((k) => n === k || n.includes(k))) {
    return 9;
  }

  // 10. SIM / Connectivity
  if (["sim", "sim type", "network", "connectivity", "cellular"].some((k) => n === k || n.includes(k))) {
    return 10;
  }

  // 11. Operating System / OS
  if (["operating system", "os", "système"].some((k) => n === k || n.includes(k))) {
    return 11;
  }

  // 12. Battery / Power
  if (["battery", "battery capacity", "power", "wattage"].some((k) => n === k || n.includes(k))) {
    return 12;
  }

  // 13. Material / Fabric / Switch
  if (
    ["material", "materials", "material / grade", "fabric", "leather", "wood", "metal", "upper material", "sole type", "switch type", "matière", "خامة"].some(
      (k) => n === k || n.includes(k)
    )
  ) {
    return 13;
  }

  // 15. Brand (placed after physical/technical variant specs)
  if (["brand", "marque", "العلامة التجارية"].some((k) => n === k || n.includes(k))) {
    return 15;
  }

  // 14. All other category-specific variant attributes (Fit, Style, Scent, Skin Type, Volume, Packaging, etc.)
  return 14;
}

export function sortVariantOptionEntries<V>(entries: Array<[string, V]>): Array<[string, V]> {
  return [...entries].sort((a, b) => {
    const pA = getVariantAttributePriority(a[0]);
    const pB = getVariantAttributePriority(b[0]);
    return pA - pB;
  });
}

export function sortVariantAttributes<T extends { name: string; tags?: string[]; [key: string]: any }>(attrs: T[]): T[] {
  return [...attrs].sort((a, b) => {
    const pA = getVariantAttributePriority(a.name);
    const pB = getVariantAttributePriority(b.name);
    return pA - pB;
  });
}

/**
 * Detects whether a product belongs to a fashion/clothing/apparel category.
 */
export function isFashionProductCategory(category?: string, subcategory?: string, name?: string): boolean {
  const norm = `${category || ""} ${subcategory || ""} ${name || ""}`.toLowerCase();
  return (
    norm.includes("fashion") ||
    norm.includes("clothing") ||
    norm.includes("apparel") ||
    norm.includes("vetement") ||
    norm.includes("vêtement") ||
    norm.includes("mode") ||
    norm.includes("chaussure") ||
    norm.includes("shoes") ||
    norm.includes("shirt") ||
    norm.includes("chemise") ||
    norm.includes("pant") ||
    norm.includes("dress") ||
    norm.includes("robe") ||
    norm.includes("t-shirt") ||
    norm.includes("tshirt") ||
    norm.includes("قميص") ||
    norm.includes("ملابس") ||
    norm.includes("فستان") ||
    norm.includes("حذاء")
  );
}

/**
 * Attributes that must NOT be displayed as interactive variants on fashion products,
 * but rather kept down in the specifications table (About this item).
 */
export function isFashionNonVariantAttribute(attrName: string): boolean {
  const n = (attrName || "").trim().toLowerCase();
  return [
    "fit",
    "fit type",
    "coupe",
    "قَصَّة",
    "قصة",
    "season",
    "saison",
    "موسم",
    "brand",
    "marque",
    "علامة تجارية",
    "ماركة",
    "الماركة",
    "measurement unit",
    "measurement_unit",
    "measurementunit",
    "unit",
    "unité de mesure",
    "unite de mesure",
    "وحدة القياس"
  ].some((k) => n === k || n.includes(k));
}

/**
 * Identifies measurement unit attributes which should always be hidden from specifications.
 */
export function isMeasurementUnitAttribute(attrName: string): boolean {
  const n = (attrName || "").trim().toLowerCase();
  return (
    n === "measurement unit" ||
    n === "measurement_unit" ||
    n === "measurementunit" ||
    n === "unit" ||
    n === "unité de mesure" ||
    n === "unite de mesure" ||
    n === "وحدة القياس" ||
    n.includes("measurement unit")
  );
}

/**
 * Canonical ordering priority for About this item (specifications):
 * 1. Brand
 * 2. Item Type (Subcategories)
 * 3. Gender
 * 4. Material
 * 5. Fit
 * 6. Season
 * 7+. Pattern, Style, Origin, Dimensions, etc.
 */
export function getAboutItemSpecPriority(keyName: string): number {
  const n = (keyName || "").trim().toLowerCase();
  if (!n) return 999;

  // 1. Brand
  if (["brand", "marque", "ماركة", "الماركة", "علامة تجارية"].some((k) => n === k || n.includes(k))) return 1;

  // 2. Item Type / Subcategory
  if (["item type", "item_type", "type", "subcategory", "subcategories", "category", "catégorie", "نوع المنتج", "النوع"].some((k) => n === k || n.includes(k))) return 2;

  // 3. Gender
  if (["gender", "genre", "sexe", "جنس", "الجنس"].some((k) => n === k || n.includes(k))) return 3;

  // 4. Material / Fabric
  if (["material", "materials", "matière", "matériau", "fabric", "tissu", "المادة", "القماش", "خامة"].some((k) => n === k || n.includes(k))) return 4;

  // 5. Fit
  if (["fit", "fit type", "coupe", "قصة", "قَصَّة"].some((k) => n === k || n.includes(k))) return 5;

  // 6. Season
  if (["season", "saison", "موسم", "الموسم"].some((k) => n === k || n.includes(k))) return 6;

  // 7. Color / Available Colors
  if (isColorVariantAttributeName(n)) return 7;

  // 8. Model / Available Models
  if (["model", "modèle", "modele", "موديل"].some((k) => n === k || n.includes(k))) return 8;

  // 9. Size / Available Sizes
  if (isSizeVariantAttributeName(n)) return 9;

  // 10. Origin
  if (["origin", "country of origin", "origine", "بلد المنشأ"].some((k) => n === k || n.includes(k))) return 10;

  // 11. Pattern
  if (["pattern", "motif", "نقشة", "النقشة", "print"].some((k) => n === k || n.includes(k))) return 11;

  // 12. Style / Collar / Sleeve
  if (["style", "cut", "collar", "col", "sleeve", "manches"].some((k) => n === k || n.includes(k))) return 12;

  // 13. Dimensions / Care
  if (["dimension", "dimensions", "care", "entretien", "تعليمات"].some((k) => n === k || n.includes(k))) return 13;

  return 50;
}

export function formatAvailableColorsSummary(colors?: string[]): string {
  if (!colors || colors.length === 0) return "";
  const unique = Array.from(new Set(colors.map((c) => String(c).trim()).filter(Boolean)));
  if (unique.length === 0) return "";
  if (unique.length > 3) return "Multi-color";
  return unique.join(", ");
}

export function formatAvailableModelsSummary(models?: string[]): string {
  if (!models || models.length === 0) return "";
  const unique = Array.from(new Set(models.map((m) => String(m).trim()).filter(Boolean)));
  if (unique.length === 0) return "";
  if (unique.length > 3) return "Multi-model";
  return unique.join(", ");
}

export function formatAvailableSizesSummary(sizes?: string[]): string {
  if (!sizes || sizes.length === 0) return "";
  const unique = Array.from(new Set(sizes.map((s) => String(s).trim()).filter(Boolean)));
  return unique.join(", ");
}

export function filterAndSortAboutItemSpecs(
  rawSpecs: Array<{ key: string; value: string }>,
  extras?: {
    brand?: string;
    subcategory?: string;
    nonVariantOptions?: Record<string, string>;
    availableColors?: string[];
    availableSizes?: string[];
    availableModels?: string[];
  }
): Array<{ key: string; value: string }> {
  const map = new Map<string, string>();

  // Optional brand injection
  if (extras?.brand && extras.brand.trim()) {
    map.set("Brand", extras.brand.trim());
  }

  // Optional item type / subcategory injection
  if (extras?.subcategory && extras.subcategory.trim()) {
    map.set("Item Type", extras.subcategory.trim());
  }

  // Process rawSpecs (filtering out measurement unit, standalone color, and standalone size unless resolved)
  (rawSpecs || []).forEach((s) => {
    if (!s || !s.key || !s.value) return;
    const k = s.key.trim();
    const v = String(s.value).trim();
    if (!v) return;
    if (isMeasurementUnitAttribute(k)) return;
    if (isColorVariantAttributeName(k) && !extras?.availableColors) return;
    if (isSizeVariantAttributeName(k) && !extras?.availableSizes) return;

    const existingKey = Array.from(map.keys()).find((ek) => ek.toLowerCase() === k.toLowerCase());
    if (existingKey) {
      map.set(existingKey, v);
    } else {
      map.set(k, v);
    }
  });

  // Non-variant options (like Gender, Fit, Season)
  if (extras?.nonVariantOptions) {
    Object.entries(extras.nonVariantOptions).forEach(([k, val]) => {
      if (!val) return;
      const keyTrimmed = k.trim();
      const valTrimmed = String(val).trim();
      if (!valTrimmed) return;
      if (isMeasurementUnitAttribute(keyTrimmed)) return;
      if (isColorVariantAttributeName(keyTrimmed)) return;
      if (isSizeVariantAttributeName(keyTrimmed)) return;

      const existingKey = Array.from(map.keys()).find((ek) => ek.toLowerCase() === keyTrimmed.toLowerCase());
      if (existingKey) {
        map.set(existingKey, valTrimmed);
      } else {
        map.set(keyTrimmed, valTrimmed);
      }
    });
  }

  // Available Colors summary (> 3 -> "Multi-color")
  if (extras?.availableColors && extras.availableColors.length > 0) {
    const colorText = formatAvailableColorsSummary(extras.availableColors);
    if (colorText) {
      map.set("Color", colorText);
    }
  }

  // Available Models summary (> 3 -> "Multi-model")
  if (extras?.availableModels && extras.availableModels.length > 0) {
    const modelText = formatAvailableModelsSummary(extras.availableModels);
    if (modelText) {
      map.set("Model", modelText);
    }
  }

  // Available Sizes summary
  if (extras?.availableSizes && extras.availableSizes.length > 0) {
    const sizeText = formatAvailableSizesSummary(extras.availableSizes);
    if (sizeText) {
      map.set("Size", sizeText);
    }
  }

  const list = Array.from(map.entries()).map(([key, value]) => ({ key, value }));

  list.sort((a, b) => {
    const pA = getAboutItemSpecPriority(a.key);
    const pB = getAboutItemSpecPriority(b.key);
    if (pA !== pB) return pA - pB;
    return a.key.localeCompare(b.key);
  });

  return list;
}

export const YUME_COORDINATED_ACCENT_PALETTE = [
  "#4D4040", // Deep Espresso Cocoa (YUME Brand)
  "#A64B45", // Crimson Terracotta Rose (YUME Brand)
  "#A66F78", // Dusty Mauve Rose (YUME Brand)
  "#806477", // Velvet Plum Aubergine (YUME Brand)
  "#2563eb", // Blue
  "#e11d48", // Red / Rose
  "#10b981", // Green / Emerald
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#0d9488", // Teal
] as const;

export function pickRandomYumeAccentColor(): string {
  const idx = Math.floor(Math.random() * YUME_COORDINATED_ACCENT_PALETTE.length);
  return YUME_COORDINATED_ACCENT_PALETTE[idx] || "#4D4040";
}

export function hasArabicCharacters(text?: string): boolean {
  if (!text || typeof text !== "string") return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

const LEGACY_DEFAULT_SWATCH_NAMES = ["white", "black", "cream yellow", "pastel pink", "green"];

export function isLegacyUnchosenDefaultColorSet(colors?: any[]): boolean {
  if (!Array.isArray(colors) || colors.length !== 5) return false;
  return colors.every(
    (c, idx) =>
      c &&
      typeof c.name === "string" &&
      c.name.trim().toLowerCase() === LEGACY_DEFAULT_SWATCH_NAMES[idx]
  );
}

/**
 * Returns only the colors that truly exist for the product (chosen by the seller and available).
 */
export function filterExistingProductColors(params: {
  colors?: any[];
  variants?: any[];
  isBerberRugProduct?: boolean;
}): any[] {
  const { colors = [], variants = [], isBerberRugProduct = false } = params;
  const rawColors = Array.isArray(colors) ? colors.filter((c) => c && c.name && String(c.name).trim() !== "") : [];

  // Check if variants define a Color option
  const variantColorValues = new Set<string>();
  const inStockVariantColors = new Set<string>();
  let variantsHaveColorAttr = false;

  if (Array.isArray(variants) && variants.length > 0) {
    variants.forEach((v) => {
      if (v && v.options && typeof v.options === "object") {
        Object.entries(v.options).forEach(([k, val]) => {
          if (isColorVariantAttributeName(k) && val) {
            variantsHaveColorAttr = true;
            const normVal = String(val).trim().toLowerCase();
            variantColorValues.add(normVal);
            const isOut =
              Number(v.stock ?? 1) <= 0 ||
              v.availability === "out_of_stock" ||
              v.inStock === false ||
              v.available === false;
            if (!isOut) {
              inStockVariantColors.add(normVal);
            }
          }
        });
      }
    });
  }

  // If variants explicitly track Color, only display colors that exist in variants (and are in stock if any are in stock)
  if (variantsHaveColorAttr) {
    const activeSet = inStockVariantColors.size > 0 ? inStockVariantColors : variantColorValues;
    if (rawColors.length > 0) {
      const matched = rawColors.filter((c) => activeSet.has(String(c.name).trim().toLowerCase()));
      if (matched.length > 0) return matched;
    }
    return Array.from(activeSet).map((cName) => ({
      name: cName.charAt(0).toUpperCase() + cName.slice(1),
      hex: "#475569"
    }));
  }

  // Handle legacy 5-color default preset that was previously auto-populated in wizard state
  if (isLegacyUnchosenDefaultColorSet(rawColors)) {
    const customizedSwatches = rawColors.filter(
      (c) =>
        (c.imageUrl && String(c.imageUrl).trim() !== "") ||
        (Array.isArray(c.images) && c.images.filter(Boolean).length > 0) ||
        typeof c.price === "number"
    );
    if (customizedSwatches.length > 0) {
      return customizedSwatches;
    }
    // If none of the 5 legacy default swatches were customized and product has other variants, they were unchosen defaults
    if (Array.isArray(variants) && variants.length > 0) {
      return [];
    }
  }

  // Filter out any standalone color explicitly marked out of stock
  const availableColors = rawColors.filter((c) => {
    if (c.availability === "out_of_stock" || c.inStock === false || c.available === false) {
      return false;
    }
    if (c.stock !== undefined && Number(c.stock) <= 0) {
      return false;
    }
    return true;
  });

  if (availableColors.length > 0) {
    return availableColors;
  }

  if (isBerberRugProduct && rawColors.length === 0) {
    return [
      { name: "Cream White", hex: "#f5f5f4" },
      { name: "Rust & Crimson", hex: "#9a3412" },
      { name: "Indigo Blue", hex: "#1e3a8a" },
      { name: "Emerald Moss", hex: "#065f46" }
    ];
  }

  return [];
}

/**
 * Determines whether a specific option value (e.g., Size, CPU, GPU, RAM, Storage, Screen Size)
 * is out of stock so it can be automatically marked as crossed out (line-through).
 */
export function isVariantOptionValueOutOfStock(params: {
  optionName: string;
  optionValue: string;
  selectedOptions?: Record<string, string>;
  variants?: any[];
  productStock?: number;
  colors?: Array<{ name: string; stock?: number; inStock?: boolean; available?: boolean }>;
  colorStockTrackingEnabled?: boolean;
}): boolean {
  const { optionName, optionValue, selectedOptions = {}, variants = [], productStock, colors = [], colorStockTrackingEnabled } = params;
  const normOptName = (optionName || "").trim().toLowerCase();
  const normOptVal = (optionValue || "").trim().toLowerCase();

  // If checking a color option and color stock tracking is active or color has explicit stock
  if ((normOptName === "color" || normOptName === "couleur" || normOptName === "اللون" || normOptName === "shade") && Array.isArray(colors) && colors.length > 0) {
    const matchedColor = colors.find((c) => c && c.name && c.name.trim().toLowerCase() === normOptVal);
    if (matchedColor) {
      if (matchedColor.inStock === false || matchedColor.available === false) return true;
      if (matchedColor.stock !== undefined && Number(matchedColor.stock) <= 0) return true;
    }
  }

  const isRecordOut = (v: any): boolean => {
    if (!v) return true;
    if (v.availability === "out_of_stock" || v.inStock === false || v.available === false) return true;
    if (v.stock !== undefined && Number(v.stock) <= 0) return true;
    return false;
  };

  if (!Array.isArray(variants) || variants.length === 0) {
    if (productStock !== undefined && Number(productStock) <= 0) return true;
    return false;
  }

  // Check if any variant in `variants` tracks `optionName`
  const variantsTrackOption = variants.some(
    (v) =>
      v &&
      v.options &&
      Object.keys(v.options).some((k) => k.trim().toLowerCase() === normOptName)
  );

  if (!variantsTrackOption) {
    if (variants.every(isRecordOut)) return true;
    if (productStock !== undefined && Number(productStock) <= 0) return true;
    return false;
  }

  // 1. All variants that have this option value
  const withVal = variants.filter((v) => {
    if (!v || !v.options) return false;
    const entry = Object.entries(v.options).find(([k]) => k.trim().toLowerCase() === normOptName);
    return entry && String(entry[1]).trim().toLowerCase() === normOptVal;
  });

  if (withVal.length === 0 || withVal.every(isRecordOut)) {
    return true;
  }

  // 2. Direct combination match with other currently selected options
  const directMatch = withVal.find((v) => {
    return Object.entries(v.options).every(([k, vVal]) => {
      const kLower = k.trim().toLowerCase();
      if (kLower === normOptName) {
        return String(vVal).trim().toLowerCase() === normOptVal;
      }
      const selectedEntry = Object.entries(selectedOptions).find(
        ([sk]) => sk.trim().toLowerCase() === kLower
      );
      if (!selectedEntry || !selectedEntry[1]) return true;
      return String(selectedEntry[1]).trim().toLowerCase() === String(vVal).trim().toLowerCase();
    });
  });

  if (directMatch) {
    return isRecordOut(directMatch);
  }

  return false;
}

// ============================================================================
// MULTI-SELECT VARIANT MATRIX GENERATOR & REAL-TIME PRICE/IMAGE RESOLVER
// ============================================================================

export interface VariantAttributeInput {
  name: string;
  tags: string[];
}

export interface ColorSwatchInput {
  name: string;
  hex: string;
  images: string[];
  imageUrl?: string;
  isHot?: boolean;
  price?: number;
  stock?: number | "";
}

export interface GeneratedProductVariant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  availability: "in_stock" | "low_stock" | "out_of_stock";
  options: Record<string, string>;
  images: string[];
}

export function buildVariantComboKey(options: Record<string, string>): string {
  return Object.entries(options || {})
    .map(([k, v]) => `${k.trim().toLowerCase()}:${String(v).trim().toLowerCase()}`)
    .sort()
    .join("|");
}

export function generateMultiVariantMatrix(params: {
  attributes: VariantAttributeInput[];
  baseSku: string;
  basePrice: number;
  defaultStock?: number;
  existingVariants?: GeneratedProductVariant[];
  colorSwatches?: ColorSwatchInput[];
  sizePrices?: Record<string, number | undefined>;
}): GeneratedProductVariant[] {
  const {
    attributes,
    baseSku,
    basePrice,
    defaultStock = 10,
    existingVariants = [],
    colorSwatches = [],
    sizePrices = {}
  } = params;

  const validAttrs = sortVariantAttributes(
    (attributes || []).filter(
      (a) => a && a.name && a.name.trim() !== "" && Array.isArray(a.tags) && a.tags.length > 0
    )
  );

  if (validAttrs.length === 0) return [];

  const existingByKey = new Map<string, GeneratedProductVariant>();
  existingVariants.forEach((v) => {
    if (v && v.options) {
      existingByKey.set(buildVariantComboKey(v.options), v);
    }
  });

  const results: GeneratedProductVariant[] = [];

  const recurse = (index: number, currentOptions: Record<string, string>) => {
    if (index === validAttrs.length) {
      const comboKey = buildVariantComboKey(currentOptions);
      const existing = existingByKey.get(comboKey);

      const optionValues = Object.values(currentOptions);
      const skuSuffix = optionValues
        .map((v) => String(v).replace(/[^a-zA-Z0-9]/g, "").toUpperCase())
        .filter(Boolean)
        .join("-");

      // Check if color swatch or size has a specific linked price or image
      const colorValue =
        currentOptions["Color"] ||
        currentOptions["color"] ||
        currentOptions["Shade"] ||
        "";
      const sizeValue =
        currentOptions["Size"] ||
        currentOptions["size"] ||
        currentOptions["Dimensions"] ||
        "";

      const matchedSwatch = colorSwatches.find(
        (s) => s.name.trim().toLowerCase() === colorValue.trim().toLowerCase()
      );
      const matchedSizePrice = sizeValue ? sizePrices[sizeValue] : undefined;

      // Determine smart initial price for new combinations (preserving existing customized price if already set)
      let initialPrice = Number(basePrice) || 0;
      if (existing && existing.price !== undefined && existing.price > 0) {
        initialPrice = Number(existing.price);
      } else if (matchedSizePrice !== undefined && !isNaN(Number(matchedSizePrice))) {
        initialPrice = Number(matchedSizePrice);
      } else if (matchedSwatch?.price !== undefined && !isNaN(Number(matchedSwatch.price))) {
        initialPrice = Number(matchedSwatch.price);
      }

      const swatchImages =
        matchedSwatch?.images && matchedSwatch.images.length > 0
          ? [...matchedSwatch.images]
          : matchedSwatch?.imageUrl
          ? [matchedSwatch.imageUrl]
          : [];

      const mergedImages =
        existing && Array.isArray(existing.images) && existing.images.length > 0
          ? existing.images
          : swatchImages;

      const swatchStock =
        matchedSwatch?.stock !== undefined && matchedSwatch.stock !== ("" as any)
          ? Number(matchedSwatch.stock)
          : undefined;

      const variantStock =
        existing?.stock !== undefined
          ? Number(existing.stock)
          : swatchStock !== undefined
          ? swatchStock
          : defaultStock;

      const variantAvailability =
        existing?.availability || (variantStock <= 0 ? "out_of_stock" : "in_stock");

      results.push({
        id:
          existing?.id ||
          `var-${results.length + 1}-${skuSuffix.toLowerCase() || "item"}`,
        sku: existing?.sku || `${baseSku || "PROD"}-${skuSuffix || results.length + 1}`,
        price: initialPrice,
        stock: variantStock,
        availability: variantAvailability,
        options: { ...currentOptions },
        images: mergedImages
      });
      return;
    }

    const attr = validAttrs[index];
    const uniqueTags = Array.from(new Set(attr.tags.map((t) => t.trim()).filter(Boolean)));
    uniqueTags.forEach((tag) => {
      recurse(index + 1, { ...currentOptions, [attr.name.trim()]: tag });
    });
  };

  recurse(0, {});
  return results;
}

export function resolveActiveVariantSelection(params: {
  selectedOptions: Record<string, string>;
  basePrice: number;
  variants?: GeneratedProductVariant[];
  colorSwatches?: ColorSwatchInput[];
  sizePrices?: Record<string, number | undefined>;
  galleryImages?: string[];
}): {
  matchedVariant: GeneratedProductVariant | null;
  effectivePrice: number;
  effectiveImage: string;
  effectiveStock: number;
  effectiveSku: string;
} {
  const {
    selectedOptions = {},
    basePrice,
    variants = [],
    colorSwatches = [],
    sizePrices = {},
    galleryImages = []
  } = params;

  const activeGallery = galleryImages.filter((img) => img && img.trim() !== "");
  let matchedVariant: GeneratedProductVariant | null = null;

  if (variants.length > 0 && Object.keys(selectedOptions).length > 0) {
    // 1. Try exact match on all variant options
    matchedVariant =
      variants.find((v) => {
        const vOpts = v.options || {};
        return Object.entries(vOpts).every(([k, val]) => {
          const buyerChoice =
            selectedOptions[k] ??
            Object.entries(selectedOptions).find(
              ([sk]) => sk.toLowerCase() === k.toLowerCase()
            )?.[1];
          return (
            buyerChoice &&
            String(buyerChoice).trim().toLowerCase() === String(val).trim().toLowerCase()
          );
        });
      }) || null;

    // 2. Fallback: best partial match
    if (!matchedVariant) {
      let bestScore = 0;
      for (const v of variants) {
        const vOpts = v.options || {};
        let score = 0;
        for (const [k, val] of Object.entries(vOpts)) {
          const buyerChoice =
            selectedOptions[k] ??
            Object.entries(selectedOptions).find(
              ([sk]) => sk.toLowerCase() === k.toLowerCase()
            )?.[1];
          if (
            buyerChoice &&
            String(buyerChoice).trim().toLowerCase() === String(val).trim().toLowerCase()
          ) {
            score++;
          }
        }
        if (score > bestScore) {
          bestScore = score;
          matchedVariant = v;
        }
      }
    }
  }

  const chosenColor =
    selectedOptions["Color"] ||
    selectedOptions["color"] ||
    Object.entries(selectedOptions).find(([k]) => k.toLowerCase().includes("color"))?.[1] ||
    "";
  const chosenSize =
    selectedOptions["Size"] ||
    selectedOptions["size"] ||
    Object.entries(selectedOptions).find(([k]) => k.toLowerCase().includes("size"))?.[1] ||
    "";

  const matchedSwatch = chosenColor
    ? colorSwatches.find(
        (s) => s.name.trim().toLowerCase() === chosenColor.trim().toLowerCase()
      )
    : undefined;

  let effectivePrice = Number(basePrice) || 0;
  if (matchedVariant && matchedVariant.price !== undefined && matchedVariant.price > 0) {
    effectivePrice = Number(matchedVariant.price);
  } else if (chosenSize && sizePrices[chosenSize] !== undefined) {
    effectivePrice = Number(sizePrices[chosenSize]);
  } else if (matchedSwatch?.price !== undefined && matchedSwatch.price > 0) {
    effectivePrice = Number(matchedSwatch.price);
  }

  let effectiveImage = activeGallery[0] || "";
  if (matchedVariant && matchedVariant.images && matchedVariant.images.length > 0) {
    effectiveImage = matchedVariant.images[0];
  } else if (matchedSwatch) {
    effectiveImage =
      matchedSwatch.imageUrl ||
      (matchedSwatch.images && matchedSwatch.images[0]) ||
      effectiveImage;
  }

  const effectiveStock =
    matchedVariant && matchedVariant.stock !== undefined
      ? Number(matchedVariant.stock)
      : 10;

  const effectiveSku = matchedVariant?.sku || "";

  return {
    matchedVariant,
    effectivePrice,
    effectiveImage,
    effectiveStock,
    effectiveSku
  };
}

// ============================================================================
// STEP 4: AUTOMATED SHIPPING COST ENGINE (CARRIER + WILAYA + HOME/STOP DESK)
// ============================================================================

export type DeliveryMethodType = "home" | "stop_desk";

export interface WilayaRateZone {
  code: string;
  name: string;
  zone: "central" | "north" | "interior" | "south_oasis" | "deep_south";
}

export const ALGERIA_WILAYAS: WilayaRateZone[] = [
  { code: "01", name: "01 - Adrar", zone: "deep_south" },
  { code: "02", name: "02 - Chlef", zone: "north" },
  { code: "03", name: "03 - Laghouat", zone: "south_oasis" },
  { code: "04", name: "04 - Oum El Bouaghi", zone: "interior" },
  { code: "05", name: "05 - Batna", zone: "interior" },
  { code: "06", name: "06 - Béjaïa", zone: "north" },
  { code: "07", name: "07 - Biskra", zone: "south_oasis" },
  { code: "08", name: "08 - Béchar", zone: "south_oasis" },
  { code: "09", name: "09 - Blida", zone: "central" },
  { code: "10", name: "10 - Bouira", zone: "north" },
  { code: "11", name: "11 - Tamanrasset", zone: "deep_south" },
  { code: "12", name: "12 - Tébessa", zone: "interior" },
  { code: "13", name: "13 - Tlemcen", zone: "north" },
  { code: "14", name: "14 - Tiaret", zone: "interior" },
  { code: "15", name: "15 - Tizi Ouzou", zone: "north" },
  { code: "16", name: "16 - Algiers (Alger)", zone: "central" },
  { code: "17", name: "17 - Djelfa", zone: "interior" },
  { code: "18", name: "18 - Jijel", zone: "north" },
  { code: "19", name: "19 - Sétif", zone: "north" },
  { code: "20", name: "20 - Saïda", zone: "interior" },
  { code: "21", name: "21 - Skikda", zone: "north" },
  { code: "22", name: "22 - Sidi Bel Abbès", zone: "north" },
  { code: "23", name: "23 - Annaba", zone: "north" },
  { code: "24", name: "24 - Guelma", zone: "interior" },
  { code: "25", name: "25 - Constantine", zone: "north" },
  { code: "26", name: "26 - Médéa", zone: "north" },
  { code: "27", name: "27 - Mostaganem", zone: "north" },
  { code: "28", name: "28 - M'Sila", zone: "interior" },
  { code: "29", name: "29 - Mascara", zone: "interior" },
  { code: "30", name: "30 - Ouargla", zone: "south_oasis" },
  { code: "31", name: "31 - Oran", zone: "north" },
  { code: "32", name: "32 - El Bayadh", zone: "south_oasis" },
  { code: "33", name: "33 - Illizi", zone: "deep_south" },
  { code: "34", name: "34 - Bordj Bou Arréridj", zone: "north" },
  { code: "35", name: "35 - Boumerdès", zone: "central" },
  { code: "36", name: "36 - El Tarf", zone: "interior" },
  { code: "37", name: "37 - Tindouf", zone: "deep_south" },
  { code: "38", name: "38 - Tissemsilt", zone: "interior" },
  { code: "39", name: "39 - El Oued", zone: "south_oasis" },
  { code: "40", name: "40 - Khenchela", zone: "interior" },
  { code: "41", name: "41 - Souk Ahras", zone: "interior" },
  { code: "42", name: "42 - Tipaza", zone: "central" },
  { code: "43", name: "43 - Mila", zone: "interior" },
  { code: "44", name: "44 - Aïn Defla", zone: "north" },
  { code: "45", name: "45 - Naâma", zone: "south_oasis" },
  { code: "46", name: "46 - Aïn Témouchent", zone: "north" },
  { code: "47", name: "47 - Ghardaïa", zone: "south_oasis" },
  { code: "48", name: "48 - Relizane", zone: "north" },
  { code: "49", name: "49 - Timimoun", zone: "deep_south" },
  { code: "50", name: "50 - Bordj Badji Mokhtar", zone: "deep_south" },
  { code: "51", name: "51 - Ouled Djellal", zone: "south_oasis" },
  { code: "52", name: "52 - Béni Abbès", zone: "deep_south" },
  { code: "53", name: "53 - In Salah", zone: "deep_south" },
  { code: "54", name: "54 - In Guezzam", zone: "deep_south" },
  { code: "55", name: "55 - Touggourt", zone: "south_oasis" },
  { code: "56", name: "56 - Djanet", zone: "deep_south" },
  { code: "57", name: "57 - El M'Ghair", zone: "south_oasis" },
  { code: "58", name: "58 - El Meniaa", zone: "south_oasis" },
  { code: "59", name: "59 - Aflou", zone: "interior" },
  { code: "60", name: "60 - Barika", zone: "interior" },
  { code: "61", name: "61 - El Kantara", zone: "south_oasis" },
  { code: "62", name: "62 - Bir El Ater", zone: "interior" },
  { code: "63", name: "63 - El Aricha", zone: "interior" },
  { code: "64", name: "64 - Ksar Chellala", zone: "interior" },
  { code: "65", name: "65 - Ain Oussara", zone: "interior" },
  { code: "66", name: "66 - Messaad", zone: "interior" },
  { code: "67", name: "67 - Ksar El Boukhari", zone: "north" },
  { code: "68", name: "68 - Bou Saada", zone: "interior" },
  { code: "69", name: "69 - El Abiodh Sidi Cheikh", zone: "south_oasis" }
];

export interface CarrierRateTable {
  name: string;
  apiReady: boolean;
  homeRatesDzd: Record<WilayaRateZone["zone"], number>;
  stopDeskRatesDzd: Record<WilayaRateZone["zone"], number>;
  estimatedDays: Record<WilayaRateZone["zone"], string>;
}

export const CARRIER_RATE_MATRIX: Record<string, CarrierRateTable> = {
  "Yalidine Express": {
    name: "Yalidine Express",
    apiReady: true,
    homeRatesDzd: {
      central: 500,
      north: 650,
      interior: 750,
      south_oasis: 950,
      deep_south: 1350
    },
    stopDeskRatesDzd: {
      central: 350,
      north: 450,
      interior: 500,
      south_oasis: 650,
      deep_south: 950
    },
    estimatedDays: {
      central: "24h",
      north: "24h - 48h",
      interior: "2 - 3 days",
      south_oasis: "3 - 4 days",
      deep_south: "4 - 6 days"
    }
  },
  "ZR Express": {
    name: "ZR Express",
    apiReady: true,
    homeRatesDzd: {
      central: 450,
      north: 600,
      interior: 700,
      south_oasis: 900,
      deep_south: 1250
    },
    stopDeskRatesDzd: {
      central: 300,
      north: 400,
      interior: 450,
      south_oasis: 600,
      deep_south: 850
    },
    estimatedDays: {
      central: "24h",
      north: "24h - 48h",
      interior: "2 - 3 days",
      south_oasis: "3 - 4 days",
      deep_south: "4 - 5 days"
    }
  },
  "Maystro Delivery": {
    name: "Maystro Delivery",
    apiReady: true,
    homeRatesDzd: {
      central: 480,
      north: 620,
      interior: 720,
      south_oasis: 920,
      deep_south: 1300
    },
    stopDeskRatesDzd: {
      central: 320,
      north: 420,
      interior: 480,
      south_oasis: 620,
      deep_south: 900
    },
    estimatedDays: {
      central: "24h",
      north: "24h - 48h",
      interior: "2 - 3 days",
      south_oasis: "3 - 4 days",
      deep_south: "4 - 6 days"
    }
  },
  "Guex Express": {
    name: "Guex Express",
    apiReady: true,
    homeRatesDzd: {
      central: 500,
      north: 650,
      interior: 750,
      south_oasis: 950,
      deep_south: 1400
    },
    stopDeskRatesDzd: {
      central: 350,
      north: 450,
      interior: 500,
      south_oasis: 650,
      deep_south: 950
    },
    estimatedDays: {
      central: "24h",
      north: "48h",
      interior: "2 - 3 days",
      south_oasis: "3 - 5 days",
      deep_south: "5 - 7 days"
    }
  },
  "Kazitour Express": {
    name: "Kazitour Express",
    apiReady: true,
    homeRatesDzd: {
      central: 450,
      north: 580,
      interior: 680,
      south_oasis: 850,
      deep_south: 1200
    },
    stopDeskRatesDzd: {
      central: 300,
      north: 380,
      interior: 430,
      south_oasis: 550,
      deep_south: 800
    },
    estimatedDays: {
      central: "24h",
      north: "48h",
      interior: "2 - 3 days",
      south_oasis: "3 - 4 days",
      deep_south: "4 - 6 days"
    }
  },
  "FLEX Courier": {
    name: "FLEX Courier",
    apiReady: true,
    homeRatesDzd: {
      central: 520,
      north: 640,
      interior: 740,
      south_oasis: 940,
      deep_south: 1320
    },
    stopDeskRatesDzd: {
      central: 360,
      north: 440,
      interior: 490,
      south_oasis: 640,
      deep_south: 920
    },
    estimatedDays: {
      central: "24h",
      north: "48h",
      interior: "2 - 3 days",
      south_oasis: "3 - 5 days",
      deep_south: "5 - 6 days"
    }
  },
  "ColisDZ": {
    name: "ColisDZ",
    apiReady: true,
    homeRatesDzd: {
      central: 450,
      north: 600,
      interior: 700,
      south_oasis: 890,
      deep_south: 1250
    },
    stopDeskRatesDzd: {
      central: 300,
      north: 400,
      interior: 450,
      south_oasis: 590,
      deep_south: 850
    },
    estimatedDays: {
      central: "24h",
      north: "24h - 48h",
      interior: "2 - 3 days",
      south_oasis: "3 - 4 days",
      deep_south: "4 - 6 days"
    }
  },
  "Boutique Courier": {
    name: "Boutique Courier",
    apiReady: false,
    homeRatesDzd: {
      central: 400,
      north: 550,
      interior: 650,
      south_oasis: 850,
      deep_south: 1150
    },
    stopDeskRatesDzd: {
      central: 250,
      north: 350,
      interior: 400,
      south_oasis: 550,
      deep_south: 750
    },
    estimatedDays: {
      central: "Same Day / 24h",
      north: "24h - 48h",
      interior: "2 - 3 days",
      south_oasis: "3 - 5 days",
      deep_south: "5 - 7 days"
    }
  }
};

export function resolveCarrierRateTable(carrierIdOrName?: string): CarrierRateTable {
  if (!carrierIdOrName) return CARRIER_RATE_MATRIX["Yalidine Express"];
  if (CARRIER_RATE_MATRIX[carrierIdOrName]) return CARRIER_RATE_MATRIX[carrierIdOrName];

  const norm = carrierIdOrName.trim().toLowerCase();
  if (norm.includes("zr") || norm === "zr_express" || norm === "zrexpress") {
    return CARRIER_RATE_MATRIX["ZR Express"];
  }
  if (norm.includes("maystro") || norm.includes("mayestro")) {
    return CARRIER_RATE_MATRIX["Maystro Delivery"];
  }
  if (norm.includes("guex") || norm.includes("guepex")) {
    return CARRIER_RATE_MATRIX["Guex Express"];
  }
  if (norm.includes("kazitour") || norm.includes("kazi")) {
    return CARRIER_RATE_MATRIX["Kazitour Express"];
  }
  if (norm.includes("flex")) {
    return CARRIER_RATE_MATRIX["FLEX Courier"];
  }
  if (norm.includes("colisdz") || norm.includes("colis")) {
    return CARRIER_RATE_MATRIX["ColisDZ"];
  }
  if (norm.includes("boutique") || norm.includes("store_courier") || norm.includes("store courier") || norm.includes("direct")) {
    return CARRIER_RATE_MATRIX["Boutique Courier"];
  }
  return CARRIER_RATE_MATRIX["Yalidine Express"];
}

export function calculateDynamicShippingFee(params: {
  carrier: string;
  wilaya: string;
  deliveryType: DeliveryMethodType;
  currency?: string;
}): {
  fee: number;
  feeInDzd: number;
  zone: WilayaRateZone["zone"];
  estimatedDelivery: string;
  carrierName: string;
} {
  const { carrier, wilaya, deliveryType, currency = "DZD" } = params;
  const carrierTable = resolveCarrierRateTable(carrier);

  const rawWilaya = (wilaya || "").trim();
  const codeCandidate = rawWilaya.split(/[\s\-]/)[0]?.replace(/\D/g, "");
  const paddedCode = codeCandidate ? codeCandidate.padStart(2, "0") : "";

  const matchedWilaya =
    ALGERIA_WILAYAS.find(
      (w) =>
        (paddedCode && w.code === paddedCode) ||
        w.code === rawWilaya ||
        w.name.toLowerCase() === rawWilaya.toLowerCase() ||
        w.name.toLowerCase().includes(rawWilaya.toLowerCase()) ||
        (rawWilaya.toLowerCase().includes("algiers") && w.code === "16") ||
        (rawWilaya.toLowerCase().includes("bejaia") && w.code === "06")
    ) || ALGERIA_WILAYAS.find((w) => w.code === "16")!;

  const zone = matchedWilaya.zone;
  const feeInDzd =
    deliveryType === "stop_desk"
      ? carrierTable.stopDeskRatesDzd[zone]
      : carrierTable.homeRatesDzd[zone];

  const currencyCfg = WIZARD_CURRENCIES.find(
    (c) => c.code.toUpperCase() === (currency || "DZD").toUpperCase()
  );
  const rate = currencyCfg ? currencyCfg.rateFromDzd : 1;
  const convertedFee =
    currency.toUpperCase() === "DZD"
      ? feeInDzd
      : Math.max(1, Math.round(feeInDzd * rate * 100) / 100);

  return {
    fee: convertedFee,
    feeInDzd,
    zone,
    estimatedDelivery: carrierTable.estimatedDays[zone],
    carrierName: carrierTable.name
  };
}

// ============================================================================
// STEP 1 - 4 STRICT VALIDATION RULES
// ============================================================================

export function validateStep1Identity(params: {
  title?: string;
  sku?: string;
  description?: string;
}): { valid: boolean; error?: string } {
  if (!params.title || !params.title.trim()) {
    return { valid: false, error: "⚠️ Product title (*) is required and cannot be empty." };
  }
  if (!params.sku || !params.sku.trim()) {
    return { valid: false, error: "⚠️ SKU code (*) is required and cannot be empty." };
  }
  if (!params.description || !params.description.trim()) {
    return { valid: false, error: "⚠️ Product description (*) is required and cannot be empty." };
  }
  return { valid: true };
}

export function validateStep2Media(params: {
  images: string[];
  maxImages?: number;
}): { valid: boolean; error?: string; activeCount: number } {
  const maxAllowed = params.maxImages || 10;
  const activeImages = (params.images || []).filter((img) => img && img.trim() !== "");
  if (activeImages.length < 1) {
    return {
      valid: false,
      error: "⚠️ At least 1 uploaded product image (*) is required before proceeding to Step 3.",
      activeCount: 0
    };
  }
  if (activeImages.length > maxAllowed) {
    return {
      valid: false,
      error: `⚠️ Maximum of ${maxAllowed} images allowed in the Boutique Gallery.`,
      activeCount: activeImages.length
    };
  }
  return { valid: true, activeCount: activeImages.length };
}

// ============================================================================
// STEP 5: COD DIRECT ORDER FORM VALIDATION & SUMMARY CALCULATOR
// ============================================================================

export function validateCodPhone(phone: string): boolean {
  const cleaned = (phone || "").replace(/[\s\-().]/g, "");
  // Matches Algerian mobile/landline (05/06/07/02/03/04... or +213...) or international E.164 (8-15 digits)
  return /^(\+?213|0)(5|6|7|2|3|4)\d{8}$/.test(cleaned) || /^\+?\d{8,15}$/.test(cleaned);
}

export function validateCodOrderForm(params: {
  fullName: string;
  phone: string;
  wilaya: string;
  communeAddress: string;
  deliveryType: DeliveryMethodType;
}): { valid: boolean; error?: string } {
  if (!params.fullName || params.fullName.trim().length < 2) {
    return { valid: false, error: "Please enter your full name." };
  }
  if (!params.phone || !validateCodPhone(params.phone)) {
    return {
      valid: false,
      error: "Please enter a valid phone number (e.g., 0550 12 34 56 or +213...)."
    };
  }
  if (!params.wilaya || !params.wilaya.trim()) {
    return { valid: false, error: "Please select your State / Wilaya / City." };
  }
  if (!params.communeAddress || params.communeAddress.trim().length < 3) {
    return { valid: false, error: "Please enter your Commune / Detailed Address." };
  }
  return { valid: true };
}

export function calculateCodOrderSummary(params: {
  variantPrice: number;
  discountEnabled?: boolean;
  discountPercent?: number;
  quantity?: number;
  carrier: string;
  wilaya: string;
  deliveryType: DeliveryMethodType;
  currency?: string;
}): {
  unitBasePrice: number;
  unitFinalPrice: number;
  subtotal: number;
  shippingFee: number;
  totalFinalPrice: number;
  currencySymbol: string;
  estimatedDelivery: string;
} {
  const {
    variantPrice,
    discountEnabled = false,
    discountPercent = 0,
    quantity = 1,
    carrier,
    wilaya,
    deliveryType,
    currency = "DZD"
  } = params;

  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const unitBasePrice = Math.max(0, Number(variantPrice) || 0);
  const unitFinalPrice =
    discountEnabled && discountPercent > 0
      ? Math.round(unitBasePrice * (1 - Math.min(95, Math.max(0, discountPercent)) / 100))
      : unitBasePrice;

  const subtotal = Math.round(unitFinalPrice * qty * 100) / 100;
  const shippingCalc = calculateDynamicShippingFee({
    carrier,
    wilaya,
    deliveryType,
    currency
  });

  const totalFinalPrice = Math.round((subtotal + shippingCalc.fee) * 100) / 100;

  return {
    unitBasePrice,
    unitFinalPrice,
    subtotal,
    shippingFee: shippingCalc.fee,
    totalFinalPrice,
    currencySymbol: getCurrencySymbol(currency),
    estimatedDelivery: shippingCalc.estimatedDelivery
  };
}

// ============================================================================
// STEP 5: AUTOMATED STANDALONE AD LANDING PAGE HTML GENERATOR
// ============================================================================

export function generateStandaloneAdLandingPageHtml(params: {
  title: string;
  sku: string;
  category: string;
  description: string;
  technicalDescription?: string;
  seoKeywords?: string;
  currency: string;
  basePrice: number;
  discountEnabled: boolean;
  discountPercent: number;
  carrier: string;
  brandColor: string;
  images: string[];
  videoLinks: string[];
  specs: Array<{ key: string; value: string }>;
  variants: GeneratedProductVariant[];
  colorSwatches: ColorSwatchInput[];
  sizes: string[];
  sizePrices: Record<string, number | undefined>;
  storyEnabled: boolean;
  storySections: Array<{ id?: string; url?: string; image?: string; description?: string }>;
  facebookPixelId?: string;
  tiktokPixelId?: string;
}): string {
  const {
    title,
    sku,
    category,
    description,
    technicalDescription = "",
    seoKeywords = "",
    currency = "DZD",
    basePrice,
    discountEnabled,
    discountPercent,
    carrier,
    brandColor = "#0b2447",
    images = [],
    videoLinks = [],
    specs = [],
    variants = [],
    colorSwatches = [],
    sizes = [],
    sizePrices = {},
    storyEnabled = false,
    storySections = [],
    facebookPixelId = "",
    tiktokPixelId = ""
  } = params;

  const currencySymbol = getCurrencySymbol(currency);
  const activeImages = images.filter(Boolean);
  const coverImage =
    activeImages[0] ||
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80";

  const finalBasePrice =
    discountEnabled && discountPercent > 0
      ? Math.round(basePrice * (1 - discountPercent / 100))
      : basePrice;

  const serializedPayload = JSON.stringify({
    title,
    sku,
    currency,
    currencySymbol,
    basePrice,
    finalBasePrice,
    discountEnabled,
    discountPercent,
    carrier,
    images: activeImages,
    variants,
    colorSwatches,
    sizes,
    sizePrices,
    wilayas: ALGERIA_WILAYAS,
    carrierRates: CARRIER_RATE_MATRIX[carrier] || CARRIER_RATE_MATRIX["Yalidine Express"]
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title.replace(/</g, "&lt;")} - Official COD Offer</title>
  <meta name="description" content="${description.replace(/"/g, "&quot;").slice(0, 160)}" />
  <meta name="keywords" content="${seoKeywords.replace(/"/g, "&quot;")}" />
  ${
    facebookPixelId
      ? `<!-- Facebook Pixel Code --><script>window.fbq=window.fbq||function(){(window.fbq.q=window.fbq.q||[]).push(arguments)};fbq('init','${facebookPixelId}');fbq('track','PageView');fbq('track','ViewContent',{content_name:'${title.replace(/'/g, "\\'")}',content_ids:['${sku}'],value:${finalBasePrice},currency:'${currency}'});</script>`
      : ""
  }
  ${
    tiktokPixelId
      ? `<!-- TikTok Pixel Code --><script>window.ttq=window.ttq||[];/* TikTok Pixel: ${tiktokPixelId} */</script>`
      : ""
  }
  <style>
    * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    body { margin: 0; background: #f8fafc; color: #0f172a; }
    .container { max-width: 1020px; margin: 0 auto; padding: 24px 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
    @media (max-width: 768px) { .container { grid-template-columns: 1fr; } }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px; box-shadow: 0 4px 16px rgba(15,23,42,0.04); }
    .btn-primary { width: 100%; padding: 14px 20px; border: none; border-radius: 12px; background: ${brandColor}; color: #fff; font-weight: 800; font-size: 15px; cursor: pointer; }
    .input { width: 100%; padding: 11px 13px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 13px; margin-top: 4px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <img id="lp-main-img" src="${coverImage}" alt="${title.replace(/"/g, "&quot;")}" style="width:100%;border-radius:12px;object-fit:cover;max-height:440px;" />
      <h1 style="font-size:22px;margin:16px 0 6px;">${title.replace(/</g, "&lt;")}</h1>
      <p style="font-size:12px;color:#64748b;margin:0 0 12px;">SKU: ${sku} • Category: ${category}</p>
      <p style="font-size:14px;line-height:1.6;color:#334155;">${description.replace(/</g, "&lt;")}</p>
      ${technicalDescription ? `<p style="font-size:13px;color:#475569;">${technicalDescription.replace(/</g, "&lt;")}</p>` : ""}
      ${
        videoLinks.length > 0
          ? `<div style="margin-top:12px;font-size:12px;"><strong>Watch Product Reels:</strong> ${videoLinks
              .map((v) => `<a href="${v}" target="_blank" rel="noopener noreferrer" style="margin-right:8px;color:${brandColor};">${v}</a>`)
              .join("")}</div>`
          : ""
      }
      ${
        specs.length > 0
          ? `<div style="margin-top:16px;border-top:1px solid #e2e8f0;padding-top:12px;"><strong>Specifications:</strong><ul style="font-size:13px;color:#334155;padding-left:18px;">${specs
              .map((s) => `<li><strong>${s.key}:</strong> ${s.value}</li>`)
              .join("")}</ul></div>`
          : ""
      }
      ${
        storyEnabled && storySections.length > 0
          ? `<div style="margin-top:18px;border-top:1px solid #e2e8f0;padding-top:14px;"><strong>Product Story:</strong>${storySections
              .map(
                (st) =>
                  `<div style="margin-top:10px;"><img src="${st.url || st.image || ""}" style="width:100%;border-radius:10px;" />${
                    st.description ? `<p style="font-size:12px;color:#475569;">${st.description}</p>` : ""
                  }</div>`
              )
              .join("")}</div>`
          : ""
      }
    </div>
    <div class="card">
      <h2 style="margin-top:0;font-size:18px;">Direct Cash on Delivery (COD) Order Form</h2>
      <div id="lp-price-banner" style="font-size:24px;font-weight:900;color:${brandColor};margin-bottom:14px;">
        ${finalBasePrice.toLocaleString()} ${currencySymbol}
      </div>
      <label style="font-size:12px;font-weight:700;">Full Name *</label>
      <input id="cod-name" class="input" placeholder="Enter your full name" required />
      <label style="font-size:12px;font-weight:700;">Phone Number *</label>
      <input id="cod-phone" class="input" placeholder="0550 12 34 56" required />
      <label style="font-size:12px;font-weight:700;">State / Wilaya / City *</label>
      <select id="cod-wilaya" class="input">
        ${ALGERIA_WILAYAS.map((w) => `<option value="${w.name}">${w.name}</option>`).join("")}
      </select>
      <label style="font-size:12px;font-weight:700;">Commune / Detailed Address *</label>
      <input id="cod-address" class="input" placeholder="Commune, street, building..." required />
      <button type="button" class="btn-primary" onclick="if(window.fbq)fbq('track','Purchase',{value:${finalBasePrice},currency:'${currency}'});">Confirm COD Order (${currencySymbol})</button>
    </div>
  </div>
  <script>window.__YUME_LANDING_DATA__ = ${serializedPayload};</script>
</body>
</html>`;
}

/**
 * Resolves the baseline display price of a product even when no variant is selected.
 * Prioritizes direct price, then first positive variant price, size price, or color price.
 * Ensures consistent price display between Homepage, Store Profile, and Sell Product Page.
 */
export function getProductBasePrice(product: any): number {
  if (!product) return 1500;

  // 1. Direct valid price on product
  const direct = Number(product.price);
  if (!isNaN(direct) && direct > 0) {
    return direct;
  }

  // 2. Variants array - first variant with a positive price
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const vWithPrice = product.variants.find(
      (v: any) => v && typeof v.price === "number" && !isNaN(v.price) && v.price > 0
    );
    if (vWithPrice) {
      return Number(vWithPrice.price);
    }
  }

  // 3. sizesWithPrices array
  if (Array.isArray(product.sizesWithPrices) && product.sizesWithPrices.length > 0) {
    const sWithPrice = product.sizesWithPrices.find(
      (s: any) => s && typeof s.price === "number" && !isNaN(s.price) && s.price > 0
    );
    if (sWithPrice) {
      return Number(sWithPrice.price);
    }
  }

  // 4. sizePrices record
  if (product.sizePrices && typeof product.sizePrices === "object") {
    const val = Object.values(product.sizePrices).find(
      (p: any) => typeof p === "number" && !isNaN(p) && p > 0
    );
    if (typeof val === "number") {
      return Number(val);
    }
  }

  // 5. colors swatches array
  if (Array.isArray(product.colors) && product.colors.length > 0) {
    const cWithPrice = product.colors.find(
      (c: any) => c && typeof c.price === "number" && !isNaN(c.price) && c.price > 0
    );
    if (cWithPrice) {
      return Number(cWithPrice.price);
    }
  }

  // 6. Base / Original price properties
  const base = Number(product.basePrice);
  if (!isNaN(base) && base > 0) {
    return base;
  }
  const orig = Number(product.originalPrice);
  if (!isNaN(orig) && orig > 0) {
    return orig;
  }

  return 1500;
}

// ============================================================================
// UNIVERSAL CATEGORY-AWARE SIZE & OPTION CONFIGURATION RESOLVER
// ============================================================================

export interface CategorySmartSizeSystem {
  id: string;
  label: string;
  sizes: string[];
}

export interface CategorySmartSizeConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  badgeLabel: string;
  columnHeaderLabel: string;
  placeholder: string;
  systems: CategorySmartSizeSystem[];
  allPresets: string[];
}

export function getCategorySmartSizeConfig(params: {
  mainCategoryId?: string;
  subcategoryId?: string;
  templateSizeSystem?: { enabled?: boolean; label?: string; sizes?: string[] };
}): CategorySmartSizeConfig {
  const mainId = (params.mainCategoryId || "").toLowerCase().trim();
  const subId = (params.subcategoryId || "").toLowerCase().trim();
  const combined = `${mainId} ${subId}`;

  const cleanTemplateSizes = (params.templateSizeSystem?.sizes || []).filter(
    (s) => s && !s.toLowerCase().includes("custom")
  );

  // 1. BABY CLOTHING & BABY ESSENTIALS
  if (
    subId.includes("baby") ||
    combined.includes("newborn") ||
    combined.includes("infant") ||
    subId === "kids_baby_clothing" ||
    subId === "kids_baby_essentials" ||
    subId === "health_beauty_babycare"
  ) {
    const systems: CategorySmartSizeSystem[] = [
      {
        id: "baby_months",
        label: "Baby Age (Newborn – 24M)",
        sizes: ["Newborn", "0–3M", "3–6M", "6–9M", "9–12M", "12–18M", "18–24M", "24–36M"],
      },
      {
        id: "baby_height",
        label: "Height (cm)",
        sizes: ["50 cm", "56 cm", "62 cm", "68 cm", "74 cm", "80 cm", "86 cm", "92 cm"],
      },
    ];
    return {
      sectionTitle: "Baby Size & Age Configuration",
      sectionSubtitle: "Select age-appropriate baby and infant sizing options for this product.",
      badgeLabel: "Baby Sizing (Newborn – 24M)",
      columnHeaderLabel: "Baby Size",
      placeholder: "Add custom baby size (e.g., Premature, 2–3 Years)",
      systems,
      allPresets: Array.from(new Set([...systems.flatMap((s) => s.sizes), ...cleanTemplateSizes])),
    };
  }

  // 2. KIDS SHOES
  if (subId === "kids_shoes" || (combined.includes("kid") && combined.includes("shoe"))) {
    const systems: CategorySmartSizeSystem[] = [
      {
        id: "eu_kids",
        label: "EU Kids (19–35)",
        sizes: [
          "EU 19", "EU 20", "EU 21", "EU 22", "EU 23", "EU 24", "EU 25", "EU 26",
          "EU 27", "EU 28", "EU 29", "EU 30", "EU 31", "EU 32", "EU 33", "EU 34", "EU 35",
        ],
      },
      {
        id: "us_kids",
        label: "US Kids (4–13)",
        sizes: [
          "US Kids 4", "US Kids 5", "US Kids 6", "US Kids 7", "US Kids 8",
          "US Kids 9", "US Kids 10", "US Kids 11", "US Kids 12", "US Kids 13",
        ],
      },
      {
        id: "uk_kids",
        label: "UK Kids (3–12)",
        sizes: [
          "UK Kids 3", "UK Kids 4", "UK Kids 5", "UK Kids 6", "UK Kids 7",
          "UK Kids 8", "UK Kids 9", "UK Kids 10", "UK Kids 11", "UK Kids 12",
        ],
      },
    ];
    return {
      sectionTitle: "Kids Shoe Size Configuration",
      sectionSubtitle: "Select numerical footwear sizes across EU, US, or UK kids shoe systems.",
      badgeLabel: "Kids Footwear Sizes",
      columnHeaderLabel: "Shoe Size",
      placeholder: "Add custom kids shoe size (e.g., EU 26.5, Toddler 5)",
      systems,
      allPresets: Array.from(new Set(systems.flatMap((s) => s.sizes))),
    };
  }

  // 3. ADULT SHOES & FOOTWEAR
  if (subId === "fashion_shoes" || combined.includes("shoe") || combined.includes("footwear")) {
    const systems: CategorySmartSizeSystem[] = [
      {
        id: "eu_shoes",
        label: "EU Sizes (35–46)",
        sizes: [
          "EU 35", "EU 36", "EU 37", "EU 38", "EU 39", "EU 40",
          "EU 41", "EU 42", "EU 43", "EU 44", "EU 45", "EU 46",
        ],
      },
      {
        id: "us_shoes",
        label: "US Sizes (5–13)",
        sizes: ["US 5", "US 6", "US 7", "US 8", "US 9", "US 10", "US 11", "US 12", "US 13"],
      },
      {
        id: "uk_shoes",
        label: "UK Sizes (4–12)",
        sizes: ["UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"],
      },
    ];
    return {
      sectionTitle: "Shoe Size Configuration",
      sectionSubtitle: "Choose actual footwear sizing systems and numerical shoe sizes for buyers.",
      badgeLabel: "Footwear Sizing (EU / US / UK)",
      columnHeaderLabel: "Shoe Size",
      placeholder: "Add custom shoe size (e.g., EU 42.5, US 10.5 Wide)",
      systems,
      allPresets: Array.from(new Set(systems.flatMap((s) => s.sizes))),
    };
  }

  // 4. KIDS CLOTHING
  if (subId === "kids_clothing" || (mainId === "kids" && !subId.includes("toy") && !subId.includes("accessories"))) {
    const systems: CategorySmartSizeSystem[] = [
      {
        id: "kids_years",
        label: "Age by Year (2–16Y)",
        sizes: [
          "2 Years", "3 Years", "4 Years", "5 Years", "6 Years", "7 Years", "8 Years",
          "9 Years", "10 Years", "11 Years", "12 Years", "13 Years", "14 Years", "15 Years", "16 Years",
        ],
      },
      {
        id: "kids_ranges",
        label: "Age Ranges",
        sizes: ["2–3Y", "4–5Y", "6–7Y", "8–9Y", "10–11Y", "12–13Y", "14–16Y"],
      },
    ];
    return {
      sectionTitle: "Kids Clothing Size Configuration",
      sectionSubtitle: "Select age-based clothing sizes tailored for children and teens.",
      badgeLabel: "Kids Age Sizing (2 – 16 Years)",
      columnHeaderLabel: "Kids Size",
      placeholder: "Add custom kids size (e.g., 122 cm, 134 cm)",
      systems,
      allPresets: Array.from(new Set(systems.flatMap((s) => s.sizes))),
    };
  }

  // 5. ABAYAS
  if (subId === "fashion_abayas" || combined.includes("abaya")) {
    const systems: CategorySmartSizeSystem[] = [
      {
        id: "abaya_length",
        label: "Abaya Length (50–62)",
        sizes: ["Length 50", "Length 52", "Length 54", "Length 56", "Length 58", "Length 60", "Length 62"],
      },
      {
        id: "abaya_letters",
        label: "Standard Letter (S–3XL)",
        sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
      },
    ];
    return {
      sectionTitle: "Abaya Size & Length Configuration",
      sectionSubtitle: "Select traditional abaya length measurements or standard modest apparel sizes.",
      badgeLabel: "Abaya Sizing (Length 50–62 / S–3XL)",
      columnHeaderLabel: "Size / Length",
      placeholder: "Add custom abaya size (e.g., Length 55 Free Size)",
      systems,
      allPresets: Array.from(new Set(systems.flatMap((s) => s.sizes))),
    };
  }

  // 6. TROUSERS & JEANS
  if (subId === "fashion_trousers" || combined.includes("trouser") || combined.includes("pant")) {
    const systems: CategorySmartSizeSystem[] = [
      {
        id: "trouser_letters",
        label: "Letter Sizes (XS–3XL)",
        sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
      },
      {
        id: "trouser_eu",
        label: "EU Sizes (34–48)",
        sizes: ["EU 34", "EU 36", "EU 38", "EU 40", "EU 42", "EU 44", "EU 46", "EU 48"],
      },
      {
        id: "trouser_waist",
        label: "Waist Inches (W28–W40)",
        sizes: ["W28", "W30", "W32", "W34", "W36", "W38", "W40"],
      },
    ];
    return {
      sectionTitle: "Trouser & Waist Size Configuration",
      sectionSubtitle: "Select letter sizes, European trouser numbers, or waist inch measurements.",
      badgeLabel: "Trouser & Waist Sizing",
      columnHeaderLabel: "Size",
      placeholder: "Add custom trouser size (e.g., W32 L30, EU 40 Tall)",
      systems,
      allPresets: Array.from(new Set(systems.flatMap((s) => s.sizes))),
    };
  }

  // 7. JEWELRY, RINGS & WATCHES
  if (
    subId === "fashion_jewelry" ||
    subId === "fashion_watches" ||
    combined.includes("jewelry") ||
    combined.includes("ring") ||
    combined.includes("watch")
  ) {
    const systems: CategorySmartSizeSystem[] = [
      {
        id: "ring_us",
        label: "Ring Sizes (US 5–12)",
        sizes: ["Ring 5", "Ring 6", "Ring 7", "Ring 8", "Ring 9", "Ring 10", "Ring 11", "Ring 12", "Adjustable"],
      },
      {
        id: "ring_eu",
        label: "EU Ring (49–64)",
        sizes: ["EU 49", "EU 52", "EU 54", "EU 57", "EU 59", "EU 62", "EU 64"],
      },
      {
        id: "chain_watch",
        label: "Bracelet / Chain / Case",
        sizes: ["Small", "Medium", "Large", "One Size", "40 cm", "45 cm", "50 cm", "38mm", "42mm", "44mm"],
      },
    ];
    return {
      sectionTitle: "Ring, Chain & Case Size Configuration",
      sectionSubtitle: "Choose ring sizes, necklace/bracelet lengths, or watch case diameters.",
      badgeLabel: "Jewelry & Watch Sizing",
      columnHeaderLabel: "Size / Format",
      placeholder: "Add custom ring or chain size (e.g., US 6.5, 55 cm)",
      systems,
      allPresets: Array.from(new Set(systems.flatMap((s) => s.sizes))),
    };
  }

  // 8. HATS, CAPS, BAGS & ACCESSORIES
  if (
    subId === "fashion_hats_caps" ||
    subId === "fashion_bags" ||
    subId === "kids_accessories" ||
    combined.includes("hat") ||
    combined.includes("bag")
  ) {
    const systems: CategorySmartSizeSystem[] = [
      {
        id: "accessory_sizes",
        label: "Accessory & Headwear Sizes",
        sizes: ["One Size", "Adjustable", "S/M", "L/XL", "Small", "Medium", "Large"],
      },
      {
        id: "head_cm",
        label: "Head Circumference / Capacity",
        sizes: ["54 cm", "56 cm", "58 cm", "60 cm", "Mini (5L)", "Daypack (15L)", "Travel (30L)"],
      },
    ];
    return {
      sectionTitle: "Accessory Size & Capacity Configuration",
      sectionSubtitle: "Select headwear fit options, bag dimensions, or universal accessory sizes.",
      badgeLabel: "Accessory & Bag Sizing",
      columnHeaderLabel: "Size / Format",
      placeholder: "Add custom size or dimension (e.g., 25×18 cm, Fitted 7 1/4)",
      systems,
      allPresets: Array.from(new Set(systems.flatMap((s) => s.sizes))),
    };
  }

  // 9. ADULT CLOTHING (Men, Women, Dresses, Shorts, General Fashion)
  if (mainId === "fashion" || combined.includes("clothing") || combined.includes("dress") || combined.includes("short")) {
    const systems: CategorySmartSizeSystem[] = [
      {
        id: "apparel_letters",
        label: "Apparel Letters (XS–4XL)",
        sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "One Size"],
      },
      {
        id: "apparel_eu",
        label: "EU Numeric (34–48)",
        sizes: ["EU 34", "EU 36", "EU 38", "EU 40", "EU 42", "EU 44", "EU 46", "EU 48"],
      },
    ];
    return {
      sectionTitle: "Clothing Size Configuration",
      sectionSubtitle: "Select the apparel sizes available for this garment so buyers can pick their fit.",
      badgeLabel: "Apparel Sizing (XS – 4XL)",
      columnHeaderLabel: "Size",
      placeholder: "Add custom size (e.g., 5XL, Petite S, Tall L)",
      systems,
      allPresets: Array.from(new Set(systems.flatMap((s) => s.sizes))),
    };
  }

  // 10. ELECTRONICS & COMPUTERS
  if (mainId === "electronics" || combined.includes("smartphone") || combined.includes("laptop") || combined.includes("tablet") || combined.includes("gaming")) {
    const systems: CategorySmartSizeSystem[] = [
      {
        id: "storage_only",
        label: "Storage Capacity",
        sizes: ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"],
      },
      {
        id: "ram_storage",
        label: "RAM + Storage",
        sizes: ["8GB / 128GB", "8GB / 256GB", "12GB / 256GB", "12GB / 512GB", "16GB / 512GB", "16GB / 1TB", "32GB / 1TB"],
      },
      {
        id: "tech_editions",
        label: "Edition / Connectivity",
        sizes: ["Standard", "Pro Edition", "Wi-Fi", "Wi-Fi + 5G", "Wireless", "Wired USB-C"],
      },
    ];
    return {
      sectionTitle: "Storage, Capacity & Tech Options",
      sectionSubtitle: "Select storage capacities, RAM configurations, or hardware editions offered for this product.",
      badgeLabel: "Storage & RAM Configurations",
      columnHeaderLabel: "Capacity / Option",
      placeholder: "Add custom configuration (e.g., 24GB / 1TB SSD, 15.6-inch)",
      systems,
      allPresets: Array.from(new Set(systems.flatMap((s) => s.sizes))),
    };
  }

  // 11. HEALTH & BEAUTY (Cosmetics, Skincare, Haircare, Vitamins, Medical)
  if (mainId === "health_beauty" || combined.includes("cosmetic") || combined.includes("skincare") || combined.includes("beauty") || combined.includes("vitamin")) {
    const isVitamins = subId.includes("vitamin") || subId.includes("medical");
    const systems: CategorySmartSizeSystem[] = isVitamins
      ? [
          {
            id: "pill_count",
            label: "Count / Pack Size",
            sizes: ["30 Count", "60 Count", "90 Count", "120 Count", "180 Count", "Single Pack", "Twin Pack"],
          },
          {
            id: "medical_sizes",
            label: "Standard Sizes",
            sizes: ["Small", "Medium", "Large", "Standard Box", "Clinical Pack"],
          },
        ]
      : [
          {
            id: "volume_ml",
            label: "Volume (ml)",
            sizes: ["15ml", "30ml", "50ml", "75ml", "100ml", "150ml", "200ml", "250ml", "500ml"],
          },
          {
            id: "beauty_formats",
            label: "Weight & Formats",
            sizes: ["Travel Size", "Standard Size", "Full Size", "Refill Pouch", "50g", "100g", "250g"],
          },
        ];
    return {
      sectionTitle: "Volume, Weight & Pack Options",
      sectionSubtitle: "Select bottle volumes, net weights, or capsule counts available for this product.",
      badgeLabel: isVitamins ? "Count & Pack Sizing" : "Volume & Packaging (ml / g)",
      columnHeaderLabel: "Volume / Pack",
      placeholder: "Add custom volume or pack (e.g., 125ml Eau de Parfum, 3-Pack)",
      systems,
      allPresets: Array.from(new Set(systems.flatMap((s) => s.sizes))),
    };
  }

  // 12. HOME & LIVING / ARTS & CRAFTS
  if (mainId === "home_living" || mainId === "arts_crafts" || combined.includes("furniture") || combined.includes("loom") || combined.includes("poterie")) {
    const systems: CategorySmartSizeSystem[] = [
      {
        id: "home_formats",
        label: "Standard Formats",
        sizes: ["Small", "Medium", "Standard", "Large", "Extra Large", "Single Piece", "Full Set"],
      },
      {
        id: "dimensions_cm",
        label: "Dimensions (cm)",
        sizes: ["120×60 cm", "160×80 cm", "200×100 cm", "120×180 cm (Rug)", "160×230 cm (Rug)", "200×300 cm (Rug)"],
      },
    ];
    return {
      sectionTitle: "Dimensions & Format Configuration",
      sectionSubtitle: "Choose spatial dimensions, rug/furniture measurements, or artisan format options.",
      badgeLabel: "Dimensions & Formats",
      columnHeaderLabel: "Dimension / Format",
      placeholder: "Add custom dimension or format (e.g., 150×240 cm, 6-Piece Set)",
      systems,
      allPresets: Array.from(new Set([...systems.flatMap((s) => s.sizes), ...cleanTemplateSizes])),
    };
  }

  // 13. FOOD & BEVERAGES
  if (mainId === "food_beverages" || combined.includes("food") || combined.includes("organic")) {
    const systems: CategorySmartSizeSystem[] = [
      {
        id: "food_weight",
        label: "Net Weight (g / kg)",
        sizes: ["100g", "250g", "500g", "1kg", "2kg", "5kg"],
      },
      {
        id: "food_volume",
        label: "Volume & Packaging",
        sizes: ["250ml Bottle", "500ml Bottle", "1L Bottle", "Gift Box", "Family Pack"],
      },
    ];
    return {
      sectionTitle: "Portion, Weight & Packaging Options",
      sectionSubtitle: "Select net weights, bottle volumes, or harvest pack sizes offered to customers.",
      badgeLabel: "Weight & Portion Options",
      columnHeaderLabel: "Weight / Pack",
      placeholder: "Add custom weight or portion (e.g., 750g Glass Jar, 10kg Crate)",
      systems,
      allPresets: Array.from(new Set(systems.flatMap((s) => s.sizes))),
    };
  }

  // 14. SPORTS, TOYS & AUTOMOTIVE / DEFAULT FALLBACK
  const systems: CategorySmartSizeSystem[] = [
    {
      id: "general_options",
      label: "Sizes & Configurations",
      sizes:
        cleanTemplateSizes.length > 0
          ? cleanTemplateSizes
          : ["Small", "Medium", "Large", "XL", "Standard", "Pro Kit", "Single Unit", "Multi-Pack"],
    },
  ];
  return {
    sectionTitle: "Size & Configuration Options",
    sectionSubtitle: "Select the available sizes, formats, or package configurations for this product.",
    badgeLabel: params.templateSizeSystem?.label || "Size & Format Options",
    columnHeaderLabel: "Size / Option",
    placeholder: "Add custom size or configuration (e.g., Heavy Duty, 2-Piece Set)",
    systems,
    allPresets: Array.from(new Set(systems.flatMap((s) => s.sizes))),
  };
}

// ============================================================================
// VARIANT-ACCURATE STOCK CHECK & ORDER DEDUCTION ENGINE
// ============================================================================

/**
 * Extracts selected Color and Size/Option from an order/cart item's `variantOptions` or bracketed title
 * (e.g. "Hand-Knotted Jacket [Black / M]" or `{ Color: "Black", Size: "M" }`).
 */
export function extractOrderedVariantChoices(params: {
  variantOptions?: Record<string, string>;
  itemName?: string;
}): { color?: string; size?: string; rawMap: Record<string, string> } {
  const { variantOptions, itemName = "" } = params;
  const rawMap: Record<string, string> = {};
  let color: string | undefined;
  let size: string | undefined;

  if (variantOptions && typeof variantOptions === "object") {
    Object.entries(variantOptions).forEach(([k, v]) => {
      if (!v) return;
      const valStr = String(v).trim();
      if (!valStr) return;
      rawMap[k.trim()] = valStr;
      if (isColorVariantAttributeName(k)) {
        color = valStr;
      } else if (isSizeVariantAttributeName(k)) {
        size = valStr;
      }
    });
  }

  // Also parse bracketed suffix `[Color / Size]` from cart item names if not explicitly provided
  if ((!color && !size) && itemName.includes("[") && itemName.endsWith("]")) {
    const bracketStart = itemName.lastIndexOf("[");
    const inside = itemName.slice(bracketStart + 1, -1).trim();
    if (inside && !inside.toLowerCase().includes("tier") && !inside.toLowerCase().includes("bundle")) {
      const parts = inside.split("/").map((p) => p.trim()).filter(Boolean);
      if (parts.length === 2) {
        color = parts[0];
        size = parts[1];
      } else if (parts.length === 1) {
        color = parts[0];
        size = parts[0];
      }
    }
  }

  return { color, size, rawMap };
}

/**
 * Returns the available stock for the specific variant combination chosen in a cart item,
 * falling back to general `product.stock` when no variant matches.
 */
export function getAvailableStockForCartItem(
  product: any,
  itemName?: string,
  variantOptions?: Record<string, string>
): number {
  if (!product) return 0;
  const { color, size } = extractOrderedVariantChoices({ variantOptions, itemName });

  if (Array.isArray(product.variants) && product.variants.length > 0 && (color || size)) {
    const normColor = (color || "").toLowerCase();
    const normSize = (size || "").toLowerCase();

    const matched = product.variants.find((v: any) => {
      if (!v || !v.options) return false;
      const vColorEntry = Object.entries(v.options).find(([k]) => isColorVariantAttributeName(k));
      const vSizeEntry = Object.entries(v.options).find(([k]) => isSizeVariantAttributeName(k));
      const vColor = vColorEntry ? String(vColorEntry[1]).trim().toLowerCase() : "";
      const vSize = vSizeEntry ? String(vSizeEntry[1]).trim().toLowerCase() : "";

      if (vColor && vSize && normColor && normSize) {
        return vColor === normColor && vSize === normSize;
      }
      if (vColor && normColor && !vSize) {
        return vColor === normColor;
      }
      if (vSize && normSize && !vColor) {
        return vSize === normSize;
      }
      return false;
    });

    if (matched) {
      if (matched.availability === "out_of_stock") return 0;
      return Math.max(0, Number(matched.stock) || 0);
    }
  }

  if (color && Array.isArray(product.colors) && product.colors.length > 0) {
    const matchedColor = product.colors.find(
      (c: any) => c && c.name && String(c.name).trim().toLowerCase() === color.toLowerCase()
    );
    if (matchedColor && matchedColor.stock !== undefined && matchedColor.stock !== "") {
      return Math.max(0, Number(matchedColor.stock) || 0);
    }
  }

  return Math.max(0, Number(product.stock) || 0);
}

/**
 * Deducts `purchasedQuantity` from the exact matching `Color × Size/Option` combination in `product.variants`
 * (and updates `product.colors` and total `product.stock` accordingly).
 * Never deducts stock from unrelated colors or sizes, and never marks the whole product unavailable
 * if other combinations still have stock > 0.
 */
export function deductProductVariantStockOnOrder<T extends Record<string, any>>(
  product: T,
  purchasedQuantity: number,
  variantOptions?: Record<string, string>,
  itemName?: string
): T {
  if (!product || purchasedQuantity <= 0) return product;

  const qty = Math.max(0, Number(purchasedQuantity) || 0);
  const { color, size } = extractOrderedVariantChoices({ variantOptions, itemName });
  const normColor = (color || "").toLowerCase();
  const normSize = (size || "").toLowerCase();

  let updatedVariants = Array.isArray(product.variants) ? [...product.variants] : undefined;
  let variantMatched = false;

  if (updatedVariants && updatedVariants.length > 0 && (normColor || normSize)) {
    updatedVariants = updatedVariants.map((v: any) => {
      if (!v || !v.options || variantMatched) return v;
      const vColorEntry = Object.entries(v.options).find(([k]) => isColorVariantAttributeName(k));
      const vSizeEntry = Object.entries(v.options).find(([k]) => isSizeVariantAttributeName(k));
      const vColor = vColorEntry ? String(vColorEntry[1]).trim().toLowerCase() : "";
      const vSize = vSizeEntry ? String(vSizeEntry[1]).trim().toLowerCase() : "";

      let isMatch = false;
      if (vColor && vSize && normColor && normSize) {
        isMatch = vColor === normColor && vSize === normSize;
      } else if (vColor && normColor && !vSize) {
        isMatch = vColor === normColor;
      } else if (vSize && normSize && !vColor) {
        isMatch = vSize === normSize;
      }

      if (isMatch) {
        variantMatched = true;
        const nextStock = Math.max(0, (Number(v.stock) || 0) - qty);
        const nextAvailability =
          nextStock <= 0
            ? "out_of_stock"
            : nextStock <= 5
            ? "low_stock"
            : "in_stock";
        return {
          ...v,
          stock: nextStock,
          availability: nextAvailability,
        };
      }
      return v;
    });
  }

  // Update color-level stock if colors track stock
  let updatedColors = Array.isArray(product.colors) ? [...product.colors] : undefined;
  if (updatedColors && updatedColors.length > 0 && normColor) {
    updatedColors = updatedColors.map((c: any) => {
      if (!c || !c.name || String(c.name).trim().toLowerCase() !== normColor) return c;
      // If variants have Color, compute this color's stock as the sum of its variant combinations
      if (updatedVariants && updatedVariants.length > 0 && variantMatched) {
        const colorVariants = updatedVariants.filter((v: any) => {
          const vColorEntry = Object.entries(v?.options || {}).find(([k]) => isColorVariantAttributeName(k));
          return vColorEntry && String(vColorEntry[1]).trim().toLowerCase() === normColor;
        });
        if (colorVariants.length > 0) {
          const sumForColor = colorVariants.reduce(
            (sum: number, v: any) => sum + (v.availability === "out_of_stock" ? 0 : Math.max(0, Number(v.stock) || 0)),
            0
          );
          return { ...c, stock: sumForColor };
        }
      }
      if (c.stock !== undefined && c.stock !== "") {
        return { ...c, stock: Math.max(0, (Number(c.stock) || 0) - qty) };
      }
      return c;
    });
  }

  // Recompute total product stock
  let nextTotalStock = Math.max(0, (Number(product.stock) || 0) - qty);
  if (updatedVariants && updatedVariants.length > 0 && variantMatched) {
    nextTotalStock = updatedVariants.reduce(
      (sum: number, v: any) => sum + (v.availability === "out_of_stock" ? 0 : Math.max(0, Number(v.stock) || 0)),
      0
    );
  } else if (product.colorStockTrackingEnabled && updatedColors && updatedColors.length > 0) {
    const hasColorStock = updatedColors.some((c: any) => c.stock !== undefined && c.stock !== "");
    if (hasColorStock) {
      nextTotalStock = updatedColors.reduce(
        (sum: number, c: any) => sum + Math.max(0, Number(c.stock) || 0),
        0
      );
    }
  }

  return {
    ...product,
    stock: nextTotalStock,
    ...(updatedVariants ? { variants: updatedVariants } : {}),
    ...(updatedColors ? { colors: updatedColors } : {}),
  };
}

