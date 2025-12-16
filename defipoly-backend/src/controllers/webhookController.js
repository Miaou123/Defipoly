// ============================================
// FILE: webhookController.js
// Transaction processor for both webhooks and WSS
// UPDATED: Added blockchain sync calls for all events
// ============================================

const { parseTransaction } = require('../services/transactionProcessor');
const { getDatabase } = require('../config/database');
const { updatePlayerStats, updateTargetOnSteal } = require('../services/gameService');
const { gameEvents } = require('../services/socketService');
const { 
  syncPropertyOwnership, 
  syncPlayerSetCooldown, 
  syncPlayerStealCooldown, 
  syncPropertyState,
  syncPlayerCooldownsFromAccount  // ✅ [v9] NEW - unified sync from PlayerAccount arrays
} = require('../services/blockchainSyncService');
const { PROPERTIES } = require('../config/constants');

/**
 * Store processed transaction record for gap detection
 */
async function storeProcessedTransaction(tx) {
  const db = getDatabase();
  
  const signature = tx.transaction?.signatures?.[0];
  if (!signature) return;
  
  const blockTime = tx.blockTime;
  const eventCount = tx.meta?.logMessages?.length || 0;
  
  // Determine transaction type (admin or game action)
  const logs = tx.meta?.logMessages || [];
  const isAdminTx = logs.some(log => 
    log.includes('AdminGrant') || 
    log.includes('AdminRevoke') || 
    log.includes('AdminShield') || 
    log.includes('AdminPlayer') ||
    log.includes('AdminUpdate') ||
    log.includes('AdminWithdraw') ||
    log.includes('AdminAuthority')
  );
  
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO processed_transactions 
       (tx_signature, block_time, event_count, transaction_type)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(tx_signature) DO NOTHING`,
      [signature, blockTime, eventCount, isAdminTx ? 'admin' : 'game'],
      function(err) {
        if (err) {
          console.error('      ❌ [PROCESSED_TX] Database error:', err);
          reject(err);
        } else {
          if (this.changes > 0) {
            console.log(`      ✅ [PROCESSED_TX] Stored: ${signature.substring(0, 20)}... (${isAdminTx ? 'admin' : 'game'})`);
          }
          resolve(this.changes);
        }
      }
    );
  });
}

async function processWebhook(payload) {
  const transactions = Array.isArray(payload) ? payload : [payload];
  
  for (const tx of transactions) {
    try {
      if (tx.meta?.err !== null) continue;
      
      // Always store processed transaction first (for gap detection)
      await storeProcessedTransaction(tx);
      
      // ✅ FIXED: parseTransaction returns an ARRAY of actions
      const actions = await parseTransaction(tx);
      if (!actions || actions.length === 0) continue;
      
      // ✅ FIXED: Process each action in the array
      for (const action of actions) {
        await storeTransactionData(action);
        
        // Update player stats using gameService
        await updatePlayerStats(
          action.playerAddress,
          action.actionType,
          action.amount,
          action.slots,
          action.propertyId
        );

        // If steal success, update target player too
        if (action.actionType === 'steal_success' && action.targetAddress) {
          await updateTargetOnSteal(
            action.targetAddress,
            action.propertyId,
            action.slots
          );
        }

        // ========== NEW: BLOCKCHAIN SYNC CALLS ==========
        // Sync blockchain data to database based on action type
        try {
          switch (action.actionType) {
            case 'buy':
              console.log('   🔄 [SYNC] Syncing buy action data...');
              
              // ✅ [v9] Use unified PlayerAccount sync instead of separate PDAs
              await syncPlayerCooldownsFromAccount(action.playerAddress);
              
              // Sync property available slots
              await syncPropertyState(action.propertyId);
              
              console.log('   ✅ [SYNC] Buy data synced');
              break;

            case 'sell':
              console.log('   🔄 [SYNC] Syncing sell action data...');
              
              // ✅ [v9] Use unified PlayerAccount sync instead of separate PDAs
              await syncPlayerCooldownsFromAccount(action.playerAddress);
              
              // Sync property available slots
              await syncPropertyState(action.propertyId);
              
              console.log('   ✅ [SYNC] Sell data synced');
              break;

            case 'shield':
              console.log('   🔄 [SYNC] Syncing shield action data...');
              
              // ✅ [v9] Use unified PlayerAccount sync instead of separate PDAs
              await syncPlayerCooldownsFromAccount(action.playerAddress);
              
              console.log('   ✅ [SYNC] Shield data synced');
              break;

            case 'steal_success':
              console.log('   🔄 [SYNC] Syncing steal success data...');
              
              // ✅ [v9] Use unified PlayerAccount sync instead of separate PDAs
              await syncPlayerCooldownsFromAccount(action.playerAddress);
              
              // Sync target player too (steal_protection_expiry set)
              if (action.targetAddress) {
                await syncPlayerCooldownsFromAccount(action.targetAddress);
              }
              
              console.log('   ✅ [SYNC] Steal success data synced');
              break;

            case 'steal_failed':
              console.log('   🔄 [SYNC] Syncing steal failed data...');
              
              // ✅ [v9] Use unified PlayerAccount sync instead of separate PDAs
              await syncPlayerCooldownsFromAccount(action.playerAddress);
              
              // Sync target player too (steal_protection_expiry set even on failed attempt)
              if (action.targetAddress) {
                await syncPlayerCooldownsFromAccount(action.targetAddress);
              }
              
              console.log('   ✅ [SYNC] Steal failed data synced');
              break;

            default:
              // For other action types (claim, etc.), no blockchain sync needed
              break;
          }
        } catch (syncError) {
          console.error('   ❌ [SYNC] Error syncing blockchain data:', syncError.message);
          // Don't fail the whole transaction if sync fails - continue processing
        }
        // ========== END BLOCKCHAIN SYNC CALLS ==========

        // Emit Socket.IO events based on action type
        try {
          switch (action.actionType) {
            case 'buy':
              gameEvents.propertyBought({
                propertyId: action.propertyId,
                buyer: action.playerAddress,
                price: action.amount,
                slots: action.slots,
                txSignature: action.txSignature,
                timestamp: action.blockTime
              });
              break;
              
            case 'sell':
              gameEvents.propertySold({
                propertyId: action.propertyId,
                seller: action.playerAddress,
                received: action.amount,
                slots: action.slots,
                txSignature: action.txSignature,
                timestamp: action.blockTime
              });
              break;
              
            case 'shield':
              gameEvents.propertyShielded({
                propertyId: action.propertyId,
                player: action.playerAddress,
                cost: action.amount,
                slots: action.slots,
                txSignature: action.txSignature,
                timestamp: action.blockTime
              });
              break;
              
            case 'steal_success':
              gameEvents.propertyStolen({
                propertyId: action.propertyId,
                attacker: action.playerAddress,
                victim: action.targetAddress,
                cost: action.amount,
                txSignature: action.txSignature,
                timestamp: action.blockTime
              });
              break;
              
            case 'steal_failed':
              gameEvents.stealFailed({
                propertyId: action.propertyId,
                attacker: action.playerAddress,
                victim: action.targetAddress,
                cost: action.amount,
                txSignature: action.txSignature,
                timestamp: action.blockTime
              });
              break;
              
            case 'claim':
              gameEvents.rewardsClaimed({
                wallet: action.playerAddress,
                amount: action.amount,
                txSignature: action.txSignature,
                timestamp: action.blockTime
              });
              break;
          }

          // Emit recent action to live feed
          gameEvents.recentAction({
            actionType: action.actionType,
            playerAddress: action.playerAddress,
            targetAddress: action.targetAddress,
            propertyId: action.propertyId,
            amount: action.amount,
            slots: action.slots,
            success: action.success,
            txSignature: action.txSignature,
            timestamp: action.blockTime
          });

          // Update player stats for Socket.IO clients
          gameEvents.playerStatsUpdated({
            wallet: action.playerAddress,
            actionType: action.actionType
          });

          // Emit ownership change
          if (action.propertyId !== undefined) {
            await gameEvents.ownershipChanged(action.playerAddress, action.propertyId);
          }

          // Update player's stats and rewards
          await gameEvents.playerStatsChanged(action.playerAddress);
          await gameEvents.rewardsUpdated(action.playerAddress);

          // If steal (success OR failed), update target player too
          // Both success and failed set steal_protection_expiry on target
          if ((action.actionType === 'steal_success' || action.actionType === 'steal_failed') && action.targetAddress) {
            gameEvents.playerStatsUpdated({
              wallet: action.targetAddress,
              actionType: 'stolen_from'
            });
            
            // Update target's stats and rewards too
            await gameEvents.playerStatsChanged(action.targetAddress);
            await gameEvents.ownershipChanged(action.targetAddress, action.propertyId);
            await gameEvents.rewardsUpdated(action.targetAddress);
          }

          // Update leaderboard for significant actions (but not too frequently)
          if (['buy', 'steal_success', 'steal_failed', 'claim'].includes(action.actionType)) {
            // Use a simple debouncing mechanism to avoid spam
            clearTimeout(global.leaderboardUpdateTimeout);
            global.leaderboardUpdateTimeout = setTimeout(async () => {
              await gameEvents.leaderboardChanged();
            }, 2000); // Wait 2 seconds after last action before updating leaderboard
          }
        } catch (error) {
          console.error('❌ [SOCKET] Error emitting event:', error);
        }
      }
    } catch (error) {
      console.error('❌ [WEBHOOK] Error:', error);
    }
  }
}

async function storeTransactionData(data) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO game_actions 
       (tx_signature, action_type, player_address, property_id, 
        target_address, amount, slots, success, metadata, block_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(tx_signature) DO NOTHING`,
      [
        data.txSignature,  // ✅ Correct field name
        data.actionType,
        data.playerAddress,
        data.propertyId !== undefined ? data.propertyId : null,
        data.targetAddress || null,
        data.amount || null,
        data.slots || null,
        data.success !== undefined ? data.success : null,
        JSON.stringify(data.metadata || {}),
        data.blockTime
      ],
      function(err) {
        if (err) {
          console.error('      ❌ [WEBHOOK] Database error:', err);
          reject(err);
        } else {
          if (this.changes > 0) {
            console.log(`      ✅ [ACTION] Stored successfully (ID: ${this.lastID})`);
          } else {
            console.log(`      ℹ️  [ACTION] Already in database (duplicate)`);
          }
          resolve(this.changes);
        }
      }
    );
  });
}

module.exports = { processWebhook, storeProcessedTransaction };