'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { getPropertyById } from '@/utils/constants';
import { compressImage } from '@/utils/profileStorage';
import { useNotification } from '@/components/NotificationProvider';

interface Activity {
  signature: string;
  type: 'buy' | 'sell' | 'steal' | 'shield' | 'claim';
  message: string;
  timestamp: number;
  success?: boolean;
  propertyId?: number;
}

interface PlayerStats {
  totalActions: number;
  propertiesBought: number;
  propertiesSold: number;
  successfulSteals: number;
  failedSteals: number;
  rewardsClaimed: number;
  shieldsActivated: number;
  totalSpent: number;
  totalEarned: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3001';

export default function ProfilePage() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  
  const [username, setUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlayerStats>({
    totalActions: 0,
    propertiesBought: 0,
    propertiesSold: 0,
    successfulSteals: 0,
    failedSteals: 0,
    rewardsClaimed: 0,
    shieldsActivated: 0,
    totalSpent: 0,
    totalEarned: 0,
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
        const response = await fetch(`${BACKEND_URL}/api/profile/${publicKey.toString()}`);
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
        
        // Fetch actions
        const actionsResponse = await fetch(`${BACKEND_URL}/api/actions/player/${walletAddress}?limit=100`);
        
        if (!actionsResponse.ok) {
          throw new Error(`Failed to fetch actions: ${actionsResponse.status}`);
        }
        
        const actionsData = await actionsResponse.json();
        console.log('📦 Received actions:', actionsData.actions?.length || 0);
        
        // Fetch stats
        const statsResponse = await fetch(`${BACKEND_URL}/api/stats/${walletAddress}`);
        
        if (!statsResponse.ok) {
          throw new Error(`Failed to fetch stats: ${statsResponse.status}`);
        }
        
        const statsData = await statsResponse.json();
        console.log('📈 Received stats:', statsData);
        
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
              message = `Bought ${propertyName} for ${formatAmount(action.amount || 0)} DEFI`;
              type = 'buy';
              break;
            
            case 'sell':
              message = `Sold ${action.slots || 0} slots of ${propertyName} for ${formatAmount(action.amount || 0)} DEFI`;
              type = 'sell';
              break;
            
            case 'steal_success':
              message = `Successfully stole from ${formatAddress(action.targetAddress)} on ${propertyName}! 💰`;
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
              message = `Claimed ${formatAmount(action.amount || 0)} DEFI in rewards 💰`;
              type = 'claim';
              break;
            
            default:
              message = `Unknown action: ${action.actionType}`;
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
        setStats({
          totalActions: statsData.totalActions || 0,
          propertiesBought: statsData.propertiesBought || 0,
          propertiesSold: statsData.propertiesSold || 0,
          successfulSteals: statsData.successfulSteals || 0,
          failedSteals: statsData.failedSteals || 0,
          rewardsClaimed: statsData.rewardsClaimed || 0,
          shieldsActivated: statsData.shieldsActivated || 0,
          totalSpent: statsData.totalSpent || 0,
          totalEarned: statsData.totalEarned || 0,
        });

        console.log('✅ User data loaded successfully');
      } catch (error) {
        console.error('❌ Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [publicKey]);

  const handleSaveUsername = async () => {
    if (!publicKey || !tempUsername.trim()) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/profile`, {
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
        console.log('✅ Username saved to backend');
      } else {
        console.error('Failed to save username');
      }
    } catch (error) {
      console.error('Error saving username:', error);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!publicKey) return;
    
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please upload an image file');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError('File Too Large', 'Please use an image under 2MB.');
      return;
    }

    setUploadingPicture(true);

    try {
      // Compress image
      const compressedImage = await compressImage(file);
      
      // Upload to backend
      const response = await fetch(`${BACKEND_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          profilePicture: compressedImage,
        }),
      });

      if (response.ok) {
        setProfilePicture(compressedImage);
        console.log('✅ Profile picture uploaded');
      } else {
        showError('Upload Failed', 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showError('Upload Error', 'Error uploading profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          profilePicture: null,
        }),
      });

      if (response.ok) {
        setProfilePicture(null);
        console.log('✅ Profile picture removed');
      }
    } catch (error) {
      console.error('Error removing profile picture:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-slate-950">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Profile Header */}
        <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-8 mb-8">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-purple-100 mb-2">Your Profile</h1>
              <p className="text-purple-400 font-mono text-sm">
                {publicKey.toString()}
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-white font-semibold flex items-center gap-2 shadow-lg"
            >
              <span>←</span> Back to Game
            </button>
          </div>

          {/* Profile Picture and Username on Same Row */}
          <div className="flex items-center gap-8 pb-6 border-b border-purple-500/20 mb-6">
            {/* Profile Picture Section */}
            <div className="flex items-center gap-4">
              {/* Avatar Display */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden border-4 border-purple-500/30">
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
              </div>

              {/* Upload Buttons */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPicture}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingPicture ? '⏳' : profilePicture ? 'Change' : 'Upload'}
                  </button>
                  {profilePicture && (
                    <button
                      onClick={handleRemoveProfilePicture}
                      className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Username Section */}
            <div className="flex-1">
              {editingUsername ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    placeholder="Enter username..."
                    maxLength={20}
                    className="flex-1 px-4 py-2 bg-purple-900/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400 focus:outline-none focus:border-purple-400"
                  />
                  <button
                    onClick={handleSaveUsername}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingUsername(false);
                      setTempUsername(username);
                    }}
                    className="px-4 py-2 bg-purple-900/50 hover:bg-purple-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-purple-400 mb-1">Display Name</div>
                    {username ? (
                      <div className="text-2xl font-bold text-purple-100">{username}</div>
                    ) : (
                      <div className="text-purple-500 italic">No username set</div>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingUsername(true)}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
                  >
                    {username ? 'Edit' : 'Set Username'}
                  </button>
                </div>
              )}
              <p className="text-xs text-purple-400 mt-2">
                Your username will appear on the leaderboard
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-900/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-100">{stats.totalActions}</div>
              <div className="text-sm text-purple-400 mt-1">Total Actions</div>
            </div>
            <div className="bg-purple-900/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{stats.propertiesBought}</div>
              <div className="text-sm text-purple-400 mt-1">Bought</div>
            </div>
            <div className="bg-purple-900/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-emerald-400">{stats.successfulSteals}</div>
              <div className="text-sm text-purple-400 mt-1">Steals ✓</div>
            </div>
            <div className="bg-purple-900/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-400">{stats.failedSteals}</div>
              <div className="text-sm text-purple-400 mt-1">Steals ✗</div>
            </div>
            <div className="bg-purple-900/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{stats.rewardsClaimed}</div>
              <div className="text-sm text-purple-400 mt-1">Claimed</div>
            </div>
            <div className="bg-purple-900/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-amber-400">{stats.shieldsActivated}</div>
              <div className="text-sm text-purple-400 mt-1">Shields</div>
            </div>
            <div className="bg-purple-900/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-300">{(stats.totalSpent / 1e9).toFixed(0)}</div>
              <div className="text-sm text-purple-400 mt-1">DEFI Spent</div>
            </div>
            <div className="bg-purple-900/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-300">{(stats.totalEarned / 1e9).toFixed(0)}</div>
              <div className="text-sm text-purple-400 mt-1">DEFI Earned</div>
            </div>
          </div>
        </div>

        {/* Activity History */}
        <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-8">
          <h2 className="text-2xl font-bold text-purple-100 mb-6">Activity History</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⏳</div>
              <div className="text-purple-300">Loading your activity...</div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">📋</div>
              <div className="text-purple-400">No activity yet</div>
              <div className="text-sm text-purple-500 mt-2">Start playing to see your history!</div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {activities.map((activity) => (
                <div
                  key={activity.signature}
                  className={`p-4 bg-purple-900/10 rounded-xl border-l-4 hover:bg-purple-900/20 transition-all ${
                    activity.type === 'buy' ? 'border-green-400' :
                    activity.type === 'steal' ? (activity.success ? 'border-emerald-400' : 'border-red-400') :
                    activity.type === 'claim' ? 'border-blue-400' :
                    activity.type === 'sell' ? 'border-orange-400' :
                    'border-amber-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-purple-100">{activity.message}</div>
                      <div className="text-xs text-purple-400 mt-1">
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>
                    <a
                      href={`https://explorer.solana.com/tx/${activity.signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 px-3 py-1 bg-purple-600/50 hover:bg-purple-600 rounded text-xs transition-colors"
                    >
                      View TX
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}