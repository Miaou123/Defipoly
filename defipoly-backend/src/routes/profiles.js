const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getProfilesBatch, removeProfilePicture, updateThemePreferences } = require('../controllers/profileController');
const { uploadProfilePicture, uploadThemeBackground, deleteUpload } = require('../controllers/uploadController');

// GET /api/profile/:wallet
router.get('/:wallet', getProfile);

// POST /api/profile
router.post('/', updateProfile);

// POST /api/profiles/batch
router.post('/batch', getProfilesBatch);

// Upload endpoints
// POST /api/profile/upload/picture
router.post('/upload/picture', uploadProfilePicture);

// POST /api/profile/upload/theme
router.post('/upload/theme', uploadThemeBackground);

// POST /api/profile/upload/delete
router.post('/upload/delete', deleteUpload);

// DELETE /api/profile/:wallet/picture
router.delete('/:wallet/picture', removeProfilePicture);

// POST /api/profile/themes
router.post('/themes', updateThemePreferences);

module.exports = router;