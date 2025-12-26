#!/usr/bin/env tsx
// ============================================
// DEFIPOLY CLI - Interactive Multi-Wallet Tool
// ============================================

import * as readline from "readline";
import { WalletManager, WalletInfo } from "./lib/wallet-manager.js";
import { GameActions } from "./lib/game-actions.js";
import { Config } from "./lib/config.js";
import chalk from "chalk";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (question: string): Promise<string> => {
  return new Promise((resolve) => rl.question(question, resolve));
};

class DefipolyCLI {
  private walletManager: WalletManager;
  private gameActions: GameActions;
  private config: Config;

  constructor() {
    this.config = new Config();
    this.walletManager = new WalletManager(this.config);
    this.gameActions = new GameActions(this.config, this.walletManager);
  }

  async run() {
    console.clear();
    this.printBanner();
    
    // Load existing wallets
    await this.walletManager.loadWallets();
    
    while (true) {
      await this.showMainMenu();
    }
  }

  printBanner() {
    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ${chalk.bold.yellow("🎲 DEFIPOLY CLI")}                                           ║
║   ${chalk.gray("Multi-Wallet Game Interaction Tool")}                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`));
  }

  async showMainMenu() {
    const walletCount = this.walletManager.getWalletCount();
    
    console.log(chalk.cyan("\n═══════════════════════════════════════"));
    console.log(chalk.bold("  MAIN MENU"));
    console.log(chalk.gray(`  Wallets loaded: ${walletCount}`));
    console.log(chalk.cyan("═══════════════════════════════════════\n"));

    console.log(chalk.yellow("  Wallet Management:"));
    console.log("  1. List wallets");
    console.log("  2. Add wallet (private key)");
    console.log("  3. Add wallet (JSON file)");
    console.log("  4. Create new wallet");
    console.log("  5. Import folder of wallets");
    console.log("  6. Remove wallet");
    
    console.log(chalk.yellow("\n  Game Actions:"));
    console.log("  10. Initialize player(s)");
    console.log("  11. Buy property");
    console.log("  12. Sell property");
    console.log("  13. Activate shield");
    console.log("  14. Claim rewards");
    console.log("  15. Steal property");
    
    console.log(chalk.yellow("\n  Info & Status:"));
    console.log("  20. Wallet info");
    console.log("  21. Property status");
    console.log("  22. Game config");
    
    console.log(chalk.yellow("\n  Batch Operations:"));
    console.log("  30. Batch buy (all wallets)");
    console.log("  31. Batch claim (all wallets)");
    console.log("  32. Batch init (all wallets)");
    
    console.log(chalk.red("\n  0. Exit"));
    
    const choice = await prompt(chalk.green("\n  Enter choice: "));
    
    switch (choice.trim()) {
      case "1": await this.listWallets(); break;
      case "2": await this.addWalletPrivateKey(); break;
      case "3": await this.addWalletFile(); break;
      case "4": await this.createWallet(); break;
      case "5": await this.importWalletFolder(); break;
      case "6": await this.removeWallet(); break;
      
      case "10": await this.initializePlayer(); break;
      case "11": await this.buyProperty(); break;
      case "12": await this.sellProperty(); break;
      case "13": await this.activateShield(); break;
      case "14": await this.claimRewards(); break;
      case "15": await this.stealProperty(); break;
      
      case "20": await this.showWalletInfo(); break;
      case "21": await this.showPropertyStatus(); break;
      case "22": await this.showGameConfig(); break;
      
      case "30": await this.batchBuy(); break;
      case "31": await this.batchClaim(); break;
      case "32": await this.batchInit(); break;
      
      case "0":
        console.log(chalk.yellow("\n👋 Goodbye!\n"));
        rl.close();
        process.exit(0);
      
      default:
        console.log(chalk.red("\n❌ Invalid choice"));
    }
  }

  // ─────────────────────────────────────────
  // WALLET MANAGEMENT
  // ─────────────────────────────────────────

  async listWallets() {
    console.log(chalk.cyan("\n═══ LOADED WALLETS ═══\n"));
    
    const wallets = this.walletManager.getAllWallets();
    
    if (wallets.length === 0) {
      console.log(chalk.gray("  No wallets loaded."));
      return;
    }

    for (const wallet of wallets) {
      const balance = await this.walletManager.getSolBalance(wallet.id);
      const tokenBalance = await this.walletManager.getTokenBalance(wallet.id);
      
      console.log(chalk.yellow(`  [${wallet.id}] ${wallet.name || "Unnamed"}`));
      console.log(chalk.gray(`      Address: ${wallet.publicKey}`));
      console.log(chalk.gray(`      SOL: ${balance.toFixed(4)} | Tokens: ${tokenBalance.toFixed(2)}`));
      console.log();
    }
  }

  async addWalletPrivateKey() {
    console.log(chalk.cyan("\n═══ ADD WALLET (PRIVATE KEY) ═══\n"));
    
    const name = await prompt("  Wallet name (optional): ");
    const privateKey = await prompt("  Private key (base58): ");
    
    try {
      const wallet = await this.walletManager.addWalletFromPrivateKey(privateKey.trim(), name.trim() || undefined);
      console.log(chalk.green(`\n✅ Wallet added: ${wallet.publicKey}`));
    } catch (error: any) {
      console.log(chalk.red(`\n❌ Error: ${error.message}`));
    }
  }

  async addWalletFile() {
    console.log(chalk.cyan("\n═══ ADD WALLET (JSON FILE) ═══\n"));
    
    const filePath = await prompt("  Path to JSON file: ");
    const name = await prompt("  Wallet name (optional): ");
    
    try {
      const wallet = await this.walletManager.addWalletFromFile(filePath.trim(), name.trim() || undefined);
      console.log(chalk.green(`\n✅ Wallet added: ${wallet.publicKey}`));
    } catch (error: any) {
      console.log(chalk.red(`\n❌ Error: ${error.message}`));
    }
  }

  async createWallet() {
    console.log(chalk.cyan("\n═══ CREATE NEW WALLET ═══\n"));
    
    const name = await prompt("  Wallet name (optional): ");
    
    try {
      const wallet = await this.walletManager.createNewWallet(name.trim() || undefined);
      console.log(chalk.green(`\n✅ Wallet created: ${wallet.publicKey}`));
      console.log(chalk.yellow(`   Saved to: ./wallets/${wallet.id}.json`));
    } catch (error: any) {
      console.log(chalk.red(`\n❌ Error: ${error.message}`));
    }
  }

  async importWalletFolder() {
    console.log(chalk.cyan("\n═══ IMPORT WALLET FOLDER ═══\n"));
    
    const folderPath = await prompt("  Path to folder (default: ./test-wallets): ");
    const path = folderPath.trim() || "./test-wallets";
    
    try {
      const count = await this.walletManager.importFromFolder(path);
      console.log(chalk.green(`\n✅ Imported ${count} wallets`));
    } catch (error: any) {
      console.log(chalk.red(`\n❌ Error: ${error.message}`));
    }
  }

  async removeWallet() {
    console.log(chalk.cyan("\n═══ REMOVE WALLET ═══\n"));
    
    const id = await prompt("  Wallet ID to remove: ");
    
    try {
      await this.walletManager.removeWallet(parseInt(id.trim()));
      console.log(chalk.green(`\n✅ Wallet removed`));
    } catch (error: any) {
      console.log(chalk.red(`\n❌ Error: ${error.message}`));
    }
  }

  // ─────────────────────────────────────────
  // WALLET SELECTION HELPER
  // ─────────────────────────────────────────

  async selectWallets(promptText: string = "Select wallets"): Promise<number[]> {
    console.log(chalk.gray("\n  Options: 'all', single ID (e.g. '0'), or comma-separated (e.g. '0,1,2')"));
    const input = await prompt(`  ${promptText}: `);
    
    const trimmed = input.trim().toLowerCase();
    
    if (trimmed === "all") {
      return this.walletManager.getAllWallets().map(w => w.id);
    }
    
    return trimmed.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  }

  // ─────────────────────────────────────────
  // GAME ACTIONS
  // ─────────────────────────────────────────

  async initializePlayer() {
    console.log(chalk.cyan("\n═══ INITIALIZE PLAYER ═══\n"));
    
    const walletIds = await this.selectWallets("Wallet(s) to initialize");
    
    if (walletIds.length === 0) {
      console.log(chalk.red("\n❌ No wallets selected"));
      return;
    }

    await this.gameActions.initializePlayers(walletIds);
  }

  async buyProperty() {
    console.log(chalk.cyan("\n═══ BUY PROPERTY ═══\n"));
    
    const propertyId = await prompt("  Property ID (0-21): ");
    const slots = await prompt("  Number of slots (default: 1): ");
    const walletIds = await this.selectWallets("Wallet(s) to use");
    
    if (walletIds.length === 0) {
      console.log(chalk.red("\n❌ No wallets selected"));
      return;
    }

    await this.gameActions.buyProperties(
      walletIds,
      parseInt(propertyId.trim()),
      parseInt(slots.trim()) || 1
    );
  }

  async sellProperty() {
    console.log(chalk.cyan("\n═══ SELL PROPERTY ═══\n"));
    
    const propertyId = await prompt("  Property ID (0-21): ");
    const slots = await prompt("  Number of slots to sell: ");
    const walletIds = await this.selectWallets("Wallet(s) to use");
    
    if (walletIds.length === 0) {
      console.log(chalk.red("\n❌ No wallets selected"));
      return;
    }

    await this.gameActions.sellProperties(
      walletIds,
      parseInt(propertyId.trim()),
      parseInt(slots.trim()) || 1
    );
  }

  async activateShield() {
    console.log(chalk.cyan("\n═══ ACTIVATE SHIELD ═══\n"));
    
    const propertyId = await prompt("  Property ID (0-21): ");
    const slots = await prompt("  Slots to shield: ");
    const walletIds = await this.selectWallets("Wallet(s) to use");
    
    if (walletIds.length === 0) {
      console.log(chalk.red("\n❌ No wallets selected"));
      return;
    }

    await this.gameActions.activateShields(
      walletIds,
      parseInt(propertyId.trim()),
      parseInt(slots.trim())
    );
  }

  async claimRewards() {
    console.log(chalk.cyan("\n═══ CLAIM REWARDS ═══\n"));
    
    const walletIds = await this.selectWallets("Wallet(s) to claim for");
    
    if (walletIds.length === 0) {
      console.log(chalk.red("\n❌ No wallets selected"));
      return;
    }

    await this.gameActions.claimRewards(walletIds);
  }

  async stealProperty() {
    console.log(chalk.cyan("\n═══ STEAL PROPERTY ═══\n"));
    
    const attackerId = await prompt("  Attacker wallet ID: ");
    const propertyId = await prompt("  Property ID (0-21): ");
    
    await this.gameActions.stealProperty(
      parseInt(attackerId.trim()),
      parseInt(propertyId.trim())
    );
  }

  // ─────────────────────────────────────────
  // INFO & STATUS
  // ─────────────────────────────────────────

  async showWalletInfo() {
    console.log(chalk.cyan("\n═══ WALLET INFO ═══\n"));
    
    const id = await prompt("  Wallet ID: ");
    await this.gameActions.getWalletInfo(parseInt(id.trim()));
  }

  async showPropertyStatus() {
    console.log(chalk.cyan("\n═══ PROPERTY STATUS ═══\n"));
    
    const propertyId = await prompt("  Property ID (0-21, or 'all'): ");
    
    if (propertyId.trim().toLowerCase() === "all") {
      for (let i = 0; i < 22; i++) {
        await this.gameActions.getPropertyInfo(i);
      }
    } else {
      await this.gameActions.getPropertyInfo(parseInt(propertyId.trim()));
    }
  }

  async showGameConfig() {
    await this.gameActions.getGameConfig();
  }

  // ─────────────────────────────────────────
  // BATCH OPERATIONS
  // ─────────────────────────────────────────

  async batchBuy() {
    console.log(chalk.cyan("\n═══ BATCH BUY (ALL WALLETS) ═══\n"));
    
    const propertyId = await prompt("  Property ID (0-21): ");
    const slots = await prompt("  Slots per wallet (default: 1): ");
    
    const allIds = this.walletManager.getAllWallets().map(w => w.id);
    
    await this.gameActions.buyProperties(
      allIds,
      parseInt(propertyId.trim()),
      parseInt(slots.trim()) || 1
    );
  }

  async batchClaim() {
    console.log(chalk.cyan("\n═══ BATCH CLAIM (ALL WALLETS) ═══\n"));
    
    const allIds = this.walletManager.getAllWallets().map(w => w.id);
    await this.gameActions.claimRewards(allIds);
  }

  async batchInit() {
    console.log(chalk.cyan("\n═══ BATCH INITIALIZE (ALL WALLETS) ═══\n"));
    
    const allIds = this.walletManager.getAllWallets().map(w => w.id);
    await this.gameActions.initializePlayers(allIds);
  }
}

// Run CLI
const cli = new DefipolyCLI();
cli.run().catch(console.error);