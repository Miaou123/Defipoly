'use client';

import { useRef } from 'react';
import * as THREE from 'three';

interface House5_R3FProps {}

export function House5_R3F({}: House5_R3FProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Luxury hotel skyscraper
  const buildingWidth = 3.2;
  const buildingHeight = 5.5;
  const buildingDepth = 3.0;
  
  return (
    <group ref={groupRef} position={[0, 0.55, 0]} scale={0.45}>
      {/* Base/Ground */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[buildingWidth + 1.0, 0.2, buildingDepth + 1.0]} />
        <meshStandardMaterial color={0x4a7c4e} roughness={0.9} />
      </mesh>

      {/* Main building body */}
      <mesh position={[0, buildingHeight / 2, 0]}>
        <boxGeometry args={[buildingWidth, buildingHeight, buildingDepth]} />
        <meshStandardMaterial color={0xE8E8E8} roughness={0.2} metalness={0.3} />
      </mesh>

      {/* Gold roof accent */}
      <mesh position={[0, buildingHeight + 0.25, 0]}>
        <boxGeometry args={[buildingWidth + 0.3, 0.5, buildingDepth + 0.3]} />
        <meshStandardMaterial color={0xFFD700} roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Windows - 4 columns × 6 rows for luxury feel */}
      {([0, 1, 2, 3, 4, 5] as number[]).map(floor => 
        ([-1.0, -0.35, 0.35, 1.0] as number[]).map((x, col) => (
          <group key={`${floor}-${col}`} position={[x, 0.7 + floor * 0.8, buildingDepth / 2 + 0.05]}>
            <mesh position={[0, 0, -0.02]}>
              <boxGeometry args={[0.28, 0.28, 0.04]} />
              <meshStandardMaterial color={0x4a3520} roughness={0.6} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.22, 0.22, 0.08]} />
              <meshStandardMaterial 
                color={0xFFFFCC} 
                roughness={0.05} 
                metalness={0.0} 
                emissive={0xFFFF99}
                emissiveIntensity={0.15}
              />
            </mesh>
          </group>
        ))
      )}

      {/* Grand entrance with double doors */}
      <mesh position={[0, 1.2, buildingDepth / 2 + 0.05]}>
        <boxGeometry args={[1.6, 2.4, 0.12]} />
        <meshStandardMaterial color={0x404040} roughness={0.2} metalness={0.4} />
      </mesh>
      
      {/* Left door */}
      <mesh position={[-0.35, 1.2, buildingDepth / 2 + 0.1]}>
        <boxGeometry args={[0.5, 2.0, 0.05]} />
        <meshStandardMaterial color={0x505050} roughness={0.3} />
      </mesh>
      {/* Right door */}
      <mesh position={[0.35, 1.2, buildingDepth / 2 + 0.1]}>
        <boxGeometry args={[0.5, 2.0, 0.05]} />
        <meshStandardMaterial color={0x505050} roughness={0.3} />
      </mesh>

      {/* Gold door handles */}
      <mesh position={[-0.2, 1.2, buildingDepth / 2 + 0.15]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[0.2, 1.2, buildingDepth / 2 + 0.15]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Luxury awning */}
      <mesh position={[0, 2.4, buildingDepth / 2 + 0.4]}>
        <boxGeometry args={[2.2, 0.08, 0.6]} />
        <meshStandardMaterial color={0xDC143C} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Decorative corner flags */}
      <group position={[-1.4, buildingHeight - 1.0, buildingDepth / 2 + 0.1]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.6]} />
          <meshStandardMaterial color={0x8B4513} />
        </mesh>
        <mesh position={[0.15, 0.45, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.25, 0.15, 0.02]} />
          <meshStandardMaterial color={0xDC143C} roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0.08, 0.45, 0.01]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color={0xFFBD32} roughness={0.1} metalness={0.9} />
        </mesh>
      </group>

      <group position={[1.4, buildingHeight - 1.0, buildingDepth / 2 + 0.1]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.6]} />
          <meshStandardMaterial color={0x8B4513} />
        </mesh>
        <mesh position={[-0.15, 0.45, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.25, 0.15, 0.02]} />
          <meshStandardMaterial color={0xDC143C} roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[-0.08, 0.45, 0.01]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color={0xFFBD32} roughness={0.1} metalness={0.9} />
        </mesh>
      </group>

      {/* Luxury entrance columns */}
      {([-0.8, 0.8] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 1.5, buildingDepth / 2 + 0.03]}>
          <cylinderGeometry args={[0.08, 0.08, 3.0]} />
          <meshStandardMaterial color={0xE8E8E8} roughness={0.2} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}