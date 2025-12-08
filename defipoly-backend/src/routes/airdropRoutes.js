// ============================================
// FILE: defipoly-backend/src/routes/airdropRoutes.js
// API routes: auto-gas on connect + one-click claim
// ============================================

const express = require('express');
const router = express.Router();
const { airdropService } = require('../services/airdropService');

/**
 * GET /api/airdrop/check/:wallet
 * Check eligibility and trigger auto-gas if needed
 */
router.get('/check/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    
    if (!wallet || wallet.length < 32 || wallet.length > 44) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // Auto-send gas if whitelisted and hasn't received yet
    const gasResult = await airdropService.sendGasIfNeeded(wallet);
    
    // Return eligibility status
    const eligibility = await airdropService.checkEligibility(wallet);
    
    // Include gas info if just sent
    if (gasResult.success && !gasResult.alreadySent) {
      eligibility.gasSent = true;
      eligibility.gasSignature = gasResult.signature;
    }
    
    return res.json(eligibility);

  } catch (error) {
    console.error('❌ [AIRDROP API] Check error:', error);
    return res.status(500).json({ error: 'Failed to check eligibility' });
  }
});

/**
 * POST /api/airdrop/claim
 * Verify devnet transaction and send tokens
 * Body: { wallet: string, txSignature: string }
 */
router.post('/claim', async (req, res) => {
  try {
    const { wallet, txSignature } = req.body;

    if (!wallet || !txSignature) {
      return res.status(400).json({ success: false, error: 'Wallet and transaction signature required' });
    }

    if (wallet.length < 32 || wallet.length > 44) {
      return res.status(400).json({ success: false, error: 'Invalid wallet address' });
    }

    if (txSignature.length < 80 || txSignature.length > 90) {
      return res.status(400).json({ success: false, error: 'Invalid transaction signature' });
    }

    const result = await airdropService.verifyAndClaimTokens(wallet, txSignature);
    
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ [AIRDROP API] Claim error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/airdrop/status
 * Get airdrop service status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await airdropService.getStatus();
    return res.json(status);
  } catch (error) {
    console.error('❌ [AIRDROP API] Status error:', error);
    return res.status(500).json({ error: 'Failed to get status' });
  }
});

module.exports = router;