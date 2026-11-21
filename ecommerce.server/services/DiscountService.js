const { Discount } = require('../models/database/Discount');
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');

class DiscountService {
  /**
   * Seed authentic default discounts if none exist
   */
  async ensureSeedDiscounts() {
    const count = await Discount.countDocuments();
    if (count === 0) {
      const now = new Date();
      const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      const defaults = [
        {
          code: 'HIMALAYA20',
          description: '20% off on all authentic Himalayan singing bowls and textiles',
          type: 'percentage',
          value: 20,
          minPurchaseAmount: 50,
          maxDiscountAmount: 80,
          startDate: now,
          endDate: in60Days,
          usageLimit: 500,
          usedCount: 142,
          isActive: true,
        },
        {
          code: 'FESTIVE15',
          description: '15% seasonal discount on artisan organic teas and spices',
          type: 'percentage',
          value: 15,
          minPurchaseAmount: 30,
          maxDiscountAmount: 45,
          startDate: now,
          endDate: in90Days,
          usageLimit: 300,
          usedCount: 78,
          isActive: true,
        },
        {
          code: 'WELCOME10',
          description: '$10 instant voucher for first-time buyer accounts over $40',
          type: 'fixed_amount',
          value: 10,
          minPurchaseAmount: 40,
          startDate: now,
          endDate: in90Days,
          usageLimit: 1000,
          usedCount: 312,
          isActive: true,
        },
        {
          code: 'SUPERSALE25',
          description: '25% flash discount for orders exceeding $120 total',
          type: 'percentage',
          value: 25,
          minPurchaseAmount: 120,
          maxDiscountAmount: 125,
          startDate: now,
          endDate: in60Days,
          usageLimit: 150,
          usedCount: 64,
          isActive: true,
        },
        {
          code: 'VIPBONUS25',
          description: '$25 fixed courtesy credit on wholesale cart totals over $150',
          type: 'fixed_amount',
          value: 25,
          minPurchaseAmount: 150,
          startDate: now,
          endDate: in90Days,
          usageLimit: 250,
          usedCount: 95,
          isActive: true,
        },
      ];

      await Discount.insertMany(defaults);
    }
  }

  /**
   * List discounts with filtering and pagination
   */
  async getDiscounts({ search, type, status, page = 1, limit = 10 }) {
    try {
      await this.ensureSeedDiscounts();

      const query = {};

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ code: regex }, { description: regex }];
      }

      if (type && type !== 'all') {
        query.type = type;
      }

      if (status && status !== 'all') {
        const now = new Date();
        if (status === 'active') {
          query.isActive = true;
          query.$or = [{ endDate: null }, { endDate: { $gte: now } }];
        } else if (status === 'inactive') {
          query.isActive = false;
        } else if (status === 'expired') {
          query.endDate = { $lt: now };
        }
      }

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const skip = (pageNum - 1) * limitNum;

      const [discounts, total] = await Promise.all([
        Discount.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('applicableCategory', 'name slug')
          .lean(),
        Discount.countDocuments(query),
      ]);

      const formatted = discounts.map((d) => ({
        ...d,
        id: d._id.toString(),
      }));

      return ApiResponse.success({
        discounts: formatted,
        total,
        page: pageNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      });
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Get single discount by ID
   */
  async getDiscountById(id) {
    try {
      const discount = await Discount.findById(id).populate('applicableCategory', 'name slug').lean();
      if (!discount) {
        return ApiResponse.fail('Discount code not found', [], 404);
      }
      return ApiResponse.success({ ...discount, id: discount._id.toString() });
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Create new discount code
   */
  async createDiscount(data, user) {
    try {
      const code = (data.code || '').trim().toUpperCase();
      if (!code) {
        return ApiResponse.fail('Discount code is required', [], 400);
      }

      const existing = await Discount.findOne({ code });
      if (existing) {
        return ApiResponse.fail(`Discount code "${code}" already exists`, [], 400);
      }

      const discount = new Discount({
        ...data,
        code,
        createdBy: user?.id || null,
      });

      await discount.save();
      return ApiResponse.success(discount, [`Discount code "${code}" created successfully`]);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  /**
   * Update existing discount
   */
  async updateDiscount(id, data) {
    try {
      const updateData = { ...data };
      if (updateData.code) {
        updateData.code = updateData.code.trim().toUpperCase();
      }

      const updated = await Discount.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return ApiResponse.fail('Discount not found', [], 404);
      }

      return ApiResponse.success(updated, [`Discount "${updated.code}" updated successfully`]);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  /**
   * Delete discount
   */
  async deleteDiscount(id) {
    try {
      const discount = await Discount.findByIdAndDelete(id);
      if (!discount) {
        return ApiResponse.fail('Discount not found', [], 404);
      }
      return ApiResponse.success(null, [`Discount code "${discount.code}" deleted`]);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Validate and calculate discount for checkout
   */
  async validateCoupon({ code, cartTotal = 0 }) {
    try {
      if (!code || !code.trim()) {
        return ApiResponse.fail('Please provide a coupon code', [], 400);
      }

      const cleanCode = code.trim().toUpperCase();
      const discount = await Discount.findOne({ code: cleanCode, isActive: true });

      if (!discount) {
        return ApiResponse.fail(`Coupon code "${cleanCode}" is invalid or inactive`, [], 404);
      }

      const now = new Date();
      if (discount.startDate && new Date(discount.startDate) > now) {
        return ApiResponse.fail('This coupon promotion has not started yet', [], 400);
      }

      if (discount.endDate && new Date(discount.endDate) < now) {
        return ApiResponse.fail('This coupon code has expired', [], 400);
      }

      if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
        return ApiResponse.fail('This coupon has reached its maximum usage limit', [], 400);
      }

      const total = Number(cartTotal) || 0;
      if (discount.minPurchaseAmount && total < discount.minPurchaseAmount) {
        return ApiResponse.fail(
          `Minimum order of $${discount.minPurchaseAmount.toFixed(2)} required for code "${cleanCode}"`,
          [],
          400
        );
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (discount.type === 'percentage') {
        const calculated = (total * discount.value) / 100;
        discountAmount = discount.maxDiscountAmount
          ? Math.min(calculated, discount.maxDiscountAmount)
          : calculated;
      } else {
        discountAmount = Math.min(discount.value, total);
      }

      discountAmount = Math.round(discountAmount * 100) / 100;

      return ApiResponse.success({
        valid: true,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        discountAmount,
        description: discount.description,
      }, [`Coupon "${cleanCode}" applied! You save $${discountAmount.toFixed(2)}`]);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }
}

module.exports = { DiscountService };
