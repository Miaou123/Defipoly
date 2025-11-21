// ============================================
// File Type Validation Middleware
// Validates actual file type by checking magic numbers
// ============================================

const fs = require('fs');

/**
 * Validates file type by checking magic numbers (file headers)
 * Prevents malicious files disguised as images
 */
const validateFileType = (req, res, next) => {
  if (!req.file) return next();

  try {
    const filePath = req.file.path;
    
    // Read first 4 bytes to check magic number
    const fileBuffer = fs.readFileSync(filePath);
    const magicNumber = fileBuffer.toString('hex', 0, 4);
    
    // Valid magic numbers for allowed file types:
    // JPG/JPEG: ffd8ffe0 or ffd8ffe1 (we check first 6 chars: ffd8ff)
    // PNG: 89504e47
    const validMagicNumbers = {
      'ffd8ff': 'JPEG',
      '89504e47': 'PNG'
    };
    
    const detectedType = Object.keys(validMagicNumbers).find(magic => 
      magicNumber.startsWith(magic)
    );
    
    if (!detectedType) {
      // Delete the invalid file
      fs.unlinkSync(filePath);
      console.warn(`🚫 [SECURITY] Invalid file magic number detected: ${magicNumber}`);
      console.warn(`🚫 [SECURITY] Expected: ffd8ff (JPEG) or 89504e47 (PNG)`);
      return res.status(400).json({ 
        error: 'Invalid file format. File appears to be corrupted or not a valid JPG/PNG image.' 
      });
    }
    
    console.log(`✅ [SECURITY] File validated: ${validMagicNumbers[detectedType]} (magic: ${magicNumber})`);
    next();
    
  } catch (error) {
    console.error('Error validating file type:', error);
    // Delete file on error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: 'Error validating file' });
  }
};

module.exports = { validateFileType };