// ============================================
// FILE: defipoly-frontend/src/components/property-actions/StealPropertySection.tsx
// ============================================

import { useState } from 'react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from '../NotificationProvider';
import { usePropertyRefresh } from '../PropertyRefreshContext';
import { PROPERTIES } from '@/utils/constants';

interface StealPropertySectionProps {
  propertyId: number;
  property: typeof PROPERTIES[0];
  propertyData: any;
  balance: number;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onClose: () => void;
}

export function StealPropertySection({
  propertyId,
  property,
  propertyData,
  balance,
  loading,
  setLoading,
  onClose
}: StealPropertySectionProps) {
  const { stealProperty } = useDefipoly();
  const { showSuccess, showError } = useNotification();
  const { triggerRefresh } = usePropertyRefresh();
  
  const [showStealOptions, setShowStealOptions] = useState(false);
  const [targetPlayer, setTargetPlayer] = useState('');

  const stealCost = property.price * 0.5;
  const canSteal = balance >= stealCost;

  const handleSteal = async () => {
    if (loading || !targetPlayer) return;
    setLoading(true);
    
    try {
      const result = await stealProperty(propertyId, targetPlayer);
      
      if (result) {
        showSuccess(
          'Steal Completed!', 
          'Steal transaction completed! Check if successful.',
          result.fulfillTx !== 'already-processed' ? result.fulfillTx : undefined
        );
        triggerRefresh();
        setTimeout(() => onClose(), 2000);
      }
    } catch (error: any) {
      console.error('Error stealing property:', error);
      
      const errorString = error?.message || error?.toString() || '';
      let errorMessage = 'Failed to execute steal';
      
      if (errorString.includes('TargetDoesNotOwnProperty')) {
        errorMessage = 'Target does not own this property';
      } else if (errorString.includes('PropertyIsShielded')) {
        errorMessage = 'Property is shielded and cannot be stolen';
      } else if (errorString.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (errorString.includes('insufficient')) {
        errorMessage = 'Insufficient balance';
      }
      
      showError('Steal Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Don't show if user already owns slots in this property
  if (propertyData && propertyData.owned > 0) return null;

  if (!showStealOptions) {
    return (
      <button
        onClick={() => setShowStealOptions(true)}
        disabled={!canSteal || loading}
        className={`w-full py-3 rounded-xl font-bold text-base transition-all shadow-lg ${
          !canSteal || loading
            ? 'bg-purple-900/30 cursor-not-allowed text-purple-500 border border-purple-700/30'
            : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border border-red-400/30 hover:shadow-red-500/50 hover:scale-[1.02]'
        }`}
      >
        🎯 Steal Property
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-xl rounded-xl p-4 border-2 border-purple-500/40 space-y-3">
      <h4 className="font-black text-lg text-purple-100 flex items-center gap-2">
        <span className="text-xl">🎯</span> Steal from Player
      </h4>
      
      <div>
        <label className="text-xs text-purple-300 font-semibold uppercase tracking-wide block mb-1">
          Target Player Address
        </label>
        <input
          type="text"
          placeholder="Enter wallet address..."
          value={targetPlayer}
          onChange={(e) => setTargetPlayer(e.target.value)}
          className="w-full px-3 py-2 bg-purple-950/50 border border-purple-500/30 rounded-lg text-purple-100 text-sm placeholder-purple-500 focus:outline-none focus:border-purple-400"
        />
      </div>

      <div className="bg-black/30 rounded-lg p-2.5 border border-purple-500/20 text-sm space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-purple-300">Steal Cost:</span>
          <span className="font-black text-lg text-red-300">{stealCost.toLocaleString()} DEFI</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-purple-400">Success Chance:</span>
          <span className="text-yellow-300 font-bold">25%</span>
        </div>
        <div className="text-xs text-purple-400">
          Two transactions required (commit + reveal)
        </div>
      </div>

      <div className="text-xs text-red-300 bg-red-900/20 border border-red-500/30 rounded-lg p-2">
        ⚠️ You pay the cost regardless of success. Cannot steal shielded properties.
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSteal}
          disabled={loading || !targetPlayer || !canSteal}
          className={`flex-1 py-2.5 rounded-lg font-black text-base transition-all ${
            loading || !targetPlayer || !canSteal
              ? 'bg-gray-800/50 cursor-not-allowed text-gray-500'
              : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg hover:shadow-red-500/50'
          }`}
        >
          {loading ? 'Stealing...' : 'Confirm'}
        </button>
        <button
          onClick={() => {
            setShowStealOptions(false);
            setTargetPlayer('');
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