# 🎲 Defipoly

> A full-stack Solana-based Monopoly game with real-time event processing

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-Program-9945FF?logo=solana)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-API-339933?logo=node.js)](https://nodejs.org)

Defipoly is a decentralized Monopoly-style game built on Solana blockchain, featuring NFT properties, real-time gameplay, and on-chain mechanics.

## 📁 Project Structure

This is a monorepo containing three main components:

```
defipoly/
├── defipoly-frontend/     # Next.js web application
├── defipoly-program/      # Solana smart contract (Anchor)
├── defipoly-backend/      # Express.js API server
└── README.md             # You are here!
```

### 🎨 Frontend (`defipoly-frontend/`)
- **Tech Stack**: Next.js 15, React, TypeScript, Tailwind CSS
- **Purpose**: User interface for playing Defipoly
- **Features**: Wallet integration, real-time game state, property management
- **Port**: 3000 (development)
- [Frontend Documentation →](./defipoly-frontend/README.md)

### 🔗 Smart Contract (`defipoly-program/`)
- **Tech Stack**: Rust, Anchor Framework, Solana
- **Purpose**: On-chain game logic and state management
- **Features**: Property ownership, buy/sell mechanics, rewards system
- **Network**: Solana Mainnet-Beta
- [Program Documentation →](./defipoly-program/README.md)

### 🔧 Backend API (`defipoly-backend/`)
- **Tech Stack**: Node.js, Express, SQLite, WebSocket
- **Purpose**: Off-chain data storage and real-time event processing
- **Features**: Profile management, action logging, leaderboards, WebSocket listener
- **Port**: 3005 (configurable)
- [Backend Documentation →](./defipoly-backend/README.md)

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18+ 
- **Rust**: Latest stable version
- **Solana CLI**: v1.18+
- **Anchor CLI**: v0.32+
- **Git**: Latest version

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd defipoly

# Install all dependencies
npm run install:all

# Or install individually
cd defipoly-frontend && npm install && cd ..
cd defipoly-backend && npm install && cd ..
cd defipoly-program && npm install && cd ..
```

### Configuration

#### 1. Backend Setup
```bash
cd defipoly-backend
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
PORT=3005
RPC_URL=https://api.mainnet-beta.solana.com
PROGRAM_ID=your_program_id_here
DATABASE_PATH=./defipoly.db
```

#### 2. Frontend Setup
```bash
cd defipoly-frontend
cp .env.example .env.local
# Edit .env.local with your configuration
```

Required environment variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:3005
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_PROGRAM_ID=your_program_id_here
```

### Development

Run all services concurrently:
```bash
npm run dev
```

Or run services individually:
```bash
# Frontend (http://localhost:3000)
npm run dev:frontend

# Backend (http://localhost:3005)
npm run dev:backend

# Local Solana validator
npm run dev:validator
```

## 🛠️ Available Scripts

### Development
- `npm run dev` - Run frontend and backend concurrently
- `npm run dev:frontend` - Run Next.js development server
- `npm run dev:backend` - Run Express development server
- `npm run dev:validator` - Run local Solana test validator

### Building
- `npm run build` - Build frontend and program
- `npm run build:frontend` - Build Next.js production bundle
- `npm run build:program` - Build Anchor program

### Testing
- `npm run test` - Run program tests
- `npm run test:frontend` - Run frontend tests
- `npm run test:backend` - Run backend tests
- `npm run test:program` - Run Anchor tests

### Installation
- `npm run install:all` - Install all dependencies
- `npm run install:frontend` - Install frontend dependencies
- `npm run install:backend` - Install backend dependencies
- `npm run install:program` - Install program dependencies

### Database
- `npm run db:backup` - Backup SQLite database
- `npm run db:optimize` - Optimize database performance
- `npm run db:health` - Check database health

### PM2 (Process Management)
- `npm run pm2:start` - Start backend with PM2
- `npm run pm2:stop` - Stop PM2 processes
- `npm run pm2:restart` - Restart PM2 processes
- `npm run pm2:logs` - View PM2 logs

### Utilities
- `npm run format` - Format code with Prettier
- `npm run lint` - Run ESLint
- `npm run check-ports` - Check if ports 3000 and 3005 are in use
- `npm run kill-ports` - Kill processes on ports 3000 and 3005

## 📡 API Documentation

### Backend Endpoints

#### Health Check
- `GET /health` - Server health status

#### Game Data
- `GET /api/game/constants` - Game constants and configuration

#### Profiles
- `GET /api/profile/:wallet` - Get player profile
- `POST /api/profile` - Create/update profile
- `POST /api/profiles/batch` - Batch profile operations

#### Cooldowns
- `GET /api/cooldown/:wallet/:setId` - Get specific cooldown
- `GET /api/cooldown/:wallet` - Get all cooldowns for wallet
- `GET /api/steal-cooldown/:wallet/:propertyId` - Get steal cooldown
- `GET /api/steal-cooldown/:wallet` - Get all steal cooldowns

#### Statistics
- `GET /api/stats/:wallet` - Player statistics
- `GET /api/ownership/:wallet` - Property ownership details
- `GET /api/leaderboard` - Game leaderboard

#### Actions
- `POST /api/actions` - Log player actions
- `GET /api/actions/:wallet` - Get player action history

#### WebSocket
- `WS /wss/monitoring` - Real-time game event stream

## 🏗️ Architecture

### Frontend Architecture
- **Framework**: Next.js 15 with App Router
- **State Management**: React Context API
- **Wallet Integration**: Solana Wallet Adapter
- **Styling**: Tailwind CSS
- **Real-time Updates**: WebSocket connection to backend

### Backend Architecture
- **Framework**: Express.js
- **Database**: SQLite with better-sqlite3
- **Real-time**: WebSocket listener for Solana events
- **Process Management**: PM2 for production
- **Caching**: In-memory caching for performance

### Smart Contract Architecture
- **Framework**: Anchor 0.32
- **Language**: Rust
- **Features**: 
  - Property ownership via PDAs
  - Buy/sell mechanics
  - Cooldown system
  - Rewards distribution
  - Shield mechanics

## 🚀 Deployment

### Frontend Deployment (Vercel)
```bash
npm run deploy:frontend
```

### Backend Deployment
1. Configure production environment variables
2. Use PM2 for process management:
```bash
npm run pm2:start
```

### Program Deployment
```bash
# Deploy to devnet
npm run deploy:program:devnet

# Deploy to mainnet
npm run deploy:program:mainnet
```

## 🔒 Security Considerations

- **Private Keys**: Never commit private keys or wallet files
- **Environment Variables**: Use `.env` files for sensitive configuration
- **Database**: Regular backups recommended
- **RPC Endpoints**: Use authenticated endpoints in production
- **CORS**: Configure appropriate CORS settings for production

## 📊 Monitoring

- Backend health: `http://localhost:3005/health`
- Frontend health: `http://localhost:3000/api/health`
- WebSocket monitoring: Connect to `ws://localhost:3005/wss/monitoring`
- Database health: `npm run db:health`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   npm run kill-ports
   ```

2. **Database locked**
   ```bash
   npm run db:optimize
   ```

3. **WebSocket connection failed**
   - Check backend is running
   - Verify CORS settings
   - Check firewall rules

4. **Build failures**
   ```bash
   npm run clean
   npm run install:all
   ```

### Getting Help

- Check individual README files in each project directory
- Review logs: `npm run pm2:logs`
- Database issues: `npm run db:health`

---

Built with ❤️ on Solana