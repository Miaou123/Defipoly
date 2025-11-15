// ============================================
// FILE: src/hooks/useCooldowns.ts
// Hook for fetching cooldown data from backend API
// Replaces blockchain deserialization and computation
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  fetchAllSetCooldowns, 
  fetchSetCooldown,
  fetchAllStealCooldowns,
  fetchStealCooldown,
  type ApiPlayerSetCooldown,
  type ApiPlayerStealCooldown
} from '@/services/api';

interface UseCooldownsReturn {
  setCooldowns: ApiPlayerSetCooldown[];
  stealCooldowns: ApiPlayerStealCooldown[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getSetCooldown: (setId: number) => ApiPlayerSetCooldown | null;
  getStealCooldown: (propertyId: number) => ApiPlayerStealCooldown | null;
  isSetOnCooldown: (setId: number) => boolean;
  isStealOnCooldown: (propertyId: number) => boolean;
  getSetCooldownRemaining: (setId: number) => number; // seconds remaining
  getStealCooldownRemaining: (propertyId: number) => number; // seconds remaining
}

export function useCooldowns(): UseCooldownsReturn {
  const { publicKey } = useWallet();
  const [setCooldowns, setSetCooldowns] = useState<ApiPlayerSetCooldown[]>([]);
  const [stealCooldowns, setStealCooldowns] = useState<ApiPlayerStealCooldown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!publicKey) {
      setSetCooldowns([]);
      setStealCooldowns([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [sets, steals] = await Promise.all([
        fetchAllSetCooldowns(publicKey.toString()),
        fetchAllStealCooldowns(publicKey.toString())
      ]);

      setSetCooldowns(sets);
      setStealCooldowns(steals);
    } catch (err) {
      console.error('Error fetching cooldown data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cooldown data');
      setSetCooldowns([]);
      setStealCooldowns([]);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getSetCooldown = useCallback((setId: number): ApiPlayerSetCooldown | null => {
    return setCooldowns.find(c => c.set_id === setId) || null;
  }, [setCooldowns]);

  const getStealCooldown = useCallback((propertyId: number): ApiPlayerStealCooldown | null => {
    return stealCooldowns.find(c => c.property_id === propertyId) || null;
  }, [stealCooldowns]);

  const isSetOnCooldown = useCallback((setId: number): boolean => {
    const cooldown = getSetCooldown(setId);
    if (!cooldown) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    const cooldownEnd = cooldown.last_purchase_timestamp + cooldown.cooldown_duration;
    return currentTime < cooldownEnd;
  }, [getSetCooldown]);

  const isStealOnCooldown = useCallback((propertyId: number): boolean => {
    const cooldown = getStealCooldown(propertyId);
    if (!cooldown) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    const cooldownEnd = cooldown.last_steal_timestamp + cooldown.cooldown_duration;
    return currentTime < cooldownEnd;
  }, [getStealCooldown]);

  const getSetCooldownRemaining = useCallback((setId: number): number => {
    const cooldown = getSetCooldown(setId);
    if (!cooldown) return 0;

    const currentTime = Math.floor(Date.now() / 1000);
    const cooldownEnd = cooldown.last_purchase_timestamp + cooldown.cooldown_duration;
    return Math.max(0, cooldownEnd - currentTime);
  }, [getSetCooldown]);

  const getStealCooldownRemaining = useCallback((propertyId: number): number => {
    const cooldown = getStealCooldown(propertyId);
    if (!cooldown) return 0;

    const currentTime = Math.floor(Date.now() / 1000);
    const cooldownEnd = cooldown.last_steal_timestamp + cooldown.cooldown_duration;
    return Math.max(0, cooldownEnd - currentTime);
  }, [getStealCooldown]);

  return {
    setCooldowns,
    stealCooldowns,
    loading,
    error,
    refresh: fetchData,
    getSetCooldown,
    getStealCooldown,
    isSetOnCooldown,
    isStealOnCooldown,
    getSetCooldownRemaining,
    getStealCooldownRemaining,
  };
}

// ========== Individual fetchers for specific use cases ==========

export async function fetchSetCooldownData(wallet: string, setId: number) {
  return await fetchSetCooldown(wallet, setId);
}

export async function fetchStealCooldownData(wallet: string, propertyId: number) {
  return await fetchStealCooldown(wallet, propertyId);
}