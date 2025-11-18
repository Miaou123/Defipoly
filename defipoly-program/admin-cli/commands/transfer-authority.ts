import { PublicKey } from '@solana/web3.js';
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA } from '../utils/pda.js';

export class TransferAuthorityCommand implements AdminCommand {
  async execute(ctx: ProgramContext, newAuthorityAddress: string): Promise<void> {
    console.log('\n👑 ADMIN: Transfer Authority');
    console.log('='.repeat(70));
    
    const { program, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);
    const newAuthority = new PublicKey(newAuthorityAddress);

    console.log(`Current Authority: ${authority.publicKey.toBase58()}`);
    console.log(`New Authority: ${newAuthorityAddress}`);
    console.log(`\nSending transaction...`);

    try {
      const tx = await program.methods
        .adminTransferAuthority(newAuthority)
        .accounts({
          gameConfig: gameConfig,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Authority transferred!`);
      console.log(`Transaction: ${tx}`);
    } catch (error: any) {
      console.error(`❌ Error:`, error.message || error);
      throw error;
    }
  }
}