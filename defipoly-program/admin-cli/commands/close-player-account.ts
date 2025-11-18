import { PublicKey } from '@solana/web3.js';
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA, getPlayerPDA } from '../utils/pda.js';

export class ClosePlayerAccountCommand implements AdminCommand {
  async execute(ctx: ProgramContext, playerAddress: string): Promise<void> {
    console.log('\n🗑️  ADMIN: Close Player Account');
    console.log('='.repeat(70));
    
    const { program, connection, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);
    const targetPlayer = new PublicKey(playerAddress);
    const playerPDA = getPlayerPDA(programId, targetPlayer);

    console.log(`Player: ${playerAddress}`);
    console.log(`\nSending transaction...`);

    try {
      const accountInfo = await connection.getAccountInfo(playerPDA);
      if (!accountInfo) {
        console.log('⚠️  Account does not exist');
        return;
      }

      console.log(`💰 Rent to recover: ${(accountInfo.lamports / 1e9).toFixed(6)} SOL`);

      const tx = await program.methods
        .adminClosePlayerAccount()
        .accounts({
          playerAccount: playerPDA,
          gameConfig: gameConfig,
          authority: authority.publicKey,
          rentReceiver: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Account closed!`);
      console.log(`Transaction: ${tx}`);
    } catch (error: any) {
      console.error(`❌ Error:`, error.message || error);
      throw error;
    }
  }
}