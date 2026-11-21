const { Router } = require('express');
const { BillingService } = require('../services/BillingService');
const { authenticateToken, requireRole } = require('../middleware/rbacMiddleware');

const billingRouter = Router();
const billingService = new BillingService();

// Get billing KPI stats
billingRouter.get('/stats', authenticateToken, async (req, res) => {
  const result = await billingService.getBillingStats(req.user);
  res.status(result.statusCode || 200).json(result);
});

// Get all bills / invoices with search, filters, pagination
billingRouter.get('/', authenticateToken, async (req, res) => {
  const result = await billingService.getBillings(req.query, req.user);
  res.status(result.statusCode || 200).json(result);
});

// Get single invoice by ID
billingRouter.get('/:id', authenticateToken, async (req, res) => {
  const result = await billingService.getBillingById(req.params.id, req.user);
  res.status(result.statusCode || 200).json(result);
});

// Create manual invoice
billingRouter.post('/', authenticateToken, requireRole('admin', 'seller', 'manager'), async (req, res) => {
  const result = await billingService.createBilling(req.body, req.user);
  res.status(result.statusCode || 201).json(result);
});

// Update invoice payment status
billingRouter.patch('/:id/status', authenticateToken, requireRole('admin', 'seller', 'manager'), async (req, res) => {
  const result = await billingService.updateBillingStatus(req.params.id, req.body, req.user);
  res.status(result.statusCode || 200).json(result);
});

// Delete / Void invoice
billingRouter.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await billingService.deleteBilling(req.params.id, req.user);
  res.status(result.statusCode || 200).json(result);
});

module.exports = { billingRouter };
