// Memeopoly Solana Program - v7 Optimized (No External Dependencies)
// Anchor 0.31.1
// Secure commit-reveal randomness using slot hashes

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("Fx8rVmiwHiBuB28MWDAaY68PXRmZLTsXsf2SJ6694oFi");

const DEV_WALLET: &str = "CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS";
const MAX_PROPERTIES_PER_CLAIM: u8 = 22;
const MIN_CLAIM_INTERVAL_MINUTES: i64 = 5;

#[program]
pub mod memeopoly_program {
    use super::*;

    // ========== INITIALIZATION ==========

    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        initial_reward_pool_amount: u64,
    ) -> Result<()> {
        let game_config = &mut ctx.accounts.game_config;
        game_config.authority = ctx.accounts.authority.key();
        game_config.dev_wallet = DEV_WALLET.parse().unwrap();
        game_config.token_mint = ctx.accounts.token_mint.key();
        game_config.reward_pool_vault = ctx.accounts.reward_pool_vault.key();
        game_config.total_supply = 1_000_000_000;
        game_config.circulating_supply = 500_000_000;
        game_config.reward_pool_initial = initial_reward_pool_amount;
        game_config.current_phase = 1;
        game_config.game_paused = false;
        game_config.steal_chance_targeted_bps = 2500; // 25%
        game_config.steal_chance_random_bps = 3300; // 33%
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

    pub fn buy_property(ctx: Context<BuyProperty>) -> Result<()> {
        let game_config = &ctx.accounts.game_config;
        let property = &mut ctx.accounts.property;
        let player = &mut ctx.accounts.player_account;
        let ownership = &mut ctx.accounts.ownership;
        let set_cooldown = &mut ctx.accounts.set_cooldown;
        let set_ownership = &mut ctx.accounts.set_ownership;
        let set_stats = &mut ctx.accounts.set_stats;
        let clock = Clock::get()?;

        require!(!game_config.game_paused, ErrorCode::GamePaused);
        require!(property.available_slots > 0, ErrorCode::NoSlotsAvailable);
        
        let total_slots_for_this_property = ownership.slots_owned;
        require!(
            total_slots_for_this_property < property.max_per_player,
            ErrorCode::MaxSlotsReached
        );

        if set_cooldown.last_purchase_timestamp != 0 {
            let time_since_last_purchase = clock.unix_timestamp - set_cooldown.last_purchase_timestamp;
            require!(
                time_since_last_purchase >= set_cooldown.cooldown_duration,
                ErrorCode::CooldownActive
            );
        }

        let price = property.price;
        let to_reward_pool = (price * 90) / 100;
        let to_dev = price - to_reward_pool;

        let transfer_ctx_pool = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.reward_pool_vault.to_account_info(),
                authority: ctx.accounts.player.to_account_info(),
            },
        );
        token::transfer(transfer_ctx_pool, to_reward_pool)?;

        let transfer_ctx_dev = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.dev_token_account.to_account_info(),
                authority: ctx.accounts.player.to_account_info(),
            },
        );
        token::transfer(transfer_ctx_dev, to_dev)?;

        property.available_slots -= 1;

        let is_new_ownership = ownership.slots_owned == 0;
        if is_new_ownership {
            ownership.player = player.owner;
            ownership.property_id = property.property_id;
            ownership.slots_owned = 1;
            ownership.slots_shielded = 0;
            ownership.purchase_timestamp = clock.unix_timestamp;
            ownership.shield_expiry = 0;
            ownership.bump = ctx.bumps.ownership;
            player.properties_owned_count += 1;
        } else {
            ownership.slots_owned += 1;
        }

        player.total_slots_owned += 1;

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
        set_ownership.total_slots_in_set += 1;
        
        let required_properties = Property::get_properties_in_set(property.set_id);
        let was_complete = set_ownership.has_complete_set;
        set_ownership.has_complete_set = set_ownership.properties_count >= required_properties;
        
        if set_ownership.has_complete_set && !was_complete {
            player.complete_sets_owned += 1;
        }

        if set_stats.set_id == 0 && set_stats.total_slots_sold == 0 {
            set_stats.set_id = property.set_id;
            set_stats.bump = ctx.bumps.set_stats;
        }
        set_stats.total_slots_sold += 1;
        set_stats.total_revenue += price;

        set_cooldown.player = player.owner;
        set_cooldown.set_id = property.set_id;
        set_cooldown.last_purchase_timestamp = clock.unix_timestamp;
        set_cooldown.cooldown_duration = property.cooldown_seconds;
        set_cooldown.last_purchased_property_id = property.property_id;
        
        let mut already_tracked = false;
        for i in 0..set_cooldown.properties_count as usize {
            if set_cooldown.properties_owned_in_set[i] == property.property_id {
                already_tracked = true;
                break;
            }
        }
        
        if !already_tracked && set_cooldown.properties_count < 3 {
            let count = set_cooldown.properties_count as usize;
            set_cooldown.properties_owned_in_set[count] = property.property_id;
            set_cooldown.properties_count += 1;
        }
        
        if set_cooldown.bump == 0 {
            set_cooldown.bump = ctx.bumps.set_cooldown;
        }

        emit!(PropertyBoughtEvent {
            player: player.owner,
            property_id: property.property_id,
            price,
            slots_owned: ownership.slots_owned,
        });

        msg!("Property {} bought by {}", property.property_id, player.owner);
        Ok(())
    }

    // ========== SHIELD SYSTEM ==========

    pub fn activate_shield(
        ctx: Context<ActivateShield>,
        slots_to_shield: u16,
    ) -> Result<()> {
        let game_config = &ctx.accounts.game_config;
        let property = &ctx.accounts.property;
        let ownership = &mut ctx.accounts.ownership;
        let clock = Clock::get()?;

        require!(!game_config.game_paused, ErrorCode::GamePaused);
        require!(ownership.slots_owned > 0, ErrorCode::DoesNotOwnProperty);
        require!(
            slots_to_shield <= ownership.slots_owned,
            ErrorCode::InsufficientSlots
        );
        require!(slots_to_shield > 0, ErrorCode::InvalidShieldSlots);

        let daily_income_per_slot = (property.price * property.yield_percent_bps as u64) / 10000;
        let shield_cost_per_slot = (daily_income_per_slot * property.shield_cost_percent_bps as u64) / 10000;
        let total_cost = shield_cost_per_slot * slots_to_shield as u64;

        let to_reward_pool = (total_cost * 90) / 100;
        let to_dev = total_cost - to_reward_pool;

        let transfer_ctx_pool = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.reward_pool_vault.to_account_info(),
                authority: ctx.accounts.player.to_account_info(),
            },
        );
        token::transfer(transfer_ctx_pool, to_reward_pool)?;

        let transfer_ctx_dev = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.dev_token_account.to_account_info(),
                authority: ctx.accounts.player.to_account_info(),
            },
        );
        token::transfer(transfer_ctx_dev, to_dev)?;

        let shield_duration = 48 * 3600;
        ownership.slots_shielded = slots_to_shield;
        ownership.shield_expiry = clock.unix_timestamp + shield_duration;

        emit!(ShieldActivatedEvent {
            player: ownership.player,
            property_id: property.property_id,
            slots_shielded: slots_to_shield,
            cost: total_cost,
            expiry: ownership.shield_expiry,
        });

        msg!("Shield activated: {} slots of property {}", slots_to_shield, property.property_id);
        Ok(())
    }

    // ========== SECURE COMMIT-REVEAL STEAL MECHANICS ==========
    
    /// Step 1: Commit to steal with user randomness
    pub fn steal_property_request(
        ctx: Context<StealPropertyRequest>,
        target_player: Pubkey,
        is_targeted: bool,
        user_randomness: [u8; 32],
    ) -> Result<()> {
        let game_config = &ctx.accounts.game_config;
        let property = &ctx.accounts.property;
        let player = &mut ctx.accounts.player_account;
        let target_ownership = &ctx.accounts.target_ownership;
        let steal_request = &mut ctx.accounts.steal_request;
        let clock = Clock::get()?;

        require!(!game_config.game_paused, ErrorCode::GamePaused);
        require!(target_ownership.slots_owned > 0, ErrorCode::TargetDoesNotOwnProperty);
        require!(
            target_player != ctx.accounts.attacker.key(),
            ErrorCode::CannotStealFromSelf
        );

        let shielded_slots = if clock.unix_timestamp < target_ownership.shield_expiry {
            target_ownership.slots_shielded
        } else {
            0
        };
        require!(
            target_ownership.slots_owned > shielded_slots,
            ErrorCode::AllSlotsShielded
        );

        if steal_request.attacker != Pubkey::default() {
            require!(
                steal_request.can_initiate_new_steal(clock.unix_timestamp),
                ErrorCode::PendingStealExists
            );
            steal_request.attempt_number = steal_request.attempt_number.saturating_add(1);
            msg!("🔄 Reusing StealRequest account (attempt #{})", steal_request.attempt_number);
        } else {
            steal_request.attempt_number = 1;
            steal_request.bump = ctx.bumps.steal_request;
            msg!("🆕 Creating new StealRequest account");
        }

        let steal_cost = (property.price * game_config.steal_cost_percent_bps as u64) / 10000;

        let to_reward_pool = (steal_cost * 90) / 100;
        let to_dev = steal_cost - to_reward_pool;

        let transfer_ctx_pool = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.reward_pool_vault.to_account_info(),
                authority: ctx.accounts.attacker.to_account_info(),
            },
        );
        token::transfer(transfer_ctx_pool, to_reward_pool)?;

        let transfer_ctx_dev = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.dev_token_account.to_account_info(),
                authority: ctx.accounts.attacker.to_account_info(),
            },
        );
        token::transfer(transfer_ctx_dev, to_dev)?;

        steal_request.attacker = player.owner;
        steal_request.target = target_player;
        steal_request.property_id = property.property_id;
        steal_request.is_targeted = is_targeted;
        steal_request.steal_cost = steal_cost;
        steal_request.timestamp = clock.unix_timestamp;
        steal_request.request_slot = clock.slot;
        steal_request.fulfilled = false;
        steal_request.success = false;
        steal_request.vrf_result = 0;
        steal_request.user_randomness = user_randomness;

        player.total_steals_attempted += 1;

        emit!(StealRequestedEvent {
            attacker: player.owner,
            target: target_player,
            property_id: property.property_id,
            steal_cost,
            is_targeted,
            request_slot: clock.slot,
        });

        msg!("🎲 Steal committed by {} targeting {} (property {})", 
             player.owner, target_player, property.property_id);
        msg!("⏳ Wait 1 slot, then reveal for randomness...");
        
        Ok(())
    }

    /// Step 2: Reveal and execute steal with secure randomness
    pub fn steal_property_fulfill(ctx: Context<StealPropertyFulfill>) -> Result<()> {
        let game_config = &ctx.accounts.game_config;
        let steal_request = &mut ctx.accounts.steal_request;
        let clock = Clock::get()?;

        let property = &ctx.accounts.property;
        let target_ownership = &mut ctx.accounts.target_ownership;
        let attacker_ownership = &mut ctx.accounts.attacker_ownership;
        let attacker_account = &mut ctx.accounts.attacker_account;
    
        require!(!steal_request.fulfilled, ErrorCode::AlreadyFulfilled);
        require!(!game_config.game_paused, ErrorCode::GamePaused);
    
        // Must wait at least 1 slot
        require!(
            clock.slot > steal_request.request_slot,
            ErrorCode::VrfNotReady
        );
        
        // NEW: Can't wait too long (slot hash expires)
        let slots_elapsed = clock.slot - steal_request.request_slot;
        require!(
            slots_elapsed < 150,
            ErrorCode::StealRequestExpired
        );
    
        let slot_hashes = &ctx.accounts.slot_hashes;
        let slot_hashes_data = slot_hashes.data.borrow();
        
        // NEW: Verify slot hash data is available
        require!(
            slot_hashes_data.len() >= 40,
            ErrorCode::SlotHashUnavailable
        );

        let mut slot_hash_bytes = [0u8; 32];
        if slot_hashes_data.len() >= 40 {
            slot_hash_bytes.copy_from_slice(&slot_hashes_data[8..40]);
        }

        let mut combined_entropy = [0u8; 32];
        for i in 0..32 {
            combined_entropy[i] = steal_request.user_randomness[i]
                ^ slot_hash_bytes[i]
                ^ ((clock.slot >> (i % 8)) as u8)
                ^ ((clock.unix_timestamp >> (i % 8)) as u8);
        }
        
        let random_u64 = u64::from_le_bytes(combined_entropy[0..8].try_into().unwrap());

        let success_threshold = if steal_request.is_targeted {
            game_config.steal_chance_targeted_bps as u64
        } else {
            game_config.steal_chance_random_bps as u64
        };

        let success = (random_u64 % 10000) < success_threshold;

        steal_request.vrf_result = random_u64;
        steal_request.success = success;
        steal_request.fulfilled = true;

        if success {
            target_ownership.slots_owned -= 1;

            if target_ownership.slots_shielded > target_ownership.slots_owned {
                target_ownership.slots_shielded = target_ownership.slots_owned;
            }

            if attacker_ownership.slots_owned == 0 {
                attacker_ownership.player = steal_request.attacker;
                attacker_ownership.property_id = property.property_id;
                attacker_ownership.slots_owned = 1;
                attacker_ownership.slots_shielded = 0;
                attacker_ownership.purchase_timestamp = clock.unix_timestamp;
                attacker_ownership.shield_expiry = 0;
                attacker_ownership.bump = ctx.bumps.attacker_ownership;
            } else {
                attacker_ownership.slots_owned += 1;
            }

            attacker_account.total_slots_owned += 1;
            attacker_account.total_steals_successful += 1;

            emit!(StealSuccessEvent {
                attacker: steal_request.attacker,
                target: steal_request.target,
                property_id: property.property_id,
                steal_cost: steal_request.steal_cost,
                targeted: steal_request.is_targeted,
                vrf_result: random_u64,
            });

            msg!("✅ STEAL SUCCESS: {} stole 1 slot from {} (entropy: {})", 
                 steal_request.attacker, steal_request.target, random_u64);
        } else {
            emit!(StealFailedEvent {
                attacker: steal_request.attacker,
                target: steal_request.target,
                property_id: property.property_id,
                steal_cost: steal_request.steal_cost,
                targeted: steal_request.is_targeted,
                vrf_result: random_u64,
            });

            msg!("❌ STEAL FAILED: {} (entropy: {})", 
                 steal_request.attacker, random_u64);
        }

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

        let minutes_elapsed = (clock.unix_timestamp - player.last_claim_timestamp) / 60;
        require!(minutes_elapsed > 0, ErrorCode::NoRewardsToClaim);
        require!(
            minutes_elapsed >= game_config.min_claim_interval_minutes,
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
            let set_idx = ownership.set_id as usize;
            let income_per_minute = ownership.daily_income_per_slot / 1440;
            let min_slots_in_set = set_min_slots[set_idx];
            
            if min_slots_in_set != u16::MAX && min_slots_in_set > 0 {
                let bonus_slots = min_slots_in_set;
                let base_slots = ownership.slots_owned - bonus_slots;
                
                let base_rewards = base_slots as u64 * income_per_minute * minutes_elapsed as u64;
                let bonus_multiplier_bps = 10000 + game_config.set_bonus_bps;
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
            seconds_elapsed: minutes_elapsed * 60,
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

    pub fn close_steal_request(
        ctx: Context<CloseStealRequest>,
    ) -> Result<()> {
        require!(ctx.accounts.steal_request.fulfilled, ErrorCode::NotFulfilled);
        msg!("🧹 Closing fulfilled steal request");
        Ok(())
    }
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
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
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
        seeds = [b"set_stats", property.set_id.to_le_bytes().as_ref()],
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
    
    pub game_config: Account<'info, GameConfig>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct StealPropertyRequest<'info> {
    pub property: Account<'info, Property>,
    pub target_ownership: Account<'info, PropertyOwnership>,
    
    #[account(
        init_if_needed,
        payer = attacker,
        space = 8 + StealRequest::SIZE,
        seeds = [
            b"steal_request",
            attacker.key().as_ref(),
            property.property_id.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub steal_request: Account<'info, StealRequest>,
    
    #[account(mut)]
    pub player_account: Account<'info, PlayerAccount>,
    
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub reward_pool_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub dev_token_account: Account<'info, TokenAccount>,
    
    pub game_config: Account<'info, GameConfig>,
    
    #[account(mut)]
    pub attacker: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StealPropertyFulfill<'info> {
    pub property: Account<'info, Property>,
    
    #[account(mut)]
    pub steal_request: Account<'info, StealRequest>,
    
    #[account(mut)]
    pub target_ownership: Account<'info, PropertyOwnership>,
    
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + PropertyOwnership::SIZE,
        seeds = [b"ownership", steal_request.attacker.as_ref(), property.property_id.to_le_bytes().as_ref()],
        bump
    )]
    pub attacker_ownership: Account<'info, PropertyOwnership>,
    
    #[account(mut)]
    pub attacker_account: Account<'info, PlayerAccount>,
    
    pub game_config: Account<'info, GameConfig>,
    
    /// CHECK: Slot hashes sysvar for entropy
    #[account(address = anchor_lang::solana_program::sysvar::slot_hashes::ID)]
    pub slot_hashes: AccountInfo<'info>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
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
pub struct CloseStealRequest<'info> {
    #[account(
        mut,
        close = rent_receiver,
        constraint = steal_request.fulfilled @ ErrorCode::NotFulfilled
    )]
    pub steal_request: Account<'info, StealRequest>,
    
    /// CHECK: Rent receiver
    #[account(mut)]
    pub rent_receiver: AccountInfo<'info>,
}

// ========== STATE ACCOUNTS ==========

#[account]
pub struct GameConfig {
    pub authority: Pubkey,
    pub dev_wallet: Pubkey,
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
}

impl GameConfig {
    pub const SIZE: usize = 32 + 32 + 32 + 32 + 8 + 8 + 8 + 1 + 1 + 2 + 2 + 2 + 2 + 1 + 8 + 1 + 1;
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
}

impl Property {
    pub const SIZE: usize = 1 + 1 + 2 + 2 + 2 + 8 + 2 + 2 + 8 + 1;
    
    pub fn get_properties_in_set(set_id: u8) -> u8 {
        match set_id {
            0 | 7 => 2,
            _ => 3,
        }
    }
}

#[account]
pub struct PlayerAccount {
    pub owner: Pubkey,
    pub total_slots_owned: u16,
    pub last_claim_timestamp: i64,
    pub total_rewards_claimed: u64,
    pub complete_sets_owned: u8,
    pub properties_owned_count: u8,
    pub total_steals_attempted: u32,
    pub total_steals_successful: u32,
    pub bump: u8,
}

impl PlayerAccount {
    pub const SIZE: usize = 32 + 2 + 8 + 8 + 1 + 1 + 4 + 4 + 1;
}

#[account]
pub struct PropertyOwnership {
    pub player: Pubkey,
    pub property_id: u8,
    pub slots_owned: u16,
    pub slots_shielded: u16,
    pub purchase_timestamp: i64,
    pub shield_expiry: i64,
    pub bump: u8,
}

impl PropertyOwnership {
    pub const SIZE: usize = 32 + 1 + 2 + 2 + 8 + 8 + 1;
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
}

impl PlayerSetCooldown {
    pub const SIZE: usize = 32 + 1 + 8 + 8 + 1 + 3 + 1 + 1;
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
}

impl PlayerSetOwnership {
    pub const SIZE: usize = 32 + 1 + 2 + 3 + 1 + 1 + 8 + 1;
}

#[account]
pub struct SetStats {
    pub set_id: u8,
    pub total_slots_sold: u64,
    pub total_revenue: u64,
    pub unique_owners: u32,
    pub bump: u8,
}

impl SetStats {
    pub const SIZE: usize = 1 + 8 + 8 + 4 + 1;
}

#[account]
pub struct StealRequest {
    pub attacker: Pubkey,
    pub target: Pubkey,
    pub property_id: u8,
    pub is_targeted: bool,
    pub steal_cost: u64,
    pub timestamp: i64,
    pub request_slot: u64,
    pub fulfilled: bool,
    pub success: bool,
    pub vrf_result: u64,
    pub attempt_number: u32,
    pub user_randomness: [u8; 32],
    pub bump: u8,
}

impl StealRequest {
    pub const SIZE: usize = 32 + 32 + 1 + 1 + 8 + 8 + 8 + 1 + 1 + 8 + 4 + 32 + 1;
    
    pub fn can_initiate_new_steal(&self, current_time: i64) -> bool {
        self.fulfilled || (current_time - self.timestamp) > 300
    }
}

// ========== EVENTS ==========

#[event]
pub struct PropertyBoughtEvent {
    pub player: Pubkey,
    pub property_id: u8,
    pub price: u64,
    pub slots_owned: u16,
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
pub struct StealRequestedEvent {
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

// ========== ERRORS ==========

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid property ID (must be 0-21)")]
    InvalidPropertyId,
    #[msg("Invalid set ID (must be 0-7)")]
    InvalidSetId,
    #[msg("No available slots for this property")]
    NoSlotsAvailable,
    #[msg("Maximum slots per player reached")]
    MaxSlotsReached,
    #[msg("Cooldown still active - cannot purchase yet")]
    CooldownActive,
    #[msg("Player does not own this property")]
    DoesNotOwnProperty,
    #[msg("Invalid number of slots to shield")]
    InvalidShieldSlots,
    #[msg("Target does not own this property")]
    TargetDoesNotOwnProperty,
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
    #[msg("Claim too soon - wait at least 5 minutes")]
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
    #[msg("Slot hash unavailable - try again")]
    SlotHashUnavailable,
}