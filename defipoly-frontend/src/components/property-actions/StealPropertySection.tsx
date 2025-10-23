// ============================================
// FILE: defipoly-frontend/src/components/property-actions/StealPropertySection.tsx
// FIXED VERSION - Allow stealing up to max slots & use propertyId for cooldown
// ============================================

import { useState, useEffect } from 'react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from '../../contexts/NotificationContext';
import { usePropertyRefresh } from '../../contexts/PropertyRefreshContext';
import { useStealCooldown } from '@/hooks/useStealCooldown';
import { PROPERTIES } from '@/utils/constants';
import { fetchPropertyStats } from '@/utils/propertyStats';
import { Clock } from 'lucide-react';

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
  
  // FIXED: Use propertyId instead of property.setId for correct cooldown data
  const { isOnStealCooldown, stealCooldownRemaining, refetchStealCooldown } = useStealCooldown(propertyId);
  
  const [showStealOptions, setShowStealOptions] = useState(false);
  const [availableTargets, setAvailableTargets] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const stealCost = property.price * 0.5;
  const canSteal = balance >= stealCost && !isOnStealCooldown;
  
  // FIXED: Check if user would exceed max slots per property if they steal
  const wouldExceedMaxSlots = propertyData && (propertyData.owned >= propertyData.maxSlotsPerProperty);

  const formatCooldown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

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
    if (loading || isOnStealCooldown) return;
    setLoading(true);
    
    try {
      const result = await stealPropertyInstant(propertyId);
      
      if (result) {
        await refetchStealCooldown();
        
        if (result.success) {
          showSuccess(
            'Steal Successful!',
            `You successfully stole 1 slot of ${property.name}! VRF: ${result.vrfResult}`,
            result.tx
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
      
      await refetchStealCooldown();
      
      const errorString = error?.message || error?.toString() || '';
      let errorMessage = 'Failed to execute steal';
      
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

  // FIXED: Don't show if user has reached max slots per property
  if (wouldExceedMaxSlots) return null;

  // Show cooldown warning if on cooldown
  if (isOnStealCooldown && !showStealOptions) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <Clock size={16} />
          <span className="font-semibold">Steal Cooldown Active</span>
        </div>
        <p className="text-sm text-red-300">
          You can steal again in this set in: <span className="font-bold">{formatCooldown(stealCooldownRemaining)}</span>
        </p>
        <p className="text-xs text-red-400 mt-2">
          Steal cooldown applies to all properties in the same color set.
        </p>
      </div>
    );
  }

  if (!showStealOptions) {
    return (
      <button
        onClick={() => setShowStealOptions(true)}
        disabled={!canSteal || loading || isOnStealCooldown}
        className={`w-full py-3 rounded-xl font-bold text-base transition-all shadow-lg ${
          !canSteal || loading || isOnStealCooldown
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white transform hover:scale-105'
        }`}
      >
        {isOnStealCooldown 
          ? `Cooldown: ${formatCooldown(stealCooldownRemaining)}`
          : `💰 Steal Property (${stealCost.toLocaleString()} POL)`
        }
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-lg p-4 border border-red-500/30">
        <h3 className="text-lg font-bold mb-3 text-red-300">🎯 Steal Property</h3>
        
        {/* Show cooldown warning in the steal panel */}
        {isOnStealCooldown && (
          <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-red-300 mb-1">
              <Clock size={14} />
              <span className="font-semibold text-sm">Cooldown Active</span>
            </div>
            <p className="text-xs text-red-200">
              Time remaining: <span className="font-bold">{formatCooldown(stealCooldownRemaining)}</span>
            </p>
          </div>
        )}
        
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
          Cooldown applies to all properties in this color set after each attempt.</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSteal}
            disabled={!canSteal || loading || availableTargets === 0 || isOnStealCooldown}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              !canSteal || loading || availableTargets === 0 || isOnStealCooldown
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white'
            }`}
          >
            {loading ? 'Processing...' : 
             isOnStealCooldown ? `Cooldown: ${formatCooldown(stealCooldownRemaining)}` :
             availableTargets === 0 ? 'No Targets Available' : 
             `🎲 Attempt Steal (${stealCost.toLocaleString()} POL)`}
          </button>
          
          <button
            onClick={() => setShowStealOptions(false)}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

      {!canSteal && !isOnStealCooldown && (
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