import React, { useEffect, useState, useMemo } from 'react';
import {
  KeyOutlined,
  PlusOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  AppstoreOutlined,
  CopyOutlined,
  EditOutlined,
  TeamOutlined,
  LockOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { Tag, Spin, Tabs, Row, Col, Checkbox, Divider, Tooltip } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { PermissionItem, UserPermissionItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppCard,
  AppButton,
  AppModal,
  PageHeader,
} from 'shared-components';

export const PermissionManagement: React.FC = () => {
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [users, setUsers] = useState<UserPermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('permissions');

  // Add Permission Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newModule, setNewModule] = useState('Pages');
  const [newDesc, setNewDesc] = useState('');
  const [adding, setAdding] = useState(false);

  // Special User Permission Grant Modal State
  const [selectedUser, setSelectedUser] = useState<UserPermissionItem | null>(null);
  const [userPerms, setUserPerms] = useState<string[]>([]);
  const [savingUserPerms, setSavingUserPerms] = useState(false);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [permsRes, usersRes] = await Promise.all([
        ecommerceService.getPermissions(),
        ecommerceService.getUsersWithPermissions(),
      ]);

      if (permsRes.success && permsRes.data) {
        setPermissions(permsRes.data);
      }
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
      }
    } catch {
      showToast('Failed to load permissions and access grants', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) {
      showToast('Permission Code and Name are required', 'error');
      return;
    }
    setAdding(true);
    try {
      const res = await ecommerceService.createPermission({
        code: newCode.trim(),
        name: newName.trim(),
        module: newModule,
        description: newDesc.trim(),
      });
      if (res.success && res.data) {
        showToast(`Permission "${newName}" created successfully`, 'success');
        setPermissions((prev) => [...prev, res.data]);
        setIsAddModalOpen(false);
        setNewCode('');
        setNewName('');
        setNewDesc('');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to create permission', 'error');
    } finally {
      setAdding(false);
    }
  };

  const openUserPermsModal = (u: UserPermissionItem) => {
    setSelectedUser(u);
    setUserPerms(u.customPermissions || []);
  };

  const toggleUserPerm = (code: string) => {
    setUserPerms((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleToggleModulePerms = (moduleCodes: string[]) => {
    setUserPerms((prev) => {
      const allSelected = moduleCodes.every((c) => prev.includes(c));
      if (allSelected) {
        return prev.filter((c) => !moduleCodes.includes(c));
      } else {
        return Array.from(new Set([...prev, ...moduleCodes]));
      }
    });
  };

  const handleSaveUserPerms = async () => {
    if (!selectedUser) return;
    setSavingUserPerms(true);
    try {
      const userId = (selectedUser._id || selectedUser.id || '') as string;
      const res = await ecommerceService.assignUserPermissions(userId, userPerms);
      if (res.success) {
        showToast(`Special permissions updated for ${selectedUser.firstName}`, 'success');
        setUsers((prev) =>
          prev.map((u) => ((u._id || u.id) === userId ? { ...u, customPermissions: userPerms } : u))
        );
        setSelectedUser(null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to assign special permissions', 'error');
    } finally {
      setSavingUserPerms(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied "${text}" to clipboard`, 'info');
  };

  // Unique modules list
  const availableModules = useMemo(() => {
    const mods = new Set<string>();
    permissions.forEach((p) => {
      if (p.module) mods.add(p.module);
    });
    return Array.from(mods).sort();
  }, [permissions]);

  // Group permissions by module for the modal
  const permsByModule = useMemo(() => {
    return permissions.reduce<Record<string, PermissionItem[]>>((acc, perm) => {
      const mod = perm.module || 'General';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    }, {});
  }, [permissions]);

  // Filtered permissions for the catalog table
  const filteredPermissions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return permissions.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.module && p.module.toLowerCase().includes(q));

      const matchesModule =
        selectedModuleFilter === 'all' || (p.module && p.module.toLowerCase() === selectedModuleFilter.toLowerCase());

      return matchesSearch && matchesModule;
    });
  }, [permissions, searchQuery, selectedModuleFilter]);

  // Filtered users for the special access grants table
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      if (!q) return true;
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      return (
        fullName.includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q)) ||
        u.customPermissions?.some((cp) => cp.toLowerCase().includes(q))
      );
    });
  }, [users, searchQuery]);

  const usersWithCustomCount = users.filter((u) => u.customPermissions && u.customPermissions.length > 0).length;

  return (
    <div className="space-y-6 w-full font-['Poppins','Inter',sans-serif]">
      {/* Page Header */}
      <PageHeader
        title="Permissions & Access Grants"
        description="Tabular directory of granular capabilities, module scopes, and user-specific access overrides."
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Permissions' }]}
        extra={
          <div className="flex items-center gap-3">
            <AppButton icon={<SyncOutlined />} onClick={loadData}>
              Sync Directory
            </AppButton>
            <AppButton
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsAddModalOpen(true)}
              style={{ backgroundColor: '#0284c7' }}
            >
              Add New Permission
            </AppButton>
          </div>
        }
      />

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Permissions
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {permissions.length} Grants
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Defined capability tokens</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center text-xl font-bold">
            <KeyOutlined />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Modules Covered
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {availableModules.length} Modules
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Catalog, Orders, Directory, etc.</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#f97316] flex items-center justify-center text-xl font-bold">
            <FolderOpenOutlined />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Special User Grants
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {usersWithCustomCount} Users
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Custom overrides active</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <SafetyCertificateOutlined />
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Permissions Catalog vs Special User Grants */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'permissions',
            label: (
              <span className="flex items-center gap-2 font-semibold">
                <KeyOutlined />
                <span>Permission Catalog ({permissions.length})</span>
              </span>
            ),
            children: (
              <AppCard className="overflow-hidden border border-slate-200/80 rounded-2xl shadow-xs p-0 mt-2">
                {/* Search & Filter Bar */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Platform Capabilities Directory
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                      {filteredPermissions.length} Active
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    {/* Module Filter Dropdown */}
                    <select
                      value={selectedModuleFilter}
                      onChange={(e) => setSelectedModuleFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0284c7] cursor-pointer"
                    >
                      <option value="all">All Modules ({permissions.length})</option>
                      {availableModules.map((m) => (
                        <option key={m} value={m}>
                          {m} Module
                        </option>
                      ))}
                    </select>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                      <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                      <input
                        type="text"
                        placeholder="Search permissions or codes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Permissions Table View */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-6">Capability & Title</th>
                        <th className="py-3.5 px-4">Permission Token</th>
                        <th className="py-3.5 px-4">Module Scope</th>
                        <th className="py-3.5 px-4">Capability Description</th>
                        <th className="py-3.5 px-4 text-center">Type</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-slate-400">
                            <Spin size="default" />
                            <p className="mt-3 text-xs font-semibold text-slate-500">
                              Loading platform permissions table...
                            </p>
                          </td>
                        </tr>
                      ) : filteredPermissions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                            No permissions match the current search or module filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPermissions.map((perm) => {
                          const isPagePerm = perm.code.startsWith('pages:');
                          const isWritePerm =
                            perm.code.includes('create') ||
                            perm.code.includes('edit') ||
                            perm.code.includes('update') ||
                            perm.code.includes('delete');

                          return (
                            <tr
                              key={perm.code}
                              className="hover:bg-slate-50/70 transition-colors group cursor-default"
                            >
                              {/* Capability & Title */}
                              <td className="py-4 px-6 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0284c7] border border-blue-200 flex items-center justify-center text-sm shrink-0">
                                    <KeyOutlined />
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                      {perm.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                      <span>Core Policy</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Permission Token */}
                              <td className="py-4 px-4 whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/80 font-mono text-[11px] font-semibold text-slate-700">
                                  <span>{perm.code}</span>
                                  <button
                                    onClick={() => copyToClipboard(perm.code)}
                                    className="text-slate-400 hover:text-[#0284c7] cursor-pointer"
                                    title="Copy permission token"
                                  >
                                    <CopyOutlined className="text-[10px]" />
                                  </button>
                                </div>
                              </td>

                              {/* Module Scope */}
                              <td className="py-4 px-4 whitespace-nowrap">
                                <Tag
                                  className="m-0 font-bold text-xs uppercase px-2.5 py-0.5 rounded-full"
                                  color={
                                    perm.module === 'Catalog'
                                      ? 'orange'
                                      : perm.module === 'Orders'
                                      ? 'blue'
                                      : perm.module === 'Access Control'
                                      ? 'purple'
                                      : perm.module === 'Navigation'
                                      ? 'cyan'
                                      : 'default'
                                  }
                                >
                                  {perm.module || 'General'}
                                </Tag>
                              </td>

                              {/* Description */}
                              <td className="py-4 px-4 min-w-[220px] max-w-[320px]">
                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                  {perm.description || 'Grants authorized capability within the module.'}
                                </p>
                              </td>

                              {/* Type Badge */}
                              <td className="py-4 px-4 text-center whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isPagePerm
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : isWritePerm
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {isPagePerm ? 'Page Route' : isWritePerm ? 'Action (Write)' : 'Data (Read)'}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                <button
                                  onClick={() => copyToClipboard(perm.code)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-2xs cursor-pointer active:scale-95"
                                >
                                  <CopyOutlined className="text-[11px]" />
                                  <span>Copy Token</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </AppCard>
            ),
          },
          {
            key: 'user-grants',
            label: (
              <span className="flex items-center gap-2 font-semibold">
                <UserOutlined />
                <span>Special User Grants ({users.length})</span>
              </span>
            ),
            children: (
              <AppCard className="overflow-hidden border border-slate-200/80 rounded-2xl shadow-xs p-0 mt-2">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Special User Permission Overrides
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Grant custom page-level or module access to specific individuals without modifying global role definitions.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                      type="text"
                      placeholder="Search user name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Users Grants Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-6">User & Identity</th>
                        <th className="py-3.5 px-4">Assigned Base Role</th>
                        <th className="py-3.5 px-4">Special Granted Permissions</th>
                        <th className="py-3.5 px-4 text-center">Override Status</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="py-16 text-center text-slate-400">
                            <Spin size="default" />
                            <p className="mt-3 text-xs font-semibold text-slate-500">
                              Loading users and special grant mappings...
                            </p>
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                            No users found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const uId = (u._id || u.id || '') as string;
                          const hasOverrides = u.customPermissions && u.customPermissions.length > 0;
                          const initials = `${u.firstName?.[0] || 'U'}${u.lastName?.[0] || ''}`.toUpperCase();

                          return (
                            <tr
                              key={uId}
                              className="hover:bg-slate-50/70 transition-colors group cursor-default"
                            >
                              {/* User & Identity */}
                              <td className="py-4 px-6 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#f97316] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                    {initials}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                      {u.firstName} {u.lastName}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                      {u.email}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Base Role */}
                              <td className="py-4 px-4 whitespace-nowrap">
                                <Tag
                                  className="m-0 font-bold font-mono text-[11px] uppercase px-2.5 py-0.5 rounded-md"
                                  color={
                                    u.role === 'admin'
                                      ? 'processing'
                                      : u.role === 'seller'
                                      ? 'orange'
                                      : u.role === 'support'
                                      ? 'success'
                                      : u.role === 'manager'
                                      ? 'purple'
                                      : 'default'
                                  }
                                >
                                  {u.role || 'customer'}
                                </Tag>
                              </td>

                              {/* Special Granted Permissions */}
                              <td className="py-4 px-4 min-w-[260px]">
                                {hasOverrides ? (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-md bg-orange-50 text-[#f97316] font-bold text-[11px] border border-orange-200">
                                      {u.customPermissions!.length} Custom
                                    </span>
                                    {u.customPermissions!.slice(0, 3).map((cp) => (
                                      <span
                                        key={cp}
                                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200/60"
                                      >
                                        {cp}
                                      </span>
                                    ))}
                                    {u.customPermissions!.length > 3 && (
                                      <Tooltip
                                        title={u.customPermissions!.slice(3).join(', ')}
                                        placement="top"
                                      >
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-semibold rounded cursor-pointer hover:bg-slate-200">
                                          +{u.customPermissions!.length - 3} more
                                        </span>
                                      </Tooltip>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">
                                    Standard Role Defaults (No Overrides)
                                  </span>
                                )}
                              </td>

                              {/* Override Status */}
                              <td className="py-4 px-4 text-center whitespace-nowrap">
                                {hasOverrides ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                    Custom Granted
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                                    Default
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                <button
                                  onClick={() => openUserPermsModal(u)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:text-[#0284c7] hover:border-blue-300 font-semibold text-xs text-slate-700 transition-all shadow-2xs cursor-pointer active:scale-95"
                                >
                                  <EditOutlined className="text-xs" />
                                  <span>{hasOverrides ? 'Edit Overrides' : 'Grant Overrides'}</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </AppCard>
            ),
          },
        ]}
      />

      {/* Add New Permission Modal (Top-10 Positioned with modal.css) */}
      <AppModal
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        title="Register New Permission"
        width="max-w-md"
      >
        <form onSubmit={handleAddPermission} className="space-y-4 font-['Poppins','Inter',sans-serif]">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Permission Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Access Analytics Dashboard"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Permission Code (Token) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. pages:analytics or catalog:export"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:border-[#0284c7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Module</label>
            <select
              value={newModule}
              onChange={(e) => setNewModule(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#0284c7]"
            >
              <option value="Pages">Pages (Page Controller)</option>
              <option value="Catalog">Catalog (Products & Categories)</option>
              <option value="Orders">Orders & Fulfillment</option>
              <option value="Directory">Directory & Customers</option>
              <option value="Access Control">Access Control (Roles & Perms)</option>
              <option value="Reviews">Reviews & Ratings</option>
              <option value="System">System & Operations</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Capability Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe the capabilities unlocked by holding this permission..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <AppButton type="default" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton
              type="primary"
              htmlType="submit"
              loading={adding}
              style={{ backgroundColor: '#0284c7' }}
            >
              Create Permission
            </AppButton>
          </div>
        </form>
      </AppModal>

      {/* Special User Grants Modal (Top-10 Positioned with modal.css) */}
      <AppModal
        open={!!selectedUser}
        onCancel={() => setSelectedUser(null)}
        title={`Configure Special Permissions: ${selectedUser?.firstName} ${selectedUser?.lastName}`}
        width="max-w-3xl"
      >
        <div className="space-y-4 font-['Poppins','Inter',sans-serif]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <div className="text-xs font-bold text-slate-800">
                Granting Special Privileges for{' '}
                <span className="text-[#0284c7]">
                  {selectedUser?.firstName} {selectedUser?.lastName}
                </span>{' '}
                ({selectedUser?.email})
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Check specific permissions to override or supplement their default{' '}
                <strong className="uppercase">{selectedUser?.role}</strong> role.
              </p>
            </div>
            <div className="text-xs font-bold text-[#f97316] shrink-0">
              {userPerms.length} Special Granted
            </div>
          </div>

          <div className="max-h-[55vh] overflow-y-auto space-y-4 pr-1">
            {Object.entries(permsByModule).map(([moduleName, modulePerms]) => {
              const moduleCodes = modulePerms.map((p) => p.code);
              const allSelected = moduleCodes.every((c) => userPerms.includes(c));

              return (
                <div
                  key={moduleName}
                  className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {moduleName} Module
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({modulePerms.length} capabilities)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleModulePerms(moduleCodes)}
                      className="text-[11px] font-semibold text-[#0284c7] hover:text-[#f97316] hover:underline cursor-pointer"
                    >
                      {allSelected ? 'Deselect Module' : 'Select All in Module'}
                    </button>
                  </div>

                  <Row gutter={[12, 12]}>
                    {modulePerms.map((p) => {
                      const isChecked = userPerms.includes(p.code);
                      return (
                        <Col xs={24} sm={12} key={p.code}>
                          <div
                            onClick={() => toggleUserPerm(p.code)}
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
            <AppButton type="default" onClick={() => setSelectedUser(null)}>
              Cancel
            </AppButton>
            <AppButton
              type="primary"
              loading={savingUserPerms}
              onClick={handleSaveUserPerms}
              style={{ backgroundColor: '#0284c7' }}
            >
              Save User Grants
            </AppButton>
          </div>
        </div>
      </AppModal>
    </div>
  );
};

export default PermissionManagement;
