'use client';

import { WalletContextProvider } from "@/contexts/WalletContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PropertyRefreshProvider } from '@/contexts/PropertyRefreshContext';
import { StealCooldownProvider } from '@/contexts/StealCooldownContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletContextProvider>
      <NotificationProvider>
        <PropertyRefreshProvider>
          <StealCooldownProvider>
          {children}
          </StealCooldownProvider>
        </PropertyRefreshProvider>
      </NotificationProvider>
    </WalletContextProvider>
  );
}