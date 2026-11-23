import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  SafetyCertificateOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  KeyOutlined,
  CustomerServiceOutlined,
  AppstoreOutlined,
  SearchOutlined,
  ShopOutlined,
  TeamOutlined,
  LeftOutlined,
  RightOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { Tag, Breadcrumb, Popconfirm, Dropdown } from 'antd';
import { useAuth } from 'auth-client/hooks/useAuth';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { RoleItem, PermissionItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppTable,
  AppButton,
  AppInput,
  AppModal,
  TableSkeleton,
} from 'shared-components';
import { RoleManagementProps } from './RoleManagement.types';

export const RoleManagement: React.FC<RoleManagementProps> = ({ onRoleSelect }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Add Role Modal State
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Edit Role Modal State (Editable Role Details)
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        ecommerceService.getRoles(),
        ecommerceService.getPermissions(),
      ]);

      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data);
      }
      if (permsRes.success && permsRes.data) {
        setPermissions(permsRes.data);
      }
    } catch {
      showToast('Failed to load roles and permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEditModal = (role: RoleItem) => {
    setEditingRole(role);
    setEditLabel(role.label);
    setEditDescription(role.description || '');
    if (onRoleSelect) {
      onRoleSelect(role);
    }
  };

  const handleSaveRole = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingRole) return;
    if (!editLabel.trim()) {
      showToast('Please provide a display label for the role', 'error');
      return;
    }

    setSavingRole(true);
    try {
      const res = await ecommerceService.updateRole(editingRole.name, {
        label: editLabel.trim(),
        description: editDescription.trim(),
      });

      if (res.success) {
        showToast(`Role "${editLabel}" updated successfully`, 'success');
        setRoles((prev) =>
          prev.map((r) =>
            r.name === editingRole.name
              ? { ...r, label: editLabel.trim(), description: editDescription.trim() }
              : r
          )
        );
        setEditingRole(null);
      } else {
        showToast(res.messages?.[0] || 'Failed to update role', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to update role', 'error');
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (role: RoleItem) => {
    if (role.isSystem) {
      showToast('System core roles cannot be deleted', 'error');
      return;
    }

    try {
      const res = await ecommerceService.deleteRole(role.name);
      if (res.success) {
        showToast(`Role "${role.label}" deleted`, 'success');
        setRoles((prev) => prev.filter((r) => r.name !== role.name));
      } else {
        showToast(res.messages?.[0] || 'Failed to delete role', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to delete role', 'error');
    }
  };

  const handleCreateRole = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newRoleName.trim() || !newRoleLabel.trim()) {
      showToast('Please enter both role name/code and display label', 'error');
      return;
    }
    setIsCreatingRole(true);
    try {
      const res = await ecommerceService.createRole({
        name: newRoleName.trim().toLowerCase(),
        label: newRoleLabel.trim(),
        description: newRoleDescription.trim(),
        permissions: [],
      });
      if (res.success) {
        showToast(`Role "${newRoleLabel}" created successfully`, 'success');
        setIsAddRoleModalOpen(false);
        loadData();
      } else {
        showToast('Failed to create role', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to create role', 'error');
    } finally {
      setIsCreatingRole(false);
    }
  };

  // Primary roles filtered by search query
  const filteredRoles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return roles.filter((r) => {
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.permissions?.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [roles, searchQuery]);

  // Helper for role visual badges and scopes
  const getRoleVisuals = (name: string) => {
    switch (name.toLowerCase()) {
      case 'seller':
        return {
          icon: <ShopOutlined />,
          bg: 'bg-orange-50 text-[#f97316] border-orange-200',
          color: 'orange',
          scope: 'Marketplace Vendor',
        };
      case 'customer':
      case 'user':
        return {
          icon: <UserOutlined />,
          bg: 'bg-blue-50 text-[#0284c7] border-blue-200',
          color: 'blue',
          scope: 'Storefront Shopper',
        };
      case 'support':
        return {
          icon: <CustomerServiceOutlined />,
          bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          color: 'success',
          scope: 'Customer Care & Inquiries',
        };
      case 'manager':
        return {
          icon: <AppstoreOutlined />,
          bg: 'bg-purple-50 text-purple-600 border-purple-200',
          color: 'purple',
          scope: 'Catalog & Store Operations',
        };
      case 'admin':
      default:
        return {
          icon: <SafetyCertificateOutlined />,
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          color: 'processing',
          scope: 'Global System Administration',
        };
    }
  };

  const totalUsersCovered = roles.reduce((sum, r) => sum + (r.userCount || 0), 0);
  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
  const paginatedRoles = filteredRoles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden font-['Poppins','Inter',sans-serif] space-y-2.5">
      {/* Top Bar: Breadcrumb Navigation */}
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
              title: <span className="text-slate-700 font-semibold">Role Management</span>,
            },
          ]}
        />
      </div>

      {/* Main Two-Column Split (fills remaining vertical space) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4 overflow-hidden">
        {/* Left Column: Roles Directory Table Canvas (fills space, independent scroll) */}
        <div className="flex-1 min-w-0 h-full bg-white rounded-t-2xl rounded-b-[2px] shadow-xs overflow-hidden flex flex-col">
          {/* Table Top Controls & Integrated Header */}
          <div className="pl-0 pr-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white relative z-20 rounded-t-2xl shrink-0">
            <div className="flex flex-col min-w-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Role Management
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-full sm:w-[240px] shrink-0">
                <AppInput
                  prefix={<SearchOutlined className="text-slate-400" />}
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  allowClear
                />
              </div>
            </div>
          </div>

          {/* Table Content Canvas (independent scroll) */}
          <div className="flex-1 min-h-0 overflow-y-auto brand-table-scroll">
            <AppTable>
            <thead>
              <tr>
                <th className="py-2.5 px-6 font-medium text-[12px]">Role & Identity</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">System Code</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Description & Scope</th>
                <th className="py-2.5 px-4 text-center font-medium text-[12px]">Assigned Users</th>
                <th className="py-2.5 px-6 text-right font-medium text-[12px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-normal">
              {loading ? (
                <TableSkeleton columns={5} rows={5} hasAvatar={true} />
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-[11px] font-normal">
                    No security roles found matching "{searchQuery}".
                  </td>
                </tr>
              ) : (
                paginatedRoles.map((role) => {
                  const visuals = getRoleVisuals(role.name);
                  const roleId = role._id || role.id || role.name;

                  return (
                    <tr
                      key={roleId}
                      className="hover:bg-slate-50/70 transition-colors group cursor-default text-[11px] font-normal"
                    >
                      {/* Role & Identity */}
                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base border ${visuals.bg} shrink-0`}
                          >
                            {visuals.icon}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {role.label}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>{visuals.scope}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* System Code */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <Tag
                            className="m-0 font-medium font-mono text-[10px] uppercase px-2 py-0.5 rounded-md"
                            color={visuals.color}
                          >
                            {role.name}
                          </Tag>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {role.isSystem ? 'System Core' : 'Configurable'}
                          </span>
                        </div>
                      </td>

                      {/* Description & Scope */}
                      <td className="py-3 px-4 min-w-[200px] max-w-[280px]">
                        <p className="text-[11px] font-normal text-slate-600 line-clamp-2 leading-relaxed">
                          {role.description || (
                            <span className="text-slate-300 italic">No description provided</span>
                          )}
                        </p>
                      </td>

                      {/* Assigned Users */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100/80 border border-slate-200/60 text-slate-700 font-normal text-[11px]">
                          <UserOutlined className="text-slate-400 text-[10px]" />
                          <span>{role.userCount || 0}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <AppButton
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditModal(role)}
                            title="Edit Role"
                          />
                          {!role.isSystem && (
                            <Popconfirm
                              title="Delete Role"
                              description={`Are you sure you want to delete role "${role.label}"?`}
                              onConfirm={() => handleDeleteRole(role)}
                              okText="Yes, Delete"
                              cancelText="Cancel"
                              okButtonProps={{ danger: true }}
                            >
                              <AppButton
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                title="Delete Custom Role"
                              />
                            </Popconfirm>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </AppTable>
        </div>

        {/* Signature Cyan Footer Toolbar (Fixed at Bottom of Column) */}
        <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-md flex items-center justify-between text-[11px] shadow-inner select-none shrink-0">
          {/* Left Side: Count */}
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-medium text-white/90 text-[11px] leading-none">Total Roles:</span>
            <span className="font-bold text-white text-[11px] leading-none">
              {filteredRoles.length} Items
            </span>
          </div>

          {/* Right Side: Pagination Controls */}
          {filteredRoles.length > 0 && (
            <div className="flex items-center gap-2.5 leading-none">
              <div className="flex items-center gap-1.5 text-[10px] text-white/95 font-medium leading-none">
                <span>Items:</span>
                <Dropdown
                  menu={{
                    items: [
                      { key: '10', label: <span className="font-semibold text-xs text-slate-800">10 / page</span> },
                      { key: '20', label: <span className="font-semibold text-xs text-slate-800">20 / page</span> },
                      { key: '50', label: <span className="font-semibold text-xs text-slate-800">50 / page</span> },
                      { key: '100', label: <span className="font-semibold text-xs text-slate-800">100 / page</span> },
                    ],
                    selectedKeys: [String(pageSize)],
                    onClick: ({ key }) => {
                      setPageSize(Number(key));
                      setCurrentPage(1);
                    },
                  }}
                  trigger={['click']}
                  placement="topRight"
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 active:bg-white/40 border border-white/35 text-white font-bold text-[10px] rounded px-1.5 h-[20px] outline-none cursor-pointer transition-all leading-none"
                    title="Change page size"
                  >
                    <span>{pageSize}</span>
                    <DownOutlined className="text-[7px] text-white/85" />
                  </button>
                </Dropdown>
              </div>

              <span className="text-[10px] text-white/95 font-medium whitespace-nowrap leading-none">
                {filteredRoles.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, filteredRoles.length)} of {filteredRoles.length}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous page"
                  className="!w-5 !h-5 !min-w-0 !min-h-0 p-0 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20 leading-none"
                >
                  <LeftOutlined className="text-[8px]" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next page"
                  className="!w-5 !h-5 !min-w-0 !min-h-0 p-0 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20 leading-none"
                >
                  <RightOutlined className="text-[8px]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Contextual Action + Role Overview (Independent Scroll Area) */}
      <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 h-full overflow-y-auto brand-sidebar-scroll space-y-3.5 pr-1">
        {/* Card 1: Add New Role Action Button */}
        <div className="bg-white rounded-2xl shadow-xs px-4 py-3 flex items-center">
          <button
            type="button"
            onClick={() => {
              setNewRoleName('');
              setNewRoleLabel('');
              setNewRoleDescription('');
              setIsAddRoleModalOpen(true);
            }}
            disabled={!isAdmin}
            className="w-full h-[32px] flex items-center justify-center gap-1.5 bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusOutlined className="text-xs" />
            <span>Add New Role</span>
          </button>
        </div>

        {/* Card 2: Security & Roles Summary (Static Clean View) */}
        <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-bold text-slate-900">Role Summary</h4>
            <span className="text-[10px] font-bold text-[#0096C7] bg-sky-50 px-2.5 py-0.5 rounded-full">
              RBAC Security
            </span>
          </div>

          <div className="space-y-1">
            {/* Metric 1: Configured Roles */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                  Configured Roles
                </span>
                <span className="text-2xl font-black text-orange-600 leading-tight block">
                  {roles.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Active security tiers
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg shrink-0">
                <SafetyCertificateOutlined />
              </div>
            </div>

            {/* Metric 2: Total Users Mapped */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                  Users Assigned
                </span>
                <span className="text-2xl font-black text-[#0284c7] leading-tight block">
                  {totalUsersCovered}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Mapped accounts
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center text-lg shrink-0">
                <TeamOutlined />
              </div>
            </div>

            {/* Metric 3: Granular Privileges */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                  Privilege Matrix
                </span>
                <span className="text-2xl font-black text-emerald-600 leading-tight block">
                  {permissions.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Granular permissions
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                <KeyOutlined />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Edit Role Details Modal */}
      {editingRole && (
        <AppModal
          open={!!editingRole}
          title={`Edit Role: ${editingRole.label}`}
          onCancel={() => setEditingRole(null)}
          onOk={handleSaveRole}
          okText="Save Changes"
          confirmLoading={savingRole}
          width={520}
        >
          <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                System Code Identifier
              </label>
              <input
                type="text"
                disabled
                value={editingRole.name}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-500 font-mono text-xs bg-slate-100 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                System code identifier is immutable to maintain referential integrity with backend access rules.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Role Display Label *
              </label>
              <AppInput
                placeholder="e.g. Store & Inventory Manager"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Description & Scope
              </label>
              <textarea
                placeholder="Describe the responsibilities and scope of this role..."
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-[#0284c7]"
              />
            </div>

            {/* Permissions Information Notice */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2.5">
              <KeyOutlined className="text-[#0284c7] text-sm mt-0.5 shrink-0" />
              <div className="flex-1 text-xs">
                <div className="font-bold text-slate-800">Permissions are configured centrally</div>
                <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                  Granular capabilities and route access for this role are managed via the dedicated Permissions Matrix.
                </p>
                <Link
                  to="/admin/permissions"
                  className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0096c7] mt-1.5 text-xs hover:underline"
                >
                  Open Permissions Matrix <RightOutlined className="text-[10px]" />
                </Link>
              </div>
            </div>
          </form>
        </AppModal>
      )}

      {/* Add Role Modal */}
      {isAddRoleModalOpen && (
        <AppModal
          open={isAddRoleModalOpen}
          title="Add New Security Role"
          onCancel={() => setIsAddRoleModalOpen(false)}
          onOk={handleCreateRole}
          okText="Create Role"
          confirmLoading={isCreatingRole}
          width={480}
        >
          <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Role System Code *
              </label>
              <input
                type="text"
                placeholder="e.g. auditor, supervisor, agent"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:border-[#0284c7]"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Unique system key in lowercase, e.g. auditor</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Display Label *
              </label>
              <input
                type="text"
                placeholder="e.g. System Auditor, Lead Supervisor"
                value={newRoleLabel}
                onChange={(e) => setNewRoleLabel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-[#0284c7]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Description & Scope
              </label>
              <textarea
                placeholder="Describe the responsibilities and access scope of this role..."
                rows={3}
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-[#0284c7]"
              />
            </div>
          </form>
        </AppModal>
      )}
    </div>
  );
};

export default RoleManagement;
