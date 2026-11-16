const { User } = require('../models/database/User');

/**
 * Extracts normalized client IP and MAC / device fingerprint
 */
function extractClientInfo(req) {
  let ip =
    req.headers['x-forwarded-for'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';

  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  const macOrDevice =
    req.headers['x-client-mac'] ||
    req.headers['x-device-fingerprint'] ||
    req.headers['x-mac-address'] ||
    req.headers['device-id'] ||
    Buffer.from(req.headers['user-agent'] || 'device').toString('base64').substring(0, 16);

  const userAgent = req.headers['user-agent'] || 'Unknown Device';

  return { ip, macOrDevice, userAgent };
}

/**
 * Records device login session for user
 */
async function recordUserDevice(userId, req) {
  try {
    const { ip, macOrDevice, userAgent } = extractClientInfo(req);

    const user = await User.findById(userId);
    if (!user) return;

    user.lastLoginIp = ip;

    if (!Array.isArray(user.deviceLogs)) {
      user.deviceLogs = [];
    }

    // Update existing matching device log or push new one
    const existingIndex = user.deviceLogs.findIndex(
      (d) => d.ip === ip || (macOrDevice && d.macOrDevice === macOrDevice)
    );

    if (existingIndex >= 0) {
      user.deviceLogs[existingIndex].lastLoginAt = new Date();
      user.deviceLogs[existingIndex].ip = ip;
      user.deviceLogs[existingIndex].userAgent = userAgent;
      user.deviceLogs[existingIndex].macOrDevice = macOrDevice;
    } else {
      user.deviceLogs.push({
        ip,
        macOrDevice,
        userAgent,
        lastLoginAt: new Date(),
      });
      // Keep only last 10 devices
      if (user.deviceLogs.length > 10) {
        user.deviceLogs.shift();
      }
    }

    await user.save();
  } catch (err) {
    console.error('[DeviceTracker] Error recording user device:', err.message);
  }
}

/**
 * Recognizes returning user by matching IP and/or MAC/Device fingerprint
 */
async function recognizeDevice(req) {
  try {
    const { ip, macOrDevice } = extractClientInfo(req);

    // Look for user whose lastLoginIp matches this IP, or has deviceLogs with this IP or MAC
    const user = await User.findOne({
      $or: [
        { lastLoginIp: ip },
        { 'deviceLogs.ip': ip },
        ...(macOrDevice ? [{ 'deviceLogs.macOrDevice': macOrDevice }] : []),
      ],
      isActive: true,
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (!user) {
      return { recognized: false, clientInfo: { ip, macOrDevice } };
    }

    const hasRegisteredPasskey = Array.isArray(user.fidoCredentials) && user.fidoCredentials.length > 0;

    // CRITICAL: Only recognize device for FIDO2 instant login IF the user has registered FIDO2 passkeys!
    if (!hasRegisteredPasskey) {
      return {
        recognized: false,
        clientInfo: { ip, macOrDevice },
        user: null,
      };
    }

    return {
      recognized: true,
      clientInfo: { ip, macOrDevice },
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.email.split('@')[0],
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        hasPasskey: true,
      },
    };
  } catch (err) {
    console.error('[DeviceTracker] Error recognizing device:', err.message);
    return { recognized: false, error: err.message };
  }
}

module.exports = {
  extractClientInfo,
  recordUserDevice,
  recognizeDevice,
};
