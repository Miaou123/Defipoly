'use client';

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
      
      if (tier.threshold > 0 && remaining > tier.threshold) {
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
              <Coins className="w-8 h-8 text-yellow-300" />
              <h2 className="text-2xl font-black text-yellow-100">Reward Coins</h2>
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
              <Star className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-100 mb-2">Current Status</h3>
                <p className="text-yellow-200 text-sm leading-relaxed">
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
                      Reach ${ACCUMULATION_TIERS[0].threshold.toLocaleString()} to start earning bonus rewards!
                    </>
                  )}
                  {tierCount > 0 && (
                    <>
                      <br />
                      <span className="text-yellow-300">{tierCount} coin{tierCount !== 1 ? 's' : ''}</span> unlocked around the bank
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-100 mb-2">Accumulation Bonus Tiers</h3>
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
          </div>

          <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-200 mb-2">Layered Bonus System</h3>
                <p className="text-amber-200 text-sm leading-relaxed mb-2">
                  Your bonus grows progressively! Each tier's bonus rate only applies to the portion of rewards within that tier's range, creating a fair and balanced reward structure.
                </p>
                {nextTier && (
                  <p className="text-amber-300 text-sm font-semibold">
                    Next milestone: ${nextTier.threshold.toLocaleString()} for {nextTier.bonus}% bonus
                  </p>
                )}
                {!nextTier && (
                  <p className="text-amber-300 text-sm font-semibold">
                    🎉 Maximum tier reached! Your bonus: ${Math.floor(progressiveBonus).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

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