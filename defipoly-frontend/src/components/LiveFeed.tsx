'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPropertyById } from '@/utils/constants';
import { getProfilesBatch, ProfileData } from '@/utils/profileStorage';
import { getActionIcon } from './icons/UIIcons';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface FeedItem {
  message: string;
  type: 'buy' | 'steal' | 'shield' | 'claim' | 'sell';
  timestamp: number;
  txSignature: string;
  propertyId?: number;
  playerAddress?: string;
  targetAddress?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101';

export function LiveFeed() {
  const router = useRouter();
  const { socket, connected } = useWebSocket();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

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

  const handleActionClick = (item: FeedItem) => {
    if (item.playerAddress) {
      router.push(`/spectator/${item.playerAddress}`);
    }
  };

  // Convert backend action to feed item (stable function to prevent loops)
  const actionToFeedItem = useCallback((action: any): FeedItem | null => {
    const property = action.propertyId !== null && action.propertyId !== undefined 
      ? getPropertyById(action.propertyId)
      : null;
    const propertyName = property ? property.name : 'Unknown Property';

    const getProfileName = (address: string) => {
      const profile = profiles[address];
      return profile?.username || formatAddress(address);
    };

    switch (action.actionType) {
      case 'buy':
        return {
          message: `${getProfileName(action.playerAddress)} bought ${propertyName} for ${formatAmount(action.amount || 0)} DEFI`,
          type: 'buy',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
          playerAddress: action.playerAddress,
        };

      case 'sell':
        return {
          message: `${getProfileName(action.playerAddress)} sold ${action.slots || 0} slots of ${propertyName} for ${formatAmount(action.amount || 0)} DEFI`,
          type: 'sell',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
          playerAddress: action.playerAddress,
        };

      case 'steal_success':
        return {
          message: `${getProfileName(action.playerAddress)} stole ${action.slots || 1} slots from ${getProfileName(action.targetAddress)} at ${propertyName}`,
          type: 'steal',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
          playerAddress: action.playerAddress,
          targetAddress: action.targetAddress,
        };

      case 'steal_failed':
        return {
          message: `${getProfileName(action.playerAddress)} failed to steal from ${getProfileName(action.targetAddress)} at ${propertyName}`,
          type: 'steal',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
          playerAddress: action.playerAddress,
          targetAddress: action.targetAddress,
        };

      case 'steal_attempt':
        return {
          message: `${getProfileName(action.playerAddress)} attempted to steal from ${getProfileName(action.targetAddress)} at ${propertyName}`,
          type: 'steal',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
          playerAddress: action.playerAddress,
          targetAddress: action.targetAddress,
        };

      case 'shield':
        return {
          message: `${getProfileName(action.playerAddress)} shielded ${propertyName}`,
          type: 'shield',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          propertyId: action.propertyId,
          playerAddress: action.playerAddress,
        };

      case 'claim':
        return {
          message: `${getProfileName(action.playerAddress)} claimed ${formatAmount(action.amount || 0)} DEFI reward`,
          type: 'claim',
          timestamp: action.blockTime * 1000,
          txSignature: action.txSignature,
          playerAddress: action.playerAddress,
        };

      default:
        return null;
    }
  }, []); // Remove profiles dependency to prevent loops

  const addFeedItem = useCallback((item: FeedItem) => {
    setFeed(prev => {
      const exists = prev.some(existing => existing.txSignature === item.txSignature);
      if (exists) return prev;
      return [item, ...prev].slice(0, 50);
    });
  }, []);

  // Fetch historical actions from backend (only once)
  useEffect(() => {
    if (initialLoadDone.current) return;

    const fetchHistoricalActions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/actions/recent?limit=50`);
        
        if (!response.ok) {
          throw new Error(`Backend responded with ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.actions && Array.isArray(data.actions)) {
          const feedItems = data.actions
            .map((action: any) => actionToFeedItem(action))
            .filter((item: FeedItem | null): item is FeedItem => item !== null);
          
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
        initialLoadDone.current = true;
      } catch (error) {
        console.error('❌ Error fetching from backend:', error);
        initialLoadDone.current = true;
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalActions();
  }, []); // Remove actionToFeedItem dependency

  // Subscribe to WebSocket events for real-time updates
  useEffect(() => {
    if (!socket || !connected) return;

    const handleRecentAction = async (data: any) => {
      // Convert WebSocket data to FeedItem
      const property = data.propertyId !== null && data.propertyId !== undefined 
        ? getPropertyById(data.propertyId)
        : null;
      const propertyName = property ? property.name : 'Unknown Property';
      
      const getProfileName = (address: string) => {
        const profile = profiles[address];
        return profile?.username || formatAddress(address);
      };
      
      let feedItem: FeedItem | null = null;
      
      switch (data.type) {
        case 'buy':
          feedItem = {
            message: `${getProfileName(data.buyer)} bought ${propertyName} for ${formatAmount(data.price || 0)} DEFI`,
            type: 'buy',
            timestamp: data.timestamp || Date.now(),
            txSignature: data.txSignature,
            propertyId: data.propertyId,
            playerAddress: data.buyer,
          };
          break;
          
        case 'sell':
          feedItem = {
            message: `${getProfileName(data.seller)} sold ${data.slots || 0} slots of ${propertyName} for ${formatAmount(data.price || 0)} DEFI`,
            type: 'sell',
            timestamp: data.timestamp || Date.now(),
            txSignature: data.txSignature,
            propertyId: data.propertyId,
            playerAddress: data.seller,
          };
          break;
          
        case 'steal':
          feedItem = {
            message: `${getProfileName(data.attacker)} stole ${data.slots || 1} slots from ${getProfileName(data.victim)} at ${propertyName}`,
            type: 'steal',
            timestamp: data.timestamp || Date.now(),
            txSignature: data.txSignature,
            propertyId: data.propertyId,
            playerAddress: data.attacker,
            targetAddress: data.victim,
          };
          break;
          
        case 'shield':
          feedItem = {
            message: `${getProfileName(data.owner)} shielded ${propertyName}`,
            type: 'shield',
            timestamp: data.timestamp || Date.now(),
            txSignature: data.txSignature,
            propertyId: data.propertyId,
            playerAddress: data.owner,
          };
          break;
          
        case 'reward':
          feedItem = {
            message: `${getProfileName(data.wallet)} claimed ${formatAmount(data.amount || 0)} DEFI reward`,
            type: 'claim',
            timestamp: data.timestamp || Date.now(),
            txSignature: data.txSignature,
            playerAddress: data.wallet,
          };
          break;
          
        case 'steal-failed':
          feedItem = {
            message: `${getProfileName(data.attacker)} failed to steal from ${getProfileName(data.victim)} at ${propertyName}`,
            type: 'steal',
            timestamp: data.timestamp || Date.now(),
            txSignature: data.txSignature,
            propertyId: data.propertyId,
            playerAddress: data.attacker,
            targetAddress: data.victim,
          };
          break;

        case 'steal-attempted':
          feedItem = {
            message: `${getProfileName(data.attacker)} attempted to steal from ${getProfileName(data.victim)} at ${propertyName}`,
            type: 'steal',
            timestamp: data.timestamp || Date.now(),
            txSignature: data.txSignature,
            propertyId: data.propertyId,
            playerAddress: data.attacker,
            targetAddress: data.victim,
          };
          break;
      }
      
      if (feedItem) {
        addFeedItem(feedItem);
        
        // Fetch profiles for new addresses
        const newAddresses = new Set<string>();
        if (data.buyer) newAddresses.add(data.buyer);
        if (data.seller) newAddresses.add(data.seller);
        if (data.attacker) newAddresses.add(data.attacker);
        if (data.victim) newAddresses.add(data.victim);
        if (data.owner) newAddresses.add(data.owner);
        if (data.wallet) newAddresses.add(data.wallet);
        
        if (newAddresses.size > 0) {
          const profilesData = await getProfilesBatch(Array.from(newAddresses));
          setProfiles(prev => ({ ...prev, ...profilesData }));
        }
      }
    };

    // Listen to the recent-action event
    socket.on('recent-action', handleRecentAction);

    // Cleanup
    return () => {
      socket.off('recent-action', handleRecentAction);
    };
  }, [socket, connected]); // Simplified dependencies

  // Display loading state
  if (loading) {
    return (
      <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white/90">Live Feed</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-xs text-white/60">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white/90">Live Feed</h3>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-white/60">{connected ? 'Live' : 'Offline'}</span>
        </div>
      </div>
      
      <div className="space-y-2 max-h-[350px] overflow-y-auto">
        {feed.length === 0 ? (
          <p className="text-sm text-white/60 text-center py-8">
            No recent actions yet...
          </p>
        ) : (
          feed.map((item, index) => (
            <div
              key={item.txSignature || index}
              className="flex items-start gap-2 p-2 rounded hover:bg-white/5 transition-colors cursor-pointer group"
              onClick={() => handleActionClick(item)}
            >
              <div className="mt-0.5 text-white/70 group-hover:text-white/90 transition-colors">
                {getActionIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 break-words group-hover:text-white/90 transition-colors">
                  {item.message}
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}