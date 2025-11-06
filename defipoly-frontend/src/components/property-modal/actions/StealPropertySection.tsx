// ============================================
// FINAL CORRECTED StealPropertySection.tsx
// Uses cooldownHours (the actual field in PROPERTIES constant)
// ============================================

import { useState, useEffect } from 'react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from '@/contexts/NotificationContext';
import { usePropertyRefresh } from '@/contexts/PropertyRefreshContext';
import { useStealCooldownFromContext } from '@/contexts/StealCooldownContext';
import { PROPERTIES } from '@/utils/constants';
import { fetchPropertyStats } from '@/utils/propertyStats';
import { Clock } from 'lucide-react';
import { DiceIcon, ShieldIcon, LightningIcon, WarningIcon, LockIcon } from '@/components/GameIcons';

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
  const [protectedOwners, setProtectedOwners] = useState<number>(0);

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

  // Fetch property stats including steal protection info
  useEffect(() => {
    if (availableTargets === null) {
      fetchPropertyStats(propertyId)
        .then(stats => {
          if (stats) {
            setAvailableTargets(stats.ownersWithUnshieldedSlots);
            setProtectedOwners(stats.ownersWithStealProtection || 0);
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
          const targetDisplay = result.targetAddress 
            ? `${result.targetAddress.slice(0, 4)}...${result.targetAddress.slice(-4)}`
            : 'a random owner';
            
          showSuccess(
            'Steal Successful!',
            `You successfully stole 1 slot of ${property.name} from ${targetDisplay}!`,
            result.tx
          );
        } else {
          const targetDisplay = result.targetAddress 
            ? `${result.targetAddress.slice(0, 4)}...${result.targetAddress.slice(-4)}`
            : 'a random owner';
            
          showError(
            'Steal Failed', 
            `Steal attempt failed. Targeted ${targetDisplay} but the 33% roll didn't succeed. They now have 6h steal protection.`
          );
        }
        
        triggerRefresh();
        setTimeout(() => {
          setAvailableTargets(null); // Refresh stats
        }, 2000);
      }
    } catch (error: any) {
      console.error('Steal error:', error);
      
      const errorMsg = error?.message || error?.toString() || 'Unknown error';
      
      if (errorMsg.includes('No eligible targets')) {
        showError(
          'No Targets Available',
          'All owners are either fully shielded or have active steal protection (6h after being targeted).'
        );
      } else if (errorMsg.includes('steal protection')) {
        showError(
          'Steal Protection Active',
          'The selected target has steal protection active (6h cooldown).'
        );
      } else {
        showError('Steal Failed', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl p-4 border border-purple-500/30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-purple-200">Random Steal</h3>
        {isOnStealCooldown && stealCooldownRemaining > 0 && (
          <div className="flex items-center gap-1.5 text-yellow-400 text-xs bg-yellow-400/10 px-2 py-1 rounded-md border border-yellow-400/20">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-semibold">{formatCooldown(stealCooldownRemaining)}</span>
          </div>
        )}
      </div>

      {/* Cost & Success Rate Display */}
      <div className="grid grid-cols-2 gap-3 mb-3 bg-black/20 rounded-lg p-2.5 border border-purple-500/20">
        {/* Cost Display */}
        <div className="flex items-center gap-2">
          <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
            Cost
          </span>
          <span className="text-yellow-400 text-xl font-bold">
            {stealCost.toLocaleString()}
          </span>
        </div>

        {/* Success Rate */}
        <div className="flex items-center gap-2">
          <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
            Success Rate
          </span>
          <span className="text-green-400 text-xl font-bold">
            33%
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-start gap-1.5 text-purple-200">
          <DiceIcon size={16} className="text-purple-400 mt-0.5" />
          <span className="text-xs leading-relaxed">
            <strong>Truly Random:</strong> Target selected on-chain from all unprotected owners
          </span>
        </div>
        
        {availableTargets !== null && (
          <div className="flex items-start gap-1.5 text-purple-200">
            <span className="text-sm">👥</span>
            <span className="text-xs leading-relaxed">
              Available targets: <span className={`font-bold ${availableTargets > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {availableTargets > 0 ? `${availableTargets}` : 'None'}
              </span>
              {protectedOwners > 0 && (
                <span className="text-yellow-400 ml-1">
                  ({protectedOwners} protected)
                </span>
              )}
            </span>
          </div>
        )}

        <div className="flex items-start gap-1.5 text-purple-200">
          <ShieldIcon size={16} className="text-cyan-400 mt-0.5" />
          <span className="text-xs leading-relaxed">
            <strong>Protection:</strong> Targeted players get 6h immunity (success or fail)
          </span>
        </div>

        <div className="flex items-start gap-1.5 text-purple-200">
          <LightningIcon size={16} className="text-yellow-400 mt-0.5" />
          <span className="text-xs leading-relaxed">
            {/* ✅ FIXED: Uses cooldownHours which exists in PROPERTIES constant */}
            Your cooldown: {(property.cooldownHours || 24) / 2}h between steal attempts
          </span>
        </div>
      </div>

      {/* Warnings */}
      {wouldExceedMaxSlots && (
        <div className="text-center text-xs text-yellow-300 mb-2 bg-yellow-400/10 py-1.5 px-2 rounded border border-yellow-400/20">
          <WarningIcon size={16} className="inline-block mr-1" />You're at max slots for this property
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleSteal}
        disabled={loading || !canSteal || (availableTargets !== null && availableTargets === 0)}
        className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
          loading || !canSteal || (availableTargets !== null && availableTargets === 0)
            ? 'bg-gray-800/30 cursor-not-allowed text-gray-500 border border-gray-700/30'
            : 'bg-red-600/40 hover:bg-red-600/60 border border-red-500/50 text-red-100 hover:border-red-400/70 shadow-lg shadow-red-500/20'
        }`}
      >
        {loading ? (
          <><DiceIcon size={16} className="inline-block mr-1 animate-pulse" />Rolling the dice...</>
        ) : (
          <><DiceIcon size={16} className="inline-block mr-1" />Attempt Random Steal</>
        )}
      </button>

      {!canSteal && balance < stealCost && (
        <div className="text-center text-xs text-red-300 mt-2">
          <WarningIcon size={16} className="inline-block mr-1" />Need {stealCost.toLocaleString()} DEFI
        </div>
      )}

      {availableTargets === 0 && (
        <div className="text-center text-xs text-orange-300 mt-2 bg-orange-400/10 py-1.5 px-2 rounded border border-orange-400/20">
          <LockIcon size={16} className="inline-block mr-1" />All owners are protected (shielded or 6h steal immunity)
        </div>
      )}
    </div>
  );
}