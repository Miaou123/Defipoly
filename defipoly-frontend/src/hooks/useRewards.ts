// ============================================
// FILE: useRewards.ts
// ✅ FINAL VERSION: 100% API-based, NO RPC calls!
// Uses last_claim_timestamp from database instead of blockchain
// ============================================

import { useEffect, useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useOwnership } from './useOwnership'; // ✅ API-based hook
import { fetchPlayerStats } from '@/services/api'; // ✅ NEW: API call
import { PROPERTIES } from '@/utils/constants';
import { isSetComplete, getMinSlots } from '@/utils/gameHelpers';

// Helper function to calculate daily income from price and yieldBps
const calculateDailyIncome = (price: number, yieldBps: number): number => {
  return Math.floor((price * yieldBps) / 10000);
};

export function useRewards() {
  const { publicKey } = useWallet();
  const { socket, connected } = useWebSocket();
  
  // ✅ Use API-based ownership hook (already fetched via API)
  const { ownerships: apiOwnerships, loading: ownershipLoading } = useOwnership();
  
  const [ownerships, setOwnerships] = useState<any[]>([]);
  const [lastClaimTime, setLastClaimTime] = useState<number>(Math.floor(Date.now() / 1000));
  const [dailyIncome, setDailyIncome] = useState(0);
  const [unclaimedRewards, setUnclaimedRewards] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const initialLoadDone = useRef(false);

  // ✅ NEW: Fetch last_claim_timestamp from API instead of RPC!
  useEffect(() => {
    if (!publicKey || initialLoadDone.current) return;

    const processOwnerships = async () => {
      setLoading(true);
      setIsInitialLoad(true);
      
      try {
        // ✅ NEW: Get last claim time from API instead of blockchain!
        const playerStats = await fetchPlayerStats(publicKey.toString());
        
        if (!playerStats) {
          setLoading(false);
          setIsInitialLoad(false);
          initialLoadDone.current = true;
          return;
        }

        // ✅ NEW: Use last_claim_timestamp from database
        const lastClaim = playerStats.lastClaimTimestamp || Math.floor(Date.now() / 1000);
        setLastClaimTime(lastClaim);

        console.log('📅 Last claim time from API:', lastClaim, new Date(lastClaim * 1000).toISOString());

        // ✅ Use ownerships from API hook (no RPC calls!)
        const rewardsData = apiOwnerships
          .filter(ownership => ownership.slotsOwned > 0)
          .map(ownership => {
            const property = PROPERTIES.find(p => p.id === ownership.propertyId);
            if (!property) return null;

            return {
              propertyId: ownership.propertyId,
              slotsOwned: ownership.slotsOwned,
              purchaseTimestamp: ownership.purchaseTimestamp.toNumber(),
              dailyIncomePerSlot: calculateDailyIncome(property.price, property.yieldBps),
            };
          })
          .filter((o): o is NonNullable<typeof o> => o !== null);

        setOwnerships(rewardsData);

        // Calculate daily income with set bonuses
        const ownedPropertyIds = rewardsData.map(o => o.propertyId);
        let totalDaily = 0;
        
        // Group by setId to calculate bonuses
        const ownershipsBySet = rewardsData.reduce((acc, ownership) => {
          const property = PROPERTIES.find(p => p.id === ownership.propertyId);
          if (!property) return acc;
          
          if (!acc[property.setId]) {
            acc[property.setId] = [];
          }
          acc[property.setId].push({ ownership, property });
          return acc;
        }, {} as Record<number, Array<{ ownership: any; property: typeof PROPERTIES[0] }>>);
        
        // Calculate income with set bonuses
        for (const [setIdStr, setOwnerships] of Object.entries(ownershipsBySet)) {
          const setId = Number(setIdStr);
          const hasCompleteSet = isSetComplete(setId, ownedPropertyIds);
          const minSlots = getMinSlots(setId);
          
          for (const { ownership } of setOwnerships) {
            const baseIncome = ownership.dailyIncomePerSlot * ownership.slotsOwned;
            
            if (hasCompleteSet && minSlots > 0) {
              // Calculate bonus (40% on minimum slots)
              const bonusedSlots = Math.min(ownership.slotsOwned, minSlots);
              const regularSlots = ownership.slotsOwned - bonusedSlots;
              const bonusIncome = Math.floor(ownership.dailyIncomePerSlot * 1.4 * bonusedSlots);
              const regularIncome = ownership.dailyIncomePerSlot * regularSlots;
              totalDaily += (bonusIncome + regularIncome);
            } else {
              totalDaily += baseIncome;
            }
          }
        }
        
        setDailyIncome(totalDaily);
        initialLoadDone.current = true;
      } catch (error) {
        console.error('Error processing rewards data:', error);
        initialLoadDone.current = true;
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    processOwnerships();
  }, [publicKey, apiOwnerships]);

  // ✅ WebSocket listeners (simplified - no RPC calls!)
  useEffect(() => {
    if (!socket || !connected || !publicKey) return;

    const handleOwnershipChanged = async (data: any) => {
      if (data.wallet === publicKey.toString()) {
        console.log('🏠 Ownership changed via WebSocket:', data);
        
        try {
          // ✅ Get updated last claim time from API
          const playerStats = await fetchPlayerStats(publicKey.toString());
          if (playerStats) {
            setLastClaimTime(playerStats.lastClaimTimestamp || Math.floor(Date.now() / 1000));
          }

          // ✅ Use apiOwnerships from hook (already updated by useOwnership!)
          const rewardsData = apiOwnerships
            .filter(ownership => ownership.slotsOwned > 0)
            .map(ownership => {
              const property = PROPERTIES.find(p => p.id === ownership.propertyId);
              if (!property) return null;

              return {
                propertyId: ownership.propertyId,
                slotsOwned: ownership.slotsOwned,
                purchaseTimestamp: ownership.purchaseTimestamp.toNumber(),
                dailyIncomePerSlot: calculateDailyIncome(property.price, property.yieldBps),
              };
            })
            .filter((o): o is NonNullable<typeof o> => o !== null);
          
          setOwnerships(rewardsData);
          
          // Recalculate daily income with set bonuses
          const ownedPropertyIds = rewardsData.map(o => o.propertyId);
          let totalDaily = 0;
          
          const ownershipsBySet = rewardsData.reduce((acc, ownership) => {
            const property = PROPERTIES.find(p => p.id === ownership.propertyId);
            if (!property) return acc;
            
            if (!acc[property.setId]) {
              acc[property.setId] = [];
            }
            acc[property.setId].push({ ownership, property });
            return acc;
          }, {} as Record<number, Array<{ ownership: any; property: typeof PROPERTIES[0] }>>);
          
          for (const [setIdStr, setOwnerships] of Object.entries(ownershipsBySet)) {
            const setId = Number(setIdStr);
            const hasCompleteSet = isSetComplete(setId, ownedPropertyIds);
            const minSlots = getMinSlots(setId);
            
            for (const { ownership } of setOwnerships) {
              const baseIncome = ownership.dailyIncomePerSlot * ownership.slotsOwned;
              
              if (hasCompleteSet && minSlots > 0) {
                const bonusedSlots = Math.min(ownership.slotsOwned, minSlots);
                const regularSlots = ownership.slotsOwned - bonusedSlots;
                const bonusIncome = Math.floor(ownership.dailyIncomePerSlot * 1.4 * bonusedSlots);
                const regularIncome = ownership.dailyIncomePerSlot * regularSlots;
                totalDaily += (bonusIncome + regularIncome);
              } else {
                totalDaily += baseIncome;
              }
            }
          }
          
          setDailyIncome(totalDaily);
        } catch (error) {
          console.error('Error updating rewards on ownership change:', error);
        }
      }
    };

    const handleRewardsUpdated = (data: any) => {
      if (data.wallet === publicKey.toString()) {
        console.log('💰 Rewards updated via WebSocket');
        // Trigger recalculation by updating state
        setLastClaimTime(prev => prev);
      }
    };

    const handleRewardClaimed = async (data: any) => {
      if (data.wallet === publicKey.toString()) {
        console.log('💰 Reward claimed via WebSocket');
        
        // ✅ NEW: Get updated last claim time from API
        try {
          const playerStats = await fetchPlayerStats(publicKey.toString());
          if (playerStats) {
            setLastClaimTime(playerStats.lastClaimTimestamp || Math.floor(Date.now() / 1000));
          }
        } catch (error) {
          console.error('Error updating claim time:', error);
          // Fallback: use current time
          setLastClaimTime(Math.floor(Date.now() / 1000));
        }
        
        // Reset unclaimed rewards
        setUnclaimedRewards(0);
      }
    };

    socket.on('ownership-changed', handleOwnershipChanged);
    socket.on('rewards-updated', handleRewardsUpdated);
    socket.on('reward-claimed', handleRewardClaimed);

    return () => {
      socket.off('ownership-changed', handleOwnershipChanged);
      socket.off('rewards-updated', handleRewardsUpdated);
      socket.off('reward-claimed', handleRewardClaimed);
    };
  }, [socket, connected, publicKey, apiOwnerships]);

  // Client-side calculation (runs every second)
  useEffect(() => {
    if (ownerships.length === 0) {
      setUnclaimedRewards(0);
      return;
    }

    const calculateRewards = () => {
      const now = Math.floor(Date.now() / 1000);
      const secondsSinceLastClaim = Math.max(0, now - lastClaimTime);
      
      let total = 0;
      for (const ownership of ownerships) {
        const ownershipAge = now - ownership.purchaseTimestamp;
        const effectiveAge = Math.min(ownershipAge, secondsSinceLastClaim);
        
        const incomePerSecond = ownership.dailyIncomePerSlot / 86400;
        const earned = incomePerSecond * effectiveAge * ownership.slotsOwned;
        total += earned;
      }
      
      setUnclaimedRewards(Math.floor(total));
    };

    calculateRewards();
    const interval = setInterval(calculateRewards, 1000);
    return () => clearInterval(interval);
  }, [ownerships, lastClaimTime]);

  return {
    ownerships,
    dailyIncome,
    unclaimedRewards,
    loading: loading || ownershipLoading,
  };
}