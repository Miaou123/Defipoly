import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

// ========== ACCOUNT TYPES ==========

export interface GameConfig {
  authority: PublicKey;
  devWallet: PublicKey;
  tokenMint: PublicKey;
  rewardPoolVault: PublicKey;
  totalSupply: BN;
  circulatingSupply: BN;
  rewardPoolInitial: BN;
  currentPhase: number;
  gamePaused: boolean;
  stealChanceTargetedBps: number;
  stealChanceRandomBps: number;
  stealCostPercentBps: number;
  setBonusBps: number;
  maxPropertiesPerClaim: number;
  minClaimIntervalMinutes: BN;
  bump: number;
  rewardPoolVaultBump: number;
}

export interface Property {
  propertyId: number;
  setId: number;
  maxSlotsPerProperty: number;
  availableSlots: number;
  maxPerPlayer: number;
  price: BN;
  yieldPercentBps: number;
  shieldCostPercentBps: number;
  cooldownSeconds: BN;
  bump: number;
}


export interface PlayerAccount {
  owner: PublicKey;
  totalSlotsOwned: number;
  totalBaseDailyIncome: BN;
  lastClaimTimestamp: BN;
  totalRewardsClaimed: BN;
  completeSetsOwned: number;
  propertiesOwnedCount: number;
  totalStealsAttempted: number;
  totalStealsSuccessful: number;
  bump: number;
  pendingRewards: BN;
}

export interface PropertyOwnership {
  player: PublicKey;
  propertyId: number;
  slotsOwned: number;
  slotsShielded: number;
  purchaseTimestamp: BN;
  shieldExpiry: BN;
  shieldCooldownDuration: BN;
  stealProtectionExpiry: BN; 
  bump: number;
}

export interface PlayerSetCooldown {
  player: PublicKey;
  setId: number;
  lastPurchaseTimestamp: number;
  cooldownDuration: number;
  lastPurchasedPropertyId: number;
  propertiesOwnedInSet: number[];
  propertiesCount: number;
  bump: number;
}

export interface PlayerSetOwnership {
  player: PublicKey;
  setId: number;
  totalSlotsInSet: number;
  propertiesOwnedIds: number[];
  propertiesCount: number;
  hasCompleteSet: boolean;
  firstPropertyTimestamp: BN;
  bump: number;
}

export interface SetStats {
  setId: number;
  totalSlotsSold: BN;
  totalRevenue: BN;
  uniqueOwners: number;
  bump: number;
}

export interface StealRequest {
  attacker: PublicKey;
  target: PublicKey;
  propertyId: number;
  isTargeted: boolean;
  stealCost: BN;
  timestamp: BN;
  requestSlot: BN;
  fulfilled: boolean;
  success: boolean;
  vrfResult: BN;
  attemptNumber: number;
  userRandomness: number[]; // [u8; 32]
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
  slotsShielded: number;
  cost: BN;
  expiry: BN;
}

export interface StealRequestedEvent {
  attacker: PublicKey;
  target: PublicKey;
  propertyId: number;
  stealCost: BN;
  isTargeted: boolean;
  requestSlot: BN;
}

export interface StealSuccessEvent {
  attacker: PublicKey;
  target: PublicKey;
  propertyId: number;
  stealCost: BN;
  targeted: boolean;
  vrfResult: BN;
}

export interface StealFailedEvent {
  attacker: PublicKey;
  target: PublicKey;
  propertyId: number;
  stealCost: BN;
  targeted: boolean;
  vrfResult: BN;
}

export interface RewardsClaimedEvent {
  player: PublicKey;
  amount: BN;
  secondsElapsed: BN;
}

export interface PropertySoldEvent {
  player: PublicKey;
  propertyId: number;
  slots: number;
  received: BN;
  sellValuePercent: number;
  daysHeld: BN;
}

export interface AdminUpdateEvent {
  propertyId: number;
  updateType: string;
  newValue: BN;
}