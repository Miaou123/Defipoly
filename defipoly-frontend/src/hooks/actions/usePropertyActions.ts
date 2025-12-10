// ============================================
// UPDATED usePropertyActions.ts for v7 Program
// Buy and Sell only - Steal is in useStealActions
// ============================================

import { useCallback } from 'react';
import { SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { EventParser } from '@coral-xyz/anchor';
import { 
  getPropertyPDA, 
  getPlayerPDA, 
  getOwnershipPDA, 
  getSetCooldownPDA,
  getSetOwnershipPDA,
  getSetStatsPDA,
  fetchPlayerData
} from '@/utils/program';
import { 
  GAME_CONFIG, 
  REWARD_POOL, 
  TOKEN_MINT,
  DEV_WALLET,
  MARKETING_WALLET 
} from '@/utils/constants';

export const usePropertyActions = (
  program: Program | null,
  wallet: any,
  provider: AnchorProvider | null,
  connection: Connection,
  eventParser: EventParser | null,
  playerInitialized: boolean,
  tokenAccountExists: boolean,
  setLoading: (loading: boolean) => void,
  setTokenAccountExists: (exists: boolean) => void,
  setPlayerInitialized: (initialized: boolean) => void
) => {

  // ============================================
  // BUY PROPERTY (with auto player init)
  // ============================================
  const buyProperty = useCallback(async (propertyId: number, slots: number = 1) => {
    if (!program || !wallet || !provider) throw new Error('Wallet not connected');
    if (!tokenAccountExists) throw new Error('Create token account first');

    setLoading(true);
    try {
      console.log('\n🚀 Starting buyProperty');
      console.log('Property ID:', propertyId, 'Slots:', slots);
      
      const playerTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
      const devTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, DEV_WALLET);
      const marketingTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, MARKETING_WALLET);

      const [propertyPDA] = getPropertyPDA(propertyId);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);

      const transaction = new Transaction();
      const playerData = await fetchPlayerData(program, wallet.publicKey);

      // Initialize player if needed
      if (!playerData) {
        console.log('🆕 Adding initialize player instruction');
        const methods = program?.methods;
        if (!methods) {
          throw new Error('Program not initialized');
        }
        const initPlayerIx = await methods
          ['initializePlayer']!()
          .accountsPartial({
            player: wallet.publicKey,
            playerAccount: playerPDA,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        transaction.add(initPlayerIx);
      }

      // Fetch property to get setId
      const propertyData = await (program.account as any).property.fetch(propertyPDA);
      const setId = propertyData.setId;

      // Get all set-related PDAs
      const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
      const [setCooldownPDA] = getSetCooldownPDA(wallet.publicKey, setId);
      const [setOwnershipPDA] = getSetOwnershipPDA(wallet.publicKey, setId);
      const [setStatsPDA] = getSetStatsPDA(setId);

      console.log('📍 Adding buy property instruction...');
      
      // Add buy property instruction
      const methods = program?.methods;
      if (!methods) {
        throw new Error('Program not initialized');
      }
      const buyPropertyIx = await methods
        ['buyProperty']!(slots)
        .accountsPartial({
          property: propertyPDA,
          ownership: ownershipPDA,
          setCooldown: setCooldownPDA,
          setOwnership: setOwnershipPDA,
          setStats: setStatsPDA,
          playerAccount: playerPDA,
          player: wallet.publicKey,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          devTokenAccount,
          marketingTokenAccount,
          gameConfig: GAME_CONFIG,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      transaction.add(buyPropertyIx);
  
      // Send and confirm transaction
      const signature = await provider.sendAndConfirm(transaction, [], {
        commitment: 'confirmed',
        skipPreflight: false,
      });
      
      
      // Update states
      if (!playerData) setPlayerInitialized(true);
      
      return signature;
      
    } catch (error: any) {
      console.error('❌ Error in buyProperty:', error);
      
      // Check if already processed
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('already been processed')) {
        return 'already-processed';
      }
      
      throw error;
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [program, wallet, provider, connection, tokenAccountExists, setLoading, setPlayerInitialized]);

  // ============================================
  // SELL PROPERTY
  // ============================================
  const sellProperty = useCallback(async (propertyId: number, slots: number) => {
    if (!program || !wallet || !provider) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');

    setLoading(true);
    try {
      console.log('\n🏪 Selling property', propertyId, 'slots:', slots);
      
      const playerTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
      const [propertyPDA] = getPropertyPDA(propertyId);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);

      const methods = program?.methods;
      if (!methods) {
        throw new Error('Program not initialized');
      }
      const tx = await methods
        ['sellProperty']!(slots)
        .accountsPartial({
          property: propertyPDA,
          ownership: ownershipPDA,
          playerAccount: playerPDA,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          gameConfig: GAME_CONFIG,
          player: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      await connection.confirmTransaction(tx, 'confirmed');
      return tx;
      
    } catch (error: any) {
      console.error('❌ Error selling:', error);
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('already been processed')) {
        return 'already-processed';
      }
      throw error;
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [program, wallet, provider, connection, playerInitialized, setLoading]);

  return {
    buyProperty,
    sellProperty,
  };
};