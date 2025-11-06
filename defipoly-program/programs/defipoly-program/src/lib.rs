// Defipoly Solana Program - v7 Optimized (No External Dependencies)
// Anchor 0.31.1
// Secure commit-reveal randomness using slot hashes
// UPDATED: Random steal only (no targeted steal)
// ADMIN FUNCTIONS ADDED: Complete game master control system
// REFACTORED: Payment distribution extracted to helper function for stack optimization

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("5pmt4n2ge5ywu1Bc9tU1qjjtGbeNoFvVJpomSjvU1PwV");

const DEV_WALLET: &str = "CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS";
const MARKETING_WALLET: &str = "FoPKSQ5HDSVyZgaQobX64YEBVQ2iiKMZp8VHWtd6jLQE";
const MAX_PROPERTIES_PER_CLAIM: u8 = 22;
const MIN_CLAIM_INTERVAL_MINUTES: i64 = 1;

#[program]
pub mod defipoly_program {
    use super::*;

    // ========== INITIALIZATION ==========

    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        initial_reward_pool_amount: u64,
    ) -> Result<()> {
        let game_config = &mut ctx.accounts.game_config;
        game_config.authority = ctx.accounts.authority.key();
        game_config.dev_wallet = DEV_WALLET.parse().unwrap();
        game_config.marketing_wallet = MARKETING_WALLET.parse().unwrap();
        game_config.token_mint = ctx.accounts.token_mint.key();
        game_config.reward_pool_vault = ctx.accounts.reward_pool_vault.key();
        game_config.total_supply = 1_000_000_000;
        game_config.circulating_supply = 500_000_000;
        game_config.reward_pool_initial = initial_reward_pool_amount;
        game_config.current_phase = 1;
        game_config.game_paused = false;
        game_config.steal_chance_targeted_bps = 2500; // 25% (kept for backward compatibility)
        game_config.steal_chance_random_bps = 3300; // 33% (always used now)
        game_config.steal_cost_percent_bps = 5000; // 50%
        game_config.set_bonus_bps = 4000; // 40%
        game_config.max_properties_per_claim = MAX_PROPERTIES_PER_CLAIM;
        game_config.min_claim_interval_minutes = MIN_CLAIM_INTERVAL_MINUTES;
        game_config.bump = ctx.bumps.game_config;
        game_config.reward_pool_vault_bump = ctx.bumps.reward_pool_vault;
        
        msg!("Game initialized - Phase 1");
        Ok(())
    }

    pub fn initialize_property(
        ctx: Context<InitializeProperty>,
        property_id: u8,
        set_id: u8,
        max_slots_per_property: u16,
        max_per_player: u16,
        price: u64,
        yield_percent_bps: u16,
        shield_cost_percent_bps: u16,
        cooldown_seconds: i64,
    ) -> Result<()> {
        require!(property_id < 22, ErrorCode::InvalidPropertyId);
        require!(set_id < 8, ErrorCode::InvalidSetId);
        
        let property = &mut ctx.accounts.property;
        property.property_id = property_id;
        property.set_id = set_id;
        property.max_slots_per_property = max_slots_per_property;
        property.available_slots = max_slots_per_property;
        property.max_per_player = max_per_player;
        property.price = price;
        property.yield_percent_bps = yield_percent_bps;
        property.shield_cost_percent_bps = shield_cost_percent_bps;
        property.cooldown_seconds = cooldown_seconds;
        property.bump = ctx.bumps.property;
        
        msg!("Property {} initialized (Set {})", property_id, set_id);
        Ok(())
    }

    pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player_account;
        player.owner = ctx.accounts.player.key();
        player.total_slots_owned = 0;
        player.total_base_daily_income = 0;
        player.last_claim_timestamp = Clock::get()?.unix_timestamp;
        player.total_rewards_claimed = 0;
        player.complete_sets_owned = 0;
        player.properties_owned_count = 0;
        player.total_steals_attempted = 0;
        player.total_steals_successful = 0;
        player.bump = ctx.bumps.player_account;
        
        msg!("Player initialized: {}", player.owner);
        Ok(())
    }

    // ========== PROPERTY PURCHASE ==========

    pub fn buy_property(
        ctx: Context<BuyProperty>,
        slots: u16, // NEW: Number of slots to buy (1 to max_per_player)
    ) -> Result<()> {
        let game_config = &ctx.accounts.game_config;
        let property = &mut ctx.accounts.property;
        let player = &mut ctx.accounts.player_account;
        let ownership = &mut ctx.accounts.ownership;
        let set_cooldown = &mut ctx.accounts.set_cooldown;
        let set_ownership = &mut ctx.accounts.set_ownership;
        let set_stats = &mut ctx.accounts.set_stats;
        let clock = Clock::get()?;
    
        // Validation
        require!(!game_config.game_paused, ErrorCode::GamePaused);
        require!(slots > 0, ErrorCode::InvalidSlotAmount);
        require!(property.available_slots >= slots, ErrorCode::NoSlotsAvailable);
        
        // Check if user can buy this many slots
        require!(
            ownership.slots_owned + slots <= property.max_per_player,
            ErrorCode::MaxSlotsReached
        );
    
        // Cooldown check
        if set_cooldown.last_purchase_timestamp != 0 {
            let time_since_last_purchase = clock.unix_timestamp - set_cooldown.last_purchase_timestamp;
            
            // Only enforce cooldown if buying a DIFFERENT property than the last one purchased
            if property.property_id != set_cooldown.last_purchased_property_id {
                require!(
                    time_since_last_purchase >= set_cooldown.cooldown_duration,
                    ErrorCode::CooldownActive
                );
            }
        }
    
        // Calculate total cost for all slots
        let total_price = property.price.checked_mul(slots as u64)
            .ok_or(ErrorCode::Overflow)?;

        // Distribute payment using helper function (95% reward, 3% marketing, 2% dev)
        distribute_payment(
            total_price,
            &ctx.accounts.player_token_account,
            &ctx.accounts.reward_pool_vault,
            &ctx.accounts.marketing_token_account,
            &ctx.accounts.dev_token_account,
            &ctx.accounts.player,
            &ctx.accounts.token_program,
        )?;
    
        // Update property: reduce available slots
        property.available_slots = property.available_slots
            .checked_sub(slots)
            .ok_or(ErrorCode::Overflow)?;
    
        // Update or initialize ownership
        let is_new_ownership = ownership.slots_owned == 0;
        if is_new_ownership {
            ownership.player = player.owner;
            ownership.property_id = property.property_id;
            ownership.slots_owned = slots;
            ownership.slots_shielded = 0;
            ownership.purchase_timestamp = clock.unix_timestamp;
            ownership.shield_expiry = 0;
            ownership.bump = ctx.bumps.ownership;
            player.properties_owned_count += 1;
        } else {
            ownership.slots_owned = ownership.slots_owned
                .checked_add(slots)
                .ok_or(ErrorCode::Overflow)?;
        }
    
        // Update player total slots
        player.total_slots_owned = player.total_slots_owned
            .checked_add(slots)
            .ok_or(ErrorCode::Overflow)?;

        // Calculate and add daily income for the purchased slots
        let daily_income_per_slot = (property.price * property.yield_percent_bps as u64) / 10000;
        let total_daily_income_increase = daily_income_per_slot
            .checked_mul(slots as u64)
            .ok_or(ErrorCode::Overflow)?;

        player.total_base_daily_income = player.total_base_daily_income
            .checked_add(total_daily_income_increase)
            .ok_or(ErrorCode::Overflow)?;
    
        // Update set ownership (tracking which properties owned in set)
        if set_ownership.total_slots_in_set == 0 {
            set_ownership.player = player.owner;
            set_ownership.set_id = property.set_id;
            set_ownership.first_property_timestamp = clock.unix_timestamp;
            set_ownership.properties_owned_ids[0] = property.property_id;
            set_ownership.properties_count = 1;
            set_ownership.bump = ctx.bumps.set_ownership;
        } else {
            let mut already_owned = false;
            for i in 0..set_ownership.properties_count as usize {
                if set_ownership.properties_owned_ids[i] == property.property_id {
                    already_owned = true;
                    break;
                }
            }
            
            if !already_owned && set_ownership.properties_count < 3 {
                let count = set_ownership.properties_count as usize;
                set_ownership.properties_owned_ids[count] = property.property_id;
                set_ownership.properties_count += 1;
            }
        }
        
        set_ownership.total_slots_in_set = set_ownership.total_slots_in_set
            .checked_add(slots)
            .ok_or(ErrorCode::Overflow)?;
        
        // Check for complete set bonus
        let required_properties = Property::get_properties_in_set(property.set_id);
        let was_complete = set_ownership.has_complete_set;
        set_ownership.has_complete_set = set_ownership.properties_count >= required_properties;
        
        if set_ownership.has_complete_set && !was_complete {
            player.complete_sets_owned += 1;
        }
    
        // Update set stats
        if set_stats.set_id == 0 && set_stats.total_slots_sold == 0 {
            set_stats.set_id = property.set_id;
            set_stats.total_players = 1;
            set_stats.bump = ctx.bumps.set_stats;
        } else if is_new_ownership {
            set_stats.total_players = set_stats.total_players
                .checked_add(1)
                .ok_or(ErrorCode::Overflow)?;
        }
        
        set_stats.total_slots_sold = set_stats.total_slots_sold
            .checked_add(slots as u64)
            .ok_or(ErrorCode::Overflow)?;
    
        // Update cooldown
        if set_cooldown.player == Pubkey::default() {
            set_cooldown.player = player.owner;
            set_cooldown.set_id = property.set_id;
            set_cooldown.cooldown_duration = property.cooldown_seconds;
            set_cooldown.bump = ctx.bumps.set_cooldown;
        }
        set_cooldown.last_purchase_timestamp = clock.unix_timestamp;
        set_cooldown.last_purchased_property_id = property.property_id;
    
        // Emit event
        emit!(PropertyBoughtEvent {
            player: player.owner,
            property_id: property.property_id,
            price: property.price,      
            slots_owned: ownership.slots_owned, 
            slots,
            total_cost: total_price,
            total_slots_owned: ownership.slots_owned,
        });
    
        msg!("✅ Player {} bought {} slots of property {} for {} tokens", 
             player.owner, slots, property.property_id, total_price);
        Ok(())
    }

    // ========== SHIELD SYSTEM ==========
    pub fn activate_shield(
        ctx: Context<ActivateShield>,
        shield_duration_hours: u16,  // Accepts 1-48 hours
    ) -> Result<()> {
        let game_config = &ctx.accounts.game_config;
        let property = &ctx.accounts.property;
        let ownership = &mut ctx.accounts.ownership;
        let clock = Clock::get()?;
    
        require!(!game_config.game_paused, ErrorCode::GamePaused);
        require!(ownership.slots_owned > 0, ErrorCode::DoesNotOwnProperty);
        
        // Accept any duration from 1 to 48 hours
        require!(
            shield_duration_hours >= 1 && shield_duration_hours <= 48,
            ErrorCode::InvalidShieldDuration
        );
        
        require!(
            ownership.slots_shielded == 0 || clock.unix_timestamp >= ownership.shield_expiry,
            ErrorCode::ShieldAlreadyActive
        );
    
        let slots_to_shield = ownership.slots_owned;  // Always all slots
    
        // Cost scales linearly with duration
        let daily_income_per_slot = (property.price * property.yield_percent_bps as u64) / 10000;
        let shield_cost_per_slot = (daily_income_per_slot * property.shield_cost_percent_bps as u64) / 10000;
        let cost_per_slot_for_duration = (shield_cost_per_slot * shield_duration_hours as u64) / 24;
        let total_cost = cost_per_slot_for_duration * slots_to_shield as u64;
    
        // Distribute payment using helper function (95% reward, 3% marketing, 2% dev)
        distribute_payment(
            total_cost,
            &ctx.accounts.player_token_account,
            &ctx.accounts.reward_pool_vault,
            &ctx.accounts.marketing_token_account,
            &ctx.accounts.dev_token_account,
            &ctx.accounts.player,
            &ctx.accounts.token_program,
        )?;
    
        let shield_duration_seconds = (shield_duration_hours as i64) * 3600;
        
        // 🆕 NEW: Check if steal protection is active and queue shield after it
        let shield_start_time = if clock.unix_timestamp < ownership.steal_protection_expiry {
            // Steal protection is active - shield starts AFTER it expires
            let wait_time = ownership.steal_protection_expiry - clock.unix_timestamp;
            msg!(
                "⏱️  Steal protection active for {} more seconds. Shield will start after protection expires at {}",
                wait_time,
                ownership.steal_protection_expiry
            );
            ownership.steal_protection_expiry
        } else {
            // No steal protection - shield starts immediately
            clock.unix_timestamp
        };
    
        // Set shield properties
        ownership.slots_shielded = slots_to_shield;
        ownership.shield_expiry = shield_start_time + shield_duration_seconds;
        ownership.shield_cooldown_duration = shield_duration_seconds / 4;  // 25% cooldown
    
        emit!(ShieldActivatedEvent {
            player: ownership.player,
            property_id: property.property_id,
            slots_shielded: slots_to_shield,
            cost: total_cost,
            expiry: ownership.shield_expiry,
        });
    
        if shield_start_time > clock.unix_timestamp {
            msg!(
                "🛡️ Shield queued: {} slots for {}h (starts at {}, expires at {})",
                slots_to_shield,
                shield_duration_hours,
                shield_start_time,
                ownership.shield_expiry
            );
        } else {
            msg!(
                "🛡️ Shield activated: {} slots for {}h (expires at {})",
                slots_to_shield,
                shield_duration_hours,
                ownership.shield_expiry
            );
        }
    
        Ok(())
    }

    // ========== SECURE COMMIT-REVEAL STEAL MECHANICS (RANDOM ONLY) ==========

/// Instant steal with cooldown protection (SINGLE TRANSACTION - 33% success rate)
/// Randomly selects target from eligible owners passed in remaining_accounts
pub fn steal_property_instant(
    ctx: Context<StealPropertyInstant>,
    user_randomness: [u8; 32],
) -> Result<()> {
    let game_config = &ctx.accounts.game_config;
    let property = &ctx.accounts.property;
    let player = &mut ctx.accounts.player_account;
    let attacker_ownership = &mut ctx.accounts.attacker_ownership;
    let steal_cooldown = &mut ctx.accounts.steal_cooldown;
    let clock = Clock::get()?;

    require!(!game_config.game_paused, ErrorCode::GamePaused);

    // Get eligible targets from remaining_accounts (pairs of [ownership, player_account])
    let remaining_accounts = ctx.remaining_accounts;
    require!(remaining_accounts.len() >= 2, ErrorCode::NoEligibleTargets);
    require!(remaining_accounts.len() % 2 == 0, ErrorCode::InvalidAccountCount);
    
    let num_targets = remaining_accounts.len() / 2;
    require!(num_targets > 0, ErrorCode::NoEligibleTargets);

    // Generate randomness using current slot hash + user randomness
    let slot_hashes = &ctx.accounts.slot_hashes;
    let slot_hashes_data = slot_hashes.data.borrow();
    
    require!(
        slot_hashes_data.len() >= 40,
        ErrorCode::SlotHashUnavailable
    );

    let mut slot_hash_bytes = [0u8; 32];
    slot_hash_bytes.copy_from_slice(&slot_hashes_data[8..40]);

    // Combine entropy sources
    let mut combined_entropy = [0u8; 32];
    for i in 0..32 {
        combined_entropy[i] = user_randomness[i]
            ^ slot_hash_bytes[i]
            ^ ((clock.slot >> (i % 8)) as u8)
            ^ ((clock.unix_timestamp >> (i % 8)) as u8);
    }
    
    let random_u64 = u64::from_le_bytes(combined_entropy[0..8].try_into().unwrap());

    // Randomly select target from eligible pool
    let target_index = (random_u64 % num_targets as u64) as usize;
    let target_ownership_info = &remaining_accounts[target_index * 2];
    let target_account_info = &remaining_accounts[target_index * 2 + 1];

    // Deserialize target accounts
    let mut target_ownership_data = target_ownership_info.try_borrow_mut_data()?;
    let mut target_ownership = PropertyOwnership::try_deserialize(&mut &target_ownership_data[..])?;
    
    let mut target_account_data = target_account_info.try_borrow_mut_data()?;
    let mut target_account = PlayerAccount::try_deserialize(&mut &target_account_data[..])?;

    let target_player = target_ownership.player;

    // Validation
    require!(
        target_player != ctx.accounts.attacker.key(),
        ErrorCode::CannotStealFromSelf
    );
    require!(
        target_ownership.property_id == property.property_id,
        ErrorCode::PropertyMismatch
    );
    require!(target_ownership.slots_owned > 0, ErrorCode::TargetDoesNotOwnProperty);

    // Check combined protection (shield + steal protection)
    let shielded_slots = if clock.unix_timestamp < target_ownership.shield_expiry {
        target_ownership.slots_shielded
    } else {
        0
    };
    
    let has_steal_protection = clock.unix_timestamp < target_ownership.steal_protection_expiry;
    
    require!(
        target_ownership.slots_owned > shielded_slots,
        ErrorCode::AllSlotsShielded
    );
    require!(!has_steal_protection, ErrorCode::StealProtectionActive);

    // Check attacker cooldown (half of buy cooldown)
    let cooldown_duration = property.cooldown_seconds / 2;
    if steal_cooldown.player != Pubkey::default() {
        let time_since_last_steal = clock.unix_timestamp - steal_cooldown.last_steal_attempt_timestamp;
        require!(
            time_since_last_steal >= cooldown_duration,
            ErrorCode::StealCooldownActive
        );
    } else {
        // First time initialization
        steal_cooldown.player = ctx.accounts.attacker.key();
        steal_cooldown.property_id = property.property_id;
        steal_cooldown.cooldown_duration = cooldown_duration;
        steal_cooldown.bump = ctx.bumps.steal_cooldown;
    }

    // Update cooldown timestamp
    steal_cooldown.last_steal_attempt_timestamp = clock.unix_timestamp;

    // Calculate steal cost
    let steal_cost = (property.price * game_config.steal_cost_percent_bps as u64) / 10000;

    // Distribute payment using helper function (95% reward, 3% marketing, 2% dev)
    distribute_payment(
        steal_cost,
        &ctx.accounts.player_token_account,
        &ctx.accounts.reward_pool_vault,
        &ctx.accounts.marketing_token_account,
        &ctx.accounts.dev_token_account,
        &ctx.accounts.attacker,
        &ctx.accounts.token_program,
    )?;

    // Determine success (33% chance) - use different part of entropy
    let success_threshold = game_config.steal_chance_random_bps as u64;
    let success_random = u64::from_le_bytes(combined_entropy[8..16].try_into().unwrap());
    let success = (success_random % 10000) < success_threshold;

    // Update player stats
    player.total_steals_attempted += 1;

    if success {
        // Transfer slot from target to attacker
        target_ownership.slots_owned -= 1;

        if target_ownership.slots_shielded > target_ownership.slots_owned {
            target_ownership.slots_shielded = target_ownership.slots_owned;
        }

        // Initialize or update attacker ownership
        if attacker_ownership.slots_owned == 0 {
            attacker_ownership.player = ctx.accounts.attacker.key();
            attacker_ownership.property_id = property.property_id;
            attacker_ownership.slots_owned = 1;
            attacker_ownership.slots_shielded = 0;
            attacker_ownership.purchase_timestamp = clock.unix_timestamp;
            attacker_ownership.shield_expiry = 0;
            attacker_ownership.steal_protection_expiry = 0;
            attacker_ownership.bump = ctx.bumps.attacker_ownership;
        } else {
            attacker_ownership.slots_owned += 1;
        }

        player.total_slots_owned += 1;
        player.total_steals_successful += 1;

        // Calculate daily income for stolen slot
        let daily_income_per_slot = (property.price * property.yield_percent_bps as u64) / 10000;

        player.total_base_daily_income = player.total_base_daily_income
            .checked_add(daily_income_per_slot)
            .ok_or(ErrorCode::Overflow)?;

        target_account.total_base_daily_income = target_account.total_base_daily_income
            .checked_sub(daily_income_per_slot)
            .ok_or(ErrorCode::Overflow)?;
        
        target_account.total_slots_owned = target_account.total_slots_owned
            .checked_sub(1)
            .ok_or(ErrorCode::Overflow)?;

        emit!(StealSuccessEvent {
            attacker: ctx.accounts.attacker.key(),
            target: target_player,
            property_id: property.property_id,
            steal_cost,
            targeted: false,
            vrf_result: random_u64,
        });

        msg!("✅ INSTANT STEAL SUCCESS: {} stole 1 slot from {} (target_selection: {}, success_roll: {})", 
             ctx.accounts.attacker.key(), target_player, random_u64, success_random);
    } else {
        emit!(StealFailedEvent {
            attacker: ctx.accounts.attacker.key(),
            target: target_player,
            property_id: property.property_id,
            steal_cost,
            targeted: false,
            vrf_result: random_u64,
        });

        msg!("❌ INSTANT STEAL FAILED: {} targeted {} (target_selection: {}, success_roll: {})", 
             ctx.accounts.attacker.key(), target_player, random_u64, success_random);
    }

    // 🆕 APPLY 6-HOUR STEAL PROTECTION (whether success or fail)
    target_ownership.steal_protection_expiry = clock.unix_timestamp + (6 * 3600);

    // Serialize changes back to accounts
    target_ownership.try_serialize(&mut &mut target_ownership_data[..])?;
    target_account.try_serialize(&mut &mut target_account_data[..])?;

    msg!("🛡️ Steal protection applied to {} until {}", 
         target_player, target_ownership.steal_protection_expiry);

    Ok(())
}

    // ========== CLAIM REWARDS ==========

    pub fn claim_rewards<'info>(
        ctx: Context<'_, '_, '_, 'info, ClaimRewards<'info>>,
        num_properties: u8,
    ) -> Result<()> {
        let game_config = &ctx.accounts.game_config;
        let player = &mut ctx.accounts.player_account;
        let clock = Clock::get()?;
    
        require!(!game_config.game_paused, ErrorCode::GamePaused);
        require!(
            num_properties > 0 && num_properties <= game_config.max_properties_per_claim,
            ErrorCode::TooManyProperties
        );
    
        require!(
            (clock.unix_timestamp - player.last_claim_timestamp) >= game_config.min_claim_interval_minutes * 60,
            ErrorCode::ClaimTooSoon
        );
    
        let remaining_accounts = ctx.remaining_accounts;
        let num_props = num_properties as usize;
        require!(remaining_accounts.len() >= num_props * 2, ErrorCode::InvalidAccountCount);
    
        struct OwnershipInfo {
            property_id: u8,
            set_id: u8,
            slots_owned: u16,
            daily_income_per_slot: u64,
            purchase_timestamp: i64,
        }
        
        let mut ownerships: Vec<OwnershipInfo> = Vec::with_capacity(num_props);
        
        for i in 0..num_props {
            let ownership_account = &remaining_accounts[i];
            let ownership_data = ownership_account.try_borrow_data()?;
            let ownership = PropertyOwnership::try_deserialize(&mut &ownership_data[..])?;
            
            require!(ownership.player == player.owner, ErrorCode::Unauthorized);
            require!(ownership.slots_owned > 0, ErrorCode::DoesNotOwnProperty);
            
            let property_account = &remaining_accounts[num_props + i];
            let property_data = property_account.try_borrow_data()?;
            let property = Property::try_deserialize(&mut &property_data[..])?;
            
            require!(property.property_id == ownership.property_id, ErrorCode::PropertyMismatch);
            
            let daily_income_per_slot = (property.price * property.yield_percent_bps as u64) / 10000;
            
            ownerships.push(OwnershipInfo {
                property_id: property.property_id,
                set_id: property.set_id,
                slots_owned: ownership.slots_owned,
                daily_income_per_slot,
                purchase_timestamp: ownership.purchase_timestamp,
            });
        }
        
        let mut set_min_slots: [u16; 8] = [u16::MAX; 8];
        let mut properties_per_set: [u8; 8] = [0; 8];
        
        for ownership in &ownerships {
            properties_per_set[ownership.set_id as usize] += 1;
        }
        
        for ownership in &ownerships {
            let set_idx = ownership.set_id as usize;
            let required_properties = Property::get_properties_in_set(ownership.set_id);
            
            if properties_per_set[set_idx] >= required_properties {
                if ownership.slots_owned < set_min_slots[set_idx] {
                    set_min_slots[set_idx] = ownership.slots_owned;
                }
            }
        }
        
        let mut total_rewards: u64 = 0;
        let mut total_base_slots: u32 = 0;
        let mut total_bonus_slots: u32 = 0;
        
        for ownership in &ownerships {
            // Use the later of purchase time or last claim time
            let time_start = std::cmp::max(
                ownership.purchase_timestamp,
                player.last_claim_timestamp
            );
            let minutes_elapsed = (clock.unix_timestamp - time_start) / 60;
            
            // Skip if no time has elapsed for this property
            if minutes_elapsed <= 0 {
                continue;
            }
            
            let set_idx = ownership.set_id as usize;
            let income_per_minute = ownership.daily_income_per_slot / 1440;
            let min_slots_in_set = set_min_slots[set_idx];
            
            if min_slots_in_set != u16::MAX && min_slots_in_set > 0 {
                let bonus_slots = min_slots_in_set;
                let base_slots = ownership.slots_owned - bonus_slots;
                
                let base_rewards = base_slots as u64 * income_per_minute * minutes_elapsed as u64;
                let set_bonus_bps = Property::get_set_bonus_bps(ownership.set_id);
                let bonus_multiplier_bps = 10000 + set_bonus_bps;
                let bonus_rewards = (bonus_slots as u64 * income_per_minute * minutes_elapsed as u64 * bonus_multiplier_bps as u64) / 10000;
                
                total_rewards += base_rewards + bonus_rewards;
                total_base_slots += base_slots as u32;
                total_bonus_slots += bonus_slots as u32;
            } else {
                let rewards = ownership.slots_owned as u64 * income_per_minute * minutes_elapsed as u64;
                total_rewards += rewards;
                total_base_slots += ownership.slots_owned as u32;
            }
        }
        
        require!(total_rewards > 0, ErrorCode::NoRewardsToClaim);
        require!(
            ctx.accounts.reward_pool_vault.amount >= total_rewards,
            ErrorCode::InsufficientRewardPool
        );
        
        msg!("💰 Claiming from {} properties ({} base + {} bonus slots)", 
             num_properties, total_base_slots, total_bonus_slots);
        
        let game_config_key = game_config.key();
        let seeds = &[
            b"reward_pool_vault",
            game_config_key.as_ref(),
            &[game_config.reward_pool_vault_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.reward_pool_vault.to_account_info(),
                to: ctx.accounts.player_token_account.to_account_info(),
                authority: ctx.accounts.reward_pool_vault.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, total_rewards)?;

        player.last_claim_timestamp = clock.unix_timestamp;
        player.total_rewards_claimed += total_rewards;

        emit!(RewardsClaimedEvent {
            player: player.owner,
            amount: total_rewards,
            seconds_elapsed: (clock.unix_timestamp - player.last_claim_timestamp),
        });

        msg!("✅ Rewards claimed successfully!");
        Ok(())
    }

    // ========== SELL PROPERTY ==========

    pub fn sell_property(
        ctx: Context<SellProperty>,
        slots: u16,
    ) -> Result<()> {
        let game_config = &ctx.accounts.game_config;
        let property = &mut ctx.accounts.property;
        let ownership = &mut ctx.accounts.ownership;
        let player = &mut ctx.accounts.player_account;
        let clock = Clock::get()?;

        require!(!game_config.game_paused, ErrorCode::GamePaused);
        require!(ownership.slots_owned >= slots, ErrorCode::InsufficientSlots);

        let days_held = (clock.unix_timestamp - ownership.purchase_timestamp) / 86400;
        let additional_percent = if days_held >= 14 {
            1500
        } else {
            (days_held * 1500 / 14) as u16
        };
        let sell_value_bps = 1500 + additional_percent;

        let total_value = property.price * slots as u64;
        let player_receives = (total_value * sell_value_bps as u64) / 10000;

        let game_config_key = game_config.key();
        let seeds = &[
            b"reward_pool_vault",
            game_config_key.as_ref(),
            &[game_config.reward_pool_vault_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.reward_pool_vault.to_account_info(),
                to: ctx.accounts.player_token_account.to_account_info(),
                authority: ctx.accounts.reward_pool_vault.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, player_receives)?;

        ownership.slots_owned -= slots;
        
        if ownership.slots_shielded > 0 {
            if clock.unix_timestamp < ownership.shield_expiry {
                if slots >= ownership.slots_shielded {
                    ownership.slots_shielded = 0;
                    ownership.shield_expiry = 0;
                } else {
                    ownership.slots_shielded -= slots;
                }
            } else {
                ownership.slots_shielded = 0;
                ownership.shield_expiry = 0;
            }
        }
        
        if ownership.slots_shielded > ownership.slots_owned {
            ownership.slots_shielded = ownership.slots_owned;
        }

        property.available_slots += slots;
        player.total_slots_owned -= slots;

        // Calculate and subtract daily income for the sold slots
        let daily_income_per_slot = (property.price * property.yield_percent_bps as u64) / 10000;
        let total_daily_income_decrease = daily_income_per_slot
            .checked_mul(slots as u64)
            .ok_or(ErrorCode::Overflow)?;

        player.total_base_daily_income = player.total_base_daily_income
            .checked_sub(total_daily_income_decrease)
            .ok_or(ErrorCode::Overflow)?;

        emit!(PropertySoldEvent {
            player: player.owner,
            property_id: property.property_id,
            slots,
            received: player_receives,
            sell_value_percent: sell_value_bps,
            days_held,
        });

        msg!("Property {} sold: {} slots for {} tokens", 
             property.property_id, slots, player_receives);
        Ok(())
    }

    // ========== EXISTING ADMIN FUNCTIONS ==========

    pub fn update_property_price(
        ctx: Context<AdminUpdateProperty>,
        property_id: u8,
        new_price: u64,
    ) -> Result<()> {
        ctx.accounts.property.price = new_price;
        emit!(AdminUpdateEvent {
            property_id,
            update_type: "price".to_string(),
            new_value: new_price,
        });
        msg!("Property {} price updated to {}", property_id, new_price);
        Ok(())
    }

    pub fn update_property_max_slots(
        ctx: Context<AdminUpdateProperty>,
        property_id: u8,
        new_max_slots: u16,
    ) -> Result<()> {
        let property = &mut ctx.accounts.property;
        let slots_difference = new_max_slots as i32 - property.max_slots_per_property as i32;
        property.max_slots_per_property = new_max_slots;
        property.available_slots = (property.available_slots as i32 + slots_difference) as u16;
        emit!(AdminUpdateEvent {
            property_id,
            update_type: "max_slots".to_string(),
            new_value: new_max_slots as u64,
        });
        msg!("Property {} max slots updated to {}", property_id, new_max_slots);
        Ok(())
    }

    pub fn update_steal_chances(
        ctx: Context<AdminUpdateGame>,
        targeted_bps: u16,
        random_bps: u16,
    ) -> Result<()> {
        let game_config = &mut ctx.accounts.game_config;
        game_config.steal_chance_targeted_bps = targeted_bps;
        game_config.steal_chance_random_bps = random_bps;
        msg!("Steal chances updated: targeted {}%, random {}%", 
             targeted_bps / 100, random_bps / 100);
        Ok(())
    }

    pub fn pause_game(ctx: Context<AdminUpdateGame>) -> Result<()> {
        ctx.accounts.game_config.game_paused = true;
        msg!("Game PAUSED");
        Ok(())
    }

    pub fn unpause_game(ctx: Context<AdminUpdateGame>) -> Result<()> {
        ctx.accounts.game_config.game_paused = false;
        msg!("Game UNPAUSED");
        Ok(())
    }

    pub fn update_phase(
        ctx: Context<AdminUpdateGame>,
        new_phase: u8,
    ) -> Result<()> {
        ctx.accounts.game_config.current_phase = new_phase;
        msg!("Phase updated to {}", new_phase);
        Ok(())
    }

    pub fn close_player_account(ctx: Context<ClosePlayerAccount>) -> Result<()> {
        msg!("🧹 Closing player account: {}", ctx.accounts.player_account.owner);
        Ok(())
    }

    pub fn admin_close_player_account(ctx: Context<AdminClosePlayerAccount>) -> Result<()> {
        msg!("🧹 Admin force closing player account");
        
        // Verify the account is owned by this program (safety check)
        require!(
            ctx.accounts.player_account.owner == ctx.program_id,
            ErrorCode::Unauthorized
        );
        
        // Manually transfer lamports and clear account data
        let dest_starting_lamports = ctx.accounts.rent_receiver.lamports();
        let account_lamports = ctx.accounts.player_account.lamports();
        
        **ctx.accounts.rent_receiver.lamports.borrow_mut() = dest_starting_lamports
            .checked_add(account_lamports)
            .unwrap();
        **ctx.accounts.player_account.lamports.borrow_mut() = 0;
        
        let mut data = ctx.accounts.player_account.try_borrow_mut_data()?;
        data.fill(0);
        
        Ok(())
    }

    // ========== NEW ADMIN/GAME MASTER FUNCTIONS ==========

    pub fn admin_grant_property(
        ctx: Context<AdminGrantProperty>,
        target_player: Pubkey,
        slots: u16,
    ) -> Result<()> {
        let game_config = &ctx.accounts.game_config;
        let property = &mut ctx.accounts.property;
        let ownership = &mut ctx.accounts.ownership;
        let player = &mut ctx.accounts.player_account;
        let clock = Clock::get()?;

        require!(!game_config.game_paused, ErrorCode::GamePaused);
        require!(slots > 0, ErrorCode::InvalidSlotAmount);
        require!(property.available_slots >= slots, ErrorCode::NoSlotsAvailable);

        let current_owned = ownership.slots_owned;
        let max_allowed = property.max_per_player;
        
        require!(
            current_owned + slots <= max_allowed,
            ErrorCode::MaxSlotsReached
        );

        // Update property slots
        property.available_slots = property.available_slots
            .checked_sub(slots)
            .ok_or(ErrorCode::Overflow)?;

        // Initialize or update ownership
        if ownership.slots_owned == 0 {
            ownership.player = target_player;
            ownership.property_id = property.property_id;
            ownership.slots_owned = slots;
            ownership.slots_shielded = 0;
            ownership.purchase_timestamp = clock.unix_timestamp;
            ownership.shield_expiry = 0;
            ownership.steal_protection_expiry = 0;
            ownership.bump = ctx.bumps.ownership;
            player.properties_owned_count += 1;
        } else {
            ownership.slots_owned = ownership.slots_owned
                .checked_add(slots)
                .ok_or(ErrorCode::Overflow)?;
        }

        // Update player total slots
        player.total_slots_owned = player.total_slots_owned
            .checked_add(slots)
            .ok_or(ErrorCode::Overflow)?;

        // Calculate and add daily income
        let daily_income_per_slot = (property.price * property.yield_percent_bps as u64) / 10000;
        let total_daily_income_increase = daily_income_per_slot
            .checked_mul(slots as u64)
            .ok_or(ErrorCode::Overflow)?;

        player.total_base_daily_income = player.total_base_daily_income
            .checked_add(total_daily_income_increase)
            .ok_or(ErrorCode::Overflow)?;

        emit!(AdminGrantEvent {
            admin: ctx.accounts.authority.key(),
            target_player,
            property_id: property.property_id,
            slots,
        });

        msg!("🎁 Admin granted {} slots of property {} to {}", 
             slots, property.property_id, target_player);
        Ok(())
    }

    pub fn admin_revoke_property(
        ctx: Context<AdminRevokeProperty>,
        slots: u16,
    ) -> Result<()> {
        let property = &mut ctx.accounts.property;
        let ownership = &mut ctx.accounts.ownership;
        let player = &mut ctx.accounts.player_account;

        require!(ownership.slots_owned >= slots, ErrorCode::InsufficientSlots);

        // Remove slots from ownership
        ownership.slots_owned = ownership.slots_owned
            .checked_sub(slots)
            .ok_or(ErrorCode::Overflow)?;

        // Adjust shielded slots if necessary
        if ownership.slots_shielded > ownership.slots_owned {
            ownership.slots_shielded = ownership.slots_owned;
        }

        // Return slots to property pool
        property.available_slots = property.available_slots
            .checked_add(slots)
            .ok_or(ErrorCode::Overflow)?;

        // Update player totals
        player.total_slots_owned = player.total_slots_owned
            .checked_sub(slots)
            .ok_or(ErrorCode::Overflow)?;

        // Calculate and subtract daily income
        let daily_income_per_slot = (property.price * property.yield_percent_bps as u64) / 10000;
        let total_daily_income_decrease = daily_income_per_slot
            .checked_mul(slots as u64)
            .ok_or(ErrorCode::Overflow)?;

        player.total_base_daily_income = player.total_base_daily_income
            .checked_sub(total_daily_income_decrease)
            .ok_or(ErrorCode::Overflow)?;

        emit!(AdminRevokeEvent {
            admin: ctx.accounts.authority.key(),
            target_player: ownership.player,
            property_id: property.property_id,
            slots,
        });

        msg!("🚫 Admin revoked {} slots of property {} from {}", 
             slots, property.property_id, ownership.player);
        Ok(())
    }

    pub fn admin_update_property_yield(
        ctx: Context<AdminUpdateProperty>,
        property_id: u8,
        new_yield_bps: u16,
    ) -> Result<()> {
        require!(new_yield_bps <= 10000, ErrorCode::InvalidYield);
        
        ctx.accounts.property.yield_percent_bps = new_yield_bps;
        
        emit!(AdminUpdateEvent {
            property_id,
            update_type: "yield".to_string(),
            new_value: new_yield_bps as u64,
        });
        
        msg!("Property {} yield updated to {} bps ({}%)", 
             property_id, new_yield_bps, new_yield_bps as f64 / 100.0);
        Ok(())
    }

    pub fn admin_update_shield_cost(
        ctx: Context<AdminUpdateProperty>,
        property_id: u8,
        new_shield_cost_bps: u16,
    ) -> Result<()> {
        require!(new_shield_cost_bps <= 10000, ErrorCode::InvalidShieldCost);
        
        ctx.accounts.property.shield_cost_percent_bps = new_shield_cost_bps;
        
        emit!(AdminUpdateEvent {
            property_id,
            update_type: "shield_cost".to_string(),
            new_value: new_shield_cost_bps as u64,
        });
        
        msg!("Property {} shield cost updated to {} bps", 
             property_id, new_shield_cost_bps);
        Ok(())
    }

    pub fn admin_update_cooldown(
        ctx: Context<AdminUpdateProperty>,
        property_id: u8,
        new_cooldown_seconds: i64,
    ) -> Result<()> {
        require!(new_cooldown_seconds >= 0, ErrorCode::InvalidCooldown);
        
        ctx.accounts.property.cooldown_seconds = new_cooldown_seconds;
        
        emit!(AdminUpdateEvent {
            property_id,
            update_type: "cooldown".to_string(),
            new_value: new_cooldown_seconds as u64,
        });
        
        msg!("Property {} cooldown updated to {} seconds", 
             property_id, new_cooldown_seconds);
        Ok(())
    }

    pub fn admin_clear_cooldown(
        ctx: Context<AdminClearCooldown>,
    ) -> Result<()> {
        let cooldown = &mut ctx.accounts.set_cooldown;
        cooldown.last_purchase_timestamp = 0;
        
        msg!("🔓 Admin cleared cooldown for player {} on set {}", 
             cooldown.player, cooldown.set_id);
        Ok(())
    }

    pub fn admin_clear_steal_cooldown(
        ctx: Context<AdminClearStealCooldown>,
    ) -> Result<()> {
        let cooldown = &mut ctx.accounts.steal_cooldown;
        cooldown.last_steal_attempt_timestamp = 0;
        
        msg!("🔓 Admin cleared steal cooldown for player {} on property {}", 
             cooldown.player, cooldown.property_id);
        Ok(())
    }

    pub fn admin_adjust_rewards(
        ctx: Context<AdminAdjustPlayer>,
        adjustment: i64,
    ) -> Result<()> {
        let player = &mut ctx.accounts.player_account;
        
        if adjustment >= 0 {
            player.total_rewards_claimed = player.total_rewards_claimed
                .checked_add(adjustment as u64)
                .ok_or(ErrorCode::Overflow)?;
        } else {
            let decrease = (-adjustment) as u64;
            player.total_rewards_claimed = player.total_rewards_claimed
                .checked_sub(decrease)
                .ok_or(ErrorCode::Overflow)?;
        }
        
        emit!(AdminPlayerAdjustEvent {
            admin: ctx.accounts.authority.key(),
            player: player.owner,
            adjustment_type: "rewards".to_string(),
            value: adjustment,
        });
        
        msg!("💰 Admin adjusted rewards for {} by {}", 
             player.owner, adjustment);
        Ok(())
    }

    pub fn admin_grant_shield(
        ctx: Context<AdminGrantShield>,
        duration_hours: u16,
    ) -> Result<()> {
        let ownership = &mut ctx.accounts.ownership;
        let clock = Clock::get()?;
        
        require!(
            duration_hours >= 1 && duration_hours <= 168, // Max 7 days
            ErrorCode::InvalidShieldDuration
        );
        
        let shield_duration_seconds = (duration_hours as i64) * 3600;
        
        // Check if steal protection is active and queue shield after it
        let shield_start_time = if clock.unix_timestamp < ownership.steal_protection_expiry {
            ownership.steal_protection_expiry
        } else {
            clock.unix_timestamp
        };
        
        ownership.slots_shielded = ownership.slots_owned;
        ownership.shield_expiry = shield_start_time + shield_duration_seconds;
        ownership.shield_cooldown_duration = shield_duration_seconds / 4;
        
        emit!(AdminShieldGrantEvent {
            admin: ctx.accounts.authority.key(),
            player: ownership.player,
            property_id: ownership.property_id,
            duration_hours,
            expiry: ownership.shield_expiry,
        });
        
        msg!("🛡️ Admin granted shield to {} for property {} ({} hours)", 
             ownership.player, ownership.property_id, duration_hours);
        Ok(())
    }

    pub fn admin_emergency_withdraw(
        ctx: Context<AdminEmergencyWithdraw>,
        amount: u64,
    ) -> Result<()> {
        let game_config = &ctx.accounts.game_config;
        
        require!(
            ctx.accounts.reward_pool_vault.amount >= amount,
            ErrorCode::InsufficientRewardPool
        );
        
        let game_config_key = game_config.key();
        let seeds = &[
            b"reward_pool_vault",
            game_config_key.as_ref(),
            &[game_config.reward_pool_vault_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.reward_pool_vault.to_account_info(),
                to: ctx.accounts.destination_account.to_account_info(),
                authority: ctx.accounts.reward_pool_vault.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, amount)?;

        emit!(AdminWithdrawEvent {
            admin: ctx.accounts.authority.key(),
            amount,
            destination: ctx.accounts.destination_account.key(),
        });

        msg!("🚨 Emergency withdrawal: {} tokens to {}", 
             amount, ctx.accounts.destination_account.key());
        Ok(())
    }

    pub fn admin_transfer_authority(
        ctx: Context<AdminTransferAuthority>,
        new_authority: Pubkey,
    ) -> Result<()> {
        let game_config = &mut ctx.accounts.game_config;
        let old_authority = game_config.authority;
        
        game_config.authority = new_authority;
        
        emit!(AdminAuthorityTransferEvent {
            old_authority,
            new_authority,
        });
        
        msg!("👑 Authority transferred from {} to {}", 
             old_authority, new_authority);
        Ok(())
    }

    pub fn admin_update_global_rates(
        ctx: Context<AdminUpdateGame>,
        steal_cost_bps: Option<u16>,
        set_bonus_bps: Option<u16>,
        max_properties_claim: Option<u8>,
        min_claim_interval: Option<i64>,
    ) -> Result<()> {
        let game_config = &mut ctx.accounts.game_config;
        
        if let Some(cost) = steal_cost_bps {
            require!(cost <= 10000, ErrorCode::InvalidStealCost);
            game_config.steal_cost_percent_bps = cost;
            msg!("Steal cost updated to {} bps", cost);
        }
        
        if let Some(bonus) = set_bonus_bps {
            require!(bonus <= 10000, ErrorCode::InvalidSetBonus);
            game_config.set_bonus_bps = bonus;
            msg!("Set bonus updated to {} bps", bonus);
        }
        
        if let Some(max_props) = max_properties_claim {
            require!(max_props > 0 && max_props <= 22, ErrorCode::InvalidPropertyCount);
            game_config.max_properties_per_claim = max_props;
            msg!("Max properties per claim updated to {}", max_props);
        }
        
        if let Some(interval) = min_claim_interval {
            require!(interval >= 0, ErrorCode::InvalidClaimInterval);
            game_config.min_claim_interval_minutes = interval;
            msg!("Min claim interval updated to {} minutes", interval);
        }
        
        Ok(())
    }
}

// ========== HELPER FUNCTIONS (OUTSIDE #[program] MODULE) ==========

/// Helper function to distribute payments (95% reward pool, 3% marketing, 2% dev)
/// Reduces stack usage by moving payment logic to separate function
fn distribute_payment<'info>(
    amount: u64,
    from: &Account<'info, TokenAccount>,
    reward_pool: &Account<'info, TokenAccount>,
    marketing: &Account<'info, TokenAccount>,
    dev: &Account<'info, TokenAccount>,
    authority: &Signer<'info>,
    token_program: &Program<'info, Token>,
) -> Result<()> {
    let to_reward_pool = amount.checked_mul(95)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(100)
        .ok_or(ErrorCode::Overflow)?;
    let to_marketing = amount.checked_mul(3)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(100)
        .ok_or(ErrorCode::Overflow)?;
    let to_dev = amount.checked_mul(2)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(100)
        .ok_or(ErrorCode::Overflow)?;

    // Transfer to reward pool (95%)
    token::transfer(
        CpiContext::new(
            token_program.to_account_info(),
            Transfer {
                from: from.to_account_info(),
                to: reward_pool.to_account_info(),
                authority: authority.to_account_info(),
            },
        ),
        to_reward_pool,
    )?;

    // Transfer to marketing (3%)
    token::transfer(
        CpiContext::new(
            token_program.to_account_info(),
            Transfer {
                from: from.to_account_info(),
                to: marketing.to_account_info(),
                authority: authority.to_account_info(),
            },
        ),
        to_marketing,
    )?;

    // Transfer to dev (2%)
    token::transfer(
        CpiContext::new(
            token_program.to_account_info(),
            Transfer {
                from: from.to_account_info(),
                to: dev.to_account_info(),
                authority: authority.to_account_info(),
            },
        ),
        to_dev,
    )?;

    Ok(())
}

// ========== ACCOUNT CONTEXTS ==========

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + GameConfig::SIZE,
        seeds = [b"game_config"],
        bump
    )]
    pub game_config: Account<'info, GameConfig>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = reward_pool_vault,
        seeds = [b"reward_pool_vault", game_config.key().as_ref()],
        bump
    )]
    pub reward_pool_vault: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = token_mint,
        associated_token::authority = dev_wallet,
    )]
    pub dev_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: Dev wallet address - hardcoded as DEV_WALLET constant
    pub dev_wallet: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = token_mint,
        associated_token::authority = marketing_wallet,
    )]
    pub marketing_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: Marketing wallet address
    pub marketing_wallet: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,

    pub associated_token_program: Program<'info, AssociatedToken>, 
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(property_id: u8)]
pub struct InitializeProperty<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Property::SIZE,
        seeds = [b"property", property_id.to_le_bytes().as_ref()],
        bump
    )]
    pub property: Account<'info, Property>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub game_config: Account<'info, GameConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    #[account(
        init,
        payer = player,
        space = 8 + PlayerAccount::SIZE,
        seeds = [b"player", player.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, PlayerAccount>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyProperty<'info> {
    #[account(mut)]
    pub property: Account<'info, Property>,
    
    #[account(
        init_if_needed,
        payer = player,
        space = 8 + PropertyOwnership::SIZE,
        seeds = [b"ownership", player.key().as_ref(), property.property_id.to_le_bytes().as_ref()],
        bump
    )]
    pub ownership: Account<'info, PropertyOwnership>,
    
    #[account(
        init_if_needed,
        payer = player,
        space = 8 + PlayerSetCooldown::SIZE,
        seeds = [b"cooldown", player.key().as_ref(), property.set_id.to_le_bytes().as_ref()],
        bump
    )]
    pub set_cooldown: Account<'info, PlayerSetCooldown>,
    
    #[account(
        init_if_needed,
        payer = player,
        space = 8 + PlayerSetOwnership::SIZE,
        seeds = [b"set_ownership", player.key().as_ref(), property.set_id.to_le_bytes().as_ref()],
        bump
    )]
    pub set_ownership: Account<'info, PlayerSetOwnership>,
    
    #[account(
        init_if_needed,
        payer = player,
        space = 8 + SetStats::SIZE,
        seeds = [b"set_stats_v2", property.set_id.to_le_bytes().as_ref()], 
        bump
    )]
    pub set_stats: Account<'info, SetStats>,
    
    #[account(mut)]
    pub player_account: Account<'info, PlayerAccount>,
    
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub reward_pool_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub dev_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub marketing_token_account: Account<'info, TokenAccount>,
    
    pub game_config: Account<'info, GameConfig>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ActivateShield<'info> {
    pub property: Account<'info, Property>,
    
    #[account(mut)]
    pub ownership: Account<'info, PropertyOwnership>,
    
    pub player_account: Account<'info, PlayerAccount>,
    
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub reward_pool_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub dev_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub marketing_token_account: Account<'info, TokenAccount>,
    
    pub game_config: Account<'info, GameConfig>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct StealPropertyInstant<'info> {
    pub property: Account<'info, Property>,
    
    #[account(
        init_if_needed,
        payer = attacker,
        space = 8 + PropertyOwnership::SIZE,
        seeds = [b"ownership", attacker.key().as_ref(), property.property_id.to_le_bytes().as_ref()],
        bump
    )]
    pub attacker_ownership: Account<'info, PropertyOwnership>,
    
    #[account(
        init_if_needed,
        payer = attacker,
        space = 8 + PlayerStealCooldown::SIZE,
        seeds = [b"steal_cooldown", attacker.key().as_ref(), property.property_id.to_le_bytes().as_ref()],
        bump
    )]
    pub steal_cooldown: Account<'info, PlayerStealCooldown>,
    
    #[account(mut)]
    pub player_account: Account<'info, PlayerAccount>,
    
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub reward_pool_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub dev_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub marketing_token_account: Account<'info, TokenAccount>,
    
    pub game_config: Account<'info, GameConfig>,
    
    /// CHECK: Slot hashes sysvar for entropy
    #[account(address = anchor_lang::solana_program::sysvar::slot_hashes::ID)]
    pub slot_hashes: AccountInfo<'info>,
    
    #[account(mut)]
    pub attacker: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub player_account: Account<'info, PlayerAccount>,
    
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub reward_pool_vault: Account<'info, TokenAccount>,
    
    pub game_config: Account<'info, GameConfig>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SellProperty<'info> {
    #[account(mut)]
    pub property: Account<'info, Property>,
    
    #[account(mut)]
    pub ownership: Account<'info, PropertyOwnership>,
    
    #[account(mut)]
    pub player_account: Account<'info, PlayerAccount>,
    
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub reward_pool_vault: Account<'info, TokenAccount>,
    
    pub game_config: Account<'info, GameConfig>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AdminUpdateProperty<'info> {
    #[account(
        mut,
        constraint = game_config.authority == authority.key()
    )]
    pub property: Account<'info, Property>,
    
    pub game_config: Account<'info, GameConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminUpdateGame<'info> {
    #[account(
        mut,
        constraint = game_config.authority == authority.key()
    )]
    pub game_config: Account<'info, GameConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClosePlayerAccount<'info> {
    #[account(
        mut,
        close = rent_receiver,
        constraint = player_account.owner == player.key() @ ErrorCode::Unauthorized
    )]
    pub player_account: Account<'info, PlayerAccount>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    /// CHECK: Receives the rent refund
    #[account(mut)]
    pub rent_receiver: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct AdminClosePlayerAccount<'info> {
    /// CHECK: We're force closing this account, no need to deserialize
    /// We verify it's owned by our program in the instruction handler
    #[account(mut)]
    pub player_account: AccountInfo<'info>,
    
    #[account(constraint = game_config.authority == authority.key() @ ErrorCode::Unauthorized)]
    pub game_config: Account<'info, GameConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: Receives the rent refund
    #[account(mut)]
    pub rent_receiver: AccountInfo<'info>,
}

// ========== NEW ADMIN CONTEXTS ==========

#[derive(Accounts)]
#[instruction(target_player: Pubkey)]
pub struct AdminGrantProperty<'info> {
    #[account(mut)]
    pub property: Account<'info, Property>,
    
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + PropertyOwnership::SIZE,
        seeds = [b"ownership", target_player.as_ref(), property.property_id.to_le_bytes().as_ref()],
        bump
    )]
    pub ownership: Account<'info, PropertyOwnership>,
    
    #[account(mut)]
    pub player_account: Account<'info, PlayerAccount>,
    
    #[account(
        constraint = game_config.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: Account<'info, GameConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminRevokeProperty<'info> {
    #[account(mut)]
    pub property: Account<'info, Property>,
    
    #[account(mut)]
    pub ownership: Account<'info, PropertyOwnership>,
    
    #[account(mut)]
    pub player_account: Account<'info, PlayerAccount>,
    
    #[account(
        constraint = game_config.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: Account<'info, GameConfig>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminClearCooldown<'info> {
    #[account(mut)]
    pub set_cooldown: Account<'info, PlayerSetCooldown>,
    
    #[account(
        constraint = game_config.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: Account<'info, GameConfig>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminClearStealCooldown<'info> {
    #[account(mut)]
    pub steal_cooldown: Account<'info, PlayerStealCooldown>,
    
    #[account(
        constraint = game_config.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: Account<'info, GameConfig>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminAdjustPlayer<'info> {
    #[account(mut)]
    pub player_account: Account<'info, PlayerAccount>,
    
    #[account(
        constraint = game_config.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: Account<'info, GameConfig>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminGrantShield<'info> {
    #[account(mut)]
    pub ownership: Account<'info, PropertyOwnership>,
    
    #[account(
        constraint = game_config.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: Account<'info, GameConfig>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminEmergencyWithdraw<'info> {
    #[account(mut)]
    pub reward_pool_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub destination_account: Account<'info, TokenAccount>,
    
    #[account(
        constraint = game_config.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: Account<'info, GameConfig>,
    
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AdminTransferAuthority<'info> {
    #[account(
        mut,
        constraint = game_config.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: Account<'info, GameConfig>,
    
    pub authority: Signer<'info>,
}

// ========== STATE ACCOUNTS ==========

#[account]
pub struct GameConfig {
    pub authority: Pubkey,
    pub dev_wallet: Pubkey,
    pub marketing_wallet: Pubkey,
    pub token_mint: Pubkey,
    pub reward_pool_vault: Pubkey,
    pub total_supply: u64,
    pub circulating_supply: u64,
    pub reward_pool_initial: u64,
    pub current_phase: u8,
    pub game_paused: bool,
    pub steal_chance_targeted_bps: u16,
    pub steal_chance_random_bps: u16,
    pub steal_cost_percent_bps: u16,
    pub set_bonus_bps: u16,
    pub max_properties_per_claim: u8,
    pub min_claim_interval_minutes: i64,
    pub bump: u8,
    pub reward_pool_vault_bump: u8,
    
    pub padding: [u8; 128],  // Reserved for future features
}

impl GameConfig {
    pub const SIZE: usize = 205 + 128;  // With padding for future upgrades
}

#[account]
pub struct Property {
    pub property_id: u8,
    pub set_id: u8,
    pub max_slots_per_property: u16,
    pub available_slots: u16,
    pub max_per_player: u16,
    pub price: u64,
    pub yield_percent_bps: u16,
    pub shield_cost_percent_bps: u16,
    pub cooldown_seconds: i64,
    pub bump: u8,
    
    pub padding: [u8; 64],  // Reserved for future features
}

impl Property {
    pub const SIZE: usize = 29 + 64;  // With padding
    
    pub fn get_properties_in_set(set_id: u8) -> u8 {
        match set_id {
            0 | 7 => 2,
            _ => 3,
        }
    }
    
    pub fn get_set_bonus_bps(set_id: u8) -> u16 {
        match set_id {
            0 => 3000,  // Brown: 30%
            1 => 3286,  // Light Blue: 32.86%
            2 => 3571,  // Pink: 35.71%
            3 => 3857,  // Orange: 38.57%
            4 => 4143,  // Red: 41.43%
            5 => 4429,  // Yellow: 44.29%
            6 => 4714,  // Green: 47.14%
            7 => 5000,  // Dark Blue: 50%
            _ => 4000,  // Default fallback: 40%
        }
    }
}

#[account]
pub struct PlayerAccount {
    pub owner: Pubkey,
    pub total_slots_owned: u16,
    pub total_base_daily_income: u64,
    pub last_claim_timestamp: i64,
    pub total_rewards_claimed: u64,
    pub complete_sets_owned: u8,
    pub properties_owned_count: u8,
    pub total_steals_attempted: u32,
    pub total_steals_successful: u32,
    pub bump: u8,
    
    pub padding: [u8; 64],  // Reserved for future features
}

impl PlayerAccount {
    pub const SIZE: usize = 69 + 64;  // With padding
}

#[account]
pub struct PropertyOwnership {
    pub player: Pubkey,
    pub property_id: u8,
    pub slots_owned: u16,
    pub slots_shielded: u16,
    pub purchase_timestamp: i64,
    pub shield_expiry: i64,
    pub shield_cooldown_duration: i64,
    pub steal_protection_expiry: i64,
    pub bump: u8,
    
    pub padding: [u8; 32],  // Reserved for future features
}

impl PropertyOwnership {
    pub const SIZE: usize = 70 + 32;  // With padding
}

#[account]
pub struct PlayerSetCooldown {
    pub player: Pubkey,
    pub set_id: u8,
    pub last_purchase_timestamp: i64,
    pub cooldown_duration: i64,
    pub last_purchased_property_id: u8,
    pub properties_owned_in_set: [u8; 3],
    pub properties_count: u8,
    pub bump: u8,
    
    pub padding: [u8; 32],  // Reserved for future features
}

impl PlayerSetCooldown {
    pub const SIZE: usize = 55 + 32;  // With padding
}

#[account]
pub struct PlayerSetOwnership {
    pub player: Pubkey,
    pub set_id: u8,
    pub total_slots_in_set: u16,
    pub properties_owned_ids: [u8; 3],
    pub properties_count: u8,
    pub has_complete_set: bool,
    pub first_property_timestamp: i64,
    pub bump: u8,
    
    pub padding: [u8; 32],  // Reserved for future features
}

impl PlayerSetOwnership {
    pub const SIZE: usize = 49 + 32;  // With padding
}

#[account]
pub struct PlayerStealCooldown {
    pub player: Pubkey,
    pub property_id: u8,
    pub last_steal_attempt_timestamp: i64,
    pub cooldown_duration: i64,
    pub bump: u8,
    
    pub padding: [u8; 32],  // Reserved for future features
}

impl PlayerStealCooldown {
    pub const SIZE: usize = 50 + 32;  // With padding
}

#[account]
pub struct SetStats {
    pub set_id: u8,
    pub total_slots_sold: u64,
    pub total_revenue: u64,
    pub unique_owners: u32,
    pub total_players: u32,
    pub bump: u8,
    
    pub padding: [u8; 32],  // Reserved for future features
}

impl SetStats {
    pub const SIZE: usize = 26 + 32;  // With padding
}

// ========== EVENTS ==========

#[event]
pub struct PropertyBoughtEvent {
    pub player: Pubkey,
    pub property_id: u8,
    pub price: u64,
    pub slots_owned: u16,
    pub slots: u16,             
    pub total_cost: u64,          
    pub total_slots_owned: u16,  
}

#[event]
pub struct ShieldActivatedEvent {
    pub player: Pubkey,
    pub property_id: u8,
    pub slots_shielded: u16,
    pub cost: u64,
    pub expiry: i64,
}

#[event]
pub struct StealAttemptEvent {
    pub attacker: Pubkey,
    pub target: Pubkey,
    pub property_id: u8,
    pub steal_cost: u64,
    pub is_targeted: bool,
    pub request_slot: u64,
}

#[event]
pub struct StealSuccessEvent {
    pub attacker: Pubkey,
    pub target: Pubkey,
    pub property_id: u8,
    pub steal_cost: u64,
    pub targeted: bool,
    pub vrf_result: u64,
}

#[event]
pub struct StealFailedEvent {
    pub attacker: Pubkey,
    pub target: Pubkey,
    pub property_id: u8,
    pub steal_cost: u64,
    pub targeted: bool,
    pub vrf_result: u64,
}

#[event]
pub struct RewardsClaimedEvent {
    pub player: Pubkey,
    pub amount: u64,
    pub seconds_elapsed: i64,
}

#[event]
pub struct PropertySoldEvent {
    pub player: Pubkey,
    pub property_id: u8,
    pub slots: u16,
    pub received: u64,
    pub sell_value_percent: u16,
    pub days_held: i64,
}

#[event]
pub struct AdminUpdateEvent {
    pub property_id: u8,
    pub update_type: String,
    pub new_value: u64,
}

// ========== NEW ADMIN EVENTS ==========

#[event]
pub struct AdminGrantEvent {
    pub admin: Pubkey,
    pub target_player: Pubkey,
    pub property_id: u8,
    pub slots: u16,
}

#[event]
pub struct AdminRevokeEvent {
    pub admin: Pubkey,
    pub target_player: Pubkey,
    pub property_id: u8,
    pub slots: u16,
}

#[event]
pub struct AdminPlayerAdjustEvent {
    pub admin: Pubkey,
    pub player: Pubkey,
    pub adjustment_type: String,
    pub value: i64,
}

#[event]
pub struct AdminShieldGrantEvent {
    pub admin: Pubkey,
    pub player: Pubkey,
    pub property_id: u8,
    pub duration_hours: u16,
    pub expiry: i64,
}

#[event]
pub struct AdminWithdrawEvent {
    pub admin: Pubkey,
    pub amount: u64,
    pub destination: Pubkey,
}

#[event]
pub struct AdminAuthorityTransferEvent {
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
}

// ========== ERRORS ==========

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid property ID (must be 0-21)")]
    InvalidPropertyId,
    #[msg("Invalid slot amount (must be > 0)")]
    InvalidSlotAmount,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Maximum slots per player reached")]
    MaxSlotsReached,
    #[msg("Invalid set ID (must be 0-7)")]
    InvalidSetId,
    #[msg("No available slots for this property")]
    NoSlotsAvailable,
    #[msg("Cooldown still active - cannot purchase yet")]
    CooldownActive,
    #[msg("Player does not own this property")]
    DoesNotOwnProperty,
    #[msg("Invalid number of slots to shield")]
    InvalidShieldSlots,
    #[msg("Target does not own this property")]
    TargetDoesNotOwnProperty,
    #[msg("No eligible targets found")]
    NoEligibleTargets,
    #[msg("All slots are protected (shielded or steal protection active)")]
    AllSlotsProtected,
    #[msg("Cannot steal from yourself")]
    CannotStealFromSelf,
    #[msg("All slots are shielded")]
    AllSlotsShielded,
    #[msg("Insufficient slots")]
    InsufficientSlots,
    #[msg("No rewards to claim")]
    NoRewardsToClaim,
    #[msg("Game is paused")]
    GamePaused,
    #[msg("Unauthorized - ownership does not match player")]
    Unauthorized,
    #[msg("Invalid account count in remaining_accounts")]
    InvalidAccountCount,
    #[msg("Property mismatch between ownership and property account")]
    PropertyMismatch,
    #[msg("No properties provided")]
    NoProperties,
    #[msg("Invalid target player")]
    InvalidTarget,
    #[msg("Insufficient reward pool balance")]
    InsufficientRewardPool,
    #[msg("Too many properties in single claim (max 22)")]
    TooManyProperties,
    #[msg("Claim too soon - wait at least 1 minutes")]
    ClaimTooSoon,
    #[msg("VRF result already fulfilled")]
    AlreadyFulfilled,
    #[msg("VRF result not ready yet - wait at least 1 slot")]
    VrfNotReady,
    #[msg("Pending steal request exists - wait 5 minutes or until fulfilled")]
    PendingStealExists,
    #[msg("Steal request not fulfilled yet - cannot close")]
    NotFulfilled,
    #[msg("Steal request expired - must fulfill within 150 slots (~60 sec)")]
    StealRequestExpired,
    #[msg("Steal cooldown active - wait before attempting again")]
    StealCooldownActive,
    #[msg("Slot hash unavailable - try again")]
    SlotHashUnavailable,
    #[msg("Invalid shield duration. Must be between 1 and 48 hours.")]
    InvalidShieldDuration,
    #[msg("Shield is already active. Wait for expiry before reactivating.")]
    ShieldAlreadyActive,
    #[msg("Steal protection is active on this property")]
    StealProtectionActive,
    // ========== NEW ADMIN ERROR CODES ==========
    #[msg("Invalid yield percentage (must be <= 100%)")]
    InvalidYield,
    #[msg("Invalid shield cost percentage")]
    InvalidShieldCost,
    #[msg("Invalid cooldown duration")]
    InvalidCooldown,
    #[msg("Invalid steal cost")]
    InvalidStealCost,
    #[msg("Invalid set bonus")]
    InvalidSetBonus,
    #[msg("Invalid property count")]
    InvalidPropertyCount,
    #[msg("Invalid claim interval")]
    InvalidClaimInterval,
}