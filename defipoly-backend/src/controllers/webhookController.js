// ============================================
// FILE: webhookController.js
// Transaction processor for both webhooks and WSS
// FIXED: Handles array of actions from parseTransaction
// ============================================

const { parseTransaction } = require('../services/transactionProcessor');
const { getDatabase } = require('../config/database');
const { updatePlayerStats, updateTargetOnSteal } = require('../services/gameService');

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
        data.propertyId || null,
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