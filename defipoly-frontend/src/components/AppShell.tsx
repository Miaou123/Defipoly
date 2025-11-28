'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Providers } from './Providers';
import { SharedCanvasProvider } from './3d/SharedCanvas';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial client render, show nothing
  // This prevents hydration mismatch from browser extensions
  if (!mounted) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-950/50 to-black gap-4">
        <img 
          src="/logo.svg" 
          alt="Defipoly" 
          className="w-24 h-24 object-contain animate-pulse"
        />
        <div className="text-purple-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <Providers>
      <SharedCanvasProvider>
        {children}
      </SharedCanvasProvider>
    </Providers>
  );
}