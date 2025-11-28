'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface Bank3D_R3FProps {
  isPulsing?: boolean;
  rewardsAmount?: number;
  profilePicture?: string | null;
}

export function Bank3D_R3F({ 
  isPulsing = false, 
  rewardsAmount = 0,
  profilePicture = null
}: Bank3D_R3FProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef({ current: 1, target: 1 });
  const [profileTexture, setProfileTexture] = useState<THREE.Texture | null>(null);
  const { gl } = useThree();

  // Handle pulsing animation
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    scaleRef.current.target = isPulsing ? 1.12 : 1;
    scaleRef.current.current += (scaleRef.current.target - scaleRef.current.current) * 0.15;
    groupRef.current.scale.setScalar(scaleRef.current.current);
    
    const time = state.clock.elapsedTime;
    groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
    groupRef.current.position.y = -6.5 + Math.sin(time * 0.8) * 0.1;
    groupRef.current.rotation.x = Math.sin(time * 0.6) * 0.012;
  });

  // Load profile texture
  useEffect(() => {
    if (profilePicture) {
      const loader = new THREE.TextureLoader();
      loader.load(
        profilePicture,
        (texture) => {
          texture.needsUpdate = true;
          setProfileTexture(texture);
        },
        undefined,
        () => {
          setProfileTexture(null);
        }
      );
    } else {
      setProfileTexture(null);
    }
  }, [profilePicture]);

  // No need to create material objects in R3F - use JSX directly

  const buildingWidth = 18;
  const buildingHeight = 8;
  const buildingDepth = 10;
  const frontZ = buildingDepth/2;

  // Create triangular roof geometry
  const roofGeometry = new THREE.BufferGeometry();
  const counterSectionHeight = 3.6;
  const counterSectionWidth = buildingWidth + 1.2;
  const counterSectionDepth = buildingDepth + 1.0;
  const counterSectionY = 9.7 + counterSectionHeight/2;
  const roofBaseY = counterSectionY + counterSectionHeight/2 + 0.1;
  const peakHeight = 5.6;
  const roofHalfWidth = counterSectionWidth / 2 + 0.1;
  const roofDepth = counterSectionDepth + 0.1;

  const roofVertices = new Float32Array([
    // Front triangle
    -roofHalfWidth, 0, roofDepth/2,
    roofHalfWidth, 0, roofDepth/2,
    0, peakHeight, roofDepth/2,
    // Back triangle
    roofHalfWidth, 0, -roofDepth/2,
    -roofHalfWidth, 0, -roofDepth/2,
    0, peakHeight, -roofDepth/2,
    // Left side
    -roofHalfWidth, 0, roofDepth/2,
    0, peakHeight, roofDepth/2,
    0, peakHeight, -roofDepth/2,
    0, peakHeight, -roofDepth/2,
    -roofHalfWidth, 0, -roofDepth/2,
    -roofHalfWidth, 0, roofDepth/2,
    // Right side
    roofHalfWidth, 0, roofDepth/2,
    roofHalfWidth, 0, -roofDepth/2,
    0, peakHeight, -roofDepth/2,
    0, peakHeight, -roofDepth/2,
    0, peakHeight, roofDepth/2,
    roofHalfWidth, 0, roofDepth/2,
    // Bottom
    -roofHalfWidth, 0, roofDepth/2,
    -roofHalfWidth, 0, -roofDepth/2,
    roofHalfWidth, 0, -roofDepth/2,
    roofHalfWidth, 0, -roofDepth/2,
    roofHalfWidth, 0, roofDepth/2,
    -roofHalfWidth, 0, roofDepth/2,
  ]);

  roofGeometry.setAttribute('position', new THREE.BufferAttribute(roofVertices, 3));
  roofGeometry.computeVertexNormals();

  return (
    <group ref={groupRef} position={[0, -6.5, 0]} scale={0.5}>
      {/* Base platform */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[20, 0.8, 12]} />
        <meshStandardMaterial color={0x8B6BC4} roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[20.4, 0.3, 12.4]} />
        <meshStandardMaterial color={0x3D2570} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Main building */}
      <mesh position={[0, 4.8, 0]}>
        <boxGeometry args={[buildingWidth, buildingHeight, buildingDepth]} />
        <meshStandardMaterial color={0x5D3A9B} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Columns */}
      {[-8, -6, -4, 4, 6, 8].map((xPos, i) => (
        <group key={i} position={[xPos, 0, buildingDepth/2 + 0.2]}>
          <mesh position={[0, 4.4, 0]}>
            <cylinderGeometry args={[0.56, 0.5, 7.2, 16]} />
            <meshStandardMaterial color={0xE8E0F0} roughness={0.3} metalness={0.1} />
          </mesh>
          <mesh position={[0, 1.0, 0]}>
            <boxGeometry args={[1.2, 0.5, 1.2]} />
            <meshStandardMaterial color={0x8B6BC4} roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 8.4, 0]}>
            <boxGeometry args={[1.1, 0.36, 1.1]} />
            <meshStandardMaterial color={0x8B6BC4} roughness={0.3} metalness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Roof beam */}
      <mesh position={[0, 9.25, 0]}>
        <boxGeometry args={[buildingWidth + 1.2, 0.9, buildingDepth + 1.2]} />
        <meshStandardMaterial color={0x5D3A9B} roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, 9.0, buildingDepth/2 + 0.76]}>
        <boxGeometry args={[buildingWidth + 1.4, 0.24, 0.3]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Dentils */}
      {Array.from({ length: 17 }, (_, i) => -8.4 + i * 1.0).map((x, i) => (
        <mesh key={i} position={[x, 8.7, buildingDepth/2 + 0.5]}>
          <boxGeometry args={[0.36, 0.36, 0.36]} />
          <meshStandardMaterial color={0x3D2570} roughness={0.5} metalness={0.1} />
        </mesh>
      ))}

      {/* Counter section */}
      <mesh position={[0, counterSectionY, 0]}>
        <boxGeometry args={[counterSectionWidth, counterSectionHeight, counterSectionDepth]} />
        <meshStandardMaterial color={0x5D3A9B} roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, counterSectionY + counterSectionHeight/2 + 0.1, counterSectionDepth/2 + 0.16]}>
        <boxGeometry args={[counterSectionWidth + 0.3, 0.2, 0.24]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Counter display */}
      <group position={[0, counterSectionY, counterSectionDepth/2 + 0.2]}>
        <mesh>
          <planeGeometry args={[17.0, 3.2]} />
          <meshBasicMaterial color={0x050515} transparent opacity={0.95} />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={1.5}
          color="#22d3ee"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/orbitron/v31/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyKS6xpmIyXjU1pg.ttf"
        >
          {rewardsAmount < 100000
            ? rewardsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : Math.floor(rewardsAmount).toLocaleString()}
        </Text>
      </group>

      {/* Triangular roof */}
      <mesh geometry={roofGeometry} position={[0, roofBaseY, 0]}>
        <meshStandardMaterial color={0x5D3A9B} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Profile picture circle */}
      <group position={[0, roofBaseY + peakHeight * 0.40, roofDepth/2 + 0.2]}>
        <mesh>
          <circleGeometry args={[2.2, 32]} />
          {profileTexture ? (
            <meshBasicMaterial map={profileTexture} side={THREE.DoubleSide} />
          ) : (
            <meshBasicMaterial color={0x1a0a2e} side={THREE.DoubleSide} />
          )}
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <torusGeometry args={[2.35, 0.18, 16, 32]} />
          <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
        </mesh>
      </group>

      {/* Door */}
      <mesh position={[0, 4.0, frontZ + 0.1]}>
        <boxGeometry args={[3.6, 6.4, 0.7]} />
        <meshStandardMaterial color={0x3D2570} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, 3.6, frontZ + 0.36]}>
        <boxGeometry args={[2.8, 5.6, 0.24]} />
        <meshStandardMaterial color={0x1a0a2e} roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, 3.6, frontZ + 0.44]}>
        <boxGeometry args={[0.08, 5.6, 0.28]} />
        <meshStandardMaterial color={0x3D2570} roughness={0.5} metalness={0.1} />
      </mesh>
      
      {/* Door handles */}
      <mesh position={[-0.6, 3.4, frontZ + 0.6]}>
        <sphereGeometry args={[0.16, 6, 6]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>
      <mesh position={[0.6, 3.4, frontZ + 0.6]}>
        <sphereGeometry args={[0.16, 6, 6]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>
    </group>
  );
}