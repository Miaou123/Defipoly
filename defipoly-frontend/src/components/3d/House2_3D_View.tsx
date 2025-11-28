'use client';

import { LazyView3D } from './LazyView3D';
import { House2_R3F } from './r3f/House2_R3F';
import { PerspectiveCamera } from '@react-three/drei';

interface House2_3D_ViewProps {
  size?: number;
  isPulsing?: boolean;
}

export function House2_3D_View({ size = 120, isPulsing = false }: House2_3D_ViewProps) {
  return (
    <LazyView3D 
      className="flex items-center justify-center" 
      style={{ width: size, height: size }}
    >
      <PerspectiveCamera makeDefault position={[4, 3, 4]} fov={45} />
      <House2_R3F isPulsing={isPulsing} />
    </LazyView3D>
  );
}