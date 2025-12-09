// ============================================
// RATE LIMITER MIDDLEWARE
// Multi-tier rate limiting for production security
// ============================================

const rateLimit = require('express-rate-limit');

/**
 * Store for tracking rate limit violations
 * Used for security monitoring and potential IP banning
 */
class RateLimitStore {
  constructor() {
    this.violations = new Map();
    this.blockedIPs = new Set();
    
    // Clean up old violations every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  recordViolation(ip) {
    const count = (this.violations.get(ip) || 0) + 1;
    this.violations.set(ip, count);
    
    // Auto-block IPs with excessive violations (100+ in memory)
    if (count >= 100) {
      this.blockedIPs.add(ip);
      console.warn(`🚨 [SECURITY] IP ${ip} auto-blocked after ${count} rate limit violations`);
    }
    
    return count;
  }

  isBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  unblock(ip) {
    this.blockedIPs.delete(ip);
    this.violations.delete(ip);
  }

  cleanup() {
    // Reset violations periodically
    this.violations.clear();
    console.log('🧹 [RATE LIMIT] Cleaned up violation records');
  }

  getStats() {
    return {
      totalViolations: Array.from(this.violations.values()).reduce((a, b) => a + b, 0),
      uniqueIPs: this.violations.size,
      blockedIPs: this.blockedIPs.size,
      topViolators: Array.from(this.violations.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([ip, count]) => ({ ip: ip.substring(0, 12) + '...', violations: count }))
    };
  }
}

const rateLimitStore = new RateLimitStore();

/**
 * IP blocking middleware - checks before rate limiters
 */
const blockListMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  if (rateLimitStore.isBlocked(ip)) {
    console.warn(`🚫 [SECURITY] Blocked IP attempted access: ${ip}`);
    return res.status(403).json({ 
      error: 'Access forbidden',
      message: 'Your IP has been temporarily blocked due to excessive requests'
    });
  }
  
  next();
};

/**
 * Custom rate limit handler
 */
const rateLimitHandler = (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  const violations = rateLimitStore.recordViolation(ip);
  
  console.warn(`⚠️ [RATE LIMIT] IP ${ip} exceeded limit (${violations} total violations)`);
  
  res.status(429).json({
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: res.get('Retry-After')
  });
};

/**
 * Skip rate limiting for certain conditions
 */
const skipSuccessfulRequests = (req, res) => {
  // Don't count successful requests toward the limit
  // Only failed/error requests count
  return res.statusCode < 400;
};

// ============================================
// RATE LIMITER CONFIGURATIONS
// ============================================

/**
 * TIER 1: Strict - Write Operations (POST/PUT/DELETE)
 * Most restrictive - for data modification endpoints
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes
  message: 'Too many write requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * TIER 2: Moderate - Read Operations (GET)
 * More permissive for data retrieval
 */
const moderateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * TIER 3: Upload Limiter - File Uploads
 * Very strict to prevent storage attacks
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many file uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * TIER 4: Auth Limiter - Authentication attempts
 * Prevent brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false // Count all auth attempts
});

/**
 * TIER 5: WebSocket Connection Limiter
 * Prevent WebSocket spam
 */
const websocketLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 connections per minute
  message: 'Too many WebSocket connections, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * TIER 6: Global API Limiter
 * Catches everything, most permissive
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes total
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Endpoint-specific configurations
 */
const endpointLimiters = {
  // Profile endpoints
  'POST /api/profile': strictLimiter,
  'POST /api/profiles/batch': strictLimiter,
  'GET /api/profile/:wallet': moderateLimiter,
  
  // Upload endpoints - very strict
  'POST /api/profile/upload/picture': uploadLimiter,
  'POST /api/profile/upload/theme': uploadLimiter,
  'POST /api/profile/upload/theme-batch': uploadLimiter,
  'POST /api/profile/upload/delete': uploadLimiter,
  
  // Action endpoints
  'POST /api/actions': strictLimiter,
  'POST /api/actions/batch': strictLimiter,
  'GET /api/actions/recent': moderateLimiter,
  'GET /api/actions/player/:wallet': moderateLimiter,
  'GET /api/actions/property/:propertyId': moderateLimiter,
  
  // Stats endpoints - moderate
  'GET /api/stats/:wallet': moderateLimiter,
  'GET /api/ownership/:wallet': moderateLimiter,
  'GET /api/leaderboard': moderateLimiter,
  
  // Cooldown endpoints - moderate
  'GET /api/cooldown/:wallet': moderateLimiter,
  'GET /api/steal-cooldown/:wallet': moderateLimiter,
  
  // WSS monitoring - strict
  'POST /api/wss/check-gaps': strictLimiter,
  'GET /api/wss/status': moderateLimiter,
  'GET /api/wss/stats': moderateLimiter,
  'GET /api/wss/health': moderateLimiter
};

/**
 * Apply appropriate rate limiter based on method and path
 */
const smartRateLimiter = (req, res, next) => {
  const method = req.method;
  const path = req.path;
  
  // Check if IP is blocked first
  const ip = req.ip || req.connection.remoteAddress;
  if (rateLimitStore.isBlocked(ip)) {
    console.warn(`🚫 [SECURITY] Blocked IP attempted access: ${ip}`);
    return res.status(403).json({ 
      error: 'Access forbidden',
      message: 'Your IP has been temporarily blocked due to excessive requests'
    });
  }
  
  // Find matching endpoint-specific limiter
  for (const [endpoint, limiter] of Object.entries(endpointLimiters)) {
    const [endpointMethod, endpointPath] = endpoint.split(' ');
    
    // Match method and check if path starts with endpoint path (without params)
    const pathPattern = endpointPath.replace(/:\w+/g, '[^/]+');
    const regex = new RegExp(`^${pathPattern}(/|$)`);
    
    if (method === endpointMethod && regex.test(path)) {
      return limiter(req, res, next);
    }
  }
  
  // Default to method-based limiting
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    return strictLimiter(req, res, next);
  } else if (method === 'GET') {
    return moderateLimiter(req, res, next);
  } else {
    // For other methods (HEAD, OPTIONS, etc.), use moderate limit
    return moderateLimiter(req, res, next);
  }
};

/**
 * Rate limit statistics endpoint (for monitoring)
 */
const getRateLimitStats = (req, res) => {
  const stats = rateLimitStore.getStats();
  res.json({
    success: true,
    stats,
    timestamp: Date.now()
  });
};

/**
 * Admin endpoint to unblock an IP (requires authentication)
 */
const unblockIP = (req, res) => {
  const { ip } = req.body;
  
  if (!ip) {
    return res.status(400).json({ error: 'IP address required' });
  }
  
  rateLimitStore.unblock(ip);
  
  res.json({
    success: true,
    message: `IP ${ip} has been unblocked`
  });
};

module.exports = {
  blockListMiddleware,
  strictLimiter,
  moderateLimiter,
  uploadLimiter,
  authLimiter,
  websocketLimiter,
  globalLimiter,
  smartRateLimiter,
  getRateLimitStats,
  unblockIP,
  rateLimitStore
};