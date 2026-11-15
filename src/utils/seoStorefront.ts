import { MerchantStore } from "../types";

export interface StorefrontSEOData {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  ogType: string;
  siteName: string;
  twitterCard: "summary_large_image" | "summary";
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonicalUrl: string;
  geo: {
    region: string;
    placename: string;
    position: string;
    icbm: string;
  };
  structuredData: Record<string, any>;
  googleSnippet: {
    displayTitle: string;
    displayUrl: string;
    displayDescription: string;
    breadcrumbs: string[];
  };
}

/**
 * Trims and limits text cleanly at word boundaries, ensuring target min/max length.
 */
function cleanExcerpt(text: string, maxLen: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  const sub = clean.substring(0, maxLen);
  const lastSpace = sub.lastIndexOf(" ");
  return (lastSpace > 0 ? sub.substring(0, lastSpace) : sub) + "…";
}

/**
 * Generates dynamic, high-fidelity SEO metadata for any merchant storefront
 * dynamically derived from its description, categories, and geographic location.
 */
export function generateStorefrontSEO(
  store: MerchantStore,
  currentOrigin?: string
): StorefrontSEOData {
  const origin =
    currentOrigin ||
    (typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://yume.store");

  const storeSlug = store.slug || store.subdomain.split(".")[0] || store.id;
  const canonicalUrl = `${origin}/?store=${encodeURIComponent(store.id)}`;
  const displayHost = store.subdomain || `${storeSlug}.yume.store`;

  // 1. Categories string formatting
  const categoriesList =
    Array.isArray(store.categories) && store.categories.length > 0
      ? store.categories
      : ["Authentic Crafts", "Artisan Goods"];
  const categoriesJoined = categoriesList.slice(0, 3).join(", ");
  const primaryCategory = categoriesList[0] || "Artisan Crafts";

  // 2. Location formatting
  const wilayaName = store.wilaya || "Algiers";
  const wilayaCode = (store.wilayaCode || "16").padStart(2, "0");
  const addressLocality = `${wilayaName}, Algeria`;

  // 3. Dynamic Title (Target: 45 - 60 chars for optimal Google snippet rendering)
  // Format: [Store Name] – [Categories] in [Wilaya], Algeria | YUME
  let title = `${store.name} – ${primaryCategory} in ${wilayaName}, Algeria | YUME`;
  if (title.length > 65) {
    title = `${store.name} | ${primaryCategory} in ${wilayaName} • YUME`;
  }
  if (title.length > 65) {
    title = `${store.name} – ${wilayaName}, DZ | YUME`;
  }

  // 4. Dynamic Description (Target: 130 - 158 chars for rich Google search snippets)
  // Synthesizes the merchant's description/bio, categories, and verified location with an actionable call to action.
  const rawBio = (store.description || store.bio || "").replace(/\s+/g, " ").trim();
  let description = "";

  if (rawBio && rawBio.length >= 40) {
    // Incorporate merchant's own voice + geographic & category discoverability
    const baseSnippet = cleanExcerpt(rawBio, 90);
    description = `${baseSnippet} Shop handcrafted ${primaryCategory.toLowerCase()} from ${wilayaName}, Algeria. COD & fast shipping on YUME.`;
  } else {
    description = `Explore ${store.name} in ${wilayaName}, Algeria. Authentic handcrafted ${categoriesJoined}. Guaranteed artisan quality, secure Cash on Delivery & nationwide shipping.`;
  }

  // Ensure length stays in the golden 120-160 range
  if (description.length > 160) {
    description = cleanExcerpt(description, 155);
  } else if (description.length < 120) {
    description = `${description} Explore catalog today on YUME.`;
  }

  // 5. Dynamic Keywords
  const productSampleNames = (store.products || [])
    .slice(0, 5)
    .map((p) => p.name)
    .filter(Boolean);
  const keywordsList = [
    store.name,
    ...categoriesList,
    wilayaName,
    `Wilaya ${wilayaCode}`,
    "Algeria",
    "Algerian Artisan",
    "Handmade",
    "Artisanat Algerien",
    "Traditional Crafts",
    "Cash on Delivery Algeria",
    ...productSampleNames,
    "Yume Storefront",
  ];
  const keywords = Array.from(new Set(keywordsList)).join(", ");

  // 6. Media Assets
  const ogImage =
    store.banner ||
    store.logo ||
    (store.products?.[0]?.imageUrl
      ? store.products[0].imageUrl
      : "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80");

  const twitterImage = ogImage;

  // 7. Geo Meta Tags (for Algerian & regional local search indexing)
  const lat = store.coordinates?.lat ?? 36.7538;
  const lng = store.coordinates?.lng ?? 3.0588;
  const geo = {
    region: `DZ-${wilayaCode}`,
    placename: addressLocality,
    position: `${lat.toFixed(4)};${lng.toFixed(4)}`,
    icbm: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
  };

  // 8. Schema.org JSON-LD Structured Data
  const structuredData: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${canonicalUrl}#store`,
    name: store.name,
    description: description,
    url: canonicalUrl,
    image: [store.banner, store.logo].filter(Boolean),
    telephone: store.contact?.phone || "+213 555 000 000",
    email: store.contact?.email,
    currenciesAccepted: store.currency || "DZD",
    paymentAccepted: "Cash on Delivery (COD), Edahabia, CIB",
    priceRange: "DZD",
    address: {
      "@type": "PostalAddress",
      streetAddress: store.address || `Centre-ville, ${wilayaName}`,
      addressLocality: wilayaName,
      addressRegion: wilayaName,
      postalCode: `${wilayaCode}000`,
      addressCountry: "DZ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    },
  };

  // Rating and reviews if present
  if (store.rating && store.rating > 0) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: store.rating.toFixed(1),
      reviewCount: Math.max(store.reviews?.length || 1, 1),
      bestRating: "5",
      worstRating: "1",
    };
  }

  // Catalog highlights
  if (Array.isArray(store.products) && store.products.length > 0) {
    structuredData.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: `${store.name} Catalog`,
      itemListElement: store.products.slice(0, 10).map((prod) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: prod.name,
          category: prod.category,
          image: prod.imageUrl,
          description:
            prod.description ||
            prod.description_en ||
            prod.description_fr ||
            prod.description_ar ||
            prod.name,
        },
        price: prod.price,
        priceCurrency: "DZD",
        availability:
          prod.stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
      })),
    };
  }

  // 9. Google search snippet preview data
  const googleSnippet = {
    displayTitle: title,
    displayUrl: `https://${displayHost} › storefront › ${storeSlug}`,
    displayDescription: description,
    breadcrumbs: ["YUME", wilayaName, primaryCategory, store.name],
  };

  return {
    title,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
    ogImage,
    ogUrl: canonicalUrl,
    ogType: "profile",
    siteName: "YUME Crafts",
    twitterCard: "summary_large_image",
    twitterTitle: title,
    twitterDescription: description,
    twitterImage,
    canonicalUrl,
    geo,
    structuredData,
    googleSnippet,
  };
}
