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

  // Cooldown state - Orange theme
  if (isInCooldown && !isShieldActive) {
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
        </div>
      </div>
    );
  }

  // Active state - Green theme
  if (isShieldActive) {
    return (
      <div className="bg-gradient-to-br from-green-900/40 to-emerald-800/40 backdrop-blur-xl rounded-xl p-4 border-2 border-green-500/40 space-y-3">
        <h4 className="font-black text-lg text-green-100 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Shield Active
        </h4>
        
        <div className="bg-green-950/60 rounded-lg p-3 border border-green-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-300 font-semibold">Protected Slots:</span>
            <span className="text-xs px-2 py-1 bg-green-600/30 border border-green-500/50 rounded-full text-green-200 font-bold">
              🛡️ {totalSlots} SLOT{totalSlots > 1 ? 'S' : ''}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-300 font-semibold flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Time Remaining:
            </span>
            <span className="text-lg font-black text-green-200">{timeRemaining}</span>
          </div>
        </div>
      </div>
    );
  }

  // Shield selection - BLUE THEME to match Shield button
  return (
    <div className="bg-gradient-to-b from-blue-600/30 to-blue-700/30 backdrop-blur-xl rounded-2xl p-5 border-2 border-blue-500/60 shadow-lg shadow-blue-500/20 space-y-4">
      {/* Controls with blue styling */}
      <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
        {/* Duration Section */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase text-blue-200 font-semibold tracking-wide whitespace-nowrap">
            Duration
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={decreaseHours}
              className="w-8 h-8 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/40 rounded-lg flex items-center justify-center text-white text-lg font-black active:scale-95 transition-all"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max="48"
              value={selectedHours}
              onChange={(e) => setSelectedHours(Math.max(1, Math.min(48, parseInt(e.target.value) || 1)))}
              className="w-[60px] h-8 bg-blue-950/40 border border-blue-400/40 rounded-lg text-white text-base font-black text-center focus:outline-none focus:border-blue-400/80 focus:bg-blue-950/60 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={increaseHours}
              className="w-8 h-8 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/40 rounded-lg flex items-center justify-center text-white text-lg font-black active:scale-95 transition-all"
            >
              +
            </button>
            <span className="text-xs text-blue-200 font-semibold">h</span>
          </div>
        </div>

        {/* Cost Section */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-[11px] uppercase text-blue-200 font-semibold tracking-wide">
            Cost
          </span>
          <div className="text-amber-400 text-lg font-black">
            {Math.round(totalShieldCost)}
          </div>
        </div>

        {/* Cooldown Section */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase text-blue-200 font-semibold tracking-wide">
            CD
          </span>
          <div className="text-orange-400 text-lg font-black">
            {cooldownHours >= 1 ? `${cooldownHours}h` : `${Math.round(cooldownHours * 60)}m`}
          </div>
        </div>
      </div>

      {/* Separator line - blue gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

      {/* Info Lines */}
      <div className="space-y-1.5 text-xs">
        <div className="text-blue-100">
          🛡️ Protects <span className="font-bold text-white">{totalSlots} slot{totalSlots > 1 ? 's' : ''}</span> for {selectedHours} hour{selectedHours > 1 ? 's' : ''}
        </div>
        <div className="text-orange-300">
          ⏰ {cooldownHours >= 1 ? `${cooldownHours}h` : `${Math.round(cooldownHours * 60)}min`} cooldown after expiry (25% of duration)
        </div>
      </div>

      {/* Separator line - blue gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

      {/* Activate Button - BLUE to match Shield button */}
      <button
        onClick={handleShield}
        disabled={loading || !canShield}
        className={`w-full h-12 rounded-xl font-black text-[15px] transition-all shadow-lg ${
          loading || !canShield
            ? 'bg-gray-800/50 cursor-not-allowed text-gray-500 shadow-none'
            : 'bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white border-2 border-blue-400/60 shadow-blue-500/40 hover:shadow-blue-500/60 hover:-translate-y-0.5 active:translate-y-0'
        }`}
      >
        {loading ? 'Activating Shield...' : 'Activate Shield'}
      </button>

      {!canShield && balance < totalShieldCost && (
        <div className="text-center text-xs text-red-300">
          ⚠️ Need {Math.round(totalShieldCost).toLocaleString()} DEFI
        </div>
      )}
    </div>
  );
}