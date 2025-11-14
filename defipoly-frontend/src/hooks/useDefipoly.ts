import { useMemo, useState, useCallback, useEffect } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
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
import { usePropertyActions } from './actions/usePropertyActions';
import { useShieldActions } from './actions/useShieldActions';
import { useRewardActions } from './actions/useRewardActions';
import { useStealActions } from './actions/useStealActions';
import { useDataFetchers } from './data/useDataFetchers';

export function useDefipoly() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [playerInitialized, setPlayerInitialized] = useState(false);
  const [tokenAccountExists, setTokenAccountExists] = useState(false);
  const [loading, setLoading] = useState(false);

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


  // Check initialization status - ONLY ON MOUNT, NO POLLING
  useEffect(() => {
    if (!wallet) {
      setTokenBalance(0);
      setPlayerInitialized(false);
      setTokenAccountExists(false);
      return;
    }

    const checkInitialization = async () => {
      try {
        // Check token account
        const hasTokenAccount = await checkTokenAccountExists(connection, wallet.publicKey);
        setTokenAccountExists(hasTokenAccount);

        // Fetch token balance if account exists (only on mount)
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
        if (program) {
          const playerData = await fetchPlayerData(program, wallet.publicKey);
          setPlayerInitialized(playerData !== null);
        }
      } catch (error) {
        console.error('Error checking initialization:', error);
      }
    };

    // Only run once on mount - no polling interval
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
    if (!tokenAccountExists) throw new Error('Create token account first');

    setLoading(true);
    try {
      const [playerPDA] = getPlayerPDA(wallet.publicKey);

      const tx = await program.methods
        .initializePlayer()
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

  // Action hooks
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
  
  const dataFetchers = useDataFetchers(program, wallet);

  return {
    program,
    tokenBalance,
    playerInitialized,
    tokenAccountExists,
    loading,
    createTokenAccount,
    initializePlayer,
    // Property actions
    ...propertyActions,
    // Shield actions
    ...shieldActions,
    // Reward actions
    ...rewardActions,
    // Steal actions - ONLY random steal now
    ...stealActions,
    // Data fetchers
    ...dataFetchers
  };
}