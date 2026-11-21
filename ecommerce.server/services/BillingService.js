const { Billing } = require('../models/database/Billing');
const { Order } = require('../models/database/Order');
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');

class BillingService {
  /**
   * Helper: Automatically generate invoices from existing orders if none exist
   */
  async autoSyncFromOrders() {
    try {
      const billingCount = await Billing.countDocuments();
      if (billingCount > 0) return;

      const orders = await Order.find().sort({ createdAt: 1 }).lean();
      if (!orders || orders.length === 0) return;

      let counter = 1001;
      for (const order of orders) {
        const invNum = `INV-2026-${String(counter).padStart(4, '0')}`;
        counter++;

        const billingItems = (order.items || []).map((it) => ({
          name: it.name || 'Himalayan Artisan Item',
          description: `Product item from order ${order.orderNumber}`,
          quantity: it.quantity || 1,
          unitPrice: it.price || 0,
          total: (it.price || 0) * (it.quantity || 1),
        }));

        const isPaid = order.paymentStatus === 'paid';
        const subtotal = order.subtotal || order.totalAmount || 0;
        const taxAmount = order.taxAmount || Math.round(subtotal * 0.13 * 100) / 100;
        const shippingAmount = order.shippingAmount || 0;
        const totalAmount = order.totalAmount || (subtotal + taxAmount + shippingAmount);

        await Billing.create({
          invoiceNumber: invNum,
          order: order._id,
          orderNumber: order.orderNumber,
          customer: {
            userId: order.user || null,
            name: order.customer?.name || 'Valued Customer',
            email: order.customer?.email || 'customer@example.com',
            phone: order.customer?.phone || '',
          },
          billingAddress: {
            street: order.shippingAddress?.street || 'Durbar Marg',
            city: order.shippingAddress?.city || 'Kathmandu',
            state: order.shippingAddress?.state || 'Bagmati',
            zipCode: order.shippingAddress?.zipCode || '44600',
            country: order.shippingAddress?.country || 'Nepal',
          },
          items: billingItems.length > 0 ? billingItems : [
            {
              name: 'Order Fulfillment Package',
              description: `Transaction for order ${order.orderNumber}`,
              quantity: 1,
              unitPrice: subtotal,
              total: subtotal,
            },
          ],
          subtotal,
          taxRate: 13,
          taxAmount,
          shippingAmount,
          totalAmount,
          currency: 'USD',
          paymentMethod: order.paymentMethod || 'credit_card',
          paymentStatus: isPaid ? 'paid' : (order.paymentStatus === 'failed' ? 'overdue' : 'pending'),
          issuedDate: order.createdAt || new Date(),
          dueDate: new Date(new Date(order.createdAt || Date.now()).getTime() + 14 * 24 * 60 * 60 * 1000),
          paidAt: isPaid ? (order.updatedAt || order.createdAt || new Date()) : null,
          notes: `Generated from Order ${order.orderNumber}`,
        });
      }
    } catch (err) {
      console.error('[BillingService.autoSyncFromOrders] Error:', err);
    }
  }

  /**
   * Get list of invoices / bills with search, status filtering, and pagination
   */
  async getBillings(queryParams = {}, user = null) {
    try {
      await this.autoSyncFromOrders();

      const {
        search,
        status,
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = queryParams;

      const filter = {};

      // Role check: customer only sees their own bills
      if (user && (user.role === 'customer' || user.role === 'user')) {
        filter.$or = [
          { 'customer.email': user.email },
          { 'customer.userId': user.id },
        ];
      }

      if (status && status !== 'all') {
        filter.paymentStatus = status;
      }

      if (search && search.trim()) {
        const q = search.trim();
        const searchRegex = { $regex: q, $options: 'i' };
        const searchCondition = [
          { invoiceNumber: searchRegex },
          { orderNumber: searchRegex },
          { 'customer.name': searchRegex },
          { 'customer.email': searchRegex },
        ];

        if (filter.$or) {
          filter.$and = [{ $or: filter.$or }, { $or: searchCondition }];
          delete filter.$or;
        } else {
          filter.$or = searchCondition;
        }
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [invoices, total] = await Promise.all([
        Billing.find(filter)
          .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Billing.countDocuments(filter),
      ]);

      const formatted = invoices.map((inv) => ({
        ...inv,
        id: inv._id.toString(),
      }));

      return ApiResponse.success({
        invoices: formatted,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)) || 1,
      });
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Get KPI Summary Statistics for Billing
   */
  async getBillingStats(user = null) {
    try {
      await this.autoSyncFromOrders();

      const filter = {};
      if (user && (user.role === 'customer' || user.role === 'user')) {
        filter.$or = [
          { 'customer.email': user.email },
          { 'customer.userId': user.id },
        ];
      }

      const all = await Billing.find(filter).lean();

      let totalBilled = 0;
      let totalRevenue = 0;
      let paidCount = 0;
      let pendingAmount = 0;
      let pendingCount = 0;
      let overdueAmount = 0;
      let overdueCount = 0;
      let totalTaxCollected = 0;

      for (const inv of all) {
        totalBilled += inv.totalAmount || 0;
        if (inv.paymentStatus === 'paid') {
          totalRevenue += inv.totalAmount || 0;
          totalTaxCollected += inv.taxAmount || 0;
          paidCount++;
        } else if (inv.paymentStatus === 'pending' || inv.paymentStatus === 'unpaid') {
          pendingAmount += inv.totalAmount || 0;
          pendingCount++;
        } else if (inv.paymentStatus === 'overdue') {
          overdueAmount += inv.totalAmount || 0;
          overdueCount++;
        }
      }

      return ApiResponse.success({
        totalInvoices: all.length,
        totalBilled: Math.round(totalBilled * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        paidCount,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        pendingCount,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        overdueCount,
        totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
      });
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Get single invoice by ID
   */
  async getBillingById(id, user = null) {
    try {
      const invoice = await Billing.findById(id).populate('order').lean();
      if (!invoice) {
        return ApiResponse.fail('Invoice not found', [], 404);
      }

      if (user && (user.role === 'customer' || user.role === 'user')) {
        const isOwner =
          (invoice.customer?.userId && invoice.customer.userId.toString() === user.id) ||
          invoice.customer?.email === user.email;
        if (!isOwner) {
          return ApiResponse.fail('Access denied: You can only view your own bills', [], 403);
        }
      }

      return ApiResponse.success({
        ...invoice,
        id: invoice._id.toString(),
      });
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Create a new manual invoice / billing statement
   */
  async createBilling(data, user = null) {
    try {
      const {
        customer,
        billingAddress,
        items = [],
        taxRate = 13,
        shippingAmount = 0,
        discountAmount = 0,
        paymentMethod = 'credit_card',
        paymentStatus = 'paid',
        dueDate,
        notes = '',
      } = data;

      if (!customer || !customer.name || !customer.email) {
        return ApiResponse.fail('Customer name and email are required', [], 400);
      }

      if (!Array.isArray(items) || items.length === 0) {
        return ApiResponse.fail('At least one item is required on the invoice', [], 400);
      }

      // Calculate line item totals & subtotal
      const enrichedItems = items.map((it) => {
        const qty = Math.max(1, parseInt(it.quantity) || 1);
        const price = Math.max(0, parseFloat(it.unitPrice) || 0);
        return {
          name: String(it.name || 'Artisan Service / Item').trim(),
          description: String(it.description || '').trim(),
          quantity: qty,
          unitPrice: price,
          total: Math.round(qty * price * 100) / 100,
        };
      });

      const subtotal = enrichedItems.reduce((sum, it) => sum + it.total, 0);
      const taxAmount = Math.round(subtotal * (parseFloat(taxRate) / 100) * 100) / 100;
      const totalAmount = Math.round((subtotal + taxAmount + (parseFloat(shippingAmount) || 0) - (parseFloat(discountAmount) || 0)) * 100) / 100;

      // Generate sequential invoice number
      const count = await Billing.countDocuments();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1001).padStart(4, '0')}`;

      const newInvoice = await Billing.create({
        invoiceNumber,
        customer: {
          userId: customer.userId || null,
          name: customer.name.trim(),
          email: customer.email.toLowerCase().trim(),
          phone: customer.phone ? customer.phone.trim() : '',
        },
        billingAddress: {
          street: billingAddress?.street || 'Durbar Marg',
          city: billingAddress?.city || 'Kathmandu',
          state: billingAddress?.state || 'Bagmati',
          zipCode: billingAddress?.zipCode || '44600',
          country: billingAddress?.country || 'Nepal',
        },
        items: enrichedItems,
        subtotal,
        taxRate: parseFloat(taxRate) || 13,
        taxAmount,
        shippingAmount: parseFloat(shippingAmount) || 0,
        discountAmount: parseFloat(discountAmount) || 0,
        totalAmount,
        paymentMethod,
        paymentStatus,
        issuedDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        paidAt: paymentStatus === 'paid' ? new Date() : null,
        notes: notes || 'Official Commercial Billing Invoice',
      });

      return ApiResponse.success(
        { ...newInvoice.toObject(), id: newInvoice._id.toString() },
        ['Invoice created successfully'],
        201
      );
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Update payment status or notes on an invoice
   */
  async updateBillingStatus(id, updateData, user = null) {
    try {
      const invoice = await Billing.findById(id);
      if (!invoice) {
        return ApiResponse.fail('Invoice not found', [], 404);
      }

      const { paymentStatus, paymentMethod, notes, paidAt } = updateData;

      if (paymentStatus) {
        invoice.paymentStatus = paymentStatus;
        if (paymentStatus === 'paid') {
          invoice.paidAt = paidAt ? new Date(paidAt) : new Date();
        } else if (paymentStatus === 'unpaid' || paymentStatus === 'pending') {
          invoice.paidAt = null;
        }
      }

      if (paymentMethod) invoice.paymentMethod = paymentMethod;
      if (notes !== undefined) invoice.notes = notes;

      await invoice.save();

      return ApiResponse.success(
        { ...invoice.toObject(), id: invoice._id.toString() },
        ['Invoice status updated successfully']
      );
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Delete or void an invoice
   */
  async deleteBilling(id, user = null) {
    try {
      const invoice = await Billing.findByIdAndDelete(id);
      if (!invoice) {
        return ApiResponse.fail('Invoice not found', [], 404);
      }
      return ApiResponse.success({ id }, ['Invoice deleted successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }
}

module.exports = { BillingService };
