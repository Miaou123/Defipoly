// ============================================
// FILE: defipoly-frontend/src/hooks/useDefipoly.ts
// Complete hook with all functions
// ============================================

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

// Constants
import { PROGRAM_ID, GAME_CONFIG, REWARD_POOL, TOKEN_MINT } from '@/utils/constants';

// Program utilities
import { 
  getProgram,
  getPropertyPDA,
  getPlayerPDA,
  getOwnershipPDA,
  getSetCooldownPDA,
  getSetOwnershipPDA,
  getSetStatsPDA,
  getStealRequestPDA,
  fetchPropertyData,
  fetchOwnershipData,
  fetchPlayerData,
} from '@/utils/program';

// Token utilities
import { 
  checkTokenAccountExists,
  createTokenAccountInstruction
} from '@/utils/token';

// Backend storage utilities
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

  // Initialize event parser for storing actions
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

  // Helper to store transaction events to backend
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
      
      // Fetch property to get setId
      const propertyData = await (program.account as any).property.fetch(propertyPDA);
      const setId = propertyData.setId;
      
      // Get the 3 new required PDAs
      const [setCooldownPDA] = getSetCooldownPDA(wallet.publicKey, setId);
      const [setOwnershipPDA] = getSetOwnershipPDA(wallet.publicKey, setId);
      const [setStatsPDA] = getSetStatsPDA(setId);
      
      // Get dev token account
      const devWallet = new PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");
      const devTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, devWallet);

      // Add buy property instruction
      const buyPropertyIx = await program.methods
        .buyProperty()
        .accountsPartial({
          property: propertyPDA,
          ownership: ownershipPDA,
          setCooldown: setCooldownPDA,
          setOwnership: setOwnershipPDA,
          setStats: setStatsPDA,
          playerAccount: playerPDA,
          player: wallet.publicKey,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          devTokenAccount: devTokenAccount,
          gameConfig: GAME_CONFIG,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      transaction.add(buyPropertyIx);

      // Send and confirm transaction
      const signature = await provider.sendAndConfirm(transaction, [], {
        commitment: 'confirmed',
        skipPreflight: false,
      });
      
      console.log('✅ Property bought successfully:', signature);
      
      // Try to store to backend (but don't fail the whole transaction if this errors)
      try {
        await storeTransactionEvents(signature);
        console.log('✅ Events stored to backend');
      } catch (backendError) {
        console.warn('⚠️ Backend storage failed (transaction still succeeded):', backendError);
      }
      
      // Update states
      if (!hasTokenAccount) setTokenAccountExists(true);
      if (!playerData) setPlayerInitialized(true);
      
      return signature;
    } catch (error: any) {
      console.error('❌ Error in buyProperty:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, connection, provider, storeTransactionEvents]);

  const activateShield = useCallback(async (propertyId: number, cycles: number) => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');

    setLoading(true);
    try {
      const playerTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        wallet.publicKey
      );

      // Get dev token account
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
      
      // Try to store to backend (don't fail if this errors)
      try {
        await storeTransactionEvents(tx);
        console.log('✅ Events stored to backend');
      } catch (backendError) {
        console.warn('⚠️ Backend storage failed (non-critical):', backendError);
      }
      
      return tx;
    } catch (error: any) {
      console.error('❌ Error activating shield:', error);
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

      const tx = await program.methods
        .claimRewards()
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
        await storeTransactionEvents(tx);
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
  }, [program, wallet, playerInitialized, storeTransactionEvents]);

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

      console.log('✅ Property sold successfully:', tx);

      // Try to store to backend
      try {
        await storeTransactionEvents(tx);
      } catch (backendError) {
        console.warn('⚠️ Backend storage failed (non-critical):', backendError);
      }

      return tx;
    } catch (error: any) {
      console.error('❌ Error selling property:', error);
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
      const [stealRequestPDA] = getStealRequestPDA(wallet.publicKey, propertyId);
      
      // Generate user randomness (32 bytes)
      const userRandomness = new Uint8Array(32);
      crypto.getRandomValues(userRandomness);
      
      console.log('🎲 Initiating steal with randomness...');
      
      // Step 1: Request steal
      const requestTx = await program.methods
        .requestSteal(targetPlayerPubkey, Array.from(userRandomness))
        .accountsPartial({
          property: propertyPDA,
          targetOwnership: targetOwnershipPDA,
          stealRequest: stealRequestPDA,
          playerAccount: playerPDA,
          player: wallet.publicKey,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          devTokenAccount,
          gameConfig: GAME_CONFIG,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log('✅ Steal requested:', requestTx);
      
      // Wait for VRF fulfillment
      console.log('⏳ Waiting for VRF fulfillment...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 2: Fulfill the steal request
      const [attackerOwnershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
      
      const fulfillTx = await program.methods
        .fulfillSteal()
        .accountsPartial({
          property: propertyPDA,
          targetOwnership: targetOwnershipPDA,
          attackerOwnership: attackerOwnershipPDA,
          stealRequest: stealRequestPDA,
          playerAccount: playerPDA,
          player: wallet.publicKey,
          gameConfig: GAME_CONFIG,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log('✅ Steal fulfilled:', fulfillTx);
      
      // Fetch the result
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Use type assertion for accounts that aren't in standard IDL
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
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, provider, connection, playerInitialized, storeTransactionEvents]);

  const getPropertyData = useCallback(async (propertyId: number) => {
    if (!program) throw new Error('Program not initialized');
    return await fetchPropertyData(program, propertyId);
  }, [program]);

  const getOwnershipData = useCallback(async (propertyId: number) => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    return await fetchOwnershipData(program, wallet.publicKey, propertyId);
  }, [program, wallet]);

  const getPlayerData = useCallback(async () => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    return await fetchPlayerData(program, wallet.publicKey);
  }, [program, wallet]);

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