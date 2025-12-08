// ============================================
// Game State Controller
// Consolidated endpoint for all player game data
// ============================================

const { getDatabase } = require('../config/database');

/**
 * Get complete game state for a wallet
 * Returns: ownerships, cooldowns, stats, profile in one response
 * GET /api/game-state/:wallet
 */
const getGameState = async (req, res) => {
  const { wallet } = req.params;
  const db = getDatabase();

  try {
    // ========== 1. OWNERSHIP DATA ==========
    const ownerships = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          property_id as propertyId,
          slots_owned as slotsOwned,
          slots_shielded as slotsShielded,
          shield_expiry as shieldExpiry,
          purchase_timestamp as purchaseTimestamp,
          shield_cooldown_duration as shieldCooldownDuration,
          steal_protection_expiry as stealProtectionExpiry,
          bump,
          last_updated as lastUpdated
        FROM property_ownership
        WHERE wallet_address = ?
        ORDER BY property_id ASC`,
        [wallet],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // ========== 2. SET COOLDOWNS ==========
    const setCooldowns = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          set_id as setId,
          last_purchase_timestamp as lastPurchaseTimestamp,
          cooldown_duration as cooldownDuration,
          last_purchased_property_id as lastPurchasedPropertyId,
          properties_owned_in_set as propertiesOwnedInSet,
          properties_count as propertiesCount,
          last_synced as lastSynced
        FROM player_set_cooldowns
        WHERE wallet_address = ?
        ORDER BY set_id ASC`,
        [wallet],
        (err, rows) => {
          if (err) reject(err);
          else {
            const now = Math.floor(Date.now() / 1000);
            const parsed = (rows || []).map(row => {
              const cooldownEnd = row.lastPurchaseTimestamp + row.cooldownDuration;
              const isOnCooldown = now < cooldownEnd;
              const cooldownRemaining = Math.max(0, cooldownEnd - now);
              
              return {
                ...row,
                isOnCooldown,
                cooldownRemaining,
                propertiesOwnedInSet: row.propertiesOwnedInSet 
                  ? JSON.parse(row.propertiesOwnedInSet) 
                  : []
              };
            });
            resolve(parsed);
          }
        }
      );
    });

    // ========== 3. STEAL COOLDOWNS ==========
    const stealCooldowns = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          property_id as propertyId,
          last_steal_attempt_timestamp as lastStealAttemptTimestamp,
          cooldown_duration as cooldownDuration,
          last_synced as lastSynced
        FROM player_steal_cooldowns
        WHERE wallet_address = ?
        ORDER BY property_id ASC`,
        [wallet],
        (err, rows) => {
          if (err) reject(err);
          else {
            const now = Math.floor(Date.now() / 1000);
            const parsed = (rows || []).map(row => {
              const cooldownEnd = row.lastStealAttemptTimestamp + row.cooldownDuration;
              const isOnCooldown = now < cooldownEnd;
              const cooldownRemaining = Math.max(0, cooldownEnd - now);
              
              return {
                ...row,
                isOnCooldown,
                cooldownRemaining
              };
            });
            resolve(parsed);
          }
        }
      );
    });

    // ========== 4. PLAYER STATS ==========
    const stats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          wallet_address as walletAddress,
          total_actions as totalActions,
          properties_bought as propertiesBought,
          properties_sold as propertiesSold,
          successful_steals as successfulSteals,
          failed_steals as failedSteals,
          rewards_claimed as rewardsClaimed,
          shields_activated as shieldsUsed,
          total_spent as totalSpent,
          total_earned as totalEarned,
          total_slots_owned as totalSlotsOwned,
          daily_income as dailyIncome,
          complete_sets as completeSets,
          leaderboard_score as leaderboardScore,
          last_action_time as lastActionTime
        FROM player_stats
        WHERE wallet_address = ?`,
        [wallet],
        (err, row) => {
          if (err) reject(err);
          else resolve(row || {
            walletAddress: wallet,
            totalActions: 0,
            propertiesBought: 0,
            propertiesSold: 0,
            successfulSteals: 0,
            failedSteals: 0,
            rewardsClaimed: 0,
            shieldsUsed: 0,
            totalSpent: 0,
            totalEarned: 0,
            totalSlotsOwned: 0,
            dailyIncome: 0,
            completeSets: 0,
            leaderboardScore: 0,
            lastActionTime: null
          });
        }
      );
    });

    // ========== 5. PROFILE DATA (INCLUDES CUSTOMIZATION) ==========
    const profile = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          wallet_address as walletAddress,
          username,
          profile_picture as profilePicture,
          corner_square_style as cornerSquareStyle,
          board_theme as boardTheme,
          property_card_theme as propertyCardTheme,
          custom_board_background as customBoardBackground,
          custom_property_card_background as customPropertyCardBackground,
          custom_scene_background as customSceneBackground,
          updated_at as updatedAt
        FROM profiles
        WHERE wallet_address = ?`,
        [wallet],
        (err, row) => {
          if (err) reject(err);
          else resolve(row || {
            walletAddress: wallet,
            username: null,
            profilePicture: null,
            cornerSquareStyle: 'property',
            boardTheme: 'dark',
            propertyCardTheme: 'dark',
            customBoardBackground: null,
            customPropertyCardBackground: null,
            updatedAt: null
          });
        }
      );
    });

    // ========== RETURN CONSOLIDATED DATA ==========
    res.json({
      success: true,
      wallet,
      timestamp: Date.now(),
      data: {
        ownerships,
        cooldowns: {
          sets: setCooldowns,
          steals: stealCooldowns
        },
        stats,
        profile
      }
    });

  } catch (error) {
    console.error('Error fetching game state:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch game state',
      message: error.message 
    });
  }
};

module.exports = {
  getGameState
};