'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWebSocket } from './WebSocketContext';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101';

// ========== TYPES ==========

export interface PropertyOwnership {
  player: PublicKey;
  propertyId: number;
  slotsOwned: number;
  slotsShielded: number;
  purchaseTimestamp: BN;
  shieldExpiry: BN;
  shieldCooldownDuration: BN;
  stealProtectionExpiry: BN;
  bump: number;
}

export interface SetCooldown {
  setId: number;
  isOnCooldown: boolean;
  lastPurchaseTimestamp: number;
  cooldownDuration: number;
  cooldownRemaining: number;
  lastPurchasedPropertyId: number | null;
  propertiesOwnedInSet: number[];
  propertiesCount: number;
}

export interface StealCooldown {
  propertyId: number;
  isOnCooldown: boolean;
  lastStealAttemptTimestamp: number;
  cooldownDuration: number;
  cooldownRemaining: number;
}

export interface PlayerStats {
  walletAddress: string;
  totalActions: number;
  propertiesBought: number;
  propertiesSold: number;
  successfulSteals: number;
  failedSteals: number;
  rewardsClaimed: number;
  shieldsUsed: number;
  totalSpent: number;
  totalEarned: number;
  totalSlotsOwned: number;
  dailyIncome: number;
  completeSets: number;
  leaderboardScore: number;
  lastActionTime: number | null;
}

export interface ProfileData {
  walletAddress: string;
  username: string | null;
  profilePicture: string | null;
  cornerSquareStyle: 'property' | 'profile';
  boardTheme: string;
  propertyCardTheme: string;
  customBoardBackground: string | null;
  customPropertyCardBackground: string | null;
  updatedAt: number | null;
}

export interface GameState {
  ownerships: PropertyOwnership[];
  cooldowns: {
    sets: SetCooldown[];
    steals: StealCooldown[];
  };
  stats: PlayerStats;
  profile: ProfileData;
}

interface GameStateContextValue extends GameState {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  
  // Ownership helpers
  getOwnership: (propertyId: number) => PropertyOwnership | null;
  hasOwnership: (propertyId: number) => boolean;
  
  // Cooldown helpers
  getSetCooldown: (setId: number) => SetCooldown | null;
  getStealCooldown: (propertyId: number) => StealCooldown | null;
  isSetOnCooldown: (setId: number) => boolean;
  isStealOnCooldown: (propertyId: number) => boolean;
  getSetCooldownRemaining: (setId: number) => number;
  getStealCooldownRemaining: (propertyId: number) => number;
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet();
  const { socket, connected } = useWebSocket();
  
  const [gameState, setGameState] = useState<GameState>({
    ownerships: [],
    cooldowns: { sets: [], steals: [] },
    stats: {
      walletAddress: '',
      totalActions: 0,
      propertiesBought: 0,
      propertiesSold: 0,
      successfulSteals: 0,
      failedSteals: 0,
      rewardsClaimed: 0,
      shieldsUsed: 0,
      totalSpent: 0,
      totalEarned: 0,
      totalSlotsOwned: 0,
      dailyIncome: 0,
      completeSets: 0,
      leaderboardScore: 0,
      lastActionTime: null,
    },
    profile: {
      walletAddress: '',
      username: null,
      profilePicture: null,
      cornerSquareStyle: 'property',
      boardTheme: 'dark',
      propertyCardTheme: 'dark',
      customBoardBackground: null,
      customPropertyCardBackground: null,
      updatedAt: null,
    },
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========== FETCH GAME STATE ==========
  const fetchGameState = useCallback(async () => {
    if (!publicKey) {
      setGameState({
        ownerships: [],
        cooldowns: { sets: [], steals: [] },
        stats: {
          walletAddress: '',
          totalActions: 0,
          propertiesBought: 0,
          propertiesSold: 0,
          successfulSteals: 0,
          failedSteals: 0,
          rewardsClaimed: 0,
          shieldsUsed: 0,
          totalSpent: 0,
          totalEarned: 0,
          totalSlotsOwned: 0,
          dailyIncome: 0,
          completeSets: 0,
          leaderboardScore: 0,
          lastActionTime: null,
        },
        profile: {
          walletAddress: '',
          username: null,
          profilePicture: null,
          cornerSquareStyle: 'property',
          boardTheme: 'dark',
          propertyCardTheme: 'dark',
          customBoardBackground: null,
          customPropertyCardBackground: null,
          updatedAt: null,
        },
      });
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/game-state/${publicKey.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch game state: ${response.statusText}`);
      }

      const result = await response.json();
      const data = result.data;

      // Convert API format to frontend format
      const ownerships: PropertyOwnership[] = data.ownerships.map((o: any) => ({
        player: publicKey,
        propertyId: o.propertyId,
        slotsOwned: o.slotsOwned,
        slotsShielded: o.slotsShielded,
        purchaseTimestamp: new BN(o.purchaseTimestamp),
        shieldExpiry: new BN(o.shieldExpiry),
        shieldCooldownDuration: new BN(o.shieldCooldownDuration),
        stealProtectionExpiry: new BN(o.stealProtectionExpiry),
        bump: o.bump,
      }));

      setGameState({
        ownerships,
        cooldowns: data.cooldowns,
        stats: data.stats,
        profile: data.profile,
      });

      console.log('✅ Game state loaded:', {
        ownerships: ownerships.length,
        setCooldowns: data.cooldowns.sets.length,
        stealCooldowns: data.cooldowns.steals.length,
        profile: data.profile.username || 'No username',
      });

    } catch (err) {
      console.error('Error fetching game state:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch game state');
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  // ========== INITIAL LOAD ==========
  useEffect(() => {
    fetchGameState();
  }, [fetchGameState]);

  // ========== WEBSOCKET UPDATES ==========
  useEffect(() => {
    if (!socket || !connected || !publicKey) return;

    const handleGameStateUpdate = () => {
      console.log('🔄 Game state update received via WebSocket');
      fetchGameState();
    };

    // Listen to all game events
    socket.on('property-bought', handleGameStateUpdate);
    socket.on('property-sold', handleGameStateUpdate);
    socket.on('property-stolen', handleGameStateUpdate);
    socket.on('steal-attempted', handleGameStateUpdate);
    socket.on('steal-failed', handleGameStateUpdate);
    socket.on('property-shielded', handleGameStateUpdate);
    socket.on('rewards-claimed', handleGameStateUpdate);
    socket.on('profile-updated', handleGameStateUpdate);

    return () => {
      socket.off('property-bought', handleGameStateUpdate);
      socket.off('property-sold', handleGameStateUpdate);
      socket.off('property-stolen', handleGameStateUpdate);
      socket.off('steal-attempted', handleGameStateUpdate);
      socket.off('steal-failed', handleGameStateUpdate);
      socket.off('property-shielded', handleGameStateUpdate);
      socket.off('rewards-claimed', handleGameStateUpdate);
      socket.off('profile-updated', handleGameStateUpdate);
    };
  }, [socket, connected, publicKey, fetchGameState]);

  // ========== HELPER FUNCTIONS ==========
  
  const getOwnership = useCallback((propertyId: number): PropertyOwnership | null => {
    return gameState.ownerships.find(o => o.propertyId === propertyId) || null;
  }, [gameState.ownerships]);

  const hasOwnership = useCallback((propertyId: number): boolean => {
    const ownership = getOwnership(propertyId);
    return ownership !== null && ownership.slotsOwned > 0;
  }, [getOwnership]);

  const getSetCooldown = useCallback((setId: number): SetCooldown | null => {
    return gameState.cooldowns.sets.find(c => c.setId === setId) || null;
  }, [gameState.cooldowns.sets]);

  const getStealCooldown = useCallback((propertyId: number): StealCooldown | null => {
    return gameState.cooldowns.steals.find(c => c.propertyId === propertyId) || null;
  }, [gameState.cooldowns.steals]);

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
    <GameStateContext.Provider
      value={{
        ...gameState,
        loading,
        error,
        refresh: fetchGameState,
        getOwnership,
        hasOwnership,
        getSetCooldown,
        getStealCooldown,
        isSetOnCooldown,
        isStealOnCooldown,
        getSetCooldownRemaining,
        getStealCooldownRemaining,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return context;
}