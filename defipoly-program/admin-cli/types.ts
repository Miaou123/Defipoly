import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

export interface ProgramContext {
  program: Program;
  connection: Connection;
  authority: Keypair;
}

export interface MenuOption {
  id: string;
  label: string;
  emoji: string;
  handler: () => Promise<void>;
}

export interface AdminCommand {
  execute(ctx: ProgramContext, ...args: any[]): Promise<void>;
}