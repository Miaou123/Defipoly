#!/usr/bin/env node
// ============================================
// Auto-kill script for port 3101
// Kills any existing process before starting server
// ============================================

const { execSync } = require('child_process');

const PORT = process.env.PORT || 3101;

console.log(`🔍 Checking if port ${PORT} is in use...`);

try {
  // Try to find process using the port
  const result = execSync(`lsof -ti :${PORT}`, { encoding: 'utf-8' }).trim();
  
  if (result) {
    const pids = result.split('\n').filter(pid => pid);
    console.log(`⚠️  Found ${pids.length} process(es) using port ${PORT}`);
    
    pids.forEach(pid => {
      try {
        console.log(`   Killing process ${pid}...`);
        execSync(`kill -9 ${pid}`);
        console.log(`   ✅ Killed process ${pid}`);
      } catch (killError) {
        console.error(`   ❌ Failed to kill process ${pid}:`, killError.message);
      }
    });
    
    // Give it a moment to actually release the port
    console.log('   ⏳ Waiting for port to be released...');
    setTimeout(() => {
      console.log(`✅ Port ${PORT} is now available\n`);
    }, 500);
  } else {
    console.log(`✅ Port ${PORT} is available\n`);
  }
} catch (error) {
  // lsof returns exit code 1 if no process found (which is good!)
  if (error.status === 1) {
    console.log(`✅ Port ${PORT} is available\n`);
  } else {
    console.error(`❌ Error checking port:`, error.message);
  }
}