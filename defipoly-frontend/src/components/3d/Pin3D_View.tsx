'use client';

import { memo } from 'react';
import { LazyView3D } from './LazyView3D';
import { Pin3D_R3F } from './r3f/Pin3D_R3F';
import { PerspectiveCamera } from '@react-three/drei';

interface Pin3D_ViewProps {
  size?: number;
  color?: string;
  inModal?: boolean;
}

function Pin3D_ViewComponent({ 
  size = 80, 
  color = 'bg-purple-500',
  inModal = false 
}: Pin3D_ViewProps) {
  return (
    <LazyView3D 
      className="flex items-center justify-center" 
      style={{ width: size, height: size }}
      inModal={inModal}
    >
      <PerspectiveCamera makeDefault position={inModal ? [0, 1, 4] : [3, 2, 3]} fov={60} lookAt={[0, 0, 0]} />
      <group position={[0, 0, 0]} scale={inModal ? 0.6 : 0.8}>
        <Pin3D_R3F color={color} />
      </group>
    </LazyView3D>
  );
}

export const Pin3D_View = memo(Pin3D_ViewComponent);