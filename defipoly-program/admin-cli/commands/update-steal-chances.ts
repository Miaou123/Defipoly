import * as anchor from "@coral-xyz/anchor";
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA } from '../utils/pda.js';

export class UpdateStealChanceCommand implements AdminCommand {
  async execute(ctx: ProgramContext, chanceBps: number): Promise<void> {
    console.log('\n🎯 ADMIN: Update Steal Chance');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);

    console.log(`Steal Chance: ${chanceBps} bps (${chanceBps / 100}%)`);
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .updateStealChance(chanceBps)
        .accounts({
          gameConfig: gameConfig,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Steal chance updated successfully!`);
      console.log(`Transaction: ${tx}`);
    } catch (error: any) {
      console.error(`❌ Error:`, error.message || error);
      throw error;
    }
  }
}