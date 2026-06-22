const { pool } = require('../config/db');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

// ── Find user by email ───────────────────────────────────────────────────────
const findByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM vris_users WHERE LOWER(TRIM(email)) = ?', [normalizeEmail(email)]);
  return rows[0] || null;
};

const findByGoogleId = async (googleId) => {
  const [rows] = await pool.query('SELECT * FROM vris_users WHERE google_id = ?', [googleId]);
  return rows[0] || null;
};

// ── Find user by ID ──────────────────────────────────────────────────────────
const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT id, name, email, phone, phone_verified, default_address_enabled, address_line1, address_line2, city, state, pincode, role, status, created_at, updated_at, dob, gender, avatar_url
     FROM vris_users
     WHERE id = ?`,
    [id],
  );
  return rows[0] || null;
};

// ── Create a new user ────────────────────────────────────────────────────────
const create = async ({
  name,
  email,
  password,
  role = 'user',
  phone = null,
  addressLine1 = null,
  addressLine2 = null,
  city = null,
  state = null,
  pincode = null,
  dob = null,
  gender = null,
  phoneVerified = false,
  defaultAddressEnabled = true,
}) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = String(phone || '').trim() || null;
  const normalizedAddressLine1 = String(addressLine1 || '').trim() || null;
  const normalizedAddressLine2 = String(addressLine2 || '').trim() || null;
  const normalizedCity = String(city || '').trim() || null;
  const normalizedState = String(state || '').trim() || null;
  const normalizedPincode = String(pincode || '').trim() || null;
  const normalizedPhoneVerified = Boolean(phoneVerified);
  const normalizedDefaultAddressEnabled = Boolean(defaultAddressEnabled);
  const normalizedDob = dob ? String(dob).trim() : null;
  const normalizedGender = gender ? String(gender).trim() : null;
  const [result] = await pool.query(
    `INSERT INTO vris_users (name, email, password, phone, phone_verified, default_address_enabled, address_line1, address_line2, city, state, pincode, dob, gender, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, normalizedEmail, password, normalizedPhone, normalizedPhoneVerified, normalizedDefaultAddressEnabled, normalizedAddressLine1, normalizedAddressLine2, normalizedCity, normalizedState, normalizedPincode, normalizedDob, normalizedGender, role],
  );
  return {
    id: result.insertId,
    name,
    email: normalizedEmail,
    phone: normalizedPhone,
    phone_verified: normalizedPhoneVerified,
    default_address_enabled: normalizedDefaultAddressEnabled,
    address_line1: normalizedAddressLine1,
    address_line2: normalizedAddressLine2,
    city: normalizedCity,
    state: normalizedState,
    pincode: normalizedPincode,
    dob: normalizedDob,
    gender: normalizedGender,
    role,
  };
};

const createGoogleUser = async ({ name, email, googleId, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const [result] = await pool.query(
    'INSERT INTO vris_users (name, email, password, role, google_id) VALUES (?, ?, ?, ?, ?)',
    [name, normalizedEmail, password, 'user', googleId],
  );
  return {
    id: result.insertId,
    name,
    email: normalizedEmail,
    role: 'user',
    google_id: googleId,
  };
};

const linkGoogleIdByEmail = async (email, googleId) => {
  const [result] = await pool.query(
    'UPDATE vris_users SET google_id = ? WHERE LOWER(TRIM(email)) = ?',
    [googleId, normalizeEmail(email)],
  );
  return result.affectedRows > 0;
};

// ── Get all users (admin) ────────────────────────────────────────────────────
const findAll = async () => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, status, created_at, updated_at FROM vris_users ORDER BY created_at DESC',
  );
  return rows;
};

// ── Delete user ──────────────────────────────────────────────────────────────
const deleteById = async (id) => {
  const [result] = await pool.query('DELETE FROM vris_users WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// ── Update role ──────────────────────────────────────────────────────────────
const updateRole = async (id, role) => {
  const [result] = await pool.query('UPDATE vris_users SET role = ? WHERE id = ?', [role, id]);
  return result.affectedRows > 0;
};

const updateProfileById = async (id, {
  name,
  phone,
  addressLine1,
  addressLine2,
  city,
  state,
  pincode,
  dob,
  gender,
  defaultAddressEnabled,
}) => {
  const normalizedName = String(name || '').trim();
  const normalizedPhone = String(phone || '').trim() || null;
  const normalizedAddressLine1 = String(addressLine1 || '').trim() || null;
  const normalizedAddressLine2 = String(addressLine2 || '').trim() || null;
  const normalizedCity = String(city || '').trim() || null;
  const normalizedState = String(state || '').trim() || null;
  const normalizedPincode = String(pincode || '').trim() || null;
  const normalizedDob = dob ? String(dob).trim() : null;
  const normalizedGender = gender ? String(gender).trim() : null;
  const normalizedDefaultAddressEnabled = Boolean(defaultAddressEnabled);
  const [result] = await pool.query(
    `UPDATE vris_users
     SET name = ?, phone = ?, default_address_enabled = ?, address_line1 = ?, address_line2 = ?, city = ?, state = ?, pincode = ?, dob = ?, gender = ?
     WHERE id = ?`,
    [normalizedName, normalizedPhone, normalizedDefaultAddressEnabled, normalizedAddressLine1, normalizedAddressLine2, normalizedCity, normalizedState, normalizedPincode, normalizedDob, normalizedGender, id],
  );
  return result.affectedRows > 0;
};

const updatePasswordById = async (id, hashedPassword) => {
  const [result] = await pool.query(
    `UPDATE vris_users
     SET password = ?, reset_otp_verified = FALSE
     WHERE id = ?`,
    [hashedPassword, id],
  );
  return result.affectedRows > 0;
};

const setPhoneVerificationOtpById = async (id, otp, expiresAt) => {
  const [result] = await pool.query(
    `UPDATE vris_users
     SET phone_otp = ?, phone_otp_expires_at = ?, phone_verified = FALSE
     WHERE id = ?`,
    [otp, expiresAt, id],
  );
  return result.affectedRows > 0;
};

const verifyPhoneById = async (id) => {
  const [result] = await pool.query(
    `UPDATE vris_users
     SET phone_verified = TRUE, phone_otp = NULL, phone_otp_expires_at = NULL
     WHERE id = ?`,
    [id],
  );
  return result.affectedRows > 0;
};

// ── Password reset OTP helpers ────────────────────────────────────────────────
const setPasswordResetOtpByEmail = async (email, otp, expiresAt) => {
  const [result] = await pool.query(
    `UPDATE vris_users
     SET reset_otp = ?, otp = ?, reset_otp_expires_at = ?, otp_expiry = ?, reset_otp_verified = FALSE
     WHERE LOWER(TRIM(email)) = ?`,
    [otp, otp, expiresAt, expiresAt, normalizeEmail(email)],
  );
  return result.affectedRows > 0;
};

const markPasswordResetOtpVerifiedByEmail = async (email) => {
  const [result] = await pool.query(
    `UPDATE vris_users
     SET reset_otp_verified = TRUE
     WHERE LOWER(TRIM(email)) = ?`,
    [normalizeEmail(email)],
  );
  return result.affectedRows > 0;
};

const updatePasswordByEmail = async (email, hashedPassword) => {
  const [result] = await pool.query(
    `UPDATE vris_users
     SET password = ?, reset_otp_verified = FALSE
     WHERE LOWER(TRIM(email)) = ?`,
    [hashedPassword, normalizeEmail(email)],
  );
  return result.affectedRows > 0;
};

const clearPasswordResetOtpByEmail = async (email) => {
  const [result] = await pool.query(
    `UPDATE vris_users
     SET reset_otp = NULL, otp = NULL, reset_otp_expires_at = NULL, otp_expiry = NULL, reset_otp_verified = FALSE
     WHERE LOWER(TRIM(email)) = ?`,
    [normalizeEmail(email)],
  );
  return result.affectedRows > 0;
};

const updateAvatarById = async (id, avatarUrl) => {
  const [result] = await pool.query(
    'UPDATE vris_users SET avatar_url = ? WHERE id = ?',
    [avatarUrl, id],
  );
  return result.affectedRows > 0;
};

module.exports = {
  findByEmail,
  findByGoogleId,
  findById,
  create,
  createGoogleUser,
  linkGoogleIdByEmail,
  findAll,
  deleteById,
  updateRole,
  updateProfileById,
  updatePasswordById,
  updateAvatarById,
  setPhoneVerificationOtpById,
  verifyPhoneById,
  setPasswordResetOtpByEmail,
  markPasswordResetOtpVerifiedByEmail,
  updatePasswordByEmail,
  clearPasswordResetOtpByEmail,
};
