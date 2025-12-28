'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface House5_R3FProps {
  isPulsing?: boolean;
  color?: string;
}

// Convert Tailwind color class to setId mapping (same as property color to setId)
function getSetIdFromColor(colorClass: string): number {
  const colorToSetMap: { [key: string]: number } = {
    'bg-amber-900': 0,   // Brown
    'bg-sky-300': 1,     // Light Blue  
    'bg-pink-400': 2,    // Pink
    'bg-orange-500': 3,  // Orange
    'bg-red-600': 4,     // Red
    'bg-yellow-400': 5,  // Yellow (original)
    'bg-yellow-500': 5,  // Yellow (actual property color)
    'bg-green-600': 6,   // Green
    'bg-blue-900': 7,    // Dark Blue
  };
  
  const result = colorToSetMap[colorClass] ?? 0;
  return result;
}

// Color schemes for each property set
type ColorScheme = { wall: number; roof: number; trim: number; door: number; accent: number };

const SET_COLOR_SCHEMES: { [key: number]: ColorScheme } = {
  0: { wall: 0xE8D4B8, roof: 0x78350f, trim: 0xF5E6D3, door: 0x4A2409, accent: 0x8B4513 }, // Brown
  1: { wall: 0xF0F8FF, roof: 0x4A90A4, trim: 0xFFFFFF, door: 0x2C5F7C, accent: 0x7dd3fc }, // Light Blue
  2: { wall: 0xFFF0F5, roof: 0x9B4D6A, trim: 0xFFE4EC, door: 0x6B2D4A, accent: 0xf472b6 }, // Pink
  3: { wall: 0xFFF5E6, roof: 0xC75B20, trim: 0xFFEDD5, door: 0x8B4513, accent: 0xf97316 }, // Orange
  4: { wall: 0xFFF5F5, roof: 0x8B1A1A, trim: 0xFFE8E8, door: 0x5C1010, accent: 0xdc2626 }, // Red
  5: { wall: 0xFFFDF0, roof: 0xB8960B, trim: 0xFFF8DC, door: 0x6B5B00, accent: 0xfacc15 }, // Yellow
  6: { wall: 0xF5FFF5, roof: 0x2D5A2D, trim: 0xE8F5E8, door: 0x1A3A1A, accent: 0x16a34a }, // Green
  7: { wall: 0xF0F4FF, roof: 0x1e3a8a, trim: 0xE8EEFF, door: 0x0F1D45, accent: 0x3b82f6 }, // Dark Blue
};

export function House5_R3F({ isPulsing = false, color = 'bg-purple-500' }: House5_R3FProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef({ current: 1, target: 1 });

  // House5 mansion dimensions
  const mainWidth = 6.5;
  const mainHeight = 2.8;
  const mainDepth = 3.0;
  const mansardHeight = 0.9;
  const towerRadius = 0.55;
  const towerHeight = 4.0;
  const hw = mainWidth / 2;
  const hd = mainDepth / 2;

  // Tower positions
  const towerPositions: [number, number][] = useMemo(() => [
    [-hw - 0.15, hd + 0.15],
    [hw + 0.15, hd + 0.15],
    [-hw - 0.15, -hd - 0.15],
    [hw + 0.15, -hd - 0.15],
  ], [hw, hd]);

  // Get colors based on property color
  const setId = getSetIdFromColor(color);
  const colorScheme: ColorScheme = SET_COLOR_SCHEMES[setId] ?? SET_COLOR_SCHEMES[0]!;


  // Entrance structure dimensions
  const entranceWidth = 1.6;
  const entranceHeight = 2.2;
  const entranceDepth = 0.7;

  useFrame(() => {
    if (!groupRef.current) return;
    
    scaleRef.current.target = isPulsing ? 1.15 : 1;
    scaleRef.current.current += (scaleRef.current.target - scaleRef.current.current) * 0.15;
    groupRef.current.scale.setScalar(scaleRef.current.current);
  });

  return (
    <group ref={groupRef} position={[0, 0.15, 0]} scale={0.28}>
      {/* WALLS */}
      {/* Foundation */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[mainWidth + 0.4, 0.3, mainDepth + 0.4]} />
        <meshStandardMaterial color={colorScheme.wall} roughness={0.85} metalness={0.0} />
      </mesh>

      {/* Main building */}
      <mesh position={[0, mainHeight / 2 + 0.3, 0]}>
        <boxGeometry args={[mainWidth, mainHeight, mainDepth]} />
        <meshStandardMaterial color={colorScheme.wall} roughness={0.85} metalness={0.0} />
      </mesh>

      {/* Stone texture lines (horizontal bands) */}
      {[0.6, 1.1, 1.6, 2.1, 2.6].map((y, i) => (
        <mesh key={`band-${i}`} position={[0, y + 0.3, hd + 0.01]}>
          <boxGeometry args={[mainWidth + 0.02, 0.02, 0.05]} />
          <meshStandardMaterial color={colorScheme.trim} roughness={0.7} metalness={0.0} />
        </mesh>
      ))}

      {/* Corner towers */}
      {towerPositions.map(([x, z], i) => (
        <group key={`tower-${i}`}>
          {/* Tower base */}
          <mesh position={[x, 0.5, z]}>
            <cylinderGeometry args={[towerRadius + 0.15, towerRadius + 0.1, 0.4, 16]} />
            <meshStandardMaterial color={colorScheme.wall} roughness={0.85} metalness={0.0} />
          </mesh>
          {/* Tower body */}
          <mesh position={[x, towerHeight / 2 + 0.3, z]}>
            <cylinderGeometry args={[towerRadius + 0.05, towerRadius, towerHeight, 16]} />
            <meshStandardMaterial color={colorScheme.wall} roughness={0.85} metalness={0.0} />
          </mesh>
        </group>
      ))}

      {/* Entrance structure */}
      <mesh position={[0, entranceHeight / 2 + 0.3, hd + entranceDepth / 2]}>
        <boxGeometry args={[entranceWidth, entranceHeight, entranceDepth]} />
        <meshStandardMaterial color={colorScheme.wall} roughness={0.85} metalness={0.0} />
      </mesh>

      {/* ROOF */}
      {/* Mansard roof */}
      <mesh position={[0, mainHeight + mansardHeight / 2 + 0.3, 0]}>
        <boxGeometry args={[mainWidth + 0.3, mansardHeight, mainDepth + 0.3]} />
        <meshStandardMaterial color={colorScheme.roof} roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[0, mainHeight + mansardHeight + 0.55, 0]}>
        <boxGeometry args={[mainWidth - 0.4, 0.5, mainDepth - 0.4]} />
        <meshStandardMaterial color={colorScheme.roof} roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Roof ridge ornament */}
      <mesh position={[0, mainHeight + mansardHeight + 0.88, 0]}>
        <boxGeometry args={[mainWidth - 0.6, 0.15, 0.15]} />
        <meshStandardMaterial color={0xFFD700} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Tower conical roofs */}
      {towerPositions.map(([x, z], i) => (
        <group key={`tower-roof-${i}`}>
          <mesh position={[x, towerHeight + 1.0, z]}>
            <coneGeometry args={[towerRadius + 0.2, 1.4, 16]} />
            <meshStandardMaterial color={colorScheme.roof} roughness={0.6} metalness={0.1} />
          </mesh>
          {/* Roof overhang ring */}
          <mesh position={[x, towerHeight + 0.35, z]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[towerRadius + 0.22, 0.06, 8, 24]} />
            <meshStandardMaterial color={colorScheme.roof} roughness={0.6} metalness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Dormers */}
      {[-2.2, -1.1, 0, 1.1, 2.2].map((dx, i) => (
        <group key={`dormer-${i}`}>
          {/* Dormer body */}
          <mesh position={[dx, mainHeight + 0.65, hd + 0.25]}>
            <boxGeometry args={[0.5, 0.7, 0.5]} />
            <meshStandardMaterial color={colorScheme.wall} roughness={0.85} metalness={0.0} />
          </mesh>
          {/* Dormer roof */}
          <mesh position={[dx, mainHeight + 1.1, hd + 0.35]}>
            <coneGeometry args={[0.38, 0.45, 4]} />
            <meshStandardMaterial color={colorScheme.roof} roughness={0.6} metalness={0.1} />
          </mesh>
        </group>
      ))}

      {/* TRIM */}
      {/* Tower bands */}
      {towerPositions.map(([x, z], i) => (
        <group key={`tower-bands-${i}`}>
          {[1.5, 2.5, 3.5].map((bandY, j) => (
            <mesh key={`band-${j}`} position={[x, bandY, z]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[towerRadius + 0.02, 0.03, 8, 24]} />
              <meshStandardMaterial color={colorScheme.trim} roughness={0.7} metalness={0.0} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Entrance columns */}
      {[-0.55, 0.55].map((cx, i) => (
        <group key={`column-${i}`}>
          {/* Column base */}
          <mesh position={[cx, 0.4, hd + entranceDepth + 0.15]}>
            <boxGeometry args={[0.25, 0.2, 0.25]} />
            <meshStandardMaterial color={colorScheme.trim} roughness={0.7} metalness={0.0} />
          </mesh>
          {/* Column shaft */}
          <mesh position={[cx, 1.3, hd + entranceDepth + 0.15]}>
            <cylinderGeometry args={[0.1, 0.08, 1.6, 12]} />
            <meshStandardMaterial color={colorScheme.trim} roughness={0.7} metalness={0.0} />
          </mesh>
          {/* Column capital */}
          <mesh position={[cx, 2.18, hd + entranceDepth + 0.15]}>
            <boxGeometry args={[0.22, 0.15, 0.22]} />
            <meshStandardMaterial color={colorScheme.trim} roughness={0.7} metalness={0.0} />
          </mesh>
        </group>
      ))}

      {/* Entrance pediment */}
      <mesh position={[0, entranceHeight + 0.35, hd + entranceDepth + 0.02]}>
        <boxGeometry args={[1.85, 0.08, 0.1]} />
        <meshStandardMaterial color={colorScheme.trim} roughness={0.7} metalness={0.0} />
      </mesh>

      {/* Door frame */}
      <mesh position={[0, 1.5, hd + entranceDepth + 0.05]}>
        <boxGeometry args={[1.2, 0.15, 0.15]} />
        <meshStandardMaterial color={colorScheme.trim} roughness={0.7} metalness={0.0} />
      </mesh>

      {/* Double doors */}
      <mesh position={[-0.27, 0.9, hd + entranceDepth + 0.06]}>
        <boxGeometry args={[0.45, 1.7, 0.08]} />
        <meshStandardMaterial color={colorScheme.door} roughness={0.8} metalness={0.0} />
      </mesh>
      <mesh position={[0.27, 0.9, hd + entranceDepth + 0.06]}>
        <boxGeometry args={[0.45, 1.7, 0.08]} />
        <meshStandardMaterial color={colorScheme.door} roughness={0.8} metalness={0.0} />
      </mesh>

      {/* ACCENTS (windows, finials, decorations) */}
      {/* Main building windows (8 windows in 2 rows) */}
      {[
        { x: -2.2, y: 1.0 }, { x: -2.2, y: 2.0 },
        { x: -1.3, y: 1.0 }, { x: -1.3, y: 2.0 },
        { x: 1.3, y: 1.0 }, { x: 1.3, y: 2.0 },
        { x: 2.2, y: 1.0 }, { x: 2.2, y: 2.0 },
      ].map(({ x, y }, i) => (
        <group key={`window-${i}`}>
          {/* Window frame */}
          <mesh position={[x, y + 0.3, hd + 0.01]}>
            <boxGeometry args={[0.42, 0.55, 0.06]} />
            <meshStandardMaterial color={colorScheme.trim} roughness={0.7} metalness={0.0} />
          </mesh>
          {/* Window glass */}
          <mesh position={[x, y + 0.3, hd + 0.02]}>
            <boxGeometry args={[0.36, 0.48, 0.02]} />
            <meshStandardMaterial color={0x87CEEB} roughness={0.1} metalness={0.2} transparent opacity={0.6} />
          </mesh>
        </group>
      ))}

      {/* Tower finials (gold balls and spikes) */}
      {towerPositions.map(([x, z], i) => (
        <group key={`finial-${i}`}>
          <mesh position={[x, towerHeight + 1.75, z]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color={0xFFD700} roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[x, towerHeight + 1.95, z]}>
            <coneGeometry args={[0.04, 0.2, 8]} />
            <meshStandardMaterial color={0xFFD700} roughness={0.3} metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Dormer windows */}
      {[-2.2, -1.1, 0, 1.1, 2.2].map((dx, i) => (
        <mesh key={`dormer-window-${i}`} position={[dx, mainHeight + 0.55, hd + 0.58]}>
          <boxGeometry args={[0.32, 0.38, 0.08]} />
          <meshStandardMaterial color={0x87CEEB} roughness={0.1} metalness={0.2} transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Coat of arms on entrance */}
      <mesh position={[0, entranceHeight + 0.6, hd + entranceDepth + 0.02]}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
        <meshStandardMaterial color={0xFFD700} roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  );
}