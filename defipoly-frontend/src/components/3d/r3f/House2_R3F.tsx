'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface House2_R3FProps {
  isPulsing?: boolean;
}

export function House2_R3F({ isPulsing = false }: House2_R3FProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef({ current: 1, target: 1 });

  // Handle pulsing animation
  useFrame(() => {
    if (!groupRef.current) return;
    
    scaleRef.current.target = isPulsing ? 1.15 : 1;
    scaleRef.current.current += (scaleRef.current.target - scaleRef.current.current) * 0.15;
    groupRef.current.scale.setScalar(scaleRef.current.current);
    
    groupRef.current.rotation.y = Math.sin(Date.now() * 0.0003) * 0.15 + 0.4;
  });

  // Materials
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xD2691E, roughness: 0.7, metalness: 0.0
  });
  const wallSideMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xA0522D, roughness: 0.7, metalness: 0.0
  });
  const roofMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513, roughness: 0.6, metalness: 0.0
  });
  const roofDarkMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x654321, roughness: 0.6, metalness: 0.0
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

  // House 2 dimensions - larger than house 1
  const houseWidth = 2.5;
  const houseHeight = 2.0;
  const houseDepth = 2.2;
  
  return (
    <group ref={groupRef} position={[0, -0.05, 0]} scale={0.7}>
      {/* Base/Ground */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[houseWidth + 0.5, 0.1, houseDepth + 0.5]} />
        <meshStandardMaterial color={0x4a7c4e} roughness={0.9} />
      </mesh>

      {/* Main house body */}
      <mesh position={[0, houseHeight / 2, 0]}>
        <boxGeometry args={[houseWidth, houseHeight, houseDepth]} />
        <primitive object={wallMaterial} />
      </mesh>

      {/* Chimney */}
      <group position={[-0.6, 1.3, -0.8]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.4, 1.0, 0.4]} />
          <primitive object={roofMaterial} />
        </mesh>
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[0.5, 0.2, 0.5]} />
          <primitive object={roofDarkMaterial} />
        </mesh>
      </group>

      {/* Roof - simple pitched */}
      <group position={[0, houseHeight + 0.3, 0]}>
        <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[houseWidth + 0.4, 0.1, houseDepth + 0.4]} />
          <primitive object={roofMaterial} />
        </mesh>
        <mesh position={[0, 0.3, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[houseWidth + 0.4, 0.1, houseDepth + 0.4]} />
          <primitive object={roofDarkMaterial} />
        </mesh>
      </group>

      {/* Top hat logo */}
      <group position={[0, houseHeight + 0.5, houseDepth / 2 + 0.05]}>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.35, 0.4, 0.08]} />
          <primitive object={purpleMaterial} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.55, 0.06, 0.08]} />
          <primitive object={purpleMaterial} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.37, 0.1, 0.09]} />
          <primitive object={goldMaterial} />
        </mesh>
      </group>

      {/* Door - centered */}
      <mesh position={[0, 0.5, houseDepth / 2 + 0.05]}>
        <boxGeometry args={[0.5, 1.0, 0.1]} />
        <primitive object={doorMaterial} />
      </mesh>
      <mesh position={[0.15, 0.5, houseDepth / 2 + 0.1]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <primitive object={goldMaterial} />
      </mesh>

      {/* Windows - 4 windows, symmetrical */}
      {[
        [-0.7, 0.7], [0.7, 0.7],  // Upper windows
        [-0.7, 0.2], [0.7, 0.2]   // Lower windows  
      ].map(([x, y], i) => (
        <group key={i} position={[x, houseHeight * y, houseDepth / 2 + 0.05]}>
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[0.42, 0.42, 0.04]} />
            <meshStandardMaterial color={0x4a3520} roughness={0.6} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.35, 0.35, 0.08]} />
            <primitive object={windowMaterial} />
          </mesh>
        </group>
      ))}
    </group>
  );
}