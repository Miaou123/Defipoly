#!/usr/bin/env tsx
// ============================================
// DEFIPOLY CLI - Command Line Mode
// Usage: tsx cmd.ts <command> [options]
// ============================================

import { WalletManager } from "./lib/wallet-manager.js";
import { GameActions } from "./lib/game-actions.js";
import { Config } from "./lib/config.js";

const config = new Config();
const walletManager = new WalletManager(config);
const gameActions = new GameActions(config, walletManager);

function parseWalletIds(input: string): number[] {
  if (input === "all") {
    return walletManager.getAllWallets().map(w => w.id);
  }
  return input.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
}

function printUsage() {
  console.log(`
🎲 DEFIPOLY CLI - Command Line Mode

Usage: tsx cmd.ts <command> [options]

WALLET COMMANDS:
  list                              List all wallets
  add-key <privateKey> [name]       Add wallet from private key
  add-file <path> [name]            Add wallet from JSON file
  create [name]                     Create new wallet
  import <folder>                   Import wallets from folder
  remove <id>                       Remove wallet

GAME COMMANDS:
  init <wallets>                    Initialize player(s)
  buy <propertyId> <slots> <wallets> Buy property slots
  sell <propertyId> <slots> <wallets> Sell property slots
  shield <propertyId> <slots> <wallets> Activate shields
  claim <wallets>                   Claim rewards
  steal <attackerId> <propertyId>   Attempt steal

INFO COMMANDS:
  info <walletId>                   Show wallet info
  property <id|all>                 Show property info
  config                            Show game config

WALLET SPECIFIERS:
  all                               All loaded wallets
  0,1,2,3                          Comma-separated IDs
  5                                 Single ID

EXAMPLES:
  tsx cmd.ts list
  tsx cmd.ts init all
  tsx cmd.ts buy 0 1 all            # All wallets buy 1 slot of property 0
  tsx cmd.ts buy 5 2 0,1,2          # Wallets 0,1,2 buy 2 slots of property 5
  tsx cmd.ts claim all
  tsx cmd.ts info 0
  tsx cmd.ts property all
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    printUsage();
    return;
  }

  // Load wallets first
  await walletManager.loadWallets();

  switch (command) {
    // ─────────────────────────────────────────
    // WALLET COMMANDS
    // ─────────────────────────────────────────
    
    case "list": {
      const wallets = walletManager.getAllWallets();
      if (wallets.length === 0) {
        console.log("No wallets loaded.");
        return;
      }
      console.log("\n📁 Loaded Wallets:\n");
      for (const wallet of wallets) {
        const sol = await walletManager.getSolBalance(wallet.id);
        const tokens = await walletManager.getTokenBalance(wallet.id);
        console.log(`[${wallet.id}] ${wallet.name || "Unnamed"}`);
        console.log(`    ${wallet.publicKey}`);
        console.log(`    SOL: ${sol.toFixed(4)} | Tokens: ${tokens.toFixed(2)}\n`);
      }
      break;
    }

    case "add-key": {
      const privateKey = args[1];
      const name = args[2];
      if (!privateKey) {
        console.log("Usage: add-key <privateKey> [name]");
        return;
      }
      const wallet = await walletManager.addWalletFromPrivateKey(privateKey, name);
      console.log(`✅ Added wallet: ${wallet.publicKey}`);
      break;
    }

    case "add-file": {
      const filePath = args[1];
      const name = args[2];
      if (!filePath) {
        console.log("Usage: add-file <path> [name]");
        return;
      }
      const wallet = await walletManager.addWalletFromFile(filePath, name);
      console.log(`✅ Added wallet: ${wallet.publicKey}`);
      break;
    }

    case "create": {
      const name = args[1];
      const wallet = await walletManager.createNewWallet(name);
      console.log(`✅ Created wallet: ${wallet.publicKey}`);
      console.log(`   Saved to: ./wallets/${wallet.id}.json`);
      break;
    }

    case "import": {
      const folder = args[1] || "./test-wallets";
      const count = await walletManager.importFromFolder(folder);
      console.log(`✅ Imported ${count} wallets from ${folder}`);
      break;
    }

    case "remove": {
      const id = parseInt(args[1]);
      if (isNaN(id)) {
        console.log("Usage: remove <id>");
        return;
      }
      await walletManager.removeWallet(id);
      console.log(`✅ Removed wallet ${id}`);
      break;
    }

    // ─────────────────────────────────────────
    // GAME COMMANDS
    // ─────────────────────────────────────────

    case "init": {
      const walletSpec = args[1];
      if (!walletSpec) {
        console.log("Usage: init <wallets>");
        return;
      }
      const walletIds = parseWalletIds(walletSpec);
      await gameActions.initializePlayers(walletIds);
      break;
    }

    case "buy": {
      const propertyId = parseInt(args[1]);
      const slots = parseInt(args[2]) || 1;
      const walletSpec = args[3];
      if (isNaN(propertyId) || !walletSpec) {
        console.log("Usage: buy <propertyId> <slots> <wallets>");
        return;
      }
      const walletIds = parseWalletIds(walletSpec);
      await gameActions.buyProperties(walletIds, propertyId, slots);
      break;
    }

    case "sell": {
      const propertyId = parseInt(args[1]);
      const slots = parseInt(args[2]);
      const walletSpec = args[3];
      if (isNaN(propertyId) || isNaN(slots) || !walletSpec) {
        console.log("Usage: sell <propertyId> <slots> <wallets>");
        return;
      }
      const walletIds = parseWalletIds(walletSpec);
      await gameActions.sellProperties(walletIds, propertyId, slots);
      break;
    }

    case "shield": {
      const propertyId = parseInt(args[1]);
      const slots = parseInt(args[2]);
      const walletSpec = args[3];
      if (isNaN(propertyId) || isNaN(slots) || !walletSpec) {
        console.log("Usage: shield <propertyId> <slots> <wallets>");
        return;
      }
      const walletIds = parseWalletIds(walletSpec);
      await gameActions.activateShields(walletIds, propertyId, slots);
      break;
    }

    case "claim": {
      const walletSpec = args[1];
      if (!walletSpec) {
        console.log("Usage: claim <wallets>");
        return;
      }
      const walletIds = parseWalletIds(walletSpec);
      await gameActions.claimRewards(walletIds);
      break;
    }

    case "steal": {
      const attackerId = parseInt(args[1]);
      const propertyId = parseInt(args[2]);
      if (isNaN(attackerId) || isNaN(propertyId)) {
        console.log("Usage: steal <attackerId> <propertyId>");
        return;
      }
      await gameActions.stealProperty(attackerId, propertyId);
      break;
    }

    // ─────────────────────────────────────────
    // INFO COMMANDS
    // ─────────────────────────────────────────

    case "info": {
      const walletId = parseInt(args[1]);
      if (isNaN(walletId)) {
        console.log("Usage: info <walletId>");
        return;
      }
      await gameActions.getWalletInfo(walletId);
      break;
    }

    case "property": {
      const propArg = args[1];
      if (!propArg) {
        console.log("Usage: property <id|all>");
        return;
      }
      if (propArg === "all") {
        for (let i = 0; i < 22; i++) {
          await gameActions.getPropertyInfo(i);
        }
      } else {
        await gameActions.getPropertyInfo(parseInt(propArg));
      }
      break;
    }

    case "config": {
      await gameActions.getGameConfig();
      break;
    }

    case "help":
    case "--help":
    case "-h":
      printUsage();
      break;

    default:
      console.log(`Unknown command: ${command}`);
      printUsage();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });