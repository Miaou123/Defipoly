// ============================================
// FILE: defipoly-frontend/src/hooks/useCooldown.ts
// UPDATED: Query blockchain directly with correct duration display
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

// Get the expected cooldown duration for each set (in hours)
function getCooldownDurationForSet(setId: number): number {
  const cooldownHours = [1, 2, 4, 4, 5, 6, 7, 24]; // Set 0-7
  return cooldownHours[setId] || 24;
}

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
  try {
    // Account structure:
    // - 8 bytes: discriminator
    // - 32 bytes: player pubkey
    // - 1 byte: set_id
    // - 8 bytes: last_purchase_timestamp (i64)
    // - 8 bytes: cooldown_duration (i64)
    // - 1 byte: last_purchased_property_id
    // - 3 bytes: properties_owned_in_set array
    // - 1 byte: properties_count
    // - 1 byte: bump
    // Total: 8 + 32 + 1 + 8 + 8 + 1 + 3 + 1 + 1 = 63 bytes
    
    const expectedSize = 63;
    
    if (!data || data.length < expectedSize) {
      console.error(`Invalid cooldown data size: ${data?.length} bytes (expected ${expectedSize})`);
      return null;
    }

    console.log(`📦 Deserializing cooldown account (${data.length} bytes)`);
    
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
    offset += 1;

    // Read bump (1 byte)
    const bump = data[offset];

    const result = {
      setId,
      lastPurchaseTimestamp: Number(lastPurchaseTimestamp),
      cooldownDuration: Number(cooldownDuration),
      lastPurchasedPropertyId,
      propertiesOwnedInSet: propertiesOwnedInSet.slice(0, propertiesCount),
      propertiesCount,
      bump
    };

    console.log('✅ Deserialized cooldown:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error deserializing cooldown:', error);
    console.error('Data length:', data?.length);
    console.error('Data hex:', data?.toString('hex'));
    return null;
  }
}

export function useCooldown(setId: number) {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { refreshKey } = usePropertyRefresh();
  
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [affectedProperties, setAffectedProperties] = useState<typeof PROPERTIES>([]);
  const [cooldownDurationHours, setCooldownDurationHours] = useState<number>(getCooldownDurationForSet(setId));
  const [lastPurchasedPropertyId, setLastPurchasedPropertyId] = useState<number | null>(null);

  // Fetch cooldown data from blockchain
  const fetchCooldown = useCallback(async () => {
    if (!connected || !publicKey) {
      setCooldownRemaining(0);
      setIsOnCooldown(false);
      setAffectedProperties([]);
      setCooldownDurationHours(getCooldownDurationForSet(setId));
      setLastPurchasedPropertyId(null); // FIXED: Set to null, not data.lastPurchasedPropertyId
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
        console.log(`✅ No cooldown account for set ${setId}`);
        
        const propsInSet = PROPERTIES.filter(p => p.setId === setId);
        const expectedDuration = getCooldownDurationForSet(setId);
        
        const data: CooldownData = {
          isOnCooldown: false,
          cooldownRemaining: 0,
          lastPurchaseTimestamp: 0,
          lastPurchasedPropertyId: null,
          cooldownDuration: expectedDuration * 3600, // Convert hours to seconds
          affectedPropertyIds: getPropertiesInSet(setId),
          setId
        };
        
        cooldownCache.set(cacheKey, data);
        setCooldownRemaining(0);
        setIsOnCooldown(false);
        setAffectedProperties(propsInSet);
        setCooldownDurationHours(expectedDuration);
        setLastPurchasedPropertyId(null);
        return;
      }

      // Deserialize the account data
      const cooldownData = deserializeCooldown(accountInfo.data);
      
      if (!cooldownData) {
        console.error('❌ Failed to parse cooldown data for set', setId);
        setCooldownDurationHours(getCooldownDurationForSet(setId));
        setLastPurchasedPropertyId(null);
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
      
      // Calculate duration in hours
      const expectedDurationHours = getCooldownDurationForSet(setId);
      
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
      setCooldownDurationHours(expectedDurationHours);
      setLastPurchasedPropertyId(cooldownData.lastPurchasedPropertyId); // FIXED: Added this line
      
      const hours = Math.floor(remaining / 3600);
      const mins = Math.floor((remaining % 3600) / 60);
      console.log(`✅ Set ${setId} cooldown: ${remaining > 0 ? `${hours}h ${mins}m remaining` : 'READY'} (Total duration: ${expectedDurationHours}h, Last property: ${cooldownData.lastPurchasedPropertyId})`);
      
    } catch (error) {
      console.error('❌ Error fetching cooldown from blockchain:', error);
      // Set defaults on error
      setCooldownRemaining(0);
      setIsOnCooldown(false);
      setCooldownDurationHours(getCooldownDurationForSet(setId));
      setLastPurchasedPropertyId(null);
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
    cooldownHours: Math.ceil(cooldownRemaining / 3600), // Time remaining in hours
    cooldownDurationHours, // Total cooldown duration for this set
    lastPurchasedPropertyId, // FIXED: Added to return object
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