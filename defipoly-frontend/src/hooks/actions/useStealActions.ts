import { useCallback } from 'react';
import { PublicKey, SYSVAR_SLOT_HASHES_PUBKEY, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { EventParser } from '@coral-xyz/anchor';
import { 
  getPropertyPDA,
  getPlayerPDA,
  getOwnershipPDA,
  getStealRequestPDA
} from '@/utils/program';
import { fetchPropertyOwners, selectRandomOwnerUnweighted } from '@/utils/propertyOwners';
import { GAME_CONFIG, REWARD_POOL, TOKEN_MINT } from '@/utils/constants';
import { storeTransactionEvents } from '@/utils/eventStorage';

export const useStealActions = (
  program: Program | null,
  wallet: any,
  provider: AnchorProvider | null,
  connection: Connection,
  eventParser: EventParser | null,
  playerInitialized: boolean,
  setLoading: (loading: boolean) => void
) => {
  const stealPropertyTargeted = useCallback(async (propertyId: number, targetPlayer: string, isTargeted: boolean = true) => {
    if (!program || !wallet || !provider) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');
  
    setLoading(true);
    try {
      const targetPlayerPubkey = new PublicKey(targetPlayer);
      
      // Prevent self-stealing
      if (targetPlayerPubkey.equals(wallet.publicKey)) {
        throw new Error('Cannot steal from yourself');
      }
      
      // Validate that target player actually owns this property
      console.log(`🔍 Validating that ${targetPlayer} owns property ${propertyId}...`);
      const [targetOwnershipPDA] = getOwnershipPDA(targetPlayerPubkey, propertyId);
      
      try {
        const targetOwnership = await (program.account as any).propertyOwnership.fetch(targetOwnershipPDA);
        if (!targetOwnership || targetOwnership.slotsOwned === 0) {
          throw new Error(`Target player ${targetPlayer} does not own any slots in property ${propertyId}`);
        }
        
        // Check if target has unshielded slots
        const currentTime = Math.floor(Date.now() / 1000);
        const shieldActive = targetOwnership.shieldExpiry > currentTime;
        const effectiveShieldedSlots = shieldActive ? targetOwnership.slotsShielded : 0;
        const unshieldedSlots = targetOwnership.slotsOwned - effectiveShieldedSlots;
        
        if (unshieldedSlots <= 0) {
          throw new Error(`All slots owned by ${targetPlayer} in property ${propertyId} are shielded`);
        }
        
        console.log(`✅ Target has ${unshieldedSlots} unshielded slots available to steal`);
      } catch (fetchError) {
        throw new Error(`Target player ${targetPlayer} does not own property ${propertyId} or account doesn't exist`);
      }
      
      // Get all required accounts
      const playerTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
      const devWallet = new PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");
      const devTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, devWallet);
      
      const [propertyPDA] = getPropertyPDA(propertyId);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [stealRequestPDA] = getStealRequestPDA(wallet.publicKey, propertyId);
      // targetOwnershipPDA already declared above in validation
      
      // Generate user randomness
      const userRandomness = new Uint8Array(32);
      crypto.getRandomValues(userRandomness);
      
      console.log(`🎲 Initiating ${isTargeted ? 'TARGETED' : 'RANDOM'} steal with randomness...`);
      
      let requestTx: string;
      try {
        // Step 1: Request steal
        requestTx = await program.methods
          .stealPropertyRequest(
            targetPlayerPubkey, 
            isTargeted,
            Array.from(userRandomness)
          )
          .accountsPartial({
            property: propertyPDA,
            targetOwnership: targetOwnershipPDA,
            stealRequest: stealRequestPDA,
            playerAccount: playerPDA,
            attacker: wallet.publicKey,
            playerTokenAccount,
            rewardPoolVault: REWARD_POOL,
            devTokenAccount,
            gameConfig: GAME_CONFIG,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        
        console.log('✅ Steal requested:', requestTx);
      } catch (requestError) {
        const errorMessage = String(requestError instanceof Error ? requestError.message : requestError);
        if (errorMessage.includes('already been processed')) {
          console.log('✅ Request transaction already processed');
          requestTx = 'already-processed';
        } else {
          throw requestError;
        }
      }
      
      // Wait for VRF fulfillment
      console.log('⏳ Waiting for VRF fulfillment...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      let fulfillTx: string;
      try {
        // Step 2: Fulfill the steal request
        const [attackerOwnershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
        const [targetPlayerPDA] = getPlayerPDA(targetPlayerPubkey);
        
        fulfillTx = await program.methods
          .stealPropertyFulfill()
          .accountsPartial({
            property: propertyPDA,
            targetOwnership: targetOwnershipPDA,
            attackerOwnership: attackerOwnershipPDA,
            stealRequest: stealRequestPDA,
            attackerAccount: playerPDA,
            targetAccount: targetPlayerPDA,
            gameConfig: GAME_CONFIG,
            slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
            payer: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        
        console.log('✅ Steal fulfilled:', fulfillTx);
      } catch (fulfillError) {
        const errorMessage = String(fulfillError instanceof Error ? fulfillError.message : fulfillError);
        if (errorMessage.includes('already been processed')) {
          console.log('✅ Fulfill transaction already processed');
          fulfillTx = 'already-processed';
        } else {
          throw fulfillError;
        }
      }
      
      // Backend logging in background
      (async () => {
        try {
          if (requestTx && requestTx !== 'already-processed') {
            await storeTransactionEvents(connection, eventParser, requestTx);
          }
          if (fulfillTx && fulfillTx !== 'already-processed') {
            await storeTransactionEvents(connection, eventParser, fulfillTx);
          }
        } catch (backendError) {
          console.warn('⚠️ Backend storage failed (non-critical):', backendError);
        }
      })();
      
      // Fetch the result
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const stealRequest = await (program.account as any).stealRequest.fetch(stealRequestPDA);
        
        if (stealRequest.success) {
          console.log('✅ Steal successful! VRF:', stealRequest.vrfResult.toString());
        } else {
          console.log('❌ Steal failed. VRF:', stealRequest.vrfResult.toString());
        }
        
        return {
          requestTx,
          fulfillTx,
          success: stealRequest.success,
          vrfResult: stealRequest.vrfResult.toString(),
        };
      } catch (fetchError) {
        console.warn('⚠️ Could not fetch steal result, checking logs instead...');
        
        // Fallback: check transaction logs
        const txDetails = await connection.getTransaction(fulfillTx, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });
        
        const logs = txDetails?.meta?.logMessages || [];
        const success = logs.some(log => log.includes('STEAL SUCCESS'));
        
        return {
          requestTx,
          fulfillTx,
          success,
          vrfResult: 'Check transaction logs',
        };
      }
    } catch (error) {
      console.error('Error stealing property:', error);
      
      const errorMessage = String(error instanceof Error ? error.message : error);
      if (errorMessage.includes('already been processed')) {
        console.log('✅ Steal transactions already processed');
        return {
          requestTx: 'already-processed',
          fulfillTx: 'already-processed',
          success: true,
          vrfResult: 'unknown',
        };
      }
      
      throw error;
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [program, wallet, provider, connection, eventParser, playerInitialized, setLoading]);

  const stealPropertyRandom = useCallback(async (propertyId: number, specificTarget?: string) => {
    if (!program || !wallet || !provider) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');
  
    setLoading(true);
    try {
      // If no specific target provided, we need to find someone who owns the property
      let targetPlayerPubkey: PublicKey;
      
      if (specificTarget) {
        targetPlayerPubkey = new PublicKey(specificTarget);
      } else {
        // For true random steal, fetch all owners and select one randomly
        console.log('🎲 Finding random target for property', propertyId);
        const owners = await fetchPropertyOwners(connection, program, propertyId);
        
        if (owners.length === 0) {
          throw new Error(`No players own unshielded slots in property ${propertyId}. Cannot perform random steal.`);
        }
        
        const randomTarget = selectRandomOwnerUnweighted(owners, wallet.publicKey);
        if (!randomTarget) {
          throw new Error('No eligible targets found (excluding yourself). You might be the only owner or all slots are shielded.');
        }
        
        targetPlayerPubkey = randomTarget;
        console.log('🎯 Random target selected:', randomTarget.toString());
        
        // Double-check the selected target (since fetchPropertyOwners might be cached/outdated)
        const [selectedTargetOwnershipPDA] = getOwnershipPDA(targetPlayerPubkey, propertyId);
        try {
          const targetOwnership = await (program.account as any).propertyOwnership.fetch(selectedTargetOwnershipPDA);
          if (!targetOwnership || targetOwnership.slotsOwned === 0) {
            throw new Error(`Selected random target no longer owns property ${propertyId}`);
          }
          
          // Check if target has unshielded slots
          const currentTime = Math.floor(Date.now() / 1000);
          const shieldActive = targetOwnership.shieldExpiry > currentTime;
          const effectiveShieldedSlots = shieldActive ? targetOwnership.slotsShielded : 0;
          const unshieldedSlots = targetOwnership.slotsOwned - effectiveShieldedSlots;
          
          if (unshieldedSlots <= 0) {
            throw new Error(`Selected random target's slots in property ${propertyId} are all shielded`);
          }
          
          console.log(`✅ Random target confirmed with ${unshieldedSlots} unshielded slots`);
        } catch (fetchError) {
          throw new Error(`Selected random target no longer owns property ${propertyId} or account is invalid`);
        }
      }
      
      // Get all required accounts
      const playerTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
      const devWallet = new PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");
      const devTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, devWallet);
      
      const [propertyPDA] = getPropertyPDA(propertyId);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [targetOwnershipPDA] = getOwnershipPDA(targetPlayerPubkey, propertyId);
      const [stealRequestPDA] = getStealRequestPDA(wallet.publicKey, propertyId);
      
      // Generate user randomness
      const userRandomness = new Uint8Array(32);
      crypto.getRandomValues(userRandomness);
      
      console.log('🎲 Initiating RANDOM steal with randomness...');
      
      let requestTx: string = '';
      try {
        // Step 1: Request steal with is_targeted = false for RANDOM steal
        requestTx = await program.methods
          .stealPropertyRequest(
            targetPlayerPubkey,
            false, // is_targeted = false means RANDOM STEAL (higher success rate)
            Array.from(userRandomness)
          )
          .accountsPartial({
            property: propertyPDA,
            targetOwnership: targetOwnershipPDA,
            stealRequest: stealRequestPDA,
            playerAccount: playerPDA,
            attacker: wallet.publicKey,
            playerTokenAccount,
            rewardPoolVault: REWARD_POOL,
            devTokenAccount,
            gameConfig: GAME_CONFIG,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        
        console.log('✅ Random steal requested:', requestTx);
      } catch (requestError) {
        const errorMessage = String(requestError instanceof Error ? requestError.message : requestError);
        console.error('Failed to request random steal:', errorMessage);
        
        if (errorMessage.includes('already in use')) {
          console.log('Steal request exists, proceeding to fulfill...');
          requestTx = 'existing-request';
        } else {
          throw requestError;
        }
      }
      
      // Wait for confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('⏳ Waiting for slot to pass...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Fulfill steal
      const [attackerOwnershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
      
      let fulfillTx: string;
      try {
        fulfillTx = await program.methods
          .stealPropertyFulfill()
          .accountsPartial({
            property: propertyPDA,
            targetOwnership: targetOwnershipPDA,
            attackerOwnership: attackerOwnershipPDA,
            stealRequest: stealRequestPDA,
            attackerAccount: playerPDA,
            targetAccount: getPlayerPDA(targetPlayerPubkey)[0],
            gameConfig: GAME_CONFIG,
            slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
            payer: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ skipPreflight: true });
        
        console.log('✅ Random steal fulfilled:', fulfillTx);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Fetch the result to check success
        try {
          const stealRequest = await (program.account as any).stealRequest.fetch(stealRequestPDA);
          
          if (stealRequest.success) {
            console.log('✅ Random steal successful! VRF:', stealRequest.vrfResult.toString());
          } else {
            console.log('❌ Random steal failed. VRF:', stealRequest.vrfResult.toString());
          }
          
          return {
            requestTx,
            fulfillTx,
            success: stealRequest.success,
            vrfResult: stealRequest.vrfResult.toString(),
          };
        } catch (fetchError) {
          console.warn('⚠️ Could not fetch steal result, checking logs instead...');
          
          // Fallback: check transaction logs
          const txDetails = await provider.connection.getTransaction(fulfillTx, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          });
          
          if (txDetails?.meta?.logMessages) {
            console.log('Transaction logs:', txDetails.meta.logMessages);
          }
          
          const logs = txDetails?.meta?.logMessages || [];
          const success = logs.some(log => log.includes('STEAL SUCCESS'));
          
          return {
            requestTx,
            fulfillTx,
            success,
            vrfResult: 'Check transaction logs',
          };
        }
      } catch (fulfillError) {
        const errorMessage = String(fulfillError instanceof Error ? fulfillError.message : fulfillError);
        console.error('Failed to fulfill random steal:', errorMessage);
        
        if (errorMessage.includes('already been processed') || errorMessage.includes('AlreadyProcessed')) {
          console.log('✅ Transaction already processed (success)');
          return 'already-processed';
        }
        
        throw fulfillError;
      }
    } catch (error) {
      console.error('Error in random steal:', error);
      throw error;
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [program, wallet, provider, connection, eventParser, playerInitialized, setLoading]);

  return {
    stealPropertyTargeted,
    stealPropertyRandom,
    // Legacy alias
    stealProperty: stealPropertyTargeted
  };
};