'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, PerspectiveCamera, Html } from '@react-three/drei';
import { useGameState } from '@/contexts/GameStateContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { PROPERTIES } from '@/utils/constants';
import { Logo3D_R3F } from './r3f/Logo3D_R3F';
import { House1_R3F } from './r3f/House1_R3F';
import { House2_R3F } from './r3f/House2_R3F';
import { House3_R3F } from './r3f/House3_R3F';
import { House4_R3F } from './r3f/House4_R3F';
import { House5_R3F } from './r3f/House5_R3F';
import { Pin3D_R3F } from './r3f/Pin3D_R3F';
import { useMemo, useEffect, useRef, useState, Suspense, useCallback } from 'react';
import * as THREE from 'three';
import { ResetViewIcon, ZoomInIcon, ZoomOutIcon, HideIcon, PointerArrowIcon } from '../icons/UIIcons';
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
  connected: boolean;
  hasProperties: boolean;
}

// EXACT DIMENSIONS TO MATCH PROTOTYPE
const cornerSize = 1.0;
const tileLong = 0.82;
const tileShort = 1.0;
const boardWidth = cornerSize * 2 + tileLong * 6;
const boardHeight = cornerSize * 2 + tileLong * 5;
const boardThickness = 0.25;
const tileThickness = 0.15;
const colorStripThickness = 0.16;
const colorStripWidth = 0.15;

// Camera positions for zoom transition
const CAMERA_POSITIONS = {
  ZOOMED_OUT: {
    position: new THREE.Vector3(0, 18, 25),
    lookAt: new THREE.Vector3(0, 5, 0),  // Look above board - pushes board lower on screen
  },
  ZOOMED_IN: {
    position: new THREE.Vector3(0, 8, 6),  // Much closer!
    lookAt: new THREE.Vector3(0, 0, 0),   // Look at board center
  },
};

/**
 * CameraController - Animates camera based on connection state
 * Stops animating once transition is complete to allow manual control
 * Skips animation if already connected on page load
 */
function CameraController({ 
  connected, 
  controlsRef 
}: { 
  connected: boolean; 
  controlsRef: React.RefObject<any>;
}) {
  const targetPosition = useRef(CAMERA_POSITIONS.ZOOMED_OUT.position.clone());
  const targetLookAt = useRef(CAMERA_POSITIONS.ZOOMED_OUT.lookAt.clone());
  const currentLookAt = useRef(CAMERA_POSITIONS.ZOOMED_OUT.lookAt.clone());
  const animationComplete = useRef(false);
  const isInitialMount = useRef(true);
  const needsImmediateSnap = useRef(false);
  const prevConnected = useRef<boolean | null>(null);

  // Handle initial mount and connection changes
  useEffect(() => {
    const config = connected ? CAMERA_POSITIONS.ZOOMED_IN : CAMERA_POSITIONS.ZOOMED_OUT;
    targetPosition.current.copy(config.position);
    targetLookAt.current.copy(config.lookAt);
    
    // On initial mount, if already connected, skip animation and snap immediately
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (connected) {
        // Already connected - skip animation, snap to zoomed in position
        animationComplete.current = true;
        needsImmediateSnap.current = true;
        currentLookAt.current.copy(config.lookAt);
      }
      prevConnected.current = connected;
      return;
    }
    
    // Reset animation when connection state changes (disconnected -> connected)
    if (prevConnected.current !== connected) {
      animationComplete.current = false;
      prevConnected.current = connected;
    }
  }, [connected]);

  useFrame(({ camera }) => {
    // Handle immediate snap for already-connected users
    if (needsImmediateSnap.current) {
      camera.position.copy(targetPosition.current);
      currentLookAt.current.copy(targetLookAt.current);
      if (controlsRef.current) {
        controlsRef.current.target.copy(currentLookAt.current);
        controlsRef.current.update();
      }
      needsImmediateSnap.current = false;
      return;
    }
    
    // Skip if animation is complete (allows manual control)
    if (animationComplete.current) return;
    
    const lerpSpeed = 0.05;  // Faster animation

    // Lerp camera position
    camera.position.lerp(targetPosition.current, lerpSpeed);

    // Lerp lookAt target
    currentLookAt.current.lerp(targetLookAt.current, lerpSpeed);
    
    // Update OrbitControls target
    if (controlsRef.current) {
      controlsRef.current.target.copy(currentLookAt.current);
      controlsRef.current.update();
    }
    
    // Check if animation is close enough to complete
    const positionDist = camera.position.distanceTo(targetPosition.current);
    const lookAtDist = currentLookAt.current.distanceTo(targetLookAt.current);
    
    if (positionDist < 0.1 && lookAtDist < 0.1) {
      // Snap to final position
      camera.position.copy(targetPosition.current);
      currentLookAt.current.copy(targetLookAt.current);
      if (controlsRef.current) {
        controlsRef.current.target.copy(currentLookAt.current);
        controlsRef.current.update();
      }
      animationComplete.current = true;
    }
  });

  return null;
}

// Rising income particles for complete sets
function RisingIncomeParticles({ side, visible = true }: { side: 'top' | 'bottom' | 'left' | 'right'; visible?: boolean }) {
  const particlesRef = useRef<THREE.Group>(null);
  const particleCount = 8;
  
  const getParticleOffset = () => {
    switch (side) {
      case 'top': return { x: 0, z: -0.15 };
      case 'bottom': return { x: 0, z: 0.15 };
      case 'left': return { x: -0.15, z: 0 };
      case 'right': return { x: 0.15, z: 0 };
    }
  };

  const offset = getParticleOffset();

  const particleData = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      startX: offset.x + (Math.random() - 0.5) * 0.15,
      startZ: offset.z + (Math.random() - 0.5) * 0.15,
      speed: 0.4 + Math.random() * 0.3,
      delay: (i / particleCount) * 3,
      rotSpeed: (Math.random() - 0.5) * 4,
      isPlus: true,
    }));
  }, [offset.x, offset.z]);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const time = state.clock.elapsedTime;
    
    particlesRef.current.children.forEach((particle, i) => {
      const data = particleData[i];
      const cycleTime = (time * data.speed + data.delay) % 3;
      const progress = cycleTime / 3;
      
      particle.position.y = progress * 0.8;
      particle.position.x = data.startX + Math.sin(time + data.delay) * 0.08;
      particle.position.z = data.startZ + Math.cos(time + data.delay) * 0.08;
      
      let opacity = 1;
      if (progress < 0.15) {
        opacity = progress / 0.15;
      } else if (progress > 0.7) {
        opacity = (1 - progress) / 0.3;
      }
      
      particle.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          (child.material as THREE.MeshBasicMaterial).opacity = visible ? opacity * 0.85 : 0;
        }
      });
      
      const scale = 0.7 + Math.sin(progress * Math.PI) * 0.3;
      particle.scale.setScalar(scale);
    });
  });

  return (
    <group ref={particlesRef} position={[0, tileThickness / 2 + 0.05, 0]}>
      {particleData.map((data, i) => (
        <group key={i} position={[data.startX, 0, data.startZ]}>
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
  width: number;
  depth: number;
  property: typeof PROPERTIES[0];
  side: 'top' | 'bottom' | 'left' | 'right';
  buildingLevel: number;
  hasCompleteSet: boolean;
  particlesVisible: boolean;
  onClick: () => void;
  interactive?: boolean;
  showPropertyHint?: boolean;
}

function PropertyTile({ position, width, depth, property, side, buildingLevel, hasCompleteSet, particlesVisible, onClick, interactive = true, showPropertyHint = false }: PropertyTileProps) {
  const [hovered, setHovered] = useState(false);
  const getColorHex = (colorClass: string) => {
    const colorMap: { [key: string]: string } = {
      'bg-amber-900': '#78350f',
      'bg-sky-300': '#7dd3fc',
      'bg-pink-400': '#f472b6',
      'bg-orange-500': '#f97316',
      'bg-red-600': '#dc2626',
      'bg-yellow-500': '#eab308',
      'bg-green-600': '#16a34a',
      'bg-blue-900': '#1e3a8a',
    };
    return colorMap[colorClass] || '#8b5cf6';
  };
  
  const colorHex = getColorHex(property.color);
  
  let stripPosition: [number, number, number] = [0, 0, 0];
  let stripSize: [number, number, number] = [0, 0, 0];
  
  if (side === 'top') {
    stripPosition = [0, tileThickness/2 + colorStripThickness/2, depth/2 - colorStripWidth/2 - 0.02];
    stripSize = [width - 0.04, colorStripThickness, colorStripWidth];
  } else if (side === 'bottom') {
    stripPosition = [0, tileThickness/2 + colorStripThickness/2, -depth/2 + colorStripWidth/2 + 0.02];
    stripSize = [width - 0.04, colorStripThickness, colorStripWidth];
  } else if (side === 'left') {
    stripPosition = [width/2 - colorStripWidth/2 - 0.02, tileThickness/2 + colorStripThickness/2, 0];
    stripSize = [colorStripWidth, colorStripThickness, depth - 0.04];
  } else if (side === 'right') {
    stripPosition = [-width/2 + colorStripWidth/2 + 0.02, tileThickness/2 + colorStripThickness/2, 0];
    stripSize = [colorStripWidth, colorStripThickness, depth - 0.04];
  }
  
  const textRotation: [number, number, number] = {
    top: [-Math.PI/2, 0, Math.PI],
    bottom: [-Math.PI/2, 0, 0],
    left: [-Math.PI/2, 0, -Math.PI/2],
    right: [-Math.PI/2, 0, Math.PI/2],
  }[side];

  let namePosition: [number, number, number] = [0, 0, 0];
  let pricePosition: [number, number, number] = [0, 0, 0];
  
  if (side === 'top') {
    namePosition = [0, tileThickness/2 + 0.01, depth/2 - 0.35];
    pricePosition = [0, tileThickness/2 + 0.01, -depth/2 + 0.1];
  } else if (side === 'bottom') {
    namePosition = [0, tileThickness/2 + 0.01, -depth/2 + 0.35];
    pricePosition = [0, tileThickness/2 + 0.01, depth/2 - 0.1];
  } else if (side === 'left') {
    namePosition = [width/2 - 0.35, tileThickness/2 + 0.01, 0];
    pricePosition = [-width/2 + 0.1, tileThickness/2 + 0.01, 0];
  } else if (side === 'right') {
    namePosition = [-width/2 + 0.35, tileThickness/2 + 0.01, 0];
    pricePosition = [width/2 - 0.1, tileThickness/2 + 0.01, 0];
  }

  const hoverY = hovered && interactive ? 0.08 : 0;

  return (
    <group 
      position={[position[0], position[1] + hoverY, position[2]]}
      onPointerOver={() => interactive && setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => interactive && onClick()}
    >
      {/* Tile base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, tileThickness, depth]} />
        <meshStandardMaterial 
          color={interactive ? "#3a2a4a" : "#2a1a3a"}
          roughness={0.7}
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
      
      
      {/* Property name text */}
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
      
      {/* Price text */}
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
        <HouseOnTile buildingLevel={buildingLevel} side={side} propertyId={property.id} />
      ) : (
        <PinOnTile propertyId={property.id} side={side} showHint={showPropertyHint} />
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

function PinOnTile({ propertyId, side, showHint = false }: { propertyId: number; side: 'top' | 'bottom' | 'left' | 'right'; showHint?: boolean }) {
  const property = PROPERTIES.find(p => p.id === propertyId);
  if (!property) return null;
  
  const arrowRef = useRef<any>(null);
  
  // Debug logging
  useEffect(() => {
    if (showHint) {
      console.log(`🏠 Pin ${propertyId} showing hint arrow!`);
    }
  }, [showHint, propertyId]);

  // Animate the golden hint arrow
  useFrame((state) => {
    if (arrowRef.current && showHint) {
      const t = state.clock.elapsedTime;
      const pulse = Math.sin(t * 2.5) * 0.4 + 0.8; // Oscillates between 0.4 and 1.2
      const float = Math.sin(t * 1.5) * 3; // Gentle up/down float
      arrowRef.current.style.opacity = pulse;
      arrowRef.current.style.transform = `translateY(${float}px) rotate(90deg)`;
    }
  });
  
  const pinRotation: [number, number, number] = {
    top: [0, Math.PI, 0],
    bottom: [0, 0, 0],
    left: [0, -Math.PI/2, 0],
    right: [0, Math.PI/2, 0],
  }[side];
  
  const pinY = tileThickness/2 + 0.02;
  const pinScale = 0.075;
  
  let pinXOffset = 0;
  let pinZOffset = 0;
  
  if (side === 'top') pinZOffset = -0.15;
  else if (side === 'bottom') pinZOffset = 0.15;
  else if (side === 'left') pinXOffset = -0.15;
  else if (side === 'right') pinXOffset = 0.15;

  return (
    <group position={[pinXOffset, pinY, pinZOffset]} rotation={pinRotation} scale={pinScale}>
      {/* Golden hint arrow */}
      {showHint && (
        <Html
          center
          position={[0, 6, 0]}
          style={{
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          <div
            ref={arrowRef}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <PointerArrowIcon className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]" />
          </div>
        </Html>
      )}
      
      <Suspense fallback={null}>
        <Pin3D_R3F color={property.color} />
      </Suspense>
    </group>
  );
}

function HouseOnTile({ buildingLevel, side, propertyId }: { 
  buildingLevel: number; 
  side: 'top' | 'bottom' | 'left' | 'right'; 
  propertyId: number 
}) {
  if (buildingLevel <= 0) return null;
  
  // Look up property info (like PinOnTile does)
  const property = PROPERTIES.find(p => p.id === propertyId);
  if (!property) {
    console.log(`[HouseOnTile] Property not found for propertyId: ${propertyId}`);
    return null;
  }
  
  console.log(`[HouseOnTile] Building level ${buildingLevel} house on property ${propertyId} (${property.name}) with color: ${property.color}`);
  
  const houseRotation: [number, number, number] = {
    top: [0, Math.PI, 0],
    bottom: [0, 0, 0],
    left: [0, -Math.PI/2, 0],
    right: [0, Math.PI/2, 0],
  }[side];
  
  const houseY = tileThickness/2 - 0.02;
  
  const houseScales = {
    1: 0.08,
    2: 0.08, 
    3: 0.12,
    4: 0.06,
    5: 0.08,
  };
  
  const houseScale = houseScales[buildingLevel as keyof typeof houseScales] || 0.08;
  
  const HouseComponent = {
    1: House1_R3F,
    2: House2_R3F,
    3: House3_R3F,
    4: House4_R3F,
    5: House5_R3F,
  }[buildingLevel] || House1_R3F;

  let houseXOffset = 0;
  let houseZOffset = 0;
  
  if (side === 'top') houseZOffset = -0.15;
  else if (side === 'bottom') houseZOffset = 0.15;
  else if (side === 'left') houseXOffset = -0.15;
  else if (side === 'right') houseXOffset = 0.15;

  // Log what we're passing to the house component
  console.log(`[HouseOnTile] Rendering ${HouseComponent.name} with color prop: ${property.color}`);
  
  return (
    <group position={[houseXOffset, houseY, houseZOffset]} rotation={houseRotation} scale={houseScale}>
      <Suspense fallback={null}>
        <HouseComponent color={property.color} />
      </Suspense>
    </group>
  );
}

function Scene({ 
  onSelectProperty, 
  spectatorMode, 
  spectatorOwnerships, 
  cameraControlsRef, 
  particlesVisible, 
  showClaimHint, 
  handleClaimHintDismiss,
  connected,
  hasProperties
}: SceneProps) {
  const gameState = useGameState();
  const ownerships = gameState?.ownerships || [];
  const bankRef = useRef<any>(null);
  
  // Check if we should show property hint (connected but no properties and hasn't opened modal yet)
  const [hasOpenedModal, setHasOpenedModal] = useState(false);
  const [showPropertyHint, setShowPropertyHint] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasOpened = localStorage.getItem('hasOpenedPropertyModal') === 'true';
      setHasOpenedModal(hasOpened);
      
      const handleStorageChange = () => {
        setHasOpenedModal(localStorage.getItem('hasOpenedPropertyModal') === 'true');
      };
      
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('propertyModalOpened', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('propertyModalOpened', handleStorageChange);
      };
    }
  }, []);

  useEffect(() => {
    console.log('🏠 Property hint check:', { connected, hasProperties, hasOpenedModal });
    
    if (connected && !hasProperties && !hasOpenedModal) {
      console.log('🏠 Starting property hint timer (5 seconds)...');
      const timer = setTimeout(() => {
        console.log('🏠 Showing property hint arrows!');
        setShowPropertyHint(true);
      }, 5000); // Wait 5 seconds
      return () => clearTimeout(timer);
    } else {
      console.log('🏠 Property hint disabled:', { 
        reason: !connected ? 'not connected' : hasProperties ? 'has properties' : 'modal opened' 
      });
      setShowPropertyHint(false);
    }
  }, [connected, hasProperties, hasOpenedModal]);
  
  const tileY = boardThickness + tileThickness/2;
  const halfW = boardWidth / 2;
  const halfH = boardHeight / 2;
  
  const getBuildingLevel = useCallback((propertyId: number): number => {
    if (!spectatorMode && ownerships.length === 0) {
      return 0;
    }
    
    let ownership;
    
    if (spectatorMode && spectatorOwnerships) {
      ownership = spectatorOwnerships.find((o: any) => o.propertyId === propertyId);
    } else {
      ownership = ownerships.find(o => o.propertyId === propertyId);
    }
    
    if (!ownership || ownership.slotsOwned === 0) {
      return 0;
    }

    const property = PROPERTIES.find(p => p.id === propertyId);
    if (!property) {
      return 0;
    }

    const maxPerPlayer = property.maxPerPlayer || 10;
    const progressRatio = ownership.slotsOwned / maxPerPlayer;
    const level = Math.ceil(progressRatio * 5);
    
    return Math.min(level, 5);
  }, [ownerships, spectatorMode, spectatorOwnerships]);
  
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
      {/* Camera Controller */}
      <CameraController connected={connected} controlsRef={cameraControlsRef} />
      
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
        enableZoom={connected}
        enableRotate={connected}
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
            showPropertyHint={showPropertyHint}
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
            showPropertyHint={showPropertyHint}
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
            showPropertyHint={showPropertyHint}
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
            showPropertyHint={showPropertyHint}
          />
        );
      })}
      
      {/* ===== BANK (only when connected) ===== */}
      {connected && (
        <InteractiveBank3D 
          ref={bankRef}
          position={[0, 0.8, 0]} 
          scale={0.084}
          showClaimHint={showClaimHint}
          onClaimHintDismiss={handleClaimHintDismiss}
        />
      )}
      
      {/* ===== ONBOARDING OVERLAY ===== */}
      <BoardOnboarding3D 
        hasProperties={hasProperties} 
        showClaimHint={showClaimHint}
        onClaimHintDismiss={handleClaimHintDismiss}
      />
      
      {/* ===== 3D INCOME FLOW (only when connected and has properties) ===== */}
      {!spectatorMode && connected && hasProperties && (
        <IncomeFlow3D 
          enabled={true}
          particlesVisible={particlesVisible}
          onParticleArrive={(incomeValue) => {
            if (bankRef.current?.handleParticleArrive) {
              bankRef.current.handleParticleArrive(incomeValue);
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
  const { publicKey, connected } = useWallet();
  const gameState = useGameState();
  const hasTriggeredHintRef = useRef(false);
  const previousOwnershipsCountRef = useRef(0);

  // Calculate if user has properties
  const hasProperties = useMemo(() => {
    if (spectatorMode) {
      return spectatorOwnerships?.some(o => o.slotsOwned > 0) || false;
    }
    return gameState?.ownerships?.some(o => o.slotsOwned > 0) || false;
  }, [spectatorMode, spectatorOwnerships, gameState?.ownerships]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for first purchase and trigger hint
  useEffect(() => {
    if (!publicKey) return;
    
    const walletKey = publicKey.toBase58();
    const storageKey = `hasSeenClaimHint_${walletKey}`;
    
    console.log('🏦 Bank hint check:', {
      hasSeenHint: localStorage.getItem(storageKey) === 'true',
      storageKey,
      spectatorMode
    });
    
    if (localStorage.getItem(storageKey) === 'true') return;
    
    const currentCount = spectatorMode 
      ? (spectatorOwnerships?.filter(o => o.slotsOwned > 0).length || 0)
      : (gameState?.ownerships?.filter(o => o.slotsOwned > 0).length || 0);
    
    console.log('🏦 Ownership counts:', {
      previousCount: previousOwnershipsCountRef.current,
      currentCount,
      hasTriggered: hasTriggeredHintRef.current
    });
    
    if (previousOwnershipsCountRef.current === 0 && currentCount > 0 && !hasTriggeredHintRef.current) {
      console.log('🏦 First purchase detected! Starting 60s timer...');
      hasTriggeredHintRef.current = true;
      
      const timer = setTimeout(() => {
        console.log('🏦 Timer finished, checking if should show hint...');
        if (localStorage.getItem(storageKey) !== 'true') {
          console.log('🏦 Showing bank claim hint!');
          setShowClaimHint(true);
        } else {
          console.log('🏦 Hint already seen, not showing');
        }
      }, 30000); // 30 seconds after first purchase
      
      return () => clearTimeout(timer);
    }
    
    previousOwnershipsCountRef.current = currentCount;
  }, [publicKey, gameState?.ownerships, spectatorMode, spectatorOwnerships]);

  const handleClaimHintDismiss = useCallback(() => {
    if (!publicKey) return;
    
    setShowClaimHint(false);
    const storageKey = `hasSeenClaimHint_${publicKey.toBase58()}`;
    localStorage.setItem(storageKey, 'true');
  }, [publicKey]);


  const resetView = () => {
    if (cameraControlsRef.current) {
      // Reset to the appropriate view based on connection state
      const targetConfig = connected ? CAMERA_POSITIONS.ZOOMED_IN : CAMERA_POSITIONS.ZOOMED_OUT;
      
      // Set camera position and target
      cameraControlsRef.current.object.position.copy(targetConfig.position);
      cameraControlsRef.current.target.copy(targetConfig.lookAt);
      cameraControlsRef.current.update();
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
      {/* Camera Controls - only show when connected */}
      {connected && (
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10,
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
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = particlesVisible ? '#7c3aed' : '#4b5563'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = particlesVisible ? '#6d28d9' : '#374151'}
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
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#7c3aed'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = '#6d28d9'}
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
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#7c3aed'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = '#6d28d9'}
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
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#7c3aed'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = '#6d28d9'}
          >
            <ZoomOutIcon size={16} />
          </button>
        </div>
      )}

      <Canvas
        camera={{ 
          position: [0, 18, 25],  // Start at ZOOMED_OUT position
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
        onCreated={({ camera }) => {
          // Set initial lookAt to ZOOMED_OUT lookAt
          camera.lookAt(0, 5, 0);
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
          connected={connected}
          hasProperties={hasProperties}
        />
      </Canvas>
    </div>
  );
}