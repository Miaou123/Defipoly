'use client';

import { PROPERTIES } from '@/utils/constants';
import { useRewards } from '@/hooks/useRewards';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface BoardProps {
  onSelectProperty: (propertyId: number) => void;
}

export function Board({ onSelectProperty }: BoardProps) {
  const { connected } = useWallet();
  const { unclaimedRewards, dailyIncome, loading: rewardsLoading } = useRewards();
  const { claimRewards, loading: claimLoading } = useDefipoly();
  const [claiming, setClaiming] = useState(false);

  const handleClaimRewards = async () => {
    if (!connected || unclaimedRewards === 0) return;
    
    setClaiming(true);
    try {
      await claimRewards();
      alert(`Successfully claimed ${unclaimedRewards.toLocaleString()} DEFI!`);
    } catch (error) {
      console.error('Error claiming rewards:', error);
      alert('Failed to claim rewards. Check console for details.');
    } finally {
      setClaiming(false);
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
                            disabled={claiming || claimLoading}
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

            return (
              <div
                key={prop.id}
                className="bg-[#f5f3eb] border border-[#d1ccc0] p-1.5 cursor-pointer hover:scale-110 hover:z-20 transition-transform hover:shadow-xl"
                style={gridProps}
                onClick={() => onSelectProperty(prop.id)}
              >
                <div className={`h-5 w-full ${prop.color} mb-1.5`}></div>
                <div className="text-[8px] font-bold text-center text-gray-900 leading-tight mb-1 px-0.5">
                  {prop.name}
                </div>
                <div className="text-[7px] text-center text-gray-600 font-medium">
                  ${(prop.price / 1000).toFixed(0)}K
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}