'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useWebSocket } from './WebSocketContext';

interface PropertyRefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
  propertyUpdates: Map<number, number>; // propertyId -> updateCount
}

const PropertyRefreshContext = createContext<PropertyRefreshContextType | undefined>(undefined);

export function PropertyRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [propertyUpdates, setPropertyUpdates] = useState<Map<number, number>>(new Map());
  const { socket, connected } = useWebSocket();

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    console.log('🔄 Triggered property refresh');
  }, []);

  // Listen to WebSocket events for property updates
  useEffect(() => {
    if (!socket || !connected) return;

    const handlePropertyUpdate = (data: any) => {
      // Update the specific property's update count
      if (data.propertyId !== undefined) {
        setPropertyUpdates(prev => {
          const newMap = new Map(prev);
          newMap.set(data.propertyId, (newMap.get(data.propertyId) || 0) + 1);
          return newMap;
        });
      }
      
      // Also trigger general refresh
      triggerRefresh();
    };

    // Listen to all property-related events
    socket.on('property-bought', handlePropertyUpdate);
    socket.on('property-sold', handlePropertyUpdate);
    socket.on('property-stolen', handlePropertyUpdate);
    socket.on('property-shielded', handlePropertyUpdate);
    socket.on('steal-failed', handlePropertyUpdate);
    socket.on('steal-attempted', handlePropertyUpdate);

    return () => {
      socket.off('property-bought', handlePropertyUpdate);
      socket.off('property-sold', handlePropertyUpdate);
      socket.off('property-stolen', handlePropertyUpdate);
      socket.off('property-shielded', handlePropertyUpdate);
      socket.off('steal-failed', handlePropertyUpdate);
      socket.off('steal-attempted', handlePropertyUpdate);
    };
  }, [socket, connected, triggerRefresh]);

  return (
    <PropertyRefreshContext.Provider value={{ refreshKey, triggerRefresh, propertyUpdates }}>
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