// ============================================
// FILE: defipoly-frontend/src/hooks/actions/useStealActions.ts
// Updated for new single-transaction steal system
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

  /**
   * New single-transaction steal system
   * Replaces the old 2-step request/fulfill approach
   */
  const stealPropertyInstant = useCallback(async (
    propertyId: number,
    targetPlayerPubkey?: PublicKey
  ): Promise<StealResult> => {
    if (!program || !wallet || !provider || !playerInitialized) {
      throw new Error('Wallet not connected or player not initialized');
    }

    setLoading(true);

    try {
      // Step 1: Select a target if not provided
      let selectedTarget: PublicKey;
      
      if (targetPlayerPubkey) {
        // Targeted steal
        selectedTarget = targetPlayerPubkey;
        console.log('🎯 Targeted steal at:', selectedTarget.toString());
      } else {
        // Random steal - fetch all eligible owners
        console.log('🎲 Random steal - selecting target...');
        const owners = await fetchPropertyOwners(connection, program, propertyId);
        
        if (owners.length === 0) {
          throw new Error('No eligible targets found for this property');
        }

        // Filter out the current player
        const eligibleOwners = owners.filter(
          owner => !owner.owner.equals(wallet.publicKey) && owner.unshieldedSlots > 0
        );

        if (eligibleOwners.length === 0) {
          throw new Error('No eligible targets with unshielded slots');
        }

        // Select random target
        const randomIndex = Math.floor(Math.random() * eligibleOwners.length);
        selectedTarget = eligibleOwners[randomIndex].owner;
        console.log(`✅ Selected random target: ${selectedTarget.toString()}`);
      }

      // Step 2: Verify target still owns unshielded slots
      const targetOwnership = await fetchOwnershipData(program, selectedTarget, propertyId);
      
      if (!targetOwnership || targetOwnership.slotsOwned === 0) {
        throw new Error(`Target does not own property ${propertyId}`);
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      // Convert BN to number for comparison
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

      // Step 3: Get all required accounts
      const playerTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
      const devWallet = new PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");
      const devTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, devWallet);
      
      const [propertyPDA] = getPropertyPDA(propertyId);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [attackerOwnershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
      const [targetOwnershipPDA] = getOwnershipPDA(selectedTarget, propertyId);
      const [targetPlayerPDA] = getPlayerPDA(selectedTarget);
      
      // Get property info for set_id
      const property = await fetchPropertyData(program, propertyId);
      if (!property) {
        throw new Error(`Property ${propertyId} not found`);
      }
      const [stealCooldownPDA] = getStealCooldownPDA(wallet.publicKey, property.setId);

      // Step 4: Generate user randomness for VRF
      const userRandomness = new Uint8Array(32);
      crypto.getRandomValues(userRandomness);
      
      console.log('🎲 Executing instant steal with on-chain randomness...');

      // Step 5: Execute single-transaction steal
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

      // Step 6: Store transaction events
      if (eventParser) {
        await storeTransactionEvents(connection, eventParser, tx);
      }

      // Step 7: Wait and check result from transaction logs
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
      console.log('Transaction logs:', logs);

      // Check for success/failure in logs
      const successLog = logs.find(log => log.includes('✅ INSTANT STEAL SUCCESS'));
      const failLog = logs.find(log => log.includes('❌ INSTANT STEAL FAILED'));
      
      let success = false;
      let vrfResult = 'unknown';

      if (successLog) {
        success = true;
        // Extract VRF result from log if present
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

      return {
        tx,
        success,
        vrfResult,
      };

    } catch (error) {
      console.error('Error in instant steal:', error);
      throw error;
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [program, wallet, provider, connection, eventParser, playerInitialized, setLoading]);


  return {
    stealPropertyInstant,
  };
};