const jwt = require('jsonwebtoken');
const { config } = require('../../Shared/API/config/config');
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');

const adminMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(ApiResponse.fail('Admin access required. No token provided.', [], 401));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    if (decoded.role !== 'admin') {
      return res.status(403).json(ApiResponse.fail('Access denied. Administrator privileges required.', [], 403));
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json(ApiResponse.fail('Invalid or expired session. Please log in again.', [error.message], 401));
  }
};

module.exports = { adminMiddleware };
