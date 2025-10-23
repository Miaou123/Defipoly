import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePropertyRefresh } from '@/contexts/PropertyRefreshContext';

const API_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3001';

interface StealCooldownData {
  isOnCooldown: boolean;
  cooldownRemaining: number;
  lastStealTimestamp: number;
  lastStealPropertyId: number | null;
  lastStealSuccess?: boolean;
  cooldownDuration: number;
  affectedPropertyIds: number[];
  setId: number;
}

export function useStealCooldown(propertyId: number) {
  const { publicKey } = useWallet();
  const { refreshKey } = usePropertyRefresh();
  
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [lastStealPropertyId, setLastStealPropertyId] = useState<number | null>(null);

  const fetchStealCooldown = useCallback(async () => {
    if (!publicKey) {
      setCooldownRemaining(0);
      setIsOnCooldown(false);
      setLastStealPropertyId(null);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/steal-cooldown/${publicKey.toString()}/${propertyId}`
      );

      if (!response.ok) {
        console.error('Failed to fetch steal cooldown');
        return;
      }

      const data: StealCooldownData = await response.json();
      
      setCooldownRemaining(data.cooldownRemaining);
      setIsOnCooldown(data.isOnCooldown);
      setLastStealPropertyId(data.lastStealPropertyId);
      
    } catch (error) {
      console.error('Error fetching steal cooldown:', error);
    }
  }, [publicKey, propertyId]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchStealCooldown();
  }, [fetchStealCooldown, refreshKey]);

  // Update countdown every second
  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const interval = setInterval(() => {
      setCooldownRemaining(prev => {
        const newValue = Math.max(0, prev - 1);
        if (newValue === 0) {
          setIsOnCooldown(false);
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  return {
    isOnStealCooldown: isOnCooldown,
    stealCooldownRemaining: cooldownRemaining,
    lastStealPropertyId,
    refetchStealCooldown: fetchStealCooldown
  };
}