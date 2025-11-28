'use client';

import { LazyView3D } from './LazyView3D';
import { Bank3D_R3F } from './r3f/Bank3D_R3F';
import { PerspectiveCamera } from '@react-three/drei';

interface Bank3D_ViewProps {
  size?: number;
  isPulsing?: boolean;
  rewardsAmount?: number;
  profilePicture?: string | null;
  onCollect?: () => void;
}

// This component replaces the old Bank3D component
export function Bank3D_View({ 
  size = 350, 
  isPulsing = false,
  rewardsAmount = 0,
  profilePicture = null,
  onCollect 
}: Bank3D_ViewProps) {
  return (
    <LazyView3D 
      className="flex items-center justify-center cursor-pointer" 
      style={{ width: size, height: size }}
      onClick={onCollect}
    >
      <PerspectiveCamera makeDefault position={[0, 12, 60]} fov={45} />
      <Bank3D_R3F 
        isPulsing={isPulsing} 
        rewardsAmount={rewardsAmount}
        profilePicture={profilePicture}
      />
    </LazyView3D>
  );
}