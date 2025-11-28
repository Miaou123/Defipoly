'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface House3_R3FProps {
  isPulsing?: boolean;
}

export function House3_R3F({ isPulsing = false }: House3_R3FProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef({ current: 1, target: 1 });

  useFrame(() => {
    if (!groupRef.current) return;
    
    scaleRef.current.target = isPulsing ? 1.15 : 1;
    scaleRef.current.current += (scaleRef.current.target - scaleRef.current.current) * 0.15;
    groupRef.current.scale.setScalar(scaleRef.current.current);
    
    groupRef.current.rotation.y = Math.sin(Date.now() * 0.0003) * 0.15 + 0.4;
  });

  // Materials
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xC19A6B, roughness: 0.7, metalness: 0.0
  });
  const wallSideMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x9C7A4F, roughness: 0.7, metalness: 0.0
  });
  const roofMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513, roughness: 0.6, metalness: 0.0
  });
  const doorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x654321, roughness: 0.5, metalness: 0.1
  });
  const windowMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xFFFFCC, roughness: 0.2, metalness: 0.0, emissive: 0xFFFF99, emissiveIntensity: 0.3
  });
  const purpleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4D2783, roughness: 0.5, metalness: 0.1
  });
  const goldMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xFFBD32, roughness: 0.3, metalness: 0.6
  });

  // 3-story apartment building - taller and thinner
  const buildingWidth = 2.0;
  const buildingHeight = 3.5;
  const buildingDepth = 2.0;
  
  return (
    <group ref={groupRef} position={[0, -0.05, 0]} scale={0.6}>
      {/* Base/Ground */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[buildingWidth + 0.6, 0.1, buildingDepth + 0.6]} />
        <meshStandardMaterial color={0x4a7c4e} roughness={0.9} />
      </mesh>

      {/* Main building body */}
      <mesh position={[0, buildingHeight / 2, 0]}>
        <boxGeometry args={[buildingWidth, buildingHeight, buildingDepth]} />
        <primitive object={wallMaterial} />
      </mesh>

      {/* Flat roof */}
      <mesh position={[0, buildingHeight + 0.15, 0]}>
        <boxGeometry args={[buildingWidth + 0.1, 0.3, buildingDepth + 0.1]} />
        <primitive object={roofMaterial} />
      </mesh>

      {/* Top hat logo on roof */}
      <group position={[0, buildingHeight + 0.5, buildingDepth / 2 + 0.1]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.4, 0.5, 0.1]} />
          <primitive object={purpleMaterial} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.6, 0.08, 0.1]} />
          <primitive object={purpleMaterial} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.42, 0.12, 0.11]} />
          <primitive object={goldMaterial} />
        </mesh>
      </group>

      {/* Windows - 3 floors, 3 columns each */}
      {[0, 1, 2].map(floor => 
        [-0.6, 0, 0.6].map((x, col) => (
          <group key={`${floor}-${col}`} position={[x, 0.8 + floor * 1.0, buildingDepth / 2 + 0.05]}>
            <mesh position={[0, 0, -0.02]}>
              <boxGeometry args={[0.35, 0.35, 0.04]} />
              <meshStandardMaterial color={0x4a3520} roughness={0.6} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.28, 0.28, 0.08]} />
              <primitive object={windowMaterial} />
            </mesh>
          </group>
        ))
      )}

      {/* Main entrance door - centered, larger */}
      <mesh position={[0, 0.6, buildingDepth / 2 + 0.05]}>
        <boxGeometry args={[0.7, 1.2, 0.1]} />
        <primitive object={doorMaterial} />
      </mesh>
      <mesh position={[0.2, 0.6, buildingDepth / 2 + 0.1]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <primitive object={goldMaterial} />
      </mesh>

      {/* Building entrance details */}
      <mesh position={[0, 0.1, buildingDepth / 2 + 0.03]}>
        <boxGeometry args={[1.2, 0.2, 0.05]} />
        <primitive object={wallSideMaterial} />
      </mesh>
    </group>
  );
}