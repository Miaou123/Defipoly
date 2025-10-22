// ============================================
// FILE: defipoly-frontend/src/components/property-actions/StealPropertySection.tsx
// Updated for new single-transaction instant steal system with backend stats
// ============================================

import { useState, useEffect } from 'react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from '../NotificationProvider';
import { usePropertyRefresh } from '../PropertyRefreshContext';
import { PROPERTIES } from '@/utils/constants';
import { fetchPropertyStats } from '@/utils/propertyStats';

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
  const { stealPropertyInstant } = useDefipoly();
  const { showSuccess, showError } = useNotification();
  const { triggerRefresh } = usePropertyRefresh();
  
  const [showStealOptions, setShowStealOptions] = useState(false);
  const [availableTargets, setAvailableTargets] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const stealCost = property.price * 0.5;
  const canSteal = balance >= stealCost;

  // Fetch property stats when component shows steal options
  useEffect(() => {
    if (showStealOptions && availableTargets === null) {
      setLoadingStats(true);
      fetchPropertyStats(propertyId)
        .then(stats => {
          if (stats) {
            setAvailableTargets(stats.ownersWithUnshieldedSlots);
          }
        })
        .catch(err => console.error('Failed to fetch property stats:', err))
        .finally(() => setLoadingStats(false));
    }
  }, [showStealOptions, propertyId, availableTargets]);

  const handleSteal = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      // NEW: Single transaction call instead of request + fulfill
      const result = await stealPropertyInstant(propertyId);
      
      if (result) {
        if (result.success) {
          showSuccess(
            'Steal Successful!', 
            `You successfully stole 1 slot! VRF: ${result.vrfResult}`,
            result.tx // UPDATED: Use tx instead of fulfillTx
          );
        } else {
          showError(
            'Steal Failed', 
            `Steal attempt failed. You paid the cost but didn't win. VRF: ${result.vrfResult}`
          );
        }
        triggerRefresh();
        setTimeout(() => onClose(), 2000);
      }
    } catch (error: any) {
      console.error('Error stealing property:', error);
      
      const errorString = error?.message || error?.toString() || '';
      let errorMessage = 'Failed to execute steal';
      
      // Updated error messages for new system
      if (errorString.includes('TargetDoesNotOwnProperty')) {
        errorMessage = 'Target does not own this property';
      } else if (errorString.includes('AllSlotsShielded') || errorString.includes('shielded')) {
        errorMessage = 'All slots are shielded and cannot be stolen';
      } else if (errorString.includes('does not own any slots') || errorString.includes('does not own property')) {
        errorMessage = 'Target player does not own this property';
      } else if (errorString.includes('No eligible targets found')) {
        errorMessage = 'No eligible targets found for random steal';
      } else if (errorString.includes('CannotStealFromSelf')) {
        errorMessage = 'Cannot steal from yourself';
      } else if (errorString.includes('StealCooldownActive')) {
        errorMessage = 'Steal cooldown is active. Please wait before attempting again';
      } else if (errorString.includes('No players own unshielded slots')) {
        errorMessage = 'No one owns unshielded slots in this property';
      } else if (errorString.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (errorString.includes('insufficient')) {
        errorMessage = 'Insufficient balance';
      } else if (errorString.includes('SlotHashUnavailable')) {
        errorMessage = 'Randomness unavailable - please try again';
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
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white transform hover:scale-105'
        }`}
      >
        💰 Steal Property ({stealCost.toLocaleString()} POL)
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-lg p-4 border border-red-500/30">
        <h3 className="text-lg font-bold mb-3 text-red-300">🎯 Steal Property</h3>
        
        <div className="space-y-2 text-sm text-gray-300 mb-4">
          <div className="flex justify-between">
            <span>Cost:</span>
            <span className="font-bold text-white">{stealCost.toLocaleString()} POL</span>
          </div>
          <div className="flex justify-between">
            <span>Success Rate:</span>
            <span className="font-bold text-yellow-400">33%</span>
          </div>
          <div className="flex justify-between">
            <span>Reward if Successful:</span>
            <span className="font-bold text-green-400">1 slot from random owner</span>
          </div>
          {availableTargets !== null && (
            <div className="flex justify-between">
              <span>Available Targets:</span>
              <span className={`font-bold ${
                availableTargets > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {availableTargets > 0 
                  ? `${availableTargets} owner${availableTargets > 1 ? 's' : ''} with unshielded slots`
                  : 'All slots are shielded ❌'}
              </span>
            </div>
          )}
          {loadingStats && (
            <div className="flex justify-between">
              <span>Available Targets:</span>
              <span className="text-gray-400">Loading...</span>
            </div>
          )}
        </div>

        <div className="bg-black/30 rounded p-3 mb-4 text-xs text-gray-400">
          <p>💡 <strong>How it works:</strong> Pay the cost and attempt to steal 1 slot from a random owner. 
          You have a 33% chance of success. Whether you win or lose, you pay the cost. 
          Cooldown applies after each attempt.</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSteal}
            disabled={!canSteal || loading || availableTargets === 0}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              !canSteal || loading || availableTargets === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white'
            }`}
          >
            {loading ? 'Processing...' : availableTargets === 0 ? 'No Targets Available' : `🎲 Attempt Steal (${stealCost.toLocaleString()} POL)`}
          </button>
          
          <button
            onClick={() => setShowStealOptions(false)}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

      {!canSteal && (
        <div className="text-sm text-red-400 text-center">
          Insufficient balance. Need {stealCost.toLocaleString()} POL
        </div>
      )}
      
      {availableTargets === 0 && (
        <div className="text-sm text-red-400 text-center">
          All slots in this property are currently shielded. Try again later!
        </div>
      )}
    </div>
  );
}