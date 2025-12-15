// ============================================
// UPDATED generate-constants.ts
// ADDED: DEV_WALLET and MARKETING_WALLET exports
// ============================================

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
import { PROPERTY_CONFIG, SET_BONUSES } from "./property-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// ========================================
// WALLET ADDRESSES (Match program constants)
// ========================================
const DEV_WALLET = process.env.DEV_WALLET || "CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS";
const MARKETING_WALLET = process.env.MARKETING_WALLET || "FoPKSQ5HDSVyZgaQobX64YEBVQ2iiKMZp8VHWtd6jLQE";

interface DeploymentInfo {
  programId: string;
  tokenMint: string;
  gameConfig: string;
  rewardPoolVault: string;
  rewardPool: string;
  deployedAt: string;
  network: string;
}

// ========================================
// TOKEN DISPLAY
// ========================================
const TOKEN_TICKER = "DEFI";

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
export const REWARD_POOL = REWARD_POOL_VAULT; // ✅ FIXED: Use vault address, not numeric amount
export const NETWORK = "${deployment.network}";
export const TOKEN_TICKER = "${TOKEN_TICKER}";

// ========================================
// WALLET ADDRESSES
// ========================================
// These match the hardcoded addresses in the Solana program

export const DEV_WALLET = new PublicKey("${DEV_WALLET}");
export const MARKETING_WALLET = new PublicKey("${MARKETING_WALLET}");

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
  return SET_BONUSES[String(setId) as keyof typeof SET_BONUSES];
}
`;
}

/**
 * Generate Backend Constants (JavaScript)
 * Includes only what the backend actually needs - no blockchain addresses
 */
function generateBackendConstants(): string {
  // Derive PROPERTY_SETS from PROPERTIES
  const propertySets: { [key: number]: number[] } = {};
  PROPERTY_CONFIG.forEach(prop => {
    if (!propertySets[prop.setId]) {
      propertySets[prop.setId] = [];
    }
    propertySets[prop.setId].push(prop.id);
  });

  return `// ============================================
// AUTO-GENERATED - DO NOT EDIT
// Source: defipoly-program/scripts/property-config.ts
// Generated: ${new Date().toISOString()}
// ============================================
// 
// This file contains game configuration data only.
// Blockchain addresses (PROGRAM_ID, etc.) are read from the IDL file.
//
// ============================================

// ========================================
// WALLET ADDRESSES
// ========================================
// These match the hardcoded addresses in the Solana program

const DEV_WALLET = "${DEV_WALLET}";
const MARKETING_WALLET = "${MARKETING_WALLET}";

// ========================================
// PROPERTIES
// ========================================

const PROPERTIES = ${JSON.stringify(PROPERTY_CONFIG, null, 2)};

// ========================================
// SET BONUSES
// ========================================

const SET_BONUSES = ${JSON.stringify(SET_BONUSES, null, 2)};

// ========================================
// DERIVED DATA
// ========================================
// Property IDs grouped by setId for cooldown checks

const PROPERTY_SETS = ${JSON.stringify(propertySets, null, 2)};

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

function getSetBonusBps(setId) {
  return SET_BONUSES[setId]?.bps || 4000;
}

function getCooldownDurationForSet(setId) {
  // Return cooldown in seconds - gets it from first property in set
  const property = PROPERTIES.find(p => p.setId === setId);
  return property ? property.cooldown * 3600 : 86400; // hours to seconds, default 24h
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Wallet addresses
  DEV_WALLET,
  MARKETING_WALLET,
  
  // Game data
  PROPERTIES,
  SET_BONUSES,
  PROPERTY_SETS,
  
  // Helper functions
  getPropertyById,
  getPropertiesBySetId,
  getSetBonus,
  getSetBonusBps,
  getCooldownDurationForSet
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
  console.log(`   Reward Pool Vault: ${deployment.rewardPoolVault}`);
  console.log(`   Initial Reward Amount: ${deployment.rewardPool} lamports`);
  console.log(`   Network:     ${deployment.network}`);
  
  console.log("\n💼 Wallet Addresses:");
  console.log(`   Dev Wallet:       ${DEV_WALLET}`);
  console.log(`   Marketing Wallet: ${MARKETING_WALLET}\n`);

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
  const backendContent = generateBackendConstants();
  const backendPath = path.join(__dirname, "../../defipoly-backend/src/config/constants.js");
  
  fs.mkdirSync(path.dirname(backendPath), { recursive: true });
  fs.writeFileSync(backendPath, backendContent);
  console.log("   ✅ defipoly-backend/src/config/constants.js");

  // ========================================
  // STEP 4: Copy IDL to Backend
  // ========================================
  
  console.log("\n3️⃣  Copying IDL to backend...");
  const idlSource = path.join(__dirname, "../target/idl/defipoly_program.json");
  const idlDestBackend = path.join(__dirname, "../../defipoly-backend/src/idl/defipoly_program.json");
  
  if (!fs.existsSync(idlSource)) {
    console.warn("   ⚠️  IDL not found at target/idl/defipoly_program.json");
    console.warn("   Run 'anchor build' to generate it");
  } else {
    fs.mkdirSync(path.dirname(idlDestBackend), { recursive: true });
    fs.copyFileSync(idlSource, idlDestBackend);
    console.log("   ✅ defipoly-backend/src/idl/defipoly_program.json");
  }

  // ========================================
  // STEP 5: Copy IDL to Frontend
  // ========================================
  
  console.log("\n4️⃣  Copying IDL to frontend...");
  const idlDestFrontend = path.join(__dirname, "../../defipoly-frontend/src/idl/defipoly_program.json");
  
  if (fs.existsSync(idlSource)) {
    fs.mkdirSync(path.dirname(idlDestFrontend), { recursive: true });
    fs.copyFileSync(idlSource, idlDestFrontend);
    console.log("   ✅ defipoly-frontend/src/idl/defipoly_program.json");
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
  console.log(`   ✓ Frontend: Full constants + blockchain addresses + wallet addresses`);
  console.log(`   ✓ Backend: Game constants + wallet addresses (PROGRAM_ID from IDL)`);
  console.log(`   ✓ Backend: Helper functions (getSetBonusBps, getCooldownDurationForSet, etc.)`);
  console.log(`   ✓ Backend: IDL file (PROGRAM_ID read from here)`);
  console.log(`   ✓ Frontend: IDL file`);
  console.log(`\n🎯 Next steps:`);
  console.log(`   - Remove DEV_WALLET/MARKETING_WALLET from your .env file (not needed anymore)`);
  console.log(`   - Update your action files to import from constants:`);
  console.log(`     import { DEV_WALLET, MARKETING_WALLET } from '@/utils/constants';`);
  console.log(`   - Restart frontend: npm run dev`);
  console.log(`   - Restart backend:  npm start\n`);
}

generate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });