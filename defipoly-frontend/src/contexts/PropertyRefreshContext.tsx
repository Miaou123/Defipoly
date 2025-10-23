'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PropertyRefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const PropertyRefreshContext = createContext<PropertyRefreshContextType | undefined>(undefined);

export function PropertyRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    console.log('🔄 Triggered property refresh');
  }, []);

  return (
    <PropertyRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </PropertyRefreshContext.Provider>
  );
}

export function usePropertyRefresh() {
  const context = useContext(PropertyRefreshContext);
  if (!context) {
    throw new Error('usePropertyRefresh must be used within PropertyRefreshProvider');
  }
  return context;
}