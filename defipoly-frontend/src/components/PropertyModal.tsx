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
  const [slotsToShield, setSlotsToShield] = useState(1);       // ✅ Changed from selectedCycles
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
            // ✅ Check if shield is active
            const now = Date.now() / 1000;
            const shieldActive = ownershipData 
              ? (ownershipData.slotsShielded > 0 && ownershipData.shieldExpiry.toNumber() > now)
              : false;

            setPropertyData({
              availableSlots: onChainPropertyData.availableSlots,
              maxSlotsPerProperty: onChainPropertyData.maxSlotsPerProperty, // ✅ Changed from totalSlots
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

  // ✅ Calculate daily income from constants and yield %
  const dailyIncome = property.dailyIncome; // From PROPERTIES constant
  const dailyIncomePerSlot = dailyIncome / property.slotsPerProperty;

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
    if (slotsToShield <= 0 || slotsToShield > (propertyData?.owned || 0)) {
      alert('Invalid number of slots to shield');
      return;
    }

    setLoading(true);
    try {
      await activateShield(propertyId, slotsToShield); // ✅ Now takes slots, not cycles
      alert(`Shield activated for ${slotsToShield} slot(s)!`);
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
      const result = await stealProperty(propertyId, targetPlayer);
      
      if (result.success) {
        alert(`🎉 Steal successful! You gained 1 slot.`);
      } else {
        alert(`❌ Steal failed. Better luck next time!`);
      }
      
      setShowStealOptions(false);
      onClose();
    } catch (error: any) {
      console.error('Error attempting steal:', error);
      if (error.message?.includes('AllSlotsShielded')) {
        alert('Cannot steal - all slots are shielded!');
      } else if (error.message?.includes('TargetDoesNotOwnProperty')) {
        alert('Target player does not own this property!');
      } else {
        alert('Failed to attempt steal. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">{property.name}</h2>
            <div className={`${property.color} h-2 w-20 rounded mt-2`}></div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-4">
          {/* Property Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-400 text-sm">Price per Slot</div>
              <div className="text-xl font-bold">{property.price} DEFI</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Daily Income (per slot)</div>
              <div className="text-xl font-bold text-green-500">{dailyIncomePerSlot.toFixed(2)} DEFI</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Available Slots</div>
              <div className="text-xl font-bold">
                {propertyData?.availableSlots ?? '...'} / {propertyData?.maxSlotsPerProperty ?? property.totalSlots}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">ROI</div>
              <div className="text-xl font-bold">{property.roi} days</div>
            </div>
          </div>

          {/* Ownership Info */}
          {connected && propertyData && propertyData.owned > 0 && (
            <div className="bg-gray-700 rounded p-4">
              <h3 className="font-bold mb-2">Your Ownership</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Slots Owned:</span>
                  <span className="font-semibold">{propertyData.owned}</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Daily Income:</span>
                  <span className="font-semibold text-green-500">
                    {(dailyIncomePerSlot * propertyData.owned).toFixed(2)} DEFI
                  </span>
                </div>
                
                {/* ✅ NEW Shield Status */}
                {propertyData.shieldActive ? (
                  <div className="bg-green-900/30 border border-green-500 rounded p-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-green-500">🛡️ Shield Active</span>
                      <span>{propertyData.slotsShielded} slots shielded</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Expires: {new Date(propertyData.shieldExpiry.toNumber() * 1000).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-xs">No active shield</div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!connected ? (
            <div className="text-center py-4">
              <WalletMultiButton />
            </div>
          ) : (
            <div className="space-y-2">
              {/* Buy Button */}
              {(!propertyData || propertyData.availableSlots > 0) && (
                <button
                  onClick={handleBuy}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-3 rounded font-semibold"
                >
                  {loading ? 'Processing...' : `Buy 1 Slot (${property.price} DEFI)`}
                </button>
              )}

              {/* Shield Button */}
              {propertyData && propertyData.owned > 0 && (
                <>
                  {!showShieldOptions ? (
                    <button
                      onClick={() => setShowShieldOptions(true)}
                      className="w-full bg-green-600 hover:bg-green-700 py-3 rounded font-semibold"
                    >
                      🛡️ Activate Shield
                    </button>
                  ) : (
                    <div className="bg-gray-700 p-4 rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <label>Slots to Shield:</label>
                        <input
                          type="number"
                          min="1"
                          max={propertyData.owned}
                          value={slotsToShield}
                          onChange={(e) => setSlotsToShield(parseInt(e.target.value))}
                          className="w-20 bg-gray-800 px-2 py-1 rounded"
                        />
                      </div>
                      <div className="text-sm text-gray-400">
                        Shield Cost: ~{((property.price * (propertyData.shieldCostPercentBps || 500) / 10000) * slotsToShield).toFixed(2)} DEFI
                      </div>
                      <div className="text-xs text-gray-500">
                        Duration: 48 hours
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleShield}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-2 rounded"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowShieldOptions(false)}
                          className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded"
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
                      className="w-full bg-orange-600 hover:bg-orange-700 py-3 rounded font-semibold"
                    >
                      Sell Slots
                    </button>
                  ) : (
                    <div className="bg-gray-700 p-4 rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <label>Slots to Sell:</label>
                        <input
                          type="number"
                          min="1"
                          max={propertyData.owned}
                          value={slotsToSell}
                          onChange={(e) => setSlotsToSell(parseInt(e.target.value))}
                          className="w-20 bg-gray-800 px-2 py-1 rounded"
                        />
                      </div>
                      <div className="text-sm text-gray-400">
                        You'll receive: ~{(property.price * slotsToSell * 0.15).toFixed(2)} - {(property.price * slotsToSell * 0.30).toFixed(2)} DEFI
                      </div>
                      <div className="text-xs text-gray-500">
                        Price increases with hold time (15-30%)
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSell}
                          disabled={loading}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 py-2 rounded"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowSellOptions(false)}
                          className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Steal Button */}
              {propertyData && (
                <>
                  {!showStealOptions ? (
                    <button
                      onClick={() => setShowStealOptions(true)}
                      className="w-full bg-red-600 hover:bg-red-700 py-3 rounded font-semibold"
                    >
                      🎯 Attempt Steal
                    </button>
                  ) : (
                    <div className="bg-gray-700 p-4 rounded space-y-2">
                      <input
                        type="text"
                        placeholder="Target player wallet address"
                        value={targetPlayer}
                        onChange={(e) => setTargetPlayer(e.target.value)}
                        className="w-full bg-gray-800 px-3 py-2 rounded"
                      />
                      <div className="text-sm text-gray-400">
                        Cost: {(property.price * 0.5).toFixed(2)} DEFI | Success Rate: 25%
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSteal}
                          disabled={loading}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 py-2 rounded"
                        >
                          {loading ? 'Processing...' : 'Confirm Steal'}
                        </button>
                        <button
                          onClick={() => setShowStealOptions(false)}
                          className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded"
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