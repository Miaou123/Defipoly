// ============================================
// FILE: SellPropertySection.tsx
// ✅ MIGRATED: Now uses API data from propertyData prop
// ✅ REMOVED: RPC call to getOwnershipData()
// ============================================

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from '@/contexts/NotificationContext';
import { usePropertyRefresh } from '@/contexts/PropertyRefreshContext';
import { PROPERTIES } from '@/utils/constants';
import { ChartIcon } from '@/components/icons/UIIcons';
import { UnownedOverlay } from '../UnownedOverlay';
import { getSellValueInfo } from '@/utils/sellValue';

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
  const { sellProperty } = useDefipoly(); // ✅ REMOVED: getOwnershipData
  const { showSuccess, showError } = useNotification();
  const { triggerRefresh } = usePropertyRefresh();
  const { publicKey } = useWallet();
  
  const [slotsToSell, setSlotsToSell] = useState(1);
  const [sellValueInfo, setSellValueInfo] = useState<any>(null);

  const maxSlotsToSell = propertyData?.owned || 0;

  // ✅ NEW: Calculate sell value directly from propertyData (no RPC call!)
  useEffect(() => {
    if (!publicKey || !propertyData?.owned || !propertyData?.purchaseTimestamp) {
      setSellValueInfo(null);
      return;
    }

    // propertyData.purchaseTimestamp is a BN from the API
    const purchaseTimestamp = propertyData.purchaseTimestamp.toNumber();
    const sellInfo = getSellValueInfo(property.price, slotsToSell, purchaseTimestamp);
    
    setSellValueInfo(sellInfo);
    
    console.log('💰 Sell Value (from API data):', {
      propertyId,
      purchaseTimestamp,
      currentTime: Math.floor(Date.now() / 1000),
      daysHeld: sellInfo.daysHeld,
      sellPercentage: sellInfo.percentageDisplay + '%'
    });
  }, [publicKey, propertyId, property.price, slotsToSell, propertyData?.owned, propertyData?.purchaseTimestamp]);

  const estimatedReceive = sellValueInfo?.sellValue || (property.price * slotsToSell * 0.15);

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
        
        setTimeout(() => {
          triggerRefresh();
          onClose();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Sell error:', error);
      showError(
        'Failed to Sell',
        error?.message || 'Transaction failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ========== UI RENDERING ==========
  
  // If player doesn't own the property, show overlay with greyed-out content
  if (!propertyData?.owned) {
    return (
      <div className="mt-2 p-3 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl border border-purple-500/30">
        <UnownedOverlay>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-500/20 rounded-lg border border-orange-500/30">
                  <ChartIcon size={20} className="text-orange-400" />
                </div>
                <h3 className="text-lg font-bold text-orange-100">Sell Property</h3>
              </div>
            </div>

            {/* Placeholder slots and value control */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">Slots</span>
                <div className="flex items-center gap-1.5 bg-purple-950/50 rounded-lg p-0.5 border border-purple-500/30">
                  <button disabled className="w-8 h-8 flex items-center justify-center bg-purple-900/20 rounded text-purple-700 font-bold text-lg">−</button>
                  <div className="w-12 h-8 bg-purple-950/70 rounded text-white text-xl font-bold text-center flex items-center justify-center">1</div>
                  <button disabled className="w-8 h-8 flex items-center justify-center bg-purple-900/20 rounded text-purple-700 font-bold text-lg">+</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">Value</span>
                <span className="text-xl font-bold text-white">~{Math.round(property.price * 0.15).toLocaleString()}</span>
              </div>
            </div>

            {/* Info section */}
            <div className="space-y-1 mb-2.5">
              <div className="flex items-start gap-1.5 text-purple-200">
                <ChartIcon size={16} className="text-purple-400 mt-0.5" />
                <span className="text-xs leading-relaxed">Max: your owned slots</span>
              </div>
              <div className="flex items-start gap-1.5 text-purple-200">
                <span className="text-sm">💵</span>
                <span className="text-xs leading-relaxed">Sell value: 15-30% of buy price (based on days held)</span>
              </div>
              <div className="flex items-start gap-1.5 text-amber-300">
                <span className="text-sm">⚠️</span>
                <span className="text-xs leading-relaxed">Hold longer = better value (max 30% after 14 days)</span>
              </div>
            </div>

            {/* Disabled button */}
            <button 
              disabled 
              className="w-full py-2 rounded-lg font-semibold text-sm bg-gray-800/30 cursor-not-allowed text-gray-500 border border-gray-700/30"
            >
              Sell Slots
            </button>
          </div>
        </UnownedOverlay>
      </div>
    );
  }

  // ========== FULL FUNCTIONAL UI (Player owns property) ==========
  return (
    <div className="mt-2 p-3 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl border border-purple-500/30">
      <div className="space-y-3">
        
        {/* Header with Sell Icon and Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500/20 rounded-lg border border-orange-500/30">
              <ChartIcon size={20} className="text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-orange-100">Sell Property</h3>
              {sellValueInfo && (
                <p className="text-xs text-orange-300/70">
                  Held for {sellValueInfo.daysHeld} • {sellValueInfo.percentageDisplay}% value
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Slots Control and Value Display */}
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
              <input
                type="number"
                min="1"
                max={maxSlotsToSell}
                value={slotsToSell}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setSlotsToSell(Math.min(Math.max(1, value), maxSlotsToSell));
                }}
                disabled={loading}
                className="w-12 h-8 bg-purple-950/70 rounded text-white text-xl font-bold text-center border-none outline-none disabled:opacity-50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                style={{ 
                  MozAppearance: 'textfield',
                  WebkitAppearance: 'none',
                  margin: 0,
                }}
                onFocus={(e) => e.target.select()}
              />
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
              Max: <span className="font-bold text-white">{maxSlotsToSell}</span> slots owned
            </span>
          </div>
          <div className="flex items-start gap-1.5 text-purple-200">
            <span className="text-sm">💵</span>
            <span className="text-xs leading-relaxed">
              Current sell value: <span className="font-bold text-white">{sellValueInfo?.percentageDisplay || "15.0"}%</span> of buy price
            </span>
          </div>
          {sellValueInfo?.daysHeld && (
            <div className="flex items-start gap-1.5 text-purple-200">
              <span className="text-sm">📅</span>
              <span className="text-xs leading-relaxed">
                Held for: <span className="font-bold text-white">{sellValueInfo.daysHeld}</span>
              </span>
            </div>
          )}
          <div className="flex items-start gap-1.5 text-amber-300">
            <span className="text-sm">{sellValueInfo?.isMaxValue ? "✅" : "⚠️"}</span>
            <span className="text-xs leading-relaxed">
              {sellValueInfo?.isMaxValue 
                ? "Maximum sell value reached (30%)" 
                : "Hold longer for better selling value (max 30% after 14 days)"
              }
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
    </div>
  );
}