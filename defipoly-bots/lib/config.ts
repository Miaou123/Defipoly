// ============================================
// CONFIG - Environment and Constants
// ============================================

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";
import { 
  PROGRAM_ID, 
  TOKEN_MINT, 
  RPC_ENDPOINT, 
  PROPERTIES, 
  SET_NAMES,
  getPropertyConfig,
  getSetProperties
} from "../src/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
dotenv.config({ path: path.join(__dirname, "../.env") });

export class Config {
  // RPC and Network
  readonly rpcUrl: string;
  readonly commitment: "confirmed" | "finalized" = "confirmed";

  // Token (from generated constants)
  readonly tokenMint: PublicKey;

  // Program (from generated constants)
  readonly programId: PublicKey;
  readonly idlPath: string;

  // Backend
  readonly backendUrl: string;

  // Wallet storage
  readonly walletsDir: string;

  // Property configs (from generated constants)
  readonly propertyConfigs = PROPERTIES;
  readonly setNames = SET_NAMES;

  constructor() {
    // Use RPC_ENDPOINT from generated constants, but allow env override
    this.rpcUrl = process.env.ANCHOR_PROVIDER_URL || RPC_ENDPOINT;
    
    // Use TOKEN_MINT from generated constants
    this.tokenMint = TOKEN_MINT;
    
    // Use PROGRAM_ID from generated constants
    this.programId = PROGRAM_ID;
    
    this.backendUrl = process.env.BACKEND_URL || "http://localhost:3005";
    this.walletsDir = path.join(__dirname, "../wallets");

    // Try to find IDL (still needed for Anchor client)
    const possiblePaths = [
      path.join(__dirname, "../../defipoly-program/target/idl/defipoly_program.json"),
      path.join(__dirname, "../idl/defipoly_program.json"),
      path.join(__dirname, "../target/idl/defipoly_program.json"),
    ];

    let foundIdl = "";
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        foundIdl = p;
        break;
      }
    }

    if (!foundIdl) {
      throw new Error(
        `IDL not found. Tried:\n${possiblePaths.join("\n")}\n\nMake sure defipoly-program is built.`
      );
    }

    this.idlPath = foundIdl;
  }

  // Use the helper functions from generated constants
  getPropertyConfig(propertyId: number) {
    return getPropertyConfig(propertyId);
  }

  getSetProperties(setId: number) {
    return getSetProperties(setId);
  }
}