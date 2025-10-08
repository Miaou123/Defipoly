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

  // Load IDL from file
  const idlPath = path.join(__dirname, "../target/idl/defipoly_program.json");
  const idlString = fs.readFileSync(idlPath, "utf8");
  const idl = JSON.parse(idlString);
  
  const programId = new anchor.web3.PublicKey(idl.address);
  const program = new anchor.Program(idl, provider);

  const authority = provider.wallet.publicKey;
  const payer = walletKeypair;

  console.log("Initializing Defipoly Game on Devnet...");
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
    9
  );
  console.log("✓ Token Mint:", tokenMint.toString());

  // Step 2: Initialize game
  console.log("\n2. Initializing game config...");
  const [gameConfig] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("game_config")],
    programId
  );

  const initialRewardPool = new BN("500000000000000000");

  await program.methods
    .initializeGame(initialRewardPool)
    .accountsPartial({
      tokenMint,
      authority,
    })
    .rpc();
  console.log("✓ Game Config:", gameConfig.toString());

  // Step 3: Initialize properties
  console.log("\n3. Initializing properties...");
  
  const properties = [
    { id: 0, tier: { bronze: {} }, count: 10, slots: 100, price: "1000000000000", income: "100000000000", shield: 500, name: "Bronze Basic" },
    { id: 1, tier: { bronze: {} }, count: 8, slots: 80, price: "1500000000000", income: "150000000000", shield: 500, name: "Bronze Plus" },
    { id: 2, tier: { silver: {} }, count: 6, slots: 60, price: "5000000000000", income: "600000000000", shield: 500, name: "Silver Basic" },
    { id: 3, tier: { silver: {} }, count: 5, slots: 50, price: "7000000000000", income: "850000000000", shield: 500, name: "Silver Plus" },
    { id: 4, tier: { gold: {} }, count: 4, slots: 40, price: "15000000000000", income: "2000000000000", shield: 500, name: "Gold Basic" },
    { id: 5, tier: { gold: {} }, count: 3, slots: 30, price: "20000000000000", income: "2700000000000", shield: 500, name: "Gold Plus" },
    { id: 6, tier: { platinum: {} }, count: 2, slots: 20, price: "50000000000000", income: "7000000000000", shield: 500, name: "Platinum Basic" },
    { id: 7, tier: { platinum: {} }, count: 1, slots: 10, price: "100000000000000", income: "15000000000000", shield: 500, name: "Platinum Elite" },
  ];

  for (const prop of properties) {
    await program.methods
      .initializeProperty(
        prop.id,
        prop.tier,
        prop.count,
        prop.slots,
        new BN(prop.price),
        new BN(prop.income),
        prop.shield
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
    console.log(`✓ Property ${prop.id} (${prop.name}):`, propertyPda.toString());
  }

  const [rewardPoolVault] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("reward_pool_vault"), gameConfig.toBuffer()],
    programId
  );

  console.log("\n✅ Game initialization complete!");
  console.log("\n📝 SAVE THESE ADDRESSES:");
  console.log("=".repeat(60));
  console.log("Program ID:   ", programId.toString());
  console.log("Token Mint:   ", tokenMint.toString());
  console.log("Game Config:  ", gameConfig.toString());
  console.log("Reward Pool:  ", rewardPoolVault.toString());
  console.log("=".repeat(60));
  console.log("\n💡 Next: Build your frontend using these addresses!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });