// utils/propertyOwners.ts
// Utility to fetch all players who own slots in a property
// UPDATED: Now includes steal protection expiry checking

import { Connection, PublicKey, GetProgramAccountsFilter } from '@solana/web3.js';
import { Program, Idl, BN } from '@coral-xyz/anchor';
import { PROGRAM_ID } from './constants';

/**
 * Fetch all players who own unshielded slots in a property
 * Now also returns steal protection expiry for filtering
 */
export async function fetchPropertyOwners(
  connection: Connection,
  program: Program<Idl>,
  propertyId: number
): Promise<{ 
  owner: PublicKey; 
  slotsOwned: number; 
  unshieldedSlots: number;
  stealProtectionExpiry: number; 
}[]> {
  try {
    console.log(`🔍 Fetching all owners for property ${propertyId}...`);
    
    // Direct approach: fetch all ownership accounts using getProgramAccounts
    const filters: GetProgramAccountsFilter[] = [
      {
        // Account discriminator for PropertyOwnership
        // 🔧 FIXED: Updated to actual account size seen on-chain (110 bytes)
        dataSize: 110, // Updated from 70 to match actual account size
      }
    ];

    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters,
    });

    console.log(`Found ${accounts.length} potential ownership accounts`);

    const owners: { 
      owner: PublicKey; 
      slotsOwned: number; 
      unshieldedSlots: number;
      stealProtectionExpiry: number;
    }[] = [];
    const currentTime = Math.floor(Date.now() / 1000);

    for (const { pubkey, account } of accounts) {
      try {
        // Manually decode the account data
        const data = account.data;
        
        // Debug: log account size for first few accounts
        if (owners.length < 3) {
          console.log(`📊 Account ${pubkey.toString().slice(0, 8)}... has ${data.length} bytes`);
        }
        
        // Skip discriminator (8 bytes)
        let offset = 8;
        
        // Read player (32 bytes)
        const player = new PublicKey(data.slice(offset, offset + 32));
        offset += 32;
        
        // Read property_id (1 byte)
        const accountPropertyId = data.readUInt8(offset);
        offset += 1;
        
        // Skip if not our property
        if (accountPropertyId !== propertyId) {
          continue;
        }
        
        // Read slots_owned (2 bytes, u16)
        const slotsOwned = data.readUInt16LE(offset);
        offset += 2;
        
        if (slotsOwned === 0) {
          continue;
        }
        
        // Read slots_shielded (2 bytes, u16)
        const slotsShielded = data.readUInt16LE(offset);
        offset += 2;
        
        // Skip purchase_timestamp (8 bytes)
        offset += 8;
        
        // Read shield_expiry (8 bytes, i64)
        const shieldExpiryLow = data.readUInt32LE(offset);
        const shieldExpiryHigh = data.readUInt32LE(offset + 4);
        const shieldExpiry = shieldExpiryLow + (shieldExpiryHigh * 0x100000000);
        offset += 8;

        // Skip shield_cooldown_duration (8 bytes)
        offset += 8;

        // 🆕 NEW: Read steal_protection_expiry (8 bytes, i64)
        const stealProtectionExpiryLow = data.readUInt32LE(offset);
        const stealProtectionExpiryHigh = data.readUInt32LE(offset + 4);
        const stealProtectionExpiry = stealProtectionExpiryLow + (stealProtectionExpiryHigh * 0x100000000);
        offset += 8;

        // Calculate unshielded slots
        const shieldActive = shieldExpiry > currentTime;
        const effectiveShieldedSlots = shieldActive ? slotsShielded : 0;
        const unshieldedSlots = slotsOwned - effectiveShieldedSlots;

        if (unshieldedSlots > 0) {
          owners.push({
            owner: player,
            slotsOwned: slotsOwned,
            unshieldedSlots: unshieldedSlots,
            stealProtectionExpiry: stealProtectionExpiry,
          });
        }
      } catch (error) {
        // Skip accounts that fail to decode
        console.warn('Failed to decode account:', error);
        continue;
      }
    }

    console.log(`✅ Found ${owners.length} owners with unshielded slots for property ${propertyId}`);
    return owners;
  } catch (error) {
    console.error('Error fetching property owners:', error);
    return [];
  }
}

/**
 * Alternative: Use ownership PDA derivation to check specific players
 * This is more reliable but requires knowing which players to check
 * 🆕 UPDATED: Now reads steal_protection_expiry
 */
export async function fetchPropertyOwnersViaPDA(
  connection: Connection,
  propertyId: number,
  playerAddresses: PublicKey[]
): Promise<{ 
  owner: PublicKey; 
  slotsOwned: number; 
  unshieldedSlots: number;
  stealProtectionExpiry: number;
}[]> {
  const owners: { 
    owner: PublicKey; 
    slotsOwned: number; 
    unshieldedSlots: number;
    stealProtectionExpiry: number;
  }[] = [];
  const currentTime = Math.floor(Date.now() / 1000);

  for (const player of playerAddresses) {
    try {
      // Derive ownership PDA
      const [ownershipPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('ownership'), player.toBuffer(), Buffer.from([propertyId])],
        PROGRAM_ID
      );

      // Fetch account
      const accountInfo = await connection.getAccountInfo(ownershipPDA);
      if (!accountInfo) continue;

      const data = accountInfo.data;
      
      // Parse data
      let offset = 8;
      const ownerPubkey = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;
      
      const accountPropertyId = data.readUInt8(offset);
      offset += 1;
      
      if (accountPropertyId !== propertyId) continue;
      
      const slotsOwned = data.readUInt16LE(offset);
      offset += 2;
      
      if (slotsOwned === 0) continue;
      
      const slotsShielded = data.readUInt16LE(offset);
      offset += 2;
      offset += 8; // skip purchase_timestamp
      
      const shieldExpiryLow = data.readUInt32LE(offset);
      const shieldExpiryHigh = data.readUInt32LE(offset + 4);
      const shieldExpiry = shieldExpiryLow + (shieldExpiryHigh * 0x100000000);
      offset += 8;

      offset += 8; // skip shield_cooldown_duration

      // 🆕 NEW: Read steal_protection_expiry
      const stealProtectionExpiryLow = data.readUInt32LE(offset);
      const stealProtectionExpiryHigh = data.readUInt32LE(offset + 4);
      const stealProtectionExpiry = stealProtectionExpiryLow + (stealProtectionExpiryHigh * 0x100000000);

      const shieldActive = shieldExpiry > currentTime;
      const effectiveShieldedSlots = shieldActive ? slotsShielded : 0;
      const unshieldedSlots = slotsOwned - effectiveShieldedSlots;

      if (unshieldedSlots > 0) {
        owners.push({
          owner: ownerPubkey,
          slotsOwned,
          unshieldedSlots,
          stealProtectionExpiry,
        });
      }
    } catch (error) {
      continue;
    }
  }

  return owners;
}

/**
 * 🆕 NEW: Get count of owners by protection status
 */
export function getOwnerProtectionStats(
  owners: { 
    owner: PublicKey; 
    slotsOwned: number; 
    unshieldedSlots: number;
    stealProtectionExpiry: number;
  }[]
): {
  total: number;
  withUnshieldedSlots: number;
  withStealProtection: number;
  fullyProtected: number;
  vulnerable: number;
} {
  const currentTime = Math.floor(Date.now() / 1000);

  const stats = {
    total: owners.length,
    withUnshieldedSlots: 0,
    withStealProtection: 0,
    fullyProtected: 0,
    vulnerable: 0,
  };

  for (const owner of owners) {
    const hasUnshieldedSlots = owner.unshieldedSlots > 0;
    const hasStealProtection = currentTime < owner.stealProtectionExpiry;

    if (hasUnshieldedSlots) {
      stats.withUnshieldedSlots++;
    }

    if (hasStealProtection) {
      stats.withStealProtection++;
    }

    if (!hasUnshieldedSlots || hasStealProtection) {
      stats.fullyProtected++;
    } else {
      stats.vulnerable++;
    }
  }

  return stats;
}

/**
 * 🆕 NEW: Filter owners to get only eligible steal targets
 * (unshielded slots AND no steal protection)
 */
export function getEligibleStealTargets(
  owners: { 
    owner: PublicKey; 
    slotsOwned: number; 
    unshieldedSlots: number;
    stealProtectionExpiry: number;
  }[],
  excludePlayer?: PublicKey
): PublicKey[] {
  const currentTime = Math.floor(Date.now() / 1000);
  const eligible: PublicKey[] = [];

  for (const owner of owners) {
    // Skip excluded player
    if (excludePlayer && owner.owner.equals(excludePlayer)) {
      continue;
    }

    // Must have unshielded slots
    if (owner.unshieldedSlots <= 0) {
      continue;
    }

    // Must not have active steal protection
    if (currentTime < owner.stealProtectionExpiry) {
      continue;
    }

    eligible.push(owner.owner);
  }

  return eligible;
}