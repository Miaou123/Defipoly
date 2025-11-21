import { ProfileData } from './profileStorage';

interface PlayerStats {
  walletAddress: string;
  totalActions: number;
  propertiesBought: number;
  totalSpent: number;
  totalEarned: number;
  totalSlotsOwned: number;
  successfulSteals: number;
  failedSteals: number;
  completedSets: number;
  shieldsUsed: number;
  dailyIncome: number;
}

interface CachedSpectatorData {
  profile: ProfileData;
  stats: PlayerStats | null;
  ownerships: any[];
  timestamp: number;
}

const spectatorCache = new Map<string, CachedSpectatorData>();

const CACHE_TTL = 30000; // 30 seconds

export function getCachedSpectator(wallet: string): CachedSpectatorData | null {
  const cached = spectatorCache.get(wallet);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached;
  }
  
  return null;
}

export function setCachedSpectator(
    wallet: string, 
    profile: ProfileData, 
    stats: PlayerStats | null = null,
    ownerships: any[] = []  // ✅ ADD THIS
  ): void {
    spectatorCache.set(wallet, {
      profile,
      stats,
      ownerships,  // ✅ ADD THIS
      timestamp: Date.now()
    });
  }

export function clearSpectatorCache(): void {
  spectatorCache.clear();
}