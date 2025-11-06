'use client';

import { useEffect, useState } from 'react';
import { getProfilesBatch, ProfileData } from '@/utils/profileStorage';
import { TrophyIcon } from './GameIcons';

interface LeaderboardEntry {
  walletAddress: string;
  dailyIncome: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101';

export function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        console.log('🏆 Fetching leaderboard from backend...');
        
        // ✅ Reduced from 10 to 5
        const response = await fetch(`${API_BASE_URL}/api/leaderboard?limit=5`);
        
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
    <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 max-h-[300px] overflow-hidden flex flex-col">
      {/* Header - Reduced padding */}
      <div className="p-4 pb-2">
        <h2 className="text-lg font-bold text-white">
          Leaderboard
        </h2>
        <p className="text-xs text-purple-400 mt-0.5">Top players by daily income</p>
      </div>

      {/* Scrollable Content - Reduced padding */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-xl mb-1">⏳</div>
            <div className="text-xs text-purple-300">Loading...</div>
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-8">
            <TrophyIcon size={24} className="mx-auto mb-1 text-yellow-400" />
            <div className="text-xs text-purple-400">No players yet</div>
            <div className="text-[10px] text-purple-500 mt-0.5">Be the first!</div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {leaders.map((leader, index) => {
              const isTop3 = index < 3;
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
              
              return (
                <div
                  key={leader.walletAddress}
                  className={`flex items-center gap-3 py-2 px-2 rounded-lg transition-all ${
                    isTop3 
                      ? 'bg-white/[0.03] hover:bg-white/[0.08]' 
                      : 'bg-white/[0.01] hover:bg-white/[0.05]'
                  }`}
                >
                  {/* Rank - Reduced size */}
                  <div className={`text-xs font-bold w-6 text-center ${
                    isTop3 ? 'text-yellow-400' : 'text-purple-400'
                  }`}>
                    {medal || `#${index + 1}`}
                  </div>
                  
                  {/* Profile Picture - Smaller */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-500/10 flex-shrink-0">
                    {profiles[leader.walletAddress]?.profilePicture ? (
                      <img 
                        src={profiles[leader.walletAddress].profilePicture || undefined} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-400 text-[10px] font-bold">
                        {getDisplayName(leader.walletAddress).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Name and Address - Reduced font size */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-xs truncate ${
                      isTop3 ? 'text-white' : 'text-purple-100'
                    }`}>
                      {getDisplayName(leader.walletAddress)}
                    </div>
                    {profiles[leader.walletAddress]?.username && (
                      <div className="text-[10px] text-purple-500 font-mono">
                        {formatAddress(leader.walletAddress)}
                      </div>
                    )}
                  </div>
                  
                  {/* Income - Compact */}
                  <div className="text-right">
                    <div className={`text-xs font-bold font-mono ${
                      isTop3 ? 'text-green-400' : 'text-green-500'
                    }`}>
                      {formatIncome(leader.dailyIncome)}
                    </div>
                    <div className="text-[9px] text-purple-500 uppercase tracking-wider">
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