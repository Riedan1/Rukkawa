import React from "react";

export interface ExpressCartIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Custom rounded-stroke express shopping cart icon with three speed lines,
 * matching the clean outline aesthetic of storefront product & order controls.
 */
export const ExpressCartIcon: React.FC<ExpressCartIconProps> = ({
  className = "w-4 h-4",
  strokeWidth = 1.5,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Three left-aligned aerodynamic speed lines following the stem slope */}
      <line x1="2.4" y1="8.2" x2="4.9" y2="8.2" />
      <line x1="2.4" y1="11.3" x2="5.5" y2="11.3" />
      <line x1="2.4" y1="14.4" x2="6.3" y2="14.4" />

      {/* Handle, tilted stem, and rounded bottom chassis */}
      <path d="M4.6 4.2h1.6c1 0 1.5.5 1.7 1.5l1.6 9.8c.2 1.2 1.1 2 2.4 2h6.3" />

      {/* Rounded trapezoidal cart basket */}
      <path d="M8.3 7.4h10.8c1.4 0 2.3.9 2 2.3l-.7 3.1c-.3 1.2-1.2 1.8-2.6 1.8H9.4" />

      {/* Two balanced circular wheels */}
      <circle cx="11" cy="20.3" r="1.35" />
      <circle cx="17.2" cy="20.3" r="1.35" />
    </svg>
  );
};

export default ExpressCartIcon;
