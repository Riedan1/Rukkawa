import React from "react";

// Dedicated precision SVG for Beauty & Personal Care (Perfume & Cosmetics Atomizer Bottle with Scent Mist)
export const BeautyCareIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Elegant Perfume / Cosmetics Bottle Body */}
    <rect x="5" y="10" width="14" height="11" rx="3" />
    {/* Bottle Neck & Collar */}
    <path d="M9 10V7h6v3" />
    {/* Atomizer Pump Top */}
    <path d="M10 4h4" />
    <path d="M12 4v3" />
    {/* Fragrance / Scent Spray Mist */}
    <path d="M19 5h2" />
    <path d="M18 2.5l1.8.8" />
    <path d="M18 7.5l1.8-.8" />
  </svg>
);

// Dedicated precision SVG for Clothing, Shoes & Jewelry (Classic Wardrobe Clothes Hanger)
export const ClothingHangerIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Clothes Hanger Hook & Triangular Shoulders */}
    <path d="M12 2a3 3 0 0 0-3 3c0 .8.4 1.5 1 2l-7.7 5.8A2 2 0 0 0 2 14.4V16a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-1.6a2 2 0 0 0-.3-1.6L14 7c.6-.5 1-1.2 1-2a3 3 0 0 0-3-3z" />
    {/* Bottom Trouser / Garment Bar */}
    <line x1="2" y1="17" x2="22" y2="17" />
  </svg>
);
