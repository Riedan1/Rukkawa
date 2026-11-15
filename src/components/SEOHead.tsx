import { useEffect } from "react";
import { MerchantStore } from "../types";
import { generateStorefrontSEO } from "../utils/seoStorefront";

export interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: "summary_large_image" | "summary";
  canonicalUrl?: string;
  geo?: {
    region?: string;
    placename?: string;
    position?: string;
    icbm?: string;
  };
  structuredData?: Record<string, any>;
  store?: MerchantStore | null;
}

export const SEOHead = ({
  title: propTitle,
  description: propDescription,
  keywords: propKeywords,
  ogImage: propOgImage,
  ogUrl: propOgUrl,
  ogType: propOgType = "website",
  twitterCard: propTwitterCard = "summary_large_image",
  canonicalUrl: propCanonicalUrl,
  geo: propGeo,
  structuredData: propStructuredData,
  store,
}: SEOHeadProps) => {
  // If store is passed, dynamically compute all storefront SEO metadata
  const storefrontSEO = store ? generateStorefrontSEO(store) : null;

  const effectiveTitle =
    storefrontSEO?.title ||
    (propTitle
      ? `${propTitle} | Yume Algerian Artisan E-Commerce`
      : "YUME – Authentic Algerian Artisan Marketplace");

  const effectiveDescription =
    storefrontSEO?.description ||
    propDescription ||
    "Explore authentic handcrafted Algerian artisan treasures, rugs, jewelry, and pottery. Direct from master creators across 58 Wilayas with cash on delivery.";

  const effectiveKeywords =
    storefrontSEO?.keywords ||
    propKeywords ||
    "artisan, algeria, crafts, handmade, rugs, jewelry, pottery, ecommerce, yume, dz";

  const effectiveOgImage =
    storefrontSEO?.ogImage ||
    propOgImage ||
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80";

  const effectiveOgUrl =
    storefrontSEO?.ogUrl ||
    propOgUrl ||
    (typeof window !== "undefined" ? window.location.href : "https://yume.store");

  const effectiveOgType = storefrontSEO?.ogType || propOgType;
  const effectiveTwitterCard = storefrontSEO?.twitterCard || propTwitterCard;
  const effectiveTwitterTitle = storefrontSEO?.twitterTitle || effectiveTitle;
  const effectiveTwitterDescription =
    storefrontSEO?.twitterDescription || effectiveDescription;
  const effectiveTwitterImage = storefrontSEO?.twitterImage || effectiveOgImage;
  const effectiveCanonicalUrl =
    storefrontSEO?.canonicalUrl || propCanonicalUrl || effectiveOgUrl;

  const effectiveGeo = storefrontSEO?.geo || propGeo;
  const effectiveStructuredData =
    storefrontSEO?.structuredData ||
    propStructuredData || {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "YUME Crafts",
      url: effectiveOgUrl,
      description: effectiveDescription,
    };

  useEffect(() => {
    if (typeof document === "undefined") return;

    // 1. Document Title
    document.title = effectiveTitle;

    // Helper to safely set standard <meta name="..."> tags
    const setMetaTag = (name: string, content?: string | null) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!content) {
        if (meta) meta.remove();
        return;
      }
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Helper to safely set OpenGraph <meta property="..."> tags
    const setOgMetaTag = (property: string, content?: string | null) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!content) {
        if (meta) meta.remove();
        return;
      }
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // 2. Core SEO Description & Keywords
    setMetaTag("description", effectiveDescription);
    setMetaTag("keywords", effectiveKeywords);

    // 3. OpenGraph tags
    setOgMetaTag("og:title", effectiveTitle);
    setOgMetaTag("og:description", effectiveDescription);
    setOgMetaTag("og:type", effectiveOgType);
    setOgMetaTag("og:url", effectiveOgUrl);
    setOgMetaTag("og:image", effectiveOgImage);
    setOgMetaTag("og:site_name", "YUME Algerian Artisan Marketplace");

    // 4. Twitter / X Card tags
    setMetaTag("twitter:card", effectiveTwitterCard);
    setMetaTag("twitter:title", effectiveTwitterTitle);
    setMetaTag("twitter:description", effectiveTwitterDescription);
    setMetaTag("twitter:image", effectiveTwitterImage);

    // 5. Geo Meta Tags (for regional indexing across Algerian Wilayas)
    if (effectiveGeo) {
      if (effectiveGeo.region) setMetaTag("geo.region", effectiveGeo.region);
      if (effectiveGeo.placename) setMetaTag("geo.placename", effectiveGeo.placename);
      if (effectiveGeo.position) setMetaTag("geo.position", effectiveGeo.position);
      if (effectiveGeo.icbm) setMetaTag("ICBM", effectiveGeo.icbm);
    } else {
      setMetaTag("geo.region", null);
      setMetaTag("geo.placename", null);
      setMetaTag("geo.position", null);
      setMetaTag("ICBM", null);
    }

    // 6. Canonical Link Tag (<link rel="canonical">)
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", effectiveCanonicalUrl);

    // 7. Schema.org JSON-LD Structured Data
    const existingScript = document.getElementById("yume-seo-jsonld");
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = "yume-seo-jsonld";
    script.type = "application/ld+json";
    script.innerHTML = JSON.stringify(effectiveStructuredData);
    document.head.appendChild(script);

    return () => {
      // Optional cleanup on unmount
      const scriptToRemove = document.getElementById("yume-seo-jsonld");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [
    effectiveTitle,
    effectiveDescription,
    effectiveKeywords,
    effectiveOgImage,
    effectiveOgUrl,
    effectiveOgType,
    effectiveTwitterCard,
    effectiveTwitterTitle,
    effectiveTwitterDescription,
    effectiveTwitterImage,
    effectiveCanonicalUrl,
    effectiveGeo,
    effectiveStructuredData,
  ]);

  return null; // Side-effect only component
};
