import { useCallback } from 'react';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Program } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { EventParser } from '@coral-xyz/anchor';
import { 
  getPropertyPDA,
  getPlayerPDA,
  getOwnershipPDA,
  fetchPlayerData,
  fetchOwnershipData
} from '@/utils/program';
import { GAME_CONFIG, REWARD_POOL, TOKEN_MINT } from '@/utils/constants';
import { storeTransactionEvents } from '@/utils/eventStorage';

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
      
      console.log('🔑 Player PDA:', playerPDA.toString());
      console.log('👤 Player PublicKey:', wallet.publicKey.toString());
  
      const playerData = await fetchPlayerData(program, wallet.publicKey);
      if (!playerData || playerData.propertiesOwnedCount === 0) {
        throw new Error('No properties to claim rewards from');
      }
  
      // Separate arrays for ownerships and properties
      const ownershipAccounts: any[] = [];
      const propertyAccounts: any[] = [];
  
      for (let propertyId = 0; propertyId < 22; propertyId++) {
        const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
        try {
          const ownershipData = await fetchOwnershipData(program, wallet.publicKey, propertyId);
          if (ownershipData?.slotsOwned && ownershipData.slotsOwned > 0) {
            const [propertyPDA] = getPropertyPDA(propertyId);
            
            // Add to separate arrays
            ownershipAccounts.push({
              pubkey: ownershipPDA,
              isWritable: false,
              isSigner: false,
            });
            propertyAccounts.push({
              pubkey: propertyPDA,
              isWritable: false,
              isSigner: false,
            });
          }
        } catch (e) {
          continue;
        }
      }
  
      // Combine arrays - all ownerships first, then all properties
      const remainingAccounts = [...ownershipAccounts, ...propertyAccounts];
      const numPropertiesOwned = ownershipAccounts.length;
  
      console.log(`📊 Found ${numPropertiesOwned} properties to claim from`);
      console.log(`📦 Remaining accounts order: ${numPropertiesOwned} ownerships + ${numPropertiesOwned} properties`);
  
      // Pass num_properties parameter
      const tx = await program.methods
        .claimRewards(numPropertiesOwned)
        .accountsPartial({
          playerAccount: playerPDA,
          player: wallet.publicKey,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          gameConfig: GAME_CONFIG,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts)
        .rpc();
  
      console.log('✅ Rewards claimed successfully:', tx);
  
      // Try to store to backend
      try {
        await storeTransactionEvents(connection, eventParser, tx);
      } catch (backendError) {
        console.warn('⚠️ Backend storage failed (non-critical):', backendError);
      }
  
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