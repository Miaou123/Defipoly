// src/components/icons/GameAssets.tsx
// Visual assets for the game board - buildings, location pins, etc.

import React from 'react';

interface LocationPinProps {
  color: string;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  className?: string;
}

interface BankSVGProps {
  isPulsing?: boolean;
  className?: string;
}

// ============================================
// LOCATION PIN - For empty properties
// ============================================

export function LocationPin({ color, size = 'medium', className = '' }: LocationPinProps) {
  const getColorHex = (colorClass: string): string => {
    const colorMap: { [key: string]: string } = {
      'bg-amber-900': '#78350f',
      'bg-sky-300': '#7dd3fc',
      'bg-pink-400': '#f472b6',
      'bg-orange-500': '#f97316',
      'bg-red-600': '#dc2626',
      'bg-yellow-400': '#facc15',
      'bg-green-600': '#16a34a',
      'bg-blue-900': '#1e3a8a',
    };
    return colorMap[colorClass] || '#9333ea';
  };

  const dimensions = {
    tiny: { width: 20, height: 25 },
    small: { width: 40, height: 50 },
    medium: { width: 60, height: 75 },
    large: { width: 80, height: 100 }
  }[size];

  const pinColor = getColorHex(color);
  const isYellow = color === 'bg-yellow-400';
  const strokeColor = isYellow ? '#333' : 'white';
  const strokeOpacity = isYellow ? 0.4 : 0.6;
  const highlightOpacity = isYellow ? 0.7 : 0.4;

  return (
    <svg 
      width={dimensions.width} 
      height={dimensions.height} 
      viewBox="0 0 60 75" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto ${className}`}
    >
      <ellipse cx="30" cy="70" rx="9" ry="3" fill="#000000" opacity="0.2"/>
      <rect x="27" y="30" width="6" height="42" fill="#9ca3af" rx="3"/>
      <circle cx="30" cy="22" r="18" fill={pinColor}/>
      <path 
        d="M 24 15 Q 27 12 30 12 Q 33 12 36 15" 
        stroke={strokeColor} 
        strokeWidth="3" 
        fill="none" 
        strokeLinecap="round" 
        opacity={strokeOpacity}
      />
      <circle cx="25.5" cy="18" r="3" fill="white" opacity={highlightOpacity}/>
    </svg>
  );
}

// ============================================
// MONEY BILL SVGS - For income animation
// ============================================

export const GreenBillSVG = () => (
  <svg viewBox="0 0 24 16" className="w-full h-full">
    <rect x="1" y="1" width="22" height="14" rx="2" fill="#22c55e" stroke="#15803d" strokeWidth="1"/>
    <circle cx="12" cy="8" r="4" fill="#15803d" opacity="0.3"/>
    <text x="12" y="10.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#15803d">$</text>
    <rect x="3" y="3" width="2" height="10" fill="#15803d" opacity="0.2"/>
    <rect x="19" y="3" width="2" height="10" fill="#15803d" opacity="0.2"/>
  </svg>
);

export const GoldBillSVG = () => (
  <svg viewBox="0 0 24 16" className="w-full h-full">
    <rect x="1" y="1" width="22" height="14" rx="2" fill="#fbbf24" stroke="#d97706" strokeWidth="1"/>
    <circle cx="12" cy="8" r="4" fill="#d97706" opacity="0.3"/>
    <text x="12" y="10.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#92400e">$</text>
    <rect x="3" y="3" width="2" height="10" fill="#d97706" opacity="0.2"/>
    <rect x="19" y="3" width="2" height="10" fill="#d97706" opacity="0.2"/>
  </svg>
);

export const MoneyBagSVG = () => (
  <svg viewBox="0 0 20 20" className="w-full h-full">
    <path d="M10 2 L7 5 L13 5 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5"/>
    <ellipse cx="10" cy="12" rx="6" ry="6" fill="#fbbf24" stroke="#d97706" strokeWidth="1"/>
    <text x="10" y="14.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#92400e">$</text>
    <path d="M7 5 Q10 7 13 5" fill="none" stroke="#d97706" strokeWidth="1"/>
  </svg>
);

export const DiamondSVG = () => (
  <svg viewBox="0 0 20 20" className="w-full h-full">
    <polygon points="10,2 18,8 10,18 2,8" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1"/>
    <polygon points="10,2 14,8 10,14 6,8" fill="#93c5fd" opacity="0.5"/>
    <line x1="2" y1="8" x2="18" y2="8" stroke="#3b82f6" strokeWidth="0.5"/>
    <line x1="10" y1="2" x2="6" y2="8" stroke="#3b82f6" strokeWidth="0.5"/>
    <line x1="10" y1="2" x2="14" y2="8" stroke="#3b82f6" strokeWidth="0.5"/>
  </svg>
);

export const MONEY_SYMBOLS = {
  green: GreenBillSVG,
  gold: GoldBillSVG,
  bag: MoneyBagSVG,
  diamond: DiamondSVG,
};

export const BankSVG = ({ isPulsing = false, className = '' }: BankSVGProps) => (
  <svg 
    viewBox="0 0 120 80" 
    className={`transition-transform duration-150 ${isPulsing ? 'scale-105' : 'scale-100'} ${className}`}
    style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))' }}
  >
    <defs>
      <linearGradient id="bankRoofGold" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#fef08a' }} />
        <stop offset="50%" style={{ stopColor: '#fbbf24' }} />
        <stop offset="100%" style={{ stopColor: '#b45309' }} />
      </linearGradient>
      <linearGradient id="bankWall" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#fafafa' }} />
        <stop offset="100%" style={{ stopColor: '#a1a1aa' }} />
      </linearGradient>
      <linearGradient id="bankPillar" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#e4e4e7' }} />
        <stop offset="30%" style={{ stopColor: '#ffffff' }} />
        <stop offset="70%" style={{ stopColor: '#f4f4f5' }} />
        <stop offset="100%" style={{ stopColor: '#a1a1aa' }} />
      </linearGradient>
      <linearGradient id="bankPurple" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#c084fc' }} />
        <stop offset="50%" style={{ stopColor: '#a855f7' }} />
        <stop offset="100%" style={{ stopColor: '#7c3aed' }} />
      </linearGradient>
      <linearGradient id="bankHatBand" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#fcd34d' }} />
        <stop offset="100%" style={{ stopColor: '#d97706' }} />
      </linearGradient>
    </defs>
    <polygon points="60,3 118,28 2,28" fill="url(#bankRoofGold)" stroke="#92400e" strokeWidth="1.5"/>
    <polygon points="60,7 112,26 8,26" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
    <circle cx="20" cy="24" r="2.5" fill="url(#bankPurple)"/>
    <circle cx="100" cy="24" r="2.5" fill="url(#bankPurple)"/>
    <rect x="2" y="28" width="116" height="8" fill="url(#bankPurple)"/>
    <rect x="2" y="28" width="116" height="2" fill="rgba(255,255,255,0.4)"/>
    <g fill="#581c87">
      {[8,16,24,32,40,48,56,64,72,80,88,96,104].map(x => (
        <rect key={x} x={x} y="33" width="3" height="3"/>
      ))}
    </g>
    <rect x="5" y="36" width="110" height="38" fill="url(#bankWall)"/>
    {[7, 19, 31, 43, 69, 81, 93, 105].map((x, i) => (
      <g key={i}>
        <rect x={x} y={36} width={8} height={38} fill="url(#bankPillar)"/>
        <rect x={x} y={36} width={8} height={3} fill="url(#bankPurple)"/>
        <rect x={x - 1} y={71} width={10} height={3} fill="url(#bankPurple)"/>
      </g>
    ))}
    <rect x="52" y="45" width="16" height="29" fill="#3b0764" rx="1"/>
    <ellipse cx="60" cy="45" rx="8" ry="5" fill="#3b0764"/>
    <ellipse cx="60" cy="45" rx="6" ry="3" fill="none" stroke="url(#bankPurple)" strokeWidth="0.8"/>
    <rect x="54" y="47" width="5" height="25" fill="#4c1d95" rx="1"/>
    <rect x="61" y="47" width="5" height="25" fill="#4c1d95" rx="1"/>
    <circle cx="58" cy="61" r="1" fill="url(#bankHatBand)"/>
    <circle cx="62" cy="61" r="1" fill="url(#bankHatBand)"/>
    <rect x="0" y="74" width="120" height="6" fill="url(#bankPurple)"/>
    <rect x="0" y="74" width="120" height="1.5" fill="rgba(255,255,255,0.2)"/>
  </svg>
);