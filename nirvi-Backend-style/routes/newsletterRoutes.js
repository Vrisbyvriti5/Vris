const express = require('express');
const router = express.Router();
const { subscribeNewsletter, getNewsletterSubscribers } = require('../controllers/newsletterController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.post('/subscribe', subscribeNewsletter);
router.get('/subscribers', authenticate, authorizeAdmin, getNewsletterSubscribers);

module.exports = router;
