// ============================================
// FILE: src/controllers/leaderboardController.js (ENHANCED)
// Multiple Leaderboard Types
// Replace your existing leaderboardController.js
// ============================================

const { getDatabase } = require('../config/database');

/**
 * Get overall leaderboard
 */
const getLeaderboard = (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const offset = parseInt(req.query.offset) || 0;
  
  const db = getDatabase();

  // Query with rank calculation - simplified to only what we need
  const query = `
    SELECT 
      wallet_address,
      leaderboard_score,
      total_earned,
      properties_bought,
      successful_steals,
      complete_sets,
      shields_activated,
      ROW_NUMBER() OVER (ORDER BY leaderboard_score DESC) as rank
    FROM player_stats
    WHERE total_actions > 0
    ORDER BY leaderboard_score DESC
    LIMIT ? OFFSET ?
  `;

  db.all(query, [limit, offset], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const leaderboard = rows.map(row => ({
      rank: row.rank,
      walletAddress: row.wallet_address,
      displayName: `${row.wallet_address.slice(0, 4)}...${row.wallet_address.slice(-4)}`,
      leaderboardScore: Math.round(row.leaderboard_score),
      totalEarned: row.total_earned,
      propertiesBought: row.properties_bought,
      successfulSteals: row.successful_steals,
      completeSets: row.complete_sets,
      shieldsActivated: row.shields_activated
    }));

    res.json({
      leaderboard,
      pagination: {
        limit,
        offset,
        count: leaderboard.length
      }
    });
  });
};


/**
 * Get leaderboard stats (total players, total actions, etc.)
 */
const getLeaderboardStats = (req, res) => {
  const db = getDatabase();

  db.get(
    `SELECT 
      COUNT(*) as total_players,
      SUM(total_actions) as total_actions,
      SUM(total_earned) as total_earned,
      SUM(successful_steals) as total_steals,
      SUM(complete_sets) as total_complete_sets,
      AVG(leaderboard_score) as avg_score,
      MAX(leaderboard_score) as max_score
    FROM player_stats
    WHERE total_actions > 0`,
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        totalPlayers: stats.total_players || 0,
        totalActions: stats.total_actions || 0,
        totalEarned: stats.total_earned || 0,
        totalSteals: stats.total_steals || 0,
        totalCompleteSets: stats.total_complete_sets || 0,
        averageScore: Math.round(stats.avg_score || 0),
        topScore: Math.round(stats.max_score || 0)
      });
    }
  );
};

/**
 * Get recent movers (players with biggest score changes)
 * This requires a history table - optional advanced feature
 */
const getRecentMovers = (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  
  // For now, return top recent active players
  // To implement properly, you'd need a player_stats_history table
  const db = getDatabase();

  db.all(
    `SELECT 
      wallet_address,
      leaderboard_score,
      last_action_time
    FROM player_stats
    WHERE total_actions > 0 AND last_action_time IS NOT NULL
    ORDER BY last_action_time DESC
    LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        movers: rows.map(row => ({
          walletAddress: row.wallet_address,
          displayName: `${row.wallet_address.slice(0, 4)}...${row.wallet_address.slice(-4)}`,
          score: Math.round(row.leaderboard_score),
          lastActive: row.last_action_time
        }))
      });
    }
  );
};

module.exports = {
  getLeaderboard,
  getLeaderboardStats,
  getRecentMovers
};