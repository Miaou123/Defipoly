const express = require('express');
const router = express.Router();
const { 
  getPropertyStats, 
  getAllPropertiesStats,
  getPropertyState,
  getAllPropertiesState,
  getPropertyOwners
} = require('../controllers/propertyController');

// GET /api/properties/:propertyId/stats - Ownership stats
router.get('/:propertyId/stats', getPropertyStats);

router.get('/:propertyId/owners', getPropertyOwners);

// GET /api/properties/stats - All properties ownership stats
router.get('/stats', getAllPropertiesStats);

// GET /api/properties/:propertyId/state - Available slots
router.get('/:propertyId/state', getPropertyState);

// GET /api/properties/state - All properties state
router.get('/state', getAllPropertiesState);

module.exports = router;