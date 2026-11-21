const { Router } = require('express');
const { DiscountService } = require('../services/DiscountService');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/rbacMiddleware');

const discountRouter = Router();
const discountService = new DiscountService();

// List discounts (Admin / Manager / Seller)
discountRouter.get('/', authenticateToken, async (req, res) => {
  const result = await discountService.getDiscounts(req.query);
  res.status(result.statusCode || 200).json(result);
});

// Validate coupon code (Public / Shoppers during checkout)
discountRouter.post('/validate', optionalAuth, async (req, res) => {
  const result = await discountService.validateCoupon(req.body);
  res.status(result.statusCode || 200).json(result);
});

// Get single discount
discountRouter.get('/:id', authenticateToken, async (req, res) => {
  const result = await discountService.getDiscountById(req.params.id);
  res.status(result.statusCode || 200).json(result);
});

// Create new discount (Admin / Manager)
discountRouter.post('/', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  const result = await discountService.createDiscount(req.body, req.user);
  res.status(result.statusCode || 201).json(result);
});

// Update discount
discountRouter.put('/:id', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  const result = await discountService.updateDiscount(req.params.id, req.body);
  res.status(result.statusCode || 200).json(result);
});

// Delete discount
discountRouter.delete('/:id', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  const result = await discountService.deleteDiscount(req.params.id);
  res.status(result.statusCode || 200).json(result);
});

module.exports = { discountRouter };
