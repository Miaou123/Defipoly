// ============================================
// FILE: defipoly-frontend/src/components/property-actions/BuyPropertySection.tsx
// Compact buy property component
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { PROPERTIES } from '@/utils/constants';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from '../NotificationProvider';
import { usePropertyRefresh } from '../PropertyRefreshContext';

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
  
  const [showBuyOptions, setShowBuyOptions] = useState(false);
  const [slotsToBuy, setSlotsToBuy] = useState(1);
  const [buyingProgress, setBuyingProgress] = useState<string>('');
  const [setInfo, setSetInfo] = useState<{
    ownedPropertiesInSet: number[];
    hasCompleteSet: boolean;
  } | null>(null);

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
  const canBuy = balance >= buyCost;

  const handleBuy = async () => {
    if (!wallet || loading) return;

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
      
      triggerRefresh();
      setTimeout(() => onClose(), 2000);

    } catch (error: any) {
      console.error('Error buying property:', error);
      
      let errorMessage = 'Failed to buy slots';
      const errorString = error?.message || error?.toString() || '';
      
      if (errorString.includes('MaxSlotsReached')) {
        errorMessage = `Cannot buy ${slotsToBuy} slots - would exceed maximum allowed`;
      } else if (errorString.includes('NoSlotsAvailable')) {
        errorMessage = `Only ${propertyData?.availableSlots} slot${propertyData?.availableSlots === 1 ? '' : 's'} available`;
      } else if (errorString.includes('CooldownActive')) {
        errorMessage = 'Cooldown period active';
      } else if (errorString.includes('InvalidSlotAmount')) {
        errorMessage = 'Must select at least 1 slot';
      }
      
      showError('Purchase Failed', errorMessage);
    } finally {
      setLoading(false);
      setBuyingProgress('');
    }
  };

  if (!showBuyOptions) {
    return (
      <button
        onClick={() => setShowBuyOptions(true)}
        disabled={loading || maxSlotsToBuy === 0}
        className={`w-full py-3 rounded-xl font-bold text-base transition-all shadow-lg ${
          loading
            ? 'bg-purple-900/30 cursor-wait text-purple-400 border border-purple-700/30'
            : maxSlotsToBuy === 0
              ? 'bg-purple-900/30 cursor-not-allowed text-purple-500 border border-purple-700/30' 
              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border border-green-400/30 hover:shadow-green-500/50 hover:scale-[1.02]'
        }`}
      >
        {loading ? '⏳ Processing...' : '🏠 Buy Slots'}
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-xl rounded-xl p-4 border-2 border-purple-500/40 space-y-3">
      <h4 className="font-black text-lg text-purple-100 flex items-center gap-2">
        <span className="text-xl">💰</span> Purchase Slots
      </h4>
      
      {/* Inline Calculator (Most Compact) */}
      <div className="bg-black/30 rounded-lg p-3 border border-purple-500/20">
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-purple-300">Number of Slots:</span>
            <span className="text-xs text-purple-400/60">(1-{maxSlotsToBuy})</span>
          </div>
          <style>{`
            input[type="number"]::-webkit-inner-spin-button,
            input[type="number"]::-webkit-outer-spin-button {
              opacity: 1;
              cursor: pointer;
              background: rgba(168, 85, 247, 0.3);
              border-radius: 4px;
              margin-left: 4px;
            }
            input[type="number"]::-webkit-inner-spin-button:hover,
            input[type="number"]::-webkit-outer-spin-button:hover {
              background: rgba(168, 85, 247, 0.6);
            }
          `}</style>
          <input
            type="number"
            min="1"
            max={maxSlotsToBuy}
            value={slotsToBuy}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              const clamped = Math.max(1, Math.min(value, maxSlotsToBuy));
              setSlotsToBuy(clamped);
            }}
            className="w-20 px-2 py-1 bg-purple-950/60 border-2 border-purple-500/40 rounded-lg text-purple-100 font-bold text-base text-center focus:outline-none focus:border-purple-400"
          />
        </div>
        <div className="flex justify-between items-center py-1.5 text-sm border-t border-purple-500/10">
          <span className="text-purple-300">Price per Slot:</span>
          <span className="font-bold text-purple-100">{property.price.toLocaleString()} DEFI</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-purple-500/20">
          <span className="text-purple-300 font-bold">Total Cost:</span>
          <span className="font-black text-lg text-purple-100">{buyCost.toLocaleString()} DEFI</span>
        </div>
      </div>

      {/* Compact Income - Option 1 Style */}
      <div className="bg-black/30 rounded-lg p-2.5 border border-purple-500/20">
        <div className="text-xs text-purple-300 mb-2">Daily Income</div>
        {setBonusInfo.loading ? (
          <div className="text-xs text-purple-400 animate-pulse">Loading...</div>
        ) : (
          <>
            <div className="flex gap-2 items-center">
              {/* Base/Current - HIGHLIGHTED when no bonus */}
              <div className={`flex-1 rounded p-2 border-2 ${
                !setBonusInfo.hasCompleteSet
                  ? 'bg-gradient-to-br from-purple-600/20 to-purple-700/20 border-purple-400/50'
                  : 'bg-purple-950/30 border-purple-700/20'
              }`}>
                <div className={`text-xs mb-0.5 ${!setBonusInfo.hasCompleteSet ? 'text-purple-300 font-semibold' : 'text-purple-400 opacity-60'}`}>
                  {setBonusInfo.hasCompleteSet ? 'Base' : 'Current'}
                </div>
                <div className={`text-base font-black ${!setBonusInfo.hasCompleteSet ? 'text-purple-200' : 'text-purple-400 opacity-60'}`}>
                  +{(dailyIncome * slotsToBuy).toLocaleString()}
                </div>
              </div>
              
              {/* Arrow */}
              <div className={`text-xl ${setBonusInfo.hasCompleteSet ? 'text-green-400' : 'text-purple-400'}`}>
                →
              </div>
              
              {/* With Bonus - HIGHLIGHTED when bonus active */}
              <div className={`flex-1 rounded p-2 border-2 ${
                setBonusInfo.hasCompleteSet
                  ? 'bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-400/50'
                  : 'bg-purple-950/30 border-purple-700/20'
              }`}>
                <div className={`text-xs mb-0.5 ${setBonusInfo.hasCompleteSet ? 'text-green-300 font-semibold' : 'text-purple-400 opacity-60'}`}>
                  {setBonusInfo.hasCompleteSet ? 'Your Income' : 'With Bonus'}
                </div>
                <div className={`text-base font-black ${setBonusInfo.hasCompleteSet ? 'text-green-300' : 'text-purple-400 opacity-60'}`}>
                  +{Math.round((dailyIncome * slotsToBuy) * 1.4).toLocaleString()}
                </div>
              </div>
            </div>
            
            {/* Info text */}
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
          disabled={loading || !canBuy || slotsToBuy < 1 || slotsToBuy > maxSlotsToBuy}
          className={`flex-1 py-2.5 rounded-lg font-black text-base transition-all ${
            loading || !canBuy || slotsToBuy < 1 || slotsToBuy > maxSlotsToBuy
              ? 'bg-gray-800/50 cursor-not-allowed text-gray-500'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-green-500/50'
          }`}
        >
          {loading ? buyingProgress || 'Processing...' : 'Confirm'}
        </button>
        <button
          onClick={() => {
            setShowBuyOptions(false);
            setSlotsToBuy(1);
          }}
          disabled={loading}
          className="px-4 bg-purple-800/60 hover:bg-purple-700/60 py-2.5 rounded-lg font-bold text-purple-100 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}