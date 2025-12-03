// ============================================
// FILE: defipoly-frontend/src/contexts/RewardsContext.tsx
// Makes useRewards state a singleton to prevent multiple 15-minute intervals
// ============================================

'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useGameState } from '@/contexts/GameStateContext';
import { fetchPlayerData } from '@/utils/program';
import { useDefipoly } from '@/contexts/DefipolyContext';

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

interface RewardsContextType {
  ownerships: any[];
  dailyIncome: number;
  unclaimedRewards: number;
  loading: boolean;
  resetRewards: () => void;
}

const RewardsContext = createContext<RewardsContextType | null>(null);

export function RewardsProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { socket, connected } = useWebSocket();
  const { program } = useDefipoly();
  
  const { ownerships: apiOwnerships, loading: ownershipLoading, stats } = useGameState();
  
  const [unclaimedRewards, setUnclaimedRewards] = useState(0);
  const [loading, setLoading] = useState(true); // Start as loading
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const lastFetchTime = useRef<number>(0);
  const incomePerSecondRef = useRef<number>(0);

  // ✅ Calculate actual pending rewards (blockchain + time-based calculation)
  const fetchBlockchainRewards = async () => {
    if (!publicKey || !program) {
      console.log('❌ Cannot fetch blockchain - no publicKey or program');
      return null;
    }

    try {
      const playerData = await fetchPlayerData(program, publicKey);
      
      // ✅ FIXED: Return null instead of 0 when playerData is null
      // This prevents resetting rewards to 0 when the query fails
      if (!playerData) {
        console.warn('⚠️ Player data not found - account may not be initialized or query failed');
        return null; // Return null, not 0!
      }

      // Get blockchain stored pending rewards (already calculated)
      const storedRewards = (playerData.pendingRewards?.toNumber() || 0) / 1e9;
      
      // Get player income and last claim info
      const totalBaseDailyIncome = (playerData.totalBaseDailyIncome?.toNumber() || 0) / 1e9;
      const lastClaimTimestamp = playerData.lastClaimTimestamp?.toNumber() || 0;
      
      // Calculate time-based rewards since last update
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const timeElapsed = currentTimestamp - lastClaimTimestamp;
      
      
      if (timeElapsed > 0 && totalBaseDailyIncome > 0) {
        const secondsElapsed = timeElapsed;
        const incomePerSecond = totalBaseDailyIncome / 86400; // 86400 seconds per day
        const timeBasedRewards = incomePerSecond * secondsElapsed;
        
        const totalRewards = storedRewards + timeBasedRewards;
        
        
        return totalRewards;
      } else {
        return storedRewards;
      }
    } catch (error) {
      console.error('❌ BLOCKCHAIN FETCH FAILED:', error);
      return null;
    }
  };

  // Reset rewards function for when claims happen
  const resetRewards = useCallback(() => {
    setUnclaimedRewards(0);
    lastFetchTime.current = Date.now();
  }, []);

  // Reset when wallet disconnects
  useEffect(() => {
    if (!publicKey) {
      setUnclaimedRewards(0);
      setInitialFetchDone(false);
      lastFetchTime.current = 0;
      incomePerSecondRef.current = 0;
      setLoading(false); // Not loading when no wallet
    }
  }, [publicKey]);

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
      
      // ✅ FIXED: Only update if we got a valid value (not null)
      // This prevents resetting to 0 when the query fails
      if (blockchainRewards !== null) {
        setUnclaimedRewards(blockchainRewards);
        lastFetchTime.current = now;
        if (!initialFetchDone) {
          setInitialFetchDone(true);
        }
      } else {
        console.warn('⚠️ Blockchain rewards fetch returned null - keeping previous value');
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
    } else {
      incomePerSecondRef.current = 0;
    }
  }, [stats.dailyIncome]);

  // ✅ Smooth UI counting (increment by income per second)
  useEffect(() => {
    // Only start counting if we have both income rate AND initial blockchain data
    if (incomePerSecondRef.current <= 0 || !initialFetchDone) {
      return;
    }

    const interval = setInterval(() => {
      setUnclaimedRewards(prev => prev + incomePerSecondRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, [stats.dailyIncome, initialFetchDone]); // Restart when dailyIncome changes OR after initial blockchain fetch

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
        // Reset unclaimed rewards to 0
        resetRewards();
      }
    };

    socket.on('ownership-changed', handleOwnershipChanged);
    socket.on('reward-claimed', handleRewardClaimed);

    return () => {
      socket.off('ownership-changed', handleOwnershipChanged);
      socket.off('reward-claimed', handleRewardClaimed);
    };
  }, [socket, connected, publicKey, resetRewards]);

  const value = {
    ownerships: apiOwnerships, // Still return for compatibility
    dailyIncome: stats.dailyIncome, // Use backend calculated daily income with set bonuses
    unclaimedRewards: unclaimedRewards, // Keep full precision for proper initialization
    loading: loading || ownershipLoading,
    resetRewards,
  };

  return (
    <RewardsContext.Provider value={value}>
      {children}
    </RewardsContext.Provider>
  );
}

export function useRewards() {
  const context = useContext(RewardsContext);
  if (!context) {
    throw new Error('useRewards must be used within RewardsProvider');
  }
  return context;
}