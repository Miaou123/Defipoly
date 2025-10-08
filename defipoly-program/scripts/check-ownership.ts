import * as anchor from "@coral-xyz/anchor";
import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";

async function main() {
  const rpcUrl = "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");
  
  const playerAddress = new anchor.web3.PublicKey("FoPKSQ5HDSVyZgaQobX64YEBVQ2iiKMZp8VHWtd6jLQE");
  const programId = new anchor.web3.PublicKey("H1zzYzWPReWJ4W2JNiBrYbsrHDxFDGJ9n9jAyYG2VhLQ");

  console.log("Checking ownerships for:", playerAddress.toString());
  console.log("Program:", programId.toString());
  console.log("\n");

  // Check each property
  for (let propertyId = 0; propertyId < 8; propertyId++) {
    const [ownershipPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('ownership'), playerAddress.toBuffer(), Buffer.from([propertyId])],
      programId
    );

    console.log(`Property ${propertyId}:`);
    console.log(`  PDA: ${ownershipPDA.toString()}`);

    const accountInfo = await connection.getAccountInfo(ownershipPDA);
    if (accountInfo) {
      console.log(`  ✅ FOUND! Data length: ${accountInfo.data.length} bytes`);
      console.log(`  Owner: ${accountInfo.owner.toString()}`);
    } else {
      console.log(`  ❌ Not found`);
    }
    console.log("");
  }
}

main().catch(console.error);