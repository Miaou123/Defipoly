'use client';

import { useEffect, useState, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PROGRAM_ID } from '@/utils/constants';
import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import idl from '@/types/defipoly_program.json';

interface FeedItem {
  message: string;
  type: 'buy' | 'steal' | 'shield' | 'claim' | 'sell';
  timestamp: number;
  txSignature: string;
}

const PROPERTY_NAMES = [
  'Bronze Basic', 'Bronze Plus', 
  'Silver Basic', 'Silver Plus',
  'Gold Basic', 'Gold Plus',
  'Platinum Basic', 'Platinum Elite'
];

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

  const parseEventToFeedItem = useCallback((event: any, signature: string, timestamp: number): FeedItem | null => {
    try {
      switch (event.name) {
        case 'PropertyBoughtEvent':
        case 'propertyBoughtEvent': {
          const data = event.data;
          const propertyName = PROPERTY_NAMES[data.propertyId] || `Property ${data.propertyId}`;
          return {
            message: `${formatAddress(data.player.toString())} bought ${propertyName} for ${formatAmount(Number(data.price))} DEFI`,
            type: 'buy',
            timestamp,
            txSignature: signature,
          };
        }

        case 'PropertySoldEvent':
        case 'propertySoldEvent': {
          const data = event.data;
          const propertyName = PROPERTY_NAMES[data.propertyId] || `Property ${data.propertyId}`;
          return {
            message: `${formatAddress(data.player.toString())} sold ${data.slots} slot(s) of ${propertyName}`,
            type: 'sell',
            timestamp,
            txSignature: signature,
          };
        }

        case 'ShieldActivatedEvent':
        case 'shieldActivatedEvent': {
          const data = event.data;
          const propertyName = PROPERTY_NAMES[data.propertyId] || `Property ${data.propertyId}`;
          return {
            message: `${formatAddress(data.player.toString())} activated shield on ${propertyName}`,
            type: 'shield',
            timestamp,
            txSignature: signature,
          };
        }

        case 'StealSuccessEvent':
        case 'stealSuccessEvent': {
          const data = event.data;
          const propertyName = PROPERTY_NAMES[data.propertyId] || `Property ${data.propertyId}`;
          return {
            message: `🎯 ${formatAddress(data.attacker.toString())} successfully stole ${propertyName} from ${formatAddress(data.target.toString())}!`,
            type: 'steal',
            timestamp,
            txSignature: signature,
          };
        }

        case 'StealFailedEvent':
        case 'stealFailedEvent': {
          const data = event.data;
          const propertyName = PROPERTY_NAMES[data.propertyId] || `Property ${data.propertyId}`;
          return {
            message: `❌ ${formatAddress(data.attacker.toString())} failed to steal ${propertyName} from ${formatAddress(data.target.toString())}`,
            type: 'steal',
            timestamp,
            txSignature: signature,
          };
        }

        case 'RewardsClaimedEvent':
        case 'rewardsClaimedEvent': {
          const data = event.data;
          return {
            message: `${formatAddress(data.player.toString())} claimed ${formatAmount(Number(data.amount))} DEFI in rewards`,
            type: 'claim',
            timestamp,
            txSignature: signature,
          };
        }

        default:
          return null;
      }
    } catch (error) {
      console.error('Error parsing event:', error);
      return null;
    }
  }, []);

  const addFeedItem = useCallback((item: FeedItem) => {
    setFeed(prev => {
      // Avoid duplicates by signature
      if (prev.some(i => i.txSignature === item.txSignature)) {
        return prev;
      }
      // Add and sort by timestamp (newest first), keep max 50 items
      return [item, ...prev]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);
    });
  }, []);

  // Fetch historical transactions on load
  useEffect(() => {
    const fetchHistoricalTransactions = async () => {
      setLoading(true);
      try {
        console.log('📜 Fetching historical transactions...');
        
        const coder = new BorshCoder(idl as any);
        const eventParser = new EventParser(PROGRAM_ID, coder);

        // Get recent signatures for the program
        const signatures = await connection.getSignaturesForAddress(
          PROGRAM_ID,
          { limit: 20 }, // Last 20 transactions
          'confirmed'
        );

        console.log(`Found ${signatures.length} recent transactions`);

        // Fetch and parse each transaction
        for (const sigInfo of signatures) {
          try {
            const tx = await connection.getTransaction(sigInfo.signature, {
              maxSupportedTransactionVersion: 0,
            });

            if (tx?.meta?.logMessages) {
              const events = eventParser.parseLogs(tx.meta.logMessages);
              
              for (const event of events) {
                const feedItem = parseEventToFeedItem(
                  event,
                  sigInfo.signature,
                  (sigInfo.blockTime || 0) * 1000
                );
                
                if (feedItem) {
                  addFeedItem(feedItem);
                }
              }
            }
          } catch (error) {
            console.error(`Error parsing transaction ${sigInfo.signature}:`, error);
          }
        }

        console.log('✅ Historical transactions loaded');
      } catch (error) {
        console.error('Error fetching historical transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalTransactions();
  }, [connection, addFeedItem, parseEventToFeedItem]);

  // Subscribe to real-time events
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
                const feedItem = parseEventToFeedItem(
                  event,
                  logs.signature,
                  Date.now()
                );
                
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
  }, [connection, addFeedItem, parseEventToFeedItem]);

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
          {feed.map((item, idx) => (
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