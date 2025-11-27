// ============================================
// FILE: defipoly-frontend/src/contexts/ParticleSpawnContext.tsx
// Syncs particle spawns between IncomeFlowOverlay and PropertyCards
// ============================================

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ParticleSpawnContextType {
  // Map of propertyId -> last spawn timestamp
  lastSpawnTimes: Map<number, number>;
  // Called by IncomeFlowOverlay when spawning a particle
  triggerSpawn: (propertyId: number) => void;
}

const ParticleSpawnContext = createContext<ParticleSpawnContextType | null>(null);

export function ParticleSpawnProvider({ children }: { children: ReactNode }) {
  const [lastSpawnTimes, setLastSpawnTimes] = useState<Map<number, number>>(new Map());

  const triggerSpawn = useCallback((propertyId: number) => {
    setLastSpawnTimes(prev => {
      const next = new Map(prev);
      const timestamp = Date.now();
      next.set(propertyId, timestamp);
      return next;
    });
  }, []);

  return (
    <ParticleSpawnContext.Provider value={{ lastSpawnTimes, triggerSpawn }}>
      {children}
    </ParticleSpawnContext.Provider>
  );
}

export function useParticleSpawn() {
  const context = useContext(ParticleSpawnContext);
  if (!context) {
    // Return no-op if not in provider (e.g., spectator mode)
    return {
      lastSpawnTimes: new Map<number, number>(),
      triggerSpawn: () => {},
    };
  }
  return context;
}

// Hook for PropertyCard to get its last spawn time
export function usePropertySpawnTime(propertyId: number): number {
  const { lastSpawnTimes } = useParticleSpawn();
  return lastSpawnTimes.get(propertyId) || 0;
}