'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';

interface House1_R3FProps {}

export function House1_R3F({}: House1_R3FProps) {
  const groupRef = useRef<THREE.Group>(null);

  // House dimensions
  const houseWidth = 2;
  const houseHeight = 1.2;
  const houseDepth = 1.8;
  
  // Roof dimensions
  const roofHeight = 0.75;
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

  return (
    <group ref={groupRef} position={[0, 0.2, 0]} scale={0.8}>
      {/* Main house body - warm cream */}
      <mesh position={[0, houseHeight / 2, 0]}>
        <boxGeometry args={[houseWidth, houseHeight, houseDepth]} />
        <meshStandardMaterial color={0xFAF0E6} roughness={0.7} metalness={0.0} />
      </mesh>

      {/* Left roof slope */}
      <mesh geometry={leftRoofGeo}>
        <meshStandardMaterial color={0x8B4513} roughness={0.6} metalness={0.0} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Right roof slope */}
      <mesh geometry={rightRoofGeo}>
        <meshStandardMaterial color={0x6B3510} roughness={0.6} metalness={0.0} side={THREE.DoubleSide} />
      </mesh>

      {/* Front gable */}
      <mesh geometry={gableGeometry} position={[0, houseHeight, hd + 0.01]}>
        <meshStandardMaterial color={0xFAF0E6} roughness={0.7} metalness={0.0} />
      </mesh>

      {/* Back gable */}
      <mesh geometry={gableGeometry} position={[0, houseHeight, -hd - 0.01]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial color={0xE8DCC8} roughness={0.7} metalness={0.0} />
      </mesh>

      {/* Chimney */}
      <mesh position={[-0.5, peakY - 0.1, 0]}>
        <boxGeometry args={[0.25, 0.6, 0.25]} />
        <meshStandardMaterial color={0x8B4513} roughness={0.7} />
      </mesh>
      <mesh position={[-0.5, peakY + 0.24, 0]}>
        <boxGeometry args={[0.32, 0.08, 0.32]} />
        <meshStandardMaterial color={0x6B3510} roughness={0.6} />
      </mesh>

      {/* Door frame */}
      <mesh position={[0, 0.34, hd + 0.02]}>
        <boxGeometry args={[0.48, 0.68, 0.06]} />
        <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
      </mesh>

      {/* Door - green */}
      <mesh position={[0, 0.3, hd + 0.04]}>
        <boxGeometry args={[0.4, 0.6, 0.08]} />
        <meshStandardMaterial color={0x4A7C59} roughness={0.5} />
      </mesh>

      {/* Door panels */}
      {[0.12, -0.1].map((py, i) => (
        <mesh key={`panel-${i}`} position={[0, 0.3 + py, hd + 0.09]}>
          <boxGeometry args={[0.28, 0.18, 0.02]} />
          <meshStandardMaterial color={0x3D6B4A} roughness={0.5} />
        </mesh>
      ))}

      {/* Door handle */}
      <mesh position={[0.12, 0.3, hd + 0.1]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={0xD4AF37} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Door awning */}
      <mesh position={[0, 0.72, hd + 0.12]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.7, 0.05, 0.25]} />
        <meshStandardMaterial color={0x8B4513} roughness={0.6} />
      </mesh>

      {/* Awning supports */}
      {[-0.28, 0.28].map((x, i) => (
        <mesh key={`support-${i}`} position={[x, 0.68, hd + 0.2]} rotation={[-0.15, 0, 0]}>
          <boxGeometry args={[0.03, 0.12, 0.03]} />
          <meshStandardMaterial color={0x6B3510} roughness={0.6} />
        </mesh>
      ))}

      {/* Doorstep */}
      <mesh position={[0, 0.03, hd + 0.15]}>
        <boxGeometry args={[0.6, 0.06, 0.2]} />
        <meshStandardMaterial color={0xA0A0A0} roughness={0.7} />
      </mesh>

      {/* Windows with shutters */}
      {([-0.6, 0.6] as const).map((x, wi) => (
        <group key={`window-${wi}`}>
          {/* Window frame */}
          <mesh position={[x, houseHeight * 0.5, hd + 0.02]}>
            <boxGeometry args={[0.38, 0.38, 0.04]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>

          {/* Window glass */}
          <mesh position={[x, houseHeight * 0.5, hd + 0.04]}>
            <boxGeometry args={[0.3, 0.3, 0.06]} />
            <meshStandardMaterial 
              color={0xE8F4FF} 
              emissive={0xFFFF99} 
              emissiveIntensity={0.2} 
              roughness={0.2} 
            />
          </mesh>

          {/* Window cross bars */}
          <mesh position={[x, houseHeight * 0.5, hd + 0.07]}>
            <boxGeometry args={[0.3, 0.02, 0.02]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>
          <mesh position={[x, houseHeight * 0.5, hd + 0.07]}>
            <boxGeometry args={[0.02, 0.3, 0.02]} />
            <meshStandardMaterial color={0xFFFDF5} roughness={0.5} />
          </mesh>

          {/* Shutters - green to match door */}
          {[-0.22, 0.22].map((sx, si) => (
            <mesh key={`shutter-${si}`} position={[x + sx, houseHeight * 0.5, hd + 0.03]}>
              <boxGeometry args={[0.1, 0.34, 0.03]} />
              <meshStandardMaterial color={0x4A7C59} roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}