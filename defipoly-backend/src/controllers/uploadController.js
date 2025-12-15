const { getDatabase } = require('../config/database');
const { upload, optimizeImage, UPLOAD_URL_PREFIX } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const { validateFileType } = require('../middleware/validateFileType');

// Upload handlers for different file types
const uploadProfilePicture = [
  upload.single('file'),
  validateFileType,
  optimizeImage,
  async (req, res) => {
    try {
      const { wallet } = req.body;
      
      if (!wallet) {
        return res.status(400).json({ error: 'Wallet address required' });
      }

      if (wallet !== req.authenticatedWallet) {
        return res.status(403).json({ error: 'Forbidden' });
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
          if (row && row.profile_picture && row.profile_picture.includes('/uploads/')) {
            const urlParts = row.profile_picture.split('/uploads/');
            const oldFilePath = urlParts[urlParts.length - 1];
            const fullOldPath = path.join(process.env.UPLOAD_DIR || './uploads', oldFilePath);
            if (fs.existsSync(fullOldPath)) {
              fs.unlinkSync(fullOldPath);
              console.log('Deleted old profile picture:', fullOldPath);
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
              
              console.log('Profile picture saved to database:', fileUrl);
              
              res.json({ 
                success: true, 
                profilePicture: `${process.env.API_BASE_URL || 'https://api.defipoly.app'}${fileUrl}`,
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
  validateFileType,
  optimizeImage,
  async (req, res) => {
    try {
      console.log('Theme upload request:', {
        body: req.body,
        file: req.file ? 'File received' : 'No file',
        fileDetails: req.file
      });

      const { wallet, themeType, oldBackgroundUrl } = req.body;
      
      if (!wallet) {
        console.error('No wallet address provided');
        return res.status(400).json({ error: 'Wallet address required' });
      }

      if (wallet !== req.authenticatedWallet) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      if (!themeType || !['board', 'card', 'scene'].includes(themeType)) {
        console.error('Invalid theme type:', themeType);
        return res.status(400).json({ error: 'Invalid theme type' });
      }

      if (!req.file) {
        console.error('No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Delete old theme background if exists
      console.log('Checking old background URL:', oldBackgroundUrl);
      console.log('UPLOAD_URL_PREFIX:', UPLOAD_URL_PREFIX);
      
      if (oldBackgroundUrl && oldBackgroundUrl.includes('/uploads/')) {
        // Extract the file path more reliably
        const urlParts = oldBackgroundUrl.split('/uploads/');
        const oldFilePath = urlParts[urlParts.length - 1];
        const fullOldPath = path.join(process.env.UPLOAD_DIR || './uploads', oldFilePath);
        
        console.log('Attempting to delete:', fullOldPath);
        
        if (fs.existsSync(fullOldPath)) {
          fs.unlinkSync(fullOldPath);
          console.log(`Deleted old ${themeType} background: ${fullOldPath}`);
        } else {
          console.log(`File not found: ${fullOldPath}`);
        }
      } else {
        console.log('No old background to delete or invalid URL format');
      }

      const fileUrl = req.file.url;
      console.log('File uploaded successfully:', fileUrl);
      
      // Update the database with the new theme settings
      const db = getDatabase();
      const updatedAt = Date.now();
      
      if (themeType === 'board') {
        // Update board theme settings
        db.run(
          `INSERT INTO profiles (wallet_address, board_theme, custom_board_background, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(wallet_address) 
           DO UPDATE SET 
             board_theme = ?,
             custom_board_background = ?,
             updated_at = ?`,
          [wallet, 'custom', fileUrl, updatedAt, 'custom', fileUrl, updatedAt],
          (err) => {
            if (err) {
              console.error('Database error updating board theme:', err);
              return res.status(500).json({ error: 'Failed to save board theme to database' });
            }
            
            console.log('Board theme saved to database:', fileUrl);
            res.json({ 
              success: true, 
              backgroundUrl: `${process.env.API_BASE_URL || 'https://api.defipoly.app'}${fileUrl}`,
              message: `${themeType} background uploaded successfully`
            });
          }
        );
      } else if (themeType === 'card') {
        // Update property card theme settings
        db.run(
          `INSERT INTO profiles (wallet_address, property_card_theme, custom_property_card_background, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(wallet_address) 
           DO UPDATE SET 
             property_card_theme = ?,
             custom_property_card_background = ?,
             updated_at = ?`,
          [wallet, 'custom', fileUrl, updatedAt, 'custom', fileUrl, updatedAt],
          (err) => {
            if (err) {
              console.error('Database error updating property card theme:', err);
              return res.status(500).json({ error: 'Failed to save property card theme to database' });
            }
            
            console.log('Property card theme saved to database:', fileUrl);
            res.json({ 
              success: true, 
              backgroundUrl: `${process.env.API_BASE_URL || 'https://api.defipoly.app'}${fileUrl}`,
              message: `${themeType} background uploaded successfully`
            });
          }
        );
      } else if (themeType === 'scene') {
        // Update scene background settings
        db.run(
          `INSERT INTO profiles (wallet_address, custom_scene_background, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(wallet_address) 
           DO UPDATE SET 
             custom_scene_background = ?,
             updated_at = ?`,
          [wallet, fileUrl, updatedAt, fileUrl, updatedAt],
          (err) => {
            if (err) {
              console.error('Database error updating scene background:', err);
              return res.status(500).json({ error: 'Failed to save scene background to database' });
            }
            
            console.log('Scene background saved to database:', fileUrl);
            res.json({ 
              success: true, 
              backgroundUrl: `${process.env.API_BASE_URL || 'https://api.defipoly.app'}${fileUrl}`,
              message: `${themeType} background uploaded successfully`
            });
          }
        );
      }
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
    
    console.log('Delete request:', { wallet, fileUrl });

    if (wallet !== req.authenticatedWallet) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    if (!wallet || !fileUrl) {
      return res.status(400).json({ error: 'Wallet and file URL required' });
    }

    // Verify the file URL is from our uploads
    if (!fileUrl.includes('/uploads/')) {
      return res.status(400).json({ error: 'Invalid file URL' });
    }

    // Extract file path more reliably (handles both /uploads/ and http://localhost:3101/uploads/)
    const urlParts = fileUrl.split('/uploads/');
    const filePath = urlParts[urlParts.length - 1];
    const fullPath = path.join(process.env.UPLOAD_DIR || './uploads', filePath);

    console.log('Attempting to delete file:', fullPath);

    // Delete file if exists
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('File deleted successfully:', fullPath);
    } else {
      console.log('File not found:', fullPath);
    }

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
};

// Batch upload handler for theme presets - handles all 3 theme components in single request
const uploadThemeBatch = [
  upload.fields([
    { name: 'sceneFile', maxCount: 1 },
    { name: 'boardFile', maxCount: 1 },
    { name: 'tileFile', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      console.log('Theme batch upload request:', {
        body: req.body,
        files: req.files ? Object.keys(req.files) : 'No files'
      });

      const { wallet, themeCategory } = req.body;
      
      // Determine writing style based on theme category
      const writingStyle = themeCategory === 'light' ? 'dark' : 'light';
      
      if (!wallet) {
        console.error('No wallet address provided');
        return res.status(400).json({ error: 'Wallet address required' });
      }

      if (wallet !== req.authenticatedWallet) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      if (!req.files || (!req.files.sceneFile && !req.files.boardFile && !req.files.tileFile)) {
        console.error('No files in request');
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const db = getDatabase();
      const updatedAt = Date.now();
      const results = {};

      // Helper function to process a single file
      const processFile = async (file, themeType, subDir) => {
        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/png'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          throw new Error(`Invalid file type for ${themeType}. Only JPG and PNG allowed.`);
        }

        // Move file to appropriate directory and optimize
        const finalDir = path.join(process.env.UPLOAD_DIR || './uploads', subDir);
        if (!fs.existsSync(finalDir)) {
          fs.mkdirSync(finalDir, { recursive: true });
        }

        const filename = file.filename;
        const finalPath = path.join(finalDir, filename);
        
        // Move from temp to final location
        fs.renameSync(file.path, finalPath);
        
        // Create optimized filename with .webp extension
        const optimizedFilename = filename.replace(/\.[^/.]+$/, '.webp');
        const optimizedPath = path.join(finalDir, optimizedFilename);

        // Optimize image
        const sharp = require('sharp');
        let sharpInstance = sharp(finalPath);
        
        switch (themeType) {
          case 'scene':
            sharpInstance = sharpInstance
              .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 90 });
            break;
          case 'board':
            sharpInstance = sharpInstance
              .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 90 });
            break;
          case 'tile':
            sharpInstance = sharpInstance
              .resize(400, 600, { fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 85 });
            break;
        }

        await sharpInstance.toFile(optimizedPath);

        // Delete original file
        fs.unlinkSync(finalPath);

        // Generate URL
        const baseUrl = process.env.NODE_ENV === 'production' ? '' : (process.env.API_BASE_URL || 'http://localhost:3101');
        const fileUrl = `${baseUrl}${UPLOAD_URL_PREFIX}/${subDir}/${optimizedFilename}`;
        
        console.log(`${themeType} file optimized and moved to:`, fileUrl);
        return fileUrl;
      };

      // Process scene background
      if (req.files.sceneFile && req.files.sceneFile[0]) {
        try {
          const fileUrl = await processFile(req.files.sceneFile[0], 'scene', 'scenes');
          
          // Update database
          await new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO profiles (wallet_address, custom_scene_background, theme_category, writing_style, updated_at)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(wallet_address) 
               DO UPDATE SET 
                 custom_scene_background = ?,
                 theme_category = ?,
                 writing_style = ?,
                 updated_at = ?`,
              [wallet, fileUrl, themeCategory || null, writingStyle, updatedAt, fileUrl, themeCategory || null, writingStyle, updatedAt],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          
          results.scene = { backgroundUrl: fileUrl };
          console.log('Scene background saved to database:', fileUrl);
        } catch (error) {
          console.error('Error processing scene file:', error);
          results.scene = { error: error.message };
        }
      }

      // Process board background
      if (req.files.boardFile && req.files.boardFile[0]) {
        try {
          const fileUrl = await processFile(req.files.boardFile[0], 'board', 'boards');
          
          // Update database
          await new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO profiles (wallet_address, board_theme, custom_board_background, theme_category, writing_style, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(wallet_address) 
               DO UPDATE SET 
                 board_theme = ?,
                 custom_board_background = ?,
                 theme_category = ?,
                 writing_style = ?,
                 updated_at = ?`,
              [wallet, 'custom', fileUrl, themeCategory || null, writingStyle, updatedAt, 'custom', fileUrl, themeCategory || null, writingStyle, updatedAt],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          
          results.board = { backgroundUrl: fileUrl };
          console.log('Board background saved to database:', fileUrl);
        } catch (error) {
          console.error('Error processing board file:', error);
          results.board = { error: error.message };
        }
      }

      // Process tile background
      if (req.files.tileFile && req.files.tileFile[0]) {
        try {
          const fileUrl = await processFile(req.files.tileFile[0], 'tile', 'cards');
          
          // Update database
          await new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO profiles (wallet_address, property_card_theme, custom_property_card_background, theme_category, writing_style, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(wallet_address) 
               DO UPDATE SET 
                 property_card_theme = ?,
                 custom_property_card_background = ?,
                 theme_category = ?,
                 writing_style = ?,
                 updated_at = ?`,
              [wallet, 'custom', fileUrl, themeCategory || null, writingStyle, updatedAt, 'custom', fileUrl, themeCategory || null, writingStyle, updatedAt],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          
          results.tile = { backgroundUrl: fileUrl };
          console.log('Tile background saved to database:', fileUrl);
        } catch (error) {
          console.error('Error processing tile file:', error);
          results.tile = { error: error.message };
        }
      }

      // Check if any uploads succeeded
      const successCount = Object.keys(results).filter(key => !results[key].error).length;
      
      if (successCount === 0) {
        return res.status(500).json({ 
          error: 'All uploads failed',
          results 
        });
      }

      res.json({ 
        success: true,
        message: `Theme batch upload completed. ${successCount} file(s) uploaded successfully.`,
        results
      });

    } catch (error) {
      console.error('Batch upload error details:', error);
      res.status(500).json({ error: error.message || 'Batch upload failed' });
    }
  }
];

module.exports = {
  uploadProfilePicture,
  uploadThemeBackground,
  uploadThemeBatch,
  deleteUpload
};