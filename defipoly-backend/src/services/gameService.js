// ============================================
// FILE: src/services/gameService.js
// Enhanced Game Service with FIXED Leaderboard Scoring
// ✅ FIXED: Scores now scale properly (top score < 1M)
// ============================================

const { getDatabase } = require('../config/database');
const { updatePlayerCalculatedStats } = require('./playerStatsCalculator');

/**
 * Calculate composite leaderboard score
 * ✅ FIXED: Properly scaled to keep top scores under 1 million
 * 
 * Scoring breakdown for a top player (~400K SOL earned, 60 properties, 10 steals):
 * - Wealth: ~120K points (30%)
 * - Activity: ~30K points (25%)  
 * - Combat: ~15K points (20%)
 * - Efficiency: ~50K points (15%)
 * - Defense: ~10K points (10%)
 * Total: ~225K points (well under 1M target)
 */
function calculateLeaderboardScore(stats) {
  const earnedSOL = stats.total_earned / 1e9;
  
  // Weighted activity score (prevents spam exploitation)
  const activityScore = 
    (stats.properties_bought * 1) +      // Basic action
    (stats.successful_steals * 3) +      // Harder action  
    (stats.complete_sets * 10) +         // Major achievement
    (stats.shields_activated * 2);       // Defensive play
  
  const activityMultiplier = 1 + (activityScore / 50);
  
  return Math.floor(earnedSOL * activityMultiplier);
}


/**
 * Helper function to update property ownership
 */
async function updatePropertyOwnership(walletAddress, propertyId, slotsDelta) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    if (!propertyId || propertyId === null || slotsDelta === 0) {
      return resolve(); // Skip if no property or no slot change
    }
    
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
          // Update calculated stats (daily income, completed sets, total slots)
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
 * ENHANCED VERSION with full leaderboard tracking and property ownership
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

      // Then, ensure the player exists in stats
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
          let updateQuery = '';
          let params = [];

        switch (actionType) {
          case 'buy':
            updateQuery = `UPDATE player_stats 
                           SET total_actions = total_actions + 1,
                               properties_bought = properties_bought + 1,
                               total_spent = total_spent + ?,
                               total_slots_owned = total_slots_owned + ?,
                               last_action_time = ?
                           WHERE wallet_address = ?`;
            params = [amount || 0, slots || 0, Math.floor(Date.now() / 1000), walletAddress];
            break;

          case 'sell':
            updateQuery = `UPDATE player_stats 
                           SET total_actions = total_actions + 1,
                               properties_sold = properties_sold + 1,
                               total_earned = total_earned + ?,
                               total_slots_owned = total_slots_owned - ?,
                               last_action_time = ?
                           WHERE wallet_address = ?`;
            params = [amount || 0, slots || 0, Math.floor(Date.now() / 1000), walletAddress];
            break;

          case 'steal_success':
            updateQuery = `UPDATE player_stats 
                           SET total_actions = total_actions + 1,
                               successful_steals = successful_steals + 1,
                               total_slots_owned = total_slots_owned + ?,
                               last_action_time = ?
                           WHERE wallet_address = ?`;
            params = [slots || 1, Math.floor(Date.now() / 1000), walletAddress];
            break;

          case 'steal_failed':
            updateQuery = `UPDATE player_stats 
                           SET total_actions = total_actions + 1,
                               failed_steals = failed_steals + 1,
                               total_spent = total_spent + ?,
                               last_action_time = ?
                           WHERE wallet_address = ?`;
            params = [amount || 0, Math.floor(Date.now() / 1000), walletAddress];
            break;

          case 'claim':
            updateQuery = `UPDATE player_stats 
                           SET total_actions = total_actions + 1,
                               rewards_claimed = rewards_claimed + 1,
                               total_earned = total_earned + ?,
                               last_action_time = ?
                           WHERE wallet_address = ?`;
            params = [amount || 0, Math.floor(Date.now() / 1000), walletAddress];
            break;

          case 'shield':
            updateQuery = `UPDATE player_stats 
                           SET total_actions = total_actions + 1,
                               shields_activated = shields_activated + 1,
                               total_spent = total_spent + ?,
                               last_action_time = ?
                           WHERE wallet_address = ?`;
            params = [amount || 0, Math.floor(Date.now() / 1000), walletAddress];
            break;

          case 'claim':
            updates.last_claim_timestamp = Math.floor(Date.now() / 1000);
            break;

          default:
            // Generic action counter
            updateQuery = `UPDATE player_stats 
                           SET total_actions = total_actions + 1,
                               last_action_time = ?
                           WHERE wallet_address = ?`;
            params = [Math.floor(Date.now() / 1000), walletAddress];
        }

        if (updateQuery) {
          db.run(updateQuery, params, (err) => {
            if (err) {
              console.error(`Error updating player stats for ${actionType}:`, err);
              return reject(err);
            }

            // ✅ Recalculate composite scores after updating stats
            recalculatePlayerScore(walletAddress)
              .then(() => {
                console.log(`✅ Updated stats and score for ${walletAddress}`);
                resolve();
              })
              .catch(reject);
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
      // First, update property ownership (victim loses slots)
      if (propertyId !== null && slotsStolen > 0) {
        await updatePropertyOwnership(targetAddress, propertyId, -slotsStolen);
      }

      // Then update player stats
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

          // Recalculate score for victim too
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
    // Fetch current stats
    db.get(
      `SELECT * FROM player_stats WHERE wallet_address = ?`,
      [walletAddress],
      (err, stats) => {
        if (err) return reject(err);
        if (!stats) return resolve(); // Player doesn't exist yet

        // Calculate leaderboard score
        const leaderboardScore = calculateLeaderboardScore(stats);

        // Update only leaderboard score
        db.run(
          `UPDATE player_stats 
           SET leaderboard_score = ?
           WHERE wallet_address = ?`,
          [leaderboardScore, walletAddress],
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