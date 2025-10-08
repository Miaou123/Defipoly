import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROGRAM_ID = new anchor.web3.PublicKey("H1zzYzWPReWJ4W2JNiBrYbsrHDxFDGJ9n9jAyYG2VhLQ");
const TOKEN_MINT = new anchor.web3.PublicKey("743D9e7PCGgh2V3TY2tUeg31e63tmFjJ9rTZJkwhRVLX");
const GAME_CONFIG = new anchor.web3.PublicKey("aedS8uSUBgLFgd1RqitymXTfDTzkpuoS4hLCPGGRxVi");
const REWARD_POOL = new anchor.web3.PublicKey("E1y1axQ9oBT98f3D293QKsAanXNLwg8unkY5JJgcFLLj");
const WALLETS_DIR = "./test-wallets";

// Helper functions
function getPlayerPDA(playerPubkey: anchor.web3.PublicKey) {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("player"), playerPubkey.toBuffer()],
    PROGRAM_ID
  );
}

function getPropertyPDA(propertyId: number) {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("property"), Buffer.from([propertyId])],
    PROGRAM_ID
  );
}

function getOwnershipPDA(playerPubkey: anchor.web3.PublicKey, propertyId: number) {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("ownership"), playerPubkey.toBuffer(), Buffer.from([propertyId])],
    PROGRAM_ID
  );
}

// Load wallet from file
function loadWallet(walletId: number): anchor.web3.Keypair {
  const walletPath = path.join(WALLETS_DIR, `wallet-${walletId}.json`);
  const walletData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  return anchor.web3.Keypair.fromSecretKey(Buffer.from(walletData.secretKey));
}

// Get program instance
async function getProgram(connection: anchor.web3.Connection, wallet: anchor.web3.Keypair) {
  const provider = new AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: "confirmed" }
  );
  
  const idlPath = path.join(__dirname, "../target/idl/defipoly_program.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  
  return new Program(idl, provider);
}

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

// Command: Buy properties
async function buyProperties(walletIds: number[], propertyId: number) {
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");

  console.log(`🏠 Buying property ${propertyId} for ${walletIds.length} wallets...`);

  for (const id of walletIds) {
    try {
      const wallet = loadWallet(id);
      const program = await getProgram(connection, wallet);
      
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [propertyPDA] = getPropertyPDA(propertyId);
      const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
      
      const playerTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        wallet.publicKey
      );

      await program.methods
        .buyProperty()
        .accountsPartial({
          property: propertyPDA,
          playerAccount: playerPDA,
          ownership: ownershipPDA,
          player: wallet.publicKey,
          playerTokenAccount,
          gameConfig: GAME_CONFIG,
          rewardPoolVault: REWARD_POOL,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log(`  Wallet ${id}: ✅ Bought property ${propertyId}`);
    } catch (error: any) {
      console.log(`  Wallet ${id}: ❌ Error: ${error?.message || error}`);
    }
  }
}

// Command: Activate shields
async function activateShields(walletIds: number[], propertyId: number) {
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");

  console.log(`🛡️  Activating shields for property ${propertyId}...`);

  for (const id of walletIds) {
    try {
      const wallet = loadWallet(id);
      const program = await getProgram(connection, wallet);
      
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      const [propertyPDA] = getPropertyPDA(propertyId);
      const [ownershipPDA] = getOwnershipPDA(wallet.publicKey, propertyId);
      
      const playerTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        wallet.publicKey
      );

      await program.methods
        .activateShield()
        .accountsPartial({
          ownership: ownershipPDA,
          property: propertyPDA,
          playerAccount: playerPDA,
          player: wallet.publicKey,
          playerTokenAccount,
          gameConfig: GAME_CONFIG,
          rewardPoolVault: REWARD_POOL,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log(`  Wallet ${id}: ✅ Shield activated`);
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
    try {
      const wallet = loadWallet(id);
      const program = await getProgram(connection, wallet);
      
      const [playerPDA] = getPlayerPDA(wallet.publicKey);
      
      const playerTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        wallet.publicKey
      );

      await program.methods
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

      console.log(`  Wallet ${id}: ✅ Rewards claimed`);
    } catch (error: any) {
      console.log(`  Wallet ${id}: ❌ Error: ${error?.message || error}`);
    }
  }
}

// Command: Get wallet info
async function getWalletInfo(walletId: number) {
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");
  
  const wallet = loadWallet(walletId);
  const program = await getProgram(connection, wallet);
  
  console.log(`\n📊 Wallet ${walletId} Info:`);
  console.log(`   Address: ${wallet.publicKey.toString()}`);
  
  // SOL balance
  const solBalance = await connection.getBalance(wallet.publicKey);
  console.log(`   SOL: ${solBalance / anchor.web3.LAMPORTS_PER_SOL}`);
  
  // Token balance
  const tokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, wallet.publicKey);
  try {
    const tokenAccountInfo = await connection.getTokenAccountBalance(tokenAccount);
    console.log(`   Tokens: ${tokenAccountInfo.value.uiAmount}`);
  } catch {
    console.log(`   Tokens: 0 (no account)`);
  }
  
  // Player data
  const [playerPDA] = getPlayerPDA(wallet.publicKey);
  try {
    const playerData = await (program.account as any).playerAccount.fetch(playerPDA);
    console.log(`   Properties owned: ${playerData.totalPropertiesOwned}`);
    console.log(`   Daily income: ${playerData.totalDailyIncome}`);
  } catch {
    console.log(`   Player: Not initialized`);
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
      const walletIds = args[2] === "all"
        ? Array.from({ length: 50 }, (_, i) => i)
        : args.slice(2).map(Number);
      await buyProperties(walletIds, propertyId);
      break;
    }
    
    case "shield": {
      const propertyId = Number(args[1]);
      const walletIds = args[2] === "all"
        ? Array.from({ length: 50 }, (_, i) => i)
        : args.slice(2).map(Number);
      await activateShields(walletIds, propertyId);
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
    
    default:
      console.log(`
🎮 Defipoly Bot CLI

Usage:
  tsx scripts/bot-interactions.ts <command> [options]

Commands:
  init <wallets>              Initialize players
  buy <propertyId> <wallets>  Buy properties
  shield <propertyId> <wallets> Activate shields
  claim <wallets>             Claim rewards
  info <walletId>             Get wallet info

Wallet Options:
  all                         All 50 wallets
  0 1 2 3                    Specific wallet IDs (space-separated)

Examples:
  tsx scripts/bot-interactions.ts init all
  tsx scripts/bot-interactions.ts buy 0 0 1 2 3 4
  tsx scripts/bot-interactions.ts claim all
  tsx scripts/bot-interactions.ts info 5
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