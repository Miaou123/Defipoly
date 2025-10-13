import * as anchor from "@coral-xyz/anchor";
import { createMint } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import BN from "bn.js";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

  console.log("🚀 Initializing Memeopoly Game on Devnet...");
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

  const initialRewardPool = new BN("500000000000000000"); // 500M tokens

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

  // Step 3: Initialize all 22 properties
  console.log("\n3. Initializing all 22 properties...");
  
  const properties = [
    // ========== SET 0: BROWN (2 properties) ==========
    {
      id: 0,
      setId: 0,
      maxSlots: 100,
      maxPerPlayer: 50,
      price: "1000000000000", // 1,000 tokens
      yieldBps: 1000, // 10% daily yield
      shieldCostBps: 2000, // 20% shield cost
      cooldown: 1 * 3600, // 1 hour
      name: "Mediterranean Avenue"
    },
    {
      id: 1,
      setId: 0,
      maxSlots: 100,
      maxPerPlayer: 50,
      price: "1500000000000", // 1,500 tokens
      yieldBps: 1000, // 10% daily yield
      shieldCostBps: 2000, // 20% shield cost
      cooldown: 1 * 3600, // 1 hour
      name: "Baltic Avenue"
    },
  
    // ========== SET 1: LIGHT BLUE (3 properties) ==========
    {
      id: 2,
      setId: 1,
      maxSlots: 90,
      maxPerPlayer: 45,
      price: "2000000000000", // 2,000 tokens
      yieldBps: 1100, // 11% daily yield
      shieldCostBps: 1800, // 18% shield cost
      cooldown: 2 * 3600, // 2 hours
      name: "Oriental Avenue"
    },
    {
      id: 3,
      setId: 1,
      maxSlots: 90,
      maxPerPlayer: 45,
      price: "2500000000000", // 2,500 tokens
      yieldBps: 1100, // 11% daily yield
      shieldCostBps: 1800, // 18% shield cost
      cooldown: 2 * 3600, // 2 hours
      name: "Vermont Avenue"
    },
    {
      id: 4,
      setId: 1,
      maxSlots: 90,
      maxPerPlayer: 45,
      price: "3000000000000", // 3,000 tokens
      yieldBps: 1100, // 11% daily yield
      shieldCostBps: 1800, // 18% shield cost
      cooldown: 2 * 3600, // 2 hours
      name: "Connecticut Avenue"
    },
  
    // ========== SET 2: PINK (3 properties) ==========
    {
      id: 5,
      setId: 2,
      maxSlots: 80,
      maxPerPlayer: 40,
      price: "3500000000000", // 3,500 tokens
      yieldBps: 1200, // 12% daily yield
      shieldCostBps: 1600, // 16% shield cost
      cooldown: 4 * 3600, // 4 hours
      name: "St. Charles Place"
    },
    {
      id: 6,
      setId: 2,
      maxSlots: 80,
      maxPerPlayer: 40,
      price: "4000000000000", // 4,000 tokens
      yieldBps: 1200, // 12% daily yield
      shieldCostBps: 1600, // 16% shield cost
      cooldown: 4 * 3600, // 4 hours
      name: "States Avenue"
    },
    {
      id: 7,
      setId: 2,
      maxSlots: 80,
      maxPerPlayer: 40,
      price: "4500000000000", // 4,500 tokens
      yieldBps: 1200, // 12% daily yield
      shieldCostBps: 1600, // 16% shield cost
      cooldown: 4 * 3600, // 4 hours
      name: "Virginia Avenue"
    },
  
    // ========== SET 3: ORANGE (3 properties) ==========
    {
      id: 8,
      setId: 3,
      maxSlots: 70,
      maxPerPlayer: 35,
      price: "5000000000000", // 5,000 tokens
      yieldBps: 1300, // 13% daily yield
      shieldCostBps: 1400, // 14% shield cost
      cooldown: 4 * 3600, // 4 hours
      name: "St. James Place"
    },
    {
      id: 9,
      setId: 3,
      maxSlots: 70,
      maxPerPlayer: 35,
      price: "5500000000000", // 5,500 tokens
      yieldBps: 1300, // 13% daily yield
      shieldCostBps: 1400, // 14% shield cost
      cooldown: 4 * 3600, // 4 hours
      name: "Tennessee Avenue"
    },
    {
      id: 10,
      setId: 3,
      maxSlots: 70,
      maxPerPlayer: 35,
      price: "6000000000000", // 6,000 tokens
      yieldBps: 1300, // 13% daily yield
      shieldCostBps: 1400, // 14% shield cost
      cooldown: 4 * 3600, // 4 hours
      name: "New York Avenue"
    },
  
    // ========== SET 4: RED (3 properties) ==========
    {
      id: 11,
      setId: 4,
      maxSlots: 60,
      maxPerPlayer: 30,
      price: "7000000000000", // 7,000 tokens
      yieldBps: 1400, // 14% daily yield
      shieldCostBps: 1200, // 12% shield cost
      cooldown: 5 * 3600, // 5 hours
      name: "Kentucky Avenue"
    },
    {
      id: 12,
      setId: 4,
      maxSlots: 60,
      maxPerPlayer: 30,
      price: "7500000000000", // 7,500 tokens
      yieldBps: 1400, // 14% daily yield
      shieldCostBps: 1200, // 12% shield cost
      cooldown: 5 * 3600, // 5 hours
      name: "Indiana Avenue"
    },
    {
      id: 13,
      setId: 4,
      maxSlots: 60,
      maxPerPlayer: 30,
      price: "8000000000000", // 8,000 tokens
      yieldBps: 1400, // 14% daily yield
      shieldCostBps: 1200, // 12% shield cost
      cooldown: 5 * 3600, // 5 hours
      name: "Illinois Avenue"
    },
  
    // ========== SET 5: YELLOW (3 properties) ==========
    {
      id: 14,
      setId: 5,
      maxSlots: 50,
      maxPerPlayer: 25,
      price: "9000000000000", // 9,000 tokens
      yieldBps: 1500, // 15% daily yield
      shieldCostBps: 1000, // 10% shield cost
      cooldown: 6 * 3600, // 6 hours
      name: "Atlantic Avenue"
    },
    {
      id: 15,
      setId: 5,
      maxSlots: 50,
      maxPerPlayer: 25,
      price: "9500000000000", // 9,500 tokens
      yieldBps: 1500, // 15% daily yield
      shieldCostBps: 1000, // 10% shield cost
      cooldown: 6 * 3600, // 6 hours
      name: "Ventnor Avenue"
    },
    {
      id: 16,
      setId: 5,
      maxSlots: 50,
      maxPerPlayer: 25,
      price: "10000000000000", // 10,000 tokens
      yieldBps: 1500, // 15% daily yield
      shieldCostBps: 1000, // 10% shield cost
      cooldown: 6 * 3600, // 6 hours
      name: "Marvin Gardens"
    },
  
    // ========== SET 6: GREEN (3 properties) ==========
    {
      id: 17,
      setId: 6,
      maxSlots: 40,
      maxPerPlayer: 20,
      price: "12000000000000", // 12,000 tokens
      yieldBps: 1600, // 16% daily yield
      shieldCostBps: 800, // 8% shield cost
      cooldown: 7 * 3600, // 7 hours
      name: "Pacific Avenue"
    },
    {
      id: 18,
      setId: 6,
      maxSlots: 40,
      maxPerPlayer: 20,
      price: "13000000000000", // 13,000 tokens
      yieldBps: 1600, // 16% daily yield
      shieldCostBps: 800, // 8% shield cost
      cooldown: 7 * 3600, // 7 hours
      name: "North Carolina Avenue"
    },
    {
      id: 19,
      setId: 6,
      maxSlots: 40,
      maxPerPlayer: 20,
      price: "14000000000000", // 14,000 tokens
      yieldBps: 1600, // 16% daily yield
      shieldCostBps: 800, // 8% shield cost
      cooldown: 7 * 3600, // 7 hours
      name: "Pennsylvania Avenue"
    },
  
    // ========== SET 7: DARK BLUE (2 properties) ==========
    {
      id: 20,
      setId: 7,
      maxSlots: 30,
      maxPerPlayer: 15,
      price: "17000000000000", // 17,000 tokens
      yieldBps: 1800, // 18% daily yield
      shieldCostBps: 600, // 6% shield cost
      cooldown: 24 * 3600, // 24 hours
      name: "Park Place"
    },
    {
      id: 21,
      setId: 7,
      maxSlots: 30,
      maxPerPlayer: 15,
      price: "20000000000000", // 20,000 tokens
      yieldBps: 1800, // 18% daily yield
      shieldCostBps: 600, // 6% shield cost
      cooldown: 24 * 3600, // 24 hours
      name: "Boardwalk"
    },
  ];

  // Initialize each property
  for (const prop of properties) {
    try {
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
          authority,
          gameConfig,
        })
        .rpc();
      
      const [propertyPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("property"), Buffer.from([prop.id])],
        programId
      );
      console.log(`✓ Property ${prop.id.toString().padStart(2, '0')} (${prop.name})`);
    } catch (error) {
      console.log(`⚠️ Property ${prop.id} (${prop.name}) - may already exist`);
    }
  }

  const [rewardPoolVault] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("reward_pool_vault"), gameConfig.toBuffer()],
    programId
  );

  console.log("\n" + "=".repeat(80));
  console.log("✅ GAME INITIALIZATION COMPLETE!");
  console.log("=".repeat(80));
  
  console.log("\n📝 COPY THESE TO defipoly-frontend/src/utils/constants.ts:");
  console.log("─".repeat(80));
  console.log(`export const PROGRAM_ID = new PublicKey("${programId.toString()}");`);
  console.log(`export const TOKEN_MINT = new PublicKey("${tokenMint.toString()}");`);
  console.log(`export const GAME_CONFIG = new PublicKey("${gameConfig.toString()}");`);
  console.log(`export const REWARD_POOL = new PublicKey("${rewardPoolVault.toString()}");`);
  console.log("─".repeat(80));
  
  console.log("\n📊 GAME STATISTICS:");
  console.log(`   Total Properties: ${properties.length}`);
  console.log(`   Property Sets: 8`);
  console.log(`   Price Range: ${parseInt(properties[0].price) / 1e12} - ${parseInt(properties[properties.length-1].price) / 1e12} tokens`);
  console.log(`   Yield Range: ${properties[0].yieldBps / 100}% - ${properties[properties.length-1].yieldBps / 100}% daily`);
  
  console.log("\n💡 NEXT STEPS:");
  console.log("   1. Copy the addresses above to your frontend constants.ts");
  console.log("   2. Update PROPERTIES array in constants.ts to match these 22 properties");
  console.log("   3. Mint tokens to players for testing");
  console.log("   4. Start your frontend: cd ../defipoly-frontend && npm run dev");
  console.log("\n" + "=".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ ERROR:", err);
    process.exit(1);
  });