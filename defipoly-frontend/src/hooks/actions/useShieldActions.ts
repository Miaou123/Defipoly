// ============================================
// UPDATED useShieldActions.ts
// FIXED: Uses DEV_WALLET and MARKETING_WALLET from constants
// ============================================

import { useCallback } from 'react';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { EventParser } from '@coral-xyz/anchor';
import { getPropertyPDA, getPlayerPDA } from '@/utils/program';
import { 
  GAME_CONFIG, 
  REWARD_POOL, 
  TOKEN_MINT,
  DEV_WALLET,
  MARKETING_WALLET 
} from '@/utils/constants';

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

      // ✅ FIX: Get wallet addresses from constants instead of hardcoding
      const devTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, DEV_WALLET);
      const marketingTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, MARKETING_WALLET);

      const [propertyPDA] = getPropertyPDA(propertyId);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);

      const methods = program?.methods;
      if (!methods) {
        throw new Error('Program not initialized');
      }
      const tx = await methods
        ['activateShield']!(cycles)
        .accountsPartial({
          property: propertyPDA,
          playerAccount: playerPDA,
          player: wallet.publicKey,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          devTokenAccount: devTokenAccount,
          marketingTokenAccount: marketingTokenAccount,
          gameConfig: GAME_CONFIG,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      
      return tx;
    } catch (error: any) {
      console.error('❌ Error activating shield:', error);
      
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        return 'already-processed';
      }
      
      throw error;
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [program, wallet, provider, connection, eventParser, playerInitialized, setLoading]);

  return {
    activateShield
  };
};