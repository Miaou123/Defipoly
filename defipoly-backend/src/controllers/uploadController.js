const { getDatabase } = require('../config/database');
const { upload, optimizeImage, UPLOAD_URL_PREFIX } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// Upload handlers for different file types
const uploadProfilePicture = [
  upload.single('file'),
  optimizeImage,
  async (req, res) => {
    try {
      const { wallet } = req.body;
      
      if (!wallet) {
        return res.status(400).json({ error: 'Wallet address required' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const db = getDatabase();
      const fileUrl = req.file.url;
      const updatedAt = Date.now();

      // Get old profile picture URL to delete
      db.get(
        'SELECT profile_picture FROM profiles WHERE wallet_address = ?',
        [wallet],
        (err, row) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          // Delete old file if exists
          if (row && row.profile_picture && row.profile_picture.startsWith(UPLOAD_URL_PREFIX)) {
            const oldFilePath = row.profile_picture.replace(UPLOAD_URL_PREFIX, '');
            const fullOldPath = path.join(process.env.UPLOAD_DIR || './uploads', oldFilePath);
            if (fs.existsSync(fullOldPath)) {
              fs.unlinkSync(fullOldPath);
            }
          }

          // Update database
          db.run(
            `INSERT INTO profiles (wallet_address, profile_picture, updated_at)
             VALUES (?, ?, ?)
             ON CONFLICT(wallet_address) 
             DO UPDATE SET profile_picture = ?, updated_at = ?`,
            [wallet, fileUrl, updatedAt, fileUrl, updatedAt],
            (err) => {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
              }
              
              res.json({ 
                success: true, 
                profilePicture: fileUrl,
                message: 'Profile picture uploaded successfully'
              });
            }
          );
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
];

const uploadThemeBackground = [
  upload.single('file'),
  optimizeImage,
  async (req, res) => {
    try {
      console.log('Theme upload request:', {
        body: req.body,
        file: req.file ? 'File received' : 'No file',
        fileDetails: req.file
      });

      const { wallet, themeType } = req.body;
      
      if (!wallet) {
        console.error('No wallet address provided');
        return res.status(400).json({ error: 'Wallet address required' });
      }

      if (!themeType || !['board', 'card'].includes(themeType)) {
        console.error('Invalid theme type:', themeType);
        return res.status(400).json({ error: 'Invalid theme type' });
      }

      if (!req.file) {
        console.error('No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileUrl = req.file.url;
      console.log('File uploaded successfully:', fileUrl);
      
      res.json({ 
        success: true, 
        backgroundUrl: fileUrl,
        message: `${themeType} background uploaded successfully`
      });
    } catch (error) {
      console.error('Upload error details:', error);
      res.status(500).json({ error: error.message || 'Upload failed' });
    }
  }
];

// Delete uploaded file endpoint
const deleteUpload = async (req, res) => {
  try {
    const { wallet, fileUrl } = req.body;
    
    if (!wallet || !fileUrl) {
      return res.status(400).json({ error: 'Wallet and file URL required' });
    }

    // Verify the file URL is from our uploads
    if (!fileUrl.startsWith(UPLOAD_URL_PREFIX)) {
      return res.status(400).json({ error: 'Invalid file URL' });
    }

    // Extract file path
    const filePath = fileUrl.replace(UPLOAD_URL_PREFIX, '');
    const fullPath = path.join(process.env.UPLOAD_DIR || './uploads', filePath);

    // Delete file if exists
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
};

module.exports = {
  uploadProfilePicture,
  uploadThemeBackground,
  deleteUpload
};