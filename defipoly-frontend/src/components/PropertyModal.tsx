// ============================================
// FILE: defipoly-frontend/src/components/PropertyModal.tsx
// With Set Bonus Display
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { PROPERTIES } from '@/utils/constants';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { StyledWalletButton } from './StyledWalletButton';
import { X } from 'lucide-react';
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
  const propertyColor = getColorFromClass(property.color);

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
          {/* Property Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-purple-900/20 backdrop-blur rounded-xl p-3 border border-purple-500/20">
              <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">Price/Slot</div>
              <div className="text-lg font-black text-purple-100">{property.price.toLocaleString()}</div>
            </div>
            <div className="bg-purple-900/20 backdrop-blur rounded-xl p-3 border border-purple-500/20">
              <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">Daily Income</div>
              <div className="text-lg font-black text-green-400">{dailyIncome.toLocaleString()}</div>
            </div>
            <div className="bg-purple-900/20 backdrop-blur rounded-xl p-3 border border-purple-500/20">
              <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">Available</div>
              <div className="text-lg font-black text-blue-400">
                {propertyData?.availableSlots ?? '...'}
              </div>
            </div>
          </div>

          {/* Ownership Info */}
          {connected && propertyData && propertyData.owned > 0 && (
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur rounded-xl p-4 border border-purple-500/30">
              <h3 className="font-black text-base text-purple-100 mb-3">Your Ownership</h3>
              <div className="space-y-2 text-sm">
                {/* Slots Owned with Boosted Badge */}
                <div className="flex justify-between items-center">
                  <span className="text-purple-300">Slots Owned:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-purple-100 text-lg">{propertyData.owned}</span>
                    {setBonusInfo?.hasCompleteSet && setBonusInfo.boostedSlots > 0 && (
                      <span 
                        className="text-white text-xs font-bold px-2.5 py-1 rounded-xl"
                        style={{ backgroundColor: propertyColor }}
                      >
                        {setBonusInfo.boostedSlots} boosted
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Daily Income with Breakdown */}
                <div className="flex justify-between items-start">
                  <span className="text-purple-300 pt-1">Daily Income:</span>
                  <div className="flex flex-col items-end gap-0.5">
                    {setBonusInfo?.hasCompleteSet && setBonusInfo.boostedSlots > 0 ? (
                      <>
                        {/* Boosted slots income */}
                        <div 
                          className="text-sm"
                          style={{ color: propertyColor }}
                        >
                          {setBonusInfo.boostedSlots} slot{setBonusInfo.boostedSlots > 1 ? 's' : ''} × {(dailyIncome * 1.4).toLocaleString()}
                        </div>
                        
                        {/* Regular slots income (if any) */}
                        {(propertyData.owned - setBonusInfo.boostedSlots) > 0 && (
                          <div className="text-sm text-purple-300/70">
                            {propertyData.owned - setBonusInfo.boostedSlots} slot{(propertyData.owned - setBonusInfo.boostedSlots) > 1 ? 's' : ''} × {dailyIncome.toLocaleString()}
                          </div>
                        )}
                        
                        {/* Total */}
                        <div className="font-bold text-white text-lg border-t border-purple-500/20 pt-1 mt-0.5 w-full text-right">
                          {(
                            (setBonusInfo.boostedSlots * dailyIncome * 1.4) + 
                            ((propertyData.owned - setBonusInfo.boostedSlots) * dailyIncome)
                          ).toLocaleString()} DEFI
                        </div>
                      </>
                    ) : (
                      <span className="font-bold text-green-400 text-lg">
                        +{(dailyIncome * propertyData.owned).toLocaleString()} DEFI
                      </span>
                    )}
                  </div>
                </div>
                
                {propertyData.shieldActive && (
                  <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-green-400 font-bold text-xs">🛡️ Shield Active</span>
                      <span className="text-green-300 text-xs">{propertyData.slotsShielded} slots</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
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