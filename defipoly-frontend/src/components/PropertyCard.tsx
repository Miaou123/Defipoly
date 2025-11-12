'use client';

import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { usePropertyRefresh } from '@/contexts/PropertyRefreshContext';
import { useCooldown } from '@/hooks/useCooldown';
import { useStealCooldownFromContext } from '@/contexts/StealCooldownContext';
import { ShieldIcon, CoinsIcon, FlameIcon, PropertyMarkerIcon } from './icons/UIIcons';
import { LocationPin, BUILDING_SVGS } from './icons/GameAssets';
import { fetchOwnershipData, fetchPropertyData } from '@/utils/program';

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
}

export function PropertyCard({ propertyId, onSelect, spectatorMode = false, spectatorWallet, theme }: PropertyCardProps) {
  const { connected, publicKey } = useWallet();
  const { getOwnershipData, getPropertyData, program } = useDefipoly();
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

  // Get cooldown info
  const { cooldownRemaining, isOnCooldown, lastPurchasedPropertyId } = useCooldown(property.setId);
  const { isOnStealCooldown, stealCooldownRemaining } = useStealCooldownFromContext(propertyId);
  
  // Format cooldown time
  const formatCooldown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const isThisPropertyBlocked = isOnCooldown && lastPurchasedPropertyId !== propertyId;

  // Determine which cooldowns are active (only show in normal mode, not spectator mode)
  const activeCooldowns = [];
  if (!spectatorMode) {
    if (shieldActive) {
      activeCooldowns.push({ icon: <ShieldIcon size={12} className="text-cyan-400" />, label: 'Shield' });
    }
    if (isThisPropertyBlocked) {
      activeCooldowns.push({ icon: <CoinsIcon size={12} className="text-yellow-400" /> });
    }
    if (isOnStealCooldown) {
      activeCooldowns.push({ icon: <FlameIcon size={12} className="text-orange-400" /> });
    }
  }

  // Fetch ownership data
  useEffect(() => {
    // In spectator mode, we need program but not necessarily connected wallet
    if (spectatorMode && (!program || !spectatorWallet)) {
      setBuildingLevel(0);
      setShieldActive(false);
      setHasCompleteSet(false);
      return;
    }
    
    // In normal mode, we need connected wallet
    if (!spectatorMode && (!connected || !publicKey || !program)) {
      setBuildingLevel(0);
      setShieldActive(false);
      setHasCompleteSet(false);
      return;
    }

    const fetchOwnership = async () => {
      try {
        // Determine which wallet to use for ownership data
        let ownershipData;
        if (spectatorMode && spectatorWallet && program) {
          // In spectator mode, fetch ownership for the spectator wallet
          const spectatorPublicKey = new PublicKey(spectatorWallet);
          ownershipData = await fetchOwnershipData(program, spectatorPublicKey, propertyId);
        } else {
          // In normal mode, use the connected wallet
          ownershipData = await getOwnershipData(propertyId);
        }
        
        const propertyData = await getPropertyData(propertyId);
        
        if (ownershipData?.slotsOwned && ownershipData.slotsOwned > 0 && propertyData) {
          const slotsOwned = ownershipData.slotsOwned;
          const maxPerPlayer = propertyData.maxPerPlayer;
          
          const progressRatio = slotsOwned / maxPerPlayer;
          const level = Math.ceil(progressRatio * 5);
          setBuildingLevel(level);
          
          const now = Date.now() / 1000;
          const isShielded = ownershipData.slotsShielded > 0 && ownershipData.shieldExpiry.toNumber() > now;
          setShieldActive(isShielded);
          
          const setId = property.setId;
          const propertiesInSet = PROPERTIES.filter(p => p.setId === setId);
          const requiredProps = setId === 0 || setId === 7 ? 2 : 3;
          
          let ownedInSet = 0;
          for (const prop of propertiesInSet) {
            try {
              let ownership;
              if (spectatorMode && spectatorWallet && program) {
                const spectatorPublicKey = new PublicKey(spectatorWallet);
                ownership = await fetchOwnershipData(program, spectatorPublicKey, prop.id);
              } else {
                ownership = await getOwnershipData(prop.id);
              }
              if (ownership && ownership.slotsOwned > 0) {
                ownedInSet++;
              }
            } catch {
              // Property not owned
            }
          }
          
          setHasCompleteSet(ownedInSet >= requiredProps);
          
        } else {
          setBuildingLevel(0);
          setShieldActive(false);
          setHasCompleteSet(false);
        }
      } catch (error) {
        console.warn(`Failed to fetch property ${propertyId}:`, error);
        setBuildingLevel(0);
        setShieldActive(false);
        setHasCompleteSet(false);
      }
    };

    fetchOwnership();
  }, [connected, publicKey, propertyId, program, getOwnershipData, getPropertyData, refreshKey, property.name, property.setId, spectatorMode, spectatorWallet]);

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

  // Get darker version of the color for the bar
  const getDarkerColorHex = (colorClass: string) => {
    const colorMap: { [key: string]: string } = {
      'bg-amber-900': '#451a03',    // Much darker brown
      'bg-sky-300': '#0369a1',      // Much darker light blue
      'bg-pink-400': '#be185d',     // Much darker pink
      'bg-orange-500': '#c2410c',   // Much darker orange
      'bg-red-600': '#991b1b',      // Much darker red
      'bg-yellow-400': '#a16207',   // Much darker yellow
      'bg-green-600': '#15803d',    // Much darker green
      'bg-blue-900': '#0c1844',     // Much darker dark blue
    };
    return colorMap[colorClass] || '#6d28d9';
  };

  const colorHex = getColorHex(property.color);
  const darkerColorHex = getDarkerColorHex(property.color);

  // Get background based on theme with fallback
  const getCardBackground = () => {
    try {
      // Check if there's a custom property card background
      if (themeContext.propertyCardTheme === 'custom' && themeContext.customPropertyCardBackground) {
        return `url(${themeContext.customPropertyCardBackground})`;
      }
      
      // Use the background from the theme object, which now contains CSS gradient strings
      return cardTheme.background || 'linear-gradient(135deg, rgba(88, 28, 135, 1), rgba(109, 40, 217, 1))';
    } catch (error) {
      // Fallback to default if there's any error - fully opaque
      return 'linear-gradient(135deg, rgba(88, 28, 135, 1), rgba(109, 40, 217, 1))';
    }
  };

  // Get additional style properties with error handling
  const getStyleProps = () => {
    try {
      const isCustomBg = themeContext.propertyCardTheme === 'custom' && themeContext.customPropertyCardBackground;
      
      const styles: React.CSSProperties = {
        background: getCardBackground(),
        border: isCustomBg ? 'none' : `1px solid ${colorHex || '#8b5cf6'}`,
        borderRadius: '0px',
        transition: 'all 0.3s ease',
      };

      // Add conditional styles safely
      if (isCustomBg) {
        styles.backgroundSize = 'cover';
        styles.backgroundPosition = 'center';
        styles.backgroundRepeat = 'no-repeat';
      }

      // Add theme-specific shadows only for non-custom backgrounds
      if (!isCustomBg) {
        if (cardTheme.id === 'neon' && colorHex) {
          styles.boxShadow = `0 0 15px ${colorHex}40`;
        } else if (cardTheme.id === 'gold') {
          styles.boxShadow = '0 0 15px rgba(251, 191, 36, 0.4)';
        } else if (cardTheme.id === 'minimal') {
          styles.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        }
      }

      return styles;
    } catch (error) {
      console.warn('PropertyCard style error:', error);
      // Return minimal safe styles - dark theme
      return {
        background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.9))',
        border: '1px solid #6b7280',
        borderRadius: '0px',
        transition: 'all 0.3s ease',
      };
    }
  };

  const getTextColor = () => {
    return cardTheme.id === 'minimal' ? '#1f2937' : '#e9d5ff';
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

      {/* Card content */}
      <div className="relative z-20 flex flex-col h-full">
        {/* Darker color bar at top with diagonal clip */}
        <div 
          className="h-4 w-full flex-shrink-0"
          style={{
            background: darkerColorHex,
          }}
        />

        {/* Property Name */}
        <div 
          className="px-1 py-1.5 flex-shrink-0"
          style={{
            background: 'rgba(12, 5, 25, 0.6)',
            borderBottom: `1px solid ${colorHex}40`,
          }}
        >
          <div className="text-center">
            <div 
              className="text-[7px] font-bold leading-tight uppercase truncate"
              style={{
                color: getTextColor(),
                letterSpacing: '0.5px',
              }}
            >
              {property.name}
            </div>
          </div>
        </div>

        {/* Building display area */}
        <div 
          className="flex-1 flex items-center justify-center px-1 py-2 min-h-0"
          style={{
            background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.4), rgba(109, 40, 217, 0.2))',
          }}
        >
          {buildingLevel === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              {/* Scale down to 30% on mobile, 35% on larger screens */}
              <div className="scale-[0.3] sm:scale-[0.35]">
                <LocationPin color={property.color} size="small" />
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center scale-[0.25]">
              {BUILDING_SVGS[buildingLevel]}
            </div>
          )}
        </div>

        {/* Combined Cooldown/Status Indicator - Moved above price */}
        {activeCooldowns.length > 0 && (
          <div 
            className="px-1 py-0.5 flex-shrink-0"
            style={{
              background: 'rgba(12, 5, 25, 0.9)',
              borderTop: `1px solid ${colorHex}30`,
            }}
          >
            <div className="flex items-center justify-center gap-1">
              {activeCooldowns.map((cooldown, index) => (
                <span key={index} className="text-[10px]">
                  {cooldown.icon}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Price section at bottom */}
        <div 
          className="px-1 py-0.5 flex-shrink-0"
          style={{
            background: 'rgba(12, 5, 25, 0.8)',
            borderTop: `1px solid ${colorHex}30`,
          }}
        >
          <div className="text-center">
            <div className="text-[7px] font-semibold text-purple-300">
              ${formatNumber(property.price)}
            </div>
          </div>
        </div>
      </div>

      {/* Hover effect enhancement */}
      <style jsx>{`
        button:hover {
          transform:  scale(1.10);
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

        .building-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(0.25);
          }
          50% {
            transform: translateY(-10px) scale(0.25);
          }
        }
      `}</style>
    </button>
  );
}