// ============================================
// FIXED useShieldActions.ts
// Webhook now handles all storage automatically
// ============================================

import { useCallback } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { EventParser } from '@coral-xyz/anchor';
import { getPropertyPDA, getPlayerPDA, getOwnershipPDA } from '@/utils/program';
import { GAME_CONFIG, REWARD_POOL, TOKEN_MINT } from '@/utils/constants';

export const useShieldActions = (
  program: Program | null,
  wallet: any,
  provider: AnchorProvider | null,
  connection: Connection,
  eventParser: EventParser | null,
  playerInitialized: boolean,
  setLoading: (loading: boolean) => void
) => {
  const activateShield = useCallback(async (propertyId: number, cycles: number) => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');

    setLoading(true);
    try {
      const playerTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        wallet.publicKey
      );

      // Get dev token account
      const devWallet = new PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");
      const devTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, devWallet);

      const [propertyPDA] = getPropertyPDA(propertyId);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);

      const tx = await program.methods
        .activateShield(cycles)
        .accountsPartial({
          property: propertyPDA,
          ownership: ownershipPDA,
          playerAccount: playerPDA,
          player: wallet.publicKey,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          devTokenAccount: devTokenAccount,
          gameConfig: GAME_CONFIG,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('✅ Shield activated successfully:', tx);
      
      // ✅ WEBHOOK HANDLES ALL STORAGE AUTOMATICALLY - No manual storage needed!
    
      return tx;
    } catch (error: any) {
      console.error('❌ Error activating shield:', error);
      
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

  const activateMultipleShields = useCallback(async (
    properties: Array<{ propertyId: number; slotsToShield: number }>
  ) => {
    if (!program || !wallet || !provider) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');
  
    setLoading(true);
    
    const BATCH_SIZE = 5; // Safe limit per transaction
    const batches: Array<Array<{ propertyId: number; slotsToShield: number }>> = [];
    
    // Split properties into batches
    for (let i = 0; i < properties.length; i += BATCH_SIZE) {
      batches.push(properties.slice(i, i + BATCH_SIZE));
    }
    
    try {
      const signatures: string[] = [];
      const playerTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
      const devWallet = new PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");
      const devTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, devWallet);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
  
      // Process each batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const tx = new Transaction();
  
        // Add shield instruction for each property in this batch
        for (const { propertyId, slotsToShield } of batch) {
          const [propertyPDA] = getPropertyPDA(propertyId);
          const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
  
          const instruction = await program.methods
            .activateShield(slotsToShield)
            .accountsPartial({
              property: propertyPDA,
              ownership: ownershipPDA,
              playerAccount: playerPDA,
              player: wallet.publicKey,
              playerTokenAccount,
              rewardPoolVault: REWARD_POOL,
              devTokenAccount,
              gameConfig: GAME_CONFIG,
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction();
  
          tx.add(instruction);
        }
  
        // Send this batch
        const signature = await provider.sendAndConfirm(tx);
        signatures.push(signature);
        
        console.log(`✅ Batch ${batchIndex + 1}/${batches.length} completed:`, signature);
  
        // Small delay between batches to avoid rate limiting
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
  
      // Log all transactions
      console.log(`✅ All ${batches.length} batch(es) completed successfully!`);
      console.log('Transaction signatures:', signatures);
  
      // ✅ WEBHOOK HANDLES ALL STORAGE AUTOMATICALLY - No manual storage needed!
  
      // Return first signature (or could return all)
      return signatures[0];
    } catch (error: any) {
      console.error('Error activating multiple shields:', error);
      
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
  }, [program, wallet, provider, connection, eventParser, playerInitialized, setLoading]);

  return {
    activateShield,
    activateMultipleShields
  };
};