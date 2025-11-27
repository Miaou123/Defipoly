'use client';

import { WalletContextProvider } from "@/contexts/WalletContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { GameStateProvider } from '@/contexts/GameStateContext';
import { AuthProvider } from '@/contexts/AuthContext';


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletContextProvider>
      <AuthProvider>
      <NotificationProvider>
          <WebSocketProvider>
            <GameStateProvider>
                  {children}
            </GameStateProvider>
          </WebSocketProvider>
      </NotificationProvider>
      </AuthProvider>
    </WalletContextProvider>
  );
}