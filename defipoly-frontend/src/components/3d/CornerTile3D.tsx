'use client';

import { useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
// import { Text } from '@react-three/drei'; // REMOVED: Text component causes WebGL context loss
import * as THREE from 'three';
import { getImageUrl } from '@/utils/config';

// Corner tile dimensions (matching Board3DScene)
const tileThickness = 0.15;

// Colors from the codebase
const COLORS = {
  purple: 0x4D2783,
  purpleDark: 0x1A0A2E,       // was 0x2a1a3a - darker
  purpleLight: 0x5E3D6E,      // was 0x9333ea - less pink glow
  gold: 0xFFBD32,
  green: 0x22c55e,
  greenDark: 0x15803d,
  blue: 0x60a5fa,
  blueDark: 0x3b82f6,
  innerPurple: 0x1A0A2E,      // was 0x2a1548 - darker
  tileBase: 0x2E1A3A,         // was 0x3a2a4a - darker corner base
};

interface CornerTile3DProps {
  position: [number, number, number];
  cornerType: 'go' | 'jail' | 'parking' | 'gotojail';
  size: number;
  cornerSquareStyle?: 'property' | 'profile';
  customPropertyCardBackground?: string | null;
  profilePicture?: string | null;
}

// ============================================
// MINI TOP HAT (exact copy from Logo3D_R3F style)
// ============================================
function MiniTopHat({ scale = 0.18 }: { scale?: number }) {
  const crownHeight = 1.8 * scale;
  const crownRadius = 1 * scale;
  const crownRadiusTop = 0.95 * scale;

  return (
    <group rotation={[0.15, 0, 0.08]}>
      {/* Crown */}
      <mesh position={[0, crownHeight / 2, 0]}>
        <cylinderGeometry args={[crownRadiusTop, crownRadius, crownHeight, 16]} />
        <meshStandardMaterial color={COLORS.purple} roughness={0.7} metalness={0} />
      </mesh>

      {/* Flat top */}
      <mesh position={[0, crownHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[crownRadiusTop, 32]} />
        <meshStandardMaterial color={COLORS.purple} roughness={0.7} metalness={0} />
      </mesh>

      {/* Inner crown */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[crownRadius - 0.01, crownRadius - 0.01, 0.1 * scale, 16, 1, true]} />
        <meshStandardMaterial color={COLORS.innerPurple} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Brim */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[1.6 * scale, 1.7 * scale, 0.08 * scale, 16]} />
        <meshStandardMaterial color={COLORS.purple} roughness={0.7} metalness={0} />
      </mesh>

      {/* Gold band */}
      <mesh position={[0, 0.25 * scale, 0]}>
        <cylinderGeometry args={[crownRadius + 0.005, crownRadius + 0.005, 0.35 * scale, 16, 1, true]} />
        <meshStandardMaterial color={COLORS.gold} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Band top edge */}
      <mesh position={[0, 0.42 * scale, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[crownRadius + 0.005, 0.01 * scale, 8, 16]} />
        <meshStandardMaterial color={COLORS.gold} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Band bottom edge */}
      <mesh position={[0, 0.08 * scale, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[crownRadius + 0.005, 0.01 * scale, 8, 16]} />
        <meshStandardMaterial color={COLORS.gold} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Small knot */}
      <mesh position={[0, 0.25 * scale, crownRadius + 0.01]}>
        <boxGeometry args={[0.08 * scale, 0.12 * scale, 0.04 * scale]} />
        <meshStandardMaterial color={COLORS.gold} roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}

// ============================================
// BILL STACK
// ============================================
function BillStack({ scale = 0.12 }: { scale?: number }) {
  const offsets = useMemo(() => 
    Array.from({ length: 4 }, () => ({
      x: (Math.random() - 0.5) * 0.02 * scale,
      z: (Math.random() - 0.5) * 0.02 * scale,
    })), [scale]);

  return (
    <group>
      {offsets.map((offset, i) => (
        <mesh key={i} position={[offset.x, i * 0.03 * scale, offset.z]}>
          <boxGeometry args={[1.4 * scale, 0.05 * scale, 0.7 * scale]} />
          <meshStandardMaterial color={0x1ca049} emissive={COLORS.greenDark} emissiveIntensity={0.2} roughness={0.4} metalness={0.2} />
        </mesh>
      ))}
      {/* Gold $ on top */}
      <mesh position={[0, 4 * 0.03 * scale + 0.02 * scale, 0]}>
        <boxGeometry args={[0.3 * scale, 0.03 * scale, 0.5 * scale]} />
        <meshStandardMaterial color={COLORS.gold} roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}

// ============================================
// DIAMOND
// ============================================
function Diamond({ scale = 0.15 }: { scale?: number }) {
  const crownHeight = 0.25 * scale;
  const tableRadius = 0.25 * scale;
  const crownRadius = 0.5 * scale;
  const pavilionHeight = 0.6 * scale;

  return (
    <group>
      {/* Table (flat top) */}
      <mesh position={[0, crownHeight, 0]}>
        <cylinderGeometry args={[tableRadius, tableRadius, 0.02 * scale, 8]} />
        <meshStandardMaterial color={COLORS.blue} emissive={COLORS.blueDark} emissiveIntensity={0.4} roughness={0.2} metalness={0.6} transparent opacity={0.9} />
      </mesh>
      {/* Crown */}
      <mesh position={[0, crownHeight / 2, 0]}>
        <cylinderGeometry args={[tableRadius, crownRadius, crownHeight, 8]} />
        <meshStandardMaterial color={COLORS.blue} emissive={COLORS.blueDark} emissiveIntensity={0.4} roughness={0.2} metalness={0.6} transparent opacity={0.9} />
      </mesh>
      {/* Girdle */}
      <mesh>
        <cylinderGeometry args={[crownRadius, crownRadius, 0.05 * scale, 8]} />
        <meshStandardMaterial color={COLORS.blue} emissive={COLORS.blueDark} emissiveIntensity={0.4} roughness={0.2} metalness={0.6} transparent opacity={0.9} />
      </mesh>
      {/* Pavilion (bottom cone) */}
      <mesh position={[0, -pavilionHeight / 2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[crownRadius, pavilionHeight, 8]} />
        <meshStandardMaterial color={COLORS.blue} emissive={COLORS.blueDark} emissiveIntensity={0.4} roughness={0.2} metalness={0.6} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

// ============================================
// CORNER 1: Hat with Orbiting Coins (go)
// ============================================
function CornerHatCoins() {
  const hatRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Animate hat
    if (hatRef.current) {
      hatRef.current.rotation.y = time * 0.5;
      hatRef.current.position.y = 0.35 + Math.sin(time * 2) * 0.05;
    }

    // Rotate entire group for orbiting effect
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.8;
    }
  });

  const coinCount = 5;
  const coins = useMemo(() => {
    return Array.from({ length: coinCount }, (_, i) => ({
      angle: (i / coinCount) * Math.PI * 2,
      radius: 0.35,
      yOffset: i * 0.08,
    }));
  }, []);

  return (
    <group>
      {/* Floating hat */}
      <group ref={hatRef} position={[0, 0.35, 0]}>
        <MiniTopHat scale={0.18} />
      </group>

      {/* Orbiting coins */}
      <group ref={groupRef}>
        {coins.map((coin, i) => (
          <mesh
            key={`coin-${i}`}
            position={[
              Math.cos(coin.angle) * coin.radius,
              0.25 + coin.yOffset,
              Math.sin(coin.angle) * coin.radius
            ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.06, 0.06, 0.012, 16]} />
            <meshStandardMaterial color={COLORS.gold} roughness={0.2} metalness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Static sparkles removed */}
    </group>
  );
}

// ============================================
// CORNER 2: Floating Diamonds (jail)
// ============================================
function CornerDiamonds() {
  const mainDiamondRef = useRef<THREE.Group>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Main diamond
    if (mainDiamondRef.current) {
      mainDiamondRef.current.rotation.y = time * 0.8;
      mainDiamondRef.current.position.y = 0.45 + Math.sin(time * 1.5) * 0.08;
    }

    // Orbit group
    if (orbitGroupRef.current) {
      orbitGroupRef.current.rotation.y = time * 0.6;
    }
  });

  return (
    <group>
      {/* Main large diamond */}
      <group ref={mainDiamondRef} position={[0, 0.45, 0]}>
        <Diamond scale={0.15} />
      </group>

      {/* Smaller orbiting diamonds */}
      <group ref={orbitGroupRef}>
        {Array.from({ length: 3 }, (_, i) => (
          <group 
            key={`diamond-${i}`}
            position={[
              Math.cos((i / 3) * Math.PI * 2) * 0.28,
              0.2 + i * 0.1,
              Math.sin((i / 3) * Math.PI * 2) * 0.28
            ]}
          >
            <Diamond scale={0.08} />
          </group>
        ))}
      </group>

      {/* Static sparkles removed */}
    </group>
  );
}

// ============================================
// CORNER 3: Bill Stack with Coins (parking)
// ============================================
function CornerBills() {
  const billStackRef = useRef<THREE.Group>(null);
  const floatingGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Central bill stack
    if (billStackRef.current) {
      billStackRef.current.rotation.y = time * 0.3;
      billStackRef.current.position.y = 0.3 + Math.sin(time * 2) * 0.04;
    }

    // Floating bills group
    if (floatingGroupRef.current) {
      floatingGroupRef.current.rotation.y = time * 0.5;
    }
  });

  return (
    <group>
      {/* Central bill stack */}
      <group ref={billStackRef} position={[0, 0.3, 0]}>
        <BillStack scale={0.12} />
      </group>

      {/* Floating bills */}
      <group ref={floatingGroupRef}>
        {Array.from({ length: 4 }, (_, i) => (
          <group
            key={`bill-${i}`}
            position={[
              Math.cos((i / 4) * Math.PI * 2) * 0.3,
              0.2 + (i % 2) * 0.15,
              Math.sin((i / 4) * Math.PI * 2) * 0.3
            ]}
          >
            <BillStack scale={0.06} />
          </group>
        ))}
      </group>

      {/* Static coins removed */}
    </group>
  );
}

// ============================================
// CORNER 4: Combined Elements (gotojail)
// ============================================
function CornerCombined() {
  const hatRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Hat animation
    if (hatRef.current) {
      hatRef.current.rotation.y = time * 0.4;
      hatRef.current.position.y = 0.4 + Math.sin(time * 1.8) * 0.04;
    }

    // Ring animation
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.2;
      (ringRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + Math.sin(time * 3) * 0.2;
    }

    // Orbit group
    if (orbitGroupRef.current) {
      orbitGroupRef.current.rotation.y = time * 0.7;
    }
  });

  return (
    <group>
      {/* Central mini hat */}
      <group ref={hatRef} position={[0, 0.4, 0]}>
        <MiniTopHat scale={0.12} />
      </group>

      {/* Orbiting diamonds */}
      <group ref={orbitGroupRef}>
        {Array.from({ length: 5 }, (_, i) => (
          <group
            key={`diamond-${i}`}
            position={[
              Math.cos((i / 5) * Math.PI * 2) * 0.35,
              0.25 + i * 0.08,
              Math.sin((i / 5) * Math.PI * 2) * 0.35
            ]}
          >
            <Diamond scale={0.08} />
          </group>
        ))}
      </group>

      {/* Static sparkles removed */}
    </group>
  );
}

// ============================================
// TEXTURE OVERLAY COMPONENT
// ============================================
function CornerTextureOverlay({ textureUrl, size, cornerSquareStyle, profilePicture }: {
  textureUrl: string;
  size: number;
  cornerSquareStyle: 'property' | 'profile';
  profilePicture?: string | null;
}) {
  // Generate texture URL - handle single colors by creating canvas texture
  const finalTextureUrl = useMemo(() => {
    // For profile pictures, transform the URL first
    if (cornerSquareStyle === 'profile' && profilePicture) {
      const transformedUrl = getImageUrl(profilePicture);
      if (!transformedUrl) return textureUrl; // fallback if transformation fails
      return transformedUrl;
    }
    
    // Check if textureUrl is a single hex color
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (hexColorRegex.test(textureUrl)) {
      // Generate canvas texture from single color
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.warn('Could not get canvas context for color texture generation');
        return textureUrl; // fallback to original
      }
      
      // Fill with solid color
      ctx.fillStyle = textureUrl;
      ctx.fillRect(0, 0, 256, 256);
      
      // Return as data URL
      return canvas.toDataURL('image/png');
    }
    
    // If not a hex color, treat as regular URL
    return textureUrl;
  }, [textureUrl, cornerSquareStyle, profilePicture]);

  const texture = useTexture(finalTextureUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);

  // For profile pictures, create a circular shader material like we did for the bank
  if (cornerSquareStyle === 'profile' && profilePicture) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        varying vec2 vUv;
        void main() {
          // Convert UV to centered coordinates
          vec2 center = vUv - 0.5;
          
          // Calculate distance from center
          float dist = length(center);
          
          // Discard pixels outside the circle
          if (dist > 0.5) {
            discard;
          }
          
          // Apply slight fade at edges for smoother appearance
          float alpha = 1.0 - smoothstep(0.48, 0.5, dist);
          
          vec4 texColor = texture2D(map, vUv);
          gl_FragColor = vec4(texColor.rgb, texColor.a * alpha);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
    });

    return (
      <mesh position={[0, tileThickness/2 + 0.025, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <primitive object={material} attach="material" />
      </mesh>
    );
  }

  // For property card style, use regular texture
  return (
    <mesh position={[0, tileThickness/2 + 0.025, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={texture} roughness={0.8} metalness={0.1} />
    </mesh>
  );
}

// ============================================
// MAIN CORNER TILE COMPONENT
// ============================================
export function CornerTile3D({ 
  position, 
  cornerType, 
  size, 
  cornerSquareStyle = 'property',
  customPropertyCardBackground,
  profilePicture 
}: CornerTile3DProps) {
  // Text rotation based on corner position (diagonal text)
  const textRotation: [number, number, number] = useMemo(() => {
    switch (cornerType) {
      case 'go': return [-Math.PI / 2, 0, -Math.PI / 4];
      case 'jail': return [-Math.PI / 2, 0, Math.PI / 4];
      case 'parking': return [-Math.PI / 2, 0, Math.PI * 3 / 4];
      case 'gotojail': return [-Math.PI / 2, 0, -Math.PI * 3 / 4];
    }
  }, [cornerType]);

  const renderCornerContent = () => {
    switch (cornerType) {
      case 'go': return <CornerHatCoins />;
      case 'jail': return <CornerDiamonds />;
      case 'parking': return <CornerBills />;
      case 'gotojail': return <CornerCombined />;
    }
  };

  // Determine which texture to use based on corner square style
  const getTextureUrl = () => {
    if (cornerSquareStyle === 'profile' && profilePicture) {
      return profilePicture;
    }
    if (cornerSquareStyle === 'property' && customPropertyCardBackground) {
      return customPropertyCardBackground;
    }
    return null;
  };

  const textureUrl = getTextureUrl();

  return (
    <group position={position}>
      {/* Base tile */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size, tileThickness, size]} />
        <meshStandardMaterial color={COLORS.tileBase} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Purple edge glow */}
      <mesh position={[0, tileThickness / 2 + 0.01, 0]}>
        <boxGeometry args={[size + 0.02, 0.02, size + 0.02]} />
        <meshStandardMaterial
          color={COLORS.purpleLight}
          emissive={COLORS.purpleLight}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Texture overlay (if any) */}
      {textureUrl && (
        <Suspense fallback={null}>
          <CornerTextureOverlay 
            textureUrl={textureUrl}
            size={size}
            cornerSquareStyle={cornerSquareStyle}
            profilePicture={profilePicture || null}
          />
        </Suspense>
      )}

      {/* Animated floating elements */}
      <group position={[0, tileThickness / 2, 0]}>
        {renderCornerContent()}
      </group>

      {/* Corner identifier removed */}
    </group>
  );
}