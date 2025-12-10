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
    const totalTables = 8;
    let hasError = false;

    const checkCompletion = () => {
      completed++;
      if (completed === totalTables && !hasError) {
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
        custom_scene_background TEXT,
        theme_category TEXT,
        writing_style TEXT DEFAULT 'light',
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

    // Property ownership table
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

    // Player stats table - ✅ WITH total_slots_purchased
    db.run(`
      CREATE TABLE IF NOT EXISTS player_stats (
        wallet_address TEXT PRIMARY KEY,
        total_actions INTEGER DEFAULT 0,
        properties_bought INTEGER DEFAULT 0,
        properties_sold INTEGER DEFAULT 0,
        total_slots_purchased INTEGER DEFAULT 0,
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

    // Player Set Cooldowns table
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

    // Player Steal Cooldowns table
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

    // Properties State table
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

    // Processed Transactions table - tracks ALL processed transactions
    db.run(`
      CREATE TABLE IF NOT EXISTS processed_transactions (
        tx_signature TEXT PRIMARY KEY,
        block_time INTEGER NOT NULL,
        event_count INTEGER DEFAULT 0,
        action_count INTEGER DEFAULT 0,
        transaction_type TEXT,
        processed_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `, (err) => {
      if (err) {
        console.error('Error creating processed_transactions table:', err);
        hasError = true;
        return reject(err);
      }
      console.log('✅ Processed transactions table ready');
      checkCompletion();
    });
  });
}

function createIndexes() {
  return new Promise((resolve) => {
    db.run(`CREATE INDEX IF NOT EXISTS idx_actions_player_time ON game_actions(player_address, block_time DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_actions_type_time ON game_actions(action_type, block_time DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_actions_property_time ON game_actions(property_id, block_time DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_actions_player_type_property ON game_actions(player_address, action_type, property_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ownership_wallet ON property_ownership(wallet_address)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ownership_property ON property_ownership(property_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_set_cooldowns_wallet_set ON player_set_cooldowns(wallet_address, set_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_steal_cooldowns_wallet_property ON player_steal_cooldowns(wallet_address, property_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_processed_tx_time ON processed_transactions(block_time DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_processed_tx_type ON processed_transactions(transaction_type, block_time DESC)`);

    console.log('✅ Database indexes created');
    
    // Run migrations after indexes
    runMigrations()
      .then(() => resolve())
      .catch((err) => {
        console.error('Migration error:', err);
        resolve(); // Don't fail startup on migration errors
      });
  });
}

function runMigrations() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Running database migrations...');
    
    // Migration: Add theme_category column to profiles table
    db.run(`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='profiles'
    `, (err, row) => {
      if (err) {
        console.error('Error checking profiles table:', err);
        return reject(err);
      }
      
      // Check if theme_category column exists
      db.all(`PRAGMA table_info(profiles)`, (err, columns) => {
        if (err) {
          console.error('Error getting table info:', err);
          return reject(err);
        }
        
        const hasThemeCategory = columns.some(col => col.name === 'theme_category');
        const hasWritingStyle = columns.some(col => col.name === 'writing_style');
        const hasBoardPresetId = columns.some(col => col.name === 'board_preset_id');
        const hasTilePresetId = columns.some(col => col.name === 'tile_preset_id');
        
        const migrations = [];
        
        if (!hasThemeCategory) {
          migrations.push(() => new Promise((resolve, reject) => {
            console.log('🔄 Adding theme_category column to profiles table...');
            db.run(`ALTER TABLE profiles ADD COLUMN theme_category TEXT`, (err) => {
              if (err) {
                console.error('Error adding theme_category column:', err);
                return reject(err);
              }
              console.log('✅ Added theme_category column to profiles table');
              resolve();
            });
          }));
        }
        
        if (!hasWritingStyle) {
          migrations.push(() => new Promise((resolve, reject) => {
            console.log('🔄 Adding writing_style column to profiles table...');
            db.run(`ALTER TABLE profiles ADD COLUMN writing_style TEXT DEFAULT 'light'`, (err) => {
              if (err) {
                console.error('Error adding writing_style column:', err);
                return reject(err);
              }
              console.log('✅ Added writing_style column to profiles table');
              resolve();
            });
          }));
        }
        
        if (!hasBoardPresetId) {
          migrations.push(() => new Promise((resolve, reject) => {
            console.log('🔄 Adding board_preset_id column to profiles table...');
            db.run(`ALTER TABLE profiles ADD COLUMN board_preset_id TEXT DEFAULT NULL`, (err) => {
              if (err) {
                console.error('Error adding board_preset_id column:', err);
                return reject(err);
              }
              console.log('✅ Added board_preset_id column to profiles table');
              resolve();
            });
          }));
        }
        
        if (!hasTilePresetId) {
          migrations.push(() => new Promise((resolve, reject) => {
            console.log('🔄 Adding tile_preset_id column to profiles table...');
            db.run(`ALTER TABLE profiles ADD COLUMN tile_preset_id TEXT DEFAULT NULL`, (err) => {
              if (err) {
                console.error('Error adding tile_preset_id column:', err);
                return reject(err);
              }
              console.log('✅ Added tile_preset_id column to profiles table');
              resolve();
            });
          }));
        }
        
        if (migrations.length === 0) {
          console.log('✅ All profile columns already exist');
          resolve();
        } else {
          // Run migrations sequentially
          migrations.reduce((promise, migration) => {
            return promise.then(() => migration());
          }, Promise.resolve()).then(() => {
            resolve();
          }).catch(reject);
        }
      });
    });
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