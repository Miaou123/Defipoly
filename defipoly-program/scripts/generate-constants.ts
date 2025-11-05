// ============================================
// SIMPLE generate-constants.ts
// Just exports property-config.ts to frontend and backend
// ============================================

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
import { PROPERTY_CONFIG, SET_BONUSES } from "./property-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from monorepo root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

interface DeploymentInfo {
  programId: string;      // From: target/idl/defipoly_program.json (which gets it from Anchor.toml)
  tokenMint: string;      // From: initialize-game.ts (created when game is initialized)
  gameConfig: string;     // From: initialize-game.ts (PDA: seeds ["game_config"])
  rewardPoolVault: string; // From: initialize-game.ts (PDA for reward pool vault)
  rewardPool: string;     // From: initialize-game.ts (token account created during init)
  deployedAt: string;     // Timestamp when game was initialized
  network: string;        // "devnet" or "mainnet"
}

/**
 * Generate Frontend Constants (TypeScript)
 */
function generateFrontendConstants(deployment: DeploymentInfo): string {
  return `// ============================================
// AUTO-GENERATED - DO NOT EDIT
// Source: defipoly-program/scripts/property-config.ts
// Generated: ${new Date().toISOString()}
// ============================================

import { PublicKey } from "@solana/web3.js";

// ========================================
// BLOCKCHAIN ADDRESSES
// ========================================
// These come from deployment-info.json which is created by initialize-game.ts

export const PROGRAM_ID = new PublicKey("${deployment.programId}");
export const TOKEN_MINT = new PublicKey("${deployment.tokenMint}");
export const GAME_CONFIG = new PublicKey("${deployment.gameConfig}");
export const REWARD_POOL_VAULT = new PublicKey("${deployment.rewardPoolVault || deployment.gameConfig}");
export const REWARD_POOL = new PublicKey("${deployment.rewardPool}");
export const NETWORK = "${deployment.network}";

// ========================================
// PROPERTIES
// ========================================
// Exact copy from property-config.ts

export const PROPERTIES = ${JSON.stringify(PROPERTY_CONFIG, null, 2)};

// ========================================
// SET BONUSES
// ========================================
// Exact copy from property-config.ts

export const SET_BONUSES = ${JSON.stringify(SET_BONUSES, null, 2)};

// ========================================
// HELPER FUNCTIONS
// ========================================

export function getPropertyById(id: number) {
  return PROPERTIES.find(p => p.id === id);
}

export function getPropertiesBySetId(setId: number) {
  return PROPERTIES.filter(p => p.setId === setId);
}

export function getSetBonus(setId: number) {
  return SET_BONUSES[setId as keyof typeof SET_BONUSES];
}
`;
}

/**
 * Generate Backend Constants (JavaScript)
 * FIXED: Now includes blockchain addresses!
 */
function generateBackendConstants(deployment: DeploymentInfo): string {
  return `// ============================================
// AUTO-GENERATED - DO NOT EDIT
// Source: defipoly-program/scripts/property-config.ts
// Generated: ${new Date().toISOString()}
// ============================================

// ========================================
// BLOCKCHAIN ADDRESSES
// ========================================
// These come from deployment-info.json which is created by initialize-game.ts

const PROGRAM_ID = '${deployment.programId}';
const TOKEN_MINT = '${deployment.tokenMint}';
const GAME_CONFIG = '${deployment.gameConfig}';
const REWARD_POOL_VAULT = '${deployment.rewardPoolVault || deployment.gameConfig}';
const REWARD_POOL = '${deployment.rewardPool}';
const NETWORK = '${deployment.network}';

// ========================================
// PROPERTIES
// ========================================
// Exact copy from property-config.ts

const PROPERTIES = ${JSON.stringify(PROPERTY_CONFIG, null, 2)};

// ========================================
// SET BONUSES
// ========================================
// Exact copy from property-config.ts

const SET_BONUSES = ${JSON.stringify(SET_BONUSES, null, 2)};

// ========================================
// HELPER FUNCTIONS
// ========================================

function getPropertyById(id) {
  return PROPERTIES.find(p => p.id === id);
}

function getPropertiesBySetId(setId) {
  return PROPERTIES.filter(p => p.setId === setId);
}

function getSetBonus(setId) {
  return SET_BONUSES[setId];
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Blockchain addresses
  PROGRAM_ID,
  TOKEN_MINT,
  GAME_CONFIG,
  REWARD_POOL_VAULT,
  REWARD_POOL,
  NETWORK,
  
  // Properties
  PROPERTIES,
  SET_BONUSES,
  getPropertyById,
  getPropertiesBySetId,
  getSetBonus
};
`;
}

/**
 * Main function
 */
async function generate() {
  console.log("🔧 Exporting constants to frontend and backend...\n");

  // ========================================
  // STEP 1: Read deployment-info.json
  // ========================================
  // This file is created by initialize-game.ts and contains:
  // - programId: From Anchor.toml (your deployed program address)
  // - tokenMint: Created when game is initialized (your game token)
  // - gameConfig: PDA created during initialization
  // - rewardPool: Token account for rewards
  
  const deploymentPath = path.join(__dirname, "deployment-info.json");
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ deployment-info.json not found!");
    console.log("   This file is created by 'npm run initialize'");
    console.log("   Run the full deployment first: npm run deploy:full");
    process.exit(1);
  }

  const deployment: DeploymentInfo = JSON.parse(
    fs.readFileSync(deploymentPath, "utf8")
  );

  console.log("📖 Reading from:");
  console.log("   ✓ property-config.ts (your property definitions)");
  console.log("   ✓ deployment-info.json (blockchain addresses)");
  console.log("   ✓ target/idl/defipoly_program.json (program IDL)\n");

  console.log("📍 Blockchain Addresses:");
  console.log(`   Program ID:  ${deployment.programId}`);
  console.log(`   Token Mint:  ${deployment.tokenMint}`);
  console.log(`   Game Config: ${deployment.gameConfig}`);
  console.log(`   Reward Pool: ${deployment.rewardPool}`);
  console.log(`   Network:     ${deployment.network}\n`);

  // ========================================
  // STEP 2: Export to Frontend (TypeScript)
  // ========================================
  
  console.log("1️⃣  Exporting to frontend...");
  const frontendContent = generateFrontendConstants(deployment);
  const frontendPath = path.join(__dirname, "../../defipoly-frontend/src/utils/constants.ts");
  
  fs.mkdirSync(path.dirname(frontendPath), { recursive: true });
  fs.writeFileSync(frontendPath, frontendContent);
  console.log("   ✅ defipoly-frontend/src/utils/constants.ts");

  // ========================================
  // STEP 3: Export to Backend (JavaScript)
  // ========================================
  
  console.log("\n2️⃣  Exporting to backend...");
  const backendContent = generateBackendConstants(deployment); // ← FIXED: Now passes deployment!
  const backendPath = path.join(__dirname, "../../defipoly-backend/src/config/constants.js");
  
  fs.mkdirSync(path.dirname(backendPath), { recursive: true });
  fs.writeFileSync(backendPath, backendContent);
  console.log("   ✅ defipoly-backend/src/config/constants.js");

  // ========================================
  // STEP 4: Copy IDL to Frontend
  // ========================================
  // The IDL (Interface Definition Language) is generated by 'anchor build'
  // It contains all the program's instructions and account structures
  // Frontend needs this to interact with your Solana program
  
  console.log("\n3️⃣  Copying IDL to frontend...");
  const idlSource = path.join(__dirname, "../target/idl/defipoly_program.json");
  const idlDest = path.join(__dirname, "../../defipoly-frontend/src/types/defipoly_program.json");
  
  if (!fs.existsSync(idlSource)) {
    console.warn("   ⚠️  IDL not found at target/idl/defipoly_program.json");
    console.warn("   Run 'anchor build' to generate it");
  } else {
    fs.mkdirSync(path.dirname(idlDest), { recursive: true });
    fs.copyFileSync(idlSource, idlDest);
    console.log("   ✅ defipoly-frontend/src/types/defipoly_program.json");
  }

  // ========================================
  // Summary
  // ========================================
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ EXPORT COMPLETE");
  console.log("=".repeat(60));
  console.log(`\n📊 Exported:`);
  console.log(`   Properties:  ${PROPERTY_CONFIG.length}`);
  console.log(`   Set Bonuses: ${Object.keys(SET_BONUSES).length}`);
  console.log(`   Network:     ${deployment.network}`);
  console.log(`\n💡 What was exported:`);
  console.log(`   ✓ PROPERTIES array (from property-config.ts)`);
  console.log(`   ✓ SET_BONUSES object (from property-config.ts)`);
  console.log(`   ✓ Blockchain addresses (from deployment-info.json)`);
  console.log(`   ✓ Program IDL (from target/idl/)`);
  console.log(`\n🎯 Next steps:`);
  console.log(`   - Frontend: npm run dev`);
  console.log(`   - Backend:  npm start`);
  console.log(`   - Test:     npm run bot\n`);
}

generate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });