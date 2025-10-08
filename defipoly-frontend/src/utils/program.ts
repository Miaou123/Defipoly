import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { PROGRAM_ID } from './constants';
import idl from '@/types/defipoly_program.json';
import type { Property, PropertyOwnership, PlayerAccount } from '@/types/accounts';
import { deserializeOwnership, deserializeProperty, deserializePlayer } from './deserialize';

export function getProgram(provider: AnchorProvider) {
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

export async function checkPlayerExists(connection: Connection, playerPubkey: PublicKey): Promise<boolean> {
  const [playerPDA] = getPlayerPDA(playerPubkey);
  const accountInfo = await connection.getAccountInfo(playerPDA);
  return accountInfo !== null;
}

export async function fetchPropertyData(program: Program<Idl>, propertyId: number): Promise<Property | null> {
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

export async function fetchOwnershipData(program: Program<Idl>, playerPubkey: PublicKey, propertyId: number): Promise<PropertyOwnership | null> {
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
    
    // Manually deserialize the account data
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

export async function fetchPlayerData(program: Program<Idl>, playerPubkey: PublicKey): Promise<PlayerAccount | null> {
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