const express = require('express');
const router = express.Router();
const { 
  getLeaderboard, 
  getLeaderboardStats,
  getRecentMovers 
} = require('../controllers/leaderboardController');

// GET /api/leaderboard - Get overall leaderboard
router.get('/', getLeaderboard);

// GET /api/leaderboard/stats - Get overall leaderboard statistics
router.get('/stats', getLeaderboardStats);

// GET /api/leaderboard/movers - Get recent active players
router.get('/movers', getRecentMovers);

module.exports = router;