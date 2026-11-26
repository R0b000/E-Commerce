import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TeamOutlined,
  SearchOutlined,
  SyncOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  UserOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  LockOutlined,
  EditOutlined,
  CrownOutlined,
  ArrowRightOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Tag, Tooltip, Select, Modal, Radio, Spin } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { Customer, RoleItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import { TableSkeleton } from 'shared-components';

export const UserRoleManagement: React.FC = () => {
  const { showToast } = useToast();

  const [users, setUsers] = useState<Customer[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Modal State for granting role access
  const [targetUser, setTargetUser] = useState<Customer | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);

  const loadData = async (isManual = false) => {
    if (!isManual) setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        ecommerceService.getCustomers(),
        ecommerceService.getRoles(),
      ]);

      if (usersRes.success && Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      }
      if (rolesRes.success && Array.isArray(rolesRes.data)) {
        setRoles(rolesRes.data);
      }
      if (isManual) {
        showToast('User accounts and role policies refreshed', 'success');
      }
    } catch {
      showToast('Failed to load user role data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle direct role update
  const handleRoleChange = async (userId: string, userName: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      const res = await ecommerceService.updateUserRole(userId, newRole);
      if (res.success) {
        showToast(`Role access for ${userName} updated to ${newRole.toUpperCase()} successfully!`, 'success');
        setUsers((prev) =>
          prev.map((u) => {
            const uid = u._id || u.id;
            return uid === userId ? { ...u, role: newRole } : u;
          })
        );
      } else {
        showToast(res.messages?.[0] || 'Failed to update user role', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Network error updating user role', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Open Role Access Modal for a specific user
  const openRoleModal = (user: Customer) => {
    setTargetUser(user);
    setSelectedNewRole((user.role || 'customer').toLowerCase());
    setIsModalOpen(true);
  };

  const handleModalSave = async () => {
    if (!targetUser) return;
    const uid = targetUser._id || targetUser.id || '';
    const fullName = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || 'User';

    setModalSaving(true);
    try {
      const res = await ecommerceService.updateUserRole(uid, selectedNewRole);
      if (res.success) {
        showToast(`Granted ${selectedNewRole.toUpperCase()} role access to ${fullName}!`, 'success');
        setUsers((prev) =>
          prev.map((u) => {
            const currentId = u._id || u.id;
            return currentId === uid ? { ...u, role: selectedNewRole } : u;
          })
        );
        setIsModalOpen(false);
      } else {
        showToast(res.messages?.[0] || 'Failed to update role access', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Error granting role access', 'error');
    } finally {
      setModalSaving(false);
    }
  };

  // KPI Metrics
  const totalUsers = users.length;
  const customerCount = users.filter((u) => {
    const r = (u.role || '').toLowerCase();
    return r === 'customer' || r === 'user';
  }).length;
  const sellerCount = users.filter((u) => (u.role || '').toLowerCase() === 'seller').length;
  const customOrStaffCount = users.filter((u) => {
    const r = (u.role || '').toLowerCase();
    return r !== 'customer' && r !== 'user' && r !== 'seller';
  }).length;

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      const role = (u.role || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || email.includes(q) || role.includes(q);
      const matchesRole =
        selectedRoleFilter === 'all' ||
        (selectedRoleFilter === 'customer' && (role === 'customer' || role === 'user')) ||
        role === selectedRoleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRoleFilter]);

  // Combined role options for assignment
  const roleOptions = useMemo(() => {
    const baseRoles = [
      { value: 'customer', label: 'Customer (Storefront Buyer)' },
      { value: 'seller', label: 'Seller (Merchant Vendor)' },
      { value: 'admin', label: 'Administrator (Full Access)' },
      { value: 'manager', label: 'Manager (Operations)' },
      { value: 'support', label: 'Support Agent (Care Team)' },
    ];

    const customRoles = roles
      .filter((r) => !['customer', 'seller', 'admin', 'manager', 'support', 'user'].includes(r.name.toLowerCase()))
      .map((r) => ({
        value: r.name.toLowerCase(),
        label: `${r.label || r.name} (Custom Role)`,
      }));

    return [...baseRoles, ...customRoles];
  }, [roles]);

  // Color helper for roles
  const getRoleTagColor = (role: string) => {
    const r = (role || '').toLowerCase();
    switch (r) {
      case 'admin':
        return 'purple';
      case 'seller':
        return 'orange';
      case 'customer':
      case 'user':
        return 'blue';
      case 'manager':
        return 'cyan';
      case 'support':
        return 'gold';
      default:
        return 'geekblue';
    }
  };

  // Helper description of what each role does
  const getRoleDescription = (role: string) => {
    switch (role.toLowerCase()) {
      case 'customer':
        return 'Default role for regular shoppers. Can browse storefront, place orders, write reviews, and manage personal address & passkeys.';
      case 'seller':
        return 'Default role for merchants. Access to vendor portal, product inventory, sales catalog, store orders, and seller profile.';
      case 'manager':
        return 'Staff manager. Access to products, categories, orders, inventory restocking, and operational analytics.';
      case 'support':
        return 'Customer care specialist. Access to order fulfillment tracking, reviews, customer lookup, and ticket resolution.';
      case 'admin':
        return 'Executive Super Administrator with unrestricted root access to RBAC, database menus, security, billing, and system controls.';
      default:
        return 'Custom administrative role configured with bespoke permissions in the Permissions Matrix.';
    }
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden font-['Poppins','Inter',sans-serif] text-[13px] font-semibold space-y-2.5">
      {/* Breadcrumb Navigation */}
      <div className="px-2 flex items-center justify-between gap-1.5 text-[11px] leading-none text-slate-500 font-semibold shrink-0">
        <Breadcrumb
          className="text-[11px] leading-none text-slate-500 [&_*]:border-0 font-semibold"
          items={[
            {
              title: (
                <Link to="/admin" className="text-slate-500 hover:text-[#0096c7] transition-colors font-semibold">
                  Admin
                </Link>
              ),
            },
            {
              title: (
                <Link to="/admin/roles" className="text-slate-500 hover:text-[#0096c7] transition-colors font-semibold">
                  Roles & Access
                </Link>
              ),
            },
            {
              title: <span className="text-slate-700 font-semibold">User Role Management</span>,
            },
          ]}
        />

        <div className="flex items-center gap-2">
          <Link
            to="/admin/permissions"
            className="text-xs text-[#0096c7] hover:underline font-semibold flex items-center gap-1"
          >
            <SafetyCertificateOutlined />
            <span>Role Permission Matrix ›</span>
          </Link>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="flex-1 min-h-0 bg-white rounded-t-2xl rounded-b-[2px] shadow-xs overflow-hidden flex flex-col">
        {/* Top Header & Metrics Strip */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                User Role Management
              </h2>
              <Tag color="cyan" className="font-semibold text-[10px] rounded-full px-2.5">
                Role Access Control
              </Tag>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign and grant users different role access across the marketplace. Default sign-ups receive <strong>Seller</strong> or <strong>Customer</strong>, while custom & staff roles are assigned here by admin.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => loadData(true)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <SyncOutlined className="text-[#0096c7]" />
              <span>Refresh</span>
            </button>
            <Link
              to="/admin/roles"
              className="px-3.5 py-1.5 rounded-xl bg-sky-50 text-[#0096c7] hover:bg-sky-100 border border-sky-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <KeyOutlined />
              <span>Menu Role Setup</span>
            </Link>
          </div>
        </div>

        {/* 4 KPI Cards Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-50/60 border-b border-slate-100 shrink-0">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total Accounts</span>
              <span className="text-xl font-black text-slate-900 leading-tight">{totalUsers}</span>
            </div>
            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-sm">
              <TeamOutlined />
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-blue-500 uppercase tracking-wider block">Customer Accounts</span>
              <span className="text-xl font-black text-slate-900 leading-tight">{customerCount}</span>
            </div>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#0096c7] flex items-center justify-center text-sm">
              <UserOutlined />
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-orange-500 uppercase tracking-wider block">Seller Accounts</span>
              <span className="text-xl font-black text-slate-900 leading-tight">{sellerCount}</span>
            </div>
            <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center text-sm">
              <ShopOutlined />
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-purple-500 uppercase tracking-wider block">Staff & Custom Roles</span>
              <span className="text-xl font-black text-slate-900 leading-tight">{customOrStaffCount}</span>
            </div>
            <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-sm">
              <SafetyCertificateOutlined />
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white shrink-0">
          <div className="relative w-full sm:w-80">
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search by user name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0096c7] bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Filter Role:</span>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0096c7] cursor-pointer"
            >
              <option value="all">All Roles ({totalUsers})</option>
              <option value="customer">Customers ({customerCount})</option>
              <option value="seller">Sellers ({sellerCount})</option>
              <option value="admin">Administrators</option>
              <option value="manager">Managers</option>
              <option value="support">Support Agents</option>
              {roles
                .filter((r) => !['customer', 'seller', 'admin', 'manager', 'support', 'user'].includes(r.name.toLowerCase()))
                .map((r) => (
                  <option key={r.id || r.name} value={r.name.toLowerCase()}>
                    Custom: {r.label || r.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton columns={6} rows={6} />
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Default Sign-up Type</th>
                  <th className="py-3 px-4">Current Granted Role</th>
                  <th className="py-3 px-4 w-[240px]">Quick Assign Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Access Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const userId = user._id || user.id || '';
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Account User';
                    const userRole = (user.role || 'customer').toLowerCase();
                    const isUpdating = updatingUserId === userId;

                    return (
                      <tr key={userId} className="hover:bg-sky-50/40 transition-colors">
                        {/* User Details */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0096c7] to-cyan-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{fullName}</div>
                              <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Account Type */}
                        <td className="py-3 px-4">
                          {user.vendorProfile || userRole === 'seller' ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[11px] font-semibold border border-orange-200/60">
                              <ShopOutlined />
                              <span>Seller Account</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[#0096c7] text-[11px] font-semibold border border-blue-200/60">
                              <UserOutlined />
                              <span>Customer Account</span>
                            </div>
                          )}
                        </td>

                        {/* Current Role Tag */}
                        <td className="py-3 px-4">
                          <Tag
                            color={getRoleTagColor(userRole)}
                            className="font-bold uppercase text-[10px] rounded-full px-2.5 py-0.5 m-0"
                          >
                            {userRole}
                          </Tag>
                        </td>

                        {/* Role Assignment Dropdown */}
                        <td className="py-3 px-4">
                          <Select
                            value={userRole}
                            onChange={(newRole) => handleRoleChange(userId, fullName, newRole)}
                            disabled={isUpdating}
                            loading={isUpdating}
                            size="middle"
                            className="w-full text-xs font-semibold"
                            options={roleOptions}
                          />
                        </td>

                        {/* Account Status */}
                        <td className="py-3 px-4 text-center">
                          <Tag
                            color={user.isActive !== false ? 'green' : 'red'}
                            className="font-bold text-[10px] rounded-full px-2.5 py-0.5 m-0"
                          >
                            {user.isActive !== false ? 'ACTIVE' : 'DEACTIVATED'}
                          </Tag>
                        </td>

                        {/* Give Role Access Button */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openRoleModal(user)}
                            className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0096c7] border border-sky-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            <KeyOutlined className="text-xs" />
                            <span>Give Role Access</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No users found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Informative Legend Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <InfoCircleOutlined className="text-[#0096c7]" />
            <span>
              <strong>Default Sign-ups:</strong> Users signing in as seller receive the <strong>Seller</strong> role by default; customer sign-ups receive <strong>Customer</strong>. Other roles are custom-created by admin and assignable above.
            </span>
          </div>
          <span className="font-mono text-slate-400 text-right">
            Showing {filteredUsers.length} of {totalUsers} accounts
          </span>
        </div>
      </div>

      {/* Grant Role Access Modal */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={600}
        centered
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0096c7] flex items-center justify-center text-base border border-sky-100">
              <KeyOutlined />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Grant User Role Access
              </h3>
              <p className="text-[11px] text-slate-400 font-normal">
                Choose the role access level to grant to this account
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={modalSaving}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleModalSave}
              disabled={modalSaving}
              className="px-4 py-1.5 rounded-xl bg-[#0096c7] hover:bg-[#0077b6] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {modalSaving ? <Spin size="small" /> : <CheckOutlined />}
              <span>{modalSaving ? 'Granting Access...' : 'Confirm Role Access'}</span>
            </button>
          </div>
        }
      >
        {targetUser && (
          <div className="space-y-4 py-2 font-['Poppins','Inter',sans-serif]">
            {/* User Details Preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0096c7] to-cyan-400 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {targetUser.firstName ? targetUser.firstName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {targetUser.firstName} {targetUser.lastName}
                  </div>
                  <div className="text-[11px] text-slate-400">{targetUser.email}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Current Role</span>
                <Tag color={getRoleTagColor(targetUser.role || 'customer')} className="m-0 font-bold uppercase text-[10px]">
                  {targetUser.role || 'customer'}
                </Tag>
              </div>
            </div>

            {/* Select Role Option */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Select New Role Access:
              </label>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {roleOptions.map((opt) => {
                  const isSelected = selectedNewRole === opt.value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => setSelectedNewRole(opt.value)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-[#0096c7] bg-sky-50/60 shadow-xs ring-1 ring-[#0096c7]'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="pt-0.5">
                          <input
                            type="radio"
                            name="roleSelection"
                            checked={isSelected}
                            onChange={() => setSelectedNewRole(opt.value)}
                            className="w-4 h-4 text-[#0096c7] focus:outline-none accent-[#0096c7] cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                            <Tag color={getRoleTagColor(opt.value)} className="m-0 text-[9px] font-bold uppercase px-1.5 py-0">
                              {opt.value}
                            </Tag>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {getRoleDescription(opt.value)}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircleOutlined className="text-base text-[#0096c7] shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserRoleManagement;
