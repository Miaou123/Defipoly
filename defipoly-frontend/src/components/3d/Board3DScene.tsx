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

// Board dimensions (scaled by 0.01 for Three.js)
const scale = 0.01;
const cornerSize = 96 * scale;  // 0.96
const tileLong = 78 * scale;    // 0.78
const tileShort = 96 * scale;   // 0.96
const boardW = 6.6;             // cornerSize * 2 + tileLong * 6
const boardH = 5.82;            // cornerSize * 2 + tileLong * 5

// Board surface positions
const boardY = 0.1;             // Top of board
const tileY = boardY + 0.06;    // Tiles sit on top

function PropertyTile3D({ 
  position, 
  width, 
  depth, 
  property, 
  side,
  onClick 
}: {
  position: [number, number, number];
  width: number;
  depth: number;
  property: typeof PROPERTIES[0];
  side: 'top' | 'bottom' | 'left' | 'right';
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const tileHeight = 0.12;
  const colorStripHeight = 0.13;
  const colorStripThickness = 0.13;
  
  // Color strip position based on side (faces center)
  const stripOffset = {
    top: [0, 0, (depth/2) - colorStripThickness/2],      
    bottom: [0, 0, -(depth/2) + colorStripThickness/2],  
    left: [(width/2) - colorStripThickness/2, 0, 0],     
    right: [-(width/2) + colorStripThickness/2, 0, 0],   
  }[side];
  
  const stripSize = {
    top: [width - 0.02, colorStripHeight, colorStripThickness],
    bottom: [width - 0.02, colorStripHeight, colorStripThickness],
    left: [colorStripThickness, colorStripHeight, depth - 0.02],
    right: [colorStripThickness, colorStripHeight, depth - 0.02],
  }[side];

  // Get color from property
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

  return (
    <group 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Tile base */}
      <mesh position={[0, hovered ? 0.05 : 0, 0]}>
        <boxGeometry args={[width, tileHeight, depth]} />
        <meshStandardMaterial color="#1a1025" />
      </mesh>
      
      {/* Color strip - slightly raised */}
      <mesh position={[
        stripOffset[0], 
        tileHeight/2 + colorStripHeight/2 + (hovered ? 0.05 : 0), 
        stripOffset[2]
      ]}>
        <boxGeometry args={stripSize} />
        <meshStandardMaterial 
          color={getColorHex(property.color)} 
          emissive={getColorHex(property.color)}
          emissiveIntensity={hovered ? 0.3 : 0.1}
        />
      </mesh>
    </group>
  );
}

function CornerTile3D({ position }: { position: [number, number, number] }) {
  const [hovered, setHovered] = useState(false);
  const size = cornerSize;
  const height = 0.12;
  
  return (
    <mesh 
      position={[position[0], position[1] + (hovered ? 0.05 : 0), position[2]]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[size, height, size]} />
      <meshStandardMaterial color="#4c1d95" />
    </mesh>
  );
}

function Scene({ onSelectProperty, spectatorMode, spectatorOwnerships }: Board3DSceneProps) {
  const { gameState } = useGameState();
  
  // Tile positioning
  const topZ = -boardH/2 + tileShort/2;
  const bottomZ = boardH/2 - tileShort/2;
  const leftX = -boardW/2 + tileShort/2;
  const rightX = boardW/2 - tileShort/2;

  // Top row tiles: ids 11-16, from left to right
  const topRowTiles = [11, 12, 13, 14, 15, 16].map((id, i) => ({
    id,
    position: [-boardW/2 + cornerSize + tileLong/2 + i * tileLong, tileY, topZ] as [number, number, number],
    width: tileLong,
    depth: tileShort,
    side: 'top' as const
  }));

  // Right column tiles: ids 17-21, from top to bottom
  const rightColumnTiles = [17, 18, 19, 20, 21].map((id, i) => ({
    id,
    position: [rightX, tileY, topZ - cornerSize - tileShort/2 - i * tileLong] as [number, number, number],
    width: tileShort,
    depth: tileLong,
    side: 'right' as const
  }));

  // Bottom row tiles: ids 0-5, from right to left
  const bottomRowTiles = [0, 1, 2, 3, 4, 5].map((id, i) => ({
    id,
    position: [boardW/2 - cornerSize - tileLong/2 - i * tileLong, tileY, bottomZ] as [number, number, number],
    width: tileLong,
    depth: tileShort,
    side: 'bottom' as const
  }));

  // Left column tiles: ids 6-10, from bottom to top
  const leftColumnTiles = [6, 7, 8, 9, 10].map((id, i) => ({
    id,
    position: [leftX, tileY, bottomZ + cornerSize + tileShort/2 + i * tileLong] as [number, number, number],
    width: tileShort,
    depth: tileLong,
    side: 'left' as const
  }));

  // Corner positions
  const corners = [
    { position: [-boardW/2 + cornerSize/2, tileY, topZ] as [number, number, number] },      // Top-left
    { position: [boardW/2 - cornerSize/2, tileY, topZ] as [number, number, number] },       // Top-right
    { position: [boardW/2 - cornerSize/2, tileY, bottomZ] as [number, number, number] },    // Bottom-right
    { position: [-boardW/2 + cornerSize/2, tileY, bottomZ] as [number, number, number] },   // Bottom-left
  ];

  const allTiles = [...topRowTiles, ...rightColumnTiles, ...bottomRowTiles, ...leftColumnTiles];
  
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
        minDistance={8}
        maxDistance={25}
        autoRotate={false}
      />

      {/* Board Base - Proper MonoFi dimensions */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[boardW, 0.2, boardH]} />
        <meshStandardMaterial color="#0f0618" />
      </mesh>

      {/* Render all property tiles */}
      {allTiles.map(({ id, position, width, depth, side }) => {
        const property = PROPERTIES[id];
        return (
          <PropertyTile3D
            key={id}
            position={position}
            width={width}
            depth={depth}
            property={property}
            side={side}
            onClick={() => onSelectProperty(id)}
          />
        );
      })}

      {/* Render corner tiles */}
      {corners.map((corner, i) => (
        <CornerTile3D
          key={`corner-${i}`}
          position={corner.position}
        />
      ))}

      {/* Bank in Center - Using actual Bank3D_R3F with proper scaling */}
      <group position={[0, 1.2, 0]} scale={0.18}>
        <Suspense fallback={null}>
          <Bank3D_R3F isPulsing={false} rewardsAmount={gameState?.bankBalance || 0} />
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