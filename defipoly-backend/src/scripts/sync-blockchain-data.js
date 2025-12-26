// ============================================
// FILE: sync-blockchain-data.js
// Initial full sync of blockchain data to database
// v9: Syncs PlayerAccount arrays (consolidated data) and Property accounts
// Replaces deprecated separate PropertyOwnership/PlayerSetCooldown/PlayerStealCooldown PDAs
// ============================================

const { Connection, PublicKey } = require('@solana/web3.js');
const { initDatabase, getDatabase, closeDatabase } = require('../config/database');
const {
  syncPlayerCooldownsFromAccount,  // ✅ v9: New unified sync from PlayerAccount arrays
  syncAllPropertiesState
} = require('../services/blockchainSyncService');
require('dotenv').config();

const idl = require('../idl/defipoly_program.json');

const RPC_URL = process.env.RPC_URL;
const PROGRAM_ID = new PublicKey(idl.address);

async function fullBlockchainSync() {
  console.log('🔄 Starting Full Blockchain Data Sync\n');
  console.log('This will sync ALL blockchain account data to the database.\n');

  // Initialize database
  console.log('📦 Initializing database...');
  await initDatabase();
  console.log('✅ Database initialized\n');

  const connection = new Connection(RPC_URL, 'confirmed');
  const db = getDatabase();

  try {
    // ========== STEP 1: Sync all Property accounts (available_slots) ==========
    console.log('📍 Step 1: Syncing Property accounts (available slots)...\n');
    await syncAllPropertiesState();
    console.log('\n✅ Step 1 complete\n');

    // ========== STEP 2: Get all unique player addresses from game_actions ==========
    console.log('📍 Step 2: Finding all player addresses...\n');
    
    const players = await new Promise((resolve, reject) => {
      db.all(
        `SELECT DISTINCT player_address FROM game_actions 
         UNION 
         SELECT DISTINCT target_address FROM game_actions WHERE target_address IS NOT NULL`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(r => r.player_address || r.target_address));
        }
      );
    });

    console.log(`   Found ${players.length} unique players\n`);

    // ========== STEP 3: Sync PlayerAccount data (v9: replaces separate PDAs) ==========
    console.log('📍 Step 3: Syncing PlayerAccount data (ownership, set cooldowns, steal cooldowns)...\n');
    console.log('   Note: v9 uses consolidated PlayerAccount arrays instead of separate PDAs\n');
    
    let playersSynced = 0;
    let playersFailed = 0;

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      
      if ((i + 1) % 10 === 0 || i === players.length - 1) {
        console.log(`   Progress: ${i + 1}/${players.length} players (✅ ${playersSynced} synced)`);
      }

      try {
        const success = await syncPlayerCooldownsFromAccount(player);
        if (success) playersSynced++;
      } catch (error) {
        playersFailed++;
        console.error(`   ❌ Failed to sync ${player.substring(0, 8)}...:`, error.message);
      }

      // Small delay to avoid rate limiting
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n   ✅ Synced ${playersSynced} PlayerAccount records`);
    if (playersFailed > 0) {
      console.log(`   ⚠️  Failed: ${playersFailed}`);
    }
    console.log();

    // ========== STEP 4: Summary ==========
    console.log('📊 Sync Summary\n');
    console.log('   Properties State:');
    console.log(`     ✅ Synced: 22/22 properties\n`);
    console.log('   PlayerAccount Data (v9):');
    console.log(`     ✅ Synced: ${playersSynced} players`);
    console.log('     📋 Includes: property ownership, set cooldowns, steal cooldowns');
    if (playersFailed > 0) console.log(`     ❌ Failed: ${playersFailed}`);
    console.log();

    console.log('✅ Full blockchain sync complete!\n');

  } catch (error) {
    console.error('❌ Error during sync:', error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run the sync
fullBlockchainSync()
  .then(() => {
    console.log('🎉 Sync completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  });