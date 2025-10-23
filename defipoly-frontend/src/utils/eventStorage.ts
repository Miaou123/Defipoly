// ============================================
// FIXED eventStorage.ts
// Replace your defipoly-frontend/src/utils/eventStorage.ts with this
// ============================================

import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { storeAction, eventToAction } from '@/utils/actionsStorage';
import { PROGRAM_ID } from '@/utils/constants';
import idl from '@/idl/defipoly_program.json';

export const storeTransactionEvents = async (
  connection: Connection,
  eventParser: EventParser | null,
  signature: string
) => {
  if (!eventParser) {
    console.warn('⚠️ No event parser available');
    return;
  }
  
  try {
    // Wait a bit for transaction to be finalized
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fetch transaction with logs
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });

    if (!tx || !tx.meta?.logMessages) {
      console.warn('⚠️ No transaction logs found for', signature);
      return;
    }

    console.log('📝 Processing', tx.meta.logMessages.length, 'log messages');

    // Parse events from logs - convert generator to array
    const eventsGenerator = eventParser.parseLogs(tx.meta.logMessages);
    const events = Array.from(eventsGenerator);
    
    console.log('📦 Found', events.length, 'events to store');
    
    const blockTime = tx.blockTime || Math.floor(Date.now() / 1000);

    // Store each event to backend
    for (const event of events) {
      console.log('🔄 Processing event:', event.name);
      
      const action = eventToAction(event, signature, blockTime);
      if (action) {
        try {
          const stored = await storeAction(action);
          if (stored) {
            console.log('✅ Stored action to backend:', action.actionType);
          } else {
            console.error('❌ Failed to store action:', action.actionType);
          }
        } catch (storeError) {
          console.error('❌ Error storing action:', storeError);
        }
      } else {
        console.warn('⚠️ eventToAction returned null for:', event.name);
      }
    }
    
    console.log('✅ Finished processing transaction events');
  } catch (error) {
    console.error('Error storing transaction events:', error);
    // Don't throw - we don't want to break the UI if backend is down
  }
};

export const createEventParser = (wallet: any) => {
  if (!wallet) return null;
  const coder = new BorshCoder(idl as any);
  return new EventParser(PROGRAM_ID, coder);
};