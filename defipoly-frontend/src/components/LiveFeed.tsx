'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPropertyById } from '@/utils/constants';
import { getProfilesBatch, ProfileData } from '@/utils/profileStorage';
import { getActionIcon, FeedIcon } from './icons/UIIcons';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface FeedItem {
  type: 'buy' | 'steal_success' | 'steal_failed' | 'shield' | 'claim' | 'sell';
  timestamp: number;
  txSignature: string;
  propertyId?: number;
  playerAddress?: string;
  targetAddress?: string;
  slots?: number;
  buyer?: string;
  seller?: string;
  attacker?: string;
  victim?: string;
  owner?: string;
  wallet?: string;
  success?: boolean;
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

  const generateMessage = (item: FeedItem): string => {
    const property = item.propertyId !== null && item.propertyId !== undefined 
      ? getPropertyById(item.propertyId)
      : null;
    const propertyName = property ? property.name : 'Unknown Property';
    
    const playerAddr = item.playerAddress || item.buyer || item.seller || item.attacker || item.owner || item.wallet;
    const targetAddr = item.targetAddress || item.victim;
    
    switch (item.type) {
      case 'buy':
        const buySlots = item.slots || 1;
        return `${getDisplayName(playerAddr || '')} bought ${buySlots} slot${buySlots > 1 ? 's' : ''} at ${propertyName}`;
        
      case 'sell':
        const sellSlots = item.slots || 1;
        return `${getDisplayName(playerAddr || '')} sold ${sellSlots} slot${sellSlots > 1 ? 's' : ''} at ${propertyName}`;
        
      case 'steal_success':
        const successSlots = item.slots || 1;
        return `${getDisplayName(playerAddr || '')} stole ${propertyName} from ${getDisplayName(targetAddr || '')}`;
        
      case 'steal_failed':
        return `${getDisplayName(playerAddr || '')} failed to steal ${propertyName} from ${getDisplayName(targetAddr || '')}`;
        
      case 'shield':
        const shieldSlots = item.slots || 1;
        return `${getDisplayName(playerAddr || '')} shielded ${shieldSlots} slot${shieldSlots > 1 ? 's' : ''} at ${propertyName}`;
        
      case 'claim':
        return `${getDisplayName(playerAddr || '')} claimed rewards`;
        
      default:
        return 'Unknown action';
    }
  };

  const handleActionClick = (item: FeedItem) => {
    const playerAddr = item.playerAddress || item.buyer || item.seller || item.attacker || item.owner || item.wallet;
    if (playerAddr) {
      router.push(`/spectator/${playerAddr}`);
    }
  };

  // Convert backend action to feed item (stable function to prevent loops)
  const actionToFeedItem = useCallback((action: any): FeedItem | null => {
    const property = action.propertyId !== null && action.propertyId !== undefined 
      ? getPropertyById(action.propertyId)
      : null;
    
    // Backend uses 'actionType' field, not 'type'
    const actionType = action.actionType || action.type;
    if (!actionType) {
      console.warn('⚠️ Action missing type:', action);
      return null;
    }
    
    // Determine the actual type - backend already uses steal_success/steal_failed
    let feedType = actionType;
    
    // Map any legacy 'steal' type based on success flag
    if (actionType === 'steal') {
      feedType = action.success ? 'steal_success' : 'steal_failed';
    }
    
    return {
      type: feedType,
      timestamp: action.blockTime ? action.blockTime * 1000 : (action.timestamp || Date.now()),
      txSignature: action.txSignature,
      propertyId: action.propertyId,
      slots: action.slots,
      buyer: action.buyer || (actionType === 'buy' ? action.playerAddress : undefined),
      seller: action.seller || (actionType === 'sell' ? action.playerAddress : undefined),
      attacker: action.attacker || (actionType.includes('steal') ? action.playerAddress : undefined),
      victim: action.victim || action.targetAddress,
      owner: action.owner || (actionType === 'shield' ? action.playerAddress : undefined),
      wallet: action.wallet || (actionType === 'claim' ? action.playerAddress : undefined),
      success: action.success,
      playerAddress: action.playerAddress,
      targetAddress: action.targetAddress || action.victim,
    };
  }, []);

  // Initial load of historical actions
  useEffect(() => {
    if (initialLoadDone.current) return;

    const fetchHistoricalActions = async () => {
      try {
        console.log('🔍 Fetching recent actions from backend...');
        const response = await fetch(`${API_BASE_URL}/api/actions/recent?limit=20`);
        
        if (!response.ok) {
          console.error('❌ Backend responded with error:', response.status);
          throw new Error(`Backend responded with ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Received data from backend:', data);
        
        if (data.actions && Array.isArray(data.actions)) {
          console.log(`📋 Processing ${data.actions.length} actions...`);
          
          const feedItems = data.actions
            .map((action: any) => actionToFeedItem(action))
            .filter((item: FeedItem | null): item is FeedItem => item !== null);
          
          console.log(`✅ Created ${feedItems.length} feed items`);
          setFeed(feedItems);
          
          // Fetch profiles for all wallet addresses in the feed
          const allAddresses = new Set<string>();
          feedItems.forEach((item: any) => {
            if (item.playerAddress) allAddresses.add(item.playerAddress);
            if (item.targetAddress) allAddresses.add(item.targetAddress);
          });
          
          console.log(`👥 Fetching profiles for ${allAddresses.size} addresses...`);
          
          if (allAddresses.size > 0) {
            const profilesData = await getProfilesBatch(Array.from(allAddresses));
            setProfiles(profilesData);
            console.log('✅ Profiles loaded');
          }
        } else {
          console.warn('⚠️ No actions array in response');
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
  }, []); // Empty dependency array - only run once on mount

  // Subscribe to WebSocket events for real-time updates
  useEffect(() => {
    if (!socket || !connected) return;

    const handleRecentAction = async (data: any) => {
      console.log('📥 [LiveFeed] Received WebSocket action:', data);
      
      // ✅ Use the same conversion function as initial load
      const feedItem = actionToFeedItem(data);
      
      if (!feedItem) {
        console.warn('⚠️ [LiveFeed] Could not convert action to feed item:', data);
        return;
      }
      
      console.log('✅ [LiveFeed] Converted to feed item:', feedItem);
      
      // Check if this exact action already exists in the feed
      setFeed(prev => {
        const isDuplicate = prev.some(existingItem => 
          existingItem.txSignature === feedItem.txSignature
        );
        
        if (isDuplicate) {
          console.log('ℹ️ [LiveFeed] Duplicate action, skipping');
          return prev;
        }
        
        return [feedItem, ...prev].slice(0, 50);
      });
      
      // Fetch profiles for new addresses
      const newAddresses = new Set<string>();
      if (feedItem.playerAddress) newAddresses.add(feedItem.playerAddress);
      if (feedItem.targetAddress) newAddresses.add(feedItem.targetAddress);
      
      if (newAddresses.size > 0) {
        const profilesData = await getProfilesBatch(Array.from(newAddresses));
        setProfiles(prev => ({ ...prev, ...profilesData }));
      }
    };

    // Listen to the recent-action event
    socket.on('recent-action', handleRecentAction);

    // Cleanup
    return () => {
      socket.off('recent-action', handleRecentAction);
    };
  }, [socket, connected, profiles]);

  return (
    <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 h-full flex flex-col overflow-hidden">
      {/* Header - matching Leaderboard/Portfolio style - NON-SCROLLABLE */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-purple-500/20 pb-2">
              <FeedIcon size={20} className="text-white" />
              <h2 className="text-lg font-bold text-white">Live Feed</h2>
            </div>
            <p className="text-xs text-purple-400 mt-1">Click on an action to see the player's board</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-purple-400">{connected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content - matches Portfolio structure */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
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
            {feed.map((item, index) => (
              <div
                key={`${item.txSignature}-${index}`}
                onClick={() => handleActionClick(item)}
                className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.01] hover:bg-white/[0.05] transition-all cursor-pointer group"
              >
                <div className="mt-0.5 text-purple-400 group-hover:text-purple-300 transition-colors">
                  {getActionIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-purple-100 break-words group-hover:text-white transition-colors">
                    {generateMessage(item)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}