'use client';

import { useState, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useRewards } from '@/hooks/useRewards';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from '../contexts/NotificationContext';
import { StyledWalletButton } from './StyledWalletButton';
import { PROGRAM_ID } from '@/utils/constants';
import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import idl from '@/idl/defipoly_program.json';
import { BuildingIcon, CoinsIcon, TargetIcon } from './icons/UIIcons';

export function RewardsPanel() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { unclaimedRewards, dailyIncome, loading: rewardsLoading } = useRewards();
  const { totalEarned } = usePlayerStats();
  const { claimRewards, loading: claimLoading } = useDefipoly();
  const { showSuccess, showError } = useNotification();
  const [claiming, setClaiming] = useState(false);
  const claimingRef = useRef(false);

  const handleClaimRewards = async () => {
    if (!connected || !publicKey || unclaimedRewards === 0 || claiming || claimingRef.current) return;
    
    claimingRef.current = true;
    setClaiming(true);
    
    try {
      const signature = await claimRewards();
      
      if (signature) {
        // Backend logging in background - don't block success message
        (async () => {
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
              
              let claimedAmount = Math.floor(unclaimedRewards * 1e9);
              
              for (const event of events) {
                if (event.name === 'RewardsClaimedEvent' || event.name === 'rewardsClaimedEvent') {
                  claimedAmount = Number(event.data.amount);
                  break;
                }
              }

              const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101';
              await fetch(`${API_BASE_URL}/api/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  txSignature: signature,
                  actionType: 'claim',
                  playerAddress: publicKey.toString(),
                  amount: claimedAmount,
                  blockTime: tx.blockTime || Math.floor(Date.now() / 1000),
                }),
              });
            }
          } catch (backendError) {
            console.warn('⚠️ Backend logging failed (non-critical):', backendError);
          }
        })();
        
        // Show success immediately
        showSuccess(
          'Rewards Claimed!', 
          `Successfully claimed ${unclaimedRewards.toLocaleString()} DEFI!`,
          signature !== 'already-processed' ? signature : undefined
        );
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
      
      // Check if this is the "already processed" error
      const errorMessage = String(error instanceof Error ? error.message : error);
      if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        showSuccess(
          'Rewards Claimed!', 
          `Successfully claimed ${unclaimedRewards.toLocaleString()} DEFI!`
        );
      } else {
        showError('Claim Failed', 'Failed to claim rewards. Please try again.');
      }
    } finally {
      // Add delay before resetting to prevent rapid re-clicks
      setTimeout(() => {
        setClaiming(false);
        claimingRef.current = false;
      }, 1000);
    }
  };

  if (!connected) {
    return (
      <div className="relative space-y-8 px-4 max-w-md w-full">
        {/* Message */}
        <div className="text-center space-y-3">
          <p className="text-white/90 text-2xl font-bold">
            Welcome to Defipoly
          </p>
          <p className="text-white/60 text-sm">
            Connect your Solana wallet to start playing
          </p>
        </div>
        
        {/* Prominent Connect Button */}
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
            <CoinsIcon size={32} className="mx-auto mb-2 text-purple-400" />
            <div className="text-xs text-white/80 font-semibold">Earn Rewards</div>
          </div>
          <div className="bg-black/20 backdrop-blur rounded-xl p-4 text-center border border-purple-500/20 hover:border-purple-500/40 transition-all">
            <TargetIcon size={32} className="mx-auto mb-2 text-purple-400" />
            <div className="text-xs text-white/80 font-semibold">Steal Slots</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center text-white/40 text-xs">
          <p>Powered by Solana • Secure • Decentralized</p>
        </div>
      </div>
    );
  }

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
            {/* Animated Glow Ring - Cyan/Purple */}
            <div className="absolute inset-[-3px] rounded-[16px] animate-glow-rotate" style={{
              background: 'linear-gradient(135deg, #9333ea, #06b6d4, #9333ea)',
              zIndex: -1
            }}></div>
            
            {/* Radial glowing spots in background - like Option 1 */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(circle at 20% 30%, rgba(147, 51, 234, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)',
              zIndex: -1
            }}></div>
            
            {/* Header */}
            <div className="text-center text-[9px] tracking-[3px] text-cyan-400 font-bold mb-2 uppercase">
              ◆ UNCLAIMED REWARDS ◆
            </div>
            
            {/* Amount */}
            <div className="text-center text-[48px] font-black leading-none mb-1 tabular-nums text-white" style={{
              fontFamily: 'Courier New, monospace'
            }}>
              {unclaimedRewards.toLocaleString()}
            </div>
            
            {/* Currency */}
            <div className="text-center text-sm font-bold tracking-[2px] mb-4 text-white/70">
              DEFI
            </div>
            
            {/* Claim Button - Electric Cyan */}
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
                {/* Shine effect */}
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
        
        @keyframes scanline {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .animate-scanline {
          animation: scanline 2s linear infinite;
        }
      `}</style>
    </div>
  );
}