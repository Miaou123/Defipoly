import { PublicKey } from '@solana/web3.js';

export function getGameConfigPDA(programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('game_config')],
    programId
  );
  return pda;
}

export function getPropertyPDA(programId: PublicKey, propertyId: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('property'), Buffer.from([propertyId])],
    programId
  );
  return pda;
}

export function getPlayerPDA(programId: PublicKey, player: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('player'), player.toBuffer()],
    programId
  );
  return pda;
}

export function getRewardPoolVaultPDA(programId: PublicKey, gameConfig: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('reward_pool_vault'), gameConfig.toBuffer()],
    programId
  );
  return pda;
}

// ============================================
// DEPRECATED v0.8 PDA functions - removed in v0.9
// These PDAs are now managed internally by the program:
// - getOwnershipPDA (ownership)
// - getSetCooldownPDA (cooldown) 
// - getStealCooldownPDA (steal_cooldown)
// - getSetOwnershipPDA (set_ownership)
// - getSetStatsPDA (set_stats)
// ============================================