'use client';

import { useEffect, useState } from 'react';
import { PROPERTIES } from '@/utils/constants';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { StyledWalletButton } from './StyledWalletButton';
import { X } from 'lucide-react';
import { useNotification } from './NotificationProvider';
import { PropertyCard } from './PropertyCard';
import { usePropertyRefresh } from './PropertyRefreshContext';

interface PropertyModalProps {
  propertyId: number | null;
  onClose: () => void;
}

export function PropertyModal({ propertyId, onClose }: PropertyModalProps) {
  const { connected, publicKey } = useWallet();
  const { 
    buyProperty, 
    activateShield, 
    sellProperty,
    stealProperty,
    getPropertyData, 
    getOwnershipData, 
    program 
  } = useDefipoly();
  
  const [loading, setLoading] = useState(false);
  const [buyingProgress, setBuyingProgress] = useState<string>('');
  const [showShieldOptions, setShowShieldOptions] = useState(false);
  const [showSellOptions, setShowSellOptions] = useState(false);
  const [showStealOptions, setShowStealOptions] = useState(false);
  const [showBuyOptions, setShowBuyOptions] = useState(false);
  const [slotsToBuy, setSlotsToBuy] = useState(1);
  const [slotsToShield, setSlotsToShield] = useState(1);
  const [slotsToSell, setSlotsToSell] = useState(1);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [targetPlayer, setTargetPlayer] = useState<string>('');
  const { showSuccess, showError } = useNotification();
  const { triggerRefresh } = usePropertyRefresh();

  const wallet = useAnchorWallet();
  const property = propertyId !== null ? PROPERTIES.find(p => p.id === propertyId) : null;
  
  const { balance } = useTokenBalance();
  
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
      // Reset slot selectors when property changes
      setSlotsToBuy(1);
      setSlotsToShield(1);
      setSlotsToSell(1);
      setShowBuyOptions(false);
      setShowShieldOptions(false);
      setShowSellOptions(false);
      setShowStealOptions(false);
    }
  }, [propertyId, connected, program, wallet, getPropertyData, getOwnershipData]);

  // Ensure slotsToBuy doesn't exceed max available
  useEffect(() => {
    if (slotsToBuy > maxSlotsToBuy && maxSlotsToBuy > 0) {
      setSlotsToBuy(maxSlotsToBuy);
    }
  }, [slotsToBuy, maxSlotsToBuy]);

  if (!property || propertyId === null) return null;

  const dailyIncome = property.dailyIncome;
  const buyCost = property.price * slotsToBuy;
  const stealCost = property.price * 0.5;
  const shieldCost = (property.price * (propertyData?.shieldCostPercentBps || 500) / 10000) * slotsToShield;

  const canBuy = balance >= buyCost;
  const canSteal = balance >= stealCost;
  const canShield = balance >= shieldCost;
  
  // Calculate max slots user can buy
  const maxSlotsToBuy = Math.min(
    propertyData?.availableSlots || 1,
    Math.floor(balance / property.price),
    (propertyData?.maxSlotsPerProperty || property.totalSlots) - (propertyData?.owned || 0)
  );

  const handleBuy = async () => {
    if (!connected || loading) return;

    setLoading(true);
    setBuyingProgress('');
    try {
      let successCount = 0;
      let lastSignature = '';
      
      // Buy slots one at a time
      for (let i = 0; i < slotsToBuy; i++) {
        try {
          setBuyingProgress(`Buying slot ${i + 1} of ${slotsToBuy}...`);
          console.log(`🏗️ Buying slot ${i + 1} of ${slotsToBuy}...`);
          const signature = await buyProperty(propertyId);
          if (signature) {
            successCount++;
            lastSignature = signature;
            console.log(`✅ Slot ${i + 1} purchased successfully`);
          }
          // Small delay between purchases to avoid rate limiting
          if (i < slotsToBuy - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error: any) {
          const errorMessage = error?.message || error?.toString() || '';
          if (errorMessage.includes('already been processed')) {
            successCount++;
            continue;
          }
          // If we hit cooldown or other error, show partial success if any
          if (successCount > 0) {
            showSuccess(
              'Partial Purchase', 
              `Successfully purchased ${successCount} of ${slotsToBuy} slot(s). Stopped due to cooldown.`,
              lastSignature !== 'already-processed' ? lastSignature : undefined
            );
            triggerRefresh();
            setShowBuyOptions(false);
            setBuyingProgress('');
            onClose();
            return;
          }
          // Otherwise throw to outer catch
          throw error;
        }
      }
      
      if (successCount > 0) {
        showSuccess(
          'Property Purchased!', 
          `Successfully purchased ${successCount} slot(s)!`,
          lastSignature !== 'already-processed' ? lastSignature : undefined
        );
        
        // Trigger instant refresh of property cards
        triggerRefresh();
        
        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setShowBuyOptions(false);
        setBuyingProgress('');
        onClose();
      }
    } catch (error: any) {
      console.error('Error buying property:', error);
      setBuyingProgress('');
      
      const errorMessage = error?.message || error?.toString() || '';
      const errorLogs = error?.logs?.join(' ') || '';
      
      if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        showSuccess('Property Purchased!', 'Property purchased successfully!');
        triggerRefresh();
        setShowBuyOptions(false);
        onClose();
      } else if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
        showError('Transaction Cancelled', 'Transaction was cancelled by user.');
      } else if (errorMessage.includes('0x1774') || errorLogs.includes('CooldownActive')) {
        showError(
          'Set Cooldown Active', 
          `You recently purchased a property in the ${property.tier.toUpperCase()} set. Please wait a few moments before purchasing another property in this set.`
        );
      } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('InsufficientFunds')) {
        showError('Insufficient Balance', 'You do not have enough DEFI tokens to purchase this property.');
      } else {
        showError('Purchase Failed', 'Failed to complete purchase. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShield = async () => {
    if (!connected || loading) return;

    setLoading(true);
    try {
      const signature = await activateShield(propertyId, slotsToShield);
      
      if (signature) {
        showSuccess(
          'Shield Activated!', 
          `Shield activated for ${slotsToShield} slot(s)!`,
          signature !== 'already-processed' ? signature : undefined
        );
        triggerRefresh();
        setShowShieldOptions(false);
        onClose();
      }
    } catch (error: any) {
      console.error('Error activating shield:', error);
      
      const errorMessage = error?.message || error?.toString() || '';
      
      if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        showSuccess('Shield Activated!', `Shield activated for ${slotsToShield} slot(s)!`);
        triggerRefresh();
        setShowShieldOptions(false);
        onClose();
      } else if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
        showError('Transaction Cancelled', 'Transaction was cancelled by user.');
      } else {
        showError('Shield Failed', 'Failed to activate shield. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!connected || loading) return;

    setLoading(true);
    try {
      const signature = await sellProperty(propertyId, slotsToSell);
      
      if (signature) {
        showSuccess(
          'Property Sold!', 
          `Sold ${slotsToSell} slot(s) successfully!`,
          signature !== 'already-processed' ? signature : undefined
        );
        triggerRefresh();
        setShowSellOptions(false);
        onClose();
      }
    } catch (error: any) {
      console.error('Error selling property:', error);
      
      const errorMessage = error?.message || error?.toString() || '';
      
      if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        showSuccess('Property Sold!', `Sold ${slotsToSell} slot(s) successfully!`);
        triggerRefresh();
        setShowSellOptions(false);
        onClose();
      } else if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
        showError('Transaction Cancelled', 'Transaction was cancelled by user.');
      } else {
        showError('Sell Failed', 'Failed to sell property. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSteal = async () => {
    if (!connected || loading || !targetPlayer) return;

    setLoading(true);
    try {
      const result = await stealProperty(propertyId, targetPlayer);
      
      if (result.success) {
        showSuccess(
          'Steal Successful!', 
          'You successfully stole a property slot!',
          result.fulfillTx !== 'already-processed' ? result.fulfillTx : undefined
        );
      } else {
        showError('Steal Failed', 'The steal attempt was unsuccessful. Better luck next time!');
      }
      
      // Trigger refresh regardless of steal success/failure to update UI
      triggerRefresh();
      setShowStealOptions(false);
      onClose();
    } catch (error: any) {
      console.error('Error stealing property:', error);
      
      const errorMessage = error?.message || error?.toString() || '';
      
      if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        showSuccess('Steal Completed!', 'Steal transaction completed!');
        triggerRefresh();
        setShowStealOptions(false);
        onClose();
      } else if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
        showError('Transaction Cancelled', 'Transaction was cancelled by user.');
      } else {
        showError('Steal Failed', 'Failed to execute steal. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Property Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-900/20 backdrop-blur rounded-xl p-4 border border-purple-500/20">
              <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">Price per Slot</div>
              <div className="text-2xl font-black text-purple-100">{buyCost} DEFI</div>
            </div>
            <div className="bg-purple-900/20 backdrop-blur rounded-xl p-4 border border-purple-500/20">
              <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">Daily Income</div>
              <div className="text-2xl font-black text-green-400">{dailyIncome} DEFI</div>
            </div>
            <div className="bg-purple-900/20 backdrop-blur rounded-xl p-4 border border-purple-500/20">
              <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">Available Slots</div>
              <div className="text-2xl font-black text-blue-400">
                {propertyData?.availableSlots ?? '...'} / {propertyData?.maxSlotsPerProperty ?? property.totalSlots}
              </div>
            </div>
            <div className="bg-purple-900/20 backdrop-blur rounded-xl p-4 border border-purple-500/20">
              <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">Set Bonus</div>
              <div className="text-2xl font-black text-pink-400">+40% (1.4x)</div>
            </div>
          </div>

          {/* Ownership Info */}
          {connected && propertyData && propertyData.owned > 0 && (
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur rounded-xl p-5 border border-purple-500/30">
              <h3 className="font-black text-lg text-purple-100 mb-3">Your Ownership</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-purple-300">Slots Owned:</span>
                  <span className="font-bold text-purple-100 text-lg">{propertyData.owned}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-300">Your Daily Income:</span>
                  <span className="font-bold text-green-400 text-lg">
                    {(dailyIncome * propertyData.owned).toFixed(2)} DEFI
                  </span>
                </div>
                
                {propertyData.shieldActive ? (
                  <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-green-400 font-bold">🛡️ Shield Active</span>
                      <span className="text-green-300">{propertyData.slotsShielded} slots</span>
                    </div>
                    <div className="text-xs text-green-300/70">
                      Expires: {new Date(propertyData.shieldExpiry.toNumber() * 1000).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-purple-400/60 text-xs italic">No active shield</div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!connected ? (
            <div className="flex flex-col items-center py-8 space-y-4">
              <p className="text-purple-200 mb-2 text-center text-lg">Connect your wallet to interact with this property</p>
              <StyledWalletButton variant="modal" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Buy Button */}
              {(!propertyData || propertyData.availableSlots > 0) && (
                <>
                  {!showBuyOptions ? (
                    <button
                      onClick={() => setShowBuyOptions(true)}
                      disabled={loading || maxSlotsToBuy === 0}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                        loading
                          ? 'bg-purple-900/30 cursor-wait text-purple-400 border border-purple-700/30'
                          : maxSlotsToBuy === 0
                            ? 'bg-purple-900/30 cursor-not-allowed text-purple-500 border border-purple-700/30' 
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white border border-blue-400/30 hover:shadow-blue-500/50 hover:scale-105'
                      }`}
                    >
                      {loading ? '⏳ Processing...' : `🏠 Buy Slots`}
                    </button>
                  ) : (
                    <div className="bg-purple-900/20 backdrop-blur rounded-xl p-5 border border-purple-500/30 space-y-3">
                      <h4 className="font-bold text-purple-100">Buy Options</h4>
                      <div className="space-y-2">
                        <label className="text-sm text-purple-300">Slots to Buy: {slotsToBuy}</label>
                        <input
                          type="range"
                          min="1"
                          max={maxSlotsToBuy}
                          value={slotsToBuy}
                          onChange={(e) => setSlotsToBuy(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-xs text-purple-400">
                          Total Cost: {buyCost.toLocaleString()} DEFI ({slotsToBuy} slot{slotsToBuy > 1 ? 's' : ''})
                        </div>
                        <div className="text-xs text-green-400">
                          Daily Income: {(dailyIncome * slotsToBuy).toLocaleString()} DEFI
                        </div>
                        {maxSlotsToBuy < (propertyData?.availableSlots || 1) && (
                          <div className="text-xs text-amber-400">
                            ⚠️ Limited by balance or max per player
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleBuy}
                          disabled={loading || !canBuy}
                          className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                            loading || !canBuy
                              ? 'bg-purple-900/30 cursor-not-allowed text-purple-500'
                              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white'
                          }`}
                        >
                          {loading ? (buyingProgress || 'Buying...') : 'Confirm Purchase'}
                        </button>
                        <button
                          onClick={() => setShowBuyOptions(false)}
                          className="flex-1 bg-purple-800/50 hover:bg-purple-700/50 py-3 rounded-lg font-bold text-purple-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Shield Button */}
              {propertyData && propertyData.owned > 0 && (
                <>
                  {!showShieldOptions ? (
                    <button
                      onClick={() => setShowShieldOptions(true)}
                      disabled={!canShield}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                        !canShield 
                          ? 'bg-purple-900/30 cursor-not-allowed text-purple-500 border border-purple-700/30'
                          : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border border-amber-400/30 hover:shadow-amber-500/50 hover:scale-105'
                      }`}
                    >
                      🛡️ Activate Shield
                    </button>
                  ) : (
                    <div className="bg-purple-900/20 backdrop-blur rounded-xl p-5 border border-purple-500/30 space-y-3">
                      <h4 className="font-bold text-purple-100">Shield Options</h4>
                      <div className="space-y-2">
                        <label className="text-sm text-purple-300">Slots to Shield: {slotsToShield}</label>
                        <input
                          type="range"
                          min="1"
                          max={propertyData.owned}
                          value={slotsToShield}
                          onChange={(e) => setSlotsToShield(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-xs text-purple-400">
                          Cost: {shieldCost.toFixed(2)} DEFI (48 hours protection)
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleShield}
                          disabled={loading || !canShield}
                          className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                            loading || !canShield
                              ? 'bg-purple-900/30 cursor-not-allowed text-purple-500'
                              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white'
                          }`}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowShieldOptions(false)}
                          className="flex-1 bg-purple-800/50 hover:bg-purple-700/50 py-3 rounded-lg font-bold text-purple-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Sell Button */}
              {propertyData && propertyData.owned > 0 && (
                <>
                  {!showSellOptions ? (
                    <button
                      onClick={() => setShowSellOptions(true)}
                      className="w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white border border-orange-400/30 hover:shadow-orange-500/50 hover:scale-105"
                    >
                      💰 Sell Slots
                    </button>
                  ) : (
                    <div className="bg-purple-900/20 backdrop-blur rounded-xl p-5 border border-purple-500/30 space-y-3">
                      <h4 className="font-bold text-purple-100">Sell Options</h4>
                      <div className="space-y-2">
                        <label className="text-sm text-purple-300">Slots to Sell: {slotsToSell}</label>
                        <input
                          type="range"
                          min="1"
                          max={propertyData.owned}
                          value={slotsToSell}
                          onChange={(e) => setSlotsToSell(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-xs text-purple-400">
                          You'll receive: {(buyCost * 0.8 * slotsToSell).toFixed(2)} DEFI (80% of buy price)
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSell}
                          disabled={loading}
                          className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                            loading
                              ? 'bg-purple-900/30 cursor-wait text-purple-400'
                              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white'
                          }`}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowSellOptions(false)}
                          className="flex-1 bg-purple-800/50 hover:bg-purple-700/50 py-3 rounded-lg font-bold text-purple-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Steal Button */}
              {(!propertyData || propertyData.owned === 0) && (
                <>
                  {!showStealOptions ? (
                    <button
                      onClick={() => setShowStealOptions(true)}
                      disabled={!canSteal}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                        !canSteal 
                          ? 'bg-purple-900/30 cursor-not-allowed text-purple-500 border border-purple-700/30'
                          : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border border-red-400/30 hover:shadow-red-500/50 hover:scale-105'
                      }`}
                    >
                      🎯 Steal Property ({stealCost} DEFI)
                    </button>
                  ) : (
                    <div className="bg-purple-900/20 backdrop-blur rounded-xl p-5 border border-purple-500/30 space-y-3">
                      <h4 className="font-bold text-purple-100">Steal from Player</h4>
                      <div className="space-y-2">
                        <label className="text-sm text-purple-300">Target Player Address</label>
                        <input
                          type="text"
                          placeholder="Enter wallet address..."
                          value={targetPlayer}
                          onChange={(e) => setTargetPlayer(e.target.value)}
                          className="w-full px-3 py-2 bg-purple-950/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-500"
                        />
                        <div className="text-xs text-purple-400">
                          Cost: {stealCost} DEFI (50% chance of success)
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSteal}
                          disabled={loading || !targetPlayer || !canSteal}
                          className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                            loading || !targetPlayer || !canSteal
                              ? 'bg-purple-900/30 cursor-not-allowed text-purple-500'
                              : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white'
                          }`}
                        >
                          Confirm Steal
                        </button>
                        <button
                          onClick={() => setShowStealOptions(false)}
                          className="flex-1 bg-purple-800/50 hover:bg-purple-700/50 py-3 rounded-lg font-bold text-purple-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}