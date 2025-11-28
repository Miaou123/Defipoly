'use client';

import { memo } from 'react';
import { LazyView3D } from './LazyView3D';
import { House1_R3F } from './r3f/House1_R3F';
import { PerspectiveCamera } from '@react-three/drei';

interface House1_3D_ViewProps {
  size?: number;
  isPulsing?: boolean;
}

export const House1_3D_View = memo(function House1_3D_View({ size = 120, isPulsing = false }: House1_3D_ViewProps) {
  return (
    <LazyView3D 
      className="flex items-center justify-center" 
      style={{ width: size, height: size }}
    >
      <PerspectiveCamera makeDefault position={[4, 3, 4]} fov={45} />
      <House1_R3F isPulsing={isPulsing} />
    </LazyView3D>
  );
});