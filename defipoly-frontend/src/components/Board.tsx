'use client';

import { PROPERTIES } from '@/utils/constants';
import { useRewards } from '@/hooks/useRewards';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useState, useRef, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PROGRAM_ID } from '@/utils/constants';
import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import idl from '@/types/memeopoly_program.json';
import { StyledWalletButton } from './StyledWalletButton';

interface BoardProps {
  onSelectProperty: (propertyId: number) => void;
}

// Building SVGs for levels 0-5
const BUILDING_SVGS: { [key: number]: React.ReactNode } = {
  0: <></>, // Empty lot
  1: (
    <svg width="40" height="40" viewBox="0 0 40 40" className="w-full h-auto">
      <ellipse cx="20" cy="36" rx="12" ry="3" fill="black" opacity="0.2"/>
      <path d="M 20 20 L 30 25 L 30 35 L 20 36 L 10 35 L 10 25 Z" fill="#D2691E"/>
      <path d="M 20 20 L 30 25 L 30 35 L 20 30 Z" fill="#A0522D"/>
      <path d="M 20 13 L 30 18 L 30 25 L 20 20 L 10 25 L 10 18 Z" fill="#8B4513"/>
      <path d="M 20 13 L 30 18 L 30 25 L 20 20 Z" fill="#654321"/>
      <rect x="17" y="30" width="6" height="6" fill="#654321"/>
      <rect x="12" y="27" width="4" height="4" fill="#FFFFCC"/>
      <rect x="24" y="27" width="4" height="4" fill="#FFFFCC"/>
    </svg>
  ),
  2: (
    <svg width="45" height="45" viewBox="0 0 45 45" className="w-full h-auto">
      <ellipse cx="22" cy="42" rx="14" ry="3" fill="black" opacity="0.2"/>
      <path d="M 22 20 L 34 25 L 34 40 L 22 42 L 10 40 L 10 25 Z" fill="#D2691E"/>
      <path d="M 22 20 L 34 25 L 34 40 L 22 35 Z" fill="#A0522D"/>
      <rect x="12" y="11" width="3" height="8" fill="#8B4513"/>
      <path d="M 22 13 L 34 18 L 34 25 L 22 20 L 10 25 L 10 18 Z" fill="#8B4513"/>
      <path d="M 22 13 L 34 18 L 34 25 L 22 20 Z" fill="#654321"/>
      <rect x="19" y="36" width="6" height="6" fill="#654321"/>
      <rect x="12" y="28" width="4" height="3" fill="#FFFFCC"/>
      <rect x="28" y="28" width="4" height="3" fill="#FFFFCC"/>
      <rect x="12" y="33" width="4" height="3" fill="#FFFFCC"/>
      <rect x="28" y="33" width="4" height="3" fill="#FFFFCC"/>
    </svg>
  ),
  3: (
    <svg width="48" height="50" viewBox="0 0 48 50" className="w-full h-auto">
      <ellipse cx="24" cy="47" rx="15" ry="3.5" fill="black" opacity="0.2"/>
      <path d="M 24 19 L 37 24 L 37 45 L 24 47 L 11 45 L 11 24 Z" fill="#D2691E"/>
      <path d="M 24 19 L 37 24 L 37 45 L 24 38 Z" fill="#A0522D"/>
      <rect x="13" y="11" width="3" height="10" fill="#8B4513"/>
      <path d="M 24 12 L 37 17 L 37 24 L 24 19 L 11 24 L 11 17 Z" fill="#8B4513"/>
      <path d="M 24 12 L 37 17 L 37 24 L 24 19 Z" fill="#654321"/>
      <rect x="21" y="41" width="6" height="6" fill="#654321"/>
      <rect x="14" y="28" width="3" height="3" fill="#FFFFCC"/>
      <rect x="31" y="28" width="3" height="3" fill="#FFFFCC"/>
      <rect x="14" y="33" width="3" height="3" fill="#FFFFCC"/>
      <rect x="31" y="33" width="3" height="3" fill="#FFFFCC"/>
      <rect x="14" y="38" width="3" height="3" fill="#FFFFCC"/>
      <rect x="31" y="38" width="3" height="3" fill="#FFFFCC"/>
    </svg>
  ),
  4: (
    <svg width="50" height="55" viewBox="0 0 50 55" className="w-full h-auto">
      <ellipse cx="25" cy="52" rx="16" ry="4" fill="black" opacity="0.2"/>
      <path d="M 25 18 L 40 25 L 40 50 L 25 52 L 10 50 L 10 25 Z" fill="#D2691E"/>
      <path d="M 25 18 L 40 25 L 40 50 L 25 43 Z" fill="#A0522D"/>
      <rect x="12" y="11" width="3" height="10" fill="#8B4513"/>
      <path d="M 25 11 L 40 18 L 40 25 L 25 18 L 10 25 L 10 18 Z" fill="#8B4513"/>
      <path d="M 25 11 L 40 18 L 40 25 L 25 18 Z" fill="#654321"/>
      <rect x="22" y="46" width="6" height="6" fill="#654321"/>
      <rect x="12" y="28" width="4" height="3" fill="#FFFFCC"/>
      <rect x="34" y="28" width="4" height="3" fill="#FFFFCC"/>
      <rect x="12" y="34" width="4" height="3" fill="#FFFFCC"/>
      <rect x="34" y="34" width="4" height="3" fill="#FFFFCC"/>
      <rect x="12" y="40" width="4" height="3" fill="#FFFFCC"/>
      <rect x="34" y="40" width="4" height="3" fill="#FFFFCC"/>
      <rect x="23" y="31" width="4" height="3" fill="#FFFFCC"/>
    </svg>
  ),
  5: (
    <svg width="55" height="58" viewBox="0 0 55 58" className="w-full h-auto">
      <ellipse cx="27" cy="55" rx="18" ry="4" fill="black" opacity="0.3"/>
      <path d="M 27 17 L 44 24 L 44 53 L 27 55 L 10 53 L 10 24 Z" fill="#CD853F"/>
      <path d="M 27 17 L 44 24 L 44 53 L 27 46 Z" fill="#A0522D"/>
      <rect x="12" y="10" width="3" height="11" fill="#8B4513"/>
      <path d="M 27 10 L 44 17 L 44 24 L 27 17 L 10 24 L 10 17 Z" fill="#8B4513"/>
      <path d="M 27 10 L 44 17 L 44 24 L 27 17 Z" fill="#654321"/>
      <rect x="24" y="49" width="6" height="6" fill="#654321"/>
      <rect x="13" y="27" width="4" height="3" fill="#FFFFCC"/>
      <rect x="25" y="27" width="4" height="3" fill="#FFFFCC"/>
      <rect x="37" y="27" width="4" height="3" fill="#FFFFCC"/>
      <rect x="13" y="33" width="4" height="3" fill="#FFFFCC"/>
      <rect x="25" y="33" width="4" height="3" fill="#FFFFCC"/>
      <rect x="37" y="33" width="4" height="3" fill="#FFFFCC"/>
      <rect x="13" y="39" width="4" height="3" fill="#FFFFCC"/>
      <rect x="25" y="39" width="4" height="3" fill="#FFFFCC"/>
      <rect x="37" y="39" width="4" height="3" fill="#FFFFCC"/>
      <rect x="13" y="45" width="4" height="3" fill="#FFFFCC"/>
      <rect x="37" y="45" width="4" height="3" fill="#FFFFCC"/>
    </svg>
  ),
};

export function Board({ onSelectProperty }: BoardProps) {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { unclaimedRewards, dailyIncome, loading: rewardsLoading } = useRewards();
  const { claimRewards, loading: claimLoading } = useDefipoly();
  const [claiming, setClaiming] = useState(false);
  const claimingRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Color mapping to prevent Tailwind purging
  const getColorClass = (colorString: string) => {
    const colorMap: { [key: string]: string } = {
      'bg-amber-900': 'bg-amber-900',
      'bg-sky-300': 'bg-sky-300',
      'bg-pink-400': 'bg-pink-400',
      'bg-orange-500': 'bg-orange-500',
      'bg-red-600': 'bg-red-600',
      'bg-yellow-400': 'bg-yellow-400',
      'bg-green-600': 'bg-green-600',
      'bg-blue-900': 'bg-blue-900',
    };
    return colorMap[colorString] || 'bg-gray-500';
  };

  const handleClaimRewards = async () => {
    if (!connected || !publicKey || unclaimedRewards === 0 || claiming || claimingRef.current) return;
    
    claimingRef.current = true;
    setClaiming(true);
    
    try {
      const signature = await claimRewards();
      
      if (signature) {
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
          console.error('Backend error:', backendError);
        }
      }
      
      alert(`Successfully claimed ${unclaimedRewards.toLocaleString()} DEFI!`);
    } catch (error: any) {
      console.error('Error claiming rewards:', error);
      alert('Failed to claim rewards. Please try again.');
    } finally {
      setClaiming(false);
      claimingRef.current = false;
    }
  };

  // Property card component with building
  const PropertyCard = ({ prop }: { prop: typeof PROPERTIES[0] }) => {
    // TODO: Get actual property level from game state
    // For now, using level 0 (empty lot) as default
    const buildingLevel = 0;
    
    return (
      <button
        onClick={() => onSelectProperty(prop.id)}
        className={`
          w-full h-full
          relative
          border-2 border-gray-800
          hover:scale-105 hover:z-20 hover:shadow-2xl
          transition-all duration-200 cursor-pointer
          flex flex-col
          overflow-hidden
          bg-white
        `}
      >
        {/* Color bar at top */}
        <div className={`${prop.color} h-4 w-full flex-shrink-0`}></div>

        {/* Building display area */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 px-1 py-2 min-h-0">
          {buildingLevel === 0 ? (
            <div className="text-center">
              <div className="text-base">📍</div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center scale-75">
              {BUILDING_SVGS[buildingLevel]}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="px-1 py-2 bg-white border-t border-gray-200 flex-shrink-0">
          <div className="text-center">
            <div className="text-[9px] font-black text-gray-900">
              ${(prop.price / 1000)}K
            </div>
          </div>
        </div>

        {/* Level indicator badge (only show if level > 0) */}
        {buildingLevel > 0 && (
          <div className="absolute top-5 right-1 bg-purple-600 text-white text-[8px] font-black px-1 py-0.5 rounded-full shadow-lg">
            L{buildingLevel}
          </div>
        )}
      </button>
    );
  };

  // Special filler square
  const FillerSquare = ({ icon, label, bgColor }: { icon: string; label: string; bgColor: string }) => (
    <div className={`${bgColor} border-2 border-gray-700 flex flex-col items-center justify-center p-2 h-full`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-[7px] font-black text-center uppercase text-gray-800 leading-tight">
        {label}
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-[95vw] aspect-square bg-gray-900 rounded-lg shadow-2xl border-8 border-gray-800">
        <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-0">
          
          {/* ========== TOP-LEFT CORNER: Liquidity Pool ========== */}
          <div className="col-start-1 row-start-1 bg-yellow-300 border-2 border-gray-700 flex flex-col items-center justify-center p-2">
            <div className="text-3xl mb-1">💰</div>
            <div className="text-[7px] font-black text-center uppercase text-gray-800">
              Liquidity<br/>Pool
            </div>
          </div>
          
          {/* ========== TOP ROW: Red (11-13) + Yellow (14-16) - LEFT TO RIGHT ========== */}
          <div className="col-start-2 row-start-1"><PropertyCard prop={PROPERTIES[11]} /></div>
          <div className="col-start-3 row-start-1"><PropertyCard prop={PROPERTIES[12]} /></div>
          <div className="col-start-4 row-start-1"><PropertyCard prop={PROPERTIES[13]} /></div>
          <div className="col-start-5 row-start-1"><PropertyCard prop={PROPERTIES[14]} /></div>
          <div className="col-start-6 row-start-1"><PropertyCard prop={PROPERTIES[15]} /></div>
          <div className="col-start-7 row-start-1"><PropertyCard prop={PROPERTIES[16]} /></div>
          
          {/* ========== TOP-RIGHT CORNER: SEC Enforcement ========== */}
          <div className="col-start-8 row-start-1 bg-orange-400 border-2 border-gray-700 flex flex-col items-center justify-center p-2">
            <div className="text-3xl mb-1">⚖️</div>
            <div className="text-[7px] font-black text-center uppercase text-white">
              SEC<br/>Enforcement
            </div>
          </div>

          {/* ========== LEFT SIDE: Pink (5-7) BOTTOM + Orange (8-10) TOP ========== */}
          <div className="col-start-1 row-start-2"><PropertyCard prop={PROPERTIES[10]} /></div>
          <div className="col-start-1 row-start-3"><PropertyCard prop={PROPERTIES[9]} /></div>
          <div className="col-start-1 row-start-4"><PropertyCard prop={PROPERTIES[8]} /></div>
          <div className="col-start-1 row-start-5"><PropertyCard prop={PROPERTIES[7]} /></div>
          <div className="col-start-1 row-start-6"><PropertyCard prop={PROPERTIES[6]} /></div>
          <div className="col-start-1 row-start-7"><PropertyCard prop={PROPERTIES[5]} /></div>

          {/* ========== CENTER: Logo & Rewards ========== */}
          <div className="col-start-2 col-span-6 row-start-2 row-span-6 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 flex flex-col items-center justify-center border-2 border-purple-900 shadow-inner relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 animate-pulse"></div>
            
            {/* Logo */}
            <div className="relative text-6xl font-black text-white tracking-wider drop-shadow-2xl mb-2">
              MEMEOPOLY
            </div>
            <div className="relative text-sm text-white/70 font-bold tracking-widest mb-8">SOLANA EDITION</div>

            {/* Rewards or Connect Wallet */}
            {connected ? (
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
                            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:from-gray-700 disabled:to-gray-800 rounded-xl font-black text-white shadow-lg hover:shadow-green-500/50 transition-all transform hover:scale-105 disabled:scale-100"
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
            ) : (
              <div className="relative space-y-8 px-4 max-w-md w-full">
                {/* Message */}
                <div className="text-center space-y-3">
                  <p className="text-white/90 text-2xl font-bold">
                    Welcome to Memeopoly
                  </p>
                  <p className="text-white/60 text-sm">
                    Connect your Solana wallet to start playing
                  </p>
                </div>
                
                {/* Prominent Connect Button */}
                <div className="flex justify-center">
                  {mounted ? (
                    <StyledWalletButton variant="board" />
                  ) : (
                    <div className="w-64 h-16 bg-purple-500/20 rounded-2xl animate-pulse"></div>
                  )}
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
            )}
          </div>

          {/* ========== RIGHT SIDE: Green (17-19) TOP + FILLER + Dark Blue (20-21) BOTTOM ========== */}
          <div className="col-start-8 row-start-2"><PropertyCard prop={PROPERTIES[17]} /></div>
          <div className="col-start-8 row-start-3"><PropertyCard prop={PROPERTIES[18]} /></div>
          <div className="col-start-8 row-start-4"><PropertyCard prop={PROPERTIES[19]} /></div>
          <div className="col-start-8 row-start-5">
            <FillerSquare icon="🌉" label="Bridge Protocol" bgColor="bg-cyan-300" />
          </div>
          <div className="col-start-8 row-start-6"><PropertyCard prop={PROPERTIES[20]} /></div>
          <div className="col-start-8 row-start-7"><PropertyCard prop={PROPERTIES[21]} /></div>

          {/* ========== BOTTOM-LEFT CORNER: Rug Pull Prison ========== */}
          <div className="col-start-1 row-start-8 bg-gray-400 border-2 border-gray-700 flex flex-col items-center justify-center p-2">
            <div className="text-3xl mb-1">🔒</div>
            <div className="text-[7px] font-black text-center uppercase text-gray-800">
              Rug Pull<br/>Prison
            </div>
          </div>

          {/* ========== BOTTOM ROW: Brown (0-1) + FILLER + Light Blue (2-4) - RIGHT TO LEFT FROM GO ========== */}
          <div className="col-start-2 row-start-8"><PropertyCard prop={PROPERTIES[4]} /></div>
          <div className="col-start-3 row-start-8"><PropertyCard prop={PROPERTIES[3]} /></div>
          <div className="col-start-4 row-start-8"><PropertyCard prop={PROPERTIES[2]} /></div>
          <div className="col-start-5 row-start-8">
            <FillerSquare icon="⚡" label="Flash Loan" bgColor="bg-purple-300" />
          </div>
          <div className="col-start-6 row-start-8"><PropertyCard prop={PROPERTIES[1]} /></div>
          <div className="col-start-7 row-start-8"><PropertyCard prop={PROPERTIES[0]} /></div>
          
          {/* ========== BOTTOM-RIGHT CORNER: Airdrop Zone (GO) ========== */}
          <div className="col-start-8 row-start-8 bg-red-500 border-2 border-gray-700 flex flex-col items-center justify-center p-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-400/30 animate-pulse"></div>
            <div className="relative text-4xl mb-1">🪂</div>
            <div className="relative text-xs font-black text-white uppercase text-center">
              Airdrop<br/>Zone
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}