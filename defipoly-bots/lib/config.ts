// ============================================
// CONFIG - Environment and Constants
// ============================================

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
dotenv.config({ path: path.join(__dirname, "../.env") });

export class Config {
  // RPC and Network
  readonly rpcUrl: string;
  readonly commitment: "confirmed" | "finalized" = "confirmed";

  // Token
  readonly tokenMint: PublicKey;

  // Program
  readonly programId: PublicKey;
  readonly idlPath: string;

  // Backend
  readonly backendUrl: string;

  // Wallet storage
  readonly walletsDir: string;

  // Property configs (from game)
  readonly propertyConfigs = [
    // Set 0: Brown (2 properties)
    { id: 0, name: "Mediterranean Ave", setId: 0, price: 100_000 },
    { id: 1, name: "Baltic Ave", setId: 0, price: 100_000 },
    // Set 1: Light Blue (3 properties)
    { id: 2, name: "Oriental Ave", setId: 1, price: 200_000 },
    { id: 3, name: "Vermont Ave", setId: 1, price: 200_000 },
    { id: 4, name: "Connecticut Ave", setId: 1, price: 200_000 },
    // Set 2: Pink (3 properties)
    { id: 5, name: "St. Charles Place", setId: 2, price: 300_000 },
    { id: 6, name: "States Ave", setId: 2, price: 300_000 },
    { id: 7, name: "Virginia Ave", setId: 2, price: 300_000 },
    // Set 3: Orange (3 properties)
    { id: 8, name: "St. James Place", setId: 3, price: 400_000 },
    { id: 9, name: "Tennessee Ave", setId: 3, price: 400_000 },
    { id: 10, name: "New York Ave", setId: 3, price: 400_000 },
    // Set 4: Red (3 properties)
    { id: 11, name: "Kentucky Ave", setId: 4, price: 500_000 },
    { id: 12, name: "Indiana Ave", setId: 4, price: 500_000 },
    { id: 13, name: "Illinois Ave", setId: 4, price: 500_000 },
    // Set 5: Yellow (3 properties)
    { id: 14, name: "Atlantic Ave", setId: 5, price: 600_000 },
    { id: 15, name: "Ventnor Ave", setId: 5, price: 600_000 },
    { id: 16, name: "Marvin Gardens", setId: 5, price: 600_000 },
    // Set 6: Green (3 properties)
    { id: 17, name: "Pacific Ave", setId: 6, price: 700_000 },
    { id: 18, name: "North Carolina Ave", setId: 6, price: 700_000 },
    { id: 19, name: "Pennsylvania Ave", setId: 6, price: 700_000 },
    // Set 7: Dark Blue (2 properties)
    { id: 20, name: "Park Place", setId: 7, price: 800_000 },
    { id: 21, name: "Boardwalk", setId: 7, price: 800_000 },
  ];

  readonly setNames = [
    "Brown",
    "Light Blue",
    "Pink",
    "Orange",
    "Red",
    "Yellow",
    "Green",
    "Dark Blue",
  ];

  constructor() {
    this.rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
    this.tokenMint = new PublicKey(
      process.env.TOKEN_MINT || "743D9e7PCGgh2V3TY2tUeg31e63tmFjJ9rTZJkwhRVLX"
    );
    this.backendUrl = process.env.BACKEND_URL || "http://localhost:3005";
    this.walletsDir = path.join(__dirname, "../wallets");

    // Try to find IDL
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

    // Get program ID from IDL
    const idl = JSON.parse(fs.readFileSync(foundIdl, "utf8"));
    this.programId = new PublicKey(idl.address);
  }

  getPropertyConfig(propertyId: number) {
    return this.propertyConfigs.find((p) => p.id === propertyId);
  }

  getSetProperties(setId: number) {
    return this.propertyConfigs.filter((p) => p.setId === setId);
  }
}