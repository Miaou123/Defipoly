import BN from 'bn.js';
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA, getPropertyPDA } from '../utils/pda.js';

export class UpdateCooldownCommand implements AdminCommand {
  async execute(ctx: ProgramContext, propertyId: number, durationMinutes: number): Promise<void> {
    console.log('\n⏱️  ADMIN: Update Property Cooldown');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);
    const propertyPDA = getPropertyPDA(programId, propertyId);

    console.log(`Property ID: ${propertyId}`);
    console.log(`New Cooldown: ${durationMinutes} minutes`);
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .adminUpdateCooldown(propertyId, new BN(durationMinutes * 60))
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