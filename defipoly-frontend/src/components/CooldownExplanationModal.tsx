// ============================================
// FILE: defipoly-frontend/src/components/CooldownExplanationModal.tsx
// Cooldown explanation modal
// ============================================

'use client';

import { X, Clock, Shield } from 'lucide-react';

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
                <p className="text-purple-200 text-sm leading-relaxed">
                  When you purchase a property from a set, there's a <span className="font-bold text-purple-300">{cooldownHours}-hour cooldown</span> before you can buy another property from the same set.
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
              <h3 className="font-bold text-amber-200 mb-2">Affected Properties:</h3>
              <ul className="space-y-1">
                {affectedProperties.map((prop, i) => (
                  <li key={i} className="text-amber-100 text-sm flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {prop}
                  </li>
                ))}
              </ul>
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