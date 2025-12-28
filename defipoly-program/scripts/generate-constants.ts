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
// WALLET ADDRESSES (Parsed from lib.rs - single source of truth)
// ========================================

/**
 * Parse wallet addresses from lib.rs to ensure consistency
 */
function parseWalletAddressesFromLibRs(): { devWallet: string; marketingWallet: string } {
  const libRsPath = path.join(__dirname, "../programs/defipoly-program/src/lib.rs");
  
  if (!fs.existsSync(libRsPath)) {
    throw new Error(`lib.rs not found at ${libRsPath}`);
  }
  
  const libRsContent = fs.readFileSync(libRsPath, "utf8");
  
  // Extract DEV_WALLET constant
  const devWalletMatch = libRsContent.match(/const\s+DEV_WALLET:\s*&str\s*=\s*"([^"]+)"/);
  if (!devWalletMatch) {
    throw new Error("DEV_WALLET constant not found in lib.rs");
  }
  
  // Extract MARKETING_WALLET constant
  const marketingWalletMatch = libRsContent.match(/const\s+MARKETING_WALLET:\s*&str\s*=\s*"([^"]+)"/);
  if (!marketingWalletMatch) {
    throw new Error("MARKETING_WALLET constant not found in lib.rs");
  }
  
  return {
    devWallet: devWalletMatch[1],
    marketingWallet: marketingWalletMatch[1],
  };
}

// Parse wallet addresses from lib.rs (single source of truth)
const { devWallet: DEV_WALLET, marketingWallet: MARKETING_WALLET } = parseWalletAddressesFromLibRs();

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
 * Generate Bot Constants (TypeScript)
 * Includes blockchain addresses and configuration needed for bots
 */
function generateBotConstants(deployment: DeploymentInfo): string {
  return `// ============================================
// AUTO-GENERATED BOT CONSTANTS
// Source: defipoly-program deployment
// Generated: ${new Date().toISOString()}
// ============================================

import { PublicKey } from "@solana/web3.js";

// Blockchain Configuration
export const PROGRAM_ID = new PublicKey("${deployment.programId}");
export const TOKEN_MINT = new PublicKey("${deployment.tokenMint}");
export const GAME_CONFIG = new PublicKey("${deployment.gameConfig}");
export const REWARD_POOL_VAULT = new PublicKey("${deployment.rewardPoolVault || deployment.gameConfig}");
export const NETWORK = "${deployment.network}";
export const TOKEN_TICKER = "${TOKEN_TICKER}";

// Blockchain addresses as strings (for compatibility)
export const PROGRAM_ID_STRING = "${deployment.programId}";
export const TOKEN_MINT_STRING = "${deployment.tokenMint}";
export const GAME_CONFIG_STRING = "${deployment.gameConfig}";
export const REWARD_POOL_VAULT_STRING = "${deployment.rewardPoolVault || deployment.gameConfig}";

// Wallet Addresses
export const DEV_WALLET = new PublicKey("${DEV_WALLET}");
export const MARKETING_WALLET = new PublicKey("${MARKETING_WALLET}");

// RPC Configuration (can be overridden by environment variables)
export const RPC_ENDPOINT = process.env.RPC_URL || process.env.ANCHOR_PROVIDER_URL || "https://api.${deployment.network}.solana.com";
export const RPC_WEBSOCKET = process.env.RPC_WEBSOCKET || "wss://api.${deployment.network}.solana.com";

// Bot Configuration Defaults
export const BOT_CHECK_INTERVAL = parseInt(process.env.BOT_CHECK_INTERVAL || "30000"); // 30 seconds default
export const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || "3");
export const RETRY_DELAY = parseInt(process.env.RETRY_DELAY || "5000"); // 5 seconds

// Transaction Configuration
export const COMPUTE_UNITS = parseInt(process.env.COMPUTE_UNITS || "200000");
export const PRIORITY_FEE_LAMPORTS = parseInt(process.env.PRIORITY_FEE_LAMPORTS || "1000");

// Game Constants
export const MAX_PROPERTIES = 28;
export const CLAIM_INTERVAL_SECONDS = 300; // 5 minutes
export const STEAL_INTERVAL_SECONDS = 600; // 10 minutes

// Property Configuration with full data
export const PROPERTIES = ${JSON.stringify(PROPERTY_CONFIG, null, 2)};

// Set Bonuses
export const SET_BONUSES = ${JSON.stringify(SET_BONUSES, null, 2)};

// Set Names
export const SET_NAMES = [
  "Brown",
  "Light Blue", 
  "Pink",
  "Orange",
  "Red",
  "Yellow",
  "Green",
  "Dark Blue",
];

// Export all addresses as an object
export const ADDRESSES = {
  programId: PROGRAM_ID,
  tokenMint: TOKEN_MINT,
  gameConfig: GAME_CONFIG,
  rewardPoolVault: REWARD_POOL_VAULT,
  devWallet: DEV_WALLET,
  marketingWallet: MARKETING_WALLET,
};

// Property helpers
export function getPropertyById(id: number) {
  return PROPERTIES.find(p => p.id === id);
}

export function getPropertiesBySetId(setId: number) {
  return PROPERTIES.filter(p => p.setId === setId);
}

export function getSetBonus(setId: number) {
  return SET_BONUSES[String(setId) as keyof typeof SET_BONUSES];
}

export function getPropertyConfig(propertyId: number) {
  return PROPERTIES.find((p) => p.id === propertyId);
}

export function getSetProperties(setId: number) {
  return PROPERTIES.filter((p) => p.setId === setId);
}
`;
}

/**
 * Generate Backend Constants (JavaScript)
 * Includes only what the backend actually needs - no blockchain addresses
 */
function generateBackendConstants(deployment: DeploymentInfo): string {
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
// BLOCKCHAIN ADDRESSES
// ========================================
const TOKEN_MINT = "${deployment.tokenMint}";

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
  // Blockchain addresses
  TOKEN_MINT,
  
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
  console.log("   ✓ target/idl/defipoly_program.json (program IDL)");
  console.log("   ✓ programs/defipoly-program/src/lib.rs (wallet addresses)\n");

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
  const backendContent = generateBackendConstants(deployment);
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
  // STEP 6: Export to Bots (JavaScript/ES6)
  // ========================================
  
  console.log("\n5️⃣  Exporting to bots...");
  const botContent = generateBotConstants(deployment);
  const botPath = path.join(__dirname, "../../defipoly-bots/src/constants.ts");
  
  fs.mkdirSync(path.dirname(botPath), { recursive: true });
  fs.writeFileSync(botPath, botContent);
  console.log("   ✅ defipoly-bots/src/constants.ts");

  // Also generate a .env.example for the bots
  const envExample = `# Solana RPC Configuration
RPC_URL=https://api.${deployment.network}.solana.com
RPC_WEBSOCKET=wss://api.${deployment.network}.solana.com

# Bot Configuration
BOT_CHECK_INTERVAL=30000
MAX_RETRIES=3
RETRY_DELAY=5000

# Transaction Configuration
COMPUTE_UNITS=200000
PRIORITY_FEE_LAMPORTS=1000

# Current Deployment (auto-generated)
# These are already in src/constants.js, but you can override them here if needed
PROGRAM_ID=${deployment.programId}
TOKEN_MINT=${deployment.tokenMint}
GAME_CONFIG=${deployment.gameConfig}
REWARD_POOL_VAULT=${deployment.rewardPoolVault || deployment.gameConfig}
NETWORK=${deployment.network}
`;

  const envExamplePath = path.join(__dirname, "../../defipoly-bots/.env.example");
  fs.writeFileSync(envExamplePath, envExample);
  console.log("   ✅ defipoly-bots/.env.example");

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
  console.log(`   ✓ Bots: Full blockchain addresses + game constants + configuration`);
  console.log(`   ✓ Bots: .env.example file with current deployment info`);
  console.log(`\n🎯 Next steps:`);
  console.log(`   - Remove DEV_WALLET/MARKETING_WALLET from your .env file (not needed anymore)`);
  console.log(`   - Update your action files to import from constants:`);
  console.log(`     import { DEV_WALLET, MARKETING_WALLET } from '@/utils/constants';`);
  console.log(`   - Restart frontend: npm run dev`);
  console.log(`   - Restart backend:  npm start`);
  console.log(`   - Bots can now import: import { PROGRAM_ID, TOKEN_MINT, etc } from './constants.js';\n`);
}

generate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });