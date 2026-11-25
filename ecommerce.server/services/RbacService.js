const mongoose = require('mongoose');
const { Menu } = require('../models/database/Menu');
const { Permission } = require('../models/database/Permission');
const { Role } = require('../models/database/Role');
const { User } = require('../../auth.server/models/database/User');
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');
const { redisService } = require('./RedisService');

class RbacService {
  /**
   * Synchronizes standard E-Commerce menus and completely purges any non-ecommerce / reference menus
   */
  async syncStandardMenus() {
    try {
      // 1. Permanently remove all restaurant, HRM, and non-ecommerce menus
      const nonEcommerceNames = [
        'Restro Setup', 'Dining Tables', 'Restro Menu Categories', 'Restro Menu Items',
        'Floor Plan Editor', 'Live Floor Plan', 'Menu Selection Types', 'Restro',
        'Purchase', 'Purchase Requisition', 'Purchase Order', 'Receive Goods', 'Vendors', 'Bill Of Material',
        'Staff', 'Staff Setup', 'Staff Details', 'Staff Profile Picture', 'Staff Profile Picture Review',
        'Setting', 'Settings', 'Main Setup Layout', 'General Setup', 'Office Setup', 'Company Setup',
        'Department Branch Setup', 'Department Setup', 'Level Designation',
        'Holiday', 'Holiday Calendar', 'Holiday Setup', 'Holiday Lists',
        'Duty Roster', 'Duty Overview', 'Manage Duty',
        'Leave', 'Leave Setup', 'Leave Position Setup', 'Leave Request', 'Leave Approval',
        'Leave Request HR', 'Leave Request By HR', 'Leave Cancel HR', 'Leave Balance',
        'Attendance', 'Manual Attendance', 'Manual Attendance By HR', 'Manual Attendance Direct Approval',
        'Pending Attendance', 'Attendance Pending View HR',
        'Report', 'Order Report', 'Menu Items Report', 'Order Appraisal Report',
        'KOT', 'BOT', 'Auth', 'Create Order', 'Order Dashboard'
      ];

      const nonEcommercePaths = [
        /^\/restro/,
        /^\/tables/,
        /^\/menuitems/,
        /^\/floorplan/,
        /^\/dutyroster/,
        /^\/Leave/,
        /^\/Holiday/,
        /^\/ManualAttendance/,
        /^\/Attedance/,
        /^\/PendingAttendance/,
        /^\/hrm/,
        /^\/settings/,
        /^\/menuselectiontypes/,
        /^\/report/,
        /^\/orderitemdetails/,
        /^\/purchase/,
        /^\/auth$/,
        /^\/categories$/,
      ];

      const validMenuIds = [1, 2, 21, 22, 23, 24, 11, 12, 13, 14, 4, 41, 42, 5, 10, 101, 102, 103, 104, 105, 60, 61, 62];

      await Menu.deleteMany({
        $or: [
          { name: { $in: nonEcommerceNames } },
          { path: { $in: ['/tables', '/categories', '/menuitems', '/floorplan/edit', '/floorplan/view', '/menuselectiontypes', '/restro/kot', '/restro/bot', '/restro/order-report', '/purchase', '/hrm', '/auth', '/settings'] } },
          ...nonEcommercePaths.map((regex) => ({ path: regex })),
          { menuId: { $nin: validMenuIds } },
        ],
      });

      // 2. Legitimate E-Commerce Platform Menus (Parents & Nested Submenus)
      const ecommerceMenus = [
        // 1. Dashboard (Single Page Root)
        {
          menuId: 1,
          name: 'Dashboard',
          menuNameNepali: '',
          path: '/admin',
          icon: 'dashboard',
          order: 1,
          parentId: null,
          isSinglePage: true,
          isPrimary: true,
          isNotParent: true,
          isNotChild: true,
          roles: ['admin', 'seller', 'support', 'manager'],
          isActive: true,
        },

        // 2. Products (Parent Menu)
        {
          menuId: 2,
          name: 'Products',
          menuNameNepali: '',
          path: '/admin/products',
          icon: 'shopping_cart',
          order: 2,
          parentId: null,
          isSinglePage: false,
          isPrimary: true,
          isNotParent: false,
          isNotChild: true,
          roles: ['admin', 'seller', 'manager'],
          isActive: true,
        },
        // 2.1 Products Submenus
        {
          menuId: 21,
          name: 'All Products',
          menuNameNepali: '',
          path: '/admin/products',
          icon: 'shopping_cart',
          order: 1,
          parentId: 2,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin', 'seller', 'manager'],
          isActive: true,
        },
        {
          menuId: 22,
          name: 'Categories',
          menuNameNepali: '',
          path: '/admin/categories',
          icon: 'category',
          order: 2,
          parentId: 2,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin', 'manager'],
          isActive: true,
        },
        {
          menuId: 24,
          name: 'Brands',
          menuNameNepali: '',
          path: '/admin/brands',
          icon: 'tag',
          order: 3,
          parentId: 2,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin', 'seller', 'manager'],
          isActive: true,
        },
        {
          menuId: 23,
          name: 'Stock & Inventory',
          menuNameNepali: '',
          path: '/admin/inventory',
          icon: 'inventory_2',
          order: 4,
          parentId: 2,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin', 'seller', 'manager'],
          isActive: true,
        },

        // 3. Order (Parent Menu)
        {
          menuId: 11,
          name: 'Order',
          menuNameNepali: '',
          path: '/admin/orders',
          icon: 'receipt_long',
          order: 3,
          parentId: null,
          isSinglePage: false,
          isPrimary: true,
          isNotParent: false,
          isNotChild: true,
          roles: ['admin', 'seller', 'support', 'manager'],
          isActive: true,
        },
        // 3.1 Order Submenus
        {
          menuId: 12,
          name: 'Orders',
          menuNameNepali: '',
          path: '/admin/orders',
          icon: 'receipt_long',
          order: 1,
          parentId: 11,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin', 'seller', 'support', 'manager'],
          isActive: true,
        },
        {
          menuId: 13,
          name: 'Billing',
          menuNameNepali: '',
          path: '/admin/billing',
          icon: 'receipt',
          order: 2,
          parentId: 11,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin', 'seller', 'support', 'manager'],
          isActive: true,
        },
        {
          menuId: 14,
          name: 'Customer Reviews',
          menuNameNepali: '',
          path: '/admin/reviews',
          icon: 'star',
          order: 3,
          parentId: 11,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin', 'support', 'seller'],
          isActive: true,
        },

        // 4. Marketing (Parent Menu)
        {
          menuId: 4,
          name: 'Marketing',
          menuNameNepali: '',
          path: '/admin/discounts',
          icon: 'tune',
          order: 4,
          parentId: null,
          isSinglePage: false,
          isPrimary: false,
          isNotParent: false,
          isNotChild: true,
          roles: ['admin', 'manager'],
          isActive: true,
        },
        // 4.1 Marketing Submenus
        {
          menuId: 41,
          name: 'Discounts & Coupons',
          menuNameNepali: '',
          path: '/admin/discounts',
          icon: 'tune',
          order: 1,
          parentId: 4,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin', 'manager'],
          isActive: true,
        },
        {
          menuId: 42,
          name: 'Hero Banners',
          menuNameNepali: '',
          path: '/admin/banners',
          icon: 'photo_camera',
          order: 2,
          parentId: 4,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin', 'manager'],
          isActive: true,
        },

        // 5. Accounts (Parent Menu)
        {
          menuId: 5,
          name: 'Accounts',
          menuNameNepali: 'खाताहरू',
          path: '/admin/accounts/employees',
          icon: 'groups',
          order: 5,
          parentId: null,
          isSinglePage: false,
          isPrimary: false,
          isNotParent: false,
          isNotChild: true,
          roles: ['admin', 'manager', 'support'],
          isActive: true,
        },
        // 5.1 Accounts Submenus
        {
          menuId: 51,
          name: 'Employee',
          menuNameNepali: 'कर्मचारीहरू',
          path: '/admin/accounts/employees',
          icon: 'badge',
          order: 1,
          parentId: 5,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin', 'manager', 'support'],
          isActive: true,
        },
        {
          menuId: 52,
          name: 'Client',
          menuNameNepali: 'ग्राहक तथा बिक्रेता',
          path: '/admin/accounts/clients',
          icon: 'groups',
          order: 2,
          parentId: 5,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin', 'manager', 'support', 'seller'],
          isActive: true,
        },

        // 6. Auth (Parent Menu)
        {
          menuId: 10,
          name: 'Auth',
          menuNameNepali: '',
          path: '/admin/auth',
          icon: 'shield',
          order: 6,
          parentId: null,
          isSinglePage: false,
          isPrimary: false,
          isNotParent: false,
          isNotChild: true,
          roles: ['admin'],
          isActive: true,
        },
        // 6.1 Auth Submenus
        {
          menuId: 101,
          name: 'Menu Setup',
          menuNameNepali: '',
          path: '/admin/menus',
          icon: 'menu',
          order: 1,
          parentId: 10,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin'],
          isActive: true,
        },
        {
          menuId: 102,
          name: 'Menu Role Setup',
          menuNameNepali: '',
          path: '/admin/roles',
          icon: 'admin_panel_settings',
          order: 2,
          parentId: 10,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin'],
          isActive: true,
        },
        {
          menuId: 103,
          name: 'User Setup',
          menuNameNepali: '',
          path: '/admin/customers',
          icon: 'person',
          order: 3,
          parentId: 10,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin'],
          isActive: true,
        },
        {
          menuId: 104,
          name: 'Role Permission',
          menuNameNepali: '',
          path: '/admin/permissions',
          icon: 'shield',
          order: 4,
          parentId: 10,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin'],
          isActive: true,
        },
        {
          menuId: 105,
          name: 'User Role Management',
          menuNameNepali: '',
          path: '/admin/user-roles',
          icon: 'group',
          order: 5,
          parentId: 10,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin'],
          isActive: true,
        },

        // 7. Security & System (Parent Menu)
        {
          menuId: 60,
          name: 'Security & System',
          menuNameNepali: '',
          path: '/admin/security',
          icon: 'lock',
          order: 7,
          parentId: null,
          isSinglePage: false,
          isPrimary: false,
          isNotParent: false,
          isNotChild: true,
          roles: ['admin'],
          isActive: true,
        },
        // 7.1 Security Submenus
        {
          menuId: 61,
          name: 'Security & Devices',
          menuNameNepali: '',
          path: '/admin/security',
          icon: 'lock',
          order: 1,
          parentId: 60,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin', 'seller', 'support', 'manager', 'customer', 'user'],
          isActive: true,
        },
        {
          menuId: 62,
          name: 'Audit Logs',
          menuNameNepali: '',
          path: '/admin/audit-logs',
          icon: 'analytics',
          order: 2,
          parentId: 60,
          isSinglePage: true,
          isPrimary: false,
          isChild: true,
          isNotParent: true,
          isNotChild: false,
          roles: ['admin'],
          isActive: true,
        },
      ];

      for (const m of ecommerceMenus) {
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

      // Fetch all active menus sorted by display order (excluding removed Setting menu)
      const allMenus = await Menu.find({
        isActive: true,
        name: { $nin: ['Setting', 'Settings', 'Main Setup Layout', 'General Setup', 'Office Setup', 'Company Setup', 'Department Branch Setup', 'Department Setup', 'Level Designation'] },
        path: { $not: /^\/settings/ },
      })
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
          if (!parent.subItems.some((s) => s.id === item.id || (s.menuId && s.menuId === item.menuId) || s.label === item.name)) {
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
        if (['Account', 'Accounts', 'Logs', 'Setting'].includes(root.name) && (!root.subItems || root.subItems.length === 0)) {
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
      const menus = await Menu.find({
        name: { $nin: ['Setting', 'Settings', 'Main Setup Layout', 'General Setup', 'Office Setup', 'Company Setup', 'Department Branch Setup', 'Department Setup', 'Level Designation'] },
        path: { $not: /^\/settings/ },
      })
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
