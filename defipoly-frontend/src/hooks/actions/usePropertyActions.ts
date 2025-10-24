// ============================================
// FIXED usePropertyActions.ts (v2 - Corrected)
// Webhook now handles all storage automatically
// Fixed: getSetStatsPDA only takes setId parameter
// ============================================

import { useCallback } from 'react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
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
import { GAME_CONFIG, REWARD_POOL, TOKEN_MINT } from '@/utils/constants';

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
  const buyProperty = useCallback(async (propertyId: number, slots: number = 1) => {
    if (!program || !wallet || !provider) throw new Error('Wallet not connected');
    if (!tokenAccountExists) throw new Error('Create token account first');

    setLoading(true);
    try {
      const playerTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
      
      const devWallet = new PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");
      const devTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, devWallet);

      const [propertyPDA] = getPropertyPDA(propertyId);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);

      const transaction = new Transaction();
      const playerData = await fetchPlayerData(program, wallet.publicKey);
      const hasTokenAccount = tokenAccountExists;

      // Initialize player if needed
      if (!playerData) {
        console.log('🆕 Adding initialize player instruction');
        const initPlayerIx = await program.methods
          .initializePlayer()
          .accountsPartial({
            player: wallet.publicKey,
            playerAccount: playerPDA,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        transaction.add(initPlayerIx);
      }

      // ✅ FIXED: Fetch property to get setId first
      const propertyData = await (program.account as any).property.fetch(propertyPDA);
      const setId = propertyData.setId;

      // Get all set-related PDAs using the correct parameters
      const [setCooldownPDA] = getSetCooldownPDA(wallet.publicKey, setId);
      const [setOwnershipPDA] = getSetOwnershipPDA(wallet.publicKey, setId);
      const [setStatsPDA] = getSetStatsPDA(setId); // ✅ Only takes setId, not wallet.publicKey

      // Add buy property instruction with slots parameter
      const buyPropertyIx = await program.methods
        .buyProperty(slots)
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
          devTokenAccount: devTokenAccount,
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
      
      console.log(`✅ Bought ${slots} slot(s) successfully:`, signature);
      
      // ✅ WEBHOOK HANDLES ALL STORAGE AUTOMATICALLY - No manual storage needed!
      
      // Update states
      if (!hasTokenAccount) setTokenAccountExists(true);
      if (!playerData) setPlayerInitialized(true);
      
      return signature;
    } catch (error: any) {
      console.error('❌ Error in buyProperty:', error);
      
      // Check if already processed (which means success!)
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        console.log('✅ Transaction already processed (success)');
        return 'already-processed';
      }
      
      throw error;
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [program, wallet, provider, connection, eventParser, playerInitialized, tokenAccountExists, setLoading, setTokenAccountExists, setPlayerInitialized]);

  const sellProperty = useCallback(async (propertyId: number, slots: number) => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');

    setLoading(true);
    try {
      const playerTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        wallet.publicKey
      );

      const [propertyPDA] = getPropertyPDA(propertyId);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);

      const tx = await program.methods
        .sellProperty(slots)
        .accountsPartial({
          property: propertyPDA,
          ownership: ownershipPDA,
          playerAccount: playerPDA,
          player: wallet.publicKey,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          gameConfig: GAME_CONFIG,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('✅ Property sold successfully:', tx);

      // ✅ WEBHOOK HANDLES ALL STORAGE AUTOMATICALLY - No manual storage needed!

      return tx;
    } catch (error: any) {
      console.error('❌ Error selling property:', error);
      
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        console.log('✅ Transaction already processed (success)');
        return 'already-processed';
      }
      
      throw error;
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [program, wallet, connection, eventParser, playerInitialized, setLoading]);

  return {
    buyProperty,
    sellProperty
  };
};