// Run from backend root: node check-ownership.js
const sqlite3 = require('sqlite3').verbose();
const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config();

const WALLET = 'FoPKSQ5HDSVyZgaQobX64YEBVQ2iiKMZp8VHWtd6jLQE';
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID);

async function checkOwnership() {
  console.log('🔍 Checking ownership data...\n');
  
  // 1. Check database
  console.log('📦 DATABASE DATA:');
  const db = new sqlite3.Database('./defipoly.db');
  
  const dbData = await new Promise((resolve, reject) => {
    db.all(
      `SELECT property_id, slots_owned, slots_shielded, shield_expiry 
       FROM property_ownership 
       WHERE wallet_address = ? 
       ORDER BY property_id`,
      [WALLET],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
  
  console.log(`Found ${dbData.length} properties in database:`);
  dbData.forEach(row => {
    console.log(`  Property ${row.property_id}: ${row.slots_owned} slots (shielded: ${row.slots_shielded}, expiry: ${row.shield_expiry})`);
  });
  
  // 2. Check blockchain
  console.log('\n⛓️  BLOCKCHAIN DATA:');
  const connection = new Connection(process.env.RPC_URL, 'confirmed');
  
  const blockchainData = [];
  
  for (let propertyId = 0; propertyId < 22; propertyId++) {
    try {
      const [ownershipPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('ownership'),
          new PublicKey(WALLET).toBuffer(),
          Buffer.from([propertyId])
        ],
        PROGRAM_ID
      );
      
      const accountInfo = await connection.getAccountInfo(ownershipPDA);
      
      if (accountInfo) {
        const data = accountInfo.data;
        let offset = 8; // Skip discriminator
        
        offset += 32; // Skip player pubkey
        offset += 1; // Skip property_id
        
        const slotsOwned = data.readUInt16LE(offset);
        offset += 2;
        
        const slotsShielded = data.readUInt16LE(offset);
        offset += 2;
        
        offset += 8; // Skip purchase_timestamp
        
        const shieldExpiryLow = data.readUInt32LE(offset);
        const shieldExpiryHigh = data.readUInt32LE(offset + 4);
        const shieldExpiry = shieldExpiryLow + (shieldExpiryHigh * 0x100000000);
        
        if (slotsOwned > 0) {
          blockchainData.push({
            propertyId,
            slotsOwned,
            slotsShielded,
            shieldExpiry
          });
          console.log(`  Property ${propertyId}: ${slotsOwned} slots (shielded: ${slotsShielded}, expiry: ${shieldExpiry})`);
        }
      }
    } catch (error) {
      // Account doesn't exist
    }
  }
  
  console.log(`\nFound ${blockchainData.length} properties on blockchain`);
  
  // 3. Compare
  console.log('\n🔄 COMPARISON:');
  
  const dbPropertyIds = new Set(dbData.map(d => d.property_id));
  const bcPropertyIds = new Set(blockchainData.map(d => d.propertyId));
  
  // Missing in DB
  const missingInDb = blockchainData.filter(bc => !dbPropertyIds.has(bc.propertyId));
  if (missingInDb.length > 0) {
    console.log('\n❌ MISSING IN DATABASE:');
    missingInDb.forEach(bc => {
      console.log(`  Property ${bc.propertyId}: ${bc.slotsOwned} slots`);
    });
  }
  
  // Missing on blockchain
  const missingOnChain = dbData.filter(db => !bcPropertyIds.has(db.property_id));
  if (missingOnChain.length > 0) {
    console.log('\n❌ EXTRA IN DATABASE (not on blockchain):');
    missingOnChain.forEach(db => {
      console.log(`  Property ${db.property_id}: ${db.slots_owned} slots`);
    });
  }
  
  // Mismatches
  const mismatches = [];
  blockchainData.forEach(bc => {
    const dbEntry = dbData.find(d => d.property_id === bc.propertyId);
    if (dbEntry) {
      if (dbEntry.slots_owned !== bc.slotsOwned) {
        mismatches.push({
          propertyId: bc.propertyId,
          dbSlots: dbEntry.slots_owned,
          bcSlots: bc.slotsOwned
        });
      }
    }
  });
  
  if (mismatches.length > 0) {
    console.log('\n⚠️  SLOT COUNT MISMATCHES:');
    mismatches.forEach(m => {
      console.log(`  Property ${m.propertyId}: DB has ${m.dbSlots}, Blockchain has ${m.bcSlots}`);
    });
  }
  
  if (missingInDb.length === 0 && missingOnChain.length === 0 && mismatches.length === 0) {
    console.log('\n✅ DATABASE AND BLOCKCHAIN ARE IN SYNC!');
  } else {
    console.log('\n❌ DATABASE IS OUT OF SYNC - Run recalculate-stats.js to fix');
  }
  
  db.close();
}

checkOwnership().catch(console.error);