import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

// ========== ENUMS ==========

export type PropertyTier = 
  | { bronze: {} }
  | { silver: {} }
  | { gold: {} }
  | { platinum: {} };

// ========== ACCOUNT TYPES ==========

export interface GameConfig {
  authority: PublicKey;
  tokenMint: PublicKey;
  rewardPoolVault: PublicKey;
  totalSupply: BN;
  rewardPoolInitial: BN;
  bump: number;
  rewardPoolVaultBump: number;
}

export interface Property {
  propertyId: number;
  tier: PropertyTier;
  count: number;
  maxSlotsPerProperty: number;
  totalSlots: number;
  availableSlots: number;
  price: BN;
  dailyIncome: BN;
  shieldCostPercent: number;
  familyBonusMultiplier: number;
  bump: number;
}

export interface PlayerAccount {
  owner: PublicKey;
  totalPropertiesOwned: number;
  totalDailyIncome: BN;
  lastClaimTimestamp: BN;
  bump: number;
}

export interface PropertyOwnership {
  player: PublicKey;
  propertyId: number;
  slotsOwned: number;
  shieldActive: boolean;
  shieldExpiry: BN;
  shieldCyclesQueued: number;
  lastClaimTimestamp: BN;
  bump: number;
}

// ========== EVENT TYPES ==========

export interface PropertyBoughtEvent {
  player: PublicKey;
  propertyId: number;
  price: BN;
  slotsOwned: number;
}

export interface ShieldActivatedEvent {
  player: PublicKey;
  propertyId: number;
  cost: BN;
  expiry: BN;
  cycles: number;
}

export interface StealSuccessEvent {
  attacker: PublicKey;
  target: PublicKey;
  propertyId: number;
  stealCost: BN;
}

export interface StealFailedEvent {
  attacker: PublicKey;
  target: PublicKey;
  propertyId: number;
  stealCost: BN;
}

export interface RewardsClaimedEvent {
  player: PublicKey;
  amount: BN;
  hoursElapsed: BN;
}

export interface PropertySoldEvent {
  player: PublicKey;
  propertyId: number;
  slots: number;
  received: BN;
  burned: BN;
}