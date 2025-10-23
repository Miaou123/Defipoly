// ============================================
// FIXED useStealActions.ts
// Manually stores steal actions since events aren't being parsed
// ============================================

import { useCallback } from 'react';
import { PublicKey, SystemProgram, SYSVAR_SLOT_HASHES_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { EventParser } from '@coral-xyz/anchor';
import { 
  getPropertyPDA,
  getPlayerPDA,
  getOwnershipPDA,
  getStealCooldownPDA,
  fetchOwnershipData,
  fetchPropertyData,
} from '@/utils/program';
import { GAME_CONFIG, REWARD_POOL, TOKEN_MINT } from '@/utils/constants';
import { fetchPropertyOwners } from '@/utils/propertyOwners';
import { storeTransactionEvents } from '@/utils/eventStorage';
import { storeAction } from '@/utils/actionsStorage'; // ← ADD THIS IMPORT

interface StealResult {
  tx: string;
  success: boolean;
  vrfResult: string;
}

export const useStealActions = (
  program: Program | null,
  wallet: any,
  provider: AnchorProvider | null,
  connection: Connection,
  eventParser: EventParser | null,
  playerInitialized: boolean,
  setLoading: (loading: boolean) => void
) => {

  const stealPropertyInstant = useCallback(async (
    propertyId: number,
    targetPlayerPubkey?: PublicKey
  ): Promise<StealResult | null> => {
    if (!program || !wallet || !provider) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');

    setLoading(true);
    try {
      // [... keep all the existing code until the transaction is sent ...]
      
      // Find eligible targets
      let selectedTarget: PublicKey;
      
      if (targetPlayerPubkey) {
        selectedTarget = targetPlayerPubkey;
      } else {
        const owners = await fetchPropertyOwners(connection, program, propertyId);
        const eligibleTargets = owners.filter(
          owner => !owner.owner.equals(wallet.publicKey) && owner.unshieldedSlots > 0
        );
        
        if (eligibleTargets.length === 0) {
          throw new Error('No eligible targets found for random steal');
        }
        
        const randomIndex = Math.floor(Math.random() * eligibleTargets.length);
        selectedTarget = eligibleTargets[randomIndex].owner;
      }

      console.log(`🎯 Selected target:`, selectedTarget.toString());

      const targetOwnership = await fetchOwnershipData(program, selectedTarget, propertyId);
      if (!targetOwnership || targetOwnership.slotsOwned === 0) {
        throw new Error(`Target does not own property ${propertyId}`);
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const shieldExpiryTime = typeof targetOwnership.shieldExpiry === 'number' 
        ? targetOwnership.shieldExpiry 
        : targetOwnership.shieldExpiry.toNumber();
      const shieldActive = currentTime < shieldExpiryTime;
      const effectiveShieldedSlots = shieldActive ? targetOwnership.slotsShielded : 0;
      const unshieldedSlots = targetOwnership.slotsOwned - effectiveShieldedSlots;
      
      if (unshieldedSlots <= 0) {
        throw new Error(`Target's slots in property ${propertyId} are all shielded`);
      }
      
      console.log(`✅ Target confirmed with ${unshieldedSlots} unshielded slots`);

      const playerTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
      const devWallet = new PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");
      const devTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, devWallet);
      
      const [propertyPDA] = getPropertyPDA(propertyId);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [attackerOwnershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
      const [targetOwnershipPDA] = getOwnershipPDA(selectedTarget, propertyId);
      const [targetPlayerPDA] = getPlayerPDA(selectedTarget);
      
      const property = await fetchPropertyData(program, propertyId);
      if (!property) {
        throw new Error(`Property ${propertyId} not found`);
      }
      const [stealCooldownPDA] = getStealCooldownPDA(wallet.publicKey, propertyId);

      const userRandomness = new Uint8Array(32);
      crypto.getRandomValues(userRandomness);
      
      console.log('🎲 Executing instant steal with on-chain randomness...');

      const tx = await program.methods
        .stealPropertyInstant(
          selectedTarget,
          Array.from(userRandomness)
        )
        .accountsPartial({
          property: propertyPDA,
          targetOwnership: targetOwnershipPDA,
          attackerOwnership: attackerOwnershipPDA,
          stealCooldown: stealCooldownPDA,
          playerAccount: playerPDA,
          targetAccount: targetPlayerPDA,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          devTokenAccount,
          gameConfig: GAME_CONFIG,
          slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
          attacker: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ skipPreflight: false });
      
      console.log('✅ Instant steal executed:', tx);

      // Try to store events (may or may not work)
      if (eventParser) {
        try {
          await storeTransactionEvents(connection, eventParser, tx);
        } catch (eventError) {
          console.warn('⚠️ Event storage failed (expected), falling back to manual storage');
        }
      }

      // Wait and check result from transaction logs
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const txDetails = await provider.connection.getTransaction(tx, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });
      
      if (!txDetails?.meta?.logMessages) {
        console.warn('⚠️ Could not fetch transaction logs');
        return {
          tx,
          success: false,
          vrfResult: 'unknown',
        };
      }

      const logs = txDetails.meta.logMessages;
      const successLog = logs.find(log => log.includes('✅ INSTANT STEAL SUCCESS'));
      const failLog = logs.find(log => log.includes('❌ INSTANT STEAL FAILED'));
      
      let success = false;
      let vrfResult = 'unknown';

      if (successLog) {
        success = true;
        const match = successLog.match(/entropy: (\d+)/);
        if (match) {
          vrfResult = match[1];
        }
        console.log('✅ Instant steal successful! VRF:', vrfResult);
      } else if (failLog) {
        success = false;
        const match = failLog.match(/entropy: (\d+)/);
        if (match) {
          vrfResult = match[1];
        }
        console.log('❌ Instant steal failed. VRF:', vrfResult);
      }

      // 🔥 MANUAL STORAGE: Store the steal action directly
      const blockTime = txDetails.blockTime || Math.floor(Date.now() / 1000);
      const stealCost = Number(property.price) * 0.5; // 50% of property price
      
      console.log('💾 Manually storing steal action to backend...');
      
      try {
        const stored = await storeAction({
          txSignature: tx,
          actionType: success ? 'steal_success' : 'steal_failed',
          playerAddress: wallet.publicKey.toString(),
          targetAddress: selectedTarget.toString(),
          propertyId,
          amount: stealCost,
          slots: success ? 1 : 0,
          success,
          blockTime,
          metadata: {
            vrfResult,
            targeted: !!targetPlayerPubkey
          }
        });
        
        if (stored) {
          console.log('✅ Successfully stored steal action to backend');
        } else {
          console.error('❌ Failed to store steal action');
        }
      } catch (storeError) {
        console.error('❌ Error storing steal action:', storeError);
      }

      return {
        tx,
        success,
        vrfResult,
      };

    } catch (error: any) {
      console.error('Error in instant steal:', error);
      
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        console.log('⏳ Transaction already processed - fetching result...');
        
        try {
          const txSig = error.signature || error.txid;
          if (!txSig) {
            throw new Error('No transaction signature available');
          }
    
          let txDetails = null;
          const maxRetries = 5;
          for (let i = 0; i < maxRetries; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            
            txDetails = await provider.connection.getTransaction(txSig, {
              commitment: 'confirmed',
              maxSupportedTransactionVersion: 0,
            });
            
            if (txDetails?.meta?.logMessages) {
              console.log(`✅ Transaction fetched on attempt ${i + 1}`);
              break;
            }
            
            console.log(`⏳ Retry ${i + 1}/${maxRetries} - transaction not found yet...`);
          }
          
          if (txDetails?.meta?.logMessages) {
            const logs = txDetails.meta.logMessages;
            const successLog = logs.find(log => log.includes('✅ INSTANT STEAL SUCCESS'));
            const failLog = logs.find(log => log.includes('❌ INSTANT STEAL FAILED'));
            
            let success = false;
            let vrfResult = 'unknown';
    
            if (successLog) {
              success = true;
              const match = successLog.match(/entropy: (\d+)/);
              if (match) vrfResult = match[1];
            } else if (failLog) {
              success = false;
              const match = failLog.match(/entropy: (\d+)/);
              if (match) vrfResult = match[1];
            }
    
            // Manual storage for retry case too
            try {
              const blockTime = txDetails.blockTime || Math.floor(Date.now() / 1000);
              const property = await fetchPropertyData(program, propertyId);
              const stealCost = property ? Number(property.price) * 0.5 : 0;
              
              await storeAction({
                txSignature: txSig,
                actionType: success ? 'steal_success' : 'steal_failed',
                playerAddress: wallet.publicKey.toString(),
                targetAddress: 'unknown', // We don't have it in retry case
                propertyId,
                amount: stealCost,
                slots: success ? 1 : 0,
                success,
                blockTime,
                metadata: { vrfResult }
              });
              
              console.log('✅ Stored retry steal action');
            } catch (storeError) {
              console.error('⚠️ Failed to store retry action:', storeError);
            }
    
            return {
              tx: txSig,
              success,
              vrfResult,
            };
          }
        } catch (fetchError) {
          console.error('Failed to fetch transaction after retries:', fetchError);
        }
        
        return {
          tx: 'already-processed',
          success: false,
          vrfResult: 'unknown',
        };
      }
      
      throw error;
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [program, wallet, provider, connection, eventParser, playerInitialized, setLoading]);


  return {
    stealPropertyInstant,
  };
};