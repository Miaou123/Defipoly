// ============================================
// FILE: src/services/api.ts
// Backend API service layer
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3005';

// ========== TYPES ==========

export interface ApiPropertyOwnership {
  wallet_address: string;
  property_id: number;
  slots_owned: number;
  slots_shielded: number;
  shield_expiry: number;
  purchase_timestamp: number;
  shield_cooldown_duration: number;
  steal_protection_expiry: number;
  bump: number;
  last_updated: number;
}

export interface ApiPlayerSetCooldown {
  wallet_address: string;
  set_id: number;
  last_purchase_timestamp: number;
  cooldown_duration: number;
  last_purchased_property_id: number;
  properties_owned_in_set: string; // JSON array
  properties_count: number;
}

export interface ApiPlayerStealCooldown {
  wallet_address: string;
  property_id: number;
  last_steal_timestamp: number;
  cooldown_duration: number;
}

export interface ApiPropertyState {
  property_id: number;
  available_slots: number;
  last_updated: number;
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
  return ownerships.find(o => o.property_id === propertyId) || null;
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
  return data.cooldowns || [];
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
  return data.cooldowns || [];
}

// ========== PROPERTY STATE ENDPOINTS ==========

export async function fetchPropertyState(propertyId: number): Promise<ApiPropertyState | null> {
  const response = await fetch(`${API_BASE_URL}/api/properties/state/${propertyId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch property state: ${response.statusText}`);
  }
  const data = await response.json();
  return data.state || null;
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

export async function fetchPlayerStats(wallet: string) {
  const response = await fetch(`${API_BASE_URL}/api/stats/${wallet}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch player stats: ${response.statusText}`);
  }
  return await response.json();
}

// ========== HELPER: Convert API data to frontend format ==========

export function convertApiOwnershipToFrontend(apiOwnership: ApiPropertyOwnership) {
  return {
    propertyId: apiOwnership.property_id,
    slotsOwned: apiOwnership.slots_owned,
    slotsShielded: apiOwnership.slots_shielded,
    shieldExpiry: apiOwnership.shield_expiry,
    purchaseTimestamp: apiOwnership.purchase_timestamp,
    shieldCooldownDuration: apiOwnership.shield_cooldown_duration,
    stealProtectionExpiry: apiOwnership.steal_protection_expiry,
    bump: apiOwnership.bump,
  };
}