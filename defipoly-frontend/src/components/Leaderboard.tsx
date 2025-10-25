'use client';

import { useEffect, useState } from 'react';
import { getProfilesBatch, ProfileData } from '@/utils/profileStorage';

interface LeaderboardEntry {
  walletAddress: string;
  dailyIncome: number;
}

const API_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3005';

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
    <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 max-h-[450px] overflow-hidden flex flex-col">
      {/* Header - Sticky */}
      <div className="p-6 pb-4">
        <h2 className="text-xl font-bold text-white">
          Leaderboard
        </h2>
        <p className="text-sm text-purple-400 mt-1">Top players by daily income</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">{loading ? (
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
        <div className="space-y-1">
          {leaders.map((leader, index) => {
            const isTop3 = index < 3;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            
            return (
              <div
                key={leader.walletAddress}
                className={`flex items-center gap-4 py-3 px-2 rounded-lg transition-all ${
                  isTop3 
                    ? 'bg-white/[0.03] hover:bg-white/[0.08]' 
                    : 'bg-white/[0.01] hover:bg-white/[0.05]'
                }`}
              >
                {/* Rank - No background container */}
                <div className={`text-sm font-bold w-8 text-center ${
                  isTop3 ? 'text-yellow-400' : 'text-purple-400'
                }`}>
                  {medal || `#${index + 1}`}
                </div>
                
                {/* Profile Picture - Minimal */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-500/10 flex-shrink-0">
                  {profiles[leader.walletAddress]?.profilePicture ? (
                    <img 
                      src={profiles[leader.walletAddress].profilePicture || undefined} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-400 text-xs font-bold">
                      {getDisplayName(leader.walletAddress).slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {/* Name and Address - Clean */}
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm truncate ${
                    isTop3 ? 'text-white' : 'text-purple-100'
                  }`}>
                    {getDisplayName(leader.walletAddress)}
                  </div>
                  {profiles[leader.walletAddress]?.username && (
                    <div className="text-xs text-purple-500 font-mono">
                      {formatAddress(leader.walletAddress)}
                    </div>
                  )}
                </div>
                
                {/* Income - Clean, no background */}
                <div className="text-right">
                  <div className={`text-sm font-bold font-mono ${
                    isTop3 ? 'text-green-400' : 'text-green-500'
                  }`}>
                    {formatIncome(leader.dailyIncome)}
                  </div>
                  <div className="text-[10px] text-purple-500 uppercase tracking-wider">
                    per day
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}