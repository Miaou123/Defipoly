'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGameState } from '@/contexts/GameStateContext';
import { PROPERTIES } from '@/utils/constants';
import { Bank3D_R3F } from './r3f/Bank3D_R3F';
import { useMemo, useEffect, useRef, useState, Suspense } from 'react';

interface Board3DSceneProps {
  onSelectProperty: (propertyId: number) => void;
  spectatorMode?: boolean;
  spectatorOwnerships?: any[];
}

// Property tile positions in 3D space (7x7 grid, outer ring only)
const getPropertyPositions = () => {
  const positions: { [key: number]: [number, number, number] } = {};
  const tileSize = 2;
  const boardSize = 14;
  const offset = boardSize / 2 - tileSize / 2;

  // Top row (properties 11-16 + corners)
  for (let i = 0; i < 7; i++) {
    const x = -offset + i * tileSize;
    const z = offset;
    if (i === 0) {
      positions[-1] = [x, 0.26, z]; // Top-left corner
    } else if (i === 6) {
      positions[-1] = [x, 0.26, z]; // Top-right corner
    } else {
      const propId = 16 - (i - 1); // 16, 15, 14, 13, 12, 11
      positions[propId] = [x, 0.26, z];
    }
  }

  // Right column (properties 17-21)
  for (let i = 1; i < 6; i++) {
    const x = offset;
    const z = offset - i * tileSize;
    const propId = 16 + i; // 17, 18, 19, 20, 21
    positions[propId] = [x, 0.26, z];
  }

  // Bottom row (properties 0-5 + corner)
  for (let i = 0; i < 7; i++) {
    const x = offset - i * tileSize;
    const z = -offset;
    if (i === 0) {
      positions[-1] = [x, 0.26, z]; // Bottom-right corner
    } else if (i === 6) {
      positions[-1] = [x, 0.26, z]; // Bottom-left corner
    } else {
      const propId = i - 1; // 0, 1, 2, 3, 4, 5
      positions[propId] = [x, 0.26, z];
    }
  }

  // Left column (properties 6-10)
  for (let i = 1; i < 6; i++) {
    const x = -offset;
    const z = -offset + i * tileSize;
    const propId = 5 + i; // 6, 7, 8, 9, 10
    positions[propId] = [x, 0.26, z];
  }

  return positions;
};

function PropertyTile({ 
  propertyId, 
  position, 
  property, 
  buildingLevel, 
  onClick 
}: { 
  propertyId: number;
  position: [number, number, number];
  property: any;
  buildingLevel: number;
  onClick: () => void;
}) {
  // Get color hex from property color class
  const getColorHex = (colorClass: string) => {
    const colorMap: { [key: string]: string } = {
      'bg-amber-900': '#78350f',
      'bg-sky-300': '#7dd3fc',
      'bg-pink-400': '#f472b6',
      'bg-orange-500': '#f97316',
      'bg-red-600': '#dc2626',
      'bg-yellow-400': '#facc15',
      'bg-green-600': '#16a34a',
      'bg-blue-900': '#1e3a8a',
    };
    return colorMap[colorClass] || '#8b5cf6';
  };

  const colorHex = property ? getColorHex(property.color) : '#6b7280';
  const tileSize = 1.8;
  const tileHeight = 0.1;

  return (
    <group position={position}>
      {/* Main tile */}
      <mesh onClick={onClick}>
        <boxGeometry args={[tileSize, tileHeight, tileSize]} />
        <meshStandardMaterial 
          color={property ? '#2d1b4e' : '#1a1a1a'} 
          roughness={0.7} 
        />
      </mesh>

      {/* Color strip for properties */}
      {property && (
        <mesh position={[0, tileHeight/2 + 0.01, tileSize/2 - 0.1]}>
          <boxGeometry args={[tileSize * 0.8, 0.02, 0.2]} />
          <meshStandardMaterial color={colorHex} emissive={colorHex} emissiveIntensity={0.2} />
        </mesh>
      )}

      {/* Property name - temporarily removed Text component due to font loading issues */}
      
      {/* Price - temporarily removed Text component due to font loading issues */}

      {/* Building - temporarily simplified to basic shapes */}
      {buildingLevel > 0 && (
        <group position={[0, tileHeight/2 + 0.2, 0]}>
          <mesh>
            <boxGeometry args={[0.3, 0.2 * buildingLevel, 0.3]} />
            <meshStandardMaterial 
              color={buildingLevel === 1 ? "#8B4513" : 
                     buildingLevel === 2 ? "#A0522D" :
                     buildingLevel === 3 ? "#D2691E" :
                     buildingLevel === 4 ? "#B8B8B8" : "#E8E8E8"} 
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

function CornerTile({ 
  position, 
  label 
}: { 
  position: [number, number, number];
  label: string;
}) {
  const tileSize = 1.8;
  const tileHeight = 0.1;

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[tileSize, tileHeight, tileSize]} />
        <meshStandardMaterial color="#4c1d95" roughness={0.5} metalness={0.3} />
      </mesh>
      
      {/* Corner label - temporarily removed Text component due to font loading issues */}
    </group>
  );
}

function Scene({ onSelectProperty, spectatorMode, spectatorOwnerships }: Board3DSceneProps) {
  console.log('Scene component rendering');
  
  return (
    <>
      {/* Enhanced Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1.2}
      />
      <directionalLight 
        position={[-10, 10, -10]} 
        intensity={0.4} 
        color="#9333ea" 
      />

      {/* Camera Controls */}
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={20}
        maxDistance={50}
        autoRotate={false}
      />

      {/* Board Base - Bigger size matching monopoly layout */}
      <mesh position={[0, -0.25, 0]}>
        <boxGeometry args={[14, 0.5, 14]} />
        <meshStandardMaterial 
          color="#1a0a2e" 
          roughness={0.8} 
          metalness={0.2} 
        />
      </mesh>

      {/* Bank in Center - Using actual Bank3D_R3F with proper scaling */}
      <group position={[0, 1.5, 0]} scale={0.25}>
        <Suspense fallback={null}>
          <Bank3D_R3F isPulsing={false} rewardsAmount={0} />
        </Suspense>
      </group>
    </>
  );
}

export function Board3DScene({ onSelectProperty, spectatorMode, spectatorOwnerships }: Board3DSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        background: 'linear-gradient(180deg, #0a0015 0%, #1a0a2e 50%, #0a0015 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        Loading 3D Scene...
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {containerRef.current && (
        <Canvas
          camera={{ 
            position: [15, 25, 15], 
            fov: 60,
            far: 1000,
            near: 0.1
          }}
          style={{ 
            background: 'linear-gradient(180deg, #0a0015 0%, #1a0a2e 50%, #0a0015 100%)',
            width: '100%',
            height: '100%'
          }}
          onCreated={({ gl, camera, scene }) => {
            console.log('Canvas created successfully', { gl, camera, scene });
          }}
        >
          <Scene 
            onSelectProperty={onSelectProperty}
            spectatorMode={spectatorMode}
            spectatorOwnerships={spectatorOwnerships}
          />
        </Canvas>
      )}
    </div>
  );
}