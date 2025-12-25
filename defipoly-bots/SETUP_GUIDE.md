# Defipoly Bot Setup Guide

## Prerequisites

1. Node.js v16+ and npm
2. Solana CLI tools installed
3. Access to the Defipoly program (built and deployed)
4. A funded Solana wallet

## Installation

1. **Navigate to the bot directory**:
   ```bash
   cd defipoly-bots
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update:
   - `ANCHOR_WALLET`: Path to your funded Solana wallet
   - `TOKEN_MINT`: Your token mint address
   - `ANCHOR_PROVIDER_URL`: RPC endpoint (default is devnet)
   - `BACKEND_URL`: Backend API URL for logging actions

## Important Path Configuration

Since the bots are now in a separate directory, ensure the IDL path in `bot-interactions.ts` points to the correct location:

```typescript
const IDL_PATH = path.join(PROJECT_ROOT, "../defipoly/defipoly-program/target/idl/defipoly_program.json");
```

If your program is in a different location, update this path accordingly.

## Running the Bots

1. **Complete setup (recommended for first time)**:
   ```bash
   ./batch-bot-operations.sh setup-all
   ```
   
   This will:
   - Create 50 test wallets
   - Fund them with SOL
   - Create token accounts
   - Transfer tokens to each wallet
   - Initialize all players

2. **Individual commands**:
   ```bash
   # Setup wallets and fund them
   npm run bot:setup
   
   # Initialize players
   npm run bot:init
   
   # Buy properties
   npm run bot buy <propertyId> <slots> <walletIds...>
   
   # Activate shields
   npm run bot shield <propertyId> <slots> <walletIds...>
   
   # Claim rewards
   npm run bot:claim
   
   # Check wallet info
   npm run bot info <walletId>
   ```

## Test Scenarios

Run predefined test scenarios:

```bash
# Basic testing
./batch-bot-operations.sh scenario 1

# Full board distribution
./batch-bot-operations.sh scenario 2

# Complete set purchase
./batch-bot-operations.sh scenario 3

# Shield & rewards flow
./batch-bot-operations.sh scenario 4

# Steal cooldown testing
./batch-bot-operations.sh scenario 5
```

## Troubleshooting

### Program IDL not found
- Ensure the Defipoly program is built: `cd ../defipoly/defipoly-program && anchor build`
- Check the IDL path in `bot-interactions.ts`

### Insufficient SOL
- Re-run setup to top up wallets: `npm run bot:setup`

### Token mint mismatch
- Update `TOKEN_MINT` in your `.env` file
- Ensure it matches the token used by the Defipoly program

### Backend connection failed
- Check if the backend is running
- Verify `BACKEND_URL` in your `.env` file

## Directory Structure

```
defipoly-bots/
├── .env                    # Environment configuration
├── .gitignore             # Git ignore rules
├── package.json           # Node dependencies
├── tsconfig.json          # TypeScript config
├── README.md              # Bot testing guide
├── SETUP_GUIDE.md         # This file
├── bot-interactions.ts    # Main bot logic
├── setup-test-wallets.ts  # Wallet setup script
├── batch-bot-operations.sh # Batch operations
├── test-bot-suite.sh      # Test suite
├── verify-setup.sh        # Setup verification
└── test-wallets/          # Generated test wallets (gitignored)
```