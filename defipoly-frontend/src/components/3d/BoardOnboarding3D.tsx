'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import * as THREE from 'three';

interface BoardOnboarding3DProps {
  hasProperties: boolean;
}

/**
 * BoardOnboarding3D - Floating overlays for onboarding
 * 
 * States:
 * - Not connected: "Connect Wallet" button floating above center
 * - Connected, no properties: Arrow pointing to a property + hint text
 * - Has properties: Nothing rendered
 */
export function BoardOnboarding3D({ hasProperties }: BoardOnboarding3DProps) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [showPropertyHint, setShowPropertyHint] = useState(false);

  // Show property hint after a short delay when connected but no properties
  useEffect(() => {
    if (connected && !hasProperties) {
      const timer = setTimeout(() => {
        setShowPropertyHint(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowPropertyHint(false);
    }
  }, [connected, hasProperties]);

  // Not connected - show wallet button
  if (!connected) {
    return (
      <Html
        center
        position={[0, 2.2, 0.5]}
        style={{
          width: '300px',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            animation: 'fadeIn 0.5s ease-out',
          }}
        >
          {/* Title */}
          <div
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '32px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #a855f7, #06b6d4, #a855f7)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmer 3s linear infinite',
              textAlign: 'center',
              textShadow: '0 0 30px rgba(168, 85, 247, 0.5)',
            }}
          >
            DEFIPOLY
          </div>

          {/* Subtitle */}
          <div
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '15px',
              textAlign: 'center',
            }}
          >
            Connect your wallet to start playing
          </div>

          {/* Connect button */}
          <button
            onClick={() => setVisible(true)}
            style={{
              background: 'linear-gradient(135deg, #9333ea, #7c3aed, #db2777)',
              border: '2px solid rgba(168, 85, 247, 0.5)',
              borderRadius: '16px',
              padding: '16px 36px',
              color: 'white',
              fontSize: '18px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 0 30px rgba(147, 51, 234, 0.5), 0 4px 20px rgba(0,0,0,0.4)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(147, 51, 234, 0.7), 0 6px 25px rgba(0,0,0,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(147, 51, 234, 0.5), 0 4px 20px rgba(0,0,0,0.4)';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
              <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
            </svg>
            Connect Wallet
          </button>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes shimmer {
              0% { background-position: 0% center; }
              100% { background-position: 200% center; }
            }
          `}</style>
        </div>
      </Html>
    );
  }

  // Connected but no properties - show hint
  if (!hasProperties && showPropertyHint) {
    return (
      <>
        {/* Floating hint above bank */}
        <Html
          center
          position={[0, 3.2, 0]}
          style={{
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(30,20,50,0.95))',
              border: '2px solid rgba(147, 51, 234, 0.6)',
              borderRadius: '16px',
              padding: '16px 24px',
              color: 'white',
              textAlign: 'center',
              boxShadow: '0 0 30px rgba(147, 51, 234, 0.3), 0 4px 20px rgba(0,0,0,0.5)',
              animation: 'fadeIn 0.5s ease-out',
            }}
          >
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
            }}>
              <span>🎯</span>
              Get Started
            </div>
            <div style={{ 
              fontSize: '14px', 
              opacity: 0.8,
              marginBottom: '12px',
            }}>
              Pick a property around the board to start earning
            </div>
            <div style={{
              fontSize: '24px',
              animation: 'bounce 1s ease-in-out infinite',
            }}>
              ↓
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(8px); }
            }
          `}</style>
        </Html>

        {/* Glowing ring on a property tile */}
        <PropertyHighlight />
      </>
    );
  }

  return null;
}

/**
 * PropertyHighlight - Glowing ring around a starter property tile
 * Targets bottom row, center-ish tile (property 2)
 */
function PropertyHighlight() {
  const ringRef = useRef<THREE.Mesh>(null);
  
  // Board dimensions (from Board3DScene)
  const cornerSize = 1.0;
  const tileLong = 0.82;
  const tileShort = 1.0;
  const boardWidth = cornerSize * 2 + tileLong * 6;
  const boardHeight = cornerSize * 2 + tileLong * 5;
  const halfW = boardWidth / 2;
  const halfH = boardHeight / 2;
  
  // Property 2 position (bottom row, 3rd from right)
  // From Board3DScene: [5, 4, 3, 2, 1, 0].map((id, i) => ...)
  // Property 2 is at index 3, so: x = halfW - cornerSize - tileLong/2 - 3 * tileLong
  const propX = halfW - cornerSize - tileLong / 2 - 3 * tileLong;
  const propZ = halfH - tileShort / 2;
  
  const highlightPosition: [number, number, number] = [propX, 0.4, propZ];

  useFrame((state) => {
    if (!ringRef.current) return;
    
    // Pulse scale
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.12;
    ringRef.current.scale.setScalar(pulse);
    
    // Slow rotation
    ringRef.current.rotation.z = state.clock.elapsedTime * 0.4;
  });

  return (
    <group position={highlightPosition}>
      {/* Outer glowing ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.55, 32]} />
        <meshBasicMaterial 
          color={0xa855f7} 
          transparent 
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Inner subtle glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.45, 32]} />
        <meshBasicMaterial 
          color={0xa855f7} 
          transparent 
          opacity={0.12}
        />
      </mesh>
    </group>
  );
}