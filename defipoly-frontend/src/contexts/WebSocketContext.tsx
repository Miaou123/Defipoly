'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

interface WebSocketContextType {
  socket: Socket | null;
  connected: boolean;
  subscribeToProperty: (propertyId: number) => void;
  unsubscribeFromProperty: (propertyId: number) => void;
  subscribedProperties: Set<number>;
  subscribeToWallet: (walletAddress: string) => void;
  unsubscribeFromWallet: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  connected: false,
  subscribeToProperty: () => {},
  unsubscribeFromProperty: () => {},
  subscribedProperties: new Set(),
  subscribeToWallet: () => {},
  unsubscribeFromWallet: () => {}
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [subscribedProperties, setSubscribedProperties] = useState<Set<number>>(new Set());
  const socketRef = useRef<Socket | null>(null);
  const [currentWallet, setCurrentWallet] = useState<string | null>(null);

  // Initialize socket connection (independent of wallet)
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101';
    
    console.log('🔌 Connecting to WebSocket server:', socketUrl);
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setConnected(true);
      
      // Re-subscribe to wallet if we had one
      if (currentWallet) {
        newSocket.emit('subscribe-wallet', currentWallet);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
    });

    return () => {
      console.log('🔌 Cleaning up WebSocket connection');
      newSocket.disconnect();
    };
  }, [currentWallet]);

  // Method to subscribe to wallet events (called from other hooks)
  const subscribeToWallet = useCallback((walletAddress: string) => {
    setCurrentWallet(walletAddress);
    if (socket && connected) {
      console.log('👛 Subscribing to wallet events:', walletAddress);
      socket.emit('subscribe-wallet', walletAddress);
    }
  }, [socket, connected]);

  // Method to unsubscribe from wallet events
  const unsubscribeFromWallet = useCallback(() => {
    setCurrentWallet(null);
    // Note: We don't emit unsubscribe as the backend handles disconnections automatically
  }, []);

  // Property subscription management
  const subscribeToProperty = useCallback((propertyId: number) => {
    if (socket && connected && !subscribedProperties.has(propertyId)) {
      console.log('🏠 Subscribing to property:', propertyId);
      socket.emit('subscribe-property', propertyId);
      setSubscribedProperties(prev => new Set([...prev, propertyId]));
    }
  }, [socket, connected, subscribedProperties]);

  const unsubscribeFromProperty = useCallback((propertyId: number) => {
    if (socket && connected && subscribedProperties.has(propertyId)) {
      console.log('🏠 Unsubscribing from property:', propertyId);
      socket.emit('unsubscribe-property', propertyId);
      setSubscribedProperties(prev => {
        const newSet = new Set(prev);
        newSet.delete(propertyId);
        return newSet;
      });
    }
  }, [socket, connected, subscribedProperties]);

  return (
    <WebSocketContext.Provider 
      value={{
        socket,
        connected,
        subscribeToProperty,
        unsubscribeFromProperty,
        subscribedProperties,
        subscribeToWallet,
        unsubscribeFromWallet
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}