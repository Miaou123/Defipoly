import * as anchor from "@coral-xyz/anchor";
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA } from '../utils/pda.js';

export class PauseGameCommand implements AdminCommand {
  async execute(ctx: ProgramContext): Promise<void> {
    console.log('\n⏸️ ADMIN: Pause Game');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);

    console.log('⚠️ Pausing the game...');
    console.log('All game actions will be disabled.');
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .pauseGame()
        .accounts({
          gameConfig: gameConfig,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Game paused successfully!`);
      console.log(`Transaction: ${tx}`);
    } catch (error: any) {
      console.error(`❌ Error:`, error.message || error);
      throw error;
    }
  }
}

export class UnpauseGameCommand implements AdminCommand {
  async execute(ctx: ProgramContext): Promise<void> {
    console.log('\n▶️ ADMIN: Unpause Game');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);

    console.log('🎮 Resuming the game...');
    console.log('All game actions will be re-enabled.');
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .unpauseGame()
        .accounts({
          gameConfig: gameConfig,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Game resumed successfully!`);
      console.log(`Transaction: ${tx}`);
    } catch (error: any) {
      console.error(`❌ Error:`, error.message || error);
      throw error;
    }
  }
}