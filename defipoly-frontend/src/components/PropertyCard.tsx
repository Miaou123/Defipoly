'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGameState } from '@/contexts/GameStateContext';
import { ShieldIcon, ShieldCooldownIcon, HourglassIcon, TargetIcon } from './icons/UIIcons';
import { LocationPin, BUILDING_SVGS } from './icons/GameAssets';
import { MoneyBillsAnimation, useIncomePulseClass } from './MoneyBillsAnimation';

import { PROPERTIES } from '@/utils/constants';
import { PropertyCardTheme } from '@/utils/themes';

// Helper function for formatting numbers without hydration issues
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

interface PropertyCardProps {
  propertyId: number;
  onSelect: (propertyId: number) => void;
  spectatorMode?: boolean;
  spectatorWallet?: string | undefined;
  spectatorOwnerships?: any[];
  theme?: PropertyCardTheme;
  customPropertyCardBackground?: string | null | undefined;
  modalView?: boolean;
  compact?: boolean;
  scaleFactor?: number;
}

export function PropertyCard({ 
  propertyId, 
  onSelect, 
  spectatorMode = false, 
  spectatorWallet, 
  spectatorOwnerships = [],
  theme, 
  customPropertyCardBackground, 
  modalView = false,
  compact = false,
  scaleFactor = 1
}: PropertyCardProps) {
  const { connected, publicKey } = useWallet();
  
  // Calculate responsive sizes based on scale factor
  const nameSize = Math.max(3, Math.round((compact ? 4 : 9) * scaleFactor));      // Changed: Math.max 8→3, base 7→9
  const priceSize = Math.max(3, Math.round((compact ? 4 : 10) * scaleFactor));    // Changed: Math.max 8→3, base 8→10
  const triangleSize = Math.max(4, Math.round((compact ? 8 : 40) * scaleFactor)); // Changed: base 32→40
  const barWidth = Math.max(1, Math.round((compact ? 2 : 8) * scaleFactor));      // Changed: Math.max 2→1, base 6→8
  const iconScale = (compact ? 0.35 : 0.4) * Math.max(0.7, scaleFactor);                         // Changed: 0.3→0.4 (bigger icons)
  const buildingScale = (compact ? 0.3 : 0.35) * Math.max(0.7, scaleFactor);
  const cooldownIconSize = Math.max(6, Math.round((compact ? 6 : 14) * scaleFactor)); // Changed: Math.max 8→6, base 12→14
  
  // Default theme if none provided - dark mode
  const cardTheme = theme || {
    id: 'dark',
    name: 'Dark Mode',
    background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.9))',
    border: 'border border-gray-600/50',
    textColor: 'text-white',
    accent: 'text-gray-300'
  };

  const [buildingLevel, setBuildingLevel] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [hasCompleteSet, setHasCompleteSet] = useState(false);
  
  const property = PROPERTIES.find(p => p.id === propertyId);
  if (!property) return null;

  // ✅ Get everything from GameStateContext
  const gameState = useGameState();
  
  const ownerships = spectatorMode ? spectatorOwnerships : gameState.ownerships;
  const ownership = ownerships.find(o => o.propertyId === propertyId);

  const propertyIncome = ownership && ownership.slotsOwned > 0 
    ? Math.floor((property.price * property.yieldBps) / 10000) * ownership.slotsOwned 
    : 0;
  const buildingPulseClass = useIncomePulseClass(propertyIncome);

  // ✅ Get ALL cooldown helpers from game state
  const { 
    isPropertyOnCooldown,      // ✅ Per-property cooldown helper
    isStealOnCooldown,         // ✅ Steal cooldown helper
  } = gameState;
  
  // For spectator mode, disable cooldowns (wallet-specific)
  const spectatorIsPropertyOnCooldown = () => false;
  const spectatorIsStealOnCooldown = () => false;
  
  const finalIsPropertyOnCooldown = spectatorMode ? spectatorIsPropertyOnCooldown : isPropertyOnCooldown;
  const finalIsStealOnCooldown = spectatorMode ? spectatorIsStealOnCooldown : isStealOnCooldown;
  
  // Check if this specific property is on cooldown
  const isThisPropertyOnCooldown = finalIsPropertyOnCooldown(propertyId);
  const isOnStealCooldown = finalIsStealOnCooldown(propertyId);

  // Determine which cooldowns are active (only show in normal mode)
  const activeCooldowns = [];
  if (!spectatorMode) {
    // Check if shield is on cooldown
    const now = Math.floor(Date.now() / 1000);
    const shieldExpiry = ownership?.shieldExpiry?.toNumber() || 0;
    const cooldownDuration = ownership?.shieldCooldownDuration?.toNumber() || (12 * 3600);
    const cooldownEndTime = shieldExpiry + cooldownDuration;
    const isShieldOnCooldown = !shieldActive && shieldExpiry > 0 && now < cooldownEndTime;
    
    if (shieldActive) {
      activeCooldowns.push({ 
        icon: <ShieldIcon size={cooldownIconSize} className="text-cyan-400" />, 
        label: 'Shield Active',
      });
    } else if (isShieldOnCooldown) {
      activeCooldowns.push({ 
        icon: <ShieldCooldownIcon size={cooldownIconSize} className="text-red-400" />, 
        label: 'Shield Cooldown',
      });
    }
    
    if (isThisPropertyOnCooldown) {
      activeCooldowns.push({ 
        icon: <HourglassIcon size={cooldownIconSize} className="text-yellow-400" />,
        label: 'Set Cooldown',
      });
    }
    if (isOnStealCooldown) {
      activeCooldowns.push({ 
        icon: <TargetIcon size={cooldownIconSize} className="text-orange-400" />,
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

    const maxPerPlayer = property.maxPerPlayer || 10;
    const progressRatio = ownership.slotsOwned / maxPerPlayer;
    const level = Math.ceil(progressRatio * 5);
    setBuildingLevel(Math.min(level, 5));

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

  const getColorHex = (colorClass: string) => {
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
    return colorMap[colorClass] || '#8b5cf6';
  };

  const colorHex = getColorHex(property.color);

  const getCardBackground = () => {
    if (spectatorMode) {
      if (customPropertyCardBackground) {
        return `url(${customPropertyCardBackground}) center/cover`;
      }
      if (cardTheme.id === 'custom') {
        return `linear-gradient(to bottom right, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.9))`;
      }
    } else {
      if (customPropertyCardBackground) {
        return `url(${customPropertyCardBackground}) center/cover`;
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

  const getStyleProps = () => {
    try {
      const isCustomBg = spectatorMode 
        ? customPropertyCardBackground !== null && customPropertyCardBackground !== undefined
        : (customPropertyCardBackground !== null && customPropertyCardBackground !== undefined);
      
      const styles: React.CSSProperties = {
        transition: 'all 0.3s ease',
      };

      if (isCustomBg) {
        const backgroundImage = customPropertyCardBackground;
        styles.background = `url(${backgroundImage}) center/cover no-repeat`;
      } else {
        styles.background = getCardBackground();
      }

      if (!isCustomBg) {
        styles.border = `1px solid ${colorHex}80`;
      }

      return styles;
    } catch (error) {
      console.warn('PropertyCard style error:', error);
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

     {hasCompleteSet && (
        <>
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
          
          <div 
            className="absolute inset-0 pointer-events-none z-14"
            style={{
              borderRadius: 'inherit',
              boxShadow: '-3px -3px 3px 0 rgba(38, 230, 247, 0.3), 3px 3px 3px 0 rgba(247, 89, 228, 0.3), 0 0 6px 2px rgba(255, 231, 89, 0.3)',
            }}
          />
        </>
      )}

      {/* Money Bills Animation for owned properties */}
      {ownership && ownership.slotsOwned > 0 && (
        <MoneyBillsAnimation 
          income={Math.floor((property.price * property.yieldBps) / 10000) * ownership.slotsOwned}
          compact={compact}
          modalView={modalView}
        />
      )}

      <div className="relative z-20 flex flex-col h-full">
        <div 
          className="absolute top-0 left-0 h-full z-30"
          style={{
            width: `${barWidth}px`,
            background: colorHex,
            boxShadow: compact ? 'none' : `0 0 10px ${colorHex}99`,
          }}
        />

        <div 
          className="absolute top-0 right-0 z-20"
          style={{
            width: `${triangleSize}px`,
            height: `${triangleSize}px`,
            background: colorHex,
            clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
          }}
        />

        <div className={`${compact ? 'px-1 py-0.5' : 'px-3 py-3'} flex-shrink-0 relative z-25`}>
          <div 
            className={`font-bold leading-tight uppercase ${compact ? 'pr-1' : 'pr-10'}`}
            style={{
              fontSize: modalView ? '11px' : `${nameSize}px`,
              color: getTextColor(),
              letterSpacing: compact ? '0px' : '0.3px',
              lineHeight: '1',
            }}
          >
            {property.name}
          </div>
        </div>

        <div className={`flex-1 flex items-center justify-center ${compact ? 'px-0' : 'px-1'} min-h-0`}>
          {buildingLevel === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <div style={{ transform: modalView ? 'scale(0.5)' : `scale(${iconScale})` }}>
                <LocationPin color={property.color} size="small" />
              </div>
            </div>
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ transform: modalView ? 'scale(0.4)' : `scale(${buildingScale})` }}
            >
              <div className={`w-full h-full flex items-center justify-center ${buildingPulseClass}`}>
                {BUILDING_SVGS[buildingLevel]}
              </div>
            </div>
          )}
        </div>
        <div className={`${compact ? 'px-1 pb-0.5' : 'px-4 pb-1.5'} flex items-center justify-between gap-1 flex-shrink-0`}>
          <div 
            className="font-semibold text-yellow-300"
            style={{
              fontSize: modalView ? '12px' : `${priceSize}px`,
            }}
          >
            ${formatNumber(property.price)}
          </div>
          
          {activeCooldowns.length > 0 && (
            <div className={`flex ${compact ? 'gap-0.5' : 'gap-1'}`}>
              {activeCooldowns.map((cooldown, index) => (
                <div key={index} className="relative group">
                  {cooldown.icon}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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