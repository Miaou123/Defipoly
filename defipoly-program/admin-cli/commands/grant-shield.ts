import { PublicKey } from '@solana/web3.js';
import type { ProgramContext, AdminCommand } from '../types.js';
import { getGameConfigPDA } from '../utils/pda.js';

export class GrantShieldCommand implements AdminCommand {
  async execute(ctx: ProgramContext, playerAddress: string, durationHours: number): Promise<void> {
    console.log('\n🛡️  ADMIN: Grant Shield');
    console.log('='.repeat(70));
    
    const { program, connection, authority } = ctx;
    const programId = program.programId;
    const gameConfig = getGameConfigPDA(programId);
    const targetPlayer = new PublicKey(playerAddress);

    console.log(`Player: ${playerAddress}`);
    console.log(`Duration: ${durationHours} hours`);
    console.log(`\nFinding ownership accounts...`);

    try {
      const accounts = await connection.getProgramAccounts(programId, {
        filters: [
          {
            dataSize: 110,
          },
          {
            memcmp: {
              offset: 8,
              bytes: targetPlayer.toBase58(),
            }
          }
        ]
      });

      if (accounts.length === 0) {
        console.log('⚠️  Player has no properties to shield');
        return;
      }

      console.log(`Found ${accounts.length} properties to shield...`);

      for (const { pubkey, account } of accounts) {
        try {
          const propertyId = account.data.readUInt8(40);
          
          const tx = await program.methods
            .adminGrantShield(durationHours)
            .accounts({
              ownership: pubkey,
              gameConfig: gameConfig,
              authority: authority.publicKey,
            })
            .signers([authority])
            .rpc();

          console.log(`✅ Shielded property ${propertyId}: ${tx}`);
        } catch (error: any) {
          console.error(`❌ Failed to shield ownership ${pubkey.toBase58()}:`, error.message);
        }
      }

      console.log(`\n✅ Shield granted to all properties!`);
    } catch (error: any) {
      console.error(`❌ Error:`, error.message || error);
      throw error;
    }
  }
}