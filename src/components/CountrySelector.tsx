import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Search, ChevronDown } from "lucide-react";
import { countryCurrencyMapping } from "../currency";
import { getAllMarketConfigs, getMarketByCountryOrCode } from "../utils/globalMarketArchitecture";

interface CountrySelectorProps {
  currentCountry: string;
  onCountryChange: (country: string) => void;
  id?: string;
}

export function CountrySelector({ currentCountry, onCountryChange, id = "country-currency-selector" }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setMarketRefresh] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    const handleArchUpdate = () => setMarketRefresh((v) => v + 1);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("yume-global-architecture-updated", handleArchUpdate);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("yume-global-architecture-updated", handleArchUpdate);
    };
  }, []);

  const activeMarket = getMarketByCountryOrCode(currentCountry);
  const activeConfig = countryCurrencyMapping[currentCountry] || {
    currency: activeMarket.currencyCode,
    symbol: activeMarket.currencySymbol,
    locale: activeMarket.locale,
    flag: activeMarket.flag,
    isRTL: activeMarket.locale.startsWith("ar"),
  };

  const mergedCountryEntries = React.useMemo(() => {
    const entries = new Map<string, { currency: string; symbol: string; locale: string; flag: string; marketCode: string }>();
    const activeMarkets = getAllMarketConfigs().filter((m) => m.isActive);
    for (const m of activeMarkets) {
      const mapped = countryCurrencyMapping[m.countryName];
      entries.set(m.countryName, {
        currency: mapped?.currency || m.currencyCode,
        symbol: mapped?.symbol || m.currencySymbol,
        locale: mapped?.locale || m.locale,
        flag: mapped?.flag || m.flag,
        marketCode: m.id,
      });
    }
    return Array.from(entries.entries());
  }, [isOpen]);

  const filteredCountries = mergedCountryEntries.filter(([countryName, info]) => {
    const query = searchQuery.toLowerCase();
    return (
      countryName.toLowerCase().includes(query) ||
      info.currency.toLowerCase().includes(query) ||
      info.marketCode.toLowerCase().includes(query) ||
      (info.symbol && info.symbol.toLowerCase().includes(query))
    );
  });

  return (
    <div className={`relative ${isOpen ? "z-50" : "z-10"}`} id={id} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 flex items-center gap-1.5 px-3 rounded-full bg-white/15 hover:bg-white/25 active:scale-98 transition-all duration-200 backdrop-blur-xl border border-white/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_1px_3px_rgba(0,0,0,0.12)] cursor-pointer select-none shrink-0"
        title="Select Country / Currency"
      >
        <span className="text-xs font-semibold tracking-tight text-white flex items-center gap-1.5 leading-none">
          <span className="text-[13px] leading-none shrink-0">{activeConfig.flag}</span>
          <span className="shrink-0">{activeConfig.currency}</span>
          <span className="hidden sm:inline shrink-0 text-white/75 font-normal">({activeConfig.symbol})</span>
          <ChevronDown className={`w-3 h-3 text-white/70 ml-0.5 shrink-0 stroke-[2] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop: softly recedes the background ("hides in the back") and provides click-outside dismissal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px] cursor-default"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_48px_-10px_rgba(0,0,0,0.25),0_4px_16px_rgba(0,0,0,0.08)] border border-slate-200/80 dark:border-slate-800 overflow-hidden z-50 flex flex-col p-1.5"
            >
              {/* Search Input */}
              <div className="p-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                <input
                  type="text"
                  placeholder="Search country or currency..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-slate-800/70 rounded-xl px-2.5 py-1.5 border-none outline-none placeholder-slate-400"
                  autoFocus
                />
              </div>

              {/* Header description */}
              <div className="text-[9px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider bg-transparent flex justify-between items-center">
                <span>Country & Currency</span>
                <span className="text-[8px] text-slate-400 font-mono">ISO 4217</span>
              </div>

              {/* List */}
              <div className="max-h-60 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map(([countryName, info]) => {
                    const isSelected = currentCountry === countryName;
                    return (
                      <button
                        key={countryName}
                        type="button"
                        onClick={() => {
                          onCountryChange(countryName);
                          setIsOpen(false);
                          setSearchQuery("");
                        }}
                        className={`w-full text-left px-2.5 py-1.5 text-xs rounded-xl transition-all duration-150 flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                            : "text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base select-none shrink-0">{info.flag}</span>
                          <div className="flex flex-col text-left truncate leading-tight">
                            <span className="font-medium truncate">{countryName}</span>
                            <span className="text-[9px] text-slate-400 font-normal">locale: {info.locale}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {info.currency}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white shrink-0" />}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 font-medium">
                    No matching countries found.
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
