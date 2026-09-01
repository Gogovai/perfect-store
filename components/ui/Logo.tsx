import React from 'react';
import Link from 'next/link';
import { brand } from '@/config/brand';

interface LogoProps {
  /** Logo size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to link to homepage */
  linked?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Marketplace logo using text/icon combination.
 * Replace with SVG/PNG when a real logo is designed.
 * All brand identity comes from config/brand.ts.
 */
export function Logo({ size = 'md', linked = true, className = '' }: LogoProps) {
  const sizeConfig = {
    sm: {
      box: 'h-7 w-7',
      text: 'text-sm',
      name: 'text-base',
    },
    md: {
      box: 'h-8 w-8',
      text: 'text-sm',
      name: 'text-lg',
    },
    lg: {
      box: 'h-10 w-10',
      text: 'text-base',
      name: 'text-xl',
    },
  };

  const s = sizeConfig[size];

  const logoContent = (
    <div className={`flex items-center gap-2 font-bold text-gray-900 ${className}`}>
      <div
        className={`${s.box} rounded-lg flex items-center justify-center`}
        style={{ backgroundColor: brand.colors.primary }}
      >
        <span className="text-white font-bold" style={{ fontSize: size === 'lg' ? '16px' : '13px' }}>
          {brand.shortName}
        </span>
      </div>
      <span className={`${s.name} hidden sm:inline`}>{brand.name}</span>
    </div>
  );

  if (linked) {
    return (
      <Link href="/" aria-label={`${brand.name} - Home`}>
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
