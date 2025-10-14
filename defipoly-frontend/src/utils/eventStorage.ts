import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { storeAction, eventToAction } from '@/utils/actionsStorage';
import { PROGRAM_ID } from '@/utils/constants';
import idl from '../../../defipoly-program/target/idl/defipoly_program.json';

export const storeTransactionEvents = async (
  connection: Connection,
  eventParser: EventParser | null,
  signature: string
) => {
  if (!eventParser) return;
  
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

    // Parse events from logs
    const events = eventParser.parseLogs(tx.meta.logMessages);
    const blockTime = tx.blockTime || Math.floor(Date.now() / 1000);

    // Store each event to backend
    for (const event of events) {
      const action = eventToAction(event, signature, blockTime);
      if (action) {
        await storeAction(action);
        console.log('✅ Stored action to backend:', action.actionType);
      }
    }
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