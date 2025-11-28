'use client';

import dynamic from 'next/dynamic';

// Dynamically import all 3D view components to avoid SSR issues
export const House1_3D_View = dynamic(
  () => import('./House1_3D_View').then(mod => ({ default: mod.House1_3D_View })),
  { 
    ssr: false,
    loading: () => <div style={{ width: '120px', height: '120px' }} />
  }
);

export const House2_3D_View = dynamic(
  () => import('./House2_3D_View').then(mod => ({ default: mod.House2_3D_View })),
  { 
    ssr: false,
    loading: () => <div style={{ width: '120px', height: '120px' }} />
  }
);

export const House3_3D_View = dynamic(
  () => import('./House3_3D_View').then(mod => ({ default: mod.House3_3D_View })),
  { 
    ssr: false,
    loading: () => <div style={{ width: '120px', height: '120px' }} />
  }
);

export const House4_3D_View = dynamic(
  () => import('./House4_3D_View').then(mod => ({ default: mod.House4_3D_View })),
  { 
    ssr: false,
    loading: () => <div style={{ width: '120px', height: '120px' }} />
  }
);

export const House5_3D_View = dynamic(
  () => import('./House5_3D_View').then(mod => ({ default: mod.House5_3D_View })),
  { 
    ssr: false,
    loading: () => <div style={{ width: '120px', height: '120px' }} />
  }
);

export const Bank3D_View = dynamic(
  () => import('./Bank3D_View').then(mod => ({ default: mod.Bank3D_View })),
  { 
    ssr: false,
    loading: () => <div style={{ width: '350px', height: '350px' }} />
  }
);

export const Logo3D_View = dynamic(
  () => import('./Logo3D_View').then(mod => ({ default: mod.Logo3D_View })),
  { 
    ssr: false,
    loading: () => <div style={{ width: '160px', height: '160px' }} />
  }
);