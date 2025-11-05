/**
 * Shared TypeScript types for Defipoly
 * Used by both frontend and backend
 */

// ============================================
// User & Profile Types
// ============================================

export interface Profile {
  walletAddress: string;
  username: string | null;
  profilePicture: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ProfileData {
  username: string | null;
  profilePicture: string | null;
  lastUpdated: number;
}

// ============================================
// Property Types
// ============================================

export interface Property {
  id: number;
  name: string;
  setId: number;
  setName: string;
  price: number;
  baseReward: number;
  maxSupply: number;
  currentSupply: number;
  tier: PropertyTier;
}

export enum PropertyTier {
  Brown = 'Brown',
  LightBlue = 'Light Blue',
  Pink = 'Pink',
  Orange = 'Orange',
  Red = 'Red',
  Yellow = 'Yellow',
  Green = 'Green',
  DarkBlue = 'Dark Blue'
}

export interface PropertyStats {
  propertyId: number;
  name: string;
  setId: number;
  setName: string;
  totalSlots: number;
  availableSlots: number;
  ownedSlots: number;
  shieldedSlots: number;
  ownerCount: number;
  price: number;
  baseReward: number;
  tier: PropertyTier;
}

export interface PropertyOwnership {
  propertyId: number;
  playerAddress: string;
  slotsOwned: number;
  shieldActive: boolean;
  purchasePrice: number;
  acquiredAt: number;
}

// ============================================
// Player & Game Stats Types
// ============================================

export interface PlayerStats {
  walletAddress: string;
  totalSlotsOwned: number;
  propertiesOwnedCount: number;
  completeSetsOwned: number;
  totalRewardsClaimed: string;
  totalIncome: number;
  lastClaimTimestamp: number;
  joinedAt: number;
  rank?: number;
  username?: string;
  profilePicture?: string;
}

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  username: string | null;
  profilePicture: string | null;
  totalSlotsOwned: number;
  propertiesOwnedCount: number;
  completeSetsOwned: number;
  totalIncome: number;
  totalRewardsClaimed: string;
}

// ============================================
// Game Action Types
// ============================================

export type ActionType = 
  | 'buy' 
  | 'sell' 
  | 'steal_success' 
  | 'steal_failed' 
  | 'shield' 
  | 'claim'
  | 'initialize';

export interface GameAction {
  id?: number;
  txSignature: string;
  actionType: ActionType;
  playerAddress: string;
  propertyId?: number;
  targetAddress?: string;
  amount?: number;
  slots?: number;
  blockTime: number;
  success: boolean;
  metadata?: any;
}

export interface RecentAction extends GameAction {
  propertyName?: string;
  username?: string;
  profilePicture?: string;
  targetUsername?: string;
  targetProfilePicture?: string;
}

// ============================================
// Cooldown Types
// ============================================

export interface Cooldown {
  setId: number;
  lastActionTime: number;
  cooldownEnd: number;
  isActive: boolean;
}

export interface StealCooldown {
  propertyId: number;
  targetAddress: string;
  cooldownEnd: number;
  isActive: boolean;
}

// ============================================
// Game State Types
// ============================================

export interface GameConfig {
  authority: string;
  devWallet: string;
  devFeePercentage: number;
  rewardPoolPercentage: number;
  stealCooldownDuration: number;
  initializationCooldown: number;
  maxSlotsPerProperty: number;
  baseClaimCooldown: number;
  stealSuccessRate: number;
  shieldDuration: number;
  shieldCostMultiplier: number;
  rewardPoolVault: string;
  totalPlayers: number;
}

export interface GameState {
  config: GameConfig;
  totalProperties: number;
  totalPlayers: number;
  totalRewardsClaimed: string;
  totalVolume: string;
  lastUpdateTime: number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// WebSocket Event Types
// ============================================

export interface WSMessage {
  type: 'action' | 'stats_update' | 'price_update' | 'leaderboard_update';
  data: any;
  timestamp: number;
}

export interface ActionWSMessage extends WSMessage {
  type: 'action';
  data: RecentAction;
}

export interface StatsUpdateWSMessage extends WSMessage {
  type: 'stats_update';
  data: {
    propertyId: number;
    stats: PropertyStats;
  };
}

// ============================================
// Transaction Types
// ============================================

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
  confirmedAt?: number;
}

export interface PendingTransaction {
  signature: string;
  type: ActionType;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: number;
  metadata?: any;
}

// ============================================
// Utility Types
// ============================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface TimestampedEntity {
  createdAt: number;
  updatedAt: number;
}

export interface IdentifiedEntity {
  id: string | number;
}

// ============================================
// Form Types
// ============================================

export interface ProfileFormData {
  username: string;
  profilePicture?: string;
}

export interface PropertyPurchaseForm {
  propertyId: number;
  slots: number;
}

// ============================================
// Error Types
// ============================================

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  PROPERTY_FULL = 'PROPERTY_FULL',
  COOLDOWN_ACTIVE = 'COOLDOWN_ACTIVE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
}