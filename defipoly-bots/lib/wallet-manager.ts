// ============================================
// WALLET MANAGER - Multi-Wallet Handling
// ============================================

import * as fs from "fs";
import * as path from "path";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import { Config } from "./config.js";

export interface WalletInfo {
  id: number;
  name?: string;
  publicKey: string;
  keypair: Keypair;
}

export class WalletManager {
  private wallets: Map<number, WalletInfo> = new Map();
  private nextId: number = 0;
  private connection: Connection;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, "confirmed");
    
    // Ensure wallets directory exists
    if (!fs.existsSync(config.walletsDir)) {
      fs.mkdirSync(config.walletsDir, { recursive: true });
    }
  }

  // ─────────────────────────────────────────
  // WALLET LOADING
  // ─────────────────────────────────────────

  async loadWallets(): Promise<void> {
    // Load from wallets directory
    if (fs.existsSync(this.config.walletsDir)) {
      const files = fs.readdirSync(this.config.walletsDir).filter(f => f.endsWith(".json"));
      
      for (const file of files) {
        try {
          const filePath = path.join(this.config.walletsDir, file);
          const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
          
          let keypair: Keypair;
          let name: string | undefined;

          // Handle different formats
          if (Array.isArray(data)) {
            // Raw keypair array
            keypair = Keypair.fromSecretKey(Uint8Array.from(data));
          } else if (data.secretKey) {
            // Object with secretKey
            keypair = Keypair.fromSecretKey(Uint8Array.from(data.secretKey));
            name = data.name;
          } else {
            console.warn(`Unknown wallet format in ${file}`);
            continue;
          }

          const id = this.nextId++;
          this.wallets.set(id, {
            id,
            name: name || file.replace(".json", ""),
            publicKey: keypair.publicKey.toString(),
            keypair,
          });
        } catch (error) {
          console.warn(`Failed to load wallet from ${file}:`, error);
        }
      }
    }

    // Also try loading test-wallets if exists
    const testWalletsDir = path.join(this.config.walletsDir, "../test-wallets");
    if (fs.existsSync(testWalletsDir)) {
      const files = fs.readdirSync(testWalletsDir).filter(f => f.endsWith(".json") && f !== "summary.json");
      
      for (const file of files) {
        try {
          const filePath = path.join(testWalletsDir, file);
          const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
          
          let keypair: Keypair;
          if (Array.isArray(data)) {
            keypair = Keypair.fromSecretKey(Uint8Array.from(data));
          } else if (data.secretKey) {
            keypair = Keypair.fromSecretKey(Uint8Array.from(data.secretKey));
          } else {
            continue;
          }

          // Check if already loaded (by public key)
          const exists = Array.from(this.wallets.values()).some(
            w => w.publicKey === keypair.publicKey.toString()
          );
          if (exists) continue;

          const id = this.nextId++;
          this.wallets.set(id, {
            id,
            name: file.replace(".json", ""),
            publicKey: keypair.publicKey.toString(),
            keypair,
          });
        } catch (error) {
          // Silently skip invalid files
        }
      }
    }

    console.log(`📁 Loaded ${this.wallets.size} wallets`);
  }

  // ─────────────────────────────────────────
  // WALLET CREATION & IMPORT
  // ─────────────────────────────────────────

  async addWalletFromPrivateKey(privateKey: string, name?: string): Promise<WalletInfo> {
    let keypair: Keypair;
    
    try {
      // Try base58 first
      const decoded = bs58.decode(privateKey);
      keypair = Keypair.fromSecretKey(decoded);
    } catch {
      // Try JSON array
      try {
        const array = JSON.parse(privateKey);
        keypair = Keypair.fromSecretKey(Uint8Array.from(array));
      } catch {
        throw new Error("Invalid private key format. Use base58 or JSON array.");
      }
    }

    return this.addKeypair(keypair, name);
  }

  async addWalletFromFile(filePath: string, name?: string): Promise<WalletInfo> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    let keypair: Keypair;
    if (Array.isArray(data)) {
      keypair = Keypair.fromSecretKey(Uint8Array.from(data));
    } else if (data.secretKey) {
      keypair = Keypair.fromSecretKey(Uint8Array.from(data.secretKey));
      name = name || data.name;
    } else {
      throw new Error("Invalid wallet file format");
    }

    return this.addKeypair(keypair, name);
  }

  async createNewWallet(name?: string): Promise<WalletInfo> {
    const keypair = Keypair.generate();
    const wallet = await this.addKeypair(keypair, name);
    
    // Save to file
    const filename = `${wallet.id}.json`;
    const filePath = path.join(this.config.walletsDir, filename);
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        name: wallet.name,
        publicKey: wallet.publicKey,
        secretKey: Array.from(keypair.secretKey),
      }, null, 2)
    );

    return wallet;
  }

  async importFromFolder(folderPath: string): Promise<number> {
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Folder not found: ${folderPath}`);
    }

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".json") && f !== "summary.json");
    let imported = 0;

    for (const file of files) {
      try {
        await this.addWalletFromFile(path.join(folderPath, file), file.replace(".json", ""));
        imported++;
      } catch (error) {
        // Skip invalid files
      }
    }

    return imported;
  }

  private async addKeypair(keypair: Keypair, name?: string): Promise<WalletInfo> {
    // Check if already exists
    const existing = Array.from(this.wallets.values()).find(
      w => w.publicKey === keypair.publicKey.toString()
    );
    if (existing) {
      throw new Error(`Wallet already exists with ID ${existing.id}`);
    }

    const id = this.nextId++;
    const wallet: WalletInfo = {
      id,
      name: name || `wallet-${id}`,
      publicKey: keypair.publicKey.toString(),
      keypair,
    };

    this.wallets.set(id, wallet);
    return wallet;
  }

  // ─────────────────────────────────────────
  // WALLET ACCESS
  // ─────────────────────────────────────────

  getWallet(id: number): WalletInfo | undefined {
    return this.wallets.get(id);
  }

  getKeypair(id: number): Keypair {
    const wallet = this.wallets.get(id);
    if (!wallet) {
      throw new Error(`Wallet ${id} not found`);
    }
    return wallet.keypair;
  }

  getAllWallets(): WalletInfo[] {
    return Array.from(this.wallets.values()).sort((a, b) => a.id - b.id);
  }

  getWalletCount(): number {
    return this.wallets.size;
  }

  async removeWallet(id: number): Promise<void> {
    if (!this.wallets.has(id)) {
      throw new Error(`Wallet ${id} not found`);
    }
    
    this.wallets.delete(id);
    
    // Also delete file if exists
    const filePath = path.join(this.config.walletsDir, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // ─────────────────────────────────────────
  // BALANCE CHECKING
  // ─────────────────────────────────────────

  async getSolBalance(id: number): Promise<number> {
    const wallet = this.getWallet(id);
    if (!wallet) return 0;
    
    try {
      const balance = await this.connection.getBalance(wallet.keypair.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch {
      return 0;
    }
  }

  async getTokenBalance(id: number): Promise<number> {
    const wallet = this.getWallet(id);
    if (!wallet) return 0;
    
    try {
      const tokenAccount = this.getAssociatedTokenAddress(
        this.config.tokenMint,
        wallet.keypair.publicKey
      );
      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return Number(balance.value.amount) / 1e9;
    } catch {
      return 0;
    }
  }

  // ─────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────

  getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
    const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
    
    const [address] = PublicKey.findProgramAddressSync(
      [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return address;
  }
}