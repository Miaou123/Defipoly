'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';

interface House2_R3FProps {}

export function House2_R3F({}: House2_R3FProps) {
  const groupRef = useRef<THREE.Group>(null);

  // House dimensions
  const houseWidth = 2.5;
  const houseHeight = 2.0;
  const houseDepth = 2.2;
  
  // Roof dimensions
  const roofHeight = 0.8;
  const roofOverhang = 0.15;
  const hw = houseWidth / 2;
  const hd = houseDepth / 2;
  const baseY = houseHeight;
  const peakY = houseHeight + roofHeight;

  // Create roof geometry - aligned with walls
  const leftRoofGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const leftRoofVerts = new Float32Array([
      0, peakY, -(hd + roofOverhang),
      0, peakY, (hd + roofOverhang),
      -(hw + roofOverhang), baseY, (hd + roofOverhang),
      0, peakY, -(hd + roofOverhang),
      -(hw + roofOverhang), baseY, (hd + roofOverhang),
      -(hw + roofOverhang), baseY, -(hd + roofOverhang),
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(leftRoofVerts, 3));
    geo.computeVertexNormals();
    return geo;
  }, [peakY, hd, roofOverhang, hw, baseY]);

  const rightRoofGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const rightRoofVerts = new Float32Array([
      0, peakY, (hd + roofOverhang),
      0, peakY, -(hd + roofOverhang),
      (hw + roofOverhang), baseY, -(hd + roofOverhang),
      0, peakY, (hd + roofOverhang),
      (hw + roofOverhang), baseY, -(hd + roofOverhang),
      (hw + roofOverhang), baseY, (hd + roofOverhang),
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(rightRoofVerts, 3));
    geo.computeVertexNormals();
    return geo;
  }, [peakY, hd, roofOverhang, hw, baseY]);

  // Gable geometry - matches wall width exactly
  const gableGeometry = useMemo(() => {
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-hw, 0);
    gableShape.lineTo(hw, 0);
    gableShape.lineTo(0, roofHeight);
    gableShape.closePath();
    return new THREE.ShapeGeometry(gableShape);
  }, [hw, roofHeight]);

  // Window positions
  const windowPositions: [number, number][] = [
    [-0.8, 0.8], [0.8, 0.8],   // Bottom row
    [-0.8, 1.5], [0.8, 1.5]    // Top row
  ];

  return (
    <group ref={groupRef} position={[0, 0.3, 0]} scale={0.7}>
      {/* Main house body - light blue-gray */}
      <mesh position={[0, houseHeight / 2, 0]}>
        <boxGeometry args={[houseWidth, houseHeight, houseDepth]} />
        <meshStandardMaterial color={0xE8EEF2} roughness={0.7} metalness={0.0} />
      </mesh>

      {/* Left roof slope */}
      <mesh geometry={leftRoofGeo}>
        <meshStandardMaterial color={0x2F3542} roughness={0.6} metalness={0.0} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Right roof slope */}
      <mesh geometry={rightRoofGeo}>
        <meshStandardMaterial color={0x252D38} roughness={0.6} metalness={0.0} side={THREE.DoubleSide} />
      </mesh>

      {/* Front gable */}
      <mesh geometry={gableGeometry} position={[0, houseHeight, hd + 0.01]}>
        <meshStandardMaterial color={0xE8EEF2} roughness={0.7} metalness={0.0} />
      </mesh>

      {/* Back gable */}
      <mesh geometry={gableGeometry} position={[0, houseHeight, -hd - 0.01]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial color={0xD8DEE2} roughness={0.7} metalness={0.0} />
      </mesh>

      {/* Chimney */}
      <mesh position={[-0.7, 2.4, -0.5]}>
        <boxGeometry args={[0.35, 1.0, 0.35]} />
        <meshStandardMaterial color={0x8B4513} roughness={0.7} />
      </mesh>
      <mesh position={[-0.7, 2.95, -0.5]}>
        <boxGeometry args={[0.42, 0.1, 0.42]} />
        <meshStandardMaterial color={0x6B3510} roughness={0.6} />
      </mesh>

      {/* Front porch floor */}
      <mesh position={[0, 0.04, hd + 0.25]}>
        <boxGeometry args={[1.4, 0.08, 0.5]} />
        <meshStandardMaterial color={0xA0A0A0} roughness={0.7} />
      </mesh>

      {/* Porch roof */}
      <mesh position={[0, 1.1, hd + 0.28]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[1.5, 0.06, 0.6]} />
        <meshStandardMaterial color={0x2F3542} roughness={0.6} />
      </mesh>

      {/* Porch columns */}
      {([-0.55, 0.55] as const).map((x, i) => (
        <group key={`column-${i}`}>
          <mesh position={[x, 0.58, hd + 0.45]}>
            <cylinderGeometry args={[0.05, 0.06, 1.0, 8]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.4} />
          </mesh>
          <mesh position={[x, 0.12, hd + 0.45]}>
            <boxGeometry args={[0.15, 0.08, 0.15]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Door frame */}
      <mesh position={[0, 0.54, hd + 0.02]}>
        <boxGeometry args={[0.58, 1.08, 0.06]} />
        <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
      </mesh>

      {/* Door - red */}
      <mesh position={[0, 0.5, hd + 0.04]}>
        <boxGeometry args={[0.5, 1.0, 0.08]} />
        <meshStandardMaterial color={0x8B0000} roughness={0.5} />
      </mesh>

      {/* Door panels */}
      {([[0.12, 0.28], [0.12, -0.15], [-0.12, 0.28], [-0.12, -0.15]] as [number, number][]).map(([px, py], i) => (
        <mesh key={`panel-${i}`} position={[px, 0.5 + py, hd + 0.09]}>
          <boxGeometry args={[0.16, 0.28, 0.02]} />
          <meshStandardMaterial color={0x6B0000} roughness={0.5} />
        </mesh>
      ))}

      {/* Door handle */}
      <mesh position={[0.18, 0.5, hd + 0.1]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={0xD4AF37} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Decorative trim under roof */}
      <mesh position={[0, houseHeight - 0.03, hd + 0.04]}>
        <boxGeometry args={[houseWidth + 0.1, 0.06, 0.08]} />
        <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
      </mesh>

      {/* Windows with shutters */}
      {windowPositions.map(([x, y], wi) => (
        <group key={`window-${wi}`}>
          {/* Window frame */}
          <mesh position={[x, y, hd + 0.02]}>
            <boxGeometry args={[0.46, 0.46, 0.04]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>

          {/* Window glass */}
          <mesh position={[x, y, hd + 0.04]}>
            <boxGeometry args={[0.38, 0.38, 0.06]} />
            <meshStandardMaterial 
              color={0xE8F4FF} 
              emissive={0xFFFF99} 
              emissiveIntensity={0.2} 
              roughness={0.2} 
            />
          </mesh>

          {/* Window dividers */}
          <mesh position={[x, y, hd + 0.07]}>
            <boxGeometry args={[0.38, 0.02, 0.02]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>
          <mesh position={[x, y, hd + 0.07]}>
            <boxGeometry args={[0.02, 0.38, 0.02]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>

          {/* Shutters - dark blue */}
          {[-0.27, 0.27].map((sx, si) => (
            <mesh key={`shutter-${si}`} position={[x + sx, y, hd + 0.03]}>
              <boxGeometry args={[0.1, 0.42, 0.03]} />
              <meshStandardMaterial color={0x1a1a4e} roughness={0.6} />
            </mesh>
          ))}

          {/* Window header */}
          <mesh position={[x, y + 0.28, hd + 0.03]}>
            <boxGeometry args={[0.52, 0.06, 0.05]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>

          {/* Flower box on bottom windows only */}
          {y < 1.2 && (
            <group>
              <mesh position={[x, y - 0.28, hd + 0.08]}>
                <boxGeometry args={[0.42, 0.08, 0.1]} />
                <meshStandardMaterial color={0x2F3542} roughness={0.7} />
              </mesh>
              {/* Flowers */}
              <mesh position={[x - 0.12, y - 0.22, hd + 0.1]}>
                <sphereGeometry args={[0.04, 6, 6]} />
                <meshStandardMaterial color={0xFF6B9D} roughness={0.8} />
              </mesh>
              <mesh position={[x, y - 0.22, hd + 0.1]}>
                <sphereGeometry args={[0.04, 6, 6]} />
                <meshStandardMaterial color={0xFFFFFF} roughness={0.8} />
              </mesh>
              <mesh position={[x + 0.12, y - 0.22, hd + 0.1]}>
                <sphereGeometry args={[0.04, 6, 6]} />
                <meshStandardMaterial color={0xFF6B9D} roughness={0.8} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}