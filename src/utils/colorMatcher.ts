/**
 * Color matching and auto-naming utility.
 * Maps any hex code to a descriptive shade name and root base color family.
 */

export interface ColorFamily {
  id: string;
  name: string;
  baseHex: string;
  shades: Array<{ name: string; hex: string }>;
}

export const CORE_8_COLOR_FAMILIES: ColorFamily[] = [
  {
    id: "white",
    name: "White",
    baseHex: "#FFFFFF",
    shades: [
      { name: "Pure White", hex: "#FFFFFF" },
      { name: "Pearl White", hex: "#F8FAFC" },
      { name: "Ivory", hex: "#FFFBEB" },
      { name: "Cream", hex: "#FEF3C7" },
      { name: "Alabaster", hex: "#F1F5F9" }
    ]
  },
  {
    id: "black",
    name: "Black",
    baseHex: "#000000",
    shades: [
      { name: "Jet Black", hex: "#000000" },
      { name: "Charcoal Black", hex: "#1F2937" },
      { name: "Midnight Black", hex: "#0F172A" },
      { name: "Obsidian", hex: "#18181B" },
      { name: "Onyx Black", hex: "#27272A" }
    ]
  },
  {
    id: "red",
    name: "Red",
    baseHex: "#EF4444",
    shades: [
      { name: "Bright Red", hex: "#EF4444" },
      { name: "Crimson Red", hex: "#DC2626" },
      { name: "Burgundy Wine", hex: "#991B1B" },
      { name: "Terracotta Rust", hex: "#C2410C" },
      { name: "Coral Red", hex: "#F87171" }
    ]
  },
  {
    id: "blue",
    name: "Blue",
    baseHex: "#3B82F6",
    shades: [
      { name: "Royal Blue", hex: "#3B82F6" },
      { name: "Cobalt Blue", hex: "#2563EB" },
      { name: "Navy Blue", hex: "#1E3A8A" },
      { name: "Sky Blue", hex: "#60A5FA" },
      { name: "Cyan Ocean", hex: "#06B6D4" }
    ]
  },
  {
    id: "green",
    name: "Green",
    baseHex: "#10B981",
    shades: [
      { name: "Emerald Green", hex: "#10B981" },
      { name: "Forest Green", hex: "#065F46" },
      { name: "Olive Green", hex: "#65A30D" },
      { name: "Mint Green", hex: "#34D399" },
      { name: "Sage Light Green", hex: "#84CC16" }
    ]
  },
  {
    id: "yellow",
    name: "Yellow",
    baseHex: "#EAB308",
    shades: [
      { name: "Golden Yellow", hex: "#EAB308" },
      { name: "Mustard Gold", hex: "#D97706" },
      { name: "Amber Warm", hex: "#F59E0B" },
      { name: "Lemon Yellow", hex: "#FACC15" },
      { name: "Ochre Earth", hex: "#B45309" }
    ]
  },
  {
    id: "brown",
    name: "Brown",
    baseHex: "#78350F",
    shades: [
      { name: "Rich Brown", hex: "#78350F" },
      { name: "Dark Chocolate", hex: "#451A03" },
      { name: "Caramel Tan", hex: "#92400E" },
      { name: "Walnut Brown", hex: "#5C2809" },
      { name: "Coffee Mocha", hex: "#6B4226" }
    ]
  },
  {
    id: "gray",
    name: "Gray",
    baseHex: "#6B7280",
    shades: [
      { name: "Medium Gray", hex: "#6B7280" },
      { name: "Silver Gray", hex: "#9CA3AF" },
      { name: "Slate Gray", hex: "#475569" },
      { name: "Cool Gray", hex: "#64748B" },
      { name: "Platinum Light", hex: "#CBD5E1" }
    ]
  }
];

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB | null {
  const cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

export function colorDistance(c1: RGB, c2: RGB): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Flat list of reference colors with their base family
const COLOR_DICTIONARY: Array<{ name: string; hex: string; baseName: string }> = [
  // Whites & Creams
  { name: "Pure White", hex: "#FFFFFF", baseName: "White" },
  { name: "Pearl White", hex: "#F8FAFC", baseName: "White" },
  { name: "Snow White", hex: "#F9FAFB", baseName: "White" },
  { name: "Alabaster", hex: "#F1F5F9", baseName: "White" },
  { name: "Off White", hex: "#E5E7EB", baseName: "White" },
  { name: "Ivory", hex: "#FFFBEB", baseName: "White" },
  { name: "Cream", hex: "#FEF3C7", baseName: "White" },
  { name: "Warm Linen", hex: "#F5F0E6", baseName: "White" },
  { name: "Porcelain", hex: "#ECEEEF", baseName: "White" },

  // Blacks & Deep Charcoals
  { name: "Jet Black", hex: "#000000", baseName: "Black" },
  { name: "Obsidian", hex: "#18181B", baseName: "Black" },
  { name: "Midnight Black", hex: "#0F172A", baseName: "Black" },
  { name: "Charcoal Black", hex: "#1F2937", baseName: "Black" },
  { name: "Dark Onyx", hex: "#27272A", baseName: "Black" },
  { name: "Carbon Black", hex: "#171717", baseName: "Black" },
  { name: "Ebony", hex: "#222428", baseName: "Black" },
  { name: "Ink Black", hex: "#111827", baseName: "Black" },

  // Grays, Silvers & Taupes
  { name: "Platinum Light Gray", hex: "#CBD5E1", baseName: "Gray" },
  { name: "Light Silver", hex: "#D1D5DB", baseName: "Gray" },
  { name: "Silver Gray", hex: "#9CA3AF", baseName: "Gray" },
  { name: "Ash Gray", hex: "#A8A29E", baseName: "Gray" },
  { name: "Stone Gray", hex: "#8A8D8F", baseName: "Gray" },
  { name: "Dove Gray", hex: "#94A3B8", baseName: "Gray" },
  { name: "Medium Gray", hex: "#6B7280", baseName: "Gray" },
  { name: "Cool Gray", hex: "#64748B", baseName: "Gray" },
  { name: "Pewter Gray", hex: "#71717A", baseName: "Gray" },
  { name: "Taupe Gray", hex: "#78716C", baseName: "Gray" },
  { name: "Warm Taupe", hex: "#8C8275", baseName: "Gray" },
  { name: "Slate Gray", hex: "#475569", baseName: "Gray" },
  { name: "Dark Charcoal", hex: "#334155", baseName: "Gray" },
  { name: "Graphite", hex: "#3F3F46", baseName: "Gray" },
  { name: "Gunmetal Gray", hex: "#2A3439", baseName: "Gray" },

  // Reds, Pinks & Burgundies
  { name: "Crimson Red", hex: "#DC2626", baseName: "Red" },
  { name: "Bright Red", hex: "#EF4444", baseName: "Red" },
  { name: "Ruby Red", hex: "#B91C1C", baseName: "Red" },
  { name: "Burgundy Wine", hex: "#991B1B", baseName: "Red" },
  { name: "Maroon", hex: "#7F1D1D", baseName: "Red" },
  { name: "Terracotta Rust", hex: "#C2410C", baseName: "Red" },
  { name: "Coral Red", hex: "#F87171", baseName: "Red" },
  { name: "Rose Red", hex: "#E11D48", baseName: "Red" },
  { name: "Dusty Rose", hex: "#D48C96", baseName: "Red" },
  { name: "Blush Pink", hex: "#F4AFB4", baseName: "Red" },
  { name: "Berry Wine", hex: "#881337", baseName: "Red" },

  // Blues & Navies
  { name: "Royal Blue", hex: "#2563EB", baseName: "Blue" },
  { name: "Sky Blue", hex: "#3B82F6", baseName: "Blue" },
  { name: "Light Ice Blue", hex: "#60A5FA", baseName: "Blue" },
  { name: "Powder Blue", hex: "#93C5FD", baseName: "Blue" },
  { name: "Baby Blue", hex: "#A5C8E4", baseName: "Blue" },
  { name: "Chambray Blue", hex: "#7A9AB8", baseName: "Blue" },
  { name: "Steel Blue", hex: "#4682B4", baseName: "Blue" },
  { name: "Denim Blue", hex: "#3B5998", baseName: "Blue" },
  { name: "Slate Blue", hex: "#4A607A", baseName: "Blue" },
  { name: "Deep Navy Blue", hex: "#1E3A8A", baseName: "Blue" },
  { name: "Midnight Blue", hex: "#172554", baseName: "Blue" },
  { name: "Dark Indigo", hex: "#1E293B", baseName: "Blue" },
  { name: "Ocean Cyan", hex: "#06B6D4", baseName: "Blue" },
  { name: "Teal Blue", hex: "#0D9488", baseName: "Blue" },

  // Greens, Sages & Olives
  { name: "Emerald Green", hex: "#10B981", baseName: "Green" },
  { name: "Jade Green", hex: "#059669", baseName: "Green" },
  { name: "Forest Green", hex: "#065F46", baseName: "Green" },
  { name: "Hunter Green", hex: "#14532D", baseName: "Green" },
  { name: "Dark Olive", hex: "#2E3829", baseName: "Green" },
  { name: "Army Olive", hex: "#4B5320", baseName: "Green" },
  { name: "Olive Green", hex: "#65A30D", baseName: "Green" },
  { name: "Moss Green", hex: "#6B7B5C", baseName: "Green" },
  { name: "Sage Green", hex: "#8A9A86", baseName: "Green" },
  { name: "Eucalyptus Green", hex: "#768978", baseName: "Green" },
  { name: "Mint Green", hex: "#34D399", baseName: "Green" },
  { name: "Pistachio Green", hex: "#A3C1AD", baseName: "Green" },
  { name: "Lime Green", hex: "#84CC16", baseName: "Green" },

  // Yellows, Golds & Oranges
  { name: "Golden Yellow", hex: "#EAB308", baseName: "Yellow" },
  { name: "Mustard Gold", hex: "#D97706", baseName: "Yellow" },
  { name: "Warm Amber", hex: "#F59E0B", baseName: "Yellow" },
  { name: "Lemon Yellow", hex: "#FACC15", baseName: "Yellow" },
  { name: "Ochre Yellow", hex: "#B45309", baseName: "Yellow" },
  { name: "Champagne Gold", hex: "#FDE047", baseName: "Yellow" },
  { name: "Sand Gold", hex: "#D4AF37", baseName: "Yellow" },

  // Browns, Khakis, Beiges & Tans
  { name: "Sandstone Beige", hex: "#D6C7B2", baseName: "Brown" },
  { name: "Desert Sand", hex: "#C2B280", baseName: "Brown" },
  { name: "Warm Khaki", hex: "#9E9278", baseName: "Brown" },
  { name: "Olive Khaki", hex: "#7C776B", baseName: "Brown" },
  { name: "Camel Tan", hex: "#B88A58", baseName: "Brown" },
  { name: "Caramel Tan", hex: "#92400E", baseName: "Brown" },
  { name: "Chestnut Brown", hex: "#854D0E", baseName: "Brown" },
  { name: "Coffee Mocha", hex: "#6B4226", baseName: "Brown" },
  { name: "Rich Brown", hex: "#78350F", baseName: "Brown" },
  { name: "Walnut Brown", hex: "#5C2809", baseName: "Brown" },
  { name: "Dark Chocolate", hex: "#451A03", baseName: "Brown" },
  { name: "Espresso Brown", hex: "#362318", baseName: "Brown" }
];

/**
 * Detect the closest descriptive color name and root base color family from any hex.
 * When `existingNames` is provided, automatically picks the closest unused descriptive shade
 * (or appends a number) so multiple sampled screen colors never collide.
 */
export function getClosestColorName(
  hex: string,
  existingNames?: string[]
): { name: string; baseName: string } {
  const targetRgb = hexToRgb(hex);
  if (!targetRgb) {
    return { name: "Custom Color", baseName: "Color" };
  }

  const usedSet = new Set(
    (existingNames || []).map((n) => String(n || "").trim().toLowerCase()).filter(Boolean)
  );

  const ranked = COLOR_DICTIONARY.map((item) => {
    const itemRgb = hexToRgb(item.hex);
    const dist = itemRgb ? colorDistance(targetRgb, itemRgb) : Infinity;
    return { item, dist };
  }).sort((a, b) => a.dist - b.dist);

  const bestMatch = ranked[0]?.item || COLOR_DICTIONARY[0];

  if (usedSet.size === 0 || !usedSet.has(bestMatch.name.toLowerCase())) {
    return { name: bestMatch.name, baseName: bestMatch.baseName };
  }

  // Try to find the closest unused shade name within a reasonable perceptual distance
  for (let i = 1; i < ranked.length; i++) {
    const candidate = ranked[i];
    if (candidate.dist <= ranked[0].dist + 55 && !usedSet.has(candidate.item.name.toLowerCase())) {
      return { name: candidate.item.name, baseName: candidate.item.baseName };
    }
  }

  // If all nearby shades are already used, append a clean sequential number
  let counter = 2;
  let numberedName = `${bestMatch.name} ${counter}`;
  while (usedSet.has(numberedName.toLowerCase())) {
    counter += 1;
    numberedName = `${bestMatch.name} ${counter}`;
  }

  return { name: numberedName, baseName: bestMatch.baseName };
}
