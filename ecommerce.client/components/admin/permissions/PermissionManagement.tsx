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
  DashboardOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  StarOutlined,
  ShopOutlined,
  MenuOutlined,
  HistoryOutlined,
  ExportOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  TableOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Tag, Spin, Tabs, Row, Col, Checkbox, Tooltip } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { PermissionItem, UserPermissionItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppCard,
  AppButton,
  AppModal,
  PageHeader,
} from 'shared-components';

// Helper to render module icons
const getModuleIcon = (moduleName: string) => {
  const mod = (moduleName || '').toLowerCase();
  if (mod.includes('dash')) return <DashboardOutlined className="text-[#0284c7]" />;
  if (mod.includes('prod')) return <ShoppingOutlined className="text-orange-500" />;
  if (mod.includes('cat')) return <AppstoreOutlined className="text-amber-500" />;
  if (mod.includes('inv')) return <AppstoreOutlined className="text-emerald-500" />;
  if (mod.includes('ord')) return <FileTextOutlined className="text-blue-500" />;
  if (mod.includes('cust') || mod.includes('user')) return <TeamOutlined className="text-indigo-500" />;
  if (mod.includes('rev')) return <StarOutlined className="text-yellow-500" />;
  if (mod.includes('sell') || mod.includes('vend')) return <ShopOutlined className="text-orange-600" />;
  if (mod.includes('sec')) return <LockOutlined className="text-emerald-600" />;
  if (mod.includes('role')) return <KeyOutlined className="text-purple-500" />;
  if (mod.includes('perm')) return <SafetyCertificateOutlined className="text-[#0284c7]" />;
  if (mod.includes('menu')) return <MenuOutlined className="text-cyan-600" />;
  if (mod.includes('audit')) return <HistoryOutlined className="text-slate-600" />;
  if (mod.includes('store')) return <ShopOutlined className="text-[#f97316]" />;
  return <FolderOpenOutlined className="text-slate-400" />;
};

// Helper to determine permission action kind
const getPermissionKind = (perm: PermissionItem): { label: string; color: string; bg: string; border: string } => {
  const code = (perm.code || '').toLowerCase();
  const name = (perm.name || '').toLowerCase();

  if (code.startsWith('pages:') || perm.action === 'page_access') {
    return { label: 'Page Access', color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' };
  }
  if (code.includes(':create') || name.includes('create') || name.includes('add') || name.includes('submit')) {
    return { label: 'Create / Add', color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' };
  }
  if (code.includes(':edit') || code.includes(':update') || code.includes(':adjust') || name.includes('edit') || name.includes('update')) {
    return { label: 'Edit / Update', color: '#d97706', bg: '#fef3c7', border: '#fde68a' };
  }
  if (code.includes(':delete') || code.includes(':cancel') || name.includes('delete') || name.includes('deactivate')) {
    return { label: 'Delete / Revoke', color: '#dc2626', bg: '#fee2e2', border: '#fecaca' };
  }
  if (code.includes(':export') || name.includes('export') || code.includes(':invoice')) {
    return { label: 'Export / Report', color: '#0891b2', bg: '#cffafe', border: '#a5f3fc' };
  }
  return { label: 'Special Action', color: '#7c3aed', bg: '#f3e8ff', border: '#ddd6fe' };
};

// Role display mappings
const ROLE_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: 'Super Admin', color: '#0284c7', bg: '#e0f2fe' },
  manager: { label: 'DepartMent Head', color: '#7c3aed', bg: '#f3e8ff' },
  support: { label: 'HR', color: '#16a34a', bg: '#dcfce7' },
  customer: { label: 'Staff', color: '#0891b2', bg: '#cffafe' },
  seller: { label: 'Seller', color: '#ea580c', bg: '#ffedd5' },
};

export const PermissionManagement: React.FC = () => {
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [users, setUsers] = useState<UserPermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all');
  const [selectedKindFilter, setSelectedKindFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('directory');

  // Add Permission Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newModule, setNewModule] = useState('Products');
  const [newKind, setNewKind] = useState('create');
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
      const formattedCode = newCode.trim().toLowerCase();
      const res = await ecommerceService.createPermission({
        code: formattedCode,
        name: newName.trim(),
        module: newModule,
        description: newDesc.trim() || `Allows ${newName} within the ${newModule} page.`,
      });
      if (res.success && res.data) {
        showToast(`Permission "${newName}" created successfully`, 'success');
        setPermissions((prev) => [...prev, { ...res.data, roles: ['admin'] }]);
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

  // Group permissions by module
  const permsByModule = useMemo(() => {
    return permissions.reduce<Record<string, PermissionItem[]>>((acc, perm) => {
      const mod = perm.module || 'General';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    }, {});
  }, [permissions]);

  // Filtered permissions for the main table
  const filteredPermissions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return permissions.filter((p) => {
      const kindInfo = getPermissionKind(p);

      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.module && p.module.toLowerCase().includes(q));

      const matchesModule =
        selectedModuleFilter === 'all' ||
        (p.module && p.module.toLowerCase() === selectedModuleFilter.toLowerCase());

      const matchesKind =
        selectedKindFilter === 'all' ||
        kindInfo.label.toLowerCase().includes(selectedKindFilter.toLowerCase());

      return matchesSearch && matchesModule && matchesKind;
    });
  }, [permissions, searchQuery, selectedModuleFilter, selectedKindFilter]);

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

  // Page vs Action Matrix Data
  const pageMatrixRows = useMemo(() => {
    const moduleNames = Object.keys(permsByModule).sort();

    return moduleNames.map((modName) => {
      const modPerms = permsByModule[modName] || [];

      const pageAccess = modPerms.find((p) => p.code.startsWith('pages:') || p.code.includes('browse'));
      const creates = modPerms.filter((p) => getPermissionKind(p).label.includes('Create'));
      const edits = modPerms.filter((p) => getPermissionKind(p).label.includes('Edit'));
      const deletes = modPerms.filter((p) => getPermissionKind(p).label.includes('Delete'));
      const exports = modPerms.filter((p) => getPermissionKind(p).label.includes('Export'));
      const specials = modPerms.filter((p) => getPermissionKind(p).label.includes('Special'));

      return {
        moduleName: modName,
        totalCount: modPerms.length,
        pageAccess,
        creates,
        edits,
        deletes,
        exports,
        specials,
      };
    });
  }, [permsByModule]);

  const usersWithCustomCount = users.filter((u) => u.customPermissions && u.customPermissions.length > 0).length;

  return (
    <div className="space-y-6 w-full font-['Poppins','Inter',sans-serif]">
      {/* Page Header */}
      <PageHeader
        title="Permissions & Capability Matrix"
        description="Comprehensive directory of granular page permissions, capability tokens, and user overrides."
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Capabilities
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {permissions.length} Grants
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Granular tokens active</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center text-xl font-bold">
            <KeyOutlined />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pages & Modules
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {availableModules.length} Modules
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Catalog, Orders, Security, etc.</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#f97316] flex items-center justify-center text-xl font-bold">
            <FolderOpenOutlined />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Page Routes
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {permissions.filter((p) => p.code.startsWith('pages:')).length} Routes
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Protected page endpoints</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold">
            <TableOutlined />
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
            <div className="text-[11px] text-slate-400 mt-0.5">Individual overrides assigned</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <SafetyCertificateOutlined />
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Granular Table vs Matrix View vs User Grants */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'directory',
            label: (
              <span className="flex items-center gap-2 font-semibold">
                <KeyOutlined />
                <span>Permission Table Directory ({permissions.length})</span>
              </span>
            ),
            children: (
              <AppCard className="overflow-hidden border border-slate-200/80 rounded-2xl shadow-xs p-0 mt-2">
                {/* Search & Filter Bar */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Platform Capability Tokens
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                      {filteredPermissions.length} Active
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    {/* Module Filter */}
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

                    {/* Action Kind Filter */}
                    <select
                      value={selectedKindFilter}
                      onChange={(e) => setSelectedKindFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0284c7] cursor-pointer"
                    >
                      <option value="all">All Actions</option>
                      <option value="Page Access">Page Access (View)</option>
                      <option value="Create">Create / Add</option>
                      <option value="Edit">Edit / Update</option>
                      <option value="Delete">Delete / Revoke</option>
                      <option value="Export">Export / Report</option>
                      <option value="Special">Special Actions</option>
                    </select>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                      <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                      <input
                        type="text"
                        placeholder="Search token, name, page..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Granular Permissions Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-6">Page / Module</th>
                        <th className="py-3.5 px-4">Permission Name & Token</th>
                        <th className="py-3.5 px-4">Kind / Type</th>
                        <th className="py-3.5 px-4">Description</th>
                        <th className="py-3.5 px-4">Role Coverage</th>
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
                            No permissions match the current search or filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPermissions.map((perm) => {
                          const kindInfo = getPermissionKind(perm);
                          const associatedRoles = perm.roles || ['admin'];

                          return (
                            <tr
                              key={perm.code}
                              className="hover:bg-slate-50/70 transition-colors group cursor-default"
                            >
                              {/* Page / Module Scope */}
                              <td className="py-3.5 px-6 whitespace-nowrap">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm shrink-0 border border-slate-200">
                                    {getModuleIcon(perm.module)}
                                  </div>
                                  <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                    {perm.module}
                                  </span>
                                </div>
                              </td>

                              {/* Permission Name & Code Token */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                                    <span>{perm.name}</span>
                                    {perm.isSystem && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 uppercase">
                                        System
                                      </span>
                                    )}
                                  </div>
                                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 font-mono text-[11px] font-semibold text-slate-700">
                                    <span>{perm.code}</span>
                                    <button
                                      onClick={() => copyToClipboard(perm.code)}
                                      className="text-slate-400 hover:text-[#0284c7] cursor-pointer"
                                      title="Copy token"
                                    >
                                      <CopyOutlined className="text-[10px]" />
                                    </button>
                                  </div>
                                </div>
                              </td>

                              {/* Kind / Type Badge */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                                  style={{
                                    color: kindInfo.color,
                                    backgroundColor: kindInfo.bg,
                                    borderColor: kindInfo.border,
                                  }}
                                >
                                  {kindInfo.label}
                                </span>
                              </td>

                              {/* Description */}
                              <td className="py-3.5 px-4 min-w-[200px] max-w-[300px]">
                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                  {perm.description || 'Authorized capability grant.'}
                                </p>
                              </td>

                              {/* Role Coverage */}
                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap items-center gap-1 max-w-[220px]">
                                  {associatedRoles.map((r) => {
                                    const meta = ROLE_BADGES[r] || { label: r, color: '#475569', bg: '#f1f5f9' };
                                    return (
                                      <span
                                        key={r}
                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                        style={{ color: meta.color, backgroundColor: meta.bg }}
                                      >
                                        {meta.label}
                                      </span>
                                    );
                                  })}
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-6 text-right whitespace-nowrap">
                                <button
                                  onClick={() => copyToClipboard(perm.code)}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#0284c7] hover:border-blue-200 transition-all cursor-pointer shadow-2xs"
                                >
                                  Copy Code
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
            key: 'matrix',
            label: (
              <span className="flex items-center gap-2 font-semibold">
                <TableOutlined />
                <span>Page Permissions Matrix ({pageMatrixRows.length} Pages)</span>
              </span>
            ),
            children: (
              <AppCard className="overflow-hidden border border-slate-200/80 rounded-2xl shadow-xs p-0 mt-2">
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Page vs Capability Matrix
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cross-reference showing every page and its available actions (Access, Create, Edit, Delete, Special, Export).
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0284c7] text-xs font-bold border border-blue-100">
                    {pageMatrixRows.length} Page Scopes
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-6">Page / Module</th>
                        <th className="py-3.5 px-4 text-center">Page View Access</th>
                        <th className="py-3.5 px-4 text-center">Create / Add</th>
                        <th className="py-3.5 px-4 text-center">Edit / Update</th>
                        <th className="py-3.5 px-4 text-center">Delete / Remove</th>
                        <th className="py-3.5 px-4 text-center">Special Actions</th>
                        <th className="py-3.5 px-4 text-center">Export / Report</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pageMatrixRows.map((row) => (
                        <tr key={row.moduleName} className="hover:bg-slate-50/70 transition-colors">
                          {/* Module Name */}
                          <td className="py-4 px-6 whitespace-nowrap font-bold text-slate-800">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm shrink-0 border border-slate-200">
                                {getModuleIcon(row.moduleName)}
                              </div>
                              <div>
                                <div className="text-xs sm:text-sm font-bold text-slate-900">
                                  {row.moduleName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {row.totalCount} permissions defined
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Page Access */}
                          <td className="py-4 px-4 text-center">
                            {row.pageAccess ? (
                              <Tooltip title={`${row.pageAccess.name} (${row.pageAccess.code})`}>
                                <div className="inline-flex flex-col items-center">
                                  <span className="w-6 h-6 rounded-full bg-blue-100 text-[#0284c7] flex items-center justify-center text-xs font-bold shadow-2xs">
                                    <CheckOutlined />
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-500 mt-1 truncate max-w-[100px]">
                                    {row.pageAccess.code}
                                  </span>
                                </div>
                              </Tooltip>
                            ) : (
                              <span className="text-slate-300 font-bold">—</span>
                            )}
                          </td>

                          {/* Create */}
                          <td className="py-4 px-4 text-center">
                            {row.creates.length > 0 ? (
                              <div className="flex flex-col items-center gap-1">
                                {row.creates.map((c) => (
                                  <Tooltip key={c.code} title={`${c.name} (${c.code})`}>
                                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 cursor-pointer">
                                      + {c.name}
                                    </span>
                                  </Tooltip>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-bold">—</span>
                            )}
                          </td>

                          {/* Edit */}
                          <td className="py-4 px-4 text-center">
                            {row.edits.length > 0 ? (
                              <div className="flex flex-col items-center gap-1">
                                {row.edits.map((e) => (
                                  <Tooltip key={e.code} title={`${e.name} (${e.code})`}>
                                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 cursor-pointer">
                                      ✎ {e.name}
                                    </span>
                                  </Tooltip>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-bold">—</span>
                            )}
                          </td>

                          {/* Delete */}
                          <td className="py-4 px-4 text-center">
                            {row.deletes.length > 0 ? (
                              <div className="flex flex-col items-center gap-1">
                                {row.deletes.map((d) => (
                                  <Tooltip key={d.code} title={`${d.name} (${d.code})`}>
                                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200 cursor-pointer">
                                      ✕ {d.name}
                                    </span>
                                  </Tooltip>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-bold">—</span>
                            )}
                          </td>

                          {/* Special */}
                          <td className="py-4 px-4 text-center">
                            {row.specials.length > 0 ? (
                              <div className="flex flex-col items-center gap-1">
                                {row.specials.map((s) => (
                                  <Tooltip key={s.code} title={`${s.name} (${s.code})`}>
                                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200 cursor-pointer">
                                      ⚡ {s.name}
                                    </span>
                                  </Tooltip>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-bold">—</span>
                            )}
                          </td>

                          {/* Export */}
                          <td className="py-4 px-4 text-center">
                            {row.exports.length > 0 ? (
                              <div className="flex flex-col items-center gap-1">
                                {row.exports.map((ex) => (
                                  <Tooltip key={ex.code} title={`${ex.name} (${ex.code})`}>
                                    <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[10px] font-bold border border-cyan-200 cursor-pointer">
                                      ⤓ {ex.name}
                                    </span>
                                  </Tooltip>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-bold">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AppCard>
            ),
          },
          {
            key: 'users',
            label: (
              <span className="flex items-center gap-2 font-semibold">
                <TeamOutlined />
                <span>Special User Grants ({usersWithCustomCount} / {users.length})</span>
              </span>
            ),
            children: (
              <AppCard className="overflow-hidden border border-slate-200/80 rounded-2xl shadow-xs p-0 mt-2">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Special Individual User Grants
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Grant fine-grained capability overrides to specific users regardless of their base role.
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

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-6">User Profile</th>
                        <th className="py-3.5 px-4">Primary Role</th>
                        <th className="py-3.5 px-4">Active Special Permissions</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="py-16 text-center text-slate-400">
                            <Spin size="default" />
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                            No users match the search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const hasOverrides = u.customPermissions && u.customPermissions.length > 0;
                          return (
                            <tr key={u._id || u.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-6 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0284c7] flex items-center justify-center font-bold text-xs">
                                    {(u.firstName?.[0] || 'U').toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                      {u.firstName} {u.lastName}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <Tag
                                  color={
                                    u.role === 'admin'
                                      ? 'blue'
                                      : u.role === 'seller'
                                      ? 'orange'
                                      : u.role === 'support'
                                      ? 'green'
                                      : u.role === 'manager'
                                      ? 'purple'
                                      : 'cyan'
                                  }
                                  className="font-bold uppercase text-[10px] px-2.5 py-0.5 rounded-full"
                                >
                                  {u.role}
                                </Tag>
                              </td>

                              <td className="py-3.5 px-4">
                                {hasOverrides ? (
                                  <div className="flex flex-wrap items-center gap-1 max-w-[320px]">
                                    {u.customPermissions.map((code) => (
                                      <span
                                        key={code}
                                        className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-mono font-semibold border border-emerald-200"
                                      >
                                        {code}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-xs italic">
                                    Standard role defaults only
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                  <CheckCircleOutlined /> Active
                                </span>
                              </td>

                              <td className="py-3.5 px-6 text-right whitespace-nowrap">
                                <button
                                  onClick={() => openUserPermsModal(u)}
                                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#0284c7] hover:bg-blue-100 font-semibold text-xs border border-blue-200 transition-all cursor-pointer"
                                >
                                  Manage Grants
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

      {/* Modal: Add New Granular Permission */}
      <AppModal
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        title="Add New Capability Permission"
        width="560px"
      >
        <form onSubmit={handleAddPermission} className="space-y-4 font-['Poppins','Inter',sans-serif]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Target Page / Module
              </label>
              <select
                value={newModule}
                onChange={(e) => {
                  setNewModule(e.target.value);
                  const prefix = e.target.value.toLowerCase().replace(/\s+/g, '-');
                  if (!newCode || newCode.includes(':')) {
                    setNewCode(`${prefix}:${newKind}`);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:border-[#0284c7]"
              >
                {availableModules.map((m) => (
                  <option key={m} value={m}>
                    {m} Page
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Permission Kind
              </label>
              <select
                value={newKind}
                onChange={(e) => {
                  setNewKind(e.target.value);
                  const prefix = newModule.toLowerCase().replace(/\s+/g, '-');
                  setNewCode(`${prefix}:${e.target.value}`);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:border-[#0284c7]"
              >
                <option value="view">Page View Access</option>
                <option value="create">Create / Add</option>
                <option value="edit">Edit / Update</option>
                <option value="delete">Delete / Remove</option>
                <option value="export">Export / Report</option>
                <option value="special">Special Operation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Permission Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. Bulk Import Products"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-[#0284c7]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Token Code (Must be unique)
            </label>
            <input
              type="text"
              placeholder="e.g. products:bulk_import"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:outline-none focus:border-[#0284c7]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Capability Description
            </label>
            <textarea
              rows={3}
              placeholder="Explain what access this capability enables..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-[#0284c7]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <AppButton onClick={() => setIsAddModalOpen(false)}>Cancel</AppButton>
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

      {/* Modal: Grant Special User Permissions */}
      <AppModal
        open={!!selectedUser}
        onCancel={() => setSelectedUser(null)}
        title={selectedUser ? `Special Access Grants: ${selectedUser.firstName} ${selectedUser.lastName}` : ''}
        width="780px"
      >
        {selectedUser && (
          <div className="space-y-4 font-['Poppins','Inter',sans-serif]">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Base Role: <span className="uppercase text-[#0284c7]">{selectedUser.role}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Selected special grants are added directly onto this user's effective permissions.
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white text-[#0284c7] font-bold text-xs border border-blue-200">
                {userPerms.length} Special Overrides
              </span>
            </div>

            <div className="max-h-[420px] overflow-y-auto space-y-4 pr-1">
              {Object.entries(permsByModule).map(([mod, perms]) => {
                const moduleCodes = perms.map((p) => p.code);
                const isAllSelected = moduleCodes.every((c) => userPerms.includes(c));

                return (
                  <div key={mod} className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getModuleIcon(mod)}</span>
                        <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                          {mod} Page ({perms.length})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleModulePerms(moduleCodes)}
                        className="text-xs font-bold text-[#0284c7] hover:underline cursor-pointer"
                      >
                        {isAllSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map((p) => {
                        const isChecked = userPerms.includes(p.code);
                        const kind = getPermissionKind(p);

                        return (
                          <div
                            key={p.code}
                            onClick={() => toggleUserPerm(p.code)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-colors flex items-start gap-2.5 ${
                              isChecked
                                ? 'bg-blue-50/50 border-[#0284c7]'
                                : 'bg-slate-50/50 border-slate-200/60 hover:bg-slate-100/60'
                            }`}
                          >
                            <Checkbox checked={isChecked} className="mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-slate-900 truncate">
                                  {p.name}
                                </span>
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.2 rounded border"
                                  style={{
                                    color: kind.color,
                                    backgroundColor: kind.bg,
                                    borderColor: kind.border,
                                  }}
                                >
                                  {kind.label}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                                {p.code}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <AppButton onClick={() => setSelectedUser(null)}>Cancel</AppButton>
              <AppButton
                type="primary"
                onClick={handleSaveUserPerms}
                loading={savingUserPerms}
                style={{ backgroundColor: '#0284c7' }}
              >
                Save User Permissions
              </AppButton>
            </div>
          </div>
        )}
      </AppModal>
    </div>
  );
};

export default PermissionManagement;
