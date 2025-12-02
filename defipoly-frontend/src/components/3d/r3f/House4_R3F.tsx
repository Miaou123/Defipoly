'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface House4_R3FProps {
  isPulsing?: boolean;
}

export function House4_R3F({ isPulsing = false }: House4_R3FProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef({ current: 1, target: 1 });

  useFrame((state) => {
    if (!groupRef.current) return;
    
    scaleRef.current.target = isPulsing ? 1.15 : 1;
    scaleRef.current.current += (scaleRef.current.target - scaleRef.current.current) * 0.15;
    groupRef.current.scale.setScalar(scaleRef.current.current);
    
    groupRef.current.rotation.y = 0;
  });

  // Dimensions
  const mainWidth = 4.5;
  const mainHeight = 2.2;
  const mainDepth = 2.8;
  const roofHeight = 1.0;
  const roofOverhang = 0.25;

  // Roof calculations
  const roofW = mainWidth / 2 + roofOverhang;
  const roofD = mainDepth / 2 + roofOverhang;
  const roofBaseY = mainHeight;
  const roofPeakY = roofBaseY + roofHeight;

  // Roof geometries
  const leftRoofGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      0, roofPeakY, -roofD, -roofW, roofBaseY, -roofD, -roofW, roofBaseY, roofD,
      0, roofPeakY, -roofD, -roofW, roofBaseY, roofD, 0, roofPeakY, roofD,
    ]), 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  const rightRoofGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      0, roofPeakY, -roofD, 0, roofPeakY, roofD, roofW, roofBaseY, roofD,
      0, roofPeakY, -roofD, roofW, roofBaseY, roofD, roofW, roofBaseY, -roofD,
    ]), 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Pediment geometry
  const pedimentGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-roofW, 0);
    shape.lineTo(roofW, 0);
    shape.lineTo(0, roofHeight);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  // Window dimensions
  const windowWidth = 0.4;
  const windowHeight = 0.55;
  const firstFloorY = 0.75;
  const secondFloorY = mainHeight * 0.55 + 0.5;

  // Door dimensions
  const doorWidth = 0.7;
  const doorHeight = 1.3;
  const doorY = doorHeight / 2 + 0.1;

  // Column positions
  const columnPositions = [-1.8, -1.1, -0.4, 0.4, 1.1, 1.8];
  const columnHeight = mainHeight - 0.3;

  // Window X positions
  const windowXPositions = [-1.6, -0.9, 0.9, 1.6];

  return (
    <group ref={groupRef} position={[0, 0.15, 0]} scale={0.25}>
      {/* ========== FOUNDATION ========== */}
      <mesh position={[0, 0.125, 0]}>
        <boxGeometry args={[mainWidth + 0.3, 0.25, mainDepth + 0.3]} />
        <meshStandardMaterial color={0xD3D3D3} roughness={0.8} />
      </mesh>

      {/* ========== MAIN HOUSE BODY ========== */}
      <mesh position={[0, mainHeight / 2 + 0.25, 0]}>
        <boxGeometry args={[mainWidth, mainHeight, mainDepth]} />
        <meshStandardMaterial color={0xF5E6C8} roughness={0.6} />
      </mesh>

      {/* ========== ROOF ========== */}
      <mesh geometry={leftRoofGeo} position={[0, 0.25, 0]}>
        <meshStandardMaterial color={0x2F3542} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={rightRoofGeo} position={[0, 0.25, 0]}>
        <meshStandardMaterial color={0x2F3542} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* ========== PEDIMENTS ========== */}
      <mesh geometry={pedimentGeo} position={[0, roofBaseY + 0.25, roofD + 0.01]}>
        <meshStandardMaterial color={0xF5E6C8} roughness={0.6} />
      </mesh>
      <mesh geometry={pedimentGeo} position={[0, roofBaseY + 0.25, -roofD - 0.01]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial color={0xF5E6C8} roughness={0.6} />
      </mesh>

      {/* Pediment trim */}
      <mesh position={[0, roofBaseY + 0.25, roofD + 0.05]}>
        <boxGeometry args={[mainWidth + 0.5, 0.08, 0.1]} />
        <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
      </mesh>

      {/* Medallion */}
      <mesh position={[0, roofBaseY + roofHeight * 0.45 + 0.25, roofD + 0.02]}>
        <circleGeometry args={[0.25, 24]} />
        <meshStandardMaterial color={0xFFFDF5} roughness={0.3} />
      </mesh>
      <mesh position={[0, roofBaseY + roofHeight * 0.45 + 0.25, roofD + 0.03]}>
        <ringGeometry args={[0.12, 0.18, 24]} />
        <meshStandardMaterial color={0xD4AF37} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ========== COLUMNS ========== */}
      {columnPositions.map((x, i) => (
        <group key={`column-${i}`}>
          {/* Column shaft */}
          <mesh position={[x, columnHeight / 2 + 0.35, mainDepth / 2 + 0.35]}>
            <cylinderGeometry args={[0.1, 0.11, columnHeight, 16]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.4} />
          </mesh>
          {/* Column base */}
          <mesh position={[x, 0.32, mainDepth / 2 + 0.35]}>
            <boxGeometry args={[0.3, 0.15, 0.3]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>
          {/* Column capital */}
          <mesh position={[x, columnHeight + 0.35, mainDepth / 2 + 0.35]}>
            <boxGeometry args={[0.28, 0.12, 0.28]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>
          {/* Capital detail */}
          <mesh position={[x, columnHeight + 0.44, mainDepth / 2 + 0.35]}>
            <boxGeometry args={[0.32, 0.05, 0.32]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* ========== PORTICO ========== */}
      <mesh position={[0, mainHeight + 0.2, mainDepth / 2 + 0.35]}>
        <boxGeometry args={[mainWidth + 0.2, 0.15, 0.9]} />
        <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
      </mesh>

      {/* Dentil molding */}
      {Array.from({ length: 21 }, (_, i) => i - 10).map((i) => (
        <mesh key={`dentil-${i}`} position={[i * 0.2, mainHeight + 0.08, mainDepth / 2 + 0.75]}>
          <boxGeometry args={[0.08, 0.06, 0.08]} />
          <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
        </mesh>
      ))}

      {/* ========== BALCONY ========== */}
      <mesh position={[0, mainHeight * 0.55 + 0.25, mainDepth / 2 + 0.55]}>
        <boxGeometry args={[2.5, 0.08, 0.5]} />
        <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
      </mesh>
      <mesh position={[0, mainHeight * 0.55 + 0.55, mainDepth / 2 + 0.75]}>
        <boxGeometry args={[2.5, 0.05, 0.05]} />
        <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
      </mesh>

      {/* Balcony balusters */}
      {Array.from({ length: 13 }, (_, i) => i - 6).map((i) => (
        <mesh key={`baluster-${i}`} position={[i * 0.18, mainHeight * 0.55 + 0.42, mainDepth / 2 + 0.75]}>
          <cylinderGeometry args={[0.02, 0.02, 0.25, 8]} />
          <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
        </mesh>
      ))}

      {/* Balcony door */}
      <mesh position={[0, mainHeight * 0.55 + 0.75, mainDepth / 2 + 0.01]}>
        <boxGeometry args={[0.9, 1.1, 0.04]} />
        <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
      </mesh>
      <mesh position={[0, mainHeight * 0.55 + 0.75, mainDepth / 2 + 0.02]}>
        <boxGeometry args={[0.8, 1.0, 0.06]} />
        <meshStandardMaterial color={0xE8F4FF} emissive={0xFFFFCC} emissiveIntensity={0.15} roughness={0.1} />
      </mesh>

      {/* ========== FIRST FLOOR WINDOWS ========== */}
      {windowXPositions.map((x, i) => (
        <group key={`window-1f-${i}`}>
          {/* Frame */}
          <mesh position={[x, firstFloorY, mainDepth / 2 + 0.02]}>
            <boxGeometry args={[windowWidth + 0.1, windowHeight + 0.1, 0.05]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>
          {/* Glass */}
          <mesh position={[x, firstFloorY, mainDepth / 2 + 0.04]}>
            <boxGeometry args={[windowWidth, windowHeight, 0.03]} />
            <meshStandardMaterial color={0xE8F4FF} emissive={0xFFFFCC} emissiveIntensity={0.15} roughness={0.1} />
          </mesh>
          {/* Dividers */}
          <mesh position={[x, firstFloorY, mainDepth / 2 + 0.06]}>
            <boxGeometry args={[windowWidth, 0.02, 0.02]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>
          <mesh position={[x, firstFloorY, mainDepth / 2 + 0.06]}>
            <boxGeometry args={[0.02, windowHeight, 0.02]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>
          {/* Shutters */}
          <mesh position={[x - windowWidth / 2 - 0.08, firstFloorY, mainDepth / 2 + 0.03]}>
            <boxGeometry args={[0.12, windowHeight + 0.05, 0.03]} />
            <meshStandardMaterial color={0x1a1a2e} roughness={0.6} />
          </mesh>
          <mesh position={[x + windowWidth / 2 + 0.08, firstFloorY, mainDepth / 2 + 0.03]}>
            <boxGeometry args={[0.12, windowHeight + 0.05, 0.03]} />
            <meshStandardMaterial color={0x1a1a2e} roughness={0.6} />
          </mesh>
          {/* Header */}
          <mesh position={[x, firstFloorY + windowHeight / 2 + 0.08, mainDepth / 2 + 0.03]}>
            <boxGeometry args={[windowWidth + 0.2, 0.08, 0.06]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* ========== SECOND FLOOR WINDOWS ========== */}
      {([-1.4, 1.4] as [number, number]).map((x, i) => (
        <group key={`window-2f-${i}`}>
          <mesh position={[x, secondFloorY, mainDepth / 2 + 0.02]}>
            <boxGeometry args={[windowWidth + 0.1, windowHeight + 0.1, 0.05]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>
          <mesh position={[x, secondFloorY, mainDepth / 2 + 0.04]}>
            <boxGeometry args={[windowWidth, windowHeight, 0.03]} />
            <meshStandardMaterial color={0xE8F4FF} emissive={0xFFFFCC} emissiveIntensity={0.15} roughness={0.1} />
          </mesh>
          <mesh position={[x - windowWidth / 2 - 0.08, secondFloorY, mainDepth / 2 + 0.03]}>
            <boxGeometry args={[0.12, windowHeight + 0.05, 0.03]} />
            <meshStandardMaterial color={0x1a1a2e} roughness={0.6} />
          </mesh>
          <mesh position={[x + windowWidth / 2 + 0.08, secondFloorY, mainDepth / 2 + 0.03]}>
            <boxGeometry args={[0.12, windowHeight + 0.05, 0.03]} />
            <meshStandardMaterial color={0x1a1a2e} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* ========== GRAND ENTRANCE DOOR ========== */}
      {/* Door frame */}
      <mesh position={[0, doorY, mainDepth / 2 + 0.02]}>
        <boxGeometry args={[doorWidth + 0.25, doorHeight + 0.15, 0.08]} />
        <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
      </mesh>
      {/* Door */}
      <mesh position={[0, doorY, mainDepth / 2 + 0.05]}>
        <boxGeometry args={[doorWidth, doorHeight, 0.06]} />
        <meshStandardMaterial color={0x1a1a2e} roughness={0.5} />
      </mesh>
      {/* Door panels */}
      {([[-0.15, 0.35], [0.15, 0.35], [-0.15, -0.25], [0.15, -0.25]] as [number, number][]).map(([px, py], i) => (
        <mesh key={`panel-${i}`} position={[px, doorY + py, mainDepth / 2 + 0.09]}>
          <boxGeometry args={[0.22, 0.35, 0.02]} />
          <meshStandardMaterial color={0x252540} roughness={0.5} />
        </mesh>
      ))}
      {/* Transom */}
      <mesh position={[0, doorY + doorHeight / 2 + 0.18, mainDepth / 2 + 0.05]}>
        <boxGeometry args={[doorWidth + 0.1, 0.25, 0.04]} />
        <meshStandardMaterial color={0xE8F4FF} emissive={0xFFFFCC} emissiveIntensity={0.15} roughness={0.1} />
      </mesh>
      {/* Fanlight */}
      <mesh position={[0, doorY + doorHeight / 2 + 0.3, mainDepth / 2 + 0.06]}>
        <circleGeometry args={[0.25, 16, 0, Math.PI]} />
        <meshStandardMaterial color={0xE8F4FF} emissive={0xFFFFCC} emissiveIntensity={0.15} roughness={0.1} />
      </mesh>
      {/* Door handle */}
      <mesh position={[0.2, doorY, mainDepth / 2 + 0.12]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color={0xD4AF37} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Door knocker */}
      <mesh position={[0, doorY + 0.3, mainDepth / 2 + 0.12]}>
        <torusGeometry args={[0.04, 0.01, 8, 16]} />
        <meshStandardMaterial color={0xD4AF37} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ========== FRONT STEPS ========== */}
      {([0, 1, 2] as number[]).map((i) => (
        <mesh key={`step-${i}`} position={[0, 0.04 + (2 - i) * 0.08, mainDepth / 2 + 0.45 + i * 0.25]}>
          <boxGeometry args={[1.2, 0.08, 0.25]} />
          <meshStandardMaterial color={0xC0C0C0} roughness={0.6} />
        </mesh>
      ))}

      {/* ========== CHIMNEYS ========== */}
      {([-1.5, 1.5] as [number, number]).map((x, i) => (
        <group key={`chimney-${i}`}>
          <mesh position={[x, roofBaseY + 0.6 + 0.25, 0]}>
            <boxGeometry args={[0.35, 0.8, 0.35]} />
            <meshStandardMaterial color={0x8B4513} roughness={0.7} />
          </mesh>
          <mesh position={[x, roofBaseY + 1.04 + 0.25, 0]}>
            <boxGeometry args={[0.42, 0.08, 0.42]} />
            <meshStandardMaterial color={0x8B4513} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* ========== DORMER WINDOWS ========== */}
      {([-0.9, 0.9] as [number, number]).map((x, i) => (
        <group key={`dormer-${i}`}>
          <mesh position={[x, roofBaseY + 0.5 + 0.25, roofD - 0.3]}>
            <boxGeometry args={[0.5, 0.45, 0.4]} />
            <meshStandardMaterial color={0xF5E6C8} roughness={0.6} />
          </mesh>
          <mesh position={[x, roofBaseY + 0.76 + 0.25, roofD - 0.3]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.6, 0.08, 0.5]} />
            <meshStandardMaterial color={0x2F3542} roughness={0.7} />
          </mesh>
          <mesh position={[x, roofBaseY + 0.48 + 0.25, roofD - 0.08]}>
            <boxGeometry args={[0.3, 0.35, 0.05]} />
            <meshStandardMaterial color={0xE8F4FF} emissive={0xFFFFCC} emissiveIntensity={0.15} roughness={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}