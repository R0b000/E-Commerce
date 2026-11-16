import React, { useEffect, useState, useMemo } from 'react';
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  UserOutlined,
  EditOutlined,
  SyncOutlined,
  PlusOutlined,
  KeyOutlined,
  CustomerServiceOutlined,
  AppstoreOutlined,
  SearchOutlined,
  ShopOutlined,
  TeamOutlined,
  LockOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Tag, Spin, Checkbox, Row, Col, Divider, Tooltip } from 'antd';
import { useAuth } from 'auth-client/hooks/useAuth';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { RoleItem, PermissionItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppCard,
  AppButton,
  AppModal,
  PageHeader,
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

  // Add Role Modal State
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Edit Permissions Modal State
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

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
    setSelectedPermissions(role.permissions || []);
    if (onRoleSelect) {
      onRoleSelect(role);
    }
  };

  const handleTogglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSelectAllModule = (modulePermCodes: string[]) => {
    setSelectedPermissions((prev) => {
      const allSelected = modulePermCodes.every((c) => prev.includes(c));
      if (allSelected) {
        // Deselect all in module
        return prev.filter((c) => !modulePermCodes.includes(c));
      } else {
        // Select all in module
        const combined = new Set([...prev, ...modulePermCodes]);
        return Array.from(combined);
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;
    setSaving(true);
    try {
      const res = await ecommerceService.updateRolePermissions(
        editingRole.name,
        selectedPermissions
      );
      if (res.success) {
        showToast(`Permissions updated for ${editingRole.label}`, 'success');
        setRoles((prev) =>
          prev.map((r) =>
            r.name === editingRole.name ? { ...r, permissions: selectedPermissions } : r
          )
        );
        setEditingRole(null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to update permissions', 'error');
    } finally {
      setSaving(false);
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

  // Group permissions by module
  const permsByModule = useMemo(() => {
    return permissions.reduce<Record<string, PermissionItem[]>>((acc, perm) => {
      const mod = perm.module || 'General';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    }, {});
  }, [permissions]);

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

  return (
    <div className="space-y-6 w-full font-['Poppins','Inter',sans-serif]">
      {/* Page Title & Action Bar */}
      <PageHeader
        title="Role Management"
        description="Structured table of security roles, granular access controls, and capability mappings."
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Roles' }]}
        extra={
          <div className="flex items-center gap-3">
            <AppButton icon={<SyncOutlined />} onClick={loadData}>
              Refresh Roles
            </AppButton>
            {isAdmin && (
              <AppButton
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setNewRoleName('');
                  setNewRoleLabel('');
                  setNewRoleDescription('');
                  setIsAddRoleModalOpen(true);
                }}
              >
                Add Role
              </AppButton>
            )}
          </div>
        }
      />

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Configured Roles
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {roles.length} Roles
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Active security tiers</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#f97316] flex items-center justify-center text-xl font-bold">
            <SafetyCertificateOutlined />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Users Mapped
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalUsersCovered} Users
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Assigned to defined roles</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center text-xl font-bold">
            <TeamOutlined />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Granular Privileges
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {permissions.length} Permissions
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across modules & endpoints</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <KeyOutlined />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <AppCard className="overflow-hidden border border-slate-200/80 rounded-2xl shadow-xs p-0">
        {/* Table Top Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Security Roles Directory
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
              {filteredRoles.length}
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search roles or permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Roles Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[12px] font-medium text-slate-700 tracking-tight">
                <th className="py-3 px-6 font-medium text-[12px]">Role & Identity</th>
                <th className="py-3 px-4 font-medium text-[12px]">System Code</th>
                <th className="py-3 px-4 font-medium text-[12px]">Description & Scope</th>
                <th className="py-3 px-4 text-center font-medium text-[12px]">Assigned Users</th>
                <th className="py-3 px-6 text-right font-medium text-[12px]">Actions</th>
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
                filteredRoles.map((role) => {
                  const visuals = getRoleVisuals(role.name);
                  const isSuperuser = role.permissions?.includes('*');
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
                            <div className="font-medium text-slate-900 text-[11px]">
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
                          {role.description}
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
                        {isSuperuser ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 italic">
                            <LockOutlined /> Unrestricted
                          </span>
                        ) : (
                          <button
                            onClick={() => openEditModal(role)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-orange-50 hover:text-[#f97316] hover:border-orange-300 font-semibold text-xs text-slate-700 transition-all shadow-2xs cursor-pointer active:scale-95"
                          >
                            <EditOutlined className="text-xs" />
                            <span>Configure</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AppCard>

      {/* Edit Role Permissions Modal (Top-10 Positioned with modal.css) */}
      <AppModal
        open={!!editingRole}
        onCancel={() => setEditingRole(null)}
        title={`Configure Role Permissions: ${editingRole?.label}`}
        width="max-w-3xl"
      >
        <div className="space-y-4 font-['Poppins','Inter',sans-serif]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <div className="text-xs font-bold text-slate-800">
                Granting Capabilities for <span className="uppercase text-[#f97316]">{editingRole?.name}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Check individual permissions or click "Select All" on a module to toggle all actions.
              </p>
            </div>
            <div className="text-xs font-bold text-[#0284c7] shrink-0">
              {selectedPermissions.length} / {permissions.length} Selected
            </div>
          </div>

          <div className="max-h-[55vh] overflow-y-auto space-y-4 pr-1">
            {Object.entries(permsByModule).map(([moduleName, perms]) => {
              const moduleCodes = perms.map((p) => p.code);
              const allModuleSelected = moduleCodes.every((c) => selectedPermissions.includes(c));
              const someModuleSelected =
                moduleCodes.some((c) => selectedPermissions.includes(c)) && !allModuleSelected;

              return (
                <div
                  key={moduleName}
                  className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {moduleName} Module
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({perms.length} actions)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectAllModule(moduleCodes)}
                      className="text-[11px] font-semibold text-[#0284c7] hover:text-[#f97316] hover:underline cursor-pointer"
                    >
                      {allModuleSelected ? 'Deselect Module' : 'Select All in Module'}
                    </button>
                  </div>

                  <Row gutter={[12, 12]}>
                    {perms.map((p) => {
                      const isChecked = selectedPermissions.includes(p.code);
                      return (
                        <Col xs={24} sm={12} key={p.code}>
                          <div
                            onClick={() => handleTogglePermission(p.code)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                              isChecked
                                ? 'bg-orange-50/50 border-[#f97316]/50 shadow-2xs'
                                : 'bg-slate-50/60 border-slate-200/70 hover:bg-white hover:border-slate-300'
                            }`}
                          >
                            <Checkbox checked={isChecked} className="mt-0.5" />
                            <div className="text-left select-none flex-1 min-w-0">
                              <div className="text-xs font-semibold text-slate-800 truncate">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                                {p.code}
                              </div>
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              );
            })}
          </div>

          <Divider className="my-2" />

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <AppButton type="default" onClick={() => setEditingRole(null)}>
              Cancel
            </AppButton>
            <AppButton
              type="primary"
              loading={saving}
              onClick={handleSavePermissions}
              style={{ backgroundColor: '#0284c7' }}
            >
              Save Role Permissions
            </AppButton>
          </div>
        </div>
      </AppModal>

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
          <form onSubmit={handleCreateRole} className="space-y-4 py-2 text-xs">
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
