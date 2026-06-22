const jwt = require('jsonwebtoken');
const AUTH_COOKIE_NAME = 'nirvi_token';

/**
 * Verify JWT token from the Authorization header.
 * Attaches decoded user payload to `req.user`.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;
    const cookieToken = req.cookies?.[AUTH_COOKIE_NAME] || null;
    const token = headerToken || cookieToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { id, email, role }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

/**
 * Optional authentication: attaches `req.user` if token is valid, but doesn't error if missing/invalid.
 */
const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;
    const cookieToken = req.cookies?.[AUTH_COOKIE_NAME] || null;
    const token = headerToken || cookieToken;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // Ignore error, just proceed without req.user
  }
  next();
};

/**
 * Allow only users with the 'admin' role.
 * Must be used AFTER the authenticate middleware.
 */
const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }

  next();
};

module.exports = { authenticate, optionalAuthenticate, authorizeAdmin };
