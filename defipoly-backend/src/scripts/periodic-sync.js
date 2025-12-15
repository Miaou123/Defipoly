// ============================================
// FILE: periodic-sync.js
// Periodic blockchain data sync (safety net)
// Runs every 5-10 minutes to catch any missed WebSocket events
// ============================================

const { Connection, PublicKey } = require('@solana/web3.js');
const { initDatabase, getDatabase } = require('../config/database');
const {
  syncPropertyOwnership,
  syncPlayerSetCooldown,
  syncPlayerStealCooldown,
  syncAllPropertiesState
} = require('../services/blockchainSyncService');
require('dotenv').config();

const idl = require('../idl/defipoly_program.json');

const RPC_URL = process.env.RPC_URL;
const PROGRAM_ID = new PublicKey(idl.address);
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

let connection;
let db;
let syncRunning = false;

async function initialize() {
  console.log('🔧 Initializing periodic sync service...\n');
  
  await initDatabase();
  db = getDatabase();
  connection = new Connection(RPC_URL, 'confirmed');
  
  console.log('✅ Periodic sync service initialized');
  console.log(`   Sync interval: ${SYNC_INTERVAL / 1000} seconds\n`);
}

/**
 * Perform incremental sync - only sync active players
 */
async function performIncrementalSync() {
  if (syncRunning) {
    console.log('⏭️  Skipping sync - previous sync still running');
    return;
  }

  syncRunning = true;
  const startTime = Date.now();
  
  console.log(`\n🔄 [${new Date().toISOString()}] Starting periodic sync...\n`);

  try {
    // Get recently active players (last 24 hours)
    const cutoffTime = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
    
    const activePlayers = await new Promise((resolve, reject) => {
      db.all(
        `SELECT DISTINCT player_address 
         FROM game_actions 
         WHERE block_time > ?
         UNION
         SELECT DISTINCT target_address 
         FROM game_actions 
         WHERE target_address IS NOT NULL AND block_time > ?`,
        [cutoffTime, cutoffTime],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(r => r.player_address));
        }
      );
    });

    console.log(`   Found ${activePlayers.length} active players in last 24h\n`);

    if (activePlayers.length === 0) {
      console.log('   No active players to sync');
      return;
    }

    let syncStats = {
      ownership: 0,
      setCooldown: 0,
      stealCooldown: 0,
      properties: 0
    };

    // Sync properties state first (quick)
    console.log('   📍 Syncing property states...');
    await syncAllPropertiesState();
    syncStats.properties = 22;

    // Sync active players only
    console.log(`   📍 Syncing ${activePlayers.length} active players...`);
    
    for (const player of activePlayers) {
      // Sync owned properties only
      const ownedProperties = await new Promise((resolve, reject) => {
        db.all(
          `SELECT DISTINCT property_id 
           FROM property_ownership 
           WHERE wallet_address = ? AND slots_owned > 0`,
          [player],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(r => r.property_id));
          }
        );
      });

      // Sync PropertyOwnership for owned properties
      for (const propertyId of ownedProperties) {
        try {
          const success = await syncPropertyOwnership(player, propertyId);
          if (success) syncStats.ownership++;
        } catch (error) {
          // Silently continue
        }
      }

      // Sync active buy cooldowns (check recent purchases)
      const recentBuys = await new Promise((resolve, reject) => {
        db.all(
          `SELECT DISTINCT property_id 
           FROM game_actions 
           WHERE player_address = ? 
             AND action_type = 'buy' 
             AND block_time > ?
           LIMIT 3`,
          [player, cutoffTime],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(r => r.property_id));
          }
        );
      });

      // Sync set cooldowns for recent purchases
      const { PROPERTIES } = require('../config/constants');
      const recentSets = [...new Set(
        recentBuys.map(propId => PROPERTIES.find(p => p.id === propId)?.setId).filter(Boolean)
      )];

      for (const setId of recentSets) {
        try {
          const success = await syncPlayerSetCooldown(player, setId);
          if (success) syncStats.setCooldown++;
        } catch (error) {
          // Silently continue
        }
      }

      // Sync active steal cooldowns (check recent steals)
      const recentSteals = await new Promise((resolve, reject) => {
        db.all(
          `SELECT DISTINCT property_id 
           FROM game_actions 
           WHERE player_address = ? 
             AND action_type IN ('steal_success', 'steal_failed')
             AND block_time > ?
           LIMIT 5`,
          [player, cutoffTime],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(r => r.property_id));
          }
        );
      });

      for (const propertyId of recentSteals) {
        try {
          const success = await syncPlayerStealCooldown(player, propertyId);
          if (success) syncStats.stealCooldown++;
        } catch (error) {
          // Silently continue
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n   ✅ Periodic sync complete in ${duration}s`);
    console.log(`   📊 Stats:`);
    console.log(`      - Properties: ${syncStats.properties}`);
    console.log(`      - Ownerships: ${syncStats.ownership}`);
    console.log(`      - Buy Cooldowns: ${syncStats.setCooldown}`);
    console.log(`      - Steal Cooldowns: ${syncStats.stealCooldown}`);
    console.log();

  } catch (error) {
    console.error('❌ Error during periodic sync:', error);
  } finally {
    syncRunning = false;
  }
}

/**
 * Start the periodic sync service
 */
async function start() {
  await initialize();

  // Run first sync after 10 seconds
  console.log('⏰ First sync will run in 10 seconds...\n');
  setTimeout(() => performIncrementalSync(), 10000);

  // Then run periodically
  setInterval(() => performIncrementalSync(), SYNC_INTERVAL);

  console.log('✅ Periodic sync service started');
  console.log('   Press Ctrl+C to stop\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down periodic sync service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down periodic sync service...');
  process.exit(0);
});

// Start the service
start().catch(error => {
  console.error('❌ Failed to start periodic sync service:', error);
  process.exit(1);
});