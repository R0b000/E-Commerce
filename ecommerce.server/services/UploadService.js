const cloudinary = require('cloudinary').v2;
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');

// Ensure Cloudinary is configured
cloudinary.config();

class UploadService {
  constructor() {
    this.defaultFolder = 'HimalayaOnlineShop';
  }

  /**
   * Upload single buffer to Cloudinary inside HimalayaOnlineShop folder
   */
  async uploadBuffer(buffer, originalname = 'upload', folder = this.defaultFolder) {
    return new Promise((resolve, reject) => {
      // Clean filename for public ID
      const safeName = originalname
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');

      const uploadOptions = {
        folder: folder || this.defaultFolder,
        resource_type: 'auto',
        public_id: `${Date.now()}_${safeName}`,
        overwrite: false,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('[UploadService] Cloudinary upload error:', error);
            return reject(error);
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            created_at: result.created_at,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Upload single image file from Multer
   */
  async uploadSingleImage(file, folder = this.defaultFolder) {
    try {
      if (!file || !file.buffer) {
        return ApiResponse.fail('No image file provided for upload', [], 400);
      }

      const result = await this.uploadBuffer(file.buffer, file.originalname, folder);
      return ApiResponse.success(result, ['Image uploaded to Cloudinary successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Upload multiple image files from Multer
   */
  async uploadMultipleImages(files = [], folder = this.defaultFolder) {
    try {
      if (!Array.isArray(files) || files.length === 0) {
        return ApiResponse.fail('No image files provided for upload', [], 400);
      }

      const uploadPromises = files.map((file) =>
        this.uploadBuffer(file.buffer, file.originalname, folder)
      );

      const results = await Promise.all(uploadPromises);
      const urls = results.map((r) => r.url);

      return ApiResponse.success(
        {
          urls,
          files: results,
          count: results.length,
        },
        ['Images uploaded to Cloudinary successfully']
      );
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Remove asset from Cloudinary
   */
  async deleteImage(publicId) {
    try {
      if (!publicId) {
        return ApiResponse.fail('Public ID is required to delete image', [], 400);
      }

      const result = await cloudinary.uploader.destroy(publicId);
      return ApiResponse.success(result, ['Image deleted from Cloudinary']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }
}

module.exports = { UploadService };
