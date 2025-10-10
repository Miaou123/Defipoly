'use client';

import { PROPERTIES } from '@/utils/constants';
import { useRewards } from '@/hooks/useRewards';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useState, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PROGRAM_ID } from '@/utils/constants';
import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import idl from '@/types/memeopoly_program.json';

interface BoardProps {
  onSelectProperty: (propertyId: number) => void;
}

export function Board({ onSelectProperty }: BoardProps) {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { unclaimedRewards, dailyIncome, loading: rewardsLoading } = useRewards();
  const { claimRewards, loading: claimLoading } = useDefipoly();
  const [claiming, setClaiming] = useState(false);
  const claimingRef = useRef(false);

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
      alert(error?.message?.includes('already been processed') 
        ? 'Claim successful!' 
        : 'Failed to claim rewards.');
    } finally {
      setClaiming(false);
      claimingRef.current = false;
    }
  };

  // Property card component
  const PropertyCard = ({ prop }: { prop: typeof PROPERTIES[0] }) => {
    return (
      <button
        onClick={() => onSelectProperty(prop.id)}
        className={`
          ${prop.color}
          border-2 border-gray-700
          hover:scale-105 hover:z-20 hover:shadow-2xl
          transition-all duration-200 cursor-pointer
          flex flex-col h-full
          relative
        `}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-2 bg-white">
          <div className="text-[8px] font-bold text-center text-gray-900 leading-tight mb-1">
            {prop.name}
          </div>
          <div className="text-[10px] font-black text-gray-900">
            ${(prop.price / 1000)}K
          </div>
        </div>
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
    <div className="flex items-center justify-center p-4 min-h-screen bg-gray-900">
      <div className="w-full max-w-[900px] aspect-square bg-[#c8e6c9] rounded-lg shadow-2xl border-8 border-gray-800">
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

            {/* Rewards */}
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
                            disabled={claiming || claimLoading}
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
              <div className="relative text-white/60 text-sm text-center">
                Connect wallet to view rewards
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