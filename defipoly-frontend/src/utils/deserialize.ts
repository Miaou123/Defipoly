import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import type { PropertyOwnership, Property, PlayerAccount } from '@/types/accounts';

export function deserializeOwnership(data: Buffer): PropertyOwnership {
  // Skip 8-byte discriminator
  let offset = 8;

  // player: Pubkey (32 bytes)
  const player = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  // property_id: u8 (1 byte)
  const propertyId = data.readUInt8(offset);
  offset += 1;

  // slots_owned: u16 (2 bytes, little-endian)
  const slotsOwned = data.readUInt16LE(offset);
  offset += 2;

  // shield_active: bool (1 byte)
  const shieldActive = data.readUInt8(offset) === 1;
  offset += 1;

  // shield_expiry: i64 (8 bytes, little-endian)
  const shieldExpiry = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  // shield_cycles_queued: u8 (1 byte)
  const shieldCyclesQueued = data.readUInt8(offset);
  offset += 1;

  // last_claim_timestamp: i64 (8 bytes, little-endian)
  const lastClaimTimestamp = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  // bump: u8 (1 byte)
  const bump = data.readUInt8(offset);

  return {
    player,
    propertyId,
    slotsOwned,
    shieldActive,
    shieldExpiry,
    shieldCyclesQueued,
    lastClaimTimestamp,
    bump,
  };
}

export function deserializeProperty(data: Buffer): Property {
  let offset = 8; // Skip discriminator

  const propertyId = data.readUInt8(offset);
  offset += 1;

  // tier enum (1 byte: 0=Bronze, 1=Silver, 2=Gold, 3=Platinum)
  const tierByte = data.readUInt8(offset);
  offset += 1;
  const tier = 
    tierByte === 0 ? { bronze: {} } :
    tierByte === 1 ? { silver: {} } :
    tierByte === 2 ? { gold: {} } :
    { platinum: {} };

  const count = data.readUInt8(offset);
  offset += 1;

  const maxSlotsPerProperty = data.readUInt16LE(offset);
  offset += 2;

  const totalSlots = data.readUInt16LE(offset);
  offset += 2;

  const availableSlots = data.readUInt16LE(offset);
  offset += 2;

  const price = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  const dailyIncome = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  const shieldCostPercent = data.readUInt16LE(offset);
  offset += 2;

  const familyBonusMultiplier = data.readUInt16LE(offset);
  offset += 2;

  const bump = data.readUInt8(offset);

  return {
    propertyId,
    tier,
    count,
    maxSlotsPerProperty,
    totalSlots,
    availableSlots,
    price,
    dailyIncome,
    shieldCostPercent,
    familyBonusMultiplier,
    bump,
  };
}

export function deserializePlayer(data: Buffer): PlayerAccount {
  let offset = 8; // Skip discriminator

  const owner = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  const totalPropertiesOwned = data.readUInt16LE(offset);
  offset += 2;

  const totalDailyIncome = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  const lastClaimTimestamp = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  const bump = data.readUInt8(offset);

  return {
    owner,
    totalPropertiesOwned,
    totalDailyIncome,
    lastClaimTimestamp,
    bump,
  };
}