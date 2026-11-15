import React from "react";

interface SkeuomorphicSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  title?: string;
  disabled?: boolean;
  accentColor?: string;
}

export const SkeuomorphicSwitch: React.FC<SkeuomorphicSwitchProps> = ({
  checked,
  onChange,
  id,
  title,
  disabled = false
}) => {
  const [isRtl, setIsRtl] = React.useState(false);

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      setIsRtl(document.documentElement.dir === "rtl" || document.body.dir === "rtl");
    }
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(!checked);
    }
  };

  // Modern slim proportions
  const trackWidth = 38;
  const trackHeight = 18;
  const thumbSize = 14;
  const padding = 2;
  const travelDistance = trackWidth - thumbSize - (padding * 2);

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      title={title}
      className={`relative inline-flex items-center shrink-0 rounded-full transition-colors duration-300 ease-in-out select-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
        checked 
          ? "bg-[#34c759] border border-emerald-600/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]" 
          : "bg-slate-300/90 hover:bg-slate-350 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-350 dark:border-slate-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)]"
      } ${
        disabled 
          ? "opacity-50 cursor-not-allowed" 
          : "cursor-pointer hover:brightness-105 active:scale-95"
      }`}
      style={{
        width: `${trackWidth}px`,
        height: `${trackHeight}px`,
      }}
    >
      {/* Sliding Minimalist Rounded Thumb */}
      <div
        className="rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
        style={{
          width: `${thumbSize}px`,
          height: `${thumbSize}px`,
          position: "absolute",
          left: `${padding}px`,
          transform: checked
            ? `translateX(${isRtl ? -travelDistance : travelDistance}px)`
            : "translateX(0)",
        }}
      />
    </button>
  );
};

