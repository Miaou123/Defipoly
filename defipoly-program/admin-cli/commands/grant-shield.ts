import { PublicKey } from '@solana/web3.js';
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA, getPlayerPDA } from '../utils/pda.js';

export class GrantShieldCommand implements AdminCommand {
  async execute(ctx: ProgramContext, playerAddress: string, propertyId: number, durationHours: number): Promise<void> {
    console.log('\n🛡️  ADMIN: Grant Shield');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);
    const targetPlayer = new PublicKey(playerAddress);
    const playerPDA = getPlayerPDA(programId, targetPlayer);

    console.log(`Player: ${playerAddress}`);
    console.log(`Property ID: ${propertyId}`);
    console.log(`Duration: ${durationHours} hours`);
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .adminGrantShield(propertyId, durationHours)
        .accounts({
          playerAccount: playerPDA,
          gameConfig: gameConfig,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Shield granted!`);
      console.log(`Transaction: ${tx}`);
    } catch (error: any) {
      console.error(`❌ Error:`, error.message || error);
      throw error;
    }
  }
}