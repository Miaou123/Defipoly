'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePropertyRefresh } from '@/contexts/PropertyRefreshContext';
import { useGameState } from '@/contexts/GameStateContext';
import { useStealCooldownFromContext } from '@/contexts/StealCooldownContext';
import { ShieldIcon, HourglassIcon, TargetIcon } from './icons/UIIcons';
import { LocationPin, BUILDING_SVGS } from './icons/GameAssets';

import { PROPERTIES } from '@/utils/constants';
import { PropertyCardTheme } from '@/utils/themes';
import { useTheme } from '@/contexts/ThemeContext';


// Helper function for formatting numbers without hydration issues
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};


interface PropertyCardProps {
  propertyId: number;
  onSelect: (propertyId: number) => void;
  spectatorMode?: boolean;
  spectatorWallet?: string;
  theme?: PropertyCardTheme;
  customPropertyCardBackground?: string | null;
  modalView?: boolean;
}

export function PropertyCard({ propertyId, onSelect, spectatorMode = false, spectatorWallet, theme, customPropertyCardBackground, modalView = false }: PropertyCardProps) {
  const { connected, publicKey } = useWallet();
  const { refreshKey } = usePropertyRefresh();
  const themeContext = useTheme();
  
  // Default theme if none provided - dark mode
  const cardTheme = theme || {
    id: 'dark',
    name: 'Dark Mode',
    background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.9))',
    border: 'border border-gray-600/50',
    textColor: 'text-white',
    accent: 'text-gray-300'
  };

  // Ensure theme context is available
  if (!themeContext) {
    return (
      <button
        onClick={() => onSelect(propertyId)}
        className="w-full h-full relative overflow-hidden cursor-pointer bg-gray-700/60 border border-gray-500"
      >
        Loading...
      </button>
    );
  }
  
  const [buildingLevel, setBuildingLevel] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [hasCompleteSet, setHasCompleteSet] = useState(false);
  
  const property = PROPERTIES.find(p => p.id === propertyId);
  if (!property) return null;

  // Get game state from context (main mode) or local state (spectator mode)
  const gameState = useGameState();
  const [spectatorOwnerships, setSpectatorOwnerships] = useState<any[]>([]);
  
  const ownerships = spectatorMode ? spectatorOwnerships : gameState.ownerships;
  const ownership = ownerships.find(o => o.propertyId === propertyId);

  // Get cooldown helpers from game state (only works in main mode)
  const { 
    isSetOnCooldown, 
    getSetCooldownRemaining,
    getSetCooldown 
  } = gameState;
  
  // For spectator mode, we disable cooldowns since they're wallet-specific
  const spectatorIsSetOnCooldown = () => false;
  const spectatorGetSetCooldownRemaining = () => 0;
  const spectatorGetSetCooldown = () => null;
  
  const finalIsSetOnCooldown = spectatorMode ? spectatorIsSetOnCooldown : isSetOnCooldown;
  const finalGetSetCooldownRemaining = spectatorMode ? spectatorGetSetCooldownRemaining : getSetCooldownRemaining;
  const finalGetSetCooldown = spectatorMode ? spectatorGetSetCooldown : getSetCooldown;
  
  const { isOnStealCooldown, stealCooldownRemaining } = useStealCooldownFromContext(propertyId);
  
  // Get cooldown info for this property's set
  const setId = property.setId;
  const isOnCooldown = finalIsSetOnCooldown(setId);
  const cooldownRemaining = finalGetSetCooldownRemaining(setId);
  const cooldownData = finalGetSetCooldown(setId);
  const lastPurchasedPropertyId = cooldownData?.lastPurchasedPropertyId ?? null;
  
  // Fetch spectator ownership data
  useEffect(() => {
    if (!spectatorMode || !spectatorWallet) return;
    
    const fetchSpectatorData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101'}/api/game-state/${spectatorWallet}`);
        if (response.ok) {
          const data = await response.json();
          // Convert API format to frontend format
          const convertedOwnerships = data.data.ownerships.map((o: any) => ({
            player: spectatorWallet, // We don't need PublicKey for spectator mode
            propertyId: o.propertyId,
            slotsOwned: o.slotsOwned,
            slotsShielded: o.slotsShielded,
            purchaseTimestamp: { toNumber: () => o.purchaseTimestamp },
            shieldExpiry: { toNumber: () => o.shieldExpiry },
            shieldCooldownDuration: { toNumber: () => o.shieldCooldownDuration },
            stealProtectionExpiry: { toNumber: () => o.stealProtectionExpiry },
            bump: o.bump,
          }));
          setSpectatorOwnerships(convertedOwnerships);
          console.log('🔍 [PropertyCard] Fetched spectator ownerships for', spectatorWallet, ':', convertedOwnerships.length);
        }
      } catch (error) {
        console.error('Error fetching spectator ownership data:', error);
      }
    };
    
    fetchSpectatorData();
  }, [spectatorMode, spectatorWallet]);
  

  // 🔍 DEBUG LOGGING
console.log(`PropertyCard ${propertyId} (${property.name}) debug:`, {
  setId,
  spectatorMode,
  isOnCooldown,
  cooldownRemaining,
  lastPurchasedPropertyId,
  isThisPropertyBlocked: isOnCooldown && lastPurchasedPropertyId !== propertyId,
  isOnStealCooldown,
  stealCooldownRemaining,
  shieldActive,
});

  const isThisPropertyBlocked = isOnCooldown && lastPurchasedPropertyId !== propertyId;

  // Determine which cooldowns are active (only show in normal mode, not spectator mode)
  const activeCooldowns = [];
  if (!spectatorMode) {
    if (shieldActive) {
      activeCooldowns.push({ 
        icon: <ShieldIcon size={12} className="text-cyan-400" />, 
        label: 'Shield Active',
      });
    }
    if (isThisPropertyBlocked) {
      activeCooldowns.push({ 
        icon: <HourglassIcon size={12} className="text-yellow-400" />,
        label: 'Set Cooldown',
      });
    }
    if (isOnStealCooldown) {
      activeCooldowns.push({ 
        icon: <TargetIcon size={12} className="text-orange-400" />,
        label: 'Steal Cooldown',
      });
    }
  }

  // Calculate building level
  useEffect(() => {
    if (!ownership || ownership.slotsOwned === 0) {
      setBuildingLevel(0);
      setShieldActive(false);
      return;
    }

    // Calculate building level based on slots owned
    const maxPerPlayer = property.maxPerPlayer || 10;
    const progressRatio = ownership.slotsOwned / maxPerPlayer;
    const level = Math.ceil(progressRatio * 5);
    setBuildingLevel(Math.min(level, 5));

    // Check if shield is active
    const now = Math.floor(Date.now() / 1000);
    const isShielded = ownership.slotsShielded > 0 && ownership.shieldExpiry.toNumber() > now;
    setShieldActive(isShielded);

  }, [ownership, property.maxPerPlayer, propertyId]);

  // Check for complete set
  useEffect(() => {
    if (!ownership || ownership.slotsOwned === 0) {
      setHasCompleteSet(false);
      return;
    }

    const propertiesInSet = PROPERTIES.filter(p => p.setId === property.setId);
    const requiredProps = property.setId === 0 || property.setId === 7 ? 2 : 3;

    const ownedInSet = ownerships.filter(o => 
      propertiesInSet.some(p => p.id === o.propertyId) && o.slotsOwned > 0
    ).length;

    setHasCompleteSet(ownedInSet >= requiredProps);
  }, [ownerships, property.setId, ownership, propertyId]);

  // Extract color from Tailwind classes
  const getColorHex = (colorClass: string) => {
    const colorMap: { [key: string]: string } = {
      'bg-amber-900': '#78350f',    // Brown properties
      'bg-sky-300': '#7dd3fc',      // Light blue properties
      'bg-pink-400': '#f472b6',     // Pink properties
      'bg-orange-500': '#f97316',   // Orange properties
      'bg-red-600': '#dc2626',      // Red properties
      'bg-yellow-400': '#facc15',   // Yellow properties
      'bg-green-600': '#16a34a',    // Green properties
      'bg-blue-900': '#1e3a8a',     // Dark blue properties
    };
    return colorMap[colorClass] || '#8b5cf6';
  };

  const colorHex = getColorHex(property.color);

  // Get background based on theme with fallback
  const getCardBackground = () => {
    // In spectator mode, ONLY use the props provided, never fall back to theme context
    if (spectatorMode) {
      // If custom background is explicitly provided, use it
      if (customPropertyCardBackground) {
        return `url(${customPropertyCardBackground}) center/cover`;
      }
      // Otherwise use the theme's default background, NOT the context's custom background
      if (cardTheme.id === 'custom') {
        // For custom theme without a custom background, use dark theme as default
        return `linear-gradient(to bottom right, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.9))`;
      }
    } else {
      // In normal mode, check for custom background from props first, then from context
      const customBackground = customPropertyCardBackground || (cardTheme.id === 'custom' && themeContext.customPropertyCardBackground);
      if (customBackground) {
        return `url(${customBackground}) center/cover`;
      }
    }
    
    if (cardTheme.id === 'default') {
      return `linear-gradient(135deg, rgba(88, 28, 135, 0.8), rgba(109, 40, 217, 0.6))`;
    } else if (cardTheme.id === 'neon') {
      return `linear-gradient(135deg, rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.7))`;
    } else if (cardTheme.id === 'gold') {
      return `linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.7))`;
    } else if (cardTheme.id === 'minimal') {
      return `rgba(255, 255, 255, 0.95)`;
    }
    return `linear-gradient(to bottom right, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.9))`;
  };

  // Get additional style properties with error handling
  const getStyleProps = () => {
    try {
      // In spectator mode, only check props, never theme context
      const isCustomBg = spectatorMode 
        ? customPropertyCardBackground !== null && customPropertyCardBackground !== undefined
        : (customPropertyCardBackground || (themeContext.propertyCardTheme === 'custom' && themeContext.customPropertyCardBackground));
      
      const styles: React.CSSProperties = {
        transition: 'all 0.3s ease',
      };

      // Use either background shorthand OR individual properties, never mix
      if (isCustomBg) {
        // In spectator mode, only use the provided custom background
        const backgroundImage = spectatorMode 
          ? customPropertyCardBackground 
          : (customPropertyCardBackground || themeContext.customPropertyCardBackground);
        styles.background = `url(${backgroundImage}) center/cover no-repeat`;
      } else {
        styles.background = getCardBackground();
      }

      // Add border
      if (!isCustomBg) {
        styles.border = `1px solid ${colorHex}80`;
      }

      return styles;
    } catch (error) {
      console.warn('PropertyCard style error:', error);
      // Return minimal safe styles - dark theme
      return {
        background: 'linear-gradient(to bottom right, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.9))',
        border: '1px solid #6b7280',
        borderRadius: '16px',
        transition: 'all 0.3s ease',
      };
    }
  };

  const getTextColor = () => {
    return cardTheme.id === 'minimal' ? '#1f2937' : '#ffffff';
  };

  return (
    <button
      onClick={() => onSelect(propertyId)}
      className="w-full h-full relative overflow-hidden cursor-pointer group"
      style={getStyleProps()}
    >
      {/* Animated shine effect */}
      <div 
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 opacity-0 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
          transform: 'translateX(-100%) translateY(-100%) rotate(45deg)',
          animation: 'shine-sweep 3s infinite',
          width: '200%',
          height: '200%',
          top: '-50%',
          left: '-50%',
        }}
      />

      {/* Holographic effect for completed sets */}
     {/* Enhanced holographic effects for completed sets - Inspired by trading card holo effect */}
     {hasCompleteSet && (
        <>
          {/* Animated holographic gradient with color-dodge blend */}
          <div 
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-15"
            style={{
              backgroundImage: 'linear-gradient(115deg, transparent 0%, rgb(0, 231, 255) 30%, rgb(255, 0, 231) 70%, transparent 100%)',
              backgroundPosition: '0% 0%',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '300% 300%',
              mixBlendMode: 'color-dodge',
              opacity: 0.2,
              animation: 'holoGradient 12s ease infinite',
            }}
          />
          
          {/* Sparkles overlay with color-dodge blend */}
          <div 
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-16"
            style={{
              backgroundImage: 'url("https://s3-us-west-2.amazonaws.com/s.cdpn.io/13471/sparkles.gif")',
              backgroundPosition: 'center',
              backgroundSize: '180%',
              mixBlendMode: 'color-dodge',
              opacity: 1,
              animation: 'holoSparkle 12s ease infinite',
            }}
          />
          
          {/* Enhanced multi-color box shadow for depth */}
          <div 
            className="absolute inset-0 pointer-events-none z-14"
            style={{
              borderRadius: 'inherit',
              boxShadow: '-3px -3px 3px 0 rgba(38, 230, 247, 0.3), 3px 3px 3px 0 rgba(247, 89, 228, 0.3), 0 0 6px 2px rgba(255, 231, 89, 0.3)',
            }}
          />
        </>
      )}

      {/* Card content - Design 2: Corner Badge Style */}
      <div className="relative z-20 flex flex-col h-full">
        {/* Color strip on left side */}
        <div 
          className="absolute top-0 left-0 w-1.5 h-full z-30"
          style={{
            background: colorHex,
            boxShadow: `0 0 10px ${colorHex}99`,
          }}
        />

        {/* Corner badge on top right */}
        <div 
          className="absolute top-0 right-0 w-8 h-8 sm:w-10 sm:h-10 z-20"
          style={{
            background: colorHex,
            clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
          }}
        />

        {/* Property Name */}
        <div 
          className="px-3 py-3 flex-shrink-0 relative z-25"
        >
        <div 
          className={`${modalView ? 'text-[11px]' : 'text-[7px] sm:text-[8px]'} font-bold leading-tight uppercase pr-10`}
          style={{
            color: getTextColor(),
            letterSpacing: '0.3px',
            lineHeight: '1.2',
          }}
        >
            {property.name}
          </div>
        </div>

        {/* Building display area */}
        <div 
          className="flex-1 flex items-center justify-center px-1 min-h-0"
        >
          {buildingLevel === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className={modalView ? 'scale-[0.5]' : 'scale-[0.3] sm:scale-[0.35]'}>
                <LocationPin color={property.color} size="small" />
              </div>
            </div>
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${modalView ? 'scale-[0.4]' : 'scale-[0.25]'}`}>
              {BUILDING_SVGS[buildingLevel]}
            </div>
          )}
        </div>

        {/* Price and Cooldowns side by side at bottom */}
        <div className="px-4 pb-1.5 flex items-center justify-between gap-2 flex-shrink-0">
          {/* Price on left */}
          <div className={`${modalView ? 'text-[12px]' : 'text-[8px]'} font-semibold text-yellow-300`}>
            ${formatNumber(property.price)}
          </div>
          
          {/* Cooldown badges on right */}
          {activeCooldowns.length > 0 && (
            <div className="flex gap-1">
              {activeCooldowns.map((cooldown, index) => (
                <div 
                  key={index} 
                  className="relative group"
                >
                    {cooldown.icon}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover effect enhancement */}
      <style jsx>{`
        button:hover {
          transform: scale(1.10);
          box-shadow: 
            0 0 50px ${colorHex}cc,
            0 0 100px ${colorHex}80,
            inset 0 0 40px ${colorHex}33 !important;
          z-index: 50 !important;
        }

        @keyframes shine-sweep {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }

        @keyframes holographic-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        /* Holographic card animations inspired by trading cards */
        @keyframes holoSparkle {
          0%, 5% {
            opacity: 0.1;
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0.1;
          }
        }

        @keyframes holoGradient {
          0%, 100% {
            opacity: 0;
            background-position: 0% 0%;
          }
          8% {
            opacity: 0;
          }
          10% {
            background-position: 0% 0%;
          }
          19% {
            background-position: 100% 100%;
            opacity: 0.5;
          }
          35% {
            background-position: 100% 100%;
          }
          55% {
            background-position: 0% 0%;
            opacity: 0.3;
          }
          75% {
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
}