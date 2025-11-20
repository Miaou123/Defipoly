'use client';

import { WalletContextProvider } from "@/contexts/WalletContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PropertyRefreshProvider } from '@/contexts/PropertyRefreshContext';
import { StealCooldownProvider } from '@/contexts/StealCooldownContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { OwnershipProvider } from '@/contexts/OwnershipContext';
import { CooldownProvider } from '@/contexts/CooldownContext';
import { GameStateProvider } from '@/contexts/GameStateContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletContextProvider>
      <NotificationProvider>
        <ThemeProvider>
          <WebSocketProvider>
            <GameStateProvider>
              <PropertyRefreshProvider>
                <StealCooldownProvider>
                  {children}
                </StealCooldownProvider>
              </PropertyRefreshProvider>
            </GameStateProvider>
          </WebSocketProvider>
        </ThemeProvider>
      </NotificationProvider>
    </WalletContextProvider>
  );
}