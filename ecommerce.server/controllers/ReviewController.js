const { Router } = require('express');
const { ReviewService } = require('../services/ReviewService');
const { optionalAuth, authenticateToken, requireRole } = require('../middleware/rbacMiddleware');

const reviewRouter = Router();
const reviewService = new ReviewService();

// Public / Customer: View reviews (optionally for a specific product)
reviewRouter.get('/', async (req, res) => {
  const result = await reviewService.getReviews(req.query);
  res.status(result.statusCode || 200).json(result);
});

// Authenticated or Guest: Submit product review
reviewRouter.post('/', optionalAuth, async (req, res) => {
  const result = await reviewService.createReview(req.body, req.user);
  res.status(result.statusCode || 201).json(result);
});

// Admin only: Moderate review status (approve/reject)
reviewRouter.patch('/:id/status', authenticateToken, requireRole('admin', 'support'), async (req, res) => {
  const result = await reviewService.updateReviewStatus(req.params.id, req.body.status);
  res.status(result.statusCode || 200).json(result);
});

// Admin only: Delete review
reviewRouter.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await reviewService.deleteReview(req.params.id);
  res.status(result.statusCode || 200).json(result);
});

module.exports = { reviewRouter };
