'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, Star, Target, Coins } from 'lucide-react';

// Reward tiers for accumulation bonuses - these determine how many coins appear
const ACCUMULATION_TIERS = [
  { threshold: 10000, bonus: 1 },      // Tier 1: $10k = 1% bonus
  { threshold: 25000, bonus: 2.5 },    // Tier 2: $25k = 2.5% bonus
  { threshold: 50000, bonus: 5 },      // Tier 3: $50k = 5% bonus
  { threshold: 100000, bonus: 10 },    // Tier 4: $100k = 10% bonus
  { threshold: 250000, bonus: 15 },    // Tier 5: $250k = 15% bonus
  { threshold: 500000, bonus: 20 },    // Tier 6: $500k = 20% bonus
  { threshold: 1000000, bonus: 25 },   // Tier 7: $1M = 25% bonus
  { threshold: 2500000, bonus: 40 }    // Tier 8: $2.5M = 40% bonus
];

interface FloatingCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardsAmount: number;
}

export function FloatingCoinsModal({ isOpen, onClose, rewardsAmount }: FloatingCoinsModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isOpen) return null;

  // Calculate how many tiers the user has reached and current bonus
  const tierCount = ACCUMULATION_TIERS.filter(tier => rewardsAmount >= tier.threshold).length;
  const currentTier = tierCount > 0 ? ACCUMULATION_TIERS[tierCount - 1] : null;
  const nextTier = tierCount < ACCUMULATION_TIERS.length ? ACCUMULATION_TIERS[tierCount] : null;

  // Calculate progressive bonus amount - matches Rust implementation
  const calculateProgressiveBonus = () => {
    let totalBonus = 0;
    let remaining = rewardsAmount;
    
    // Process tiers from highest to lowest
    for (let i = ACCUMULATION_TIERS.length - 1; i >= 0; i--) {
      const tier = ACCUMULATION_TIERS[i];
      
      if (tier && tier.threshold > 0 && remaining > tier.threshold) {
        // Amount in this tier bracket (above this threshold)
        const amountInTier = remaining - tier.threshold;
        const tierBonus = (amountInTier * tier.bonus) / 100;
        
        totalBonus += tierBonus;
        remaining = tier.threshold;
      }
    }
    
    return totalBonus;
  };
  
  const progressiveBonus = calculateProgressiveBonus();

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-black/95 backdrop-blur-xl rounded-xl border border-yellow-500/30 max-w-[320px] w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-500/20">
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Bonus Coins</h2>
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
          <div className="space-y-0">
            <div className="flex items-start gap-3 py-3 border-b border-yellow-500/10">
              <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-100 mb-2 text-sm">Current Status</h3>
                <p className="text-yellow-200 text-xs leading-relaxed">
                  Pending rewards: <span className="font-bold text-yellow-300">${rewardsAmount.toLocaleString()}</span>
                  {progressiveBonus > 0 && (
                    <>
                      <br />
                      Bonus when claimed: <span className="font-bold text-yellow-300">${Math.floor(progressiveBonus).toLocaleString()}</span>
                      <br />
                      Total payout: <span className="font-bold text-yellow-300">${Math.floor(rewardsAmount + progressiveBonus).toLocaleString()}</span>
                    </>
                  )}
                  {progressiveBonus === 0 && (
                    <>
                      <br />
                      Reach ${ACCUMULATION_TIERS[0]?.threshold?.toLocaleString() || 0} to start earning bonus rewards!
                    </>
                  )}
                  {tierCount > 0 && (
                    <>
                      <br />
                      <span className="text-yellow-300">Tier {tierCount}</span> bonus unlocked!
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3 border-b border-yellow-500/10">
              <Target className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-100 mb-2 text-sm">Accumulation Bonus Tiers</h3>
                <div className="space-y-2">
                  {ACCUMULATION_TIERS.map((tier, index) => {
                    const unlocked = rewardsAmount >= tier.threshold;
                    return (
                      <div key={tier.threshold} className={`flex items-center justify-between text-xs ${
                        unlocked ? 'text-yellow-300' : 'text-yellow-600'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            unlocked ? 'bg-yellow-400' : 'bg-yellow-800'
                          }`} />
                          <span>Tier {index + 1}: ${tier.threshold.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={unlocked ? 'text-yellow-400 font-bold' : ''}>{tier.bonus}% bonus</span>
                          {unlocked && <span className="text-yellow-400">✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3">
              <TrendingUp className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-200 mb-2 text-sm">Layered Bonus System</h3>
                <p className="text-amber-200 text-xs leading-relaxed mb-2">
                  Your bonus grows progressively! Each tier's bonus rate only applies to the portion of rewards within that tier's range, creating a fair and balanced reward structure.
                </p>
                {nextTier && (
                  <p className="text-amber-300 text-xs font-semibold">
                    Next milestone: ${nextTier.threshold.toLocaleString()} for {nextTier.bonus}% bonus
                  </p>
                )}
                {!nextTier && (
                  <p className="text-amber-300 text-xs font-semibold">
                    🎉 Maximum tier reached! Your bonus: ${Math.floor(progressiveBonus).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Got It Button */}
        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg font-semibold text-sm transition-all bg-yellow-600/40 hover:bg-yellow-600/60 border border-yellow-500/50 text-yellow-100 hover:border-yellow-400/70"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}