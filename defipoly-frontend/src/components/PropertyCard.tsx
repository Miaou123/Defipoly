'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { usePropertyRefresh } from '@/contexts/PropertyRefreshContext';
import { useCooldown } from '@/hooks/useCooldown';
import { useStealCooldown } from '@/hooks/useStealCooldown';
import { PROPERTIES } from '@/utils/constants';

// Building SVGs for levels 0-5 (Classic Monopoly Style)
const BUILDING_SVGS: { [key: number]: React.ReactNode } = {
  0: <></>,
  1: (
    // Small Single House
    <svg width="35" height="35" viewBox="0 0 35 35" className="w-full h-auto">
      <ellipse cx="17.5" cy="32" rx="10" ry="2.5" fill="black" opacity="0.2"/>
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
    <svg width="45" height="45" viewBox="0 0 45 45" className="w-full h-auto">
      <ellipse cx="22.5" cy="42" rx="13" ry="3" fill="black" opacity="0.25"/>
      {/* Main structure */}
      <path d="M 22.5 18 L 34 22 L 34 39 L 22.5 41 L 11 39 L 11 22 Z" fill="#D2691E"/>
      <path d="M 22.5 18 L 34 22 L 34 39 L 22.5 32 Z" fill="#A0522D"/>
      {/* Chimney */}
      <rect x="14" y="10" width="4" height="10" fill="#8B4513"/>
      <rect x="13" y="9" width="6" height="2" fill="#654321"/>
      {/* Roof */}
      <path d="M 22.5 11 L 36 17 L 34 22 L 22.5 18 L 11 22 L 9 17 Z" fill="#8B4513"/>
      <path d="M 22.5 11 L 36 17 L 34 22 L 22.5 18 Z" fill="#654321"/>
      {/* Door */}
      <rect x="19" y="34" width="7" height="7" fill="#654321"/>
      <circle cx="24" cy="37.5" r="0.5" fill="#FFD700"/>
      {/* Windows */}
      <rect x="13" y="27" width="4" height="4" fill="#FFFFCC"/>
      <rect x="28" y="27" width="4" height="4" fill="#FFFFCC"/>
      <rect x="13" y="33" width="4" height="4" fill="#FFFFCC"/>
    </svg>
  ),
  3: (
    // Apartment Building (3-story)
    <svg width="55" height="55" viewBox="0 0 55 55" className="w-full h-auto">
      <ellipse cx="27.5" cy="52" rx="16" ry="3" fill="black" opacity="0.3"/>
      {/* Main structure */}
      <path d="M 27.5 16 L 42 20 L 42 50 L 27.5 52 L 13 50 L 13 20 Z" fill="#D2691E"/>
      <path d="M 27.5 16 L 42 20 L 42 50 L 27.5 40 Z" fill="#A0522D"/>
      {/* Roof */}
      <path d="M 27.5 10 L 45 16 L 42 20 L 27.5 16 L 13 20 L 10 16 Z" fill="#8B4513"/>
      <path d="M 27.5 10 L 45 16 L 42 20 L 27.5 16 Z" fill="#654321"/>
      {/* Door */}
      <rect x="23" y="45" width="9" height="7" fill="#654321"/>
      <circle cx="29" cy="48.5" r="0.6" fill="#FFD700"/>
      {/* Windows - 3 floors */}
      <rect x="15" y="24" width="4" height="4" fill="#FFFFCC"/>
      <rect x="24" y="24" width="4" height="4" fill="#FFFFCC"/>
      <rect x="33" y="24" width="4" height="4" fill="#FFFFCC"/>
      
      <rect x="15" y="31" width="4" height="4" fill="#FFFFCC"/>
      <rect x="24" y="31" width="4" height="4" fill="#FFFFCC"/>
      <rect x="33" y="31" width="4" height="4" fill="#FFFFCC"/>
      
      <rect x="15" y="38" width="4" height="4" fill="#FFFFCC"/>
      <rect x="33" y="38" width="4" height="4" fill="#FFFFCC"/>
    </svg>
  ),
  4: (
    // Tall Tower Building (5 floors) - Enhanced with balconies and details
    <svg width="55" height="65" viewBox="0 0 55 65" className="w-full h-auto">
      <ellipse cx="27.5" cy="62" rx="17" ry="4" fill="black" opacity="0.35"/>
      {/* Main tower */}
      <path d="M 27.5 12 L 45 19 L 45 60 L 27.5 62 L 10 60 L 10 19 Z" fill="#D2B48C"/>
      <path d="M 27.5 12 L 45 19 L 45 60 L 27.5 50 Z" fill="#BC9B6D"/>
      
      {/* Decorative vertical stripes */}
      <rect x="19" y="19" width="1" height="41" fill="#A0826D" opacity="0.5"/>
      <rect x="36" y="19" width="1" height="41" fill="#8B6F47" opacity="0.5"/>
      
      {/* Top crown */}
      <path d="M 27.5 8 L 47 16 L 45 19 L 27.5 12 L 10 19 L 8 16 Z" fill="#8B7355"/>
      <path d="M 27.5 8 L 47 16 L 45 19 L 27.5 12 Z" fill="#6B5843"/>
      
      {/* Decorative crown details */}
      <rect x="14" y="16" width="2" height="3" fill="#6B5843"/>
      <rect x="26.5" y="14" width="2" height="3" fill="#6B5843"/>
      <rect x="39" y="16" width="2" height="3" fill="#6B5843"/>
      
      {/* Balcony accents */}
      <rect x="9" y="35" width="2" height="0.5" fill="#8B7355"/>
      <rect x="44" y="35" width="2" height="0.5" fill="#8B7355"/>
      
      {/* Entrance with columns */}
      <rect x="21" y="56" width="2" height="6" fill="#8B7355"/>
      <rect x="32.5" y="56" width="2" height="6" fill="#8B7355"/>
      <rect x="23" y="55" width="9" height="7" fill="#654321"/>
      <path d="M 23 55 L 27.5 53 L 32 55 Z" fill="#8B7355"/>
      
      {/* Windows - 5 floors, 3 columns, perfectly aligned */}
      <rect x="13" y="23" width="4" height="3.5" fill="#FFFFCC"/>
      <rect x="25.5" y="23" width="4" height="3.5" fill="#FFFFCC"/>
      <rect x="38" y="23" width="4" height="3.5" fill="#FFFFCC"/>
      
      <rect x="13" y="29.5" width="4" height="3.5" fill="#FFFFCC"/>
      <rect x="25.5" y="29.5" width="4" height="3.5" fill="#FFFFCC"/>
      <rect x="38" y="29.5" width="4" height="3.5" fill="#FFFFCC"/>
      
      <rect x="13" y="36" width="4" height="3.5" fill="#FFFFCC"/>
      <rect x="25.5" y="36" width="4" height="3.5" fill="#FFFFCC"/>
      <rect x="38" y="36" width="4" height="3.5" fill="#FFFFCC"/>
      
      <rect x="13" y="42.5" width="4" height="3.5" fill="#FFFFCC"/>
      <rect x="25.5" y="42.5" width="4" height="3.5" fill="#FFFFCC"/>
      <rect x="38" y="42.5" width="4" height="3.5" fill="#FFFFCC"/>
      
      <rect x="13" y="49" width="4" height="3.5" fill="#FFFFCC"/>
      <rect x="38" y="49" width="4" height="3.5" fill="#FFFFCC"/>
    </svg>
  ),
  5: (
    // Luxury Hotel with Helipad - Enhanced with more luxury details
    <svg width="65" height="75" viewBox="0 0 65 75" className="w-full h-auto">
      <ellipse cx="32.5" cy="72" rx="20" ry="4.5" fill="black" opacity="0.4"/>
      {/* Main hotel structure */}
      <path d="M 32.5 10 L 52 18 L 52 70 L 32.5 72 L 13 70 L 13 18 Z" fill="#DAA520"/>
      <path d="M 32.5 10 L 52 18 L 52 70 L 32.5 58 Z" fill="#B8860B"/>
      
      {/* Decorative gold trim lines */}
      <rect x="20" y="18" width="1.5" height="52" fill="#FFD700" opacity="0.6"/>
      <rect x="43.5" y="18" width="1.5" height="52" fill="#CD9A00" opacity="0.6"/>
      
      {/* Helipad on top with details */}
      <ellipse cx="32.5" cy="10" rx="8" ry="2" fill="#FF6B6B"/>
      <ellipse cx="32.5" cy="10" rx="6" ry="1.5" fill="#FF4444"/>
      <text x="32.5" y="11.5" fontSize="4" fill="white" textAnchor="middle" fontWeight="bold">H</text>
      
      {/* Crown/Top decoration */}
      <path d="M 32.5 5 L 54 14 L 52 18 L 32.5 10 L 13 18 L 11 14 Z" fill="#8B7355"/>
      <path d="M 32.5 5 L 54 14 L 52 18 L 32.5 10 Z" fill="#6B5843"/>
      
      {/* Crown ornaments */}
      <circle cx="18" cy="16" r="1.5" fill="#FFD700"/>
      <circle cx="32.5" cy="12" r="1.5" fill="#FFD700"/>
      <circle cx="47" cy="16" r="1.5" fill="#FFD700"/>
      
      {/* Luxury entrance with awning and columns */}
      <rect x="24" y="66" width="2.5" height="6" fill="#8B7355"/>
      <rect x="38.5" y="66" width="2.5" height="6" fill="#8B7355"/>
      <path d="M 25 65 L 28 63 L 37 63 L 40 65 Z" fill="#DC143C"/>
      <rect x="26" y="65" width="13" height="7" fill="#654321"/>
      <rect x="28" y="67" width="9" height="5" fill="#2C1810"/>
      
      {/* Gold door trim */}
      <rect x="27.5" y="66.5" width="10" height="0.5" fill="#FFD700"/>
      
      {/* Balconies on sides */}
      <rect x="11" y="38" width="2" height="0.5" fill="#8B7355"/>
      <rect x="51" y="38" width="2" height="0.5" fill="#8B7355"/>
      
      {/* Windows - 6 floors, 4 columns, perfectly aligned */}
      <rect x="16" y="22" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="26" y="22" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="35" y="22" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="45" y="22" width="3.5" height="3.5" fill="#FFFFCC"/>
      
      <rect x="16" y="28.5" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="26" y="28.5" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="35" y="28.5" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="45" y="28.5" width="3.5" height="3.5" fill="#FFFFCC"/>
      
      <rect x="16" y="35" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="26" y="35" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="35" y="35" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="45" y="35" width="3.5" height="3.5" fill="#FFFFCC"/>
      
      <rect x="16" y="41.5" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="26" y="41.5" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="35" y="41.5" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="45" y="41.5" width="3.5" height="3.5" fill="#FFFFCC"/>
      
      <rect x="16" y="48" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="26" y="48" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="35" y="48" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="45" y="48" width="3.5" height="3.5" fill="#FFFFCC"/>
      
      <rect x="16" y="54.5" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="26" y="54.5" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="35" y="54.5" width="3.5" height="3.5" fill="#FFFFCC"/>
      <rect x="45" y="54.5" width="3.5" height="3.5" fill="#FFFFCC"/>
      
      {/* Decorative flags on corners */}
      <rect x="14" y="16" width="1" height="6" fill="#8B4513"/>
      <path d="M 15 16 L 19 17.5 L 15 19 Z" fill="#DC143C"/>
      <rect x="50" y="16" width="1" height="6" fill="#8B4513"/>
      <path d="M 50 16 L 46 17.5 L 50 19 Z" fill="#DC143C"/>
      
      {/* Stars on flags */}
      <circle cx="17" cy="17.5" r="0.5" fill="#FFD700"/>
      <circle cx="48" cy="17.5" r="0.5" fill="#FFD700"/>
    </svg>
  ),
};

interface PropertyCardProps {
  propertyId: number;
  onSelect: (propertyId: number) => void;
}

export function PropertyCard({ propertyId, onSelect }: PropertyCardProps) {
  const { connected, publicKey } = useWallet();
  const { getOwnershipData, getPropertyData, program } = useDefipoly();
  const { refreshKey } = usePropertyRefresh();
  
  const [buildingLevel, setBuildingLevel] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [hasCompleteSet, setHasCompleteSet] = useState(false);
  
  const property = PROPERTIES.find(p => p.id === propertyId);
  if (!property) return null;

  // Get cooldown info (optimized - fetches once, calculates client-side)
  const { cooldownRemaining, isOnCooldown, lastPurchasedPropertyId } = useCooldown(property.setId);

  // Get steal cooldown info 
  const { isOnStealCooldown, stealCooldownRemaining } = useStealCooldown(propertyId); 
  
  // Format cooldown time
  const formatCooldown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Only show buy cooldown if there's a cooldown AND this is NOT the property that was just bought
  const isThisPropertyBlocked = isOnCooldown && lastPurchasedPropertyId !== propertyId;

  // Determine which cooldowns are active
  const activeCooldowns = [];
  if (shieldActive) {
    activeCooldowns.push({ icon: '🛡️', label: 'Shield' });
  }
  if (isThisPropertyBlocked) {
    activeCooldowns.push({ icon: '💰', time: formatCooldown(cooldownRemaining) });
  }
  if (isOnStealCooldown) {
    activeCooldowns.push({ icon: '🔥', time: formatCooldown(stealCooldownRemaining) });
  }

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
        const propertyData = await getPropertyData(propertyId);
        
        if (ownershipData?.slotsOwned && ownershipData.slotsOwned > 0 && propertyData) {
          const slotsOwned = ownershipData.slotsOwned;
          const maxPerPlayer = propertyData.maxPerPlayer;
          
          // Calculate building level based on percentage of maxPerPlayer (1-5 levels)
          const progressRatio = slotsOwned / maxPerPlayer;
          const level = Math.ceil(progressRatio * 5);
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
  }, [connected, publicKey, propertyId, program, getOwnershipData, getPropertyData, refreshKey, property.name, property.setId]);

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

      {/* Combined Cooldown/Status Indicator - Only show when there's at least one cooldown */}
      {activeCooldowns.length > 0 && (
        <div className="px-1 py-0.5 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-center gap-1">
            {activeCooldowns.map((cooldown, index) => (
              <div key={index} className="flex items-center gap-0.5">
                <span className="text-[8px]">{cooldown.icon}</span>
                {cooldown.time && (
                  <span className="text-[6px] font-semibold text-gray-700">
                    {cooldown.time}
                  </span>
                )}
                {cooldown.label && (
                  <span className="text-[6px] font-semibold text-amber-700">
                    {cooldown.label}
                  </span>
                )}
              </div>
            ))}
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