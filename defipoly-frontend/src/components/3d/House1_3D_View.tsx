'use client';

import { memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { House1_R3F } from './r3f/House1_R3F';

interface House1_3D_ViewProps {
  size?: number;
  isPulsing?: boolean;
}

export const House1_3D_View = memo(function House1_3D_View({ size = 120, isPulsing = false }: House1_3D_ViewProps) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas
        frameloop="always"
        flat
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [4, 3, 4], fov: 50, near: 0.1 }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 7]} intensity={1.0} />
        <group scale={0.5} position={[0, -0.2, 0]}>
          <House1_R3F isPulsing={isPulsing} />
        </group>
      </Canvas>
    </div>
  );
});