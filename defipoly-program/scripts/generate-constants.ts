// ============================================
// FILE: defipoly-program/scripts/generate-constants.ts
// Generates frontend constants from property-config.ts + deployment-info.json
// UPDATED: Now includes variable set bonuses
// ============================================

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { 
  PROPERTY_CONFIG, 
  SET_BONUSES,
  calculateDailyIncome,
  getSetBonusBps,
  getSetBonusPercent 
} from "./property-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DeploymentInfo {
  programId: string;
  tokenMint: string;
  gameConfig: string;
  rewardPool: string;
  deployedAt: string;
  network: string;
}

// Generate TypeScript constants for frontend
function generateFrontendConstants(deployment: DeploymentInfo): string {
  // Transform property config for frontend
  const frontendProps = PROPERTY_CONFIG.map(prop => {
    const setBonusData = SET_BONUSES[prop.setId as keyof typeof SET_BONUSES];
    return {
      id: prop.id,
      name: prop.name,
      setId: prop.setId,
      tier: prop.tier,
      color: prop.color,
      price: prop.price,
      dailyIncome: calculateDailyIncome(prop.price, prop.yieldBps),
      slotsPerProperty: prop.maxSlots,
      totalSlots: prop.maxSlots,
      maxPerPlayer: prop.maxPerPlayer,
      yieldBps: prop.yieldBps,
      shieldCostBps: prop.shieldCostBps,
      cooldownHours: prop.cooldown,
      roi: Number((10000 / prop.yieldBps).toFixed(1)), // Days to ROI
      setBonusPercent: setBonusData.percent, // NEW: Set bonus percentage (30-50%)
      setBonusBps: setBonusData.bps,         // NEW: Set bonus in basis points
    };
  });

  return `// ============================================
// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Generated from: defipoly-program/scripts/property-config.ts
// Last updated: ${new Date().toISOString()}
// Network: ${deployment.network}
// ============================================

import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey("${deployment.programId}");
export const TOKEN_MINT = new PublicKey("${deployment.tokenMint}");
export const GAME_CONFIG = new PublicKey("${deployment.gameConfig}");
export const REWARD_POOL = new PublicKey("${deployment.rewardPool}");

export const RPC_ENDPOINT = "${deployment.network === 'devnet' ? 
  'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com'}";

// ============================================
// VARIABLE SET BONUSES (30-50%)
// Brown (Set 0) = 30%, Dark Blue (Set 7) = 50%
// ============================================
export const SET_BONUSES = {
  0: { percent: 30.00, bps: 3000 },   // Brown
  1: { percent: 32.86, bps: 3286 },   // Light Blue
  2: { percent: 35.71, bps: 3571 },   // Pink
  3: { percent: 38.57, bps: 3857 },   // Orange
  4: { percent: 41.43, bps: 4143 },   // Red
  5: { percent: 44.29, bps: 4429 },   // Yellow
  6: { percent: 47.14, bps: 4714 },   // Green
  7: { percent: 50.00, bps: 5000 },   // Dark Blue
} as const;

export const SET_BONUS_BPS = {
  0: 3000,   // Brown
  1: 3286,   // Light Blue
  2: 3571,   // Pink
  3: 3857,   // Orange
  4: 4143,   // Red
  5: 4429,   // Yellow
  6: 4714,   // Green
  7: 5000,   // Dark Blue
} as const;

// Helper to get set bonus percentage
export function getSetBonusPercent(setId: number): number {
  return SET_BONUSES[setId as keyof typeof SET_BONUSES]?.percent || 40;
}

// Helper to get set bonus in basis points
export function getSetBonusBps(setId: number): number {
  return SET_BONUS_BPS[setId as keyof typeof SET_BONUS_BPS] || 4000;
}

// Helper to get set name with bonus
export function getSetNameWithBonus(setId: number): string {
  const setNames = [
    "Brown", "Light Blue", "Pink", "Orange",
    "Red", "Yellow", "Green", "Dark Blue"
  ];
  const name = setNames[setId] || "Unknown";
  const bonus = getSetBonusPercent(setId);
  return \`\${name} (+\${bonus.toFixed(1)}%)\`;
}

export const PROPERTIES = ${JSON.stringify(frontendProps, null, 2)};

// Helper to get property by ID
export function getPropertyById(id: number) {
  return PROPERTIES.find(p => p.id === id);
}

// Helper to calculate yield percentage
export function getYieldPercentage(property: typeof PROPERTIES[0]) {
  return (property.yieldBps / 100).toFixed(1);
}

// Helper to get all properties in a set
export function getPropertiesBySet(setId: number) {
  return PROPERTIES.filter(p => p.setId === setId);
}

// Helper to get set name
export function getSetName(setId: number): string {
  const setNames = [
    "Brown",
    "Light Blue", 
    "Pink",
    "Orange",
    "Red",
    "Yellow",
    "Green",
    "Dark Blue"
  ];
  return setNames[setId] || "Unknown";
}

// Helper to get cooldown duration for a set (in hours)
export function getCooldownDurationForSet(setId: number): number {
  const firstPropInSet = PROPERTIES.find(p => p.setId === setId);
  return firstPropInSet?.cooldownHours || 24;
}

// Helper to get set color
export function getSetColor(setId: number): string {
  const firstPropInSet = PROPERTIES.find(p => p.setId === setId);
  return firstPropInSet?.color || "bg-gray-500";
}
`;
}

// Generate JavaScript constants for backend
function generateBackendConstants(): string {
  const backendProps = PROPERTY_CONFIG.map(prop => ({
    id: prop.id,
    setId: prop.setId,
    price: prop.price * 1_000_000_000, // Convert to lamports
    yieldBps: prop.yieldBps,
    cooldownHours: prop.cooldown,
  }));

  return `// ============================================
// AUTO-GENERATED FROM property-config.ts
// SINGLE SOURCE OF TRUTH
// Last updated: ${new Date().toISOString()}
// ============================================

const PROPERTIES = ${JSON.stringify(backendProps, null, 2)};

// UPDATED: Variable set bonuses (basis points)
const SET_BONUS_BPS_BY_SET = {
  0: 3000,  // Brown: 30%
  1: 3286,  // Light Blue: 32.86%
  2: 3571,  // Pink: 35.71%
  3: 3857,  // Orange: 38.57%
  4: 4143,  // Red: 41.43%
  5: 4429,  // Yellow: 44.29%
  6: 4714,  // Green: 47.14%
  7: 5000,  // Dark Blue: 50%
};

// Helper to get set bonus
function getSetBonusBps(setId) {
  return SET_BONUS_BPS_BY_SET[setId] || 4000; // Default 40%
}

const PROPERTY_SETS = {
  0: [0, 1],           // Brown
  1: [2, 3, 4],        // Light Blue
  2: [5, 6, 7],        // Pink
  3: [8, 9, 10],       // Orange
  4: [11, 12, 13],     // Red
  5: [14, 15, 16],     // Yellow
  6: [17, 18, 19],     // Green
  7: [20, 21]          // Dark Blue
};

function getCooldownDurationForSet(setId) {
  const firstProp = PROPERTIES.find(p => p.setId === setId);
  return firstProp ? firstProp.cooldownHours * 3600 : 86400;
}

function getPropertiesInSet(setId) {
  return PROPERTY_SETS[setId] ? PROPERTY_SETS[setId].length : 0;
}

module.exports = {
  PROPERTIES,
  SET_BONUS_BPS_BY_SET,
  getSetBonusBps,
  PROPERTY_SETS,
  getCooldownDurationForSet,
  getPropertiesInSet
};
`;
}

// Main generation function
async function generate() {
  console.log("🔧 Generating frontend and backend constants...\n");

  // Read deployment info
  const deploymentPath = path.join(__dirname, "deployment-info.json");
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ deployment-info.json not found!");
    console.log("   Run 'npm run initialize' first to create it.");
    process.exit(1);
  }

  const deployment: DeploymentInfo = JSON.parse(
    fs.readFileSync(deploymentPath, "utf8")
  );
  
  console.log("📖 Reading from:");
  console.log("   - property-config.ts (property definitions + set bonuses)");
  console.log("   - deployment-info.json (blockchain addresses)");
  console.log("   - target/idl/defipoly_program.json (program IDL)\n");

  // Step 1: Generate frontend constants
  const frontendConstantsContent = generateFrontendConstants(deployment);
  const frontendConstantsPath = path.join(
    __dirname,
    "../../defipoly-frontend/src/utils/constants.ts"
  );
  
  // Ensure directory exists
  const frontendDir = path.dirname(frontendConstantsPath);
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }
  
  fs.writeFileSync(frontendConstantsPath, frontendConstantsContent);
  console.log("✅ Generated frontend constants:", frontendConstantsPath);

  // Step 2: Generate backend constants
  const backendConstantsContent = generateBackendConstants();
  const backendConstantsPath = path.join(
    __dirname,
    "../../src/config/constants.js"
  );
  
  // Ensure directory exists
  const backendDir = path.dirname(backendConstantsPath);
  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }
  
  fs.writeFileSync(backendConstantsPath, backendConstantsContent);
  console.log("✅ Generated backend constants:", backendConstantsPath);

  // Step 3: Copy IDL to frontend (to existing types folder)
  const idlSourcePath = path.join(__dirname, "../target/idl/defipoly_program.json");
  const idlDestPath = path.join(__dirname, "../../defipoly-frontend/src/types/defipoly_program.json");
  
  if (!fs.existsSync(idlSourcePath)) {
    console.warn("⚠️  IDL not found at:", idlSourcePath);
    console.log("   Run 'anchor build' first to generate the IDL.");
  } else {
    // Ensure directory exists
    const idlDir = path.dirname(idlDestPath);
    if (!fs.existsSync(idlDir)) {
      fs.mkdirSync(idlDir, { recursive: true });
    }
    
    fs.copyFileSync(idlSourcePath, idlDestPath);
    console.log("✅ Copied IDL to:", idlDestPath);
  }

  console.log("\n📊 Summary:");
  console.log(`   Total Properties: ${PROPERTY_CONFIG.length}`);
  console.log(`   Network: ${deployment.network}`);
  console.log(`   Program ID: ${deployment.programId}`);
  console.log(`   Token Mint: ${deployment.tokenMint}`);
  console.log(`   Set Bonus Range: 30% (Brown) - 50% (Dark Blue)`);
  console.log(`   Deployed At: ${deployment.deployedAt}`);
  
  console.log("\n🎯 Variable Set Bonuses:");
  console.log("   Brown (Set 0):      30.00%");
  console.log("   Light Blue (Set 1): 32.86%");
  console.log("   Pink (Set 2):       35.71%");
  console.log("   Orange (Set 3):     38.57%");
  console.log("   Red (Set 4):        41.43%");
  console.log("   Yellow (Set 5):     44.29%");
  console.log("   Green (Set 6):      47.14%");
  console.log("   Dark Blue (Set 7):  50.00%");
}

generate()
  .then(() => {
    console.log("\n✅ Constants generation complete!");
    console.log("   Frontend and backend constants are now in sync.");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
  });