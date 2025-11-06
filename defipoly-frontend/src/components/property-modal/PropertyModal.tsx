// ============================================
// FIXED PropertyModal.tsx
// FIX 1: Proper type casting for SET_BONUSES access
// FIX 2: Null checking for setBonusInfo
// FIX 3: Calculate dailyIncome from price and yieldBps
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

  // ✅ FIX: Calculate dailyIncome from price and yieldBps
  const dailyIncome = Math.floor((property.price * property.yieldBps) / 10000);
  
  // ============================================
  // VARIABLE SET BONUS CALCULATION (30-50%)
  // ============================================
  
  // Calculate income per slot
  const baseIncomePerSlot = dailyIncome;
  
  // ✅ FIX: Proper type casting for SET_BONUSES key access
  const setBonus = SET_BONUSES[property.setId.toString() as keyof typeof SET_BONUSES];
  const setBonusPercent = setBonus?.percent || 40;
  const setBonusBps = setBonus?.bps || 4000;
  
  // ✅ FIX: Null check before accessing setBonusInfo properties
  const hasSetBonus = setBonusInfo?.hasCompleteSet || false;
  const boostedIncomePerSlot = hasSetBonus
    ? Math.floor(baseIncomePerSlot * (10000 + setBonusBps) / 10000)
    : baseIncomePerSlot;
  
  const bonusAmount = Math.floor(baseIncomePerSlot * setBonusBps / 10000);
  const totalIncome = baseIncomePerSlot + bonusAmount;

  const themeColor = getColorFromClass(property.color);

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with property name and tier badge */}
        <div 
          className="relative border-b-2 p-6"
          style={{
            background: `linear-gradient(135deg, ${themeColor}40, ${themeColor}20)`,
            borderColor: `${themeColor}50`
          }}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-black text-white">{property.name}</h2>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${themeColor}60`,
                    color: 'white',
                    border: `2px solid ${themeColor}`
                  }}
                >
                  {property.tier}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-purple-200">
                <span>Set {property.setId + 1}</span>
                <span>•</span>
                <span>Property #{property.id}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-purple-300 hover:text-white transition-colors hover:bg-purple-800/50 rounded-lg p-2"
            >
              <X size={28} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
          <div className="p-6 space-y-6">
            {/* Connection prompt */}
            {!connected && (
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-6 text-center">
                <p className="text-purple-300 mb-4">Connect your wallet to interact with this property</p>
                <StyledWalletButton variant="modal" />
              </div>
            )}

            {/* Main content grid */}
            {connected && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Property visual */}
                <div className="flex flex-col items-center justify-center bg-purple-900/20 rounded-xl p-6 border border-purple-500/20">
                  <PropertyCard
                    property={property}
                    isClickable={false}
                  />
                </div>

                {/* Right: Details */}
                <div className="bg-purple-900/20 rounded-xl p-3 border border-purple-500/20 space-y-2.5">
                  {/* Income Calculation Row */}
                  <div>
                    <div className="text-[9px] text-purple-400 mb-1.5 uppercase tracking-wider">Income</div>
                    <div className="flex items-center gap-2 bg-purple-950/50 rounded-lg p-1.5">
                      {/* Base */}
                      <div className="flex flex-col flex-1">
                        <div className="text-[8px] text-purple-400 uppercase">📊 Base</div>
                        <div className="text-sm font-bold text-purple-100">{baseIncomePerSlot.toLocaleString()}</div>
                      </div>
                      
                      <div className="text-purple-400 opacity-50 font-bold text-sm">+</div>
                      
                      {/* Boost */}
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
                    
                    {/* Set Bonus Info - ✅ FIX: Added null check */}
                    {hasSetBonus && setBonusInfo && (
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

                  {/* Property Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-purple-950/30 rounded-lg p-2 border border-purple-500/10">
                      <div className="text-[8px] text-purple-400 uppercase mb-0.5">💰 Price</div>
                      <div className="text-sm font-bold text-purple-100">{property.price.toLocaleString()} DEFI</div>
                    </div>
                    
                    <div className="bg-purple-950/30 rounded-lg p-2 border border-purple-500/10">
                      <div className="text-[8px] text-purple-400 uppercase mb-0.5">📈 Daily Yield</div>
                      <div className="text-sm font-bold text-purple-100">{(property.yieldBps / 100).toFixed(1)}%</div>
                    </div>
                    
                    <div className="bg-purple-950/30 rounded-lg p-2 border border-purple-500/10">
                      <div className="text-[8px] text-purple-400 uppercase mb-0.5">🛡️ Shield Cost</div>
                      <div className="text-sm font-bold text-purple-100">{(property.shieldCostBps / 100).toFixed(0)}%</div>
                    </div>
                    
                    <div className="bg-purple-950/30 rounded-lg p-2 border border-purple-500/10">
                      <div className="text-[8px] text-purple-400 uppercase mb-0.5">⏰ Cooldown</div>
                      <div className="text-sm font-bold text-purple-100">{property.cooldown}h</div>
                    </div>
                  </div>

                  {/* Slot Distribution */}
                  {propertyData && (
                    <div>
                      <div className="text-[9px] text-purple-400 mb-1.5 uppercase tracking-wider">🎰 Slots ({property.maxSlots} total)</div>
                      
                      {/* Visual Bar */}
                      <div className="h-4 bg-gray-800/50 rounded-full overflow-hidden flex border border-gray-700/50">
                        {propertyData.owned > 0 && (
                          <div 
                            className="bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center"
                            style={{ width: `${(propertyData.owned / property.maxSlots) * 100}%` }}
                          >
                            <span className="text-[8px] font-bold text-white drop-shadow">
                              {propertyData.owned}
                            </span>
                          </div>
                        )}
                        
                        {(property.maxSlots - propertyData.availableSlots - propertyData.owned) > 0 && (
                          <div 
                            className="bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center"
                            style={{ width: `${((property.maxSlots - propertyData.availableSlots - propertyData.owned) / property.maxSlots) * 100}%` }}
                          >
                            <span className="text-[8px] font-bold text-white drop-shadow">
                              {property.maxSlots - propertyData.availableSlots - propertyData.owned}
                            </span>
                          </div>
                        )}
                        
                        {propertyData.availableSlots > 0 && (
                          <div 
                            className="bg-gradient-to-r from-gray-600 to-gray-500 flex items-center justify-center"
                            style={{ width: `${(propertyData.availableSlots / property.maxSlots) * 100}%` }}
                          >
                            <span className="text-[8px] font-bold text-white drop-shadow">
                              {propertyData.availableSlots}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Legend */}
                      <div className="flex gap-3 mt-2 text-[9px]">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-400">You: <span className="text-green-400 font-semibold">{propertyData.owned}</span></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-gray-400">Others: <span className="text-red-400 font-semibold">{property.maxSlots - propertyData.availableSlots - propertyData.owned}</span></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          <span className="text-gray-400">Free: <span className="text-gray-300 font-semibold">{propertyData.availableSlots}</span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Bar */}
            {connected && propertyData && (
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
    </div>
  );
}