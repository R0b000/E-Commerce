import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  TeamOutlined,
  SearchOutlined,
  SyncOutlined,
  MailOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  UserOutlined,
  PlusOutlined,
  ShopOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CustomerServiceOutlined,
  AppstoreOutlined,
  EyeOutlined,
  FileTextOutlined,
  LeftOutlined,
  RightOutlined,
  DownOutlined,
  KeyOutlined,
  LockOutlined,
  PoweroffOutlined,
} from '@ant-design/icons';
import { Avatar, Tag, Spin, Form, Input, Select, Switch, Radio, Breadcrumb, Dropdown, Popconfirm, Tooltip } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { Customer } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from 'auth-client/hooks/useAuth';
import { SellerProfile } from '../profile/SellerProfile';
import {
  AppCard,
  AppTable,
  AppButton,
  AppInput,
  AppSelect,
  AppModal,
  PageHeader,
  TableSkeleton,
} from 'shared-components';

export interface CustomerManagementProps {
  mode?: 'all' | 'employee' | 'client';
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ mode: propMode }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isSeller = user?.role === 'seller';

  if (isSeller) {
    return <SellerProfile />;
  }

  const activeMode: 'all' | 'employee' | 'client' = useMemo(() => {
    if (propMode) return propMode;
    const path = location.pathname.toLowerCase();
    if (path.includes('employee')) return 'employee';
    if (path.includes('client')) return 'client';
    return 'all';
  }, [propMode, location.pathname]);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);

  // Password Reset / Change State
  const [passwordTargetUser, setPasswordTargetUser] = useState<Customer | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordForm] = Form.useForm();

  const openPasswordModal = (customer: Customer) => {
    setPasswordTargetUser(customer);
    passwordForm.resetFields();
  };

  const handlePasswordSubmit = async () => {
    try {
      const values = await passwordForm.validateFields();
      if (!passwordTargetUser) return;
      const targetId = passwordTargetUser.id || passwordTargetUser._id;
      setUpdatingPassword(true);
      const res = await ecommerceService.changeCustomerPassword(targetId, values.newPassword);
      if (res.success) {
        showToast(res.messages?.[0] || 'Password updated successfully!', 'success');
        setPasswordTargetUser(null);
        passwordForm.resetFields();
      } else {
        showToast(res.messages?.[0] || 'Failed to update password', 'error');
      }
    } catch (err: any) {
      if (err.errorFields) return;
      showToast(err.response?.data?.messages?.[0] || 'Error updating password', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    const targetId = customer.id || customer._id;
    if (!targetId) return;
    const nextStatus = customer.isActive === false ? true : false;
    try {
      const res = await ecommerceService.toggleCustomerStatus(targetId, nextStatus);
      if (res.success) {
        showToast(res.messages?.[0] || `Account ${nextStatus ? 'activated' : 'deactivated'} successfully!`, 'success');
        setCustomers((prev) =>
          prev.map((c) => ((c.id || c._id) === targetId ? { ...c, isActive: nextStatus } : c))
        );
        if (viewingUser && ((viewingUser.id || viewingUser._id) === targetId)) {
          setViewingUser((prev) => (prev ? { ...prev, isActive: nextStatus } : null));
        }
      } else {
        showToast(res.messages?.[0] || 'Failed to update account status', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Error updating account status', 'error');
    }
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();
  const selectedRole = Form.useWatch('role', form);
  const { showToast } = useToast();

  useEffect(() => {
    setSelectedRoleFilter('all');
    setCurrentPage(1);
  }, [activeMode]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        search: searchQuery,
        role: selectedRoleFilter !== 'all' ? selectedRoleFilter : undefined,
      };
      if (activeMode === 'employee') {
        params.type = 'employee';
      } else if (activeMode === 'client') {
        params.type = 'client';
      }
      const res = await ecommerceService.getCustomers(params);
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch {
      showToast('Error loading accounts directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [selectedRoleFilter, activeMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers();
  };

  const handleCreateCustomer = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);

      const payload: any = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password || 'password123',
        role: values.role || 'customer',
        agreementAccepted: values.agreementAccepted !== false,
      };

      if (values.role === 'seller') {
        payload.vendorProfile = {
          vendorName: values.vendorName || `${values.firstName}'s Store`,
          businessLocation: values.businessLocation || '',
          phone: values.phone || '',
          taxId: values.taxId || '',
          businessCategory: values.businessCategory || 'Handicrafts & Woolens',
          description: values.description || '',
          isApproved: true,
        };
      }

      const res = await ecommerceService.createCustomer(payload);
      if (res.success) {
        showToast(
          `${values.role === 'seller' ? 'Seller & Store' : 'Customer'} registered successfully!`,
          'success'
        );
        setIsModalOpen(false);
        form.resetFields();
        loadCustomers();
      } else {
        showToast(res.messages?.[0] || 'Failed to create account', 'error');
      }
    } catch (err: any) {
      if (err.errorFields) return;
      showToast(err.response?.data?.messages?.[0] || 'Error registering user', 'error');
    } finally {
      setCreating(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const role = (c.role || '').toLowerCase();
      if (activeMode === 'employee') {
        // Render all accounts EXCEPT seller and customer
        if (role === 'customer' || role === 'user' || role === 'seller') return false;
        if (selectedRoleFilter !== 'all' && role !== selectedRoleFilter.toLowerCase()) return false;
        return true;
      }
      if (activeMode === 'client') {
        // Vice versa: only customer and seller
        if (role !== 'customer' && role !== 'user' && role !== 'seller') return false;
        if (selectedRoleFilter !== 'all' && role !== selectedRoleFilter.toLowerCase()) return false;
        return true;
      }
      if (selectedRoleFilter !== 'all' && role !== selectedRoleFilter.toLowerCase()) return false;
      return true;
    });
  }, [customers, activeMode, selectedRoleFilter]);

  const totalSpendAll = filteredCustomers.reduce((acc, c) => acc + (c.totalSpend || 0), 0);
  const totalOrdersAll = filteredCustomers.reduce((acc, c) => acc + (c.ordersCount || 0), 0);
  const sellersCount = customers.filter((c) => (c.role || '').toLowerCase() === 'seller').length;
  const customersCount = customers.filter((c) => {
    const r = (c.role || '').toLowerCase();
    return r === 'customer' || r === 'user';
  }).length;
  const managersCount = customers.filter((c) => (c.role || '').toLowerCase() === 'manager').length;
  const supportCount = customers.filter((c) => (c.role || '').toLowerCase() === 'support').length;
  const employeesCount = customers.filter((c) => {
    const r = (c.role || '').toLowerCase();
    return r !== 'customer' && r !== 'user' && r !== 'seller';
  }).length;

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const roleFilterOptions = useMemo(() => {
    if (activeMode === 'employee') {
      return [
        { label: 'All Employees', value: 'all' },
        { label: 'Managers', value: 'manager' },
        { label: 'Support', value: 'support' },
        { label: 'Administrators', value: 'admin' },
      ];
    }
    if (activeMode === 'client') {
      return [
        { label: 'All Clients', value: 'all' },
        { label: 'Customers', value: 'customer' },
        { label: 'Sellers', value: 'seller' },
      ];
    }
    return [
      { label: 'All Accounts', value: 'all' },
      { label: 'Customers', value: 'customer' },
      { label: 'Sellers', value: 'seller' },
      { label: 'Support', value: 'support' },
      { label: 'Managers', value: 'manager' },
    ];
  }, [activeMode]);

  const pageTitle = activeMode === 'employee' ? 'Employee Directory' : activeMode === 'client' ? 'Client Directory' : 'Accounts & Directory';
  const breadcrumbItem = activeMode === 'employee' ? 'Employees' : activeMode === 'client' ? 'Clients' : 'Accounts & Customers';
  const tableTitle = activeMode === 'employee' ? 'Employees & Staff' : activeMode === 'client' ? 'Clients & Shoppers' : 'Accounts & Directory';
  const searchPlaceholder = activeMode === 'employee' ? 'Search employees...' : activeMode === 'client' ? 'Search clients...' : 'Search accounts...';
  const footerLabel = activeMode === 'employee' ? 'Total Employees' : activeMode === 'client' ? 'Total Clients' : 'Total Accounts';

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
            ...(activeMode !== 'all'
              ? [
                  {
                    title: (
                      <Link to="/admin/accounts/employees" className="text-slate-500 hover:text-[#0096C7] transition-colors font-semibold">
                        Accounts
                      </Link>
                    ),
                  },
                ]
              : []),
            {
              title: <span className="text-slate-700 font-semibold">{breadcrumbItem}</span>,
            },
          ]}
        />
      </div>

      {/* Main Two-Column Split (fills remaining vertical space) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4 overflow-hidden">
        {/* Left Column: Accounts Directory Table Canvas (fills space, independent scroll) */}
        <div className="flex-1 min-w-0 h-full bg-white rounded-t-2xl rounded-b-[2px] shadow-xs overflow-hidden flex flex-col">
          {/* Table Top Controls & Integrated Header */}
          <div className="pl-0 pr-4 py-3 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white relative z-20 rounded-t-2xl shrink-0">
            <div className="flex flex-col min-w-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {tableTitle}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search Input */}
              <form onSubmit={handleSearch} className="w-full sm:w-[200px] shrink-0">
                <AppInput
                  prefix={<SearchOutlined className="text-slate-400" />}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  allowClear
                />
              </form>

              {/* Role Filter Dropdown */}
              <div className="w-full sm:w-[160px] shrink-0">
                <AppSelect
                  value={selectedRoleFilter}
                  onChange={(val) => {
                    setSelectedRoleFilter(val as string);
                    setCurrentPage(1);
                  }}
                  options={roleFilterOptions}
                />
              </div>
            </div>
          </div>

          {/* Table Content Canvas (independent scroll) */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <AppTable wrapperClassName="h-full flex-1 flex flex-col min-h-0" className="w-full border-collapse">
            <thead>
              <tr>
                <th className="py-2.5 px-6 font-medium text-[12px]">User / Merchant</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Contact & Location</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Role</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Agreement Status</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Orders & Volume</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Account Status</th>
                <th className="py-2.5 px-6 text-right font-medium text-[12px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton columns={7} rows={6} hasAvatar={true} />
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No {activeMode === 'employee' ? 'employees' : activeMode === 'client' ? 'clients' : 'accounts'} found matching search or filter.
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c) => {
                  const cId = c._id || c.id;
                  const joinedDate = c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recent';

                  const isSellerAccount = c.role === 'seller';
                  const isSupportAccount = c.role === 'support';
                  const isManagerAccount = c.role === 'manager';
                  const isBuyerAccount = c.role === 'customer' || c.role === 'user';

                  return (
                    <tr
                      key={cId}
                      onClick={() => setViewingUser(c)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Avatar
                            style={{
                              backgroundColor: isSellerAccount
                                ? '#ffedd5'
                                : isSupportAccount
                                ? '#d1fae5'
                                : isManagerAccount
                                ? '#ede9fe'
                                : '#e0f2fe',
                              color: isSellerAccount
                                ? '#ea580c'
                                : isSupportAccount
                                ? '#059669'
                                : isManagerAccount
                                ? '#7c3aed'
                                : '#0284c7',
                            }}
                            icon={isSellerAccount ? <ShopOutlined /> : <UserOutlined />}
                          >
                            {c.firstName?.[0]}
                          </Avatar>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{c.firstName} {c.lastName}</span>
                              {isSellerAccount && c.vendorProfile?.vendorName && (
                                <span className="text-[10px] bg-orange-100 text-orange-800 font-medium px-1.5 py-0.2 rounded">
                                  {c.vendorProfile.vendorName}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {cId?.slice(-6)} · Joined {joinedDate}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-600">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <MailOutlined className="text-slate-400 shrink-0" />
                            <span>{c.email}</span>
                          </div>
                          {c.vendorProfile?.phone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <PhoneOutlined className="text-slate-400 shrink-0" />
                              <span>{c.vendorProfile.phone}</span>
                            </div>
                          )}
                          {c.vendorProfile?.businessLocation && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <EnvironmentOutlined className="text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{c.vendorProfile.businessLocation}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <Tag
                          className="font-bold text-xs uppercase px-2 py-0.5 rounded-full"
                          color={
                            isSellerAccount
                              ? 'orange'
                              : isSupportAccount
                              ? 'success'
                              : isManagerAccount
                              ? 'purple'
                              : 'blue'
                          }
                        >
                          {c.role}
                        </Tag>
                      </td>

                      <td className="py-4 px-4">
                        {c.agreementAccepted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircleOutlined /> Agreement Signed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Pending Review
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          ${c.totalSpend?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {c.ordersCount ?? 0} {isSellerAccount ? 'fulfilled' : 'orders'}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <Tag
                          color={c.isActive !== false ? 'success' : 'default'}
                          className="font-semibold text-[11px] px-2.5 py-0.5 rounded-full capitalize m-0"
                        >
                          {c.isActive !== false ? 'Active' : 'Deactivated'}
                        </Tag>
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Tooltip title="Reset Password">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPasswordModal(c);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-[#0096C7] hover:border-[#0096C7] hover:bg-sky-50 transition-colors cursor-pointer"
                            >
                              <KeyOutlined className="text-xs" />
                            </button>
                          </Tooltip>

                          <Tooltip title={c.isActive !== false ? 'Deactivate Account' : 'Activate Account'}>
                            <Popconfirm
                              title={c.isActive !== false ? 'Deactivate this account?' : 'Activate this account?'}
                              description={
                                c.isActive !== false
                                  ? 'User will be temporarily prevented from logging in.'
                                  : 'User login access will be restored.'
                              }
                              onConfirm={(e) => {
                                e?.stopPropagation();
                                handleToggleStatus(c);
                              }}
                              okText="Yes"
                              cancelText="No"
                            >
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                                  c.isActive !== false
                                    ? 'border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50'
                                    : 'border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50'
                                }`}
                              >
                                <PoweroffOutlined className="text-xs" />
                              </button>
                            </Popconfirm>
                          </Tooltip>

                          <Tooltip title={isSellerAccount ? 'Vendor Profile' : 'View Profile'}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingUser(c);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-[#0096C7] hover:border-[#0096C7] hover:bg-sky-50 transition-colors cursor-pointer"
                            >
                              {isSellerAccount ? <ShopOutlined className="text-xs" /> : <EyeOutlined className="text-xs" />}
                            </button>
                          </Tooltip>
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
        <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-[2px] flex items-center justify-between text-[11px] shadow-inner select-none shrink-0">
          {/* Left Side: Count */}
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-medium text-white/90 text-[11px] leading-none">{footerLabel}:</span>
            <span className="font-bold text-white text-[11px] leading-none">
              {filteredCustomers.length} Items
            </span>
          </div>

          {/* Right Side: Pagination Controls */}
          {filteredCustomers.length > 0 && (
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
                {filteredCustomers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, filteredCustomers.length)} of {filteredCustomers.length}
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

      {/* Right Column: Contextual Action + Account Overview (Independent Scroll Area) */}
      <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 h-full overflow-y-auto brand-sidebar-scroll space-y-3.5 pr-1">
        {/* Card 1: Add New Account Button */}
        <div className="bg-white rounded-2xl shadow-xs px-4 py-3 flex items-center">
          <button
            type="button"
            onClick={() => {
              form.setFieldsValue({
                role: activeMode === 'employee' ? 'manager' : 'customer',
                agreementAccepted: true,
              });
              setIsModalOpen(true);
            }}
            className="w-full h-[32px] flex items-center justify-center gap-1.5 bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <PlusOutlined className="text-xs" />
            <span>
              {activeMode === 'employee'
                ? 'Add New Employee'
                : activeMode === 'client'
                ? 'Add New Client'
                : 'Add New Account'}
            </span>
          </button>
        </div>

        {/* Card 2: Account Directory Overview (Static Clean View) */}
        <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-bold text-slate-900">
              {activeMode === 'employee' ? 'Staff Summary' : activeMode === 'client' ? 'Client Summary' : 'Directory Summary'}
            </h4>
            <span className="text-[10px] font-bold text-[#0096C7] bg-sky-50 px-2.5 py-0.5 rounded-full">
              Live Data
            </span>
          </div>

          <div className="space-y-1">
            {activeMode === 'employee' ? (
              <>
                {/* Metric 1: Total Employees */}
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                      Total Staff
                    </span>
                    <span className="text-2xl font-black text-[#0284c7] leading-tight block">
                      {employeesCount}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Internal team members
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center text-lg shrink-0">
                    <TeamOutlined />
                  </div>
                </div>

                {/* Metric 2: Store Managers */}
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                      Store Managers
                    </span>
                    <span className="text-2xl font-black text-amber-600 leading-tight block">
                      {managersCount}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Operations & catalog managers
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shrink-0">
                    <AppstoreOutlined />
                  </div>
                </div>

                {/* Metric 3: Support Agents */}
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                      Support Agents
                    </span>
                    <span className="text-2xl font-black text-emerald-600 leading-tight block">
                      {supportCount}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Helpdesk & customer care
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                    <CustomerServiceOutlined />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Metric 1: Total Buyers */}
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                      Total Buyers
                    </span>
                    <span className="text-2xl font-black text-[#0284c7] leading-tight block">
                      {customersCount}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Verified buyer accounts
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center text-lg shrink-0">
                    <ShoppingOutlined />
                  </div>
                </div>

                {/* Metric 2: Active Sellers / Stores */}
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                      Active Sellers
                    </span>
                    <span className="text-2xl font-black text-orange-600 leading-tight block">
                      {sellersCount}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Authorized store vendors
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg shrink-0">
                    <ShopOutlined />
                  </div>
                </div>

                {/* Metric 3: Total Orders Placed */}
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                      Orders Placed
                    </span>
                    <span className="text-2xl font-black text-slate-900 leading-tight block">
                      {totalOrdersAll}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Across active accounts
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-lg shrink-0">
                    <FileTextOutlined />
                  </div>
                </div>

                {/* Metric 4: Cumulative Revenue */}
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                      Platform Volume
                    </span>
                    <span className="text-xl font-black text-emerald-600 leading-tight block truncate max-w-[170px]" title={`$${totalSpendAll.toFixed(2)}`}>
                      ${totalSpendAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Lifetime cumulative GMV
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                    <SafetyCertificateOutlined />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Add New Account Modal */}
      <AppModal
        title={
          activeMode === 'employee'
            ? 'Register Employee Account'
            : activeMode === 'client'
            ? 'Register Client Account'
            : 'Register Platform Account'
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={handleCreateCustomer}
        confirmLoading={creating}
        okText="Create Account"
        width="max-w-xl"
      >
        <Form form={form} layout="vertical" className="mt-2">
          {/* Role selector */}
          <Form.Item
            name="role"
            label="Account Role"
            initialValue={activeMode === 'employee' ? 'manager' : 'customer'}
            rules={[{ required: true }]}
          >
            <Radio.Group buttonStyle="solid" className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {activeMode !== 'employee' && (
                <Radio.Button value="customer" className="text-center font-medium">
                  <ShoppingOutlined className="mr-1" /> Buyer
                </Radio.Button>
              )}
              {activeMode !== 'employee' && (
                <Radio.Button value="seller" className="text-center font-medium">
                  <ShopOutlined className="mr-1" /> Seller
                </Radio.Button>
              )}
              {activeMode !== 'client' && (
                <Radio.Button value="support" className="text-center font-medium">
                  <CustomerServiceOutlined className="mr-1" /> Support
                </Radio.Button>
              )}
              {activeMode !== 'client' && (
                <Radio.Button value="manager" className="text-center font-medium">
                  <AppstoreOutlined className="mr-1" /> Manager
                </Radio.Button>
              )}
              {activeMode === 'employee' && (
                <Radio.Button value="admin" className="text-center font-medium">
                  <SafetyCertificateOutlined className="mr-1" /> Admin
                </Radio.Button>
              )}
            </Radio.Group>
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: 'Please enter first name' }]}
            >
              <Input placeholder="e.g. Pasang" />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: 'Please enter last name' }]}
            >
              <Input placeholder="e.g. Lama" />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input placeholder="e.g. pasang.lama@store.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Initial Password"
            extra="Optional. Defaults to 'password123'"
          >
            <Input.Password placeholder="Default: password123" />
          </Form.Item>

          {/* Conditional Seller Fields */}
          {selectedRole === 'seller' && (
            <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl space-y-3 mb-4 animate-in fade-in duration-200">
              <div className="text-xs font-bold text-orange-950 uppercase tracking-wide flex items-center gap-1.5">
                <ShopOutlined /> Store & Merchant Details
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Form.Item
                  name="vendorName"
                  label="Vendor / Store Name"
                  rules={[{ required: selectedRole === 'seller', message: 'Enter store name' }]}
                  className="mb-2"
                >
                  <Input placeholder="e.g. Himalaya Herbal Emporium" />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label="Business Contact / Phone"
                  rules={[{ required: selectedRole === 'seller', message: 'Enter phone' }]}
                  className="mb-2"
                >
                  <Input placeholder="+977 9801234567" />
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Form.Item
                  name="businessLocation"
                  label="Business Location"
                  rules={[{ required: selectedRole === 'seller', message: 'Enter address' }]}
                  className="mb-2"
                >
                  <Input placeholder="Thamel, Kathmandu" />
                </Form.Item>

                <Form.Item
                  name="taxId"
                  label="PAN / Tax ID"
                  rules={[{ required: selectedRole === 'seller', message: 'Enter Tax ID' }]}
                  className="mb-2"
                >
                  <Input placeholder="PAN-601928472" />
                </Form.Item>
              </div>

              <Form.Item
                name="businessCategory"
                label="Primary Category"
                initialValue="Handicrafts & Woolens"
                className="mb-2"
              >
                <Select
                  options={[
                    { value: 'Handicrafts & Woolens', label: 'Handicrafts & Woolens' },
                    { value: 'Organic Teas & Herbs', label: 'Organic Teas & Herbs' },
                    { value: 'Apparel & Mountain Wear', label: 'Apparel & Mountain Wear' },
                    { value: 'Singing Bowls & Meditation', label: 'Singing Bowls & Meditation' },
                    { value: 'Jewelry & Gemstones', label: 'Jewelry & Gemstones' },
                  ]}
                />
              </Form.Item>
            </div>
          )}

          {/* Agreement Checkbox */}
          <Form.Item
            name="agreementAccepted"
            valuePropName="checked"
            initialValue={true}
            className="mb-0"
          >
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <Switch defaultChecked />
              <div className="text-xs text-slate-700 font-medium">
                Mark User / Marketplace Agreement as Signed & Verified by Administrator
              </div>
            </div>
          </Form.Item>
        </Form>
      </AppModal>

      {/* Customer / Vendor Profile Inspection Modal */}
      {viewingUser && (
        <AppModal
          open={Boolean(viewingUser)}
          title={
            viewingUser.role === 'seller' || viewingUser.vendorProfile ? (
              <span className="flex items-center gap-2">
                <ShopOutlined className="text-orange-500 text-base" />
                <span>
                  Artisan Vendor Profile: {viewingUser.vendorProfile?.vendorName || `${viewingUser.firstName}'s Store`}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserOutlined className="text-[#0284c7] text-base" />
                <span>Customer Profile: {viewingUser.firstName} {viewingUser.lastName}</span>
              </span>
            )
          }
          onCancel={() => setViewingUser(null)}
          onOk={() => setViewingUser(null)}
          okText="Close"
          width={640}
        >
          <div className="space-y-4 text-xs">
            {/* Header Identity Badge */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-orange-50/40 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  size={52}
                  style={{
                    backgroundColor: viewingUser.role === 'seller' ? '#ffedd5' : '#e0f2fe',
                    color: viewingUser.role === 'seller' ? '#ea580c' : '#0284c7',
                    fontWeight: 700,
                    fontSize: 20,
                  }}
                  icon={viewingUser.role === 'seller' ? <ShopOutlined /> : <UserOutlined />}
                >
                  {viewingUser.firstName?.[0]}
                </Avatar>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {viewingUser.firstName} {viewingUser.lastName}
                  </h4>
                  <p className="text-xs text-slate-500">{viewingUser.email}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Tag color={viewingUser.role === 'seller' ? 'orange' : 'blue'} className="m-0 font-bold uppercase text-[10px]">
                      {viewingUser.role}
                    </Tag>
                    {viewingUser.role === 'seller' && (
                      <Tag color="success" className="m-0 text-[10px] font-semibold">
                        Verified Artisan Storefront
                      </Tag>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1.5">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Account Status</div>
                <Tag color={viewingUser.isActive !== false ? 'success' : 'default'} className="m-0 font-bold text-xs">
                  {viewingUser.isActive !== false ? 'Active' : 'Deactivated'}
                </Tag>
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <Popconfirm
                    title={viewingUser.isActive !== false ? 'Deactivate this account?' : 'Activate this account?'}
                    description={
                      viewingUser.isActive !== false
                        ? 'User will be temporarily prevented from logging in.'
                        : 'User login access will be restored.'
                    }
                    onConfirm={() => handleToggleStatus(viewingUser)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <button
                      type="button"
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                        viewingUser.isActive !== false
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      <PoweroffOutlined className="text-[10px]" />
                      <span>{viewingUser.isActive !== false ? 'Deactivate' : 'Activate'}</span>
                    </button>
                  </Popconfirm>

                  <button
                    type="button"
                    onClick={() => openPasswordModal(viewingUser)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-sky-50 text-[#0096C7] hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <KeyOutlined className="text-[10px]" />
                    <span>Change Password</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Vendor Specific Details Section */}
            {(viewingUser.role === 'seller' || viewingUser.vendorProfile) && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <ShopOutlined className="text-orange-500" />
                    <span>Storefront Branding & Details</span>
                  </span>
                  <Tag color="orange" className="m-0 text-[10px] font-bold">
                    {viewingUser.vendorProfile?.businessCategory || 'Handicrafts & Woolens'}
                  </Tag>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Store / Brand Name</span>
                    <span className="text-xs font-bold text-slate-800">
                      {viewingUser.vendorProfile?.vendorName || `${viewingUser.firstName}'s Himalayan Artisan Goods`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Official Phone</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {viewingUser.vendorProfile?.phone || viewingUser.phone || '+977 980-1234567'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Workshop / Location</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {viewingUser.vendorProfile?.businessLocation || viewingUser.address || 'Kathmandu, Bagmati, Nepal'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Tax Identification (PAN / VAT)</span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {viewingUser.vendorProfile?.taxId || 'PAN-98214-NP'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">
                    Storefront Description & Artisan Heritage
                  </span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                    {viewingUser.vendorProfile?.description ||
                      'Master artisan workshop specializing in ethical hand-beaten singing bowls, pashmina wool shawls, and organic Himalayan teas direct from village co-ops.'}
                  </p>
                </div>

                {viewingUser.vendorProfile?.documentUrl && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                      <FileTextOutlined className="text-slate-400" />
                      <span>Artisan Certification Document</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Verified On File
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Performance & Legal Agreement Section */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Lifetime Commercial Volume</span>
                <div className="text-base font-black text-slate-900">
                  ${viewingUser.totalSpend?.toFixed(2) || '0.00'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {viewingUser.ordersCount || 0} {viewingUser.role === 'seller' ? 'orders fulfilled' : 'orders placed'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Platform Agreement</span>
                <div className="mt-1">
                  {viewingUser.agreementAccepted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircleOutlined /> Signed & Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Pending Agreement
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Compliance with fair trade & marketplace conduct
                </div>
              </div>
            </div>
          </div>
        </AppModal>
      )}

      {/* Password Change / Reset Modal */}
      {passwordTargetUser && (
        <AppModal
          open={Boolean(passwordTargetUser)}
          title={
            <span className="flex items-center gap-2">
              <KeyOutlined className="text-[#0096C7] text-base" />
              <span>
                Reset Password: {passwordTargetUser.firstName} {passwordTargetUser.lastName}
              </span>
            </span>
          }
          onCancel={() => {
            setPasswordTargetUser(null);
            passwordForm.resetFields();
          }}
          onOk={handlePasswordSubmit}
          confirmLoading={updatingPassword}
          okText="Update Password"
          width="max-w-md"
        >
          <div className="space-y-3 py-2 text-xs">
            <p className="text-slate-500 text-xs">
              Enter a new password for <strong className="text-slate-800">{passwordTargetUser.email}</strong>.
              Minimum 6 characters required.
            </p>

            <Form form={passwordForm} layout="vertical">
              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Please enter a new password' },
                  { min: 6, message: 'Password must be at least 6 characters' },
                ]}
                hasFeedback
              >
                <Input.Password
                  placeholder="Enter new password (min. 6 chars)"
                  prefix={<LockOutlined className="text-slate-400 mr-1" />}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={['newPassword']}
                hasFeedback
                rules={[
                  { required: true, message: 'Please confirm the new password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="Confirm new password"
                  prefix={<LockOutlined className="text-slate-400 mr-1" />}
                />
              </Form.Item>
            </Form>
          </div>
        </AppModal>
      )}
    </div>
  );
};

export const EmployeeManagement: React.FC = () => <CustomerManagement mode="employee" />;
export const ClientManagement: React.FC = () => <CustomerManagement mode="client" />;

export default CustomerManagement;
