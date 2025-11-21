// ============================================
// Auth Routes
// Add to your backend: src/routes/auth.js
// ============================================

const express = require('express');
const router = express.Router();
const { requestNonce, verifyAndIssueToken } = require('../middleware/jwtAuth');

// GET /api/auth/nonce?wallet=<address>
router.get('/nonce', requestNonce);

// POST /api/auth/verify
// Body: { wallet, signature }
router.post('/verify', verifyAndIssueToken);

module.exports = router;