'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { getPropertyById } from '@/utils/constants';
import { useNotification } from '@/contexts/NotificationContext';
import { ProfileCustomization } from '@/components/ProfileCustomization';
import { useGameState } from '@/contexts/GameStateContext';
import { TOKEN_TICKER } from '@/utils/constants';

interface Activity {
  signature: string;
  type: 'buy' | 'sell' | 'steal' | 'shield' | 'claim';
  message: string;
  timestamp: number;
  success?: boolean;
  propertyId?: number;
}

const API_BASE_URL = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101';

export default function ProfilePage() {
  const { publicKey, connected, disconnect } = useWallet();
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const gameState = useGameState();
  
  // Form state only
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  
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

  // Redirect if not connected
  useEffect(() => {
    if (!connected || !publicKey) {
      router.push('/');
    }
  }, [connected, publicKey, router]);

  // Load activities and leaderboard rank
  useEffect(() => {
    if (!publicKey || !connected) return;

    const fetchData = async () => {
      const walletAddress = publicKey.toString();

      try {
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
                message = `Sold ${action.slots || 1} slot${(action.slots || 1) > 1 ? 's' : ''} on ${propertyName} for ${formatAmount(action.amount || 0)} ${TOKEN_TICKER} 💰`;
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
                message = `Claimed ${formatAmount(action.amount || 0)} ${TOKEN_TICKER} in rewards 💎`;
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
    if (!publicKey || !tempUsername.trim()) {
      showError('Invalid Input', 'Please enter a username');
      return;
    }

    const success = await gameState.updateProfile({ username: tempUsername.trim() });
    
    if (success) {
      setEditingUsername(false);
      showSuccess('Success', 'Username updated successfully');
    } else {
      showError('Update Error', 'Failed to update username');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} min${mins > 1 ? 's' : ''} ago`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString();
  };

  if (!connected || !publicKey) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden relative">
      {/* Mobile/Tablet Header - Shows when sidebars are hidden */}
      <div className="xl:hidden fixed top-4 left-4 right-4 z-50 flex justify-between items-center">
        {/* Left: Logo */}
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src="/logo.svg" alt="Defipoly" className="w-10 h-10" />
          <span className="font-orbitron text-2xl font-bold text-white">Defipoly</span>
        </a>
        
        {/* Right: Back + Wallet - ProfileWallet style */}
        <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-purple-500/30 shadow-xl flex">
          {/* Back to Game Button */}
          <button
            onClick={() => router.push('/')}
            className="px-4 py-3 hover:bg-purple-900/20 transition-all flex items-center gap-3 border-r border-purple-500/20"
          >
            <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-xs text-purple-300">Navigation</div>
              <div className="text-sm font-bold text-white">Back to Game</div>
            </div>
          </button>
          
          {/* Wallet Button */}
          <button
            onClick={disconnect}
            className="px-4 py-3 hover:bg-purple-900/20 transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-300">
                <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
                <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs text-purple-300">Wallet</div>
              <div className="text-sm font-mono font-bold text-white truncate">
                {formatAddress(publicKey.toString())}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-semibold">Connected</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main grid layout - 3 columns */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,320px)_1fr_minmax(280px,320px)] gap-4 p-4 h-full w-full mx-auto">
        
        {/* LEFT COLUMN: Logo */}
        <div className="hidden xl:flex flex-col gap-2 overflow-hidden">
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
          <div className="flex-1"></div>
        </div>

        {/* CENTER: Main Content */}
        <div className="flex items-start justify-center overflow-hidden py-6 pt-24 xl:pt-6 px-4 xl:px-0">
          <div className="w-full h-full overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-5 h-full">
              
              {/* Profile & Customization */}
              <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 overflow-y-auto">
                <ProfileCustomization
                  profilePicture={gameState.profile.profilePicture}
                  setProfilePicture={async (picture) => {
                    await gameState.updateProfile({ profilePicture: picture });
                  }}
                  username={gameState.profile.username || ''}
                  setUsername={async (username) => {
                    await gameState.updateProfile({ username });
                  }}
                  editingUsername={editingUsername}
                  setEditingUsername={setEditingUsername}
                  tempUsername={tempUsername}
                  setTempUsername={setTempUsername}
                  onSaveUsername={handleSaveUsername}
                  boardTheme={gameState.profile.boardTheme}
                  setBoardTheme={async (theme) => {
                    await gameState.updateProfile({ boardTheme: theme });
                  }}
                  propertyCardTheme={gameState.profile.propertyCardTheme}
                  setPropertyCardTheme={async (theme) => {
                    await gameState.updateProfile({ propertyCardTheme: theme });
                  }}
                  customBoardBackground={gameState.profile.customBoardBackground}
                  setCustomBoardBackground={async (bg) => {
                    await gameState.updateProfile({ customBoardBackground: bg });
                  }}
                  customPropertyCardBackground={gameState.profile.customPropertyCardBackground}
                  setCustomPropertyCardBackground={async (bg) => {
                    await gameState.updateProfile({ customPropertyCardBackground: bg });
                  }}
                  customSceneBackground={gameState.profile.customSceneBackground}
                  setCustomSceneBackground={async (bg) => {
                    await gameState.updateProfile({ customSceneBackground: bg });
                  }}
                  walletAddress={publicKey.toString()}
                />
              </div>

              {/* Stats & Activity */}
              <div className="grid grid-rows-[auto_1fr] gap-4 overflow-hidden">
                
                {/* Stats Card */}
                <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-5 flex-shrink-0">
                  <h2 className="text-base font-bold text-purple-100 mb-4 flex items-center gap-2">
                    <span>📊</span> Stats
                  </h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Leaderboard Rank</div>
                      <div className="text-xl font-bold text-yellow-400">
                        {leaderboardRank ? `#${leaderboardRank}` : 'N/A'}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Total Slots</div>
                      <div className="text-xl font-bold text-purple-100">{gameState.stats.totalSlotsOwned}</div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Properties</div>
                      <div className="text-xl font-bold text-purple-100">{gameState.stats.propertiesBought}</div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Completed Sets</div>
                      <div className="text-xl font-bold text-purple-100">{gameState.stats.completeSets}</div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Steals</div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-xl font-bold text-purple-100">
                          {gameState.stats.successfulSteals + gameState.stats.failedSteals}
                        </div>
                        <div className="text-[10px] text-purple-400">
                          <span className="text-green-400">{gameState.stats.successfulSteals}</span>
                          <span className="text-purple-500">/</span>
                          <span className="text-red-400">{gameState.stats.failedSteals}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Shields Used</div>
                      <div className="text-xl font-bold text-purple-100">{gameState.stats.shieldsUsed}</div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Daily Income</div>
                      <div className="text-xl font-bold text-purple-100">
                        {gameState.stats.dailyIncome.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Total Claimed</div>
                      <div className="text-xl font-bold text-purple-100">
                        {Math.floor(gameState.stats.totalEarned / 1e9).toLocaleString()}
                      </div>
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
        
        {/* RIGHT COLUMN: Back Button + Wallet */}
        <div className="hidden xl:flex flex-col gap-2 overflow-hidden">
          <div className="flex-shrink-0">
            <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-purple-500/30 shadow-xl overflow-hidden">
              
              {/* Back Button */}
              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-3 hover:bg-purple-900/20 transition-all flex items-center gap-3 text-left"
              >
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
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-purple-300">Navigation</div>
                  <div className="text-sm font-bold text-white">Back to Game</div>
                </div>
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Divider */}
              <div className="h-px bg-purple-500/20"></div>

              {/* Wallet Section */}
              <button
                onClick={disconnect}
                className="w-full px-4 py-3 hover:bg-purple-900/20 transition-all flex items-center gap-3"
              >
                <div 
                  className="rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0"
                  style={{ 
                    width: `${Math.round(40 * scaleFactor)}px`, 
                    height: `${Math.round(40 * scaleFactor)}px` 
                  }}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="text-purple-300"
                    style={{ 
                      width: `${Math.round(20 * scaleFactor)}px`, 
                      height: `${Math.round(20 * scaleFactor)}px` 
                    }}
                  >
                    <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
                  </svg>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs text-purple-300">Wallet</div>
                  <div className="text-sm font-mono font-bold text-white truncate">
                    {formatAddress(publicKey.toString())}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-semibold">Connected</span>
                </div>
              </button>
            </div>
          </div>
          <div className="flex-1"></div>
        </div>
      </div>
    </div>
  );
}