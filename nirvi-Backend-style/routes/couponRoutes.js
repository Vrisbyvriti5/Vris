const express = require('express');
const router = express.Router();
const { applyCoupon } = require('../controllers/couponController');
const { optionalAuthenticate } = require('../middleware/auth');

router.post('/apply', optionalAuthenticate, applyCoupon);

module.exports = router;
