const { Category } = require('../models/database/Category');
const { Product } = require('../models/database/Product');
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');

class CategoryService {
  async getAllCategories() {
    try {
      const categories = await Category.find().sort({ displayOrder: 1, name: 1 }).lean();
      
      // Calculate real product counts for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (cat) => {
          const count = await Product.countDocuments({ category: cat._id });
          return {
            ...cat,
            id: cat._id,
            productCount: count,
          };
        })
      );

      return ApiResponse.success(categoriesWithCount, ['Categories retrieved successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  async getCategoryById(id) {
    try {
      const category = await Category.findById(id).lean();
      if (!category) {
        return ApiResponse.fail('Category not found', [], 404);
      }
      const count = await Product.countDocuments({ category: id });
      return ApiResponse.success({ ...category, id: category._id, productCount: count });
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  async createCategory(data) {
    try {
      const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existing = await Category.findOne({ $or: [{ name: data.name }, { slug }] });
      if (existing) {
        return ApiResponse.fail('Category with this name or slug already exists', [], 400);
      }

      const category = new Category({
        ...data,
        slug,
      });
      await category.save();

      return ApiResponse.success(category, ['Category created successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  async updateCategory(id, data) {
    try {
      if (data.name && !data.slug) {
        data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
      if (!category) {
        return ApiResponse.fail('Category not found', [], 404);
      }

      return ApiResponse.success(category, ['Category updated successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  async deleteCategory(id) {
    try {
      const productCount = await Product.countDocuments({ category: id });
      if (productCount > 0) {
        return ApiResponse.fail(`Cannot delete category with ${productCount} active products. Reassign products first.`, [], 400);
      }

      const category = await Category.findByIdAndDelete(id);
      if (!category) {
        return ApiResponse.fail('Category not found', [], 404);
      }

      return ApiResponse.success(null, ['Category deleted successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }
}

module.exports = { CategoryService };
