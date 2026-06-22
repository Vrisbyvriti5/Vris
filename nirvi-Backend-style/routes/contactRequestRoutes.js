const express = require('express');
const router = express.Router();
const {
  createContactRequest,
  getAllContactRequests,
  updateContactRequestStatus,
} = require('../controllers/contactRequestController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Public contact form submission
router.post('/', createContactRequest);

// Admin-only request management
router.get('/', authenticate, authorizeAdmin, getAllContactRequests);
router.patch('/:id/status', authenticate, authorizeAdmin, updateContactRequestStatus);

module.exports = router;
