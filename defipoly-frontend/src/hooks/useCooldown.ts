// ============================================
// FILE: defipoly-frontend/src/hooks/useCooldown.ts
// OPTIMIZED: Fetch once, calculate client-side
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePropertyRefresh } from '@/components/PropertyRefreshContext';
import { PROPERTIES } from '@/utils/constants';

const API_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3005';

interface CooldownData {
  isOnCooldown: boolean;
  cooldownRemaining: number;
  lastPurchaseTimestamp: number;
  lastPurchasedPropertyId: number | null;
  cooldownDuration: number;
  affectedPropertyIds: number[];
  setId: number;
}

// Store cooldown data in memory (shared across all hook instances)
const cooldownCache = new Map<string, CooldownData>();

export function useCooldown(setId: number) {
  const { connected, publicKey } = useWallet();
  const { refreshKey } = usePropertyRefresh(); // Listen for property refreshes
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [affectedProperties, setAffectedProperties] = useState<typeof PROPERTIES>([]);

  // Fetch cooldown data from backend (only when needed)
  const fetchCooldown = useCallback(async () => {
    if (!connected || !publicKey) {
      setCooldownRemaining(0);
      setIsOnCooldown(false);
      setAffectedProperties([]);
      return;
    }

    const cacheKey = `${publicKey.toString()}-${setId}`;

    try {
      const response = await fetch(`${API_URL}/api/cooldown/${publicKey.toString()}/${setId}`);
      
      if (!response.ok) {
        console.error('Failed to fetch cooldown:', response.statusText);
        return;
      }

      const data: CooldownData = await response.json();
      
      // Store in cache
      cooldownCache.set(cacheKey, data);
      
      // Calculate current remaining time
      const now = Math.floor(Date.now() / 1000);
      const elapsed = data.lastPurchaseTimestamp ? now - data.lastPurchaseTimestamp : 0;
      const remaining = Math.max(0, data.cooldownDuration - elapsed);
      
      setCooldownRemaining(remaining);
      setIsOnCooldown(remaining > 0);
      
      // Get property details
      const propsInSet = PROPERTIES.filter(p => 
        data.affectedPropertyIds.includes(p.id)
      );
      setAffectedProperties(propsInSet);
      
      console.log(`✅ Cooldown fetched for set ${setId}: ${remaining}s remaining`);
    } catch (error) {
      console.error('Error fetching cooldown:', error);
    }
  }, [connected, publicKey, setId]);

  // Fetch on mount, wallet change, or property refresh
  useEffect(() => {
    fetchCooldown();
  }, [fetchCooldown, refreshKey]); // refreshKey triggers re-fetch on property purchase

  // Client-side countdown (no API calls!)
  useEffect(() => {
    if (!connected || cooldownRemaining <= 0) {
      return;
    }

    // Update countdown every second
    const interval = setInterval(() => {
      setCooldownRemaining(prev => {
        const newRemaining = Math.max(0, prev - 1);
        setIsOnCooldown(newRemaining > 0);
        return newRemaining;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [connected, cooldownRemaining]);

  return { 
    cooldownRemaining, 
    isOnCooldown, 
    affectedProperties,
    cooldownHours: Math.ceil(cooldownRemaining / 3600),
    refresh: fetchCooldown // Allow manual refresh if needed
  };
}

// ============================================
// BONUS: Hook to fetch ALL cooldowns at once
// Use this on app mount to prime the cache
// ============================================

export function useAllCooldowns() {
  const { connected, publicKey } = useWallet();
  const { refreshKey } = usePropertyRefresh();
  const [loading, setLoading] = useState(false);

  const fetchAllCooldowns = useCallback(async () => {
    if (!connected || !publicKey) return;

    setLoading(true);
    try {
      // Single API call for ALL sets
      const response = await fetch(`${API_URL}/api/cooldown/${publicKey.toString()}`);
      
      if (!response.ok) {
        console.error('Failed to fetch cooldowns');
        return;
      }

      const { cooldowns } = await response.json();
      
      // Store all in cache
      cooldowns.forEach((cooldown: CooldownData) => {
        const cacheKey = `${publicKey.toString()}-${cooldown.setId}`;
        cooldownCache.set(cacheKey, cooldown);
      });

      console.log(`✅ Fetched all cooldowns: ${cooldowns.length} active`);
    } catch (error) {
      console.error('Error fetching all cooldowns:', error);
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey]);

  // Fetch on mount and property refresh
  useEffect(() => {
    fetchAllCooldowns();
  }, [fetchAllCooldowns, refreshKey]);

  return { loading, refresh: fetchAllCooldowns };
}