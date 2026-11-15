import React from "react";

export interface CompareIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function CompareIcon({
  className = "w-3.5 h-3.5",
  ...props
}: CompareIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Central vertical dividing line extending with rounded caps */}
      <line x1="12" y1="3" x2="12" y2="21" />
      {/* Left rounded comparison pane joined to the central line */}
      <path d="M12 6H7.5C6.12 6 5 7.12 5 8.5V15.5C5 16.88 6.12 18 7.5 18H12" />
      {/* Right rounded comparison bracket with separation gap */}
      <path d="M14.5 6H16.5C17.88 6 19 7.12 19 8.5V15.5C19 16.88 17.88 18 16.5 18H14.5" />
    </svg>
  );
}

export default CompareIcon;
