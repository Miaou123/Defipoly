// ============================================
// MIGRATED useStealActions.ts
// Now uses backend API for eligible targets instead of RPC calls
// FIXES: Properly filters by steal_protection_expiry from database
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
} from '@/utils/program';
import { 
  GAME_CONFIG, 
  REWARD_POOL, 
  TOKEN_MINT,
  DEV_WALLET,
  MARKETING_WALLET 
} from '@/utils/constants';
// ✅ NEW: Import API service
import { fetchOwnershipData } from '@/services/api';
import { API_BASE_URL } from '@/utils/config';

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

      // ✅ NEW: Fetch ALL ownerships for this property from backend API
      // This gets us ALL owners with their steal_protection_expiry data!
      
      const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/owners`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch ownership data from backend');
      }
      
      const data = await response.json();
      const allOwnerships = data.owners || [];
      
      // Filter for this specific property
      const propertyOwners = allOwnerships.filter((o: any) => o.property_id === propertyId);
      

      // ✅ NEW: Filter for eligible targets using backend data
      const currentTime = Math.floor(Date.now() / 1000);
      const eligibleTargets = [];

      for (const ownership of propertyOwners) {
        // Skip self
        if (ownership.wallet_address === wallet.publicKey.toString()) {
          continue;
        }

        // Calculate unshielded slots
        const shieldActive = currentTime < ownership.shield_expiry;
        const shieldedSlots = shieldActive ? ownership.slots_shielded : 0;
        const unshieldedSlots = ownership.slots_owned - shieldedSlots;

        // Skip if no unshielded slots
        if (unshieldedSlots <= 0) {
          continue;
        }

        // ✅ CRITICAL FIX: Check steal_protection_expiry from backend!
        if (currentTime < ownership.steal_protection_expiry) {
          continue;
        }

        // This target is eligible!
        eligibleTargets.push(new PublicKey(ownership.wallet_address));
      }

      if (eligibleTargets.length === 0) {
        throw new Error('No eligible targets found. All owners are either shielded or have steal protection active.');
      }


      // Prepare remaining_accounts (just player accounts in v0.9)
      const remainingAccounts = [];
      for (const targetPubkey of eligibleTargets) {
        const [targetPlayerPDA] = getPlayerPDA(targetPubkey);
        
        remainingAccounts.push({
          pubkey: targetPlayerPDA,
          isWritable: true,
          isSigner: false,
        });
      }


      // Get token accounts
      const playerTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
      const devTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, DEV_WALLET);
      const marketingTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, MARKETING_WALLET);
      
      const [propertyPDA] = getPropertyPDA(propertyId);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);

      // Generate user randomness
      const userRandomness = new Uint8Array(32);
      crypto.getRandomValues(userRandomness);
      

      const methods = program?.methods;
      if (!methods) {
        throw new Error('Program not initialized');
      }
      const tx = await methods
        ['stealPropertyInstant']!(
          Array.from(userRandomness)
        )
        .accountsPartial({
          property: propertyPDA,
          playerAccount: playerPDA,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          devTokenAccount,
          marketingTokenAccount,
          attacker: wallet.publicKey,
          gameConfig: GAME_CONFIG,
          slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts)
        .rpc();


      // Parse events to get result
      let stealResult: StealResult = {
        tx,
        success: false,
        vrfResult: '0',
      };

      if (eventParser) {
        const txDetails = await connection.getTransaction(tx, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });

        if (txDetails?.meta?.logMessages) {
          const events = eventParser.parseLogs(txDetails.meta.logMessages);
          
          for (const event of events) {
            if (event.name === 'StealSuccessEvent') {
              const eventData = event.data as any;
              stealResult = {
                tx,
                success: true,
                vrfResult: eventData.vrfResult?.toString() || '0',
                targetAddress: eventData.target?.toString(),
              };
            } else if (event.name === 'StealFailedEvent') {
              const eventData = event.data as any;
              stealResult = {
                tx,
                success: false,
                vrfResult: eventData.vrfResult?.toString() || '0',
                targetAddress: eventData.target?.toString(),
              };
            }
          }
        }
      }

      return stealResult;
      
    } catch (error: any) {
      console.error('❌ Error in stealPropertyInstant:', error);
      
      const errorMessage = error?.message || error?.toString() || '';
      
      // Better error messages
      if (errorMessage.includes('NoEligibleTargets')) {
        throw new Error('No eligible targets found. All slots are either shielded or have steal protection active.');
      }
      
      if (errorMessage.includes('StealProtectionActive')) {
        throw new Error('Target has active steal protection (6h cooldown after being targeted).');
      }
      
      if (errorMessage.includes('StealCooldownActive')) {
        throw new Error('You are on steal cooldown. Wait before attempting another steal.');
      }
      
      if (errorMessage.includes('AllSlotsShielded')) {
        throw new Error('Target has all slots shielded. Cannot steal from this property.');
      }
      
      if (errorMessage.includes('already been processed') || 
          errorMessage.includes('AlreadyProcessed')) {
        return {
          tx: 'already-processed',
          success: true,
          vrfResult: 'processed',
        };
      }
      
      throw error;
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [program, wallet, provider, connection, eventParser, playerInitialized, setLoading]);

  return {
    stealPropertyInstant
  };
};