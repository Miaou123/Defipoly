const sqlite3 = require('sqlite3').verbose();

let db = null;

function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database('./defipoly.db', (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('✅ Connected to SQLite database');
        createTables()
          .then(() => resolve(db))
          .catch(reject);
      }
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    let completed = 0;
    const totalTables = 7; // Updated from 4 to 7
    let hasError = false;

    const checkCompletion = () => {
      completed++;
      if (completed === totalTables && !hasError) {
        // Create indexes and run migrations after all tables are created
        createIndexes()
          .then(() => resolve())
          .catch(reject);
      }
    };

    // Profiles table
    db.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        wallet_address TEXT PRIMARY KEY,
        username TEXT,
        profile_picture TEXT,
        board_theme TEXT DEFAULT 'dark',
        property_card_theme TEXT DEFAULT 'dark',
        custom_board_background TEXT,
        custom_property_card_background TEXT,
        corner_square_style TEXT DEFAULT 'property',
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `, (err) => {
      if (err) {
        console.error('Error creating profiles table:', err);
        hasError = true;
        return reject(err);
      }
      console.log('✅ Profiles table ready');
      checkCompletion();
    });

    // Property ownership table - NOW WITH ALL 9 FIELDS
    db.run(`
      CREATE TABLE IF NOT EXISTS property_ownership (
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
      )
    `, (err) => {
      if (err) {
        console.error('Error creating property_ownership table:', err);
        hasError = true;
        return reject(err);
      }
      console.log('✅ Property ownership table ready');
      checkCompletion();
    });

    // Game actions table
    db.run(`
      CREATE TABLE IF NOT EXISTS game_actions (
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
      )
    `, (err) => {
      if (err) {
        console.error('Error creating game_actions table:', err);
        hasError = true;
        return reject(err);
      }
      console.log('✅ Game actions table ready');
      checkCompletion();
    });

    // Player stats table
    db.run(`
      CREATE TABLE IF NOT EXISTS player_stats (
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
        last_claim_timestamp INTEGER DEFAULT 0,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `, (err) => {
      if (err) {
        console.error('Error creating player_stats table:', err);
        hasError = true;
        return reject(err);
      }
      console.log('✅ Player stats table ready');
      checkCompletion();
    });

    // Player Set Cooldowns table (NEW)
    db.run(`
      CREATE TABLE IF NOT EXISTS player_set_cooldowns (
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
      )
    `, (err) => {
      if (err) {
        console.error('Error creating player_set_cooldowns table:', err);
        hasError = true;
        return reject(err);
      }
      console.log('✅ Player set cooldowns table ready');
      checkCompletion();
    });

    // Player Steal Cooldowns table (NEW)
    db.run(`
      CREATE TABLE IF NOT EXISTS player_steal_cooldowns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_address TEXT NOT NULL,
        property_id INTEGER NOT NULL,
        last_steal_attempt_timestamp INTEGER NOT NULL,
        cooldown_duration INTEGER NOT NULL,
        last_synced INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(wallet_address, property_id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating player_steal_cooldowns table:', err);
        hasError = true;
        return reject(err);
      }
      console.log('✅ Player steal cooldowns table ready');
      checkCompletion();
    });

    // Properties State table (NEW)
    db.run(`
      CREATE TABLE IF NOT EXISTS properties_state (
        property_id INTEGER PRIMARY KEY,
        available_slots INTEGER NOT NULL,
        max_slots_per_property INTEGER NOT NULL,
        last_synced INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `, (err) => {
      if (err) {
        console.error('Error creating properties_state table:', err);
        hasError = true;
        return reject(err);
      }
      console.log('✅ Properties state table ready');
      checkCompletion();
    });
  });
}

function createIndexes() {
  return new Promise((resolve) => {
    // Existing indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_actions_player_time ON game_actions(player_address, block_time DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_actions_type_time ON game_actions(action_type, block_time DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_actions_property_time ON game_actions(property_id, block_time DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_actions_player_type_property ON game_actions(player_address, action_type, property_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ownership_wallet ON property_ownership(wallet_address)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ownership_property ON property_ownership(property_id)`);
    
    // New indexes for cooldown tables
    db.run(`CREATE INDEX IF NOT EXISTS idx_set_cooldowns_wallet_set ON player_set_cooldowns(wallet_address, set_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_steal_cooldowns_wallet_property ON player_steal_cooldowns(wallet_address, property_id)`);

    console.log('✅ Database indexes created');
    resolve();
  });
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function closeDatabase() {
  return new Promise((resolve) => {
    if (db) {
      db.close((err) => {
        if (err) console.error('Error closing database:', err);
        else console.log('✅ Database connection closed');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
};