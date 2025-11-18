import { CONFIG } from '../config.js';

export function showHeader(): void {
  console.clear();
  console.log('\n🎮 DEFIPOLY ADMIN CLI');
  console.log('='.repeat(70));
  console.log(`RPC: ${CONFIG.RPC_URL}`);
  console.log(`Wallet: ${CONFIG.WALLET_PATH}`);
  console.log('='.repeat(70));
}

export function showMainMenu(): void {
  showHeader();
  console.log('\nSelect an action:');
  console.log('\n📋 PLAYER MANAGEMENT:');
  console.log('  1. 🎁 Grant Property Slots');
  console.log('  2. 🚫 Revoke Property Slots');
  console.log('  3. 🛡️  Grant Shield (All Properties)');
  console.log('  4. 🗑️  Close Player Account');
  
  console.log('\n🏠 PROPERTY MANAGEMENT:');
  console.log('  5. 💰 Update Property Price');
  console.log('  6. 🏠 Update Property Max Slots');
  console.log('  7. 📈 Update Property Yield');
  console.log('  8. 🛡️  Update Shield Cost');
  console.log('  9. ⏱️  Update Property Cooldown');
  
  console.log('\n🎮 GAME MANAGEMENT:');
  console.log('  10. ⏸️  Pause Game');
  console.log('  11. ▶️  Unpause Game');
  console.log('  12. 🔄 Update Game Phase');
  console.log('  13. 🎯 Update Steal Chances');
  console.log('  14. 🌍 Update Global Rates');
  
  console.log('\n🔧 ADMIN TOOLS:');
  console.log('  15. ⏱️  Clear Purchase Cooldown');
  console.log('  16. 🎯 Clear Steal Cooldown');
  console.log('  17. 🚨 Emergency Withdraw');
  console.log('  18. 👑 Transfer Authority');
  
  console.log('\n  0. ❌ Exit');
  console.log('');
}