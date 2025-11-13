// src/services/playerStatsCalculator.js
// Unified service for calculating and updating all player stats

const { getDatabase } = require('../config/database');
const { calculateDailyIncome } = require('./incomeCalculator');

/**
 * Calculates completed sets for a player
 */
function calculateCompletedSets(walletAddress, callback) {
  const db = getDatabase();
  
  db.all(
    `SELECT property_id, slots_owned FROM property_ownership 
     WHERE wallet_address = ? AND slots_owned > 0`,
    [walletAddress],
    (err, ownerships) => {
      if (err || !ownerships) {
        return callback(0);
      }

      // Property sets (matches constants.ts)
      const setRequirements = {
        0: [0, 1], // Brown set
        1: [2, 3, 4], // Light Blue set  
        2: [5, 6, 7], // Purple set
        3: [8, 9, 10], // Orange set
        4: [11, 12, 13], // Red set
        5: [14, 15, 16], // Yellow set
        6: [17, 18, 19], // Green set
        7: [20, 21] // Dark Blue set
      };

      // Group properties by setId
      const ownedPropertyIds = ownerships.map(o => o.property_id);
      
      // Count completed sets
      let completedSets = 0;
      Object.entries(setRequirements).forEach(([setId, requiredProperties]) => {
        const hasAllProperties = requiredProperties.every(propId => 
          ownedPropertyIds.includes(propId)
        );
        
        if (hasAllProperties) {
          completedSets++;
        }
      });

      callback(completedSets);
    }
  );
}

/**
 * Updates all calculated fields for a player
 */
function updatePlayerCalculatedStats(walletAddress, callback = () => {}) {
  const db = getDatabase();

  // Calculate daily income
  calculateDailyIncome(walletAddress, (dailyIncome) => {
    
    // Calculate completed sets
    calculateCompletedSets(walletAddress, (completedSets) => {
      
      // Update total_slots_owned from property_ownership
      db.get(
        `SELECT COALESCE(SUM(slots_owned), 0) as totalSlots 
         FROM property_ownership 
         WHERE wallet_address = ?`,
        [walletAddress],
        (err, result) => {
          const totalSlotsOwned = result ? result.totalSlots : 0;
          
          // Update all calculated fields in player_stats
          db.run(
            `UPDATE player_stats 
             SET daily_income = ?, 
                 complete_sets = ?, 
                 total_slots_owned = ?,
                 updated_at = strftime('%s', 'now')
             WHERE wallet_address = ?`,
            [dailyIncome, completedSets, totalSlotsOwned, walletAddress],
            (err) => {
              if (err) {
                console.error('Error updating calculated stats for', walletAddress, ':', err);
              } else {
                console.log(`✅ Updated calculated stats for ${walletAddress}: daily_income=${dailyIncome}, complete_sets=${completedSets}, total_slots=${totalSlotsOwned}`);
              }
              callback(err);
            }
          );
        }
      );
    });
  });
}

/**
 * Updates calculated stats for all players (batch operation)
 */
function updateAllPlayersCalculatedStats(callback = () => {}) {
  const db = getDatabase();
  
  db.all(
    `SELECT DISTINCT wallet_address FROM property_ownership WHERE slots_owned > 0`,
    [],
    (err, rows) => {
      if (err || !rows) {
        console.log('No players with ownership found');
        return callback();
      }
      
      console.log(`🔄 Updating calculated stats for ${rows.length} players...`);
      
      let completed = 0;
      const total = rows.length;
      
      rows.forEach(row => {
        updatePlayerCalculatedStats(row.wallet_address, () => {
          completed++;
          if (completed === total) {
            console.log('✅ Finished updating all player calculated stats');
            callback();
          }
        });
      });
    }
  );
}

module.exports = {
  calculateCompletedSets,
  updatePlayerCalculatedStats,
  updateAllPlayersCalculatedStats
};