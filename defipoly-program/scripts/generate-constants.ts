// ============================================
// FILE: defipoly-program/scripts/generate-constants.ts
// Generates frontend constants from property-config.ts + deployment-info.json
// ============================================

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { PROPERTY_CONFIG, calculateDailyIncome } from "./property-config.js";

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
  const frontendProps = PROPERTY_CONFIG.map(prop => ({
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
  }));

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

export const RPC_ENDPOINT = "${deployment.network === 'devnet' ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com'}";

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

// Main generation function
async function generate() {
  console.log("🔧 Generating frontend constants and IDL...\n");

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
  console.log("   - property-config.ts (property definitions)");
  console.log("   - deployment-info.json (blockchain addresses)");
  console.log("   - target/idl/defipoly_program.json (program IDL)\n");

  // Step 1: Generate frontend constants
  const constantsContent = generateFrontendConstants(deployment);
  const frontendConstantsPath = path.join(
    __dirname,
    "../../defipoly-frontend/src/utils/constants.ts"
  );
  fs.writeFileSync(frontendConstantsPath, constantsContent);
  console.log("✅ Generated constants:", frontendConstantsPath);

  // Step 2: Copy IDL to frontend (to existing types folder)
  const idlSourcePath = path.join(__dirname, "../target/idl/defipoly_program.json");
  const idlDestPath = path.join(__dirname, "../../defipoly-frontend/src/types/defipoly_program.json");
  
  if (!fs.existsSync(idlSourcePath)) {
    console.error("❌ IDL not found at:", idlSourcePath);
    console.log("   Run 'anchor build' first to generate the IDL.");
    process.exit(1);
  }

  fs.copyFileSync(idlSourcePath, idlDestPath);
  console.log("✅ Copied IDL to:", idlDestPath);

  console.log("\n📊 Summary:");
  console.log(`   Total Properties: ${PROPERTY_CONFIG.length}`);
  console.log(`   Network: ${deployment.network}`);
  console.log(`   Program ID: ${deployment.programId}`);
  console.log(`   Token Mint: ${deployment.tokenMint}`);
  console.log(`   Deployed At: ${deployment.deployedAt}`);
}

generate()
  .then(() => {
    console.log("\n✅ Constants generation complete!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
  });