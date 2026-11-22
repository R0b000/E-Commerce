const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');

// Ensure Cloudinary is configured
cloudinary.config();

class UploadService {
  constructor() {
    this.rootFolder = 'HimalayaOnlineShop';
    this.temporaryFolder = 'HimalayaOnlineShop/Temporary';
    this.defaultFolder = this.temporaryFolder;
  }

  /**
   * Upload single buffer to Cloudinary with guaranteed unique ID.
   * Defaults to HimalayaOnlineShop/Temporary for uncommitted staging.
   */
  async uploadBuffer(buffer, originalname = 'upload', folder = this.defaultFolder) {
    return new Promise((resolve, reject) => {
      // Clean filename for public ID and guarantee high-entropy uniqueness
      const safeName = originalname
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 40);

      const uniqueEntropy = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const uniquePublicId = `${uniqueEntropy}_${safeName}`;

      const uploadOptions = {
        folder: folder || this.defaultFolder,
        resource_type: 'auto',
        public_id: uniquePublicId,
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
   * Upload single image file from Multer (defaults to HimalayaOnlineShop/Temporary)
   */
  async uploadSingleImage(file, folder = this.defaultFolder) {
    try {
      if (!file || !file.buffer) {
        return ApiResponse.fail('No image file provided for upload', [], 400);
      }

      const result = await this.uploadBuffer(file.buffer, file.originalname, folder);
      return ApiResponse.success(result, ['Image uploaded to staging successfully']);
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
        ['Images uploaded to staging successfully']
      );
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Move/Commit image from Temporary staging to permanent folder
   * e.g., from "HimalayaOnlineShop/Temporary/1732312345_a1b2_logo"
   * to "HimalayaOnlineShop/Admin/Brands/1732312345_a1b2_logo"
   */
  async commitImage(publicId, targetSubfolder = 'Admin/Brands') {
    try {
      if (!publicId) {
        return ApiResponse.fail('Public ID is required to commit image', [], 400);
      }

      // If asset is not in Temporary folder, it's already committed
      if (!publicId.includes('/Temporary/') && !publicId.startsWith('HimalayaOnlineShop/Temporary')) {
        return ApiResponse.success({ public_id: publicId }, ['Image is already in permanent storage']);
      }

      const fileName = publicId.split('/').pop();
      const sanitizedFolder = targetSubfolder.replace(/^\/+|\/+$/g, '');
      const newPublicId = `${this.rootFolder}/${sanitizedFolder}/${fileName}`;

      // Instant Cloudinary rename / move
      const result = await cloudinary.uploader.rename(publicId, newPublicId, {
        overwrite: true,
      });

      return ApiResponse.success(
        {
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
        },
        ['Image committed to permanent folder successfully']
      );
    } catch (error) {
      console.error('[UploadService] Commit error:', error);
      return ApiResponse.fail(`Failed to commit image: ${error.message}`, [error.message], 500);
    }
  }

  /**
   * Auto-delete uncommitted temporary files older than maxAgeHours (default 24h)
   */
  async cleanupTemporaryUploads(maxAgeHours = 24) {
    try {
      const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
      console.log(`[UploadService] Scanning ${this.temporaryFolder} for uncommitted files older than ${maxAgeHours}h (cutoff: ${cutoffTime})...`);

      // Search Cloudinary for temporary resources created before cutoff
      const searchResult = await cloudinary.search
        .expression(`folder:"${this.temporaryFolder}" AND created_at<=${cutoffTime}`)
        .max_results(100)
        .execute();

      const resources = searchResult.resources || [];
      if (resources.length === 0) {
        console.log(`[UploadService] No expired temporary files found.`);
        return ApiResponse.success({ deletedCount: 0 }, ['No expired temporary files found']);
      }

      const publicIds = resources.map((r) => r.public_id);
      console.log(`[UploadService] Deleting ${publicIds.length} expired temporary file(s)...`);
      const deleteResult = await cloudinary.api.delete_resources(publicIds);

      console.log(`[UploadService] Cleanup finished. Deleted ${publicIds.length} file(s).`);
      return ApiResponse.success(
        {
          deletedCount: publicIds.length,
          publicIds,
          details: deleteResult,
        },
        [`Successfully cleaned up ${publicIds.length} expired temporary file(s)`]
      );
    } catch (error) {
      console.error('[UploadService] Cleanup error:', error);
      return ApiResponse.fail(`Failed to clean up temporary uploads: ${error.message}`, [error.message], 500);
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
