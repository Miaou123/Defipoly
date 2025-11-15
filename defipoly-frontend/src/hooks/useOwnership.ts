// ============================================
// FILE: src/hooks/useOwnership.ts
// Hook for fetching ownership data from backend API
// Replaces direct blockchain RPC calls
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchOwnershipData, fetchSingleOwnership, convertApiOwnershipToFrontend } from '@/services/api';
import type { PropertyOwnership } from '@/types/accounts';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

interface UseOwnershipReturn {
  ownerships: PropertyOwnership[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getOwnership: (propertyId: number) => PropertyOwnership | null;
}

export function useOwnership(): UseOwnershipReturn {
  const { publicKey } = useWallet();
  const [ownerships, setOwnerships] = useState<PropertyOwnership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!publicKey) {
      setOwnerships([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiOwnerships = await fetchOwnershipData(publicKey.toString());
      
      // Convert API format to frontend PropertyOwnership format
      const converted: PropertyOwnership[] = apiOwnerships.map(apiOwn => ({
        player: new PublicKey(apiOwn.wallet_address),
        propertyId: apiOwn.property_id,
        slotsOwned: apiOwn.slots_owned,
        slotsShielded: apiOwn.slots_shielded,
        purchaseTimestamp: new BN(apiOwn.purchase_timestamp),
        shieldExpiry: new BN(apiOwn.shield_expiry),
        shieldCooldownDuration: new BN(apiOwn.shield_cooldown_duration),
        stealProtectionExpiry: new BN(apiOwn.steal_protection_expiry),
        bump: apiOwn.bump,
      }));

      setOwnerships(converted);
    } catch (err) {
      console.error('Error fetching ownership data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch ownership data');
      setOwnerships([]);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  // Fetch on mount and when wallet changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getOwnership = useCallback((propertyId: number): PropertyOwnership | null => {
    return ownerships.find(o => o.propertyId === propertyId) || null;
  }, [ownerships]);

  return {
    ownerships,
    loading,
    error,
    refresh: fetchData,
    getOwnership,
  };
}

// ========== Single ownership fetcher ==========
export async function fetchOwnershipForProperty(
  wallet: string, 
  propertyId: number
): Promise<PropertyOwnership | null> {
  const apiOwnership = await fetchSingleOwnership(wallet, propertyId);
  
  if (!apiOwnership) return null;

  return {
    player: new PublicKey(apiOwnership.wallet_address),
    propertyId: apiOwnership.property_id,
    slotsOwned: apiOwnership.slots_owned,
    slotsShielded: apiOwnership.slots_shielded,
    purchaseTimestamp: new BN(apiOwnership.purchase_timestamp),
    shieldExpiry: new BN(apiOwnership.shield_expiry),
    shieldCooldownDuration: new BN(apiOwnership.shield_cooldown_duration),
    stealProtectionExpiry: new BN(apiOwnership.steal_protection_expiry),
    bump: apiOwnership.bump,
  };
}