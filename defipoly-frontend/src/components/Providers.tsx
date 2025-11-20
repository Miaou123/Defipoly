'use client';

import { WalletContextProvider } from "@/contexts/WalletContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { GameStateProvider } from '@/contexts/GameStateContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletContextProvider>
      <NotificationProvider>
          <WebSocketProvider>
            <GameStateProvider>
                  {children}
            </GameStateProvider>
          </WebSocketProvider>
      </NotificationProvider>
    </WalletContextProvider>
  );
}