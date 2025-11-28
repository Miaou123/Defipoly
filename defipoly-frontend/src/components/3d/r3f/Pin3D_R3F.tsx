'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Pin3D_R3FProps {
  color?: string;
}

// Convert Tailwind color class to hex
function getColorHex(colorClass: string): number {
  const colorMap: { [key: string]: number } = {
    'bg-amber-900': 0x78350f,
    'bg-sky-300': 0x7dd3fc,
    'bg-pink-400': 0xf472b6,
    'bg-orange-500': 0xf97316,
    'bg-red-600': 0xdc2626,
    'bg-yellow-400': 0xfacc15,
    'bg-green-600': 0x16a34a,
    'bg-blue-900': 0x1e3a8a,
  };
  return colorMap[colorClass] || 0x9333ea;
}

export function Pin3D_R3F({ color = 'bg-purple-500' }: Pin3D_R3FProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Gentle floating animation
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(time * 2) * 0.05;
    groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
  });

  const pinColor = getColorHex(color);

  return (
    <group ref={groupRef} scale={0.8}>
      {/* Pin head - sphere */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshStandardMaterial 
          color={pinColor} 
          roughness={0.3} 
          metalness={0.1}
        />
      </mesh>

      {/* Highlight on pin head */}
      <mesh position={[-0.15, 1.4, 0.4]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial 
          color={0xffffff} 
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Pin post - cylinder */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 1.2, 12]} />
        <meshStandardMaterial 
          color={0x9ca3af} 
          roughness={0.4} 
          metalness={0.3}
        />
      </mesh>

      {/* Pin point */}
      <mesh position={[0, -0.5, 0]}>
        <coneGeometry args={[0.12, 0.3, 12]} />
        <meshStandardMaterial 
          color={0x6b7280} 
          roughness={0.3} 
          metalness={0.4}
        />
      </mesh>

      {/* Shadow on ground */}
      <mesh position={[0, -0.64, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 24]} />
        <meshBasicMaterial 
          color={0x000000} 
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  );
}