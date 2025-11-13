// ============================================
// Socket.IO Service
// Handles real-time communication with frontend clients
// ============================================

const { Server } = require('socket.io');
const { getPlayerStats } = require('./gameService');
const { getDatabase } = require('../config/database');

let io = null;

/**
 * Initialize Socket.IO server
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
function initSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3100',
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log(`📱 Client connected: ${socket.id}`);
    
    // Handle client subscribing to their wallet events
    socket.on('subscribe-wallet', (walletAddress) => {
      if (walletAddress) {
        socket.join(`wallet:${walletAddress}`);
        console.log(`   ✅ Client ${socket.id} subscribed to wallet ${walletAddress}`);
      }
    });
    
    // Handle client subscribing to property events
    socket.on('subscribe-property', (propertyId) => {
      if (propertyId !== undefined) {
        socket.join(`property:${propertyId}`);
        console.log(`   ✅ Client ${socket.id} subscribed to property ${propertyId}`);
      }
    });
    
    // Handle client unsubscribing from property events
    socket.on('unsubscribe-property', (propertyId) => {
      if (propertyId !== undefined) {
        socket.leave(`property:${propertyId}`);
        console.log(`   ❌ Client ${socket.id} unsubscribed from property ${propertyId}`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`📱 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Get Socket.IO instance
 * @returns {Server|null} Socket.IO server instance
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
}

/**
 * Emit event to specific wallet
 * @param {string} walletAddress - Wallet address
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
function emitToWallet(walletAddress, event, data) {
  if (io && walletAddress) {
    io.to(`wallet:${walletAddress}`).emit(event, data);
  }
}

/**
 * Emit event to specific property subscribers
 * @param {number} propertyId - Property ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
function emitToProperty(propertyId, event, data) {
  if (io && propertyId !== undefined) {
    io.to(`property:${propertyId}`).emit(event, data);
  }
}

/**
 * Emit event to all connected clients
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
function emitToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

/**
 * Helper functions to fetch data for WebSocket events
 */
async function getCurrentPlayerStats(walletAddress) {
  return new Promise((resolve, reject) => {
    getPlayerStats(walletAddress, (err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
}

async function getTopLeaderboard(limit = 10) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const query = `
      SELECT 
        wallet_address,
        leaderboard_score,
        total_earned,
        properties_bought,
        successful_steals,
        complete_sets,
        shields_activated,
        ROW_NUMBER() OVER (ORDER BY leaderboard_score DESC) as rank
      FROM player_stats
      WHERE total_actions > 0
      ORDER BY leaderboard_score DESC
      LIMIT ?
    `;
    
    db.all(query, [limit], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const leaderboard = rows.map(row => ({
          rank: row.rank,
          walletAddress: row.wallet_address,
          leaderboardScore: Math.round(row.leaderboard_score),
          totalEarned: row.total_earned,
          propertiesBought: row.properties_bought,
          successfulSteals: row.successful_steals,
          completeSets: row.complete_sets,
          shieldsActivated: row.shields_activated
        }));
        resolve(leaderboard);
      }
    });
  });
}

async function getPlayerOwnership(walletAddress) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const query = `
      SELECT 
        COUNT(*) as owned_properties,
        SUM(slots_owned) as total_slots,
        AVG(slots_owned) as avg_slots_per_property,
        GROUP_CONCAT(property_id) as property_ids
      FROM property_ownership 
      WHERE wallet_address = ?
    `;
    
    db.get(query, [walletAddress], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * Game event emitters
 */
const gameEvents = {
  // Property events
  propertyBought: (data) => {
    emitToProperty(data.propertyId, 'property-bought', data);
    emitToWallet(data.buyer, 'property-bought', data);
    emitToAll('recent-action', { type: 'buy', ...data });
  },
  
  propertySold: (data) => {
    emitToProperty(data.propertyId, 'property-sold', data);
    emitToWallet(data.seller, 'property-sold', data);
    emitToAll('recent-action', { type: 'sell', ...data });
  },
  
  propertyStolen: (data) => {
    emitToProperty(data.propertyId, 'property-stolen', data);
    emitToWallet(data.attacker, 'property-stolen', data);
    emitToWallet(data.victim, 'property-stolen', data);
    emitToAll('recent-action', { type: 'steal', ...data });
  },
  
  stealFailed: (data) => {
    emitToProperty(data.propertyId, 'steal-failed', data);
    emitToWallet(data.attacker, 'steal-failed', data);
    emitToWallet(data.victim, 'steal-failed', data);
    emitToAll('recent-action', { type: 'steal-failed', ...data });
  },

  stealAttempted: (data) => {
    emitToProperty(data.propertyId, 'steal-attempted', data);
    emitToWallet(data.attacker, 'steal-attempted', data);
    emitToWallet(data.victim, 'steal-attempted', data);
    emitToAll('recent-action', { type: 'steal-attempted', ...data });
  },
  
  propertyShielded: (data) => {
    emitToProperty(data.propertyId, 'property-shielded', data);
    emitToWallet(data.owner, 'property-shielded', data);
  },
  
  // Player events
  playerStatsUpdated: (data) => {
    emitToWallet(data.wallet, 'stats-updated', data);
  },
  
  cooldownUpdated: (data) => {
    emitToWallet(data.wallet, 'cooldown-updated', data);
  },
  
  stealCooldownUpdated: (data) => {
    emitToWallet(data.wallet, 'steal-cooldown-updated', data);
  },
  
  // Global events
  leaderboardUpdated: (data) => {
    emitToAll('leaderboard-updated', data);
  },
  
  // Reward events
  rewardClaimed: (data) => {
    emitToWallet(data.wallet, 'reward-claimed', data);
    emitToAll('recent-action', { type: 'reward', ...data });
  },
  
  // Enhanced player events with detailed stats
  playerStatsChanged: async (walletAddress) => {
    try {
      const stats = await getCurrentPlayerStats(walletAddress);
      if (stats) {
        emitToWallet(walletAddress, 'player-stats-changed', {
          wallet: walletAddress,
          stats: stats,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('❌ [SOCKET] Error fetching player stats:', error);
    }
  },
  
  // Enhanced leaderboard events
  leaderboardChanged: async () => {
    try {
      const topPlayers = await getTopLeaderboard(20); // Get top 20
      emitToAll('leaderboard-changed', {
        topPlayers: topPlayers,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('❌ [SOCKET] Error fetching leaderboard:', error);
    }
  },
  
  // Ownership and rewards events
  ownershipChanged: async (walletAddress, propertyId) => {
    try {
      const ownership = await getPlayerOwnership(walletAddress);
      
      // Emit to the specific player about their ownership change
      emitToWallet(walletAddress, 'ownership-changed', {
        wallet: walletAddress,
        propertyId: propertyId,
        ownership: ownership,
        timestamp: Date.now()
      });
      
      // Emit to property watchers
      emitToProperty(propertyId, 'ownership-changed', {
        wallet: walletAddress,
        propertyId: propertyId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('❌ [SOCKET] Error fetching ownership:', error);
    }
  },
  
  rewardsUpdated: async (walletAddress) => {
    try {
      const ownership = await getPlayerOwnership(walletAddress);
      const stats = await getCurrentPlayerStats(walletAddress);
      
      emitToWallet(walletAddress, 'rewards-updated', {
        wallet: walletAddress,
        ownership: ownership,
        stats: stats,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('❌ [SOCKET] Error fetching rewards data:', error);
    }
  }
};

module.exports = {
  initSocketIO,
  getIO,
  emitToWallet,
  emitToProperty,
  emitToAll,
  gameEvents
};