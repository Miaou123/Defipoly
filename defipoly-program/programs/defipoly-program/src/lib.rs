// Defipoly Solana Program - v10 Hardened Security
// Anchor 0.31.1 - Zero-Copy with proper field alignment

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("6VQ9vttzEeuP1RktC92E49MQAmekFGJQu1b7XrUEJfnu");

const DEV_WALLET: &str = "CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS";
const MARKETING_WALLET: &str = "FoPKSQ5HDSVyZgaQobX64YEBVQ2iiKMZp8VHWtd6jLQE";
const MAX_PROPERTIES: usize = 22;
const MAX_SETS: usize = 8;

// ========== HELPER: UPDATE PENDING REWARDS ==========

#[inline(never)]
fn update_pending_rewards(player: &mut PlayerAccount) -> Result<()> {
    let clock = Clock::get()?;
    let clock_timestamp = clock.unix_timestamp;
    
    let time_elapsed = clock_timestamp
        .checked_sub(player.last_accumulation_timestamp)
        .ok_or(ErrorCode::Overflow)?;
    
    if time_elapsed > 0 && player.total_base_daily_income > 0 {
        let income_per_second = player.total_base_daily_income
            .checked_div(86400)  // 86400 seconds per day
            .ok_or(ErrorCode::Overflow)?;
        
        let new_rewards = (income_per_second as u128)
            .checked_mul(time_elapsed as u128)  // time_elapsed is already in seconds
            .and_then(|r| u64::try_from(r).ok())
            .ok_or(ErrorCode::Overflow)?;
        
        player.pending_rewards = player.pending_rewards
            .checked_add(new_rewards)
            .ok_or(ErrorCode::Overflow)?;
    }
    
    player.last_accumulation_timestamp = clock_timestamp;
    
    Ok(())
}

#[program]
pub mod defipoly_program {
    use super::*;

    // ========== INITIALIZATION ==========

    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        _initial_reward_pool_amount: u64,
    ) -> Result<()> {
        let game_config = &mut ctx.accounts.game_config.load_init()?;
        game_config.authority = ctx.accounts.authority.key();
        game_config.dev_wallet = DEV_WALLET.parse().unwrap();
        game_config.marketing_wallet = MARKETING_WALLET.parse().unwrap();
        game_config.token_mint = ctx.accounts.token_mint.key();
        game_config.reward_pool_vault = ctx.accounts.reward_pool_vault.key();
        game_config.accumulation_tier1_threshold = 0;
        game_config.accumulation_tier2_threshold = 0;
        game_config.accumulation_tier3_threshold = 0;
        game_config.accumulation_tier4_threshold = 0;
        game_config.accumulation_tier5_threshold = 0;
        game_config.accumulation_tier6_threshold = 0;
        game_config.accumulation_tier7_threshold = 0;
        game_config.accumulation_tier8_threshold = 0;
        game_config.steal_chance_bps = 3300; // 33%
        game_config.steal_cost_percent_bps = 5000; // 50%
        game_config.set_bonus_bps = [
            3000,  // Set 0 (Brown) - 30%
            3286,  // Set 1 (Light Blue) - 32.86%
            3571,  // Set 2 (Pink) - 35.71%
            3857,  // Set 3 (Orange) - 38.57%
            4143,  // Set 4 (Red) - 41.43%
            4429,  // Set 5 (Yellow) - 44.29%
            4714,  // Set 6 (Green) - 47.14%
            5000,  // Set 7 (Dark Blue) - 50%
        ];
        game_config.accumulation_tier1_bonus_bps = 0;
        game_config.accumulation_tier2_bonus_bps = 0;
        game_config.accumulation_tier3_bonus_bps = 0;
        game_config.accumulation_tier4_bonus_bps = 0;
        game_config.accumulation_tier5_bonus_bps = 0;
        game_config.accumulation_tier6_bonus_bps = 0;
        game_config.accumulation_tier7_bonus_bps = 0;
        game_config.accumulation_tier8_bonus_bps = 0;
        game_config.game_paused = 0;
        game_config.bump = ctx.bumps.game_config;
        game_config.reward_pool_vault_bump = ctx.bumps.reward_pool_vault;
        game_config._padding = [0u8; 9];

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
        
        Ok(())
    }

    pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player_account.load_init()?;
        let clock = Clock::get()?;
        
        player.owner = ctx.accounts.player.key();
        player.total_base_daily_income = 0;
        player.last_accumulation_timestamp = clock.unix_timestamp;
        player.total_rewards_claimed = 0;
        player.pending_rewards = 0;
        player.total_steals_attempted = 0;
        player.total_steals_successful = 0;
        player.total_slots_owned = 0;
        player.complete_sets_owned = 0;
        player.properties_owned_count = 0;
        player.bump = ctx.bumps.player_account;
        player._padding1 = [0u8; 3];
        
        player.property_slots = [0u16; MAX_PROPERTIES];
        player.property_shielded = [0u16; MAX_PROPERTIES];
        player.property_purchase_timestamp = [0i64; MAX_PROPERTIES];
        player.property_shield_expiry = [0i64; MAX_PROPERTIES];
        player.property_shield_cooldown = [0i64; MAX_PROPERTIES];
        player.property_steal_protection_expiry = [0i64; MAX_PROPERTIES];
        player.set_cooldown_timestamp = [0i64; MAX_SETS];
        player.set_cooldown_duration = [0i64; MAX_SETS];
        player.steal_cooldown_timestamp = [0i64; MAX_PROPERTIES];
        player.set_last_purchased_property = [255u8; MAX_SETS];
        player.set_properties_mask = [0u8; MAX_SETS];
        
        Ok(())
    }

    // ========== PROPERTY PURCHASE ==========

    pub fn buy_property(
        ctx: Context<BuyProperty>,
        slots: u16,
    ) -> Result<()> {
        let game_config = &ctx.accounts.game_config.load()?;
        let property = &mut ctx.accounts.property;
        let player = &mut ctx.accounts.player_account.load_mut()?;
        let clock = Clock::get()?;

        require!(player.owner == ctx.accounts.player.key(), ErrorCode::Unauthorized);

        let property_id = property.property_id as usize;
        let set_id = property.set_id as usize;

        update_pending_rewards(player)?;
    
        require!(game_config.game_paused == 0, ErrorCode::GamePaused);
        require!(slots > 0, ErrorCode::InvalidSlotAmount);
        require!(property.available_slots >= slots, ErrorCode::NoSlotsAvailable);
        
        require!(
            player.property_slots[property_id].checked_add(slots).ok_or(ErrorCode::Overflow)? <= property.max_per_player,
            ErrorCode::MaxSlotsReached
        );
    
        // Cooldown check
        if player.set_cooldown_timestamp[set_id] != 0 {
            let time_since_last_purchase = clock.unix_timestamp
                .checked_sub(player.set_cooldown_timestamp[set_id])
                .ok_or(ErrorCode::Overflow)?;
            
            if player.set_last_purchased_property[set_id] != property.property_id {
                require!(
                    time_since_last_purchase >= player.set_cooldown_duration[set_id],
                    ErrorCode::CooldownActive
                );
            }
        }
    
        let total_price = property.price
            .checked_mul(slots as u64)
            .ok_or(ErrorCode::Overflow)?;

        distribute_payment(
            total_price,
            &ctx.accounts.player_token_account,
            &ctx.accounts.reward_pool_vault,
            &ctx.accounts.marketing_token_account,
            &ctx.accounts.dev_token_account,
            &ctx.accounts.player,
            &ctx.accounts.token_program,
        )?;
    
        property.available_slots = property.available_slots
            .checked_sub(slots)
            .ok_or(ErrorCode::Overflow)?;
    
        let is_new_ownership = player.property_slots[property_id] == 0;
        if is_new_ownership {
            player.property_purchase_timestamp[property_id] = clock.unix_timestamp;
            player.properties_owned_count = player.properties_owned_count
                .checked_add(1)
                .ok_or(ErrorCode::Overflow)?;
            
            let property_bit = get_property_bit_in_set(property.property_id, property.set_id);
            player.set_properties_mask[set_id] |= 1 << property_bit;
        }
        
        player.property_slots[property_id] = player.property_slots[property_id]
            .checked_add(slots)
            .ok_or(ErrorCode::Overflow)?;
    
        player.total_slots_owned = player.total_slots_owned
            .checked_add(slots)
            .ok_or(ErrorCode::Overflow)?;

        let daily_income_per_slot = property.price
            .checked_mul(property.yield_percent_bps as u64)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::Overflow)?;
        let total_daily_income_increase = daily_income_per_slot
            .checked_mul(slots as u64)
            .ok_or(ErrorCode::Overflow)?;
    
        player.total_base_daily_income = player.total_base_daily_income
            .checked_add(total_daily_income_increase)
            .ok_or(ErrorCode::Overflow)?;
    
        // Check for complete set bonus
        let required_properties = get_properties_in_set(property.set_id);
        let owned_count = count_properties_in_set(player.set_properties_mask[set_id]);
        let was_complete = player.complete_sets_owned > 0 && is_set_complete(player, property.set_id);
        
        if owned_count >= required_properties && !was_complete {
            player.complete_sets_owned = player.complete_sets_owned
                .checked_add(1)
                .ok_or(ErrorCode::Overflow)?;
        }
    
        // Update cooldown
        player.set_cooldown_timestamp[set_id] = clock.unix_timestamp;
        player.set_cooldown_duration[set_id] = property.cooldown_seconds;
        player.set_last_purchased_property[set_id] = property.property_id;
    
        emit!(PropertyBoughtEvent {
            player: player.owner,
            property_id: property.property_id,
            price: property.price,      
            slots_owned: player.property_slots[property_id], 
            slots,
            total_cost: total_price,
            total_slots_owned: player.property_slots[property_id],
        });
    
        Ok(())
    }

    // ========== SHIELD SYSTEM ==========

    pub fn activate_shield(
        ctx: Context<ActivateShield>,
        shield_duration_hours: u16,
    ) -> Result<()> {
        let game_config = &ctx.accounts.game_config.load()?;
        let property = &ctx.accounts.property;
        let player = &mut ctx.accounts.player_account.load_mut()?;
        let clock = Clock::get()?;
        
        require!(player.owner == ctx.accounts.player.key(), ErrorCode::Unauthorized);
        
        let property_id = property.property_id as usize;
    
        require!(game_config.game_paused == 0, ErrorCode::GamePaused);
        require!(player.property_slots[property_id] > 0, ErrorCode::DoesNotOwnProperty);
        
        require!(
            shield_duration_hours >= 1 && shield_duration_hours <= 48,
            ErrorCode::InvalidShieldDuration
        );
        
        require!(
            player.property_shielded[property_id] == 0 || 
            clock.unix_timestamp >= player.property_shield_expiry[property_id],
            ErrorCode::ShieldAlreadyActive
        );
    
        let slots_to_shield = player.property_slots[property_id];
    
        let daily_income_per_slot = property.price
            .checked_mul(property.yield_percent_bps as u64)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::Overflow)?;
        let shield_cost_per_slot = daily_income_per_slot
            .checked_mul(property.shield_cost_percent_bps as u64)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::Overflow)?;
        let cost_per_slot_for_duration = shield_cost_per_slot
            .checked_mul(shield_duration_hours as u64)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(24)
            .ok_or(ErrorCode::Overflow)?;
        let total_cost = cost_per_slot_for_duration
            .checked_mul(slots_to_shield as u64)
            .ok_or(ErrorCode::Overflow)?;
    
        distribute_payment(
            total_cost,
            &ctx.accounts.player_token_account,
            &ctx.accounts.reward_pool_vault,
            &ctx.accounts.marketing_token_account,
            &ctx.accounts.dev_token_account,
            &ctx.accounts.player,
            &ctx.accounts.token_program,
        )?;
    
        let shield_duration_seconds = (shield_duration_hours as i64)
            .checked_mul(3600)
            .ok_or(ErrorCode::Overflow)?;
        
        let shield_start_time = if clock.unix_timestamp < player.property_steal_protection_expiry[property_id] {
            player.property_steal_protection_expiry[property_id]
        } else {
            clock.unix_timestamp
        };
    
        player.property_shielded[property_id] = slots_to_shield;
        player.property_shield_expiry[property_id] = shield_start_time
            .checked_add(shield_duration_seconds)
            .ok_or(ErrorCode::Overflow)?;
        player.property_shield_cooldown[property_id] = shield_duration_seconds
            .checked_div(4)
            .ok_or(ErrorCode::Overflow)?;
    
        emit!(ShieldActivatedEvent {
            player: player.owner,
            property_id: property.property_id,
            slots_shielded: slots_to_shield,
            cost: total_cost,
            expiry: player.property_shield_expiry[property_id],
        });
    
        Ok(())
    }

    // ========== STEAL MECHANICS ==========

    pub fn steal_property_instant<'info>(
        ctx: Context<'_, '_, 'info, 'info, StealPropertyInstant<'info>>,
        user_randomness: [u8; 32],
    ) -> Result<()> {
        let property = &ctx.accounts.property;
        let clock = Clock::get()?;
        
        let property_id = property.property_id as usize;

        let (game_paused, steal_cost_percent_bps, steal_chance_bps) = {
            let game_config = ctx.accounts.game_config.load()?;
            (game_config.game_paused, game_config.steal_cost_percent_bps, game_config.steal_chance_bps)
        };

        require!(game_paused == 0, ErrorCode::GamePaused);

        let player = &mut ctx.accounts.player_account.load_mut()?;
        require!(player.owner == ctx.accounts.attacker.key(), ErrorCode::Unauthorized);

        let remaining_accounts = ctx.remaining_accounts;
        require!(remaining_accounts.len() >= 1, ErrorCode::NoEligibleTargets);

        // Generate randomness
        let slot_hashes = &ctx.accounts.slot_hashes;
        let slot_hashes_data = slot_hashes.data.borrow();
        
        require!(
            slot_hashes_data.len() >= 40,
            ErrorCode::SlotHashUnavailable
        );

        let mut slot_hash_bytes = [0u8; 32];
        slot_hash_bytes.copy_from_slice(&slot_hashes_data[8..40]);

        let mut combined_entropy = [0u8; 32];
        for i in 0..32 {
            combined_entropy[i] = user_randomness[i]
                ^ slot_hash_bytes[i]
                ^ ((clock.slot >> (i % 8)) as u8)
                ^ ((clock.unix_timestamp >> (i % 8)) as u8);
        }
        
        let random_u64 = u64::from_le_bytes(combined_entropy[0..8].try_into().unwrap());

        let num_targets = remaining_accounts.len();
        let target_index = (random_u64 % num_targets as u64) as usize;
        let target_account_info = &remaining_accounts[target_index];

        let target_loader: AccountLoader<'info, PlayerAccount> = AccountLoader::try_from(target_account_info)?;
        let mut target_account = target_loader.load_mut()?;

        let target_player = target_account.owner;

        require!(
            target_player != ctx.accounts.attacker.key(),
            ErrorCode::CannotStealFromSelf
        );
        require!(target_account.property_slots[property_id] > 0, ErrorCode::TargetDoesNotOwnProperty);

        let shielded_slots = if clock.unix_timestamp < target_account.property_shield_expiry[property_id] {
            target_account.property_shielded[property_id]
        } else {
            0
        };
        
        let has_steal_protection = clock.unix_timestamp < target_account.property_steal_protection_expiry[property_id];
        
        require!(
            target_account.property_slots[property_id] > shielded_slots,
            ErrorCode::AllSlotsShielded
        );
        require!(!has_steal_protection, ErrorCode::StealProtectionActive);

        // Cooldown check
        let cooldown_duration = property.cooldown_seconds
            .checked_div(2)
            .ok_or(ErrorCode::Overflow)?;
        if player.steal_cooldown_timestamp[property_id] != 0 {
            let time_since_last_steal = clock.unix_timestamp
                .checked_sub(player.steal_cooldown_timestamp[property_id])
                .ok_or(ErrorCode::Overflow)?;
            require!(
                time_since_last_steal >= cooldown_duration,
                ErrorCode::StealCooldownActive
            );
        }

        player.steal_cooldown_timestamp[property_id] = clock.unix_timestamp;

        let steal_cost = property.price
            .checked_mul(steal_cost_percent_bps as u64)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::Overflow)?;

        distribute_payment(
            steal_cost,
            &ctx.accounts.player_token_account,
            &ctx.accounts.reward_pool_vault,
            &ctx.accounts.marketing_token_account,
            &ctx.accounts.dev_token_account,
            &ctx.accounts.attacker,
            &ctx.accounts.token_program,
        )?;

        // Determine success
        let success_threshold = steal_chance_bps as u64;
        let success_random = u64::from_le_bytes(combined_entropy[8..16].try_into().unwrap());
        let success = (success_random % 10000) < success_threshold;

        player.total_steals_attempted = player.total_steals_attempted
            .checked_add(1)
            .ok_or(ErrorCode::Overflow)?;

        if success {
            update_pending_rewards(player)?;
            update_pending_rewards(&mut target_account)?;
            
            target_account.property_slots[property_id] = target_account.property_slots[property_id]
                .checked_sub(1)
                .ok_or(ErrorCode::Overflow)?;

            if target_account.property_shielded[property_id] > target_account.property_slots[property_id] {
                target_account.property_shielded[property_id] = target_account.property_slots[property_id];
            }

            let was_new = player.property_slots[property_id] == 0;
            if was_new {
                player.property_purchase_timestamp[property_id] = clock.unix_timestamp;
                player.properties_owned_count = player.properties_owned_count
                    .checked_add(1)
                    .ok_or(ErrorCode::Overflow)?;
                
                let set_id = property.set_id as usize;
                let property_bit = get_property_bit_in_set(property.property_id, property.set_id);
                player.set_properties_mask[set_id] |= 1 << property_bit;
            }
            player.property_slots[property_id] = player.property_slots[property_id]
                .checked_add(1)
                .ok_or(ErrorCode::Overflow)?;

            player.total_slots_owned = player.total_slots_owned
                .checked_add(1)
                .ok_or(ErrorCode::Overflow)?;
            player.total_steals_successful = player.total_steals_successful
                .checked_add(1)
                .ok_or(ErrorCode::Overflow)?;

            let daily_income_per_slot = property.price
                .checked_mul(property.yield_percent_bps as u64)
                .ok_or(ErrorCode::Overflow)?
                .checked_div(10000)
                .ok_or(ErrorCode::Overflow)?;

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
                vrf_result: random_u64,
            });
        } else {
            emit!(StealFailedEvent {
                attacker: ctx.accounts.attacker.key(),
                target: target_player,
                property_id: property.property_id,
                steal_cost,
                vrf_result: random_u64,
            });
        }

        // Apply 6-hour steal protection
        let protection_duration: i64 = 6_i64
            .checked_mul(3600)
            .ok_or(ErrorCode::Overflow)?;
        target_account.property_steal_protection_expiry[property_id] = clock.unix_timestamp
            .checked_add(protection_duration)
            .ok_or(ErrorCode::Overflow)?;

        Ok(())
    }

    // ========== CLAIM REWARDS ==========

    pub fn claim_rewards<'info>(
        ctx: Context<'_, '_, '_, 'info, ClaimRewards<'info>>,
    ) -> Result<()> {
        let game_config = &ctx.accounts.game_config.load()?;
        let player = &mut ctx.accounts.player_account.load_mut()?;
        let clock = Clock::get()?;
    
        require!(player.owner == ctx.accounts.player.key(), ErrorCode::Unauthorized);
        require!(game_config.game_paused == 0, ErrorCode::GamePaused);
        
        
        update_pending_rewards(player)?;
        
        let base_rewards = player.pending_rewards;
        
        require!(base_rewards > 0, ErrorCode::NoRewardsToClaim);
        
        // Calculate accumulation tier bonus
        let accumulation_bonus = calculate_progressive_bonus(base_rewards, &game_config)?;
        
        // Calculate set completion bonus
        let mut set_bonus: u64 = 0;
        for set_id in 0..8u8 {
            if is_set_complete(player, set_id) {
                let bonus = (base_rewards as u128)
                    .checked_mul(game_config.set_bonus_bps[set_id as usize] as u128)
                    .and_then(|r| r.checked_div(10000))
                    .and_then(|r| u64::try_from(r).ok())
                    .ok_or(ErrorCode::Overflow)?;
                set_bonus = set_bonus.checked_add(bonus).ok_or(ErrorCode::Overflow)?;
            }
        }
        
        let total_rewards = base_rewards
            .checked_add(accumulation_bonus)
            .ok_or(ErrorCode::Overflow)?
            .checked_add(set_bonus)
            .ok_or(ErrorCode::Overflow)?;
        
        require!(
            ctx.accounts.reward_pool_vault.amount >= total_rewards,
            ErrorCode::InsufficientRewardPool
        );
        
        let game_config_key = ctx.accounts.game_config.key();
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
    
        player.pending_rewards = 0;
        player.total_rewards_claimed = player.total_rewards_claimed
            .checked_add(total_rewards)
            .ok_or(ErrorCode::Overflow)?;
        player.last_accumulation_timestamp = clock.unix_timestamp;
    
        emit!(RewardsClaimedEvent {
            player: player.owner,
            amount: total_rewards,
            seconds_elapsed: 0,
        });
    
        Ok(())
    }

    // ========== SELL PROPERTY ==========

    pub fn sell_property(
        ctx: Context<SellProperty>,
        slots: u16,
    ) -> Result<()> {
        let game_config = &ctx.accounts.game_config.load()?;
        let property = &mut ctx.accounts.property;
        let player = &mut ctx.accounts.player_account.load_mut()?;
        let clock = Clock::get()?;
        
        require!(player.owner == ctx.accounts.player.key(), ErrorCode::Unauthorized);
        
        let property_id = property.property_id as usize;

        update_pending_rewards(player)?;

        require!(game_config.game_paused == 0, ErrorCode::GamePaused);
        require!(player.property_slots[property_id] >= slots, ErrorCode::InsufficientSlots);

        let time_held = clock.unix_timestamp
            .checked_sub(player.property_purchase_timestamp[property_id])
            .ok_or(ErrorCode::Overflow)?;
        let days_held = time_held
            .checked_div(86400)
            .ok_or(ErrorCode::Overflow)?;
        let additional_percent = if days_held >= 14 {
            1500u16
        } else {
            let scaled = (days_held as u64)
                .checked_mul(1500)
                .ok_or(ErrorCode::Overflow)?
                .checked_div(14)
                .ok_or(ErrorCode::Overflow)?;
            scaled as u16
        };
        let sell_value_bps = 1500u16
            .checked_add(additional_percent)
            .ok_or(ErrorCode::Overflow)?;

        let total_value = property.price
            .checked_mul(slots as u64)
            .ok_or(ErrorCode::Overflow)?;
        let player_receives = total_value
            .checked_mul(sell_value_bps as u64)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::Overflow)?;

        let game_config_key = ctx.accounts.game_config.key();
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

        player.property_slots[property_id] = player.property_slots[property_id]
            .checked_sub(slots)
            .ok_or(ErrorCode::Overflow)?;
        
        if player.property_shielded[property_id] > 0 {
            if clock.unix_timestamp < player.property_shield_expiry[property_id] {
                if slots >= player.property_shielded[property_id] {
                    player.property_shielded[property_id] = 0;
                    player.property_shield_expiry[property_id] = 0;
                } else {
                    player.property_shielded[property_id] = player.property_shielded[property_id]
                        .checked_sub(slots)
                        .ok_or(ErrorCode::Overflow)?;
                }
            } else {
                player.property_shielded[property_id] = 0;
                player.property_shield_expiry[property_id] = 0;
            }
        }
        
        if player.property_shielded[property_id] > player.property_slots[property_id] {
            player.property_shielded[property_id] = player.property_slots[property_id];
        }

        if player.property_slots[property_id] == 0 {
            let set_id = property.set_id as usize;
            let property_bit = get_property_bit_in_set(property.property_id, property.set_id);
            player.set_properties_mask[set_id] &= !(1 << property_bit);
            player.properties_owned_count = player.properties_owned_count
                .checked_sub(1)
                .ok_or(ErrorCode::Overflow)?;
        }

        property.available_slots = property.available_slots
            .checked_add(slots)
            .ok_or(ErrorCode::Overflow)?;
        player.total_slots_owned = player.total_slots_owned
            .checked_sub(slots)
            .ok_or(ErrorCode::Overflow)?;

        let daily_income_per_slot = property.price
            .checked_mul(property.yield_percent_bps as u64)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::Overflow)?;
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

        Ok(())
    }

    // ========== ADMIN FUNCTIONS ==========

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
        Ok(())
    }

    pub fn update_property_max_slots(
        ctx: Context<AdminUpdateProperty>,
        property_id: u8,
        new_max_slots: u16,
    ) -> Result<()> {
        let property = &mut ctx.accounts.property;
        let slots_difference = (new_max_slots as i32)
            .checked_sub(property.max_slots_per_property as i32)
            .ok_or(ErrorCode::Overflow)?;
        property.max_slots_per_property = new_max_slots;
        let new_available = (property.available_slots as i32)
            .checked_add(slots_difference)
            .ok_or(ErrorCode::Overflow)?;
        property.available_slots = new_available as u16;
        emit!(AdminUpdateEvent {
            property_id,
            update_type: "max_slots".to_string(),
            new_value: new_max_slots as u64,
        });
        Ok(())
    }

    pub fn update_steal_chance(
        ctx: Context<AdminUpdateGame>,
        chance_bps: u16,
    ) -> Result<()> {
        let game_config = &mut ctx.accounts.game_config.load_mut()?;
        game_config.steal_chance_bps = chance_bps;
        Ok(())
    }

    pub fn pause_game(ctx: Context<AdminUpdateGame>) -> Result<()> {
        let game_config = &mut ctx.accounts.game_config.load_mut()?;
        game_config.game_paused = 1;
        Ok(())
    }

    pub fn unpause_game(ctx: Context<AdminUpdateGame>) -> Result<()> {
        let game_config = &mut ctx.accounts.game_config.load_mut()?;
        game_config.game_paused = 0;
        Ok(())
    }

    pub fn close_player_account(ctx: Context<ClosePlayerAccount>) -> Result<()> {
        let player = ctx.accounts.player_account.load()?;
        require!(player.owner == ctx.accounts.player.key(), ErrorCode::Unauthorized);
        Ok(())
    }

    pub fn admin_close_player_account(ctx: Context<AdminClosePlayerAccount>) -> Result<()> {
        require!(
            ctx.accounts.player_account.owner == ctx.program_id,
            ErrorCode::Unauthorized
        );
        
        let dest_starting_lamports = ctx.accounts.rent_receiver.lamports();
        let account_lamports = ctx.accounts.player_account.lamports();
        
        **ctx.accounts.rent_receiver.lamports.borrow_mut() = dest_starting_lamports
            .checked_add(account_lamports)
            .ok_or(ErrorCode::Overflow)?;
        **ctx.accounts.player_account.lamports.borrow_mut() = 0;
        
        let mut data = ctx.accounts.player_account.try_borrow_mut_data()?;
        data.fill(0);
        
        Ok(())
    }

    pub fn admin_grant_property(
        ctx: Context<AdminGrantProperty>,
        _target_player: Pubkey,
        slots: u16,
    ) -> Result<()> {
        let game_config = &ctx.accounts.game_config.load()?;
        let property = &mut ctx.accounts.property;
        let player = &mut ctx.accounts.player_account.load_mut()?;
        let clock = Clock::get()?;
        
        let property_id = property.property_id as usize;

        require!(game_config.game_paused == 0, ErrorCode::GamePaused);
        require!(slots > 0, ErrorCode::InvalidSlotAmount);
        require!(property.available_slots >= slots, ErrorCode::NoSlotsAvailable);
        require!(
            player.property_slots[property_id].checked_add(slots).ok_or(ErrorCode::Overflow)? <= property.max_per_player,
            ErrorCode::MaxSlotsReached
        );

        property.available_slots = property.available_slots
            .checked_sub(slots)
            .ok_or(ErrorCode::Overflow)?;

        if player.property_slots[property_id] == 0 {
            player.property_purchase_timestamp[property_id] = clock.unix_timestamp;
            player.properties_owned_count = player.properties_owned_count
                .checked_add(1)
                .ok_or(ErrorCode::Overflow)?;
            
            let set_id = property.set_id as usize;
            let property_bit = get_property_bit_in_set(property.property_id, property.set_id);
            player.set_properties_mask[set_id] |= 1 << property_bit;
        }
        
        player.property_slots[property_id] = player.property_slots[property_id]
            .checked_add(slots)
            .ok_or(ErrorCode::Overflow)?;

        player.total_slots_owned = player.total_slots_owned
            .checked_add(slots)
            .ok_or(ErrorCode::Overflow)?;

        let daily_income_per_slot = property.price
            .checked_mul(property.yield_percent_bps as u64)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::Overflow)?;
        let total_daily_income_increase = daily_income_per_slot
            .checked_mul(slots as u64)
            .ok_or(ErrorCode::Overflow)?;

        player.total_base_daily_income = player.total_base_daily_income
            .checked_add(total_daily_income_increase)
            .ok_or(ErrorCode::Overflow)?;

        emit!(AdminGrantEvent {
            admin: ctx.accounts.authority.key(),
            target_player: player.owner,
            property_id: property.property_id,
            slots,
        });

        Ok(())
    }

    pub fn admin_revoke_property(
        ctx: Context<AdminRevokeProperty>,
        slots: u16,
    ) -> Result<()> {
        let property = &mut ctx.accounts.property;
        let player = &mut ctx.accounts.player_account.load_mut()?;
        
        let property_id = property.property_id as usize;

        require!(player.property_slots[property_id] >= slots, ErrorCode::InsufficientSlots);

        player.property_slots[property_id] = player.property_slots[property_id]
            .checked_sub(slots)
            .ok_or(ErrorCode::Overflow)?;

        if player.property_shielded[property_id] > player.property_slots[property_id] {
            player.property_shielded[property_id] = player.property_slots[property_id];
        }

        if player.property_slots[property_id] == 0 {
            let set_id = property.set_id as usize;
            let property_bit = get_property_bit_in_set(property.property_id, property.set_id);
            player.set_properties_mask[set_id] &= !(1 << property_bit);
            player.properties_owned_count = player.properties_owned_count
                .checked_sub(1)
                .ok_or(ErrorCode::Overflow)?;
        }

        property.available_slots = property.available_slots
            .checked_add(slots)
            .ok_or(ErrorCode::Overflow)?;

        player.total_slots_owned = player.total_slots_owned
            .checked_sub(slots)
            .ok_or(ErrorCode::Overflow)?;

        let daily_income_per_slot = property.price
            .checked_mul(property.yield_percent_bps as u64)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::Overflow)?;
        let total_daily_income_decrease = daily_income_per_slot
            .checked_mul(slots as u64)
            .ok_or(ErrorCode::Overflow)?;

        player.total_base_daily_income = player.total_base_daily_income
            .checked_sub(total_daily_income_decrease)
            .ok_or(ErrorCode::Overflow)?;

        emit!(AdminRevokeEvent {
            admin: ctx.accounts.authority.key(),
            target_player: player.owner,
            property_id: property.property_id,
            slots,
        });

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
        
        Ok(())
    }

    pub fn admin_update_set_bonus(
        ctx: Context<AdminUpdateGame>,
        set_id: u8,
        bonus_bps: u16,
    ) -> Result<()> {
        require!(set_id < 8, ErrorCode::InvalidSetId);
        require!(bonus_bps <= 10000, ErrorCode::InvalidBonus);
        
        let game_config = &mut ctx.accounts.game_config.load_mut()?;
        game_config.set_bonus_bps[set_id as usize] = bonus_bps;
        
        Ok(())
    }

    pub fn admin_clear_cooldown(
        ctx: Context<AdminClearCooldown>,
        set_id: u8,
    ) -> Result<()> {
        let player = &mut ctx.accounts.player_account.load_mut()?;
        player.set_cooldown_timestamp[set_id as usize] = 0;
        
        Ok(())
    }

    pub fn admin_clear_steal_cooldown(
        ctx: Context<AdminClearStealCooldown>,
        property_id: u8,
    ) -> Result<()> {
        let player = &mut ctx.accounts.player_account.load_mut()?;
        player.steal_cooldown_timestamp[property_id as usize] = 0;
        
        Ok(())
    }

    pub fn admin_grant_shield(
        ctx: Context<AdminGrantShield>,
        property_id: u8,
        duration_hours: u16,
    ) -> Result<()> {
        let player = &mut ctx.accounts.player_account.load_mut()?;
        let clock = Clock::get()?;
        let pid = property_id as usize;
        
        require!(
            duration_hours >= 1 && duration_hours <= 168,
            ErrorCode::InvalidShieldDuration
        );
        
        let shield_duration_seconds = (duration_hours as i64)
            .checked_mul(3600)
            .ok_or(ErrorCode::Overflow)?;
        
        let shield_start_time = if clock.unix_timestamp < player.property_steal_protection_expiry[pid] {
            player.property_steal_protection_expiry[pid]
        } else {
            clock.unix_timestamp
        };
        
        player.property_shielded[pid] = player.property_slots[pid];
        player.property_shield_expiry[pid] = shield_start_time
            .checked_add(shield_duration_seconds)
            .ok_or(ErrorCode::Overflow)?;
        player.property_shield_cooldown[pid] = shield_duration_seconds
            .checked_div(4)
            .ok_or(ErrorCode::Overflow)?;
        
        emit!(AdminShieldGrantEvent {
            admin: ctx.accounts.authority.key(),
            player: player.owner,
            property_id,
            duration_hours,
            expiry: player.property_shield_expiry[pid],
        });
        
        Ok(())
    }

    pub fn admin_emergency_withdraw(
        ctx: Context<AdminEmergencyWithdraw>,
        amount: u64,
    ) -> Result<()> {
        let game_config = &ctx.accounts.game_config.load()?;
        
        require!(
            ctx.accounts.reward_pool_vault.amount >= amount,
            ErrorCode::InsufficientRewardPool
        );
        
        let game_config_key = ctx.accounts.game_config.key();
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

        Ok(())
    }

    pub fn admin_transfer_authority(
        ctx: Context<AdminTransferAuthority>,
        new_authority: Pubkey,
    ) -> Result<()> {
        let game_config = &mut ctx.accounts.game_config.load_mut()?;
        let old_authority = game_config.authority;
        
        game_config.authority = new_authority;
        
        emit!(AdminAuthorityTransferEvent {
            old_authority,
            new_authority,
        });
        
        Ok(())
    }

    pub fn admin_update_global_rates(
        ctx: Context<AdminUpdateGame>,
        steal_cost_bps: Option<u16>,
    ) -> Result<()> {
        let game_config = &mut ctx.accounts.game_config.load_mut()?;
        
        if let Some(cost) = steal_cost_bps {
            require!(cost <= 10000, ErrorCode::InvalidStealCost);
            game_config.steal_cost_percent_bps = cost;
        }
        
        
        Ok(())
    }

    pub fn admin_update_accumulation_bonus(
        ctx: Context<AdminUpdateGame>,
        tier1_threshold: u64,
        tier1_bonus_bps: u16,
        tier2_threshold: u64,
        tier2_bonus_bps: u16,
        tier3_threshold: u64,
        tier3_bonus_bps: u16,
        tier4_threshold: u64,
        tier4_bonus_bps: u16,
        tier5_threshold: u64,
        tier5_bonus_bps: u16,
        tier6_threshold: u64,
        tier6_bonus_bps: u16,
        tier7_threshold: u64,
        tier7_bonus_bps: u16,
        tier8_threshold: u64,
        tier8_bonus_bps: u16,
    ) -> Result<()> {
        let game_config = &mut ctx.accounts.game_config.load_mut()?;
        
        require!(tier1_bonus_bps <= 5000, ErrorCode::InvalidBonus);
        require!(tier2_bonus_bps <= 5000, ErrorCode::InvalidBonus);
        require!(tier3_bonus_bps <= 5000, ErrorCode::InvalidBonus);
        require!(tier4_bonus_bps <= 5000, ErrorCode::InvalidBonus);
        require!(tier5_bonus_bps <= 5000, ErrorCode::InvalidBonus);
        require!(tier6_bonus_bps <= 5000, ErrorCode::InvalidBonus);
        require!(tier7_bonus_bps <= 5000, ErrorCode::InvalidBonus);
        require!(tier8_bonus_bps <= 5000, ErrorCode::InvalidBonus);
        
        game_config.accumulation_tier1_threshold = tier1_threshold;
        game_config.accumulation_tier1_bonus_bps = tier1_bonus_bps;
        game_config.accumulation_tier2_threshold = tier2_threshold;
        game_config.accumulation_tier2_bonus_bps = tier2_bonus_bps;
        game_config.accumulation_tier3_threshold = tier3_threshold;
        game_config.accumulation_tier3_bonus_bps = tier3_bonus_bps;
        game_config.accumulation_tier4_threshold = tier4_threshold;
        game_config.accumulation_tier4_bonus_bps = tier4_bonus_bps;
        game_config.accumulation_tier5_threshold = tier5_threshold;
        game_config.accumulation_tier5_bonus_bps = tier5_bonus_bps;
        game_config.accumulation_tier6_threshold = tier6_threshold;
        game_config.accumulation_tier6_bonus_bps = tier6_bonus_bps;
        game_config.accumulation_tier7_threshold = tier7_threshold;
        game_config.accumulation_tier7_bonus_bps = tier7_bonus_bps;
        game_config.accumulation_tier8_threshold = tier8_threshold;
        game_config.accumulation_tier8_bonus_bps = tier8_bonus_bps;
        
        Ok(())
    }
}

// ========== HELPER FUNCTIONS ==========

#[inline(never)]
fn distribute_payment<'info>(
    amount: u64,
    from: &Account<'info, TokenAccount>,
    reward_pool: &Account<'info, TokenAccount>,
    marketing: &Account<'info, TokenAccount>,
    dev: &Account<'info, TokenAccount>,
    authority: &Signer<'info>,
    token_program: &Program<'info, Token>,
) -> Result<()> {
    let to_reward_pool = amount
        .checked_mul(95)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(100)
        .ok_or(ErrorCode::Overflow)?;
    let to_marketing = amount
        .checked_mul(3)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(100)
        .ok_or(ErrorCode::Overflow)?;
    let to_dev = amount
        .checked_mul(2)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(100)
        .ok_or(ErrorCode::Overflow)?;

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

#[inline(never)]
fn calculate_progressive_bonus(pending_rewards: u64, game_config: &GameConfig) -> Result<u64> {
    let mut total_bonus: u128 = 0;
    let mut remaining = pending_rewards;
    
    let tiers = [
        (game_config.accumulation_tier8_threshold, game_config.accumulation_tier8_bonus_bps),
        (game_config.accumulation_tier7_threshold, game_config.accumulation_tier7_bonus_bps),
        (game_config.accumulation_tier6_threshold, game_config.accumulation_tier6_bonus_bps),
        (game_config.accumulation_tier5_threshold, game_config.accumulation_tier5_bonus_bps),
        (game_config.accumulation_tier4_threshold, game_config.accumulation_tier4_bonus_bps),
        (game_config.accumulation_tier3_threshold, game_config.accumulation_tier3_bonus_bps),
        (game_config.accumulation_tier2_threshold, game_config.accumulation_tier2_bonus_bps),
        (game_config.accumulation_tier1_threshold, game_config.accumulation_tier1_bonus_bps),
    ];
    
    for (threshold, bonus_bps) in tiers.iter() {
        if *threshold > 0 && remaining > *threshold {
            let amount_in_tier = remaining
                .checked_sub(*threshold)
                .ok_or(ErrorCode::Overflow)?;
            
            let tier_bonus = (amount_in_tier as u128)
                .checked_mul(*bonus_bps as u128)
                .and_then(|r| r.checked_div(10000))
                .ok_or(ErrorCode::Overflow)?;
                
            total_bonus = total_bonus.checked_add(tier_bonus).ok_or(ErrorCode::Overflow)?;
            remaining = *threshold;
        }
    }
    
    u64::try_from(total_bonus).map_err(|_| ErrorCode::Overflow.into())
}

fn get_property_bit_in_set(property_id: u8, set_id: u8) -> u8 {
    match set_id {
        0 => property_id,
        1 => property_id.saturating_sub(2),
        2 => property_id.saturating_sub(5),
        3 => property_id.saturating_sub(8),
        4 => property_id.saturating_sub(11),
        5 => property_id.saturating_sub(14),
        6 => property_id.saturating_sub(17),
        7 => property_id.saturating_sub(20),
        _ => 0,
    }
}

fn get_properties_in_set(set_id: u8) -> u8 {
    match set_id {
        0 | 7 => 2,
        _ => 3,
    }
}

fn count_properties_in_set(mask: u8) -> u8 {
    mask.count_ones() as u8
}

fn is_set_complete(player: &PlayerAccount, set_id: u8) -> bool {
    let required = get_properties_in_set(set_id);
    let owned = count_properties_in_set(player.set_properties_mask[set_id as usize]);
    owned >= required
}

// ========== ACCOUNT CONTEXTS ==========

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<GameConfig>(),
        seeds = [b"game_config"],
        bump
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
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
    
    /// CHECK: Dev wallet address verified against constant
    #[account(
        constraint = dev_wallet.key() == DEV_WALLET.parse::<Pubkey>().unwrap() @ ErrorCode::InvalidDevWallet
    )]
    pub dev_wallet: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = token_mint,
        associated_token::authority = marketing_wallet,
    )]
    pub marketing_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: Marketing wallet address verified against constant
    #[account(
        constraint = marketing_wallet.key() == MARKETING_WALLET.parse::<Pubkey>().unwrap() @ ErrorCode::InvalidMarketingWallet
    )]
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
    
    #[account(
        mut,
        constraint = game_config.load()?.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [b"game_config"],
        bump = game_config.load()?.bump
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    #[account(
        init,
        payer = player,
        space = 8 + std::mem::size_of::<PlayerAccount>(),
        seeds = [b"player", player.key().as_ref()],
        bump
    )]
    pub player_account: AccountLoader<'info, PlayerAccount>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(slots: u16)]
pub struct BuyProperty<'info> {
    #[account(
        mut,
        seeds = [b"property", property.property_id.to_le_bytes().as_ref()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,
    
    #[account(
        mut,
        seeds = [b"player", player.key().as_ref()],
        bump = player_account.load()?.bump
    )]
    pub player_account: AccountLoader<'info, PlayerAccount>,
    
    #[account(
        mut,
        constraint = player_token_account.owner == player.key() @ ErrorCode::InvalidTokenAccountOwner,
        constraint = player_token_account.mint == game_config.load()?.token_mint @ ErrorCode::InvalidTokenMint
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"reward_pool_vault", game_config.key().as_ref()],
        bump = game_config.load()?.reward_pool_vault_bump
    )]
    pub reward_pool_vault: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = dev_token_account.key() == get_ata(game_config.load()?.dev_wallet, game_config.load()?.token_mint) @ ErrorCode::InvalidDevTokenAccount
    )]
    pub dev_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = marketing_token_account.key() == get_ata(game_config.load()?.marketing_wallet, game_config.load()?.token_mint) @ ErrorCode::InvalidMarketingTokenAccount
    )]
    pub marketing_token_account: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [b"game_config"],
        bump = game_config.load()?.bump
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ActivateShield<'info> {
    #[account(
        seeds = [b"property", property.property_id.to_le_bytes().as_ref()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,
    
    #[account(
        mut,
        seeds = [b"player", player.key().as_ref()],
        bump = player_account.load()?.bump
    )]
    pub player_account: AccountLoader<'info, PlayerAccount>,
    
    #[account(
        mut,
        constraint = player_token_account.owner == player.key() @ ErrorCode::InvalidTokenAccountOwner,
        constraint = player_token_account.mint == game_config.load()?.token_mint @ ErrorCode::InvalidTokenMint
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"reward_pool_vault", game_config.key().as_ref()],
        bump = game_config.load()?.reward_pool_vault_bump
    )]
    pub reward_pool_vault: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = dev_token_account.key() == get_ata(game_config.load()?.dev_wallet, game_config.load()?.token_mint) @ ErrorCode::InvalidDevTokenAccount
    )]
    pub dev_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = marketing_token_account.key() == get_ata(game_config.load()?.marketing_wallet, game_config.load()?.token_mint) @ ErrorCode::InvalidMarketingTokenAccount
    )]
    pub marketing_token_account: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [b"game_config"],
        bump = game_config.load()?.bump
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct StealPropertyInstant<'info> {
    #[account(
        seeds = [b"property", property.property_id.to_le_bytes().as_ref()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,
    
    #[account(
        mut,
        seeds = [b"player", attacker.key().as_ref()],
        bump = player_account.load()?.bump
    )]
    pub player_account: AccountLoader<'info, PlayerAccount>,
    
    #[account(
        mut,
        constraint = player_token_account.owner == attacker.key() @ ErrorCode::InvalidTokenAccountOwner,
        constraint = player_token_account.mint == game_config.load()?.token_mint @ ErrorCode::InvalidTokenMint
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"reward_pool_vault", game_config.key().as_ref()],
        bump = game_config.load()?.reward_pool_vault_bump
    )]
    pub reward_pool_vault: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = dev_token_account.key() == get_ata(game_config.load()?.dev_wallet, game_config.load()?.token_mint) @ ErrorCode::InvalidDevTokenAccount
    )]
    pub dev_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = marketing_token_account.key() == get_ata(game_config.load()?.marketing_wallet, game_config.load()?.token_mint) @ ErrorCode::InvalidMarketingTokenAccount
    )]
    pub marketing_token_account: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [b"game_config"],
        bump = game_config.load()?.bump
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    /// CHECK: Slot hashes sysvar for entropy
    #[account(address = anchor_lang::solana_program::sysvar::slot_hashes::ID)]
    pub slot_hashes: AccountInfo<'info>,
    
    #[account(mut)]
    pub attacker: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(
        mut,
        seeds = [b"player", player.key().as_ref()],
        bump = player_account.load()?.bump
    )]
    pub player_account: AccountLoader<'info, PlayerAccount>,
    
    #[account(
        mut,
        constraint = player_token_account.owner == player.key() @ ErrorCode::InvalidTokenAccountOwner,
        constraint = player_token_account.mint == game_config.load()?.token_mint @ ErrorCode::InvalidTokenMint
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"reward_pool_vault", game_config.key().as_ref()],
        bump = game_config.load()?.reward_pool_vault_bump
    )]
    pub reward_pool_vault: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [b"game_config"],
        bump = game_config.load()?.bump
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SellProperty<'info> {
    #[account(
        mut,
        seeds = [b"property", property.property_id.to_le_bytes().as_ref()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,
    
    #[account(
        mut,
        seeds = [b"player", player.key().as_ref()],
        bump = player_account.load()?.bump
    )]
    pub player_account: AccountLoader<'info, PlayerAccount>,
    
    #[account(
        mut,
        constraint = player_token_account.owner == player.key() @ ErrorCode::InvalidTokenAccountOwner,
        constraint = player_token_account.mint == game_config.load()?.token_mint @ ErrorCode::InvalidTokenMint
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"reward_pool_vault", game_config.key().as_ref()],
        bump = game_config.load()?.reward_pool_vault_bump
    )]
    pub reward_pool_vault: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [b"game_config"],
        bump = game_config.load()?.bump
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(property_id: u8)]
pub struct AdminUpdateProperty<'info> {
    #[account(
        mut,
        seeds = [b"property", property_id.to_le_bytes().as_ref()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,
    
    #[account(
        seeds = [b"game_config"],
        bump = game_config.load()?.bump,
        constraint = game_config.load()?.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminUpdateGame<'info> {
    #[account(
        mut,
        seeds = [b"game_config"],
        bump = game_config.load()?.bump,
        constraint = game_config.load()?.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClosePlayerAccount<'info> {
    #[account(
        mut,
        close = rent_receiver,
        seeds = [b"player", player.key().as_ref()],
        bump = player_account.load()?.bump
    )]
    pub player_account: AccountLoader<'info, PlayerAccount>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    /// CHECK: Receives the rent refund
    #[account(mut)]
    pub rent_receiver: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct AdminClosePlayerAccount<'info> {
    /// CHECK: Force closing account - verified by owner check
    #[account(mut)]
    pub player_account: AccountInfo<'info>,
    
    #[account(
        seeds = [b"game_config"],
        bump = game_config.load()?.bump,
        constraint = game_config.load()?.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: Receives the rent refund
    #[account(mut)]
    pub rent_receiver: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(target_player: Pubkey)]
pub struct AdminGrantProperty<'info> {
    #[account(
        mut,
        seeds = [b"property", property.property_id.to_le_bytes().as_ref()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,
    
    #[account(
        mut,
        seeds = [b"player", target_player.as_ref()],
        bump = player_account.load()?.bump
    )]
    pub player_account: AccountLoader<'info, PlayerAccount>,
    
    #[account(
        seeds = [b"game_config"],
        bump = game_config.load()?.bump,
        constraint = game_config.load()?.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(slots: u16)]
pub struct AdminRevokeProperty<'info> {
    #[account(
        mut,
        seeds = [b"property", property.property_id.to_le_bytes().as_ref()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,
    
    #[account(mut)]
    pub player_account: AccountLoader<'info, PlayerAccount>,
    
    #[account(
        seeds = [b"game_config"],
        bump = game_config.load()?.bump,
        constraint = game_config.load()?.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminClearCooldown<'info> {
    #[account(mut)]
    pub player_account: AccountLoader<'info, PlayerAccount>,
    
    #[account(
        seeds = [b"game_config"],
        bump = game_config.load()?.bump,
        constraint = game_config.load()?.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminClearStealCooldown<'info> {
    #[account(mut)]
    pub player_account: AccountLoader<'info, PlayerAccount>,
    
    #[account(
        seeds = [b"game_config"],
        bump = game_config.load()?.bump,
        constraint = game_config.load()?.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminGrantShield<'info> {
    #[account(mut)]
    pub player_account: AccountLoader<'info, PlayerAccount>,
    
    #[account(
        seeds = [b"game_config"],
        bump = game_config.load()?.bump,
        constraint = game_config.load()?.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminEmergencyWithdraw<'info> {
    #[account(
        mut,
        seeds = [b"reward_pool_vault", game_config.key().as_ref()],
        bump = game_config.load()?.reward_pool_vault_bump
    )]
    pub reward_pool_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub destination_account: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [b"game_config"],
        bump = game_config.load()?.bump,
        constraint = game_config.load()?.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AdminTransferAuthority<'info> {
    #[account(
        mut,
        seeds = [b"game_config"],
        bump = game_config.load()?.bump,
        constraint = game_config.load()?.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub game_config: AccountLoader<'info, GameConfig>,
    
    pub authority: Signer<'info>,
}

// ========== HELPER FUNCTION FOR ATA DERIVATION ==========

fn get_ata(wallet: Pubkey, mint: Pubkey) -> Pubkey {
    anchor_spl::associated_token::get_associated_token_address(&wallet, &mint)
}

// ========== STATE ACCOUNTS ==========

#[account(zero_copy)]
#[repr(C)]
pub struct GameConfig {
    pub authority: Pubkey,
    pub dev_wallet: Pubkey,
    pub marketing_wallet: Pubkey,
    pub token_mint: Pubkey,
    pub reward_pool_vault: Pubkey,
    
    pub accumulation_tier1_threshold: u64,
    pub accumulation_tier2_threshold: u64,
    pub accumulation_tier3_threshold: u64,
    pub accumulation_tier4_threshold: u64,
    pub accumulation_tier5_threshold: u64,
    pub accumulation_tier6_threshold: u64,
    pub accumulation_tier7_threshold: u64,
    pub accumulation_tier8_threshold: u64,
    
    pub set_bonus_bps: [u16; 8],
    
    pub steal_chance_bps: u16,
    pub steal_cost_percent_bps: u16,
    pub accumulation_tier1_bonus_bps: u16,
    pub accumulation_tier2_bonus_bps: u16,
    pub accumulation_tier3_bonus_bps: u16,
    pub accumulation_tier4_bonus_bps: u16,
    pub accumulation_tier5_bonus_bps: u16,
    pub accumulation_tier6_bonus_bps: u16,
    pub accumulation_tier7_bonus_bps: u16,
    pub accumulation_tier8_bonus_bps: u16,
    
    pub game_paused: u8,
    pub bump: u8,
    pub reward_pool_vault_bump: u8,
    pub _padding: [u8; 9],
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
    
    pub padding: [u8; 64],
}

impl Property {
    pub const SIZE: usize = 29 + 64;
}

#[account(zero_copy)]
#[repr(C)]
pub struct PlayerAccount {
    pub owner: Pubkey,
    
    pub total_base_daily_income: u64,
    pub last_accumulation_timestamp: i64,
    pub total_rewards_claimed: u64,
    pub pending_rewards: u64,
    
    pub total_steals_attempted: u32,
    pub total_steals_successful: u32,
    
    pub total_slots_owned: u16,
    
    pub complete_sets_owned: u8,
    pub properties_owned_count: u8,
    pub bump: u8,
    pub _padding1: [u8; 3],
    
    pub property_purchase_timestamp: [i64; MAX_PROPERTIES],
    pub property_shield_expiry: [i64; MAX_PROPERTIES],
    pub property_shield_cooldown: [i64; MAX_PROPERTIES],
    pub property_steal_protection_expiry: [i64; MAX_PROPERTIES],
    pub set_cooldown_timestamp: [i64; MAX_SETS],
    pub set_cooldown_duration: [i64; MAX_SETS],
    pub steal_cooldown_timestamp: [i64; MAX_PROPERTIES],
    
    pub property_slots: [u16; MAX_PROPERTIES],
    pub property_shielded: [u16; MAX_PROPERTIES],
    
    pub set_last_purchased_property: [u8; MAX_SETS],
    pub set_properties_mask: [u8; MAX_SETS],
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
pub struct StealSuccessEvent {
    pub attacker: Pubkey,
    pub target: Pubkey,
    pub property_id: u8,
    pub steal_cost: u64,
    pub vrf_result: u64,
}

#[event]
pub struct StealFailedEvent {
    pub attacker: Pubkey,
    pub target: Pubkey,
    pub property_id: u8,
    pub steal_cost: u64,
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
    #[msg("Target does not own this property")]
    TargetDoesNotOwnProperty,
    #[msg("No eligible targets found")]
    NoEligibleTargets,
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
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Insufficient reward pool balance")]
    InsufficientRewardPool,
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
    #[msg("Invalid yield percentage (must be <= 100%)")]
    InvalidYield,
    #[msg("Invalid shield cost percentage")]
    InvalidShieldCost,
    #[msg("Invalid cooldown duration")]
    InvalidCooldown,
    #[msg("Invalid steal cost")]
    InvalidStealCost,
    #[msg("Invalid bonus percentage (max 50%)")]
    InvalidBonus,
    #[msg("Invalid dev wallet address")]
    InvalidDevWallet,
    #[msg("Invalid marketing wallet address")]
    InvalidMarketingWallet,
    #[msg("Invalid token account owner")]
    InvalidTokenAccountOwner,
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    #[msg("Invalid dev token account")]
    InvalidDevTokenAccount,
    #[msg("Invalid marketing token account")]
    InvalidMarketingTokenAccount,
}