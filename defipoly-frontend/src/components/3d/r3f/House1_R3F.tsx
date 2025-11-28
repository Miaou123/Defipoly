'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface House1_R3FProps {
  isPulsing?: boolean;
}

export function House1_R3F({ isPulsing = false }: House1_R3FProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef({ current: 1, target: 1 });

  // Handle pulsing animation
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Update target scale based on isPulsing
    scaleRef.current.target = isPulsing ? 1.15 : 1;
    
    // Smoothly interpolate scale
    scaleRef.current.current += (scaleRef.current.target - scaleRef.current.current) * 0.15;
    groupRef.current.scale.setScalar(scaleRef.current.current);
    
    // Gentle rotation
    groupRef.current.rotation.y = Math.sin(Date.now() * 0.0003) * 0.15 + 0.4;
  });

  // Materials
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xD2691E,
    roughness: 0.7, 
    metalness: 0.0
  });
  
  const wallSideMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xA0522D,
    roughness: 0.7, 
    metalness: 0.0
  });
  
  const roofMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,
    roughness: 0.6, 
    metalness: 0.0,
    side: THREE.DoubleSide
  });
  
  const roofDarkMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x654321,
    roughness: 0.6, 
    metalness: 0.0,
    side: THREE.DoubleSide
  });
  
  const doorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x654321,
    roughness: 0.5, 
    metalness: 0.1
  });
  
  const windowMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xFFFFCC,
    roughness: 0.2, 
    metalness: 0.0,
    emissive: 0xFFFF99,
    emissiveIntensity: 0.3
  });

  const purpleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4D2783,
    roughness: 0.5, 
    metalness: 0.1
  });

  const goldMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xFFBD32,
    roughness: 0.3, 
    metalness: 0.6
  });

  // House dimensions
  const houseWidth = 2;
  const houseHeight = 1.5;
  const houseDepth = 1.8;
  
  // Roof dimensions
  const roofHeight = 0.9;
  const roofOverhang = 0.15;
  const hw = houseWidth / 2 + roofOverhang;
  const hd = houseDepth / 2 + roofOverhang;
  const baseY = houseHeight;
  const peakY = houseHeight + roofHeight;

  // Create roof geometry
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

  // Gable geometry
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-houseWidth / 2, 0);
  gableShape.lineTo(houseWidth / 2, 0);
  gableShape.lineTo(0, roofHeight);
  gableShape.closePath();
  const gableGeometry = new THREE.ShapeGeometry(gableShape);

  return (
    <group ref={groupRef} position={[0, -0.05, 0]} scale={0.8}>
      {/* Base/Ground */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[houseWidth + 0.4, 0.1, houseDepth + 0.4]} />
        <meshStandardMaterial color={0x4a7c4e} roughness={0.9} />
      </mesh>

      {/* Main house body */}
      <mesh position={[0, houseHeight / 2, 0]}>
        <boxGeometry args={[houseWidth, houseHeight, houseDepth]} />
        {[wallSideMaterial, wallMaterial, wallMaterial, wallMaterial, wallMaterial, wallMaterial]}
      </mesh>

      {/* Left roof slope */}
      <mesh geometry={leftRoofGeo} material={roofMaterial} />
      
      {/* Right roof slope */}
      <mesh geometry={rightRoofGeo} material={roofDarkMaterial} />

      {/* Front gable */}
      <mesh geometry={gableGeometry} material={wallMaterial} position={[0, houseHeight, houseDepth / 2 + 0.01]} />
      
      {/* Back gable */}
      <mesh geometry={gableGeometry} material={wallSideMaterial} position={[0, houseHeight, -houseDepth / 2 - 0.01]} rotation={[0, Math.PI, 0]} />

      {/* Top hat logo */}
      <group position={[0, houseHeight + roofHeight * 0.35, houseDepth / 2 + 0.03]}>
        <mesh position={[0, 0.175, 0]}>
          <boxGeometry args={[0.3, 0.35, 0.06]} />
          <primitive object={purpleMaterial} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.48, 0.05, 0.06]} />
          <primitive object={purpleMaterial} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.32, 0.08, 0.07]} />
          <primitive object={goldMaterial} />
        </mesh>
      </group>

      {/* Door */}
      <mesh position={[0, 0.35, houseDepth / 2 + 0.04]}>
        <boxGeometry args={[0.4, 0.7, 0.08]} />
        <primitive object={doorMaterial} />
      </mesh>

      {/* Windows */}
      {[-0.55, 0.55].map((xPos, i) => (
        <group key={i} position={[xPos, houseHeight * 0.55, houseDepth / 2 + 0.04]}>
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[0.38, 0.38, 0.03]} />
            <meshStandardMaterial color={0x4a3520} roughness={0.6} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.3, 0.3, 0.06]} />
            <primitive object={windowMaterial} />
          </mesh>
        </group>
      ))}
    </group>
  );
}