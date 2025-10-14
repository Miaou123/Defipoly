// Updated bot-interactions.ts - Copy this entire file to scripts/bot/bot-interactions.ts
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import crypto from "crypto";

// Suppress dotenv output
dotenv.config({ debug: false });

// Backend integration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Property prices (matching backend constants)
const PROPERTIES = [
  { id: 0, setId: 0, price: 1000000000000 },      // Mediterranean
  { id: 1, setId: 0, price: 1200000000000 },      // Baltic
  { id: 2, setId: 1, price: 2500000000000 },      // Oriental
  { id: 3, setId: 1, price: 2500000000000 },      // Vermont
  { id: 4, setId: 1, price: 3000000000000 },      // Connecticut
  { id: 5, setId: 2, price: 3500000000000 },      // St. Charles
  { id: 6, setId: 2, price: 3500000000000 },      // States
  { id: 7, setId: 2, price: 4000000000000 },      // Virginia
  { id: 8, setId: 3, price: 4500000000000 },      // St. James
  { id: 9, setId: 3, price: 4500000000000 },      // Tennessee
  { id: 10, setId: 3, price: 5000000000000 },     // New York
  { id: 11, setId: 4, price: 5500000000000 },     // Kentucky
  { id: 12, setId: 4, price: 5500000000000 },     // Indiana
  { id: 13, setId: 4, price: 6000000000000 },     // Illinois
  { id: 14, setId: 5, price: 6500000000000 },     // Atlantic
  { id: 15, setId: 5, price: 6500000000000 },     // Ventnor
  { id: 16, setId: 5, price: 7000000000000 },     // Marvin Gardens
  { id: 17, setId: 6, price: 7500000000000 },     // Pacific
  { id: 18, setId: 6, price: 8000000000000 },     // North Carolina
  { id: 19, setId: 6, price: 8500000000000 },     // Pennsylvania
  { id: 20, setId: 7, price: 9000000000000 },     // Park Place
  { id: 21, setId: 7, price: 10000000000000 },    // Boardwalk
];

function getPropertyPrice(propertyId: number): number {
  const property = PROPERTIES.find(p => p.id === propertyId);
  return property ? property.price : 0;
}

async function sendActionToBackend(
  txSignature: string,
  actionType: string, 
  playerAddress: string,
  propertyId?: number,
  targetAddress?: string,
  amount?: number,
  slots?: number,
  success: boolean = true,
  metadata?: any
) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        txSignature,
        actionType,
        playerAddress,
        propertyId,
        targetAddress,
        amount,
        slots,
        success,
        metadata,
        blockTime: Math.floor(Date.now() / 1000)
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`    🔴 Backend error: ${response.status} - ${errorText}`);
    } else {
      console.log(`    📊 Action logged to backend`);
    }
  } catch (error: any) {
    console.log(`    🔴 Backend connection failed: ${error.message}`);
  }
}

// ES module path fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple, reliable paths
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const WALLETS_DIR = path.join(PROJECT_ROOT, "test-wallets");
const IDL_PATH = path.join(PROJECT_ROOT, "target/idl/defipoly_program.json");

console.log("🔧 Debug paths:");
console.log("  Project root:", PROJECT_ROOT);
console.log("  Wallets dir:", WALLETS_DIR);
console.log("  IDL path:", IDL_PATH);

// Read PROGRAM_ID from IDL
let PROGRAM_ID: PublicKey;
let programIdl: any;

try {
  const idlString = fs.readFileSync(IDL_PATH, "utf8");
  programIdl = JSON.parse(idlString);
  PROGRAM_ID = new PublicKey(programIdl.address || programIdl.metadata?.address);
  if (process.env.DEBUG) {
    console.log("✅ Loaded Program ID:", PROGRAM_ID.toString());
  }
} catch (error: any) {
  console.error("❌ Could not read IDL from:", IDL_PATH);
  console.error("   Error:", error.message);
  console.error("\n💡 Make sure you've built the program: anchor build");
  process.exit(1);
}

// Token mint from env or default
const TOKEN_MINT = new PublicKey(
  process.env.TOKEN_MINT || "743D9e7PCGgh2V3TY2tUeg31e63tmFjJ9rTZJkwhRVLX"
);
if (process.env.DEBUG) {
  console.log("✅ Token Mint:", TOKEN_MINT.toString());
  console.log("");
}

// Helper: Load wallet
function loadWallet(id: number): anchor.web3.Keypair {
  const walletPath = path.join(WALLETS_DIR, `wallet-${id}.json`);
  if (!fs.existsSync(walletPath)) {
    throw new Error(`Wallet ${id} not found at ${walletPath}`);
  }
  const walletData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  return anchor.web3.Keypair.fromSecretKey(Buffer.from(walletData.secretKey));
}

// PDA helpers
function getPlayerPDA(player: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("player"), player.toBuffer()],
    PROGRAM_ID
  );
}

function getPropertyPDA(propertyId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("property"), Buffer.from([propertyId])],
    PROGRAM_ID
  );
}

function getOwnershipPDA(player: PublicKey, propertyId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("ownership"), player.toBuffer(), Buffer.from([propertyId])],
    PROGRAM_ID
  );
}

function getSetCooldownPDA(player: PublicKey, setId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("cooldown"), player.toBuffer(), Buffer.from([setId])],
    PROGRAM_ID
  );
}

function getSetOwnershipPDA(player: PublicKey, setId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("set_ownership"), player.toBuffer(), Buffer.from([setId])],
    PROGRAM_ID
  );
}

function getSetStatsPDA(setId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("set_stats_v2"), Buffer.from([setId])],
    PROGRAM_ID
  );
}

function getGameConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("game_config")],
    PROGRAM_ID
  );
}

function getStealRequestPDA(attacker: PublicKey, propertyId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("steal_request"), attacker.toBuffer(), Buffer.from([propertyId])],
    PROGRAM_ID
  );
}

// Get program instance
async function getProgram(connection: anchor.web3.Connection, wallet: anchor.web3.Keypair) {
  const provider = new AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: "confirmed" }
  );
  return new Program(programIdl, provider);
}

// Get token account
function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return address;
}

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

// Command: Initialize players
async function initializePlayers(walletIds: number[]) {
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");

  console.log(`🎮 Initializing ${walletIds.length} players...`);

  for (const id of walletIds) {
    try {
      const wallet = loadWallet(id);
      const program = await getProgram(connection, wallet);
      const [playerPDA] = getPlayerPDA(wallet.publicKey);

      // Check if already initialized
      try {
        await (program.account as any).playerAccount.fetch(playerPDA);
        console.log(`  Wallet ${id}: ⏭️  Already initialized`);
        continue;
      } catch {
        // Not initialized, proceed
      }

      await program.methods
        .initializePlayer()
        .accountsPartial({
          playerAccount: playerPDA,
          player: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log(`  Wallet ${id}: ✅ Player initialized`);
    } catch (error: any) {
      console.log(`  Wallet ${id}: ❌ Error: ${error?.message || error}`);
    }
  }
}

// Command: Buy properties (UPDATED for new slots parameter)
async function buyProperties(walletIds: number[], propertyId: number, slots: number = 1) {
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");

  console.log(`🏠 Buying property ${propertyId} (${slots} slot${slots > 1 ? 's' : ''}) for ${walletIds.length} wallets...`);

  for (const id of walletIds) {
    const wallet = loadWallet(id);
    try {
      const program = await getProgram(connection, wallet);
      
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [propertyPDA] = getPropertyPDA(propertyId);
      const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
      const [gameConfigPDA] = getGameConfigPDA();
      
      // Fetch property to get set_id
      const property = await (program.account as any).property.fetch(propertyPDA);
      const setId = property.setId;
      
      const [setCooldownPDA] = getSetCooldownPDA(wallet.publicKey, setId);
      const [setOwnershipPDA] = getSetOwnershipPDA(wallet.publicKey, setId);
      const [setStatsPDA] = getSetStatsPDA(setId);
      
      const playerTokenAccount = getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
      const gameConfig = await (program.account as any).gameConfig.fetch(gameConfigPDA);
      const rewardPoolVault = gameConfig.rewardPoolVault;
      const devTokenAccount = getAssociatedTokenAddress(TOKEN_MINT, gameConfig.devWallet);

      await program.methods
        .buyProperty(slots)
        .accountsPartial({
          property: propertyPDA,
          ownership: ownershipPDA,
          setCooldown: setCooldownPDA,
          setOwnership: setOwnershipPDA,
          setStats: setStatsPDA,
          playerAccount: playerPDA,
          playerTokenAccount,
          rewardPoolVault,
          devTokenAccount,
          gameConfig: gameConfigPDA,
          player: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log(`  Wallet ${id}: ✅ Bought ${slots} slot${slots > 1 ? 's' : ''} of property ${propertyId}`);
      
      // Calculate total cost
      const propertyPrice = getPropertyPrice(propertyId);
      const totalCost = propertyPrice * slots;
      
      // Send action to backend
      await sendActionToBackend(
        `bot_buy_${Date.now()}_${id}_${propertyId}`, // Generate unique tx signature
        'buy',
        wallet.publicKey.toString(),
        propertyId,
        undefined, // no target for buy
        totalCost, // actual cost calculated from property price * slots
        slots,
        true,
        { botWallet: id, timestamp: Date.now(), propertyPrice, totalCost }
      );
    } catch (error: any) {
      console.log(`  Wallet ${id}: ❌ Error: ${error?.message || error}`);
      
      // Calculate total cost for failed attempts too
      const propertyPrice = getPropertyPrice(propertyId);
      const totalCost = propertyPrice * slots;
      
      // Log failed action to backend
      await sendActionToBackend(
        `bot_buy_failed_${Date.now()}_${id}_${propertyId}`,
        'buy',
        wallet.publicKey.toString(),
        propertyId,
        undefined,
        totalCost,
        slots,
        false,
        { botWallet: id, error: error?.message || error.toString(), timestamp: Date.now(), propertyPrice, totalCost }
      );
    }
  }
}

// Command: Activate shields
async function activateShields(walletIds: number[], propertyId: number, slotsToShield: number = 1) {
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");

  console.log(`🛡️  Activating shields for property ${propertyId}...`);

  for (const id of walletIds) {
    const wallet = loadWallet(id);
    try {
      const program = await getProgram(connection, wallet);
      
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [propertyPDA] = getPropertyPDA(propertyId);
      const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
      const [gameConfigPDA] = getGameConfigPDA();
      
      const playerTokenAccount = getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
      const gameConfig = await (program.account as any).gameConfig.fetch(gameConfigPDA);
      const rewardPoolVault = gameConfig.rewardPoolVault;
      const devTokenAccount = getAssociatedTokenAddress(TOKEN_MINT, gameConfig.devWallet);

      await program.methods
        .activateShield(slotsToShield)
        .accountsPartial({
          property: propertyPDA,
          ownership: ownershipPDA,
          playerAccount: playerPDA,
          playerTokenAccount,
          rewardPoolVault,
          devTokenAccount,
          gameConfig: gameConfigPDA,
          player: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log(`  Wallet ${id}: ✅ Shield activated for ${slotsToShield} slots`);
      
      // Send action to backend
      await sendActionToBackend(
        `bot_shield_${Date.now()}_${id}_${propertyId}`,
        'shield',
        wallet.publicKey.toString(),
        propertyId,
        undefined,
        undefined, // shield cost would need calculation
        slotsToShield,
        true,
        { botWallet: id, timestamp: Date.now() }
      );
    } catch (error: any) {
      console.log(`  Wallet ${id}: ❌ Error: ${error?.message || error}`);
    }
  }
}

// Command: Claim rewards
async function claimRewards(walletIds: number[]) {
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");

  console.log(`💰 Claiming rewards for ${walletIds.length} wallets...`);

  for (const id of walletIds) {
    const wallet = loadWallet(id);
    try {
      const program = await getProgram(connection, wallet);
      
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [gameConfigPDA] = getGameConfigPDA();
      
      const playerTokenAccount = getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
      const gameConfig = await (program.account as any).gameConfig.fetch(gameConfigPDA);
      const rewardPoolVault = gameConfig.rewardPoolVault;

      // Get all properties (0-7) for remaining accounts
      const remainingAccounts = [];
      for (let propId = 0; propId < 8; propId++) {
        const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propId);
        remainingAccounts.push({
          pubkey: ownershipPDA,
          isSigner: false,
          isWritable: false,
        });
      }

      await program.methods
        .claimRewards()
        .accountsPartial({
          playerAccount: playerPDA,
          playerTokenAccount,
          rewardPoolVault,
          gameConfig: gameConfigPDA,
          player: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts)
        .rpc();

      console.log(`  Wallet ${id}: ✅ Rewards claimed`);
      
      // Send action to backend
      await sendActionToBackend(
        `bot_claim_${Date.now()}_${id}`,
        'claim',
        wallet.publicKey.toString(),
        undefined, // no specific property for claims
        undefined,
        undefined, // reward amount would need calculation
        undefined,
        true,
        { botWallet: id, timestamp: Date.now() }
      );
    } catch (error: any) {
      console.log(`  Wallet ${id}: ❌ Error: ${error?.message || error}`);
    }
  }
}

// Command: Get wallet info
async function getWalletInfo(walletId: number) {
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");

  try {
    const wallet = loadWallet(walletId);
    const program = await getProgram(connection, wallet);
    
    console.log(`\n📊 Wallet ${walletId} Info`);
    console.log(`Address: ${wallet.publicKey.toString()}`);
    
    // SOL balance
    const solBalance = await connection.getBalance(wallet.publicKey);
    console.log(`SOL: ${(solBalance / anchor.web3.LAMPORTS_PER_SOL).toFixed(4)}`);
    
    // Token balance
    try {
      const tokenAccount = getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
      const tokenAccountInfo = await connection.getTokenAccountBalance(tokenAccount);
      console.log(`Tokens: ${Number(tokenAccountInfo.value.amount) / 1e9}`);
    } catch {
      console.log(`Tokens: no token account`);
    }
    
    // Player account
    const [playerPDA] = getPlayerPDA(wallet.publicKey);
    try {
      const playerAccount = await (program.account as any).playerAccount.fetch(playerPDA);
      console.log(`\nPlayer Account:`);
      console.log(`  Total slots owned: ${playerAccount.totalSlotsOwned}`);
      console.log(`  Properties owned: ${playerAccount.propertiesOwnedCount}`);
      console.log(`  Complete sets: ${playerAccount.completeSetsOwned}`);
      console.log(`  Total rewards claimed: ${playerAccount.totalRewardsClaimed.toString()}`);
      console.log(`  Last claim: ${new Date(playerAccount.lastClaimTimestamp * 1000).toISOString()}`);
    } catch {
      console.log(`Player: Not initialized`);
    }
    
    // Properties owned
    console.log(`\nProperties:`);
    for (let propId = 0; propId < 8; propId++) {
      const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propId);
      try {
        const ownership = await (program.account as any).propertyOwnership.fetch(ownershipPDA);
        if (ownership.slotsOwned > 0) {
          console.log(`  Property ${propId}: ${ownership.slotsOwned} slots (Shield: ${ownership.shieldActive})`);
        }
      } catch {
        // No ownership for this property
      }
    }
    
  } catch (error: any) {
    console.log(`❌ Error: ${error?.message || error}`);
  }
}

// Command: Targeted steal (specify target wallet)
async function stealPropertyTargeted(
  attackerWalletId: number, 
  targetWalletId: number, 
  propertyId: number
) {
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");
  
  const attackerWallet = loadWallet(attackerWalletId);
  const targetWallet = loadWallet(targetWalletId);
  
  console.log(`🎯 Wallet ${attackerWalletId} attempting targeted steal from wallet ${targetWalletId} (property ${propertyId})...`);

  try {
    const program = await getProgram(connection, attackerWallet);
    
    // Generate user randomness
    const userRandomness = Array.from(crypto.getRandomValues(new Uint8Array(32)));
    
    // Get required PDAs
    const [propertyPDA] = getPropertyPDA(propertyId);
    const [attackerPlayerPDA] = getPlayerPDA(attackerWallet.publicKey);
    const [targetPlayerPDA] = getPlayerPDA(targetWallet.publicKey);
    const [targetOwnershipPDA] = getOwnershipPDA(targetWallet.publicKey, propertyId);
    const [stealRequestPDA] = getStealRequestPDA(attackerWallet.publicKey, propertyId);
    const [gameConfigPDA] = getGameConfigPDA();
    
    // Get token accounts
    const attackerTokenAccount = getAssociatedTokenAddress(TOKEN_MINT, attackerWallet.publicKey);
    const devWallet = new PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");
    const devTokenAccount = getAssociatedTokenAddress(TOKEN_MINT, devWallet);
    
    const gameConfig = await (program.account as any).gameConfig.fetch(gameConfigPDA);
    const rewardPoolVault = gameConfig.rewardPoolVault;
    
    console.log("  Step 1: Requesting steal...");
    // Step 1: Request steal
    const requestTx = await program.methods
      .stealPropertyRequest(
        targetWallet.publicKey,
        true, // is_targeted = true for targeted steal
        userRandomness
      )
      .accountsPartial({
        property: propertyPDA,
        targetOwnership: targetOwnershipPDA,
        stealRequest: stealRequestPDA,
        playerAccount: attackerPlayerPDA,
        attacker: attackerWallet.publicKey,
        playerTokenAccount: attackerTokenAccount,
        rewardPoolVault: rewardPoolVault,
        devTokenAccount: devTokenAccount,
        gameConfig: gameConfigPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log(`  Request transaction: ${requestTx}`);
    
    // Wait for VRF fulfillment
    console.log("  Step 2: Waiting for VRF fulfillment...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 2: Fulfill steal
    const [attackerOwnershipPDA] = getOwnershipPDA(attackerWallet.publicKey, propertyId);
    
    const fulfillTx = await program.methods
      .stealPropertyFulfill()
      .accountsPartial({
        property: propertyPDA,
        targetOwnership: targetOwnershipPDA,
        attackerOwnership: attackerOwnershipPDA,
        stealRequest: stealRequestPDA,
        attackerAccount: attackerPlayerPDA,
        targetAccount: targetPlayerPDA,
        gameConfig: gameConfigPDA,
        slotHashes: anchor.web3.SYSVAR_SLOT_HASHES_PUBKEY,
        payer: attackerWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log(`  Fulfill transaction: ${fulfillTx}`);
    
    // Check result
    await new Promise(resolve => setTimeout(resolve, 2000));
    const stealRequest = await (program.account as any).stealRequest.fetch(stealRequestPDA);
    
    if (stealRequest.success) {
      console.log(`  ✅ Steal successful! VRF: ${stealRequest.vrfResult.toString()}`);
    } else {
      console.log(`  ❌ Steal failed. VRF: ${stealRequest.vrfResult.toString()}`);
    }
    
    // Send to backend
    await sendActionToBackend(
      fulfillTx,
      'steal',
      attackerWallet.publicKey.toString(),
      propertyId,
      1, // slots attempted
      getPropertyPrice(propertyId) * 0.5, // steal cost
      {
        target: targetWallet.publicKey.toString(),
        targeted: true,
        success: stealRequest.success,
        vrfResult: stealRequest.vrfResult.toString()
      }
    );
    
    return stealRequest.success;
  } catch (error) {
    console.error(`  ❌ Error: ${error}`);
    return false;
  }
}

// Command: Random steal (bot selects random target)
async function stealPropertyRandom(attackerWalletId: number, propertyId: number) {
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");
  
  const attackerWallet = loadWallet(attackerWalletId);
  
  console.log(`🎲 Wallet ${attackerWalletId} attempting random steal (property ${propertyId})...`);

  try {
    const program = await getProgram(connection, attackerWallet);
    
    // For simplicity, we'll pick a random target wallet from available test wallets
    // In practice, you'd query the blockchain to find actual property owners
    const availableWallets = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(id => id !== attackerWalletId);
    const randomTargetId = availableWallets[Math.floor(Math.random() * availableWallets.length)];
    const targetWallet = loadWallet(randomTargetId);
    
    console.log(`  Selected random target: wallet ${randomTargetId}`);
    
    // Generate user randomness
    const userRandomness = Array.from(crypto.getRandomValues(new Uint8Array(32)));
    
    // Get required PDAs
    const [propertyPDA] = getPropertyPDA(propertyId);
    const [attackerPlayerPDA] = getPlayerPDA(attackerWallet.publicKey);
    const [targetPlayerPDA] = getPlayerPDA(targetWallet.publicKey);
    const [targetOwnershipPDA] = getOwnershipPDA(targetWallet.publicKey, propertyId);
    const [stealRequestPDA] = getStealRequestPDA(attackerWallet.publicKey, propertyId);
    const [gameConfigPDA] = getGameConfigPDA();
    
    // Get token accounts
    const attackerTokenAccount = getAssociatedTokenAddress(TOKEN_MINT, attackerWallet.publicKey);
    const devWallet = new PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");
    const devTokenAccount = getAssociatedTokenAddress(TOKEN_MINT, devWallet);
    
    const gameConfig = await (program.account as any).gameConfig.fetch(gameConfigPDA);
    const rewardPoolVault = gameConfig.rewardPoolVault;
    
    console.log("  Step 1: Requesting random steal...");
    // Step 1: Request steal
    const requestTx = await program.methods
      .stealPropertyRequest(
        targetWallet.publicKey,
        false, // is_targeted = false for random steal (higher success rate)
        userRandomness
      )
      .accountsPartial({
        property: propertyPDA,
        targetOwnership: targetOwnershipPDA,
        stealRequest: stealRequestPDA,
        playerAccount: attackerPlayerPDA,
        attacker: attackerWallet.publicKey,
        playerTokenAccount: attackerTokenAccount,
        rewardPoolVault: rewardPoolVault,
        devTokenAccount: devTokenAccount,
        gameConfig: gameConfigPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log(`  Request transaction: ${requestTx}`);
    
    // Wait for VRF fulfillment
    console.log("  Step 2: Waiting for VRF fulfillment...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 2: Fulfill steal
    const [attackerOwnershipPDA] = getOwnershipPDA(attackerWallet.publicKey, propertyId);
    
    const fulfillTx = await program.methods
      .stealPropertyFulfill()
      .accountsPartial({
        property: propertyPDA,
        targetOwnership: targetOwnershipPDA,
        attackerOwnership: attackerOwnershipPDA,
        stealRequest: stealRequestPDA,
        attackerAccount: attackerPlayerPDA,
        targetAccount: targetPlayerPDA,
        gameConfig: gameConfigPDA,
        slotHashes: anchor.web3.SYSVAR_SLOT_HASHES_PUBKEY,
        payer: attackerWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log(`  Fulfill transaction: ${fulfillTx}`);
    
    // Check result
    await new Promise(resolve => setTimeout(resolve, 2000));
    const stealRequest = await (program.account as any).stealRequest.fetch(stealRequestPDA);
    
    if (stealRequest.success) {
      console.log(`  ✅ Random steal successful! VRF: ${stealRequest.vrfResult.toString()}`);
    } else {
      console.log(`  ❌ Random steal failed. VRF: ${stealRequest.vrfResult.toString()}`);
    }
    
    // Send to backend
    await sendActionToBackend(
      fulfillTx,
      'steal',
      attackerWallet.publicKey.toString(),
      propertyId,
      1, // slots attempted
      getPropertyPrice(propertyId) * 0.5, // steal cost
      {
        target: targetWallet.publicKey.toString(),
        targeted: false,
        success: stealRequest.success,
        vrfResult: stealRequest.vrfResult.toString()
      }
    );
    
    return stealRequest.success;
  } catch (error) {
    console.error(`  ❌ Error: ${error}`);
    return false;
  }
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "init": {
      const walletIds = args[1] === "all"
        ? Array.from({ length: 50 }, (_, i) => i)
        : args.slice(1).map(Number);
      await initializePlayers(walletIds);
      break;
    }
    
    case "buy": {
      const propertyId = Number(args[1]);
      
      // Parse slots and wallets
      // Format: buy <propertyId> [slots] <wallets>
      // Examples: 
      //   buy 0 all        -> propertyId=0, slots=1, wallets=all
      //   buy 0 1 all      -> propertyId=0, slots=1, wallets=all
      //   buy 0 5 0 1 2    -> propertyId=0, slots=5, wallets=[0,1,2]
      
      let slots = 1;
      let walletIds: number[] = [];
      
      if (args[2] === "all") {
        // buy 0 all -> all wallets, 1 slot each
        slots = 1;
        walletIds = Array.from({ length: 50 }, (_, i) => i);
      } else if (!isNaN(Number(args[2])) && args[3] === "all") {
        // buy 0 5 all -> all wallets, 5 slots each
        slots = Number(args[2]);
        walletIds = Array.from({ length: 50 }, (_, i) => i);
      } else if (!isNaN(Number(args[2])) && args.length > 3) {
        // buy 0 5 0 1 2 -> wallets 0,1,2, 5 slots each
        slots = Number(args[2]);
        walletIds = args.slice(3).map(Number);
      } else {
        // buy 0 0 1 2 -> wallets 0,1,2, 1 slot each (no slots specified)
        slots = 1;
        walletIds = args.slice(2).map(Number);
      }
      
      await buyProperties(walletIds, propertyId, slots);
      break;
    }
    
    case "shield": {
      const propertyId = Number(args[1]);
      const slotsToShield = Number(args[2]) || 1;
      const walletIds = args[3] === "all"
        ? Array.from({ length: 50 }, (_, i) => i)
        : args.slice(3).map(Number);
      await activateShields(walletIds, propertyId, slotsToShield);
      break;
    }
    
    case "claim": {
      const walletIds = args[1] === "all"
        ? Array.from({ length: 50 }, (_, i) => i)
        : args.slice(1).map(Number);
      await claimRewards(walletIds);
      break;
    }
    
    case "info": {
      const walletId = Number(args[1]);
      await getWalletInfo(walletId);
      break;
    }
    
    case "steal-targeted": {
      const attackerWalletId = Number(args[1]);
      const targetWalletId = Number(args[2]);
      const propertyId = Number(args[3]);
      await stealPropertyTargeted(attackerWalletId, targetWalletId, propertyId);
      break;
    }
    
    case "steal-random": {
      const attackerWalletId = Number(args[1]);
      const propertyId = Number(args[2]);
      await stealPropertyRandom(attackerWalletId, propertyId);
      break;
    }
    
    default:
      console.log(`
🎮 Defipoly Bot CLI (Updated for Current Program)

Usage:
  tsx scripts/bot/bot-interactions.ts <command> [options]

Commands:
  init <wallets>                    Initialize players
  buy <propertyId> [slots] <wallets> Buy properties (slots defaults to 1)
  shield <propertyId> <slots> <wallets> Activate shields
  claim <wallets>                   Claim rewards
  steal-targeted <attacker> <target> <propertyId> Targeted steal (25% success)
  steal-random <attacker> <propertyId> Random steal (33% success)
  info <walletId>                   Get wallet info

Wallet Options:
  all                              All 50 wallets
  0 1 2 3                         Specific wallet IDs (space-separated)

Examples:
  tsx scripts/bot/bot-interactions.ts init all
  tsx scripts/bot/bot-interactions.ts buy 0 1 all          # Buy 1 slot for all wallets
  tsx scripts/bot/bot-interactions.ts buy 0 5 0 1 2 3      # Buy 5 slots for wallets 0-3
  tsx scripts/bot/bot-interactions.ts shield 0 1 0 1 2     # Shield 1 slot for wallets 0-2
  tsx scripts/bot/bot-interactions.ts steal-targeted 0 1 0 # Wallet 0 steals from wallet 1 (property 0)
  tsx scripts/bot/bot-interactions.ts steal-random 0 0     # Wallet 0 random steal (property 0)
  tsx scripts/bot/bot-interactions.ts claim all
  tsx scripts/bot/bot-interactions.ts info 5
      `);
      break;
  }
}

main()
  .then(() => process.exit(0))
  .catch((err: any) => {
    console.error("Error:", err);
    process.exit(1);
  });