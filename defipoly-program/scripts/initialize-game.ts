// ============================================
// FILE: defipoly-program/scripts/initialize-game.ts
// Initializes the game on-chain using property-config.ts
// ============================================

import * as anchor from "@coral-xyz/anchor";
import { createMint } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import BN from "bn.js";
import dotenv from 'dotenv';
import { PROPERTY_CONFIG, toDeploymentFormat, getPropertyStats } from "./property-config.js";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const DEV_WALLET = new anchor.web3.PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");
const MARKETING_WALLET = new anchor.web3.PublicKey("FoPKSQ5HDSVyZgaQobX64YEBVQ2iiKMZp8VHWtd6jLQE");

async function main() {
  // Set defaults for environment
  const rpcUrl = process.env.RPC_URL || "https://api.devnet.solana.com";
  const walletPath = process.env.ANCHOR_WALLET || path.join(homedir(), ".config/solana/id.json");
  
  // Create connection and wallet
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");
  const walletKeypair = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  const wallet = new anchor.Wallet(walletKeypair);
  
  // Create provider
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load the correct IDL
  const idlPath = path.join(__dirname, "../target/idl/defipoly_program.json");
  const idlString = fs.readFileSync(idlPath, "utf8");
  const idl = JSON.parse(idlString);
  
  const programId = new anchor.web3.PublicKey(idl.address);
  const program = new anchor.Program(idl, provider);

  const authority = provider.wallet.publicKey;
  const payer = walletKeypair;

  console.log("🚀 Initializing Defipoly Game on Devnet...");
  console.log("Program ID:", programId.toString());
  console.log("Authority:", authority.toString());
  console.log("RPC URL:", rpcUrl);

  // Step 1: Create token mint
  console.log("\n1. Creating game token...");
  const tokenMint = await createMint(
    provider.connection,
    payer,
    authority,
    null,
    9 // 9 decimals
  );
  console.log("✓ Token Mint:", tokenMint.toString());

  // Step 2: Initialize game config
  console.log("\n2. Initializing game config...");
  
  // Derive all required PDAs
  const [gameConfig] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("game_config")],
    programId
  );

  const [rewardPoolVault] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("reward_pool_vault"), gameConfig.toBuffer()],
    programId
  );

  // Derive associated token accounts
  const devTokenAccount = anchor.utils.token.associatedAddress({
    mint: tokenMint,
    owner: DEV_WALLET,
  });

  const marketingTokenAccount = anchor.utils.token.associatedAddress({
    mint: tokenMint,
    owner: MARKETING_WALLET,
  });

  const initialRewardPool = new BN("200000000000000000"); // 200M tokens

  try {
    const tx = await program.methods
      .initializeGame(initialRewardPool)
      .accounts({
        gameConfig,
        tokenMint,
        rewardPoolVault,
        devTokenAccount,
        devWallet: DEV_WALLET,
        marketingTokenAccount,
        marketingWallet: MARKETING_WALLET,
        authority,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    
    console.log("✅ Game Config initialized!");
    console.log("   Address:", gameConfig.toString());
    console.log("   Transaction:", tx);
  } catch (error: any) {
    // Check if already initialized
    if (error.message?.includes("already in use") || 
        error.logs?.some((log: string) => log.includes("already in use"))) {
      console.log("⚠️ Game config already exists (skipping)");
      console.log("   Address:", gameConfig.toString());
    } else {
      console.error("❌ Failed to initialize game config:");
      console.error("   Error:", error.message);
      if (error.logs) {
        console.error("   Program logs:");
        error.logs.forEach((log: string) => console.error("     ", log));
      }
      throw error;
    }
  }

  // Step 3: Initialize all properties from PROPERTY_CONFIG
  console.log("\n3. Initializing all properties from property-config.ts...");
  
  const properties = PROPERTY_CONFIG.map(toDeploymentFormat);
  const stats = getPropertyStats();

  console.log("\n📊 Economic Model Verification:");
  console.log(`Total Properties: ${stats.totalProperties}`);
  console.log(`Total Slots: ${stats.totalSlots.toLocaleString()}`);
  console.log(`Total Market Cap: ${(stats.totalMarketCap / 1_000_000).toFixed(2)}M MEME`);
  console.log(`Total Sets: ${stats.sets}\n`);

  // Initialize each property
  for (const prop of properties) {
    try {
      const [propertyPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("property"), Buffer.from([prop.id])],
        programId
      );

      await program.methods
        .initializeProperty(
          prop.id,
          prop.setId,
          prop.maxSlots,
          prop.maxPerPlayer,
          new BN(prop.price),
          prop.yieldBps,
          prop.shieldCostBps,
          new BN(prop.cooldown)
        )
        .accounts({
          property: propertyPDA,
          gameConfig,
          authority,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log(`✓ ${prop.name} (ID ${prop.id}): ${prop.maxSlots} slots @ ${Number(prop.price) / 1e9} MEME`);
    } catch (error: any) {
      if (error.toString().includes("already in use")) {
        console.log(`⚠️ ${prop.name} already initialized`);
      } else {
        console.error(`❌ Error initializing ${prop.name}:`, error.message);
      }
    }
  }

  // Step 4: Set accumulation bonus tiers
  console.log("\n4. Setting accumulation bonus tiers...");

  const DECIMALS = 1_000_000_000; // 9 decimals based on your token

  try {
    await program.methods
      .adminUpdateAccumulationBonusV2(
        new BN(10_000 * DECIMALS),    // Tier 1: 10k tokens
        100,                           // 1% bonus
        new BN(25_000 * DECIMALS),   // Tier 2: 25k tokens
        250,                          // 2.5% bonus
        new BN(50_000 * DECIMALS),   // Tier 3: 50k tokens
        500,                          // 5% bonus
        new BN(100_000 * DECIMALS),   // Tier 4: 100k tokens
        1000,                          // 10% bonus
        new BN(250_000 * DECIMALS), // Tier 5: 250k tokens
        1500,                          // 15% bonus
        new BN(500_000 * DECIMALS), // Tier 5: 500k tokens
        2000,                          // 20% bonus
        new BN(1_000_000 * DECIMALS), // Tier 5: 1M tokens
        2500,                          // 25% bonus
        new BN(2_500_000 * DECIMALS), // Tier 5: 2.5M tokens
        4000,                          // 40% bonus
      )
      .accounts({
        gameConfig,
        authority,
      })
      .rpc();

    console.log("✅ Accumulation bonuses set!");
    console.log("   Tier 1: 50k tokens → 5% bonus");
    console.log("   Tier 2: 100k tokens → 10% bonus");
    console.log("   Tier 3: 250k tokens → 15% bonus");
    console.log("   Tier 4: 500k tokens → 20% bonus");
    console.log("   Tier 5: 1M tokens → 25% bonus");
  } catch (error: any) {
    console.error("❌ Failed to set accumulation bonuses:", error.message);
  }

  // Step 5: Save deployment info for generate-constants.ts
  const deploymentInfo = {
    programId: programId.toString(),
    tokenMint: tokenMint.toString(),
    gameConfig: gameConfig.toString(),
    rewardPoolVault: rewardPoolVault.toString(),
    rewardPool: initialRewardPool.toString(),
    deployedAt: new Date().toISOString(),
    network: rpcUrl.includes("devnet") ? "devnet" : "mainnet",
  };

  const deploymentPath = path.join(__dirname, "deployment-info.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n✓ Saved deployment info to:", deploymentPath);

  console.log("\n✅ Game initialization complete!");
  console.log("\n📋 Summary:");
  console.log(`Token Mint: ${tokenMint.toString()}`);
  console.log(`Game Config: ${gameConfig.toString()}`);
  console.log(`Reward Pool Vault: ${rewardPoolVault.toString()}`);
  console.log(`Initial Reward Pool: ${(Number(initialRewardPool) / 1e9).toLocaleString()} MEME`);
  console.log(`\n🎮 Next step: Run 'npm run generate:constants' to update frontend constants`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });