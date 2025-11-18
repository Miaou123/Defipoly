import * as anchor from "@coral-xyz/anchor";
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA, getPropertyPDA } from '../utils/pda.js';

export class UpdatePropertyYieldCommand implements AdminCommand {
  async execute(ctx: ProgramContext, propertyId: number, newYieldBps: number): Promise<void> {
    console.log('\n📈 ADMIN: Update Property Yield');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);
    const propertyPDA = getPropertyPDA(programId, propertyId);

    console.log(`Property ID: ${propertyId}`);
    console.log(`New Yield: ${newYieldBps} bps (${newYieldBps / 100}%)`);
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .adminUpdatePropertyYield(propertyId, newYieldBps)
        .accounts({
          property: propertyPDA,
          gameConfig: gameConfig,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Success!`);
      console.log(`Transaction: ${tx}`);
    } catch (error: any) {
      console.error(`❌ Error:`, error.message || error);
      throw error;
    }
  }
}