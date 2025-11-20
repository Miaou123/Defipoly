'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { getPropertyById } from '@/utils/constants';
import { useNotification } from '@/contexts/NotificationContext';
import { ProfileCustomization } from '@/components/ProfileCustomization';
import { useGameState } from '@/contexts/GameStateContext';

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
  const gameState = useGameState();
  
  // Form state only
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  
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

  // Load stats and activities
  useEffect(() => {
    if (!publicKey || !connected) return;

    const fetchData = async () => {
      const walletAddress = publicKey.toString();

      try {
        // Use stats from GameState
        setStats({
          walletAddress: gameState.stats.walletAddress || walletAddress,
          totalActions: gameState.stats.totalActions,
          propertiesBought: gameState.stats.propertiesBought,
          totalSpent: gameState.stats.totalSpent,
          totalEarned: gameState.stats.totalEarned,
          totalSlotsOwned: gameState.stats.totalSlotsOwned,
          successfulSteals: gameState.stats.successfulSteals,
          failedSteals: gameState.stats.failedSteals,
          completedSets: gameState.stats.completeSets,
          shieldsUsed: gameState.stats.shieldsUsed,
          dailyIncome: gameState.stats.dailyIncome,
          rewardsClaimed: gameState.stats.rewardsClaimed,
        });

        // Fetch leaderboard to get user's rank
        try {
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
        } catch (error) {
          console.error('Error fetching leaderboard rank:', error);
        }

        // Fetch activities
        const actionsResponse = await fetch(`${API_BASE_URL}/api/actions/player/${walletAddress}?limit=20`);
        if (actionsResponse.ok) {
          const actionsData = await actionsResponse.json();
          const formattedActivities: Activity[] = actionsData.actions.map((action: any) => {
            let message = '';
            const property = action.propertyId ? getPropertyById(action.propertyId) : null;
            
            switch (action.actionType) {
              case 'buy_property':
                message = `Bought ${action.slots} slot${action.slots > 1 ? 's' : ''} on ${property?.name || 'Unknown'}`;
                break;
              case 'sell_property':
                message = `Sold ${action.slots} slot${action.slots > 1 ? 's' : ''} on ${property?.name || 'Unknown'}`;
                break;
              case 'steal_property':
                message = `Stole ${action.slots} slot${action.slots > 1 ? 's' : ''} from ${property?.name || 'Unknown'}`;
                break;
              case 'shield_property':
                message = `Shielded ${property?.name || 'Unknown'}`;
                break;
              case 'claim_rewards':
                message = `Claimed ${(action.amount / 1e9).toFixed(2)} SOL in rewards`;
                break;
              default:
                message = action.actionType;
            }

            return {
              signature: action.txSignature,
              type: action.actionType.split('_')[0] as Activity['type'],
              message,
              timestamp: action.blockTime * 1000,
              success: action.success,
              propertyId: action.propertyId,
            };
          });
          setActivities(formattedActivities);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [publicKey, connected, gameState.stats]);

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

  const formatTokenAmount = (lamports: number) => {
    return (lamports / 1e9).toFixed(4);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!connected || !publicKey) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-purple-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-purple-900/50 hover:bg-purple-800/50 rounded-lg transition-colors text-purple-100 border border-purple-500/30"
          >
            ← Back to Game
          </button>
          <button
            onClick={disconnect}
            className="px-4 py-2 bg-red-900/50 hover:bg-red-800/50 rounded-lg transition-colors text-red-100 border border-red-500/30"
          >
            Disconnect
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Customization */}
          <div className="lg:col-span-1">
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
              walletAddress={publicKey.toString()}
            />
          </div>

          {/* Right Column - Stats and Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Your Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {leaderboardRank !== null && (
                  <div className="bg-purple-800/20 rounded-lg p-4 border border-purple-500/20">
                    <div className="text-purple-400 text-sm mb-1">Leaderboard Rank</div>
                    <div className="text-2xl font-bold text-white">#{leaderboardRank}</div>
                  </div>
                )}
                <div className="bg-purple-800/20 rounded-lg p-4 border border-purple-500/20">
                  <div className="text-purple-400 text-sm mb-1">Properties Bought</div>
                  <div className="text-2xl font-bold text-white">{stats.propertiesBought}</div>
                </div>
                <div className="bg-purple-800/20 rounded-lg p-4 border border-purple-500/20">
                  <div className="text-purple-400 text-sm mb-1">Total Slots</div>
                  <div className="text-2xl font-bold text-white">{stats.totalSlotsOwned}</div>
                </div>
                <div className="bg-purple-800/20 rounded-lg p-4 border border-purple-500/20">
                  <div className="text-purple-400 text-sm mb-1">Successful Steals</div>
                  <div className="text-2xl font-bold text-green-400">{stats.successfulSteals}</div>
                </div>
                <div className="bg-purple-800/20 rounded-lg p-4 border border-purple-500/20">
                  <div className="text-purple-400 text-sm mb-1">Complete Sets</div>
                  <div className="text-2xl font-bold text-yellow-400">{stats.completedSets}</div>
                </div>
                <div className="bg-purple-800/20 rounded-lg p-4 border border-purple-500/20">
                  <div className="text-purple-400 text-sm mb-1">Daily Income</div>
                  <div className="text-2xl font-bold text-white">{formatTokenAmount(stats.dailyIncome)} SOL</div>
                </div>
                <div className="bg-purple-800/20 rounded-lg p-4 border border-purple-500/20">
                  <div className="text-purple-400 text-sm mb-1">Total Earned</div>
                  <div className="text-2xl font-bold text-green-400">{formatTokenAmount(stats.totalEarned)} SOL</div>
                </div>
                <div className="bg-purple-800/20 rounded-lg p-4 border border-purple-500/20">
                  <div className="text-purple-400 text-sm mb-1">Total Spent</div>
                  <div className="text-2xl font-bold text-red-400">{formatTokenAmount(stats.totalSpent)} SOL</div>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
              {loading ? (
                <div className="text-center py-8 text-purple-400">Loading...</div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-purple-400">No activity yet</div>
              ) : (
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <div
                      key={activity.signature}
                      className="bg-purple-800/10 rounded-lg p-3 border border-purple-500/20 hover:bg-purple-800/20 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">{activity.message}</div>
                          <div className="text-purple-400 text-xs mt-1">
                            {formatDate(activity.timestamp)}
                          </div>
                        </div>
                        <a
                          href={`https://solscan.io/tx/${activity.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-purple-400 hover:text-purple-300 text-xs"
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
      </div>
    </div>
  );
}