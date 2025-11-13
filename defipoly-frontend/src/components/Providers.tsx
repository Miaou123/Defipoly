'use client';

import { WalletContextProvider } from "@/contexts/WalletContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PropertyRefreshProvider } from '@/contexts/PropertyRefreshContext';
import { StealCooldownProvider } from '@/contexts/StealCooldownContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletContextProvider>
      <NotificationProvider>
        <ThemeProvider>
          <WebSocketProvider>
            <PropertyRefreshProvider>
              <StealCooldownProvider>
              {children}
              </StealCooldownProvider>
            </PropertyRefreshProvider>
          </WebSocketProvider>
        </ThemeProvider>
      </NotificationProvider>
    </WalletContextProvider>
  );
}