import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { PROGRAM_ID } from './constants';
import idl from '@/types/memeopoly_program.json';
import type { Property, PropertyOwnership, PlayerAccount, PlayerSetCooldown } from '@/types/accounts';
import { deserializeOwnership, deserializeProperty, deserializePlayer } from './deserialize';


// ✅ SIMPLE: Just use Idl type and cast when needed
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
  console.log(`🔑 Ownership PDA for property ${propertyId}:`, pda.toString());
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

export function getSetStatsPDA(setId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('set_stats'), Buffer.from([setId])],
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
  
  console.log(`\n🔍 Fetching ownership for property ${propertyId}`);
  console.log(`  Player: ${playerPubkey.toString()}`);
  console.log(`  PDA: ${ownershipPDA.toString()}`);
  
  try {
    const connection = program.provider.connection;
    const accountInfo = await connection.getAccountInfo(ownershipPDA);
    
    console.log(`  Account Info:`, accountInfo ? '✅ EXISTS' : '❌ NOT FOUND');
    
    if (!accountInfo) {
      console.log(`  ⚠️ No account found at this PDA`);
      return null;
    }
    
    console.log(`  Account data length: ${accountInfo.data.length} bytes`);
    console.log(`  Owner: ${accountInfo.owner.toString()}`);
    
    const ownershipAccount = deserializeOwnership(accountInfo.data);
    console.log(`  ✅ Successfully deserialized ownership:`, ownershipAccount);
    return ownershipAccount;
  } catch (error) {
    console.error(`  ❌ Error fetching ownership for property ${propertyId}:`, error);
    if (error instanceof Error) {
      console.error(`  Error message: ${error.message}`);
    }
    return null;
  }
}

export async function fetchPlayerData(program: MemeopolyProgram, playerPubkey: PublicKey): Promise<PlayerAccount | null> {
  const [playerPDA] = getPlayerPDA(playerPubkey);
  try {
    const connection = program.provider.connection;
    const accountInfo = await connection.getAccountInfo(playerPDA);
    
    if (!accountInfo) return null;
    
    const playerAccount = deserializePlayer(accountInfo.data);
    return playerAccount;
  } catch (error) {
    console.error('Error fetching player data:', error);
    return null;
  }
}

/**
 * Fetch set cooldown data for a player and set
 */
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
    // Account doesn't exist yet or other error
    console.warn(`No cooldown data for set ${setId}:`, error);
    return null;
  }
}