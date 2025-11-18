import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import { CONFIG } from '../config.js';
import type { ProgramContext } from '../types.js';

export function loadWallet(): Keypair {
  const keypairData = fs.readFileSync(CONFIG.WALLET_PATH, 'utf-8');
  return Keypair.fromSecretKey(Buffer.from(JSON.parse(keypairData)));
}

export function loadProgram(): ProgramContext {
  const connection = new Connection(CONFIG.RPC_URL, 'confirmed');
  const authority = loadWallet();
  const wallet = new anchor.Wallet(authority);
  
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  anchor.setProvider(provider);

  const idl = JSON.parse(fs.readFileSync(CONFIG.IDL_PATH, 'utf-8'));
  const program = new anchor.Program(idl, provider);
  
  return { program, connection, authority };
}