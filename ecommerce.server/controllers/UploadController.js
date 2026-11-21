const { Router } = require('express');
const { UploadService } = require('../services/UploadService');
const { uploadSingle, uploadMultiple } = require('../middleware/uploadMiddleware');
const { optionalAuth } = require('../middleware/rbacMiddleware');

const uploadRouter = Router();
const uploadService = new UploadService();

/**
 * POST /ecommerce/upload/image
 * Upload a single image to Cloudinary (folder: HimalayaOnlineShop)
 */
uploadRouter.post('/image', optionalAuth, (req, res, next) => {
  uploadSingle(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        messages: [err.message || 'File upload error'],
      });
    }

    try {
      const folder = req.body?.folder || 'HimalayaOnlineShop';
      const result = await uploadService.uploadSingleImage(req.file, folder);
      res.status(result.statusCode || 200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        messages: ['Failed to upload image to Cloudinary'],
        errors: [error.message],
      });
    }
  });
});

/**
 * POST /ecommerce/upload/multiple
 * Upload up to 10 images to Cloudinary (folder: HimalayaOnlineShop)
 */
uploadRouter.post('/multiple', optionalAuth, (req, res, next) => {
  uploadMultiple(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        messages: [err.message || 'Batch file upload error'],
      });
    }

    try {
      const folder = req.body?.folder || 'HimalayaOnlineShop';
      const result = await uploadService.uploadMultipleImages(req.files, folder);
      res.status(result.statusCode || 200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        messages: ['Failed to batch upload images to Cloudinary'],
        errors: [error.message],
      });
    }
  });
});

/**
 * DELETE /ecommerce/upload
 * Delete an image by publicId from Cloudinary
 */
uploadRouter.delete('/', optionalAuth, async (req, res) => {
  try {
    const publicId = req.query.publicId || req.body.publicId;
    const result = await uploadService.deleteImage(publicId);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to delete image from Cloudinary'],
      errors: [error.message],
    });
  }
});

module.exports = { uploadRouter };
