// src/components/icons/GameIcons.tsx
// All Defipoly icons in one place - simple and organized!

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// ============================================
// ICON COMPONENTS
// ============================================

export const DiceIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" opacity="0.2"/>
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
    <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
    <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
  </svg>
);

export const PropertyMarkerIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 2L4 7v10c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V7l-8-5z" 
      fill="currentColor"
      opacity="0.2"
    />
    <path 
      d="M12 2L4 7v10c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V7l-8-5z" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path 
      d="M12 8v4M12 16h.01" 
      stroke="currentColor" 
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z" 
      fill="currentColor"
      opacity="0.2"
    />
    <path 
      d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path 
      d="M9 12l2 2 4-4" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CoinsIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="9" cy="9" r="7" fill="currentColor" opacity="0.2"/>
    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2"/>
    <path 
      d="M9 6v6M7 8h4M15 15l6 6M15 21l6-6" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const FlameIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 3c1.8 3.5 2.8 5.9 2.8 8.2 0 3.5-2.5 6.3-5.6 6.3S3.6 14.7 3.6 11.2c0-1.4.4-2.8 1.1-4.1C5.5 5.6 6.6 4.2 8 3c0 0-.7 2.3-.7 3.5 0 1.9 1.5 3.5 3.4 3.5s3.4-1.6 3.4-3.5c0-1.2-.7-3.5-.7-3.5 1.4 1.2 2.5 2.6 3.3 4.1.7 1.3 1.1 2.7 1.1 4.1 0 3.5-2.5 6.3-5.6 6.3" 
      fill="currentColor"
      opacity="0.2"
    />
    <path 
      d="M12 3c1.8 3.5 2.8 5.9 2.8 8.2 0 3.5-2.5 6.3-5.6 6.3S3.6 14.7 3.6 11.2c0-1.4.4-2.8 1.1-4.1C5.5 5.6 6.6 4.2 8 3" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BuildingIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M3 10l9-7 9 7v11H3V10z" 
      fill="currentColor"
      opacity="0.2"
    />
    <path 
      d="M3 10l9-7 9 7v11H3V10z" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path 
      d="M9 21V14h6v7" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <rect x="7" y="6" width="2" height="2" fill="currentColor"/>
    <rect x="15" y="6" width="2" height="2" fill="currentColor"/>
  </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  </svg>
);

export const XCircleIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path 
      d="M8 8l8 8M16 8l-8 8" 
      stroke="currentColor" 
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" 
      fill="currentColor"
    />
    <path 
      d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z" 
      fill="currentColor"
    />
    <path 
      d="M6 16l.5 1.5L8 18l-1.5.5L6 20l-.5-1.5L4 18l1.5-.5L6 16z" 
      fill="currentColor"
    />
  </svg>
);

export const UpArrowIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 4L6 10h4v10h4V10h4l-6-6z" 
      fill="currentColor"
    />
    <path 
      d="M12 4L6 10h4v10h4V10h4l-6-6z" 
      stroke="currentColor" 
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const WalletIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="3" y="6" width="18" height="14" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
    <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
  </svg>
);

// Trophy icon for leaderboard
export const TrophyIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M18 3v6a6 6 0 0 1-12 0V3" 
      fill="currentColor"
      opacity="0.2"
    />
    <path 
      d="M18 3v6a6 6 0 0 1-12 0V3h12z" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path 
      d="M7 16h10M9 21h6M12 16v5" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Chart/Stats icon for analytics
export const ChartIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" opacity="0.1"/>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path 
      d="M8 14v3M12 11v6M16 8v9" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Timer/Clock icon for time-related info
export const TimerIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="13" r="9" fill="currentColor" opacity="0.2"/>
    <circle cx="12" cy="13" r="9" stroke="currentColor" strokeWidth="2"/>
    <path 
      d="M12 7v6l4 2" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M9 2h6" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Warning icon for alerts
export const WarningIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" 
      fill="currentColor"
      opacity="0.2"
    />
    <path 
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M12 9v4M12 17h.01" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Check/Success icon for confirmations
export const CheckIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path 
      d="M8 12l3 3 5-6" 
      stroke="currentColor" 
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Lock icon for locked/protected states
export const LockIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path 
      d="M7 11V7a5 5 0 0 1 10 0v4" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
  </svg>
);

// Lightning Bolt icon variant (for boosts/energy)
export const LightningIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
      fill="currentColor"
      opacity="0.2"
    />
    <path 
      d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

// Info icon (bonus - useful for tooltips)
export const InfoIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path 
      d="M12 16v-4M12 8h.01" 
      stroke="currentColor" 
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

// Gift icon (bonus - for rewards)
export const GiftIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="3" y="8" width="18" height="4" rx="1" fill="currentColor" opacity="0.2"/>
    <rect x="3" y="8" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="2"/>
    <path 
      d="M12 8v13M5 12v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ============================================
// ACTION ICON MAPPING (for live feed)
// ============================================

export const ACTION_ICONS: Record<string, React.ReactNode> = {
  'buy': <BuildingIcon className="text-purple-400" size={16} />,
  'steal_success': <TargetIcon className="text-red-400" size={16} />,
  'steal_failed': <XCircleIcon className="text-gray-400" size={16} />,
  'shield': <ShieldIcon className="text-cyan-400" size={16} />,
  'claim': <SparklesIcon className="text-yellow-400" size={16} />,
};

export const getActionIcon = (actionType: string): React.ReactNode => {
  return ACTION_ICONS[actionType] || <span className="text-gray-400">•</span>;
};

// Sword/Combat icon for battle-related features
export const SwordIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M14.5 9.5L9 15L7 13l5.5-5.5m6-4.5l-8.5 8.5m7 0l2 2m0 0l3 3-1 1-3-3m-2-2l-1.5 1.5M3 20l5-5" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M19 4l1 1-5 5-1-1z" fill="currentColor" opacity="0.2"/>
  </svg>
);

// Collection icon for sets/collections
export const CollectionIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" opacity="0.1"/>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="7" y="7" width="4" height="4" rx="1" fill="currentColor"/>
    <rect x="13" y="7" width="4" height="4" rx="1" fill="currentColor"/>
    <rect x="7" y="13" width="4" height="4" rx="1" fill="currentColor"/>
    <rect x="13" y="13" width="4" height="4" rx="1" fill="currentColor"/>
  </svg>
);

// Hexagon Badge with House for leaderboard rankings
interface HexagonBadgeProps {
  rank: 1 | 2 | 3;
  size?: number;
  className?: string;
}

export const HexagonBadge: React.FC<HexagonBadgeProps> = ({ rank, size = 32, className = '' }) => {
  const colors = {
    1: { fill: '#FFD700', stroke: '#B8860B', inner: '#FFEC8B' },
    2: { fill: '#C0C0C0', stroke: '#808080', inner: '#E8E8E8' },
    3: { fill: '#CD7F32', stroke: '#8B4513', inner: '#DEB887' }
  };
  const color = colors[rank];
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id={`hex-gradient-${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color.inner} />
          <stop offset="100%" stopColor={color.fill} />
        </linearGradient>
      </defs>
      <path d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z" 
            fill={`url(#hex-gradient-${rank})`} 
            stroke={color.stroke} 
            strokeWidth="2" />
      <path d="M16 6 L24 11 L24 21 L16 26 L8 21 L8 11 Z" 
            fill="rgba(255,255,255,0.2)" 
            stroke={color.stroke} 
            strokeWidth="1" 
            opacity="0.6" />
      
      {/* House Icon */}
      <path d="M16 10 L11 14 L11 21 L21 21 L21 14 Z" 
            fill={color.stroke} 
            opacity="0.8" />
      <path d="M16 10 L11 14 L11 21 L21 21 L21 14 Z" 
            stroke="#ffffff" 
            strokeWidth="1" 
            fill="none" />
      <rect x="14" y="17" width="4" height="4" fill="#ffffff" opacity="0.6" />
      <path d="M16 10 L21 14 M16 10 L11 14" 
            stroke="#ffffff" 
            strokeWidth="1.5" 
            strokeLinecap="round" />
    </svg>
  );
};

// ============================================
// DEFAULT EXPORT (optional, for convenience)
// ============================================

export default {
  DiceIcon,
  PropertyMarkerIcon,
  ShieldIcon,
  CoinsIcon,
  FlameIcon,
  BuildingIcon,
  TargetIcon,
  XCircleIcon,
  SparklesIcon,
  UpArrowIcon,
  WalletIcon,
  // NEW ICONS:
  TrophyIcon,
  ChartIcon,
  TimerIcon,
  WarningIcon,
  CheckIcon,
  LockIcon,
  LightningIcon,
  InfoIcon,
  GiftIcon,
  SwordIcon,
  CollectionIcon,
  HexagonBadge,
  ACTION_ICONS,
  getActionIcon,
};