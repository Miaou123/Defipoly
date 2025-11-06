// ============================================
// FIXED transactionProcessor.js
// Handles both snake_case and camelCase event field names
// ============================================

const { BorshCoder, EventParser } = require('@coral-xyz/anchor');
const { PublicKey } = require('@solana/web3.js');

// Load IDL - this is the source of truth for PROGRAM_ID
const idl = require('../idl/defipoly_program.json');

// Log IDL loading
console.log('📚 [TRANSACTION PROCESSOR] IDL loaded successfully');
console.log(`   - Program ID: ${idl.address}`);
console.log(`   - Events defined: ${idl.events?.length || 0}`);
if (idl.events && idl.events.length > 0) {
  console.log('   - Event names:', idl.events.map(e => e.name).join(', '));
}

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
      console.log('📋 [PARSE TX] Full logs for debugging:');
      logs.forEach((log, i) => {
        console.log(`   ${i + 1}. ${log}`);
      });
      return null;
    }

    // Process each event
    const actions = [];
    for (const event of eventsArray) {
      console.log(`\n🎯 [PARSE TX] Processing event: ${event.name}`);
      
      const action = eventToAction(event, signature, blockTime);
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
 * Convert event to action data
 * Handles both snake_case and camelCase field names
 */
function eventToAction(event, signature, blockTime) {
  try {
    const eventName = event.name;
    const eventData = event.data;

    console.log(`   📦 Event data:`, JSON.stringify(eventData, null, 2));

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

      case 'AdminUpdateEvent':
      case 'AdminGrantEvent':
      case 'AdminRevokeEvent':
      case 'AdminPlayerAdjustEvent':
      case 'AdminShieldGrantEvent':
      case 'AdminWithdrawEvent':
      case 'AdminAuthorityTransferEvent': {
        // Admin events - just log them, don't store as player actions
        console.log(`   ℹ️  Admin event: ${eventName} - skipping storage`);
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