// ============================================
// FILE: ShieldPropertySection.tsx
// Refactored to match buy section style
// ============================================

import { useState, useEffect } from 'react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from '@/contexts/NotificationContext';
import { usePropertyRefresh } from '@/contexts/PropertyRefreshContext';
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
  
  const [selectedHours, setSelectedHours] = useState(24);
  const [timeRemaining, setTimeRemaining] = useState('');

  const totalSlots = propertyData?.owned || 0;
  const now = Date.now() / 1000;
  const shieldExpiryTimestamp = propertyData?.shieldExpiry?.toNumber() || 0;
  const isShieldActive = propertyData?.shieldActive && shieldExpiryTimestamp > now;
  
  const cooldownDurationSeconds = propertyData?.shieldCooldownDuration?.toNumber() || (12 * 3600);
  const cooldownEndTime = shieldExpiryTimestamp + cooldownDurationSeconds;
  const isInCooldown = !isShieldActive && shieldExpiryTimestamp > 0 && now < cooldownEndTime;
  
  const baseCostPerSlot24h = (property.price * (propertyData?.shieldCostPercentBps || 500) / 10000);
  const costPerSlotForDuration = (baseCostPerSlot24h * selectedHours) / 24;
  const totalShieldCost = costPerSlotForDuration * totalSlots;
  const canShield = balance >= totalShieldCost && totalSlots > 0;
  
  const cooldownHours = selectedHours / 4;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  useEffect(() => {
    if (!isShieldActive && !isInCooldown) {
      setTimeRemaining('');
      return;
    }

    const interval = setInterval(() => {
      const currentTime = Date.now() / 1000;
      
      if (isShieldActive) {
        const remaining = Math.max(0, shieldExpiryTimestamp - currentTime);
        if (remaining <= 0) {
          setTimeRemaining('');
          triggerRefresh();
        } else {
          setTimeRemaining(formatTime(remaining));
        }
      } else if (isInCooldown) {
        const remaining = Math.max(0, cooldownEndTime - currentTime);
        if (remaining <= 0) {
          setTimeRemaining('');
          triggerRefresh();
        } else {
          setTimeRemaining(formatTime(remaining));
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isShieldActive, isInCooldown, shieldExpiryTimestamp, cooldownEndTime, triggerRefresh]);

  const handleShield = async () => {
    if (loading || isShieldActive || isInCooldown) return;
    setLoading(true);
    
    try {
      const signature = await activateShield(propertyId, selectedHours);
      
      if (signature) {
        showSuccess(
          'Shield Activated!',
          `${totalSlots} slot${totalSlots > 1 ? 's' : ''} protected for ${selectedHours}h`,
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
      } else if (errorString.includes('InvalidShieldDuration')) {
        errorMessage = 'Invalid shield duration';
      } else if (errorString.includes('ShieldAlreadyActive')) {
        errorMessage = 'Shield is already active';
      }
      
      showError('Shield Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const increaseHours = () => {
    if (selectedHours < 48) {
      setSelectedHours(selectedHours + 1);
    }
  };

  const decreaseHours = () => {
    if (selectedHours > 1) {
      setSelectedHours(selectedHours - 1);
    }
  };

  if (!propertyData || totalSlots === 0) return null;

  // Cooldown state - Compact version
  if (isInCooldown && !isShieldActive) {
    return (
      <div className="mt-2 p-3 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl border border-purple-500/30">
        <div className="mb-2 p-2 bg-orange-900/30 border border-orange-500/40 rounded-lg">
          <p className="text-xs text-orange-200 flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-semibold">Shield Cooldown Active</span>
          </p>
          <p className="text-xs text-orange-200 flex items-center justify-between">
            <span>Available in:</span>
            <span className="font-bold">{timeRemaining}</span>
          </p>
        </div>
      </div>
    );
  }

  // Active state - Compact version
  if (isShieldActive) {
    return (
      <div className="mt-2 p-3 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl border border-purple-500/30">
        <div className="mb-2 p-2 bg-green-900/30 border border-green-500/40 rounded-lg">
          <p className="text-xs text-green-200 flex items-center gap-1.5 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span className="font-semibold">Shield Active</span>
          </p>
          <div className="space-y-1">
            <p className="text-xs text-green-200 flex items-center justify-between">
              <span>Protected slots:</span>
              <span className="font-bold">{totalSlots}</span>
            </p>
            <p className="text-xs text-green-200 flex items-center justify-between">
              <span>Time remaining:</span>
              <span className="font-bold">{timeRemaining}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Shield selection - Purple theme matching buy section
  return (
    <div className="mt-2 p-3 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl border border-purple-500/30">
      {/* Header with Duration, Cost, and Cooldown */}
      <div className="flex items-center justify-between mb-2.5">
        {/* Duration Control */}
        <div className="flex items-center gap-2">
          <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
            Duration
          </span>
          <div className="flex items-center gap-1.5 bg-purple-950/50 rounded-lg p-0.5 border border-purple-500/30">
            <button
              onClick={decreaseHours}
              disabled={selectedHours <= 1 || loading}
              className="w-8 h-8 flex items-center justify-center bg-purple-600/30 hover:bg-purple-600/50 disabled:bg-purple-900/20 disabled:text-purple-700 rounded text-white font-bold transition-all duration-200 active:scale-95 text-lg"
            >
              −
            </button>
            <div className="w-12 h-8 flex items-center justify-center bg-purple-950/70 rounded">
              <span className="text-white text-xl font-bold">{selectedHours}</span>
            </div>
            <button
              onClick={increaseHours}
              disabled={selectedHours >= 48 || loading}
              className="w-8 h-8 flex items-center justify-center bg-purple-600/30 hover:bg-purple-600/50 disabled:bg-purple-900/20 disabled:text-purple-700 rounded text-white font-bold transition-all duration-200 active:scale-95 text-lg"
            >
              +
            </button>
          </div>
          <span className="text-purple-300 text-xs font-medium">h</span>
        </div>

        {/* Cost and Cooldown */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
              Cost
            </span>
            <span className="text-yellow-400 text-2xl font-bold">
              {Math.round(totalShieldCost).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
              CD
            </span>
            <span className="text-orange-400 text-2xl font-bold">
              {cooldownHours >= 1 ? `${cooldownHours}h` : `${Math.round(cooldownHours * 60)}m`}
            </span>
          </div>
        </div>
      </div>

      {/* Info Section - Compact */}
      <div className="space-y-1 mb-2.5">
        <div className="flex items-start gap-1.5 text-purple-200">
          <span className="text-sm">🛡️</span>
          <span className="text-xs leading-relaxed">
            Protects <span className="font-bold text-white">{totalSlots} slot{totalSlots > 1 ? 's' : ''}</span> for {selectedHours} hour{selectedHours > 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-start gap-1.5 text-purple-200">
          <span className="text-sm">⏱️</span>
          <span className="text-xs leading-relaxed">
            {cooldownHours >= 1 ? `${cooldownHours}h` : `${Math.round(cooldownHours * 60)}min`} cooldown after expiry (25% of duration)
          </span>
        </div>
      </div>

      {/* Action Button - Subtle style */}
      <button
        onClick={handleShield}
        disabled={loading || !canShield}
        className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${
          loading || !canShield
            ? 'bg-gray-800/30 cursor-not-allowed text-gray-500 border border-gray-700/30'
            : 'bg-blue-600/40 hover:bg-blue-600/60 border border-blue-500/50 text-blue-100 hover:border-blue-400/70'
        }`}
      >
        {loading ? 'Activating Shield...' : 'Activate Shield'}
      </button>

      {!canShield && balance < totalShieldCost && (
        <div className="text-center text-xs text-red-300 mt-1.5">
          ⚠️ Need {Math.round(totalShieldCost).toLocaleString()} DEFI
        </div>
      )}
    </div>
  );
}