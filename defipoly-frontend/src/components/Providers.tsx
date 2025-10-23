'use client';

import { WalletContextProvider } from "@/contexts/WalletContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PropertyRefreshProvider } from '@/contexts/PropertyRefreshContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletContextProvider>
      <NotificationProvider>
        <PropertyRefreshProvider>
          {children}
        </PropertyRefreshProvider>
      </NotificationProvider>
    </WalletContextProvider>
  );
}