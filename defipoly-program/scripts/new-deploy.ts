#!/usr/bin/env tsx
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Keypair } from '@solana/web3.js';

console.log("🚀 Starting fresh deployment process...\n");

// Step 1: Generate new program keypair
console.log("1️⃣  Generating new program keypair...");
const programKeypair = Keypair.generate();
const programId = programKeypair.publicKey.toString();
console.log(`   New Program ID: ${programId}`);

// Save the keypair to a file
const keypairPath = path.join(__dirname, '../target/deploy/defipoly_program-keypair.json');
fs.mkdirSync(path.dirname(keypairPath), { recursive: true });
fs.writeFileSync(keypairPath, `[${programKeypair.secretKey.toString()}]`);
console.log(`   Keypair saved to: ${keypairPath}`);

// Step 2: Update Anchor.toml with new program ID
console.log("\n2️⃣  Updating Anchor.toml...");
const anchorTomlPath = path.join(__dirname, '../Anchor.toml');
let anchorToml = fs.readFileSync(anchorTomlPath, 'utf-8');
anchorToml = anchorToml.replace(/defipoly_program = ".*"/, `defipoly_program = "${programId}"`);
fs.writeFileSync(anchorTomlPath, anchorToml);
console.log(`   ✅ Updated Anchor.toml with new program ID`);

// Step 3: Update lib.rs with new program ID
console.log("\n3️⃣  Updating lib.rs...");
const libRsPath = path.join(__dirname, '../programs/defipoly-program/src/lib.rs');
let libRs = fs.readFileSync(libRsPath, 'utf-8');
libRs = libRs.replace(/declare_id!\(".*"\);/, `declare_id!("${programId}");`);
fs.writeFileSync(libRsPath, libRs);
console.log(`   ✅ Updated lib.rs with new program ID`);

// Step 4: Build the program
console.log("\n4️⃣  Building program...");
try {
  execSync('anchor build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log(`   ✅ Build successful`);
} catch (error) {
  console.error(`   ❌ Build failed:`, error);
  process.exit(1);
}

// Step 5: Deploy the program
console.log("\n5️⃣  Deploying program...");
try {
  execSync(`anchor deploy --program-keypair ${keypairPath}`, { 
    stdio: 'inherit', 
    cwd: path.join(__dirname, '..') 
  });
  console.log(`   ✅ Deployment successful`);
} catch (error) {
  console.error(`   ❌ Deployment failed:`, error);
  process.exit(1);
}

// Step 6: Run initialize
console.log("\n6️⃣  Initializing game...");
try {
  execSync('npm run initialize', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log(`   ✅ Game initialized`);
} catch (error) {
  console.error(`   ❌ Initialization failed:`, error);
  process.exit(1);
}

// Step 7: Generate constants
console.log("\n7️⃣  Generating constants...");
try {
  execSync('npm run generate:constants', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log(`   ✅ Constants generated`);
} catch (error) {
  console.error(`   ❌ Constants generation failed:`, error);
  process.exit(1);
}

console.log("\n✅ Fresh deployment complete!");
console.log(`\n📋 New Program ID: ${programId}`);
console.log(`\n🎮 Your game is ready to use with the new program!`);