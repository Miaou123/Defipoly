'use client';

import { PROPERTIES } from '@/utils/constants';
import { useRewards } from '@/hooks/useRewards';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useState, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PROGRAM_ID } from '@/utils/constants';
import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import idl from '@/types/defipoly_program.json';

interface BoardProps {
  onSelectProperty: (propertyId: number) => void;
}

export function Board({ onSelectProperty }: BoardProps) {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { unclaimedRewards, dailyIncome, loading: rewardsLoading } = useRewards();
  const { claimRewards, loading: claimLoading } = useDefipoly();
  const [claiming, setClaiming] = useState(false);
  const claimingRef = useRef(false); // Prevent double-execution

  const handleClaimRewards = async () => {
    // Prevent double-clicking and ensure conditions are met
    if (!connected || !publicKey || unclaimedRewards === 0 || claiming || claimingRef.current) return;
    
    // Set both state and ref immediately
    claimingRef.current = true;
    setClaiming(true);
    
    try {
      const signature = await claimRewards();
      
      // Store to backend (same approach as bots)
      if (signature) {
        try {
          console.log('⏳ Waiting for transaction to confirm...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Fetch transaction to get real amount from event
          const tx = await connection.getTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          });

          if (tx?.meta?.logMessages) {
            // Parse event to get actual claimed amount
            const coder = new BorshCoder(idl as any);
            const eventParser = new EventParser(PROGRAM_ID, coder);
            const events = eventParser.parseLogs(tx.meta.logMessages);
            
            let claimedAmount = Math.floor(unclaimedRewards * 1e9); // fallback
            
            for (const event of events) {
              if (event.name === 'RewardsClaimedEvent' || event.name === 'rewardsClaimedEvent') {
                claimedAmount = Number(event.data.amount);
                console.log('✅ Got real claim amount from event:', claimedAmount / 1e9, 'DEFI');
                break;
              }
            }

            // Store to backend with REAL amount
            const BACKEND_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${BACKEND_URL}/api/actions`, {
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

            if (response.ok) {
              console.log('✅ Claim stored to backend');
            } else {
              console.error('❌ Failed to store claim to backend:', response.status);
            }
          }
        } catch (backendError) {
          console.error('Failed to store claim to backend:', backendError);
          // Don't fail the whole claim if backend storage fails
        }
      }
      
      alert(`Successfully claimed ${unclaimedRewards.toLocaleString()} DEFI!`);
    } catch (error: any) {
      console.error('Error claiming rewards:', error);
      
      // Handle the specific "already processed" error gracefully
      if (error?.message?.includes('already been processed')) {
        alert('Claim successful! (Transaction was already submitted)');
      } else {
        alert('Failed to claim rewards. Check console for details.');
      }
    } finally {
      setClaiming(false);
      claimingRef.current = false;
    }
  };

  return (
    <div className="flex items-center justify-center perspective-1500">
      <div className="w-full max-w-[900px] aspect-square bg-gradient-to-br from-[#f5f3eb]/98 to-[#e8e4da]/98 backdrop-blur-xl border-4 border-purple-500/40 rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.5)] rotate-x-3">
        {/* Board Grid */}
        <div className="w-full h-full grid grid-cols-11 grid-rows-11 gap-0">
          {/* Top-left Corner */}
          <div className="col-start-1 row-start-1 bg-[#f5f3eb] border border-[#d1ccc0] flex flex-col items-center justify-center p-2">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-[9px] font-bold text-center text-gray-800 uppercase">Liquidity<br/>Pool</div>
          </div>
          
          {/* Top-right Corner */}
          <div className="col-start-11 row-start-1 bg-[#f5f3eb] border border-[#d1ccc0] flex flex-col items-center justify-center p-2">
            <div className="text-2xl mb-1">⚖️</div>
            <div className="text-[9px] font-bold text-center text-gray-800 uppercase">SEC<br/>Enforcement</div>
          </div>
          
          {/* Bottom-left Corner */}
          <div className="col-start-1 row-start-11 bg-[#f5f3eb] border border-[#d1ccc0] flex flex-col items-center justify-center p-2">
            <div className="text-2xl mb-1">🔒</div>
            <div className="text-[9px] font-bold text-center text-gray-800 uppercase">Rug Pull<br/>Prison</div>
          </div>
          
          {/* Bottom-right Corner */}
          <div className="col-start-11 row-start-11 bg-[#f5f3eb] border border-[#d1ccc0] flex flex-col items-center justify-center p-2">
            <div className="text-2xl mb-1">🪂</div>
            <div className="text-[9px] font-bold text-center text-gray-800 uppercase">Airdrop<br/>Zone</div>
          </div>

          {/* Center Logo & Rewards */}
          <div className="col-start-2 col-span-9 row-start-2 row-span-9 bg-gradient-to-br from-purple-700 to-purple-500 flex flex-col items-center justify-center border-2 border-purple-600/30 shadow-inner relative overflow-hidden">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 animate-pulse"></div>
            
            {/* Logo */}
            <div className="text-5xl lg:text-6xl font-extrabold text-white tracking-widest drop-shadow-[0_4px_20px_rgba(0,0,0,0.3)] mb-2">
              MEMEOPOLY
            </div>
            <div className="text-sm text-white/80 font-medium tracking-wider mb-6">DeFi Edition</div>

            {/* Rewards Display - Show if connected (even while loading initially) */}
            {connected && (
              <div className="w-full max-w-md px-4 space-y-3">
                {/* Loading State - Only on initial load */}
                {rewardsLoading ? (
                  <div className="text-white/60 text-sm font-medium animate-pulse">
                    Loading rewards...
                  </div>
                ) : (
                  <>
                    {/* Unclaimed Rewards - Main Display */}
                    <div className="relative">
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 blur-xl opacity-30 animate-pulse"></div>
                      
                      <div className="relative bg-black/40 backdrop-blur-sm rounded-2xl p-4 border-2 border-green-400/50 shadow-lg shadow-green-500/20">
                        <div className="text-center">
                          <div className="text-xs text-green-300 uppercase tracking-wider font-bold mb-1 flex items-center justify-center gap-1">
                            <span className="animate-pulse">💎</span>
                            Unclaimed Rewards
                            <span className="animate-pulse">💎</span>
                          </div>
                          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-green-200 to-emerald-300 tabular-nums">
                            {unclaimedRewards.toLocaleString()}
                          </div>
                          <div className="text-sm text-green-400 font-semibold">DEFI</div>
                        </div>

                        {/* Claim Button */}
                        {unclaimedRewards > 0 && (
                          <button
                            onClick={handleClaimRewards}
                            disabled={claiming || claimLoading || claimingRef.current}
                            className="w-full mt-3 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {claiming ? '⏳ Claiming...' : '🎁 Claim Rewards'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Daily Income */}
                      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-purple-400/30">
                        <div className="text-[10px] text-purple-300 uppercase tracking-wider font-semibold mb-1">
                          Daily Income
                        </div>
                        <div className="text-xl font-bold text-purple-100 tabular-nums">
                          {dailyIncome.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-purple-400">DEFI/day</div>
                      </div>

                      {/* Hourly Rate */}
                      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-purple-400/30">
                        <div className="text-[10px] text-purple-300 uppercase tracking-wider font-semibold mb-1">
                          Per Hour
                        </div>
                        <div className="text-xl font-bold text-purple-100 tabular-nums">
                          {Math.floor(dailyIncome / 24).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-purple-400">DEFI/hr</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Not Connected State */}
            {!connected && (
              <div className="text-white/60 text-sm font-medium">
                Connect wallet to view rewards
              </div>
            )}
          </div>

          {/* Properties - Distributed around the board */}
          {PROPERTIES.map((prop, idx) => {
            let gridProps = {};
            
            // Top row (2 properties)
            if (idx === 0) gridProps = { gridColumnStart: 2, gridRowStart: 1 };
            if (idx === 1) gridProps = { gridColumnStart: 6, gridRowStart: 1 };
            
            // Right side (2 properties)
            if (idx === 2) gridProps = { gridColumnStart: 11, gridRowStart: 2 };
            if (idx === 3) gridProps = { gridColumnStart: 11, gridRowStart: 6 };
            
            // Bottom row (2 properties)
            if (idx === 4) gridProps = { gridColumnStart: 10, gridRowStart: 11 };
            if (idx === 5) gridProps = { gridColumnStart: 6, gridRowStart: 11 };
            
            // Left side (2 properties)
            if (idx === 6) gridProps = { gridColumnStart: 1, gridRowStart: 10 };
            if (idx === 7) gridProps = { gridColumnStart: 1, gridRowStart: 6 };

            const tierColors: Record<string, { bg: string; border: string; text: string }> = {
              bronze: { bg: 'bg-gradient-to-br from-amber-700 to-amber-900', border: 'border-amber-600', text: 'text-amber-100' },
              silver: { bg: 'bg-gradient-to-br from-slate-300 to-slate-500', border: 'border-slate-400', text: 'text-slate-900' },
              gold: { bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600', border: 'border-yellow-500', text: 'text-yellow-950' },
              platinum: { bg: 'bg-gradient-to-br from-blue-400 to-blue-700', border: 'border-blue-500', text: 'text-blue-50' }
            };

            const colors = tierColors[prop.tier];

            return (
              <button
                key={prop.id}
                onClick={() => onSelectProperty(prop.id)}
                style={gridProps}
                className={`
                  ${colors.bg} ${colors.border} border-2 ${colors.text}
                  flex flex-col items-center justify-center p-2 
                  hover:scale-105 transition-all hover:shadow-lg cursor-pointer
                  hover:z-10 relative
                `}
              >
                <div className="text-[10px] font-bold text-center leading-tight">
                  {prop.name}
                </div>
                <div className="text-[9px] opacity-80 mt-1">
                  {(prop.price / 1000).toFixed(0)}K
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}