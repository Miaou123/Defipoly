// ============================================
// FIXED useRewardActions.ts - O(1) CLAIMS
// No more property iteration - uses pending_rewards
// Webhook now handles all storage automatically
// ============================================

import { useCallback } from 'react';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Program } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { EventParser } from '@coral-xyz/anchor';
import { 
  getPlayerPDA,
} from '@/utils/program';
import { GAME_CONFIG, REWARD_POOL, TOKEN_MINT } from '@/utils/constants';

export const useRewardActions = (
  program: Program | null,
  wallet: any,
  connection: Connection,
  eventParser: EventParser | null,
  playerInitialized: boolean,
  setLoading: (loading: boolean) => void
) => {
  const claimRewards = useCallback(async () => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');
  
    setLoading(true);
    try {
      const playerTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        wallet.publicKey
      );
  
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      
      console.log('🎯 Claiming rewards (O(1) - no properties needed)');
      console.log('🔑 Player PDA:', playerPDA.toString());
  
      // ✅ NO MORE PROPERTY ITERATION - O(1) CLAIM
      const tx = await program.methods
        .claimRewards() // No parameters needed!
        .accountsPartial({
          playerAccount: playerPDA,
          player: wallet.publicKey,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          gameConfig: GAME_CONFIG,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        // ✅ No remainingAccounts needed!
        .rpc();
  
      console.log('✅ Rewards claimed successfully:', tx);
  
      // ✅ WEBHOOK HANDLES ALL STORAGE AUTOMATICALLY - No manual storage needed!
  
      return tx;
    } catch (error: any) {
      console.error('❌ Error claiming rewards:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, connection, eventParser, playerInitialized, setLoading]);

  return {
    claimRewards
  };
};