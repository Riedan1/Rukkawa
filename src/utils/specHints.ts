/**
 * Contextual hints exclusively for Primary Specifications in the product creation workflow.
 */

export interface SpecHint {
  title: string;
  explanation: string;
}

const SPEC_HINT_MAP: Record<string, string> = {
  "measurement unit": "Specifies the packaging or sales unit (e.g. piece, pair, set, pack) used for pricing and inventory calculations.",
  "unit": "Specifies the packaging or sales unit (e.g. piece, pair, set, pack) used for pricing and inventory calculations.",
  "gender": "Defines the target audience or fit styling (e.g. Men, Women, Unisex, Kids) for this item.",
  "size system": "Standard sizing convention (e.g. EU, US, UK, Alpha) used to label variants for accurate buyer fit.",
  "sizing system": "Standard sizing convention (e.g. EU, US, UK, Alpha) used to label variants for accurate buyer fit.",
  "sole type": "Type and material of footwear outsole (e.g. Rubber, Crepe, Leather, Lugged) indicating traction and durability.",
  "sole": "Type and material of footwear outsole (e.g. Rubber, Crepe, Leather, Lugged) indicating traction and durability.",
  "brand": "The maker, workshop name, or artisan brand associated with this product.",
  "custom attributes": "Custom key-value specifications for unique craftsmanship details or technical specs of your product.",
  "custom attribute": "Custom key-value specifications for unique craftsmanship details or technical specs of your product.",
  "material": "Primary fabric, leather, wood, metal, or raw compound used to craft this item.",
  "closure": "Fastening mechanism such as laces, zipper, buckle, slip-on, or magnetic clasp.",
  "fit": "Cut and silhouette profile (e.g. Slim, Regular, Relaxed, Tailored).",
  "occasion": "Recommended setting such as Casual, Formal, Traditional, Sports, or Festive wear.",
  "style": "Artistic or fashion classification (e.g. Modern, Traditional, Berber, Minimalist).",
  "weight": "Physical weight of the item, useful for shipping rate calculation and buyer convenience.",
  "care instructions": "Guidelines for cleaning, storing, or preserving the quality of this item.",
  "care": "Guidelines for cleaning, storing, or preserving the quality of this item.",
  "country of origin": "Geographic region or wilaya where this product was handcrafted or manufactured.",
  "origin": "Geographic region or wilaya where this product was handcrafted or manufactured.",
  "warranty": "Coverage terms or craftsmanship guarantee provided with this product.",
  "season": "Appropriate seasonal wear (e.g. Summer, Winter, All Season, Spring/Autumn).",
  "pattern": "Visual surface design or motif (e.g. Solid, Striped, Checked, Geometric, Embroidered).",
  "capacity": "Holding volume or storage volume measured in liters or standard units.",
  "waterproof": "Indicates whether the product features water-resistant or waterproof protection.",
  "stone type": "Type of gemstones or authentic minerals mounted on the item.",
  "movement type": "Internal mechanism powering the timepiece (e.g. Automatic, Quartz, Mechanical).",
  "water resistance": "Water depth and pressure rating for this timepiece or gear.",
  "strap material": "Material of the wrist strap or band (e.g. Leather, Stainless Steel, Silicone)."
};

/**
 * Returns a short, clear contextual explanation for a primary specification field.
 */
export function getSpecHint(fieldName: string): string {
  if (!fieldName) return "";
  const normalized = fieldName.trim().toLowerCase();
  
  if (SPEC_HINT_MAP[normalized]) {
    return SPEC_HINT_MAP[normalized];
  }

  // Substring match check
  for (const [key, explanation] of Object.entries(SPEC_HINT_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return explanation;
    }
  }

  return `Detailed specification or attribute tailored to this product.`;
}
