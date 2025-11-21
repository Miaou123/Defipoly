// ============================================
// JWT-based Wallet Authentication
// Sign once, get token, use for all requests
// ============================================

const jwt = require('jsonwebtoken');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('❌ JWT_SECRET must be set in production environment');
    }
    console.warn('⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET in .env for production!');
  }

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '24h'; // Token valid for 24 hours

/**
 * Generate a random nonce for wallet authentication
 */
function generateNonce() {
  return Math.floor(Math.random() * 1000000).toString();
}

// Store nonces in memory (use Redis in production for multi-server)
const nonces = new Map();

/**
 * Request a nonce for wallet authentication
 * GET /api/auth/nonce?wallet=<address>
 */
const requestNonce = (req, res) => {
  const { wallet } = req.query;
  
  if (!wallet) {
    return res.status(400).json({ error: 'Wallet address required' });
  }
  
  const nonce = generateNonce();
  nonces.set(wallet, { nonce, timestamp: Date.now() });
  
  // Clean up old nonces (older than 5 minutes)
  for (const [key, value] of nonces.entries()) {
    if (Date.now() - value.timestamp > 5 * 60 * 1000) {
      nonces.delete(key);
    }
  }
  
  res.json({ nonce });
};

/**
 * Verify signature and issue JWT token
 * POST /api/auth/verify
 * Body: { wallet, signature }
 */
const verifyAndIssueToken = (req, res) => {
  const { wallet, signature } = req.body;
  
  if (!wallet || !signature) {
    return res.status(400).json({ error: 'Wallet and signature required' });
  }
  
  // Get nonce for this wallet
  const nonceData = nonces.get(wallet);
  if (!nonceData) {
    return res.status(401).json({ error: 'No nonce found. Request a nonce first.' });
  }
  
  // Check nonce isn't too old (5 minutes max)
  if (Date.now() - nonceData.timestamp > 5 * 60 * 1000) {
    nonces.delete(wallet);
    return res.status(401).json({ error: 'Nonce expired. Request a new one.' });
  }
  
  // Verify signature
  try {
    const message = `Sign this message to authenticate with Defipoly.\n\nNonce: ${nonceData.nonce}`;
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(wallet);
    
    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Delete used nonce (prevent replay)
    nonces.delete(wallet);
    
    // Generate JWT token
    const token = jwt.sign(
      { wallet },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    
    console.log(`✅ [AUTH] JWT issued for wallet: ${wallet.substring(0, 8)}...`);
    
    res.json({
      token,
      expiresIn: JWT_EXPIRY,
      wallet
    });
    
  } catch (error) {
    console.error('Signature verification error:', error);
    return res.status(401).json({ error: 'Signature verification failed' });
  }
};

/**
 * Middleware to verify JWT token
 * Attach to protected routes
 */
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.authenticatedWallet = decoded.wallet;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please sign in again.' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Verify wallet ownership (use after verifyJWT)
 */
const verifyWalletOwnership = (paramName = 'wallet') => {
    return (req, res, next) => {
      // Check both req.body and req.params for wallet
      const targetWallet = req.params[paramName] || req.body[paramName] || req.body.wallet;
      
      if (!req.authenticatedWallet) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      if (!targetWallet) {
        console.warn(`🚫 [AUTH] No target wallet found in request from ${req.authenticatedWallet}`);
        return res.status(400).json({ error: 'Wallet address required in request' });
      }
      
      if (targetWallet !== req.authenticatedWallet) {
        console.warn(`🚫 [AUTH] Wallet mismatch: ${req.authenticatedWallet} tried to access ${targetWallet}`);
        return res.status(403).json({ error: 'Forbidden: You can only modify your own data' });
      }
      
      next();
    };
  };

/**
 * Optional JWT auth - doesn't fail if no token provided
 */
const optionalJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    req.authenticatedWallet = null;
    return next();
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.authenticatedWallet = decoded.wallet;
  } catch (error) {
    req.authenticatedWallet = null;
  }
  
  next();
};

module.exports = {
  requestNonce,
  verifyAndIssueToken,
  verifyJWT,
  verifyWalletOwnership,
  optionalJWT
};