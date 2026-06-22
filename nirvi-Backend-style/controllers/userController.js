const UserModel = require('../models/userModel');

// ── Get all users (admin) ────────────────────────────────────────────────────
const getAllUsers = async (_req, res) => {
  try {
    const users = await UserModel.findAll();
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Get single user (admin) ──────────────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Delete user (admin) ──────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    // Prevent admins from deleting themselves
    if (parseInt(req.params.id, 10) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account from the admin panel.',
      });
    }

    const deleted = await UserModel.deleteById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Update user role (admin) ─────────────────────────────────────────────────
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "user" or "admin".',
      });
    }

    // Prevent admins from demoting themselves
    if (parseInt(req.params.id, 10) === req.user.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role.',
      });
    }

    const updated = await UserModel.updateRole(req.params.id, role);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: `User role updated to "${role}".` });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserRole,
};
