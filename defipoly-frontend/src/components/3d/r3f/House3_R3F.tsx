'use client';

import { useRef } from 'react';
import * as THREE from 'three';

interface House3_R3FProps {}

export function House3_R3F({}: House3_R3FProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Tudor Manor dimensions
  const mainWidth = 3.2;
  const mainHeight = 1.4;
  const mainDepth = 2.0;
  const roofHeight = 1.0;
  const beamThick = 0.08;
  const roofOverhang = 0.2;

  // Calculated values
  const cornerX = mainWidth / 2 - beamThick / 2;
  const frontZ = mainDepth / 2 + 0.02;
  const roofW = mainWidth / 2 + roofOverhang;
  const roofD = mainDepth / 2 + roofOverhang;
  const roofBaseY = mainHeight;
  const roofPeakY = roofBaseY + roofHeight;

  // Diagonal beam calculations
  const panelWidth = mainWidth / 2 - beamThick;
  const panelHeight = mainHeight - beamThick;
  const diagLength = Math.sqrt(panelWidth * panelWidth + panelHeight * panelHeight);
  const diagAngle = Math.atan2(panelHeight, panelWidth);

  // Gable diagonal calculations
  const gableDiagLen = Math.sqrt((roofW * 0.7) ** 2 + (roofHeight * 0.7) ** 2);
  const gableDiagAngle = Math.atan2(roofHeight * 0.7, roofW * 0.7);

  // Roof geometries
  const leftRoofGeo = new THREE.BufferGeometry();
  const leftRoofVerts = new Float32Array([
    0, roofPeakY, -roofD,
    0, roofPeakY, roofD,
    -roofW, roofBaseY, roofD,
    0, roofPeakY, -roofD,
    -roofW, roofBaseY, roofD,
    -roofW, roofBaseY, -roofD,
  ]);
  leftRoofGeo.setAttribute('position', new THREE.BufferAttribute(leftRoofVerts, 3));
  leftRoofGeo.computeVertexNormals();

  const rightRoofGeo = new THREE.BufferGeometry();
  const rightRoofVerts = new Float32Array([
    0, roofPeakY, roofD,
    0, roofPeakY, -roofD,
    roofW, roofBaseY, -roofD,
    0, roofPeakY, roofD,
    roofW, roofBaseY, -roofD,
    roofW, roofBaseY, roofD,
  ]);
  rightRoofGeo.setAttribute('position', new THREE.BufferAttribute(rightRoofVerts, 3));
  rightRoofGeo.computeVertexNormals();

  // Gable geometry
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-roofW, 0);
  gableShape.lineTo(roofW, 0);
  gableShape.lineTo(0, roofHeight);
  gableShape.closePath();
  const gableGeo = new THREE.ShapeGeometry(gableShape);

  // Window positions (symmetrical)
  const windowPositions = [-mainWidth / 4 - 0.15, mainWidth / 4 + 0.15];
  const windowY = mainHeight * 0.55;
  const windowWidth = 0.4;
  const windowHeight = 0.5;
  const paneW = windowWidth / 2 - 0.02;
  const paneH = windowHeight / 2 - 0.02;

  // Door dimensions
  const doorWidth = 0.45;
  const doorHeight = 0.9;
  const doorY = doorHeight / 2;

  return (
    <group ref={groupRef} position={[0, 0.2, 0]} scale={0.55}>
      {/* Base/Ground */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[mainWidth + 0.6, 0.1, mainDepth + 0.6]} />
        <meshStandardMaterial color={0x4a7c4e} roughness={0.9} />
      </mesh>

      {/* ========== MAIN HOUSE BODY ========== */}
      <mesh position={[0, mainHeight / 2, 0]}>
        <boxGeometry args={[mainWidth, mainHeight, mainDepth]} />
        <meshStandardMaterial color={0xF5E6C8} roughness={0.8} />
      </mesh>

      {/* ========== FRONT TIMBER FRAME ========== */}
      {/* Corner vertical beams */}
      {[-cornerX, cornerX].map((x, i) => (
        <mesh key={`corner-${i}`} position={[x, mainHeight / 2, frontZ]}>
          <boxGeometry args={[beamThick, mainHeight, beamThick]} />
          <meshStandardMaterial color={0x3D2314} roughness={0.6} />
        </mesh>
      ))}

      {/* Center vertical beam */}
      <mesh position={[0, mainHeight / 2, frontZ]}>
        <boxGeometry args={[beamThick, mainHeight, beamThick]} />
        <meshStandardMaterial color={0x3D2314} roughness={0.6} />
      </mesh>

      {/* Horizontal beams (bottom, middle, top) */}
      {[0, mainHeight / 2, mainHeight].map((y, i) => (
        <mesh key={`hbeam-${i}`} position={[0, y, frontZ]}>
          <boxGeometry args={[mainWidth, beamThick, beamThick]} />
          <meshStandardMaterial color={0x3D2314} roughness={0.6} />
        </mesh>
      ))}

      {/* Left panel X diagonals */}
      <mesh position={[-mainWidth / 4, mainHeight / 2, frontZ + 0.01]} rotation={[0, 0, diagAngle]}>
        <boxGeometry args={[diagLength, beamThick * 0.8, beamThick * 0.6]} />
        <meshStandardMaterial color={0x3D2314} roughness={0.6} />
      </mesh>
      <mesh position={[-mainWidth / 4, mainHeight / 2, frontZ + 0.01]} rotation={[0, 0, -diagAngle]}>
        <boxGeometry args={[diagLength, beamThick * 0.8, beamThick * 0.6]} />
        <meshStandardMaterial color={0x3D2314} roughness={0.6} />
      </mesh>

      {/* Right panel X diagonals */}
      <mesh position={[mainWidth / 4, mainHeight / 2, frontZ + 0.01]} rotation={[0, 0, diagAngle]}>
        <boxGeometry args={[diagLength, beamThick * 0.8, beamThick * 0.6]} />
        <meshStandardMaterial color={0x3D2314} roughness={0.6} />
      </mesh>
      <mesh position={[mainWidth / 4, mainHeight / 2, frontZ + 0.01]} rotation={[0, 0, -diagAngle]}>
        <boxGeometry args={[diagLength, beamThick * 0.8, beamThick * 0.6]} />
        <meshStandardMaterial color={0x3D2314} roughness={0.6} />
      </mesh>

      {/* ========== ROOF ========== */}
      <mesh geometry={leftRoofGeo}>
        <meshStandardMaterial color={0x4A4A4A} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={rightRoofGeo}>
        <meshStandardMaterial color={0x4A4A4A} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Front gable */}
      <mesh geometry={gableGeo} position={[0, roofBaseY, roofD + 0.01]}>
        <meshStandardMaterial color={0xF5E6C8} roughness={0.8} />
      </mesh>

      {/* Back gable */}
      <mesh geometry={gableGeo} position={[0, roofBaseY, -roofD - 0.01]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial color={0xF5E6C8} roughness={0.8} />
      </mesh>

      {/* Gable timber - center vertical */}
      <mesh position={[0, roofBaseY + roofHeight * 0.42, roofD + 0.02]}>
        <boxGeometry args={[beamThick, roofHeight * 0.85, beamThick]} />
        <meshStandardMaterial color={0x3D2314} roughness={0.6} />
      </mesh>

      {/* Gable timber - diagonals */}
      <mesh position={[-roofW * 0.35, roofBaseY + roofHeight * 0.35, roofD + 0.02]} rotation={[0, 0, gableDiagAngle]}>
        <boxGeometry args={[gableDiagLen, beamThick * 0.8, beamThick * 0.6]} />
        <meshStandardMaterial color={0x3D2314} roughness={0.6} />
      </mesh>
      <mesh position={[roofW * 0.35, roofBaseY + roofHeight * 0.35, roofD + 0.02]} rotation={[0, 0, -gableDiagAngle]}>
        <boxGeometry args={[gableDiagLen, beamThick * 0.8, beamThick * 0.6]} />
        <meshStandardMaterial color={0x3D2314} roughness={0.6} />
      </mesh>

      {/* ========== WINDOWS ========== */}
      {windowPositions.map((x, i) => (
        <group key={`window-${i}`}>
          {/* Window frame */}
          <mesh position={[x, windowY, frontZ + 0.02]}>
            <boxGeometry args={[windowWidth + 0.08, windowHeight + 0.08, 0.04]} />
            <meshStandardMaterial color={0x3D2314} roughness={0.6} />
          </mesh>

          {/* Window panes (2x2) */}
          {([[-1, -1], [-1, 1], [1, -1], [1, 1]] as [number, number][]).map(([px, py], j) => (
            <mesh key={`pane-${i}-${j}`} position={[
              x + px * (paneW / 2 + 0.015),
              windowY + py * (paneH / 2 + 0.015),
              frontZ + 0.04
            ]}>
              <boxGeometry args={[paneW, paneH, 0.02]} />
              <meshStandardMaterial 
                color={0xFFFFCC} 
                emissive={0xFFFF99} 
                emissiveIntensity={0.25} 
                roughness={0.2} 
              />
            </mesh>
          ))}

          {/* Window cross bars */}
          <mesh position={[x, windowY, frontZ + 0.05]}>
            <boxGeometry args={[windowWidth, 0.03, 0.03]} />
            <meshStandardMaterial color={0x3D2314} roughness={0.6} />
          </mesh>
          <mesh position={[x, windowY, frontZ + 0.05]}>
            <boxGeometry args={[0.03, windowHeight, 0.03]} />
            <meshStandardMaterial color={0x3D2314} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* ========== DOOR ========== */}
      {/* Door frame */}
      <mesh position={[0, doorY, frontZ + 0.02]}>
        <boxGeometry args={[doorWidth + 0.1, doorHeight + 0.05, 0.06]} />
        <meshStandardMaterial color={0x3D2314} roughness={0.6} />
      </mesh>

      {/* Door */}
      <mesh position={[0, doorY, frontZ + 0.04]}>
        <boxGeometry args={[doorWidth, doorHeight, 0.05]} />
        <meshStandardMaterial color={0x5D3A1A} roughness={0.5} />
      </mesh>

      {/* Door handle */}
      <mesh position={[0.12, doorY, frontZ + 0.08]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={0xFFBD32} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ========== CHIMNEY ========== */}
      <mesh position={[roofW * 0.6, roofPeakY - 0.1, 0]}>
        <boxGeometry args={[0.3, 0.9, 0.3]} />
        <meshStandardMaterial color={0x8B4513} roughness={0.7} />
      </mesh>
      <mesh position={[roofW * 0.6, roofPeakY + 0.35, 0]}>
        <boxGeometry args={[0.38, 0.08, 0.38]} />
        <meshStandardMaterial color={0x654321} roughness={0.6} />
      </mesh>

      {/* ========== BACK TIMBER FRAME ========== */}
      {/* Back corner beams */}
      {[-cornerX, cornerX].map((x, i) => (
        <mesh key={`back-corner-${i}`} position={[x, mainHeight / 2, -mainDepth / 2 - 0.02]}>
          <boxGeometry args={[beamThick, mainHeight, beamThick]} />
          <meshStandardMaterial color={0x3D2314} roughness={0.6} />
        </mesh>
      ))}

      {/* Back horizontal beams */}
      {[0, mainHeight].map((y, i) => (
        <mesh key={`back-hbeam-${i}`} position={[0, y, -mainDepth / 2 - 0.02]}>
          <boxGeometry args={[mainWidth, beamThick, beamThick]} />
          <meshStandardMaterial color={0x3D2314} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}