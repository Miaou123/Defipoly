'use client';

import { createContext, useContext, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import {
  createHouse1Geometries,
  createHouse2Geometries,
  createHouse3Geometries,
  createHouse4Geometries,
  createHouse5Geometries,
} from './utils/houseGeometries';
import type { HouseGeometries } from './utils/geometryUtils';

interface GeometryCacheType {
  house1: HouseGeometries;
  house2: HouseGeometries;
  house3: HouseGeometries;
  house4: HouseGeometries;
  house5: HouseGeometries;
}

const GeometryCacheContext = createContext<GeometryCacheType | null>(null);

export function GeometryCacheProvider({ children }: { children: React.ReactNode }) {
  const cache = useMemo(() => {
    const geometries = {
      house1: createHouse1Geometries(),
      house2: createHouse2Geometries(),
      house3: createHouse3Geometries(),
      house4: createHouse4Geometries(),
      house5: createHouse5Geometries(),
    };
    
    return geometries;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(cache).forEach(house => {
        house.walls.dispose();
        house.roof.dispose();
        house.trim.dispose();
        house.accents.dispose();
        house.windows?.dispose();
      });
    };
  }, [cache]);

  return (
    <GeometryCacheContext.Provider value={cache}>
      {children}
    </GeometryCacheContext.Provider>
  );
}

export function useGeometryCache(): GeometryCacheType {
  const cache = useContext(GeometryCacheContext);
  if (!cache) {
    throw new Error('useGeometryCache must be used within GeometryCacheProvider');
  }
  return cache;
}