'use client';

import { WalletContextProvider } from "@/contexts/WalletContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { GameStateProvider } from '@/contexts/GameStateContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { MobileBlocker } from './MobileBlocker';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MobileBlocker>
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
    </MobileBlocker>
  );
}