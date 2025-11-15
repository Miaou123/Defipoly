// ============================================
// FILE: SellPropertySection.tsx
// ✅ MIGRATED: Now uses API-based useOwnership hook
// UI unchanged - only data fetching layer updated
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
import { useOwnership } from '@/hooks/useOwnership';

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
  const { getOwnership } = useOwnership(); // ✅ API-based ownership hook
  const { publicKey } = useWallet();
  
  const [slotsToSell, setSlotsToSell] = useState(1);
  const [ownershipDetails, setOwnershipDetails] = useState<any>(null);
  const [sellValueInfo, setSellValueInfo] = useState<any>(null);

  const maxSlotsToSell = propertyData?.owned || 0;

  // ✅ UPDATED: Use API-based ownership data
  useEffect(() => {
    if (!publicKey || !propertyData?.owned) {
      setOwnershipDetails(null);
      setSellValueInfo(null);
      return;
    }

    const fetchOwnershipDetails = () => {
      try {
        // ✅ Get ownership from API hook (no async needed, already loaded)
        const ownershipData = getOwnership(propertyId);
        
        if (ownershipData?.purchaseTimestamp) {
          // Convert BN timestamp to seconds
          const purchaseTimestamp = ownershipData.purchaseTimestamp.toNumber();
          const sellInfo = getSellValueInfo(property.price, slotsToSell, purchaseTimestamp);
          
          setOwnershipDetails({ buyTimestamp: purchaseTimestamp });
          setSellValueInfo(sellInfo);
          
          console.log('💰 Sell Value Debug:', {
            propertyId,
            purchaseTimestamp,
            currentTime: Math.floor(Date.now() / 1000),
            sellInfo
          });
        } else {
          console.warn('No purchase timestamp found in ownership data');
          setSellValueInfo({
            sellValue: property.price * slotsToSell * 0.15,
            sellPercentage: 0.15,
            percentageDisplay: "15.0",
            daysHeld: "Unknown",
            isMaxValue: false
          });
        }
      } catch (error) {
        console.warn('Could not fetch ownership details:', error);
        // Fallback to base value calculation
        setSellValueInfo({
          sellValue: property.price * slotsToSell * 0.15,
          sellPercentage: 0.15,
          percentageDisplay: "15.0",
          daysHeld: "Unknown",
          isMaxValue: false
        });
      }
    };

    fetchOwnershipDetails();
  }, [publicKey, propertyId, property.price, slotsToSell, propertyData?.owned, getOwnership]);

  // Update sell value when slots change
  useEffect(() => {
    if (ownershipDetails?.buyTimestamp) {
      const sellInfo = getSellValueInfo(property.price, slotsToSell, ownershipDetails.buyTimestamp);
      setSellValueInfo(sellInfo);
    }
  }, [slotsToSell, property.price, ownershipDetails?.buyTimestamp]);

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

  // Show mock data if user doesn't own any slots
  if (!propertyData || propertyData.owned === 0) {
    const mockContent = (
      <div className="mt-2 p-3 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl border border-purple-500/30">
        {/* Header with Slots and Value */}
        <div className="flex items-center justify-between mb-2.5">
          {/* Slots Control */}
          <div className="flex items-center gap-2">
            <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
              Slots
            </span>
            <div className="flex items-center gap-1.5 bg-purple-950/50 rounded-lg p-0.5 border border-purple-500/30">
              <button className="w-8 h-8 flex items-center justify-center bg-purple-600/30 rounded text-white font-bold text-lg">
                −
              </button>
              <div className="w-12 h-8 flex items-center justify-center bg-950/70 rounded">
                <span className="text-white text-xl font-bold">1</span>
              </div>
              <button className="w-8 h-8 flex items-center justify-center bg-purple-600/30 rounded text-white font-bold text-lg">
                +
              </button>
            </div>
          </div>

          {/* Value Display */}
          <div className="flex items-center gap-2">
            <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
              Value
            </span>
            <span className="text-xl font-bold text-white">
              ~{Math.round(property.price * 0.15).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Info Section - Compact */}
        <div className="space-y-1 mb-2.5">
          <div className="flex items-start gap-1.5 text-purple-200">
            <ChartIcon size={16} className="text-purple-400 mt-0.5" />
            <span className="text-xs leading-relaxed">
              Max: your owned slots
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

        {/* Action Button - Disabled */}
        <button
          disabled
          className="w-full py-2 rounded-lg font-semibold text-sm bg-gray-800/30 cursor-not-allowed text-gray-500 border border-gray-700/30"
        >
          Sell Slots
        </button>
      </div>
    );

    return <UnownedOverlay>{mockContent}</UnownedOverlay>;
  }

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
  );
}