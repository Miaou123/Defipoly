'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { usePropertyRefresh } from '@/components/PropertyRefreshContext';
import { useCooldown } from '@/hooks/useCooldown';
import { PROPERTIES } from '@/utils/constants';

// Building SVGs for levels 0-5
const BUILDING_SVGS: { [key: number]: React.ReactNode } = {
  0: <></>,
  1: (
    <svg width="40" height="40" viewBox="0 0 40 40" className="w-full h-auto">
      <ellipse cx="20" cy="36" rx="12" ry="3" fill="black" opacity="0.2"/>
      <path d="M 20 20 L 30 25 L 30 35 L 20 36 L 10 35 L 10 25 Z" fill="#D2691E"/>
      <path d="M 20 20 L 30 25 L 30 35 L 20 30 Z" fill="#A0522D"/>
      <path d="M 20 13 L 30 18 L 30 25 L 20 20 L 10 25 L 10 18 Z" fill="#8B4513"/>
      <path d="M 20 13 L 30 18 L 30 25 L 20 20 Z" fill="#654321"/>
      <rect x="17" y="30" width="6" height="6" fill="#654321"/>
      <rect x="12" y="27" width="4" height="4" fill="#FFFFCC"/>
      <rect x="24" y="27" width="4" height="4" fill="#FFFFCC"/>
    </svg>
  ),
  2: (
    <svg width="45" height="45" viewBox="0 0 45 45" className="w-full h-auto">
      <ellipse cx="22" cy="42" rx="14" ry="3" fill="black" opacity="0.2"/>
      <path d="M 22 20 L 34 25 L 34 40 L 22 42 L 10 40 L 10 25 Z" fill="#D2691E"/>
      <path d="M 22 20 L 34 25 L 34 40 L 22 35 Z" fill="#A0522D"/>
      <rect x="12" y="11" width="3" height="8" fill="#8B4513"/>
      <path d="M 22 13 L 34 18 L 34 25 L 22 20 L 10 25 L 10 18 Z" fill="#8B4513"/>
      <path d="M 22 13 L 34 18 L 34 25 L 22 20 Z" fill="#654321"/>
      <rect x="19" y="36" width="6" height="6" fill="#654321"/>
      <rect x="12" y="28" width="4" height="3" fill="#FFFFCC"/>
      <rect x="28" y="28" width="4" height="3" fill="#FFFFCC"/>
      <rect x="12" y="33" width="4" height="3" fill="#FFFFCC"/>
      <rect x="28" y="33" width="4" height="3" fill="#FFFFCC"/>
    </svg>
  ),
  3: (
    <svg width="48" height="50" viewBox="0 0 48 50" className="w-full h-auto">
      <ellipse cx="24" cy="47" rx="15" ry="3.5" fill="black" opacity="0.2"/>
      <path d="M 24 19 L 37 24 L 37 45 L 24 47 L 11 45 L 11 24 Z" fill="#D2691E"/>
      <path d="M 24 19 L 37 24 L 37 45 L 24 38 Z" fill="#A0522D"/>
      <rect x="13" y="11" width="3" height="10" fill="#8B4513"/>
      <path d="M 24 12 L 37 17 L 37 24 L 24 19 L 11 24 L 11 17 Z" fill="#8B4513"/>
      <path d="M 24 12 L 37 17 L 37 24 L 24 19 Z" fill="#654321"/>
      <rect x="21" y="41" width="6" height="6" fill="#654321"/>
      <rect x="14" y="28" width="3" height="3" fill="#FFFFCC"/>
      <rect x="31" y="28" width="3" height="3" fill="#FFFFCC"/>
      <rect x="14" y="33" width="3" height="3" fill="#FFFFCC"/>
      <rect x="31" y="33" width="3" height="3" fill="#FFFFCC"/>
      <rect x="14" y="38" width="3" height="3" fill="#FFFFCC"/>
      <rect x="31" y="38" width="3" height="3" fill="#FFFFCC"/>
    </svg>
  ),
  4: (
    <svg width="50" height="55" viewBox="0 0 50 55" className="w-full h-auto">
      <ellipse cx="25" cy="52" rx="16" ry="4" fill="black" opacity="0.2"/>
      <path d="M 25 18 L 40 25 L 40 50 L 25 52 L 10 50 L 10 25 Z" fill="#D2691E"/>
      <path d="M 25 18 L 40 25 L 40 50 L 25 43 Z" fill="#A0522D"/>
      <rect x="12" y="11" width="3" height="10" fill="#8B4513"/>
      <path d="M 25 11 L 40 18 L 40 25 L 25 18 L 10 25 L 10 18 Z" fill="#8B4513"/>
      <path d="M 25 11 L 40 18 L 40 25 L 25 18 Z" fill="#654321"/>
      <rect x="22" y="46" width="6" height="6" fill="#654321"/>
      <rect x="12" y="28" width="4" height="3" fill="#FFFFCC"/>
      <rect x="34" y="28" width="4" height="3" fill="#FFFFCC"/>
      <rect x="12" y="34" width="4" height="3" fill="#FFFFCC"/>
      <rect x="34" y="34" width="4" height="3" fill="#FFFFCC"/>
      <rect x="12" y="40" width="4" height="3" fill="#FFFFCC"/>
      <rect x="34" y="40" width="4" height="3" fill="#FFFFCC"/>
      <rect x="23" y="31" width="4" height="3" fill="#FFFFCC"/>
    </svg>
  ),
  5: (
    <svg width="55" height="58" viewBox="0 0 55 58" className="w-full h-auto">
      <ellipse cx="27" cy="55" rx="18" ry="4" fill="black" opacity="0.3"/>
      <path d="M 27 17 L 44 24 L 44 53 L 27 55 L 10 53 L 10 24 Z" fill="#CD853F"/>
      <path d="M 27 17 L 44 24 L 44 53 L 27 46 Z" fill="#A0522D"/>
      <rect x="12" y="10" width="3" height="11" fill="#8B4513"/>
      <path d="M 27 10 L 44 17 L 44 24 L 27 17 L 10 24 L 10 17 Z" fill="#8B4513"/>
      <path d="M 27 10 L 44 17 L 44 24 L 27 17 Z" fill="#654321"/>
      <rect x="24" y="49" width="6" height="6" fill="#654321"/>
      <rect x="13" y="27" width="4" height="3" fill="#FFFFCC"/>
      <rect x="25" y="27" width="4" height="3" fill="#FFFFCC"/>
      <rect x="37" y="27" width="4" height="3" fill="#FFFFCC"/>
      <rect x="13" y="33" width="4" height="3" fill="#FFFFCC"/>
      <rect x="25" y="33" width="4" height="3" fill="#FFFFCC"/>
      <rect x="37" y="33" width="4" height="3" fill="#FFFFCC"/>
      <rect x="13" y="39" width="4" height="3" fill="#FFFFCC"/>
      <rect x="25" y="39" width="4" height="3" fill="#FFFFCC"/>
      <rect x="37" y="39" width="4" height="3" fill="#FFFFCC"/>
      <rect x="13" y="45" width="4" height="3" fill="#FFFFCC"/>
      <rect x="37" y="45" width="4" height="3" fill="#FFFFCC"/>
    </svg>
  ),
};

interface PropertyCardProps {
  propertyId: number;
  onSelect: (propertyId: number) => void;
}

export function PropertyCard({ propertyId, onSelect }: PropertyCardProps) {
  const { connected, publicKey } = useWallet();
  const { getOwnershipData, program } = useDefipoly();
  const { refreshKey } = usePropertyRefresh();
  
  const [buildingLevel, setBuildingLevel] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [hasCompleteSet, setHasCompleteSet] = useState(false);
  
  const property = PROPERTIES.find(p => p.id === propertyId);
  if (!property) return null;

  // Get cooldown info (optimized - fetches once, calculates client-side)
  const { cooldownRemaining, isOnCooldown, lastPurchasedPropertyId } = useCooldown(property.setId);
  
  // Format cooldown time
  const formatCooldown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Only show cooldown if there's a cooldown AND this is NOT the property that was just bought
  const isThisPropertyBlocked = isOnCooldown && lastPurchasedPropertyId !== propertyId;

  // Fetch ownership data AND check for complete set
  useEffect(() => {
    if (!connected || !publicKey || !program) {
      setBuildingLevel(0);
      setShieldActive(false);
      setHasCompleteSet(false);
      return;
    }

    const fetchOwnership = async () => {
      try {
        const ownershipData = await getOwnershipData(propertyId);
        
        if (ownershipData?.slotsOwned && ownershipData.slotsOwned > 0) {
          const slotsOwned = ownershipData.slotsOwned;
          
          // Calculate building level (1 slot = 1 level, up to 5)
          const level = Math.min(5, slotsOwned);
          setBuildingLevel(level);
          
          // Check if shield is active
          const now = Date.now() / 1000;
          const isShielded = ownershipData.slotsShielded > 0 && ownershipData.shieldExpiry.toNumber() > now;
          setShieldActive(isShielded);
          
          // Check for complete set
          const setId = property.setId;
          const propertiesInSet = PROPERTIES.filter(p => p.setId === setId);
          const requiredProps = setId === 0 || setId === 7 ? 2 : 3;
          
          let ownedInSet = 0;
          for (const prop of propertiesInSet) {
            try {
              const ownership = await getOwnershipData(prop.id);
              if (ownership && ownership.slotsOwned > 0) {
                ownedInSet++;
              }
            } catch {
              // Property not owned
            }
          }
          
          setHasCompleteSet(ownedInSet >= requiredProps);
          
          console.log(`🏠 Property ${propertyId} (${property.name}): ${slotsOwned} slots, Level ${level}, Shield: ${isShielded}, Complete Set: ${ownedInSet >= requiredProps}`);
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
  }, [connected, publicKey, propertyId, program, getOwnershipData, refreshKey, property.name, property.setId]);

  return (
    <button
      onClick={() => onSelect(propertyId)}
      className={`w-full h-full relative border-2 hover:scale-105 hover:z-20 hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col overflow-hidden bg-white ${
        hasCompleteSet 
          ? 'border-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.6),0_0_40px_rgba(251,191,36,0.3)] animate-[pulse-glow_2s_ease-in-out_infinite]' 
          : 'border-gray-800'
      }`}
      style={hasCompleteSet ? {
        animation: 'pulse-glow 2s ease-in-out infinite'
      } : undefined}
    >
      {/* Color bar at top */}
      <div className={`${property.color} h-4 w-full flex-shrink-0`}></div>

      {/* Property Name */}
      <div className="px-1 py-1 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="text-center">
          <div className="text-[7px] font-bold text-gray-700 leading-tight uppercase truncate">
            {property.name}
          </div>
        </div>
      </div>

      {/* Building display area */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 px-1 py-2 min-h-0">
        {buildingLevel === 0 ? (
          <div className="text-center">
            <div className="text-base">📍</div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center scale-[0.25]">
            {BUILDING_SVGS[buildingLevel]}
          </div>
        )}
      </div>

      {/* Shield Indicator */}
      {shieldActive && (
        <div className="px-1 py-1 bg-amber-50 border-t border-amber-200 flex-shrink-0">
          <div className="flex items-center justify-center gap-0.5">
            <span className="text-[7px]">🛡️</span>
            <span className="text-[6px] font-semibold text-amber-700">Shield</span>
          </div>
        </div>
      )}

      {/* Cooldown Indicator - Only show if THIS property is blocked */}
      {isThisPropertyBlocked && (
        <div className="px-1 py-1 bg-orange-50 border-t border-orange-200 flex-shrink-0">
          <div className="flex items-center justify-center gap-0.5">
            <span className="text-[7px]">⏳</span>
            <span className="text-[6px] font-semibold text-orange-700">
              {formatCooldown(cooldownRemaining)}
            </span>
          </div>
        </div>
      )}

      {/* Price */}
      <div className="px-1 py-1 bg-white border-t border-gray-200 flex-shrink-0">
        <div className="text-center">
          <div className="text-[8px] font-black text-gray-900">
            ${(property.price / 1000)}K
          </div>
        </div>
      </div>

      {/* Add keyframe animation for the golden glow */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3);
          }
          50% { 
            box-shadow: 0 0 30px rgba(251, 191, 36, 0.8), 0 0 60px rgba(251, 191, 36, 0.4);
          }
        }
      `}</style>
    </button>
  );
}