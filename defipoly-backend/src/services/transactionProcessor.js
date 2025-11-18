// ============================================
// UPDATED transactionProcessor.js
// Now handles admin events and triggers blockchain sync
// ============================================

const { BorshCoder, EventParser } = require('@coral-xyz/anchor');
const { PublicKey } = require('@solana/web3.js');
// Note: blockchainSyncService imported inside eventToAction to avoid circular dependency

// Load IDL - this is the source of truth for PROGRAM_ID
const idl = require('../idl/defipoly_program.json');

// Log IDL loading
console.log('📚 [TRANSACTION PROCESSOR] IDL loaded successfully');
console.log(`   - Program ID: ${idl.address}`);

// PROGRAM_ID comes from IDL file only
const PROGRAM_ID = new PublicKey(idl.address);
const coder = new BorshCoder(idl);
const eventParser = new EventParser(PROGRAM_ID, coder);

console.log('✅ [TRANSACTION PROCESSOR] EventParser initialized');

/**
 * Parse transaction from Helius webhook payload or WebSocket
 * Returns action data if successful, null otherwise
 */
async function parseTransaction(tx) {
  try {
    console.log('\n🔍 [PARSE TX] Starting transaction parse...');
    
    // Extract signature
    const signature = tx.transaction?.signatures?.[0];
    if (!signature) {
      console.error('❌ [PARSE TX] No signature found in transaction');
      return null;
    }
    console.log(`📝 [PARSE TX] Signature: ${signature.substring(0, 20)}...`);
    
    // Extract block time
    const blockTime = tx.blockTime;
    console.log(`⏰ [PARSE TX] Block time: ${blockTime}`);
    
    // Extract logs
    const logs = tx.meta?.logMessages || [];
    console.log(`📋 [PARSE TX] Found ${logs.length} log messages`);
    
    if (logs.length === 0) {
      console.error('❌ [PARSE TX] No logs found in transaction');
      return null;
    }

    // Log first few logs for debugging
    console.log('📄 [PARSE TX] First 5 logs:');
    logs.slice(0, 5).forEach((log, i) => {
      console.log(`   ${i + 1}. ${log}`);
    });
    
    // Parse events from logs
    console.log('🔄 [PARSE TX] Parsing events...');
    const eventsGenerator = eventParser.parseLogs(logs);
    const eventsArray = Array.from(eventsGenerator);
    console.log(`🎯 [PARSE TX] Found ${eventsArray.length} events`);
    
    if (eventsArray.length === 0) {
      console.warn('⚠️  [PARSE TX] No events parsed from logs');
      return null;
    }

    // Process each event
    const actions = [];
    for (const event of eventsArray) {
      console.log(`\n🎯 [PARSE TX] Processing event: ${event.name}`);
      console.log(`   📦 Event data:`, JSON.stringify(event.data, null, 2));
      
      const action = await eventToAction(event, signature, blockTime);
      if (action) {
        actions.push(action);
        console.log(`   ✅ Converted to action: ${action.actionType}`);
      } else {
        console.warn(`   ⚠️  Could not convert event ${event.name} to action`);
      }
    }

    console.log(`\n✅ [PARSE TX] Successfully parsed ${actions.length} action(s)`);
    return actions;

  } catch (error) {
    console.error('❌ [PARSE TX] Error parsing transaction:', error);
    return null;
  }
}

/**
 * Convert event to action data and trigger blockchain sync for admin events
 * Handles both snake_case and camelCase field names
 */
async function eventToAction(event, signature, blockTime) {
  try {
    const eventName = event.name;
    const eventData = event.data;

    // Base action structure
    const action = {
      txSignature: signature,
      blockTime: blockTime,
      timestamp: new Date(blockTime * 1000).toISOString(),
    };

    // Helper to convert value to string safely
    const toString = (value) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && value.toString) return value.toString();
      return String(value);
    };

    // Map event types to action types
    switch (eventName) {
      case 'PropertyBoughtEvent': {
        return {
          ...action,
          actionType: 'buy',
          playerAddress: toString(eventData.player),
          propertyId: eventData.property_id ?? eventData.propertyId,
          amount: Number(eventData.total_cost ?? eventData.totalCost ?? eventData.price),
          slots: eventData.slots ?? eventData.slotsOwned ?? eventData.slots_owned ?? 1,
        };
      }

      case 'PropertySoldEvent': {
        return {
          ...action,
          actionType: 'sell',
          playerAddress: toString(eventData.player),
          propertyId: eventData.property_id ?? eventData.propertyId,
          slots: eventData.slots,
          amount: Number(eventData.received),
        };
      }

      case 'RewardsClaimedEvent': {
        return {
          ...action,
          actionType: 'claim',
          playerAddress: toString(eventData.player),
          amount: Number(eventData.amount),
        };
      }

      case 'ShieldActivatedEvent': {
        return {
          ...action,
          actionType: 'shield',
          playerAddress: toString(eventData.player),
          propertyId: eventData.property_id ?? eventData.propertyId,
          amount: Number(eventData.cost),
          slots: eventData.slots_shielded ?? eventData.slotsShielded,
        };
      }

      case 'StealSuccessEvent': {
        return {
          ...action,
          actionType: 'steal_success',
          playerAddress: toString(eventData.attacker),
          targetAddress: toString(eventData.target ?? eventData.victim),
          propertyId: eventData.property_id ?? eventData.propertyId,
          amount: Number(eventData.steal_cost ?? eventData.stealCost),
          slots: 1,
          success: true,
        };
      }

      case 'StealFailedEvent': {
        return {
          ...action,
          actionType: 'steal_failed',
          playerAddress: toString(eventData.attacker),
          targetAddress: toString(eventData.target ?? eventData.victim),
          propertyId: eventData.property_id ?? eventData.propertyId,
          amount: Number(eventData.steal_cost ?? eventData.stealCost),
          slots: 0,
          success: false,
        };
      }

      case 'StealAttemptEvent': {
        return {
          ...action,
          actionType: 'steal_attempt',
          playerAddress: toString(eventData.attacker),
          targetAddress: toString(eventData.target ?? eventData.victim),
          propertyId: eventData.property_id ?? eventData.propertyId,
          amount: Number(eventData.steal_cost ?? eventData.stealCost),
        };
      }

      // ========== ADMIN EVENTS - TRIGGER BLOCKCHAIN SYNC ==========
      
      case 'AdminGrantEvent':
      case 'AdminRevokeEvent': {
        console.log(`   🔄 Admin event detected: ${eventName} - triggering blockchain sync`);
        
        const playerAddress = toString(eventData.target_player ?? eventData.targetPlayer);
        const propertyId = eventData.property_id ?? eventData.propertyId;
        
        // Trigger async blockchain sync (use setImmediate to avoid blocking)
        setImmediate(async () => {
          try {
            // Require inside setImmediate to get fresh reference
            const blockchainSync = require('./blockchainSyncService');
            await blockchainSync.syncPropertyOwnership(playerAddress, propertyId);
            await blockchainSync.syncPropertyState(propertyId);
            console.log(`   ✅ Blockchain synced for player ${playerAddress.substring(0, 8)}... property ${propertyId}`);
          } catch (err) {
            console.error(`   ❌ Failed to sync after ${eventName}:`, err.message);
          }
        });
        
        // Don't store admin events as player actions
        console.log(`   ℹ️  Blockchain sync queued for player ${playerAddress.substring(0, 8)}... property ${propertyId}`);
        return null;
      }

      case 'AdminShieldGrantEvent': {
        console.log(`   🔄 Admin shield event detected - triggering blockchain sync`);
        
        const playerAddress = toString(eventData.player);
        const propertyId = eventData.property_id ?? eventData.propertyId;
        
        // Trigger async blockchain sync
        setImmediate(async () => {
          try {
            const blockchainSync = require('./blockchainSyncService');
            await blockchainSync.syncPropertyOwnership(playerAddress, propertyId);
            console.log(`   ✅ Shield synced for player ${playerAddress.substring(0, 8)}... property ${propertyId}`);
          } catch (err) {
            console.error(`   ❌ Failed to sync after shield grant:`, err.message);
          }
        });
        
        console.log(`   ℹ️  Shield sync queued for player ${playerAddress.substring(0, 8)}... property ${propertyId}`);
        return null;
      }

      case 'AdminPlayerAdjustEvent': {
        console.log(`   🔄 Admin balance adjustment detected - no sync needed`);
        // Balance adjustments don't affect ownerships, just log
        return null;
      }

      case 'AdminUpdateEvent':
      case 'AdminWithdrawEvent':
      case 'AdminAuthorityTransferEvent': {
        // These don't affect player/property state, just log
        console.log(`   ℹ️  Admin event: ${eventName} - no sync required`);
        return null;
      }

      default:
        console.warn(`   ⚠️  Unknown event type: ${eventName}`);
        return null;
    }
  } catch (error) {
    console.error(`   ❌ Error converting event to action:`, error);
    return null;
  }
}

module.exports = {
  parseTransaction,
  eventToAction,
  PROGRAM_ID, // Export in case other modules need it
};