import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  SaveOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckOutlined,
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
  DownOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { Breadcrumb } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { RoleItem, MenuItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../context/PermissionContext';
import {
  AppTable,
  AppButton,
  AppInput,
  AppSelect,
  TableSkeleton,
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
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [assignedCodes, setAssignedCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

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
        category: 'General',
        directTypes: ['Read', 'Export'],
        codePrefix: 'dashboard',
      },
      {
        parent: 'Product Catalog',
        order: 2,
        category: 'Catalog',
        children: [
          { name: 'Products & Inventory', types: ['Read', 'Create', 'Update', 'Delete'], codePrefix: 'products' },
          { name: 'Warehouse Stock', types: ['Read', 'Update'], codePrefix: 'inventory' },
          { name: 'Categories & Taxonomy', types: ['Read', 'Create', 'Update', 'Delete'], codePrefix: 'categories' },
        ],
      },
      {
        parent: 'Sales & Fulfillment',
        order: 3,
        category: 'Sales',
        children: [
          { name: 'Customer Orders', types: ['Read', 'Update'], codePrefix: 'orders' },
          { name: 'Order Status & Tracking', types: ['Read', 'Update'], codePrefix: 'orders' },
          { name: 'Customer Reviews', types: ['Read', 'Update', 'Delete'], codePrefix: 'reviews' },
        ],
      },
      {
        parent: 'Users & Customers',
        order: 4,
        category: 'People',
        children: [
          { name: 'Customer Directory', types: ['Read', 'Create', 'Update', 'Delete'], codePrefix: 'customers' },
          { name: 'Seller Profiles & Verification', types: ['Read', 'Update'], codePrefix: 'vendors' },
        ],
      },
      {
        parent: 'Security & Access',
        order: 5,
        category: 'System',
        children: [
          { name: 'Roles Management', types: ['Read', 'Create', 'Update', 'Delete'], codePrefix: 'roles' },
          { name: 'Permissions Matrix', types: ['Read', 'Update'], codePrefix: 'permissions' },
          { name: 'Navigation Menus', types: ['Read', 'Create', 'Update', 'Delete'], codePrefix: 'menus' },
        ],
      },
      {
        parent: 'Operations & Audit',
        order: 6,
        category: 'System',
        children: [
          { name: 'Audit Logs', types: ['Read', 'Export'], codePrefix: 'audit' },
          { name: 'Active Sessions & Security', types: ['Read', 'Delete'], codePrefix: 'security' },
        ],
      },
    ];

    const parents: MatrixMenu[] = [];
    const flattenedMenus: MatrixMenu[] = [];
    const permMap = new Map<string, MatrixPermission[]>();

    defaultTemplate.forEach((tmpl, tmplIdx) => {
      const parentId = `parent-${tmplIdx}`;
      const parentMenu: MatrixMenu = {
        id: parentId,
        name: tmpl.parent,
        parentId: null,
        parentName: null,
        order: tmpl.order,
        isChild: false,
        category: tmpl.category,
      };
      parents.push(parentMenu);
      flattenedMenus.push(parentMenu);

      if (tmpl.directTypes) {
        const perms: MatrixPermission[] = tmpl.directTypes.map((type) => {
          const actionSlug = type.toLowerCase() === 'update' ? 'edit' : type.toLowerCase();
          const code = `${tmpl.codePrefix || 'general'}:${actionSlug}`;
          return {
            id: `perm-${parentId}-${type}`,
            menuId: parentId,
            type,
            code,
            isAssigned: false,
          };
        });
        permMap.set(parentId, perms);
      }

      if (tmpl.children) {
        tmpl.children.forEach((child, cIdx) => {
          const childId = `child-${tmplIdx}-${cIdx}`;
          const childMenu: MatrixMenu = {
            id: childId,
            name: child.name,
            parentId: parentId,
            parentName: tmpl.parent,
            order: tmpl.order * 10 + cIdx,
            isChild: true,
            category: child.category || tmpl.category,
          };
          flattenedMenus.push(childMenu);

          const perms: MatrixPermission[] = child.types.map((type) => {
            let actionSlug = type.toLowerCase();
            if (actionSlug === 'update') actionSlug = 'edit';
            const code = `${child.codePrefix || 'general'}:${actionSlug}`;
            return {
              id: `perm-${childId}-${type}`,
              menuId: childId,
              type,
              code,
              isAssigned: false,
            };
          });
          permMap.set(childId, perms);
        });
      }
    });

    // Also blend in custom database menus dynamically
    if (dbMenus && dbMenus.length > 0) {
      dbMenus.forEach((dbM, idx) => {
        const dbId = `custom-db-${dbM._id || dbM.id || idx}`;
        const alreadyExists = flattenedMenus.some(
          (m) => m.name.toLowerCase() === dbM.name.toLowerCase()
        );
        if (!alreadyExists) {
          const customMenu: MatrixMenu = {
            id: dbId,
            name: dbM.name,
            parentId: null,
            parentName: 'Custom Extensions',
            order: 90 + idx,
            isChild: false,
            category: 'Custom Pages',
            icon: dbM.icon,
          };
          flattenedMenus.push(customMenu);

          const customPerms: MatrixPermission[] = [
            { id: `${dbId}-read`, menuId: dbId, type: 'Read', code: `pages:${dbM.name.toLowerCase()}`, isAssigned: false },
            { id: `${dbId}-create`, menuId: dbId, type: 'Create', code: `${dbM.name.toLowerCase()}:create`, isAssigned: false },
            { id: `${dbId}-update`, menuId: dbId, type: 'Update', code: `${dbM.name.toLowerCase()}:edit`, isAssigned: false },
            { id: `${dbId}-delete`, menuId: dbId, type: 'Delete', code: `${dbM.name.toLowerCase()}:delete`, isAssigned: false },
          ];
          permMap.set(dbId, customPerms);
        }
      });
    }

    return {
      allMenus: flattenedMenus,
      parentMenus: parents,
      menuPermissionsMap: permMap,
    };
  }, [dbMenus]);

  // Check if a permission is assigned
  const isPermissionAssigned = (permCode: string): boolean => {
    if (!selectedRoleId || selectedRoleId === '0') return false;
    if (assignedCodes.has('*')) return true;
    return assignedCodes.has(permCode);
  };

  // Filtered menus based on Parent dropdown, search query, and assignment filter
  const filteredMenus = useMemo(() => {
    return allMenus.filter((m) => {
      // Parent module filter
      if (selectedParentId && m.parentId !== selectedParentId && m.id !== selectedParentId) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesCategory = m.category.toLowerCase().includes(q);
        const matchesParent = m.parentName?.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesParent) return false;
      }

      // Assignment status filter
      if (assignmentFilter !== 'all') {
        const perms = menuPermissionsMap.get(m.id) || [];
        const hasAssigned = perms.some((p) => isPermissionAssigned(p.code));
        if (assignmentFilter === 'assigned' && !hasAssigned) return false;
        if (assignmentFilter === 'unassigned' && hasAssigned) return false;
      }

      return true;
    });
  }, [allMenus, selectedParentId, searchQuery, assignmentFilter, assignedCodes, menuPermissionsMap]);

  // Paginated menus
  const totalItems = filteredMenus.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const displayedMenus = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMenus.slice(startIndex, startIndex + pageSize);
  }, [filteredMenus, currentPage, pageSize]);

  // Toggle single permission assignment
  const handleToggle = (permCode: string) => {
    if (!selectedRoleId || selectedRoleId === '0') {
      showToast('Please select a role to edit permissions', 'info');
      return;
    }

    setAssignedCodes((prev) => {
      const next = new Set(prev);
      if (next.has('*')) {
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

        setRoles((prev) =>
          prev.map((r) =>
            r.name.toLowerCase() === roleName
              ? { ...r, permissions: permissionsArray }
              : r
          )
        );

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

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden font-['Poppins','Inter',sans-serif] space-y-2.5">
      {/* Breadcrumb Navigation */}
      <div className="px-2 flex items-center justify-between gap-1.5 text-[11px] leading-none text-slate-500 font-semibold shrink-0">
        <Breadcrumb
          className="text-[11px] leading-none text-slate-500 [&_*]:border-0 font-semibold"
          items={[
            {
              title: (
                <Link to="/admin" className="text-slate-500 hover:text-[#0096C7] transition-colors font-semibold">
                  Admin
                </Link>
              ),
            },
            {
              title: (
                <Link to="/admin/roles" className="text-slate-500 hover:text-[#0096C7] transition-colors font-semibold">
                  Roles & Access
                </Link>
              ),
            },
            {
              title: <span className="text-slate-700 font-semibold">Permissions Matrix</span>,
            },
          ]}
        />
      </div>

      {/* Main Permissions Matrix Card with Integrated Header */}
      <div className="flex-1 min-h-0 bg-white rounded-t-2xl rounded-b-[2px] shadow-xs overflow-hidden flex flex-col">
        {/* Table Top Controls & Integrated Header */}
        <div className="pl-0 pr-4 py-3 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white relative z-20 rounded-t-2xl shrink-0">
          <div className="flex flex-col min-w-0">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Role Permissions & Access Matrix
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Target Role Selector */}
            <div className="w-full sm:w-[190px] shrink-0">
              <AppSelect
                value={selectedRoleId}
                onChange={(val) => {
                  setSelectedRoleId(val || '0');
                  setCurrentPage(1);
                }}
                options={roles.map((r) => ({
                  label: `${r.label || r.name} (${r.name})`,
                  value: r.name,
                }))}
              />
            </div>

            {/* Category Filter */}
            <div className="w-full sm:w-[150px] shrink-0">
              <AppSelect
                value={selectedParentId}
                onChange={(val) => {
                  setSelectedParentId(val || '');
                  setCurrentPage(1);
                }}
                options={[
                  { label: 'All Categories', value: '' },
                  ...parentMenus.map((pm) => ({
                    label: pm.name,
                    value: pm.id,
                  })),
                ]}
              />
            </div>

            {/* Assignment Status Filter */}
            <div className="w-full sm:w-[140px] shrink-0">
              <AppSelect
                value={assignmentFilter}
                onChange={(val) => {
                  setAssignmentFilter(val as string);
                  setCurrentPage(1);
                }}
                options={[
                  { label: 'All Modules', value: 'all' },
                  { label: 'Has Privileges', value: 'assigned' },
                  { label: 'Unassigned', value: 'unassigned' },
                ]}
              />
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-[190px] shrink-0">
              <AppInput
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                allowClear
              />
            </div>
          </div>
        </div>

        {/* Secondary Action Strip: Quick Batch Actions & Save Policy */}
        <div className="px-6 py-2 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Left Side: Super Admin indicator if active */}
          <div className="flex items-center gap-2">
            {isSuperAdminRole && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                <InfoCircleOutlined className="text-[10px]" />
                Super Admin: Unrestricted Root Access (*)
              </span>
            )}
          </div>

          {/* Right Side: Quick Batch Actions + Reset & Save Policy Buttons */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <div className="flex items-center gap-1.5 flex-wrap">
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

            <div className="h-4 w-[1px] bg-slate-300 mx-1 hidden sm:block" />

            <div className="flex items-center gap-1.5 shrink-0">
              <AppButton
                icon={<ReloadOutlined />}
                onClick={handleResetDefaults}
                disabled={saving}
                size="small"
                title="Reset to role defaults"
              >
                Reset
              </AppButton>
              <AppButton
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                size="small"
                style={{ backgroundColor: '#0096C7' }}
              >
                Save Policy
              </AppButton>
            </div>
          </div>
        </div>

        {/* Matrix Table Wrapper (Independent Scroll Area) */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <AppTable wrapperClassName="h-full flex-1 flex flex-col min-h-0" className="w-full border-collapse">
            <thead>
              <tr>
                <th className="py-2.5 px-6 font-medium text-[12px]">Module / Resource</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Category</th>
                <th className="py-2.5 px-3 !text-center font-medium text-[12px]">Read / View</th>
                <th className="py-2.5 px-3 !text-center font-medium text-[12px]">Create / Add</th>
                <th className="py-2.5 px-3 !text-center font-medium text-[12px]">Update / Edit</th>
                <th className="py-2.5 px-3 !text-center font-medium text-[12px]">Delete / Remove</th>
                <th className="py-2.5 px-6 !text-right font-medium text-[12px]">Row Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton columns={7} rows={8} hasAvatar={false} />
              ) : displayedMenus.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No modules found matching your search or filters.
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
                      className={`hover:bg-slate-50/70 transition-colors group cursor-default text-xs ${
                        menu.isChild ? 'bg-white' : 'bg-slate-50/40 font-medium'
                      }`}
                    >
                      {/* Module Name & Icon */}
                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {menu.isChild ? (
                            <span className="text-slate-300 ml-2 mr-0.5 font-mono">└─</span>
                          ) : null}
                          <span className="text-sm shrink-0">
                            {getModuleIcon(menu.name)}
                          </span>
                          <span className="font-semibold text-slate-900 text-xs truncate">
                            {menu.name}
                          </span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/70">
                          {menu.category}
                        </span>
                      </td>

                      {/* Read Permission Pill */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
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
                      <td className="py-3 px-3 text-center whitespace-nowrap">
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
                      <td className="py-3 px-3 text-center whitespace-nowrap">
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
                      <td className="py-3 px-3 text-center whitespace-nowrap">
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

                      {/* Row Action */}
                      <td className="py-3 px-6 text-right whitespace-nowrap">
                        {perms.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleToggleRow(menu.id)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                              allRowChecked
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-cyan-50 text-[#0096c7] border-cyan-200 hover:bg-cyan-100'
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
        </div>

        {/* Table Footer: Count on Left, Pagination on Right */}
        <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-[2px] flex items-center justify-between text-[11px] shadow-inner select-none shrink-0">
          {/* Left Side: Module & Policy Count */}
          <div className="flex items-center gap-2 leading-none">
            <span className="font-medium text-white/90 text-[11px] leading-none">Total Modules:</span>
            <span className="font-bold text-white text-[11px] leading-none">
              {filteredMenus.length} Items
            </span>
            <span className="text-white/40">|</span>
            <span className="text-white/90 text-[10px] leading-none">
              Role: <strong className="text-white uppercase">{selectedRoleId}</strong> ({assignedCodes.has('*') ? 'Wildcard *' : `${assignedCodes.size} assigned`})
            </span>
          </div>

          {/* Right Side: Pagination Controls */}
          {filteredMenus.length > 10 && (
            <div className="flex items-center gap-2.5 leading-none">
              <div className="flex items-center gap-1 text-[10px] text-white/95 font-medium leading-none">
                <span>Rows:</span>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="appearance-none bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-[10px] rounded pl-1.5 pr-4 py-0 outline-none cursor-pointer transition-colors focus:ring-1 focus:ring-white h-[20px] leading-none"
                  >
                    <option value={10} className="bg-slate-800 text-white">10</option>
                    <option value={20} className="bg-slate-800 text-white">20</option>
                    <option value={50} className="bg-slate-800 text-white">50</option>
                    <option value={100} className="bg-slate-800 text-white">100</option>
                  </select>
                  <DownOutlined className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[7px] text-white/80" />
                </div>
              </div>

              <span className="text-[10px] text-white/95 font-medium whitespace-nowrap leading-none">
                {filteredMenus.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, filteredMenus.length)} of {filteredMenus.length}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous page"
                  className="w-5 h-5 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20"
                >
                  <LeftOutlined className="text-[8px]" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next page"
                  className="w-5 h-5 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20"
                >
                  <RightOutlined className="text-[8px]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionManagement;
