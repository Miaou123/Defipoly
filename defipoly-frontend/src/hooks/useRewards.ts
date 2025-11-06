import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDefipoly } from './useDefipoly';
import { PROPERTIES } from '@/utils/constants';
import { isSetComplete, getMinSlots } from '@/utils/gameHelpers';

// Helper function to calculate daily income from price and yieldBps
const calculateDailyIncome = (price: number, yieldBps: number): number => {
  return Math.floor((price * yieldBps) / 10000);
};

export function useRewards() {
  const { wallet } = useWallet();
  const { getPlayerData, getOwnershipData, program } = useDefipoly();
  
  const [ownerships, setOwnerships] = useState<any[]>([]);
  const [lastClaimTime, setLastClaimTime] = useState<number>(Date.now());
  const [dailyIncome, setDailyIncome] = useState(0);
  const [unclaimedRewards, setUnclaimedRewards] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch from blockchain every 30 seconds
  useEffect(() => {
    if (!wallet || !program) return;

    const fetchData = async () => {
      // Only show loading state on initial load
      if (isInitialLoad) {
        setLoading(true);
      }
      
      try {
        const playerData = await getPlayerData();
        if (!playerData) {
          if (isInitialLoad) {
            setLoading(false);
            setIsInitialLoad(false);
          }
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
      } catch (error) {
        console.error('Error fetching rewards data:', error);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Sync every 30s
    return () => clearInterval(interval);
  }, [wallet, program, getPlayerData, getOwnershipData, isInitialLoad]);

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