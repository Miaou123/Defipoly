#!/usr/bin/env node
// Usage: node src/scripts/whitelist.js add <wallet>
//        node src/scripts/whitelist.js remove <wallet>
//        node src/scripts/whitelist.js list

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./defipoly.db');

const [,, action, wallet] = process.argv;

if (action === 'add' && wallet) {
  db.run('INSERT OR IGNORE INTO airdrop_whitelist (wallet) VALUES (?)', [wallet], function(err) {
    if (err) console.error('Error:', err.message);
    else console.log(`✅ Added: ${wallet}`);
    db.close();
  });
} else if (action === 'remove' && wallet) {
  db.run('DELETE FROM airdrop_whitelist WHERE wallet = ?', [wallet], function(err) {
    if (err) console.error('Error:', err.message);
    else console.log(`✅ Removed: ${wallet}`);
    db.close();
  });
} else if (action === 'list') {
  db.all('SELECT wallet FROM airdrop_whitelist', [], (err, rows) => {
    if (err) console.error('Error:', err.message);
    else {
      console.log(`📋 Whitelist (${rows.length} wallets):`);
      rows.forEach(r => console.log(`  ${r.wallet}`));
    }
    db.close();
  });
} else {
  console.log('Usage:');
  console.log('  node src/scripts/whitelist.js add <wallet>');
  console.log('  node src/scripts/whitelist.js remove <wallet>');
  console.log('  node src/scripts/whitelist.js list');
}
