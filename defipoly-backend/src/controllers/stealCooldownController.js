const { getDatabase } = require('../config/database');

/**
 * Get steal cooldown status for a specific property
 * Now uses player_steal_cooldowns table
 */
const getStealCooldownStatus = (req, res) => {
  const { wallet, propertyId } = req.params;
  const db = getDatabase();

  db.get(
    `SELECT 
      property_id,
      last_steal_attempt_timestamp,
      cooldown_duration,
      last_synced
     FROM player_steal_cooldowns 
     WHERE wallet_address = ? AND property_id = ?`,
    [wallet, parseInt(propertyId)],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const currentTime = Math.floor(Date.now() / 1000);

      if (!row) {
        // No cooldown record = not on cooldown
        return res.json({
          propertyId: parseInt(propertyId),
          isOnCooldown: false,
          lastStealAttemptTimestamp: 0,
          cooldownDuration: 0,
          cooldownRemaining: 0
        });
      }

      const cooldownRemaining = Math.max(0, 
        (row.last_steal_attempt_timestamp + row.cooldown_duration) - currentTime
      );

      res.json({
        propertyId: row.property_id,
        isOnCooldown: cooldownRemaining > 0,
        lastStealAttemptTimestamp: row.last_steal_attempt_timestamp,
        cooldownDuration: row.cooldown_duration,
        cooldownRemaining,
        lastSynced: row.last_synced
      });
    }
  );
};

/**
 * Get all steal cooldowns for a wallet
 * Returns cooldowns for all properties the player has attempted to steal
 */
const getAllPlayerStealCooldowns = (req, res) => {
  const { wallet } = req.params;
  const db = getDatabase();

  db.all(
    `SELECT 
      property_id,
      last_steal_attempt_timestamp,
      cooldown_duration,
      last_synced
     FROM player_steal_cooldowns 
     WHERE wallet_address = ?
     ORDER BY property_id ASC`,
    [wallet],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const currentTime = Math.floor(Date.now() / 1000);

      const cooldowns = {};

      rows.forEach(row => {
        const cooldownRemaining = Math.max(0, 
          (row.last_steal_attempt_timestamp + row.cooldown_duration) - currentTime
        );

        cooldowns[row.property_id] = {
          propertyId: row.property_id,
          isOnCooldown: cooldownRemaining > 0,
          lastStealAttemptTimestamp: row.last_steal_attempt_timestamp,
          cooldownDuration: row.cooldown_duration,
          cooldownRemaining,
          lastSynced: row.last_synced
        };
      });

      res.json({ cooldowns });
    }
  );
};

module.exports = {
  getStealCooldownStatus,
  getAllPlayerStealCooldowns
};