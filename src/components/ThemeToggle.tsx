import React from "react";
import { motion } from "motion/react";
import { Sun, Moon } from "lucide-react";

export const DayNightLogo: React.FC<{ className?: string; size?: number }> = ({ className = "", size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`select-none shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Night Gradient */}
        <linearGradient id="night-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#251c35" />
          <stop offset="100%" stopColor="#120b1c" />
        </linearGradient>
        
        {/* Day Gradient */}
        <linearGradient id="day-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ea8de" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        {/* Sun Gradient */}
        <linearGradient id="sun-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd166" />
          <stop offset="100%" stopColor="#f77f00" />
        </linearGradient>

        {/* Clip Path for the entire circle */}
        <clipPath id="circle-clip">
          <circle cx="50" cy="50" r="48" />
        </clipPath>

        {/* Clip Path for the Day side (right half with organic wave) */}
        <clipPath id="day-clip">
          <path d="M 46,2 C 55,15 44,30 42,48 C 40,66 56,85 46,98 L 100,98 L 100,2 Z" />
        </clipPath>
      </defs>

      {/* Main Circle Group */}
      <g clipPath="url(#circle-clip)">
        {/* --- NIGHT SIDE (Left / Base) --- */}
        <rect x="0" y="0" width="100" height="100" fill="url(#night-grad)" />
        
        {/* Night Details */}
        {/* Cloud in background */}
        <path d="M 18,58 C 23,48 43,50 38,66 C 36,70 23,73 18,58 Z" fill="#3a304f" opacity="0.35" />
        <path d="M 10,32 C 16,27 26,31 30,42 C 23,49 8,45 10,32 Z" fill="#3a304f" opacity="0.25" />

        {/* Crescent Moon */}
        <path d="M 38,26 C 22,26 19,44 28,54 C 33,58 39,57 37,51 C 31,47 31,35 39,33 C 42,32 42,26 38,26 Z" fill="#ffffff" />

        {/* Stars */}
        {/* Star 1 - Top */}
        <polygon points="41,15 43,19 47,19 44,22 45,26 41,24 37,26 38,22 35,19 39,19" fill="#ffffff" />
        {/* Star 2 - Mid Left */}
        <polygon points="17,23 18,25 20,25 19,27 19,29 17,28 15,29 16,27 14,25 16,25" fill="#ffffff" opacity="0.9" />
        {/* Star 3 - Bottom */}
        <polygon points="25,67 27,69 29,69 28,71 28,73 26,72 24,73 25,71 23,69 25,69" fill="#ffffff" />
        {/* Star 4 - Bottom Right */}
        <polygon points="43,71 44,73 46,73 45,75 45,77 43,76 41,77 42,75 40,73 42,73" fill="#ffffff" opacity="0.8" />


        {/* --- DAY SIDE (Clipped over the base night side) --- */}
        <g clipPath="url(#day-clip)">
          <rect x="0" y="0" width="100" height="100" fill="url(#day-grad)" />

          {/* Day Details */}
          {/* Waves / Sea-like details at bottom */}
          <path d="M 38,82 C 43,75 53,78 58,82 C 63,86 73,80 83,85 L 100,100 L 38,100 Z" fill="#1e40af" opacity="0.2" />
          <path d="M 48,90 C 58,85 68,95 78,90 C 88,85 93,95 100,90 L 100,100 L 48,100 Z" fill="#1d4ed8" opacity="0.35" />

          {/* Sun */}
          <circle cx="68" cy="50" r="18" fill="url(#sun-grad)" />
          {/* Sun Face Accent - Inner circle shadow/highlight */}
          <circle cx="66" cy="48" r="14" fill="#ffb703" opacity="0.2" />

          {/* Sun Rays (Rotated lines) */}
          <g stroke="#ffd166" strokeWidth="3" strokeLinecap="round">
            {/* Top Ray */}
            <line x1="68" y1="26" x2="68" y2="20" />
            {/* Bottom Ray */}
            <line x1="68" y1="74" x2="68" y2="80" />
            {/* Left Ray */}
            <line x1="44" y1="50" x2="38" y2="50" />
            {/* Right Ray */}
            <line x1="92" y1="50" x2="98" y2="50" />
            {/* Diagonal Rays */}
            <line x1="51" y1="33" x2="47" y2="29" />
            <line x1="85" y1="67" x2="89" y2="71" />
            {/* Other Diagonal Rays */}
            <line x1="51" y1="67" x2="47" y2="71" />
            <line x1="85" y1="33" x2="89" y2="29" />
            {/* Extra inner rays */}
            <line x1="60" y1="29" x2="57" y2="25" />
            <line x1="76" y1="71" x2="79" y2="75" />
            <line x1="76" y1="29" x2="79" y2="25" />
            <line x1="60" y1="71" x2="57" y2="75" />
          </g>
        </g>
      </g>
      
      {/* Outer elegant subtle border */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />
    </svg>
  );
};

interface ThemeToggleProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ darkMode, setDarkMode }) => {
  const toggleTheme = () => {
    const nextMode = !darkMode;
    try {
      localStorage.setItem("dz_theme_manual", "true");
      localStorage.setItem("dz_dark_mode", nextMode ? "true" : "false");
    } catch (err) {}
    setDarkMode(nextMode);
  };

  return (
    <div className="flex items-center shrink-0">
      {/* Apple Inc Style Switch Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className={`relative w-[48px] h-8 rounded-full cursor-pointer select-none outline-none flex items-center p-[3px] transition-all duration-300 backdrop-blur-xl shrink-0 border border-white/20 active:scale-95 ${
          darkMode 
            ? "bg-black/35 hover:bg-black/45 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]" 
            : "bg-white/20 hover:bg-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.06)]"
        }`}
        title={darkMode ? "Dark appearance (switch to Light appearance)" : "Light appearance (switch to Dark appearance)"}
        aria-label={darkMode ? "Switch to light appearance" : "Switch to dark appearance"}
        id="header-theme-toggle-switch"
      >
        {/* Subtle Ambient Icons in Track */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          <Moon 
            className={`w-2.5 h-2.5 transition-all duration-300 ${
              darkMode ? "text-white/30" : "text-white/60"
            }`} 
          />
          <Sun 
            className={`w-2.5 h-2.5 transition-all duration-300 ${
              darkMode ? "text-white/60" : "text-white/30"
            }`} 
          />
        </div>

        {/* Sliding Apple Thumb */}
        <motion.div
          className="relative z-10 w-[24px] h-[24px] rounded-full bg-white flex items-center justify-center shadow-[0_2px_5px_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.1)]"
          animate={{
            x: darkMode ? 0 : 18,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        >
          {darkMode ? (
            <Moon className="w-3 h-3 text-slate-800 fill-slate-800/15 stroke-[2.2]" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-400/30 stroke-[2.2]" />
          )}
        </motion.div>
      </button>
    </div>
  );
};
