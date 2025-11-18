import * as anchor from "@coral-xyz/anchor";
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA } from '../utils/pda.js';

export class UpdateStealChancesCommand implements AdminCommand {
  async execute(ctx: ProgramContext, targetedBps: number, randomBps: number): Promise<void> {
    console.log('\n🎯 ADMIN: Update Steal Chances');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);

    console.log(`Targeted Steal: ${targetedBps} bps (${targetedBps / 100}%)`);
    console.log(`Random Steal: ${randomBps} bps (${randomBps / 100}%)`);
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .updateStealChances(targetedBps, randomBps)
        .accounts({
          gameConfig: gameConfig,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Steal chances updated successfully!`);
      console.log(`Transaction: ${tx}`);
    } catch (error: any) {
      console.error(`❌ Error:`, error.message || error);
      throw error;
    }
  }
}