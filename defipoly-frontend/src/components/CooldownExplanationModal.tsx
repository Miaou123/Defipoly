// ============================================
// FILE: defipoly-frontend/src/components/CooldownExplanationModal.tsx
// Cooldown explanation modal - Updated with clearer messaging
// ============================================

'use client';

import { X, Clock, Shield, Zap } from 'lucide-react';

interface CooldownExplanationModalProps {
  onClose: () => void;
  cooldownHours: number;
  affectedProperties: string[];
}

export function CooldownExplanationModal({ 
  onClose, 
  cooldownHours,
  affectedProperties 
}: CooldownExplanationModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-md w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-900/50 to-purple-800/50 border-b border-purple-500/30 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-300" />
              <h2 className="text-2xl font-black text-purple-100">Set Cooldown</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-purple-300 hover:text-white transition-colors hover:bg-purple-800/50 rounded-lg p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-purple-100 mb-2">What is a Set Cooldown?</h3>
                <p className="text-purple-200 text-sm leading-relaxed mb-3">
                  When you purchase a property from this set, there's a <span className="font-bold text-purple-300">{cooldownHours}-hour cooldown</span> before you can buy a <span className="font-bold text-purple-300">different property</span> from the same set.
                </p>
                <p className="text-purple-300 text-xs leading-relaxed">
                  <span className="font-bold">Note:</span> You can still buy more slots of the same property during the cooldown!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-blue-100 mb-2">Each Set Has Its Own Cooldown</h3>
                <p className="text-blue-200 text-sm leading-relaxed">
                  Different property sets have different cooldown periods (1h to 24h). Higher-tier sets have longer cooldowns. Each set's cooldown is tracked separately.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
            <h3 className="font-bold text-purple-100 mb-2">Why does this exist?</h3>
            <p className="text-purple-200 text-sm leading-relaxed">
              Cooldowns prevent players from monopolizing entire property sets too quickly, creating a fairer and more strategic gameplay experience for everyone.
            </p>
          </div>

          {affectedProperties.length > 0 && (
            <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/20">
              <h3 className="font-bold text-amber-200 mb-2">Properties in This Set:</h3>
              <ul className="space-y-1">
                {affectedProperties.map((prop, i) => (
                  <li key={i} className="text-amber-100 text-sm flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {prop}
                  </li>
                ))}
              </ul>
              <p className="text-amber-200 text-xs mt-2 italic">
                Cooldown applies when buying between these properties
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-base bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg transition-all"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}