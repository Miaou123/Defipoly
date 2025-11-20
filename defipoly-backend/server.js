// ============================================
// UPDATED server.js
// Now reads PROGRAM_ID from IDL file instead of .env
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

// Load environment variables
require('dotenv').config();

// Load IDL to get PROGRAM_ID
const idl = require('./src/idl/defipoly_program.json');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3101;

const apiCounter = new APICallCounter(50); 
app.use(apiCounter.middleware());

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3100',
  credentials: true
}));
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

// Health check endpoint (outside of /api)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    version: '2.0.0',
    mode: 'wss',
    programId: process.env.PROGRAM_ID || idl.address,
    features: ['profiles', 'actions', 'cooldowns', 'stats', 'leaderboard', 'wss', 'gap-detection']
  });
});

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

    // Initialize WSS listener with all 3 required parameters
    wssListener = new WSSListener(RPC_URL, WS_URL, PROGRAM_ID);
    await wssListener.start();

    console.log('✅ WebSocket listener started successfully!\n');

    // Initialize gap detector
    console.log('🔍 Starting gap detector...');
    const checkInterval = parseInt(process.env.GAP_CHECK_INTERVAL) || 600; // 10 minutes default
    console.log(`   Check interval: ${checkInterval} seconds`);
    
    gapDetector = new GapDetector(RPC_URL, WS_URL, PROGRAM_ID);
    gapDetector.checkInterval = checkInterval * 1000; // Convert to ms
    await gapDetector.start();
    
    console.log('✅ Gap detector started');
    
    // Initialize monitoring
    initMonitoring(wssListener, gapDetector);
    console.log('✅ WSS and Gap Detection initialized successfully\n');

  } catch (error) {
    console.error('❌ Error initializing WebSocket listener:', error);
  }
}

/**
 * Start server
 */
async function startServer() {
  try {
    // Initialize database
    await initDatabase();

    // Initialize Socket.IO
    const io = initSocketIO(httpServer);
    console.log('🔌 Socket.IO server initialized');
    
    // Initialize WSS monitoring
    initMonitoring();

    // Initialize WSS if enabled
    if (process.env.ENABLE_WSS !== 'false') {
      await initializeWSS();
    } else {
      console.log('⚠️  WebSocket listener disabled (ENABLE_WSS=false)');
    }

    // Start HTTP server (not just Express)
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Defipoly API v2.0 running on port ${PORT}`);
      console.log(`📊 Database: SQLite (defipoly.db)`);
      console.log(`✅ Profile storage enabled`);
      console.log(`✅ Game actions tracking enabled`);
      console.log(`✅ Cooldown system enabled`);
      console.log(`✅ Player stats & leaderboard enabled`);
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
      console.log(`   POST /api/wss/check-gaps\n`);
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