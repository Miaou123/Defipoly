const { getDatabase } = require('../config/database');

/**
 * Get buy cooldown status for a specific set
 * Now uses player_set_cooldowns table
 */
const getCooldownStatus = (req, res) => {
  const { wallet, setId } = req.params;
  const db = getDatabase();

  db.get(
    `SELECT 
      set_id,
      last_purchase_timestamp,
      cooldown_duration,
      last_purchased_property_id,
      properties_owned_in_set,
      properties_count,
      last_synced
     FROM player_set_cooldowns 
     WHERE wallet_address = ? AND set_id = ?`,
    [wallet, parseInt(setId)],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const currentTime = Math.floor(Date.now() / 1000);

      if (!row) {
        // No cooldown record = not on cooldown
        return res.json({
          setId: parseInt(setId),
          isOnCooldown: false,
          lastPurchaseTimestamp: 0,
          cooldownDuration: 0,
          cooldownRemaining: 0,
          lastPurchasedPropertyId: null,
          propertiesOwnedInSet: [],
          propertiesCount: 0
        });
      }

      const cooldownRemaining = Math.max(0, 
        (row.last_purchase_timestamp + row.cooldown_duration) - currentTime
      );

      res.json({
        setId: row.set_id,
        isOnCooldown: cooldownRemaining > 0,
        lastPurchaseTimestamp: row.last_purchase_timestamp,
        cooldownDuration: row.cooldown_duration,
        cooldownRemaining,
        lastPurchasedPropertyId: row.last_purchased_property_id,
        propertiesOwnedInSet: JSON.parse(row.properties_owned_in_set || '[]'),
        propertiesCount: row.properties_count,
        lastSynced: row.last_synced
      });
    }
  );
};

/**
 * Get all buy cooldowns for a wallet
 * Returns cooldowns for all 8 sets
 */
const getAllPlayerCooldowns = (req, res) => {
  const { wallet } = req.params;
  const db = getDatabase();

  db.all(
    `SELECT 
      set_id,
      last_purchase_timestamp,
      cooldown_duration,
      last_purchased_property_id,
      properties_owned_in_set,
      properties_count,
      last_synced
     FROM player_set_cooldowns 
     WHERE wallet_address = ?
     ORDER BY set_id ASC`,
    [wallet],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const currentTime = Math.floor(Date.now() / 1000);

      // Build cooldowns object for all 8 sets
      const cooldowns = {};
      
      // Initialize all sets as not on cooldown
      for (let setId = 0; setId < 8; setId++) {
        cooldowns[setId] = {
          setId,
          isOnCooldown: false,
          lastPurchaseTimestamp: 0,
          cooldownDuration: 0,
          cooldownRemaining: 0,
          lastPurchasedPropertyId: null,
          propertiesOwnedInSet: [],
          propertiesCount: 0
        };
      }

      // Update with actual cooldown data
      rows.forEach(row => {
        const cooldownRemaining = Math.max(0, 
          (row.last_purchase_timestamp + row.cooldown_duration) - currentTime
        );

        cooldowns[row.set_id] = {
          setId: row.set_id,
          isOnCooldown: cooldownRemaining > 0,
          lastPurchaseTimestamp: row.last_purchase_timestamp,
          cooldownDuration: row.cooldown_duration,
          cooldownRemaining,
          lastPurchasedPropertyId: row.last_purchased_property_id,
          propertiesOwnedInSet: JSON.parse(row.properties_owned_in_set || '[]'),
          propertiesCount: row.properties_count,
          lastSynced: row.last_synced
        };
      });

      res.json({ cooldowns });
    }
  );
};

module.exports = {
  getCooldownStatus,
  getAllPlayerCooldowns
};