#!/bin/bash

# Verify all wallets are properly set up

echo "🔍 Verifying all 50 wallets..."
echo ""

total_wallets=0
funded_wallets=0
token_wallets=0
initialized_players=0

for i in {0..49}; do
  total_wallets=$((total_wallets + 1))
  
  # Get wallet info
  output=$(tsx scripts/bot-interactions.ts info $i 2>/dev/null)
  
  # Check SOL balance
  sol_balance=$(echo "$output" | grep "SOL:" | awk '{print $2}')
  if (( $(echo "$sol_balance > 0" | bc -l) )); then
    funded_wallets=$((funded_wallets + 1))
  fi
  
  # Check token balance
  token_balance=$(echo "$output" | grep "Tokens:" | awk '{print $2}')
  if [[ "$token_balance" != "0" ]] && [[ "$token_balance" != "no" ]]; then
    token_wallets=$((token_wallets + 1))
  fi
  
  # Check if initialized
  if ! echo "$output" | grep -q "Not initialized"; then
    initialized_players=$((initialized_players + 1))
  fi
  
  # Print progress
  if [ $((i % 10)) -eq 9 ]; then
    echo "  Checked wallets 0-$i..."
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VERIFICATION RESULTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Wallets:        $total_wallets"
echo "Funded with SOL:      $funded_wallets"
echo "Have Tokens:          $token_wallets"
echo "Players Initialized:  $initialized_players"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $funded_wallets -eq 50 ] && [ $token_wallets -eq 50 ] && [ $initialized_players -eq 50 ]; then
  echo "✅ ALL SYSTEMS GO! All 50 wallets are ready."
elif [ $funded_wallets -eq 50 ] && [ $token_wallets -eq 50 ]; then
  echo "✅ All wallets funded and have tokens!"
  echo "⚠️  Some players not initialized. Run: npm run bot:init"
else
  echo "⚠️  Some wallets may need attention:"
  [ $funded_wallets -lt 50 ] && echo "   - $((50 - funded_wallets)) wallets need SOL"
  [ $token_wallets -lt 50 ] && echo "   - $((50 - token_wallets)) wallets need tokens"
  [ $initialized_players -lt 50 ] && echo "   - $((50 - initialized_players)) players need initialization"
  echo ""
  echo "To fix, run: ./batch-bot-operations.sh fund"
  echo "Then run: npm run bot:init"
fi
echo ""

# Show sample wallets
echo "📋 Sample Wallet Details (First 3):"
echo ""
for i in {0..2}; do
  tsx scripts/bot-interactions.ts info $i
  echo ""
done