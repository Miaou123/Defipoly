import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDefipoly } from './useDefipoly';

export function useRewards() {
  const { publicKey } = useWallet();
  const { getPlayerData } = useDefipoly();
  const [unclaimedRewards, setUnclaimedRewards] = useState(0);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [dailyIncome, setDailyIncome] = useState(0);
  const [loading, setLoading] = useState(true); // Only true on initial load
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!publicKey) {
      setUnclaimedRewards(0);
      setTotalGenerated(0);
      setDailyIncome(0);
      setLoading(false);
      return;
    }

    const fetchRewards = async () => {
      // Only set loading on initial load, not on updates
      if (initialLoad) {
        setLoading(true);
      }
      
      try {
        const playerData = await getPlayerData();
        
        if (playerData) {
          const now = Math.floor(Date.now() / 1000);
          const lastClaim = playerData.lastClaimTimestamp.toNumber();
          const timeElapsed = now - lastClaim;
          const hoursElapsed = timeElapsed / 3600;
          
          // CRITICAL FIX: Divide by 1e9 to convert from base units to DEFI
          const dailyIncomeValue = playerData.totalDailyIncome.toNumber() / 1e9;
          const hourlyRate = dailyIncomeValue / 24;
          const unclaimed = Math.floor(hourlyRate * hoursElapsed);
          
          setDailyIncome(dailyIncomeValue);
          setUnclaimedRewards(unclaimed);
          setTotalGenerated(unclaimed);
        }
      } catch (error) {
        console.error('Error fetching rewards:', error);
      } finally {
        if (initialLoad) {
          setLoading(false);
          setInitialLoad(false);
        }
      }
    };

    fetchRewards();
    
    // Update every second for live counter effect
    const interval = setInterval(fetchRewards, 1000);
    
    return () => clearInterval(interval);
  }, [publicKey, getPlayerData, initialLoad]);

  return {
    unclaimedRewards,
    totalGenerated,
    dailyIncome,
    loading,
  };
}