// ============================================
// FILE: defipoly-frontend/src/components/property-actions/BuyPropertySection.tsx
// Updated with optimized cooldown support
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { PROPERTIES } from '@/utils/constants';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from '@/contexts/NotificationContext';
import { usePropertyRefresh } from '@/contexts/PropertyRefreshContext';
import { useCooldown } from '@/hooks/useCooldown';
import { CooldownExplanationModal } from '../../CooldownExplanationModal';
import { Clock } from 'lucide-react';

interface BuyPropertySectionProps {
  propertyId: number;
  property: typeof PROPERTIES[0];
  propertyData: any;
  balance: number;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onClose: () => void;
}

export function BuyPropertySection({
  propertyId,
  property,
  propertyData,
  balance,
  loading,
  setLoading,
  onClose
}: BuyPropertySectionProps) {
  const wallet = useAnchorWallet();
  const { buyProperty, getOwnershipData } = useDefipoly();
  const { showSuccess, showError } = useNotification();
  const { triggerRefresh } = usePropertyRefresh();
  const { cooldownRemaining, isOnCooldown, affectedProperties, cooldownDurationHours, lastPurchasedPropertyId } = useCooldown(property.setId);

  const [slotsToBuy, setSlotsToBuy] = useState(1);
  const [buyingProgress, setBuyingProgress] = useState<string>('');
  const [showCooldownModal, setShowCooldownModal] = useState(false);
  const [setInfo, setSetInfo] = useState<{
    ownedPropertiesInSet: number[];
    hasCompleteSet: boolean;
  } | null>(null);

  // Format cooldown time
  const formatCooldown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Calculate max slots user can buy
  const maxSlotsToBuy = useMemo(() => {
    if (!property || !propertyData) return 1;
    
    return Math.min(
      propertyData.availableSlots || 1,
      Math.floor(balance / property.price) || 1,
      (propertyData.maxSlotsPerProperty || property.totalSlots) - (propertyData.owned || 0)
    );
  }, [property, propertyData, balance]);

  // Fetch set info
  useEffect(() => {
    if (!property || !wallet) return;
    
    const fetchSetInfo = async () => {
      try {
        const setId = property.setId;
        const propertiesInSet = PROPERTIES.filter(p => p.setId === setId);
        
        const owned: number[] = [];
        for (const prop of propertiesInSet) {
          try {
            const ownership = await getOwnershipData(prop.id);
            if (ownership && ownership.slotsOwned > 0) {
              owned.push(prop.id);
            }
          } catch {
            // Property not owned
          }
        }
        
        const requiredProps = setId === 0 || setId === 7 ? 2 : 3;
        setSetInfo({
          ownedPropertiesInSet: owned,
          hasCompleteSet: owned.length >= requiredProps
        });
      } catch (error) {
        console.error('Error fetching set info:', error);
      }
    };
    
    fetchSetInfo();
  }, [property, wallet, getOwnershipData]);

  // Calculate set bonus info
  const setBonusInfo = useMemo(() => {
    if (!property || !propertyData || !setInfo) {
      return {
        requiredProps: property?.setId === 0 || property?.setId === 7 ? 2 : 3,
        ownedInSet: 0,
        willCompleteSet: false,
        hasCompleteSet: false,
        loading: true
      };
    }
    
    const setId = property.setId;
    const requiredProps = setId === 0 || setId === 7 ? 2 : 3;
    const ownedInSet = setInfo.ownedPropertiesInSet.length;
    const alreadyOwned = setInfo.ownedPropertiesInSet.includes(propertyId);
    const willCompleteSet = !setInfo.hasCompleteSet && 
                            (alreadyOwned ? ownedInSet >= requiredProps : ownedInSet + 1 >= requiredProps);
    
    return {
      requiredProps,
      ownedInSet,
      willCompleteSet,
      hasCompleteSet: setInfo.hasCompleteSet,
      loading: false
    };
  }, [property, propertyData, setInfo, propertyId]);

  const dailyIncome = property.dailyIncome;
  const buyCost = property.price * slotsToBuy;
  // FIXED: Only block if cooldown is active AND trying to buy a different property
  const isThisPropertyBlocked = isOnCooldown && lastPurchasedPropertyId !== propertyId;
  const canBuy = balance >= buyCost && !isThisPropertyBlocked;

  const handleBuy = async () => {
    if (!wallet || loading) return;
    
    // FIXED: Show modal if THIS specific property is blocked
    if (isThisPropertyBlocked) {
      setShowCooldownModal(true);
      return;
    }

    setLoading(true);
    setBuyingProgress('');
    
    try {
      setBuyingProgress(`Buying ${slotsToBuy} slot${slotsToBuy > 1 ? 's' : ''}...`);
      
      const signature = await buyProperty(propertyId, slotsToBuy);
      
      showSuccess(
        'Purchase Successful!',
        `Bought ${slotsToBuy} slot${slotsToBuy > 1 ? 's' : ''} of ${property.name}`,
        signature !== 'already-processed' ? signature : undefined
      );
      
      triggerRefresh(); // This will auto-refresh cooldowns!
      setTimeout(() => onClose(), 2000);

    } catch (error: any) {
      console.error('Error buying property:', error);
      
      let errorMessage = 'Failed to buy slots';
      const errorString = error?.message || error?.toString() || '';
      
      if (errorString.includes('CooldownActive')) {
        errorMessage = `Set cooldown active. Wait ${formatCooldown(cooldownRemaining)} before buying from this set.`;
        setShowCooldownModal(true);
      } else if (errorString.includes('MaxSlotsReached')) {
        errorMessage = `Cannot buy ${slotsToBuy} slots - would exceed maximum allowed`;
      } else if (errorString.includes('NoSlotsAvailable')) {
        errorMessage = `Only ${propertyData?.availableSlots} slot${propertyData?.availableSlots === 1 ? '' : 's'} available`;
      } else if (errorString.includes('insufficient')) {
        errorMessage = 'Insufficient balance';
      } else if (errorString.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled';
      }
      
      showError('Purchase Failed', errorMessage);
    } finally {
      setLoading(false);
      setBuyingProgress('');
    }
  };

  if (!propertyData || propertyData.owned >= propertyData.maxSlotsPerProperty) return null;

  return (
    <>
      <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/20 space-y-3">
        {/* FIXED: Only show cooldown warning if THIS property is blocked */}
        {isThisPropertyBlocked && (
          <div className="bg-orange-900/30 rounded-lg p-3 border border-orange-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-orange-200">Set Cooldown Active</span>
            </div>
            <p className="text-xs text-orange-300 mb-2">
              You must wait <span className="font-bold">{formatCooldown(cooldownRemaining)}</span> before buying another property from this set.
            </p>
            <button
              onClick={() => setShowCooldownModal(true)}
              className="text-xs text-orange-200 underline hover:text-orange-100"
            >
              Why is there a cooldown?
            </button>
          </div>
        )}

        {/* Slot selector */}
        <div>
          <label className="block text-xs text-purple-300 mb-2 font-semibold">
            Number of slots to buy:
          </label>
          <input
            type="number"
            min="1"
            max={maxSlotsToBuy}
            value={slotsToBuy}
            onChange={(e) => setSlotsToBuy(Math.min(maxSlotsToBuy, Math.max(1, parseInt(e.target.value) || 1)))}
            disabled={loading || isThisPropertyBlocked}
            className="w-full px-3 py-2 bg-purple-950/50 border border-purple-500/30 rounded-lg text-purple-100 text-sm focus:outline-none focus:border-purple-400/50 disabled:opacity-50"
          />
          <div className="text-xs text-purple-400 mt-1">
            Max: {maxSlotsToBuy} slots • Available: {propertyData?.availableSlots || 0}
          </div>
        </div>

        {/* Purchase info */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-purple-300">Cost:</span>
            <span className="font-bold text-purple-100">{buyCost.toLocaleString()} DEFI</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-purple-300">Daily Income:</span>
            <span className="font-bold text-green-400">
              +{((setBonusInfo.hasCompleteSet || setBonusInfo.willCompleteSet) 
                ? Math.floor(dailyIncome * 1.4 * slotsToBuy) 
                : dailyIncome * slotsToBuy
              ).toLocaleString()} DEFI
            </span>
          </div>
          
          {!setBonusInfo.loading && (
            <>
              {setBonusInfo.hasCompleteSet ? (
                <div className="text-xs text-green-300 mt-2 text-center bg-green-900/20 rounded py-1 px-2">
                  ✅ Set bonus activated (+40%)
                </div>
              ) : setBonusInfo.willCompleteSet ? (
                <div className="text-xs text-green-300 mt-2 text-center">
                  🎉 This completes your set!
                </div>
              ) : (
                <div className="text-xs text-purple-400 mt-2 text-center">
                  Own {setBonusInfo.ownedInSet}/{setBonusInfo.requiredProps} • Need {setBonusInfo.requiredProps - setBonusInfo.ownedInSet} more for +40%
                </div>
              )}
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleBuy}
            disabled={loading || slotsToBuy < 1 || slotsToBuy > maxSlotsToBuy || !canBuy}
            className={`flex-1 py-2.5 rounded-lg font-black text-base transition-all ${
              isThisPropertyBlocked
                ? 'bg-gradient-to-r from-orange-800 to-orange-900 hover:from-orange-700 hover:to-orange-800 text-orange-200 shadow-lg cursor-pointer'
                : loading || slotsToBuy < 1 || slotsToBuy > maxSlotsToBuy || !canBuy
                ? 'bg-gray-800/50 cursor-not-allowed text-gray-500'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-green-500/50'
            }`}
          >
            {loading ? (
              buyingProgress || 'Processing...'
            ) : isThisPropertyBlocked ? (
              <>
                <Clock className="inline w-4 h-4 mr-1" />
                On Cooldown
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>

      {/* Cooldown Explanation Modal */}
      {showCooldownModal && (
        <CooldownExplanationModal
          onClose={() => setShowCooldownModal(false)}
          cooldownHours={cooldownDurationHours} 
          affectedProperties={affectedProperties.map(p => p.name)}
        />
      )}
    </>
  );
}