// ============================================
// FILE: useRewards.ts
// ✅ HYBRID VERSION: Blockchain for last_claim_timestamp, API for ownership
// Fetches last_claim_timestamp from blockchain on load + every 15 min
// ============================================

import { useEffect, useState, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useOwnership } from './useOwnership'; // ✅ API-based hook
import { fetchPlayerData } from '@/utils/program'; // ✅ RPC call for PlayerAccount
import { PROPERTIES } from '@/utils/constants';
import { isSetComplete, getMinSlots } from '@/utils/gameHelpers';
import { useDefipoly } from './useDefipoly';

// Helper function to calculate daily income from price and yieldBps
const calculateDailyIncome = (price: number, yieldBps: number): number => {
  return Math.floor((price * yieldBps) / 10000);
};

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

export function useRewards() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { socket, connected } = useWebSocket();
  const { program } = useDefipoly();
  
  // ✅ Use API-based ownership hook
  const { ownerships: apiOwnerships, loading: ownershipLoading } = useOwnership();
  
  const [ownerships, setOwnerships] = useState<any[]>([]);
  const [lastClaimTime, setLastClaimTime] = useState<number>(0);
  const [dailyIncome, setDailyIncome] = useState(0);
  const [unclaimedRewards, setUnclaimedRewards] = useState(0);
  const [loading, setLoading] = useState(false);
  const lastFetchTime = useRef<number>(0);

  // ✅ NEW: Fetch last_claim_timestamp from BLOCKCHAIN
  const fetchLastClaimFromBlockchain = async () => {
    if (!publicKey || !program) return null;

    try {
      console.log('⛓️ Fetching last_claim_timestamp from blockchain...');
      const playerData = await fetchPlayerData(program, publicKey);
      
      if (!playerData) {
        console.log('⛓️ No player account found on blockchain');
        return null;
      }

      const lastClaim = playerData.lastClaimTimestamp?.toNumber() || 0;
      console.log('⛓️ Blockchain last_claim_timestamp:', lastClaim, new Date(lastClaim * 1000).toISOString());
      
      return lastClaim;
    } catch (error) {
      console.error('❌ Error fetching from blockchain:', error);
      return null;
    }
  };

  // ✅ Fetch last claim time from blockchain on mount and every 15 min
  useEffect(() => {
    if (!publicKey || !program) return;

    const fetchAndCache = async () => {
      const now = Date.now();
      
      // Skip if we fetched less than 15 minutes ago
      if (lastFetchTime.current && (now - lastFetchTime.current) < REFRESH_INTERVAL) {
        console.log('⏭️ Skipping blockchain fetch (cached)');
        return;
      }

      const blockchainLastClaim = await fetchLastClaimFromBlockchain();
      
      if (blockchainLastClaim !== null) {
        setLastClaimTime(blockchainLastClaim);
        lastFetchTime.current = now;
      } else {
        // Fallback: use current time if no blockchain data
        setLastClaimTime(Math.floor(Date.now() / 1000));
        lastFetchTime.current = now;
      }
    };

    // Fetch immediately on mount
    fetchAndCache();

    // Set up 15-minute interval refresh
    const intervalId = setInterval(() => {
      console.log('🔄 15-minute refresh: Fetching from blockchain...');
      fetchAndCache();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [publicKey, program]);

  // ✅ Process ownerships when apiOwnerships loads
  useEffect(() => {
    if (!publicKey) return;
    
    // Wait for apiOwnerships to load
    if (ownershipLoading) {
      console.log('⏳ Waiting for ownerships to load...');
      return;
    }
    
    if (apiOwnerships.length === 0) {
      console.log('⚠️ No ownerships yet');
      setOwnerships([]);
      setDailyIncome(0);
      return;
    }

    setLoading(true);
    
    try {
      // Convert ownerships from API
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

      console.log('🔍 DEBUG - Ownerships array length:', rewardsData.length);
      console.log('🔍 DEBUG - First ownership:', rewardsData[0]);

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
    } catch (error) {
      console.error('Error processing rewards data:', error);
    } finally {
      setLoading(false);
    }
  }, [publicKey, apiOwnerships, ownershipLoading]);

  // ✅ WebSocket listeners
  useEffect(() => {
    if (!socket || !connected || !publicKey) return;

    const handleOwnershipChanged = async (data: any) => {
      if (data.wallet === publicKey.toString()) {
        console.log('🏠 Ownership changed via WebSocket:', data);
        
        try {
          // Refresh last claim from blockchain
          const blockchainLastClaim = await fetchLastClaimFromBlockchain();
          if (blockchainLastClaim !== null) {
            setLastClaimTime(blockchainLastClaim);
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

    const handleRewardClaimed = async (data: any) => {
      if (data.wallet === publicKey.toString()) {

        const now = Math.floor(Date.now() / 1000);
        setLastClaimTime(now);
        setUnclaimedRewards(0);
        
        fetchLastClaimFromBlockchain().then(blockchainLastClaim => {
          if (blockchainLastClaim !== null) {
            setLastClaimTime(blockchainLastClaim);
            lastFetchTime.current = Date.now();
          }
        });
      }
    };

    socket.on('ownership-changed', handleOwnershipChanged);
    socket.on('reward-claimed', handleRewardClaimed);

    return () => {
      socket.off('ownership-changed', handleOwnershipChanged);
      socket.off('reward-claimed', handleRewardClaimed);
    };
  }, [socket, connected, publicKey, apiOwnerships]);

  // ✅ Client-side calculation (runs every second)
  useEffect(() => {
    if (ownerships.length === 0) {
      setUnclaimedRewards(0);
      return;
    }

    const calculateRewards = () => {
      const now = Math.floor(Date.now() / 1000);
      
      // ✅ If never claimed (lastClaimTime === 0), use earliest purchase time
      let effectiveLastClaim = lastClaimTime;
      if (lastClaimTime === 0) {
        const earliestPurchase = Math.min(...ownerships.map(o => o.purchaseTimestamp));
        effectiveLastClaim = earliestPurchase;
        console.log('🔍 Using earliest purchase as last claim:', earliestPurchase);
      }
      
      const secondsSinceLastClaim = Math.max(0, now - effectiveLastClaim);
      
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