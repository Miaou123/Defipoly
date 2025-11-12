'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { getPropertyById } from '@/utils/constants';
import { compressImage } from '@/utils/profileStorage';
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
  boardValue: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101';

export default function ProfilePage() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const themeContext = useTheme();
  
  const [username, setUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPicture, setUploadingPicture] = useState(false);
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
    boardValue: 0,
  });

  // Redirect if not connected
  useEffect(() => {
    if (!connected || !publicKey) {
      router.push('/');
    }
  }, [connected, publicKey, router]);

  // Load username and profile picture from backend
  useEffect(() => {
    if (!publicKey) return;

    const loadProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${publicKey.toString()}`);
        if (response.ok) {
          const data = await response.json();
          if (data.username) {
            setUsername(data.username);
            setTempUsername(data.username);
          }
          if (data.profilePicture) {
            setProfilePicture(data.profilePicture);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [publicKey]);

  // Fetch user's activity and stats from backend
  useEffect(() => {
    if (!publicKey) return;

    const fetchUserData = async () => {
      setLoading(true);
      
      try {
        const walletAddress = publicKey.toString();
        console.log('📊 Fetching user data from backend...');
        
        // Fetch stats from /api/stats/:wallet
        const statsResponse = await fetch(`${API_BASE_URL}/api/stats/${walletAddress}`);
        if (!statsResponse.ok) {
          throw new Error(`Failed to fetch stats: ${statsResponse.status}`);
        }
        const statsData = await statsResponse.json();
        console.log('📈 Received stats:', statsData);
        
        // Fetch actions from /api/actions/player/:wallet
        const actionsResponse = await fetch(`${API_BASE_URL}/api/actions/player/${walletAddress}?limit=50`);
        if (!actionsResponse.ok) {
          throw new Error(`Failed to fetch actions: ${actionsResponse.status}`);
        }
        const actionsData = await actionsResponse.json();
        console.log('📦 Received actions:', actionsData.actions?.length || 0);
        
        // Set stats
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
          boardValue: statsData.boardValue || 0,
        });
        
        // Convert actions to activities
        const userActivities: Activity[] = actionsData.actions.map((action: any) => {
          const property = action.propertyId !== null && action.propertyId !== undefined
            ? getPropertyById(action.propertyId)
            : null;
          const propertyName = property ? property.name : 'Unknown Property';
          
          const formatAmount = (amount: number) => {
            const tokens = amount / 1e9;
            if (tokens >= 1e6) return `${(tokens / 1e6).toFixed(2)}M`;
            if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(1)}K`;
            return tokens.toFixed(2);
          };

          const formatAddress = (addr: string) => {
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
              message = `Successfully stole from ${formatAddress(action.targetAddress)} on ${propertyName} 💰`;
              type = 'steal';
              break;
            
            case 'steal_failed':
              message = `Failed to steal from ${formatAddress(action.targetAddress)} on ${propertyName} 🛡️`;
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
        console.log('✅ User data loaded successfully');
      } catch (error) {
        console.error('❌ Error fetching user data:', error);
        showError('Failed to Load', 'Could not load profile data from backend');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [publicKey, showError]);

  const handleSaveUsername = async () => {
    if (!publicKey || !tempUsername.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          username: tempUsername.trim(),
        }),
      });

      if (response.ok) {
        setUsername(tempUsername.trim());
        setEditingUsername(false);
        showSuccess('Username Saved', 'Your username has been updated');
        console.log('✅ Username saved to backend');
      } else {
        showError('Save Failed', 'Failed to save username');
      }
    } catch (error) {
      console.error('Error saving username:', error);
      showError('Error', 'An error occurred while saving username');
    }
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
    <div className="min-h-screen relative z-10 flex flex-col">
      {/* Top Bar with Defipoly and Back Button */}
      <div className="w-full px-4 py-3 flex items-center justify-between flex-shrink-0">
        {/* Defipoly Logo - Left */}
        <div className="flex items-center gap-3">
          <div className="text-2xl">🎲</div>
          <div>
            <h1 className="text-lg font-bold text-purple-100">Defipoly</h1>
          </div>
        </div>

        {/* Back Button - Right */}
        <button
          onClick={() => router.push('/')}
          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg"
        >
          <span>←</span> Back to Game
        </button>
      </div>

      {/* Main Content - Centered with max width */}
      <div className="flex-1 container mx-auto px-4 pt-2 pb-4 max-w-7xl">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-5 h-[calc(100vh-120px)]">
          {/* Left Column - Profile & Customization */}
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

          {/* Right Column - Stats & Activity */}
          <div className="grid grid-rows-[auto_1fr] gap-4 overflow-hidden">
            {/* Quick Stats Card */}
            <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-5 flex-shrink-0">
              <h2 className="text-base font-bold text-purple-100 mb-4 flex items-center gap-2">
                <span>📊</span> Quick Stats
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <div className="text-center p-3 bg-purple-900/20 rounded-xl">
                  <div className="text-xs text-purple-300 mb-1 font-semibold">Steals</div>
                  <div className="text-xl font-bold text-purple-100">{stats.successfulSteals + stats.failedSteals}</div>
                  <div className="text-[10px] text-purple-400 mt-0.5">
                    <span className="text-red-400">{stats.failedSteals}</span>
                    {' / '}
                    <span className="text-green-400">{stats.successfulSteals}</span>
                  </div>
                </div>
                <div className="text-center p-3 bg-purple-900/20 rounded-xl md:col-span-2">
                  <div className="text-xs text-purple-300 mb-1 font-semibold">Shields Used</div>
                  <div className="text-xl font-bold text-purple-100">{stats.shieldsUsed}</div>
                </div>
                <div className="text-center p-3 bg-purple-900/20 rounded-xl md:col-span-2">
                  <div className="text-xs text-purple-300 mb-1 font-semibold">Board Value</div>
                  <div className="text-xl font-bold text-purple-100">
                    {(stats.boardValue / 1e9).toFixed(2)} DEFI
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
  );
}