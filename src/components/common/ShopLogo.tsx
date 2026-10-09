import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';

export interface ShopLogoProps {
  logoUrl?: string;
  shopName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  imgClassName?: string;
  variant?: 'light' | 'dark' | 'mono' | 'transparent';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showBorder?: boolean;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-18 h-18 text-lg',
  '2xl': 'w-24 h-24 text-xl',
  custom: '',
};

const ROUNDED_MAP = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

export const ShopLogo: React.FC<ShopLogoProps> = ({
  logoUrl,
  shopName = 'Mobile Shop',
  size = 'md',
  className = '',
  imgClassName = '',
  variant = 'light',
  rounded = 'lg',
  showBorder = false,
}) => {
  const [imgError, setImgError] = useState(false);

  // Compute initials fallback (e.g. "ABC Mobile Center" -> "ABC", "PakMobile Pro" -> "PM", "Mobile Shop" -> "MS")
  const getInitials = (name: string): string => {
    if (!name || name.trim() === '') return 'MS';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    if (words.length === 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    // 3 or more words: take first letter of each (up to 3)
    return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
  };

  const hasValidLogo = Boolean(logoUrl && logoUrl.trim() && !imgError);

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const roundedClass = ROUNDED_MAP[rounded] || ROUNDED_MAP.lg;

  // Background styling for the logo container
  let bgClass = 'bg-white';
  if (variant === 'dark') {
    bgClass = 'bg-slate-900 text-white';
  } else if (variant === 'mono') {
    bgClass = 'bg-slate-100 text-slate-900';
  } else if (variant === 'transparent') {
    bgClass = 'bg-transparent';
  }

  const borderClass = showBorder ? 'border border-slate-200 shadow-2xs' : '';

  if (hasValidLogo) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${sizeClass} ${roundedClass} ${bgClass} ${borderClass} ${className}`}
        style={{ aspectRatio: '1 / 1' }}
        title={shopName}
      >
        <img
          src={logoUrl}
          alt={shopName}
          onError={() => setImgError(true)}
          className={`w-full h-full object-contain select-none ${imgClassName}`}
          loading="eager"
          decoding="sync"
          crossOrigin="anonymous"
        />
      </div>
    );
  }

  // Fallback to professional application default branding:
  // A sleek device badge with shop initials and emerald accent
  const initials = getInitials(shopName);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none font-black tracking-tight ${sizeClass} ${roundedClass} ${
        variant === 'dark'
          ? 'bg-gradient-to-br from-blue-900 via-blue-700 to-amber-500 text-white shadow-md'
          : variant === 'mono'
          ? 'bg-[#0a2347] text-white shadow-xs'
          : 'bg-gradient-to-br from-blue-700 via-indigo-700 to-amber-400 text-white shadow-xs border border-blue-400/40'
      } ${borderClass} ${className}`}
      style={{ aspectRatio: '1 / 1' }}
      title={shopName}
    >
      {/* Icon watermark behind initials */}
      <Smartphone className="absolute inset-0 m-auto w-3/4 h-3/4 opacity-25 pointer-events-none" />
      <span className="relative z-10 uppercase font-black leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
        {initials}
      </span>
      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-white/50" />
    </div>
  );
};
