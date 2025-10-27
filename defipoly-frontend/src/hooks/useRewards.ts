import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDefipoly } from './useDefipoly';
import { PROPERTIES } from '@/utils/constants';

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
              dailyIncomePerSlot: prop.dailyIncome,
            };
          }
          return null;
        });

        const results = await Promise.all(ownershipPromises);
        const validOwnerships = results.filter((o): o is NonNullable<typeof o> => o !== null);
        
        setOwnerships(validOwnerships);
        setLastClaimTime(playerData.lastClaimTimestamp.toNumber());
        
        const totalDaily = validOwnerships.reduce((sum, o) => 
          sum + (o.dailyIncomePerSlot * o.slotsOwned), 0
        );
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