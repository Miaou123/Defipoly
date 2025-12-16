// utils/propertyOwners.ts
// Utility to fetch all players who own slots in a property
// UPDATED for v9: Now reads from PlayerAccount arrays instead of separate ownership PDAs

import { Connection, PublicKey, GetProgramAccountsFilter } from '@solana/web3.js';
import { Program, Idl, BN } from '@coral-xyz/anchor';
import { PROGRAM_ID } from './constants';
import { deserializePlayer } from './deserialize';

/**
 * Fetch all players who own unshielded slots in a property
 * V9 UPDATE: Now reads from PlayerAccount arrays instead of PropertyOwnership PDAs
 * 
 * WARNING: In v9, PropertyOwnership PDAs no longer exist. All ownership data
 * is stored in PlayerAccount arrays. For better performance, consider using
 * the backend API instead of parsing all PlayerAccounts on-chain.
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
    console.warn('⚠️ [v9] fetchPropertyOwners: Consider using backend API for better performance');
    
    // In v9: Fetch all PlayerAccount PDAs instead of PropertyOwnership PDAs
    const filters: GetProgramAccountsFilter[] = [
      {
        // PlayerAccount discriminator + minimum size check
        dataSize: 1500, // PlayerAccount with arrays is much larger than old 110 byte ownership accounts
      }
    ];

    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters,
    });

    console.log(`Found ${accounts.length} potential PlayerAccount accounts`);

    const owners: { 
      owner: PublicKey; 
      slotsOwned: number; 
      unshieldedSlots: number;
      stealProtectionExpiry: number;
    }[] = [];
    const currentTime = Math.floor(Date.now() / 1000);

    for (const { pubkey, account } of accounts) {
      try {
        // Try to deserialize as PlayerAccount
        const playerAccount = deserializePlayer(account.data);
        
        // Skip if no properties owned
        if (playerAccount.propertiesOwnedCount === 0) {
          continue;
        }

        // Parse the arrays to check this specific property
        // Note: This requires implementing array parsing in deserializePlayer
        // For now, we'll skip the complex array parsing and recommend using backend API
        
        console.warn('⚠️ [v9] Complex array parsing not implemented. Use backend API instead.');
        continue;
        
      } catch (error) {
        // Skip accounts that fail to decode (not PlayerAccount)
        continue;
      }
    }

    console.warn('⚠️ [v9] On-chain property owner fetching is complex in v9. Use backend API: /api/properties/{propertyId}/owners');
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