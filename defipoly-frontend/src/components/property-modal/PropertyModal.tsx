// ============================================
// MIGRATED PropertyModal.tsx
// Now uses API hooks instead of RPC calls
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
import {
  BuyPropertyExplanationModal,
  SellPropertyExplanationModal,
  ShieldPropertyExplanationModal,
  StealPropertyExplanationModal
} from '../MechanicsExplanationModals';
// ✅ NEW: Import API hooks
import { useOwnership } from '@/hooks/useOwnership';
import { usePropertyState } from '@/hooks/usePropertyState';

interface PropertyModalProps {
  propertyId: number | null;
  onClose: () => void;
}

type HelpModalType = 'buy' | 'shield' | 'sell' | 'steal' | null;

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
  const { program } = useDefipoly(); // Still need program for transactions
  const wallet = useAnchorWallet();
  const property = propertyId !== null ? PROPERTIES.find(p => p.id === propertyId) : null;
  const { balance } = useTokenBalance();
  
  // ✅ NEW: Use API hooks instead of RPC
  const { ownerships, getOwnership } = useOwnership();
  const { getAvailableSlots } = usePropertyState();
  
  const [loading, setLoading] = useState(false);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [showHelpModal, setShowHelpModal] = useState<HelpModalType>(null);
  const [setBonusInfo, setSetBonusInfo] = useState<{
    hasCompleteSet: boolean;
    boostedSlots: number;
    totalSlots: number;
  } | null>(null);
  
  // ✅ NEW: Fetch property and ownership data from API
  useEffect(() => {
    if (propertyId === null || !connected) {
      setPropertyData(null);
      return;
    }

    try {
      // Get ownership data from API hook
      const ownershipData = wallet ? getOwnership(propertyId) : null;
      
      // Get available slots from API hook
      const availableSlots = getAvailableSlots(propertyId);
      
      // Get property config from constants
      const propertyConfig = PROPERTIES.find(p => p.id === propertyId);
      
      if (propertyConfig) {
        const now = Date.now() / 1000;
        const shieldActive = ownershipData 
          ? (ownershipData.slotsShielded > 0 && ownershipData.shieldExpiry.toNumber() > now)
          : false;

        setPropertyData({
          availableSlots: availableSlots,
          maxSlotsPerProperty: propertyConfig.maxSlots,
          maxPerPlayer: propertyConfig.maxPerPlayer,
          owned: ownershipData?.slotsOwned || 0,
          slotsShielded: ownershipData?.slotsShielded || 0,
          shieldActive,
          shieldExpiry: ownershipData?.shieldExpiry,
          shieldCooldownDuration: ownershipData?.shieldCooldownDuration,
          purchaseTimestamp: ownershipData?.purchaseTimestamp,
          stealProtectionExpiry: ownershipData?.stealProtectionExpiry,
          yieldPercentBps: propertyConfig.yieldBps,
          shieldCostPercentBps: propertyConfig.shieldCostBps,
        });
      }
    } catch (error) {
      console.error('Error fetching property data:', error);
    }
  }, [propertyId, connected, wallet, ownerships, getOwnership, getAvailableSlots]);

  // Fetch set bonus info
  useEffect(() => {
    const fetchSetBonusInfo = async () => {
      if (!connected || !wallet || !propertyData || propertyData.owned === 0 || !property) {
        setSetBonusInfo(null);
        return;
      }

      try {
        const setId = property.setId;
        const propertiesInSet = PROPERTIES.filter(p => p.setId === setId);
        const requiredProps = setId === 0 || setId === 7 ? 2 : 3;

        // Count owned properties in this set using API data
        const ownedInSet = ownerships.filter(o => 
          propertiesInSet.some(p => p.id === o.propertyId) && o.slotsOwned > 0
        );

        const hasCompleteSet = ownedInSet.length >= requiredProps;
        
        if (hasCompleteSet) {
          // Calculate boosted slots
          const totalSlotsInSet = ownedInSet.reduce((sum, o) => sum + o.slotsOwned, 0);
          const setBonus = SET_BONUSES[setId.toString() as keyof typeof SET_BONUSES];
          const bonusBps = setBonus?.bps || 0;
          const boostedSlots = Math.floor((totalSlotsInSet * bonusBps) / 10000);

          setSetBonusInfo({
            hasCompleteSet: true,
            boostedSlots,
            totalSlots: totalSlotsInSet
          });
        } else {
          setSetBonusInfo(null);
        }
      } catch (error) {
        console.error('Error fetching set bonus info:', error);
        setSetBonusInfo(null);
      }
    };

    fetchSetBonusInfo();
  }, [connected, wallet, propertyData, property, ownerships]);

  if (!property) return null;

  const colorHex = getColorFromClass(property.color);

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div 
          className="bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          style={{
            boxShadow: `0 0 60px ${colorHex}40, 0 0 120px ${colorHex}20`
          }}
        >
          {/* Header */}
          <div 
            className="sticky top-0 z-10 p-6 border-b border-purple-500/30 backdrop-blur-xl"
            style={{
              background: `linear-gradient(135deg, ${colorHex}20, ${colorHex}10)`
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-3 h-8 rounded"
                    style={{ backgroundColor: colorHex }}
                  />
                  <h2 className="text-2xl font-bold text-white">
                    {property.name}
                  </h2>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-purple-300">
                    Price: <span className="font-semibold text-yellow-400">${property.price.toLocaleString()}</span>
                  </span>
                  <span className="text-purple-300">
                    Yield: <span className="font-semibold text-green-400">{(property.yieldBps / 100).toFixed(1)}%</span>
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-purple-300 hover:text-white transition-colors hover:bg-purple-800/50 rounded-lg p-2"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Property Card Preview */}
          <div className="p-6">
            <div className="mb-6">
              <div className="aspect-[3/4] max-w-[200px] mx-auto">
                <PropertyCard
                  propertyId={property.id}
                  onSelect={() => {}}
                />
              </div>
            </div>

            {/* Property Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-purple-950/50 rounded-lg p-3 border border-purple-500/20">
                <div className="text-xs text-purple-400 mb-1">Available</div>
                <div className="text-xl font-bold text-purple-100">
                  {propertyData?.availableSlots !== undefined ? propertyData.availableSlots : '...'}
                </div>
              </div>
              <div className="bg-purple-950/50 rounded-lg p-3 border border-purple-500/20">
                <div className="text-xs text-purple-400 mb-1">You Own</div>
                <div className="text-xl font-bold text-green-400">
                  {propertyData?.owned || 0}
                </div>
              </div>
            </div>

            {/* Set Bonus Badge */}
            {setBonusInfo?.hasCompleteSet && (
              <div className="mb-6 bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-lg p-3 border border-green-500/30">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <div>
                    <div className="text-sm font-semibold text-green-300">Complete Set Bonus Active!</div>
                    <div className="text-xs text-green-400">
                      +{setBonusInfo.boostedSlots} bonus slots ({((setBonusInfo.boostedSlots / setBonusInfo.totalSlots) * 100).toFixed(0)}% boost)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!connected ? (
              <div className="bg-purple-950/30 rounded-lg p-6 text-center border border-purple-500/20">
                <p className="text-purple-300 mb-4">Connect your wallet to interact with this property</p>
                <StyledWalletButton />
              </div>
            ) : (
              <PropertyActionsBar
                propertyId={property.id}
                property={property}
                propertyData={propertyData}
                balance={balance}
                loading={loading}
                setLoading={setLoading}
                onClose={onClose}
                onOpenHelp={setShowHelpModal}
              />
            )}
          </div>
        </div>
      </div>

      {/* Help Modals */}
      {showHelpModal === 'buy' && (
        <BuyPropertyExplanationModal
          onClose={() => setShowHelpModal(null)}
          onProceed={() => setShowHelpModal(null)}
        />
      )}
      {showHelpModal === 'shield' && (
        <ShieldPropertyExplanationModal
          onClose={() => setShowHelpModal(null)}
          onProceed={() => setShowHelpModal(null)}
        />
      )}
      {showHelpModal === 'sell' && (
        <SellPropertyExplanationModal
          onClose={() => setShowHelpModal(null)}
          onProceed={() => setShowHelpModal(null)}
        />
      )}
      {showHelpModal === 'steal' && (
        <StealPropertyExplanationModal
          onClose={() => setShowHelpModal(null)}
          onProceed={() => setShowHelpModal(null)}
        />
      )}
    </>
  );
}