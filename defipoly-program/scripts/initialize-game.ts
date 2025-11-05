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

// Load environment variables from monorepo root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const DEV_WALLET = new anchor.web3.PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");

async function main() {
  // Set defaults for environment
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
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

  // Step 2: Initialize game
  console.log("\n2. Initializing game config...");
  const [gameConfig] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("game_config")],
    programId
  );

  const initialRewardPool = new BN("200000000000000000"); // 200M tokens

  try {
    await program.methods
      .initializeGame(initialRewardPool)
      .accountsPartial({
        tokenMint,
        authority,
        devWallet: DEV_WALLET, 
      })
      .rpc();
    console.log("✓ Game Config:", gameConfig.toString());
  } catch (error) {
    console.log("⚠️ Game config may already exist");
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

      const [setCooldownPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("set_cooldown"), Buffer.from([prop.setId]), authority.toBuffer()],
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
        .accountsPartial({
          property: propertyPDA,
          setCooldown: setCooldownPDA,
          gameConfig,
          authority,
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

  // Step 4: Save deployment info for generate-constants.ts
  const deploymentInfo = {
    programId: programId.toString(),
    tokenMint: tokenMint.toString(),
    gameConfig: gameConfig.toString(),
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
  console.log(`Initial Reward Pool: ${(Number(initialRewardPool) / 1e9).toLocaleString()} MEME`);
  console.log(`\n🎮 Next step: Run 'npm run generate:constants' to update frontend constants`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });