import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CUSTOM_OTHER_OPTION,
  LEGACY_DEFAULT_DESCRIPTION,
  sanitizeInitialProductDescription,
  validateStep1Identity,
  validateStep2Media,
  normalizeCategoryFieldsWith2026Specs,
  generateMultiVariantMatrix,
  resolveActiveVariantSelection,
  calculateDynamicShippingFee,
  validateCodPhone,
  validateCodOrderForm,
  calculateCodOrderSummary,
  getCurrencySymbol,
  generateStandaloneAdLandingPageHtml,
  getVariantAttributePriority,
  sortVariantOptionEntries,
  sortVariantAttributes,
  filterExistingProductColors,
  isVariantOptionValueOutOfStock,
  getCategoryVariantSpecSuggestions,
  isFashionProductCategory,
  isFashionNonVariantAttribute,
  isMeasurementUnitAttribute,
  getAboutItemSpecPriority,
  filterAndSortAboutItemSpecs,
  formatAvailableColorsSummary,
  formatAvailableModelsSummary,
  formatAvailableSizesSummary,
  YUME_COORDINATED_ACCENT_PALETTE,
  pickRandomYumeAccentColor,
  hasArabicCharacters
} from "./wizardLogic.ts";

describe("Yume v2 5-Step Product Creation Wizard Logic", () => {
  it("Step 1: clears legacy pre-filled description and enforces strict validation", () => {
    assert.equal(sanitizeInitialProductDescription(LEGACY_DEFAULT_DESCRIPTION), "");
    assert.equal(sanitizeInitialProductDescription("Custom merchant story"), "Custom merchant story");

    assert.equal(validateStep1Identity({ title: "", sku: "SKU-1", description: "Desc" }).valid, false);
    assert.equal(validateStep1Identity({ title: "Phone", sku: "  ", description: "Desc" }).valid, false);
    assert.equal(validateStep1Identity({ title: "Phone", sku: "SKU-1", description: "" }).valid, false);
    assert.equal(
      validateStep1Identity({
        title: "iPhone 18 Pro Max",
        sku: "ELE-991021",
        description: "Flagship 2026 titanium smartphone."
      }).valid,
      true
    );
  });

  it("Step 2: requires between 1 and 10 uploaded images", () => {
    assert.equal(validateStep2Media({ images: ["", "  "] }).valid, false);
    assert.equal(validateStep2Media({ images: ["https://img.com/1.jpg", ""] }).valid, true);
    const elevenImages = Array.from({ length: 11 }, (_, i) => `https://img.com/${i}.jpg`);
    assert.equal(validateStep2Media({ images: elevenImages, maxImages: 10 }).valid, false);
  });

  it("Step 3: upgrades specs to 2026/2027 standards with Custom / Other across all categories", () => {
    const fields = normalizeCategoryFieldsWith2026Specs(
      [
        { name: "Brand", type: "select", required: true, options: ["Apple", "Samsung"] },
        { name: "Processor", type: "select", required: false, options: ["Snapdragon 8 Gen 3"] },
        { name: "Storage", type: "select", required: false, options: ["128GB"] },
        { name: "RAM", type: "select", required: false, options: ["8GB"] },
        { name: "Operating System", type: "select", required: false, options: ["iOS"] },
        { name: "Camera Specs", type: "text", required: false },
        { name: "SIM Type", type: "select", required: false, options: ["Single Nano SIM"] },
        { name: "Screen Size", type: "number", required: false }
      ],
      "electronics_smartphones"
    );

    const byName = Object.fromEntries(fields.map((f) => [f.name, f]));
    assert.ok(byName["Brand"].options?.includes(CUSTOM_OTHER_OPTION));
    assert.ok(byName["Processor"].options?.includes("Apple A19 Pro"));
    assert.ok(byName["Processor"].options?.includes("Snapdragon 8 Gen 5"));
    assert.ok(byName["Processor"].options?.includes("MediaTek Dimensity 9500"));
    assert.ok(byName["Processor"].options?.includes(CUSTOM_OTHER_OPTION));

    assert.ok(byName["Storage"].options?.includes("2TB"));
    assert.ok(byName["Storage"].options?.includes("3TB"));
    assert.ok(byName["Storage"].options?.includes("4TB"));
    assert.ok(byName["Storage"].options?.includes(CUSTOM_OTHER_OPTION));

    assert.ok(byName["RAM"].options?.includes("32GB"));
    assert.ok(byName["RAM"].options?.includes("64GB"));
    assert.ok(byName["RAM"].options?.includes(CUSTOM_OTHER_OPTION));

    assert.equal(byName["Camera Specs"].type, "select");
    assert.ok(byName["Camera Specs"].options?.includes(CUSTOM_OTHER_OPTION));

    assert.ok(byName["SIM Type"].options?.includes("Dual eSIM"));
    assert.ok(byName["SIM Type"].options?.includes("eSIM Only"));
    assert.ok(byName["SIM Type"].options?.includes(CUSTOM_OTHER_OPTION));

    assert.equal(byName["Screen Size"].type, "select");
    assert.ok(byName["Screen Size"].options?.includes(CUSTOM_OTHER_OPTION));

    // Also verify non-electronics category automatically gets Brand* + Custom / Other on all selects
    const craftsFields = normalizeCategoryFieldsWith2026Specs(
      [{ name: "Material", type: "select", required: true, options: ["Pure Sheep Wool"] }],
      "arts_crafts_looms"
    );
    assert.ok(craftsFields.some((f) => f.name === "Brand" && f.options?.includes(CUSTOM_OTHER_OPTION)));
    assert.ok(
      craftsFields.find((f) => f.name === "Material")?.options?.includes(CUSTOM_OTHER_OPTION)
    );
  });

  it("Step 3 & 4: generates Cartesian multi-select variant matrix and resolves dynamic price and linked image", () => {
    const matrix = generateMultiVariantMatrix({
      attributes: [
        { name: "Color", tags: ["Black", "White"] },
        { name: "RAM", tags: ["16GB", "32GB"] },
        { name: "Storage", tags: ["512GB", "2TB"] }
      ],
      baseSku: "PHN-2026",
      basePrice: 180000,
      colorSwatches: [
        { name: "Black", hex: "#000000", images: ["https://img.com/black.jpg"], price: 185000 },
        { name: "White", hex: "#ffffff", images: ["https://img.com/white.jpg"], price: 180000 }
      ]
    });

    // 2 Colors * 2 RAM * 2 Storage = 8 combinations
    assert.equal(matrix.length, 8);
    assert.equal(matrix[0].images[0], "https://img.com/black.jpg");

    // Customize price for Black + 32GB + 2TB
    const targetIdx = matrix.findIndex(
      (v) =>
        v.options.Color === "Black" &&
        v.options.RAM === "32GB" &&
        v.options.Storage === "2TB"
    );
    matrix[targetIdx].price = 245000;

    const resolved = resolveActiveVariantSelection({
      selectedOptions: { Color: "Black", RAM: "32GB", Storage: "2TB" },
      basePrice: 180000,
      variants: matrix,
      colorSwatches: [
        { name: "Black", hex: "#000000", images: ["https://img.com/black.jpg"] }
      ],
      galleryImages: ["https://img.com/default.jpg"]
    });

    assert.equal(resolved.effectivePrice, 245000);
    assert.equal(resolved.effectiveImage, "https://img.com/black.jpg");
  });

  it("Step 4: calculates dynamic shipping cost by Carrier, Wilaya, and Home vs Stop Desk in selected currency", () => {
    const homeAlgiers = calculateDynamicShippingFee({
      carrier: "Yalidine Express",
      wilaya: "16 - Algiers (Alger)",
      deliveryType: "home",
      currency: "DZD"
    });
    const stopDeskAlgiers = calculateDynamicShippingFee({
      carrier: "Yalidine Express",
      wilaya: "16 - Algiers (Alger)",
      deliveryType: "stop_desk",
      currency: "DZD"
    });
    const homeTamanrasset = calculateDynamicShippingFee({
      carrier: "Yalidine Express",
      wilaya: "11 - Tamanrasset",
      deliveryType: "home",
      currency: "DZD"
    });

    assert.ok(homeAlgiers.fee > stopDeskAlgiers.fee);
    assert.ok(homeTamanrasset.fee > homeAlgiers.fee);

    const eurFee = calculateDynamicShippingFee({
      carrier: "ZR Express",
      wilaya: "31 - Oran",
      deliveryType: "home",
      currency: "EUR"
    });
    assert.ok(eurFee.fee > 0 && eurFee.fee < 50);
    assert.equal(getCurrencySymbol("EUR"), "€");
    assert.equal(getCurrencySymbol("DZD"), "DA");
  });

  it("Step 5: validates COD buyer phone/form and calculates real-time COD order summary & HTML landing page", () => {
    assert.equal(validateCodPhone("0550 12 34 56"), true);
    assert.equal(validateCodPhone("+213661998877"), true);
    assert.equal(validateCodPhone("123"), false);

    assert.equal(
      validateCodOrderForm({
        fullName: "Amine Benali",
        phone: "0550123456",
        wilaya: "16 - Algiers (Alger)",
        communeAddress: "Hydra, Rue des Pins 14",
        deliveryType: "home"
      }).valid,
      true
    );

    const summary = calculateCodOrderSummary({
      variantPrice: 10000,
      discountEnabled: true,
      discountPercent: 10,
      quantity: 1,
      carrier: "Yalidine Express",
      wilaya: "16 - Algiers (Alger)",
      deliveryType: "stop_desk",
      currency: "DZD"
    });

    // 10,000 - 10% = 9,000 + 350 stop desk in Algiers = 9,350 DA
    assert.equal(summary.unitFinalPrice, 9000);
    assert.equal(summary.shippingFee, 350);
    assert.equal(summary.totalFinalPrice, 9350);
    assert.equal(summary.currencySymbol, "DA");

    const html = generateStandaloneAdLandingPageHtml({
      title: "Galaxy S26 Ultra",
      sku: "SAM-2026",
      category: "electronics_smartphones",
      description: "Next-gen smartphone",
      currency: "DZD",
      basePrice: 220000,
      discountEnabled: true,
      discountPercent: 10,
      carrier: "Yalidine Express",
      brandColor: "#0b2447",
      images: ["https://img.com/s26.jpg"],
      videoLinks: ["https://www.tiktok.com/@store/video/123"],
      specs: [{ key: "Processor", value: "Snapdragon 8 Gen 5" }],
      variants: [],
      colorSwatches: [],
      sizes: [],
      sizePrices: {},
      storyEnabled: true,
      storySections: [{ url: "https://img.com/story1.jpg", description: "Titanium frame" }],
      facebookPixelId: "1234567890"
    });

    assert.ok(html.includes("Direct Cash on Delivery (COD) Order Form"));
    assert.ok(html.includes("1234567890"));
    assert.ok(html.includes("Snapdragon 8 Gen 5"));
  });

  it("Step 3: isolates only chosen variant pieces and generates clean matrix when toggled via (+) symbol", () => {
    // Simulating toggling chosen pieces (e.g. Storage 256GB and 512GB chosen from list)
    let chosenPieces: string[] = [];
    const togglePiece = (tag: string) => {
      if (chosenPieces.includes(tag)) {
        chosenPieces = chosenPieces.filter(t => t !== tag);
      } else {
        chosenPieces = [...chosenPieces, tag];
      }
    };

    // User clicks (+) on 256GB
    togglePiece("256GB");
    assert.deepEqual(chosenPieces, ["256GB"]);

    // User clicks (+) on 512GB
    togglePiece("512GB");
    assert.deepEqual(chosenPieces, ["256GB", "512GB"]);

    // Only chosen pieces exist (unselected options like 64GB, 128GB, 1TB are NOT in chosen pieces)
    assert.ok(!chosenPieces.includes("64GB"));
    assert.ok(!chosenPieces.includes("128GB"));

    // Cartesian matrix matches exactly the 2 chosen pieces
    const matrix = generateMultiVariantMatrix({
      attributes: [{ name: "Storage", tags: chosenPieces }],
      baseSku: "PHO",
      basePrice: 150000,
      defaultStock: 10
    });
    assert.equal(matrix.length, 2);
    assert.equal(matrix[0].options?.Storage, "256GB");
    assert.equal(matrix[1].options?.Storage, "512GB");
  });

  it("Sell Product Page Rules: orders variants canonically (Color, Size, CPU, GPU, RAM, Storage, Screen Size, ...etc)", () => {
    const unsortedEntries: Array<[string, string[]]> = [
      ["Brand", ["Apple"]],
      ["Screen Size", ["6.3 inches", "6.9 inches"]],
      ["Storage", ["128GB", "256GB", "512GB"]],
      ["RAM", ["8GB", "16GB"]],
      ["GPU", ["Apple A19 Pro 6-Core GPU"]],
      ["Processor", ["Apple A19 Pro"]],
      ["Size", ["Standard", "Pro Max"]],
      ["Color", ["Black", "Green"]]
    ];

    const sorted = sortVariantOptionEntries(unsortedEntries);
    assert.deepEqual(
      sorted.map(([k]) => k),
      ["Color", "Size", "Processor", "GPU", "RAM", "Storage", "Screen Size", "Brand"]
    );

    const suggestions = getCategoryVariantSpecSuggestions("smartphones");
    assert.deepEqual(
      suggestions.slice(0, 6).map((s) => s.name),
      ["Color", "Processor", "GPU", "RAM", "Storage", "Screen Size"]
    );
  });

  it("Sell Product Page Rules: filters out unchosen legacy 5-color default preset and shows only existing colors", () => {
    const legacyDefaults = [
      { name: "White", hex: "#ffffff", images: [], imageUrl: "" },
      { name: "Black", hex: "#111827", images: [], imageUrl: "" },
      { name: "Cream Yellow", hex: "#fef08a", images: [], imageUrl: "" },
      { name: "Pastel Pink", hex: "#fbcfe8", images: [], imageUrl: "" },
      { name: "Green", hex: "#065f46", images: [], imageUrl: "" }
    ];

    // If product has variants without those colors and none of the 5 defaults were customized, returns empty
    const filteredUnchosen = filterExistingProductColors({
      colors: legacyDefaults,
      variants: [{ id: "v1", stock: 5, options: { RAM: "8GB", Storage: "128GB" } }]
    });
    assert.equal(filteredUnchosen.length, 0);

    // If variants explicitly define Color, only existing in-stock colors are returned
    const filteredFromVariants = filterExistingProductColors({
      colors: [
        { name: "Obsidian Black", hex: "#111827" },
        { name: "Emerald Green", hex: "#065f46" },
        { name: "Rose Gold", hex: "#fbcfe8" }
      ],
      variants: [
        { id: "v1", stock: 5, options: { Color: "Obsidian Black", RAM: "8GB" } },
        { id: "v2", stock: 0, options: { Color: "Rose Gold", RAM: "8GB" } }
      ]
    });
    assert.equal(filteredFromVariants.length, 1);
    assert.equal(filteredFromVariants[0].name, "Obsidian Black");
  });

  it("Sell Product Page Rules: detects out-of-stock variant values so they are marked crossed out", () => {
    const variants = [
      { id: "v1", stock: 6, options: { RAM: "8GB", Storage: "128GB", Size: "M" } },
      { id: "v2", stock: 0, options: { RAM: "16GB", Storage: "512GB", Size: "XL" } }
    ];

    assert.equal(
      isVariantOptionValueOutOfStock({
        optionName: "Storage",
        optionValue: "512GB",
        selectedOptions: { RAM: "16GB", Storage: "512GB", Size: "XL" },
        variants
      }),
      true
    );

    assert.equal(
      isVariantOptionValueOutOfStock({
        optionName: "Storage",
        optionValue: "128GB",
        selectedOptions: { RAM: "8GB", Storage: "128GB", Size: "M" },
        variants
      }),
      false
    );
  });

  it("Fashion Category Rules: accurately detects fashion categories and non-variant attributes", () => {
    assert.equal(isFashionProductCategory("Fashion & Apparel", "Men's Clothing", "Polo Shirt"), true);
    assert.equal(isFashionProductCategory("Vêtements & Mode", "Chemises", "Chemise Slim"), true);
    assert.equal(isFashionProductCategory("Electronics", "Laptops", "MacBook Pro"), false);

    // Non-variant attributes that must not be interactive buttons on fashion items (kept down in About this item)
    assert.equal(isFashionNonVariantAttribute("Fit"), true);
    assert.equal(isFashionNonVariantAttribute("Fit Type"), true);
    assert.equal(isFashionNonVariantAttribute("Season"), true);
    assert.equal(isFashionNonVariantAttribute("Brand"), true);
    assert.equal(isFashionNonVariantAttribute("Measurement Unit"), true);
    // Color, Size, and Gender CAN be variants
    assert.equal(isFashionNonVariantAttribute("Color"), false);
    assert.equal(isFashionNonVariantAttribute("Size"), false);
    assert.equal(isFashionNonVariantAttribute("Gender"), false);
  });

  it("About this item: hides measurement unit and sorts specs in canonical priority", () => {
    assert.equal(isMeasurementUnitAttribute("Measurement Unit"), true);
    assert.equal(isMeasurementUnitAttribute("measurement_unit"), true);
    assert.equal(isMeasurementUnitAttribute("unit"), true);
    assert.equal(isMeasurementUnitAttribute("Material"), false);

    const rawSpecs = [
      { key: "Season", value: "Summer" },
      { key: "Measurement Unit", value: "cm" },
      { key: "Material", value: "100% Cotton" },
      { key: "Fit", value: "Regular" },
      { key: "Color", value: "Black" }, // Should be excluded from about item table
      { key: "Size", value: "XL" },    // Should be excluded from about item table
      { key: "Origin", value: "Italy" }
    ];

    const sorted = filterAndSortAboutItemSpecs(rawSpecs, {
      brand: "Zara",
      subcategory: "T-Shirts"
    });

    // Check measurement unit is removed
    assert.equal(sorted.some((s) => s.key.toLowerCase().includes("measurement unit") || s.key.toLowerCase() === "unit"), false);
    // Check color and size are removed
    assert.equal(sorted.some((s) => s.key.toLowerCase() === "color" || s.key.toLowerCase() === "size"), false);

    // Check canonical order: Brand (1), Item Type (2), Material (4), Fit (5), Season (6), Origin (9)
    const keys = sorted.map((s) => s.key);
    assert.equal(keys[0], "Brand");
    assert.equal(keys[1], "Item Type");
    assert.equal(keys[2], "Material");
    assert.equal(keys[3], "Fit");
    assert.equal(keys[4], "Season");
    assert.equal(keys[5], "Origin");
  });

  it("Coordinated Accent Palette & Arabic Readability Helpers: picks valid YUME colors and detects Arabic script", () => {
    const paletteSet = new Set<string>(YUME_COORDINATED_ACCENT_PALETTE);
    for (let i = 0; i < 20; i++) {
      const color = pickRandomYumeAccentColor();
      assert.ok(paletteSet.has(color));
    }

    assert.equal(hasArabicCharacters("زيت أرغان طبيعي ١٠٠٪"), true);
    assert.equal(hasArabicCharacters("Premium Handcrafted Rug - سجاد أمازيغي"), true);
    assert.equal(hasArabicCharacters("100% Organic Cotton Shirt"), false);
    assert.equal(hasArabicCharacters(""), false);
  });

  it("About this item: formats available colors and models as multi-color/multi-model when > 3, and lists sizes", () => {
    // <= 3 colors
    assert.equal(formatAvailableColorsSummary(["Navy", "White"]), "Navy, White");
    assert.equal(formatAvailableColorsSummary(["Navy", "White", "Slate Gray"]), "Navy, White, Slate Gray");
    // > 3 colors
    assert.equal(formatAvailableColorsSummary(["Navy", "White", "Slate Gray", "Black"]), "Multi-color");
    assert.equal(formatAvailableColorsSummary(["Red", "Green", "Blue", "Yellow", "Purple"]), "Multi-color");

    // <= 3 models
    assert.equal(formatAvailableModelsSummary(["Model X", "Model Y"]), "Model X, Model Y");
    // > 3 models
    assert.equal(formatAvailableModelsSummary(["M1", "M2", "M3", "M4"]), "Multi-model");

    // sizes
    assert.equal(formatAvailableSizesSummary(["S", "M", "L", "XL"]), "S, M, L, XL");

    // filterAndSortAboutItemSpecs includes Color and Size in About item
    const specs = filterAndSortAboutItemSpecs(
      [
        { key: "Brand", value: "Polo" },
        { key: "Material", value: "Organic Cotton" }
      ],
      {
        availableColors: ["Black", "White", "Navy", "Gray", "Red"],
        availableSizes: ["S", "M", "L", "XL"]
      }
    );

    const colorRow = specs.find(s => s.key === "Color");
    const sizeRow = specs.find(s => s.key === "Size");
    assert.ok(colorRow);
    assert.equal(colorRow.value, "Multi-color");
    assert.ok(sizeRow);
    assert.equal(sizeRow.value, "S, M, L, XL");
  });

  it("Step 3: tracks independent color variant stock and marks 0-stock colors as out of stock", () => {
    const swatches = [
      { name: "White", hex: "#ffffff", images: [], stock: 20 },
      { name: "Black", hex: "#000000", images: [], stock: 0 },
      { name: "Blue", hex: "#2563eb", images: [], stock: 15 }
    ];

    // Total stock calculation: sum of all color stocks
    const totalStock = swatches.reduce((sum, sw) => sum + (Number(sw.stock) || 0), 0);
    assert.equal(totalStock, 35);

    // Out of stock detection for color with 0 stock
    const isBlackOut = isVariantOptionValueOutOfStock({
      optionName: "Color",
      optionValue: "Black",
      colors: swatches,
      colorStockTrackingEnabled: true
    });
    assert.equal(isBlackOut, true);

    // In stock detection for color with 20 stock
    const isWhiteOut = isVariantOptionValueOutOfStock({
      optionName: "Color",
      optionValue: "White",
      colors: swatches,
      colorStockTrackingEnabled: true
    });
    assert.equal(isWhiteOut, false);

    // Matrix generation inherits color swatch stock
    const matrix = generateMultiVariantMatrix({
      attributes: [{ name: "Color", tags: ["White", "Black"] }],
      baseSku: "TSHIRT",
      basePrice: 4000,
      colorSwatches: swatches
    });

    const whiteVariant = matrix.find(v => v.options["Color"] === "White");
    const blackVariant = matrix.find(v => v.options["Color"] === "Black");

    assert.ok(whiteVariant);
    assert.equal(whiteVariant.stock, 20);
    assert.equal(whiteVariant.availability, "in_stock");

    assert.ok(blackVariant);
    assert.equal(blackVariant.stock, 0);
    assert.equal(blackVariant.availability, "out_of_stock");
  });
});


