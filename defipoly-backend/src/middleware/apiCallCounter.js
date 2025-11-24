// ============================================
// Enhanced API Call Counter with Real-Time Logging
// ============================================

class APICallCounter {
  constructor(logInterval = 50, realTimeLog = true) {
    this.logInterval = logInterval;
    this.realTimeLog = realTimeLog;
    this.totalCalls = 0;
    this.endpoints = {};
  }

  middleware() {
    return (req, res, next) => {
      if (!req.path.startsWith('/api')) {
        return next();
      }

      const startTime = Date.now();
      const endpoint = this.normalizeEndpoint(req.path);
      
      this.totalCalls++;
      
      if (!this.endpoints[endpoint]) {
        this.endpoints[endpoint] = 0;
      }
      this.endpoints[endpoint]++;

      // Capture response for logging
      const originalSend = res.send;
      const self = this;
      const callNum = this.totalCalls;
      const endpointCount = this.endpoints[endpoint];
      
      res.send = function(data) {
        const duration = Date.now() - startTime;
        
        // Real-time log
        if (self.realTimeLog) {
          const status = res.statusCode;
          const statusIcon = status >= 400 ? '❌' : '✅';
          console.log(
            `${statusIcon} [${callNum}] ${req.method.padEnd(6)} ${endpoint.padEnd(45)} ${status} ${duration}ms (#${endpointCount})`
          );
        }
        
        return originalSend.call(this, data);
      };

      if (this.totalCalls % this.logInterval === 0) {
        this.logSummary();
      }
      
      next();
    };
  }

  normalizeEndpoint(path) {
    return path
      .replace(/\/[1-9A-HJ-NP-Za-km-z]{32,44}/g, '/:wallet')
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid');
  }

  logSummary() {
    console.log('\n' + '='.repeat(60));
    console.log(`📊 API CALL SUMMARY (Total: ${this.totalCalls} calls)`);
    console.log('='.repeat(60));
    
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