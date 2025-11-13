const { getDatabase } = require('../config/database');
const { updatePlayerCalculatedStats } = require('../services/playerStatsCalculator');

const getPlayerStats = (req, res) => {
  const { wallet } = req.params;
  const db = getDatabase();

  // Get stats from database (with pre-calculated values)
  db.get(
    'SELECT * FROM player_stats WHERE wallet_address = ?',
    [wallet],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!row) {
        return res.json({
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
          completedSets: 0
        });
      }
      
      // Return pre-calculated stats directly
      res.json({
        walletAddress: row.wallet_address,
        totalActions: row.total_actions,
        propertiesBought: row.properties_bought,
        propertiesSold: row.properties_sold,
        successfulSteals: row.successful_steals,
        failedSteals: row.failed_steals,
        rewardsClaimed: row.rewards_claimed,
        shieldsUsed: row.shields_activated,
        totalSpent: row.total_spent,
        totalEarned: row.total_earned,
        totalSlotsOwned: row.total_slots_owned,
        dailyIncome: row.daily_income || 0,
        completedSets: row.complete_sets || 0,
        lastActionTime: row.last_action_time,
        updatedAt: row.updated_at
      });
    }
  );
};

const getPlayerOwnership = (req, res) => {
  const { wallet } = req.params;
  const db = getDatabase();

  db.all(
    `SELECT property_id, slots_owned FROM property_ownership 
     WHERE wallet_address = ? AND slots_owned > 0`,
    [wallet],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ ownerships: rows });
    }
  );
};

module.exports = {
  getPlayerStats,
  getPlayerOwnership
};