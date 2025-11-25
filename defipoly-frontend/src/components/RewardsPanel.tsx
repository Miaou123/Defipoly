'use client';

import { useState, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useRewards } from '@/hooks/useRewards';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useGameState } from '@/contexts/GameStateContext';
import { useNotification } from '../contexts/NotificationContext';
import { StyledWalletButton } from './StyledWalletButton';
import { PROGRAM_ID, TOKEN_TICKER } from '@/utils/constants';
import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import idl from '@/idl/defipoly_program.json';
import { BuildingIcon, WalletIcon, GiftIcon, TargetIcon, ShieldIcon } from './icons/UIIcons';

export function RewardsPanel() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { unclaimedRewards, dailyIncome, loading: rewardsLoading } = useRewards();
  const { totalEarned } = usePlayerStats();
  const { claimRewards, loading: claimLoading } = useDefipoly();
  const { showSuccess, showError } = useNotification();
  const [claiming, setClaiming] = useState(false);
  const claimingRef = useRef(false);
  
  // Get game state to check if user owns any properties
  const gameState = useGameState();
  const totalSlotsOwned = gameState.stats.totalSlotsOwned || 0;

  const handleClaimRewards = async () => {
    if (!connected || !publicKey || unclaimedRewards === 0 || claiming || claimingRef.current) return;
    
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
          
          const displayAmount = actualClaimedAmount > 0 ? actualClaimedAmount : unclaimedRewards;
  
          showSuccess(
            'Rewards Claimed!', 
            `Successfully claimed ${(displayAmount / 1e9).toFixed(2)}`,
            signature !== 'already-processed' ? signature : undefined
          );
        } catch (parseError) {
          showSuccess(
            'Rewards Claimed!', 
            `Successfully claimed rewards!`,
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
      } else {
        showError('Claim Failed', 'Failed to claim rewards. Please try again.');
      }
    } finally {
      setClaiming(false);
      claimingRef.current = false;
    }
  };

  // Not connected - show welcome screen
  if (!connected) {
    return (
      <div className="relative space-y-6 px-4 max-w-md w-full">
        {/* Logo + Message */}
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
        
        {/* Connect Button */}
        <div className="flex justify-center">
          <StyledWalletButton variant="board" />
        </div>

        {/* Feature Icons */}
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
        {/* Header */}
        <div className="text-center">
          <div className="text-3xl mb-2">🎲</div>
          <h2 className="text-2xl font-bold text-white mb-1">How to Play Defipoly</h2>
          <p className="text-white/50 text-sm">Get started in 3 steps</p>
        </div>

        {/* Steps */}
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

        {/* Pro Tips */}
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

        {/* Call to Action */}
        <div className="text-center">
          <div className="text-white/60 text-sm animate-pulse">
            ↓ Click a property to start ↓
          </div>
        </div>
      </div>
    );
  }

  // Connected and owns properties - show rewards panel
  return (
    <div className="relative w-full max-w-sm px-4">
      {rewardsLoading ? (
        <div className="text-white/60 text-center">Loading rewards...</div>
      ) : (
        <div className="space-y-3">
          {/* Electric Cyan Rewards Box */}
          <div className="relative rounded-[16px] p-5 overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(20, 10, 40, 0.9), rgba(40, 10, 60, 0.9))',
            boxShadow: '0 0 30px rgba(147, 51, 234, 0.3), inset 0 0 20px rgba(147, 51, 234, 0.1)'
          }}>
            {/* Animated Glow Ring */}
            <div className="absolute inset-[-3px] rounded-[16px] animate-glow-rotate" style={{
              background: 'linear-gradient(135deg, #9333ea, #06b6d4, #9333ea)',
              zIndex: -1
            }}></div>
            
            {/* Radial glowing spots */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(circle at 20% 30%, rgba(147, 51, 234, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)',
              zIndex: -1
            }}></div>
            
            {/* Header */}
            <div className="text-center text-[9px] tracking-[3px] text-cyan-400 font-bold mb-4 uppercase">
              ◆ UNCLAIMED REWARDS ◆
            </div>
            
            {/* Amount */}
            <div className="text-center text-[48px] font-black leading-none mb-4 tabular-nums text-white" style={{
              fontFamily: 'Courier New, monospace'
            }}>
              {unclaimedRewards.toLocaleString()}
            </div>
            
            {/* Claim Button */}
            {unclaimedRewards > 0 && (
              <button
                onClick={handleClaimRewards}
                disabled={claiming || claimLoading || unclaimedRewards === 0}
                className="w-full py-3 rounded-lg font-black text-base uppercase tracking-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  border: '2px solid #06b6d4',
                  color: '#0a0015',
                  fontFamily: 'Courier New, monospace'
                }}
                onMouseEnter={(e) => {
                  if (!claiming && !claimLoading && unclaimedRewards > 0) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(6, 182, 212, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full transition-transform duration-500 hover:translate-x-full pointer-events-none"></div>
                <span className="relative z-10">
                  {claiming ? '⏳ CLAIMING...' : 'COLLECT REWARDS'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes glow-rotate {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        
        .animate-glow-rotate {
          animation: glow-rotate 4s linear infinite;
        }
      `}</style>
    </div>
  );
}