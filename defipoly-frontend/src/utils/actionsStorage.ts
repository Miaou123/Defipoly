// ============================================
// FILE: defipoly-frontend/src/utils/actionsStorage.ts
// New utility for storing and retrieving game actions
// ============================================

const API_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3001';

export interface GameAction {
  id?: number;
  txSignature: string;
  actionType: 'buy' | 'sell' | 'steal_success' | 'steal_failed' | 'claim' | 'shield';
  playerAddress: string;
  propertyId?: number;
  targetAddress?: string;
  amount?: number;
  slots?: number;
  success?: boolean;
  metadata?: any;
  blockTime: number;
  createdAt?: number;
}

export interface PlayerStats {
  walletAddress: string;
  totalActions: number;
  propertiesBought: number;
  propertiesSold: number;
  successfulSteals: number;
  failedSteals: number;
  rewardsClaimed: number;
  shieldsActivated: number;
  totalSpent: number;
  totalEarned: number;
  lastActionTime?: number;
  updatedAt?: number;
}

/**
 * Store a single game action
 */
export async function storeAction(action: GameAction): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });

    if (response.ok) {
      console.log('✅ Action stored:', action.actionType);
      return true;
    }
    console.error('Failed to store action:', await response.text());
    return false;
  } catch (error) {
    console.error('Error storing action:', error);
    return false;
  }
}

/**
 * Store multiple actions at once (batch)
 */
export async function storeActionsBatch(actions: GameAction[]): Promise<number> {
  try {
    const response = await fetch(`${API_URL}/api/actions/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actions }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Stored ${data.inserted} actions`);
      return data.inserted;
    }
    return 0;
  } catch (error) {
    console.error('Error storing actions batch:', error);
    return 0;
  }
}

/**
 * Get player's action history
 */
export async function getPlayerActions(
  walletAddress: string,
  limit: number = 50,
  offset: number = 0
): Promise<GameAction[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/actions/player/${walletAddress}?limit=${limit}&offset=${offset}`
    );

    if (response.ok) {
      const data = await response.json();
      return data.actions;
    }
    return [];
  } catch (error) {
    console.error('Error fetching player actions:', error);
    return [];
  }
}

/**
 * Get recent actions (for live feed)
 */
export async function getRecentActions(limit: number = 20): Promise<GameAction[]> {
  try {
    const response = await fetch(`${API_URL}/api/actions/recent?limit=${limit}`);

    if (response.ok) {
      const data = await response.json();
      return data.actions;
    }
    return [];
  } catch (error) {
    console.error('Error fetching recent actions:', error);
    return [];
  }
}

/**
 * Get player stats
 */
export async function getPlayerStats(walletAddress: string): Promise<PlayerStats | null> {
  try {
    const response = await fetch(`${API_URL}/api/stats/${walletAddress}`);

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  type: 'actions' | 'steals' | 'bought' = 'actions',
  limit: number = 10
): Promise<PlayerStats[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/leaderboard?type=${type}&limit=${limit}`
    );

    if (response.ok) {
      const data = await response.json();
      return data.leaderboard;
    }
    return [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

export function eventToAction(
    event: any,
    txSignature: string,
    blockTime: number
  ): GameAction | null {
    const eventName = event.name;
    
    switch (eventName) {
      case 'PropertyBoughtEvent':
      case 'propertyBoughtEvent':
        return {
          txSignature,
          actionType: 'buy',
          playerAddress: event.data.player.toString(),
          propertyId: event.data.propertyId ?? event.data.property_id,  // ← FIXED
          amount: Number(event.data.price),
          slots: event.data.slotsOwned ?? event.data.slots_owned,  // ← FIXED
          blockTime,
          metadata: { price: event.data.price.toString() }
        };
  
      case 'PropertySoldEvent':
      case 'propertySoldEvent':
        return {
          txSignature,
          actionType: 'sell',
          playerAddress: event.data.player.toString(),
          propertyId: event.data.propertyId ?? event.data.property_id,  // ← FIXED
          slots: event.data.slots,
          amount: Number(event.data.received),
          blockTime,
          metadata: {
            received: event.data.received.toString(),
            burned: event.data.burned.toString()
          }
        };
  
      case 'ShieldActivatedEvent':
      case 'shieldActivatedEvent':
        return {
          txSignature,
          actionType: 'shield',
          playerAddress: event.data.player.toString(),
          propertyId: event.data.propertyId ?? event.data.property_id,  // ← FIXED
          amount: Number(event.data.cost),
          blockTime,
          metadata: {
            expiry: event.data.expiry,
            cycles: event.data.cycles
          }
        };
  
      case 'StealSuccessEvent':
      case 'stealSuccessEvent':
        return {
          txSignature,
          actionType: 'steal_success',
          playerAddress: event.data.attacker.toString(),
          targetAddress: event.data.target.toString(),
          propertyId: event.data.propertyId ?? event.data.property_id,  // ← FIXED
          amount: Number(event.data.stealCost ?? event.data.steal_cost),  // ← FIXED
          success: true,
          blockTime
        };
  
      case 'StealFailedEvent':
      case 'stealFailedEvent':
        return {
          txSignature,
          actionType: 'steal_failed',
          playerAddress: event.data.attacker.toString(),
          targetAddress: event.data.target.toString(),
          propertyId: event.data.propertyId ?? event.data.property_id,  // ← FIXED
          amount: Number(event.data.stealCost ?? event.data.steal_cost),  // ← FIXED
          success: false,
          blockTime
        };
  
      case 'RewardsClaimedEvent':
      case 'rewardsClaimedEvent':
        return {
          txSignature,
          actionType: 'claim',
          playerAddress: event.data.player.toString(),
          amount: Number(event.data.amount),
          blockTime,
          metadata: {
            hoursElapsed: event.data.hoursElapsed ?? event.data.hours_elapsed  // ← FIXED
          }
        };
  
      default:
        return null;
    }
  }

/**
 * Sync blockchain events to database
 * Call this periodically or after important transactions
 */
export async function syncEventsToDatabase(
  events: any[],
  txSignature: string,
  blockTime: number
): Promise<void> {
  const actions = events
    .map(event => eventToAction(event, txSignature, blockTime))
    .filter(action => action !== null) as GameAction[];

  if (actions.length > 0) {
    await storeActionsBatch(actions);
  }
}