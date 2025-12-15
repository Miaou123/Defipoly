// ============================================
// FILE: sync-blockchain-data.js
// Initial full sync of blockchain data to database
// Syncs PropertyOwnership, PlayerSetCooldown, PlayerStealCooldown, and Property accounts
// ============================================

const { Connection, PublicKey } = require('@solana/web3.js');
const { initDatabase, getDatabase, closeDatabase } = require('../config/database');
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

    // ========== STEP 3: Sync PropertyOwnership for all players ==========
    console.log('📍 Step 3: Syncing PropertyOwnership accounts...\n');
    
    let ownershipSynced = 0;
    let ownershipFailed = 0;

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      
      if ((i + 1) % 10 === 0 || i === players.length - 1) {
        console.log(`   Progress: ${i + 1}/${players.length} players (✅ ${ownershipSynced} ownerships synced)`);
      }

      // Check all 22 properties for this player
      for (let propertyId = 0; propertyId < 22; propertyId++) {
        try {
          const success = await syncPropertyOwnership(player, propertyId);
          if (success) ownershipSynced++;
        } catch (error) {
          ownershipFailed++;
        }

        // Small delay to avoid rate limiting
        if (propertyId % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }

    console.log(`\n   ✅ Synced ${ownershipSynced} PropertyOwnership accounts`);
    if (ownershipFailed > 0) {
      console.log(`   ⚠️  Failed: ${ownershipFailed}`);
    }
    console.log();

    // ========== STEP 4: Sync PlayerSetCooldown for all players ==========
    console.log('📍 Step 4: Syncing PlayerSetCooldown accounts...\n');
    
    let setCooldownSynced = 0;
    let setCooldownFailed = 0;

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      
      if ((i + 1) % 10 === 0 || i === players.length - 1) {
        console.log(`   Progress: ${i + 1}/${players.length} players (✅ ${setCooldownSynced} cooldowns synced)`);
      }

      // Check all 8 sets for this player
      for (let setId = 0; setId < 8; setId++) {
        try {
          const success = await syncPlayerSetCooldown(player, setId);
          if (success) setCooldownSynced++;
        } catch (error) {
          setCooldownFailed++;
        }

        // Small delay to avoid rate limiting
        if (setId % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }

    console.log(`\n   ✅ Synced ${setCooldownSynced} PlayerSetCooldown accounts`);
    if (setCooldownFailed > 0) {
      console.log(`   ⚠️  Failed: ${setCooldownFailed}`);
    }
    console.log();

    // ========== STEP 5: Sync PlayerStealCooldown for all players ==========
    console.log('📍 Step 5: Syncing PlayerStealCooldown accounts...\n');
    console.log('   Note: Only syncing for players who have attempted steals\n');
    
    // Get players who have made steal attempts
    const stealPlayers = await new Promise((resolve, reject) => {
      db.all(
        `SELECT DISTINCT player_address, property_id 
         FROM game_actions 
         WHERE action_type IN ('steal_success', 'steal_failed')`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log(`   Found ${stealPlayers.length} steal attempts to sync\n`);

    let stealCooldownSynced = 0;
    let stealCooldownFailed = 0;

    for (let i = 0; i < stealPlayers.length; i++) {
      const { player_address, property_id } = stealPlayers[i];
      
      if ((i + 1) % 20 === 0 || i === stealPlayers.length - 1) {
        console.log(`   Progress: ${i + 1}/${stealPlayers.length} (✅ ${stealCooldownSynced} cooldowns synced)`);
      }

      try {
        const success = await syncPlayerStealCooldown(player_address, property_id);
        if (success) stealCooldownSynced++;
      } catch (error) {
        stealCooldownFailed++;
      }

      // Small delay to avoid rate limiting
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log(`\n   ✅ Synced ${stealCooldownSynced} PlayerStealCooldown accounts`);
    if (stealCooldownFailed > 0) {
      console.log(`   ⚠️  Failed: ${stealCooldownFailed}`);
    }
    console.log();

    // ========== STEP 6: Summary ==========
    console.log('📊 Sync Summary\n');
    console.log('   Properties State:');
    console.log(`     ✅ Synced: 22/22 properties\n`);
    console.log('   PropertyOwnership:');
    console.log(`     ✅ Synced: ${ownershipSynced}`);
    if (ownershipFailed > 0) console.log(`     ❌ Failed: ${ownershipFailed}`);
    console.log();
    console.log('   PlayerSetCooldown:');
    console.log(`     ✅ Synced: ${setCooldownSynced}`);
    if (setCooldownFailed > 0) console.log(`     ❌ Failed: ${setCooldownFailed}`);
    console.log();
    console.log('   PlayerStealCooldown:');
    console.log(`     ✅ Synced: ${stealCooldownSynced}`);
    if (stealCooldownFailed > 0) console.log(`     ❌ Failed: ${stealCooldownFailed}`);
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