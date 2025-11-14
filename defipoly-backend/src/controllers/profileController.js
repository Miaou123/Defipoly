const { getDatabase } = require('../config/database');

const getProfile = (req, res) => {
  const { wallet } = req.params;
  const db = getDatabase();
  
  db.get(
    'SELECT * FROM profiles WHERE wallet_address = ?',
    [wallet],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      res.json({
        walletAddress: row.wallet_address,
        username: row.username,
        profilePicture: row.profile_picture,
        cornerSquareStyle: row.corner_square_style || 'property',
        boardTheme: row.board_theme || 'dark',
        propertyCardTheme: row.property_card_theme || 'dark',
        customBoardBackground: row.custom_board_background || null,
        customPropertyCardBackground: row.custom_property_card_background || null,
        updatedAt: row.updated_at,
      });
    }
  );
};

const updateProfile = (req, res) => {
  const { wallet, username, profilePicture, cornerSquareStyle, boardTheme, propertyCardTheme, customBoardBackground, customPropertyCardBackground } = req.body;
  const db = getDatabase();
  
  if (!wallet) {
    return res.status(400).json({ error: 'Wallet address required' });
  }
  
  const updatedAt = Date.now();
  
  db.run(
    `INSERT INTO profiles (wallet_address, username, profile_picture, corner_square_style, board_theme, property_card_theme, custom_board_background, custom_property_card_background, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(wallet_address) 
     DO UPDATE SET 
       username = ?,
       profile_picture = ?,
       corner_square_style = ?,
       board_theme = ?,
       property_card_theme = ?,
       custom_board_background = ?,
       custom_property_card_background = ?,
       updated_at = ?`,
    [wallet, username, profilePicture, cornerSquareStyle || 'property', boardTheme || 'dark', propertyCardTheme || 'dark', customBoardBackground, customPropertyCardBackground, updatedAt, username, profilePicture, cornerSquareStyle || 'property', boardTheme || 'dark', propertyCardTheme || 'dark', customBoardBackground, customPropertyCardBackground, updatedAt],
    (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
    }
  );
};

const getProfilesBatch = (req, res) => {
  const { wallets } = req.body;
  const db = getDatabase();
  
  if (!Array.isArray(wallets) || wallets.length === 0) {
    return res.status(400).json({ error: 'Invalid wallet array' });
  }
  
  const limitedWallets = wallets.slice(0, 100);
  const placeholders = limitedWallets.map(() => '?').join(',');
  
  db.all(
    `SELECT * FROM profiles WHERE wallet_address IN (${placeholders})`,
    limitedWallets,
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const profiles = {};
      rows.forEach(row => {
        profiles[row.wallet_address] = {
          username: row.username,
          profilePicture: row.profile_picture,
          cornerSquareStyle: row.corner_square_style || 'property',
          boardTheme: row.board_theme || 'dark',
          propertyCardTheme: row.property_card_theme || 'dark',
          customBoardBackground: row.custom_board_background || null,
          customPropertyCardBackground: row.custom_property_card_background || null,
          updatedAt: row.updated_at,
        };
      });
      
      res.json({ profiles });
    }
  );
};

const removeProfilePicture = (req, res) => {
  const { wallet } = req.params;
  const db = getDatabase();
  
  if (!wallet) {
    return res.status(400).json({ error: 'Wallet address required' });
  }
  
  const updatedAt = Date.now();
  
  db.run(
    'UPDATE profiles SET profile_picture = NULL, updated_at = ? WHERE wallet_address = ?',
    [updatedAt, wallet],
    (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
    }
  );
};

const updateThemePreferences = (req, res) => {
  const { wallet, boardTheme, propertyCardTheme, customBoardBackground, customPropertyCardBackground, cornerSquareStyle } = req.body;
  const db = getDatabase();
  
  if (!wallet) {
    return res.status(400).json({ error: 'Wallet address required' });
  }
  
  const updatedAt = Date.now();
  
  db.run(
    `INSERT INTO profiles (wallet_address, board_theme, property_card_theme, custom_board_background, custom_property_card_background, corner_square_style, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(wallet_address) 
     DO UPDATE SET 
       board_theme = ?,
       property_card_theme = ?,
       custom_board_background = ?,
       custom_property_card_background = ?,
       corner_square_style = ?,
       updated_at = ?`,
    [
      wallet, 
      boardTheme || 'dark', 
      propertyCardTheme || 'dark', 
      customBoardBackground, 
      customPropertyCardBackground, 
      cornerSquareStyle || 'property', 
      updatedAt,
      boardTheme || 'dark', 
      propertyCardTheme || 'dark', 
      customBoardBackground, 
      customPropertyCardBackground, 
      cornerSquareStyle || 'property', 
      updatedAt
    ],
    (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
    }
  );
};

module.exports = {
  getProfile,
  updateProfile,
  getProfilesBatch,
  removeProfilePicture,
  updateThemePreferences
};