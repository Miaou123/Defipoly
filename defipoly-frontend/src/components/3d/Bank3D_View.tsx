'use client';

import { memo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Bank3D_V2 } from './r3f/Bank3D_R3F';

// Lighting for inline canvas
function BankLighting() {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 10, 7]} intensity={1.5} />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#ffeedd" />
      <directionalLight position={[0, -5, 5]} intensity={0.3} />
    </>
  );
}

interface Bank3D_ViewProps {
  size?: number;
  isPulsing?: boolean;
  rewardsAmount?: number;
  profilePicture?: string | null;
  onCollect?: () => void;
}

function Bank3D_ViewComponent({ 
  size = 350, 
  isPulsing = false,
  rewardsAmount = 0,
  profilePicture = null,
  onCollect 
}: Bank3D_ViewProps) {
  return (
    <div 
      className="flex items-center justify-center cursor-pointer" 
      style={{ width: size, height: size }}
      onClick={onCollect}
    >
      <Canvas
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
        flat
      >
        <BankLighting />
        <PerspectiveCamera makeDefault position={[0, 5, 40]} fov={45} />
        <Suspense fallback={null}>
          <Bank3D_V2 
            rewardsAmount={rewardsAmount}
            profilePicture={profilePicture}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export const Bank3D_View = memo(Bank3D_ViewComponent);