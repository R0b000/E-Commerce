const { Router } = require('express');
const { AuditService } = require('../services/AuditService');
const { authenticateToken, requireRole } = require('../middleware/rbacMiddleware');

const auditRouter = Router();
const auditService = new AuditService();

// Admin only: Get user activity audit logs
auditRouter.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await auditService.getLogs(req.query);
  res.status(result.statusCode || 200).json(result);
});

module.exports = { auditRouter };
