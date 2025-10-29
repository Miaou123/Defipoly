// ============================================
// FILE: StealPropertySection.tsx
// Simplified and refactored to match buy section style
// ============================================

import { useState, useEffect } from 'react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from '@/contexts/NotificationContext';
import { usePropertyRefresh } from '@/contexts/PropertyRefreshContext';
import { useStealCooldownFromContext } from '@/contexts/StealCooldownContext';
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
  const { isOnStealCooldown, stealCooldownRemaining, refetchStealCooldown } = useStealCooldownFromContext(propertyId);
  
  const [availableTargets, setAvailableTargets] = useState<number | null>(null);

  const stealCost = property.price * 0.5;
  const canSteal = balance >= stealCost && !isOnStealCooldown;
  const wouldExceedMaxSlots = propertyData && (propertyData.owned >= propertyData.maxSlotsPerProperty);

  const formatCooldown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Fetch property stats
  useEffect(() => {
    if (availableTargets === null) {
      fetchPropertyStats(propertyId)
        .then(stats => {
          if (stats) {
            setAvailableTargets(stats.ownersWithUnshieldedSlots);
          }
        })
        .catch(err => console.error('Failed to fetch property stats:', err));
    }
  }, [propertyId, availableTargets]);

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
            `You successfully stole 1 slot of ${property.name}!`,
            result.tx
          );
        } else {
          showError(
            'Steal Failed', 
            `Steal attempt failed. You paid the cost but didn't win.`
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
        errorMessage = 'All slots are shielded';
      } else if (errorString.includes('No eligible targets found')) {
        errorMessage = 'No eligible targets found';
      } else if (errorString.includes('CannotStealFromSelf')) {
        errorMessage = 'Cannot steal from yourself';
      } else if (errorString.includes('StealCooldownActive')) {
        errorMessage = 'Steal cooldown is active';
      } else if (errorString.includes('No players own unshielded slots')) {
        errorMessage = 'No unshielded slots available';
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

  // Don't show if user has reached max slots
  if (wouldExceedMaxSlots) return null;

  // Cooldown state - Compact version
  if (isOnStealCooldown) {
    return (
      <div className="mt-2 p-3 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl border border-purple-500/30">
        <div className="mb-2 p-2 bg-red-900/30 border border-red-500/40 rounded-lg">
          <p className="text-xs text-red-200 flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-semibold">Steal Cooldown Active</span>
          </p>
          <p className="text-xs text-red-200 flex items-center justify-between">
            <span>Available in:</span>
            <span className="font-bold">{formatCooldown(stealCooldownRemaining)}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 p-3 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl border border-purple-500/30">
      {/* Header with Cost and Success Rate */}
      <div className="flex items-center justify-between mb-2.5">
        {/* Cost Display */}
        <div className="flex items-center gap-2">
          <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
            Cost
          </span>
          <span className="text-yellow-400 text-2xl font-bold">
            {stealCost.toLocaleString()}
          </span>
        </div>

        {/* Success Rate */}
        <div className="flex items-center gap-2">
          <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
          Success Rate
          </span>
          <span className="text-green-400 text-2xl font-bold">
            33%
          </span>
        </div>
      </div>

      {/* Info Section - Compact */}
      <div className="space-y-1 mb-2.5">
        <div className="flex items-start gap-1.5 text-purple-200">
          <span className="text-sm">🎯</span>
          <span className="text-xs leading-relaxed">
            Random steal: 1 slot from any unshielded owner
          </span>
        </div>
        {availableTargets !== null && (
          <div className="flex items-start gap-1.5 text-purple-200">
            <span className="text-sm">👥</span>
            <span className="text-xs leading-relaxed">
              Available targets: <span className={`font-bold ${availableTargets > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {availableTargets > 0 ? `${availableTargets}` : 'None'}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Action Button - Subtle style */}
      <button
        onClick={handleSteal}
        disabled={loading || !canSteal || (availableTargets !== null && availableTargets === 0)}
        className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${
          loading || !canSteal || (availableTargets !== null && availableTargets === 0)
            ? 'bg-gray-800/30 cursor-not-allowed text-gray-500 border border-gray-700/30'
            : 'bg-red-600/40 hover:bg-red-600/60 border border-red-500/50 text-red-100 hover:border-red-400/70'
        }`}
      >
        {loading ? 'Attempting Steal...' : 'Attempt Steal'}
      </button>

      {!canSteal && balance < stealCost && (
        <div className="text-center text-xs text-red-300 mt-1.5">
          ⚠️ Need {stealCost.toLocaleString()} DEFI
        </div>
      )}
    </div>
  );
}