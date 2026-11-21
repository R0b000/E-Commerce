const mongoose = require('mongoose');
const { Menu } = require('../models/database/Menu');
const { Permission } = require('../models/database/Permission');
const { Role } = require('../models/database/Role');
const { User } = require('../../auth.server/models/database/User');
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');
const { redisService } = require('./RedisService');

class RbacService {
  /**
   * Returns dynamic navigation menus available to the logged in user
   * - Admin sees all menus
   * - Seller / Customer sees menus matching their role or granted via customPermissions
   */
  async getUserMenus(user = null, simulatedRole = null) {
    try {
      const userRole = (simulatedRole || user?.role || 'customer').toLowerCase();
      const isAdmin = userRole === 'admin';
      const cacheKey = `ecommerce:menus:${userRole}:${user?.id || 'anon'}`;

      // Check high-speed Redis cache
      const cached = await redisService.get(cacheKey);
      if (cached) {
        return ApiResponse.success(cached);
      }

      // Load user custom permissions if user exists
      let userCustomPermissions = [];
      if (user?.id) {
        const u = await User.findById(user.id).select('customPermissions role').lean();
        if (u) {
          userCustomPermissions = u.customPermissions || [];
        }
      }

      // Load role permissions
      const roleDoc = await Role.findOne({ name: userRole }).lean();
      const rolePermissions = roleDoc?.permissions || [];
      const effectivePermissions = new Set([...rolePermissions, ...userCustomPermissions]);

      // Fetch all active menus sorted by display order
      let allMenus = await Menu.find({ isActive: true })
        .sort({ order: 1, createdAt: 1 })
        .lean();

      if (!allMenus || allMenus.length === 0) {
        const defaultMenus = [
          { name: 'Dashboard', path: '/admin', icon: 'DashboardOutlined', order: 1, roles: ['admin', 'seller', 'support', 'manager'], isSystem: true, isActive: true },
          { name: 'Products', path: '/admin/products', icon: 'ShoppingOutlined', order: 2, roles: ['admin', 'seller', 'manager'], isSystem: true, isActive: true },
          { name: 'Categories', path: '/admin/categories', icon: 'AppstoreOutlined', order: 3, roles: ['admin', 'manager'], isSystem: true, isActive: true },
          { name: 'Orders', path: '/admin/orders', icon: 'FileTextOutlined', order: 4, roles: ['admin', 'seller', 'support', 'manager'], isSystem: true, isActive: true },
          { name: 'Accounts', path: '/admin/customers', icon: 'TeamOutlined', order: 5, roles: ['admin', 'seller', 'support', 'manager'], isSystem: true, isActive: true },
          { name: 'Billing', path: '/admin/billing', icon: 'DollarOutlined', order: 5.5, roles: ['admin', 'seller', 'support', 'manager'], isSystem: true, isActive: true },
          { name: 'Discounts & Coupons', path: '/admin/discounts', icon: 'TagOutlined', order: 5.8, roles: ['admin', 'manager'], isSystem: true, isActive: true },
          { name: 'Hero Banners', path: '/admin/banners', icon: 'PictureOutlined', order: 5.9, roles: ['admin', 'manager'], isSystem: true, isActive: true },
          { name: 'Customer Reviews', path: '/admin/reviews', icon: 'StarOutlined', order: 6, roles: ['admin', 'support', 'seller'], isSystem: true, isActive: true },
          { name: 'Audit Logs', path: '/admin/audit-logs', icon: 'HistoryOutlined', order: 7, roles: ['admin'], isSystem: true, isActive: true },
          { name: 'Security Roles', path: '/admin/roles', icon: 'KeyOutlined', order: 8, roles: ['admin'], isSystem: true, isActive: true },
          { name: 'Permissions', path: '/admin/permissions', icon: 'SafetyCertificateOutlined', order: 9, roles: ['admin'], isSystem: true, isActive: true },
          { name: 'Menu Pages', path: '/admin/menus', icon: 'MenuOutlined', order: 10, roles: ['admin'], isSystem: true, isActive: true },
        ];
        await Menu.insertMany(defaultMenus);
        allMenus = await Menu.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
      } else {
        // Remove seller-profile menu and update customer menu to Accounts
        await Menu.deleteMany({ path: '/admin/seller-profile' });
        allMenus = allMenus.filter((m) => m.path !== '/admin/seller-profile');

        const customerMenu = allMenus.find((m) => m.path === '/admin/customers');
        if (customerMenu) {
          customerMenu.name = 'Accounts';
          if (!customerMenu.roles.includes('seller')) customerMenu.roles.push('seller');
          await Menu.updateOne(
            { path: '/admin/customers' },
            { $set: { name: 'Accounts', roles: customerMenu.roles } }
          );
        }

        const hasReviews = allMenus.some((m) => m.path === '/admin/reviews');
        if (!hasReviews) {
          const revMenu = await Menu.create({
            name: 'Customer Reviews',
            path: '/admin/reviews',
            icon: 'StarOutlined',
            order: 6,
            roles: ['admin', 'support', 'seller'],
            isSystem: true,
            isActive: true,
          });
          allMenus.push(revMenu.toObject ? revMenu.toObject() : revMenu);
        }
        const hasAudit = allMenus.some((m) => m.path === '/admin/audit-logs');
        if (!hasAudit) {
          const auditMenu = await Menu.create({
            name: 'Audit Logs',
            path: '/admin/audit-logs',
            icon: 'HistoryOutlined',
            order: 7,
            roles: ['admin'],
            isSystem: true,
            isActive: true,
          });
          allMenus.push(auditMenu.toObject ? auditMenu.toObject() : auditMenu);
        }

        const hasInventory = allMenus.some((m) => m.path === '/admin/inventory');
        if (!hasInventory) {
          const invMenu = await Menu.create({
            name: 'Inventory & Stock',
            path: '/admin/inventory',
            icon: 'AppstoreOutlined',
            order: 3,
            roles: ['admin', 'seller', 'manager'],
            isSystem: true,
            isActive: true,
          });
          allMenus.push(invMenu.toObject ? invMenu.toObject() : invMenu);
        }

        const hasSecurity = allMenus.some((m) => m.path === '/admin/security');
        if (!hasSecurity) {
          const secMenu = await Menu.create({
            name: 'Security & Devices',
            path: '/admin/security',
            icon: 'LockOutlined',
            order: 12,
            roles: ['admin', 'seller', 'support', 'manager', 'customer', 'user'],
            isSystem: true,
            isActive: true,
          });
          allMenus.push(secMenu.toObject ? secMenu.toObject() : secMenu);
        }

        const hasBilling = allMenus.some((m) => m.path === '/admin/billing');
        if (!hasBilling) {
          const billMenu = await Menu.create({
            name: 'Billing',
            path: '/admin/billing',
            icon: 'DollarOutlined',
            order: 5.5,
            roles: ['admin', 'seller', 'support', 'manager'],
            isSystem: true,
            isActive: true,
          });
          allMenus.push(billMenu.toObject ? billMenu.toObject() : billMenu);
        }

        const hasDiscounts = allMenus.some((m) => m.path === '/admin/discounts');
        if (!hasDiscounts) {
          const discMenu = await Menu.create({
            name: 'Discounts & Coupons',
            path: '/admin/discounts',
            icon: 'TagOutlined',
            order: 5.8,
            roles: ['admin', 'manager'],
            isSystem: true,
            isActive: true,
          });
          allMenus.push(discMenu.toObject ? discMenu.toObject() : discMenu);
        }

        const hasBanners = allMenus.some((m) => m.path === '/admin/banners');
        if (!hasBanners) {
          const bannerMenu = await Menu.create({
            name: 'Hero Banners',
            path: '/admin/banners',
            icon: 'PictureOutlined',
            order: 5.9,
            roles: ['admin', 'manager'],
            isSystem: true,
            isActive: true,
          });
          allMenus.push(bannerMenu.toObject ? bannerMenu.toObject() : bannerMenu);
        }
      }

      // Filter menus based on user role and permissions
      const hasConfiguredPermissions = roleDoc && Array.isArray(roleDoc.permissions);

      const allowedMenus = allMenus.filter((menu) => {
        if (isAdmin && (!hasConfiguredPermissions || roleDoc.permissions.includes('*'))) return true;
        if (effectivePermissions.has('*')) return true;

        // Dashboard, profile, security, and billing are fundamental account features permitted for all roles
        if (
          menu.path === '/admin' ||
          menu.path === '/admin/profile' ||
          menu.path === '/admin/security' ||
          menu.path === '/admin/billing' ||
          menu.name.toLowerCase() === 'dashboard' ||
          menu.name.toLowerCase() === 'profile' ||
          menu.name.toLowerCase() === 'billing'
        ) {
          return true;
        }

        // Check required permission
        if (menu.requiredPermission && effectivePermissions.has(menu.requiredPermission)) {
          return true;
        }

        // Check permission prefix (e.g. products:read, orders:read, customers:read, etc.)
        const codePrefix = menu.path
          ? menu.path.replace(/^\/admin\/?/, '').replace(/^\//, '').replace(/-/g, '_')
          : menu.name.toLowerCase().replace(/\s+/g, '_');

        for (const perm of effectivePermissions) {
          if (perm.startsWith(`${codePrefix}:`) || perm === `pages:${codePrefix}` || perm === codePrefix) {
            return true;
          }
        }

        // Fallback to menu.roles ONLY if the role has no configured permissions defined in database
        if (!hasConfiguredPermissions || roleDoc.permissions.length === 0) {
          return Array.isArray(menu.roles) && menu.roles.includes(userRole);
        }

        return false;
      });

      // Construct nested tree structure (Parents and their SubItems)
      const menuMap = new Map();
      const roots = [];

      allowedMenus.forEach((m) => {
        menuMap.set(m._id.toString(), {
          ...m,
          id: m._id.toString(),
          subItems: [],
        });
      });

      allowedMenus.forEach((m) => {
        const item = menuMap.get(m._id.toString());
        const parentKey = m.parentId
          ? m.parentId._id
            ? m.parentId._id.toString()
            : m.parentId.toString()
          : null;
        if (parentKey && menuMap.has(parentKey)) {
          menuMap.get(parentKey).subItems.push({
            label: item.name,
            path: item.path,
            id: item.id,
            order: item.order || 0,
          });
        } else {
          roots.push(item);
        }
      });

      // Filter out empty parent categories if user has no access to any of its children
      const finalRoots = roots.filter((root) => {
        if (['Account', 'Logs', 'Setting'].includes(root.name) && (!root.subItems || root.subItems.length === 0)) {
          return false;
        }
        return true;
      });

      // Sort roots by display order
      finalRoots.sort((a, b) => (a.order || 0) - (b.order || 0));
      finalRoots.forEach((r) => {
        if (Array.isArray(r.subItems)) {
          r.subItems.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
      });

      const resultData = {
        menus: finalRoots,
        userRole,
        effectivePermissions: Array.from(effectivePermissions),
      };

      await redisService.set(cacheKey, resultData, 180);

      return ApiResponse.success(resultData);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Returns all menus for the Menu Management CRUD page
   */
  async getAllMenus() {
    try {
      const menus = await Menu.find()
        .populate('parentId', 'name path')
        .sort({ order: 1, createdAt: 1 })
        .lean();

      return ApiResponse.success(
        menus.map((m) => ({ ...m, id: m._id.toString() }))
      );
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Creates a new dynamic menu / page entry
   */
  async createMenu(data) {
    try {
      if (!data.name || !data.path) {
        return ApiResponse.fail('Name and Path are required', [], 400);
      }

      const parentId =
        data.parentId && mongoose.Types.ObjectId.isValid(data.parentId)
          ? data.parentId
          : null;

      const menu = new Menu({
        ...data,
        parentId,
        path: data.path.startsWith('/') ? data.path : `/${data.path}`,
        roles: data.roles || ['admin'],
      });

      await menu.save();
      await redisService.delByPattern('ecommerce:menus:*');
      return ApiResponse.success(menu, ['Menu created successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  /**
   * Updates a dynamic menu entry
   */
  async updateMenu(id, data) {
    try {
      const updateData = { ...data };
      if ('parentId' in updateData) {
        updateData.parentId =
          updateData.parentId && mongoose.Types.ObjectId.isValid(updateData.parentId)
            ? updateData.parentId
            : null;
      }

      const updated = await Menu.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      if (!updated) {
        return ApiResponse.fail('Menu not found', [], 404);
      }
      await redisService.delByPattern('ecommerce:menus:*');
      return ApiResponse.success(updated, ['Menu updated successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  /**
   * Deletes a menu entry (prevents deleting core system menus)
   */
  async deleteMenu(id) {
    try {
      const menu = await Menu.findById(id);
      if (!menu) {
        return ApiResponse.fail('Menu not found', [], 404);
      }
      if (menu.isSystem) {
        return ApiResponse.fail('System core menus cannot be deleted', [], 400);
      }

      await Menu.findByIdAndDelete(id);
      await redisService.delByPattern('ecommerce:menus:*');
      return ApiResponse.success(null, ['Menu deleted successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Returns all roles with their permissions and active user counts
   */
  async getRoles() {
    try {
      let roles = await Role.find().lean();

      const defaultRoles = [
        {
          name: 'admin',
          label: 'Super Administrator',
          description: 'Full system control, permissions, users, catalog and analytics access',
          permissions: ['*'],
          isSystem: true,
        },
        {
          name: 'seller',
          label: 'Store Seller / Vendor',
          description: 'Manage own store products, inventory, order fulfillment and vendor metrics',
          permissions: ['products:read', 'products:create', 'products:edit', 'products:delete', 'orders:read', 'orders:update_status', 'dashboard:view'],
          isSystem: true,
        },
        {
          name: 'customer',
          label: 'Store Customer / Buyer',
          description: 'Browse catalog, place orders, write reviews and track order history',
          permissions: ['orders:view_own', 'products:view', 'profile:manage'],
          isSystem: true,
        },
        {
          name: 'support',
          label: 'Customer Support Specialist',
          description: 'Assist buyers, view customer orders, manage support tickets and resolve disputes',
          permissions: ['orders:read', 'orders:update_status', 'customers:read', 'support:tickets', 'support:chat'],
          isSystem: false,
        },
        {
          name: 'manager',
          label: 'Store & Inventory Manager',
          description: 'Supervise product catalog, manage stock levels, review categories and fulfillment',
          permissions: ['products:read', 'products:create', 'products:edit', 'categories:read', 'categories:manage', 'orders:read', 'orders:update_status', 'inventory:adjust'],
          isSystem: false,
        },
      ];

      for (const defRole of defaultRoles) {
        const found = roles.find((r) => r.name === defRole.name);
        if (!found) {
          const created = await Role.create(defRole);
          roles.push(created.toObject ? created.toObject() : created);
        }
      }

      const users = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]);

      const countMap = {};
      users.forEach((u) => {
        const r = (u._id || '').toLowerCase();
        countMap[r] = u.count;
      });

      const rolesWithCounts = roles.map((r) => ({
        ...r,
        id: r._id.toString(),
        userCount: countMap[r.name] || 0,
      }));

      return ApiResponse.success(rolesWithCounts);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Creates a new role
   */
  async createRole(data) {
    try {
      const name = (data.name || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
      if (!name || !data.label) {
        return ApiResponse.fail('Role name and label are required', [], 400);
      }
      const existing = await Role.findOne({ name });
      if (existing) {
        return ApiResponse.fail(`Role "${name}" already exists`, [], 400);
      }

      const role = new Role({
        name,
        label: data.label.trim(),
        description: data.description?.trim() || '',
        permissions: data.permissions || [],
        isSystem: false,
      });

      await role.save();
      await redisService.delByPattern('ecommerce:menus:*');
      return ApiResponse.success(role, ['Role created successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  /**
   * Updates role details (label, description, permissions)
   */
  async updateRole(roleName, data) {
    try {
      const updateData = {};
      if (data.label !== undefined) updateData.label = data.label.trim();
      if (data.description !== undefined) updateData.description = data.description.trim();
      if (data.permissions !== undefined) updateData.permissions = data.permissions;

      const role = await Role.findOneAndUpdate(
        { name: roleName.toLowerCase() },
        { $set: updateData },
        { new: true, upsert: true }
      );
      if (!role) {
        return ApiResponse.fail(`Role "${roleName}" not found`, [], 404);
      }
      await redisService.delByPattern('ecommerce:menus:*');
      return ApiResponse.success(role, [`Role "${role.label || roleName}" updated successfully`]);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  /**
   * Updates permissions assigned to a role
   */
  async updateRolePermissions(roleName, permissions) {
    return this.updateRole(roleName, { permissions });
  }

  /**
   * Deletes a custom non-system role
   */
  async deleteRole(roleName) {
    try {
      const role = await Role.findOne({ name: roleName.toLowerCase() });
      if (!role) {
        return ApiResponse.fail(`Role "${roleName}" not found`, [], 404);
      }
      if (role.isSystem) {
        return ApiResponse.fail('System core roles cannot be deleted', [], 400);
      }
      await Role.deleteOne({ _id: role._id });
      await redisService.delByPattern('ecommerce:menus:*');
      return ApiResponse.success(null, [`Role "${role.label}" deleted successfully`]);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  /**
   * Returns all available permissions grouped by category/module
   */
  async getPermissions() {
    try {
      let permissions = await Permission.find().sort({ module: 1, name: 1 }).lean();

      // Fetch all roles to map which roles have each permission
      const roles = await Role.find().lean();

      const computeAction = (code, name) => {
        if (code.startsWith('pages:')) return 'page_access';
        if (code.includes(':create') || name.toLowerCase().includes('create') || name.toLowerCase().includes('add') || name.toLowerCase().includes('submit')) return 'create';
        if (code.includes(':edit') || code.includes(':update') || code.includes(':adjust') || name.toLowerCase().includes('edit') || name.toLowerCase().includes('update') || name.toLowerCase().includes('modify')) return 'edit';
        if (code.includes(':delete') || code.includes(':cancel') || name.toLowerCase().includes('delete') || name.toLowerCase().includes('deactivate') || name.toLowerCase().includes('revoke')) return 'delete';
        if (code.includes(':export') || name.toLowerCase().includes('export') || code.includes(':invoice')) return 'export';
        return 'special';
      };

      const enriched = permissions.map((p) => {
        const associatedRoles = roles
          .filter((r) => Array.isArray(r.permissions) && r.permissions.includes(p.code))
          .map((r) => r.name);

        return {
          ...p,
          id: p._id.toString(),
          action: computeAction(p.code, p.name),
          roles: associatedRoles,
        };
      });

      return ApiResponse.success(enriched);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Creates a new custom permission
   */
  async createPermission(data) {
    try {
      const code = data.code.toLowerCase().trim().replace(/\s+/g, ':');
      const existing = await Permission.findOne({ code });
      if (existing) {
        return ApiResponse.fail(`Permission code "${code}" already exists`, [], 400);
      }

      const perm = new Permission({
        ...data,
        code,
      });

      await perm.save();
      return ApiResponse.success(perm, ['Permission created successfully']);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  /**
   * Grants/revokes special custom permissions for a specific user
   */
  async assignUserPermissions(userId, customPermissions) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { customPermissions } },
        { new: true }
      ).select('firstName lastName email role customPermissions');

      if (!user) {
        return ApiResponse.fail('User not found', [], 404);
      }

      await redisService.delByPattern('ecommerce:menus:*');

      return ApiResponse.success(user, [
        `Custom permissions updated for ${user.firstName} ${user.lastName}`,
      ]);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  /**
   * Returns all users with their custom permissions for management
   */
  async getUsersWithPermissions() {
    try {
      const users = await User.find()
        .select('firstName lastName email role customPermissions isActive createdAt')
        .sort({ role: 1, firstName: 1 })
        .lean();

      return ApiResponse.success(
        users.map((u) => ({ ...u, id: u._id.toString() }))
      );
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }
}

module.exports = { RbacService };
