import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import {
  YumeUser,
  COUNTRY_CODES,
  parseHexToRgb,
  rgbaFromHex,
  isWarmColor,
  checkPasswordRules,
  validateRegistrationForm,
  validateSignInForm,
  resolveUserFromForm,
} from "../utils/accountFlowLogic";

export type { YumeUser };

export interface YumeAccountRegistrationPageProps {
  entryFlow?: string;
  initialMode?: "signin" | "register";
  initialFullName?: string;
  initialEmail?: string;
  initialPhone?: string;
  accentColor?: string;
  onBackToHome?: () => void;
  onSuccess?: (user: YumeUser) => void;
}

export const YumeAccountRegistrationPage: React.FC<YumeAccountRegistrationPageProps> = ({
  entryFlow,
  initialMode = "register",
  initialFullName = "",
  initialEmail = "",
  initialPhone = "",
  accentColor = "#0b2447",
  onBackToHome,
  onSuccess,
}) => {
  const [mode, setMode] = useState<"signin" | "register">(initialMode);
  const [step, setStep] = useState<"select_type" | "form">(
    entryFlow === "merchant" || entryFlow === "buyer" ? "form" : "select_type"
  );
  const [accountType, setAccountType] = useState<"buyer" | "merchant">(
    entryFlow === "merchant" ? "merchant" : "buyer"
  );

  const [storeName, setStoreName] = useState("");
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+213");
  const [phone, setPhone] = useState(initialPhone.replace(/^\+213\s*/, ""));
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const warmTheme = useMemo(() => isWarmColor(accentColor), [accentColor]);

  // Password validation rules
  const { hasMinLength, hasLowercase, hasUppercase, hasNumber } = useMemo(
    () => checkPasswordRules(password),
    [password]
  );

  const handleSelectAccountType = (type: "buyer" | "merchant") => {
    setAccountType(type);
    setStep("form");
    setErrorMessage(null);
  };

  const handleGoogleAuth = () => {
    setErrorMessage(null);
    const user = resolveUserFromForm({
      mode,
      accountType,
      entryFlow,
      fullName,
      email,
      storeName,
      countryCode,
      phone,
    });
    onSuccess?.(user);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validateRegistrationForm({
      accountType,
      storeName,
      fullName,
      email,
      password,
      agreedToTerms,
    });

    if (!validation.isValid) {
      setErrorMessage(validation.errorMessage);
      return;
    }

    const user = resolveUserFromForm({
      mode: "register",
      accountType,
      fullName,
      email,
      storeName,
      countryCode,
      phone,
    });
    onSuccess?.(user);
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validateSignInForm({
      email,
      password,
    });

    if (!validation.isValid) {
      setErrorMessage(validation.errorMessage);
      return;
    }

    const user = resolveUserFromForm({
      mode: "signin",
      accountType,
      entryFlow,
      fullName,
      email,
      storeName,
      countryCode,
      phone,
    });
    onSuccess?.(user);
  };

  const pageBgStyle: React.CSSProperties = {
    backgroundColor: warmTheme ? "#f3f0ec" : "#f1f2f5",
    backgroundImage: `linear-gradient(135deg, ${rgbaFromHex(accentColor, 0.03)} 0%, ${rgbaFromHex(
      accentColor,
      0.015
    )} 100%)`,
  };

  const cornerWedgeColor = rgbaFromHex(accentColor, 0.055);
  const iconBadgeBg = rgbaFromHex(accentColor, 0.06);
  const iconBadgeBorder = rgbaFromHex(accentColor, 0.14);
  const pillBadgeBg = rgbaFromHex(accentColor, 0.065);
  const pillBadgeBorder = rgbaFromHex(accentColor, 0.15);

  return (
    <div
      className="fixed inset-0 z-[200] w-full h-full overflow-y-auto overflow-x-hidden font-sans select-none"
      style={pageBgStyle}
    >
      {/* Top-right subtle geometric diagonal wedge */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundColor: cornerWedgeColor,
          clipPath: "polygon(80% 0, 100% 0, 100% 25%)",
        }}
      />

      {/* Bottom-left subtle geometric diagonal wedge */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundColor: cornerWedgeColor,
          clipPath: "polygon(0 64%, 0 100%, 42% 100%)",
        }}
      />

      <div className="relative z-10 min-h-full w-full flex items-center justify-center py-8 px-4 sm:px-8 lg:px-14">
        <div className="w-full max-w-[1140px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* LEFT COLUMN — Branding, Features & 3D Smartphone Illustration */}
        <div className="lg:col-span-5 flex flex-col pt-1 lg:pt-2 lg:pl-2">
          {/* YUME Lotus + Stylized E Logo */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5" style={{ color: accentColor }}>
              {/* 3-Petal Lotus / Crown Emblem */}
              <svg
                width="20"
                height="18"
                viewBox="0 0 24 22"
                fill="currentColor"
                className="shrink-0"
              >
                <path d="M12 2C10.2 5.4 9.5 8.8 12 13.5C14.5 8.8 13.8 5.4 12 2Z" />
                <path d="M4.5 6.5C4.8 10.2 6.8 13.2 10.8 14.8C8.8 10.8 7.2 8.2 4.5 6.5Z" />
                <path d="M19.5 6.5C16.8 8.2 15.2 10.8 13.2 14.8C17.2 13.2 19.2 10.2 19.5 6.5Z" />
                <path d="M6 16.5C9.5 18.2 14.5 18.2 18 16.5C15.5 19.5 8.5 19.5 6 16.5Z" />
              </svg>

              <div className="flex items-center tracking-[0.14em] font-extrabold text-[19px] leading-none">
                <span>YUM</span>
                {/* Stylized 3-bar E */}
                <span className="inline-flex flex-col justify-between h-[13px] w-[11px] ml-[2px]">
                  <span className="h-[2.3px] w-full rounded-full bg-current" />
                  <span className="h-[2.3px] w-[82%] rounded-full bg-current" />
                  <span className="h-[2.3px] w-full rounded-full bg-current" />
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wide mt-1.5 font-medium">
              Shop &nbsp;&bull;&nbsp; Discover &nbsp;&bull;&nbsp; Connect
            </p>
          </div>

          {/* Main Heading */}
          <h1
            className="text-[26px] sm:text-[29px] font-extrabold tracking-tight leading-tight mb-2.5"
            style={{ color: accentColor }}
          >
            Join YUME Network
          </h1>
          <p className="text-[13px] text-slate-500 leading-relaxed max-w-[340px] mb-7">
            Create your account and be part of a growing community of shoppers, stores and creators.
          </p>

          {/* 3 Feature Rows */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: iconBadgeBg,
                  border: `1px solid ${iconBadgeBorder}`,
                  color: accentColor,
                }}
              >
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className="text-[13px] font-bold leading-snug"
                  style={{ color: accentColor }}
                >
                  Shop Easily
                </h3>
                <p className="text-[11.5px] text-slate-500 leading-relaxed mt-0.5">
                  Discover thousands of products from your favorite stores.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: iconBadgeBg,
                  border: `1px solid ${iconBadgeBorder}`,
                  color: accentColor,
                }}
              >
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className="text-[13px] font-bold leading-snug"
                  style={{ color: accentColor }}
                >
                  Support Small Businesses
                </h3>
                <p className="text-[11.5px] text-slate-500 leading-relaxed mt-0.5">
                  Explore unique stores and help local merchants grow.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: iconBadgeBg,
                  border: `1px solid ${iconBadgeBorder}`,
                  color: accentColor,
                }}
              >
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className="text-[13px] font-bold leading-snug"
                  style={{ color: accentColor }}
                >
                  Be Part of a Community
                </h3>
                <p className="text-[11.5px] text-slate-500 leading-relaxed mt-0.5">
                  Follow, get inspired and stay connected with what you love.
                </p>
              </div>
            </div>
          </div>

          {/* 3D Smartphone Illustration + Bottom Tagline */}
          <div className="mt-1 flex flex-col items-center sm:items-start sm:pl-3">
            <div className="relative w-[300px] sm:w-[325px] flex flex-col items-center">
              <img
                src={
                  warmTheme
                    ? "/assets/aistudio/yume_phone_brown_transparent.png"
                    : "/assets/aistudio/yume_phone_blue_transparent.png"
                }
                alt="YUME App Preview"
                className="w-full h-auto object-contain pointer-events-none select-none"
              />
              <div className="text-center mt-2">
                <div
                  className="text-[14px] font-semibold tracking-[0.26em] uppercase"
                  style={{ color: accentColor }}
                >
                  YUME
                </div>
                <div className="text-[10.5px] text-slate-400 tracking-[0.16em] mt-0.5">
                  More than a marketplace
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Main White Interactive Card */}
        <div className="lg:col-span-7 w-full">
          <div className="bg-white rounded-[26px] shadow-[0_12px_40px_-12px_rgba(15,23,42,0.08)] border border-slate-200/70 px-6 py-7 sm:px-10 sm:py-9">
            {/* =========================================================
                VIEW 1: ACCOUNT TYPE SELECTION (Personal vs Merchant)
               ========================================================= */}
            {mode === "register" && step === "select_type" && (
              <div>
                {/* Top navigation bar */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to home</span>
                  </button>
                </div>

                {/* Heading */}
                <h2
                  className="text-[24px] sm:text-[27px] font-extrabold tracking-tight leading-snug"
                  style={{ color: accentColor }}
                >
                  Create Your Account
                </h2>
                <p className="text-[13px] text-slate-500 mt-1 mb-6">
                  Choose how you would like to use YUME Network to get started.
                </p>

                {/* Two Account Type Cards */}
                <div className="space-y-4">
                  {/* Personal Account Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectAccountType("buyer")}
                    className="w-full text-left rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/50 p-5 sm:p-6 transition-all duration-150 group shadow-[0_2px_10px_rgba(15,23,42,0.02)] hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: iconBadgeBg,
                          border: `1px solid ${iconBadgeBorder}`,
                          color: accentColor,
                        }}
                      >
                        <ShoppingBag className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3
                            className="text-[15.5px] font-bold"
                            style={{ color: accentColor }}
                          >
                            Personal Account
                          </h3>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </div>

                        <p className="text-[12.5px] text-slate-500 leading-relaxed mt-1.5">
                          Shop from verified local stores, save favorite items, watch reels, and track
                          deliveries across all 58 Wilayas.
                        </p>

                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold mt-3"
                          style={{
                            backgroundColor: pillBadgeBg,
                            color: accentColor,
                          }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Instant Access to All Stores &amp; Reels</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Merchant Account Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectAccountType("merchant")}
                    className="w-full text-left rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/50 p-5 sm:p-6 transition-all duration-150 group shadow-[0_2px_10px_rgba(15,23,42,0.02)] hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: iconBadgeBg,
                          border: `1px solid ${iconBadgeBorder}`,
                          color: accentColor,
                        }}
                      >
                        <Store className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3
                            className="text-[15.5px] font-bold"
                            style={{ color: accentColor }}
                          >
                            Merchant Account
                          </h3>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </div>

                        <p className="text-[12.5px] text-slate-500 leading-relaxed mt-1.5">
                          Launch and manage your store on YUME, publish products &amp; reels, and shop
                          freely from any other store without losing merchant privileges.
                        </p>

                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold mt-3"
                          style={{
                            backgroundColor: pillBadgeBg,
                            color: accentColor,
                          }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Store Management + Full Shopping Privileges</span>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Bottom Divider + Sign In Link */}
                <div className="mt-16 pt-5 border-t border-slate-100 text-center">
                  <p className="text-[12.5px] text-slate-500">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin");
                        setErrorMessage(null);
                      }}
                      className="font-bold underline underline-offset-2 hover:opacity-80 cursor-pointer"
                      style={{ color: accentColor }}
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* =========================================================
                VIEW 2: SIGN-UP FORM (Personal Account OR Merchant Account)
               ========================================================= */}
            {mode === "register" && step === "form" && (
              <div>
                {/* Top navigation row */}
                <div className="flex items-center justify-between mb-3.5">
                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to home</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("select_type");
                      setErrorMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ color: accentColor }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change account type</span>
                  </button>
                </div>

                {/* Title + Account Type Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2
                    className="text-[24px] sm:text-[27px] font-extrabold tracking-tight leading-snug"
                    style={{ color: accentColor }}
                  >
                    Create Your Account
                  </h2>

                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-bold"
                    style={{
                      backgroundColor: pillBadgeBg,
                      border: `1px solid ${pillBadgeBorder}`,
                      color: accentColor,
                    }}
                  >
                    {accountType === "merchant" ? (
                      <>
                        <Store className="w-3.5 h-3.5" />
                        <span>Merchant Account</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Personal Account</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Subtitle */}
                <p className="text-[12.5px] text-slate-500 mt-1 mb-4">
                  {accountType === "merchant"
                    ? "Set up your merchant account to manage your store and shop across all YUME stores."
                    : "Fill in the information below to get started."}
                </p>

                {/* Merchant Unified Privileges Banner */}
                {accountType === "merchant" && (
                  <div
                    className="rounded-xl p-3.5 mb-4 flex items-start gap-2.5"
                    style={{
                      backgroundColor: rgbaFromHex(accentColor, 0.045),
                      border: `1px solid ${rgbaFromHex(accentColor, 0.12)}`,
                    }}
                  >
                    <ShieldCheck
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: accentColor }}
                    />
                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      <span className="font-bold" style={{ color: accentColor }}>
                        Unified Merchant &amp; Shopper Privileges:
                      </span>{" "}
                      Your Merchant Account lets you shop from any other store on YUME while keeping
                      full access to your store dashboard.
                    </p>
                  </div>
                )}

                {/* Sign Up with Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full h-11 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70 flex items-center justify-center gap-2.5 text-[13px] font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign Up with Google</span>
                </button>

                {/* OR Divider */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-slate-100 w-full" />
                  <span className="bg-white px-3 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                    OR
                  </span>
                  <div className="border-t border-slate-100 w-full" />
                </div>

                {errorMessage && (
                  <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-[12px] text-red-700 font-medium">
                    {errorMessage}
                  </div>
                )}

                {/* Form Fields */}
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Store / Brand Name (Merchant Only) */}
                  {accountType === "merchant" && (
                    <div>
                      <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                        Store / Brand Name <span className="text-slate-700">*</span>
                      </label>
                      <div className="relative">
                        <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          placeholder="Enter your store or boutique name"
                          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* Full Name */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                      Full Name <span className="text-slate-700">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                      Email Address <span className="text-slate-700">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                      Password <span className="text-slate-700">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* 2x2 Password Requirements Checklist */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2.5 pl-0.5">
                      <div
                        className={`flex items-center gap-1.5 text-[11px] ${
                          hasMinLength ? "text-emerald-600 font-medium" : "text-slate-400"
                        }`}
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>At least 8 characters</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 text-[11px] ${
                          hasLowercase ? "text-emerald-600 font-medium" : "text-slate-400"
                        }`}
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>One lowercase letter</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 text-[11px] ${
                          hasUppercase ? "text-emerald-600 font-medium" : "text-slate-400"
                        }`}
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>One uppercase letter</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 text-[11px] ${
                          hasNumber ? "text-emerald-600 font-medium" : "text-slate-400"
                        }`}
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>One number</span>
                      </div>
                    </div>
                  </div>

                  {/* Phone Number (Optional) */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <div className="flex items-center h-11 rounded-xl border border-slate-200 focus-within:border-slate-400 transition-colors overflow-hidden bg-white">
                      <div className="flex items-center pl-3.5 pr-2 border-r border-slate-200 h-full relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="appearance-none bg-transparent text-[12.5px] font-bold text-slate-700 pr-4 focus:outline-none cursor-pointer"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        className="flex-1 h-full px-3.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>

                    {/* Optional Phone Info Box */}
                    <div className="mt-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 px-3.5 py-2.5 flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11.5px] font-bold text-slate-700 leading-tight">
                          Your phone number is optional
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          We may use it to contact you for order updates or important notifications.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Privacy Checkbox */}
                  <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-current"
                      style={{ accentColor }}
                    />
                    <span className="text-[12px] text-slate-600">
                      I agree to the{" "}
                      <span
                        className="font-semibold underline underline-offset-2"
                        style={{ color: accentColor }}
                      >
                        Terms of Service
                      </span>{" "}
                      and{" "}
                      <span
                        className="font-semibold underline underline-offset-2"
                        style={{ color: accentColor }}
                      >
                        Privacy Policy
                      </span>
                    </span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl text-white font-bold text-[13.5px] flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-opacity cursor-pointer mt-2"
                    style={{ backgroundColor: accentColor }}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </button>
                </form>

                {/* Bottom Divider + Sign In Link */}
                <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                  <p className="text-[12.5px] text-slate-500">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin");
                        setErrorMessage(null);
                      }}
                      className="font-bold underline underline-offset-2 hover:opacity-80 cursor-pointer"
                      style={{ color: accentColor }}
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* =========================================================
                VIEW 3: SIGN-IN FORM
               ========================================================= */}
            {mode === "signin" && (
              <div>
                {/* Top navigation row */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to home</span>
                  </button>
                </div>

                {/* Title */}
                <h2
                  className="text-[24px] sm:text-[27px] font-extrabold tracking-tight leading-snug"
                  style={{ color: accentColor }}
                >
                  Welcome Back
                </h2>
                <p className="text-[12.5px] text-slate-500 mt-1 mb-5">
                  Sign in to your YUME account to continue shopping and managing your store.
                </p>

                {/* Sign In with Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full h-11 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70 flex items-center justify-center gap-2.5 text-[13px] font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                </button>

                {/* OR Divider */}
                <div className="relative flex items-center justify-center my-5">
                  <div className="border-t border-slate-100 w-full" />
                  <span className="bg-white px-3 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                    OR
                  </span>
                  <div className="border-t border-slate-100 w-full" />
                </div>

                {errorMessage && (
                  <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-[12px] text-red-700 font-medium">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  {/* Email Address */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                      Email Address <span className="text-slate-700">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[12px] font-bold text-slate-700">
                        Password <span className="text-slate-700">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setErrorMessage(
                            "Password reset link has been sent if this email is registered."
                          )
                        }
                        className="text-[11.5px] font-semibold hover:underline cursor-pointer"
                        style={{ color: accentColor }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-current"
                      style={{ accentColor }}
                    />
                    <span className="text-[12px] text-slate-600">Keep me signed in</span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl text-white font-bold text-[13.5px] flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-opacity cursor-pointer mt-2"
                    style={{ backgroundColor: accentColor }}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                </form>

                {/* Bottom Divider + Create Account Link */}
                <div className="mt-8 pt-5 border-t border-slate-100 text-center">
                  <p className="text-[12.5px] text-slate-500">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setStep("select_type");
                        setErrorMessage(null);
                      }}
                      className="font-bold underline underline-offset-2 hover:opacity-80 cursor-pointer"
                      style={{ color: accentColor }}
                    >
                      Create Account
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default YumeAccountRegistrationPage;
