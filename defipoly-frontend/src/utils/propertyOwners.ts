// utils/propertyOwners.ts
// v9 UPDATE: Now fetches from backend API instead of on-chain PDAs
// PropertyOwnership PDAs no longer exist - data is in PlayerAccount arrays
// Backend syncs this data to database for efficient querying

import { PublicKey } from '@solana/web3.js';
import { API_BASE_URL } from '@/utils/config';

export interface PropertyOwner {
  owner: PublicKey;
  slotsOwned: number;
  unshieldedSlots: number;
  stealProtectionExpiry: number;
  stealProtectionActive: boolean;
  shieldActive: boolean;
}

export interface StealTarget {
  walletAddress: string;
  slotsOwned: number;
  unshieldedSlots: number;
  stealProtectionExpiry: number;
  isValidTarget: boolean;
}

/**
 * Fetch all owners of a property with unshielded slots
 * v9: Uses backend API instead of on-chain PDA fetching
 */
export async function fetchPropertyOwners(
  propertyId: number,
  excludeWallet?: string
): Promise<PropertyOwner[]> {
  try {
    let url = `${API_BASE_URL}/api/properties/${propertyId}/owners`;
    if (excludeWallet) {
      url += `?excludeWallet=${excludeWallet}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch property owners: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    // Transform to expected format
    return (data.owners || []).map((owner: any) => ({
      owner: new PublicKey(owner.walletAddress),
      slotsOwned: owner.slotsOwned,
      unshieldedSlots: owner.unshieldedSlots,
      stealProtectionExpiry: owner.stealProtectionExpiry,
      stealProtectionActive: owner.stealProtectionActive,
      shieldActive: owner.shieldActive,
    }));
  } catch (error) {
    console.error('Error fetching property owners:', error);
    return [];
  }
}

/**
 * Fetch valid steal targets for a property
 * Excludes attacker and players with active steal protection
 * v9: Uses backend API
 */
export async function fetchStealTargets(
  propertyId: number,
  attackerWallet: string
): Promise<StealTarget[]> {
  try {
    const url = `${API_BASE_URL}/api/properties/${propertyId}/steal-targets?attackerWallet=${attackerWallet}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch steal targets: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.targets || [];
  } catch (error) {
    console.error('Error fetching steal targets:', error);
    return [];
  }
}

/**
 * Check if a property has any valid steal targets
 * Quick check before showing steal UI
 */
export async function hasStealTargets(
  propertyId: number,
  attackerWallet: string
): Promise<boolean> {
  const targets = await fetchStealTargets(propertyId, attackerWallet);
  return targets.length > 0;
}

/**
 * Get count of owners by protection status
 * Utility function to analyze owner protection states
 */
export function getOwnerProtectionStats(
  owners: PropertyOwner[]
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
 * Filter owners to get only eligible steal targets
 * (unshielded slots AND no steal protection)
 */
export function getEligibleStealTargets(
  owners: PropertyOwner[],
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

