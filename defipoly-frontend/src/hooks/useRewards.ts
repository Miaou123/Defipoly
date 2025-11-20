// ============================================
// FILE: useRewards.ts
// ✅ SIMPLIFIED VERSION: Uses blockchain pending_rewards directly
// Fetches pending_rewards from blockchain + smooth UI counting
// ============================================

import { useEffect, useState, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useGameState } from '@/contexts/GameStateContext';
import { fetchPlayerData } from '@/utils/program';
import { useDefipoly } from './useDefipoly';

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

export function useRewards() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { socket, connected } = useWebSocket();
  const { program } = useDefipoly();
  
  const { ownerships: apiOwnerships, loading: ownershipLoading, stats } = useGameState();
  
  const [unclaimedRewards, setUnclaimedRewards] = useState(0);
  const [loading, setLoading] = useState(false);
  const lastFetchTime = useRef<number>(0);
  const incomePerSecondRef = useRef<number>(0);

  // ✅ Fetch pending_rewards from blockchain only (use backend for daily income)
  const fetchBlockchainRewards = async () => {
    if (!publicKey || !program) return null;

    try {
      console.log('⛓️ Fetching pending_rewards from blockchain...');
      const playerData = await fetchPlayerData(program, publicKey);
      
      if (!playerData) {
        console.log('⛓️ No player account found on blockchain');
        return 0;
      }

      const blockchainRewards = (playerData.pendingRewards?.toNumber() || 0) / 1e9; // Convert from lamports to DEFI (9 decimals)
      
      console.log('⛓️ Blockchain pending_rewards (raw):', playerData.pendingRewards?.toNumber() || 0);
      console.log('⛓️ Blockchain pending_rewards (DEFI):', blockchainRewards);
      
      return blockchainRewards;
    } catch (error) {
      console.error('❌ Error fetching from blockchain:', error);
      return null;
    }
  };

  // ✅ Fetch pending rewards from blockchain on mount and every 15 min
  useEffect(() => {
    if (!publicKey || !program) return;

    const fetchAndUpdate = async () => {
      const now = Date.now();
      
      // Skip if we fetched less than 15 minutes ago (unless it's the first fetch)
      if (lastFetchTime.current && (now - lastFetchTime.current) < REFRESH_INTERVAL) {
        console.log('⏭️ Skipping blockchain fetch (cached)');
        return;
      }

      setLoading(true);
      const blockchainRewards = await fetchBlockchainRewards();
      
      if (blockchainRewards !== null) {
        setUnclaimedRewards(blockchainRewards);
        lastFetchTime.current = now;
      }
      setLoading(false);
    };

    // Fetch immediately on mount
    fetchAndUpdate();

    // Set up 15-minute interval refresh
    const intervalId = setInterval(() => {
      console.log('🔄 15-minute refresh: Fetching pending rewards from blockchain...');
      fetchAndUpdate();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [publicKey, program]);

  // ✅ Update income per second when backend stats change
  useEffect(() => {
    if (stats.dailyIncome > 0) {
      incomePerSecondRef.current = stats.dailyIncome / 86400;
      console.log('📊 Backend daily income updated:', stats.dailyIncome, 'per second:', incomePerSecondRef.current);
    } else {
      incomePerSecondRef.current = 0;
    }
  }, [stats.dailyIncome]);

  // ✅ Smooth UI counting (increment by income per second)
  useEffect(() => {
    if (incomePerSecondRef.current <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setUnclaimedRewards(prev => prev + incomePerSecondRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ✅ WebSocket listeners for real-time updates
  useEffect(() => {
    if (!socket || !connected || !publicKey) return;

    const handleOwnershipChanged = async (data: any) => {
      if (data.wallet === publicKey.toString()) {
        console.log('🏠 Ownership changed via WebSocket:', data);
        
        // Refresh pending rewards from blockchain immediately
        const blockchainRewards = await fetchBlockchainRewards();
        if (blockchainRewards !== null) {
          setUnclaimedRewards(blockchainRewards);
          lastFetchTime.current = Date.now();
        }
        // Note: dailyIncome will be updated by GameState via the stats effect
      }
    };

    const handleRewardClaimed = async (data: any) => {
      if (data.wallet === publicKey.toString()) {
        console.log('💰 Rewards claimed via WebSocket:', data);
        
        // Reset unclaimed rewards to 0
        setUnclaimedRewards(0);
        lastFetchTime.current = Date.now();
        // Note: dailyIncome stays the same, managed by GameState
      }
    };

    socket.on('ownership-changed', handleOwnershipChanged);
    socket.on('reward-claimed', handleRewardClaimed);

    return () => {
      socket.off('ownership-changed', handleOwnershipChanged);
      socket.off('reward-claimed', handleRewardClaimed);
    };
  }, [socket, connected, publicKey]);

  return {
    ownerships: apiOwnerships, // Still return for compatibility
    dailyIncome: stats.dailyIncome, // Use backend calculated daily income with set bonuses
    unclaimedRewards: Math.floor(unclaimedRewards), // Display as whole DEFI tokens (already converted from lamports)
    loading: loading || ownershipLoading,
  };
}