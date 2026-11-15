import React, { useState, useRef, useEffect, useMemo } from "react";
import { RotateCw, MoveHorizontal, RotateCcw } from "lucide-react";
import {
  SizingSubcategoryProfile,
  SizingTableRow,
  SizingMeasurementColumn,
  formatMeasurementValue,
} from "../utils/sizingFitLogic";

// 0° Front 3D Studio Character Renders
import women3dFrontImg from "../assets/images/women_3d_model_1794174481186.jpg";
import men3dFrontImg from "../assets/images/men_3d_model_1794174483329.jpg";
import kids3dFrontImg from "../assets/images/kids_3d_model_1794174483485.jpg";
import baby3dFrontImg from "../assets/images/baby_3d_model_1794174533649.jpg";
import womenDress3dFrontImg from "../assets/images/women_dress_3d_model_1794174556924.jpg";

// 45° Front-Three-Quarter 3D Studio Character Renders
import women3d45Img from "../assets/images/women_3d_side_1794175331957.jpg";
import men3d45Img from "../assets/images/men_3d_side_1794175334659.jpg";
import kids3d45Img from "../assets/images/kids_3d_side_1794175336942.jpg";
import baby3d45Img from "../assets/images/baby_3d_side_1794175374598.jpg";
import womenDress3d45Img from "../assets/images/women_dress_3d_side_1794175371157.jpg";

// 90° True Side Profile 3D Studio Character Renders
import women3d90Img from "../assets/images/women_3d_90_profile_1794176388376.jpg";
import men3d90Img from "../assets/images/men_3d_90_profile_1794176391629.jpg";
import kids3d90Img from "../assets/images/kids_3d_90_profile_1794176397037.jpg";

// 135° Back-Three-Quarter 3D Studio Character Renders
import women3d135Img from "../assets/images/women_3d_135_backquarter_1794176389914.jpg";
import men3d135Img from "../assets/images/men_3d_135_backquarter_1794176393892.jpg";
import kids3d135Img from "../assets/images/kids_3d_135_backquarter_1794176396915.jpg";

// 180° Direct Back 3D Studio Character Renders
import women3d180Img from "../assets/images/women_3d_back_1794175332157.jpg";
import men3d180Img from "../assets/images/men_3d_back_1794175335456.jpg";
import kids3d180Img from "../assets/images/kids_3d_back_1794175337509.jpg";
import baby3d180Img from "../assets/images/baby_3d_back_1794175376515.jpg";
import womenDress3d180Img from "../assets/images/women_dress_3d_back_1794175371716.jpg";

// 3D Studio Garment & Footwear Renders
import tshirt3dRenderImg from "../assets/images/tshirt_3d_render_1794174484642.jpg";
import pants3dRenderImg from "../assets/images/pants_3d_render_1794174531922.jpg";
import dress3dRenderImg from "../assets/images/dress_3d_render_1794174532274.jpg";
import romper3dRenderImg from "../assets/images/romper_3d_render_1794174535243.jpg";
import shoe3dRenderImg from "../assets/images/shoe_3d_render_1794174535350.jpg";

interface SizingIllustrationsProps {
  profile: SizingSubcategoryProfile;
  activeRow?: SizingTableRow | null;
  columns: SizingMeasurementColumn[];
  primaryUnit: "cm" | "in";
  displayUnit: "cm" | "in";
  highlightedKey?: string | null;
  onSelectKey?: (key: string | null) => void;
  currentLanguage?: string;
  compact?: boolean;
}

interface NumberedGuideItem {
  num: number;
  key: string;
  title: { en: string; ar: string; fr: string };
  desc: { en: string; ar: string; fr: string };
  preferGarment?: boolean;
  preferredAngle?: number;
}

interface TurntableStop {
  angle: number;
  src: string;
  mirrorX: boolean;
  scaleXBoost?: number;
  scaleYBoost?: number;
}

// Shortest signed angular difference in [-180, 180]
function shortestAngleDelta(fromDeg: number, toDeg: number): number {
  return ((((toDeg - fromDeg) % 360) + 540) % 360) - 180;
}

// Smoothstep interpolation
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Crisp 8-Angle 360° Turntable with Zero Ghosting/Blur, Tall & Fit Character Proportions,
 * 60FPS Spring Physics, and Real-Time Trigonometric 3D Measurement Rings.
 */
export const SizingIllustrations: React.FC<SizingIllustrationsProps> = ({
  profile,
  activeRow,
  columns,
  primaryUnit,
  displayUnit,
  highlightedKey,
  onSelectKey,
  currentLanguage = "en",
  compact = false,
}) => {
  const lang: "en" | "ar" | "fr" =
    currentLanguage === "ar" ? "ar" : currentLanguage === "fr" ? "fr" : "en";

  // Continuous floating-point 3D rotation angle [0, 360)
  const [renderAngle, setRenderAngle] = useState<number>(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Mutable physics state refs for 60fps requestAnimationFrame loop
  const currentAngleRef = useRef<number>(0);
  const targetAngleRef = useRef<number | null>(null);
  const velocityRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const isAutoSpinRef = useRef<boolean>(false);
  const lastPointerXRef = useRef<number>(0);
  const lastMoveTimeRef = useRef<number>(0);

  useEffect(() => {
    isAutoSpinRef.current = isAutoSpinning;
  }, [isAutoSpinning]);

  // 60FPS Spring & Inertia Physics Loop with Magnetic Angle Snapping (Zero Blur)
  useEffect(() => {
    let rafId = 0;

    const tick = () => {
      let updated = false;

      if (!isDraggingRef.current) {
        if (isAutoSpinRef.current) {
          currentAngleRef.current = (currentAngleRef.current + 0.75) % 360;
          targetAngleRef.current = null;
          velocityRef.current = 0;
          updated = true;
        } else if (targetAngleRef.current !== null) {
          const delta = shortestAngleDelta(
            currentAngleRef.current,
            targetAngleRef.current
          );
          if (Math.abs(delta) > 0.15) {
            currentAngleRef.current =
              (currentAngleRef.current + delta * 0.16 + 360) % 360;
            updated = true;
          } else {
            currentAngleRef.current = (targetAngleRef.current + 360) % 360;
            targetAngleRef.current = null;
            updated = true;
          }
        } else if (Math.abs(velocityRef.current) > 0.18) {
          // Coast with momentum after flick
          currentAngleRef.current =
            (currentAngleRef.current + velocityRef.current + 360) % 360;
          velocityRef.current *= 0.9;
          updated = true;
        } else if (velocityRef.current !== 0) {
          // Once momentum slows down, magnetically snap to the nearest crisp 45° studio angle
          velocityRef.current = 0;
          const nearestStop = (Math.round(currentAngleRef.current / 45) * 45) % 360;
          targetAngleRef.current = nearestStop;
        }
      }

      if (updated) {
        setRenderAngle(currentAngleRef.current);
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  // Command a smooth animated rotation to a specific degree
  const animateToAngle = (deg: number) => {
    setIsAutoSpinning(false);
    isAutoSpinRef.current = false;
    velocityRef.current = 0;
    targetAngleRef.current = ((deg % 360) + 360) % 360;
  };

  // Pointer drag handlers with velocity tracking and magnetic snap on release
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (profile === "shoes") return;
    setIsDragging(true);
    isDraggingRef.current = true;
    setIsAutoSpinning(false);
    isAutoSpinRef.current = false;
    targetAngleRef.current = null;
    velocityRef.current = 0;
    lastPointerXRef.current = e.clientX;
    lastMoveTimeRef.current = performance.now();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const now = performance.now();
    const dx = e.clientX - lastPointerXRef.current;
    const dt = Math.max(1, now - lastMoveTimeRef.current);

    const degDelta = dx * 0.9;
    currentAngleRef.current = (currentAngleRef.current + degDelta + 360) % 360;
    velocityRef.current = Math.max(-10, Math.min(10, (degDelta / dt) * 14));

    lastPointerXRef.current = e.clientX;
    lastMoveTimeRef.current = now;
    setRenderAngle(currentAngleRef.current);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    setIsDragging(false);
    isDraggingRef.current = false;
    if (
      performance.now() - lastMoveTimeRef.current > 70 ||
      Math.abs(velocityRef.current) <= 0.25
    ) {
      velocityRef.current = 0;
      const nearestStop = (Math.round(currentAngleRef.current / 45) * 45) % 360;
      targetAngleRef.current = nearestStop;
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if already released
    }
  };

  // Build the 8-stop (every 45°) turntable frame array with tall, fit vertical scaling
  const turntableStops: TurntableStop[] = useMemo(() => {
    if (profile === "mens_clothing" || profile === "trousers_shorts") {
      return [
        { angle: 0, src: men3dFrontImg, mirrorX: false, scaleXBoost: 1.06, scaleYBoost: 1.17 },
        { angle: 45, src: men3d45Img, mirrorX: false, scaleXBoost: 1.08, scaleYBoost: 1.19 },
        { angle: 90, src: men3d90Img, mirrorX: false, scaleXBoost: 1.08, scaleYBoost: 1.19 },
        { angle: 135, src: men3d135Img, mirrorX: true, scaleXBoost: 1.08, scaleYBoost: 1.19 },
        { angle: 180, src: men3d180Img, mirrorX: false, scaleXBoost: 1.06, scaleYBoost: 1.17 },
        { angle: 225, src: men3d135Img, mirrorX: false, scaleXBoost: 1.08, scaleYBoost: 1.19 },
        { angle: 270, src: men3d90Img, mirrorX: true, scaleXBoost: 1.08, scaleYBoost: 1.19 },
        { angle: 315, src: men3d45Img, mirrorX: true, scaleXBoost: 1.08, scaleYBoost: 1.19 },
      ];
    }
    if (profile === "childrens_clothing") {
      return [
        { angle: 0, src: kids3dFrontImg, mirrorX: false, scaleXBoost: 1.06, scaleYBoost: 1.16 },
        { angle: 45, src: kids3d45Img, mirrorX: true, scaleXBoost: 1.08, scaleYBoost: 1.18 },
        { angle: 90, src: kids3d90Img, mirrorX: true, scaleXBoost: 1.08, scaleYBoost: 1.18 },
        { angle: 135, src: kids3d135Img, mirrorX: false, scaleXBoost: 1.08, scaleYBoost: 1.18 },
        { angle: 180, src: kids3d180Img, mirrorX: false, scaleXBoost: 1.06, scaleYBoost: 1.16 },
        { angle: 225, src: kids3d135Img, mirrorX: true, scaleXBoost: 1.08, scaleYBoost: 1.18 },
        { angle: 270, src: kids3d90Img, mirrorX: false, scaleXBoost: 1.08, scaleYBoost: 1.18 },
        { angle: 315, src: kids3d45Img, mirrorX: false, scaleXBoost: 1.08, scaleYBoost: 1.18 },
      ];
    }
    if (profile === "baby_clothing") {
      return [
        { angle: 0, src: baby3dFrontImg, mirrorX: false, scaleXBoost: 1.05, scaleYBoost: 1.12 },
        { angle: 45, src: baby3d45Img, mirrorX: true, scaleXBoost: 1.06, scaleYBoost: 1.14 },
        { angle: 90, src: baby3d45Img, mirrorX: true, scaleXBoost: 1.06, scaleYBoost: 1.14 },
        { angle: 135, src: baby3d180Img, mirrorX: false, scaleXBoost: 1.05, scaleYBoost: 1.12 },
        { angle: 180, src: baby3d180Img, mirrorX: false, scaleXBoost: 1.05, scaleYBoost: 1.12 },
        { angle: 225, src: baby3d180Img, mirrorX: true, scaleXBoost: 1.05, scaleYBoost: 1.12 },
        { angle: 270, src: baby3d45Img, mirrorX: false, scaleXBoost: 1.06, scaleYBoost: 1.14 },
        { angle: 315, src: baby3d45Img, mirrorX: false, scaleXBoost: 1.06, scaleYBoost: 1.14 },
      ];
    }
    if (profile === "dresses_abayas") {
      return [
        { angle: 0, src: womenDress3dFrontImg, mirrorX: false, scaleXBoost: 1.06, scaleYBoost: 1.18 },
        { angle: 45, src: womenDress3d45Img, mirrorX: true, scaleXBoost: 1.08, scaleYBoost: 1.2 },
        { angle: 90, src: womenDress3d45Img, mirrorX: true, scaleXBoost: 1.08, scaleYBoost: 1.2 },
        { angle: 135, src: womenDress3d180Img, mirrorX: false, scaleXBoost: 1.06, scaleYBoost: 1.18 },
        { angle: 180, src: womenDress3d180Img, mirrorX: false, scaleXBoost: 1.06, scaleYBoost: 1.18 },
        { angle: 225, src: womenDress3d180Img, mirrorX: true, scaleXBoost: 1.06, scaleYBoost: 1.18 },
        { angle: 270, src: womenDress3d45Img, mirrorX: false, scaleXBoost: 1.08, scaleYBoost: 1.2 },
        { angle: 315, src: womenDress3d45Img, mirrorX: false, scaleXBoost: 1.08, scaleYBoost: 1.2 },
      ];
    }
    // Default: Women's 8-stop 360° Turntable — Tall, slender, athletic fit scaling
    return [
      { angle: 0, src: women3dFrontImg, mirrorX: false, scaleXBoost: 1.07, scaleYBoost: 1.19 },
      { angle: 45, src: women3d45Img, mirrorX: true, scaleXBoost: 1.09, scaleYBoost: 1.21 },
      { angle: 90, src: women3d90Img, mirrorX: true, scaleXBoost: 1.1, scaleYBoost: 1.22 },
      { angle: 135, src: women3d135Img, mirrorX: false, scaleXBoost: 1.09, scaleYBoost: 1.21 },
      { angle: 180, src: women3d180Img, mirrorX: false, scaleXBoost: 1.07, scaleYBoost: 1.19 },
      { angle: 225, src: women3d135Img, mirrorX: true, scaleXBoost: 1.09, scaleYBoost: 1.21 },
      { angle: 270, src: women3d90Img, mirrorX: false, scaleXBoost: 1.1, scaleYBoost: 1.22 },
      { angle: 315, src: women3d45Img, mirrorX: false, scaleXBoost: 1.09, scaleYBoost: 1.21 },
    ];
  }, [profile]);

  // Retrieve live measurement value for a given column key
  const getLiveValue = (key: string, preferGarment = false): string | null => {
    if (!activeRow) return null;
    const col =
      columns.find((c) => c.key === key && c.enabled) ||
      columns.find((c) => c.key === key);
    const unitType =
      col?.unitType ||
      (key === "weight" ? "weight" : key === "age_range" ? "text" : "length");

    const altKey = key === "bust" ? "chest" : key === "chest" ? "bust" : key;

    const raw = preferGarment
      ? activeRow.garmentValues?.[key] ||
        activeRow.garmentValues?.[altKey] ||
        activeRow.bodyValues?.[key] ||
        activeRow.bodyValues?.[altKey]
      : activeRow.bodyValues?.[key] ||
        activeRow.bodyValues?.[altKey] ||
        activeRow.garmentValues?.[key] ||
        activeRow.garmentValues?.[altKey];

    if (!raw || !raw.trim()) return null;
    const formatted = formatMeasurementValue(
      raw,
      primaryUnit,
      displayUnit,
      unitType
    );
    if (!formatted || formatted === "—") return null;

    if (unitType === "length") {
      return `${formatted} ${displayUnit.toUpperCase()}`;
    }
    if (unitType === "weight") {
      return `${formatted} kg`;
    }
    return formatted;
  };

  // Render a vivid blue (#0066FF) numbered circular badge inside SVG overlay
  const renderSvgNumberBadge = (
    num: number,
    cx: number,
    cy: number,
    key: string,
    r = 14,
    opacity = 1
  ) => {
    if (opacity <= 0.05) return null;
    const isHighlighted = highlightedKey === key;
    return (
      <g
        key={`badge-${num}-${key}`}
        style={{ opacity }}
        className="cursor-pointer select-none"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseEnter={() => onSelectKey && onSelectKey(key)}
        onMouseLeave={() => onSelectKey && onSelectKey(null)}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectKey) {
            onSelectKey(isHighlighted ? null : key);
          }
        }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={isHighlighted ? r + 2.5 : r}
          fill="#0066FF"
          stroke="#FFFFFF"
          strokeWidth="2.2"
        />
        <text
          x={cx}
          y={cy + 4.8}
          textAnchor="middle"
          fill="#FFFFFF"
          className="text-[13px] font-sans font-extrabold"
        >
          {num}
        </text>
      </g>
    );
  };

  // Render a continuous 3D elliptical body circumference ring that rotates in 3D space
  const render3DCircumferenceRing = (
    num: number,
    key: string,
    centerY: number,
    frontHalfWidth: number,
    sideHalfWidth: number,
    angleRad: number
  ) => {
    const absCos = Math.abs(Math.cos(angleRad));
    const halfW = sideHalfWidth + (frontHalfWidth - sideHalfWidth) * absCos;
    const x1 = 150 - halfW;
    const x2 = 150 + halfW;
    const isHighlighted = highlightedKey === key;

    const badgeX = 150 + Math.sin(angleRad) * (halfW * 0.42);
    const badgeY = centerY + 6;

    return (
      <g key={`ring-3d-${num}-${key}`}>
        {/* Back half of the 3D circumference tape */}
        <path
          d={`M ${x1} ${centerY} Q 150 ${centerY - 9} ${x2} ${centerY}`}
          fill="none"
          stroke="#0066FF"
          strokeOpacity="0.22"
          strokeWidth="1.6"
          strokeDasharray="3 3"
          className="pointer-events-none"
        />
        {/* Front visible half of the 3D circumference tape */}
        <path
          d={`M ${x1} ${centerY} Q 150 ${centerY + 11} ${x2} ${centerY}`}
          fill="none"
          stroke="#0066FF"
          strokeWidth={isHighlighted ? "3" : "2.3"}
          strokeDasharray="5 3.2"
          strokeDashoffset={-renderAngle * 0.45}
          className="pointer-events-none"
        />
        <path
          d={`M ${x1 + 6} ${centerY - 3.5} L ${x1} ${centerY} L ${x1 + 6} ${centerY + 4.5}`}
          fill="none"
          stroke="#0066FF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none"
        />
        <path
          d={`M ${x2 - 6} ${centerY - 3.5} L ${x2} ${centerY} L ${x2 - 6} ${centerY + 4.5}`}
          fill="none"
          stroke="#0066FF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none"
        />
        {renderSvgNumberBadge(num, badgeX, badgeY, key)}
      </g>
    );
  };

  // Helper to draw a horizontal or curved 3D dashed measurement arrow on garments
  const renderCurvedHorizontalArrow = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    curveOffset = 10
  ) => {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 + curveOffset;
    return (
      <g className="pointer-events-none">
        <path
          d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
          fill="none"
          stroke="#0066FF"
          strokeWidth="2.3"
          strokeDasharray="5 3.5"
        />
        <path
          d={`M ${x1 + 7} ${y1 - 4} L ${x1} ${y1} L ${x1 + 7} ${y1 + 5}`}
          fill="none"
          stroke="#0066FF"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`M ${x2 - 7} ${y2 - 4} L ${x2} ${y2} L ${x2 - 7} ${y2 + 5}`}
          fill="none"
          stroke="#0066FF"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  };

  // Helper to draw a straight dashed line with arrowheads at both ends
  const renderStraightDashedArrow = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    withEndTicks = false,
    opacity = 1
  ) => {
    if (opacity <= 0.05) return null;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 7.5;
    const ax1 = x1 + headLen * Math.cos(angle - Math.PI / 6);
    const ay1 = y1 + headLen * Math.sin(angle - Math.PI / 6);
    const bx1 = x1 + headLen * Math.cos(angle + Math.PI / 6);
    const by1 = y1 + headLen * Math.sin(angle + Math.PI / 6);

    const ax2 = x2 - headLen * Math.cos(angle - Math.PI / 6);
    const ay2 = y2 - headLen * Math.sin(angle - Math.PI / 6);
    const bx2 = x2 - headLen * Math.cos(angle + Math.PI / 6);
    const by2 = y2 - headLen * Math.sin(angle + Math.PI / 6);

    return (
      <g className="pointer-events-none" style={{ opacity }}>
        {withEndTicks && (
          <>
            <line
              x1={x1 - 10}
              y1={y1}
              x2={x1 + 10}
              y2={y1}
              stroke="#0066FF"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <line
              x1={x2 - 10}
              y1={y2}
              x2={x2 + 10}
              y2={y2}
              stroke="#0066FF"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </>
        )}
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#0066FF"
          strokeWidth="2.3"
          strokeDasharray="5.5 3.5"
        />
        <path
          d={`M ${ax1} ${ay1} L ${x1} ${y1} L ${bx1} ${by1}`}
          fill="none"
          stroke="#0066FF"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`M ${ax2} ${ay2} L ${x2} ${y2} L ${bx2} ${by2}`}
          fill="none"
          stroke="#0066FF"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  };

  // Profile-specific numbered guide items (1 through 8)
  const getGuideItemsForProfile = (): NumberedGuideItem[] => {
    switch (profile) {
      case "womens_clothing":
        return [
          {
            num: 1,
            key: "height",
            preferredAngle: 0,
            title: { en: "Height", ar: "الطول الكلي", fr: "Hauteur" },
            desc: {
              en: "Total height from head to toe.",
              ar: "الطول الكلي من أعلى الرأس إلى القدمين.",
              fr: "Hauteur totale de la tête aux pieds.",
            },
          },
          {
            num: 2,
            key: "bust",
            preferredAngle: 0,
            title: { en: "Bust", ar: "الصدر", fr: "Poitrine" },
            desc: {
              en: "Measure around the fullest part.",
              ar: "يقاس حول الجزء الأكثر امتلاءً من الصدر.",
              fr: "Mesurez autour de la partie la plus forte.",
            },
          },
          {
            num: 3,
            key: "waist",
            preferredAngle: 45,
            title: { en: "Waist", ar: "الخصر", fr: "Tour de taille" },
            desc: {
              en: "Measure around your natural waist.",
              ar: "يقاس حول خط الخصر الطبيعي.",
              fr: "Mesurez autour de votre taille naturelle.",
            },
          },
          {
            num: 4,
            key: "hips",
            preferredAngle: 90,
            title: { en: "Hips", ar: "الأرداف", fr: "Hanches" },
            desc: {
              en: "Measure around the fullest part of your hips.",
              ar: "يقاس حول الجزء الأكثر امتلاءً من الأرداف.",
              fr: "Mesurez autour de la partie la plus large des hanches.",
            },
          },
          {
            num: 5,
            key: "shoulder_width",
            preferGarment: true,
            preferredAngle: 180,
            title: { en: "Shoulder Width", ar: "عرض الكتفين", fr: "Largeur d'épaules" },
            desc: {
              en: "From one shoulder to the other.",
              ar: "من طرف الكتف الأيمن إلى الأيسر.",
              fr: "D'une épaule à l'autre.",
            },
          },
          {
            num: 6,
            key: "sleeve_length",
            preferGarment: true,
            preferredAngle: 90,
            title: { en: "Sleeve Length", ar: "طول الكم", fr: "Longueur de manche" },
            desc: {
              en: "From shoulder to wrist.",
              ar: "من الكتف إلى نهاية الكم.",
              fr: "De l'épaule au poignet.",
            },
          },
          {
            num: 7,
            key: "garment_length",
            preferGarment: true,
            preferredAngle: 180,
            title: { en: "Garment Length", ar: "طول القطعة", fr: "Longueur du vêtement" },
            desc: {
              en: "From shoulder to hem.",
              ar: "من أعلى الكتف إلى الحافة السفلية.",
              fr: "De l'épaule jusqu'à l'ourlet.",
            },
          },
          {
            num: 8,
            key: "bust",
            preferGarment: true,
            preferredAngle: 0,
            title: { en: "Chest Width", ar: "عرض الصدر", fr: "Largeur poitrine" },
            desc: {
              en: "Across the chest.",
              ar: "عرض الصدر للقطعة.",
              fr: "À travers la poitrine.",
            },
          },
        ];

      case "mens_clothing":
        return [
          {
            num: 1,
            key: "height",
            preferredAngle: 0,
            title: { en: "Height", ar: "الطول الكلي", fr: "Hauteur" },
            desc: {
              en: "Total height from head to toe.",
              ar: "الطول الكلي من الرأس إلى القدمين.",
              fr: "Hauteur totale de la tête aux pieds.",
            },
          },
          {
            num: 2,
            key: "chest",
            preferredAngle: 0,
            title: { en: "Chest", ar: "الصدر", fr: "Poitrine" },
            desc: {
              en: "Measure around the fullest part.",
              ar: "يقاس حول أوسع جزء من الصدر.",
              fr: "Mesurez autour de la partie la plus large.",
            },
          },
          {
            num: 3,
            key: "waist",
            preferredAngle: 45,
            title: { en: "Waist", ar: "الخصر", fr: "Tour de taille" },
            desc: {
              en: "Measure around your natural waist.",
              ar: "يقاس حول خط الخصر الطبيعي.",
              fr: "Mesurez autour de votre taille naturelle.",
            },
          },
          {
            num: 4,
            key: "hips",
            preferredAngle: 90,
            title: { en: "Hips", ar: "الأرداف", fr: "Hanches" },
            desc: {
              en: "Measure around the fullest part of your hips.",
              ar: "يقاس حول الجزء الأعرض من الأرداف.",
              fr: "Mesurez autour des hanches.",
            },
          },
          {
            num: 5,
            key: "shoulder_width",
            preferGarment: true,
            preferredAngle: 180,
            title: { en: "Shoulder Width", ar: "عرض الكتفين", fr: "Largeur d'épaules" },
            desc: {
              en: "From one shoulder to the other.",
              ar: "من طرف الكتف إلى الطرف الآخر.",
              fr: "D'une épaule à l'autre.",
            },
          },
          {
            num: 6,
            key: "sleeve_length",
            preferGarment: true,
            preferredAngle: 90,
            title: { en: "Sleeve Length", ar: "طول الكم", fr: "Longueur de manche" },
            desc: {
              en: "From shoulder to wrist.",
              ar: "من الكتف إلى طرف الكم.",
              fr: "De l'épaule au poignet.",
            },
          },
          {
            num: 7,
            key: "garment_length",
            preferGarment: true,
            preferredAngle: 180,
            title: { en: "Garment Length", ar: "طول القطعة", fr: "Longueur du vêtement" },
            desc: {
              en: "From shoulder to hem.",
              ar: "من أعلى الكتف إلى أسفل القطعة.",
              fr: "De l'épaule à l'ourlet.",
            },
          },
          {
            num: 8,
            key: "chest",
            preferGarment: true,
            preferredAngle: 0,
            title: { en: "Chest Width", ar: "عرض الصدر", fr: "Largeur poitrine" },
            desc: {
              en: "Across the chest.",
              ar: "عرض الصدر للقطعة.",
              fr: "À travers la poitrine.",
            },
          },
        ];

      case "dresses_abayas":
        return [
          {
            num: 1,
            key: "height",
            preferredAngle: 0,
            title: { en: "Height", ar: "الطول الكلي", fr: "Hauteur" },
            desc: {
              en: "Total height from head to toe.",
              ar: "الطول الكلي من الرأس إلى القدمين.",
              fr: "Hauteur totale de la tête aux pieds.",
            },
          },
          {
            num: 2,
            key: "bust",
            preferredAngle: 0,
            title: { en: "Bust", ar: "الصدر", fr: "Poitrine" },
            desc: {
              en: "Measure around the fullest part.",
              ar: "يقاس حول الجزء الأوسع من الصدر.",
              fr: "Mesurez autour de la poitrine.",
            },
          },
          {
            num: 3,
            key: "waist",
            preferredAngle: 45,
            title: { en: "Waist", ar: "الخصر", fr: "Tour de taille" },
            desc: {
              en: "Measure around your natural waist.",
              ar: "يقاس حول الخصر الطبيعي.",
              fr: "Mesurez autour de la taille.",
            },
          },
          {
            num: 4,
            key: "hips",
            preferredAngle: 90,
            title: { en: "Hips", ar: "الأرداف", fr: "Hanches" },
            desc: {
              en: "Measure around the fullest part of your hips.",
              ar: "يقاس حول أعرض جزء من الأرداف.",
              fr: "Mesurez autour des hanches.",
            },
          },
          {
            num: 5,
            key: "shoulder_width",
            preferGarment: true,
            preferredAngle: 180,
            title: { en: "Shoulder Width", ar: "عرض الكتفين", fr: "Largeur d'épaules" },
            desc: {
              en: "From one shoulder to the other.",
              ar: "من الكتف إلى الكتف المقابل.",
              fr: "D'une épaule à l'autre.",
            },
          },
          {
            num: 6,
            key: "sleeve_length",
            preferGarment: true,
            preferredAngle: 90,
            title: { en: "Sleeve Length", ar: "طول الكم", fr: "Longueur de manche" },
            desc: {
              en: "From shoulder to wrist.",
              ar: "من الكتف إلى المعصم.",
              fr: "De l'épaule au poignet.",
            },
          },
          {
            num: 7,
            key: "garment_length",
            preferGarment: true,
            preferredAngle: 180,
            title: { en: "Dress / Abaya Length", ar: "طول الفستان / العباية", fr: "Longueur totale" },
            desc: {
              en: "From shoulder to bottom hem.",
              ar: "من أعلى الكتف إلى الحافة السفلية.",
              fr: "De l'épaule jusqu'à l'ourlet.",
            },
          },
          {
            num: 8,
            key: "bust",
            preferGarment: true,
            preferredAngle: 0,
            title: { en: "Chest Width", ar: "عرض الصدر", fr: "Largeur poitrine" },
            desc: {
              en: "Across the chest.",
              ar: "عرض الصدر للقطعة.",
              fr: "À travers la poitrine.",
            },
          },
        ];

      case "trousers_shorts":
        return [
          {
            num: 1,
            key: "height",
            preferredAngle: 0,
            title: { en: "Height", ar: "الطول الكلي", fr: "Hauteur" },
            desc: {
              en: "Total height from head to toe.",
              ar: "الطول الكلي من الرأس إلى القدمين.",
              fr: "Hauteur totale de la tête aux pieds.",
            },
          },
          {
            num: 3,
            key: "waist",
            preferredAngle: 0,
            title: { en: "Waist", ar: "الخصر", fr: "Tour de taille" },
            desc: {
              en: "Measure around your natural waist.",
              ar: "يقاس حول خط الخصر الطبيعي.",
              fr: "Mesurez autour de votre taille naturelle.",
            },
          },
          {
            num: 4,
            key: "hips",
            preferredAngle: 135,
            title: { en: "Hips", ar: "الأرداف", fr: "Hanches" },
            desc: {
              en: "Measure around the fullest part of your hips.",
              ar: "يقاس حول الجزء الأعرض من الأرداف.",
              fr: "Mesurez autour des hanches.",
            },
          },
          {
            num: 5,
            key: "waist",
            preferGarment: true,
            preferredAngle: 0,
            title: { en: "Waistband Width", ar: "عرض حزام الخصر", fr: "Largeur ceinture" },
            desc: {
              en: "Across the top waistband.",
              ar: "على طول حزام البنطال العلوي.",
              fr: "Le long de la ceinture supérieure.",
            },
          },
          {
            num: 6,
            key: "thigh",
            preferGarment: true,
            preferredAngle: 45,
            title: { en: "Thigh Width", ar: "عرض الفخذ", fr: "Tour de cuisse" },
            desc: {
              en: "Measured across the thigh.",
              ar: "يقاس عبر عرض الفخذ.",
              fr: "Largeur au niveau de la cuisse.",
            },
          },
          {
            num: 7,
            key: "outseam",
            preferGarment: true,
            preferredAngle: 90,
            title: { en: "Outseam Length", ar: "الطول الخارجي", fr: "Longueur extérieure" },
            desc: {
              en: "From top of waistband to ankle hem.",
              ar: "من أعلى الخصر إلى نهاية الساق.",
              fr: "Du haut de la taille jusqu'à l'ourlet.",
            },
          },
          {
            num: 8,
            key: "inseam",
            preferGarment: true,
            preferredAngle: 0,
            title: { en: "Inseam Length", ar: "طول الساق الداخلي", fr: "Entrejambe" },
            desc: {
              en: "From inner crotch seam to bottom hem.",
              ar: "من الخياطة الداخلية للفخذ إلى الكاحل.",
              fr: "De l'entrejambe jusqu'au bas.",
            },
          },
        ];

      case "childrens_clothing":
        return [
          {
            num: 1,
            key: "height",
            preferredAngle: 0,
            title: { en: "Height", ar: "طول الطفل", fr: "Hauteur" },
            desc: {
              en: "Total height from head to toe.",
              ar: "الطول الكلي للطفل من الرأس للقدم.",
              fr: "Hauteur totale de la tête aux pieds.",
            },
          },
          {
            num: 2,
            key: "chest",
            preferredAngle: 0,
            title: { en: "Chest", ar: "الصدر", fr: "Poitrine" },
            desc: {
              en: "Measure around the fullest part.",
              ar: "يقاس حول الصدر بشكل مريح.",
              fr: "Tour de poitrine de l'enfant.",
            },
          },
          {
            num: 3,
            key: "waist",
            preferredAngle: 45,
            title: { en: "Waist", ar: "الخصر", fr: "Taille" },
            desc: {
              en: "Measure around the natural waist.",
              ar: "يقاس حول الخصر الطبيعي.",
              fr: "Tour de taille naturel.",
            },
          },
          {
            num: 4,
            key: "hips",
            preferredAngle: 90,
            title: { en: "Hips", ar: "الأرداف", fr: "Hanches" },
            desc: {
              en: "Measure around the fullest part of hips.",
              ar: "يقاس حول الأرداف.",
              fr: "Tour de hanches.",
            },
          },
          {
            num: 5,
            key: "shoulder_width",
            preferGarment: true,
            preferredAngle: 180,
            title: { en: "Shoulder Width", ar: "عرض الكتفين", fr: "Largeur d'épaules" },
            desc: {
              en: "From one shoulder to the other.",
              ar: "من الكتف إلى الكتف المقابل.",
              fr: "D'une épaule à l'autre.",
            },
          },
          {
            num: 6,
            key: "sleeve_length",
            preferGarment: true,
            preferredAngle: 90,
            title: { en: "Sleeve Length", ar: "طول الكم", fr: "Longueur de manche" },
            desc: {
              en: "From shoulder to cuff.",
              ar: "من الكتف إلى نهاية الكم.",
              fr: "De l'épaule au poignet.",
            },
          },
          {
            num: 7,
            key: "garment_length",
            preferGarment: true,
            preferredAngle: 180,
            title: { en: "Garment Length", ar: "طول القطعة", fr: "Longueur du vêtement" },
            desc: {
              en: "From shoulder to hem.",
              ar: "من الكتف إلى أسفل القطعة.",
              fr: "De l'épaule à l'ourlet.",
            },
          },
          {
            num: 8,
            key: "chest",
            preferGarment: true,
            preferredAngle: 0,
            title: { en: "Chest Width", ar: "عرض الصدر", fr: "Largeur poitrine" },
            desc: {
              en: "Across the chest.",
              ar: "عرض الصدر للقطعة.",
              fr: "À travers la poitrine.",
            },
          },
        ];

      case "baby_clothing":
        return [
          {
            num: 1,
            key: "height",
            preferredAngle: 0,
            title: { en: "Baby Height", ar: "طول الرضيع", fr: "Taille du bébé" },
            desc: {
              en: "Total length from head to toe.",
              ar: "الطول الكلي من الرأس إلى القدم.",
              fr: "Longueur totale de la tête aux pieds.",
            },
          },
          {
            num: 2,
            key: "chest",
            preferredAngle: 0,
            title: { en: "Chest", ar: "الصدر", fr: "Poitrine" },
            desc: {
              en: "Measure gently around baby's chest.",
              ar: "يقاس بلطف حول صدر الرضيع.",
              fr: "Tour de poitrine du bébé.",
            },
          },
          {
            num: 3,
            key: "weight",
            preferredAngle: 45,
            title: { en: "Baby Weight", ar: "وزن الرضيع", fr: "Poids du bébé" },
            desc: {
              en: "Approximate weight range in kg.",
              ar: "الوزن التقريبي بالكيلوغرام.",
              fr: "Poids approximatif en kg.",
            },
          },
          {
            num: 5,
            key: "age_range",
            preferredAngle: 180,
            title: { en: "Age (Months)", ar: "العمر بالأشهر", fr: "Âge (Mois)" },
            desc: {
              en: "Recommended stage in months.",
              ar: "الفئة العمرية بالأشهر.",
              fr: "Tranche d'âge en mois.",
            },
          },
          {
            num: 7,
            key: "garment_length",
            preferGarment: true,
            preferredAngle: 180,
            title: { en: "Romper Length", ar: "طول الرومبر", fr: "Longueur totale" },
            desc: {
              en: "From shoulder to bottom snap.",
              ar: "من الكتف إلى أسفل القطعة.",
              fr: "De l'épaule jusqu'au bas.",
            },
          },
          {
            num: 8,
            key: "chest",
            preferGarment: true,
            preferredAngle: 0,
            title: { en: "Chest Width", ar: "عرض الصدر", fr: "Largeur poitrine" },
            desc: {
              en: "Across the romper chest.",
              ar: "عرض الصدر للقطعة.",
              fr: "À travers la barboteuse.",
            },
          },
        ];

      case "shoes":
        return [
          {
            num: 1,
            key: "foot_length",
            title: { en: "Foot Length", ar: "طول القدم", fr: "Longueur du pied" },
            desc: {
              en: "From back of heel to tip of longest toe.",
              ar: "من مؤخرة الكعب إلى أطول إصبع.",
              fr: "Du talon jusqu'au bout de l'orteil le plus long.",
            },
          },
          {
            num: 2,
            key: "foot_width",
            title: { en: "Foot Width", ar: "عرض القدم", fr: "Largeur du pied" },
            desc: {
              en: "Across the widest part of the forefoot.",
              ar: "عرض أوسع منطقة في مقدمة القدم.",
              fr: "Largeur de la partie la plus large du pied.",
            },
          },
          {
            num: 3,
            key: "insole_length",
            preferGarment: true,
            title: { en: "Insole Length", ar: "طول النعل الداخلي", fr: "Semelle intérieure" },
            desc: {
              en: "Interior footbed length from heel to toe.",
              ar: "طول النعل الداخلي للحذاء.",
              fr: "Longueur intérieure de la chaussure.",
            },
          },
        ];
    }
  };

  const guideItems = getGuideItemsForProfile();

  // Render a single numbered entry inside the "Measurements Guide" card
  const renderGuideListItem = (item: NumberedGuideItem) => {
    const liveVal = getLiveValue(item.key, item.preferGarment);
    const isHighlighted = highlightedKey === item.key;

    return (
      <div
        key={`${item.num}-${item.key}-${item.preferGarment ? "g" : "b"}`}
        onMouseEnter={() => onSelectKey && onSelectKey(item.key)}
        onMouseLeave={() => onSelectKey && onSelectKey(null)}
        onClick={() => {
          if (onSelectKey) {
            onSelectKey(isHighlighted ? null : item.key);
          }
          if (item.preferredAngle !== undefined && profile !== "shoes") {
            animateToAngle(item.preferredAngle);
          }
        }}
        className={`flex items-start gap-3 p-2 rounded-xl transition-colors cursor-pointer ${
          isHighlighted
            ? "bg-[#0066FF]/12 dark:bg-[#0066FF]/25 ring-1 ring-[#0066FF]/40"
            : "hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
        }`}
      >
        <span className="w-6 h-6 rounded-full bg-[#0066FF] text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
          {item.num}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[13.5px] font-bold text-slate-900 dark:text-white leading-tight">
              {item.title[lang]}
            </span>
            {liveVal && (
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#0D131F] border border-slate-200/90 dark:border-slate-700/80 text-[11px] font-mono font-bold text-[#0066FF] dark:text-[#3B82F6] tabular-nums">
                {liveVal}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
            {item.desc[lang]}
          </p>
        </div>
      </div>
    );
  };

  // Render the Crisp, Zero-Blur 8-Angle 3D Character + Real-Time Trigonometric 3D Rings
  const renderInteractive3DCharacter = () => {
    if (profile === "shoes") return null;

    // Adjusted vertical coordinates matching the taller, fitter character scaling
    let headTopY = 14;
    let feetBottomY = 385;
    let bustY = 108;
    let bustFrontHalfW = 37;
    let bustSideHalfW = 24;
    let waistY = 152;
    let waistFrontHalfW = 33;
    let waistSideHalfW = 21;
    let hipsY = 202;
    let hipsFrontHalfW = 41;
    let hipsSideHalfW = 28;
    let shoulderY = 74;
    let shoulderHalfW = 48;
    let chestKey = "bust";

    if (profile === "mens_clothing" || profile === "trousers_shorts") {
      headTopY = 16;
      feetBottomY = 385;
      bustY = 114;
      bustFrontHalfW = 41;
      bustSideHalfW = 27;
      waistY = 162;
      waistFrontHalfW = 37;
      waistSideHalfW = 24;
      hipsY = 206;
      hipsFrontHalfW = 39;
      hipsSideHalfW = 26;
      shoulderY = 78;
      shoulderHalfW = 52;
      chestKey = "chest";
    } else if (profile === "childrens_clothing") {
      headTopY = 16;
      feetBottomY = 385;
      bustY = 128;
      bustFrontHalfW = 36;
      bustSideHalfW = 23;
      waistY = 176;
      waistFrontHalfW = 36;
      waistSideHalfW = 23;
      hipsY = 220;
      hipsFrontHalfW = 38;
      hipsSideHalfW = 25;
      shoulderY = 88;
      shoulderHalfW = 45;
      chestKey = "chest";
    } else if (profile === "baby_clothing") {
      headTopY = 18;
      feetBottomY = 384;
      bustY = 158;
      bustFrontHalfW = 42;
      bustSideHalfW = 30;
      waistY = 210;
      waistFrontHalfW = 42;
      waistSideHalfW = 30;
      hipsY = 250;
      hipsFrontHalfW = 40;
      hipsSideHalfW = 28;
      shoulderY = 110;
      shoulderHalfW = 46;
      chestKey = "chest";
    } else if (profile === "dresses_abayas") {
      headTopY = 18;
      feetBottomY = 385;
      bustY = 114;
      bustFrontHalfW = 36;
      bustSideHalfW = 24;
      waistY = 156;
      waistFrontHalfW = 36;
      waistSideHalfW = 24;
      hipsY = 206;
      hipsFrontHalfW = 40;
      hipsSideHalfW = 27;
      shoulderY = 78;
      shoulderHalfW = 44;
      chestKey = "bust";
    }

    const angleRad = (renderAngle * Math.PI) / 180;
    const roundedDeg = Math.round(renderAngle) % 360;

    // Identify the single closest 45° turntable stop so ONLY ONE crisp frame is shown at 100% opacity (zero ghosting/blur!)
    const nearestStopAngle = (Math.round(renderAngle / 45) * 45) % 360;

    // Opacity weights for side-profile (Sleeve/Outseam) and back-view (Shoulder/Back Length) callouts
    const sideVisibility = Math.pow(Math.abs(Math.sin(angleRad)), 1.6);
    const backVisibility = Math.max(
      0,
      smoothstep(105, 145, renderAngle) * (1 - smoothstep(215, 255, renderAngle))
    );

    return (
      <div className="w-full flex flex-col items-center">
        {/* Compact Single-Row 360° Turntable Control Bar (Never wraps) */}
        <div className="w-full flex items-center justify-between gap-1 pb-1.5 px-1 overflow-x-auto no-scrollbar">
          <div className="inline-flex items-center gap-1 rounded-full bg-[#EEF3F9] dark:bg-slate-800 px-2 py-0.5 text-[10.5px] font-mono font-bold text-[#0066FF] shrink-0">
            <MoveHorizontal className="w-3 h-3" />
            <span>{roundedDeg}°</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {(
              [
                { deg: 0, label: lang === "ar" ? "أمام" : lang === "fr" ? "Face" : "Front" },
                { deg: 45, label: "45°" },
                { deg: 90, label: lang === "ar" ? "جانب" : lang === "fr" ? "Profil" : "Side" },
                { deg: 135, label: "135°" },
                { deg: 180, label: lang === "ar" ? "خلف" : lang === "fr" ? "Dos" : "Back" },
                { deg: 270, label: "270°" },
              ] as const
            ).map((btn) => {
              const isNear = nearestStopAngle === btn.deg;
              return (
                <button
                  key={btn.deg}
                  type="button"
                  onClick={() => animateToAngle(btn.deg)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    isNear
                      ? "bg-[#0066FF] text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setIsAutoSpinning((prev) => !prev)}
              title="360° Smooth Auto-Turntable"
              className={`p-1 rounded-full border transition-colors cursor-pointer shrink-0 ${
                isAutoSpinning
                  ? "bg-[#0066FF] text-white border-[#0066FF]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#0066FF] hover:text-[#0066FF]"
              }`}
            >
              <RotateCw className={`w-3 h-3 ${isAutoSpinning ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* TALL, FIT, RAZOR-SHARP 3D Character Viewport (Zero Double-Exposure Blur) */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: "pan-y" }}
          className={`relative w-full ${
            compact
              ? "h-[370px] max-w-[275px]"
              : "h-[480px] sm:h-[530px] lg:h-[555px] max-w-[380px]"
          } flex items-center justify-center select-none mx-auto overflow-hidden ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {/* Pre-mounted 8-angle layers: ONLY the active stop has opacity=1 so it is 100% sharp and never blurry! */}
          {turntableStops.map((stop) => {
            const isActiveStop = stop.angle === nearestStopAngle;
            const delta = shortestAngleDelta(stop.angle, renderAngle);
            // Smooth 3D cylindrical rotation within the [-22.5°, +22.5°] sector
            const rotY = isActiveStop ? delta * 0.36 : 0;
            const sx = (stop.scaleXBoost || 1.08) * (stop.mirrorX ? -1 : 1);
            const sy = stop.scaleYBoost || 1.2;

            return (
              <img
                key={`stop-${stop.angle}`}
                src={stop.src}
                alt={`3D model at ${stop.angle} degrees`}
                draggable={false}
                style={{
                  opacity: isActiveStop ? 1 : 0,
                  transformOrigin: "50% 54%",
                  transform: `perspective(1100px) rotateY(${rotY.toFixed(
                    2
                  )}deg) scaleX(${sx.toFixed(3)}) scaleY(${sy.toFixed(3)})`,
                  imageRendering: "auto",
                }}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />
            );
          })}

          {/* Continuous 60FPS Trigonometric 3D Measurement Overlay */}
          <svg
            viewBox="0 0 300 400"
            className="absolute inset-0 w-full h-full z-10"
            aria-hidden="true"
          >
            {/* 3D Turntable Studio Pedestal Ring Under Feet with Orbiting Degree Node */}
            <ellipse
              cx="150"
              cy="388"
              rx="88"
              ry="9"
              fill="none"
              stroke="#0066FF"
              strokeOpacity="0.38"
              strokeWidth="1.8"
              strokeDasharray="6 3.5"
              strokeDashoffset={-renderAngle * 0.85}
              className="pointer-events-none"
            />
            <circle
              cx={150 + 88 * Math.sin(angleRad)}
              cy={388 + 9 * Math.cos(angleRad)}
              r="4"
              fill="#0066FF"
              stroke="#FFFFFF"
              strokeWidth="1.4"
              className="pointer-events-none"
            />

            {/* 1. Height Vertical Laser Axis on Left (Matches full-height tall character head-to-toe) */}
            {renderStraightDashedArrow(28, headTopY, 28, feetBottomY, true)}
            {renderSvgNumberBadge(1, 28, (headTopY + feetBottomY) / 2, "height")}

            {/* 2. Continuous 3D Bust / Chest Circumference Ring */}
            {profile !== "trousers_shorts" &&
              render3DCircumferenceRing(
                2,
                chestKey,
                bustY,
                bustFrontHalfW,
                bustSideHalfW,
                angleRad
              )}

            {/* 3. Continuous 3D Waist Circumference Ring */}
            {render3DCircumferenceRing(
              3,
              profile === "baby_clothing" ? "weight" : "waist",
              waistY,
              waistFrontHalfW,
              waistSideHalfW,
              angleRad
            )}

            {/* 4. Continuous 3D Hips Circumference Ring */}
            {profile !== "baby_clothing" &&
              render3DCircumferenceRing(
                4,
                "hips",
                hipsY,
                hipsFrontHalfW,
                hipsSideHalfW,
                angleRad
              )}

            {/* 6. Side Profile Sleeve / Arm Length Vector */}
            {profile !== "trousers_shorts" &&
              profile !== "baby_clothing" &&
              sideVisibility > 0.15 && (
                <g>
                  {renderStraightDashedArrow(
                    Math.sin(angleRad) >= 0 ? 172 : 128,
                    shoulderY + 6,
                    Math.sin(angleRad) >= 0 ? 186 : 114,
                    waistY + 28,
                    false,
                    sideVisibility
                  )}
                  {renderSvgNumberBadge(
                    6,
                    Math.sin(angleRad) >= 0 ? 184 : 116,
                    (shoulderY + waistY) / 2 + 12,
                    "sleeve_length",
                    13.5,
                    sideVisibility
                  )}
                </g>
              )}

            {/* 7. Side Profile Outseam Length for Trousers */}
            {profile === "trousers_shorts" && sideVisibility > 0.15 && (
              <g>
                {renderStraightDashedArrow(
                  168,
                  waistY,
                  164,
                  feetBottomY - 14,
                  false,
                  sideVisibility
                )}
                {renderSvgNumberBadge(
                  7,
                  166,
                  275,
                  "outseam",
                  13.5,
                  sideVisibility
                )}
              </g>
            )}

            {/* 5. Back Shoulder Width & 7. Back Garment Length */}
            {backVisibility > 0.1 && (
              <g>
                {renderStraightDashedArrow(
                  150 - shoulderHalfW * Math.abs(Math.cos(angleRad)),
                  shoulderY,
                  150 + shoulderHalfW * Math.abs(Math.cos(angleRad)),
                  shoulderY,
                  false,
                  backVisibility
                )}
                {renderSvgNumberBadge(
                  5,
                  150,
                  shoulderY,
                  "shoulder_width",
                  14,
                  backVisibility
                )}

                {profile !== "trousers_shorts" && (
                  <>
                    {renderStraightDashedArrow(
                      178,
                      shoulderY - 4,
                      178,
                      profile === "dresses_abayas" ? feetBottomY - 14 : hipsY - 10,
                      false,
                      backVisibility
                    )}
                    {renderSvgNumberBadge(
                      7,
                      178,
                      profile === "dresses_abayas"
                        ? 235
                        : (shoulderY + hipsY) / 2 - 6,
                      "garment_length",
                      14,
                      backVisibility
                    )}
                  </>
                )}
              </g>
            )}
          </svg>
        </div>

        {/* Bottom Smooth 360° Turntable Scrubber & Controls */}
        <div className="w-full max-w-[320px] px-2 pt-0.5 flex flex-col items-center gap-0.5">
          <div className="w-full flex items-center gap-2">
            <button
              type="button"
              onClick={() => animateToAngle(nearestStopAngle - 45)}
              className="p-1 rounded-full text-slate-500 hover:text-[#0066FF] hover:bg-slate-100 transition-colors cursor-pointer"
              title="Rotate -45°"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={0}
              max={359}
              step={1}
              value={roundedDeg}
              onChange={(e) => {
                const val = Number(e.target.value);
                setIsAutoSpinning(false);
                isAutoSpinRef.current = false;
                targetAngleRef.current = null;
                velocityRef.current = 0;
                currentAngleRef.current = val;
                setRenderAngle(val);
              }}
              aria-label="Rotate 3D body model 360 degrees"
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0066FF]"
            />
            <button
              type="button"
              onClick={() => animateToAngle(nearestStopAngle + 45)}
              className="p-1 rounded-full text-slate-500 hover:text-[#0066FF] hover:bg-slate-100 transition-colors cursor-pointer"
              title="Rotate +45°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            {lang === "ar"
              ? "اسحب المجسم لتدويره 360° بوضوح كامل"
              : lang === "fr"
              ? "Glissez le modèle pour pivoter à 360° avec netteté"
              : "Drag model left or right to rotate 360°"}
          </span>
        </div>
      </div>
    );
  };

  // Render the Tall 3D Garment Render (3D T-Shirt, 3D Pants, 3D Dress/Abaya, 3D Romper, or 3D Sneakers)
  const render3DGarmentFigure = () => {
    const heightClasses = compact
      ? "h-[340px] max-w-[250px]"
      : "h-[450px] sm:h-[500px] lg:h-[525px] max-w-[345px]";

    // 1. TROUSERS & SHORTS: 3D Jeans / Tailored Pants Render
    if (profile === "trousers_shorts") {
      return (
        <div
          className={`relative w-full ${heightClasses} flex items-center justify-center select-none mx-auto`}
        >
          <img
            src={pants3dRenderImg}
            alt="3D studio render of tailored denim trousers"
            className="w-full h-full object-contain rounded-2xl pointer-events-none"
            loading="eager"
          />
          <svg
            viewBox="0 0 300 400"
            className="absolute inset-0 w-full h-full"
            aria-hidden="true"
          >
            {renderStraightDashedArrow(82, 22, 218, 22)}
            {renderSvgNumberBadge(5, 150, 22, "waist")}

            {renderCurvedHorizontalArrow(154, 162, 224, 162, 8)}
            {renderSvgNumberBadge(6, 189, 165, "thigh")}

            {renderStraightDashedArrow(238, 26, 238, 378)}
            {renderSvgNumberBadge(7, 238, 210, "outseam")}

            {renderStraightDashedArrow(146, 134, 132, 376)}
            {renderSvgNumberBadge(8, 138, 265, "inseam")}
          </svg>
        </div>
      );
    }

    // 2. DRESSES & ABAYAS: 3D Full-Length Modest Dress / Abaya Render
    if (profile === "dresses_abayas") {
      return (
        <div
          className={`relative w-full ${heightClasses} flex items-center justify-center select-none mx-auto`}
        >
          <img
            src={dress3dRenderImg}
            alt="3D studio render of a modest full-length long-sleeve dress"
            className="w-full h-full object-contain rounded-2xl pointer-events-none"
            loading="eager"
          />
          <svg
            viewBox="0 0 300 400"
            className="absolute inset-0 w-full h-full"
            aria-hidden="true"
          >
            {renderStraightDashedArrow(94, 24, 206, 24)}
            {renderSvgNumberBadge(5, 150, 24, "shoulder_width")}

            {renderStraightDashedArrow(208, 36, 230, 178)}
            {renderSvgNumberBadge(6, 222, 108, "sleeve_length")}

            {renderStraightDashedArrow(184, 28, 184, 382)}
            {renderSvgNumberBadge(7, 184, 235, "garment_length")}

            {renderCurvedHorizontalArrow(106, 102, 194, 102, 9)}
            {renderSvgNumberBadge(8, 150, 106, "bust")}
          </svg>
        </div>
      );
    }

    // 3. BABY CLOTHING: 3D Baby Romper Render
    if (profile === "baby_clothing") {
      return (
        <div
          className={`relative w-full ${heightClasses} flex items-center justify-center select-none mx-auto`}
        >
          <img
            src={romper3dRenderImg}
            alt="3D studio render of a full-coverage baby romper"
            className="w-full h-full object-contain rounded-2xl pointer-events-none"
            loading="eager"
          />
          <svg
            viewBox="0 0 300 400"
            className="absolute inset-0 w-full h-full"
            aria-hidden="true"
          >
            {renderStraightDashedArrow(68, 36, 232, 36)}
            {renderSvgNumberBadge(5, 150, 36, "age_range")}

            {renderStraightDashedArrow(192, 42, 192, 362)}
            {renderSvgNumberBadge(7, 192, 225, "garment_length")}

            {renderCurvedHorizontalArrow(78, 152, 222, 152, 10)}
            {renderSvgNumberBadge(8, 150, 156, "chest")}
          </svg>
        </div>
      );
    }

    // 4. SHOES: 3D White Leather Sneaker Pair
    if (profile === "shoes") {
      return (
        <div
          className={`relative w-full ${
            compact
              ? "h-[340px] max-w-[300px]"
              : "h-[460px] sm:h-[500px] max-w-[400px]"
          } flex items-center justify-center select-none mx-auto`}
        >
          <img
            src={shoe3dRenderImg}
            alt="3D studio render of a white sneaker side profile and top-down view"
            className="w-full h-full object-contain rounded-2xl pointer-events-none"
            loading="eager"
          />
          <svg
            viewBox="0 0 300 400"
            className="absolute inset-0 w-full h-full"
            aria-hidden="true"
          >
            {renderStraightDashedArrow(26, 44, 26, 352, true)}
            {renderSvgNumberBadge(1, 26, 198, "foot_length")}

            {renderCurvedHorizontalArrow(162, 142, 268, 142, 8)}
            {renderSvgNumberBadge(2, 215, 145, "foot_width")}

            {renderStraightDashedArrow(215, 52, 215, 344)}
            {renderSvgNumberBadge(3, 215, 245, "insole_length")}
          </svg>
        </div>
      );
    }

    // 5. DEFAULT (WOMEN'S, MEN'S, CHILDREN'S): 3D White Crew-Neck T-Shirt Render
    const chestKey = profile === "womens_clothing" ? "bust" : "chest";
    return (
      <div
        className={`relative w-full ${heightClasses} flex items-center justify-center select-none mx-auto`}
      >
        <img
          src={tshirt3dRenderImg}
          alt="3D studio render of a crisp white crew-neck T-shirt"
          className="w-full h-full object-contain rounded-2xl pointer-events-none"
          loading="eager"
        />
        <svg
          viewBox="0 0 300 400"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <line
            x1="56"
            y1="42"
            x2="56"
            y2="66"
            stroke="#0066FF"
            strokeWidth="1.8"
            strokeDasharray="3 2"
          />
          <line
            x1="244"
            y1="42"
            x2="244"
            y2="66"
            stroke="#0066FF"
            strokeWidth="1.8"
            strokeDasharray="3 2"
          />
          {renderStraightDashedArrow(56, 48, 244, 48)}
          {renderSvgNumberBadge(5, 150, 48, "shoulder_width")}

          {renderStraightDashedArrow(248, 72, 286, 162)}
          {renderSvgNumberBadge(6, 268, 117, "sleeve_length")}

          {renderStraightDashedArrow(198, 60, 198, 356)}
          {renderSvgNumberBadge(7, 198, 242, "garment_length")}

          {renderCurvedHorizontalArrow(72, 174, 228, 174, 12)}
          {renderSvgNumberBadge(8, 150, 179, chestKey)}
        </svg>
      </div>
    );
  };

  // Compact layout for Merchant Wizard side-panel preview
  if (compact) {
    return (
      <div className="w-full space-y-4">
        <div
          className={`grid ${
            profile === "shoes" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
          } gap-3 items-center justify-items-center bg-white rounded-2xl p-3 border border-slate-200/80 dark:border-[#1E293B] shadow-2xs`}
        >
          {profile !== "shoes" && renderInteractive3DCharacter()}
          {render3DGarmentFigure()}
        </div>

        <div className="rounded-2xl bg-[#F4F6FA] dark:bg-[#161F30] border border-slate-200/70 dark:border-[#1E293B] p-3.5 space-y-2 max-h-[280px] overflow-y-auto">
          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white px-1">
            {lang === "ar"
              ? "دليل القياسات"
              : lang === "fr"
              ? "Guide des Mesures"
              : "Measurements Guide"}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {guideItems.map((item) => renderGuideListItem(item))}
          </div>
        </div>
      </div>
    );
  }

  // TALL Full 3-Column 3D Studio Layout
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      {/* Left & Center Tall 3D Studio Stage (Cols 1-8): Crisp 360° Clothed Human + 3D Garment */}
      <div className="lg:col-span-8 bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-[#1E293B] grid grid-cols-1 sm:grid-cols-2 gap-3 items-center justify-items-center min-h-[540px] sm:min-h-[600px]">
        {profile !== "shoes" ? (
          <>
            <div className="w-full flex items-center justify-center">
              {renderInteractive3DCharacter()}
            </div>
            <div className="w-full flex items-center justify-center">
              {render3DGarmentFigure()}
            </div>
          </>
        ) : (
          <div className="sm:col-span-2 w-full flex items-center justify-center">
            {render3DGarmentFigure()}
          </div>
        )}
      </div>

      {/* Right Column (Cols 9-12): Tall "Measurements Guide" Card (1 to 8) */}
      <div className="lg:col-span-4 rounded-2xl bg-[#F4F6FA] dark:bg-[#161F30] border border-slate-200/80 dark:border-[#1E293B] p-4 sm:p-5 flex flex-col justify-between self-stretch min-h-[540px] sm:min-h-[600px]">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 px-1 pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              {lang === "ar"
                ? "دليل القياسات"
                : lang === "fr"
                ? "Guide des Mesures"
                : "Measurements Guide"}
            </h3>
            {activeRow && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#0066FF]/10 dark:bg-[#0066FF]/20 text-xs font-mono font-extrabold text-[#0066FF] dark:text-[#3B82F6]">
                {activeRow.sizeLabel}
              </span>
            )}
          </div>

          <div className="space-y-1.5 pt-1">
            {guideItems.map((item) => renderGuideListItem(item))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizingIllustrations;
