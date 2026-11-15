const { Router } = require('express');
const { OrderService } = require('../services/OrderService');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/rbacMiddleware');

const orderRouter = Router();
const orderService = new OrderService();

// Role-Based: Admin sees all, Seller sees their product orders, Customer sees their own orders
orderRouter.get('/', authenticateToken, async (req, res) => {
  const result = await orderService.getOrders(req.query, req.user);
  res.status(result.statusCode || 200).json(result);
});

// Role-Based: Get single order by ID with ownership verification
orderRouter.get('/:id', authenticateToken, async (req, res) => {
  const result = await orderService.getOrderById(req.params.id, req.user);
  res.status(result.statusCode || 200).json(result);
});

// Public / Customer: Create new order
orderRouter.post('/', optionalAuth, async (req, res) => {
  const result = await orderService.createOrder(req.body, req.user);
  res.status(result.statusCode || 201).json(result);
});

// Admin & Seller: Update order status / tracking number
orderRouter.patch('/:id/status', authenticateToken, requireRole('admin', 'seller'), async (req, res) => {
  const result = await orderService.updateOrderStatus(req.params.id, req.body, req.user);
  res.status(result.statusCode || 200).json(result);
});

// Admin: Delete order
orderRouter.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await orderService.deleteOrder(req.params.id, req.user);
  res.status(result.statusCode || 200).json(result);
});

module.exports = { orderRouter };
