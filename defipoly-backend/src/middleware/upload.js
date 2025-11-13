const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Upload directory configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const UPLOAD_URL_PREFIX = process.env.UPLOAD_URL_PREFIX || '/uploads';

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = ['profiles', 'boards', 'cards'];
  dirs.forEach(dir => {
    const fullPath = path.join(UPLOAD_DIR, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

ensureUploadDirs();

// File size limits
const FILE_SIZE_LIMITS = {
  profile: 2 * 1024 * 1024,    // 2MB for profile pictures
  board: 5 * 1024 * 1024,      // 5MB for board backgrounds
  card: 3 * 1024 * 1024        // 3MB for card backgrounds
};

// Multer storage configuration - save to temp location first
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save all files to a temp directory first, we'll move them later
    const tempPath = path.join(UPLOAD_DIR, 'temp');
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { recursive: true });
    }
    cb(null, tempPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP and SVG are allowed.'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.board // Use max limit, we'll check specific limits later
  }
});

// Image optimization middleware
const optimizeImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const uploadType = req.body.uploadType || 'profile';
    const themeType = req.body.themeType;
    
    // Determine final directory
    let subDir;
    if (themeType === 'board') {
      subDir = 'boards';
    } else if (themeType === 'card') {
      subDir = 'cards';
    } else {
      subDir = 'profiles';
    }
    
    const finalDir = path.join(UPLOAD_DIR, subDir);
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }
    
    const filePath = req.file.path;
    const filename = req.file.filename;
    
    // Skip optimization for SVG files
    if (req.file.mimetype === 'image/svg+xml') {
      const finalPath = path.join(finalDir, filename);
      fs.renameSync(filePath, finalPath);
      
      req.file.path = finalPath;
      const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3101';
      req.file.url = `${baseUrl}${UPLOAD_URL_PREFIX}/${subDir}/${filename}`;
      
      console.log('SVG file moved to:', req.file.url);
      return next();
    }
    
    const finalPath = path.join(finalDir, filename);
    
    console.log('Moving file from temp to final location:', { from: filePath, to: finalPath });

    // Different optimization settings based on upload type
    let sharpInstance = sharp(filePath);
    
    if (req.file.mimetype === 'image/gif') {
      // For GIFs, just move them without optimization
      fs.renameSync(filePath, finalPath);
      req.file.path = finalPath;
      // Use full URL for frontend access
      const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3101';
      req.file.url = `${baseUrl}${UPLOAD_URL_PREFIX}/${subDir}/${filename}`;
      console.log('GIF moved to:', req.file.url);
      return next();
    }

    // Create optimized filename with .webp extension
    const optimizedFilename = filename.replace(/\.[^/.]+$/, '.webp');
    const optimizedPath = path.join(finalDir, optimizedFilename);

    // Optimize based on type
    switch (uploadType) {
      case 'profile':
        sharpInstance = sharpInstance
          .resize(400, 400, { fit: 'cover' })
          .webp({ quality: 85 });
        break;
      case 'board':
        sharpInstance = sharpInstance
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 90 });
        break;
      case 'card':
        sharpInstance = sharpInstance
          .resize(400, 600, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 });
        break;
    }

    await sharpInstance.toFile(optimizedPath);

    // Delete temp file
    fs.unlinkSync(filePath);

    // Update file info
    req.file.filename = optimizedFilename;
    req.file.path = optimizedPath;
    req.file.size = fs.statSync(optimizedPath).size;
    req.file.optimizedPath = optimizedPath;
    // Use full URL for frontend access
    const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3101';
    req.file.url = `${baseUrl}${UPLOAD_URL_PREFIX}/${subDir}/${optimizedFilename}`;
    
    console.log('File optimized and moved to:', req.file.url);

    next();
  } catch (error) {
    console.error('Image optimization error:', error);
    // If optimization fails, just move the original file
    try {
      const uploadType = req.body.uploadType || 'profile';
      const themeType = req.body.themeType;
      
      let subDir;
      if (themeType === 'board') {
        subDir = 'boards';
      } else if (themeType === 'card') {
        subDir = 'cards';
      } else {
        subDir = 'profiles';
      }
      
      const finalDir = path.join(UPLOAD_DIR, subDir);
      const finalPath = path.join(finalDir, req.file.filename);
      
      fs.renameSync(req.file.path, finalPath);
      req.file.path = finalPath;
      // Use full URL for frontend access
      const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3101';
      req.file.url = `${baseUrl}${UPLOAD_URL_PREFIX}/${subDir}/${req.file.filename}`;
      
      console.log('File moved without optimization to:', req.file.url);
    } catch (moveError) {
      console.error('Failed to move file:', moveError);
    }
    next();
  }
};

// Cleanup old files middleware (optional)
const cleanupOldFiles = async (wallet, uploadType) => {
  // This would be called after successful upload to remove previous files
  // Implementation depends on how you track files in your database
};

module.exports = {
  upload,
  optimizeImage,
  cleanupOldFiles,
  UPLOAD_URL_PREFIX
};