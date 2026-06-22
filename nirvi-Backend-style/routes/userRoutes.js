const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserRole,
} = require('../controllers/userController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// All user management routes require admin access
router.use(authenticate, authorizeAdmin);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.delete('/:id', deleteUser);
router.put('/:id/role', updateUserRole);

module.exports = router;
