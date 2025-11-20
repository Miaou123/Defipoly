// ============================================
// Simple API Call Counter
// Logs endpoint usage every N calls
// ============================================

class APICallCounter {
    constructor(logInterval = 50) {
      this.logInterval = logInterval;
      this.totalCalls = 0;
      this.endpoints = {};
    }
  
    /**
     * Middleware to track API calls
     */
    middleware() {
      return (req, res, next) => {
        // Skip non-API routes
        if (!req.path.startsWith('/api')) {
          return next();
        }
  
        // Track the call
        const endpoint = this.normalizeEndpoint(req.path);
        
        this.totalCalls++;
        
        if (!this.endpoints[endpoint]) {
          this.endpoints[endpoint] = 0;
        }
        this.endpoints[endpoint]++;
  
        // Log every N calls
        if (this.totalCalls % this.logInterval === 0) {
          this.logSummary();
        }
        
        next();
      };
    }
  
    /**
     * Normalize endpoint paths (replace dynamic params with placeholders)
     */
    normalizeEndpoint(path) {
      return path
        // Replace wallet addresses (base58 format)
        .replace(/\/[1-9A-HJ-NP-Za-km-z]{32,44}/g, '/:wallet')
        // Replace numbers (IDs)
        .replace(/\/\d+/g, '/:id')
        // Replace UUIDs
        .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid');
    }
  
    /**
     * Log summary to console
     */
    logSummary() {
      console.log('\n' + '='.repeat(60));
      console.log(`📊 API CALL SUMMARY (Total: ${this.totalCalls} calls)`);
      console.log('='.repeat(60));
      
      // Sort endpoints by call count
      const sorted = Object.entries(this.endpoints)
        .sort((a, b) => b[1] - a[1]);
      
      sorted.forEach(([endpoint, count]) => {
        const percentage = ((count / this.totalCalls) * 100).toFixed(1);
        console.log(`   ${endpoint.padEnd(50)} ${count.toString().padStart(5)} calls (${percentage}%)`);
      });
      
      console.log('='.repeat(60) + '\n');
    }
  }
  
  module.exports = APICallCounter;