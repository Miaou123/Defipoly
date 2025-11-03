# Defipoly Backend API

Express.js backend server for Defipoly game with WebSocket listener for real-time game events.

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Configuration
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

### Run Development Server
```bash
npm run dev
```

### Run Production Server
```bash
npm start
```

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health status

### Game Data
- `GET /api/game/constants` - Game constants

### Profiles
- `GET /api/profile/:wallet` - Get player profile
- `POST /api/profile` - Create/update profile
- `POST /api/profiles/batch` - Batch profile operations

### Cooldowns
- `GET /api/cooldown/:wallet/:setId` - Get specific cooldown
- `GET /api/cooldown/:wallet` - Get all cooldowns for wallet
- `GET /api/steal-cooldown/:wallet/:propertyId` - Get steal cooldown
- `GET /api/steal-cooldown/:wallet` - Get all steal cooldowns

### Statistics
- `GET /api/stats/:wallet` - Player statistics
- `GET /api/ownership/:wallet` - Property ownership
- `GET /api/leaderboard` - Game leaderboard

### Actions
- `GET /api/actions/recent` - Recent game actions
- `GET /api/actions/player/:wallet` - Player action history
- `GET /api/actions/property/:propertyId` - Property action history
- `POST /api/actions` - Log new action
- `POST /api/actions/batch` - Log multiple actions

### WebSocket Monitoring
- `GET /api/wss/status` - WebSocket connection status
- `GET /api/wss/stats` - WebSocket statistics
- `GET /api/wss/health` - WebSocket health check
- `POST /api/wss/check-gaps` - Check for transaction gaps

## 🔧 Environment Variables

```env
# Server Configuration
PORT=3005
NODE_ENV=development

# Database
DATABASE_PATH=./defipoly.db

# Solana Configuration
RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com
PROGRAM_ID=your_program_id_here

# API Keys (optional but recommended)
HELIUS_API_KEY=your_helius_api_key_here

# Webhook Configuration (optional)
WEBHOOK_URL=your_webhook_url_here

# WSS Configuration
ENABLE_WSS=true
```

## 📊 Database

The backend uses SQLite for data storage with the following tables:
- `profiles` - Player profile data
- `player_stats` - Player statistics and leaderboard
- `property_ownership` - Current property ownership
- `game_actions` - Game action history
- `cooldowns` - Cooldown tracking
- `steal_cooldowns` - Steal cooldown tracking

### Database Management

```bash
# Optimize database
npm run db:optimize

# Backup database
npm run db:backup

# Check database health
npm run db:health
```

## 🔌 WebSocket Listener

The backend includes a WebSocket listener that connects to Solana and monitors program transactions in real-time. It:
- Processes game events (buys, sells, steals, shields, rewards)
- Updates player statistics automatically
- Maintains action history
- Detects and fills gaps in transaction history

## 🚀 Production Deployment

Use PM2 for process management:

```bash
# Start with PM2
npm run pm2:start

# Stop PM2 process
npm run pm2:stop

# Restart PM2 process
npm run pm2:restart

# View PM2 logs
npm run pm2:logs
```

## 📝 API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## 🔒 Security

- Wallet signature verification on profile updates
- CORS configuration for frontend access
- Environment variables for sensitive data
- Request validation middleware
- Error handling middleware

## 📈 Performance

- SQLite with optimized indexes
- In-memory caching for frequently accessed data
- Batch operations for bulk updates
- Connection pooling for database
- Automatic database optimization

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3005
lsof -i :3005

# Kill process on port 3005
kill -9 $(lsof -t -i:3005)
```

### Database Locked
```bash
# Run database optimization
npm run db:optimize
```

### WebSocket Connection Issues
- Check RPC/WSS URLs in .env
- Verify API keys are valid
- Check network connectivity
- Review logs for specific errors

## 📚 Architecture

- **Framework**: Express.js
- **Database**: SQLite with better-sqlite3
- **WebSocket**: Native WebSocket for Solana connection
- **Validation**: Express middleware
- **Process Management**: PM2 for production
- **Logging**: Console with timestamps