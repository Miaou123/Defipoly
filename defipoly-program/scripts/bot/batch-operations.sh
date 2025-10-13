#!/bin/bash

# Defipoly Bot Batch Operations - Updated for Monopoly (22 properties)
# This script provides convenient batch operations for testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

print_header() {
  echo -e "\n${BLUE}================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Command: setup-all
setup_all() {
  print_header "🚀 Complete Setup"
  
  cd "$PROJECT_ROOT"
  
  echo "Step 1: Creating wallets and funding..."
  npm run bot:setup
  
  echo ""
  echo "Step 2: Initializing all players..."
  npm run bot:init
  
  print_success "Setup complete! All 50 wallets are ready."
}

# Command: distribute-properties (UPDATED for 22 Monopoly properties)
distribute_properties() {
  print_header "🏠 Distributing Monopoly Properties"
  
  cd "$PROJECT_ROOT"
  
  echo "Distributing across Monopoly board (22 properties, 8 sets)..."
  
  # Set 0: Brown (Properties 0-1) - Wallets 0-9
  echo -e "${CYAN}Set 0 (Brown): Mediterranean & Baltic${NC}"
  npm run bot buy 0 1 0 1 2 3 4 > /dev/null 2>&1 || echo "  Some purchases may have failed"
  npm run bot buy 1 1 5 6 7 8 9 > /dev/null 2>&1 || echo "  Some purchases may have failed"
  
  # Set 1: Light Blue (Properties 2-4) - Wallets 10-19
  echo -e "${CYAN}Set 1 (Light Blue): Oriental, Vermont, Connecticut${NC}"
  npm run bot buy 2 1 10 11 12 13 > /dev/null 2>&1 || echo "  Some purchases may have failed"
  npm run bot buy 3 1 14 15 16 > /dev/null 2>&1 || echo "  Some purchases may have failed"
  npm run bot buy 4 1 17 18 19 > /dev/null 2>&1 || echo "  Some purchases may have failed"
  
  # Set 2: Pink (Properties 5-7) - Wallets 20-29
  echo -e "${CYAN}Set 2 (Pink): St. Charles, States, Virginia${NC}"
  npm run bot buy 5 1 20 21 22 23 > /dev/null 2>&1 || echo "  Some purchases may have failed"
  npm run bot buy 6 1 24 25 26 > /dev/null 2>&1 || echo "  Some purchases may have failed"
  npm run bot buy 7 1 27 28 29 > /dev/null 2>&1 || echo "  Some purchases may have failed"
  
  # Set 3: Orange (Properties 8-10) - Wallets 30-39
  echo -e "${CYAN}Set 3 (Orange): St. James, Tennessee, New York${NC}"
  npm run bot buy 8 1 30 31 32 33 > /dev/null 2>&1 || echo "  Some purchases may have failed"
  npm run bot buy 9 1 34 35 36 > /dev/null 2>&1 || echo "  Some purchases may have failed"
  npm run bot buy 10 1 37 38 39 > /dev/null 2>&1 || echo "  Some purchases may have failed"
  
  # Set 4: Red (Properties 11-13) - Wallets 40-49
  echo -e "${CYAN}Set 4 (Red): Kentucky, Indiana, Illinois${NC}"
  npm run bot buy 11 1 40 41 42 > /dev/null 2>&1 || echo "  Some purchases may have failed"
  npm run bot buy 12 1 43 44 45 > /dev/null 2>&1 || echo "  Some purchases may have failed"
  npm run bot buy 13 1 46 47 48 49 > /dev/null 2>&1 || echo "  Some purchases may have failed"
  
  print_warning "Sets 5-7 (Yellow, Green, Dark Blue) not distributed - only 50 wallets"
  print_success "Properties distributed! (Sets 0-4 covered)"
}

# Command: fill-property
fill_property() {
  if [ -z "$1" ]; then
    print_error "Usage: $0 fill <property_id> [slots]"
    exit 1
  fi
  
  local property_id=$1
  local slots=${2:-1}
  
  cd "$PROJECT_ROOT"
  
  print_header "📦 Filling Property $property_id ($slots slots each)"
  
  # Build wallet list
  wallets=""
  for i in {0..49}; do
    wallets="$wallets $i"
  done
  
  npm run bot buy $property_id $slots $wallets
  print_success "All wallets attempted to buy property $property_id"
}

# Command: activate-all-shields
activate_shields() {
  if [ -z "$1" ]; then
    print_error "Usage: $0 shields <property_id> <slots> [wallets...]"
    exit 1
  fi
  
  local property_id=$1
  local slots=${2:-1}
  shift 2
  local wallets="$@"
  
  if [ -z "$wallets" ]; then
    # Default to all wallets
    wallets=$(seq 0 49)
  fi
  
  cd "$PROJECT_ROOT"
  
  print_header "🛡️  Activating Shields"
  npm run bot shield $property_id $slots $wallets
  print_success "Shields activated for property $property_id"
}

# Command: claim-all
claim_all() {
  cd "$PROJECT_ROOT"
  
  print_header "💰 Claiming Rewards"
  npm run bot:claim
  print_success "All rewards claimed!"
}

# Command: status (FIXED for better reliability)
check_status() {
  cd "$PROJECT_ROOT"
  
  print_header "📊 Wallet Status Summary"
  
  local total_initialized=0
  local total_slots=0
  local has_properties=0
  
  for i in {0..49}; do
    # Run bot info command and capture output
    output=$(npm run bot info $i 2>/dev/null || echo "")
    
    # Check if player is initialized
    if echo "$output" | grep -q "Player Account:"; then
      total_initialized=$((total_initialized + 1))
      
      # Try to extract slot count
      slots=$(echo "$output" | grep -i "total.*slots.*owned\|slots owned:" | grep -oP '\d+' | head -1 || echo "0")
      
      # Fallback: count Property lines
      if [ -z "$slots" ] || [ "$slots" -eq 0 ]; then
        slots=$(echo "$output" | grep -c "Property" || echo "0")
      fi
      
      # Ensure slots is numeric
      slots=${slots:-0}
      
      if [ "$slots" -gt 0 ]; then
        total_slots=$((total_slots + slots))
        has_properties=$((has_properties + 1))
        echo -e "Wallet $i: ${GREEN}✓${NC} Initialized, $slots slots"
      fi
    fi
  done
  
  echo ""
  echo "Summary:"
  echo "  Initialized: $total_initialized/50"
  echo "  With Properties: $has_properties/50"
  echo "  Total Slots Owned: $total_slots"
}

# Command: detail-status
detail_status() {
  cd "$PROJECT_ROOT"
  
  print_header "📊 Detailed Status (First 10 Wallets)"
  
  for i in {0..9}; do
    echo -e "${CYAN}=== Wallet $i ===${NC}"
    npm run bot info $i
    echo ""
  done
}

# Command: check-set (NEW - Check complete set ownership)
check_set() {
  if [ -z "$1" ]; then
    print_error "Usage: $0 check-set <wallet_id>"
    exit 1
  fi
  
  local wallet=$1
  
  cd "$PROJECT_ROOT"
  
  print_header "🏆 Set Ownership for Wallet $wallet"
  
  output=$(npm run bot info $wallet 2>/dev/null)
  
  # Check each set
  sets=(
    "0:Brown:0,1"
    "1:Light Blue:2,3,4"
    "2:Pink:5,6,7"
    "3:Orange:8,9,10"
    "4:Red:11,12,13"
    "5:Yellow:14,15,16"
    "6:Green:17,18,19"
    "7:Dark Blue:20,21"
  )
  
  for set_info in "${sets[@]}"; do
    IFS=':' read -r set_id set_name props <<< "$set_info"
    IFS=',' read -ra prop_array <<< "$props"
    
    # Check if owns all properties in set
    owns_all=true
    for prop in "${prop_array[@]}"; do
      if ! echo "$output" | grep -q "Property $prop:"; then
        owns_all=false
        break
      fi
    done
    
    if $owns_all; then
      echo -e "${GREEN}✓ Set $set_id ($set_name): COMPLETE${NC}"
    else
      owned=0
      for prop in "${prop_array[@]}"; do
        if echo "$output" | grep -q "Property $prop:"; then
          owned=$((owned + 1))
        fi
      done
      if [ $owned -gt 0 ]; then
        echo -e "${YELLOW}○ Set $set_id ($set_name): $owned/${#prop_array[@]} properties${NC}"
      fi
    fi
  done
}

# Command: reset
reset_wallets() {
  cd "$PROJECT_ROOT"
  
  print_header "🔄 Resetting Test Wallets"
  print_warning "This will delete all test wallets!"
  read -p "Are you sure? (y/N) " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf ./test-wallets
    print_success "Test wallets deleted. Run setup-all to recreate."
  else
    print_warning "Reset cancelled"
  fi
}

# Command: test-scenario
test_scenario() {
  cd "$PROJECT_ROOT"
  
  case "$1" in
    1)
      print_header "🎮 Scenario 1: Basic Testing"
      echo "All wallets buy 1 slot of Mediterranean Avenue (Property 0)"
      npm run bot buy 0 1 $(seq 0 49)
      print_success "Scenario 1 complete"
      ;;
    
    2)
      print_header "🎮 Scenario 2: Monopoly Distribution"
      distribute_properties
      print_success "Scenario 2 complete"
      ;;
    
    3)
      print_header "🎮 Scenario 3: Complete Set Purchase"
      echo "Wallet 10 buys complete Brown set (Properties 0-1)"
      npm run bot buy 0 3 10
      sleep 65
      npm run bot buy 1 3 10
      echo ""
      echo "Checking set ownership..."
      sleep 2
      npm run bot info 10
      print_success "Scenario 3 complete - Check if set bonus appears"
      ;;
    
    4)
      print_header "🎮 Scenario 4: Shield & Rewards Flow"
      echo "Wallets 0-9 buy Mediterranean, then wallets 0-4 activate shields..."
      npm run bot buy 0 1 $(seq 0 9)
      sleep 2
      npm run bot shield 0 1 $(seq 0 4)
      print_warning "Wait for rewards to accumulate, then run: npm run bot:claim"
      print_success "Scenario 4 setup complete"
      ;;
    
    5)
      print_header "🎮 Scenario 5: Cooldown Testing"
      echo "Testing cooldown enforcement..."
      echo "Wallet 20 buys Property 0 (Mediterranean)"
      npm run bot buy 0 1 20
      sleep 2
      echo "Wallet 20 tries Property 1 (Baltic) - should be blocked by cooldown"
      npm run bot buy 1 1 20
      echo ""
      print_warning "Second purchase should fail with CooldownActive error"
      print_success "Scenario 5 complete"
      ;;
    
    *)
      echo "Available scenarios:"
      echo "  1 - Basic testing (all buy 1 slot of Property 0)"
      echo "  2 - Monopoly distribution (spread across sets)"
      echo "  3 - Complete set purchase (test set bonus)"
      echo "  4 - Shield & rewards flow"
      echo "  5 - Cooldown testing (verify cooldown works)"
      echo ""
      echo "Usage: $0 scenario <1-5>"
      ;;
  esac
}

# Command: fund-wallets
fund_wallets() {
  cd "$PROJECT_ROOT"
  
  print_header "💵 Funding Wallets"
  echo "Re-running setup to top up SOL and tokens..."
  npm run bot:setup
  print_success "Wallets funded!"
}

# Command: quick-buy (NEW - Quick property purchase)
quick_buy() {
  if [ -z "$1" ] || [ -z "$2" ]; then
    print_error "Usage: $0 quick-buy <property_id> <wallet_id> [slots]"
    exit 1
  fi
  
  local property_id=$1
  local wallet_id=$2
  local slots=${3:-1}
  
  cd "$PROJECT_ROOT"
  
  echo "Wallet $wallet_id buying $slots slot(s) of Property $property_id..."
  npm run bot buy $property_id $slots $wallet_id
}

# Main command router
case "$1" in
  setup-all)
    setup_all
    ;;
  
  distribute)
    distribute_properties
    ;;
  
  fill)
    fill_property $2 $3
    ;;
  
  shields)
    shift
    activate_shields "$@"
    ;;
  
  claim)
    claim_all
    ;;
  
  status)
    check_status
    ;;
  
  detail)
    detail_status
    ;;
  
  check-set)
    check_set $2
    ;;
  
  reset)
    reset_wallets
    ;;
  
  scenario)
    test_scenario $2
    ;;
  
  fund)
    fund_wallets
    ;;
  
  quick-buy)
    quick_buy $2 $3 $4
    ;;
  
  *)
    echo -e "${BLUE}🎲 Defipoly Bot Operations - Monopoly Edition${NC}"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  ${GREEN}setup-all${NC}                    Complete setup (create wallets, fund, initialize)"
    echo "  ${GREEN}distribute${NC}                   Distribute properties across Monopoly sets"
    echo "  ${GREEN}fill <id> [slots]${NC}            Fill a property (all wallets buy X slots)"
    echo "  ${GREEN}quick-buy <id> <wallet> [slots]${NC}  Single wallet purchase"
    echo "  ${GREEN}shields <id> <slots> [wallets]${NC}  Activate shields for property"
    echo "  ${GREEN}claim${NC}                        Claim rewards for all wallets"
    echo "  ${GREEN}status${NC}                       Quick status summary"
    echo "  ${GREEN}detail${NC}                       Detailed status (first 10 wallets)"
    echo "  ${GREEN}check-set <wallet>${NC}           Check set ownership for wallet"
    echo "  ${GREEN}fund${NC}                         Top up SOL and tokens"
    echo "  ${GREEN}scenario <1-5>${NC}               Run test scenarios"
    echo "  ${GREEN}reset${NC}                        Delete all test wallets"
    echo ""
    echo "Examples:"
    echo "  ${YELLOW}$0 setup-all${NC}"
    echo "  ${YELLOW}$0 fill 0 1${NC}                 (all wallets buy 1 slot of Property 0)"
    echo "  ${YELLOW}$0 quick-buy 0 10 3${NC}         (wallet 10 buys 3 slots of Property 0)"
    echo "  ${YELLOW}$0 shields 0 1 10 11 12${NC}     (wallets 10-12 shield 1 slot)"
    echo "  ${YELLOW}$0 check-set 10${NC}             (check if wallet 10 owns any complete sets)"
    echo "  ${YELLOW}$0 scenario 3${NC}               (test complete set bonus)"
    echo ""
    echo "Monopoly Property Reference:"
    echo "  Set 0 (Brown):      0-1     (Mediterranean, Baltic)"
    echo "  Set 1 (Light Blue): 2-4     (Oriental, Vermont, Connecticut)"
    echo "  Set 2 (Pink):       5-7     (St. Charles, States, Virginia)"
    echo "  Set 3 (Orange):     8-10    (St. James, Tennessee, New York)"
    echo "  Set 4 (Red):        11-13   (Kentucky, Indiana, Illinois)"
    echo "  Set 5 (Yellow):     14-16   (Atlantic, Ventnor, Marvin Gardens)"
    echo "  Set 6 (Green):      17-19   (Pacific, N. Carolina, Pennsylvania)"
    echo "  Set 7 (Dark Blue):  20-21   (Park Place, Boardwalk)"
    echo ""
    exit 1
    ;;
esac