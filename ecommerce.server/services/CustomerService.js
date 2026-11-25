const bcrypt = require('bcryptjs');
const { User } = require('../../auth.server/models/database/User');
const { Order } = require('../models/database/Order');
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');
const { emitNotification } = require('../socket/SocketServer');
const { redisService } = require('./RedisService');

class CustomerService {
  async getCustomers(queryParams = {}) {
    try {
      const { search, role, type } = queryParams;
      const filter = {};

      if (role && role !== 'all') {
        filter.role = role.toLowerCase();
      } else if (type === 'employee') {
        filter.role = { $nin: ['customer', 'user', 'seller'] };
      } else if (type === 'client') {
        filter.role = { $in: ['customer', 'user', 'seller'] };
      }

      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { 'vendorProfile.vendorName': { $regex: search, $options: 'i' } },
        ];
      }

      const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).lean();

      // Enrich with order count and total spend
      const enriched = await Promise.all(
        users.map(async (u) => {
          const userOrders = await Order.find({
            $or: [{ user: u._id }, { 'customer.email': u.email }],
          }).lean();

          const totalSpend = userOrders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);

          return {
            ...u,
            id: u._id.toString(),
            ordersCount: userOrders.length,
            totalSpend: Math.round(totalSpend * 100) / 100,
            lastOrderDate: userOrders.length > 0 ? userOrders[0].createdAt : null,
          };
        })
      );

      return ApiResponse.success(enriched);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  async createCustomer(customerData) {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        role = 'customer',
        vendorProfile,
        agreementAccepted = true,
      } = customerData;

      if (!email || !firstName || !lastName) {
        return ApiResponse.fail('First name, last name, and email are required', [], 400);
      }

      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return ApiResponse.fail('A user with this email already exists', [], 409);
      }

      const hashedPassword = await bcrypt.hash(password || 'password123', 10);
      const userPayload = {
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role.toLowerCase().trim(),
        isActive: true,
        agreementAccepted: Boolean(agreementAccepted),
        agreementAcceptedAt: agreementAccepted ? new Date() : null,
        agreementVersion: '1.0',
      };

      if (role.toLowerCase() === 'seller' && vendorProfile) {
        userPayload.vendorProfile = {
          vendorName: vendorProfile.vendorName || `${firstName}'s Store`,
          businessLocation: vendorProfile.businessLocation || '',
          phone: vendorProfile.phone || '',
          taxId: vendorProfile.taxId || '',
          businessCategory: vendorProfile.businessCategory || 'Handicrafts & Woolens',
          description: vendorProfile.description || '',
          documentUrl: vendorProfile.documentUrl || '',
          isApproved: true,
        };
      }

      const newCustomer = await User.create(userPayload);

      const customerObj = newCustomer.toObject();
      delete customerObj.password;
      customerObj.id = customerObj._id.toString();
      customerObj.ordersCount = 0;
      customerObj.totalSpend = 0;

      const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
      emitNotification({
        title: `New ${roleLabel} Created`,
        message: `${newCustomer.firstName} ${newCustomer.lastName} was registered as a ${roleLabel}`,
        type: 'user',
      });

      return ApiResponse.success(customerObj, `${roleLabel} created successfully`, 201);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  async toggleCustomerStatus(id, isActive) {
    try {
      const user = await User.findById(id);
      if (!user) {
        return ApiResponse.fail('User account not found', [], 404);
      }

      user.isActive = typeof isActive === 'boolean' ? isActive : !user.isActive;
      await user.save();

      const userObj = user.toObject();
      delete userObj.password;
      userObj.id = userObj._id.toString();

      emitNotification({
        title: user.isActive ? 'Account Activated' : 'Account Deactivated',
        message: `${user.firstName} ${user.lastName}'s account was ${user.isActive ? 'activated' : 'deactivated'}`,
        type: 'user',
      });

      return ApiResponse.success(userObj, [`Account ${user.isActive ? 'activated' : 'deactivated'} successfully`]);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  async changeCustomerPassword(id, newPassword) {
    try {
      if (!newPassword || newPassword.trim().length < 6) {
        return ApiResponse.fail('Password must be at least 6 characters long', [], 400);
      }

      const user = await User.findById(id);
      if (!user) {
        return ApiResponse.fail('User account not found', [], 404);
      }

      user.password = await bcrypt.hash(newPassword.trim(), 10);
      await user.save();

      emitNotification({
        title: 'Account Password Reset',
        message: `Password was updated for ${user.firstName} ${user.lastName}`,
        type: 'security',
      });

      return ApiResponse.success(null, ['Password updated successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  async updateCustomerRole(id, role) {
    try {
      if (!role) {
        return ApiResponse.fail('Role is required', [], 400);
      }

      const user = await User.findById(id);
      if (!user) {
        return ApiResponse.fail('User account not found', [], 404);
      }

      const normalizedRole = role.toLowerCase().trim();
      user.role = normalizedRole;
      await user.save();

      await redisService.delByPattern('ecommerce:menus:*');

      const userObj = user.toObject();
      delete userObj.password;
      userObj.id = userObj._id.toString();

      emitNotification({
        title: 'User Role Updated',
        message: `${user.firstName} ${user.lastName}'s role was updated to ${normalizedRole}`,
        type: 'user',
      });

      return ApiResponse.success(userObj, [`Role updated to ${normalizedRole} successfully`]);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }
}

module.exports = { CustomerService };
