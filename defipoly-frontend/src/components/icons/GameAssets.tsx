// src/components/icons/GameAssets.tsx
// Visual assets for the game board - buildings, location pins, etc.

import React from 'react';

interface LocationPinProps {
  color: string; // Tailwind color class like 'bg-amber-900'
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
      'bg-amber-900': '#78350f',    // Brown
      'bg-sky-300': '#7dd3fc',      // Light Blue
      'bg-pink-400': '#f472b6',     // Pink
      'bg-orange-500': '#f97316',   // Orange
      'bg-red-600': '#dc2626',      // Red
      'bg-yellow-400': '#facc15',   // Yellow
      'bg-green-600': '#16a34a',    // Green
      'bg-blue-900': '#1e3a8a',     // Dark Blue
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
  
  // For yellow, use darker stroke for better visibility
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
      {/* Shadow */}
      <ellipse cx="30" cy="70" rx="9" ry="3" fill="#000000" opacity="0.2"/>
      
      {/* Post - connects properly to the pin head */}
      <rect x="27" y="30" width="6" height="42" fill="#9ca3af" rx="3"/>
      
      {/* Pin head - uses property color */}
      <circle cx="30" cy="22" r="18" fill={pinColor}/>
      
      {/* Shine highlight on top */}
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
// BUILDING SVGS - Property development levels
// ============================================

export const BUILDING_SVGS: { [key: number]: React.ReactNode } = {
  0: <></>,
  1: (
    // Small Single House
    <svg width="35" height="35" viewBox="0 0 35 35" className="w-full h-auto">
      <ellipse cx="17.5" cy="31" rx="11" ry="3" fill="black" opacity="0.2"/>
      {/* Main structure */}
      <path d="M 17.5 15 L 26 18 L 26 30 L 17.5 32 L 9 30 L 9 18 Z" fill="#D2691E"/>
      <path d="M 17.5 15 L 26 18 L 26 30 L 17.5 25 Z" fill="#A0522D"/>
      {/* Roof */}
      <path d="M 17.5 8 L 28 13 L 26 18 L 17.5 15 L 9 18 L 7 13 Z" fill="#8B4513"/>
      <path d="M 17.5 8 L 28 13 L 26 18 L 17.5 15 Z" fill="#654321"/>
      {/* Door */}
      <rect x="15" y="26" width="5" height="6" fill="#654321"/>
      {/* Windows */}
      <rect x="11" y="22" width="3" height="3" fill="#FFFFCC"/>
      <rect x="21" y="22" width="3" height="3" fill="#FFFFCC"/>
    </svg>
  ),
  2: (
    // Larger House with Chimney
    <svg width="48" height="48" viewBox="0 0 48 48" className="w-full h-auto">
      <ellipse cx="24" cy="42" rx="15" ry="3.5" fill="black" opacity="0.25"/>
      {/* Main structure */}
      <path d="M 24 18 L 36 22 L 36 41 L 24 43 L 12 41 L 12 22 Z" fill="#D2691E"/>
      <path d="M 24 18 L 36 22 L 36 41 L 24 32 Z" fill="#A0522D"/>
      {/* Chimney */}
      <rect x="15" y="10" width="4" height="10" fill="#8B4513"/>
      <rect x="14" y="9" width="6" height="2" fill="#654321"/>
      {/* Roof */}
      <path d="M 24 11 L 38 17 L 36 22 L 24 18 L 12 22 L 10 17 Z" fill="#8B4513"/>
      <path d="M 24 11 L 38 17 L 36 22 L 24 18 Z" fill="#654321"/>
      {/* Door (centered) */}
      <rect x="20.5" y="35" width="7" height="8" fill="#654321"/>
      <circle cx="25.5" cy="39" r="0.6" fill="#FFD700"/>
      {/* Windows - 4 windows, higher and symmetrical */}
      <rect x="14" y="25" width="4" height="4" fill="#FFFFCC"/>
      <rect x="30" y="25" width="4" height="4" fill="#FFFFCC"/>
      <rect x="14" y="33" width="4" height="4" fill="#FFFFCC"/>
      <rect x="30" y="33" width="4" height="4" fill="#FFFFCC"/>
    </svg>
  ),
  3: (
    // Apartment Building (3-story) - thinner, centered
    <svg width="50" height="55" viewBox="0 0 50 55" className="w-full h-auto">
      <ellipse cx="25" cy="51" rx="19" ry="4.5" fill="black" opacity="0.3"/>
      {/* Main structure - thinner */}
      <path d="M 25 10 L 40 15 L 40 50 L 25 52 L 10 50 L 10 15 Z" fill="#C19A6B"/>
      <path d="M 25 10 L 40 15 L 40 50 L 25 30 Z" fill="#9C7A4F"/>
      {/* Roof */}
      <rect x="8" y="10" width="34" height="5" fill="#8B4513"/>
      {/* Windows - 3 floors, centered symmetrically */}
      <rect x="13" y="20" width="4" height="4" fill="#FFFFCC"/>
      <rect x="23" y="20" width="4" height="4" fill="#FFFFCC"/>
      <rect x="33" y="20" width="4" height="4" fill="#FFFFCC"/>
      
      <rect x="13" y="29" width="4" height="4" fill="#FFFFCC"/>
      <rect x="23" y="29" width="4" height="4" fill="#FFFFCC"/>
      <rect x="33" y="29" width="4" height="4" fill="#FFFFCC"/>
      
      <rect x="13" y="38" width="4" height="4" fill="#FFFFCC"/>
      <rect x="33" y="38" width="4" height="4" fill="#FFFFCC"/>
      
      {/* Door - centered */}
      <rect x="21" y="45" width="8" height="7" fill="#654321"/>
      <circle cx="27" cy="48.5" r="0.6" fill="#FFD700"/>
    </svg>
  ),
  4: (
    // Large Office Building (5-story) - 4 columns evenly spread
    <svg width="60" height="60" viewBox="0 0 60 60" className="w-full h-auto">
      <ellipse cx="30" cy="56" rx="24" ry="5" fill="black" opacity="0.35"/>
      {/* Main structure */}
      <path d="M 30 5 L 50 10 L 50 55 L 30 58 L 10 55 L 10 10 Z" fill="#B8B8B8"/>
      <path d="M 30 5 L 50 10 L 50 55 L 30 25 Z" fill="#A0A0A0"/>
      {/* Roof structure */}
      <rect x="8" y="5" width="44" height="5" fill="#808080"/>
      {/* Windows - 5 floors, 4 columns evenly spread */}
      <rect x="14" y="15" width="3" height="3" fill="#FFFFCC"/>
      <rect x="24" y="15" width="3" height="3" fill="#FFFFCC"/>
      <rect x="34" y="15" width="3" height="3" fill="#FFFFCC"/>
      <rect x="44" y="15" width="3" height="3" fill="#FFFFCC"/>
      
      <rect x="14" y="22" width="3" height="3" fill="#FFFFCC"/>
      <rect x="24" y="22" width="3" height="3" fill="#FFFFCC"/>
      <rect x="34" y="22" width="3" height="3" fill="#FFFFCC"/>
      <rect x="44" y="22" width="3" height="3" fill="#FFFFCC"/>
      
      <rect x="14" y="29" width="3" height="3" fill="#FFFFCC"/>
      <rect x="24" y="29" width="3" height="3" fill="#FFFFCC"/>
      <rect x="34" y="29" width="3" height="3" fill="#FFFFCC"/>
      <rect x="44" y="29" width="3" height="3" fill="#FFFFCC"/>
      
      <rect x="14" y="36" width="3" height="3" fill="#FFFFCC"/>
      <rect x="24" y="36" width="3" height="3" fill="#FFFFCC"/>
      <rect x="34" y="36" width="3" height="3" fill="#FFFFCC"/>
      <rect x="44" y="36" width="3" height="3" fill="#FFFFCC"/>
      
      <rect x="14" y="43" width="3" height="3" fill="#FFFFCC"/>
      <rect x="24" y="43" width="3" height="3" fill="#FFFFCC"/>
      <rect x="34" y="43" width="3" height="3" fill="#FFFFCC"/>
      <rect x="44" y="43" width="3" height="3" fill="#FFFFCC"/>
      
      {/* Entrance (centered) */}
      <rect x="26" y="50" width="8" height="8" fill="#404040"/>
      <circle cx="32" cy="54" r="0.7" fill="#FFD700"/>
    </svg>
  ),
  5: (
    // HOTEL - Premium skyscraper with grand entrance
    <svg width="65" height="65" viewBox="0 0 65 65" className="w-full h-auto">
      <ellipse cx="32.5" cy="61" rx="26" ry="5" fill="black" opacity="0.4"/>
      {/* Main structure - Platinum/Silver */}
      <path d="M 32.5 2 L 55 8 L 55 60 L 32.5 63 L 10 60 L 10 8 Z" fill="#E8E8E8"/>
      <path d="M 32.5 2 L 55 8 L 55 60 L 32.5 20 Z" fill="#D0D0D0"/>
      {/* Gold roof accent */}
      <rect x="8" y="2" width="49" height="6" fill="#FFD700"/>
      
      {/* Windows - 4 columns × 5 rows */}
      <rect x="14" y="13" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="24" y="13" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="37" y="13" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="47" y="13" width="3.5" height="3.5" fill="#FFFFCC"/>
      
      <rect x="14" y="21" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="24" y="21" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="37" y="21" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="47" y="21" width="3.5" height="3.5" fill="#FFFFCC"/>
      
      <rect x="14" y="29" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="24" y="29" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="37" y="29" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="47" y="29" width="3.5" height="3.5" fill="#FFFFCC"/>
      
      <rect x="14" y="37" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="24" y="37" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="37" y="37" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="47" y="37" width="3.5" height="3.5" fill="#FFFFCC"/>
      
      <rect x="14" y="45" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="47" y="45" width="3.5" height="3.5" fill="#FFFFCC"/>
      
      {/* Grand entrance door (extended to bottom) */}
      <rect x="24" y="45" width="17" height="18" fill="#404040"/>
      <rect x="25" y="46" width="7" height="16" fill="#505050"/>
      <rect x="33" y="46" width="7" height="16" fill="#505050"/>
      <circle cx="31" cy="54" r="0.8" fill="#FFD700"/>
      <circle cx="34" cy="54" r="0.8" fill="#FFD700"/>
      {/* Awning */}
      <path d="M 22 45 L 43 45 L 41 43 L 24 43 Z" fill="#DC143C"/>
      
      {/* Decorative flags on corners */}
      <rect x="12" y="10" width="1" height="6" fill="#8B4513"/>
      <path d="M 13 10 L 17 11.5 L 13 13 Z" fill="#DC143C"/>
      <rect x="52" y="10" width="1" height="6" fill="#8B4513"/>
      <path d="M 52 10 L 48 11.5 L 52 13 Z" fill="#DC143C"/>
      
      {/* Stars on flags */}
      <circle cx="15" cy="11.5" r="0.5" fill="#FFD700"/>
      <circle cx="50" cy="11.5" r="0.5" fill="#FFD700"/>
    </svg>
  ),
};

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



export const BankSVG = ({ isPulsing = false, className = '' }: BankSVGProps) => (
  <svg 
    viewBox="0 0 120 80" 
    className={`transition-transform duration-150 ${isPulsing ? 'scale-105' : 'scale-100'} ${className}`}
    style={{ 
      filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))',
    }}
  >
    <defs>
      {/* Golden roof gradient */}
      <linearGradient id="bankRoofGold" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#fef08a' }} />
        <stop offset="50%" style={{ stopColor: '#fbbf24' }} />
        <stop offset="100%" style={{ stopColor: '#b45309' }} />
      </linearGradient>
      
      {/* Wall gradient */}
      <linearGradient id="bankWall" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#fafafa' }} />
        <stop offset="100%" style={{ stopColor: '#a1a1aa' }} />
      </linearGradient>
      
      {/* Pillar gradient */}
      <linearGradient id="bankPillar" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#e4e4e7' }} />
        <stop offset="30%" style={{ stopColor: '#ffffff' }} />
        <stop offset="70%" style={{ stopColor: '#f4f4f5' }} />
        <stop offset="100%" style={{ stopColor: '#a1a1aa' }} />
      </linearGradient>
      
      {/* Purple accent gradient */}
      <linearGradient id="bankPurple" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#c084fc' }} />
        <stop offset="50%" style={{ stopColor: '#a855f7' }} />
        <stop offset="100%" style={{ stopColor: '#7c3aed' }} />
      </linearGradient>
      
      {/* Top hat gradients */}
      <linearGradient id="bankHatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#7c3aed' }} />
        <stop offset="50%" style={{ stopColor: '#9333ea' }} />
        <stop offset="100%" style={{ stopColor: '#6b21a8' }} />
      </linearGradient>
      <linearGradient id="bankHatTop" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#a855f7' }} />
        <stop offset="100%" style={{ stopColor: '#7c3aed' }} />
      </linearGradient>
      <linearGradient id="bankHatBand" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#fcd34d' }} />
        <stop offset="100%" style={{ stopColor: '#d97706' }} />
      </linearGradient>
      <linearGradient id="bankBrimGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#9333ea' }} />
        <stop offset="100%" style={{ stopColor: '#581c87' }} />
      </linearGradient>
    </defs>
    
    {/* GOLDEN ROOF */}
    <polygon points="60,3 118,28 2,28" fill="url(#bankRoofGold)" stroke="#92400e" strokeWidth="1.5"/>
    
    {/* Decorative roof trim */}
    <polygon points="60,7 112,26 8,26" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
    
    {/* TOP HAT EMBLEM - Matching logo design */}
    <g transform="translate(60, 15) scale(0.002, -0.002)">
      {/* Main hat body - purple */}
      <path 
        d="M4855 8224 c-503 -32 -895 -91 -1202 -178 -466 -134 -713 -304 -713 -492 0 -28 13 -163 30 -300 128 -1075 175 -1831 168 -2669 l-3 -350 -155 -27 c-495 -86 -876 -239 -1045 -419 -26 -27 -60 -79 -77 -115 -28 -60 -30 -72 -26 -147 5 -107 44 -184 143 -282 375 -372 1380 -650 2620 -725 219 -13 871 -13 1090 0 1052 63 1945 282 2420 591 109 71 234 198 271 274 26 53 29 70 29 155 0 83 -3 101 -27 145 -123 235 -524 423 -1116 522 l-163 28 1 485 c1 865 44 1508 175 2587 30 242 30 285 6 339 -119 261 -766 486 -1606 559 -173 15 -695 27 -820 19z"
        fill="#4D2783"
        transform="translate(-5120, -5120)"
      />
      {/* Gold band */}
      <path 
        d="M3458 4434 c444 -134 878 -201 1453 -224 645 -26 1248 44 1824 210 94 27 178 52 188 56 17 6 18 -13 15 -384 l-3 -391 -34 -35 c-127 -131 -617 -255 -1231 -312 -225 -21 -849 -24 -1065 -6 -549 48 -1022 154 -1204 272 -97 63 -91 30 -91 473 0 367 1 389 18 382 9 -3 68 -22 130 -41z"
        fill="#FFBD32"
        transform="translate(-5120, -5120)"
      />
    </g>
    
    {/* Decorative corners */}
    <circle cx="20" cy="24" r="2.5" fill="url(#bankPurple)"/>
    <circle cx="100" cy="24" r="2.5" fill="url(#bankPurple)"/>
    
    {/* Main beam with dentils */}
    <rect x="2" y="28" width="116" height="8" fill="url(#bankPurple)"/>
    <rect x="2" y="28" width="116" height="2" fill="rgba(255,255,255,0.4)"/>
    
    {/* Dentil pattern */}
    <g fill="#581c87">
      <rect x="8" y="33" width="3" height="3"/>
      <rect x="16" y="33" width="3" height="3"/>
      <rect x="24" y="33" width="3" height="3"/>
      <rect x="32" y="33" width="3" height="3"/>
      <rect x="40" y="33" width="3" height="3"/>
      <rect x="48" y="33" width="3" height="3"/>
      <rect x="56" y="33" width="3" height="3"/>
      <rect x="64" y="33" width="3" height="3"/>
      <rect x="72" y="33" width="3" height="3"/>
      <rect x="80" y="33" width="3" height="3"/>
      <rect x="88" y="33" width="3" height="3"/>
      <rect x="96" y="33" width="3" height="3"/>
      <rect x="104" y="33" width="3" height="3"/>
    </g>
    
    {/* Main wall */}
    <rect x="5" y="36" width="110" height="38" fill="url(#bankWall)"/>
    
    {/* 8 Pillars */}
    {[7, 19, 31, 43, 69, 81, 93, 105].map((x, i) => (
      <g key={i}>
        <rect x={x} y={36} width={8} height={38} fill="url(#bankPillar)"/>
        <rect x={x} y={36} width={8} height={3} fill="url(#bankPurple)"/>
        <rect x={x - 1} y={71} width={10} height={3} fill="url(#bankPurple)"/>
      </g>
    ))}
    
    {/* Central door */}
    <rect x="52" y="45" width="16" height="29" fill="#3b0764" rx="1"/>
    <ellipse cx="60" cy="45" rx="8" ry="5" fill="#3b0764"/>
    <ellipse cx="60" cy="45" rx="6" ry="3" fill="none" stroke="url(#bankPurple)" strokeWidth="0.8"/>
    <rect x="54" y="47" width="5" height="25" fill="#4c1d95" rx="1"/>
    <rect x="61" y="47" width="5" height="25" fill="#4c1d95" rx="1"/>
    <circle cx="58" cy="61" r="1" fill="url(#bankHatBand)"/>
    <circle cx="62" cy="61" r="1" fill="url(#bankHatBand)"/>
    
    {/* Bottom base */}
    <rect x="0" y="74" width="120" height="6" fill="url(#bankPurple)"/>
    <rect x="0" y="74" width="120" height="1.5" fill="rgba(255,255,255,0.2)"/>
  </svg>
);

export const MONEY_SYMBOLS = {
  green: GreenBillSVG,
  gold: GoldBillSVG,
  bag: MoneyBagSVG,
  diamond: DiamondSVG,
};