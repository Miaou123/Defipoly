#!/usr/bin/env node
// ============================================
// COMPREHENSIVE LEADERBOARD RECALCULATION
// Recalculates ALL stats and scores from game_actions
// ============================================

const { initDatabase, getDatabase, closeDatabase } = require('../config/database');

async function recalculateEverything() {
  console.log('🚀 Starting comprehensive recalculation...\n');

  // Initialize database
  await initDatabase();
  const db = getDatabase();

  // Get all players
  const players = await new Promise((resolve, reject) => {
    db.all('SELECT wallet_address FROM player_stats', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  console.log(`📊 Found ${players.length} players to recalculate\n`);

  let processed = 0;
  let errors = 0;

  for (const player of players) {
    try {
      await recalculatePlayerStats(db, player.wallet_address);
      processed++;
      
      if (processed % 10 === 0) {
        console.log(`   Progress: ${processed}/${players.length} players...`);
      }
    } catch (error) {
      errors++;
      console.error(`   ❌ Error for ${player.wallet_address}:`, error.message);
    }
  }

  console.log('\n✅ Recalculation complete!');
  console.log(`   Processed: ${processed}`);
  console.log(`   Errors: ${errors}\n`);

  // Show top 10
  const top10 = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        wallet_address,
        leaderboard_score,
        total_actions,
        properties_bought,
        total_earned,
        roi_ratio,
        steal_win_rate
      FROM player_stats
      WHERE total_actions > 0
      ORDER BY leaderboard_score DESC
      LIMIT 10
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  console.log('🏆 Top 10 Leaderboard:\n');
  top10.forEach((player, i) => {
    const addr = `${player.wallet_address.slice(0, 4)}...${player.wallet_address.slice(-4)}`;
    const score = player.leaderboard_score.toLocaleString();
    const roi = (player.roi_ratio * 100).toFixed(1);
    const winRate = (player.steal_win_rate * 100).toFixed(0);
    console.log(`   ${i + 1}. ${addr} - Score: ${score} | Props: ${player.properties_bought} | ROI: ${roi}% | Win Rate: ${winRate}%`);
  });

  await closeDatabase();
  process.exit(0);
}

/**
 * Recalculate all stats for a single player
 */
async function recalculatePlayerStats(db, walletAddress) {
  return new Promise((resolve, reject) => {
    // Step 1: Recalculate all counters from game_actions
    db.run(
      `UPDATE player_stats 
       SET 
         -- Total actions (slot-volume based)
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
         -- Properties owned (current ownership)
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
         -- Total slots purchased
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
         -- Total spent
         total_spent = (
           SELECT COALESCE(SUM(amount), 0)
           FROM game_actions 
           WHERE player_address = ? AND action_type IN ('buy', 'steal_failed', 'shield')
         ),
         -- Total earned
         total_earned = (
           SELECT COALESCE(SUM(amount), 0)
           FROM game_actions 
           WHERE player_address = ? AND action_type IN ('sell', 'claim')
         )
       WHERE wallet_address = ?`,
      [walletAddress, walletAddress, walletAddress, walletAddress, walletAddress, walletAddress, walletAddress, walletAddress, walletAddress, walletAddress, walletAddress],
      (err) => {
        if (err) return reject(err);

        // Step 2: Get updated stats to calculate ratios
        db.get(
          'SELECT * FROM player_stats WHERE wallet_address = ?',
          [walletAddress],
          (err, stats) => {
            if (err) return reject(err);
            if (!stats) return resolve();

            // Calculate leaderboard score
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

            // Step 3: Update scores and ratios
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
      }
    );
  });
}

/**
 * Calculate composite leaderboard score
 */
function calculateLeaderboardScore(stats) {
  // Activity points (50%)
  const activityPoints = 
    (stats.total_slots_purchased * 10) +
    (stats.successful_steals * 25) +
    (stats.complete_sets * 100) +
    (stats.shields_activated * 15) +
    (stats.rewards_claimed * 5) +
    (stats.properties_sold * 5);

  // Efficiency score (30%)
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

  // Wealth score (20%)
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

// Run if called directly
if (require.main === module) {
  recalculateEverything().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { recalculateEverything };