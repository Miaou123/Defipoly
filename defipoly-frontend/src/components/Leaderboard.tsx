'use client';

import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '@/utils/constants';
import { deserializePlayer } from '@/utils/deserialize';

interface LeaderboardEntry {
  address: string;
  totalDailyIncome: number;
  propertiesOwned: number;
}

export function Leaderboard() {
  const { connection } = useConnection();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        console.log('🏆 =========================');
        console.log('🏆 Starting leaderboard fetch...');
        console.log('🏆 Program ID:', PROGRAM_ID.toString());
        console.log('🏆 Connection endpoint:', connection.rpcEndpoint);
        
        // First, let's try without any filters to see what we get
        console.log('🏆 Fetching ALL program accounts...');
        const allAccounts = await connection.getProgramAccounts(PROGRAM_ID);
        console.log(`🏆 Total accounts found: ${allAccounts.length}`);
        
        // Log account sizes
        const sizeCounts: Record<number, number> = {};
        allAccounts.forEach(({ account }) => {
          const size = account.data.length;
          sizeCounts[size] = (sizeCounts[size] || 0) + 1;
        });
        console.log('🏆 Account size distribution:', sizeCounts);
        
        // Parse and sort players
        const players: LeaderboardEntry[] = [];
        const expectedDiscriminator = Buffer.from([224, 184, 224, 50, 98, 72, 48, 236]);
        
        console.log('🏆 Looking for PlayerAccount discriminator:', expectedDiscriminator.toString('hex'));
        
        for (let i = 0; i < allAccounts.length; i++) {
          const { account, pubkey } = allAccounts[i];
          
          try {
            console.log(`\n🏆 Account ${i + 1}/${allAccounts.length}:`);
            console.log(`   PDA: ${pubkey.toString()}`);
            console.log(`   Size: ${account.data.length} bytes`);
            
            if (account.data.length < 8) {
              console.log('   ❌ Too small to have discriminator');
              continue;
            }
            
            // Check discriminator
            const discriminator = account.data.slice(0, 8);
            console.log(`   Discriminator: ${discriminator.toString('hex')}`);
            
            if (discriminator.equals(expectedDiscriminator)) {
              console.log('   ✅ MATCH! This is a PlayerAccount');
              
              const playerData = deserializePlayer(account.data);
              console.log('   Player owner:', playerData.owner.toString());
              console.log('   Properties owned:', playerData.totalPropertiesOwned);
              console.log('   Daily income:', playerData.totalDailyIncome.toString());
              
              players.push({
                address: playerData.owner.toString(),
                totalDailyIncome: Number(playerData.totalDailyIncome),
                propertiesOwned: playerData.totalPropertiesOwned,
              });
            } else {
              console.log('   ⚠️ Different discriminator - not a PlayerAccount');
            }
          } catch (error) {
            console.error(`   ❌ Error parsing account ${i + 1}:`, error);
          }
        }

        // Sort by total daily income (descending)
        players.sort((a, b) => b.totalDailyIncome - a.totalDailyIncome);
        
        console.log('\n🏆 =========================');
        console.log(`🏆 Final result: Found ${players.length} player accounts`);
        console.log('🏆 Players:', players);
        console.log('🏆 =========================\n');
        
        setLeaders(players.slice(0, 10)); // Top 10
      } catch (error) {
        console.error('❌ Error fetching leaderboard:', error);
        if (error instanceof Error) {
          console.error('❌ Error message:', error.message);
          console.error('❌ Error stack:', error.stack);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [connection]);

  const formatDailyIncome = (income: number) => {
    const defi = income / 1e9;
    if (defi >= 1e6) return `${(defi / 1e6).toFixed(2)}M`;
    if (defi >= 1e3) return `${(defi / 1e3).toFixed(2)}K`;
    return defi.toFixed(2);
  };

  return (
    <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 max-h-[450px] overflow-y-auto">
      <h2 className="text-lg font-semibold text-purple-200 mb-5 pb-4 border-b border-purple-500/20">
        Leaderboard
      </h2>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-2xl mb-2">⏳</div>
          <div className="text-sm text-purple-300">Loading...</div>
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3 opacity-50">🏆</div>
          <div className="text-sm text-gray-400">
            No players yet<br />
            Be the first to own properties!
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((leader, idx) => (
            <div
              key={leader.address}
              className="flex justify-between items-center p-4 bg-purple-900/10 rounded-xl border border-purple-500/20 hover:bg-purple-900/15 hover:border-purple-500/40 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xl">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-purple-100 truncate">
                    {leader.address.slice(0, 4)}...{leader.address.slice(-4)}
                  </div>
                  <div className="text-xs text-purple-400">
                    {leader.propertiesOwned} {leader.propertiesOwned === 1 ? 'property' : 'properties'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-purple-400 font-semibold">
                  {formatDailyIncome(leader.totalDailyIncome)}
                </div>
                <div className="text-xs text-purple-500">DEFI/day</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}