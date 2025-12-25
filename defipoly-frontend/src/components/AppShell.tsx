// AppShell.tsx
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Providers } from './Providers';
import { LoadingScreen } from './LoadingScreen';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <Providers>
      {children}
    </Providers>
  );
}