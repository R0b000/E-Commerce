const { Order } = require('../models/database/Order');
const { Product } = require('../models/database/Product');
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');
const { emitNotification } = require('../socket/SocketServer');

class OrderService {
  /**
   * Fetches orders with role-based filtering:
   * - 'customer': sees ONLY orders placed by themselves (matching user ID or email)
   * - 'seller': sees ONLY orders containing products sold by this seller
   * - 'admin': sees all orders across the entire platform
   */
  async getOrders(queryParams = {}, user = null) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        paymentStatus,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = queryParams;

      const filter = {};

      // Role-Based Filtering
      if (user && user.role === 'customer') {
        filter.$or = [
          { user: user.id },
          { 'customer.email': user.email },
        ];
      } else if (user && user.role === 'seller') {
        filter['items.seller'] = user.id;
      }

      if (status && status !== 'all') {
        filter.orderStatus = status;
      }

      if (paymentStatus && paymentStatus !== 'all') {
        filter.paymentStatus = paymentStatus;
      }

      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        if (filter.$or) {
          filter.$and = [
            { $or: filter.$or },
            {
              $or: [
                { orderNumber: searchRegex },
                { 'customer.name': searchRegex },
                { 'customer.email': searchRegex },
              ],
            },
          ];
          delete filter.$or;
        } else {
          filter.$or = [
            { orderNumber: searchRegex },
            { 'customer.name': searchRegex },
            { 'customer.email': searchRegex },
          ];
        }
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const pageNumber = Math.max(1, parseInt(page, 10));
      const pageSize = Math.max(1, parseInt(limit, 10));
      const skip = (pageNumber - 1) * pageSize;

      const [orders, totalCount] = await Promise.all([
        Order.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(pageSize)
          .populate('items.product', 'name sku price images')
          .populate('items.seller', 'firstName lastName email')
          .lean(),
        Order.countDocuments(filter),
      ]);

      // If seller, calculate seller-specific earnings for items in the order
      const processedOrders = orders.map((o) => {
        let sellerEarnings = o.totalAmount;
        if (user && user.role === 'seller') {
          sellerEarnings = o.items
            .filter((item) => item.seller && (item.seller._id?.toString() === user.id || item.seller.toString() === user.id))
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }
        return {
          ...o,
          id: o._id,
          sellerEarnings: Math.round(sellerEarnings * 100) / 100,
        };
      });

      return ApiResponse.success({
        orders: processedOrders,
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

  /**
   * Get order by ID with ownership check
   */
  async getOrderById(id, user = null) {
    try {
      const order = await Order.findById(id)
        .populate('items.product')
        .populate('items.seller', 'firstName lastName email')
        .lean();

      if (!order) {
        return ApiResponse.fail('Order not found', [], 404);
      }

      // Customer check: must be their own order
      if (user && user.role === 'customer') {
        const isOwner = (order.user && order.user.toString() === user.id) || order.customer?.email === user.email;
        if (!isOwner) {
          return ApiResponse.fail('Access denied: You can only view your own orders', [], 403);
        }
      }

      // Seller check: order must contain at least one item from this seller
      if (user && user.role === 'seller') {
        const hasSellerItem = order.items.some(
          (item) => item.seller && (item.seller._id?.toString() === user.id || item.seller.toString() === user.id)
        );
        if (!hasSellerItem) {
          return ApiResponse.fail('Access denied: This order does not contain products from your store', [], 403);
        }
      }

      return ApiResponse.success({ ...order, id: order._id });
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Places a new order, populating product sellers on each order item
   */
  async createOrder(data, user = null) {
    try {
      const orderNumber = 'ORD-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);

      // Verify stock and populate item seller
      const enrichedItems = [];
      for (const item of data.items) {
        const prod = await Product.findById(item.product);
        if (!prod) {
          return ApiResponse.fail(`Product not found: ${item.product}`, [], 400);
        }
        if (prod.stock < item.quantity) {
          return ApiResponse.fail(`Insufficient stock for product: ${prod.name}`, [], 400);
        }
        enrichedItems.push({
          product: prod._id,
          name: prod.name,
          price: prod.salePrice || prod.price,
          quantity: item.quantity,
          image: prod.images?.[0] || '',
          seller: prod.seller || null,
        });
      }

      // Assign logged in user if available
      let assignedUser = data.user;
      if (user) {
        assignedUser = user.id;
      }

      const order = new Order({
        ...data,
        user: assignedUser,
        orderNumber,
        items: enrichedItems,
      });

      await order.save();

      // Deduct stock
      for (const item of data.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }

      emitNotification({
        title: 'New Customer Order',
        message: `Order #${order.orderNumber} placed for $${order.totalAmount?.toFixed(2)} by ${order.customer?.name}`,
        type: 'order',
      });

      return ApiResponse.success(order, ['Order placed successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  /**
   * Updates order status with role verification
   */
  async updateOrderStatus(id, updates, user = null) {
    try {
      const existingOrder = await Order.findById(id);
      if (!existingOrder) {
        return ApiResponse.fail('Order not found', [], 404);
      }

      if (user && user.role === 'seller') {
        const hasSellerItem = existingOrder.items.some(
          (item) => item.seller && item.seller.toString() === user.id
        );
        if (!hasSellerItem) {
          return ApiResponse.fail('Access denied: You can only update orders for your own products', [], 403);
        }
      }

      const order = await Order.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      return ApiResponse.success(order, ['Order updated successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }
}

module.exports = { OrderService };
