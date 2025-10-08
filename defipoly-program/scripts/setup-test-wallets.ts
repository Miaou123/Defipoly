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

const TOKEN_MINT = new anchor.web3.PublicKey("743D9e7PCGgh2V3TY2tUeg31e63tmFjJ9rTZJkwhRVLX");
const WALLETS_DIR = "./test-wallets";

async function main() {
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const walletPath = process.env.ANCHOR_WALLET || path.join(homedir(), ".config/solana/id.json");
  
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");
  const mainWallet = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  console.log("🚀 Setting up 50 test wallets...");
  console.log("Main wallet:", mainWallet.publicKey.toString());

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
      console.log(`   Required: ${solNeeded.toFixed(1)} SOL`);
      console.log(`   Available: ${(mainBalance / anchor.web3.LAMPORTS_PER_SOL).toFixed(2)} SOL`);
      console.log("   Continuing with available funds...");
    }
    
    let funded = 0;
    for (let i = 0; i < wallets.length; i++) {
      const balanceSOL = balances[i] / anchor.web3.LAMPORTS_PER_SOL;
      
      if (balanceSOL >= 0.05) {
        console.log(`  Wallet ${i}: ⏭️  Has ${balanceSOL.toFixed(3)} SOL (skipping)`);
        continue;
      }
      
      try {
        const tx = new anchor.web3.Transaction().add(
          anchor.web3.SystemProgram.transfer({
            fromPubkey: mainWallet.publicKey,
            toPubkey: wallets[i].publicKey,
            lamports: 0.1 * anchor.web3.LAMPORTS_PER_SOL,
          })
        );
        await anchor.web3.sendAndConfirmTransaction(connection, tx, [mainWallet]);
        console.log(`  Wallet ${i}: ✅ Transferred 0.1 SOL`);
        funded++;
      } catch (error: any) {
        console.log(`  Wallet ${i}: ❌ Error: ${error?.message || error}`);
      }
      
      // Small delay every 10 transactions
      if (funded % 10 === 9) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    console.log(`✅ Funded ${funded} wallets with SOL`);
  }

  // Step 3: Create token accounts and transfer tokens (smart distribution)
  console.log("\n🪙 Setting up token accounts...");
  
  const mainTokenAccount = await getAssociatedTokenAddress(
    TOKEN_MINT,
    mainWallet.publicKey
  );

  // Check main wallet token balance
  let mainTokenBalance = 0;
  try {
    const mainTokenInfo = await connection.getTokenAccountBalance(mainTokenAccount);
    mainTokenBalance = Number(mainTokenInfo.value.amount);
    console.log(`Main wallet token balance: ${(mainTokenBalance / 1e9).toLocaleString()} tokens`);
  } catch (error) {
    console.log("⚠️  Main wallet has no token account or no tokens!");
    console.log("   Please mint tokens to your main wallet first:");
    console.log("   Run: npm run bot:mint");
    console.log("\n   Skipping token distribution...");
    
    // Save summary anyway
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

    console.log("\n✅ Wallet creation and SOL funding complete!");
    console.log(`📂 Wallets saved to: ${WALLETS_DIR}/`);
    console.log("\n⚠️  Next steps:");
    console.log("  1. Mint tokens to main wallet: npm run bot:mint");
    console.log("  2. Re-run setup to distribute tokens: npm run bot:setup");
    return;
  }

  const tokensNeeded = 50 * 1_000_000 * 1e9; // 50M tokens
  if (mainTokenBalance < tokensNeeded) {
    console.log(`⚠️  Insufficient tokens in main wallet!`);
    console.log(`   Required: ${(tokensNeeded / 1e9).toLocaleString()} tokens`);
    console.log(`   Available: ${(mainTokenBalance / 1e9).toLocaleString()} tokens`);
    console.log("\n   Please mint more tokens first: npm run bot:mint");
    console.log("   Continuing with token account creation only...\n");
  }

  let walletsNeedingTokens = 0;
  for (let i = 0; i < wallets.length; i++) {
    try {
      const tokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        wallets[i].publicKey
      );

      // Check if token account exists and has balance
      let currentBalance = 0;
      let accountExists = false;
      try {
        const tokenInfo = await connection.getTokenAccountBalance(tokenAccount);
        currentBalance = Number(tokenInfo.value.amount);
        accountExists = true;
        
        if (currentBalance >= 1_000_000 * 1e9) {
          console.log(`  Wallet ${i}: ⏭️  Has ${(currentBalance / 1e9).toLocaleString()} tokens (skipping)`);
          continue;
        }
      } catch {
        // Account doesn't exist
      }

      // Create token account if needed
      if (!accountExists) {
        const createIx = createAssociatedTokenAccountInstruction(
          mainWallet.publicKey,
          tokenAccount,
          wallets[i].publicKey,
          TOKEN_MINT
        );

        const createTx = new anchor.web3.Transaction().add(createIx);
        await anchor.web3.sendAndConfirmTransaction(connection, createTx, [mainWallet]);
        console.log(`  Wallet ${i}: ✅ Token account created`);
      }

      // Transfer tokens if we have enough
      if (mainTokenBalance >= 1_000_000 * 1e9) {
        const transferIx = createTransferInstruction(
          mainTokenAccount,
          tokenAccount,
          mainWallet.publicKey,
          1_000_000 * 1e9
        );

        const transferTx = new anchor.web3.Transaction().add(transferIx);
        await anchor.web3.sendAndConfirmTransaction(connection, transferTx, [mainWallet]);
        console.log(`  Wallet ${i}: ✅ Transferred 1M tokens`);
        mainTokenBalance -= 1_000_000 * 1e9;
        walletsNeedingTokens++;
      } else {
        console.log(`  Wallet ${i}: ⏸️  Token account ready (awaiting tokens)`);
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
  console.log("  1. Verify setup: tsx scripts/bot-interactions.ts info 0");
  console.log("  2. Initialize players: npm run bot:init");
  console.log("  3. Start testing: tsx scripts/bot-interactions.ts buy 0 all");
}

main()
  .then(() => process.exit(0))
  .catch((err: any) => {
    console.error("Error:", err);
    process.exit(1);
  });