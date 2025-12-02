'use client';

import { useRef } from 'react';
import * as THREE from 'three';

interface House2_R3FProps {}

export function House2_R3F({}: House2_R3FProps) {
  const groupRef = useRef<THREE.Group>(null);

  // House 2 dimensions - larger than house 1
  const houseWidth = 2.5;
  const houseHeight = 2.0;
  const houseDepth = 2.2;

  // Roof dimensions
  const roofHeight = 0.8;
  const roofOverhang = 0.15;
  const hw = houseWidth / 2 + roofOverhang;
  const hd = houseDepth / 2 + roofOverhang;
  const baseY = houseHeight;
  const peakY = houseHeight + roofHeight;

  // Left roof slope
  const leftRoofGeo = new THREE.BufferGeometry();
  const leftRoofVerts = new Float32Array([
    0,   peakY, -hd,
    0,   peakY, hd,
    -hw, baseY, hd,
    0,   peakY, -hd,
    -hw, baseY, hd,
    -hw, baseY, -hd,
  ]);
  leftRoofGeo.setAttribute('position', new THREE.BufferAttribute(leftRoofVerts, 3));
  leftRoofGeo.computeVertexNormals();

  // Right roof slope
  const rightRoofGeo = new THREE.BufferGeometry();
  const rightRoofVerts = new Float32Array([
    0,  peakY, hd,
    0,  peakY, -hd,
    hw, baseY, -hd,
    0,  peakY, hd,
    hw, baseY, -hd,
    hw, baseY, hd,
  ]);
  rightRoofGeo.setAttribute('position', new THREE.BufferAttribute(rightRoofVerts, 3));
  rightRoofGeo.computeVertexNormals();

  // Gable geometry (triangular front/back)
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-houseWidth / 2, 0);
  gableShape.lineTo(houseWidth / 2, 0);
  gableShape.lineTo(0, roofHeight);
  gableShape.closePath();
  const gableGeometry = new THREE.ShapeGeometry(gableShape);
  
  return (
    <group ref={groupRef} position={[0, 0.3, 0]} scale={0.7}>
      {/* Base/Ground */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[houseWidth + 0.5, 0.1, houseDepth + 0.5]} />
        <meshStandardMaterial color={0x4a7c4e} roughness={0.9} />
      </mesh>

      {/* Main house body */}
      <mesh position={[0, houseHeight / 2, 0]}>
        <boxGeometry args={[houseWidth, houseHeight, houseDepth]} />
        <meshStandardMaterial color={0xD2691E} roughness={0.7} metalness={0.0} />
      </mesh>

      {/* Chimney */}
      <group position={[-0.7, 2.0, -0.5]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshStandardMaterial color={0x8B4513} roughness={0.6} metalness={0.0} />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[0.5, 0.15, 0.5]} />
          <meshStandardMaterial color={0x654321} roughness={0.6} metalness={0.0} />
        </mesh>
      </group>

      {/* Left roof slope */}
      <mesh geometry={leftRoofGeo}>
        <meshStandardMaterial color={0x8B4513} roughness={0.6} metalness={0.0} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Right roof slope */}
      <mesh geometry={rightRoofGeo}>
        <meshStandardMaterial color={0x654321} roughness={0.6} metalness={0.0} side={THREE.DoubleSide} />
      </mesh>

      {/* Front gable */}
      <mesh geometry={gableGeometry} position={[0, houseHeight, houseDepth / 2 + 0.01]}>
        <meshStandardMaterial color={0xD2691E} roughness={0.7} metalness={0.0} />
      </mesh>
      
      {/* Back gable */}
      <mesh geometry={gableGeometry} position={[0, houseHeight, -houseDepth / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial color={0xA0522D} roughness={0.7} metalness={0.0} />
      </mesh>

      {/* Door - centered */}
      <mesh position={[0, 0.5, houseDepth / 2 + 0.05]}>
        <boxGeometry args={[0.5, 1.0, 0.1]} />
        <meshStandardMaterial color={0x654321} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0.15, 0.5, houseDepth / 2 + 0.1]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Windows - 4 windows, symmetrical */}
      {([
        [-0.7, 0.85], [0.7, 0.85],  // Upper windows
        [-0.7, 0.45], [0.7, 0.45]   // Lower windows  
      ] as [number, number][]).map(([x, y], i) => (
        <group key={i} position={[x, houseHeight * y, houseDepth / 2 + 0.05]}>
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[0.42, 0.42, 0.04]} />
            <meshStandardMaterial color={0x4a3520} roughness={0.6} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.35, 0.35, 0.08]} />
            <meshStandardMaterial 
              color={0xFFFFCC} 
              roughness={0.2} 
              metalness={0.0} 
              emissive={0xFFFF99}
              emissiveIntensity={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}