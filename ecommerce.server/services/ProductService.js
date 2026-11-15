const { Product } = require('../models/database/Product');
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');

class ProductService {
  /**
   * Fetches products with role-based filtering:
   * - 'seller': returns only products belonging to this seller
   * - 'customer' or unauthenticated public: returns only active products
   * - 'admin': returns all products (with optional seller filter)
   */
  async getProducts(queryParams = {}, user = null) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category,
        status,
        featured,
        minPrice,
        maxPrice,
        seller,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = queryParams;

      const filter = {};

      // Role-based visibility
      if (user && user.role === 'seller') {
        filter.seller = user.id;
      } else if (!user || user.role === 'customer' || user.role === 'user') {
        // Public storefront only shows active products
        if (!status || status === 'all') {
          filter.status = 'active';
        }
      }

      // Admin or query explicitly filtering by seller
      if (seller && (user?.role === 'admin' || !filter.seller)) {
        filter.seller = seller;
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      if (category && category !== 'all') {
        filter.category = category;
      }

      if (status && status !== 'all' && (user?.role === 'admin' || user?.role === 'seller')) {
        filter.status = status;
      }

      if (featured !== undefined && featured !== '') {
        filter.isFeatured = featured === 'true' || featured === true;
      }

      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const pageNumber = Math.max(1, parseInt(page, 10));
      const pageSize = Math.max(1, parseInt(limit, 10));
      const skip = (pageNumber - 1) * pageSize;

      const [products, totalCount] = await Promise.all([
        Product.find(filter)
          .populate('category', 'name slug')
          .populate('seller', 'firstName lastName email')
          .sort(sort)
          .skip(skip)
          .limit(pageSize)
          .lean(),
        Product.countDocuments(filter),
      ]);

      return ApiResponse.success({
        products: products.map((p) => ({ ...p, id: p._id })),
        pagination: {
          page: pageNumber,
          limit: pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
          totalCount,
        },
      });
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  async getProductById(id) {
    try {
      const product = await Product.findById(id)
        .populate('category', 'name slug')
        .populate('seller', 'firstName lastName email')
        .lean();
      if (!product) {
        return ApiResponse.fail('Product not found', [], 404);
      }
      return ApiResponse.success({ ...product, id: product._id });
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Creates a product, automatically binding it to the logged in seller
   */
  async createProduct(data, user = null) {
    try {
      const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existingSku = await Product.findOne({ sku: data.sku.toUpperCase() });
      if (existingSku) {
        return ApiResponse.fail(`Product with SKU "${data.sku.toUpperCase()}" already exists`, [], 400);
      }

      // Assign seller ID
      let assignedSeller = data.seller;
      if (user?.role === 'seller') {
        assignedSeller = user.id;
      } else if (!assignedSeller && user) {
        assignedSeller = user.id;
      }

      const product = new Product({
        ...data,
        sku: data.sku.toUpperCase(),
        slug,
        seller: assignedSeller,
      });

      await product.save();
      const populated = await Product.findById(product._id)
        .populate('category', 'name slug')
        .populate('seller', 'firstName lastName email');
      return ApiResponse.success(populated, ['Product created successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  /**
   * Updates product with seller ownership verification
   */
  async updateProduct(id, data, user = null) {
    try {
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return ApiResponse.fail('Product not found', [], 404);
      }

      // Role check: Seller can only edit their own products
      if (user?.role === 'seller' && existingProduct.seller && existingProduct.seller.toString() !== user.id) {
        return ApiResponse.fail('Access denied: You can only edit your own products', [], 403);
      }

      if (data.sku) {
        data.sku = data.sku.toUpperCase();
        const existingSku = await Product.findOne({ sku: data.sku, _id: { $ne: id } });
        if (existingSku) {
          return ApiResponse.fail(`Product with SKU "${data.sku}" already exists on another product`, [], 400);
        }
      }

      if (data.name && !data.slug) {
        data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      // Don't allow seller to change the owner of product
      if (user?.role === 'seller') {
        delete data.seller;
      }

      const updated = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        .populate('category', 'name slug')
        .populate('seller', 'firstName lastName email');

      return ApiResponse.success(updated, ['Product updated successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  /**
   * Deletes product with seller ownership verification
   */
  async deleteProduct(id, user = null) {
    try {
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return ApiResponse.fail('Product not found', [], 404);
      }

      // Role check: Seller can only delete their own products
      if (user?.role === 'seller' && existingProduct.seller && existingProduct.seller.toString() !== user.id) {
        return ApiResponse.fail('Access denied: You can only delete your own products', [], 403);
      }

      await Product.findByIdAndDelete(id);
      return ApiResponse.success(null, ['Product deleted successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Quick update stock with seller ownership check
   */
  async updateStock(id, newStock, user = null) {
    try {
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return ApiResponse.fail('Product not found', [], 404);
      }

      if (user?.role === 'seller' && existingProduct.seller && existingProduct.seller.toString() !== user.id) {
        return ApiResponse.fail('Access denied: You can only update stock for your own products', [], 403);
      }

      const product = await Product.findByIdAndUpdate(
        id,
        { stock: newStock, status: newStock <= 0 ? 'out_of_stock' : 'active' },
        { new: true }
      );
      return ApiResponse.success(product, ['Stock updated successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }
}

module.exports = { ProductService };
