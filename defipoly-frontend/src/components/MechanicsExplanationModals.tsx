// ============================================
// FILE: defipoly-frontend/src/components/MechanicsExplanationModals.tsx
// Explanation modals for game mechanics
// ============================================

'use client';

import { X, Home, Shield, Swords, Coins, TrendingUp, Lock, Zap, Target } from 'lucide-react';

// ============================================
// BUY PROPERTY MODAL
// ============================================

interface BuyPropertyExplanationModalProps {
  onClose: () => void;
  onProceed: () => void;
}

export function BuyPropertyExplanationModal({ onClose, onProceed }: BuyPropertyExplanationModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-md w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-green-900/50 to-emerald-800/50 border-b border-green-500/30 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8 text-green-300" />
              <h2 className="text-2xl font-black text-green-100">Buy Property</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-green-300 hover:text-white transition-colors hover:bg-green-800/50 rounded-lg p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-green-900/30 rounded-xl p-4 border border-green-500/20">
            <div className="flex items-start gap-3">
              <Coins className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-green-100 mb-2">How It Works</h3>
                <p className="text-green-200 text-sm leading-relaxed">
                  Purchase property slots to start earning passive daily income. Each slot generates revenue automatically, deposited into your account every day.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-900/30 rounded-xl p-4 border border-green-500/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-green-100 mb-2">Set Bonus</h3>
                <p className="text-green-200 text-sm leading-relaxed">
                  Own all properties in a set to unlock a <span className="font-bold text-green-300">+40% income bonus</span>. The bonus applies to your minimum owned slots across the set.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-200 mb-2">Set Cooldown</h3>
                <p className="text-amber-200 text-sm leading-relaxed">
                  After purchasing from a set, there's a cooldown before you can buy a <span className="font-bold">different property</span> in that set. You can still buy more of the same property!
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onProceed();
              onClose();
            }}
            className="w-full py-3 rounded-xl font-bold text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg transition-all"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SHIELD PROPERTY MODAL
// ============================================

interface ShieldPropertyExplanationModalProps {
  onClose: () => void;
  onProceed: () => void;
}

export function ShieldPropertyExplanationModal({ onClose, onProceed }: ShieldPropertyExplanationModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-md w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-900/50 to-amber-700/50 border-b border-yellow-500/30 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-yellow-300" />
              <h2 className="text-2xl font-black text-yellow-100">Shield Property</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-yellow-300 hover:text-white transition-colors hover:bg-yellow-800/50 rounded-lg p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-100 mb-2">Protection</h3>
                <p className="text-yellow-200 text-sm leading-relaxed">
                  Shield your property slots to protect them from being stolen by other players. Shielded slots are <span className="font-bold text-yellow-300">completely safe</span> during the protection period.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <Coins className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-100 mb-2">Cost</h3>
                <p className="text-yellow-200 text-sm leading-relaxed">
                  Shield cost is based on your property's daily income. The fee is calculated per slot and scales with the property's value. <span className="font-bold text-yellow-300">90% goes to the reward pool</span>, 10% to development.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-100 mb-2">Duration</h3>
                <p className="text-yellow-200 text-sm leading-relaxed">
                  Shields last for a set period. You'll see a countdown timer showing remaining protection time. Plan your shield activations strategically!
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onProceed();
              onClose();
            }}
            className="w-full py-3 rounded-xl font-bold text-base bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white shadow-lg transition-all"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STEAL PROPERTY MODAL
// ============================================

interface StealPropertyExplanationModalProps {
  onClose: () => void;
  onProceed: () => void;
}

export function StealPropertyExplanationModal({ onClose, onProceed }: StealPropertyExplanationModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-md w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-900/50 to-rose-800/50 border-b border-red-500/30 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Swords className="w-8 h-8 text-red-300" />
              <h2 className="text-2xl font-black text-red-100">Steal Property</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-red-300 hover:text-white transition-colors hover:bg-red-800/50 rounded-lg p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-900/30 rounded-xl p-4 border border-red-500/20">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-100 mb-2">Two Ways to Steal</h3>
                <p className="text-red-200 text-sm leading-relaxed mb-2">
                  <span className="font-bold text-red-300">Targeted:</span> Attack a specific player's unshielded slot (25% success rate)
                </p>
                <p className="text-red-200 text-sm leading-relaxed">
                  <span className="font-bold text-red-300">Random:</span> Steal from any random unshielded slot on the property (33% success rate)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-900/30 rounded-xl p-4 border border-red-500/20">
            <div className="flex items-start gap-3">
              <Coins className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-100 mb-2">Cost & Risk</h3>
                <p className="text-red-200 text-sm leading-relaxed">
                  Each steal attempt costs 50% of the property's slot price. <span className="font-bold text-red-300">You pay regardless of success or failure</span>. The fee goes to the reward pool.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-200 mb-2">Shielded Slots</h3>
                <p className="text-amber-200 text-sm leading-relaxed">
                  You cannot steal from shielded slots. Only unprotected slots are vulnerable. Check if a property has active shields before attempting!
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onProceed();
              onClose();
            }}
            className="w-full py-3 rounded-xl font-bold text-base bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg transition-all"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}