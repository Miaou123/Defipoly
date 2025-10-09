'use client';

import { useEffect, useState, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PROGRAM_ID, getPropertyById } from '@/utils/constants';
import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import idl from '@/types/defipoly_program.json';

interface FeedItem {
  message: string;
  type: 'buy' | 'steal' | 'shield' | 'claim' | 'sell';
  timestamp: number;
  txSignature: string;
  propertyId?: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3001';

export function LiveFeed() {
  const { connection } = useConnection();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
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
          message: `${formatAddress(action.playerAddress)} bought ${propertyName} for ${formatAmount(action.amount || 0)} DEFI`,
          type: 'buy',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
        };

      case 'sell':
        return {
          message: `${formatAddress(action.playerAddress)} sold ${action.slots || 0} slots of ${propertyName} for ${formatAmount(action.amount || 0)} DEFI`,
          type: 'sell',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
        };

      case 'steal_success':
        return {
          message: `${formatAddress(action.playerAddress)} stole from ${formatAddress(action.targetAddress)} on ${propertyName}! 💰`,
          type: 'steal',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
        };

      case 'steal_failed':
        return {
          message: `${formatAddress(action.playerAddress)} failed to steal from ${formatAddress(action.targetAddress)} on ${propertyName} 🛡️`,
          type: 'steal',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
        };

      case 'shield':
        return {
          message: `${formatAddress(action.playerAddress)} activated shield on ${propertyName} 🛡️`,
          type: 'shield',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
        };

      case 'claim':
        return {
          message: `${formatAddress(action.playerAddress)} claimed ${formatAmount(action.amount || 0)} DEFI 💰`,
          type: 'claim',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
        };

      default:
        return null;
    }
  }, []);

  const addFeedItem = useCallback((item: FeedItem) => {
    setFeed((prev) => {
      const exists = prev.some(i => i.txSignature === item.txSignature);
      if (exists) return prev;
      return [item, ...prev].slice(0, 50);
    });
  }, []);

  // Fetch historical actions from backend
  useEffect(() => {
    const fetchHistoricalActions = async () => {
      try {
        console.log('📥 Fetching historical actions from backend...');
        
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
                // Convert blockchain event to action format
                const action: any = {
                  txSignature: logs.signature,
                  blockTime: Math.floor(Date.now() / 1000),
                };

                switch (event.name) {
                  case 'PropertyBoughtEvent':
                  case 'propertyBoughtEvent':
                    action.actionType = 'buy';
                    action.playerAddress = event.data.player.toString();
                    action.propertyId = event.data.propertyId;
                    action.amount = Number(event.data.price);
                    break;
                  
                  case 'PropertySoldEvent':
                  case 'propertySoldEvent':
                    action.actionType = 'sell';
                    action.playerAddress = event.data.player.toString();
                    action.propertyId = event.data.propertyId;
                    action.amount = Number(event.data.received);
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
    <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 max-h-[450px] overflow-y-auto">
      <h2 className="text-lg font-semibold text-purple-200 mb-5 pb-4 border-b border-purple-500/20">
        Live Activity
      </h2>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-2xl mb-2">⏳</div>
          <div className="text-sm text-purple-300">Loading activity...</div>
        </div>
      ) : feed.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3 opacity-50">📡</div>
          <div className="text-sm text-gray-400">
            No activity yet<br />
            Be the first to make a move!
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map((item) => (
            <div
              key={item.txSignature}
              className={`p-4 bg-purple-900/10 rounded-xl border-l-4 text-sm text-purple-200 leading-relaxed transition-all ${
                item.type === 'buy' ? 'border-green-400' :
                item.type === 'steal' ? 'border-red-400' :
                item.type === 'claim' ? 'border-blue-400' :
                item.type === 'sell' ? 'border-orange-400' :
                'border-amber-400'
              }`}
            >
              {item.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}