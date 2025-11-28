'use client';

import dynamic from 'next/dynamic';

// Dynamically import the SharedCanvasProvider to avoid SSR issues
export const SharedCanvasProvider = dynamic(
  () => import('./SharedCanvas').then(mod => mod.SharedCanvasProvider),
  { 
    ssr: false,
    loading: () => null
  }
);