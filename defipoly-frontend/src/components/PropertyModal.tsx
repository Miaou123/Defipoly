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
  const { connected } = useWallet();
  const { buyProperty, activateShield, getPropertyData, getOwnershipData, program } = useDefipoly();
  const [loading, setLoading] = useState(false);
  const [showShieldOptions, setShowShieldOptions] = useState(false);
  const [selectedCycles, setSelectedCycles] = useState(1);
  const [propertyData, setPropertyData] = useState<any>(null);

  const wallet = useAnchorWallet();

  const property = propertyId !== null ? PROPERTIES.find(p => p.id === propertyId) : null;

  useEffect(() => {
    if (propertyId !== null && connected && program) {
      const fetchData = async () => {
        try {
          const propertyData = await getPropertyData(propertyId);
          const ownershipData = wallet ? await getOwnershipData(propertyId) : null;
          
          if (propertyData) {
            setPropertyData({
              availableSlots: propertyData.availableSlots,
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
      alert(`Shield activated for ${selectedCycles} cycle(s)!`);
      onClose();
    } catch (error) {
      console.error('Error activating shield:', error);
      alert('Failed to activate shield. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const shieldCosts = [
    { cycles: 1, label: '1 cycle (48h)', cost: Math.floor(property.dailyIncome * 0.35) },
    { cycles: 2, label: '2 cycles (96h + cooldown)', cost: Math.floor(property.dailyIncome * 0.35 * 1.9) },
    { cycles: 3, label: '3 cycles (144h + cooldowns)', cost: Math.floor(property.dailyIncome * 0.35 * 2.7) },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-purple-900/95 to-purple-800/95 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2 className="text-2xl font-bold text-purple-100 mb-6">
          {property.name}
        </h2>

        {/* Property Info */}
        <div className="bg-black/30 rounded-xl p-5 mb-5 border border-purple-500/20">
          <div className="flex justify-between mb-3 text-sm">
            <span className="text-purple-300 font-medium">Available Slots</span>
            <span className="text-purple-100 font-semibold">
              {propertyData?.availableSlots || property.slots} / {property.slots}
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
            <div className="flex justify-between pt-3 mt-3 border-t border-purple-500/30 text-sm">
              <span className="text-purple-300 font-medium">Your Ownership</span>
              <span className="text-purple-100 font-semibold">{propertyData.owned} slot(s)</span>
            </div>
          )}
        </div>

        {/* Shield Options */}
        {showShieldOptions && propertyData?.owned > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-5">
            <div className="text-sm font-semibold text-amber-400 mb-3">
              🛡️ Shield Duration (Max 48h, 12h cooldown)
            </div>
            
            <div className="space-y-2 mb-3">
              {shieldCosts.map((option) => (
                <div
                  key={option.cycles}
                  className={`p-3 bg-black/30 rounded-lg cursor-pointer border-2 transition-all ${
                    selectedCycles === option.cycles
                      ? 'border-amber-400 bg-amber-500/20'
                      : 'border-transparent hover:border-amber-500/50 hover:bg-black/40'
                  }`}
                  onClick={() => setSelectedCycles(option.cycles)}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-100">{option.label}</span>
                    <span className="text-sm font-semibold text-amber-400">{option.cost} DEFI</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-xs text-purple-300">
              Auto-renews after each 12h cooldown period
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {propertyData?.availableSlots > 0 && (
            <button
              onClick={handleBuy}
              disabled={loading || !connected}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-green-500/50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : connected ? 'Buy Property' : 'Connect Wallet'}
            </button>
          )}

          {propertyData?.owned > 0 && !showShieldOptions && (
            <button
              onClick={() => setShowShieldOptions(true)}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-amber-500/50"
            >
              Activate Shield
            </button>
          )}

          {showShieldOptions && (
            <button
              onClick={handleShield}
              disabled={loading || !connected}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-amber-500/50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Confirm Shield Purchase'}
            </button>
          )}

          {propertyData?.availableSlots === 0 && (
            <button
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-red-500/50"
            >
              Attempt Steal (50%)
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 bg-white/10 hover:bg-white/15 rounded-xl font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}