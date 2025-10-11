// ============================================
// FILE: defipoly-frontend/src/components/property-actions/ShieldPropertySection.tsx
// ============================================

import { useState } from 'react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from '../NotificationProvider';
import { usePropertyRefresh } from '../PropertyRefreshContext';
import { PROPERTIES } from '@/utils/constants';

interface ShieldPropertySectionProps {
  propertyId: number;
  property: typeof PROPERTIES[0];
  propertyData: any;
  balance: number;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onClose: () => void;
}

export function ShieldPropertySection({
  propertyId,
  property,
  propertyData,
  balance,
  loading,
  setLoading,
  onClose
}: ShieldPropertySectionProps) {
  const { activateShield } = useDefipoly();
  const { showSuccess, showError } = useNotification();
  const { triggerRefresh } = usePropertyRefresh();
  
  const [showShieldOptions, setShowShieldOptions] = useState(false);
  const [slotsToShield, setSlotsToShield] = useState(1);

  const shieldCost = (property.price * (propertyData?.shieldCostPercentBps || 500) / 10000) * slotsToShield;
  const canShield = balance >= shieldCost && propertyData?.owned > 0;

  const handleShield = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const signature = await activateShield(propertyId, slotsToShield);
      
      if (signature) {
        showSuccess(
          'Shield Activated!',
          `Shield activated for ${slotsToShield} slot${slotsToShield > 1 ? 's' : ''}!`,
          signature !== 'already-processed' ? signature : undefined
        );
        triggerRefresh();
        setTimeout(() => onClose(), 2000);
      }
    } catch (error: any) {
      console.error('Error activating shield:', error);
      
      const errorString = error?.message || error?.toString() || '';
      let errorMessage = 'Failed to activate shield';
      
      if (errorString.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (errorString.includes('insufficient')) {
        errorMessage = 'Insufficient balance';
      }
      
      showError('Shield Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!propertyData || propertyData.owned === 0) return null;

  if (!showShieldOptions) {
    return (
      <button
        onClick={() => setShowShieldOptions(true)}
        disabled={!canShield || loading}
        className={`w-full py-3 rounded-xl font-bold text-base transition-all shadow-lg ${
          !canShield || loading
            ? 'bg-purple-900/30 cursor-not-allowed text-purple-500 border border-purple-700/30'
            : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white border border-amber-400/30 hover:shadow-amber-500/50 hover:scale-[1.02]'
        }`}
      >
        🛡️ Shield Slots
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-xl rounded-xl p-4 border-2 border-purple-500/40 space-y-3">
      <h4 className="font-black text-lg text-purple-100 flex items-center gap-2">
        <span className="text-xl">🛡️</span> Shield Slots
      </h4>
      
      <div>
        <label className="text-xs text-purple-300 font-semibold uppercase tracking-wide block mb-1">
          Slots to Shield
        </label>
        <input
          type="number"
          min="1"
          max={propertyData.owned}
          value={slotsToShield}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 1;
            const clamped = Math.max(1, Math.min(value, propertyData.owned));
            setSlotsToShield(clamped);
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
          <span className="text-purple-300">Shield Cost:</span>
          <span className="font-black text-lg text-amber-300">{shieldCost.toLocaleString()} DEFI</span>
        </div>
        <div className="text-xs text-purple-400 mt-1">
          Protects {slotsToShield} slot{slotsToShield > 1 ? 's' : ''} for 7 days
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleShield}
          disabled={loading || !canShield}
          className={`flex-1 py-2.5 rounded-lg font-black text-base transition-all ${
            loading || !canShield
              ? 'bg-gray-800/50 cursor-not-allowed text-gray-500'
              : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg hover:shadow-amber-500/50'
          }`}
        >
          {loading ? 'Activating...' : 'Confirm'}
        </button>
        <button
          onClick={() => {
            setShowShieldOptions(false);
            setSlotsToShield(1);
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