// scripts/close-player-accounts.ts
// Closes old player accounts using the admin_close_player_account instruction
// Run with: npx ts-node scripts/close-player-accounts.ts

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';

// All the old player accounts (69 bytes)
const OLD_ACCOUNTS = [
  '6TvG9x811qZiyRSayi115gvxjWzGE4NPgzPoLERT7kDm',
  'AnStbdF5cejJxVAH3Rg4VBXMi9aiFL6tUntqbkYK19qt',
  'Feg2A9XsDtWwAs5Di1FHxiB2o4aSUc9g7wZSWrE62r9B',
  'EUBG5ytsTSF1TdR1rs6uxLejNowvhDJYZWjHzdf74d2W',
  'Er82g6uzzFB3iAxhXMPwrnRiMoci63AdDm5SfT6bDiwq',
  'FcP2765PpwJNQSiF33X886CCxmWAJTJPNp7fLAmhJ7X9',
  '6iFXGzqEarwJaVBFE6XkXro4HxFfPKcmzeHUyBYBPJA3',
  '6npgZL34idhVUja8aa29ZhWH1NY7s3kg1fuzyiJpyeJk',
  '2CjjMbGVW2W1h6wWKh4siRvai3Vc1aUwyCe63TKvm8Zp',
  'GQKMPwao45Y1jqHv3dXc3buK3tKEAqDuNzEeF7GzxXYZ',
  'EmRC5nFoGUmFx4K3xhG5vjNVJMC4ZGg5seeENBUFWcFd',
  'FbkM4VQxnLqjtVCiAzMshmTHjbf7NEQGwPuMvLtcgTv3',
  '2TZt9uCvSWcG1PRNbYXcVvG6WGUeGUSUVaPWz5PBYpip',
  '3BEtfQq8HdBfMxJjv7RsjpoeWmf5rKXX4D5XVuR1fiLH',
  'GSGQBjAdh9LjBzCzFN1SDXTFNa8dfSdfYwuHMVASW3Nb',
  'AN51JbNnSwNWXN243Rgmvzjdn8vz9CusdSSX6QhkgpLF',
  '7CYWkcQhoMQ7o9fUcFg9LttdkPqvkpMDYL5w5YwbaTQW',
  'EscTVr5BrLbriv48JyvxG1oFBF5GtkZitxL6VUu2U7c5',
  'osgb9BvDDgRbCQsFm4MeU3k34Vx8ci7EhGGte4SquCk',
  'Dh8BecnJ1mAjTBvgUUhTzhPNDyAvZGzaHGBPjmQV6bXw',
  '7y9JU4zMKpsNC2QKkbYfsqNZGFZFG87i5UHURTACr5Q2',
  '4vnohBgJAofXm3NgjbPktyhNo1ynk6m8vpe3g3gg5sPU',
  '8XPMYHESjbRDC4qGUGE8B6y2yEnDvU14fUisQbTJByKF',
  'EEDWiZSXgiFSgAD3MUVzdZugfJhgPGfDVEUwXgkmxDDq',
  'F4WYMKUboCW7PTuHvmt6ZyGch81oruntEg2ibC229GbD',
  'E3MKRFdHw6Rx5qy6Qfyo8f7fTTewUAmKHKTiW8ynbuto',
  '4Edpxisy5w1jJDqPiPNB4dfH1VeHtb4b481YAfftXZHY',
  '9hkibcZ8CVGPkZVWaqezHMz1aaCu3A3JLvVA3pL6E1iA',
  '6s8PCe5nyaH8pLjAKfJbLFF2sy96GryFZbchbMGKkjrT',
  'DZRoQoWgphMLLLJBfcuuzMCwhe2TAVuea76xQVWsczmT',
  '6EfsmFeAh1X22r2aJ4rJ7xrv6mTdFdeFBHBHmjKCj7Qx',
  'CiPf3NrARUQ4rFeJAWWt7KG1QYuqpFAkNUFiPeHBfDmS',
  '67u9dkw8XAABthKqoqVW3ij21P7SV2GhjfmVbdCHtJPG',
  '1L6rBbPT8QiKnizcTTzzvuuHokPsnDRqnh8KWi65w9i',
  '3hjGw73jbHr13VwJE4r7iD5yrfcqRW6SGkoWBTsRLGfV',
  '38PWPuDXPiExUwUP6houZ6oWJA9kzFCoaaJpWwF86g8z',
  '42dgYk8LVr5E74bfw1kuhe9x8hutwJxGBWd2RY4YfnEp',
  'Fa5MBKAVQSEr7y5AwKhWDetgRkveM4F8Cy8hJBruy1X9',
  'BzuufozDGSep1B9LVJLSpFwdxdawMfQ8SjQXzr8dtJPb',
  '9T428MGZuybuRtAAPz71fRixVUcdgJXtJm323TZZjjFp',
  '4VsQyLr3iH1Xu7nZ2N6WCCtQKJ8mzzGSFtPYDaS3UQty',
  'ANqyK17tU7pWBHGmi6ydmVRgXFgnY1qRcQBech4yw9ad',
  'ApqhoWSEQvPgFQ7rGtRMonjQk8d2Lo6dTHaNMcgJMPjK',
  'GpG2mCBmfGH1hbTmKet6WhgrFCKZvT14rVHTvikEPKpo',
  'FdSxFbr9ZiD8TFJ2TnEB8gfGFCtZ7atwzC3svznxas3B',
  '3V5uapgWP5JCRvWxHzqvjPbCHEaroRxpjkwckmAWh55V',
  'J8B4nFmzXaP1sJdHGP1oe5g5dgbyDgSutGzq6phj8hBH',
  'E3LvYoe4tTKMvEjHxFbwzyvbdNHb8fpseyuzjV1z31ZW',
  'HHzi7mebC1RnG1DL8aD4YokVFsufZwsHkaJyjHFpCUBj',
  'FnroZgQP6Ayo1RcAJaSXRfZv6EzqYNYigvJ7UwXvEWMs',
  'Cw2vJ7ouui9v32gZxk4GXFQqhBaBg3RUKbFtSpYsUNiV',
];

async function closeAccount(
  program: Program,
  gameConfig: PublicKey,
  playerAccountPubkey: PublicKey,
  authority: Keypair,
  rentReceiver: PublicKey
): Promise<boolean> {
  try {
    const connection = program.provider.connection;
    const accountInfo = await connection.getAccountInfo(playerAccountPubkey);
    
    if (!accountInfo) {
      console.log('   ⚠️  Account does not exist');
      return false;
    }

    // Get the owner from the account data for display purposes
    const ownerPubkey = new PublicKey(accountInfo.data.slice(8, 40));
    
    console.log(`   👤 Owner: ${ownerPubkey.toBase58()}`);
    console.log(`   💰 Rent: ${(accountInfo.lamports / 1e9).toFixed(6)} SOL`);

    // Call admin_close_player_account instruction (can close ANY account)
    const tx = await program.methods
      .adminClosePlayerAccount()
      .accounts({
        playerAccount: playerAccountPubkey,
        gameConfig: gameConfig,
        authority: authority.publicKey,
        rentReceiver: rentReceiver,
      })
      .signers([authority])
      .rpc();

    console.log(`   ✅ Closed! Transaction: ${tx}`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Error:`, error.message || error);
    return false;
  }
}

async function main() {
  console.log('🧹 Closing Old Player Accounts (Admin Mode)\n');
  console.log('=' .repeat(70));

  // Setup provider
  const connection = new Connection(RPC_URL, 'confirmed');
  const keypairFile = fs.readFileSync('/home/olivierb/.config/solana/id.json', 'utf-8');
  const wallet = Keypair.fromSecretKey(Buffer.from(JSON.parse(keypairFile)));
  
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: 'confirmed' }
  );
  anchor.setProvider(provider);

  // Load the program IDL
  const idl = JSON.parse(
    fs.readFileSync('./target/idl/defipoly_program.json', 'utf-8')
  );
  
  const program = new anchor.Program(idl as anchor.Idl, provider);
  
  // Get the program ID and game config PDA
  const programId = new PublicKey(idl.address || idl.metadata?.address);
  const [gameConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from('game_config')],
    programId
  );

  console.log(`📝 Program ID: ${programId.toBase58()}`);
  console.log(`🎮 Game Config: ${gameConfig.toBase58()}`);
  console.log(`💳 Admin Wallet: ${wallet.publicKey.toBase58()}`);
  
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 Current Balance: ${(balance / 1e9).toFixed(4)} SOL`);

  console.log(`\n📋 Processing ${OLD_ACCOUNTS.length} accounts\n`);

  let closedCount = 0;
  let skippedCount = 0;
  let totalRentRecovered = 0;

  for (let i = 0; i < OLD_ACCOUNTS.length; i++) {
    const accountAddress = OLD_ACCOUNTS[i];
    console.log(`\n[${i + 1}/${OLD_ACCOUNTS.length}] ${accountAddress}`);
    
    try {
      const pubkey = new PublicKey(accountAddress);
      const accountInfo = await connection.getAccountInfo(pubkey);
      
      if (!accountInfo) {
        console.log('   ⚠️  Already closed');
        continue;
      }

      const success = await closeAccount(
        program,
        gameConfig,
        pubkey,
        wallet,
        wallet.publicKey // Rent goes back to your wallet
      );

      if (success) {
        closedCount++;
        totalRentRecovered += accountInfo.lamports;
        // Wait a bit between transactions
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        skippedCount++;
      }
    } catch (error: any) {
      console.error(`   ❌ Error:`, error.message || error);
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Successfully closed: ${closedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Total rent recovered: ${(totalRentRecovered / 1e9).toFixed(4)} SOL`);

  const newBalance = await connection.getBalance(wallet.publicKey);
  console.log(`\n💰 New Balance: ${(newBalance / 1e9).toFixed(4)} SOL`);
  console.log(`   Gained: +${((newBalance - balance) / 1e9).toFixed(4)} SOL`);
}

main()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });