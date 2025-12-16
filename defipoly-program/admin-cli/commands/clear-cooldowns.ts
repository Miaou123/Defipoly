import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from '@solana/web3.js';
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA, getPlayerPDA } from '../utils/pda.js';

export class ClearCooldownCommand implements AdminCommand {
  async execute(ctx: ProgramContext, playerAddress: string, setId: number): Promise<void> {
    console.log('\n⏱️ ADMIN: Clear Purchase Cooldown');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);
    const player = new PublicKey(playerAddress);
    const playerPDA = getPlayerPDA(programId, player);

    console.log(`Player: ${playerAddress}`);
    console.log(`Set ID: ${setId}`);
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .adminClearCooldown(setId)
        .accounts({
          playerAccount: playerPDA,
          gameConfig: gameConfig,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Purchase cooldown cleared!`);
      console.log(`Transaction: ${tx}`);
    } catch (error: any) {
      console.error(`❌ Error:`, error.message || error);
      throw error;
    }
  }
}

export class ClearStealCooldownCommand implements AdminCommand {
  async execute(ctx: ProgramContext, playerAddress: string, propertyId: number): Promise<void> {
    console.log('\n🎯 ADMIN: Clear Steal Cooldown');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);
    const player = new PublicKey(playerAddress);
    const playerPDA = getPlayerPDA(programId, player);

    console.log(`Player: ${playerAddress}`);
    console.log(`Property ID: ${propertyId}`);
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .adminClearStealCooldown(propertyId)
        .accounts({
          playerAccount: playerPDA,
          gameConfig: gameConfig,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Steal cooldown cleared!`);
      console.log(`Transaction: ${tx}`);
    } catch (error: any) {
      console.error(`❌ Error:`, error.message || error);
      throw error;
    }
  }
}