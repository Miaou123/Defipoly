'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Logo3D_R3F() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += 0.008;
  });

  // No need to create material objects in R3F - use JSX directly

  // Crown dimensions
  const crownHeight = 1.8;
  const crownRadius = 1;
  const crownRadiusTop = 0.95;

  // Brim geometry
  const brimPoints = [
    new THREE.Vector2(crownRadius - 0.02, 0.04),
    new THREE.Vector2(1.6, 0.04),
    new THREE.Vector2(1.7, 0),
    new THREE.Vector2(1.6, -0.04),
    new THREE.Vector2(crownRadius - 0.02, -0.04),
  ];

  return (
    <group ref={groupRef} rotation={[0.2, 0, 0.08]}>
      {/* Add specific lighting for the logo */}
      <directionalLight position={[0, 2, -5]} intensity={0.4} color={0xffeedd} />
      <directionalLight position={[0, -3, 0]} intensity={0.2} color={0x6644aa} />

      {/* Crown */}
      <mesh position={[0, crownHeight / 2 + 0.15, 0]}>
        <cylinderGeometry args={[crownRadiusTop, crownRadius, crownHeight, 24]} />
        <meshStandardMaterial color={0x4D2783} roughness={0.7} metalness={0.0} />
      </mesh>

      {/* Flat top */}
      <mesh position={[0, crownHeight + 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[crownRadiusTop, 24]} />
        <meshStandardMaterial color={0x4D2783} roughness={0.7} metalness={0.0} />
      </mesh>

      {/* Inner crown */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[crownRadius - 0.05, crownRadius - 0.05, 0.5, 24, 1, true]} />
        <meshStandardMaterial color={0x2a1548} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Brim */}
      <mesh position={[0, 0.15, 0]}>
        <latheGeometry args={[brimPoints, 24]} />
        <meshStandardMaterial color={0x4D2783} roughness={0.7} metalness={0.0} />
      </mesh>

      {/* Gold band */}
      <mesh position={[0, 0.375, 0]}>
        <cylinderGeometry args={[crownRadius + 0.025, crownRadius + 0.025, 0.35, 24, 1, true]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Band edges */}
      <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[crownRadius + 0.025, 0.02, 8, 24]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[crownRadius + 0.025, 0.02, 8, 24]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Small knot */}
      <mesh position={[0, 0.38, crownRadius + 0.05]}>
        <boxGeometry args={[0.15, 0.2, 0.08]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}