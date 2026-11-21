const mongoose = require('mongoose');
const { Menu } = require('../models/database/Menu');
const { Permission } = require('../models/database/Permission');
const { Role } = require('../models/database/Role');
const { User } = require('../../auth.server/models/database/User');
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');
const { redisService } = require('./RedisService');

class RbacService {
  /**
   * Synchronizes standard hierarchical menu dataset matching user's exact specification
   */
  async syncStandardMenus() {
    try {
      const hasOrderSubs = await Menu.findOne({
        $or: [{ parentId: 11 }, { parentId: '11' }],
      }).lean();

      if (hasOrderSubs) {
        return;
      }

      // Clean up old flat conflicting menus
      await Menu.deleteMany({
        $or: [
          { menuId: null },
          { path: { $in: ['/admin/orders', '/admin/billing', '/admin/customers', '/admin/roles', '/admin/permissions', '/admin/menus', '/admin/seller-profile'] } }
        ]
      });

      const standardMenus = [
        // 1. Dashboard
        { menuId: 1, name: 'Dashboard', path: '/admin', icon: 'dashboard', order: 1, parentId: null, isSinglePage: true, isPrimary: true, roles: ['admin', 'seller', 'support', 'manager'], isActive: true },

        // 2. Products
        { menuId: 3, name: 'Products', path: '/admin/products', icon: 'shopping_cart', order: 2, parentId: null, isSinglePage: true, isPrimary: true, roles: ['admin', 'seller', 'manager'], isActive: true },

        // 3. Categories
        { menuId: 4, name: 'Categories', path: '/admin/categories', icon: 'category', order: 3, parentId: null, isSinglePage: true, roles: ['admin', 'manager'], isActive: true },

        // 4. Order (Parent Category Menu)
        { menuId: 11, name: 'Orders', path: '/admin/orders', icon: 'receipt_long', order: 4, parentId: null, isSinglePage: false, isPrimary: true, roles: ['admin', 'seller', 'support', 'manager'], isActive: true },
        // Children of Order (parentId: 11)
        { menuId: 12, name: 'Create Order', path: '/admin/orders/create', icon: 'add_shopping_cart', order: 1, parentId: 11, isSinglePage: true, roles: ['admin', 'seller', 'support', 'manager'], isActive: true },
        { menuId: 13, name: 'Order Details', path: '/admin/orders', icon: 'list_alt', order: 2, parentId: 11, isSinglePage: true, roles: ['admin', 'seller', 'support', 'manager'], isActive: true },
        { menuId: 38, name: 'Order Dashboard', path: '/admin/orders/dashboard', icon: 'dashboard', order: 3, parentId: 11, isSinglePage: true, roles: ['admin', 'seller', 'support', 'manager'], isActive: true },
        { menuId: 63, name: 'KOT', path: '/restro/kot', icon: 'receipt_long', order: 4, parentId: 11, isSinglePage: true, roles: ['admin', 'seller', 'support', 'manager'], isActive: true },
        { menuId: 64, name: 'BOT', path: '/restro/bot', icon: 'local_bar', order: 5, parentId: 11, isSinglePage: true, roles: ['admin', 'seller', 'support', 'manager'], isActive: true },
        { menuId: 65, name: 'Order Report', path: '/restro/order-report', icon: 'receipt_long', order: 6, parentId: 11, isSinglePage: true, roles: ['admin', 'seller', 'support', 'manager'], isActive: true },

        // 5. Stock & Inventory
        { menuId: 7, name: 'Stock & Inventory', path: '/admin/inventory', icon: 'inventory_2', order: 5, parentId: null, isSinglePage: true, isPrimary: true, roles: ['admin', 'seller', 'manager'], isActive: true },

        // 6. Purchase (Parent Category Menu)
        { menuId: 15, name: 'Purchase', path: '/purchase', icon: 'shopping_cart', order: 6, parentId: null, isSinglePage: false, isPrimary: true, roles: ['admin', 'seller', 'manager'], isActive: true },
        // Children of Purchase (parentId: 15)
        { menuId: 14, name: 'Purchase Requisition', path: '/restro/purchase/requisition', icon: 'request_quote', order: 1, parentId: 15, isSinglePage: true, roles: ['admin', 'seller', 'manager'], isActive: true },
        { menuId: 26, name: 'Purchase Order', path: '/restro/purchase/order', icon: 'shopping_cart_checkout', order: 2, parentId: 15, isSinglePage: true, roles: ['admin', 'seller', 'manager'], isActive: true },
        { menuId: 31, name: 'Receive Goods', menuNameNepali: 'Receive Goods', path: '/restro/purchase/grn', icon: 'move_to_inbox', order: 3, parentId: 15, isSinglePage: true, roles: ['admin', 'seller', 'manager'], isActive: true },
        { menuId: 32, name: 'Vendors', menuNameNepali: 'Vendors', path: '/restro/purchase/vendor', icon: 'groups', order: 4, parentId: 15, isSinglePage: true, roles: ['admin', 'seller', 'manager'], isActive: true },
        { menuId: 33, name: 'Invoicing', menuNameNepali: 'Invoicing', path: '/admin/billing', icon: 'receipt', order: 5, parentId: 15, isSinglePage: true, roles: ['admin', 'seller', 'manager'], isActive: true },
        { menuId: 46, name: 'Bill Of Material', path: '/restro/purchase/bom', icon: 'account_tree', order: 6, parentId: 15, isSinglePage: true, roles: ['admin', 'seller', 'manager'], isActive: true },

        // 7. Staff (Parent Category Menu)
        { menuId: 53, name: 'Staff', path: '/hrm', icon: 'groups', order: 7, parentId: null, isSinglePage: false, roles: ['admin'], isActive: true },
        // Children of Staff (parentId: 53)
        { menuId: 54, name: 'Staff Setup', path: '/hrm/staffsetup', icon: 'person_add', order: 1, parentId: 53, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 55, name: 'Staff Details', path: '/hrm/staffdetails', icon: 'badge', order: 2, parentId: 53, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 66, name: 'Staff Profile Picture', menuNameNepali: 'कर्मचारी प्रोफाइल तस्वीर', path: '/hrm/staff-profile-picture', icon: 'photo_camera', order: 3, parentId: 53, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 67, name: 'Staff Profile Picture Review', menuNameNepali: 'प्रोफाइल तस्वीर समीक्षा', path: '/hrm/staff-profile-picture-review', icon: 'fact_check', order: 4, parentId: 53, isSinglePage: true, roles: ['admin'], isActive: true },

        // 8. Auth (Parent Category Menu)
        { menuId: 10, name: 'Auth', path: '/auth', icon: 'shield', order: 8, parentId: null, isSinglePage: false, roles: ['admin'], isActive: true },
        // Children of Auth (parentId: 10)
        { menuId: 2, name: 'Menu Setup', path: '/admin/menus', icon: 'menu', order: 1, parentId: 10, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 4, name: 'Menu Role Setup', path: '/admin/roles', icon: 'admin_panel_settings', order: 2, parentId: 10, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 16, name: 'User Setup', path: '/admin/customers', icon: 'person', order: 3, parentId: 10, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 17, name: 'User Role', path: '/admin/permissions', icon: 'group', order: 4, parentId: 10, isSinglePage: true, roles: ['admin'], isActive: true },

        // 9. Restro Setup (Parent Category Menu)
        { menuId: 34, name: 'Restro Setup', path: '/restro', icon: 'restaurant_menu', order: 9, parentId: null, isSinglePage: false, roles: ['admin'], isActive: true },
        // Children of Restro Setup (parentId: 34)
        { menuId: 5, name: 'Dining Tables', path: '/tables', icon: 'table_restaurant', order: 1, parentId: 34, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 6, name: 'Restro Menu Categories', path: '/admin/categories', icon: 'category', order: 2, parentId: 34, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 8, name: 'Restro Menu Items', path: '/admin/products', icon: 'menu_book', order: 3, parentId: 34, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 35, name: 'Floor Plan Editor', path: '/floorplan/edit', icon: 'grid_view', order: 4, parentId: 34, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 36, name: 'Live Floor Plan', path: '/floorplan/view', icon: 'map', order: 5, parentId: 34, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 60, name: 'Menu Selection Types', menuNameNepali: 'Menu Selection Types', path: '/menuselectiontypes', icon: 'tune', order: 6, parentId: 34, isSinglePage: true, roles: ['admin'], isActive: true },

        // 10. Setting (Parent Category Menu)
        { menuId: 18, name: 'Setting', path: '/settings', icon: 'settings', order: 10, parentId: null, isSinglePage: false, roles: ['admin'], isActive: true },
        // Children of Setting (parentId: 18)
        { menuId: 19, name: 'Main Setup Layout', path: '/settings/main-setup', icon: 'tune', order: 1, parentId: 18, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 21, name: 'Office Setup', path: '/settings/main-setup?section=office', icon: 'business', order: 2, parentId: 18, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 22, name: 'Company Setup', path: '/settings/main-setup?section=company', icon: 'business_center', order: 3, parentId: 18, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 23, name: 'Department Branch Setup', path: '/settings/main-setup?section=department-branch', icon: 'account_tree', order: 4, parentId: 18, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 24, name: 'Department Setup', path: '/settings/main-setup?section=department', icon: 'corporate_fare', order: 5, parentId: 18, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 25, name: 'Level Designation', path: '/settings/main-setup?section=level-designation', icon: 'badge', order: 6, parentId: 18, isSinglePage: true, roles: ['admin'], isActive: true },

        // 11. Standalone Administration Pages
        { menuId: 71, name: 'Discounts & Coupons', path: '/admin/discounts', icon: 'tune', order: 11, parentId: null, isSinglePage: true, roles: ['admin', 'manager'], isActive: true },
        { menuId: 72, name: 'Hero Banners', path: '/admin/banners', icon: 'photo_camera', order: 12, parentId: null, isSinglePage: true, roles: ['admin', 'manager'], isActive: true },
        { menuId: 73, name: 'Customer Reviews', path: '/admin/reviews', icon: 'star', order: 13, parentId: null, isSinglePage: true, roles: ['admin', 'support', 'seller'], isActive: true },
        { menuId: 74, name: 'Audit Logs', path: '/admin/audit-logs', icon: 'analytics', order: 14, parentId: null, isSinglePage: true, roles: ['admin'], isActive: true },
        { menuId: 75, name: 'Security & Devices', path: '/admin/security', icon: 'lock', order: 15, parentId: null, isSinglePage: true, roles: ['admin', 'seller', 'support', 'manager', 'customer', 'user'], isActive: true },
      ];

      for (const m of standardMenus) {
        await Menu.findOneAndUpdate(
          { menuId: m.menuId },
          { $set: m },
          { upsert: true, new: true }
        );
      }

      await redisService.delByPattern('ecommerce:menus:*');
    } catch (err) {
      console.error('syncStandardMenus error:', err);
    }
  }

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

      // Ensure standard hierarchical menu dataset is seeded
      await this.syncStandardMenus();

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
      const allMenus = await Menu.find({ isActive: true })
        .sort({ order: 1, createdAt: 1 })
        .lean();

      // If user is super admin, always ensure full wildcard access
      if (isAdmin || userRole === 'admin') {
        effectivePermissions.add('*');
      }

      // Filter menus based on user role and permissions
      const hasConfiguredPermissions = roleDoc && Array.isArray(roleDoc.permissions);

      const allowedMenus = allMenus.filter((menu) => {
        if (isAdmin || userRole === 'admin') return true;
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
        const idStr = m._id ? m._id.toString() : String(m.id || m.menuId);
        const itemObj = {
          ...m,
          id: idStr,
          subItems: [],
        };
        menuMap.set(idStr, itemObj);
        if (m.menuId !== undefined && m.menuId !== null) {
          menuMap.set(String(m.menuId), itemObj);
        }
      });

      allowedMenus.forEach((m) => {
        const idStr = m._id ? m._id.toString() : String(m.id || m.menuId);
        const item = menuMap.get(idStr);
        let parentKey = null;

        if (m.parentId !== null && m.parentId !== undefined && m.parentId !== '' && m.parentId !== 'none') {
          if (typeof m.parentId === 'object' && m.parentId) {
            parentKey = (m.parentId._id || m.parentId.id || m.parentId.menuId || '').toString();
          } else {
            parentKey = String(m.parentId);
          }
        }

        if (parentKey && menuMap.has(parentKey) && menuMap.get(parentKey) !== item) {
          const parent = menuMap.get(parentKey);
          if (!parent.subItems.some((s) => s.id === item.id || s.path === item.path)) {
            parent.subItems.push({
              label: item.name,
              nameNepali: item.menuNameNepali || '',
              path: item.path,
              id: item.id,
              menuId: item.menuId,
              order: item.order || 0,
              icon: item.icon,
              isSinglePage: item.isSinglePage,
              isPrimary: item.isPrimary,
            });
          }
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
        .sort({ order: 1, menuId: 1, createdAt: 1 })
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

      let menuId = data.menuId;
      if (menuId === undefined || menuId === null || menuId === '') {
        const maxMenu = await Menu.findOne({ menuId: { $ne: null } })
          .sort({ menuId: -1 })
          .lean();
        menuId = (maxMenu?.menuId || 70) + 1;
      } else {
        menuId = Number(menuId);
      }

      let parentId = null;
      if (data.parentId !== undefined && data.parentId !== null && data.parentId !== '' && data.parentId !== 'none') {
        parentId = data.parentId;
      }

      let childId = null;
      if (data.childId !== undefined && data.childId !== null && data.childId !== '' && data.childId !== 'none') {
        childId = data.childId;
      }

      const menu = new Menu({
        ...data,
        menuId,
        parentId,
        childId,
        menuNameNepali: data.menuNameNepali || '',
        isSinglePage: Boolean(data.isSinglePage),
        isPrimary: Boolean(data.isPrimary),
        isChild: Boolean(data.isChild),
        isNotParent: data.isNotParent !== undefined ? Boolean(data.isNotParent) : true,
        isNotChild: data.isNotChild !== undefined ? Boolean(data.isNotChild) : true,
        menuCode: data.menuCode || '',
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
        if (
          updateData.parentId === '' ||
          updateData.parentId === 'none' ||
          updateData.parentId === null
        ) {
          updateData.parentId = null;
        }
      }
      if ('childId' in updateData) {
        if (
          updateData.childId === '' ||
          updateData.childId === 'none' ||
          updateData.childId === null
        ) {
          updateData.childId = null;
        }
      }
      if ('menuId' in updateData && updateData.menuId !== null && updateData.menuId !== undefined) {
        updateData.menuId = Number(updateData.menuId);
      }
      if ('isSinglePage' in updateData) updateData.isSinglePage = Boolean(updateData.isSinglePage);
      if ('isPrimary' in updateData) updateData.isPrimary = Boolean(updateData.isPrimary);
      if ('isChild' in updateData) updateData.isChild = Boolean(updateData.isChild);
      if ('isNotParent' in updateData) updateData.isNotParent = Boolean(updateData.isNotParent);
      if ('isNotChild' in updateData) updateData.isNotChild = Boolean(updateData.isNotChild);

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
