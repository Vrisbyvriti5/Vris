const express = require('express');
const router = express.Router();
const { createSubscription, verifySubscription } = require('../controllers/plusController');
const { authenticate } = require('../middleware/auth');

router.post('/create-subscription', authenticate, createSubscription);
router.post('/verify-subscription', authenticate, verifySubscription);

module.exports = router;
