const { Router } = require('express');
const { DashboardService } = require('../services/DashboardService');
const { authenticateToken, requireRole } = require('../middleware/rbacMiddleware');

const dashboardRouter = Router();
const dashboardService = new DashboardService();

// Role-Based Dashboard Metrics:
// Admin gets platform-wide metrics; Seller gets only their own sales & product metrics
dashboardRouter.get('/overview', authenticateToken, requireRole('admin', 'seller'), async (req, res) => {
  const result = await dashboardService.getMetrics(req.user);
  res.status(result.statusCode || 200).json(result);
});

module.exports = { dashboardRouter };
