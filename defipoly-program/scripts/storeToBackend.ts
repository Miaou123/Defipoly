// ============================================
// FILE: defipoly-program/scripts/storeToBackend.ts
// Helper to store bot actions to backend API
// ============================================

import * as anchor from "@coral-xyz/anchor";
import { BorshCoder, EventParser } from "@coral-xyz/anchor";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROGRAM_ID = new anchor.web3.PublicKey("H1zzYzWPReWJ4W2JNiBrYbsrHDxFDGJ9n9jAyYG2VhLQ");
const BACKEND_URL = process.env.BACKEND_URL || "http://YOUR_DROPLET_IP:3005";

interface GameAction {
  txSignature: string;
  actionType: string;
  playerAddress: string;
  propertyId?: number;
  targetAddress?: string;
  amount?: number;
  slots?: number;
  success?: boolean;
  metadata?: any;
  blockTime: number;
}

// Convert event to action format
function eventToAction(event: any, txSignature: string, blockTime: number): GameAction | null {
  const eventName = event.name;
  
  switch (eventName) {
    case 'PropertyBoughtEvent':
    case 'propertyBoughtEvent':
      return {
        txSignature,
        actionType: 'buy',
        playerAddress: event.data.player.toString(),
        propertyId: event.data.propertyId || event.data.property_id,
        amount: Number(event.data.price),
        slots: event.data.slotsOwned || event.data.slots_owned,
        blockTime,
        metadata: { price: event.data.price.toString() }
      };

    case 'PropertySoldEvent':
    case 'propertySoldEvent':
      return {
        txSignature,
        actionType: 'sell',
        playerAddress: event.data.player.toString(),
        propertyId: event.data.propertyId || event.data.property_id,
        slots: event.data.slots,
        amount: Number(event.data.received),
        blockTime,
        metadata: {
          received: event.data.received.toString(),
          burned: event.data.burned.toString()
        }
      };

    case 'ShieldActivatedEvent':
    case 'shieldActivatedEvent':
      return {
        txSignature,
        actionType: 'shield',
        playerAddress: event.data.player.toString(),
        propertyId: event.data.propertyId || event.data.property_id,
        amount: Number(event.data.cost),
        blockTime,
        metadata: {
          expiry: event.data.expiry,
          cycles: event.data.cycles
        }
      };

    case 'StealSuccessEvent':
    case 'stealSuccessEvent':
      return {
        txSignature,
        actionType: 'steal_success',
        playerAddress: event.data.attacker.toString(),
        targetAddress: event.data.target.toString(),
        propertyId: event.data.propertyId || event.data.property_id,
        amount: Number(event.data.stealCost || event.data.steal_cost),
        success: true,
        blockTime
      };

    case 'StealFailedEvent':
    case 'stealFailedEvent':
      return {
        txSignature,
        actionType: 'steal_failed',
        playerAddress: event.data.attacker.toString(),
        targetAddress: event.data.target.toString(),
        propertyId: event.data.propertyId || event.data.property_id,
        amount: Number(event.data.stealCost || event.data.steal_cost),
        success: false,
        blockTime
      };

    case 'RewardsClaimedEvent':
    case 'rewardsClaimedEvent':
      return {
        txSignature,
        actionType: 'claim',
        playerAddress: event.data.player.toString(),
        amount: Number(event.data.amount),
        blockTime,
        metadata: {
          hoursElapsed: event.data.hoursElapsed || event.data.hours_elapsed
        }
      };

    default:
      return null;
  }
}

// Store action to backend
async function storeAction(action: GameAction): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });

    if (response.ok) {
      return true;
    } else {
      console.error(`Failed to store action: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('Error storing action to backend:', error);
    return false;
  }
}

// Main function to store transaction to backend
export async function storeTransactionToBackend(
  connection: anchor.web3.Connection,
  signature: string
): Promise<void> {
  try {
    // Wait for transaction to finalize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fetch transaction
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });

    if (!tx || !tx.meta?.logMessages) {
      console.log('  ⚠️  No logs found for transaction');
      return;
    }

    // Load IDL and parse events
    const idlPath = path.join(__dirname, "../target/idl/defipoly_program.json");
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
    
    const coder = new BorshCoder(idl);
    const eventParser = new EventParser(PROGRAM_ID, coder);
    
    const events = eventParser.parseLogs(tx.meta.logMessages);
    const blockTime = tx.blockTime || Math.floor(Date.now() / 1000);

    // Store each event
    for (const event of events) {
      const action = eventToAction(event, signature, blockTime);
      if (action) {
        const stored = await storeAction(action);
        if (stored) {
          console.log(`  ✅ Stored to backend: ${action.actionType}`);
        } else {
          console.log(`  ❌ Failed to store: ${action.actionType}`);
        }
      }
    }
  } catch (error) {
    console.error('  ❌ Error storing to backend:', error);
    // Don't throw - we don't want to break the bot if backend is down
  }
}