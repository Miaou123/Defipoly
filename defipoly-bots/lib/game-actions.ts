// ============================================
// GAME ACTIONS - All Game Mechanics
// ============================================

import * as fs from "fs";
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { Config } from "./config.js";
import { WalletManager } from "./wallet-manager.js";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

export class GameActions {
  private config: Config;
  private walletManager: WalletManager;
  private connection: Connection;
  private programIdl: any;

  constructor(config: Config, walletManager: WalletManager) {
    this.config = config;
    this.walletManager = walletManager;
    this.connection = new Connection(config.rpcUrl, "confirmed");
    this.programIdl = JSON.parse(fs.readFileSync(config.idlPath, "utf8"));
  }

  // ─────────────────────────────────────────
  // PDA DERIVATIONS
  // ─────────────────────────────────────────

  private getPlayerPDA(player: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("player"), player.toBuffer()],
      this.config.programId
    );
  }

  private getPropertyPDA(propertyId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("property"), Buffer.from([propertyId])],
      this.config.programId
    );
  }

  private getOwnershipPDA(player: PublicKey, propertyId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("ownership"), player.toBuffer(), Buffer.from([propertyId])],
      this.config.programId
    );
  }

  private getGameConfigPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("game_config")],
      this.config.programId
    );
  }

  private getStealRequestPDA(attacker: PublicKey, propertyId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("steal_request"), attacker.toBuffer(), Buffer.from([propertyId])],
      this.config.programId
    );
  }

  private getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
    const [address] = PublicKey.findProgramAddressSync(
      [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return address;
  }

  // ─────────────────────────────────────────
  // PROGRAM INSTANCE
  // ─────────────────────────────────────────

  private async getProgram(wallet: Keypair): Promise<Program> {
    const provider = new AnchorProvider(
      this.connection,
      new anchor.Wallet(wallet),
      { commitment: "confirmed" }
    );
    return new Program(this.programIdl, provider);
  }

  // ─────────────────────────────────────────
  // INITIALIZE PLAYERS
  // ─────────────────────────────────────────

  async initializePlayers(walletIds: number[]): Promise<void> {
    console.log(`\n🎮 Initializing ${walletIds.length} player(s)...`);

    for (const id of walletIds) {
      try {
        const keypair = this.walletManager.getKeypair(id);
        const program = await this.getProgram(keypair);
        const [playerPDA] = this.getPlayerPDA(keypair.publicKey);

        // Check if already initialized
        try {
          await (program.account as any).playerAccount.fetch(playerPDA);
          console.log(`  [${id}]: ⏭️  Already initialized`);
          continue;
        } catch {
          // Not initialized, proceed
        }

        await program.methods
          .initializePlayer()
          .accountsPartial({
            player_account: playerPDA,
            player: keypair.publicKey,
            system_program: SystemProgram.programId,
          })
          .rpc();

        console.log(`  [${id}]: ✅ Player initialized`);
      } catch (error: any) {
        console.log(`  [${id}]: ❌ Error: ${error?.message || error}`);
      }
    }
  }

  // ─────────────────────────────────────────
  // BUY PROPERTIES
  // ─────────────────────────────────────────

  async buyProperties(walletIds: number[], propertyId: number, slots: number = 1): Promise<void> {
    const propConfig = this.config.getPropertyConfig(propertyId);
    console.log(`\n🏠 Buying Property ${propertyId} (${propConfig?.name || "Unknown"}) - ${slots} slot(s)...`);

    for (const id of walletIds) {
      try {
        const keypair = this.walletManager.getKeypair(id);
        const program = await this.getProgram(keypair);

        const [propertyPDA] = this.getPropertyPDA(propertyId);
        const [playerPDA] = this.getPlayerPDA(keypair.publicKey);
        const [gameConfigPDA] = this.getGameConfigPDA();

        const gameConfig = await (program.account as any).gameConfig.fetch(gameConfigPDA);
        const playerTokenAccount = this.getAssociatedTokenAddress(this.config.tokenMint, keypair.publicKey);
        const devTokenAccount = this.getAssociatedTokenAddress(this.config.tokenMint, gameConfig.devWallet);
        const marketingTokenAccount = this.getAssociatedTokenAddress(this.config.tokenMint, gameConfig.marketingWallet);

        await program.methods
          .buyProperty(slots)
          .accountsPartial({
            property: propertyPDA,
            playerAccount: playerPDA,
            player: keypair.publicKey,
            playerTokenAccount,
            rewardPoolVault: gameConfig.rewardPoolVault,
            devTokenAccount,
            marketingTokenAccount,
            gameConfig: gameConfigPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log(`  [${id}]: ✅ Bought ${slots} slot(s)`);
        
        await this.sendActionToBackend(
          `buy_${Date.now()}_${id}_${propertyId}`,
          'buy',
          keypair.publicKey.toString(),
          propertyId,
          undefined,
          (propConfig?.price || 0) * slots,
          slots
        );
      } catch (error: any) {
        console.log(`  [${id}]: ❌ Error: ${error?.message || error}`);
      }
    }
  }

  // ─────────────────────────────────────────
  // SELL PROPERTIES
  // ─────────────────────────────────────────

  async sellProperties(walletIds: number[], propertyId: number, slots: number): Promise<void> {
    const propConfig = this.config.getPropertyConfig(propertyId);
    console.log(`\n💰 Selling Property ${propertyId} (${propConfig?.name || "Unknown"}) - ${slots} slot(s)...`);

    for (const id of walletIds) {
      try {
        const keypair = this.walletManager.getKeypair(id);
        const program = await this.getProgram(keypair);

        const [propertyPDA] = this.getPropertyPDA(propertyId);
        const [playerPDA] = this.getPlayerPDA(keypair.publicKey);
        const [gameConfigPDA] = this.getGameConfigPDA();

        const gameConfig = await (program.account as any).gameConfig.fetch(gameConfigPDA);
        const playerTokenAccount = this.getAssociatedTokenAddress(this.config.tokenMint, keypair.publicKey);

        await program.methods
          .sellProperty(slots)
          .accountsPartial({
            property: propertyPDA,
            playerAccount: playerPDA,
            player: keypair.publicKey,
            playerTokenAccount,
            rewardPoolVault: gameConfig.rewardPoolVault,
            gameConfig: gameConfigPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();

        console.log(`  [${id}]: ✅ Sold ${slots} slot(s)`);
        
        await this.sendActionToBackend(
          `sell_${Date.now()}_${id}_${propertyId}`,
          'sell',
          keypair.publicKey.toString(),
          propertyId,
          undefined,
          undefined,
          slots
        );
      } catch (error: any) {
        console.log(`  [${id}]: ❌ Error: ${error?.message || error}`);
      }
    }
  }

  // ─────────────────────────────────────────
  // ACTIVATE SHIELDS
  // ─────────────────────────────────────────

  async activateShields(walletIds: number[], propertyId: number, slotsToShield: number): Promise<void> {
    const propConfig = this.config.getPropertyConfig(propertyId);
    console.log(`\n🛡️ Activating shields on Property ${propertyId} (${propConfig?.name || "Unknown"}) - ${slotsToShield} slot(s)...`);

    for (const id of walletIds) {
      try {
        const keypair = this.walletManager.getKeypair(id);
        const program = await this.getProgram(keypair);

        const [propertyPDA] = this.getPropertyPDA(propertyId);
        const [playerPDA] = this.getPlayerPDA(keypair.publicKey);
        const [ownershipPDA] = this.getOwnershipPDA(keypair.publicKey, propertyId);
        const [gameConfigPDA] = this.getGameConfigPDA();

        const gameConfig = await (program.account as any).gameConfig.fetch(gameConfigPDA);
        const playerTokenAccount = this.getAssociatedTokenAddress(this.config.tokenMint, keypair.publicKey);
        const devTokenAccount = this.getAssociatedTokenAddress(this.config.tokenMint, gameConfig.devWallet);

        await program.methods
          .activateShield(slotsToShield)
          .accountsPartial({
            property: propertyPDA,
            ownership: ownershipPDA,
            player_account: playerPDA,
            player_token_account: playerTokenAccount,
            reward_pool_vault: gameConfig.rewardPoolVault,
            dev_token_account: devTokenAccount,
            game_config: gameConfigPDA,
            player: keypair.publicKey,
            token_program: TOKEN_PROGRAM_ID,
          })
          .rpc();

        console.log(`  [${id}]: ✅ Shield activated for ${slotsToShield} slot(s)`);
        
        await this.sendActionToBackend(
          `shield_${Date.now()}_${id}_${propertyId}`,
          'shield',
          keypair.publicKey.toString(),
          propertyId,
          undefined,
          undefined,
          slotsToShield
        );
      } catch (error: any) {
        console.log(`  [${id}]: ❌ Error: ${error?.message || error}`);
      }
    }
  }

  // ─────────────────────────────────────────
  // CLAIM REWARDS
  // ─────────────────────────────────────────

  async claimRewards(walletIds: number[]): Promise<void> {
    console.log(`\n💎 Claiming rewards for ${walletIds.length} wallet(s)...`);

    for (const id of walletIds) {
      try {
        const keypair = this.walletManager.getKeypair(id);
        const program = await this.getProgram(keypair);

        const [playerPDA] = this.getPlayerPDA(keypair.publicKey);
        const [gameConfigPDA] = this.getGameConfigPDA();

        const gameConfig = await (program.account as any).gameConfig.fetch(gameConfigPDA);
        const playerTokenAccount = this.getAssociatedTokenAddress(this.config.tokenMint, keypair.publicKey);

        await program.methods
          .claimRewards()
          .accountsPartial({
            playerAccount: playerPDA,
            player: keypair.publicKey,
            playerTokenAccount,
            rewardPoolVault: gameConfig.rewardPoolVault,
            gameConfig: gameConfigPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();

        console.log(`  [${id}]: ✅ Rewards claimed`);
        
        await this.sendActionToBackend(
          `claim_${Date.now()}_${id}`,
          'claim',
          keypair.publicKey.toString()
        );
      } catch (error: any) {
        console.log(`  [${id}]: ❌ Error: ${error?.message || error}`);
      }
    }
  }

  // ─────────────────────────────────────────
  // STEAL PROPERTY
  // ─────────────────────────────────────────

  async stealProperty(attackerWalletId: number, propertyId: number): Promise<boolean> {
    const propConfig = this.config.getPropertyConfig(propertyId);
    console.log(`\n⚔️ Attempting steal on Property ${propertyId} (${propConfig?.name || "Unknown"})...`);

    try {
      const attackerKeypair = this.walletManager.getKeypair(attackerWalletId);
      const program = await this.getProgram(attackerKeypair);

      const [propertyPDA] = this.getPropertyPDA(propertyId);
      const [attackerPlayerPDA] = this.getPlayerPDA(attackerKeypair.publicKey);
      const [gameConfigPDA] = this.getGameConfigPDA();
      const [stealRequestPDA] = this.getStealRequestPDA(attackerKeypair.publicKey, propertyId);

      const gameConfig = await (program.account as any).gameConfig.fetch(gameConfigPDA);
      const property = await (program.account as any).property.fetch(propertyPDA);

      // Find a target (first owner that's not the attacker)
      let targetWallet: PublicKey | null = null;
      
      for (let i = 0; i < 50; i++) {
        const testWallet = this.walletManager.getWallet(i);
        if (!testWallet || testWallet.keypair.publicKey.equals(attackerKeypair.publicKey)) continue;
        
        const [ownershipPDA] = this.getOwnershipPDA(testWallet.keypair.publicKey, propertyId);
        try {
          const ownership = await (program.account as any).propertyOwnership.fetch(ownershipPDA);
          if (ownership.slotsOwned > 0) {
            targetWallet = testWallet.keypair.publicKey;
            break;
          }
        } catch {
          // No ownership
        }
      }

      if (!targetWallet) {
        console.log(`  ❌ No valid target found for property ${propertyId}`);
        return false;
      }

      const attackerTokenAccount = this.getAssociatedTokenAddress(this.config.tokenMint, attackerKeypair.publicKey);
      const targetTokenAccount = this.getAssociatedTokenAddress(this.config.tokenMint, targetWallet);
      const devTokenAccount = this.getAssociatedTokenAddress(this.config.tokenMint, gameConfig.devWallet);
      const marketingTokenAccount = this.getAssociatedTokenAddress(this.config.tokenMint, gameConfig.marketingWallet);

      const [targetPlayerPDA] = this.getPlayerPDA(targetWallet);
      const [attackerOwnershipPDA] = this.getOwnershipPDA(attackerKeypair.publicKey, propertyId);
      const [targetOwnershipPDA] = this.getOwnershipPDA(targetWallet, propertyId);

      // Generate random seed
      const userRandomness = new Uint8Array(32);
      crypto.getRandomValues(userRandomness);

      const tx = await program.methods
        .stealPropertyInstant(Array.from(userRandomness))
        .accountsPartial({
          property: propertyPDA,
          player_account: attackerPlayerPDA,
          player_token_account: attackerTokenAccount,
          reward_pool_vault: gameConfig.rewardPoolVault,
          dev_token_account: devTokenAccount,
          marketing_token_account: marketingTokenAccount,
          game_config: gameConfigPDA,
          slot_hashes: new PublicKey("SysvarS1otHashes111111111111111111111111111"),
          attacker: attackerKeypair.publicKey,
          token_program: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts([
          { pubkey: targetWallet, isWritable: false, isSigner: false },
          { pubkey: targetPlayerPDA, isWritable: true, isSigner: false },
          { pubkey: targetTokenAccount, isWritable: true, isSigner: false },
          { pubkey: attackerOwnershipPDA, isWritable: true, isSigner: false },
          { pubkey: targetOwnershipPDA, isWritable: true, isSigner: false },
        ])
        .rpc();

      // Check if steal was successful (parse logs)
      const txDetails = await this.connection.getTransaction(tx, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      const success = txDetails?.meta?.logMessages?.some(log => 
        log.includes("StealSuccessEvent") || log.includes("steal_success")
      ) || false;

      if (success) {
        console.log(`  [${attackerWalletId}]: ✅ Steal successful!`);
      } else {
        console.log(`  [${attackerWalletId}]: ❌ Steal failed (bad luck)`);
      }

      await this.sendActionToBackend(
        tx,
        success ? 'steal_success' : 'steal_failed',
        attackerKeypair.publicKey.toString(),
        propertyId,
        targetWallet.toString(),
        undefined,
        1,
        success
      );

      return success;
    } catch (error: any) {
      console.log(`  [${attackerWalletId}]: ❌ Error: ${error?.message || error}`);
      return false;
    }
  }

  // ─────────────────────────────────────────
  // INFO COMMANDS
  // ─────────────────────────────────────────

  async getWalletInfo(walletId: number): Promise<void> {
    try {
      const wallet = this.walletManager.getWallet(walletId);
      if (!wallet) {
        console.log(`\n❌ Wallet ${walletId} not found`);
        return;
      }

      const keypair = wallet.keypair;
      const program = await this.getProgram(keypair);

      console.log(`\n📊 Wallet ${walletId} Info`);
      console.log(`   Name: ${wallet.name || "Unnamed"}`);
      console.log(`   Address: ${wallet.publicKey}`);

      // SOL balance
      const solBalance = await this.connection.getBalance(keypair.publicKey);
      console.log(`   SOL: ${(solBalance / anchor.web3.LAMPORTS_PER_SOL).toFixed(4)}`);

      // Token balance
      try {
        const tokenAccount = this.getAssociatedTokenAddress(this.config.tokenMint, keypair.publicKey);
        const tokenBalance = await this.connection.getTokenAccountBalance(tokenAccount);
        console.log(`   Tokens: ${(Number(tokenBalance.value.amount) / 1e9).toFixed(2)}`);
      } catch {
        console.log(`   Tokens: No token account`);
      }

      // Player account
      const [playerPDA] = this.getPlayerPDA(keypair.publicKey);
      try {
        const playerAccount = await (program.account as any).playerAccount.fetch(playerPDA);
        console.log(`\n   Player Stats:`);
        console.log(`     Total slots: ${playerAccount.totalSlotsOwned}`);
        console.log(`     Properties: ${playerAccount.propertiesOwnedCount}`);
        console.log(`     Complete sets: ${playerAccount.completeSetsOwned}`);
        console.log(`     Pending rewards: ${(Number(playerAccount.pendingRewards) / 1e9).toFixed(4)}`);
        console.log(`     Total claimed: ${(Number(playerAccount.totalRewardsClaimed) / 1e9).toFixed(2)}`);
      } catch {
        console.log(`\n   Player: Not initialized`);
      }

      // Properties owned
      console.log(`\n   Properties Owned:`);
      let hasProperties = false;
      for (let propId = 0; propId < 22; propId++) {
        const [ownershipPDA] = this.getOwnershipPDA(keypair.publicKey, propId);
        try {
          const ownership = await (program.account as any).propertyOwnership.fetch(ownershipPDA);
          if (ownership.slotsOwned > 0) {
            hasProperties = true;
            const propConfig = this.config.getPropertyConfig(propId);
            console.log(`     [${propId}] ${propConfig?.name || "Unknown"}: ${ownership.slotsOwned} slots`);
            if (ownership.shieldedSlots > 0) {
              console.log(`          🛡️ ${ownership.shieldedSlots} shielded`);
            }
          }
        } catch {
          // No ownership
        }
      }
      if (!hasProperties) {
        console.log(`     None`);
      }
    } catch (error: any) {
      console.log(`\n❌ Error: ${error?.message || error}`);
    }
  }

  async getPropertyInfo(propertyId: number): Promise<void> {
    try {
      const keypair = Keypair.generate(); // Dummy for read-only
      const program = await this.getProgram(keypair);

      const [propertyPDA] = this.getPropertyPDA(propertyId);
      const propConfig = this.config.getPropertyConfig(propertyId);

      const property = await (program.account as any).property.fetch(propertyPDA);

      console.log(`\n🏠 Property ${propertyId}: ${propConfig?.name || "Unknown"}`);
      console.log(`   Set: ${this.config.setNames[propConfig?.setId || 0]} (${propConfig?.setId})`);
      console.log(`   Price: ${(property.price / 1e9).toFixed(2)} tokens`);
      console.log(`   Slots: ${property.slotsSold} / ${property.maxSlotsPerProperty}`);
      console.log(`   Owners: ${property.uniqueOwners}`);
      console.log(`   Yield: ${property.yieldPercentBps / 100}%`);
      console.log(`   Shield cost: ${property.shieldCostPercentBps / 100}%`);
    } catch (error: any) {
      console.log(`\n❌ Error fetching property ${propertyId}: ${error?.message || error}`);
    }
  }

  async getGameConfig(): Promise<void> {
    try {
      const keypair = Keypair.generate();
      const program = await this.getProgram(keypair);

      const [gameConfigPDA] = this.getGameConfigPDA();
      const gameConfig = await (program.account as any).gameConfig.fetch(gameConfigPDA);

      console.log(`\n⚙️ Game Configuration`);
      console.log(`   Authority: ${gameConfig.authority.toString()}`);
      console.log(`   Token mint: ${gameConfig.tokenMint.toString()}`);
      console.log(`   Paused: ${gameConfig.gamePaused === 1 ? "Yes" : "No"}`);
      console.log(`   Steal chance: ${gameConfig.stealChanceBps / 100}%`);
      console.log(`\n   Fee splits:`);
      console.log(`     Reward pool: ${gameConfig.rewardPoolShareBps / 100}%`);
      console.log(`     Dev: ${gameConfig.devShareBps / 100}%`);
      console.log(`     Marketing: ${gameConfig.marketingShareBps / 100}%`);
    } catch (error: any) {
      console.log(`\n❌ Error: ${error?.message || error}`);
    }
  }

  // ─────────────────────────────────────────
  // BACKEND LOGGING
  // ─────────────────────────────────────────

  private async sendActionToBackend(
    txSignature: string,
    actionType: string,
    playerAddress: string,
    propertyId?: number,
    targetAddress?: string,
    amount?: number,
    slots?: number,
    success: boolean = true
  ): Promise<void> {
    try {
      const response = await fetch(`${this.config.backendUrl}/api/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txSignature,
          actionType,
          playerAddress,
          propertyId,
          targetAddress,
          amount,
          slots,
          success,
          blockTime: Math.floor(Date.now() / 1000)
        })
      });

      if (!response.ok) {
        // Silent fail for backend logging
      }
    } catch {
      // Silent fail
    }
  }
}