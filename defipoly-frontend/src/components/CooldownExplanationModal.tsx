// ============================================
// FILE: defipoly-frontend/src/components/CooldownExplanationModal.tsx
// Cooldown explanation modal - Updated with clearer messaging
// ============================================

'use client';

import { X, Clock } from 'lucide-react';

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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-purple-950/98 via-purple-900/98 to-purple-950/98 backdrop-blur-xl rounded-xl border-2 border-orange-500/40 shadow-2xl shadow-orange-500/20 max-w-sm w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-900/50 to-orange-800/50 border-b border-orange-500/30 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-300" />
              <h2 className="text-lg font-bold text-orange-100">Cooldown Active</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-orange-300 hover:text-white transition-colors hover:bg-orange-800/50 rounded-lg p-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content - Simple and Clear */}
        <div className="p-4 space-y-3">
          <p className="text-orange-200 text-sm leading-relaxed">
            After buying a property from this set, you must wait <span className="font-bold text-orange-300">{cooldownHours} hours</span> before buying a different property from the same set.
          </p>
          
          <p className="text-orange-300 text-xs">
            💡 <span className="font-bold">Tip:</span> You can still buy more slots of the same property!
          </p>

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