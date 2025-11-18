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

export function getOwnershipPDA(programId: PublicKey, player: PublicKey, propertyId: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('ownership'),
      player.toBuffer(),
      Buffer.from([propertyId])
    ],
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

export function getSetCooldownPDA(programId: PublicKey, player: PublicKey, setId: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('cooldown'),
      player.toBuffer(),
      Buffer.from([setId])
    ],
    programId
  );
  return pda;
}

export function getStealCooldownPDA(programId: PublicKey, player: PublicKey, propertyId: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('steal_cooldown'),
      player.toBuffer(),
      Buffer.from([propertyId])
    ],
    programId
  );
  return pda;
}