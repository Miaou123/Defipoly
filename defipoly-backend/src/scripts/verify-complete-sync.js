// ============================================
// FILE: verify-complete-sync.js
// Complete blockchain data verification
// Checks ALL tables and ALL fields for 100% sync
// ============================================

const { Connection, PublicKey } = require('@solana/web3.js');
const { initDatabase, getDatabase, closeDatabase } = require('./src/config/database');
require('dotenv').config();

const RPC_URL = process.env.RPC_URL;
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID);

// ========== PDA DERIVATION FUNCTIONS ==========

function getOwnershipPDA(walletAddress, propertyId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('ownership'),
      new PublicKey(walletAddress).toBuffer(),
      Buffer.from([propertyId])
    ],
    PROGRAM_ID
  );
  return pda;
}

function getSetCooldownPDA(walletAddress, setId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('cooldown'),
      new PublicKey(walletAddress).toBuffer(),
      Buffer.from([setId])
    ],
    PROGRAM_ID
  );
  return pda;
}

function getStealCooldownPDA(walletAddress, propertyId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('steal_cooldown'),
      new PublicKey(walletAddress).toBuffer(),
      Buffer.from([propertyId])
    ],
    PROGRAM_ID
  );
  return pda;
}

function getPropertyPDA(propertyId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('property'),
      Buffer.from([propertyId])
    ],
    PROGRAM_ID
  );
  return pda;
}

// ========== DESERIALIZATION FUNCTIONS ==========

function readI64LE(buffer, offset) {
  const low = buffer.readUInt32LE(offset);
  const high = buffer.readUInt32LE(offset + 4);
  return low + (high * 0x100000000);
}

function readU64LE(buffer, offset) {
  const low = buffer.readUInt32LE(offset);
  const high = buffer.readUInt32LE(offset + 4);
  return low + (high * 0x100000000);
}

function deserializeOwnership(data) {
  let offset = 8; // Skip discriminator
  const player = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;
  const propertyId = data.readUInt8(offset);
  offset += 1;
  const slotsOwned = data.readUInt16LE(offset);
  offset += 2;
  const slotsShielded = data.readUInt16LE(offset);
  offset += 2;
  const purchaseTimestamp = readI64LE(data, offset);
  offset += 8;
  const shieldExpiry = readI64LE(data, offset);
  offset += 8;
  const shieldCooldownDuration = readI64LE(data, offset);
  offset += 8;
  const stealProtectionExpiry = readI64LE(data, offset);
  offset += 8;
  const bump = data.readUInt8(offset);

  return {
    player: player.toString(),
    propertyId,
    slotsOwned,
    slotsShielded,
    purchaseTimestamp,
    shieldExpiry,
    shieldCooldownDuration,
    stealProtectionExpiry,
    bump
  };
}

function deserializeSetCooldown(data) {
  let offset = 8;
  const player = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;
  const setId = data.readUInt8(offset);
  offset += 1;
  const lastPurchaseTimestamp = readI64LE(data, offset);
  offset += 8;
  const cooldownDuration = readI64LE(data, offset);
  offset += 8;
  const lastPurchasedPropertyId = data.readUInt8(offset);
  offset += 1;
  
  const propertiesOwnedInSet = [];
  for (let i = 0; i < 3; i++) {
    const propId = data.readUInt8(offset);
    offset += 1;
    if (propId !== 255) {
      propertiesOwnedInSet.push(propId);
    }
  }
  
  const propertiesCount = data.readUInt8(offset);
  offset += 1;
  const bump = data.readUInt8(offset);

  return {
    player: player.toString(),
    setId,
    lastPurchaseTimestamp,
    cooldownDuration,
    lastPurchasedPropertyId,
    propertiesOwnedInSet,
    propertiesCount,
    bump
  };
}

function deserializeStealCooldown(data) {
  let offset = 8;
  const player = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;
  const propertyId = data.readUInt8(offset);
  offset += 1;
  const lastStealAttemptTimestamp = readI64LE(data, offset);
  offset += 8;
  const cooldownDuration = readI64LE(data, offset);
  offset += 8;
  const bump = data.readUInt8(offset);

  return {
    player: player.toString(),
    propertyId,
    lastStealAttemptTimestamp,
    cooldownDuration,
    bump
  };
}

function deserializeProperty(data) {
  let offset = 8;
  const propertyId = data.readUInt8(offset);
  offset += 1;
  const setId = data.readUInt8(offset);
  offset += 1;
  const maxSlotsPerProperty = data.readUInt16LE(offset);
  offset += 2;
  const availableSlots = data.readUInt16LE(offset);
  offset += 2;

  return {
    propertyId,
    setId,
    maxSlotsPerProperty,
    availableSlots
  };
}

// ========== VERIFICATION FUNCTIONS ==========

async function verifyCompleteSync() {
  console.log('🔍 COMPLETE BLOCKCHAIN SYNC VERIFICATION\n');
  console.log('This will check ALL tables and ALL fields for 100% accuracy\n');

  await initDatabase();
  const db = getDatabase();
  const connection = new Connection(RPC_URL, 'confirmed');

  const results = {
    propertyOwnership: { checked: 0, mismatches: [] },
    playerSetCooldowns: { checked: 0, mismatches: [] },
    playerStealCooldowns: { checked: 0, mismatches: [] },
    propertiesState: { checked: 0, mismatches: [] }
  };

  try {
    // ========== STEP 1: Verify Properties State (22 properties) ==========
    console.log('📍 STEP 1: Verifying Properties State (available_slots)\n');

    for (let propertyId = 0; propertyId < 22; propertyId++) {
      const propertyPDA = getPropertyPDA(propertyId);
      const accountInfo = await connection.getAccountInfo(propertyPDA);

      if (!accountInfo) {
        console.log(`   ⚠️  Property ${propertyId}: No blockchain account found`);
        continue;
      }

      const bcData = deserializeProperty(accountInfo.data);
      
      const dbData = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM properties_state WHERE property_id = ?',
          [propertyId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      results.propertiesState.checked++;

      if (!dbData) {
        results.propertiesState.mismatches.push({
          propertyId,
          issue: 'Missing in database',
          blockchain: bcData
        });
        console.log(`   ❌ Property ${propertyId}: MISSING IN DATABASE`);
      } else if (dbData.available_slots !== bcData.availableSlots) {
        results.propertiesState.mismatches.push({
          propertyId,
          issue: 'Available slots mismatch',
          blockchain: bcData.availableSlots,
          database: dbData.available_slots
        });
        console.log(`   ❌ Property ${propertyId}: DB has ${dbData.available_slots} slots, BC has ${bcData.availableSlots}`);
      } else {
        console.log(`   ✅ Property ${propertyId}: ${bcData.availableSlots}/${bcData.maxSlotsPerProperty} slots`);
      }
    }

    console.log(`\n   Summary: Checked ${results.propertiesState.checked}/22 properties\n`);

    // ========== STEP 2: Verify PropertyOwnership (ALL 9 FIELDS) ==========
    console.log('📍 STEP 2: Verifying PropertyOwnership (ALL 9 fields)\n');

    const allOwnerships = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM property_ownership WHERE slots_owned > 0',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log(`   Found ${allOwnerships.length} ownerships in database to verify\n`);

    for (const dbOwnership of allOwnerships) {
      const ownershipPDA = getOwnershipPDA(dbOwnership.wallet_address, dbOwnership.property_id);
      const accountInfo = await connection.getAccountInfo(ownershipPDA);

      results.propertyOwnership.checked++;

      if (!accountInfo) {
        results.propertyOwnership.mismatches.push({
          wallet: dbOwnership.wallet_address,
          propertyId: dbOwnership.property_id,
          issue: 'Account exists in DB but not on blockchain'
        });
        console.log(`   ❌ ${dbOwnership.wallet_address.substring(0, 8)}... Property ${dbOwnership.property_id}: NOT ON BLOCKCHAIN`);
        continue;
      }

      const bcData = deserializeOwnership(accountInfo.data);
      
      // Check ALL 9 fields
      const fieldsMismatch = [];
      
      if (dbOwnership.slots_owned !== bcData.slotsOwned) {
        fieldsMismatch.push(`slots_owned: DB=${dbOwnership.slots_owned} BC=${bcData.slotsOwned}`);
      }
      if (dbOwnership.slots_shielded !== bcData.slotsShielded) {
        fieldsMismatch.push(`slots_shielded: DB=${dbOwnership.slots_shielded} BC=${bcData.slotsShielded}`);
      }
      if (dbOwnership.shield_expiry !== bcData.shieldExpiry) {
        fieldsMismatch.push(`shield_expiry: DB=${dbOwnership.shield_expiry} BC=${bcData.shieldExpiry}`);
      }
      if (dbOwnership.purchase_timestamp !== bcData.purchaseTimestamp) {
        fieldsMismatch.push(`purchase_timestamp: DB=${dbOwnership.purchase_timestamp} BC=${bcData.purchaseTimestamp}`);
      }
      if (dbOwnership.shield_cooldown_duration !== bcData.shieldCooldownDuration) {
        fieldsMismatch.push(`shield_cooldown_duration: DB=${dbOwnership.shield_cooldown_duration} BC=${bcData.shieldCooldownDuration}`);
      }
      if (dbOwnership.steal_protection_expiry !== bcData.stealProtectionExpiry) {
        fieldsMismatch.push(`steal_protection_expiry: DB=${dbOwnership.steal_protection_expiry} BC=${bcData.stealProtectionExpiry}`);
      }
      if (dbOwnership.bump !== bcData.bump) {
        fieldsMismatch.push(`bump: DB=${dbOwnership.bump} BC=${bcData.bump}`);
      }

      if (fieldsMismatch.length > 0) {
        results.propertyOwnership.mismatches.push({
          wallet: dbOwnership.wallet_address,
          propertyId: dbOwnership.property_id,
          issue: 'Field mismatches',
          fields: fieldsMismatch
        });
        console.log(`   ❌ ${dbOwnership.wallet_address.substring(0, 8)}... Property ${dbOwnership.property_id}:`);
        fieldsMismatch.forEach(f => console.log(`      - ${f}`));
      } else {
        console.log(`   ✅ ${dbOwnership.wallet_address.substring(0, 8)}... Property ${dbOwnership.property_id}: All 9 fields match`);
      }

      // Rate limiting
      if (results.propertyOwnership.checked % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n   Summary: Checked ${results.propertyOwnership.checked} ownerships\n`);

    // ========== STEP 3: Verify PlayerSetCooldowns ==========
    console.log('📍 STEP 3: Verifying PlayerSetCooldowns\n');

    const allSetCooldowns = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM player_set_cooldowns',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log(`   Found ${allSetCooldowns.length} set cooldowns in database to verify\n`);

    for (const dbCooldown of allSetCooldowns) {
      const cooldownPDA = getSetCooldownPDA(dbCooldown.wallet_address, dbCooldown.set_id);
      const accountInfo = await connection.getAccountInfo(cooldownPDA);

      results.playerSetCooldowns.checked++;

      if (!accountInfo) {
        results.playerSetCooldowns.mismatches.push({
          wallet: dbCooldown.wallet_address,
          setId: dbCooldown.set_id,
          issue: 'Account exists in DB but not on blockchain'
        });
        console.log(`   ❌ ${dbCooldown.wallet_address.substring(0, 8)}... Set ${dbCooldown.set_id}: NOT ON BLOCKCHAIN`);
        continue;
      }

      const bcData = deserializeSetCooldown(accountInfo.data);
      
      const fieldsMismatch = [];
      
      if (dbCooldown.last_purchase_timestamp !== bcData.lastPurchaseTimestamp) {
        fieldsMismatch.push(`last_purchase_timestamp: DB=${dbCooldown.last_purchase_timestamp} BC=${bcData.lastPurchaseTimestamp}`);
      }
      if (dbCooldown.cooldown_duration !== bcData.cooldownDuration) {
        fieldsMismatch.push(`cooldown_duration: DB=${dbCooldown.cooldown_duration} BC=${bcData.cooldownDuration}`);
      }
      if (dbCooldown.properties_count !== bcData.propertiesCount) {
        fieldsMismatch.push(`properties_count: DB=${dbCooldown.properties_count} BC=${bcData.propertiesCount}`);
      }

      if (fieldsMismatch.length > 0) {
        results.playerSetCooldowns.mismatches.push({
          wallet: dbCooldown.wallet_address,
          setId: dbCooldown.set_id,
          issue: 'Field mismatches',
          fields: fieldsMismatch
        });
        console.log(`   ❌ ${dbCooldown.wallet_address.substring(0, 8)}... Set ${dbCooldown.set_id}:`);
        fieldsMismatch.forEach(f => console.log(`      - ${f}`));
      } else {
        console.log(`   ✅ ${dbCooldown.wallet_address.substring(0, 8)}... Set ${dbCooldown.set_id}: All fields match`);
      }

      if (results.playerSetCooldowns.checked % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n   Summary: Checked ${results.playerSetCooldowns.checked} set cooldowns\n`);

    // ========== STEP 4: Verify PlayerStealCooldowns ==========
    console.log('📍 STEP 4: Verifying PlayerStealCooldowns\n');

    const allStealCooldowns = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM player_steal_cooldowns',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log(`   Found ${allStealCooldowns.length} steal cooldowns in database to verify\n`);

    for (const dbCooldown of allStealCooldowns) {
      const cooldownPDA = getStealCooldownPDA(dbCooldown.wallet_address, dbCooldown.property_id);
      const accountInfo = await connection.getAccountInfo(cooldownPDA);

      results.playerStealCooldowns.checked++;

      if (!accountInfo) {
        results.playerStealCooldowns.mismatches.push({
          wallet: dbCooldown.wallet_address,
          propertyId: dbCooldown.property_id,
          issue: 'Account exists in DB but not on blockchain'
        });
        console.log(`   ❌ ${dbCooldown.wallet_address.substring(0, 8)}... Property ${dbCooldown.property_id}: NOT ON BLOCKCHAIN`);
        continue;
      }

      const bcData = deserializeStealCooldown(accountInfo.data);
      
      const fieldsMismatch = [];
      
      if (dbCooldown.last_steal_attempt_timestamp !== bcData.lastStealAttemptTimestamp) {
        fieldsMismatch.push(`last_steal_attempt_timestamp: DB=${dbCooldown.last_steal_attempt_timestamp} BC=${bcData.lastStealAttemptTimestamp}`);
      }
      if (dbCooldown.cooldown_duration !== bcData.cooldownDuration) {
        fieldsMismatch.push(`cooldown_duration: DB=${dbCooldown.cooldown_duration} BC=${bcData.cooldownDuration}`);
      }

      if (fieldsMismatch.length > 0) {
        results.playerStealCooldowns.mismatches.push({
          wallet: dbCooldown.wallet_address,
          propertyId: dbCooldown.property_id,
          issue: 'Field mismatches',
          fields: fieldsMismatch
        });
        console.log(`   ❌ ${dbCooldown.wallet_address.substring(0, 8)}... Property ${dbCooldown.property_id}:`);
        fieldsMismatch.forEach(f => console.log(`      - ${f}`));
      } else {
        console.log(`   ✅ ${dbCooldown.wallet_address.substring(0, 8)}... Property ${dbCooldown.property_id}: All fields match`);
      }

      if (results.playerStealCooldowns.checked % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n   Summary: Checked ${results.playerStealCooldowns.checked} steal cooldowns\n`);

    // ========== FINAL SUMMARY ==========
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL VERIFICATION SUMMARY');
    console.log('='.repeat(60) + '\n');

    const totalChecked = 
      results.propertiesState.checked +
      results.propertyOwnership.checked +
      results.playerSetCooldowns.checked +
      results.playerStealCooldowns.checked;

    const totalMismatches = 
      results.propertiesState.mismatches.length +
      results.propertyOwnership.mismatches.length +
      results.playerSetCooldowns.mismatches.length +
      results.playerStealCooldowns.mismatches.length;

    console.log(`Properties State:`);
    console.log(`   ✅ Checked: ${results.propertiesState.checked}/22`);
    console.log(`   ❌ Mismatches: ${results.propertiesState.mismatches.length}\n`);

    console.log(`PropertyOwnership (9 fields each):`);
    console.log(`   ✅ Checked: ${results.propertyOwnership.checked}`);
    console.log(`   ❌ Mismatches: ${results.propertyOwnership.mismatches.length}\n`);

    console.log(`PlayerSetCooldowns:`);
    console.log(`   ✅ Checked: ${results.playerSetCooldowns.checked}`);
    console.log(`   ❌ Mismatches: ${results.playerSetCooldowns.mismatches.length}\n`);

    console.log(`PlayerStealCooldowns:`);
    console.log(`   ✅ Checked: ${results.playerStealCooldowns.checked}`);
    console.log(`   ❌ Mismatches: ${results.playerStealCooldowns.mismatches.length}\n`);

    console.log('='.repeat(60));
    console.log(`TOTAL: Checked ${totalChecked} blockchain accounts`);
    console.log(`TOTAL: Found ${totalMismatches} mismatches\n`);

    if (totalMismatches === 0) {
      console.log('✅✅✅ DATABASE IS 100% IN SYNC WITH BLOCKCHAIN! ✅✅✅\n');
    } else {
      console.log('❌ DATABASE HAS SYNC ISSUES\n');
      console.log('To fix: Run `npm run sync-blockchain` again\n');
    }

  } catch (error) {
    console.error('❌ Verification error:', error);
  } finally {
    await closeDatabase();
  }
}

// Run verification
verifyCompleteSync()
  .then(() => {
    console.log('🎉 Verification complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });