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
  const recipientAddress = new anchor.web3.PublicKey("FoPKSQ5HDSVyZgaQobX64YEBVQ2iiKMZp8VHWtd6jLQE");
  const tokenMint = new anchor.web3.PublicKey("743D9e7PCGgh2V3TY2tUeg31e63tmFjJ9rTZJkwhRVLX");
  
  // Amount to mint (100,000 tokens with 9 decimals)
  const amount = 100_000 * 1e9;

  // Create connection
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");
  const authorityKeypair = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  console.log("Minting tokens to:", recipientAddress.toString());
  console.log("Token Mint:", tokenMint.toString());
  console.log("Amount:", amount / 1e9, "tokens");

  // Get or create associated token account
  const recipientTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    recipientAddress
  );

  console.log("Recipient Token Account:", recipientTokenAccount.toString());

  // Check if token account exists
  const accountInfo = await connection.getAccountInfo(recipientTokenAccount);
  
  if (!accountInfo) {
    console.log("Creating associated token account...");
    const instruction = createAssociatedTokenAccountInstruction(
      authorityKeypair.publicKey, // payer
      recipientTokenAccount,
      recipientAddress, // owner
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

  console.log("✓ Minted", amount / 1e9, "tokens!");
  console.log("Transaction:", signature);
  console.log("\n🎉 Done! Check your wallet in the game.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });