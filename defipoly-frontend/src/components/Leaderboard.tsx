// ============================================
// FILE: defipoly-frontend/src/components/Leaderboard.tsx
// UPDATED: Uses batch API for efficiency
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '@/utils/constants';
import { deserializePlayer } from '@/utils/deserialize';
import { getProfilesBatch } from '@/utils/profileStorage';

interface LeaderboardEntry {
  address: string;
  username: string | null;
  profilePicture: string | null;
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
        console.log('🏆 Starting leaderboard fetch...');
        
        const allAccounts = await connection.getProgramAccounts(PROGRAM_ID);
        console.log(`🏆 Total accounts found: ${allAccounts.length}`);
        
        const players: Omit<LeaderboardEntry, 'username' | 'profilePicture'>[] = [];
        const expectedDiscriminator = Buffer.from([224, 184, 224, 50, 98, 72, 48, 236]);
        
        for (const { account } of allAccounts) {
          try {
            if (account.data.length < 8) continue;
            
            const discriminator = account.data.slice(0, 8);
            
            if (discriminator.equals(expectedDiscriminator)) {
              const playerData = deserializePlayer(account.data);
              
              players.push({
                address: playerData.owner.toString(),
                totalDailyIncome: Number(playerData.totalDailyIncome),
                propertiesOwned: playerData.totalPropertiesOwned,
              });
            }
          } catch (error) {
            console.error('Error parsing account:', error);
          }
        }

        // Sort by daily income
        players.sort((a, b) => b.totalDailyIncome - a.totalDailyIncome);
        
        // Get top 10
        const top10 = players.slice(0, 10);
        
        // Batch fetch profiles for all top 10 players
        const addresses = top10.map(p => p.address);
        const profiles = await getProfilesBatch(addresses);
        
        // Combine player data with profile data
        const leadersWithProfiles: LeaderboardEntry[] = top10.map(player => ({
          ...player,
          username: profiles[player.address]?.username || null,
          profilePicture: profiles[player.address]?.profilePicture || null,
        }));
        
        console.log(`🏆 Found ${players.length} player accounts`);
        setLeaders(leadersWithProfiles);
      } catch (error) {
        console.error('❌ Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    
    // Listen for profile updates
    const handleProfileUpdate = () => {
      fetchLeaderboard();
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
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
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Rank */}
                <span className="text-xl flex-shrink-0">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                </span>
                
                {/* Profile Picture */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {leader.profilePicture ? (
                    <img 
                      src={leader.profilePicture} 
                      alt={leader.username || 'Profile'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">👤</span>
                  )}
                </div>
                
                {/* Username/Address */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-purple-100 truncate">
                    {leader.username || `${leader.address.slice(0, 4)}...${leader.address.slice(-4)}`}
                  </div>
                  {leader.username && (
                    <div className="text-xs text-purple-500 font-mono truncate">
                      {leader.address.slice(0, 4)}...{leader.address.slice(-4)}
                    </div>
                  )}
                  <div className="text-xs text-purple-400">
                    {leader.propertiesOwned} {leader.propertiesOwned === 1 ? 'property' : 'properties'}
                  </div>
                </div>
              </div>
              
              {/* Daily Income */}
              <div className="text-right flex-shrink-0 ml-3">
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