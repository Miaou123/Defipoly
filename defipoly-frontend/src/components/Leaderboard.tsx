'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TrophyIcon, HexagonBadge, PointerArrowIcon } from './icons/UIIcons';
import { ProfileData } from '@/utils/profileStorage';
import { setCachedSpectator } from '@/utils/spectatorCache';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useGameState } from '@/contexts/GameStateContext';

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

const API_BASE_URL = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101';

interface LeaderboardProps {
  scaleFactor?: number;
}

export function Leaderboard({ scaleFactor = 1 }: LeaderboardProps) {
  const { socket, connected } = useWebSocket(); 
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [loading, setLoading] = useState(true);
  const [showSpectatorHint, setShowSpectatorHint] = useState(false);
  
  // For portal arrow positioning
  const firstRowRef = useRef<HTMLDivElement>(null);
  const [arrowPosition, setArrowPosition] = useState<{ top: number; left: number } | null>(null);
  
  // Get game state to check if user owns properties
  const gameState = useGameState();
  const totalSlotsOwned = gameState.stats.totalSlotsOwned || 0;

  // Scaled sizes
  const headerIconSize = Math.max(14, Math.round(20 * scaleFactor));
  const titleSize = Math.max(12, Math.round(18 * scaleFactor));
  const subtitleSize = Math.max(8, Math.round(12 * scaleFactor));
  const rankSize = Math.max(8, Math.round(12 * scaleFactor));
  const nameSize = Math.max(9, Math.round(12 * scaleFactor));
  const scoreSize = Math.max(9, Math.round(12 * scaleFactor));
  const avatarSize = Math.max(24, Math.round(32 * scaleFactor));
  const badgeSize = Math.max(24, Math.round(32 * scaleFactor));
  const rowPaddingY = Math.max(4, Math.round(8 * scaleFactor));
  const rowPaddingX = Math.max(4, Math.round(8 * scaleFactor));
  const headerPadding = Math.max(8, Math.round(16 * scaleFactor));
  const rowGap = Math.max(8, Math.round(12 * scaleFactor));

  // Check if we should show the spectator hint
  useEffect(() => {
    const hasUsedSpectator = localStorage.getItem('hasUsedSpectator');
    // Show hint if: user owns at least 1 property AND hasn't used spectator yet
    if (!hasUsedSpectator && totalSlotsOwned > 0) {
      setShowSpectatorHint(true);
    }
  }, [totalSlotsOwned]);

  // Update arrow position when hint is shown
  useEffect(() => {
    if (!showSpectatorHint || !firstRowRef.current) return;
    
    const updatePosition = () => {
      const rect = firstRowRef.current?.getBoundingClientRect();
      if (rect) {
        setArrowPosition({
          top: rect.top + rect.height / 2 - 12,
          left: rect.left - 28
        });
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showSpectatorHint, loading]);

  const dismissSpectatorHint = () => {
    localStorage.setItem('hasUsedSpectator', 'true');
    setShowSpectatorHint(false);
    setArrowPosition(null);
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        console.log('🏆 Fetching leaderboard from backend...');
        
        const response = await fetch(`${API_BASE_URL}/api/leaderboard?limit=50`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        
        const data: LeaderboardData = await response.json();
        
        console.log(`🏆 Found ${data.leaderboard.length} players`);
        setLeaderboardData(data);
        
        // Check if backend has a batch profiles endpoint, otherwise use localStorage
        const walletAddresses = data.leaderboard.map((entry) => entry.walletAddress);
        
        if (walletAddresses.length > 0) {
          try {
            // Try batch API first
            const profilesResponse = await fetch(`${API_BASE_URL}/api/profiles/batch`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ wallets: walletAddresses })
            });
            
            if (profilesResponse.ok) {
              const profilesData = await profilesResponse.json();
              setProfiles(profilesData.profiles);
            } else {
              console.warn('🏆 Batch profiles API unavailable, showing wallet addresses only');
              const profilesData: Record<string, ProfileData> = {};
              for (const wallet of walletAddresses) {
                profilesData[wallet] = {
                  username: null,
                  profilePicture: null,
                  cornerSquareStyle: 'property',
                  boardTheme: 'dark',
                  propertyCardTheme: 'dark',
                  customBoardBackground: null,
                  customPropertyCardBackground: null,
                  lastUpdated: 0
                };
              }
              setProfiles(profilesData);
            }
          } catch (error) {
            console.warn('🏆 Failed to fetch profiles, showing wallet addresses only:', error);
            const profilesData: Record<string, ProfileData> = {};
            for (const wallet of walletAddresses) {
              profilesData[wallet] = {
                username: null,
                profilePicture: null,
                cornerSquareStyle: 'property',
                boardTheme: 'dark',
                propertyCardTheme: 'dark',
                customBoardBackground: null,
                customPropertyCardBackground: null,
                lastUpdated: 0
              };
            }
            setProfiles(profilesData);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching leaderboard:', error);
        setLeaderboardData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (!socket || !connected) return;

    const handleLeaderboardChanged = (data: any) => {
      console.log('🏆 Leaderboard updated via WebSocket');
      if (data.topPlayers) {
        setLeaderboardData(prev => prev ? {
          ...prev,
          leaderboard: data.topPlayers
        } : null);
      }
    };

    socket.on('leaderboard-changed', handleLeaderboardChanged);

    return () => {
      socket.off('leaderboard-changed', handleLeaderboardChanged);
    };
  }, [socket, connected]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getDisplayName = (address: string) => {
    const profile = profiles[address];
    return profile?.username || formatAddress(address);
  };

  const handlePlayerClick = (leader: LeaderboardEntry) => {
    // Dismiss hint on first click
    if (showSpectatorHint) {
      dismissSpectatorHint();
    }
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
    <>
      <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div style={{ padding: `${headerPadding}px`, paddingBottom: `${headerPadding / 2}px` }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center border-b border-purple-500/20" style={{ gap: `${rowGap}px`, paddingBottom: `${rowPaddingY}px` }}>
                <TrophyIcon size={headerIconSize} className="text-yellow-400" />
                <h2 className="font-orbitron font-bold text-white" style={{ fontSize: `${titleSize}px` }}>
                  Leaderboard
                </h2>
              </div>
              <p className="text-purple-400" style={{ fontSize: `${subtitleSize}px`, marginTop: `${Math.round(4 * scaleFactor)}px` }}>Click on a player to see their board</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: `0 ${headerPadding}px ${headerPadding}px` }}>
        {loading ? (
            <div className="text-center" style={{ padding: `${headerPadding * 2}px 0` }}>
              <div style={{ fontSize: `${Math.round(20 * scaleFactor)}px`, marginBottom: `${Math.round(4 * scaleFactor)}px` }}>⏳</div>
              <div className="text-purple-300" style={{ fontSize: `${subtitleSize}px` }}>Loading...</div>
            </div>
          ) : !leaderboardData || leaderboardData.leaderboard.length === 0 ? (
            <div className="text-center" style={{ padding: `${headerPadding * 2}px 0` }}>
              <TrophyIcon size={Math.round(24 * scaleFactor)} className="mx-auto text-yellow-400" style={{ marginBottom: `${Math.round(4 * scaleFactor)}px` }} />
              <div className="text-purple-400" style={{ fontSize: `${subtitleSize}px` }}>No players yet</div>
              <div className="text-purple-500" style={{ fontSize: `${Math.round(10 * scaleFactor)}px`, marginTop: `${Math.round(2 * scaleFactor)}px` }}>Be the first!</div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {leaderboardData.leaderboard.map((leader, index) => {
                const isTop3 = leader.rank <= 3;
                const isFirstRow = index === 0;
                const showHintOnRow = showSpectatorHint && isFirstRow;
                
                return (
                  <div

                    key={leader.walletAddress}
                    ref={isFirstRow ? firstRowRef : null}
                    onClick={() => handlePlayerClick(leader)}
                    className={`relative flex items-center gap-3 py-2 px-2 rounded-lg transition-all cursor-pointer ${
                      showHintOnRow
                        ? 'bg-yellow-500/10 border border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                        : isTop3 
                          ? 'bg-white/[0.03] hover:bg-white/[0.08]' 
                          : 'bg-white/[0.01] hover:bg-white/[0.05]'
                    }`}
                  >
                    {/* Rank - Use HexagonBadge for top 3 */}
                    <div className="flex items-center justify-center" style={{ width: `${badgeSize}px` }}>
                      {isTop3 ? (
                        <HexagonBadge rank={leader.rank as 1 | 2 | 3} size={badgeSize} />
                      ) : (
                        <div className="font-bold text-purple-400" style={{ fontSize: `${rankSize}px` }}>
                          #{leader.rank}
                        </div>
                      )}
                    </div>
                    
                    {/* Profile Picture */}
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-500/10 flex-shrink-0">
                      {profiles[leader.walletAddress]?.profilePicture ? (
                        <img 
                          src={profiles[leader.walletAddress]?.profilePicture || undefined} 
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Portal arrow - renders at document.body level */}
      {showSpectatorHint && arrowPosition && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed animate-bounce-x pointer-events-none"
          style={{ 
            top: arrowPosition.top, 
            left: arrowPosition.left,
            transform: 'translateY(-50%)',
            zIndex: 9999
          }}
        >
          <PointerArrowIcon className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
        </div>,
        document.body
      )}
    </>
  );
}