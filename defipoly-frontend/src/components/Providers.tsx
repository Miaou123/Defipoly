'use client';

import { WalletContextProvider } from "@/components/WalletProvider";
import { NotificationProvider } from "@/components/NotificationProvider";
import { PropertyRefreshProvider } from '@/components/PropertyRefreshContext';

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