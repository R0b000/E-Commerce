const { Review } = require('../models/database/Review');
const { Product } = require('../models/database/Product');
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');
const { emitNotification } = require('../socket/SocketServer');

class ReviewService {
  /**
   * Fetches reviews with optional product or status filters
   */
  async getReviews(queryParams = {}) {
    try {
      const { product, status, limit = 50 } = queryParams;
      const filter = {};

      if (product) {
        filter.product = product;
      }
      if (status && status !== 'all') {
        filter.status = status;
      }

      const reviews = await Review.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      return ApiResponse.success(
        reviews.map((r) => ({ ...r, id: r._id.toString() }))
      );
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Submits a new customer review and updates the product's aggregate rating
   */
  async createReview(data, user) {
    try {
      const { productId, rating, comment, title } = data;

      if (!productId || !rating || !comment) {
        return ApiResponse.fail('Product ID, rating (1-5), and comment are required', [], 400);
      }

      const productDoc = await Product.findById(productId);
      if (!productDoc) {
        return ApiResponse.fail('Product not found', [], 404);
      }

      const userName = user?.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : data.userName || 'Anonymous Buyer';

      const userEmail = user?.email || data.userEmail || 'buyer@example.com';

      const review = await Review.create({
        product: productDoc._id,
        productName: productDoc.name,
        user: user?.id || null,
        userName,
        userEmail,
        rating: Math.min(5, Math.max(1, Number(rating))),
        title: title || '',
        comment: comment.trim(),
        status: 'approved',
        isVerifiedPurchase: true,
      });

      // Recalculate average rating for product
      const allProductReviews = await Review.find({
        product: productDoc._id,
        status: 'approved',
      });

      const totalRating = allProductReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / (allProductReviews.length || 1);

      productDoc.rating = Math.round(avgRating * 10) / 10;
      productDoc.numReviews = allProductReviews.length;
      await productDoc.save();

      emitNotification({
        title: 'New Customer Review',
        message: `${userName} left a ${rating}-star review on "${productDoc.name}"`,
        type: 'product',
      });

      return ApiResponse.success(
        { ...review.toObject(), id: review._id.toString() },
        ['Review submitted successfully!'],
        201
      );
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Updates review moderation status (approved, rejected, pending)
   */
  async updateReviewStatus(id, status) {
    try {
      const review = await Review.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      );

      if (!review) {
        return ApiResponse.fail('Review not found', [], 404);
      }

      return ApiResponse.success(review, [`Review status updated to ${status}`]);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Deletes a review
   */
  async deleteReview(id) {
    try {
      const review = await Review.findByIdAndDelete(id);
      if (!review) {
        return ApiResponse.fail('Review not found', [], 404);
      }

      return ApiResponse.success(null, ['Review removed successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }
}

module.exports = { ReviewService };
