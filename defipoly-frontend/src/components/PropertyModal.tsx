// ============================================
// FILE: defipoly-frontend/src/components/PropertyModal.tsx
// SIMPLIFIED VERSION - Now much cleaner!
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

export function PropertyModal({ propertyId, onClose }: PropertyModalProps) {
  const { connected } = useWallet();
  const { getPropertyData, getOwnershipData, program } = useDefipoly();
  const wallet = useAnchorWallet();
  const property = propertyId !== null ? PROPERTIES.find(p => p.id === propertyId) : null;
  const { balance } = useTokenBalance();
  
  const [loading, setLoading] = useState(false);
  const [propertyData, setPropertyData] = useState<any>(null);
  
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

  if (!property || propertyId === null) return null;

  const dailyIncome = property.dailyIncome;

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
              <h3 className="font-black text-base text-purple-100 mb-2">Your Ownership</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-purple-300">Slots Owned:</span>
                  <span className="font-bold text-purple-100 text-base">{propertyData.owned}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-300">Daily Income:</span>
                  <span className="font-bold text-green-400 text-base">
                    +{(dailyIncome * propertyData.owned).toLocaleString()} DEFI
                  </span>
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