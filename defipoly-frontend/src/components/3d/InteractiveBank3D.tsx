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

interface InteractiveBank3DProps {
  position?: [number, number, number];
  scale?: number;
  onParticleArrive?: () => void;
}

export const InteractiveBank3D = forwardRef<{ handleParticleArrive: () => void }, InteractiveBank3DProps>(function InteractiveBank3D({ position = [0, 0.8, 0], scale = 0.084, onParticleArrive }, ref) {
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

  return (
    <group 
      position={position} 
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        handleBankClick();
      }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <Suspense fallback={null}>
        <Bank3D_V2 
          rewardsAmount={animatedRewards} 
          profilePicture={gameState?.profile?.profilePicture || null}
        />
      </Suspense>
    </group>
  );
});