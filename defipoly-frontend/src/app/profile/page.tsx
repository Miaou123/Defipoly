'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { getPropertyById } from '@/utils/constants';
import { compressImage } from '@/utils/profileStorage';
import { useNotification } from '@/contexts/NotificationContext';

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
    walletAddress: '',
    totalActions: 0,
    propertiesBought: 0,
    totalSpent: 0,
    totalEarned: 0,
    totalSlotsOwned: 0,
    successfulSteals: 0,
    failedSteals: 0,
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
        
        // Fetch stats from /api/stats/:wallet
        const statsResponse = await fetch(`${BACKEND_URL}/api/stats/${walletAddress}`);
        if (!statsResponse.ok) {
          throw new Error(`Failed to fetch stats: ${statsResponse.status}`);
        }
        const statsData = await statsResponse.json();
        console.log('📈 Received stats:', statsData);
        
        // Fetch actions from /api/actions/player/:wallet
        const actionsResponse = await fetch(`${BACKEND_URL}/api/actions/player/${walletAddress}?limit=50`);
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
        showSuccess('Upload Success', 'Profile picture updated');
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
        showSuccess('Removed', 'Profile picture removed');
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
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-purple-100 mb-1">Your Profile</h1>
            <p className="text-purple-400 font-mono text-sm">
              {publicKey.toString()}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-white font-semibold flex items-center gap-2"
          >
            <span>←</span> Back to Game
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
              <h2 className="text-lg font-bold text-purple-100 mb-4">Profile</h2>
              
              {/* Avatar */}
              <div className="flex flex-col items-center mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden border-4 border-purple-500/30 mb-3">
                  {profilePicture ? (
                    <img 
                      src={profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                </div>

                {/* Upload Buttons */}
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
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    {uploadingPicture ? 'Uploading...' : profilePicture ? 'Change' : 'Upload'}
                  </button>
                  {profilePicture && (
                    <button
                      onClick={handleRemoveProfilePicture}
                      className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Username */}
              <div className="border-t border-purple-500/20 pt-4">
                {editingUsername ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      placeholder="Enter username"
                      className="w-full px-3 py-2 bg-purple-900/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-500 focus:outline-none focus:border-purple-400 text-sm"
                      maxLength={20}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveUsername}
                        className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingUsername(false);
                          setTempUsername(username);
                        }}
                        className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs text-purple-400 mb-1">Username</div>
                    {username ? (
                      <div className="text-lg font-bold text-purple-100 mb-2">{username}</div>
                    ) : (
                      <div className="text-purple-500 italic text-sm mb-2">No username set</div>
                    )}
                    <button
                      onClick={() => setEditingUsername(true)}
                      className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-sm"
                    >
                      {username ? 'Edit Username' : 'Set Username'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
              <h2 className="text-lg font-bold text-purple-100 mb-4">Quick Stats</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-purple-300 text-sm">Total Slots</span>
                  <span className="text-purple-100 font-bold text-lg">{stats.totalSlotsOwned}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-300 text-sm">Total Steals</span>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-100 font-bold text-lg">{stats.successfulSteals + stats.failedSteals}</span>
                    <span className="text-purple-400 text-sm">
                      (<span className="text-red-400 font-semibold">{stats.failedSteals}</span>
                      {' / '}
                      <span className="text-green-400 font-semibold">{stats.successfulSteals}</span>)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Activity History */}
          <div className="lg:col-span-2">
            <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
              <h2 className="text-xl font-bold text-purple-100 mb-4">Activity History</h2>
              
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
                <div className="space-y-2 max-h-[700px] overflow-y-auto pr-2">
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