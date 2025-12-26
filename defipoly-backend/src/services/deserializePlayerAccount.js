const { PublicKey } = require('@solana/web3.js');
const BN = require('bn.js');

/**
 * Deserialize v9 PlayerAccount including all arrays
 * 
 * Structure (from IDL):
 * - 8 bytes: discriminator
 * - 32 bytes: owner
 * - 8 bytes: total_base_daily_income (u64)
 * - 8 bytes: last_accumulation_timestamp (i64)
 * - 8 bytes: total_rewards_claimed (u64)
 * - 8 bytes: pending_rewards (u64)
 * - 4 bytes: total_steals_attempted (u32)
 * - 4 bytes: total_steals_successful (u32)
 * - 2 bytes: total_slots_owned (u16)
 * - 1 byte: complete_sets_owned (u8)
 * - 1 byte: properties_owned_count (u8)
 * - 1 byte: bump (u8)
 * - 3 bytes: _padding1
 * - 176 bytes: property_purchase_timestamp [i64; 22]
 * - 176 bytes: property_shield_expiry [i64; 22]
 * - 176 bytes: property_shield_cooldown [i64; 22]
 * - 176 bytes: property_steal_protection_expiry [i64; 22]
 * - 64 bytes: set_cooldown_timestamp [i64; 8]
 * - 64 bytes: set_cooldown_duration [i64; 8]
 * - 176 bytes: steal_cooldown_timestamp [i64; 22]
 * - 44 bytes: property_slots [u16; 22]
 * - 44 bytes: property_shielded [u16; 22]
 * - 8 bytes: set_last_purchased_property [u8; 8]
 * - 8 bytes: set_properties_mask [u8; 8]
 */
function deserializePlayerAccount(data) {
  let offset = 8; // Skip discriminator

  const owner = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  const totalBaseDailyIncome = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;


  const lastAccumulationTimestamp = new BN(data.slice(offset, offset + 8), 'le').toNumber();
  offset += 8;

  const totalRewardsClaimed = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  const pendingRewards = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  const totalStealsAttempted = data.readUInt32LE(offset);
  offset += 4;

  const totalStealsSuccessful = data.readUInt32LE(offset);
  offset += 4;

  const totalSlotsOwned = data.readUInt16LE(offset);
  offset += 2;

  const completeSetsOwned = data.readUInt8(offset);
  offset += 1;

  const propertiesOwnedCount = data.readUInt8(offset);
  offset += 1;

  const bump = data.readUInt8(offset);
  offset += 1;

  // Skip _padding1 (3 bytes)
  offset += 3;

  // Parse arrays
  const propertyPurchaseTimestamp = [];
  for (let i = 0; i < 22; i++) {
    propertyPurchaseTimestamp.push(new BN(data.slice(offset, offset + 8), 'le').toNumber());
    offset += 8;
  }

  const propertyShieldExpiry = [];
  for (let i = 0; i < 22; i++) {
    propertyShieldExpiry.push(new BN(data.slice(offset, offset + 8), 'le').toNumber());
    offset += 8;
  }

  const propertyShieldCooldown = [];
  for (let i = 0; i < 22; i++) {
    propertyShieldCooldown.push(new BN(data.slice(offset, offset + 8), 'le').toNumber());
    offset += 8;
  }

  const propertyStealProtectionExpiry = [];
  for (let i = 0; i < 22; i++) {
    propertyStealProtectionExpiry.push(new BN(data.slice(offset, offset + 8), 'le').toNumber());
    offset += 8;
  }

  const setCooldownTimestamp = [];
  for (let i = 0; i < 8; i++) {
    setCooldownTimestamp.push(new BN(data.slice(offset, offset + 8), 'le').toNumber());
    offset += 8;
  }

  const setCooldownDuration = [];
  for (let i = 0; i < 8; i++) {
    setCooldownDuration.push(new BN(data.slice(offset, offset + 8), 'le').toNumber());
    offset += 8;
  }

  const stealCooldownTimestamp = [];
  for (let i = 0; i < 22; i++) {
    stealCooldownTimestamp.push(new BN(data.slice(offset, offset + 8), 'le').toNumber());
    offset += 8;
  }

  const propertySlots = [];
  for (let i = 0; i < 22; i++) {
    propertySlots.push(data.readUInt16LE(offset));
    offset += 2;
  }

  const propertyShielded = [];
  for (let i = 0; i < 22; i++) {
    propertyShielded.push(data.readUInt16LE(offset));
    offset += 2;
  }

  const setLastPurchasedProperty = [];
  for (let i = 0; i < 8; i++) {
    setLastPurchasedProperty.push(data.readUInt8(offset));
    offset += 1;
  }

  const setPropertiesMask = [];
  for (let i = 0; i < 8; i++) {
    setPropertiesMask.push(data.readUInt8(offset));
    offset += 1;
  }

  return {
    owner,
    totalBaseDailyIncome,
    lastAccumulationTimestamp,
    totalRewardsClaimed,
    pendingRewards,
    totalStealsAttempted,
    totalStealsSuccessful,
    totalSlotsOwned,
    completeSetsOwned,
    propertiesOwnedCount,
    bump,
    // Arrays
    propertyPurchaseTimestamp,
    propertyShieldExpiry,
    propertyShieldCooldown,
    propertyStealProtectionExpiry,
    setCooldownTimestamp,
    setCooldownDuration,
    stealCooldownTimestamp,
    propertySlots,
    propertyShielded,
    setLastPurchasedProperty,
    setPropertiesMask,
  };
}

module.exports = { deserializePlayerAccount };