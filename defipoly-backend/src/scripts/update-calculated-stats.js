#!/usr/bin/env node

// Script to update all calculated stats for existing players
const { initDatabase } = require('../config/database');
const { updateAllPlayersCalculatedStats } = require('../services/playerStatsCalculator');

console.log('🔄 Starting calculated stats update for all players...\n');

// Initialize database first
initDatabase().then(() => {
  updateAllPlayersCalculatedStats((err) => {
    if (err) {
      console.error('❌ Error updating calculated stats:', err);
      process.exit(1);
    } else {
      console.log('\n✅ All player calculated stats updated successfully!');
      process.exit(0);
    }
  });
}).catch(err => {
  console.error('❌ Error initializing database:', err);
  process.exit(1);
});