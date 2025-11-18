#!/usr/bin/env node

import { question, closeInput } from './utils/input.js';
import { loadProgram } from './utils/program.js';
import { MenuHandler } from './menu/menu-handler.js';
import { showMainMenu } from './menu/menu-display.js';

async function main(): Promise<void> {
  const ctx = loadProgram();
  const menuHandler = new MenuHandler(ctx);

  while (true) {
    try {
      showMainMenu();
      const choice = await question('Enter your choice (0-18): ');

      if (choice === '0') {
        console.log('\n👋 Goodbye!\n');
        closeInput();
        process.exit(0);
      }

      switch (choice) {
        case '1':
          await menuHandler.handleGrantProperty();
          break;
        case '2':
          await menuHandler.handleRevokeProperty();
          break;
        case '3':
          await menuHandler.handleGrantShield();
          break;
        case '4':
          await menuHandler.handleClosePlayerAccount();
          break;
        case '5':
          await menuHandler.handleUpdatePropertyPrice();
          break;
        case '6':
          await menuHandler.handleUpdatePropertyMaxSlots();
          break;
        case '7':
          await menuHandler.handleUpdatePropertyYield();
          break;
        case '8':
          await menuHandler.handleUpdateShieldCost();
          break;
        case '9':
          await menuHandler.handleUpdateCooldown();
          break;
        case '10':
          await menuHandler.handlePauseGame();
          break;
        case '11':
          await menuHandler.handleUnpauseGame();
          break;
        case '12':
          await menuHandler.handleUpdatePhase();
          break;
        case '13':
          await menuHandler.handleUpdateStealChances();
          break;
        case '14':
          await menuHandler.handleUpdateGlobalRates();
          break;
        case '15':
          await menuHandler.handleClearCooldown();
          break;
        case '16':
          await menuHandler.handleClearStealCooldown();
          break;
        case '17':
          await menuHandler.handleEmergencyWithdraw();
          break;
        case '18':
          await menuHandler.handleTransferAuthority();
          break;
        default:
          console.log('❌ Invalid choice');
      }

      await question('\nPress Enter to continue...');
    } catch (error: any) {
      console.error('\n❌ Error:', error.message || error);
      await question('\nPress Enter to continue...');
    }
  }
}

main().catch(console.error);