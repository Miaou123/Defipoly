'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { getPropertyById } from '@/utils/constants';
import { useNotification } from '@/contexts/NotificationContext';
import { ProfileCustomization } from '@/components/ProfileCustomization';
import { useTheme } from '@/contexts/ThemeContext';

interface Activity {
  signature: string;
  type: 'buy' | 'sell' | 'steal' | 'shield' | 'claim';
  message: string;
  timestamp: number;
  success?: boolean;
  propertyId?: number;
}

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
  rewardsClaimed: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101';

export default function ProfilePage() {
  const { publicKey, connected, disconnect } = useWallet();
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const themeContext = useTheme();
  
  const [username, setUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [stats, setStats] = useState<PlayerStats>({
    walletAddress: '',
    totalActions: 0,
    propertiesBought: 0,
    totalSpent: 0,
    totalEarned: 0,
    totalSlotsOwned: 0,
    successfulSteals: 0,
    failedSteals: 0,
    completedSets: 0,
    shieldsUsed: 0,
    dailyIncome: 0,
    rewardsClaimed: 0,
  });

  // Redirect if not connected
  useEffect(() => {
    if (!connected || !publicKey) {
      router.push('/');
    }
  }, [connected, publicKey, router]);

  // Load username, profile picture, and stats
  useEffect(() => {
    if (!publicKey || !connected) return;

    const fetchData = async () => {
      const walletAddress = publicKey.toString();

      try {
        // Fetch profile
        const profileResponse = await fetch(`${API_BASE_URL}/api/profile/${walletAddress}`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUsername(profileData.username || '');
          setProfilePicture(profileData.profilePicture || null);
        }

        // Fetch stats
        const statsResponse = await fetch(`${API_BASE_URL}/api/stats/${walletAddress}`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats({
            walletAddress: statsData.walletAddress || walletAddress,
            totalActions: statsData.totalActions || 0,
            propertiesBought: statsData.propertiesBought || 0,
            totalSpent: statsData.totalSpent || 0,
            totalEarned: statsData.totalEarned || 0,
            totalSlotsOwned: statsData.totalSlotsOwned || 0,
            successfulSteals: statsData.successfulSteals || 0,
            failedSteals: statsData.failedSteals || 0,
            completedSets: statsData.completedSets || 0,
            shieldsUsed: statsData.shieldsUsed || 0,
            dailyIncome: statsData.dailyIncome || 0,
            rewardsClaimed: statsData.rewardsClaimed || 0,
          });
        }

        // Fetch leaderboard rank
        const leaderboardResponse = await fetch(`${API_BASE_URL}/api/leaderboard?limit=100`);
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();
          const userEntry = leaderboardData.leaderboard.find(
            (entry: any) => entry.walletAddress === walletAddress
          );
          if (userEntry) {
            setLeaderboardRank(userEntry.rank);
          }
        }

        // Fetch activities
        const actionsResponse = await fetch(`${API_BASE_URL}/api/actions/player/${walletAddress}?limit=50`);
        if (actionsResponse.ok) {
          const actionsData = await actionsResponse.json();
          const userActivities: Activity[] = actionsData.actions.map((action: any) => {
            const property = action.propertyId !== null ? getPropertyById(action.propertyId) : null;
            const propertyName = property ? property.name : 'Unknown Property';
            
            const formatAmount = (amount: number) => {
              const tokens = amount / 1e9;
              if (tokens >= 1e6) return `${(tokens / 1e6).toFixed(2)}M`;
              if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(1)}K`;
              return tokens.toFixed(2);
            };

            const formatAddr = (addr: string) => {
              return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
            };

            let message = '';
            let type: Activity['type'] = 'buy';

            switch (action.actionType) {
              case 'buy':
                message = `Bought ${action.slots || 1} slot${(action.slots || 1) > 1 ? 's' : ''} on ${propertyName} 🏠`;
                type = 'buy';
                break;
              case 'sell':
                message = `Sold ${action.slots || 1} slot${(action.slots || 1) > 1 ? 's' : ''} on ${propertyName} for ${formatAmount(action.amount || 0)} DEFI 💰`;
                type = 'sell';
                break;
              case 'steal_success':
                message = `Successfully stole from ${formatAddr(action.targetAddress)} on ${propertyName} 💰`;
                type = 'steal';
                break;
              case 'steal_failed':
                message = `Failed to steal from ${formatAddr(action.targetAddress)} on ${propertyName} 🛡️`;
                type = 'steal';
                break;
              case 'shield':
                message = `Activated shield on ${propertyName} 🛡️`;
                type = 'shield';
                break;
              case 'claim':
                message = `Claimed ${formatAmount(action.amount || 0)} DEFI in rewards 💎`;
                type = 'claim';
                break;
              default:
                message = `Unknown action: ${action.actionType}`;
                type = 'buy';
            }

            return {
              signature: action.txSignature,
              type,
              message,
              timestamp: action.blockTime * 1000,
              success: action.success,
              propertyId: action.propertyId,
            };
          });

          setActivities(userActivities);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [publicKey, connected]);

  const handleSaveUsername = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          username: tempUsername,
        }),
      });

      if (response.ok) {
        setUsername(tempUsername);
        setEditingUsername(false);
        showSuccess('Username Updated', 'Your username has been saved');
      } else {
        showError('Update Failed', 'Failed to update username');
      }
    } catch (error) {
      console.error('Error saving username:', error);
      showError('Update Error', 'Error updating username');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    
    // Less than 1 minute
    if (diff < 60000) return 'just now';
    
    // Less than 1 hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} min${mins > 1 ? 's' : ''} ago`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Full date
    return date.toLocaleDateString();
  };

  if (!connected || !publicKey) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden relative">
      {/* Main grid layout - 3 columns with larger center */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,320px)_minmax(900px,1fr)_minmax(280px,320px)] gap-6 p-4 h-full w-full mx-auto">
        
        {/* LEFT COLUMN: Logo only */}
        <div className="flex flex-col gap-2 overflow-hidden">
          {/* Logo at top */}
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
          
          {/* Empty space */}
          <div className="flex-1"></div>
        </div>

        {/* CENTER: All Main Content with padding */}
        <div className="flex items-start justify-center overflow-hidden py-6">
          <div className="w-full h-full overflow-y-auto">
            {/* 2 Column Grid for Profile Customization and Stats/Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-5 h-full">
              {/* Profile & Customization */}
              <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 overflow-y-auto">
                <ProfileCustomization
                  profilePicture={profilePicture}
                  setProfilePicture={setProfilePicture}
                  username={username}
                  setUsername={setUsername}
                  editingUsername={editingUsername}
                  setEditingUsername={setEditingUsername}
                  tempUsername={tempUsername}
                  setTempUsername={setTempUsername}
                  onSaveUsername={handleSaveUsername}
                  boardTheme={themeContext.boardTheme}
                  setBoardTheme={themeContext.setBoardTheme}
                  propertyCardTheme={themeContext.propertyCardTheme}
                  setPropertyCardTheme={themeContext.setPropertyCardTheme}
                  customBoardBackground={themeContext.customBoardBackground}
                  setCustomBoardBackground={themeContext.setCustomBoardBackground}
                  customPropertyCardBackground={themeContext.customPropertyCardBackground}
                  setCustomPropertyCardBackground={themeContext.setCustomPropertyCardBackground}
                  walletAddress={publicKey.toString()}
                />
              </div>

              {/* Stats & Activity */}
              <div className="grid grid-rows-[auto_1fr] gap-4 overflow-hidden">
                {/* Quick Stats Card */}
                <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-5 flex-shrink-0">
                  <h2 className="text-base font-bold text-purple-100 mb-4 flex items-center gap-2">
                    <span>📊</span> Stats
                  </h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Leaderboard Rank */}
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Leaderboard Rank</div>
                      <div className="text-xl font-bold text-yellow-400">
                        {leaderboardRank ? `#${leaderboardRank}` : 'N/A'}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Total Slots</div>
                      <div className="text-xl font-bold text-purple-100">{stats.totalSlotsOwned}</div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Properties</div>
                      <div className="text-xl font-bold text-purple-100">{stats.propertiesBought}</div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Completed Sets</div>
                      <div className="text-xl font-bold text-purple-100">{stats.completedSets}</div>
                    </div>
                    
                    {/* Steals - with breakdown */}
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Steals</div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-xl font-bold text-purple-100">{stats.successfulSteals + stats.failedSteals}</div>
                        <div className="text-[10px] text-purple-400">
                          <span className="text-green-400">{stats.successfulSteals}</span>
                          <span className="text-purple-500">/</span>
                          <span className="text-red-400">{stats.failedSteals}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Shields Used</div>
                      <div className="text-xl font-bold text-purple-100">{stats.shieldsUsed}</div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Daily Income</div>
                      <div className="text-xl font-bold text-purple-100">
                        {stats.dailyIncome.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Total Claimed</div>
                      <div className="text-xl font-bold text-purple-100">{Math.floor(stats.totalEarned / 1e9).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Activity History */}
                <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-5 flex flex-col overflow-hidden">
                  <h2 className="text-base font-bold text-purple-100 mb-4 flex items-center gap-2 flex-shrink-0">
                    <span>📜</span> Activity History
                  </h2>
                  
                  {loading ? (
                    <div className="text-center py-16">
                      <div className="text-4xl mb-4">⏳</div>
                      <div className="text-purple-300">Loading your activity...</div>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4 opacity-50">📋</div>
                      <div className="text-purple-400 text-lg">No activity yet</div>
                      <div className="text-sm text-purple-500 mt-2">Start playing to see your history!</div>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                      {activities.map((activity) => (
                        <div
                          key={activity.signature}
                          className={`p-3 bg-purple-900/10 rounded-lg border-l-4 hover:bg-purple-900/20 transition-all ${
                            activity.type === 'buy' ? 'border-green-400' :
                            activity.type === 'steal' ? (activity.success ? 'border-emerald-400' : 'border-red-400') :
                            activity.type === 'claim' ? 'border-blue-400' :
                            activity.type === 'sell' ? 'border-orange-400' :
                            'border-amber-400'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-purple-100 text-sm leading-relaxed">{activity.message}</div>
                              <div className="text-xs text-purple-400 mt-1">
                                {formatTimestamp(activity.timestamp)}
                              </div>
                            </div>
                            <a
                              href={`https://explorer.solana.com/tx/${activity.signature}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 px-2 py-1 bg-purple-600/50 hover:bg-purple-600 rounded text-xs transition-colors"
                            >
                              TX
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* RIGHT COLUMN: Back Button + Wallet Display */}
        <div className="flex flex-col gap-2 overflow-hidden">
          {/* Back Button + Wallet Display - styled like ProfileWallet */}
          <div className="flex-shrink-0">
            <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-purple-500/30 shadow-xl overflow-hidden">
              {/* Back Button */}
              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-3 hover:bg-purple-900/20 transition-all flex items-center gap-3 text-left"
              >
                {/* Back Icon */}
                <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
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

              {/* Divider */}
              <div className="h-px bg-purple-500/20"></div>

              {/* Wallet Section - Clickable to disconnect */}
              <button
                onClick={() => {
                  if (connected) {
                    disconnect();
                  }
                }}
                className="w-full px-4 py-3 hover:bg-purple-900/20 transition-all flex items-center gap-3"
              >
                {/* Wallet Icon */}
                <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-300">
                    <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
                  </svg>
                </div>

                {/* Wallet Address */}
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs text-purple-300">Wallet</div>
                  <div className="text-sm font-mono font-bold text-white truncate">
                    {formatAddress(publicKey.toString())}
                  </div>
                </div>

                {/* Connected Indicator */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-semibold">Connected</span>
                </div>
              </button>
            </div>
          </div>
          
          {/* Empty space */}
          <div className="flex-1"></div>
        </div>
      </div>
    </div>
  );
}