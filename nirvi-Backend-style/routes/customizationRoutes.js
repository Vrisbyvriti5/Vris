const express = require('express');
const router = express.Router();
const {
  getAllCustomizations,
  getCustomizationById,
  updateCustomizationStatus,
} = require('../controllers/customizationController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// All customization routes are admin-only
router.use(authenticate, authorizeAdmin);

router.get('/', getAllCustomizations);
router.get('/:id', getCustomizationById);
router.put('/:id/status', updateCustomizationStatus);

module.exports = router;
