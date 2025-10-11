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

  // Fetch from blockchain every 30 seconds
  useEffect(() => {
    if (!wallet || !program) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const playerData = await getPlayerData();
        if (!playerData) {
          setLoading(false);
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
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Sync every 30s
    return () => clearInterval(interval);
  }, [wallet, program, getPlayerData, getOwnershipData]);

  // Calculate rewards client-side every second
  useEffect(() => {
    if (ownerships.length === 0) {
      setUnclaimedRewards(0);
      return;
    }

    const calculate = () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      let total = 0;

      ownerships.forEach(ownership => {
        // Use later of purchase time or last claim
        const startTime = Math.max(ownership.purchaseTimestamp, lastClaimTime);
        const elapsedSeconds = nowSeconds - startTime;
        
        if (elapsedSeconds > 0) {
          const incomePerSecond = (ownership.dailyIncomePerSlot * ownership.slotsOwned) / 86400;
          total += incomePerSecond * elapsedSeconds;
        }
      });

      setUnclaimedRewards(Math.max(0, total));
    };

    calculate();
    const interval = setInterval(calculate, 1000); // Update every second
    return () => clearInterval(interval);
  }, [ownerships, lastClaimTime]);

  return {
    unclaimedRewards: Math.floor(unclaimedRewards), // Round to 2 decimals
    dailyIncome,
    loading,
  };
}