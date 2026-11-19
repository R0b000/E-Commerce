import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  SaveOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  TeamOutlined,
  StarOutlined,
  HistoryOutlined,
  LockOutlined,
  KeyOutlined,
  MenuOutlined,
  ShopOutlined,
  LeftOutlined,
  RightOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { Tag, Tooltip, Breadcrumb } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { RoleItem, MenuItem, PermissionItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../context/PermissionContext';
import {
  AppCard,
  AppTable,
  AppButton,
  AppInput,
  AppSelect,
  PageHeader,
  MatrixSkeleton,
} from 'shared-components';

interface MatrixMenu {
  id: string;
  name: string;
  parentId?: string | null;
  parentName?: string | null;
  order: number;
  isChild: boolean;
  category: string;
  icon?: string;
}

interface MatrixPermission {
  id: string;
  menuId: string;
  type: string; // 'Read' | 'Create' | 'Update' | 'Delete' | 'Export'
  code: string;
  isAssigned: boolean;
}

// Icon helper for module matrix rows
const getModuleIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('dashboard')) return <DashboardOutlined className="text-[#0096c7]" />;
  if (lower.includes('product')) return <ShoppingOutlined className="text-[#0096c7]" />;
  if (lower.includes('inventory') || lower.includes('stock')) return <AppstoreOutlined className="text-emerald-600" />;
  if (lower.includes('categor')) return <AppstoreOutlined className="text-amber-600" />;
  if (lower.includes('order')) return <FileTextOutlined className="text-blue-600" />;
  if (lower.includes('review')) return <StarOutlined className="text-orange-500" />;
  if (lower.includes('customer') || lower.includes('seller')) return <TeamOutlined className="text-indigo-600" />;
  if (lower.includes('vendor') || lower.includes('profile')) return <ShopOutlined className="text-purple-600" />;
  if (lower.includes('audit')) return <HistoryOutlined className="text-slate-600" />;
  if (lower.includes('security') || lower.includes('device')) return <LockOutlined className="text-rose-600" />;
  if (lower.includes('role')) return <KeyOutlined className="text-cyan-600" />;
  if (lower.includes('permission')) return <SafetyCertificateOutlined className="text-[#0096c7]" />;
  if (lower.includes('menu')) return <MenuOutlined className="text-teal-600" />;
  return <AppstoreOutlined className="text-slate-500" />;
};

export const PermissionManagement: React.FC = () => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [dbMenus, setDbMenus] = useState<MenuItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('manager');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [assignedCodes, setAssignedCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  const { showToast } = useToast();
  const { refreshPermissions, updateActivePermissions, role: activeUserRole } = usePermissions();

  // Load initial roles and menus from backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rolesRes, menusRes] = await Promise.all([
          ecommerceService.getRoles(),
          ecommerceService.getAllMenus(),
        ]);

        if (rolesRes.success && rolesRes.data) {
          setRoles(rolesRes.data);
          // Set default selected role to manager if available, else first role
          const hasManager = rolesRes.data.some((r) => r.name.toLowerCase() === 'manager');
          if (hasManager) {
            setSelectedRoleId('manager');
          } else if (rolesRes.data.length > 0) {
            setSelectedRoleId(rolesRes.data[0].name);
          }
        }
        if (menusRes.success && menusRes.data) {
          setDbMenus(menusRes.data);
        }
      } catch (err: any) {
        showToast(err?.message || 'Failed to load permissions configuration', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sync selected role permissions into assignedCodes state
  useEffect(() => {
    if (!selectedRoleId || selectedRoleId === '0') {
      setAssignedCodes(new Set());
      return;
    }

    const currentRole = roles.find(
      (r) => r.name.toLowerCase() === selectedRoleId.toLowerCase() || r.id === selectedRoleId
    );

    if (currentRole) {
      if (currentRole.permissions.includes('*')) {
        setAssignedCodes(new Set(['*']));
      } else {
        setAssignedCodes(new Set(currentRole.permissions));
      }
    } else {
      setAssignedCodes(new Set());
    }
  }, [selectedRoleId, roles]);

  // Construct comprehensive menus & permissions matrix
  const { allMenus, parentMenus, menuPermissionsMap } = useMemo(() => {
    const defaultTemplate: {
      parent: string;
      order: number;
      category: string;
      children?: { name: string; types: string[]; codePrefix?: string; category?: string }[];
      directTypes?: string[];
      codePrefix?: string;
    }[] = [
      {
        parent: 'Dashboard',
        order: 1,
        category: 'Overview',
        directTypes: ['Read'],
        codePrefix: 'dashboard',
      },
      {
        parent: 'Customer Store',
        order: 2,
        category: 'Storefront',
        directTypes: ['Read'],
        codePrefix: 'store',
      },
      {
        parent: 'Products',
        order: 3,
        category: 'Catalog',
        directTypes: ['Read', 'Create', 'Update', 'Delete'],
        codePrefix: 'products',
      },
      {
        parent: 'Inventory & Stock',
        order: 4,
        category: 'Catalog',
        directTypes: ['Read', 'Update'],
        codePrefix: 'inventory',
      },
      {
        parent: 'Categories',
        order: 5,
        category: 'Catalog',
        directTypes: ['Read', 'Create', 'Update', 'Delete'],
        codePrefix: 'categories',
      },
      {
        parent: 'Orders',
        order: 6,
        category: 'Fulfillment',
        directTypes: ['Read', 'Create', 'Update', 'Delete'],
        codePrefix: 'orders',
      },
      {
        parent: 'Customer Reviews',
        order: 7,
        category: 'Storefront',
        directTypes: ['Read', 'Create', 'Update', 'Delete'],
        codePrefix: 'reviews',
      },
      {
        parent: 'Account',
        order: 8,
        category: 'User Management',
        children: [
          { name: 'Customers & Sellers', types: ['Read', 'Create', 'Update', 'Delete'], codePrefix: 'customers', category: 'User Management' },
          { name: 'Seller Profile', types: ['Read', 'Update'], codePrefix: 'seller_profile', category: 'User Management' },
        ],
      },
      {
        parent: 'Logs',
        order: 9,
        category: 'Security & Monitoring',
        children: [
          { name: 'Security & Devices', types: ['Read', 'Update'], codePrefix: 'security', category: 'Security & Monitoring' },
          { name: 'Audit Logs', types: ['Read', 'Export'], codePrefix: 'audit', category: 'Security & Monitoring' },
        ],
      },
      {
        parent: 'Setting',
        order: 10,
        category: 'System Config',
        children: [
          { name: 'Security Roles', types: ['Read', 'Create', 'Update', 'Delete'], codePrefix: 'roles', category: 'System Config' },
          { name: 'Permissions', types: ['Read', 'Update'], codePrefix: 'permissions', category: 'System Config' },
          { name: 'Menu Pages', types: ['Read', 'Create', 'Update', 'Delete'], codePrefix: 'menus', category: 'System Config' },
        ],
      },
    ];

    const builtMenus: MatrixMenu[] = [];
    const parentList: { id: string; name: string }[] = [];
    const permMap = new Map<string, MatrixPermission[]>();

    const getCode = (prefix: string, type: string): string => {
      const lowerType = type.toLowerCase();
      const action =
        lowerType === 'read'
          ? 'read'
          : lowerType === 'create'
          ? 'create'
          : lowerType === 'update'
          ? 'edit'
          : lowerType === 'delete'
          ? 'delete'
          : lowerType;
      return `${prefix}:${action}`;
    };

    defaultTemplate.forEach((group) => {
      const parentId = `parent-${group.parent.toLowerCase().replace(/\s+/g, '-')}`;
      parentList.push({ id: parentId, name: group.parent });

      const parentMenu: MatrixMenu = {
        id: parentId,
        name: group.parent,
        parentId: null,
        parentName: null,
        order: group.order,
        isChild: false,
        category: group.category,
      };
      builtMenus.push(parentMenu);

      if (group.directTypes && group.directTypes.length > 0) {
        const directPerms: MatrixPermission[] = group.directTypes.map((type, idx) => ({
          id: `${parentId}-perm-${idx}`,
          menuId: parentId,
          type,
          code: getCode(group.codePrefix || parentId, type),
          isAssigned: false,
        }));
        permMap.set(parentId, directPerms);
      } else {
        permMap.set(parentId, []);
      }

      if (group.children) {
        group.children.forEach((child, cIdx) => {
          const childId = `child-${child.name.toLowerCase().replace(/\s+/g, '-')}`;
          const childMenu: MatrixMenu = {
            id: childId,
            name: child.name,
            parentId: parentId,
            parentName: group.parent,
            order: group.order,
            isChild: true,
            category: child.category || group.category,
          };
          builtMenus.push(childMenu);

          const childPerms: MatrixPermission[] = child.types.map((type, tIdx) => ({
            id: `${childId}-perm-${tIdx}`,
            menuId: childId,
            type,
            code: getCode(child.codePrefix || childId, type),
            isAssigned: false,
          }));
          permMap.set(childId, childPerms);
        });
      }
    });

    // Merge any custom menus from DB
    dbMenus.forEach((dm) => {
      const dmId = dm.id || dm._id;
      const alreadyIncluded = builtMenus.some(
        (m) => m.name.toLowerCase() === dm.name.toLowerCase()
      );
      if (!alreadyIncluded) {
        const isChild = Boolean(dm.parentId);
        const pId = dm.parentId ? String(dm.parentId) : `parent-${dm.name.toLowerCase()}`;
        if (!isChild) {
          parentList.push({ id: pId, name: dm.name });
        }
        builtMenus.push({
          id: dmId,
          name: dm.name,
          parentId: isChild ? pId : null,
          parentName: isChild ? 'Custom' : null,
          order: dm.order || 99,
          isChild,
          category: 'Custom Pages',
        });

        const customPerms: MatrixPermission[] = [
          { id: `${dmId}-read`, menuId: dmId, type: 'Read', code: `${dm.name.toLowerCase()}:read`, isAssigned: false },
          { id: `${dmId}-create`, menuId: dmId, type: 'Create', code: `${dm.name.toLowerCase()}:create`, isAssigned: false },
          { id: `${dmId}-update`, menuId: dmId, type: 'Update', code: `${dm.name.toLowerCase()}:edit`, isAssigned: false },
          { id: `${dmId}-delete`, menuId: dmId, type: 'Delete', code: `${dm.name.toLowerCase()}:delete`, isAssigned: false },
        ];
        permMap.set(dmId, customPerms);
      }
    });

    return { allMenus: builtMenus, parentMenus: parentList, menuPermissionsMap: permMap };
  }, [dbMenus]);

  // Filter menus based on parent menu selection and search input
  const filteredMenus = useMemo(() => {
    return allMenus.filter((m) => {
      if (selectedParentId && m.id !== selectedParentId && m.parentId !== selectedParentId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesCategory = m.category.toLowerCase().includes(q);
        const matchesParent = m.parentName?.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesParent) return false;
      }
      return true;
    });
  }, [allMenus, selectedParentId, searchQuery]);

  // Paginated menus
  const totalItems = filteredMenus.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const displayedMenus = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMenus.slice(startIndex, startIndex + pageSize);
  }, [filteredMenus, currentPage, pageSize]);

  // Check if a permission is assigned
  const isPermissionAssigned = (permCode: string): boolean => {
    if (!selectedRoleId || selectedRoleId === '0') return false;
    if (assignedCodes.has('*')) return true;
    return assignedCodes.has(permCode);
  };

  // Toggle single permission assignment
  const handleToggle = (permCode: string) => {
    if (!selectedRoleId || selectedRoleId === '0') {
      showToast('Please select a role to edit permissions', 'info');
      return;
    }

    setAssignedCodes((prev) => {
      const next = new Set(prev);
      if (next.has('*')) {
        // Expand wildcard into full list of permissions minus this one
        next.delete('*');
        menuPermissionsMap.forEach((perms) => {
          perms.forEach((p) => {
            if (p.code !== permCode) {
              next.add(p.code);
            }
          });
        });
      } else if (next.has(permCode)) {
        next.delete(permCode);
      } else {
        next.add(permCode);
      }
      return next;
    });
  };

  // Toggle all permissions for a specific module row
  const handleToggleRow = (menuId: string) => {
    const perms = menuPermissionsMap.get(menuId) || [];
    if (perms.length === 0) return;

    const allChecked = perms.every((p) => isPermissionAssigned(p.code));

    setAssignedCodes((prev) => {
      const next = new Set(prev);
      if (next.has('*')) {
        next.delete('*');
        menuPermissionsMap.forEach((pList) => {
          pList.forEach((p) => next.add(p.code));
        });
      }

      perms.forEach((p) => {
        if (allChecked) {
          next.delete(p.code);
        } else {
          next.add(p.code);
        }
      });
      return next;
    });
  };

  // Bulk actions: Grant All Read, Grant Full Access, Revoke All
  const handleGrantAllRead = () => {
    setAssignedCodes((prev) => {
      const next = new Set(prev);
      if (next.has('*')) next.delete('*');
      filteredMenus.forEach((m) => {
        const perms = menuPermissionsMap.get(m.id) || [];
        perms.forEach((p) => {
          if (p.type.toLowerCase() === 'read') {
            next.add(p.code);
          }
        });
      });
      return next;
    });
    showToast('Granted READ permission across all displayed modules', 'success');
  };

  const handleGrantFullAccess = () => {
    setAssignedCodes((prev) => {
      const next = new Set(prev);
      filteredMenus.forEach((m) => {
        const perms = menuPermissionsMap.get(m.id) || [];
        perms.forEach((p) => next.add(p.code));
      });
      return next;
    });
    showToast('Granted full CRUD permissions for all displayed modules', 'success');
  };

  const handleRevokeAll = () => {
    setAssignedCodes((prev) => {
      const next = new Set(prev);
      if (next.has('*')) next.delete('*');
      filteredMenus.forEach((m) => {
        const perms = menuPermissionsMap.get(m.id) || [];
        perms.forEach((p) => next.delete(p.code));
      });
      return next;
    });
    showToast('Revoked permissions for all displayed modules', 'info');
  };

  // Reset to default permissions for the selected role
  const handleResetDefaults = () => {
    const roleDoc = roles.find((r) => r.name.toLowerCase() === selectedRoleId.toLowerCase());
    if (roleDoc) {
      setAssignedCodes(new Set(roleDoc.permissions));
      showToast(`Reset permissions to system defaults for ${roleDoc.label || roleDoc.name}`, 'info');
    }
  };

  // Save assigned permissions to server and update live application policy
  const handleSave = async () => {
    if (!selectedRoleId || selectedRoleId === '0') {
      showToast('Please select a role to save permissions', 'info');
      return;
    }

    setSaving(true);
    try {
      const roleName = selectedRoleId.toLowerCase();
      const permissionsArray = Array.from(assignedCodes);

      const res = await ecommerceService.updateRolePermissions(roleName, permissionsArray);
      if (res.success) {
        showToast(`Permissions successfully updated for ${roleName.toUpperCase()}! Policy is now active in real time.`, 'success');

        // Update local roles state
        setRoles((prev) =>
          prev.map((r) =>
            r.name.toLowerCase() === roleName
              ? { ...r, permissions: permissionsArray }
              : r
          )
        );

        // Update active application permissions reactively
        if (activeUserRole.toLowerCase() === roleName) {
          updateActivePermissions(permissionsArray);
        }
        await refreshPermissions(roleName);
      } else {
        showToast('Permissions could not be saved', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Permissions could not be saved', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdminRole = selectedRoleId.toLowerCase() === 'admin';
  const activeRoleDoc = roles.find((r) => r.name.toLowerCase() === selectedRoleId.toLowerCase());

  return (
    <div className="w-full font-['Poppins','Inter',sans-serif] space-y-4">
      {/* Breadcrumb Navigation */}
      <div className="px-2 flex items-center gap-1.5 text-[11px] leading-none text-slate-400 mb-0 pb-0">
        <Breadcrumb
          className="text-[11px] leading-none text-slate-400 [&_*]:border-0"
          items={[
            {
              title: (
                <Link to="/admin" className="text-slate-400 hover:text-[#0096C7] transition-colors">
                  Admin
                </Link>
              ),
            },
            {
              title: (
                <Link to="/admin/roles" className="text-slate-400 hover:text-[#0096C7] transition-colors">
                  Roles & Access
                </Link>
              ),
            },
            {
              title: <span className="text-slate-600 font-medium">Permissions Matrix</span>,
            },
          ]}
        />
      </div>

      {/* Main Integrated Header */}
      <div className="bg-white rounded-t-2xl rounded-b-md shadow-xs">
        <div className="px-2 py-3 sm:py-3.5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white relative z-20 rounded-t-2xl">
          <div className="flex flex-col min-w-0">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Role Permissions & Access Matrix
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Configure granular Read, Create, Update, and Delete capabilities for each role and module. Real-time enforcement applies across the entire store admin.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AppButton
              icon={<ReloadOutlined />}
              onClick={handleResetDefaults}
              disabled={saving}
              title="Reset to role defaults"
            >
              Reset
            </AppButton>
            <AppButton
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              style={{ backgroundColor: '#0096C7' }}
            >
              Save Permissions
            </AppButton>
          </div>
        </div>
      </div>

      {/* Role Selection & Filter Controls Card */}
      <AppCard>
        <div className="space-y-4">
          {/* Top Bar: Role Selector, Parent Category Filter, and Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Target Role
              </label>
              <AppSelect
                value={selectedRoleId}
                onChange={(val) => {
                  setSelectedRoleId(val || '0');
                  setCurrentPage(1);
                }}
                className="w-full"
                options={roles.map((r) => ({
                  label: `${r.label || r.name} (${r.name})`,
                  value: r.name,
                }))}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Parent Module / Group
              </label>
              <AppSelect
                value={selectedParentId}
                onChange={(val) => {
                  setSelectedParentId(val || '');
                  setCurrentPage(1);
                }}
                className="w-full"
                options={[
                  { label: 'All Categories', value: '' },
                  ...parentMenus.map((pm) => ({
                    label: pm.name,
                    value: pm.id,
                  })),
                ]}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Filter Modules
              </label>
              <AppInput
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder="Search modules by name or category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                allowClear
              />
            </div>
          </div>

          {/* Quick Bulk Action Buttons & Summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 text-[11px] font-medium mr-1">Quick Batch:</span>
              <button
                type="button"
                onClick={handleGrantAllRead}
                className="px-2.5 py-1 text-[11px] font-semibold text-[#0096c7] bg-cyan-50 hover:bg-cyan-100 rounded-lg border border-cyan-200 transition-colors cursor-pointer"
              >
                + Grant All Read
              </button>
              <button
                type="button"
                onClick={handleGrantFullAccess}
                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              >
                + Grant All CRUD
              </button>
              <button
                type="button"
                onClick={handleRevokeAll}
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
              >
                - Revoke Filtered
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">
                Active Policy:
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                {assignedCodes.has('*') ? 'Wildcard (*)' : `${assignedCodes.size} privileges assigned`}
              </span>
            </div>
          </div>
        </div>
      </AppCard>

      {/* Super Admin Notice Card */}
      {isSuperAdminRole && (
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3">
          <InfoCircleOutlined className="text-[#0096c7] text-base mt-0.5 shrink-0" />
          <div className="text-xs text-slate-700">
            <span className="font-bold text-[#0096c7]">Super Administrator Notice: </span>
            This role operates with full system root privilege (<code className="bg-white px-1 rounded border border-blue-200 font-mono text-[11px]">*</code>).
            All modules, CRUD actions, and route guards are authorized without limitation. Select any other role above (e.g. DepartMent Head, HR, Staff, Marketplace Seller) to customize specific boundaries.
          </div>
        </div>
      )}

      {/* Main Permissions Matrix Table (Shared Standard Table Architecture) */}
      <div className="bg-white rounded-t-2xl rounded-b-md shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <MatrixSkeleton />
          </div>
        ) : (
          <AppTable
            footerLabel="Total Modules"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalItems,
              onChange: (page) => setCurrentPage(page),
            }}
          >
            {/* Cyan Table Header */}
            <thead>
              <tr className="bg-[#0096C7] text-white text-[12px] font-medium tracking-wide">
                <th className="py-2.5 px-4 rounded-tl-xl font-medium">Module / Resource</th>
                <th className="py-2.5 px-4 font-medium">Category</th>
                <th className="py-2.5 px-3 text-center font-medium">Read / View</th>
                <th className="py-2.5 px-3 text-center font-medium">Create / Add</th>
                <th className="py-2.5 px-3 text-center font-medium">Update / Edit</th>
                <th className="py-2.5 px-3 text-center font-medium">Delete / Remove</th>
                <th className="py-2.5 px-4 text-center rounded-tr-xl font-medium">Row Action</th>
              </tr>
            </thead>

              {/* Table Rows */}
              <tbody className="divide-y divide-slate-100">
                {displayedMenus.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No modules found matching your search filter.
                    </td>
                  </tr>
                ) : (
                  displayedMenus.map((menu) => {
                    const perms = menuPermissionsMap.get(menu.id) || [];
                    const readPerm = perms.find((p) => p.type.toLowerCase() === 'read');
                    const createPerm = perms.find((p) => p.type.toLowerCase() === 'create');
                    const updatePerm = perms.find(
                      (p) => p.type.toLowerCase() === 'update' || p.type.toLowerCase() === 'edit'
                    );
                    const deletePerm = perms.find((p) => p.type.toLowerCase() === 'delete');

                    const allRowChecked =
                      perms.length > 0 && perms.every((p) => isPermissionAssigned(p.code));

                    return (
                      <tr
                        key={menu.id}
                        className={`transition-colors hover:bg-[#e0f2fe]/60 ${
                          menu.isChild ? 'bg-white' : 'bg-slate-50/70 font-semibold text-slate-900'
                        }`}
                      >
                        {/* Module Name & Icon */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {menu.isChild ? (
                              <span className="text-slate-300 ml-3 mr-1 font-mono">└─</span>
                            ) : null}
                            <span className="text-sm shrink-0">
                              {getModuleIcon(menu.name)}
                            </span>
                            <span className="truncate text-slate-800">
                              {menu.name}
                            </span>
                            {!menu.isChild && (
                              <span className="ml-1 text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-600 font-bold">
                                Section
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td className="py-3 px-4 text-slate-500">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/70">
                            {menu.category}
                          </span>
                        </td>

                        {/* Read Permission Pill */}
                        <td className="py-3 px-3 text-center">
                          {readPerm ? (
                            <button
                              type="button"
                              onClick={() => handleToggle(readPerm.code)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                isPermissionAssigned(readPerm.code)
                                  ? 'bg-[#0096c7] text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                              }`}
                              title={readPerm.code}
                            >
                              {isPermissionAssigned(readPerm.code) ? (
                                <CheckOutlined className="text-[10px]" />
                              ) : null}
                              <span>Read</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )}
                        </td>

                        {/* Create Permission Pill */}
                        <td className="py-3 px-3 text-center">
                          {createPerm ? (
                            <button
                              type="button"
                              onClick={() => handleToggle(createPerm.code)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                isPermissionAssigned(createPerm.code)
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                              }`}
                              title={createPerm.code}
                            >
                              {isPermissionAssigned(createPerm.code) ? (
                                <CheckOutlined className="text-[10px]" />
                              ) : null}
                              <span>Create</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )}
                        </td>

                        {/* Update Permission Pill */}
                        <td className="py-3 px-3 text-center">
                          {updatePerm ? (
                            <button
                              type="button"
                              onClick={() => handleToggle(updatePerm.code)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                isPermissionAssigned(updatePerm.code)
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                              }`}
                              title={updatePerm.code}
                            >
                              {isPermissionAssigned(updatePerm.code) ? (
                                <CheckOutlined className="text-[10px]" />
                              ) : null}
                              <span>Update</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )}
                        </td>

                        {/* Delete Permission Pill */}
                        <td className="py-3 px-3 text-center">
                          {deletePerm ? (
                            <button
                              type="button"
                              onClick={() => handleToggle(deletePerm.code)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                isPermissionAssigned(deletePerm.code)
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                              }`}
                              title={deletePerm.code}
                            >
                              {isPermissionAssigned(deletePerm.code) ? (
                                <CheckOutlined className="text-[10px]" />
                              ) : null}
                              <span>Delete</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )}
                        </td>

                        {/* Row Quick Action: Toggle Row */}
                        <td className="py-3 px-4 text-center">
                          {perms.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleToggleRow(menu.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                                allRowChecked
                                  ? 'bg-cyan-50 text-[#0096c7] border-cyan-200 hover:bg-cyan-100'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {allRowChecked ? 'Revoke Row' : 'Grant Row'}
                            </button>
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
          </AppTable>
        )}
      </div>
    </div>
  );
};

export default PermissionManagement;
