'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGameState } from '@/contexts/GameStateContext';
import { ShieldIcon, ShieldCooldownIcon, HourglassIcon, TargetIcon } from './icons/UIIcons';
import { House1_3D_View } from './3d/House1_3D_View';
import { House2_3D_View } from './3d/House2_3D_View';
import { House3_3D_View } from './3d/House3_3D_View';
import { House4_3D_View } from './3d/House4_3D_View';
import { House5_3D_View } from './3d/House5_3D_View';
import { Pin3D_View } from './3d/Pin3D_View';

import { PROPERTIES } from '@/utils/constants';
import { THEME_CONSTANTS } from '@/utils/themeConstants';

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
  customPropertyCardBackground?: string | null | undefined;
  modalView?: boolean;
  compact?: boolean;
  scaleFactor?: number;
  isCorner?: boolean;
  cornerLabel?: string;
  gridColumn?: number;
  gridRow?: number;
  disableAnimations?: boolean;
}

export function PropertyCard({ 
  propertyId, 
  onSelect, 
  spectatorMode = false, 
  spectatorWallet, 
  spectatorOwnerships = [],
  customPropertyCardBackground, 
  modalView = false,
  compact = false,
  scaleFactor = 1,
  isCorner = false,
  cornerLabel = 'DEFIPOLY',
  gridColumn,
  gridRow,
  disableAnimations = false,
}: PropertyCardProps) {
  const { connected, publicKey } = useWallet();
  
  if (isCorner) {
    const logoSize = Math.max(24, Math.round(48 * scaleFactor));
    const textSize = Math.max(6, Math.round(12 * scaleFactor));
    
    return (
      <button
        className="w-full h-full relative overflow-hidden"
        style={{
          background: customPropertyCardBackground 
            ? `url(${customPropertyCardBackground}) center/cover`
            : THEME_CONSTANTS.DEFAULT_PROPERTY_CARD_BACKGROUND,
          border: '1px solid rgba(139, 92, 246, 0.5)',
          gridColumn: gridColumn,
          gridRow: gridRow,
        }}
      >
        <div className="w-full h-full flex flex-col items-center justify-center relative z-10">
          <img src="/logo.svg" alt="Logo" style={{ width: logoSize, height: logoSize }} />
          <div className="font-black tracking-wider text-white" style={{ fontSize: textSize }}>{cornerLabel}</div>
        </div>
      </button>
    );
  }
  
  // Calculate responsive sizes based on scale factor
  const nameSize = Math.max(3, Math.round((compact ? 4 : 9) * scaleFactor));
  const priceSize = Math.max(3, Math.round((compact ? 4 : 10) * scaleFactor));
  const triangleSize = Math.max(4, Math.round((compact ? 8 : 40) * scaleFactor));
  const barWidth = Math.max(1, Math.round((compact ? 2 : 8) * scaleFactor));
  const iconScale = (compact ? 0.35 : 0.4) * Math.max(0.7, scaleFactor);
  const buildingScale = (compact ? 0.3 : 0.35) * Math.max(0.7, scaleFactor);
  const cooldownIconSize = Math.max(6, Math.round((compact ? 6 : 14) * scaleFactor));
  const namePaddingX = Math.max(2, Math.round((compact ? 4 : 12) * scaleFactor));
  const namePaddingY = Math.max(1, Math.round((compact ? 2 : 12) * scaleFactor));
  const pricePaddingX = Math.max(2, Math.round((compact ? 4 : 16) * scaleFactor));
  const pricePaddingB = Math.max(1, Math.round((compact ? 2 : 6) * scaleFactor));

  const [buildingLevel, setBuildingLevel] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [hasCompleteSet, setHasCompleteSet] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const property = PROPERTIES.find(p => p.id === propertyId);
  if (!property) return null;

  // Get everything from GameStateContext
  const gameState = useGameState();
  
  const ownerships = spectatorMode ? spectatorOwnerships : (gameState.ownerships || []);
  const ownership = ownerships.find(o => o.propertyId === propertyId);

  const propertyIncome = ownership && ownership.slotsOwned > 0 
    ? Math.floor((property.price * property.yieldBps) / 10000) * ownership.slotsOwned 
    : 0;

  // Get ALL cooldown helpers from game state
  const { 
    isPropertyOnCooldown,
    isStealOnCooldown,
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

  const getStyleProps = () => {
    try {
      const hasCustomBg = customPropertyCardBackground !== null && customPropertyCardBackground !== undefined;
      
      const styles: React.CSSProperties = {
        transition: 'all 0.3s ease',
      };

      if (hasCustomBg) {
        styles.background = `url(${customPropertyCardBackground}) center/cover no-repeat`;
      } else {
        styles.background = THEME_CONSTANTS.DEFAULT_PROPERTY_CARD_BACKGROUND;
      }

      if (!hasCustomBg) {
        styles.border = `1px solid ${colorHex}80`;
      }

      return styles;
    } catch (error) {
      console.warn('PropertyCard style error:', error);
      return {
        background: THEME_CONSTANTS.DEFAULT_PROPERTY_CARD_BACKGROUND,
        border: '1px solid #6b7280',
        borderRadius: '16px',
        transition: 'all 0.3s ease',
      };
    }
  };

  return (
    <button
      data-property-id={propertyId}
      onClick={() => onSelect(propertyId)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full h-full relative overflow-hidden cursor-pointer group m-0 p-0 border-0"
      style={{
        ...getStyleProps(),
        margin: 0,
        padding: 0,
        gridColumn: gridColumn,
        gridRow: gridRow,
      }}
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


      <div className="relative z-20 flex flex-col h-full justify-start">
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

        <div 
          className="flex-shrink-0 relative z-25"
          style={{
            padding: `${namePaddingY}px ${namePaddingX}px`,
          }}
        >
        <div 
          className="font-bold leading-tight uppercase"
          style={{
            fontSize: modalView ? '11px' : `${nameSize}px`,
            color: '#ffffff',
            letterSpacing: compact ? '0px' : '0.3px',
            lineHeight: '1',
            paddingRight: `${Math.round(triangleSize * 0.3)}px`,
          }}
        >
            {property.name}
          </div>
        </div>

        <div 
          className="flex-1 flex items-start justify-center min-h-0 relative z-50"
          style={{
            padding: `0 ${Math.round(4 * scaleFactor)}px`,
            paddingTop: modalView ? '5%' : '5%',
            minHeight: modalView ? '160px' : undefined,
          }}
        >
                  

        {buildingLevel === 0 ? (
          <div className="w-full h-full flex items-start justify-center" style={{ paddingTop: '5%' }}>
            <div style={{ transform: modalView ? 'scale(1)' : `scale(${iconScale})` }}>
              <div>
                <div style={{ transform: 'translateZ(15px)', transformStyle: 'preserve-3d' }}>
                  <Pin3D_View size={modalView ? 120 : 80} color={property.color} inModal={modalView} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div 
            style={{ 
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ 
              position: 'absolute',
              width: modalView ? 160 : 60,
              height: modalView ? 160 : 60,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}>
              <div style={{ transform: 'translateZ(15px)', transformStyle: 'preserve-3d' }}>
                {buildingLevel === 1 && <House1_3D_View size={modalView ? 160 : 60} inModal={modalView} />}
                {buildingLevel === 2 && <House2_3D_View size={modalView ? 160 : 60} inModal={modalView} />}
                {buildingLevel === 3 && <House3_3D_View size={modalView ? 160 : 60} inModal={modalView} />}
                {buildingLevel === 4 && <House4_3D_View size={modalView ? 160 : 60} inModal={modalView} />}
                {buildingLevel === 5 && <House5_3D_View size={modalView ? 160 : 60} inModal={modalView} />}
              </div>
            </div>
          </div>
        )}
        </div>
        <div 
          className="flex items-center justify-between flex-shrink-0"
          style={{
            padding: `0 ${pricePaddingX}px ${pricePaddingB}px`,
            gap: `${Math.max(2, Math.round(4 * scaleFactor))}px`,
          }}
        >
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