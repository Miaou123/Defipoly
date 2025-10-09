'use client';

import { useEffect, useState } from 'react';
import { PROPERTIES } from '@/utils/constants';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

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
  const [showShieldOptions, setShowShieldOptions] = useState(false);
  const [showSellOptions, setShowSellOptions] = useState(false);
  const [showStealOptions, setShowStealOptions] = useState(false);
  const [selectedCycles, setSelectedCycles] = useState(1);
  const [slotsToSell, setSlotsToSell] = useState(1);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [targetPlayer, setTargetPlayer] = useState<string>('');

  const wallet = useAnchorWallet();
  const property = propertyId !== null ? PROPERTIES.find(p => p.id === propertyId) : null;

  useEffect(() => {
    if (propertyId !== null && connected && program) {
      const fetchData = async () => {
        try {
          const onChainPropertyData = await getPropertyData(propertyId);
          const ownershipData = wallet ? await getOwnershipData(propertyId) : null;
          
          if (onChainPropertyData) {
            setPropertyData({
              availableSlots: onChainPropertyData.availableSlots,
              totalSlots: onChainPropertyData.totalSlots,
              owned: ownershipData?.slotsOwned || 0,
              shielded: ownershipData?.shieldActive || false,
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

  const handleBuy = async () => {
    if (!connected) return;

    setLoading(true);
    try {
      await buyProperty(propertyId);
      alert('Property purchased successfully!');
      onClose();
    } catch (error) {
      console.error('Error buying property:', error);
      alert('Failed to buy property. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleShield = async () => {
    if (!connected) return;

    setLoading(true);
    try {
      await activateShield(propertyId, selectedCycles);
      alert(`Shield activated for ${selectedCycles} cycle(s)!`);
      setShowShieldOptions(false);
      onClose();
    } catch (error) {
      console.error('Error activating shield:', error);
      alert('Failed to activate shield. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!connected) return;

    setLoading(true);
    try {
      await sellProperty(propertyId, slotsToSell);
      alert(`Sold ${slotsToSell} slot(s) successfully!`);
      setShowSellOptions(false);
      onClose();
    } catch (error) {
      console.error('Error selling property:', error);
      alert('Failed to sell property. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSteal = async () => {
    if (!connected) return;

    if (!targetPlayer || targetPlayer.trim() === '') {
      alert('Please enter a target player address');
      return;
    }

    setLoading(true);
    try {
      await stealProperty(propertyId, targetPlayer);
      alert('Steal attempt completed! Check if it succeeded in the transaction.');
      setShowStealOptions(false);
      onClose();
    } catch (error: any) {
      console.error('Error attempting steal:', error);
      if (error.message?.includes('PropertyIsShielded')) {
        alert('Cannot steal - property is shielded!');
      } else if (error.message?.includes('TargetDoesNotOwnProperty')) {
        alert('Target player does not own this property!');
      } else {
        alert('Failed to attempt steal. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate costs
  const slotsOwned = propertyData?.owned || 1;
  const baseCostPerSlot = Math.floor(property.dailyIncome * 0.35);
  const shieldCost = baseCostPerSlot * slotsOwned;
  const stealCost = Math.floor(property.price * 0.5);
  const sellValuePerSlot = Math.floor(property.price * 0.25);
  const totalSellValue = sellValuePerSlot * slotsOwned;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-purple-900/95 to-purple-800/95 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-purple-100 mb-6">
          {property.name}
        </h2>

        {/* Connect Wallet Banner - Show when not connected */}
        {!connected && (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-6 text-center">
            <div className="text-amber-400 font-semibold mb-3 flex items-center justify-center gap-2">
              <span>🔒</span> Wallet Not Connected
            </div>
            <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-pink-500 hover:!from-purple-400 hover:!to-pink-400 !rounded-lg !font-bold !transition-all !w-full !justify-center" />
          </div>
        )}

        {/* Property Info */}
        <div className="bg-black/30 rounded-xl p-5 mb-5 border border-purple-500/20">
          <div className="flex justify-between mb-3 text-sm">
            <span className="text-purple-300 font-medium">Available Slots</span>
            <span className="text-purple-100 font-semibold">
              {connected ? (propertyData?.availableSlots ?? 'Loading...') : 'Loading...'}
            </span>
          </div>
          
          <div className="flex justify-between mb-3 text-sm">
            <span className="text-purple-300 font-medium">Entry Price</span>
            <span className="text-purple-100 font-semibold">{property.price.toLocaleString()} DEFI</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-purple-300 font-medium">Daily Yield</span>
            <span className="text-green-400 font-semibold">{property.dailyIncome.toLocaleString()} DEFI/day</span>
          </div>

          {connected && propertyData?.owned > 0 && (
            <>
              <div className="border-t border-purple-500/20 my-3"></div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-300 font-medium">You Own</span>
                <span className="text-blue-400 font-semibold">{propertyData.owned} slot(s)</span>
              </div>
              {propertyData.shielded && (
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-purple-300 font-medium">Shield Status</span>
                  <span className="text-amber-400 font-semibold">🛡️ Active</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Shield Options */}
        {showShieldOptions && connected && (
          <div className="bg-purple-900/40 rounded-xl p-4 mb-4 border border-purple-500/20">
            <div className="text-purple-200 font-semibold mb-3">Select Shield Duration:</div>
            <div className="flex gap-2 mb-3">
              {[1, 2, 3].map((cycles) => (
                <button
                  key={cycles}
                  onClick={() => setSelectedCycles(cycles)}
                  className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                    selectedCycles === cycles
                      ? 'bg-amber-600 text-white'
                      : 'bg-purple-800/50 text-purple-300 hover:bg-purple-800/70'
                  }`}
                >
                  {cycles} {cycles === 1 ? 'Cycle' : 'Cycles'}
                </button>
              ))}
            </div>
            <div className="text-xs text-purple-400">
              Cost: {(shieldCost * selectedCycles).toLocaleString()} DEFI
            </div>
          </div>
        )}

        {/* Sell Options */}
        {showSellOptions && connected && (
          <div className="bg-purple-900/40 rounded-xl p-4 mb-4 border border-purple-500/20">
            <div className="text-purple-200 font-semibold mb-3">Slots to Sell:</div>
            <input
              type="number"
              min="1"
              max={propertyData?.owned || 1}
              value={slotsToSell}
              onChange={(e) => setSlotsToSell(Math.min(Math.max(1, parseInt(e.target.value) || 1), propertyData?.owned || 1))}
              className="w-full px-4 py-2 bg-purple-900/50 border border-purple-500/30 rounded-lg text-white"
            />
            <div className="text-xs text-purple-400 mt-2">
              You'll receive: {(sellValuePerSlot * slotsToSell).toLocaleString()} DEFI (25% of value)
            </div>
          </div>
        )}

        {/* Steal Options */}
        {showStealOptions && connected && (
          <div className="bg-purple-900/40 rounded-xl p-4 mb-4 border border-purple-500/20">
            <div className="text-purple-200 font-semibold mb-3">Target Player Address:</div>
            <input
              type="text"
              placeholder="Enter wallet address..."
              value={targetPlayer}
              onChange={(e) => setTargetPlayer(e.target.value)}
              className="w-full px-4 py-2 bg-purple-900/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-400 text-sm"
            />
            <div className="text-xs text-purple-400 mt-2">
              Cost: {stealCost.toLocaleString()} DEFI • 33% success rate
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Buy Button */}
          {!showShieldOptions && !showSellOptions && !showStealOptions && (
            <button
              onClick={handleBuy}
              disabled={!connected || loading}
              className={`w-full py-3 bg-gradient-to-r from-green-600 to-green-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                !connected
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:from-green-500 hover:to-green-600 hover:shadow-lg hover:shadow-green-500/50'
              }`}
            >
              <span>🏠</span> {loading ? 'Processing...' : `Buy Property (${property.price.toLocaleString()} DEFI)`}
            </button>
          )}

          {/* Shield Button */}
          {!showShieldOptions && !showSellOptions && !showStealOptions && (
            <button
              onClick={() => connected ? setShowShieldOptions(true) : null}
              disabled={!connected || loading}
              className={`w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                !connected
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:from-amber-500 hover:to-amber-600 hover:shadow-lg hover:shadow-amber-500/50'
              }`}
            >
              <span>🛡️</span> Shield Property
            </button>
          )}

          {/* Confirm Shield */}
          {showShieldOptions && connected && (
            <button
              onClick={handleShield}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-amber-500/50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Confirm Shield (${(shieldCost * selectedCycles).toLocaleString()} DEFI)`}
            </button>
          )}

          {/* Steal Button */}
          {!showShieldOptions && !showSellOptions && !showStealOptions && (
            <button
              onClick={() => connected ? setShowStealOptions(true) : null}
              disabled={!connected || loading}
              className={`w-full py-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                !connected
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:from-red-500 hover:to-red-600 hover:shadow-lg hover:shadow-red-500/50'
              }`}
            >
              <span>🎯</span> Steal Property ({stealCost.toLocaleString()} DEFI)
            </button>
          )}

          {/* Confirm Steal */}
          {showStealOptions && connected && (
            <button
              onClick={handleSteal}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-red-500/50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Confirm Steal (${stealCost.toLocaleString()} DEFI)`}
            </button>
          )}

          {/* Sell Button - Only show if user owns property */}
          {connected && propertyData?.owned > 0 && !showShieldOptions && !showSellOptions && !showStealOptions && (
            <button
              onClick={() => {
                setSlotsToSell(1);
                setShowSellOptions(true);
              }}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-orange-500/50"
            >
              💰 Sell Property ({totalSellValue.toLocaleString()} DEFI)
            </button>
          )}

          {/* Confirm Sell */}
          {showSellOptions && connected && (
            <button
              onClick={handleSell}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-orange-500/50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Confirm Sale (${(sellValuePerSlot * slotsToSell).toLocaleString()} DEFI)`}
            </button>
          )}

          {/* Back/Cancel Button - Show when in any sub-menu */}
          {connected && (showShieldOptions || showSellOptions || showStealOptions) && (
            <button
              onClick={() => {
                setShowShieldOptions(false);
                setShowSellOptions(false);
                setShowStealOptions(false);
              }}
              className="w-full py-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl font-semibold transition-all"
            >
              ← Back
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={() => {
              setShowShieldOptions(false);
              setShowSellOptions(false);
              setShowStealOptions(false);
              onClose();
            }}
            className="w-full py-3 bg-white/10 hover:bg-white/15 rounded-xl font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}