// ============================================
// FILE: defipoly-frontend/src/utils/program.ts
// FIXED: Added retry logic to fetchPlayerData
// ============================================

import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { PROGRAM_ID } from './constants';
import idl from '@/idl/defipoly_program.json';
import type { Property, PropertyOwnership, PlayerAccount, PlayerSetCooldown } from '@/types/accounts';
import { deserializeOwnership, deserializeProperty, deserializePlayer } from './deserialize';

export type MemeopolyProgram = Program<Idl>;

export function getProgram(provider: AnchorProvider): MemeopolyProgram {
  return new Program(idl as Idl, provider);
}

export function getPlayerPDA(playerPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('player'), playerPubkey.toBuffer()],
    PROGRAM_ID
  );
}

export function getPropertyPDA(propertyId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('property'), Buffer.from([propertyId])],
    PROGRAM_ID
  );
}

export function getOwnershipPDA(playerPubkey: PublicKey, propertyId: number): [PublicKey, number] {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('ownership'), playerPubkey.toBuffer(), Buffer.from([propertyId])],
    PROGRAM_ID
  );
  return [pda, bump];
}

export function getSetCooldownPDA(playerPubkey: PublicKey, setId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('cooldown'), playerPubkey.toBuffer(), Buffer.from([setId])],
    PROGRAM_ID
  );
}

export function getSetOwnershipPDA(playerPubkey: PublicKey, setId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('set_ownership'), playerPubkey.toBuffer(), Buffer.from([setId])],
    PROGRAM_ID
  );
}


export function getStealRequestPDA(attackerPubkey: PublicKey, propertyId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('steal_request'), attackerPubkey.toBuffer(), Buffer.from([propertyId])],
    PROGRAM_ID
  );
}

export async function checkPlayerExists(connection: Connection, playerPubkey: PublicKey): Promise<boolean> {
  const [playerPDA] = getPlayerPDA(playerPubkey);
  const accountInfo = await connection.getAccountInfo(playerPDA);
  return accountInfo !== null;
}

export async function fetchPropertyData(program: MemeopolyProgram, propertyId: number): Promise<Property | null> {
  const [propertyPDA] = getPropertyPDA(propertyId);
  try {
    const connection = program.provider.connection;
    const accountInfo = await connection.getAccountInfo(propertyPDA);
    
    if (!accountInfo) return null;
    
    const propertyAccount = deserializeProperty(accountInfo.data);
    return propertyAccount;
  } catch (error) {
    console.error(`Error fetching property ${propertyId}:`, error);
    return null;
  }
}

export async function fetchOwnershipData(program: MemeopolyProgram, playerPubkey: PublicKey, propertyId: number): Promise<PropertyOwnership | null> {
  const [ownershipPDA] = getOwnershipPDA(playerPubkey, propertyId);
  
  
  try {
    const connection = program.provider.connection;
    const accountInfo = await connection.getAccountInfo(ownershipPDA);
    
    
    if (!accountInfo) {
      return null;
    }
    
    
    const ownershipAccount = deserializeOwnership(accountInfo.data);
    return ownershipAccount;
  } catch (error) {
    console.error(`  ❌ Error fetching ownership for property ${propertyId}:`, error);
    if (error instanceof Error) {
      console.error(`  Error message: ${error.message}`);
    }
    return null;
  }
}

// ✅ FIXED: Added retry logic with exponential backoff
export async function fetchPlayerData(program: MemeopolyProgram, playerPubkey: PublicKey): Promise<PlayerAccount | null> {
  const [playerPDA] = getPlayerPDA(playerPubkey);
  
  console.log('🔍 fetchPlayerData called for:', playerPubkey.toString());
  console.log('🔍 Derived PlayerPDA:', playerPDA.toString());
  console.log('🔍 Program ID:', PROGRAM_ID.toString());
  
  const maxRetries = 3;
  let lastError: any = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const connection = program.provider.connection;
      console.log('🔍 Attempt', attempt + 1, '- Fetching account info...');
      
      const accountInfo = await connection.getAccountInfo(playerPDA);
      
      if (!accountInfo) {
        console.warn('⚠️ No account found at PDA:', playerPDA.toString());
        console.warn('⚠️ This means the player account does not exist on-chain');
        return null;
      }
      
      console.log('✅ Account found! Data length:', accountInfo.data.length, 'bytes');
      console.log('🔍 Account owner:', accountInfo.owner.toString());
      console.log('🔍 Expected owner (program):', PROGRAM_ID.toString());
      
      // Log first 100 bytes as hex for debugging
      console.log('🔍 First 100 bytes:', accountInfo.data.slice(0, 100).toString('hex'));
      
      try {
        const playerAccount = deserializePlayer(accountInfo.data);
        console.log('✅ Deserialization successful!');
        console.log('🔍 Player data:', {
          owner: playerAccount.owner.toString(),
          totalBaseDailyIncome: playerAccount.totalBaseDailyIncome.toString(),
          lastClaimTimestamp: playerAccount.lastClaimTimestamp.toString(),
          pendingRewards: playerAccount.pendingRewards.toString(),
          totalSlotsOwned: playerAccount.totalSlotsOwned,
        });
        return playerAccount;
      } catch (deserializeError) {
        console.error('❌ Deserialization FAILED:', deserializeError);
        console.error('❌ This likely means deserialize.ts field order doesnt match on-chain data');
        throw deserializeError;
      }
    } catch (error) {
      lastError = error;
      console.error('❌ Attempt', attempt + 1, 'failed:', error);
      
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log('⏳ Retrying in', delay, 'ms...');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('❌ All retries failed. Last error:', lastError);
  return null;
}

export async function fetchSetCooldownData(
  program: MemeopolyProgram,
  playerPubkey: PublicKey,
  setId: number
): Promise<PlayerSetCooldown | null> {
  try {
    const [cooldownPDA] = getSetCooldownPDA(playerPubkey, setId);
    const data = await (program.account as any).playerSetCooldown.fetch(cooldownPDA);
    
    return {
      player: data.player,
      setId: data.setId,
      lastPurchaseTimestamp: data.lastPurchaseTimestamp,
      cooldownDuration: data.cooldownDuration,
      lastPurchasedPropertyId: data.lastPurchasedPropertyId,
      propertiesOwnedInSet: Array.from(data.propertiesOwnedInSet),
      propertiesCount: data.propertiesCount,
      bump: data.bump,
    };
  } catch (error) {
    console.warn(`No cooldown data for set ${setId}:`, error);
    return null;
  }
}

export function getStealCooldownPDA(
  playerPubkey: PublicKey,
  propertyId: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('steal_cooldown'),
      playerPubkey.toBuffer(),
      Buffer.from([propertyId]),
    ],
    PROGRAM_ID
  );
}