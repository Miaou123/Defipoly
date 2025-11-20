'use client';

import { WalletContextProvider } from "@/contexts/WalletContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PropertyRefreshProvider } from '@/contexts/PropertyRefreshContext';
import { StealCooldownProvider } from '@/contexts/StealCooldownContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { GameStateProvider } from '@/contexts/GameStateContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletContextProvider>
      <NotificationProvider>
          <WebSocketProvider>
            <GameStateProvider>
              <PropertyRefreshProvider>
                <StealCooldownProvider>
                  {children}
                </StealCooldownProvider>
              </PropertyRefreshProvider>
            </GameStateProvider>
          </WebSocketProvider>
      </NotificationProvider>
    </WalletContextProvider>
  );
}