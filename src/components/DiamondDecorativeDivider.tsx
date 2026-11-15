import React from "react";

interface DiamondDecorativeDividerProps {
  className?: string;
  accentColor?: string;
  bgClassName?: string;
}

export const DiamondDecorativeDivider: React.FC<DiamondDecorativeDividerProps> = ({
  className = "my-2",
  accentColor,
  bgClassName = "bg-transparent"
}) => {
  const resolvedColor = accentColor || "var(--yume-theme-header-color, #0b2447)";

  return (
    <div className={`flex items-center justify-center w-full py-1 select-none pointer-events-none ${className}`}>
      {/* Left line */}
      <div 
        className="flex-1 h-[1.5px] transition-colors duration-300"
        style={{
          background: `linear-gradient(to right, transparent, color-mix(in srgb, ${resolvedColor} 35%, transparent), ${resolvedColor})`
        }}
      />

      {/* Decorative center shield/diamonds */}
      <div className={`flex items-center gap-1.5 px-2.5 shrink-0 ${bgClassName}`}>
        <span 
          className="w-0.5 h-0.5 rounded-full transition-colors duration-300" 
          style={{ backgroundColor: resolvedColor, opacity: 0.5 }}
        />
        <span 
          className="w-1 h-1 rounded-full transition-colors duration-300" 
          style={{ backgroundColor: resolvedColor, opacity: 0.75 }}
        />
        <span 
          className="w-1.5 h-1.5 rotate-45 border bg-transparent shrink-0 transition-colors duration-300" 
          style={{ borderColor: resolvedColor, opacity: 0.85 }}
        />
        <span
          className="w-2.5 h-2.5 rotate-45 border shrink-0 transition-colors duration-300 shadow-3xs"
          style={{ borderColor: resolvedColor, backgroundColor: resolvedColor }}
        />
        <span 
          className="w-1.5 h-1.5 rotate-45 border bg-transparent shrink-0 transition-colors duration-300" 
          style={{ borderColor: resolvedColor, opacity: 0.85 }}
        />
        <span 
          className="w-1 h-1 rounded-full transition-colors duration-300" 
          style={{ backgroundColor: resolvedColor, opacity: 0.75 }}
        />
        <span 
          className="w-0.5 h-0.5 rounded-full transition-colors duration-300" 
          style={{ backgroundColor: resolvedColor, opacity: 0.5 }}
        />
      </div>

      {/* Right line */}
      <div 
        className="flex-1 h-[1.5px] transition-colors duration-300"
        style={{
          background: `linear-gradient(to left, transparent, color-mix(in srgb, ${resolvedColor} 35%, transparent), ${resolvedColor})`
        }}
      />
    </div>
  );
};

export default DiamondDecorativeDivider;
