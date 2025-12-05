'use client';

import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { X, TrendingUp, Star, Target, Coins } from 'lucide-react';
import { PointerArrowIcon } from '@/components/icons/UIIcons';

// Reward tiers for accumulation bonuses
const ACCUMULATION_TIERS = [10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000];

interface FloatingCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardsAmount: number;
  tierCount: number;
}

function FloatingCoinsModal({ isOpen, onClose, rewardsAmount, tierCount }: FloatingCoinsModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-md w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-900/50 to-amber-700/50 border-b border-yellow-500/30 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-yellow-300" />
              <h2 className="text-2xl font-black text-yellow-100">Reward Coins</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-yellow-300 hover:text-white transition-colors hover:bg-yellow-800/50 rounded-lg p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-100 mb-2">Current Status</h3>
                <p className="text-yellow-200 text-sm leading-relaxed">
                  You have accumulated <span className="font-bold text-yellow-300">${rewardsAmount.toLocaleString()}</span> in total rewards, unlocking <span className="font-bold text-yellow-300">{tierCount} coin{tierCount !== 1 ? 's' : ''}</span> around the bank.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-100 mb-2">Reward Tiers</h3>
                <div className="space-y-2">
                  {ACCUMULATION_TIERS.map((threshold, index) => {
                    const unlocked = rewardsAmount >= threshold;
                    return (
                      <div key={threshold} className={`flex items-center gap-2 text-xs ${
                        unlocked ? 'text-yellow-300' : 'text-yellow-600'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          unlocked ? 'bg-yellow-400' : 'bg-yellow-800'
                        }`} />
                        <span>Tier {index + 1}: ${threshold.toLocaleString()}</span>
                        {unlocked && <span className="text-yellow-400">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-200 mb-2">Next Milestone</h3>
                <p className="text-amber-200 text-sm leading-relaxed">
                  {tierCount < ACCUMULATION_TIERS.length 
                    ? `Reach $${ACCUMULATION_TIERS[tierCount]?.toLocaleString()} to unlock the next coin!`
                    : 'You have unlocked all reward tiers! Congratulations!'
                  }
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg font-semibold text-sm transition-all bg-yellow-600/40 hover:bg-yellow-600/60 border border-yellow-500/50 text-yellow-100 hover:border-yellow-400/70"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}

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
  
  console.log('🪙 FloatingCoins3D render - rewardsAmount:', rewardsAmount);
  
  // Calculate how many tiers the user has reached
  const tierCount = useMemo(() => {
    const count = ACCUMULATION_TIERS.filter(threshold => rewardsAmount >= threshold).length;
    console.log('🎯 Tier calculation - rewardsAmount:', rewardsAmount, 'tierCount:', count, 'thresholds:', ACCUMULATION_TIERS);
    return count;
  }, [rewardsAmount]);

  // Check if user reached first threshold for the first time
  const hasReachedFirstThreshold = rewardsAmount >= ACCUMULATION_TIERS[0]; // 1000

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
      console.log('⚠️ No coins to render - tierCount is 0');
      return [];
    }
    
    const data = Array.from({ length: tierCount }, (_, i) => {
      let angle;
      
      // When hint is showing, first coin starts at bottom position
      if (showFirstCoinHint && i === 0) {
        angle = 3 * Math.PI / 2; // Bottom position (270°)
      } 
      // For normal distribution or when hint is not showing
      else {
        angle = (i / tierCount) * Math.PI * 2;
      }
      
      return {
        angle: angle,
        radius: 1.5, // Same radius for all coins (stay on circular path)
        yOffset: Math.sin(i * 0.3) * 0.1, // Normal Y variation
        phase: i * 0.5, // Normal phase
        floatSpeed: showFirstCoinHint && i === 0 ? 0 : 1.5 + Math.random() * 0.5, // Stop first coin when hint
        isHintCoin: showFirstCoinHint && i === 0
      };
    });
    
    console.log('💰 Created coin data:', data);
    return data;
  }, [tierCount, showFirstCoinHint]);

  // Animation loop
  useFrame((state) => {
    if (!coinsGroupRef.current || coinData.length === 0) return;

    const time = state.clock.elapsedTime;
    
    // Rotate the entire group slowly (stop when any coin is hovered OR when showing hint)
    if (hoveredCoin === null && !showFirstCoinHint) {
      coinsGroupRef.current.rotation.y = time * 0.2;
    }

    // Animate individual coins
    coinRefs.current.forEach((coinRef, i) => {
      if (!coinRef || !coinData[i]) return;
      
      const data = coinData[i];
      const isHovered = hoveredCoin === i;
      const isHintCoin = data.isHintCoin;

      // Individual coin rotation and movement 
      // Stop ALL animations when: any coin hovered OR hint is showing
      if (hoveredCoin === null && !showFirstCoinHint && !isHintCoin) {
        coinRef.rotation.y = time * 2 + data.phase; // Orbit rotation
        coinRef.rotation.x = Math.sin(time + data.phase) * 0.2; // Slight wobble
        coinRef.rotation.z = time * 3 + data.phase * 2; // Self-rotation (coin spinning)

        // Floating motion
        const baseY = -1.4; // Height around the bank (even lower)
        coinRef.position.y = baseY + data.yOffset + Math.sin(time * data.floatSpeed + data.phase) * 0.05;
      }

      // Hint coin stays completely still (no animations)
      if (isHintCoin) {
        // Fixed position in front of bank
        const baseY = -1.4;
        coinRef.position.y = baseY + data.yOffset;
        // No rotations for hint coin
      }
      
      // Hover scaling animation - more dramatic and responsive
      const targetScale = isHovered ? 1.8 : 1.0;
      const currentScale = coinRef.scale.x;
      const lerpSpeed = 12; // Faster scaling response
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, lerpSpeed * 0.016);
      coinRef.scale.setScalar(newScale);
    });
  });

  console.log('🔍 Render decision - tierCount:', tierCount, 'coinData.length:', coinData.length);

  if (tierCount === 0) {
    console.log('🚫 Returning null - no tiers reached');
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
              {isHintCoin && showFirstCoinHint && (
                <Html
                  position={[
                    Math.cos(data.angle) * data.radius - 0.3, // Shifted left
                    -1.0 + data.yOffset, // Above the coin
                    Math.sin(data.angle) * data.radius
                  ]}
                  center
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ transform: 'rotate(90deg)' }}>
                    <PointerArrowIcon className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]" 
                      style={{
                        animation: 'bounce-vertical 1s infinite'
                      }}
                    />
                  </div>
                  <style jsx>{`
                    @keyframes bounce-vertical {
                      0%, 20%, 53%, 80%, 100% {
                        transform: translateY(0);
                      }
                      40%, 43% {
                        transform: translateY(-10px);
                      }
                      70% {
                        transform: translateY(-5px);
                      }
                    }
                  `}</style>
                </Html>
              )}
            </group>
          );
        })}
      </group>
    </>
  );
}

// Export the modal separately for use outside the 3D scene
export { FloatingCoinsModal };