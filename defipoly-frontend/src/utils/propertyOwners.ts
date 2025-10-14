// utils/propertyOwners.ts
// Utility to fetch all players who own slots in a property

import { Connection, PublicKey, GetProgramAccountsFilter } from '@solana/web3.js';
import { Program, Idl, BN } from '@coral-xyz/anchor';
import { PROGRAM_ID } from './constants';

/**
 * Fetch all players who own unshielded slots in a property
 * This is needed for random steal functionality
 */
export async function fetchPropertyOwners(
  connection: Connection,
  program: Program<Idl>,
  propertyId: number
): Promise<{ owner: PublicKey; slotsOwned: number; unshieldedSlots: number }[]> {
  try {
    console.log(`🔍 Fetching all owners for property ${propertyId}...`);
    
    // Direct approach: fetch all ownership accounts using getProgramAccounts
    // This avoids the program.account.propertyOwnership issue
    const filters: GetProgramAccountsFilter[] = [
      {
        // Account discriminator for PropertyOwnership (8 bytes)
        dataSize: 8 + 32 + 1 + 2 + 2 + 8 + 8 + 1, // Adjust based on your struct size
      }
    ];

    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters,
    });

    console.log(`Found ${accounts.length} potential ownership accounts`);

    const owners: { owner: PublicKey; slotsOwned: number; unshieldedSlots: number }[] = [];
    const currentTime = Math.floor(Date.now() / 1000);

    for (const { pubkey, account } of accounts) {
      try {
        // Manually decode the account data
        const data = account.data;
        
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

        // Calculate unshielded slots
        const shieldActive = shieldExpiry > currentTime;
        const effectiveShieldedSlots = shieldActive ? slotsShielded : 0;
        const unshieldedSlots = slotsOwned - effectiveShieldedSlots;

        if (unshieldedSlots > 0) {
          owners.push({
            owner: player,
            slotsOwned: slotsOwned,
            unshieldedSlots: unshieldedSlots,
          });
        }
      } catch (error) {
        // Skip accounts that fail to decode
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
 */
export async function fetchPropertyOwnersViaPDA(
  connection: Connection,
  propertyId: number,
  playerAddresses: PublicKey[]
): Promise<{ owner: PublicKey; slotsOwned: number; unshieldedSlots: number }[]> {
  const owners: { owner: PublicKey; slotsOwned: number; unshieldedSlots: number }[] = [];
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
      
      // Parse data (same as above)
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

      const shieldActive = shieldExpiry > currentTime;
      const effectiveShieldedSlots = shieldActive ? slotsShielded : 0;
      const unshieldedSlots = slotsOwned - effectiveShieldedSlots;

      if (unshieldedSlots > 0) {
        owners.push({
          owner: ownerPubkey,
          slotsOwned,
          unshieldedSlots,
        });
      }
    } catch (error) {
      continue;
    }
  }

  return owners;
}

/**
 * Select a random owner from the list, weighted by their unshielded slots
 * More slots = higher chance of being selected
 */
export function selectRandomOwner(
  owners: { owner: PublicKey; slotsOwned: number; unshieldedSlots: number }[],
  excludePlayer?: PublicKey
): PublicKey | null {
  // Filter out the current player
  let eligibleOwners = owners;
  if (excludePlayer) {
    eligibleOwners = owners.filter(o => !o.owner.equals(excludePlayer));
  }

  if (eligibleOwners.length === 0) {
    return null;
  }

  // Weight by unshielded slots - more slots = higher chance
  const totalWeight = eligibleOwners.reduce((sum, owner) => sum + owner.unshieldedSlots, 0);
  const randomWeight = Math.random() * totalWeight;

  let cumulativeWeight = 0;
  for (const owner of eligibleOwners) {
    cumulativeWeight += owner.unshieldedSlots;
    if (randomWeight <= cumulativeWeight) {
      return owner.owner;
    }
  }

  // Fallback: return the last owner
  return eligibleOwners[eligibleOwners.length - 1].owner;
}

/**
 * Select a completely random owner (equal probability)
 */
export function selectRandomOwnerUnweighted(
  owners: { owner: PublicKey; slotsOwned: number; unshieldedSlots: number }[],
  excludePlayer?: PublicKey
): PublicKey | null {
  // Filter out the current player
  let eligibleOwners = owners;
  if (excludePlayer) {
    eligibleOwners = owners.filter(o => !o.owner.equals(excludePlayer));
  }

  if (eligibleOwners.length === 0) {
    return null;
  }

  // Pick a random owner with equal probability
  const randomIndex = Math.floor(Math.random() * eligibleOwners.length);
  return eligibleOwners[randomIndex].owner;
}