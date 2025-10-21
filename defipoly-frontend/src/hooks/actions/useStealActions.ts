import { useCallback } from 'react';
import { PublicKey, SystemProgram, SYSVAR_SLOT_HASHES_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { EventParser } from '@coral-xyz/anchor';
import { getPropertyPDA, getPlayerPDA, getOwnershipPDA } from '@/utils/program';
import { GAME_CONFIG, REWARD_POOL, TOKEN_MINT } from '@/utils/constants';
import { storeTransactionEvents } from '@/utils/eventStorage';

// Helper function to get steal request PDA
function getStealRequestPDA(attacker: PublicKey, propertyId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('steal_request'),
      attacker.toBuffer(),
      Buffer.from([propertyId]),
    ],
    new PublicKey('HpacCgxUuzwoMeryvQtC94RxFmpxC6dYPX5E17JBzBmQ') // Your program ID
  );
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
  const stealPropertyRandom = useCallback(async (propertyId: number) => {
    if (!program || !wallet || !provider) {
      throw new Error('Wallet or program not connected');
    }

    if (!playerInitialized) {
      throw new Error('Please initialize your player account first');
    }

    setLoading(true);
    
    try {
      // Step 1: Find all players who own this property
      console.log(`🔍 Finding players who own property ${propertyId}...`);
      
      const [propertyPDATemp] = getPropertyPDA(propertyId);
      const propertyAccount = await (program.account as any).property.fetch(propertyPDATemp);
      
      const allOwners: PublicKey[] = [];
      
      // Fetch all ownership accounts for this property
      const allAccounts = await connection.getProgramAccounts(program.programId, {
        filters: [
          { dataSize: 8 + 32 + 1 + 2 + 2 + 8 + 8 + 1 }, // Ownership account size
          {
            memcmp: {
              offset: 8 + 32, // Skip discriminator + player pubkey
              bytes: propertyPDATemp.toBase58(),
            },
          },
        ],
      });

      for (const account of allAccounts) {
        try {
          const ownership = await (program.account as any).propertyOwnership.fetch(account.pubkey);
          if (ownership.slotsOwned > 0 && !ownership.player.equals(wallet.publicKey)) {
            allOwners.push(ownership.player);
          }
        } catch (e) {
          console.warn('Could not fetch ownership account:', e);
        }
      }

      if (allOwners.length === 0) {
        throw new Error('No players own unshielded slots in this property');
      }

      console.log(`✅ Found ${allOwners.length} potential target(s)`);

      // Step 2: Filter out players whose slots are all shielded
      const eligibleTargets: PublicKey[] = [];
      const currentTimestamp = Math.floor(Date.now() / 1000);

      for (const targetPlayer of allOwners) {
        try {
          const [targetOwnershipPDATemp] = getOwnershipPDA(targetPlayer, propertyId);
          const targetOwnership = await (program.account as any).propertyOwnership.fetch(targetOwnershipPDATemp);
          
          const effectiveShieldedSlots = currentTimestamp < targetOwnership.shieldExpiry 
            ? targetOwnership.slotsShielded : 0;
          const unshieldedSlots = targetOwnership.slotsOwned - effectiveShieldedSlots;
          
          if (unshieldedSlots > 0) {
            eligibleTargets.push(targetPlayer);
          }
        } catch (e) {
          console.warn('Could not check target shields:', e);
        }
      }

      if (eligibleTargets.length === 0) {
        throw new Error('No eligible targets found - all slots are shielded');
      }

      // Step 3: Randomly select a target
      const randomIndex = Math.floor(Math.random() * eligibleTargets.length);
      const targetPlayerPubkey = eligibleTargets[randomIndex];
      
      console.log(`🎯 Randomly selected target: ${targetPlayerPubkey.toBase58()}`);

      // Verify target still has unshielded slots
      try {
        const [targetOwnershipPDAVerify] = getOwnershipPDA(targetPlayerPubkey, propertyId);
        const targetOwnership = await (program.account as any).propertyOwnership.fetch(targetOwnershipPDAVerify);
        
        const effectiveShieldedSlots = currentTimestamp < targetOwnership.shieldExpiry 
          ? targetOwnership.slotsShielded : 0;
        const unshieldedSlots = targetOwnership.slotsOwned - effectiveShieldedSlots;
        
        if (unshieldedSlots <= 0) {
          throw new Error(`Selected random target's slots in property ${propertyId} are all shielded`);
        }
        
        console.log(`✅ Random target confirmed with ${unshieldedSlots} unshielded slots`);
      } catch (fetchError) {
        throw new Error(`Selected random target no longer owns property ${propertyId} or account is invalid`);
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
      
      console.log('🎲 Initiating random steal with randomness...');
      
      let requestTx: string = '';
      try {
        // Step 1: Request steal WITHOUT is_targeted parameter
        requestTx = await program.methods
          .stealPropertyRequest(
            targetPlayerPubkey,
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
        
        // Store transaction events
        if (eventParser) {
          await storeTransactionEvents(
            connection,
            eventParser,
            requestTx
          );
        }
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
      const [targetPlayerPDA] = getPlayerPDA(targetPlayerPubkey);
      
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
            targetAccount: targetPlayerPDA,
            gameConfig: GAME_CONFIG,
            slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
            payer: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ skipPreflight: true });
        
        console.log('✅ Random steal fulfilled:', fulfillTx);
        
        // Store transaction events
        if (eventParser) {
          await storeTransactionEvents(
            connection,
            eventParser,
            fulfillTx
          );
        }
        
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
          const success = logs.some((log: string) => log.includes('RANDOM STEAL SUCCESS'));
          
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
    stealPropertyRandom
  };
};