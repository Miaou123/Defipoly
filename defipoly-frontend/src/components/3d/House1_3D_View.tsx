'use client';

import { memo } from 'react';
import { LazyView3D } from './LazyView3D';
import { House1_R3F } from './r3f/House1_R3F';
import { PerspectiveCamera } from '@react-three/drei';

interface House1_3D_ViewProps {
  size?: number;
  inModal?: boolean;
}

export const House1_3D_View = memo(function House1_3D_View({ 
  size = 120, 
  inModal = false 
}: House1_3D_ViewProps) {
  return (
    <LazyView3D 
      className="flex items-center justify-center" 
      style={{ width: size, height: size }}
      inModal={inModal}
    >
      <PerspectiveCamera makeDefault position={[3, 2, 3]} fov={60} lookAt={[3, 1.5, 0]} />
      <group position={[3, 1.5, 0]} scale={0.3}>
        <House1_R3F />
      </group>
    </LazyView3D>
  );
});