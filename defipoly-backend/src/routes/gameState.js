const express = require('express');
const router = express.Router();
const { getGameState } = require('../controllers/gameStateController');

// GET /api/game-state/:wallet
router.get('/:wallet', getGameState);

module.exports = router;