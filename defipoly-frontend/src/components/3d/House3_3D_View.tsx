'use client';

import { View3D } from './SharedCanvas';
import { House3_R3F } from './r3f/House3_R3F';
import { PerspectiveCamera } from '@react-three/drei';

interface House3_3D_ViewProps {
  size?: number;
  isPulsing?: boolean;
}

export function House3_3D_View({ size = 120, isPulsing = false }: House3_3D_ViewProps) {
  return (
    <View3D 
      className="flex items-center justify-center" 
      style={{ width: size, height: size }}
    >
      <PerspectiveCamera makeDefault position={[4, 4, 4]} fov={45} />
      <House3_R3F isPulsing={isPulsing} />
    </View3D>
  );
}