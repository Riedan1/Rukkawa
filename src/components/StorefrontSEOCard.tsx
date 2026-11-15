import React, { useState } from "react";
import { MerchantStore } from "../types";
import { generateStorefrontSEO } from "../utils/seoStorefront";
import { Globe, MapPin, Tag, Check, Copy, ExternalLink, Sparkles, Code2, Search, Share2 } from "lucide-react";

interface StorefrontSEOCardProps {
  store: MerchantStore;
  className?: string;
}

export const StorefrontSEOCard: React.FC<StorefrontSEOCardProps> = ({ store, className = "" }) => {
  const [activeTab, setActiveTab] = useState<"google" | "social" | "schema" | "tags">("google");
  const [copied, setCopied] = useState<string | null>(null);

  const seo = generateStorefrontSEO(store);

  const handleCopy = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const titleLength = seo.title.length;
  const descLength = seo.description.length;

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden text-left font-sans ${className}`}>
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-amber-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Storefront SEO & Google Discoverability
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Dynamic Tags
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Automatically generated from {store.name}'s description, categories, and location in {store.wilaya}.
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("google")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "google"
                ? "bg-white text-slate-900 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Search className="w-3.5 h-3.5 text-blue-500" />
            <span>Google Search</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("social")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "social"
                ? "bg-white text-slate-900 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Social Card</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("schema")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "schema"
                ? "bg-white text-slate-900 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Schema.org</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tags")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "tags"
                ? "bg-white text-slate-900 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Meta Tags</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 space-y-5">
        {/* TAB 1: Google Search Snippet Simulation */}
        {activeTab === "google" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Live Search Snippet Preview</span>
              <span className="text-[11px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                ✓ Optimized for Google Algeria & Global Search
              </span>
            </div>

            {/* Google Result Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs max-w-2xl space-y-1.5">
              {/* Site Identity & Breadcrumbs */}
              <div className="flex items-center gap-2 text-[12px] text-slate-700">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-[11px] shrink-0 overflow-hidden">
                  {store.logo ? (
                    <img src={store.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    "Y"
                  )}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-slate-900 text-[12px]">{store.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {seo.googleSnippet.displayUrl}
                  </span>
                </div>
              </div>

              {/* Clickable Blue Title */}
              <h4 className="text-[17px] font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug pt-1">
                {seo.title}
              </h4>

              {/* Rich snippet description */}
              <p className="text-[13px] text-[#4d5156] leading-relaxed pt-0.5">
                {seo.description}
              </p>

              {/* Sub-links / Rich Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-500 border-t border-slate-100 mt-2 font-medium">
                <span className="flex items-center gap-1 text-slate-700">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  {store.wilaya}, Wilaya {store.wilayaCode}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-700">
                  <Tag className="w-3 h-3 text-amber-500" />
                  {store.categories.join(", ")}
                </span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">
                  ★ {store.rating.toFixed(1)} ({store.reviews?.length || 0} customer reviews)
                </span>
              </div>
            </div>

            {/* Quality Score Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-600">Title Length</span>
                  <span className={`font-mono font-bold ${titleLength >= 30 && titleLength <= 65 ? "text-emerald-600" : "text-amber-600"}`}>
                    {titleLength} / 60 chars
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${titleLength >= 30 && titleLength <= 65 ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(100, (titleLength / 60) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-600">Description Length</span>
                  <span className={`font-mono font-bold ${descLength >= 120 && descLength <= 165 ? "text-emerald-600" : "text-amber-600"}`}>
                    {descLength} / 160 chars
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${descLength >= 120 && descLength <= 165 ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(100, (descLength / 160) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-600">Local Discoverability</span>
                  <span className="font-mono font-bold text-emerald-600">
                    DZ-{store.wilayaCode} Verified
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Geo tags set for {store.wilaya} ({store.coordinates.lat.toFixed(2)}, {store.coordinates.lng.toFixed(2)}).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Social Sharing Card Preview */}
        {activeTab === "social" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">OpenGraph & Twitter Card Preview</span>
              <span className="text-[11px] text-slate-500">Rendered when shared on WhatsApp, Facebook, iMessage, X</span>
            </div>

            <div className="max-w-md mx-auto rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
              <div className="aspect-[1.91/1] w-full bg-slate-900 relative overflow-hidden">
                <img
                  src={seo.ogImage}
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-white font-bold">
                  {seo.siteName}
                </div>
              </div>
              <div className="p-4 space-y-1 text-left">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  {seo.canonicalUrl}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                  {seo.ogTitle}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {seo.ogDescription}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Schema.org JSON-LD Structured Data */}
        {activeTab === "schema" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Schema.org Structured Data (Type: "Store" / "LocalBusiness")
                </span>
                <p className="text-[11px] text-slate-500">
                  Enables Google Knowledge Graph cards, localized maps integration, and direct merchant catalog discovery.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(JSON.stringify(seo.structuredData, null, 2), "schema")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer transition-all"
              >
                {copied === "schema" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === "schema" ? "Copied JSON" : "Copy JSON-LD"}</span>
              </button>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 overflow-x-auto text-[11px] font-mono max-h-72 border border-slate-800">
              <pre>{JSON.stringify(seo.structuredData, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* TAB 4: Raw Meta Tags Inspector */}
        {activeTab === "tags" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800">HTML Head Meta Tags Breakdown</span>
                <p className="text-[11px] text-slate-500">All meta tags automatically injected into the DOM for this storefront.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const tagsHtml = [
                    `<title>${seo.title}</title>`,
                    `<meta name="description" content="${seo.description}" />`,
                    `<meta name="keywords" content="${seo.keywords}" />`,
                    `<meta property="og:title" content="${seo.ogTitle}" />`,
                    `<meta property="og:description" content="${seo.ogDescription}" />`,
                    `<meta property="og:type" content="${seo.ogType}" />`,
                    `<meta property="og:url" content="${seo.ogUrl}" />`,
                    `<meta property="og:image" content="${seo.ogImage}" />`,
                    `<meta name="twitter:card" content="${seo.twitterCard}" />`,
                    `<meta name="geo.region" content="${seo.geo.region}" />`,
                    `<meta name="geo.placename" content="${seo.geo.placename}" />`,
                    `<meta name="geo.position" content="${seo.geo.position}" />`,
                    `<link rel="canonical" href="${seo.canonicalUrl}" />`
                  ].join("\n");
                  handleCopy(tagsHtml, "html");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer transition-all"
              >
                {copied === "html" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === "html" ? "Copied HTML" : "Copy All Tags"}</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-mono text-[10px] text-indigo-600 font-bold block uppercase tracking-wider">&lt;title&gt;</span>
                <p className="font-semibold text-slate-800 mt-0.5">{seo.title}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-mono text-[10px] text-indigo-600 font-bold block uppercase tracking-wider">&lt;meta name="description"&gt;</span>
                <p className="text-slate-700 mt-0.5">{seo.description}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-mono text-[10px] text-indigo-600 font-bold block uppercase tracking-wider">&lt;meta name="keywords"&gt;</span>
                <p className="text-slate-600 mt-0.5 font-mono text-[11px]">{seo.keywords}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-mono text-[10px] text-indigo-600 font-bold block uppercase tracking-wider">Geo Tags</span>
                  <div className="text-[11px] text-slate-600 font-mono mt-1 space-y-0.5">
                    <div>region: {seo.geo.region}</div>
                    <div>placename: {seo.geo.placename}</div>
                    <div>position: {seo.geo.position}</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-mono text-[10px] text-indigo-600 font-bold block uppercase tracking-wider">Canonical Link</span>
                  <p className="text-slate-700 font-mono text-[11px] mt-1 truncate">
                    {seo.canonicalUrl}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
