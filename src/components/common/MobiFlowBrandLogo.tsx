import React from 'react';

export interface MobiFlowBrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
  variant?: 'horizontal' | 'vertical';
}

const SIZE_MAP = {
  xs: { icon: 'w-6 h-6', text: 'text-sm', sub: 'text-[7px]', gap: 'gap-1.5' },
  sm: { icon: 'w-8 h-8', text: 'text-base', sub: 'text-[8px]', gap: 'gap-2' },
  md: { icon: 'w-11 h-11', text: 'text-xl', sub: 'text-[9px]', gap: 'gap-2.5' },
  lg: { icon: 'w-14 h-14', text: 'text-2xl', sub: 'text-[11px]', gap: 'gap-3' },
  xl: { icon: 'w-20 h-20', text: 'text-3xl', sub: 'text-xs', gap: 'gap-3.5' },
  '2xl': { icon: 'w-28 h-28', text: 'text-4xl', sub: 'text-sm', gap: 'gap-4' },
};

/**
 * MobiFlow Official Premium Brand Logo (Updated 2026 Edition)
 * 
 * Features:
 * - Dimensional Smartphone Frame & Hexagonal Shield in Royal Sapphire Blue
 * - Dynamic Infinity Flow "M" Ribbon in Electric Blue, Sky Cyan & Deep Indigo
 * - Radiant Golden/Yellow Spark Diamond Emblem (Canary Gold #FACC15 / #F59E0B)
 * - Modern High-Contrast Typography: Bold "MOBI" + Gradient "FLOW"
 * - Subtitle: "ENTERPRISE MOBILE ERP · POS" with precision golden accent dividers
 */
export const MobiFlowBrandLogo: React.FC<MobiFlowBrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  theme = 'light',
  variant = 'horizontal',
}) => {
  const currentSize = SIZE_MAP[size] || SIZE_MAP.md;
  const isDark = theme === 'dark';

  return (
    <div
      className={`inline-flex items-center select-none ${
        variant === 'vertical' ? 'flex-col text-center' : 'flex-row text-left'
      } ${currentSize.gap} ${className}`}
    >
      {/* 3D Geometric Vector Symbol */}
      <div className={`relative ${currentSize.icon} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_16px_rgba(37,99,235,0.45)]"
        >
          <defs>
            {/* Primary Royal Blue to Electric Sapphire */}
            <linearGradient id="mfRoyalBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            {/* Glowing Sky Cyan Highlight */}
            <linearGradient id="mfCyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            {/* Radiant Golden Yellow Spark */}
            <linearGradient id="mfGoldSpark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="35%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            {/* Dimensional Deep Indigo Base */}
            <linearGradient id="mfDeepBase" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="50%" stopColor="#1E1B4B" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>

            {/* Filter for subtle golden ambient glow */}
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Rounded Isometric Device Frame */}
          <rect
            x="14"
            y="14"
            width="92"
            height="92"
            rx="24"
            fill="url(#mfDeepBase)"
            stroke="url(#mfRoyalBlue)"
            strokeWidth="3.5"
          />

          {/* Inner Glossy Screen Glass */}
          <rect
            x="22"
            y="22"
            width="76"
            height="76"
            rx="18"
            fill="#0A1E3F"
            stroke="rgba(56, 189, 248, 0.25)"
            strokeWidth="1.5"
          />

          {/* Smartphone Top Speaker Bar */}
          <line
            x1="48"
            y1="28"
            x2="72"
            y2="28"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Dynamic Flow Ribbon Fold 1 (Deep Shadow Curve) */}
          <path
            d="M32 80 C 32 50, 48 38, 60 52 C 72 66, 88 54, 88 38"
            stroke="url(#mfRoyalBlue)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.4"
          />

          {/* Main "M" & Infinity Flow Ribbon (Cyan to Blue Gradient) */}
          <path
            d="M34 82 L 34 46 C 34 38, 44 34, 52 44 L 60 56 L 68 44 C 76 34, 86 38, 86 46 L 86 82"
            stroke="url(#mfRoyalBlue)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Foreground Dynamic Flow Accent Wave */}
          <path
            d="M38 72 C 48 58, 54 58, 60 66 C 66 74, 72 74, 82 60"
            stroke="url(#mfCyanGlow)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central High-Tech Microchip / Core Diamond */}
          <polygon
            points="60,40 68,48 60,56 52,48"
            fill="url(#mfGoldSpark)"
            filter="url(#goldGlow)"
          />

          {/* Golden Yellow Spark Star on Top-Right Corner */}
          <g transform="translate(86, 18)">
            <path
              d="M 10 0 L 12 7 L 19 10 L 12 13 L 10 20 L 8 13 L 1 10 L 8 7 Z"
              fill="url(#mfGoldSpark)"
            />
            <circle cx="10" cy="10" r="2" fill="#FFFFFF" />
          </g>

          {/* Small Yellow Precision Dot (Bottom Left) */}
          <circle cx="34" cy="88" r="2.5" fill="#FACC15" />
          <circle cx="86" cy="88" r="2.5" fill="#38BDF8" />
        </svg>
      </div>

      {/* Modern High-End Typography Wordmark */}
      {showText && (
        <div className={`flex flex-col leading-none ${variant === 'vertical' ? 'items-center mt-1' : 'items-start'}`}>
          <div className="flex items-center gap-0.5">
            <span
              className={`font-black tracking-tight ${currentSize.text} ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}
            >
              MOBI
            </span>
            <span className={`font-black tracking-tight ${currentSize.text} bg-gradient-to-r from-blue-500 via-sky-400 to-amber-300 bg-clip-text text-transparent`}>
              FLOW
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5 mb-1 animate-pulse" />
          </div>

          {/* Subtitle with Gold Dividers */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-[1.5px] bg-amber-400 rounded-full" />
            <span
              className={`font-extrabold tracking-[0.24em] ${currentSize.sub} uppercase ${
                isDark ? 'text-amber-300' : 'text-blue-900'
              }`}
            >
              ENTERPRISE MOBILE ERP
            </span>
            <span className="w-2 h-[1.5px] bg-amber-400 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};
