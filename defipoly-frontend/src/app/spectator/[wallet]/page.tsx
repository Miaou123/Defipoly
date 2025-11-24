'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Board } from '@/components/Board';
import { Leaderboard } from '@/components/Leaderboard';
import { LiveFeed } from '@/components/LiveFeed';
import { getProfilesBatch, ProfileData } from '@/utils/profileStorage';
import { getCachedSpectator, setCachedSpectator } from '@/utils/spectatorCache';

const API_BASE_URL = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101';

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
  const [spectatorOwnerships, setSpectatorOwnerships] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) return;
  
      // ✅ Check shared cache first
      const cached = getCachedSpectator(walletAddress);
      
      if (cached) {
        console.log('✅ [SPECTATOR CACHE HIT] Using pre-cached data from Leaderboard');
        setProfile(cached.profile);
        setStats(cached.stats);
        setSpectatorOwnerships(cached.ownerships || []); 
        setLoading(false);
        return;
      }
  
      console.log('🔍 [SPECTATOR CACHE MISS] Fetching fresh data (direct URL access)');
      
      try {
        // Only fetch 2 endpoints in parallel (removed leaderboard call)
        const [profileResponse, statsResponse, gameStateResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/profile/${walletAddress}`),
          fetch(`${API_BASE_URL}/api/stats/${walletAddress}`),
          fetch(`${API_BASE_URL}/api/game-state/${walletAddress}`) 
        ]);
        
        let profileData = null;
        
        if (profileResponse.ok) {
          profileData = await profileResponse.json();
          console.log('✅ [SPECTATOR] Profile fetched');
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
            customPropertyCardBackground: null
          };
        }
        
        let statsData = null;
        if (statsResponse.ok) {
          statsData = await statsResponse.json();
          console.log('✅ [SPECTATOR] Stats fetched');
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
          console.log('✅ [SPECTATOR] Game state fetched:', ownershipsData.length, 'ownerships');
        }

        setCachedSpectator(walletAddress, profileData, statsData, ownershipsData);
        console.log('💾 [SPECTATOR] Data cached for 30s');
        
        setProfile(profileData);
        setStats(statsData);
        setSpectatorOwnerships(ownershipsData); 
  
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

  console.log('🎯 [SPECTATOR] Passing to Board component:', {
    profilePicture: profile?.profilePicture || null,
    cornerSquareStyle: profile?.cornerSquareStyle || 'property',
    boardTheme: profile?.boardTheme || 'dark',
    propertyCardTheme: profile?.propertyCardTheme || 'default',
    customBoardBackground: profile?.customBoardBackground || null,
    customPropertyCardBackground: profile?.customPropertyCardBackground || null
  });

  return (
    <div className="h-screen overflow-hidden relative">
      {/* Main grid layout - matching home page structure */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,400px)_minmax(800px,1fr)_minmax(320px,400px)] gap-6 p-4 h-full w-full mx-auto">
        
        {/* LEFT COLUMN: Logo + Player Profile/Stats */}
        <div className="flex flex-col gap-2 overflow-hidden">
          {/* Logo at top of left column */}
          <div className="flex items-center gap-3 rounded-xl px-4 flex-shrink-0">
            <img 
              src="/logo.svg" 
              alt="Defipoly Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-purple-100">Defipoly</h1>
            </div>
          </div>
          
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
                      {profile?.profilePicture ? (
                        <img 
                          src={profile.profilePicture} 
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
            boardTheme={profile?.boardTheme || 'dark'}
            propertyCardTheme={profile?.propertyCardTheme || 'default'}
            profilePicture={profile?.profilePicture || null}
            cornerSquareStyle={profile?.cornerSquareStyle || 'property'}
            customBoardBackground={profile?.customBoardBackground || null}
            customPropertyCardBackground={profile?.customPropertyCardBackground || null}
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
                <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                {/* Arrow icon */}
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Fixed height container - no scrolling */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Leaderboard - 60% of space */}
            <div className="h-[55%]">
              <Leaderboard />
            </div>
            
            {/* Live Feed - 40% of space */}
            <div className="h-[43%]">
              <LiveFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}