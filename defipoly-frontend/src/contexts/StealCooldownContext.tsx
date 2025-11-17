'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePropertyRefresh } from './PropertyRefreshContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101';

interface StealCooldownData {
  isOnCooldown: boolean;
  cooldownRemaining: number;
  lastStealTimestamp: number;
  lastStealPropertyId: number | null;
  lastStealSuccess?: boolean;
  cooldownDuration: number;
  propertyId: number;
}

type StealCooldownMap = Record<number, StealCooldownData>;

interface StealCooldownContextType {
  cooldowns: StealCooldownMap;
  refetchAllCooldowns: () => Promise<void>;
  isLoading: boolean;
}

const StealCooldownContext = createContext<StealCooldownContextType>({
  cooldowns: {},
  refetchAllCooldowns: async () => {},
  isLoading: false,
});

export function StealCooldownProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet();
  const { refreshKey } = usePropertyRefresh();
  const [cooldowns, setCooldowns] = useState<StealCooldownMap>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllCooldowns = async () => {
    if (!publicKey) {
      setCooldowns({});
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/steal-cooldown/${publicKey.toString()}`
      );

      if (!response.ok) {
        console.error('Failed to fetch steal cooldowns');
        return;
      }

      const data = await response.json();
      
      // ✅ FIX: Backend returns { cooldowns: { 11: {...}, 12: {...} } } as an object
      // Convert to map directly - it's already in the right format!
      if (data.cooldowns) {
        if (typeof data.cooldowns === 'object' && !Array.isArray(data.cooldowns)) {
          // Backend returns object keyed by propertyId - use it directly
          setCooldowns(data.cooldowns);
        } else if (Array.isArray(data.cooldowns)) {
          // If it's an array, convert to map
          const cooldownMap: StealCooldownMap = {};
          data.cooldowns.forEach((cooldown: StealCooldownData) => {
            cooldownMap[cooldown.propertyId] = cooldown;
          });
          setCooldowns(cooldownMap);
        }
      } else {
        setCooldowns({});
      }
    } catch (error) {
      console.error('Error fetching steal cooldowns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchAllCooldowns();
  }, [publicKey, refreshKey]);

  // Update countdown every second (client-side only, no API calls)
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldowns((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach((propId) => {
          const key = Number(propId);
          if (updated[key].cooldownRemaining > 0) {
            updated[key] = {
              ...updated[key],
              cooldownRemaining: Math.max(0, updated[key].cooldownRemaining - 1),
            };
            
            if (updated[key].cooldownRemaining === 0) {
              updated[key].isOnCooldown = false;
            }
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <StealCooldownContext.Provider 
      value={{ 
        cooldowns, 
        refetchAllCooldowns: fetchAllCooldowns,
        isLoading 
      }}
    >
      {children}
    </StealCooldownContext.Provider>
  );
}

export function useStealCooldownFromContext(propertyId: number) {
  const { cooldowns, refetchAllCooldowns } = useContext(StealCooldownContext);
  
  const cooldown = cooldowns[propertyId] || {
    isOnCooldown: false,
    cooldownRemaining: 0,
    lastStealTimestamp: 0,
    lastStealPropertyId: null,
    cooldownDuration: 0,
    propertyId,
  };

  return {
    isOnStealCooldown: cooldown.isOnCooldown,
    stealCooldownRemaining: cooldown.cooldownRemaining,
    lastStealPropertyId: cooldown.lastStealPropertyId,
    refetchStealCooldown: refetchAllCooldowns,
  };
}