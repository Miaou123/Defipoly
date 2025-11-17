#!/usr/bin/env node
// ============================================
// SCHEMA COMPARISON TOOL
// Compare current DB with expected schema from database.js
// ============================================

const sqlite3 = require('sqlite3').verbose();

const DB_PATH = './defipoly.db';

// Expected schema from database.js
const EXPECTED_TABLES = {
  profiles: [
    'wallet_address',
    'username',
    'profile_picture',
    'board_theme',
    'property_card_theme',
    'custom_board_background',
    'custom_property_card_background',
    'corner_square_style',
    'updated_at'
  ],
  property_ownership: [
    'id',
    'wallet_address',
    'property_id',
    'slots_owned',
    'slots_shielded',
    'shield_expiry',
    'purchase_timestamp',
    'shield_cooldown_duration',
    'steal_protection_expiry',
    'bump',
    'last_updated'
  ],
  game_actions: [
    'id',
    'tx_signature',
    'action_type',
    'player_address',
    'property_id',
    'target_address',
    'amount',
    'slots',
    'success',
    'metadata',
    'block_time',
    'created_at'
  ],
  player_stats: [
    'wallet_address',
    'total_actions',
    'properties_bought',
    'properties_sold',
    'total_slots_purchased',  // ✅ NEW FIELD
    'successful_steals',
    'failed_steals',
    'rewards_claimed',
    'shields_activated',
    'total_spent',
    'total_earned',
    'total_slots_owned',
    'daily_income',
    'leaderboard_score',
    'roi_ratio',
    'steal_win_rate',
    'defense_rating',
    'complete_sets',
    'times_stolen',
    'last_action_time',
    'last_claim_timestamp',
    'updated_at'
  ],
  player_set_cooldowns: [
    'id',
    'wallet_address',
    'set_id',
    'last_purchase_timestamp',
    'cooldown_duration',
    'last_purchased_property_id',
    'properties_owned_in_set',
    'properties_count',
    'last_synced'
  ],
  player_steal_cooldowns: [
    'id',
    'wallet_address',
    'property_id',
    'last_steal_attempt_timestamp',
    'cooldown_duration',
    'last_synced'
  ],
  properties_state: [
    'property_id',
    'available_slots',
    'max_slots_per_property',
    'last_synced'
  ]
};

function compareSchema() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SCHEMA COMPARISON');
  console.log('='.repeat(80) + '\n');

  const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err);
      console.log('\nMake sure defipoly.db exists and you\'re in the backend directory.');
      process.exit(1);
    }
  });

  // Get all actual tables
  db.all(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`, (err, tables) => {
    if (err) {
      console.error('Error fetching tables:', err);
      db.close();
      return;
    }

    const actualTables = tables.map(t => t.name);
    const expectedTables = Object.keys(EXPECTED_TABLES);

    // Check for missing tables
    const missingTables = expectedTables.filter(t => !actualTables.includes(t));
    const extraTables = actualTables.filter(t => !expectedTables.includes(t));

    console.log('📋 TABLE COMPARISON:\n');

    if (missingTables.length === 0 && extraTables.length === 0) {
      console.log('✅ All expected tables present\n');
    } else {
      if (missingTables.length > 0) {
        console.log('❌ MISSING TABLES:');
        missingTables.forEach(t => console.log(`   • ${t}`));
        console.log('');
      }
      if (extraTables.length > 0) {
        console.log('⚠️  EXTRA TABLES (not in schema):');
        extraTables.forEach(t => console.log(`   • ${t}`));
        console.log('');
      }
    }

    // Check columns for each table
    let allGood = true;
    let processedCount = 0;

    expectedTables.forEach(tableName => {
      if (!actualTables.includes(tableName)) {
        processedCount++;
        return;
      }

      db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
        if (err) {
          console.error(`Error checking ${tableName}:`, err);
          processedCount++;
          return;
        }

        const actualColumns = columns.map(c => c.name);
        const expectedColumns = EXPECTED_TABLES[tableName];

        const missingColumns = expectedColumns.filter(c => !actualColumns.includes(c));
        const extraColumns = actualColumns.filter(c => !expectedColumns.includes(c));

        console.log(`\n▼ ${tableName}`);
        console.log('─'.repeat(80));

        if (missingColumns.length === 0 && extraColumns.length === 0) {
          console.log('✅ All columns present and correct');
        } else {
          allGood = false;
          
          if (missingColumns.length > 0) {
            console.log('❌ MISSING COLUMNS:');
            missingColumns.forEach(c => console.log(`   • ${c}`));
          }
          
          if (extraColumns.length > 0) {
            console.log('⚠️  EXTRA COLUMNS:');
            extraColumns.forEach(c => console.log(`   • ${c}`));
          }
        }

        // Show column count
        console.log(`\n   Expected: ${expectedColumns.length} columns`);
        console.log(`   Actual:   ${actualColumns.length} columns`);

        processedCount++;

        // Final summary
        if (processedCount === expectedTables.length) {
          console.log('\n' + '='.repeat(80));
          console.log('📊 SUMMARY');
          console.log('='.repeat(80) + '\n');

          if (allGood && missingTables.length === 0) {
            console.log('🎉 ✅ SCHEMA IS CORRECT!');
            console.log('\nYour database matches the expected schema perfectly.');
            console.log('Safe to use database.js for production reset.\n');
          } else {
            console.log('⚠️  SCHEMA MISMATCH DETECTED!');
            console.log('\nYour current database differs from the expected schema.');
            console.log('\nRecommendations:');
            
            if (missingTables.length > 0 || missingColumns.length > 0) {
              console.log('  1. Run database migrations to add missing tables/columns');
              console.log('  2. Or export data and recreate with new schema');
            }
            
            if (extraTables.length > 0 || extraColumns.length > 0) {
              console.log('  3. Extra tables/columns won\'t cause issues (can be ignored)');
            }
            
            console.log('\n');
          }

          db.close();
        }
      });
    });
  });
}

// Run comparison
compareSchema();