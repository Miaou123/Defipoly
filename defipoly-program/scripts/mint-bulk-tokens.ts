import * as anchor from "@coral-xyz/anchor";
import { mintTo, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";

async function main() {
  // Configuration
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const walletPath = process.env.ANCHOR_WALLET || path.join(homedir(), ".config/solana/id.json");
  
  // Your wallet and token mint
  const tokenMint = new anchor.web3.PublicKey("743D9e7PCGgh2V3TY2tUeg31e63tmFjJ9rTZJkwhRVLX");
  
  // Amount to mint: 50M tokens (for 50 wallets × 1M each)
  const amount = 50_000_000 * 1e9;

  // Create connection
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");
  const authorityKeypair = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  console.log("💰 Minting 50M tokens for test wallet distribution...");
  console.log("Recipient:", authorityKeypair.publicKey.toString());
  console.log("Token Mint:", tokenMint.toString());
  console.log("Amount:", (amount / 1e9).toLocaleString(), "tokens");

  // Get or create associated token account
  const recipientTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    authorityKeypair.publicKey
  );

  console.log("Recipient Token Account:", recipientTokenAccount.toString());

  // Check if token account exists
  const accountInfo = await connection.getAccountInfo(recipientTokenAccount);
  
  if (!accountInfo) {
    console.log("\nCreating associated token account...");
    const instruction = createAssociatedTokenAccountInstruction(
      authorityKeypair.publicKey, // payer
      recipientTokenAccount,
      authorityKeypair.publicKey, // owner
      tokenMint
    );

    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await anchor.web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [authorityKeypair]
    );
    console.log("✓ Token account created:", signature);
  } else {
    console.log("✓ Token account already exists");
    
    // Show current balance
    const currentBalance = await connection.getTokenAccountBalance(recipientTokenAccount);
    console.log("Current balance:", Number(currentBalance.value.amount) / 1e9, "tokens");
  }

  // Mint tokens
  console.log("\nMinting tokens...");
  const signature = await mintTo(
    connection,
    authorityKeypair,
    tokenMint,
    recipientTokenAccount,
    authorityKeypair, // mint authority
    amount
  );

  console.log("✓ Minted", (amount / 1e9).toLocaleString(), "tokens!");
  console.log("Transaction:", signature);
  
  // Show new balance
  const newBalance = await connection.getTokenAccountBalance(recipientTokenAccount);
  console.log("\n📊 New balance:", Number(newBalance.value.amount) / 1e9, "tokens");
  
  console.log("\n🎉 Done! You can now run the setup script:");
  console.log("   npm run bot:setup");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });