'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, PerspectiveCamera, Html, useTexture } from '@react-three/drei';
import { useGameState } from '@/contexts/GameStateContext';
import { useRewards } from '@/contexts/RewardsContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { PROPERTIES } from '@/utils/constants';
import { Logo3D_R3F } from './r3f/Logo3D_R3F';
import { House1_R3F } from './r3f/House1_R3F';
import { House2_R3F } from './r3f/House2_R3F';
import { House3_R3F } from './r3f/House3_R3F';
import { House4_R3F } from './r3f/House4_R3F';
import { House5_R3F } from './r3f/House5_R3F';
import { Pin3D_R3F } from './r3f/Pin3D_R3F';
import { CornerTile3D } from './CornerTile3D';
import { useMemo, useEffect, useRef, useState, Suspense, useCallback } from 'react';
import * as THREE from 'three';
import { ResetViewIcon, ZoomInIcon, ZoomOutIcon, HideIcon, PointerArrowIcon, ShieldIcon, ShieldCooldownIcon, HourglassIcon, TargetIcon } from '../icons/UIIcons';
import { InteractiveBank3D } from './InteractiveBank3D';
import { IncomeFlow3D } from './IncomeFlow3D';
import { FloatingCoins3D } from './FloatingCoins3D';
import { BoardOnboarding3D } from './BoardOnboarding3D';


interface Board3DSceneProps {
  onSelectProperty: (propertyId: number) => void;
  onCoinClick?: (() => void) | undefined;
  spectatorMode?: boolean;
  spectatorOwnerships?: any[];
  customBoardBackground?: string | null | undefined;
  custom3DPropertyTiles?: string | null | undefined;
  customSceneBackground?: string | null | undefined;
  profilePicture?: string | null | undefined;
  cornerSquareStyle?: 'property' | 'profile' | undefined;
}

interface SceneProps extends Board3DSceneProps {
  cameraControlsRef: React.RefObject<any>;
  particlesVisible: boolean;
  showClaimHint: boolean;
  handleClaimHintDismiss: () => void;
  connected: boolean;
  hasProperties: boolean;
  showcaseMode: boolean;
  customBoardBackground?: string | null;
  custom3DPropertyTiles?: string | null;
  profilePicture?: string | null;
  cornerSquareStyle?: 'property' | 'profile';
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

// Board surface with custom texture
function BoardSurfaceWithTexture({ customBackground }: { customBackground: string }) {
  const texture = useTexture(customBackground);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  
  // Create 80% scaled dimensions for the textured plane
  const texturedWidth = boardWidth * 0.72;
  const texturedHeight = boardHeight * 0.72;
  
  return (
    <>
      {/* Board base without texture */}
      <mesh position={[0, boardThickness/2, 0]} receiveShadow>
        <boxGeometry args={[boardWidth, boardThickness, boardHeight]} />
        <meshStandardMaterial color="#2a1a3a" roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Smaller textured plane on top, centered */}
      <mesh position={[0, boardThickness + 0.001, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[texturedWidth, texturedHeight]} />
        <meshStandardMaterial map={texture} roughness={0.8} metalness={0.1} />
      </mesh>
    </>
  );
}

// Default board surface without texture
function DefaultBoardSurface() {
  return (
    <>
      {/* Board base */}
      <mesh position={[0, boardThickness/2, 0]} receiveShadow>
        <boxGeometry args={[boardWidth, boardThickness, boardHeight]} />
        <meshStandardMaterial 
          color="#1A0A2E"
          roughness={0.8} 
          metalness={0.1} 
        />
      </mesh>
      
      {/* Board edge highlight */}
      <mesh position={[0, boardThickness + 0.01, 0]}>
        <boxGeometry args={[boardWidth + 0.05, 0.02, boardHeight + 0.05]} />
        <meshStandardMaterial color="#3D2850" roughness={0.5} metalness={0.2} />
      </mesh>
    </>
  );
}

// Board surface component with conditional texture loading
function BoardSurface({ customBackground }: { customBackground?: string | null }) {
  if (customBackground) {
    return (
      <Suspense fallback={<DefaultBoardSurface />}>
        <BoardSurfaceWithTexture customBackground={customBackground} />
      </Suspense>
    );
  }
  
  return <DefaultBoardSurface />;
}

function CooldownIndicators3D({ 
  propertyId, 
  side,
  ownership,
  isPropertyOnCooldown,
  isStealOnCooldown,
  spectatorMode,
  cameraDistance
}: { 
  propertyId: number;
  side: 'top' | 'bottom' | 'left' | 'right';
  ownership: any;
  isPropertyOnCooldown: (id: number) => boolean;
  isStealOnCooldown: (id: number) => boolean;
  spectatorMode: boolean;
  cameraDistance?: number | undefined;
}) {
  // Don't show in spectator mode
  if (spectatorMode) return null;

  // Get property color
  const property = PROPERTIES.find(p => p.id === propertyId);
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
  const colorHex = property ? getColorHex(property.color) : '#8b5cf6';

  const now = Math.floor(Date.now() / 1000);
  
  // Shield calculations (only for owned properties)
  const shieldExpiry = ownership?.shieldExpiry?.toNumber() || 0;
  const slotsShielded = ownership?.slotsShielded || 0;
  const shieldActive = ownership && ownership.slotsOwned > 0 && slotsShielded > 0 && shieldExpiry > now;
  
  const cooldownDuration = ownership?.shieldCooldownDuration?.toNumber() || (12 * 3600);
  const cooldownEndTime = shieldExpiry + cooldownDuration;
  const isShieldOnCooldown = ownership && ownership.slotsOwned > 0 && !shieldActive && shieldExpiry > 0 && now < cooldownEndTime;
  
  // Cooldown states from GameStateContext
  const isOnSetCooldown = isPropertyOnCooldown(propertyId);
  const isOnStealCD = isStealOnCooldown(propertyId);

  
  // Calculate icon size based on camera distance (smaller when zoomed out)
  const baseIconSize = 8; // Base size (was 14)
  const iconSize = cameraDistance ? Math.max(4, Math.min(10, baseIconSize * (15 / Math.max(cameraDistance, 8)))) : baseIconSize;
  
  // Build active cooldowns array (same order as PropertyCard)
  const activeCooldowns: { icon: React.ReactNode; key: string }[] = [];
  
  if (shieldActive) {
    activeCooldowns.push({ 
      icon: <ShieldIcon size={iconSize} className="text-cyan-400" />,
      key: 'shield-active'
    });
  } else if (isShieldOnCooldown) {
    activeCooldowns.push({ 
      icon: <ShieldCooldownIcon size={iconSize} className="text-red-400" />,
      key: 'shield-cooldown'
    });
  }
  
  if (isOnSetCooldown) {
    activeCooldowns.push({ 
      icon: <HourglassIcon size={iconSize} className="text-yellow-400" />,
      key: 'set-cooldown'
    });
  }
  
  if (isOnStealCD) {
    activeCooldowns.push({ 
      icon: <TargetIcon size={iconSize} className="text-orange-400" />,
      key: 'steal-cooldown'
    });
  }

  // No cooldowns active, don't render anything
  if (activeCooldowns.length === 0) return null;

  // Position the indicator based on tile side (offset toward center of board)
  let offsetX = 0, offsetZ = 0;
  if (side === 'top') offsetZ = 0.5;
  else if (side === 'bottom') offsetZ = -0.5;
  else if (side === 'left') offsetX = 0.5;
  else if (side === 'right') offsetX = -0.5;

  return (
    <Html
      position={[offsetX, 0.4, offsetZ]}
      center
      zIndexRange={[10, 0]}  // Forces low z-index to stay below modal
      style={{ 
        pointerEvents: 'none'
      }}
      distanceFactor={10}
    >
      <div 
        className="cooldown-indicators flex gap-0.5 rounded-full px-1.5 py-1 backdrop-blur-sm border shadow-lg"
        style={{ 
          backgroundColor: `rgba(0, 0, 0, 0.85)`, // Dark, almost opaque background
          borderColor: `${colorHex}`,
          boxShadow: `0 0 15px ${colorHex}80`,
          position: 'relative',
          zIndex: 1
        }}
      >
        {activeCooldowns.map((cd) => (
          <div key={cd.key} className="drop-shadow-[0_0_6px_currentColor]">
            {cd.icon}
          </div>
        ))}
      </div>
    </Html>
  );
}

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

/**
 * ShowcaseController - Rotates camera around the board for showcase/promotional purposes
 */
function ShowcaseController({ 
  enabled, 
  controlsRef 
}: { 
  enabled: boolean; 
  controlsRef: React.RefObject<any>;
}) {
  const angleRef = useRef(0);

  useFrame((state, delta) => {
    if (!enabled || !controlsRef.current) return;

    // Increment angle for smooth rotation
    angleRef.current += delta * 0.15;

    // Calculate camera position on a circle
    const radius = 10;
    const x = Math.sin(angleRef.current) * radius;
    const z = Math.cos(angleRef.current) * radius;
    const y = 7;

    // Update camera position
    const camera = controlsRef.current.object;
    camera.position.set(x, y, z);

    // Update controls target to look at center of board
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
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
      if (!data) return; // Skip if no particle data exists for this index
      
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
  ownership?: any;
  isPropertyOnCooldown: (id: number) => boolean;
  isStealOnCooldown: (id: number) => boolean;
  spectatorMode: boolean;
  cameraDistance?: number;
  customTexture?: string | null;
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
  interactive = true, 
  showPropertyHint = false,
  ownership,
  isPropertyOnCooldown,
  isStealOnCooldown,
  spectatorMode,
  cameraDistance,
  customTexture
}: PropertyTileProps) {
  const [hovered, setHovered] = useState(false);
  
  
  // Load custom texture - always call hook to maintain hook order
  // Use a data URL for transparent 1x1 pixel as fallback when no custom texture
  const fallbackTexture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9g4ndUwAAAABJRU5ErkJggg==';
  const loadedTexture = useTexture(customTexture || fallbackTexture);
  
  let texture = null;
  if (customTexture && loadedTexture) {
    texture = loadedTexture;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
  }
  
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
    top: [-Math.PI/2, 0, Math.PI] as const,
    bottom: [-Math.PI/2, 0, 0] as const,
    left: [-Math.PI/2, 0, -Math.PI/2] as const,
    right: [-Math.PI/2, 0, Math.PI/2] as const,
  }[side] as [number, number, number];

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
          color={interactive ? "#4A2C5A" : "#2E1A3A"}
          roughness={0.7}
          emissive={hovered && interactive ? colorHex : '#000000'}
          emissiveIntensity={hovered && interactive ? 0.15 : 0}
        />
      </mesh>
      
      {/* Texture overlay on top of tile (only if texture exists) */}
      {texture && (() => {
        // Calculate texture rotation based on tile side
        let textureRotation: [number, number, number] = [-Math.PI/2, 0, 0]; // default (bottom row)
        
        switch (side) {
          case 'top':
            // Top row: rotate 180° so text is readable from bottom of board
            textureRotation = [-Math.PI/2, 0, Math.PI];
            break;
          case 'left':
            // Left side: rotate 90° more (was 90° clockwise, now 180°)
            textureRotation = [-Math.PI/2, 0, -Math.PI/2];
            break;
          case 'right':
            // Right side: rotate 90° more (was -90°, now 0°)
            textureRotation = [-Math.PI/2, 0, Math.PI/2];
            break;
          case 'bottom':
          default:
            // Bottom row: no additional rotation (default orientation)
            textureRotation = [-Math.PI/2, 0, 0];
            break;
        }
        
        // Adjust plane dimensions and position to add more padding toward center
        let planeWidth = width * 0.9;
        let planeHeight = depth * 0.9;
        let offsetX = 0;
        let offsetZ = 0;
        
        // For 90° rotations, swap dimensions to maintain visual consistency
        if (side === 'left' || side === 'right') {
          // Swap width and height for rotated tiles to maintain same visual footprint
          planeWidth = depth * 0.9;
          planeHeight = width * 0.9;
        }
        
        // Add offset to move texture away from board center (more inner padding)
        const paddingOffset = 0.05; // Adjust this value to control how much offset
        
        switch (side) {
          case 'top':
            // Move texture toward the top edge (away from center)
            offsetZ = -paddingOffset;
            break;
          case 'bottom':
            // Move texture toward the bottom edge (away from center)
            offsetZ = paddingOffset;
            break;
          case 'left':
            // Move texture toward the left edge (away from center)
            offsetX = -paddingOffset;
            break;
          case 'right':
            // Move texture toward the right edge (away from center)
            offsetX = paddingOffset;
            break;
        }
        
        return (
          <mesh position={[offsetX, tileThickness/2 + 0.001, offsetZ]} rotation={textureRotation} receiveShadow>
            <planeGeometry args={[planeWidth, planeHeight]} />
            <meshStandardMaterial 
              map={texture}
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>
        );
      })()}
      
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

      {/* Cooldown indicators floating above tile */}
      <CooldownIndicators3D
        propertyId={property.id}
        side={side}
        ownership={ownership}
        isPropertyOnCooldown={isPropertyOnCooldown}
        isStealOnCooldown={isStealOnCooldown}
        spectatorMode={spectatorMode}
        cameraDistance={cameraDistance}
      />
      
      {/* Rising income particles for complete sets */}
      {hasCompleteSet && buildingLevel > 0 && <RisingIncomeParticles side={side} visible={particlesVisible} />}
    </group>
  );
}


function PinOnTile({ propertyId, side, showHint = false }: { propertyId: number; side: 'top' | 'bottom' | 'left' | 'right'; showHint?: boolean }) {
  const property = PROPERTIES.find(p => p.id === propertyId);
  if (!property) return null;
  
  const arrowRef = useRef<any>(null);
  

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
  
  const pinRotation = {
    top: [0, Math.PI, 0] as [number, number, number],
    bottom: [0, 0, 0] as [number, number, number],
    left: [0, -Math.PI/2, 0] as [number, number, number],
    right: [0, Math.PI/2, 0] as [number, number, number],
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
          zIndexRange={[10, 0]}  // Consistent with cooldown indicators
          style={{
            pointerEvents: 'none',
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
    return null;
  }
  
  
  const houseRotation = {
    top: [0, Math.PI, 0] as [number, number, number],
    bottom: [0, 0, 0] as [number, number, number],
    left: [0, -Math.PI/2, 0] as [number, number, number],
    right: [0, Math.PI/2, 0] as [number, number, number],
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
  onCoinClick,
  spectatorMode, 
  spectatorOwnerships, 
  cameraControlsRef, 
  particlesVisible, 
  showClaimHint, 
  handleClaimHintDismiss,
  connected,
  hasProperties,
  showcaseMode,
  customBoardBackground,
  custom3DPropertyTiles,
  profilePicture,
  cornerSquareStyle
}: SceneProps) {
  
  const gameState = useGameState();
  const { unclaimedRewards } = useRewards();
  const ownerships = gameState?.ownerships || [];
  const bankRef = useRef<any>(null);
  const [cameraDistance, setCameraDistance] = useState(25);

  // Get cooldown functions from useGameState
  const { 
    isPropertyOnCooldown, 
    isStealOnCooldown, 
    getOwnership 
  } = gameState;

  // Create helper to get ownership for a property
  const getPropertyOwnership = useCallback((propertyId: number) => {
    if (spectatorMode && spectatorOwnerships) {
      return spectatorOwnerships.find((o: any) => o.propertyId === propertyId);
    }
    return getOwnership ? getOwnership(propertyId) : ownerships.find(o => o.propertyId === propertyId);
  }, [spectatorMode, spectatorOwnerships, getOwnership, ownerships]);
  
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
    return undefined;
  }, []);

  useEffect(() => {
    if (connected && !hasProperties && !hasOpenedModal) {
      const timer = setTimeout(() => {
        setShowPropertyHint(true);
      }, 5000); // Wait 5 seconds
      return () => clearTimeout(timer);
    } else {
      setShowPropertyHint(false);
      return undefined;
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
    
    const ownerships = spectatorMode ? (spectatorOwnerships || []) : (gameState?.ownerships || []);
    
    const ownedInSet = ownerships.filter(o => 
      propertiesInSet.some(p => p.id === o.propertyId) && o.slotsOwned > 0
    ).length;
    
    return ownedInSet >= requiredProps;
  }, [gameState?.ownerships, spectatorMode, spectatorOwnerships]);
  
  // Track camera distance for icon scaling
  useFrame(({ camera }) => {
    const distance = camera.position.length();
    setCameraDistance(distance);
  });
  
  return (
    <>
      {/* Camera Controller */}
      <CameraController connected={connected} controlsRef={cameraControlsRef} />
      <ShowcaseController enabled={showcaseMode} controlsRef={cameraControlsRef} />
      
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
        enableZoom={connected && !showcaseMode}
        enableRotate={connected && !showcaseMode}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={25}
      />
      
      {/* Board surface with custom background support */}
      <BoardSurface customBackground={customBoardBackground || null} />
      
      
      {/* ===== CORNERS ===== */}
      <CornerTile3D 
        position={[-halfW + cornerSize/2, tileY, -halfH + cornerSize/2]} 
        cornerType="go" 
        size={cornerSize}
        cornerSquareStyle={cornerSquareStyle || 'property'}
        customPropertyCardBackground={custom3DPropertyTiles || null}
        profilePicture={profilePicture || null}
      />
      <CornerTile3D 
        position={[halfW - cornerSize/2, tileY, -halfH + cornerSize/2]} 
        cornerType="jail" 
        size={cornerSize}
        cornerSquareStyle={cornerSquareStyle || 'property'}
        customPropertyCardBackground={custom3DPropertyTiles || null}
        profilePicture={profilePicture || null}
      />
      <CornerTile3D 
        position={[-halfW + cornerSize/2, tileY, halfH - cornerSize/2]} 
        cornerType="parking" 
        size={cornerSize}
        cornerSquareStyle={cornerSquareStyle || 'property'}
        customPropertyCardBackground={custom3DPropertyTiles || null}
        profilePicture={profilePicture || null}
      />
      <CornerTile3D 
        position={[halfW - cornerSize/2, tileY, halfH - cornerSize/2]} 
        cornerType="gotojail" 
        size={cornerSize}
        cornerSquareStyle={cornerSquareStyle || 'property'}
        customPropertyCardBackground={custom3DPropertyTiles || null}
        profilePicture={profilePicture || null}
      />
      
      {/* ===== PROPERTY TILES WITH SUSPENSE FOR TEXTURE LOADING ===== */}
      <Suspense fallback={null}>
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
            ownership={getPropertyOwnership(id)}
            isPropertyOnCooldown={spectatorMode ? () => false : isPropertyOnCooldown || (() => false)}
            isStealOnCooldown={spectatorMode ? () => false : isStealOnCooldown || (() => false)}
            spectatorMode={spectatorMode || false}
            cameraDistance={cameraDistance}
            customTexture={custom3DPropertyTiles || null}
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
            ownership={getPropertyOwnership(id)}
            isPropertyOnCooldown={spectatorMode ? () => false : isPropertyOnCooldown || (() => false)}
            isStealOnCooldown={spectatorMode ? () => false : isStealOnCooldown || (() => false)}
            spectatorMode={spectatorMode || false}
            cameraDistance={cameraDistance}
            customTexture={custom3DPropertyTiles || null}
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
            ownership={getPropertyOwnership(id)}
            isPropertyOnCooldown={spectatorMode ? () => false : isPropertyOnCooldown || (() => false)}
            isStealOnCooldown={spectatorMode ? () => false : isStealOnCooldown || (() => false)}
            spectatorMode={spectatorMode || false}
            cameraDistance={cameraDistance}
            customTexture={custom3DPropertyTiles || null}
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
            ownership={getPropertyOwnership(id)}
            isPropertyOnCooldown={spectatorMode ? () => false : isPropertyOnCooldown || (() => false)}
            isStealOnCooldown={spectatorMode ? () => false : isStealOnCooldown || (() => false)}
            spectatorMode={spectatorMode || false}
            cameraDistance={cameraDistance}
            customTexture={custom3DPropertyTiles || null}
          />
        );
      })}
      </Suspense>
      
      {/* ===== BANK (only when connected and not in spectator mode) ===== */}
      {connected && !spectatorMode && (
        <InteractiveBank3D 
          ref={bankRef}
          position={[0, 0.8, 0]} 
          scale={0.074}
          showClaimHint={showClaimHint}
          onClaimHintDismiss={handleClaimHintDismiss}
        />
      )}
      
      {/* ===== FLOATING COINS (separate from bank to avoid hover interference) ===== */}
      {connected && !spectatorMode && (
        <FloatingCoins3D 
          rewardsAmount={unclaimedRewards || 0}
          position={[0, 1.95, 0]}
          {...(onCoinClick && { onCoinClick })}
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

export function Board3DScene({ onSelectProperty, onCoinClick, spectatorMode, spectatorOwnerships, customBoardBackground, custom3DPropertyTiles, customSceneBackground, profilePicture, cornerSquareStyle }: Board3DSceneProps) {
  
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [particlesVisible, setParticlesVisible] = useState(true);
  const [showClaimHint, setShowClaimHint] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [showcaseMode, setShowcaseMode] = useState(false);
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
    const firstPurchaseKey = `firstPurchaseTime_${walletKey}`;
    
    console.log('🏦 Claim hint check:', {
      walletKey,
      storageValue: localStorage.getItem(storageKey),
      firstPurchaseTime: localStorage.getItem(firstPurchaseKey),
      currentOwnerships: gameState?.ownerships,
    });
    
    if (localStorage.getItem(storageKey) === 'true') return;
    
    const currentCount = spectatorMode 
      ? (spectatorOwnerships?.filter(o => o.slotsOwned > 0).length || 0)
      : (gameState?.ownerships?.filter(o => o.slotsOwned > 0).length || 0);
    
    // If user has properties
    if (currentCount > 0) {
      // Check if we've recorded the first purchase time
      let firstPurchaseTime = localStorage.getItem(firstPurchaseKey);
      
      if (!firstPurchaseTime) {
        // This is their first property - record the time
        firstPurchaseTime = Date.now().toString();
        localStorage.setItem(firstPurchaseKey, firstPurchaseTime);
        console.log('🏦 Recording first purchase time:', new Date(parseInt(firstPurchaseTime)));
      }
      
      // Calculate time since first purchase
      const timeSincePurchase = Date.now() - parseInt(firstPurchaseTime);
      const shouldShowHint = timeSincePurchase >= 30000; // 30 seconds
      
      console.log('🏦 Time since first purchase:', {
        timeSincePurchase: Math.floor(timeSincePurchase / 1000) + 's',
        shouldShowHint,
        showClaimHint
      });
      
      if (shouldShowHint && !showClaimHint) {
        console.log('🏦 Showing claim hint arrow!');
        setShowClaimHint(true);
      } else if (!shouldShowHint && !showClaimHint) {
        // Set up timer for remaining time
        const remainingTime = 30000 - timeSincePurchase;
        console.log('🏦 Setting timer for remaining time:', Math.floor(remainingTime / 1000) + 's');
        
        const timer = setTimeout(() => {
          console.log('🏦 Timer fired! Showing claim hint arrow!');
          if (localStorage.getItem(storageKey) !== 'true') {
            setShowClaimHint(true);
          }
        }, remainingTime);
        
        return () => clearTimeout(timer);
      }
    }
    
    return undefined;
  }, [publicKey, gameState?.ownerships, spectatorMode, spectatorOwnerships, showClaimHint]);

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

  if (webglError) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0a0015 0%, #1a0a2e 50%, #0a0015 100%)',
        color: '#ffffff',
        fontSize: '16px',
        fontFamily: 'system-ui, sans-serif',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#ff6b6b', marginBottom: '10px' }}>3D Scene Error</h3>
        <p style={{ marginBottom: '20px' }}>{webglError}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Refresh Page
        </button>
        <p style={{ marginTop: '15px', fontSize: '12px', opacity: 0.7 }}>
          Your browser may not support WebGL or the graphics driver needs updating.
        </p>
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
          <button
            onClick={() => setShowcaseMode(!showcaseMode)}
            title={showcaseMode ? "Exit Showcase" : "Showcase Mode"}
            style={{
              background: showcaseMode ? '#eab308' : '#6d28d9',
              color: 'white',
              border: 'none',
              padding: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = showcaseMode ? '#f59e0b' : '#7c3aed'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = showcaseMode ? '#eab308' : '#6d28d9'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" fill="currentColor"/>
              <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z" fill="currentColor"/>
              <path d="M17 2h4c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1s-1-.45-1-1V4h-3c-.55 0-1-.45-1-1s.45-1 1-1z" fill="currentColor"/>
              <path d="M3 2h4c.55 0 1 .45 1 1s-.45 1-1 1H4v3c0 .55-.45 1-1 1s-1-.45-1-1V3c0-.55.45-1 1-1z" fill="currentColor"/>
            </svg>
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
          background: customSceneBackground || 'linear-gradient(180deg, #0a0015 0%, #1a0a2e 50%, #0a0015 100%)',
          width: '100%',
          height: '100%'
        }}
        onCreated={(state) => {
          try {
            // Set initial lookAt to ZOOMED_OUT lookAt
            state.camera.lookAt(0, 5, 0);
            
            // Add WebGL context loss handling
            const canvas = state.gl.domElement;
            
            canvas.addEventListener('webglcontextlost', (event) => {
              console.warn('WebGL context lost, preventing default behavior');
              event.preventDefault();
              setWebglError('WebGL context lost. Please refresh the page.');
            });
            
            canvas.addEventListener('webglcontextrestored', () => {
              console.log('WebGL context restored');
              setWebglError(null);
            });
            
            // Test WebGL context
            const gl = state.gl.getContext();
            if (!gl || gl.isContextLost()) {
              throw new Error('WebGL context is not available or lost');
            }
            
          } catch (error) {
            console.error('Failed to setup WebGL context:', error);
            setWebglError(error instanceof Error ? error.message : 'Unknown WebGL error');
          }
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false,
          stencil: false
        }}
      >
        <Suspense fallback={null}>
          <Scene 
            onSelectProperty={onSelectProperty}
            {...(onCoinClick && { onCoinClick })}
            spectatorMode={spectatorMode || false}
            spectatorOwnerships={spectatorOwnerships || []}
            cameraControlsRef={cameraControlsRef}
            particlesVisible={particlesVisible}
            showClaimHint={showClaimHint}
            handleClaimHintDismiss={handleClaimHintDismiss}
            connected={connected}
            hasProperties={hasProperties}
            showcaseMode={showcaseMode}
            customBoardBackground={customBoardBackground || null}
            custom3DPropertyTiles={custom3DPropertyTiles || null}
            profilePicture={profilePicture || gameState?.profile?.profilePicture}
            cornerSquareStyle={cornerSquareStyle || gameState?.profile?.cornerSquareStyle || 'property'}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}