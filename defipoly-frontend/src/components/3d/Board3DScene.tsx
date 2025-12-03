'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useGameState } from '@/contexts/GameStateContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { PROPERTIES } from '@/utils/constants';
import { Bank3D_R3F } from './r3f/Bank3D_R3F';
import { Logo3D_R3F } from './r3f/Logo3D_R3F';
import { House1_R3F } from './r3f/House1_R3F';
import { House2_R3F } from './r3f/House2_R3F';
import { House3_R3F } from './r3f/House3_R3F';
import { House4_R3F } from './r3f/House4_R3F';
import { House5_R3F } from './r3f/House5_R3F';
import { Pin3D_R3F } from './r3f/Pin3D_R3F';
import { useMemo, useEffect, useRef, useState, Suspense, useCallback } from 'react';
import * as THREE from 'three';
import { ResetViewIcon, ZoomInIcon, ZoomOutIcon, HideIcon } from '../icons/UIIcons';
import { InteractiveBank3D } from './InteractiveBank3D';
import { IncomeFlow3D } from './IncomeFlow3D';
import { BoardOnboarding3D } from './BoardOnboarding3D';


interface Board3DSceneProps {
  onSelectProperty: (propertyId: number) => void;
  spectatorMode?: boolean;
  spectatorOwnerships?: any[];
}

interface SceneProps extends Board3DSceneProps {
  cameraControlsRef: React.RefObject<any>;
  particlesVisible: boolean;
  showClaimHint: boolean;
  handleClaimHintDismiss: () => void;
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

// Rising income particles for complete sets
function RisingIncomeParticles({ side, visible = true }: { side: 'top' | 'bottom' | 'left' | 'right'; visible?: boolean }) {
  const particlesRef = useRef<THREE.Group>(null);
  const particleCount = 8;
  
  // Position particles above the house based on tile side
  const getParticleOffset = () => {
    switch (side) {
      case 'top': return { x: 0, z: -0.15 }; // Back of tile (where house is)
      case 'bottom': return { x: 0, z: 0.15 }; // Front of tile (where house is)
      case 'left': return { x: -0.15, z: 0 }; // Left of tile (where house is)
      case 'right': return { x: 0.15, z: 0 }; // Right of tile (where house is)
    }
  };

  const offset = getParticleOffset();

  // Create particle data once
  const particleData = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      startX: offset.x + (Math.random() - 0.5) * 0.15, // Centered on house position with small spread
      startZ: offset.z + (Math.random() - 0.5) * 0.15, // Centered on house position with small spread
      speed: 0.4 + Math.random() * 0.3,
      delay: (i / particleCount) * 3,
      rotSpeed: (Math.random() - 0.5) * 4,
      isPlus: true, // All particles are plus signs now
    }));
  }, [offset.x, offset.z]);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const time = state.clock.elapsedTime;
    
    particlesRef.current.children.forEach((particle, i) => {
      const data = particleData[i];
      if (!data) return;
      const cycleTime = (time * data.speed + data.delay) % 3; // 3 second cycle
      const progress = cycleTime / 3;
      
      // Rise up (reduced height)
      particle.position.y = progress * 0.8;
      
      // Slight horizontal drift
      particle.position.x = data.startX + Math.sin(time + data.delay) * 0.08;
      particle.position.z = data.startZ + Math.cos(time + data.delay) * 0.08;
      
      // No rotation needed since all particles are plus signs
      
      // Fade in and out
      let opacity = 1;
      if (progress < 0.15) {
        opacity = progress / 0.15;
      } else if (progress > 0.7) {
        opacity = (1 - progress) / 0.3;
      }
      
      // Update material opacity - hide if not visible
      particle.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          (child.material as THREE.MeshBasicMaterial).opacity = visible ? opacity * 0.85 : 0;
        }
      });
      
      // Scale based on progress
      const scale = 0.7 + Math.sin(progress * Math.PI) * 0.3;
      particle.scale.setScalar(scale);
    });
  });

  return (
    <group ref={particlesRef} position={[0, tileThickness / 2 + 0.05, 0]}>
      {particleData.map((data, i) => (
        <group key={i} position={[data.startX, 0, data.startZ]}>
          {/* Green plus sign */}
          <group>
            <mesh>
              <boxGeometry args={[0.08, 0.02, 0.02]} />
              <meshBasicMaterial color="#22c55e" transparent opacity={0} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.02, 0.08, 0.02]} />
              <meshBasicMaterial color="#22c55e" transparent opacity={0} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}


interface PropertyTileProps {
  position: [number, number, number];
  width: number;  // tileLong for top/bottom, tileShort for left/right
  depth: number;  // tileShort for top/bottom, tileLong for left/right
  property: typeof PROPERTIES[0];
  side: 'top' | 'bottom' | 'left' | 'right';
  buildingLevel: number;
  hasCompleteSet: boolean;
  particlesVisible: boolean;
  onClick: () => void;
  interactive?: boolean;  // NEW
}

function PropertyTile({ 
  position, 
  width, 
  depth, 
  property, 
  side, 
  buildingLevel, 
  hasCompleteSet, 
  particlesVisible, 
  onClick,
  interactive = true  // Default true for backwards compatibility
}: PropertyTileProps) {
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
  const textRotation: [number, number, number] = (() => {
    switch (side) {
      case 'top': return [-Math.PI/2, 0, Math.PI];      // 180° - faces outward/up
      case 'bottom': return [-Math.PI/2, 0, 0];         // 0° - faces outward/down
      case 'left': return [-Math.PI/2, 0, -Math.PI/2];  // -90° - faces left (corrected)
      case 'right': return [-Math.PI/2, 0, Math.PI/2];  // +90° - faces right (corrected)
    }
  })();

  // Text positions based on side
  // Property NAME: toward CENTER (near color strip)
  // Property PRICE: toward OUTSIDE (away from color strip)
  let namePosition: [number, number, number] = [0, 0, 0];
  let pricePosition: [number, number, number] = [0, 0, 0];
  
  if (side === 'top') {
    // Color strip is at +Z (back), name near strip, price away from strip
    namePosition = [0, tileThickness/2 + 0.01, depth/2 - 0.35];  // Moved further from color strip
    pricePosition = [0, tileThickness/2 + 0.01, -depth/2 + 0.1]; // Away from color strip (toward outside)
  } else if (side === 'bottom') {
    // Color strip is at -Z (front), name near strip, price away from strip  
    namePosition = [0, tileThickness/2 + 0.01, -depth/2 + 0.35]; // Moved further from color strip
    pricePosition = [0, tileThickness/2 + 0.01, depth/2 - 0.1];  // Away from color strip (toward outside)
  } else if (side === 'left') {
    // Color strip is at +X (right), name near strip, price away from strip
    namePosition = [width/2 - 0.35, tileThickness/2 + 0.01, 0];  // Moved further from color strip
    pricePosition = [-width/2 + 0.1, tileThickness/2 + 0.01, 0]; // Away from color strip (toward outside)
  } else if (side === 'right') {
    // Color strip is at -X (left), name near strip, price away from strip
    namePosition = [-width/2 + 0.35, tileThickness/2 + 0.01, 0]; // Moved further from color strip
    pricePosition = [width/2 - 0.1, tileThickness/2 + 0.01, 0];  // Away from color strip (toward outside)
  }

  return (
    <group 
      position={[position[0], position[1] + (hovered && interactive ? 0.08 : 0), position[2]]}
      onPointerOver={() => interactive && setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => interactive && onClick()}
    >
      {/* Tile base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, tileThickness, depth]} />
        <meshStandardMaterial 
          color={interactive ? "#3a2a4a" : "#2a1f2f"} 
          roughness={0.7}
          metalness={0.15}
          emissive={hovered && interactive ? colorHex : '#000000'}
          emissiveIntensity={hovered && interactive ? 0.15 : 0}
        />
      </mesh>
      
      {/* Color strip */}
      <mesh position={stripPosition} castShadow>
        <boxGeometry args={stripSize} />
        <meshStandardMaterial 
          color={colorHex}
          emissive={colorHex}
          emissiveIntensity={interactive ? (hovered ? 0.4 : 0.15) : 0.08}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      
      {/* Property name text - near color strip (toward center) */}
      <Suspense fallback={null}>
        <Text
          position={namePosition}
          rotation={textRotation}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={width * 0.9}
        >
          {property.name}
        </Text>
      </Suspense>
      
      {/* Price text - away from color strip (toward outside) */}
      <Suspense fallback={null}>
        <Text
          position={pricePosition}
          rotation={textRotation}
          fontSize={0.1}
          color="#facc15"
          anchorX="center"
          anchorY="middle"
        >
          ${property.price.toLocaleString()}
        </Text>
      </Suspense>
      
      {/* 3D House or Pin */}
      {buildingLevel > 0 ? (
        <HouseOnTile buildingLevel={buildingLevel} side={side} propertyColor={property.color} />
      ) : (
        <PinOnTile propertyId={property.id} side={side} />
      )}
      
      {/* Rising income particles for complete sets */}
      {hasCompleteSet && buildingLevel > 0 && <RisingIncomeParticles side={side} visible={particlesVisible} />}
    </group>
  );
}

function CornerTile({ position, cornerType }: { position: [number, number, number]; cornerType: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' }) {
  const [hovered, setHovered] = useState(false);
  const size = cornerSize;

  return (
    <group 
      position={[position[0], position[1] + (hovered ? 0.08 : 0), position[2]]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Base tile */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size, tileThickness, size]} />
        <meshStandardMaterial 
          color="#6d28d9" 
          roughness={0.5} 
          metalness={0.3}
          emissive={hovered ? '#7c3aed' : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      
      {/* "DEFIPOLY" text */}
      <Suspense fallback={null}>
        <Text
          position={[0, tileThickness/2 + 0.05, 0]}
          rotation={[-Math.PI/2, 0, 0]}
          fontSize={0.1}
          color="#facc15"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          DEFIPOLY
        </Text>
      </Suspense>

      {/* Decorative corner accents */}
      {[-0.35, 0.35].map((offset, i) => (
        <mesh key={`accent-${i}`} position={[offset, tileThickness/2 + 0.03, offset]} castShadow>
          <boxGeometry args={[0.05, 0.02, 0.05]} />
          <meshStandardMaterial 
            color="#facc15"
            emissive="#facc15"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function PinOnTile({ propertyId, side }: { propertyId: number; side: 'top' | 'bottom' | 'left' | 'right' }) {
  const property = PROPERTIES.find(p => p.id === propertyId);
  if (!property) return null;
  
  // Pin rotation based on tile side - face outward from board center
  const pinRotation: [number, number, number] = (() => {
    switch (side) {
      case 'top': return [0, Math.PI, 0];      // Face outward (toward viewer from top)
      case 'bottom': return [0, 0, 0];         // Face outward (toward viewer from bottom)
      case 'left': return [0, -Math.PI/2, 0];  // Face outward (toward viewer from left)
      case 'right': return [0, Math.PI/2, 0];  // Face outward (toward viewer from right)
    }
  })();
  
  // Position pin on tile surface (lower than before)
  const pinY = tileThickness/2 + 0.02;
  
  // Scale - pins should be smaller on the board
  const pinScale = 0.075;
  
  // Position pin away from property name based on tile side (same as houses)
  let pinXOffset = 0;
  let pinZOffset = 0;
  
  if (side === 'top') pinZOffset = -0.15;        // Move toward back of tile
  else if (side === 'bottom') pinZOffset = 0.15; // Move toward front of tile
  else if (side === 'left') pinXOffset = -0.15;  // Move toward left of tile
  else if (side === 'right') pinXOffset = 0.15;  // Move toward right of tile

  return (
    <group position={[pinXOffset, pinY, pinZOffset]} rotation={pinRotation} scale={pinScale}>
      <Suspense fallback={null}>
        <Pin3D_R3F color={property.color} />
      </Suspense>
    </group>
  );
}

function HouseOnTile({ buildingLevel, side, propertyColor }: { 
  buildingLevel: number; 
  side: 'top' | 'bottom' | 'left' | 'right'; 
  propertyColor?: string 
}) {
  console.log(`[3D House] Rendering house with level: ${buildingLevel}, side: ${side}`);
  if (buildingLevel <= 0) {
    console.log(`[3D House] No house - building level is ${buildingLevel}`);
    return null;
  }
  
  // House rotation based on tile side - face outward from board center
  const houseRotation: [number, number, number] = (() => {
    switch (side) {
      case 'top': return [0, Math.PI, 0];      // Face outward (toward viewer from top)
      case 'bottom': return [0, 0, 0];         // Face outward (toward viewer from bottom)
      case 'left': return [0, -Math.PI/2, 0];  // Face outward (toward viewer from left)
      case 'right': return [0, Math.PI/2, 0];  // Face outward (toward viewer from right)
    }
  })();
  
  // Position house on tile surface (lower)
  const houseY = tileThickness/2 - 0.02;
  
  // Individual house scales - adjust each house size independently
  const houseScales = {
    1: 0.08,
    2: 0.08, 
    3: 0.12,
    4: 0.06,
    5: 0.06,  // Made châteaux smaller
  };
  
  const houseScale = houseScales[buildingLevel as keyof typeof houseScales] || 0.08;
  
  const HouseComponent = {
    1: House1_R3F,
    2: House2_R3F,
    3: House3_R3F,
    4: House4_R3F,
    5: House5_R3F,
  }[buildingLevel] || House1_R3F;

  // Position house away from property name based on tile side
  let houseXOffset = 0;
  let houseZOffset = 0;
  
  if (side === 'top') houseZOffset = -0.15;        // Move further toward back of tile
  else if (side === 'bottom') houseZOffset = 0.15; // Move further toward front of tile
  else if (side === 'left') houseXOffset = -0.15;  // Move toward left of tile (away from property name)
  else if (side === 'right') houseXOffset = 0.15;  // Move toward right of tile (away from property name)

  return (
    <group position={[houseXOffset, houseY, houseZOffset]} rotation={houseRotation} scale={houseScale}>
      <Suspense fallback={null}>
        <HouseComponent isPulsing={false} color={propertyColor} />
      </Suspense>
    </group>
  );
}

function Scene({ onSelectProperty, spectatorMode, spectatorOwnerships, cameraControlsRef, particlesVisible, showClaimHint, handleClaimHintDismiss }: SceneProps) {
  const gameState = useGameState();
  const { connected } = useWallet();
  const ownerships = gameState?.ownerships || [];
  const bankRef = useRef<any>(null);
  
  // Calculate if user has any properties
  const hasProperties = useMemo(() => {
    const currentOwnerships = spectatorMode ? spectatorOwnerships : gameState?.ownerships || [];
    return currentOwnerships.some(o => o.slotsOwned > 0);
  }, [spectatorMode, spectatorOwnerships, gameState?.ownerships]);
  
  // Force re-render when ownerships changes
  const gameStateLoaded = !spectatorMode ? ownerships.length > 0 : true;
  console.log(`[3D Scene] Re-rendering - gameStateLoaded: ${gameStateLoaded}, ownerships count: ${ownerships.length}, full gameState:`, !!gameState);
  
  // Dimensions
  const tileY = boardThickness + tileThickness/2; // Tiles sit on top of board
  
  const halfW = boardWidth / 2;
  const halfH = boardHeight / 2;
  
  // Get building level for a property (calculated from slotsOwned using PropertyCard logic)
  const getBuildingLevel = useCallback((propertyId: number): number => {
    // Wait for ownerships to load before checking
    if (!spectatorMode && ownerships.length === 0) {
      console.log(`[3D] Property ${propertyId}: Ownerships not loaded yet (length: ${ownerships.length})`);
      return 0; // Return 0 until ownerships load
    }
    
    let ownership;
    
    if (spectatorMode && spectatorOwnerships) {
      ownership = spectatorOwnerships.find((o: any) => o.propertyId === propertyId);
    } else {
      ownership = ownerships.find(o => o.propertyId === propertyId);
    }
    
    // No ownership or no slots = no building
    if (!ownership || ownership.slotsOwned === 0) {
      console.log(`[3D] Property ${propertyId}: No ownership or slots (ownership: ${JSON.stringify(ownership)})`);
      return 0;
    }

    const property = PROPERTIES.find(p => p.id === propertyId);
    if (!property) {
      console.log(`[3D] Property ${propertyId}: Property not found in PROPERTIES`);
      return 0;
    }

    // Use the same calculation as PropertyCard.tsx (lines 186-189)
    const maxPerPlayer = property.maxPerPlayer || 10;
    const progressRatio = ownership.slotsOwned / maxPerPlayer;
    const level = Math.ceil(progressRatio * 5);
    
    console.log(`[3D] Property ${propertyId} (${property.name}): slots=${ownership.slotsOwned}, max=${maxPerPlayer}, ratio=${progressRatio}, level=${level}`);
    
    return Math.min(level, 5);
  }, [ownerships, spectatorMode, spectatorOwnerships]);
  
  // Check if a property is part of a complete set
  const isPropertyInCompleteSet = useCallback((propertyId: number): boolean => {
    const property = PROPERTIES.find(p => p.id === propertyId);
    if (!property) return false;
    
    const propertiesInSet = PROPERTIES.filter(p => p.setId === property.setId);
    const requiredProps = property.setId === 0 || property.setId === 7 ? 2 : 3;
    
    const ownerships = spectatorMode ? spectatorOwnerships : gameState?.ownerships || [];
    
    const ownedInSet = ownerships.filter(o => 
      propertiesInSet.some(p => p.id === o.propertyId) && o.slotsOwned > 0
    ).length;
    
    return ownedInSet >= requiredProps;
  }, [gameState?.ownerships, spectatorMode, spectatorOwnerships]);
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 10, -5]} intensity={0.5} color="#9333ea" />
      <directionalLight position={[0, 15, 0]} intensity={0.4} color="#ffffff" />
      <pointLight position={[5, 8, 5]} intensity={0.3} color="#facc15" />
      <pointLight position={[-5, 8, -5]} intensity={0.3} color="#22c55e" />
      
      <OrbitControls
        ref={cameraControlsRef}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={25}
      />
      
      {/* Board base */}
      <mesh position={[0, boardThickness/2, 0]} receiveShadow>
        <boxGeometry args={[boardWidth, boardThickness, boardHeight]} />
        <meshStandardMaterial color="#2a1a3a" roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Board edge highlight */}
      <mesh position={[0, boardThickness + 0.01, 0]}>
        <boxGeometry args={[boardWidth + 0.05, 0.02, boardHeight + 0.05]} />
        <meshStandardMaterial color="#4c3b6e" roughness={0.5} metalness={0.2} />
      </mesh>
      
      {/* ===== CORNERS ===== */}
      <CornerTile position={[-halfW + cornerSize/2, tileY, -halfH + cornerSize/2]} cornerType="topLeft" />
      <CornerTile position={[halfW - cornerSize/2, tileY, -halfH + cornerSize/2]} cornerType="topRight" />
      <CornerTile position={[-halfW + cornerSize/2, tileY, halfH - cornerSize/2]} cornerType="bottomLeft" />
      <CornerTile position={[halfW - cornerSize/2, tileY, halfH - cornerSize/2]} cornerType="bottomRight" />
      
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
            hasCompleteSet={isPropertyInCompleteSet(id)}
            particlesVisible={particlesVisible}
            onClick={() => onSelectProperty(id)}
            interactive={connected}
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
            hasCompleteSet={isPropertyInCompleteSet(id)}
            particlesVisible={particlesVisible}
            onClick={() => onSelectProperty(id)}
            interactive={connected}
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
            hasCompleteSet={isPropertyInCompleteSet(id)}
            particlesVisible={particlesVisible}
            onClick={() => onSelectProperty(id)}
            interactive={connected}
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
            hasCompleteSet={isPropertyInCompleteSet(id)}
            particlesVisible={particlesVisible}
            onClick={() => onSelectProperty(id)}
            interactive={connected}
          />
        );
      })}
      
      {/* ===== CENTER CONTENT ===== */}
      {!connected ? (
        // Not connected: Show spinning logo
        <group position={[0, 1.0, 0]} scale={0.45}>
          <Suspense fallback={null}>
            <Logo3D_R3F />
          </Suspense>
        </group>
      ) : (
        // Connected (with or without properties): Show bank
        <InteractiveBank3D 
          ref={bankRef}
          position={[0, 0.8, 0]} 
          scale={0.084}
          showClaimHint={showClaimHint}
          onClaimHintDismiss={handleClaimHintDismiss}
        />
      )}
      
      {/* ===== ONBOARDING OVERLAYS ===== */}
      <BoardOnboarding3D hasProperties={hasProperties} />
      
      {/* ===== 3D INCOME FLOW ===== */}
      {!spectatorMode && hasProperties && (
        <IncomeFlow3D 
          enabled={true}
          particlesVisible={particlesVisible}
          onParticleArrive={() => {
            // Trigger bank counter increment via ref
            if (bankRef.current?.handleParticleArrive) {
              bankRef.current.handleParticleArrive();
            }
          }}
        />
      )}
    </>
  );
}

export function Board3DScene({ onSelectProperty, spectatorMode, spectatorOwnerships }: Board3DSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [particlesVisible, setParticlesVisible] = useState(true);
  const [showClaimHint, setShowClaimHint] = useState(false);
  const cameraControlsRef = useRef<any>(null);
  const { publicKey } = useWallet();
  const gameState = useGameState();
  const hasTriggeredHintRef = useRef(false);
  const previousOwnershipsCountRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for first purchase and trigger hint
  useEffect(() => {
    if (!publicKey) return;
    
    const walletKey = publicKey.toBase58();
    const storageKey = `hasSeenClaimHint_${walletKey}`;
    
    // Already seen hint
    if (localStorage.getItem(storageKey) === 'true') return;
    
    // Get current ownership count
    const currentCount = spectatorMode 
      ? (spectatorOwnerships?.filter(o => o.slotsOwned > 0).length || 0)
      : (gameState?.ownerships?.filter(o => o.slotsOwned > 0).length || 0);
    
    // Detect first purchase (0 -> 1+)
    if (previousOwnershipsCountRef.current === 0 && currentCount > 0 && !hasTriggeredHintRef.current) {
      hasTriggeredHintRef.current = true;
      
      // Show hint after 1 minute
      const timer = setTimeout(() => {
        // Double-check they haven't seen it (e.g., page refresh during wait)
        if (localStorage.getItem(storageKey) !== 'true') {
          setShowClaimHint(true);
        }
      }, 60000); // 1 minute
      
      return () => clearTimeout(timer);
    }
    
    previousOwnershipsCountRef.current = currentCount;
  }, [publicKey, gameState?.ownerships, spectatorMode, spectatorOwnerships]);

  // Callback when hint is dismissed (on hover)
  const handleClaimHintDismiss = useCallback(() => {
    if (!publicKey) return;
    
    setShowClaimHint(false);
    const storageKey = `hasSeenClaimHint_${publicKey.toBase58()}`;
    localStorage.setItem(storageKey, 'true');
  }, [publicKey]);

  // Camera control functions
  const resetView = () => {
    if (cameraControlsRef.current) {
      cameraControlsRef.current.reset();
    }
  };

  const zoomIn = () => {
    if (cameraControlsRef.current) {
      const camera = cameraControlsRef.current.object;
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const newPosition = camera.position.clone().add(direction.multiplyScalar(1));
      camera.position.copy(newPosition);
      cameraControlsRef.current.update();
    }
  };

  const zoomOut = () => {
    if (cameraControlsRef.current) {
      const camera = cameraControlsRef.current.object;
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const newPosition = camera.position.clone().add(direction.multiplyScalar(-1));
      camera.position.copy(newPosition);
      cameraControlsRef.current.update();
    }
  };

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
      {/* Camera Controls */}
      <div 
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 100,
          display: 'flex',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '8px',
          borderRadius: '8px',
        }}
      >
        <button
          onClick={() => setParticlesVisible(!particlesVisible)}
          title={particlesVisible ? "Hide Particles" : "Show Particles"}
          style={{
            background: particlesVisible ? '#6d28d9' : '#374151',
            color: 'white',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseOver={(e) => e.target.style.background = particlesVisible ? '#7c3aed' : '#4b5563'}
          onMouseOut={(e) => e.target.style.background = particlesVisible ? '#6d28d9' : '#374151'}
        >
          <HideIcon size={16} />
        </button>
        <button
          onClick={resetView}
          title="Reset View"
          style={{
            background: '#6d28d9',
            color: 'white',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseOver={(e) => e.target.style.background = '#7c3aed'}
          onMouseOut={(e) => e.target.style.background = '#6d28d9'}
        >
          <ResetViewIcon size={16} />
        </button>
        <button
          onClick={zoomIn}
          title="Zoom In"
          style={{
            background: '#6d28d9',
            color: 'white',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseOver={(e) => e.target.style.background = '#7c3aed'}
          onMouseOut={(e) => e.target.style.background = '#6d28d9'}
        >
          <ZoomInIcon size={16} />
        </button>
        <button
          onClick={zoomOut}
          title="Zoom Out"
          style={{
            background: '#6d28d9',
            color: 'white',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseOver={(e) => e.target.style.background = '#7c3aed'}
          onMouseOut={(e) => e.target.style.background = '#6d28d9'}
        >
          <ZoomOutIcon size={16} />
        </button>
      </div>

      {containerRef.current && (
        <Canvas
          camera={{ 
            position: [0, 8, 6],  // Closer initial view - zoomed in more
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
            cameraControlsRef={cameraControlsRef}
            particlesVisible={particlesVisible}
            showClaimHint={showClaimHint}
            handleClaimHintDismiss={handleClaimHintDismiss}
          />
        </Canvas>
      )}
    </div>
  );
}