// ============================================
// FILE: src/components/property-modal/PropertyModal.tsx
// Main modal component with VARIABLE SET BONUSES (30-50%)
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { PROPERTIES, SET_BONUSES } from '@/utils/constants';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { StyledWalletButton } from '../StyledWalletButton';
import { X } from 'lucide-react';
import { PropertyCard } from '../PropertyCard';
import { PropertyActionsBar } from './PropertyActionsBar';

interface PropertyModalProps {
  propertyId: number | null;
  onClose: () => void;
}

// Helper function to get color from Tailwind class
const getColorFromClass = (colorClass: string): string => {
  const colorMap: { [key: string]: string } = {
    'bg-amber-900': '#78350f',
    'bg-orange-600': '#ea580c',
    'bg-sky-500': '#0ea5e9',
    'bg-pink-500': '#ec4899',
    'bg-yellow-400': '#eab308',
    'bg-green-600': '#16a34a',
    'bg-blue-600': '#2563eb',
    'bg-red-600': '#dc2626'
  };
  return colorMap[colorClass] || '#10b981';
};

export function PropertyModal({ propertyId, onClose }: PropertyModalProps) {
  const { connected } = useWallet();
  const { getPropertyData, getOwnershipData, program } = useDefipoly();
  const wallet = useAnchorWallet();
  const property = propertyId !== null ? PROPERTIES.find(p => p.id === propertyId) : null;
  const { balance } = useTokenBalance();
  
  const [loading, setLoading] = useState(false);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [setBonusInfo, setSetBonusInfo] = useState<{
    hasCompleteSet: boolean;
    boostedSlots: number;
    totalSlots: number;
  } | null>(null);
  
  // Fetch property and ownership data
  useEffect(() => {
    if (propertyId !== null && connected && program) {
      const fetchData = async () => {
        try {
          const onChainPropertyData = await getPropertyData(propertyId);
          const ownershipData = wallet ? await getOwnershipData(propertyId) : null;
          
          if (onChainPropertyData) {
            const now = Date.now() / 1000;
            const shieldActive = ownershipData 
              ? (ownershipData.slotsShielded > 0 && ownershipData.shieldExpiry.toNumber() > now)
              : false;

            setPropertyData({
              availableSlots: onChainPropertyData.availableSlots,
              maxSlotsPerProperty: onChainPropertyData.maxSlotsPerProperty,
              owned: ownershipData?.slotsOwned || 0,
              slotsShielded: ownershipData?.slotsShielded || 0,
              shieldActive,
              shieldExpiry: ownershipData?.shieldExpiry,
              yieldPercentBps: onChainPropertyData.yieldPercentBps,
              shieldCostPercentBps: onChainPropertyData.shieldCostPercentBps,
            });
          }
        } catch (error) {
          console.error('Error fetching property data:', error);
        }
      };
      
      fetchData();
    }
  }, [propertyId, connected, program, wallet, getPropertyData, getOwnershipData]);

  // Fetch set bonus info
  useEffect(() => {
    const fetchSetBonusInfo = async () => {
      if (!connected || !wallet || !program || !propertyData || propertyData.owned === 0 || !property) {
        setSetBonusInfo(null);
        return;
      }

      try {
        const setId = property.setId;
        const propertiesInSet = PROPERTIES.filter(p => p.setId === setId);
        const requiredProps = setId === 0 || setId === 7 ? 2 : 3;
        
        // Get ownership for all properties in the set
        const ownerships: { propertyId: number; slotsOwned: number }[] = [];
        
        for (const prop of propertiesInSet) {
          try {
            const ownership = await getOwnershipData(prop.id);
            if (ownership && ownership.slotsOwned > 0) {
              ownerships.push({
                propertyId: prop.id,
                slotsOwned: ownership.slotsOwned
              });
            }
          } catch {
            // Property not owned
          }
        }
        
        // Check if we have complete set
        const hasCompleteSet = ownerships.length >= requiredProps;
        
        // If complete set, find minimum slots owned across the set
        let boostedSlots = 0;
        if (hasCompleteSet) {
          boostedSlots = Math.min(...ownerships.map(o => o.slotsOwned));
        }
        
        setSetBonusInfo({
          hasCompleteSet,
          boostedSlots,
          totalSlots: propertyData.owned
        });
      } catch (error) {
        console.error('Error fetching set bonus info:', error);
        setSetBonusInfo(null);
      }
    };

    fetchSetBonusInfo();
  }, [connected, wallet, program, propertyData, property, getOwnershipData]);

  if (!property || propertyId === null) return null;

  const dailyIncome = Math.floor((property.price * property.yieldBps) / 10000);
  
  // ============================================
  // VARIABLE SET BONUS CALCULATION (30-50%)
  // ============================================
  
  // Calculate income per slot
  const baseIncomePerSlot = dailyIncome;
  
  // Get variable set bonus from SET_BONUSES based on setId
  const setBonus = SET_BONUSES[property.setId as keyof typeof SET_BONUSES];
  const setBonusPercent = setBonus?.percent || 40;  // e.g., 30.00 for Brown, 50.00 for Dark Blue
  const setBonusBps = setBonus?.bps || 4000;        // e.g., 3000 for Brown, 5000 for Dark Blue
  
  // Calculate boosted income using VARIABLE bonus
  const boostedIncomePerSlot = setBonusInfo?.hasCompleteSet ? 
    Math.floor(baseIncomePerSlot * (10000 + setBonusBps) / 10000) : baseIncomePerSlot;

  // Calculate availability values for the stacked bar
  const totalSlots = property.maxSlots;  // ✅ FIXED: Use maxSlots instead of totalSlots
  const personalOwned = propertyData?.owned || 0;
  const othersOwned = totalSlots - (propertyData?.availableSlots || 0) - personalOwned;
  const availableSlots = propertyData?.availableSlots || 0;

  // Calculate bonus amount using VARIABLE bonus
  const bonusAmount = Math.floor(baseIncomePerSlot * setBonusBps / 10000);
  const totalIncome = baseIncomePerSlot + bonusAmount;

  // Check if set bonus is active
  const hasSetBonus = setBonusInfo?.hasCompleteSet || false;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-2xl w-full overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header - COMPACT */}
        <div className="relative bg-gradient-to-r from-purple-900/50 to-purple-800/50 border-b border-purple-500/30 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-purple-100 mb-1.5">{property.name}</h2>
              <div className={`${property.color} h-2.5 w-20 rounded-full shadow-lg`}></div>
            </div>
            <button 
              onClick={onClose} 
              className="text-purple-300 hover:text-white transition-colors hover:bg-purple-800/50 rounded-lg p-1.5"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content - COMPACT */}
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Property Card + Details - SMALLER */}
          <div className="grid grid-cols-[140px_1fr] gap-4">
            {/* Left: Property Card */}
            <div className="flex justify-center">
              <div className="w-[140px] h-[210px]">
                <PropertyCard 
                  propertyId={propertyId} 
                  onSelect={() => {}} 
                />
              </div>
            </div>

            {/* Right: Details */}
            <div className="bg-purple-900/20 rounded-xl p-3 border border-purple-500/20 space-y-2.5">
              {/* Income Calculation Row - UPDATED WITH VARIABLE BONUS */}
              <div>
                <div className="text-[9px] text-purple-400 mb-1.5 uppercase tracking-wider">Income</div>
                <div className="flex items-center gap-2 bg-950/50 rounded-lg p-1.5">
                  {/* Base */}
                  <div className="flex flex-col flex-1">
                    <div className="text-[8px] text-purple-400 uppercase">📊 Base</div>
                    <div className="text-sm font-bold text-purple-100">{baseIncomePerSlot.toLocaleString()}</div>
                  </div>
                  
                  <div className="text-purple-400 opacity-50 font-bold text-sm">+</div>
                  
                  {/* Boost - SHOWS VARIABLE PERCENTAGE */}
                  <div className="flex flex-col flex-1">
                    <div className="text-[8px] text-purple-400 uppercase flex items-center gap-1">
                      ⚡ Boost <span className={`px-1 py-0.5 rounded text-[7px] font-bold ${hasSetBonus ? 'bg-amber-500 text-amber-950' : 'bg-gray-600 text-gray-300 opacity-60'}`}>
                        +{setBonusPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className={`text-sm font-bold ${hasSetBonus ? 'text-purple-100' : 'text-purple-100/50 line-through'}`}>
                      {bonusAmount.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="text-purple-400 opacity-50 font-bold text-sm">=</div>
                  
                  {/* Total */}
                  <div className={`flex flex-col flex-[1.2] rounded-lg p-1.5 border-2 ${hasSetBonus ? 'bg-green-900/15 border-green-500/30' : 'bg-gray-900/15 border-gray-500/30'}`}>
                    <div className="text-[8px] text-purple-400 uppercase">💎 Total</div>
                    <div className={`text-lg font-bold ${hasSetBonus ? 'text-green-400' : 'text-gray-400'}`}>
                      {hasSetBonus ? totalIncome.toLocaleString() : baseIncomePerSlot.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {/* Set Bonus Info - Shows which set and actual percentage */}
                {hasSetBonus && (
                  <div className="mt-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-amber-400 font-medium">
                        ✨ Complete Set Bonus Active
                      </span>
                      <span className="text-amber-300">
                        +{setBonusPercent.toFixed(1)}% on {setBonusInfo.boostedSlots} slot{setBonusInfo.boostedSlots !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-purple-500/10"></div>

              {/* Slots Distribution Row */}
              <div>
                <div className="text-[9px] text-purple-400 mb-1.5 uppercase tracking-wider">Slots</div>
                <div className="space-y-2">
                  {/* Values */}
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-lg font-bold text-purple-100">{totalSlots - availableSlots}</span>
                      <span className="text-[9px] text-purple-400 ml-1">/ {totalSlots} slots filled</span>
                    </div>
                    <div>
                      <span className="text-lg font-bold text-purple-100">{availableSlots}</span>
                      <span className="text-[9px] text-purple-400 ml-1">available</span>
                    </div>
                  </div>
                  
                  {/* Stacked Bar */}
                  <div className="h-2 bg-purple-950/50 rounded-full overflow-hidden flex">
                    {othersOwned > 0 && (
                      <div 
                        className="h-full bg-green-500"
                        style={{ width: `${(othersOwned / totalSlots) * 100}%` }}
                      />
                    )}
                    {personalOwned > 0 && (
                      <div 
                        className="h-full bg-purple-500"
                        style={{ width: `${(personalOwned / totalSlots) * 100}%` }}
                      />
                    )}
                    {availableSlots > 0 && (
                      <div 
                        className="h-full bg-white/15"
                        style={{ width: `${(availableSlots / totalSlots) * 100}%` }}
                      />
                    )}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex gap-3 text-[10px]">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-sm"></div>
                      <span className="text-purple-300">Others: {othersOwned}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-sm"></div>
                      <span className="text-purple-300">You: {personalOwned}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-sm"></div>
                      <span className="text-purple-300">Available: {availableSlots}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - NEW COLLAPSIBLE INLINE DESIGN */}
          {!connected ? (
            <div className="flex flex-col items-center py-6 space-y-3">
              <p className="text-purple-200 mb-1 text-center text-sm">Connect your wallet to interact with this property</p>
              <StyledWalletButton variant="modal" />
            </div>
          ) : (
            <PropertyActionsBar
              propertyId={propertyId}
              property={property}
              propertyData={propertyData}
              balance={balance}
              loading={loading}
              setLoading={setLoading}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}