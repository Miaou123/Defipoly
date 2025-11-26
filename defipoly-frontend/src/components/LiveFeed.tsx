'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { getPropertyById } from '@/utils/constants';
import { getProfilesBatch, ProfileData } from '@/utils/profileStorage';
import { getActionIcon, FeedIcon, PointerArrowIcon } from './icons/UIIcons';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useGameState } from '@/contexts/GameStateContext';

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

const API_BASE_URL = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101';

export function LiveFeed() {
  const router = useRouter();
  const { socket, connected } = useWebSocket();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);
  const newItemsRef = useRef<Set<string>>(new Set());
  const [showSpectatorHint, setShowSpectatorHint] = useState(false);
  
  // For portal arrow positioning
  const firstRowRef = useRef<HTMLDivElement>(null);
  const [arrowPosition, setArrowPosition] = useState<{ top: number; left: number } | null>(null);
  
  // Get game state to check if user owns properties
  const gameState = useGameState();
  const totalSlotsOwned = gameState.stats.totalSlotsOwned || 0;

  // Check if we should show the spectator hint
  useEffect(() => {
    const hasUsedSpectator = localStorage.getItem('hasUsedSpectator');
    // Show hint if: user owns at least 1 property AND hasn't used spectator yet
    if (!hasUsedSpectator && totalSlotsOwned > 0) {
      setShowSpectatorHint(true);
    }
  }, [totalSlotsOwned]);

  useEffect(() => {
    if (!showSpectatorHint || !firstRowRef.current) return;
    
    const updatePosition = () => {
      const rect = firstRowRef.current?.getBoundingClientRect();
      if (rect) {
        setArrowPosition({
          top: rect.top + rect.height / 2 - 12,
          left: rect.left - 28
        });
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showSpectatorHint, loading]);

  const dismissSpectatorHint = () => {
    localStorage.setItem('hasUsedSpectator', 'true');
    setShowSpectatorHint(false);
    setArrowPosition(null);
  };

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
    // Dismiss hint on first click
    if (showSpectatorHint) {
      dismissSpectatorHint();
    }
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
  }, [actionToFeedItem]);

  // Subscribe to WebSocket events for real-time updates
  useEffect(() => {
    if (!socket || !connected) return;

    const handleRecentAction = async (data: any) => {
      console.log('📥 [LiveFeed] Received WebSocket action:', data);
      
      const feedItem = actionToFeedItem(data);
      
      if (!feedItem) {
        console.warn('⚠️ [LiveFeed] Could not convert action to feed item:', data);
        return;
      }
      
      console.log('✅ [LiveFeed] Converted to feed item:', feedItem);
      
      setFeed(prev => {
        const isDuplicate = prev.some(existingItem => 
          existingItem.txSignature === feedItem.txSignature
        );
        
        if (isDuplicate) {
          console.log('ℹ️ [LiveFeed] Duplicate action, skipping');
          return prev;
        }
        
        newItemsRef.current.add(feedItem.txSignature);
        
        setTimeout(() => {
          newItemsRef.current.delete(feedItem.txSignature);
        }, 300);
        
        return [feedItem, ...prev].slice(0, 50);
      });
      
      const newAddresses = new Set<string>();
      if (feedItem.playerAddress) newAddresses.add(feedItem.playerAddress);
      if (feedItem.targetAddress) newAddresses.add(feedItem.targetAddress);
      
      if (newAddresses.size > 0) {
        const profilesData = await getProfilesBatch(Array.from(newAddresses));
        setProfiles(prev => ({ ...prev, ...profilesData }));
      }
    };

    socket.on('recent-action', handleRecentAction);

    return () => {
      socket.off('recent-action', handleRecentAction);
    };
  }, [socket, connected, actionToFeedItem]);

  return (
    <>
      <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 h-full flex flex-col overflow-hidden">
        {/* Header */}
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

        {/* Scrollable Content */}
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
              {feed.map((item, index) => {
                const isFirstRow = index === 0;
                const showHintOnRow = showSpectatorHint && isFirstRow;
                
                return (
                  <div
                    key={`${item.txSignature}-${index}`}
                    ref={isFirstRow ? firstRowRef : null}
                    onClick={() => handleActionClick(item)}
                    className={`relative flex items-start gap-2 p-2 rounded-lg transition-all cursor-pointer group ${
                      showHintOnRow
                        ? 'bg-yellow-500/10 border border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                        : `bg-white/[0.01] hover:bg-white/[0.05] ${newItemsRef.current.has(item.txSignature) ? 'animate-slide-in-top' : ''}`
                    }`}
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
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Portal arrow - renders at document.body level */}
      {showSpectatorHint && arrowPosition && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed animate-bounce-x pointer-events-none"
          style={{ 
            top: arrowPosition.top, 
            left: arrowPosition.left,
            transform: 'translateY(-50%)',
            zIndex: 9999
          }}
        >
          <PointerArrowIcon className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
        </div>,
        document.body
      )}
    </>
  );
}