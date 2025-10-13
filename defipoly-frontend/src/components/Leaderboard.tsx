'use client';

import { useEffect, useState } from 'react';
import { getProfilesBatch, ProfileData } from '@/utils/profileStorage';

interface LeaderboardEntry {
  walletAddress: string;
  dailyIncome: number;
  totalSlotsOwned: number;
  propertiesBought: number;
}

const API_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3001';

export function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        console.log('🏆 Fetching leaderboard from backend...');
        
        const response = await fetch(`${API_URL}/api/leaderboard?limit=10`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        
        const data = await response.json();
        
        console.log(`🏆 Found ${data.leaderboard.length} players`);
        setLeaders(data.leaderboard);
        
        // Fetch profiles for all wallet addresses
        const walletAddresses = data.leaderboard.map((entry: LeaderboardEntry) => entry.walletAddress);
        if (walletAddresses.length > 0) {
          const profilesData = await getProfilesBatch(walletAddresses);
          setProfiles(profilesData);
        }
      } catch (error) {
        console.error('❌ Error fetching leaderboard:', error);
        setLeaders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getDisplayName = (address: string) => {
    const profile = profiles[address];
    return profile?.username || formatAddress(address);
  };

  const formatIncome = (lamports: number) => {
    const tokens = lamports / 1e9;
    if (tokens >= 1e9) return `${(tokens / 1e9).toFixed(1)}B`;
    if (tokens >= 1e6) return `${(tokens / 1e6).toFixed(1)}M`;
    if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(1)}K`;
    return tokens.toFixed(0);
  };

  return (
    <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 max-h-[450px] overflow-y-auto">
      <div className="mb-5 pb-4 border-b border-purple-500/20">
        <h2 className="text-lg font-semibold text-purple-200">
          Leaderboard
        </h2>
        <p className="text-xs text-purple-400 mt-1">Top players by daily income</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-2xl mb-2">⏳</div>
          <div className="text-sm text-purple-300">Loading...</div>
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-2xl mb-2">🏆</div>
          <div className="text-sm text-purple-400">No players yet</div>
          <div className="text-xs text-purple-500 mt-1">Be the first!</div>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((leader, index) => {
            const isTop3 = index < 3;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
            
            return (
              <div
                key={leader.walletAddress}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isTop3 
                    ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30' 
                    : 'bg-purple-900/20 border border-purple-500/10'
                } hover:border-purple-500/40`}
              >
                <div className="flex items-center justify-center w-8 h-8 text-lg">
                  {medal}
                </div>
                
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Profile Picture */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-500/20 border border-purple-500/30 flex-shrink-0">
                    {profiles[leader.walletAddress]?.profilePicture ? (
                      <img 
                        src={profiles[leader.walletAddress].profilePicture} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-300 text-xs font-bold">
                        {getDisplayName(leader.walletAddress).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`font-semibold text-sm truncate ${
                        isTop3 ? 'text-yellow-200' : 'text-purple-200'
                      }`}>
                        {getDisplayName(leader.walletAddress)}
                      </div>
                      {profiles[leader.walletAddress]?.username && (
                        <div className="text-xs text-purple-400 font-mono">
                          {formatAddress(leader.walletAddress)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <div className="text-green-400 font-semibold">
                        💰 {formatIncome(leader.dailyIncome)}/day
                      </div>
                      <div className="text-purple-400">
                        🏠 {leader.totalSlotsOwned} slots
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`text-xs font-semibold px-2 py-1 rounded ${
                  isTop3 
                    ? 'bg-yellow-500/20 text-yellow-200' 
                    : 'bg-purple-500/20 text-purple-300'
                }`}>
                  #{index + 1}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}