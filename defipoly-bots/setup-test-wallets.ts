import * as anchor from "@coral-xyz/anchor";
import { 
  createAssociatedTokenAccountInstruction, 
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  createTransferInstruction
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN_MINT = new anchor.web3.PublicKey(process.env.TOKEN_MINT || "8SVK8CUtNbwCsBz1NUtdeCKbMN4kn9h7AoMc6MvmgGrN");
const WALLETS_DIR = path.join(__dirname, "test-wallets");

async function main() {
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const walletPath = process.env.ANCHOR_WALLET || path.join(homedir(), ".config/solana/id.json");
  
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");
  const mainWallet = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  console.log("🚀 Setting up 50 test wallets...");
  console.log("Main wallet:", mainWallet.publicKey.toString());
  console.log("Wallets directory:", WALLETS_DIR);

  const wallets = [];

  // Step 1: Load existing wallets or generate new ones
  const existingWallets = fs.existsSync(WALLETS_DIR) 
    ? fs.readdirSync(WALLETS_DIR).filter(f => f.startsWith('wallet-') && f.endsWith('.json'))
    : [];

  if (existingWallets.length === 50) {
    console.log("\n📂 Loading existing wallets...");
    for (let i = 0; i < 50; i++) {
      const walletPath = path.join(WALLETS_DIR, `wallet-${i}.json`);
      const walletData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
      const wallet = anchor.web3.Keypair.fromSecretKey(Buffer.from(walletData.secretKey));
      wallets.push(wallet);
    }
    console.log(`✅ Loaded 50 existing wallets from ${WALLETS_DIR}/`);
  } else {
    console.log("\n📝 Generating new wallets...");
    
    // Create wallets directory if it doesn't exist
    if (!fs.existsSync(WALLETS_DIR)) {
      fs.mkdirSync(WALLETS_DIR, { recursive: true });
    }
    
    for (let i = 0; i < 50; i++) {
      const wallet = anchor.web3.Keypair.generate();
      wallets.push(wallet);
      
      // Save wallet to file
      const walletData = {
        publicKey: wallet.publicKey.toString(),
        secretKey: Array.from(wallet.secretKey),
      };
      fs.writeFileSync(
        path.join(WALLETS_DIR, `wallet-${i}.json`),
        JSON.stringify(walletData, null, 2)
      );
    }
    console.log(`✅ Generated 50 wallets in ${WALLETS_DIR}/`);
  }

  // Step 2: Check and fund wallets with SOL (smart funding)
  console.log("\n💰 Checking wallet balances...");
  
  const mainBalance = await connection.getBalance(mainWallet.publicKey);
  console.log(`Main wallet balance: ${(mainBalance / anchor.web3.LAMPORTS_PER_SOL).toFixed(2)} SOL`);
  
  // Get all balances at once
  const balances = await Promise.all(
    wallets.map(w => connection.getBalance(w.publicKey))
  );
  
  let walletsNeedingFunding = 0;
  for (let i = 0; i < balances.length; i++) {
    const balanceSOL = balances[i] / anchor.web3.LAMPORTS_PER_SOL;
    if (balanceSOL < 0.05) {
      walletsNeedingFunding++;
    }
  }
  
  console.log(`Wallets needing funding (< 0.05 SOL): ${walletsNeedingFunding}/${wallets.length}`);
  
  if (walletsNeedingFunding === 0) {
    console.log("✅ All wallets already have sufficient SOL!");
  } else {
    console.log(`\n📤 Transferring 0.1 SOL to ${walletsNeedingFunding} wallets...`);
    const solNeeded = walletsNeedingFunding * 0.1;
    
    if (mainBalance < solNeeded * anchor.web3.LAMPORTS_PER_SOL) {
      console.log("⚠️  WARNING: Insufficient SOL in main wallet!");
      console.log(`   Need: ${solNeeded.toFixed(2)} SOL`);
      console.log(`   Have: ${(mainBalance / anchor.web3.LAMPORTS_PER_SOL).toFixed(2)} SOL`);
    }
    
    for (let i = 0; i < wallets.length; i++) {
      const balanceSOL = balances[i] / anchor.web3.LAMPORTS_PER_SOL;
      if (balanceSOL < 0.05) {
        try {
          const transferIx = anchor.web3.SystemProgram.transfer({
            fromPubkey: mainWallet.publicKey,
            toPubkey: wallets[i].publicKey,
            lamports: 0.1 * anchor.web3.LAMPORTS_PER_SOL,
          });
          
          const tx = new anchor.web3.Transaction().add(transferIx);
          await anchor.web3.sendAndConfirmTransaction(connection, tx, [mainWallet]);
          console.log(`  Wallet ${i}: ✅ Transferred 0.1 SOL`);
        } catch (error: any) {
          console.log(`  Wallet ${i}: ❌ Transfer failed: ${error?.message || error}`);
        }
        
        if (i % 5 === 4) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }

  // Step 3: Create token accounts and transfer tokens
  console.log("\n🪙 Setting up token accounts...");
  
  let walletsNeedingTokens = 0;
  const mainTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, mainWallet.publicKey);
  
  try {
    const mainTokenAccountInfo = await connection.getTokenAccountBalance(mainTokenAccount);
    const mainTokenBalance = Number(mainTokenAccountInfo.value.amount);
    console.log(`Main token balance: ${(mainTokenBalance / 1e9).toFixed(2)} tokens`);
  } catch {
    console.log("⚠️  Main wallet has no token account!");
  }

  for (let i = 0; i < wallets.length; i++) {
    try {
      const tokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, wallets[i].publicKey);
      
      let tokenAccountExists = false;
      try {
        await connection.getTokenAccountBalance(tokenAccount);
        tokenAccountExists = true;
      } catch {
        // Token account doesn't exist
      }
      
      if (!tokenAccountExists) {
        const createIx = createAssociatedTokenAccountInstruction(
          mainWallet.publicKey,
          tokenAccount,
          wallets[i].publicKey,
          TOKEN_MINT
        );
        
        const tx = new anchor.web3.Transaction().add(createIx);
        await anchor.web3.sendAndConfirmTransaction(connection, tx, [mainWallet]);
        console.log(`  Wallet ${i}: ✅ Created token account`);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Check token balance
      const balance = await connection.getTokenAccountBalance(tokenAccount);
      const balanceNum = Number(balance.value.amount);
      
      if (balanceNum < 100_000 * 1e9) {
        const transferAmount = 1_000_000 * 1e9;
        const transferIx = createTransferInstruction(
          mainTokenAccount,
          tokenAccount,
          mainWallet.publicKey,
          transferAmount,
          [],
          TOKEN_PROGRAM_ID
        );
        
        const transferTx = new anchor.web3.Transaction().add(transferIx);
        await anchor.web3.sendAndConfirmTransaction(connection, transferTx, [mainWallet]);
        console.log(`  Wallet ${i}: ✅ Transferred 1M tokens`);
        walletsNeedingTokens++;
      } else {
        console.log(`  Wallet ${i}: ⏭️  Already has tokens (${(balanceNum / 1e9).toFixed(0)})`);
      }
    } catch (error: any) {
      console.log(`  Wallet ${i}: ❌ Error: ${error?.message || error}`);
    }

    if (i % 5 === 4) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Create summary file
  const summary = {
    totalWallets: 50,
    walletsDir: WALLETS_DIR,
    tokenMint: TOKEN_MINT.toString(),
    wallets: wallets.map((w, i) => ({
      id: i,
      publicKey: w.publicKey.toString(),
      file: `wallet-${i}.json`,
    })),
  };

  fs.writeFileSync(
    path.join(WALLETS_DIR, "summary.json"),
    JSON.stringify(summary, null, 2)
  );

  console.log("\n✅ Setup complete!");
  console.log(`📂 Wallets saved to: ${WALLETS_DIR}/`);
  console.log(`📋 Summary saved to: ${WALLETS_DIR}/summary.json`);
  console.log("\n🎮 Next steps:");
  console.log("  1. Verify setup: tsx scripts/bot/bot-interactions.ts info 0");
  console.log("  2. Initialize players: npm run bot:init");
  console.log("  3. Start testing: tsx scripts/bot/bot-interactions.ts buy 0 1 all");
}

main()
  .then(() => process.exit(0))
  .catch((err: any) => {
    console.error("Error:", err);
    process.exit(1);
  });