'use client';

import { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface Bank3D_R3FProps {
  isPulsing?: boolean;
  rewardsAmount?: number;
  profilePicture?: string | null;
}

function ProfilePictureMesh({ url }: { url: string }) {
  const texture = useTexture(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  
  return (
    <mesh>
      <circleGeometry args={[2.0, 32]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

function LogoFallback() {
  const texture = useTexture('/logo.svg');
  texture.colorSpace = THREE.SRGBColorSpace;
  
  return (
    <mesh>
      <circleGeometry args={[2.0, 32]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function Bank3D_R3F({ 
  isPulsing = false, 
  rewardsAmount = 0,
  profilePicture = null
}: Bank3D_R3FProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef({ current: 1, target: 1 });

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    scaleRef.current.target = isPulsing ? 1.12 : 1;
    scaleRef.current.current += (scaleRef.current.target - scaleRef.current.current) * 0.15;
    groupRef.current.scale.setScalar(scaleRef.current.current);
    
    // Remove rotation animations - keep bank straight
    groupRef.current.rotation.y = 0;
    groupRef.current.position.y = -6.5;
    groupRef.current.rotation.x = 0;
  });

  const buildingWidth = 18;
  const buildingHeight = 8;
  const buildingDepth = 10;
  const frontZ = buildingDepth/2;

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
    -roofHalfWidth, 0, roofDepth/2, roofHalfWidth, 0, roofDepth/2, 0, peakHeight, roofDepth/2,
    roofHalfWidth, 0, -roofDepth/2, -roofHalfWidth, 0, -roofDepth/2, 0, peakHeight, -roofDepth/2,
    -roofHalfWidth, 0, roofDepth/2, 0, peakHeight, roofDepth/2, 0, peakHeight, -roofDepth/2,
    0, peakHeight, -roofDepth/2, -roofHalfWidth, 0, -roofDepth/2, -roofHalfWidth, 0, roofDepth/2,
    roofHalfWidth, 0, roofDepth/2, roofHalfWidth, 0, -roofDepth/2, 0, peakHeight, -roofDepth/2,
    0, peakHeight, -roofDepth/2, 0, peakHeight, roofDepth/2, roofHalfWidth, 0, roofDepth/2,
    -roofHalfWidth, 0, roofDepth/2, -roofHalfWidth, 0, -roofDepth/2, roofHalfWidth, 0, -roofDepth/2,
    roofHalfWidth, 0, -roofDepth/2, roofHalfWidth, 0, roofDepth/2, -roofHalfWidth, 0, roofDepth/2,
  ]);

  roofGeometry.setAttribute('position', new THREE.BufferAttribute(roofVertices, 3));
  roofGeometry.computeVertexNormals();

  return (
    <group ref={groupRef} position={[0, -6.5, 0]} scale={1}>
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

      {/* Gold roof edge trim - left */}
      <mesh position={[-roofHalfWidth/2, roofBaseY + peakHeight/2 + 0.1, roofDepth/2 + 0.15]} rotation={[0, 0, Math.atan2(peakHeight, roofHalfWidth)]}>
        <boxGeometry args={[Math.sqrt(roofHalfWidth * roofHalfWidth + peakHeight * peakHeight), 0.15, 0.15]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>
      
      {/* Gold roof edge trim - right */}
      <mesh position={[roofHalfWidth/2, roofBaseY + peakHeight/2 + 0.1, roofDepth/2 + 0.15]} rotation={[0, 0, -Math.atan2(peakHeight, roofHalfWidth)]}>
        <boxGeometry args={[Math.sqrt(roofHalfWidth * roofHalfWidth + peakHeight * peakHeight), 0.15, 0.15]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Gold finial at roof peak */}
      <mesh position={[0, roofBaseY + peakHeight + 0.3, roofDepth/2]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>
      <mesh position={[0, roofBaseY + peakHeight + 0.8, roofDepth/2]}>
        <coneGeometry args={[0.25, 0.6, 16]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Gold corner accents on roof base */}
      <mesh position={[-roofHalfWidth, roofBaseY + 0.15, roofDepth/2]}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>
      <mesh position={[roofHalfWidth, roofBaseY + 0.15, roofDepth/2]}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Profile picture circle */}
      <group position={[0, roofBaseY + peakHeight * 0.40, roofDepth/2 + 1.0]}>
        <Suspense fallback={
          <mesh>
            <circleGeometry args={[2.0, 32]} />
            <meshBasicMaterial color={0x333333} side={THREE.DoubleSide} />
          </mesh>
        }>
          {profilePicture ? (
            <ProfilePictureMesh url={profilePicture} />
          ) : (
            <LogoFallback />
          )}
        </Suspense>
        <mesh position={[0, 0, 0.04]}>
          <torusGeometry args={[2.12, 0.16, 16, 32]} />
          <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
        </mesh>
      </group>

      {/* ============ ENTRANCE DECORATIONS ============ */}

      {/* Door frame - outer gold trim */}
      <mesh position={[0, 4.0, frontZ + 0.52]}>
        <boxGeometry args={[4.2, 7.0, 0.1]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Door recess */}
      <mesh position={[0, 4.0, frontZ + 0.1]}>
        <boxGeometry args={[3.8, 6.6, 0.7]} />
        <meshStandardMaterial color={0x3D2570} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Door panels */}
      <mesh position={[-0.85, 3.6, frontZ + 0.56]}>
        <boxGeometry args={[1.5, 5.8, 0.1]} />
        <meshStandardMaterial color={0x1a0a2e} roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0.85, 3.6, frontZ + 0.56]}>
        <boxGeometry args={[1.5, 5.8, 0.1]} />
        <meshStandardMaterial color={0x1a0a2e} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Door center divider */}
      <mesh position={[0, 3.6, frontZ + 0.62]}>
        <boxGeometry args={[0.12, 5.8, 0.12]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Door handles */}
      <mesh position={[-0.25, 3.6, frontZ + 0.72]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>
      <mesh position={[0.25, 3.6, frontZ + 0.72]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Door panel insets */}
      {[-0.85, 0.85].map((x, i) => (
        <group key={`panel-${i}`}>
          <mesh position={[x, 5.2, frontZ + 0.62]}>
            <boxGeometry args={[1.1, 2.2, 0.05]} />
            <meshStandardMaterial color={0x2a1548} roughness={0.3} metalness={0.1} />
          </mesh>
          <mesh position={[x, 2.4, frontZ + 0.62]}>
            <boxGeometry args={[1.1, 2.2, 0.05]} />
            <meshStandardMaterial color={0x2a1548} roughness={0.3} metalness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Door pediment */}
      <mesh position={[0, 7.6, frontZ + 0.5]}>
        <boxGeometry args={[4.4, 0.5, 0.3]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>
      <mesh position={[0, 7.9, frontZ + 0.6]}>
        <boxGeometry args={[0.6, 0.8, 0.2]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Decorative pillars beside door */}
      {[-2.2, 2.2].map((x, i) => (
        <group key={`pillar-${i}`} position={[x, 0, frontZ + 0.4]}>
          <mesh position={[0, 1.0, 0]}>
            <boxGeometry args={[0.8, 0.4, 0.8]} />
            <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
          </mesh>
          <mesh position={[0, 4.0, 0]}>
            <cylinderGeometry args={[0.28, 0.32, 5.6, 12]} />
            <meshStandardMaterial color={0xE8E0F0} roughness={0.3} metalness={0.1} />
          </mesh>
          <mesh position={[0, 7.0, 0]}>
            <boxGeometry args={[0.7, 0.35, 0.7]} />
            <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Entrance steps */}
      <mesh position={[0, 0.15, frontZ + 1.5]}>
        <boxGeometry args={[5, 0.3, 2]} />
        <meshStandardMaterial color={0x8B6BC4} roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.1, frontZ + 2.2]}>
        <boxGeometry args={[5.5, 0.2, 1.5]} />
        <meshStandardMaterial color={0x3D2570} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Dark purple carpet */}
      <mesh position={[0, 0.32, frontZ + 1.2]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[3, 1.5]} />
        <meshStandardMaterial color={0x2a1548} roughness={0.8} metalness={0} />
      </mesh>
      <mesh position={[0, 0.33, frontZ + 0.5]}>
        <boxGeometry args={[3.1, 0.02, 0.1]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.33, frontZ + 1.95]}>
        <boxGeometry args={[3.1, 0.02, 0.1]} />
        <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Lanterns */}
      {[-2.8, 2.8].map((x, i) => (
        <group key={`lantern-${i}`} position={[x, 3.5, frontZ + 0.9]}>
          <mesh position={[0, 0.5, -0.2]}>
            <boxGeometry args={[0.1, 0.1, 0.4]} />
            <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.4, 0.6, 0.4]} />
            <meshStandardMaterial color={0x1a0a2e} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <coneGeometry args={[0.3, 0.3, 4]} />
            <meshStandardMaterial color={0xFFBD32} roughness={0.2} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color={0xFFDD66} />
          </mesh>
        </group>
      ))}
    </group>
  );
}