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

// Replace the WebSocketProvider with this fixed version:

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [subscribedProperties, setSubscribedProperties] = useState<Set<number>>(new Set());
  const socketRef = useRef<Socket | null>(null);
  const currentWalletRef = useRef<string | null>(null);

  // Initialize socket connection ONCE (no dependencies)
  useEffect(() => {
    const socketUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101';
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      
      // Re-subscribe to wallet if we had one
      if (currentWalletRef.current) {
        newSocket.emit('subscribe-wallet', currentWalletRef.current);
      }
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []); // Empty dependency array - initialize only once

  const subscribeToWallet = useCallback((walletAddress: string) => {
    currentWalletRef.current = walletAddress;
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe-wallet', walletAddress);
    }
  }, []);

  const unsubscribeFromWallet = useCallback(() => {
    currentWalletRef.current = null;
  }, []);

  const subscribeToProperty = useCallback((propertyId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe-property', propertyId);
      setSubscribedProperties(prev => new Set([...prev, propertyId]));
    }
  }, []);

  const unsubscribeFromProperty = useCallback((propertyId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe-property', propertyId);
      setSubscribedProperties(prev => {
        const newSet = new Set(prev);
        newSet.delete(propertyId);
        return newSet;
      });
    }
  }, []);

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