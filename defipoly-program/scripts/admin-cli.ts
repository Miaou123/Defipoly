// ============================================
// FILE: defipoly-program/scripts/admin-cli.ts
// Interactive Admin CLI for Defipoly Game Management (Readline Version)
// Run with: npx tsx scripts/admin-cli.ts
// ============================================

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import BN from 'bn.js';
import * as readline from 'readline';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// ============================================
// CONFIGURATION
// ============================================

const RPC_URL = process.env.ANCHOR_PROVIDER_URL || 'https://api.devnet.solana.com';
const WALLET_PATH = process.env.ANCHOR_WALLET || path.join(homedir(), '.config/solana/id.json');

// ============================================
// READLINE HELPER
// ============================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function validatePublicKey(input: string): boolean {
  try {
    new PublicKey(input);
    return true;
  } catch {
    return false;
  }
}

function validateNumber(input: string, min: number = 0, max: number = Infinity): boolean {
  const num = parseFloat(input);
  return !isNaN(num) && num >= min && num <= max;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function loadWallet(): Keypair {
  const keypairData = fs.readFileSync(WALLET_PATH, 'utf-8');
  return Keypair.fromSecretKey(Buffer.from(JSON.parse(keypairData)));
}

function loadProgram(): { program: Program; connection: Connection; authority: Keypair } {
  const connection = new Connection(RPC_URL, 'confirmed');
  const authority = loadWallet();
  const wallet = new anchor.Wallet(authority);
  
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  anchor.setProvider(provider);

  const idlPath = path.join(__dirname, '../target/idl/defipoly_program.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  
  const program = new anchor.Program(idl, provider);
  
  return { program, connection, authority };
}

function getGameConfigPDA(programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('game_config')],
    programId
  );
  return pda;
}

function getPropertyPDA(programId: PublicKey, propertyId: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('property'), Buffer.from([propertyId])],
    programId
  );
  return pda;
}

function getOwnershipPDA(programId: PublicKey, player: PublicKey, propertyId: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('ownership'),
      player.toBuffer(),
      Buffer.from([propertyId])
    ],
    programId
  );
  return pda;
}

function getPlayerPDA(programId: PublicKey, player: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('player'), player.toBuffer()],
    programId
  );
  return pda;
}

// ============================================
// ADMIN COMMANDS
// ============================================

async function grantProperty(propertyId: number, playerAddress: string, slots: number) {
  console.log('\n🎁 ADMIN: Grant Property');
  console.log('='.repeat(70));
  
  const { program, connection, authority } = loadProgram();
  const programId = program.programId;
  const gameConfig = getGameConfigPDA(programId);
  const targetPlayer = new PublicKey(playerAddress);
  
  const propertyPDA = getPropertyPDA(programId, propertyId);
  const ownershipPDA = getOwnershipPDA(programId, targetPlayer, propertyId);
  const playerPDA = getPlayerPDA(programId, targetPlayer);

  console.log(`Property ID: ${propertyId}`);
  console.log(`Player: ${playerAddress}`);
  console.log(`Slots: ${slots}`);
  console.log(`\nSending transaction...`);

  try {
    const tx = await program.methods
      .adminGrantProperty(targetPlayer, slots)
      .accounts({
        property: propertyPDA,
        ownership: ownershipPDA,
        playerAccount: playerPDA,
        gameConfig: gameConfig,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    console.log(`✅ Success!`);
    console.log(`Transaction: ${tx}`);
  } catch (error: any) {
    console.error(`❌ Error:`, error.message || error);
    throw error;
  }
}

async function revokeProperty(propertyId: number, playerAddress: string, slots: number) {
  console.log('\n🚫 ADMIN: Revoke Property');
  console.log('='.repeat(70));
  
  const { program, connection, authority } = loadProgram();
  const programId = program.programId;
  const gameConfig = getGameConfigPDA(programId);
  const targetPlayer = new PublicKey(playerAddress);
  
  const propertyPDA = getPropertyPDA(programId, propertyId);
  const ownershipPDA = getOwnershipPDA(programId, targetPlayer, propertyId);
  const playerPDA = getPlayerPDA(programId, targetPlayer);

  console.log(`Property ID: ${propertyId}`);
  console.log(`Player: ${playerAddress}`);
  console.log(`Slots: ${slots}`);
  console.log(`\nSending transaction...`);

  try {
    const tx = await program.methods
      .adminRevokeProperty(slots)
      .accounts({
        property: propertyPDA,
        ownership: ownershipPDA,
        playerAccount: playerPDA,
        gameConfig: gameConfig,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log(`✅ Success!`);
    console.log(`Transaction: ${tx}`);
  } catch (error: any) {
    console.error(`❌ Error:`, error.message || error);
    throw error;
  }
}

async function grantShield(playerAddress: string, durationHours: number) {
  console.log('\n🛡️  ADMIN: Grant Shield');
  console.log('='.repeat(70));
  
  const { program, connection, authority } = loadProgram();
  const programId = program.programId;
  const gameConfig = getGameConfigPDA(programId);
  const targetPlayer = new PublicKey(playerAddress);

  console.log(`Player: ${playerAddress}`);
  console.log(`Duration: ${durationHours} hours`);
  console.log(`\nFinding ownership accounts...`);

  try {
    const accounts = await connection.getProgramAccounts(programId, {
      filters: [
        {
          dataSize: 110,
        },
        {
          memcmp: {
            offset: 8,
            bytes: targetPlayer.toBase58(),
          }
        }
      ]
    });

    if (accounts.length === 0) {
      console.log('⚠️  Player has no properties to shield');
      return;
    }

    console.log(`Found ${accounts.length} properties to shield...`);

    for (const { pubkey, account } of accounts) {
      try {
        const propertyId = account.data.readUInt8(40);
        
        const tx = await program.methods
          .adminGrantShield(durationHours)
          .accounts({
            ownership: pubkey,
            gameConfig: gameConfig,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();

        console.log(`✅ Shielded property ${propertyId}: ${tx}`);
      } catch (error: any) {
        console.error(`❌ Failed to shield ownership ${pubkey.toBase58()}:`, error.message);
      }
    }

    console.log(`\n✅ Shield granted to all properties!`);
  } catch (error: any) {
    console.error(`❌ Error:`, error.message || error);
    throw error;
  }
}

async function adjustBalance(playerAddress: string, amount: number) {
  console.log('\n💰 ADMIN: Adjust Player Balance');
  console.log('='.repeat(70));
  
  const { program, connection, authority } = loadProgram();
  const programId = program.programId;
  const gameConfig = getGameConfigPDA(programId);
  const targetPlayer = new PublicKey(playerAddress);
  
  const playerPDA = getPlayerPDA(programId, targetPlayer);

  console.log(`Player: ${playerAddress}`);
  console.log(`Amount: ${amount} (${amount > 0 ? 'ADD' : 'SUBTRACT'})`);
  console.log(`\nSending transaction...`);

  try {
    // Convert to raw adjustment value (i64)
    const adjustment = new BN(amount);

    const tx = await program.methods
      .adminAdjustRewards(adjustment)
      .accounts({
        playerAccount: playerPDA,
        gameConfig: gameConfig,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log(`✅ Success!`);
    console.log(`Transaction: ${tx}`);
  } catch (error: any) {
    console.error(`❌ Error:`, error.message || error);
    throw error;
  }
}

async function updateCooldown(propertyId: number, durationMinutes: number) {
  console.log('\n⏱️  ADMIN: Update Property Cooldown');
  console.log('='.repeat(70));
  
  const { program, connection, authority } = loadProgram();
  const programId = program.programId;
  const gameConfig = getGameConfigPDA(programId);
  
  const propertyPDA = getPropertyPDA(programId, propertyId);

  console.log(`Property ID: ${propertyId}`);
  console.log(`New Cooldown: ${durationMinutes} minutes`);
  console.log(`\nSending transaction...`);

  try {
    const tx = await program.methods
      .adminUpdateCooldown(propertyId, new BN(durationMinutes * 60))
      .accounts({
        property: propertyPDA,
        gameConfig: gameConfig,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log(`✅ Success!`);
    console.log(`Transaction: ${tx}`);
  } catch (error: any) {
    console.error(`❌ Error:`, error.message || error);
    throw error;
  }
}

async function emergencyWithdraw(amount: number, destinationAddress: string) {
  console.log('\n🚨 ADMIN: Emergency Withdraw');
  console.log('='.repeat(70));
  
  const { program, connection, authority } = loadProgram();
  const programId = program.programId;
  const gameConfig = getGameConfigPDA(programId);
  
  const deploymentPath = path.join(__dirname, 'deployment-info.json');
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
  const tokenMint = new PublicKey(deployment.tokenMint);
  
  const [rewardPoolVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('reward_pool_vault'), gameConfig.toBuffer()],
    programId
  );
  
  const destination = new PublicKey(destinationAddress);

  console.log(`Amount: ${amount} tokens`);
  console.log(`Destination: ${destinationAddress}`);
  console.log(`\nSending transaction...`);

  try {
    const tx = await program.methods
      .adminEmergencyWithdraw(new BN(amount * 1e9))
      .accounts({
        rewardPoolVault: rewardPoolVault,
        destinationAccount: destination,
        gameConfig: gameConfig,
        authority: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([authority])
      .rpc();

    console.log(`✅ Success!`);
    console.log(`Transaction: ${tx}`);
  } catch (error: any) {
    console.error(`❌ Error:`, error.message || error);
    throw error;
  }
}

async function transferAuthority(newAuthorityAddress: string) {
  console.log('\n👑 ADMIN: Transfer Authority');
  console.log('='.repeat(70));
  
  const { program, connection, authority } = loadProgram();
  const programId = program.programId;
  const gameConfig = getGameConfigPDA(programId);
  const newAuthority = new PublicKey(newAuthorityAddress);

  console.log(`Current Authority: ${authority.publicKey.toBase58()}`);
  console.log(`New Authority: ${newAuthorityAddress}`);
  console.log(`\nSending transaction...`);

  try {
    const tx = await program.methods
      .adminTransferAuthority(newAuthority)
      .accounts({
        gameConfig: gameConfig,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log(`✅ Authority transferred!`);
    console.log(`Transaction: ${tx}`);
  } catch (error: any) {
    console.error(`❌ Error:`, error.message || error);
    throw error;
  }
}

async function clearBuyCooldown(playerAddress: string, setId: number) {
  console.log('\n⏱️  ADMIN: Clear Buy Cooldown');
  console.log('='.repeat(70));
  
  const { program, connection, authority } = loadProgram();
  const programId = program.programId;
  const gameConfig = getGameConfigPDA(programId);
  const targetPlayer = new PublicKey(playerAddress);

  // Derive set cooldown PDA
  const [setCooldownPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('cooldown'), targetPlayer.toBuffer(), Buffer.from([setId])],
    programId
  );

  console.log(`Player: ${playerAddress}`);
  console.log(`Set ID: ${setId}`);
  console.log(`\nSending transaction...`);

  try {
    const tx = await program.methods
      .adminClearCooldown()
      .accounts({
        setCooldown: setCooldownPDA,
        gameConfig: gameConfig,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log(`✅ Success!`);
    console.log(`Transaction: ${tx}`);
  } catch (error: any) {
    console.error(`❌ Error:`, error.message || error);
    throw error;
  }
}

async function clearStealCooldown(playerAddress: string, propertyId: number) {
  console.log('\n⏱️  ADMIN: Clear Steal Cooldown');
  console.log('='.repeat(70));
  
  const { program, connection, authority } = loadProgram();
  const programId = program.programId;
  const gameConfig = getGameConfigPDA(programId);
  const targetPlayer = new PublicKey(playerAddress);

  // Derive steal cooldown PDA
  const [stealCooldownPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('steal_cooldown'), targetPlayer.toBuffer(), Buffer.from([propertyId])],
    programId
  );

  console.log(`Player: ${playerAddress}`);
  console.log(`Property ID: ${propertyId}`);
  console.log(`\nSending transaction...`);

  try {
    const tx = await program.methods
      .adminClearStealCooldown()
      .accounts({
        stealCooldown: stealCooldownPDA,
        gameConfig: gameConfig,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log(`✅ Success!`);
    console.log(`Transaction: ${tx}`);
  } catch (error: any) {
    console.error(`❌ Error:`, error.message || error);
    throw error;
  }
}

async function updatePropertyYield(propertyId: number, yieldBps: number) {
  console.log('\n📈 ADMIN: Update Property Yield');
  console.log('='.repeat(70));
  
  const { program, connection, authority } = loadProgram();
  const programId = program.programId;
  const gameConfig = getGameConfigPDA(programId);
  
  const propertyPDA = getPropertyPDA(programId, propertyId);

  console.log(`Property ID: ${propertyId}`);
  console.log(`New Yield: ${yieldBps} bps (${yieldBps / 100}%)`);
  console.log(`\nSending transaction...`);

  try {
    const tx = await program.methods
      .adminUpdatePropertyYield(propertyId, yieldBps)
      .accounts({
        property: propertyPDA,
        gameConfig: gameConfig,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log(`✅ Success!`);
    console.log(`Transaction: ${tx}`);
  } catch (error: any) {
    console.error(`❌ Error:`, error.message || error);
    throw error;
  }
}

async function updateShieldCost(propertyId: number, shieldCostBps: number) {
  console.log('\n🛡️  ADMIN: Update Shield Cost');
  console.log('='.repeat(70));
  
  const { program, connection, authority } = loadProgram();
  const programId = program.programId;
  const gameConfig = getGameConfigPDA(programId);
  
  const propertyPDA = getPropertyPDA(programId, propertyId);

  console.log(`Property ID: ${propertyId}`);
  console.log(`New Shield Cost: ${shieldCostBps} bps (${shieldCostBps / 100}%)`);
  console.log(`\nSending transaction...`);

  try {
    const tx = await program.methods
      .adminUpdateShieldCost(propertyId, shieldCostBps)
      .accounts({
        property: propertyPDA,
        gameConfig: gameConfig,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log(`✅ Success!`);
    console.log(`Transaction: ${tx}`);
  } catch (error: any) {
    console.error(`❌ Error:`, error.message || error);
    throw error;
  }
}

async function pauseGame() {
  console.log('\n⏸️  ADMIN: Pause Game');
  console.log('='.repeat(70));
  
  const { program, connection, authority } = loadProgram();
  const programId = program.programId;
  const gameConfig = getGameConfigPDA(programId);

  console.log(`\nSending transaction...`);

  try {
    const tx = await program.methods
      .pauseGame()
      .accounts({
        gameConfig: gameConfig,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log(`✅ Game paused!`);
    console.log(`Transaction: ${tx}`);
  } catch (error: any) {
    console.error(`❌ Error:`, error.message || error);
    throw error;
  }
}

async function unpauseGame() {
  console.log('\n▶️  ADMIN: Unpause Game');
  console.log('='.repeat(70));
  
  const { program, connection, authority } = loadProgram();
  const programId = program.programId;
  const gameConfig = getGameConfigPDA(programId);

  console.log(`\nSending transaction...`);

  try {
    const tx = await program.methods
      .unpauseGame()
      .accounts({
        gameConfig: gameConfig,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log(`✅ Game unpaused!`);
    console.log(`Transaction: ${tx}`);
  } catch (error: any) {
    console.error(`❌ Error:`, error.message || error);
    throw error;
  }
}

async function closePlayerAccount(playerAddress: string) {
  console.log('\n🗑️  ADMIN: Close Player Account');
  console.log('='.repeat(70));
  
  const { program, connection, authority } = loadProgram();
  const programId = program.programId;
  const gameConfig = getGameConfigPDA(programId);
  const targetPlayer = new PublicKey(playerAddress);
  
  const playerPDA = getPlayerPDA(programId, targetPlayer);

  console.log(`Player: ${playerAddress}`);
  console.log(`\nSending transaction...`);

  try {
    const accountInfo = await connection.getAccountInfo(playerPDA);
    if (!accountInfo) {
      console.log('⚠️  Account does not exist');
      return;
    }

    console.log(`💰 Rent to recover: ${(accountInfo.lamports / 1e9).toFixed(6)} SOL`);

    const tx = await program.methods
      .adminClosePlayerAccount()
      .accounts({
        playerAccount: playerPDA,
        gameConfig: gameConfig,
        authority: authority.publicKey,
        rentReceiver: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log(`✅ Account closed!`);
    console.log(`Transaction: ${tx}`);
  } catch (error: any) {
    console.error(`❌ Error:`, error.message || error);
    throw error;
  }
}

// ============================================
// INTERACTIVE MENU
// ============================================

async function showMenu() {
  console.clear();
  console.log('\n🎮 DEFIPOLY ADMIN CLI');
  console.log('='.repeat(70));
  console.log(`RPC: ${RPC_URL}`);
  console.log(`Wallet: ${WALLET_PATH}`);
  console.log('='.repeat(70));
  console.log('\n📋 PROPERTY MANAGEMENT');
  console.log('  1. 🎁 Grant Property Slots');
  console.log('  2. 🚫 Revoke Property Slots');
  console.log('  3. 🛡️  Grant Shield (Single Property)');
  console.log('\n⏱️  COOLDOWN MANAGEMENT');
  console.log('  4. 🔓 Clear Buy Cooldown');
  console.log('  5. 🔓 Clear Steal Cooldown');
  console.log('  6. ⏱️  Update Property Cooldown Duration');
  console.log('\n⚙️  PROPERTY CONFIGURATION');
  console.log('  7. 📈 Update Property Yield');
  console.log('  8. 🛡️  Update Property Shield Cost');
  console.log('\n🌍 GAME CONTROL');
  console.log('  9. ⏸️  Pause Game');
  console.log(' 10. ▶️  Unpause Game');
  console.log('\n🚨 EMERGENCY');
  console.log(' 11. 💸 Emergency Withdraw');
  console.log(' 12. 👑 Transfer Authority');
  console.log(' 13. 🗑️  Close Player Account');
  console.log('\n  0. ❌ Exit');
  console.log('');
}

async function main() {
  while (true) {
    try {
      await showMenu();
      const choice = await question('Enter your choice (0-13): ');

      if (choice === '0') {
        console.log('\n👋 Goodbye!\n');
        rl.close();
        process.exit(0);
      }

      switch (choice) {
        case '1': {
          console.log('\n🎁 Grant Property Slots');
          console.log('-'.repeat(70));
          
          let propertyId: string;
          do {
            propertyId = await question('Property ID (0-21): ');
            if (!validateNumber(propertyId, 0, 21)) {
              console.log('❌ Invalid property ID (must be 0-21)');
            }
          } while (!validateNumber(propertyId, 0, 21));

          let playerAddress: string;
          do {
            playerAddress = await question('Player wallet address: ');
            if (!validatePublicKey(playerAddress)) {
              console.log('❌ Invalid Solana address');
            }
          } while (!validatePublicKey(playerAddress));

          let slots: string;
          do {
            slots = await question('Number of slots: ');
            if (!validateNumber(slots, 1)) {
              console.log('❌ Must be a positive number');
            }
          } while (!validateNumber(slots, 1));

          await grantProperty(parseInt(propertyId), playerAddress, parseInt(slots));
          break;
        }

        case '2': {
          console.log('\n🚫 Revoke Property Slots');
          console.log('-'.repeat(70));
          
          let propertyId: string;
          do {
            propertyId = await question('Property ID (0-21): ');
            if (!validateNumber(propertyId, 0, 21)) {
              console.log('❌ Invalid property ID (must be 0-21)');
            }
          } while (!validateNumber(propertyId, 0, 21));

          let playerAddress: string;
          do {
            playerAddress = await question('Player wallet address: ');
            if (!validatePublicKey(playerAddress)) {
              console.log('❌ Invalid Solana address');
            }
          } while (!validatePublicKey(playerAddress));

          let slots: string;
          do {
            slots = await question('Number of slots: ');
            if (!validateNumber(slots, 1)) {
              console.log('❌ Must be a positive number');
            }
          } while (!validateNumber(slots, 1));

          await revokeProperty(parseInt(propertyId), playerAddress, parseInt(slots));
          break;
        }

        case '3': {
          console.log('\n🛡️  Grant Shield');
          console.log('-'.repeat(70));
          
          let playerAddress: string;
          do {
            playerAddress = await question('Player wallet address: ');
            if (!validatePublicKey(playerAddress)) {
              console.log('❌ Invalid Solana address');
            }
          } while (!validatePublicKey(playerAddress));

          let hours: string;
          do {
            hours = await question('Duration (hours, max 168): ');
            if (!validateNumber(hours, 1, 168)) {
              console.log('❌ Must be 1-168 hours');
            }
          } while (!validateNumber(hours, 1, 168));

          await grantShield(playerAddress, parseInt(hours));
          break;
        }

        case '4': {
          console.log('\n🔓 Clear Buy Cooldown');
          console.log('-'.repeat(70));
          
          let playerAddress: string;
          do {
            playerAddress = await question('Player wallet address: ');
            if (!validatePublicKey(playerAddress)) {
              console.log('❌ Invalid Solana address');
            }
          } while (!validatePublicKey(playerAddress));

          let setId: string;
          do {
            setId = await question('Set ID (0-7): ');
            if (!validateNumber(setId, 0, 7)) {
              console.log('❌ Invalid set ID (must be 0-7)');
            }
          } while (!validateNumber(setId, 0, 7));

          await clearBuyCooldown(playerAddress, parseInt(setId));
          break;
        }

        case '5': {
          console.log('\n🔓 Clear Steal Cooldown');
          console.log('-'.repeat(70));
          
          let playerAddress: string;
          do {
            playerAddress = await question('Player wallet address: ');
            if (!validatePublicKey(playerAddress)) {
              console.log('❌ Invalid Solana address');
            }
          } while (!validatePublicKey(playerAddress));

          let propertyId: string;
          do {
            propertyId = await question('Property ID (0-21): ');
            if (!validateNumber(propertyId, 0, 21)) {
              console.log('❌ Invalid property ID (must be 0-21)');
            }
          } while (!validateNumber(propertyId, 0, 21));

          await clearStealCooldown(playerAddress, parseInt(propertyId));
          break;
        }

        case '6': {
          console.log('\n⏱️  Update Property Cooldown');
          console.log('-'.repeat(70));
          
          let propertyId: string;
          do {
            propertyId = await question('Property ID (0-21): ');
            if (!validateNumber(propertyId, 0, 21)) {
              console.log('❌ Invalid property ID (must be 0-21)');
            }
          } while (!validateNumber(propertyId, 0, 21));

          let minutes: string;
          do {
            minutes = await question('Cooldown duration (minutes): ');
            if (!validateNumber(minutes, 0)) {
              console.log('❌ Must be a non-negative number');
            }
          } while (!validateNumber(minutes, 0));

          await updateCooldown(parseInt(propertyId), parseInt(minutes));
          break;
        }

        case '7': {
          console.log('\n📈 Update Property Yield');
          console.log('-'.repeat(70));
          
          let propertyId: string;
          do {
            propertyId = await question('Property ID (0-21): ');
            if (!validateNumber(propertyId, 0, 21)) {
              console.log('❌ Invalid property ID (must be 0-21)');
            }
          } while (!validateNumber(propertyId, 0, 21));

          let yieldBps: string;
          do {
            yieldBps = await question('Yield in bps (e.g., 1500 = 15%): ');
            if (!validateNumber(yieldBps, 0, 10000)) {
              console.log('❌ Must be 0-10000 bps');
            }
          } while (!validateNumber(yieldBps, 0, 10000));

          await updatePropertyYield(parseInt(propertyId), parseInt(yieldBps));
          break;
        }

        case '8': {
          console.log('\n🛡️  Update Shield Cost');
          console.log('-'.repeat(70));
          
          let propertyId: string;
          do {
            propertyId = await question('Property ID (0-21): ');
            if (!validateNumber(propertyId, 0, 21)) {
              console.log('❌ Invalid property ID (must be 0-21)');
            }
          } while (!validateNumber(propertyId, 0, 21));

          let shieldCostBps: string;
          do {
            shieldCostBps = await question('Shield cost in bps (e.g., 500 = 5%): ');
            if (!validateNumber(shieldCostBps, 0, 10000)) {
              console.log('❌ Must be 0-10000 bps');
            }
          } while (!validateNumber(shieldCostBps, 0, 10000));

          await updateShieldCost(parseInt(propertyId), parseInt(shieldCostBps));
          break;
        }

        case '9': {
          console.log('\n⏸️  Pause Game');
          console.log('-'.repeat(70));
          
          const confirm = await question('Pause the entire game? (yes/no): ');
          if (confirm.toLowerCase() === 'yes') {
            await pauseGame();
          } else {
            console.log('❌ Cancelled');
          }
          break;
        }

        case '10': {
          console.log('\n▶️  Unpause Game');
          console.log('-'.repeat(70));
          
          const confirm = await question('Unpause the game? (yes/no): ');
          if (confirm.toLowerCase() === 'yes') {
            await unpauseGame();
          } else {
            console.log('❌ Cancelled');
          }
          break;
        }

        case '11': {
          console.log('\n🚨 Emergency Withdraw');
          console.log('-'.repeat(70));
          
          let amount: string;
          do {
            amount = await question('Amount to withdraw (tokens): ');
            if (!validateNumber(amount, 0)) {
              console.log('❌ Must be a positive number');
            }
          } while (!validateNumber(amount, 0));

          let destination: string;
          do {
            destination = await question('Destination wallet address: ');
            if (!validatePublicKey(destination)) {
              console.log('❌ Invalid Solana address');
            }
          } while (!validatePublicKey(destination));

          const confirm = await question('⚠️  Withdraw from reward pool? (yes/no): ');
          if (confirm.toLowerCase() === 'yes') {
            await emergencyWithdraw(parseFloat(amount), destination);
          } else {
            console.log('❌ Cancelled');
          }
          break;
        }

        case '12': {
          console.log('\n👑 Transfer Authority');
          console.log('-'.repeat(70));
          
          let newAuthority: string;
          do {
            newAuthority = await question('New authority wallet address: ');
            if (!validatePublicKey(newAuthority)) {
              console.log('❌ Invalid Solana address');
            }
          } while (!validatePublicKey(newAuthority));

          const confirm = await question('⚠️  Transfer ALL admin control? (yes/no): ');
          if (confirm.toLowerCase() === 'yes') {
            await transferAuthority(newAuthority);
          } else {
            console.log('❌ Cancelled');
          }
          break;
        }

        case '13': {
          console.log('\n🗑️  Close Player Account');
          console.log('-'.repeat(70));
          
          let playerAddress: string;
          do {
            playerAddress = await question('Player wallet address: ');
            if (!validatePublicKey(playerAddress)) {
              console.log('❌ Invalid Solana address');
            }
          } while (!validatePublicKey(playerAddress));

          const confirm = await question('Close account and recover rent? (yes/no): ');
          if (confirm.toLowerCase() === 'yes') {
            await closePlayerAccount(playerAddress);
          } else {
            console.log('❌ Cancelled');
          }
          break;
        }

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

      if (choice === '0') {
        console.log('\n👋 Goodbye!\n');
        rl.close();
        process.exit(0);
      }

      switch (choice) {
        case '1': {
          console.log('\n🎁 Grant Property Slots');
          console.log('-'.repeat(70));
          
          let propertyId: string;
          do {
            propertyId = await question('Property ID (0-21): ');
            if (!validateNumber(propertyId, 0, 21)) {
              console.log('❌ Invalid property ID (must be 0-21)');
            }
          } while (!validateNumber(propertyId, 0, 21));

          let playerAddress: string;
          do {
            playerAddress = await question('Player wallet address: ');
            if (!validatePublicKey(playerAddress)) {
              console.log('❌ Invalid Solana address');
            }
          } while (!validatePublicKey(playerAddress));

          let slots: string;
          do {
            slots = await question('Number of slots: ');
            if (!validateNumber(slots, 1)) {
              console.log('❌ Must be a positive number');
            }
          } while (!validateNumber(slots, 1));

          await grantProperty(parseInt(propertyId), playerAddress, parseInt(slots));
          break;
        }

        case '2': {
          console.log('\n🚫 Revoke Property Slots');
          console.log('-'.repeat(70));
          
          let propertyId: string;
          do {
            propertyId = await question('Property ID (0-21): ');
            if (!validateNumber(propertyId, 0, 21)) {
              console.log('❌ Invalid property ID (must be 0-21)');
            }
          } while (!validateNumber(propertyId, 0, 21));

          let playerAddress: string;
          do {
            playerAddress = await question('Player wallet address: ');
            if (!validatePublicKey(playerAddress)) {
              console.log('❌ Invalid Solana address');
            }
          } while (!validatePublicKey(playerAddress));

          let slots: string;
          do {
            slots = await question('Number of slots: ');
            if (!validateNumber(slots, 1)) {
              console.log('❌ Must be a positive number');
            }
          } while (!validateNumber(slots, 1));

          await revokeProperty(parseInt(propertyId), playerAddress, parseInt(slots));
          break;
        }

        case '3': {
          console.log('\n🛡️  Grant Shield');
          console.log('-'.repeat(70));
          
          let playerAddress: string;
          do {
            playerAddress = await question('Player wallet address: ');
            if (!validatePublicKey(playerAddress)) {
              console.log('❌ Invalid Solana address');
            }
          } while (!validatePublicKey(playerAddress));

          let hours: string;
          do {
            hours = await question('Duration (hours): ');
            if (!validateNumber(hours, 1)) {
              console.log('❌ Must be a positive number');
            }
          } while (!validateNumber(hours, 1));

          await grantShield(playerAddress, parseInt(hours));
          break;
        }

        case '4': {
          console.log('\n💰 Adjust Player Balance');
          console.log('-'.repeat(70));
          
          let playerAddress: string;
          do {
            playerAddress = await question('Player wallet address: ');
            if (!validatePublicKey(playerAddress)) {
              console.log('❌ Invalid Solana address');
            }
          } while (!validatePublicKey(playerAddress));

          const operation = await question('Add or subtract? (add/sub): ');
          
          let amount: string;
          do {
            amount = await question('Amount (tokens): ');
            if (!validateNumber(amount, 0)) {
              console.log('❌ Must be a positive number');
            }
          } while (!validateNumber(amount, 0));

          const finalAmount = operation.toLowerCase().startsWith('sub') 
            ? -parseFloat(amount) 
            : parseFloat(amount);

          await adjustBalance(playerAddress, finalAmount);
          break;
        }

        case '5': {
          console.log('\n⏱️  Update Property Cooldown');
          console.log('-'.repeat(70));
          
          let propertyId: string;
          do {
            propertyId = await question('Property ID (0-21): ');
            if (!validateNumber(propertyId, 0, 21)) {
              console.log('❌ Invalid property ID (must be 0-21)');
            }
          } while (!validateNumber(propertyId, 0, 21));

          let minutes: string;
          do {
            minutes = await question('Cooldown duration (minutes): ');
            if (!validateNumber(minutes, 0)) {
              console.log('❌ Must be a non-negative number');
            }
          } while (!validateNumber(minutes, 0));

          await updateCooldown(parseInt(propertyId), parseInt(minutes));
          break;
        }

        case '6': {
          console.log('\n🚨 Emergency Withdraw');
          console.log('-'.repeat(70));
          
          let amount: string;
          do {
            amount = await question('Amount to withdraw (tokens): ');
            if (!validateNumber(amount, 0)) {
              console.log('❌ Must be a positive number');
            }
          } while (!validateNumber(amount, 0));

          let destination: string;
          do {
            destination = await question('Destination wallet address: ');
            if (!validatePublicKey(destination)) {
              console.log('❌ Invalid Solana address');
            }
          } while (!validatePublicKey(destination));

          const confirm = await question('⚠️  Withdraw from reward pool? (yes/no): ');
          if (confirm.toLowerCase() === 'yes') {
            await emergencyWithdraw(parseFloat(amount), destination);
          } else {
            console.log('❌ Cancelled');
          }
          break;
        }

        case '7': {
          console.log('\n👑 Transfer Authority');
          console.log('-'.repeat(70));
          
          let newAuthority: string;
          do {
            newAuthority = await question('New authority wallet address: ');
            if (!validatePublicKey(newAuthority)) {
              console.log('❌ Invalid Solana address');
            }
          } while (!validatePublicKey(newAuthority));

          const confirm = await question('⚠️  Transfer ALL admin control? (yes/no): ');
          if (confirm.toLowerCase() === 'yes') {
            await transferAuthority(newAuthority);
          } else {
            console.log('❌ Cancelled');
          }
          break;
        }

        case '8': {
          console.log('\n🗑️  Close Player Account');
          console.log('-'.repeat(70));
          
          let playerAddress: string;
          do {
            playerAddress = await question('Player wallet address: ');
            if (!validatePublicKey(playerAddress)) {
              console.log('❌ Invalid Solana address');
            }
          } while (!validatePublicKey(playerAddress));

          const confirm = await question('Close account and recover rent? (yes/no): ');
          if (confirm.toLowerCase() === 'yes') {
            await closePlayerAccount(playerAddress);
          } else {
            console.log('❌ Cancelled');
          }
          break;
        }

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

main();