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
  console.log(`[getSetIdFromColor] Input: "${colorClass}" -> SetId: ${result}, found in map: ${colorClass in colorToSetMap}`);
  
  return result;
}

// Color schemes for each property set
const SET_COLOR_SCHEMES: { [key: number]: { wall: number; roof: number; trim: number; door: number; accent: number } } = {
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

  console.log(`[House5_R3F] Received color prop: ${color}`);

  // Get colors based on property color (convert to setId first)
  const setId = getSetIdFromColor(color);
  console.log(`[House5_R3F] Converted color ${color} to setId: ${setId}`);
  
  const colors = SET_COLOR_SCHEMES[setId] ?? SET_COLOR_SCHEMES[0] ?? {
    wall: 0xE8D4B8, 
    roof: 0x78350f, 
    trim: 0xF5E6D3, 
    door: 0x4A2409, 
    accent: 0x8B4513
  };
  
  console.log(`[House5_R3F] Using color scheme for setId ${setId}:`, colors);

  useFrame(() => {
    if (!groupRef.current) return;
    
    scaleRef.current.target = isPulsing ? 1.15 : 1;
    scaleRef.current.current += (scaleRef.current.target - scaleRef.current.current) * 0.15;
    groupRef.current.scale.setScalar(scaleRef.current.current);
    
    groupRef.current.rotation.y = 0;
  });

  // Dimensions
  const mainWidth = 6.5;
  const mainHeight = 2.8;
  const mainDepth = 3.0;
  const mansardHeight = 0.9;
  const towerRadius = 0.55;
  const towerHeight = 4.0;

  // Roof calculations
  const roofBaseY = mainHeight;

  // Tower positions
  const towerPositions: [number, number][] = [
    [-mainWidth/2 - 0.15, mainDepth/2 + 0.15],
    [mainWidth/2 + 0.15, mainDepth/2 + 0.15],
    [-mainWidth/2 - 0.15, -mainDepth/2 - 0.15],
    [mainWidth/2 + 0.15, -mainDepth/2 - 0.15],
  ];

  // Window positions
  const windowPositions = [
    { x: -2.2, y: 1.0 }, { x: -2.2, y: 2.0 },
    { x: -1.3, y: 1.0 }, { x: -1.3, y: 2.0 },
    { x: 1.3, y: 1.0 }, { x: 1.3, y: 2.0 },
    { x: 2.2, y: 1.0 }, { x: 2.2, y: 2.0 },
  ];

  // Dormer positions
  const dormerPositions = [-2.2, -1.1, 0, 1.1, 2.2];

  // Entrance dimensions
  const entranceWidth = 1.6;
  const entranceHeight = 2.2;
  const entranceDepth = 0.7;
  const doorWidth = 0.5;
  const doorHeight = 1.7;
  const doorY = doorHeight/2 + 0.35;

  // Pediment shape
  const pedimentGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.9, 0);
    shape.lineTo(0.9, 0);
    shape.lineTo(0, 0.6);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  // Shield shape
  const shieldGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.12);
    shape.lineTo(0.08, 0.08);
    shape.lineTo(0.08, -0.02);
    shape.lineTo(0, -0.1);
    shape.lineTo(-0.08, -0.02);
    shape.lineTo(-0.08, 0.08);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  return (
    <group ref={groupRef} position={[0, 0.15, 0]} scale={0.28}>
      {/* ========== FOUNDATION ========== */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[mainWidth + 0.4, 0.3, mainDepth + 0.4]} />
        <meshStandardMaterial color={0x6B6B6B} roughness={0.9} />
      </mesh>

      {/* ========== MAIN BUILDING ========== */}
      <mesh position={[0, mainHeight / 2 + 0.3, 0]}>
        <boxGeometry args={[mainWidth, mainHeight, mainDepth]} />
        <meshStandardMaterial color={colors.wall} roughness={0.7} />
      </mesh>

      {/* Stone texture lines */}
      {[0.6, 1.1, 1.6, 2.1, 2.6].map((y, i) => (
        <mesh key={`line-${i}`} position={[0, y + 0.3, mainDepth/2 + 0.01]}>
          <boxGeometry args={[mainWidth + 0.02, 0.02, 0.05]} />
          <meshStandardMaterial color={colors.trim} roughness={0.5} />
        </mesh>
      ))}

      {/* ========== MANSARD ROOF ========== */}
      <mesh position={[0, mainHeight + mansardHeight/2 + 0.3, 0]}>
        <boxGeometry args={[mainWidth + 0.3, mansardHeight, mainDepth + 0.3]} />
        <meshStandardMaterial color={colors.roof} roughness={0.6} />
      </mesh>

      <mesh position={[0, mainHeight + mansardHeight + 0.55, 0]}>
        <boxGeometry args={[mainWidth - 0.4, 0.5, mainDepth - 0.4]} />
        <meshStandardMaterial color={colors.roof} roughness={0.6} />
      </mesh>

      {/* Roof ridge ornament */}
      <mesh position={[0, mainHeight + mansardHeight + 0.88, 0]}>
        <boxGeometry args={[mainWidth - 0.6, 0.15, 0.15]} />
        <meshStandardMaterial color={0x2A2A2A} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* ========== CORNER TOWERS ========== */}
      {towerPositions.map(([x, z], idx) => (
        <group key={`tower-${idx}`}>
          {/* Tower base */}
          <mesh position={[x, 0.5, z]}>
            <cylinderGeometry args={[towerRadius + 0.1, towerRadius + 0.15, 0.4, 16]} />
            <meshStandardMaterial color={colors.wall} roughness={0.7} />
          </mesh>

          {/* Tower body */}
          <mesh position={[x, towerHeight / 2 + 0.3, z]}>
            <cylinderGeometry args={[towerRadius, towerRadius + 0.05, towerHeight, 16]} />
            <meshStandardMaterial color={colors.wall} roughness={0.7} />
          </mesh>

          {/* Tower bands */}
          {[1.5, 2.5, 3.5].map((bandY, bi) => (
            <mesh key={`band-${bi}`} position={[x, bandY, z]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[towerRadius + 0.02, 0.03, 8, 24]} />
              <meshStandardMaterial color={colors.trim} roughness={0.5} />
            </mesh>
          ))}

          {/* Conical roof */}
          <mesh position={[x, towerHeight + 1.0, z]}>
            <coneGeometry args={[towerRadius + 0.2, 1.4, 16]} />
            <meshStandardMaterial color={colors.roof} roughness={0.6} />
          </mesh>

          {/* Roof overhang ring */}
          <mesh position={[x, towerHeight + 0.35, z]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[towerRadius + 0.22, 0.06, 8, 24]} />
            <meshStandardMaterial color={colors.roof} roughness={0.6} />
          </mesh>

          {/* Gold finial */}
          <mesh position={[x, towerHeight + 1.75, z]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color={0xD4AF37} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[x, towerHeight + 1.95, z]}>
            <coneGeometry args={[0.04, 0.2, 8]} />
            <meshStandardMaterial color={0xD4AF37} metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Tower windows */}
          {[1.2, 2.2, 3.2].map((wy, wi) => {
            const angle = z > 0 ? 0 : Math.PI;
            const winX = x + Math.sin(angle) * (towerRadius + 0.02);
            const winZ = z + Math.cos(angle) * (towerRadius + 0.02);
            return (
              <group key={`twin-${wi}`}>
                <mesh position={[winX, wy, winZ]} rotation={[0, angle, 0]}>
                  <boxGeometry args={[0.22, 0.4, 0.08]} />
                  <meshStandardMaterial color={colors.trim} roughness={0.5} />
                </mesh>
                <mesh position={[winX, wy, winZ]} rotation={[0, angle, 0]}>
                  <boxGeometry args={[0.18, 0.35, 0.05]} />
                  <meshStandardMaterial color={0xE8F4FF} emissive={0xFFFFCC} emissiveIntensity={0.2} roughness={0.1} />
                </mesh>
              </group>
            );
          })}

          {/* Flag on front towers */}
          {z > 0 && (
            <group>
              <mesh position={[x, towerHeight + 2.3, z]}>
                <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
                <meshStandardMaterial color={0x2A2A2A} metalness={0.7} roughness={0.4} />
              </mesh>
              <mesh position={[x + 0.19, towerHeight + 2.45, z]}>
                <boxGeometry args={[0.35, 0.22, 0.02]} />
                <meshStandardMaterial color={colors.accent} side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* ========== DORMERS ========== */}
      {dormerPositions.map((dx, i) => (
        <group key={`dormer-${i}`}>
          <mesh position={[dx, mainHeight + 0.6, mainDepth/2 + 0.35]}>
            <boxGeometry args={[0.55, 0.55, 0.45]} />
            <meshStandardMaterial color={colors.wall} roughness={0.7} />
          </mesh>
          <mesh position={[dx, mainHeight + 1.1, mainDepth/2 + 0.35]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.38, 0.45, 4]} />
            <meshStandardMaterial color={colors.roof} roughness={0.6} />
          </mesh>
          <mesh position={[dx, mainHeight + 1.36, mainDepth/2 + 0.35]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color={0xD4AF37} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[dx, mainHeight + 0.55, mainDepth/2 + 0.57]}>
            <boxGeometry args={[0.38, 0.44, 0.06]} />
            <meshStandardMaterial color={colors.trim} roughness={0.5} />
          </mesh>
          <mesh position={[dx, mainHeight + 0.55, mainDepth/2 + 0.58]}>
            <boxGeometry args={[0.32, 0.38, 0.08]} />
            <meshStandardMaterial color={0xE8F4FF} emissive={0xFFFFCC} emissiveIntensity={0.2} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* ========== GRAND ENTRANCE ========== */}
      <mesh position={[0, entranceHeight/2 + 0.3, mainDepth/2 + entranceDepth/2]}>
        <boxGeometry args={[entranceWidth, entranceHeight, entranceDepth]} />
        <meshStandardMaterial color={colors.wall} roughness={0.7} />
      </mesh>

      {/* Entrance columns */}
      {([-0.55, 0.55] as const).map((cx, i) => (
        <group key={`col-${i}`}>
          <mesh position={[cx, 0.4, mainDepth/2 + entranceDepth + 0.15]}>
            <boxGeometry args={[0.25, 0.2, 0.25]} />
            <meshStandardMaterial color={colors.trim} roughness={0.5} />
          </mesh>
          <mesh position={[cx, 1.3, mainDepth/2 + entranceDepth + 0.15]}>
            <cylinderGeometry args={[0.08, 0.1, 1.6, 12]} />
            <meshStandardMaterial color={colors.trim} roughness={0.5} />
          </mesh>
          <mesh position={[cx, 2.18, mainDepth/2 + entranceDepth + 0.15]}>
            <boxGeometry args={[0.22, 0.15, 0.22]} />
            <meshStandardMaterial color={colors.trim} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Entrance pediment */}
      <mesh geometry={pedimentGeo} position={[0, entranceHeight + 0.35, mainDepth/2 + entranceDepth + 0.01]}>
        <meshStandardMaterial color={colors.wall} roughness={0.7} />
      </mesh>
      <mesh position={[0, entranceHeight + 0.35, mainDepth/2 + entranceDepth + 0.02]}>
        <boxGeometry args={[1.85, 0.08, 0.1]} />
        <meshStandardMaterial color={colors.trim} roughness={0.5} />
      </mesh>

      {/* Coat of arms */}
      <mesh position={[0, entranceHeight + 0.6, mainDepth/2 + entranceDepth + 0.02]}>
        <circleGeometry args={[0.18, 16]} />
        <meshStandardMaterial color={0xD4AF37} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh geometry={shieldGeo} position={[0, entranceHeight + 0.58, mainDepth/2 + entranceDepth + 0.03]}>
        <meshStandardMaterial color={colors.accent} />
      </mesh>

      {/* Door arch */}
      <mesh position={[0, doorHeight + 0.5, mainDepth/2 + entranceDepth + 0.05]}>
        <boxGeometry args={[1.2, 0.15, 0.15]} />
        <meshStandardMaterial color={colors.wall} roughness={0.7} />
      </mesh>
      <mesh position={[0, doorHeight + 0.7, mainDepth/2 + entranceDepth + 0.05]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.6, 0.4, 4]} />
        <meshStandardMaterial color={colors.wall} roughness={0.7} />
      </mesh>

      {/* Double doors */}
      {([-0.28, 0.28] as const).map((doorX, di) => (
        <group key={`door-${di}`}>
          <mesh position={[doorX, doorY, mainDepth/2 + entranceDepth + 0.04]}>
            <boxGeometry args={[doorWidth + 0.06, doorHeight + 0.06, 0.08]} />
            <meshStandardMaterial color={colors.trim} roughness={0.5} />
          </mesh>
          <mesh position={[doorX, doorY, mainDepth/2 + entranceDepth + 0.05]}>
            <boxGeometry args={[doorWidth, doorHeight, 0.1]} />
            <meshStandardMaterial color={colors.door} roughness={0.4} />
          </mesh>
          {/* Door panels */}
          {([-0.4, 0, 0.4] as const).map((panelY, pi) => (
            <mesh key={`panel-${pi}`} position={[doorX, doorY + panelY, mainDepth/2 + entranceDepth + 0.12]}>
              <boxGeometry args={[doorWidth - 0.12, 0.35, 0.03]} />
              <meshStandardMaterial color={colors.door} roughness={0.3} />
            </mesh>
          ))}
          {/* Iron studs */}
          {[-0.6, -0.3, 0, 0.3, 0.6].map((sy) => 
            [-0.15, 0, 0.15].map((sx, sxi) => (
              <mesh key={`stud-${sy}-${sxi}`} position={[doorX + sx, doorY + sy, mainDepth/2 + entranceDepth + 0.16]}>
                <sphereGeometry args={[0.025, 6, 6]} />
                <meshStandardMaterial color={0x2A2A2A} metalness={0.7} roughness={0.4} />
              </mesh>
            ))
          )}
          {/* Door ring handle */}
          <mesh position={[doorX + (di === 0 ? 0.15 : -0.15), doorY, mainDepth/2 + entranceDepth + 0.17]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.06, 0.012, 8, 16]} />
            <meshStandardMaterial color={0xD4AF37} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[doorX + (di === 0 ? 0.15 : -0.15), doorY + 0.06, mainDepth/2 + entranceDepth + 0.15]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.03, 8]} />
            <meshStandardMaterial color={0xD4AF37} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Portcullis grate */}
      {[-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45].map((px, i) => (
        <mesh key={`grate-${i}`} position={[px, doorHeight + 0.35, mainDepth/2 + entranceDepth + 0.1]}>
          <boxGeometry args={[0.02, 0.3, 0.02]} />
          <meshStandardMaterial color={0x2A2A2A} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, doorHeight + 0.35, mainDepth/2 + entranceDepth + 0.1]}>
        <boxGeometry args={[0.95, 0.02, 0.02]} />
        <meshStandardMaterial color={0x2A2A2A} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* ========== GRAND STAIRCASE ========== */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={`step-${i}`} position={[0, 0.05 + i * 0.1, mainDepth/2 + entranceDepth + 0.5 + (4-i) * 0.28]}>
          <boxGeometry args={[2.2 - i * 0.1, 0.1, 0.28]} />
          <meshStandardMaterial color={0xA0A0A0} roughness={0.7} />
        </mesh>
      ))}

      {/* ========== MAIN WINDOWS ========== */}
      {windowPositions.map((wp, i) => (
        <group key={`window-${i}`}>
          <mesh position={[wp.x, wp.y + 0.3, mainDepth/2 + 0.01]}>
            <boxGeometry args={[0.55, 0.75, 0.06]} />
            <meshStandardMaterial color={colors.trim} roughness={0.5} />
          </mesh>
          <mesh position={[wp.x, wp.y + 0.3, mainDepth/2 + 0.04]}>
            <boxGeometry args={[0.45, 0.65, 0.04]} />
            <meshStandardMaterial color={0xE8F4FF} emissive={0xFFFFCC} emissiveIntensity={0.2} roughness={0.1} />
          </mesh>
          {/* Cross bars */}
          <mesh position={[wp.x, wp.y + 0.3, mainDepth/2 + 0.06]}>
            <boxGeometry args={[0.45, 0.025, 0.02]} />
            <meshStandardMaterial color={colors.trim} roughness={0.5} />
          </mesh>
          <mesh position={[wp.x, wp.y + 0.3, mainDepth/2 + 0.06]}>
            <boxGeometry args={[0.025, 0.65, 0.02]} />
            <meshStandardMaterial color={colors.trim} roughness={0.5} />
          </mesh>
          {/* Header */}
          <mesh position={[wp.x, wp.y + 0.68, mainDepth/2 + 0.04]}>
            <boxGeometry args={[0.6, 0.08, 0.08]} />
            <meshStandardMaterial color={colors.trim} roughness={0.5} />
          </mesh>
          {/* Sill */}
          <mesh position={[wp.x, wp.y - 0.08, mainDepth/2 + 0.06]}>
            <boxGeometry args={[0.58, 0.05, 0.12]} />
            <meshStandardMaterial color={colors.trim} roughness={0.5} />
          </mesh>
          {/* Shutters */}
          {([-0.32, 0.32] as const).map((sx, si) => (
            <mesh key={`shutter-${si}`} position={[wp.x + sx, wp.y + 0.3, mainDepth/2 + 0.04]}>
              <boxGeometry args={[0.12, 0.68, 0.04]} />
              <meshStandardMaterial color={colors.roof} roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ========== SIDE WINDOWS ========== */}
      {([-1, 1] as const).map((side) => {
        const sideX = side * (mainWidth / 2 + 0.01);
        return [-0.5, 0.5].map((wz) => 
          [1.0, 2.0].map((wy, wi) => (
            <group key={`side-win-${side}-${wz}-${wi}`}>
              <mesh position={[sideX, wy + 0.3, wz]}>
                <boxGeometry args={[0.06, 0.7, 0.5]} />
                <meshStandardMaterial color={colors.trim} roughness={0.5} />
              </mesh>
              <mesh position={[sideX + side * 0.02, wy + 0.3, wz]}>
                <boxGeometry args={[0.04, 0.6, 0.4]} />
                <meshStandardMaterial color={0xE8F4FF} emissive={0xFFFFCC} emissiveIntensity={0.2} roughness={0.1} />
              </mesh>
              {/* Cross bars */}
              <mesh position={[sideX + side * 0.03, wy + 0.3, wz]}>
                <boxGeometry args={[0.02, 0.02, 0.4]} />
                <meshStandardMaterial color={colors.trim} roughness={0.5} />
              </mesh>
              <mesh position={[sideX + side * 0.03, wy + 0.3, wz]}>
                <boxGeometry args={[0.02, 0.6, 0.02]} />
                <meshStandardMaterial color={colors.trim} roughness={0.5} />
              </mesh>
              {/* Shutters */}
              {([-0.28, 0.28] as const).map((sz, si) => (
                <mesh key={`side-shutter-${si}`} position={[sideX + side * 0.02, wy + 0.3, wz + sz]}>
                  <boxGeometry args={[0.04, 0.65, 0.12]} />
                  <meshStandardMaterial color={colors.roof} roughness={0.6} />
                </mesh>
              ))}
            </group>
          ))
        );
      })}

      {/* ========== BACK WINDOWS ========== */}
      {([-2.2, -0.8, 0.8, 2.2] as const).map((wx) => 
        [1.0, 2.0].map((wy, wi) => (
          <group key={`back-win-${wx}-${wi}`}>
            <mesh position={[wx, wy + 0.3, -mainDepth/2 - 0.01]}>
              <boxGeometry args={[0.5, 0.7, 0.06]} />
              <meshStandardMaterial color={colors.trim} roughness={0.5} />
            </mesh>
            <mesh position={[wx, wy + 0.3, -mainDepth/2 - 0.03]}>
              <boxGeometry args={[0.4, 0.6, 0.04]} />
              <meshStandardMaterial color={0xE8F4FF} emissive={0xFFFFCC} emissiveIntensity={0.2} roughness={0.1} />
            </mesh>
            {/* Cross bars */}
            <mesh position={[wx, wy + 0.3, -mainDepth/2 - 0.04]}>
              <boxGeometry args={[0.4, 0.02, 0.02]} />
              <meshStandardMaterial color={colors.trim} roughness={0.5} />
            </mesh>
            <mesh position={[wx, wy + 0.3, -mainDepth/2 - 0.04]}>
              <boxGeometry args={[0.02, 0.6, 0.02]} />
              <meshStandardMaterial color={colors.trim} roughness={0.5} />
            </mesh>
            {/* Shutters */}
            {([-0.28, 0.28] as const).map((sx, si) => (
              <mesh key={`back-shutter-${si}`} position={[wx + sx, wy + 0.3, -mainDepth/2 - 0.03]}>
                <boxGeometry args={[0.12, 0.65, 0.04]} />
                <meshStandardMaterial color={colors.roof} roughness={0.6} />
              </mesh>
            ))}
          </group>
        ))
      )}

      {/* ========== DECORATIVE PLANTS ========== */}
      {([-1.3, 1.3] as const).map((px, i) => (
        <group key={`plant-${i}`}>
          <mesh position={[px, 0.35, mainDepth/2 + 0.8]}>
            <cylinderGeometry args={[0.12, 0.15, 0.1, 12]} />
            <meshStandardMaterial color={colors.wall} roughness={0.7} />
          </mesh>
          <mesh position={[px, 0.58, mainDepth/2 + 0.8]}>
            <cylinderGeometry args={[0.15, 0.1, 0.35, 12]} />
            <meshStandardMaterial color={colors.wall} roughness={0.7} />
          </mesh>
          <mesh position={[px, 0.78, mainDepth/2 + 0.8]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.15, 0.03, 8, 16]} />
            <meshStandardMaterial color={colors.wall} roughness={0.7} />
          </mesh>
          <mesh position={[px, 0.98, mainDepth/2 + 0.8]}>
            <sphereGeometry args={[0.2, 8, 6]} />
            <meshStandardMaterial color={0x228B22} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ========== CHIMNEYS ========== */}
      {([-2.0, 2.0] as const).map((cx, i) => (
        <group key={`chimney-${i}`}>
          <mesh position={[cx, mainHeight + mansardHeight + 1.0, 0]}>
            <boxGeometry args={[0.4, 0.9, 0.4]} />
            <meshStandardMaterial color={colors.wall} roughness={0.7} />
          </mesh>
          <mesh position={[cx, mainHeight + mansardHeight + 1.5, 0]}>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
            <meshStandardMaterial color={colors.wall} roughness={0.7} />
          </mesh>
          {([-0.1, 0.1] as const).map((potX, pi) => (
            <mesh key={`pot-${pi}`} position={[cx + potX, mainHeight + mansardHeight + 1.65, 0]}>
              <cylinderGeometry args={[0.06, 0.08, 0.2, 8]} />
              <meshStandardMaterial color={0x8B4513} roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ========== LANTERNS ========== */}
      {([-0.75, 0.75] as const).map((lx, i) => (
        <group key={`lantern-${i}`}>
          <mesh position={[lx, 1.8, mainDepth/2 + entranceDepth + 0.25]}>
            <boxGeometry args={[0.15, 0.03, 0.2]} />
            <meshStandardMaterial color={0x2A2A2A} metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[lx, 1.65, mainDepth/2 + entranceDepth + 0.35]}>
            <boxGeometry args={[0.12, 0.2, 0.12]} />
            <meshStandardMaterial color={0x1a1a1a} metalness={0.5} />
          </mesh>
          <mesh position={[lx, 1.65, mainDepth/2 + entranceDepth + 0.35]}>
            <boxGeometry args={[0.08, 0.14, 0.08]} />
            <meshStandardMaterial color={0xFFDD77} emissive={0xFFAA33} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[lx, 1.8, mainDepth/2 + entranceDepth + 0.35]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.08, 0.1, 4]} />
            <meshStandardMaterial color={0x2A2A2A} metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}