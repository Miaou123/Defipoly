// ============================================
// FILE: SellPropertySection.tsx
// Refactored to match buy section style
// ============================================

import { useState } from 'react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from '@/contexts/NotificationContext';
import { usePropertyRefresh } from '@/contexts/PropertyRefreshContext';
import { PROPERTIES } from '@/utils/constants';
import { ChartIcon } from '@/components/GameIcons';

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
  
  const [slotsToSell, setSlotsToSell] = useState(1);

  // Base sell value is 15% (1500 bps), can go up to 30% (3000 bps) after 14 days
  const estimatedReceive = (property.price * slotsToSell * 0.15); // Minimum estimate
  const maxSlotsToSell = propertyData?.owned || 0;

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

  return (
    <div className="mt-2 p-3 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl border border-purple-500/30">
      {/* Header with Slots and Value */}
      <div className="flex items-center justify-between mb-2.5">
        {/* Slots Control */}
        <div className="flex items-center gap-2">
          <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
            Slots
          </span>
          <div className="flex items-center gap-1.5 bg-purple-950/50 rounded-lg p-0.5 border border-purple-500/30">
            <button
              onClick={() => setSlotsToSell(Math.max(1, slotsToSell - 1))}
              disabled={slotsToSell <= 1 || loading}
              className="w-8 h-8 flex items-center justify-center bg-purple-600/30 hover:bg-purple-600/50 disabled:bg-purple-900/20 disabled:text-purple-700 rounded text-white font-bold transition-all duration-200 active:scale-95 text-lg"
            >
              −
            </button>
            <div className="w-12 h-8 flex items-center justify-center bg-950/70 rounded">
              <span className="text-white text-xl font-bold">{slotsToSell}</span>
            </div>
            <button
              onClick={() => setSlotsToSell(Math.min(maxSlotsToSell, slotsToSell + 1))}
              disabled={slotsToSell >= maxSlotsToSell || loading}
              className="w-8 h-8 flex items-center justify-center bg-purple-600/30 hover:bg-purple-600/50 disabled:bg-purple-900/20 disabled:text-purple-700 rounded text-white font-bold transition-all duration-200 active:scale-95 text-lg"
            >
              +
            </button>
          </div>
        </div>

        {/* Value Display */}
        <div className="flex items-center gap-2">
          <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
            Value
          </span>
          <span className="text-orange-400 text-xl font-bold">
            ~{Math.round(estimatedReceive).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Info Section - Compact */}
      <div className="space-y-1 mb-2.5">
        <div className="flex items-start gap-1.5 text-purple-200">
          <ChartIcon size={16} className="text-purple-400 mt-0.5" />
          <span className="text-xs leading-relaxed">
            Max: {maxSlotsToSell} slots owned
          </span>
        </div>
        <div className="flex items-start gap-1.5 text-purple-200">
          <span className="text-sm">💵</span>
          <span className="text-xs leading-relaxed">
            Sell value: 15-30% of buy price (based on days held)
          </span>
        </div>
        <div className="flex items-start gap-1.5 text-amber-300">
          <span className="text-sm">⚠️</span>
          <span className="text-xs leading-relaxed">
            Held longer = better value (max 30% after 14 days)
          </span>
        </div>
      </div>

      {/* Action Button - Subtle style */}
      <button
        onClick={handleSell}
        disabled={loading || slotsToSell < 1 || slotsToSell > maxSlotsToSell}
        className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${
          loading || slotsToSell < 1 || slotsToSell > maxSlotsToSell
            ? 'bg-gray-800/30 cursor-not-allowed text-gray-500 border border-gray-700/30'
            : 'bg-orange-600/40 hover:bg-orange-600/60 border border-orange-500/50 text-orange-100 hover:border-orange-400/70'
        }`}
      >
        {loading ? 'Selling...' : 'Sell Slots'}
      </button>
    </div>
  );
}