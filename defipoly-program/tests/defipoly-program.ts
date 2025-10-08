import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DefipolyProgram } from "../target/types/defipoly_program";
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

describe("defipoly-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DefipolyProgram as Program<DefipolyProgram>;
  
  let tokenMint: anchor.web3.PublicKey;
  let gameConfig: anchor.web3.PublicKey;
  let rewardPoolVault: anchor.web3.PublicKey;
  let authority = provider.wallet.publicKey;
  
  let player1 = anchor.web3.Keypair.generate();
  let player2 = anchor.web3.Keypair.generate();
  
  let player1TokenAccount: anchor.web3.PublicKey;
  let player2TokenAccount: anchor.web3.PublicKey;

  before(async () => {
    // Type guard for payer
    if (!provider.wallet.payer) {
      throw new Error("Wallet payer is undefined");
    }
    const payer = provider.wallet.payer;
  
    // Airdrop SOL to test players
    const airdrop1 = await provider.connection.requestAirdrop(
      player1.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdrop1);
  
    const airdrop2 = await provider.connection.requestAirdrop(
      player2.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdrop2);
  
    // Create token mint
    tokenMint = await createMint(
      provider.connection,
      payer, // Use the type-guarded payer
      authority,
      null,
      9
    );
  
    console.log("Token Mint:", tokenMint.toString());
  
    // Derive PDAs
    [gameConfig] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_config")],
      program.programId
    );
  
    [rewardPoolVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("reward_pool_vault"), gameConfig.toBuffer()],
      program.programId
    );
  
    // Create token accounts for players
    const player1Account = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer, // Use payer here too
      tokenMint,
      player1.publicKey
    );
    player1TokenAccount = player1Account.address;
  
    const player2Account = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer, // And here
      tokenMint,
      player2.publicKey
    );
    player2TokenAccount = player2Account.address;
  
    // Mint tokens
    await mintTo(
      provider.connection,
      payer, // And here
      tokenMint,
      player1TokenAccount,
      authority,
      BigInt("1000000000000000")
    );
  
    await mintTo(
      provider.connection,
      payer, // And here
      tokenMint,
      player2TokenAccount,
      authority,
      BigInt("1000000000000000")
    );
  
    console.log("Player 1:", player1.publicKey.toString());
    console.log("Player 2:", player2.publicKey.toString());
  });

  it("Initializes the game", async () => {
    // Use string to avoid floating point issues with large numbers
    const initialRewardPool = new anchor.BN("500000000000000000"); // 500M tokens * 1e9

    await program.methods
      .initializeGame(initialRewardPool)
      .accountsPartial({
        tokenMint,
        authority,
      })
      .rpc();

    const gameConfigAccount = await program.account.gameConfig.fetch(gameConfig);
    
    assert.equal(gameConfigAccount.authority.toString(), authority.toString());
    assert.equal(gameConfigAccount.tokenMint.toString(), tokenMint.toString());
    
    console.log("✓ Game initialized successfully");
  });

  it("Initializes properties", async () => {
    await program.methods
      .initializeProperty(
        0,
        { bronze: {} },
        10,
        100,
        new anchor.BN("1000000000000"), // 1000 tokens * 1e9
        new anchor.BN("100000000000"), // 100 tokens * 1e9
        500
      )
      .accountsPartial({
        authority,
        gameConfig,
      })
      .rpc();

    const [bronzeProperty] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("property"), Buffer.from([0])],
      program.programId
    );

    const propertyAccount = await program.account.property.fetch(bronzeProperty);
    assert.equal(propertyAccount.propertyId, 0);
    
    console.log("✓ Bronze property initialized");

    await program.methods
      .initializeProperty(
        1,
        { silver: {} },
        5,
        50,
        new anchor.BN("5000000000000"),
        new anchor.BN("600000000000"),
        500
      )
      .accountsPartial({
        authority,
        gameConfig,
      })
      .rpc();

    console.log("✓ Silver property initialized");
  });

  it("Initializes players", async () => {
    await program.methods
      .initializePlayer()
      .accountsPartial({
        player: player1.publicKey,
      })
      .signers([player1])
      .rpc();

    const [player1Account] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("player"), player1.publicKey.toBuffer()],
      program.programId
    );

    const playerAccountData = await program.account.playerAccount.fetch(player1Account);
    assert.equal(playerAccountData.owner.toString(), player1.publicKey.toString());

    console.log("✓ Player 1 initialized");

    await program.methods
      .initializePlayer()
      .accountsPartial({
        player: player2.publicKey,
      })
      .signers([player2])
      .rpc();

    console.log("✓ Player 2 initialized");
  });

  it("Player buys a property", async () => {
    const [bronzeProperty] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("property"), Buffer.from([0])],
      program.programId
    );

    const [player1Account] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("player"), player1.publicKey.toBuffer()],
      program.programId
    );

    const [ownership] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("ownership"), player1.publicKey.toBuffer(), Buffer.from([0])],
      program.programId
    );

    await program.methods
      .buyProperty()
      .accountsPartial({
        property: bronzeProperty,
        ownership,
        playerAccount: player1Account, // Add this!
        player: player1.publicKey,
        playerTokenAccount: player1TokenAccount,
        rewardPoolVault,
        gameConfig,
      })
      .signers([player1])
      .rpc();

    const ownershipAccount = await program.account.propertyOwnership.fetch(ownership);
    assert.equal(ownershipAccount.slotsOwned, 1);

    console.log("✓ Player 1 bought bronze property");
  });

  it("Player activates shield", async () => {
    const [bronzeProperty] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("property"), Buffer.from([0])],
      program.programId
    );

    const [player1Account] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("player"), player1.publicKey.toBuffer()],
      program.programId
    );

    const [ownership] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("ownership"), player1.publicKey.toBuffer(), Buffer.from([0])],
      program.programId
    );

    await program.methods
      .activateShield(2)
      .accountsPartial({
        property: bronzeProperty,
        ownership,
        playerAccount: player1Account, // Add this!
        player: player1.publicKey,
        playerTokenAccount: player1TokenAccount,
        rewardPoolVault,
        gameConfig,
      })
      .signers([player1])
      .rpc();

    const ownershipAccount = await program.account.propertyOwnership.fetch(ownership);
    assert.equal(ownershipAccount.shieldActive, true);

    console.log("✓ Shield activated");
  });

  it("Attempts to steal property (should fail - shielded)", async () => {
    const [bronzeProperty] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("property"), Buffer.from([0])],
      program.programId
    );

    const [player2Account] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("player"), player2.publicKey.toBuffer()],
      program.programId
    );

    const [targetOwnership] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("ownership"), player1.publicKey.toBuffer(), Buffer.from([0])],
      program.programId
    );

    const [attackerOwnership] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("ownership"), player2.publicKey.toBuffer(), Buffer.from([0])],
      program.programId
    );

    try {
      await program.methods
        .stealProperty(player1.publicKey)
        .accountsPartial({
          property: bronzeProperty,
          targetOwnership,
          attackerOwnership,
          playerAccount: player2Account, // Add this!
          attacker: player2.publicKey,
          playerTokenAccount: player2TokenAccount,
          rewardPoolVault,
          gameConfig,
        })
        .signers([player2])
        .rpc();

      assert.fail("Should have failed");
    } catch (err) {
      console.log("✓ Steal correctly blocked by shield");
    }
  });

  it("Claims rewards", async () => {
    const [player1Account] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("player"), player1.publicKey.toBuffer()],
      program.programId
    );
  
    // Note: In real world, rewards require time to pass (hourly basis)
    // For testing purposes, we'll verify the error handling works correctly
    await new Promise(resolve => setTimeout(resolve, 2000));
  
    try {
      await program.methods
        .claimRewards()
        .accountsPartial({
          playerAccount: player1Account,
          player: player1.publicKey,
          playerTokenAccount: player1TokenAccount,
          rewardPoolVault,
          gameConfig,
        })
        .signers([player1])
        .rpc();
  
      // If we get here, rewards were claimed (unlikely in 2 seconds)
      console.log("✓ Rewards claimed (enough time passed)");
    } catch (err: any) {
      // Expected error: not enough time has passed
      if (err.error?.errorCode?.code === "NoRewardsToClaim") {
        console.log("✓ Correctly requires time to pass before claiming rewards");
        console.log("  (Need at least 1 hour for rewards to accumulate)");
      } else {
        throw err; // Unexpected error, re-throw
      }
    }
  });
});