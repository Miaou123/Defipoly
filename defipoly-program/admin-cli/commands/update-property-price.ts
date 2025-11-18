import * as anchor from "@coral-xyz/anchor";
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA, getPropertyPDA } from '../utils/pda.js';
import { toTokenAmount, formatTokenAmount } from '../utils/decimals.js';

export class UpdatePropertyPriceCommand implements AdminCommand {
  async execute(ctx: ProgramContext, propertyId: number, newPrice: number): Promise<void> {
    console.log('\n💰 ADMIN: Update Property Price');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);
    const propertyPDA = getPropertyPDA(programId, propertyId);

    const priceWithDecimals = toTokenAmount(newPrice);
    
    console.log(`Property ID: ${propertyId}`);
    console.log(`New Price: ${formatTokenAmount(newPrice)} tokens`);
    console.log(`On-chain amount: ${priceWithDecimals.toString()}`);
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .updatePropertyPrice(propertyId, priceWithDecimals)
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