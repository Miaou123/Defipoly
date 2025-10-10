// Defipoly Solana Program - Anchor 0.31.1
// Complete implementation with token integration, no jail system

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("H1zzYzWPReWJ4W2JNiBrYbsrHDxFDGJ9n9jAyYG2VhLQ");

#[program]
pub mod defipoly_program {
    use super::*;

    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        initial_reward_pool_amount: u64,
    ) -> Result<()> {
        let game_config = &mut ctx.accounts.game_config;
        game_config.authority = ctx.accounts.authority.key();
        game_config.token_mint = ctx.accounts.token_mint.key();
        game_config.reward_pool_vault = ctx.accounts.reward_pool_vault.key();
        game_config.total_supply = 1_000_000_000;
        game_config.reward_pool_initial = initial_reward_pool_amount;
        game_config.bump = ctx.bumps.game_config;
        game_config.reward_pool_vault_bump = ctx.bumps.reward_pool_vault;
        
        msg!("Game initialized with reward pool vault: {}", game_config.reward_pool_vault);
        Ok(())
    }

    pub fn initialize_property(
        ctx: Context<InitializeProperty>,
        property_id: u8,
        tier: PropertyTier,
        count: u8,
        max_slots_per_property: u16,
        price: u64,
        daily_income: u64,
        shield_cost_percent: u16,
    ) -> Result<()> {
        let property = &mut ctx.accounts.property;
        property.property_id = property_id;
        property.tier = tier.clone();
        property.count = count;
        property.max_slots_per_property = max_slots_per_property;
        property.total_slots = count as u16 * max_slots_per_property;
        property.available_slots = property.total_slots;
        property.price = price;
        property.daily_income = daily_income;
        property.shield_cost_percent = shield_cost_percent;
        property.family_bonus_multiplier = match tier {
            PropertyTier::Bronze => 200,
            PropertyTier::Silver => 250,
            PropertyTier::Gold => 300,
            PropertyTier::Platinum => 400,
        };
        property.bump = ctx.bumps.property;
        
        msg!("Property {} initialized: {:?}", property_id, tier);
        Ok(())
    }

    pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player_account;
        player.owner = ctx.accounts.player.key();
        player.total_properties_owned = 0;
        player.total_daily_income = 0;
        player.last_claim_timestamp = Clock::get()?.unix_timestamp;
        player.bump = ctx.bumps.player_account;
        
        msg!("Player initialized: {}", player.owner);
        Ok(())
    }

    pub fn buy_property(ctx: Context<BuyProperty>) -> Result<()> {
        let property = &mut ctx.accounts.property;
        let player = &mut ctx.accounts.player_account;
        let ownership = &mut ctx.accounts.ownership;

        require!(property.available_slots > 0, ErrorCode::NoSlotsAvailable);

        let price = property.price;

        // Transfer tokens from player to reward pool
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.reward_pool_vault.to_account_info(),
                authority: ctx.accounts.player.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, price)?;

        // Update property
        property.available_slots -= 1;

        // Update or create ownership
        if ownership.slots_owned == 0 {
            ownership.player = player.owner;
            ownership.property_id = property.property_id;
            ownership.slots_owned = 1;
            ownership.shield_active = false;
            ownership.shield_expiry = 0;
            ownership.shield_cycles_queued = 0;
            ownership.last_claim_timestamp = Clock::get()?.unix_timestamp;
            ownership.bump = ctx.bumps.ownership;
        } else {
            ownership.slots_owned += 1;
        }

        // Update player stats
        player.total_properties_owned += 1;
        player.total_daily_income += property.daily_income;

        emit!(PropertyBoughtEvent {
            player: player.owner,
            property_id: property.property_id,
            price,
            slots_owned: ownership.slots_owned,
        });

        msg!("Property {} bought by {}", property.property_id, player.owner);
        Ok(())
    }

    pub fn activate_shield(
        ctx: Context<ActivateShield>,
        cycles: u8,
    ) -> Result<()> {
        let property = &ctx.accounts.property;
        let ownership = &mut ctx.accounts.ownership;
    
        require!(ownership.slots_owned > 0, ErrorCode::DoesNotOwnProperty);
        require!(cycles >= 1 && cycles <= 3, ErrorCode::InvalidShieldCycles);
    
        // ✅ CORRECT: Calculate cost per slot, then multiply by slots owned
        let base_cost_per_slot = (property.daily_income * property.shield_cost_percent as u64) / 10000;
        let multipliers = [100, 190, 270];
        let cost_for_one_slot = (base_cost_per_slot * multipliers[cycles as usize - 1] as u64) / 100;
        
        // Shield costs scale with number of slots owned
        let total_cost = cost_for_one_slot * ownership.slots_owned as u64;
    
        // Transfer tokens from player to reward pool
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.reward_pool_vault.to_account_info(),
                authority: ctx.accounts.player.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, total_cost)?;
    
        // Set shield
        let clock = Clock::get()?;
        let shield_duration = 48 * 3600; // 48 hours
    
        ownership.shield_active = true;
        ownership.shield_expiry = clock.unix_timestamp + shield_duration;
        ownership.shield_cycles_queued = cycles - 1;
    
        emit!(ShieldActivatedEvent {
            player: ownership.player,
            property_id: property.property_id,
            cost: total_cost,
            expiry: ownership.shield_expiry,
            cycles,
        });
    
        msg!("Shield activated for {} slot(s) of property {} by {}", 
             ownership.slots_owned, property.property_id, ownership.player);
        Ok(())
    }

    pub fn steal_property(
        ctx: Context<StealProperty>,
        target_player: Pubkey,
    ) -> Result<()> {
        let property = &ctx.accounts.property;
        let player = &mut ctx.accounts.player_account;
        let target_ownership = &ctx.accounts.target_ownership;
        let attacker_ownership = &mut ctx.accounts.attacker_ownership;

        require!(target_ownership.slots_owned > 0, ErrorCode::TargetDoesNotOwnProperty);
        require!(!target_ownership.shield_active, ErrorCode::PropertyIsShielded);

        let steal_cost = property.price / 2;

        // Transfer steal cost from player to reward pool
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.reward_pool_vault.to_account_info(),
                authority: ctx.accounts.attacker.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, steal_cost)?;

        // 33% success rate (pseudo-random using clock)
        let clock = Clock::get()?;
        let random_seed = clock.unix_timestamp as u64 + clock.slot;
        let success = (random_seed % 100) < 33;

        if success {
            // Transfer ownership
            if attacker_ownership.slots_owned == 0 {
                attacker_ownership.player = player.owner;
                attacker_ownership.property_id = property.property_id;
                attacker_ownership.slots_owned = 1;
                attacker_ownership.shield_active = false;
                attacker_ownership.last_claim_timestamp = clock.unix_timestamp;
                attacker_ownership.bump = ctx.bumps.attacker_ownership;
            } else {
                attacker_ownership.slots_owned += 1;
            }

            player.total_properties_owned += 1;
            player.total_daily_income += property.daily_income;

            emit!(StealSuccessEvent {
                attacker: player.owner,
                target: target_player,
                property_id: property.property_id,
                steal_cost,
            });

            msg!("Steal SUCCESS: {} stole property {} from {}", player.owner, property.property_id, target_player);
        } else {
            emit!(StealFailedEvent {
                attacker: player.owner,
                target: target_player,
                property_id: property.property_id,
                steal_cost,
            });

            msg!("Steal FAILED: {} failed to steal property {} from {}", player.owner, property.property_id, target_player);
        }

        Ok(())
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let player = &mut ctx.accounts.player_account;
        let game_config = &ctx.accounts.game_config;
        let clock = Clock::get()?;

        let time_elapsed = clock.unix_timestamp - player.last_claim_timestamp;
        let hours_elapsed = time_elapsed / 3600;

        // Calculate rewards
        let rewards = (player.total_daily_income / 24) * hours_elapsed as u64;

        require!(rewards > 0, ErrorCode::NoRewardsToClaim);

        // Transfer from reward pool to player using PDA signing
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
        token::transfer(transfer_ctx, rewards)?;

        player.last_claim_timestamp = clock.unix_timestamp;

        emit!(RewardsClaimedEvent {
            player: player.owner,
            amount: rewards,
            hours_elapsed: hours_elapsed as u64,
        });

        msg!("Rewards claimed: {} received {} tokens", player.owner, rewards);
        Ok(())
    }

    pub fn sell_property(
        ctx: Context<SellProperty>,
        slots: u16,
    ) -> Result<()> {
        let property = &mut ctx.accounts.property;
        let ownership = &mut ctx.accounts.ownership;
        let player = &mut ctx.accounts.player_account;
        let game_config = &ctx.accounts.game_config;

        require!(ownership.slots_owned >= slots, ErrorCode::InsufficientSlots);

        let total_value = property.price * slots as u64;
        let player_receives = total_value / 4; // 25%

        // Transfer 25% from reward pool to player using PDA signing
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

        // Update ownership
        ownership.slots_owned -= slots;
        if ownership.slots_owned == 0 {
            ownership.shield_active = false;
        }

        // Update property
        property.available_slots += slots;

        // Update player stats
        player.total_properties_owned -= slots;
        player.total_daily_income -= property.daily_income * slots as u64;

        emit!(PropertySoldEvent {
            player: player.owner,
            property_id: property.property_id,
            slots,
            received: player_receives,
            burned: total_value - player_receives,
        });

        msg!("Property {} sold: {} slots for {} tokens", property.property_id, slots, player_receives);
        Ok(())
    }
}

// ========== ACCOUNTS ==========

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
    
    pub game_config: Account<'info, GameConfig>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(target_player: Pubkey)]
pub struct StealProperty<'info> {
    pub property: Account<'info, Property>,
    
    #[account(
        constraint = target_ownership.player == target_player
    )]
    pub target_ownership: Account<'info, PropertyOwnership>,
    
    #[account(
        init_if_needed,
        payer = attacker,
        space = 8 + PropertyOwnership::SIZE,
        seeds = [b"ownership", attacker.key().as_ref(), property.property_id.to_le_bytes().as_ref()],
        bump
    )]
    pub attacker_ownership: Account<'info, PropertyOwnership>,
    
    #[account(mut)]
    pub player_account: Account<'info, PlayerAccount>,
    
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub reward_pool_vault: Account<'info, TokenAccount>,
    
    pub game_config: Account<'info, GameConfig>,
    
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

// ========== STATE ACCOUNTS ==========

#[account]
pub struct GameConfig {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub reward_pool_vault: Pubkey,
    pub total_supply: u64,
    pub reward_pool_initial: u64,
    pub bump: u8,
    pub reward_pool_vault_bump: u8,
}

impl GameConfig {
    pub const SIZE: usize = 32 + 32 + 32 + 8 + 8 + 1 + 1;
}

#[account]
pub struct Property {
    pub property_id: u8,
    pub tier: PropertyTier,
    pub count: u8,
    pub max_slots_per_property: u16,
    pub total_slots: u16,
    pub available_slots: u16,
    pub price: u64,
    pub daily_income: u64,
    pub shield_cost_percent: u16,
    pub family_bonus_multiplier: u16,
    pub bump: u8,
}

impl Property {
    pub const SIZE: usize = 1 + 1 + 1 + 2 + 2 + 2 + 8 + 8 + 2 + 2 + 1;
}

#[account]
pub struct PlayerAccount {
    pub owner: Pubkey,
    pub total_properties_owned: u16,
    pub total_daily_income: u64,
    pub last_claim_timestamp: i64,
    pub bump: u8,
}

impl PlayerAccount {
    pub const SIZE: usize = 32 + 2 + 8 + 8 + 1;
}

#[account]
pub struct PropertyOwnership {
    pub player: Pubkey,
    pub property_id: u8,
    pub slots_owned: u16,
    pub shield_active: bool,
    pub shield_expiry: i64,
    pub shield_cycles_queued: u8,
    pub last_claim_timestamp: i64,
    pub bump: u8,
}

impl PropertyOwnership {
    pub const SIZE: usize = 32 + 1 + 2 + 1 + 8 + 1 + 8 + 1;
}

// ========== ENUMS ==========

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum PropertyTier {
    Bronze,
    Silver,
    Gold,
    Platinum,
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
    pub cost: u64,
    pub expiry: i64,
    pub cycles: u8,
}

#[event]
pub struct StealSuccessEvent {
    pub attacker: Pubkey,
    pub target: Pubkey,
    pub property_id: u8,
    pub steal_cost: u64,
}

#[event]
pub struct StealFailedEvent {
    pub attacker: Pubkey,
    pub target: Pubkey,
    pub property_id: u8,
    pub steal_cost: u64,
}

#[event]
pub struct RewardsClaimedEvent {
    pub player: Pubkey,
    pub amount: u64,
    pub hours_elapsed: u64,
}

#[event]
pub struct PropertySoldEvent {
    pub player: Pubkey,
    pub property_id: u8,
    pub slots: u16,
    pub received: u64,
    pub burned: u64,
}

// ========== ERRORS ==========

#[error_code]
pub enum ErrorCode {
    #[msg("No available slots for this property")]
    NoSlotsAvailable,
    #[msg("Player does not own this property")]
    DoesNotOwnProperty,
    #[msg("Invalid shield cycles (must be 1-3)")]
    InvalidShieldCycles,
    #[msg("Target does not own this property")]
    TargetDoesNotOwnProperty,
    #[msg("Property is shielded and cannot be stolen")]
    PropertyIsShielded,
    #[msg("Insufficient slots to sell")]
    InsufficientSlots,
    #[msg("No rewards to claim")]
    NoRewardsToClaim,
}