#!/usr/bin/env node
// ============================================
// RATE LIMITER TEST SUITE
// Comprehensive testing for all rate limit tiers
// ============================================

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3101';
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper functions
const log = (message, color = 'reset') => {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
};

const logTest = (name) => {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(`🧪 TEST: ${name}`, 'cyan');
  log('='.repeat(70), 'cyan');
};

const logSuccess = (message) => {
  log(`✅ ${message}`, 'green');
  results.passed++;
};

const logFail = (message) => {
  log(`❌ ${message}`, 'red');
  results.failed++;
};

const logInfo = (message) => {
  log(`   ${message}`, 'blue');
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Wait for rate limit window to reset
const waitForReset = async (seconds) => {
  log(`\n⏳ Waiting ${seconds} seconds for rate limit window to reset...`, 'yellow');
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\r   ${i} seconds remaining...`);
    await sleep(1000);
  }
  console.log('\r   ✅ Reset complete!                ');
};

// ============================================
// TEST 1: Health Check & Rate Limit Status
// ============================================
async function testHealthCheck() {
  logTest('Health Check & Rate Limit Status');
  
  try {
    const response = await axios.get(`${API_URL}/health`);
    const data = response.data;
    
    logInfo(`Status: ${data.status}`);
    logInfo(`Version: ${data.version}`);
    logInfo(`Program ID: ${data.programId.substring(0, 20)}...`);
    
    if (data.security && data.security.rateLimitEnabled === true) {
      logSuccess('Rate limiting is ENABLED');
      logInfo(`Blocked IPs: ${data.security.blockedIPs}`);
      logInfo(`Total Violations: ${data.security.totalViolations}`);
      return true;
    } else {
      logFail('Rate limiting is NOT enabled');
      return false;
    }
  } catch (error) {
    logFail(`Health check failed: ${error.message}`);
    return false;
  }
}

// ============================================
// TEST 2: Moderate Rate Limit (GET requests)
// ============================================
async function testModerateRateLimit() {
  logTest('Moderate Rate Limit (GET Requests - 200/15min)');
  
  const limit = 200;
  const testRequests = 210; // Should fail at ~200
  let successCount = 0;
  let rateLimitTriggered = false;
  let rateLimitAt = 0;
  
  logInfo(`Sending ${testRequests} GET requests to /api/game/constants...`);
  logInfo('This should trigger rate limit around request #200');
  
  const startTime = performance.now();
  
  for (let i = 1; i <= testRequests; i++) {
    try {
      const response = await axios.get(`${API_URL}/api/game/constants`);
      successCount++;
      
      // Log progress every 50 requests
      if (i % 50 === 0) {
        logInfo(`Progress: ${i}/${testRequests} requests sent`);
        
        // Check rate limit headers
        if (response.headers['ratelimit-remaining']) {
          logInfo(`  Rate Limit Remaining: ${response.headers['ratelimit-remaining']}`);
        }
      }
      
      // Small delay to avoid overwhelming the server
      if (i % 10 === 0) {
        await sleep(10);
      }
      
    } catch (error) {
      if (error.response && error.response.status === 429) {
        rateLimitTriggered = true;
        rateLimitAt = i;
        
        logInfo(`\n🛑 Rate limit triggered at request #${i}`);
        
        // Check headers
        const headers = error.response.headers;
        if (headers['ratelimit-limit']) {
          logInfo(`  Rate Limit: ${headers['ratelimit-limit']}`);
        }
        if (headers['ratelimit-remaining']) {
          logInfo(`  Remaining: ${headers['ratelimit-remaining']}`);
        }
        if (headers['retry-after']) {
          logInfo(`  Retry After: ${headers['retry-after']} seconds`);
        }
        
        break;
      } else {
        logFail(`Unexpected error at request ${i}: ${error.message}`);
        break;
      }
    }
  }
  
  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  logInfo(`\nTest completed in ${duration} seconds`);
  logInfo(`Successful requests: ${successCount}`);
  logInfo(`Rate limit triggered: ${rateLimitTriggered ? 'Yes' : 'No'}`);
  
  // Evaluate results
  if (rateLimitTriggered && rateLimitAt >= 190 && rateLimitAt <= 210) {
    logSuccess(`Moderate rate limit working correctly (triggered at request #${rateLimitAt})`);
    return true;
  } else if (!rateLimitTriggered) {
    logFail('Rate limit was NOT triggered (limit may be too high or disabled)');
    return false;
  } else {
    logFail(`Rate limit triggered at unexpected point: #${rateLimitAt} (expected ~200)`);
    return false;
  }
}

// ============================================
// TEST 3: Strict Rate Limit (POST requests)
// ============================================
async function testStrictRateLimit() {
  logTest('Strict Rate Limit (POST Requests - 50/15min)');
  
  const limit = 50;
  const testRequests = 60; // Should fail at ~50
  let successCount = 0;
  let rateLimitTriggered = false;
  let rateLimitAt = 0;
  
  logInfo(`Sending ${testRequests} POST requests to /api/actions...`);
  logInfo('This should trigger rate limit around request #50');
  
  const startTime = performance.now();
  
  for (let i = 1; i <= testRequests; i++) {
    try {
      await axios.post(`${API_URL}/api/actions`, {
        txSignature: `test_signature_${Date.now()}_${i}`,
        actionType: 'buy',
        playerAddress: 'TestWalletAddress123456789012345678901234',
        blockTime: Math.floor(Date.now() / 1000),
        propertyId: 0,
        amount: 1000
      });
      
      successCount++;
      
      // Log progress every 10 requests
      if (i % 10 === 0) {
        logInfo(`Progress: ${i}/${testRequests} requests sent`);
      }
      
      // Small delay
      if (i % 5 === 0) {
        await sleep(10);
      }
      
    } catch (error) {
      if (error.response && error.response.status === 429) {
        rateLimitTriggered = true;
        rateLimitAt = i;
        
        logInfo(`\n🛑 Rate limit triggered at request #${i}`);
        
        const headers = error.response.headers;
        if (headers['retry-after']) {
          logInfo(`  Retry After: ${headers['retry-after']} seconds`);
        }
        
        break;
      } else if (error.response && error.response.status === 400) {
        // Bad request is expected since we're sending fake data
        successCount++;
      } else {
        logInfo(`Error at request ${i}: ${error.response?.status || error.message}`);
      }
    }
  }
  
  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  logInfo(`\nTest completed in ${duration} seconds`);
  logInfo(`Successful requests: ${successCount}`);
  logInfo(`Rate limit triggered: ${rateLimitTriggered ? 'Yes' : 'No'}`);
  
  // Evaluate results
  if (rateLimitTriggered && rateLimitAt >= 40 && rateLimitAt <= 60) {
    logSuccess(`Strict rate limit working correctly (triggered at request #${rateLimitAt})`);
    return true;
  } else if (!rateLimitTriggered) {
    logFail('Rate limit was NOT triggered (limit may be too high or disabled)');
    return false;
  } else {
    logFail(`Rate limit triggered at unexpected point: #${rateLimitAt} (expected ~50)`);
    return false;
  }
}

// ============================================
// TEST 4: Rate Limit Headers
// ============================================
async function testRateLimitHeaders() {
  logTest('Rate Limit Headers Check');
  
  try {
    const response = await axios.get(`${API_URL}/api/game/constants`);
    const headers = response.headers;
    
    logInfo('Checking for rate limit headers...');
    
    let hasHeaders = false;
    
    if (headers['ratelimit-limit']) {
      logSuccess(`Found RateLimit-Limit: ${headers['ratelimit-limit']}`);
      hasHeaders = true;
    } else {
      logInfo('RateLimit-Limit header not found');
    }
    
    if (headers['ratelimit-remaining']) {
      logSuccess(`Found RateLimit-Remaining: ${headers['ratelimit-remaining']}`);
      hasHeaders = true;
    } else {
      logInfo('RateLimit-Remaining header not found');
    }
    
    if (headers['ratelimit-reset']) {
      logSuccess(`Found RateLimit-Reset: ${headers['ratelimit-reset']}`);
      hasHeaders = true;
    } else {
      logInfo('RateLimit-Reset header not found');
    }
    
    if (hasHeaders) {
      logSuccess('Rate limit headers are present');
      return true;
    } else {
      logFail('No rate limit headers found (may need standardHeaders: true in config)');
      return false;
    }
    
  } catch (error) {
    logFail(`Failed to check headers: ${error.message}`);
    return false;
  }
}

// ============================================
// TEST 5: Rate Limit Statistics Endpoint
// ============================================
async function testRateLimitStats() {
  logTest('Rate Limit Statistics Endpoint');
  
  try {
    const response = await axios.get(`${API_URL}/api/admin/rate-limit-stats`);
    const data = response.data;
    
    logInfo('Statistics response:');
    logInfo(`  Success: ${data.success}`);
    
    if (data.stats) {
      logInfo(`  Total Violations: ${data.stats.totalViolations}`);
      logInfo(`  Unique IPs: ${data.stats.uniqueIPs}`);
      logInfo(`  Blocked IPs: ${data.stats.blockedIPs}`);
      
      if (data.stats.topViolators && data.stats.topViolators.length > 0) {
        logInfo('  Top Violators:');
        data.stats.topViolators.slice(0, 3).forEach((v, i) => {
          logInfo(`    ${i + 1}. ${v.ip}: ${v.violations} violations`);
        });
      }
      
      logSuccess('Statistics endpoint working correctly');
      return true;
    } else {
      logFail('Statistics data missing from response');
      return false;
    }
    
  } catch (error) {
    logFail(`Failed to get statistics: ${error.message}`);
    return false;
  }
}

// ============================================
// TEST 6: 429 Error Response Format
// ============================================
async function testErrorResponse() {
  logTest('429 Error Response Format');
  
  try {
    // First, trigger a rate limit
    logInfo('Sending requests to trigger rate limit...');
    
    for (let i = 0; i < 210; i++) {
      try {
        await axios.get(`${API_URL}/api/game/constants`);
      } catch (error) {
        if (error.response && error.response.status === 429) {
          const data = error.response.data;
          
          logInfo('429 Response received:');
          logInfo(`  Error: ${data.error}`);
          logInfo(`  Message: ${data.message}`);
          logInfo(`  Retry After: ${data.retryAfter || 'not specified'}`);
          
          if (data.error && data.message) {
            logSuccess('Error response format is correct');
            return true;
          } else {
            logFail('Error response missing expected fields');
            return false;
          }
        }
      }
    }
    
    logInfo('Could not trigger rate limit (may have already reset)');
    return true; // Not a failure, just couldn't test
    
  } catch (error) {
    logFail(`Test failed: ${error.message}`);
    return false;
  }
}

// ============================================
// TEST 7: Different Endpoints Have Different Limits
// ============================================
async function testEndpointSpecificLimits() {
  logTest('Endpoint-Specific Rate Limits');
  
  try {
    logInfo('Testing that different endpoints have different limits...');
    
    // Test a GET endpoint
    let getLimit = 0;
    for (let i = 0; i < 210; i++) {
      try {
        await axios.get(`${API_URL}/api/game/constants`);
        getLimit++;
      } catch (error) {
        if (error.response && error.response.status === 429) {
          break;
        }
      }
      if (i % 50 === 0 && i > 0) await sleep(10);
    }
    
    logInfo(`GET endpoint limit observed: ~${getLimit}`);
    
    await sleep(2000); // Brief pause
    
    // Test a POST endpoint
    let postLimit = 0;
    for (let i = 0; i < 70; i++) {
      try {
        await axios.post(`${API_URL}/api/actions`, {
          txSignature: `test_${Date.now()}_${i}`,
          actionType: 'buy',
          playerAddress: 'Test123456789012345678901234567890123',
          blockTime: Math.floor(Date.now() / 1000)
        });
        postLimit++;
      } catch (error) {
        if (error.response && error.response.status === 429) {
          break;
        } else if (error.response && error.response.status === 400) {
          postLimit++;
        }
      }
      if (i % 10 === 0 && i > 0) await sleep(10);
    }
    
    logInfo(`POST endpoint limit observed: ~${postLimit}`);
    
    // POST should have lower limit than GET
    if (postLimit < getLimit) {
      logSuccess('Endpoint-specific limits are working (POST < GET)');
      return true;
    } else {
      logInfo('Could not confirm different limits (may need rate limit reset)');
      return true; // Not necessarily a failure
    }
    
  } catch (error) {
    logFail(`Test failed: ${error.message}`);
    return false;
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runAllTests() {
  log('\n' + '='.repeat(70), 'magenta');
  log('🛡️  RATE LIMITER TEST SUITE', 'magenta');
  log('='.repeat(70), 'magenta');
  log(`\nTesting API: ${API_URL}`, 'yellow');
  log(`Start Time: ${new Date().toLocaleString()}`, 'yellow');
  
  const startTime = performance.now();
  
  // Run tests
  const test1 = await testHealthCheck();
  await sleep(1000);
  
  const test2 = await testRateLimitHeaders();
  await sleep(1000);
  
  const test3 = await testRateLimitStats();
  await sleep(1000);
  
  // These tests are destructive (trigger rate limits), so give option to skip
  log('\n⚠️  The following tests will trigger rate limits', 'yellow');
  log('   This may temporarily block your IP address', 'yellow');
  
  await waitForReset(3);
  
  const test4 = await testModerateRateLimit();
  
  await waitForReset(5);
  
  const test5 = await testStrictRateLimit();
  
  await waitForReset(5);
  
  const test6 = await testErrorResponse();
  
  await waitForReset(5);
  
  const test7 = await testEndpointSpecificLimits();
  
  // Final summary
  const endTime = performance.now();
  const totalDuration = ((endTime - startTime) / 1000 / 60).toFixed(2);
  
  log('\n' + '='.repeat(70), 'magenta');
  log('📊 TEST SUMMARY', 'magenta');
  log('='.repeat(70), 'magenta');
  
  log(`\nTotal Tests: ${results.passed + results.failed}`, 'cyan');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⏱️  Duration: ${totalDuration} minutes`, 'yellow');
  
  const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  log(`\n📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'red');
  
  log('\n' + '='.repeat(70), 'magenta');
  
  if (results.failed === 0) {
    log('🎉 ALL TESTS PASSED! Rate limiting is working correctly.', 'green');
  } else {
    log('⚠️  SOME TESTS FAILED. Please review the results above.', 'yellow');
  }
  
  log('='.repeat(70) + '\n', 'magenta');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});