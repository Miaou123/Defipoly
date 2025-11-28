'use client';

import { View3D } from './SharedCanvas';
import { Logo3D_R3F } from './r3f/Logo3D_R3F';
import { PerspectiveCamera } from '@react-three/drei';

interface Logo3D_ViewProps {
  size?: number;
}

// This component replaces the old Logo3D component
export function Logo3D_View({ size = 160 }: Logo3D_ViewProps) {
  return (
    <View3D 
      className="flex items-center justify-center" 
      style={{ width: size, height: size }}
    >
      <PerspectiveCamera makeDefault position={[0, 1.8, 6]} fov={45} />
      <Logo3D_R3F />
    </View3D>
  );
}