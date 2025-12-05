'use client';

import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { PointerArrowIcon } from '@/components/icons/UIIcons';

// Reward tiers for accumulation bonuses
const ACCUMULATION_TIERS = [10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000];


// Texture loading components (separate like in Bank3D)
function CoinLogoFace() {
  const texture = useTexture('/logo.png');
  texture.colorSpace = THREE.SRGBColorSpace;
  
  const s = 0.134;
  return (
    <mesh position={[0, 0.09 * s, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.5 * s, 32]} />
      <meshStandardMaterial 
        map={texture} 
        transparent 
        metalness={0.3} 
        roughness={0.4}
      />
    </mesh>
  );
}

function CoinDFace() {
  const texture = useTexture('/coin-d-elegant-3d.png');
  texture.colorSpace = THREE.SRGBColorSpace;
  
  const s = 0.134;
  return (
    <mesh position={[0, -0.09 * s, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.5 * s, 32]} />
      <meshStandardMaterial 
        map={texture} 
        transparent 
        metalness={0.3} 
        roughness={0.4}
      />
    </mesh>
  );
}

// Elegant Coin Component with relief edges
function ElegantCoin({ 
  coinRef, 
  position, 
  onPointerOver, 
  onPointerOut, 
  onClick,
  isHovered
}: {
  coinRef: (ref: THREE.Group | null) => void;
  position: [number, number, number];
  onPointerOver: (e: any) => void;
  onPointerOut: (e: any) => void;
  onClick: (e: any) => void;
  isHovered: boolean;
}) {
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: isHovered ? 0xFFEF94 : 0xFFD700, 
    metalness: 0.9, 
    roughness: isHovered ? 0.05 : 0.1,
    emissive: isHovered ? 0xFFB84D : 0xFFA500,
    emissiveIntensity: isHovered ? 0.6 : 0.3
  }), [isHovered]);
  
  const darkGoldMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: isHovered ? 0xFFB84D : 0xFFA500, 
    metalness: 0.85, 
    roughness: 0.15 
  }), [isHovered]);

  // Scale: original elegant was radius 0.9, we want 0.08, now 50% bigger
  // Scale factor ~0.089 * 1.5 = 0.134
  const s = 0.134;

  return (
    <group
      ref={coinRef}
      position={position}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {/* Main solid disc */}
      <mesh>
        <cylinderGeometry args={[0.9 * s, 0.9 * s, 0.16 * s, 64]} />
        <primitive object={goldMat} attach="material" />
      </mesh>
      
      {/* Outer raised rim - top */}
      <mesh position={[0, 0.08 * s, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85 * s, 0.06 * s, 16, 64]} />
        <primitive object={goldMat} attach="material" />
      </mesh>
      
      {/* Outer raised rim - bottom */}
      <mesh position={[0, -0.08 * s, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85 * s, 0.06 * s, 16, 64]} />
        <primitive object={goldMat} attach="material" />
      </mesh>
      
      {/* Inner decorative ring - top */}
      <mesh position={[0, 0.085 * s, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55 * s, 0.03 * s, 16, 64]} />
        <primitive object={darkGoldMat} attach="material" />
      </mesh>
      
      {/* Inner decorative ring - bottom */}
      <mesh position={[0, -0.085 * s, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55 * s, 0.03 * s, 16, 64]} />
        <primitive object={darkGoldMat} attach="material" />
      </mesh>
      
      {/* Textured faces with separate Suspense */}
      <Suspense fallback={null}>
        <CoinLogoFace />
      </Suspense>
      <Suspense fallback={null}>
        <CoinDFace />
      </Suspense>
    </group>
  );
}

// Fallback coin component
function CoinFallback({ isHovered }: { isHovered: boolean }) {
  const s = 0.134;
  return (
    <mesh>
      <cylinderGeometry args={[0.9 * s, 0.9 * s, 0.16 * s, 32]} />
      <meshStandardMaterial 
        color={isHovered ? "#FFEF94" : "#FFD700"}
        metalness={0.9} 
        roughness={isHovered ? 0.05 : 0.1}
        emissive={isHovered ? "#FFB84D" : "#FFA500"}
        emissiveIntensity={isHovered ? 0.6 : 0.3}
      />
    </mesh>
  );
}

interface FloatingCoins3DProps {
  rewardsAmount: number;
  position?: [number, number, number];
  onCoinClick?: () => void;
}

export function FloatingCoins3D({ rewardsAmount, position = [0, 1.95, 0], onCoinClick }: FloatingCoins3DProps) {
  const coinsGroupRef = useRef<THREE.Group>(null);
  const coinRefs = useRef<(THREE.Group | null)[]>([]);
  const [hoveredCoin, setHoveredCoin] = useState<number | null>(null);
  const [showFirstCoinHint, setShowFirstCoinHint] = useState(false);
  const [hasClickedFirstCoin, setHasClickedFirstCoin] = useState(false);

  // Calculate how many tiers the user has reached
  const tierCount = useMemo(() => {
    const count = ACCUMULATION_TIERS.filter(threshold => rewardsAmount >= threshold).length;
    return count;
  }, [rewardsAmount]);

  // Check if user reached first threshold for the first time
  const hasReachedFirstThreshold = rewardsAmount >= (ACCUMULATION_TIERS[0] || 0); // 1000

  // Hint logic - show arrow when first threshold is reached but user hasn't clicked yet
  useEffect(() => {
    const storageKey = 'hasClickedFirstCoin';
    const hasClicked = localStorage.getItem(storageKey) === 'true';
    setHasClickedFirstCoin(hasClicked);

    if (hasReachedFirstThreshold && !hasClicked) {
      setShowFirstCoinHint(true);
    } else {
      setShowFirstCoinHint(false);
    }
  }, [hasReachedFirstThreshold]);

  // Create coin data for animation
  const coinData = useMemo(() => {
    if (tierCount === 0) {
      return [];
    }
    
    const data = Array.from({ length: tierCount }, (_, i) => {
      let angle;
      
      // Normal distribution for all coins - let them move naturally
      angle = (i / tierCount) * Math.PI * 2;
      
      return {
        angle: angle,
        radius: 1.5, // Same radius for all coins (stay on circular path)
        yOffset: Math.sin(i * 0.3) * 0.1, // Normal Y variation
        phase: i * 0.5, // Normal phase
        floatSpeed: showFirstCoinHint && i === 0 ? 0 : 1.5 + Math.random() * 0.5, // Stop first coin when hint
        isHintCoin: showFirstCoinHint && i === 0
      };
    });
    
    return data;
  }, [tierCount, showFirstCoinHint]);

  // Animation loop
  useFrame((state) => {
    if (!coinsGroupRef.current || coinData.length === 0) return;

    const time = state.clock.elapsedTime;
    
    // Rotate the entire group slowly (stop when any coin is hovered)
    if (hoveredCoin === null) {
      coinsGroupRef.current.rotation.y = time * 0.2;
    }

    // Animate individual coins
    coinRefs.current.forEach((coinRef, i) => {
      if (!coinRef || !coinData[i]) return;
      
      const data = coinData[i];
      const isHovered = hoveredCoin === i;
      const isHintCoin = data.isHintCoin;

      // Individual coin rotation and movement 
      // Stop ALL animations when: any coin hovered
      if (hoveredCoin === null && !isHovered) {
        coinRef.rotation.y = time * 2 + data.phase; // Orbit rotation
        coinRef.rotation.x = Math.sin(time + data.phase) * 0.2; // Slight wobble
        coinRef.rotation.z = time * 3 + data.phase * 2; // Self-rotation (coin spinning)

        // Floating motion
        const baseY = -1.4; // Height around the bank (even lower)
        coinRef.position.y = baseY + data.yOffset + Math.sin(time * data.floatSpeed + data.phase) * 0.05;
      }

      // Let hint coin move naturally with others
      
      // Hover scaling animation - more dramatic and responsive
      const targetScale = isHovered ? 1.8 : 1.0;
      const currentScale = coinRef.scale.x;
      const lerpSpeed = 12; // Faster scaling response
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, lerpSpeed * 0.016);
      coinRef.scale.setScalar(newScale);
    });
  });

  if (tierCount === 0) {
    return null;
  }

  return (
    <>
      <group ref={coinsGroupRef} position={position}>
        {coinData.map((data, i) => {
          const isHovered = hoveredCoin === i;
          const isHintCoin = data.isHintCoin;
          
          return (
            <group key={i}>
              <ElegantCoin
                coinRef={(ref) => (coinRefs.current[i] = ref)}
                position={[
                  Math.cos(data.angle) * data.radius,
                  -1.5 + data.yOffset, // Even lower height
                  Math.sin(data.angle) * data.radius
                ]}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredCoin(i);
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  setHoveredCoin(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  
                  // Handle hint dismissal for first coin
                  if (isHintCoin && showFirstCoinHint) {
                    localStorage.setItem('hasClickedFirstCoin', 'true');
                    setHasClickedFirstCoin(true);
                    setShowFirstCoinHint(false);
                  }
                  
                  onCoinClick?.();
                }}
                isHovered={isHovered}
              />
              
              {/* Arrow hint for first coin */}
              {isHintCoin && showFirstCoinHint && coinRefs.current[i] && (
                <Html
                  position={[
                    coinRefs.current[i]!.position.x - 0, // Follow coin X position, shifted left
                    coinRefs.current[i]!.position.y + 0.5, // Follow coin Y position, shifted up
                    coinRefs.current[i]!.position.z
                  ]}
                  center
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div className="animate-bounce">
                    <div style={{ transform: 'rotate(90deg)' }}>
                      <PointerArrowIcon className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
                    </div>
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>
    </>
  );
}

