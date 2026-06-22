const express = require('express');
const router = express.Router();
const { createContactMessage, getContactMessages } = require('../controllers/contactController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Public contact form endpoint
router.post('/', createContactMessage);

// Admin endpoint to list contact messages
router.get('/messages', authenticate, authorizeAdmin, getContactMessages);

module.exports = router;
