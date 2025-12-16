import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA } from '../utils/pda.js';

export class UpdateGlobalRatesCommand implements AdminCommand {
  async execute(ctx: ProgramContext, options: {
    stealCostBps?: number;
    minClaimInterval?: number;
  }): Promise<void> {
    console.log('\n🌍 ADMIN: Update Global Rates');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);

    console.log('Updating the following rates:');
    if (options.stealCostBps !== undefined) {
      console.log(`Steal Cost: ${options.stealCostBps} bps (${options.stealCostBps / 100}%)`);
    }
    if (options.minClaimInterval !== undefined) {
      console.log(`Min Claim Interval: ${options.minClaimInterval} minutes`);
    }
    console.log('\n⚠️  Note: setBonusBps and maxPropertiesClaim are now managed separately in v0.9');
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .adminUpdateGlobalRates(
          options.stealCostBps || null,
          options.minClaimInterval !== undefined ? new BN(options.minClaimInterval) : null
        )
        .accounts({
          gameConfig: gameConfig,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Global rates updated successfully!`);
      console.log(`Transaction: ${tx}`);
    } catch (error: any) {
      console.error(`❌ Error:`, error.message || error);
      throw error;
    }
  }
}