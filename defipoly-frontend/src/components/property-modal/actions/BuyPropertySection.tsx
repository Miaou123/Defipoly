// ============================================
// MIGRATED BuyPropertySection.tsx
// Now uses useCooldowns from API instead of blockchain
// ============================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { usePropertyRefresh } from '@/contexts/PropertyRefreshContext';
import { useCooldowns } from '@/hooks/useCooldowns'; // ✅ NEW
import { useNotification } from '@/contexts/NotificationContext';
import { PROPERTIES } from '@/utils/constants';
import { CooldownExplanationModal } from '@/components/CooldownExplanationModal';
import { ChartIcon, CoinsIcon, CheckIcon, TargetIcon } from '@/components/icons/UIIcons';

interface BuyPropertySectionProps {
  propertyId: number;
  property: any;
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
  onClose,
}: BuyPropertySectionProps) {
  const wallet = useWallet();
  const { buyProperty, getOwnershipData } = useDefipoly();
  const { triggerRefresh } = usePropertyRefresh();
  const { showSuccess } = useNotification();
  
  const [slotsToBuy, setSlotsToBuy] = useState(1);
  const [buyingProgress, setBuyingProgress] = useState('');
  const [setInfo, setSetInfo] = useState<{
    ownedPropertiesInSet: number[];
    hasCompleteSet: boolean;
  } | null>(null);
  const [showCooldownModal, setShowCooldownModal] = useState(false);

  // ✅ NEW: Use API-based cooldowns hook
  const { 
    isSetOnCooldown, 
    getSetCooldownRemaining,
    getSetCooldown 
  } = useCooldowns();
  
  const setId = property.setId;
  const isOnCooldown = isSetOnCooldown(setId);
  const cooldownRemaining = getSetCooldownRemaining(setId);
  const cooldownData = getSetCooldown(setId);
  const lastPurchasedPropertyId = cooldownData?.last_purchased_property_id ?? null;
  
  // Get cooldown duration in hours from property config
  const cooldownDurationHours = property.cooldown || 24;
  
  // Get properties in this set for display
  const affectedProperties = PROPERTIES.filter(p => p.setId === setId);

  const formatCooldown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const isThisPropertyBlocked = isOnCooldown && lastPurchasedPropertyId !== propertyId;

  // Calculate costs and limits
  const pricePerSlot = property.price;
  const totalCost = pricePerSlot * slotsToBuy;
  const maxSlotsAvailable = propertyData?.availableSlots || 0;
  const currentlyOwned = propertyData?.owned || 0;
  const maxPerPlayer = propertyData?.maxPerPlayer || property.maxPerPlayer;
  const maxSlotsToBuy = Math.min(maxSlotsAvailable, maxPerPlayer - currentlyOwned);

  const canBuy = balance >= totalCost && slotsToBuy >= 1 && slotsToBuy <= maxSlotsToBuy;

  // Calculate daily income (price * yieldBps / 10000)
  const dailyIncomePerSlot = Math.floor((property.price * property.yieldBps) / 10000);
  const totalDailyIncome = dailyIncomePerSlot * slotsToBuy;

  // Fetch set completion info
  useEffect(() => {
    if (!wallet.publicKey) return;

    const fetchSetInfo = async () => {
      try {
        const propertiesInSet = PROPERTIES.filter(p => p.setId === property.setId);
        const ownedInSet: number[] = [];

        for (const prop of propertiesInSet) {
          const ownership = await getOwnershipData(prop.id);
          if (ownership && ownership.slotsOwned > 0) {
            ownedInSet.push(prop.id);
          }
        }

        // Determine if buying this property would complete the set
        const requiredProps = property.setId === 0 || property.setId === 7 ? 2 : 3;
        const hasOwnership = ownedInSet.includes(propertyId);
        const hasCompleteSet = ownedInSet.length >= requiredProps;
        const willCompleteSet = !hasOwnership && (ownedInSet.length + 1) >= requiredProps;

        setSetInfo({
          ownedPropertiesInSet: ownedInSet,
          hasCompleteSet: hasCompleteSet || willCompleteSet
        });
      } catch (error) {
        console.error('Error fetching set info:', error);
      }
    };

    fetchSetInfo();
  }, [wallet.publicKey, property.setId, propertyId, getOwnershipData]);

  const handleBuy = async () => {
    if (!canBuy || loading) return;

    if (isThisPropertyBlocked) {
      setShowCooldownModal(true);
      return;
    }

    setLoading(true);
    setBuyingProgress('Preparing transaction...');

    try {
      setBuyingProgress('Awaiting confirmation...');
      const signature = await buyProperty(propertyId, slotsToBuy);

      setBuyingProgress('Transaction confirmed!');
      showSuccess(
        'Purchase Successful',
        `Successfully bought ${slotsToBuy} slot${slotsToBuy > 1 ? 's' : ''}!`,
        signature // signature is already a string
      );

      setTimeout(() => {
        triggerRefresh();
        onClose();
      }, 500);
    } catch (error: any) {
      console.error('Error buying property:', error);
      setBuyingProgress('');
    } finally {
      setLoading(false);
    }
  };

  // Set bonus info
  const setBonusInfo = useMemo(() => {
    if (!setInfo) return null;

    const propertiesInSet = PROPERTIES.filter(p => p.setId === property.setId);
    const requiredProps = property.setId === 0 || property.setId === 7 ? 2 : 3;
    const ownedInSet = setInfo.ownedPropertiesInSet.length;
    const hasOwnership = setInfo.ownedPropertiesInSet.includes(propertyId);
    const hasCompleteSet = setInfo.hasCompleteSet;
    const willCompleteSet = !hasOwnership && (ownedInSet + 1) >= requiredProps;

    return {
      requiredProps,
      ownedInSet,
      hasCompleteSet,
      willCompleteSet
    };
  }, [setInfo, property.setId, propertyId]);

  return (
    <>
      <div className="space-y-4">
        {/* Slot selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-purple-200">Slots to Buy</label>
            <span className="text-xs text-purple-400">
              Max: {maxSlotsToBuy} • Available: {maxSlotsAvailable}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSlotsToBuy(Math.max(1, slotsToBuy - 1))}
              disabled={slotsToBuy <= 1}
              className="px-3 py-2 bg-purple-800/40 hover:bg-purple-700/60 disabled:bg-gray-800/30 disabled:cursor-not-allowed rounded-lg text-purple-100 disabled:text-gray-600 transition-all"
            >
              -
            </button>
            <input
              type="number"
              value={slotsToBuy}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setSlotsToBuy(Math.min(maxSlotsToBuy, Math.max(1, val)));
              }}
              className="flex-1 bg-purple-950/50 border border-purple-500/30 rounded-lg px-4 py-2 text-center text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              min={1}
              max={maxSlotsToBuy}
            />
            <button
              onClick={() => setSlotsToBuy(Math.min(maxSlotsToBuy, slotsToBuy + 1))}
              disabled={slotsToBuy >= maxSlotsToBuy}
              className="px-3 py-2 bg-purple-800/40 hover:bg-purple-700/60 disabled:bg-gray-800/30 disabled:cursor-not-allowed rounded-lg text-purple-100 disabled:text-gray-600 transition-all"
            >
              +
            </button>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="bg-purple-950/30 rounded-lg p-3 space-y-2 border border-purple-500/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-300">Price per slot:</span>
            <span className="font-semibold text-purple-100">${pricePerSlot.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-300">Daily income:</span>
            <div className="flex items-center gap-1">
              <ChartIcon size={14} className="text-green-400" />
              <span className="font-semibold text-green-400">+${totalDailyIncome.toLocaleString()}</span>
            </div>
          </div>
          <div className="h-px bg-purple-500/20" />
          <div className="flex items-center justify-between">
            <span className="font-semibold text-purple-200">Total Cost:</span>
            <div className="flex items-center gap-1.5">
              <CoinsIcon size={16} className="text-yellow-400" />
              <span className="text-lg font-bold text-yellow-400">${totalCost.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Set bonus indicator */}
        <div className="bg-purple-950/30 rounded-lg p-3 border border-purple-500/20">
          {setBonusInfo && (
            <>
              {setBonusInfo.hasCompleteSet ? (
                <div className="flex items-start gap-1.5 text-green-300">
                  <CheckIcon size={16} className="text-green-400 mt-0.5" />
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
                  <TargetIcon size={16} className="text-purple-400 mt-0.5" />
                  <span className="text-xs leading-relaxed">
                    Own {setBonusInfo.ownedInSet}/{setBonusInfo.requiredProps} • Need {setBonusInfo.requiredProps - setBonusInfo.ownedInSet} more for +40%
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Button */}
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
              On Cooldown ({formatCooldown(cooldownRemaining)})
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