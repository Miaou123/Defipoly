// ============================================
// FILE: src/services/api.ts
// Backend API service layer
// ✅ FIXED: Object-to-array conversion for cooldown endpoints
// ============================================

import { API_BASE_URL } from '@/utils/config';

// ========== TYPES ==========

export interface ApiPropertyOwnership {
  propertyId: number;
  slotsOwned: number;
  slotsShielded: number;
  shieldExpiry: number;
  purchaseTimestamp: number;
  shieldCooldownDuration: number;
  stealProtectionExpiry: number;
  bump: number;
  lastUpdated: number;
}

export interface ApiPlayerSetCooldown {
  setId: number;
  isOnCooldown: boolean;
  lastPurchaseTimestamp: number;
  cooldownDuration: number;
  cooldownRemaining: number;
  lastPurchasedPropertyId: number | null;
  propertiesOwnedInSet: number[];
  propertiesCount: number;
  lastSynced: number;
}

export interface ApiPlayerStealCooldown {
  propertyId: number;
  isOnCooldown: boolean;
  lastStealAttemptTimestamp: number;
  cooldownDuration: number;
  cooldownRemaining: number;
  lastSynced: number;
}

export interface ApiPropertyState {
  property_id: number;
  available_slots: number;
  last_updated: number;
}

export interface ApiPlayerStats {
  walletAddress: string;
  totalActions: number;
  propertiesBought: number;
  propertiesSold: number;
  successfulSteals: number;
  failedSteals: number;
  rewardsClaimed: number;
  shieldsUsed: number;
  totalSpent: number;
  totalEarned: number;
  totalSlotsOwned: number;
  dailyIncome: number;
  completedSets: number;
  lastActionTime?: number;
  lastClaimTimestamp: number;
  updatedAt: number;
}

// ========== OWNERSHIP ENDPOINTS ==========

export async function fetchOwnershipData(wallet: string): Promise<ApiPropertyOwnership[]> {
  const response = await fetch(`${API_BASE_URL}/api/ownership/${wallet}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ownership data: ${response.statusText}`);
  }
  const data = await response.json();
  return data.ownerships || [];
}

export async function fetchSingleOwnership(wallet: string, propertyId: number): Promise<ApiPropertyOwnership | null> {
  const ownerships = await fetchOwnershipData(wallet);
  return ownerships.find(o => o.propertyId === propertyId) || null;
}

// ========== COOLDOWN ENDPOINTS ==========

export async function fetchSetCooldown(wallet: string, setId: number): Promise<ApiPlayerSetCooldown | null> {
  const response = await fetch(`${API_BASE_URL}/api/cooldown/${wallet}/${setId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch set cooldown: ${response.statusText}`);
  }
  const data = await response.json();
  return data.cooldown || null;
}

export async function fetchAllSetCooldowns(wallet: string): Promise<ApiPlayerSetCooldown[]> {
  const response = await fetch(`${API_BASE_URL}/api/cooldown/${wallet}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch all set cooldowns: ${response.statusText}`);
  }
  const data = await response.json();
  
  // ✅ FIX: Backend returns { cooldowns: { 0: {...}, 1: {...}, ... } } as an object
  // Convert to array for frontend hooks
  if (data.cooldowns && typeof data.cooldowns === 'object') {
    return Object.values(data.cooldowns);
  }
  
  return [];
}

export async function fetchStealCooldown(wallet: string, propertyId: number): Promise<ApiPlayerStealCooldown | null> {
  const response = await fetch(`${API_BASE_URL}/api/steal-cooldown/${wallet}/${propertyId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch steal cooldown: ${response.statusText}`);
  }
  const data = await response.json();
  return data.cooldown || null;
}

export async function fetchAllStealCooldowns(wallet: string): Promise<ApiPlayerStealCooldown[]> {
  const response = await fetch(`${API_BASE_URL}/api/steal-cooldown/${wallet}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch all steal cooldowns: ${response.statusText}`);
  }
  const data = await response.json();
  
  // ✅ FIX: Backend returns { cooldowns: { 11: {...}, 12: {...}, ... } } as an object
  // Convert to array for frontend hooks
  if (data.cooldowns && typeof data.cooldowns === 'object') {
    return Object.values(data.cooldowns);
  }
  
  return [];
}

// ========== PROPERTY STATE ENDPOINTS ==========

export async function fetchPropertyState(propertyId: number): Promise<ApiPropertyState | null> {
  const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/state`);
  if (!response.ok) {
    throw new Error(`Failed to fetch property state: ${response.statusText}`);
  }
  const data = await response.json();
  return {
    property_id: data.propertyId,
    available_slots: data.availableSlots,
    last_updated: data.lastSynced
  };
}

export async function fetchAllPropertyStates(): Promise<ApiPropertyState[]> {
  const response = await fetch(`${API_BASE_URL}/api/properties/state`);
  if (!response.ok) {
    throw new Error(`Failed to fetch all property states: ${response.statusText}`);
  }
  const data = await response.json();
  return data.states || [];
}

// ========== PLAYER STATS ENDPOINT ==========

export async function fetchPlayerStats(wallet: string): Promise<ApiPlayerStats> {
  const response = await fetch(`${API_BASE_URL}/api/stats/${wallet}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch player stats: ${response.statusText}`);
  }
  return await response.json();
}

// ========== HELPER: Convert API data to frontend format ==========

export function convertApiOwnershipToFrontend(apiOwnership: ApiPropertyOwnership) {
  return {
    propertyId: apiOwnership.propertyId,
    slotsOwned: apiOwnership.slotsOwned,
    slotsShielded: apiOwnership.slotsShielded,
    shieldExpiry: apiOwnership.shieldExpiry,
    purchaseTimestamp: apiOwnership.purchaseTimestamp,
    shieldCooldownDuration: apiOwnership.shieldCooldownDuration,
    stealProtectionExpiry: apiOwnership.stealProtectionExpiry,
    bump: apiOwnership.bump,
  };
}