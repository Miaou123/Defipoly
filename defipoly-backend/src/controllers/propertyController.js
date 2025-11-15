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

const getPropertyOwners = (req, res) => {
  const { propertyId } = req.params;
  const db = getDatabase();

  db.all(
    `SELECT * FROM property_ownership 
     WHERE property_id = ? AND slots_owned > 0
     ORDER BY slots_owned DESC`,
    [propertyId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ owners: rows });
    }
  );
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
  getPropertyOwners
};