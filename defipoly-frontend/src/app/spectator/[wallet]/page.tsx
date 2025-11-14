'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Board } from '@/components/Board';
import { Leaderboard } from '@/components/Leaderboard';
import { LiveFeed } from '@/components/LiveFeed';
import { getProfilesBatch, ProfileData } from '@/utils/profileStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101';

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
  boardValue: number;
}

export default function SpectatorPage() {
  const params = useParams();
  const router = useRouter();
  const walletAddress = params.wallet as string;
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) return;
      
      try {
        // Fetch profile
        const profiles = await getProfilesBatch([walletAddress]);
        const profileData = profiles[walletAddress] || null;
        console.log('🔍 [SPECTATOR] Fetched profile data for', walletAddress, ':', profileData);
        console.log('🔍 [SPECTATOR] Custom backgrounds:', {
          customBoardBackground: profileData?.customBoardBackground,
          customPropertyCardBackground: profileData?.customPropertyCardBackground
        });
        setProfile(profileData);

        // Fetch stats
        const statsResponse = await fetch(`${API_BASE_URL}/api/stats/${walletAddress}`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
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

  const formatTokenAmount = (lamports: number) => {
    const tokens = lamports / 1e9;
    if (tokens >= 1e9) return `${(tokens / 1e9).toFixed(1)}B`;
    if (tokens >= 1e6) return `${(tokens / 1e6).toFixed(1)}M`;
    if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(1)}K`;
    return tokens.toFixed(2);
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
    propertyCardTheme: profile?.propertyCardTheme || 'dark',
    customBoardBackground: profile?.customBoardBackground || null,
    customPropertyCardBackground: profile?.customPropertyCardBackground || null
  });

  return (
    <div className="h-screen overflow-hidden relative">
      {/* Back to Game button - top right */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-4 right-4 z-50 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all font-semibold text-sm shadow-lg"
      >
        🏠 Back to Game
      </button>

      {/* Main grid layout - matching home page structure */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,400px)_minmax(800px,1fr)_minmax(320px,400px)] gap-6 p-4 h-full w-full mx-auto">
        
        {/* LEFT COLUMN: Logo + Player Profile */}
        <div className="flex flex-col gap-4 overflow-hidden">
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
          
          {/* Player Profile Card */}
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
                        {/* Total Earned */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs text-purple-400 mb-1">Total Earned</p>
                          <p className="text-lg font-bold text-green-400">
                            {formatTokenAmount(stats.totalEarned)} SOL
                          </p>
                        </div>

                        {/* Board Value */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs text-purple-400 mb-1">Board Value</p>
                          <p className="text-lg font-bold text-blue-400">
                            {formatTokenAmount(stats.boardValue)} SOL
                          </p>
                        </div>

                        {/* Properties Bought */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs text-purple-400 mb-1">Properties</p>
                          <p className="text-lg font-bold text-purple-300">
                            {stats.propertiesBought}
                          </p>
                        </div>

                        {/* Total Slots */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs text-purple-400 mb-1">Total Slots</p>
                          <p className="text-lg font-bold text-purple-300">
                            {stats.totalSlotsOwned}
                          </p>
                        </div>

                        {/* Successful Steals */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs text-purple-400 mb-1">Steals</p>
                          <p className="text-lg font-bold text-red-400">
                            {stats.successfulSteals}
                          </p>
                        </div>

                        {/* Complete Sets */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs text-purple-400 mb-1">Complete Sets</p>
                          <p className="text-lg font-bold text-yellow-400">
                            {stats.completedSets}
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

        {/* CENTER: Board */}
        <div className="flex items-center justify-center overflow-hidden">
          <Board 
            onSelectProperty={() => {}} 
            spectatorMode={true}
            spectatorWallet={walletAddress}
            profilePicture={profile?.profilePicture || null}
            cornerSquareStyle={profile?.cornerSquareStyle || 'property'}
            boardTheme={profile?.boardTheme || 'dark'}
            propertyCardTheme={profile?.propertyCardTheme || 'dark'}
            customBoardBackground={profile?.customBoardBackground || null}
            customPropertyCardBackground={profile?.customPropertyCardBackground || null}
          />
        </div>
        
        {/* RIGHT COLUMN: Leaderboard + Live Feed */}
        <div className="flex flex-col gap-1 overflow-hidden">
          {/* Defipoly logo placeholder for alignment */}
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 flex-shrink-0 opacity-0 pointer-events-none">
            <div className="text-2xl">🎲</div>
            <div>
              <h1 className="text-lg font-bold text-purple-100">Defipoly</h1>
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