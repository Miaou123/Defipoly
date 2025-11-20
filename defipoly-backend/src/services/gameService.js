// ============================================
// FILE: src/services/gameService.js
// Enhanced Game Service with FIXED total_actions counting
// ✅ FIXED: total_actions is now calculated from game_actions table, not incremented
// ============================================

const { getDatabase } = require('../config/database');
const { updatePlayerCalculatedStats } = require('./playerStatsCalculator');

/**
 * Calculate composite leaderboard score
 * Activity-focused scoring system
 */
function calculateLeaderboardScore(stats) {
  // ========== 1. ACTIVITY POINTS (50% weight) ==========
  const activityPoints = 
    (stats.total_slots_purchased * 10) +
    (stats.successful_steals * 25) +
    (stats.complete_sets * 100) +
    (stats.shields_activated * 15) +
    (stats.rewards_claimed * 5) +
    (stats.properties_sold * 5);

  // ========== 2. EFFICIENCY SCORE (30% weight) ==========
  const roi = stats.total_earned / Math.max(stats.total_spent, 1);
  const totalSteals = stats.successful_steals + stats.failed_steals;
  const stealWinRate = totalSteals > 0 ? stats.successful_steals / totalSteals : 0;
  const defenseRating = stats.total_slots_owned > 0 
    ? 1 - (stats.times_stolen / stats.total_slots_owned)
    : 0;
  
  const efficiencyScore = 
    (roi * 500) +
    (stealWinRate * 1000) +
    (Math.max(defenseRating, 0) * 500);

  // ========== 3. WEALTH SCORE (20% weight) ==========
  const wealthScore = 
    (stats.daily_income / 1e9 * 100) +
    (stats.total_slots_owned * 50) +
    (stats.complete_sets * 200);

  const totalScore = 
    (activityPoints * 0.5) +
    (efficiencyScore * 0.3) +
    (wealthScore * 0.2);

  // Multiply by 10 for more appealing score display
  return Math.round(totalScore * 10);
}

/**
 * Update property ownership
 */
async function updatePropertyOwnership(walletAddress, propertyId, slotsDelta) {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO property_ownership (wallet_address, property_id, slots_owned, last_updated)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(wallet_address, property_id) 
       DO UPDATE SET 
         slots_owned = MAX(0, slots_owned + ?),
         last_updated = ?`,
      [walletAddress, propertyId, slotsDelta, Math.floor(Date.now() / 1000), slotsDelta, Math.floor(Date.now() / 1000)],
      (err) => {
        if (err) {
          console.error('Error updating property ownership:', err);
          reject(err);
        } else {
          updatePlayerCalculatedStats(walletAddress, () => {
            resolve();
          });
        }
      }
    );
  });
}

/**
 * Update player stats when an action occurs
 * ✅ FIXED: No longer increments total_actions - it's calculated from game_actions table
 */
async function updatePlayerStats(walletAddress, actionType, amount = 0, slots = 0, propertyId = null) {
  const db = getDatabase();

  return new Promise(async (resolve, reject) => {
    try {
      // First, update property ownership if relevant
      if (actionType === 'buy' && slots > 0 && propertyId !== null) {
        await updatePropertyOwnership(walletAddress, propertyId, slots);
      } else if (actionType === 'sell' && slots > 0 && propertyId !== null) {
        await updatePropertyOwnership(walletAddress, propertyId, -slots);
      } else if (actionType === 'steal_success' && slots > 0 && propertyId !== null) {
        await updatePropertyOwnership(walletAddress, propertyId, slots);
      }

      // Ensure the player exists in stats
      db.run(
        `INSERT OR IGNORE INTO player_stats 
         (wallet_address, total_actions, properties_bought, properties_sold, 
          successful_steals, failed_steals, shields_activated, rewards_claimed,
          total_spent, total_earned, total_slots_owned, daily_income, complete_sets,
          times_stolen, leaderboard_score, roi_ratio, steal_win_rate, defense_rating)
         VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
        [walletAddress],
        (err) => {
          if (err) {
            console.error('Error initializing player stats:', err);
            return reject(err);
          }

          // Update stats based on action type
          // ✅ REMOVED: total_actions = total_actions + 1 from ALL cases
          let updateQuery = '';
          let params = [];

          switch (actionType) {
            case 'buy':
              updateQuery = `UPDATE player_stats 
                             SET total_slots_owned = total_slots_owned + ?,
                                 last_action_time = ?
                             WHERE wallet_address = ?`;
              params = [slots || 0, Math.floor(Date.now() / 1000), walletAddress];
              break;

            case 'sell':
              updateQuery = `UPDATE player_stats 
                             SET total_slots_owned = total_slots_owned - ?,
                                 last_action_time = ?
                             WHERE wallet_address = ?`;
              params = [slots || 0, Math.floor(Date.now() / 1000), walletAddress];
              break;

            case 'steal_success':
              updateQuery = `UPDATE player_stats 
                             SET total_slots_owned = total_slots_owned + ?,
                                 last_action_time = ?
                             WHERE wallet_address = ?`;
              params = [slots || 0, Math.floor(Date.now() / 1000), walletAddress];
              break;

            case 'steal_failed':
            case 'shield':
            case 'claim':
              updateQuery = `UPDATE player_stats 
                              SET last_action_time = ?,
                                  last_claim_timestamp = ?
                              WHERE wallet_address = ?`;
              params = [Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000), walletAddress];
              break;

            default:
              // Generic action - only update timestamp
              updateQuery = `UPDATE player_stats 
                             SET last_action_time = ?
                             WHERE wallet_address = ?`;
              params = [Math.floor(Date.now() / 1000), walletAddress];
          }

          if (updateQuery) {
            db.run(updateQuery, params, (err) => {
              if (err) {
                console.error(`Error updating player stats for ${actionType}:`, err);
                return reject(err);
              }

              // ✅ NEW: Recalculate ALL counters from game_actions table to prevent duplicates
              db.run(
                `UPDATE player_stats 
                 SET 
                   -- Total actions based on slot volume
                   total_actions = (
                     SELECT COALESCE(SUM(
                       CASE 
                         WHEN action_type IN ('buy', 'sell') THEN COALESCE(slots, 1)
                         ELSE 1
                       END
                     ), 0)
                     FROM game_actions 
                     WHERE player_address = ?
                   ),
                   -- Properties owned (current ownership from property_ownership table)
                   properties_bought = (
                     SELECT COUNT(DISTINCT property_id)
                     FROM property_ownership
                     WHERE wallet_address = ? AND slots_owned > 0
                   ),
                   -- Properties sold
                   properties_sold = (
                     SELECT COUNT(*)
                     FROM game_actions 
                     WHERE player_address = ? AND action_type = 'sell'
                   ),
                   -- Total slots purchased (sum of slots in buy actions)
                   total_slots_purchased = (
                     SELECT COALESCE(SUM(COALESCE(slots, 1)), 0)
                     FROM game_actions 
                     WHERE player_address = ? AND action_type = 'buy'
                   ),
                   -- Successful steals
                   successful_steals = (
                     SELECT COUNT(*)
                     FROM game_actions 
                     WHERE player_address = ? AND action_type = 'steal_success'
                   ),
                   -- Failed steals
                   failed_steals = (
                     SELECT COUNT(*)
                     FROM game_actions 
                     WHERE player_address = ? AND action_type = 'steal_failed'
                   ),
                   -- Shields activated
                   shields_activated = (
                     SELECT COUNT(*)
                     FROM game_actions 
                     WHERE player_address = ? AND action_type = 'shield'
                   ),
                   -- Rewards claimed
                   rewards_claimed = (
                     SELECT COUNT(*)
                     FROM game_actions 
                     WHERE player_address = ? AND action_type = 'claim'
                   ),
                   -- Total spent (buy + steal_failed + shield)
                   total_spent = (
                     SELECT COALESCE(SUM(amount), 0)
                     FROM game_actions 
                     WHERE player_address = ? AND action_type IN ('buy', 'steal_failed', 'shield')
                   ),
                   -- Total earned (sell + claim)
                   total_earned = (
                     SELECT COALESCE(SUM(amount), 0)
                     FROM game_actions 
                     WHERE player_address = ? AND action_type IN ('sell', 'claim')
                   )
                 WHERE wallet_address = ?`,
                [walletAddress, walletAddress, walletAddress, walletAddress, walletAddress, walletAddress, walletAddress, walletAddress, walletAddress, walletAddress, walletAddress],
                (err) => {
                  if (err) {
                    console.error('Error updating total_actions:', err);
                    return reject(err);
                  }

                  // Recalculate composite scores after updating stats
                  recalculatePlayerScore(walletAddress)
                    .then(() => {
                      console.log(`✅ Updated stats and score for ${walletAddress}`);
                      resolve();
                    })
                    .catch(reject);
                }
              );
            });
          } else {
            resolve();
          }
        }
      );
    } catch (error) {
      console.error('Error in updatePlayerStats:', error);
      reject(error);
    }
  });
}

/**
 * Update target player when they get stolen from
 */
async function updateTargetOnSteal(targetAddress, propertyId, slotsStolen = 1) {
  const db = getDatabase();

  return new Promise(async (resolve, reject) => {
    try {
      if (propertyId !== null && slotsStolen > 0) {
        await updatePropertyOwnership(targetAddress, propertyId, -slotsStolen);
      }

      db.run(
        `UPDATE player_stats 
         SET times_stolen = times_stolen + 1,
             total_slots_owned = total_slots_owned - ?
         WHERE wallet_address = ?`,
        [slotsStolen, targetAddress],
        (err) => {
          if (err) {
            console.error('Error updating target stats:', err);
            return reject(err);
          }

          recalculatePlayerScore(targetAddress)
            .then(() => {
              console.log(`✅ Updated victim stats for ${targetAddress}`);
              resolve();
            })
            .catch(reject);
        }
      );
    } catch (error) {
      console.error('Error in updateTargetOnSteal:', error);
      reject(error);
    }
  });
}

/**
 * Recalculate player's composite scores
 */
async function recalculatePlayerScore(walletAddress) {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM player_stats WHERE wallet_address = ?`,
      [walletAddress],
      (err, stats) => {
        if (err) return reject(err);
        if (!stats) return resolve();

        const leaderboardScore = calculateLeaderboardScore(stats);
        
        // Calculate ROI ratio
        const roiRatio = stats.total_spent > 0 
          ? stats.total_earned / stats.total_spent 
          : 0;
        
        // Calculate steal win rate
        const totalSteals = stats.successful_steals + stats.failed_steals;
        const stealWinRate = totalSteals > 0 
          ? stats.successful_steals / totalSteals 
          : 0;

        db.run(
          `UPDATE player_stats 
           SET leaderboard_score = ?,
               roi_ratio = ?,
               steal_win_rate = ?
           WHERE wallet_address = ?`,
          [leaderboardScore, roiRatio, stealWinRate, walletAddress],
          (err) => {
            if (err) return reject(err);
            resolve();
          }
        );
      }
    );
  });
}

/**
 * Get player stats from database
 */
function getPlayerStats(walletAddress, callback) {
  const db = getDatabase();

  db.get(
    `SELECT * FROM player_stats WHERE wallet_address = ?`,
    [walletAddress],
    (err, row) => {
      if (err) {
        return callback(err, null);
      }

      if (!row) {
        // Return default stats if player not found
        return callback(null, {
          walletAddress,
          totalActions: 0,
          propertiesBought: 0,
          propertiesSold: 0,
          successfulSteals: 0,
          failedSteals: 0,
          shieldsActivated: 0,
          rewardsClaimed: 0,
          totalSpent: 0,
          totalEarned: 0,
          totalSlotsOwned: 0,
          dailyIncome: 0,
          completeSets: 0,
          timesStolen: 0,
          leaderboardScore: 0,
          roiRatio: 0,
          stealWinRate: 0,
          defenseRating: 0
        });
      }

      callback(null, {
        walletAddress: row.wallet_address,
        totalActions: row.total_actions,
        propertiesBought: row.properties_bought,
        propertiesSold: row.properties_sold,
        successfulSteals: row.successful_steals,
        failedSteals: row.failed_steals,
        shieldsActivated: row.shields_activated,
        rewardsClaimed: row.rewards_claimed,
        totalSpent: row.total_spent,
        totalEarned: row.total_earned,
        totalSlotsOwned: row.total_slots_owned,
        dailyIncome: row.daily_income,
        completeSets: row.complete_sets,
        timesStolen: row.times_stolen,
        leaderboardScore: row.leaderboard_score,
        roiRatio: row.roi_ratio,
        stealWinRate: row.steal_win_rate,
        defenseRating: row.defense_rating,
        lastActionTime: row.last_action_time,
        updatedAt: row.updated_at
      });
    }
  );
}

/**
 * Batch recalculate scores for all players
 * Run this periodically or after major updates
 */
async function batchRecalculateScores() {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.all(`SELECT wallet_address FROM player_stats`, async (err, rows) => {
      if (err) return reject(err);

      console.log(`🔄 Recalculating scores for ${rows.length} players...`);

      for (const row of rows) {
        try {
          await recalculatePlayerScore(row.wallet_address);
        } catch (error) {
          console.error(`Error recalculating score for ${row.wallet_address}:`, error);
        }
      }

      console.log(`✅ Batch recalculation complete!`);
      resolve();
    });
  });
}

module.exports = {
  updatePlayerStats,
  updateTargetOnSteal,
  updatePropertyOwnership,
  getPlayerStats,
  recalculatePlayerScore,
  batchRecalculateScores,
  calculateLeaderboardScore
};