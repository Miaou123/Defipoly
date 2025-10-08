// ============================================
// FILE: defipoly-frontend/src/app/profile/page.tsx
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { PROGRAM_ID } from '@/utils/constants';
import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import idl from '@/types/defipoly_program.json';
import { Header } from '@/components/Header';

interface Activity {
  signature: string;
  type: 'buy' | 'sell' | 'steal' | 'shield' | 'claim';
  message: string;
  timestamp: number;
  success?: boolean;
}

const PROPERTY_NAMES = [
  'Bronze Basic', 'Bronze Plus', 
  'Silver Basic', 'Silver Plus',
  'Gold Basic', 'Gold Plus',
  'Platinum Basic', 'Platinum Elite'
];

export default function ProfilePage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    propertiesBought: 0,
    successfulSteals: 0,
    failedSteals: 0,
    rewardsClaimed: 0,
  });

  // Load username from localStorage
  useEffect(() => {
    if (publicKey) {
      const stored = localStorage.getItem(`username_${publicKey.toString()}`);
      if (stored) {
        setUsername(stored);
        setTempUsername(stored);
      }
    }
  }, [publicKey]);

  // Fetch user's transaction history
  useEffect(() => {
    if (!publicKey || !connected) {
      router.push('/');
      return;
    }

    const fetchUserActivity = async () => {
      setLoading(true);
      try {
        console.log('📜 Fetching user activity...');
        
        const coder = new BorshCoder(idl as any);
        const eventParser = new EventParser(PROGRAM_ID, coder);

        // Get signatures for this wallet interacting with the program
        const signatures = await connection.getSignaturesForAddress(
          publicKey,
          { limit: 50 },
          'confirmed'
        );

        console.log(`Found ${signatures.length} transactions`);

        const userActivities: Activity[] = [];
        let propertiesBought = 0;
        let successfulSteals = 0;
        let failedSteals = 0;
        let rewardsClaimed = 0;

        for (const sigInfo of signatures) {
          try {
            const tx = await connection.getTransaction(sigInfo.signature, {
              maxSupportedTransactionVersion: 0,
            });

            if (tx?.meta?.logMessages) {
              // Check if transaction involves our program
              const involvesProgramExecution = tx.meta.logMessages.some(log => 
                log.includes(PROGRAM_ID.toString())
              );

              if (involvesProgramExecution) {
                const events = eventParser.parseLogs(tx.meta.logMessages);
                
                for (const event of events) {
                  let activity: Activity | null = null;

                  switch (event.name) {
                    case 'PropertyBoughtEvent':
                    case 'propertyBoughtEvent': {
                      const data = event.data as any;
                      if (data.player.toString() === publicKey.toString()) {
                        const propertyName = PROPERTY_NAMES[data.propertyId] || `Property ${data.propertyId}`;
                        activity = {
                          signature: sigInfo.signature,
                          type: 'buy',
                          message: `Bought ${propertyName} for ${(Number(data.price) / 1e9).toFixed(2)} DEFI`,
                          timestamp: (sigInfo.blockTime || 0) * 1000,
                        };
                        propertiesBought++;
                      }
                      break;
                    }

                    case 'PropertySoldEvent':
                    case 'propertySoldEvent': {
                      const data = event.data as any;
                      if (data.player.toString() === publicKey.toString()) {
                        const propertyName = PROPERTY_NAMES[data.propertyId] || `Property ${data.propertyId}`;
                        activity = {
                          signature: sigInfo.signature,
                          type: 'sell',
                          message: `Sold ${data.slots} slot(s) of ${propertyName}`,
                          timestamp: (sigInfo.blockTime || 0) * 1000,
                        };
                      }
                      break;
                    }

                    case 'ShieldActivatedEvent':
                    case 'shieldActivatedEvent': {
                      const data = event.data as any;
                      if (data.player.toString() === publicKey.toString()) {
                        const propertyName = PROPERTY_NAMES[data.propertyId] || `Property ${data.propertyId}`;
                        activity = {
                          signature: sigInfo.signature,
                          type: 'shield',
                          message: `Activated shield on ${propertyName}`,
                          timestamp: (sigInfo.blockTime || 0) * 1000,
                        };
                      }
                      break;
                    }

                    case 'StealSuccessEvent':
                    case 'stealSuccessEvent': {
                      const data = event.data as any;
                      if (data.attacker.toString() === publicKey.toString()) {
                        const propertyName = PROPERTY_NAMES[data.propertyId] || `Property ${data.propertyId}`;
                        activity = {
                          signature: sigInfo.signature,
                          type: 'steal',
                          message: `Successfully stole ${propertyName} from ${data.target.toString().slice(0, 4)}...${data.target.toString().slice(-4)}`,
                          timestamp: (sigInfo.blockTime || 0) * 1000,
                          success: true,
                        };
                        successfulSteals++;
                      }
                      break;
                    }

                    case 'StealFailedEvent':
                    case 'stealFailedEvent': {
                      const data = event.data as any;
                      if (data.attacker.toString() === publicKey.toString()) {
                        const propertyName = PROPERTY_NAMES[data.propertyId] || `Property ${data.propertyId}`;
                        activity = {
                          signature: sigInfo.signature,
                          type: 'steal',
                          message: `Failed to steal ${propertyName} from ${data.target.toString().slice(0, 4)}...${data.target.toString().slice(-4)}`,
                          timestamp: (sigInfo.blockTime || 0) * 1000,
                          success: false,
                        };
                        failedSteals++;
                      }
                      break;
                    }

                    case 'RewardsClaimedEvent':
                    case 'rewardsClaimedEvent': {
                      const data = event.data as any;
                      if (data.player.toString() === publicKey.toString()) {
                        activity = {
                          signature: sigInfo.signature,
                          type: 'claim',
                          message: `Claimed ${(Number(data.amount) / 1e9).toFixed(2)} DEFI in rewards`,
                          timestamp: (sigInfo.blockTime || 0) * 1000,
                        };
                        rewardsClaimed++;
                      }
                      break;
                    }
                  }

                  if (activity) {
                    userActivities.push(activity);
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error parsing transaction ${sigInfo.signature}:`, error);
          }
        }

        // Sort by timestamp (newest first)
        userActivities.sort((a, b) => b.timestamp - a.timestamp);

        setActivities(userActivities);
        setStats({
          totalTransactions: userActivities.length,
          propertiesBought,
          successfulSteals,
          failedSteals,
          rewardsClaimed,
        });

        console.log('✅ User activity loaded');
      } catch (error) {
        console.error('Error fetching user activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivity();
  }, [publicKey, connected, connection, router]);

  const handleSaveUsername = () => {
    if (!publicKey) return;
    
    const trimmed = tempUsername.trim();
    if (trimmed.length > 0 && trimmed.length <= 20) {
      localStorage.setItem(`username_${publicKey.toString()}`, trimmed);
      setUsername(trimmed);
      setEditingUsername(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!connected || !publicKey) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="max-w-6xl mx-auto p-6 pt-24">
        {/* Profile Header */}
        <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-purple-100 mb-2">Your Profile</h1>
              <div className="text-sm text-purple-400 font-mono">
                {publicKey.toString()}
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
            >
              Back to Game
            </button>
          </div>

          {/* Username Section */}
          <div className="bg-purple-900/30 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-purple-200 mb-4">Display Name</h2>
            {editingUsername ? (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  placeholder="Enter your username (max 20 chars)"
                  maxLength={20}
                  className="flex-1 px-4 py-2 bg-purple-900/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleSaveUsername}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setTempUsername(username);
                    setEditingUsername(false);
                  }}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  {username ? (
                    <div className="text-2xl font-bold text-purple-100">{username}</div>
                  ) : (
                    <div className="text-purple-400">No username set - showing wallet address</div>
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
              Your username will appear on the leaderboard instead of your wallet address
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-purple-900/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-100">{stats.totalTransactions}</div>
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