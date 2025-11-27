// ============================================
// FILE: defipoly-frontend/src/contexts/DefipolyContext.tsx
// Makes useDefipoly state a singleton shared across all components
// ============================================

'use client';

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

// Constants
import { TOKEN_MINT } from '@/utils/constants';

// Program utilities
import { getProgram, getPlayerPDA, fetchPlayerData } from '@/utils/program';

// Token utilities
import { 
  checkTokenAccountExists,
  createTokenAccountInstruction
} from '@/utils/token';

// Event storage utilities
import { createEventParser } from '@/utils/eventStorage';

// Action hooks
import { usePropertyActions } from '@/hooks/actions/usePropertyActions';
import { useShieldActions } from '@/hooks/actions/useShieldActions';
import { useRewardActions } from '@/hooks/actions/useRewardActions';
import { useStealActions } from '@/hooks/actions/useStealActions';

interface DefipolyContextType {
  program: Program | null;
  tokenBalance: number;
  playerInitialized: boolean;
  tokenAccountExists: boolean;
  loading: boolean;
  createTokenAccount: () => Promise<string>;
  initializePlayer: () => Promise<{ playerAccount: any; tx: string }>;
  buyProperty: (propertyId: number, slots?: number) => Promise<string>;
  sellProperty: (propertyId: number, slots: number) => Promise<string>;
  activateShield: (propertyId: number, cycles: number) => Promise<string>;
  claimRewards: () => Promise<string>;
  stealPropertyInstant: (propertyId: number) => Promise<any>;
}

const DefipolyContext = createContext<DefipolyContextType | null>(null);

export function DefipolyProvider({ children }: { children: React.ReactNode }) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [playerInitialized, setPlayerInitialized] = useState(false);
  const [tokenAccountExists, setTokenAccountExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const initCheckDone = useRef(false);

  // Initialize event parser for storing actions
  const eventParser = useMemo(() => createEventParser(wallet), [wallet]);

  const provider = useMemo(() => {
    if (!wallet) return null;
    return new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return getProgram(provider);
  }, [provider]);

  // Reset when wallet disconnects
  useEffect(() => {
    if (!wallet) {
      initCheckDone.current = false;
      setTokenBalance(0);
      setPlayerInitialized(false);
      setTokenAccountExists(false);
    }
  }, [wallet]);

  // Check initialization status - wait for program to be ready
  useEffect(() => {
    if (!wallet || !program) {
      return;
    }

    // Don't re-check if already done for this wallet
    if (initCheckDone.current) {
      return;
    }

    const checkInitialization = async () => {
      console.log('🔍 [DefipolyContext] Starting initialization check...');
      
      try {
        // Check token account
        const hasTokenAccount = await checkTokenAccountExists(connection, wallet.publicKey);
        console.log('💰 [DefipolyContext] Token account exists:', hasTokenAccount);
        setTokenAccountExists(hasTokenAccount);

        // Fetch token balance if account exists
        if (hasTokenAccount) {
          try {
            const tokenAccount = await getAssociatedTokenAddress(
              TOKEN_MINT,
              wallet.publicKey
            );
            const balance = await connection.getTokenAccountBalance(tokenAccount);
            setTokenBalance(Number(balance.value.amount) / 1e9);
          } catch (error) {
            console.error('Error fetching balance:', error);
            setTokenBalance(0);
          }
        }

        // Check if player is initialized
        const playerData = await fetchPlayerData(program, wallet.publicKey);
        const isInitialized = playerData !== null;
        console.log('👤 [DefipolyContext] Player initialized:', isInitialized);
        setPlayerInitialized(isInitialized);
        
        initCheckDone.current = true;
      } catch (error) {
        console.error('❌ [DefipolyContext] Error checking initialization:', error);
      }
    };

    checkInitialization();
  }, [wallet, connection, program]);

  const createTokenAccount = useCallback(async () => {
    if (!wallet || !provider) throw new Error('Wallet not connected');

    setLoading(true);
    try {
      const instruction = await createTokenAccountInstruction(wallet.publicKey);
      const transaction = new Transaction().add(instruction);
      
      const signature = await provider.sendAndConfirm(transaction);
      console.log('Token account created:', signature);
      
      setTokenAccountExists(true);
      return signature;
    } catch (error) {
      console.error('Error creating token account:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [wallet, provider]);

  const initializePlayer = useCallback(async () => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    const methods = program?.methods;
    if (!methods) {
      throw new Error('Program not initialized');
    }
    if (!tokenAccountExists) throw new Error('Create token account first');

    setLoading(true);
    try {
      const [playerPDA] = getPlayerPDA(wallet.publicKey);

      const tx = await methods
        ['initializePlayer']!()
        .accountsPartial({
          player: wallet.publicKey,
          playerAccount: playerPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Player initialized:', tx);
      setPlayerInitialized(true);
      return { playerAccount: playerPDA, tx };
    } catch (error) {
      console.error('Error initializing player:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, tokenAccountExists]);

  // Action hooks - using the shared state
  const propertyActions = usePropertyActions(
    program, wallet, provider, connection, eventParser,
    playerInitialized, tokenAccountExists, setLoading,
    setTokenAccountExists, setPlayerInitialized
  );
  
  const shieldActions = useShieldActions(
    program, wallet, provider, connection, eventParser,
    playerInitialized, setLoading
  );
  
  const rewardActions = useRewardActions(
    program, wallet, connection, eventParser,
    playerInitialized, setLoading
  );
  
  const stealActions = useStealActions(
    program, wallet, provider, connection, eventParser,
    playerInitialized, setLoading
  );

  const value = useMemo(() => ({
    program,
    tokenBalance,
    playerInitialized,
    tokenAccountExists,
    loading,
    createTokenAccount,
    initializePlayer,
    ...propertyActions,
    ...shieldActions,
    ...rewardActions,
    ...stealActions,
  }), [
    program,
    tokenBalance,
    playerInitialized,
    tokenAccountExists,
    loading,
    createTokenAccount,
    initializePlayer,
    propertyActions,
    shieldActions,
    rewardActions,
    stealActions,
  ]);

  return (
    <DefipolyContext.Provider value={value}>
      {children}
    </DefipolyContext.Provider>
  );
}

export function useDefipoly() {
  const context = useContext(DefipolyContext);
  if (!context) {
    throw new Error('useDefipoly must be used within DefipolyProvider');
  }
  return context;
}