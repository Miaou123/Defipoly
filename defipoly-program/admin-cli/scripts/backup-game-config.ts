#!/usr/bin/env node

import { loadProgram } from '../utils/program.js';
import { getGameConfigPDA, getPropertyPDA } from '../utils/pda.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GameConfigBackup {
  timestamp: string;
  gameConfig: any;
  properties: any[];
}

async function backupGameConfig(): Promise<void> {
  console.log('🔄 Backing up current game configuration...');
  
  const ctx = loadProgram();
  const { program } = ctx;
  const programId = program.programId;
  
  try {
    // Get game config
    const gameConfigPDA = getGameConfigPDA(programId);
    console.log('📋 Fetching game config...');
    const gameConfig = await program.account.gameConfig.fetch(gameConfigPDA);
    
    // Get all properties (0-21)
    const properties = [];
    console.log('🏠 Fetching properties...');
    
    for (let i = 0; i <= 21; i++) {
      try {
        const propertyPDA = getPropertyPDA(programId, i);
        const property = await program.account.property.fetch(propertyPDA);
        properties.push({
          id: i,
          ...property
        });
        process.stdout.write(`\r   Property ${i}/21 ✓`);
      } catch (error) {
        console.log(`\n⚠️  Property ${i} not found (not initialized)`);
        properties.push({
          id: i,
          initialized: false
        });
      }
    }
    
    console.log('\n');
    
    const backup: GameConfigBackup = {
      timestamp: new Date().toISOString(),
      gameConfig: {
        authority: gameConfig.authority.toString(),
        devWallet: gameConfig.devWallet.toString(),
        marketingWallet: gameConfig.marketingWallet.toString(),
        tokenMint: gameConfig.tokenMint.toString(),
        rewardPoolVault: gameConfig.rewardPoolVault.toString(),
        totalSupply: gameConfig.totalSupply.toString(),
        circulatingSupply: gameConfig.circulatingSupply.toString(),
        rewardPoolInitial: gameConfig.rewardPoolInitial.toString(),
        currentPhase: gameConfig.currentPhase,
        gamePaused: gameConfig.gamePaused,
        stealChanceTargetedBps: gameConfig.stealChanceTargetedBps,
        stealChanceRandomBps: gameConfig.stealChanceRandomBps,
        stealCostPercentBps: gameConfig.stealCostPercentBps,
        setBonusBps: gameConfig.setBonusBps,
        maxPropertiesPerClaim: gameConfig.maxPropertiesPerClaim,
        minClaimIntervalMinutes: gameConfig.minClaimIntervalMinutes.toString(),
        bump: gameConfig.bump,
        rewardPoolVaultBump: gameConfig.rewardPoolVaultBump
      },
      properties: properties.map(prop => prop.initialized !== false ? {
        id: prop.id,
        propertyId: prop.propertyId,
        setId: prop.setId,
        maxSlotsPerProperty: prop.maxSlotsPerProperty,
        availableSlots: prop.availableSlots,
        maxPerPlayer: prop.maxPerPlayer,
        price: prop.price.toString(),
        yieldPercentBps: prop.yieldPercentBps,
        shieldCostPercentBps: prop.shieldCostPercentBps,
        cooldownSeconds: prop.cooldownSeconds.toString(),
        bump: prop.bump
      } : prop)
    };
    
    // Save backup
    const filename = `game-config-backup-${Date.now()}.json`;
    const backupsDir = path.join(__dirname, '../backups');
    const filepath = path.join(backupsDir, filename);
    
    // Create backups directory if it doesn't exist
    try {
      await fs.mkdir(backupsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    await fs.writeFile(filepath, JSON.stringify(backup, null, 2));
    
    console.log('✅ Backup completed!');
    console.log(`📁 Saved to: ${filepath}`);
    console.log(`📊 Game Config:`);
    console.log(`   Phase: ${backup.gameConfig.currentPhase}`);
    console.log(`   Paused: ${backup.gameConfig.gamePaused}`);
    console.log(`   Steal Chances: ${backup.gameConfig.stealChanceTargetedBps}bps (targeted), ${backup.gameConfig.stealChanceRandomBps}bps (random)`);
    console.log(`   Properties initialized: ${properties.filter(p => p.initialized !== false).length}/22`);
    
  } catch (error: any) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  backupGameConfig().catch(console.error);
}

export { backupGameConfig };