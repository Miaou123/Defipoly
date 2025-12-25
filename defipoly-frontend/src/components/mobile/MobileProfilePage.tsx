'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/contexts/GameStateContext';
import { useNotification } from '@/contexts/NotificationContext';
import { getPropertyById } from '@/utils/constants';
import { TOKEN_TICKER } from '@/utils/constants';
import { API_BASE_URL, getImageUrl } from '@/utils/config';
import { SimpleBoardPreview } from '@/components/SimpleBoardPreview';
import { ThemePresetsModal } from '@/components/modals/ThemePresetsModal';
import { CornerSquareModal } from '@/components/modals/CornerSquareModal';
import { MobileThemeModal } from './MobileThemeModal';
import { authenticatedFetch } from '@/contexts/AuthContext';
import { ArrowLeft, LogOut, Camera, Shield, TrendingUp, Users, Award, DollarSign, Activity, Palette, BarChart3 } from 'lucide-react';
import { UserIcon } from '@/components/icons/UIIcons';

interface Activity {
  signature: string;
  type: 'buy' | 'sell' | 'steal' | 'shield' | 'claim';
  message: string;
  timestamp: number;
  success?: boolean;
  propertyId?: number;
}

type TabType = 'stats' | 'theme' | 'activity';

export function MobileProfilePage() {
  const { publicKey, connected, disconnect } = useWallet();
  const router = useRouter();
  const gameState = useGameState();
  const { showSuccess, showError } = useNotification();
  
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [showThemePresetsModal, setShowThemePresetsModal] = useState(false);
  const [showCornerSquareModal, setShowCornerSquareModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Touch handling state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

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
                message = `Bought ${action.slots || 1} slot${(action.slots || 1) > 1 ? 's' : ''} on ${propertyName}`;
                type = 'buy';
                break;
              case 'sell':
                message = `Sold ${action.slots || 1} slot${(action.slots || 1) > 1 ? 's' : ''} on ${propertyName} for ${formatAmount(action.amount || 0)} ${TOKEN_TICKER}`;
                type = 'sell';
                break;
              case 'steal_success':
                message = `Successfully stole from ${formatAddr(action.targetAddress)} on ${propertyName}`;
                type = 'steal';
                break;
              case 'steal_failed':
                message = `Failed to steal from ${formatAddr(action.targetAddress)} on ${propertyName}`;
                type = 'steal';
                break;
              case 'shield':
                message = `Activated shield on ${propertyName}`;
                type = 'shield';
                break;
              case 'claim':
                message = `Claimed ${formatAmount(action.amount || 0)} ${TOKEN_TICKER} in rewards`;
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

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Invalid file', 'Please select an image file');
      return;
    }

    setUploadingPicture(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('walletAddress', publicKey!.toString());

      const response = await authenticatedFetch(`${API_BASE_URL}/api/profile/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        await gameState.updateProfile({ profilePicture: data.profilePicture });
        showSuccess('Success', 'Profile picture updated!');
      } else {
        throw new Error('Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showError('Upload Failed', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingPicture(false);
    }
  };

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

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m ago`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
    return new Date(timestamp).toLocaleDateString();
  };

  const getActivityIcon = (type: Activity['type'], success?: boolean) => {
    switch (type) {
      case 'buy':
        return <div className="w-4 h-4 rounded-full bg-green-500" />;
      case 'sell':
        return <div className="w-4 h-4 rounded-full bg-orange-500" />;
      case 'steal':
        return <div className={`w-4 h-4 rounded-full ${success ? 'bg-emerald-500' : 'bg-red-500'}`} />;
      case 'shield':
        return <div className="w-4 h-4 rounded-full bg-cyan-500" />;
      case 'claim':
        return <div className="w-4 h-4 rounded-full bg-blue-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-500" />;
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'stats' as TabType, label: 'Stats', icon: BarChart3 },
    { id: 'theme' as TabType, label: 'Theme', icon: Palette },
    { id: 'activity' as TabType, label: 'Activity', icon: Activity },
  ];

  const getTabIndex = (tab: TabType) => tabs.findIndex(t => t.id === tab);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (!touch) return;
    setTouchStart(touch.clientX);
    setTouchEnd(touch.clientX);
    setIsSwiping(false);
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.targetTouches[0];
    if (!touch) return;
    const diff = touchStart - touch.clientX;
    
    // Only start swiping after a minimum threshold
    if (Math.abs(diff) > 10) {
      setIsSwiping(true);
      setSwipeOffset(-diff);
      setTouchEnd(touch.clientX);
    }
  }, [touchStart]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!touchStart || touchEnd === null) return;
    
    const diff = touchStart - touchEnd;
    const threshold = 50; // Minimum distance for a swipe
    const currentIndex = getTabIndex(activeTab);
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < tabs.length - 1) {
        // Swiped left - go to next tab
        const nextTab = tabs[currentIndex + 1];
        if (nextTab) {
          setActiveTab(nextTab.id);
        }
      } else if (diff < 0 && currentIndex > 0) {
        // Swiped right - go to previous tab
        const prevTab = tabs[currentIndex - 1];
        if (prevTab) {
          setActiveTab(prevTab.id);
        }
      }
    }
    
    // Reset swipe state
    setTouchStart(null);
    setTouchEnd(null);
    setIsSwiping(false);
    setSwipeOffset(0);
  }, [touchStart, touchEnd, activeTab]);

  if (!connected || !publicKey) {
    return null;
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-black">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 bg-gradient-to-b from-purple-900/60 to-transparent backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3 safe-area-top">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg hover:bg-purple-500/20 transition-all"
          >
            <ArrowLeft size={24} className="text-purple-300" />
          </button>
          
          <h1 className="font-orbitron font-bold text-white text-lg">Profile</h1>
          
          <button 
            onClick={disconnect}
            className="p-2 rounded-lg hover:bg-red-500/20 transition-all group"
          >
            <LogOut size={24} className="text-red-400 group-hover:text-red-300" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-4 pb-4 flex flex-col items-center">
          {/* Profile Picture */}
          <div className="relative mb-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPicture}
              className="relative w-20 h-20 rounded-full bg-purple-500/30 overflow-hidden border-2 border-purple-400/50 hover:border-purple-400 transition-all group"
            >
              {gameState.profile.profilePicture ? (
                <img 
                  src={getImageUrl(gameState.profile.profilePicture) ?? undefined} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon size={40} className="text-purple-300 absolute inset-0 m-auto" />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={24} className="text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="hidden"
            />
          </div>

          {/* Username */}
          <div className="mb-2">
            {editingUsername ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  placeholder="Enter username"
                  className="bg-purple-900/30 border border-purple-500/30 rounded-lg px-3 py-1 text-white text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                />
                <button
                  onClick={handleSaveUsername}
                  className="px-3 py-1 bg-purple-600 rounded-lg text-white text-sm font-semibold"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTempUsername(gameState.profile.username || '');
                  setEditingUsername(true);
                }}
                className="font-bold text-white text-lg hover:text-purple-300 transition-all flex items-center gap-1"
              >
                {gameState.profile.username || 'Set Username'}
                <Camera size={14} className="text-purple-400" />
              </button>
            )}
          </div>

          {/* Wallet Address */}
          <div className="font-mono text-purple-400 text-xs mb-3">
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-purple-400 text-xs">Rank</div>
              <div className="font-bold text-yellow-400 text-lg">
                {leaderboardRank ? `#${leaderboardRank}` : 'N/A'}
              </div>
            </div>
            <div className="w-px h-8 bg-purple-500/30" />
            <div className="text-center">
              <div className="text-purple-400 text-xs">Slots</div>
              <div className="font-bold text-white text-lg">
                {gameState.stats.totalSlotsOwned}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar - Sticky */}
      <div className="flex-shrink-0 bg-black/90 border-b border-purple-500/20">
        <div className="flex relative">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${
                activeTab === tab.id 
                  ? 'text-purple-300' 
                  : 'text-purple-500'
              }`}
            >
              <tab.icon size={20} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
          {/* Animated indicator */}
          <div 
            className="absolute bottom-0 h-0.5 bg-purple-400 transition-all duration-300 ease-out"
            style={{
              width: `${100 / tabs.length}%`,
              transform: `translateX(${getTabIndex(activeTab) * 100}%)`,
            }}
          />
        </div>
      </div>

      {/* Tab Content - Fixed height, no scroll */}
      <div 
        ref={contentRef}
        className="flex-1 min-h-0 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipeable container */}
        <div 
          className="flex absolute inset-0 transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(calc(-${getTabIndex(activeTab) * 100}% + ${isSwiping ? swipeOffset : 0}px))`,
          }}
        >
          {/* Stats Tab */}
          <div className="w-full h-full flex-shrink-0 p-3 flex flex-col overflow-y-auto">
            <div className="flex-1 grid grid-cols-2 gap-2 mb-3 min-h-0">
              {/* Regular stat cards */}
              <div className="bg-purple-900/30 rounded-lg p-3 flex flex-col justify-center min-h-0">
                <div className="text-purple-400 text-[10px] mb-1">Total Slots</div>
                <div className="font-bold text-white text-lg leading-tight">{gameState.stats.totalSlotsOwned}</div>
              </div>
              
              <div className="bg-purple-900/30 rounded-lg p-3 flex flex-col justify-center min-h-0">
                <div className="text-purple-400 text-[10px] mb-1">Properties</div>
                <div className="font-bold text-white text-lg leading-tight">{gameState.stats.propertiesBought}</div>
              </div>
              
              <div className="bg-purple-900/30 rounded-lg p-3 flex flex-col justify-center min-h-0">
                <div className="text-purple-400 text-[10px] mb-1">Completed Sets</div>
                <div className="font-bold text-white text-lg leading-tight">{gameState.stats.completeSets}</div>
              </div>
              
              <div className="bg-purple-900/30 rounded-lg p-3 flex flex-col justify-center min-h-0">
                <div className="text-purple-400 text-[10px] mb-1">Steals</div>
                <div className="font-bold text-white text-lg leading-tight">
                  {gameState.stats.successfulSteals + gameState.stats.failedSteals}
                  <span className="text-[10px] text-purple-400 ml-1 block">
                    (<span className="text-green-400">{gameState.stats.successfulSteals}</span>/<span className="text-red-400">{gameState.stats.failedSteals}</span>)
                  </span>
                </div>
              </div>
              
              <div className="bg-purple-900/30 rounded-lg p-3 flex flex-col justify-center min-h-0">
                <div className="text-purple-400 text-[10px] mb-1">Shields Used</div>
                <div className="font-bold text-white text-lg leading-tight">{gameState.stats.shieldsUsed}</div>
              </div>
              
              <div className="bg-purple-900/30 rounded-lg p-3 flex flex-col justify-center min-h-0">
                <div className="text-purple-400 text-[10px] mb-1">Daily Income</div>
                <div className="font-bold text-green-400 text-lg leading-tight">
                  +{gameState.stats.dailyIncome.toLocaleString()}
                </div>
              </div>
            </div>
            
            {/* Total Claimed - Larger card */}
            <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 rounded-lg p-4 border border-purple-500/20 flex-shrink-0">
              <div className="text-purple-300 text-sm mb-1">Total Claimed</div>
              <div className="font-bold text-white text-2xl leading-tight">
                {Math.floor(gameState.stats.totalEarned / 1e9).toLocaleString()} {TOKEN_TICKER}
              </div>
            </div>
          </div>

          {/* Theme Tab */}
          <div className="w-full h-full flex-shrink-0 p-4 space-y-4 overflow-y-auto">
            {/* Large Board Preview - Tappable */}
            <div 
              className="aspect-square max-w-[280px] mx-auto cursor-pointer"
              onClick={() => setShowThemeModal(true)}
            >
              <SimpleBoardPreview
                customSceneBackground={gameState.profile.customSceneBackground}
                customBoardBackground={gameState.profile.customBoardBackground}
                customPropertyCardBackground={gameState.profile.customPropertyCardBackground}
                cornerSquareStyle={gameState.profile.cornerSquareStyle || 'property'}
                profilePicture={gameState.profile.profilePicture}
                writingStyle={gameState.profile.writingStyle || 'light'}
                className="w-full h-full rounded-2xl border-2 border-purple-500/30"
              />
            </div>
          </div>

          {/* Activity Tab */}
          <div className="w-full h-full flex-shrink-0 p-3 flex flex-col overflow-y-auto">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-purple-300 text-sm">Loading activities...</div>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-purple-400 text-lg mb-2">No activity yet</div>
                <div className="text-sm text-purple-500">Start playing to see your history!</div>
              </div>
            ) : (
              <div className="space-y-2">
                  {activities.slice(0, 20).map((activity) => (
                    <div
                      key={activity.signature}
                      className="bg-purple-900/20 rounded-lg p-3 flex items-start gap-3"
                    >
                      {getActivityIcon(activity.type, activity.success)}
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs leading-relaxed">{activity.message}</div>
                        <div className="text-purple-400 text-[10px] mt-1">
                          {formatTimestamp(activity.timestamp)}
                        </div>
                      </div>
                      <a
                        href={`https://explorer.solana.com/tx/${activity.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-purple-600/50 hover:bg-purple-600 rounded text-[10px] transition-colors flex-shrink-0"
                      >
                        TX
                      </a>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showThemeModal && <MobileThemeModal onClose={() => setShowThemeModal(false)} />}

      {showThemePresetsModal && (
        <ThemePresetsModal
          isOpen={showThemePresetsModal}
          onApply={async (preset) => {
            await gameState.updateProfile({ 
              boardPresetId: preset.id,
              tilePresetId: preset.id,
              customBoardBackground: null,
              customPropertyCardBackground: null,
              customSceneBackground: null
            });
            setShowThemePresetsModal(false);
            showSuccess('Theme Updated', 'Your theme has been updated successfully!');
          }}
          onClose={() => setShowThemePresetsModal(false)}
        />
      )}

      {showCornerSquareModal && (
        <CornerSquareModal
          isOpen={showCornerSquareModal}
          currentCornerSquareStyle={gameState.profile.cornerSquareStyle || 'property'}
          onCornerSquareStyleChange={async (style) => {
            await gameState.updateProfile({ cornerSquareStyle: style });
            setShowCornerSquareModal(false);
            showSuccess('Style Updated', 'Corner square style has been updated!');
          }}
          onClose={() => setShowCornerSquareModal(false)}
        />
      )}
    </div>
  );
}