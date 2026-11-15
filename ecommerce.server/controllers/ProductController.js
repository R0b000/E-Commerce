const { Router } = require('express');
const { ProductService } = require('../services/ProductService');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/rbacMiddleware');

const productRouter = Router();
const productService = new ProductService();

// Public / Seller / Admin: list products with role filtering
productRouter.get('/', optionalAuth, async (req, res) => {
  const result = await productService.getProducts(req.query, req.user);
  res.status(result.statusCode || 200).json(result);
});

// Public / Seller / Admin: get product by ID
productRouter.get('/:id', optionalAuth, async (req, res) => {
  const result = await productService.getProductById(req.params.id, req.user);
  res.status(result.statusCode || 200).json(result);
});

// Admin & Seller: create product (seller products automatically bound to seller)
productRouter.post('/', authenticateToken, requireRole('admin', 'seller'), async (req, res) => {
  const result = await productService.createProduct(req.body, req.user);
  res.status(result.statusCode || 201).json(result);
});

// Admin & Seller: update product (seller can only update their own products)
productRouter.put('/:id', authenticateToken, requireRole('admin', 'seller'), async (req, res) => {
  const result = await productService.updateProduct(req.params.id, req.body, req.user);
  res.status(result.statusCode || 200).json(result);
});

// Admin & Seller: delete product (seller can only delete their own products)
productRouter.delete('/:id', authenticateToken, requireRole('admin', 'seller'), async (req, res) => {
  const result = await productService.deleteProduct(req.params.id, req.user);
  res.status(result.statusCode || 200).json(result);
});

// Admin & Seller: quick update stock (seller can only update their own products)
productRouter.patch('/:id/stock', authenticateToken, requireRole('admin', 'seller'), async (req, res) => {
  const { stock } = req.body;
  const result = await productService.updateStock(req.params.id, stock, req.user);
  res.status(result.statusCode || 200).json(result);
});

module.exports = { productRouter };
