'use client';

import { LazyView3D } from './LazyView3D';
import { House1_R3F } from './r3f/House1_R3F';
import { PerspectiveCamera } from '@react-three/drei';

interface House1_3D_ViewProps {
  size?: number;
  isPulsing?: boolean;
}

// This component replaces the old House1_3D component
// It uses the shared canvas system instead of creating its own WebGL context
export function House1_3D_View({ size = 120, isPulsing = false }: House1_3D_ViewProps) {
  return (
    <LazyView3D 
      className="flex items-center justify-center" 
      style={{ width: size, height: size }}
    >
      <PerspectiveCamera makeDefault position={[4, 3, 4]} fov={45} />
      <House1_R3F isPulsing={isPulsing} />
    </LazyView3D>
  );
}