const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getProfilesBatch, removeProfilePicture, updateThemePreferences } = require('../controllers/profileController');
const { validateUsername } = require('../middleware/validation');
const { uploadProfilePicture, uploadThemeBackground, deleteUpload } = require('../controllers/uploadController');
const { verifyJWT, verifyWalletOwnership } = require('../middleware/jwtAuth');

// GET /api/profile/:wallet - PUBLIC
router.get('/:wallet', getProfile);

// POST /api/profiles/batch - PUBLIC (read operation)
router.post('/batch', getProfilesBatch);

// POST /api/profile - PROTECTED
router.post('/', verifyJWT, verifyWalletOwnership('wallet'), validateUsername, updateProfile);

// POST /api/profile/upload/picture - PROTECTED (no wallet ownership check - done in controller)
router.post('/upload/picture', verifyJWT, uploadProfilePicture);

// POST /api/profile/upload/theme - PROTECTED (no wallet ownership check - done in controller)
router.post('/upload/theme', verifyJWT, uploadThemeBackground);

// POST /api/profile/upload/delete - PROTECTED (no wallet ownership check - done in controller)
router.post('/upload/delete', verifyJWT, deleteUpload);

// DELETE /api/profile/:wallet/picture - PROTECTED
router.delete('/:wallet/picture', verifyJWT, verifyWalletOwnership('wallet'), removeProfilePicture);

// POST /api/profile/themes - PROTECTED
router.post('/themes', verifyJWT, verifyWalletOwnership('wallet'), updateThemePreferences);

module.exports = router;