// ============================================
// FILE: defipoly-frontend/src/components/property-actions/SellPropertySection.tsx
// ============================================

import { useState } from 'react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from '../NotificationProvider';
import { usePropertyRefresh } from '../PropertyRefreshContext';
import { PROPERTIES } from '@/utils/constants';

interface SellPropertySectionProps {
  propertyId: number;
  property: typeof PROPERTIES[0];
  propertyData: any;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onClose: () => void;
}

export function SellPropertySection({
  propertyId,
  property,
  propertyData,
  loading,
  setLoading,
  onClose
}: SellPropertySectionProps) {
  const { sellProperty } = useDefipoly();
  const { showSuccess, showError } = useNotification();
  const { triggerRefresh } = usePropertyRefresh();
  
  const [showSellOptions, setShowSellOptions] = useState(false);
  const [slotsToSell, setSlotsToSell] = useState(1);

  // Base sell value is 15% (1500 bps), can go up to 30% (3000 bps) after 14 days
  const estimatedReceive = (property.price * slotsToSell * 0.15); // Minimum estimate

  const handleSell = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const signature = await sellProperty(propertyId, slotsToSell);
      
      if (signature) {
        showSuccess(
          'Property Sold!',
          `Sold ${slotsToSell} slot${slotsToSell > 1 ? 's' : ''} successfully!`,
          signature !== 'already-processed' ? signature : undefined
        );
        triggerRefresh();
        setTimeout(() => onClose(), 2000);
      }
    } catch (error: any) {
      console.error('Error selling property:', error);
      
      const errorString = error?.message || error?.toString() || '';
      let errorMessage = 'Failed to sell property';
      
      if (errorString.includes('InsufficientSlots')) {
        errorMessage = 'Not enough slots to sell';
      } else if (errorString.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled';
      }
      
      showError('Sale Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!propertyData || propertyData.owned === 0) return null;

  if (!showSellOptions) {
    return (
      <button
        onClick={() => setShowSellOptions(true)}
        disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-base transition-all shadow-lg bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white border border-orange-400/30 hover:shadow-orange-500/50 hover:scale-[1.02]"
      >
        💰 Sell Slots
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-xl rounded-xl p-4 border-2 border-purple-500/40 space-y-3">
      <h4 className="font-black text-lg text-purple-100 flex items-center gap-2">
        <span className="text-xl">💰</span> Sell Slots
      </h4>
      
      <div>
        <label className="text-xs text-purple-300 font-semibold uppercase tracking-wide block mb-1">
          Slots to Sell
        </label>
        <input
          type="number"
          min="1"
          max={propertyData.owned}
          value={slotsToSell}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 1;
            const clamped = Math.max(1, Math.min(value, propertyData.owned));
            setSlotsToSell(clamped);
          }}
          className="w-full px-3 py-2 bg-purple-950/60 border-2 border-purple-500/40 rounded-lg text-purple-100 font-bold text-lg text-center focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
        />
        <div className="flex justify-between text-xs text-purple-400/80 mt-1">
          <span>Min: 1</span>
          <span>Max: {propertyData.owned}</span>
        </div>
      </div>

      <div className="bg-black/30 rounded-lg p-2.5 border border-purple-500/20 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-purple-300">You'll receive:</span>
          <span className="font-black text-lg text-orange-300">
            ~{estimatedReceive.toLocaleString()} DEFI
          </span>
        </div>
        <div className="text-xs text-purple-400 mt-1">
          15-30% of buy price (based on days held)
        </div>
      </div>

      <div className="text-xs text-amber-300 bg-amber-900/20 border border-amber-500/30 rounded-lg p-2">
        ⚠️ Held longer = better sell value (max 30% after 14 days)
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSell}
          disabled={loading}
          className={`flex-1 py-2.5 rounded-lg font-black text-base transition-all ${
            loading
              ? 'bg-gray-800/50 cursor-not-allowed text-gray-500'
              : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg hover:shadow-orange-500/50'
          }`}
        >
          {loading ? 'Selling...' : 'Confirm'}
        </button>
        <button
          onClick={() => {
            setShowSellOptions(false);
            setSlotsToSell(1);
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