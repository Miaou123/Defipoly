'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface House4_R3FProps {
  isPulsing?: boolean;
}

export function House4_R3F({ isPulsing = false }: House4_R3FProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef({ current: 1, target: 1 });

  useFrame(() => {
    if (!groupRef.current) return;
    
    scaleRef.current.target = isPulsing ? 1.15 : 1;
    scaleRef.current.current += (scaleRef.current.target - scaleRef.current.current) * 0.15;
    groupRef.current.scale.setScalar(scaleRef.current.current);
    
    groupRef.current.rotation.y = Math.sin(Date.now() * 0.0003) * 0.15 + 0.4;
  });

  // 5-story office building
  const buildingWidth = 2.8;
  const buildingHeight = 4.5;
  const buildingDepth = 2.5;
  
  return (
    <group ref={groupRef} position={[0, 0.5, 0]} scale={0.5}>
      {/* Base/Ground */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[buildingWidth + 0.8, 0.15, buildingDepth + 0.8]} />
        <meshStandardMaterial color={0x4a7c4e} roughness={0.9} />
      </mesh>

      {/* Main building body */}
      <mesh position={[0, buildingHeight / 2, 0]}>
        <boxGeometry args={[buildingWidth, buildingHeight, buildingDepth]} />
        <meshStandardMaterial color={0xB8B8B8} roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Rooftop structure */}
      <mesh position={[0, buildingHeight + 0.2, 0]}>
        <boxGeometry args={[buildingWidth + 0.2, 0.4, buildingDepth + 0.2]} />
        <meshStandardMaterial color={0x808080} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Windows - 5 floors, 4 columns each */}
      {([0, 1, 2, 3, 4] as number[]).map(floor => 
        ([-0.8, -0.3, 0.3, 0.8] as number[]).map((x, col) => (
          <group key={`${floor}-${col}`} position={[x, 0.6 + floor * 0.8, buildingDepth / 2 + 0.05]}>
            <mesh position={[0, 0, -0.02]}>
              <boxGeometry args={[0.25, 0.25, 0.04]} />
              <meshStandardMaterial color={0x4a3520} roughness={0.6} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.2, 0.2, 0.08]} />
              <meshStandardMaterial 
                color={0xFFFFCC} 
                roughness={0.1} 
                metalness={0.0} 
                emissive={0xFFFF99}
                emissiveIntensity={0.2}
              />
            </mesh>
          </group>
        ))
      )}

      {/* Main entrance - modern glass doors */}
      <mesh position={[0, 0.8, buildingDepth / 2 + 0.05]}>
        <boxGeometry args={[1.0, 1.6, 0.1]} />
        <meshStandardMaterial color={0x404040} roughness={0.2} metalness={0.4} />
      </mesh>
      
      {/* Glass panels in door */}
      <mesh position={[-0.2, 0.8, buildingDepth / 2 + 0.1]}>
        <boxGeometry args={[0.15, 1.2, 0.02]} />
        <meshStandardMaterial color={0xCCFFFF} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.2, 0.8, buildingDepth / 2 + 0.1]}>
        <boxGeometry args={[0.15, 1.2, 0.02]} />
        <meshStandardMaterial color={0xCCFFFF} transparent opacity={0.7} />
      </mesh>

      {/* Door handles */}
      <mesh position={[-0.1, 0.8, buildingDepth / 2 + 0.15]}>
        <cylinderGeometry args={[0.02, 0.02, 0.15]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[0.1, 0.8, buildingDepth / 2 + 0.15]}>
        <cylinderGeometry args={[0.02, 0.02, 0.15]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Building entrance canopy */}
      <mesh position={[0, 1.8, buildingDepth / 2 + 0.25]}>
        <boxGeometry args={[1.5, 0.05, 0.3]} />
        <meshStandardMaterial color={0xA0A0A0} roughness={0.3} metalness={0.2} />
      </mesh>
    </group>
  );
}