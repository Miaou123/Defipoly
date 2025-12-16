const { getDatabase } = require('../config/database');

/**
 * Get property statistics including number of owners with unshielded slots
 */
const getPropertyStats = (req, res) => {
  const { propertyId } = req.params;
  const db = getDatabase();

  db.get(
    `SELECT 
      COUNT(DISTINCT wallet_address) as owners_with_unshielded_slots
     FROM property_ownership
     WHERE property_id = ? 
       AND slots_owned > 0
       AND (slots_shielded = 0 OR slots_shielded < slots_owned OR shield_expiry < strftime('%s', 'now'))`,
    [propertyId],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        propertyId: parseInt(propertyId),
        ownersWithUnshieldedSlots: row.owners_with_unshielded_slots || 0
      });
    }
  );
};

/**
 * Get all property stats (for all 22 properties at once)
 */
const getAllPropertiesStats = (req, res) => {
  const db = getDatabase();

  db.all(
    `SELECT 
      property_id,
      COUNT(DISTINCT wallet_address) as owners_with_unshielded_slots
     FROM property_ownership
     WHERE slots_owned > 0
       AND (slots_shielded = 0 OR slots_shielded < slots_owned OR shield_expiry < strftime('%s', 'now'))
     GROUP BY property_id`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const stats = {};
      rows.forEach(row => {
        stats[row.property_id] = {
          ownersWithUnshieldedSlots: row.owners_with_unshielded_slots
        };
      });
      
      res.json({ properties: stats });
    }
  );
};

/**
 * NEW: Get property state (available slots) from blockchain sync
 */
const getPropertyState = (req, res) => {
  const { propertyId } = req.params;
  const db = getDatabase();

  db.get(
    `SELECT 
      property_id,
      available_slots,
      max_slots_per_property,
      last_synced
     FROM properties_state 
     WHERE property_id = ?`,
    [parseInt(propertyId)],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!row) {
        return res.status(404).json({ 
          error: 'Property state not found',
          message: 'Property state has not been synced yet. Try running a full sync.'
        });
      }

      res.json({
        propertyId: row.property_id,
        availableSlots: row.available_slots,
        maxSlots: row.max_slots_per_property,
        lastSynced: row.last_synced
      });
    }
  );
};

/**
 * Get all owners of a specific property with their unshielded slots
 * Used by stealing system to find valid targets
 * GET /api/properties/:propertyId/owners
 */
const getPropertyOwners = (req, res) => {
  const { propertyId } = req.params;
  const { excludeWallet } = req.query; // Optional: exclude attacker from results
  const db = getDatabase();
  const currentTime = Math.floor(Date.now() / 1000);

  let query = `
    SELECT 
      wallet_address as walletAddress,
      slots_owned as slotsOwned,
      slots_shielded as slotsShielded,
      shield_expiry as shieldExpiry,
      steal_protection_expiry as stealProtectionExpiry
    FROM property_ownership
    WHERE property_id = ? AND slots_owned > 0
  `;
  
  const params = [parseInt(propertyId)];
  
  if (excludeWallet) {
    query += ` AND wallet_address != ?`;
    params.push(excludeWallet);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Calculate unshielded slots and filter valid targets
    const owners = (rows || []).map(row => {
      const shieldActive = row.shieldExpiry > currentTime;
      const effectiveShielded = shieldActive ? row.slotsShielded : 0;
      const unshieldedSlots = row.slotsOwned - effectiveShielded;
      
      return {
        walletAddress: row.walletAddress,
        slotsOwned: row.slotsOwned,
        slotsShielded: row.slotsShielded,
        unshieldedSlots,
        shieldExpiry: row.shieldExpiry,
        shieldActive,
        stealProtectionExpiry: row.stealProtectionExpiry,
        stealProtectionActive: row.stealProtectionExpiry > currentTime
      };
    }).filter(owner => owner.unshieldedSlots > 0); // Only include owners with stealable slots

    res.json({
      propertyId: parseInt(propertyId),
      currentTime,
      owners,
      totalOwners: owners.length,
      totalUnshieldedSlots: owners.reduce((sum, o) => sum + o.unshieldedSlots, 0)
    });
  });
};

/**
 * Get stealable targets for a property (excludes protected players)
 * GET /api/properties/:propertyId/steal-targets?attackerWallet=xxx
 */
const getStealTargets = (req, res) => {
  const { propertyId } = req.params;
  const { attackerWallet } = req.query;
  const db = getDatabase();
  const currentTime = Math.floor(Date.now() / 1000);

  if (!attackerWallet) {
    return res.status(400).json({ error: 'attackerWallet query param required' });
  }

  db.all(`
    SELECT 
      wallet_address as walletAddress,
      slots_owned as slotsOwned,
      slots_shielded as slotsShielded,
      shield_expiry as shieldExpiry,
      steal_protection_expiry as stealProtectionExpiry
    FROM property_ownership
    WHERE property_id = ? 
      AND slots_owned > 0
      AND wallet_address != ?
  `, [parseInt(propertyId), attackerWallet], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Filter to only valid steal targets
    const targets = (rows || []).map(row => {
      const shieldActive = row.shieldExpiry > currentTime;
      const effectiveShielded = shieldActive ? row.slotsShielded : 0;
      const unshieldedSlots = row.slotsOwned - effectiveShielded;
      const stealProtectionActive = row.stealProtectionExpiry > currentTime;
      
      return {
        walletAddress: row.walletAddress,
        slotsOwned: row.slotsOwned,
        unshieldedSlots,
        shieldActive,
        stealProtectionExpiry: row.stealProtectionExpiry,
        stealProtectionActive,
        isValidTarget: unshieldedSlots > 0 && !stealProtectionActive
      };
    }).filter(t => t.isValidTarget);

    res.json({
      propertyId: parseInt(propertyId),
      attackerWallet,
      currentTime,
      targets,
      totalTargets: targets.length,
      hasValidTargets: targets.length > 0
    });
  });
};

/**
 * NEW: Get all properties state
 */
const getAllPropertiesState = (req, res) => {
  const db = getDatabase();

  db.all(
    `SELECT 
      property_id,
      available_slots,
      max_slots_per_property,
      last_synced
     FROM properties_state 
     ORDER BY property_id ASC`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const properties = rows.map(row => ({
        propertyId: row.property_id,
        availableSlots: row.available_slots,
        maxSlots: row.max_slots_per_property,
        lastSynced: row.last_synced
      }));

      res.json({ properties });
    }
  );
};

module.exports = {
  getPropertyStats,
  getAllPropertiesStats,
  getPropertyState,
  getAllPropertiesState,
  getPropertyOwners,
  getStealTargets
};