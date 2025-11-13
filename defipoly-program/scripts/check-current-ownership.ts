import * as anchor from "@coral-xyz/anchor";

async function main() {
  const rpcUrl = "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");
  
  // Current program ID from deployment-info.json
  const programId = new anchor.web3.PublicKey("5pmt4n2ge5ywu1Bc9tU1qjjtGbeNoFvVJpomSjvU1PwV");
  
  // Test the main bot wallet that has many properties
  const playerAddress = new anchor.web3.PublicKey("FoPKSQ5HDSVyZgaQobX64YEBVQ2iiKMZp8VHWtd6jLQE");

  console.log("Checking ownerships for:", playerAddress.toString());
  console.log("Program:", programId.toString());
  console.log("\n");

  // Check properties where we know there should be ownership (from database)
  const propertiesToCheck = [1, 2, 9, 13, 16, 17]; // Properties with ownership from DB
  
  for (const propertyId of propertiesToCheck) {
    const [ownershipPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('ownership'), playerAddress.toBuffer(), Buffer.from([propertyId])],
      programId
    );

    console.log(`Property ${propertyId}:`);
    console.log(`  PDA: ${ownershipPDA.toString()}`);

    try {
      const accountInfo = await connection.getAccountInfo(ownershipPDA);
      if (accountInfo) {
        console.log(`  ✅ FOUND! Data length: ${accountInfo.data.length} bytes`);
        console.log(`  Owner: ${accountInfo.owner.toString()}`);
        
        // Try to parse the account data to see the ownership details
        if (accountInfo.data.length >= 1) {
          const slotsOwned = accountInfo.data.readUInt8(0); // First byte might be slots
          console.log(`  Slots owned: ${slotsOwned}`);
        }
      } else {
        console.log(`  ❌ Not found`);
      }
    } catch (error) {
      console.log(`  ❌ Error fetching: ${error}`);
    }
    console.log("");
  }
  
  // Also check if there are multiple owners for property 17
  console.log("=== Checking other potential owners for Property 17 ===");
  
  // Check a few other wallet addresses that might own slots
  const otherWallets = [
    "E1r9nQFVP59hFCZGPFqaBHKnCkZgobE3wF9sNckaZLL",
    "B91FdEQF5XF9DCwLqQKQV7FYv3X8fJLhtFqN",
    "DCMD1PdRLPjuWm4sRyKjKZxKWuVd6Vw4F9PL9FPM"
  ];
  
  for (const walletAddr of otherWallets) {
    try {
      const wallet = new anchor.web3.PublicKey(walletAddr);
      const [ownershipPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('ownership'), wallet.toBuffer(), Buffer.from([17])],
        programId
      );
      
      console.log(`Wallet ${walletAddr.slice(0, 8)}... for Property 17:`);
      const accountInfo = await connection.getAccountInfo(ownershipPDA);
      if (accountInfo) {
        console.log(`  ✅ OWNS property 17! Data length: ${accountInfo.data.length}`);
      } else {
        console.log(`  ❌ No ownership`);
      }
    } catch (error) {
      console.log(`  ❌ Invalid wallet or error: ${error}`);
    }
  }
}

main().catch(console.error);