import * as anchor from "@coral-xyz/anchor";
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA } from '../utils/pda.js';

export class UpdatePhaseCommand implements AdminCommand {
  async execute(ctx: ProgramContext, newPhase: number): Promise<void> {
    console.log('\n🔄 ADMIN: Update Game Phase');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);

    console.log(`New Phase: ${newPhase}`);
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .updatePhase(newPhase)
        .accounts({
          gameConfig: gameConfig,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Phase updated successfully!`);
      console.log(`Transaction: ${tx}`);
    } catch (error: any) {
      console.error(`❌ Error:`, error.message || error);
      throw error;
    }
  }
}