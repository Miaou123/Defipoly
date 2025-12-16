// ============================================
// FILE: periodic-sync.js
// Periodic blockchain data sync (safety net)
// Runs every 5-10 minutes to catch any missed WebSocket events
// ============================================

const { Connection, PublicKey } = require('@solana/web3.js');
const { initDatabase, getDatabase } = require('../config/database');
const {
  syncPlayerCooldownsFromAccount,  // ✅ [v9] NEW - unified sync from PlayerAccount arrays
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
      playerAccounts: 0,
      properties: 0
    };

    // Sync properties state first (quick)
    console.log('   📍 Syncing property states...');
    await syncAllPropertiesState();
    syncStats.properties = 22;

    // Sync active players only
    console.log(`   📍 Syncing ${activePlayers.length} active players...`);
    
    for (const player of activePlayers) {
      try {
        // ✅ [v9] Use unified PlayerAccount sync instead of separate PDAs
        const success = await syncPlayerCooldownsFromAccount(player);
        if (success) syncStats.playerAccounts++;
      } catch (error) {
        // Silently continue
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n   ✅ Periodic sync complete in ${duration}s`);
    console.log(`   📊 Stats:`);
    console.log(`      - Properties: ${syncStats.properties}`);
    console.log(`      - PlayerAccounts: ${syncStats.playerAccounts}`);
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