'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchOwnershipData } from '@/services/api';
import type { PropertyOwnership } from '@/types/accounts';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

interface OwnershipContextValue {
  ownerships: PropertyOwnership[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getOwnership: (propertyId: number) => PropertyOwnership | null;
}

const OwnershipContext = createContext<OwnershipContextValue | null>(null);

export function OwnershipProvider({ children }: { children: React.ReactNode }) {
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
      
      const converted: PropertyOwnership[] = apiOwnerships.map(apiOwn => ({
        player: publicKey,
        propertyId: apiOwn.propertyId,
        slotsOwned: apiOwn.slotsOwned,
        slotsShielded: apiOwn.slotsShielded,
        purchaseTimestamp: new BN(apiOwn.purchaseTimestamp),
        shieldExpiry: new BN(apiOwn.shieldExpiry),
        shieldCooldownDuration: new BN(apiOwn.shieldCooldownDuration),
        stealProtectionExpiry: new BN(apiOwn.stealProtectionExpiry),
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getOwnership = useCallback((propertyId: number): PropertyOwnership | null => {
    return ownerships.find(o => o.propertyId === propertyId) || null;
  }, [ownerships]);

  return (
    <OwnershipContext.Provider value={{ ownerships, loading, error, refresh: fetchData, getOwnership }}>
      {children}
    </OwnershipContext.Provider>
  );
}

export function useOwnership() {
  const context = useContext(OwnershipContext);
  if (!context) {
    throw new Error('useOwnership must be used within OwnershipProvider');
  }
  return context;
}