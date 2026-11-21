const { AuditLog } = require('../models/database/AuditLog');
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');

class AuditService {
  async getLogs(queryParams = {}) {
    try {
      const { search, action, limit = 100 } = queryParams;
      const filter = {};

      if (action && action !== 'all') {
        filter.action = action;
      }

      if (search) {
        filter.$or = [
          { userEmail: { $regex: search, $options: 'i' } },
          { userName: { $regex: search, $options: 'i' } },
          { action: { $regex: search, $options: 'i' } },
          { ipAddress: { $regex: search, $options: 'i' } },
          { endpoint: { $regex: search, $options: 'i' } },
        ];
      }

      const logs = await AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      return ApiResponse.success(
        logs.map((l) => ({ ...l, id: l._id.toString() }))
      );
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  async getUserLogs(userEmail, queryParams = {}) {
    try {
      const { search, action, limit = 50 } = queryParams;
      const filter = {};

      if (userEmail) {
        filter.userEmail = userEmail;
      }

      if (action && action !== 'all') {
        filter.action = action;
      }

      if (search) {
        filter.$or = [
          { action: { $regex: search, $options: 'i' } },
          { ipAddress: { $regex: search, $options: 'i' } },
          { endpoint: { $regex: search, $options: 'i' } },
        ];
      }

      const logs = await AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      return ApiResponse.success(
        logs.map((l) => ({ ...l, id: l._id.toString() }))
      );
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }
}

module.exports = { AuditService };
