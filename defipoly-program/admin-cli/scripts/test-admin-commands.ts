#!/usr/bin/env node

import { loadProgram } from '../utils/program.js';
import { backupGameConfig } from './backup-game-config.js';
import {
  UpdatePropertyPriceCommand,
  UpdatePropertyMaxSlotsCommand,
  UpdatePropertyYieldCommand,
  UpdateShieldCostCommand,
  PauseGameCommand,
  UnpauseGameCommand,
  UpdatePhaseCommand,
  UpdateStealChancesCommand,
  UpdateGlobalRatesCommand,
  ClearCooldownCommand,
  ClearStealCooldownCommand
} from '../commands/index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PublicKey } from '@solana/web3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  command: string;
  success: boolean;
  error?: string;
  transactionHash?: string;
  duration: number;
}

interface TestReport {
  timestamp: string;
  backupFile: string;
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
}

class AdminCommandTester {
  private ctx: any;
  private commands: any;
  private report: TestReport;
  private testPlayerAddress: string;

  constructor() {
    this.ctx = loadProgram();
    this.commands = {
      updatePropertyPrice: new UpdatePropertyPriceCommand(),
      updatePropertyMaxSlots: new UpdatePropertyMaxSlotsCommand(),
      updatePropertyYield: new UpdatePropertyYieldCommand(),
      updateShieldCost: new UpdateShieldCostCommand(),
      pauseGame: new PauseGameCommand(),
      unpauseGame: new UnpauseGameCommand(),
      updatePhase: new UpdatePhaseCommand(),
      updateStealChances: new UpdateStealChancesCommand(),
      updateGlobalRates: new UpdateGlobalRatesCommand(),
      clearCooldown: new ClearCooldownCommand(),
      clearStealCooldown: new ClearStealCooldownCommand(),
    };

    this.report = {
      timestamp: new Date().toISOString(),
      backupFile: '',
      totalTests: 0,
      passed: 0,
      failed: 0,
      results: []
    };

    // Use a test wallet address (you can change this to a real test wallet)
    this.testPlayerAddress = 'CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS'; // dev wallet as test
  }

  private async runTest(commandName: string, testFunction: () => Promise<any>): Promise<void> {
    console.log(`\n🧪 Testing: ${commandName}`);
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.report.results.push({
        command: commandName,
        success: true,
        transactionHash: result,
        duration
      });
      this.report.passed++;
      console.log(`✅ ${commandName} - SUCCESS (${duration}ms)`);
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      this.report.results.push({
        command: commandName,
        success: false,
        error: error.message || error.toString(),
        duration
      });
      this.report.failed++;
      console.log(`❌ ${commandName} - FAILED: ${error.message} (${duration}ms)`);
    }
    
    this.report.totalTests++;
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Admin Commands Test Suite');
    console.log('='.repeat(70));

    // 1. Create backup first
    console.log('📋 Creating backup of current configuration...');
    await backupGameConfig();
    this.report.backupFile = `game-config-backup-${Date.now()}.json`;

    console.log('\n📊 Running tests...');

    // Property Management Commands
    console.log('\n🏠 TESTING PROPERTY MANAGEMENT COMMANDS');
    console.log('-'.repeat(50));

    await this.runTest('Update Property Price', async () => {
      return await this.commands.updatePropertyPrice.execute(this.ctx, 0, 1000);
    });

    await this.runTest('Update Property Max Slots', async () => {
      return await this.commands.updatePropertyMaxSlots.execute(this.ctx, 0, 100);
    });

    await this.runTest('Update Property Yield', async () => {
      return await this.commands.updatePropertyYield.execute(this.ctx, 0, 500); // 5%
    });

    await this.runTest('Update Shield Cost', async () => {
      return await this.commands.updateShieldCost.execute(this.ctx, 0, 1000); // 10%
    });

    // Game State Management Commands  
    console.log('\n🎮 TESTING GAME STATE MANAGEMENT COMMANDS');
    console.log('-'.repeat(50));

    await this.runTest('Pause Game', async () => {
      return await this.commands.pauseGame.execute(this.ctx);
    });

    await this.runTest('Unpause Game', async () => {
      return await this.commands.unpauseGame.execute(this.ctx);
    });

    await this.runTest('Update Phase', async () => {
      return await this.commands.updatePhase.execute(this.ctx, 2);
    });

    await this.runTest('Update Steal Chances', async () => {
      return await this.commands.updateStealChances.execute(this.ctx, 2500, 3300);
    });

    await this.runTest('Update Global Rates', async () => {
      return await this.commands.updateGlobalRates.execute(this.ctx, {
        stealCostBps: 5000,
        setBonusBps: 4000,
        maxPropertiesClaim: 22,
        minClaimInterval: 1
      });
    });

    // Cooldown Management Commands (these might fail if accounts don't exist)
    console.log('\n🔧 TESTING COOLDOWN MANAGEMENT COMMANDS');
    console.log('-'.repeat(50));

    await this.runTest('Clear Purchase Cooldown', async () => {
      return await this.commands.clearCooldown.execute(this.ctx, this.testPlayerAddress, 0);
    });

    await this.runTest('Clear Steal Cooldown', async () => {
      return await this.commands.clearStealCooldown.execute(this.ctx, this.testPlayerAddress, 0);
    });

    // Generate final report
    await this.generateReport();
  }

  private async generateReport(): Promise<void> {
    console.log('\n📋 GENERATING TEST REPORT');
    console.log('='.repeat(70));

    const reportContent = {
      ...this.report,
      summary: {
        successRate: `${((this.report.passed / this.report.totalTests) * 100).toFixed(1)}%`,
        totalDuration: this.report.results.reduce((sum, result) => sum + result.duration, 0),
        averageDuration: Math.round(this.report.results.reduce((sum, result) => sum + result.duration, 0) / this.report.totalTests)
      },
      recommendations: this.generateRecommendations()
    };

    // Save detailed report
    const reportFilename = `admin-commands-test-report-${Date.now()}.json`;
    const reportsDir = path.join(__dirname, '../test-reports');
    const reportPath = path.join(reportsDir, reportFilename);
    
    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    await fs.writeFile(reportPath, JSON.stringify(reportContent, null, 2));

    // Print summary to console
    console.log(`\n📊 TEST SUMMARY:`);
    console.log(`   Total Tests: ${this.report.totalTests}`);
    console.log(`   Passed: ${this.report.passed} ✅`);
    console.log(`   Failed: ${this.report.failed} ❌`);
    console.log(`   Success Rate: ${reportContent.summary.successRate}`);
    console.log(`   Total Duration: ${reportContent.summary.totalDuration}ms`);
    console.log(`   Average Duration: ${reportContent.summary.averageDuration}ms`);

    console.log(`\n📁 Reports saved:`);
    console.log(`   Detailed Report: ${reportPath}`);
    
    if (this.report.failed > 0) {
      console.log(`\n❌ FAILED TESTS:`);
      this.report.results
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`   ${result.command}: ${result.error}`);
        });
    }

    console.log(`\n💡 RECOMMENDATIONS:`);
    reportContent.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });

    console.log('\n✅ Test suite completed!');
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const failedCommands = this.report.results.filter(r => !r.success);
    
    if (failedCommands.length === 0) {
      recommendations.push('All admin commands are working correctly!');
    } else {
      recommendations.push(`${failedCommands.length} commands failed - check error messages for details`);
      
      const cooldownFailures = failedCommands.filter(f => 
        f.command.includes('Cooldown')
      );
      
      if (cooldownFailures.length > 0) {
        recommendations.push('Cooldown command failures likely due to non-existent player accounts - this is expected');
      }

      const propertyFailures = failedCommands.filter(f => 
        f.command.includes('Property') && !f.error?.includes('not found')
      );
      
      if (propertyFailures.length > 0) {
        recommendations.push('Property command failures may indicate permission or account state issues');
      }

      const gameStateFailures = failedCommands.filter(f => 
        ['Pause', 'Unpause', 'Phase', 'Steal', 'Global'].some(keyword => f.command.includes(keyword))
      );
      
      if (gameStateFailures.length > 0) {
        recommendations.push('Game state command failures may indicate authority permission issues');
      }
    }

    const slowCommands = this.report.results.filter(r => r.duration > 5000);
    if (slowCommands.length > 0) {
      recommendations.push(`${slowCommands.length} commands took over 5 seconds - consider RPC optimization`);
    }

    return recommendations;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AdminCommandTester();
  tester.runAllTests().catch(console.error);
}