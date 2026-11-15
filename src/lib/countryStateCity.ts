import { Country, State, City, ICountry, IState, ICity } from "country-state-city";
import algeriaWilayasCommunesData from "../data/algeriaWilayasCommunes.json";

export interface CountryOption {
  code: string; // ISO 2 code e.g. "DZ", "US", "FR"
  name: string; // e.g. "Algeria", "United States"
  currency: string; // e.g. "DZD", "USD", "EUR"
  currencySymbol?: string;
  flag?: string;
  phonecode?: string;
}

export interface StateOption {
  code: string; // ISO code or Wilaya ID e.g. "06", "CA", "IDF"
  name: string; // e.g. "Bejaia", "California"
  formattedName: string; // e.g. "06 - Bejaia"
  countryCode: string;
}

export interface CityOption {
  code: string; // City name or code
  name: string; // e.g. "Bejaia", "Los Angeles"
  stateCode: string;
  countryCode: string;
}

export interface OfficialAlgeriaCommune {
  ascii: string;
  arabic: string;
}

export interface OfficialAlgeriaWilaya {
  code: number;
  ascii: string;
  arabic: string;
  communes: OfficialAlgeriaCommune[];
}

const OFFICIAL_ALGERIA_DATA: OfficialAlgeriaWilaya[] = algeriaWilayasCommunesData as OfficialAlgeriaWilaya[];

// Complete 69 Wilayas for Algeria with padded codes 01 - 69 (Official Administrative Division)
export const ALGERIA_69_WILAYAS: StateOption[] = OFFICIAL_ALGERIA_DATA.map((w) => {
  const paddedCode = String(w.code).padStart(2, "0");
  return {
    code: paddedCode,
    name: w.ascii,
    formattedName: `${paddedCode} - ${w.ascii}`,
    countryCode: "DZ",
  };
});

// Alias kept for backwards compatibility across components
export const ALGERIA_58_WILAYAS: StateOption[] = ALGERIA_69_WILAYAS;

// Complete 1,541 communes mapping across all 69 Wilayas of Algeria
export const ALGERIA_COMMUNES_MAP: Record<string, string[]> = OFFICIAL_ALGERIA_DATA.reduce(
  (acc, w) => {
    const paddedCode = String(w.code).padStart(2, "0");
    acc[paddedCode] = w.communes.map((c) => c.ascii);
    return acc;
  },
  {} as Record<string, string[]>
);

// Local Caching Engine
const memoryCache = {
  countries: null as CountryOption[] | null,
  states: new Map<string, StateOption[]>(),
  cities: new Map<string, CityOption[]>(),
};

/**
 * Get all worldwide countries formatted cleanly
 */
export function getWorldwideCountries(): CountryOption[] {
  if (memoryCache.countries) {
    return memoryCache.countries;
  }

  try {
    const rawCountries = Country.getAllCountries();
    const formatted: CountryOption[] = rawCountries.map((c: ICountry) => {
      let currencyName = c.currency || "USD";
      if (c.isoCode === "DZ") currencyName = "DA";

      return {
        code: c.isoCode,
        name: c.name,
        currency: currencyName,
        currencySymbol: c.currency || "$",
        flag: c.flag,
        phonecode: c.phonecode,
      };
    });

    // Ensure Algeria is prominently featured or listed cleanly
    const algeriaIndex = formatted.findIndex((c) => c.code === "DZ");
    if (algeriaIndex !== -1) {
      formatted[algeriaIndex].currency = "DA";
    }

    memoryCache.countries = formatted;
    return formatted;
  } catch (err) {
    console.warn("Fallback to basic country list:", err);
    const fallbackList: CountryOption[] = [
      { code: "DZ", name: "Algeria", currency: "DA" },
      { code: "FR", name: "France", currency: "EUR" },
      { code: "TN", name: "Tunisia", currency: "TND" },
      { code: "MA", name: "Morocco", currency: "MAD" },
      { code: "US", name: "United States", currency: "USD" },
      { code: "CA", name: "Canada", currency: "CAD" },
      { code: "GB", name: "United Kingdom", currency: "GBP" },
      { code: "AE", name: "United Arab Emirates", currency: "AED" },
      { code: "SA", name: "Saudi Arabia", currency: "SAR" },
    ];
    memoryCache.countries = fallbackList;
    return fallbackList;
  }
}

/**
 * Get States or Wilayas for a specific Country
 */
export function getStatesByCountryCode(countryCode: string): StateOption[] {
  const upperCode = (countryCode || "DZ").toUpperCase();

  if (memoryCache.states.has(upperCode)) {
    return memoryCache.states.get(upperCode)!;
  }

  // Special handling for Algeria -> load all 69 Wilayas
  if (upperCode === "DZ" || upperCode === "ALGERIA") {
    memoryCache.states.set(upperCode, ALGERIA_69_WILAYAS);
    return ALGERIA_69_WILAYAS;
  }

  try {
    const rawStates = State.getStatesOfCountry(upperCode);
    if (!rawStates || rawStates.length === 0) {
      // Fallback state if country has no administrative states
      const fallbackState: StateOption[] = [
        {
          code: upperCode,
          name: "Main Region",
          formattedName: "Main Region",
          countryCode: upperCode,
        },
      ];
      memoryCache.states.set(upperCode, fallbackState);
      return fallbackState;
    }

    const formatted: StateOption[] = rawStates.map((s: IState) => ({
      code: s.isoCode || s.name,
      name: s.name,
      formattedName: s.name,
      countryCode: upperCode,
    }));

    memoryCache.states.set(upperCode, formatted);
    return formatted;
  } catch (err) {
    console.warn("Error getting states for country:", countryCode, err);
    return [];
  }
}

function normalizeCityKey(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-_'\s]+/g, " ");
}

function dedupeAndSortCities(cities: CityOption[]): CityOption[] {
  const map = new Map<string, CityOption>();
  for (const c of cities) {
    if (!c.name) continue;
    const trimmedName = c.name.trim();
    const key = normalizeCityKey(trimmedName);
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, { ...c, name: trimmedName });
    } else {
      const existing = map.get(key)!;
      const existingHasAccent = /[\u00C0-\u024F]/.test(existing.name);
      const newHasAccent = /[\u00C0-\u024F]/.test(trimmedName);
      if (existingHasAccent && !newHasAccent) {
        map.set(key, { ...c, name: trimmedName });
      }
    }
  }
  const result = Array.from(map.values());
  result.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true }));
  return result;
}

/**
 * Resolve an Algerian wilaya input (code like "16", "6", or label like "16 - Alger" or "Alger") to its 2-digit code ("01" - "69")
 */
export function resolveAlgeriaWilayaCode(stateCodeOrName: string): string {
  const raw = (stateCodeOrName || "").trim();
  if (!raw) return "16";

  let candidate = raw;
  if (candidate.includes(" - ")) {
    candidate = candidate.split(" - ")[0].trim();
  }

  if (/^\d+$/.test(candidate)) {
    const padded = candidate.padStart(2, "0");
    if (ALGERIA_COMMUNES_MAP[padded]) {
      return padded;
    }
  }

  const normalizedRaw = normalizeCityKey(raw);
  const matchedWilaya = ALGERIA_69_WILAYAS.find(
    (w) =>
      w.code === candidate ||
      normalizeCityKey(w.name) === normalizedRaw ||
      normalizeCityKey(w.formattedName) === normalizedRaw ||
      normalizeCityKey(w.name) === normalizeCityKey(candidate)
  );

  return matchedWilaya ? matchedWilaya.code : "16";
}

/**
 * Get Cities or Communes for a specific State/Wilaya in a Country
 */
export function getCitiesByState(countryCode: string, stateCodeOrName: string): CityOption[] {
  const upperCountry = (countryCode || "DZ").toUpperCase();
  const cacheKey = `${upperCountry}_${stateCodeOrName}`;

  if (memoryCache.cities.has(cacheKey)) {
    return memoryCache.cities.get(cacheKey)!;
  }

  // Algeria communes lookup: strictly return the official communes belonging to the selected wilaya
  if (upperCountry === "DZ" || upperCountry === "ALGERIA") {
    const wilayaId = resolveAlgeriaWilayaCode(stateCodeOrName);
    const communesList = ALGERIA_COMMUNES_MAP[wilayaId] || [];

    const formattedCities: CityOption[] = communesList.map((communeName) => ({
      code: communeName,
      name: communeName,
      stateCode: wilayaId,
      countryCode: "DZ",
    }));

    memoryCache.cities.set(cacheKey, formattedCities);
    return formattedCities;
  }

  // Worldwide cities lookup using country-state-city
  try {
    const rawCities = City.getCitiesOfState(upperCountry, stateCodeOrName);
    if (rawCities && rawCities.length > 0) {
      const formattedCities = dedupeAndSortCities(
        rawCities.map((c: ICity) => ({
          code: c.name,
          name: c.name,
          stateCode: stateCodeOrName,
          countryCode: upperCountry,
        }))
      );
      memoryCache.cities.set(cacheKey, formattedCities);
      return formattedCities;
    }

    // Fallback: search all cities in the country if state-specific cities are not found
    const countryCities = City.getCitiesOfCountry(upperCountry);
    if (countryCities && countryCities.length > 0) {
      const matching = dedupeAndSortCities(
        countryCities
          .filter((c: ICity) => !c.stateCode || c.stateCode === stateCodeOrName)
          .map((c: ICity) => ({
            code: c.name,
            name: c.name,
            stateCode: stateCodeOrName,
            countryCode: upperCountry,
          }))
      );

      if (matching.length > 0) {
        memoryCache.cities.set(cacheKey, matching);
        return matching;
      }
    }

    // Graceful fallback city
    const fallbackCity: CityOption[] = [
      {
        code: `${stateCodeOrName} Center`,
        name: `${stateCodeOrName} Center`,
        stateCode: stateCodeOrName,
        countryCode: upperCountry,
      },
    ];
    memoryCache.cities.set(cacheKey, fallbackCity);
    return fallbackCity;
  } catch (err) {
    console.warn("Error getting cities:", countryCode, stateCodeOrName, err);
    return [
      {
        code: "Central City",
        name: "Central City",
        stateCode: stateCodeOrName,
        countryCode: upperCountry,
      },
    ];
  }
}

export interface DetectedLocation {
  countryCode: string;
  countryName: string;
  stateCode?: string;
  stateName?: string;
  cityName?: string;
}

/**
 * Detect full location (country, state/region, city) by IP address
 */
export async function detectUserLocationByIP(): Promise<DetectedLocation> {
  // 1. Try ipapi.co
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);
    const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.country_code) {
        return {
          countryCode: String(data.country_code).toUpperCase(),
          countryName: data.country_name || "",
          stateCode: data.region_code || "",
          stateName: data.region || data.region_name || "",
          cityName: data.city || "",
        };
      }
    }
  } catch {
    // fallback
  }

  // 2. Try ipwho.is
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);
    const res = await fetch("https://ipwho.is/", { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.country_code) {
        return {
          countryCode: String(data.country_code).toUpperCase(),
          countryName: data.country || "",
          stateCode: data.region_code || "",
          stateName: data.region || "",
          cityName: data.city || "",
        };
      }
    }
  } catch {
    // fallback
  }

  // Fallback default: Algeria
  return {
    countryCode: "DZ",
    countryName: "Algeria",
    stateCode: "16",
    stateName: "16 - Alger",
    cityName: "Alger",
  };
}

/**
 * Auto-detect user's country code via browser locale/timezone or free ip API
 */
export async function detectUserCountryCode(): Promise<string> {
  const loc = await detectUserLocationByIP();
  return loc.countryCode || "DZ";
}

/**
 * Resolve ISO-2 country code from either country name ("Algeria", "United States") or code ("DZ", "US")
 */
export function resolveCountryCodeFromInput(countryInput?: string | null): string {
  const raw = String(countryInput || "").trim();
  if (!raw) return "DZ";
  const upper = raw.toUpperCase();
  const countries = getWorldwideCountries();
  const byCode = countries.find((c) => c.code.toUpperCase() === upper);
  if (byCode) return byCode.code;
  const lower = raw.toLowerCase();
  const byName = countries.find((c) => c.name.toLowerCase() === lower);
  if (byName) return byName.code;
  if (lower.includes("algeria") || lower.includes("algérie")) return "DZ";
  return upper.length === 2 ? upper : "DZ";
}

/**
 * Resolve state/wilaya code inside a specific country from name, formattedName, or code
 */
export function resolveStateCodeFromInput(
  countryCodeOrName?: string | null,
  stateInput?: string | null
): string {
  const countryCode = resolveCountryCodeFromInput(countryCodeOrName);
  const rawState = String(stateInput || "").trim();
  if (!rawState) return "";
  const states = getStatesByCountryCode(countryCode);
  const lower = rawState.toLowerCase();
  const stripped = lower.replace(/^\d+\s*-\s*/, "").trim();
  const match = states.find(
    (s) =>
      s.code.toLowerCase() === lower ||
      s.name.toLowerCase() === lower ||
      s.formattedName.toLowerCase() === lower ||
      s.name.toLowerCase() === stripped
  );
  return match ? match.code : rawState;
}

