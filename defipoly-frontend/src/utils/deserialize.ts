import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import type { PropertyOwnership, Property, PlayerAccount } from '@/types/accounts';

export function deserializeOwnership(data: Buffer): PropertyOwnership {
  let offset = 8; // Skip discriminator

  // player: Pubkey (32 bytes)
  const player = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  // property_id: u8 (1 byte)
  const propertyId = data.readUInt8(offset);
  offset += 1;

  // slots_owned: u16 (2 bytes)
  const slotsOwned = data.readUInt16LE(offset);
  offset += 2;

  // slots_shielded: u16 (2 bytes)
  const slotsShielded = data.readUInt16LE(offset);
  offset += 2;

  // purchase_timestamp: i64 (8 bytes)
  const purchaseTimestamp = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  // shield_expiry: i64 (8 bytes)
  const shieldExpiry = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  // shield_cooldown_duration: i64 (8 bytes)
  const shieldCooldownDuration = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  // steal_protection_expiry: i64 (8 bytes)  
  const stealProtectionExpiry = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  // bump: u8 (1 byte)
  const bump = data.readUInt8(offset);

  return {
    player,
    propertyId,
    slotsOwned,
    slotsShielded,
    purchaseTimestamp,
    shieldExpiry,
    shieldCooldownDuration,
    stealProtectionExpiry,
    bump,
  };
}

export function deserializeProperty(data: Buffer): Property {
  let offset = 8; // Skip discriminator

  // property_id: u8
  const propertyId = data.readUInt8(offset);
  offset += 1;

  // set_id: u8
  const setId = data.readUInt8(offset);
  offset += 1;

  // max_slots_per_property: u16
  const maxSlotsPerProperty = data.readUInt16LE(offset);
  offset += 2;

  // available_slots: u16
  const availableSlots = data.readUInt16LE(offset);
  offset += 2;

  // max_per_player: u16
  const maxPerPlayer = data.readUInt16LE(offset);
  offset += 2;

  // price: u64 (8 bytes)
  const price = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  // yield_percent_bps: u16
  const yieldPercentBps = data.readUInt16LE(offset);
  offset += 2;

  // shield_cost_percent_bps: u16
  const shieldCostPercentBps = data.readUInt16LE(offset);
  offset += 2;

  // cooldown_seconds: i64 (8 bytes)
  const cooldownSeconds = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  // bump: u8
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
    bump,
  };
}

export function deserializePlayer(data: Buffer): PlayerAccount {
  let offset = 8; // Skip discriminator

  // owner: Pubkey (32 bytes)
  const owner = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  // total_slots_owned: u16
  const totalSlotsOwned = data.readUInt16LE(offset);
  offset += 2;

  // ⭐ NEW: total_base_daily_income: u64 (8 bytes)
  const totalBaseDailyIncome = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  // last_claim_timestamp: i64 (8 bytes)
  const lastClaimTimestamp = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  // total_rewards_claimed: u64 (8 bytes)
  const totalRewardsClaimed = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  // complete_sets_owned: u8
  const completeSetsOwned = data.readUInt8(offset);
  offset += 1;

  // properties_owned_count: u8
  const propertiesOwnedCount = data.readUInt8(offset);
  offset += 1;

  // total_steals_attempted: u32
  const totalStealsAttempted = data.readUInt32LE(offset);
  offset += 4;

  // total_steals_successful: u32
  const totalStealsSuccessful = data.readUInt32LE(offset);
  offset += 4;

  // bump: u8
  const bump = data.readUInt8(offset);

  return {
    owner,
    totalSlotsOwned,
    totalBaseDailyIncome,
    lastClaimTimestamp,
    totalRewardsClaimed,
    completeSetsOwned,
    propertiesOwnedCount,
    totalStealsAttempted,
    totalStealsSuccessful,
    bump,
  };
}