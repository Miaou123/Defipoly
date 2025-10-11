// ============================================
// FILE: defipoly-frontend/src/hooks/useDefipoly.ts
// ENHANCED: Now stores all actions to backend automatically
// FULLY FIXED: All imports match your actual codebase
// ============================================

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

// Constants (only the actual exports from constants.ts)
import { PROGRAM_ID, GAME_CONFIG, REWARD_POOL, TOKEN_MINT } from '@/utils/constants';

// Program utilities (PDA functions, fetch functions, getProgram)
import { 
  getProgram,
  getPropertyPDA,
  getPlayerPDA,
  getOwnershipPDA,
  getSetCooldownPDA,      // ✅ Already have this
  getSetOwnershipPDA,     // ✅ Already have this
  getSetStatsPDA,         // ✅ Already have this
  getStealRequestPDA,     // ✅ ADD THIS LINE
  fetchPropertyData,
  fetchOwnershipData,
  fetchPlayerData,
  checkPlayerExists,
  type MemeopolyProgram,  // ✅ ADD THIS TYPE
} from '@/utils/program';

// Token utilities
import { 
  getOrCreateTokenAccount, 
  checkTokenAccountExists,
  createTokenAccountInstruction
} from '@/utils/token';

// 🆕 NEW: Import backend storage utilities
import { storeAction, eventToAction } from '@/utils/actionsStorage';
import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import idl from '@/types/memeopoly_program.json';

export function useDefipoly() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [playerInitialized, setPlayerInitialized] = useState(false);
  const [tokenAccountExists, setTokenAccountExists] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🆕 NEW: Initialize event parser for storing actions
  const eventParser = useMemo(() => {
    if (!wallet) return null;
    const coder = new BorshCoder(idl as any);
    return new EventParser(PROGRAM_ID, coder);
  }, [wallet]);

  const provider = useMemo(() => {
    if (!wallet) return null;
    return new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return getProgram(provider);
  }, [provider]);

  // 🆕 NEW: Helper to store transaction events to backend
  const storeTransactionEvents = useCallback(async (signature: string) => {
    if (!eventParser) return;
    
    try {
      // Wait a bit for transaction to be finalized
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fetch transaction with logs
      const tx = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      if (!tx || !tx.meta?.logMessages) {
        console.warn('⚠️ No transaction logs found for', signature);
        return;
      }

      // Parse events from logs
      const events = eventParser.parseLogs(tx.meta.logMessages);
      const blockTime = tx.blockTime || Math.floor(Date.now() / 1000);

      // Store each event to backend
      for (const event of events) {
        const action = eventToAction(event, signature, blockTime);
        if (action) {
          await storeAction(action);
          console.log('✅ Stored action to backend:', action.actionType);
        }
      }
    } catch (error) {
      console.error('Error storing transaction events:', error);
      // Don't throw - we don't want to break the UI if backend is down
    }
  }, [connection, eventParser]);

  // Check initialization status
  useEffect(() => {
    if (!wallet) {
      setTokenBalance(0);
      setPlayerInitialized(false);
      setTokenAccountExists(false);
      return;
    }

    const checkInitialization = async () => {
      try {
        // Check token account
        const hasTokenAccount = await checkTokenAccountExists(connection, wallet.publicKey);
        setTokenAccountExists(hasTokenAccount);

        // Fetch token balance if account exists
        if (hasTokenAccount) {
          try {
            const tokenAccount = await getAssociatedTokenAddress(
              TOKEN_MINT,
              wallet.publicKey
            );
            const balance = await connection.getTokenAccountBalance(tokenAccount);
            setTokenBalance(Number(balance.value.amount) / 1e9);
          } catch (error) {
            console.error('Error fetching balance:', error);
            setTokenBalance(0);
          }
        }

        // Check if player is initialized
        if (program) {
          const playerData = await fetchPlayerData(program, wallet.publicKey);
          setPlayerInitialized(playerData !== null);
        }
      } catch (error) {
        console.error('Error checking initialization:', error);
      }
    };

    checkInitialization();
    const interval = setInterval(checkInitialization, 10000);
    return () => clearInterval(interval);
  }, [wallet, connection, program]);

  const createTokenAccount = useCallback(async () => {
    if (!wallet || !provider) throw new Error('Wallet not connected');

    setLoading(true);
    try {
      const instruction = await createTokenAccountInstruction(wallet.publicKey);
      const transaction = new Transaction().add(instruction);
      
      const signature = await provider.sendAndConfirm(transaction);
      console.log('Token account created:', signature);
      
      setTokenAccountExists(true);
      return signature;
    } catch (error) {
      console.error('Error creating token account:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [wallet, provider]);

  const initializePlayer = useCallback(async () => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    if (!tokenAccountExists) throw new Error('Create token account first');

    setLoading(true);
    try {
      const [playerPDA] = getPlayerPDA(wallet.publicKey);

      const tx = await program.methods
        .initializePlayer()
        .accountsPartial({
          player: wallet.publicKey,
          playerAccount: playerPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Player initialized:', tx);
      setPlayerInitialized(true);
      return { playerAccount: playerPDA, tx };
    } catch (error) {
      console.error('Error initializing player:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, tokenAccountExists]);

  const buyProperty = useCallback(async (propertyId: number) => {
    if (!program || !wallet || !provider) throw new Error('Wallet not connected');
    
    setLoading(true);
    try {
      const transaction = new Transaction();
  
      // Check token account exists
      const hasTokenAccount = await checkTokenAccountExists(connection, wallet.publicKey);
      
      // Add create token account instruction if needed
      if (!hasTokenAccount) {
        console.log('Creating token account...');
        const createATAIx = await createTokenAccountInstruction(wallet.publicKey);
        transaction.add(createATAIx);
      }
  
      // Check if player account exists
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const playerData = await fetchPlayerData(program, wallet.publicKey);
      
      // Add initialize player instruction if needed
      if (!playerData) {
        console.log('Initializing player...');
        const initPlayerIx = await program.methods
          .initializePlayer()
          .accountsPartial({
            player: wallet.publicKey,
            playerAccount: playerPDA,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        transaction.add(initPlayerIx);
      }
  
      // Get token account address
      const playerTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        wallet.publicKey
      );
  
      // Get PDAs
      const [propertyPDA] = getPropertyPDA(propertyId);
      const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
      
      // ✅ NEW: Fetch property to get setId
      const propertyData = await (program.account as any).property.fetch(propertyPDA);
      const setId = propertyData.setId;
      
      // ✅ NEW: Get the 3 new required PDAs
      const [setCooldownPDA] = getSetCooldownPDA(wallet.publicKey, setId);
      const [setOwnershipPDA] = getSetOwnershipPDA(wallet.publicKey, setId);
      const [setStatsPDA] = getSetStatsPDA(setId);
      
      // ✅ NEW: Get dev token account
      const devWallet = new PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");
      const devTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, devWallet);
  
      // Add buy property instruction
      const buyPropertyIx = await program.methods
        .buyProperty()
        .accountsPartial({
          property: propertyPDA,
          ownership: ownershipPDA,
          setCooldown: setCooldownPDA,      // ✅ NEW
          setOwnership: setOwnershipPDA,    // ✅ NEW
          setStats: setStatsPDA,            // ✅ NEW
          playerAccount: playerPDA,
          player: wallet.publicKey,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          devTokenAccount: devTokenAccount, // ✅ NEW
          gameConfig: GAME_CONFIG,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      transaction.add(buyPropertyIx);
  
      // Send transaction
      const signature = await provider.sendAndConfirm(transaction);
      console.log('Property bought:', signature);
      
      // 🆕 NEW: Store to backend
      await storeTransactionEvents(signature);
      
      // Update states
      if (!hasTokenAccount) setTokenAccountExists(true);
      if (!playerData) setPlayerInitialized(true);
      
      return signature;
    } catch (error) {
      console.error('Error buying property:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, connection, provider, storeTransactionEvents]);
  
  // ✨ ENHANCED: activateShield now stores to backend
  const activateShield = useCallback(async (propertyId: number, cycles: number) => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');
  
    setLoading(true);
    try {
      const playerTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        wallet.publicKey
      );
  
      // ✅ Get dev token account
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
      
      // ✅ Wrap backend storage in try-catch
      try {
        await storeTransactionEvents(tx);
      } catch (backendError) {
        console.warn('⚠️ Backend storage failed (non-critical):', backendError);
      }
      
      return tx;
    } catch (error: any) {
      console.error('Error activating shield:', error);
      // ✅ Don't re-throw if transaction already processed
      if (error?.message?.includes('already been processed')) {
        console.log('✅ Shield activation was already successful');
        return null;
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, playerInitialized, storeTransactionEvents]);

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
  
      const playerData = await fetchPlayerData(program, wallet.publicKey);
      if (!playerData || playerData.propertiesOwnedCount === 0) {
        throw new Error('No properties to claim rewards from');
      }
  
      const remainingAccounts: any[] = [];
  
      for (let propertyId = 0; propertyId < 22; propertyId++) {
        const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
        try {
          const ownershipData = await fetchOwnershipData(program, wallet.publicKey, propertyId);
          if (ownershipData?.slotsOwned && ownershipData.slotsOwned > 0) {
            const [propertyPDA] = getPropertyPDA(propertyId);
            remainingAccounts.push({
              pubkey: ownershipPDA,
              isWritable: false,
              isSigner: false,
            });
            remainingAccounts.push({
              pubkey: propertyPDA,
              isWritable: false,
              isSigner: false,
            });
          }
        } catch (e) {
          continue;
        }
      }
  
      const actualNumProperties = remainingAccounts.length / 2;
  
      if (actualNumProperties === 0) {
        throw new Error('No properties found to claim rewards from');
      }
  
      const tx = await program.methods
        .claimRewards(actualNumProperties)
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
      
      // ✅ FIXED: Wrap backend storage in try-catch - don't let it fail the claim
      try {
        await storeTransactionEvents(tx);
      } catch (backendError) {
        console.warn('⚠️ Backend storage failed (non-critical):', backendError);
        // Don't throw - claim was successful even if backend storage failed
      }
      
      return tx;
    } catch (error: any) {
      console.error('Error claiming rewards:', error);
      // ✅ FIXED: Don't re-throw if transaction already processed
      if (error?.message?.includes('already been processed')) {
        console.log('✅ Claim was already successful');
        return null; // Return null instead of throwing
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, playerInitialized, storeTransactionEvents]);

  const getPropertyData = useCallback(async (propertyId: number) => {
    if (!program) return null;
    return await fetchPropertyData(program, propertyId);
  }, [program]);

  const getOwnershipData = useCallback(async (propertyId: number) => {
    if (!program || !wallet) {
      console.log('⚠️ getOwnershipData: Missing program or wallet');
      return null;
    }
    
    console.log(`🔍 getOwnershipData called for property ${propertyId}`);
    console.log(`  Using wallet: ${wallet.publicKey.toString()}`);
    
    return await fetchOwnershipData(program, wallet.publicKey, propertyId);
  }, [program, wallet]);

  const getPlayerData = useCallback(async () => {
    if (!program || !wallet) return null;
    return await fetchPlayerData(program, wallet.publicKey);
  }, [program, wallet]);

  // ✨ ENHANCED: sellProperty now stores to backend
  const sellProperty = useCallback(async (propertyId: number, slots: number) => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');

    setLoading(true);
    try {
      const playerTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        wallet.publicKey
      );

      const [propertyPDA] = getPropertyPDA(propertyId);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);

      const tx = await program.methods
        .sellProperty(slots)
        .accountsPartial({
          property: propertyPDA,
          ownership: ownershipPDA,
          playerAccount: playerPDA,
          player: wallet.publicKey,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          gameConfig: GAME_CONFIG,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('Property sold:', tx);
      
      // 🆕 NEW: Store to backend
      await storeTransactionEvents(tx);
      
      return tx;
    } catch (error) {
      console.error('Error selling property:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, playerInitialized, storeTransactionEvents]);

  const stealProperty = useCallback(async (propertyId: number, targetPlayer: string) => {
    if (!program || !wallet || !provider) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');
  
    setLoading(true);
    try {
      const targetPlayerPubkey = new PublicKey(targetPlayer);
      
      // Get all required accounts
      const playerTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
      const devWallet = new PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");
      const devTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, devWallet);
      
      const [propertyPDA] = getPropertyPDA(propertyId);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [targetOwnershipPDA] = getOwnershipPDA(targetPlayerPubkey, propertyId);
      const [stealRequestPDA] = getStealRequestPDA(wallet.publicKey, propertyId); // ✅ Now works!
      
      // ✅ STEP 1: Request Steal (Commit)
      console.log('🎲 Step 1: Committing steal request...');
      
      const userRandomness = Array.from(crypto.getRandomValues(new Uint8Array(32)));
      
      const requestTx = await program.methods
        .stealPropertyRequest(
          targetPlayerPubkey,
          true, // isTargeted
          userRandomness
        )
        .accountsPartial({
          property: propertyPDA,
          targetOwnership: targetOwnershipPDA,
          stealRequest: stealRequestPDA,
          playerAccount: playerPDA,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          devTokenAccount: devTokenAccount,
          gameConfig: GAME_CONFIG,
          attacker: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log('✅ Steal committed:', requestTx);
      await storeTransactionEvents(requestTx);
      
      // ✅ STEP 2: Wait at least 1 slot (~400-600ms)
      console.log('⏳ Waiting for slot confirmation (1 second)...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ✅ STEP 3: Fulfill Steal (Reveal)
      console.log('🎲 Step 2: Fulfilling steal...');
      
      const [attackerOwnershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
      const SLOT_HASHES_SYSVAR = new PublicKey('SysvarS1otHashes111111111111111111111111111');
      
      const fulfillTx = await program.methods
        .stealPropertyFulfill()
        .accountsPartial({
          property: propertyPDA,
          stealRequest: stealRequestPDA,
          targetOwnership: targetOwnershipPDA,
          attackerOwnership: attackerOwnershipPDA,
          attackerAccount: playerPDA,
          gameConfig: GAME_CONFIG,
          slotHashes: SLOT_HASHES_SYSVAR,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log('✅ Steal fulfilled:', fulfillTx);
      await storeTransactionEvents(fulfillTx);
      
      // ✅ STEP 4: Check result - WITH PROPER TYPING
      try {
        // Use type assertion for accounts that aren't in standard IDL
        const stealRequest = await (program.account as any).stealRequest.fetch(stealRequestPDA);
        
        if (stealRequest.success) {
          console.log('🎉 STEAL SUCCESSFUL! VRF:', stealRequest.vrfResult.toString());
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
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, provider, connection, playerInitialized, storeTransactionEvents]);

  return {
    program,
    tokenBalance,
    playerInitialized,
    tokenAccountExists,
    loading,
    createTokenAccount,
    initializePlayer,
    buyProperty,
    activateShield,
    claimRewards,
    sellProperty,     
    stealProperty,   
    getPropertyData,
    getOwnershipData,
    getPlayerData,
  };
}