const { Router } = require('express');
const { CategoryService } = require('../services/CategoryService');
const { authenticateToken, requireRole } = require('../middleware/rbacMiddleware');

const categoryRouter = Router();
const categoryService = new CategoryService();

// Public: list all categories
categoryRouter.get('/', async (req, res) => {
  const result = await categoryService.getAllCategories();
  res.status(result.statusCode || 200).json(result);
});

// Public: get category details
categoryRouter.get('/:id', async (req, res) => {
  const result = await categoryService.getCategoryById(req.params.id);
  res.status(result.statusCode || 200).json(result);
});

// Admin: create category
categoryRouter.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await categoryService.createCategory(req.body);
  res.status(result.statusCode || 201).json(result);
});

// Admin: update category
categoryRouter.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await categoryService.updateCategory(req.params.id, req.body);
  res.status(result.statusCode || 200).json(result);
});

// Admin: delete category
categoryRouter.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id);
  res.status(result.statusCode || 200).json(result);
});

module.exports = { categoryRouter };
