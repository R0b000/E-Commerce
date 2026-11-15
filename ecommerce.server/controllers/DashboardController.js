const { Router } = require('express');
const { DashboardService } = require('../services/DashboardService');
const { authenticateToken, requireRole } = require('../middleware/rbacMiddleware');

const dashboardRouter = Router();
const dashboardService = new DashboardService();

// Role-Based Dashboard Metrics:
// Returns personalized metrics based on user role (admin, seller, customer, manager, support)
dashboardRouter.get('/overview', authenticateToken, async (req, res) => {
  const result = await dashboardService.getMetrics(req.user);
  res.status(result.statusCode || 200).json(result);
});

module.exports = { dashboardRouter };
