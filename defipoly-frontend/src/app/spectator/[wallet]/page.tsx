'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Board } from '@/components/Board';
import { Leaderboard } from '@/components/Leaderboard';
import { LiveFeed } from '@/components/LiveFeed';
import { getProfilesBatch, ProfileData } from '@/utils/profileStorage';
import { getCachedSpectator, setCachedSpectator } from '@/utils/spectatorCache';

import { API_BASE_URL, getImageUrl } from '@/utils/config';

interface PlayerStats {
  walletAddress: string;
  totalActions: number;
  propertiesBought: number;
  totalSpent: number;
  totalEarned: number;
  totalSlotsOwned: number;
  successfulSteals: number;
  failedSteals: number;
  completedSets: number;
  shieldsUsed: number;
  dailyIncome: number;
}

export default function SpectatorPage() {
  const params = useParams();
  const router = useRouter();
  const walletAddress = params['wallet'] as string;
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [spectatorOwnerships, setSpectatorOwnerships] = useState<any[]>([]);
  
  // Scaling system (same as main page)
  const [isMobile, setIsMobile] = useState(false);
  const [sideColumnWidth, setSideColumnWidth] = useState(400);
  
  // Calculate scaleFactor based on side column width (from 0.7 to 1.0)
  const scaleFactor = Math.max(0.7, Math.min(1.0, sideColumnWidth / 400));

  // Check for mobile and calculate column width
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1024);
      
      // Calculate side column width based on screen size
      if (width < 1200) {
        setSideColumnWidth(240);
      } else if (width < 1400) {
        setSideColumnWidth(280);
      } else if (width < 1600) {
        setSideColumnWidth(340);
      } else {
        setSideColumnWidth(400);
      }
    };
    
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) return;
  
      // ✅ Check shared cache first
      const cached = getCachedSpectator(walletAddress);
      
      if (cached) {
        setProfile(cached.profile);
        setStats(cached.stats);
        setSpectatorOwnerships(cached.ownerships || []); 
        setLeaderboardRank(cached.rank || null);
        setLoading(false);
        return;
      }
  
      
      try {
        // Fetch all endpoints in parallel including leaderboard to get rank
        const [profileResponse, statsResponse, gameStateResponse, leaderboardResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/profile/${walletAddress}`),
          fetch(`${API_BASE_URL}/api/stats/${walletAddress}`),
          fetch(`${API_BASE_URL}/api/game-state/${walletAddress}`),
          fetch(`${API_BASE_URL}/api/leaderboard?limit=1000`) // Get more entries to find user's rank
        ]);
        
        let profileData = null;
        
        if (profileResponse.ok) {
          profileData = await profileResponse.json();
        } else {
          console.warn('⚠️ [SPECTATOR] Profile not found, using defaults');
          profileData = {
            walletAddress,
            username: null,
            profilePicture: null,
            cornerSquareStyle: 'property',
            boardTheme: 'dark',
            propertyCardTheme: 'dark',
            customBoardBackground: null,
            customPropertyCardBackground: null,
            customSceneBackground: null
          };
        }
        
        let statsData = null;
        if (statsResponse.ok) {
          statsData = await statsResponse.json();
        }

        let ownershipsData: any[] = [];
        if (gameStateResponse.ok) {
          const gameStateData = await gameStateResponse.json();
          ownershipsData = gameStateData.data.ownerships.map((o: any) => ({
            player: walletAddress,
            propertyId: o.propertyId,
            slotsOwned: o.slotsOwned,
            slotsShielded: o.slotsShielded,
            purchaseTimestamp: { toNumber: () => o.purchaseTimestamp },
            shieldExpiry: { toNumber: () => o.shieldExpiry },
            shieldCooldownDuration: { toNumber: () => o.shieldCooldownDuration },
            stealProtectionExpiry: { toNumber: () => o.stealProtectionExpiry },
            bump: o.bump,
          }));
        }

        // Extract leaderboard rank
        let userRank = null;
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();
          const userEntry = leaderboardData.leaderboard?.find((entry: any) => 
            entry.walletAddress === walletAddress
          );
          userRank = userEntry?.rank || null;
          console.log('🏆 [SPECTATOR] User rank found:', userRank);
        }

        setCachedSpectator(walletAddress, profileData, statsData, ownershipsData, userRank);
        
        setProfile(profileData);
        setStats(statsData);
        setSpectatorOwnerships(ownershipsData);
        setLeaderboardRank(userRank); 
  
      } catch (error) {
        console.error('❌ [SPECTATOR] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [walletAddress]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getDisplayName = () => {
    return profile?.username || formatAddress(walletAddress);
  };

  if (!walletAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-white text-center">
          <div className="text-xl mb-2">❌</div>
          <div>Invalid wallet address</div>
        </div>
      </div>
    );
  }


  return (
    <div className="h-screen overflow-hidden relative">
      {/* Main grid layout - with dynamic scaling */}
      <div 
        className="grid gap-2 p-4 h-full w-full mx-auto max-w-[1920px]"
        style={{
          gridTemplateColumns: isMobile ? '1fr' : `${sideColumnWidth}px 1fr ${sideColumnWidth}px`,
        }}
      >
        
        {/* LEFT COLUMN: Logo + Player Profile/Stats */}
        <div className="flex flex-col gap-2 overflow-hidden">
        {/* Logo at top of left column */}
        <a 
          href="/"
          className="flex items-center gap-3 rounded-xl px-4 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <img 
            src="/logo.svg" 
            alt="Defipoly Logo" 
            className="object-contain"
            style={{ 
              width: `${Math.round(48 * scaleFactor)}px`, 
              height: `${Math.round(48 * scaleFactor)}px` 
            }}
          />
          <div>
            <h1 
              className="font-orbitron font-bold text-white"
              style={{ fontSize: `${Math.round(24 * scaleFactor)}px` }}
            >
              Defipoly
            </h1>
          </div>
        </a>
                    
          {/* Player Profile/Stats Card - scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-xl mb-1">⏳</div>
                  <div className="text-xs text-purple-300">Loading profile...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Profile Picture */}
                  <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl overflow-hidden border-4 border-purple-500/30">
                      {getImageUrl(profile?.profilePicture) ? (
                        <img 
                          src={getImageUrl(profile?.profilePicture)!} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        '👤'
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {getDisplayName()}
                    </h3>
                  </div>

                  {/* Wallet Address */}
                  <div className="bg-black/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-purple-400 mb-1">Wallet Address</p>
                    <a
                      href={`https://solscan.io/address/${walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-300 hover:text-white transition-colors text-sm font-mono underline decoration-purple-500 hover:decoration-white"
                    >
                      {formatAddress(walletAddress)}
                    </a>
                  </div>

                  {/* Stats Grid */}
                  {stats && (
                    <div className="space-y-3 mt-6">
                      <h4 className="text-sm font-semibold text-purple-200 border-b border-purple-500/20 pb-2">
                        Player Stats
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {/* Leaderboard Rank */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs text-purple-400 mb-1">Leaderboard Rank</p>
                          <p className="text-lg font-bold text-yellow-400">
                            {leaderboardRank ? `#${leaderboardRank}` : 'N/A'}
                          </p>
                        </div>

                        {/* Total Slots */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs text-purple-400 mb-1">Total Slots</p>
                          <p className="text-lg font-bold text-purple-300">
                            {stats.totalSlotsOwned}
                          </p>
                        </div>

                        {/* Properties Bought */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs text-purple-400 mb-1">Properties</p>
                          <p className="text-lg font-bold text-purple-300">
                            {stats.propertiesBought}
                          </p>
                        </div>

                        {/* Complete Sets */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs text-purple-400 mb-1">Completed Sets</p>
                          <p className="text-lg font-bold text-purple-300">
                            {stats.completedSets}
                          </p>
                        </div>

                        {/* Steals - with breakdown */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs text-purple-400 mb-1">Steals</p>
                          <div className="flex items-center justify-center gap-2">
                            <p className="text-lg font-bold text-purple-300">
                              {stats.successfulSteals + stats.failedSteals}
                            </p>
                            <div className="text-[10px] text-purple-400">
                              <span className="text-green-400">{stats.successfulSteals}</span>
                              <span className="text-purple-500">/</span>
                              <span className="text-red-400">{stats.failedSteals}</span>
                            </div>
                          </div>
                        </div>

                        {/* Shields Used */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs text-purple-400 mb-1">Shields Used</p>
                          <p className="text-lg font-bold text-purple-300">
                            {stats.shieldsUsed}
                          </p>
                        </div>

                        {/* Daily Income */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs text-purple-400 mb-1">Daily Income</p>
                          <p className="text-lg font-bold text-purple-300">
                            {stats.dailyIncome.toLocaleString()}
                          </p>
                        </div>

                        {/* Total Claimed */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs text-purple-400 mb-1">Total Claimed</p>
                          <p className="text-lg font-bold text-purple-300">
                            {Math.floor(stats.totalEarned / 1e9).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CENTER: Board - no background wrapper */}
        <div className="flex items-center justify-center overflow-hidden">
          <Board
            onSelectProperty={() => {}}
            spectatorMode={true}
            spectatorWallet={walletAddress}
            spectatorOwnerships={spectatorOwnerships} 
            profilePicture={profile?.profilePicture || null}
            cornerSquareStyle={profile?.cornerSquareStyle || 'property'}
            customBoardBackground={profile?.customBoardBackground || null}
            custom3DPropertyTiles={profile?.customPropertyCardBackground || null}
            customSceneBackground={profile?.customSceneBackground || null}
          />
        </div>
        
        {/* RIGHT COLUMN: Back Button (styled like ProfileWallet) + Leaderboard + Live Feed */}
        <div className="flex flex-col gap-2 overflow-hidden">
          {/* Back Button - styled like ProfileWallet */}
          <div className="flex-shrink-0">
            <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-purple-500/30 shadow-xl overflow-hidden">
              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-3 hover:bg-purple-900/20 transition-all flex items-center gap-3"
              >
                {/* Back Icon */}
                <div 
                  className="rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0"
                  style={{ 
                    width: `${Math.round(40 * scaleFactor)}px`, 
                    height: `${Math.round(40 * scaleFactor)}px` 
                  }}
                >
                  <svg 
                    className="text-purple-300" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    style={{ 
                      width: `${Math.round(20 * scaleFactor)}px`, 
                      height: `${Math.round(20 * scaleFactor)}px` 
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </div>

                {/* Text */}
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs text-purple-300">Navigation</div>
                  <div className="text-sm font-bold text-white">
                    Back to Game
                  </div>
                </div>
              </button>
            </div>
          </div>
          
          {/* Fixed height container - no scrolling */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Leaderboard - 60% of space */}
            <div className="h-[55%]">
              <Leaderboard scaleFactor={scaleFactor} />
            </div>
            
            {/* Live Feed - 40% of space */}
            <div className="h-[43%]">
              <LiveFeed scaleFactor={scaleFactor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}