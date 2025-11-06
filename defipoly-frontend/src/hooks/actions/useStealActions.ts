// ============================================
// UPDATED useStealActions.ts
// Now supports truly random on-chain target selection
// Passes all eligible targets as remaining_accounts
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

interface StealResult {
  tx: string;
  success: boolean;
  vrfResult: string;
  targetAddress?: string;
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
    propertyId: number
  ): Promise<StealResult | null> => {
    if (!program || !wallet || !provider) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');

    setLoading(true);
    try {
      console.log(`🎲 Initiating random steal for property ${propertyId}...`);

      // Fetch all owners of this property
      const owners = await fetchPropertyOwners(connection, program, propertyId);
      console.log(`📊 Found ${owners.length} total owners`);

      // Filter for eligible targets
      const currentTime = Math.floor(Date.now() / 1000);
      const eligibleTargets = [];

      for (const owner of owners) {
        // Skip self
        if (owner.owner.equals(wallet.publicKey)) {
          continue;
        }

        // Skip if no unshielded slots
        if (owner.unshieldedSlots <= 0) {
          continue;
        }

        // Check for steal protection (new)
        const ownershipData = await fetchOwnershipData(program, owner.owner, propertyId);
        if (ownershipData) {
          const stealProtectionExpiry = typeof ownershipData.stealProtectionExpiry === 'number'
            ? ownershipData.stealProtectionExpiry
            : ownershipData.stealProtectionExpiry?.toNumber() || 0;

          // Skip if steal protection is active
          if (currentTime < stealProtectionExpiry) {
            console.log(`⏭️  Skipping ${owner.owner.toString().slice(0, 8)}... (steal protection active)`);
            continue;
          }
        }

        eligibleTargets.push(owner.owner);
      }

      if (eligibleTargets.length === 0) {
        throw new Error('No eligible targets found. All owners are either shielded or have steal protection active.');
      }

      console.log(`✅ Found ${eligibleTargets.length} eligible targets (unshielded + no steal protection)`);

      // Prepare remaining_accounts (pairs of ownership + player account)
      const remainingAccounts = [];
      for (const targetPubkey of eligibleTargets) {
        const [targetOwnershipPDA] = getOwnershipPDA(targetPubkey, propertyId);
        const [targetPlayerPDA] = getPlayerPDA(targetPubkey);
        
        remainingAccounts.push({
          pubkey: targetOwnershipPDA,
          isWritable: true,
          isSigner: false,
        });
        remainingAccounts.push({
          pubkey: targetPlayerPDA,
          isWritable: true,
          isSigner: false,
        });
      }

      console.log(`📦 Prepared ${remainingAccounts.length / 2} target pairs for remaining_accounts`);

      // Prepare transaction accounts
      const playerTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
      const devWallet = new PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");
      const devTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, devWallet);
      
      const [propertyPDA] = getPropertyPDA(propertyId);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [attackerOwnershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
      const [stealCooldownPDA] = getStealCooldownPDA(wallet.publicKey, propertyId);

      // Generate user randomness
      const userRandomness = new Uint8Array(32);
      crypto.getRandomValues(userRandomness);
      
      console.log('🎲 Executing truly random steal (target selected on-chain)...');

      // Execute steal transaction
      const tx = await program.methods
        .stealPropertyInstant(
          Array.from(userRandomness)
        )
        .accountsPartial({
          property: propertyPDA,
          attackerOwnership: attackerOwnershipPDA,
          stealCooldown: stealCooldownPDA,
          playerAccount: playerPDA,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          devTokenAccount,
          gameConfig: GAME_CONFIG,
          slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
          attacker: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts)
        .rpc({ skipPreflight: false });

      console.log('✅ Transaction sent:', tx);

      // Wait for confirmation
      await provider.connection.confirmTransaction(tx, 'confirmed');

      // Parse logs to determine success
      const txDetails = await provider.connection.getTransaction(tx, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      let success = false;
      let vrfResult = 'unknown';
      let targetAddress = undefined;

      if (txDetails?.meta?.logMessages) {
        const logs = txDetails.meta.logMessages;
        
        const successLog = logs.find(log => log.includes('✅ INSTANT STEAL SUCCESS'));
        const failLog = logs.find(log => log.includes('❌ INSTANT STEAL FAILED'));
        
        if (successLog) {
          success = true;
          // Parse: "✅ INSTANT STEAL SUCCESS: {attacker} stole 1 slot from {target} (target_selection: {num}, success_roll: {num})"
          const targetMatch = successLog.match(/from ([A-Za-z0-9]{32,44})/);
          const vrfMatch = successLog.match(/target_selection: (\d+)/);
          
          if (targetMatch) targetAddress = targetMatch[1];
          if (vrfMatch) vrfResult = vrfMatch[1];
          
          console.log('✅ Steal succeeded! Target:', targetAddress, 'VRF:', vrfResult);
        } else if (failLog) {
          success = false;
          // Parse: "❌ INSTANT STEAL FAILED: {attacker} targeted {target} (target_selection: {num}, success_roll: {num})"
          const targetMatch = failLog.match(/targeted ([A-Za-z0-9]{32,44})/);
          const vrfMatch = failLog.match(/target_selection: (\d+)/);
          
          if (targetMatch) targetAddress = targetMatch[1];
          if (vrfMatch) vrfResult = vrfMatch[1];
          
          console.log('❌ Steal failed. Target:', targetAddress, 'VRF:', vrfResult);
        }
      }

      // Webhook handles storage automatically

      return {
        tx,
        success,
        vrfResult,
        targetAddress,
      };
      
    } catch (error: any) {
      console.error('❌ Error in steal operation:', error);
      
      const errorMessage = error?.message || error?.toString() || '';
      
      // Handle specific errors
      if (errorMessage.includes('NoEligibleTargets')) {
        throw new Error('No eligible targets found. All slots are either shielded or have steal protection active.');
      }
      
      if (errorMessage.includes('StealProtectionActive')) {
        throw new Error('Target has active steal protection (6h cooldown after being targeted).');
      }
      
      if (errorMessage.includes('StealCooldownActive')) {
        throw new Error('You are on steal cooldown. Wait before attempting another steal.');
      }

      // Handle "already processed" case
      if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        console.log('✅ Transaction already processed, fetching result...');
        
        const txSigMatch = errorMessage.match(/[1-9A-HJ-NP-Za-km-z]{87,88}/);
        
        if (txSigMatch) {
          const txSig = txSigMatch[0];
          console.log('🔍 Found transaction signature:', txSig);
          
          // Retry fetching transaction
          for (let i = 0; i < 3; i++) {
            try {
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
              
              const txDetails = await provider.connection.getTransaction(txSig, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0,
              });
              
              if (txDetails?.meta?.logMessages) {
                const logs = txDetails.meta.logMessages;
                const successLog = logs.find(log => log.includes('✅ INSTANT STEAL SUCCESS'));
                const failLog = logs.find(log => log.includes('❌ INSTANT STEAL FAILED'));
                
                let success = false;
                let vrfResult = 'unknown';
                let targetAddress = undefined;

                if (successLog) {
                  success = true;
                  const match = successLog.match(/target_selection: (\d+)/);
                  if (match) vrfResult = match[1];
                  const targetMatch = successLog.match(/from ([A-Za-z0-9]{32,44})/);
                  if (targetMatch) targetAddress = targetMatch[1];
                } else if (failLog) {
                  success = false;
                  const match = failLog.match(/target_selection: (\d+)/);
                  if (match) vrfResult = match[1];
                  const targetMatch = failLog.match(/targeted ([A-Za-z0-9]{32,44})/);
                  if (targetMatch) targetAddress = targetMatch[1];
                }
                
                return {
                  tx: txSig,
                  success,
                  vrfResult,
                  targetAddress,
                };
              }
            } catch (fetchError) {
              console.error('Failed to fetch transaction:', fetchError);
            }
          }
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