'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWebSocket } from '@/contexts/WebSocketContext';

export function usePlayerStats() {
  const { publicKey } = useWallet();
  const { socket, connected, subscribeToWallet, unsubscribeFromWallet } = useWebSocket();
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const initialLoadDone = useRef(false);

  // Initial data fetch (only once)
  useEffect(() => {
    if (!publicKey || initialLoadDone.current) return;

    const fetchInitialStats = async () => {
      setLoading(true);
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101';
        const response = await fetch(`${API_BASE_URL}/api/stats/${publicKey.toString()}`);
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          setTotalEarned(data.totalEarned ? data.totalEarned / 1e9 : 0);
        }
        initialLoadDone.current = true;
      } catch (error) {
        console.error('Error fetching initial player stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialStats();
  }, [publicKey]);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (!socket || !connected || !publicKey) return;

    const handleStatsChanged = (data: any) => {
      if (data.wallet === publicKey.toString() && data.stats) {
        console.log('📊 Player stats updated via WebSocket:', data.stats);
        setStats(data.stats);
        setTotalEarned(data.stats.totalEarned ? data.stats.totalEarned / 1e9 : 0);
      }
    };

    // Listen for detailed stats changes
    socket.on('player-stats-changed', handleStatsChanged);

    // Also listen for general stats updates (for backward compatibility)
    socket.on('stats-updated', (data: any) => {
      if (data.wallet === publicKey.toString()) {
        // Trigger a minimal fetch if we just get a notification without data
        // This is more efficient than the old polling approach
      }
    });

    return () => {
      socket.off('player-stats-changed', handleStatsChanged);
      socket.off('stats-updated');
    };
  }, [socket, connected, publicKey]);

  // Handle wallet subscription
  useEffect(() => {
    if (publicKey && connected) {
      subscribeToWallet(publicKey.toString());
    } else if (!publicKey) {
      unsubscribeFromWallet();
      setTotalEarned(0);
      setStats(null);
      initialLoadDone.current = false;
    }
  }, [publicKey, connected, subscribeToWallet, unsubscribeFromWallet]);

  return { 
    totalEarned, 
    stats, 
    loading,
    // Add additional computed stats if needed
    propertiesBought: stats?.propertiesBought || 0,
    successfulSteals: stats?.successfulSteals || 0,
    leaderboardScore: stats?.leaderboardScore || 0
  };
}