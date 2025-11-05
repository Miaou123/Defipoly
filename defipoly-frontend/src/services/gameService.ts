/**
 * Game Service
 * Handles game state, actions, and cooldowns
 */

import { gameApi, APIError } from '@/lib/api';
import type { 
  GameState, 
  RecentAction, 
  Cooldown, 
  StealCooldown,
  PlayerStats,
  LeaderboardEntry 
} from '@defipoly/shared-types';

export class GameService {
  /**
   * Get current game state
   */
  async getGameState(): Promise<GameState | null> {
    try {
      const response = await gameApi.getGameState();
      return response;
    } catch (error) {
      console.error('Failed to fetch game state:', error);
      return null;
    }
  }

  /**
   * Get recent game actions
   */
  async getRecentActions(limit: number = 10): Promise<RecentAction[]> {
    try {
      const response = await gameApi.getRecentActions(limit);
      return response.actions || [];
    } catch (error) {
      console.error('Failed to fetch recent actions:', error);
      return [];
    }
  }

  /**
   * Get player cooldowns
   */
  async getPlayerCooldowns(playerAddress: string): Promise<{
    propertyCooldowns: Cooldown[];
    stealCooldowns: StealCooldown[];
  }> {
    try {
      const [cooldowns, stealCooldowns] = await Promise.all([
        gameApi.getCooldowns(playerAddress),
        gameApi.getStealCooldowns(playerAddress),
      ]);

      return {
        propertyCooldowns: cooldowns.cooldowns || [],
        stealCooldowns: stealCooldowns.cooldowns || [],
      };
    } catch (error) {
      console.error('Failed to fetch cooldowns:', error);
      return {
        propertyCooldowns: [],
        stealCooldowns: [],
      };
    }
  }

  /**
   * Check if a property set is on cooldown
   */
  isSetOnCooldown(cooldowns: Cooldown[], setId: number): boolean {
    const cooldown = cooldowns.find(c => c.setId === setId);
    return cooldown?.isActive || false;
  }

  /**
   * Get remaining cooldown time in seconds
   */
  getRemainingCooldown(cooldownEnd: number): number {
    const now = Date.now() / 1000;
    const remaining = cooldownEnd - now;
    return remaining > 0 ? Math.floor(remaining) : 0;
  }

  /**
   * Format cooldown time for display
   */
  formatCooldownTime(seconds: number): string {
    if (seconds <= 0) return 'Ready';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(params?: { 
    limit?: number; 
    offset?: number 
  }): Promise<LeaderboardEntry[]> {
    try {
      const response = await gameApi.getLeaderboard(params);
      return response.leaderboard || [];
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  }

  /**
   * Get player stats and rank
   */
  async getPlayerStats(playerAddress: string): Promise<PlayerStats | null> {
    try {
      const response = await gameApi.getPlayerStats(playerAddress);
      return response;
    } catch (error) {
      console.error('Failed to fetch player stats:', error);
      return null;
    }
  }

  /**
   * Format action for display
   */
  formatAction(action: RecentAction): string {
    const playerName = action.username || this.shortAddress(action.playerAddress);
    const targetName = action.targetUsername || (action.targetAddress ? this.shortAddress(action.targetAddress) : '');

    switch (action.actionType) {
      case 'buy':
        return `${playerName} bought ${action.slots || 1} slot${(action.slots || 1) > 1 ? 's' : ''} of ${action.propertyName}`;
      
      case 'steal_success':
        return `${playerName} successfully stole ${action.propertyName} from ${targetName}`;
      
      case 'steal_failed':
        return `${playerName} failed to steal ${action.propertyName} from ${targetName}`;
      
      case 'shield':
        return `${playerName} activated shield on ${action.propertyName}`;
      
      case 'claim':
        return `${playerName} claimed ${this.formatTokenAmount(action.amount || 0)} tokens`;
      
      default:
        return `${playerName} performed ${action.actionType}`;
    }
  }

  /**
   * Get action icon
   */
  getActionIcon(actionType: string): string {
    const icons: Record<string, string> = {
      'buy': '🏠',
      'steal_success': '🎯',
      'steal_failed': '❌',
      'shield': '🛡️',
      'claim': '💰',
    };
    return icons[actionType] || '📝';
  }

  /**
   * Utility: Shorten wallet address
   */
  private shortAddress(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  /**
   * Utility: Format token amount
   */
  private formatTokenAmount(amount: number): string {
    const tokens = amount / 1_000_000_000;
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(2)}M`;
    } else if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(2)}K`;
    } else {
      return tokens.toFixed(2);
    }
  }

  /**
   * Subscribe to game updates (WebSocket)
   */
  subscribeToUpdates(callbacks: {
    onAction?: (action: RecentAction) => void;
    onStatsUpdate?: (stats: any) => void;
    onLeaderboardUpdate?: (leaderboard: LeaderboardEntry[]) => void;
  }): () => void {
    // This would connect to WebSocket
    // For now, return a no-op unsubscribe function
    console.log('WebSocket subscription not implemented yet');
    return () => {};
  }
}

// Export singleton instance
export const gameService = new GameService();