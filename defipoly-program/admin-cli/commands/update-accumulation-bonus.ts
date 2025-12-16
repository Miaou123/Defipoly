import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA } from '../utils/pda.js';

export class UpdateAccumulationBonusCommand implements AdminCommand {
  async execute(ctx: ProgramContext, tiers: {
    tier1Threshold: number;
    tier1BonusBps: number;
    tier2Threshold: number;
    tier2BonusBps: number;
    tier3Threshold: number;
    tier3BonusBps: number;
    tier4Threshold: number;
    tier4BonusBps: number;
  }): Promise<void> {
    console.log('\n💰 ADMIN: Update Accumulation Bonus');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);

    console.log('Setting accumulation bonus tiers:');
    console.log(`Tier 1: ${tiers.tier1Threshold} tokens -> ${tiers.tier1BonusBps} bps (${tiers.tier1BonusBps / 100}%)`);
    console.log(`Tier 2: ${tiers.tier2Threshold} tokens -> ${tiers.tier2BonusBps} bps (${tiers.tier2BonusBps / 100}%)`);
    console.log(`Tier 3: ${tiers.tier3Threshold} tokens -> ${tiers.tier3BonusBps} bps (${tiers.tier3BonusBps / 100}%)`);
    console.log(`Tier 4: ${tiers.tier4Threshold} tokens -> ${tiers.tier4BonusBps} bps (${tiers.tier4BonusBps / 100}%)`);
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .adminUpdateAccumulationBonus(
          new BN(tiers.tier1Threshold),
          tiers.tier1BonusBps,
          new BN(tiers.tier2Threshold),
          tiers.tier2BonusBps,
          new BN(tiers.tier3Threshold),
          tiers.tier3BonusBps,
          new BN(tiers.tier4Threshold),
          tiers.tier4BonusBps
        )
        .accounts({
          gameConfig: gameConfig,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Accumulation bonus tiers updated successfully!`);
      console.log(`Transaction: ${tx}`);
    } catch (error: any) {
      console.error(`❌ Error:`, error.message || error);
      throw error;
    }
  }
}