'use client';

import { View3D } from './SharedCanvas';
import { House4_R3F } from './r3f/House4_R3F';
import { PerspectiveCamera } from '@react-three/drei';

interface House4_3D_ViewProps {
  size?: number;
  isPulsing?: boolean;
}

export function House4_3D_View({ size = 120, isPulsing = false }: House4_3D_ViewProps) {
  return (
    <View3D 
      className="flex items-center justify-center" 
      style={{ width: size, height: size }}
    >
      <PerspectiveCamera makeDefault position={[4, 4.5, 4]} fov={45} />
      <House4_R3F isPulsing={isPulsing} />
    </View3D>
  );
}