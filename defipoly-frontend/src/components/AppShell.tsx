'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Providers } from './Providers';
import { SharedCanvasProvider } from './3d/SharedCanvasClient';
import { LoadingScreen } from './LoadingScreen';  // Add this import

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingScreen />;  // Replace the old loading div
  }

  return (
    <Providers>
      <SharedCanvasProvider>
        {children}
      </SharedCanvasProvider>
    </Providers>
  );
}