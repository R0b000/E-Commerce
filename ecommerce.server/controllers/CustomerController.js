const { Router } = require('express');
const { CustomerService } = require('../services/CustomerService');
const { authenticateToken, requireRole } = require('../middleware/rbacMiddleware');

const customerRouter = Router();
const customerService = new CustomerService();

// Admin only: list all registered customers
customerRouter.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await customerService.getCustomers(req.query);
  res.status(result.statusCode || 200).json(result);
});

// Admin only: create a new customer
customerRouter.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await customerService.createCustomer(req.body);
  res.status(result.statusCode || 200).json(result);
});

module.exports = { customerRouter };
