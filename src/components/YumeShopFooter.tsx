import React, { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, ShieldCheck, X, Globe, Check } from "lucide-react";
import { YumeLogo } from "./YumeLogo";
import { Language, detectBrowserLanguage, setLanguageInDOM } from "../translations";
import { setCountry } from "../currency";

export interface FooterLanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const AVAILABLE_FOOTER_LANGUAGES: FooterLanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", flag: "🇩🇿" },
  { code: "fr", label: "French", nativeLabel: "Français", flag: "🇫🇷" },
];

export interface FooterCurrencyOption {
  countryKey: string;
  countryDisplay: string;
  currencyName: string;
  currencyCode: string;
  symbol: string;
  flag: string;
}

export const AVAILABLE_FOOTER_CURRENCIES: FooterCurrencyOption[] = [
  {
    countryKey: "Algeria",
    countryDisplay: "Algeria",
    currencyName: "Algerian Dinar",
    currencyCode: "DZD",
    symbol: "DA",
    flag: "🇩🇿",
  },
  {
    countryKey: "United States",
    countryDisplay: "United States",
    currencyName: "US Dollar",
    currencyCode: "USD",
    symbol: "$",
    flag: "🇺🇸",
  },
  {
    countryKey: "France",
    countryDisplay: "Europe",
    currencyName: "Euro",
    currencyCode: "EUR",
    symbol: "€",
    flag: "🇪🇺",
  },
  {
    countryKey: "United Kingdom",
    countryDisplay: "United Kingdom",
    currencyName: "British Pound",
    currencyCode: "GBP",
    symbol: "£",
    flag: "🇬🇧",
  },
  {
    countryKey: "Saudi Arabia",
    countryDisplay: "Saudi Arabia",
    currencyName: "Saudi Riyal",
    currencyCode: "SAR",
    symbol: "ر.س",
    flag: "🇸🇦",
  },
  {
    countryKey: "UAE",
    countryDisplay: "UAE",
    currencyName: "UAE Dirham",
    currencyCode: "AED",
    symbol: "د.إ",
    flag: "🇦🇪",
  },
  {
    countryKey: "Canada",
    countryDisplay: "Canada",
    currencyName: "Canadian Dollar",
    currencyCode: "CAD",
    symbol: "CA$",
    flag: "🇨🇦",
  },
  {
    countryKey: "Morocco",
    countryDisplay: "Morocco",
    currencyName: "Moroccan Dirham",
    currencyCode: "MAD",
    symbol: "د.م.",
    flag: "🇲🇦",
  },
  {
    countryKey: "Tunisia",
    countryDisplay: "Tunisia",
    currencyName: "Tunisian Dinar",
    currencyCode: "TND",
    symbol: "د.ت",
    flag: "🇹🇳",
  },
];

interface YumeShopFooterProps {
  currentSlideColor?: string;
  buttonColor?: string;
  darkMode?: boolean;
  storeName?: string;
  storeWilaya?: string;
  currentLanguage?: Language;
  onLanguageChange?: (lang: Language) => void;
  currentCountry?: string;
  onCountryChange?: (country: string) => void;
  onOpenStoreProfile?: () => void;
  onOpenTerms?: () => void;
  onOpenTrackOrder?: () => void;
  onOpenMerchantPortal?: () => void;
  scrollContainerId?: string;
}

export const YumeShopFooter: React.FC<YumeShopFooterProps> = ({
  currentSlideColor = "#4a0a26",
  buttonColor,
  darkMode = false,
  storeName,
  storeWilaya,
  currentLanguage: propLanguage,
  onLanguageChange,
  currentCountry: propCountry,
  onCountryChange,
  onOpenStoreProfile,
  onOpenTerms,
  onOpenTrackOrder,
  onOpenMerchantPortal,
  scrollContainerId,
}) => {
  const [activeLang, setActiveLang] = useState<Language>(() =>
    propLanguage || detectBrowserLanguage()
  );
  const [activeCountry, setActiveCountry] = useState<string>(() => {
    if (propCountry) return propCountry;
    try {
      return localStorage.getItem("dz_country") || "Algeria";
    } catch {
      return "Algeria";
    }
  });

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [activeInfoSheet, setActiveInfoSheet] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const langDropdownRef = useRef<HTMLDivElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propLanguage) {
      setActiveLang(propLanguage);
    }
  }, [propLanguage]);

  useEffect(() => {
    if (propCountry) {
      setActiveCountry(propCountry);
    }
  }, [propCountry]);

  useEffect(() => {
    const onLangEvent = (e: Event) => {
      const custom = e as CustomEvent<Language>;
      if (custom.detail) {
        setActiveLang(custom.detail);
      }
    };
    const onCountryEvent = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) {
        setActiveCountry(custom.detail);
      }
    };
    window.addEventListener("yume-language-change", onLangEvent);
    window.addEventListener("yume-country-change", onCountryEvent);
    return () => {
      window.removeEventListener("yume-language-change", onLangEvent);
      window.removeEventListener("yume-country-change", onCountryEvent);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLangDropdownOpen(false);
      }
      if (
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLanguage = (lang: Language) => {
    setActiveLang(lang);
    setLanguageInDOM(lang);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
    setIsLangDropdownOpen(false);
  };

  const handleSelectCurrency = (countryKey: string) => {
    setActiveCountry(countryKey);
    setCountry(countryKey);
    if (onCountryChange) {
      onCountryChange(countryKey);
    }
    setIsCurrencyDropdownOpen(false);
  };

  const currentLangOption =
    AVAILABLE_FOOTER_LANGUAGES.find((l) => l.code === activeLang) ||
    AVAILABLE_FOOTER_LANGUAGES[0];

  const currentCurrencyOption =
    AVAILABLE_FOOTER_CURRENCIES.find((c) => c.countryKey === activeCountry) ||
    AVAILABLE_FOOTER_CURRENCIES[0];

  const effectiveButtonColor =
    buttonColor ||
    `var(--yume-theme-header-color, ${currentSlideColor || "#4a0a26"})`;
  const rawAccentHex = buttonColor || currentSlideColor || "#4a0a26";

  const handleBackToTop = () => {
    if (scrollContainerId) {
      const container = document.getElementById(scrollContainerId);
      if (container) {
        container.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    const modalRoot = document.getElementById("product-preview-modal-root");
    if (modalRoot) {
      modalRoot.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLinkClick = (
    title: string,
    description: string,
    customAction?: () => void
  ) => {
    if (customAction) {
      customAction();
      return;
    }
    setActiveInfoSheet({ title, description });
  };

  // Gradient blending the page background (#ffffff / #0f172a) with the primary button/theme color of each page
  const footerGradient = darkMode
    ? `linear-gradient(180deg, #0f172a 0%, color-mix(in srgb, ${effectiveButtonColor} 16%, #0f172a) 55%, color-mix(in srgb, ${effectiveButtonColor} 36%, #0f172a) 100%)`
    : `linear-gradient(180deg, #ffffff 0%, color-mix(in srgb, ${effectiveButtonColor} 6%, #ffffff) 45%, color-mix(in srgb, ${effectiveButtonColor} 18%, #ffffff) 80%, color-mix(in srgb, ${effectiveButtonColor} 30%, #ffffff) 100%)`;

  return (
    <footer
      className={`w-full select-none shrink-0 mt-auto relative overflow-visible font-sans ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
      style={{
        background: footerGradient,
        borderTop: darkMode
          ? "1px solid rgba(255, 255, 255, 0.08)"
          : `1px solid color-mix(in srgb, ${effectiveButtonColor} 14%, #e2e8f0)`,
        transition:
          "background 700ms cubic-bezier(0.4, 0, 0.2, 1), border-color 700ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* 1. Amazon-inspired "Back to top" subtle full-width bar blended with the page button color */}
      <button
        type="button"
        onClick={handleBackToTop}
        className="w-full py-2.5 px-4 text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer focus:outline-none hover:opacity-90"
        style={{
          background: darkMode
            ? `linear-gradient(90deg, transparent 0%, color-mix(in srgb, ${effectiveButtonColor} 22%, #1e293b) 50%, transparent 100%)`
            : `linear-gradient(90deg, #ffffff 0%, color-mix(in srgb, ${effectiveButtonColor} 10%, #ffffff) 50%, #ffffff 100%)`,
          borderBottom: darkMode
            ? "1px solid rgba(255,255,255,0.06)"
            : `1px solid color-mix(in srgb, ${effectiveButtonColor} 12%, #f1f5f9)`,
          color: darkMode ? "#f8fafc" : rawAccentHex,
        }}
      >
        <span>
          {activeLang === "ar"
            ? "العودة إلى الأعلى"
            : activeLang === "fr"
            ? "Retour en haut"
            : "Back to top"}
        </span>
        <ChevronUp className="w-3.5 h-3.5" />
      </button>

      {/* 2. Main Shop.app Asymmetrical Content Container */}
      <div className="max-w-[1620px] mx-auto px-6 sm:px-10 lg:px-12 pt-12 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* LEFT BRAND COLUMN (Shop.app QR + Inspiring Yume Logo + Tagline) */}
          <div className="lg:col-span-4 space-y-4 text-left">
            <div className="space-y-4">
              {/* Shop.app Style Rounded Dark QR Code Badge with Centered Inspiring Yume Emblem */}
              <div
                onClick={() =>
                  handleLinkClick(
                    "Get the Yume Mobile Experience",
                    "Scan this QR code with your phone camera to browse verified boutiques, get real-time price-drop alerts, and track your Cash on Delivery shipments anywhere."
                  )
                }
                className="w-24 h-24 rounded-[20px] bg-slate-950 p-2 shadow-md border border-slate-800/80 inline-flex items-center justify-center relative cursor-pointer hover:scale-105 transition-transform duration-200 group"
                title="Scan to get the Yume App"
              >
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full text-white"
                  fill="currentColor"
                >
                  {/* Top-Left Finder Pattern */}
                  <path d="M6,6 h26 v26 h-26 z M11,11 v16 h16 v-16 z M15,15 h8 v8 h-8 z" />
                  {/* Top-Right Finder Pattern */}
                  <path d="M68,6 h26 v26 h-26 z M73,11 v16 h16 v-16 z M77,15 h8 v8 h-8 z" />
                  {/* Bottom-Left Finder Pattern */}
                  <path d="M6,68 h26 v26 h-26 z M11,73 v16 h16 v-16 z M15,77 h8 v8 h-8 z" />
                  {/* QR Matrix Modules */}
                  <rect x="37" y="8" width="5" height="5" rx="1.5" />
                  <rect x="45" y="8" width="8" height="5" rx="1.5" />
                  <rect x="57" y="8" width="5" height="5" rx="1.5" />
                  <rect x="37" y="16" width="5" height="9" rx="1.5" />
                  <rect x="46" y="18" width="5" height="5" rx="1.5" />
                  <rect x="55" y="15" width="8" height="5" rx="1.5" />
                  <rect x="37" y="28" width="8" height="5" rx="1.5" />
                  <rect x="49" y="26" width="5" height="6" rx="1.5" />
                  <rect x="58" y="24" width="5" height="8" rx="1.5" />

                  <rect x="8" y="37" width="5" height="8" rx="1.5" />
                  <rect x="16" y="37" width="8" height="5" rx="1.5" />
                  <rect x="27" y="37" width="5" height="6" rx="1.5" />
                  <rect x="8" y="49" width="8" height="5" rx="1.5" />
                  <rect x="20" y="46" width="5" height="8" rx="1.5" />
                  <rect x="28" y="48" width="5" height="5" rx="1.5" />
                  <rect x="8" y="58" width="5" height="5" rx="1.5" />
                  <rect x="17" y="58" width="11" height="5" rx="1.5" />

                  <rect x="68" y="37" width="5" height="6" rx="1.5" />
                  <rect x="77" y="37" width="8" height="5" rx="1.5" />
                  <rect x="88" y="37" width="6" height="9" rx="1.5" />
                  <rect x="68" y="47" width="7" height="5" rx="1.5" />
                  <rect x="79" y="46" width="5" height="8" rx="1.5" />
                  <rect x="88" y="50" width="6" height="5" rx="1.5" />
                  <rect x="68" y="56" width="5" height="8" rx="1.5" />
                  <rect x="77" y="58" width="9" height="5" rx="1.5" />

                  <rect x="37" y="68" width="6" height="5" rx="1.5" />
                  <rect x="47" y="68" width="8" height="5" rx="1.5" />
                  <rect x="59" y="68" width="5" height="9" rx="1.5" />
                  <rect x="37" y="77" width="5" height="8" rx="1.5" />
                  <rect x="46" y="76" width="5" height="5" rx="1.5" />
                  <rect x="54" y="80" width="8" height="5" rx="1.5" />
                  <rect x="37" y="88" width="10" height="6" rx="1.5" />
                  <rect x="51" y="88" width="6" height="6" rx="1.5" />

                  <rect x="68" y="68" width="8" height="5" rx="1.5" />
                  <rect x="80" y="68" width="5" height="8" rx="1.5" />
                  <rect x="89" y="68" width="5" height="5" rx="1.5" />
                  <rect x="68" y="77" width="5" height="9" rx="1.5" />
                  <rect x="76" y="80" width="8" height="5" rx="1.5" />
                  <rect x="88" y="77" width="6" height="9" rx="1.5" />
                  <rect x="68" y="89" width="10" height="5" rx="1.5" />
                  <rect x="82" y="89" width="12" height="5" rx="1.5" />

                  {/* Center QR Matrix Modules (Clean full QR pattern without logo) */}
                  <rect x="37" y="37" width="6" height="6" rx="1.5" />
                  <rect x="47" y="37" width="5" height="7" rx="1.5" />
                  <rect x="56" y="37" width="7" height="5" rx="1.5" />
                  <rect x="37" y="47" width="7" height="5" rx="1.5" />
                  <rect x="48" y="48" width="6" height="6" rx="1.5" />
                  <rect x="58" y="46" width="5" height="7" rx="1.5" />
                  <rect x="37" y="56" width="5" height="7" rx="1.5" />
                  <rect x="46" y="58" width="8" height="5" rx="1.5" />
                  <rect x="58" y="57" width="5" height="6" rx="1.5" />
                </svg>
              </div>

              {/* Inspiring Yume Brand Logo & Tagline */}
              <div className="space-y-2 pt-1">
                <YumeLogo
                  variant="full"
                  size="xl"
                  theme={darkMode ? "dark" : "light"}
                  accentColor={rawAccentHex}
                  onClick={handleBackToTop}
                />
                <p
                  className={`text-[13.5px] font-medium tracking-tight ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  From Design to Desire
                </p>
                {storeName && (
                  <div
                    className={`pt-1 flex items-center gap-2 text-xs ${
                      darkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    <span>Viewing boutique:</span>
                    <button
                      type="button"
                      onClick={onOpenStoreProfile}
                      className="font-bold underline underline-offset-4 hover:opacity-80 transition-all cursor-pointer"
                      style={{ color: darkMode ? "#ffffff" : rawAccentHex }}
                    >
                      {storeName}
                    </button>
                    {storeWilaya && (
                      <span className="opacity-75">· {storeWilaya}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT NAVIGATION COLUMNS (Shop.app Clean Typography + Amazon/Temu E-Commerce Links) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 text-left">
            {/* Column 1: Learn more */}
            <div className="space-y-3.5">
              <h4
                className={`text-[13px] font-bold tracking-tight ${
                  darkMode ? "text-white" : "text-slate-950"
                }`}
              >
                {activeLang === "ar"
                  ? "اعرف المزيد"
                  : activeLang === "fr"
                  ? "En savoir plus"
                  : "Learn more"}
              </h4>
              <ul
                className={`space-y-2.5 text-[13px] font-medium ${
                  darkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(
                        "What is Yume?",
                        "Yume is a modern discovery & social commerce marketplace connecting shoppers directly with verified local boutiques, artisans, and independent brands."
                      )
                    }
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    {activeLang === "ar"
                      ? "ما هي منصة يومي؟"
                      : activeLang === "fr"
                      ? "Qu'est-ce que Yume ?"
                      : "What is Yume?"}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(
                        "Why trust Yume?",
                        "Every merchant on Yume undergoes identity verification. With Cash on Delivery (Paiement à la livraison), you inspect your package upon arrival before paying."
                      )
                    }
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    {activeLang === "ar"
                      ? "لماذا تثق في يومي؟"
                      : activeLang === "fr"
                      ? "Pourquoi faire confiance à Yume ?"
                      : "Why trust Yume?"}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(
                        "Yume Purchase Protection",
                        "Shop confidently knowing that if an item arrives damaged or differs from its description, our 7-day return & replacement guarantee protects your purchase."
                      )
                    }
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    {activeLang === "ar"
                      ? "حماية المشتريات"
                      : activeLang === "fr"
                      ? "Protection des achats"
                      : "Purchase Protection"}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(
                        "Help Center & FAQ",
                        "Find answers on how to place an Express Checkout order, calculate state shipping rates, apply promo codes, and contact merchants directly."
                      )
                    }
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    {activeLang === "ar"
                      ? "مركز المساعدة"
                      : activeLang === "fr"
                      ? "Centre d'aide"
                      : "Help center"}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Get started */}
            <div className="space-y-3.5">
              <h4
                className={`text-[13px] font-bold tracking-tight ${
                  darkMode ? "text-white" : "text-slate-950"
                }`}
              >
                {activeLang === "ar"
                  ? "ابدأ معنا"
                  : activeLang === "fr"
                  ? "Commencer"
                  : "Get started"}
              </h4>
              <ul
                className={`space-y-2.5 text-[13px] font-medium ${
                  darkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(
                        "Yume for Brands & Boutiques",
                        "Launch your custom interactive storefront on Yume with built-in bundle offers, flash sale timers, video reels, and automated courier integration.",
                        onOpenMerchantPortal
                      )
                    }
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    {activeLang === "ar"
                      ? "للعلامات التجارية"
                      : activeLang === "fr"
                      ? "Pour les marques"
                      : "For brands"}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(
                        "Creator & Affiliate Program",
                        "Share products and video reels from verified Yume boutiques and earn commission on every confirmed Cash on Delivery order."
                      )
                    }
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    {activeLang === "ar"
                      ? "لصناع المحتوى"
                      : activeLang === "fr"
                      ? "Pour les créateurs"
                      : "For creators"}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(
                        "Delivery & Courier Partners",
                        "Integrated with Yalidine Express, ZR Express, Maystro Delivery, and regional couriers with All States Coverage for fast 24–48h delivery."
                      )
                    }
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    {activeLang === "ar"
                      ? "لشركات التوصيل"
                      : activeLang === "fr"
                      ? "Pour les livreurs"
                      : "For couriers"}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(
                        "Build Your Store",
                        "Open your merchant workspace in minutes. Upload products, configure quantity discounts, and start receiving orders today.",
                        onOpenMerchantPortal
                      )
                    }
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    {activeLang === "ar"
                      ? "أنشئ متجرك"
                      : activeLang === "fr"
                      ? "Créer votre boutique"
                      : "Build your store"}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer service */}
            <div className="space-y-3.5">
              <h4
                className={`text-[13px] font-bold tracking-tight ${
                  darkMode ? "text-white" : "text-slate-950"
                }`}
              >
                {activeLang === "ar"
                  ? "خدمة العملاء"
                  : activeLang === "fr"
                  ? "Service client"
                  : "Customer service"}
              </h4>
              <ul
                className={`space-y-2.5 text-[13px] font-medium ${
                  darkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(
                        "Track Your Order",
                        "Track your shipment status in real time from merchant dispatch to Home Delivery or Stop Desk pickup.",
                        onOpenTrackOrder
                      )
                    }
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    {activeLang === "ar"
                      ? "تتبع الطلبات"
                      : activeLang === "fr"
                      ? "Suivre mes commandes"
                      : "Track orders"}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(
                        "Shipping Rates & Policies",
                        "Choose between Home Delivery (À domicile) and Stop Desk pickup with All States Coverage. Rates are calculated transparently before checkout."
                      )
                    }
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    {activeLang === "ar"
                      ? "معلومات الشحن"
                      : activeLang === "fr"
                      ? "Infos livraison"
                      : "Shipping info"}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(
                        "Return & Refund Policy",
                        "Items can be exchanged or returned within 3 to 7 days of delivery in their original condition. Defective or incorrect items are replaced free of charge.",
                        onOpenTerms
                      )
                    }
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    {activeLang === "ar"
                      ? "سياسة الإرجاع والاسترداد"
                      : activeLang === "fr"
                      ? "Politique de retour"
                      : "Return & refund policy"}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(
                        "Price-Drop & Stock Alerts",
                        "Enable notifications on any product to get alerted immediately when a merchant launches a Flash Sale or restocks sold-out colors."
                      )
                    }
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    {activeLang === "ar"
                      ? "تنبيهات تخفيض الأسعار"
                      : activeLang === "fr"
                      ? "Alertes baisse de prix"
                      : "Price-drop alerts"}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Social */}
            <div className="space-y-3.5">
              <h4
                className={`text-[13px] font-bold tracking-tight ${
                  darkMode ? "text-white" : "text-slate-950"
                }`}
              >
                {activeLang === "ar"
                  ? "التواصل الاجتماعي"
                  : activeLang === "fr"
                  ? "Réseaux sociaux"
                  : "Social"}
              </h4>
              <ul
                className={`space-y-2.5 text-[13px] font-medium ${
                  darkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <li>
                  <a
                    href="#instagram"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(
                        "Yume on Instagram",
                        "Follow @yume.app on Instagram for daily boutique spotlights, artisan stories, and exclusive promo codes."
                      );
                    }}
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer inline-block"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="#tiktok"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(
                        "Yume on TikTok",
                        "Watch live product unboxings and trending merchant reels on @yume.app TikTok."
                      );
                    }}
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer inline-block"
                  >
                    TikTok
                  </a>
                </li>
                <li>
                  <a
                    href="#facebook"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(
                        "Yume Community on Facebook",
                        "Join our verified shopper & merchant community on Facebook."
                      );
                    }}
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer inline-block"
                  >
                    Facebook
                  </a>
                </li>
                <li>
                  <a
                    href="#x"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(
                        "Yume on X",
                        "Stay updated with platform announcements and new regional features on X."
                      );
                    }}
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer inline-block"
                  >
                    X (Twitter)
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 5: Legal (Shop.app style with Privacy Choices pill icon) */}
            <div className="space-y-3.5">
              <h4
                className={`text-[13px] font-bold tracking-tight ${
                  darkMode ? "text-white" : "text-slate-950"
                }`}
              >
                {activeLang === "ar"
                  ? "القانونية"
                  : activeLang === "fr"
                  ? "Mentions légales"
                  : "Legal"}
              </h4>
              <ul
                className={`space-y-2.5 text-[13px] font-medium ${
                  darkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(
                        "Terms of Service",
                        "All orders placed through Yume are governed by our transparent Cash on Delivery and merchant fulfillment standards.",
                        onOpenTerms
                      )
                    }
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    {activeLang === "ar"
                      ? "شروط الخدمة"
                      : activeLang === "fr"
                      ? "Conditions d'utilisation"
                      : "Terms of Service"}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(
                        "Privacy Policy",
                        "Your personal delivery details (Name, Phone Number, State & Commune) are strictly encrypted and used solely to fulfill your orders.",
                        onOpenTerms
                      )
                    }
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    {activeLang === "ar"
                      ? "سياسة الخصوصية"
                      : activeLang === "fr"
                      ? "Politique de confidentialité"
                      : "Privacy Policy"}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(
                        "Your Privacy Choices",
                        "You have full control over your data, cookie preferences, and personalized product recommendations on Yume."
                      )
                    }
                    className="hover:underline underline-offset-4 transition-colors cursor-pointer text-left inline-flex items-center gap-1.5 flex-wrap"
                  >
                    <span>
                      {activeLang === "ar"
                        ? "خيارات الخصوصية"
                        : activeLang === "fr"
                        ? "Vos choix de confidentialité"
                        : "Your Privacy Choices"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[#0066FF] border border-[#0052CC] px-1 py-0.5 h-3.5 shadow-2xs shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-white text-[#0066FF] flex items-center justify-center text-[7px] font-black leading-none">
                        ✓
                      </span>
                      <span className="text-[7px] font-black text-white pl-1 pr-0.5 leading-none">
                        ×
                      </span>
                    </span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Apps & Payment Methods Bar — Phone Apps facing Payment Methods (Transferred to green circle area) */}
        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Left: Phone Apps (App Store & Google Play Badges) */}
          <div className="flex flex-wrap items-start gap-3">
            {/* Apple App Store Badge + Subtle Coming Soon Label */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  handleLinkClick(
                    "Yume for iOS (App Store) — Coming Soon",
                    "Get instant price-drop notifications, live courier tracking, and 1-tap Cash on Delivery ordering on iPhone and iPad."
                  )
                }
                className={`h-11 px-4 rounded-xl flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-2xs border ${
                  darkMode
                    ? "bg-slate-900 hover:bg-slate-800 text-white border-slate-700"
                    : "bg-white hover:bg-slate-50 text-slate-950 border-slate-900/80"
                }`}
              >
                <svg
                  className="w-5 h-5 fill-current shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.96 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
                </svg>
                <div className="text-left leading-none">
                  <span className="block text-[9px] font-medium opacity-75 tracking-tight">
                    Download on the
                  </span>
                  <span className="block text-[13px] font-bold tracking-tight mt-0.5">
                    App Store
                  </span>
                </div>
              </button>
              <span
                className={`text-[10px] font-medium tracking-wide ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Coming Soon
              </span>
            </div>

            {/* Google Play Badge + Subtle Coming Soon Label */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  handleLinkClick(
                    "Yume for Android (Google Play) — Coming Soon",
                    "Explore local & international storefronts, compare verified products, and track orders in real time on Android."
                  )
                }
                className={`h-11 px-4 rounded-xl flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-2xs border ${
                  darkMode
                    ? "bg-slate-900 hover:bg-slate-800 text-white border-slate-700"
                    : "bg-white hover:bg-slate-50 text-slate-950 border-slate-900/80"
                }`}
              >
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M3.61 1.814L13.793 12 3.61 22.186a1.96 1.96 0 0 1-.61-1.425V3.239c0-.547.224-1.055.61-1.425z"
                  />
                  <path
                    fill="#34A853"
                    d="M17.218 8.575L13.793 12l-10.183-10.186c.424-.406 1.072-.512 1.662-.172l11.946 6.933z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M20.793 10.649c.81.47.81 1.632 0 2.102l-3.575 2.074L13.793 12l3.425-3.425 3.575 2.074z"
                  />
                  <path
                    fill="#EA4335"
                    d="M17.218 15.425L5.272 22.358c-.59.34-1.238.234-1.662-.172L13.793 12l3.425 3.425z"
                  />
                </svg>
                <div className="text-left leading-none">
                  <span className="block text-[8.5px] uppercase font-semibold opacity-75 tracking-wider">
                    GET IT ON
                  </span>
                  <span className="block text-[13px] font-bold tracking-tight mt-0.5">
                    Google Play
                  </span>
                </div>
              </button>
              <span
                className={`text-[10px] font-medium tracking-wide ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Coming Soon
              </span>
            </div>
          </div>

          {/* Right: Payment Methods (Facing Phone Apps) */}
          <div className="flex flex-wrap items-start sm:items-center gap-3 sm:gap-3.5">
            {/* 1. Cash on Delivery (COD) — Standalone Circular Badge on Transparent Background (No White Card) */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="h-11 sm:h-12 flex items-center justify-center bg-transparent transition-transform hover:scale-105"
                title="Cash on Delivery — Available"
              >
                <img
                  src="assets/aistudio/cod_icon_circular_transparent.png"
                  alt="Cash on Delivery"
                  className="h-10 w-10 sm:h-11 sm:w-11 object-contain rounded-full select-none drop-shadow-2xs"
                />
              </div>
              <span
                className={`text-[10px] sm:text-[10.5px] font-bold tracking-wide ${
                  darkMode ? "text-emerald-400" : "text-emerald-700"
                }`}
              >
                Available
              </span>
            </div>

            {/* 2. BaridiMob — Official Logo + Coming Soon */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl flex items-center justify-center border shadow-2xs transition-transform hover:scale-103 ${
                  darkMode
                    ? "bg-white border-white/20"
                    : "bg-white border-slate-900/15"
                }`}
                title="BaridiMob — Coming Soon"
              >
                <img
                  src="assets/aistudio/baridimob_logo_exact.png"
                  alt="BaridiMob"
                  className="h-9 sm:h-10 w-auto object-contain select-none"
                />
              </div>
              <span
                className={`text-[10px] sm:text-[10.5px] font-medium tracking-wide ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Coming Soon
              </span>
            </div>

            {/* 3. Visa — Official Logo + Coming Soon */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl flex items-center justify-center border shadow-2xs transition-transform hover:scale-103 bg-white ${
                  darkMode
                    ? "border-white/20"
                    : "border-slate-900/15"
                }`}
                style={{ backgroundColor: "#ffffff" }}
                title="Visa — Coming Soon"
              >
                <img
                  src="assets/aistudio/visa_icon_exact.png"
                  alt="Visa"
                  className="h-8 sm:h-8.5 w-auto object-contain select-none bg-white mix-blend-multiply"
                />
              </div>
              <span
                className={`text-[10px] sm:text-[10.5px] font-medium tracking-wide ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Coming Soon
              </span>
            </div>

            {/* 4. Mastercard — Official Logo + Coming Soon */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl flex items-center justify-center border shadow-2xs transition-transform hover:scale-103 bg-white ${
                  darkMode
                    ? "border-white/20"
                    : "border-slate-900/15"
                }`}
                style={{ backgroundColor: "#ffffff" }}
                title="Mastercard — Coming Soon"
              >
                <img
                  src="assets/aistudio/mastercard_icon_exact.png"
                  alt="Mastercard"
                  className="h-8 sm:h-8.5 w-auto object-contain select-none bg-white mix-blend-multiply"
                />
              </div>
              <span
                className={`text-[10px] sm:text-[10.5px] font-medium tracking-wide ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Coming Soon
              </span>
            </div>
          </div>
        </div>

        {/* 3. Subtle Security & Delivery Trust Bar */}
        <div
          className={`mt-10 pt-6 border-t flex flex-wrap items-center gap-2 text-[11px] font-medium ${
            darkMode ? "border-white/10 text-slate-300" : "border-slate-900/10 text-slate-600"
          }`}
        >
          <span
            className={`font-bold mr-1 flex items-center gap-1 ${
              darkMode ? "text-white" : "text-slate-900"
            }`}
          >
            <ShieldCheck
              className="w-3.5 h-3.5"
              style={{ color: rawAccentHex }}
            />
            Security & Delivery:
          </span>
          <span>Verified Boutiques</span>
          <span aria-hidden="true">·</span>
          <span>All States Coverage</span>
          <span aria-hidden="true">·</span>
          <span>24–48h Express Dispatch</span>
          <span aria-hidden="true">·</span>
          <span>Inspect Upon Arrival</span>
        </div>

        {/* 4. Bottom Copyright, Functional Language/Currency Dropdowns & "Powered by yume" Row */}
        <div
          className={`mt-6 pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs ${
            darkMode
              ? "border-white/10 text-slate-300"
              : "border-slate-900/10 text-slate-600"
          }`}
        >
          {/* Left: Copyright + Functional Language Dropdown + Functional Currency Dropdown */}
          <div className="flex flex-wrap items-center gap-5">
            <span className="font-medium">
              © Yume Inc. {new Date().getFullYear()}
            </span>

            {/* Functional Language Dropdown Selector (English, العربية, Français) */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsLangDropdownOpen((prev) => !prev);
                  setIsCurrencyDropdownOpen(false);
                }}
                className="hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1.5 font-medium py-1 px-2 -mx-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                title="Select Website Language"
              >
                <Globe className="w-3.5 h-3.5 opacity-75" />
                <span>
                  Language:{" "}
                  <strong
                    className={`font-semibold ${
                      darkMode ? "text-white" : "text-slate-950"
                    }`}
                  >
                    {currentLangOption.nativeLabel}
                  </strong>
                </span>
                <ChevronDown
                  className={`w-3 h-3 opacity-70 transition-transform duration-200 ${
                    isLangDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-1.5 z-50 text-left">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Website Language
                  </div>
                  {AVAILABLE_FOOTER_LANGUAGES.map((langOpt) => {
                    const isSelected = activeLang === langOpt.code;
                    return (
                      <button
                        key={langOpt.code}
                        type="button"
                        onClick={() => handleSelectLanguage(langOpt.code)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm leading-none">
                            {langOpt.flag}
                          </span>
                          <span>{langOpt.nativeLabel}</span>
                        </span>
                        {isSelected && (
                          <Check
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: rawAccentHex }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Functional Currency Dropdown Selector (Algeria · Algerian Dinar + international currencies) */}
            <div className="relative" ref={currencyDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsCurrencyDropdownOpen((prev) => !prev);
                  setIsLangDropdownOpen(false);
                }}
                className={`hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1.5 font-medium py-1 px-2 -mx-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 ${
                  darkMode ? "text-slate-200" : "text-slate-700"
                }`}
                title="Select Currency"
              >
                <span>
                  {currentCurrencyOption.countryDisplay} ·{" "}
                  <strong
                    className={`font-semibold ${
                      darkMode ? "text-white" : "text-slate-950"
                    }`}
                  >
                    {currentCurrencyOption.currencyName}
                  </strong>
                </span>
                <ChevronDown
                  className={`w-3 h-3 opacity-70 transition-transform duration-200 ${
                    isCurrencyDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isCurrencyDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-1.5 z-50 text-left">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Region & Currency
                  </div>
                  {AVAILABLE_FOOTER_CURRENCIES.map((currOpt) => {
                    const isSelected = activeCountry === currOpt.countryKey;
                    return (
                      <button
                        key={currOpt.countryKey}
                        type="button"
                        onClick={() => handleSelectCurrency(currOpt.countryKey)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="text-sm leading-none shrink-0">
                            {currOpt.flag}
                          </span>
                          <span className="truncate">
                            {currOpt.countryDisplay} · {currOpt.currencyName}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                            {currOpt.symbol}
                          </span>
                          {isSelected && (
                            <Check
                              className="w-3.5 h-3.5 shrink-0"
                              style={{ color: rawAccentHex }}
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Shop.app style "Powered by [y✦] yume" + Creator credit */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center gap-1.5 font-semibold text-xs">
              <span className="font-medium opacity-80">Powered by</span>
              <YumeLogo
                variant="compact"
                theme={darkMode ? "dark" : "light"}
                accentColor={rawAccentHex}
              />
            </div>
            <span className="opacity-35" aria-hidden="true">
              |
            </span>
            <span
              className="text-[10.5px] font-mono font-bold tracking-wide"
              style={{ color: darkMode ? "#fcd34d" : rawAccentHex }}
            >
              HAKIM BENSAHA - RUKAWA-
            </span>
          </div>
        </div>
      </div>

      {/* Lightweight Info Sheet Modal when clicking informational footer links */}
      {activeInfoSheet && (
        <div
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveInfoSheet(null)}
        >
          <div
            className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <YumeLogo
                  variant="emblem"
                  size="sm"
                  accentColor={rawAccentHex}
                />
                <h3 className="text-base font-extrabold text-slate-900">
                  {activeInfoSheet.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveInfoSheet(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {activeInfoSheet.description}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveInfoSheet(null)}
                className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer transition-opacity hover:opacity-90"
                style={{ backgroundColor: rawAccentHex }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default YumeShopFooter;
