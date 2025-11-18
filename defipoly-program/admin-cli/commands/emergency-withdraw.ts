import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA, getRewardPoolVaultPDA } from '../utils/pda.js';
import { toTokenAmount, formatTokenAmount } from '../utils/decimals.js';
import { CONFIG } from '../config.js';

export class EmergencyWithdrawCommand implements AdminCommand {
  async execute(ctx: ProgramContext, amount: number, destinationAddress: string): Promise<void> {
    console.log('\n🚨 ADMIN: Emergency Withdraw');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);
    
    const deployment = JSON.parse(fs.readFileSync(CONFIG.DEPLOYMENT_PATH, 'utf-8'));
    const tokenMint = new PublicKey(deployment.tokenMint);
    
    const rewardPoolVault = getRewardPoolVaultPDA(programId, gameConfig);
    const destination = new PublicKey(destinationAddress);
    const amountWithDecimals = toTokenAmount(amount);

    console.log(`Amount: ${formatTokenAmount(amount)} tokens`);
    console.log(`On-chain amount: ${amountWithDecimals.toString()}`);
    console.log(`Destination: ${destinationAddress}`);
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .adminEmergencyWithdraw(amountWithDecimals)
        .accounts({
          rewardPoolVault: rewardPoolVault,
          destinationAccount: destination,
          gameConfig: gameConfig,
          authority: authority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
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