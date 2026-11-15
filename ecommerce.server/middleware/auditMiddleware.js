const { AuditLog } = require('../models/database/AuditLog');
const { extractClientInfo } = require('../../auth.server/middleware/deviceTrackerMiddleware');

/**
 * Derives a human-readable action name from HTTP method and path
 */
function deriveActionName(method, path) {
  const p = path.toLowerCase();

  if (p.includes('/login')) return 'USER_LOGIN';
  if (p.includes('/register')) return 'USER_REGISTER';
  if (p.includes('/fido2')) return 'FIDO2_PASSKEY_AUTH';
  if (p.includes('/google')) return 'GOOGLE_AUTH';

  if (p.includes('/products')) {
    if (method === 'POST') return 'CREATE_PRODUCT';
    if (method === 'PUT') return 'UPDATE_PRODUCT';
    if (method === 'DELETE') return 'DELETE_PRODUCT';
    if (method === 'PATCH') return 'UPDATE_STOCK';
    return 'VIEW_PRODUCTS';
  }

  if (p.includes('/orders')) {
    if (method === 'POST') return 'PLACE_ORDER';
    if (method === 'PATCH') return 'UPDATE_ORDER_STATUS';
    if (method === 'DELETE') return 'CANCEL_ORDER';
    return 'VIEW_ORDERS';
  }

  if (p.includes('/customers')) {
    if (method === 'POST') return 'CREATE_CUSTOMER';
    return 'VIEW_CUSTOMERS';
  }

  if (p.includes('/reviews')) {
    if (method === 'POST') return 'SUBMIT_REVIEW';
    if (method === 'PATCH') return 'MODERATE_REVIEW';
    if (method === 'DELETE') return 'DELETE_REVIEW';
    return 'VIEW_REVIEWS';
  }

  if (p.includes('/roles')) {
    if (method === 'PUT' || method === 'POST') return 'UPDATE_ROLE_PERMISSIONS';
    return 'VIEW_ROLES';
  }

  if (p.includes('/permissions')) {
    if (method === 'POST') return 'CREATE_PERMISSION';
    return 'VIEW_PERMISSIONS';
  }

  if (p.includes('/menus')) {
    if (method === 'POST') return 'CREATE_MENU';
    if (method === 'PUT') return 'UPDATE_MENU';
    if (method === 'DELETE') return 'DELETE_MENU';
    return 'VIEW_MENUS';
  }

  return `${method}_${path.split('/').filter(Boolean).join('_').toUpperCase()}`;
}

/**
 * Middleware that logs all mutating operations and important user actions
 */
const auditLogMiddleware = (req, res, next) => {
  // Only log API operations
  if (!req.path.startsWith('/api')) {
    return next();
  }

  // Record time of request
  const startTime = Date.now();

  res.on('finish', async () => {
    try {
      const { ip, macOrDevice, userAgent } = extractClientInfo(req);

      // We focus primarily on mutations (POST, PUT, PATCH, DELETE) and auth routes to avoid flooding
      const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
      const isKeyRead = req.path.includes('/login') || req.path.includes('/audit');

      if (!isMutation && !isKeyRead) {
        return;
      }

      const user = req.user;
      const action = deriveActionName(req.method, req.path);

      // Sanitize body to avoid storing passwords
      const safeBody = { ...req.body };
      delete safeBody.password;
      delete safeBody.token;
      delete safeBody.currentPassword;
      delete safeBody.newPassword;

      await AuditLog.create({
        userId: user?.id || null,
        userEmail: user?.email || (req.body?.email ? req.body.email : 'anonymous'),
        userName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Guest',
        userRole: user?.role || 'guest',
        action,
        method: req.method,
        endpoint: req.originalUrl || req.path,
        ipAddress: ip,
        userAgent,
        macOrDevice,
        statusCode: res.statusCode,
        details: {
          params: req.params,
          query: req.query,
          payloadSummary: safeBody,
          durationMs: Date.now() - startTime,
        },
      });
    } catch (err) {
      console.error('[AuditLogMiddleware] Failed to log user action:', err.message);
    }
  });

  next();
};

module.exports = { auditLogMiddleware };
