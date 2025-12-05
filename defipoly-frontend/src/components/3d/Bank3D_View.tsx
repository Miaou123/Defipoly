'use client';

import { memo } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import { Bank3D_V2 } from './r3f/Bank3D_R3F';
import { View3D } from './SharedCanvas';

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
    <View3D 
      className="flex items-center justify-center cursor-pointer" 
      style={{ width: size, height: size }}
      {...(onCollect && { onClick: onCollect })}
    >
      <PerspectiveCamera makeDefault position={[0, 5, 40]} fov={45} />
      <Bank3D_V2 
        rewardsAmount={rewardsAmount}
        profilePicture={profilePicture}
      />
    </View3D>
  );
}

export const Bank3D_View = memo(Bank3D_ViewComponent);