# 🤖 Defipoly Bot Testing Suite

Standalone bot testing system to simulate 50 players interacting with the Defipoly game. This suite has been extracted from the main program for better modularity.

## 📋 Quick Setup

```bash
# Install dependencies
npm install

# Copy and configure the .env file
cp .env.example .env
# Edit .env with your settings

# One command to set everything up
./batch-bot-operations.sh setup-all
```

This will:
- Generate/load 50 keypairs in `./test-wallets/`
- Transfer 0.1 SOL from your main wallet to each test wallet
- Create token accounts for each wallet
- Transfer 1,000,000 tokens to each wallet
- Initialize all 50 players

## 🎮 Using Bot Commands

All bot commands use npm scripts - no need for `tsx` or `npx`!

### Initialize Players

```bash
# Initialize all 50 players
npm run bot:init

# Initialize specific players (wallets 0, 1, 2, 3)
npm run bot init 0 1 2 3
```

### Buy Properties

```bash
# All wallets buy property 0 (Bronze Basic)
npm run bot buy 0 all

# Wallet 5 buys property 2 (Silver Basic)
npm run bot buy 2 5

# Multiple specific wallets buy Silver Basic
npm run bot buy 2 5 6 7 8 9

# Different properties for different groups
npm run bot buy 0 0 1 2 3 4      # Wallets 0-4 buy Bronze
npm run bot buy 2 5 6 7 8 9      # Wallets 5-9 buy Silver
npm run bot buy 4 10 11 12       # Wallets 10-12 buy Gold
```

### Activate Shields

```bash
# Wallet 5 activates shield for property 2
npm run bot shield 2 5

# Multiple wallets activate shields
npm run bot shield 2 5 6 7

# All wallets activate shield for property 0
npm run bot shield 0 all
```

### Claim Rewards

```bash
# All wallets claim rewards
npm run bot:claim

# Wallet 5 claims rewards
npm run bot claim 5

# Specific wallets claim
npm run bot claim 0 1 2 3 4
```

### Get Wallet Info

```bash
# Check info for wallet 5
npm run bot info 5

# Check multiple wallets (bash loop)
for i in {0..9}; do npm run bot info $i; done
```

## 🔥 Quick Batch Commands

### Using the Bash Script

```bash
# Complete setup (create wallets, fund, initialize)
./batch-bot-operations.sh setup-all

# Fill a property (all wallets buy it)
./batch-bot-operations.sh fill 0

# Distribute properties across all tiers
./batch-bot-operations.sh distribute

# Activate shields for a property
./batch-bot-operations.sh shields 0 all

# Claim all rewards
./batch-bot-operations.sh claim

# Check wallet status
./batch-bot-operations.sh status

# Detailed status (first 10 wallets)
./batch-bot-operations.sh detail

# Run test scenarios
./batch-bot-operations.sh scenario 1
```

## 📊 Test Scenarios

### Scenario 1: Basic Testing

```bash
./batch-bot-operations.sh scenario 1
```
All wallets buy Bronze Basic properties.

### Scenario 2: Mixed Distribution

```bash
./batch-bot-operations.sh scenario 2
```
Distributes properties across all tiers:
- 10 wallets → Bronze Basic
- 8 wallets → Bronze Plus
- 6 wallets → Silver Basic
- 5 wallets → Silver Plus
- 4 wallets → Gold Basic
- 3 wallets → Gold Plus
- 2 wallets → Platinum Basic
- 1 wallet → Platinum Elite

### Scenario 3: Competition Test

```bash
./batch-bot-operations.sh scenario 3
```
First 30 wallets compete for Gold Basic (only 4 properties with 40 total slots).

### Scenario 4: Shield & Rewards

```bash
./batch-bot-operations.sh scenario 4
```
Wallets 0-9 buy Bronze, wallets 0-4 activate shields, then claim rewards after 24h.

## 🎯 Property IDs Reference

- **0**: Bronze Basic (1,000 tokens, 100/day, 100 total slots)
- **1**: Bronze Plus (1,500 tokens, 150/day, 80 total slots)
- **2**: Silver Basic (5,000 tokens, 600/day, 60 total slots)
- **3**: Silver Plus (7,000 tokens, 850/day, 50 total slots)
- **4**: Gold Basic (15,000 tokens, 2,000/day, 40 total slots)
- **5**: Gold Plus (20,000 tokens, 2,700/day, 30 total slots)
- **6**: Platinum Basic (50,000 tokens, 7,000/day, 20 total slots)
- **7**: Platinum Elite (100,000 tokens, 15,000/day, 10 total slots)

## 📁 Wallet Files

All test wallets are stored in `./test-wallets/`:

```
test-wallets/
├── wallet-0.json       (Private keys - DO NOT COMMIT)
├── wallet-1.json
├── ...
├── wallet-49.json
└── summary.json        (Public addresses only)
```

Each wallet file contains:
```json
{
  "publicKey": "ABC123...",
  "secretKey": [1, 2, 3, ...]
}
```

## 🎮 Common Workflows

### Full Test Cycle
```bash
# 1. Setup everything
./batch-bot-operations.sh setup-all

# 2. Everyone buys Bronze Basic
./batch-bot-operations.sh fill 0

# 3. Check who got properties
./batch-bot-operations.sh status

# 4. Claim rewards
./batch-bot-operations.sh claim
```

### Individual Wallet Testing
```bash
# Wallet 5 buys Silver Basic
npm run bot buy 2 5

# Wallet 5 activates shield
npm run bot shield 2 5

# Check wallet 5 status
npm run bot info 5

# Wallet 5 claims rewards
npm run bot claim 5
```

### Load Testing (Competition)
```bash
# Everyone tries to buy Platinum Elite (only 10 slots!)
./batch-bot-operations.sh fill 7

# See who got in
./batch-bot-operations.sh status
```

### Property Diversity Test
```bash
# Spread wallets across all tiers
./batch-bot-operations.sh distribute

# Check distribution
./batch-bot-operations.sh detail
```

### Shield Testing
```bash
# Wallets 0-9 buy Bronze Basic
npm run bot buy 0 0 1 2 3 4 5 6 7 8 9

# Wallets 0-4 activate shields
npm run bot shield 0 0 1 2 3 4

# Check status
./batch-bot-operations.sh status
```

## 🛠️ Troubleshooting

### Insufficient SOL in Test Wallets

```bash
# Re-run setup to top up wallets with < 0.05 SOL
npm run bot:setup
```

### Insufficient Tokens

```bash
# Mint 50M tokens to your main wallet
npm run bot:mint

# Then re-run setup to distribute tokens
npm run bot:setup
```

### Check All Wallets

```bash
# Quick status summary
./batch-bot-operations.sh status

# Detailed check (first 10 wallets)
./batch-bot-operations.sh detail

# Export all wallet info to file
for i in {0..49}; do
  echo "=== Wallet $i ==="
  npm run bot info $i
  echo ""
done > wallet-status.txt
```

### Rate Limits

If you hit rate limits on devnet:
```bash
# Add delays between operations
for i in {0..49}; do
  npm run bot init $i
  sleep 1
done
```

### Reset Everything

```bash
# Delete all test wallets and start fresh
./batch-bot-operations.sh reset

# Then setup again
./batch-bot-operations.sh setup-all
```

## 🚀 Quick Command Reference

```bash
# Setup
npm run bot:setup        # Create/fund wallets and distribute tokens
npm run bot:mint         # Mint 50M tokens to main wallet
npm run bot:init         # Initialize all 50 players

# Individual wallet actions
npm run bot buy <propertyId> <walletId>     # Buy property
npm run bot shield <propertyId> <walletId>  # Activate shield
npm run bot claim <walletId>                 # Claim rewards
npm run bot info <walletId>                  # Check wallet status

# Batch actions
npm run bot buy <propertyId> all             # All wallets buy
npm run bot shield <propertyId> all          # All wallets shield
npm run bot:claim                             # All wallets claim

# Bash script helpers
./batch-bot-operations.sh setup-all          # Complete setup
./batch-bot-operations.sh fill <propertyId>  # All buy property
./batch-bot-operations.sh distribute         # Spread across tiers
./batch-bot-operations.sh status             # Check all wallets
./batch-bot-operations.sh scenario <1-4>     # Run test scenario
```

## 💡 Tips

- **Run setup multiple times safely** - It only funds wallets that need it
- **Test wallet files are gitignored** - Your private keys are safe
- **Use bash script for quick testing** - Individual commands for precise control
- **Check status regularly** - Know what's happening with your bots
- **Scenarios are pre-built** - Great for quick testing different situations

Happy testing! �