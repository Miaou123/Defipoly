#!/usr/bin/env node
// ============================================
// FILE: setup-full.js
// Complete backend initialization - ONE COMMAND
// Syncs blockchain + backfills history + verifies
// ============================================

const { execSync } = require('child_process');
const path = require('path');

const scripts = [
  {
    name: 'Blockchain Sync',
    command: 'node src/scripts/sync-blockchain-data.js',
    description: 'Syncing all blockchain accounts (properties, ownerships, cooldowns)'
  },
  {
    name: 'Transaction Backfill',
    command: 'node src/scripts/backfill-all-transactions.js',
    description: 'Backfilling historical transaction data'
  },
  {
    name: 'Verification',
    command: 'node verify-complete-sync.js',
    description: 'Verifying 100% sync accuracy'
  }
];

async function runSetup() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 DEFIPOLY BACKEND - FULL INITIALIZATION');
  console.log('='.repeat(70) + '\n');
  console.log('This will:');
  console.log('  1️⃣  Sync ALL blockchain accounts to database');
  console.log('  2️⃣  Backfill ALL historical transactions');
  console.log('  3️⃣  Verify 100% data accuracy\n');
  console.log('⏱️  Estimated time: 5-15 minutes (depends on transaction count)\n');
  console.log('='.repeat(70) + '\n');

  const startTime = Date.now();

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    console.log(`\n${'▶'.repeat(3)} STEP ${i + 1}/${scripts.length}: ${script.name}`);
    console.log(`📝 ${script.description}\n`);

    try {
      execSync(script.command, { 
        stdio: 'inherit',
        cwd: __dirname 
      });
      console.log(`\n✅ Step ${i + 1} complete!\n`);
    } catch (error) {
      console.error(`\n❌ Step ${i + 1} failed!`);
      console.error(`Error: ${error.message}\n`);
      process.exit(1);
    }
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

  console.log('\n' + '='.repeat(70));
  console.log('🎉 SETUP COMPLETE!');
  console.log('='.repeat(70));
  console.log(`⏱️  Total time: ${duration} minutes\n`);
  console.log('✅ Your backend is now fully initialized and ready!\n');
  console.log('Next steps:');
  console.log('  • Start server:        npm run dev');
  console.log('  • Start periodic sync: npm run periodic-sync');
  console.log('  • Or use PM2:          pm2 start ecosystem.config.js\n');
  console.log('='.repeat(70) + '\n');
}

runSetup().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});