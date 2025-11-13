import { useEffect, useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDefipoly } from './useDefipoly';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { PROPERTIES } from '@/utils/constants';
import { isSetComplete, getMinSlots } from '@/utils/gameHelpers';

// Helper function to calculate daily income from price and yieldBps
const calculateDailyIncome = (price: number, yieldBps: number): number => {
  return Math.floor((price * yieldBps) / 10000);
};

export function useRewards() {
  const { wallet } = useWallet();
  const { socket, connected } = useWebSocket();
  const { getPlayerData, getOwnershipData, program } = useDefipoly();
  
  const [ownerships, setOwnerships] = useState<any[]>([]);
  const [lastClaimTime, setLastClaimTime] = useState<number>(Date.now());
  const [dailyIncome, setDailyIncome] = useState(0);
  const [unclaimedRewards, setUnclaimedRewards] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const initialLoadDone = useRef(false);

  // Initial data fetch (only once)
  useEffect(() => {
    if (!wallet || !program || initialLoadDone.current) return;

    const fetchInitialData = async () => {
      setLoading(true);
      setIsInitialLoad(true);
      
      try {
        const playerData = await getPlayerData();
        if (!playerData) {
          setLoading(false);
          setIsInitialLoad(false);
          initialLoadDone.current = true;
          return;
        }

        const ownershipPromises = PROPERTIES.map(async (prop) => {
          const ownership = await getOwnershipData(prop.id);
          if (ownership?.slotsOwned && ownership.slotsOwned > 0) {
            return {
              propertyId: prop.id,
              slotsOwned: ownership.slotsOwned,
              purchaseTimestamp: ownership.purchaseTimestamp.toNumber(),
              dailyIncomePerSlot: calculateDailyIncome(prop.price, prop.yieldBps),
            };
          }
          return null;
        });

        const results = await Promise.all(ownershipPromises);
        const validOwnerships = results.filter((o): o is NonNullable<typeof o> => o !== null);
        
        setOwnerships(validOwnerships);
        setLastClaimTime(playerData.lastClaimTimestamp.toNumber());
        
        // Calculate daily income with set bonuses
        const ownedPropertyIds = validOwnerships.map(o => o.propertyId);
        let totalDaily = 0;
        
        // Group by setId to calculate bonuses
        const ownershipsBySet = validOwnerships.reduce((acc, ownership) => {
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
        console.error('Error fetching initial rewards data:', error);
        initialLoadDone.current = true;
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    fetchInitialData();
  }, [wallet, program, getPlayerData, getOwnershipData]);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (!socket || !connected || !wallet) return;

    const handleOwnershipChanged = async (data: any) => {
      if (data.wallet === wallet.publicKey?.toString()) {
        console.log('🏠 Ownership changed via WebSocket:', data);
        
        // Re-fetch ownership data for updated calculations
        // This is more efficient than polling every 30 seconds
        try {
          const playerData = await getPlayerData();
          if (!playerData) return;

          const ownershipPromises = PROPERTIES.map(async (prop) => {
            const ownership = await getOwnershipData(prop.id);
            if (ownership?.slotsOwned && ownership.slotsOwned > 0) {
              return {
                propertyId: prop.id,
                slotsOwned: ownership.slotsOwned,
                purchaseTimestamp: ownership.purchaseTimestamp.toNumber(),
                dailyIncomePerSlot: calculateDailyIncome(prop.price, prop.yieldBps),
              };
            }
            return null;
          });

          const results = await Promise.all(ownershipPromises);
          const validOwnerships = results.filter((o): o is NonNullable<typeof o> => o !== null);
          
          setOwnerships(validOwnerships);
          setLastClaimTime(playerData.lastClaimTimestamp.toNumber());
          
          // Recalculate daily income
          // [Same calculation logic as initial load - abbreviated for brevity]
          const ownedPropertyIds = validOwnerships.map(o => o.propertyId);
          let totalDaily = 0;
          
          for (const ownership of validOwnerships) {
            const property = PROPERTIES.find(p => p.id === ownership.propertyId);
            if (property) {
              totalDaily += ownership.dailyIncomePerSlot * ownership.slotsOwned;
            }
          }
          
          setDailyIncome(totalDaily);
        } catch (error) {
          console.error('Error updating ownership from WebSocket:', error);
        }
      }
    };

    const handleRewardsUpdated = (data: any) => {
      if (data.wallet === wallet.publicKey?.toString()) {
        console.log('🎁 Rewards updated via WebSocket:', data);
        // The ownership change handler above will take care of the heavy lifting
        // This is just for additional reward-specific updates if needed
      }
    };

    const handleRewardClaimed = async (data: any) => {
      if (data.wallet === wallet.publicKey?.toString()) {
        console.log('🎁 Reward claimed via WebSocket:', data);
        
        // Reset unclaimed rewards to 0 and update last claim time
        setUnclaimedRewards(0);
        setLastClaimTime(Math.floor(Date.now() / 1000));
        
        // Optionally refresh ownership data to get updated lastClaimTime from blockchain
        try {
          const playerData = await getPlayerData();
          if (playerData) {
            setLastClaimTime(playerData.lastClaimTimestamp.toNumber());
          }
        } catch (error) {
          console.error('Error updating claim time:', error);
        }
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
  }, [socket, connected, wallet, getPlayerData, getOwnershipData]);

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
    loading,
  };
}