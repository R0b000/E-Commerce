const jwt = require('jsonwebtoken');
const { config } = require('../../Shared/API/config/config');
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');

/**
 * Normalizes role string ('user' -> 'customer')
 */
const normalizeRole = (role) => {
  if (!role) return 'customer';
  const r = role.toLowerCase().trim();
  if (r === 'user') return 'customer';
  return r;
};

/**
 * Authenticates JWT token from Authorization header
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(ApiResponse.fail('Authentication required. Please sign in.', [], 401));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    req.user = {
      id: decoded.id || decoded._id,
      email: decoded.email,
      role: normalizeRole(decoded.role),
      rawRole: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json(ApiResponse.fail('Invalid or expired token. Please sign in again.', [error.message], 401));
  }
};

/**
 * Optional authentication: decodes token if present, but doesn't block if absent
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = {
        id: decoded.id || decoded._id,
        email: decoded.email,
        role: normalizeRole(decoded.role),
        rawRole: decoded.role,
      };
    }
    next();
  } catch {
    next();
  }
};

/**
 * Role-Based Access Control guard
 * Usage: requireRole('admin') or requireRole('admin', 'seller')
 */
const requireRole = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(ApiResponse.fail('Access denied. Authentication required.', [], 401));
    }

    const userRole = normalizeRole(req.user.role);

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json(
        ApiResponse.fail(
          `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${userRole}.`,
          [],
          403
        )
      );
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  normalizeRole,
};
