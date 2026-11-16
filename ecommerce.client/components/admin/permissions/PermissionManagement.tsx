import React, { useEffect, useState, useMemo } from 'react';
import { SaveOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { RoleItem, MenuItem, PermissionItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import './MenuRoleSetup.css';

interface MatrixMenu {
  id: string;
  name: string;
  parentId?: string | null;
  parentName?: string | null;
  order: number;
  isChild: boolean;
}

interface MatrixPermission {
  id: string;
  menuId: string;
  type: string; // 'Read' | 'Create' | 'Update' | 'Delete' | 'Export'
  code: string;
  isAssigned: boolean;
}

export const PermissionManagement: React.FC = () => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [dbMenus, setDbMenus] = useState<MenuItem[]>([]);
  const [dbPermissions, setDbPermissions] = useState<PermissionItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('0');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [assignedCodes, setAssignedCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;

  const { showToast } = useToast();

  // Load initial data: roles, menus, permissions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rolesRes, menusRes, permsRes] = await Promise.all([
          ecommerceService.getRoles(),
          ecommerceService.getAllMenus(),
          ecommerceService.getPermissions(),
        ]);

        if (rolesRes.success && rolesRes.data) {
          setRoles(rolesRes.data);
        }
        if (menusRes.success && menusRes.data) {
          setDbMenus(menusRes.data);
        }
        if (permsRes.success && permsRes.data) {
          setDbPermissions(permsRes.data);
        }
      } catch (err: any) {
        showToast(err?.message || 'Failed to load menu role setup data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sync selected role permissions into assignedCodes set
  useEffect(() => {
    if (selectedRoleId === '0' || !selectedRoleId) {
      setAssignedCodes(new Set());
      return;
    }

    const currentRole = roles.find(
      (r) => r.name.toLowerCase() === selectedRoleId.toLowerCase() || r.id === selectedRoleId
    );

    if (currentRole) {
      if (currentRole.permissions.includes('*')) {
        // Super Admin has all permissions
        setAssignedCodes(new Set(['*']));
      } else {
        setAssignedCodes(new Set(currentRole.permissions));
      }
    } else {
      setAssignedCodes(new Set());
    }
  }, [selectedRoleId, roles]);

  // Construct comprehensive menus & permissions matrix matching the reference architecture
  const { allMenus, parentMenus, menuPermissionsMap } = useMemo(() => {
    const defaultTemplate: {
      parent: string;
      order: number;
      children?: { name: string; types: string[]; codePrefix?: string }[];
      directTypes?: string[];
      codePrefix?: string;
    }[] = [
      {
        parent: 'Dashboard',
        order: 1,
        directTypes: ['Read'],
        codePrefix: 'dashboard',
      },
      {
        parent: 'Customer Store',
        order: 2,
        directTypes: ['Read'],
        codePrefix: 'store',
      },
      {
        parent: 'Products',
        order: 3,
        directTypes: ['Read', 'Create', 'Update', 'Delete'],
        codePrefix: 'products',
      },
      {
        parent: 'Inventory & Stock',
        order: 4,
        directTypes: ['Read', 'Update'],
        codePrefix: 'inventory',
      },
      {
        parent: 'Categories',
        order: 5,
        directTypes: ['Read', 'Create', 'Update', 'Delete'],
        codePrefix: 'categories',
      },
      {
        parent: 'Orders',
        order: 6,
        directTypes: ['Read', 'Create', 'Update', 'Delete'],
        codePrefix: 'orders',
      },
      {
        parent: 'Customer Reviews',
        order: 7,
        directTypes: ['Read', 'Create', 'Update', 'Delete'],
        codePrefix: 'reviews',
      },
      {
        parent: 'Account',
        order: 8,
        children: [
          { name: 'Customers & Sellers', types: ['Read', 'Create', 'Update', 'Delete'], codePrefix: 'customers' },
          { name: 'Seller Profile', types: ['Read', 'Update'], codePrefix: 'seller_profile' },
        ],
      },
      {
        parent: 'Logs',
        order: 9,
        children: [
          { name: 'Security & Devices', types: ['Read', 'Update'], codePrefix: 'security' },
          { name: 'Audit Logs', types: ['Read', 'Export'], codePrefix: 'audit' },
        ],
      },
      {
        parent: 'Setting',
        order: 10,
        children: [
          { name: 'Security Roles', types: ['Read', 'Create', 'Update', 'Delete'], codePrefix: 'roles' },
          { name: 'Permissions', types: ['Read', 'Update'], codePrefix: 'permissions' },
          { name: 'Menu Pages', types: ['Read', 'Create', 'Update', 'Delete'], codePrefix: 'menus' },
        ],
      },
    ];

    const builtMenus: MatrixMenu[] = [];
    const parentList: { id: string; name: string }[] = [];
    const permMap = new Map<string, MatrixPermission[]>();

    const getCode = (prefix: string, type: string, index = 0): string => {
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
      return `${prefix}:${action}${index > 0 ? `_${index}` : ''}`;
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
      };
      builtMenus.push(parentMenu);

      // If parent has direct permissions (e.g. Dashboard, Products, Orders)
      if (group.directTypes && group.directTypes.length > 0) {
        const directPerms: MatrixPermission[] = group.directTypes.map((type, idx) => ({
          id: `${parentId}-perm-${idx}`,
          menuId: parentId,
          type,
          code: getCode(group.codePrefix || parentId, type, idx),
          isAssigned: false,
        }));
        permMap.set(parentId, directPerms);
      } else {
        permMap.set(parentId, []);
      }

      // If parent has children, push each child IMMEDIATELY after parent row
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
          };
          builtMenus.push(childMenu);

          const childPerms: MatrixPermission[] = child.types.map((type, tIdx) => ({
            id: `${childId}-perm-${tIdx}`,
            menuId: childId,
            type,
            code: getCode(child.codePrefix || childId, type, tIdx),
            isAssigned: false,
          }));
          permMap.set(childId, childPerms);
        });
      }
    });

    // Also include any dynamic custom menus from database that are not already present
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

  // Filter menus based on selectedParentId
  const filteredMenus = useMemo(() => {
    if (!selectedParentId) {
      return allMenus;
    }
    return allMenus.filter(
      (m) => m.id === selectedParentId || m.parentId === selectedParentId
    );
  }, [allMenus, selectedParentId]);

  // Paginated menus for display
  const totalItems = filteredMenus.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const displayedMenus = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMenus.slice(startIndex, startIndex + pageSize);
  }, [filteredMenus, currentPage, pageSize]);

  // Check if a permission is assigned for the selected role
  const isPermissionAssigned = (permCode: string): boolean => {
    if (selectedRoleId === '0' || !selectedRoleId) return false;
    if (assignedCodes.has('*')) return true;
    return assignedCodes.has(permCode);
  };

  // Toggle permission assignment in state
  const handleToggle = (permCode: string) => {
    if (selectedRoleId === '0') return;

    setAssignedCodes((prev) => {
      const next = new Set(prev);
      if (next.has('*')) {
        // Expand wildcard to all current permissions minus the toggled one
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

  // Save assigned permissions to server
  const handleSave = async () => {
    if (selectedRoleId === '0' || !selectedRoleId) {
      showToast('Please select a role to save permissions', 'info');
      return;
    }

    setSaving(true);
    try {
      const roleName = selectedRoleId;
      const permissionsArray = Array.from(assignedCodes);

      const res = await ecommerceService.updateRolePermissions(roleName, permissionsArray);
      if (res.success) {
        showToast('Permissions saved.', 'success');
        // Update local roles state
        setRoles((prev) =>
          prev.map((r) =>
            r.name.toLowerCase() === roleName.toLowerCase()
              ? { ...r, permissions: permissionsArray }
              : r
          )
        );
      } else {
        showToast('Permissions could not be saved.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Permissions could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="kiran-role-page">
      <div className="kiran-role-scroll">
        {/* Breadcrumb nav */}
        <div className="breadcrumb-nav">
          <span>Admin</span>
          <span className="mx-2 font-normal text-slate-400">/</span>
          <span>Setting</span>
          <span className="mx-2 font-normal text-slate-400">/</span>
          <span>Permissions</span>
        </div>

        {/* Setup Card */}
        <div className="kiran-role-card">
          {/* Top Filter Bar */}
          <div className="kiran-role-filters">
            <label className="kiran-role-field">
              <span>Roles</span>
              <select
                value={selectedRoleId}
                onChange={(e) => {
                  setSelectedRoleId(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="0">Select</option>
                {roles.map((r) => (
                  <option key={r.id || r.name} value={r.name}>
                    {r.label || r.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="kiran-role-field">
              <span>Parent Menu</span>
              <select
                value={selectedParentId}
                onChange={(e) => {
                  setSelectedParentId(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All</option>
                {parentMenus.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="kiran-role-save"
              disabled={selectedRoleId === '0' || saving}
              onClick={handleSave}
            >
              <SaveOutlined />
              <span>{saving ? 'Saving…' : 'Save'}</span>
            </button>
          </div>

          {/* Matrix Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Spin size="large" />
              <span className="mt-3 text-xs font-medium text-slate-600">Loading permissions…</span>
            </div>
          ) : (
            <div className="kiran-role-grid">
              <div className="kiran-role-table-scroll">
                <table className="kiran-role-table">
                  <thead>
                    <tr>
                      <th>Menu Name</th>
                      <th>Permission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedMenus.map((menu) => {
                      const perms = menuPermissionsMap.get(menu.id) || [];
                      return (
                        <tr key={menu.id}>
                          <td>
                            {menu.isChild ? (
                              <span className="menu-child-name">{menu.name}</span>
                            ) : (
                              <b>{menu.name}</b>
                            )}
                          </td>
                          <td>
                            <div className="permission-checks">
                              {perms.map((perm) => {
                                const assigned = isPermissionAssigned(perm.code);
                                return (
                                  <label key={perm.id}>
                                    <input
                                      type="checkbox"
                                      checked={assigned}
                                      onChange={() => handleToggle(perm.code)}
                                      disabled={selectedRoleId === '0'}
                                    />
                                    <span>{perm.type}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Paginator matching Kiran HRM */}
              <div className="paginator">
                <span>{totalItems} Items</span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    title="Previous Page"
                  >
                    <LeftOutlined style={{ fontSize: 11 }} />
                  </button>
                  <span className="pagination-text px-1">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    title="Next Page"
                  >
                    <RightOutlined style={{ fontSize: 11 }} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PermissionManagement;
