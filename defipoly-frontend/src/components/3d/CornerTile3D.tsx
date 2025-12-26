'use client';

import { useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { getImageUrl } from '@/utils/config';

// Corner tile dimensions (matching Board3DScene)
const tileThickness = 0.15;

// Colors from the codebase
const COLORS = {
  purple: 0x4D2783,
  purpleDark: 0x1A0A2E,
  purpleLight: 0x5E3D6E,
  gold: 0xFFBD32,
  green: 0x22c55e,
  greenDark: 0x15803d,
  blue: 0x60a5fa,
  blueDark: 0x3b82f6,
  innerPurple: 0x1A0A2E,
  tileBase: 0x2E1A3A,
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
// MINI TOP HAT - FIXED with memoized geometry args
// ============================================
function MiniTopHat({ scale = 0.18 }: { scale?: number }) {
  // Memoize all geometry args to prevent R3F reconciliation issues in Firefox
  const geoArgs = useMemo(() => {
    const crownHeight = 1.8 * scale;
    const crownRadius = 1 * scale;
    const crownRadiusTop = 0.95 * scale;
    
    return {
      crown: [crownRadiusTop, crownRadius, crownHeight, 16] as const,
      flatTop: [crownRadiusTop, 24] as const,
      inner: [crownRadius - 0.01, crownRadius - 0.01, 0.1 * scale, 16, 1, true] as const,
      brim: [1.6 * scale, 1.7 * scale, 0.08 * scale, 16] as const,
      band: [crownRadius + 0.005, crownRadius + 0.005, 0.35 * scale, 16, 1, true] as const,
      torusTop: [crownRadius + 0.005, 0.01 * scale, 8, 16] as const,
      torusBottom: [crownRadius + 0.005, 0.01 * scale, 8, 16] as const,
      knot: [0.08 * scale, 0.12 * scale, 0.04 * scale] as const,
      // Positions
      crownPos: [0, crownHeight / 2, 0] as [number, number, number],
      flatTopPos: [0, crownHeight, 0] as [number, number, number],
      bandPos: [0, 0.25 * scale, 0] as [number, number, number],
      torusTopPos: [0, 0.42 * scale, 0] as [number, number, number],
      torusBottomPos: [0, 0.08 * scale, 0] as [number, number, number],
      knotPos: [0, 0.25 * scale, crownRadius + 0.01] as [number, number, number],
    };
  }, [scale]);

  return (
    <group rotation={[0.15, 0, 0.08]}>
      {/* Crown */}
      <mesh position={geoArgs.crownPos}>
        <cylinderGeometry args={geoArgs.crown} />
        <meshStandardMaterial color={COLORS.purple} roughness={0.7} metalness={0} />
      </mesh>

      {/* Flat top */}
      <mesh position={geoArgs.flatTopPos} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={geoArgs.flatTop} />
        <meshStandardMaterial color={COLORS.purple} roughness={0.7} metalness={0} />
      </mesh>

      {/* Inner crown */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={geoArgs.inner} />
        <meshStandardMaterial color={COLORS.innerPurple} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Brim */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={geoArgs.brim} />
        <meshStandardMaterial color={COLORS.purple} roughness={0.7} metalness={0} />
      </mesh>

      {/* Gold band */}
      <mesh position={geoArgs.bandPos}>
        <cylinderGeometry args={geoArgs.band} />
        <meshStandardMaterial color={COLORS.gold} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Band top edge */}
      <mesh position={geoArgs.torusTopPos} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={geoArgs.torusTop} />
        <meshStandardMaterial color={COLORS.gold} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Band bottom edge */}
      <mesh position={geoArgs.torusBottomPos} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={geoArgs.torusBottom} />
        <meshStandardMaterial color={COLORS.gold} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Small knot */}
      <mesh position={geoArgs.knotPos}>
        <boxGeometry args={geoArgs.knot} />
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

  // Memoize geometry args
  const geoArgs = useMemo(() => ({
    bill: [1.4 * scale, 0.05 * scale, 0.7 * scale] as const,
    dollar: [0.3 * scale, 0.03 * scale, 0.5 * scale] as const,
    dollarPos: [0, 4 * 0.03 * scale + 0.02 * scale, 0] as [number, number, number],
  }), [scale]);

  return (
    <group>
      {offsets.map((offset, i) => (
        <mesh key={i} position={[offset.x, i * 0.03 * scale, offset.z]}>
          <boxGeometry args={geoArgs.bill} />
          <meshStandardMaterial color={0x1ca049} emissive={COLORS.greenDark} emissiveIntensity={0.2} roughness={0.4} metalness={0.2} />
        </mesh>
      ))}
      {/* Gold $ on top */}
      <mesh position={geoArgs.dollarPos}>
        <boxGeometry args={geoArgs.dollar} />
        <meshStandardMaterial color={COLORS.gold} roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}

// ============================================
// DIAMOND - FIXED with memoized geometry args
// ============================================
function Diamond({ scale = 0.15 }: { scale?: number }) {
  // Memoize all geometry args
  const geoArgs = useMemo(() => {
    const crownHeight = 0.25 * scale;
    const tableRadius = 0.25 * scale;
    const crownRadius = 0.5 * scale;
    const pavilionHeight = 0.6 * scale;
    
    return {
      table: [tableRadius, tableRadius, 0.02 * scale, 8] as const,
      tablePos: [0, crownHeight, 0] as [number, number, number],
      crown: [tableRadius, crownRadius, crownHeight, 8] as const,
      crownPos: [0, crownHeight / 2, 0] as [number, number, number],
      girdle: [crownRadius, crownRadius, 0.05 * scale, 8] as const,
      pavilion: [crownRadius, pavilionHeight, 8] as const,
      pavilionPos: [0, -pavilionHeight / 2, 0] as [number, number, number],
    };
  }, [scale]);

  return (
    <group>
      {/* Table (flat top) */}
      <mesh position={geoArgs.tablePos}>
        <cylinderGeometry args={geoArgs.table} />
        <meshStandardMaterial color={COLORS.blue} emissive={COLORS.blueDark} emissiveIntensity={0.4} roughness={0.2} metalness={0.6} transparent opacity={0.9} />
      </mesh>
      {/* Crown */}
      <mesh position={geoArgs.crownPos}>
        <cylinderGeometry args={geoArgs.crown} />
        <meshStandardMaterial color={COLORS.blue} emissive={COLORS.blueDark} emissiveIntensity={0.4} roughness={0.2} metalness={0.6} transparent opacity={0.9} />
      </mesh>
      {/* Girdle */}
      <mesh>
        <cylinderGeometry args={geoArgs.girdle} />
        <meshStandardMaterial color={COLORS.blue} emissive={COLORS.blueDark} emissiveIntensity={0.4} roughness={0.2} metalness={0.6} transparent opacity={0.9} />
      </mesh>
      {/* Pavilion (bottom cone) */}
      <mesh position={geoArgs.pavilionPos} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={geoArgs.pavilion} />
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
    if (hatRef.current) {
      hatRef.current.rotation.y = time * 0.5;
      hatRef.current.position.y = 0.35 + Math.sin(time * 2) * 0.05;
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.8;
    }
  });

  // Memoize coin geometry args
  const coinArgs = useMemo(() => [0.06, 0.06, 0.012, 16] as const, []);

  const coins = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      angle: (i / 5) * Math.PI * 2,
      radius: 0.35,
      yOffset: i * 0.08,
    }));
  }, []);

  return (
    <group>
      <group ref={hatRef} position={[0, 0.35, 0]}>
        <MiniTopHat scale={0.18} />
      </group>
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
            <cylinderGeometry args={coinArgs} />
            <meshStandardMaterial color={COLORS.gold} roughness={0.2} metalness={0.9} />
          </mesh>
        ))}
      </group>
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
    if (mainDiamondRef.current) {
      mainDiamondRef.current.rotation.y = time * 0.8;
      mainDiamondRef.current.position.y = 0.45 + Math.sin(time * 1.5) * 0.08;
    }
    if (orbitGroupRef.current) {
      orbitGroupRef.current.rotation.y = time * 0.6;
    }
  });

  // Memoize orbit positions
  const orbitPositions = useMemo(() => 
    Array.from({ length: 3 }, (_, i) => [
      Math.cos((i / 3) * Math.PI * 2) * 0.28,
      0.2 + i * 0.1,
      Math.sin((i / 3) * Math.PI * 2) * 0.28
    ] as [number, number, number]), []);

  return (
    <group>
      <group ref={mainDiamondRef} position={[0, 0.45, 0]}>
        <Diamond scale={0.15} />
      </group>
      <group ref={orbitGroupRef}>
        {orbitPositions.map((pos, i) => (
          <group key={`diamond-${i}`} position={pos}>
            <Diamond scale={0.08} />
          </group>
        ))}
      </group>
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
    if (billStackRef.current) {
      billStackRef.current.rotation.y = time * 0.3;
      billStackRef.current.position.y = 0.3 + Math.sin(time * 2) * 0.04;
    }
    if (floatingGroupRef.current) {
      floatingGroupRef.current.rotation.y = time * 0.5;
    }
  });

  // Memoize orbit positions
  const orbitPositions = useMemo(() =>
    Array.from({ length: 4 }, (_, i) => [
      Math.cos((i / 4) * Math.PI * 2) * 0.3,
      0.2 + (i % 2) * 0.15,
      Math.sin((i / 4) * Math.PI * 2) * 0.3
    ] as [number, number, number]), []);

  return (
    <group>
      <group ref={billStackRef} position={[0, 0.3, 0]}>
        <BillStack scale={0.12} />
      </group>
      <group ref={floatingGroupRef}>
        {orbitPositions.map((pos, i) => (
          <group key={`bill-${i}`} position={pos}>
            <BillStack scale={0.06} />
          </group>
        ))}
      </group>
    </group>
  );
}

// ============================================
// CORNER 4: Combined Elements (gotojail)
// ============================================
function CornerCombined() {
  const hatRef = useRef<THREE.Group>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (hatRef.current) {
      hatRef.current.rotation.y = time * 0.4;
      hatRef.current.position.y = 0.4 + Math.sin(time * 1.8) * 0.04;
    }
    if (orbitGroupRef.current) {
      orbitGroupRef.current.rotation.y = time * 0.7;
    }
  });

  // Memoize orbit positions
  const orbitPositions = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => [
      Math.cos((i / 5) * Math.PI * 2) * 0.35,
      0.25 + i * 0.08,
      Math.sin((i / 5) * Math.PI * 2) * 0.35
    ] as [number, number, number]), []);

  return (
    <group>
      <group ref={hatRef} position={[0, 0.4, 0]}>
        <MiniTopHat scale={0.12} />
      </group>
      <group ref={orbitGroupRef}>
        {orbitPositions.map((pos, i) => (
          <group key={`diamond-${i}`} position={pos}>
            <Diamond scale={0.08} />
          </group>
        ))}
      </group>
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
  const finalTextureUrl = useMemo(() => {
    if (cornerSquareStyle === 'profile' && profilePicture) {
      const transformedUrl = getImageUrl(profilePicture);
      if (!transformedUrl) return textureUrl;
      return transformedUrl;
    }
    
    // Check if textureUrl is in gradient format (color1,color2)
    if (textureUrl && textureUrl.includes(',') && textureUrl.split(',').length === 2) {
      const colors = textureUrl.split(',').map(c => c.trim());
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (colors[0] && colors[1] && hexColorRegex.test(colors[0]) && hexColorRegex.test(colors[1])) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const gradient = ctx.createLinearGradient(0, 0, 256, 256);
          gradient.addColorStop(0, colors[0]);
          gradient.addColorStop(1, colors[1]);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 256, 256);
          return canvas.toDataURL('image/png');
        }
      }
    }
    
    // Check if textureUrl is a single hex color
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (textureUrl && hexColorRegex.test(textureUrl)) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return textureUrl;
      ctx.fillStyle = textureUrl;
      ctx.fillRect(0, 0, 256, 256);
      return canvas.toDataURL('image/png');
    }
    
    return textureUrl;
  }, [textureUrl, cornerSquareStyle, profilePicture]);

  if (!finalTextureUrl) return null;

  return (
    <TextureOverlayInner 
      textureUrl={finalTextureUrl} 
      size={size} 
      cornerSquareStyle={cornerSquareStyle}
    />
  );
}

function TextureOverlayInner({ textureUrl, size, cornerSquareStyle }: {
  textureUrl: string;
  size: number;
  cornerSquareStyle: 'property' | 'profile';
}) {
  const texture = useTexture(textureUrl);
  
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
  }, [texture]);

  // Memoize plane args
  const planeArgs = useMemo(() => [size * 0.85, size * 0.85] as [number, number], [size]);
  const planeArgsRegular = useMemo(() => [size * 0.9, size * 0.9] as [number, number], [size]);

  if (cornerSquareStyle === 'profile') {
    const material = useMemo(() => new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        brightness: { value: 1.5 },
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
        uniform float brightness;
        varying vec2 vUv;
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.48, 0.5, dist);
          vec4 texColor = texture2D(map, vUv);
          vec3 brightColor = texColor.rgb * brightness;
          gl_FragColor = vec4(brightColor, texColor.a * alpha);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
    }), [texture]);

    return (
      <mesh position={[0, tileThickness / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={planeArgs} />
        <primitive object={material} attach="material" />
      </mesh>
    );
  }

  return (
    <mesh position={[0, tileThickness / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={planeArgsRegular} />
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
  customPropertyCardBackground = null,
  profilePicture = null,
}: CornerTile3DProps) {

  // Memoize geometry args
  const baseGeoArgs = useMemo(() => [size, tileThickness, size] as const, [size]);
  const glowGeoArgs = useMemo(() => [size + 0.02, 0.02, size + 0.02] as const, [size]);

  const renderCornerContent = () => {
    switch (cornerType) {
      case 'go':
        return <CornerHatCoins />;
      case 'jail':
        return <CornerDiamonds />;
      case 'parking':
        return <CornerBills />;
      case 'gotojail':
        return <CornerCombined />;
      default:
        return null;
    }
  };

  const getTextureUrl = () => {
    if (cornerSquareStyle === 'profile' && profilePicture) {
      return profilePicture;
    }
    if (customPropertyCardBackground) {
      return customPropertyCardBackground;
    }
    return null;
  };

  const textureUrl = getTextureUrl();

  return (
    <group position={position}>
      {/* Base tile */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={baseGeoArgs} />
        <meshStandardMaterial color={COLORS.tileBase} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Purple edge glow */}
      <mesh position={[0, tileThickness / 2 + 0.01, 0]}>
        <boxGeometry args={glowGeoArgs} />
        <meshStandardMaterial
          color={COLORS.purpleLight}
          emissive={COLORS.purpleLight}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Dedicated lighting for profile pictures */}
      {cornerSquareStyle === 'profile' && profilePicture && (
        <pointLight 
          position={[0, 1.5, 0]} 
          intensity={1.2} 
          distance={3} 
          decay={1.5} 
          color="#ffffff" 
        />
      )}

      {/* Texture overlay (if any) */}
      {textureUrl && (
        <Suspense fallback={null}>
          <CornerTextureOverlay 
            textureUrl={textureUrl}
            size={size}
            cornerSquareStyle={cornerSquareStyle}
            profilePicture={profilePicture}
          />
        </Suspense>
      )}

      {/* Animated floating elements */}
      <group position={[0, tileThickness / 2, 0]}>
        {renderCornerContent()}
      </group>
    </group>
  );
}