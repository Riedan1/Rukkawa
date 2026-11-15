/**
 * Pure domain logic and validation helpers for YUME Account Registration,
 * Sign In, color calculations, and user profile resolution.
 */

export interface YumeUser {
  name: string;
  email: string;
  role?: "Merchant" | "Buyer" | string;
  isMerchant?: boolean;
  storeName?: string;
  phone?: string;
  storiesEnabled?: boolean;
}

export interface CountryCodeOption {
  code: string;
  label: string;
}

export const COUNTRY_CODES: CountryCodeOption[] = [
  { code: "+213", label: "+213 (Algeria)" },
  { code: "+33", label: "+33 (France)" },
  { code: "+216", label: "+216 (Tunisia)" },
  { code: "+212", label: "+212 (Morocco)" },
  { code: "+1", label: "+1 (US / Canada)" },
  { code: "+44", label: "+44 (UK)" },
  { code: "+971", label: "+971 (UAE)" },
];

/**
 * Parses a hex string (e.g. #0b2447, #f00, 0b2447) to { r, g, b }
 */
export function parseHexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!hex || typeof hex !== "string") {
    return { r: 11, g: 36, b: 71 };
  }
  const cleaned = hex.replace("#", "").trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return { r: isNaN(r) ? 11 : r, g: isNaN(g) ? 36 : g, b: isNaN(b) ? 71 : b };
  }
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return { r: isNaN(r) ? 11 : r, g: isNaN(g) ? 36 : g, b: isNaN(b) ? 71 : b };
}

/**
 * Converts a hex string and alpha (0 to 1) into an rgba(...) CSS string.
 */
export function rgbaFromHex(hex: string, alpha: number): string {
  const { r, g, b } = parseHexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Checks if a hex color is considered a warm color tone.
 * Warm brown/amber/bronze/burgundy colors typically have r significantly higher than b.
 */
export function isWarmColor(hex: string): boolean {
  const { r, g, b } = parseHexToRgb(hex);
  return r > b + 25 && r > 70;
}

export interface PasswordRulesResult {
  hasMinLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  isValid: boolean;
}

/**
 * Checks password against standard security constraints.
 */
export function checkPasswordRules(password: string): PasswordRulesResult {
  const hasMinLength = (password || "").length >= 8;
  const hasLowercase = /[a-z]/.test(password || "");
  const hasUppercase = /[A-Z]/.test(password || "");
  const hasNumber = /[0-9]/.test(password || "");
  const isValid = hasMinLength && hasLowercase && hasUppercase && hasNumber;
  return {
    hasMinLength,
    hasLowercase,
    hasUppercase,
    hasNumber,
    isValid,
  };
}

export interface RegistrationValidationInput {
  accountType: "buyer" | "merchant";
  storeName: string;
  fullName: string;
  email: string;
  password: string;
  agreedToTerms: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

/**
 * Validates the full registration form.
 */
export function validateRegistrationForm(input: RegistrationValidationInput): ValidationResult {
  if (input.accountType === "merchant" && !input.storeName.trim()) {
    return { isValid: false, errorMessage: "Please enter your Store / Brand Name." };
  }
  if (!input.fullName.trim()) {
    return { isValid: false, errorMessage: "Please enter your full name." };
  }
  if (!input.email.trim() || !input.email.includes("@")) {
    return { isValid: false, errorMessage: "Please enter a valid email address." };
  }
  if (!input.password) {
    return { isValid: false, errorMessage: "Please create a password." };
  }
  if (!input.agreedToTerms) {
    return { isValid: false, errorMessage: "Please agree to the Terms of Service and Privacy Policy to continue." };
  }
  return { isValid: true, errorMessage: null };
}

export interface SignInValidationInput {
  email: string;
  password: string;
}

/**
 * Validates the sign-in form.
 */
export function validateSignInForm(input: SignInValidationInput): ValidationResult {
  if (!input.email.trim() || !input.email.includes("@")) {
    return { isValid: false, errorMessage: "Please enter a valid email address." };
  }
  if (!input.password) {
    return { isValid: false, errorMessage: "Please enter your password." };
  }
  return { isValid: true, errorMessage: null };
}

export interface ResolveUserInput {
  mode: "signin" | "register";
  accountType: "buyer" | "merchant";
  entryFlow?: string;
  fullName: string;
  email: string;
  storeName?: string;
  countryCode?: string;
  phone?: string;
}

/**
 * Resolves a final YumeUser profile from form inputs.
 */
export function resolveUserFromForm(input: ResolveUserInput): YumeUser {
  const isMerchant =
    input.mode === "register"
      ? input.accountType === "merchant"
      : input.accountType === "merchant" || input.entryFlow === "merchant";

  const cleanName = input.fullName.trim();
  const cleanEmail = input.email.trim();
  const cleanStoreName = (input.storeName || "").trim();
  const cleanPhone = (input.phone || "").trim();
  const code = input.countryCode || "+213";

  const resolvedName = cleanName || (cleanEmail ? cleanEmail.split("@")[0] : isMerchant ? "YUME Merchant" : "YUME User");

  return {
    name: resolvedName,
    email: cleanEmail || "user@yume.dz",
    role: isMerchant ? "Merchant" : "Buyer",
    isMerchant,
    storeName: isMerchant ? cleanStoreName || `${resolvedName} Store` : undefined,
    phone: cleanPhone ? `${code} ${cleanPhone}` : undefined,
    storiesEnabled: false,
  };
}
