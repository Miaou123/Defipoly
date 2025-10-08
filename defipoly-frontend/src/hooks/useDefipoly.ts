import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PROGRAM_ID, TOKEN_MINT, GAME_CONFIG, REWARD_POOL } from '@/utils/constants';
import { useMemo, useCallback, useState, useEffect } from 'react';
import { 
  getProgram, 
  getPlayerPDA, 
  getPropertyPDA, 
  getOwnershipPDA,
  checkPlayerExists,
  fetchPlayerData,
  fetchPropertyData,
  fetchOwnershipData
} from '@/utils/program';
import { getOrCreateTokenAccount, createTokenAccountInstruction, checkTokenAccountExists } from '@/utils/token';
export function useDefipoly() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [tokenBalance, setTokenBalance] = useState(0);
  const [playerInitialized, setPlayerInitialized] = useState(false);
  const [tokenAccountExists, setTokenAccountExists] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // Check if player is initialized
  useEffect(() => {
    if (!wallet) {
      setPlayerInitialized(false);
      return;
    }

    const checkPlayer = async () => {
      const exists = await checkPlayerExists(connection, wallet.publicKey);
      setPlayerInitialized(exists);
    };

    checkPlayer();
  }, [wallet, connection]);

  // Check if token account exists
  useEffect(() => {
    if (!wallet) {
      setTokenAccountExists(false);
      return;
    }

    const checkAccount = async () => {
      const exists = await checkTokenAccountExists(connection, wallet.publicKey);
      setTokenAccountExists(exists);
    };

    checkAccount();
  }, [wallet, connection]);

  // Fetch token balance
  useEffect(() => {
    if (!wallet || !tokenAccountExists) {
      setTokenBalance(0);
      return;
    }
    
    const fetchBalance = async () => {
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
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [wallet, connection, tokenAccountExists]);

  const createTokenAccount = useCallback(async () => {
    if (!wallet || !provider) throw new Error('Wallet not connected');

    setLoading(true);
    try {
      const instruction = await createTokenAccountInstruction(wallet.publicKey);
      const { Transaction } = await import('@solana/web3.js');
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
    if (!program || !wallet) throw new Error('Wallet not connected');

    setLoading(true);
    try {
      const { Transaction, SystemProgram } = await import('@solana/web3.js');
      const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } = await import('@solana/spl-token');
      
      const transaction = new Transaction();
      
      // Check if token account exists
      const tokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        wallet.publicKey
      );
      
      const tokenAccountInfo = await connection.getAccountInfo(tokenAccount);
      
      // Add create token account instruction if it doesn't exist
      if (!tokenAccountInfo) {
        console.log('Creating token account...');
        const createATAIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          tokenAccount,     // ata
          wallet.publicKey, // owner
          TOKEN_MINT        // mint
        );
        transaction.add(createATAIx);
      }

      // Check if player account exists
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const playerAccountInfo = await connection.getAccountInfo(playerPDA);
      
      // Add initialize player instruction if it doesn't exist
      if (!playerAccountInfo) {
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

      // Add buy property instruction
      const [propertyPDA] = getPropertyPDA(propertyId);
      const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);

      const buyPropertyIx = await program.methods
        .buyProperty()
        .accountsPartial({
          property: propertyPDA,
          ownership: ownershipPDA,
          playerAccount: playerPDA,
          player: wallet.publicKey,
          playerTokenAccount: tokenAccount,
          rewardPoolVault: REWARD_POOL,
          gameConfig: GAME_CONFIG,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      transaction.add(buyPropertyIx);

      // Send transaction
      const signature = await provider!.sendAndConfirm(transaction);
      
      console.log('Property bought:', signature);
      
      // Update states
      if (!tokenAccountInfo) setTokenAccountExists(true);
      if (!playerAccountInfo) setPlayerInitialized(true);
      
      return signature;
    } catch (error) {
      console.error('Error buying property:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, connection, provider]);
  
  const activateShield = useCallback(async (propertyId: number, cycles: number) => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');

    setLoading(true);
    try {
      const playerTokenAccount = await getOrCreateTokenAccount(
        connection,
        wallet.publicKey,
        wallet.publicKey
      );

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
          gameConfig: GAME_CONFIG,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('Shield activated:', tx);
      return tx;
    } catch (error) {
      console.error('Error activating shield:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, playerInitialized, connection]);

  const claimRewards = useCallback(async () => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');

    setLoading(true);
    try {
      const playerTokenAccount = await getOrCreateTokenAccount(
        connection,
        wallet.publicKey,
        wallet.publicKey
      );

      const [playerPDA] = getPlayerPDA(wallet.publicKey);

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
        .rpc();

      console.log('Rewards claimed:', tx);
      return tx;
    } catch (error) {
      console.error('Error claiming rewards:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, playerInitialized, connection]);

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

  const sellProperty = useCallback(async (propertyId: number, slots: number) => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');

    setLoading(true);
    try {
      const playerTokenAccount = await getOrCreateTokenAccount(
        connection,
        wallet.publicKey,
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
      return tx;
    } catch (error) {
      console.error('Error selling property:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, playerInitialized, connection]);

  const stealProperty = useCallback(async (propertyId: number, targetPlayer: string) => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    if (!playerInitialized) throw new Error('Initialize player first');

    setLoading(true);
    try {
      const playerTokenAccount = await getOrCreateTokenAccount(
        connection,
        wallet.publicKey,
        wallet.publicKey
      );

      const targetPlayerPubkey = new PublicKey(targetPlayer);
      const [propertyPDA] = getPropertyPDA(propertyId);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [targetOwnershipPDA] = getOwnershipPDA(targetPlayerPubkey, propertyId);
      const [attackerOwnershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);

      const tx = await program.methods
        .stealProperty(targetPlayerPubkey)
        .accountsPartial({
          property: propertyPDA,
          targetOwnership: targetOwnershipPDA,
          attackerOwnership: attackerOwnershipPDA,
          playerAccount: playerPDA,
          player: wallet.publicKey,
          playerTokenAccount,
          rewardPoolVault: REWARD_POOL,
          gameConfig: GAME_CONFIG,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Steal attempt:', tx);
      return tx;
    } catch (error) {
      console.error('Error stealing property:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, playerInitialized, connection]);

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