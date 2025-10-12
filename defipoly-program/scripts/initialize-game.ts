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
  const idlPath = path.join(__dirname, "../target/idl/memeopoly_program.json");
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
      price: "1000000000000",      // 1,000 tokens
      yieldBps: 1000,               // 10% daily yield
      shieldCostBps: 500,           // 5% shield cost
      cooldown: 60,                 // 1 min cooldown
      name: "Mediterranean Avenue" 
    },
    { 
      id: 1, 
      setId: 0, 
      maxSlots: 100, 
      maxPerPlayer: 50, 
      price: "1500000000000",       // 1,500 tokens
      yieldBps: 1000, 
      shieldCostBps: 500, 
      cooldown: 60, 
      name: "Baltic Avenue" 
    },
    
    // ========== SET 1: LIGHT BLUE (3 properties) ==========
    { 
      id: 2, 
      setId: 1, 
      maxSlots: 90, 
      maxPerPlayer: 45, 
      price: "2000000000000",       // 2,000 tokens
      yieldBps: 1100,               // 11% daily yield
      shieldCostBps: 500, 
      cooldown: 120,                // 2 min cooldown
      name: "Oriental Avenue" 
    },
    { 
      id: 3, 
      setId: 1, 
      maxSlots: 90, 
      maxPerPlayer: 45, 
      price: "2500000000000",       // 2,500 tokens
      yieldBps: 1100, 
      shieldCostBps: 500, 
      cooldown: 120, 
      name: "Vermont Avenue" 
    },
    { 
      id: 4, 
      setId: 1, 
      maxSlots: 90, 
      maxPerPlayer: 45, 
      price: "3000000000000",       // 3,000 tokens
      yieldBps: 1100, 
      shieldCostBps: 500, 
      cooldown: 120, 
      name: "Connecticut Avenue" 
    },
    
    // ========== SET 2: PINK (3 properties) ==========
    { 
      id: 5, 
      setId: 2, 
      maxSlots: 80, 
      maxPerPlayer: 40, 
      price: "5000000000000",       // 5,000 tokens
      yieldBps: 1200,               // 12% daily yield
      shieldCostBps: 500, 
      cooldown: 180,                // 3 min cooldown
      name: "St. Charles Place" 
    },
    { 
      id: 6, 
      setId: 2, 
      maxSlots: 80, 
      maxPerPlayer: 40, 
      price: "5500000000000",       // 5,500 tokens
      yieldBps: 1200, 
      shieldCostBps: 500, 
      cooldown: 180, 
      name: "States Avenue" 
    },
    { 
      id: 7, 
      setId: 2, 
      maxSlots: 80, 
      maxPerPlayer: 40, 
      price: "6000000000000",       // 6,000 tokens
      yieldBps: 1200, 
      shieldCostBps: 500, 
      cooldown: 180, 
      name: "Virginia Avenue" 
    },

    // ========== SET 3: ORANGE (3 properties) ==========
    { 
      id: 8, 
      setId: 3, 
      maxSlots: 70, 
      maxPerPlayer: 35, 
      price: "10000000000000",      // 10,000 tokens
      yieldBps: 1300,               // 13% daily yield
      shieldCostBps: 500, 
      cooldown: 240,                // 4 min cooldown
      name: "St. James Place" 
    },
    { 
      id: 9, 
      setId: 3, 
      maxSlots: 70, 
      maxPerPlayer: 35, 
      price: "11000000000000",      // 11,000 tokens
      yieldBps: 1300, 
      shieldCostBps: 500, 
      cooldown: 240, 
      name: "Tennessee Avenue" 
    },
    { 
      id: 10, 
      setId: 3, 
      maxSlots: 70, 
      maxPerPlayer: 35, 
      price: "12000000000000",      // 12,000 tokens
      yieldBps: 1300, 
      shieldCostBps: 500, 
      cooldown: 240, 
      name: "New York Avenue" 
    },

    // ========== SET 4: RED (3 properties) ==========
    { 
      id: 11, 
      setId: 4, 
      maxSlots: 60, 
      maxPerPlayer: 30, 
      price: "15000000000000",      // 15,000 tokens
      yieldBps: 1400,               // 14% daily yield
      shieldCostBps: 500, 
      cooldown: 300,                // 5 min cooldown
      name: "Kentucky Avenue" 
    },
    { 
      id: 12, 
      setId: 4, 
      maxSlots: 60, 
      maxPerPlayer: 30, 
      price: "16000000000000",      // 16,000 tokens
      yieldBps: 1400, 
      shieldCostBps: 500, 
      cooldown: 300, 
      name: "Indiana Avenue" 
    },
    { 
      id: 13, 
      setId: 4, 
      maxSlots: 60, 
      maxPerPlayer: 30, 
      price: "17000000000000",      // 17,000 tokens
      yieldBps: 1400, 
      shieldCostBps: 500, 
      cooldown: 300, 
      name: "Illinois Avenue" 
    },

    // ========== SET 5: YELLOW (3 properties) ==========
    { 
      id: 14, 
      setId: 5, 
      maxSlots: 50, 
      maxPerPlayer: 25, 
      price: "20000000000000",      // 20,000 tokens
      yieldBps: 1500,               // 15% daily yield
      shieldCostBps: 500, 
      cooldown: 360,                // 6 min cooldown
      name: "Atlantic Avenue" 
    },
    { 
      id: 15, 
      setId: 5, 
      maxSlots: 50, 
      maxPerPlayer: 25, 
      price: "22000000000000",      // 22,000 tokens
      yieldBps: 1500, 
      shieldCostBps: 500, 
      cooldown: 360, 
      name: "Ventnor Avenue" 
    },
    { 
      id: 16, 
      setId: 5, 
      maxSlots: 50, 
      maxPerPlayer: 25, 
      price: "24000000000000",      // 24,000 tokens
      yieldBps: 1500, 
      shieldCostBps: 500, 
      cooldown: 360, 
      name: "Marvin Gardens" 
    },

    // ========== SET 6: GREEN (3 properties) ==========
    { 
      id: 17, 
      setId: 6, 
      maxSlots: 40, 
      maxPerPlayer: 20, 
      price: "30000000000000",      // 30,000 tokens
      yieldBps: 1600,               // 16% daily yield
      shieldCostBps: 500, 
      cooldown: 420,                // 7 min cooldown
      name: "Pacific Avenue" 
    },
    { 
      id: 18, 
      setId: 6, 
      maxSlots: 40, 
      maxPerPlayer: 20, 
      price: "32000000000000",      // 32,000 tokens
      yieldBps: 1600, 
      shieldCostBps: 500, 
      cooldown: 420, 
      name: "North Carolina Avenue" 
    },
    { 
      id: 19, 
      setId: 6, 
      maxSlots: 40, 
      maxPerPlayer: 20, 
      price: "35000000000000",      // 35,000 tokens
      yieldBps: 1600, 
      shieldCostBps: 500, 
      cooldown: 420, 
      name: "Pennsylvania Avenue" 
    },

    // ========== SET 7: DARK BLUE (2 properties) ==========
    { 
      id: 20, 
      setId: 7, 
      maxSlots: 30, 
      maxPerPlayer: 15, 
      price: "50000000000000",      // 50,000 tokens
      yieldBps: 1700,               // 17% daily yield
      shieldCostBps: 500, 
      cooldown: 480,                // 8 min cooldown
      name: "Park Place" 
    },
    { 
      id: 21, 
      setId: 7, 
      maxSlots: 30, 
      maxPerPlayer: 15, 
      price: "70000000000000",      // 70,000 tokens
      yieldBps: 1700, 
      shieldCostBps: 500, 
      cooldown: 480, 
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