'use client';

import { useState, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useRewards } from '@/hooks/useRewards';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from './NotificationProvider';
import { StyledWalletButton } from './StyledWalletButton';
import { PROGRAM_ID } from '@/utils/constants';
import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import idl from '@/types/defipoly_program.json';

export function RewardsPanel() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { unclaimedRewards, dailyIncome, loading: rewardsLoading } = useRewards();
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

              const BACKEND_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3001';
              await fetch(`${BACKEND_URL}/api/actions`, {
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
            <div className="text-3xl mb-2">🏠</div>
            <div className="text-xs text-white/80 font-semibold">Buy Properties</div>
          </div>
          <div className="bg-black/20 backdrop-blur rounded-xl p-4 text-center border border-purple-500/20 hover:border-purple-500/40 transition-all">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-xs text-white/80 font-semibold">Earn Rewards</div>
          </div>
          <div className="bg-black/20 backdrop-blur rounded-xl p-4 text-center border border-purple-500/20 hover:border-purple-500/40 transition-all">
            <div className="text-3xl mb-2">🎯</div>
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
    <div className="relative w-full max-w-md px-4">
      {rewardsLoading ? (
        <div className="text-white/60 text-center">Loading rewards...</div>
      ) : (
        <div className="space-y-3">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border-2 border-green-400/50 shadow-lg">
            <div className="text-center">
              <div className="text-xs text-green-300 uppercase tracking-widest font-bold mb-2">
                💎 Unclaimed Rewards
              </div>
              <div className="text-5xl font-black text-green-400 tabular-nums mb-1">
                {unclaimedRewards.toLocaleString()}
              </div>
              <div className="text-sm text-green-300 font-bold mb-4">DEFI</div>
              
              {unclaimedRewards > 0 && (
                <button
                  onClick={handleClaimRewards}
                  disabled={claiming || claimLoading || unclaimedRewards === 0}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed rounded-xl font-black text-white shadow-lg hover:shadow-green-500/50 transition-all transform hover:scale-105 disabled:scale-100 disabled:opacity-50"
                >
                  {claiming ? '⏳ Claiming...' : '🎁 CLAIM NOW'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="text-[10px] text-purple-300 uppercase font-bold mb-1">Daily Income</div>
              <div className="text-2xl font-black text-white tabular-nums">{dailyIncome.toLocaleString()}</div>
              <div className="text-[10px] text-purple-400">DEFI/day</div>
            </div>
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="text-[10px] text-purple-300 uppercase font-bold mb-1">Hourly Rate</div>
              <div className="text-2xl font-black text-white tabular-nums">{Math.floor(dailyIncome / 24).toLocaleString()}</div>
              <div className="text-[10px] text-purple-400">DEFI/hr</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}