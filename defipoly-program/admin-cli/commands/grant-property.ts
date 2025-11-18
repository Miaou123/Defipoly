import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from '@solana/web3.js';
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA, getPropertyPDA, getOwnershipPDA, getPlayerPDA } from '../utils/pda.js';

export class GrantPropertyCommand implements AdminCommand {
  async execute(ctx: ProgramContext, propertyId: number, playerAddress: string, slots: number): Promise<void> {
    console.log('\n🎁 ADMIN: Grant Property');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);
    const targetPlayer = new PublicKey(playerAddress);
    
    const propertyPDA = getPropertyPDA(programId, propertyId);
    const ownershipPDA = getOwnershipPDA(programId, targetPlayer, propertyId);
    const playerPDA = getPlayerPDA(programId, targetPlayer);

    console.log(`Property ID: ${propertyId}`);
    console.log(`Player: ${playerAddress}`);
    console.log(`Slots: ${slots}`);
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .adminGrantProperty(targetPlayer, slots)
        .accounts({
          property: propertyPDA,
          ownership: ownershipPDA,
          playerAccount: playerPDA,
          gameConfig: gameConfig,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
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