// ============================================
// FILE: defipoly-frontend/src/hooks/useCooldown.ts
// UPDATED: Query blockchain directly, no backend needed
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { usePropertyRefresh } from '@/components/PropertyRefreshContext';
import { PROPERTIES } from '@/utils/constants';
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '@/utils/constants';

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

// Helper to get cooldown PDA
function getSetCooldownPDA(playerPubkey: PublicKey, setId: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('cooldown'), playerPubkey.toBuffer(), Buffer.from([setId])],
    PROGRAM_ID
  );
  return pda;
}

// Helper to get property IDs in a set
function getPropertiesInSet(setId: number): number[] {
  return PROPERTIES.filter(p => p.setId === setId).map(p => p.id);
}

// Deserialize cooldown account data
function deserializeCooldown(data: Buffer): any {
  if (!data || data.length < 64) {
    return null;
  }

  let offset = 8; // Skip discriminator

  // Read player (32 bytes)
  const playerBytes = data.slice(offset, offset + 32);
  offset += 32;

  // Read setId (1 byte)
  const setId = data[offset];
  offset += 1;

  // Read lastPurchaseTimestamp (8 bytes, i64)
  const lastPurchaseTimestamp = data.readBigInt64LE(offset);
  offset += 8;

  // Read cooldownDuration (8 bytes, i64)
  const cooldownDuration = data.readBigInt64LE(offset);
  offset += 8;

  // Read lastPurchasedPropertyId (1 byte)
  const lastPurchasedPropertyId = data[offset];
  offset += 1;

  // Read propertiesOwnedInSet (3 bytes)
  const propertiesOwnedInSet = Array.from(data.slice(offset, offset + 3));
  offset += 3;

  // Read propertiesCount (1 byte)
  const propertiesCount = data[offset];

  return {
    setId,
    lastPurchaseTimestamp: Number(lastPurchaseTimestamp),
    cooldownDuration: Number(cooldownDuration),
    lastPurchasedPropertyId,
    propertiesOwnedInSet: propertiesOwnedInSet.slice(0, propertiesCount),
    propertiesCount
  };
}

export function useCooldown(setId: number) {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { refreshKey } = usePropertyRefresh();
  
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [affectedProperties, setAffectedProperties] = useState<typeof PROPERTIES>([]);

  // Fetch cooldown data from blockchain
  const fetchCooldown = useCallback(async () => {
    if (!connected || !publicKey) {
      setCooldownRemaining(0);
      setIsOnCooldown(false);
      setAffectedProperties([]);
      return;
    }

    const cacheKey = `${publicKey.toString()}-${setId}`;

    try {
      // Get cooldown PDA
      const cooldownPDA = getSetCooldownPDA(publicKey, setId);
      
      // Fetch account from blockchain
      const accountInfo = await connection.getAccountInfo(cooldownPDA);
      
      if (!accountInfo) {
        // No cooldown account exists - no cooldown active
        console.log(`✅ No cooldown for set ${setId}`);
        
        const propsInSet = PROPERTIES.filter(p => p.setId === setId);
        
        const data: CooldownData = {
          isOnCooldown: false,
          cooldownRemaining: 0,
          lastPurchaseTimestamp: 0,
          lastPurchasedPropertyId: null,
          cooldownDuration: 86400, // Default 24 hours
          affectedPropertyIds: getPropertiesInSet(setId),
          setId
        };
        
        cooldownCache.set(cacheKey, data);
        setCooldownRemaining(0);
        setIsOnCooldown(false);
        setAffectedProperties(propsInSet);
        return;
      }

      // Deserialize the account data
      const cooldownData = deserializeCooldown(accountInfo.data);
      
      if (!cooldownData) {
        console.error('Failed to parse cooldown data');
        return;
      }

      // Calculate current remaining time
      const now = Math.floor(Date.now() / 1000);
      const elapsed = cooldownData.lastPurchaseTimestamp 
        ? now - cooldownData.lastPurchaseTimestamp 
        : 0;
      const remaining = Math.max(0, cooldownData.cooldownDuration - elapsed);
      
      // Get property details
      const propsInSet = PROPERTIES.filter(p => p.setId === setId);
      
      // Store in cache
      const data: CooldownData = {
        isOnCooldown: remaining > 0,
        cooldownRemaining: remaining,
        lastPurchaseTimestamp: cooldownData.lastPurchaseTimestamp,
        lastPurchasedPropertyId: cooldownData.lastPurchasedPropertyId,
        cooldownDuration: cooldownData.cooldownDuration,
        affectedPropertyIds: getPropertiesInSet(setId),
        setId
      };
      
      cooldownCache.set(cacheKey, data);
      setCooldownRemaining(remaining);
      setIsOnCooldown(remaining > 0);
      setAffectedProperties(propsInSet);
      
      console.log(`✅ Cooldown fetched for set ${setId}: ${remaining}s remaining (${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m)`);
      
    } catch (error) {
      console.error('Error fetching cooldown from blockchain:', error);
      // Set defaults on error
      setCooldownRemaining(0);
      setIsOnCooldown(false);
    }
  }, [connected, publicKey, setId, connection]);

  // Fetch on mount, wallet change, or property refresh
  useEffect(() => {
    fetchCooldown();
  }, [fetchCooldown, refreshKey]);

  // Client-side countdown (no blockchain calls!)
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
    refresh: fetchCooldown
  };
}

// ============================================
// Hook to fetch ALL cooldowns at once
// Use this on app mount to prime the cache
// ============================================

export function useAllCooldowns() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { refreshKey } = usePropertyRefresh();
  const [loading, setLoading] = useState(false);

  const fetchAllCooldowns = useCallback(async () => {
    if (!connected || !publicKey) return;

    setLoading(true);
    try {
      const cooldowns: CooldownData[] = [];

      // Check all 8 sets
      for (let setId = 0; setId < 8; setId++) {
        const cooldownPDA = getSetCooldownPDA(publicKey, setId);
        const accountInfo = await connection.getAccountInfo(cooldownPDA);

        if (!accountInfo) {
          // No cooldown for this set
          continue;
        }

        const cooldownData = deserializeCooldown(accountInfo.data);
        if (!cooldownData) continue;

        const now = Math.floor(Date.now() / 1000);
        const elapsed = cooldownData.lastPurchaseTimestamp 
          ? now - cooldownData.lastPurchaseTimestamp 
          : 0;
        const remaining = Math.max(0, cooldownData.cooldownDuration - elapsed);

        const data: CooldownData = {
          setId,
          isOnCooldown: remaining > 0,
          cooldownRemaining: remaining,
          lastPurchaseTimestamp: cooldownData.lastPurchaseTimestamp,
          lastPurchasedPropertyId: cooldownData.lastPurchasedPropertyId,
          cooldownDuration: cooldownData.cooldownDuration,
          affectedPropertyIds: getPropertiesInSet(setId)
        };

        // Store in cache
        const cacheKey = `${publicKey.toString()}-${setId}`;
        cooldownCache.set(cacheKey, data);
        
        if (remaining > 0) {
          cooldowns.push(data);
        }
      }

      console.log(`✅ Fetched all cooldowns from blockchain: ${cooldowns.length} active`);
      
    } catch (error) {
      console.error('Error fetching all cooldowns:', error);
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, connection]);

  // Fetch on mount and property refresh
  useEffect(() => {
    fetchAllCooldowns();
  }, [fetchAllCooldowns, refreshKey]);

  return { loading, refresh: fetchAllCooldowns };
}