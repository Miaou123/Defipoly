// ============================================
// FILE: webhookController.js
// Transaction processor for both webhooks and WSS
// FIXED: Handles array of actions from parseTransaction
// ============================================

const { parseTransaction } = require('../services/transactionProcessor');
const { getDatabase } = require('../config/database');
const { updatePlayerStats, updateTargetOnSteal } = require('../services/gameService');
const { gameEvents } = require('../services/socketService');

async function processWebhook(payload) {
  const transactions = Array.isArray(payload) ? payload : [payload];
  
  for (const tx of transactions) {
    try {
      if (tx.meta?.err !== null) continue;
      
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
                price: action.amount,
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
                slots: action.slots,
                txSignature: action.txSignature,
                timestamp: action.blockTime
              });
              break;
              
            case 'shield':
              gameEvents.propertyShielded({
                propertyId: action.propertyId,
                owner: action.playerAddress,
                txSignature: action.txSignature,
                timestamp: action.blockTime
              });
              break;
              
            case 'claim':
              gameEvents.rewardClaimed({
                wallet: action.playerAddress,
                amount: action.amount,
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
              
            case 'steal_attempt':
              gameEvents.stealAttempted({
                propertyId: action.propertyId,
                attacker: action.playerAddress,
                victim: action.targetAddress,
                cost: action.amount,
                txSignature: action.txSignature,
                timestamp: action.blockTime
              });
              break;
          }

          // Emit enhanced stats update for the player
          gameEvents.playerStatsUpdated({
            wallet: action.playerAddress,
            actionType: action.actionType
          });

          // Emit detailed player stats change event
          await gameEvents.playerStatsChanged(action.playerAddress);

          // Emit ownership change for buy/sell/steal actions
          if (['buy', 'sell', 'steal_success'].includes(action.actionType)) {
            await gameEvents.ownershipChanged(action.playerAddress, action.propertyId);
            
            // Also emit rewards update since ownership affects rewards
            await gameEvents.rewardsUpdated(action.playerAddress);
          }

          // Emit rewards update for reward claims (to reset unclaimed rewards display)
          if (action.actionType === 'claim') {
            await gameEvents.rewardsUpdated(action.playerAddress);
          }

          // Emit stats update for target in steal
          if (action.actionType === 'steal_success' && action.targetAddress) {
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

module.exports = { processWebhook };