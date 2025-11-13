'use client';

import { useEffect, useState, useRef } from 'react';
import { getProfilesBatch, ProfileData } from '@/utils/profileStorage';
import { TrophyIcon, HexagonBadge } from './icons/UIIcons';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  displayName: string;
  leaderboardScore: number;
  totalEarned: number;
  propertiesBought: number;
  successfulSteals: number;
  completeSets: number;
  shieldsActivated: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101';

export function Leaderboard() {
  const { socket, connected } = useWebSocket();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  // Initial fetch (only once)
  useEffect(() => {
    if (initialLoadDone.current) return;

    const fetchInitialLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/leaderboard?limit=50`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        
        const data: LeaderboardData = await response.json();
        setLeaderboardData(data);
        
        // Fetch profiles for all wallet addresses
        const walletAddresses = data.leaderboard.map((entry) => entry.walletAddress);
        if (walletAddresses.length > 0) {
          const profilesData = await getProfilesBatch(walletAddresses);
          setProfiles(profilesData);
        }
        
        initialLoadDone.current = true;
      } catch (error) {
        console.error('❌ Error fetching leaderboard:', error);
        setLeaderboardData(null);
        initialLoadDone.current = true;
      } finally {
        setLoading(false);
      }
    };

    fetchInitialLeaderboard();
  }, []);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (!socket || !connected) return;

    const handleLeaderboardChanged = async (data: any) => {
      console.log('🏆 Leaderboard updated via WebSocket:', data);
      
      if (data.topPlayers && Array.isArray(data.topPlayers)) {
        // Convert backend format to frontend format
        const formattedLeaderboard = data.topPlayers.map((player: any) => ({
          rank: player.rank,
          walletAddress: player.walletAddress,
          displayName: `${player.walletAddress.slice(0, 4)}...${player.walletAddress.slice(-4)}`,
          leaderboardScore: player.leaderboardScore,
          totalEarned: player.totalEarned || 0,
          propertiesBought: player.propertiesBought || 0,
          successfulSteals: player.successfulSteals || 0,
          completeSets: player.completeSets || 0,
          shieldsActivated: player.shieldsActivated || 0
        }));

        setLeaderboardData({
          leaderboard: formattedLeaderboard,
          pagination: {
            limit: formattedLeaderboard.length,
            offset: 0,
            count: formattedLeaderboard.length
          }
        });

        // Fetch profiles for any new addresses
        const walletAddresses = formattedLeaderboard.map((entry: any) => entry.walletAddress);
        const newAddresses = walletAddresses.filter(addr => !profiles[addr]);
        
        if (newAddresses.length > 0) {
          const profilesData = await getProfilesBatch(newAddresses);
          setProfiles(prev => ({ ...prev, ...profilesData }));
        }
      }
    };

    socket.on('leaderboard-changed', handleLeaderboardChanged);

    return () => {
      socket.off('leaderboard-changed', handleLeaderboardChanged);
    };
  }, [socket, connected, profiles]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getDisplayName = (address: string) => {
    const profile = profiles[address];
    return profile?.username || formatAddress(address);
  };

  const handlePlayerClick = (leader: LeaderboardEntry) => {
    window.location.href = `/spectator/${leader.walletAddress}`;
  };

  const formatTokenAmount = (lamports: number) => {
    const tokens = lamports / 1e9;
    if (tokens >= 1e9) return `${(tokens / 1e9).toFixed(1)}B`;
    if (tokens >= 1e6) return `${(tokens / 1e6).toFixed(1)}M`;
    if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(1)}K`;
    return tokens.toFixed(0);
  };

  return (
    <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 max-h-[400px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              🏆 Leaderboard
            </h2>
            <p className="text-xs text-purple-400 mt-0.5">Click on a player to see their board</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-xl mb-1">⏳</div>
            <div className="text-xs text-purple-300">Loading...</div>
          </div>
        ) : !leaderboardData || leaderboardData.leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <TrophyIcon size={24} className="mx-auto mb-1 text-yellow-400" />
            <div className="text-xs text-purple-400">No players yet</div>
            <div className="text-[10px] text-purple-500 mt-0.5">Be the first!</div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {leaderboardData.leaderboard.map((leader) => {
              const isTop3 = leader.rank <= 3;
              const medal = leader.rank === 1 ? '🥇' : leader.rank === 2 ? '🥈' : leader.rank === 3 ? '🥉' : '';
              
              return (
                <div
                  key={leader.walletAddress}
                  onClick={() => handlePlayerClick(leader)}
                  className={`flex items-center gap-3 py-2 px-2 rounded-lg transition-all cursor-pointer ${
                    isTop3 
                      ? 'bg-white/[0.03] hover:bg-white/[0.08]' 
                      : 'bg-white/[0.01] hover:bg-white/[0.05]'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-6 flex justify-center items-center">
                    {isTop3 ? (
                      <HexagonBadge rank={leader.rank as 1 | 2 | 3} size={24} />
                    ) : (
                      <div className="text-xs font-bold text-purple-400">
                        #{leader.rank}
                      </div>
                    )}
                  </div>
                  
                  {/* Profile Picture */}
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
                  
                  {/* Name and Details */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-xs truncate ${
                      isTop3 ? 'text-white' : 'text-purple-100'
                    }`}>
                      {getDisplayName(leader.walletAddress)}
                    </div>
                  </div>
                  
                  {/* Score */}
                  <div className="text-right">
                    <div className={`text-xs font-bold font-mono ${
                      isTop3 ? 'text-yellow-400' : 'text-purple-300'
                    }`}>
                      {leader.leaderboardScore.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-purple-500 uppercase tracking-wider">
                      score
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