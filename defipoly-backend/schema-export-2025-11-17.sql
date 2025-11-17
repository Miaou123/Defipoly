-- DEFIPOLY DATABASE SCHEMA
-- Exported: 2025-11-17T19:06:07.014Z
-- Tables: 16

CREATE INDEX idx_actions_player_time ON game_actions(player_address, block_time DESC);

CREATE INDEX idx_actions_player_type_property ON game_actions(player_address, action_type, property_id);

CREATE INDEX idx_actions_property_time ON game_actions(property_id, block_time DESC);

CREATE INDEX idx_actions_type_time ON game_actions(action_type, block_time DESC);

CREATE INDEX idx_ownership_property ON property_ownership(property_id);

CREATE INDEX idx_ownership_wallet ON property_ownership(wallet_address);

CREATE INDEX idx_set_cooldowns_wallet_set ON player_set_cooldowns(wallet_address, set_id);

CREATE INDEX idx_steal_cooldowns_wallet_property ON player_steal_cooldowns(wallet_address, property_id);

CREATE TABLE game_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tx_signature TEXT UNIQUE NOT NULL,
        action_type TEXT NOT NULL,
        player_address TEXT NOT NULL,
        property_id INTEGER,
        target_address TEXT,
        amount INTEGER,
        slots INTEGER,
        success BOOLEAN,
        metadata TEXT,
        block_time INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

CREATE TABLE player_set_cooldowns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_address TEXT NOT NULL,
        set_id INTEGER NOT NULL,
        last_purchase_timestamp INTEGER NOT NULL,
        cooldown_duration INTEGER NOT NULL,
        last_purchased_property_id INTEGER,
        properties_owned_in_set TEXT,
        properties_count INTEGER DEFAULT 0,
        last_synced INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(wallet_address, set_id)
      );

CREATE TABLE player_stats (
        wallet_address TEXT PRIMARY KEY,
        total_actions INTEGER DEFAULT 0,
        properties_bought INTEGER DEFAULT 0,
        properties_sold INTEGER DEFAULT 0,
        successful_steals INTEGER DEFAULT 0,
        failed_steals INTEGER DEFAULT 0,
        rewards_claimed INTEGER DEFAULT 0,
        shields_activated INTEGER DEFAULT 0,
        total_spent INTEGER DEFAULT 0,
        total_earned INTEGER DEFAULT 0,
        total_slots_owned INTEGER DEFAULT 0,
        daily_income INTEGER DEFAULT 0,
        leaderboard_score INTEGER DEFAULT 0,
        roi_ratio REAL DEFAULT 0,
        steal_win_rate REAL DEFAULT 0,
        defense_rating REAL DEFAULT 0,
        complete_sets INTEGER DEFAULT 0,
        times_stolen INTEGER DEFAULT 0,
        last_action_time INTEGER,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      , last_claim_timestamp INTEGER DEFAULT 0, total_slots_purchased INTEGER DEFAULT 0);

CREATE TABLE player_steal_cooldowns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_address TEXT NOT NULL,
        property_id INTEGER NOT NULL,
        last_steal_attempt_timestamp INTEGER NOT NULL,
        cooldown_duration INTEGER NOT NULL,
        last_synced INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(wallet_address, property_id)
      );

CREATE TABLE profiles (
        wallet_address TEXT PRIMARY KEY,
        username TEXT,
        profile_picture TEXT,
        board_theme TEXT DEFAULT 'dark',
        property_card_theme TEXT DEFAULT 'dark',
        custom_board_background TEXT,
        custom_property_card_background TEXT,
        corner_square_style TEXT DEFAULT 'property',
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

CREATE TABLE properties_state (
        property_id INTEGER PRIMARY KEY,
        available_slots INTEGER NOT NULL,
        max_slots_per_property INTEGER NOT NULL,
        last_synced INTEGER DEFAULT (strftime('%s', 'now'))
      );

CREATE TABLE property_ownership (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_address TEXT NOT NULL,
        property_id INTEGER NOT NULL,
        slots_owned INTEGER DEFAULT 0,
        slots_shielded INTEGER DEFAULT 0,
        shield_expiry INTEGER DEFAULT 0,
        purchase_timestamp INTEGER DEFAULT 0,
        shield_cooldown_duration INTEGER DEFAULT 0,
        steal_protection_expiry INTEGER DEFAULT 0,
        bump INTEGER DEFAULT 0,
        last_updated INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(wallet_address, property_id)
      );

CREATE TABLE sqlite_sequence(name,seq);

