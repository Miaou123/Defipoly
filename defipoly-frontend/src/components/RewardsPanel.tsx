// ============================================
// FILE: defipoly-frontend/src/components/RewardsPanel.tsx
// Rewards display with particle-based counting
// ============================================

'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useRewards } from '@/hooks/useRewards';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useGameState } from '@/contexts/GameStateContext';
import { useNotification } from '../contexts/NotificationContext';
import { StyledWalletButton } from './StyledWalletButton';
import { PROGRAM_ID, TOKEN_TICKER } from '@/utils/constants';
import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import idl from '@/idl/defipoly_program.json';
import { BuildingIcon, WalletIcon, GiftIcon, TargetIcon, ShieldIcon } from './icons/UIIcons';
import { BankSVG } from './icons/GameAssets';

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
  const floaterIdRef = useRef(0);
  const claimingRef = useRef(false);
  const initializedRef = useRef(false);
  
  const gameState = useGameState();
  const totalSlotsOwned = gameState.stats.totalSlotsOwned || gameState.ownerships.reduce((sum, o) => sum + o.slotsOwned, 0);
  const floaterTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (!initializedRef.current && unclaimedRewards > 0) {
      setDisplayedRewards(unclaimedRewards);
      initializedRef.current = true;
    }
  }, [unclaimedRewards]);

  // Periodically sync with blockchain value (in case of drift)
  useEffect(() => {
    if (initializedRef.current && unclaimedRewards > 0) {
      // Only sync if blockchain is significantly different (>5% difference)
      const diff = Math.abs(displayedRewards - unclaimedRewards);
      const threshold = unclaimedRewards * 0.05;
      if (diff > threshold) {
        setDisplayedRewards(unclaimedRewards);
      }
    }
  }, [unclaimedRewards, displayedRewards]);

  // Handle income arrival from particles
  useEffect(() => {
    if (incomeArrived !== null && incomeArrived > 0) {
      // Add to displayed rewards
      setDisplayedRewards(prev => prev + incomeArrived);
      
      // Trigger pulse
      setIsPulsing(true);
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = setTimeout(() => setIsPulsing(false), 300);
      
      // Create floater
      const id = floaterIdRef.current++;
      const x = Math.random() * 60 - 30;
      const size = 20 + Math.random() * 8; // 20-28px
      
      setFloaters(prev => {
        // Safety: limit max floaters
        if (prev.length > 40) {
          return [...prev.slice(-20), { id, amount: incomeArrived, x, size }];
        }
        return [...prev, { id, amount: incomeArrived, x, size }];
      });
      
      const timeout = setTimeout(() => {
        setFloaters(prev => prev.filter(f => f.id !== id));
        floaterTimeoutsRef.current.delete(timeout);
      }, 2000);
      floaterTimeoutsRef.current.add(timeout);
    }
  }, [incomeArrived]);

  // Reset counter after claiming
  const handleClaimRewards = async () => {
    if (!connected || !publicKey || displayedRewards === 0 || claiming || claimingRef.current) return;
    
    claimingRef.current = true;
    setClaiming(true);
    
    try {
      const signature = await claimRewards();
      
      if (signature) {
        let actualClaimedAmount = 0;
        
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const tx = await connection.getTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          });
  
          if (tx?.meta?.logMessages) {
            const coder = new BorshCoder(idl as any);
            const eventParser = new EventParser(PROGRAM_ID, coder);
            const events = eventParser.parseLogs(tx.meta.logMessages);
            
            for (const event of events) {
              if (event.name === 'RewardsClaimedEvent' || event.name === 'rewardsClaimedEvent') {
                actualClaimedAmount = Number(event.data.amount);
                break;
              }
            }
          }
          
          const claimedAmount = actualClaimedAmount > 0 ? actualClaimedAmount : displayedRewards;
  
          showSuccess(
            'Rewards Claimed!', 
            `Successfully claimed ${(claimedAmount / 1e9).toFixed(2)}`,
            signature !== 'already-processed' ? signature : undefined
          );
          
          // Reset counter after claim
          setDisplayedRewards(0);
          initializedRef.current = false;
        } catch (parseError) {
          showSuccess(
            'Rewards Claimed!', 
            `Successfully claimed rewards!`,
            signature !== 'already-processed' ? signature : undefined
          );
          setDisplayedRewards(0);
          initializedRef.current = false;
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
      <div className="relative space-y-6 px-4 max-w-md w-full">
        <div className="text-center space-y-4">
          <img 
            src="/logo.svg" 
            alt="Defipoly Logo" 
            className="w-24 h-24 mx-auto"
          />
          <p className="text-white text-4xl font-bold">
            Welcome to Defipoly
          </p>
          <p className="text-white/60 text-base">
            Connect your Solana wallet to start playing
          </p>
        </div>
        
        <div className="flex justify-center">
          <StyledWalletButton variant="board" />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="bg-black/20 backdrop-blur rounded-xl p-4 text-center border border-purple-500/20 hover:border-purple-500/40 transition-all">
            <BuildingIcon size={32} className="mx-auto mb-2 text-purple-400" />
            <div className="text-xs text-white/80 font-semibold">Buy Properties</div>
          </div>
          <div className="bg-black/20 backdrop-blur rounded-xl p-4 text-center border border-purple-500/20 hover:border-purple-500/40 transition-all">
            <GiftIcon size={32} className="mx-auto mb-2 text-purple-400" />
            <div className="text-xs text-white/80 font-semibold">Earn Rewards</div>
          </div>
          <div className="bg-black/20 backdrop-blur rounded-xl p-4 text-center border border-purple-500/20 hover:border-purple-500/40 transition-all">
            <TargetIcon size={32} className="mx-auto mb-2 text-purple-400" />
            <div className="text-xs text-white/80 font-semibold">Steal Slots</div>
          </div>
        </div>

        <div className="text-center text-white/40 text-xs">
          <p>Powered by Solana</p>
        </div>
      </div>
    );
  }

  // Connected but owns 0 properties - show How to Play guide
  if (totalSlotsOwned === 0) {
    return (
      <div className="relative space-y-6 px-4 max-w-md w-full">
        <div className="text-center">
          <div className="text-3xl mb-2">🎲</div>
          <h2 className="text-2xl font-bold text-white mb-1">How to Play Defipoly</h2>
          <p className="text-white/50 text-sm">Get started in 3 steps</p>
        </div>

        <div className="space-y-3">
          <div className="bg-black/30 backdrop-blur rounded-xl p-4 border border-purple-500/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shrink-0">
              1
            </div>
            <div>
              <div className="text-white font-semibold flex items-center gap-2">
                <BuildingIcon size={16} className="text-purple-400" />
                Click any property
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
  // Connected and owns properties - BANK DESIGN
  // ========================================
  
  // Scale sizes based on scaleFactor
  const bankWidth = Math.round(220 * scaleFactor);
  const bankHeight = Math.round(160 * scaleFactor);
  const rewardsTextSize = Math.max(16, Math.round(36 * scaleFactor));
  const labelTextSize = Math.max(8, Math.round(10 * scaleFactor));
  const buttonPaddingX = Math.max(16, Math.round(32 * scaleFactor));
  const buttonPaddingY = Math.max(6, Math.round(10 * scaleFactor));
  const buttonTextSize = Math.max(10, Math.round(14 * scaleFactor));
  const incomeTextSize = Math.max(10, Math.round(14 * scaleFactor));
  const marginTop = Math.max(8, Math.round(20 * scaleFactor));
  
  return (
    <div className="relative flex flex-col items-center justify-center z-30">
      {rewardsLoading ? (
        <div className="text-white/60 text-center">Loading rewards...</div>
      ) : (
        <>
          {/* Bank SVG */}
          <div 
            className="relative z-30"
            style={{ width: `${bankWidth}px`, height: `${bankHeight}px` }}
          >
            <BankSVG isPulsing={isPulsing} className="w-full h-full" />
            
            {/* Floating +X numbers */}
            {floaters.map(floater => (
              <div
                key={floater.id}
                className="absolute pointer-events-none font-bold"
                style={{
                  left: `calc(50% + ${floater.x * scaleFactor}px)`,
                  top: '20%',
                  fontSize: `${floater.size * scaleFactor}px`,
                  color: '#4ade80',
                  textShadow: '0 0 10px rgba(74, 222, 128, 0.6), 0 2px 4px rgba(0,0,0,0.5)',
                  animation: 'floatUp 2s ease-out forwards',
                }}
              >
                {formatFloater(floater.amount)}
              </div>
            ))}
          </div>

          {/* Rewards display */}
          <div className="text-center" style={{ marginTop: `${marginTop}px` }}>
            <div 
              className="font-bold tabular-nums"
              style={{
                fontSize: `${rewardsTextSize}px`,
                color: '#fbbf24',
                textShadow: displayedRewards > 0 ? '0 0 25px rgba(251, 191, 36, 0.5)' : 'none',
              }}
            >
              {formatRewards(displayedRewards)}
            </div>

            {/* Collect button */}
            {displayedRewards > 0 && (
              <button
                onClick={handleClaimRewards}
                disabled={claiming || claimLoading}
                className="rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  marginTop: `${marginTop}px`,
                  padding: `${buttonPaddingY}px ${buttonPaddingX}px`,
                  fontSize: `${buttonTextSize}px`,
                  background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                  color: '#fff',
                }}
                onMouseEnter={(e) => {
                  if (!claiming && !claimLoading) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 25px rgba(168, 85, 247, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {claiming ? '...' : 'Collect'}
              </button>
            )}
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