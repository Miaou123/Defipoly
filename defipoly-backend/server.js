// ============================================
// PRODUCTION-READY server.js WITH RATE LIMITING
// This is your updated server.js with security enhancements
// ============================================

const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { initDatabase, closeDatabase } = require('./src/config/database');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const WSSListener = require('./src/services/wssListener');
const GapDetector = require('./src/services/gapDetector');
const { router: wssMonitoringRouter, initMonitoring } = require('./src/routes/wssMonitoring');
const { initSocketIO, getIO } = require('./src/services/socketService');
const APICallCounter = require('./src/middleware/apiCallCounter');
const crypto = require('crypto');
const helmet = require('helmet');
const multer = require('multer');

// ============================================
// SECURITY: Rate Limiting
// ============================================
const { 
  blockListMiddleware, 
  globalLimiter, 
  smartRateLimiter,
  getRateLimitStats,
  unblockIP,
  rateLimitStore 
} = require('./src/middleware/rateLimiter');

// Load environment variables
require('dotenv').config();

// Load IDL to get PROGRAM_ID
const idl = require('./src/idl/defipoly_program.json');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3101;

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// SECURITY: Helmet (must be first - sets security headers)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  next();
});

// API call counter
const apiCounter = new APICallCounter(50); 
app.use(apiCounter.middleware());

// SECURITY: IP blocking
app.use(blockListMiddleware);

const ALLOWED_ORIGINS = [
  'http://localhost:3100',
  'http://localhost:3000',
  'https://defipoly.app',
  'https://www.defipoly.app',
];

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is in whitelist
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Serve static files for uploads (local development)
const path = require('path');
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const uploadUrlPrefix = process.env.UPLOAD_URL_PREFIX || '/uploads';

// Ensure upload directory exists
const fs = require('fs');
if (!fs.existsSync(uploadDir)) {
  console.log('Creating upload directory:', uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files
app.use(uploadUrlPrefix, express.static(path.resolve(uploadDir), {
  maxAge: '30d',
  etag: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    }
  }
}));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Max 5MB.' });
    }
  }
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// ============================================
// SECURITY: Apply Rate Limiting
// ============================================

// Smart rate limiting (must be FIRST - applies strict limits per endpoint)
app.use('/api', smartRateLimiter);

// Note: smartRateLimiter internally uses stricter limits (50-200)
// which are more restrictive than the global 500, so global is not needed

console.log('🛡️  Rate limiting enabled');

// ============================================
// ROUTES
// ============================================

// Health check endpoint (outside of /api, no rate limit)
app.get('/health', (req, res) => {
  const stats = rateLimitStore.getStats();
  
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    version: '2.0.1', // Bumped version for security update
    mode: 'wss',
    programId: process.env.PROGRAM_ID || idl.address,
    features: [
      'profiles', 
      'actions', 
      'cooldowns', 
      'stats', 
      'leaderboard', 
      'wss', 
      'gap-detection',
      'rate-limiting' // NEW
    ],
    security: {
      rateLimitEnabled: true,
      blockedIPs: stats.blockedIPs,
      totalViolations: stats.totalViolations
    }
  });
});


// Admin authentication middleware
const verifyAdmin = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!process.env.ADMIN_KEY) {
    return res.status(500).json({ error: 'Admin access not configured' });
  }
  
  if (adminKey !== process.env.ADMIN_KEY) {
    console.warn(`🚫 [ADMIN] Unauthorized access attempt from IP: ${req.ip}`);
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  next();
};

app.get('/api/admin/rate-limit-stats', verifyAdmin, getRateLimitStats);

app.post('/api/admin/unblock-ip', verifyAdmin, unblockIP);

// Mount API routes
app.use('/api', routes);

// Mount WSS monitoring routes
app.use('/api/wss', wssMonitoringRouter);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================
// WEBSOCKET & BLOCKCHAIN MONITORING
// ============================================

// Global WSS instances
let wssListener = null;
let gapDetector = null;

/**
 * Initialize WebSocket listener
 */
async function initializeWSS() {
  try {
    // Get configuration
    const RPC_URL = process.env.RPC_URL;
    const WS_URL = process.env.SOLANA_WS_URL || RPC_URL.replace('https://', 'wss://');
    const PROGRAM_ID = idl.address;
    
    if (!RPC_URL) {
      console.error('❌ RPC_URL not set in environment');
      console.log('   Please set RPC_URL in your .env file');
      return;
    }

    console.log('\n🌐 Starting WebSocket listener...');
    console.log(`📡 RPC URL: ${RPC_URL}`);
    console.log(`🔌 WS URL: ${WS_URL}`);
    console.log(`🎯 Program ID: ${PROGRAM_ID}`);

    // Initialize WSS listener
    wssListener = new WSSListener(RPC_URL, WS_URL, PROGRAM_ID);
    await wssListener.start();

    console.log('✅ WebSocket listener started successfully\n');

    // Initialize gap detector
    if (process.env.ENABLE_WSS !== 'false') {
      console.log('🔍 Starting gap detector...');
      gapDetector = new GapDetector(RPC_URL, PROGRAM_ID);
      await gapDetector.start();
      console.log('✅ Gap detector started successfully\n');
    }

  } catch (error) {
    console.error('❌ Failed to initialize WSS:', error);
  }
}

/**
 * Start the server
 */
async function startServer() {
  try {
    // Initialize database
    console.log('📦 Initializing database...');
    await initDatabase();
    console.log('✅ Database initialized\n');

    // Initialize Socket.IO for real-time events
    console.log('🔌 Initializing Socket.IO...');
    const io = initSocketIO(httpServer);
    initMonitoring(io, () => wssListener);
    console.log('✅ Socket.IO initialized\n');

    // Start WebSocket listener if enabled
    if (process.env.ENABLE_WSS !== 'false') {
      await initializeWSS();
    } else {
      console.log('⚠️  WebSocket listener disabled\n');
    }

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log('\n' + '='.repeat(70));
      console.log('🚀 Defipoly API v2.0.1 running on port ' + PORT);
      console.log('='.repeat(70));
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔐 Security: Rate limiting ${process.env.ENABLE_WSS !== 'false' ? 'enabled' : 'disabled'}`);
      console.log(`🔌 WebSocket listener ${process.env.ENABLE_WSS !== 'false' ? 'enabled' : 'disabled'}`);
      console.log(`🔍 Gap detection ${process.env.ENABLE_WSS !== 'false' ? 'enabled' : 'disabled'}`);
      console.log(`📢 Socket.IO server enabled on port ${PORT}`);
      console.log(`\n📡 Available endpoints:`);
      console.log(`   GET  /health`);
      console.log(`   GET  /api/game/constants`);
      console.log(`   GET  /api/profile/:wallet`);
      console.log(`   POST /api/profile`);
      console.log(`   POST /api/profiles/batch`);
      console.log(`   GET  /api/cooldown/:wallet/:setId`);
      console.log(`   GET  /api/cooldown/:wallet`);
      console.log(`   GET  /api/steal-cooldown/:wallet/:propertyId`);
      console.log(`   GET  /api/steal-cooldown/:wallet`);
      console.log(`   GET  /api/stats/:wallet`);
      console.log(`   GET  /api/ownership/:wallet`);
      console.log(`   GET  /api/leaderboard`);
      console.log(`   GET  /api/actions/recent`);
      console.log(`   GET  /api/actions/player/:wallet`);
      console.log(`   GET  /api/actions/property/:propertyId`);
      console.log(`   POST /api/actions`);
      console.log(`   POST /api/actions/batch`);
      console.log(`\n🔌 WSS Monitoring endpoints:`);
      console.log(`   GET  /api/wss/status`);
      console.log(`   GET  /api/wss/stats`);
      console.log(`   GET  /api/wss/health`);
      console.log(`   POST /api/wss/check-gaps`);
      console.log(`\n🛡️  Security endpoints:`);
      console.log(`   GET  /api/admin/rate-limit-stats`);
      console.log(`   POST /api/admin/unblock-ip\n`);
    });

  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log('\n🛑 Shutting down gracefully...');

  // Stop WSS listener
  if (wssListener) {
    console.log('   Stopping WebSocket listener...');
    await wssListener.stop();
  }

  // Stop gap detector
  if (gapDetector) {
    console.log('   Stopping gap detector...');
    await gapDetector.stop();
  }

  // Close database
  console.log('   Closing database...');
  await closeDatabase();

  console.log('✅ Shutdown complete');
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
startServer();