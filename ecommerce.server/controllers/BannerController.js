const { Router } = require('express');
const { BannerService } = require('../services/BannerService');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/rbacMiddleware');

const bannerRouter = Router();
const bannerService = new BannerService();

// Get active banners for public storefront (filtered by current date & time)
bannerRouter.get('/active', optionalAuth, async (req, res) => {
  const { position, clientTime } = req.query;
  const result = await bannerService.getActiveBanners({ position, clientTime });
  res.status(result.statusCode || 200).json(result);
});

// Record banner click for analytics
bannerRouter.post('/:id/click', optionalAuth, async (req, res) => {
  const result = await bannerService.recordClick(req.params.id);
  res.status(result.statusCode || 200).json(result);
});

// Admin: List all banners with scheduling metrics & filters
bannerRouter.get('/', authenticateToken, async (req, res) => {
  const result = await bannerService.getBanners(req.query);
  res.status(result.statusCode || 200).json(result);
});

// Admin: Get single banner
bannerRouter.get('/:id', authenticateToken, async (req, res) => {
  const result = await bannerService.getBannerById(req.params.id);
  res.status(result.statusCode || 200).json(result);
});

// Admin: Create new banner
bannerRouter.post('/', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  const result = await bannerService.createBanner(req.body, req.user?.id);
  res.status(result.statusCode || 200).json(result);
});

// Admin: Update banner
bannerRouter.put('/:id', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  const result = await bannerService.updateBanner(req.params.id, req.body);
  res.status(result.statusCode || 200).json(result);
});

// Admin: Delete banner
bannerRouter.delete('/:id', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  const result = await bannerService.deleteBanner(req.params.id);
  res.status(result.statusCode || 200).json(result);
});

module.exports = { bannerRouter };
