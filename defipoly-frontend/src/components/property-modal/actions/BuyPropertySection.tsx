// ============================================
// MIGRATED BuyPropertySection.tsx
// Now uses API-based useCooldowns hook instead of blockchain
// UI unchanged - only data fetching layer updated
// ============================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDefipoly } from '@/contexts/DefipolyContext';
import { useNotification } from '@/contexts/NotificationContext';
import { PROPERTIES, SET_BONUSES, TOKEN_TICKER } from '@/utils/constants';
import { CooldownExplanationModal } from '@/components/CooldownExplanationModal';
import { ChartIcon, CoinsIcon, CheckIcon, TargetIcon, WarningIcon } from '@/components/icons/UIIcons';
import { useGameState } from '@/contexts/GameStateContext';

interface BuyPropertySectionProps {
  propertyId: number;
  property: any;
  propertyData: any;
  balance: number;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onClose: () => void;
  isMobile?: boolean;
}

export function BuyPropertySection({
  propertyId,
  property,
  propertyData,
  balance,
  loading,
  setLoading,
  onClose,
  isMobile = false,
}: BuyPropertySectionProps) {
  const wallet = useWallet();
  const { buyProperty } = useDefipoly();
  const { showSuccess, showError, showInfo } = useNotification();
  const { 
    getOwnership, 
    isPropertyOnCooldown,   
    getSetCooldownRemaining, 
    getSetCooldown 
  } = useGameState(); 

  const [slotsToBuy, setSlotsToBuy] = useState(1);
  const [buyingProgress, setBuyingProgress] = useState('');
  const [setInfo, setSetInfo] = useState<{
    ownedPropertiesInSet: number[];
    hasCompleteSet: boolean;
  } | null>(null);
  const [showCooldownModal, setShowCooldownModal] = useState(false);

  
  const setId = property.setId;
  const isOnCooldown = isPropertyOnCooldown(propertyId);
  const cooldownRemaining = getSetCooldownRemaining(setId);
  const cooldownData = getSetCooldown(setId);
  const lastPurchasedPropertyId = cooldownData?.lastPurchasedPropertyId ?? null;

  const setBonusData = SET_BONUSES[property.setId.toString() as keyof typeof SET_BONUSES];
  const setBonusBps = setBonusData?.bps || 3000;
  const setBonusPercent = (setBonusBps / 100).toFixed(2);
  
  // Get cooldown duration in hours from cooldown data or property config
  const cooldownDurationHours = cooldownData?.cooldownDuration 
    ? Math.floor(cooldownData.cooldownDuration / 3600) 
    : (property.cooldown || 24);
  
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

  // Calculate max slots user can buy
  const maxSlotsToBuy = useMemo(() => {
    if (!property || !propertyData) return 1;
    
    // Get the max per player limit
    const maxPerPlayer = property.maxPerPlayer;
    const currentlyOwned = propertyData.owned || 0;
    const remainingAllowed = Math.max(0, maxPerPlayer - currentlyOwned);
    
    return Math.min(
      propertyData.availableSlots || 1,
      Math.floor(balance / property.price) || 1,
      remainingAllowed
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
          const ownership = getOwnership(prop.id);
          if (ownership && ownership.slotsOwned > 0) {
            owned.push(prop.id);
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
  }, [property, wallet, getOwnership]);

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

  // ✅ Calculate dailyIncome from price and yieldBps
  const dailyIncome = Math.floor((property.price * property.yieldBps) / 10000);
  const buyCost = property.price * slotsToBuy;
  const isThisPropertyBlocked = isOnCooldown && lastPurchasedPropertyId !== propertyId;
  const canBuy = balance >= buyCost;

  const missingProperties = useMemo(() => {
    if (!property || !setInfo) return [];
    
    const propertiesInSet = PROPERTIES.filter(p => p.setId === property.setId);
    return propertiesInSet
      .filter(p => !setInfo.ownedPropertiesInSet.includes(p.id))
      .map(p => p.name);
  }, [property, setInfo]);

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
      
      showSuccess(
        'Purchase Successful!',
        `Bought ${slotsToBuy} slot${slotsToBuy > 1 ? 's' : ''} of ${property.name}`,
        signature !== 'already-processed' ? signature : undefined
      );
      
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
      } else if (errorString.includes('insufficient funds')) {
        errorMessage = 'Insufficient balance';
      } else if (errorString.includes('User rejected') || errorString.includes('rejected the request')) {
        // Don't show error for user cancellation - just show info
        showInfo('Transaction Cancelled', 'Request rejected by user');
        return;
      }
      
      showError('Purchase Failed', errorMessage);
    } finally {
      setLoading(false);
      setBuyingProgress('');
    }
  };

  return (
    <>
      <div className={`space-y-2.5 ${
        isMobile 
          ? '' // No box styling on mobile
          : 'bg-purple-900/20 rounded-xl p-3 border border-purple-500/20'
      }`}>
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
              <input
                type="number"
                min="1"
                max={maxSlotsToBuy}
                value={slotsToBuy}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setSlotsToBuy(Math.min(Math.max(1, value), maxSlotsToBuy));
                }}
                disabled={loading || isThisPropertyBlocked}
                className="w-12 h-8 bg-purple-950/70 rounded text-white text-xl font-bold text-center border-none outline-none disabled:opacity-50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                style={{ 
                  MozAppearance: 'textfield',
                  WebkitAppearance: 'none',
                  margin: 0,
                }}
                onFocus={(e) => e.target.select()}
              />
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

        {/* Info Section */}
        <div className="space-y-1 mb-2.5">
          <div className="flex items-start gap-1.5 text-purple-200">
            <ChartIcon size={16} className="text-purple-400 mt-0.5" />
            <span className="text-xs leading-relaxed">
              Max per player: <span className="font-bold text-white">{property.maxPerPlayer}</span> slots • Can buy: <span className="font-bold text-white">{maxSlotsToBuy}</span>
            </span>
          </div>
          <div className="flex items-start gap-1.5 text-purple-200">
            <CoinsIcon size={16} className="text-purple-400 mt-0.5" />
            <span className="text-xs leading-relaxed">
              Daily income: <span className="font-bold text-white">+{boostedDailyIncome.toLocaleString()} ${TOKEN_TICKER}</span>
            </span>
          </div>
          
          {/* Set Bonus Info */}
          {!setBonusInfo.loading && (
            <>
              {setBonusInfo.hasCompleteSet ? (
                <div className="flex items-start gap-1.5 text-green-300">
                  <CheckIcon size={16} className="text-green-400 mt-0.5" />
                  <span className="text-xs leading-relaxed bg-green-900/20 rounded py-0.5 px-1.5">
                  Set bonus activated (+{(setBonusBps / 100).toFixed(2)}%)
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
                  Own: {missingProperties.join(', ')} for +{(setBonusBps / 100).toFixed(2)}%
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
        {/* Insufficient Balance Warning */}
        {!canBuy && !loading && (
          <div className="mt-2 flex items-center justify-center gap-1.5 text-red-400 text-xs">
            <WarningIcon size={14} className="text-red-400" />
            <span>
              Insufficient balance. Need <span className="font-bold">{buyCost.toLocaleString()}</span> $TOKEN
              {balance > 0 && (
                <span className="text-red-400/70"> (you have {balance.toLocaleString()})</span>
              )}
            </span>
          </div>
        )}
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