// ============================================
// FILE: blockchainSyncService.js
// Syncs blockchain account data to local database
// ============================================

const { Connection, PublicKey } = require('@solana/web3.js');
const { getDatabase } = require('../config/database');
require('dotenv').config();

const RPC_URL = process.env.RPC_URL;
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID);

// Initialize connection
const connection = new Connection(RPC_URL, 'confirmed');

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

/**
 * Deserialize PropertyOwnership account (110 bytes)
 * Structure:
 * - 8 bytes: discriminator
 * - 32 bytes: player pubkey
 * - 1 byte: property_id (u8)
 * - 2 bytes: slots_owned (u16)
 * - 2 bytes: slots_shielded (u16)
 * - 8 bytes: purchase_timestamp (i64)
 * - 8 bytes: shield_expiry (i64)
 * - 8 bytes: shield_cooldown_duration (i64)
 * - 8 bytes: steal_protection_expiry (i64)
 * - 1 byte: bump (u8)
 */
function deserializeOwnership(data) {
  let offset = 8; // Skip discriminator

  // Read player pubkey (32 bytes)
  const player = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  // Read property_id (1 byte)
  const propertyId = data.readUInt8(offset);
  offset += 1;

  // Read slots_owned (2 bytes, u16)
  const slotsOwned = data.readUInt16LE(offset);
  offset += 2;

  // Read slots_shielded (2 bytes, u16)
  const slotsShielded = data.readUInt16LE(offset);
  offset += 2;

  // Read purchase_timestamp (8 bytes, i64)
  const purchaseTimestamp = readI64LE(data, offset);
  offset += 8;

  // Read shield_expiry (8 bytes, i64)
  const shieldExpiry = readI64LE(data, offset);
  offset += 8;

  // Read shield_cooldown_duration (8 bytes, i64)
  const shieldCooldownDuration = readI64LE(data, offset);
  offset += 8;

  // Read steal_protection_expiry (8 bytes, i64)
  const stealProtectionExpiry = readI64LE(data, offset);
  offset += 8;

  // Read bump (1 byte)
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

/**
 * Deserialize PlayerSetCooldown account (63 bytes + padding)
 * Structure:
 * - 8 bytes: discriminator
 * - 32 bytes: player pubkey
 * - 1 byte: set_id (u8)
 * - 8 bytes: last_purchase_timestamp (i64)
 * - 8 bytes: cooldown_duration (i64)
 * - 1 byte: last_purchased_property_id (u8)
 * - 3 bytes: properties_owned_in_set [u8; 3]
 * - 1 byte: properties_count (u8)
 * - 1 byte: bump (u8)
 * - 32 bytes: padding
 */
function deserializeSetCooldown(data) {
  let offset = 8; // Skip discriminator

  // Read player pubkey (32 bytes)
  const player = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  // Read set_id (1 byte)
  const setId = data.readUInt8(offset);
  offset += 1;

  // Read last_purchase_timestamp (8 bytes, i64)
  const lastPurchaseTimestamp = readI64LE(data, offset);
  offset += 8;

  // Read cooldown_duration (8 bytes, i64)
  const cooldownDuration = readI64LE(data, offset);
  offset += 8;

  // Read last_purchased_property_id (1 byte)
  const lastPurchasedPropertyId = data.readUInt8(offset);
  offset += 1;

  // Read properties_owned_in_set (3 bytes)
  const propertiesOwnedInSet = [
    data.readUInt8(offset),
    data.readUInt8(offset + 1),
    data.readUInt8(offset + 2)
  ];
  offset += 3;

  // Read properties_count (1 byte)
  const propertiesCount = data.readUInt8(offset);
  offset += 1;

  // Read bump (1 byte)
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

/**
 * Deserialize PlayerStealCooldown account (58 bytes + padding)
 * Structure:
 * - 8 bytes: discriminator
 * - 32 bytes: player pubkey
 * - 1 byte: property_id (u8)
 * - 8 bytes: last_steal_attempt_timestamp (i64)
 * - 8 bytes: cooldown_duration (i64)
 * - 1 byte: bump (u8)
 * - 32 bytes: padding
 */
function deserializeStealCooldown(data) {
  let offset = 8; // Skip discriminator

  // Read player pubkey (32 bytes)
  const player = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  // Read property_id (1 byte)
  const propertyId = data.readUInt8(offset);
  offset += 1;

  // Read last_steal_attempt_timestamp (8 bytes, i64)
  const lastStealAttemptTimestamp = readI64LE(data, offset);
  offset += 8;

  // Read cooldown_duration (8 bytes, i64)
  const cooldownDuration = readI64LE(data, offset);
  offset += 8;

  // Read bump (1 byte)
  const bump = data.readUInt8(offset);

  return {
    player: player.toString(),
    propertyId,
    lastStealAttemptTimestamp,
    cooldownDuration,
    bump
  };
}

/**
 * Deserialize Property account
 * Structure:
 * - 8 bytes: discriminator
 * - 1 byte: property_id (u8)
 * - 1 byte: set_id (u8)
 * - 2 bytes: max_slots_per_property (u16)
 * - 2 bytes: available_slots (u16)
 * - 2 bytes: max_per_player (u16)
 * - 8 bytes: price (u64)
 * - 2 bytes: yield_percent_bps (u16)
 * - 2 bytes: shield_cost_percent_bps (u16)
 * - 8 bytes: cooldown_seconds (i64)
 * - 1 byte: bump (u8)
 */
function deserializeProperty(data) {
  let offset = 8; // Skip discriminator

  const propertyId = data.readUInt8(offset);
  offset += 1;

  const setId = data.readUInt8(offset);
  offset += 1;

  const maxSlotsPerProperty = data.readUInt16LE(offset);
  offset += 2;

  const availableSlots = data.readUInt16LE(offset);
  offset += 2;

  const maxPerPlayer = data.readUInt16LE(offset);
  offset += 2;

  const price = readU64LE(data, offset);
  offset += 8;

  const yieldPercentBps = data.readUInt16LE(offset);
  offset += 2;

  const shieldCostPercentBps = data.readUInt16LE(offset);
  offset += 2;

  const cooldownSeconds = readI64LE(data, offset);
  offset += 8;

  const bump = data.readUInt8(offset);

  return {
    propertyId,
    setId,
    maxSlotsPerProperty,
    availableSlots,
    maxPerPlayer,
    price,
    yieldPercentBps,
    shieldCostPercentBps,
    cooldownSeconds,
    bump
  };
}

// ========== HELPER FUNCTIONS ==========

/**
 * Read i64 (signed 64-bit integer) as Number
 * Note: JavaScript can only safely represent integers up to 2^53
 */
function readI64LE(buffer, offset) {
  const low = buffer.readUInt32LE(offset);
  const high = buffer.readUInt32LE(offset + 4);
  // For timestamps, we can safely convert to number
  return low + (high * 0x100000000);
}

/**
 * Read u64 (unsigned 64-bit integer) as Number
 */
function readU64LE(buffer, offset) {
  const low = buffer.readUInt32LE(offset);
  const high = buffer.readUInt32LE(offset + 4);
  return low + (high * 0x100000000);
}

// ========== SYNC FUNCTIONS ==========

/**
 * Sync PropertyOwnership account to database
 * Fetches from blockchain and updates all 9 fields
 */
async function syncPropertyOwnership(walletAddress, propertyId) {
  try {
    const ownershipPDA = getOwnershipPDA(walletAddress, propertyId);
    const accountInfo = await connection.getAccountInfo(ownershipPDA);

    if (!accountInfo) {
      console.log(`   No ownership account found for ${walletAddress.substring(0, 8)}... property ${propertyId}`);
      return false;
    }

    const ownership = deserializeOwnership(accountInfo.data);
    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO property_ownership 
        (wallet_address, property_id, slots_owned, slots_shielded, shield_expiry, 
         purchase_timestamp, shield_cooldown_duration, steal_protection_expiry, bump, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(wallet_address, property_id) DO UPDATE SET
          slots_owned = excluded.slots_owned,
          slots_shielded = excluded.slots_shielded,
          shield_expiry = excluded.shield_expiry,
          purchase_timestamp = excluded.purchase_timestamp,
          shield_cooldown_duration = excluded.shield_cooldown_duration,
          steal_protection_expiry = excluded.steal_protection_expiry,
          bump = excluded.bump,
          last_updated = excluded.last_updated
      `, [
        walletAddress,
        propertyId,
        ownership.slotsOwned,
        ownership.slotsShielded,
        ownership.shieldExpiry,
        ownership.purchaseTimestamp,
        ownership.shieldCooldownDuration,
        ownership.stealProtectionExpiry,
        ownership.bump,
        Math.floor(Date.now() / 1000)
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log(`   ✅ Synced ownership: ${walletAddress.substring(0, 8)}... property ${propertyId}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error syncing ownership for ${walletAddress} property ${propertyId}:`, error.message);
    return false;
  }
}

/**
 * Sync PlayerSetCooldown account to database
 */
async function syncPlayerSetCooldown(walletAddress, setId) {
  try {
    const cooldownPDA = getSetCooldownPDA(walletAddress, setId);
    const accountInfo = await connection.getAccountInfo(cooldownPDA);

    if (!accountInfo) {
      console.log(`   No set cooldown account found for ${walletAddress.substring(0, 8)}... set ${setId}`);
      return false;
    }

    const cooldown = deserializeSetCooldown(accountInfo.data);
    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO player_set_cooldowns 
        (wallet_address, set_id, last_purchase_timestamp, cooldown_duration,
         last_purchased_property_id, properties_owned_in_set, properties_count, last_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(wallet_address, set_id) DO UPDATE SET
          last_purchase_timestamp = excluded.last_purchase_timestamp,
          cooldown_duration = excluded.cooldown_duration,
          last_purchased_property_id = excluded.last_purchased_property_id,
          properties_owned_in_set = excluded.properties_owned_in_set,
          properties_count = excluded.properties_count,
          last_synced = excluded.last_synced
      `, [
        walletAddress,
        setId,
        cooldown.lastPurchaseTimestamp,
        cooldown.cooldownDuration,
        cooldown.lastPurchasedPropertyId,
        JSON.stringify(cooldown.propertiesOwnedInSet),
        cooldown.propertiesCount,
        Math.floor(Date.now() / 1000)
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log(`   ✅ Synced set cooldown: ${walletAddress.substring(0, 8)}... set ${setId}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error syncing set cooldown for ${walletAddress} set ${setId}:`, error.message);
    return false;
  }
}

/**
 * Sync PlayerStealCooldown account to database
 */
async function syncPlayerStealCooldown(walletAddress, propertyId) {
  try {
    const cooldownPDA = getStealCooldownPDA(walletAddress, propertyId);
    const accountInfo = await connection.getAccountInfo(cooldownPDA);

    if (!accountInfo) {
      console.log(`   No steal cooldown account found for ${walletAddress.substring(0, 8)}... property ${propertyId}`);
      return false;
    }

    const cooldown = deserializeStealCooldown(accountInfo.data);
    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO player_steal_cooldowns 
        (wallet_address, property_id, last_steal_attempt_timestamp, cooldown_duration, last_synced)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(wallet_address, property_id) DO UPDATE SET
          last_steal_attempt_timestamp = excluded.last_steal_attempt_timestamp,
          cooldown_duration = excluded.cooldown_duration,
          last_synced = excluded.last_synced
      `, [
        walletAddress,
        propertyId,
        cooldown.lastStealAttemptTimestamp,
        cooldown.cooldownDuration,
        Math.floor(Date.now() / 1000)
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log(`   ✅ Synced steal cooldown: ${walletAddress.substring(0, 8)}... property ${propertyId}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error syncing steal cooldown for ${walletAddress} property ${propertyId}:`, error.message);
    return false;
  }
}

/**
 * Sync Property account to database (available_slots)
 */
async function syncPropertyState(propertyId) {
  try {
    const propertyPDA = getPropertyPDA(propertyId);
    const accountInfo = await connection.getAccountInfo(propertyPDA);

    if (!accountInfo) {
      console.log(`   No property account found for property ${propertyId}`);
      return false;
    }

    const property = deserializeProperty(accountInfo.data);
    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO properties_state 
        (property_id, available_slots, max_slots_per_property, last_synced)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(property_id) DO UPDATE SET
          available_slots = excluded.available_slots,
          last_synced = excluded.last_synced
      `, [
        propertyId,
        property.availableSlots,
        property.maxSlotsPerProperty,
        Math.floor(Date.now() / 1000)
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log(`   ✅ Synced property state: property ${propertyId} (${property.availableSlots}/${property.maxSlotsPerProperty} slots)`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error syncing property state for property ${propertyId}:`, error.message);
    return false;
  }
}


module.exports = {
  syncPropertyOwnership,
  syncPlayerSetCooldown,
  syncPlayerStealCooldown,
  syncPropertyState,
  deserializeOwnership,
  deserializeSetCooldown,
  deserializeStealCooldown,
  deserializeProperty
};