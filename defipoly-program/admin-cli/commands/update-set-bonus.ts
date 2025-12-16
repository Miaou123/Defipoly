import * as anchor from "@coral-xyz/anchor";
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA } from '../utils/pda.js';

export class UpdateSetBonusCommand implements AdminCommand {
  async execute(ctx: ProgramContext, setId: number, bonusBps: number): Promise<void> {
    console.log('\n🎯 ADMIN: Update Set Bonus');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);

    console.log(`Set ID: ${setId}`);
    console.log(`Bonus: ${bonusBps} bps (${bonusBps / 100}%)`);
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .adminUpdateSetBonus(setId, bonusBps)
        .accounts({
          gameConfig: gameConfig,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Set ${setId} bonus updated to ${bonusBps} bps!`);
      console.log(`Transaction: ${tx}`);
    } catch (error: any) {
      console.error(`❌ Error:`, error.message || error);
      throw error;
    }
  }
}