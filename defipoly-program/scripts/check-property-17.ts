import * as anchor from "@coral-xyz/anchor";

async function main() {
  const rpcUrl = "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");
  
  // Current program ID from deployment-info.json
  const programId = new anchor.web3.PublicKey("5pmt4n2ge5ywu1Bc9tU1qjjtGbeNoFvVJpomSjvU1PwV");
  
  // Real wallet addresses that own property 17 (from database)
  const owners = [
    { addr: "FoPKSQ5HDSVyZgaQobX64YEBVQ2iiKMZp8VHWtd6jLQE", slots: 6 },
    { addr: "DCMDFnPC58aChAisqnQshjkH84MqwA4vSMGV2msy9FPM", slots: 2 },
    { addr: "A7uL2TiTUK589QwLgE5WGRrnd1pQThYhsWoZuTpsFgZJ", slots: 2 },
    { addr: "E1r9zNiLs6mYcFvAm7gGNsM3W2Rc632tVQ2uXyoTaZLL", slots: 1 },
    { addr: "B91FJxBiXzAGsuj9biZxVGTHGpfjEBwpsB17QyRTtFqN", slots: 1 },
    { addr: "3taHu3hzg4CtmVXJDNUgG37YKvj2EuUMoEPz7F6BCwtL", slots: 1 }
  ];
  
  console.log("=== Property 17 Ownership Check ===");
  console.log("Program:", programId.toString());
  console.log("");
  
  let totalOnChain = 0;
  let ownersWithUnshielded = 0;
  
  for (const owner of owners) {
    try {
      const wallet = new anchor.web3.PublicKey(owner.addr);
      const [ownershipPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('ownership'), wallet.toBuffer(), Buffer.from([17])],
        programId
      );
      
      console.log(`${owner.addr.slice(0, 8)}... (DB: ${owner.slots} slots):`);
      console.log(`  PDA: ${ownershipPDA.toString()}`);
      
      const accountInfo = await connection.getAccountInfo(ownershipPDA);
      if (accountInfo) {
        console.log(`  ✅ FOUND on-chain! Data length: ${accountInfo.data.length}`);
        
        // Try to parse ownership data more carefully
        if (accountInfo.data.length >= 8) {
          try {
            // Assuming it's a standard Anchor account structure
            // Skip discriminator (8 bytes) and read ownership fields
            const dataView = new DataView(accountInfo.data.buffer);
            
            // These are guesses based on common Solana account structures
            const slotsOwned = dataView.getUint32(8, true); // Little endian
            const slotsShielded = dataView.getUint32(12, true); // Next 4 bytes
            
            console.log(`  On-chain slots: ${slotsOwned}`);
            console.log(`  Shielded slots: ${slotsShielded}`);
            console.log(`  Unshielded: ${slotsOwned - slotsShielded}`);
            
            totalOnChain += slotsOwned;
            if (slotsOwned > slotsShielded) {
              ownersWithUnshielded++;
            }
          } catch (e) {
            console.log(`  ⚠️  Could not parse data: ${e}`);
          }
        }
      } else {
        console.log(`  ❌ NOT FOUND on-chain (but exists in DB)`);
      }
      console.log("");
    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
    }
  }
  
  console.log("=== Summary ===");
  console.log(`Total owners in DB: ${owners.length}`);
  console.log(`Total slots in DB: ${owners.reduce((sum, o) => sum + o.slots, 0)}`);
  console.log(`Owners with unshielded slots: ${ownersWithUnshielded}`);
  console.log(`Total on-chain slots: ${totalOnChain}`);
}

main().catch(console.error);