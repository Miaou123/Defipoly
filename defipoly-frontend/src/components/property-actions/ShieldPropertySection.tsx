// ============================================
// FILE: defipoly-frontend/src/components/property-actions/ShieldPropertySection.tsx
// FIXED: Now checks for active shields and cooldown periods
// ============================================

import { useState, useEffect } from 'react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from '../../contexts/NotificationContext';
import { usePropertyRefresh } from '../../contexts/PropertyRefreshContext';
import { PROPERTIES } from '@/utils/constants';
import { Clock, Shield } from 'lucide-react';

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
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Shield cooldown constants
  const SHIELD_COOLDOWN_HOURS = 12;
  const SHIELD_COOLDOWN_SECONDS = SHIELD_COOLDOWN_HOURS * 3600;

  // Calculate shield cost
  const shieldCost = (property.price * (propertyData?.shieldCostPercentBps || 500) / 10000) * slotsToShield;
  const canShield = balance >= shieldCost && propertyData?.owned > 0;

  // Check shield status
  const now = Date.now() / 1000;
  const shieldExpiryTimestamp = propertyData?.shieldExpiry?.toNumber() || 0;
  const isShieldActive = propertyData?.shieldActive && shieldExpiryTimestamp > now;
  
  // Calculate cooldown (12 hours after 48-hour shield expires)
  const cooldownEndTime = shieldExpiryTimestamp + SHIELD_COOLDOWN_SECONDS;
  const isInCooldown = !isShieldActive && shieldExpiryTimestamp > 0 && now < cooldownEndTime;
  const cooldownRemaining = isInCooldown ? cooldownEndTime - now : 0;
  
  // Format time remaining
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Update countdown timer
  useEffect(() => {
    if (!isShieldActive && !isInCooldown) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const currentTime = Date.now() / 1000;
      
      if (isShieldActive) {
        // Show shield time remaining
        const remaining = Math.max(0, shieldExpiryTimestamp - currentTime);
        if (remaining <= 0) {
          setTimeRemaining('');
          triggerRefresh(); // Refresh to switch to cooldown state
        } else {
          setTimeRemaining(formatTime(remaining));
        }
      } else if (isInCooldown) {
        // Show cooldown time remaining
        const remaining = Math.max(0, cooldownRemaining);
        if (remaining <= 0) {
          setTimeRemaining('');
          triggerRefresh(); // Refresh to enable shield activation
        } else {
          setTimeRemaining(formatTime(remaining));
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isShieldActive, isInCooldown, shieldExpiryTimestamp, cooldownRemaining, triggerRefresh]);

  const handleShield = async () => {
    if (loading || isShieldActive || isInCooldown) return;
    setLoading(true);
    
    try {
      const signature = await activateShield(propertyId, slotsToShield);
      
      if (signature) {
        showSuccess(
          'Shield Activated!',
          `Shield activated for ${slotsToShield} slot${slotsToShield > 1 ? 's' : ''}! Protected for 48 hours (${SHIELD_COOLDOWN_HOURS}h cooldown after).`,
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

  // Show "Shield Active" status
  if (isShieldActive && !showShieldOptions) {
    return (
      <div className="bg-gradient-to-br from-green-900/40 to-emerald-800/40 backdrop-blur-xl rounded-xl p-4 border-2 border-green-500/40 space-y-3">
        <h4 className="font-black text-lg text-green-100 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Shield Active
        </h4>
        
        <div className="bg-green-950/60 rounded-lg p-3 border border-green-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-300 font-semibold">Protection Status:</span>
            <span className="text-xs px-2 py-1 bg-green-600/30 border border-green-500/50 rounded-full text-green-200 font-bold">
              🛡️ ACTIVE
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-300 font-semibold flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Time Remaining:
            </span>
            <span className="text-lg font-black text-green-200">{timeRemaining}</span>
          </div>
          
          <div className="mt-2 pt-2 border-t border-green-500/20 text-xs text-green-400">
            {propertyData.slotsShielded || propertyData.owned} slot{(propertyData.slotsShielded || propertyData.owned) > 1 ? 's' : ''} protected from theft
          </div>
        </div>

        <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-2 text-xs text-green-300">
          ✨ Your slots are fully protected! After expiry, {SHIELD_COOLDOWN_HOURS}h cooldown before reactivation.
        </div>
      </div>
    );
  }

  // Show "Cooldown" status
  if (isInCooldown && !showShieldOptions) {
    return (
      <div className="bg-gradient-to-br from-orange-900/40 to-amber-800/40 backdrop-blur-xl rounded-xl p-4 border-2 border-orange-500/40 space-y-3">
        <h4 className="font-black text-lg text-orange-100 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Shield Cooldown
        </h4>
        
        <div className="bg-orange-950/60 rounded-lg p-3 border border-orange-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-orange-300 font-semibold">Status:</span>
            <span className="text-xs px-2 py-1 bg-orange-600/30 border border-orange-500/50 rounded-full text-orange-200 font-bold">
              ⏳ COOLDOWN
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-orange-300 font-semibold flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Available in:
            </span>
            <span className="text-lg font-black text-orange-200">{timeRemaining}</span>
          </div>
          
          <div className="mt-2 pt-2 border-t border-orange-500/20 text-xs text-orange-400">
            Shield expired - recharging for {SHIELD_COOLDOWN_HOURS} hours
          </div>
        </div>

        <div className="bg-orange-900/20 border border-orange-500/20 rounded-lg p-2 text-xs text-orange-300">
          ⏰ After a 48-hour shield, there's a {SHIELD_COOLDOWN_HOURS}-hour cooldown before you can reactivate.
        </div>
      </div>
    );
  }

  // Show shield activation button (not expanded)
  if (!showShieldOptions) {
    return (
      <button
        onClick={() => setShowShieldOptions(true)}
        disabled={!canShield || loading || isShieldActive || isInCooldown}
        className={`w-full py-3 rounded-xl font-bold text-base transition-all shadow-lg ${
          !canShield || loading || isShieldActive || isInCooldown
            ? 'bg-purple-900/30 cursor-not-allowed text-purple-500 border border-purple-700/30'
            : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white border border-amber-400/30 hover:shadow-amber-500/50 hover:scale-[1.02]'
        }`}
      >
        🛡️ Shield Slots
      </button>
    );
  }

  // Show shield options panel
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
          Protects {slotsToShield} slot{slotsToShield > 1 ? 's' : ''} for 48 hours
        </div>
        <div className="text-xs text-orange-300 mt-1">
          ⏰ {SHIELD_COOLDOWN_HOURS}h cooldown after expiry
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleShield}
          disabled={loading || !canShield || isShieldActive || isInCooldown}
          className={`flex-1 py-2.5 rounded-lg font-black text-base transition-all ${
            loading || !canShield || isShieldActive || isInCooldown
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