'use client';

import { useEffect, useState } from 'react';
import { PROPERTIES } from '@/utils/constants';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';

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
    if (!connected) {
      alert('Please connect your wallet first!');
      return;
    }

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
    if (!connected) {
      alert('Please connect your wallet first!');
      return;
    }

    setLoading(true);
    try {
      await activateShield(propertyId, selectedCycles);
      alert(`Shield activated successfully!`);
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
    if (!connected) {
      alert('Please connect your wallet first!');
      return;
    }

    if (slotsToSell <= 0 || slotsToSell > (propertyData?.owned || 0)) {
      alert('Invalid number of slots to sell');
      return;
    }

    setLoading(true);
    try {
      await sellProperty(propertyId, slotsToSell);
      const saleValue = (property.price * slotsToSell * 0.25).toFixed(0);
      alert(`Sold ${slotsToSell} slot(s) for ${saleValue} DEFI`);
      onClose();
    } catch (error) {
      console.error('Error selling property:', error);
      alert('Failed to sell property. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSteal = async () => {
    if (!connected) {
      alert('Please connect your wallet first!');
      return;
    }

    if (!targetPlayer) {
      alert('Please enter the target player wallet address');
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

        {/* Property Info */}
        <div className="bg-black/30 rounded-xl p-5 mb-5 border border-purple-500/20">
          <div className="flex justify-between mb-3 text-sm">
            <span className="text-purple-300 font-medium">Available Slots</span>
            <span className="text-purple-100 font-semibold">
              {propertyData ? `${propertyData.availableSlots} / ${propertyData.totalSlots}` : 'Loading...'}
            </span>
          </div>
          <div className="flex justify-between mb-3 text-sm">
            <span className="text-purple-300 font-medium">Entry Price</span>
            <span className="text-purple-100 font-semibold">{property.price.toLocaleString()} DEFI</span>
          </div>
          <div className="flex justify-between mb-3 text-sm">
            <span className="text-purple-300 font-medium">Daily Yield</span>
            <span className="text-purple-100 font-semibold">{property.dailyIncome.toLocaleString()} DEFI/day</span>
          </div>
          
          {propertyData?.owned > 0 && (
            <>
              <div className="flex justify-between pt-3 mt-3 border-t border-purple-500/30 text-sm">
                <span className="text-purple-300 font-medium">Your Ownership</span>
                <span className="text-purple-100 font-semibold">{propertyData.owned} slot(s)</span>
              </div>
              {propertyData.shielded && (
                <div className="mt-2 p-2 bg-amber-500/20 border border-amber-500/50 rounded text-xs text-amber-300 flex items-center gap-2">
                  🛡️ <span>All {propertyData.owned} slots protected</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Shield Options */}
        {showShieldOptions && propertyData?.owned > 0 && !propertyData?.shielded && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-5">
            <div className="text-sm font-semibold text-amber-400 mb-2">
              🛡️ Shield All Your Slots
            </div>
            <div className="text-xs text-purple-300 mb-3">
              Protects all {propertyData.owned} slot{propertyData.owned > 1 ? 's' : ''} from theft for 48 hours
            </div>
            <div className="text-lg font-bold text-amber-400 mb-3">
              Cost: {shieldCost} DEFI
            </div>
            <div className="text-xs text-purple-400">
              {baseCostPerSlot} DEFI per slot × {propertyData.owned} slot{propertyData.owned > 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Sell Options */}
        {showSellOptions && propertyData?.owned > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-5">
            <div className="text-sm font-semibold text-orange-400 mb-2">
              💰 Sell Your Slots
            </div>
            <div className="text-xs text-purple-300 mb-3">
              Receive 25% of original purchase price ({sellValuePerSlot.toLocaleString()} DEFI per slot)
            </div>
            
            <div className="mb-3">
              <label className="text-xs text-purple-300 block mb-1">Slots to Sell:</label>
              <input
                type="number"
                min="1"
                max={propertyData.owned}
                value={slotsToSell}
                onChange={(e) => setSlotsToSell(parseInt(e.target.value) || 1)}
                className="w-full bg-black/30 border border-purple-500/30 rounded px-3 py-2 text-purple-100"
              />
            </div>
            
            <div className="text-sm text-purple-200">
              You will receive: <span className="font-bold text-green-400">{(sellValuePerSlot * slotsToSell).toLocaleString()} DEFI</span>
            </div>
          </div>
        )}

        {/* Steal Options */}
        {showStealOptions && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5">
            <div className="text-sm font-semibold text-red-400 mb-2">
              🎯 Steal Property (33% Success Rate)
            </div>
            <div className="text-xs text-purple-300 mb-3">
              Attempt to steal 1 slot from a player. Costs {stealCost.toLocaleString()} DEFI regardless of success.
            </div>
            
            <div className="mb-3">
              <label className="text-xs text-purple-300 block mb-1">Target Player Wallet:</label>
              <input
                type="text"
                placeholder="Enter wallet address..."
                value={targetPlayer}
                onChange={(e) => setTargetPlayer(e.target.value)}
                className="w-full bg-black/30 border border-purple-500/30 rounded px-3 py-2 text-purple-100 text-xs font-mono"
              />
              <button
                onClick={() => setTargetPlayer(publicKey?.toString() || '')}
                className="w-full mt-2 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-xs text-purple-300"
              >
                Use My Wallet (for testing)
              </button>
            </div>
            
            <div className="text-xs text-red-300 space-y-1">
              <div>⚠️ Target must own at least 1 slot of this property</div>
              <div>⚠️ If target's property is shielded, steal will fail</div>
              <div>⚠️ You pay {stealCost.toLocaleString()} DEFI even if steal fails</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Buy Button */}
          {propertyData?.availableSlots > 0 && !showShieldOptions && !showSellOptions && !showStealOptions && (
            <button
              onClick={handleBuy}
              disabled={loading || !connected}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-green-500/50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : connected ? 'Buy Property' : 'Connect Wallet'}
            </button>
          )}

          {/* Shield Button - Only show if user owns property */}
          {propertyData?.owned > 0 && !showShieldOptions && !showSellOptions && !showStealOptions && !propertyData?.shielded && (
            <button
              onClick={() => setShowShieldOptions(true)}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-amber-500/50"
            >
              🛡️ Activate Shield ({shieldCost} DEFI)
            </button>
          )}

          {/* Confirm Shield */}
          {showShieldOptions && (
            <button
              onClick={handleShield}
              disabled={loading || !connected}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-amber-500/50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Confirm Shield (${shieldCost} DEFI)`}
            </button>
          )}

          {/* Shield Active Badge */}
          {propertyData?.shielded && !showShieldOptions && !showSellOptions && !showStealOptions && (
            <div className="w-full py-3 bg-amber-500/20 border-2 border-amber-500/50 rounded-xl text-center">
              <div className="text-amber-400 font-semibold">🛡️ Shield Active</div>
              <div className="text-xs text-amber-300 mt-1">All {propertyData.owned} slots protected</div>
            </div>
          )}

          {/* Steal Button - Always available */}
          {!showShieldOptions && !showSellOptions && !showStealOptions && (
            <button
              onClick={() => setShowStealOptions(true)}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-red-500/50"
            >
              🎯 Steal Property ({stealCost.toLocaleString()} DEFI)
            </button>
          )}

          {/* Confirm Steal */}
          {showStealOptions && (
            <button
              onClick={handleSteal}
              disabled={loading || !connected || !targetPlayer}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-red-500/50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Confirm Steal (${stealCost.toLocaleString()} DEFI)`}
            </button>
          )}

          {/* Sell Button - Only show if user owns property */}
          {propertyData?.owned > 0 && !showShieldOptions && !showSellOptions && !showStealOptions && (
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
          {showSellOptions && (
            <button
              onClick={handleSell}
              disabled={loading || !connected}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-orange-500/50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Confirm Sale (${(sellValuePerSlot * slotsToSell).toLocaleString()} DEFI)`}
            </button>
          )}

          {/* Back/Cancel Button - Show when in any sub-menu */}
          {(showShieldOptions || showSellOptions || showStealOptions) && (
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