#!/bin/bash

# Defipoly Bot Batch Operations
# This script provides convenient batch operations for testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
  
  echo "Step 1: Creating wallets and funding..."
  npm run bot:setup
  
  echo ""
  echo "Step 2: Initializing all players..."
  npm run bot:init
  
  print_success "Setup complete! All 50 wallets are ready."
}

# Command: distribute-properties
distribute_properties() {
  print_header "🏠 Distributing Properties"
  
  echo "Distributing properties across all tiers..."
  tsx scripts/bot-interactions.ts buy 0 0 1 2 3 4 5 6 7 8 9        # Bronze Basic
  tsx scripts/bot-interactions.ts buy 1 10 11 12 13 14 15 16 17    # Bronze Plus
  tsx scripts/bot-interactions.ts buy 2 18 19 20 21 22 23          # Silver Basic
  tsx scripts/bot-interactions.ts buy 3 24 25 26 27 28             # Silver Plus
  tsx scripts/bot-interactions.ts buy 4 29 30 31 32                # Gold Basic
  tsx scripts/bot-interactions.ts buy 5 33 34 35                   # Gold Plus
  tsx scripts/bot-interactions.ts buy 6 36 37                      # Platinum Basic
  tsx scripts/bot-interactions.ts buy 7 38                         # Platinum Elite
  
  print_success "Properties distributed!"
}

# Command: fill-property
fill_property() {
  if [ -z "$1" ]; then
    print_error "Usage: ./batch-bot-operations.sh fill-property <property_id>"
    exit 1
  fi
  
  print_header "📦 Filling Property $1"
  tsx scripts/bot-interactions.ts buy $1 all
  print_success "All wallets attempted to buy property $1"
}

# Command: activate-all-shields
activate_shields() {
  if [ -z "$1" ]; then
    print_error "Usage: ./batch-bot-operations.sh activate-shields <property_id> [wallet_range]"
    exit 1
  fi
  
  property_id=$1
  wallets=${2:-"all"}
  
  print_header "🛡️  Activating Shields"
  tsx scripts/bot-interactions.ts shield $property_id $wallets
  print_success "Shields activated for property $property_id"
}

# Command: claim-all
claim_all() {
  print_header "💰 Claiming Rewards"
  npm run bot:claim
  print_success "All rewards claimed!"
}

# Command: status
check_status() {
  print_header "📊 Wallet Status Summary"
  
  local total_initialized=0
  local total_properties=0
  
  for i in {0..49}; do
    if tsx scripts/bot-interactions.ts info $i 2>/dev/null | grep -q "Player: Not initialized"; then
      echo -e "Wallet $i: ${RED}Not initialized${NC}"
    else
      total_initialized=$((total_initialized + 1))
      properties=$(tsx scripts/bot-interactions.ts info $i 2>/dev/null | grep "Properties owned" | awk '{print $3}')
      total_properties=$((total_properties + properties))
      echo -e "Wallet $i: ${GREEN}✓${NC} Initialized, $properties properties"
    fi
  done
  
  echo ""
  echo "Summary:"
  echo "  Initialized: $total_initialized/50"
  echo "  Total Properties: $total_properties"
}

# Command: detail-status
detail_status() {
  print_header "📊 Detailed Status"
  
  for i in {0..9}; do
    tsx scripts/bot-interactions.ts info $i
    echo ""
  done
}

# Command: reset
reset_wallets() {
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
  case "$1" in
    1)
      print_header "🎮 Scenario 1: Basic Testing"
      echo "All wallets buy Bronze Basic properties"
      tsx scripts/bot-interactions.ts buy 0 all
      print_success "Scenario 1 complete"
      ;;
    
    2)
      print_header "🎮 Scenario 2: Mixed Distribution"
      distribute_properties
      print_success "Scenario 2 complete"
      ;;
    
    3)
      print_header "🎮 Scenario 3: Competition Test"
      echo "First 30 wallets compete for Gold Basic (only 4 available)"
      tsx scripts/bot-interactions.ts buy 4 $(seq 0 29)
      print_success "Scenario 3 complete - check who got slots!"
      ;;
    
    4)
      print_header "🎮 Scenario 4: Shield & Rewards"
      tsx scripts/bot-interactions.ts buy 0 $(seq 0 9)
      echo "Activating shields for first 5 wallets..."
      tsx scripts/bot-interactions.ts shield 0 $(seq 0 4)
      print_warning "Wait 24h then run: npm run bot:claim"
      print_success "Scenario 4 setup complete"
      ;;
    
    *)
      echo "Available scenarios:"
      echo "  1 - Basic testing (all buy Bronze)"
      echo "  2 - Mixed distribution"
      echo "  3 - Competition test (limited slots)"
      echo "  4 - Shield & rewards flow"
      echo ""
      echo "Usage: ./batch-bot-operations.sh test-scenario <1-4>"
      ;;
  esac
}

# Command: fund-wallets
fund_wallets() {
  print_header "💵 Funding Wallets"
  echo "Re-running setup to top up SOL and tokens..."
  npm run bot:setup
  print_success "Wallets funded!"
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
    fill_property $2
    ;;
  
  shields)
    activate_shields $2 $3
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
  
  reset)
    reset_wallets
    ;;
  
  scenario)
    test_scenario $2
    ;;
  
  fund)
    fund_wallets
    ;;
  
  *)
    echo -e "${BLUE}🤖 Defipoly Bot Operations${NC}"
    echo ""
    echo "Usage: ./batch-bot-operations.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  ${GREEN}setup-all${NC}            Complete setup (create wallets, fund, initialize)"
    echo "  ${GREEN}distribute${NC}           Distribute properties across all tiers"
    echo "  ${GREEN}fill <property_id>${NC}   Fill a specific property with all wallets"
    echo "  ${GREEN}shields <id> [range]${NC} Activate shields for property"
    echo "  ${GREEN}claim${NC}                Claim rewards for all wallets"
    echo "  ${GREEN}status${NC}               Quick status summary"
    echo "  ${GREEN}detail${NC}               Detailed status (first 10 wallets)"
    echo "  ${GREEN}fund${NC}                 Top up SOL and tokens"
    echo "  ${GREEN}scenario <1-4>${NC}       Run test scenarios"
    echo "  ${GREEN}reset${NC}                Delete all test wallets"
    echo ""
    echo "Examples:"
    echo "  ${YELLOW}./batch-bot-operations.sh setup-all${NC}"
    echo "  ${YELLOW}./batch-bot-operations.sh fill 0${NC}"
    echo "  ${YELLOW}./batch-bot-operations.sh shields 0 all${NC}"
    echo "  ${YELLOW}./batch-bot-operations.sh scenario 1${NC}"
    echo ""
    exit 1
    ;;
esac