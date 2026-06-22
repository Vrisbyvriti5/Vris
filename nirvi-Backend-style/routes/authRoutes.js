const express = require('express');
const passport = require('passport');
const router = express.Router();
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar,
  sendMobileVerificationOtp,
  verifyMobileOtp,
  sendOtp,
  verifyOtp,
  resetPassword,
  signTokenForUser,
  setAuthCookie,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const memoryUpload = require('../config/upload');

// ── Public Routes ────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:8080'}/login` }),
  (req, res) => {
    const token = signTokenForUser(req.user);
    setAuthCookie(res, token);
    const redirectBase = process.env.CLIENT_URL || 'http://localhost:8080';
    res.redirect(`${redirectBase}/oauth-success?token=${encodeURIComponent(token)}`);
  },
);

// ── Protected Routes ─────────────────────────────────────────────────────────
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/avatar', authenticate, memoryUpload.single('avatar'), uploadAvatar);
router.delete('/avatar', authenticate, deleteAvatar);
router.post('/mobile/send-otp', authenticate, sendMobileVerificationOtp);
router.post('/mobile/verify-otp', authenticate, verifyMobileOtp);

module.exports = router;
