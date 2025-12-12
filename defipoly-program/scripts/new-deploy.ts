#!/usr/bin/env tsx
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Keypair } from '@solana/web3.js';
import * as readline from 'readline';

async function main() {
  console.log("🚀 Starting fresh deployment process...\n");

  const backendDir = path.resolve(import.meta.dirname, '../../defipoly-backend');

  // Step 1: Reset database
  console.log("1️⃣  Resetting database...");
  console.log("   ⚠️  WARNING: This will DELETE all data in the database!");
  
  const response = process.env.SKIP_DB_RESET ? 'y' : await new Promise<string>((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question("   Continue? (y/N): ", (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });

  if (response === 'y') {
    try {
      const dbPath = path.join(backendDir, 'defipoly.db');
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log(`   ✅ Database reset successfully`);
      } else {
        console.log(`   ℹ️  No database file found (fresh start)`);
      }
    } catch (error) {
      console.error(`   ❌ Database reset failed:`, error);
      console.log(`   ℹ️  Continuing without database reset...`);
    }
  } else {
    console.log("   ⏭️  Skipping database reset");
  }

  // Step 2: Generate new program keypair
  console.log("\n2️⃣  Generating new program keypair...");
  const programKeypair = Keypair.generate();
  const programId = programKeypair.publicKey.toString();
  console.log(`   New Program ID: ${programId}`);

  // Save the keypair to a file
  const keypairPath = path.join(import.meta.dirname, '../target/deploy/defipoly_program-keypair.json');
  fs.mkdirSync(path.dirname(keypairPath), { recursive: true });
  fs.writeFileSync(keypairPath, `[${programKeypair.secretKey.toString()}]`);
  console.log(`   Keypair saved to: ${keypairPath}`);

  // Step 3: Update Anchor.toml with new program ID
  console.log("\n3️⃣  Updating Anchor.toml...");
  const anchorTomlPath = path.join(import.meta.dirname, '../Anchor.toml');
  let anchorToml = fs.readFileSync(anchorTomlPath, 'utf-8');
  anchorToml = anchorToml.replace(/defipoly_program = ".*"/, `defipoly_program = "${programId}"`);
  fs.writeFileSync(anchorTomlPath, anchorToml);
  console.log(`   ✅ Updated Anchor.toml with new program ID`);

  // Step 4: Update lib.rs with new program ID
  console.log("\n4️⃣  Updating lib.rs...");
  const libRsPath = path.join(import.meta.dirname, '../programs/defipoly-program/src/lib.rs');
  let libRs = fs.readFileSync(libRsPath, 'utf-8');
  libRs = libRs.replace(/declare_id!\(".*"\);/, `declare_id!("${programId}");`);
  fs.writeFileSync(libRsPath, libRs);
  console.log(`   ✅ Updated lib.rs with new program ID`);

  // Step 5: Build the program
  console.log("\n5️⃣  Building program...");
  try {
    execSync('anchor build', { stdio: 'inherit', cwd: path.join(import.meta.dirname, '..') });
    console.log(`   ✅ Build successful`);
  } catch (error) {
    console.error(`   ❌ Build failed:`, error);
    process.exit(1);
  }

  // Step 6: Deploy the program
  console.log("\n6️⃣  Deploying program...");
  try {
    execSync(`anchor deploy --program-name defipoly_program --program-keypair ${keypairPath}`, { 
      stdio: 'inherit', 
      cwd: path.join(import.meta.dirname, '..') 
    });
    console.log(`   ✅ Deployment successful`);
  } catch (error) {
    console.error(`   ❌ Deployment failed:`, error);
    process.exit(1);
  }

  // Step 7: Run initialize
  console.log("\n7️⃣  Initializing game...");
  try {
    execSync('npm run initialize', { stdio: 'inherit', cwd: path.join(import.meta.dirname, '..') });
    console.log(`   ✅ Game initialized`);
  } catch (error) {
    console.error(`   ❌ Initialization failed:`, error);
    process.exit(1);
  }

  // Step 8: Generate constants
  console.log("\n8️⃣  Generating constants...");
  try {
    execSync('npm run generate:constants', { stdio: 'inherit', cwd: path.join(import.meta.dirname, '..') });
    console.log(`   ✅ Constants generated`);
  } catch (error) {
    console.error(`   ❌ Constants generation failed:`, error);
    process.exit(1);
  }

  console.log("\n✅ Fresh deployment complete!");
  console.log(`\n📋 New Program ID: ${programId}`);
  console.log(`\n🎮 Your game is ready to use with the new program!`);
}

main().catch(console.error);