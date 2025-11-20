'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { 
  fetchAllSetCooldowns, 
  fetchAllStealCooldowns,
  type ApiPlayerSetCooldown,
  type ApiPlayerStealCooldown
} from '@/services/api';

interface CooldownContextValue {
  setCooldowns: ApiPlayerSetCooldown[];
  stealCooldowns: ApiPlayerStealCooldown[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getSetCooldown: (setId: number) => ApiPlayerSetCooldown | null;
  getStealCooldown: (propertyId: number) => ApiPlayerStealCooldown | null;
  isSetOnCooldown: (setId: number) => boolean;
  isStealOnCooldown: (propertyId: number) => boolean;
  getSetCooldownRemaining: (setId: number) => number;
  getStealCooldownRemaining: (propertyId: number) => number;
}

const CooldownContext = createContext<CooldownContextValue | null>(null);

export function CooldownProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet();
  const { socket, connected } = useWebSocket();
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

  // WebSocket auto-refresh
  useEffect(() => {
    if (!socket || !connected || !publicKey) return;

    const handleCooldownUpdate = () => {
      fetchData();
    };

    socket.on('property-bought', handleCooldownUpdate);
    socket.on('property-stolen', handleCooldownUpdate);
    socket.on('steal-attempted', handleCooldownUpdate);
    socket.on('steal-failed', handleCooldownUpdate);

    return () => {
      socket.off('property-bought', handleCooldownUpdate);
      socket.off('property-stolen', handleCooldownUpdate);
      socket.off('steal-attempted', handleCooldownUpdate);
      socket.off('steal-failed', handleCooldownUpdate);
    };
  }, [socket, connected, publicKey, fetchData]);

  const getSetCooldown = useCallback((setId: number): ApiPlayerSetCooldown | null => {
    return setCooldowns.find(c => c.setId === setId) || null;
  }, [setCooldowns]);

  const getStealCooldown = useCallback((propertyId: number): ApiPlayerStealCooldown | null => {
    return stealCooldowns.find(c => c.propertyId === propertyId) || null;
  }, [stealCooldowns]);

  const isSetOnCooldown = useCallback((setId: number): boolean => {
    const cooldown = getSetCooldown(setId);
    return cooldown?.isOnCooldown || false;
  }, [getSetCooldown]);

  const isStealOnCooldown = useCallback((propertyId: number): boolean => {
    const cooldown = getStealCooldown(propertyId);
    return cooldown?.isOnCooldown || false;
  }, [getStealCooldown]);

  const getSetCooldownRemaining = useCallback((setId: number): number => {
    const cooldown = getSetCooldown(setId);
    return cooldown?.cooldownRemaining || 0;
  }, [getSetCooldown]);

  const getStealCooldownRemaining = useCallback((propertyId: number): number => {
    const cooldown = getStealCooldown(propertyId);
    return cooldown?.cooldownRemaining || 0;
  }, [getStealCooldown]);

  return (
    <CooldownContext.Provider value={{
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
    }}>
      {children}
    </CooldownContext.Provider>
  );
}

export function useCooldowns() {
  const context = useContext(CooldownContext);
  if (!context) {
    throw new Error('useCooldowns must be used within CooldownProvider');
  }
  return context;
}