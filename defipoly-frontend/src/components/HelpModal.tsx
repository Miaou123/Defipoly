'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingCart, Shield, TrendingDown, TrendingUp, Zap, Clock, Target, AlertTriangle, Star, DollarSign, Home } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'buy' | 'shield' | 'sell' | 'steal';
  onProceed?: () => void; // Optional for desktop usage
  isMobile?: boolean; // Auto-detected if not provided
}

export function HelpModal({ isOpen, onClose, type, onProceed, isMobile: providedIsMobile }: HelpModalProps) {
  const [detectedIsMobile, setDetectedIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setDetectedIsMobile(window.innerWidth < 1024 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use provided isMobile or detected value
  const isMobile = providedIsMobile !== undefined ? providedIsMobile : detectedIsMobile;

  if (!isOpen) return null;

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'buy': return { border: 'border-green-500/30', icon: 'text-green-400', accent: 'text-green-400' };
      case 'shield': return { border: 'border-cyan-500/30', icon: 'text-cyan-400', accent: 'text-cyan-400' };
      case 'sell': return { border: 'border-orange-500/30', icon: 'text-orange-400', accent: 'text-orange-400' };
      case 'steal': return { border: 'border-red-500/30', icon: 'text-red-400', accent: 'text-red-400' };
      default: return { border: 'border-purple-500/30', icon: 'text-purple-400', accent: 'text-purple-400' };
    }
  };

  const colors = getColorClasses(type);

  const getIcon = () => {
    switch (type) {
      case 'buy': return <Home className={`w-6 h-6 ${colors.icon}`} />;
      case 'shield': return <Shield className={`w-6 h-6 ${colors.icon}`} />;
      case 'sell': return <TrendingDown className={`w-6 h-6 ${colors.icon}`} />;
      case 'steal': return <Zap className={`w-6 h-6 ${colors.icon}`} />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'buy': return 'Buy Property';
      case 'shield': return 'Shield Property';
      case 'sell': return 'Sell Property';
      case 'steal': return 'Steal Property';
    }
  };

  const getContent = () => {
    switch (type) {
      case 'buy':
        return (
          <div className="space-y-0">
            <div className="flex items-start gap-3 py-3 border-b border-green-500/10">
              <DollarSign className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-green-100 mb-2 text-sm">How It Works</h3>
                <p className="text-green-200 text-xs leading-relaxed">
                  Purchase property slots to start earning passive daily income. Each slot generates revenue that <span className="font-bold text-green-300">must be claimed</span>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3 border-b border-green-500/10">
              <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-green-100 mb-2 text-sm">Set Bonus</h3>
                <p className="text-green-200 text-xs leading-relaxed mb-2">
                  Own all properties in a color set to unlock a <span className="font-bold text-green-300">income bonus</span>. The bonus applies to your minimum owned slots across the set.
                </p>
                <p className="text-green-300 text-xs leading-relaxed">
                  <span className="font-bold">Example:</span> If you own 5 slots of Property A and 3 slots of Property B in the same set, the +40% bonus applies to 3 slots of each property (the minimum).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3">
              <Clock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-200 mb-2 text-sm">Set Cooldown</h3>
                <p className="text-amber-200 text-xs leading-relaxed mb-2">
                  After purchasing from a set, there's a cooldown before you can buy a <span className="font-bold">different property</span> in that set. You can still buy more of the same property!
                </p>
                <p className="text-blue-200 text-xs">
                  💡 <span className="font-semibold">Pro tip:</span> Stealing bypasses this cooldown - you can steal from any property regardless of set cooldowns!
                </p>
              </div>
            </div>
          </div>
        );

      case 'shield':
        return (
          <div className="space-y-0">
            <div className="flex items-start gap-3 py-3 border-b border-cyan-500/10">
              <Shield className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-cyan-100 mb-2 text-sm">Protection</h3>
                <p className="text-cyan-200 text-xs leading-relaxed">
                  Shield your property slots to protect them from being stolen by other players. Shielded slots are <span className="font-bold text-cyan-300">completely safe</span> during the protection period.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3 border-b border-cyan-500/10">
              <Clock className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-cyan-100 mb-2 text-sm">Duration & Cooldown</h3>
                <p className="text-cyan-200 text-xs leading-relaxed mb-2">
                  Choose how long to shield your slots (1-48 hours). After the shield expires, there's a <span className="font-bold text-cyan-300">cooldown period</span> before you can reactivate.
                </p>
                <p className="text-cyan-300 text-xs leading-relaxed">
                  <span className="font-bold">Cooldown:</span> The cooldown is 25% of your shield duration. Example: 24h shield = 6h cooldown.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3">
              <DollarSign className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-200 mb-2 text-sm">Cost</h3>
                <p className="text-amber-200 text-xs leading-relaxed">
                  Shield cost is 5% of your property's daily income per hour. Longer shields cost more but provide better protection.
                </p>
              </div>
            </div>
          </div>
        );

      case 'sell':
        return (
          <div className="space-y-0">
            <div className="flex items-start gap-3 py-3 border-b border-orange-500/10">
              <DollarSign className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-orange-100 mb-2 text-sm">How It Works</h3>
                <p className="text-orange-200 text-xs leading-relaxed">
                  Sell your property slots to liquidate your position. The sell value increases the longer you hold the property.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3 border-b border-orange-500/10">
              <TrendingUp className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-orange-100 mb-2 text-sm">Sell Value</h3>
                <p className="text-orange-200 text-xs leading-relaxed mb-2">
                  Base sell value is <span className="font-bold text-orange-300">15%</span> of the buy price, increasing up to <span className="font-bold text-orange-300">30%</span> after holding for 14 days.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-200 mb-2 text-sm">Important</h3>
                <p className="text-amber-200 text-xs leading-relaxed">
                  Selling slots will reduce your daily income. Plan your sales strategically!
                </p>
              </div>
            </div>
          </div>
        );

      case 'steal':
        return (
          <div className="space-y-0">
            <div className="flex items-start gap-3 py-3 border-b border-red-500/10">
              <Target className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-100 mb-2 text-sm">How It Works & Cost</h3>
                <p className="text-red-200 text-xs leading-relaxed mb-2">
                  Attempt to steal <span className="font-bold text-red-300">1 slot</span> from a random unshielded owner of the property. Success rate is <span className="font-bold text-red-300">33%</span>.
                </p>
                <p className="text-red-200 text-xs leading-relaxed">
                  Each attempt costs <span className="font-bold text-red-300">50%</span> of the property's slot price. <span className="font-bold text-red-300">You pay this cost regardless of success or failure.</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3 border-b border-red-500/10">
              <Clock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-200 mb-2 text-sm">Cooldown</h3>
                <p className="text-amber-200 text-xs leading-relaxed">
                  After a steal attempt, there's a cooldown before you can steal again from the same property.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3">
              <Star className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-200 mb-2 text-sm">⚡ Important Strategy</h3>
                <p className="text-yellow-200 text-xs leading-relaxed">
                  <span className="font-bold text-yellow-300">Stealing bypasses buy cooldowns!</span> If you can't buy more slots due to cooldown restrictions, you can steal to complete property sets faster.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  const modalContent = (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${
        isMobile ? 'bg-black/60' : 'bg-black/70 backdrop-blur-sm'
      }`}
      onClick={onClose}
    >
      <div 
        className={`backdrop-blur-xl rounded-xl border ${colors.border} max-w-[320px] w-full overflow-hidden ${
          isMobile ? 'bg-black/95' : 'bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-500/20">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h2 className="text-lg font-bold text-white">{getTitle()}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400/50 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {getContent()}
        </div>

        {/* Got It Button */}
        <div className="p-4 pt-0">
          <button
            onClick={() => {
              if (onProceed) {
                onProceed();
              }
              onClose();
            }}
            className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${
              type === 'buy' 
                ? 'bg-emerald-600/40 hover:bg-emerald-600/60 border border-emerald-500/50 text-emerald-100 hover:border-emerald-400/70'
                : type === 'shield'
                ? 'bg-blue-600/40 hover:bg-blue-600/60 border border-blue-500/50 text-blue-100 hover:border-blue-400/70'
                : type === 'sell'
                ? 'bg-orange-600/40 hover:bg-orange-600/60 border border-orange-500/50 text-orange-100 hover:border-orange-400/70'
                : 'bg-red-600/40 hover:bg-red-600/60 border border-red-500/50 text-red-100 hover:border-red-400/70'
            }`}
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );

  // Use createPortal for mobile to escape z-index constraints, regular render for desktop
  return isMobile ? createPortal(modalContent, document.body) : modalContent;
}

// Export individual components for backward compatibility if needed
export function BuyPropertyExplanationModal({ onClose, onProceed }: { onClose: () => void; onProceed: () => void }) {
  return <HelpModal isOpen={true} onClose={onClose} type="buy" onProceed={onProceed} isMobile={false} />;
}

export function SellPropertyExplanationModal({ onClose, onProceed }: { onClose: () => void; onProceed: () => void }) {
  return <HelpModal isOpen={true} onClose={onClose} type="sell" onProceed={onProceed} isMobile={false} />;
}

export function ShieldPropertyExplanationModal({ onClose, onProceed }: { onClose: () => void; onProceed: () => void }) {
  return <HelpModal isOpen={true} onClose={onClose} type="shield" onProceed={onProceed} isMobile={false} />;
}

export function StealPropertyExplanationModal({ onClose, onProceed }: { onClose: () => void; onProceed: () => void }) {
  return <HelpModal isOpen={true} onClose={onClose} type="steal" onProceed={onProceed} isMobile={false} />;
}

// Mobile-specific export (though they can use the same HelpModal)
export function MobileHelpModal(props: Omit<HelpModalProps, 'isMobile'>) {
  return <HelpModal {...props} isMobile={true} />;
}