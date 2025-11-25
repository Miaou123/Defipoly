// ============================================
// FILE: MechanicsExplanationModals.tsx
// Reworked explanation modals for game mechanics
// ============================================

'use client';

import { X, Home, Shield, Swords, Coins, TrendingUp, Lock, Clock, Zap, Target, DollarSign } from 'lucide-react';

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
                  Purchase property slots to start earning passive daily income. Each slot generates revenue that <span className="font-bold text-green-300">must be claimed</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-900/30 rounded-xl p-4 border border-green-500/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-green-100 mb-2">Set Bonus</h3>
                <p className="text-green-200 text-sm leading-relaxed mb-2">
                  Own all properties in a color set to unlock a <span className="font-bold text-green-300">income bonus</span>. The bonus applies to your minimum owned slots across the set.
                </p>
                <p className="text-green-300 text-xs leading-relaxed bg-green-900/30 rounded p-2">
                  <span className="font-bold">Example:</span> If you own 5 slots of Property A and 3 slots of Property B in the same set, the +40% bonus applies to 3 slots of each property (the minimum).
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
            className="w-full py-2 rounded-lg font-semibold text-sm transition-all bg-emerald-600/40 hover:bg-emerald-600/60 border border-emerald-500/50 text-emerald-100 hover:border-emerald-400/70"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SELL PROPERTY MODAL
// ============================================

interface SellPropertyExplanationModalProps {
  onClose: () => void;
  onProceed: () => void;
}

export function SellPropertyExplanationModal({ onClose, onProceed }: SellPropertyExplanationModalProps) {
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
        <div className="relative bg-gradient-to-r from-orange-900/50 to-red-800/50 border-b border-orange-500/30 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-orange-300" />
              <h2 className="text-2xl font-black text-orange-100">Sell Property</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-orange-300 hover:text-white transition-colors hover:bg-orange-800/50 rounded-lg p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-orange-900/30 rounded-xl p-4 border border-orange-500/20">
            <div className="flex items-start gap-3">
              <Coins className="w-5 h-5 text-orange-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-orange-100 mb-2">How It Works</h3>
                <p className="text-orange-200 text-sm leading-relaxed">
                  Sell your property slots to liquidate your position. The sell value increases the longer you hold the property.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-900/30 rounded-xl p-4 border border-orange-500/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-orange-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-orange-100 mb-2">Sell Value</h3>
                <p className="text-orange-200 text-sm leading-relaxed mb-2">
                  Base sell value is <span className="font-bold text-orange-300">15%</span> of the buy price, increasing up to <span className="font-bold text-orange-300">30%</span> after holding for 14 days.
                </p>
                <p className="text-orange-300 text-xs leading-relaxed bg-orange-900/30 rounded p-2">
                  <span className="font-bold">Tip:</span> Hold your properties longer for better returns when selling!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-200 mb-2">Important</h3>
                <p className="text-amber-200 text-sm leading-relaxed">
                  Selling slots will reduce your daily income. Plan your sales strategically!
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onProceed();
              onClose();
            }}
            className="w-full py-2 rounded-lg font-semibold text-sm transition-all bg-orange-600/40 hover:bg-orange-600/60 border border-orange-500/50 text-orange-100 hover:border-orange-400/70"
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
              <Clock className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-100 mb-2">Duration & Cooldown</h3>
                <p className="text-yellow-200 text-sm leading-relaxed mb-2">
                  Choose how long to shield your slots (1-48 hours). After the shield expires, there's a <span className="font-bold text-yellow-300">cooldown period</span> before you can reactivate.
                </p>
                <p className="text-yellow-300 text-xs leading-relaxed bg-yellow-900/30 rounded p-2">
                  <span className="font-bold">Cooldown:</span> The cooldown is 25% of your shield duration. Example: 24h shield = 6h cooldown.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <Coins className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-200 mb-2">Cost</h3>
                <p className="text-amber-200 text-sm leading-relaxed">
                  Shield cost is 5% of your property's daily income per hour. Longer shields cost more but provide better protection.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onProceed();
              onClose();
            }}
            className="w-full py-2 rounded-lg font-semibold text-sm transition-all bg-blue-600/40 hover:bg-blue-600/60 border border-blue-500/50 text-blue-100 hover:border-blue-400/70"
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
                <h3 className="font-bold text-red-100 mb-2">How It Works</h3>
                <p className="text-red-200 text-sm leading-relaxed">
                  Attempt to steal <span className="font-bold text-red-300">1 slot</span> from a random unshielded owner of the property. Success rate is <span className="font-bold text-red-300">33%</span>.
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
                  Each steal attempt costs <span className="font-bold text-red-300">50%</span> of the property's slot price. <span className="font-bold text-red-300">You pay this cost regardless of success or failure.</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-200 mb-2">Cooldown</h3>
                <p className="text-amber-200 text-sm leading-relaxed">
                  After a steal attempt, there's a cooldown before you can steal again from the same property.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onProceed();
              onClose();
            }}
            className="w-full py-2 rounded-lg font-semibold text-sm transition-all bg-red-600/40 hover:bg-red-600/60 border border-red-500/50 text-red-100 hover:border-red-400/70"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}