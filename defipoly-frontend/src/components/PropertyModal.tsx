// ============================================
// FILE: defipoly-frontend/src/components/PropertyModal.tsx
// With Split Card Availability Display
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { PROPERTIES } from '@/utils/constants';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { StyledWalletButton } from './StyledWalletButton';
import { X, TrendingUp, DollarSign, Zap } from 'lucide-react';
import { PropertyCard } from './PropertyCard';
import {
  BuyPropertySection,
  ShieldPropertySection,
  SellPropertySection,
  StealPropertySection
} from './property-actions';

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

  const dailyIncome = property.dailyIncome;
  
  // Calculate income per slot (used for yield display)
  const baseIncomePerSlot = dailyIncome;
  const boostedIncomePerSlot = setBonusInfo?.hasCompleteSet ? Math.floor(baseIncomePerSlot * 1.4) : baseIncomePerSlot;

  // Calculate total daily income for owned slots
  let totalDailyIncome = 0;
  if (propertyData?.owned > 0 && setBonusInfo) {
    if (setBonusInfo.hasCompleteSet) {
      const boostedSlots = setBonusInfo.boostedSlots;
      const unboostedSlots = setBonusInfo.totalSlots - boostedSlots;
      totalDailyIncome = (boostedSlots * boostedIncomePerSlot) + (unboostedSlots * baseIncomePerSlot);
    } else {
      totalDailyIncome = propertyData.owned * baseIncomePerSlot;
    }
  }

  const propertyColor = getColorFromClass(property.color);

  // Calculate availability values for the display
  const globalAvailable = propertyData?.availableSlots || 0;
  const totalSlots = property.totalSlots;
  const personalOwned = propertyData?.owned || 0;
  const personalMax = propertyData?.maxSlotsPerProperty || property.totalSlots;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-2xl w-full overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-900/50 to-purple-800/50 border-b border-purple-500/30 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-purple-100 mb-2">{property.name}</h2>
              <div className={`${property.color} h-3 w-24 rounded-full shadow-lg`}></div>
            </div>
            <button 
              onClick={onClose} 
              className="text-purple-300 hover:text-white transition-colors hover:bg-purple-800/50 rounded-lg p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Property Card Visualization */}
        <div className="flex justify-center py-6 bg-gradient-to-b from-purple-900/20 to-transparent border-b border-purple-500/20">
          <div className="w-32 h-48 pointer-events-none">
            <PropertyCard 
              propertyId={propertyId} 
              onSelect={() => {}} 
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Property Stats - NEW COMPACT DESIGN */}
          <div className="grid grid-cols-3 gap-3">
            {/* Price per Slot */}
            <div className="bg-purple-900/30 backdrop-blur rounded-xl p-3 border border-purple-500/20">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider">
                  Price
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <div className="text-xl font-black text-purple-100">
                  {property.price.toLocaleString()}
                </div>
                <div className="text-[10px] text-purple-400">per slot</div>
              </div>
            </div>

            {/* Base Income */}
            <div className="bg-purple-900/30 backdrop-blur rounded-xl p-3 border border-purple-500/20">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider">
                  Base
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <div className="text-xl font-black text-purple-100">
                  {baseIncomePerSlot.toLocaleString()}
                </div>
                <div className="text-[10px] text-purple-400">per slot/day</div>
              </div>
            </div>

            {/* Boosted Income */}
            <div className="bg-gradient-to-br from-amber-900/30 to-purple-900/30 backdrop-blur rounded-xl p-3 border border-amber-500/30 relative">
              <div className="absolute -top-1 -right-1 bg-amber-500 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                +40%
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-4 h-4 text-amber-400" />
                <div className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
                  Boosted
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <div className="text-xl font-black text-amber-400">
                  {boostedIncomePerSlot.toLocaleString()}
                </div>
                <div className="text-[10px] text-purple-400">per slot/day</div>
              </div>
            </div>
          </div>

          {/* NEW: Split Card Layout for Detailed Availability */}
          <div className="grid grid-cols-2 gap-3">
            {/* Global Availability */}
            <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/20">
              <div className="text-xs text-purple-400 mb-1">🌍 Global Pool</div>
              <div className="text-2xl font-bold text-purple-100">
                {globalAvailable}
              </div>
              <div className="text-xs text-purple-400 mt-1">
                of {totalSlots} total slots
              </div>
              <div className="mt-2 w-full bg-purple-950/50 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    globalAvailable < totalSlots * 0.2 
                      ? 'bg-red-500' 
                      : globalAvailable < totalSlots * 0.5
                      ? 'bg-amber-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${(globalAvailable / totalSlots) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Your Personal Ownership */}
            <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/20">
              <div className="text-xs text-purple-400 mb-1">👤 Your Ownership</div>
              <div className="text-2xl font-bold text-emerald-400">
                {personalOwned}
              </div>
              <div className="text-xs text-purple-400 mt-1">
                of {personalMax} max allowed
              </div>
              <div className="mt-2 w-full bg-purple-950/50 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${(personalOwned / personalMax) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Set Bonus Info */}
          {setBonusInfo && propertyData?.owned > 0 && (
            <div className={`rounded-xl p-3 border ${
              setBonusInfo.hasCompleteSet 
                ? 'bg-green-900/20 border-green-500/30' 
                : 'bg-purple-900/20 border-purple-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {setBonusInfo.hasCompleteSet ? (
                    <>
                      <span className="text-green-300 font-bold">✅ Set Bonus Active</span>
                      <div className="text-xs text-green-400 mt-1">
                        +40% income on {setBonusInfo.boostedSlots} slot{setBonusInfo.boostedSlots !== 1 ? 's' : ''}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-purple-300 font-bold">Set Bonus Available</span>
                      <div className="text-xs text-purple-400 mt-1">
                        Own all properties in this color set for +40% income
                      </div>
                    </>
                  )}
                </div>
                {totalDailyIncome > 0 && (
                  <div className="text-right">
                    <div className="text-xs text-purple-400">Your Income</div>
                    <div className="text-lg font-bold text-green-400">
                      {totalDailyIncome.toLocaleString()}
                    </div>
                    <div className="text-xs text-purple-500">DEFI/day</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shield Status */}
          {propertyData?.shieldActive && (
            <div className="bg-blue-900/20 rounded-xl p-3 border border-blue-500/30 flex items-center justify-between">
              <div>
                <div className="text-blue-300 font-bold text-sm flex items-center gap-2">
                  🛡️ Shield Active
                </div>
                <div className="text-xs text-blue-400 mt-1">
                  {propertyData.slotsShielded} slot{propertyData.slotsShielded !== 1 ? 's' : ''} protected from theft
                </div>
              </div>
              <div className="text-blue-300 text-xs">
                Protected
              </div>
            </div>
          )}

          {/* Action Sections */}
          {!connected ? (
            <div className="flex flex-col items-center py-8 space-y-4">
              <p className="text-purple-200 mb-2 text-center text-base">Connect your wallet to interact with this property</p>
              <StyledWalletButton variant="modal" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* All action sections are now separate components! */}
              <BuyPropertySection
                propertyId={propertyId}
                property={property}
                propertyData={propertyData}
                balance={balance}
                loading={loading}
                setLoading={setLoading}
                onClose={onClose}
              />
              
              <ShieldPropertySection
                propertyId={propertyId}
                property={property}
                propertyData={propertyData}
                balance={balance}
                loading={loading}
                setLoading={setLoading}
                onClose={onClose}
              />
              
              <SellPropertySection
                propertyId={propertyId}
                property={property}
                propertyData={propertyData}
                loading={loading}
                setLoading={setLoading}
                onClose={onClose}
              />
              
              <StealPropertySection
                propertyId={propertyId}
                property={property}
                propertyData={propertyData}
                balance={balance}
                loading={loading}
                setLoading={setLoading}
                onClose={onClose}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}