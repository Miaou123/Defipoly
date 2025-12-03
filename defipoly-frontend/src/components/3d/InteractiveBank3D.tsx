'use client';

import { useRef, useState, useEffect, useCallback, Suspense, forwardRef, useImperativeHandle } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useRewards } from '@/contexts/RewardsContext';
import { useDefipoly } from '@/contexts/DefipolyContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGameState } from '@/contexts/GameStateContext';
import { PROGRAM_ID } from '@/utils/constants';
import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import idl from '@/idl/defipoly_program.json';
import { Bank3D_V2 } from './r3f/Bank3D_R3F';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface InteractiveBank3DProps {
  position?: [number, number, number];
  scale?: number;
  onParticleArrive?: () => void;
  showClaimHint?: boolean;
  onClaimHintDismiss?: () => void;
}

function ClaimHintGlow({ visible }: { visible: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const [opacity, setOpacity] = useState(0);
  
  // Fade in
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setOpacity(1), 100);
      return () => clearTimeout(timer);
    } else {
      setOpacity(0);
    }
  }, [visible]);
  
  // Pulse animation
  useFrame((state) => {
    if (!ringRef.current || !visible) return;
    
    const t = state.clock.elapsedTime;
    // Gentle pulse: scale between 1.0 and 1.15
    const pulse = 1.0 + Math.sin(t * 2) * 0.075;
    ringRef.current.scale.setScalar(pulse);
    
    // Rotate slowly
    ringRef.current.rotation.z = t * 0.3;
  });
  
  if (!visible) return null;
  
  return (
    <mesh ref={ringRef} position={[0, 12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[18, 22, 32]} />
      <meshBasicMaterial 
        color={0xFFD700} 
        transparent 
        opacity={opacity * 0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function ClaimHintLabel({ visible }: { visible: boolean }) {
  const [show, setShow] = useState(false);
  
  // Fade in after glow appears
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setShow(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <Html
      position={[0, 20, 12]}
      center
      style={{
        opacity: show ? 1 : 0,
        transition: 'opacity 0.4s ease-out',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.85), rgba(30,20,50,0.9))',
          border: '2px solid #FFD700',
          borderRadius: '12px',
          padding: '10px 18px',
          color: 'white',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: '15px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.4), 0 4px 15px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'float 2s ease-in-out infinite',
        }}
      >
        <span style={{ color: '#FFD700' }}>💰</span>
        Claim
        <span style={{ 
          color: '#FFD700',
          animation: 'bounce 1s ease-in-out infinite',
        }}>
          →
        </span>
        
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          @keyframes bounce {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(4px); }
          }
        `}</style>
      </div>
    </Html>
  );
}

export const InteractiveBank3D = forwardRef<{ handleParticleArrive: () => void }, InteractiveBank3DProps>(function InteractiveBank3D({ 
  position = [0, 0.8, 0], 
  scale = 0.084, 
  onParticleArrive,
  showClaimHint = false,
  onClaimHintDismiss,
}, ref) {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { unclaimedRewards, loading: rewardsLoading } = useRewards();
  const { claimRewards, loading: claimLoading } = useDefipoly();
  const { showSuccess, showError } = useNotification();
  const gameState = useGameState();
  
  const [claiming, setClaiming] = useState(false);
  const [displayedRewards, setDisplayedRewards] = useState<number>(0);
  const [animatedRewards, setAnimatedRewards] = useState<number>(0);
  const claimingRef = useRef(false);
  const lastClickTimeRef = useRef(0);
  const initializedRef = useRef(false);

  // Initialize displayedRewards from blockchain value
  useEffect(() => {
    if (!initializedRef.current && unclaimedRewards > 0 && !claimingRef.current) {
      setDisplayedRewards(unclaimedRewards);
      setAnimatedRewards(unclaimedRewards);
      initializedRef.current = true;
    }
  }, [unclaimedRewards]);

  // Sync with blockchain when rewards go to 0 (claimed on-chain)
  useEffect(() => {
    if (unclaimedRewards === 0 && initializedRef.current && !claimingRef.current) {
      initializedRef.current = false;
      setDisplayedRewards(0);
      setAnimatedRewards(0);
    }
  }, [unclaimedRewards]);

  // Handle particle arrival and increment animated counter
  const handleParticleArrive = useCallback(() => {
    // Simple increment - each particle represents a small reward increment
    const incrementAmount = Math.max(1, Math.floor(Math.random() * 10) + 5); // Random small increment
    
    setAnimatedRewards(prev => prev + incrementAmount);
    onParticleArrive?.();
  }, [onParticleArrive]);

  // Expose handleParticleArrive to parent via ref
  useImperativeHandle(ref, () => ({
    handleParticleArrive
  }), [handleParticleArrive]);

  // Handle bank click to claim rewards
  const handleBankClick = useCallback(async () => {
    const now = Date.now();
    if (!connected || !publicKey || claiming || claimingRef.current || rewardsLoading || animatedRewards === 0 || (now - lastClickTimeRef.current < 1000)) {
      if (now - lastClickTimeRef.current < 1000) {
        console.log('🏦 Bank click ignored - too soon after last click');
      }
      return;
    }
    
    lastClickTimeRef.current = now;
    console.log('🏦 3D Bank clicked - starting claim process');
    claimingRef.current = true;
    setClaiming(true);
    
    // Store the amount before resetting
    const amountToClaim = animatedRewards;
    
    try {
      const signature = await claimRewards();
      
      if (signature) {
        // Reset immediately on successful signature
        setDisplayedRewards(0);
        setAnimatedRewards(0);
        initializedRef.current = false;
        
        try {
          const tx = await connection.getTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          });
          
          let actualClaimedAmount = amountToClaim;
          
          if (tx?.meta?.logMessages) {
            const coder = new BorshCoder(idl as any);
            const eventParser = new EventParser(PROGRAM_ID, coder);
            const events = eventParser.parseLogs(tx.meta.logMessages);
            
            for (const event of events) {
              if (event.name === 'RewardsClaimed') {
                const eventAmount = (event.data as any).amount?.toNumber?.();
                if (eventAmount) {
                  actualClaimedAmount = eventAmount / 1e9;
                }
                break;
              }
            }
          }

          showSuccess(
            'Rewards Claimed!', 
            `Successfully claimed ${actualClaimedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            signature !== 'already-processed' ? signature : undefined
          );
        } catch (parseError) {
          showSuccess(
            'Rewards Claimed!', 
            `Successfully claimed ${amountToClaim.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            signature !== 'already-processed' ? signature : undefined
          );
        }
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
      
      const errorMessage = String(error instanceof Error ? error.message : error);
      if (errorMessage.includes('User rejected') || errorMessage.includes('rejected the request')) {
        // User canceled the transaction - don't show an error
        console.log('🚫 User canceled the claim transaction');
      } else if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        showSuccess('Rewards Claimed!', 'Rewards have been claimed!');
        setDisplayedRewards(0);
        setAnimatedRewards(0);
        initializedRef.current = false;
      } else {
        showError('Claim Failed', 'Failed to claim rewards. Please try again.');
      }
    } finally {
      console.log('🏦 3D Bank claim process finished - resetting state');
      setClaiming(false);
      claimingRef.current = false;
    }
  }, [connected, publicKey, claiming, claimingRef, rewardsLoading, animatedRewards, claimRewards, connection, showSuccess, showError]);

  // Handle hover to dismiss hint
  const handlePointerOver = useCallback(() => {
    document.body.style.cursor = 'pointer';
    
    // Dismiss claim hint on hover
    if (showClaimHint && onClaimHintDismiss) {
      onClaimHintDismiss();
    }
  }, [showClaimHint, onClaimHintDismiss]);

  return (
    <group 
      position={position} 
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        handleBankClick();
      }}
      onPointerOver={handlePointerOver}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      {/* Claim Hint Glow Ring */}
      <ClaimHintGlow visible={showClaimHint} />
      
      {/* Claim Hint Floating Label */}
      <ClaimHintLabel visible={showClaimHint} />
      
      <Suspense fallback={null}>
        <Bank3D_V2 
          rewardsAmount={animatedRewards} 
          profilePicture={gameState?.profile?.profilePicture || null}
        />
      </Suspense>
    </group>
  );
});