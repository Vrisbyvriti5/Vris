const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const { sendMail } = require('../utils/mailer');
const { convertToWebp } = require('../utils/imageProcessor');
const { uploadBufferToS3 } = require('../config/upload');

const OTP_EXPIRY_MINUTES = 5;
const otpRequestTracker = new Map();
const isProduction = process.env.NODE_ENV === 'production';
const AUTH_COOKIE_NAME = 'vris_token';
const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: AUTH_COOKIE_MAX_AGE_MS,
  path: '/',
};

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: authCookieOptions.secure,
    sameSite: authCookieOptions.sameSite,
    path: '/',
  });
};

const isOtpRateLimited = (email) => {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxRequests = 3;
  const existing = otpRequestTracker.get(email) || [];
  const recent = existing.filter((ts) => now - ts < windowMs);
  if (recent.length >= maxRequests) {
    otpRequestTracker.set(email, recent);
    return true;
  }
  recent.push(now);
  otpRequestTracker.set(email, recent);
  return false;
};

const signTokenForUser = (user) => jwt.sign(
  { id: String(user.id), email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
);

// ── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Validation
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // Check duplicate
    const existingUser = await UserModel.findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    // Hash password & create
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await UserModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: String(phone || '').trim(),
      phoneVerified: false,
      defaultAddressEnabled: true,
    });

    // Generate token
    const token = signTokenForUser(user);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          phone: user.phone || null, 
          role: user.role,
          phone_verified: user.phone_verified,
          default_address_enabled: user.default_address_enabled,
          address_line1: user.address_line1,
          address_line2: user.address_line2,
          city: user.city,
          state: user.state,
          pincode: user.pincode,
          dob: user.dob,
          gender: user.gender,
          avatar_url: user.avatar_url
        },
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Send OTP for forgot password ──────────────────────────────────────────────
const sendOtp = async (req, res) => {
  try {
    const normalizedEmail = String(req.body?.email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    if (isOtpRateLimited(normalizedEmail)) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Try again in a few minutes.',
      });
    }

    const user = await UserModel.findByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await UserModel.setPasswordResetOtpByEmail(normalizedEmail, otp, expiresAt);
    console.log(`[ForgotPassword][OTP] ${normalizedEmail} => ${otp} (valid for ${OTP_EXPIRY_MINUTES} min)`);

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
        <h2 style="margin-bottom:8px;">VRIS Password Reset OTP</h2>
        <p>Your OTP for password reset is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:12px 0;">${otp}</p>
        <p>This OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;

    try {
      await sendMail({
        to: normalizedEmail,
        subject: 'VRIS Password Reset OTP',
        text: `Your OTP is ${otp}. It is valid for ${OTP_EXPIRY_MINUTES} minutes.`,
        html,
      });
    } catch (mailError) {
      // Keep OTP flow working in development even if SMTP config is missing/invalid.
      console.error('OTP email send failed:', mailError.message);
      console.log(`[ForgotPassword][OTP-FALLBACK] Use this OTP for ${normalizedEmail}: ${otp}`);
    }

    return res.json({
      success: true,
      message: 'OTP sent successfully.',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Verify OTP for forgot password ────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  try {
    const normalizedEmail = String(req.body?.email || '').trim().toLowerCase();
    const otp = String(req.body?.otp || '').trim();

    if (!normalizedEmail || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.',
      });
    }

    const user = await UserModel.findByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    const storedOtp = user.otp || user.reset_otp;
    const otpExpiry = user.otp_expiry || user.reset_otp_expires_at;

    if (!storedOtp || !otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'Please request a new OTP.',
      });
    }

    if (new Date(otpExpiry) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired',
      });
    }

    if (String(storedOtp) !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Wrong OTP',
      });
    }

    await UserModel.markPasswordResetOtpVerifiedByEmail(normalizedEmail);

    return res.json({
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Reset password after OTP verification ─────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const normalizedEmail = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.newPassword || req.body?.password || '');
    const confirmPassword = String(req.body?.confirmPassword || req.body?.newPassword || req.body?.password || '');

    if (!normalizedEmail || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and confirm password are required.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password mismatch',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const user = await UserModel.findByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    if (!user.reset_otp_verified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify OTP first.',
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await UserModel.updatePasswordByEmail(normalizedEmail, hashedPassword);
    await UserModel.clearPasswordResetOtpByEmail(normalizedEmail);

    return res.json({
      success: true,
      message: 'Password reset successful.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');

    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await UserModel.findByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(normalizedPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = signTokenForUser(user);
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          phone: user.phone || null, 
          role: user.role,
          phone_verified: user.phone_verified,
          default_address_enabled: user.default_address_enabled,
          address_line1: user.address_line1,
          address_line2: user.address_line2,
          city: user.city,
          state: user.state,
          pincode: user.pincode,
          dob: user.dob,
          gender: user.gender,
          avatar_url: user.avatar_url
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Logout ───────────────────────────────────────────────────────────────────
const logout = (_req, res) => {
  clearAuthCookie(res);
  return res.json({
    success: true,
    message: 'Logout successful.',
  });
};

// ── Get current user profile ─────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Update current user profile ──────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const addressLine1 = String(req.body?.addressLine1 || '').trim();
    const addressLine2 = String(req.body?.addressLine2 || '').trim();
    const city = String(req.body?.city || '').trim();
    const state = String(req.body?.state || '').trim();
    const pincode = String(req.body?.pincode || '').trim();
    const dob = req.body?.dob ? String(req.body.dob).trim() : null;
    const gender = req.body?.gender ? String(req.body.gender).trim() : null;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    if (phone && !/^\d{10,15}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Phone number must be 10 to 15 digits.' });
    }

    if (pincode && !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ success: false, message: 'Pincode must be 6 digits.' });
    }

    const defaultAddressEnabled = Boolean(req.body?.defaultAddressEnabled);

    const updated = await UserModel.updateProfileById(req.user.id, {
      name,
      phone,
      defaultAddressEnabled,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      dob,
      gender,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = await UserModel.findById(req.user.id);
    return res.json({ success: true, data: user, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Change password for authenticated user ───────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    const confirmPassword = String(req.body?.confirmPassword || '');

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirm password do not match.' });
    }

    const user = await UserModel.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await UserModel.updatePasswordById(req.user.id, hashedPassword);

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Mobile OTP verification (authenticated) ──────────────────────────────────
const sendMobileVerificationOtp = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const phone = String(user.phone || '').trim();
    if (!phone || !/^\d{10,15}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Please add a valid mobile number first.' });
    }

    const rateLimitKey = `mobile:${req.user.id}`;
    if (isOtpRateLimited(rateLimitKey)) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Try again in a few minutes.' });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await UserModel.setPhoneVerificationOtpById(req.user.id, otp, expiresAt);

    // Temporary fallback until SMS provider integration is configured.
    console.log(`[MobileVerify][OTP] user:${req.user.id} phone:${phone} otp:${otp}`);

    return res.json({
      success: true,
      message: 'Verification OTP sent to your mobile number.',
      ...(isProduction ? {} : { devOtp: otp }),
    });
  } catch (error) {
    console.error('Send mobile OTP error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const verifyMobileOtp = async (req, res) => {
  try {
    const otp = String(req.body?.otp || '').trim();
    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6 digit OTP.' });
    }

    const user = await UserModel.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.phone_otp || !user.phone_otp_expires_at) {
      return res.status(400).json({ success: false, message: 'Please request a new OTP.' });
    }

    if (new Date(user.phone_otp_expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please request again.' });
    }

    if (String(user.phone_otp) !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    await UserModel.verifyPhoneById(req.user.id);
    const updatedUser = await UserModel.findById(req.user.id);
    return res.json({ success: true, message: 'Mobile number verified successfully.', data: updatedUser });
  } catch (error) {
    console.error('Verify mobile OTP error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { buffer, fileName, contentType } = await convertToWebp(req.file.buffer, {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      maxWidth: 400,
    });

    const avatarUrl = await uploadBufferToS3(buffer, fileName, contentType);

    await UserModel.updateAvatarById(req.user.id, avatarUrl);
    const user = await UserModel.findById(req.user.id);
    return res.json({ success: true, message: 'Avatar updated.', data: user });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteAvatar = async (req, res) => {
  try {
    await UserModel.updateAvatarById(req.user.id, null);
    const user = await UserModel.findById(req.user.id);
    return res.json({ success: true, message: 'Avatar removed.', data: user });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
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
};
