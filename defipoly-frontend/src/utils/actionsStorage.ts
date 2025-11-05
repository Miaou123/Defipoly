// defipoly-frontend/src/utils/actionsStorage.ts
// Updated to properly track slots while keeping all original functionality

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101';

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
  totalSlotsOwned: number;
  dailyIncome: number; // ✅ Calculated daily income with set bonuses
  lastActionTime?: number;
  updatedAt?: number;
}

/**
 * Store a single game action
 */
export async function storeAction(action: GameAction): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/actions`, {
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
    const response = await fetch(`${API_BASE_URL}/api/actions/batch`, {
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
      `${API_BASE_URL}/api/actions/player/${walletAddress}?limit=${limit}&offset=${offset}`
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
    const response = await fetch(`${API_BASE_URL}/api/actions/recent?limit=${limit}`);

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
    const response = await fetch(`${API_BASE_URL}/api/stats/${walletAddress}`);

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
 * Get leaderboard (by daily income)
 */
export async function getLeaderboard(limit: number = 10): Promise<PlayerStats[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leaderboard?limit=${limit}`);

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

/**
 * Convert blockchain event to GameAction
 */
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
        propertyId: event.data.propertyId ?? event.data.property_id,
        amount: Number(event.data.totalCost ?? event.data.price),
        // ✅ UPDATED: Track the actual slots bought from the new 'slots' field
        slots: event.data.slots ?? event.data.slotsOwned ?? event.data.slots_owned ?? 1,
        blockTime,
        metadata: { 
          price: event.data.price?.toString(),
          totalCost: event.data.totalCost?.toString(),
          totalSlotsOwned: event.data.totalSlotsOwned ?? event.data.total_slots_owned
        }
      };

    case 'PropertySoldEvent':
    case 'propertySoldEvent':
      return {
        txSignature,
        actionType: 'sell',
        playerAddress: event.data.player.toString(),
        propertyId: event.data.propertyId ?? event.data.property_id,
        slots: event.data.slots, // ✅ Slots sold
        amount: Number(event.data.received),
        blockTime,
        metadata: {
          received: event.data.received?.toString(),
          burned: event.data.burned?.toString(),
          sellValuePercent: event.data.sellValuePercent ?? event.data.sell_value_percent,
          daysHeld: event.data.daysHeld ?? event.data.days_held
        }
      };

    case 'ShieldActivatedEvent':
    case 'shieldActivatedEvent':
      return {
        txSignature,
        actionType: 'shield',
        playerAddress: event.data.player.toString(),
        propertyId: event.data.propertyId ?? event.data.property_id,
        amount: Number(event.data.cost),
        slots: event.data.slotsShielded ?? event.data.slots_shielded, // ✅ Slots shielded
        blockTime,
        metadata: {
          expiry: event.data.expiry?.toString(),
          slotsShielded: event.data.slotsShielded ?? event.data.slots_shielded
        }
      };

    case 'StealSuccessEvent':
    case 'stealSuccessEvent':
      return {
        txSignature,
        actionType: 'steal_success',
        playerAddress: event.data.attacker.toString(),
        targetAddress: event.data.target.toString(),
        propertyId: event.data.propertyId ?? event.data.property_id,
        amount: Number(event.data.stealCost ?? event.data.steal_cost),
        slots: 1, // ✅ Always 1 slot per successful steal
        success: true,
        blockTime,
        metadata: {
          vrfResult: event.data.vrfResult?.toString()
        }
      };

    case 'StealFailedEvent':
    case 'stealFailedEvent':
      return {
        txSignature,
        actionType: 'steal_failed',
        playerAddress: event.data.attacker.toString(),
        targetAddress: event.data.target.toString(),
        propertyId: event.data.propertyId ?? event.data.property_id,
        amount: Number(event.data.stealCost ?? event.data.steal_cost),
        slots: 0, // ✅ No slots gained on failure
        success: false,
        blockTime,
        metadata: {
          vrfResult: event.data.vrfResult?.toString()
        }
      };

    case 'RewardsClaimedEvent':
    case 'rewardsClaimedEvent':
      return {
        txSignature,
        actionType: 'claim',
        playerAddress: event.data.player.toString(),
        amount: Number(event.data.amount),
        slots: 0, // ✅ Claims don't affect slots
        blockTime,
        metadata: {
          secondsElapsed: event.data.secondsElapsed ?? event.data.seconds_elapsed,
          hoursElapsed: event.data.hoursElapsed ?? event.data.hours_elapsed
        }
      };

    default:
      console.warn('Unknown event type:', eventName);
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