# Defipoly Monorepo Setup Guide

This project has been configured as a monorepo using npm workspaces. All packages share dependencies and environment variables from the root.

## Structure

```
defipoly/
├── .env                    # Shared environment variables
├── .env.example           # Example environment file
├── package.json           # Root package.json with workspaces
├── package-lock.json      # Shared lock file
├── node_modules/          # Shared dependencies
├── defipoly-backend/      # Backend API (Express/Node.js)
├── defipoly-frontend/     # Frontend app (Next.js)
└── defipoly-program/      # Solana program (Anchor/Rust)
```

## Environment Variables

All environment variables are now centralized in the root `.env` file. Each package loads this file:

- **Backend**: Loads via `dotenv.config({ path: '../.env' })`
- **Frontend**: Next.js automatically loads from project root
- **Program scripts**: Load via `dotenv.config({ path: '../../../.env' })`

### Key Variables

```bash
# Network Configuration
NETWORK=devnet
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
SOLANA_WS_URL=wss://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Program Configuration
PROGRAM_ID=YOUR_PROGRAM_ID
TOKEN_MINT=YOUR_TOKEN_MINT

# Backend Configuration
PORT=3005
BACKEND_URL=http://localhost:3005

# Frontend Configuration
NEXT_PUBLIC_PROFILE_API_URL=http://localhost:3005
NEXT_PUBLIC_SOLANA_RPC_HOST=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

## Installation

```bash
# Install all dependencies from root
npm install

# This installs dependencies for all workspaces
```

## Development

```bash
# Run frontend and backend together
npm run dev

# Run individual services
npm run dev:frontend
npm run dev:backend
npm run dev:validator

# Build everything
npm run build
```

## Important Notes

1. **No subdirectory node_modules**: Each package uses the root node_modules via npm workspaces
2. **No subdirectory .env files**: All packages read from the root .env
3. **No subdirectory package-lock.json**: Single lock file at root
4. **RPC_ENDPOINT removed**: No longer generated in constants.ts, use env vars instead

## Migration from Individual Packages

If you're migrating from the old structure:

1. Delete all subdirectory node_modules: `rm -rf */node_modules`
2. Delete all subdirectory package-lock.json files
3. Delete all subdirectory .env files
4. Run `npm install` from the root
5. Copy your environment variables to the root .env

## Troubleshooting

- If packages can't find dependencies, ensure you've run `npm install` from the root
- If env vars are undefined, check the dotenv path configuration in each package
- The backend uses `../` path, program scripts use `../../../` path