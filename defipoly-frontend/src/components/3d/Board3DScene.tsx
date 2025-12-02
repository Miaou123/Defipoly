'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useGameState } from '@/contexts/GameStateContext';
import { PROPERTIES } from '@/utils/constants';
import { Bank3D_R3F } from './r3f/Bank3D_R3F';
import { useMemo, useEffect, useRef, useState, Suspense } from 'react';

interface Board3DSceneProps {
  onSelectProperty: (propertyId: number) => void;
  spectatorMode?: boolean;
  spectatorOwnerships?: any[];
}

// EXACT DIMENSIONS TO MATCH PROTOTYPE
const cornerSize = 1.0;           // Corner tiles are square: 1.0 x 1.0
const tileLong = 0.82;            // Side along board edge (the wider side)
const tileShort = 1.0;            // Side toward center (matches corner height)
const boardWidth = cornerSize * 2 + tileLong * 6;   // ~6.92 units
const boardHeight = cornerSize * 2 + tileLong * 5;  // ~6.1 units (5 tiles on sides, not 6)
const boardThickness = 0.25;
const tileThickness = 0.15;
const colorStripThickness = 0.16;
const colorStripWidth = 0.15;

interface PropertyTileProps {
  position: [number, number, number];
  width: number;  // tileLong for top/bottom, tileShort for left/right
  depth: number;  // tileShort for top/bottom, tileLong for left/right
  property: typeof PROPERTIES[0];
  side: 'top' | 'bottom' | 'left' | 'right';
  buildingLevel: number;
  onClick: () => void;
}

function PropertyTile({ position, width, depth, property, side, buildingLevel, onClick }: PropertyTileProps) {
  const [hovered, setHovered] = useState(false);
  
  // Get hex color from color class
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
  
  const colorHex = getColorHex(property.color);
  
  // Calculate color strip position based on side (faces center)
  let stripPosition: [number, number, number] = [0, 0, 0];
  let stripSize: [number, number, number] = [0, 0, 0];
  
  if (side === 'top') {
    // Strip on back edge (+Z, toward center)
    stripPosition = [0, tileThickness/2 + colorStripThickness/2, depth/2 - colorStripWidth/2 - 0.02];
    stripSize = [width - 0.04, colorStripThickness, colorStripWidth];
  } else if (side === 'bottom') {
    // Strip on front edge (-Z, toward center)
    stripPosition = [0, tileThickness/2 + colorStripThickness/2, -depth/2 + colorStripWidth/2 + 0.02];
    stripSize = [width - 0.04, colorStripThickness, colorStripWidth];
  } else if (side === 'left') {
    // Strip on right edge (+X, toward center)
    stripPosition = [width/2 - colorStripWidth/2 - 0.02, tileThickness/2 + colorStripThickness/2, 0];
    stripSize = [colorStripWidth, colorStripThickness, depth - 0.04];
  } else if (side === 'right') {
    // Strip on left edge (-X, toward center)
    stripPosition = [-width/2 + colorStripWidth/2 + 0.02, tileThickness/2 + colorStripThickness/2, 0];
    stripSize = [colorStripWidth, colorStripThickness, depth - 0.04];
  }
  
  // Text rotation based on side (readable from outside board)
  const textRotation: [number, number, number] = {
    top: [-Math.PI/2, 0, Math.PI],      // Rotated to face away from center
    bottom: [-Math.PI/2, 0, 0],         // Normal orientation
    left: [-Math.PI/2, 0, Math.PI/2],   // Rotated 90deg
    right: [-Math.PI/2, 0, -Math.PI/2], // Rotated -90deg
  }[side];

  // Hover lift
  const hoverY = hovered ? 0.08 : 0;

  return (
    <group 
      position={[position[0], position[1] + hoverY, position[2]]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Tile base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, tileThickness, depth]} />
        <meshStandardMaterial 
          color="#1a1025" 
          roughness={0.7}
          emissive={hovered ? colorHex : '#000000'}
          emissiveIntensity={hovered ? 0.15 : 0}
        />
      </mesh>
      
      {/* Color strip */}
      <mesh position={stripPosition} castShadow>
        <boxGeometry args={stripSize} />
        <meshStandardMaterial 
          color={colorHex}
          emissive={colorHex}
          emissiveIntensity={hovered ? 0.4 : 0.15}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      
      {/* Property name text */}
      <Text
        position={[0, tileThickness/2 + 0.01, side === 'top' ? -0.1 : side === 'bottom' ? 0.1 : 0]}
        rotation={textRotation}
        fontSize={0.08}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={width * 0.9}
      >
        {property.name}
      </Text>
      
      {/* Price text */}
      <Text
        position={[0, tileThickness/2 + 0.01, side === 'top' ? 0.2 : side === 'bottom' ? -0.2 : 0]}
        rotation={textRotation}
        fontSize={0.1}
        color="#facc15"
        anchorX="center"
        anchorY="middle"
      >
        ${property.price.toLocaleString()}
      </Text>
      
      {/* Building indicator */}
      {buildingLevel > 0 && (
        <mesh position={[0, tileThickness/2 + 0.15 + (buildingLevel * 0.1), 0]} castShadow>
          <boxGeometry args={[0.2, 0.15 * buildingLevel, 0.2]} />
          <meshStandardMaterial 
            color={buildingLevel >= 4 ? '#FFD700' : '#22c55e'}
            emissive={buildingLevel >= 4 ? '#FFD700' : '#22c55e'}
            emissiveIntensity={0.3}
          />
        </mesh>
      )}
    </group>
  );
}

function CornerTile({ position, label }: { position: [number, number, number]; label: string }) {
  const [hovered, setHovered] = useState(false);
  const size = cornerSize;

  return (
    <group 
      position={[position[0], position[1] + (hovered ? 0.08 : 0), position[2]]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size, tileThickness, size]} />
        <meshStandardMaterial 
          color="#4c1d95" 
          roughness={0.5} 
          metalness={0.3}
          emissive={hovered ? '#7c3aed' : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      
      {/* Accent glow on top */}
      <mesh position={[0, tileThickness/2 + 0.01, 0]}>
        <boxGeometry args={[size - 0.1, 0.02, size - 0.1]} />
        <meshStandardMaterial 
          color="#7c3aed"
          emissive="#7c3aed"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      <Text
        position={[0, tileThickness/2 + 0.02, 0]}
        rotation={[-Math.PI/2, 0, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {label}
      </Text>
    </group>
  );
}

function Scene({ onSelectProperty, spectatorMode, spectatorOwnerships }: Board3DSceneProps) {
  const { gameState } = useGameState();
  
  // Dimensions
  const tileY = boardThickness + tileThickness/2; // Tiles sit on top of board
  
  const halfW = boardWidth / 2;
  const halfH = boardHeight / 2;
  
  // Get building level for a property
  const getBuildingLevel = (propertyId: number) => {
    if (spectatorMode && spectatorOwnerships) {
      const ownership = spectatorOwnerships.find((o: any) => o.propertyId === propertyId);
      return ownership?.buildingLevel || 0;
    }
    return gameState?.ownerships.find(o => o.propertyId === propertyId)?.buildingLevel || 0;
  };
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1.0} castShadow />
      <directionalLight position={[-5, 10, -5]} intensity={0.3} color="#9333ea" />
      
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={8}
        maxDistance={20}
      />
      
      {/* Board base */}
      <mesh position={[0, boardThickness/2, 0]} receiveShadow>
        <boxGeometry args={[boardWidth, boardThickness, boardHeight]} />
        <meshStandardMaterial color="#0f0618" roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Board edge highlight */}
      <mesh position={[0, boardThickness + 0.01, 0]}>
        <boxGeometry args={[boardWidth + 0.05, 0.02, boardHeight + 0.05]} />
        <meshStandardMaterial color="#2d1b4e" roughness={0.5} metalness={0.2} />
      </mesh>
      
      {/* ===== CORNERS ===== */}
      <CornerTile position={[-halfW + cornerSize/2, tileY, -halfH + cornerSize/2]} label="DEFI" />
      <CornerTile position={[halfW - cornerSize/2, tileY, -halfH + cornerSize/2]} label="POLY" />
      <CornerTile position={[-halfW + cornerSize/2, tileY, halfH - cornerSize/2]} label="DEFI" />
      <CornerTile position={[halfW - cornerSize/2, tileY, halfH - cornerSize/2]} label="POLY" />
      
      {/* ===== TOP ROW (properties 11-16) ===== */}
      {[11, 12, 13, 14, 15, 16].map((id, i) => {
        const prop = PROPERTIES.find(p => p.id === id)!;
        const x = -halfW + cornerSize + tileLong/2 + i * tileLong;
        const z = -halfH + tileShort/2;
        return (
          <PropertyTile
            key={id}
            position={[x, tileY, z]}
            width={tileLong}
            depth={tileShort}
            property={prop}
            side="top"
            buildingLevel={getBuildingLevel(id)}
            onClick={() => onSelectProperty(id)}
          />
        );
      })}
      
      {/* ===== BOTTOM ROW (properties 5, 4, 3, 2, 1, 0) ===== */}
      {[5, 4, 3, 2, 1, 0].map((id, i) => {
        const prop = PROPERTIES.find(p => p.id === id)!;
        const x = -halfW + cornerSize + tileLong/2 + i * tileLong;
        const z = halfH - tileShort/2;
        return (
          <PropertyTile
            key={id}
            position={[x, tileY, z]}
            width={tileLong}
            depth={tileShort}
            property={prop}
            side="bottom"
            buildingLevel={getBuildingLevel(id)}
            onClick={() => onSelectProperty(id)}
          />
        );
      })}
      
      {/* ===== LEFT COLUMN (properties 10, 9, 8, 7, 6) ===== */}
      {[10, 9, 8, 7, 6].map((id, i) => {
        const prop = PROPERTIES.find(p => p.id === id)!;
        const x = -halfW + tileShort/2;
        const z = -halfH + cornerSize + tileLong/2 + i * tileLong;
        return (
          <PropertyTile
            key={id}
            position={[x, tileY, z]}
            width={tileShort}
            depth={tileLong}
            property={prop}
            side="left"
            buildingLevel={getBuildingLevel(id)}
            onClick={() => onSelectProperty(id)}
          />
        );
      })}
      
      {/* ===== RIGHT COLUMN (properties 17, 18, 19, 20, 21) ===== */}
      {[17, 18, 19, 20, 21].map((id, i) => {
        const prop = PROPERTIES.find(p => p.id === id)!;
        const x = halfW - tileShort/2;
        const z = -halfH + cornerSize + tileLong/2 + i * tileLong;
        return (
          <PropertyTile
            key={id}
            position={[x, tileY, z]}
            width={tileShort}
            depth={tileLong}
            property={prop}
            side="right"
            buildingLevel={getBuildingLevel(id)}
            onClick={() => onSelectProperty(id)}
          />
        );
      })}
      
      {/* ===== BANK (keep existing) ===== */}
      <group position={[0, 0.5, 0]} scale={0.12}>
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
            position: [0, 12, 10],  // More centered, looking down at board
            fov: 50,
            far: 1000,
            near: 0.1
          }}
          shadows
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