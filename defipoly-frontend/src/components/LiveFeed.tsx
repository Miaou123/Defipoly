'use client';

import { useEffect, useState, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PROGRAM_ID, getPropertyById } from '@/utils/constants';
import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import { getProfilesBatch, ProfileData } from '@/utils/profileStorage';
import idl from '@/idl/defipoly_program.json';

interface FeedItem {
  message: string;
  type: 'buy' | 'steal' | 'shield' | 'claim' | 'sell';
  timestamp: number;
  txSignature: string;
  propertyId?: number;
  playerAddress?: string;
  targetAddress?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3005';

export function LiveFeed() {
  const { connection } = useConnection();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [loading, setLoading] = useState(true);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getDisplayName = (address: string) => {
    const profile = profiles[address];
    return profile?.username || formatAddress(address);
  };

  const formatAmount = (amount: number) => {
    const tokens = amount / 1e9;
    if (tokens >= 1e6) return `${(tokens / 1e6).toFixed(2)}M`;
    if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(1)}K`;
    return tokens.toFixed(2);
  };

  // Convert backend action to feed item
  const actionToFeedItem = useCallback((action: any): FeedItem | null => {
    const property = action.propertyId !== null && action.propertyId !== undefined 
      ? getPropertyById(action.propertyId)
      : null;
    const propertyName = property ? property.name : 'Unknown Property';

    switch (action.actionType) {
      case 'buy':
        return {
          message: `${getDisplayName(action.playerAddress)} bought ${propertyName} for ${formatAmount(action.amount || 0)} DEFI`,
          type: 'buy',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
          playerAddress: action.playerAddress,
        };

      case 'sell':
        return {
          message: `${getDisplayName(action.playerAddress)} sold ${action.slots || 0} slots of ${propertyName} for ${formatAmount(action.amount || 0)} DEFI`,
          type: 'sell',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
          playerAddress: action.playerAddress,
        };

      case 'steal_success':
        return {
          message: `${getDisplayName(action.playerAddress)} stole from ${getDisplayName(action.targetAddress)} on ${propertyName}! 🎯`,
          type: 'steal',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
          playerAddress: action.playerAddress,
          targetAddress: action.targetAddress,
        };

      case 'steal_failed':
        return {
          message: `${getDisplayName(action.playerAddress)} failed to steal from ${getDisplayName(action.targetAddress)} on ${propertyName}`,
          type: 'steal',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
          playerAddress: action.playerAddress,
          targetAddress: action.targetAddress,
        };

      case 'shield':
        return {
          message: `${getDisplayName(action.playerAddress)} activated shield on ${propertyName} 🛡️`,
          type: 'shield',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
          playerAddress: action.playerAddress,
        };

      case 'claim':
        return {
          message: `${getDisplayName(action.playerAddress)} claimed ${formatAmount(action.amount || 0)} DEFI rewards 💰`,
          type: 'claim',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          playerAddress: action.playerAddress,
        };

      default:
        return null;
    }
  }, [profiles]);

  const addFeedItem = useCallback((item: FeedItem) => {
    setFeed(prev => {
      const exists = prev.some(existing => existing.txSignature === item.txSignature);
      if (exists) return prev;
      return [item, ...prev].slice(0, 50);
    });
  }, []);

  // Fetch historical actions from backend
  useEffect(() => {
    const fetchHistoricalActions = async () => {
      try {
        console.log('📡 Fetching recent actions from backend...');
        const response = await fetch(`${BACKEND_URL}/api/actions/recent?limit=50`);
        
        if (!response.ok) {
          throw new Error(`Backend responded with ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Received actions from backend:', data.actions?.length || 0);
        
        if (data.actions && Array.isArray(data.actions)) {
          const feedItems = data.actions
            .map((action: any) => actionToFeedItem(action))
            .filter((item: FeedItem | null): item is FeedItem => item !== null);
          
          console.log('✅ Converted to feed items:', feedItems.length);
          console.log('Sample feed item:', feedItems[0]);
          
          setFeed(feedItems);
          
          // Fetch profiles for all wallet addresses in the feed
          const allAddresses = new Set<string>();
          feedItems.forEach((item: any) => {
            if (item.playerAddress) allAddresses.add(item.playerAddress);
            if (item.targetAddress) allAddresses.add(item.targetAddress);
          });
          
          if (allAddresses.size > 0) {
            const profilesData = await getProfilesBatch(Array.from(allAddresses));
            setProfiles(profilesData);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching from backend:', error);
        // Fallback: try to fetch from blockchain if backend fails
        console.log('⚠️ Falling back to blockchain fetch...');
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalActions();
  }, [actionToFeedItem]);

  // Subscribe to real-time blockchain events
  useEffect(() => {
    let subscriptionId: number | null = null;

    const subscribeToLogs = async () => {
      try {
        console.log('📡 Subscribing to real-time program logs...');
        
        const coder = new BorshCoder(idl as any);
        const eventParser = new EventParser(PROGRAM_ID, coder);

        subscriptionId = connection.onLogs(
          PROGRAM_ID,
          async (logs) => {
            try {
              const events = eventParser.parseLogs(logs.logs);
              
              for (const event of events) {
                const action: any = {
                  txSignature: logs.signature,
                  blockTime: Date.now() / 1000,
                };
                
                switch (event.name) {
                  case 'PropertyBoughtEvent':
                  case 'propertyBoughtEvent':
                    action.actionType = 'buy';
                    action.playerAddress = event.data.player.toString();
                    action.propertyId = event.data.propertyId;
                    action.amount = Number(event.data.totalCost || event.data.price);
                    break;
                  
                  case 'PropertySoldEvent':
                  case 'propertySoldEvent':
                    action.actionType = 'sell';
                    action.playerAddress = event.data.player.toString();
                    action.propertyId = event.data.propertyId;
                    action.amount = Number(event.data.amount);
                    action.slots = event.data.slots;
                    break;
                  
                  case 'StealSuccessEvent':
                  case 'stealSuccessEvent':
                    action.actionType = 'steal_success';
                    action.playerAddress = event.data.attacker.toString();
                    action.targetAddress = event.data.target.toString();
                    action.propertyId = event.data.propertyId;
                    break;
                  
                  case 'StealFailedEvent':
                  case 'stealFailedEvent':
                    action.actionType = 'steal_failed';
                    action.playerAddress = event.data.attacker.toString();
                    action.targetAddress = event.data.target.toString();
                    action.propertyId = event.data.propertyId;
                    break;
                  
                  case 'ShieldActivatedEvent':
                  case 'shieldActivatedEvent':
                    action.actionType = 'shield';
                    action.playerAddress = event.data.player.toString();
                    action.propertyId = event.data.propertyId;
                    break;
                  
                  case 'RewardsClaimedEvent':
                  case 'rewardsClaimedEvent':
                    action.actionType = 'claim';
                    action.playerAddress = event.data.player.toString();
                    action.amount = Number(event.data.amount);
                    break;
                  
                  default:
                    continue;
                }
                
                const feedItem = actionToFeedItem(action);
                if (feedItem) {
                  addFeedItem(feedItem);
                }
              }
            } catch (error) {
              console.error('Error parsing real-time event:', error);
            }
          },
          'confirmed'
        );

        console.log('✅ Subscribed to real-time logs');
      } catch (error) {
        console.error('Error subscribing to logs:', error);
      }
    };

    subscribeToLogs();

    return () => {
      if (subscriptionId !== null) {
        connection.removeOnLogsListener(subscriptionId);
        console.log('🔌 Unsubscribed from program logs');
      }
    };
  }, [connection, addFeedItem, actionToFeedItem]);

  return (
    <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 max-h-[280px] overflow-hidden flex flex-col">
      {/* Header - Sticky */}
      <div className="p-4 pb-2">
        <h2 className="text-base font-semibold text-purple-200 border-b border-purple-500/20 pb-2">
          Live Activity
        </h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
      {loading ? (
        <div className="text-center py-8">
          <div className="text-xl mb-1">⏳</div>
          <div className="text-xs text-purple-300">Loading activity...</div>
        </div>
      ) : feed.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-2 opacity-50">📡</div>
          <div className="text-xs text-gray-400">
            No activity yet<br />
            Be the first to make a move!
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {feed.map((item) => (
            <div
              key={item.txSignature}
              className={`p-3 bg-purple-900/10 rounded-xl border-l-4 text-xs text-purple-200 leading-relaxed transition-all ${
                item.type === 'buy' ? 'border-green-400' :
                item.type === 'steal' ? 'border-red-400' :
                item.type === 'claim' ? 'border-blue-400' :
                item.type === 'sell' ? 'border-orange-400' :
                'border-amber-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Profile Picture - Smaller */}
                {item.playerAddress && (
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-purple-500/20 border border-purple-500/30 flex-shrink-0">
                    {profiles[item.playerAddress]?.profilePicture ? (
                      <img 
                        src={profiles[item.playerAddress].profilePicture || ''} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-300 text-[9px] font-bold">
                        {getDisplayName(item.playerAddress).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Message */}
                <div className="flex-1 min-w-0">
                  {item.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}