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

// Building SVGs for levels 0-5 (same as Board component)
const BUILDING_SVGS: { [key: number]: React.ReactNode } = {
  0: <></>, // Empty lot
  1: (
    <svg width="40" height="40" viewBox="0 0 40 40" className="w-full h-auto">
      <ellipse cx="20" cy="36" rx="12" ry="3" fill="black" opacity="0.2"/>
      <path d="M 20 20 L 30 25 L 30 35 L 20 36 L 10 35 L 10 25 Z" fill="#D2691E"/>
      <path d="M 20 20 L 30 25 L 30 35 L 20 30 Z" fill="#A0522D"/>
      <path d="M 20 13 L 30 18 L 30 25 L 20 20 L 10 25 L 10 18 Z" fill="#8B4513"/>
      <path d="M 20 13 L 30 18 L 30 25 L 20 20 Z" fill="#654321"/>
      <rect x="17" y="30" width="6" height="6" fill="#654321"/>
      <rect x="12" y="27" width="4" height="4" fill="#FFFFCC"/>
      <rect x="24" y="27" width="4" height="4" fill="#FFFFCC"/>
    </svg>
  ),
  2: (
    <svg width="45" height="45" viewBox="0 0 45 45" className="w-full h-auto">
      <ellipse cx="22" cy="42" rx="14" ry="3" fill="black" opacity="0.2"/>
      <path d="M 22 20 L 34 25 L 34 40 L 22 42 L 10 40 L 10 25 Z" fill="#D2691E"/>
      <path d="M 22 20 L 34 25 L 34 40 L 22 35 Z" fill="#A0522D"/>
      <rect x="12" y="11" width="3" height="8" fill="#8B4513"/>
      <path d="M 22 13 L 34 18 L 34 25 L 22 20 L 10 25 L 10 18 Z" fill="#8B4513"/>
      <path d="M 22 13 L 34 18 L 34 25 L 22 20 Z" fill="#654321"/>
      <rect x="19" y="36" width="6" height="6" fill="#654321"/>
      <rect x="12" y="28" width="4" height="3" fill="#FFFFCC"/>
      <rect x="28" y="28" width="4" height="3" fill="#FFFFCC"/>
      <rect x="12" y="33" width="4" height="3" fill="#FFFFCC"/>
      <rect x="28" y="33" width="4" height="3" fill="#FFFFCC"/>
    </svg>
  ),
  3: (
    <svg width="50" height="50" viewBox="0 0 50 50" className="w-full h-auto">
      <ellipse cx="25" cy="46" rx="16" ry="4" fill="black" opacity="0.2"/>
      <path d="M 25 22 L 40 28 L 40 44 L 25 46 L 10 44 L 10 28 Z" fill="#D2691E"/>
      <path d="M 25 22 L 40 28 L 40 44 L 25 38 Z" fill="#A0522D"/>
      <rect x="15" y="12" width="4" height="12" fill="#8B4513"/>
      <rect x="31" y="12" width="4" height="12" fill="#8B4513"/>
      <path d="M 25 15 L 40 21 L 40 28 L 25 22 L 10 28 L 10 21 Z" fill="#8B4513"/>
      <path d="M 25 15 L 40 21 L 40 28 L 25 22 Z" fill="#654321"/>
      <rect x="22" y="40" width="6" height="6" fill="#654321"/>
      <rect x="13" y="32" width="5" height="4" fill="#FFFFCC"/>
      <rect x="32" y="32" width="5" height="4" fill="#FFFFCC"/>
      <rect x="13" y="38" width="5" height="4" fill="#FFFFCC"/>
      <rect x="32" y="38" width="5" height="4" fill="#FFFFCC"/>
    </svg>
  ),
  4: (
    <svg width="55" height="60" viewBox="0 0 55 60" className="w-full h-auto">
      <ellipse cx="27" cy="56" rx="18" ry="4" fill="black" opacity="0.2"/>
      <path d="M 27 25 L 45 32 L 45 52 L 27 56 L 9 52 L 9 32 Z" fill="#D2691E"/>
      <path d="M 27 25 L 45 32 L 45 52 L 27 45 Z" fill="#A0522D"/>
      <rect x="14" y="13" width="5" height="15" fill="#8B4513"/>
      <rect x="36" y="13" width="5" height="15" fill="#8B4513"/>
      <path d="M 27 8 L 45 15 L 45 25 L 27 18 L 9 25 L 9 15 Z" fill="#8B4513"/>
      <path d="M 27 8 L 45 15 L 45 25 L 27 18 Z" fill="#654321"/>
      <path d="M 27 18 L 45 25 L 45 32 L 27 25 L 9 32 L 9 25 Z" fill="#8B4513"/>
      <path d="M 27 18 L 45 25 L 45 32 L 27 25 Z" fill="#654321"/>
      <rect x="24" y="48" width="6" height="8" fill="#654321"/>
      <rect x="12" y="36" width="6" height="5" fill="#FFFFCC"/>
      <rect x="37" y="36" width="6" height="5" fill="#FFFFCC"/>
      <rect x="12" y="43" width="6" height="5" fill="#FFFFCC"/>
      <rect x="37" y="43" width="6" height="5" fill="#FFFFCC"/>
    </svg>
  ),
  5: (
    <svg width="60" height="70" viewBox="0 0 60 70" className="w-full h-auto">
      <ellipse cx="30" cy="66" rx="20" ry="4" fill="black" opacity="0.2"/>
      <path d="M 30 30 L 50 38 L 50 62 L 30 66 L 10 62 L 10 38 Z" fill="#D2691E"/>
      <path d="M 30 30 L 50 38 L 50 62 L 30 54 Z" fill="#A0522D"/>
      <rect x="16" y="15" width="6" height="20" fill="#8B4513"/>
      <rect x="38" y="15" width="6" height="20" fill="#8B4513"/>
      <path d="M 30 5 L 50 13 L 50 23 L 30 15 L 10 23 L 10 13 Z" fill="#8B4513"/>
      <path d="M 30 5 L 50 13 L 50 23 L 30 15 Z" fill="#654321"/>
      <path d="M 30 15 L 50 23 L 50 30 L 30 22 L 10 30 L 10 23 Z" fill="#8B4513"/>
      <path d="M 30 15 L 50 23 L 50 30 L 30 22 Z" fill="#654321"/>
      <path d="M 30 22 L 50 30 L 50 38 L 30 30 L 10 38 L 10 30 Z" fill="#8B4513"/>
      <path d="M 30 22 L 50 30 L 50 38 L 30 30 Z" fill="#654321"/>
      <rect x="26" y="56" width="8" height="10" fill="#654321"/>
      <rect x="13" y="42" width="7" height="6" fill="#FFFFCC"/>
      <rect x="40" y="42" width="7" height="6" fill="#FFFFCC"/>
      <rect x="13" y="50" width="7" height="6" fill="#FFFFCC"/>
      <rect x="40" y="50" width="7" height="6" fill="#FFFFCC"/>
      <rect x="24" y="8" width="12" height="3" fill="#FFD700"/>
    </svg>
  ),
};

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
  const [slotsToShield, setSlotsToShield] = useState(1);
  const [slotsToSell, setSlotsToSell] = useState(1);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [targetPlayer, setTargetPlayer] = useState<string>('');
  const { showSuccess, showError } = useNotification();

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
    }
  }, [propertyId, connected, program, wallet, getPropertyData, getOwnershipData]);

  if (!property || propertyId === null) return null;

  const dailyIncome = property.dailyIncome;
  const buyCost = property.price;
  const stealCost = property.price * 0.5;
  const shieldCost = (property.price * (propertyData?.shieldCostPercentBps || 500) / 10000) * slotsToShield;

  const canBuy = balance >= buyCost;
  const canSteal = balance >= stealCost;
  const canShield = balance >= shieldCost;

  // Calculate building level based on slots owned (0-5)
  const buildingLevel = propertyData?.owned 
    ? Math.min(5, Math.floor(propertyData.owned / Math.max(1, (propertyData.maxSlotsPerProperty || property.totalSlots) / 5)))
    : 0;

  const handleBuy = async () => {
    if (!connected || loading) return;

    setLoading(true);
    try {
      const signature = await buyProperty(propertyId);
      
      if (signature) {
        showSuccess(
          'Property Purchased!', 
          'Property purchased successfully!',
          signature !== 'already-processed' ? signature : undefined
        );
        
        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        onClose();
      }
    } catch (error: any) {
      console.error('Error buying property:', error);
      
      const errorMessage = error?.message || error?.toString() || '';
      
      // Only special case: User cancelled
          if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        showSuccess('Property Purchased!', 'Property purchased successfully!');
        await new Promise(resolve => setTimeout(resolve, 1000));
        onClose();
      } else if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
        showError('Transaction Cancelled', 'Transaction was cancelled by user.');
      } else {
        showError('Purchase Failed', 'Failed to purchase property. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  const handleShield = async () => {
    if (!connected || loading) return;
    if (slotsToShield <= 0 || slotsToShield > (propertyData?.owned || 0)) {
      showError('Invalid Input', 'Invalid number of slots to shield');
      return;
    }
    setLoading(true);
    try {
      const signature = await activateShield(propertyId, slotsToShield);
      
      if (signature) {
        showSuccess(
          'Shield Activated!', 
          `Shield activated for ${slotsToShield} slot(s)!`,
          signature !== 'already-processed' ? signature : undefined
        );
        setShowShieldOptions(false);
        onClose();
      }
    } catch (error: any) {
      console.error('Error activating shield:', error);
      const errorMessage = error?.message || error?.toString() || '';
      
      if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        showSuccess('Shield Activated!', `Shield activated for ${slotsToShield} slot(s)!`);
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
          'Slots Sold!', 
          `Sold ${slotsToSell} slot(s) successfully!`,
          signature !== 'already-processed' ? signature : undefined
        );
        setShowSellOptions(false);
        onClose();
      }
    } catch (error: any) {
      console.error('Error selling property:', error);
      const errorMessage = error?.message || error?.toString() || '';
      
      if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        showSuccess('Slots Sold!', `Sold ${slotsToSell} slot(s) successfully!`);
        setShowSellOptions(false);
        onClose();
      } else if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
        showError('Transaction Cancelled', 'Transaction was cancelled by user.');
      } else {
        showError('Sale Failed', 'Failed to sell property. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  

  const handleSteal = async () => {
    if (!connected || loading) return;
    if (!targetPlayer || targetPlayer.trim() === '') {
      showError('Missing Input', 'Please enter a target player address');
      return;
    }
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
      
      setShowStealOptions(false);
      onClose();
    } catch (error: any) {
      console.error('Error stealing property:', error);
      const errorMessage = error?.message || error?.toString() || '';
      
      if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        showSuccess('Steal Completed!', 'Steal transaction completed!');
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
          <div className="relative w-32 h-48 bg-white rounded-lg shadow-2xl overflow-hidden border-4 border-gray-800">
            {/* Color bar at top */}
            <div className={`${property.color} h-8 w-full flex-shrink-0`}></div>

            {/* Building display area */}
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 px-2 py-4 h-28">
              {buildingLevel === 0 ? (
                <div className="text-center">
                  <div className="text-3xl">📍</div>
                  <div className="text-[8px] text-gray-500 mt-1">Empty Lot</div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center scale-90">
                  {BUILDING_SVGS[buildingLevel]}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="px-2 py-3 bg-white border-t-2 border-gray-200 flex-shrink-0">
              <div className="text-center">
                <div className="text-xs font-black text-gray-900">
                  ${(property.price / 1000)}K
                </div>
              </div>
            </div>

            {/* Level indicator badge */}
            {buildingLevel > 0 && (
              <div className="absolute top-10 right-2 bg-purple-600 text-white text-xs font-black px-2 py-1 rounded-full shadow-lg border-2 border-white">
                L{buildingLevel}
              </div>
            )}

            {/* Ownership indicator */}
            {connected && propertyData && propertyData.owned > 0 && (
              <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                OWNED
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Balance Display */}
          {connected && (
            <div className="bg-purple-900/30 backdrop-blur rounded-xl p-4 text-center border border-purple-500/20">
              <span className="text-purple-300 text-sm">Your Balance: </span>
              <span className="font-black text-xl text-purple-100">{balance.toFixed(2)} DEFI</span>
            </div>
          )}

          {/* Property Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-900/20 backdrop-blur rounded-xl p-4 border border-purple-500/20">
              <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">Price per Slot</div>
              <div className="text-2xl font-black text-purple-100">{property.price} DEFI</div>
            </div>
            <div className="bg-purple-900/20 backdrop-blur rounded-xl p-4 border border-purple-500/20">
              <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">Daily Income</div>
              <div className="text-2xl font-black text-green-400">{dailyIncome.toFixed(2)} DEFI</div>
            </div>
            <div className="bg-purple-900/20 backdrop-blur rounded-xl p-4 border border-purple-500/20">
              <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">Available Slots</div>
              <div className="text-2xl font-black text-purple-100">
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
                <button
                  onClick={handleBuy}
                  disabled={loading || !canBuy}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                    loading
                      ? 'bg-purple-900/30 cursor-wait text-purple-400 border border-purple-700/30'
                      : !canBuy 
                        ? 'bg-purple-900/30 cursor-not-allowed text-purple-500 border border-purple-700/30' 
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white border border-blue-400/30 hover:shadow-blue-500/50 hover:scale-105'
                  }`}
                >
                  {loading ? '⏳ Processing Transaction...' : `🏠 Buy 1 Slot (${buyCost} DEFI)`}
                </button>
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
                          : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white border border-green-400/30 hover:shadow-green-500/50 hover:scale-105'
                      }`}
                    >
                      🛡️ Activate Shield
                    </button>
                  ) : (
                    <div className="bg-purple-900/30 backdrop-blur border border-purple-500/30 p-5 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-purple-200 font-semibold">Slots to Shield:</label>
                        <input
                          type="number"
                          min="1"
                          max={propertyData.owned}
                          value={slotsToShield}
                          onChange={(e) => setSlotsToShield(parseInt(e.target.value))}
                          className="w-24 bg-purple-950/50 border border-purple-500/30 px-3 py-2 rounded-lg text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="text-sm text-purple-300">
                        Shield Cost: ~{shieldCost.toFixed(2)} DEFI
                      </div>
                      <div className="text-xs text-purple-400">
                        Duration: 48 hours
                      </div>
                      {!canShield && (
                        <div className="text-red-400 text-sm font-semibold">
                          ⚠️ Insufficient balance
                        </div>
                      )}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleShield}
                          disabled={loading || !canShield}
                          className={`flex-1 py-3 rounded-lg font-bold ${
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
                      className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 py-4 rounded-xl font-bold text-lg text-white shadow-lg border border-orange-400/30 hover:shadow-orange-500/50 transition-all hover:scale-105"
                    >
                      💰 Sell Slots
                    </button>
                  ) : (
                    <div className="bg-purple-900/30 backdrop-blur border border-purple-500/30 p-5 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-purple-200 font-semibold">Slots to Sell:</label>
                        <input
                          type="number"
                          min="1"
                          max={propertyData.owned}
                          value={slotsToSell}
                          onChange={(e) => setSlotsToSell(parseInt(e.target.value))}
                          className="w-24 bg-purple-950/50 border border-purple-500/30 px-3 py-2 rounded-lg text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="text-sm text-purple-300">
                        You'll receive: ~{(property.price * slotsToSell * 0.15).toFixed(2)} - {(property.price * slotsToSell * 0.30).toFixed(2)} DEFI
                      </div>
                      <div className="text-xs text-purple-400">
                        Price increases with hold time (15-30%)
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleSell}
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 disabled:bg-purple-900/30 disabled:text-purple-500 py-3 rounded-lg font-bold text-white"
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
              {propertyData && (
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
                      🎯 Attempt Steal ({stealCost.toFixed(0)} DEFI)
                    </button>
                  ) : (
                    <div className="bg-purple-900/30 backdrop-blur border border-purple-500/30 p-5 rounded-xl space-y-3">
                      <input
                        type="text"
                        placeholder="Target player wallet address"
                        value={targetPlayer}
                        onChange={(e) => setTargetPlayer(e.target.value)}
                        className="w-full bg-purple-950/50 border border-purple-500/30 px-4 py-3 rounded-lg text-purple-100 placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="text-sm text-purple-300">
                        Cost: {stealCost.toFixed(2)} DEFI | Success Rate: 25%
                      </div>
                      {!canSteal && (
                        <div className="text-red-400 text-sm font-semibold">
                          ⚠️ Insufficient balance
                        </div>
                      )}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleSteal}
                          disabled={loading || !canSteal}
                          className={`flex-1 py-3 rounded-lg font-bold ${
                            loading || !canSteal
                              ? 'bg-purple-900/30 cursor-not-allowed text-purple-500'
                              : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white'
                          }`}
                        >
                          {loading ? '⏳ Processing...' : 'Confirm Steal'}
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