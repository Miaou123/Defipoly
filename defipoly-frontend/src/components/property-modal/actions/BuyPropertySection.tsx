// ============================================
// FILE: BuyPropertySection.tsx
// Refactored to match shield section design
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
  const isThisPropertyBlocked = isOnCooldown && lastPurchasedPropertyId !== propertyId;
  const canBuy = balance >= buyCost && !isThisPropertyBlocked;

  const boostedDailyIncome = (setBonusInfo.hasCompleteSet || setBonusInfo.willCompleteSet) 
    ? Math.floor(dailyIncome * 1.4 * slotsToBuy) 
    : dailyIncome * slotsToBuy;

  const handleBuy = async () => {
    if (!wallet || loading) return;
    
    if (isThisPropertyBlocked) {
      setShowCooldownModal(true);
      return;
    }

    setLoading(true);
    setBuyingProgress('');
    
    try {
      setBuyingProgress(`Buying ${slotsToBuy} slot${slotsToBuy > 1 ? 's' : ''}...`);
      const signature = await buyProperty(propertyId, slotsToBuy);
      
      if (signature) {
        showSuccess(
          'Property Purchased!',
          `Successfully bought ${slotsToBuy} slot${slotsToBuy > 1 ? 's' : ''} of ${property.name}!`,
          signature !== 'already-processed' ? signature : undefined
        );
        triggerRefresh();
        setTimeout(() => onClose(), 2000);
      }
    } catch (error: any) {
      console.error('Error buying property:', error);
      
      const errorString = error?.message || error?.toString() || '';
      let errorMessage = 'Failed to purchase property';
      
      if (errorString.includes('CooldownActive')) {
        errorMessage = 'Cooldown is still active. Please wait before purchasing.';
      } else if (errorString.includes('NoSlotsAvailable')) {
        errorMessage = 'No slots available for purchase';
      } else if (errorString.includes('insufficient funds')) {
        errorMessage = 'Insufficient DEFI balance';
      } else if (errorString.includes('MaxSlotsReached')) {
        errorMessage = 'Maximum slots per player reached';
      }
      
      showError('Purchase Failed', errorMessage);
    } finally {
      setLoading(false);
      setBuyingProgress('');
    }
  };

  return (
    <>
      <div className="mt-2 p-3 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl border border-purple-500/30">
        {/* Cooldown Warning */}
        {isThisPropertyBlocked && (
          <div className="mb-2.5 p-2 bg-orange-900/30 border border-orange-500/40 rounded-lg">
            <p className="text-xs text-orange-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Cooldown active: {formatCooldown(cooldownRemaining)}
            </p>
            <button
              onClick={() => setShowCooldownModal(true)}
              className="text-xs text-orange-200 underline hover:text-orange-100 mt-0.5"
            >
              Why is there a cooldown?
            </button>
          </div>
        )}

        {/* Header with Slots and Cost */}
        <div className="flex items-center justify-between mb-2.5">
          {/* Slots Control */}
          <div className="flex items-center gap-2">
            <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
              Slots
            </span>
            <div className="flex items-center gap-1.5 bg-purple-950/50 rounded-lg p-0.5 border border-purple-500/30">
              <button
                onClick={() => setSlotsToBuy(Math.max(1, slotsToBuy - 1))}
                disabled={slotsToBuy <= 1 || loading || isThisPropertyBlocked}
                className="w-8 h-8 flex items-center justify-center bg-purple-600/30 hover:bg-purple-600/50 disabled:bg-purple-900/20 disabled:text-purple-700 rounded text-white font-bold transition-all duration-200 active:scale-95 text-lg"
              >
                −
              </button>
              <div className="w-12 h-8 flex items-center justify-center bg-950/70 rounded">
                <span className="text-white text-xl font-bold">{slotsToBuy}</span>
              </div>
              <button
                onClick={() => setSlotsToBuy(Math.min(maxSlotsToBuy, slotsToBuy + 1))}
                disabled={slotsToBuy >= maxSlotsToBuy || loading || isThisPropertyBlocked}
                className="w-8 h-8 flex items-center justify-center bg-purple-600/30 hover:bg-purple-600/50 disabled:bg-purple-900/20 disabled:text-purple-700 rounded text-white font-bold transition-all duration-200 active:scale-95 text-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* Cost Display */}
          <div className="flex items-center gap-2">
            <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
              Cost
            </span>
            <span className="text-yellow-400 text-xl font-bold">
              {buyCost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Info Section - Compact */}
        <div className="space-y-1 mb-2.5">
          <div className="flex items-start gap-1.5 text-purple-200">
            <span className="text-sm">📊</span>
            <span className="text-xs leading-relaxed">
              Max: {maxSlotsToBuy} • Available: {propertyData?.availableSlots || 0}
            </span>
          </div>
          <div className="flex items-start gap-1.5 text-purple-200">
            <span className="text-sm">💰</span>
            <span className="text-xs leading-relaxed">
              Daily income: <span className="font-bold text-green-400">+{boostedDailyIncome.toLocaleString()} DEFI</span>
            </span>
          </div>
          
          {/* Set Bonus Info */}
          {!setBonusInfo.loading && (
            <>
              {setBonusInfo.hasCompleteSet ? (
                <div className="flex items-start gap-1.5 text-green-300">
                  <span className="text-sm">✅</span>
                  <span className="text-xs leading-relaxed bg-green-900/20 rounded py-0.5 px-1.5">
                    Set bonus activated (+40%)
                  </span>
                </div>
              ) : setBonusInfo.willCompleteSet ? (
                <div className="flex items-start gap-1.5 text-green-300">
                  <span className="text-sm">🎉</span>
                  <span className="text-xs leading-relaxed">
                    This completes your set!
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-1.5 text-purple-400">
                  <span className="text-sm">🎯</span>
                  <span className="text-xs leading-relaxed">
                    Own {setBonusInfo.ownedInSet}/{setBonusInfo.requiredProps} • Need {setBonusInfo.requiredProps - setBonusInfo.ownedInSet} more for +40%
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Button - More subtle */}
        <button
          onClick={handleBuy}
          disabled={loading || slotsToBuy < 1 || slotsToBuy > maxSlotsToBuy || !canBuy}
          className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${
            isThisPropertyBlocked
              ? 'bg-orange-600/40 hover:bg-orange-600/60 border border-orange-500/50 text-orange-100 cursor-pointer'
              : loading || slotsToBuy < 1 || slotsToBuy > maxSlotsToBuy || !canBuy
              ? 'bg-gray-800/30 cursor-not-allowed text-gray-500 border border-gray-700/30'
              : 'bg-emerald-600/40 hover:bg-emerald-600/60 border border-emerald-500/50 text-emerald-100 hover:border-emerald-400/70'
          }`}
        >
          {loading ? (
            buyingProgress || 'Processing...'
          ) : isThisPropertyBlocked ? (
            <>
              <Clock className="inline w-3.5 h-3.5 mr-1" />
              On Cooldown
            </>
          ) : (
            'Buy Slots'
          )}
        </button>
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