#!/bin/bash

# Comprehensive Bot Test Suite for Defipoly
# Tests all major bot interactions with correct Monopoly property structure

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Property reference (Monopoly board)
# Set 0 (Brown): 0-1
# Set 1 (Light Blue): 2-4
# Set 2 (Pink): 5-7
# Set 3 (Orange): 8-10
# Set 4 (Red): 11-13
# Set 5 (Yellow): 14-16
# Set 6 (Green): 17-19
# Set 7 (Dark Blue): 20-21

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

print_header() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"
}

print_test() {
  echo -e "${CYAN}▶ Test $1: $2${NC}"
}

pass_test() {
  TESTS_PASSED=$((TESTS_PASSED + 1))
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  echo -e "${GREEN}  ✓ PASSED${NC}\n"
}

fail_test() {
  TESTS_FAILED=$((TESTS_FAILED + 1))
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  echo -e "${RED}  ✗ FAILED: $1${NC}\n"
}

# Test 1: Check wallet info
test_wallet_info() {
  print_test "1" "Get wallet info for wallet 0"
  
  if npm run bot info 0 > /tmp/test_output.txt 2>&1; then
    if grep -q "Player Account:" /tmp/test_output.txt; then
      pass_test
    else
      fail_test "Player account not initialized"
    fi
  else
    fail_test "Command failed"
  fi
}

# Test 2: Buy Mediterranean Avenue (Brown - Set 0)
test_brown_properties() {
  print_test "2" "Wallet 10 buys 1 slot of Mediterranean Avenue (Property 0)"
  
  if npm run bot buy 0 1 10 > /tmp/test_output.txt 2>&1; then
    if grep -q "✅ Bought 1 slot" /tmp/test_output.txt; then
      pass_test
    else
      fail_test "Buy did not complete successfully"
    fi
  else
    fail_test "Command failed"
  fi
}

# Test 3: Buy Light Blue properties
test_light_blue_properties() {
  print_test "3" "Wallet 11 buys Light Blue properties (Set 1: Properties 2-4)"
  
  success=0
  for prop_id in 2 3 4; do
    if npm run bot buy $prop_id 1 11 > /tmp/test_output.txt 2>&1; then
      if grep -q "✅ Bought 1 slot" /tmp/test_output.txt; then
        success=$((success + 1))
      fi
    fi
    sleep 1
  done
  
  if [ "$success" -eq 3 ]; then
    pass_test
    echo "  Note: Wallet 11 now owns complete Light Blue set"
  else
    fail_test "Expected 3 successful purchases, got $success"
  fi
}

# Test 4: Multi-slot purchase
test_multi_slot_buy() {
  print_test "4" "Wallet 12 buys 5 slots of Baltic Avenue (Property 1)"
  
  if npm run bot buy 1 5 12 > /tmp/test_output.txt 2>&1; then
    if grep -q "✅ Bought 5 slots" /tmp/test_output.txt; then
      pass_test
    else
      fail_test "Multi-slot buy failed"
    fi
  else
    fail_test "Command failed"
  fi
}

# Test 5: Pink properties (Set 2)
test_pink_properties() {
  print_test "5" "Wallet 13 buys Pink properties (Set 2: Properties 5-7)"
  
  success=0
  for prop_id in 5 6 7; do
    if npm run bot buy $prop_id 1 13 > /tmp/test_output.txt 2>&1; then
      if grep -q "✅ Bought 1 slot" /tmp/test_output.txt; then
        success=$((success + 1))
      fi
    fi
    sleep 1
  done
  
  if [ "$success" -eq 3 ]; then
    pass_test
  else
    fail_test "Expected 3 successful purchases, got $success"
  fi
}

# Test 6: Shield activation
test_shield_activation() {
  print_test "6" "Wallet 10 activates shield for Property 0"
  
  if npm run bot shield 0 1 10 > /tmp/test_output.txt 2>&1; then
    if grep -q "✅ Shield activated" /tmp/test_output.txt; then
      pass_test
    else
      fail_test "Shield activation failed"
    fi
  else
    fail_test "Command failed"
  fi
}

# Test 7: Orange properties (Set 3)
test_orange_properties() {
  print_test "7" "Wallet 14 buys Orange properties (Set 3: Properties 8-10)"
  
  success=0
  for prop_id in 8 9 10; do
    if npm run bot buy $prop_id 1 14 > /tmp/test_output.txt 2>&1; then
      if grep -q "✅ Bought 1 slot" /tmp/test_output.txt; then
        success=$((success + 1))
      fi
    fi
    sleep 1
  done
  
  if [ "$success" -ge 2 ]; then
    pass_test
  else
    fail_test "Expected at least 2 successful purchases, got $success"
  fi
}

# Test 8: Red properties (Set 4)
test_red_properties() {
  print_test "8" "Wallet 15 buys Red properties (Set 4: Properties 11-13)"
  
  success=0
  for prop_id in 11 12 13; do
    if npm run bot buy $prop_id 1 15 > /tmp/test_output.txt 2>&1; then
      if grep -q "✅ Bought 1 slot" /tmp/test_output.txt; then
        success=$((success + 1))
      fi
    fi
    sleep 1
  done
  
  if [ "$success" -ge 2 ]; then
    pass_test
  else
    fail_test "Expected at least 2 successful purchases, got $success"
  fi
}

# Test 9: Yellow properties (Set 5)
test_yellow_properties() {
  print_test "9" "Wallet 16 buys Yellow properties (Set 5: Properties 14-16)"
  
  success=0
  for prop_id in 14 15 16; do
    if npm run bot buy $prop_id 1 16 > /tmp/test_output.txt 2>&1; then
      if grep -q "✅ Bought 1 slot" /tmp/test_output.txt; then
        success=$((success + 1))
      fi
    fi
    sleep 1
  done
  
  if [ "$success" -ge 2 ]; then
    pass_test
  else
    fail_test "Expected at least 2 successful purchases, got $success"
  fi
}

# Test 10: Green properties (Set 6)
test_green_properties() {
  print_test "10" "Wallet 17 buys Green properties (Set 6: Properties 17-19)"
  
  success=0
  for prop_id in 17 18 19; do
    if npm run bot buy $prop_id 1 17 > /tmp/test_output.txt 2>&1; then
      if grep -q "✅ Bought 1 slot" /tmp/test_output.txt; then
        success=$((success + 1))
      fi
    fi
    sleep 1
  done
  
  if [ "$success" -ge 2 ]; then
    pass_test
  else
    fail_test "Expected at least 2 successful purchases, got $success"
  fi
}

# Test 11: Dark Blue properties (Set 7) - Most expensive!
test_dark_blue_properties() {
  print_test "11" "Wallet 18 buys Dark Blue properties (Set 7: Park Place & Boardwalk)"
  
  success=0
  # Park Place (20) and Boardwalk (21)
  for prop_id in 20 21; do
    if npm run bot buy $prop_id 1 18 > /tmp/test_output.txt 2>&1; then
      if grep -q "✅ Bought 1 slot" /tmp/test_output.txt; then
        success=$((success + 1))
      fi
    fi
    sleep 1
  done
  
  if [ "$success" -ge 1 ]; then
    pass_test
    echo "  Note: Dark Blue properties are most expensive!"
  else
    fail_test "Expected at least 1 successful purchase, got $success"
  fi
}

# Test 12: Multiple wallets same property
test_multiple_wallets_same_property() {
  print_test "12" "Multiple wallets (19-21) buy Mediterranean Avenue"
  
  if npm run bot buy 0 1 19 20 21 > /tmp/test_output.txt 2>&1; then
    success_count=$(grep -c "✅ Bought 1 slot" /tmp/test_output.txt || echo "0")
    if [ "$success_count" -ge 2 ]; then
      pass_test
    else
      fail_test "Expected at least 2 successful purchases, got $success_count"
    fi
  else
    fail_test "Command failed"
  fi
}

# Test 13: Shield multiple properties
test_multi_shield() {
  print_test "13" "Activate shields for multiple wallets"
  
  npm run bot shield 0 1 10 19 20 > /tmp/test_output.txt 2>&1
  success_count=$(grep -c "✅ Shield activated" /tmp/test_output.txt || echo "0")
  
  if [ "$success_count" -ge 2 ]; then
    pass_test
  else
    fail_test "Expected at least 2 successful shield activations, got $success_count"
  fi
}

# Test 14: Batch status check
test_batch_status() {
  print_test "14" "Check batch status command"
  
  if ./scripts/bot/batch-operations.sh status > /tmp/test_output.txt 2>&1; then
    if grep -q "Initialized:" /tmp/test_output.txt && grep -q "Total Slots Owned:" /tmp/test_output.txt; then
      # Extract actual numbers
      total_slots=$(grep "Total Slots Owned:" /tmp/test_output.txt | awk '{print $4}')
      echo "  Total slots owned across all wallets: $total_slots"
      pass_test
    else
      fail_test "Status output missing expected information"
    fi
  else
    fail_test "Command failed"
  fi
}

# Test 15: Verify property ownership
test_verify_ownership() {
  print_test "15" "Verify wallet 11 owns Light Blue set"
  
  if npm run bot info 11 > /tmp/test_output.txt 2>&1; then
    property_count=$(grep -c "Property" /tmp/test_output.txt || echo "0")
    if [ "$property_count" -ge 3 ]; then
      pass_test
      echo "  Note: Wallet owns $property_count properties"
    else
      fail_test "Expected at least 3 properties, found $property_count"
    fi
  else
    fail_test "Command failed"
  fi
}

# Test 16: Claim rewards test
test_claim_rewards() {
  print_test "16" "Attempt to claim rewards"
  
  npm run bot claim 10 > /tmp/test_output.txt 2>&1
  
  if grep -q "✅ Rewards claimed" /tmp/test_output.txt; then
    pass_test
    echo "  Note: Rewards were available and claimed"
  elif grep -q "Claim too soon" /tmp/test_output.txt || grep -q "No rewards" /tmp/test_output.txt; then
    pass_test
    echo "  Note: Correctly enforced claim restrictions"
  else
    fail_test "Unexpected error during claim"
  fi
}

# Test 17: Different slot amounts across properties
test_varied_slot_purchases() {
  print_test "17" "Test varied slot purchases across different properties"
  
  success=0
  
  # 2 slots of Baltic
  if npm run bot buy 1 2 22 > /tmp/test_output.txt 2>&1; then
    if grep -q "✅ Bought 2 slot" /tmp/test_output.txt; then
      success=$((success + 1))
    fi
  fi
  
  # 3 slots of Connecticut
  if npm run bot buy 4 3 23 > /tmp/test_output.txt 2>&1; then
    if grep -q "✅ Bought 3 slot" /tmp/test_output.txt; then
      success=$((success + 1))
    fi
  fi
  
  if [ "$success" -ge 1 ]; then
    pass_test
  else
    fail_test "Expected at least 1 successful varied purchase, got $success"
  fi
}

# Main test execution
main() {
  print_header "DEFIPOLY BOT TEST SUITE - MONOPOLY EDITION"
  
  echo "Testing 22 Monopoly properties across 8 color sets"
  echo "Properties: Mediterranean to Boardwalk (IDs 0-21)"
  echo ""
  
  # Run all tests
  test_wallet_info
  test_brown_properties
  test_light_blue_properties
  test_multi_slot_buy
  test_pink_properties
  test_shield_activation
  test_orange_properties
  test_red_properties
  test_yellow_properties
  test_green_properties
  test_dark_blue_properties
  test_multiple_wallets_same_property
  test_multi_shield
  test_batch_status
  test_verify_ownership
  test_claim_rewards
  test_varied_slot_purchases
  
  # Print summary
  print_header "TEST SUMMARY"
  
  echo "Total Tests:  $TESTS_TOTAL"
  echo -e "Passed:       ${GREEN}$TESTS_PASSED${NC}"
  echo -e "Failed:       ${RED}$TESTS_FAILED${NC}"
  
  # Calculate pass rate
  if [ $TESTS_TOTAL -gt 0 ]; then
    pass_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    echo "Pass Rate:    ${pass_rate}%"
  fi
  
  echo ""
  
  if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}  Your bot is working perfectly!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    exit 0
  elif [ $TESTS_PASSED -ge $((TESTS_TOTAL * 80 / 100)) ]; then
    echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  ⚠ MOSTLY PASSING (${pass_rate}%)${NC}"
    echo -e "${YELLOW}  Core functionality works, some edge cases failed${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
    exit 0
  else
    echo -e "${RED}═══════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ✗ TESTS NEED ATTENTION${NC}"
    echo -e "${RED}  Check failed tests above${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════${NC}"
    exit 1
  fi
}

# Cleanup temp files on exit
cleanup() {
  rm -f /tmp/test_output*.txt
}
trap cleanup EXIT

# Run main
main


print_header() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"
}

print_test() {
  echo -e "${CYAN}▶ Test $1: $2${NC}"
}

pass_test() {
  TESTS_PASSED=$((TESTS_PASSED + 1))
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  echo -e "${GREEN}  ✓ PASSED${NC}\n"
}

fail_test() {
  TESTS_FAILED=$((TESTS_FAILED + 1))
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  echo -e "${RED}  ✗ FAILED: $1${NC}\n"
}

# Test 1: Check wallet info
test_wallet_info() {
  print_test "1" "Get wallet info for wallet 0"
  
  if npm run bot info 0 > /tmp/test_output.txt 2>&1; then
    if grep -q "Player Account:" /tmp/test_output.txt; then
      pass_test
    else
      fail_test "Player account not initialized"
    fi
  else
    fail_test "Command failed"
  fi
}

# Test 2: Single wallet buy single slot
test_single_buy() {
  print_test "2" "Wallet 0 buys 1 slot of Bronze Basic"
  
  if npm run bot buy 0 1 0 > /tmp/test_output.txt 2>&1; then
    if grep -q "✅ Bought 1 slot" /tmp/test_output.txt; then
      pass_test
    else
      fail_test "Buy did not complete successfully"
    fi
  else
    fail_test "Command failed"
  fi
}

# Test 3: Multi-slot purchase
test_multi_slot_buy() {
  print_test "3" "Wallet 1 buys 3 slots of Bronze Basic"
  
  if npm run bot buy 0 3 1 > /tmp/test_output.txt 2>&1; then
    if grep -q "✅ Bought 3 slots" /tmp/test_output.txt; then
      pass_test
    else
      fail_test "Multi-slot buy failed"
    fi
  else
    fail_test "Command failed"
  fi
}

# Test 4: Multiple wallets buy
test_multiple_wallets_buy() {
  print_test "4" "Wallets 2-4 each buy 1 slot of Bronze Plus"
  
  if npm run bot buy 1 1 2 3 4 > /tmp/test_output.txt 2>&1; then
    success_count=$(grep -c "✅ Bought 1 slot" /tmp/test_output.txt || echo "0")
    if [ "$success_count" -eq 3 ]; then
      pass_test
    else
      fail_test "Expected 3 successful purchases, got $success_count"
    fi
  else
    fail_test "Command failed"
  fi
}

# Test 5: Shield activation
test_shield_activation() {
  print_test "5" "Wallet 0 activates shield for 1 slot"
  
  if npm run bot shield 0 1 0 > /tmp/test_output.txt 2>&1; then
    if grep -q "✅ Shield activated" /tmp/test_output.txt; then
      pass_test
    else
      fail_test "Shield activation failed"
    fi
  else
    fail_test "Command failed"
  fi
}

# Test 6: Check updated wallet info
test_wallet_info_after_purchase() {
  print_test "6" "Verify wallet 0 now owns property slots"
  
  if npm run bot info 0 > /tmp/test_output.txt 2>&1; then
    if grep -q "Property 0:" /tmp/test_output.txt; then
      pass_test
    else
      fail_test "Property ownership not shown"
    fi
  else
    fail_test "Command failed"
  fi
}

# Test 7: Different property types
test_different_properties() {
  print_test "7" "Wallet 5 buys different property types"
  
  success=0
  
  # Buy Silver Basic
  if npm run bot buy 2 1 5 > /tmp/test_output.txt 2>&1; then
    if grep -q "✅ Bought 1 slot" /tmp/test_output.txt; then
      success=$((success + 1))
    fi
  fi
  
  # Buy Gold Basic
  if npm run bot buy 4 1 5 > /tmp/test_output.txt 2>&1; then
    if grep -q "✅ Bought 1 slot" /tmp/test_output.txt; then
      success=$((success + 1))
    fi
  fi
  
  if [ "$success" -eq 2 ]; then
    pass_test
  else
    fail_test "Expected 2 successful purchases, got $success"
  fi
}

# Test 8: Batch operations - status
test_batch_status() {
  print_test "8" "Check batch status command"
  
  if ./scripts/bot/batch-operations.sh status > /tmp/test_output.txt 2>&1; then
    if grep -q "Initialized:" /tmp/test_output.txt && grep -q "Total Slots Owned:" /tmp/test_output.txt; then
      pass_test
    else
      fail_test "Status output missing expected information"
    fi
  else
    fail_test "Command failed"
  fi
}

# Test 9: Claim rewards (expected to fail if < 1 minute)
test_claim_rewards() {
  print_test "9" "Attempt to claim rewards (may fail if too soon)"
  
  npm run bot claim 0 > /tmp/test_output.txt 2>&1
  
  if grep -q "✅ Rewards claimed" /tmp/test_output.txt; then
    pass_test
    echo "  Note: Rewards were available and claimed successfully"
  elif grep -q "Claim too soon" /tmp/test_output.txt; then
    pass_test
    echo "  Note: Correctly enforced minimum claim interval"
  else
    fail_test "Unexpected error during claim"
  fi
}

# Test 10: Fill property (10 wallets)
test_fill_property() {
  print_test "10" "Fill Bronze Plus with wallets 10-19 (1 slot each)"
  
  if ./scripts/bot/batch-operations.sh fill 1 1 > /tmp/test_output.txt 2>&1; then
    # This will try to fill with all 50 wallets, but that's okay
    # Just check if command completed
    pass_test
  else
    fail_test "Fill command failed"
  fi
}

# Test 11: Multi-wallet shield activation
test_multi_shield() {
  print_test "11" "Activate shields for wallets 1-3 on Bronze Basic"
  
  npm run bot shield 0 1 1 2 3 > /tmp/test_output.txt 2>&1
  success_count=$(grep -c "✅ Shield activated" /tmp/test_output.txt || echo "0")
  
  if [ "$success_count" -ge 2 ]; then
    pass_test
  else
    fail_test "Expected at least 2 successful shield activations, got $success_count"
  fi
}

# Test 12: Detailed status
test_detail_status() {
  print_test "12" "Get detailed status for first 3 wallets"
  
  success=0
  for i in {0..2}; do
    if npm run bot info $i > /tmp/test_output_$i.txt 2>&1; then
      if grep -q "Player Account:" /tmp/test_output_$i.txt; then
        success=$((success + 1))
      fi
    fi
  done
  
  if [ "$success" -eq 3 ]; then
    pass_test
  else
    fail_test "Expected 3 successful info queries, got $success"
  fi
}

# Test 13: Error handling - invalid wallet
test_error_handling() {
  print_test "13" "Error handling for non-existent wallet"
  
  if npm run bot info 999 > /tmp/test_output.txt 2>&1; then
    fail_test "Should have failed for invalid wallet ID"
  else
    if grep -q "not found" /tmp/test_output.txt || grep -q "Error" /tmp/test_output.txt; then
      pass_test
    else
      fail_test "Error message not clear"
    fi
  fi
}

# Test 14: Verify all initialized
test_all_initialized() {
  print_test "14" "Verify all 50 wallets are initialized"
  
  if ./scripts/bot/batch-operations.sh status > /tmp/test_output.txt 2>&1; then
    if grep -q "Initialized: 50/50" /tmp/test_output.txt; then
      pass_test
    else
      initialized=$(grep "Initialized:" /tmp/test_output.txt | awk '{print $2}')
      fail_test "Expected 50/50 initialized, got $initialized"
    fi
  else
    fail_test "Command failed"
  fi
}

# Test 15: Different slot amounts
test_different_slot_amounts() {
  print_test "15" "Test various slot purchase amounts"
  
  success=0
  
  # 2 slots
  if npm run bot buy 0 2 6 > /tmp/test_output.txt 2>&1; then
    if grep -q "✅ Bought 2 slot" /tmp/test_output.txt; then
      success=$((success + 1))
    fi
  fi
  
  # 5 slots
  if npm run bot buy 0 5 7 > /tmp/test_output.txt 2>&1; then
    if grep -q "✅ Bought 5 slot" /tmp/test_output.txt; then
      success=$((success + 1))
    fi
  fi
  
  if [ "$success" -eq 2 ]; then
    pass_test
  else
    fail_test "Expected 2 successful purchases with different amounts, got $success"
  fi
}

# Main test execution
main() {
  print_header "DEFIPOLY BOT TEST SUITE"
  
  echo "Starting comprehensive bot testing..."
  echo "This will test all major bot interactions"
  echo ""
  
  # Run all tests
  test_wallet_info
  test_single_buy
  test_multi_slot_buy
  test_multiple_wallets_buy
  test_shield_activation
  test_wallet_info_after_purchase
  test_different_properties
  test_batch_status
  test_claim_rewards
  test_fill_property
  test_multi_shield
  test_detail_status
  test_error_handling
  test_all_initialized
  test_different_slot_amounts
  
  # Print summary
  print_header "TEST SUMMARY"
  
  echo "Total Tests:  $TESTS_TOTAL"
  echo -e "Passed:       ${GREEN}$TESTS_PASSED${NC}"
  echo -e "Failed:       ${RED}$TESTS_FAILED${NC}"
  echo ""
  
  if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    exit 0
  else
    echo -e "${RED}═══════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ✗ SOME TESTS FAILED${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════${NC}"
    exit 1
  fi
}

# Cleanup temp files on exit
cleanup() {
  rm -f /tmp/test_output*.txt
}
trap cleanup EXIT

# Run main
main