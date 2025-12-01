// ============================================
// FILE: defipoly-frontend/src/components/RewardsPanel.tsx
// Rewards display with neon bank counter design
// ============================================

'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useRewards } from '@/contexts/RewardsContext';
import { useDefipoly } from '@/contexts/DefipolyContext';
import { useGameState } from '@/contexts/GameStateContext';
import { useNotification } from '../contexts/NotificationContext';
import { StyledWalletButton } from './StyledWalletButton';
import { PROGRAM_ID, TOKEN_TICKER } from '@/utils/constants';
import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import idl from '@/idl/defipoly_program.json';
import { BuildingIcon, WalletIcon, GiftIcon, TargetIcon, ShieldIcon } from './icons/UIIcons';
import { Bank3D_View, Logo3D_View } from './3d/DynamicViews';
import { getProfile, ProfileData } from '@/utils/profileStorage';

interface Floater {
  id: number;
  amount: number;
  x: number;
  size: number;
}

interface RewardsPanelProps {
  incomeArrived?: number | null;
  scaleFactor?: number;
}

export function RewardsPanel({ incomeArrived = null, scaleFactor = 1 }: RewardsPanelProps) {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { unclaimedRewards, dailyIncome, loading: rewardsLoading } = useRewards();
  const { claimRewards, loading: claimLoading } = useDefipoly();
  const { showSuccess, showError } = useNotification();
  const [claiming, setClaiming] = useState(false);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [displayedRewards, setDisplayedRewards] = useState<number>(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const floaterIdRef = useRef(0);
  const claimingRef = useRef(false);
  const initializedRef = useRef(false);
  const justClaimedRef = useRef(false);
  
  const gameState = useGameState();
  const totalSlotsOwned = gameState.stats.totalSlotsOwned || gameState.ownerships.reduce((sum, o) => sum + o.slotsOwned, 0);
  const floaterTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch profile picture when user connects
  useEffect(() => {
    const fetchProfile = async () => {
      if (connected && publicKey) {
        try {
          const profile = await getProfile(publicKey.toString());
          setProfilePicture(profile?.profilePicture || null);
        } catch (error) {
          console.error('Error fetching profile:', error);
          setProfilePicture(null);
        }
      } else {
        setProfilePicture(null);
      }
    };
    
    fetchProfile();
  }, [connected, publicKey]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      floaterTimeoutsRef.current.forEach(t => clearTimeout(t));
      floaterTimeoutsRef.current.clear();
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    };
  }, []);

  // Initialize displayedRewards from blockchain value
  useEffect(() => {
    // Only initialize if we haven't yet AND we're not in the middle of claiming AND didn't just claim
    if (!initializedRef.current && unclaimedRewards > 0 && !claimingRef.current && !justClaimedRef.current) {
      setDisplayedRewards(unclaimedRewards);
      initializedRef.current = true;
    }
  }, [unclaimedRewards]);

  // Sync with blockchain when rewards go to 0 (claimed on-chain)
  useEffect(() => {
    if (unclaimedRewards === 0 && initializedRef.current && !claimingRef.current) {
      initializedRef.current = false;
      justClaimedRef.current = false;
      setDisplayedRewards(0);
    }
  }, [unclaimedRewards]);

  // Handle income arrival with floater animation
  useEffect(() => {
    // Don't add income if we just claimed
    if (justClaimedRef.current) return;
    
    if (incomeArrived && incomeArrived > 0) {
      // Create floater
      const newFloater: Floater = {
        id: floaterIdRef.current++,
        amount: incomeArrived,
        x: (Math.random() - 0.5) * 60,
        size: Math.min(24, Math.max(14, 14 + Math.log10(incomeArrived + 1) * 3)),
      };
      
      setFloaters(prev => [...prev, newFloater]);
      
      // Pulse the bank
      setIsPulsing(true);
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = setTimeout(() => setIsPulsing(false), 150);
      
      // Animate the counter up
      const duration = 1500;
      const startTime = Date.now();
      const startValue = displayedRewards;
      const endValue = startValue + incomeArrived;
      
      const animate = () => {
        // Stop animation if we claimed during it
        if (justClaimedRef.current) return;
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        setDisplayedRewards(startValue + (incomeArrived * eased));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
      
      // Remove floater after animation
      const timeout = setTimeout(() => {
        setFloaters(prev => prev.filter(f => f.id !== newFloater.id));
      }, 2000);
      floaterTimeoutsRef.current.add(timeout);
    }
  }, [incomeArrived]);

  // Claim rewards handler
  const handleClaimRewards = async () => {
    if (!connected || !publicKey || displayedRewards === 0 || claiming || claimingRef.current) return;
    
    claimingRef.current = true;
    setClaiming(true);
    
    // Store the amount before resetting
    const amountToClaim = displayedRewards;
    
    try {
      const signature = await claimRewards();
      
      if (signature) {
        // Reset immediately on successful signature
        setDisplayedRewards(0);
        initializedRef.current = false;
        justClaimedRef.current = true;
        
        // Reset justClaimed after 10 seconds to allow re-initialization
        setTimeout(() => {
          justClaimedRef.current = false;
        }, 10000);
        
        try {
          const tx = await connection.getTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          });
          
          let actualClaimedAmount = amountToClaim;
          
          if (tx?.meta?.logMessages) {
            const coder = new BorshCoder(idl as any);
            const eventParser = new EventParser(PROGRAM_ID, coder);
            const events = eventParser.parseLogs(tx.meta.logMessages);
            
            for (const event of events) {
              if (event.name === 'RewardsClaimed') {
                const eventAmount = (event.data as any).amount?.toNumber?.();
                if (eventAmount) {
                  actualClaimedAmount = eventAmount / 1e9;
                }
                break;
              }
            }
          }
  
          showSuccess(
            'Rewards Claimed!', 
            `Successfully claimed ${actualClaimedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            signature !== 'already-processed' ? signature : undefined
          );
        } catch (parseError) {
          showSuccess(
            'Rewards Claimed!', 
            `Successfully claimed ${amountToClaim.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            signature !== 'already-processed' ? signature : undefined
          );
        }
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
      
      const errorMessage = String(error instanceof Error ? error.message : error);
      if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        showSuccess('Rewards Claimed!', 'Rewards have been claimed!');
        setDisplayedRewards(0);
        initializedRef.current = false;
        justClaimedRef.current = true;
        setTimeout(() => {
          justClaimedRef.current = false;
        }, 10000);
      } else {
        showError('Claim Failed', 'Failed to claim rewards. Please try again.');
      }
    } finally {
      setClaiming(false);
      claimingRef.current = false;
    }
  };

  // Format number for display
  const formatRewards = (value: number) => {
    if (value < 100000) {
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return Math.floor(value).toLocaleString();
  };

  // Format floater amount
  const formatFloater = (value: number) => {
    if (value < 0.01) return '+0.01';
    if (value < 1) return `+${value.toFixed(2)}`;
    return `+${Math.floor(value)}`;
  };

  // Not connected - show welcome screen
  if (!connected) {
    return (
      <div className="relative space-y-6 px-4 max-w-md w-full" style={{ transform: 'translateY(-40px)' }}>
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo3D_View size={160} />
          </div>
          <p className="font-orbitron text-4xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">
            Defipoly
          </p>
          <p className="text-white/60 text-base">
            Connect your Solana wallet to start playing
          </p>
        </div>
        
        <div className="flex justify-center">
          <StyledWalletButton variant="board" />
        </div>
      </div>
    );
  }

  // Connected but no properties - show tutorial
  if (totalSlotsOwned === 0) {
    return (
      <div className="relative space-y-4 px-4 max-w-sm w-full">
        <div className="text-center space-y-2">
          <p className="text-white text-xl font-bold">
            🎯 Get Started
          </p>
          <p className="text-white/60 text-sm">
            Buy your first property slot to start earning
          </p>
        </div>

        <div className="space-y-3">
          <div className="bg-black/30 backdrop-blur rounded-xl p-4 border border-purple-500/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shrink-0">
              1
            </div>
            <div>
              <div className="text-white font-semibold flex items-center gap-2">
                <BuildingIcon size={16} className="text-purple-400" />
                Pick a Property
              </div>
              <div className="text-white/50 text-sm">Choose a property card around the board</div>
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur rounded-xl p-4 border border-purple-500/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shrink-0">
              2
            </div>
            <div>
              <div className="text-white font-semibold flex items-center gap-2">
                <WalletIcon size={16} className="text-purple-400" />
                Buy slots with ${TOKEN_TICKER}
              </div>
              <div className="text-white/50 text-sm">Each slot generates passive income</div>
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur rounded-xl p-4 border border-purple-500/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shrink-0">
              3
            </div>
            <div>
              <div className="text-white font-semibold flex items-center gap-2">
                <GiftIcon size={16} className="text-purple-400" />
                Earn rewards
              </div>
              <div className="text-white/50 text-sm">Claim your accumulated rewards anytime</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/20">
          <div className="text-xs text-purple-400 font-semibold mb-2">💡 PRO TIPS</div>
          <div className="space-y-2 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <TargetIcon size={14} className="text-red-400 shrink-0" />
              <span>Steal slots from other players</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldIcon size={14} className="text-cyan-400 shrink-0" />
              <span>Shield your properties for protection</span>
            </div>
            <div className="flex items-center gap-2">
              <BuildingIcon size={14} className="text-green-400 shrink-0" />
              <span>Complete sets for bonus income</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-white/60 text-sm animate-pulse">
            ↓ Click a property to start ↓
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // Connected and owns properties - BANK + NEON COUNTER DESIGN
  // ========================================
  
  // Scale sizes based on scaleFactor - Bigger than center square but not overwhelming
  const bankWidth = Math.round(350 * scaleFactor);
  const bankHeight = Math.round(350 * scaleFactor);
  
  return (
    <div className="relative flex flex-col items-center justify-center z-30 overflow-visible">
      {rewardsLoading ? (
        <div className="text-white/60 text-center">Loading rewards...</div>
      ) : (
        <>
          {/* Bank SVG */}
          <div 
            className="relative z-30"
            style={{ width: `${bankWidth}px`, height: `${bankHeight}px` }}
          >
            <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}>
              <Bank3D_View 
                isPulsing={isPulsing} 
                size={bankWidth}
                rewardsAmount={displayedRewards}
                profilePicture={profilePicture}
                onCollect={handleClaimRewards}
              />
            </div>
            
            {/* Floating +X numbers */}
            {floaters.map(floater => (
              <div
                key={floater.id}
                className="absolute pointer-events-none font-bold"
                style={{
                  left: `calc(50% + ${floater.x * scaleFactor}px)`,
                  top: '20%',
                  fontSize: `${(floater.size + 6) * scaleFactor}px`,
                  color: '#4ade80',
                  textShadow: '0 0 10px rgba(74, 222, 128, 0.6), 0 2px 4px rgba(0,0,0,0.5)',
                  animation: 'floatUp 2s ease-out forwards',
                }}
              >
                {formatFloater(floater.amount)}
              </div>
            ))}
          </div>

        </>
      )}

      {/* Floating animation styles */}
      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
          70% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-120px) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
}