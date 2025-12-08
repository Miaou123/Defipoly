// ============================================
// FILE: defipoly-backend/src/services/airdropService.js
// Auto gas on connect + one-click claim with devnet verification
// Uses sqlite3 (callback-based) - NOT better-sqlite3
// ============================================

const { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} = require('@solana/web3.js');
const { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount
} = require('@solana/spl-token');
const bs58 = require('bs58');
const { getDatabase } = require('../config/database');

// ========== CONFIGURATION ==========
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';

// Airdrop amounts
const GAS_AIRDROP_AMOUNT = 0.01 * LAMPORTS_PER_SOL;  // Auto-sent on connect
const SOL_AIRDROP_AMOUNT = 0.5 * LAMPORTS_PER_SOL;   // Sent after verification
const TOKEN_AIRDROP_AMOUNT = 10_000_000 * 1e9;       // 10M tokens

// Cooldown: 24 hours per wallet
const AIRDROP_COOLDOWN_MS = 24 * 60 * 60 * 1000;

class AirdropService {
  constructor() {
    this.connection = new Connection(RPC_URL, 'confirmed');
    this.funderKeypair = null;
    this.funderTokenAccount = null;
    this.tokenMint = null;
  }

  async initialize(privateKeyBase58) {
    try {
      if (!process.env.TOKEN_MINT) {
        console.error('❌ [AIRDROP] TOKEN_MINT not set in environment');
        return false;
      }
      this.tokenMint = new PublicKey(process.env.TOKEN_MINT);

      const secretKey = bs58.decode(privateKeyBase58);
      this.funderKeypair = Keypair.fromSecretKey(secretKey);
      
      console.log(`💰 [AIRDROP] Funder wallet: ${this.funderKeypair.publicKey.toString()}`);
      
      this.funderTokenAccount = await getAssociatedTokenAddress(
        this.tokenMint,
        this.funderKeypair.publicKey
      );
      
      const solBalance = await this.connection.getBalance(this.funderKeypair.publicKey);
      console.log(`   SOL Balance: ${solBalance / LAMPORTS_PER_SOL} SOL`);
      
      try {
        const tokenAccount = await getAccount(this.connection, this.funderTokenAccount);
        console.log(`   Token Balance: ${Number(tokenAccount.amount) / 1e9} tokens`);
      } catch {
        console.log('   ⚠️ Token account not found - create one and fund it');
      }
      
      console.log('✅ [AIRDROP] Service initialized');
      return true;
    } catch (error) {
      console.error('❌ [AIRDROP] Failed to initialize:', error.message);
      return false;
    }
  }

  isWhitelisted(walletAddress) {
    return new Promise((resolve) => {
      try {
        const db = getDatabase();
        db.get('SELECT wallet FROM airdrop_whitelist WHERE wallet = ?', [walletAddress], (err, row) => {
          resolve(!!row);
        });
      } catch {
        resolve(false);
      }
    });
  }

  // ========== DATABASE HELPERS (sqlite3 callback style) ==========
  
  getAirdropStatus(walletAddress) {
    return new Promise((resolve) => {
      try {
        const db = getDatabase();
        db.get('SELECT * FROM airdrop_history WHERE wallet = ?', [walletAddress], (err, row) => {
          if (err) {
            console.error('❌ [AIRDROP] Database read error:', err.message);
            resolve(null);
          } else {
            resolve(row || null);
          }
        });
      } catch (error) {
        console.error('❌ [AIRDROP] Database error:', error.message);
        resolve(null);
      }
    });
  }

  dbRun(sql, params) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(sql, params, function(err) {
        if (err) {
          console.error('❌ [AIRDROP] Database write error:', err.message);
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  dbGet(sql, params) {
    return new Promise((resolve) => {
      const db = getDatabase();
      db.get(sql, params, (err, row) => {
        if (err) {
          console.error('❌ [AIRDROP] Database read error:', err.message);
          resolve(null);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  // ========== AUTO GAS (called on connect) ==========
  
  async sendGasIfNeeded(recipientAddress) {
    if (!this.funderKeypair) {
      return { success: false, error: 'Service not initialized' };
    }

    if (!(await this.isWhitelisted(recipientAddress))) {
      return { success: false, error: 'Not whitelisted', needsGas: false };
    }

    const status = await this.getAirdropStatus(recipientAddress);
    
    // Already got gas and hasn't claimed yet
    if (status?.gas_sent && !status?.completed) {
      return { success: true, alreadySent: true, needsGas: false };
    }
    
    // Completed and still in cooldown
    if (status?.completed) {
      const cooldownRemaining = AIRDROP_COOLDOWN_MS - (Date.now() - status.completed_at);
      if (cooldownRemaining > 0) {
        return { success: false, error: 'Cooldown active', needsGas: false };
      }
    }

    // Send gas
    const recipient = new PublicKey(recipientAddress);
    console.log(`\n⛽ [AIRDROP] Auto-sending gas to ${recipientAddress.slice(0, 8)}...`);

    try {
      const solTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.funderKeypair.publicKey,
          toPubkey: recipient,
          lamports: GAS_AIRDROP_AMOUNT,
        })
      );
      
      const signature = await sendAndConfirmTransaction(
        this.connection,
        solTx,
        [this.funderKeypair]
      );
      console.log(`   ✅ Gas sent: ${signature}`);

      // Record in database (sqlite3 callback style)
      await this.dbRun(`
        INSERT INTO airdrop_history (wallet, gas_sent, gas_signature, gas_sent_at, completed)
        VALUES (?, 1, ?, ?, 0)
        ON CONFLICT(wallet) DO UPDATE SET
          gas_sent = 1,
          gas_signature = excluded.gas_signature,
          gas_sent_at = excluded.gas_sent_at,
          completed = 0
      `, [recipientAddress, signature, Date.now()]);

      return { success: true, signature, amount: GAS_AIRDROP_AMOUNT / LAMPORTS_PER_SOL };

    } catch (error) {
      console.error(`❌ [AIRDROP] Gas send failed:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // ========== CLAIM: VERIFY TX & SEND TOKENS ==========
  
  async verifyAndClaimTokens(recipientAddress, txSignature) {
    if (!this.funderKeypair) {
      return { success: false, error: 'Airdrop service not initialized' };
    }

    if (!(await this.isWhitelisted(recipientAddress))) {
      return { success: false, error: 'Not whitelisted' };
    }

    const status = await this.getAirdropStatus(recipientAddress);
    
    // Must have received gas
    if (!status?.gas_sent) {
      return { success: false, error: 'Gas not received yet. Please reconnect your wallet.' };
    }
    
    // Check if already completed and in cooldown
    if (status?.completed) {
      const cooldownRemaining = AIRDROP_COOLDOWN_MS - (Date.now() - status.completed_at);
      if (cooldownRemaining > 0) {
        const hours = Math.ceil(cooldownRemaining / 1000 / 60 / 60);
        return { success: false, error: `Already claimed. Try again in ${hours} hours.` };
      }
    }

    console.log(`\n🔍 [AIRDROP] Verifying tx ${txSignature.slice(0, 8)}... for ${recipientAddress.slice(0, 8)}...`);

    try {
      // Verify transaction exists on devnet and is from the correct wallet
      const tx = await this.connection.getTransaction(txSignature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      if (!tx) {
        return { 
          success: false, 
          error: 'Transaction not found on Devnet. Please make sure your wallet is set to Devnet and try again.' 
        };
      }

      // Verify the transaction was signed by the recipient
      const signers = tx.transaction.message.staticAccountKeys || tx.transaction.message.accountKeys;
      const signerAddresses = signers.map(k => k.toString());
      
      if (!signerAddresses.includes(recipientAddress)) {
        return { success: false, error: 'Transaction was not signed by your wallet.' };
      }

      // Check transaction is recent (within last hour)
      const txTime = tx.blockTime ? tx.blockTime * 1000 : 0;
      if (Date.now() - txTime > 60 * 60 * 1000) {
        return { success: false, error: 'Transaction is too old. Please send a new transaction.' };
      }

      console.log(`   ✅ Transaction verified on Devnet!`);

      // Send tokens + SOL
      const recipient = new PublicKey(recipientAddress);
      
      // Send SOL
      console.log(`   📤 Sending ${SOL_AIRDROP_AMOUNT / LAMPORTS_PER_SOL} SOL...`);
      const solTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.funderKeypair.publicKey,
          toPubkey: recipient,
          lamports: SOL_AIRDROP_AMOUNT,
        })
      );
      
      const solSignature = await sendAndConfirmTransaction(
        this.connection,
        solTx,
        [this.funderKeypair]
      );
      console.log(`   ✅ SOL sent: ${solSignature}`);

      // Send tokens
      console.log(`   📤 Sending ${TOKEN_AIRDROP_AMOUNT / 1e9} tokens...`);
      const recipientTokenAccount = await getAssociatedTokenAddress(this.tokenMint, recipient);
      
      const tokenTx = new Transaction();
      
      try {
        await getAccount(this.connection, recipientTokenAccount);
      } catch {
        console.log(`   📝 Creating token account...`);
        tokenTx.add(
          createAssociatedTokenAccountInstruction(
            this.funderKeypair.publicKey,
            recipientTokenAccount,
            recipient,
            this.tokenMint
          )
        );
      }
      
      tokenTx.add(
        createTransferInstruction(
          this.funderTokenAccount,
          recipientTokenAccount,
          this.funderKeypair.publicKey,
          BigInt(TOKEN_AIRDROP_AMOUNT)
        )
      );
      
      const tokenSignature = await sendAndConfirmTransaction(
        this.connection,
        tokenTx,
        [this.funderKeypair]
      );
      console.log(`   ✅ Tokens sent: ${tokenSignature}`);

      // Update database (sqlite3 callback style)
      await this.dbRun(`
        UPDATE airdrop_history SET
          completed = 1,
          completed_at = ?,
          verification_tx = ?,
          sol_signature = ?,
          token_signature = ?,
          sol_amount = ?,
          token_amount = ?
        WHERE wallet = ?
      `, [
        Date.now(),
        txSignature,
        solSignature,
        tokenSignature,
        SOL_AIRDROP_AMOUNT / LAMPORTS_PER_SOL,
        TOKEN_AIRDROP_AMOUNT / 1e9,
        recipientAddress
      ]);

      console.log(`✅ [AIRDROP] Complete for ${recipientAddress.slice(0, 8)}...`);

      return {
        success: true,
        solSignature,
        tokenSignature,
        solAmount: SOL_AIRDROP_AMOUNT / LAMPORTS_PER_SOL,
        tokenAmount: TOKEN_AIRDROP_AMOUNT / 1e9,
      };

    } catch (error) {
      console.error(`❌ [AIRDROP] Claim failed:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // ========== CHECK STATUS ==========
  
  async checkEligibility(walletAddress) {
    const isWhitelisted = await this.isWhitelisted(walletAddress);
    const status = await this.getAirdropStatus(walletAddress);
    
    let step = 'waiting_gas';
    let canClaim = false;
    let message = 'Preparing your test tokens...';
    
    if (!isWhitelisted) {
      step = 'not_whitelisted';
      message = 'Wallet not whitelisted for test phase';
    } else if (status?.completed) {
      const cooldownRemaining = AIRDROP_COOLDOWN_MS - (Date.now() - status.completed_at);
      if (cooldownRemaining > 0) {
        step = 'completed';
        const hours = Math.ceil(cooldownRemaining / 1000 / 60 / 60);
        message = `Already claimed! Next claim in ${hours} hours`;
      } else {
        step = 'can_claim';
        canClaim = true;
        message = 'Cooldown expired. Claim again!';
      }
    } else if (status?.gas_sent) {
      step = 'can_claim';
      canClaim = true;
      message = 'Click "Claim Tokens" to receive 0.5 SOL + 10M tokens';
    }
    
    return {
      wallet: walletAddress,
      isWhitelisted,
      step,
      canClaim,
      message,
      gasReceived: status?.gas_sent || false,
      completed: status?.completed || false,
    };
  }

  async getStatus() {
    if (!this.funderKeypair) {
      return { initialized: false };
    }

    const solBalance = await this.connection.getBalance(this.funderKeypair.publicKey);
    let tokenBalance = 0;
    
    try {
      const tokenAccount = await getAccount(this.connection, this.funderTokenAccount);
      tokenBalance = Number(tokenAccount.amount) / 1e9;
    } catch {}

    let airdropsSent = 0;
    try {
      const row = await this.dbGet('SELECT COUNT(*) as count FROM airdrop_history WHERE completed = 1', []);
      airdropsSent = row ? row.count : 0;
    } catch {}

    return {
      initialized: true,
      funderWallet: this.funderKeypair.publicKey.toString(),
      solBalance: solBalance / LAMPORTS_PER_SOL,
      tokenBalance,
      whitelistCount: WHITELIST.size,
      airdropsSent,
    };
  }
}

const airdropService = new AirdropService();

module.exports = { airdropService, AirdropService };