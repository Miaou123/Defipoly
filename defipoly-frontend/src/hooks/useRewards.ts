import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDefipoly } from './useDefipoly';
import { PROPERTIES } from '@/utils/constants';

export function useRewards() {
  const { publicKey, connected } = useWallet();
  const { program, getPlayerData, getOwnershipData, getPropertyData } = useDefipoly();
  const [unclaimedRewards, setUnclaimedRewards] = useState(0);
  const [dailyIncome, setDailyIncome] = useState(0);
  const [loading, setLoading] = useState(false);

  const calculateRewards = useCallback(async () => {
    if (!program || !publicKey || !connected) {
      setUnclaimedRewards(0);
      setDailyIncome(0);
      return;
    }

    setLoading(true);
    try {
      // Get player data for last claim timestamp
      const playerData = await getPlayerData();
      if (!playerData) {
        setUnclaimedRewards(0);
        setDailyIncome(0);
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const lastClaim = playerData.lastClaimTimestamp.toNumber();
      const minutesElapsed = Math.max(0, (now - lastClaim) / 60);

      // ✅ NEW: Calculate daily income by iterating through all properties
      let totalDailyIncome = 0;
      let totalUnclaimedRewards = 0;

      for (const property of PROPERTIES) {
        try {
          // Get ownership data for this property
          const ownershipData = await getOwnershipData(property.id);
          
          if (ownershipData && ownershipData.slotsOwned > 0) {
            // Get on-chain property data for yield %
            const propertyData = await getPropertyData(property.id);
            
            if (propertyData) {
              // Calculate daily income per slot
              // yieldPercentBps is in basis points (e.g., 1000 = 10%)
              const dailyIncomePerSlot = (Number(propertyData.price) * propertyData.yieldPercentBps) / (10000 * 1); // per day
              const incomePerMinute = dailyIncomePerSlot / 1440; // 1440 minutes in a day
              
              // Calculate total income for owned slots
              const propertyDailyIncome = dailyIncomePerSlot * ownershipData.slotsOwned;
              totalDailyIncome += propertyDailyIncome;
              
              // Calculate unclaimed rewards for this property
              const propertyRewards = incomePerMinute * ownershipData.slotsOwned * minutesElapsed;
              totalUnclaimedRewards += propertyRewards;
            }
          }
        } catch (error) {
          console.error(`Error calculating rewards for property ${property.id}:`, error);
          // Continue with other properties
        }
      }

      // Convert from lamports to tokens (assuming 9 decimals)
      setDailyIncome(totalDailyIncome / 1e9);
      setUnclaimedRewards(totalUnclaimedRewards / 1e9);

    } catch (error) {
      console.error('Error calculating rewards:', error);
      setUnclaimedRewards(0);
      setDailyIncome(0);
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, connected, getPlayerData, getOwnershipData, getPropertyData]);

  useEffect(() => {
    calculateRewards();
    
    // Update every 30 seconds
    const interval = setInterval(calculateRewards, 30000);
    return () => clearInterval(interval);
  }, [calculateRewards]);

  return {
    unclaimedRewards,
    dailyIncome,
    loading,
    refresh: calculateRewards,
  };
}